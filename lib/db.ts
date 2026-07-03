import postgres from "postgres"

const globalForDb = globalThis as unknown as { pgSql?: ReturnType<typeof postgres> }

export const sql =
  globalForDb.pgSql ??
  postgres(process.env.DATABASE_URL ?? "postgres://invalid:invalid@127.0.0.1:1/invalid", {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 5,
  })

if (process.env.NODE_ENV !== "production") globalForDb.pgSql = sql
