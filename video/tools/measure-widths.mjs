import { chromium } from "playwright"
// Ancho real del contenido de cada sección de la landing (borde izq./der. de lo visible).
const BASE = process.argv[2] || "http://localhost:3100", W = Number(process.argv[3] || 1440)
const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: W, height: 900 } })
await pg.goto(BASE, { waitUntil: "load", timeout: 120000 })
const rows = await pg.evaluate(() => [...document.querySelectorAll("main > section[id]")].map((s) => {
  // las tarjetas/bloques visibles: hijos con borde o fondo dentro del contenedor
  const els = [...s.querySelectorAll(".rounded-3xl, .rounded-2xl, form, ol > li, details")].filter((e) => e.offsetWidth > 100)
  const L = Math.min(...els.map((e) => e.getBoundingClientRect().left)), R = Math.max(...els.map((e) => e.getBoundingClientRect().right))
  return `${s.id.padEnd(18)} ${els.length ? `${Math.round(L)} → ${Math.round(R)}  (${Math.round(R - L)} px)` : "-"}`
}))
console.log(`viewport ${W}\n` + rows.join("\n"))
await b.close()
