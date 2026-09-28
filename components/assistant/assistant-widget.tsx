"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { usePathname } from "next/navigation"
import {
  ArrowLeft, Award, Check, Copy, Download, Github, GraduationCap, Linkedin, Mail,
  MessageCircle, RotateCcw, Send, Settings, X,
} from "lucide-react"
import { getSessionId } from "@/lib/client-session"
import { CONTACT_EMAIL, CV_FILENAME, CV_PATH, SOCIAL } from "@/lib/social"
import { CHAT_MESSAGE_MAX } from "@/lib/chat/limits"
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries"
import { Mascot, useMascot, usePrefersReducedMotion } from "./mascot"

// Widget del asistente: la mascota como lanzador flotante + panel con pestañas.
// Sustituye a la página /chat. Vive en el layout público (nunca en el admin).

const K_CORNER = "assistant.corner"
const K_CALM = "assistant.calm"
const K_SIZE = "assistant.size"
const K_TEXT = "assistant.text"
const IDLE_MS = 90_000

type Corner = "left" | "right"
type Size = "s" | "m" | "l"
const SIZES: Size[] = ["s", "m", "l"]
const isSize = (v: string | null): v is Size => v === "s" || v === "m" || v === "l"
type Tab = "chat" | "guide" | "contact"
interface Msg { role: "user" | "assistant"; content: string; stored?: boolean }

export interface AssistantData {
  name: string
  tagline: string
  location: string
  photo: string
  languages: { name: string; level: string }[]
  certs: { count: string; label: string }[]
  faq: { q: string; a: string }[]
}

const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* modo privado */ } }

const SOCIAL_ICON = { linkedin: Linkedin, github: Github, scholar: GraduationCap, credly: Award } as const

// Ancho del lanzador en px según la preferencia. En móvil el grande se contiene
// para no tapar media pantalla.
const LAUNCHER_PX: Record<Size, { desktop: number; mobile: number }> = {
  s: { desktop: 56, mobile: 56 },
  m: { desktop: 76, mobile: 76 },
  l: { desktop: 100, mobile: 88 },
}
const LAUNCHER_BOTTOM = 24 // bottom-6
const PANEL_GAP = 20 // entre el lanzador y el panel

// Escala de texto del panel. El mediano es el de siempre (13 / 11 / 10 px con la
// letra del navegador por defecto). Va en rem para que respete el tamaño de letra
// que el visitante tenga configurado en su navegador. Las clases van escritas
// enteras para que Tailwind las genere, y con el interlineado explícito porque un
// tamaño arbitrario no arrastra el leading que sí traen las clases con nombre.
//   body  → burbujas, campos, botones
//   small → pestañas, chips, titular, textos de entrada
//   micro → contador, pie, notas
const TEXT_SCALE: Record<Size, { body: string; small: string; micro: string }> = {
  s: {
    body: "text-[0.75rem] leading-[1.0625rem]",
    small: "text-[0.65625rem] leading-[0.875rem]",
    micro: "text-[0.625rem] leading-[0.8125rem]",
  },
  m: {
    body: "text-[0.8125rem] leading-[1.1875rem]",
    small: "text-[0.6875rem] leading-[0.9375rem]",
    micro: "text-[0.625rem] leading-[0.8125rem]",
  },
  l: {
    body: "text-[0.9375rem] leading-[1.375rem]",
    small: "text-[0.8125rem] leading-[1.0625rem]",
    micro: "text-[0.71875rem] leading-[0.9375rem]",
  },
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [query])
  return matches
}

