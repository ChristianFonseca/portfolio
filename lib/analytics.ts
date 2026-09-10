import { isIP } from "net"
import { sql } from "@/lib/db"

// Consultas de los módulos Analytics (visitor_events) y Bitácora (admin_audit).
// Todo parametrizado; los filtros vienen de searchParams ya saneados aquí.

export type Range = "24h" | "7d" | "30d" | "90d"
export const RANGE_HOURS: Record<Range, number> = { "24h": 24, "7d": 168, "30d": 720, "90d": 2160 }
export const RANGE_LABEL: Record<Range, string> = { "24h": "24 horas", "7d": "7 días", "30d": "30 días", "90d": "90 días" }
export const TZ = "America/Lima"
export const PAGE_SIZE = 50

type SP = Record<string, string | undefined>

export function parseRange(v: string | undefined): Range {
  return v && v in RANGE_HOURS ? (v as Range) : "7d"
}
const clean = (v: string | undefined, re: RegExp, max = 100) => (v && re.test(v) ? v.slice(0, max) : undefined)
export function parsePage(v: string | undefined): number {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : 1
}

// ---------- Analytics ----------

export type Device = "all" | "mobile" | "tablet" | "desktop"

export interface VisitorFilter {
  range: Range
  kind?: string
  country?: string
  ip?: string
  sid?: string
  path?: string
}

export function parseVisitorFilter(sp: SP): VisitorFilter {
  const ip = clean(sp.ip, /^[0-9a-fA-F:.]{3,45}$/)
  return {
    range: parseRange(sp.range),
    kind: clean(sp.kind, /^[a-z_]{1,20}$/),
    country: clean(sp.country, /^[A-Za-z0-9]{2}$/)?.toUpperCase(),
    ip: ip && isIP(ip) ? ip : undefined,
    sid: clean(sp.sid, /^[a-zA-Z0-9_-]{8,64}$/),
    path: clean(sp.path, /^\/[a-zA-Z0-9\-._~\/%]{0,200}$/, 300),
  }
}

export function parseDevice(v: string | undefined): Device {
  return v === "mobile" || v === "tablet" || v === "desktop" ? v : "all"
}

// Fragmento WHERE reutilizable (tabla, conteo y CSV comparten exactamente el mismo filtro).
function whereVisitors(f: VisitorFilter) {
  return sql`
    where ts > now() - make_interval(hours => ${RANGE_HOURS[f.range]})
    ${f.kind ? sql`and kind = ${f.kind}` : sql``}
    ${f.country ? sql`and country = ${f.country}` : sql``}
    ${f.ip ? sql`and ip = ${f.ip}::inet` : sql``}
    ${f.sid ? sql`and session_id = ${f.sid}` : sql``}
    ${f.path ? sql`and path = ${f.path}` : sql``}
  `
}

export interface VisitorRow {
  id: number
  ts: string
  session_id: string | null
  kind: string
  path: string
  locale: string
  ip: string | null
  country: string
  ua: string
  referrer: string
  props: Record<string, unknown>
}

export async function listVisitorEvents(f: VisitorFilter, page: number): Promise<VisitorRow[]> {
  const offset = (page - 1) * PAGE_SIZE
  // Dentro de una sesión se lee en orden cronológico (línea de tiempo).
  return f.sid
    ? sql<VisitorRow[]>`
        select id, to_char(ts at time zone ${TZ}, 'DD Mon HH24:MI:SS') as ts, session_id, kind, path, locale,
               host(ip) as ip, country, ua, referrer, props
        from visitor_events ${whereVisitors(f)} order by ts asc limit ${PAGE_SIZE} offset ${offset}
      `
    : sql<VisitorRow[]>`
        select id, to_char(ts at time zone ${TZ}, 'DD Mon HH24:MI:SS') as ts, session_id, kind, path, locale,
               host(ip) as ip, country, ua, referrer, props
        from visitor_events ${whereVisitors(f)} order by ts desc limit ${PAGE_SIZE} offset ${offset}
      `
}

export async function countVisitorEvents(f: VisitorFilter): Promise<number> {
  const r = await sql<{ n: string }[]>`select count(*) as n from visitor_events ${whereVisitors(f)}`
  return Number(r[0]?.n ?? 0)
}

export async function exportVisitorEvents(f: VisitorFilter): Promise<VisitorRow[]> {
  return sql<VisitorRow[]>`
    select id, to_char(ts at time zone ${TZ}, 'YYYY-MM-DD HH24:MI:SS') as ts, session_id, kind, path, locale,
           host(ip) as ip, country, ua, referrer, props
    from visitor_events ${whereVisitors(f)} order by ts desc limit 20000
  `
}

