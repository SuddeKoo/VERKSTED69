// Montering: hold for å løsne boltene → dra ut den gamle delen → sett inn den nye → stram på timing.
// shock: støtdemper (to bolter). hanger: eksosoppheng (gummiringer hektes på to tapper, én bolt).
import { svgStage, svgEl, holdable, draggable, near, timingBar, INK } from './kit.js';

export default function assemblyGame(ctx) {
  const shock = ctx.opts.kind === 'shock';
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    ${shock ? `<rect x="420" y="40" width="260" height="60" fill="#5a5450" stroke="${INK}" stroke-width="5"/><rect x="420" y="430" width="260" height="60" fill="#5a5450" stroke="${INK}" stroke-width="5"/>`
      : `<path d="M60,180 L1040,180" stroke="#6f6863" stroke-width="40" stroke-linecap="round"/><path d="M60,180 L1040,180" stroke="${INK}" stroke-width="4" fill="none" opacity=".5"/><rect x="380" y="40" width="340" height="40" fill="#3a3632" stroke="${INK}" stroke-width="5"/>`}
    <rect x="860" y="400" width="200" height="170" rx="10" fill="none" stroke="#cfc6b2" stroke-width="3" stroke-dasharray="10 8"/><text x="960" y="550" text-anchor="middle" font-family="Special Elite" font-size="18" fill="#cfc6b2">GAMMEL</text>`);
  const STEPS = ['Løsne', 'Ta ut', 'Sett inn', 'Stram'];
  const partSvg = (fresh) => shock
    ? `<rect x="-22" y="-170" width="44" height="60" fill="#9a9894" stroke="${INK}" stroke-width="4"/><rect x="-40" y="-110" width="80" height="200" rx="10" fill="${fresh ? '#c43a2a' : '#5a3a2a'}" stroke="${INK}" stroke-width="5"/>${fresh ? '' : '<path d="M-30,40 q-6,30 0,50" stroke="#1a1008" stroke-width="10"/>'}<rect x="-22" y="90" width="44" height="60" fill="#9a9894" stroke="${INK}" stroke-width="4"/>`
    : `<circle cx="-50" r="34" fill="none" stroke="${INK}" stroke-width="18"/><circle cx="50" r="34" fill="none" stroke="${INK}" stroke-width="18"/><circle cx="-50" r="34" fill="none" stroke="${fresh ? '#3a3632' : '#5a4a3a'}" stroke-width="11"/><circle cx="50" r="34" fill="none" stroke="${fresh ? '#3a3632' : '#5a4a3a'}" stroke-width="11"/>${fresh ? '' : '<path d="M30,-30 l14,14" stroke="#2f2b28" stroke-width="12"/>'}`;
  const P = shock ? [550, 265] : [550, 120];
  const old = svgEl('g', { transform: `translate(${P[0]} ${P[1]})` }, partSvg(false));
  svg.appendChild(old);
  const boltPts = shock ? [[550, 70], [550, 460]] : [[550, 60]];
  const cleanups = [];
  let loose = 0, mistakes = 0;
  ctx.steps(STEPS, 0);
  ctx.hint('Hold inne på boltene for å løsne dem.');
  const bolts = boltPts.map(([x, y]) => {
    const g = svgEl('g', { transform: `translate(${x} ${y})` }, `<polygon points="-20,-12 0,-24 20,-12 20,12 0,24 -20,12" fill="#c9c6bc" stroke="${INK}" stroke-width="4"/>`);
    svg.appendChild(g);
    cleanups.push(holdable(ctx, svg, g, 0.7 * ctx.hold, () => { g.style.opacity = 0.3; ctx.audio?.synth('bolt_out'); if (++loose === bolts.length) takeOut(); }, { ring: [0, 0, 30] }));
    return g;
  });
  function takeOut() {
    ctx.steps(STEPS, 1);
    ctx.hint(`Dra ${shock ? 'den gamle dempen' : 'det gamle opphenget'} ut til «GAMMEL».`);
    const d = draggable(svg, old, { home: P, drop: (x, y) => {
      if (x > 800 && y > 330) { d.lock(); old.setAttribute('transform', 'translate(960 480) scale(.4)'); ctx.audio?.play('thump', { volume: 0.6 }); putIn(); return true; }
      return false;
    } });
  }
  function putIn() {
    ctx.steps(STEPS, 2);
    ctx.hint(`Sett inn ${shock ? 'den nye dempen' : 'det nye opphenget'}.`);
    const nw = svgEl('g', {}, partSvg(true));
    svg.appendChild(nw);
    bolts.forEach((b) => svg.appendChild(b));
    const d = draggable(svg, nw, { home: [200, 330], drop: (x, y) => {
      if (near(x, y, P[0], P[1], 80)) { d.set(...P); d.lock(); ctx.audio?.play('clip'); tighten(); return true; }
      return false;
    } });
  }
  function tighten() {
    ctx.steps(STEPS, 3);
    ctx.hint('Stram boltene: klikk når markøren er i det grønne.');
    const bar = timingBar(ctx, svg, { x: 300, y: 540, w: 500, zone: 0.22 });
    cleanups.push(bar.stop);
    let i = 0, errs = [];
    const onHit = () => {
      if (i >= bolts.length) return;
      const e = bar.hit();
      errs.push(e);
      bolts[i].style.opacity = 1;
      ctx.audio?.synth(e <= 1 ? 'wrench' : 'clank');
      if (e > 1) { mistakes++; ctx.mistake('For løst / for hardt'); }
      if (++i === bolts.length) {
        svg.removeEventListener('pointerdown', onHit);
        const avg = errs.reduce((a, b) => a + Math.min(2, b), 0) / errs.length;
        let q = (avg <= 0.4 ? 3 : avg <= 0.85 ? 2 : 1) - Math.max(0, mistakes - 1);
        if (ctx.up.torque) q = Math.max(2, q);
        setTimeout(() => ctx.done(q), 400);
      }
    };
    setTimeout(() => svg.addEventListener('pointerdown', onHit), 200);
  }
  return () => cleanups.forEach((c) => c());
}
