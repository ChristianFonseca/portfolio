import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { exportAudit, parseAuditFilter, toCsv } from "@/lib/analytics"
import { logAudit } from "@/lib/activity"

// CSV de la bitácora con el mismo filtro que la tabla (máx. 20.000 filas). Solo admin.
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const url = new URL(request.url)
  const sp: Record<string, string | undefined> = {}
  url.searchParams.forEach((v, k) => (sp[k] = v))
  const filter = parseAuditFilter(sp)

  try {
    const rows = await exportAudit(filter)
    const csv = toCsv(rows as unknown as Record<string, unknown>[], [
      "id", "ts", "actor", "action", "target", "ok", "ip", "country", "ua", "detail",
    ])
    void logAudit({ actor: user.email, action: "audit.export", detail: { rows: rows.length, ...filter }, headers: request.headers })
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bitacora-${filter.range}-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("audit export:", error)
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 })
  }
}
