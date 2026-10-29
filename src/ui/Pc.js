// Management-PC-en: en gammel grønn skjerm (VERKSTED-DATA 2.1). Faner: LAGER, OPPGRADERINGER, LAKKERING,
// STATISTIKK. Bestilte deler leveres med en gang (ingen leveringstid). Oppgraderinger krever både penger
// og et antall ferdige biler – antallet biler trekkes aldri fra.
import { G, S } from '../game/state.js';
import { PARTS, PART_IDS } from '../data/parts.js';
import { UPGRADES, UPGRADE_CATS, canBuy } from '../data/upgrades.js';
import { COLORS, EXTRA_PAINT, COLOR_BY_ID } from '../data/cars.js';
import { UNLOCK_STEPS, FAULTS, CATEGORIES, unlockedFaults } from '../data/faults.js';
import { capacity, partPrice, QUALITY } from '../game/jobs.js';
import { buyPart, buyUpgrade, startPaint, paintFault, paintDuration, nudgePressure } from '../game/workshop.js';
import { kr, esc } from '../core/util.js';
import { partSvg } from './icons.js';

let modal, tab = 'stock', upCat = 'all', paintColor = null, booted = false, raf = 0;

export function mountPc(overlay) {
  modal = document.createElement('div');
  modal.className = 'modal pc-modal hidden';
  overlay.appendChild(modal);
  modal.addEventListener('click', onClick);
  for (const ev of ['money', 'stock', 'upgrades', 'paint', 'job']) G.bus.on(ev, () => { if (isPcOpen()) render(); });
}
export const isPcOpen = () => modal && !modal.classList.contains('hidden');
export function openPc(t) {
  if (t) tab = t;
  modal.classList.remove('hidden');
  if (!booted) { booted = true; G.audio?.play('pc_on', { volume: 0.5 }); } else G.audio?.play('pc_load', { volume: 0.4 });
  render();
  const loop = () => { if (!isPcOpen()) return; if (tab === 'paint' && S().paint) render(); raf = setTimeout(loop, 150); };
  clearTimeout(raf); loop();
}
export function closePc() { modal?.classList.add('hidden'); clearTimeout(raf); G.audio?.synth('beep_lo', { volume: 0.5 }); }

function onClick(e) {
  if (e.target === modal) return closePc();
  const b = e.target.closest('[data-c]');
  if (!b || b.disabled) return;
  const [cmd, arg, n] = b.dataset.c.split(':');
  G.audio?.synth('beep', { volume: 0.4 });
  if (cmd === 'tab') { tab = arg; render(); }
  else if (cmd === 'close') closePc();
  else if (cmd === 'buy') buyPart(arg, +n || 1);
  else if (cmd === 'up') buyUpgrade(arg);
  else if (cmd === 'ucat') { upCat = arg; render(); }
  else if (cmd === 'color') { paintColor = arg; render(); }
  else if (cmd === 'paint') { startPaint(paintColor); render(); }
  else if (cmd === 'press') nudgePressure(arg === 'up' ? 0.12 : -0.12);
}

function render() {
  const s = S();
  const tabs = [['stock', 'LAGER'], ['up', 'OPPGRADERINGER'], ['paint', 'LAKKERING'], ['stats', 'STATISTIKK']];
  let body = '';
  if (tab === 'stock') body = stockTab(s);
  else if (tab === 'up') body = upTab(s);
  else if (tab === 'paint') body = paintTab(s);
  else body = statsTab(s);
  modal.innerHTML = `<div class="crt-frame"><div class="crt-screen">
    <div class="crt-top"><span>VERKSTED-DATA 2.1 · DAG ${s.day}</span><span>KASSE: <b>${kr(s.money)}</b></span><span>FERDIGE BILER: <b>${s.carsTotal}</b></span><button class="crt-x" data-c="close">[X] LOGG UT</button></div>
    <div class="crt-tabs">${tabs.map(([k, l], i) => `<button class="${tab === k ? 'on' : ''}" data-c="tab:${k}">F${i + 1} ${l}</button>`).join('')}</div>
    <div class="crt-body">${body}</div>
  </div><div class="crt-brand">NORDSKJERM 14"</div></div>`;
}

