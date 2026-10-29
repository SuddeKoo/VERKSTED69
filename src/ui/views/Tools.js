// VENSTRE ÉN GANG – verktøyveggen og arbeidsbenken med deleskuffer og delekassa.
// Klikk et verktøy for å ta det i hånda (det henger igjen som skyggeomriss). Klikk omrisset for å henge det tilbake.
// Klikk en skuff for å legge én del i delekassa; klikk en del i kassa for å legge den tilbake.
import { G, S } from '../../game/state.js';
import { BG, TOOLS_VIEW as L } from '../layout.js';
import { benchSvg } from '../art/furniture.js';
import { TOOLS, TOOL_IDS, PARTS, PART_IDS } from '../../data/parts.js';
import { UPGRADE_BY_ID } from '../../data/upgrades.js';
import { toolSvg, toolShadow, partSvg } from '../icons.js';
import { pickTool, hangTool, toolAvailable, takePart, returnPart, crateCount, CRATE_MAX } from '../../game/workshop.js';
import { capacity, partsFor } from '../../game/jobs.js';
import { FAULTS } from '../../data/faults.js';
import { esc } from '../../core/util.js';
import { Snow } from '../Snow.js';

let root, board, bins, crate, need, snow;
const box = (r) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;

export function mountTools(el) {
  root = el;
  el.innerHTML = `
    <img class="bg" src="${BG.tools}" alt="" draggable="false">
    <div class="lamp-glow" style="left:360px;top:0;width:900px;height:420px"></div>
    <canvas class="win-snow" style="left:4px;top:146px;width:150px;height:330px"></canvas>
    <div class="pegboard" style="${box(L.pegboard)}"></div>
    <div class="need-note"></div>
    ${benchSvg()}
    <div class="bins"></div>
    <div class="crate" style="${box(L.crate)}"></div>`;
  board = el.querySelector('.pegboard');
  bins = el.querySelector('.bins');
  crate = el.querySelector('.crate');
  need = el.querySelector('.need-note');
  snow = new Snow(el.querySelector('.win-snow'), { count: 30, size: 0.8, alpha: 0.6, speed: 0.8 });
  board.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]');
    if (!b) return;
    const id = b.dataset.tool;
    if (!toolAvailable(id)) { G.audio?.synth('wrong'); return; }
    if (S().held === id) hangTool(); else pickTool(id);
  });
  bins.addEventListener('click', (e) => { const b = e.target.closest('[data-part]'); if (b) takePart(b.dataset.part); });
  crate.addEventListener('click', (e) => { const b = e.target.closest('[data-ret]'); if (b) returnPart(b.dataset.ret); });
  for (const ev of ['held', 'upgrades', 'stock', 'job', 'money']) G.bus.on(ev, render);
  G.bus.on('ui:reset', render);
}

function render() {
  const s = S();
  if (!s || !root) return;
  // Verktøy: 5 × 2 på pegboardet
  board.innerHTML = TOOL_IDS.map((id, i) => {
    const t = TOOLS[id];
    const col = i % 5, row = Math.floor(i / 5);
    const avail = toolAvailable(id);
    const held = s.held === id, onCart = s.cartTool === id;
    const lock = !avail ? (t.unlockCars ? `${t.unlockCars} biler` : `«${UPGRADE_BY_ID[t.unlockUpgrade].name}»`) : '';
    return `<button class="peg ${held || onCart ? 'taken' : ''} ${avail ? '' : 'locked'}" data-tool="${id}" style="left:${36 + col * 168}px;top:${18 + row * 186}px" title="${esc(t.desc)}">
      ${toolShadow(id)}${held || onCart || !avail ? '' : toolSvg(id)}
      <span class="peg-label">${esc(t.name)}</span>${lock ? `<span class="peg-lock">🔒 ${esc(lock)}</span>` : ''}${held ? '<span class="peg-held">I HÅNDA</span>' : onCart ? '<span class="peg-held">PÅ TRALLA</span>' : ''}</button>`;
  }).join('');
  // Skuffer: to rader
  const cap = capacity();
  bins.innerHTML = PART_IDS.map((id, i) => {
    const col = i % L.bins.cols, row = Math.floor(i / L.bins.cols);
    const n = s.stock[id] || 0;
    return `<button class="bin ${n ? '' : 'empty'}" data-part="${id}" style="left:${L.bins.x + col * (L.bins.w + L.bins.gap)}px;top:${L.bins.y + row * (L.bins.h + 10)}px;width:${L.bins.w}px;height:${L.bins.h}px" title="${esc(PARTS[id].name)} – klikk for å legge én i delekassa">
      <span class="bin-label">${esc(PARTS[id].short)}</span>${partSvg(id)}<span class="bin-n">${n}<small>/${cap}</small></span></button>`;
  }).join('');
  // Delekassa
  const items = Object.entries(s.crate);
  crate.innerHTML = `<svg class="crate-svg" viewBox="0 0 270 280"><path d="M18,96 L252,96 L236,262 L34,262 Z" fill="#b8322a" stroke="#1b120c" stroke-width="6"/><path d="M30,140 L240,140 M34,190 L236,190" stroke="#7a1f18" stroke-width="5"/><rect x="96" y="70" width="78" height="30" rx="8" fill="none" stroke="#1b120c" stroke-width="8"/><text x="135" y="236" font-family="Rubik Dirt, Impact" font-size="26" text-anchor="middle" fill="#f1e6c8">DELEKASSE</text></svg>
    <div class="crate-items">${items.map(([id, n]) => `<button class="crate-item" data-ret="${id}" title="Legg ${esc(PARTS[id].name.toLowerCase())} tilbake">${partSvg(id)}<b>${n > 1 ? '×' + n : ''}</b></button>`).join('')}</div>
    <div class="crate-count">${crateCount()}/${CRATE_MAX}</div>`;
  // Lapp: hva trenger bilen (bare for bekreftede feil)
  const job = s.job;
  const wants = {};
  if (job) for (const f of job.faults) if (f.found && !f.fixed && !(FAULTS[f.id].paintJob && f.prep > 0)) for (const [p, n] of Object.entries(partsFor(f))) wants[p] = (wants[p] || 0) + n;
  const list = Object.entries(wants);
  need.innerHTML = list.length ? `<b>BILEN TRENGER</b>${list.map(([p, n]) => { const c = s.crate[p] || 0; return `<div class="${c >= n ? 'ok' : (s.stock[p] || 0) + c >= n ? '' : 'no'}">${c >= n ? '✔' : '□'} ${n > 1 ? n + '× ' : ''}${esc(PARTS[p].name)}${(s.stock[p] || 0) + c < n ? ' – tomt!' : ''}</div>`; }).join('')}` : `<b>BILEN TRENGER</b><div class="muted">${job ? 'Ingen deler for bekreftede feil ennå.' : 'Ingen bil inne.'}</div>`;
}

export function toolsFrame(dt, visible) { if (visible) snow?.step(dt); }
