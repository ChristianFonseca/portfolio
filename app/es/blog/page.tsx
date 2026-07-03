import type { Metadata } from "next"
import { getPublishedPosts } from "@/lib/blog"
import { PostList } from "@/components/blog/post-list"
import { BlogHeader } from "@/components/blog/blog-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog — Christian Fonseca",
  description:
    "Artículos sobre ingeniería de IA, MLOps, agentes GenAI, arquitectura de datos y cloud, desde una década de experiencia práctica.",
  alternates: {
    canonical: "/es/blog",
    languages: { en: "/blog", es: "/es/blog" },
  },
  openGraph: {
    title: "Blog — Christian Fonseca",
    description: "Artículos sobre ingeniería de IA, MLOps, agentes GenAI, arquitectura de datos y cloud.",
    url: "/es/blog",
    type: "website",
    locale: "es_PE",
  },
}

export default async function BlogPageEs() {
  const posts = await getPublishedPosts("es")
  return (
    <main className="min-h-screen">
      <BlogHeader locale="es" altHref="/blog" />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold text-transparent">
          Blog
        </h1>
        <p className="mb-10 mt-2 text-muted-foreground">
          Ingeniería de IA, MLOps y arquitectura de datos — notas desde el terreno.
        </p>
        <PostList posts={posts} locale="es" />
      </div>
    </main>
  )
}
