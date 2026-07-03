import { sql } from "@/lib/db"
import { SectionsList, type SectionSummary } from "@/components/admin/sections-list"

export const dynamic = "force-dynamic"

export default async function AdminSectionsPage() {
  let sections: SectionSummary[] = []
  let dbError = false
  try {
    sections = await sql<SectionSummary[]>`
      select slug, kind, title, position, visible, to_char(updated_at, 'YYYY-MM-DD HH24:MI') as updated_at
      from sections order by position
    `
  } catch (error) {
    console.error("admin sections:", error)
    dbError = true
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Secciones de la landing</h1>
      <p className="text-sm text-muted-foreground mb-8">
        El orden de esta lista es el orden en la página. Los cambios se publican al guardar.
      </p>
      {dbError ? (
        <p className="text-sm text-red-400">
          No se pudo conectar a la base de datos. La landing sigue mostrando el último contenido publicado.
        </p>
      ) : (
        <SectionsList sections={sections} />
      )}
    </div>
  )
}
