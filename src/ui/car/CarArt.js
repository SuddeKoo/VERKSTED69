// Lagdelt 2D-bil i SVG. Alle åtte modeller tegnes fra de samme geometritallene (data/cars.js), så
// skader, hjul, lykter og treffsoner havner riktig på hver modell. Skader tegnes ut fra oppdragets feil:
// en feil som er reparert, forsvinner fra tegningen.
import { MODELS, GROUND, COLOR_BY_ID } from '../../data/cars.js';
import { RNG } from '../../core/rng.js';

const INK = '#1b120c';

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Polygon med avrundede hjørner (bilkarosseri med litt håndtegnet ujevnhet) */
function roundPoly(pts, rad, rng) {
  const P = pts.map(([x, y]) => [x + (rng ? (rng.next() - 0.5) * 3 : 0), y + (rng ? (rng.next() - 0.5) * 3 : 0)]);
  const n = P.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n];
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(...v1), l2 = Math.hypot(...v2);
    const r = Math.min(rad, l1 / 2.2, l2 / 2.2);
    const a = [p1[0] + (v1[0] / l1) * r, p1[1] + (v1[1] / l1) * r], b = [p1[0] + (v2[0] / l2) * r, p1[1] + (v2[1] / l2) * r];
    d += `${i ? 'L' : 'M'}${a[0].toFixed(1)},${a[1].toFixed(1)} Q${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)} `;
  }
  return d + 'Z';
}

/** Karosseriets omriss som SVG-sti (uten håndtegnet ujevnhet) – brukes som maske i vaskespillet */
export function bodyPath(modelId) { return roundPoly(MODELS[modelId].body, 26, null); }

