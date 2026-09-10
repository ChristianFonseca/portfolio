"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { getSessionId } from "@/lib/client-session"

// Tracker ligero del sitio público (no corre en el admin ni con Do Not Track):
//  - pageview        al cargar y en cada navegación
//  - section {id,ms} tiempo con cada <section id> a la vista
//  - click  {x,y,…}  todos los clics (heatmap) + qué elemento (data-track / texto / href)
//  - scroll {depth}  profundidad máxima al salir
//  - leave  {ms}     tiempo en la página
// Se envía en lotes cada 15 s y al salir (sendBeacon). ~1–3 KB por visita.

type Prop = string | number | boolean
interface Ev {
  t: "pageview" | "section" | "click" | "scroll" | "leave"
  p: string
  l?: "en" | "es"
  d?: Record<string, Prop>
}

const FLUSH_MS = 15_000
const MAX_CLICKS_PER_PAGE = 60
const MIN_SECTION_MS = 500

function isTrackable(): boolean {
  if (typeof window === "undefined") return false
  if (window.location.hostname.startsWith("admin.")) return false
  if (window.location.pathname.startsWith("/admin")) return false
  if (navigator.doNotTrack === "1") return false
  // Global Privacy Control
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false
  return true
}

function describeTarget(target: EventTarget | null): Record<string, Prop> {
  const el = target instanceof Element ? target : null
  if (!el) return {}
  const hit = el.closest<HTMLElement>("[data-track],a,button,summary,input[type=submit],label")
  const d: Record<string, Prop> = {}
  const section = el.closest<HTMLElement>("section[id]")?.id
  if (section) d.sec = section
  if (!hit) {
    d.el = el.tagName.toLowerCase()
    return d
  }
  d.el = hit.tagName.toLowerCase()
  const track = hit.dataset.track
  if (track) d.tr = track.slice(0, 80)
  const label = (hit.getAttribute("aria-label") || hit.textContent || "").replace(/\s+/g, " ").trim()
  if (label) d.tx = label.slice(0, 60)
  if (hit instanceof HTMLAnchorElement && hit.href) {
    try {
      const u = new URL(hit.href)
      d.hr = (u.origin === location.origin ? u.pathname : u.hostname + u.pathname).slice(0, 120)
    } catch {
      /* ignore */
    }
  }
  return d
}

export function ActivityTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!isTrackable() || !pathname) return
    const path = pathname
    const locale: "en" | "es" = path === "/es" || path.startsWith("/es/") ? "es" : "en"
    const sid = getSessionId()
    const start = Date.now()
    const queue: Ev[] = []
    let clicks = 0
    let maxDepth = 0
    let ended = false

    const push = (ev: Omit<Ev, "p" | "l">) => {
      queue.push({ ...ev, p: path, l: locale })
      if (queue.length >= 50) flush(false)
    }

    const flush = (unloading: boolean) => {
      if (!queue.length) return
      const body = JSON.stringify({ sid, e: queue.splice(0, queue.length) })
      try {
        if (unloading && navigator.sendBeacon) {
          if (navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }))) return
        }
        void fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
          credentials: "omit",
        }).catch(() => {})
      } catch {
        /* nunca romper la página por analítica */
      }
    }

    const docHeight = () => Math.max(document.documentElement.scrollHeight, 1)
    const isDark = () => document.documentElement.classList.contains("dark")

    // pageview
    push({
      t: "pageview",
      d: {
        ref: document.referrer.slice(0, 300),
        vw: window.innerWidth,
        vh: window.innerHeight,
        ph: docHeight(),
        th: isDark() ? "dark" : "light",
        lg: (navigator.language || "").slice(0, 10),
        dpr: Math.round((window.devicePixelRatio || 1) * 10) / 10,
      },
    })

    // secciones visibles (tiempo acumulado)
    const enteredAt = new Map<string, number>()
    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"))
    const flushSection = (id: string) => {
      const t0 = enteredAt.get(id)
      if (t0 === undefined) return
      enteredAt.delete(id)
      const ms = Date.now() - t0
      if (ms >= MIN_SECTION_MS) push({ t: "section", d: { id, ms } })
    }
    const io =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              for (const en of entries) {
                const id = (en.target as HTMLElement).id
                if (en.isIntersecting) {
                  if (!enteredAt.has(id)) enteredAt.set(id, Date.now())
                } else flushSection(id)
              }
            },
            { threshold: 0.25 },
          )
        : null
    sections.forEach((s) => io?.observe(s))

    // scroll depth
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const depth = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / docHeight()) * 100))
        if (depth > maxDepth) maxDepth = depth
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()

    // clics (heatmap + destino)
    const onClick = (e: MouseEvent) => {
      if (clicks >= MAX_CLICKS_PER_PAGE) return
      clicks++
      push({
        t: "click",
        d: {
          x: Math.round((e.clientX / Math.max(window.innerWidth, 1)) * 1000),
          y: Math.round((e.pageY / docHeight()) * 1000),
          vw: window.innerWidth,
          ph: docHeight(),
          ...describeTarget(e.target),
        },
      })
    }
    document.addEventListener("click", onClick, true)

    // salida de página (cierre, pestaña oculta o navegación SPA)
    const end = (unloading: boolean) => {
      if (ended) return
      ended = true
      for (const id of Array.from(enteredAt.keys())) flushSection(id)
      push({ t: "scroll", d: { depth: maxDepth } })
      push({ t: "leave", d: { ms: Date.now() - start } })
      flush(unloading)
    }
    const onHide = () => {
      if (document.visibilityState === "hidden") end(true)
    }
    const onPageHide = () => end(true)
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", onPageHide)

    const timer = window.setInterval(() => flush(false), FLUSH_MS)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", onPageHide)
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("scroll", onScroll)
      io?.disconnect()
      end(false)
    }
  }, [pathname])

  return null
}
