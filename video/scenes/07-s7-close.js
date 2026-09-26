// S7 · Closing — absolute 51.0–57.0 s.
//
// The line the whole piece exists for, centred, with the instruments reduced to a
// single dial that turns from inward to outward. Then the read-more line. No exit
// dissolve on the last beat: the final frame is the poster.

import { shell } from "../lib/kit.js";

const T = { dial: 0.5, head: 1.0, turn: 2.6, read: 3.7 };

export default {
  build(stage, ctx) {
    const { ui, story, lang } = ctx;
    // the closing headline is centred and bigger, so it is built here, not by the shell
    const { content } = shell(stage, ctx, { kicker: false, headline: false, exitAt: 999 });
    const S = story.str;

    // a compass-like dial: the needle points inward (down) and then swings outward
    const dial = ui.svg({});
    content.append(dial);
    const cx = 960;
    const cy = 330;
    const r = 58;
    const ring = ui.s("circle", { cx, cy, r, stroke: "#232329", "stroke-width": 2, fill: "none" });
    const ring2 = ui.s("circle", { cx, cy, r: r - 14, stroke: "#1a1a1f", "stroke-width": 2, fill: "none" });
    dial.append(ring, ring2);
    ui.drawPath(ring, T.dial, 0.7);
    ui.anim(ring2, [{ opacity: 0 }, { opacity: 1 }], { at: T.dial + 0.3, dur: 0.4, ease: "out" });

    const needle = ui.s("path", {
      d: `M${cx} ${cy} L${cx} ${cy - r + 8}`,
      stroke: "#f43f5e",
      "stroke-width": 4,
      "stroke-linecap": "round",
    });
    needle.style.transformOrigin = `${cx}px ${cy}px`;
    needle.style.rotate = "180deg"; // pointing inward/down to start
    dial.append(needle);
    ui.anim(needle, [{ opacity: 0 }, { opacity: 1 }], { at: T.dial + 0.35, dur: 0.3, ease: "out" });
    // the turn outward
    ui.anim(needle, [{ rotate: "180deg" }, { rotate: "0deg" }], { at: T.turn, dur: 0.9, ease: "spring" });
    ui.anim(needle, [{ stroke: "#f43f5e" }, { stroke: "#a855f7" }], { at: T.turn + 0.3, dur: 0.5, ease: "out" });

    const hub = ui.s("circle", { cx, cy, r: 7, fill: "#a855f7" });
    dial.append(hub);
    ui.anim(hub, [{ opacity: 0 }, { opacity: 1 }], { at: T.dial + 0.4, dur: 0.3, ease: "out" });

    // the closing line, centred, two lines
    const text = ui.tr(lang, story.headline);
    const lines = text.split("\n");
    lines.forEach((ln, i) => {
      const { el } = ui.headline(content, ln, {
        x: 160,
        y: 470 + i * 96,
        w: 1600,
        size: 68,
        at: T.head + i * 0.5,
        step: 0.05,
        align: "center",
      });
      el.style.textAlign = "center";
    });

    // read more
    const read = ui.h("div");
    ui.place(read, 160, 740, 1600);
    read.style.textAlign = "center";
    const lbl = ui.h("div", {
      text: ui.tr(lang, S.read),
      style: { fontSize: "27px", fontWeight: "500", color: "#57535f", marginBottom: "16px" },
    });
    const url = ui.h("div", {
      class: "mono",
      text: S.url,
      style: { fontSize: "34px", fontWeight: "700", letterSpacing: ".01em" },
    });
    url.style.background = "linear-gradient(90deg,#a855f7,#ec4899)";
    url.style.webkitBackgroundClip = "text";
    url.style.backgroundClip = "text";
    url.style.color = "transparent";
    read.append(lbl, url);
    content.append(read);
    ui.rise(read, T.read, { dy: 16, dur: 0.7 });

    // underline sweep beneath the url
    const rule = ui.h("div");
    ui.place(rule, 760, 836, 400, 2);
    rule.style.background = "linear-gradient(90deg,transparent,#a855f7,#ec4899,transparent)";
    rule.style.transformOrigin = "center";
    content.append(rule);
    ui.anim(rule, [{ scale: "0 1", opacity: 0 }, { scale: "1 1", opacity: 1 }], {
      at: T.read + 0.35,
      dur: 0.7,
      ease: "out",
    });
  },
};
