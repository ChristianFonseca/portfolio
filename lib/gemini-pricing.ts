// Precios de la API de Gemini (nivel de pago, estándar, USD por 1M tokens). La API de
// modelos NO devuelve precios, así que se mantienen a mano desde la página oficial.
// Módulo puro (sin dependencias de servidor): lo usan componentes cliente del admin.

export const PRICING_URL = "https://ai.google.dev/gemini-api/docs/pricing"
export const PRICING_UPDATED = "2026-09-10"

export interface ModelPrice {
  /** USD por 1M tokens de entrada (tramo base). */
  input: number
  /** USD por 1M tokens de salida (tramo base). */
  output: number
  /** true si Google ofrece nivel gratuito para este modelo. */
  freeTier: boolean
  note?: string
}

// Clave = id base; las variantes (p. ej. "gemini-2.5-flash-lite-preview-06-17") heredan
// por prefijo más largo. Ordenar no importa: se resuelve en priceFor().
const PRICES: Record<string, ModelPrice> = {
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4, freeTier: true },
  "gemini-2.5-flash": { input: 0.3, output: 2.5, freeTier: true },
  "gemini-2.5-pro": { input: 1.25, output: 10, freeTier: true, note: "hasta 200K tokens de prompt; más caro por encima" },
  "gemini-3.1-flash-lite": { input: 0.25, output: 1.5, freeTier: true },
  "gemini-3.1-pro": { input: 2, output: 12, freeTier: false, note: "hasta 200K tokens de prompt; más caro por encima" },
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5, freeTier: true },
  "gemini-3.5-flash": { input: 1.5, output: 9, freeTier: true },
  "gemini-3.6-flash": { input: 0.75, output: 3.75, freeTier: true, note: "sube de precio el 1 ene 2027" },
  "gemini-3.7-flash": { input: 0.75, output: 3.75, freeTier: true, note: "sube de precio el 1 ene 2027" },
  "gemini-3.8-flash": { input: 0.75, output: 3.75, freeTier: true, note: "sube de precio el 1 ene 2027" },
}

const KEYS = Object.keys(PRICES).sort((a, b) => b.length - a.length)

export function priceFor(modelId: string): ModelPrice | null {
  const id = modelId.toLowerCase()
  const key = KEYS.find((k) => id === k || id.startsWith(`${k}-`))
  return key ? PRICES[key] : null
}

// "$0.10" / "$1.25" / "$10" — formato fijo (sin locale) para no romper la hidratación.
export function fmtUsd(n: number): string {
  return `$${n < 1 ? n.toFixed(2) : Number.isInteger(n) ? String(n) : n.toFixed(2)}`
}

export function fmtPricePair(p: ModelPrice): string {
  return `${fmtUsd(p.input)} entrada · ${fmtUsd(p.output)} salida por 1M tokens`
}

// Costo estimado (USD) de un mensaje: tokens de entrada (KB + reglas + historial) y de salida.
export function estimateCostUsd(p: ModelPrice, inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output
}

export function fmtSmallUsd(n: number): string {
  if (n === 0) return "$0"
  if (n < 0.0001) return "< $0.0001"
  return `$${n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`
}
