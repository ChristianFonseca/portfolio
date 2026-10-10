import { chromium } from "playwright"
// Portada animada con póster (reducir movimiento), chip/botón de descarga y chips del resto.
const B = process.argv[2] || "http://localhost:3300"
let fails = 0
const chk = (c, m) => { if (!c) fails++; console.log(`${c ? "OK   " : "FALLO"} ${m}`) }
const b = await chromium.launch()
const errs = []

for (const reduced of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" })
  await ctx.route("**/api/**", (r) => r.abort())
  const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(e.message))
  await pg.goto(B + "/es", { waitUntil: "networkidle" })
  const card = pg.locator('[data-track="project:VSC Splitter"]')
  await card.scrollIntoViewIfNeeded(); await pg.waitForTimeout(1200)
  const img = card.locator("img").first()
  const cur = await img.evaluate((el) => el.currentSrc)
  if (!reduced) {
    chk(cur.endsWith("/00-demo.anim.webp"), `portada animada: ${cur.split("/").pop()}`)
    chk(await img.getAttribute("loading") === "lazy", "la portada carga en diferido (lazy)")
    chk((await card.innerText()).includes("3"), "contador de imágenes: 3")
    const box = card.locator("xpath=ancestor::*[contains(@class,'glow-effect')][1]")
    const dl = box.locator('a:has-text("Descargar")')
    chk(await dl.getAttribute("href") === "https://github.com/ChristianFonseca/monitor_screen_splitter/releases/latest", "chip 'Descargar' con enlace al release")
    chk(await box.locator('a:has-text("Código abierto")').count() === 1, "chip 'Código abierto' se mantiene")
    // los demás proyectos no cambian
    const chips = await pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-track^="project:"]')].map((btn) => {
      const c = btn.closest(".glow-effect"); return [btn.dataset.track.slice(8), [...c.querySelectorAll(".absolute.right-3 span, .absolute.right-3 a")].map((x) => x.textContent.trim()).join("+")]
    })))
    chk(chips["Atalaya"] === "Privado", `Atalaya sigue 'Privado' (${chips["Atalaya"]})`)
    chk(chips["Furtale"] === "En vivo", `Furtale sigue 'En vivo' (${chips["Furtale"]})`)
    console.log("      chips:", JSON.stringify(chips))
    // modal: botón Descargar y carrusel con la animación primero
    await card.click(); await pg.waitForTimeout(700)
    const dlg = pg.locator('[role="dialog"]').last()
    chk(await dlg.locator('a:has-text("Descargar")').getAttribute("href") === "https://github.com/ChristianFonseca/monitor_screen_splitter/releases/latest", "modal: botón 'Descargar'")
    chk(await dlg.locator('a:has-text("Código fuente")').count() === 1, "modal: botón 'Código fuente' se mantiene")
    const first = await dlg.locator("img").first().evaluate((el) => el.currentSrc)
    chk(first.endsWith("/00-demo.anim.webp"), "modal: la galería empieza con la animación")
    await dlg.screenshot({ path: "video/out/vsc-modal.png" })
    await card.screenshot({ path: "video/out/vsc-card.png" }).catch(() => {})
  } else {
    chk(cur.endsWith("/00-demo.poster.webp"), `con 'reducir movimiento' la portada es el póster fijo (${cur.split("/").pop()})`)
    await card.click(); await pg.waitForTimeout(700)
    const first = await pg.locator('[role="dialog"]').last().locator("img").first().evaluate((el) => el.currentSrc)
    chk(first.endsWith("/00-demo.poster.webp"), "  y en la galería también")
  }
  await ctx.close()
}
chk(errs.length === 0, `errores de página: ${errs.length ? errs.join(" | ") : "ninguno"}`)
await b.close()
console.log(fails === 0 ? "\nTODO OK" : `\n${fails} FALLO(S)`)
process.exit(fails ? 1 : 0)
