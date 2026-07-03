import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://christianfonseca.dev",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          en: "https://christianfonseca.dev",
          es: "https://christianfonseca.dev/es",
        },
      },
    },
    {
      url: "https://christianfonseca.dev/es",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: {
        languages: {
          en: "https://christianfonseca.dev",
          es: "https://christianfonseca.dev/es",
        },
      },
    },
    {
      url: "https://christianfonseca.dev/chat",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]
}
