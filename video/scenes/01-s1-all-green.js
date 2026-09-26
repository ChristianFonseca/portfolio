// S1 · Everything was green — absolute 0.0–7.5 s.
//
// A production status window fills in row by row; every dot lands green and the
// value counts up to a reassuring number. It closes on a green "all systems
// normal" badge. The whole point is that this frame is honest: the instruments
// really do say this. Nothing here is a lie, and nothing here is the truth.

import { shell, watermark } from "../lib/kit.js";

const T = { win: 1.25, row0: 1.9, rowStep: 0.42, badge: 4.6 };
const WIN = { x: 390, y: 424, w: 1140, h: 380 };

export default {
  build(stage, ctx) {
    const { ui, story, lang } = ctx;
    const { content } = shell(stage, ctx);
    const S = story.str;

    const win = ui.window_({ x: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h, title: ui.tr(lang, S.win) });
    content.append(win);
    ui.pop(win, T.win, { from: 0.965, dur: 0.6 });
    ui.float(win, { amp: 4, period: 9 });

    // live dot in the title bar
    const live = ui.h("i", { class: "sdot ok" });
    live.style.marginLeft = "auto";
    win.querySelector(".winbar").append(live);
    ui.fadeIn(live, T.win + 0.3, 0.3);
    const halo = ui.h("i", { class: "sdot ok" });
    ui.place(halo, WIN.w - 34, 19, 14, 14);
    halo.style.opacity = "0";
    win.querySelector(".winbar").append(halo);
    ui.pulse(halo, { at: T.win + 0.5, period: 2.1, to: 2.2, hi: 0.45 });

    const rows = S.rows.map((r, i) => {
      const row = ui.statRow(ui.tr(lang, r.label), "", "idle");
      row.style.borderBottom = i < S.rows.length - 1 ? "1px solid #1a1a1f" : "none";
      win.body.append(row);
      const at = T.row0 + i * T.rowStep;
      ui.rise(row, at, { dy: 10, dur: 0.42 });
      // the dot flips to green a beat after the row lands
      ui.anim(row.dotEl, [{ background: "#57535f" }, { background: "#34d399" }], {
        at: at + 0.22,
        dur: 0.28,
        ease: "out",
      });
      ui.anim(row.dotEl, [{ scale: "1" }, { scale: "1.5" }, { scale: "1" }], { at: at + 0.22, dur: 0.44, ease: "out" });
      row.valueEl.classList.add("ok");
      const value = ui.tr(lang, r.value);
      // numeric values count up, text values just fade in
      const num = /^[\d.]+/.exec(value);
      if (num && Number(num[0]) > 0) {
        const target = Number(num[0]);
        const suffix = value.slice(num[0].length);
        const dec = (num[0].split(".")[1] || "").length;
        ui.countUp(row.valueEl, {
          from: 0,
          to: target,
          at: at + 0.18,
          dur: 0.7,
          fmt: (v) => v.toFixed(dec) + suffix,
        });
      } else {
        row.valueEl.textContent = value;
        ui.fadeIn(row.valueEl, at + 0.2, 0.3);
      }
      return row;
    });

    // green summary badge
    const badge = ui.chip(ui.tr(lang, S.allgood), { class: "ok" });
    badge.style.height = "58px";
    badge.style.fontSize = "24px";
    badge.style.letterSpacing = ".1em";
    ui.place(badge, WIN.x + WIN.w / 2 - 170, WIN.y + WIN.h + 40);
    badge.style.width = "340px";
    badge.style.justifyContent = "center";
    content.append(badge);
    ui.pop(badge, T.badge, { from: 0.86, dur: 0.5 });
    ui.pulse(
      (() => {
        const ring = ui.h("i");
        ui.place(ring, 18, 22, 14, 14);
        ring.style.borderRadius = "50%";
        ring.style.background = "#34d399";
        ring.style.opacity = "0";
        badge.append(ring);
        return ring;
      })(),
      { at: T.badge + 0.3, period: 2, to: 2.4, hi: 0.5 },
    );

    watermark(content, ctx, 1.0);
    return { rows };
  },
};