/** Geometri for en modell: soner og nøkkelpunkter i bilens egne koordinater (1000 × 440) */
export function geometry(modelId) {
  const m = MODELS[modelId];
  const xs = m.body.map((p) => p[0]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const topAt = (x) => {
    let best = 999;
    const n = m.body.length;
    for (let i = 0; i < n; i++) {
      const [x1, y1] = m.body[i], [x2, y2] = m.body[(i + 1) % n];
      if ((x >= Math.min(x1, x2)) && (x <= Math.max(x1, x2)) && x1 !== x2) {
        const y = y1 + (y2 - y1) * ((x - x1) / (x2 - x1));
        if (y < best) best = y;
      }
    }
    return best;
  };
  const wy = (r) => GROUND - r;
  const { R, F, r } = m.wheels;
  const handle = [m.door[0] + 46, m.belt + 26];
  const g = [...m.glass];
  return {
    m, minX, maxX, topAt,
    wheel: { F: [F, wy(r)], R: [R, wy(r)] }, r,
    handle,
    zones: {
      wheelF: { c: [F, wy(r)], rad: r + 10 },
      wheelR: { c: [R, wy(r)], rad: r + 10 },
      headlight: { c: m.light.F, rad: 30 },
      taillight: { c: m.light.R, rad: 28 },
      lock: { c: handle, rad: 24 },
      hood: { rect: [m.hood[0] + 10, topAt(m.hood[0] + 40) - 12, m.hood[1] - m.hood[0] - 30, 58] },
      glass: { rect: [g[1][0] - 20, g[1][1], g[2][0] - g[1][0] + 30, g[2][1] - g[1][1]] },
      cabin: { rect: [m.door[0] + 6, m.belt - 70, Math.max(80, Math.min(m.door[1], g[2][0]) - m.door[0] - 16), 64] },
      door: { rect: [m.door[0], m.belt + 8, m.door[1] - m.door[0], m.sill - m.belt - 18] },
      bumperF: { rect: [maxX - 70, m.sill - 64, 74, 70] },
      bumperR: { rect: [minX - 4, m.sill - 64, 70, 70] },
      body: { rect: [minX + 30, m.belt + 4, m.door[0] - minX - 36, m.sill - m.belt - 70] },
      under: { rect: [R + r + 10, m.sill + 2, F - R - 2 * r - 20, 40] },
      exhaust: { rect: [minX + 10, m.sill + 4, R - minX + r * 0.4, 36] },
    },
  };
}

/** Er en skade fortsatt synlig? (feilen finnes på bilen og er ikke reparert) */
const has = (job, id, pred) => job.faults.some((f) => f.id === id && !f.fixed && (!pred || pred(f)));

/**
 * Tegn bilen.
 * opts: { lights: bool, hood: bool, removed: {F,R}, spinning: 'F'|'R', paintMist: bool, dirtOverride }
 * Returnerer SVG-streng (viewBox 0 0 1000 440).
 */
export function renderCar(job, opts = {}) {
  const car = job.car;
  const G = geometry(car.model);
  const m = G.m;
  const rng = new RNG(car.seed);
  const base = COLOR_BY_ID[car.color]?.hex || '#777';
  const dark = shade(base, -0.38), light = shade(base, 0.28);
  const uid = `c${car.seed % 100000}`;
  const bodyD = roundPoly(m.body, 26, rng);
  let s = `<defs>
    <clipPath id="${uid}b"><path d="${bodyD}"/></clipPath>
    <pattern id="${uid}d" width="38" height="38" patternUnits="userSpaceOnUse"><circle cx="8" cy="9" r="5" fill="#5a4630" opacity=".55"/><circle cx="27" cy="22" r="7" fill="#4a3a28" opacity=".45"/><circle cx="16" cy="32" r="3" fill="#6b5538" opacity=".6"/><path d="M0 18 q10 -4 20 2 t18 0" stroke="#4b3a28" stroke-width="3" fill="none" opacity=".35"/></pattern>
  </defs>`;
  // Skygge på gulvet (flytter ikke med løftebukken – tegnes av Bay)
  // ── Understell og eksos ──
  const sill = m.sill;
  s += `<g class="under-parts">`;
  s += `<rect x="${G.wheel.R[0]}" y="${sill - 8}" width="${G.wheel.F[0] - G.wheel.R[0]}" height="20" fill="#2a2522" stroke="${INK}" stroke-width="4" rx="6"/>`;
  const exHang = has(job, 'exhaust_loose');
  const exY = sill + 14;
  const exPath = exHang ? `M${G.minX + 18},${exY + 34} L${G.wheel.R[0] + 40},${exY + 20} L${G.wheel.F[0] - 160},${exY}` : `M${G.minX + 18},${exY} L${G.wheel.F[0] - 160},${exY}`;
  s += `<path d="${exPath}" stroke="${INK}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="${exPath}" stroke="#6f6863" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  s += `<rect x="${G.minX + 70}" y="${(exHang ? exY + 18 : exY) - 13}" width="120" height="26" rx="12" fill="#5d5550" stroke="${INK}" stroke-width="4" transform="rotate(${exHang ? -4 : 0} ${G.minX + 130} ${exY})"/>`;
  if (has(job, 'exhaust_damaged')) s += `<path d="M${G.wheel.R[0] + 120},${exY - 6} l10,8 l-6,6 l12,-2" stroke="#1b120c" stroke-width="3" fill="#3b2a1e"/><ellipse cx="${G.wheel.R[0] + 126}" cy="${exY}" rx="9" ry="5" fill="#0d0907"/>`;
  s += `</g>`;
  // ── Karosseri ──
  s += `<path d="${bodyD}" fill="${base}" stroke="${INK}" stroke-width="5.5" stroke-linejoin="round"/>`;
  s += `<g clip-path="url(#${uid}b)">`;
  // Skyggelegging: mørk nedre del, lys stripe langs beltelinja
  s += `<rect x="0" y="${m.belt + 70}" width="1000" height="200" fill="${dark}" opacity=".45"/>`;
  s += `<rect x="0" y="${m.belt + 4}" width="1000" height="10" fill="${light}" opacity=".5"/>`;
  if (car.trim === 'stripe') s += `<rect x="0" y="${m.belt + 40}" width="1000" height="14" fill="${COLOR_BY_ID[car.trimColor]?.hex || '#ddd'}" opacity=".85"/>`;
  if (car.trim === 'twotone') s += `<rect x="0" y="${m.belt + 92}" width="1000" height="200" fill="${shade(COLOR_BY_ID[car.trimColor]?.hex || '#555', -0.2)}" opacity=".9"/>`;
  // Grunn rust etter alder (pynt, ikke en jobb)
  const rustN = Math.round(car.rust * 7);
  for (let i = 0; i < rustN; i++) {
    const x = G.minX + 40 + rng.next() * (G.maxX - G.minX - 80), y = sill - 10 - rng.next() * 40;
    s += `<ellipse cx="${x}" cy="${y}" rx="${6 + rng.next() * 14}" ry="${4 + rng.next() * 6}" fill="#7a3f1c" opacity="${0.35 + rng.next() * 0.3}"/>`;
  }
  // Rustflekk-jobben
  if (has(job, 'rust_spot')) {
    const [rx, ry] = [G.wheel.R[0] + 10, sill - G.r - 26];
    s += `<g class="dmg-rust"><ellipse cx="${rx}" cy="${ry}" rx="62" ry="30" fill="#8a3e16" opacity=".85"/><ellipse cx="${rx + 14}" cy="${ry + 4}" rx="34" ry="16" fill="#5a2208"/><circle cx="${rx - 30}" cy="${ry - 10}" r="7" fill="#a85a26"/><circle cx="${rx + 44}" cy="${ry + 12}" r="5" fill="#a85a26"/><path d="M${rx - 50},${ry + 18} l6,22 M${rx + 4},${ry + 26} l3,18" stroke="#7a3410" stroke-width="5" opacity=".7"/></g>`;
  }
  // Lakkskade: riper langs siden
  if (has(job, 'paint_damage')) {
    s += `<g class="dmg-scratch" stroke="#efe6d2" stroke-width="3.5" fill="none" opacity=".9" stroke-linecap="round">`;
    for (let i = 0; i < 4; i++) { const y = m.belt + 34 + i * 16; s += `<path d="M${G.minX + 90 + i * 30},${y} q180,${-8 + i * 4} 420,${6 - i * 3} t200,-6"/>`; }
    s += `</g>`;
  }
  // Matt, gammel lakk (polering / ny farge)
  if (has(job, 'polish') || has(job, 'cosmetic')) s += `<rect x="0" y="0" width="1000" height="440" fill="#9a9a90" opacity=".32" style="mix-blend-mode:saturation"/><rect x="0" y="0" width="1000" height="440" fill="#c9c2b0" opacity=".18"/>`;
  // Tekstur (samme skitne papirfølelse som portrettene)
  s += `<rect x="0" y="0" width="1000" height="440" filter="url(#grime)" opacity=".42"/>`;
  s += `</g>`;
  // ── Ruter ──
  const glassPts = m.glass.map((p) => p.join(',')).join(' ');
  s += `<polygon points="${glassPts}" fill="#2b3a4a" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`;
  s += `<polygon points="${glassPts}" fill="#7f9bb3" opacity=".25"/>`;
  s += `<path d="M${m.glass[0][0] + 30},${m.glass[0][1] + 12} l60,0 l-40,${m.glass[3][1] - m.glass[0][1] - 24}" fill="#cfe0ee" opacity=".22"/>`;
  for (const px of m.pillars) s += `<rect x="${px - 9}" y="${m.glass[0][1] - 6}" width="18" height="${m.belt - m.glass[0][1] + 8}" fill="${base}" stroke="${INK}" stroke-width="4"/>`;
  if (has(job, 'bad_visibility')) s += `<path d="M${m.glass[2][0] - 70},${m.glass[2][1] - 6} q-30,-60 10,-80" stroke="#d6d0c0" stroke-width="5" fill="none" opacity=".7"/><path d="M${m.glass[2][0] - 40},${m.glass[2][1] - 4} q-30,-50 6,-70" stroke="#d6d0c0" stroke-width="4" fill="none" opacity=".55"/>`;
  // ── Dør ──
  const [d0, d1] = m.door;
  s += `<path d="M${d0},${m.belt - 4} L${d0},${sill - 6} M${d1},${m.belt - 4} L${d1 - 6},${sill - 6}" stroke="${INK}" stroke-width="3.5" opacity=".85"/>`;
  s += `<rect x="${G.handle[0] - 18}" y="${G.handle[1] - 5}" width="36" height="10" rx="4" fill="${shade(base, -0.55)}" stroke="${INK}" stroke-width="3"/>`;
  if (has(job, 'frozen_lock')) s += `<circle cx="${G.handle[0] + 26}" cy="${G.handle[1]}" r="7" fill="#dff1ff" stroke="${INK}" stroke-width="2" opacity=".8"/>`;
  // Bulk og krøllet panel
  if (has(job, 'dent')) {
    const cx = (d0 + d1) / 2 + 30, cy = m.belt + (sill - m.belt) * 0.5;
    s += `<g class="dmg-dent"><ellipse cx="${cx}" cy="${cy}" rx="70" ry="38" fill="${dark}" opacity=".75"/><ellipse cx="${cx + 10}" cy="${cy + 6}" rx="40" ry="20" fill="${shade(base, -0.55)}" opacity=".8"/><path d="M${cx - 70},${cy} q30,-34 70,-38 M${cx + 60},${cy + 18} q-30,20 -70,18" stroke="${INK}" stroke-width="3" fill="none"/><path d="M${cx - 30},${cy - 26} q20,-8 44,-4" stroke="${light}" stroke-width="4" fill="none" opacity=".8"/></g>`;
  }
  if (has(job, 'door_panel')) {
    const cx = (d0 + d1) / 2, cy = m.belt + (sill - m.belt) * 0.45;
    s += `<g class="dmg-crumple"><path d="M${d0 + 10},${cy - 30} l40,22 l30,-26 l36,30 l28,-20 l40,26 l30,-18 l36,24" stroke="${INK}" stroke-width="4" fill="none"/><path d="M${d0 + 20},${cy + 10} l50,18 l26,-24 l40,26 l30,-16 l46,22" stroke="${INK}" stroke-width="3" fill="none" opacity=".8"/><rect x="${d0 + 10}" y="${cy - 40}" width="${d1 - d0 - 20}" height="90" fill="${dark}" opacity=".35"/><circle cx="${cx}" cy="${cy}" r="6" fill="#d8d0c0"/></g>`;
  }
  // Løs sidelist
  if (has(job, 'loose_body')) s += `<g class="dmg-trim"><path d="M${G.minX + 60},${sill - 24} L${d0 - 40},${sill - 24} L${d0 + 50},${sill + 26}" stroke="${INK}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M${G.minX + 60},${sill - 24} L${d0 - 40},${sill - 24} L${d0 + 50},${sill + 26}" stroke="#9a9894" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  // ── Modellspesifikke detaljer ──
  if (m.bed) s += `<path d="M${G.minX + 4},214 L398,212" stroke="${INK}" stroke-width="5"/><rect x="${G.minX + 14}" y="196" width="370" height="18" fill="${dark}" stroke="${INK}" stroke-width="3"/>`;
  if (m.spare) s += `<circle cx="${G.minX - 6}" cy="250" r="46" fill="#1d1a18" stroke="${INK}" stroke-width="5"/><circle cx="${G.minX - 6}" cy="250" r="22" fill="${dark}" stroke="${INK}" stroke-width="3"/>`;
  if (m.van) s += `<path d="M300,96 L300,${sill - 8} M560,96 L560,${sill - 8}" stroke="${INK}" stroke-width="3" opacity=".6"/>`;
  if (m.sporty) s += `<path d="M${G.minX + 30},${m.belt + 22} L${G.maxX - 40},${m.belt + 30}" stroke="${light}" stroke-width="6" opacity=".6"/>`;
  if (car.roofbox) s += `<rect x="160" y="70" width="320" height="34" rx="14" fill="#2c2c30" stroke="${INK}" stroke-width="4"/>`;
  // Speil og antenne
  s += `<path d="M${m.glass[2][0] - 18},${m.glass[2][1] - 4} l26,-14 l8,14 z" fill="${dark}" stroke="${INK}" stroke-width="3"/>`;
  s += `<path d="M${G.minX + 80},${G.topAt(G.minX + 80)} l-30,-70" stroke="${INK}" stroke-width="3"/>`;
  // ── Panser ──
  const hx0 = m.hood[0], hy0 = G.topAt(hx0 + 8);
  const hoodTop = `M${hx0},${hy0} L${m.hood[1] - 20},${G.topAt(m.hood[1] - 20)}`;
  s += `<path d="${hoodTop}" stroke="${INK}" stroke-width="3" opacity=".6"/>`;
  if (opts.hood) {
    s += `<g class="engine-peek"><rect x="${hx0 + 40}" y="${hy0 - 18}" width="${m.hood[1] - hx0 - 100}" height="48" rx="10" fill="#3a3632" stroke="${INK}" stroke-width="4"/><circle cx="${hx0 + 90}" cy="${hy0 + 2}" r="14" fill="#6a625a" stroke="${INK}" stroke-width="3"/><rect x="${hx0 + 130}" y="${hy0 - 8}" width="60" height="22" fill="#b8a33a" stroke="${INK}" stroke-width="3"/></g>`;
    s += `<path d="M${hx0},${hy0} L${hx0 + 60},${hy0 - 150} L${hx0 + 90},${hy0 - 140} L${hx0 + 26},${hy0 + 4} Z" fill="${base}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
  }
  // ── Lykter ──
  const [lfx, lfy] = m.light.F, [lrx, lry] = m.light.R;
  const smashed = has(job, 'headlight_broken');
  const headOut = has(job, 'bulb_out') || smashed;
  const headCol = opts.lights ? (headOut ? '#3a352c' : '#fff3c0') : '#d8d2b0';
  s += `<rect x="${lfx - 20}" y="${lfy - 13}" width="40" height="26" rx="7" fill="${headCol}" stroke="${INK}" stroke-width="4"/>`;
  if (opts.lights && !headOut) s += `<path d="M${lfx + 18},${lfy - 14} L${lfx + 210},${lfy - 70} L${lfx + 210},${lfy + 70} L${lfx + 18},${lfy + 14} Z" fill="url(#beam)" opacity=".7"/>`;
  if (smashed) s += `<g class="dmg-head"><path d="M${lfx - 16},${lfy - 10} l14,10 l-6,10 M${lfx},${lfy} l16,-8 M${lfx},${lfy} l10,12" stroke="${INK}" stroke-width="2.5"/><path d="M${lfx - 18},${lfy + 16} l-8,14 l14,-4z" fill="#cfd8de" stroke="${INK}" stroke-width="2"/></g>`;
  const tailOut = has(job, 'taillight_out');
  s += `<rect x="${lrx - 14}" y="${lry - 18}" width="26" height="36" rx="5" fill="${opts.lights ? (tailOut ? '#3a1612' : '#ff3a2a') : '#8a2018'}" stroke="${INK}" stroke-width="4"/>`;
  if (opts.lights && !tailOut) s += `<circle cx="${lrx}" cy="${lry}" r="34" fill="#ff3a2a" opacity=".25"/>`;
  // ── Støtfangere ──
  const bfSag = has(job, 'bumper_damage');
  s += `<g ${bfSag ? `transform="rotate(9 ${G.maxX - 70} ${sill - 30})"` : ''}><rect x="${G.maxX - 64}" y="${sill - 44}" width="${bfSag ? 78 : 72}" height="34" rx="9" fill="#3a3734" stroke="${INK}" stroke-width="4.5"/>${bfSag ? `<path d="M${G.maxX - 30},${sill - 44} l10,16 l-8,12" stroke="#d9d2c4" stroke-width="3" fill="none"/>` : ''}</g>`;
  s += `<rect x="${G.minX - 8}" y="${sill - 44}" width="70" height="34" rx="9" fill="#3a3734" stroke="${INK}" stroke-width="4.5"/>`;
  // Skiltet
  s += `<rect x="${G.minX + 8}" y="${sill - 90}" width="62" height="26" rx="3" fill="#f2efe4" stroke="${INK}" stroke-width="3"/><text x="${G.minX + 39}" y="${sill - 72}" font-family="Special Elite, monospace" font-size="11" text-anchor="middle" fill="${INK}">${car.plate.split(' ')[0]}</text>`;
  // ── Hjulbuer og hjul ──
  for (const k of ['R', 'F']) {
    const [wx, wyy] = G.wheel[k];
    s += `<g clip-path="url(#${uid}b)"><circle cx="${wx}" cy="${wyy}" r="${G.r + 12}" fill="#120d0a" stroke="${INK}" stroke-width="5"/></g>`;
  }
  for (const k of ['R', 'F']) s += wheel(job, G, k, opts, car, dark);
  // ── Skitt, søle, is (oppå alt) ──
  const dirt = opts.dirtOverride ?? car.dirt ?? 0;
  if (dirt > 0.05) s += `<g clip-path="url(#${uid}b)" class="dirt"><rect x="0" y="${m.belt - 120 + (1 - dirt) * 160}" width="1000" height="420" fill="url(#${uid}d)" opacity="${Math.min(1, dirt * 1.1)}"/><rect x="0" y="0" width="1000" height="440" fill="#6b5a40" opacity="${dirt * 0.35}"/></g>`;
  if (has(job, 'mud') || has(job, 'ditch_wash')) {
    for (const k of ['R', 'F']) {
      const [wx, wyy] = G.wheel[k];
      s += `<g class="dmg-mud"><path d="M${wx - G.r - 26},${wyy - 10} q10,-${G.r + 10} ${G.r + 26},-${G.r + 14} q${G.r},4 ${G.r + 30},${G.r + 10} l-18,6 q-16,-${G.r - 10} -${G.r + 12},-${G.r - 6} q-${G.r - 10},4 -${G.r + 12},${G.r - 4} z" fill="#4a3620" stroke="${INK}" stroke-width="3"/><circle cx="${wx - G.r}" cy="${wyy + 10}" r="9" fill="#4a3620"/><circle cx="${wx + G.r + 8}" cy="${wyy - 4}" r="7" fill="#4a3620"/></g>`;
    }
  }
  if (has(job, 'ditch_wash')) s += `<g class="dmg-grass"><path d="M${G.maxX - 80},${sill - 40} l-10,-40 l14,30 l4,-44 l8,46 l16,-36 l-4,40" stroke="#4a6a2a" stroke-width="5" fill="none"/><rect x="${G.maxX - 20}" y="${sill - 140}" width="10" height="120" fill="#e0742a" stroke="${INK}" stroke-width="3" transform="rotate(30 ${G.maxX - 15} ${sill - 80})"/><ellipse cx="${G.maxX - 50}" cy="${sill - 20}" rx="60" ry="20" fill="#3d2c18" opacity=".8"/></g>`;
  if (has(job, 'ice_snow')) {
    const top = m.body.filter((p) => p[1] < m.belt).map((p) => `${p[0]},${p[1] - 14}`).join(' ');
    s += `<g class="dmg-ice"><polyline points="${top}" fill="none" stroke="#f2f7fb" stroke-width="30" stroke-linejoin="round" stroke-linecap="round"/><polygon points="${glassPts}" fill="#e6f1f8" opacity=".85"/><path d="M${G.minX + 40},${m.belt + 10} L${G.maxX - 40},${m.belt + 14}" stroke="#eaf3f9" stroke-width="10" opacity=".8"/>`;
    for (let i = 0; i < 9; i++) { const x = G.minX + 80 + i * ((G.maxX - G.minX - 160) / 8); s += `<path d="M${x},${sill - 4} l5,${16 + (i % 3) * 8} l5,-${16 + (i % 3) * 8}" fill="#e6f3fb" stroke="${INK}" stroke-width="2"/>`; }
    s += `</g>`;
  }
  // Lakkering pågår: plast og tåke
  if (opts.paintMist) s += `<rect x="${G.minX - 20}" y="40" width="${G.maxX - G.minX + 40}" height="400" fill="${opts.paintMist}" opacity=".35" class="paint-mist"/>`;
  return `<svg class="car-svg" viewBox="0 0 1000 440" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet"><defs><linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient></defs>${s}</svg>`;
}

function wheel(job, G, k, opts, car, dark) {
  const [wx, wy] = G.wheel[k];
  const r = G.r;
  if (opts.removed?.[k]) return `<g class="wheel w${k} removed"><circle cx="${wx}" cy="${wy}" r="${r * 0.36}" fill="#4a4440" stroke="${INK}" stroke-width="4"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${wx + Math.cos(a * Math.PI / 180) * r * 0.2}" cy="${wy + Math.sin(a * Math.PI / 180) * r * 0.2}" r="4" fill="#9a948c"/>`).join('')}</g>`;
  const f = (id) => job.faults.some((x) => x.id === id && !x.fixed && (x.wheel === k || x.wheel === 'B'));
  const flat = f('flat_tire');
  const bent = f('bent_rim');
  const ry = flat ? r * 0.7 : r;
  const cy = flat ? wy + r * 0.3 : wy;
  let s = `<g class="wheel w${k} ${opts.spinning === k ? 'spin' : ''}" style="transform-origin:${wx}px ${wy}px">`;
  s += `<ellipse cx="${wx}" cy="${cy}" rx="${flat ? r * 1.16 : r}" ry="${ry}" fill="#1d1a18" stroke="${INK}" stroke-width="5"/>`;
  if (flat) s += `<path d="M${wx - r * 1.1},${cy + ry * 0.55} q${r * 1.1},${r * 0.25} ${r * 2.2},0" stroke="#3a3430" stroke-width="7" fill="none"/>`;
  // Slitebane-hakk (synlig mønster)
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; s += `<line x1="${wx + Math.cos(a) * (r - 3)}" y1="${cy + Math.sin(a) * (ry - 3)}" x2="${wx + Math.cos(a) * (r - 11)}" y2="${cy + Math.sin(a) * (ry - 11)}" stroke="#3a3430" stroke-width="3"/>`; }
  const hr = r * 0.56;
  const rimFill = car.hubcap === 'alloy' ? '#b7b9b6' : car.hubcap === 'cap' ? '#cfcdc6' : '#4a4642';
  s += `<ellipse cx="${wx}" cy="${cy}" rx="${hr}" ry="${hr * (bent ? 0.86 : 1)}" fill="${rimFill}" stroke="${INK}" stroke-width="4" ${bent ? `transform="rotate(14 ${wx} ${cy})"` : ''}/>`;
  if (car.hubcap === 'alloy') for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; s += `<line x1="${wx}" y1="${cy}" x2="${wx + Math.cos(a) * hr * 0.9}" y2="${cy + Math.sin(a) * hr * 0.9}" stroke="#6a6c68" stroke-width="7"/>`; }
  else if (car.hubcap === 'cap') s += `<circle cx="${wx}" cy="${cy}" r="${hr * 0.62}" fill="none" stroke="#8f8c84" stroke-width="3"/>`;
  else for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4; s += `<circle cx="${wx + Math.cos(a) * hr * 0.55}" cy="${cy + Math.sin(a) * hr * 0.55}" r="5" fill="#222"/>`; }
  s += `<circle cx="${wx}" cy="${cy}" r="${hr * 0.22}" fill="#2a2724" stroke="${INK}" stroke-width="3"/>`;
  s += `<path d="M${wx - hr * 0.5},${cy - hr * 0.7} q${hr * 0.4},-${hr * 0.25} ${hr},-${hr * 0.05}" stroke="#fff" stroke-width="4" fill="none" opacity=".35"/>`;
  if (bent) s += `<path d="M${wx + hr * 0.6},${cy - hr * 0.6} l10,4 l-4,9" stroke="${INK}" stroke-width="3" fill="none"/>`;
  s += `</g>`;
  return s;
}

/** Detaljer som bare syns i lampelyset (slitasje, lekkasjer, sprekker). Samme koordinater som bilen. */
export function renderLampLayer(job, lifted) {
  const G = geometry(job.car.model);
  const m = G.m;
  let s = '';
  const open = (id) => job.faults.filter((f) => f.id === id && !f.fixed);
  for (const f of open('worn_tire')) for (const k of f.wheel === 'B' ? ['F', 'R'] : [f.wheel]) { const [x, y] = G.wheel[k]; s += `<g class="lamp-mark"><circle cx="${x}" cy="${y}" r="${G.r - 6}" fill="none" stroke="#e8e0c8" stroke-width="6" stroke-dasharray="3 9" opacity=".9"/><text x="${x}" y="${y - G.r - 10}" class="lamp-label">2 mm</text></g>`; }
  for (const f of open('bent_rim')) { const [x, y] = G.wheel[f.wheel]; s += `<g class="lamp-mark"><path d="M${x + G.r * 0.3},${y - G.r * 0.5} q14,10 4,24" stroke="#ff6a3a" stroke-width="5" fill="none"/></g>`; }
  for (const f of [...open('worn_brakes')]) { const [x, y] = G.wheel[f.wheel]; s += `<g class="lamp-mark"><rect x="${x - 10}" y="${y - G.r * 0.5}" width="8" height="${G.r * 0.5}" fill="#ff6a3a"/><text x="${x}" y="${y - G.r - 10}" class="lamp-label">tynn kloss</text></g>`; }
  for (const f of open('alignment')) { const [x, y] = G.wheel[f.wheel]; s += `<g class="lamp-mark"><path d="M${x - G.r},${y + 6} a${G.r},${G.r} 0 0 1 ${G.r * 0.8},-${G.r * 0.8}" stroke="#ffb03a" stroke-width="8" fill="none"/><text x="${x}" y="${y - G.r - 10}" class="lamp-label">skjev slitasje</text></g>`; }
  for (const f of open('dirty_filter')) { const x = m.hood[0] + 120, y = G.topAt(m.hood[0] + 120) + 20; s += `<g class="lamp-mark"><rect x="${x - 30}" y="${y - 14}" width="60" height="28" fill="#6b6152" stroke="#e8e0c8" stroke-width="3"/><text x="${x}" y="${y - 22}" class="lamp-label">støv</text></g>`; }
  for (const f of open('bad_visibility')) { const [x, y] = m.glass[2]; s += `<g class="lamp-mark"><path d="M${x - 60},${y - 10} q-20,-50 10,-70" stroke="#ffe3a0" stroke-width="5" fill="none"/><text x="${x - 60}" y="${y - 90}" class="lamp-label">revet visker</text></g>`; }
  // Understell (bare når bilen er løftet)
  if (lifted) {
    for (const f of open('small_leak')) { const x = m.hood[0] + 40; s += `<g class="lamp-mark under"><path d="M${x},${m.sill + 10} q-6,16 0,22 q6,-6 0,-22" fill="#2a1a10" stroke="#e8e0c8" stroke-width="2"/><ellipse cx="${x}" cy="${m.sill + 30}" rx="16" ry="5" fill="#1a1008"/><text x="${x}" y="${m.sill + 58}" class="lamp-label">lekker</text></g>`; }
    for (const f of open('bad_shock')) { const x = G.wheel.F[0] - G.r - 6; s += `<g class="lamp-mark under"><rect x="${x - 8}" y="${m.sill - 40}" width="16" height="56" fill="#3a3632" stroke="#e8e0c8" stroke-width="3"/><path d="M${x},${m.sill + 18} q-4,10 0,14 q4,-4 0,-14" fill="#1a1008"/><text x="${x}" y="${m.sill + 52}" class="lamp-label">våt demper</text></g>`; }
    for (const f of open('loose_part')) { const x = (G.wheel.F[0] + G.wheel.R[0]) / 2; s += `<g class="lamp-mark under"><path d="M${x - 50},${m.sill + 12} L${x + 30},${m.sill + 40}" stroke="#a8a49c" stroke-width="8"/><text x="${x}" y="${m.sill + 64}" class="lamp-label">løst skjold</text></g>`; }
    for (const f of open('underbody')) { const x = (G.wheel.F[0] + G.wheel.R[0]) / 2 + 60; s += `<g class="lamp-mark under"><path d="M${x - 60},${m.sill + 14} q40,30 90,0" stroke="#ff6a3a" stroke-width="7" fill="none"/><text x="${x}" y="${m.sill + 60}" class="lamp-label">bøyd stag</text></g>`; }
    for (const f of open('winter_wear')) { s += `<g class="lamp-mark under">${Array.from({ length: 14 }, (_, i) => `<circle cx="${G.wheel.R[0] + 40 + i * 30}" cy="${m.sill + 8 + (i % 3) * 6}" r="5" fill="#f2f0e8"/>`).join('')}<text x="${(G.wheel.F[0] + G.wheel.R[0]) / 2}" y="${m.sill + 50}" class="lamp-label">veisalt</text></g>`; }
    for (const f of open('exhaust_damaged')) { const x = G.wheel.R[0] + 126; s += `<g class="lamp-mark under"><circle cx="${x}" cy="${m.sill + 14}" r="16" fill="none" stroke="#ff6a3a" stroke-width="4"/><text x="${x}" y="${m.sill + 52}" class="lamp-label">hull</text></g>`; }
  }
  return `<svg class="lamp-svg" viewBox="0 0 1000 440" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">${s}</svg>`;
}

/** Små feilmerker («!» og hake) på bilen for funnede feil */
export function zoneCenter(G, zone, wheel) {
  const z = G.zones[zone === 'wheel' ? `wheel${wheel === 'B' ? 'F' : wheel}` : zone];
  if (!z) return [500, 260];
  if (z.c) return z.c;
  const [x, y, w, h] = z.rect;
  return [x + w / 2, y + h / 2];
}
