// HØYRE ÉN GANG – kontoret: pulten med PC-en (eget forgrunnslag) og lakkblanderen.
// PC-en åpnes ved å klikke på skjermen. Lakkblanderen viser lakkeringen som pågår, og trykket kan
// justeres underveis for et bedre resultat (kort, frivillig element – ikke et langt sprøytespill).
import { G, S } from '../../game/state.js';
import { BG, OFFICE as L } from '../layout.js';
import { deskSvg } from '../art/furniture.js';
import { openPc } from '../Pc.js';
import { nudgePressure, paintFault } from '../../game/workshop.js';
import { COLOR_BY_ID } from '../../data/cars.js';
import { kr, esc } from '../../core/util.js';
import { Snow } from '../Snow.js';

let root, screen, mixer, snow, last = 0;
const box = (r) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;

export function mountOffice(el) {
  root = el;
  el.innerHTML = `
    <img class="bg" src="${BG.office}" alt="" draggable="false">
    <div class="lamp-glow" style="left:430px;top:0;width:820px;height:420px"></div>
    <canvas class="win-snow" style="left:4px;top:146px;width:150px;height:330px"></canvas>
    ${deskSvg()}
    <button class="prop crt" style="${box(L.screen)}" aria-label="PC"></button>
    <div class="mixer" style="${box(L.paint)}"></div>`;
  screen = el.querySelector('.crt');
  mixer = el.querySelector('.mixer');
  snow = new Snow(el.querySelector('.win-snow'), { count: 30, size: 0.8, alpha: 0.6, speed: 0.8 });
  screen.addEventListener('click', () => { openPc(); });
  mixer.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]');
    if (b) nudgePressure(b.dataset.p === 'up' ? 0.12 : -0.12);
    else if (!S().upgrades.paint_booth) G.bus.emit('toast', { text: 'Lakkboksen er ikke kjøpt ennå. Se OPPGRADERINGER på PC-en.', kind: '' });
    else if (!S().paint) openPc('paint');
  });
  for (const ev of ['money', 'job', 'paint', 'upgrades', 'stock', 'ui:reset']) G.bus.on(ev, render);
}

function render() {
  const s = S();
  if (!s || !root) return;
  screen.innerHTML = `<div class="crt-mini"><div>VERKSTED-DATA 2.1</div><div class="cm-big">${kr(s.money)}</div><div>Biler totalt: ${s.carsTotal}</div><div>Dag ${s.day}</div><div class="cm-blink">KLIKK FOR Å LOGGE INN_</div></div>`;
  renderMixer();
}

function renderMixer() {
  const s = S();
  const p = s.paint;
  const owned = s.upgrades.paint_booth;
  const f = paintFault();
  const col = p ? COLOR_BY_ID[p.color]?.hex : '#555';
  const ang = p ? -60 + p.pressure * 120 : -60;
  const prog = p ? p.t / p.dur : 0;
  mixer.classList.toggle('locked', !owned);
  mixer.innerHTML = `<svg viewBox="0 0 300 500">
    <rect x="20" y="80" width="260" height="400" rx="12" fill="${owned ? '#6a7a86' : '#4a4e52'}" stroke="#1b120c" stroke-width="6"/>
    <rect x="40" y="100" width="220" height="130" rx="8" fill="#1d241e" stroke="#1b120c" stroke-width="4"/>
    <path d="M70,210 A80,80 0 0 1 230,210" stroke="#3a4a3a" stroke-width="14" fill="none"/>
    <path d="M118,140 A80,80 0 0 1 182,140" stroke="#4f8a5a" stroke-width="14" fill="none"/>
    <line x1="150" y1="210" x2="${150 + Math.sin(ang * Math.PI / 180) * 70}" y2="${210 - Math.cos(ang * Math.PI / 180) * 70}" stroke="#ff4a2a" stroke-width="5" stroke-linecap="round"/>
    <text x="150" y="124" font-family="Special Elite, monospace" font-size="15" fill="#7cff7a" text-anchor="middle">${owned ? (p ? 'TRYKK' : f ? 'KLAR' : 'VENTER') : 'IKKE KJØPT'}</text>
    <rect x="50" y="250" width="200" height="20" rx="4" fill="#2a2a2a" stroke="#1b120c" stroke-width="3"/><rect x="52" y="252" width="${196 * prog}" height="16" fill="${col}"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="${44 + i * 44}" y="300" width="36" height="46" rx="4" fill="${['#8f2f24', '#253a5e', '#d9d4c4', '#4d5e36', '#c69a2e'][i]}" stroke="#1b120c" stroke-width="3"/>`).join('')}
    <rect x="40" y="370" width="220" height="90" rx="8" fill="#3a3f46" stroke="#1b120c" stroke-width="4"/>
    <text x="150" y="420" font-family="Rubik Dirt, Impact" font-size="26" fill="#e9e2d0" text-anchor="middle">LAKKBLANDER</text>
    <rect x="120" y="20" width="60" height="64" fill="#5a5450" stroke="#1b120c" stroke-width="5"/>
  </svg>
  ${p ? `<div class="mx-ctrl"><span class="mx-btn" data-p="down">−</span><span class="mx-txt">Hold nåla i det grønne</span><span class="mx-btn" data-p="up">+</span></div>` : ''}
  <div class="mx-status">${owned ? (p ? `Lakkerer ${esc(COLOR_BY_ID[p.color]?.name || '')}… ${Math.round(prog * 100)} %` : f ? 'Bilen er slipt. Velg farge på PC-en.' : 'Ingen bil klar for lakk.') : 'Kjøp «Lakkboks» på PC-en.'}</div>`;
}

export function officeFrame(dt, visible) {
  if (!visible) return;
  snow?.step(dt);
  const now = performance.now();
  if (S()?.paint && now - last > 120) { last = now; renderMixer(); }
}
