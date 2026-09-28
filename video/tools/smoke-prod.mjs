import { chromium } from "playwright"
// Humo contra producción. Bloquea /api/events para no ensuciar la analítica
// real con visitas de prueba, y no llama a /api/chat (no gasta cuota).
const B = process.argv[2] || "https://christianfonseca.dev"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
await ctx.route("**/api/events**", (r) => r.abort())
await ctx.route("**/api/chat**", (r) => r.abort())
const pg = await ctx.newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(e.message))
pg.on("console", (m) => { if (m.type() === "error") errs.push(m.text()) })
const open = () => pg.locator('[role="dialog"]').count().then((n) => n > 0)

await pg.goto(B, { waitUntil: "networkidle" })
chk(await pg.evaluate(() => !!document.querySelector("brain-mascot")?.shadowRoot?.querySelector("img")),
    "mascota animada registrada")
await pg.locator('[data-track="cta:chat"]').first().click(); await pg.waitForTimeout(800)
chk(await open() && new URL(pg.url()).pathname === "/", "\"Ask Syn\" abre el panel sin navegar")
const g = await pg.locator('[role="dialog"] [class*="86%"]').first().innerText()
chk(g.startsWith("Hello! I'm Syn"), `saludo: "${g.slice(0, 40)}…"`)
chk(await pg.evaluate(() => getComputedStyle(document.querySelector('[role="dialog"] textarea')).fontSize) === "13px",
    "escala de texto nueva (13px)")
await pg.mouse.click(300, 450); await pg.waitForTimeout(400)
chk(!(await open()), "pulsar fuera cierra")
await pg.locator('a[href="/es"]:visible').first().click()
await pg.waitForURL("**/es"); await pg.waitForTimeout(1000)
await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(700)
const tabs = await pg.evaluate(() => [...document.querySelectorAll('[data-track^="mascot:tab:"]')].map((x) => x.textContent.trim()).join("/"))
chk(tabs === "Chat/Buscar/Contacto" && await pg.evaluate(() => document.documentElement.lang) === "es",
    `cambio a español sin recargar: ${tabs}, lang=${await pg.evaluate(() => document.documentElement.lang)}`)
const real = errs.filter((e) => !/api\/events|api\/chat|ERR_FAILED|Failed to load resource|favicon/i.test(e))
chk(real.length === 0, `errores de consola: ${real.length ? real.join(" | ") : "ninguno"}`)
await b.close()
console.log(fails === 0 ? "\nPRODUCCIÓN OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
