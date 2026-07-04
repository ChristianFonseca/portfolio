"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, Globe, EyeOff, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { savePost, togglePublishPost, type PostFields } from "@/app/admin/actions"
import { TagsInput } from "@/components/admin/tags-input"
import { ImageField } from "@/components/admin/image-field"
import type { Locale } from "@/lib/i18n/dictionaries"

export interface PostEditorData {
  slug: string
  title: string
  title_es: string
  excerpt: string
  excerpt_es: string
  body: string
  body_es: string
  cover_image: string
  tags: string[]
  published: boolean
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

const LOCALE_LABELS: Record<Locale, string> = { en: "English", es: "Español" }

export function PostEditor({ id, initial }: { id: number; initial: PostEditorData }) {
  const router = useRouter()
  const [fields, setFields] = useState<PostEditorData>(initial)
  const [active, setActive] = useState<Locale>("en")
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [translating, setTranslating] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const other: Locale = active === "en" ? "es" : "en"
  const suffix = (loc: Locale) => (loc === "es" ? "_es" : "")
  const get = (key: "title" | "excerpt" | "body", loc: Locale) =>
    fields[`${key}${suffix(loc)}` as keyof PostEditorData] as string
  const set = (key: string, value: string | string[]) => {
    setFields((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const handleTranslate = async () => {
    setTranslating(true)
    setToast(null)
    try {
      const res = await fetch("/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "post",
          from: active,
          to: other,
          data: { title: get("title", active), excerpt: get("excerpt", active), body: get("body", active) },
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (res.ok && payload.data) {
        setFields((prev) => ({
          ...prev,
          [`title${suffix(other)}`]: payload.data.title,
          [`excerpt${suffix(other)}`]: payload.data.excerpt,
          [`body${suffix(other)}`]: payload.data.body,
        }))
        setDirty(true)
        setToast({ ok: true, text: `Traducción a ${LOCALE_LABELS[other]} generada. Revísala y guarda.` })
      } else {
        setToast({ ok: false, text: payload.error ?? "Error al traducir" })
      }
    } catch {
      setToast({ ok: false, text: "No se pudo conectar" })
    } finally {
      setTranslating(false)
    }
  }

  const handleSave = () => {
    startTransition(async () => {
      const payload: PostFields = {
        slug: fields.slug,
        title: fields.title,
        title_es: fields.title_es,
        excerpt: fields.excerpt,
        excerpt_es: fields.excerpt_es,
        body: fields.body,
        body_es: fields.body_es,
        cover_image: fields.cover_image,
        tags: fields.tags,
      }
      const result = await savePost(id, payload)
      if (result.ok) {
        setDirty(false)
        setToast({ ok: true, text: fields.published ? "Guardado — cambios ya visibles en el blog" : "Borrador guardado" })
      } else {
        setToast({ ok: false, text: result.error })
      }
    })
  }

  const handleTogglePublish = () => {
    startTransition(async () => {
      const result = await togglePublishPost(id)
      if (result.ok) {
        setFields((prev) => ({ ...prev, published: !prev.published }))
        setToast({
          ok: true,
          text: fields.published ? "Artículo pasado a borrador" : "¡Publicado! Ya visible en /blog y /es/blog",
        })
        router.refresh()
      } else {
        setToast({ ok: false, text: result.error })
      }
    })
  }

  return (
    <div>
      {/* Barra sticky */}
      <div className="sticky top-0 z-20 -mx-6 mb-6 border-b border-border bg-background/85 px-6 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/blog" className="hover:text-primary transition-colors">
              Blog
            </Link>{" "}
            / <span className="font-semibold text-foreground">{get("title", active) || "(sin título)"}</span>
          </p>
          {fields.published ? (
            <Badge variant="outline" className="gap-1 border-emerald-500/50 text-[10px] text-emerald-500">
              <Globe className="h-3 w-3" /> publicado
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-yellow-500/50 text-[10px] text-yellow-500">
              <EyeOff className="h-3 w-3" /> borrador
            </Badge>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <span className={`text-xs ${dirty ? "text-yellow-500" : "text-muted-foreground"}`}>
              {pending ? "Guardando…" : dirty ? "Cambios sin guardar" : "Sin cambios"}
            </span>
            {fields.published && (
              <Button variant="outline" size="sm" className="text-xs" asChild>
                <a
                  href={`https://christianfonseca.dev${active === "es" ? "/es" : ""}/blog/${fields.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver artículo <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublish}
              disabled={pending || dirty}
              title={dirty ? "Guarda los cambios primero" : ""}
              className="text-xs"
            >
              {fields.published ? "Despublicar" : "Publicar"}
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={pending || !dirty}
              className=""
            >
              Guardar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs de idioma + traducir */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-border bg-card/40 p-1">
          {(["en", "es"] as Locale[]).map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setActive(loc)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                active === loc
                  ? "bg-gradient-to-r from-primary/80 to-accent/80 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {loc.toUpperCase()}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={translating || pending || !get("title", active).trim()}
          className="text-xs"
        >
          {translating ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
          )}
          {translating ? "Traduciendo…" : `Traducir ${active.toUpperCase()} → ${other.toUpperCase()} con IA`}
        </Button>
        <p className="text-xs text-muted-foreground">Markdown soportado. Publicar exige ambos idiomas completos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Contenido por idioma */}
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Título ({active.toUpperCase()})
            </label>
            <input
              type="text"
              value={get("title", active)}
              onChange={(e) => set(`title${suffix(active)}`, e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Resumen ({active.toUpperCase()}) — aparece en la lista y en buscadores
            </label>
            <textarea
              rows={3}
              value={get("excerpt", active)}
              onChange={(e) => set(`excerpt${suffix(active)}`, e.target.value)}
              className={`${inputClass} resize-y`}
            />
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Contenido ({active.toUpperCase()}) — Markdown
            </label>
            <textarea
              rows={24}
              value={get("body", active)}
              onChange={(e) => set(`body${suffix(active)}`, e.target.value)}
              className={`${inputClass} resize-y font-mono text-xs leading-relaxed`}
            />
          </div>
        </div>

        {/* Metadatos compartidos */}
        <div className="h-fit space-y-5 rounded-2xl border border-border bg-card/40 p-5">
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Slug (URL)</label>
            <input
              type="text"
              value={fields.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Imagen de portada</label>
            <ImageField value={fields.cover_image} onChange={(url) => set("cover_image", url)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Tags</label>
            <TagsInput value={fields.tags} onChange={(tags) => set("tags", tags)} />
          </div>
        </div>
      </div>

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
