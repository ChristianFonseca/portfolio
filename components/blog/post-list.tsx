import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { PublicPost } from "@/lib/blog"
import type { Locale } from "@/lib/i18n/dictionaries"

function formatDate(iso: string | null, locale: Locale): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString(locale === "es" ? "es-PE" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function PostList({ posts, locale }: { posts: PublicPost[]; locale: Locale }) {
  const base = locale === "es" ? "/es/blog" : "/blog"
  if (!posts.length) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        {locale === "es" ? "Pronto habrá artículos aquí." : "Articles coming soon."}
      </p>
    )
  }
  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`${base}/${post.slug}`}
          className="group block rounded-2xl border border-border bg-card/40 p-6 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)]"
        >
          <div className="flex flex-col gap-4 sm:flex-row">
            {post.cover_image && (
              <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl sm:w-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.cover_image} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{formatDate(post.published_at, locale)}</p>
              <h2 className="mt-1 text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
