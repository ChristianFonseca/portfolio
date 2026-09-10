import { getSetting, setSetting } from "@/lib/settings"

// Cliente mínimo de la API de Gemini (sin SDK): catálogo de modelos, prueba de un
// modelo y generateContent con reintento automático en un modelo de respaldo
// cuando el principal ya no existe/está retirado.

export const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta"

export interface GeminiModelInfo {
  id: string
  displayName: string
  description: string
  inputTokenLimit: number
  outputTokenLimit: number
  deprecated: boolean
}

export interface GeminiCatalog {
  fetchedAt: string
  models: GeminiModelInfo[]
}

export interface GeminiIncident {
  model: string
  fallback: string | null
  status: number
  detail: string
  at: string
  context: "chat" | "translate" | "test"
  recovered: boolean
}

export const SETTING_CATALOG = "gemini_models_catalog"
export const SETTING_INCIDENT = "gemini_model_incident"
export const SETTING_FALLBACK = "gemini_fallback_model"

// Familias ya retiradas por Google (no se pueden seleccionar aunque aparezcan).
const RETIRED_FAMILIES = /^gemini-(1\.0|1\.5|pro(-vision)?$|ultra)/i
// Modelos que no sirven para texto→texto en este sitio.
const NON_TEXT = /(embedding|imagen|veo|tts|audio|live|image|computer-use|robotics|aqa|learnlm|deep-research)/i

export function classifyDeprecated(id: string, description: string): boolean {
  if (RETIRED_FAMILIES.test(id)) return true
  return /deprecat|discontinu|legacy|retir|sunset|no longer/i.test(description)
}

interface RawModel {
  name: string
  displayName?: string
  description?: string
  inputTokenLimit?: number
  outputTokenLimit?: number
  supportedGenerationMethods?: string[]
}

// GET /v1beta/models (paginado). Devuelve solo modelos Gemini de texto con generateContent.
export async function listGeminiModels(apiKey: string): Promise<GeminiModelInfo[]> {
  const out: GeminiModelInfo[] = []
  let pageToken: string | undefined
  for (let page = 0; page < 5; page++) {
    const url = new URL(`${GEMINI_API}/models`)
    url.searchParams.set("pageSize", "200")
    if (pageToken) url.searchParams.set("pageToken", pageToken)
    const res = await fetch(url, { headers: { "x-goog-api-key": apiKey }, cache: "no-store" })
    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      throw new Error(`Gemini respondió ${res.status} al listar modelos. ${detail.slice(0, 200)}`)
    }
    const json = (await res.json()) as { models?: RawModel[]; nextPageToken?: string }
    for (const m of json.models ?? []) {
      const id = m.name.replace(/^models\//, "")
      if (!/^gemini/i.test(id) || NON_TEXT.test(id)) continue
      if (!(m.supportedGenerationMethods ?? []).includes("generateContent")) continue
      out.push({
        id,
        displayName: m.displayName ?? id,
        description: (m.description ?? "").slice(0, 300),
        inputTokenLimit: m.inputTokenLimit ?? 0,
        outputTokenLimit: m.outputTokenLimit ?? 0,
        deprecated: classifyDeprecated(id, m.description ?? ""),
      })
    }
    pageToken = json.nextPageToken
    if (!pageToken) break
  }
  // Disponibles primero; dentro de cada grupo, los ids más nuevos (orden natural inverso) arriba.
  return out.sort((a, b) => Number(a.deprecated) - Number(b.deprecated) || b.id.localeCompare(a.id, "en", { numeric: true }))
}

export async function getGeminiCatalog(): Promise<GeminiCatalog | null> {
  return getSetting<GeminiCatalog | null>(SETTING_CATALOG, null)
}

// Estado de un id frente al catálogo guardado: ok | deprecated | missing | unknown (sin catálogo).
export function modelStatus(id: string, catalog: GeminiCatalog | null): "ok" | "deprecated" | "missing" | "unknown" {
  if (!catalog) return RETIRED_FAMILIES.test(id) ? "deprecated" : "unknown"
  const found = catalog.models.find((m) => m.id === id)
  if (!found) return "missing"
  return found.deprecated ? "deprecated" : "ok"
}

// Prueba barata: countTokens con un texto mínimo. Devuelve latencia o el error real.
export async function probeGeminiModel(
  apiKey: string,
  model: string,
): Promise<{ ok: true; ms: number; tokens: number } | { ok: false; status: number; error: string }> {
  const started = Date.now()
  const res = await fetch(`${GEMINI_API}/models/${encodeURIComponent(model)}:countTokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] }),
    cache: "no-store",
  })
  const ms = Date.now() - started
  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    return { ok: false, status: res.status, error: extractApiMessage(detail) || `HTTP ${res.status}` }
  }
  const json = (await res.json().catch(() => ({}))) as { totalTokens?: number }
  return { ok: true, ms, tokens: json.totalTokens ?? 0 }
}

function extractApiMessage(detail: string): string {
  try {
    const j = JSON.parse(detail) as { error?: { message?: string } }
    return (j.error?.message ?? "").slice(0, 240)
  } catch {
    return detail.slice(0, 240)
  }
}

// ¿El error indica que el MODELO no existe/está retirado (y no un problema de key o cuota)?
export function isModelUnavailable(status: number, detail: string): boolean {
  if (status === 404) return true
  if (status === 400 || status === 403) {
    return /not found|not supported|deprecated|no longer (available|supported)|is not available|unsupported model|has been (retired|shut ?down)/i.test(
      detail,
    )
  }
  return false
}

export type GenerateOutcome =
  | { ok: true; payload: unknown; model: string; fellBack: boolean }
  | { ok: false; status: number; detail: string; model: string }

// generateContent con un único reintento en el modelo de respaldo si el principal no
// está disponible. Registra el incidente en settings para que el admin lo vea.
export async function generateContent(args: {
  apiKey: string
  model: string
  fallbackModel: string | null
  body: Record<string, unknown>
  context: "chat" | "translate"
}): Promise<GenerateOutcome> {
  const call = async (model: string) => {
    const res = await fetch(`${GEMINI_API}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": args.apiKey },
      body: JSON.stringify(args.body),
      cache: "no-store",
    })
    if (res.ok) return { ok: true as const, payload: (await res.json()) as unknown, model }
    const detail = await res.text().catch(() => "")
    return { ok: false as const, status: res.status, detail, model }
  }

  const first = await call(args.model)
  if (first.ok) return { ...first, fellBack: false }

  const canFallback =
    args.fallbackModel && args.fallbackModel !== args.model && isModelUnavailable(first.status, first.detail)
  if (!canFallback) return first

  const second = await call(args.fallbackModel as string)
  const incident: GeminiIncident = {
    model: args.model,
    fallback: args.fallbackModel,
    status: first.status,
    detail: extractApiMessage(first.detail),
    at: new Date().toISOString(),
    context: args.context,
    recovered: second.ok,
  }
  setSetting(SETTING_INCIDENT, incident).catch((e) => console.error("gemini incident log:", e))
  console.error(`gemini ${args.context}: modelo ${args.model} no disponible (${first.status}); respaldo ${args.fallbackModel} → ${second.ok ? "ok" : second.status}`)
  return second.ok ? { ...second, fellBack: true } : second
}
