import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { DEFAULT_GEMINI_FALLBACK_MODEL, DEFAULT_GEMINI_MODEL, getSetting } from "@/lib/settings"
import { getKnowledgeBase } from "@/lib/chat/knowledge"
import { SETTING_FALLBACK, extractApiMessage, generateContent } from "@/lib/gemini"
import { getClientIp, hashIp, rateKey } from "@/lib/request-ip"
import { trackServerEvent } from "@/lib/activity"
import {
  CHAT_OUTPUT,
  CHAT_SAFETY_SETTINGS,
  CHAT_TIMEOUT_MS,
  DEFAULT_CHAT_DAILY_LIMIT,
  DEFAULT_CHAT_GLOBAL_LIMIT,
  SETTING_CHAT_ALLOWLIST,
  SETTING_CHAT_DAILY_LIMIT,
  SETTING_CHAT_GLOBAL_LIMIT,
  buildSystemInstruction,
  chatMessages,
  chatSchema,
  interpretCandidate,
  isClientCausedUpstreamError,
} from "@/lib/chat/guardrails"
import { logGuardEvent } from "@/lib/chat/guard-events"

// Los guardrails (reglas, límites, filtros) viven en lib/chat/guardrails.ts, que es
// también lo que enseña la página Guardrails del admin.
//
// La IP del chat se guarda solo seudonimizada (HMAC, ver lib/request-ip). Para el
// límite se usa net_hash: la misma IP en IPv4, el prefijo /64 en IPv6.

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  const ipHash = hashIp(ip)
  let locale: "en" | "es" = "en"
  let reservedId: string | null = null

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Chat is not available right now." }, { status: 503 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      void logGuardEvent({ kind: "invalid_input", ipHash, detail: { reason: "json" } })
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const parsed = chatSchema.safeParse(body)
    if (!parsed.success) {
      // Solo la forma del error, nunca el contenido de lo que mandaron.
      const issues = parsed.error.issues.slice(0, 3).map((i) => ({ path: i.path.join("."), code: i.code }))
      void logGuardEvent({ kind: "invalid_input", ipHash, detail: { issues } })
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { message, history } = parsed.data
    locale = parsed.data.locale
    const msg = chatMessages(locale)

    const [allowlist, dailyLimit, globalLimit] = await Promise.all([
      getSetting<string[]>(SETTING_CHAT_ALLOWLIST, []),
      getSetting<number>(SETTING_CHAT_DAILY_LIMIT, DEFAULT_CHAT_DAILY_LIMIT),
      getSetting<number>(SETTING_CHAT_GLOBAL_LIMIT, DEFAULT_CHAT_GLOBAL_LIMIT),
    ])

    // Interruptor: tope global en 0 = chat apagado desde el admin, sin tocar secretos.
    if (globalLimit === 0) {
      void logGuardEvent({ kind: "limit_global", ipHash, locale, detail: { off: true } })
      return NextResponse.json({ error: msg.offline, offline: true }, { status: 503 })
    }

    // Admisión: contar y reservar en una sola transacción, bajo un candado. Antes se
    // contaba primero y se insertaba solo si la respuesta salía bien, así que varias
    // peticiones simultáneas pasaban todas y los fallos no contaban nunca. La fila se
    // reserva como 'pending' ANTES de llamar a Gemini y se cierra con su desenlace.
    const netHash = hashIp(rateKey(ip))
    const isAllowlisted = allowlist.includes(ip)
    const admission = await sql.begin(async (tx) => {
      // Un solo candado para todas las admisiones: contar e insertar pasa a ser atómico,
      // sin carreras ni en el límite por IP ni en el global, y una petición denegada no
      // llega a insertar nada. Cada admisión tarda milisegundos y la llamada a Gemini va
      // fuera de la transacción, así que serializarlas no se nota. lock_timeout evita
      // que una espera se quede colgada si la base va lenta.
      await tx`set local lock_timeout = '3s'`
      await tx`select pg_advisory_xact_lock(hashtext('chat_admission'))`
      // Las filas 'error' (caídas y cuota de Google) no cuentan: no debe pagarlas el
      // visitante. Las que él sí pudo provocar se guardan como 'rejected' y cuentan.
      const [usage] = await tx<{ mine: number; total: number }[]>`
        -- coalesce: las filas que escribió el código anterior no traen net_hash.
        select count(*) filter (where coalesce(net_hash, ip_hash) = ${netHash})::int as mine, count(*)::int as total
        from chat_questions
        where created_at > now() - interval '24 hours' and outcome <> 'error'
      `
      if (!isAllowlisted && usage.mine >= dailyLimit) return { denied: "ip" as const, used: usage.mine }
      if (usage.total >= globalLimit) return { denied: "global" as const, total: usage.total }
      const [row] = await tx<{ id: string }[]>`
        insert into chat_questions (ip_hash, net_hash, locale, question, outcome, history_turns)
        values (${ipHash}, ${netHash}, ${locale}, ${message}, 'pending', ${history.length})
        returning id
      `
      return { denied: null, id: row.id, mine: usage.mine + 1 }
    })

    if (admission.denied === "ip") {
      void logGuardEvent({ kind: "limit_ip", ipHash, locale, detail: { limit: dailyLimit, used: admission.used } })
      return NextResponse.json({ error: msg.limitIp(dailyLimit), limitReached: true }, { status: 429 })
    }
    if (admission.denied === "global") {
      void logGuardEvent({ kind: "limit_global", ipHash, locale, detail: { limit: globalLimit, total: admission.total } })
      return NextResponse.json({ error: msg.offline, offline: true }, { status: 503 })
    }
    reservedId = admission.id
    const remaining = isAllowlisted ? -1 : dailyLimit - admission.mine // -1 = ilimitado

    const [kb, model, fallbackModel] = await Promise.all([
      getKnowledgeBase(),
      getSetting<string>("gemini_model", DEFAULT_GEMINI_MODEL),
      getSetting<string>(SETTING_FALLBACK, DEFAULT_GEMINI_FALLBACK_MODEL),
    ])

    const contents = [
      ...history.map((h) => ({ role: h.role, parts: [{ text: h.content }] })),
      { role: "user", parts: [{ text: message }] },
    ]

    const outcome = await generateContent({
      apiKey,
      model,
      fallbackModel,
      context: "chat",
      timeoutMs: CHAT_TIMEOUT_MS,
      body: {
        systemInstruction: { parts: [{ text: buildSystemInstruction(kb.text) }] },
        contents,
        generationConfig: CHAT_OUTPUT,
        safetySettings: CHAT_SAFETY_SETTINGS,
      },
    })

    if (!outcome.ok) {
      console.error("chat gemini error:", outcome.status, outcome.detail.slice(0, 300))
      const clientCaused = isClientCausedUpstreamError(outcome.status, outcome.detail)
      await settle(reservedId, {
        outcome: clientCaused ? "rejected" : "error",
        model: outcome.model,
        finishReason: `http_${outcome.status}`,
      })
      void logGuardEvent({
        kind: "upstream_error",
        ipHash,
        locale,
        model: outcome.model,
        status: outcome.status,
        detail: { message: extractApiMessage(outcome.detail), clientCaused },
      })
      return NextResponse.json({ error: msg.unavailable }, { status: 502 })
    }
    if (outcome.fellBack) {
      void logGuardEvent({ kind: "fallback", ipHash, locale, model: outcome.model, detail: { from: model, to: outcome.model } })
    }

    const result = interpretCandidate(outcome.payload)
    const base = { model: outcome.model, finishReason: result.finishReason, usage: result.usage }

    if (result.kind === "empty") {
      console.error("chat empty answer:", outcome.model, result.finishReason, JSON.stringify(result.usage))
      await settle(reservedId, { ...base, outcome: "empty" })
      return NextResponse.json({ error: msg.empty }, { status: 502 })
    }

    // Bloqueo de Google: se responde con una negativa normal (200), no con un error.
    // El visitante ve una respuesta coherente y la fila queda marcada como "blocked".
    const answer = result.kind === "blocked" ? msg.blocked : result.text
    await settle(reservedId, { ...base, outcome: result.kind, answer: result.kind === "blocked" ? "" : answer })
    reservedId = null

    void trackServerEvent(request.headers, {
      kind: "chat",
      path: locale === "es" ? "/es/chat" : "/chat",
      locale,
      props: { model: outcome.model, fellBack: outcome.fellBack, remaining, outcome: result.kind },
    })

    return NextResponse.json({ answer, remaining, ...(result.kind === "blocked" ? { blocked: true } : {}) })
  } catch (error) {
    console.error("chat:", error)
    if (reservedId) await settle(reservedId, { outcome: "error", finishReason: "internal" })
    void logGuardEvent({ kind: "internal_error", ipHash, locale, detail: { message: String(error).slice(0, 200) } })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Cierra la reserva con el desenlace real. Si falla, la fila se queda en "pending" y
// sigue contando para el límite, que es el lado seguro.
async function settle(
  id: string | null,
  r: {
    outcome: "answered" | "truncated" | "blocked" | "empty" | "rejected" | "error"
    model?: string
    finishReason?: string
    answer?: string
    usage?: { in: number | null; out: number | null; thought: number | null }
  },
): Promise<void> {
  if (!id) return
  try {
    await sql`
      update chat_questions
      set outcome = ${r.outcome},
          answer = ${(r.answer ?? "").slice(0, 4000)},
          model = ${r.model ?? ""},
          finish_reason = ${r.finishReason ?? ""},
          tokens_in = ${r.usage?.in ?? null},
          tokens_out = ${r.usage?.out ?? null},
          tokens_thought = ${r.usage?.thought ?? null}
      where id = ${id}
    `
  } catch (error) {
    console.error("chat settle:", error)
  }
}
