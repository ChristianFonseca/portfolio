import { chromium } from "playwright"
// Preferencias de Syn: tamaño, texto, animación y esquina; nueva conversación; 429 de Cloudflare.
const B = process.argv[2] || "http://localhost:3300"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
await ctx.route("**/api/**", (r) => r.abort())
const pg = await ctx.newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(e.message))

const launcher = () => pg.locator('[data-track="mascot:launcher"]')
const openPanel = async () => { if (!(await pg.locator('[role="dialog"]').count())) { await launcher().click(); await pg.waitForTimeout(500) } }
const openPrefs = async () => { await openPanel(); if (!(await pg.locator('[data-track="mascot:prefs"][aria-expanded="true"]').count())) { await pg.locator('[data-track="mascot:prefs"]').click(); await pg.waitForTimeout(250) } }
const pick = async (name, v) => { await pg.locator(`label:has(input[data-track="mascot:pref:${name}:${v}"])`).click(); await pg.waitForTimeout(350) }
const launcherW = () => launcher().evaluate((el) => Math.round(el.getBoundingClientRect().width))
const panelGap = () => pg.evaluate(() => {
  const p = document.querySelector('[role="dialog"]').getBoundingClientRect()
  const l = document.querySelector('[data-track="mascot:launcher"]').getBoundingClientRect()
  return Math.round(l.top - p.bottom)
})

await pg.goto(B, { waitUntil: "networkidle" })
await pg.waitForTimeout(800)
chk(await launcherW() === 76, `tamaño por defecto: ${await launcherW()}px`)

await openPrefs()
chk(await pg.getByRole("heading", { name: "Preferences" }).count() === 1, "el engranaje abre Preferencias")
chk(await pg.locator('[data-track^="mascot:tab:"]').count() === 0, "las pestañas se ocultan mientras tanto")

for (const [v, px] of [["l", 100], ["s", 56], ["m", 76]]) {
  await pick("syn-size", v)
  const w = await launcherW()
  chk(w === px, `tamaño ${v.toUpperCase()}: lanzador de ${w}px (esperado ${px})`)
  const gap = await panelGap()
  chk(gap >= 0 && gap <= 40, `  el panel se recoloca sobre el lanzador (hueco ${gap}px)`)
}
const fs = await pg.evaluate(() => getComputedStyle(document.querySelector("brain-mascot")).fontSize)
chk(fs === "12px", `globos de la mascota a escala en M (font-size ${fs})`)
await pick("syn-size", "l")
const fsL = await pg.evaluate(() => getComputedStyle(document.querySelector("brain-mascot")).fontSize)
chk(Math.abs(parseFloat(fsL) - 15.79) < 0.1, `  y en L crecen en proporción (font-size ${fsL})`)

// teclado: flechas dentro del grupo (radios nativos)
await pg.locator('input[data-track="mascot:pref:syn-size:l"]').focus()
await pg.keyboard.press("ArrowLeft"); await pg.waitForTimeout(350)
chk(await launcherW() === 76, "con el teclado: flecha izquierda pasa de L a M")

await pick("syn-text", "l")
await pick("syn-corner", "left")
chk(await launcher().evaluate((el) => el.getBoundingClientRect().left) < 100, "posición izquierda")
await pick("syn-motion", "still")
chk(await pg.locator("brain-mascot").count() === 0, "animación 'Quieto' sustituye la mascota por la imagen fija")

// persistencia
await pg.reload({ waitUntil: "networkidle" }); await pg.waitForTimeout(600)
chk(await launcher().evaluate((el) => el.getBoundingClientRect().left) < 100 && (await pg.locator("brain-mascot").count()) === 0,
    "tras recargar se conservan esquina y animación")
await openPanel()
const taFs = await pg.locator('[role="dialog"] textarea').evaluate((el) => getComputedStyle(el).fontSize)
chk(taFs === "15px", `texto grande aplicado al chat (campo a ${taFs})`)

