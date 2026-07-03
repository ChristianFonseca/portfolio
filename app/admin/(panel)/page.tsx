import Link from "next/link"
import { Pencil, EyeOff } from "lucide-react"
import { sql } from "@/lib/db"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

interface SectionCard {
  slug: string
  kind: string
  title: string
  visible: boolean
  updated_at: string
}

export default async function AdminOverviewPage() {
  let sections: SectionCard[] = []
  let dbError = false
  try {
    sections = await sql<SectionCard[]>`
      select slug, kind, title, visible, to_char(updated_at, 'DD Mon YYYY, HH24:MI') as updated_at
      from sections order by position
    `
  } catch (error) {
    console.error("admin overview:", error)
    dbError = true
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Contenido de la landing</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Elige una sección para editarla. Al guardar, el cambio queda visible en{" "}
        <a
          href="https://christianfonseca.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          christianfonseca.dev
        </a>{" "}
        al instante.
      </p>

      {dbError ? (
        <p className="text-sm text-red-400">
          No se pudo conectar a la base de datos. La landing sigue mostrando el último contenido publicado.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              key={section.slug}
              href={`/sections/${section.slug}`}
              className={`group relative rounded-2xl border border-border bg-card/40 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)] ${
                section.visible ? "" : "opacity-60"
              }`}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="font-semibold leading-snug">{section.title}</h2>
                <Pencil className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">
                tipo <span className="text-foreground/70">{section.kind}</span>
              </p>
              <div className="mt-4 flex items-center gap-2">
                {!section.visible && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-yellow-500/50 text-[10px] text-yellow-400"
                  >
                    <EyeOff className="h-3 w-3" /> oculta
                  </Badge>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground/60">act. {section.updated_at}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
