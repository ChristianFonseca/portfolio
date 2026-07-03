import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { kindSpecs } from "@/lib/content/specs"
import type { SectionKind } from "@/lib/content/schemas"
import { SectionEditor } from "@/components/admin/section-editor"

export const dynamic = "force-dynamic"

export default async function EditSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const rows = await sql<{ slug: string; kind: SectionKind; title: string; title_es: string; data: unknown }[]>`
    select slug, kind, title, title_es, data from sections where slug = ${slug}
  `
  const section = rows[0]
  if (!section) notFound()

  const spec = kindSpecs[section.kind]
  if (!spec) notFound()

  // data = { en, es }; tolera formato legacy plano (pre-i18n)
  const raw = (section.data ?? {}) as Record<string, unknown>
  const initialData =
    "en" in raw
      ? (raw as { en?: Record<string, unknown>; es?: Record<string, unknown> })
      : { en: raw, es: raw }

  return (
    <SectionEditor
      slug={section.slug}
      kind={section.kind}
      title={section.title}
      titleEs={section.title_es}
      spec={spec}
      initialData={initialData}
    />
  )
}
