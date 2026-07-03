import { unstable_cache } from "next/cache"
import { marked, Renderer } from "marked"
import { sql } from "@/lib/db"
import type { Locale } from "@/lib/i18n/dictionaries"

export interface PostRow {
  id: number
  slug: string
  title: string
  title_es: string
  excerpt: string
  excerpt_es: string
  body: string
  body_es: string
  cover_image: string
  tags: string[]
  published: boolean
  published_at: string | null
  updated_at: string
}

export interface PublicPost {
  slug: string
  title: string
  excerpt: string
  body: string
  cover_image: string
  tags: string[]
  published_at: string | null
  updated_at: string
}

// Render de markdown con el HTML embebido escapado: el contenido lo escriben
// usuarios del admin (semi-confiables) — defensa en profundidad contra XSS.
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const renderer = new Renderer()
renderer.html = ({ text }) => escapeHtml(text)

export function renderMarkdown(md: string): string {
  return marked.parse(md, { renderer, async: false, gfm: true }) as string
}

function toPublic(row: PostRow, locale: Locale): PublicPost {
  return {
    slug: row.slug,
    title: locale === "es" ? row.title_es || row.title : row.title,
    excerpt: locale === "es" ? row.excerpt_es || row.excerpt : row.excerpt,
    body: locale === "es" ? row.body_es || row.body : row.body,
    cover_image: row.cover_image,
    tags: row.tags,
    published_at: row.published_at,
    updated_at: row.updated_at,
  }
}

export const getPublishedPosts = unstable_cache(
  async (locale: Locale): Promise<PublicPost[]> => {
    try {
      const rows = await sql<PostRow[]>`
        select id, slug, title, title_es, excerpt, excerpt_es, body, body_es,
               cover_image, tags, published, published_at::text, updated_at::text
        from posts where published order by published_at desc
      `
      return rows.map((r) => toPublic(r, locale))
    } catch (error) {
      console.error("getPublishedPosts:", error)
      return []
    }
  },
  ["published-posts"],
  { tags: ["posts"] },
)

export const getPublishedPost = unstable_cache(
  async (slug: string, locale: Locale): Promise<PublicPost | null> => {
    try {
      const rows = await sql<PostRow[]>`
        select id, slug, title, title_es, excerpt, excerpt_es, body, body_es,
               cover_image, tags, published, published_at::text, updated_at::text
        from posts where slug = ${slug} and published
      `
      return rows.length ? toPublic(rows[0], locale) : null
    } catch (error) {
      console.error("getPublishedPost:", error)
      return null
    }
  },
  ["published-post"],
  { tags: ["posts"] },
)
