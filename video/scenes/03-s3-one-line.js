// S3 · One line, left over from development — absolute 16.0–24.5 s.
//
// The file types itself out. The third line is the one that matters, so it lands
// last, gets a red box and a margin arrow, and the two captions underneath give it
// its history: right yesterday, wrong today. No zoom, no shake — the line does not
// need drama, it needs to be readable.

import { shell, watermark } from "../lib/kit.js";

const T = { win: 0.8, line0: 1.35, lineStep: 0.44, markAt: 3.9, then: 5.0, now: 5.9 };
const WIN = { x: 430, y: 400, w: 1060, h: 336 };
const PAD = { x: 34, y: 26 };
const LH = 44; // line height in px, must match .code line-height at 27px

export default {
  build(stage, ctx) {
    const { ui, story, lang } = ctx;
    const { content } = shell(stage, ctx);
    const S = story.str;

    const win = ui.window_({ x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, title: S.file });
    content.append(win);
    ui.pop(win, T.win, { from: 0.965, dur: 0.6 });
    ui.float(win, { amp: 3.5, period: 10 });

    let flaggedTop = 0;
    let flaggedText = "";
    S.lines.forEach((ln, i) => {
      const txt = lang === "es" && ln.t_es ? ln.t_es : ln.t;
      if (!txt) return;
      const at = T.line0 + i * T.lineStep;
      const el = ui.h("div", { class: "code" + (ln.cls ? " " : "") });
      ui.place(el, PAD.x, PAD.y + i * LH);
      const span = ui.h("span", { class: ln.cls || "" });
      el.append(span);
      win.body.append(el);
      ui.typeText(span, txt, { at, dur: Math.min(0.5, 0.022 * txt.length) });
      ui.fadeIn(el, at, 0.12);
      if (ln.flag) {
        flaggedTop = PAD.y + i * LH;
        flaggedText = txt;
      }
    });

    // the box around the offending line
    const mark = ui.h("div", { class: "mark" });
    const mw = flaggedText.length * 16.3 + 26;
    ui.place(mark, WIN.x + PAD.x - 13, WIN.y + 52 + flaggedTop - 7, mw, 46);
    content.append(mark);
    ui.anim(mark, [{ opacity: 0 }, { opacity: 1 }], { at: T.markAt, dur: 0.22, ease: "out" });
    ui.anim(mark, [{ scale: "1.06" }, { scale: "1" }], { at: T.markAt, dur: 0.38, ease: "spring" });
    ui.pulse(
      (() => {
        const glow = ui.h("div");
        ui.place(glow, WIN.x + PAD.x - 13, WIN.y + 52 + flaggedTop - 7, mw, 46);
        glow.style.borderRadius = "8px";
        glow.style.background = "rgba(244,63,94,.18)";
        glow.style.opacity = "0";
        content.append(glow);
        return glow;
      })(),
      { at: T.markAt + 0.2, period: 2.4, to: 1.02, hi: 0.5 },
    );

    // margin arrow pointing at it
    const arrow = ui.svg({ w: 1920, h: 1080 });
    content.append(arrow);
    const ay = WIN.y + 52 + flaggedTop + 16;
    const ap = ui.s("path", {
      d: `M${WIN.x - 118} ${ay} L${WIN.x - 34} ${ay}`,
      stroke: "#f43f5e",
      "stroke-width": 3,
      "stroke-linecap": "round",
    });
    const ah = ui.s("path", {
      d: `M${WIN.x - 50} ${ay - 9} L${WIN.x - 32} ${ay} L${WIN.x - 50} ${ay + 9}`,
      stroke: "#f43f5e",
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      fill: "none",
    });
    arrow.append(ap, ah);
    ui.drawPath(ap, T.markAt - 0.25, 0.4);
    ui.anim(ah, [{ opacity: 0 }, { opacity: 1 }], { at: T.markAt + 0.1, dur: 0.2, ease: "out" });

    // history: right yesterday, wrong today
    const capY = WIN.y + WIN.h + 58;
    const then = ui.h("div", { class: "sub", text: ui.tr(lang, S.then) });
    ui.place(then, 430, capY, 1060);
    then.style.fontSize = "30px";
    then.style.textAlign = "center";
    content.append(then);
    ui.rise(then, T.then, { dy: 12, dur: 0.5 });

    const now = ui.h("div", { class: "sub", text: ui.tr(lang, S.now) });
    ui.place(now, 430, capY + 52, 1060);
    now.style.fontSize = "30px";
    now.style.textAlign = "center";
    now.style.color = "#fda4b4";
    now.style.fontWeight = "600";
    content.append(now);
    ui.rise(now, T.now, { dy: 12, dur: 0.5 });

    watermark(content, ctx, 1.2);
  },
};
