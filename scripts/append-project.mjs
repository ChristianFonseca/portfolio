// Anexa UN proyecto (por título) a la sección public-projects SIN sobrescribir el
// resto — preserva imágenes/ediciones ya hechas en el admin. Idempotente: si ya
// existe un proyecto con ese título, no lo duplica.
// Uso: DATABASE_URL=... PROJECT_TITLE="MAT" node scripts/append-project.mjs
import postgres from "postgres"
import { projectsEn, projectsEs } from "./projects-data.mjs"

const { DATABASE_URL, PROJECT_TITLE } = process.env
if (!DATABASE_URL || !PROJECT_TITLE) {
  console.error("Faltan DATABASE_URL y/o PROJECT_TITLE")
  process.exit(1)
}

const en = projectsEn.find((p) => p.title === PROJECT_TITLE)
const es = projectsEs.find((p) => p.title === PROJECT_TITLE)
if (!en || !es) {
  console.error(`No encontré "${PROJECT_TITLE}" en projects-data.mjs`)
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

const rows = await sql`select data from sections where slug = 'public-projects'`
if (!rows.length) {
  console.error("No existe la sección public-projects")
  process.exit(1)
}
const data = rows[0].data
const already = (data?.en?.items ?? []).some((p) => p.title === PROJECT_TITLE)
if (already) {
  console.log(`"${PROJECT_TITLE}" ya existe — no se duplica`)
  await sql.end()
  process.exit(0)
}

// Append preservando todo lo demás (incl. imágenes que el usuario haya subido)
await sql`
  update sections
  set data = jsonb_set(
        jsonb_set(data, '{en,items}', (data->'en'->'items') || ${sql.json([en])}::jsonb),
        '{es,items}', (data->'es'->'items') || ${sql.json([es])}::jsonb
      ),
      updated_at = now()
  where slug = 'public-projects'
`
console.log(`"${PROJECT_TITLE}" anexado (EN+ES), resto intacto`)
await sql.end()
