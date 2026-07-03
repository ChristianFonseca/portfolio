import { getKnowledgeBase } from "@/lib/chat/knowledge"
import { getPublishedPosts } from "@/lib/blog"

// llms.txt: resumen en markdown para crawlers de IA (ChatGPT, Perplexity,
// Gemini, Claude). Reutiliza la misma knowledge base del chat: siempre al día
// con lo que se edita en el admin.
export async function GET() {
  const [kb, posts] = await Promise.all([getKnowledgeBase(), getPublishedPosts("en")])

  const blogSection = posts.length
    ? `\n\n## Blog\n${posts.map((p) => `- [${p.title}](https://christianfonseca.dev/blog/${p.slug}): ${p.excerpt}`).join("\n")}`
    : ""

  const body = `${kb}

## Website
- English: https://christianfonseca.dev
- Spanish: https://christianfonseca.dev/es
- Blog: https://christianfonseca.dev/blog
- CV (PDF): https://christianfonseca.dev/cv.pdf${blogSection}
`

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
