// Arbeidsordren: kundens beskrivelse, bekreftede feil, uforklarte symptomer og hvilke tester som er gjort.
// Den gir aldri fasiten: skjulte feil vises ikke, bare at det kan finnes mer, og hvilke tester som gjenstår.
import { G, S } from '../game/state.js';
import { FAULTS, TESTS, CATEGORIES } from '../data/faults.js';
import { PARTS, TOOLS } from '../data/parts.js';
import { MODELS, COLOR_BY_ID } from '../data/cars.js';
import { CHAR_BY_ID } from '../data/characters.js';
import { SYMPTOMS, SIDE } from '../data/dialogue/symptoms.js';
import { QUALITY, partsFor, faultValue } from '../game/jobs.js';
import { colorName } from '../game/jobs.js';
import * as flow from '../game/flow.js';
import { esc, kr } from '../core/util.js';
import { toolSvg } from './icons.js';

let modal;

export function mountWorkOrder(overlay) {
  modal = document.createElement('div');
  modal.className = 'modal wo-modal hidden';
  overlay.appendChild(modal);
  modal.addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]');
    if (e.target === modal || b?.dataset.w === 'close') return closeWorkOrder();
    if (b?.dataset.w === 'call') {
      const job = S().job;
      if (!job.faults.some((f) => f.fixed) && !b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Sikker? Kunden betaler ingenting'; return; }
      closeWorkOrder(); flow.callCustomer();
    }
  });
  for (const ev of ['job', 'stock', 'held', 'paint']) G.bus.on(ev, () => { if (isOpen()) render(); });
}
export const isOpen = () => modal && !modal.classList.contains('hidden');
export function openWorkOrder() { render(); modal.classList.remove('hidden'); }
export function closeWorkOrder() { modal?.classList.add('hidden'); }

// Hvilke tester som kan forklare et symptom (Symptomhåndboka)
const SYM_TESTS = {};
for (const def of Object.values(FAULTS)) for (const k of def.sym) { SYM_TESTS[k] = SYM_TESTS[k] || new Set(); Object.keys(def.tests).forEach((t) => SYM_TESTS[k].add(t)); }

