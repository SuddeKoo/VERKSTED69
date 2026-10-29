// Ledninger: (bytt relé/sensor først) → koble hver kabelende til kontakten med samme farge.
// Feil kontakt gir gnist og trekker ned. Brukes til elektrisk feil, startrelé og sensorfeil.
import { svgStage, svgEl, draggable, near, local, INK } from './kit.js';

const COLS = [['#c43a2a', 'rød'], ['#2a5aa0', 'blå'], ['#e0b83a', 'gul'], ['#3a8a4a', 'grønn'], ['#e8e2d0', 'hvit'], ['#7a4a2a', 'brun']];

export default function wiresGame(ctx) {
  const n = ctx.opts.pairs || 3;
  const swapPart = ctx.opts.relay ? 'relé' : ctx.opts.sensor ? 'sensor' : null;
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <rect x="620" y="70" width="300" height="${n * 100 + 40}" rx="12" fill="#3a3f46" stroke="${INK}" stroke-width="6"/>
    ${swapPart ? `<rect x="200" y="420" width="220" height="140" rx="10" fill="#26221f" stroke="${INK}" stroke-width="5"/><text x="310" y="545" text-anchor="middle" font-family="Special Elite" font-size="18" fill="#cfc6b2">SOKKEL</text>` : ''}`);
  const STEPS = swapPart ? [`Bytt ${swapPart}`, 'Koble ledninger'] : ['Koble ledninger'];
  const cols = COLS.slice(0, n);
  const order = cols.map((_, i) => i).sort(() => Math.random() - 0.5);
  let mistakes = 0, done = 0;
  const sockets = order.map((ci, k) => {
    const y = 110 + k * 100;
    const g = svgEl('g', {}, `<rect x="830" y="${y - 22}" width="70" height="44" rx="6" fill="${cols[ci][0]}" stroke="${INK}" stroke-width="4"/><rect x="640" y="${y - 8}" width="190" height="16" fill="#26221f"/>`);
    svg.appendChild(g);
    return { ci, x: 830, y };
  });
  const start = () => {
    ctx.steps(STEPS, swapPart ? 1 : 0);
    ctx.hint('Dra hver ledning til kontakten med <b>samme farge</b>.');
    cols.forEach((c, i) => {
      const y0 = 110 + i * 100;
      const wire = svgEl('path', { stroke: c[0], 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round' });
      const end = svgEl('g', {}, `<rect x="-22" y="-16" width="44" height="32" rx="6" fill="${c[0]}" stroke="${INK}" stroke-width="4"/><rect x="18" y="-6" width="16" height="12" fill="#c8a234" stroke="${INK}" stroke-width="2"/>`);
      svg.appendChild(wire); svg.appendChild(end);
      const draw = (x, y) => wire.setAttribute('d', `M60,${y0} C300,${y0} ${x - 200},${y} ${x},${y}`);
      const home = [140 + Math.random() * 60, y0];
      draw(...home);
      const d = draggable(svg, end, { home, onMove: draw, drop: (x, y) => {
        const s = sockets.find((so) => near(x + 30, y, so.x, so.y, 55));
        if (!s) { draw(...home); return false; }
        if (s.ci !== i) { mistakes++; ctx.mistake(`Feil kontakt – den ${c[1]} skal i ${c[1]}.`); ctx.audio?.synth('spark'); draw(...home); return false; }
        d.set(s.x - 34, s.y); d.lock(); draw(s.x - 34, s.y);
        ctx.audio?.play('clip', { volume: 0.7 });
        if (++done === n) setTimeout(() => ctx.done(3 - Math.min(3, mistakes)), 400);
        return true;
      } });
    });
  };
  if (!swapPart) { start(); return; }
  // Bytt komponenten først: ta ut den gamle (svidd), sett i den nye
  ctx.steps(STEPS, 0);
  ctx.hint(`Ta ut den svidde ${swapPart}n og sett den nye i sokkelen.`);
  const comp = (fresh) => `<rect x="-60" y="-50" width="120" height="100" rx="8" fill="${fresh ? '#2a4a6a' : '#3a3632'}" stroke="${INK}" stroke-width="5"/>${fresh ? '' : '<path d="M-30,-20 q20,-20 40,10 q10,20 -10,30" fill="#1a1008" opacity=".8"/>'}<text y="8" text-anchor="middle" font-family="Special Elite" font-size="16" fill="#cfc6b2">${fresh ? 'NY' : 'SVIDD'}</text>`;
  const old = svgEl('g', {}, comp(false));
  svg.appendChild(old);
  const od = draggable(svg, old, { home: [310, 480], drop: (x, y) => {
    if (x < 160 || x > 470 || y < 380) { od.lock(); old.setAttribute('transform', 'translate(80 520) scale(.6)'); ctx.audio?.play('box', { volume: 0.5 }); putNew(); return true; }
    return false;
  } });
  function putNew() {
    const nw = svgEl('g', {}, comp(true));
    svg.appendChild(nw);
    const nd = draggable(svg, nw, { home: [520, 520], drop: (x, y) => {
      if (near(x, y, 310, 480, 70)) { nd.set(310, 480); nd.lock(); ctx.audio?.play('clip'); start(); return true; }
      return false;
    } });
  }
}
