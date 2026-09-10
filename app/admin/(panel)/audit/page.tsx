import Link from "next/link"
import { redirect } from "next/navigation"
import { Download, ScrollText, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSessionUser } from "@/lib/auth"
import {
  PAGE_SIZE,
  RANGE_LABEL,
  auditStats,
  countAudit,
  listAudit,
  parseAuditFilter,
  parsePage,
  qs,
  topActions,
  type AuditRow,
  type Rank,
} from "@/lib/analytics"

export const dynamic = "force-dynamic"

const inputClass =
  "rounded-lg border border-border bg-background/50 px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"

const ACTION_LABEL: Record<string, string> = {
  "login.ok": "Inicio de sesión",
  "login.fail": "Login fallido",
  "login.limited": "Login bloqueado (rate limit)",
  logout: "Cierre de sesión",
  "section.save": "Guardó sección",
  "section.visibility": "Cambió visibilidad de sección",
  "section.move": "Reordenó sección",
  "post.create": "Creó artículo",
  "post.save": "Guardó artículo",
  "post.publish": "Publicó artículo",
  "post.unpublish": "Despublicó artículo",
  "post.delete": "Eliminó artículo",
  "settings.chat": "Cambió config del chat",
  "settings.model": "Cambió modelo Gemini",
  "settings.fallback_model": "Cambió modelo de respaldo",
  "settings.activity": "Cambió retención de analítica",
  "models.refresh": "Actualizó catálogo de modelos",
  "models.block": "Bloqueó un modelo",
  "models.unblock": "Desbloqueó un modelo",
  "kb.sources": "Cambió fuentes de la base de conocimiento",
  "incident.dismiss": "Descartó aviso de modelo",
  "kb.rebuild": "Reconstruyó base de conocimiento",
  translate: "Tradujo con IA",
  upload: "Subió imagen",
  "user.create": "Creó usuario",
  "user.delete": "Eliminó usuario",
  "user.role": "Cambió rol de usuario",
  "user.password_reset": "Restableció contraseña",
  "analytics.export": "Exportó analítica (CSV)",
  "audit.export": "Exportó bitácora (CSV)",
  "activity.purge": "Purgó registros por retención",
}

