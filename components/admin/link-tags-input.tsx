"use client"

import { ChevronUp, ChevronDown, X, Plus } from "lucide-react"

export type LinkTag = { name: string; url: string }

const inputClass =
  "rounded-lg border border-border bg-background/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

// Editor de badges con URL opcional: cada fila es nombre + enlace (docs/web).
export function LinkTagsInput({ value, onChange }: { value: LinkTag[]; onChange: (v: LinkTag[]) => void }) {
  const items = Array.isArray(value) ? value : []

  const patch = (i: number, p: Partial<LinkTag>) => onChange(items.map((it, j) => (j === i ? { ...it, ...p } : it)))
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, { name: "", url: "" }])
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={it.name}
            onChange={(e) => patch(i, { name: e.target.value })}
            placeholder="Nombre (ej. LangChain)"
            className={`${inputClass} w-44 shrink-0`}
          />
          <input
            value={it.url}
            onChange={(e) => patch(i, { url: e.target.value })}
            placeholder="https://… (enlace opcional)"
            className={`${inputClass} min-w-0 flex-1 font-mono text-xs`}
          />
          <button
            type="button"
            aria-label="Subir"
            disabled={i === 0}
            onClick={() => move(i, -1)}
            className="rounded p-1 text-muted-foreground hover:text-primary disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Bajar"
            disabled={i === items.length - 1}
            onClick={() => move(i, 1)}
            className="rounded p-1 text-muted-foreground hover:text-primary disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Quitar"
            onClick={() => remove(i)}
            className="rounded p-1 text-muted-foreground hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar skill
      </button>
    </div>
  )
}
