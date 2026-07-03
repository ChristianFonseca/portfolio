import { redirect } from "next/navigation"
import { sql } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { UsersManager, type UserSummary } from "@/components/admin/users-manager"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const me = await getSessionUser()
  if (!me || me.role !== "admin") redirect("/")

  let users: UserSummary[] = []
  let dbError = false
  try {
    users = await sql<UserSummary[]>`
      select id, email, name, role, to_char(created_at, 'YYYY-MM-DD') as created_at from users order by id
    `
  } catch (error) {
    console.error("admin users:", error)
    dbError = true
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Usuarios</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Personas con acceso a este panel. <b>Admin</b>: todo (usuarios, configuración, contenido). <b>Editor</b>:
        solo contenido y analítica de preguntas.
      </p>
      {dbError ? (
        <p className="text-sm text-red-400">No se pudo conectar a la base de datos.</p>
      ) : (
        <UsersManager users={users} currentUserId={me?.id ?? 0} />
      )}
    </div>
  )
}
