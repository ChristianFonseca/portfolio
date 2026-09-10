import { NextResponse } from "next/server"
import { destroySession, getSessionUser } from "@/lib/auth"
import { logAudit } from "@/lib/activity"

export async function POST(request: Request) {
  const user = await getSessionUser().catch(() => null)
  await destroySession()
  if (user) void logAudit({ actor: user.email, action: "logout", headers: request.headers })
  return NextResponse.json({ ok: true })
}
