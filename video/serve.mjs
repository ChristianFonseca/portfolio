// Tiny static server for the preview and the renderer (ES modules need http://).
//   node serve.mjs [--port 5178]   → http://localhost:5178/index.html?lang=es
// GET /__scenes lists scenes/*.js|css with mtimes (the runtime picks NN-*.js).
import http from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://x");
    let p = decodeURIComponent(url.pathname);
    if (p === "/__scenes") {
      const dir = path.join(ROOT, "scenes");
      const names = (await readdir(dir)).filter((n) => /\.(js|css)$/.test(n));
      const list = await Promise.all(
        names.map(async (name) => ({ name, mtime: Math.round((await stat(path.join(dir, name))).mtimeMs) })),
      );
      res.writeHead(200, { "content-type": TYPES[".json"], "cache-control": "no-store" });
      res.end(JSON.stringify(list));
      return;
    }
    if (p === "/") p = "/index.html";
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(err.code === "ENOENT" ? 404 : 500, { "content-type": "text/plain" });
    res.end(String(err.message || err));
  }
}

/** Start the server; port 0 = any free port. Resolves {url, close()}. */
export function startServer({ port = 0, host = "127.0.0.1" } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.on("error", reject);
    server.listen(port, host, () => {
      const { port: p } = server.address();
      resolve({ url: `http://${host === "127.0.0.1" ? "localhost" : host}:${p}`, close: () => server.close() });
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--port");
  const port = i > 0 ? Number(process.argv[i + 1]) : 5178;
  const { url } = await startServer({ port, host: "127.0.0.1" });
  console.log(`Furtale video preview\n  ES  ${url}/index.html?lang=es\n  EN  ${url}/index.html?lang=en`);
  console.log("  keys: space play/pause · ←/→ frame (shift: 1 s) · [ ] scenes · g grid · l loop scene · e language");
}
