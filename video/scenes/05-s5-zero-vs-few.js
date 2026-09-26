// S5 · Zero is not a small number — absolute 34.0–42.0 s.
//
// Two diagnoses side by side, because they look like the same chart and are not the
// same problem. FEW gets a small bar and a fix you can write your way out of. ZERO
// gets a flat line and a fix you cannot. The closing line says why your own
// analytics cannot tell you which one you are in.

import { shell, watermark, divider } from "../lib/kit.js";

const T = { panels: 0.8, bars: 1.5, diag: 2.5, fix: 3.4, note: 5.3 };
const P = { y: 396, w: 690, h: 352 };
const LX = 155;
const RX = 1075;

export default {
  build(stage, ctx) {
    const { ui, story, lang } = ctx;
    const { content } = shell(stage, ctx, { headSize: 62, headW: 1720 });
    const S = story.str;

    const panel = (x, spec, isZero, delay) => {
      const c = ui.card({ x, y: P.y, w: P.w, h: P.h, class: isZero ? "up" : "" });
      if (isZero) c.style.borderColor = "rgba(244,63,94,.38)";
      content.append(c);
      ui.pop(c, T.panels + delay, { from: 0.95, dur: 0.55 });

      const title = ui.h("div", {
        class: "mono",
        text: ui.tr(lang, spec.title),
        style: {
          position: "absolute", left: "44px", top: "36px", fontSize: "26px", fontWeight: "700",
          letterSpacing: ".18em", color: isZero ? "#f43f5e" : "#9a8fb0",
        },
      });
      c.append(title);
      ui.fadeIn(title, T.panels + delay + 0.2, 0.4);

      // the chart: a few bars vs a flat floor
      const chartY = 96;
      const bw = 44;
      const bgap = 20;
      const n = 8;
      const cx0 = 44;
      const heights = isZero ? Array(n).fill(0) : [26, 41, 33, 52, 38, 61, 45, 56];
      heights.forEach((hh, i) => {
        const bar = ui.h("div");
        const bx = cx0 + i * (bw + bgap);
        ui.place(bar, bx, chartY + 96 - Math.max(hh, 3), bw, Math.max(hh, 3));
        bar.style.borderRadius = "6px";
        bar.style.background = isZero ? "rgba(244,63,94,.35)" : "linear-gradient(180deg,#a855f7,#7a3fb5)";
        bar.style.transformOrigin = "bottom";
        c.append(bar);
        ui.anim(bar, [{ scale: "1 0" }, { scale: "1 1" }], {
          at: T.bars + delay + i * 0.05,
          dur: 0.5,
          ease: "out",
        });
      });
      // baseline
      const base = ui.h("div");
      ui.place(base, cx0, chartY + 96, n * (bw + bgap) - bgap, 2);
      base.style.background = isZero ? "rgba(244,63,94,.6)" : "#232329";
      c.append(base);
      ui.anim(base, [{ scale: "0 1" }, { scale: "1 1" }], { at: T.bars + delay, dur: 0.5, ease: "out" });
      base.style.transformOrigin = "left";

      const diag = ui.h("div", {
        text: ui.tr(lang, spec.diag),
        style: {
          position: "absolute", left: "44px", top: "244px", width: P.w - 88 + "px",
          fontSize: "27px", fontWeight: "600", lineHeight: "1.3", color: "#eeeeee",
        },
      });
      c.append(diag);
      ui.rise(diag, T.diag + delay, { dy: 10, dur: 0.45 });

      const fix = ui.h("div", {
        text: ui.tr(lang, spec.fix),
        style: {
          position: "absolute", left: "44px", top: "292px", width: P.w - 88 + "px",
          fontSize: "25px", fontWeight: "500", lineHeight: "1.3",
          color: isZero ? "#fda4b4" : "#9a8fb0",
        },
      });
      c.append(fix);
      ui.rise(fix, T.fix + delay, { dy: 10, dur: 0.45 });
      return c;
    };

    panel(LX, S.few, false, 0);
    panel(RX, S.zero, true, 0.14);
    divider(content, ctx, 960, P.y + 30, P.h - 60);

    const note = ui.h("div", { class: "sub", text: ui.tr(lang, S.note) });
    ui.place(note, 240, 826, 1440);
    note.style.textAlign = "center";
    note.style.fontSize = "31px";
    note.style.lineHeight = "1.36";
    note.style.color = "#c9c9d4";
    content.append(note);
    ui.rise(note, T.note, { dy: 14, dur: 0.6 });

    watermark(content, ctx, 1.2);
  },
};
