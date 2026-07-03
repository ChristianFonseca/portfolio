import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPublishedPost, renderMarkdown } from "@/lib/blog"
import { BlogHeader } from "@/components/blog/blog-header"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPost(slug, "en")
  if (!post) return { title: "Post not found" }
  return {
    title: `${post.title} — Christian Fonseca`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
      languages: { en: `/blog/${post.slug}`, es: `/es/blog/${post.slug}` },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      images: post.cover_image ? [{ url: post.cover_image }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublishedPost(slug, "en")
  if (!post) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    inLanguage: "en",
    author: {
      "@type": "Person",
      name: "Christian Fonseca",
      url: "https://christianfonseca.dev",
    },
    url: `https://christianfonseca.dev/blog/${post.slug}`,
    ...(post.cover_image && { image: `https://christianfonseca.dev${post.cover_image}` }),
  }

  return (
    <main className="min-h-screen">
      <BlogHeader locale="en" altHref={`/es/blog/${post.slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-muted-foreground">
          {post.published_at &&
            new Date(post.published_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
        </p>
        <h1 className="mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold leading-tight text-transparent md:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
        {post.cover_image && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover_image} alt={post.title} className="w-full object-cover" />
          </div>
        )}
        <div className="blog-prose mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
      </article>
    </main>
  )
}
