import type { FaqData, LandingContent } from "@/lib/content/schemas"
import type { Locale } from "@/lib/i18n/dictionaries"

const SITE = "https://christianfonseca.dev"

// Schema.org Person: claridad de entidad para Google y motores de respuesta de IA
export function personJsonLd(content: LandingContent, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Christian Fonseca",
    alternateName: "Christian Jefrey Fonseca Rodriguez",
    jobTitle: content.hero.data.tagline,
    description: content.about.data.text,
    url: locale === "es" ? `${SITE}/es` : SITE,
    email: "mailto:christian.fonseca.r@gmail.com",
    image: `${SITE}/profile.webp`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lima",
      addressCountry: "PE",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Universidad Nacional de Ingeniería",
    },
    knowsLanguage: ["es", "en"],
    sameAs: [
      "https://linkedin.com/in/christian-fonseca-rodriguez",
      "https://github.com/christianfonseca",
      "https://scholar.google.com/citations?user=95NzphUAAAAJ",
      "https://www.credly.com/users/christian-fonseca-rodriguez",
    ],
  }
}

// Schema.org FAQPage: candidata directa a AI Overviews y People Also Ask
export function faqJsonLd(faq: FaqData) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
}
