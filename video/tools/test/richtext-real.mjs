import { chromium } from "playwright"
// Respuestas reales del modelo pintadas en el widget (contra una base DESECHABLE).
const B = process.argv[2] || "http://localhost:3300"
const QS = [["es", "¿Qué proyectos tiene Christian? Dame una lista corta."], ["en", "What cloud certifications does Christian have?"], ["es", "¿Cómo puedo contactarlo y dónde está su CV?"]]
const b = await chromium.launch()
let i = 0
for (const [loc, q] of QS) {
  i++
  const ctx = await b.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 })
  await ctx.route("**/api/events**", (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.goto(B + (loc === "es" ? "/es" : ""), { waitUntil: "networkidle" })
  await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(400)
  await pg.locator('[role="dialog"] textarea').fill(q)
  const [res] = await Promise.all([pg.waitForResponse((r) => r.url().includes("/api/chat"), { timeout: 60000 }), pg.keyboard.press("Enter")])
  const raw = (await res.json()).answer || ""
  await pg.waitForTimeout(1500)
  const bubble = pg.locator('[role="dialog"] [class*="86%"]').last()
  const s = await bubble.evaluate((el) => ({ strong: el.querySelectorAll("strong").length, li: el.querySelectorAll("li").length, a: el.querySelectorAll("a").length, rawStars: el.innerText.includes("**") }))
  console.log(`\n${i}. ${q}\n   crudo: ${JSON.stringify(raw).slice(0, 220)}…\n   pintado: ${s.strong} negritas · ${s.li} elementos de lista · ${s.a} enlaces · ¿quedan **?: ${s.rawStars}`)
  await bubble.screenshot({ path: `video/out/richtext-real-${i}.png` })
  await ctx.close()
}
await b.close()
