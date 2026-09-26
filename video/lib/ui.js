// Explainer video — shared helpers (ctx.ui inside every scene).
//
// TIME: every `at` / `dur` is in SECONDS, relative to the scene start (the runtime
// offsets each scene's clock). Animations are Web Animations only; the runtime
// pauses them all and sets currentTime on every seek, so every frame is a pure
// function of time. Anything WAAPI cannot express (text content, canvas) goes
// through ui.frame(fn), a hook called with the scene-local time on every seek.
//
// FILL RULE: anim() picks fill automatically — the FIRST animation of a property on
// an element gets fill 'both' (so it holds its start value before `at`), later ones
// get 'forwards'. Create the animations of one element + property in chronological
// order. Prefer individual transform properties (translate / scale / rotate) so
// moves, pops and floats compose instead of fighting over `transform`.
//
// LAYOUT: helpers that measure (headline, kicker) need the element in the DOM
// already — append first, then animate.

export const W = 1920;
export const H = 1080;
export const FPS = 30;

// ── Brand tokens ────────────────────────────────────────────────────────────
// Same values as the site's globals.css (dark theme), converted from oklch.
export const C = {
  bg: "#000000",
  bg2: "#080808",
  card: "#0d0d0f",
  cardUp: "#141418",
  border: "#232329",
  borderSoft: "#1a1a1f",
  fg: "#eeeeee",
  dim: "#9a8fb0", // muted-foreground
  faint: "#57535f",
  primary: "#a855f7", // purple
  primaryDim: "#7a3fb5",
  primaryLight: "#c78dff",
  accent: "#ec4899", // pink
  accentDim: "#a8336c",
  ok: "#34d399",
  okDim: "#1d7d5b",
  warn: "#fbbf24",
  bad: "#f43f5e",
  badDim: "#9f1239",
};

// ── Easings ─────────────────────────────────────────────────────────────────
export const E = {
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  in: "cubic-bezier(0.64, 0, 0.78, 0)",
  inout: "cubic-bezier(0.65, 0, 0.35, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  linear: "linear",
};
const bez = (p1x, p1y, p2x, p2y) => (u) => {
  // Newton solve for x(t)=u, then return y(t). Deterministic, no state.
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  let t = u;
  for (let i = 0; i < 8; i++) {
    const x = ((ax * t + bx) * t + cx) * t - u;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(d) < 1e-6) break;
    t -= x / d;
  }
  t = Math.min(1, Math.max(0, t));
  return ((ay * t + by) * t + cy) * t;
};
export const ease = {
  linear: (u) => u,
  out: bez(0.22, 1, 0.36, 1),
  in: bez(0.64, 0, 0.78, 0),
  inout: bez(0.65, 0, 0.35, 1),
  spring: bez(0.34, 1.56, 0.64, 1),
};

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const round2 = (v) => Math.round(v * 100) / 100;
/** Eased 0→1 progress of a beat that starts at `at` and lasts `dur`. */
export function progress(t, at, dur, e = "linear") {
  const u = clamp((t - at) / Math.max(dur, 1e-6));
  return (ease[e] || ease.linear)(u);
}
/** Seeded PRNG (mulberry32) so "random" layouts are identical every render. */
export function mulberry32(seed = 4) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Build context (set by the runtime around each scene's build) ────────────
let BUILD = null;
export function _setBuild(ctx) {
  BUILD = ctx;
}
/** Register fn(tLocal) to run on every seek while the scene is visible. Must be pure in t. */
export function frame(fn, opts) {
  if (!BUILD) throw new Error("ui.frame() outside a scene build");
  BUILD.onFrame(fn, opts);
  return fn;
}
export function warn(msg) {
  if (BUILD && BUILD.warn) BUILD.warn(msg);
  else console.warn(msg);
}

// ── DOM ─────────────────────────────────────────────────────────────────────
/** h('div', {class, style:{...}, text, html, ...attrs}, ...children) → HTMLElement */
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  apply(el, props);
  for (const k of kids.flat()) if (k != null) el.append(k);
  return el;
}
const SVG_NS = "http://www.w3.org/2000/svg";
/** s('path', {d, fill, ...}) → SVGElement */
export function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null) continue;
    if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k === "text") el.textContent = String(v);
    else el.setAttribute(k, String(v));
  }
  for (const k of kids.flat()) if (k != null) el.append(k);
  return el;
}
function apply(el, props) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null) continue;
    if (k === "class") el.className = v;
    else if (k === "style") Object.assign(el.style, v);
    else if (k === "text") el.textContent = String(v);
    else if (k === "html") el.innerHTML = v;
    else if (k === "dataset") Object.assign(el.dataset, v);
    else el.setAttribute(k, String(v));
  }
}
/** Absolutely position an element in canvas px. */
export function place(el, x, y, w, hgt) {
  el.style.position = "absolute";
  el.style.left = x + "px";
  el.style.top = y + "px";
  if (w != null) el.style.width = w + "px";
  if (hgt != null) el.style.height = hgt + "px";
  return el;
}
export function css(el, style) {
  Object.assign(el.style, style);
  return el;
}
/** An SVG root sized to the canvas, for strokes/paths that must overlay everything. */
export function svg(o = {}) {
  const el = s("svg", {
    viewBox: `0 0 ${o.w || W} ${o.h || H}`,
    width: o.w || W,
    height: o.h || H,
    fill: "none",
    style: { position: "absolute", left: (o.x || 0) + "px", top: (o.y || 0) + "px", overflow: "visible" },
  });
  return el;
}

