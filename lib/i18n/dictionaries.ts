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
    chat: {
      title: "Chat with AI Assistant",
      subtitle: "Ask anything about Christian's experience, skills or projects — answers are grounded in his real profile.",
      greeting:
        "Hello! I'm Christian's AI assistant. I can help you learn more about his experience, skills, and projects. What would you like to know?",
      placeholder: "Ask me anything about Christian's experience...",
      back: "Back to Portfolio",
      questionsLeftOne: "question left today.",
      questionsLeftMany: "questions left today.",
      unavailable: "The assistant is unavailable right now. Please try again in a minute.",
      connectionError: "Connection error. Please try again.",
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
    chat: {
      title: "Chat con Asistente de IA",
      subtitle:
        "Pregunta lo que quieras sobre la experiencia, habilidades o proyectos de Christian — las respuestas se basan en su perfil real.",
      greeting:
        "¡Hola! Soy el asistente de IA de Christian. Puedo ayudarte a conocer más sobre su experiencia, habilidades y proyectos. ¿Qué te gustaría saber?",
      placeholder: "Pregúntame lo que quieras sobre la experiencia de Christian...",
      back: "Volver al Portafolio",
      questionsLeftOne: "pregunta restante hoy.",
      questionsLeftMany: "preguntas restantes hoy.",
      unavailable: "El asistente no está disponible en este momento. Intenta de nuevo en un minuto.",
      connectionError: "Error de conexión. Intenta de nuevo.",
    },
  },
} as const

export type Dictionary = (typeof dictionaries)[Locale]

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en
}
