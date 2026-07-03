import { notFound } from "next/navigation"
import { sql } from "@/lib/db"
import { PostEditor, type PostEditorData } from "@/components/admin/post-editor"

export const dynamic = "force-dynamic"

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const postId = Number(id)
  if (!Number.isInteger(postId)) notFound()

  const rows = await sql<(PostEditorData & { id: number })[]>`
    select id, slug, title, title_es, excerpt, excerpt_es, body, body_es,
           cover_image, tags, published
    from posts where id = ${postId}
  `
  const post = rows[0]
  if (!post) notFound()

  return <PostEditor id={post.id} initial={post} />
}
