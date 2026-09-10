"use client"

import { useState, useTransition } from "react"
import { Database, Lock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { rebuildKnowledgeBase, setKnowledgeSources } from "@/app/admin/actions"
import type { KnowledgeBase } from "@/lib/chat/knowledge"
import { estimateCostUsd, fmtSmallUsd, priceFor } from "@/lib/gemini-pricing"

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })
const fmtInt = (n: number) => n.toLocaleString("es")

// Tokens fijos que acompañan a la base en cada mensaje: reglas del system prompt (~300)
// + historial medio (~600) + pregunta; y una respuesta típica de ~150 tokens.
const OVERHEAD_INPUT_TOKENS = 1000
const TYPICAL_OUTPUT_TOKENS = 150

// Panel "Base de conocimiento del chat": qué fuentes entran (checkbox por fuente),
// cuánto pesa, cuánto cuesta por mensaje con el modelo actual y el texto exacto que
// recibe el modelo, regenerado en cada cambio. Al guardar secciones o posts desde el
// admin se actualiza sola; el botón fuerza una reconstrucción.
export function KnowledgePanel({ initial, modelId }: { initial: KnowledgeBase; modelId: string }) {
  const [kb, setKb] = useState(initial)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const price = priceFor(modelId)
  const perMessage = price ? estimateCostUsd(price, kb.approxTokens + OVERHEAD_INPUT_TOKENS, TYPICAL_OUTPUT_TOKENS) : null

  const handleRebuild = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await rebuildKnowledgeBase()
      if (result.ok) {
        setKb(result.kb)
        setMessage({ ok: true, text: "Base de conocimiento reconstruida; el chat ya usa la versión nueva." })
      } else {
        setMessage({ ok: false, text: result.error })
      }
    })
  }

  // Desactivadas = las que no están incluidas y tienen contenido (las que no tienen
  // contenido no cuentan como decisión del usuario).
  const disabledKeys = () => kb.sources.filter((s) => !s.locked && !s.enabled && s.available).map((s) => s.key)

  const handleToggle = (key: string, enable: boolean) => {
    setMessage(null)
    setTogglingKey(key)
    const current = new Set(disabledKeys())
    if (enable) current.delete(key)
    else current.add(key)
    startTransition(async () => {
      const result = await setKnowledgeSources(Array.from(current))
      setTogglingKey(null)
      if (result.ok) setKb(result.kb)
      else setMessage({ ok: false, text: result.error })
    })
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-primary" />
            Base de conocimiento del chat
          </p>
          <p className="text-xs text-muted-foreground">
            Todo el texto de abajo se envía al modelo en cada mensaje (no es búsqueda vectorial: cabe entero en el
            contexto). Marca qué fuentes entran; el texto se regenera al instante.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRebuild} disabled={pending}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${pending && !togglingKey ? "animate-spin" : ""}`} />
          {pending && !togglingKey ? "Reconstruyendo…" : "Actualizar base de conocimiento"}
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Última construcción</p>
          <p className="mt-0.5 text-sm font-semibold" suppressHydrationWarning>
            {fmtDate(kb.builtAt)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tamaño</p>
          <p className="mt-0.5 text-sm font-semibold">
            {fmtInt(kb.chars)} caracteres <span className="text-muted-foreground">≈ {fmtInt(kb.approxTokens)} tokens</span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Fuentes activas</p>
          <p className="mt-0.5 text-sm font-semibold">
            {kb.sources.filter((s) => s.enabled).length} de {kb.sources.filter((s) => s.available).length} con contenido
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/40 px-4 py-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Costo por mensaje</p>
          {perMessage !== null ? (
            <>
              <p className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">≈ {fmtSmallUsd(perMessage)}</p>
              <p className="text-[10px] text-muted-foreground/70">
                con {modelId} · 1.000 msgs ≈ {fmtSmallUsd(perMessage * 1000)}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">sin precio publicado para {modelId}</p>
          )}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead className="bg-background/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2 font-medium">Incluir</th>
              <th className="px-3 py-2 font-medium">Fuente</th>
              <th className="px-3 py-2 text-right font-medium">Items</th>
              <th className="px-3 py-2 text-right font-medium">Caracteres</th>
              <th className="px-3 py-2 text-right font-medium">% del total</th>
            </tr>
          </thead>
          <tbody>
            {kb.sources.map((s) => {
              const busy = pending && togglingKey === s.key
              return (
                <tr key={s.key} className={`border-t border-border/60 ${s.enabled ? "" : "text-muted-foreground/60"}`}>
                  <td className="px-3 py-1.5">
                    {s.locked ? (
                      <span className="inline-flex items-center gap-1" title="Siempre incluido: identifica a quién describe la base">
                        <input type="checkbox" checked disabled className="h-3.5 w-3.5 accent-purple-500" />
                        <Lock className="h-3 w-3 opacity-50" />
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={s.enabled}
                        disabled={pending || !s.available}
                        onChange={(e) => handleToggle(s.key, e.target.checked)}
                        className="h-3.5 w-3.5 accent-purple-500"
                        aria-label={`Incluir ${s.name}`}
                        title={!s.available ? "Sin contenido disponible (sección vacía u oculta)" : undefined}
                      />
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    {s.name}
                    {busy && <span className="ml-2 text-[10px] text-muted-foreground">actualizando…</span>}
                    {!s.available && <span className="ml-2 text-[10px] text-muted-foreground/60">(sin contenido)</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{s.items}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{s.enabled ? fmtInt(s.chars) : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                    {s.enabled && kb.chars ? `${Math.round((s.chars / kb.chars) * 100)}%` : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {message && <p className={`mt-3 text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>{message.text}</p>}

      <p className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Texto exacto que recibe el modelo ({fmtInt(kb.chars)} caracteres)
      </p>
      <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 text-[11px] leading-relaxed text-foreground/80">
        {kb.text}
      </pre>
    </div>
  )
}