// ── Animation ───────────────────────────────────────────────────────────────
export function easing(e) {
  return E[e] || e || "linear";
}
const SEEN = new WeakMap(); // el → Set of property keys already animated
function fillFor(el, keyframes) {
  const props = new Set();
  const list = Array.isArray(keyframes) ? keyframes : [keyframes];
  for (const kf of list) for (const k of Object.keys(kf)) if (k !== "offset" && k !== "easing") props.add(k);
  let seen = SEEN.get(el);
  if (!seen) SEEN.set(el, (seen = new Set()));
  let first = false;
  for (const p of props) {
    if (!seen.has(p)) {
      first = true;
      seen.add(p);
    }
  }
  return first ? "both" : "forwards";
}
/**
 * el.animate() in scene seconds. Options: at, dur, ease, iterations, direction,
 * fill (auto if omitted, see FILL RULE), composite, pseudo.
 */
export function anim(el, keyframes, o = {}) {
  const opts = {
    delay: (o.at || 0) * 1000,
    duration: (o.dur == null ? 0.4 : o.dur) * 1000,
    easing: easing(o.ease || "out"),
    fill: o.fill || fillFor(el, keyframes),
  };
  if (o.iterations != null) opts.iterations = o.iterations;
  if (o.direction) opts.direction = o.direction;
  if (o.composite) opts.composite = o.composite;
  if (o.pseudo) opts.pseudoElement = o.pseudo;
  return el.animate(keyframes, opts);
}
/** Visible only during [from, to). Base style is hidden, so nothing leaks between scenes. */
export function show(el, from, to = 1e5) {
  el.style.visibility = "hidden";
  anim(el, [{ visibility: "visible" }, { visibility: "visible" }], { at: from, dur: Math.max(to - from, 0.001), ease: "linear" });
  return el;
}
export function fadeIn(el, at, dur = 0.35, o = {}) {
  return anim(el, [{ opacity: 0 }, { opacity: o.to ?? 1 }], { at, dur, ease: o.ease || "out" });
}
export function fadeOut(el, at, dur = 0.28, o = {}) {
  return anim(el, [{ opacity: o.from ?? 1 }, { opacity: 0 }], { at, dur, ease: o.ease || "in" });
}
/** Fade in while rising `dy` px (the default entrance). */
export function rise(el, at, o = {}) {
  const dy = o.dy ?? 18;
  const dur = o.dur ?? 0.5;
  anim(el, [{ opacity: 0 }, { opacity: 1 }], { at, dur: dur * 0.7, ease: "out" });
  return anim(el, [{ translate: `0 ${dy}px` }, { translate: "0 0" }], { at, dur, ease: o.ease || "out" });
}
export function move(el, at, dur, from, to, e = "inout") {
  return anim(el, [{ translate: from }, { translate: to }], { at, dur, ease: e });
}
export function scaleTo(el, at, dur, from, to, e = "inout") {
  return anim(el, [{ scale: String(from) }, { scale: String(to) }], { at, dur, ease: e });
}
export function pop(el, at, o = {}) {
  anim(el, [{ opacity: 0 }, { opacity: 1 }], { at, dur: 0.16, ease: "out" });
  return anim(el, [{ scale: String(o.from ?? 0.82) }, { scale: String(o.to ?? 1) }], {
    at,
    dur: o.dur ?? 0.42,
    ease: o.ease || "spring",
  });
}
/** Endless gentle float; deterministic because it is a paused, seeked animation. */
export function float(el, o = {}) {
  const amp = o.amp ?? 5;
  const period = o.period ?? 4;
  return anim(el, [{ translate: `0 ${-amp}px` }, { translate: `0 ${amp}px` }, { translate: `0 ${-amp}px` }], {
    at: o.at ?? 0,
    dur: period,
    ease: "inout",
    iterations: Infinity,
    fill: "both",
  });
}
/** Draw an SVG path by animating its dash offset. Needs the path in the DOM. */
export function drawPath(path, at, dur, o = {}) {
  const len = path.getTotalLength ? path.getTotalLength() : o.length || 1000;
  path.style.strokeDasharray = String(len);
  return anim(path, [{ strokeDashoffset: String(o.reverse ? -len : len) }, { strokeDashoffset: "0" }], {
    at,
    dur,
    ease: o.ease || "inout",
  });
}
/** Blink between two opacities (cursor, live dot). */
export function blink(el, at, period = 1.0, o = {}) {
  return anim(el, [{ opacity: o.hi ?? 1 }, { opacity: o.hi ?? 1 }, { opacity: o.lo ?? 0.15 }, { opacity: o.lo ?? 0.15 }], {
    at,
    dur: period,
    ease: "linear",
    iterations: Infinity,
    fill: "both",
  });
}
/** Pulsing halo for "this is alive" dots. */
export function pulse(el, o = {}) {
  anim(el, [{ scale: "1" }, { scale: String(o.to ?? 1.9) }], { at: o.at ?? 0, dur: o.period ?? 1.8, ease: "out", iterations: Infinity, fill: "both" });
  return anim(el, [{ opacity: o.hi ?? 0.5 }, { opacity: 0 }], { at: o.at ?? 0, dur: o.period ?? 1.8, ease: "out", iterations: Infinity, fill: "both" });
}