function Tile({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${warn && value > 0 ? "border-red-500/40 bg-red-500/5" : "border-border bg-card/40"}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default async function AdminAuditPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") redirect("/")

  const raw = await props.searchParams
  const sp: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(raw)) sp[k] = Array.isArray(v) ? v[0] : v
  const filter = parseAuditFilter(sp)
  const page = parsePage(sp.page)
  const base = { range: filter.range, actor: filter.actor, action: filter.action, ip: filter.ip, ok: filter.ok }

  let dbError = false
  let stats = { today: 0, week: 0, failed_logins_week: 0, actors_week: 0 }
  let actions: Rank[] = []
  let rows: AuditRow[] = []
  let total = 0
  try {
    ;[stats, actions, rows, total] = await Promise.all([auditStats(), topActions(filter.range), listAudit(filter, page), countAudit(filter)])
  } catch (error) {
    console.error("admin audit:", error)
    dbError = true
  }
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Bitácora</h1>
        <a
          href={`/audit/export${qs(base)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
        >
          <Download className="h-3.5 w-3.5" /> CSV del filtro actual
        </a>
      </div>
      <p className="mb-8 text-sm text-muted-foreground">
        Quién hizo qué en este panel y desde qué IP: inicios de sesión (también los fallidos), cambios de contenido,
        configuración, usuarios, subidas y exportaciones.
      </p>

      {dbError ? (
        <p className="text-sm text-red-400">
          No se pudo consultar la bitácora. Si acabas de desplegar, corre la migración <code>scripts/migrate-activity.mjs</code>.
        </p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile label="Acciones últimas 24 h" value={stats.today} />
            <Tile label="Acciones últimos 7 días" value={stats.week} />
            <Tile label="Logins fallidos / bloqueados (7 d)" value={stats.failed_logins_week} warn />
            <Tile label="Personas activas (7 d)" value={stats.actors_week} />
          </div>

          <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_2fr]">
            <div className="rounded-2xl border border-border bg-card/40 p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Acciones en el periodo
              </p>
              {actions.length === 0 ? (
                <p className="text-xs text-muted-foreground/60">Sin registros.</p>
              ) : (
                <ul className="space-y-1">
                  {actions.map((a) => (
                    <li key={a.label} className="flex items-center justify-between gap-2 text-xs">
                      <Link href={`/audit${qs(base, { action: a.label, page: 1 })}`} className="truncate hover:text-primary hover:underline">
                        {ACTION_LABEL[a.label] ?? a.label}
                      </Link>
                      <span className="tabular-nums text-muted-foreground">{a.n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card/40 p-4">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <ScrollText className="h-3.5 w-3.5" /> Filtros
              </p>
              <form method="get" className="flex flex-wrap items-end gap-2">
                <select name="range" defaultValue={filter.range} className={inputClass}>
                  {Object.entries(RANGE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      últimos {v}
                    </option>
                  ))}
                </select>
                <input name="actor" defaultValue={filter.actor ?? ""} placeholder="actor (email)" className={`${inputClass} w-48`} />
                <select name="action" defaultValue={filter.action ?? ""} className={inputClass}>
                  <option value="">todas las acciones</option>
                  {Object.entries(ACTION_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input name="ip" defaultValue={filter.ip ?? ""} placeholder="IP" className={`${inputClass} w-40 font-mono`} />
                <select name="ok" defaultValue={filter.ok ?? ""} className={inputClass}>
                  <option value="">ok y fallidos</option>
                  <option value="true">solo ok</option>
                  <option value="false">solo fallidos</option>
                </select>
                <button type="submit" className="rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
                  Filtrar
                </button>
                {(filter.actor || filter.action || filter.ip || filter.ok) && (
                  <Link href={`/audit${qs({ range: filter.range })}`} className="text-xs text-muted-foreground underline">
                    limpiar
                  </Link>
                )}
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/40 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Registros · {total.toLocaleString("es")} en el periodo
            </p>
            {rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin registros para este filtro.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-background/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Hora</th>
                      <th className="px-3 py-2 font-medium">Actor</th>
                      <th className="px-3 py-2 font-medium">Acción</th>
                      <th className="px-3 py-2 font-medium">Objetivo</th>
                      <th className="px-3 py-2 font-medium">IP</th>
                      <th className="px-3 py-2 font-medium">País</th>
                      <th className="px-3 py-2 font-medium">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const detail = Object.keys(r.detail ?? {}).length ? JSON.stringify(r.detail) : ""
                      return (
                        <tr key={r.id} className={`border-t border-border/60 align-top ${r.ok ? "" : "bg-red-500/5"}`} title={r.ua}>
                          <td className="whitespace-nowrap px-3 py-1.5 tabular-nums text-muted-foreground">{r.ts}</td>
                          <td className="px-3 py-1.5">
                            {r.actor ? (
                              <Link href={`/audit${qs(base, { actor: r.actor, page: 1 })}`} className="hover:text-primary">
                                {r.actor}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            <span className="inline-flex items-center gap-1.5">
                              {!r.ok && <ShieldAlert className="h-3.5 w-3.5 text-red-400" />}
                              <Link href={`/audit${qs(base, { action: r.action, page: 1 })}`} className="hover:text-primary">
                                {ACTION_LABEL[r.action] ?? r.action}
                              </Link>
                            </span>
                          </td>
                          <td className="max-w-[14rem] truncate px-3 py-1.5 font-mono" title={r.target}>
                            {r.target || "—"}
                          </td>
                          <td className="px-3 py-1.5 font-mono">
                            {r.ip ? (
                              <Link href={`/audit${qs(base, { ip: r.ip, page: 1 })}`} className="hover:text-primary">
                                {r.ip}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-1.5">{r.country || "—"}</td>
                          <td className="max-w-[20rem] px-3 py-1.5">
                            {detail ? (
                              <details>
                                <summary className="cursor-pointer truncate text-muted-foreground">{detail.slice(0, 60)}</summary>
                                <pre className="mt-1 whitespace-pre-wrap break-all text-[11px] text-muted-foreground">{JSON.stringify(r.detail, null, 1)}</pre>
                              </details>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
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
                    <Link href={`/audit${qs(base, { page: page - 1 })}`} className="rounded-lg border border-border px-3 py-1 hover:border-primary hover:text-primary">
                      ← anterior
                    </Link>
                  )}
                  {page < pageCount && (
                    <Link href={`/audit${qs(base, { page: page + 1 })}`} className="rounded-lg border border-border px-3 py-1 hover:border-primary hover:text-primary">
                      siguiente →
                    </Link>
                  )}
                </div>
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground/60">
              <Badge variant="outline" className="mr-1.5 text-[10px]">
                nota
              </Badge>
              Los logins fallidos guardan el email intentado y la IP, nunca la contraseña.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
