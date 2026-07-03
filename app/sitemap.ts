import type { MetadataRoute } from "next"
import { getPublishedPosts } from "@/lib/blog"

// Dinámico: el build de Docker no ve la DB; los posts deben resolverse en runtime
export const dynamic = "force-dynamic"

const SITE = "https://christianfonseca.dev"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: { en: SITE, es: `${SITE}/es` } },
    },
    {
      url: `${SITE}/es`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { en: SITE, es: `${SITE}/es` } },
    },
    {
      url: `${SITE}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: { en: `${SITE}/blog`, es: `${SITE}/es/blog` } },
    },
    {
      url: `${SITE}/es/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: { en: `${SITE}/blog`, es: `${SITE}/es/blog` } },
    },
    { url: `${SITE}/chat`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  const posts = await getPublishedPosts("en")
  for (const post of posts) {
    const langs = { en: `${SITE}/blog/${post.slug}`, es: `${SITE}/es/blog/${post.slug}` }
    const lastModified = new Date(post.updated_at)
    entries.push(
      { url: langs.en, lastModified, changeFrequency: "monthly", priority: 0.7, alternates: { languages: langs } },
      { url: langs.es, lastModified, changeFrequency: "monthly", priority: 0.6, alternates: { languages: langs } },
    )
  }

  return entries
}
