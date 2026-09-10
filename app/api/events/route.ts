import { NextResponse } from "next/server"
import { z } from "zod"
import { createRateLimiter } from "@/lib/rate-limit"
import { getClientIp, getCountry, getUserAgent, isBotUserAgent } from "@/lib/request-ip"
import { maybePurge, recordVisitorEvents, type VisitorEventInput } from "@/lib/activity"

// Ingesta de eventos del tracker del sitio público (lotes pequeños vía sendBeacon/fetch).
// Siempre responde 204: el navegador no necesita saber nada, y no se filtra información.

const MAX_BODY = 32 * 1024
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 120 })

const propValue = z.union([z.string().max(300), z.number().finite(), z.boolean()])
const propsSchema = z.record(z.string().max(40), propValue).refine((o) => Object.keys(o).length <= 14, "too many props")

const eventSchema = z.object({
  t: z.enum(["pageview", "section", "click", "scroll", "leave"]),
  p: z.string().min(1).max(300),
  l: z.enum(["en", "es"]).optional(),
  d: propsSchema.optional(),
})

const bodySchema = z.object({
  sid: z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/),
  e: z.array(eventSchema).min(1).max(50),
})

const noContent = () => new NextResponse(null, { status: 204 })

function normalizePath(p: string): string {
  const clean = p.split(/[?#]/)[0] || "/"
  return (clean.startsWith("/") ? clean : `/${clean}`).slice(0, 300)
}

export async function POST(request: Request) {
  if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return noContent()
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return new NextResponse(null, { status: 413 })

  const ua = getUserAgent(request.headers)
  if (isBotUserAgent(ua)) return noContent()

  const ip = getClientIp(request.headers)
  if (!limiter.check(ip)) return new NextResponse(null, { status: 429 })

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 413 })

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return new NextResponse(null, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) return new NextResponse(null, { status: 400 })

  const events: VisitorEventInput[] = parsed.data.e.map((ev) => ({
    kind: ev.t,
    path: normalizePath(ev.p),
    locale: ev.l ?? (ev.p === "/es" || ev.p.startsWith("/es/") ? "es" : "en"),
    sessionId: parsed.data.sid,
    props: ev.d ?? {},
  }))

  try {
    await recordVisitorEvents(events, {
      ip,
      country: getCountry(request.headers),
      ua,
      referrer: request.headers.get("referer") ?? "",
    })
  } catch (error) {
    console.error("events ingest:", error)
  }
  maybePurge()
  return noContent()
}
