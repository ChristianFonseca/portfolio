/* Logos de marca (Brand Assets v1.0). Cada variante tiene versión clara y
   oscura; se intercambian por tema con clases dark:. Son SVG con trazados
   puros: se ven idénticos en cualquier navegador. */

const SOURCES = {
  lockup: { light: "/brand/lockup-claro.svg", dark: "/brand/lockup-oscuro.svg", alt: "{christian fonseca}" },
  wordmark: { light: "/brand/wordmark-claro.svg", dark: "/brand/wordmark-oscuro.svg", alt: "{fonseca}" },
  simbolo: { light: "/brand/simbolo-claro.svg", dark: "/brand/simbolo-oscuro.svg", alt: "{f}" },
} as const

export function BrandLogo({
  variant = "lockup",
  className = "h-6 w-auto",
}: {
  variant?: keyof typeof SOURCES
  className?: string
}) {
  const src = SOURCES[variant]
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src.light} alt={src.alt} className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src.dark} alt={src.alt} className={`${className} hidden dark:block`} />
    </>
  )
}
