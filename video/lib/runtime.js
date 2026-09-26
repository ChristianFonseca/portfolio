// Furtale video — runtime: composes the scenes on one timeline and exposes
// window.__video = { duration, fps, seek(seconds) → Promise, ready, errors, … }.
//
// Clock model: every animation (WAAPI or CSS @keyframes) is paused the moment it
// exists and belongs to a clock: the global clock (HUD) or the clock of the scene
// whose build() created it (t0 = scene start). seek(T) sets, for each animation,
// currentTime = T - t0. Nothing ever runs on the wall clock, so a frame is a pure
// function of T. Preview playback just calls the same seek every animation frame.
import * as ui from "./ui.js";

const params = new URLSearchParams(location.search);
const RENDER = params.get("render") === "1";
const LANG = params.get("lang") === "en" ? "en" : "es";

// ── clock ownership ─────────────────────────────────────────────────────────
const OWNER = new Map(); // Animation → t0 (ms)
let BUILD_T0 = null; // ms, while the HUD or a scene builds
const nativeAnimate = Element.prototype.animate;
Element.prototype.animate = function (keyframes, options) {
  const a = nativeAnimate.call(this, keyframes, options);
  adopt(a, BUILD_T0 ?? inferT0(this, 0));
  return a;
};
const nativeCancel = Animation.prototype.cancel;
Animation.prototype.cancel = function () {
  OWNER.delete(this);
  return nativeCancel.call(this);
};
function adopt(a, t0) {
  try {
    a.pause();
  } catch {
    /* already paused */
  }
  OWNER.set(a, t0);
}
function inferT0(target, fallback) {
  const host = target && target.closest ? target.closest("[data-t0]") : null;
  return host ? Number(host.dataset.t0) : fallback;
}
/** Adopt CSS animations (and anything created outside ui/el.animate). */
function collect(fallbackT0 = 0) {
  for (const a of document.getAnimations()) {
    if (!OWNER.has(a)) adopt(a, inferT0(a.effect && a.effect.target, fallbackT0));
  }
}

// ── state ───────────────────────────────────────────────────────────────────
const SCENES = [];
const GLOBAL_HOOKS = [];
const WAITS = [];
const ERRORS = [];
const WARNINGS = [];
let STORY = null;
let DURATION = 0;
let FPS = 30;
let CURRENT = 0;

function recordError(scene, err) {
  const e = { scene, message: String((err && err.message) || err), stack: err && err.stack ? String(err.stack) : "" };
  ERRORS.push(e);
  console.error(`[scene ${scene}]`, err);
  return e;
}
function warn(scene, msg) {
  WARNINGS.push({ scene, message: msg });
  console.warn(`[scene ${scene}] ${msg}`);
}

// ── apply(T): the whole frame as a function of T ───────────────────────────
function apply(T) {
  collect();
  const ms = T * 1000;
  for (const [a, t0] of OWNER) {
    if (a.playState !== "paused") a.pause();
    a.currentTime = ms - t0;
  }
  for (const sc of SCENES) {
    const vis = T >= sc.start - sc.pre && T < sc.end + sc.post;
    if (vis !== sc.visible) {
      // visibility alone is not enough: a child whose visibility is animated to `visible`
      // (ui.show) or set inline would still paint. opacity 0 cannot be overridden by children,
      // so a hidden scene never leaks into another scene's frames, whatever the seek order.
      sc.stage.style.visibility = vis ? "visible" : "hidden";
      sc.stage.style.opacity = vis ? "" : "0";
      sc.visible = vis;
    }
    for (const hk of sc.hooks) {
      if (!vis && !hk.always) continue;
      try {
        hk.fn(T - sc.start);
      } catch (err) {
        if (!hk.failed) recordError(sc.n, err);
        hk.failed = true;
      }
    }
  }
  for (const hk of GLOBAL_HOOKS) hk(T);
  CURRENT = T;
}

const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
async function seek(T) {
  const t = Math.min(Math.max(0, Number(T) || 0), DURATION);
  apply(t);
  if (document.fonts.status !== "loaded") await document.fonts.ready;
  await raf();
}

