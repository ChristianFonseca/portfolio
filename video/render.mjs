#!/usr/bin/env node
// Furtale video renderer: Playwright Chromium 1920x1080 → seek frame by frame → PNG → ffmpeg.
//
//   node render.mjs --lang es                      → out/furtale-como-funciona-es.mp4 + out/poster-es.jpg
//   node render.mjs --lang en --from 9.5 --to 20   → a range (out/furtale-como-funciona-en_9.5-20.mp4)
//   node render.mjs --lang es --frames-only out/frames [--at 1,4.2,9] [--step 0.5]
//                                                  → PNG keyframes only (default: 3 per scene)
//   node render.mjs --lang es --delivery           → out/furtale-explainer-es.mp4 (CRF 18) + .webm (VP9) + poster
// Options: --crf N (22) --preset slow --webm --workers N (parallel pages, default 2)
//          --allow-errors --no-poster --gpu (hardware ANGLE instead of SwiftShader) --probe
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "./serve.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const story = JSON.parse(await readFile(path.join(ROOT, "story.json"), "utf8"));

// ── args ──
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] != null && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};
const lang = opt("lang", "es") === "en" ? "en" : "es";
const fps = story.fps;
const total = Math.round(story.total_seconds * fps); // frames 0 … total-1
const hasRange = argv.includes("--from") || argv.includes("--to");
const from = Number(opt("from", 0));
const to = Number(opt("to", story.total_seconds));
const f0 = Math.max(0, Math.round(from * fps));
const f1 = Math.min(total, Math.round(to * fps));
const framesOnly = opt("frames-only", null);
const delivery = flag("delivery");
const crf = Number(opt("crf", delivery ? 18 : 22));
const preset = opt("preset", "slow");
const webm = flag("webm") || delivery;
const workers = Math.max(1, Number(opt("workers", 2)));
const allowErrors = flag("allow-errors");
const outDir = path.join(ROOT, "out");

const nameTpl = delivery ? story.output.delivery_name : story.output.name;
const baseName = nameTpl.replace("{lang}", lang) + (hasRange ? `_${from}-${to}` : "");

// ── browser ──
async function launch() {
  const args = [
    "--force-color-profile=srgb",
    "--font-render-hinting=none",
    "--disable-lcd-text",
    "--hide-scrollbars",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ];
  if (flag("gpu")) args.push("--use-angle=d3d11", "--enable-gpu");
  else args.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader");
  return chromium.launch({ headless: true, args });
}

