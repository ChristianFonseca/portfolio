"use client"

import { useCallback, useRef, useState } from "react"
import Cropper from "react-easy-crop"
import { ImageIcon, Upload, FolderOpen, Loader2, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCroppedBlob, type PixelCrop } from "@/lib/crop-image"

interface AssetItem {
  filename: string
  original_name: string
  url: string
}

// Campo de imagen: preview + subir archivo + selector de imágenes ya subidas.
// Si se pasa `aspect`, la subida abre un editor de recorte (zoom + arrastre) con
// esa proporción, para controlar exactamente cómo se verá en la página.
// El servidor re-encoda todo a WebP. El valor guardado es la ruta (/uploads/x.webp).
export function ImageField({
  value,
  onChange,
  aspect,
}: {
  value: string
  onChange: (url: string) => void
  aspect?: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [assets, setAssets] = useState<AssetItem[] | null>(null)

  // Estado del recorte
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedPixels, setCroppedPixels] = useState<PixelCrop | null>(null)

  const onCropComplete = useCallback((_area: unknown, areaPixels: PixelCrop) => {
    setCroppedPixels(areaPixels)
  }, [])

  const uploadBlob = async (blob: Blob, name: string) => {
    setError("")
    setBusy(true)
    try {
      const form = new FormData()
      form.append("file", blob, name)
      const res = await fetch("/upload", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        onChange(data.url)
        setAssets(null) // refresca el picker la próxima vez
      } else {
        setError(data.error ?? "Error al subir la imagen")
      }
    } catch {
      setError("No se pudo conectar")
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (file: File) => {
    if (aspect) {
      // Abrir el editor de recorte
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedPixels(null)
      setCropSrc(URL.createObjectURL(file))
    } else {
      void uploadBlob(file, file.name)
    }
  }

  const confirmCrop = async () => {
    if (!cropSrc || !croppedPixels) return
    setBusy(true)
    try {
      const blob = await getCroppedBlob(cropSrc, croppedPixels)
      URL.revokeObjectURL(cropSrc)
      setCropSrc(null)
      await uploadBlob(blob, "crop.jpg")
    } catch {
      setError("No se pudo recortar la imagen")
      setBusy(false)
    }
  }

  const cancelCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const openPicker = async () => {
    const next = !pickerOpen
    setPickerOpen(next)
    if (next && assets === null) {
      try {
        const res = await fetch("/upload")
        const data = await res.json().catch(() => ({}))
        setAssets(Array.isArray(data.assets) ? data.assets : [])
      } catch {
        setAssets([])
      }
    }
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background/50"
          style={aspect ? { width: 128, height: 128 / aspect } : { width: 112, height: 80 }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/uploads/… o /imagen-en-public.webp"
            className="w-full rounded-lg border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              {busy ? "Subiendo…" : "Subir imagen"}
            </Button>
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={openPicker}>
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
              Elegir existente
            </Button>
            {aspect && <span className="text-[11px] text-muted-foreground/60">se abrirá el editor de recorte</span>}
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />

      {pickerOpen && (
        <div className="mt-3 rounded-xl border border-border bg-card/60 p-3">
          {assets === null ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Cargando…</p>
          ) : assets.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Aún no hay imágenes subidas. Usa "Subir imagen".
            </p>
          ) : (
            <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
              {assets.map((asset) => (
                <button
                  key={asset.filename}
                  type="button"
                  title={asset.original_name}
                  onClick={() => {
                    onChange(asset.url)
                    setPickerOpen(false)
                  }}
                  className={`aspect-video overflow-hidden rounded-lg border transition-all hover:border-primary hover:shadow-[0_0_16px_-4px_rgba(168,85,247,0.5)] ${
                    value === asset.url ? "border-primary ring-2 ring-primary/40" : "border-border"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt={asset.original_name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor de recorte */}
      <Dialog open={cropSrc !== null} onOpenChange={(open) => !open && cancelCrop()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajustar imagen</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Arrastra para reposicionar y usa el zoom. El recorte es exactamente lo que se verá en la página.
          </p>
          <div className="relative mt-2 h-72 w-full overflow-hidden rounded-xl bg-black/60">
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect ?? 1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid={false}
              />
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-purple-500"
              aria-label="Zoom"
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" onClick={cancelCrop} disabled={busy}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={confirmCrop} disabled={busy || !croppedPixels}>
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {busy ? "Subiendo…" : "Usar imagen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
