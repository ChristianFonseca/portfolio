import type { Metadata } from "next"
import { ChatPage } from "@/components/chat-page"
import { getDictionary } from "@/lib/i18n/dictionaries"

export const metadata: Metadata = {
  title: "Chat with AI Assistant — Christian Fonseca",
  description:
    "Ask Christian's AI assistant about his experience, skills, projects and availability. Answers grounded in his real profile.",
  alternates: {
    canonical: "/chat",
    languages: { en: "/chat", es: "/es/chat" },
  },
}

export default function Chat() {
  return <ChatPage locale="en" dict={getDictionary("en")} />
}
