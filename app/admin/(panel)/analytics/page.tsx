import Link from "next/link"
import { BarChart3, Download, MousePointerClick } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ClickHeatmap } from "@/components/admin/click-heatmap"
import {
  PAGE_SIZE,
  RANGE_LABEL,
  countVisitorEvents,
  devices,
  heatmapPaths,
  heatmapPoints,
  listVisitorEvents,
  locales,
  parseDevice,
  parsePage,
  parseVisitorFilter,
  qs,
  sectionDwell,
  topClicks,
  topCountries,
  topPages,
  topReferrers,
  visitorStats,
  type Rank,
  type VisitorRow,
} from "@/lib/analytics"

export const dynamic = "force-dynamic"

const KINDS = ["pageview", "section", "click", "scroll", "leave", "chat", "contact"]
const inputClass =
  "rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"

const fmtMs = (ms: number) => (ms >= 60_000 ? `${Math.round(ms / 6000) / 10} min` : `${Math.round(ms / 100) / 10} s`)

function summarize(row: VisitorRow): string {
  const p = row.props ?? {}
  const s = (k: string) => (p[k] === undefined || p[k] === null ? "" : String(p[k]))
  switch (row.kind) {
    case "pageview":
      return [s("vw") && `${s("vw")}×${s("vh")}`, s("th"), s("lg"), s("ref") && `ref: ${s("ref").slice(0, 60)}`].filter(Boolean).join(" · ")
    case "section":
      return `${s("id")} · ${fmtMs(Number(s("ms")))}`
    case "click":
      return [s("tr") || s("tx") || s("hr") || s("el"), s("sec") && `en #${s("sec")}`].filter(Boolean).join(" · ")
    case "scroll":
      return `profundidad ${s("depth")}%`
    case "leave":
      return `${fmtMs(Number(s("ms")))} en la página`
    case "chat":
      return `modelo ${s("model")}${s("fellBack") === "true" ? " (respaldo)" : ""}`
    case "contact":
      return s("ok") === "true" ? "enviado" : `fallo: ${s("reason")}`
    default:
      return ""
  }
}

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 px-5 py-4">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
    </div>
  )
}

