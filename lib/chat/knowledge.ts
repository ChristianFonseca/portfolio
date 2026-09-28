import { unstable_cache } from "next/cache"
import { sql } from "@/lib/db"
import { getContent } from "@/lib/content/queries"
import { getSetting } from "@/lib/settings"
import type { ExperienceData } from "@/lib/content/schemas"

// Base de conocimiento del chat: se construye EN VIVO desde la DB (las mismas
// secciones que edita el admin) + FAQ + artículos publicados del blog + un bloque
// extra editable en Configuración. No es RAG: el texto completo (~10-15K tokens)
// va en el system prompt de cada mensaje. Comparte los tags "content" y "posts",
// así que guardar en el admin (secciones o posts) la actualiza sola.
// Cada fuente se puede activar/desactivar desde el admin (settings.kb_disabled_sources).

export const KB_SOURCES = [
  { key: "profile", name: "Perfil (nombre, tagline, ubicación, certificaciones)", locked: true },
  { key: "about", name: "About", locked: false },
  { key: "skills", name: "Skills", locked: false },
  { key: "languages", name: "Idiomas", locked: false },
  { key: "experience", name: "Experiencia", locked: false },
  { key: "teaching", name: "Docencia", locked: false },
  { key: "projects", name: "Proyectos públicos", locked: false },
  { key: "research", name: "Proyectos de investigación", locked: false },
  { key: "faq", name: "FAQ", locked: false },
  { key: "blog", name: "Blog (artículos publicados, recortados a 2.500 chars)", locked: false },
  { key: "extra", name: "Contexto extra (Configuración → Chat)", locked: false },
] as const

export type KbSourceKey = (typeof KB_SOURCES)[number]["key"]
export const SETTING_KB_DISABLED = "kb_disabled_sources"

export interface KnowledgeSource {
  key: KbSourceKey
  name: string
  locked: boolean
  /** Incluida en el texto (activada y con contenido). */
  enabled: boolean
  /** Hay contenido disponible (sección visible y no vacía). */
  available: boolean
  items: number
  chars: number
}

export interface KnowledgeBase {
  text: string
  builtAt: string
  chars: number
  approxTokens: number
  sources: KnowledgeSource[]
}

const POST_BODY_MAX = 2500
const POSTS_MAX = 30

function formatExperience(data: ExperienceData): string {
  return data.items
    .map(
      (i) =>
        `- ${i.role} at ${i.org} (${i.period}${i.current ? ", current" : ""}). ` +
        `${i.bullets.join(" ")} Tech: ${i.tech.join(", ")}.`,
    )
    .join("\n")
}

// Markdown → texto plano compacto para el prompt: fuera código/diagramas, imágenes,
// comentarios HTML y sintaxis de encabezados/énfasis; colapsa espacios.
function plainMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

interface PostRow {
  slug: string
  title: string
  excerpt: string
  body: string
  tags: string[]
  published_at: string | null
}

async function loadPosts(): Promise<PostRow[]> {
  try {
    return await sql<PostRow[]>`
      select slug, title, excerpt, body, tags, published_at::text
      from posts where published order by published_at desc limit ${POSTS_MAX}
    `
  } catch (error) {
    console.error("knowledge posts:", error)
    return []
  }
}

export async function getDisabledSources(): Promise<KbSourceKey[]> {
  const raw = await getSetting<string[]>(SETTING_KB_DISABLED, [])
  const valid = new Set<string>(KB_SOURCES.filter((s) => !s.locked).map((s) => s.key))
  return (Array.isArray(raw) ? raw : []).filter((k): k is KbSourceKey => valid.has(k))
}

