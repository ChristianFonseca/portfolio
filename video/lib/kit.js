// Shared furniture every scene uses: backdrop, title block, watermark, exit.
// Layout grid (1920x1080):
//   kicker baseline 140 · headline 200 · content 420…1000 · watermark bottom-right

export const LAYOUT = { x: 120, kickerY: 140, headY: 200, contentY: 420, contentH: 580, right: 1800 };

/**
 * Standard scene shell. Returns { wrap, content } — put everything inside `wrap`
 * so the exit dissolve applies to the whole scene at once.
 */
export function shell(stage, ctx, o = {}) {
  const { ui, story } = ctx;
  const D = ctx.scene.duration;
  const wrap = ui.h("div");
  ui.place(wrap, 0, 0, 1920, 1080);
  stage.append(wrap);

  // backdrop: faint grid + two brand glows, always present
  if (o.backdrop !== false) {
    wrap.append(ui.h("div", { class: "grid-bg" }));
    const g1 = ui.h("div", { class: "glow p" });
    ui.place(g1, o.glow1x ?? -180, o.glow1y ?? -160, 820, 700);
    const g2 = ui.h("div", { class: "glow a" });
    ui.place(g2, o.glow2x ?? 1320, o.glow2y ?? 620, 760, 660);
    wrap.append(g1, g2);
    ui.anim(g1, [{ opacity: 0 }, { opacity: 0.5 }], { at: 0, dur: 1.1, ease: "out" });
    ui.anim(g2, [{ opacity: 0 }, { opacity: 0.42 }], { at: 0.2, dur: 1.1, ease: "out" });
    ui.float(g1, { amp: 12, period: 11 });
    ui.float(g2, { amp: 14, period: 13, at: 2 });
  }

  // title block from story.json
  if (story.kicker && o.kicker !== false) {
    ui.kicker(wrap, ui.tr(ctx.lang, story.kicker), { x: LAYOUT.x, y: LAYOUT.kickerY, at: o.kickerAt ?? 0.25 });
  }
  let head = null;
  if (story.headline && o.headline !== false) {
    head = ui.headline(wrap, ui.tr(ctx.lang, story.headline), {
      x: LAYOUT.x,
      y: o.headY ?? LAYOUT.headY,
      w: o.headW ?? 1560,
      size: o.headSize ?? 74,
      at: o.headAt ?? 0.55,
      step: o.headStep ?? 0.045,
    });
  }

  const content = ui.h("div");
  ui.place(content, 0, 0, 1920, 1080);
  wrap.append(content);

  // exit dissolve: the last 0.45 s of every scene
  const exitAt = o.exitAt ?? D - 0.45;
  ui.anim(wrap, [{ opacity: 1 }, { opacity: 0 }], { at: exitAt, dur: 0.45, ease: "in" });
  ui.anim(wrap, [{ scale: "1" }, { scale: "0.988" }], { at: exitAt, dur: 0.45, ease: "in" });

  return { wrap, content, head, exitAt };
}

/** Bottom-right brand watermark. */
export function watermark(parent, ctx, at = 0.8) {
  const { ui } = ctx;
  const el = ui.h("div", { class: "wm" });
  el.append(ui.h("i"), ui.h("span", { text: "christianfonseca.dev" }));
  parent.append(el);
  ui.fadeIn(el, at, 0.6, { to: 1 });
  return el;
}

/** A soft vertical separator line. */
export function divider(parent, ctx, x, y, hgt, o = {}) {
  const { ui } = ctx;
  const el = ui.h("div");
  ui.place(el, x, y, 1, hgt);
  el.style.background = `linear-gradient(180deg, transparent, ${o.color || "#232329"} 18%, ${o.color || "#232329"} 82%, transparent)`;
  parent.append(el);
  return el;
}
