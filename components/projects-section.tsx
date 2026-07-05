"use client"

import { useState } from "react"
import { Github, ExternalLink, Lock, Globe, ArrowUpRight } from "lucide-react"
import { BubbleCard } from "@/components/bubble-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { ProjectsData, SectionEntry } from "@/lib/content/schemas"
import type { Dictionary } from "@/lib/i18n/dictionaries"

type Project = ProjectsData["items"][number]

const CARD_GRADIENTS = [
  "from-blue-500/20 to-purple-500/20",
  "from-yellow-500/20 to-orange-500/20",
  "from-green-500/20 to-teal-500/20",
  "from-purple-500/20 to-pink-500/20",
  "from-orange-500/20 to-red-500/20",
  "from-red-500/20 to-pink-500/20",
]

function VisibilityBadge({ project, dict }: { project: Project; dict: Dictionary }) {
  const isPublic = project.visibility !== "private"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        isPublic
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-border bg-muted/40 text-muted-foreground"
      }`}
    >
      {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {isPublic ? dict.projects.public : dict.projects.private}
    </span>
  )
}

export function ProjectsSection({
  section,
  dict,
}: {
  section: SectionEntry<ProjectsData>
  dict: Dictionary
}) {
  const [selected, setSelected] = useState<Project | null>(null)

  return (
    <section id="public-projects" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 floating-element bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {section.title}
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.data.items.map((project, i) => (
            <BubbleCard key={`${project.title}-${i}`} className="glow-effect flex flex-col">
              <button
                type="button"
                onClick={() => setSelected(project)}
                aria-label={`${dict.projects.details}: ${project.title}`}
                className="group flex flex-1 flex-col text-left"
              >
                <div
                  className={`relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-gradient-to-br ${
                    CARD_GRADIENTS[i % CARD_GRADIENTS.length]
                  }`}
                >
                  {project.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center font-serif text-5xl italic text-foreground/15">
                      {project.title.charAt(0)}
                    </span>
                  )}
                  <span className="absolute right-2 top-2">
                    <VisibilityBadge project={project} dict={dict} />
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-primary group-hover:underline underline-offset-4">
                    {project.title}
                  </h3>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{project.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
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
                <div className="mt-auto flex items-center text-xs text-muted-foreground">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: project.languageColor || "#a855f7" }}
                  ></span>
                  {project.language}
                </div>
              </button>

              {/* Enlaces directos en la card cuando existen */}
              {(project.repoUrl || project.liveUrl) && (
                <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-3">
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${dict.projects.sourceCode}: ${project.title}`}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Github className="h-4 w-4" />
                      {dict.projects.sourceCode}
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {dict.projects.visitSite}
                    </a>
                  )}
                </div>
              )}
            </BubbleCard>
          ))}
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="mb-1 flex items-center gap-3">
                  <VisibilityBadge project={selected} dict={dict} />
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: selected.languageColor || "#a855f7" }}
                    />
                    {selected.language}
                  </span>
                </div>
                <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                  {selected.description}
                </DialogDescription>
              </DialogHeader>

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
