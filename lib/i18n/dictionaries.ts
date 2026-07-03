export type Locale = "en" | "es"

export const locales: Locale[] = ["en", "es"]
export const defaultLocale: Locale = "en"

// Textos de interfaz de la landing (el contenido de las secciones vive en la DB)
export const dictionaries = {
  en: {
    nav: {
      home: "Home",
      profile: "Profile",
      projects: "Projects",
      experience: "Experience",
      blog: "Blog",
      contact: "Contact",
    },
    hero: {
      tryChat: "Try Chat!",
      downloadCV: "Download CV",
    },
    profile: {
      heading: "Professional Profile",
      connect: "Connect",
      languagesTitle: "Languages",
    },
    contact: {
      heading: "Ready to collaborate?",
      subheading:
        "I'm available for new projects and opportunities. Let's connect and build something incredible together.",
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "your.email@example.com",
      subject: "Subject",
      subjectPlaceholder: "What's this about?",
      message: "Message",
      messagePlaceholder: "Tell me about your project or opportunity...",
      send: "Send Message",
      sending: "Sending...",
      sendError: "Failed to send message. Please try again or contact directly via email.",
      directEmail: "Direct Email",
      scholar: "Google Scholar",
    },
    footer: {
      rights: "All rights reserved.",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      profile: "Perfil",
      projects: "Proyectos",
      experience: "Experiencia",
      blog: "Blog",
      contact: "Contacto",
    },
    hero: {
      tryChat: "¡Prueba el Chat!",
      downloadCV: "Descargar CV",
    },
    profile: {
      heading: "Perfil Profesional",
      connect: "Conecta",
      languagesTitle: "Idiomas",
    },
    contact: {
      heading: "¿Listo para colaborar?",
      subheading:
        "Estoy disponible para nuevos proyectos y oportunidades. Conectemos y construyamos algo increíble juntos.",
      name: "Nombre",
      namePlaceholder: "Tu nombre",
      email: "Email",
      emailPlaceholder: "tu.email@ejemplo.com",
      subject: "Asunto",
      subjectPlaceholder: "¿De qué se trata?",
      message: "Mensaje",
      messagePlaceholder: "Cuéntame sobre tu proyecto u oportunidad...",
      send: "Enviar Mensaje",
      sending: "Enviando...",
      sendError: "No se pudo enviar el mensaje. Intenta de nuevo o escríbeme directamente por email.",
      directEmail: "Email Directo",
      scholar: "Google Scholar",
    },
    footer: {
      rights: "Todos los derechos reservados.",
    },
  },
} as const

export type Dictionary = (typeof dictionaries)[Locale]

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en
}
