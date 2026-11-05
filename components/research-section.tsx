"use client"

import { useState } from "react"
import { ArrowUpRight, FileText, ImageIcon } from "lucide-react"
import { BubbleCard } from "@/components/bubble-card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ProjectCarousel } from "@/components/project-carousel"
import type { ResearchData, SectionEntry } from "@/lib/content/schemas"
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries"

type Item = ResearchData["items"][number]

const galleryOf = (it: Item): string[] => (it.images && it.images.length > 0 ? it.images : [])

// "YYYY-MM" -> "mar 2023" localizado; si no es ese formato, se muestra tal cual (legacy)
function fmtMonth(value: string, locale: Locale): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value || "")
  if (!m) return value || ""
  const d = new Date(Number(m[1]), Number(m[2]) - 1, 1)
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", { month: "short", year: "numeric" }).format(d)
}

// Rango de fechas: "inicio – fin", "inicio – Presente", o solo fin. Vacío si no hay.
function dateRange(it: Item, present: string, locale: Locale): string {
  const s = fmtMonth(it.startDate, locale)
  const e = fmtMonth(it.endDate, locale)
  if (s && e) return `${s} – ${e}`
  if (s) return `${s} – ${present}`
  return e || ""
}

const CARD_GRADIENTS = [
  "from-blue-500/20 to-purple-500/20",
  "from-green-500/20 to-teal-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-orange-500/20 to-red-500/20",
]

export function ResearchSection({
  section,
  dict,
  locale,
}: {
  section: SectionEntry<ResearchData>
  dict: Dictionary
  locale: Locale
}) {
  const [selected, setSelected] = useState<Item | null>(null)

  return (
    <section id="research-projects" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {section.title}
        </h2>

        {/* Lista horizontal, a propósito distinta del mosaico de proyectos: aquí pesan
            dónde y cuándo se hizo y lo publicado, no la captura */}
        <ol className="space-y-5">
          {section.data.items.map((item, i) => {
            const gallery = galleryOf(item)
            const when = dateRange(item, dict.projects.present, locale)
            const papers = item.papers?.length ?? 0
            return (
              <li key={`${item.title}-${i}`}>
                <BubbleCard
                  noAnimation
                  className="glow-effect p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 md:p-5"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    data-track={`research:${item.title}`}
                    aria-label={`${dict.projects.details}: ${item.title}`}
                    className="group flex w-full flex-col gap-5 text-left sm:flex-row"
                  >
                    <div
                      className={`relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br sm:w-56 md:w-64 ${
                        CARD_GRADIENTS[i % CARD_GRADIENTS.length]
                      }`}
                    >
                      {gallery.length > 0 ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={gallery[0]}
                            alt={item.title}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                          />
                          {gallery.length > 1 && (
                            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                              <ImageIcon className="h-3 w-3" />
                              {gallery.length}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center font-serif text-5xl italic text-foreground/15">
                          {item.title.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col py-1">
                      {(item.institution || when) && (
                        <p className="mb-1.5 flex flex-wrap items-center gap-x-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {item.institution && <span className="text-accent">{item.institution}</span>}
                          {item.institution && when && <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/50" />}
                          {when && <span>{when}</span>}
                        </p>
                      )}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-primary underline-offset-4 group-hover:underline">
                          {item.title}
                        </h3>
                        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="mt-auto flex flex-wrap items-center gap-1">
                        {papers > 0 && (
                          <span className="mr-1 inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                            <FileText className="h-3 w-3" />
                            {papers} {papers === 1 ? dict.projects.paperOne : dict.projects.paperCount}
                          </span>
                        )}
                        {item.tech.slice(0, 4).map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {item.tech.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{item.tech.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                </BubbleCard>
              </li>
            )
          })}
        </ol>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="w-[min(92vw,64rem)] max-w-none sm:max-w-none max-h-[90vh] overflow-y-auto">
          {selected &&
            (() => {
              const gallery = galleryOf(selected)
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {selected.title}
                    </DialogTitle>
                    {(selected.institution || selected.department || dateRange(selected, dict.projects.present, locale)) && (
                      <div className="mt-1 space-y-0.5 text-left">
                        {selected.institution &&
                          (selected.institutionUrl ? (
                            <a
                              href={selected.institutionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {selected.institution}
                            </a>
                          ) : (
                            <div className="text-sm font-medium text-foreground/90">{selected.institution}</div>
                          ))}
                        {selected.department &&
                          (selected.departmentUrl ? (
                            <a
                              href={selected.departmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-muted-foreground hover:text-primary hover:underline"
                            >
                              {selected.department}
                            </a>
                          ) : (
                            <div className="text-xs text-muted-foreground">{selected.department}</div>
                          ))}
                        {dateRange(selected, dict.projects.present, locale) && (
                          <div className="text-xs text-muted-foreground/80">{dateRange(selected, dict.projects.present, locale)}</div>
                        )}
                      </div>
                    )}
                  </DialogHeader>

                  {gallery.length > 0 && <ProjectCarousel images={gallery} title={selected.title} />}

                  <div className="space-y-5">
                    <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                      {selected.description}
                    </DialogDescription>

                    {selected.bullets.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {dict.projects.achievements}
                        </p>
                        <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
                          {selected.bullets.map((b, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selected.papers && selected.papers.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {dict.projects.papers}
                        </p>
                        <ul className="space-y-2 text-sm">
                          {selected.papers.map((p, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                              <div>
                                {p.url ? (
                                  <a
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {p.name}
                                  </a>
                                ) : (
                                  <span className="text-foreground/90">{p.name}</span>
                                )}
                                {p.authors && <div className="text-xs text-muted-foreground/70">{p.authors}</div>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {dict.projects.stack}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.tech.map((tech) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>
    </section>
  )
}
