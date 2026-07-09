// Migra los badges de la sección "skills" de string[] a {name,url}[], rellenando
// URLs conocidas. No destructivo: conserva URLs ya puestas. Uso:
//   DATABASE_URL=... node scripts/migrate-skill-links.mjs
import postgres from "postgres"
import { withUrls } from "./skill-urls.mjs"

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}
const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

const rows = await sql`select data from sections where slug = 'skills'`
if (!rows.length) {
  console.error("No existe la sección skills")
  process.exit(1)
}
const data = rows[0].data ?? {}

const migrateLocale = (loc) => {
  if (!loc?.groups) return loc
  return { ...loc, groups: loc.groups.map((g) => ({ ...g, badges: withUrls(g.badges) })) }
}

const next = { en: migrateLocale(data.en), es: migrateLocale(data.es) }

await sql`update sections set data = ${sql.json(next)}, updated_at = now() where slug = 'skills'`
const withLink = (next.en?.groups ?? []).flatMap((g) => g.badges).filter((b) => b.url).length
const total = (next.en?.groups ?? []).flatMap((g) => g.badges).length
console.log(`skills: ${total} badges migrados · ${withLink} con enlace`)

await sql.end()
console.log("migrate-skill-links: completado")
