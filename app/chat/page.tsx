"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send, Bot, User } from "lucide-react"
import { BubbleCard } from "@/components/bubble-card"
import { ThemedBackground } from "@/components/themed-background"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageTransition } from "@/components/page-transition"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm Christian's AI assistant. I can help you learn more about his experience, skills, and projects. What would you like to know?",
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
      router.push("/")
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
        body: JSON.stringify({ message: question, history, locale: "en" }),
      })
      const data = await res.json().catch(() => ({}))

      const content = res.ok
        ? data.answer
        : (data.error ?? "The assistant is unavailable right now. Please try again in a minute.")

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
          content: "Connection error. Please try again.",
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
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full glow-effect hover:bg-primary/20 text-primary"
            asChild
          >
            <a href="/" onClick={handleNavigateBack}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Portfolio
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Chat Container */}
      <div className="flex-1 pt-32 pb-8 px-6 flex flex-col max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent floating-element">
          Chat with AI Assistant
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Ask anything about Christian's experience, skills or projects — answers are grounded in his real profile.
          {remaining !== null && remaining <= 3 && (
            <span className="ml-2 text-yellow-600 dark:text-yellow-400">
              {remaining} question{remaining === 1 ? "" : "s"} left today.
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
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${message.role === "user"
                    ? "bg-gradient-to-br from-primary to-accent"
                    : "bg-gradient-to-br from-accent to-primary"
                    }`}
                >
                  {message.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div
                  className={`flex-1 max-w-[80%] ${message.role === "user" ? "bg-primary/20" : "bg-accent/20"
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
                    <span
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
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
            placeholder="Ask me anything about Christian's experience..."
            className="flex-1 px-6 py-4 rounded-full bg-card/50 backdrop-blur-sm border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            disabled={isTyping}
          />
          <Button
            type="submit"
            size="lg"
            className="rounded-full px-8 glow-effect hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-105 transition-all duration-300"
            disabled={isTyping || !input.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </main>
  )
}
