// Forgrunnsmøbler som egne SVG-lag (ikke bakt inn i bakgrunnsbildene): kundedisken, arbeidsbenken,
// løftebukken, garasjeporten og kontorpulten. Samme blekkstrek og skitne flater som figurene.
import { W, H, RECEPTION, TOOLS_VIEW, OFFICE, BAY } from '../layout.js';

const INK = '#1b120c';

/** Rivet-rad langs en kant */
const rivets = (x0, x1, y, step = 46) => {
  let s = '';
  for (let x = x0; x <= x1; x += step) s += `<circle cx="${x}" cy="${y}" r="4" fill="#8a8d8a" stroke="${INK}" stroke-width="2"/>`;
  return s;
};

/** Kundedisken: stålplate på toppen, bulkete platefront, tåpanel med riflet stål. */
export function counterSvg() {
  const top = RECEPTION.counterTop;
  return `<svg class="counter" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="diamond" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="22" height="22" fill="#5d5f5c"/><rect x="4" y="9" width="14" height="4" rx="2" fill="#7c7f7b" stroke="#2a2a28" stroke-width="1"/></pattern>
      <linearGradient id="ctop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7aaa4"/><stop offset="1" stop-color="#6c6f6a"/></linearGradient>
      <linearGradient id="cfront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b5a4e"/><stop offset="1" stop-color="#2f3a32"/></linearGradient>
    </defs>
    <path d="M-10,${top + 30} L${W + 10},${top + 30} L${W + 10},${H + 10} L-10,${H + 10} Z" fill="url(#cfront)" stroke="${INK}" stroke-width="6"/>
    <rect x="-10" y="${top}" width="${W + 20}" height="38" fill="url(#ctop)" stroke="${INK}" stroke-width="6"/>
    <rect x="-10" y="${top + 3}" width="${W + 20}" height="6" fill="#d6d8d2" opacity=".55"/>
    ${rivets(30, W - 20, top + 50)}
    <path d="M0,${top + 130} L${W},${top + 130}" stroke="${INK}" stroke-width="4" opacity=".7"/>
    <path d="M0,${top + 222} L${W},${top + 222}" stroke="${INK}" stroke-width="4" opacity=".7"/>
    <rect x="-10" y="${H - 64}" width="${W + 20}" height="80" fill="url(#diamond)" stroke="${INK}" stroke-width="5"/>
    <g opacity=".85">
      <ellipse cx="320" cy="${top + 175}" rx="70" ry="26" fill="#25302a"/><path d="M262,${top + 170} q50,-26 116,0" stroke="#5d6f62" stroke-width="5" fill="none"/>
      <ellipse cx="1240" cy="${top + 160}" rx="44" ry="18" fill="#25302a"/>
      <path d="M760,${top + 52} q10,60 -4,110 M770,${top + 70} q6,40 -2,70" stroke="#191f1b" stroke-width="5" fill="none" opacity=".6"/>
      <path d="M1460,${top + 60} q-6,90 8,150" stroke="#6a3a1a" stroke-width="8" fill="none" opacity=".55"/>
    </g>
    <g transform="translate(1290 ${top + 92}) rotate(-4)"><rect width="150" height="70" rx="6" fill="#d8b33a" stroke="${INK}" stroke-width="4"/><text x="75" y="44" font-family="Rubik Dirt, Impact" font-size="26" text-anchor="middle" fill="${INK}">69</text></g>
    <g transform="translate(560 ${top + 150}) rotate(3)"><rect width="190" height="54" rx="4" fill="#e9e2cc" stroke="${INK}" stroke-width="4"/><text x="95" y="36" font-family="Special Elite, monospace" font-size="19" text-anchor="middle" fill="#8a2218">BETALING VED HENTING</text></g>
  </svg>`;
}

/** Arbeidsbenk med to rader skuffer (deler) og plass til delekassa. */
export function benchSvg() {
  const t = TOOLS_VIEW.benchTop;
  return `<svg class="bench" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="btop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6236"/><stop offset="1" stop-color="#5c3e20"/></linearGradient></defs>
    <rect x="20" y="${t + 30}" width="1250" height="${H - t}" fill="#3e4a52" stroke="${INK}" stroke-width="6"/>
    <rect x="10" y="${t}" width="1272" height="38" fill="url(#btop)" stroke="${INK}" stroke-width="6"/>
    <path d="M40,${t + 12} q200,-6 400,2 t500,-2 t300,4" stroke="#3a2412" stroke-width="3" fill="none" opacity=".6"/>
    <ellipse cx="900" cy="${t + 18}" rx="40" ry="9" fill="#2a1a0e" opacity=".55"/><ellipse cx="240" cy="${t + 22}" rx="26" ry="6" fill="#2a1a0e" opacity=".5"/>
    <g transform="translate(1100 ${t - 64})"><rect x="0" y="40" width="120" height="26" fill="#3c4a5a" stroke="${INK}" stroke-width="4"/><rect x="20" y="0" width="22" height="44" fill="#3c4a5a" stroke="${INK}" stroke-width="4"/><rect x="74" y="8" width="22" height="36" fill="#3c4a5a" stroke="${INK}" stroke-width="4"/><path d="M42,22 L74,22" stroke="${INK}" stroke-width="8"/><path d="M96,22 L140,10" stroke="${INK}" stroke-width="6"/><circle cx="142" cy="9" r="7" fill="#b8322a" stroke="${INK}" stroke-width="3"/></g>
    <g transform="translate(60 ${t - 40})"><rect width="70" height="40" rx="4" fill="#b8322a" stroke="${INK}" stroke-width="4"/><rect x="10" y="-12" width="50" height="14" rx="4" fill="none" stroke="${INK}" stroke-width="5"/></g>
  </svg>`;
}

