// Avbalansering: hjulet spinner i balansemaskinen og en rød markør viser det tunge punktet.
// Dra loddet rundt felgkanten og slipp det rett MOTSATT av markøren. To runder (innside og utside).
import { svgStage, svgEl, local, INK } from './kit.js';

const C = [550, 290], R = 150;

export default function balanceGame(ctx) {
  const svg = svgStage(ctx, `
    <rect width="1100" height="600" fill="#2d2a27"/>
    <rect x="330" y="470" width="440" height="110" rx="10" fill="#3c6aa0" stroke="${INK}" stroke-width="6"/><text x="550" y="535" text-anchor="middle" font-family="Rubik Dirt" font-size="28" fill="#f1e6c8">BALANSEMASKIN</text>
    <rect x="380" y="20" width="340" height="60" rx="8" fill="#10180f" stroke="${INK}" stroke-width="4"/><text class="bal-read" x="550" y="60" text-anchor="middle" font-family="Special Elite" font-size="24" fill="#7cff7a">SPINNER…</text>`);
  const wheel = svgEl('g', { transform: `translate(${C[0]} ${C[1]})` }, `<circle r="${R + 40}" fill="#1d1a18" stroke="${INK}" stroke-width="7"/><circle r="${R - 10}" fill="#b7b9b6" stroke="${INK}" stroke-width="6"/><circle r="40" fill="#3a3632" stroke="${INK}" stroke-width="5"/>${Array.from({ length: 5 }, (_, i) => `<line x1="0" y1="0" x2="${Math.cos(i * 1.2566) * (R - 20)}" y2="${Math.sin(i * 1.2566) * (R - 20)}" stroke="#6a6c68" stroke-width="14"/>`).join('')}`);
  svg.appendChild(wheel);
  const heavy = svgEl('circle', { r: 14, fill: '#ff3a2a', stroke: INK, 'stroke-width': 4 });
  wheel.appendChild(heavy);
  const ghost = svgEl('rect', { x: -16, y: -10, width: 32, height: 20, rx: 4, fill: '#9a9894', stroke: INK, 'stroke-width': 3, opacity: 0.9 });
  svg.appendChild(ghost);
  const weight = svgEl('g', { class: 'bal-weight', transform: 'translate(900 300)' }, `<rect x="-24" y="-15" width="48" height="30" rx="5" fill="#9a9894" stroke="${INK}" stroke-width="4"/><text y="7" text-anchor="middle" font-family="Special Elite" font-size="15">40g</text>`);
  svg.appendChild(weight);
  ghost.style.display = 'none';
  const read = svg.querySelector('.bal-read');
  let round = 0, errs = [], spinning = 1.2, angle = 0, target = 0, dragging = false;
  const newRound = () => {
    target = Math.random() * Math.PI * 2;
    spinning = 1.4;
    read.textContent = 'SPINNER…';
    weight.setAttribute('transform', 'translate(900 300)');
    ctx.steps(['Les av tungt punkt', 'Plasser lodd', 'Kontroll'], 0);
    ctx.hint(`Runde ${round + 1} av 2: Vent til hjulet stopper, og dra loddet til felgkanten <b>rett overfor</b> det røde punktet.`);
  };
  newRound();
  const stop = ctx.frame((dt) => {
    if (spinning > 0) {
      spinning -= dt;
      angle += dt * 18 * Math.max(0.1, spinning);
      if (spinning <= 0) { angle = target; read.textContent = 'TUNGT PUNKT FUNNET'; ctx.audio?.synth('beep'); ctx.steps(['Les av tungt punkt', 'Plasser lodd', 'Kontroll'], 1); }
      if (Math.random() < dt * 8) ctx.audio?.synth('hiss', { volume: 0.25 });
    }
    wheel.setAttribute('transform', `translate(${C[0]} ${C[1]}) rotate(${(angle * 180) / Math.PI})`);
    heavy.setAttribute('cx', R - 26); heavy.setAttribute('cy', 0);
  });
  weight.style.cursor = 'grab';
  weight.addEventListener('pointerdown', (e) => { if (spinning > 0) return; dragging = true; weight.setPointerCapture(e.pointerId); ghost.style.display = ''; });
  weight.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const [x, y] = local(svg, e);
    weight.setAttribute('transform', `translate(${x} ${y})`);
    const a = Math.atan2(y - C[1], x - C[0]);
    ghost.setAttribute('transform', `translate(${C[0] + Math.cos(a) * (R - 26)} ${C[1] + Math.sin(a) * (R - 26)}) rotate(${(a * 180) / Math.PI + 90})`);
  });
  weight.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false; ghost.style.display = 'none';
    const [x, y] = local(svg, e);
    const dist = Math.hypot(x - C[0], y - C[1]);
    if (dist < R - 70 || dist > R + 50) { weight.setAttribute('transform', 'translate(900 300)'); ctx.hint('Slipp loddet <b>på felgkanten</b>.'); return; }
    const a = Math.atan2(y - C[1], x - C[0]);
    let err = Math.abs(((a - (target + Math.PI)) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI); // radianer fra perfekt
    err = (err * 180) / Math.PI;
    errs.push(err);
    ctx.audio?.synth('clank', { volume: 0.6 });
    weight.setAttribute('transform', `translate(${C[0] + Math.cos(a) * (R - 26)} ${C[1] + Math.sin(a) * (R - 26)}) rotate(${(a * 180) / Math.PI + 90})`);
    const tol = 10 * ctx.precision;
    read.textContent = err < tol ? 'BALANSERT ✔' : err < tol * 2.2 ? `NESTEN (${Math.round(err)}°)` : `UBALANSE ${Math.round(err)}°`;
    ctx.steps(['Les av tungt punkt', 'Plasser lodd', 'Kontroll'], 2);
    if (++round < 2) setTimeout(newRound, 1100);
    else {
      const avg = errs.reduce((p, c) => p + c, 0) / errs.length;
      setTimeout(() => ctx.done(avg < tol ? 3 : avg < tol * 2.2 ? 2 : avg < tol * 4 ? 1 : 0), 700);
    }
  });
  return stop;
}
