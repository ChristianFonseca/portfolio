import { Landing } from "@/components/landing"
import { getContent } from "@/lib/content/queries"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { faqJsonLd, personJsonLd } from "@/lib/seo"

// El contenido vive en Postgres y se lee en runtime (cache con tag "content",
// invalidado por el admin con revalidateTag). El build nunca toca la DB.
export const dynamic = "force-dynamic"

export default async function Home() {
  const content = await getContent("en")
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(content, "en")) }}
      />
      {content.faq.visible && content.faq.data.items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(content.faq.data)) }}
        />
      )}
      <Landing content={content} locale="en" dict={getDictionary("en")} />
    </>
  )
}
