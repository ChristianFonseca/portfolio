import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { PublicPost } from "@/lib/blog"
import type { Locale } from "@/lib/i18n/dictionaries"

// Navegación anterior/siguiente entre artículos publicados
export function PostPager({
  prev,
  next,
  locale,
}: {
  prev: PublicPost | null
  next: PublicPost | null
  locale: Locale
}) {
  if (!prev && !next) return null
  const base = locale === "es" ? "/es/blog" : "/blog"
  return (
    <nav className="mt-14 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`${base}/${prev.slug}`}
          className="group rounded-2xl border border-border bg-card/40 p-5 transition-all hover:border-primary/60"
        >
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            {locale === "es" ? "Artículo anterior" : "Previous article"}
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {prev.title}
          </p>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`${base}/${next.slug}`}
          className="group rounded-2xl border border-border bg-card/40 p-5 text-right transition-all hover:border-primary/60"
        >
          <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            {locale === "es" ? "Artículo siguiente" : "Next article"}
            <ArrowRight className="h-3.5 w-3.5" />
          </p>
          <p className="mt-1.5 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {next.title}
          </p>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
