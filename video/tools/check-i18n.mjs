import { chromium } from "playwright"
const B = process.argv[2] || "http://localhost:3200"
const b = await chromium.launch()
const dump = async (path) => {
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } })
  await pg.goto(B + path, { waitUntil: "networkidle" })
  console.log(`\n===== ${path || "/"}  (html lang=${await pg.evaluate(() => document.documentElement.lang)}) =====`)
  await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(700)
  const grab = async (label) => {
    const txt = await pg.locator('[role="dialog"]').innerText()
    console.log(`--- ${label} ---`)
    console.log(txt.split("\n").filter(Boolean).map((l) => "   " + l).join("\n"))
  }
  await grab("pestaña Chat")
  for (const k of ["guide", "contact"]) {
    await pg.locator(`[data-track="mascot:tab:${k}"]`).click(); await pg.waitForTimeout(350)
    await grab(`pestaña ${k}`)
  }
  await pg.close()
}
await dump("")
await dump("/es")
await b.close()
