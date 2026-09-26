// S2 · And nobody was reading — absolute 7.5–16.0 s.
//
// Two counters race each other: articles published climbs 0→7 while readers from
// search stays at a hard zero. A month strip (JUN…SEP) advances underneath, so the
// zero is visibly three months long, not a bad afternoon. The zero gets the only
// red in the scene; everything else stays calm.

import { shell, watermark, divider } from "../lib/kit.js";

const T = { panels: 0.9, pub: 1.6, months: 2.0, monthStep: 1.15, zeroPulse: 5.2, note: 6.1 };
const L = { x: 300, y: 452, w: 600, h: 232 }; // published
const R = { x: 1020, y: 452, w: 600, h: 232 }; // readers

export default {
  build(stage, ctx) {
    const { ui, story, lang } = ctx;
    const { content } = shell(stage, ctx);
    const S = story.str;

    // ── left: articles published, counts up ──
    const pub = ui.tile({ x: L.x, y: L.y, w: L.w, h: L.h, value: "0", label: ui.tr(lang, S.published) });
    pub.valueEl.classList.add("grad");
    content.append(pub);
    ui.pop(pub, T.panels, { from: 0.94, dur: 0.55 });
    ui.countUp(pub.valueEl, { from: 0, to: 7, at: T.pub, dur: 2.6, ease: "inout" });

    // ── right: readers from search, stuck at zero ──
    const rd = ui.tile({ x: R.x, y: R.y, w: R.w, h: R.h, value: "0", label: ui.tr(lang, S.readers) });
    rd.valueEl.classList.add("bad");
    content.append(rd);
    ui.pop(rd, T.panels + 0.12, { from: 0.94, dur: 0.55 });
    // it never moves: a faint red ring keeps insisting on it
    const ring = ui.h("div");
    ui.place(ring, R.x + R.w / 2 - 92, R.y + 24, 184, 184);
    ring.style.borderRadius = "50%";
    ring.style.border = "2px solid rgba(244,63,94,.45)";
    ring.style.opacity = "0";
    content.append(ring);
    ui.pulse(ring, { at: T.zeroPulse, period: 2.2, to: 1.35, hi: 0.55 });

    divider(content, ctx, 960, L.y + 20, L.h - 40);

    // ── month strip: the zero lasts three months ──
    const months = S.months[lang] || S.months.en;
    const stripY = 812;
    const gap = 232;
    const x0 = 960 - ((months.length - 1) * gap) / 2;
    const track = ui.h("div");
    ui.place(track, x0 - 40, stripY + 21, (months.length - 1) * gap + 80, 2);
    track.style.background = "linear-gradient(90deg, transparent, #232329 12%, #232329 88%, transparent)";
    content.append(track);
    ui.fadeIn(track, T.months - 0.3, 0.5);

    months.forEach((m, i) => {
      const at = T.months + i * T.monthStep;
      const box = ui.h("div");
      ui.place(box, x0 + i * gap - 100, stripY, 200, 44);
      box.style.textAlign = "center";
      const dot = ui.h("i");
      ui.place(dot, x0 + i * gap - 7, stripY + 15, 14, 14);
      dot.style.borderRadius = "50%";
      dot.style.background = "#232329";
      content.append(dot);
      const lbl = ui.h("div", { class: "mono", text: m });
      ui.place(lbl, x0 + i * gap - 100, stripY + 48, 200);
      lbl.style.textAlign = "center";
      lbl.style.fontSize = "22px";
      lbl.style.letterSpacing = ".12em";
      lbl.style.color = "#57535f";
      content.append(lbl);
      ui.anim(dot, [{ background: "#232329" }, { background: "#9f1239" }], { at, dur: 0.3, ease: "out" });
      ui.anim(dot, [{ scale: "1" }, { scale: "1.45" }, { scale: "1" }], { at, dur: 0.5, ease: "out" });
      ui.anim(lbl, [{ color: "#57535f" }, { color: "#9a8fb0" }], { at, dur: 0.3, ease: "out" });
      ui.fadeIn(lbl, T.months - 0.2 + i * 0.1, 0.4);
    });

    // ── the line that reframes it ──
    const note = ui.h("div", { class: "sub", text: ui.tr(lang, S.note) });
    ui.place(note, 120, 930, 1680);
    note.style.textAlign = "center";
    note.style.fontSize = "32px";
    note.style.color = "#c9c9d4";
    content.append(note);
    ui.rise(note, T.note, { dy: 14, dur: 0.6 });

    watermark(content, ctx, 1.2);
  },
};
