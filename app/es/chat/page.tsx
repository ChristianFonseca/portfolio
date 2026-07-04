import type { Metadata } from "next"
import { ChatPage } from "@/components/chat-page"
import { getDictionary } from "@/lib/i18n/dictionaries"

export const metadata: Metadata = {
  title: "Chat con Asistente de IA — Christian Fonseca",
  description:
    "Pregúntale al asistente de IA de Christian sobre su experiencia, habilidades, proyectos y disponibilidad. Respuestas basadas en su perfil real.",
  alternates: {
    canonical: "/es/chat",
    languages: { en: "/chat", es: "/es/chat" },
  },
}

export default function ChatEs() {
  return <ChatPage locale="es" dict={getDictionary("es")} />
}
