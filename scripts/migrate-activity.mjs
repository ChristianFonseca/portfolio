// Migración Analytics + Bitácora: tablas visitor_events y admin_audit + retenciones por
// defecto en settings (idempotente). Uso: DATABASE_URL=... node scripts/migrate-activity.mjs
import postgres from "postgres"

const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL")
  process.exit(1)
}
const sql = postgres(DATABASE_URL, { max: 1, connect_timeout: 10 })

await sql`
  CREATE TABLE IF NOT EXISTS visitor_events (
    id         bigserial PRIMARY KEY,
    ts         timestamptz NOT NULL DEFAULT now(),
    session_id text,
    kind       text NOT NULL,
    path       text NOT NULL DEFAULT '',
    locale     text NOT NULL DEFAULT '',
    ip         inet,
    ip_hash    text,
    country    text NOT NULL DEFAULT '',
    ua         text NOT NULL DEFAULT '',
    referrer   text NOT NULL DEFAULT '',
    props      jsonb NOT NULL DEFAULT '{}'::jsonb
  )
`
await sql`CREATE INDEX IF NOT EXISTS visitor_events_ts_idx ON visitor_events (ts DESC)`
await sql`CREATE INDEX IF NOT EXISTS visitor_events_kind_ts_idx ON visitor_events (kind, ts DESC)`
await sql`CREATE INDEX IF NOT EXISTS visitor_events_session_idx ON visitor_events (session_id, ts)`
await sql`CREATE INDEX IF NOT EXISTS visitor_events_ip_ts_idx ON visitor_events (ip, ts DESC)`
console.log("tabla visitor_events: OK")

await sql`
  CREATE TABLE IF NOT EXISTS admin_audit (
    id      bigserial PRIMARY KEY,
    ts      timestamptz NOT NULL DEFAULT now(),
    actor   text,
    action  text NOT NULL,
    target  text NOT NULL DEFAULT '',
    ok      boolean NOT NULL DEFAULT true,
    ip      inet,
    country text NOT NULL DEFAULT '',
    ua      text NOT NULL DEFAULT '',
    detail  jsonb NOT NULL DEFAULT '{}'::jsonb
  )
`
await sql`CREATE INDEX IF NOT EXISTS admin_audit_ts_idx ON admin_audit (ts DESC)`
await sql`CREATE INDEX IF NOT EXISTS admin_audit_actor_ts_idx ON admin_audit (actor, ts DESC)`
await sql`CREATE INDEX IF NOT EXISTS admin_audit_action_ts_idx ON admin_audit (action, ts DESC)`
console.log("tabla admin_audit: OK")

for (const [key, value] of [
  ["activity_retention_days", 90],
  ["audit_retention_days", 365],
]) {
  const r = await sql`insert into settings (key, value) values (${key}, ${sql.json(value)}) on conflict (key) do nothing returning key`
  console.log(`setting ${key}: ${r.length ? "creado" : "ya existía"}`)
}

await sql.end()
console.log("migración activity: completada")
