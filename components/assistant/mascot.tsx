"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { MascotState } from "@/types/brain-mascot"

// La mascota, con UN SOLO escritor de estado.
//
// Por qué hace falta: en brain-mascot.js, attributeChangedCallback -> render()
// cancela el requestAnimationFrame, reescribe shadowRoot.innerHTML entero y vuelve a
// crear las dos <img>. Escribir el atributo en cada render de React convierte el
// widget en una máquina de parpadeos. Aquí hay una cola con:
//   · un suelo de MIN_HOLD ms entre escrituras,
//   · prioridades (un `error` no lo pisa un `success`),
//   · caducidad de los estados transitorios, para que ninguna pose se quede colgada.

const MIN_HOLD = 400

// Mayor gana. Un estado transitorio solo sustituye a otro de prioridad >= la suya.
const PRIORITY: Record<MascotState, number> = {
  error: 90,
  alert: 80,
  thinking: 70,
  loading: 70,
  success: 60,
  chat: 50,
  review: 40,
  listening: 30,
  confused: 35,
  hello: 20,
  idle: 10,
  sleep: 0,
}

export interface MascotHandle {
  /** Estado momentáneo que decae solo. `ttl` en ms. */
  flash: (state: MascotState, ttl?: number) => void
  /** Estado de reposo al que se vuelve (idle o sleep). */
  setBase: (state: MascotState) => void
  /** Congela o reanuda la animación (pestaña oculta, fuera de pantalla, modo calma). */
  setPaused: (paused: boolean) => void
}

export function useMascot() {
  const ref = useRef<HTMLElement | null>(null)
  const base = useRef<MascotState>("idle")
  const transient = useRef<{ state: MascotState; until: number } | null>(null)
  const written = useRef<MascotState | null>(null)
  const lastWrite = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commit = useCallback(() => {
    const el = ref.current
    if (!el) return
    const now = Date.now()
    if (transient.current && transient.current.until <= now) transient.current = null
    const want = transient.current ? transient.current.state : base.current

    if (want === written.current) {
      // nada que escribir, pero si hay un transitorio vivo hay que volver al caducar
      if (transient.current && !timer.current) {
        timer.current = setTimeout(() => {
          timer.current = null
          commit()
        }, Math.max(60, transient.current.until - now))
      }
      return
    }

    const wait = MIN_HOLD - (now - lastWrite.current)
    if (wait > 0) {
      if (!timer.current) {
        timer.current = setTimeout(() => {
          timer.current = null
          commit()
        }, wait)
      }
      return
    }

    el.setAttribute("state", want)
    written.current = want
    lastWrite.current = now

    if (transient.current && !timer.current) {
      timer.current = setTimeout(() => {
        timer.current = null
        commit()
      }, Math.max(60, transient.current.until - now))
    }
  }, [])

  const flash = useCallback(
    (state: MascotState, ttl = 1800) => {
      const now = Date.now()
      const live = transient.current && transient.current.until > now ? transient.current : null
      if (live && PRIORITY[live.state] > PRIORITY[state]) return // no pisar algo más importante
      transient.current = { state, until: now + ttl }
      commit()
    },
    [commit],
  )

  const setBase = useCallback(
    (state: MascotState) => {
      base.current = state
      commit()
    },
    [commit],
  )

  /**
   * Suelta el estado transitorio en curso. Necesario para los estados "en vuelo"
   * (thinking, loading): duran lo que dure la petición y tienen prioridad alta, así
   * que sin esto el desenlace (success) quedaría suprimido por el propio spinner.
   *
   * No escribe nada de inmediato a propósito: el commit se aplaza a un microtask
   * para que un flash() lanzado en el mismo tick gane. Si escribiera ya, gastaría
   * el turno en un `idle` intermedio y el suelo de MIN_HOLD se tragaría el
   * desenlace — además de meter un parpadeo feo entre thinking y success.
   */
  const release = useCallback(() => {
    transient.current = null
    queueMicrotask(commit)
  }, [commit])

  const setPaused = useCallback((paused: boolean) => {
    const el = ref.current
    if (!el) return
    if (paused) el.setAttribute("data-paused", "")
    else el.removeAttribute("data-paused")
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return { ref, flash, setBase, setPaused, release, commit }
}

/** True si el visitante pidió menos movimiento. Reactivo al cambio de preferencia. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const on = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return reduced
}

/**
 * Dibuja la mascota. En modo quieto (reduced-motion o calma) no monta el custom
 * element en absoluto: sirve el logo estático, que es una sola imagen de 43 KB y
 * cero animación. Así hay UNA sola versión tranquila que mantener.
 */
export function Mascot({
  size,
  still,
  elRef,
  className,
}: {
  size: number
  still: boolean
  /** Solo se usa cuando la mascota está animada; en modo quieto se ignora. */
  elRef?: React.MutableRefObject<HTMLElement | null>
  className?: string
}) {
  if (still) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/mascota/assets/mascot-logo.webp"
        alt=""
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: "auto", display: "block" }}
        draggable={false}
      />
    )
  }
  return (
    <brain-mascot
      ref={elRef as React.Ref<HTMLElement>}
      state="idle"
      assets="/mascota/assets/"
      aria-hidden="true"
      className={className}
      // width/height explícitos: evita el salto de layout antes de que el custom
      // element se registre (el script carga con lazyOnload).
      // fontSize: el componente dibuja sus globos (la z, el ?, el !) en em sobre un
      // font-size de 12px pensado para 76px. Un estilo en el propio elemento gana a
      // su :host, así los globos mantienen la proporción en los otros tamaños.
      style={{ width: size, height: size * (906 / 1020), display: "block", fontSize: (12 * size) / 76 }}
    />
  )
}
