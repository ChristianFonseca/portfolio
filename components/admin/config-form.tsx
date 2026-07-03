"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { setGeminiModel } from "@/app/admin/actions"

interface ModelOption {
  id: string
  label: string
}

export function ConfigForm({
  currentModel,
  models,
  defaultModel,
}: {
  currentModel: string
  models: ModelOption[]
  defaultModel: string
}) {
  const known = models.some((m) => m.id === currentModel)
  const [selected, setSelected] = useState(known ? currentModel : "custom")
  const [custom, setCustom] = useState(known ? "" : currentModel)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const effectiveModel = selected === "custom" ? custom.trim() : selected

  const handleSave = () => {
    startTransition(async () => {
      const result = await setGeminiModel(effectiveModel)
      setMessage(
        result.ok
          ? { ok: true, text: `Modelo guardado: ${effectiveModel}` }
          : { ok: false, text: result.error },
      )
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <p className="mb-1 text-sm font-semibold">Modelo de traducción</p>
      <p className="mb-4 text-xs text-muted-foreground">
        Default: <code className="rounded bg-background/60 px-1.5 py-0.5">{defaultModel}</code> — el mejor
        costo/beneficio para traducción.
      </p>
      <div className="space-y-2">
        {models.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
              selected === m.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <input
              type="radio"
              name="model"
              checked={selected === m.id}
              onChange={() => setSelected(m.id)}
              className="accent-purple-500"
            />
            <span>
              <span className="font-medium">{m.id}</span>
              <span className="block text-xs text-muted-foreground">{m.label.split("—")[1]?.trim() ?? ""}</span>
            </span>
          </label>
        ))}
        <label
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
            selected === "custom" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
          }`}
        >
          <input
            type="radio"
            name="model"
            checked={selected === "custom"}
            onChange={() => setSelected("custom")}
            className="accent-purple-500"
          />
          <input
            type="text"
            placeholder="otro modelo (id exacto de la API)"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value)
              setSelected("custom")
            }}
            className="flex-1 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={pending || !effectiveModel}
          className="rounded-full bg-gradient-to-r from-primary to-accent text-white hover:brightness-110"
        >
          {pending ? "Guardando…" : "Guardar configuración"}
        </Button>
        {message && (
          <p className={`text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>{message.text}</p>
        )}
      </div>
    </div>
  )
}
