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

await sql`
  insert into settings (key, value) values ('gemini_model', '"gemini-2.5-flash-lite"'::jsonb)
  on conflict (key) do nothing
`
console.log("setting gemini_model: OK")

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