/** Kontorpulten med CRT-skjerm og tastatur. */
export function deskSvg() {
  const t = OFFICE.deskTop, M = OFFICE.monitor;
  return `<svg class="desk" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="70" y="${t + 34}" width="900" height="${H - t}" fill="#5a4630" stroke="${INK}" stroke-width="6"/>
    <rect x="96" y="${t + 70}" width="300" height="110" fill="#4a3826" stroke="${INK}" stroke-width="4"/><rect x="226" y="${t + 112}" width="40" height="12" rx="4" fill="#9a8a6a" stroke="${INK}" stroke-width="3"/>
    <rect x="96" y="${t + 196}" width="300" height="110" fill="#4a3826" stroke="${INK}" stroke-width="4"/><rect x="226" y="${t + 238}" width="40" height="12" rx="4" fill="#9a8a6a" stroke="${INK}" stroke-width="3"/>
    <rect x="50" y="${t}" width="940" height="40" fill="#7a5e3c" stroke="${INK}" stroke-width="6"/>
    <path d="M70,${t + 14} q300,-6 600,0 t300,2" stroke="#4a3622" stroke-width="3" fill="none" opacity=".6"/>
    <rect x="${M.x + 150}" y="${M.y + M.h - 6}" width="${M.w - 300}" height="40" fill="#bdb6a2" stroke="${INK}" stroke-width="5"/>
    <rect x="${M.x}" y="${M.y}" width="${M.w}" height="${M.h - 20}" rx="26" fill="#cfc7b0" stroke="${INK}" stroke-width="6"/>
    <rect x="${M.x + 12}" y="${M.y + M.h - 60}" width="${M.w - 24}" height="34" fill="#bcb39c"/>
    <circle cx="${M.x + M.w - 50}" cy="${M.y + M.h - 42}" r="8" fill="#5aff6a" stroke="${INK}" stroke-width="2"/>
    <text x="${M.x + 40}" y="${M.y + M.h - 36}" font-family="Special Elite, monospace" font-size="16" fill="#5a5444">VERKSTED-DATA 2.1</text>
    <g transform="translate(${M.x + 70} ${t + 6}) rotate(-2)"><rect width="380" height="40" rx="6" fill="#d8d0b8" stroke="${INK}" stroke-width="4"/>${Array.from({ length: 13 }, (_, i) => `<rect x="${12 + i * 28}" y="8" width="22" height="10" rx="2" fill="#efe9d6" stroke="${INK}" stroke-width="1.5"/><rect x="${18 + i * 27}" y="22" width="20" height="10" rx="2" fill="#efe9d6" stroke="${INK}" stroke-width="1.5"/>`).join('')}</g>
    <g transform="translate(800 ${t - 70})"><rect width="64" height="70" rx="8" fill="#e9e2cc" stroke="${INK}" stroke-width="4"/><path d="M64,18 q22,4 0,30" stroke="${INK}" stroke-width="5" fill="none"/><ellipse cx="32" cy="6" rx="28" ry="6" fill="#2a1a10"/></g>
    <g transform="translate(860 ${t - 18}) rotate(6)"><rect width="110" height="16" rx="3" fill="#f2e38a" stroke="${INK}" stroke-width="3"/></g>
  </svg>`;
}

