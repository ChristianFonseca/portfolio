import { chromium } from "playwright"
const B = process.argv[2] || "http://localhost:3200"
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 })
await pg.goto(B, { waitUntil: "networkidle" })
await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(700)
const box = await pg.locator('[role="dialog"]').boundingBox()
const pad = 8
await pg.screenshot({ path: "video/out/panel-chat.png",
  clip: { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } })
console.log("panel:", Math.round(box.width) + "x" + Math.round(box.height))
await b.close()
