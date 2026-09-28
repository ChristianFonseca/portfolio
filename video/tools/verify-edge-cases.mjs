import { chromium } from "playwright"
const B = process.argv[2] || "http://localhost:3200"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "OJO "} ${m}`) }
const b = await chromium.launch()

// A) El CTA "Ask Syn" con el panel YA abierto: pointerup fuera cierra y el
//    click reabre. ¿Se ve el parpadeo o el usuario no nota nada?
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } })
await pg.goto(B, { waitUntil: "networkidle" })
await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(500)
await pg.evaluate(() => {
  window.__mounts = 0
  const obs = new MutationObserver((recs) => {
    for (const r of recs) for (const n of r.addedNodes)
      if (n.nodeType === 1 && n.getAttribute?.("role") === "dialog") window.__mounts++
  })
  obs.observe(document.body, { childList: true, subtree: true })
})
await pg.locator('[data-track="cta:chat"]').first().click()
await pg.waitForTimeout(600)
const mounts = await pg.evaluate(() => window.__mounts)
chk(await pg.locator('[role="dialog"]').count() === 1, "CTA con el panel abierto: acaba abierto")
console.log(`      (el panel se remontó ${mounts} vez/veces en el gesto)`)
// ¿se pierde algo? el borrador y el hilo deben seguir
await pg.locator('[role="dialog"] textarea').fill("texto de prueba")
await pg.locator('[data-track="cta:chat"]').first().click(); await pg.waitForTimeout(600)
chk(await pg.locator('[role="dialog"] textarea').inputValue() === "texto de prueba",
    "el borrador sobrevive al cerrar-reabrir del CTA")

// B) Móvil: deslizar para hacer scroll de la PÁGINA empezando fuera del panel.
//    Si el navegador emite pointercancel en vez de pointerup, no debería cerrarse.
const m = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
const mp = await m.newPage()
await mp.goto(B, { waitUntil: "networkidle" })
await mp.locator('[data-track="mascot:launcher"]').tap(); await mp.waitForTimeout(600)
await mp.evaluate(() => {
  window.__ev = []
  for (const t of ["pointerdown", "pointerup", "pointercancel"])
    document.addEventListener(t, (e) => window.__ev.push(`${t}@${Math.round(e.clientY)}`), true)
})
// deslizamiento vertical en la franja superior, fuera del panel
await mp.touchscreen.tap(195, 60)   // primero comprobamos que un toque simple sí cierra
await mp.waitForTimeout(400)
const closedByTap = await mp.locator('[role="dialog"]').count() === 0
chk(closedByTap, "móvil: un toque simple fuera cierra")
await mp.locator('[data-track="mascot:launcher"]').tap(); await mp.waitForTimeout(600)
await mp.evaluate(() => { window.__ev = [] })
const cdp = await m.newCDPSession(mp)
await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 700 }] })
for (let y = 660; y >= 400; y -= 40)
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 195, y }] })
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
await mp.waitForTimeout(600)
const ev = await mp.evaluate(() => window.__ev)
const stillOpen = await mp.locator('[role="dialog"]').count() > 0
console.log(`      eventos del deslizamiento: ${ev.join(", ") || "(ninguno)"}`)
chk(stillOpen, "móvil: deslizar para hacer scroll fuera del panel NO lo cierra")

await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} a revisar`)
