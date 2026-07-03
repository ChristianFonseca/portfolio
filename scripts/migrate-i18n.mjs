// Migración i18n: agrega title_es y settings, y envuelve data plano → { en, es }
// sembrando el español desde static-data.json (preserva las ediciones EN existentes).
// Uso: DATABASE_URL=... node scripts/migrate-i18n.mjs
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

await sql`ALTER TABLE sections ADD COLUMN IF NOT EXISTS title_es text NOT NULL DEFAULT ''`
await sql`CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value jsonb NOT NULL)`
await sql`
  insert into settings (key, value) values ('gemini_model', '"gemini-2.5-flash-lite"'::jsonb)
  on conflict (key) do nothing
`
console.log("esquema i18n: OK")

const { sections: staticSections } = JSON.parse(
  readFileSync(join(root, "lib", "content", "static-data.json"), "utf8"),
)
const staticBySlug = new Map(staticSections.map((s) => [s.slug, s]))

const rows = await sql`select id, slug, title_es, data from sections`
for (const row of rows) {
  const seed = staticBySlug.get(row.slug)
  const hasLocales = row.data && typeof row.data === "object" && "en" in row.data
  const needsTitle = !row.title_es && seed?.title_es

  if (!hasLocales) {
    const es = seed?.data?.es ?? row.data
    await sql`
      update sections
      set data = ${sql.json({ en: row.data, es })}, title_es = ${seed?.title_es ?? ""}
      where id = ${row.id}
    `
    console.log(`sección ${row.slug}: envuelta a {en, es}${seed ? " (ES desde seed)" : " (ES copiado de EN)"}`)
  } else if (needsTitle) {
    await sql`update sections set title_es = ${seed.title_es} where id = ${row.id}`
    console.log(`sección ${row.slug}: title_es completado`)
  } else {
    console.log(`sección ${row.slug}: ya migrada`)
  }
}

await sql.end()
console.log("migración i18n: completada")
