// Bremser: ta av kaliperen og de gamle klossene, og sett sammen igjen i riktig rekkefølge
// (skive → indre kloss → ytre kloss → kaliper → bolt). Delene har ulik form – slippes de i feil
// rekkefølge, avvises de. «Bremselyd»: smør bremsepasta på klossene før de settes i.
import { svgStage, svgEl, draggable, near, INK } from './kit.js';

const SLOT = [560, 300];
const PARTS = [
  { id: 'disc', name: 'Bremseskive', svg: `<circle r="120" fill="#9a9894" stroke="${INK}" stroke-width="6"/><circle r="40" fill="#5a5652" stroke="${INK}" stroke-width="5"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${Math.cos(a * Math.PI / 180) * 24}" cy="${Math.sin(a * Math.PI / 180) * 24}" r="6" fill="#2a2724"/>`).join('')}`, off: [0, 0] },
  { id: 'inner', name: 'Indre kloss', svg: `<path d="M-70,-30 q70,-36 140,0 l-8,30 q-62,-26 -124,0 z" fill="#6a6662" stroke="${INK}" stroke-width="5"/>`, off: [0, -96] },
  { id: 'outer', name: 'Ytre kloss', svg: `<path d="M-70,30 q70,36 140,0 l-8,-30 q-62,26 -124,0 z" fill="#6a6662" stroke="${INK}" stroke-width="5"/>`, off: [0, -150] },
  { id: 'caliper', name: 'Kaliper', svg: `<path d="M-90,-60 L90,-60 Q110,-60 110,-40 L110,30 L-110,30 L-110,-40 Q-110,-60 -90,-60 Z" fill="#b8322a" stroke="${INK}" stroke-width="6"/><text y="-6" text-anchor="middle" font-family="Rubik Dirt" font-size="22" fill="#f1e6c8">KALIPER</text>`, off: [0, -130] },
  { id: 'bolt', name: 'Bolt', svg: `<polygon points="-16,-10 0,-20 16,-10 16,10 0,20 -16,10" fill="#c9c6bc" stroke="${INK}" stroke-width="4"/><rect x="-6" y="18" width="12" height="40" fill="#c9c6bc" stroke="${INK}" stroke-width="3"/>`, off: [120, -150] },
];

export default function brakesGame(ctx) {
  const shims = !!ctx.opts.shims;
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    <circle cx="${SLOT[0]}" cy="${SLOT[1]}" r="150" fill="none" stroke="#cfc6b2" stroke-width="3" stroke-dasharray="12 10"/>
    <rect x="30" y="40" width="200" height="520" rx="12" fill="#3a3632" stroke="${INK}" stroke-width="4"/><text x="130" y="70" text-anchor="middle" font-family="Special Elite" font-size="18" fill="#cfc6b2">NYE DELER</text>
    <rect x="880" y="380" width="190" height="180" rx="12" fill="none" stroke="#cfc6b2" stroke-width="3" stroke-dasharray="10 8"/><text x="975" y="545" text-anchor="middle" font-family="Special Elite" font-size="18" fill="#cfc6b2">GAMLE</text>`);
  const STEPS = shims ? ['Demonter', 'Smør klosser', 'Monter i rekkefølge'] : ['Demonter', 'Monter i rekkefølge'];
  let mistakes = 0;
  // Gammel kaliper og klosser sitter på
  const oldParts = ['caliper', 'outer', 'inner'].map((id, k) => {
    const p = PARTS.find((x) => x.id === id);
    const g = svgEl('g', {}, p.svg); g.style.opacity = 0.9; g.style.filter = 'brightness(.65) sepia(.4)';
    svg.appendChild(g);
    return { id, g, k };
  });
  const disc0 = svgEl('g', { transform: `translate(${SLOT[0]} ${SLOT[1]})` }, PARTS[0].svg); svg.insertBefore(disc0, oldParts[0].g); disc0.style.filter = 'brightness(.65) sepia(.5)';
  ctx.steps(STEPS, 0);
  ctx.hint('Dra av de gamle delene, øverste først: kaliper, så klossene, så skiva – bort til «GAMLE».');
  const order = ['caliper', 'outer', 'inner'];
  let removeIdx = 0;
  const removable = [...oldParts, { id: 'disc', g: disc0 }];
  removable.forEach((o) => {
    const p = PARTS.find((x) => x.id === o.id);
    const home = [SLOT[0] + p.off[0], SLOT[1] + p.off[1] * 0.4];
    const d = draggable(svg, o.g, { home, drop: (x, y) => {
      const want = removeIdx < 3 ? order[removeIdx] : 'disc';
      if (o.id !== want) { ctx.mistake(`Ta av ${PARTS.find((q) => q.id === want).name.toLowerCase()} først.`); return false; }
      if (!(x > 820 && y > 330)) return false;
      d.lock(); o.g.setAttribute('transform', `translate(${940 + removeIdx * 14} ${450 + removeIdx * 10}) scale(.35)`);
      ctx.audio?.play('thump', { volume: 0.5 });
      if (++removeIdx === 4) shims ? paste() : build();
      return true;
    } });
  });
  function paste() {
    ctx.steps(STEPS, 1);
    ctx.hint('Klikk på de nye klossene for å smøre bremsepasta på baksida (mot hvinelyd).');
    let n = 0;
    tray.filter((t) => t.id === 'inner' || t.id === 'outer').forEach((t) => {
      t.g.addEventListener('click', function f() { if (t.pasted) return; t.pasted = true; n++; t.g.insertAdjacentHTML('beforeend', '<path d="M-50,0 q50,-14 100,0" stroke="#e0b83a" stroke-width="8" fill="none"/>'); ctx.audio?.synth('scrub'); if (n === 2) build(); });
    });
  }
  // Nye deler i skuffen (blandet rekkefølge)
  const tray = PARTS.slice().sort(() => Math.random() - 0.5).map((p, i) => {
    const g = svgEl('g', {}, p.svg);
    svg.appendChild(g);
    g.setAttribute('transform', `translate(130 ${120 + i * 96}) scale(.45)`);
    return { ...p, g };
  });
  function build() {
    ctx.steps(STEPS, shims ? 2 : 1);
    ctx.hint('Monter de nye delene i <b>riktig rekkefølge</b>: det som sitter innerst, først.');
    let next = 0;
    tray.forEach((p, i) => {
      const home = [130, 120 + i * 96];
      const d = draggable(svg, p.g, { home, drop: (x, y) => {
        if (!near(x, y, SLOT[0], SLOT[1] - 40, 190)) return false;
        if (PARTS[next].id !== p.id) { mistakes++; ctx.mistake(`${p.name} kan ikke på ennå.`); return false; }
        if (shims && (p.id === 'inner' || p.id === 'outer') && !tray.find((t) => t.id === p.id).pasted) { mistakes++; ctx.mistake('Glemte bremsepasta!'); }
        d.set(SLOT[0] + p.off[0], SLOT[1] + p.off[1] * 0.4); d.lock();
        svg.appendChild(p.g);
        ctx.audio?.synth(p.id === 'bolt' ? 'impact' : 'clank', { volume: 0.7 });
        if (++next === PARTS.length) setTimeout(() => ctx.done(3 - Math.min(3, mistakes)), 500);
        return true;
      } });
      p.g.setAttribute('transform', `translate(${home[0]} ${home[1]}) scale(.45)`);
    });
  }
}
