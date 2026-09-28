import { headers as nextHeaders } from "next/headers"
import { sql } from "@/lib/db"
import { getSetting } from "@/lib/settings"
import { getClientIp, getCountry, getUserAgent, hashIp, ipOrNull } from "@/lib/request-ip"

// Dos registros distintos:
//  - visitor_events  → módulo Analytics (qué hacen los visitantes del sitio público)
//  - admin_audit     → módulo Bitácora (quién hizo qué en el panel, desde qué IP)
// Ambos con purga automática por retención (settings) ejecutada de forma oportunista.

export const SETTING_VISITOR_RETENTION = "activity_retention_days"
export const SETTING_AUDIT_RETENTION = "audit_retention_days"
export const SETTING_CHAT_RETENTION = "chat_retention_days"
export const DEFAULT_VISITOR_RETENTION_DAYS = 90
export const DEFAULT_AUDIT_RETENTION_DAYS = 365
// 0 = las preguntas del chat se conservan siempre (así era antes). Borrar ese historial
// lo decide el admin, no un valor por defecto.
export const DEFAULT_CHAT_RETENTION_DAYS = 0

export type VisitorKind = "pageview" | "section" | "click" | "scroll" | "leave" | "chat" | "contact"

export interface VisitorEventInput {
  kind: VisitorKind
  path: string
  locale?: string
  sessionId?: string | null
  props?: Record<string, unknown>
}

export interface RequestMeta {
  ip: string
  country: string
  ua: string
  referrer: string
}

export function metaFromHeaders(h: Headers): RequestMeta {
  return {
    ip: getClientIp(h),
    country: getCountry(h),
    ua: getUserAgent(h),
    referrer: (h.get("referer") ?? "").slice(0, 300),
  }
}

// Id de sesión que manda el cliente (sessionStorage) en las llamadas a APIs propias.
export function sessionIdFromHeaders(h: Headers): string | null {
  const s = h.get("x-session-id") ?? ""
  return /^[a-zA-Z0-9_-]{8,64}$/.test(s) ? s : null
}

export async function recordVisitorEvents(events: VisitorEventInput[], meta: RequestMeta): Promise<number> {
  if (!events.length) return 0
  const ip = ipOrNull(meta.ip)
  const ipHash = ip ? hashIp(meta.ip) : null
  const rows = events.map((e) => ({
    session_id: e.sessionId ?? null,
    kind: e.kind,
    path: e.path.slice(0, 300),
    locale: (e.locale ?? "").slice(0, 5),
    ip,
    ip_hash: ipHash,
    country: meta.country,
    ua: meta.ua,
    referrer: String((e.props?.ref as string | undefined) ?? meta.referrer).slice(0, 300),
    props: sql.json((e.props ?? {}) as never),
  }))
  await sql`
    insert into visitor_events ${sql(rows, "session_id", "kind", "path", "locale", "ip", "ip_hash", "country", "ua", "referrer", "props")}
  `
  return rows.length
}

// Evento de visitante generado en el servidor (chat, contacto). Nunca lanza.
export async function trackServerEvent(h: Headers, event: VisitorEventInput): Promise<void> {
  try {
    await recordVisitorEvents([{ ...event, sessionId: event.sessionId ?? sessionIdFromHeaders(h) }], metaFromHeaders(h))
  } catch (error) {
    console.error("trackServerEvent:", error)
  }
}

export interface AuditInput {
  actor: string | null
  action: string
  target?: string
  ok?: boolean
  detail?: Record<string, unknown>
  /** Headers explícitos (route handlers). En server actions se leen solos con next/headers. */
  headers?: Headers
}

// Registro en la bitácora del admin. Nunca lanza: un fallo de log no debe romper la acción.
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const h = input.headers ?? (await nextHeaders())
    const ip = getClientIp(h)
    await sql`
      insert into admin_audit (actor, action, target, ok, ip, country, ua, detail)
      values (${input.actor}, ${input.action}, ${(input.target ?? "").slice(0, 300)}, ${input.ok ?? true},
              ${ipOrNull(ip)}, ${getCountry(h)}, ${getUserAgent(h)}, ${sql.json((input.detail ?? {}) as never)})
    `
  } catch (error) {
    console.error("logAudit:", error)
  }
}

export async function purgeActivity(): Promise<{
  visitors: number
  audit: number
  chat: number
  guard: number
  visitorDays: number
  auditDays: number
  chatDays: number
}> {
  const [visitorDays, auditDays, chatDays] = await Promise.all([
    getSetting<number>(SETTING_VISITOR_RETENTION, DEFAULT_VISITOR_RETENTION_DAYS),
    getSetting<number>(SETTING_AUDIT_RETENTION, DEFAULT_AUDIT_RETENTION_DAYS),
    getSetting<number>(SETTING_CHAT_RETENTION, DEFAULT_CHAT_RETENTION_DAYS),
  ])
  const v = await sql`delete from visitor_events where ts < now() - make_interval(days => ${visitorDays})`
  const a = await sql`delete from admin_audit where ts < now() - make_interval(days => ${auditDays})`
  // Los eventos de guardrails siguen la retención de la analítica de visitantes.
  const g = await sql`delete from chat_guard_events where bucket < now() - make_interval(days => ${visitorDays})`
  const c =
    chatDays > 0
      ? await sql`delete from chat_questions where created_at < now() - make_interval(days => ${chatDays})`
      : { count: 0 }
  return { visitors: v.count, audit: a.count, chat: c.count, guard: g.count, visitorDays, auditDays, chatDays }
}

// Purga oportunista: ~1 de cada 100 lotes ingeridos (sin cron ni infraestructura extra).
export function maybePurge(): void {
  if (Math.random() >= 0.01) return
  purgeActivity()
    .then((r) => {
      if (r.visitors || r.audit || r.chat || r.guard)
        console.log(`activity purge: ${r.visitors} eventos, ${r.audit} auditoría, ${r.chat} preguntas, ${r.guard} guardrails`)
    })
    .catch((error) => console.error("activity purge:", error))
}
