import Script from "next/script"
import { getContent } from "@/lib/content/queries"
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries"
import { AssistantWidget, type AssistantData } from "./assistant-widget"

// Servidor: reúne lo que el panel necesita y lo pasa ya resuelto al cliente.
// Solo toma lo que se muestra — nada de la base de conocimiento ni de los posts,
// que son caros y no se enseñan aquí. getContent está cacheado con el tag "content"
// y cae a static-data.json si Postgres no responde, así que el widget nunca
// tumba una página.
export async function AssistantMount({ locale }: { locale: Locale }) {
  let data: AssistantData = { name: "", tagline: "", location: "", photo: "", languages: [], certs: [], faq: [] }
  try {
    const c = await getContent(locale)
    data = {
      name: c.hero.data.name,
      tagline: c.hero.data.tagline,
      location: c.hero.data.location,
      photo: c.hero.data.photo || "/profile.webp",
      languages: c.skills.visible ? (c.skills.data.languages ?? []).map((l) => ({ name: l.name, level: l.level })) : [],
      certs: c.hero.data.certs.map((x) => ({ count: x.count, label: x.label })),
      faq: c.faq.visible ? c.faq.data.items.slice(0, 4).map((f) => ({ q: f.question, a: f.answer })) : [],
    }
  } catch (error) {
    console.error("AssistantMount:", error)
  }

  return (
    <>
      {/* El custom element se registra tarde a propósito: el widget no compite con
          el contenido por el hilo principal. */}
      <Script src="/mascota/brain-mascot.js" strategy="lazyOnload" />
      <AssistantWidget locale={locale} dict={getDictionary(locale)} data={data} />
    </>
  )
}
