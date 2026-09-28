/* <brain-mascot state="idle"> — mascota animada, sin dependencias.
   Atributos: state (idle|hello|review|thinking|loading|chat|success|error|listening|sleep|alert|confused)
              speed (1 = normal), assets (carpeta de imágenes, por defecto junto a este archivo)
   Tamaño: dale width por CSS (por defecto 160px). */
(function () {
  if (customElements.get('brain-mascot')) return;
  const SCRIPT_BASE = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/[^/]*$/, '') + 'assets/' : 'mascota/assets/';

  const CSS = `
:host{display:inline-block;width:160px;position:relative;line-height:0;-webkit-user-select:none;user-select:none}
.m{position:relative;width:100%;aspect-ratio:1020/906}
.base{position:absolute;left:0;bottom:0;width:100%;transform-origin:center 40%}
.body{position:absolute;left:0;top:0;width:100%;height:85%;transform-origin:center bottom}
.img{position:absolute;inset:0;width:100%;height:100%}
.layer{position:absolute;inset:0;pointer-events:none}
.e{position:absolute;width:5.8%;aspect-ratio:1;border-radius:50%;opacity:0;box-shadow:0 0 0 2px rgba(20,30,80,.55),0 0 14px rgba(80,200,255,.55)}
.eyes{position:absolute;inset:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 6px #35d4ff)}
.fx{position:absolute}
@keyframes m-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3%)}}
@keyframes m-base{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.9);opacity:.7}}
@keyframes m-blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}
@keyframes m-hello{0%,100%{transform:translateY(0) rotate(0)}15%{transform:translateY(-4%) rotate(-7deg)}30%{transform:translateY(-4%) rotate(7deg)}45%{transform:translateY(-4%) rotate(-7deg)}60%{transform:translateY(0) rotate(0)}}
@keyframes m-scan{0%,100%{transform:translateX(-22px)}50%{transform:translateX(22px)}}
@keyframes m-scanline{0%,100%{top:14%;opacity:0}12%,88%{opacity:1}50%{top:84%}}
@keyframes m-tilt{0%,100%{transform:rotate(-4deg) translateY(0)}50%{transform:rotate(4deg) translateY(-2%)}}
@keyframes m-dot{0%,100%{opacity:.2;transform:translateY(0)}50%{opacity:1;transform:translateY(-40%)}}
@keyframes m-spin{to{transform:rotate(360deg)}}
@keyframes m-hop{0%,40%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(0) scale(1.05,.92)}62%{transform:translateY(-12%) scale(.97,1.04)}76%{transform:translateY(0) scale(1.04,.95)}84%{transform:translateY(0) scale(1,1)}}
@keyframes m-hopbase{0%,40%,50%,76%,84%,100%{transform:scale(1);opacity:1}62%{transform:scale(.7);opacity:.45}}
@keyframes m-pop{0%,40%{transform:scale(0);opacity:0}55%{transform:scale(1.1);opacity:1}62%,92%{transform:scale(1);opacity:1}100%{transform:scale(.8);opacity:0}}
@keyframes m-shake{0%,50%,100%{transform:translateX(0) rotate(0)}5%,15%,25%,35%{transform:translateX(-3%) rotate(-2deg)}10%,20%,30%,40%{transform:translateX(3%) rotate(2deg)}}
@keyframes m-err{0%,60%,100%{filter:drop-shadow(0 0 0 rgba(255,70,100,0))}20%{filter:drop-shadow(0 0 22px rgba(255,70,100,.9))}}
@keyframes m-ring{0%{transform:scale(.3);opacity:0}20%{opacity:1}100%{transform:scale(1.7);opacity:0}}
@keyframes m-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(1%) scale(1.015,.985)}}
@keyframes m-z{0%{transform:translate(0,0) scale(.6);opacity:0}20%{opacity:1}100%{transform:translate(60%,-180%) scale(1.3);opacity:0}}
@keyframes m-spark{0%,52%,100%{transform:scale(0) rotate(45deg);opacity:0}64%{transform:scale(1.2) rotate(45deg);opacity:1}86%{transform:scale(0) rotate(45deg);opacity:0}}
@keyframes m-typing{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-30%)}}
@keyframes m-alert{0%,55%,100%{transform:translateY(0) rotate(0)}8%{transform:translateY(-8%) rotate(-3deg)}16%{transform:translateY(0) rotate(3deg)}24%{transform:translateY(-5%) rotate(-2deg)}32%{transform:translateY(0) rotate(0)}}
@keyframes m-badge{0%,100%{transform:scale(1)}8%{transform:scale(1.25)}16%{transform:scale(.95)}24%{transform:scale(1.1)}32%{transform:scale(1)}}
@keyframes m-confused{0%,100%{transform:rotate(0)}25%,60%{transform:rotate(-9deg)}}
@keyframes m-q{0%,100%{transform:translateY(0) rotate(-8deg);opacity:.85}50%{transform:translateY(-12%) rotate(8deg);opacity:1}}
`;

  const ORBITS = [[496.3,448.7,462.9,182.8,-2.8],[535.8,396.4,479.5,149.2,-32.2],[527.7,392.6,392.7,191.5,51.4]];
  const ELECTRONS = [
    { o: 0, p: 3.25, rate: 1, col: 'dark' }, { o: 0, p: 0.1, rate: 1, col: 'purple' },
    { o: 1, p: 4.55, rate: 0.8, col: 'light' },
    { o: 2, p: 4.4, rate: 1.2, col: 'dark' }, { o: 2, p: 1.25, rate: 1.2, col: 'purple' },
  ];
  const SPHERE = {
    dark: 'radial-gradient(circle at 35% 30%, #bdf3ff 0 10%, #3d8fd6 24%, #1a3f86 62%, #0e1f4d 100%)',
    light: 'radial-gradient(circle at 35% 30%, #ffffff 0 12%, #7fe3ff 30%, #2a9be0 70%, #1a4f9a 100%)',
    purple: 'radial-gradient(circle at 35% 30%, #efe6ff 0 10%, #8c6cf0 28%, #4a3aa8 65%, #251c66 100%)',
  };
  const C = '#9af2ff';

  function eyeSVG(k, anim, blinkDur) {
    const st = `fill="none" stroke="${C}" stroke-linecap="round"`;
    const shape = (side) => {
      if (k === 'happy') return `<path d="M-32 12 Q0 -26 32 12" ${st} stroke-width="13"/>`;
      if (k === 'closed') return `<path d="M-30 0 Q0 16 30 0" ${st} stroke-width="10"/>`;
      if (k === 'x') return `<path d="M-18 -18 L18 18 M18 -18 L-18 18" ${st} stroke-width="11"/>`;
      if (k === 'wide') return `<ellipse rx="22" ry="28" fill="${C}"/><circle cx="7" cy="-9" r="6" fill="#fff"/>`;
      if (k === 'up') return `<ellipse cx="8" cy="-10" rx="16" ry="21" fill="${C}"/>`;
      if (k === 'confused') return side ? `<ellipse rx="19" ry="25" fill="${C}"/>` : `<path d="M-26 4 L26 -4" ${st} stroke-width="11"/>`;
      return `<ellipse rx="17" ry="23" fill="${C}"/>`;
    };
    const blink = (k === 'closed' || k === 'x') ? 'none' : `m-blink ${blinkDur} ease-in-out infinite`;
    return `<svg class="eyes" viewBox="0 0 1020 770">` + [[395, 512], [605, 512]].map(([x, y], i) =>
      `<g transform="translate(${x} ${y})"><g style="animation:${blink};transform-box:fill-box;transform-origin:center"><g style="animation:${anim || 'none'}">${shape(i)}</g></g></g>`).join('') + `</svg>`;
  }

  function build(state, sp) {
    const t = s => (s / sp).toFixed(2) + 's';
    const float = `m-float ${t(3)} ease-in-out infinite`, baseF = `m-base ${t(3)} ease-in-out infinite`;
    const hop = d => `m-hop ${t(d)} ease-in-out infinite`, hopB = d => `m-hopbase ${t(d)} ease-in-out infinite`;
    const dl = (s) => (s / sp).toFixed(2) + 's';
    const S = {
      idle: { body: float, base: baseF, eye: 'open', orbit: 1 },
      hello: { body: `m-hello ${t(1.8)} ease-in-out infinite`, base: baseF, eye: 'happy', orbit: 1.4 },
      review: { body: float, base: baseF, eye: 'open', orbit: 1.2, eyeAnim: `m-scan ${t(1.6)} ease-in-out infinite`,
        fx: `<div class="fx" style="left:12%;right:12%;height:3%;border-radius:99px;background:linear-gradient(90deg,transparent,#7fe3ff,transparent);box-shadow:0 0 18px #3fd0ff;animation:m-scanline ${t(2.4)} ease-in-out infinite"></div>` },
      thinking: { body: `m-tilt ${t(2.6)} ease-in-out infinite`, base: baseF, eye: 'up', orbit: 1.8,
        fx: `<div class="fx" style="right:6%;top:-6%;display:flex;gap:6%;width:22%">` + [0, 1, 2].map(i => `<div style="flex:1;aspect-ratio:1;border-radius:50%;background:${C};box-shadow:0 0 10px #35d4ff;animation:m-dot ${t(1.2)} ease-in-out ${dl(i * .18)} infinite"></div>`).join('') + `</div>` },
      loading: { body: float, base: baseF, eye: 'open', orbit: 3.2,
        back: `<svg viewBox="0 0 100 100" style="position:absolute;left:11%;top:-4%;width:78%;height:104%;animation:m-spin ${t(1.4)} linear infinite;filter:drop-shadow(0 0 6px #35d4ff)"><circle cx="50" cy="50" r="47" fill="none" stroke="#7fe3ff" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="70 225"/></svg>` },
      chat: { body: hop(2), base: hopB(2), eye: 'happy', orbit: 1.5,
        fx: `<div class="fx" style="right:-4%;top:-10%;width:34%;aspect-ratio:1.5;border-radius:40% 40% 40% 8%;background:#eef3ff;display:flex;align-items:center;justify-content:center;gap:9%;transform-origin:left bottom;animation:m-pop ${t(2)} ease-out infinite;box-shadow:0 6px 18px rgba(0,0,0,.25)">` + [0, 1, 2].map(i => `<div style="width:14%;aspect-ratio:1;border-radius:50%;background:#4b5cc9;animation:m-typing ${t(1)} ease-in-out ${dl(i * .15)} infinite"></div>`).join('') + `</div>` },
      success: { body: hop(1.6), base: hopB(1.6), eye: 'happy', orbit: 2.2,
        fx: [[4, 8, 9], [86, 4, 7], [92, 50, 6], [0, 55, 7], [48, -10, 6]].map(([x, y, s], i) => `<div class="fx" style="left:${x}%;top:${y}%;width:${s}%;aspect-ratio:1;background:${i % 2 ? '#b99bff' : C};border-radius:2px;box-shadow:0 0 12px #35d4ff;animation:m-spark ${t(1.6)} ease-out ${dl(i * .04)} infinite"></div>`).join('') },
      error: { body: `m-shake ${t(1.4)} ease-in-out infinite`, img: `m-err ${t(1.4)} ease-in-out infinite`, base: baseF, eye: 'x', orbit: 0.35 },
      listening: { body: float, base: baseF, eye: 'wide', orbit: 0.9,
        fx: [0, 1, 2].map(i => `<div class="fx" style="left:66%;top:39%;width:22%;aspect-ratio:1;border-radius:50%;border:3px solid #7fe3ff;box-sizing:border-box;box-shadow:0 0 12px #35d4ff;opacity:0;animation:m-ring ${t(1.8)} ease-out ${dl(i * .6)} infinite"></div>`).join('') },
      sleep: { body: `m-breathe ${t(4)} ease-in-out infinite`, base: `m-base ${t(4)} ease-in-out infinite`, eye: 'closed', orbit: 0.25,
        fx: [0, 1, 2].map(i => `<div class="fx" style="left:62%;top:8%;font:600 clamp(12px,1.6em,26px)/1 Sora,Helvetica,sans-serif;color:${C};text-shadow:0 0 10px #35d4ff;opacity:0;animation:m-z ${t(3)} ease-out ${dl(i)} infinite">z</div>`).join('') },
      alert: { body: `m-alert ${t(1.6)} ease-in-out infinite`, base: baseF, eye: 'wide', orbit: 1.6,
        fx: `<div class="fx" style="right:2%;top:-4%;width:17%;aspect-ratio:1;border-radius:50%;background:#ff5a7a;box-shadow:0 0 0 3px #fff,0 0 16px rgba(255,90,122,.8);display:flex;align-items:center;justify-content:center;color:#fff;font:700 clamp(10px,1.4em,28px)/1 Sora,Helvetica,sans-serif;animation:m-badge ${t(1.6)} ease-in-out infinite">!</div>` },
      confused: { body: `m-confused ${t(2.8)} ease-in-out infinite`, base: baseF, eye: 'confused', orbit: 0.7,
        fx: `<div class="fx" style="right:4%;top:-8%;font:700 clamp(14px,2.4em,48px)/1 Sora,Helvetica,sans-serif;color:${C};text-shadow:0 0 12px #35d4ff;animation:m-q ${t(2.8)} ease-in-out infinite">?</div>` },
    };
    return S[state] || S.idle;
  }

  class BrainMascot extends HTMLElement {
    static get observedAttributes() { return ['state', 'speed', 'assets']; }
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    connectedCallback() { this.render(); }
    disconnectedCallback() { cancelAnimationFrame(this._raf); }
    attributeChangedCallback() { if (this.isConnected) this.render(); }
    render() {
      cancelAnimationFrame(this._raf);
      const sp = parseFloat(this.getAttribute('speed')) || 1;
      const cfg = build(this.getAttribute('state') || 'idle', sp);
      const A = this.getAttribute('assets') || SCRIPT_BASE;
      const el = () => ELECTRONS.map(e => `<div class="e" style="background:${SPHERE[e.col]}"></div>`).join('');
      this.shadowRoot.innerHTML = `<style>${CSS}</style>
<div class="m" role="img" aria-label="Mascota: ${this.getAttribute('state') || 'idle'}">
  <img class="base" src="${A}mascot-base.png" alt="" style="animation:${cfg.base}">
  <div class="body" style="animation:${cfg.body}">
    ${cfg.back || ''}
    <div class="layer" data-l="back">${el()}</div>
    <img class="img" src="${A}mascot-body.png" alt="" style="animation:${cfg.img || 'none'}">
    <div class="layer" data-l="front">${el()}</div>
    ${eyeSVG(cfg.eye, cfg.eyeAnim, (3.6 / sp).toFixed(2) + 's')}
    ${cfg.fx || ''}
  </div>
</div>`;
      const back = [...this.shadowRoot.querySelectorAll('[data-l="back"] .e')];
      const front = [...this.shadowRoot.querySelectorAll('[data-l="front"] .e')];
      const speed = cfg.orbit * sp;
      const tick = () => {
        const t = performance.now() / 1000 * (2 * Math.PI / 7) * speed;
        ELECTRONS.forEach((e, i) => {
          const [cx, cy, rx, ry, r] = ORBITS[e.o];
          const a = e.p + t * e.rate, rr = r * Math.PI / 180;
          const u = rx * Math.cos(a), v = ry * Math.sin(a);
          const X = cx + u * Math.cos(rr) - v * Math.sin(rr), Y = cy + u * Math.sin(rr) + v * Math.cos(rr);
          const isFront = Math.sin(a) > 0, s = 0.82 + 0.18 * Math.sin(a);
          for (const [n, on] of [[back[i], !isFront], [front[i], isFront]]) {
            n.style.left = (X / 10.2) + '%'; n.style.top = (Y / 7.7) + '%';
            n.style.transform = `translate(-50%,-50%) scale(${s})`; n.style.opacity = on ? 1 : 0;
          }
        });
        this._raf = requestAnimationFrame(tick);
      };
      tick();
    }
  }
  customElements.define('brain-mascot', BrainMascot);
})();
