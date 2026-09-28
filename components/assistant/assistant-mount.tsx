import Script from "next/script"
import { getContent } from "@/lib/content/queries"
import { getDictionary, type Locale } from "@/lib/i18n/dictionaries"
import { AssistantWidget, type AssistantData } from "./assistant-widget"

const EMPTY: AssistantData = {
  name: "", tagline: "", location: "", photo: "", languages: [], certs: [], faq: [],
}

// Solo lo que el panel enseña. Nada de la base de conocimiento ni de los posts,
// que son caros y aquí no se muestran. getContent está cacheado con el tag
// "content" y cae a static-data.json si Postgres no responde, así que el widget
// nunca tumba una página.
async function load(locale: Locale): Promise<AssistantData> {
  try {
    const c = await getContent(locale)
    return {
      name: c.hero.data.name,
      tagline: c.hero.data.tagline,
      location: c.hero.data.location,
      photo: c.hero.data.photo || "/profile.webp",
      languages: c.skills.visible ? (c.skills.data.languages ?? []).map((l) => ({ name: l.name, level: l.level })) : [],
      certs: c.hero.data.certs.map((x) => ({ count: x.count, label: x.label })),
      faq: c.faq.visible ? c.faq.data.items.slice(0, 4).map((f) => ({ q: f.question, a: f.answer })) : [],
    }
  } catch (error) {
    console.error(`AssistantMount(${locale}):`, error)
    return EMPTY
  }
}

// Se mandan los dos idiomas resueltos, no el de la petición. El layout raíz no
// se vuelve a renderizar al navegar entre / y /es, así que un prop de locale se
// quedaría congelado y el panel seguiría en el idioma anterior. El widget elige
// según la ruta. Son unos 4 KB de más por página; la alternativa era pedirlos
// por red al cambiar de idioma.
export async function AssistantMount() {
  const [en, es] = await Promise.all([load("en"), load("es")])

  return (
    <>
      {/* El custom element se registra tarde a propósito: el widget no compite con
          el contenido por el hilo principal. */}
      <Script src="/mascota/brain-mascot.js" strategy="lazyOnload" />
      <AssistantWidget
        dicts={{ en: getDictionary("en"), es: getDictionary("es") }}
        dataByLocale={{ en, es }}
      />
    </>
  )
}