// ── fonts ───────────────────────────────────────────────────────────────────
const FONT_SPECS = [
  '700 82px "Space Grotesk"', '700 120px "Space Grotesk"', '500 34px "Space Grotesk"',
  '500 26px "Space Grotesk"', '600 25px "Space Grotesk"', '700 76px "Space Grotesk"',
  '500 20px "JetBrains Mono"', '600 24px "JetBrains Mono"', '700 76px "JetBrains Mono"',
  '500 27px "JetBrains Mono"', '600 21px "JetBrains Mono"',
  'italic 400 64px "Instrument Serif"',
];
const FONT_SAMPLE = "AaÁáÑñ¿¡–·…0123456789Āő";
async function loadFonts() {
  await Promise.all(FONT_SPECS.map((f) => document.fonts.load(f, FONT_SAMPLE)));
  await document.fonts.ready;
}

// ── scene discovery + loading ───────────────────────────────────────────────
async function listScenes() {
  try {
    const r = await fetch("__scenes", { cache: "no-store" });
    if (r.ok) return await r.json();
  } catch {
    /* static hosting: fall back to story.json file names */
  }
  return null;
}
function pickFiles(st, listing) {
  const nn = String(st.n).padStart(2, "0");
  if (!listing) {
    return { js: st.file, css: null, v: Date.now() };
  }
  const js = listing
    .filter((f) => f.name.startsWith(nn + "-") && f.name.endsWith(".js"))
    .sort((a, b) => b.mtime - a.mtime)[0];
  if (!js) return { js: null, css: null, v: 0 };
  const cssName = js.name.replace(/\.js$/, ".css");
  const css = listing.find((f) => f.name === cssName);
  return { js: js.name, css: css ? css.name : null, v: Math.max(js.mtime, css ? css.mtime : 0) };
}
function loadCss(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`failed to load ${href}`));
    document.head.append(link);
  });
}

function makeCtx(sc, st) {
  return {
    // contract
    lang: LANG,
    copy: st["copy_" + LANG] || [],
    story: st,
    ui,
    // extras
    t: (o) => ui.tr(LANG, o),
    scene: { n: st.n, start: st.start, end: st.end, duration: st.end - st.start },
    stage: sc.stage,
    render: RENDER,
    fps: FPS,
    width: 1920,
    height: 1080,
    rng: (seed = 4) => ui.mulberry32(seed),
    onFrame: (fn, o) => sc.hooks.push({ fn, always: !!(o && o.always) }),
    waitFor: (p) => {
      WAITS.push(Promise.resolve(p).catch((err) => recordError(st.n, err)));
      return p;
    },
    warn: (m) => warn(st.n, m),
    fullStory: STORY,
  };
}

async function boot() {
  document.body.classList.toggle("render", RENDER);
  document.documentElement.lang = LANG;
  STORY = await (await fetch("story.json", { cache: "no-store" })).json();
  // build-time smart-quote pass over every on-screen string (what's → what’s, pet's → pet’s)
  const curl = (v) =>
    typeof v === "string" ? ui.smartQuotes(v)
      : Array.isArray(v) ? v.map(curl)
        : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, curl(x)])) : v;
  STORY = curl(STORY);
  DURATION = STORY.total_seconds;
  FPS = STORY.fps;
  await loadFonts();

  const frame = document.getElementById("frame");
  const bg = ui.h("div", { class: "layer bg" });
  const scenesLayer = ui.h("div", { class: "layer scenes" });
  const hudLayer = ui.h("div", { class: "layer hud" });
  frame.append(bg, scenesLayer, hudLayer);

  // No HUD in this project: the global clock still exists for cross-scene hooks.
  BUILD_T0 = 0;
  ui._setBuild({ onFrame: (fn) => GLOBAL_HOOKS.push(fn), warn: (m) => warn("global", m) });
  collect(0);

  const listing = await listScenes();
  for (const st of STORY.scenes) {
    const stage = ui.h("div", { class: "stage", "data-scene": st.n, "data-t0": st.start * 1000 });
    stage.style.zIndex = String(10 + st.n);
    scenesLayer.append(stage);
    const files = pickFiles(st, listing);
    const sc = { n: st.n, start: st.start, end: st.end, pre: 0, post: 0, stage, hooks: [], visible: true, file: files.js };
    SCENES.push(sc);
    BUILD_T0 = st.start * 1000;
    const ctx = makeCtx(sc, st);
    ui._setBuild(ctx);
    try {
      if (!files.js) throw new Error(`no module scenes/${String(st.n).padStart(2, "0")}-*.js`);
      if (files.css) await loadCss(`scenes/${files.css}?v=${files.v}`);
      const mod = await import(`../scenes/${files.js}?v=${files.v}`);
      const def = mod.default;
      if (!def || typeof def.build !== "function") throw new Error("the module must `export default { build(stage, ctx) }`");
      sc.pre = Number(def.pre ?? st.pre ?? 0);
      sc.post = Number(def.post ?? st.post ?? 0);
      await def.build(stage, ctx);
      collect(BUILD_T0);
    } catch (err) {
      const e = recordError(st.n, err);
      stage.append(ui.h("div", { class: "scene-error", text: `S${st.n} ${files.js || ""}\n${e.message}` }));
    }
    ui._setBuild(null);
    BUILD_T0 = null;
  }
  await Promise.all(WAITS);
  await Promise.all([...frame.querySelectorAll("img")].map((i) => i.decode().catch(() => {})));
  await document.fonts.ready;
  collect();
  const t0 = params.has("t") ? Number(params.get("t")) : 0;
  apply(Math.min(Math.max(0, t0), DURATION));
  if (!RENDER) setupPreview(frame);
}