export function AssistantWidget({
  dicts, dataByLocale,
}: { dicts: Record<Locale, Dictionary>; dataByLocale: Record<Locale, AssistantData> }) {
  const pathname = usePathname() || "/"
  // El locale se deriva de la ruta, no de un prop del servidor: /es y / comparten
  // el layout raíz, y Next no vuelve a renderizar los layouts por encima del
  // segmento que cambia. Con un prop, cambiar de idioma con el botón de la barra
  // dejaba el panel entero en el idioma anterior hasta recargar. Por eso el
  // servidor manda los dos idiomas ya resueltos y aquí se elige el de la ruta.
  const locale: Locale = pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en"
  const dict = dicts[locale]
  const data = dataByLocale[locale]
  const t = dict.assistant
  // En la landing el formulario de contacto ya existe: la pestaña solo lleva a él.
  // En el blog no hay ninguno, así que el panel monta uno de verdad.
  const onLanding = pathname === "/" || pathname === "/es"
  const homeHref = locale === "es" ? "/es" : "/"

  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("chat")
  const [corner, setCorner] = useState<Corner>("right")
  const [calm, setCalm] = useState(false)
  const [size, setSize] = useState<Size>("m")
  const [textSize, setTextSize] = useState<Size>("m")
  const [prefsOpen, setPrefsOpen] = useState(false)
  const reduced = usePrefersReducedMotion()
  const smallScreen = useMediaQuery("(max-width: 640px), (max-height: 500px)")
  // Pantalla baja (móvil en horizontal, ~390px): el panel va encima del lanzador y
  // apenas le queda alto, así que se recortan márgenes y el lanzador no pasa de 76px.
  const shortScreen = useMediaQuery("(max-height: 500px)")
  const TXT = TEXT_SCALE[textSize].body
  const TXT_S = TEXT_SCALE[textSize].small
  const TXT_XS = TEXT_SCALE[textSize].micro
  const launcherPx = Math.min(LAUNCHER_PX[size][smallScreen ? "mobile" : "desktop"], shortScreen ? 76 : Infinity)
  // En móvil el panel ocupa el ancho menos 2rem: con 16px por lado queda centrado.
  const sideGap = smallScreen ? 16 : 24
  const panelBottom = LAUNCHER_BOTTOM + launcherPx + (shortScreen ? 12 : PANEL_GAP)
  const panelTopMargin = shortScreen ? 12 : 56

  const { ref: mascotRef, flash, setBase, setPaused, release } = useMascot()
  const launcherRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const prefsButtonRef = useRef<HTMLButtonElement>(null)
  const prefsHeadingRef = useRef<HTMLHeadingElement>(null)
  // El manejador de teclado lee esto por ref: si prefsOpen estuviera en sus
  // dependencias, el efecto se reiniciaría y su autoenfoque del campo del chat le
  // quitaría el foco al engranaje al salir de Preferencias.
  const prefsOpenRef = useRef(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: dict.chat.greeting }])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ kind: "alert" | "error" | "sleep"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const still = reduced || calm

  useEffect(() => {
    setMounted(true)
    const c = read(K_CORNER)
    if (c === "left" || c === "right") setCorner(c)
    setCalm(read(K_CALM) === "1")
    const s = read(K_SIZE)
    if (isSize(s)) setSize(s)
    const ts = read(K_TEXT)
    if (isSize(ts)) setTextSize(ts)
  }, [])

  // saludo una vez por sesión
  useEffect(() => {
    if (!mounted || still) return
    try {
      if (sessionStorage.getItem("assistant.greeted")) return
      sessionStorage.setItem("assistant.greeted", "1")
    } catch { return }
    const id = setTimeout(() => flash("hello", 2400), 1200)
    return () => clearTimeout(id)
  }, [mounted, still, flash])

  // inactividad -> sleep
  useEffect(() => {
    if (!mounted || still) return
    let timer: ReturnType<typeof setTimeout>
    const wake = () => {
      setBase("idle")
      clearTimeout(timer)
      timer = setTimeout(() => { if (!open) setBase("sleep") }, IDLE_MS)
    }
    const evs: (keyof WindowEventMap)[] = ["pointermove", "keydown", "scroll", "pointerdown"]
    evs.forEach((e) => addEventListener(e, wake, { passive: true }))
    wake()
    return () => { clearTimeout(timer); evs.forEach((e) => removeEventListener(e, wake)) }
  }, [mounted, still, open, setBase])

  // pausar el bucle: pestaña oculta o lanzador fuera de pantalla
  useEffect(() => {
    if (!mounted || still) return
    const onVis = () => setPaused(document.visibilityState === "hidden")
    document.addEventListener("visibilitychange", onVis)
    onVis()
    const el = launcherRef.current
    let io: IntersectionObserver | null = null
    if (el && "IntersectionObserver" in window) {
      io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting || document.visibilityState === "hidden"))
      io.observe(el)
    }
    return () => { document.removeEventListener("visibilitychange", onVis); io?.disconnect() }
  }, [mounted, still, setPaused])

  const close = useCallback(() => {
    setOpen(false)
    setPrefsOpen(false)
    setBase("idle")
    launcherRef.current?.focus()
  }, [setBase])

  // Cerrar sin tocar el foco. Al pulsar fuera el usuario ya eligió a dónde ir:
  // devolverle el foco al lanzador se lo robaría a lo que acaba de pulsar.
  const dismiss = useCallback(() => {
    setOpen(false)
    setPrefsOpen(false)
    setBase("idle")
  }, [setBase])

  const trapFocus = useCallback((e: KeyboardEvent) => {
    const root = panelRef.current
    if (!root) return
    // Los radios no marcados no reciben foco con Tab (el grupo entero es una sola
    // parada), así que no pueden ser ni el primero ni el último de la trampa.
    const f = [...root.querySelectorAll<HTMLElement>('button,textarea,input,a[href],[tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.hasAttribute("disabled") && !el.closest("fieldset:disabled"))
      .filter((el) => !(el instanceof HTMLInputElement && el.type === "radio" && !el.checked))
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        // Dentro de Preferencias, Escape vuelve al chat en vez de cerrar todo el panel.
        if (prefsOpenRef.current) { setPrefsOpen(false); prefsButtonRef.current?.focus() }
        else close()
      }
      if (e.key === "Tab") trapFocus(e)
    }
    document.addEventListener("keydown", onKey, true)
    const id = setTimeout(() => { if (tab === "chat") inputRef.current?.focus() }, 60)
    return () => { document.removeEventListener("keydown", onKey, true); clearTimeout(id) }
  }, [open, tab, close, trapFocus])

  // Al abrir Preferencias el foco va a su título, para que el lector de pantalla
  // anuncie dónde está en vez de quedarse en el botón.
  useEffect(() => {
    prefsOpenRef.current = prefsOpen
    if (prefsOpen) prefsHeadingRef.current?.focus()
  }, [prefsOpen])

  // Pulsar fuera cierra el panel.
  //
  // Se mira el par pointerdown/pointerup y no el click: si cualquiera de los dos
  // cae dentro del widget no se cierra, así arrastrar para seleccionar texto del
  // panel y soltar fuera (o al revés) no lo hace desaparecer. Además el DOM puede
  // cambiar entre pulsar y soltar — un chip de FAQ desaparece al pulsarlo — y para
  // entonces closest() sobre un nodo ya desprendido no encuentra nada.
  //
  // composedPath() en vez de event.target porque la mascota es un custom element
  // con shadow DOM: el evento se retargetea al host, pero el path lo atraviesa.
  // El lanzador también lleva data-assistant, así que pulsarlo sigue siendo su
  // propio toggle en vez de cerrar y reabrir.
  useEffect(() => {
    if (!open) return
    const inside = (e: Event) =>
      e.composedPath().some((n) => n instanceof Element && n.hasAttribute("data-assistant"))
    // La barra de scroll de la página cae fuera de clientWidth/clientHeight;
    // arrastrarla no es "pulsar fuera".
    const onScrollbar = (e: PointerEvent) => {
      const d = document.documentElement
      return e.clientX > d.clientWidth || e.clientY > d.clientHeight
    }
    let downOutside = false
    // Se anota en pointerdown, no en pointerup: el navegador mueve el foco en el
    // mousedown intermedio, así que para cuando se suelta el botón ya se perdió
    // el dato de si estaba dentro del panel.
    let downFocusInside = false
    const onDown = (e: PointerEvent) => {
      downOutside = !inside(e) && !onScrollbar(e)
      downFocusInside = !!panelRef.current?.contains(document.activeElement)
    }
    const onUp = (e: PointerEvent) => {
      const out = downOutside && !inside(e) && !onScrollbar(e)
      const hadFocus = downFocusInside
      downOutside = false
      downFocusInside = false
      if (!out) return
      dismiss()
      // Si el clic cayó en algo que no toma el foco y el foco estaba dentro del
      // panel, al desmontarse se queda en <body> y el teclado pierde el sitio.
      // Solo entonces vuelve al lanzador; nunca se lo quita a quien sí lo tomó.
      if (hadFocus) {
        requestAnimationFrame(() => {
          if (!document.activeElement || document.activeElement === document.body) {
            launcherRef.current?.focus({ preventScroll: true })
          }
        })
      }
    }
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("pointerup", onUp, true)
    return () => {
      document.removeEventListener("pointerdown", onDown, true)
      document.removeEventListener("pointerup", onUp, true)
    }
  }, [open, dismiss])

  // El resto del panel se reidioma solo al cambiar `dict`, pero estos dos no:
  // el saludo entró en `messages` en el primer render y el aviso guarda texto ya
  // resuelto. El saludo se cambia solo si no hay conversación todavía — si la
  // hay, el hilo se queda en el idioma en que se escribió. El aviso se descarta,
  // que es mejor que enseñarlo en el idioma anterior.
  const greeting = dict.chat.greeting
  useEffect(() => {
    setMessages((m) => (m.length === 1 && m[0].role === "assistant" && !m[0].stored && m[0].content !== greeting
      ? [{ role: "assistant", content: greeting }]
      : m))
    setNotice(null)
  }, [greeting])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, busy])

  // El registro se vuelve a montar al salir de Preferencias o cambiar de pestaña, y
  // arrancaría arriba del todo: se lleva abajo sin animación.
  useEffect(() => {
    if (open && !prefsOpen) logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [open, prefsOpen, tab])

  // Cualquier parte del sitio puede abrir el asistente disparando este evento.
  // Lo usa el botón "Ask Syn" del hero, que antes navegaba a /chat.
  useEffect(() => {
    const onOpen = () => { setOpen(true); setPrefsOpen(false); setTab("chat"); flash("chat", 1600) }
    window.addEventListener("assistant:open", onOpen)
    return () => window.removeEventListener("assistant:open", onOpen)
  }, [flash])

  const toggle = () => {
    if (open) return close()
    setOpen(true)
    flash("chat", 1600)
  }
  const choose = {
    size: (v: Size) => { setSize(v); write(K_SIZE, v); flash("hello", 1400) },
    text: (v: Size) => { setTextSize(v); write(K_TEXT, v) },
    calm: (v: boolean) => { setCalm(v); write(K_CALM, v ? "1" : "0") },
    corner: (v: Corner) => { setCorner(v); write(K_CORNER, v); flash("success", 900) },
  }
  const closePrefs = () => { setPrefsOpen(false); prefsButtonRef.current?.focus() }
  // Vuelve al saludo y a las preguntas sugeridas. La cuota del servidor no cambia.
  const newConversation = () => {
    setMessages([{ role: "assistant", content: dict.chat.greeting }])
    setNotice(null)
    flash("hello", 1200)
    inputRef.current?.focus()
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setCopied(true); flash("success", 1200)
      setTimeout(() => setCopied(false), 2000)
    } catch { flash("confused", 1600) }
  }

  // ── chat ──
  async function send(text: string) {
    const q = text.trim()
    if (!q || busy) return
    if (q.length > CHAT_MESSAGE_MAX) { flash("confused", 2200); setNotice({ kind: "error", text: t.tooLong }); return }
    setNotice(null)
    setMessages((m) => [...m, { role: "user", content: q }])
    setInput(""); setBusy(true)
    flash("review", 900)
    const toThinking = setTimeout(() => flash("thinking", 20_000), 850)
    try {
      // Las respuestas guardadas (FAQ) no van al historial: no las escribió el modelo.
      const history = messages
        .filter((m) => !m.stored)
        .slice(1).slice(-9)
        .map((m) => ({ role: m.role === "user" ? "user" : "model", content: m.content }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": getSessionId() },
        body: JSON.stringify({ message: q, history, locale }),
      })
      const payload = await res.json().catch(() => ({}))
      clearTimeout(toThinking)
      release() // suelta `thinking` para que el desenlace se vea
      // Un 429 con JSON es el límite diario de la app. Sin JSON es la regla de Cloudflare,
      // que bloquea unos segundos: decir "límite de hoy" ahí sería mentir.
      if (res.status === 429) { flash("alert", 3000); setNotice({ kind: "alert", text: payload.error || t.tooFast }); return }
      if (res.status === 503) { setBase("sleep"); flash("sleep", 3000); setNotice({ kind: "sleep", text: t.offline }); return }
      if (!res.ok || !payload.answer) { flash("error", 2600); setNotice({ kind: "error", text: dict.chat.unavailable }); return }
      // Si Google bloqueó la respuesta llega una negativa normal: la mascota pone cara de duda.
      flash(payload.blocked ? "confused" : "success", 1400)
      setMessages((m) => [...m, { role: "assistant", content: payload.answer }])
      if (typeof payload.remaining === "number" && payload.remaining >= 0) setRemaining(payload.remaining)
    } catch {
      clearTimeout(toThinking); release(); flash("error", 2600)
      setNotice({ kind: "error", text: dict.chat.connectionError })
    } finally { setBusy(false) }
  }

  /** Chip de FAQ: responde con el texto guardado. Sin red, sin modelo, sin gastar cuota. */
  function answerStored(f: { q: string; a: string }) {
    setNotice(null)
    setMessages((m) => [...m, { role: "user", content: f.q }, { role: "assistant", content: f.a, stored: true }])
    flash("chat", 1600)
  }

  // ── contacto (solo donde no hay formulario: blog y demás) ──
  async function sendContact(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    setSending(true); setNotice(null); flash("loading", 8000)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": getSessionId() },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          // El asunto lleva la página: la bandeja dice qué contenido generó el contacto.
          subject: `${t.fromAssistant} — ${pathname}`,
          message: form.message,
        }),
      })
      release()
      if (!res.ok) { flash("error", 2600); setNotice({ kind: "error", text: dict.contact.sendError }); return }
      flash("success", 2000); setSent(true); setForm({ name: "", email: "", message: "" })
    } catch {
      release(); flash("error", 2600); setNotice({ kind: "error", text: dict.contact.sendError })
    } finally { setSending(false) }
  }

  function jump(hash: string) {
    flash("loading", 900)
    if (onLanding) {
      const el = document.getElementById(hash)
      if (el) {
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 108, behavior: "smooth" })
        close()
        return
      }
    }
    window.location.href = `${homeHref}#${hash}`
  }

  if (!mounted) return null

  const side = corner === "right" ? { right: sideGap } : { left: sideGap }
  const JUMPS = [
    { hash: "research-projects", label: t.jumpResearch },
    { hash: "teaching", label: t.jumpTeaching },
    { hash: "faq", label: t.jumpFaq },
  ]
  const chipCls =
    `inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 ${TXT_S} text-muted-foreground transition-colors hover:border-primary hover:text-foreground`
  const fieldCls =
    `w-full rounded-xl border border-border bg-background/60 px-3 py-2 ${TXT} outline-none focus:border-primary`

  const sizeOptions = SIZES.map((v) => ({ value: v, label: t[`size_${v}`] }))
  const prefsView = (
    <div id="syn-prefs" className="flex-1 space-y-4 overflow-y-auto p-3.5">
      <div className="flex items-center gap-2">
        <button type="button" onClick={closePrefs} aria-label={t.prefsBack} title={t.prefsBack}
          data-track="mascot:prefs-back"
          className="-ml-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 ref={prefsHeadingRef} tabIndex={-1} className={`${TXT} font-semibold outline-none`}>{t.prefs}</h2>
      </div>

      <Choice name="syn-size" legend={t.prefSize} small={TXT_S} value={size} options={sizeOptions} onChange={choose.size} />
      <Choice name="syn-text" legend={t.prefText} small={TXT_S} value={textSize} options={sizeOptions} onChange={choose.text} />
      <Choice
        name="syn-motion" legend={t.prefMotion} small={TXT_S}
        value={still ? "still" : "animated"}
        options={[{ value: "animated", label: t.motionOn }, { value: "still", label: t.motionOff }]}
        onChange={(v) => choose.calm(v === "still")}
        disabled={reduced}
        note={reduced ? t.motionReduced : undefined}
      />
      <Choice
        name="syn-corner" legend={t.prefCorner} small={TXT_S} value={corner}
        options={[{ value: "left", label: t.cornerLeft }, { value: "right", label: t.cornerRight }]}
        onChange={choose.corner}
      />

    </div>
  )

  const launcher = (
    <div data-assistant="" className="fixed bottom-6 z-[70] print:hidden" style={side}>
      <button
        ref={launcherRef} type="button" onClick={toggle}
        aria-haspopup="dialog" aria-expanded={open} aria-label={open ? t.close : t.open}
        data-track="mascot:launcher"
        className="block rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        style={{ filter: "drop-shadow(0 10px 30px rgba(168,85,247,.35))" }}
      >
        <Mascot size={launcherPx} still={still} elRef={mascotRef} />
      </button>
    </div>
  )

  const panel = open && (
    <div
      ref={panelRef} data-assistant="" role="dialog" aria-modal="false" aria-label={dict.chat.title}
      className="fixed z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl print:hidden"
      style={{
        ...side,
        bottom: panelBottom,
        // dvh: en móvil no cuenta la barra de direcciones que aparece y desaparece.
        maxHeight: `min(36rem, calc(100dvh - ${panelBottom + panelTopMargin}px))`,
      }}
    >
      {/* Quién es y cómo llegar a él. En el blog esto no existía en ninguna parte. */}
      <header className="border-b border-border bg-card/80 px-3.5 py-3">
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.photo} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className={`truncate ${TXT} font-semibold`}>{data.name || dict.chat.title}</p>
            <p className={`truncate ${TXT_S} text-muted-foreground`}>{data.tagline}</p>
            {data.location && <p className={`truncate ${TXT_S} text-muted-foreground/70`}>{data.location}</p>}
          </div>
          <button
            ref={prefsButtonRef} type="button" onClick={() => setPrefsOpen((v) => !v)}
            aria-expanded={prefsOpen} aria-controls="syn-prefs" aria-label={t.prefs}
            title={t.prefs} data-track="mascot:prefs"
            className={`rounded-lg p-1.5 transition-colors hover:bg-muted hover:text-foreground ${
              prefsOpen ? "bg-primary/15 text-primary" : "text-muted-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button" onClick={close} aria-label={t.close} data-track="mascot:close"
            className="-mr-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Los chips y la línea de idiomas se ocultan en pantallas bajas y en Preferencias:
            ahí el espacio vertical es para el contenido. */}
        <div className={`mt-2.5 flex-wrap gap-1.5 [@media(max-height:560px)]:hidden ${prefsOpen ? "hidden" : "flex"}`}>
          <a href={CV_PATH} download={CV_FILENAME} data-track="mascot:cv" className={chipCls}>
            <Download className="h-3 w-3" /> {dict.hero.downloadCV}
          </a>
          <button type="button" onClick={copyEmail} data-track="mascot:copy-email" className={chipCls}>
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? t.copied : t.copyEmail}
          </button>
          {SOCIAL.map((s) => {
            const Icon = SOCIAL_ICON[s.id]
            return (
              <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer"
                aria-label={s.label} title={s.label} data-track={`mascot:social:${s.id}`}
                className={`${chipCls} px-2.5`}>
                <Icon className="h-3.5 w-3.5" />
              </a>
            )
          })}
        </div>
        {(data.languages.length > 0 || data.certs.length > 0) && (
          <p className={`mt-2 truncate ${TXT_S} text-muted-foreground/70 [@media(max-height:560px)]:hidden ${prefsOpen ? "hidden" : ""}`}>
            {[
              ...data.languages.map((l) => `${l.name} ${l.level}`),
              ...data.certs.map((c) => `${c.count ? c.count + " " : ""}${c.label}`),
            ].join(" · ")}
          </p>
        )}
      </header>

      {prefsOpen ? prefsView : (<>
      <nav className="flex gap-1 border-b border-border px-2 py-1.5" aria-label={dict.chat.title}>
        {([["chat", t.tabChat], ["guide", t.tabGuide], ["contact", t.tabContact]] as [Tab, string][]).map(([k, label]) => (
          <button
            key={k} type="button" onClick={() => setTab(k)} aria-current={tab === k}
            data-track={`mascot:tab:${k}`}
            className={`rounded-lg px-2.5 py-1.5 ${TXT_S} font-semibold transition-colors ${
              tab === k ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto flex min-w-0 items-center gap-1">
          {remaining !== null && tab === "chat" && (
            <span className={`truncate whitespace-nowrap pr-1 ${TXT_XS} text-muted-foreground/60`}>
              {remaining} {remaining === 1 ? dict.chat.questionsLeftOne : dict.chat.questionsLeftMany}
            </span>
          )}
          {tab === "chat" && messages.length > 1 && (
            <button type="button" onClick={newConversation} disabled={busy} aria-label={t.newChat} title={t.newChat}
              data-track="mascot:new-chat"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      </nav>

      <div ref={logRef} className="flex-1 overflow-y-auto p-3.5">
        {tab === "chat" && (
          <div className="space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={m.role === "user"
                  ? `max-w-[86%] rounded-2xl rounded-br-md border border-primary/35 bg-primary/15 px-3 py-2 ${TXT}`
                  : `max-w-[86%] rounded-2xl rounded-bl-md border border-border bg-muted/40 px-3 py-2 ${TXT}`}>
                  {m.content}
                  {m.stored && <span className={`mt-1.5 block ${TXT_XS} text-muted-foreground/70`}>{t.storedAnswer}</span>}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex w-fit gap-1 rounded-2xl rounded-bl-md border border-border bg-muted/40 px-3 py-2.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60"
                    style={{ animation: `assistantDot 1s ${i * 0.15}s infinite ease-in-out` }} />
                ))}
              </div>
            )}
            {/* Preguntas suyas, respondidas con su propio texto: instantáneo y sin cuota. */}
            {messages.length <= 1 && data.faq.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {data.faq.map((f, i) => (
                  <button key={i} type="button" onClick={() => answerStored(f)} data-track={`mascot:faq:${i}`}
                    className={`block w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-left ${TXT_S} text-muted-foreground transition-colors hover:border-primary hover:text-foreground`}>
                    {f.q}
                  </button>
                ))}
              </div>
            )}
            {notice && <Notice notice={notice} small={TXT_S} />}
          </div>
        )}

        {tab === "guide" && (
          <div className="space-y-2">
            <p className={`${TXT_S} text-muted-foreground`}>{t.guideLead}</p>
            {JUMPS.map((j) => (
              <button key={j.hash} type="button" onClick={() => jump(j.hash)} data-track={`mascot:jump:${j.hash}`}
                className={`flex w-full items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-left ${TXT} transition-colors hover:border-primary`}>
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                {j.label}
              </button>
            ))}
          </div>
        )}

        {tab === "contact" && (onLanding ? (
          <div className="space-y-3">
            <p className={`${TXT_S} text-muted-foreground`}>{t.contactOnPage}</p>
            <button type="button" onClick={() => jump("contact")} data-track="mascot:jump:contact"
              className={`w-full rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2.5 ${TXT} font-semibold text-white`}>
              {dict.nav.contact}
            </button>
            <a href={`mailto:${CONTACT_EMAIL}`} data-track="mascot:mailto"
              className={`flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 ${TXT} transition-colors hover:border-primary`}>
              <Mail className="h-4 w-4" /> {dict.contact.directEmail}
            </a>
          </div>
        ) : sent ? (
          <div className="space-y-2 py-6 text-center">
            <Check className="mx-auto h-8 w-8 text-emerald-500" />
            <p className={`${TXT} font-semibold`}>{t.sentTitle}</p>
            <p className={`${TXT_S} text-muted-foreground`}>{t.sentBody}</p>
          </div>
        ) : (
          <form className="space-y-2.5" onSubmit={sendContact}>
            <p className={`${TXT_S} text-muted-foreground`}>{t.contactLead}</p>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => flash("listening", 1400)} maxLength={200}
              placeholder={dict.contact.namePlaceholder} aria-label={dict.contact.name} className={fieldCls} />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={320} placeholder={dict.contact.emailPlaceholder} aria-label={dict.contact.email} className={fieldCls} />
            <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              onFocus={() => flash("review", 1600)} maxLength={5000}
              placeholder={dict.contact.messagePlaceholder} aria-label={dict.contact.message}
              className={`${fieldCls} resize-none`} />
            <button type="submit" disabled={sending} data-track="mascot:contact-send"
              className={`w-full rounded-xl bg-gradient-to-r from-primary to-accent px-3 py-2.5 ${TXT} font-semibold text-white disabled:opacity-50`}>
              {sending ? dict.contact.sending : dict.contact.send}
            </button>
            {notice && <Notice notice={notice} small={TXT_S} />}
          </form>
        ))}
      </div>

      {tab === "chat" && (
        <form className="flex items-end gap-2 border-t border-border p-2.5"
          onSubmit={(e) => { e.preventDefault(); void send(input) }}>
          <textarea
            ref={inputRef} rows={1} value={input} maxLength={CHAT_MESSAGE_MAX}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => { if (!input) flash("listening", 1500) }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input) } }}
            placeholder={dict.chat.placeholder} aria-label={dict.chat.placeholder}
            className={`max-h-24 flex-1 resize-none rounded-xl border border-border bg-background/60 px-3 py-2 ${TXT} outline-none focus:border-primary`}
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label={t.send} data-track="mascot:send"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-r from-primary to-accent text-white disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </form>
      )}
      </>)}

      {/* Calma y esquina pasaron a Preferencias; aquí queda solo el aviso. */}
      <footer className={`border-t border-border px-3.5 py-1.5 ${TXT_XS} text-muted-foreground`}>
        {t.grounded}
      </footer>
    </div>
  )

  return createPortal(
    <>
      {launcher}
      {panel}
      <style>{`@keyframes assistantDot{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}`}</style>
    </>,
    document.body,
  )
}

