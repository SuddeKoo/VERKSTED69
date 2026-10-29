// Stramming på timing: markøren farer over staven – klikk (eller mellomrom) når den er i det grønne.
// Brukes til løse komponenter, understell, lekkasjer (klemmer) og løse lister (klips).
import { svgStage, svgEl, timingBar, INK } from './kit.js';

export default function tightenGame(ctx) {
  const n = ctx.opts.hits || 4;
  const clips = !!ctx.opts.clips, leak = !!ctx.opts.leak;
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    ${clips ? `<rect x="120" y="200" width="860" height="70" rx="14" fill="#9a9894" stroke="${INK}" stroke-width="6"/><rect x="100" y="140" width="900" height="40" fill="#5a6a7a" stroke="${INK}" stroke-width="5"/>`
      : leak ? `<rect x="160" y="190" width="780" height="120" rx="20" fill="#5a5450" stroke="${INK}" stroke-width="6"/><path d="M550,310 q-8,40 0,70 q8,-30 0,-70" fill="#1a1008" class="drip"/>`
      : `<rect x="100" y="120" width="900" height="70" fill="#3a3632" stroke="${INK}" stroke-width="5"/><path d="M180,230 L920,${ctx.opts.hits > 4 ? 300 : 250}" stroke="#a8a49c" stroke-width="30"/><path d="M180,230 L920,${ctx.opts.hits > 4 ? 300 : 250}" stroke="${INK}" stroke-width="4" fill="none" opacity=".4"/>`}`);
  ctx.steps(Array.from({ length: n }, (_, i) => `${clips ? 'Klips' : 'Bolt'} ${i + 1}`), 0);
  ctx.hint(`Klikk (eller trykk mellomrom) når markøren er i det <b>grønne</b>. ${n} ${clips ? 'klips' : 'bolter'}.`);
  const pts = Array.from({ length: n }, (_, i) => [180 + i * (740 / Math.max(1, n - 1)), clips ? 235 : leak ? 250 : 190 + i * ((ctx.opts.hits > 4 ? 70 : 20) / Math.max(1, n - 1))]);
  const els = pts.map(([x, y]) => { const g = svgEl('g', { transform: `translate(${x} ${y})` }, clips ? `<rect x="-16" y="-24" width="32" height="48" rx="6" fill="#2a2a2a" stroke="${INK}" stroke-width="4"/>` : `<polygon points="-18,-11 0,-22 18,-11 18,11 0,22 -18,11" fill="#c9c6bc" stroke="${INK}" stroke-width="4"/>`); g.style.opacity = 0.5; svg.appendChild(g); return g; });
  let i = 0, errs = [];
  const bar = timingBar(ctx, svg, { x: 300, y: 470, w: 500, zone: 0.2, speed: 0.9 + n * 0.05 });
  const marker = svgEl('path', { d: 'M0,-60 l-14,-22 l28,0 z', fill: '#ffd84a', stroke: INK, 'stroke-width': 3 });
  svg.appendChild(marker);
  const place = () => marker.setAttribute('transform', `translate(${pts[i][0]} ${pts[i][1]})`);
  place();
  const hit = () => {
    if (i >= n) return;
    const e = bar.hit();
    errs.push(e);
    const ok = e <= 1;
    ctx.audio?.synth(ok ? (clips ? 'snap' : 'wrench') : 'clank', { volume: 0.8 });
    if (!ok) ctx.mistake(e > 1.6 ? 'Glapp!' : 'Litt skjevt');
    els[i].style.opacity = 1;
    els[i].insertAdjacentHTML('beforeend', `<text y="-30" text-anchor="middle" font-family="Rubik Dirt" font-size="20" fill="${e <= 0.35 ? '#8fd08a' : ok ? '#f0c44e' : '#ff6a3a'}">${e <= 0.35 ? '✔' : ok ? '~' : '✘'}</text>`);
    i++;
    if (i < n) { place(); ctx.steps(Array.from({ length: n }, (_, k) => `${clips ? 'Klips' : 'Bolt'} ${k + 1}`), i); return; }
    marker.remove();
    const avg = errs.reduce((a, b) => a + Math.min(2, b), 0) / n;
    let q = avg <= 0.4 ? 3 : avg <= 0.8 ? 2 : avg <= 1.3 ? 1 : 0;
    if (ctx.up.torque) q = Math.max(2, q);
    setTimeout(() => ctx.done(q), 400);
  };
  svg.addEventListener('pointerdown', hit);
  const key = (e) => { if (e.code === 'Space') { e.preventDefault(); hit(); } };
  window.addEventListener('keydown', key);
  return () => { bar.stop(); window.removeEventListener('keydown', key); };
}
