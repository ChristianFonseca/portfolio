// Migración del rediseño: sección "Cómo trabajo" (approach) desde el seed estático (idempotente).
// Uso: DATABASE_URL=... node scripts/migrate-approach.mjs
//
// El campo hero.summary no necesita migración: mientras la fila no lo tenga, la web
// y el admin lo toman de static-data.json (withDefaults en lib/content/queries.ts).
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

const { sections } = JSON.parse(readFileSync(join(root, "lib", "content", "static-data.json"), "utf8"))
const approach = sections.find((s) => s.slug === "approach")
if (!approach) {
  console.error("static-data.json no tiene la sección approach")
  process.exit(1)
}

// Al final de la lista del admin; la landing decide el orden visual por su cuenta
const [{ next }] = await sql`select coalesce(max(position), 0) + 1 as next from sections`
const inserted = await sql`
  insert into sections (slug, kind, title, title_es, position, visible, data)
  values (${approach.slug}, ${approach.kind}, ${approach.title}, ${approach.title_es}, ${next}, ${approach.visible}, ${sql.json(approach.data)})
  on conflict (slug) do nothing
  returning slug
`
console.log(`sección approach: ${inserted.length ? `insertada en la posición ${next}` : "ya existía"}`)

await sql.end()
