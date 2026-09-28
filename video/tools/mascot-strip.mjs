import { chromium } from "playwright";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const ROOT="F:/Proyectos/portfolio/mascota"; const MIME={".js":"text/javascript",".png":"image/png"};
const srv=http.createServer((req,res)=>{const p=path.join(ROOT,decodeURIComponent(req.url.split("?")[0]));
 if(!fs.existsSync(p)){res.writeHead(404);return res.end()}
 res.writeHead(200,{"content-type":MIME[path.extname(p)]||"application/octet-stream"});fs.createReadStream(p).pipe(res)});
await new Promise(r=>srv.listen(0,"127.0.0.1",r));
const base=`http://127.0.0.1:${srv.address().port}`;
const b=await chromium.launch(); const p=await b.newPage({viewport:{width:300,height:300}});
fs.mkdirSync("out/strip",{recursive:true});
for (const st of ["hello","chat","success"]) {
  await p.setContent(`<!doctype html><meta charset=utf-8><style>body{margin:0;background:#0d0d0f;display:grid;place-items:center;height:100vh}</style>
    <brain-mascot state="${st}" style="width:230px"></brain-mascot><script src="${base}/brain-mascot.js"></script>`,{waitUntil:"networkidle"});
  await p.waitForTimeout(500);
  for (let i=0;i<6;i++){ await p.screenshot({path:`out/strip/${st}-${i}.png`}); await p.waitForTimeout(230); }
}
await b.close(); srv.close(); console.log("tiras listas");
