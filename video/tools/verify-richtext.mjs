import { chromium } from "playwright"
// Respuestas de Syn con formato: lo que se pinta, lo que NO debe pintarse, y la
// navegación por enlaces internos sin perder la conversación.
const B = process.argv[2] || "http://localhost:3300"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }
const ANSWER = [
  "Christian tiene **13 certificaciones de AWS** y estos *proyectos* destacados:",
  "",
  "- **Atalaya**: monitoreo de su propia infraestructura",
  "- MAT, trading con agentes",
  "",
  "1. Lee [el artículo del incidente](https://christianfonseca.dev/blog/anatomy-of-a-real-rce)",
  "2. O el repo en https://github.com/ChristianFonseca/crabair.",
  "",
  "Su CV: https://christianfonseca.dev/cv.pdf",
  "",
  "Escríbele a christian.fonseca.r@gmail.com. Prueba: [clic](javascript:alert(1)) <img src=x onerror=\"window.__xss=1\">",
].join("\n")

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
await ctx.route("**/api/events**", (r) => r.abort())
await ctx.route("**/api/chat", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ answer: ANSWER, remaining: 8 }) }))
const pg = await ctx.newPage()
const errs = []; pg.on("pageerror", (e) => errs.push(e.message))
await pg.goto(B, { waitUntil: "networkidle" })
await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(400)
await pg.locator('[role="dialog"] textarea').fill("¿Qué proyectos tiene?\nY una segunda línea")
await pg.keyboard.press("Enter"); await pg.waitForTimeout(1200)
const bubble = pg.locator('[role="dialog"] [class*="86%"]').last()

const html = await bubble.innerHTML()
chk(!html.includes("**"), "no quedan asteriscos crudos")
chk(await bubble.locator("strong").count() === 2, `negritas pintadas: ${await bubble.locator("strong").count()}`)
chk(await bubble.locator("em").count() === 1, "cursiva pintada")
chk(await bubble.locator("ul > li").count() === 2 && await bubble.locator("ol > li").count() === 2, "lista con viñetas (2) y numerada (2)")
const internal = bubble.locator('a[href="/blog/anatomy-of-a-real-rce"]')
chk(await internal.count() === 1 && !(await internal.getAttribute("target")), "enlace del propio sitio: ruta relativa, misma pestaña")
const ext = bubble.locator('a[href="https://github.com/ChristianFonseca/crabair"]')
chk(await ext.getAttribute("target") === "_blank" && /noopener/.test(await ext.getAttribute("rel")), "enlace externo: nueva pestaña con noopener")
chk(await bubble.locator('a[href^="mailto:christian.fonseca.r@gmail.com"]').count() === 1, "correo como mailto")
chk(await bubble.locator('a[href="/cv.pdf"]').getAttribute("target") === "_blank", "el CV (archivo del sitio) abre en otra pestaña")
chk(await bubble.locator('a[href^="javascript"]').count() === 0, "SEGURIDAD: el enlace javascript: no se convierte en enlace")
chk(await bubble.locator("img").count() === 0 && (await bubble.innerText()).includes("<img src=x"), "SEGURIDAD: el <img onerror> se ve como texto, no como imagen")
chk(!(await pg.evaluate(() => window.__xss)), "SEGURIDAD: no se ejecutó nada")
const userBubble = pg.locator('[role="dialog"] .justify-end [class*="86%"]').last()
chk((await userBubble.innerText()).includes("\n"), "el mensaje del visitante conserva su salto de línea")
const overflow = await bubble.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)
chk(overflow, "las URLs largas no desbordan la burbuja")
await bubble.screenshot({ path: "video/out/richtext.png" })

// Clic en el enlace interno: navega sin recargar y la conversación sigue ahí
await pg.evaluate(() => { window.__sinRecarga = true })
await internal.click()
await pg.waitForURL("**/blog/anatomy-of-a-real-rce", { timeout: 15000 }); await pg.waitForTimeout(800)
chk(await pg.evaluate(() => window.__sinRecarga === true), "navegó sin recargar la página (next/link)")
if (!(await pg.locator('[role="dialog"]').count())) { await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(400) }
chk((await pg.locator('[role="dialog"]').innerText()).includes("13 certificaciones"), "en el artículo, la conversación sigue intacta")

chk(errs.length === 0, `errores de página: ${errs.length ? errs.join(" | ") : "ninguno"}`)
await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
