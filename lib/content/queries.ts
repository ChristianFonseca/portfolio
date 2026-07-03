import { unstable_cache } from "next/cache"
import { sql } from "@/lib/db"
import staticData from "./static-data.json"
import type { Locale } from "@/lib/i18n/dictionaries"
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

// data puede ser { en, es } (formato actual) o plano (legacy) — resolvemos por locale
function resolveData(raw: unknown, locale: Locale): unknown {
  if (raw && typeof raw === "object" && "en" in (raw as Record<string, unknown>)) {
    const localized = raw as Record<string, unknown>
    return localized[locale] ?? localized.en
  }
  return raw
}

function buildContent(rows: SectionRecord[], locale: Locale): LandingContent {
  const bySlug = new Map<string, SectionRecord>()
  for (const s of STATIC_SECTIONS) bySlug.set(s.slug, s)
  for (const r of rows) bySlug.set(r.slug, r)

  const entry = <T>(slug: string) => {
    const s = bySlug.get(slug)
    if (!s) throw new Error(`Sección faltante: ${slug}`)
    const title = locale === "es" ? s.title_es || s.title : s.title
    return { title, visible: s.visible, data: resolveData(s.data, locale) as T }
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
  async (locale: Locale): Promise<LandingContent> => {
    try {
      const rows = await sql<SectionRecord[]>`
        select slug, kind, title, title_es, position, visible, data from sections order by position
      `
      return buildContent(rows, locale)
    } catch (error) {
      // Sin DB la landing sigue viva con el contenido estático
      console.error("getContent: DB no disponible, usando contenido estático:", error)
      return buildContent([], locale)
    }
  },
  ["landing-content"],
  { tags: ["content"] },
)
