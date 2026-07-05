// Genera un Blob recortado a partir de la región elegida en el cropper.
// Se exporta como JPEG de alta calidad; el servidor lo re-encoda a WebP con sharp
// (JPEG desde canvas tiene mejor soporte de navegador que WebP desde canvas).
export interface PixelCrop {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", (e) => reject(e))
    img.src = src
  })
}

export async function getCroppedBlob(imageSrc: string, crop: PixelCrop, maxSize = 1920): Promise<Blob> {
  const image = await loadImage(imageSrc)

  // Limita el lado mayor a maxSize para no generar canvas gigantes
  const scale = Math.min(1, maxSize / Math.max(crop.width, crop.height))
  const outW = Math.round(crop.width * scale)
  const outH = Math.round(crop.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo crear el canvas")

  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outW, outH)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen"))),
      "image/jpeg",
      0.92,
    )
  })
}
