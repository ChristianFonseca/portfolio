"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { moveSection, toggleVisible } from "@/app/admin/actions"

export interface SectionSummary {
  slug: string
  kind: string
  title: string
  position: number
  visible: boolean
  updated_at: string
}

export function SectionsList({ sections }: { sections: SectionSummary[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError("")
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setError(res.error ?? "Error")
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {sections.map((section, i) => (
        <div
          key={section.slug}
          className={`flex items-center gap-4 rounded-xl border border-border bg-card/50 px-5 py-4 ${
            section.visible ? "" : "opacity-50"
          }`}
        >
          <div className="flex flex-col gap-1">
            <button
              aria-label="Subir sección"
              disabled={pending || i === 0}
              onClick={() => run(() => moveSection(section.slug, "up"))}
              className="text-muted-foreground hover:text-primary disabled:opacity-30 text-xs leading-none"
            >
              ▲
            </button>
            <button
              aria-label="Bajar sección"
              disabled={pending || i === sections.length - 1}
              onClick={() => run(() => moveSection(section.slug, "down"))}
              className="text-muted-foreground hover:text-primary disabled:opacity-30 text-xs leading-none"
            >
              ▼
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{section.title}</p>
            <p className="text-xs text-muted-foreground">
              {section.slug} · tipo {section.kind} · actualizada {section.updated_at}
            </p>
          </div>
          {!section.visible && (
            <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
              oculta
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-xs bg-transparent"
            disabled={pending}
            onClick={() => run(() => toggleVisible(section.slug))}
          >
            {section.visible ? "Ocultar" : "Mostrar"}
          </Button>
          <Button size="sm" className="rounded-full text-xs" asChild>
            <Link href={`/sections/${section.slug}`}>Editar</Link>
          </Button>
        </div>
      ))}
    </div>
  )
}