export interface VisitorStats {
  pageviews: number
  sessions: number
  ips: number
  chats: number
  contacts: number
  avg_ms: number
  clicks: number
}

export async function visitorStats(range: Range): Promise<VisitorStats> {
  const r = await sql<Record<keyof VisitorStats, string>[]>`
    select count(*) filter (where kind = 'pageview') as pageviews,
           count(distinct session_id) filter (where kind = 'pageview') as sessions,
           count(distinct ip) as ips,
           count(*) filter (where kind = 'chat') as chats,
           count(*) filter (where kind = 'contact' and props->>'ok' = 'true') as contacts,
           coalesce(avg(nullif(props->>'ms', '')::numeric) filter (where kind = 'leave'), 0)::int as avg_ms,
           count(*) filter (where kind = 'click') as clicks
    from visitor_events where ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
  `
  const row = r[0]
  const num = (k: keyof VisitorStats) => Number(row?.[k] ?? 0)
  return {
    pageviews: num("pageviews"),
    sessions: num("sessions"),
    ips: num("ips"),
    chats: num("chats"),
    contacts: num("contacts"),
    avg_ms: num("avg_ms"),
    clicks: num("clicks"),
  }
}

export interface Rank {
  label: string
  n: number
}
const toRank = (rows: { label: string | null; n: string }[]): Rank[] =>
  rows.map((r) => ({ label: r.label ?? "", n: Number(r.n) }))

export async function topPages(range: Range): Promise<Rank[]> {
  return toRank(
    await sql`select path as label, count(*) as n from visitor_events
      where kind = 'pageview' and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
      group by path order by n desc limit 10`,
  )
}

export async function topCountries(range: Range): Promise<Rank[]> {
  return toRank(
    await sql`select country as label, count(distinct session_id) as n from visitor_events
      where kind = 'pageview' and country <> '' and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
      group by country order by n desc limit 10`,
  )
}

export async function topReferrers(range: Range): Promise<Rank[]> {
  return toRank(
    await sql`select host as label, count(*) as n from (
        select substring(referrer from '^[a-z]+://([^/]+)') as host from visitor_events
        where kind = 'pageview' and referrer <> '' and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
      ) s where host is not null and host not like '%christianfonseca.dev%'
      group by host order by n desc limit 10`,
  )
}

export async function devices(range: Range): Promise<Rank[]> {
  return toRank(
    await sql`select case when vw < 640 then 'móvil' when vw < 1024 then 'tablet' else 'escritorio' end as label,
                     count(*) as n
      from (select nullif(props->>'vw', '')::int as vw from visitor_events
            where kind = 'pageview' and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})) s
      where vw is not null group by 1 order by n desc`,
  )
}

export async function locales(range: Range): Promise<Rank[]> {
  return toRank(
    await sql`select locale as label, count(*) as n from visitor_events
      where kind = 'pageview' and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
      group by locale order by n desc`,
  )
}

export async function topClicks(range: Range): Promise<Rank[]> {
  return toRank(
    await sql`select coalesce(nullif(props->>'tr', ''), nullif(props->>'tx', ''), nullif(props->>'hr', ''), props->>'el') as label,
                     count(*) as n
      from visitor_events where kind = 'click' and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
      group by 1 order by n desc limit 15`,
  )
}

export interface SectionDwell {
  id: string
  views: number
  avg_ms: number
}

export async function sectionDwell(range: Range): Promise<SectionDwell[]> {
  const rows = await sql<{ id: string; views: string; avg_ms: string }[]>`
    select props->>'id' as id, count(*) as views, avg(nullif(props->>'ms', '')::numeric)::int as avg_ms
    from visitor_events where kind = 'section' and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
    group by 1 order by views desc limit 12
  `
  return rows.map((r) => ({ id: r.id, views: Number(r.views), avg_ms: Number(r.avg_ms) }))
}

export interface HeatPoint {
  x: number
  y: number
  vw: number
  ph: number
}

export async function heatmapPoints(range: Range, path: string, device: Device): Promise<HeatPoint[]> {
  const rows = await sql<{ x: string; y: string; vw: string; ph: string }[]>`
    select props->>'x' as x, props->>'y' as y, props->>'vw' as vw, props->>'ph' as ph
    from visitor_events
    where kind = 'click' and path = ${path} and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
      and props ? 'x' and props ? 'y'
      ${
        device === "mobile"
          ? sql`and nullif(props->>'vw', '')::int < 640`
          : device === "tablet"
            ? sql`and nullif(props->>'vw', '')::int >= 640 and nullif(props->>'vw', '')::int < 1024`
            : device === "desktop"
              ? sql`and nullif(props->>'vw', '')::int >= 1024`
              : sql``
      }
    order by ts desc limit 5000
  `
  return rows.map((r) => ({ x: Number(r.x), y: Number(r.y), vw: Number(r.vw) || 0, ph: Number(r.ph) || 0 }))
}

