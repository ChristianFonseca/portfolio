import type { Metadata } from "next"
import { getPublishedPosts } from "@/lib/blog"
import { PostList } from "@/components/blog/post-list"
import { BlogHeader } from "@/components/blog/blog-header"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Blog — Christian Fonseca",
  description:
    "Articles on AI engineering, MLOps, GenAI agents, data architecture and cloud, written from a decade of hands-on experience.",
  alternates: {
    canonical: "/blog",
    languages: { en: "/blog", es: "/es/blog" },
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    title: "Blog — Christian Fonseca",
    description: "Articles on AI engineering, MLOps, GenAI agents, data architecture and cloud.",
    url: "/blog",
    type: "website",
  },
}

export default async function BlogPage() {
  const posts = await getPublishedPosts("en")
  return (
    <main className="min-h-screen">
      <BlogHeader locale="en" altHref="/es/blog" />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold text-transparent">
          Blog
        </h1>
        <p className="mb-10 mt-2 text-muted-foreground">
          AI engineering, MLOps and data architecture — notes from the field.
        </p>
        <PostList posts={posts} locale="en" />
      </div>
    </main>
  )
}
