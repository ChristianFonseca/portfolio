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

export interface KnowledgeSource {
  name: string
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

function formatExperience(title: string, data: ExperienceData): string {
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

// Construcción SIN cache (para el botón "Actualizar" del admin y la vista previa).
export async function buildKnowledgeBase(): Promise<KnowledgeBase> {
  const [content, extra, posts] = await Promise.all([
    getContent("en"),
    getSetting<string>("chat_extra_context", ""),
    loadPosts(),
  ])

  const sources: KnowledgeSource[] = []
  const parts: string[] = []
  const add = (name: string, items: number, body: string, heading?: string) => {
    if (!body.trim()) return
    const block = heading ? `## ${heading}\n${body}` : body
    parts.push(block)
    sources.push({ name, items, chars: block.length })
  }

  // Identidad: siempre (el hero define nombre/tagline aunque esté oculto en la landing).
  const hero = content.hero.data
  add(
    "Perfil",
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

  if (content.about.visible) add("About", 1, content.about.data.text, "About")

  if (content.skills.visible) {
    const groups = content.skills.data.groups
      .map((g) => `- ${g.name}: ${g.badges.map((b) => (typeof b === "string" ? b : b.name)).join(", ")}`)
      .join("\n")
    add("Skills", content.skills.data.groups.length, groups, "Skills")
    const langs = content.skills.data.languages ?? []
    if (langs.length) add("Languages", langs.length, langs.map((l) => `${l.name}: ${l.level}`).join("; "), "Languages")
  }

  if (content.experience.visible)
    add("Experience", content.experience.data.items.length, formatExperience(content.experience.title, content.experience.data), content.experience.title)
  if (content.teaching.visible)
    add("Teaching", content.teaching.data.items.length, formatExperience(content.teaching.title, content.teaching.data), content.teaching.title)

  if (content.publicProjects.visible) {
    const items = content.publicProjects.data.items
    add(
      "Public Projects",
      items.length,
      items
        .map((p) => {
          const links = [p.repoUrl ? `repo: ${p.repoUrl}` : "", p.liveUrl ? `live: ${p.liveUrl}` : ""].filter(Boolean).join(", ")
          return `- ${p.title}: ${p.description} ${p.bullets.join(" ")} (Tech: ${p.tech.join(", ")})${links ? ` [${links}]` : ""}`
        })
        .join("\n"),
      content.publicProjects.title,
    )
  }

  if (content.researchProjects.visible) {
    const items = content.researchProjects.data.items
    add(
      "Research Projects",
      items.length,
      items
        .map((p) => {
          const where = [p.institution, p.department].filter(Boolean).join(" — ")
          const when = p.startDate ? ` (${p.startDate}${p.endDate ? ` to ${p.endDate}` : ", present"})` : ""
          const papers = p.papers?.length ? ` Papers: ${p.papers.map((x) => x.name).join("; ")}.` : ""
          return `- ${p.title}${where ? ` at ${where}` : ""}${when}: ${p.description} ${p.bullets.join(" ")}${papers} (Tech: ${p.tech.join(", ")})`
        })
        .join("\n"),
      content.researchProjects.title,
    )
  }

  if (content.faq.visible) {
    const items = content.faq.data.items
    add("FAQ", items.length, items.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n"), "Frequently asked questions")
  }

  if (posts.length) {
    add(
      "Blog",
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
  }

  if (extra.trim()) add("Contexto extra", 1, extra.trim(), "Additional information")

  const text = parts.join("\n\n")
  return {
    text,
    builtAt: new Date().toISOString(),
    chars: text.length,
    approxTokens: Math.round(text.length / 4),
    sources,
  }
}

export const getKnowledgeBase = unstable_cache(buildKnowledgeBase, ["chat-knowledge-base-v2"], {
  tags: ["content", "posts"],
})
