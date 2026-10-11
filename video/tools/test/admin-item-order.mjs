import { chromium } from "playwright"
import { execFileSync } from "node:child_process"
// Editor del admin: subir, bajar, quitar y añadir elementos afecta a EN y ES por igual.
// Contra una base DESECHABLE (contenedor pg-order-test), nunca producción.
const B = process.argv[2] || "http://admin.localhost:3300"
const psql = (q) => execFileSync("docker", ["exec", "-i", "pg-order-test", "psql", "-U", "postgres", "-tA", "-c", q]).toString().trim()
const dbOrder = (loc) => psql(`select string_agg(x->>'title', '|' order by o) from sections, jsonb_array_elements(data->'${loc}'->'items') with ordinality t(x, o) where slug='public-projects'`)
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }

const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 1360, height: 900 } })
pg.on("dialog", (d) => d.accept())
await pg.goto(`${B}/login`, { waitUntil: "networkidle" })
await pg.locator('input[type="email"]').fill("test@example.com")
await pg.locator('input[type="password"]').fill("test-order-123")
await pg.locator('button[type="submit"]').click()
await pg.waitForURL((u) => !u.pathname.startsWith("/login"))
const open = async () => { await pg.goto(`${B}/sections/public-projects`, { waitUntil: "networkidle" }) }
// El punto de "desactualizado" lleva title, que entra en el nombre accesible ("ES Desactualizado")
const tab = (loc) => pg.getByRole("button", { name: new RegExp(`^${loc}( Desactualizado)?$`) })
const uiOrder = () => pg.evaluate(() => [...document.querySelectorAll('button[aria-label="Bajar"]')].map((btn) => btn.parentElement.querySelector("span.truncate").textContent.trim()))
const staleDots = () => pg.locator('span[title="Desactualizado"]').count()

await open()
const before = await uiOrder()
console.log("      orden inicial:", before.join(" | "))

// 1) bajar en EN → también cambia en ES
await tab("EN").click()
await pg.locator('button[aria-label="Bajar"]').first().click()
const en1 = await uiOrder()
await tab("ES").click(); await pg.waitForTimeout(150)
const es1 = await uiOrder()
chk(en1[0] === before[1] && en1[1] === before[0], `EN: '${before[0]}' bajó al puesto 2`)
chk(JSON.stringify(es1) === JSON.stringify(en1), "ES quedó en el mismo orden sin tocarlo")
chk(await staleDots() === 0, "ningún idioma queda marcado como desactualizado (no cambió texto)")
// 2) subir desde ES → también cambia en EN
await pg.locator('button[aria-label="Subir"]').nth(7).click()
const es2 = await uiOrder()
await tab("EN").click(); await pg.waitForTimeout(150)
chk(JSON.stringify(await uiOrder()) === JSON.stringify(es2), `subir desde ES: '${es2[6]}' sube en los dos idiomas`)
// 3) guardar y comprobar en la base
await pg.getByRole("button", { name: "Guardar cambios" }).click()
await pg.waitForTimeout(1500)
const dEn = dbOrder("en"), dEs = dbOrder("es")
chk(dEn === dEs && dEn === es2.join("|"), "guardado: la base tiene el mismo orden en EN y ES")
// 4) quitar desde ES → también desaparece en EN
await open(); await tab("ES").click()
const n0 = (await uiOrder()).length
await pg.locator('button[aria-label="Eliminar"]').last().click(); await pg.waitForTimeout(200)
await tab("EN").click(); await pg.waitForTimeout(150)
chk((await uiOrder()).length === n0 - 1, `quitar desde ES lo quita también en EN (${n0} → ${n0 - 1})`)
// 5) añadir → un elemento nuevo en los dos
await pg.reload({ waitUntil: "networkidle" })
const addBtn = pg.getByRole("button", { name: /^\+ Agregar/ })
chk(/\(EN y ES\)/.test(await addBtn.innerText()), `el botón dice: "${(await addBtn.innerText()).trim()}"`)
await addBtn.click(); await pg.waitForTimeout(200)
const enN = (await uiOrder()).length
await tab("ES").click(); await pg.waitForTimeout(150)
chk((await uiOrder()).length === enN, `añadir crea el elemento en los dos idiomas (${enN} y ${(await uiOrder()).length})`)

// 6) si las listas no tienen el mismo largo: solo el idioma activo, como antes
psql(`update sections set data = jsonb_set(data, '{es,items}', (data->'es'->'items') - (jsonb_array_length(data->'es'->'items') - 1)) where slug='public-projects'`)
await open(); await tab("EN").click()
const esBefore = await (async () => { await tab("ES").click(); await pg.waitForTimeout(150); const o = await uiOrder(); await tab("EN").click(); return o })()
await pg.locator('button[aria-label="Bajar"]').first().click()
await tab("ES").click(); await pg.waitForTimeout(150)
chk(JSON.stringify(await uiOrder()) === JSON.stringify(esBefore), "listas desalineadas: ES no se toca (emparejar por posición sería un error)")
chk(await staleDots() === 1, "  y ES queda marcado como pendiente de traducir")
chk(/\(ES\)$/.test((await pg.getByRole("button", { name: /^\+ Agregar/ }).innerText()).trim()), "  y el botón de añadir vuelve a indicar un solo idioma")

await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
