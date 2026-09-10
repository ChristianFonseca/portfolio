"use client"

import { useState, useTransition } from "react"
import { Database, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { rebuildKnowledgeBase } from "@/app/admin/actions"
import type { KnowledgeBase } from "@/lib/chat/knowledge"

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })
const fmtInt = (n: number) => n.toLocaleString("es")

// Panel "Base de conocimiento del chat": qué recibe el modelo, cuánto pesa y un botón
// para reconstruirla a mano (útil tras cambios por script o si el chat responde con
// datos viejos). Al guardar secciones o posts desde el admin se actualiza sola.
export function KnowledgePanel({ initial }: { initial: KnowledgeBase }) {
  const [kb, setKb] = useState(initial)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

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

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Database className="h-4 w-4 text-primary" />
            Base de conocimiento del chat
          </p>
          <p className="text-xs text-muted-foreground">
            Texto completo que recibe el asistente en cada mensaje (no es búsqueda vectorial: cabe entero en el
            contexto). Se reconstruye sola al guardar secciones o artículos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRebuild} disabled={pending}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Reconstruyendo…" : "Actualizar base de conocimiento"}
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Fuentes</p>
          <p className="mt-0.5 text-sm font-semibold">{kb.sources.length} bloques</p>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead className="bg-background/40 text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Fuente</th>
              <th className="px-3 py-2 text-right font-medium">Items</th>
              <th className="px-3 py-2 text-right font-medium">Caracteres</th>
              <th className="px-3 py-2 text-right font-medium">% del total</th>
            </tr>
          </thead>
          <tbody>
            {kb.sources.map((s) => (
              <tr key={s.name} className="border-t border-border/60">
                <td className="px-3 py-1.5">{s.name}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{s.items}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fmtInt(s.chars)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                  {kb.chars ? Math.round((s.chars / kb.chars) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && (
        <p className={`mt-3 text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>{message.text}</p>
      )}

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          Ver el texto exacto que recibe el modelo
        </summary>
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-3 text-[11px] leading-relaxed text-foreground/80">
          {kb.text}
        </pre>
      </details>
    </div>
  )
}
