// Inserta/actualiza los posts del blog desde blog-data.mjs de forma NO DESTRUCTIVA:
// upsert por slug, publica (published=true + published_at), y PRESERVA la portada
// (cover_image) si el admin ya subió una. Uso: DATABASE_URL=... node scripts/seed-blog.mjs
import postgres from "postgres"
import { posts } from "./blog-data.mjs"

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}
const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

let created = 0
let updated = 0
for (const p of posts) {
  // Preserva cover_image y published_at ya existentes (no pisar lo editado en admin).
  const rows = await sql`
    insert into posts (slug, title, title_es, excerpt, excerpt_es, body, body_es, tags, published, published_at)
    values (${p.slug}, ${p.title}, ${p.title_es}, ${p.excerpt}, ${p.excerpt_es},
            ${p.body}, ${p.body_es}, ${sql.json(p.tags)}, true, ${p.published_at})
    on conflict (slug) do update set
      title = excluded.title,
      title_es = excluded.title_es,
      excerpt = excluded.excerpt,
      excerpt_es = excluded.excerpt_es,
      body = excluded.body,
      body_es = excluded.body_es,
      tags = excluded.tags,
      published = true,
      published_at = coalesce(posts.published_at, excluded.published_at),
      updated_at = now()
    returning (xmax = 0) as inserted
  `
  if (rows[0]?.inserted) created++
  else updated++
  console.log(`  ${rows[0]?.inserted ? "nuevo " : "update"}  ${p.slug}`)
}

console.log(`seed-blog: ${created} nuevos, ${updated} actualizados (${posts.length} total)`)
await sql.end()
