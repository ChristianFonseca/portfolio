import { chromium } from "playwright"
// Captura la tarjeta de un proyecto y su modal de detalle. Uso: node shot-project.mjs [base] [título]
const B = process.argv[2] || "http://localhost:3300", T = process.argv[3] || "Atalaya"
const b = await chromium.launch()
for (const path of ["", "/es"]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5 })
  await ctx.route("**/api/**", (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.goto(B + path, { waitUntil: "networkidle" })
  const title = pg.getByText(T, { exact: true }).first()
  await title.scrollIntoViewIfNeeded(); await pg.waitForTimeout(600)
  const card = title.locator("xpath=ancestor::*[self::article or contains(@class,'rounded')][1]")
  const tag = path ? "es" : "en"
  await card.screenshot({ path: `video/out/project-${tag}.png` })
  await card.click(); await pg.waitForTimeout(700)
  const dlg = pg.locator('[role="dialog"]').last()
  if (await dlg.count()) { await dlg.screenshot({ path: `video/out/project-${tag}-modal.png` }); console.log(`${tag}: tarjeta y modal`) }
  else console.log(`${tag}: tarjeta (sin modal al hacer clic)`)
  await ctx.close()
}
await b.close()
