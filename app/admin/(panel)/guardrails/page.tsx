import Link from "next/link"
import { redirect } from "next/navigation"
import { ExternalLink, Power, ShieldCheck } from "lucide-react"
import { getSessionUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { DEFAULT_GEMINI_MODEL, getSetting } from "@/lib/settings"
import { getKnowledgeBase } from "@/lib/chat/knowledge"
import {
  DEFAULT_CHAT_DAILY_LIMIT,
  DEFAULT_CHAT_GLOBAL_LIMIT,
  SETTING_CHAT_ALLOWLIST,
  SETTING_CHAT_DAILY_LIMIT,
  SETTING_CHAT_GLOBAL_LIMIT,
  buildSystemInstruction,
  describeGuardrails,
  type Enforcer,
  type GuardrailRow,
} from "@/lib/chat/guardrails"
import { GUARD_KIND_LABEL, type GuardKind } from "@/lib/chat/guard-events"
import { DEFAULT_CHAT_RETENTION_DAYS, SETTING_CHAT_RETENTION } from "@/lib/activity"

export const dynamic = "force-dynamic"

const RANGES = { "24h": { hours: 24, label: "24 h" }, "7d": { hours: 168, label: "7 días" }, "30d": { hours: 720, label: "30 días" } }
type RangeKey = keyof typeof RANGES

const ENFORCER: Record<Enforcer, { label: string; hint: string; className: string }> = {
  code: {
    label: "Código",
    hint: "Lo aplica el servidor. Se cumple siempre.",
    className: "border-emerald-500/40 text-emerald-600 dark:text-emerald-300",
  },
  model: {
    label: "Instrucción al modelo",
    hint: "Se le pide a Gemini en el prompt. Nada comprueba que la cumpla.",
    className: "border-yellow-500/40 text-yellow-700 dark:text-yellow-300",
  },
  google: {
    label: "Google",
    hint: "Filtros de Gemini. Si actúan, la pregunta queda como “Bloqueada por Google”.",
    className: "border-sky-500/40 text-sky-600 dark:text-sky-300",
  },
}

const fmtTs = (d: Date) =>
  d.toLocaleString("es", { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" })

function Tile({ label, value, sub, warn }: { label: string; value: number; sub?: string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${warn && value > 0 ? "border-red-500/40 bg-red-500/5" : "border-border bg-card/40"}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{sub}</p>}
    </div>
  )
}

function EditCell({ row }: { row: GuardrailRow }) {
  if (row.edit === "config")
    return (
      <Link href="/config" className="text-primary hover:underline">
        Configuración
      </Link>
    )
  if (row.edit === "google") return <span className="text-muted-foreground/70">No ajustable</span>
  return <span className="text-muted-foreground/70">Código (commit y deploy)</span>
}

export default async function GuardrailsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") redirect("/")

  const { range: rangeParam } = await searchParams
  const range: RangeKey = rangeParam && rangeParam in RANGES ? (rangeParam as RangeKey) : "7d"
  const hours = RANGES[range].hours

  const [dailyLimit, globalLimit, allowlist, retentionDays, model, kb] = await Promise.all([
    getSetting<number>(SETTING_CHAT_DAILY_LIMIT, DEFAULT_CHAT_DAILY_LIMIT),
    getSetting<number>(SETTING_CHAT_GLOBAL_LIMIT, DEFAULT_CHAT_GLOBAL_LIMIT),
    getSetting<string[]>(SETTING_CHAT_ALLOWLIST, []),
    getSetting<number>(SETTING_CHAT_RETENTION, DEFAULT_CHAT_RETENTION_DAYS),
    getSetting<string>("gemini_model", DEFAULT_GEMINI_MODEL),
    getKnowledgeBase(),
  ])

  let outcomes: Record<string, number> = {}
  let guard: Partial<Record<GuardKind, { hits: number; ips: number; quota: number }>> = {}
  let used24h = 0
  let recent: {
    kind: GuardKind
    ip_hash: string
    n: number
    first_ts: Date
    last_ts: Date
    model: string
    status: number
    detail: Record<string, unknown>
  }[] = []
  let dbError = false
  try {
    const [o, g, u, r] = await Promise.all([
      sql<{ outcome: string; n: number }[]>`
        select outcome, count(*)::int as n from chat_questions
        where created_at > now() - make_interval(hours => ${hours}) and outcome <> 'pending'
        group by outcome
      `,
      sql<{ kind: GuardKind; hits: number; ips: number; quota: number }[]>`
        select kind, sum(n)::int as hits, count(distinct nullif(ip_hash, ''))::int as ips,
               coalesce(sum(n) filter (where status = 429), 0)::int as quota
        from chat_guard_events
        where last_ts > now() - make_interval(hours => ${hours})
        group by kind
      `,
      sql<{ n: number }[]>`
        select count(*)::int as n from chat_questions
        where created_at > now() - interval '24 hours' and outcome <> 'error'
      `,
      sql<typeof recent>`
        select kind, ip_hash, n, first_ts, last_ts, model, status, detail from chat_guard_events
        order by last_ts desc limit 50
      `,
    ])
    outcomes = Object.fromEntries(o.map((x) => [x.outcome, x.n]))
    guard = Object.fromEntries(g.map((x) => [x.kind, x]))
    used24h = u[0]?.n ?? 0
    recent = r
  } catch (error) {
    console.error("admin guardrails:", error)
    dbError = true
  }

  const rows = describeGuardrails({ dailyLimit, allowlistCount: allowlist.length, globalLimit, retentionDays })
  const groups = (["code", "model", "google"] as Enforcer[]).map((e) => ({ enforcer: e, rows: rows.filter((r) => r.enforcer === e) }))
  const off = globalLimit === 0
  const g = (k: GuardKind) => guard[k] ?? { hits: 0, ips: 0, quota: 0 }

  return (
    <div className="max-w-5xl">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <ShieldCheck className="h-6 w-6 text-primary" />
        Guardrails
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Qué protege al asistente Syn, quién lo hace cumplir y cuándo actuó. La lista sale de las mismas constantes que
        usa el chat, así que no puede quedar desactualizada.
      </p>

      {/* Estado */}
      <div
        className={`mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border px-5 py-4 ${
          off ? "border-red-500/40 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"
        }`}
      >
        <p className={`flex items-center gap-2 text-sm font-semibold ${off ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
          <Power className="h-4 w-4" />
          {off ? "Chat apagado" : "Chat activo"}
        </p>
        {!off && (
          <p className="text-sm text-muted-foreground">
            Últimas 24 h: <b className="tabular-nums text-foreground">{used24h}</b> de {globalLimit} preguntas (tope global)
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Modelo: <span className="font-mono text-foreground">{model}</span>
        </p>
        <Link href="/config" className="ml-auto text-xs font-semibold text-primary hover:underline">
          {off ? "Encender en Configuración" : "Apagar o cambiar límites en Configuración"}
        </Link>
      </div>

      {/* Cuándo actuaron */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold">Cuándo actuaron</h2>
        <div className="ml-auto flex gap-1">
          {(Object.keys(RANGES) as RangeKey[]).map((k) => (
            <Link
              key={k}
              href={`/guardrails?range=${k}`}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                k === range ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {RANGES[k].label}
            </Link>
          ))}
        </div>
      </div>
      {dbError ? (
        <p className="mb-8 text-sm text-red-400">No se pudo conectar a la base de datos.</p>
      ) : (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile label="Respondidas" value={(outcomes.answered ?? 0) + (outcomes.truncated ?? 0)} sub={outcomes.truncated ? `${outcomes.truncated} cortadas por largo` : undefined} />
          <Tile label="Límite por IP alcanzado" value={g("limit_ip").hits} sub={g("limit_ip").ips ? `${g("limit_ip").ips} IP distintas` : undefined} warn />
          <Tile label="Bloqueadas por Google" value={outcomes.blocked ?? 0} warn />
          <Tile label="Tope global / chat apagado" value={g("limit_global").hits} warn />
          <Tile label="Sin respuesta del modelo" value={outcomes.empty ?? 0} warn />
          <Tile label="Errores de Gemini" value={g("upstream_error").hits} sub={g("upstream_error").quota ? `${g("upstream_error").quota} por cuota agotada` : undefined} warn />
          <Tile label="Peticiones inválidas" value={g("invalid_input").hits} />
          <Tile label="Respondió el modelo de respaldo" value={g("fallback").hits} />
        </div>
      )}

      {/* Qué hay activo */}
      <h2 className="mb-1 text-sm font-semibold">Qué hay activo</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        La diferencia importa: lo que aplica el código se cumple siempre; una instrucción al modelo es una petición a
        Gemini que un usuario insistente puede llegar a torcer.
      </p>
      <div className="mb-8 space-y-4">
        {groups.map(({ enforcer, rows: list }) => (
          <div key={enforcer} className="overflow-hidden rounded-2xl border border-border bg-card/40">
            <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-2.5">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${ENFORCER[enforcer].className}`}>
                {ENFORCER[enforcer].label}
              </span>
              <span className="text-xs text-muted-foreground">{ENFORCER[enforcer].hint}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 last:border-0 align-top">
                    <td className="px-4 py-2.5">
                      <p>{r.name}</p>
                      {r.note && <p className="text-[11px] text-muted-foreground/70">{r.note}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.value}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs">
                      <EditCell row={r} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="rounded-2xl border border-dashed border-border px-4 py-3">
          <p className="mb-2 text-xs font-semibold">Fuera de la app (no se puede comprobar desde aquí)</p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>
              <b className="text-foreground">Cuota diaria y alerta de presupuesto en Google Cloud</b> — el techo real de
              gasto, cubre cualquier fallo de la app.{" "}
              <a
                href="https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                Cuotas <ExternalLink className="h-3 w-3" />
              </a>{" "}
              ·{" "}
              <a
                href="https://console.cloud.google.com/billing/budgets"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                Presupuestos <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <b className="text-foreground">Regla de rate limit de Cloudflare</b> para <code>POST /api/chat</code>{" "}
              (unas 5 peticiones cada 10 s por IP) — frena ráfagas antes de que lleguen al servidor.{" "}
              <a
                href="https://dash.cloudflare.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                Cloudflare <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <b className="text-foreground">WAF administrado de Cloudflare</b> y <b className="text-foreground">Authenticated Origin Pulls</b>{" "}
              — el origen solo acepta tráfico que pasa por Cloudflare.
            </li>
          </ul>
        </div>
      </div>

      {/* Prompt exacto */}
      <details className="mb-8 rounded-2xl border border-border bg-card/40">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          Prompt de sistema exacto que recibe el modelo{" "}
          <span className="font-normal text-muted-foreground">
            (reglas + base de conocimiento, {kb.chars.toLocaleString("es")} caracteres de base)
          </span>
        </summary>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap border-t border-border/60 p-4 text-[11px] leading-relaxed text-foreground/80">
          {buildSystemInstruction(kb.text)}
        </pre>
      </details>

      {/* Eventos recientes */}
      <h2 className="mb-3 text-sm font-semibold">Eventos recientes</h2>
      {recent.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Ningún guardrail ha actuado todavía.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card/40">
          <table className="w-full text-xs">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Última vez</th>
                <th className="px-4 py-2 font-medium">Qué pasó</th>
                <th className="px-4 py-2 text-right font-medium">Veces</th>
                <th className="px-4 py-2 font-medium">IP (hash)</th>
                <th className="px-4 py-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{fmtTs(new Date(e.last_ts))}</td>
                  <td className="px-4 py-2">{GUARD_KIND_LABEL[e.kind] ?? e.kind}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{e.n}</td>
                  <td className="px-4 py-2 font-mono text-muted-foreground/70">{e.ip_hash ? e.ip_hash.slice(0, 8) : "—"}</td>
                  <td className="max-w-md truncate px-4 py-2 font-mono text-[11px] text-muted-foreground" title={JSON.stringify(e.detail)}>
                    {e.status ? `HTTP ${e.status} · ` : ""}
                    {e.model ? `${e.model} · ` : ""}
                    {JSON.stringify(e.detail)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
