"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Carrusel simple: scroll horizontal con snap (swipe / trackpad / arrastre táctil).
// Flechas para desktop y puntos que reflejan la foto activa.
export function ProjectCarousel({ images, title }: { images: string[]; title: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const count = images.length

  const onScroll = () => {
    const el = ref.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  const scrollTo = (i: number) => {
    const el = ref.current
    if (!el) return
    const clamped = Math.max(0, Math.min(count - 1, i))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" })
  }

  if (count === 0) return null

  return (
    <div className="group relative">
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex aspect-[16/9] w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-black/40 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${title} — ${i + 1}`}
            draggable={false}
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollTo(active - 1)}
            disabled={active === 0}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white/90 backdrop-blur-sm transition-opacity hover:bg-black/70 disabled:opacity-0 sm:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => scrollTo(active + 1)}
            disabled={active === count - 1}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white/90 backdrop-blur-sm transition-opacity hover:bg-black/70 disabled:opacity-0 sm:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir a la foto ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
