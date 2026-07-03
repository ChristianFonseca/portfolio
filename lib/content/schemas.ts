import { z } from "zod"

export const heroSchema = z.object({
  name: z.string().min(1).max(120),
  tagline: z.string().min(1).max(200),
  location: z.string().max(120),
  certs: z.array(z.object({ count: z.string().max(20), label: z.string().min(1).max(60) })).max(20),
})

export const aboutSchema = z.object({
  text: z.string().min(1).max(2000),
})

export const skillsSchema = z.object({
  groups: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        color: z.enum(["purple", "blue", "emerald", "yellow", "orange", "cyan", "rose"]),
        badges: z.array(z.string().min(1).max(60)).max(40),
      }),
    )
    .max(12),
  languages: z.array(z.object({ name: z.string().min(1).max(60), level: z.string().min(1).max(60) })).max(10),
})

export const projectsSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(600),
        image: z.string().max(300),
        tech: z.array(z.string().min(1).max(60)).max(20),
        language: z.string().max(60),
        languageColor: z.string().max(20),
      }),
    )
    .max(24),
})

export const researchSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        description: z.string().max(600),
        bullets: z.array(z.string().min(1).max(400)).max(12),
        tech: z.array(z.string().min(1).max(60)).max(20),
      }),
    )
    .max(12),
})

export const experienceSchema = z.object({
  items: z
    .array(
      z.object({
        role: z.string().min(1).max(120),
        org: z.string().min(1).max(160),
        period: z.string().min(1).max(80),
        current: z.boolean(),
        bullets: z.array(z.string().min(1).max(400)).max(12),
        tech: z.array(z.string().min(1).max(60)).max(24),
      }),
    )
    .max(24),
})

export const kindSchemas = {
  hero: heroSchema,
  about: aboutSchema,
  skills: skillsSchema,
  projects: projectsSchema,
  research: researchSchema,
  experience: experienceSchema,
} as const

export type SectionKind = keyof typeof kindSchemas

export type HeroData = z.infer<typeof heroSchema>
export type AboutData = z.infer<typeof aboutSchema>
export type SkillsData = z.infer<typeof skillsSchema>
export type ProjectsData = z.infer<typeof projectsSchema>
export type ResearchData = z.infer<typeof researchSchema>
export type ExperienceData = z.infer<typeof experienceSchema>

export interface SectionRecord {
  slug: string
  kind: SectionKind
  title: string
  position: number
  visible: boolean
  data: unknown
}

export interface SectionEntry<T> {
  title: string
  visible: boolean
  data: T
}

export interface LandingContent {
  hero: SectionEntry<HeroData>
  about: SectionEntry<AboutData>
  skills: SectionEntry<SkillsData>
  publicProjects: SectionEntry<ProjectsData>
  researchProjects: SectionEntry<ResearchData>
  experience: SectionEntry<ExperienceData>
  teaching: SectionEntry<ExperienceData>
}
