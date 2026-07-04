# Christian Fonseca — Brand Assets v1.0

Los SVG de logo son TRAZADOS VECTORIALES PUROS (glifos convertidos a paths con las fuentes originales):
se ven identicos en cualquier navegador, Figma, Illustrator o editor — sin depender de ninguna fuente instalada.
All logo SVGs are pure vector outlines — identical rendering everywhere, no font dependencies.

## Estructura
- logo/
  - simbolo-oscuro.svg — {f} para fondos oscuros (llaves en gradiente)
  - simbolo-claro.svg — {f} para fondos claros (purpura profundo + magenta)
  - simbolo-blanco.svg / simbolo-negro.svg — monocromo (sobre fotos, sellos)
  - wordmark-oscuro.svg / wordmark-claro.svg — {fonseca}
  - lockup-oscuro.svg / lockup-claro.svg — {christian fonseca}
- avatar/
  - avatar.svg + avatar-512.png / avatar-192.png — LinkedIn, GitHub, X
  - favicon.svg + favicon-32.png / favicon-16.png
- social/
  - banner-linkedin-1584x396.png
  - og-image-1200x630.png — para <meta property="og:image">
- tokens/
  - tokens.css — variables CSS listas para el sitio
  - tokens.json — para design tools / JS
- fonts/
  - InstrumentSerif-Italic.ttf, JetBrainsMono-Medium.ttf, STIXTwoText-Italic.ttf + woff2 subsets

## Nota tipografica importante
Instrument Serif NO incluye el glifo f florin. La f del logo proviene de STIX Two Text Italic
(open source, heredera del diseno Times). En web, usa este stack para que la f se vea igual en todos lados:
  font-family: 'Instrument Serif', 'STIX Two Text', serif; font-style: italic;
y carga ambas familias (Google Fonts: Instrument Serif ital + STIX Two Text ital 400).

## Reglas rapidas
- Tamano minimo del simbolo: 24px digital / 8mm impreso (favicon 16px es la excepcion)
- Area de reserva: 0.5x alrededor (x = altura de la f)
- Nunca: recolorear fuera de paleta, enderezar la f, glow pesado, rotar
- Animacion oficial: {f} -> {fonseca} -> {f} -> {c} -> {christian} (spec en Brandbook 03 Motion)
