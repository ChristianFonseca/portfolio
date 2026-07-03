import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, ExternalLink, LayoutGrid, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { getSessionUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { LogoutButton } from "@/components/admin/logout-button"
import { SidebarSections, type SidebarSection } from "@/components/admin/sidebar-sections"

export const dynamic = "force-dynamic"

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  let sections: SidebarSection[] = []
  try {
    sections = await sql<SidebarSection[]>`
      select slug, title, position, visible from sections order by position
    `
  } catch (error) {
    console.error("panel layout sections:", error)
  }

  return (
    <main className="min-h-screen text-foreground">
      {/* Topbar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="flex h-14 items-center gap-4 px-5">
          <Link
            href="/"
            className="bg-gradient-to-r from-primary to-accent bg-clip-text text-sm font-bold text-transparent"
          >
            christianfonseca.dev — admin
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden text-xs text-muted-foreground sm:block">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl md:grid-cols-[250px_1fr]">
        {/* Sidebar */}
        <aside className="border-b border-border bg-card/30 px-3 py-6 md:min-h-[calc(100vh-3.5rem)] md:border-b-0 md:border-r">
          <SidebarSections sections={sections} />
          <div className="mt-6 border-t border-border/70 pt-4">
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Resumen
                </Link>
              </li>
              <li>
                <Link
                  href="/users"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
                >
                  <Users className="h-4 w-4" />
                  Usuarios
                </Link>
              </li>
              <li>
                <Link
                  href="/config"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                  Configuración
                </Link>
              </li>
              <li>
                <a
                  href="https://christianfonseca.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver landing
                </a>
              </li>
            </ul>
          </div>
        </aside>

        {/* Contenido */}
        <div className="min-w-0 px-6 py-8">{children}</div>
      </div>
    </main>
  )
}
