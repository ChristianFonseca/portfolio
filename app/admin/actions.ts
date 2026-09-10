"use server"

import { revalidateTag } from "next/cache"
import { z } from "zod"
import { sql } from "@/lib/db"
import { hashPassword, requireAdmin, requireAdminRole, type UserRole } from "@/lib/auth"
import { kindSchemas, localizedSchema, type SectionKind } from "@/lib/content/schemas"
import { getSetting, setSetting } from "@/lib/settings"
import {
  SETTING_CATALOG,
  SETTING_FALLBACK,
  SETTING_INCIDENT,
  getGeminiCatalog,
  listGeminiModels,
  modelStatus,
  probeGeminiModel,
  type GeminiCatalog,
  type GeminiIncident,
} from "@/lib/gemini"
import { buildKnowledgeBase, type KnowledgeBase } from "@/lib/chat/knowledge"

export type ActionResult = { ok: true } | { ok: false; error: string }

export interface SaveSectionPayload {
  en: unknown
  es: unknown
  title: string
  title_es: string
}

export async function saveSection(slug: string, payload: SaveSectionPayload): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    const rows = await sql<{ id: number; kind: SectionKind; data: unknown }[]>`
      select id, kind, data from sections where slug = ${slug}
    `
    const section = rows[0]
    if (!section) return { ok: false, error: "Sección no encontrada" }

    if (!kindSchemas[section.kind]) return { ok: false, error: `Tipo de sección desconocido: ${section.kind}` }
    const parsed = localizedSchema(section.kind).safeParse({ en: payload.en, es: payload.es })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { ok: false, error: `Datos inválidos: ${issue.path.join(".")} — ${issue.message}` }
    }
    const title = z.string().trim().min(1).max(120).safeParse(payload.title)
    const titleEs = z.string().trim().min(1).max(120).safeParse(payload.title_es)
    if (!title.success || !titleEs.success) {
      return { ok: false, error: "Los títulos EN y ES son obligatorios (máx. 120 caracteres)" }
    }

    await sql.begin(async (tx) => {
      await tx`insert into section_revisions (section_id, data, saved_by) values (${section.id}, ${tx.json(section.data as never)}, ${admin.email})`
      await tx`
        update sections
        set data = ${tx.json(parsed.data as never)}, title = ${title.data}, title_es = ${titleEs.data}, updated_at = now()
        where id = ${section.id}
      `
    })

    revalidateTag("content")
    return { ok: true }
  } catch (error) {
    console.error("saveSection:", error)
    return { ok: false, error: "Error al guardar. Revisa la conexión a la base de datos." }
  }
}

const chatConfigSchema = z.object({
  dailyLimit: z.number().int().min(1).max(1000),
  allowlist: z
    .array(
      z
        .string()
        .trim()
        .min(3)
        .max(45)
        .regex(/^[0-9a-fA-F:.]+$/, "IP inválida"),
    )
    .max(100),
  extraContext: z.string().max(8000),
})

// ---------- Blog ----------

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido: solo minúsculas, números y guiones")

const postFieldsSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().max(200),
  title_es: z.string().trim().max(200),
  excerpt: z.string().trim().max(500),
  excerpt_es: z.string().trim().max(500),
  body: z.string().max(50000),
  body_es: z.string().max(50000),
  cover_image: z.string().trim().max(300),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
})

export type PostFields = z.infer<typeof postFieldsSchema>

export async function createPost(input: { title: string; slug: string }): Promise<
  { ok: true; id: number } | { ok: false; error: string }
> {
  try {
    await requireAdmin()
    const title = z.string().trim().min(1).max(200).safeParse(input.title)
    const slug = slugSchema.safeParse(input.slug)
    if (!title.success) return { ok: false, error: "El título es obligatorio" }
    if (!slug.success) return { ok: false, error: slug.error.issues[0].message }

    const rows = await sql<{ id: number }[]>`
      insert into posts (slug, title) values (${slug.data}, ${title.data})
      on conflict (slug) do nothing
      returning id
    `
    if (!rows.length) return { ok: false, error: "Ya existe un artículo con ese slug" }
    return { ok: true, id: rows[0].id }
  } catch (error) {
    console.error("createPost:", error)
    return { ok: false, error: "Error al crear el artículo" }
  }
}

export async function savePost(id: number, fields: PostFields): Promise<ActionResult> {
  try {
    await requireAdmin()
    const parsed = postFieldsSchema.safeParse(fields)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return { ok: false, error: `${issue.path.join(".")}: ${issue.message}` }
    }
    const f = parsed.data
    const rows = await sql`
      update posts set
        slug = ${f.slug}, title = ${f.title}, title_es = ${f.title_es},
        excerpt = ${f.excerpt}, excerpt_es = ${f.excerpt_es},
        body = ${f.body}, body_es = ${f.body_es},
        cover_image = ${f.cover_image}, tags = ${sql.json(f.tags)},
        updated_at = now()
      where id = ${id} returning id
    `
    if (!rows.length) return { ok: false, error: "Artículo no encontrado" }
    revalidateTag("posts")
    return { ok: true }
  } catch (error) {
    console.error("savePost:", error)
    return { ok: false, error: "Error al guardar el artículo (¿slug duplicado?)" }
  }
}

