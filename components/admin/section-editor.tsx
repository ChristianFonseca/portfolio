"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { GripVertical, ChevronUp, ChevronDown, X, ExternalLink, Sparkles, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveSection } from "@/app/admin/actions"
import { TagsInput } from "@/components/admin/tags-input"
import { ImageField } from "@/components/admin/image-field"
import type { FieldSpec, SubFieldSpec } from "@/lib/content/specs"
import type { SectionKind } from "@/lib/content/schemas"
import type { Locale } from "@/lib/i18n/dictionaries"

// Form model: como los datos reales, pero con bullets como texto multilínea
// (un ítem por línea). Tags se editan como chips.
type FormValue = string | boolean | string[] | FormItem[]
type FormItem = Record<string, string | boolean | string[]>
type FormModel = Record<string, FormValue>

function toFormModel(spec: FieldSpec[], data: Record<string, unknown>): FormModel {
  const model: FormModel = {}
  for (const field of spec) {
    const value = data?.[field.key]
    if (field.type === "items") {
      const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
      model[field.key] = items.map((item) => {
        const formItem: FormItem = {}
        for (const sub of field.fields) {
          const v = item[sub.key]
          if (sub.type === "tags") formItem[sub.key] = Array.isArray(v) ? ([...v] as string[]) : []
          else if (sub.type === "bullets") formItem[sub.key] = Array.isArray(v) ? (v as string[]).join("\n") : ""
          else if (sub.type === "checkbox") formItem[sub.key] = Boolean(v)
          else formItem[sub.key] = typeof v === "string" ? v : ""
        }
        return formItem
      })
    } else if (field.type === "tags") {
      model[field.key] = Array.isArray(value) ? ([...value] as string[]) : []
    } else {
      model[field.key] = typeof value === "string" ? value : ""
    }
  }
  return model
}

function fromFormModel(spec: FieldSpec[], model: FormModel): Record<string, unknown> {
  const splitLines = (s: string) => s.split("\n").map((t) => t.trim()).filter(Boolean)
  const data: Record<string, unknown> = {}
  for (const field of spec) {
    const value = model[field.key]
    if (field.type === "items") {
      const items = Array.isArray(value) ? (value as FormItem[]) : []
      data[field.key] = items.map((item) => {
        const out: Record<string, unknown> = {}
        for (const sub of field.fields) {
          const v = item[sub.key]
          if (sub.type === "tags") out[sub.key] = Array.isArray(v) ? v : []
          else if (sub.type === "bullets") out[sub.key] = splitLines(String(v ?? ""))
          else if (sub.type === "checkbox") out[sub.key] = Boolean(v)
          else out[sub.key] = String(v ?? "")
        }
        return out
      })
    } else if (field.type === "tags") {
      data[field.key] = Array.isArray(value) ? value : []
    } else {
      data[field.key] = String(value ?? "")
    }
  }
  return data
}

