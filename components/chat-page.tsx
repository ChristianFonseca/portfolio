"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send, Bot, User, Languages } from "lucide-react"
import { BubbleCard } from "@/components/bubble-card"
import { ThemedBackground } from "@/components/themed-background"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageTransition } from "@/components/page-transition"
import { useRouter } from "next/navigation"
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatPage({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const home = locale === "es" ? "/es" : "/"
  const otherChat = locale === "es" ? "/chat" : "/es/chat"

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: dict.chat.greeting,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const handleNavigateBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsNavigating(true)
    setTimeout(() => {
      router.push(home)
    }, 1500)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const question = input.trim()
    if (!question) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      // Historial reciente (sin el saludo inicial) para dar contexto al asistente
      const history = [...messages, userMessage]
        .filter((m) => m.id !== "1")
        .slice(-10, -1)
        .map((m) => ({ role: m.role === "user" ? "user" : "model", content: m.content }))

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history, locale }),
      })
      const data = await res.json().catch(() => ({}))

      const content = res.ok ? data.answer : (data.error ?? dict.chat.unavailable)

      if (res.ok && typeof data.remaining === "number" && data.remaining >= 0) {
        setRemaining(data.remaining)
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content, timestamp: new Date() },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: dict.chat.connectionError,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <main className="min-h-screen relative flex flex-col animate-page-fade">
      {isNavigating && <PageTransition />}

      <ThemedBackground />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-24">
        <div className="absolute inset-0 bg-background/40 [backdrop-filter:blur(8px)]" />
        <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Button variant="ghost" size="lg" asChild>
            <a href={home} onClick={handleNavigateBack}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              {dict.chat.back}
            </a>
          </Button>
          <div className="flex items-center gap-2">
            <Link
              href={otherChat}
              aria-label={locale === "es" ? "Chat in English" : "Chat en español"}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-background/50 px-3 text-xs font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary hover:text-primary"
            >
              <Languages className="h-3.5 w-3.5" />
              {locale === "es" ? "EN" : "ES"}
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="flex-1 pt-32 pb-8 px-6 flex flex-col max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent floating-element">
          {dict.chat.title}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {dict.chat.subtitle}
          {remaining !== null && remaining <= 3 && (
            <span className="ml-2 text-yellow-600 dark:text-yellow-400">
              {remaining} {remaining === 1 ? dict.chat.questionsLeftOne : dict.chat.questionsLeftMany}
            </span>
          )}
        </p>

        {/* Messages Container */}
        <BubbleCard className="flex-1 mb-6 overflow-hidden flex flex-col glow-effect" noAnimation>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-primary to-accent"
                      : "bg-gradient-to-br from-accent to-primary"
                  }`}
                >
                  {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === "user" ? "bg-primary/20" : "bg-accent/20"
                  } rounded-2xl p-4 backdrop-blur-sm`}
                >
                  <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-accent to-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="bg-accent/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </BubbleCard>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={dict.chat.placeholder}
            className="flex-1 px-6 py-4 rounded-full bg-card/50 backdrop-blur-sm border border-border text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={isTyping}
          />
          <Button type="submit" size="lg" className="px-8" disabled={isTyping || !input.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </main>
  )
}
