import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
const B = process.argv[2] || "http://localhost:3300"
const b = await chromium.launch()
for (const path of ["", "/es"]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
  await ctx.route("**/api/**", (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.goto(B + path, { waitUntil: "networkidle" })
  await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(500)
  await pg.locator('[data-track="mascot:prefs"]').click(); await pg.waitForTimeout(400)
  const box = await pg.locator('[role="dialog"]').boundingBox()
  await pg.screenshot({ path: `video/out/prefs${path.replace("/", "-") || "-en"}.png`, clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 } })
  await ctx.close()
}
// Los tres tamaños, misma esquina, sobre la landing
const shots = []
for (const s of ["s", "m", "l"]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
  await ctx.route("**/api/**", (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.goto(B, { waitUntil: "networkidle" })
  await pg.evaluate((v) => localStorage.setItem("assistant.size", v), s)
  await pg.reload({ waitUntil: "networkidle" }); await pg.waitForTimeout(1500)
  const f = `video/out/size-${s}.png`
  await pg.screenshot({ path: f, clip: { x: 1100, y: 720, width: 180, height: 180 } })
  shots.push(f)
  await ctx.close()
}
await b.close()
console.log("capturas: prefs-en, prefs-es, size-s/m/l")
