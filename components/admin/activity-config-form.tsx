"use client"

import { useState, useTransition } from "react"
import { Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { purgeActivityNow, setActivityConfig } from "@/app/admin/actions"

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

export function ActivityConfigForm({ visitorDays, auditDays }: { visitorDays: number; auditDays: number }) {
  const [visitors, setVisitors] = useState(String(visitorDays))
  const [audit, setAudit] = useState(String(auditDays))
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, startSaving] = useTransition()
  const [purging, startPurging] = useTransition()

  const handleSave = () => {
    startSaving(async () => {
      const result = await setActivityConfig({ visitorDays: Number(visitors), auditDays: Number(audit) })
      setMessage(result.ok ? { ok: true, text: "Retención guardada" } : { ok: false, text: result.error })
    })
  }

  const handlePurge = () => {
    if (!confirm("¿Borrar ahora los registros más antiguos que la retención configurada? No se puede deshacer.")) return
    startPurging(async () => {
      const result = await purgeActivityNow()
      setMessage(
        result.ok
          ? { ok: true, text: `Purga aplicada: ${result.visitors} eventos de visitantes y ${result.audit} registros de bitácora eliminados.` }
          : { ok: false, text: result.error },
      )
    })
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
      <p className="mb-1 text-sm font-semibold">Analytics y Bitácora: retención</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Los registros más antiguos se borran solos (purga oportunista en cada lote de eventos) o con el botón.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ret-visitors" className="mb-1 block text-xs text-muted-foreground">
            Eventos de visitantes (días, 7–365)
          </label>
          <input id="ret-visitors" type="number" min={7} max={365} value={visitors} onChange={(e) => setVisitors(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="ret-audit" className="mb-1 block text-xs text-muted-foreground">
            Bitácora del admin (días, 30–730)
          </label>
          <input id="ret-audit" type="number" min={30} max={730} value={audit} onChange={(e) => setAudit(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar retención"}
        </Button>
        <Button variant="outline" onClick={handlePurge} disabled={purging}>
          <Eraser className="mr-1.5 h-3.5 w-3.5" />
          {purging ? "Purgando…" : "Aplicar retención ahora"}
        </Button>
        {message && <p className={`text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>{message.text}</p>}
      </div>
    </div>
  )
}
