// Felles byggeklosser for minispillene: SVG-scene, dra-og-slipp, hold-inne-knapper, timing-stav og kvalitet.
// Nærbildet er 1100 × 600 «scenepiksler».
export const MW = 1100, MH = 600;
export const INK = '#1b120c';

export function svgStage(ctx, inner = '', cls = '') {
  ctx.el.innerHTML = `<svg class="mg-svg ${cls}" viewBox="0 0 ${MW} ${MH}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  return ctx.el.querySelector('svg');
}
export function svgEl(tag, attrs = {}, html = '') {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (html) e.innerHTML = html;
  return e;
}
/** Musposisjon i scenekoordinater */
export function local(svg, e) {
  const r = svg.getBoundingClientRect();
  return [((e.clientX - r.left) / r.width) * MW, ((e.clientY - r.top) / r.height) * MH];
}

/**
 * Gjør et SVG-element flyttbart. drop(x, y) returnerer true hvis slippet godtas; ellers glir det tilbake.
 * Elementet flyttes med transform translate.
 */
export function draggable(svg, el, { home, drop, onStart, onMove } = {}) {
  let pos = home ? [...home] : [0, 0], start = null, off = [0, 0];
  const set = (x, y) => { pos = [x, y]; el.setAttribute('transform', `translate(${x} ${y})`); };
  set(...pos);
  el.style.cursor = 'grab';
  el.addEventListener('pointerdown', (e) => {
    if (el.dataset.locked) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const [x, y] = local(svg, e);
    start = [...pos]; off = [x - pos[0], y - pos[1]];
    el.classList.add('dragging'); el.style.cursor = 'grabbing';
    onStart?.();
  });
  el.addEventListener('pointermove', (e) => {
    if (!start) return;
    const [x, y] = local(svg, e);
    set(x - off[0], y - off[1]);
    onMove?.(pos[0], pos[1]);
  });
  const up = (e) => {
    if (!start) return;
    el.classList.remove('dragging'); el.style.cursor = 'grab';
    const ok = drop ? drop(pos[0], pos[1]) : true;
    if (!ok) set(...start);
    start = null;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  return { set, get pos() { return pos; }, lock() { el.dataset.locked = '1'; el.style.cursor = 'default'; } };
}

export const near = (x, y, tx, ty, r) => Math.hypot(x - tx, y - ty) <= r;

/** Hold inne på et element i `secs` sekunder (ring som fylles). Returnerer stopp-funksjon. */
export function holdable(ctx, svg, el, secs, onDone, { sound = 'wrench', ring = [0, 0, 26] } = {}) {
  let t = 0, active = false;
  const r = ring[2];
  const arc = svgEl('circle', { cx: ring[0], cy: ring[1], r, fill: 'none', stroke: '#ffd84a', 'stroke-width': 7, 'stroke-dasharray': `0 ${r * 6.3}`, transform: `rotate(-90 ${ring[0]} ${ring[1]})`, 'pointer-events': 'none' });
  el.appendChild(arc);
  el.style.cursor = 'pointer';
  const down = (e) => { e.preventDefault(); if (!el.dataset.done) active = true; };
  const upf = () => { active = false; };
  el.addEventListener('pointerdown', down);
  window.addEventListener('pointerup', upf);
  let snd = 0;
  const stop = ctx.frame((dt) => {
    if (!active || el.dataset.done) { if (!el.dataset.done && t > 0) { t = Math.max(0, t - dt * 2); } }
    else { t += dt; snd -= dt; if (snd <= 0) { snd = 0.22; ctx.audio?.synth(sound, { volume: 0.6 }); } }
    arc.setAttribute('stroke-dasharray', `${(t / secs) * r * 6.28} ${r * 6.3}`);
    if (t >= secs && !el.dataset.done) { el.dataset.done = '1'; active = false; onDone(); }
  });
  return () => { stop(); window.removeEventListener('pointerup', upf); };
}

/**
 * Timing-stav: en markør farer fram og tilbake; klikk når den er i det grønne.
 * Returnerer { el, hit() → avstand 0–1 fra midten (0 = perfekt) }.
 */
export function timingBar(ctx, svg, { x = 300, y = 520, w = 500, zone = 0.18, speed = 1.1 } = {}) {
  const z = Math.min(0.6, zone * ctx.precision);
  const g = svgEl('g', { class: 'tbar' });
  g.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="34" rx="8" fill="#2a2a2a" stroke="${INK}" stroke-width="4"/>
    <rect x="${x + w / 2 - (w * z) / 2}" y="${y + 3}" width="${w * z}" height="28" fill="#4f8a5a"/>
    <rect x="${x + w / 2 - (w * z) / 6}" y="${y + 3}" width="${(w * z) / 3}" height="28" fill="#8fd08a"/>
    <rect class="tb-mark" x="${x}" y="${y - 8}" width="8" height="50" rx="3" fill="#ffd84a" stroke="${INK}" stroke-width="3"/>`;
  svg.appendChild(g);
  const mark = g.querySelector('.tb-mark');
  let t = Math.random() * 2;
  let k = 0;
  const stop = ctx.frame((dt) => {
    t += dt * speed * ctx.slow;
    k = (Math.sin(t * Math.PI) + 1) / 2;
    mark.setAttribute('x', x + k * (w - 8));
  });
  return {
    el: g,
    hit() { return Math.min(1, Math.abs(k - 0.5) / (z / 2)); }, // ≤1 er innenfor sonen
    stop,
  };
}

/** Kvalitet fra antall feil (og evt. presisjon 0–1, der 0 er perfekt) */
export function qualityFrom(mistakes, err = 0) {
  let q = 3 - mistakes;
  if (err > 0.66) q -= 2; else if (err > 0.33) q -= 1;
  return Math.max(0, Math.min(3, q));
}

/** En flat knapp i SVG-scenen */
export function svgButton(svg, x, y, w, h, label, onClick, cls = '') {
  const g = svgEl('g', { class: `mg-btn ${cls}`, transform: `translate(${x} ${y})` });
  g.innerHTML = `<rect width="${w}" height="${h}" rx="8" fill="#f0c44e" stroke="${INK}" stroke-width="4"/><text x="${w / 2}" y="${h / 2 + 7}" text-anchor="middle" font-family="Rubik Dirt, Impact" font-size="20" fill="${INK}">${label}</text>`;
  g.style.cursor = 'pointer';
  g.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  svg.appendChild(g);
  return g;
}