// ── Text driven by the clock (ui.frame) ─────────────────────────────────────
/** Type `text` character by character between `at` and `at+dur`. */
export function typeText(el, text, o = {}) {
  const at = o.at ?? 0;
  const dur = o.dur ?? Math.min(2.2, 0.035 * text.length);
  frame((t) => {
    const u = clamp((t - at) / Math.max(dur, 1e-6));
    const n = Math.round(u * text.length);
    el.textContent = text.slice(0, n);
  });
  return el;
}
/** Count from `from` to `to` between at and at+dur. fmt(v) formats it. */
export function countUp(el, o = {}) {
  const { from = 0, to = 100, at = 0, dur = 1, fmt = (v) => String(Math.round(v)) } = o;
  frame((t) => {
    el.textContent = fmt(lerp(from, to, progress(t, at, dur, o.ease || "out")));
  });
  return el;
}
/** Reveal nodes one by one with a stagger. */
export function revealSeq(nodes, o = {}) {
  const at = o.at ?? 0;
  const step = o.step ?? 0.12;
  nodes.forEach((n, i) => rise(n, at + i * step, { dy: o.dy ?? 12, dur: o.dur ?? 0.45 }));
  return nodes;
}

// ── Markup + typography ─────────────────────────────────────────────────────
/** Straight apostrophes between letters → ’ */
export function smartQuotes(str) {
  return String(str).replace(/(\w)'(\w)/g, "$1’$2");
}
/**
 * Inline markup for headlines:
 *   *word*  → gradient (purple→pink), the brand emphasis
 *   ~word~  → accent pink
 *   `word`  → mono, dim
 * Returns an array of {text, kind} tokens.
 */
export function parseMarkup(text) {
  const out = [];
  const re = /(\*[^*]+\*|~[^~]+~|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), kind: "plain" });
    const raw = m[0];
    const kind = raw[0] === "*" ? "grad" : raw[0] === "~" ? "accent" : "mono";
    out.push({ text: raw.slice(1, -1), kind });
    last = m.index + raw.length;
  }
  if (last < text.length) out.push({ text: text.slice(last), kind: "plain" });
  return out;
}
/**
 * Headline: Space Grotesk, words rise in with a stagger from `at`; the block fades
 * and rises 12px at `out`. Markup per parseMarkup. Returns {el, words}.
 */
