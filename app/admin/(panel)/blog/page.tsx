import { sql } from "@/lib/db"
import { PostsManager, type PostSummary } from "@/components/admin/posts-manager"

export const dynamic = "force-dynamic"

export default async function AdminBlogPage() {
  let posts: PostSummary[] = []
  let dbError = false
  try {
    posts = await sql<PostSummary[]>`
      select id, slug, title, title_es, published,
             to_char(updated_at, 'DD Mon YYYY, HH24:MI') as updated_at
      from posts order by updated_at desc
    `
  } catch (error) {
    console.error("admin blog:", error)
    dbError = true
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Blog</h1>
      <p className="mb-8 mt-1 text-sm text-muted-foreground">
        Artículos bilingües. Los borradores no se muestran en el sitio; publicar exige título y contenido en EN y ES.
      </p>
      {dbError ? (
        <p className="text-sm text-red-400">No se pudo conectar a la base de datos.</p>
      ) : (
        <PostsManager posts={posts} />
      )}
    </div>
  )
}
