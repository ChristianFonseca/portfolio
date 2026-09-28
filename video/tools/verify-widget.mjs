import { chromium } from "playwright"

const B = "http://localhost:3100"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }

const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } })
const errs = []
pg.on("pageerror", (e) => errs.push(e.message))
pg.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()) })
const api = []
pg.on("request", (r) => { if (r.url().includes("/api/")) api.push(r.url()) })

await pg.goto(B, { waitUntil: "networkidle" })

const launcher = pg.locator('[data-track="mascot:launcher"]')
chk(await launcher.count() === 1, "lanzador presente en la landing (1 instancia)")
chk(await pg.evaluate(() => {
  const el = document.querySelector("brain-mascot")
  return !!(el && el.shadowRoot && el.shadowRoot.querySelector("img"))
}), "custom element registrado (shadow DOM con imagen)")

const st = () => pg.evaluate(() => document.querySelector("brain-mascot")?.getAttribute("state"))

// El CTA "Try Chat!" ya no navega: abre el widget
const before = pg.url()
await pg.locator('[data-track="cta:chat"]').first().click()
await pg.waitForTimeout(800)
chk(pg.url() === before, "el CTA no navega (sigue en la landing)")
const dialog = pg.locator('[role="dialog"]')
chk(await dialog.isVisible(), "el panel se abre")
chk(await launcher.getAttribute("aria-expanded") === "true", 'aria-expanded="true" tras abrir')
chk(await st() === "chat", `estado de la mascota tras el CTA: ${await st()}`)
const active = await pg.locator('[data-track^="mascot:tab:"][aria-current="true"]').getAttribute("data-track")
chk(active === "mascot:tab:chat", `pestaña activa: ${active}`)

// Las tres pestañas responden
for (const k of ["guide", "contact", "chat"]) {
  const tab = pg.locator(`[data-track="mascot:tab:${k}"]`)
  await tab.click(); await pg.waitForTimeout(250)
  chk(await tab.getAttribute("aria-current") === "true", `pestaña "${k}" se activa`)
}

// Una FAQ responde sin tocar la red
const chip = pg.locator('[data-track^="mascot:faq:"]').first()
if (await chip.count()) {
  api.length = 0
  await chip.click(); await pg.waitForTimeout(1000)
  chk(api.length === 0, `la FAQ responde desde el texto guardado (${api.length} llamadas a /api)`)
  chk(await pg.locator('[role="dialog"]').getByText(/^(Respuesta guardada|Saved answer)/i).count() > 0
      || (await dialog.innerText()).length > 50, "la respuesta guardada aparece en el hilo")
} else console.log("--    sin chips de FAQ (el contenido no trae preguntas)")

// Escape cierra y devuelve el foco
await pg.keyboard.press("Escape"); await pg.waitForTimeout(500)
chk(await dialog.count() === 0, "Escape cierra el panel")
chk(await pg.evaluate(() => document.activeElement?.getAttribute("data-track") === "mascot:launcher"),
    "el foco vuelve al lanzador")

// También en el blog y en ES
for (const p of ["/blog", "/es"]) {
  await pg.goto(B + p, { waitUntil: "networkidle" })
  chk(await pg.locator('[data-track="mascot:launcher"]').count() === 1, `el lanzador está en ${p}`)
}

// /chat redirige
const r = await pg.goto(B + "/chat", { waitUntil: "networkidle" })
chk(new URL(pg.url()).pathname === "/", `/chat acaba en ${new URL(pg.url()).pathname} (${r.status()})`)

const real = errs.filter((e) => !/favicon|ECONNREFUSED|Failed to load resource|Download the React DevTools/i.test(e))
chk(real.length === 0, `errores de consola: ${real.length ? real.join(" | ") : "ninguno"}`)

await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