// nueva conversación: vive en el chat y solo aparece si hay conversación
chk(await pg.locator('[data-track="mascot:new-chat"]').count() === 0, "sin conversación no hay botón de nueva conversación")
await pg.locator('[data-track="mascot:faq:0"]').click(); await pg.waitForTimeout(400)
const before = await pg.locator('[role="dialog"] [class*="86%"]').count()
await pg.locator('[data-track="mascot:new-chat"]').click(); await pg.waitForTimeout(400)
const after = await pg.locator('[role="dialog"] [class*="86%"]').count()
chk(before >= 3 && after === 1, `nueva conversación: ${before} mensajes → ${after} (vuelve el saludo)`)
chk(await pg.locator('[data-track^="mascot:faq:"]').count() > 0, "  y vuelven las preguntas sugeridas")

// letra pequeña también escala con el texto grande (estaba en texto L desde antes)
const footFs = await pg.locator('[role="dialog"] footer').evaluate((el) => getComputedStyle(el).fontSize)
chk(footFs === "11.5px", `texto grande también agranda el pie (${footFs}; en mediano es 10px)`)

// foco y Escape dentro de Preferencias
await pg.locator('[data-track="mascot:prefs"]').click(); await pg.waitForTimeout(300)
chk(await pg.evaluate(() => document.activeElement?.tagName === "H2"), "al abrir Preferencias el foco va al título")
await pg.keyboard.press("Escape"); await pg.waitForTimeout(300)
chk(await pg.locator('[role="dialog"]').count() === 1 && (await pg.locator('[data-track^="mascot:tab:"]').count()) === 3,
    "Escape en Preferencias vuelve al chat sin cerrar el panel")
chk(await pg.evaluate(() => document.activeElement?.getAttribute("data-track") === "mascot:prefs"), "  y devuelve el foco al engranaje")

// 429 de Cloudflare (HTML, sin JSON) → mensaje de "espera unos segundos"
await ctx.unroute("**/api/**")
await ctx.route("**/api/chat", (r) => r.fulfill({ status: 429, contentType: "text/html", body: "<html>Error 1015 You are being rate limited</html>" }))
await ctx.route("**/api/events**", (r) => r.abort())
await pg.locator('[role="dialog"] textarea').fill("hola")
await pg.keyboard.press("Enter"); await pg.waitForTimeout(900)
chk(await pg.getByText("Too many messages in a row").count() === 1, "un 429 de Cloudflare dice 'espera unos segundos', no 'límite de hoy'")

// restablecer a mano para el resto
await pg.evaluate(() => { localStorage.removeItem("assistant.text"); localStorage.removeItem("assistant.corner"); localStorage.removeItem("assistant.calm"); localStorage.removeItem("assistant.size") })

// móvil: el grande se contiene y el panel queda centrado
const m = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
await m.route("**/api/**", (r) => r.abort())
const mp = await m.newPage()
await mp.goto(B, { waitUntil: "networkidle" })
await mp.evaluate(() => localStorage.setItem("assistant.size", "l"))
await mp.reload({ waitUntil: "networkidle" }); await mp.waitForTimeout(600)
const mw = await mp.locator('[data-track="mascot:launcher"]').evaluate((el) => Math.round(el.getBoundingClientRect().width))
chk(mw === 88, `móvil: tamaño grande contenido a ${mw}px`)
await mp.locator('[data-track="mascot:launcher"]').tap(); await mp.waitForTimeout(600)
const pb = await mp.locator('[role="dialog"]').boundingBox()
chk(pb.y >= 0 && pb.y + pb.height <= 844, `móvil: el panel cabe con el lanzador grande (${Math.round(pb.y)}–${Math.round(pb.y + pb.height)} de 844)`)
chk(Math.round(pb.x) === 16 && Math.round(390 - pb.x - pb.width) === 16, `móvil: margen igual a los dos lados (${Math.round(pb.x)} / ${Math.round(390 - pb.x - pb.width)} px)`)

chk(errs.length === 0, `errores de página: ${errs.length ? errs.join(" | ") : "ninguno"}`)
await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
