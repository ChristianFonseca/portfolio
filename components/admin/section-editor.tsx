"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { GripVertical, ChevronUp, ChevronDown, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveSection } from "@/app/admin/actions"
import { TagsInput } from "@/components/admin/tags-input"
import type { FieldSpec, SubFieldSpec } from "@/lib/content/specs"

// Form model: como los datos reales, pero con bullets como texto multilínea
// (un ítem por línea) para editarlos cómodo. Tags se editan como chips.
type FormValue = string | boolean | string[] | FormItem[]
type FormItem = Record<string, string | boolean | string[]>
type FormModel = Record<string, FormValue>

function toFormModel(spec: FieldSpec[], data: Record<string, unknown>): FormModel {
  const model: FormModel = {}
  for (const field of spec) {
    const value = data[field.key]
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

export function SectionEditor({
  slug,
  title,
  spec,
  initialData,
}: {
  slug: string
  title: string
  spec: FieldSpec[]
  initialData: Record<string, unknown>
}) {
  const [model, setModel] = useState<FormModel>(() => toFormModel(spec, initialData))
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const touch = () => {
    setDirty(true)
    setSaved(false)
  }

  const setField = (key: string, value: FormValue) => {
    setModel((prev) => ({ ...prev, [key]: value }))
    touch()
  }

  const setItemField = (key: string, index: number, subKey: string, value: string | boolean | string[]) => {
    setModel((prev) => {
      const items = [...(prev[key] as FormItem[])]
      items[index] = { ...items[index], [subKey]: value }
      return { ...prev, [key]: items }
    })
    touch()
  }

  const mutateItems = (key: string, fn: (items: FormItem[]) => FormItem[]) => {
    setModel((prev) => ({ ...prev, [key]: fn([...(prev[key] as FormItem[])]) }))
    touch()
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveSection(slug, fromFormModel(spec, model))
      if (result.ok) {
        setDirty(false)
        setSaved(true)
        setToast({ ok: true, text: "Guardado — ya visible en christianfonseca.dev" })
      } else {
        setToast({ ok: false, text: result.error })
      }
    })
  }

  return (
    <div>
      {/* Barra de acciones sticky */}
      <div className="sticky top-0 z-20 -mx-6 mb-8 border-b border-border bg-[#0d0918]/90 px-6 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              Secciones
            </Link>{" "}
            / <span className="font-semibold text-foreground">{title}</span>
          </p>
          <div className="ml-auto flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-xs ${
                dirty ? "text-yellow-400" : saved ? "text-emerald-400" : "text-muted-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  dirty ? "bg-yellow-400" : saved ? "bg-emerald-400" : "bg-muted-foreground/50"
                }`}
              />
              {dirty ? "Cambios sin guardar" : saved ? "Guardado" : "Sin cambios"}
            </span>
            <Button variant="outline" size="sm" className="rounded-full text-xs bg-transparent" asChild>
              <a href="https://christianfonseca.dev" target="_blank" rel="noopener noreferrer">
                Ver landing <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={pending || !dirty}
              className="rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_20px_-4px_rgba(168,85,247,0.6)] hover:brightness-110 disabled:opacity-50"
            >
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {spec.map((field) => (
          <div key={field.key}>
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
                            if (confirm(`¿Eliminar este ${field.itemName}?`)) {
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
                              sub.type === "textarea" || sub.type === "bullets" || sub.type === "tags"
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
                    + Agregar {field.itemName}
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
              ? "border-emerald-500/40 bg-emerald-950/80 text-emerald-200"
              : "border-red-500/40 bg-red-950/80 text-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
