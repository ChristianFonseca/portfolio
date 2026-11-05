"use client"

import { useState } from "react"
import { Github, ExternalLink, Lock, Globe, ArrowUpRight, ImageIcon, Download } from "lucide-react"
import { BubbleCard } from "@/components/bubble-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ProjectCarousel } from "@/components/project-carousel"
import { ProjectImage } from "@/components/project-image"
import { tileOf, type Tile } from "@/lib/content/project-tiles"
import type { ProjectsData, SectionEntry } from "@/lib/content/schemas"
import type { Dictionary } from "@/lib/i18n/dictionaries"

type Project = ProjectsData["items"][number]

// Fotos del proyecto: usa el carrusel (images) y cae al legacy `image` si existe
function galleryOf(project: Project): string[] {
  if (project.images && project.images.length > 0) return project.images
  return project.image ? [project.image] : []
}

const CARD_GRADIENTS = [
  "from-blue-500/20 to-purple-500/20",
  "from-yellow-500/20 to-orange-500/20",
  "from-green-500/20 to-teal-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-orange-500/20 to-red-500/20",
  "from-red-500/20 to-pink-500/20",
]

// Chips derivados de los datos: Live si hay sitio, Open source si hay repo, Download
// si hay descarga, Private si no hay ninguno. Los tres primeros son enlaces; Private
// es solo estado. Son independientes (un proyecto puede ser Live + Open source).
function StatusChips({
  project,
  dict,
  asLinks = true,
}: {
  project: Project
  dict: Dictionary
  asLinks?: boolean
}) {
  const chip =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
  const liveCls = "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  const repoCls = "border-primary/40 bg-primary/10 text-primary"
  const privateCls = "border-border bg-muted/40 text-muted-foreground"
  const downloadCls = "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"

  if (!project.liveUrl && !project.repoUrl && !project.downloadUrl) {
    return (
      <span className={`${chip} ${privateCls}`}>
        <Lock className="h-3 w-3" />
        {dict.projects.private}
      </span>
    )
  }

  return (
    <>
      {project.liveUrl &&
        (asLinks ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${chip} ${liveCls} transition-transform hover:-translate-y-0.5`}
          >
            <Globe className="h-3 w-3" />
            {dict.projects.live}
          </a>
        ) : (
          <span className={`${chip} ${liveCls}`}>
            <Globe className="h-3 w-3" />
            {dict.projects.live}
          </span>
        ))}
      {project.repoUrl &&
        (asLinks ? (
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${chip} ${repoCls} transition-transform hover:-translate-y-0.5`}
          >
            <Github className="h-3 w-3" />
            {dict.projects.openSource}
          </a>
        ) : (
          <span className={`${chip} ${repoCls}`}>
            <Github className="h-3 w-3" />
            {dict.projects.openSource}
          </span>
        ))}
      {project.downloadUrl &&
        (asLinks ? (
          <a
            href={project.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${chip} ${downloadCls} transition-transform hover:-translate-y-0.5`}
          >
            <Download className="h-3 w-3" />
            {dict.projects.download}
          </a>
        ) : (
          <span className={`${chip} ${downloadCls}`}>
            <Download className="h-3 w-3" />
            {dict.projects.download}
          </span>
        ))}
    </>
  )
}

function ProjectTile({
  project,
  index,
  tile,
  dict,
  onOpen,
}: {
  project: Project
  index: number
  tile: Tile
  dict: Dictionary
  onOpen: () => void
}) {
  const gallery = galleryOf(project)
  // Las anchas/completas se ponen en horizontal en desktop: imagen a la izquierda
  const horizontal = tile.lg !== "normal"
  const span = [
    tile.mdFull ? "md:col-span-2" : "",
    tile.featured ? "lg:col-span-2 lg:row-span-2" : tile.lg === "full" ? "lg:col-span-3" : tile.lg === "wide" ? "lg:col-span-2" : tile.mdFull ? "lg:col-span-1" : "",
  ].join(" ")
  const techMax = tile.featured ? 6 : 3

  return (
    <BubbleCard
      noAnimation
      className={`glow-effect relative flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 ${span}`}
    >
      {/* Chips de estado: siblings del botón (no anidados) para poder ser enlaces */}
      <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
        <StatusChips project={project} dict={dict} />
      </div>

      <button
        type="button"
        onClick={onOpen}
        data-track={`project:${project.title}`}
        aria-label={`${dict.projects.details}: ${project.title}`}
        className={`group flex flex-1 flex-col text-left ${horizontal ? "lg:flex-row lg:items-stretch lg:gap-6" : ""}`}
      >
        <div
          className={`relative w-full overflow-hidden rounded-xl bg-gradient-to-br ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} ${
            tile.featured
              ? "mb-5 aspect-[16/9] lg:aspect-auto lg:min-h-[260px] lg:flex-1"
              : horizontal
                ? `mb-4 aspect-[16/9] lg:mb-0 lg:shrink-0 ${tile.lg === "full" ? "lg:w-2/5" : "lg:w-1/2"}`
                : "mb-4 aspect-[16/9]"
          }`}
        >
          {gallery.length > 0 ? (
            <>
              {/* lazy: las tarjetas quedan bajo el pliegue y una portada animada pesa */}
              <ProjectImage
                src={gallery[0]}
                alt={project.title}
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
              {project.title.charAt(0)}
            </span>
          )}
        </div>

        {/* La destacada no estira el texto: el hueco sobrante es para la imagen. En las
            horizontales el texto va centrado en vertical, por debajo de los chips */}
        <div
          className={`flex flex-col ${
            tile.featured ? "" : horizontal ? "flex-1 lg:justify-center lg:py-6" : "flex-1"
          }`}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3
              className={`font-semibold text-primary underline-offset-4 group-hover:underline ${
                tile.featured ? "text-2xl" : "text-lg"
              }`}
            >
              {project.title}
            </h3>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p
            className={`mb-4 text-muted-foreground ${
              tile.featured ? "text-base line-clamp-3" : horizontal ? "text-sm line-clamp-2 lg:line-clamp-4" : "text-sm line-clamp-2"
            }`}
          >
            {project.description}
          </p>
          <div className={`flex flex-wrap gap-1 ${horizontal ? "mt-auto lg:mt-0" : "mt-auto"}`}>
            {project.tech.slice(0, techMax).map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">
                {tech}
              </Badge>
            ))}
            {project.tech.length > techMax && (
              <Badge variant="secondary" className="text-xs">
                +{project.tech.length - techMax}
              </Badge>
            )}
          </div>
        </div>
      </button>
    </BubbleCard>
  )
}

export function ProjectsSection({ section, dict }: { section: SectionEntry<ProjectsData>; dict: Dictionary }) {
  const [selected, setSelected] = useState<Project | null>(null)

  return (
    <section id="public-projects" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {section.title}
        </h2>

        {/* Mosaico: el primero (el orden lo decide el admin) va destacado en 2×2 y las
            filas sobrantes se rellenan con tarjetas anchas para no dejar huecos */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {section.data.items.map((project, i) => (
            <ProjectTile
              key={`${project.title}-${i}`}
              project={project}
              index={i}
              tile={tileOf(i, section.data.items.length)}
              dict={dict}
              onOpen={() => setSelected(project)}
            />
          ))}
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        {/* Ancho: hasta 64rem en desktop, 92vw en pantallas menores (siempre con margen) */}
        <DialogContent className="w-[min(92vw,64rem)] max-w-none sm:max-w-none max-h-[90vh] overflow-y-auto">
          {selected &&
            (() => {
              const gallery = galleryOf(selected)
              const hasImages = gallery.length > 0
              return (
                <>
                  <DialogHeader>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <StatusChips project={selected} dict={dict} asLinks={false} />
                    </div>
                    <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {selected.title}
                    </DialogTitle>
                  </DialogHeader>

                  {/* Imagen a todo el ancho arriba; la info debajo usa todo el espacio */}
                  {hasImages && <ProjectCarousel images={gallery} title={selected.title} />}

                  <div className="space-y-5">
                    <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                      {selected.description}
                    </DialogDescription>

                    {selected.bullets.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {dict.projects.highlights}
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

                    {(selected.repoUrl || selected.liveUrl || selected.downloadUrl) && (
                      <div className="flex flex-wrap gap-3 pt-1">
                        {selected.liveUrl && (
                          <Button asChild>
                            <a href={selected.liveUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {dict.projects.visitSite}
                            </a>
                          </Button>
                        )}
                        {selected.downloadUrl && (
                          <Button variant={selected.liveUrl ? "outline" : "default"} asChild>
                            <a href={selected.downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              {dict.projects.download}
                            </a>
                          </Button>
                        )}
                        {selected.repoUrl && (
                          <Button variant="outline" asChild>
                            <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer">
                              <Github className="mr-2 h-4 w-4" />
                              {dict.projects.sourceCode}
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>
    </section>
  )
}
