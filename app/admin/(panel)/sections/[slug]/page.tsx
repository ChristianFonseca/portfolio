import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { kindSpecs } from "@/lib/content/specs"
import type { SectionKind } from "@/lib/content/schemas"
import { SectionEditor } from "@/components/admin/section-editor"

export const dynamic = "force-dynamic"

export default async function EditSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rows = await sql<{ slug: string; kind: SectionKind; title: string; data: unknown }[]>`
    select slug, kind, title, data from sections where slug = ${slug}
  `
  const section = rows[0]
  if (!section) notFound()

  const spec = kindSpecs[section.kind]
  if (!spec) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{section.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        {section.slug} · tipo {section.kind}
      </p>
      <SectionEditor slug={section.slug} spec={spec} initialData={section.data as Record<string, unknown>} />
    </div>
  )
}
