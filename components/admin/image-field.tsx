"use client"

import { useRef, useState } from "react"
import { ImageIcon, Upload, FolderOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AssetItem {
  filename: string
  original_name: string
  url: string
}

// Campo de imagen: preview + subir archivo (se optimiza a WebP en el servidor)
// + selector de imágenes ya subidas. El valor guardado es la ruta (/uploads/x.webp).
export function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [assets, setAssets] = useState<AssetItem[] | null>(null)

  const handleFile = async (file: File) => {
    setError("")
    setBusy(true)
    try {
      const form = new FormData()
      form.append("file", file)
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
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background/50">
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
              className="rounded-full bg-transparent text-xs"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              {busy ? "Subiendo…" : "Subir imagen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full bg-transparent text-xs"
              onClick={openPicker}
            >
              <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
              Elegir existente
            </Button>
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
    </div>
  )
}
