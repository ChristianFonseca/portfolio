// S4 · Nothing was broken. That was the problem — absolute 24.5–34.0 s.
//
// The discovery chain draws left to right and stops at node 2: the connector snaps,
// a REFUSED stamp lands, and everything downstream turns to dashed ghosts. Then the
// three things that did NOT happen appear underneath, and the green badge from S1
// returns, untouched, on the same frame. That contrast is the whole scene.

import { shell, watermark } from "../lib/kit.js";

const T = { n0: 0.75, nStep: 0.34, snap: 2.75, refused: 2.95, ghost: 3.35, sil0: 4.6, silStep: 0.5, badge: 6.5 };
const NODE = { w: 262, h: 112, y: 468, gap: 24 };
const X0 = 120;

export default {
  build(stage, ctx) {
    const { ui, story, lang } = ctx;
    const { content } = shell(stage, ctx);
    const S = story.str;
    const labels = S.nodes[lang] || S.nodes.en;

    const wires = ui.svg({});
    content.append(wires);

    const xs = labels.map((_, i) => X0 + i * (NODE.w + NODE.gap));
    const cy = NODE.y + NODE.h / 2;

    // connectors first, so nodes paint over their ends
    const links = [];
    for (let i = 0; i < labels.length - 1; i++) {
      const x1 = xs[i] + NODE.w;
      const x2 = xs[i + 1];
      const p = ui.s("path", {
        d: `M${x1} ${cy} L${x2} ${cy}`,
        stroke: i === 1 ? "#9f1239" : "#232329",
        "stroke-width": 3,
        "stroke-linecap": "round",
      });
      wires.append(p);
      ui.drawPath(p, T.n0 + i * T.nStep + 0.22, 0.28);
      links.push(p);
    }

    // nodes
    const nodes = labels.map((txt, i) => {
      const cls = i === 0 ? "ok" : i === 1 ? "" : "";
      const n = ui.node(txt, { x: xs[i], y: NODE.y, w: NODE.w, h: NODE.h, class: cls });
      content.append(n);
      ui.pop(n, T.n0 + i * T.nStep, { from: 0.9, dur: 0.45 });
      return n;
    });

    // ── the break: link 1→2 snaps and node 2 turns red ──
    ui.anim(links[1], [{ opacity: 1 }, { opacity: 0 }], { at: T.snap, dur: 0.14, ease: "in" });
    const brk = ui.s("path", {
      d: `M${xs[1] + NODE.w + 6} ${cy - 13} L${xs[2] - 6} ${cy + 13} M${xs[1] + NODE.w + 6} ${cy + 13} L${xs[2] - 6} ${cy - 13}`,
      stroke: "#f43f5e",
      "stroke-width": 4,
      "stroke-linecap": "round",
    });
    wires.append(brk);
    ui.anim(brk, [{ opacity: 0 }, { opacity: 1 }], { at: T.snap + 0.08, dur: 0.2, ease: "out" });
    ui.anim(brk, [{ scale: "1.5" }, { scale: "1" }], { at: T.snap + 0.08, dur: 0.4, ease: "spring" });
    brk.style.transformOrigin = `${(xs[1] + NODE.w + xs[2]) / 2}px ${cy}px`;

    ui.anim(nodes[1], [{ borderColor: "#232329" }, { borderColor: "rgba(244,63,94,.7)" }], { at: T.snap, dur: 0.3, ease: "out" });
    ui.anim(nodes[1], [{ background: "#141418" }, { background: "rgba(244,63,94,.1)" }], { at: T.snap, dur: 0.3, ease: "out" });
    ui.anim(nodes[1], [{ translate: "0 0" }, { translate: "-5px 0" }, { translate: "4px 0" }, { translate: "0 0" }], {
      at: T.snap,
      dur: 0.3,
      ease: "out",
    });

    // REFUSED stamp
    const stamp = ui.chip(ui.tr(lang, S.refused), { class: "bad" });
    stamp.style.letterSpacing = ".16em";
    stamp.style.fontWeight = "700";
    ui.place(stamp, xs[1] + 34, NODE.y - 74);
    content.append(stamp);
    ui.pop(stamp, T.refused, { from: 1.25, dur: 0.44 });

    // everything downstream becomes a ghost
    for (let i = 2; i < nodes.length; i++) {
      const at = T.ghost + (i - 2) * 0.1;
      ui.anim(nodes[i], [{ opacity: 1 }, { opacity: 0.32 }], { at, dur: 0.4, ease: "out" });
      nodes[i].classList.add("ghost");
      if (links[i]) ui.anim(links[i], [{ opacity: 1 }, { opacity: 0.25 }], { at, dur: 0.4, ease: "out" });
    }

    // ── the three things that did not happen ──
    const sil = S.silence[lang] || S.silence.en;
    const sy = 700;
    const sw = 420;
    const sgap = 36;
    const sx0 = 960 - (sil.length * sw + (sil.length - 1) * sgap) / 2;
    sil.forEach((txt, i) => {
      const row = ui.h("div");
      ui.place(row, sx0 + i * (sw + sgap), sy, sw, 64);
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "center";
      row.style.gap = "14px";
      row.style.border = "1px dashed #232329";
      row.style.borderRadius = "14px";
      row.style.color = "#57535f";
      row.style.fontFamily = "var(--font-mono)";
      row.style.fontSize = "22px";
      const x = ui.h("span", { text: "✕", style: { color: "#9f1239", fontSize: "20px" } });
      row.append(x, ui.h("span", { text: txt }));
      content.append(row);
      ui.rise(row, T.sil0 + i * T.silStep, { dy: 12, dur: 0.5 });
    });

    // ── and the dashboard is still green ──
    const badge = ui.chip(ui.tr(lang, S.badge), { class: "ok" });
    badge.style.height = "58px";
    badge.style.fontSize = "23px";
    badge.style.letterSpacing = ".1em";
    badge.style.width = "330px";
    badge.style.justifyContent = "center";
    ui.place(badge, 960 - 165, 828);
    content.append(badge);
    ui.pop(badge, T.badge, { from: 0.88, dur: 0.5 });
    const ring = ui.h("i");
    ui.place(ring, 18, 22, 14, 14);
    ring.style.borderRadius = "50%";
    ring.style.background = "#34d399";
    ring.style.opacity = "0";
    badge.append(ring);
    ui.pulse(ring, { at: T.badge + 0.25, period: 2, to: 2.4, hi: 0.5 });

    watermark(content, ctx, 1.2);
  },
};
