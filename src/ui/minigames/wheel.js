// Hjulbytte: løsne fem muttere → dra det gamle hjulet av → dra det nye på navet → stram mutterne.
// Stjernemønster (annenhver mutter) gir best resultat. Muttertrekker: ett klikk per mutter.
import { svgStage, svgEl, draggable, near, holdable, INK } from './kit.js';

const HUB = [560, 300];

export default function wheelGame(ctx) {
  const rim = !!ctx.opts.rim;
  const rounds = ctx.opts.both ? 2 : 1;
  let round = 0;
  const cleanups = [];
  let mistakes = 0, starErrors = 0;
  const STEPS = ['Løsne mutterne', 'Ta av hjulet', 'Sett på nytt', 'Stram i stjerne'];

  function startRound() {
    cleanups.splice(0).forEach((c) => c());
    const svg = svgStage(ctx, `
      <rect width="1100" height="600" fill="#2d2a27"/><rect y="470" width="1100" height="130" fill="#3a3632"/>
      <circle cx="${HUB[0]}" cy="${HUB[1]}" r="170" fill="#151210"/>
      <circle cx="${HUB[0]}" cy="${HUB[1]}" r="96" fill="#6a625a" stroke="${INK}" stroke-width="6"/>
      <circle cx="${HUB[0]}" cy="${HUB[1]}" r="30" fill="#3a3632" stroke="${INK}" stroke-width="5"/>
      ${[0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 5); return `<rect x="${HUB[0] + Math.cos(a) * 62 - 4}" y="${HUB[1] + Math.sin(a) * 62 - 22}" width="8" height="26" fill="#b7b4ac" stroke="${INK}" stroke-width="2"/>`; }).join('')}
      <text x="40" y="560" font-family="Special Elite" font-size="20" fill="#cfc6b2">GAMMELT</text><rect x="20" y="380" width="200" height="190" rx="10" fill="none" stroke="#cfc6b2" stroke-width="3" stroke-dasharray="10 8"/>
      <text x="900" y="560" font-family="Special Elite" font-size="20" fill="#cfc6b2">NYTT ${rim ? '(FELG)' : '(DEKK)'}</text>
      ${rounds > 1 ? `<text x="550" y="40" font-family="Rubik Dirt" font-size="26" fill="#f0c44e" text-anchor="middle">HJUL ${round + 1} AV ${rounds}</text>` : ''}`);
    const tire = (id, worn) => `<g id="${id}"><circle r="160" fill="#1d1a18" stroke="${INK}" stroke-width="7"/>${Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2; return `<line x1="${Math.cos(a) * 150}" y1="${Math.sin(a) * 150}" x2="${Math.cos(a) * (worn ? 146 : 132)}" y2="${Math.sin(a) * (worn ? 146 : 132)}" stroke="#3a3430" stroke-width="5"/>`; }).join('')}<circle r="92" fill="${worn ? '#5a5652' : '#b7b9b6'}" stroke="${INK}" stroke-width="6"/>${[0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + i * (Math.PI * 2 / 5); return `<circle cx="${Math.cos(a) * 62}" cy="${Math.sin(a) * 62}" r="11" fill="#2a2724" stroke="${INK}" stroke-width="3"/>`; }).join('')}<circle r="26" fill="#3a3632" stroke="${INK}" stroke-width="4"/>${worn ? '<path d="M-150,-30 q20,-20 40,0" stroke="#7a6a5a" stroke-width="6" fill="none"/>' : '<path d="M-60,-70 q40,-20 90,-6" stroke="#fff" stroke-width="7" fill="none" opacity=".35"/>'}</g>`;
    const oldW = svgEl('g', {}, tire('old', true));
    svg.appendChild(oldW);
    oldW.setAttribute('transform', `translate(${HUB[0]} ${HUB[1]})`);
    // Muttere
    const nuts = [];
    const nutLayer = svgEl('g');
    svg.appendChild(nutLayer);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
      const x = HUB[0] + Math.cos(a) * 62, y = HUB[1] + Math.sin(a) * 62;
      const n = svgEl('g', { class: 'nut', transform: `translate(${x} ${y})` }, `<polygon points="-15,-9 0,-18 15,-9 15,9 0,18 -15,9" fill="#c9c6bc" stroke="${INK}" stroke-width="4"/><circle r="5" fill="#6a6662"/>`);
      nutLayer.appendChild(n);
      nuts.push({ g: n, x, y, i, on: true });
    }
    let phase = 0;
    ctx.steps(STEPS, 0);
    ctx.hint(ctx.up.impact ? 'Klikk på hver mutter med muttertrekkeren for å løsne den.' : 'Hold inne på hver mutter for å løsne den.');
    let loosened = 0;
    const loosen = [];
    cleanups.push(() => loosen.forEach((c) => c()));
    nuts.forEach((n) => {
      const done = () => {
        n.on = false; n.g.style.opacity = 0.25; n.g.style.pointerEvents = 'none';
        ctx.audio?.synth('bolt_out');
        if (++loosened === 5) toRemove();
      };
      if (ctx.up.impact) n.g.addEventListener('click', () => { if (phase === 0 && n.on) { ctx.audio?.synth('impact'); done(); } });
      else loosen.push(holdable(ctx, svg, n.g, 0.55 * ctx.hold, () => { if (phase === 0) { ctx.audio?.play('ratchet', { volume: 0.6 }); done(); } }, { ring: [0, 0, 24] }));
    });

    function toRemove() {
      phase = 1;
      loosen.splice(0).forEach((c) => c());
      nutLayer.style.display = 'none';
      ctx.steps(STEPS, 1);
      ctx.hint('Dra det gamle hjulet av navet og bort til «GAMMELT».');
      const d = draggable(svg, oldW, { home: HUB, drop: (x, y) => {
        if (x < 260 && y > 330) { ctx.audio?.play('thump', { volume: 0.7 }); oldW.setAttribute('transform', 'translate(120 475) scale(.55)'); d.lock(); toNew(); return true; }
        return false;
      } });
    }
    function toNew() {
      phase = 2;
      ctx.steps(STEPS, 2);
      ctx.hint(`Dra det nye ${rim ? 'hjulet med ny felg' : 'dekket'} på navet.`);
      const newW = svgEl('g', {}, tire('new', false));
      svg.appendChild(newW);
      const d = draggable(svg, newW, { home: [960, 470], onStart: () => newW.setAttribute('transform', newW.getAttribute('transform').replace(/ scale\([^)]+\)/, '')), drop: (x, y) => {
        if (near(x, y, HUB[0], HUB[1], 70)) { d.set(...HUB); d.lock(); ctx.audio?.play('thump', { volume: 0.6 }); toTighten(); return true; }
        return false;
      } });
      newW.setAttribute('transform', 'translate(960 470) scale(.55)');
    }
    function toTighten() {
      phase = 3;
      ctx.steps(STEPS, 3);
      ctx.hint('Stram mutterne i <b>stjernemønster</b>: hopp over én hver gang (ikke rundt i ring).');
      nutLayer.style.display = '';
      svg.appendChild(nutLayer);
      const order = [];
      nuts.forEach((n) => { n.g.style.opacity = 0.35; n.g.style.pointerEvents = ''; delete n.g.dataset.done; n.g.querySelectorAll('circle[stroke="#ffd84a"]').forEach((c) => c.remove()); });
      const tightenNut = (n) => {
        if (order.includes(n.i)) return;
        // Stjernemønster: neste mutter skal være to plasser unna forrige
        if (order.length) { const prev = order[order.length - 1]; const step = (n.i - prev + 5) % 5; if (step !== 2 && step !== 3) starErrors++; }
        order.push(n.i);
        n.g.style.opacity = 1;
        n.g.insertAdjacentHTML('beforeend', `<text y="-24" text-anchor="middle" font-family="Rubik Dirt" font-size="20" fill="#ffd84a">${order.length}</text>`);
        if (order.length === 5) {
          if (++round < rounds) { setTimeout(startRound, 600); return; }
          let q = 3 - Math.min(3, Math.ceil(starErrors / (rounds * 1.5))) - mistakes;
          if (ctx.up.torque) q = Math.max(2, q);
          setTimeout(() => ctx.done(q), 400);
        }
      };
      nuts.forEach((n) => {
        if (ctx.up.impact) n.g.addEventListener('click', () => { if (phase === 3) { ctx.audio?.synth('impact'); tightenNut(n); } }, { once: false });
        else cleanups.push(holdable(ctx, svg, n.g, 0.45 * ctx.hold, () => { ctx.audio?.play('ratchet', { volume: 0.6 }); tightenNut(n); }, { ring: [0, 0, 24] }));
      });
    }
  }
  startRound();
  return () => cleanups.forEach((c) => c());
}