export async function togglePublishPost(id: number): Promise<ActionResult> {
  try {
    await requireAdmin()
    const rows = await sql<{ published: boolean; title: string; title_es: string; body: string; body_es: string }[]>`
      select published, title, title_es, body, body_es from posts where id = ${id}
    `
    const post = rows[0]
    if (!post) return { ok: false, error: "Artículo no encontrado" }

    if (!post.published) {
      // Publicar exige ambos idiomas completos (título y cuerpo EN + ES)
      if (!post.title.trim() || !post.body.trim() || !post.title_es.trim() || !post.body_es.trim()) {
        return {
          ok: false,
          error: "Para publicar se necesitan título y contenido en AMBOS idiomas (usa Traducir con IA o complétalos a mano).",
        }
      }
      await sql`update posts set published = true, published_at = coalesce(published_at, now()), updated_at = now() where id = ${id}`
    } else {
      await sql`update posts set published = false, updated_at = now() where id = ${id}`
    }
    revalidateTag("posts")
    return { ok: true }
  } catch (error) {
    console.error("togglePublishPost:", error)
    return { ok: false, error: "Error al cambiar el estado de publicación" }
  }
}

export async function deletePost(id: number): Promise<ActionResult> {
  try {
    await requireAdmin()
    await sql`delete from posts where id = ${id}`
    revalidateTag("posts")
    return { ok: true }
  } catch (error) {
    console.error("deletePost:", error)
    return { ok: false, error: "Error al eliminar el artículo" }
  }
}

export async function setChatConfig(input: {
  dailyLimit: number
  allowlist: string[]
  extraContext: string
}): Promise<ActionResult> {
  try {
    await requireAdminRole()
    const parsed = chatConfigSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
    await setSetting("chat_daily_limit", parsed.data.dailyLimit)
    await setSetting("chat_ip_allowlist", parsed.data.allowlist)
    await setSetting("chat_extra_context", parsed.data.extraContext)
    // El contexto extra alimenta la knowledge base del chat (cache tag "content")
    revalidateTag("content")
    return { ok: true }
  } catch (error) {
    console.error("setChatConfig:", error)
    return { ok: false, error: "Error al guardar la configuración del chat" }
  }
}

// ---------- Gemini: modelos ----------

const modelIdSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9.-]+$/i, "Identificador de modelo inválido")
  .max(80)

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" })

// Un modelo solo se acepta si está en el catálogo descargado y no está deprecado.
// Sin catálogo (aún no se actualizó) solo se bloquean las familias retiradas conocidas.
async function validateModelChoice(model: string): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = modelIdSchema.safeParse(model)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const catalog = await getGeminiCatalog()
  const status = modelStatus(parsed.data, catalog)
  if (status === "deprecated") {
    return { ok: false, error: `"${parsed.data}" está deprecado o retirado por Google. Elige otro modelo.` }
  }
  if (status === "missing" && catalog) {
    return {
      ok: false,
      error: `"${parsed.data}" no aparece en el catálogo de modelos disponibles (actualizado ${fmtDate(catalog.fetchedAt)}). Actualiza el catálogo o elige uno de la lista.`,
    }
  }
  return { ok: true, id: parsed.data }
}

export async function setGeminiModel(model: string): Promise<ActionResult> {
  try {
    await requireAdminRole()
    const valid = await validateModelChoice(model)
    if (!valid.ok) return valid
    const previous = await getSetting<string>("gemini_model", "")
    await setSetting("gemini_model", valid.id)
    // Cambiar de modelo cierra el incidente del modelo anterior.
    if (previous !== valid.id) await setSetting(SETTING_INCIDENT, null)
    return { ok: true }
  } catch (error) {
    console.error("setGeminiModel:", error)
    return { ok: false, error: "Error al guardar la configuración" }
  }
}

export async function setGeminiFallbackModel(model: string): Promise<ActionResult> {
  try {
    await requireAdminRole()
    const valid = await validateModelChoice(model)
    if (!valid.ok) return valid
    await setSetting(SETTING_FALLBACK, valid.id)
    return { ok: true }
  } catch (error) {
    console.error("setGeminiFallbackModel:", error)
    return { ok: false, error: "Error al guardar el modelo de respaldo" }
  }
}

export async function refreshGeminiModels(): Promise<
  { ok: true; catalog: GeminiCatalog; available: number; deprecated: number } | { ok: false; error: string }
