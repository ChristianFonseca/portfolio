import { NextResponse } from "next/server"
import { z } from "zod"
import { sql } from "@/lib/db"
import { createSession, verifyPassword } from "@/lib/auth"
import { createRateLimiter } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/request-ip"
import { logAudit } from "@/lib/activity"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(200),
})

// Rate limit de login: 5 intentos por IP cada 15 minutos
const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 })

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers)
    if (!limiter.check(ip)) {
      void logAudit({ actor: null, action: "login.limited", ok: false, headers: request.headers })
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
      void logAudit({ actor: null, action: "login.fail", ok: false, detail: { reason: "invalid" }, headers: request.headers })
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 })
    }

    const rows = await sql<{ id: number; email: string; name: string; role: "admin" | "editor"; password_hash: string }[]>`
      select id, email, name, role, password_hash from users where email = ${parsed.data.email}
    `
    const user = rows[0]
    if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
      // Se registra el email intentado para detectar ataques dirigidos; no se guarda la contraseña.
      void logAudit({
        actor: parsed.data.email,
        action: "login.fail",
        ok: false,
        detail: { reason: user ? "bad_password" : "unknown_user" },
        headers: request.headers,
      })
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 })
    }

    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role })
    void logAudit({ actor: user.email, action: "login.ok", detail: { role: user.role }, headers: request.headers })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("login:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
