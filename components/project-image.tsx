// Imagen de un proyecto (portada de la tarjeta o foto del carrusel).
//
// Las animaciones se nombran "*.anim.webp" (o "*.anim.gif") y llevan al lado un póster
// fijo "*.poster.webp". Si el sistema pide reducir el movimiento se sirve el póster:
// una animación en bucle junto al resto de la página distrae y marea a parte de la gente,
// y el navegador elige la fuente sin JavaScript. Las demás imágenes se pintan tal cual.

const ANIMATED = /\.anim\.(webp|gif)$/i

export function posterFor(src: string): string | null {
  return ANIMATED.test(src) ? src.replace(ANIMATED, ".poster.webp") : null
}

export function ProjectImage({
  src,
  alt,
  className,
  loading,
  draggable,
}: {
  src: string
  alt: string
  className?: string
  loading?: "lazy" | "eager"
  draggable?: boolean
}) {
  const poster = posterFor(src)
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={src} alt={alt} className={className} loading={loading} decoding="async" draggable={draggable} />
  if (!poster) return img
  return (
    <picture className="contents">
      <source media="(prefers-reduced-motion: reduce)" srcSet={poster} />
      {img}
    </picture>
  )
}
