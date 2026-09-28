// Migración de guardrails del chat (idempotente): columnas de desenlace y consumo en
// chat_questions, tabla chat_guard_events y los settings nuevos.
// Uso: DATABASE_URL=... node scripts/migrate-guardrails.mjs
//
// Es compatible hacia atrás: todo lo nuevo tiene valor por defecto o admite null, así
// que el código anterior sigue funcionando si se corre antes del deploy.
import postgres from "postgres"

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}
// onnotice: en una segunda pasada Postgres avisa de cada "ya existe"; es lo esperado.
const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10, onnotice: () => {} })

// Con un DEFAULT constante, ADD COLUMN es solo de metadatos en Postgres 11+: no reescribe la tabla.
await sql`ALTER TABLE chat_questions ADD COLUMN IF NOT EXISTS net_hash text`
await sql`ALTER TABLE chat_questions ADD COLUMN IF NOT EXISTS outcome text NOT NULL DEFAULT 'answered'`
await sql`ALTER TABLE chat_questions ADD COLUMN IF NOT EXISTS finish_reason text NOT NULL DEFAULT ''`
await sql`ALTER TABLE chat_questions ADD COLUMN IF NOT EXISTS tokens_in int`
await sql`ALTER TABLE chat_questions ADD COLUMN IF NOT EXISTS tokens_out int`
await sql`ALTER TABLE chat_questions ADD COLUMN IF NOT EXISTS tokens_thought int`
await sql`ALTER TABLE chat_questions ADD COLUMN IF NOT EXISTS history_turns int`
// Las filas viejas pasan a contar con su hash de IP completo; para IPv4 es el mismo valor.
// Se vuelve a correr tras el deploy para rellenar lo que escribió el código viejo mientras
// tanto (la ruta nueva además tolera net_hash nulo).
const filled = await sql`UPDATE chat_questions SET net_hash = ip_hash WHERE net_hash IS NULL`
await sql`CREATE INDEX IF NOT EXISTS chat_questions_net_day_idx ON chat_questions (net_hash, created_at)`
await sql`CREATE INDEX IF NOT EXISTS chat_questions_created_idx ON chat_questions (created_at)`
// Lo que cuenta para los límites: así las filas 'error' no frenan el conteo de la admisión.
await sql`CREATE INDEX IF NOT EXISTS chat_questions_counted_idx ON chat_questions (created_at) WHERE outcome <> 'error'`
console.log(`chat_questions: columnas OK (${filled.count} filas con net_hash rellenado)`)

await sql`
  CREATE TABLE IF NOT EXISTS chat_guard_events (
    id       bigserial PRIMARY KEY,
    bucket   timestamptz NOT NULL,
    kind     text NOT NULL,
    ip_hash  text NOT NULL DEFAULT '',
    status   int NOT NULL DEFAULT 0,
    n        int NOT NULL DEFAULT 1,
    first_ts timestamptz NOT NULL DEFAULT now(),
    last_ts  timestamptz NOT NULL DEFAULT now(),
    locale   text NOT NULL DEFAULT '',
    model    text NOT NULL DEFAULT '',
    detail   jsonb NOT NULL DEFAULT '{}'::jsonb,
    UNIQUE (bucket, kind, ip_hash, status)
  )
`
await sql`CREATE INDEX IF NOT EXISTS chat_guard_events_bucket_idx ON chat_guard_events (bucket DESC)`
console.log("tabla chat_guard_events: OK")

// chat_retention_days = 0 conserva las preguntas para siempre, como hasta ahora: borrar
// historial es decisión del admin, no de una migración.
for (const [key, value] of [
  ["chat_global_daily_limit", 300],
  ["chat_retention_days", 0],
]) {
  const r = await sql`insert into settings (key, value) values (${key}, ${sql.json(value)}) on conflict (key) do nothing returning key`
  console.log(`setting ${key}: ${r.length ? "creado" : "ya existía"}`)
}

await sql.end()
console.log("migración guardrails: completada")
