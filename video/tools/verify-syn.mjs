import { chromium } from "playwright"
const B = process.argv[2] || "http://localhost:3200"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }
const b = await chromium.launch()

for (const [path, vp, tag] of [
  ["/", { width: 1280, height: 900 }, "en-desktop"], ["/es", { width: 1280, height: 900 }, "es-desktop"],
  ["/", { width: 390, height: 844 }, "en-movil"], ["/es", { width: 390, height: 844 }, "es-movil"],
]) {
  const pg = await b.newPage({ viewport: vp, deviceScaleFactor: 2 })
  await pg.goto(B + path, { waitUntil: "networkidle" })
  const cta = pg.locator('[data-track="cta:chat"]').first()
  const info = await cta.evaluate((a) => {
    const r = a.getBoundingClientRect()
    return { txt: a.textContent.trim(), label: a.getAttribute("aria-label"),
             fits: a.scrollWidth <= a.clientWidth + 1, oneLine: r.height < 60, w: Math.round(r.width) }
  })
  chk(info.fits && info.oneLine, `${tag}: "${info.txt}" cabe en una línea (${info.w}px)`)
  if (tag.endsWith("desktop")) {
    chk(info.label.startsWith(info.txt), `${tag}: nombre accesible "${info.label}" empieza por el texto visible`)
    const box = await cta.boundingBox()
    await pg.screenshot({ path: `video/out/cta-${tag}.png`,
      clip: { x: box.x - 24, y: box.y - 16, width: box.width * 2 + 72, height: box.height + 32 } })
    await cta.click(); await pg.waitForTimeout(700)
    const g = await pg.locator('[role="dialog"] [class*="86%"]').first().innerText()
    chk(/\bSyn\b/.test(g), `${tag}: saludo -> "${g.slice(0, 44)}…"`)
  }
  await pg.close()
}
await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
