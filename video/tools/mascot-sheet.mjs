// Hoja de contacto de los 12 estados de la mascota.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const ROOT = "F:/Proyectos/portfolio/mascota";
const STATES = ["idle","hello","review","thinking","loading","chat","success","error","listening","alert","confused","sleep"];
const MIME = { ".js":"text/javascript", ".png":"image/png", ".html":"text/html", ".css":"text/css" };
const srv = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => srv.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${srv.address().port}`;
const cells = STATES.map(s => `<figure><brain-mascot state="${s}" style="width:190px"></brain-mascot><figcaption>${s}</figcaption></figure>`).join("");
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#000;color:#eee;font:600 17px/1 'Segoe UI',system-ui;padding:26px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
figure{margin:0;background:#0d0d0f;border:1px solid #232329;border-radius:18px;padding:14px;display:grid;place-items:center;gap:10px}
figcaption{font-family:ui-monospace,monospace;font-size:15px;color:#a855f7;letter-spacing:.08em;text-transform:uppercase}
</style><div class="grid">${cells}</div><script src="${base}/brain-mascot.js"></script>`;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 1180 }, deviceScaleFactor: 1 });
const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => m.type()==="error" && errs.push(m.text()));
await p.setContent(html, { waitUntil: "networkidle" });
await p.waitForTimeout(1400);
const n = await p.evaluate(() => document.querySelectorAll("brain-mascot").length);
const shadow = await p.evaluate(() => [...document.querySelectorAll("brain-mascot")].filter(m => m.shadowRoot && m.shadowRoot.querySelector(".m")).length);
await p.screenshot({ path: "out/mascot-states.png" });
console.log(`componentes: ${n} · con shadow DOM renderizado: ${shadow}`);
console.log(errs.length ? "ERRORES: " + errs.slice(0,4).join(" | ") : "sin errores de consola");
await b.close(); srv.close();