// Construcción SIN cache (para el botón "Actualizar" del admin y la vista previa).
export async function buildKnowledgeBase(): Promise<KnowledgeBase> {
  const [content, extra, posts, disabled] = await Promise.all([
    getContent("en"),
    getSetting<string>("chat_extra_context", ""),
    loadPosts(),
    getDisabledSources(),
  ])
  const off = new Set<string>(disabled)

  const parts: string[] = []
  const sources: KnowledgeSource[] = []

  // Registra una fuente: si está desactivada o no hay contenido, no entra al texto
  // pero sí aparece en la lista (para el checkbox del admin).
  const add = (key: KbSourceKey, items: number, body: string, heading?: string) => {
    const def = KB_SOURCES.find((s) => s.key === key)!
    const available = body.trim().length > 0
    const enabled = available && !off.has(key)
    let chars = 0
    if (enabled) {
      const block = heading ? `## ${heading}\n${body}` : body
      parts.push(block)
      chars = block.length
    }
    sources.push({ key, name: def.name, locked: def.locked, enabled, available, items: available ? items : 0, chars })
  }

  // Identidad: siempre (el hero define nombre/tagline aunque esté oculto en la landing).
  const hero = content.hero.data
  add(
    "profile",
    1,
    [
      `# ${hero.name} — ${hero.tagline}`,
      hero.location ? `Location: ${hero.location}.` : "",
      hero.certs.length
        ? `Certifications summary: ${hero.certs.map((c) => `${c.count ? c.count + " " : ""}${c.label}`).join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  )

  add("about", 1, content.about.visible ? content.about.data.text : "", "About")

  const groups = content.skills.visible ? content.skills.data.groups : []
  add(
    "skills",
    groups.length,
    groups.map((g) => `- ${g.name}: ${g.badges.map((b) => (typeof b === "string" ? b : b.name)).join(", ")}`).join("\n"),
    "Skills",
  )
  const langs = content.skills.visible ? (content.skills.data.languages ?? []) : []
  add("languages", langs.length, langs.map((l) => `${l.name}: ${l.level}`).join("; "), "Languages")

  add(
    "experience",
    content.experience.data.items.length,
    content.experience.visible ? formatExperience(content.experience.data) : "",
    content.experience.title,
  )
  add(
    "teaching",
    content.teaching.data.items.length,
    content.teaching.visible ? formatExperience(content.teaching.data) : "",
    content.teaching.title,
  )

  // Un bloque con título por proyecto, no una línea. Con cada proyecto en una sola línea
  // de 1.000+ caracteres el modelo mezclaba entradas vecinas: "¿Qué es Atalaya?" salía
  // descrito como CrabAir (ver video/tools/test/kb-confusion.mjs).
  const projects = content.publicProjects.visible ? content.publicProjects.data.items : []
  add(
    "projects",
    projects.length,
    projects
      .map((p) => {
        const links = [p.repoUrl ? `repo: ${p.repoUrl}` : "", p.liveUrl ? `live: ${p.liveUrl}` : ""].filter(Boolean).join(", ")
        return [
          `### ${p.title}`,
          p.description,
          p.bullets.length ? `Highlights: ${p.bullets.join(" ")}` : "",
          `Tech: ${p.tech.join(", ")}`,
          links ? `Links: ${links}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      })
      .join("\n\n"),
    content.publicProjects.title,
  )

  const research = content.researchProjects.visible ? content.researchProjects.data.items : []
  add(
    "research",
    research.length,
    research
      .map((p) => {
        const where = [p.institution, p.department].filter(Boolean).join(" — ")
        const when = p.startDate ? ` (${p.startDate}${p.endDate ? ` to ${p.endDate}` : ", present"})` : ""
        const papers = p.papers?.length ? ` Papers: ${p.papers.map((x) => x.name).join("; ")}.` : ""
        return [
          `### ${p.title}${where ? ` at ${where}` : ""}${when}`,
          p.description,
          p.bullets.length ? `Highlights: ${p.bullets.join(" ")}` : "",
          papers.trim(),
          `Tech: ${p.tech.join(", ")}`,
        ]
          .filter(Boolean)
          .join("\n")
      })
      .join("\n\n"),
    content.researchProjects.title,
  )

  const faq = content.faq.visible ? content.faq.data.items : []
  add("faq", faq.length, faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n"), "Frequently asked questions")

  add(
    "blog",
    posts.length,
    posts
      .map((p) => {
        const body = plainMarkdown(p.body).slice(0, POST_BODY_MAX)
        const date = p.published_at ? p.published_at.slice(0, 10) : ""
        return `### ${p.title}${date ? ` (${date})` : ""} — christianfonseca.dev/blog/${p.slug}\n${p.excerpt}\n${body}${p.tags.length ? `\nTags: ${p.tags.join(", ")}` : ""}`
      })
      .join("\n\n"),
    "Blog articles written by Christian",
  )

  add("extra", extra.trim() ? 1 : 0, extra.trim(), "Additional information")

  const text = parts.join("\n\n")
  return {
    text,
    builtAt: new Date().toISOString(),
    chars: text.length,
    approxTokens: Math.round(text.length / 4),
    sources,
  }
}

export const getKnowledgeBase = unstable_cache(buildKnowledgeBase, ["chat-knowledge-base-v4"], {
  tags: ["content", "posts"],
})
