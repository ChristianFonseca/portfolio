// Migración SEO: tabla posts, sección FAQ y artículo de ejemplo (idempotente).
// Uso: DATABASE_URL=... node scripts/migrate-seo.mjs
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import postgres from "postgres"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

await sql`
  CREATE TABLE IF NOT EXISTS posts (
    id           serial PRIMARY KEY,
    slug         text UNIQUE NOT NULL,
    title        text NOT NULL DEFAULT '',
    title_es     text NOT NULL DEFAULT '',
    excerpt      text NOT NULL DEFAULT '',
    excerpt_es   text NOT NULL DEFAULT '',
    body         text NOT NULL DEFAULT '',
    body_es      text NOT NULL DEFAULT '',
    cover_image  text NOT NULL DEFAULT '',
    tags         jsonb NOT NULL DEFAULT '[]'::jsonb,
    published    boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    updated_at   timestamptz NOT NULL DEFAULT now(),
    created_at   timestamptz NOT NULL DEFAULT now()
  )
`
await sql`CREATE INDEX IF NOT EXISTS posts_published_idx ON posts (published, published_at DESC)`
console.log("tabla posts: OK")

// Sección FAQ desde el seed estático
const { sections } = JSON.parse(readFileSync(join(root, "lib", "content", "static-data.json"), "utf8"))
const faq = sections.find((s) => s.slug === "faq")
if (faq) {
  const inserted = await sql`
    insert into sections (slug, kind, title, title_es, position, visible, data)
    values (${faq.slug}, ${faq.kind}, ${faq.title}, ${faq.title_es}, ${faq.position}, ${faq.visible}, ${sql.json(faq.data)})
    on conflict (slug) do nothing
    returning slug
  `
  console.log(`sección faq: ${inserted.length ? "insertada" : "ya existía"}`)
}

// Artículo de ejemplo (bilingüe, publicado) — editable/eliminable desde el admin
const DEMO = {
  slug: "how-this-portfolio-works",
  title: "How this portfolio works: Next.js 15, Postgres and a Gemini-powered admin",
  title_es: "Cómo funciona este portafolio: Next.js 15, Postgres y un admin potenciado por Gemini",
  excerpt:
    "A look under the hood: a bilingual portfolio with a custom CMS, AI-assisted translations, a RAG chat assistant grounded in live content, and instant publishing without redeploys.",
  excerpt_es:
    "Un vistazo bajo el capó: un portafolio bilingüe con CMS propio, traducciones asistidas por IA, un chat RAG fundamentado en contenido vivo y publicación instantánea sin redeploys.",
  body: `Every section you see on this site — experience, projects, skills, even this blog — lives in PostgreSQL and is editable from a custom admin panel. Here is how the pieces fit together.

## The stack

- **Next.js 15** (App Router, Server Components) served by a single Docker container on a VPS behind nginx.
- **PostgreSQL** stores content as JSONB documents: one row per section, with \`en\` and \`es\` variants side by side.
- **Gemini** powers two things: one-click translation between English and Spanish in the admin, and the chat assistant you can try on the site.

## Instant publishing, no redeploys

The landing page is a Server Component that reads content through Next.js's cache with a tag. When something is saved in the admin, the server action calls \`revalidateTag\` — the very next visitor gets the fresh content. The Docker image only rebuilds when code changes, never for content.

## The RAG chat

The assistant answers questions about my experience using a knowledge base built at request time from the same database rows the admin edits, so it is never out of date. Guardrails keep it on topic, per-IP rate limits keep it safe, and every question is logged (with the visitor's IP stored only as an irreversible hash) for analytics.

## Why build it instead of using a CMS?

Because the portfolio itself is the case study: content modeling, auth with roles, AI integration, i18n with proper hreflang, and security controls — all the things I do for clients, working in production on my own domain.`,
  body_es: `Cada sección de este sitio — experiencia, proyectos, habilidades, incluso este blog — vive en PostgreSQL y es editable desde un panel de administración propio. Así encajan las piezas.

## El stack

- **Next.js 15** (App Router, Server Components) servido por un único contenedor Docker en un VPS detrás de nginx.
- **PostgreSQL** guarda el contenido como documentos JSONB: una fila por sección, con las variantes \`en\` y \`es\` lado a lado.
- **Gemini** impulsa dos cosas: la traducción con un clic entre inglés y español en el admin, y el asistente de chat que puedes probar en el sitio.

## Publicación instantánea, sin redeploys

La página principal es un Server Component que lee el contenido a través del caché de Next.js con un tag. Cuando algo se guarda en el admin, la server action llama a \`revalidateTag\` — el siguiente visitante recibe el contenido fresco. La imagen de Docker solo se reconstruye cuando cambia el código, nunca por contenido.

## El chat RAG

El asistente responde preguntas sobre mi experiencia usando una base de conocimiento construida en el momento desde las mismas filas de la base de datos que edita el admin, así que nunca queda desactualizada. Los guardrails lo mantienen en tema, los límites por IP lo mantienen seguro, y cada pregunta se registra (con la IP del visitante guardada solo como hash irreversible) para analítica.

## ¿Por qué construirlo en vez de usar un CMS?

Porque el portafolio en sí es el caso de estudio: modelado de contenido, autenticación con roles, integración de IA, i18n con hreflang correcto y controles de seguridad — todo lo que hago para clientes, funcionando en producción en mi propio dominio.`,
  tags: ["Next.js", "PostgreSQL", "Gemini", "RAG", "Docker"],
}

const inserted = await sql`
  insert into posts (slug, title, title_es, excerpt, excerpt_es, body, body_es, tags, published, published_at)
  values (${DEMO.slug}, ${DEMO.title}, ${DEMO.title_es}, ${DEMO.excerpt}, ${DEMO.excerpt_es},
          ${DEMO.body}, ${DEMO.body_es}, ${sql.json(DEMO.tags)}, true, now())
  on conflict (slug) do nothing
  returning slug
`
console.log(`post de ejemplo: ${inserted.length ? "insertado y publicado" : "ya existía"}`)

await sql.end()
console.log("migración SEO: completada")
