"use client"

import { ChevronUp, ChevronDown, X, Plus } from "lucide-react"

export type Paper = { name: string; url: string; authors: string }

const inputClass =
  "rounded-lg border border-border bg-background/50 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

// Editor de papers/publicaciones: nombre + link + autores (autores opcional).
export function PapersInput({ value, onChange }: { value: Paper[]; onChange: (v: Paper[]) => void }) {
  const items = Array.isArray(value) ? value : []

  const patch = (i: number, p: Partial<Paper>) => onChange(items.map((it, j) => (j === i ? { ...it, ...p } : it)))
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i))
  const add = () => onChange([...items, { name: "", url: "", authors: "" }])
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-border bg-background/30 p-2.5">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground">#{i + 1}</span>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Bajar" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="rounded p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Quitar" onClick={() => remove(i)} className="rounded p-0.5 text-muted-foreground hover:text-red-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <input
              value={it.name}
              onChange={(e) => patch(i, { name: e.target.value })}
              placeholder="Título del paper"
              className={`${inputClass} w-full`}
            />
            <input
              value={it.url}
              onChange={(e) => patch(i, { url: e.target.value })}
              placeholder="https://… (link, opcional)"
              className={`${inputClass} w-full font-mono text-xs`}
            />
            <input
              value={it.authors}
              onChange={(e) => patch(i, { authors: e.target.value })}
              placeholder="Autores (opcional) — ej. C. Fonseca, A. Pérez"
              className={`${inputClass} w-full`}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar paper
      </button>
    </div>
  )
}
