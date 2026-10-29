// Eksos: et stykke av røret mangler mellom to flenser i ulik høyde og vinkel. Velg røret som passer
// (riktig form og lengde) og dra det inn. Så to klemmer på timing. «Pakning»: velg riktig pakningsstørrelse.
import { svgStage, svgEl, draggable, near, timingBar, INK } from './kit.js';

export default function exhaustGame(ctx) {
  const seal = !!ctx.opts.seal;
  const A = [300, 220], B = [800, seal ? 220 : 220 + (Math.random() < 0.5 ? 90 : -40)];
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <path d="M40,${A[1]} L${A[0]},${A[1]}" stroke="#6f6863" stroke-width="44" stroke-linecap="round"/><path d="M${B[0]},${B[1]} L1060,${B[1]}" stroke="#6f6863" stroke-width="44" stroke-linecap="round"/>
    <rect x="${A[0] - 6}" y="${A[1] - 34}" width="14" height="68" fill="#9a9894" stroke="${INK}" stroke-width="4"/><rect x="${B[0] - 8}" y="${B[1] - 34}" width="14" height="68" fill="#9a9894" stroke="${INK}" stroke-width="4"/>
    <rect x="40" y="380" width="1020" height="190" rx="12" fill="#3a3632" stroke="${INK}" stroke-width="4"/>`);
  const STEPS = [seal ? 'Velg pakning' : 'Velg rør', 'Klem 1', 'Klem 2'];
  let mistakes = 0;
  ctx.steps(STEPS, 0);
  const dy = B[1] - A[1];
  const shapes = seal
    ? [{ ok: true, r: 34 }, { ok: false, r: 24 }, { ok: false, r: 46 }].map((s) => ({ ...s, svg: `<circle r="${s.r}" fill="none" stroke="${INK}" stroke-width="14"/><circle r="${s.r}" fill="none" stroke="#c8a234" stroke-width="8"/>` }))
    : [{ ok: true, d: dy }, { ok: false, d: -dy || 70 }, { ok: false, d: dy * 0.2 }].map((s) => ({ ...s, svg: `<path d="M-250,0 C-100,0 100,${s.d} 250,${s.d}" stroke="${INK}" stroke-width="46" fill="none" stroke-linecap="round"/><path d="M-250,0 C-100,0 100,${s.d} 250,${s.d}" stroke="#8a8680" stroke-width="34" fill="none" stroke-linecap="round"/>` }));
  ctx.hint(seal ? 'Finn pakningen som passer flensen (samme diameter som røret) og dra den inn i skjøten.' : 'Finn røret som har riktig form for å nå fra flens til flens, og dra det inn i gapet.');
  if (seal) svg.insertAdjacentHTML('beforeend', `<path d="M${A[0]},${A[1]} L${B[0]},${B[1]}" stroke="#6f6863" stroke-width="44"/><rect x="${(A[0] + B[0]) / 2 - 10}" y="${A[1] - 40}" width="20" height="80" fill="#2a1a10" stroke="${INK}" stroke-width="3"/>`);
  shapes.sort(() => Math.random() - 0.5).forEach((s, i) => {
    const g = svgEl('g', {}, s.svg);
    svg.appendChild(g);
    const home = seal ? [250 + i * 300, 470] : [200 + i * 340, 450];
    const target = seal ? [(A[0] + B[0]) / 2, A[1]] : [(A[0] + B[0]) / 2, A[1]];
    const d = draggable(svg, g, { home, drop: (x, y) => {
      if (!near(x, y, target[0], target[1] + (seal ? 0 : dy / 2), 140)) return false;
      if (!s.ok) { mistakes++; ctx.mistake(seal ? 'Feil størrelse – den tetter ikke.' : 'Passer ikke – flensene møtes ikke.'); return false; }
      d.set(...target); d.lock(); ctx.audio?.synth('clank'); clamps();
      return true;
    } });
    if (!seal) g.setAttribute('transform', `translate(${home[0]} ${home[1]}) scale(.6)`);
  });
  function clamps() {
    ctx.steps(STEPS, 1);
    ctx.hint('Stram klemmene: klikk når markøren er i det grønne.');
    const pts = [A, B];
    const cl = pts.map(([x, y]) => { const g = svgEl('g', { transform: `translate(${x} ${y})` }, `<rect x="-14" y="-34" width="28" height="68" rx="6" fill="#c9c6bc" stroke="${INK}" stroke-width="4"/>`); g.style.opacity = 0.5; svg.appendChild(g); return g; });
    const bar = timingBar(ctx, svg, { x: 300, y: 330, w: 500, zone: 0.2 });
    let i = 0, errs = [];
    const onHit = () => {
      const e = bar.hit(); errs.push(e);
      cl[i].style.opacity = 1;
      ctx.audio?.synth(e <= 1 ? 'wrench' : 'clank');
      if (e > 1) ctx.mistake('Lekker litt');
      if (++i === 2) {
        svg.removeEventListener('pointerdown', onHit); bar.stop();
        const avg = (Math.min(2, errs[0]) + Math.min(2, errs[1])) / 2;
        setTimeout(() => ctx.done((avg <= 0.4 ? 3 : avg <= 0.9 ? 2 : 1) - mistakes), 400);
      } else ctx.steps(STEPS, 2);
    };
    setTimeout(() => svg.addEventListener('pointerdown', onHit), 200);
  }
}
