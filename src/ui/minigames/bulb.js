// Lyspære: ta ut den døde pæra, finn pæra som passer sokkelen (riktig sokkeltype), sett den i og vri den fast.
import { svgStage, svgEl, draggable, near, INK } from './kit.js';

const TYPES = {
  H4: { label: 'H4', base: (c) => `<rect x="-26" y="10" width="52" height="16" fill="#9a9894" stroke="${INK}" stroke-width="3"/><rect x="-22" y="26" width="8" height="18" fill="#c8a234"/><rect x="-4" y="26" width="8" height="18" fill="#c8a234"/><rect x="14" y="26" width="8" height="18" fill="#c8a234"/>`, sock: 3 },
  H7: { label: 'H7', base: () => `<rect x="-18" y="10" width="36" height="14" fill="#9a9894" stroke="${INK}" stroke-width="3"/><rect x="-14" y="24" width="8" height="22" fill="#c8a234"/><rect x="6" y="24" width="8" height="22" fill="#c8a234"/>`, sock: 2 },
  P21W: { label: 'P21W', base: () => `<rect x="-16" y="10" width="32" height="30" rx="4" fill="#b7b4ac" stroke="${INK}" stroke-width="3"/><rect x="-22" y="20" width="8" height="8" fill="#9a9894" stroke="${INK}" stroke-width="2"/><rect x="14" y="20" width="8" height="8" fill="#9a9894" stroke="${INK}" stroke-width="2"/>`, sock: 'bay' },
  W5W: { label: 'W5W', base: () => `<rect x="-10" y="10" width="20" height="26" fill="#e8e2d0" stroke="${INK}" stroke-width="3"/><path d="M-6,36 l0,8 M6,36 l0,8" stroke="#c8a234" stroke-width="4"/>`, sock: 'wedge' },
};
const bulbSvg = (t, dead) => `<g><ellipse cx="0" cy="-20" rx="30" ry="36" fill="${dead ? '#5a5244' : '#fff4c4'}" stroke="${INK}" stroke-width="4" opacity=".95"/>${dead ? '<path d="M-10,-30 l20,16 M10,-30 l-20,16" stroke="#2a2420" stroke-width="3"/>' : '<path d="M-8,-30 q8,-10 16,0" stroke="#e0b83a" stroke-width="3" fill="none"/>'}${TYPES[t].base()}</g>`;

export default function bulbGame(ctx) {
  const want = ctx.opts.rear ? 'P21W' : Math.random() < 0.5 ? 'H4' : 'H7';
  const S0 = [550, 250];
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <circle cx="${S0[0]}" cy="${S0[1]}" r="170" fill="${ctx.opts.rear ? '#5a1a14' : '#d8d2b0'}" stroke="${INK}" stroke-width="8" opacity=".85"/>
    <circle cx="${S0[0]}" cy="${S0[1]}" r="60" fill="#1d1a18" stroke="${INK}" stroke-width="5"/>
    <text x="${S0[0]}" y="${S0[1] + 110}" text-anchor="middle" font-family="Special Elite" font-size="22" fill="#2a2420">SOKKEL: ${want}</text>
    <rect x="60" y="440" width="980" height="140" rx="12" fill="#3a3632" stroke="${INK}" stroke-width="5"/>`);
  let mistakes = 0;
  const STEPS = ['Ta ut pæra', 'Velg riktig pære', 'Vri fast'];
  ctx.steps(STEPS, 0);
  ctx.hint('Dra den døde pæra ut av lykta.');
  const old = svgEl('g', {}, bulbSvg(want, true));
  svg.appendChild(old);
  const od = draggable(svg, old, { home: [S0[0], S0[1] + 10], drop: (x, y) => {
    if (y > 400 || Math.hypot(x - S0[0], y - S0[1]) > 200) { od.lock(); old.setAttribute('transform', 'translate(140 520) scale(.7)'); old.style.opacity = 0.5; ctx.audio?.play('clip', { volume: 0.5 }); choose(); return true; }
    return false;
  } });
  function choose() {
    ctx.steps(STEPS, 1);
    ctx.hint(`Finn pæra med sokkel som passer (${want}). Se på føttene og pinnene.`);
    const types = Object.keys(TYPES).sort(() => Math.random() - 0.5);
    types.forEach((t, i) => {
      const g = svgEl('g', {}, `${bulbSvg(t, false)}<text y="74" text-anchor="middle" font-family="Special Elite" font-size="16" fill="#cfc6b2">${TYPES[t].label}</text>`);
      svg.appendChild(g);
      const home = [330 + i * 150, 500];
      const d = draggable(svg, g, { home, drop: (x, y) => {
        if (!near(x, y, S0[0], S0[1], 90)) return false;
        if (t !== want) { mistakes++; ctx.mistake(`${TYPES[t].label} passer ikke i en ${want}-sokkel.`); return false; }
        d.set(S0[0], S0[1] + 10); d.lock(); ctx.audio?.play('clip');
        twist(g);
        return true;
      } });
    });
  }
  function twist(g) {
    ctx.steps(STEPS, 2);
    ctx.hint('Klikk på pæra for å vri den fast (tre klikk).');
    let turns = 0;
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => {
      turns++;
      g.setAttribute('transform', `translate(${S0[0]} ${S0[1] + 10}) rotate(${turns * 30})`);
      ctx.audio?.synth('tick', { volume: 0.7 });
      if (turns === 3) { ctx.audio?.synth('pop'); svg.insertAdjacentHTML('beforeend', `<circle cx="${S0[0]}" cy="${S0[1] - 10}" r="140" fill="#fff4c4" opacity=".35"/>`); setTimeout(() => ctx.done(3 - mistakes), 500); }
    });
  }
}
