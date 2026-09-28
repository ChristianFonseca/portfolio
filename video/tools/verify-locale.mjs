import { chromium } from "playwright"
const B = process.argv[2] || "http://localhost:3200"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } })

const lang = () => pg.evaluate(() => document.documentElement.lang)
const openPanel = async () => {
  if (await pg.locator('[role="dialog"]').count() === 0) {
    await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(600)
  }
}
const tabs = () => pg.evaluate(() =>
  [...document.querySelectorAll('[data-track^="mascot:tab:"]')].map((x) => x.textContent.trim()).join("/"))
// Por href y no por aria-label: el nav del blog no lo lleva (tiene texto visible).
const switchTo = async (href, urlGlob) => {
  await pg.locator(`a[href="${href}"]:visible`).first().click()
  await pg.waitForURL(urlGlob, { timeout: 15000 }); await pg.waitForTimeout(1000)
  await openPanel()   // el toggle de idioma está fuera del panel, así que lo cierra
}

// ES -> EN (el sentido que faltaba probar)
await pg.goto(B + "/es", { waitUntil: "networkidle" })
await openPanel()
chk(await tabs() === "Chat/Buscar/Contacto", `arranque en /es: pestañas ${await tabs()}`)
await switchTo("/", "**/")
chk(await lang() === "en", `lang tras pulsar EN: ${await lang()}`)
chk(await tabs() === "Chat/Find/Contact", `pestañas tras pulsar EN: ${await tabs()}`)
chk(await pg.locator('[role="dialog"]').count() > 0, "el panel se reabre tras el cambio (el toggle está fuera: cerrarlo es lo correcto)")

// una conversación en curso NO debe perderse ni traducirse sola
const chip = pg.locator('[data-track="mascot:faq:0"]')
await chip.click(); await pg.waitForTimeout(700)
const before = await pg.evaluate(() =>
  [...document.querySelectorAll('[role="dialog"] [class*="86%"]')].map((x) => x.textContent.trim().slice(0, 30)))
chk(before.length >= 3, `hilo con ${before.length} mensajes antes de cambiar`)
await switchTo("/es", "**/es")
const after = await pg.evaluate(() =>
  [...document.querySelectorAll('[role="dialog"] [class*="86%"]')].map((x) => x.textContent.trim().slice(0, 30)))
chk(JSON.stringify(before) === JSON.stringify(after), "el hilo en curso se conserva intacto (no se traduce solo)")
chk(await tabs() === "Chat/Buscar/Contacto", "pero la interfaz sí pasa a español")

// sin conversación, el saludo sí cambia de idioma
await pg.goto(B, { waitUntil: "networkidle" }); await openPanel()
const g1 = await pg.locator('[role="dialog"] [class*="86%"]').first().innerText()
await switchTo("/es", "**/es")
const g2 = await pg.locator('[role="dialog"] [class*="86%"]').first().innerText()
chk(g1.startsWith("Hello") && g2.startsWith("¡Hola"), `saludo sin conversación: "${g1.slice(0, 18)}" -> "${g2.slice(0, 18)}"`)

// el blog también
await pg.goto(B + "/blog", { waitUntil: "networkidle" }); await openPanel()
chk(await tabs() === "Chat/Find/Contact", "/blog en inglés")
await switchTo("/es/blog", "**/es/blog")
chk(await lang() === "es" && await tabs() === "Chat/Buscar/Contacto", "/es/blog cambia igual")

await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
