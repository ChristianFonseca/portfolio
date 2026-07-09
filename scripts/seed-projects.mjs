// Actualiza la sección "public-projects" con los proyectos de projects-data.mjs,
// de forma NO DESTRUCTIVA: preserva las fotos subidas por el admin (images/image)
// y las URLs que el usuario haya puesto (repoUrl/liveUrl si projects-data no las trae).
// Los textos (título, descripción, bullets, tech) sí se toman de projects-data.
// Uso: DATABASE_URL=... node scripts/seed-projects.mjs
import postgres from "postgres"
import { projectsData } from "./projects-data.mjs"

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}
const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

const rows = await sql`select data from sections where slug = 'public-projects'`
if (!rows.length) {
  console.error("No existe la sección public-projects — corre el seed base primero")
  process.exit(1)
}
const current = rows[0].data ?? {}

// Fusiona una lista de proyectos nueva con la existente (match por título),
// conservando media y URLs ya presentes en la DB.
function mergeLocale(nextItems, prevItems) {
  const prevByTitle = new Map((prevItems ?? []).map((p) => [p.title, p]))
  return nextItems.map((p) => {
    const prev = prevByTitle.get(p.title)
    if (!prev) return p
    return {
      ...p,
      image: prev.image || p.image || "",
      images: Array.isArray(prev.images) && prev.images.length ? prev.images : (p.images ?? []),
      repoUrl: p.repoUrl || prev.repoUrl || "",
      liveUrl: p.liveUrl || prev.liveUrl || "",
    }
  })
}

const merged = {
  en: { items: mergeLocale(projectsData.en.items, current.en?.items) },
  es: { items: mergeLocale(projectsData.es.items, current.es?.items) },
}

await sql`
  update sections
  set title = 'Projects', title_es = 'Proyectos', data = ${sql.json(merged)}, updated_at = now()
  where slug = 'public-projects'
`
const preserved = (current.en?.items ?? []).filter((p) => (p.images?.length || p.image)).length
console.log(`public-projects: ${merged.en.items.length} proyectos · ${preserved} con media preservada`)

await sql.end()
console.log("seed-projects: completado")
