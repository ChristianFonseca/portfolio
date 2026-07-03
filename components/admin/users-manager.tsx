"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Trash2, UserPlus, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createUser, deleteUser, resetUserPassword } from "@/app/admin/actions"

export interface UserSummary {
  id: number
  email: string
  name: string
  created_at: string
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join("")
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

export function UsersManager({ users, currentUserId }: { users: UserSummary[]; currentUserId: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [toast, setToast] = useState<{ ok: boolean; text: string; sticky?: boolean } | null>(null)

  useEffect(() => {
    if (!toast || toast.sticky) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createUser({ email, name, password })
      if (result.ok) {
        setToast({
          ok: true,
          sticky: true,
          text: `Usuario ${email} creado. Su contraseña: ${password} — cópiala y compártela de forma segura; no se vuelve a mostrar.`,
        })
        setEmail("")
        setName("")
        setPassword("")
        router.refresh()
      } else {
        setToast({ ok: false, text: result.error })
      }
    })
  }

  const handleDelete = (user: UserSummary) => {
    if (!confirm(`¿Quitar el acceso de ${user.email}? Su sesión dejará de funcionar de inmediato.`)) return
    startTransition(async () => {
      const result = await deleteUser(user.id)
      setToast(result.ok ? { ok: true, text: `${user.email} eliminado` } : { ok: false, text: result.error })
      router.refresh()
    })
  }

  const handleReset = (user: UserSummary) => {
    if (!confirm(`¿Generar una contraseña nueva para ${user.email}?`)) return
    const newPassword = generatePassword()
    startTransition(async () => {
      const result = await resetUserPassword(user.id, newPassword)
      setToast(
        result.ok
          ? {
              ok: true,
              sticky: true,
              text: `Nueva contraseña de ${user.email}: ${newPassword} — cópiala ahora, no se vuelve a mostrar.`,
            }
          : { ok: false, text: result.error },
      )
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card/40 px-5 py-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-accent/60 text-sm font-bold text-white">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {user.name || user.email}
                {user.id === currentUserId && (
                  <Badge variant="secondary" className="ml-2 border-none bg-primary/15 text-[10px] text-primary">
                    tú
                  </Badge>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email} · desde {user.created_at}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-transparent text-xs"
              disabled={pending}
              onClick={() => handleReset(user)}
            >
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Nueva contraseña
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-red-500/40 bg-transparent text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
              disabled={pending || user.id === currentUserId}
              onClick={() => handleDelete(user)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Eliminar
            </Button>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold">
          <UserPlus className="h-4 w-4 text-primary" />
          Agregar usuario
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Podrá entrar a este panel y editar el contenido de la landing.
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="new-email" className="mb-1 block text-xs text-muted-foreground">
              Email
            </label>
            <input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="persona@ejemplo.com"
            />
          </div>
          <div>
            <label htmlFor="new-name" className="mb-1 block text-xs text-muted-foreground">
              Nombre
            </label>
            <input
              id="new-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Nombre y apellido"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="mb-1 block text-xs text-muted-foreground">
              Contraseña (mín. 10 caracteres)
            </label>
            <div className="flex gap-2">
              <input
                id="new-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-auto shrink-0 rounded-lg bg-transparent text-xs"
                onClick={() => setPassword(generatePassword())}
              >
                <Wand2 className="mr-1 h-3.5 w-3.5" />
                Generar
              </Button>
            </div>
          </div>
          <Button
            className="w-full rounded-lg bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_20px_-6px_rgba(168,85,247,0.6)] hover:brightness-110 disabled:opacity-50"
            disabled={pending || !email || password.length < 10}
            onClick={handleCreate}
          >
            {pending ? "Creando…" : "Crear usuario"}
          </Button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm shadow-2xl backdrop-blur-md ${
            toast.ok
              ? "border-emerald-500/50 bg-emerald-100/95 text-emerald-900 dark:bg-emerald-950/85 dark:text-emerald-200"
              : "border-red-500/50 bg-red-100/95 text-red-900 dark:bg-red-950/85 dark:text-red-200"
          }`}
        >
          <span className="break-words">{toast.text}</span>
          {toast.sticky && (
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-3 text-xs underline opacity-70 hover:opacity-100"
            >
              cerrar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