/** Garasjeporten (bevegelige paneler) og natta bak den. Tegnet i portens eget koordinatsystem. */
export function garageSvg() {
  const g = BAY.garage;
  const panels = 6, ph = g.h / panels;
  let p = '';
  for (let i = 0; i < panels; i++) {
    const y = i * ph;
    p += `<rect x="0" y="${y}" width="${g.w}" height="${ph}" fill="${i % 2 ? '#7d7f7a' : '#878984'}" stroke="${INK}" stroke-width="4"/>`;
    p += `<path d="M10,${y + ph * 0.35} L${g.w - 10},${y + ph * 0.35} M10,${y + ph * 0.7} L${g.w - 10},${y + ph * 0.7}" stroke="#5a5c58" stroke-width="3"/>`;
    p += `<path d="M${30 + i * 40},${y + 8} q4,${ph * 0.6} -2,${ph - 10}" stroke="#7a3f1c" stroke-width="5" opacity=".55" fill="none"/>`;
    if (i === 2) for (let k = 0; k < 4; k++) p += `<rect x="${40 + k * 110}" y="${y + 12}" width="84" height="${ph - 26}" rx="6" fill="#1e2c40" stroke="${INK}" stroke-width="4"/><rect x="${40 + k * 110}" y="${y + 12}" width="84" height="12" fill="#e8f0f6" opacity=".7"/>`;
  }
  p += `<rect x="${g.w / 2 - 40}" y="${g.h - 26}" width="80" height="14" rx="5" fill="#3a3632" stroke="${INK}" stroke-width="3"/>`;
  return `<div class="garage" style="left:${g.x}px;top:${g.y}px;width:${g.w}px;height:${g.h}px">
    <svg class="garage-out" viewBox="0 0 ${g.w} ${g.h}" preserveAspectRatio="none"><defs><linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1020"/><stop offset=".62" stop-color="#1c2a40"/><stop offset=".63" stop-color="#9fb2c8"/><stop offset="1" stop-color="#6c7f96"/></linearGradient><radialGradient id="lampglow"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".7"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient></defs>
      <rect width="${g.w}" height="${g.h}" fill="url(#night)"/>
      <path d="M0,${g.h * 0.6} L60,${g.h * 0.38} L110,${g.h * 0.6} M90,${g.h * 0.6} L170,${g.h * 0.32} L250,${g.h * 0.6} M300,${g.h * 0.6} L360,${g.h * 0.42} L420,${g.h * 0.6} M400,${g.h * 0.6} L460,${g.h * 0.36} L${g.w},${g.h * 0.6}" fill="#0c1424" stroke="${INK}" stroke-width="3"/>
      <rect x="${g.w * 0.72}" y="${g.h * 0.2}" width="6" height="${g.h * 0.42}" fill="#2a2a2a"/><circle cx="${g.w * 0.72 + 3}" cy="${g.h * 0.22}" r="60" fill="url(#lampglow)"/><circle cx="${g.w * 0.72 + 3}" cy="${g.h * 0.2}" r="7" fill="#fff0c0"/>
      <path d="M0,${g.h * 0.8} L${g.w},${g.h * 0.78}" stroke="#5a6a80" stroke-width="18" opacity=".6"/>
    </svg>
    <canvas class="garage-snow" width="${g.w}" height="${g.h}"></canvas>
    <div class="garage-door"><svg viewBox="0 0 ${g.w} ${g.h}" preserveAspectRatio="none">${p}</svg></div>
    <div class="garage-light"></div>
  </div>`;
}

/** Løftebukken: to søyler bak bilen, armer under bilen som følger løftet. */
export function liftSvg() {
  const [a, b] = BAY.posts, f = BAY.floor;
  const post = (x) => `<rect x="${x - 26}" y="${f - 470}" width="52" height="474" fill="#a8322a" stroke="${INK}" stroke-width="6"/><rect x="${x - 14}" y="${f - 460}" width="10" height="450" fill="#d0503a" opacity=".55"/><rect x="${x - 44}" y="${f - 4}" width="88" height="18" rx="4" fill="#5a5652" stroke="${INK}" stroke-width="5"/><rect x="${x - 34}" y="${f - 486}" width="68" height="22" rx="4" fill="#5a5652" stroke="${INK}" stroke-width="5"/>`;
  return `<svg class="lift-posts" viewBox="0 0 ${W} ${H}">${post(a)}${post(b)}<path d="M${a},${f - 476} L${b},${f - 476}" stroke="${INK}" stroke-width="12"/><path d="M${a},${f - 476} L${b},${f - 476}" stroke="#7a7c78" stroke-width="6"/></svg>`;
}
export function liftArmsSvg() {
  const [a, b] = BAY.posts, f = BAY.floor;
  const arm = (x0, x1) => `<path d="M${x0},${f - 22} L${x1},${f - 22}" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M${x0},${f - 22} L${x1},${f - 22}" stroke="#8a2a22" stroke-width="12" stroke-linecap="round"/><rect x="${x1 - 22}" y="${f - 40}" width="44" height="16" rx="4" fill="#2a2a2a" stroke="${INK}" stroke-width="4"/>`;
  return `<svg class="lift-arms" viewBox="0 0 ${W} ${H}">${arm(a, a + 250)}${arm(b, b - 270)}</svg>`;
}
