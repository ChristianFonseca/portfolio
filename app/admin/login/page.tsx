"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        window.location.href = "/"
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Email o contraseña incorrectos")
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-foreground">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card/50 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),0_0_60px_-30px_rgba(168,85,247,0.4)] backdrop-blur-md">
        <BrandLogo variant="simbolo" className="h-10 w-auto" />
        <p className="mb-7 mt-3 text-sm text-muted-foreground">Panel de administración</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_24px_-6px_rgba(168,85,247,0.7)] hover:brightness-110"
            disabled={loading}
          >
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground/60">
          Sesión segura de 7 días, solo en este subdominio. Los intentos fallidos están limitados.
        </p>
      </div>
    </main>
  )
}
