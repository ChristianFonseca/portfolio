import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { kindSchemas, type SectionKind } from "@/lib/content/schemas"
import { DEFAULT_GEMINI_MODEL, getSetting } from "@/lib/settings"

const LOCALE_NAMES: Record<string, string> = { en: "English", es: "Spanish (Latin American, professional CV tone)" }

function buildPrompt(from: string, to: string, data: unknown): string {
  return `You are a professional translator for a Data & AI engineer's portfolio website.
Translate the human-readable text in the JSON below from ${LOCALE_NAMES[from]} to ${LOCALE_NAMES[to]}.

STRICT RULES:
- Return ONLY valid JSON with EXACTLY the same structure, keys and types. No markdown, no explanations.
- DO NOT translate: company/organization names ("org"), technology names (arrays like "tech", "badges"), URLs, image paths ("image", "photo"), proper nouns, acronyms (AWS, MLOps, GenAI, LLM, RAG, EEG, etc.), hex colors, booleans.
- DO translate: titles, descriptions, bullets, roles/job titles, taglines, locations, month names in "period" fields (e.g. "May 2025 - Present" ↔ "Mayo 2025 - Presente"), skill group names, language names/levels.
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
      { error: "GEMINI_API_KEY no está configurada en el servidor. Agrégala al .env y reinicia." },
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
    if (!kind || !(kind in kindSchemas) || !from || !to || from === to || data === undefined) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }
    if (!["en", "es"].includes(from) || !["en", "es"].includes(to)) {
      return NextResponse.json({ error: "Idiomas no soportados" }, { status: 400 })
    }

    const model = await getSetting<string>("gemini_model", DEFAULT_GEMINI_MODEL)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(from, to, data) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      },
    )

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      console.error("gemini error:", response.status, detail.slice(0, 500))
      const hint =
        response.status === 404
          ? ` El modelo "${model}" no existe o no está disponible — cámbialo en Configuración.`
          : response.status === 400 || response.status === 403
            ? " Revisa que la GEMINI_API_KEY sea válida."
            : ""
      return NextResponse.json({ error: `Gemini respondió ${response.status}.${hint}` }, { status: 502 })
    }

    const payload = await response.json()
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

    const parsed = kindSchemas[kind as SectionKind].safeParse(translated)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return NextResponse.json(
        {
          error: `La traducción no pasó la validación (${issue.path.join(".")}: ${issue.message}). Completa los campos vacíos del idioma origen e intenta de nuevo.`,
        },
        { status: 422 },
      )
    }

    return NextResponse.json({ ok: true, data: parsed.data, model })
  } catch (error) {
    console.error("translate:", error)
    return NextResponse.json({ error: "Error al traducir" }, { status: 500 })
  }
}
