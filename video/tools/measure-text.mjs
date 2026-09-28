import { chromium } from "playwright"
const B = process.argv[2] || "http://localhost:3200"
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } })
await pg.goto(B, { waitUntil: "networkidle" })
await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(600)

const rows = []
// Selectores por subcadena de class para no pelearse con el escapado de
// Tailwind (.max-w-[86%] no es un selector CSS valido tal cual).
const measure = async (label, sel) => {
  const r = await pg.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const c = getComputedStyle(el)
    return { fs: parseFloat(c.fontSize), lh: c.lineHeight, txt: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) }
  }, sel)
  rows.push({ label, ...(r || { fs: "-", lh: "-", txt: "(no encontrado)" }) })
}

console.log("root <html> font-size:", await pg.evaluate(() => getComputedStyle(document.documentElement).fontSize), "\n")

await measure("Chat · burbuja de respuesta", '[role="dialog"] [class*="86%"]')
await measure("Chat · campo de escritura", '[role="dialog"] textarea')
await measure("Chat · chip de pregunta (FAQ)", '[role="dialog"] [data-track^="mascot:faq:"]')
await measure("Pestañas Chat/Find/Contact", '[data-track="mascot:tab:chat"]')
await measure("Cabecera · nombre", '[role="dialog"] header p[class*="font-semibold"]')
await measure("Cabecera · titular y ubicación", '[role="dialog"] header p[class*="11px"]')
await measure("Cabecera · chips (CV, email)", '[data-track="mascot:cv"]')
await measure("Contador de preguntas", '[role="dialog"] nav span')
await measure("Pie · aviso", '[role="dialog"] footer')

await pg.locator('[data-track="mascot:tab:guide"]').click(); await pg.waitForTimeout(300)
await measure("Guía · texto de entrada", '[role="dialog"] p[class*="11px"]')
await measure("Guía · botones de salto", '[role="dialog"] [data-track^="mascot:jump"]')

await pg.locator('[data-track="mascot:tab:contact"]').click(); await pg.waitForTimeout(300)
await measure("Contacto · texto", '[role="dialog"] p[class*="11px"]')
await measure("Contacto · botón principal", '[role="dialog"] [class*="bg-gradient-to-r"]')

const w = Math.max(...rows.map((r) => r.label.length))
console.log(`${"ZONA".padEnd(w)}   px   interlin.   contenido`)
console.log("-".repeat(w + 34))
for (const r of rows)
  console.log(`${r.label.padEnd(w)}  ${String(r.fs).padStart(3)}   ${String(r.lh).padStart(7)}   ${r.txt}`)

await b.close()