function Notice({ notice, small }: { notice: { kind: "alert" | "error" | "sleep"; text: string }; small: string }) {
  return (
    <p role="status"
      className={`rounded-xl border px-3 py-2 ${small} ${
        notice.kind === "alert"
          ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-600 dark:text-yellow-300"
          : notice.kind === "sleep"
            ? "border-border bg-muted/40 text-muted-foreground"
            : "border-red-500/40 bg-red-500/10 text-red-500 dark:text-red-300"
      }`}>
      {notice.text}
    </p>
  )
}

/**
 * Grupo de opciones con radios nativos: las flechas del teclado, el foco y el anuncio
 * del lector de pantalla funcionan solos. El radio va oculto a la vista y la etiqueta
 * hace de botón (mínimo 32 px de alto, por encima de los 24 que pide WCAG 2.2).
 *
 * - `relative` en la etiqueta: el radio oculto es absolute y sin esto se posicionaba
 *   contra el panel, fuera de la zona con scroll. Al enfocarlo el panel entero se
 *   desplazaba y la opción quedaba tapada.
 * - La opción elegida lleva borde y ✓, no solo color (WCAG 1.4.1 y 1.4.11).
 * - Bloqueado (el sistema pide reducir el movimiento): en vez de radios atenuados, una
 *   frase con el valor y el motivo, a contraste completo.
 */
function Choice<T extends string>({
  name, legend, value, options, onChange, small, disabled, note,
}: {
  name: string
  legend: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  small: string
  disabled?: boolean
  note?: string
}) {
  if (disabled) {
    const current = options.find((o) => o.value === value)?.label ?? ""
    return (
      <div role="group" aria-label={legend}>
        <p className={`mb-1.5 ${small} font-semibold text-foreground`}>{legend}</p>
        <p className={`rounded-xl border border-border bg-muted/30 px-3 py-2 ${small} text-muted-foreground`}>
          <b className="text-foreground">{current}</b>{note ? ` · ${note}` : ""}
        </p>
      </div>
    )
  }
  return (
    <fieldset>
      <legend className={`mb-1.5 ${small} font-semibold text-foreground`}>{legend}</legend>
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {options.map((o) => {
          const checked = value === o.value
          return (
            <label key={o.value}
              className={`relative flex min-h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border px-2 text-center ${small} transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
                checked
                  ? "border-primary bg-primary/20 font-semibold text-primary"
                  : "border-transparent font-medium text-muted-foreground hover:text-foreground"
              }`}>
              <input type="radio" name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)}
                data-track={`mascot:pref:${name}:${o.value}`} className="sr-only" />
              {checked && <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
              {o.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
