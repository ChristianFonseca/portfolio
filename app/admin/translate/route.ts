import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth"
import { kindSchemas } from "@/lib/content/schemas"
import { DEFAULT_GEMINI_FALLBACK_MODEL, DEFAULT_GEMINI_MODEL, getSetting } from "@/lib/settings"
import { SETTING_FALLBACK, generateContent } from "@/lib/gemini"
import { logAudit } from "@/lib/activity"

// Además de las secciones, se pueden traducir artículos del blog (markdown:
// la IA preserva el formato, código y links)
const postTranslatableSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500),
  body: z.string().max(50000),
})

const TRANSLATABLE: Record<string, z.ZodTypeAny> = { ...kindSchemas, post: postTranslatableSchema }

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  es: "NEUTRAL Latin American Spanish (professional CV tone; use tuteo — NEVER voseo or Argentine/Rioplatense forms like 'vos', 'podés', 'tenés', 'acá', 'mirá')",
}

function buildPrompt(from: string, to: string, data: unknown): string {
  return `You are a professional translator for a Data & AI engineer's portfolio website.
Translate the human-readable text in the JSON below from ${LOCALE_NAMES[from]} to ${LOCALE_NAMES[to]}.

STRICT RULES:
- Return ONLY valid JSON with EXACTLY the same structure, keys and types. No markdown, no explanations.
- DO NOT translate: company/organization names ("org"), technology names (arrays like "tech", "badges"), URLs, image paths ("image", "photo"), proper nouns, acronyms (AWS, MLOps, GenAI, LLM, RAG, EEG, etc.), hex colors, booleans.
- DO translate: titles, descriptions, bullets, roles/job titles, taglines, locations, month names in "period" fields (e.g. "May 2025 - Present" ↔ "Mayo 2025 - Presente"), skill group names, language names/levels, and article body text.
- If a field contains Markdown, preserve ALL formatting exactly: headings, lists, links (translate link text, never URLs), bold/italic markers, and code blocks (never translate code or commands).
- Keep all numbers and metrics intact.
- Natural, professional phrasing — not literal robotic translation.

JSON to translate:
${JSON.stringify(data)}`
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no está configurada en el servidor. Cárgala en el proyecto de Bitwarden Secrets Manager y reinicia el contenedor." },
      { status: 501 },
    )
  }

  try {
    let body: { kind?: string; from?: string; to?: string; data?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
    }
    const { kind, from, to, data } = body
    if (!kind || !(kind in TRANSLATABLE) || !from || !to || from === to || data === undefined) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }
    if (!["en", "es"].includes(from) || !["en", "es"].includes(to)) {
      return NextResponse.json({ error: "Idiomas no soportados" }, { status: 400 })
    }

    const [configuredModel, fallbackModel] = await Promise.all([
      getSetting<string>("gemini_model", DEFAULT_GEMINI_MODEL),
      getSetting<string>(SETTING_FALLBACK, DEFAULT_GEMINI_FALLBACK_MODEL),
    ])

    const outcome = await generateContent({
      apiKey,
      model: configuredModel,
      fallbackModel,
      context: "translate",
      body: {
        contents: [{ parts: [{ text: buildPrompt(from, to, data) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      },
    })

    if (!outcome.ok) {
      console.error("gemini error:", outcome.status, outcome.detail.slice(0, 500))
      const hint =
        outcome.status === 404
          ? ` El modelo "${outcome.model}" no existe o no está disponible — cámbialo en Configuración (y revisa el modelo de respaldo).`
          : outcome.status === 400 || outcome.status === 403
            ? " Revisa que la GEMINI_API_KEY sea válida."
            : ""
      return NextResponse.json({ error: `Gemini respondió ${outcome.status}.${hint}` }, { status: 502 })
    }

    const model = outcome.model // el que realmente respondió (puede ser el de respaldo)
    const payload = outcome.payload as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const text: string | undefined = payload?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json({ error: "Gemini no devolvió contenido. Intenta de nuevo." }, { status: 502 })
    }

    let translated: unknown
    try {
      translated = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: "La respuesta de Gemini no fue JSON válido. Intenta de nuevo." }, { status: 502 })
    }

    const parsed = TRANSLATABLE[kind].safeParse(translated)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        {
          error: `La traducción no pasó la validación (${issue.path.join(".")}: ${issue.message}). Completa los campos vacíos del idioma origen e intenta de nuevo.`,
        },
        { status: 422 },
      )
    }

    void logAudit({
      actor: user.email,
      action: "translate",
      target: kind,
      detail: { from, to, model, fellBack: outcome.fellBack },
      headers: request.headers,
    })
    return NextResponse.json({ ok: true, data: parsed.data, model })
  } catch (error) {
    console.error("translate:", error)
    return NextResponse.json({ error: "Error al traducir" }, { status: 500 })
  }
}
