import { chromium } from "playwright"

const B = process.argv[2] || "http://localhost:3200"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const pg = await ctx.newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(e.message))
pg.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text()) })

const isOpen = () => pg.locator('[role="dialog"]').count().then((n) => n > 0)
const launcher = () => pg.locator('[data-track="mascot:launcher"]')
const open = async () => {
  if (await isOpen()) return
  await launcher().click(); await pg.waitForTimeout(450)
}

await pg.goto(B, { waitUntil: "networkidle" })

// 1) el caso pedido: pulsar fuera cierra
await open()
chk(await isOpen(), "el panel abre")
await pg.mouse.click(300, 450)               // zona vacía de la landing
await pg.waitForTimeout(350)
chk(!(await isOpen()), "pulsar fuera lo cierra")

// 2) pulsar el lanzador sigue siendo un toggle limpio (no cierra-y-reabre)
await open()
chk(await isOpen(), "reabre desde el lanzador")
await launcher().click(); await pg.waitForTimeout(400)
chk(!(await isOpen()), "el lanzador cierra (un solo toggle, sin parpadeo)")
await launcher().click(); await pg.waitForTimeout(400)
chk(await isOpen(), "y vuelve a abrir")

// 3) pulsar DENTRO no cierra
const header = pg.locator('[role="dialog"] header')
await header.click({ position: { x: 120, y: 10 } }); await pg.waitForTimeout(300)
chk(await isOpen(), "pulsar la cabecera del panel no lo cierra")
await pg.locator('[data-track="mascot:tab:guide"]').click(); await pg.waitForTimeout(300)
chk(await isOpen(), "cambiar de pestaña no lo cierra")
await pg.locator('[data-track="mascot:tab:chat"]').click(); await pg.waitForTimeout(300)

// 4) un chip de FAQ desaparece del DOM al pulsarlo: no debe cerrar el panel
const chip = pg.locator('[data-track^="mascot:faq:"]').first()
if (await chip.count()) {
  await chip.click(); await pg.waitForTimeout(700)
  chk(await isOpen(), "pulsar un chip de FAQ (que se borra del DOM) no cierra el panel")
} else console.log("--    sin chips de FAQ")

// 5) arrastrar para seleccionar texto del panel y soltar FUERA no cierra
await pg.reload({ waitUntil: "networkidle" }); await open()
const box = await pg.locator('[role="dialog"]').boundingBox()
await pg.mouse.move(box.x + 30, box.y + box.height - 120)
await pg.mouse.down()
await pg.mouse.move(box.x - 260, box.y + box.height - 120, { steps: 12 })  // sale del panel
await pg.mouse.up()
await pg.waitForTimeout(350)
chk(await isOpen(), "arrastrar desde dentro y soltar fuera no lo cierra")

// 6) ... y al revés: empezar fuera y soltar dentro tampoco
await pg.mouse.move(box.x - 260, box.y + 60)
await pg.mouse.down()
await pg.mouse.move(box.x + 60, box.y + 60, { steps: 12 })
await pg.mouse.up()
await pg.waitForTimeout(350)
chk(await isOpen(), "arrastrar desde fuera y soltar dentro tampoco lo cierra")

// 7) el foco: pulsar fuera en algo enfocable NO se lo roba
await pg.evaluate(() => {
  const a = document.createElement("button")
  a.id = "probe"; a.textContent = "probe"
  a.style.cssText = "position:fixed;left:40px;top:300px;z-index:60;padding:8px"
  document.body.appendChild(a)
})
await open()
await pg.locator('[role="dialog"] textarea').focus()
await pg.locator("#probe").click(); await pg.waitForTimeout(400)
chk(!(await isOpen()), "pulsar un botón de la página cierra el panel")
chk(await pg.evaluate(() => document.activeElement?.id) === "probe",
    `el foco se queda en lo pulsado (activeElement=${await pg.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)})`)

// 8) ... pero si cae en algo inerte y el foco estaba dentro, vuelve al lanzador
await open()
await pg.locator('[role="dialog"] textarea').focus()
await pg.mouse.click(300, 450); await pg.waitForTimeout(400)
chk(!(await isOpen()), "pulsar zona inerte cierra el panel")
chk(await pg.evaluate(() => document.activeElement?.getAttribute("data-track") === "mascot:launcher"),
    "el foco no queda huérfano: vuelve al lanzador")

// 9) Escape sigue funcionando igual que antes
await open()
await pg.keyboard.press("Escape"); await pg.waitForTimeout(350)
chk(!(await isOpen()), "Escape sigue cerrando")
chk(await pg.evaluate(() => document.activeElement?.getAttribute("data-track") === "mascot:launcher"),
    "Escape sigue devolviendo el foco al lanzador")

// 10) la X de la cabecera
await open()
await pg.locator('[data-track="mascot:close"]').click(); await pg.waitForTimeout(350)
chk(!(await isOpen()), "la X cierra")

// 11) el estado del chat sobrevive al cierre por clic fuera
await open()
await pg.locator('[role="dialog"] textarea').fill("borrador a medias")
await pg.mouse.click(300, 450); await pg.waitForTimeout(350)
await open()
chk(await pg.locator('[role="dialog"] textarea').inputValue() === "borrador a medias",
    "el borrador del chat sobrevive a cerrar y reabrir")

// 12) scroll de la página con la rueda no cierra
await pg.mouse.move(400, 500)
await pg.mouse.wheel(0, 500); await pg.waitForTimeout(350)
chk(await isOpen(), "hacer scroll con la rueda no lo cierra")

// 13) táctil en móvil
const m = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
const mp = await m.newPage()
await mp.goto(B, { waitUntil: "networkidle" })
await mp.locator('[data-track="mascot:launcher"]').tap(); await mp.waitForTimeout(600)
chk(await mp.locator('[role="dialog"]').count() > 0, "móvil: abre al tocar")
await mp.touchscreen.tap(195, 80)
await mp.waitForTimeout(450)
chk(await mp.locator('[role="dialog"]').count() === 0, "móvil: tocar fuera lo cierra")
// scroll táctil dentro del registro de mensajes no debe cerrarlo
await mp.locator('[data-track="mascot:launcher"]').tap(); await mp.waitForTimeout(600)
const mb = await mp.locator('[role="dialog"]').boundingBox()
await mp.touchscreen.tap(mb.x + mb.width / 2, mb.y + mb.height / 2)
await mp.waitForTimeout(400)
chk(await mp.locator('[role="dialog"]').count() > 0, "móvil: tocar dentro no lo cierra")

const real = errs.filter((e) => !/favicon|ECONNREFUSED|Failed to load resource|React DevTools/i.test(e))
chk(real.length === 0, `errores de consola: ${real.length ? real.join(" | ") : "ninguno"}`)

await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
