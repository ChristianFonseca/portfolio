"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { setChatConfig } from "@/app/admin/actions"

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

export function ChatConfigForm({
  dailyLimit,
  globalLimit,
  allowlist,
  extraContext,
  costPerMessageUsd,
}: {
  dailyLimit: number
  globalLimit: number
  allowlist: string[]
  extraContext: string
  /** Costo aproximado de un mensaje con el modelo actual; null si no hay precio conocido. */
  costPerMessageUsd: number | null
}) {
  const [limit, setLimit] = useState(String(dailyLimit))
  const [global, setGlobal] = useState(String(globalLimit))
  const [ips, setIps] = useState(allowlist.join("\n"))
  const [extra, setExtra] = useState(extraContext)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const globalNum = Number(global)
  const dayCost = costPerMessageUsd !== null && Number.isFinite(globalNum) ? costPerMessageUsd * globalNum : null

  const handleSave = () => {
    const parsedLimit = Number(limit)
    startTransition(async () => {
      const result = await setChatConfig({
        dailyLimit: Number.isInteger(parsedLimit) ? parsedLimit : -1,
        // Vacío no es 0: guardaría "chat apagado" sin querer.
        globalLimit: global.trim() !== "" && Number.isInteger(globalNum) ? globalNum : -1,
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
      <p className="mb-1 text-sm font-semibold">Chat: límites de uso y contexto extra</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Los límites frenan el abuso del asistente público; todos los guardrails activos se ven en la página{" "}
        <a href="/guardrails" className="text-primary hover:underline">
          Guardrails
        </a>
        . El <b>contexto extra</b> es texto libre que se añade a la base de conocimiento de arriba como bloque
        &quot;Additional information&quot;: sirve para cosas que no están en ninguna sección, como formación o
        disponibilidad.
      </p>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="chat-global" className="mb-1 block text-xs text-muted-foreground">
              Tope global de preguntas (todo el sitio, cada 24 h) · 0 apaga el chat
            </label>
            <input
              id="chat-global"
              type="number"
              min={0}
              max={100000}
              value={global}
              onChange={(e) => setGlobal(e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              {global.trim() === ""
                ? "Pon un número: 0 apaga el chat."
                : globalNum === 0
                ? "El chat está apagado: los visitantes ven que Syn está descansando."
                : dayCost !== null
                  ? `Si se agota, unos $${dayCost < 1 ? dayCost.toFixed(2) : dayCost.toFixed(1)} al día con el modelo actual.`
                  : "Sin precio conocido para el modelo actual."}
            </p>
          </div>
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
            <p className="mt-1 text-[11px] text-muted-foreground/70">Las IPv6 cuentan por su prefijo /64.</p>
          </div>
        </div>
        <div>
          <label htmlFor="chat-ips" className="mb-1 block text-xs text-muted-foreground">
            IPs sin límite por IP (una por línea; siguen contando para el tope global)
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
        <div>
          <label htmlFor="chat-extra" className="mb-1 block text-xs text-muted-foreground">
            Contexto extra (se añade a la base de conocimiento; educación, certificaciones, disponibilidad, etc.)
          </label>
          <textarea
            id="chat-extra"
            rows={7}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1.5 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-[11px] leading-relaxed text-yellow-800 dark:text-yellow-200">
            <b>Es público.</b> Este texto se publica tal cual en{" "}
            <a href="https://christianfonseca.dev/llms.txt" target="_blank" rel="noopener noreferrer" className="underline">
              /llms.txt
            </a>{" "}
            y el asistente puede citarlo. No pongas tarifas privadas ni nada que no quieras ver en internet.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={handleSave} disabled={pending}>
          {pending ? "Guardando…" : "Guardar chat"}
        </Button>
        {message && <p className={`text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>{message.text}</p>}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/60">
        Privacidad: las preguntas del chat guardan la IP solo como hash. Pero cada pregunta también crea un evento en
        Analytics con la IP en claro (con la retención de más abajo), y los dos registros se pueden cruzar por ese hash.
      </p>
    </div>
  )
}
