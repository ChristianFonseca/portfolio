// Enlaces públicos de Christian, en un solo sitio. Antes estaban duplicados en
// components/landing.tsx (el bloque de iconos del hero) y en lib/seo.ts (sameAs),
// que es justo la clase de duplicado que se desincroniza sin que nadie lo note.

export interface SocialLink {
  id: "linkedin" | "github" | "scholar" | "credly"
  label: string
  href: string
}

export const SOCIAL: SocialLink[] = [
  { id: "linkedin", label: "LinkedIn", href: "https://linkedin.com/in/christian-fonseca-rodriguez" },
  { id: "github", label: "GitHub", href: "https://github.com/christianfonseca" },
  { id: "scholar", label: "Google Scholar", href: "https://scholar.google.com/citations?user=95NzphUAAAAJ&hl=es" },
  { id: "credly", label: "Credly", href: "https://www.credly.com/users/christian-fonseca-rodriguez" },
]

export const CONTACT_EMAIL = "christian.fonseca.r@gmail.com"
export const CV_PATH = "/cv.pdf"
export const CV_FILENAME = "Christian-Fonseca-CV.pdf"
