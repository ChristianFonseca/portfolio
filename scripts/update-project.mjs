// Actualiza campos de UN proyecto (por título) en la sección public-projects con los
// textos de projects-data.mjs, sin tocar los demás proyectos ni sus imágenes o URLs.
// A diferencia de seed-projects.mjs, no reescribe los textos del resto: lo que se haya
// editado en el admin se respeta. Antes guarda una revisión en section_revisions, igual
// que el admin, para poder deshacerlo.
// Uso: DATABASE_URL=... PROJECT_TITLE="Atalaya" FIELDS="description" node scripts/update-project.mjs
//      FIELDS admite: description, bullets, tech (separados por coma; por defecto description)
import postgres from "postgres"
import { projectsEn, projectsEs } from "./projects-data.mjs"

const { DATABASE_URL, PROJECT_TITLE } = process.env
const FIELDS = (process.env.FIELDS || "description").split(",").map((f) => f.trim()).filter(Boolean)
const ALLOWED = new Set(["description", "bullets", "tech"])
if (!DATABASE_URL || !PROJECT_TITLE) {
  console.error("Faltan DATABASE_URL y/o PROJECT_TITLE")
  process.exit(1)
}
if (!FIELDS.every((f) => ALLOWED.has(f))) {
  console.error(`FIELDS solo admite: ${[...ALLOWED].join(", ")}`)
  process.exit(1)
}

const source = { en: projectsEn.find((p) => p.title === PROJECT_TITLE), es: projectsEs.find((p) => p.title === PROJECT_TITLE) }
if (!source.en || !source.es) {
  console.error(`No encontré "${PROJECT_TITLE}" en projects-data.mjs`)
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })
const rows = await sql`select id, data from sections where slug = 'public-projects'`
if (!rows.length) {
  console.error("No existe la sección public-projects")
  process.exit(1)
}
const { id, data } = rows[0]
const next = structuredClone(data)
for (const loc of ["en", "es"]) {
  const item = (next?.[loc]?.items ?? []).find((p) => p.title === PROJECT_TITLE)
  if (!item) {
    console.error(`"${PROJECT_TITLE}" no está en la base (${loc}). Usa append-project.mjs primero.`)
    process.exit(1)
  }
  for (const f of FIELDS) item[f] = source[loc][f]
}

await sql.begin(async (tx) => {
  await tx`insert into section_revisions (section_id, data, saved_by) values (${id}, ${tx.json(data)}, 'script:update-project')`
  await tx`update sections set data = ${tx.json(next)}, updated_at = now() where id = ${id}`
})
console.log(`"${PROJECT_TITLE}": ${FIELDS.join(", ")} actualizado (EN+ES); revisión previa guardada`)
await sql.end()
