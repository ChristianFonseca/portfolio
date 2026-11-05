import { chromium } from "playwright"
// Capturas del rediseño por sección (desktop y móvil, oscuro y claro) + errores de consola.
// Uso: node video/tools/redesign-shots.mjs [base] [tag]
const BASE = process.argv[2] || "http://localhost:3100", TAG = process.argv[3] || "rd"
const b = await chromium.launch()
const errors = []

async function shoot({ path, width, height, theme, name }) {
  const ctx = await b.newContext({ viewport: { width, height }, colorScheme: theme, reducedMotion: "reduce" })
  const pg = await ctx.newPage()
  pg.on("console", (m) => m.type() === "error" && errors.push(`${name}: ${m.text().slice(0, 200)}`))
  pg.on("pageerror", (e) => errors.push(`${name}: ${e.message.slice(0, 200)}`))
  await pg.goto(BASE + path, { waitUntil: "load", timeout: 120000 })
  await pg.evaluate((t) => { try { localStorage.setItem("theme", t) } catch {} }, theme)
  await pg.reload({ waitUntil: "load" })
  await pg.waitForTimeout(1500)
  await pg.screenshot({ path: `video/out/${TAG}-${name}-fold.png` })
  for (const id of ["public-projects", "research-projects", "experience", "teaching", "approach"]) {
    const el = pg.locator(`#${id}`)
    if (!(await el.count())) { errors.push(`${name}: falta #${id}`); continue }
    await el.scrollIntoViewIfNeeded(); await pg.waitForTimeout(600)
    await el.screenshot({ path: `video/out/${TAG}-${name}-${id}.png` })
  }
  await ctx.close()
}

await shoot({ path: "/", width: 1440, height: 900, theme: "dark", name: "en-desk" })
await shoot({ path: "/es", width: 1440, height: 900, theme: "light", name: "es-desk-light" })
await shoot({ path: "/", width: 390, height: 844, theme: "dark", name: "en-mob" })
console.log(errors.length ? errors.join("\n") : "sin errores de consola")
await b.close()
