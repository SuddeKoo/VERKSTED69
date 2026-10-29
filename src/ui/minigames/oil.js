// Olje: (oljeskift: skru ut tappeplugg → la det renne ut → skru inn → bytt filter) → fyll ny olje.
// Fylling er presisjon: hold inne for å helle; nivået må havne i det grønne mellom MIN og MAX.
import { svgStage, svgEl, holdable, draggable, near, svgButton, INK } from './kit.js';

export default function oilGame(ctx) {
  const full = !!ctx.opts.full;
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <rect x="80" y="120" width="420" height="300" rx="20" fill="#5a5450" stroke="${INK}" stroke-width="6"/><text x="290" y="290" text-anchor="middle" font-family="Rubik Dirt" font-size="34" fill="#3a3632">MOTOR</text>
    <g class="gauge" transform="translate(760 80)"><rect width="110" height="420" rx="14" fill="#1d1a18" stroke="${INK}" stroke-width="6"/>
      <rect class="g-zone" x="8" y="0" width="94" height="0" fill="#4f8a5a" opacity=".85"/><rect class="g-level" x="14" y="406" width="82" height="0" fill="#c8902a"/>
      <text x="124" y="0" class="g-max" font-family="Special Elite" font-size="18" fill="#cfc6b2">MAX</text><text x="124" y="0" class="g-min" font-family="Special Elite" font-size="18" fill="#cfc6b2">MIN</text></g>`);
  const STEPS = full ? ['Tapp ut', 'Bytt filter', 'Fyll olje'] : ['Fyll olje'];
  const zoneH = 46 * ctx.precision, zoneY = 140; // grønt felt (piksler i måleren)
  svg.querySelector('.g-zone').setAttribute('y', zoneY); svg.querySelector('.g-zone').setAttribute('height', zoneH);
  svg.querySelector('.g-max').setAttribute('y', zoneY + 6); svg.querySelector('.g-min').setAttribute('y', zoneY + zoneH);
  const levelEl = svg.querySelector('.g-level');
  let level = full ? 300 : 110 + Math.random() * 60; // px fylt (0 = tom, 406 = full)
  const draw = () => { const h = Math.max(0, Math.min(406, level)); levelEl.setAttribute('y', 406 - h); levelEl.setAttribute('height', h); };
  draw();
  const cleanups = [];
  if (full) drain(); else pour();

  function drain() {
    ctx.steps(STEPS, 0);
    ctx.hint('Hold inne på tappepluggen under motoren for å skru den ut.');
    const plug = svgEl('g', { transform: 'translate(290 440)' }, `<polygon points="-22,-12 0,-24 22,-12 22,12 0,24 -22,12" fill="#b7b4ac" stroke="${INK}" stroke-width="4"/>`);
    svg.appendChild(plug);
    cleanups.push(holdable(ctx, svg, plug, 0.8 * ctx.hold, () => {
      plug.style.display = 'none';
      ctx.audio?.synth('drain');
      const stream = svgEl('path', { d: 'M290,440 q-6,60 0,120', stroke: '#1a1008', 'stroke-width': 14, fill: 'none' });
      svg.appendChild(stream);
      ctx.hint('Olja renner ut…');
      const stop = ctx.frame((dt) => {
        level -= dt * 160;
        draw();
        if (level <= 0) { stop(); stream.remove(); level = 0; draw(); plug.style.display = ''; plug.dataset.done = ''; ctx.audio?.play('ratchet', { volume: 0.6 }); swapFilter(); }
      });
    }, { ring: [0, 0, 30] }));
  }
  function swapFilter() {
    ctx.steps(STEPS, 1);
    ctx.hint('Dra det gamle oljefilteret av, og sett på det nye.');
    const flt = (fresh) => `<rect x="-36" y="-50" width="72" height="100" rx="12" fill="${fresh ? '#d8a838' : '#5a4a2a'}" stroke="${INK}" stroke-width="5"/><path d="M-36,-20 L36,-20 M-36,10 L36,10" stroke="${INK}" stroke-width="3"/>`;
    const old = svgEl('g', {}, flt(false)); svg.appendChild(old);
    const od = draggable(svg, old, { home: [460, 200], drop: (x) => {
      if (x > 560) { od.lock(); old.setAttribute('transform', 'translate(640 520) scale(.6)'); ctx.audio?.play('box', { volume: 0.5 }); const nw = svgEl('g', {}, flt(true)); svg.appendChild(nw);
        const nd = draggable(svg, nw, { home: [640, 420], drop: (x2, y2) => { if (near(x2, y2, 460, 200, 70)) { nd.set(460, 200); nd.lock(); ctx.audio?.play('ratchet'); pour(); return true; } return false; } });
        return true; }
      return false;
    } });
  }
  function pour() {
    ctx.steps(STEPS, full ? 2 : 0);
    ctx.hint('Hold inne på kanna for å helle. Slipp når nivået er i det <b>grønne</b>. Det renner litt etter!');
    const can = svgEl('g', { transform: 'translate(560 110)', class: 'oilcan' }, `<rect x="-50" y="-40" width="100" height="120" rx="10" fill="#3c6aa0" stroke="${INK}" stroke-width="5"/><path d="M50,-20 L100,-50 L106,-40 L56,0" fill="#3c6aa0" stroke="${INK}" stroke-width="4"/><text y="30" text-anchor="middle" font-family="Rubik Dirt" font-size="24" fill="#f1e6c8">5W-30</text>`);
    svg.appendChild(can);
    const stream = svgEl('path', { d: 'M660,70 q30,40 40,90 L720,500', stroke: '#c8902a', 'stroke-width': 9, fill: 'none', opacity: 0 });
    svg.appendChild(stream);
    let pouring = false, flow = 0, finished = false, glug = 0;
    can.style.cursor = 'pointer';
    can.addEventListener('pointerdown', (e) => { e.preventDefault(); pouring = true; });
    const up = () => { pouring = false; };
    window.addEventListener('pointerup', up);
    cleanups.push(() => window.removeEventListener('pointerup', up));
    const target = 406 - zoneY - zoneH / 2;
    const btn = svgButton(svg, 880, 520, 180, 56, 'FERDIG', () => finish());
    const finish = () => {
      if (finished) return;
      finished = true; btn.remove();
      const top = 406 - zoneY, bottom = 406 - zoneY - zoneH;
      const inZone = level <= top && level >= bottom;
      const err = Math.abs(level - target) / (zoneH / 2);
      ctx.done(inZone ? (err < 0.45 ? 3 : 2) : err < 2 ? 1 : 0);
    };
    const stop = ctx.frame((dt) => {
      flow += ((pouring ? 1 : 0) - flow) * Math.min(1, dt * 3); // renner litt etter når du slipper
      can.setAttribute('transform', `translate(560 110) rotate(${flow * 30})`);
      stream.setAttribute('opacity', flow > 0.05 ? 1 : 0);
      level += flow * dt * (full ? 120 : 70);
      glug -= dt;
      if (flow > 0.3 && glug <= 0) { glug = 0.35; ctx.audio?.synth('pour', { volume: 0.5 }); }
      draw();
      if (level > 400 && !finished) { ctx.mistake('Det renner over!'); finish(); }
    });
    cleanups.push(stop);
  }
  return () => cleanups.forEach((c) => c());
}
