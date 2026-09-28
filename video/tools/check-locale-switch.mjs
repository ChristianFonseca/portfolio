import { chromium } from "playwright"
const B = process.argv[2] || "http://localhost:3200"
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } })
await pg.goto(B, { waitUntil: "networkidle" })

const snap = async (label) => {
  const open = await pg.locator('[role="dialog"]').count() > 0
  if (!open) { await pg.locator('[data-track="mascot:launcher"]').click(); await pg.waitForTimeout(600) }
  const d = await pg.evaluate(() => {
    const p = document.querySelector('[role="dialog"]')
    const t = (s) => p.querySelector(s)?.textContent?.trim() ?? "-"
    return {
      lang: document.documentElement.lang,
      url: location.pathname,
      titular: t("header p:nth-of-type(1) + p") || "-",
      pestañas: [...p.querySelectorAll('[data-track^="mascot:tab:"]')].map((x) => x.textContent.trim()).join(" / "),
      saludo: (p.querySelector('[class*="86%"]')?.textContent ?? "-").slice(0, 52),
      faq1: (p.querySelector('[data-track="mascot:faq:0"]')?.textContent ?? "-").slice(0, 48),
      pie: (p.querySelector("footer")?.textContent ?? "-").trim().slice(0, 40),
      placeholder: p.querySelector("textarea")?.placeholder?.slice(0, 40) ?? "-",
    }
  })
  console.log(`\n--- ${label} ---`)
  for (const [k, v] of Object.entries(d)) console.log(`   ${k.padEnd(12)} ${v}`)
  return d
}

const a = await snap("carga directa de / (inglés)")
// cambio de idioma con el botón de la barra (next/link, navegación de cliente)
await pg.locator('a[aria-label="Ver en español"]:visible').first().click()
await pg.waitForURL("**/es", { timeout: 15000 })
await pg.waitForTimeout(1200)
const bb = await snap("tras pulsar ES (sin recargar)")
await pg.reload({ waitUntil: "networkidle" })
const c = await snap("tras recargar /es")

console.log("\n=== veredicto ===")
const same = (k) => a[k] === bb[k]
for (const k of ["lang", "titular", "pestañas", "saludo", "faq1", "pie", "placeholder"])
  console.log(`   ${k.padEnd(12)} ${same(k) ? "SIGUE EN INGLÉS" : "cambió a español"}${bb[k] === c[k] ? "" : "   (y no coincide con la recarga)"}`)
await b.close()
