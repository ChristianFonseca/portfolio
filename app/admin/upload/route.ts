import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import sharp from "sharp"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// En el VPS apunta al volumen (/data/uploads); en dev local cae en public/uploads,
// que Next sirve automáticamente.
const uploadsDir = () => process.env.UPLOADS_DIR || path.join(process.cwd(), "public", "uploads")

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const MAX_DIMENSION = 1600

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "La imagen supera los 10 MB" }, { status: 413 })
    }

    const input = Buffer.from(await file.arrayBuffer())

    // sharp valida que sea una imagen real (no confiamos en el MIME del cliente)
    let output: Buffer
    let width: number | undefined
    let height: number | undefined
    try {
      const processed = await sharp(input)
        .rotate() // respeta la orientación EXIF
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true })
      output = processed.data
      width = processed.info.width
      height = processed.info.height
    } catch {
      return NextResponse.json({ error: "El archivo no es una imagen válida" }, { status: 400 })
    }

    // Nombre por hash de contenido: mismo archivo => mismo nombre (cache-friendly)
    const filename = `${createHash("sha256").update(output).digest("hex").slice(0, 16)}.webp`
    const dir = uploadsDir()
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), output)

    await sql`
      insert into assets (filename, original_name, mime, width, height, size_bytes)
      values (${filename}, ${file.name}, 'image/webp', ${width ?? null}, ${height ?? null}, ${output.length})
      on conflict (filename) do nothing
    `

    return NextResponse.json({ ok: true, url: `/uploads/${filename}`, width, height })
  } catch (error) {
    console.error("upload:", error)
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 })
  }
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const assets = await sql<{ filename: string; original_name: string; width: number | null; height: number | null }[]>`
      select filename, original_name, width, height from assets order by created_at desc limit 100
    `
    return NextResponse.json({
      assets: assets.map((a) => ({ ...a, url: `/uploads/${a.filename}` })),
    })
  } catch (error) {
    console.error("upload list:", error)
    return NextResponse.json({ error: "Error al listar imágenes" }, { status: 500 })
  }
}
