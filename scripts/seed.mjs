// Seed idempotente: aplica el esquema, inserta las secciones (sin pisar ediciones)
// y crea el usuario admin inicial si no existe.
// Uso: DATABASE_URL=... ADMIN_EMAIL=... ADMIN_NAME=... ADMIN_PASSWORD=... node scripts/seed.mjs
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { randomBytes, scryptSync } from "node:crypto"
import postgres from "postgres"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}

const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

const schema = readFileSync(join(root, "db", "schema.sql"), "utf8")
await sql.unsafe(schema)
console.log("esquema: OK")

const { sections } = JSON.parse(readFileSync(join(root, "lib", "content", "static-data.json"), "utf8"))
for (const s of sections) {
  const inserted = await sql`
    insert into sections (slug, kind, title, title_es, position, visible, data)
    values (${s.slug}, ${s.kind}, ${s.title}, ${s.title_es ?? ""}, ${s.position}, ${s.visible}, ${sql.json(s.data)})
    on conflict (slug) do nothing
    returning slug
  `
  console.log(`sección ${s.slug}: ${inserted.length ? "insertada" : "ya existía (no se toca)"}`)
}

const CHAT_EXTRA_CONTEXT = [
  "Education: MSc in Artificial Intelligence (in progress, 2024-2026) at Universidad Nacional de Ingenieria, Peru. Diploma in Advanced Computing (2015) at C-DAC, India. BSc in Mechatronics Engineering (2011-2015) at Universidad Nacional de Ingenieria, Peru.",
  "Certifications detail: AWS 13x certified (Solutions Architect Professional, DevOps Engineer Professional, Machine Learning Specialty, Advanced Networking Specialty, Security Specialty, ML Engineer Associate, Solutions Architect Associate, Data Engineer Associate, CloudOps Engineer Associate, SysOps Administrator Associate, Developer Associate, AI Practitioner, Cloud Practitioner). Microsoft 4x (Azure AI Engineer Associate, Azure Data Scientist Associate, Azure AI Fundamentals, Azure Data Fundamentals). Oracle 4x (AI Vector Search Professional, OCI Data Science Professional, OCI GenAI Professional, OCI AI Foundations Associate). Also TOGAF and DAMA CDMP.",
  "Contact: christian.fonseca.r@gmail.com. LinkedIn: linkedin.com/in/christian-fonseca-rodriguez. GitHub: github.com/christianfonseca. Google Scholar and Credly profiles are linked on the website. Based in Lima, Peru (GMT-5). Open to new projects and opportunities. The website has an English version at / and Spanish at /es. His CV can be downloaded at christianfonseca.dev/cv.pdf.",
].join("\n")

const defaultSettings = [
  ["gemini_model", "gemini-2.5-flash-lite"],
  ["chat_daily_limit", 10],
  ["chat_ip_allowlist", []],
  ["chat_extra_context", CHAT_EXTRA_CONTEXT],
]
for (const [key, value] of defaultSettings) {
  await sql`
    insert into settings (key, value) values (${key}, ${sql.json(value)})
    on conflict (key) do nothing
  `
  console.log(`setting ${key}: OK`)
}

if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const salt = randomBytes(16).toString("hex")
  const hash = `${salt}:${scryptSync(ADMIN_PASSWORD, salt, 64).toString("hex")}`
  const inserted = await sql`
    insert into users (email, name, password_hash)
    values (${ADMIN_EMAIL.toLowerCase()}, ${ADMIN_NAME ?? ""}, ${hash})
    on conflict (email) do nothing
    returning email
  `
  console.log(`usuario ${ADMIN_EMAIL}: ${inserted.length ? "creado" : "ya existía (password sin cambios)"}`)
}

await sql.end()
console.log("seed: completado")
