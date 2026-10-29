// Hjulstilling: måleren viser hvor skjevt hjulet peker (glir litt hele tiden). Skru på styrestaget med
// − og + til nåla står i det grønne, og lås. To sider.
import { svgStage, svgEl, svgButton, INK } from './kit.js';

export default function alignGame(ctx) {
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2d2a27"/>
    <g transform="translate(550 330)"><path d="M-260,0 A260,260 0 0 1 260,0" stroke="#3a3632" stroke-width="34" fill="none"/>
    <path class="al-zone" d="" stroke="#4f8a5a" stroke-width="34" fill="none"/>
    <line class="al-needle" x1="0" y1="0" x2="0" y2="-240" stroke="#ff4a2a" stroke-width="8" stroke-linecap="round"/><circle r="20" fill="#3a3632" stroke="${INK}" stroke-width="5"/>
    <text x="-250" y="40" font-family="Special Elite" font-size="20" fill="#cfc6b2">INN</text><text x="210" y="40" font-family="Special Elite" font-size="20" fill="#cfc6b2">UT</text></g>
    <text class="al-side" x="550" y="50" text-anchor="middle" font-family="Rubik Dirt" font-size="28" fill="#f0c44e"></text>
    <text class="al-val" x="550" y="400" text-anchor="middle" font-family="Special Elite" font-size="26" fill="#7cff7a"></text>`);
  const tol = 0.08 * ctx.precision; // av full skala (−1 … 1)
  const zoneA = Math.asin(Math.min(1, tol)) ;
  svg.querySelector('.al-zone').setAttribute('d', `M${-Math.sin(zoneA) * 260},${-Math.cos(zoneA) * 260} A260,260 0 0 1 ${Math.sin(zoneA) * 260},${-Math.cos(zoneA) * 260}`);
  const needle = svg.querySelector('.al-needle');
  let side = 0, v = 0, drift = 0, results = [];
  const sides = ['VENSTRE STAG', 'HØYRE STAG'];
  const reset = () => { v = (Math.random() < 0.5 ? -1 : 1) * (0.45 + Math.random() * 0.4); drift = (Math.random() - 0.5) * 0.06; svg.querySelector('.al-side').textContent = sides[side]; ctx.steps(sides, side); };
  reset();
  ctx.hint('Bruk − og + for å skru styrestaget til nåla står i det grønne. Trykk LÅS når den står stille der.');
  let hold = 0;
  const nudge = (d) => { v += d; ctx.audio?.synth('wrench', { volume: 0.5 }); };
  svgButton(svg, 300, 470, 120, 60, '− −', () => nudge(-0.12));
  svgButton(svg, 430, 470, 90, 60, '−', () => nudge(-0.03));
  svgButton(svg, 580, 470, 90, 60, '+', () => nudge(0.03));
  svgButton(svg, 680, 470, 120, 60, '+ +', () => nudge(0.12));
  svgButton(svg, 870, 470, 160, 60, 'LÅS', () => {
    const err = Math.abs(v);
    results.push(err);
    ctx.audio?.play('ratchet', { volume: 0.7 });
    if (++side < 2) reset();
    else {
      const avg = results.reduce((a, b) => a + b, 0) / 2;
      ctx.done(avg < tol * 0.5 ? 3 : avg < tol ? 2 : avg < tol * 2.2 ? 1 : 0);
    }
  });
  const stop = ctx.frame((dt) => {
    v += (drift + (Math.random() - 0.5) * 0.05) * dt * ctx.slow;
    v = Math.max(-1, Math.min(1, v));
    needle.setAttribute('transform', `rotate(${v * 80})`);
    const inZone = Math.abs(v) < tol;
    svg.querySelector('.al-val').textContent = `${v > 0 ? '+' : ''}${(v * 2).toFixed(2)}°${inZone ? '  ✔' : ''}`;
    hold = inZone ? hold + dt : 0;
  });
  return stop;
}