> {
  try {
    await requireAdminRole()
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { ok: false, error: "GEMINI_API_KEY no está configurada en el servidor." }
    const models = await listGeminiModels(apiKey)
    if (!models.length) return { ok: false, error: "La API no devolvió modelos Gemini de texto. Revisa la API key." }
    const catalog: GeminiCatalog = { fetchedAt: new Date().toISOString(), models }
    await setSetting(SETTING_CATALOG, catalog)
    const deprecated = models.filter((m) => m.deprecated).length
    return { ok: true, catalog, available: models.length - deprecated, deprecated }
  } catch (error) {
    console.error("refreshGeminiModels:", error)
    return { ok: false, error: error instanceof Error ? error.message : "Error al consultar los modelos" }
  }
}

export async function testGeminiModel(
  model: string,
): Promise<{ ok: true; ms: number; tokens: number } | { ok: false; error: string }> {
  try {
    await requireAdminRole()
    const parsed = modelIdSchema.safeParse(model)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return { ok: false, error: "GEMINI_API_KEY no está configurada en el servidor." }
    const result = await probeGeminiModel(apiKey, parsed.data)
    if (!result.ok) return { ok: false, error: `HTTP ${result.status}: ${result.error}` }
    return { ok: true, ms: result.ms, tokens: result.tokens }
  } catch (error) {
    console.error("testGeminiModel:", error)
    return { ok: false, error: "Error al probar el modelo" }
  }
}

export async function dismissGeminiIncident(): Promise<ActionResult> {
  try {
    await requireAdminRole()
    await setSetting(SETTING_INCIDENT, null satisfies GeminiIncident | null)
    return { ok: true }
  } catch (error) {
    console.error("dismissGeminiIncident:", error)
    return { ok: false, error: "Error al descartar el aviso" }
  }
}

// ---------- Chat: base de conocimiento ----------

export async function rebuildKnowledgeBase(): Promise<{ ok: true; kb: KnowledgeBase } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    // Invalida la copia cacheada (la usa /api/chat) y construye una fresca para mostrar.
    revalidateTag("content")
    revalidateTag("posts")
    const kb = await buildKnowledgeBase()
    return { ok: true, kb }
  } catch (error) {
    console.error("rebuildKnowledgeBase:", error)
    return { ok: false, error: "Error al reconstruir la base de conocimiento" }
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
  role: z.enum(["admin", "editor"]),
})

async function countAdmins(): Promise<number> {
  const rows = await sql<{ n: string }[]>`select count(*) as n from users where role = 'admin'`
  return Number(rows[0]?.n ?? 0)
}

export async function createUser(input: {
  email: string
  name: string
  password: string
  role: UserRole
}): Promise<ActionResult> {
  try {
    await requireAdminRole()
    const parsed = newUserSchema.safeParse(input)
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

    const inserted = await sql`
      insert into users (email, name, password_hash, role)
      values (${parsed.data.email}, ${parsed.data.name}, ${hashPassword(parsed.data.password)}, ${parsed.data.role})
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
    const admin = await requireAdminRole()
    if (id === admin.id) return { ok: false, error: "No puedes eliminar tu propia cuenta" }
    const target = await sql<{ role: UserRole }[]>`select role from users where id = ${id}`
    if (!target.length) return { ok: false, error: "Usuario no encontrado" }
    if (target[0].role === "admin" && (await countAdmins()) <= 1) {
      return { ok: false, error: "No se puede eliminar al último administrador" }
    }
    await sql`delete from users where id = ${id}`
    return { ok: true }
  } catch (error) {
    console.error("deleteUser:", error)
    return { ok: false, error: "Error al eliminar el usuario" }
  }
}

export async function setUserRole(id: number, role: UserRole): Promise<ActionResult> {
  try {
    const admin = await requireAdminRole()
    if (!["admin", "editor"].includes(role)) return { ok: false, error: "Rol inválido" }
    if (id === admin.id) return { ok: false, error: "No puedes cambiar tu propio rol" }
    const target = await sql<{ role: UserRole }[]>`select role from users where id = ${id}`
    if (!target.length) return { ok: false, error: "Usuario no encontrado" }
    if (target[0].role === "admin" && role !== "admin" && (await countAdmins()) <= 1) {
      return { ok: false, error: "No se puede degradar al último administrador" }
    }
    await sql`update users set role = ${role} where id = ${id}`
    return { ok: true }
  } catch (error) {
    console.error("setUserRole:", error)
    return { ok: false, error: "Error al cambiar el rol" }
  }
}

export async function resetUserPassword(id: number, password: string): Promise<ActionResult> {
  try {
    await requireAdminRole()
    if (password.length < 10) return { ok: false, error: "La contraseña debe tener al menos 10 caracteres" }
    const rows = await sql`update users set password_hash = ${hashPassword(password)} where id = ${id} returning id`
    if (!rows.length) return { ok: false, error: "Usuario no encontrado" }
    return { ok: true }
  } catch (error) {
    console.error("resetUserPassword:", error)
    return { ok: false, error: "Error al cambiar la contraseña" }
  }
}
