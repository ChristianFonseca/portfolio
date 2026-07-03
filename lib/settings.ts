import { sql } from "./db"

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite"

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite — el más rápido y económico (recomendado)" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite — nueva generación, bajo costo" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash — balanceado" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash — más capaz, mayor costo" },
]

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const rows = await sql<{ value: T }[]>`select value from settings where key = ${key}`
    return rows.length ? rows[0].value : fallback
  } catch {
    return fallback
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await sql`
    insert into settings (key, value) values (${key}, ${sql.json(value as never)})
    on conflict (key) do update set value = excluded.value
  `
}