function stockTab(s) {
  const cap = capacity();
  const bulk = s.upgrades.bulk;
  const disc = s.upgrades.wholesale2 ? '−30 %' : s.upgrades.wholesale ? '−15 %' : '';
  return `<div class="crt-head">BESTILL RESERVEDELER <small>Levering: UMIDDELBART. Hyllekapasitet ${cap} per del. ${disc ? `Rabatt ${disc}.` : ''}</small></div>
    <table class="crt-table"><tr><th></th><th>DEL</th><th>PÅ HYLLA</th><th>I KASSA</th><th>PRIS</th><th></th></tr>
    ${PART_IDS.map((id) => {
      const have = s.stock[id] || 0, inCrate = s.crate[id] || 0, room = cap - have - inCrate;
      const p = partPrice(id);
      if (id === 'paint' && !s.upgrades.paint_booth) return '';
      return `<tr class="${have === 0 ? 'zero' : ''}"><td class="ic">${partSvg(id)}</td><td>${esc(PARTS[id].name)}</td><td>${have}/${cap}</td><td>${inCrate || ''}</td><td>${kr(p)}</td>
        <td class="btns"><button data-c="buy:${id}:1" ${room < 1 || s.money < p ? 'disabled' : ''}>KJØP 1</button>${bulk ? `<button data-c="buy:${id}:5" ${room < 1 || s.money < p ? 'disabled' : ''}>KJØP 5</button>` : ''}</td></tr>`;
    }).join('')}</table>`;
}

function upTab(s) {
  const cats = ['all', ...Object.keys(UPGRADE_CATS)];
  const list = UPGRADES.filter((u) => upCat === 'all' || u.cat === upCat);
  return `<div class="crt-head">OPPGRADERINGER <small>Krever penger OG ferdige biler. Biler trekkes aldri fra.</small></div>
    <div class="crt-cats">${cats.map((c) => `<button class="${upCat === c ? 'on' : ''}" data-c="ucat:${c}">${c === 'all' ? 'ALLE' : UPGRADE_CATS[c].toUpperCase()}</button>`).join('')}</div>
    <div class="crt-ups">${list.map((u) => {
      const own = !!s.upgrades[u.id];
      const c = canBuy(u, s);
      const carsOk = s.carsTotal >= u.cars, moneyOk = s.money >= u.price;
      return `<div class="crt-up ${own ? 'own' : c.ok ? 'ok' : ''}"><div class="cu-name">${own ? '■' : '□'} ${esc(u.name)} <small>${UPGRADE_CATS[u.cat]}</small></div><div class="cu-desc">${esc(u.desc)}</div>
        <div class="cu-req"><span class="${moneyOk || own ? 'met' : ''}">${kr(u.price)}</span> <span class="${carsOk || own ? 'met' : ''}">${u.cars} biler</span>${u.req ? ` <span class="${s.upgrades[u.req] ? 'met' : ''}">etter ${esc(UPGRADES.find((x) => x.id === u.req).name)}</span>` : ''}</div>
        ${own ? '<div class="cu-own">INSTALLERT</div>' : `<button data-c="up:${u.id}" ${c.ok ? '' : 'disabled'}>${c.ok ? 'KJØP' : esc(c.why)}</button>`}</div>`;
    }).join('')}</div>`;
}

