"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Ban, CheckCircle2, FlaskConical, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  refreshGeminiModels,
  setGeminiBlocked,
  setGeminiFallbackModel,
  setGeminiModel,
  testGeminiModel,
} from "@/app/admin/actions"
import type { GeminiCatalog, GeminiModelInfo } from "@/lib/gemini"
import { PRICING_UPDATED, PRICING_URL, fmtPricePair, priceFor } from "@/lib/gemini-pricing"

interface SeedModel {
  id: string
  label: string
}

type Row = GeminiModelInfo & { fromSeed?: boolean; blocked: boolean }

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })
const fmtInt = (n: number) => (n ? n.toLocaleString("es") : "—")

export function ConfigForm({
  currentModel,
  fallbackModel,
  defaultModel,
  seedModels,
  catalog,
  blocked,
  hasApiKey,
  deprecationsUrl,
  deprecationsChecked,
}: {
  currentModel: string
  fallbackModel: string
  defaultModel: string
  seedModels: SeedModel[]
  catalog: GeminiCatalog | null
  blocked: string[]
  hasApiKey: boolean
  deprecationsUrl: string
  deprecationsChecked: string
}) {
  const router = useRouter()
  const blockedSet = new Set(blocked)
  const baseRows: Row[] = (
    catalog
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
  ).map((m) => ({ ...m, blocked: blockedSet.has(m.id) }))

  // Orden: el actual primero, luego usables, luego bloqueados, y los deprecados al final.
  const rank = (m: Row) => (m.id === currentModel ? 0 : m.deprecated ? 3 : m.blocked ? 2 : 1)
  const rows = [...baseRows].sort((a, b) => rank(a) - rank(b) || b.id.localeCompare(a.id, "en", { numeric: true }))

  const inList = rows.some((m) => m.id === currentModel)
  const currentRow = rows.find((m) => m.id === currentModel)
  const currentUnavailable = catalog ? !inList || Boolean(currentRow?.deprecated) || Boolean(currentRow?.blocked) : false

  const [selected, setSelected] = useState(inList ? currentModel : catalog ? "" : "custom")
  const [custom, setCustom] = useState(inList ? "" : catalog ? "" : currentModel)
  const [fallback, setFallback] = useState(fallbackModel)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, startSaving] = useTransition()
  const [refreshing, startRefreshing] = useTransition()
  const [testing, startTesting] = useTransition()
  const [blocking, startBlocking] = useTransition()
  const [blockingId, setBlockingId] = useState<string | null>(null)

  const effectiveModel = selected === "custom" ? custom.trim() : selected
  const selectable = rows.filter((m) => !m.deprecated && !m.blocked)
  const deprecatedCount = rows.filter((m) => m.deprecated).length

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
              text: `Catálogo actualizado: ${result.available} modelos disponibles${result.deprecated ? ` y ${result.deprecated} deprecados (bloqueados)` : ""}.`,
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

  const handleBlock = (id: string, block: boolean) => {
    setBlockingId(id)
    startBlocking(async () => {
      const result = await setGeminiBlocked(id, block)
      setBlockingId(null)
      if (!result.ok) setMessage({ ok: false, text: result.error })
      else if (selected === id && block) setSelected(currentModel !== id ? currentModel : "")
      router.refresh()
    })
  }

  const optionClass = (active: boolean, disabled: boolean) =>
    `flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
      disabled
        ? "border-border/60 bg-background/20 opacity-70"
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
            Default: <code className="rounded bg-background/60 px-1.5 py-0.5">{defaultModel}</code>. Los deprecados
            quedan bloqueados solos; cualquier otro lo puedes bloquear a mano.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || !hasApiKey}>
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Consultando…" : "Actualizar modelos disponibles"}
        </Button>
      </div>
      <p className="mb-1 text-[11px] text-muted-foreground/70" suppressHydrationWarning>
        {catalog
          ? `Catálogo real de la API: ${catalog.models.length} modelos (${deprecatedCount} deprecados) · actualizado ${fmtDate(catalog.fetchedAt)}`
          : "Aún no se ha descargado el catálogo: se muestra una lista semilla. Pulsa “Actualizar modelos disponibles” para ver los modelos reales de tu API key."}
      </p>
      <p className="mb-4 text-[11px] text-muted-foreground/70">
        Precios: nivel de pago, USD por 1M tokens, según la{" "}
        <a href={PRICING_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          página de precios
        </a>{" "}
        al {PRICING_UPDATED}. Deprecados según la{" "}
        <a href={deprecationsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          página de deprecaciones
        </a>{" "}
        al {deprecationsChecked} (la API no expone ni precios ni deprecaciones; se mantienen a mano en{" "}
        <code>lib/gemini-pricing.ts</code> y <code>lib/gemini.ts</code>).
      </p>

      {currentUnavailable && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-500 dark:text-red-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            El modelo actual <b>{currentModel}</b>{" "}
            {!inList ? "ya no aparece en el catálogo" : currentRow?.deprecated ? "está deprecado" : "está bloqueado manualmente"}
            . El chat y la traducción usan el respaldo automáticamente; elige otro modelo y guarda.
          </span>
        </div>
      )}

      {/* Lista scrolleable: ~5 filas visibles */}
      <div className="max-h-[27rem] space-y-2 overflow-y-auto pr-1">
        {rows.map((m) => {
          const isCurrent = m.id === currentModel
          const isFallback = m.id === fallback
          const disabled = m.deprecated || m.blocked
          const price = priceFor(m.id)
          return (
            <label key={m.id} className={optionClass(selected === m.id, disabled)}>
              <input
                type="radio"
                name="model"
                disabled={disabled}
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
                  {m.blocked && !m.deprecated && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/50 bg-yellow-500/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-yellow-600 dark:text-yellow-400">
                      <ShieldOff className="h-3 w-3" /> bloqueado
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
                {price ? (
                  <span className="block text-xs">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{fmtPricePair(price)}</span>
                    {price.freeTier && <span className="text-muted-foreground"> · nivel gratuito disponible</span>}
                    {price.note && <span className="text-muted-foreground"> · {price.note}</span>}
                  </span>
                ) : (
                  <span className="block text-[11px] text-muted-foreground/60">precio no publicado para este id</span>
                )}
                {m.description && !m.fromSeed && (
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/60" title={m.description}>
                    {m.description}
                  </span>
                )}
                {m.fromSeed && m.description && (
                  <span className="block text-[11px] text-muted-foreground/60">{m.description}</span>
                )}
              </span>
              {!m.deprecated && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleBlock(m.id, !m.blocked)
                  }}
                  disabled={blocking}
                  className="shrink-0 self-center rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {blocking && blockingId === m.id ? "…" : m.blocked ? "Desbloquear" : "Bloquear"}
                </button>
              )}
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
      <p className="mt-1 text-[10px] text-muted-foreground/50">
        {rows.length} modelos · desplaza para ver el resto · el actual siempre aparece primero
      </p>

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
        {message && <p className={`text-sm ${message.ok ? "text-emerald-500" : "text-red-400"}`}>{message.text}</p>}
      </div>
      {testResult && (
        <p className={`mt-2 flex items-center gap-1.5 text-xs ${testResult.ok ? "text-emerald-500" : "text-red-400"}`}>
          {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {testResult.text}
        </p>
      )}
    </div>
  )
}
