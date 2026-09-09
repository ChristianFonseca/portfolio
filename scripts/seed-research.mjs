// Actualiza la sección "research-projects" desde research-data.mjs de forma NO
// DESTRUCTIVA: preserva las imágenes subidas por el admin (images) y toma el resto
// (textos, institución, fechas, tech) del módulo de datos.
// Uso: DATABASE_URL=... node scripts/seed-research.mjs
import postgres from "postgres"
import { researchData } from "./research-data.mjs"

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}
const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

const rows = await sql`select data from sections where slug = 'research-projects'`
if (!rows.length) {
  console.error("No existe la sección research-projects — corre el seed base primero")
  process.exit(1)
}
const current = rows[0].data ?? {}

// Campos que el usuario edita en el admin: se preservan de la DB (no se pisan).
// title/description/bullets/tech vienen del módulo (contenido autorado).
const PRESERVE = ["images", "papers", "institution", "institutionUrl", "department", "departmentUrl", "startDate", "endDate"]

function mergeLocale(nextItems, prevItems) {
  const prevByTitle = new Map((prevItems ?? []).map((p) => [p.title, p]))
  return nextItems.map((p) => {
    const prev = prevByTitle.get(p.title)
    if (!prev) return p
    const out = { ...p }
    for (const k of PRESERVE) {
      if (prev[k] !== undefined && !(Array.isArray(prev[k]) && prev[k].length === 0) && prev[k] !== "") out[k] = prev[k]
    }
    return out
  })
}

const merged = {
  en: { items: mergeLocale(researchData.en.items, current.en?.items) },
  es: { items: mergeLocale(researchData.es.items, current.es?.items) },
}

await sql`
  update sections
  set data = ${sql.json(merged)}, updated_at = now()
  where slug = 'research-projects'
`
console.log(`research-projects: ${merged.en.items.length} items actualizados`)

await sql.end()
console.log("seed-research: completado")
