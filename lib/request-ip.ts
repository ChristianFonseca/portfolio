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

// Clave para el límite por IP. Con IPv6, cualquiera con una /64 (lo normal en una
// conexión doméstica) puede ir cambiando de dirección, así que se agrupa por el
// prefijo /64. Las IPv4 mapeadas (::ffff:1.2.3.4) cuentan como la IPv4.
export function rateKey(ip: string): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip)
  if (mapped) return mapped[1]
  if (isIP(ip) !== 6) return ip
  return `${ipv6Groups(ip).slice(0, 4).join(":")}::/64`
}

// Los 8 grupos de una IPv6 ya expandida y normalizada ("::" rellenado con ceros).
function ipv6Groups(ip: string): string[] {
  const [head, tail] = ip.toLowerCase().split("::")
  const part = (s: string | undefined) => (s ? s.split(":") : [])
  // Una IPv4 incrustada al final ocupa dos grupos.
  const width = (g: string[]) => g.reduce((n, x) => n + (x.includes(".") ? 2 : 1), 0)
  const h = part(head)
  const t = part(tail)
  const zeros = tail === undefined ? [] : Array(Math.max(0, 8 - width(h) - width(t))).fill("0")
  return [...h, ...zeros, ...t].map((g) => (g.includes(".") ? g : parseInt(g, 16).toString(16)))
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
