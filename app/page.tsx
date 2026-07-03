import { Landing } from "@/components/landing"
import { getContent } from "@/lib/content/queries"

// El contenido vive en Postgres y se lee en runtime (cache con tag "content",
// invalidado por el admin con revalidateTag). El build nunca toca la DB.
export const dynamic = "force-dynamic"

export default async function Home() {
  const content = await getContent()
  return <Landing content={content} />
}
