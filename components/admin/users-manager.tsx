"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
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
  "w-full px-3 py-2 rounded-lg bg-background/50 border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"

export function UsersManager({ users, currentUserId }: { users: UserSummary[]; currentUserId: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createUser({ email, name, password })
      if (result.ok) {
        setMessage({
          ok: true,
          text: `Usuario ${email} creado. Compártele su contraseña de forma segura: ${password}`,
        })
        setEmail("")
        setName("")
        setPassword("")
        router.refresh()
      } else {
        setMessage({ ok: false, text: result.error })
      }
    })
  }

  const handleDelete = (user: UserSummary) => {
    if (!confirm(`¿Quitar el acceso de ${user.email}? Su sesión dejará de funcionar de inmediato.`)) return
    startTransition(async () => {
      const result = await deleteUser(user.id)
      setMessage(result.ok ? { ok: true, text: `${user.email} eliminado` } : { ok: false, text: result.error })
      router.refresh()
    })
  }

  const handleReset = (user: UserSummary) => {
    const newPassword = generatePassword()
    if (!confirm(`¿Generar una contraseña nueva para ${user.email}?`)) return
    startTransition(async () => {
      const result = await resetUserPassword(user.id, newPassword)
      setMessage(
        result.ok
          ? { ok: true, text: `Nueva contraseña de ${user.email}: ${newPassword} — cópiala ahora, no se vuelve a mostrar.` }
          : { ok: false, text: result.error },
      )
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-4 rounded-xl border border-border bg-card/50 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user.name || user.email}
                {user.id === currentUserId && (
                  <Badge variant="secondary" className="ml-2 text-[10px] bg-primary/10 text-primary border-none">
                    tú
                  </Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email} · desde {user.created_at}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs bg-transparent"
              disabled={pending}
              onClick={() => handleReset(user)}
            >
              Nueva contraseña
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs bg-transparent border-red-500/40 text-red-400 hover:bg-red-500/10"
              disabled={pending || user.id === currentUserId}
              onClick={() => handleDelete(user)}
            >
              Eliminar
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-5 h-fit">
        <h2 className="font-semibold mb-4">Agregar usuario</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="new-email" className="block text-xs text-muted-foreground mb-1">
              Email
            </label>
            <input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="new-name" className="block text-xs text-muted-foreground mb-1">
              Nombre
            </label>
            <input id="new-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-xs text-muted-foreground mb-1">
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
                className="rounded-lg text-xs bg-transparent shrink-0"
                onClick={() => setPassword(generatePassword())}
              >
                Generar
              </Button>
            </div>
          </div>
          <Button className="w-full rounded-lg" disabled={pending || !email || password.length < 10} onClick={handleCreate}>
            {pending ? "Creando..." : "Crear usuario"}
          </Button>
        </div>
        {message && (
          <p className={`text-sm mt-4 break-words ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>
        )}
      </div>
    </div>
  )
}
