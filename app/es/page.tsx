import type { Metadata } from "next"
import { Landing } from "@/components/landing"
import { getContent } from "@/lib/content/queries"
import { getDictionary } from "@/lib/i18n/dictionaries"

export const dynamic = "force-dynamic"

const descripcion =
  "Ingeniero Senior de Datos e IA con más de 10 años de experiencia en arquitecturas de datos escalables, modelos de ML y soluciones listas para producción."

export const metadata: Metadata = {
  title: "Christian Fonseca - Ingeniero de Soluciones de IA",
  description: descripcion,
  alternates: {
    canonical: "/es",
    languages: {
      en: "/",
      es: "/es",
    },
  },
  openGraph: {
    title: "Christian Fonseca - Ingeniero de Soluciones de IA",
    description: descripcion,
    url: "/es",
    siteName: "Christian Fonseca",
    locale: "es_PE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Christian Fonseca - Ingeniero de Soluciones de IA",
    description: descripcion,
  },
}

export default async function HomeEs() {
  const content = await getContent("es")
  return <Landing content={content} locale="es" dict={getDictionary("es")} />
}
