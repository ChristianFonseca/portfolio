// S6 · The view from outside — absolute 42.0–51.0 s.
//
// Two stacks of checks. The left one is everything that runs inside the system and
// it signs off green. The right one runs from somewhere the system does not control
// and it comes back red. Same site, same minute, opposite verdicts — which is the
// argument for having the second column at all.

import { shell, watermark, divider } from "../lib/kit.js";

const T = { cols: 0.8, items: 1.5, itemStep: 0.34, verdictIn: 3.7, verdictOut: 5.2 };
const COL = { y: 388, w: 740, h: 400 };
const LX = 132;
const RX = 1048;

export default {
  build(stage, ctx) {
    const { ui, story, lang } = ctx;
    const { content } = shell(stage, ctx, { headSize: 62, headW: 1720 });
    const S = story.str;

    const column = (x, spec, kind, delay) => {
      const bad = kind === "out";
      const c = ui.card({ x, y: COL.y, w: COL.w, h: COL.h });
      c.style.borderColor = bad ? "rgba(168,85,247,.4)" : "#232329";
      content.append(c);
      ui.pop(c, T.cols + delay, { from: 0.95, dur: 0.55 });

      const title = ui.h("div", {
        class: "mono",
        text: ui.tr(lang, spec.title),
        style: {
          position: "absolute", left: "40px", top: "34px", fontSize: "25px", fontWeight: "700",
          letterSpacing: ".16em", color: bad ? "#c78dff" : "#9a8fb0",
        },
      });
      const sub = ui.h("div", {
        text: ui.tr(lang, spec.sub),
        style: {
          position: "absolute", left: "40px", top: "70px", fontSize: "22px", fontWeight: "500",
          color: "#57535f",
        },
      });
      c.append(title, sub);
      ui.fadeIn(title, T.cols + delay + 0.2, 0.4);
      ui.fadeIn(sub, T.cols + delay + 0.3, 0.4);

      const items = spec.items[lang] || spec.items.en;
      items.forEach((txt, i) => {
        const row = ui.h("div");
        ui.place(row, 40, 126 + i * 62, COL.w - 80, 52);
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "16px";
        const mark = ui.h("i");
        mark.style.width = "26px";
        mark.style.height = "26px";
        mark.style.borderRadius = "50%";
        mark.style.flex = "none";
        mark.style.display = "flex";
        mark.style.alignItems = "center";
        mark.style.justifyContent = "center";
        mark.style.fontSize = "16px";
        mark.style.fontWeight = "700";
        mark.style.background = bad ? "rgba(168,85,247,.16)" : "rgba(52,211,153,.14)";
        mark.style.color = bad ? "#c78dff" : "#34d399";
        mark.textContent = bad ? "?" : "✓";
        const lbl = ui.h("span", {
          text: txt,
          style: { fontSize: "25px", fontWeight: "500", color: "#d6d6de" },
        });
        row.append(mark, lbl);
        c.append(row);
        ui.rise(row, T.items + delay + i * T.itemStep, { dy: 10, dur: 0.44 });
      });

      // verdict strip at the foot of the column
      const vAt = bad ? T.verdictOut : T.verdictIn;
      const v = ui.h("div", {
        text: ui.tr(lang, bad ? S.verdictOut : S.verdictIn),
        style: {
          position: "absolute", left: "40px", top: COL.h - 78 + "px", width: COL.w - 80 + "px", height: "54px",
          display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "14px",
          fontFamily: "var(--font-mono)", fontSize: "23px", fontWeight: "700", letterSpacing: ".06em",
          background: bad ? "rgba(244,63,94,.12)" : "rgba(52,211,153,.1)",
          border: bad ? "1px solid rgba(244,63,94,.45)" : "1px solid rgba(52,211,153,.32)",
          color: bad ? "#fda4b4" : "#6ee7b7",
        },
      });
      c.append(v);
      ui.pop(v, vAt, { from: 0.9, dur: 0.5 });
      if (bad) {
        ui.anim(v, [{ translate: "0 0" }, { translate: "-4px 0" }, { translate: "3px 0" }, { translate: "0 0" }], {
          at: vAt + 0.1,
          dur: 0.32,
          ease: "out",
        });
      }
      return c;
    };

    column(LX, S.inside, "in", 0);
    column(RX, S.outside, "out", 0.14);
    divider(content, ctx, 960, COL.y + 24, COL.h - 48);

    // the two verdicts are about the same site, at the same minute
    const link = ui.svg({});
    content.append(link);
    const y = COL.y + COL.h + 46;
    const p = ui.s("path", {
      d: `M${LX + COL.w / 2} ${y} L${LX + COL.w / 2} ${y + 26} L${RX + COL.w / 2} ${y + 26} L${RX + COL.w / 2} ${y}`,
      stroke: "#232329",
      "stroke-width": 2,
      fill: "none",
    });
    link.append(p);
    ui.drawPath(p, T.verdictOut + 0.4, 0.6);

    watermark(content, ctx, 1.2);
  },
};