function RankList({ title, rows, empty, href }: { title: string; rows: Rank[]; empty: string; href?: (r: Rank) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.n))
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="relative overflow-hidden rounded-md">
              <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${(r.n / max) * 100}%` }} />
              <div className="relative flex items-center justify-between gap-3 px-2 py-1 text-xs">
                {href ? (
                  <Link href={href(r)} className="truncate hover:text-primary hover:underline">
                    {r.label || "—"}
                  </Link>
                ) : (
                  <span className="truncate">{r.label || "—"}</span>
                )}
                <span className="shrink-0 tabular-nums text-muted-foreground">{r.n}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default async function AdminAnalyticsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await props.searchParams
  const sp: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(raw)) sp[k] = Array.isArray(v) ? v[0] : v

  const filter = parseVisitorFilter(sp)
  const page = parsePage(sp.page)
  const device = parseDevice(sp.device)
  const heatPath = sp.hpath && /^\/[a-zA-Z0-9\-._~\/%]{0,200}$/.test(sp.hpath) ? sp.hpath : "/"
  const base = { range: filter.range, kind: filter.kind, country: filter.country, ip: filter.ip, sid: filter.sid, path: filter.path, hpath: heatPath, device }

  let dbError = false
  let stats = { pageviews: 0, sessions: 0, ips: 0, chats: 0, contacts: 0, avg_ms: 0, clicks: 0 }
  let pages: Rank[] = [], countries: Rank[] = [], refs: Rank[] = [], devs: Rank[] = [], locs: Rank[] = [], clicks: Rank[] = [], hpaths: Rank[] = []
  let dwell: Awaited<ReturnType<typeof sectionDwell>> = []
  let points: Awaited<ReturnType<typeof heatmapPoints>> = []
  let rows: VisitorRow[] = []
  let total = 0
  try {
    ;[stats, pages, countries, refs, devs, locs, clicks, dwell, points, hpaths, rows, total] = await Promise.all([
      visitorStats(filter.range),
      topPages(filter.range),
      topCountries(filter.range),
      topReferrers(filter.range),
      devices(filter.range),
      locales(filter.range),
      topClicks(filter.range),
      sectionDwell(filter.range),
      heatmapPoints(filter.range, heatPath, device),
      heatmapPaths(filter.range),
      listVisitorEvents(filter, page),
      countVisitorEvents(filter),
    ])
  } catch (error) {
    console.error("admin analytics:", error)
    dbError = true
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeFilters = [
    filter.kind && ["kind", `tipo: ${filter.kind}`],
    filter.country && ["country", `país: ${filter.country}`],
    filter.ip && ["ip", `IP: ${filter.ip}`],
    filter.sid && ["sid", `sesión: ${filter.sid.slice(0, 10)}…`],
    filter.path && ["path", `ruta: ${filter.path}`],
  ].filter(Boolean) as [string, string][]

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <form method="get" className="flex items-center gap-2">
          {Object.entries(base)
            .filter(([k]) => k !== "range")
            .map(([k, v]) => v && <input key={k} type="hidden" name={k} value={String(v)} />)}
          <label className="text-xs text-muted-foreground">Periodo</label>
          <select name="range" defaultValue={filter.range} className={inputClass}>
            {Object.entries(RANGE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                últimos {v}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
            Aplicar
          </button>
        </form>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Qué hacen los visitantes del sitio público: páginas, secciones vistas, clics (con heatmap), scroll, chat y
        contacto. IP y país se guardan en claro con la retención configurada en Configuración.
      </p>

      {dbError ? (
        <p className="text-sm text-red-400">
          No se pudo consultar la analítica. Si acabas de desplegar, corre la migración <code>scripts/migrate-activity.mjs</code>.
        </p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
            <Tile label="Page views" value={stats.pageviews} />
            <Tile label="Sesiones" value={stats.sessions} hint="pestañas distintas" />
            <Tile label="IPs únicas" value={stats.ips} />
            <Tile label="Tiempo medio" value={stats.avg_ms ? fmtMs(stats.avg_ms) : "—"} hint="por página" />
            <Tile label="Clics" value={stats.clicks} />
            <Tile label="Chat" value={stats.chats} hint="preguntas" />
            <Tile label="Contacto" value={stats.contacts} hint="enviados" />
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <RankList title="Páginas más vistas" rows={pages} empty="Sin page views aún." href={(r) => `/analytics${qs(base, { path: r.label, page: 1 })}`} />
            <RankList title="Países (sesiones)" rows={countries} empty="Sin país (Cloudflare no lo envió)." href={(r) => `/analytics${qs(base, { country: r.label, page: 1 })}`} />
            <RankList title="Referrers externos" rows={refs} empty="Tráfico directo o sin referrer." />
            <RankList title="Dispositivos" rows={devs} empty="Sin datos." />
            <RankList title="Idioma de la visita" rows={locs} empty="Sin datos." />
            <RankList title="Elementos más clicados" rows={clicks} empty="Sin clics aún." />
          </div>

          <div className="mb-8 rounded-2xl border border-border bg-card/40 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Secciones del landing: veces vistas y tiempo medio a la vista
            </p>
            {dwell.length === 0 ? (
              <p className="text-xs text-muted-foreground/60">Aún no hay datos de secciones.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {dwell.map((d) => (
                  <div key={d.id} className="rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-xs">
                    <p className="font-semibold">#{d.id}</p>
                    <p className="text-muted-foreground">
                      {d.views} vistas · {fmtMs(d.avg_ms)} de media
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8 rounded-2xl border border-border bg-card/40 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <MousePointerClick className="h-3.5 w-3.5" />
                Heatmap de clics · {points.length} clics en <code className="normal-case">{heatPath}</code>
              </p>
              <form method="get" className="flex flex-wrap items-center gap-2">
                {Object.entries(base)
                  .filter(([k]) => k !== "hpath" && k !== "device")
                  .map(([k, v]) => v && <input key={k} type="hidden" name={k} value={String(v)} />)}
                <select name="hpath" defaultValue={heatPath} className={inputClass}>
                  {!hpaths.some((h) => h.label === heatPath) && <option value={heatPath}>{heatPath}</option>}
                  {hpaths.map((h) => (
                    <option key={h.label} value={h.label}>
                      {h.label} ({h.n})
                    </option>
                  ))}
                </select>
                <select name="device" defaultValue={device} className={inputClass}>
                  <option value="all">todos los dispositivos</option>
                  <option value="mobile">móvil (&lt; 640 px)</option>
                  <option value="tablet">tablet (640–1023 px)</option>
                  <option value="desktop">escritorio (≥ 1024 px)</option>
                </select>
                <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
                  Ver
                </button>
              </form>
            </div>
            <ClickHeatmap points={points} path={heatPath} />
            <p className="mt-2 text-[11px] text-muted-foreground/60">
              Posición horizontal en ‰ del ancho de pantalla y vertical en ‰ del alto total de la página; el eje vertical
              marca el porcentaje de scroll. Mezclar dispositivos distorsiona: usa el filtro.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Eventos · {total.toLocaleString("es")} en el periodo
              </p>
              <a
                href={`/analytics/export${qs(base)}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
              >
                <Download className="h-3.5 w-3.5" /> CSV del filtro actual
              </a>
            </div>

            <form method="get" className="mb-3 flex flex-wrap items-end gap-2">
              <input type="hidden" name="range" value={filter.range} />
              <input type="hidden" name="hpath" value={heatPath} />
              <input type="hidden" name="device" value={device} />
              <select name="kind" defaultValue={filter.kind ?? ""} className={inputClass}>
                <option value="">todos los tipos</option>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input name="country" defaultValue={filter.country ?? ""} placeholder="país (PE)" maxLength={2} className={`${inputClass} w-24`} />
              <input name="ip" defaultValue={filter.ip ?? ""} placeholder="IP" className={`${inputClass} w-40 font-mono`} />
              <input name="sid" defaultValue={filter.sid ?? ""} placeholder="sesión" className={`${inputClass} w-44 font-mono`} />
              <input name="path" defaultValue={filter.path ?? ""} placeholder="ruta (/blog)" className={`${inputClass} w-36`} />
              <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
                Filtrar
              </button>
              {activeFilters.length > 0 && (
                <Link href={`/analytics${qs({ range: filter.range, hpath: heatPath, device })}`} className="text-xs text-muted-foreground underline">
                  limpiar
                </Link>
              )}
            </form>

            {activeFilters.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {activeFilters.map(([k, label]) => (
                  <Link key={k} href={`/analytics${qs(base, { [k]: undefined, page: 1 })}`}>
                    <Badge variant="outline" className="cursor-pointer text-[10px] hover:border-red-500/50 hover:text-red-400">
                      {label} ×
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin eventos para este filtro.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-background/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Hora</th>
                      <th className="px-3 py-2 font-medium">Tipo</th>
                      <th className="px-3 py-2 font-medium">Ruta</th>
                      <th className="px-3 py-2 font-medium">Detalle</th>
                      <th className="px-3 py-2 font-medium">País</th>
                      <th className="px-3 py-2 font-medium">IP</th>
                      <th className="px-3 py-2 font-medium">Sesión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-t border-border/60 align-top" title={r.ua}>
                        <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-muted-foreground">{r.ts}</td>
                        <td className="px-3 py-1.5">
                          <Link href={`/analytics${qs(base, { kind: r.kind, page: 1 })}`} className="hover:text-primary">
                            {r.kind}
                          </Link>
                        </td>
                        <td className="max-w-[12rem] truncate px-3 py-1.5 font-mono">{r.path}</td>
                        <td className="max-w-[22rem] truncate px-3 py-1.5" title={summarize(r)}>
                          {summarize(r)}
                        </td>
                        <td className="px-3 py-1.5">
                          {r.country ? (
                            <Link href={`/analytics${qs(base, { country: r.country, page: 1 })}`} className="hover:text-primary">
                              {r.country}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-1.5 font-mono">
                          {r.ip ? (
                            <Link href={`/analytics${qs(base, { ip: r.ip, page: 1 })}`} className="hover:text-primary">
                              {r.ip}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-1.5 font-mono">
                          {r.session_id ? (
                            <Link href={`/analytics${qs(base, { sid: r.session_id, page: 1 })}`} className="hover:text-primary" title={r.session_id}>
                              {r.session_id.slice(0, 8)}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pageCount > 1 && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  página {page} de {pageCount}
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link href={`/analytics${qs(base, { page: page - 1 })}`} className="rounded-lg border border-border px-3 py-1 hover:border-primary hover:text-primary">
                      ← anterior
                    </Link>
                  )}
                  {page < pageCount && (
                    <Link href={`/analytics${qs(base, { page: page + 1 })}`} className="rounded-lg border border-border px-3 py-1 hover:border-primary hover:text-primary">
                      siguiente →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