// ── public API ──────────────────────────────────────────────────────────────
let resolveReady;
const ready = new Promise((r) => (resolveReady = r));
window.__video = {
  get duration() { return DURATION; },
  get fps() { return FPS; },
  get time() { return CURRENT; },
  lang: LANG,
  render: RENDER,
  seek,
  apply,
  ready,
  errors: ERRORS,
  warnings: WARNINGS,
  get scenes() {
    return SCENES.map(({ n, start, end, pre, post, file }) => ({ n, start, end, pre, post, file }));
  },
  get animations() { return OWNER.size; },
};
boot()
  .catch((err) => recordError("boot", err))
  .finally(() => resolveReady(true));

// ── preview chrome ──────────────────────────────────────────────────────────
function setupPreview(frame) {
  const { h } = ui;
  const vp = document.getElementById("viewport");
  const scale = () => {
    const s = Math.min((innerWidth - 32) / 1920, (innerHeight - 88 - 24) / 1080);
    vp.style.transform = `translate(${Math.max(16, (innerWidth - 1920 * s) / 2)}px, 12px) scale(${s})`;
  };
  scale();
  addEventListener("resize", scale);

  // grid overlay
  const grid = h("div", { id: "grid" });
  const vline = (x, label) => {
    grid.append(ui.place(h("i"), x, 0, 1, 1080));
    if (label) grid.append(ui.place(h("span", { text: label }), x + 4, 4));
  };
  const hline = (y, label) => {
    grid.append(ui.place(h("i"), 0, y, 1920, 1));
    if (label) grid.append(ui.place(h("span", { text: label }), 4, y + 3));
  };
  [[120, "120"], [960, "960"], [1800, "1800"]].forEach(([x, l]) => vline(x, l));
  [[232, "kicker 232"], [300, "headline 300"], [540, "mid 540"], [1000, "baseline 1000"]]
    .forEach(([y, l]) => hline(y, l));
  frame.append(grid);

  const btn = (label, title, on) => {
    const b = h("button", { text: label, title });
    b.addEventListener("click", on);
    return b;
  };
  const timeEl = h("span", { class: "time" });
  const sceneEl = h("span", { class: "time" });
  const playBtn = btn("▶", "Play / pause (space)", () => toggle());
  const gridBtn = btn("Grid", "Layout grid (g)", () => toggleGrid());
  const loopBtn = btn("Loop scene", "Loop the current scene (l)", () => toggleLoop());
  const langBtn = btn(LANG === "es" ? "ES → EN" : "EN → ES", "Switch language (e)", () => switchLang());
  const scrub = h("div", { id: "scrub" });
  const head = h("div", { class: "head" });
  const segs = SCENES.map((sc) => {
    const seg = h("div", { class: "seg", text: `S${sc.n}` });
    seg.style.left = `${(sc.start / DURATION) * 100}%`;
    seg.style.width = `${((sc.end - sc.start) / DURATION) * 100}%`;
    seg.title = `S${sc.n} · ${sc.file || "missing"} · ${sc.start}–${sc.end}s`;
    scrub.append(seg);
    return seg;
  });
  scrub.append(head);
  const controls = h(
    "div",
    { id: "controls" },
    h(
      "div",
      { class: "row" },
      playBtn,
      btn("⏮", "Start (Home)", () => go(0)),
      btn("◀", "-1 frame (←, shift: -1 s)", () => go(CURRENT - 1 / FPS)),
      btn("▶|", "+1 frame (→, shift: +1 s)", () => go(CURRENT + 1 / FPS)),
      timeEl,
      sceneEl,
      h("span", { class: "spacer" }),
      loopBtn,
      gridBtn,
      langBtn,
    ),
    h("div", { class: "row" }, scrub),
  );
  document.body.append(controls);

  let playing = false;
  let wall0 = 0;
  let from = CURRENT;
  let loop = null;
  const lastFrame = (Math.round(DURATION * FPS) - 1) / FPS;
  const snap = (t) => Math.round(t * FPS) / FPS;
  const sceneAt = (t) => SCENES.find((s) => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];
  function ui_(t) {
    const f = Math.round(t * FPS);
    const sc = sceneAt(t);
    timeEl.textContent = `${t.toFixed(2).padStart(5, "0")} / ${DURATION.toFixed(2)} s · f ${String(f).padStart(4, "0")}`;
    sceneEl.textContent = sc ? `S${sc.n} +${(t - sc.start).toFixed(2)} s` : "";
    head.style.left = `${(t / DURATION) * 100}%`;
    segs.forEach((s, i) => s.classList.toggle("cur", SCENES[i] === sc));
    playBtn.textContent = playing ? "❚❚" : "▶";
    if (ERRORS.length) sceneEl.textContent += ` · ${ERRORS.length} error(s), see console`;
  }
  function go(t) {
    playing = false;
    const tt = Math.min(Math.max(0, snap(t)), lastFrame);
    apply(tt);
    ui_(tt);
    const u = new URL(location.href);
    u.searchParams.set("t", tt.toFixed(3));
    history.replaceState(null, "", u);
  }
  function tick(now) {
    if (!playing) return;
    let t = from + (now - wall0) / 1000;
    const [a, b] = loop || [0, DURATION];
    if (t >= b) {
      from = a;
      wall0 = now;
      t = a;
    }
    apply(t);
    ui_(t);
    requestAnimationFrame(tick);
  }
  function toggle(force) {
    playing = force ?? !playing;
    if (playing) {
      from = CURRENT >= lastFrame ? 0 : CURRENT;
      if (loop && (from < loop[0] || from >= loop[1])) from = loop[0];
      wall0 = performance.now();
      requestAnimationFrame(tick);
    } else go(CURRENT);
    ui_(CURRENT);
  }
  function toggleGrid() {
    grid.classList.toggle("on");
    gridBtn.classList.toggle("on", grid.classList.contains("on"));
  }
  function toggleLoop() {
    const sc = sceneAt(CURRENT);
    loop = loop ? null : [sc.start, sc.end];
    loopBtn.classList.toggle("on", !!loop);
  }
  function switchLang() {
    const u = new URL(location.href);
    u.searchParams.set("lang", LANG === "es" ? "en" : "es");
    u.searchParams.set("t", CURRENT.toFixed(3));
    location.href = u.toString();
  }
  let dragging = false;
  const scrubTo = (e) => {
    const r = scrub.getBoundingClientRect();
    go(((e.clientX - r.left) / r.width) * DURATION);
  };
  scrub.addEventListener("pointerdown", (e) => {
    dragging = true;
    scrub.setPointerCapture(e.pointerId);
    scrubTo(e);
  });
  scrub.addEventListener("pointermove", (e) => dragging && scrubTo(e));
  scrub.addEventListener("pointerup", () => (dragging = false));
  addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 1 : 1 / FPS;
    if (e.code === "Space") toggle();
    else if (e.key === "ArrowLeft") go(CURRENT - step);
    else if (e.key === "ArrowRight") go(CURRENT + step);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(lastFrame);
    else if (e.key === "[") {
      const prev = [...SCENES].reverse().find((s) => s.start < CURRENT - 1e-3);
      go(prev ? prev.start : 0);
    } else if (e.key === "]") {
      const next = SCENES.find((s) => s.start > CURRENT + 1e-3);
      if (next) go(next.start);
    } else if (e.key === "g") toggleGrid();
    else if (e.key === "l") toggleLoop();
    else if (e.key === "e") switchLang();
    else return;
    e.preventDefault();
  });

  if (params.has("scene")) {
    const sc = SCENES.find((s) => s.n === Number(params.get("scene")));
    if (sc) {
      apply(sc.start);
      loop = [sc.start, sc.end];
      loopBtn.classList.add("on");
    }
  }
  if (params.get("grid") === "1") toggleGrid();
  ui_(CURRENT);
  if (!params.has("t") && params.get("paused") !== "1") toggle(true);
}
