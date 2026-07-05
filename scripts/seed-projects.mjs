// Reemplaza el contenido de la sección "public-projects" con los 4 proyectos reales
// (bilingüe EN/ES). Idempotente por slug de sección. Uso:
//   DATABASE_URL=... node scripts/seed-projects.mjs
import postgres from "postgres"
import { projectsData } from "./projects-data.mjs"

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}
const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

const updated = await sql`
  update sections
  set title = 'Projects', title_es = 'Proyectos', data = ${sql.json(projectsData)}, updated_at = now()
  where slug = 'public-projects'
  returning slug
`
if (!updated.length) {
  console.error("No existe la sección public-projects — corre el seed base primero")
  process.exit(1)
}
console.log(`sección public-projects: ${projectsData.en.items.length} proyectos (EN+ES) actualizados`)

await sql.end()
console.log("seed-projects: completado")
