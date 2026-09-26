#!/usr/bin/env node
// Review helper: render frames at given times and (optionally) tile them into labeled contact sheets.
//
//   node tools/review.mjs --lang es --out review/es --at 9.2,9.5,9.8            → PNG per time
//   node tools/review.mjs --lang es --out <dir> --seams                          → ±0.3 s sheets at every scene boundary
//   node tools/review.mjs --lang es --out review/es --keyframes                  → start+0.2, middle, end-0.2 per scene
//   --sheet name:t1,t2,…  (repeatable) builds one sheet from those times; --cols N (3) --cell W (640)
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "../serve.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const story = JSON.parse(await readFile(path.join(ROOT, "story.json"), "utf8"));
const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] != null && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};
const all = (n) => argv.flatMap((a, i) => (a === `--${n}` ? [argv[i + 1]] : []));
const flag = (n) => argv.includes(`--${n}`);
const lang = opt("lang", "es") === "en" ? "en" : "es";
const out = path.resolve(ROOT, opt("out", `review/${lang}`));
const fps = story.fps;
const total = Math.round(story.total_seconds * fps);
const cols = Number(opt("cols", 3));
const cell = Number(opt("cell", 640));
const snap = (t) => Math.min(total - 1, Math.max(0, Math.round(t * fps))) / fps;

const server = await startServer();
const browser = await chromium.launch({
  headless: true,
  args: ["--force-color-profile=srgb", "--font-render-hinting=none", "--disable-lcd-text", "--hide-scrollbars",
    "--ignore-gpu-blocklist", "--enable-webgl", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
try {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error(`[page error] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && console.log(`[page error] ${m.text()}`));
  await page.goto(`${server.url}/index.html?render=1&lang=${lang}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__video && window.__video.ready);
  const info = await page.evaluate(async () => {
    await window.__video.ready;
    return { errors: window.__video.errors, warnings: window.__video.warnings };
  });
  for (const w of info.warnings) console.log(`warning [S${w.scene}] ${w.message}`);
  for (const e of info.errors) console.log(`ERROR [S${e.scene}] ${e.message}`);
  const cdp = await ctx.newCDPSession(page);
  const shot = async (t) => {
    await page.evaluate((tt) => window.__video.seek(tt), t);
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    return Buffer.from(data, "base64");
  };
  await mkdir(out, { recursive: true });
  const written = [];

  const sceneAt = (t) => story.scenes.find((s) => t >= s.start && t < s.end) || story.scenes[story.scenes.length - 1];
  const label = (t) => {
    const sc = sceneAt(t);
    return `${t.toFixed(3)} s · f${Math.round(t * fps)} · S${sc.n} +${(t - sc.start).toFixed(2)}`;
  };

  async function sheet(name, times) {
    const imgs = [];
    for (const t0 of times) {
      const t = snap(t0);
      imgs.push({ t, src: `data:image/png;base64,${(await shot(t)).toString("base64")}` });
    }
    const rows = Math.ceil(imgs.length / cols);
    const ch = Math.round((cell * 9) / 16);
    const sp = await ctx.newPage();
    await sp.setViewportSize({ width: cols * cell, height: rows * (ch + 28) });
    await sp.setContent(
      `<body style="margin:0;background:#333;display:grid;grid-template-columns:repeat(${cols},${cell}px);font:600 16px monospace;color:#fff">` +
        imgs
          .map((im) => `<div><div style="height:28px;line-height:28px;padding-left:6px">${label(im.t)}</div><img src="${im.src}" style="width:${cell}px;height:${ch}px;display:block"></div>`)
          .join("") +
        "</body>",
    );
    await sp.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
    const file = path.join(out, `${name}.png`);
    await sp.screenshot({ path: file });
    await sp.close();
    written.push(file);
    console.log(file);
  }

  if (flag("seams")) {
    const b = story.scenes.slice(1).map((s) => s.start);
    for (const x of b) await sheet(`seam-${lang}-${x}`, [-0.5, -0.3, -0.2, -0.1, -1 / fps, 0, 0.1, 0.2, 0.3].map((d) => x + d));
    const T = story.total_seconds;
    await sheet(`seam-${lang}-loop`, [T - 0.6, T - 0.2, (total - 1) / fps, 0, 1 / fps, 0.1, 0.2, 0.3, 0.5]);
  }
  for (const spec of all("sheet")) {
    const [name, list] = spec.split(":");
    await sheet(`${name}-${lang}`, list.split(",").map(Number));
  }
  if (flag("determinism")) {
    // A frame must be a pure function of t: capture every `step` s ascending, then again in a
    // shuffled order, and report the times whose pixels differ (seek-history dependence).
    const step = Number(opt("step", 0.5));
    const times = [];
    for (let t = 0; t < story.total_seconds; t += step) times.push(snap(t));
    const ref = new Map();
    for (const t of times) ref.set(t, (await shot(t)).toString("base64"));
    const rng = (() => { let a = 7; return () => ((a = (a * 1103515245 + 12345) >>> 0) / 4294967296); })();
    const order = [...times].sort(() => rng() - 0.5);
    const bad = [];
    for (const t of order) {
      const b = await shot(t);
      if (b.toString("base64") === ref.get(t)) continue;
      bad.push(t);
      if (flag("dump")) {
        const tag = t.toFixed(3).padStart(7, "0");
        await writeFile(path.join(out, `det-${tag}-a.png`), Buffer.from(ref.get(t), "base64"));
        await writeFile(path.join(out, `det-${tag}-b.png`), b);
      }
    }
    console.log(`determinism: ${times.length} times, ${bad.length} differ${bad.length ? ": " + bad.sort((a, b) => a - b).map((t) => label(t)).join(" | ") : ""}`);
  }
  const singles = [];
  if (opt("at", null)) singles.push(...opt("at").split(",").map((t) => ({ t: Number(t), tag: "" })));
  if (flag("keyframes")) {
    for (const s of story.scenes) {
      singles.push({ t: s.start + 0.2, tag: `s${s.n}-a-start` });
      singles.push({ t: (s.start + s.end) / 2, tag: `s${s.n}-b-mid` });
      singles.push({ t: s.end - 0.2, tag: `s${s.n}-c-end` });
    }
  }
  const manifest = [];
  for (const { t: t0, tag } of singles) {
    const t = snap(t0);
    const sc = sceneAt(t);
    const file = path.join(out, `${tag ? tag + "_" : ""}${lang}-t${t.toFixed(2).padStart(6, "0")}.png`);
    await writeFile(file, await shot(t));
    manifest.push({ scene: sc.n, time: Number(t.toFixed(3)), sceneTime: Number((t - sc.start).toFixed(3)), file });
    console.log(`${file}  (S${sc.n} +${(t - sc.start).toFixed(2)} s, f${Math.round(t * fps)})`);
  }
  if (manifest.length && flag("keyframes")) await writeFile(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
} finally {
  await browser.close();
  server.close();
}
