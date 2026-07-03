import { NextResponse } from "next/server"
import { z } from "zod"
import { sql } from "@/lib/db"
import { createSession, verifyPassword } from "@/lib/auth"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(200),
})

// Rate limit de login: 5 intentos por IP cada 15 minutos
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const attemptsByIp = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (attemptsByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_ATTEMPTS) {
    attemptsByIp.set(ip, recent)
    return true
  }
  recent.push(now)
  attemptsByIp.set(ip, recent)
  return false
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    }
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 })
    }

    const rows = await sql<{ id: number; email: string; name: string; role: "admin" | "editor"; password_hash: string }[]>`
      select id, email, name, role, password_hash from users where email = ${parsed.data.email}
    `
    const user = rows[0]
    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 })
    }

    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("login:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
