import { chromium } from "playwright"
const B = process.argv[2] || "http://localhost:3200"
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } })
await pg.goto(B, { waitUntil: "networkidle" })
await pg.locator('[data-track="mascot:launcher"]').click()
await pg.waitForTimeout(600)
const input = pg.locator('[role="dialog"] input[type="text"], [role="dialog"] textarea').first()
await input.fill("What cloud certifications does Christian hold?")
const t0 = Date.now()
const [res] = await Promise.all([
  pg.waitForResponse((r) => r.url().includes("/api/chat"), { timeout: 60000 }),
  input.press("Enter"),
])
console.log(`/api/chat -> ${res.status()} en ${Date.now() - t0}ms`)
// mientras espera debería estar en thinking
await pg.waitForTimeout(400)
await pg.waitForFunction(() => {
  const n = document.querySelectorAll('[role="dialog"] [data-msg]').length
  return n > 0
}, { timeout: 30000 }).catch(() => {})
await pg.waitForTimeout(2500)
const st = await pg.evaluate(() => document.querySelector("brain-mascot")?.getAttribute("state"))
console.log("estado de la mascota tras responder:", st)
const txt = (await pg.locator('[role="dialog"]').innerText()).replace(/\s+/g, " ")
const i = txt.indexOf("certifications")
console.log("respuesta (extracto):", txt.slice(Math.max(0, i - 40), i + 320) || txt.slice(-320))
await pg.screenshot({ path: "video/out/widget-chat-prod.png" })
console.log("captura: video/out/widget-chat-prod.png")
await b.close()
