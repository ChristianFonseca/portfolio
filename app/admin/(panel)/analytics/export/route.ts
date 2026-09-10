import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { exportVisitorEvents, parseVisitorFilter, toCsv } from "@/lib/analytics"
import { logAudit } from "@/lib/activity"

// CSV de eventos de visitantes con el mismo filtro que la tabla (máx. 20.000 filas).
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const url = new URL(request.url)
  const sp: Record<string, string | undefined> = {}
  url.searchParams.forEach((v, k) => (sp[k] = v))
  const filter = parseVisitorFilter(sp)

  try {
    const rows = await exportVisitorEvents(filter)
    const csv = toCsv(rows as unknown as Record<string, unknown>[], [
      "id", "ts", "kind", "path", "locale", "session_id", "ip", "country", "referrer", "ua", "props",
    ])
    void logAudit({ actor: user.email, action: "analytics.export", detail: { rows: rows.length, ...filter }, headers: request.headers })
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${filter.range}-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("analytics export:", error)
    return NextResponse.json({ error: "Error al exportar" }, { status: 500 })
  }
}
