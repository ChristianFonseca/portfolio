"use client"

import { useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Eye, EyeOff, ChevronUp, ChevronDown, GripVertical } from "lucide-react"
import { moveSection, toggleVisible } from "@/app/admin/actions"

export interface SidebarSection {
  slug: string
  title: string
  position: number
  visible: boolean
}

export function SidebarSections({ sections }: { sections: SidebarSection[] }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn()
      router.refresh()
    })

  return (
    <nav aria-label="Secciones de la landing">
      <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        Secciones
      </p>
      <ul className="space-y-0.5">
        {sections.map((section, i) => {
          const href = `/sections/${section.slug}`
          const active = pathname === href || pathname === `/admin/sections/${section.slug}`
          return (
            <li key={section.slug} className="group relative">
              <Link
                href={href}
                className={`flex items-center gap-2 rounded-lg py-2 pl-2 pr-20 text-sm transition-colors ${
                  active
                    ? "bg-gradient-to-r from-primary/20 to-accent/10 text-foreground ring-1 ring-primary/40"
                    : section.visible
                      ? "text-muted-foreground hover:bg-card/80 hover:text-foreground"
                      : "text-muted-foreground/50 hover:bg-card/80"
                }`}
              >
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                <span className="w-4 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground/50">
                  {i + 1}
                </span>
                <span className={`truncate ${section.visible ? "" : "line-through decoration-muted-foreground/40"}`}>
                  {section.title}
                </span>
              </Link>
              <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Subir sección"
                  disabled={pending || i === 0}
                  onClick={() => run(() => moveSection(section.slug, "up"))}
                  className="rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:text-primary group-hover:opacity-100 disabled:opacity-0"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Bajar sección"
                  disabled={pending || i === sections.length - 1}
                  onClick={() => run(() => moveSection(section.slug, "down"))}
                  className="rounded p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:text-primary group-hover:opacity-100 disabled:opacity-0"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={section.visible ? "Ocultar sección" : "Mostrar sección"}
                  disabled={pending}
                  onClick={() => run(() => toggleVisible(section.slug))}
                  className={`rounded p-0.5 transition-colors ${
                    section.visible
                      ? "text-muted-foreground/60 hover:text-primary"
                      : "text-yellow-500/80 hover:text-yellow-400"
                  }`}
                >
                  {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 rounded-lg border border-dashed border-border/70 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground/60">
        El orden de esta lista es el orden en la landing. El ojo oculta la sección sin borrar sus datos.
      </p>
    </nav>
  )
}
