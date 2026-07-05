"use client"

import { useCallback, useRef, useState } from "react"
import Cropper from "react-easy-crop"
import { Upload, Loader2, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCroppedBlob, type PixelCrop } from "@/lib/crop-image"

// Botón de subida reutilizable. Si se pasa `aspect`, abre el editor de recorte
// (zoom + arrastre) con esa proporción antes de subir. El servidor re-encoda a
// WebP; llama onUploaded(url) con la ruta resultante.
export function UploadButton({
  aspect,
  onUploaded,
  label = "Subir imagen",
  size = "sm",
}: {
  aspect?: number
  onUploaded: (url: string) => void
  label?: string
  size?: "sm" | "default"
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
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
      if (res.ok && data.url) onUploaded(data.url)
      else setError(data.error ?? "Error al subir la imagen")
    } catch {
      setError("No se pudo conectar")
    } finally {
      setBusy(false)
    }
  }

  const handleFile = (file: File) => {
    if (aspect) {
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

  return (
    <>
      <span className="inline-flex items-center gap-2">
        <Button type="button" variant="outline" size={size} className="text-xs" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
          {busy ? "Subiendo…" : label}
        </Button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </span>

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
    </>
  )
}
