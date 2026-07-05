"use client"

import { useState } from "react"
import { Github, ExternalLink, Lock, Globe, ArrowUpRight, ImageIcon } from "lucide-react"
import { BubbleCard } from "@/components/bubble-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ProjectCarousel } from "@/components/project-carousel"
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

// Chips derivados de los datos: Live si hay sitio, Open source si hay repo,
// Private si no hay ninguno. Los dos primeros son enlaces; Private es solo estado.
// Ambos ejes son independientes (un proyecto puede ser Live + Open source).
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

  if (!project.liveUrl && !project.repoUrl) {
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
    </>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.data.items.map((project, i) => (
            <BubbleCard key={`${project.title}-${i}`} className="glow-effect relative flex flex-col">
              {/* Chips de estado: siblings del botón (no anidados) para poder ser enlaces */}
              <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
                <StatusChips project={project} dict={dict} />
              </div>

              <button
                type="button"
                onClick={() => setSelected(project)}
                aria-label={`${dict.projects.details}: ${project.title}`}
                className="group flex flex-1 flex-col text-left"
              >
                <div
                  className={`relative w-full aspect-[16/9] mb-4 rounded-lg overflow-hidden bg-gradient-to-br ${
                    CARD_GRADIENTS[i % CARD_GRADIENTS.length]
                  }`}
                >
                  {galleryOf(project).length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={galleryOf(project)[0]}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {galleryOf(project).length > 1 && (
                        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                          <ImageIcon className="h-3 w-3" />
                          {galleryOf(project).length}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-serif text-5xl italic text-foreground/15">
                      {project.title.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-primary group-hover:underline underline-offset-4">
                    {project.title}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{project.description}</p>
                <div className="mt-auto flex flex-wrap gap-1">
                  {project.tech.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.tech.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.tech.length - 4}
                    </Badge>
                  )}
                </div>
              </button>
            </BubbleCard>
          ))}
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <StatusChips project={selected} dict={dict} asLinks={false} />
                </div>
                <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                  {selected.description}
                </DialogDescription>
              </DialogHeader>

              {galleryOf(selected).length > 0 && (
                <div className="mt-2">
                  <ProjectCarousel images={galleryOf(selected)} title={selected.title} />
                </div>
              )}

              {selected.bullets.length > 0 && (
                <div className="mt-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {dict.projects.highlights}
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {selected.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-2">
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

              {(selected.repoUrl || selected.liveUrl) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {selected.liveUrl && (
                    <Button asChild>
                      <a href={selected.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {dict.projects.visitSite}
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