function emptyItem(fields: SubFieldSpec[]): FormItem {
  const item: FormItem = {}
  for (const sub of fields) item[sub.key] = sub.type === "checkbox" ? false : sub.type === "tags" ? [] : ""
  return item
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

const LOCALE_LABELS: Record<Locale, string> = { en: "English", es: "Español" }

export function SectionEditor({
  slug,
  kind,
  title,
  titleEs,
  spec,
  initialData,
}: {
  slug: string
  kind: SectionKind
  title: string
  titleEs: string
  spec: FieldSpec[]
  initialData: { en?: Record<string, unknown>; es?: Record<string, unknown> }
}) {
  const [models, setModels] = useState<Record<Locale, FormModel>>(() => ({
    en: toFormModel(spec, initialData.en ?? {}),
    es: toFormModel(spec, initialData.es ?? initialData.en ?? {}),
  }))
  const [titles, setTitles] = useState<Record<Locale, string>>({ en: title, es: titleEs || title })
  const [active, setActive] = useState<Locale>("en")
  // stale[L] = el contenido de L quedó desactualizado respecto al otro idioma
  const [stale, setStale] = useState<Record<Locale, boolean>>({ en: false, es: false })
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const other: Locale = active === "en" ? "es" : "en"
  const canSave = dirty && !stale.en && !stale.es && !pending && !translating

  // Editar el idioma activo lo marca fresco y desactualiza el otro
  const touch = () => {
    setDirty(true)
    setSaved(false)
    setStale((prev) => ({ ...prev, [active]: false, [other]: true }))
  }
  // Editar directamente el idioma "stale" cuenta como traducción manual
  const touchSelfOnly = () => {
    setDirty(true)
    setSaved(false)
    setStale((prev) => ({ ...prev, [active]: false }))
  }
  const handleTouch = () => {
    if (stale[active]) touchSelfOnly()
    else touch()
  }

  const model = models[active]
  const setField = (key: string, value: FormValue) => {
    setModels((prev) => ({ ...prev, [active]: { ...prev[active], [key]: value } }))
    handleTouch()
  }
  const setItemField = (key: string, index: number, subKey: string, value: string | boolean | string[]) => {
    setModels((prev) => {
      const items = [...(prev[active][key] as FormItem[])]
      items[index] = { ...items[index], [subKey]: value }
      return { ...prev, [active]: { ...prev[active], [key]: items } }
    })
    handleTouch()
  }
  const mutateItems = (key: string, fn: (items: FormItem[]) => FormItem[]) => {
    setModels((prev) => ({ ...prev, [active]: { ...prev[active], [key]: fn([...(prev[active][key] as FormItem[])]) } }))
    handleTouch()
  }

  const handleTranslate = async () => {
    setTranslating(true)
    setToast(null)
    try {
      const res = await fetch("/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, from: active, to: other, data: fromFormModel(spec, models[active]) }),
      })
      const payload = await res.json().catch(() => ({}))
      if (res.ok && payload.data) {
        setModels((prev) => ({ ...prev, [other]: toFormModel(spec, payload.data) }))
        setStale((prev) => ({ ...prev, [other]: false }))
        setDirty(true)
        setToast({
          ok: true,
          text: `Traducción a ${LOCALE_LABELS[other]} generada con ${payload.model}. Revísala en la pestaña ${other.toUpperCase()} y guarda.`,
        })
      } else {
        setToast({ ok: false, text: payload.error ?? "Error al traducir" })
      }
    } catch {
      setToast({ ok: false, text: "No se pudo conectar con el servidor" })
    } finally {
      setTranslating(false)
    }
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveSection(slug, {
        en: fromFormModel(spec, models.en),
        es: fromFormModel(spec, models.es),
        title: titles.en,
        title_es: titles.es,
      })
      if (result.ok) {
        setDirty(false)
        setSaved(true)
        setToast({ ok: true, text: "Guardado — ya visible en christianfonseca.dev y /es" })
      } else {
        setToast({ ok: false, text: result.error })
      }
    })
  }

  const anyStale = stale.en || stale.es
  const statusText = pending
    ? "Guardando…"
    : anyStale
      ? `Falta actualizar ${stale.en ? "EN" : "ES"}`
      : dirty
        ? "Cambios sin guardar"
        : saved
          ? "Guardado"
          : "Sin cambios"

  const markUpToDate = () => {
    setStale({ en: false, es: false })
    setToast({ ok: true, text: "Ambos idiomas marcados como al día — ya puedes guardar." })
  }

  return (
    <div>
      {/* Barra de acciones sticky */}
      <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-border bg-background/85 px-6 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Secciones
            </Link>{" "}
            / <span className="font-semibold text-foreground">{active === "es" ? titles.es : titles.en}</span>
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-xs ${
                stale.en || stale.es
                  ? "text-yellow-500"
                  : dirty
                    ? "text-yellow-500"
                    : saved
                      ? "text-emerald-500"
                      : "text-muted-foreground"
              }`}
            >
              {stale.en || stale.es ? (
                <AlertTriangle className="h-3.5 w-3.5" />
              ) : (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    dirty ? "bg-yellow-500" : saved ? "bg-emerald-500" : "bg-muted-foreground/50"
                  }`}
                />
              )}
              {statusText}
            </span>
            {anyStale && (
              <Button
                variant="outline"
                size="sm"
                onClick={markUpToDate}
                className="border-yellow-500/50 text-xs text-yellow-600 hover:bg-yellow-500/10 dark:text-yellow-400"
              >
                Marcar al día
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <a
                href={active === "es" ? "https://christianfonseca.dev/es" : "https://christianfonseca.dev"}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver landing <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!canSave}
              className=""
            >
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de idioma + traducir con IA */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-border bg-card/40 p-1">
          {(["en", "es"] as Locale[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setActive(loc)}
              className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active === loc
                  ? "bg-gradient-to-r from-primary/80 to-accent/80 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {loc.toUpperCase()}
              {stale[loc] && (
                <span
                  title="Desactualizado"
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-yellow-500"
                />
              )}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={translating || pending}
          className="text-xs"
        >
          {translating ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
          )}
          {translating
            ? "Traduciendo…"
            : `Traducir ${active.toUpperCase()} → ${other.toUpperCase()} con IA`}
        </Button>
        <p className="text-xs text-muted-foreground">
          La IA es opcional: también puedes escribir la traducción a mano en la otra pestaña.
        </p>
      </div>

      {/* Aviso cuando la versión activa está desactualizada */}
      {stale[active] && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Esta versión ({active.toUpperCase()}) quedó desactualizada respecto a {other.toUpperCase()}. Tienes 3
            opciones: <b>edítala a mano</b> (se marca al día sola), genera la traducción con IA desde la pestaña{" "}
            {other.toUpperCase()}, o usa <b>Marcar al día</b> si ya está correcta.
          </span>
        </div>
      )}

      {/* Título de la sección por idioma */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Título de la sección (EN)
          </label>
          <input
            type="text"
            value={titles.en}
            onChange={(e) => {
              setTitles((prev) => ({ ...prev, en: e.target.value }))
              setDirty(true)
              setSaved(false)
            }}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Título de la sección (ES)
          </label>
          <input
            type="text"
            value={titles.es}
            onChange={(e) => {
              setTitles((prev) => ({ ...prev, es: e.target.value }))
              setDirty(true)
              setSaved(false)
            }}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-8">
        {spec.map((field) => (
          <div key={`${active}-${field.key}`}>
            {field.type === "items" ? (
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {field.label}
                </p>
                <div className="space-y-4">
                  {(model[field.key] as FormItem[]).map((item, i, arr) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card/40">
                      <div className="flex items-center gap-2 border-b border-border/70 bg-card/70 px-4 py-2.5">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <span className="flex-1 truncate text-sm font-semibold">
                          {String(item[field.titleKey] || `${field.itemName} ${i + 1}`)}
                        </span>
                        <button
                          type="button"
                          aria-label="Subir"
                          disabled={i === 0}
                          onClick={() =>
                            mutateItems(field.key, (items) => {
                              ;[items[i - 1], items[i]] = [items[i], items[i - 1]]
                              return items
                            })
                          }
                          className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-25 transition-colors"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Bajar"
                          disabled={i === arr.length - 1}
                          onClick={() =>
                            mutateItems(field.key, (items) => {
                              ;[items[i], items[i + 1]] = [items[i + 1], items[i]]
                              return items
                            })
                          }
                          className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-25 transition-colors"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Eliminar"
                          onClick={() => {
                            if (confirm(`¿Eliminar este ${field.itemName} (solo en ${active.toUpperCase()})?`)) {
                              mutateItems(field.key, (items) => items.filter((_, j) => j !== i))
                            }
                          }}
                          className="rounded p-1 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-4 p-4 md:grid-cols-2">
                        {field.fields.map((sub) => (
                          <div
                            key={sub.key}
                            className={
                              sub.type === "textarea" || sub.type === "bullets" || sub.type === "tags" || sub.type === "image"
                                ? "md:col-span-2"
                                : ""
                            }
                          >
                            <label className="mb-1.5 block text-xs text-muted-foreground">
                              {sub.label}
                              {sub.hint && <span className="opacity-60"> — {sub.hint}</span>}
                            </label>
                            {sub.type === "checkbox" ? (
                              <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item[sub.key])}
                                  onChange={(e) => setItemField(field.key, i, sub.key, e.target.checked)}
                                  className="h-4 w-4 accent-purple-500"
                                />
                                <span className="text-sm text-foreground">Sí</span>
                              </label>
                            ) : sub.type === "select" ? (
                              <select
                                value={String(item[sub.key] || sub.options?.[0] || "")}
                                onChange={(e) => setItemField(field.key, i, sub.key, e.target.value)}
                                className={inputClass}
                              >
                                {(sub.options ?? []).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : sub.type === "image" ? (
                              <ImageField
                                value={String(item[sub.key] ?? "")}
                                onChange={(url) => setItemField(field.key, i, sub.key, url)}
                              />
                            ) : sub.type === "tags" ? (
                              <TagsInput
                                value={(item[sub.key] as string[]) ?? []}
                                onChange={(tags) => setItemField(field.key, i, sub.key, tags)}
                              />
                            ) : sub.type === "textarea" || sub.type === "bullets" ? (
                              <textarea
                                rows={sub.type === "bullets" ? 5 : 3}
                                value={String(item[sub.key] ?? "")}
                                onChange={(e) => setItemField(field.key, i, sub.key, e.target.value)}
                                className={`${inputClass} resize-y`}
                              />
                            ) : (
                              <input
                                type="text"
                                value={String(item[sub.key] ?? "")}
                                onChange={(e) => setItemField(field.key, i, sub.key, e.target.value)}
                                className={inputClass}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => mutateItems(field.key, (items) => [...items, emptyItem(field.fields)])}
                    className="w-full rounded-2xl border border-dashed border-border py-3.5 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    + Agregar {field.itemName} ({active.toUpperCase()})
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {field.label}
                  {"hint" in field && field.hint && <span className="opacity-60 normal-case"> — {field.hint}</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={6}
                    value={String(model[field.key] ?? "")}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={`${inputClass} resize-y`}
                  />
                ) : field.type === "image" ? (
                  <ImageField value={String(model[field.key] ?? "")} onChange={(url) => setField(field.key, url)} />
                ) : field.type === "tags" ? (
                  <TagsInput
                    value={(model[field.key] as string[]) ?? []}
                    onChange={(tags) => setField(field.key, tags)}
                  />
                ) : (
                  <input
                    type="text"
                    value={String(model[field.key] ?? "")}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={inputClass}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm shadow-2xl backdrop-blur-md ${
            toast.ok
              ? "border-emerald-500/50 bg-emerald-100/95 text-emerald-900 dark:bg-emerald-950/85 dark:text-emerald-200"
              : "border-red-500/50 bg-red-100/95 text-red-900 dark:bg-red-950/85 dark:text-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
