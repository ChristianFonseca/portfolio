"use client"

import { useId, useState } from "react"
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ExperienceData, SectionEntry } from "@/lib/content/schemas"
import type { Dictionary } from "@/lib/i18n/dictionaries"

type Item = ExperienceData["items"][number]

// Línea de tiempo plegable. El detalle de cada puesto sigue en el HTML aunque esté
// cerrado (Google lo indexa igual); cerrado queda `inert` para el teclado y los
// lectores de pantalla. Abre el primero por defecto: el puesto actual.
export function ExperienceAccordion({
  id,
  section,
  dict,
}: {
  id: string
  section: SectionEntry<ExperienceData>
  dict: Dictionary
}) {
  const items = section.data.items
  const baseId = useId()
  const [open, setOpen] = useState<Set<number>>(() => new Set(items.length ? [0] : []))
  const allOpen = items.length > 0 && open.size === items.length

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <section id={id} className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {section.title}
        </h2>

        {items.length > 1 && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(allOpen ? new Set() : new Set(items.map((_, i) => i)))}
              aria-controls={items.map((_, i) => `${baseId}-panel-${i}`).join(" ")}
              data-track={`experience:${allOpen ? "collapse" : "expand"}-all:${id}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {allOpen ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
              {allOpen ? dict.experience.collapseAll : dict.experience.expandAll}
            </button>
          </div>
        )}

        <ol className="relative space-y-3 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-primary/60 before:via-border before:to-transparent xl:before:-left-[21px]">
          {items.map((item, i) => (
            <Row
              key={`${item.org}-${i}`}
              item={item}
              open={open.has(i)}
              onToggle={() => toggle(i)}
              buttonId={`${baseId}-button-${i}`}
              panelId={`${baseId}-panel-${i}`}
              currentLabel={dict.experience.current}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}

function Row({
  item,
  open,
  onToggle,
  buttonId,
  panelId,
  currentLabel,
}: {
  item: Item
  open: boolean
  onToggle: () => void
  buttonId: string
  panelId: string
  currentLabel: string
}) {
  return (
    <li className="relative pl-9 xl:pl-0">
      {/* Punto de la línea de tiempo: relleno y con brillo si es el puesto actual. En xl
          sale al margen para que las tarjetas tengan el mismo ancho que el resto */}
      <span
        aria-hidden
        className={`absolute left-[5px] top-6 h-[13px] w-[13px] rounded-full border-2 xl:-left-[27px] ${
          item.current
            ? "border-primary bg-primary shadow-[0_0_12px_rgba(168,85,247,0.8)]"
            : "border-primary/50 bg-background"
        }`}
      />
      <div
        className={`rounded-2xl border-2 bg-card transition-colors ${
          open ? "border-primary/30" : "border-border hover:border-primary/20"
        }`}
      >
        <h3>
          <button
            type="button"
            id={buttonId}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
            className="group flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:px-6"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-primary md:text-lg">{item.role}</span>
              <span className="block text-sm font-medium text-foreground md:text-base">{item.org}</span>
              <span className="mt-1 block text-xs font-medium text-primary/80 sm:hidden">{item.period}</span>
              {/* El badge relleno solo lo distingue la vista */}
              {item.current && <span className="sr-only"> · {currentLabel}</span>}
            </span>
            <span className="hidden shrink-0 text-right sm:block">
              {item.current ? (
                <Badge className="bg-primary text-primary-foreground">{item.period}</Badge>
              ) : (
                <Badge variant="outline" className="border-primary/60 text-primary">
                  {item.period}
                </Badge>
              )}
            </span>
            <ChevronDown
              aria-hidden
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:text-primary motion-reduce:transition-none ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </h3>
        {/* grid-rows 0fr→1fr anima la altura real sin medirla */}
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          inert={!open}
          className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5 md:px-6">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {item.bullets.map((bullet, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    {bullet}
                  </li>
                ))}
              </ul>
              {item.tech.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tech.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}
