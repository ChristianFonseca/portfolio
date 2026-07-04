"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { setChatConfig } from "@/app/admin/actions"

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

export function ChatConfigForm({
  dailyLimit,
  allowlist,
  extraContext,
}: {
  dailyLimit: number
  allowlist: string[]
  extraContext: string
}) {
  const [limit, setLimit] = useState(String(dailyLimit))
  const [ips, setIps] = useState(allowlist.join("\n"))
  const [extra, setExtra] = useState(extraContext)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSave = () => {
    const parsedLimit = Number(limit)
    startTransition(async () => {
      const result = await setChatConfig({
        dailyLimit: Number.isInteger(parsedLimit) ? parsedLimit : -1,
        allowlist: ips
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        extraContext: extra,
      })
      setMessage(result.ok ? { ok: true, text: "Configuración del chat guardada" } : { ok: false, text: result.error })
    })
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card/40 p-5">
      <p className="mb-1 text-sm font-semibold">Chat con IA (RAG)</p>
      <p className="mb-4 text-xs text-muted-foreground">
        El asistente responde solo con la información de tus secciones + el contexto extra de abajo.
      </p>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="chat-limit" className="mb-1 block text-xs text-muted-foreground">
              Límite de preguntas por IP (cada 24 h)
            </label>
            <input
              id="chat-limit"
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="chat-ips" className="mb-1 block text-xs text-muted-foreground">
              IPs con preguntas ilimitadas (una por línea)
            </label>
            <textarea
              id="chat-ips"
              rows={3}
              value={ips}
              onChange={(e) => setIps(e.target.value)}
              placeholder={"203.0.113.7\n2001:db8::1"}
              className={`${inputClass} resize-y font-mono text-xs`}
            />
          </div>
        </div>
        <div>
          <label htmlFor="chat-extra" className="mb-1 block text-xs text-muted-foreground">
            Contexto extra para el asistente (educación, certificaciones, disponibilidad, etc.)
          </label>
          <textarea
            id="chat-extra"
            rows={7}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            className={`${inputClass} resize-y`}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={pending}
          className=""
        >
          {pending ? "Guardando…" : "Guardar chat"}
        </Button>
        {message && <p className={`text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>{message.text}</p>}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/60">
        Privacidad: las IPs de los visitantes nunca se guardan en claro — solo un hash irreversible para aplicar el
        límite y agrupar la analítica.
      </p>
    </div>
  )
}
