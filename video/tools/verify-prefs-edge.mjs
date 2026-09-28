import { chromium } from "playwright"
// Los casos que encontró la revisión y que la suite principal (1280x900) no podía ver.
const B = process.argv[2] || "http://localhost:3100"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }
const b = await chromium.launch()
const page = async (vp, extra = {}) => {
  const ctx = await b.newContext({ viewport: vp, ...extra })
  await ctx.route("**/api/**", (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.goto(B, { waitUntil: "networkidle" }); await pg.waitForTimeout(600)
  return pg
}
const openPrefs = async (pg) => {
  await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(400)
  await pg.locator('[data-track="mascot:prefs"]').click(); await pg.waitForTimeout(300)
}

// 1) Portátil 1366x768 con la barra del navegador: tabular a "Posición" no desplaza el panel
{
  const pg = await page({ width: 1366, height: 657 })
  await openPrefs(pg)
  await pg.locator('input[data-track="mascot:pref:syn-corner:right"]').focus(); await pg.waitForTimeout(300)
  const r = await pg.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]'), list = document.getElementById("syn-prefs")
    const lab = document.activeElement.closest("label").getBoundingClientRect(), l = list.getBoundingClientRect()
    return { panelScroll: panel.scrollTop, visible: lab.top >= l.top - 1 && lab.bottom <= l.bottom + 1 }
  })
  chk(r.panelScroll === 0 && r.visible, `1366×657: la opción enfocada queda visible y el panel no salta (scroll del panel ${r.panelScroll})`)
  // 2) la opción elegida lleva ✓, no solo color
  const marks = await pg.evaluate(() => [...document.querySelectorAll("#syn-prefs fieldset")].map((f) =>
    [...f.querySelectorAll("label")].filter((l) => l.querySelector("svg")).length))
  chk(marks.every((n) => n === 1), `cada grupo marca su opción elegida con ✓ (${marks.join(", ")})`)
  // la cabecera se compacta en Preferencias
  chk(await pg.locator('[data-track="mascot:cv"]').isHidden(), "en Preferencias se ocultan los chips de la cabecera (más espacio)")
  // 5) al volver, el chat arranca abajo
  await pg.locator('[data-track="mascot:prefs-back"]').click(); await pg.waitForTimeout(300)
  for (let i = 0; i < 4; i++) { const c = pg.locator('[data-track^="mascot:faq:"]').first(); if (await c.count()) { await c.click(); await pg.waitForTimeout(250) } }
  await pg.locator('[data-track="mascot:prefs"]').click(); await pg.waitForTimeout(250)
  await pg.locator('[data-track="mascot:prefs-back"]').click(); await pg.waitForTimeout(400)
  const atBottom = await pg.evaluate(() => { const l = document.querySelector('[role="dialog"] .overflow-y-auto'); return l.scrollHeight - l.scrollTop - l.clientHeight < 4 })
  chk(atBottom, "al volver de Preferencias el chat muestra la última respuesta, no la primera")
}

// 3) Móvil en horizontal: el grande se contiene y el contenido tiene espacio
{
  const pg = await page({ width: 844, height: 390 }, { hasTouch: true, isMobile: true })
  await pg.evaluate(() => localStorage.setItem("assistant.size", "l"))
  await pg.reload({ waitUntil: "networkidle" }); await pg.waitForTimeout(600)
  const w = await pg.locator('[data-track="mascot:launcher"]').evaluate((el) => Math.round(el.getBoundingClientRect().width))
  chk(w === 76, `móvil en horizontal: el grande se contiene a ${w}px`)
  await pg.locator('[data-track="mascot:launcher"]').tap(); await pg.waitForTimeout(500)
  const logH = await pg.evaluate(() => Math.round(document.querySelector('[role="dialog"] .overflow-y-auto').getBoundingClientRect().height))
  chk(logH >= 60, `móvil en horizontal: el chat conserva espacio visible (${logH}px; la cabecera se compacta)`)
  await pg.locator('[data-track="mascot:prefs"]').tap(); await pg.waitForTimeout(300)
  const prefsH = await pg.evaluate(() => Math.round(document.getElementById("syn-prefs").getBoundingClientRect().height))
  chk(prefsH >= 60, `móvil en horizontal: Preferencias también (${prefsH}px, con scroll)`)
}

// 6) "Ask Syn" con el teclado vuelve al chat aunque el panel estuviera en Preferencias
{
  const pg = await page({ width: 1280, height: 900 })
  await openPrefs(pg)
  await pg.locator('[data-track="cta:chat"]').first().focus()
  await pg.keyboard.press("Enter"); await pg.waitForTimeout(500)
  chk(await pg.locator('[data-track^="mascot:tab:"]').count() === 3, "'Ask Syn' con Enter abre el chat aunque estuviera en Preferencias")
}

// 7) pantalla estrecha + texto grande: el botón de nueva conversación queda dentro del panel
{
  const pg = await page({ width: 320, height: 640 }, { hasTouch: true, isMobile: true })
  await pg.evaluate(() => localStorage.setItem("assistant.text", "l"))
  await pg.reload({ waitUntil: "networkidle" }); await pg.waitForTimeout(600)
  await pg.locator('[data-track="mascot:launcher"]').tap(); await pg.waitForTimeout(500)
  await pg.locator('[data-track="mascot:faq:0"]').tap(); await pg.waitForTimeout(400)
  const r = await pg.evaluate(() => {
    const b = document.querySelector('[data-track="mascot:new-chat"]').getBoundingClientRect()
    const p = document.querySelector('[role="dialog"]').getBoundingClientRect()
    return { inside: b.right <= p.right + 0.5 && b.left >= p.left, w: Math.round(b.width) }
  })
  chk(r.inside && r.w >= 24, `320px + texto grande: el botón de nueva conversación queda dentro del panel (${r.w}px de ancho)`)
}

// 4) con movimiento reducido: frase legible en vez de radios atenuados
{
  const pg = await page({ width: 1280, height: 900 }, { reducedMotion: "reduce" })
  await openPrefs(pg)
  const txt = await pg.locator('#syn-prefs [role="group"]').innerText()
  chk(/Still/.test(txt) && /reduced motion/.test(txt), `movimiento reducido: "${txt.replace(/\s+/g, " ").slice(0, 70)}…"`)
  const op = await pg.locator('#syn-prefs [role="group"] p').last().evaluate((el) => getComputedStyle(el.closest("[role=group]")).opacity)
  chk(op === "1", "  a contraste completo (sin atenuar)")
}

await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
