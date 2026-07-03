import { redirect } from "next/navigation"
import Link from "next/link"
import { getSessionUser } from "@/lib/auth"
import { LogoutButton } from "@/components/admin/logout-button"

export const dynamic = "force-dynamic"

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  return (
    <main className="dark min-h-screen">
      <div className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
          <span className="font-bold text-sm bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            christianfonseca.dev — admin
          </span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
              Secciones
            </Link>
            <Link href="/users" className="text-muted-foreground hover:text-primary transition-colors">
              Usuarios
            </Link>
            <a
              href="https://christianfonseca.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Ver landing ↗
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-10">{children}</div>
    </main>
  )
}
