"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Ban, CheckCircle2, FlaskConical, RefreshCw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { refreshGeminiModels, setGeminiFallbackModel, setGeminiModel, testGeminiModel } from "@/app/admin/actions"
import type { GeminiCatalog, GeminiModelInfo } from "@/lib/gemini"

interface SeedModel {
  id: string
  label: string
}

type Row = GeminiModelInfo & { fromSeed?: boolean }

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })
const fmtInt = (n: number) => (n ? n.toLocaleString("es") : "—")

export function ConfigForm({
  currentModel,
  fallbackModel,
  defaultModel,
  seedModels,
  catalog,
  hasApiKey,
}: {
  currentModel: string
  fallbackModel: string
  defaultModel: string
  seedModels: SeedModel[]
  catalog: GeminiCatalog | null
  hasApiKey: boolean
}) {
  const router = useRouter()
  const rows: Row[] = catalog
    ? catalog.models
    : seedModels.map((m) => ({
        id: m.id,
        displayName: m.label.split("—")[0].trim(),
        description: m.label.split("—")[1]?.trim() ?? "",
        inputTokenLimit: 0,
        outputTokenLimit: 0,
        deprecated: false,
        fromSeed: true,
      }))

  const inList = rows.some((m) => m.id === currentModel)
  const currentRow = rows.find((m) => m.id === currentModel)
  const currentUnavailable = catalog ? !inList || Boolean(currentRow?.deprecated) : false

  const [selected, setSelected] = useState(inList ? currentModel : catalog ? "" : "custom")
  const [custom, setCustom] = useState(inList ? "" : catalog ? "" : currentModel)
  const [fallback, setFallback] = useState(fallbackModel)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, startSaving] = useTransition()
  const [refreshing, startRefreshing] = useTransition()
  const [testing, startTesting] = useTransition()

  const effectiveModel = selected === "custom" ? custom.trim() : selected
  const selectable = rows.filter((m) => !m.deprecated)

  const handleSave = () => {
    startSaving(async () => {
      const primary = await setGeminiModel(effectiveModel)
      if (!primary.ok) {
        setMessage({ ok: false, text: primary.error })
        return
      }
      if (fallback && fallback !== fallbackModel) {
        const fb = await setGeminiFallbackModel(fallback)
        if (!fb.ok) {
          setMessage({ ok: false, text: `Modelo guardado, pero el respaldo no: ${fb.error}` })
          router.refresh()
          return
        }
      }
      setMessage({ ok: true, text: `Guardado: ${effectiveModel} (respaldo: ${fallback || "ninguno"})` })
      router.refresh()
    })
  }

  const handleRefresh = () => {
    setMessage(null)
    startRefreshing(async () => {
      const result = await refreshGeminiModels()
      setMessage(
        result.ok
          ? {
              ok: true,
              text: `Catálogo actualizado: ${result.available} modelos disponibles${result.deprecated ? ` y ${result.deprecated} deprecados` : ""}.`,
            }
          : { ok: false, text: result.error },
      )
      router.refresh()
    })
  }

  const handleTest = () => {
    if (!effectiveModel) return
    setTestResult(null)
    startTesting(async () => {
      const result = await testGeminiModel(effectiveModel)
      setTestResult(
        result.ok
          ? { ok: true, text: `${effectiveModel} respondió en ${result.ms} ms` }
          : { ok: false, text: `${effectiveModel}: ${result.error}` },
      )
    })
  }

  const optionClass = (active: boolean, disabled: boolean) =>
    `flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
      disabled
        ? "cursor-not-allowed border-border/60 opacity-60"
        : active
          ? "cursor-pointer border-primary bg-primary/10"
          : "cursor-pointer border-border hover:border-primary/50"
    }`

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Modelo Gemini (chat y traducción)</p>
          <p className="text-xs text-muted-foreground">
            Default: <code className="rounded bg-background/60 px-1.5 py-0.5">{defaultModel}</code>. Los modelos
            deprecados o que ya no existen quedan bloqueados.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || !hasApiKey}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Consultando…" : "Actualizar modelos disponibles"}
        </Button>
      </div>
      <p className="mb-4 text-[11px] text-muted-foreground/70" suppressHydrationWarning>
        {catalog
          ? `Catálogo real de la API: ${catalog.models.length} modelos · actualizado ${fmtDate(catalog.fetchedAt)}`
          : "Aún no se ha descargado el catálogo: se muestra una lista semilla. Pulsa “Actualizar modelos disponibles” para ver los modelos reales de tu API key."}
      </p>

      {currentUnavailable && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-500 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            El modelo actual <b>{currentModel}</b> {inList ? "está deprecado" : "ya no aparece en el catálogo"}. El chat y
            la traducción usan el respaldo automáticamente; elige otro modelo y guarda.
          </span>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((m) => {
          const isCurrent = m.id === currentModel
          const isFallback = m.id === fallback
          return (
            <label key={m.id} className={optionClass(selected === m.id, m.deprecated)}>
              <input
                type="radio"
                name="model"
                disabled={m.deprecated}
                checked={selected === m.id}
                onChange={() => {
                  setSelected(m.id)
                  setTestResult(null)
                }}
                className="mt-1 accent-purple-500"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{m.id}</span>
                  {isCurrent && (
                    <span className="rounded-full border border-primary/50 bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                      actual
                    </span>
                  )}
                  {isFallback && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" /> respaldo
                    </span>
                  )}
                  {m.deprecated && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/50 bg-red-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-red-500">
                      <Ban className="h-3 w-3" /> deprecado
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {m.displayName}
                  {!m.fromSeed && (
                    <>
                      {" "}
                      · entrada {fmtInt(m.inputTokenLimit)} · salida {fmtInt(m.outputTokenLimit)} tokens
                    </>
                  )}
                </span>
                {m.description && !m.fromSeed && (
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/60" title={m.description}>
                    {m.description}
                  </span>
                )}
                {m.fromSeed && m.description && (
                  <span className="block text-[11px] text-muted-foreground/60">{m.description}</span>
                )}
              </span>
            </label>
          )
        })}

        {!catalog && (
          <label className={optionClass(selected === "custom", false)}>
            <input
              type="radio"
              name="model"
              checked={selected === "custom"}
              onChange={() => setSelected("custom")}
              className="mt-1 accent-purple-500"
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
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="fallback-model" className="mb-1 block text-xs text-muted-foreground">
          Modelo de respaldo — si el principal deja de existir, chat y traducción reintentan una vez con este
        </label>
        <select
          id="fallback-model"
          value={fallback}
          onChange={(e) => setFallback(e.target.value)}
          className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none sm:w-auto sm:min-w-[20rem]"
        >
          {!selectable.some((m) => m.id === fallback) && fallback && <option value={fallback}>{fallback}</option>}
          {selectable.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={handleSave} disabled={saving || !effectiveModel}>
          {saving ? "Guardando…" : "Guardar configuración"}
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing || !effectiveModel || !hasApiKey}>
          <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
          {testing ? "Probando…" : "Probar modelo"}
        </Button>
        {message && (
          <p className={`text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>{message.text}</p>
        )}
      </div>
      {testResult && (
        <p
          className={`mt-2 flex items-center gap-1.5 text-xs ${testResult.ok ? "text-emerald-500" : "text-red-400"}`}
        >
          {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {testResult.text}
        </p>
      )}
    </div>
  )
}
