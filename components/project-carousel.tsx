"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Carrusel de screenshots del proyecto: autoplay (pausa al pasar el mouse y
// respeta prefers-reduced-motion) + flechas + puntos.
export function ProjectCarousel({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = images.length
  const reduceMotion = useRef(false)

  useEffect(() => {
    reduceMotion.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  useEffect(() => {
    setIndex(0)
  }, [images])

  useEffect(() => {
    if (count <= 1 || paused || reduceMotion.current) return
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 4000)
    return () => clearInterval(t)
  }, [count, paused])

  if (count === 0) return null

  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count)

  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-black/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Pista deslizante */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${title} — ${i + 1}`}
            className="h-full w-full shrink-0 object-cover"
          />
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la foto ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
