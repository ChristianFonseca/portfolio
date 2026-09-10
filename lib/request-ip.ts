import { createHmac } from "crypto"
import { isIP } from "net"

// Helpers únicos para identificar al cliente detrás de Cloudflare + nginx.
// nginx restaura la IP real desde CF-Connecting-IP (set_real_ip_from) y la expone
// como X-Real-IP; el origen solo acepta tráfico de Cloudflare (mTLS), así que estos
// headers no pueden venir falsificados por el visitante.

export function getClientIp(headers: Headers): string {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ]
  for (const c of candidates) if (c && isIP(c)) return c
  return "unknown"
}

// Para columnas inet: null si no es una IP válida.
export function ipOrNull(ip: string): string | null {
  return isIP(ip) ? ip : null
}

// País ISO-3166 alpha-2 que añade Cloudflare (CF-IPCountry). "XX" = desconocido, "T1" = Tor.
export function getCountry(headers: Headers): string {
  const c = (headers.get("cf-ipcountry") ?? "").trim().toUpperCase()
  return /^[A-Z0-9]{2}$/.test(c) && c !== "XX" ? c : ""
}

export function getUserAgent(headers: Headers): string {
  return (headers.get("user-agent") ?? "").slice(0, 200)
}

// Mismo HMAC que usa el chat desde el inicio (prefijo "chat-ip:"), para poder cruzar
// visitor_events con chat_questions por ip_hash.
export function hashIp(ip: string): string {
  const secret = process.env.SESSION_SECRET ?? "no-secret"
  return createHmac("sha256", `chat-ip:${secret}`).update(ip).digest("hex").slice(0, 32)
}

const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|quora link|curl\/|wget\/|python-requests|httpx\/|go-http-client|java\/|okhttp|scrapy|phantomjs|puppeteer|playwright|selenium|monitor|uptime|pingdom|statuscake|ahrefs|semrush|mj12|dotbot|petalbot|bytespider|gptbot|claudebot|ccbot|applebot|bingpreview/i

export function isBotUserAgent(ua: string): boolean {
  return !ua || BOT_UA.test(ua)
}