export async function heatmapPaths(range: Range): Promise<Rank[]> {
  return toRank(
    await sql`select path as label, count(*) as n from visitor_events
      where kind = 'click' and ts > now() - make_interval(hours => ${RANGE_HOURS[range]})
      group by path order by n desc limit 12`,
  )
}

// ---------- Bitácora ----------

export interface AuditFilter {
  range: Range
  actor?: string
  action?: string
  ip?: string
  ok?: "true" | "false"
}

export function parseAuditFilter(sp: SP): AuditFilter {
  const ip = clean(sp.ip, /^[0-9a-fA-F:.]{3,45}$/)
  return {
    range: parseRange(sp.range),
    actor: clean(sp.actor, /^[^\s]{1,320}$/, 320),
    action: clean(sp.action, /^[a-z_.]{1,40}$/),
    ip: ip && isIP(ip) ? ip : undefined,
    ok: sp.ok === "true" || sp.ok === "false" ? sp.ok : undefined,
  }
}

function whereAudit(f: AuditFilter) {
  return sql`
    where ts > now() - make_interval(hours => ${RANGE_HOURS[f.range]})
    ${f.actor ? sql`and actor ilike ${"%" + f.actor + "%"}` : sql``}
    ${f.action ? sql`and action = ${f.action}` : sql``}
    ${f.ip ? sql`and ip = ${f.ip}::inet` : sql``}
    ${f.ok ? sql`and ok = ${f.ok === "true"}` : sql``}
  `
}

export interface AuditRow {
  id: number
  ts: string
  actor: string | null
  action: string
  target: string
  ok: boolean
  ip: string | null
  country: string
  ua: string
  detail: Record<string, unknown>
}

export async function listAudit(f: AuditFilter, page: number): Promise<AuditRow[]> {
  const offset = (page - 1) * PAGE_SIZE
  return sql<AuditRow[]>`
    select id, to_char(ts at time zone ${TZ}, 'DD Mon HH24:MI:SS') as ts, actor, action, target, ok,
           host(ip) as ip, country, ua, detail
    from admin_audit ${whereAudit(f)} order by ts desc limit ${PAGE_SIZE} offset ${offset}
  `
}

export async function countAudit(f: AuditFilter): Promise<number> {
  const r = await sql<{ n: string }[]>`select count(*) as n from admin_audit ${whereAudit(f)}`
  return Number(r[0]?.n ?? 0)
}

export async function exportAudit(f: AuditFilter): Promise<AuditRow[]> {
  return sql<AuditRow[]>`
    select id, to_char(ts at time zone ${TZ}, 'YYYY-MM-DD HH24:MI:SS') as ts, actor, action, target, ok,
           host(ip) as ip, country, ua, detail
    from admin_audit ${whereAudit(f)} order by ts desc limit 20000
  `
}

export interface AuditStats {
  today: number
  week: number
  failed_logins_week: number
  actors_week: number
}

export async function auditStats(): Promise<AuditStats> {
  const r = await sql<Record<keyof AuditStats, string>[]>`
    select count(*) filter (where ts > now() - interval '24 hours') as today,
           count(*) filter (where ts > now() - interval '7 days') as week,
           count(*) filter (where ts > now() - interval '7 days' and action in ('login.fail', 'login.limited')) as failed_logins_week,
           count(distinct actor) filter (where ts > now() - interval '7 days' and actor is not null) as actors_week
    from admin_audit
  `
  const row = r[0]
  return {
    today: Number(row?.today ?? 0),
    week: Number(row?.week ?? 0),
    failed_logins_week: Number(row?.failed_logins_week ?? 0),
    actors_week: Number(row?.actors_week ?? 0),
  }
}

export async function topActions(range: Range): Promise<Rank[]> {
  return toRank(
    await sql`select action as label, count(*) as n from admin_audit
      where ts > now() - make_interval(hours => ${RANGE_HOURS[range]}) group by action order by n desc limit 12`,
  )
}

// ---------- CSV ----------

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [columns.join(",")]
  for (const r of rows) lines.push(columns.map((c) => esc(r[c])).join(","))
  return "﻿" + lines.join("\r\n")
}

// Query string preservando filtros (para paginación y enlaces de filtro).
export function qs(base: Record<string, string | number | undefined>, patch: Record<string, string | number | undefined> = {}): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...base, ...patch })) {
    if (v !== undefined && v !== "" && v !== null) p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ""
}
