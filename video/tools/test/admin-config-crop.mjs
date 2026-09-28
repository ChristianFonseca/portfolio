import { chromium } from "playwright"
const B = "http://admin.localhost:3300"
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1360, height: 900 } })
await pg.goto(`${B}/login`, { waitUntil: "networkidle" })
await pg.locator('input[type="email"]').fill("test@example.com")
await pg.locator('input[type="password"]').fill("test-guardrails-123")
await pg.locator('button[type="submit"]').click()
await pg.waitForURL((u) => !u.pathname.startsWith("/login"))
await pg.goto(`${B}/config`, { waitUntil: "networkidle" })
for (const [label, file] of [["Chat: límites de uso", "admin-config-chat"], ["retención", "admin-config-retention"]]) {
  const card = pg.locator("div.rounded-2xl", { hasText: label }).last()
  await card.screenshot({ path: `video/out/${file}.png` })
  console.log("captura", file)
}
await b.close()
