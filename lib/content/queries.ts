import { unstable_cache } from "next/cache"
import { sql } from "@/lib/db"
import staticData from "./static-data.json"
import type {
  AboutData,
  ExperienceData,
  HeroData,
  LandingContent,
  ProjectsData,
  ResearchData,
  SectionRecord,
  SkillsData,
} from "./schemas"

export const STATIC_SECTIONS = staticData.sections as SectionRecord[]

function buildContent(rows: SectionRecord[]): LandingContent {
  // Base estática + overlay de lo que exista en DB, por slug
  const bySlug = new Map<string, SectionRecord>()
  for (const s of STATIC_SECTIONS) bySlug.set(s.slug, s)
  for (const r of rows) bySlug.set(r.slug, r)

  const entry = <T>(slug: string) => {
    const s = bySlug.get(slug)
    if (!s) throw new Error(`Sección faltante: ${slug}`)
    return { title: s.title, visible: s.visible, data: s.data as T }
  }

  return {
    hero: entry<HeroData>("hero"),
    about: entry<AboutData>("about"),
    skills: entry<SkillsData>("skills"),
    publicProjects: entry<ProjectsData>("public-projects"),
    researchProjects: entry<ResearchData>("research-projects"),
    experience: entry<ExperienceData>("experience"),
    teaching: entry<ExperienceData>("teaching"),
  }
}

export const getContent = unstable_cache(
  async (): Promise<LandingContent> => {
    try {
      const rows = await sql<SectionRecord[]>`
        select slug, kind, title, position, visible, data from sections order by position
      `
      return buildContent(rows)
    } catch (error) {
      // Sin DB (build, dev sin túnel, o pg-dev caído) la landing sigue viva con el contenido estático
      console.error("getContent: DB no disponible, usando contenido estático:", error)
      return buildContent([])
    }
  },
  ["landing-content"],
  { tags: ["content"] },
)
