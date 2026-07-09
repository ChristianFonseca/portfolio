"use client"

import { ChevronLeft, ChevronRight, X, ImageIcon } from "lucide-react"
import { UploadButton } from "@/components/admin/upload-button"

// Campo de galería: varias imágenes por ítem (carrusel del proyecto). Cada foto
// se sube recortada al aspect dado y se re-encoda a WebP. Se pueden reordenar y quitar.
export function GalleryField({
  value,
  onChange,
  aspect = 16 / 9,
}: {
  value: string[]
  onChange: (urls: string[]) => void
  aspect?: number
}) {
  const images = Array.isArray(value) ? value : []

  const add = (url: string) => onChange([...images, url])
  const remove = (i: number) => onChange(images.filter((_, j) => j !== i))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= images.length) return
    const next = [...images]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      {images.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative overflow-hidden rounded-lg border border-border" style={{ width: 160, height: 160 / aspect }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {i + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Mover a la izquierda"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="rounded p-0.5 text-white/80 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => remove(i)}
                  className="rounded p-0.5 text-white/80 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Mover a la derecha"
                  disabled={i === images.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded p-0.5 text-white/80 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          <ImageIcon className="h-5 w-5 opacity-40" />
          Aún no hay fotos. Sube la primera — la #1 es la portada de la card.
        </div>
      )}
      <div className="flex items-center gap-2">
        <UploadButton aspect={aspect} onUploaded={add} label="Agregar foto" />
        <span className="text-[11px] text-muted-foreground/60">
          recorte a 16:9 · la #1 es la portada · los GIF se suben animados
        </span>
      </div>
    </div>
  )
}
