import { unstable_cache } from "next/cache"
import { getContent } from "@/lib/content/queries"
import { getSetting } from "@/lib/settings"
import type { ExperienceData } from "@/lib/content/schemas"

// Base de conocimiento del chat: se construye EN VIVO desde la DB (las mismas
// secciones que edita el admin) + un bloque extra editable en Configuración.
// Comparte el tag "content", así que guardar en el admin también actualiza el chat.

function formatExperience(title: string, data: ExperienceData): string {
  const items = data.items
    .map(
      (i) =>
        `- ${i.role} at ${i.org} (${i.period}${i.current ? ", current" : ""}). ` +
        `${i.bullets.join(" ")} Tech: ${i.tech.join(", ")}.`,
    )
    .join("\n")
  return `## ${title}\n${items}`
}

export const getKnowledgeBase = unstable_cache(
  async (): Promise<string> => {
    const content = await getContent("en")
    const extra = await getSetting<string>("chat_extra_context", "")

    const parts: string[] = []
    parts.push(`# Christian Fonseca — ${content.hero.data.tagline}`)
    parts.push(`Location: ${content.hero.data.location}.`)
    parts.push(
      `Certifications summary: ${content.hero.data.certs.map((c) => `${c.count ? c.count + " " : ""}${c.label}`).join(", ")}.`,
    )
    parts.push(`## About\n${content.about.data.text}`)
    parts.push(
      `## Skills\n${content.skills.data.groups.map((g) => `- ${g.name}: ${g.badges.join(", ")}`).join("\n")}`,
    )
    parts.push(
      `## Languages\n${content.skills.data.languages.map((l) => `${l.name}: ${l.level}`).join("; ")}`,
    )
    parts.push(formatExperience(content.experience.title, content.experience.data))
    parts.push(formatExperience(content.teaching.title, content.teaching.data))
    parts.push(
      `## Public Projects\n${content.publicProjects.data.items.map((p) => `- ${p.title}: ${p.description} (${p.tech.join(", ")})`).join("\n")}`,
    )
    parts.push(
      `## Research Projects\n${content.researchProjects.data.items.map((p) => `- ${p.title}: ${p.description} ${p.bullets.join(" ")}`).join("\n")}`,
    )
    if (extra.trim()) parts.push(`## Additional information\n${extra.trim()}`)

    return parts.join("\n\n")
  },
  ["chat-knowledge-base"],
  { tags: ["content"] },
)
