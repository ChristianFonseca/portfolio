import { chromium } from "playwright"
const B = process.argv[2] || "http://admin.localhost:3300"
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1 })
const pg = await ctx.newPage()
const errs = []
pg.on("pageerror", (e) => errs.push(e.message))
await pg.goto(`${B}/login`, { waitUntil: "networkidle" })
await pg.locator('input[type="email"]').fill("test@example.com")
await pg.locator('input[type="password"]').fill("test-guardrails-123")
await pg.locator('button[type="submit"]').click()
await pg.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 })
console.log("login OK →", new URL(pg.url()).pathname)

for (const [path, file] of [["/guardrails?range=24h", "admin-guardrails"], ["/questions", "admin-questions"], ["/config", "admin-config"]]) {
  await pg.goto(B + path, { waitUntil: "networkidle" })
  await pg.screenshot({ path: `video/out/${file}.png`, fullPage: true })
  const h1 = await pg.locator("h1").first().innerText()
  console.log(`${path} → "${h1}" · captura video/out/${file}.png`)
}
// El enlace nuevo en la barra lateral
await pg.goto(`${B}/`, { waitUntil: "networkidle" })
console.log("enlace Guardrails en la barra:", await pg.locator('aside a[href="/guardrails"]').count() === 1)
console.log("aviso de cuota visible:", await pg.getByText("Cuota de Gemini agotada").count() > 0)
console.log("errores de página:", errs.length ? errs.join(" | ") : "ninguno")
await b.close()
