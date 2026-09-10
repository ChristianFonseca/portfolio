"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FileText, Plus, Trash2, Globe, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createPost, deletePost, togglePublishPost } from "@/app/admin/actions"

export interface PostSummary {
  id: number
  slug: string
  title: string
  title_es: string
  published: boolean
  updated_at: string
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

export function PostsManager({ posts }: { posts: PostSummary[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  // Al cerrar el modal se limpia el formulario para la próxima vez.
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setTitle("")
      setSlug("")
      setSlugTouched(false)
    }
  }

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createPost({ title, slug })
      if (result.ok) {
        router.push(`/blog/${result.id}`)
      } else {
        setToast({ ok: false, text: result.error })
      }
    })
  }

  const handleTogglePublish = (post: PostSummary) => {
    startTransition(async () => {
      const result = await togglePublishPost(post.id)
      setToast(
        result.ok
          ? { ok: true, text: post.published ? `"${post.title}" pasó a borrador` : `"${post.title}" publicado 🎉` }
          : { ok: false, text: result.error },
      )
      router.refresh()
    })
  }

  const handleDelete = (post: PostSummary) => {
    if (!confirm(`¿Eliminar "${post.title}" definitivamente? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      const result = await deletePost(post.id)
      setToast(result.ok ? { ok: true, text: "Artículo eliminado" } : { ok: false, text: result.error })
      router.refresh()
    })
  }

  const published = posts.filter((p) => p.published).length

  return (
    <div className="space-y-4">
      {/* Barra superior: conteo + acción principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {posts.length} {posts.length === 1 ? "artículo" : "artículos"} · {published}{" "}
          {published === 1 ? "publicado" : "publicados"} · {posts.length - published} en borrador
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo artículo
        </Button>
      </div>

      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">
            <FileText className="mx-auto mb-3 h-6 w-6 opacity-40" />
            Aún no hay artículos. Crea el primero con el botón de arriba.
          </div>
        )}
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/40 px-5 py-4 sm:flex-nowrap sm:gap-4"
          >
            <FileText className="h-4 w-4 shrink-0 text-primary/60" />
            <div className="min-w-0 flex-1 basis-full sm:basis-auto">
              <p className="truncate text-sm font-semibold">{post.title || "(sin título)"}</p>
              <p className="truncate text-xs text-muted-foreground">
                /blog/{post.slug} · act. {post.updated_at}
              </p>
            </div>
            {post.published ? (
              <Badge variant="outline" className="gap-1 border-emerald-500/50 text-[10px] text-emerald-500">
                <Globe className="h-3 w-3" /> publicado
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-yellow-500/50 text-[10px] text-yellow-500">
                <EyeOff className="h-3 w-3" /> borrador
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={pending}
              onClick={() => handleTogglePublish(post)}
            >
              {post.published ? "Despublicar" : "Publicar"}
            </Button>
            <Button size="sm" className="text-xs" asChild>
              <Link href={`/blog/${post.id}`}>Editar</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Eliminar artículo"
              className="border-red-500/40 text-xs text-red-400 hover:bg-red-500/10"
              disabled={pending}
              onClick={() => handleDelete(post)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Modal: nuevo artículo */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Nuevo artículo
            </DialogTitle>
            <DialogDescription>
              Se crea como borrador y te lleva al editor. El slug se genera desde el título; puedes ajustarlo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="post-title" className="mb-1 block text-xs text-muted-foreground">
                Título (EN)
              </label>
              <input
                id="post-title"
                type="text"
                autoFocus
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (!slugTouched) setSlug(slugify(e.target.value))
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && title.trim() && slug.length >= 3 && !pending) handleCreate()
                }}
                className={inputClass}
                placeholder="How to build RAG systems with Gemini"
              />
            </div>
            <div>
              <label htmlFor="post-slug" className="mb-1 block text-xs text-muted-foreground">
                Slug (URL: /blog/…)
              </label>
              <input
                id="post-slug"
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setSlugTouched(true)
                }}
                className={`${inputClass} font-mono text-xs`}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button disabled={pending || !title.trim() || slug.length < 3} onClick={handleCreate}>
              {pending ? "Creando…" : "Crear borrador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm shadow-2xl backdrop-blur-md ${
            toast.ok
              ? "border-emerald-500/50 bg-emerald-100/95 text-emerald-900 dark:bg-emerald-950/85 dark:text-emerald-200"
              : "border-red-500/50 bg-red-100/95 text-red-900 dark:bg-red-950/85 dark:text-red-200"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  )
}