async function openPage(browser, url) {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error(`[page error] ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console.log(`[page ${m.type()}] ${m.text()}`);
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => window.__video && window.__video.ready, null, { timeout: 60000 });
  const info = await page.evaluate(async () => {
    await window.__video.ready;
    await document.fonts.ready;
    const c = document.createElement("canvas");
    return {
      errors: window.__video.errors,
      warnings: window.__video.warnings,
      scenes: window.__video.scenes,
      animations: window.__video.animations,
      webgl: !!(c.getContext("webgl2") || c.getContext("webgl")),
      fonts: [...document.fonts].filter((f) => f.status === "loaded").length,
    };
  });
  const cdp = await context.newCDPSession(page);
  const shot = async () => {
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png", optimizeForSpeed: true, captureBeyondViewport: false, fromSurface: true,
    });
    return Buffer.from(data, "base64");
  };
  const seek = (t) => page.evaluate((tt) => window.__video.seek(tt), t);
  return { page, context, info, shot, seek };
}

function report(info) {
  console.log(
    `ready · ${info.scenes.length} scenes · ${info.animations} animations · ${info.fonts} font faces · WebGL ${info.webgl ? "on" : "OFF (pet mesh uses Canvas 2D)"}`,
  );
  for (const s of info.scenes) console.log(`  S${s.n} ${s.start}–${s.end}s  ${s.file}`);
  for (const w of info.warnings) console.log(`  warning [S${w.scene}] ${w.message}`);
  for (const e of info.errors) console.log(`  ERROR [S${e.scene}] ${e.message}`);
  if (info.errors.length && !allowErrors) {
    console.error("Scene errors — fix them or pass --allow-errors.");
    process.exit(1);
  }
}

// ── ffmpeg ──
const COLOR = ["-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];
function encoder(file, kind) {
  const common = ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-", "-an"];
  const codec =
    kind === "webm"
      ? ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", ...COLOR]
      : ["-c:v", "libx264", "-preset", preset, "-crf", String(crf), "-profile:v", "high", ...COLOR, "-movflags", "+faststart"];
  const proc = spawn(ffmpegPath, [...common, ...codec, "-r", String(fps), file], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((res, rej) => proc.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c} (${file})`)))));
  let failed = null;
  proc.stdin.on("error", (e) => (failed = e));
  const write = (buf) =>
    new Promise((res, rej) => {
      if (failed) return rej(failed);
      if (proc.stdin.write(buf)) res();
      else proc.stdin.once("drain", res);
    });
  const end = () => {
    proc.stdin.end();
    return done;
  };
  return { write, end };
}
function run(args) {
  return new Promise((res, rej) => {
    const p = spawn(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: "inherit" });
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`))));
  });
}

// ── main ──
const server = await startServer();
const url = `${server.url}/index.html?render=1&lang=${lang}`;
const browser = await launch();
const t0 = Date.now();
try {
  if (flag("probe")) {
    const p = await openPage(browser, url);
    report(p.info);
  } else if (framesOnly) {
    const dir = path.resolve(framesOnly);
    await mkdir(dir, { recursive: true });
    const p = await openPage(browser, url);
    report(p.info);
    let times;
    if (opt("at", null)) times = opt("at").split(",").map(Number);
    else if (hasRange || opt("step", null)) {
      const step = Number(opt("step", 0.5));
      times = [];
      for (let t = from; t < to - 1e-9; t += step) times.push(t);
    } else {
      times = story.scenes.flatMap((s) => [s.start + 0.5, (s.start + s.end) / 2, s.end - 0.2]);
    }
    for (const t of times) {
      const f = Math.min(total - 1, Math.max(0, Math.round(t * fps)));
      await p.seek(f / fps);
      const file = path.join(dir, `${lang}-t${(f / fps).toFixed(2).padStart(6, "0")}.png`);
      await writeFile(file, await p.shot());
      console.log(`  ${path.relative(ROOT, file)}  (f ${f})`);
    }
  } else {
    await mkdir(outDir, { recursive: true });
    const frames = f1 - f0;
    const n = Math.min(workers, Math.max(1, Math.floor(frames / 60)));
    const chunk = Math.ceil(frames / n);
    const ranges = Array.from({ length: n }, (_, i) => [f0 + i * chunk, Math.min(f1, f0 + (i + 1) * chunk)]).filter(
      ([a, b]) => b > a,
    );
    const tmp = path.join(outDir, `.tmp-${baseName}`);
    await rm(tmp, { recursive: true, force: true });
    await mkdir(tmp, { recursive: true });
    const pages = await Promise.all(ranges.map(() => openPage(browser, url)));
    report(pages[0].info);
    console.log(`rendering ${lang} frames ${f0}–${f1 - 1} (${frames}) with ${ranges.length} worker(s)…`);
    let doneFrames = 0;
    const tick = () => {
      doneFrames++;
      if (doneFrames % 60 === 0 || doneFrames === frames) {
        const el = (Date.now() - t0) / 1000;
        const rate = doneFrames / el;
        process.stdout.write(`  ${doneFrames}/${frames} frames · ${rate.toFixed(1)} fps · eta ${Math.round((frames - doneFrames) / rate)} s\n`);
      }
    };
    await Promise.all(
      ranges.map(async ([a, b], i) => {
        const p = pages[i];
        const encs = [encoder(path.join(tmp, `seg${i}.mp4`), "mp4")];
        if (webm) encs.push(encoder(path.join(tmp, `seg${i}.webm`), "webm"));
        for (let f = a; f < b; f++) {
          await p.seek(f / fps);
          const buf = await p.shot();
          await Promise.all(encs.map((e) => e.write(buf)));
          tick();
        }
        await Promise.all(encs.map((e) => e.end()));
      }),
    );
    const kinds = webm ? ["mp4", "webm"] : ["mp4"];
    for (const kind of kinds) {
      const list = path.join(tmp, `${kind}.txt`);
      await writeFile(list, ranges.map((_, i) => `file 'seg${i}.${kind}'`).join("\n"));
      const out = path.join(outDir, `${baseName}.${kind}`);
      await run(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", ...(kind === "mp4" ? ["-movflags", "+faststart"] : []), out]);
      console.log(`wrote ${path.relative(ROOT, out)}`);
    }
    await rm(tmp, { recursive: true, force: true });

    if (!flag("no-poster") && f1 === total) {
      const p = pages[0];
      await p.seek((total - 1) / fps);
      const poster = path.join(outDir, `poster-${lang}.jpg`);
      await p.page.screenshot({ path: poster, type: "jpeg", quality: 92 });
      console.log(`wrote ${path.relative(ROOT, poster)} (last frame)`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
