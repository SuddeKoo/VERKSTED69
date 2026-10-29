// Batteribytte: koble fra MINUS først, så pluss → løft ut det gamle → sett i det nye → koble til PLUSS
// først (rød kabel), så minus (svart). Feil rekkefølge gir gnister og trekker ned.
import { svgStage, svgEl, draggable, near, INK } from './kit.js';

export default function batteryGame(ctx) {
  const plusLeft = Math.random() < 0.5;
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#33302c"/><rect x="300" y="430" width="500" height="40" fill="#1d1a18"/>
    <rect x="20" y="400" width="200" height="170" rx="10" fill="none" stroke="#cfc6b2" stroke-width="3" stroke-dasharray="10 8"/><text x="120" y="555" text-anchor="middle" font-family="Special Elite" font-size="18" fill="#cfc6b2">GAMMELT</text>`);
  const STEPS = ['Koble fra', 'Løft ut', 'Sett i nytt', 'Koble til'];
  const bat = (fresh) => `<rect x="-150" y="-100" width="300" height="200" rx="10" fill="${fresh ? '#2a2a2c' : '#3a3634'}" stroke="${INK}" stroke-width="6"/><rect x="-110" y="-40" width="220" height="50" fill="${fresh ? '#e0b83a' : '#8a7a4a'}"/><text y="-6" text-anchor="middle" font-family="Rubik Dirt" font-size="26">${fresh ? '74 Ah' : 'GAMMEL'}</text>
    <rect x="${plusLeft ? -120 : 70}" y="-130" width="50" height="34" fill="#b8b6ae" stroke="${INK}" stroke-width="4"/><text x="${plusLeft ? -95 : 95}" y="-136" text-anchor="middle" font-family="Rubik Dirt" font-size="34" fill="#ff5a3a">+</text>
    <rect x="${plusLeft ? 70 : -120}" y="-130" width="50" height="34" fill="#b8b6ae" stroke="${INK}" stroke-width="4"/><text x="${plusLeft ? 95 : -95}" y="-136" text-anchor="middle" font-family="Rubik Dirt" font-size="34" fill="#cfc6b2">−</text>${fresh ? '' : '<path d="M-130,60 q30,-10 60,4" stroke="#7aa070" stroke-width="10" opacity=".6" fill="none"/>'}`;
  const P = [550, 330];
  const termX = { plus: P[0] + (plusLeft ? -95 : 95), minus: P[0] + (plusLeft ? 95 : -95) }, termY = P[1] - 113;
  const oldB = svgEl('g', { transform: `translate(${P[0]} ${P[1]})` }, bat(false));
  svg.appendChild(oldB);
  let mistakes = 0;
  // Kabelendene: plass på polene
  const cable = (kind) => {
    const col = kind === 'plus' ? '#c43a2a' : '#2a2a2a';
    const g = svgEl('g', { class: 'clamp' }, `<rect x="-26" y="-22" width="52" height="40" rx="8" fill="${col}" stroke="${INK}" stroke-width="4"/><text y="8" text-anchor="middle" font-family="Rubik Dirt" font-size="24" fill="#f1e6c8">${kind === 'plus' ? '+' : '−'}</text>`);
    const wire = svgEl('path', { stroke: col, 'stroke-width': 16, fill: 'none', 'stroke-linecap': 'round' });
    svg.appendChild(wire); svg.appendChild(g);
    return { g, wire, kind, home: kind === 'plus' ? [plusLeft ? 230 : 870, 150] : [plusLeft ? 870 : 230, 150], on: true };
  };
  const cables = [cable('plus'), cable('minus')];
  const placeWire = (c, x, y) => c.wire.setAttribute('d', `M${c.kind === 'plus' ? (plusLeft ? 120 : 980) : (plusLeft ? 980 : 120)},40 Q${(x + 550) / 2},${y - 160} ${x},${y}`);
  cables.forEach((c) => { c.g.setAttribute('transform', `translate(${termX[c.kind]} ${termY})`); placeWire(c, termX[c.kind], termY); });
  let phase = 0, removed = [];
  ctx.steps(STEPS, 0);
  ctx.hint('Koble fra polklemmene. Husk: <b>minus først</b> når du kobler fra.');
  cables.forEach((c) => {
    c.g.style.cursor = 'pointer';
    c.g.addEventListener('click', () => {
      if (phase !== 0 || !c.on) return;
      if (!removed.length && c.kind === 'plus') { mistakes++; ctx.mistake('Gnister! Minus skal av først.'); ctx.audio?.synth('spark'); }
      c.on = false; removed.push(c.kind);
      c.g.setAttribute('transform', `translate(${c.home[0]} ${c.home[1]})`); placeWire(c, c.home[0], c.home[1]);
      ctx.audio?.play('clip', { volume: 0.6 });
      if (removed.length === 2) { phase = 1; ctx.steps(STEPS, 1); ctx.hint('Løft ut det gamle batteriet til «GAMMELT».'); liftOut(); }
    });
  });
  function liftOut() {
    const d = draggable(svg, oldB, { home: P, drop: (x, y) => {
      if (x < 300 && y > 380) { oldB.setAttribute('transform', 'translate(120 490) scale(.45)'); d.lock(); ctx.audio?.play('thump', { volume: 0.7 }); putNew(); return true; }
      return false;
    } });
  }
  function putNew() {
    phase = 2; ctx.steps(STEPS, 2);
    ctx.hint('Sett det nye batteriet på plass i brettet.');
    const nb = svgEl('g', {}, bat(true));
    svg.insertBefore(nb, cables[0].wire);
    const d = draggable(svg, nb, { home: [930, 470], drop: (x, y) => {
      if (near(x, y, P[0], P[1], 90)) { d.set(...P); d.lock(); ctx.audio?.play('thump', { volume: 0.6 }); connect(); return true; }
      return false;
    } });
    nb.setAttribute('transform', 'translate(930 470) scale(.5)');
  }
  function connect() {
    phase = 3; ctx.steps(STEPS, 3);
    ctx.hint('Dra klemmene på polene: <b>rød på pluss først</b>, så svart på minus.');
    let first = null, done = 0;
    cables.forEach((c) => {
      const d = draggable(svg, c.g, { home: c.home, onMove: (x, y) => placeWire(c, x, y), drop: (x, y) => {
        const want = termX[c.kind];
        const wrongPole = near(x, y, termX[c.kind === 'plus' ? 'minus' : 'plus'], termY, 50);
        if (wrongPole) { mistakes++; ctx.mistake('Feil pol! Rød på pluss, svart på minus.'); ctx.audio?.synth('spark'); placeWire(c, ...c.home); return false; }
        if (!near(x, y, want, termY, 50)) { placeWire(c, ...c.home); return false; }
        if (!first && c.kind === 'minus') { mistakes++; ctx.mistake('Pluss skal på først.'); ctx.audio?.synth('spark'); }
        first = first || c.kind;
        d.set(want, termY); d.lock(); placeWire(c, want, termY);
        ctx.audio?.play('clip', { volume: 0.7 }); ctx.audio?.play('ratchet', { volume: 0.4, delay: 0.15 });
        if (++done === 2) setTimeout(() => ctx.done(3 - mistakes), 400);
        return true;
      } });
    });
  }
}
