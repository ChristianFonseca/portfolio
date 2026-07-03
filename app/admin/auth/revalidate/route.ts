import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { getSessionUser } from "@/lib/auth"

// Fuerza el refresco del contenido de la landing (mismo mecanismo que usa
// guardar una sección). Requiere sesión de admin.
export async function POST() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  revalidateTag("content")
  return NextResponse.json({ ok: true })
}