function render() {
  const s = S();
  const job = s.job;
  if (!job) { modal.innerHTML = `<div class="wo paper-panel"><h2>ARBEIDSORDRE</h2><p class="muted">Ingen bil inne akkurat nå.</p><button class="opt primary" data-w="close">LUKK</button></div>`; return; }
  const ch = CHAR_BY_ID[job.charId];
  const m = MODELS[job.car.model];
  const found = job.faults.filter((f) => f.found);
  const open = job.faults.filter((f) => f.reported && !f.found);
  const row = (f) => {
    const d = FAULTS[f.id];
    const need = partsFor(f);
    const parts = Object.entries(need).map(([p, n]) => {
      const inCrate = s.crate[p] || 0, inStock = s.stock[p] || 0;
      const cls = inCrate >= n ? 'ok' : inStock + inCrate >= n ? 'mid' : 'no';
      return `<span class="need ${cls}" title="${inCrate} i kassa, ${inStock} på hylla">${n > 1 ? n + '× ' : ''}${esc(PARTS[p].short)}</span>`;
    }).join(' ');
    const where = f.wheel ? ` (${SIDE[f.wheel]})` : '';
    const status = f.fixed ? `<b class="q ${QUALITY[f.quality].cls}">✔ ${QUALITY[f.quality].name}</b>` : d.paintJob && f.prep > 0 ? '<b class="q q1">Slipt – lakkeres på PC-en</b>' : '<b class="q todo">Ikke reparert</b>';
    return `<tr class="${f.fixed ? 'fixed' : ''}"><td class="cat">${CATEGORIES[d.cat].icon}</td><td><b>${esc(d.name)}</b>${where}${!f.reported ? ' <span class="extra-tag">EKSTRA</span>' : ''}<div class="why">Funnet ved ${esc(TESTS[f.foundBy]?.name.toLowerCase() || 'sjekk')}</div></td>
      <td class="tool-cell" title="${esc(TOOLS[d.tool].name)}">${toolSvg(d.tool, 'mini')}<span>${esc(TOOLS[d.tool].name)}</span></td><td>${parts || '<span class="muted">ingen del</span>'}</td><td class="val">${kr(faultValue(f.id))}</td><td>${status}</td></tr>`;
  };
  const symptomRow = (f) => {
    const d = FAULTS[f.id];
    const sym = d.sym.find((k) => SYMPTOMS[k]);
    const said = f.exact ? `Kunden tror det er «${d.name.toLowerCase()}»` : `«${f.said || (SYMPTOMS[sym]?.[0] || '').replace('{color}', colorName(job.wantColor || job.car.color))}»`;
    const tips = s.upgrades.manual ? [...(SYM_TESTS[sym] || [])].concat(f.exact ? Object.keys(d.tests) : []) : [];
    const uniq = [...new Set(tips)].map((t) => TESTS[t]?.name).filter(Boolean);
    return `<li><span class="q-mark">?</span> ${esc(said)}${uniq.length ? `<div class="tip">Håndboka: prøv ${esc(uniq.join(', ').toLowerCase())}</div>` : ''}</li>`;
  };
  // Sjekkliste over tester (Bilplansje: per område)
  const done = (t) => Object.keys(job.tests).some((k) => k === t || k.startsWith(t + ':'));
  const checks = Object.entries(TESTS).map(([k, t]) => `<li class="${done(k) ? 'done' : ''}" title="${esc(t.how)}">${done(k) ? '✔' : '–'} ${esc(t.name)}</li>`).join('');
  const chart = s.upgrades.car_chart ? `<div class="wo-chart">${['wheel:F', 'wheel:R'].map((w) => `<span class="${job.tests['spin:' + w] ? 'done' : ''}">Hjultest ${w.endsWith('F') ? 'foran' : 'bak'}</span>`).join('')}<span class="${job.tests['under:under'] || job.tests['under:exhaust'] || job.tests.under ? 'done' : ''}">Understell</span><span class="${job.tests['lamp:hood'] ? 'done' : ''}">Lampe i motorrom</span></div>` : '';
  const want = job.wantColor ? `<div class="wo-want">Ønsket farge: <b>${esc(colorName(job.wantColor))}</b></div>` : '';
  modal.innerHTML = `<div class="wo paper-panel">
    <div class="wo-top"><h2>ARBEIDSORDRE</h2><span class="wo-no">Nr. ${s.carsTotal + 1001}</span></div>
    <div class="wo-meta"><div><small>KUNDE</small><b>${esc(ch.name)}</b></div><div><small>BIL</small><b>${esc(m.name)}</b> (${esc(m.kind.toLowerCase())}), ${esc(COLOR_BY_ID[job.car.color].name)}, ${job.car.year}</div><div><small>REG.NR</small><b>${esc(job.car.plate)}</b></div></div>
    <div class="wo-story"><small>KUNDEN FORTELLER</small>${(job.lines || []).slice(1, -1).map((l) => `<p>«${esc(l)}»</p>`).join('') || '<p class="muted">…</p>'}</div>
    ${want}
    <h3>Bekreftede feil</h3>
    ${found.length ? `<table class="wo-table">${found.map(row).join('')}</table>` : '<p class="muted">Ingenting bekreftet ennå. Undersøk bilen i hallen (A A).</p>'}
    ${open.length ? `<h3>Uforklart – kunden nevnte</h3><ul class="wo-sym">${open.map(symptomRow).join('')}</ul>` : ''}
    <div class="wo-bottom"><div><h3>Tester gjort</h3><ul class="wo-checks">${checks}</ul>${chart}</div>
      <div class="wo-hidden"><h3>Skjulte feil?</h3><p>Gamle biler har ofte mer galt enn eieren vet. Ekstra feil du finner og fikser, betales i tillegg.</p></div></div>
    <div class="wo-btns">${s.phase === 'working' ? `<button class="opt primary" data-w="call" ${s.paint ? 'disabled' : ''}>KALL INN KUNDEN</button>` : ''}<button class="opt" data-w="close">LUKK (Esc)</button></div>
  </div>`;
}
