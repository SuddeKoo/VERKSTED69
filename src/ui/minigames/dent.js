// Bulk: panelet har flere bulker. Hold musa over en bulk – en ring pulserer. Slå (klikk) når ringen er
// akkurat på kanten av bulken. Godt slag retter den litt ut; for tidlig/sent lager en ny liten bule.
import { svgStage, svgEl, local, INK } from './kit.js';
import { COLOR_BY_ID } from '../../data/cars.js';

export default function dentGame(ctx) {
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <rect x="80" y="80" width="940" height="440" rx="40" fill="${COLOR_BY_ID[ctx.job?.car?.color]?.hex || '#8a8a84'}" stroke="${INK}" stroke-width="8"/>
    <rect x="80" y="80" width="940" height="80" rx="40" fill="#fff" opacity=".12"/>`);
  const n = 3 + Math.floor(Math.random() * 2);
  const dents = Array.from({ length: n }, (_, i) => ({ x: 220 + i * (680 / (n - 1)) + (Math.random() - 0.5) * 60, y: 230 + Math.random() * 180, r: 46 + Math.random() * 20, depth: 2 + (Math.random() < 0.4 ? 1 : 0) }));
  const layer = svgEl('g'); svg.appendChild(layer);
  const ring = svgEl('circle', { fill: 'none', stroke: '#ffd84a', 'stroke-width': 5, opacity: 0 }); svg.appendChild(ring);
  let bad = 0, hits = 0, hover = null, t = 0;
  const draw = () => {
    layer.innerHTML = dents.map((d) => d.depth > 0 ? `<g><ellipse cx="${d.x}" cy="${d.y}" rx="${d.r}" ry="${d.r * 0.7}" fill="#1b120c" opacity="${0.15 + d.depth * 0.18}"/><ellipse cx="${d.x + 8}" cy="${d.y + 6}" rx="${d.r * 0.55}" ry="${d.r * 0.36}" fill="#1b120c" opacity="${0.12 + d.depth * 0.12}"/><path d="M${d.x - d.r},${d.y} q${d.r * 0.5},-${d.r * 0.6} ${d.r},-${d.r * 0.62}" stroke="#fff" stroke-width="3" fill="none" opacity=".35"/></g>` : `<circle cx="${d.x}" cy="${d.y}" r="6" fill="#8fd08a" opacity=".6"/>`).join('');
  };
  draw();
  ctx.steps(['Rett ut bulkene'], 0);
  ctx.hint('Hold over en bulk. Slå (klikk) når den gule ringen er <b>akkurat på kanten</b> av bulken.');
  svg.addEventListener('pointermove', (e) => {
    const [x, y] = local(svg, e);
    hover = dents.find((d) => d.depth > 0 && Math.hypot(x - d.x, (y - d.y) / 0.7) < d.r + 10) || null;
  });
  const stop = ctx.frame((dt) => {
    t += dt * 1.6 * ctx.slow;
    if (!hover) { ring.setAttribute('opacity', 0); return; }
    const k = (Math.sin(t * Math.PI) + 1) / 2; // 0–1
    ring.setAttribute('opacity', 1);
    ring.setAttribute('cx', hover.x); ring.setAttribute('cy', hover.y);
    ring.setAttribute('r', 10 + k * hover.r * 1.5);
    ring.dataset.k = k;
  });
  svg.addEventListener('pointerdown', () => {
    if (!hover) return;
    const k = +ring.dataset.k;
    const rr = 10 + k * hover.r * 1.5;
    const err = Math.abs(rr - hover.r) / (hover.r * 0.2 * ctx.precision);
    hits++;
    if (err <= 1) { hover.depth--; ctx.audio?.synth('hammer'); }
    else { bad++; ctx.audio?.synth('hammer', { volume: 0.6 }); ctx.audio?.synth('clank', { volume: 0.4 }); ctx.mistake(rr < hover.r ? 'For tidlig – ny bule!' : 'For sent!'); if (bad % 2 === 0) dents.push({ x: hover.x + (Math.random() - 0.5) * 120, y: hover.y + (Math.random() - 0.5) * 80, r: 30, depth: 1 }); }
    draw();
    if (dents.every((d) => d.depth <= 0)) {
      stop();
      const ratio = bad / Math.max(1, hits);
      setTimeout(() => ctx.done(ratio < 0.12 ? 3 : ratio < 0.3 ? 2 : ratio < 0.5 ? 1 : 0), 400);
    }
  });
  return stop;
}
