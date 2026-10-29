// Formtilpasning: skru ut festene på den gamle delen og ta den av → den nye delen må dras på plass og
// vris (− / +) til den passer omrisset → klikk fast klipsene. Brukes til støtfanger, dørpanel, lyktehus, viskere.
import { svgStage, svgEl, holdable, local, svgButton, INK } from './kit.js';
import { COLOR_BY_ID } from '../../data/cars.js';

const SHAPES = {
  bumper: { name: 'støtfangeren', w: 620, h: 110, path: (c) => `<path d="M-310,-30 Q-310,-55 -280,-55 L280,-55 Q310,-55 310,-30 L310,45 L-310,45 Z" fill="${c}" stroke="${INK}" stroke-width="7"/><rect x="-240" y="-10" width="480" height="18" fill="#2a2a2a" opacity=".5"/>`, holes: [[-250, 0], [0, 0], [250, 0]] },
  panel: { name: 'dørpanelet', w: 460, h: 300, path: (c) => `<rect x="-230" y="-150" width="460" height="300" rx="18" fill="${c}" stroke="${INK}" stroke-width="7"/><rect x="-190" y="-130" width="380" height="110" rx="8" fill="#2b3a4a" stroke="${INK}" stroke-width="5"/><rect x="-170" y="20" width="60" height="16" rx="5" fill="#3a3632"/>`, holes: [[-200, 120], [200, 120], [-200, 0], [200, 0]] },
  headlamp: { name: 'lyktehuset', w: 300, h: 170, path: () => `<path d="M-150,-70 L120,-85 L150,0 L120,85 L-150,70 Z" fill="#d8e4ea" stroke="${INK}" stroke-width="7"/><circle cx="-10" r="56" fill="#fff4c4" stroke="${INK}" stroke-width="5"/>`, holes: [[-130, -55], [-130, 55], [130, 0]] },
  wiper: { name: 'viskerbladet', w: 520, h: 40, path: () => `<rect x="-260" y="-12" width="520" height="24" rx="8" fill="#2a2a2a" stroke="${INK}" stroke-width="5"/><path d="M-250,12 L250,12" stroke="#5a5a5a" stroke-width="6"/>`, holes: [[0, 0]] },
};

export default function fitGame(ctx) {
  const sh = SHAPES[ctx.opts.shape] || SHAPES.bumper;
  const col = COLOR_BY_ID[ctx.job?.car?.color]?.hex || '#777';
  const fill = ctx.opts.shape === 'bumper' ? '#3a3734' : col;
  const T = [550, 270];
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <rect x="${T[0] - sh.w / 2 - 70}" y="${T[1] - sh.h / 2 - 50}" width="${sh.w + 140}" height="${sh.h + 100}" rx="20" fill="#3a3632" stroke="${INK}" stroke-width="4"/>
    <g class="outline" transform="translate(${T[0]} ${T[1]})" opacity=".35" style="filter:brightness(0) invert(1)">${sh.path('#fff')}</g>`);
  const STEPS = ['Skru ut festene', `Ta av ${sh.name}`, 'Tilpass ny', 'Klips fast'];
  const cleanups = [];
  // Gammel del (skadet)
  const old = svgEl('g', { transform: `translate(${T[0]} ${T[1] + 10}) rotate(${ctx.opts.shape === 'wiper' ? -4 : 7})` }, `${sh.path(fill)}<path d="M-60,-30 l40,30 l-20,20 l50,10" stroke="${INK}" stroke-width="5" fill="none"/>`);
  svg.appendChild(old);
  let loose = 0;
  ctx.steps(STEPS, 0);
  ctx.hint('Hold inne på hvert feste for å skru det ut.');
  const holes = sh.holes.map(([hx, hy]) => {
    const g = svgEl('g', { transform: `translate(${T[0] + hx} ${T[1] + hy + 10})` }, `<circle r="14" fill="#c9c6bc" stroke="${INK}" stroke-width="4"/><path d="M-8,0 L8,0 M0,-8 L0,8" stroke="${INK}" stroke-width="3"/>`);
    svg.appendChild(g);
    cleanups.push(holdable(ctx, svg, g, 0.45 * ctx.hold, () => { g.style.opacity = 0; ctx.audio?.synth('bolt_out'); if (++loose === sh.holes.length) removeOld(); }, { ring: [0, 0, 22] }));
    return g;
  });
  function removeOld() {
    ctx.steps(STEPS, 1);
    ctx.hint(`Klikk på den gamle delen for å ta den av.`);
    old.style.cursor = 'pointer';
    old.addEventListener('click', () => {
      old.style.transition = 'transform .5s, opacity .5s'; old.setAttribute('transform', `translate(${T[0] + 600} ${T[1] + 300}) rotate(40) scale(.4)`); old.style.opacity = 0;
      ctx.audio?.play('thump', { volume: 0.6 });
      setTimeout(place, 500);
    }, { once: true });
  }
  function place() {
    ctx.steps(STEPS, 2);
    ctx.hint('Dra den nye delen inn i omrisset og vri den med − / + til den passer. Trykk PASSER når den sitter.');
    let pos = [T[0] - 260, T[1] + 230], rot = (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 10), drag = null;
    const nw = svgEl('g', {}, sh.path(ctx.opts.shape === 'bumper' ? '#3a3734' : col));
    nw.style.cursor = 'grab';
    svg.appendChild(nw);
    const draw = () => nw.setAttribute('transform', `translate(${pos[0]} ${pos[1]}) rotate(${rot})`);
    draw();
    nw.addEventListener('pointerdown', (e) => { const [x, y] = local(svg, e); drag = [x - pos[0], y - pos[1]]; nw.setPointerCapture(e.pointerId); });
    nw.addEventListener('pointermove', (e) => { if (!drag) return; const [x, y] = local(svg, e); pos = [x - drag[0], y - drag[1]]; draw(); });
    nw.addEventListener('pointerup', () => { drag = null; });
    const rb = [svgButton(svg, 60, 510, 90, 56, '⟲', () => { rot -= 3; draw(); ctx.audio?.synth('tick'); }), svgButton(svg, 160, 510, 90, 56, '⟳', () => { rot += 3; draw(); ctx.audio?.synth('tick'); })];
    const ok = svgButton(svg, 880, 510, 170, 56, 'PASSER', () => {
      const err = Math.hypot(pos[0] - T[0], pos[1] - T[1]) / (14 * ctx.precision) + Math.abs(rot) / (4 * ctx.precision);
      if (err > 4) { ctx.mistake('Langt unna – juster mer.'); return; }
      rb.forEach((b) => b.remove()); ok.remove();
      nw.style.pointerEvents = 'none';
      clips(err);
    });
  }
  function clips(err) {
    ctx.steps(STEPS, 3);
    ctx.hint('Klikk på hvert klips for å feste delen.');
    let n = 0;
    sh.holes.forEach(([hx, hy]) => {
      const g = svgEl('g', { transform: `translate(${T[0] + hx} ${T[1] + hy})` }, `<circle r="16" fill="#ffd84a" stroke="${INK}" stroke-width="4" opacity=".85"/>`);
      g.style.cursor = 'pointer';
      svg.appendChild(g);
      g.addEventListener('click', () => {
        g.innerHTML = `<circle r="12" fill="#2a2a2a" stroke="${INK}" stroke-width="3"/>`;
        ctx.audio?.synth('snap');
        if (++n === sh.holes.length) setTimeout(() => ctx.done(err < 1 ? 3 : err < 2 ? 2 : err < 3.2 ? 1 : 0), 300);
      }, { once: true });
    });
  }
  return () => cleanups.forEach((c) => c());
}
