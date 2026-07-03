import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { sql } from "./db"

export const SESSION_COOKIE = "admin_session"
const SESSION_DAYS = 7

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is not set")
  return new TextEncoder().encode(secret)
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export interface AdminUser {
  id: number
  email: string
  name: string
}

export async function createSession(user: AdminUser) {
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey())

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  })
}

export async function destroySession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

// Verifica el JWT y que el usuario siga existiendo (borrar un usuario revoca su acceso)
export async function getSessionUser(): Promise<AdminUser | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    const id = Number(payload.sub)
    if (!Number.isInteger(id)) return null
    const rows = await sql<AdminUser[]>`select id, email, name from users where id = ${id}`
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("No autorizado")
  return user
}
