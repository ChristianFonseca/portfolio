// Graba los 12 estados en movimiento y mide si de verdad cambian entre fotogramas.
import { chromium } from "playwright";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT = "F:/Proyectos/portfolio/mascota";
const STATES = ["idle","hello","review","thinking","loading","chat","success","error","listening","alert","confused","sleep"];
const MIME = { ".js":"text/javascript", ".png":"image/png" };
const srv = http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0]));
  if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){res.writeHead(404);return res.end()}
  res.writeHead(200,{"content-type":MIME[path.extname(p)]||"application/octet-stream"});fs.createReadStream(p).pipe(res)});
await new Promise(r=>srv.listen(0,"127.0.0.1",r));
const base=`http://127.0.0.1:${srv.address().port}`;
const cells=STATES.map(s=>`<figure><brain-mascot state="${s}" style="width:200px"></brain-mascot><figcaption>${s}</figcaption></figure>`).join("");
const html=`<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#000;color:#eee;font:600 17px/1 system-ui;padding:24px;width:1280px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
figure{margin:0;background:#0d0d0f;border:1px solid #232329;border-radius:18px;padding:12px;display:grid;place-items:center;gap:8px}
figcaption{font-family:ui-monospace,monospace;font-size:14px;color:#a855f7;letter-spacing:.08em;text-transform:uppercase}
</style><div class="grid">${cells}</div><script src="${base}/brain-mascot.js"></script>`;

const b = await chromium.launch();
// 1) prueba numérica: ¿cambian los píxeles entre fotogramas del MISMO estado?
const p1 = await b.newPage({ viewport:{width:360,height:360} });
const diffs = {};
for (const st of ["idle","chat","sleep","thinking","error"]) {
  await p1.setContent(`<!doctype html><meta charset=utf-8><style>body{margin:0;background:#000;display:grid;place-items:center;height:100vh}</style>
    <brain-mascot state="${st}" style="width:260px"></brain-mascot><script src="${base}/brain-mascot.js"></script>`,{waitUntil:"networkidle"});
  await p1.waitForTimeout(600);
  const shots=[];
  for (let i=0;i<5;i++){ shots.push(await p1.screenshot()); await p1.waitForTimeout(260); }
  const uniq = new Set(shots.map(s=>s.toString("base64"))).size;
  diffs[st] = `${uniq}/5 fotogramas distintos`;
}
await p1.close();
console.log("=== ¿hay movimiento real? ===");
for (const [k,v] of Object.entries(diffs)) console.log(`  ${k.padEnd(10)} ${v}`);

// 2) vídeo de la rejilla completa
const ctx = await b.newContext({ viewport:{width:1280,height:900}, recordVideo:{ dir:"out/rec", size:{width:1280,height:900} } });
const p2 = await ctx.newPage();
await p2.setContent(html,{waitUntil:"networkidle"});
await p2.waitForTimeout(9000);
const vid = p2.video();
await p2.close(); await ctx.close();
const raw = await vid.path();
fs.copyFileSync(raw, "out/mascot-motion.webm");
console.log("webm:", (fs.statSync("out/mascot-motion.webm").size/1024).toFixed(0)+"KB");
await b.close(); srv.close();
