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
    <SectionEditor
      slug={section.slug}
      title={section.title}
      spec={spec}
      initialData={section.data as Record<string, unknown>}
    />
  )
}
