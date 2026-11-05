import { unstable_cache } from "next/cache"
import { sql } from "@/lib/db"
import staticData from "./static-data.json"
import type { Locale } from "@/lib/i18n/dictionaries"
import type {
  AboutData,
  ApproachData,
  ExperienceData,
  FaqData,
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

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v)

// Un campo que se añade al esquema no existe en las filas ya guardadas: hasta que
// el admin las vuelva a guardar, se toma del contenido estático. Solo rellena
// claves ausentes; un valor guardado (aunque sea "") siempre gana.
function withDefaults(data: unknown, fallback: unknown): unknown {
  if (!isPlainObject(data) || !isPlainObject(fallback)) return data
  return { ...fallback, ...data }
}

const staticBySlug = new Map(STATIC_SECTIONS.map((s) => [s.slug, s]))

// Lo mismo para el editor del admin, que trabaja con { en, es } a la vez: así
// muestra el texto que ya se ve en la web y no lo borra al guardar.
export function withStaticDefaults(slug: string, data: { en?: unknown; es?: unknown }) {
  const fallback = staticBySlug.get(slug)
  if (!fallback) return data
  return {
    en: withDefaults(data.en, resolveData(fallback.data, "en")),
    es: withDefaults(data.es, resolveData(fallback.data, "es")),
  }
}

function buildContent(rows: SectionRecord[], locale: Locale): LandingContent {
  const bySlug = new Map<string, SectionRecord>(staticBySlug)
  for (const r of rows) bySlug.set(r.slug, r)

  const entry = <T>(slug: string) => {
    const s = bySlug.get(slug)
    if (!s) throw new Error(`Sección faltante: ${slug}`)
    const title = locale === "es" ? s.title_es || s.title : s.title
    const fallback = staticBySlug.get(slug)
    const data = withDefaults(resolveData(s.data, locale), fallback && resolveData(fallback.data, locale))
    return { title, visible: s.visible, data: data as T }
  }

  return {
    hero: entry<HeroData>("hero"),
    about: entry<AboutData>("about"),
    skills: entry<SkillsData>("skills"),
    publicProjects: entry<ProjectsData>("public-projects"),
    researchProjects: entry<ResearchData>("research-projects"),
    experience: entry<ExperienceData>("experience"),
    teaching: entry<ExperienceData>("teaching"),
    faq: entry<FaqData>("faq"),
    approach: entry<ApproachData>("approach"),
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
