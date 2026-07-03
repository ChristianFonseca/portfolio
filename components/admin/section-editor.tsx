"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { saveSection } from "@/app/admin/actions"
import type { FieldSpec, SubFieldSpec } from "@/lib/content/specs"

// El editor trabaja sobre un "form model": igual que los datos reales, pero con
// tags como "a, b, c" y bullets como texto multilínea, para editarlos cómodo.
type FormValue = string | boolean | FormItem[]
type FormItem = Record<string, string | boolean>
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
          if (sub.type === "tags") formItem[sub.key] = Array.isArray(v) ? (v as string[]).join(", ") : ""
          else if (sub.type === "bullets") formItem[sub.key] = Array.isArray(v) ? (v as string[]).join("\n") : ""
          else if (sub.type === "checkbox") formItem[sub.key] = Boolean(v)
          else formItem[sub.key] = typeof v === "string" ? v : ""
        }
        return formItem
      })
    } else if (field.type === "tags") {
      model[field.key] = Array.isArray(value) ? (value as string[]).join(", ") : ""
    } else {
      model[field.key] = typeof value === "string" ? value : ""
    }
  }
  return model
}

function fromFormModel(spec: FieldSpec[], model: FormModel): Record<string, unknown> {
  const splitTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean)
  const splitLines = (s: string) => s.split("\n").map((t) => t.trim()).filter(Boolean)
  const data: Record<string, unknown> = {}
  for (const field of spec) {
    const value = model[field.key]
    if (field.type === "items") {
      const items = Array.isArray(value) ? value : []
      data[field.key] = items.map((item) => {
        const out: Record<string, unknown> = {}
        for (const sub of field.fields) {
          const v = item[sub.key]
          if (sub.type === "tags") out[sub.key] = splitTags(String(v ?? ""))
          else if (sub.type === "bullets") out[sub.key] = splitLines(String(v ?? ""))
          else if (sub.type === "checkbox") out[sub.key] = Boolean(v)
          else out[sub.key] = String(v ?? "")
        }
        return out
      })
    } else if (field.type === "tags") {
      data[field.key] = splitTags(String(value ?? ""))
    } else {
      data[field.key] = String(value ?? "")
    }
  }
  return data
}

function emptyItem(fields: SubFieldSpec[]): FormItem {
  const item: FormItem = {}
  for (const sub of fields) item[sub.key] = sub.type === "checkbox" ? false : ""
  return item
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"

export function SectionEditor({
  slug,
  spec,
  initialData,
}: {
  slug: string
  spec: FieldSpec[]
  initialData: Record<string, unknown>
}) {
  const [model, setModel] = useState<FormModel>(() => toFormModel(spec, initialData))
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const setField = (key: string, value: FormValue) => {
    setModel((prev) => ({ ...prev, [key]: value }))
    setMessage(null)
  }

  const setItemField = (key: string, index: number, subKey: string, value: string | boolean) => {
    setModel((prev) => {
      const items = [...(prev[key] as FormItem[])]
      items[index] = { ...items[index], [subKey]: value }
      return { ...prev, [key]: items }
    })
    setMessage(null)
  }

  const mutateItems = (key: string, fn: (items: FormItem[]) => FormItem[]) => {
    setModel((prev) => ({ ...prev, [key]: fn([...(prev[key] as FormItem[])]) }))
    setMessage(null)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveSection(slug, fromFormModel(spec, model))
      setMessage(
        result.ok
          ? { ok: true, text: "Guardado — ya visible en christianfonseca.dev" }
          : { ok: false, text: result.error },
      )
    })
  }

  return (
    <div className="space-y-8">
      {spec.map((field) => (
        <div key={field.key}>
          {field.type === "items" ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">{field.label}</p>
              <div className="space-y-4">
                {(model[field.key] as FormItem[]).map((item, i, arr) => (
                  <div key={i} className="rounded-xl border border-border bg-card/50 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-card/80 border-b border-border">
                      <span className="text-sm font-medium flex-1 truncate">
                        {String(item[field.titleKey] || `(${field.itemName} ${i + 1})`)}
                      </span>
                      <button
                        aria-label="Subir"
                        disabled={i === 0}
                        onClick={() => mutateItems(field.key, (items) => {
                          ;[items[i - 1], items[i]] = [items[i], items[i - 1]]
                          return items
                        })}
                        className="text-muted-foreground hover:text-primary disabled:opacity-30 text-xs"
                      >
                        ▲
                      </button>
                      <button
                        aria-label="Bajar"
                        disabled={i === arr.length - 1}
                        onClick={() => mutateItems(field.key, (items) => {
                          ;[items[i], items[i + 1]] = [items[i + 1], items[i]]
                          return items
                        })}
                        className="text-muted-foreground hover:text-primary disabled:opacity-30 text-xs"
                      >
                        ▼
                      </button>
                      <button
                        aria-label="Eliminar"
                        onClick={() => {
                          if (confirm(`¿Eliminar este ${field.itemName}?`)) {
                            mutateItems(field.key, (items) => items.filter((_, j) => j !== i))
                          }
                        }}
                        className="text-muted-foreground hover:text-red-400 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-4 grid gap-3 md:grid-cols-2">
                      {field.fields.map((sub) => (
                        <div key={sub.key} className={sub.type === "textarea" || sub.type === "bullets" ? "md:col-span-2" : ""}>
                          <label className="block text-xs text-muted-foreground mb-1">
                            {sub.label}
                            {sub.hint && <span className="opacity-60"> — {sub.hint}</span>}
                          </label>
                          {sub.type === "checkbox" ? (
                            <input
                              type="checkbox"
                              checked={Boolean(item[sub.key])}
                              onChange={(e) => setItemField(field.key, i, sub.key, e.target.checked)}
                              className="h-4 w-4 accent-[--primary]"
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
                  onClick={() => mutateItems(field.key, (items) => [...items, emptyItem(field.fields)])}
                  className="w-full rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  + Agregar {field.itemName}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
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

      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <Button onClick={handleSave} disabled={pending} className="rounded-full mt-4">
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
        {message && (
          <p className={`text-sm mt-4 ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>
        )}
      </div>
    </div>
  )
}
