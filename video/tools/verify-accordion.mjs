import { chromium } from "playwright"
// Acordeón de experiencia: abrir/cerrar todo, uno a uno, teclado e inert.
const BASE = process.argv[2] || "http://localhost:3100"
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } })
const fails = []
const ok = (c, m) => { if (!c) fails.push(m) }
for (const [path, expand, collapse] of [["/", "Expand all", "Collapse all"], ["/es", "Abrir todo", "Cerrar todo"]]) {
  await pg.goto(BASE + path, { waitUntil: "load", timeout: 120000 })
  for (const id of ["experience", "teaching"]) {
    const sec = pg.locator(`#${id}`)
    const rows = sec.locator("ol > li h3 button")
    const n = await rows.count()
    const expanded = async () => (await rows.evaluateAll((bs) => bs.map((x) => x.getAttribute("aria-expanded")))).filter((v) => v === "true").length
    ok(n > 1, `${path} ${id}: ${n} filas`)
    ok((await expanded()) === 1, `${path} ${id}: al cargar debería haber 1 abierto, hay ${await expanded()}`)
    const all = sec.getByRole("button", { name: expand })
    await all.click()
    ok((await expanded()) === n, `${path} ${id}: tras "${expand}" abiertos ${await expanded()}/${n}`)
    ok(await sec.getByRole("button", { name: collapse }).isVisible(), `${path} ${id}: el botón no cambió a "${collapse}"`)
    await sec.getByRole("button", { name: collapse }).click()
    ok((await expanded()) === 0, `${path} ${id}: tras "${collapse}" abiertos ${await expanded()}`)
    // cerrado: el panel está inert (no enfocable) pero su texto sigue en el HTML
    const panel = sec.locator('[role="region"]').first()
    ok(await panel.evaluate((p) => p.inert), `${path} ${id}: panel cerrado sin inert`)
    ok((await panel.textContent()).length > 40, `${path} ${id}: panel cerrado sin texto en el HTML`)
    // teclado: Enter sobre la cabecera abre
    await rows.nth(1).focus(); await pg.keyboard.press("Enter")
    ok((await rows.nth(1).getAttribute("aria-expanded")) === "true", `${path} ${id}: Enter no abrió la fila 2`)
    ok(!(await sec.locator('[role="region"]').nth(1).evaluate((p) => p.inert)), `${path} ${id}: abierta sigue inert`)
    await pg.keyboard.press("Space")
    ok((await rows.nth(1).getAttribute("aria-expanded")) === "false", `${path} ${id}: Espacio no cerró la fila 2`)
  }
  ok(await pg.locator("#approach li").count() >= 3, `${path}: faltan principios en #approach`)
  const order = await pg.evaluate(() => [...document.querySelectorAll("main > section[id]")].map((s) => s.id).join(" > "))
  console.log(path, order)
}
console.log(fails.length ? "FALLOS:\n" + fails.join("\n") : "acordeón OK (EN y ES)")
await b.close()
