// Luftfilter: dra rundt filterlokket mot klokka for å skru det opp → bytt filteret → skru igjen med klokka
// til momentet står i det grønne. For hardt eller for løst trekker ned.
import { svgStage, svgEl, local, draggable, near, svgButton, INK } from './kit.js';

const C = [430, 300];

export default function filterGame(ctx) {
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <circle cx="${C[0]}" cy="${C[1]}" r="190" fill="#3a3632" stroke="${INK}" stroke-width="6"/>
    <g class="tq" transform="translate(860 120)"><rect width="80" height="360" rx="12" fill="#1d1a18" stroke="${INK}" stroke-width="5"/><rect class="tq-zone" x="6" width="68" fill="#4f8a5a"/><rect class="tq-fill" x="12" y="354" width="56" height="0" fill="#e0b83a"/><text x="40" y="-14" text-anchor="middle" font-family="Special Elite" font-size="18" fill="#cfc6b2">MOMENT</text></g>`);
  const STEPS = ['Skru opp lokket', 'Bytt filter', 'Skru igjen'];
  const lid = svgEl('g', { transform: `translate(${C[0]} ${C[1]})` }, `<circle r="150" fill="#2a2a2a" stroke="${INK}" stroke-width="6"/>${Array.from({ length: 12 }, (_, i) => `<rect x="-8" y="-150" width="16" height="26" fill="#4a4a4a" transform="rotate(${i * 30})"/>`).join('')}<path d="M-60,0 L60,0 M0,-60 L0,60" stroke="#4a4a4a" stroke-width="18"/><circle r="22" fill="#e0b83a" stroke="${INK}" stroke-width="4"/>`);
  svg.appendChild(lid);
  const zH = 50 * ctx.precision, zY = 120;
  svg.querySelector('.tq-zone').setAttribute('y', zY); svg.querySelector('.tq-zone').setAttribute('height', zH);
  const fill = svg.querySelector('.tq-fill');
  let phase = 0, rot = 0, lastA = null, torque = 0;
  ctx.steps(STEPS, 0);
  ctx.hint('Dra i en sirkel rundt lokket <b>mot klokka</b> for å skru det opp.');
  let dragging = false;
  lid.style.cursor = 'grab';
  lid.addEventListener('pointerdown', (e) => { if (phase === 0 || phase === 2) { dragging = true; lid.setPointerCapture(e.pointerId); lastA = null; } });
  lid.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const [x, y] = local(svg, e);
    const a = Math.atan2(y - C[1], x - C[0]);
    if (lastA != null) {
      let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      if (phase === 0 && d < 0) { rot += d; if (Math.random() < 0.3) ctx.audio?.synth('wrench', { volume: 0.3 }); }
      if (phase === 2 && d > 0) { rot += d; torque += d * 40; if (Math.random() < 0.3) ctx.audio?.synth('tick', { volume: 0.4 }); }
      lid.setAttribute('transform', `translate(${C[0]} ${C[1]}) rotate(${(rot * 180) / Math.PI})`);
      fill.setAttribute('height', Math.max(0, Math.min(354, torque))); fill.setAttribute('y', 354 - Math.max(0, Math.min(354, torque)));
      if (phase === 0 && rot < -Math.PI * 3) { dragging = false; phase = 1; lid.style.display = 'none'; ctx.audio?.play('box', { volume: 0.5 }); swap(); }
    }
    lastA = a;
  });
  lid.addEventListener('pointerup', () => { dragging = false; });
  function swap() {
    ctx.steps(STEPS, 1);
    ctx.hint('Dra det skitne filteret ut og legg det nye i boksen.');
    const f = (fresh) => `<circle r="120" fill="${fresh ? '#e8c84a' : '#6b6152'}" stroke="${INK}" stroke-width="5"/>${Array.from({ length: 24 }, (_, i) => `<line x1="0" y1="-60" x2="0" y2="-118" stroke="${fresh ? '#b8982a' : '#4a4232'}" stroke-width="4" transform="rotate(${i * 15})"/>`).join('')}<circle r="60" fill="#3a3632" stroke="${INK}" stroke-width="4"/>`;
    const old = svgEl('g', {}, f(false)); svg.appendChild(old);
    const od = draggable(svg, old, { home: C, drop: (x) => {
      if (x > 640) { od.lock(); old.setAttribute('transform', 'translate(720 520) scale(.35)'); const nw = svgEl('g', {}, f(true)); svg.appendChild(nw);
        const nd = draggable(svg, nw, { home: [720, 300], drop: (x2, y2) => { if (near(x2, y2, ...C, 80)) { nd.set(...C); nd.lock(); ctx.audio?.play('box'); close(); return true; } return false; } });
        nw.setAttribute('transform', 'translate(720 300) scale(.6)');
        return true; }
      return false;
    } });
  }
  function close() {
    phase = 2; rot = 0; torque = 0;
    svg.appendChild(lid); lid.style.display = '';
    ctx.steps(STEPS, 2);
    ctx.hint('Skru lokket igjen <b>med klokka</b>. Stopp når momentet er i det grønne, og trykk FERDIG.');
    svgButton(svg, 830, 520, 150, 56, 'FERDIG', () => {
      const t = 354 - torque; // y-posisjon til toppen av fyllet
      const inZone = t >= zY && t <= zY + zH;
      const err = Math.abs(t - (zY + zH / 2)) / (zH / 2);
      ctx.done(inZone ? (err < 0.5 ? 3 : 2) : err < 2.5 ? 1 : 0);
    });
  }
}
