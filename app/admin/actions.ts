"use server"

import { revalidateTag } from "next/cache"
import { z } from "zod"
import { sql } from "@/lib/db"
import { hashPassword, requireAdmin } from "@/lib/auth"
import { kindSchemas, type SectionKind } from "@/lib/content/schemas"

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function saveSection(slug: string, data: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const rows = await sql<{ id: number; kind: SectionKind; data: unknown }[]>`
      select id, kind, data from sections where slug = ${slug}
    `
    const section = rows[0]
    if (!section) return { ok: false, error: "Sección no encontrada" }

    const schema = kindSchemas[section.kind]
    if (!schema) return { ok: false, error: `Tipo de sección desconocido: ${section.kind}` }
    const parsed = schema.safeParse(data)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { ok: false, error: `Datos inválidos: ${issue.path.join(".")} — ${issue.message}` }
    }

    await sql.begin(async (tx) => {
      await tx`insert into section_revisions (section_id, data, saved_by) values (${section.id}, ${tx.json(section.data as never)}, ${admin.email})`
      await tx`update sections set data = ${tx.json(parsed.data as never)}, updated_at = now() where id = ${section.id}`
    })

    revalidateTag("content")
    return { ok: true }
  } catch (error) {
    console.error("saveSection:", error)
    return { ok: false, error: "Error al guardar. Revisa la conexión a la base de datos." }
  }
}

export async function toggleVisible(slug: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    const rows = await sql`update sections set visible = not visible, updated_at = now() where slug = ${slug} returning slug`
    if (!rows.length) return { ok: false, error: "Sección no encontrada" }
    revalidateTag("content")
    return { ok: true }
  } catch (error) {
    console.error("toggleVisible:", error)
    return { ok: false, error: "Error al cambiar visibilidad" }
  }
}

export async function moveSection(slug: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    await requireAdmin()
    const sections = await sql<{ id: number; slug: string; position: number }[]>`
      select id, slug, position from sections order by position
    `
    const index = sections.findIndex((s) => s.slug === slug)
    if (index < 0) return { ok: false, error: "Sección no encontrada" }
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= sections.length) return { ok: true }

    const a = sections[index]
    const b = sections[swapWith]
    await sql.begin(async (tx) => {
      await tx`update sections set position = ${b.position} where id = ${a.id}`
      await tx`update sections set position = ${a.position} where id = ${b.id}`
    })
    revalidateTag("content")
    return { ok: true }
  } catch (error) {
    console.error("moveSection:", error)
    return { ok: false, error: "Error al reordenar" }
  }
}

const newUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  name: z.string().trim().max(120),
  password: z.string().min(10, "La contraseña debe tener al menos 10 caracteres").max(200),
})

export async function createUser(input: { email: string; name: string; password: string }): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsed = newUserSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

    const inserted = await sql`
      insert into users (email, name, password_hash)
      values (${parsed.data.email}, ${parsed.data.name}, ${hashPassword(parsed.data.password)})
      on conflict (email) do nothing
      returning id
    `
    if (!inserted.length) return { ok: false, error: "Ya existe un usuario con ese email" }
    return { ok: true }
  } catch (error) {
    console.error("createUser:", error)
    return { ok: false, error: "Error al crear el usuario" }
  }
}

export async function deleteUser(id: number): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (id === admin.id) return { ok: false, error: "No puedes eliminar tu propia cuenta" }
    const count = await sql<{ n: string }[]>`select count(*) as n from users`
    if (Number(count[0].n) <= 1) return { ok: false, error: "No se puede eliminar el último usuario" }
    await sql`delete from users where id = ${id}`
    return { ok: true }
  } catch (error) {
    console.error("deleteUser:", error)
    return { ok: false, error: "Error al eliminar el usuario" }
  }
}

export async function resetUserPassword(id: number, password: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (password.length < 10) return { ok: false, error: "La contraseña debe tener al menos 10 caracteres" }
    const rows = await sql`update users set password_hash = ${hashPassword(password)} where id = ${id} returning id`
    if (!rows.length) return { ok: false, error: "Usuario no encontrado" }
    return { ok: true }
  } catch (error) {
    console.error("resetUserPassword:", error)
    return { ok: false, error: "Error al cambiar la contraseña" }
  }
}