export function headline(parent, text, o = {}) {
  const el = h("div", { class: "headline" + (o.class ? " " + o.class : "") });
  if (o.size) el.style.fontSize = o.size + "px";
  if (o.align) el.style.textAlign = o.align;
  place(el, o.x ?? 120, o.y ?? 300, o.w ?? 1680);
  const words = [];
  for (const tok of parseMarkup(smartQuotes(text))) {
    for (const piece of tok.text.split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) {
        el.append(document.createTextNode(" "));
        continue;
      }
      const w = h("span", { class: "w " + tok.kind, text: piece });
      el.append(w);
      words.push(w);
    }
  }
  parent.append(el);
  const at = o.at ?? 0;
  words.forEach((w, i) => {
    anim(w, [{ opacity: 0 }, { opacity: 1 }], { at: at + i * (o.step ?? 0.05), dur: 0.34, ease: "out" });
    anim(w, [{ translate: "0 22px" }, { translate: "0 0" }], { at: at + i * (o.step ?? 0.05), dur: 0.56, ease: "out" });
  });
  if (o.out != null) {
    anim(el, [{ opacity: 1 }, { opacity: 0 }], { at: o.out, dur: 0.25, ease: "in" });
    anim(el, [{ translate: "0 0" }, { translate: "0 -12px" }], { at: o.out, dur: 0.25, ease: "in" });
  }
  return { el, words };
}
/** Kicker: JetBrains Mono caps, dim, with a small gradient dot. */
export function kicker(parent, text, o = {}) {
  const el = h("div", { class: "kicker" });
  place(el, o.x ?? 120, o.y ?? 232);
  el.append(h("i", { class: "dot" }), h("span", { text: smartQuotes(text) }));
  parent.append(el);
  if (o.at != null) rise(el, o.at, { dy: 8, dur: 0.4 });
  if (o.out != null) fadeOut(el, o.out);
  return el;
}
/** Pick a localized string from {es, en}; plain strings pass through. */
export function tr(lang, o) {
  if (o == null) return "";
  if (typeof o === "string") return o;
  return o[lang] ?? o.en ?? o.es ?? "";
}

// ── Mockup kit ──────────────────────────────────────────────────────────────
/** Card: dark surface, hairline border, soft shadow. */
export function card(o = {}) {
  const el = h("div", { class: "card" + (o.class ? " " + o.class : "") });
  place(el, o.x ?? 0, o.y ?? 0, o.w ?? 400, o.h ?? 200);
  if (o.radius) el.style.borderRadius = o.radius + "px";
  return el;
}
/** Browser/terminal chrome window with a title bar. */
export function window_(o = {}) {
  const el = card({ ...o, class: "win " + (o.class || "") });
  const bar = h("div", { class: "winbar" });
  bar.append(h("i", { class: "led" }), h("i", { class: "led" }), h("i", { class: "led" }));
  if (o.title) bar.append(h("span", { class: "wintitle", text: o.title }));
  const body = h("div", { class: "winbody" });
  el.append(bar, body);
  el.body = body;
  return el;
}
/** Status row: label + value + state dot (ok | bad | warn | idle). */
export function statRow(label, value, state = "ok") {
  const row = h("div", { class: "statrow" });
  row.append(
    h("i", { class: "sdot " + state }),
    h("span", { class: "slabel", text: label }),
    h("span", { class: "sval " + state, text: value }),
  );
  row.valueEl = row.querySelector(".sval");
  row.dotEl = row.querySelector(".sdot");
  return row;
}
/** Big metric tile. */
export function tile(o = {}) {
  const el = card({ ...o, class: "tile " + (o.class || "") });
  const v = h("div", { class: "tval", text: o.value ?? "" });
  const l = h("div", { class: "tlabel", text: o.label ?? "" });
  el.append(v, l);
  el.valueEl = v;
  el.labelEl = l;
  return el;
}
/** Small pill/chip. */
export function chip(text, o = {}) {
  const el = h("div", { class: "chip " + (o.class || ""), text });
  if (o.x != null) place(el, o.x, o.y);
  return el;
}
/** A labelled node box for flow diagrams. */
export function node(text, o = {}) {
  const el = h("div", { class: "fnode " + (o.class || "") });
  place(el, o.x, o.y, o.w, o.h);
  el.append(h("span", { text: smartQuotes(text) }));
  return el;
}
/** Straight/elbow connector path between two points, as an SVG path element. */
export function connector(svgRoot, from, to, o = {}) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const d =
    o.elbow === "h"
      ? `M${x1} ${y1} H${(x1 + x2) / 2} V${y2} H${x2}`
      : o.elbow === "v"
        ? `M${x1} ${y1} V${(y1 + y2) / 2} H${x2} V${y2}`
        : `M${x1} ${y1} L${x2} ${y2}`;
  const p = s("path", {
    d,
    stroke: o.stroke || C.border,
    "stroke-width": o.width || 2,
    "stroke-linecap": "round",
    fill: "none",
    "stroke-dasharray": o.dash || null,
  });
  svgRoot.append(p);
  return p;
}
