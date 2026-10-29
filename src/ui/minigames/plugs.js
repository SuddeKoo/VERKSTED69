// Tennplugger: gnisttesteren viser hvilken sylinder som fusker (svak gul gnist i stedet for blå).
// Ved motorfusking skal bare den dårlige byttes; ved slitte plugger alle fire. Bytt: hold for å skru ut,
// dra ny plugg i hullet, klikk tennkabelen på igjen.
import { svgStage, svgEl, holdable, draggable, near, INK } from './kit.js';

export default function plugsGame(ctx) {
  const all = (ctx.opts.bad || 1) >= 4;
  const bad = all ? [0, 1, 2, 3] : [Math.floor(Math.random() * 4)];
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <rect x="140" y="180" width="820" height="220" rx="24" fill="#5a5450" stroke="${INK}" stroke-width="6"/>
    <rect x="140" y="470" width="820" height="100" rx="10" fill="#3a3632" stroke="${INK}" stroke-width="4"/><text x="160" y="500" font-family="Special Elite" font-size="18" fill="#cfc6b2">NYE PLUGGER</text>`);
  const STEPS = ['Finn dårlige plugger', 'Bytt', 'Koble kabler'];
  const cyl = [0, 1, 2, 3].map((i) => ({ i, x: 260 + i * 190, y: 260, bad: bad.includes(i), out: false, newIn: false, wired: true }));
  let mistakes = 0, replaced = 0;
  const cleanups = [];
  const sparks = svgEl('g'); svg.appendChild(sparks);
  cyl.forEach((c) => {
    c.g = svgEl('g', { transform: `translate(${c.x} ${c.y})` }, `<circle r="40" fill="#3a3632" stroke="${INK}" stroke-width="5"/><g class="plug"><rect x="-14" y="-90" width="28" height="60" fill="#f2efe4" stroke="${INK}" stroke-width="4"/><rect x="-18" y="-34" width="36" height="22" fill="#9a9894" stroke="${INK}" stroke-width="3"/></g><path class="cable" d="M0,-90 q0,-60 ${80 - c.i * 50},-90" stroke="#c43a2a" stroke-width="12" fill="none"/><text y="70" text-anchor="middle" font-family="Rubik Dirt" font-size="22" fill="#e9e2d0">${c.i + 1}</text>`);
    svg.appendChild(c.g);
  });
  ctx.steps(STEPS, 0);
  ctx.hint(all ? 'Alle pluggene er utbrent. Hold inne på hver plugg for å skru den ut.' : 'Se på gnistene: én sylinder gir <b>svak, gul gnist</b>. Hold inne på den pluggen for å skru den ut.');
  // Gnister i sanntid
  let t = 0;
  cleanups.push(ctx.frame((dt) => {
    t += dt;
    sparks.innerHTML = cyl.filter((c) => !c.out && c.wired).map((c) => {
      const on = (Math.sin(t * 9 + c.i * 1.7) > (c.bad && !c.newIn ? 0.75 : 0.1));
      return on ? `<path d="M${c.x - 10},${c.y + 6} l12,10 l-6,6 l14,12" stroke="${c.bad && !c.newIn ? '#e0b83a' : '#8ac8ff'}" stroke-width="${c.bad && !c.newIn ? 3 : 5}" fill="none"/>` : '';
    }).join('');
  }));
  cyl.forEach((c) => {
    cleanups.push(holdable(ctx, svg, c.g, 0.6 * ctx.hold, () => {
      if (!c.bad) { mistakes++; ctx.mistake('Den pluggen var fin! Skrudd inn igjen.'); delete c.g.dataset.done; return; }
      c.out = true; c.wired = false;
      c.g.querySelector('.plug').style.opacity = 0.15;
      c.g.querySelector('.cable').setAttribute('d', `M0,-150 q0,-20 ${80 - c.i * 50},-30`);
      ctx.audio?.synth('bolt_out');
      newPlug(c);
    }, { ring: [0, -40, 40] }));
  });
  function newPlug(c) {
    ctx.steps(STEPS, 1);
    ctx.hint('Dra en ny plugg fra skuffen ned i hullet.');
    const p = svgEl('g', {}, `<rect x="-14" y="-90" width="28" height="60" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="-18" y="-34" width="36" height="22" fill="#c8c6be" stroke="${INK}" stroke-width="3"/>`);
    svg.appendChild(p);
    const d = draggable(svg, p, { home: [320 + replaced * 120, 560], drop: (x, y) => {
      const target = cyl.find((k) => k.out && !k.newIn && near(x, y, k.x, k.y, 70));
      if (!target) return false;
      d.set(target.x, target.y); d.lock(); target.newIn = true;
      ctx.audio?.play('ratchet', { volume: 0.6 });
      wire(target);
      return true;
    } });
  }
  function wire(c) {
    ctx.steps(STEPS, 2);
    ctx.hint('Klikk på tennkabelen for å trykke den på plass.');
    const cab = c.g.querySelector('.cable');
    cab.style.cursor = 'pointer';
    svg.appendChild(c.g);
    cab.addEventListener('click', () => {
      if (c.wired) return;
      c.wired = true;
      cab.setAttribute('d', `M0,-90 q0,-60 ${80 - c.i * 50},-90`);
      ctx.audio?.play('clip', { volume: 0.6 });
      if (++replaced === bad.length) setTimeout(() => ctx.done(3 - Math.min(3, mistakes)), 600);
      else { ctx.steps(STEPS, 1); ctx.hint('Neste plugg: hold inne for å skru den ut.'); }
    });
  }
  return () => cleanups.forEach((f) => f());
}