function paintTab(s) {
  if (!s.upgrades.paint_booth) return `<div class="crt-head">LAKKERING</div><p class="crt-p">Lakkboksen er ikke installert. Kjøp «Lakkboks» under OPPGRADERINGER (krever 10 ferdige biler).</p>`;
  const f = paintFault();
  const p = s.paint;
  const job = s.job;
  const colors = COLORS.filter((c) => c.paint || (s.upgrades.paint_colors && EXTRA_PAINT.includes(c.id)));
  const tins = (s.stock.paint || 0) + (s.paintLeft || 0);
  if (p) {
    const ang = -60 + p.pressure * 120;
    return `<div class="crt-head">LAKKERER… <small>${Math.round((p.t / p.dur) * 100)} %</small></div>
      <div class="crt-bar"><span style="width:${(p.t / p.dur) * 100}%;background:${COLOR_BY_ID[p.color].hex}"></span></div>
      <div class="crt-press"><svg viewBox="0 0 200 110"><path d="M20,100 A80,80 0 0 1 180,100" stroke="#1c3a1c" stroke-width="14" fill="none"/><path d="M73,32 A80,80 0 0 1 127,32" stroke="#7cff7a" stroke-width="14" fill="none"/><line x1="100" y1="100" x2="${100 + Math.sin(ang * Math.PI / 180) * 76}" y2="${100 - Math.cos(ang * Math.PI / 180) * 76}" stroke="#ffb03a" stroke-width="5"/></svg>
      <div><button data-c="press:down">− TRYKK</button><button data-c="press:up">+ TRYKK</button></div><p class="crt-p">Hold nåla i det grønne feltet. Jevnt trykk gir bedre lakk. (Du kan også gå fra – det blir bare litt dårligere.)</p></div>`;
  }
  if (!f) return `<div class="crt-head">LAKKERING <small>Lakk på lager: ${tins} boks${tins === 1 ? '' : 'er'}</small></div>
    <p class="crt-p">${job ? 'Ingen lakkjobb klar. En lakkskade eller ny farge må slipes med lakkutstyret ved bilen først.' : 'Ingen bil inne.'}</p>
    <p class="crt-p dim">Flyt: finn lakkskaden → slip med lakkutstyret (verktøyveggen) → velg farge her → start → lakkboksen gjør jobben (${paintDuration()} s).</p>`;
  const want = job.wantColor;
  const isScratch = f.id === 'paint_damage';
  if (!paintColor || (isScratch && paintColor !== job.car.color)) paintColor = isScratch ? job.car.color : want || colors[0].id;
  const need = s.upgrades.paint_mixer ? 0.5 : 1;
  return `<div class="crt-head">LAKKERING <small>Lakk på lager: ${tins} · slipt: ${QUALITY[Math.min(3, f.prep)].name.toLowerCase()}</small></div>
    <p class="crt-p">${isScratch ? `Lakkskade: originalfargen (${esc(COLOR_BY_ID[job.car.color].name)}) blandes automatisk.` : `Kunden ønsker: <b>${esc(COLOR_BY_ID[want]?.name || '—')}</b>.${s.upgrades.paint_colors ? ' Riktig farge gir 20 % ekstra.' : ''}`}</p>
    <div class="crt-colors">${colors.map((c) => `<button class="sw ${paintColor === c.id ? 'on' : ''}" data-c="color:${c.id}" ${isScratch && c.id !== job.car.color ? 'disabled' : ''} style="--c:${c.hex}"><span></span>${esc(c.name)}</button>`).join('')}</div>
    <button class="crt-go" data-c="paint" ${tins < need ? 'disabled' : ''}>${tins < need ? 'TOMT FOR LAKK – BESTILL PÅ LAGER' : `START LAKKERING (${paintDuration()} s)`}</button>`;
}

function statsTab(s) {
  const t = s.today;
  const avg = t.quality.length ? QUALITY[Math.round(t.quality.reduce((a, b) => a + b, 0) / t.quality.length)].name : '—';
  const unlocked = unlockedFaults(s.carsTotal, s.upgrades);
  const next = UNLOCK_STEPS.find((u) => u.at > s.carsTotal);
  const cats = Object.entries(CATEGORIES).map(([k, c]) => {
    const all = Object.values(FAULTS).filter((f) => f.cat === k).length;
    const have = unlocked.filter((id) => FAULTS[id].cat === k).length;
    return `<tr><td>${c.icon} ${esc(c.name)}</td><td>${have}/${all} feiltyper</td></tr>`;
  }).join('');
  return `<div class="crt-head">STATISTIKK</div>
    <div class="crt-cols"><table class="crt-table small">
      <tr><th colspan="2">I DAG (DAG ${s.day})</th></tr>
      <tr><td>Ferdige biler</td><td>${t.cars}</td></tr><tr><td>Inntekter</td><td>${kr(t.income)}</td></tr><tr><td>Utgifter</td><td>${kr(t.expenses)}</td></tr>
      <tr><td>Snitt kvalitet</td><td>${avg}</td></tr><tr><td>Ekstra feil funnet</td><td>${t.found}</td></tr>
      <tr><th colspan="2">TOTALT</th></tr>
      <tr><td>Ferdige biler</td><td>${s.carsTotal}</td></tr><tr><td>Arbeidsdager</td><td>${s.stats.days}</td></tr><tr><td>Total inntekt</td><td>${kr(s.stats.income)}</td></tr>
      <tr><td>Beste jobb</td><td>${kr(s.stats.best)}</td></tr><tr><td>Perfekte biler</td><td>${s.stats.perfect}</td></tr><tr><td>Oppgraderinger</td><td>${Object.keys(s.upgrades).length}/${UPGRADES.length}</td></tr>
    </table>
    <table class="crt-table small"><tr><th colspan="2">OPPLÅSTE REPARASJONER</th></tr>${cats}
      <tr><td colspan="2" class="dim">${next ? `Neste ved ${next.at} biler: ${esc(next.text)}` : 'Alt er låst opp.'}</td></tr></table></div>`;
}
