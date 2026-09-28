// Prepara la mascota para producción: re-codifica los PNG a WebP y copia el
// componente parcheado a public/mascota/.
//
//   node scripts/build-mascot.mjs
//
// A mano, no en el prebuild: la salida va versionada en public/mascota/ para que
// el build del contenedor no dependa de sharp ni de que los parches sigan
// aplicando. Corre esto cuando cambie algo en mascota/ y commitea el resultado.
// Es idempotente y falla ruidosamente si un parche ya no encaja.
//
// Por qué: los PNG originales pesan 794 KB entre cuerpo y base, y el widget se
// carga en TODAS las páginas públicas. A 420 px de ancho (suficiente para un
// lanzador de 72 px incluso en pantallas retina) bajan a ~46 KB.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import sharp from "sharp"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const SRC = join(ROOT, "mascota")
const OUT = join(ROOT, "public", "mascota")

// Ancho de salida por imagen. El cuerpo y la base se muestran como mucho a ~140 px
// (panel) y 72 px (lanzador); 420 px deja margen para 3x.
const IMAGES = [
  { file: "mascot-body.png", width: 420 },
  { file: "mascot-base.png", width: 420 },
  { file: "mascot-logo.png", width: 420 }, // fijo, para reduced-motion y modo calma
]

/**
 * Parches al componente. El original vive en mascota/brain-mascot.js y se mantiene
 * como fuente; aquí se adapta a producción sin tocarlo.
 */
function patch(src) {
  const before = src
  let out = src

  // 1) WebP en vez de PNG: render() tiene los nombres escritos a mano.
  out = out.replace(/mascot-base\.png/g, "mascot-base.webp").replace(/mascot-body\.png/g, "mascot-body.webp")

  // 2) Tamaño de fuente explícito en :host. Los glifos de sleep/alert/confused se
  //    dimensionan en `em`, que heredaría los 16 px del root y saldrían enormes
  //    sobre un lanzador de 72 px. Atándolo a 1em del propio host, `clamp` funciona
  //    contra el tamaño del componente y no contra el documento.
  out = out.replace(
    /:host\{display:inline-block;/,
    ":host{display:inline-block;font-size:12px;",
  )

  // 3) Las imágenes del shadow DOM no deben ser arrastrables: al arrastrar el
  //    lanzador, el navegador iniciaría un drag de imagen nativo.
  out = out.replace(/<img class="base"/, '<img class="base" draggable="false"')
  out = out.replace(/<img class="img"/, '<img class="img" draggable="false"')

  // 4) data-paused: detiene el bucle de animación. El componente original arranca
  //    un requestAnimationFrame que no para nunca; con esto el widget puede
  //    dormirlo cuando la pestaña se oculta, sale de pantalla o el visitante
  //    activa el modo calma.
  out = out.replace(
    /static get observedAttributes\(\) \{ return \['state', 'speed', 'assets'\]; \}/,
    "static get observedAttributes() { return ['state', 'speed', 'assets', 'data-paused']; }",
  )
  out = out.replace(
    /      const tick = \(\) => \{\n        const t = performance\.now\(\)/,
    "      const tick = () => {\n        if (this.hasAttribute('data-paused')) { this._raf = requestAnimationFrame(tick); return; }\n        const t = performance.now()",
  )

  const applied = [
    [/mascot-body\.webp/.test(out), "webp"],
    [/font-size:12px/.test(out), "font-size"],
    [/class="base" draggable/.test(out), "draggable"],
    [/data-paused/.test(out), "data-paused"],
  ]
  const missing = applied.filter(([ok]) => !ok).map(([, n]) => n)
  if (missing.length) throw new Error(`parches no aplicados: ${missing.join(", ")} (¿cambió brain-mascot.js?)`)
  if (out === before) throw new Error("el parcheo no cambió nada")
  return out
}

async function main() {
  await mkdir(join(OUT, "assets"), { recursive: true })

  let total = 0
  for (const { file, width } of IMAGES) {
    const input = join(SRC, "assets", file)
    const name = file.replace(/\.png$/, ".webp")
    const buf = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 86, effort: 6 })
      .toBuffer()
    await writeFile(join(OUT, "assets", name), buf)
    total += buf.length
    console.log(`  ${name.padEnd(20)} ${(buf.length / 1024).toFixed(0)} KB`)
  }

  const js = patch(await readFile(join(SRC, "brain-mascot.js"), "utf8"))
  await writeFile(join(OUT, "brain-mascot.js"), js)
  console.log(`  brain-mascot.js      ${(Buffer.byteLength(js) / 1024).toFixed(0)} KB (parcheado)`)
  console.log(`mascota lista en public/mascota/ · imágenes: ${(total / 1024).toFixed(0)} KB`)
}

main().catch((e) => {
  console.error("build-mascot:", e.message)
  process.exit(1)
})
