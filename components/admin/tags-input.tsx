"use client"

import { useState } from "react"
import { X } from "lucide-react"

// Chips editables: Enter, coma o blur agregan; ✕ quita.
export function TagsInput({
  value,
  onChange,
  placeholder = "añadir…",
}: {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState("")

  const commit = () => {
    const tag = draft.trim().replace(/,+$/, "").trim()
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setDraft("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commit()
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
        >
          {tag}
          <button
            type="button"
            aria-label={`Quitar ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-primary/60 hover:text-accent transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={value.length ? "" : placeholder}
        className="flex-1 min-w-[90px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none py-0.5"
      />
    </div>
  )
}
