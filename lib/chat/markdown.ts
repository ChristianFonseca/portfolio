// Markdown mínimo para las respuestas de Syn. Convierte el texto del modelo en una
// estructura (párrafos, listas, negrita, cursiva, código y enlaces) que el widget pinta
// con elementos de React. Nunca produce HTML: lo que no reconoce se queda como texto,
// así que un "<img onerror=…>" o un enlace "javascript:" que alguien consiga colar en la
// respuesta se ve tal cual y no se ejecuta. Módulo puro, sin dependencias, para poder
// probarlo aparte (video/tools/test/markdown.unit.mjs).

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; kind: LinkKind; c: Inline[] }
  | { t: "br" }

export type Block =
  | { t: "p"; c: Inline[] }
  | { t: "ul"; items: Inline[][] }
  | { t: "ol"; start: number; items: Inline[][] }

// internal → página del sitio (navega sin recargar) · file → archivo del sitio, como el
// CV en PDF (otra pestaña: no es una página y recargaría perdiendo la conversación)
export type LinkKind = "internal" | "file" | "external" | "mail"

const SITE_HOSTS = new Set(["christianfonseca.dev", "www.christianfonseca.dev"])
const siteLink = (path: string): { href: string; kind: LinkKind } => ({
  href: path || "/",
  kind: /\.[a-z0-9]{2,5}$/i.test(path.split(/[?#]/)[0]) ? "file" : "internal",
})

/** Enlace seguro o null. Solo http(s), mailto y rutas del propio sitio. */
export function safeHref(raw: string): { href: string; kind: LinkKind } | null {
  const s = raw.trim()
  if (/^\/(?!\/)/.test(s)) return siteLink(s)
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(s)) return { href: s, kind: "mail" }
  let url: URL
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null
  if (SITE_HOSTS.has(url.hostname)) return siteLink(`${url.pathname}${url.search}${url.hash}`)
  return { href: url.href, kind: "external" }
}

// Una sola expresión con alternativas; en cada posición gana la primera que encaja.
// Grupos: 1 código · 2-3 enlace [texto](url) · 4 URL suelta · 5 correo · 6-7 negrita · 8-9 cursiva
const INLINE = new RegExp(
  [
    "`([^`\\n]+)`",
    "\\[([^\\]\\n]+)\\]\\(([^)\\s]+)\\)",
    "(https?:\\/\\/[^\\s<>]+|(?<![\\w@.\\/-])(?:www\\.)?christianfonseca\\.dev(?:\\/[^\\s<>]*)?)",
    "([\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+)",
    "\\*\\*(?=\\S)([^\\n]+?)(?<=\\S)\\*\\*",
    "__(?=\\S)([^\\n]+?)(?<=\\S)__",
    "\\*(?=[^\\s*])([^*\\n]+?)(?<=[^\\s*])\\*",
    "(?<![\\w])_(?=\\S)([^_\\n]+?)(?<=\\S)_(?![\\w])",
  ].join("|"),
  "g",
)

// Puntuación que suele ir pegada al final de una URL pero no forma parte de ella.
function trimUrl(u: string): [string, string] {
  let url = u
  let tail = ""
  for (;;) {
    const last = url.slice(-1)
    const unbalancedParen = last === ")" && (url.match(/\(/g)?.length ?? 0) < (url.match(/\)/g)?.length ?? 0)
    if (/[.,;:!?'"»”]/.test(last) || unbalancedParen) {
      tail = last + tail
      url = url.slice(0, -1)
    } else break
  }
  return [url, tail]
}

export function parseInline(src: string, depth = 0): Inline[] {
  const out: Inline[] = []
  const text = (v: string) => {
    if (!v) return
    const prev = out[out.length - 1]
    if (prev?.t === "text") prev.v += v
    else out.push({ t: "text", v })
  }
  const re = new RegExp(INLINE.source, "g")
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    text(src.slice(last, m.index))
    last = m.index + m[0].length
    const inner = (s: string) => (depth < 4 ? parseInline(s, depth + 1) : [{ t: "text" as const, v: s }])
    if (m[1] !== undefined) out.push({ t: "code", v: m[1] })
    else if (m[2] !== undefined) {
      const link = safeHref(m[3])
      if (link) out.push({ t: "link", ...link, c: inner(m[2]) })
      else text(m[2]) // enlace no permitido (javascript:, data:…): solo el texto
    } else if (m[4] !== undefined) {
      const [url, tail] = trimUrl(m[4])
      const link = safeHref(url)
      if (link) out.push({ t: "link", ...link, c: [{ t: "text", v: url.replace(/^https?:\/\//i, "") }] })
      else text(url)
      text(tail)
    } else if (m[5] !== undefined) out.push({ t: "link", href: `mailto:${m[5]}`, kind: "mail", c: [{ t: "text", v: m[5] }] })
    else if (m[6] !== undefined || m[7] !== undefined) out.push({ t: "strong", c: inner(m[6] ?? m[7]) })
    else out.push({ t: "em", c: inner(m[8] ?? m[9]) })
  }
  text(src.slice(last))
  return out
}

const UL = /^\s*[-*•+]\s+(.*)$/
const OL = /^\s*(\d{1,3})[.)]\s+(.*)$/
const HEADING = /^\s{0,3}#{1,6}\s+(.*?)\s*#*\s*$/
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = []
  let para: string[] = []
  let list: { t: "ul" | "ol"; start: number; items: string[] } | null = null

  const flushPara = () => {
    if (!para.length) return
    const c: Inline[] = []
    para.forEach((line, i) => {
      if (i) c.push({ t: "br" })
      c.push(...parseInline(line))
    })
    blocks.push({ t: "p", c })
    para = []
  }
  const flushList = () => {
    if (!list) return
    const items = list.items.map((s) => parseInline(s))
    blocks.push(list.t === "ul" ? { t: "ul", items } : { t: "ol", start: list.start, items })
    list = null
  }

  for (const raw of src.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.replace(/\s+$/, "")
    if (!line.trim() || RULE.test(line)) {
      flushPara()
      flushList()
      continue
    }
    const h = HEADING.exec(line)
    if (h) {
      // Sin títulos en una burbuja de chat: el título pasa a ser un párrafo en negrita.
      flushPara()
      flushList()
      blocks.push({ t: "p", c: [{ t: "strong", c: parseInline(h[1]) }] })
      continue
    }
    const ul = UL.exec(line)
    const ol = ul ? null : OL.exec(line)
    if (ul || ol) {
      flushPara()
      const kind = ul ? "ul" : "ol"
      if (!list || list.t !== kind) {
        flushList()
        list = { t: kind, start: ol ? Number(ol[1]) : 1, items: [] }
      }
      list.items.push(ul ? ul[1] : ol![2])
      continue
    }
    if (list && /^\s+\S/.test(raw)) {
      // Línea con sangría dentro de una lista: sigue el elemento anterior.
      list.items[list.items.length - 1] += ` ${line.trim()}`
      continue
    }
    flushList()
    para.push(line.trim())
  }
  flushPara()
  flushList()
  return blocks
}
