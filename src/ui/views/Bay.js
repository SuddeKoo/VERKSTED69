// VENSTRE TO GANGER – bilen og løftebukken. Bilen kjører inn gjennom garasjeporten som en kort 2D-animasjon
// (ingen filmsekvens), og alt arbeid skjer her: inspeksjoner med hånd, lampe og diagnoseverktøy, og
// reparasjoner med riktig verktøy og delene i delekassa.
import { G, S, save } from '../../game/state.js';
import { BG, BAY as L } from '../layout.js';
import { garageSvg, liftSvg, liftArmsSvg } from '../art/furniture.js';
import { renderCar, renderLampLayer, geometry, zoneCenter } from '../car/CarArt.js';
import { FAULTS } from '../../data/faults.js';
import { TOOLS, PARTS } from '../../data/parts.js';
import { MODELS } from '../../data/cars.js';
import { inspect, repairCheck, completeRepair, zoneMatch, toast, swapCart } from '../../game/workshop.js';
import * as flow from '../../game/flow.js';
import { openWorkOrder } from '../WorkOrder.js';
import { startMinigame, minigameOpen } from '../minigames/Minigame.js';
import { toolSvg, partSvg } from '../icons.js';
import { esc } from '../../core/util.js';
import { Snow } from '../Snow.js';

const SC = L.car.w / 1000;              // bilens skala (1000 enheter → 900 px)
const CAR_TOP = L.floor - 420 * SC;      // bilens øvre kant når den står på gulvet
const CAR_H = 440 * SC;

let root, wrap, art, lampEl, zonesEl, marks, tip, popup, dash, engineBay, meter, garage, gDoor, gLight, gSnow, armsEl, orderBtn, crateEl, cartEl, ctrl;
let anim = null;        // innkjøring/utkjøring
let liftTarget = 0;
let busy = null;        // pågående test (motor, hjul …)
let lights = false;
let mouse = { x: 0, y: 0, inside: false };
const box = (r) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;

export function mountBay(el) {
  root = el;
  el.innerHTML = `
    <img class="bg" src="${BG.bay}" alt="" draggable="false">
    <div class="lamp-glow" style="left:0;top:0;width:640px;height:380px"></div><div class="lamp-glow" style="left:620px;top:0;width:620px;height:380px"></div>
    ${garageSvg()}
    ${liftSvg()}
    <div class="car-shadow"></div>
    <div class="car-wrap" style="left:${L.car.x}px;top:${CAR_TOP}px;width:${L.car.w}px;height:${CAR_H}px">
      <div class="car-art"></div><div class="lamp-layer"></div>
      <svg class="car-zones" viewBox="0 0 1000 440"></svg>
      <div class="markers"></div>
    </div>
    <div class="lift-arms-wrap">${liftArmsSvg()}</div>
    <div class="paint-curtain hidden"></div>
    <button class="prop lift-ctrl" style="${box(L.control)}" aria-label="Løftebukk"></button>
    <button class="prop order-board" style="${box(L.order)}" aria-label="Arbeidsordre"></button>
    <div class="bay-crate" style="${box(L.crate)}"></div>
    <button class="prop tool-cart hidden" style="${box(L.cart)}" aria-label="Verktøytralle"></button>
    <div class="lamp-beam hidden"></div>
    <div class="zone-tip hidden"></div>
    <div class="find-pop hidden"></div>
    <div class="spin-meter hidden"><canvas width="300" height="120"></canvas><div class="sm-label"></div></div>
    <div class="dash hidden"></div>
    <div class="engine-bay hidden"></div>
    <div class="empty-bay">Ingen bil inne.<small>Bilen kjører inn når du har godtatt et oppdrag i mottaket.</small></div>`;
  wrap = el.querySelector('.car-wrap');
  art = el.querySelector('.car-art');
  lampEl = el.querySelector('.lamp-layer');
  zonesEl = el.querySelector('.car-zones');
  marks = el.querySelector('.markers');
  tip = el.querySelector('.zone-tip');
  popup = el.querySelector('.find-pop');
  dash = el.querySelector('.dash');
  engineBay = el.querySelector('.engine-bay');
  meter = el.querySelector('.spin-meter');
  garage = el.querySelector('.garage');
  gDoor = el.querySelector('.garage-door');
  gLight = el.querySelector('.garage-light');
  gSnow = new Snow(el.querySelector('.garage-snow'), { count: 60, size: 0.9, alpha: 0.8, speed: 1 });
  armsEl = el.querySelector('.lift-arms-wrap');
  orderBtn = el.querySelector('.order-board');
  crateEl = el.querySelector('.bay-crate');
  cartEl = el.querySelector('.tool-cart');
  ctrl = el.querySelector('.lift-ctrl');

  zonesEl.addEventListener('pointermove', onZoneMove);
  zonesEl.addEventListener('pointerleave', () => tip.classList.add('hidden'));
  zonesEl.addEventListener('click', onZoneClick);
  el.addEventListener('pointermove', (e) => {
    const r = root.getBoundingClientRect(), k = r.width / 1600;
    mouse = { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, inside: true };
  });
  el.addEventListener('pointerleave', () => { mouse.inside = false; });
  ctrl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-l]');
    if (!b) return;
    setLift(b.dataset.l === 'up' ? 1 : 0);
  });
  orderBtn.addEventListener('click', () => { G.audio?.play('paper', { volume: 0.6 }); openWorkOrder(); });
  cartEl.addEventListener('click', () => swapCart());
  crateEl.addEventListener('click', () => {
    const items = Object.entries(S().crate);
    toast(items.length ? `Delekassa: ${items.map(([p, n]) => `${n}× ${PARTS[p].short.toLowerCase()}`).join(', ')}.` : 'Delekassa er tom. Delene ligger i skuffene på arbeidsbenken (D).');
  });
  popup.addEventListener('click', () => popup.classList.add('hidden'));
  dash.addEventListener('click', onDash);
  engineBay.addEventListener('click', onEngineBay);

  G.bus.on('car:arrive', startArrive);
  G.bus.on('car:leave', startLeave);
  for (const ev of ['car', 'job', 'paint']) G.bus.on(ev, renderAll);
  G.bus.on('held', () => { renderSide(); renderZones(); });
  G.bus.on('stock', renderSide);
  G.bus.on('upgrades', () => { renderSide(); renderAll(); });
  G.bus.on('lift', () => { liftTarget = S().lift; });
  G.bus.on('ui:reset', resetBay);
}

// ───────── Tegning ─────────
function carVisible() {
  const s = S();
  return !!s.job && (['working', 'pickup'].includes(s.phase) || anim || (s.phase === 'leaving' && !s.job.declined));
}
function renderAll() {
  const s = S();
  if (!s || !root) return;
  const vis = carVisible();
  root.classList.toggle('no-car', !vis);
  if (!vis) { art.innerHTML = ''; lampEl.innerHTML = ''; zonesEl.innerHTML = ''; marks.innerHTML = ''; renderSide(); return; }
  art.innerHTML = renderCar(s.job, { lights, hood: s.hood, paintMist: s.paint ? '#cfd6dc' : null });
  lampEl.innerHTML = renderLampLayer(s.job, s.lift > 0.95 || s.upgrades.lift_light);
  root.querySelector('.paint-curtain').classList.toggle('hidden', !s.paint);
  renderZones(); renderMarks(); renderSide();
}

function renderZones() {
  const s = S();
  if (!s?.job || !carVisible()) { zonesEl.innerHTML = ''; return; }
  const G2 = geometry(s.job.car.model);
  const lifted = s.lift > 0.95;
  const exHang = s.job.faults.some((f) => f.id === 'exhaust_loose' && !f.fixed);
  const order = ['body', 'door', 'bumperR', 'bumperF', 'glass', 'hood', 'cabin', 'lock', 'headlight', 'taillight', 'wheelR', 'wheelF', 'under', 'exhaust'];
  zonesEl.innerHTML = order.map((k) => {
    const z = G2.zones[k];
    if ((k === 'under' && !lifted) || (k === 'exhaust' && !lifted && !exHang)) return '';
    const work = s.upgrades.work_light ? ' hint' : '';
    if (z.c) return `<circle class="z${work}" data-zone="${k}" cx="${z.c[0]}" cy="${z.c[1]}" r="${z.rad}"/>`;
    const [x, y, w, h] = z.rect;
    return `<rect class="z${work}" data-zone="${k}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
  }).join('');
}

function renderMarks() {
  const s = S();
  const G2 = geometry(s.job.car.model);
  marks.innerHTML = s.job.faults.filter((f) => f.found).map((f) => {
    const d = FAULTS[f.id];
    const wheels = f.wheel === 'B' ? ['F', 'R'] : [f.wheel];
    return wheels.map((w, i) => {
      const [x, y] = zoneCenter(G2, d.zone, w);
      const off = (s.job.faults.indexOf(f) % 3) * 16 + i * 4;
      return `<div class="mark ${f.fixed ? 'fixed' : ''}" style="left:${x * SC + off}px;top:${y * SC - 46 - off}px" title="${esc(d.name)}"><b>${f.fixed ? '✔' : '!'}</b><span>${esc(d.name)}</span></div>`;
    }).join('');
  }).join('');
}

function renderSide() {
  const s = S();
  if (!s || !root) return;
  // Løftebukkens betjening
  ctrl.innerHTML = `<svg viewBox="0 0 92 150"><rect x="6" y="6" width="80" height="138" rx="8" fill="#e0b83a" stroke="#1b120c" stroke-width="5"/><rect x="16" y="16" width="60" height="18" fill="#2a2a2a"/><text x="46" y="30" font-family="Special Elite, monospace" font-size="11" fill="#7cff7a" text-anchor="middle">${Math.round(s.lift * 100)}%</text></svg>
    <span class="lc-btn up" data-l="up">▲</span><span class="lc-btn down" data-l="down">▼</span>`;
  // Arbeidsordren på veggen
  const job = s.job;
  orderBtn.innerHTML = `<div class="clip-board small"><div class="clip-head">ARBEIDSORDRE</div>${job && carVisible() ? `<div class="clip-car">${esc(MODELS[job.car.model].kind)}</div><ul>${job.faults.filter((f) => f.found).map((f) => `<li class="${f.fixed ? 'done' : ''}">${esc(FAULTS[f.id].name)}</li>`).join('') || '<li class="muted">Ingenting funnet ennå</li>'}</ul><div class="clip-open">Klikk for detaljer</div>` : '<div class="clip-car muted">Ingen bil</div>'}</div>`;
  // Delekassa ved bilen
  const items = Object.entries(s.crate);
  crateEl.innerHTML = `<svg viewBox="0 0 220 170"><path d="M14,60 L206,60 L192,162 L28,162 Z" fill="#b8322a" stroke="#1b120c" stroke-width="5"/><path d="M24,100 L196,100" stroke="#7a1f18" stroke-width="4"/></svg><div class="bc-items">${items.map(([id, n]) => `<span>${partSvg(id)}${n > 1 ? `<b>×${n}</b>` : ''}</span>`).join('')}</div>`;
  crateEl.classList.toggle('empty', !items.length);
  // Verktøytralla
  cartEl.classList.toggle('hidden', !s.upgrades.tool_cart);
  cartEl.innerHTML = `<svg viewBox="0 0 170 160"><rect x="10" y="40" width="150" height="70" rx="6" fill="#3c4a5a" stroke="#1b120c" stroke-width="5"/><circle cx="36" cy="132" r="16" fill="#2a2a2a" stroke="#1b120c" stroke-width="4"/><circle cx="134" cy="132" r="16" fill="#2a2a2a" stroke="#1b120c" stroke-width="4"/><path d="M160,50 L168,10" stroke="#1b120c" stroke-width="7"/></svg>${s.cartTool ? `<div class="cart-tool">${toolSvg(s.cartTool)}</div>` : ''}<span class="cart-label">${s.cartTool ? 'Bytt verktøy' : s.held ? 'Legg verktøyet her' : 'Tom tralle'}</span>`;
}

// ───────── Soner: hjelpetekst og klikk ─────────
const ZONE_NAMES = { wheelF: 'Hjul foran', wheelR: 'Hjul bak', headlight: 'Frontlykt', taillight: 'Baklykt', lock: 'Dørlås', hood: 'Panser', glass: 'Frontrute', cabin: 'Førerdør', door: 'Dør', bumperF: 'Støtfanger foran', bumperR: 'Støtfanger bak', body: 'Karosseri', under: 'Understell', exhaust: 'Eksos' };
function actionText(zone) {
  const s = S();
  const held = s.held;
  const lifted = s.lift > 0.95;
  if (!held) {
    if (zone.startsWith('wheel')) return lifted ? 'spinn hjulet (hjultest)' : 'se nærmere · løft bilen for hjultest';
    if (zone === 'hood') return s.hood ? 'motorrommet (peilestav)' : 'åpne panseret';
    if (zone === 'cabin' || zone === 'lock') return 'førerplassen (motortest, lys)';
    if (zone === 'bumperF') return lifted ? 'se nærmere' : 'se nærmere · trykk ned (gyngetest)';
    if (zone === 'under' || zone === 'exhaust') return s.upgrades.lift_light ? 'sjekk understellet' : 'se nærmere · bruk lampa';
    return 'se nærmere';
  }
  if (held === 'lamp') return zone === 'under' || zone === 'exhaust' ? 'lys under bilen' : 'lys på området';
  if (held === 'scanner') return zone === 'cabin' || zone === 'lock' || zone === 'door' ? 'koble til diagnose' : 'koble til gjennom døra';
  return `${TOOLS[held].verb}`;
}
function hitZone(e) {
  const t = e.target.closest('[data-zone]');
  return t ? t.dataset.zone : null;
}
function onZoneMove(e) {
  const z = hitZone(e);
  if (!z || busy || anim || S().phase !== 'working') { tip.classList.add('hidden'); return; }
  tip.classList.remove('hidden');
  tip.textContent = `${ZONE_NAMES[z]}: ${actionText(z)}`;
  tip.style.transform = `translate(${mouse.x + 18}px, ${mouse.y + 14}px)`;
}

function onZoneClick(e) {
  const zone = hitZone(e);
  if (!zone) return;
  const s = S();
  if (s.phase !== 'working' || anim || busy || minigameOpen()) return;
  if (s.paint) return toast('Bilen lakkeres nå. Vent til lakkboksen er ferdig (kontoret).', 'warn');
  const wheel = zone === 'wheelF' ? 'F' : zone === 'wheelR' ? 'R' : null;
  const z = wheel ? 'wheel' : zone;
  const held = s.held;
  G.audio?.play('click', { volume: 0.3 });
  if (!held) return handAt(z, wheel);
  if (held === 'lamp') return lampAt(z, wheel);
  if (held === 'scanner') {
    if (['cabin', 'lock', 'door'].includes(z)) return lockedCabin() || openDash(true);
    return toast('Diagnoseverktøyet kobles til under rattet – klikk på førerdøra.');
  }
  return repairAt(z, wheel);
}

// ───────── Inspeksjoner ─────────
function showFindings(found, at, empty) {
  popup.classList.remove('hidden');
  const [x, y] = at || [mouse.x, mouse.y];
  popup.style.left = `${Math.min(1180, Math.max(20, x - 180))}px`;
  popup.style.top = `${Math.max(70, Math.min(620, y - 200))}px`;
  popup.innerHTML = found.length
    ? `<b class="fp-head">FUNNET!</b>${found.map(({ fault, why }) => `<div class="fp-item"><b>${esc(FAULTS[fault.id].name)}${!fault.reported ? ' <span class="extra-tag">EKSTRA</span>' : ''}</b><p>${esc(why)}</p><small>Trenger ${esc(TOOLS[FAULTS[fault.id].tool].name.toLowerCase())}${FAULTS[fault.id].part ? ` og ${esc(PARTS[FAULTS[fault.id].part].name.toLowerCase())}` : ''}.</small></div>`).join('')}`
    : `<b class="fp-head none">INGENTING Å SE</b><p>${esc(empty || 'Ingenting unormalt her.')}</p>`;
  clearTimeout(popup._t);
  popup._t = setTimeout(() => popup.classList.add('hidden'), found.length ? 9000 : 3500);
}

function lockedCabin() {
  const s = S();
  const f = s.job.faults.find((x) => x.id === 'frozen_lock' && !x.fixed);
  if (!f) return false;
  G.audio?.play('key_insert', { volume: 0.8 });
  const found = inspect('key', { zone: 'lock' });
  showFindings(found, null, 'Nøkkelen går fortsatt ikke inn. Tin låsen med varmepistolen.');
  return true;
}

function handAt(z, wheel) {
  const s = S();
  const lifted = s.lift > 0.95;
  if (z === 'wheel' && lifted) return spinTest(wheel);
  if (z === 'hood') {
    if (!s.hood) { s.hood = true; G.audio?.play('hood', { volume: 0.7 }); renderAll(); return; }
    return openEngineBay();
  }
  if (z === 'cabin' || z === 'lock') return lockedCabin() || openDash(false);
  if (z === 'bumperF' && !lifted) bounceTest();
  if ((z === 'under' || z === 'exhaust') && s.upgrades.lift_light && lifted) {
    const found = [...inspect('under', { zone: z }), ...inspect('look', { zone: z })];
    return showFindings(found, null, 'Understellet ser greit ut her.');
  }
  const found = inspect('look', { zone: z, wheel });
  if (z === 'bumperF' && !lifted) return setTimeout(() => showFindings([...found, ...inspect('bounce')], null, 'Fronten gynger normalt og ser hel ut.'), 1300);
  showFindings(found, null, z === 'wheel' ? 'Ingenting synlig. Løft bilen og spinn hjulet for å teste det.' : z === 'under' || z === 'exhaust' ? 'For mørkt til å se noe. Bruk arbeidslampa.' : 'Ingen synlige skader her. Noen feil syns bare i lampelyset eller ved test.');
}

function lampAt(z, wheel) {
  const s = S();
  const lifted = s.lift > 0.95;
  let found = inspect('lamp', { zone: z, wheel });
  if ((z === 'under' || z === 'exhaust') && lifted) found = found.concat(inspect('under', { zone: z }));
  if (z === 'hood' && !s.hood) return toast('Åpne panseret først for å lyse i motorrommet.');
  G.audio?.play('clip', { volume: 0.3 });
  showFindings(found, null, z === 'wheel' || z === 'under' ? 'Lampa viser ingenting galt her.' : 'Ingenting skjult her i lampelyset.');
}

function spinTest(side) {
  const s = S();
  busy = 'spin';
  const job = s.job;
  const dur = s.upgrades.fast_test ? 1.3 : 2.6;
  const f = (id) => job.faults.some((x) => x.id === id && !x.fixed && (x.wheel === side || x.wheel === 'B'));
  const wobble = (f('imbalance') ? 0.7 : 0) + (f('bent_rim') ? 1 : 0) + (f('flat_tire') ? 0.6 : 0) + (f('alignment') ? 0.3 : 0);
  const brakes = f('worn_brakes') ? 'grind' : f('brake_noise') ? 'squeal' : null;
  const clunk = job.faults.some((x) => (x.id === 'loose_part' || x.id === 'underbody') && !x.fixed);
  const [wx, wy] = geometry(job.car.model).wheel[side];
  meter.classList.remove('hidden');
  meter.style.left = `${L.car.x + wx * SC - 150}px`;
  meter.style.top = `${CAR_TOP - L.liftH + wy * SC - 250}px`;
  meter.querySelector('.sm-label').textContent = `Hjultest ${side === 'F' ? 'foran' : 'bak'}…`;
  art.querySelector(`.wheel.w${side}`)?.classList.add('spin');
  G.audio?.synth('hiss', { volume: 0.6 });
  const ctx = meter.querySelector('canvas').getContext('2d');
  let t = 0;
  busy = { kind: 'spin', step(dt) {
    t += dt;
    ctx.fillStyle = '#10180f'; ctx.fillRect(0, 0, 300, 120);
    ctx.strokeStyle = '#2c4a2a'; ctx.beginPath(); for (let x = 0; x < 300; x += 30) { ctx.moveTo(x, 0); ctx.lineTo(x, 120); } ctx.stroke();
    ctx.strokeStyle = wobble > 0.5 ? '#ffb03a' : '#7cff7a'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x < 300; x++) {
      const ph = (x / 300) * 12 + t * 14;
      const amp = 6 + wobble * 34 * Math.min(1, t / 0.6);
      const y = 60 + Math.sin(ph) * amp * 0.5 + Math.sin(ph * 2.7) * amp * 0.2 + (Math.random() - 0.5) * (4 + wobble * 6);
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    if (brakes && t > dur * 0.55) { ctx.fillStyle = '#ff4a2a'; ctx.font = '16px monospace'; ctx.fillText(brakes === 'grind' ? 'SKRAPER!' : 'HVINER!', 10, 20); }
    if (Math.random() < dt * 6) G.audio?.synth('hiss', { volume: 0.25 });
    if (brakes && t > dur * 0.55 && !this.b) { this.b = 1; G.audio?.synth(brakes === 'grind' ? 'grindbrake' : 'squeal'); }
    if (clunk && t > dur * 0.4 && !this.c) { this.c = 1; G.audio?.synth('rattle'); }
    if (wobble > 0.5 && Math.random() < dt * 3) G.audio?.synth('tick', { volume: 0.5 });
    if (t >= dur) {
      busy = null;
      meter.classList.add('hidden');
      art.querySelector(`.wheel.w${side}`)?.classList.remove('spin');
      const found = inspect('spin', { zone: 'wheel', wheel: side });
      showFindings(found, null, 'Hjulet går rundt jevnt og stille. Ingen vibrasjon, ingen bremselyd.');
    }
  } };
}

function bounceTest() {
  const s = S();
  const bad = s.job.faults.some((x) => x.id === 'bad_shock' && !x.fixed);
  wrap.classList.remove('bounce', 'bounce-bad'); void wrap.offsetWidth;
  wrap.classList.add(bad ? 'bounce-bad' : 'bounce');
  G.audio?.synth('creak', { volume: bad ? 0.9 : 0.4 });
  if (bad) G.audio?.synth('creak', { volume: 0.6, delay: 0.5 });
}

// Førerplassen: motortest, lystest og diagnose
function openDash(scanner) {
  engineBay.classList.add('hidden');
  dash.classList.remove('hidden');
  dash.dataset.mode = scanner ? 'scan' : '';
  G.audio?.play('car_door_open', { volume: 0.6 });
  renderDash();
  if (scanner) runScanner();
}
function renderDash(state = {}) {
  const s = S();
  const job = s.job;
  const lampOil = state.running && job.faults.some((f) => f.id === 'low_oil' && !f.fixed);
  const lampEng = state.running && job.faults.some((f) => ['misfire', 'sensor_fault', 'wiring_fault', 'worn_plugs'].includes(f.id) && !f.fixed);
  const lampBat = (state.cranking || state.running) && job.faults.some((f) => ['weak_battery', 'dead_battery', 'cold_start'].includes(f.id) && !f.fixed);
  const rpm = state.rpm ?? 0;
  dash.innerHTML = `<div class="dash-inner">
    <svg class="dash-svg" viewBox="0 0 560 300"><rect x="0" y="30" width="560" height="270" rx="30" fill="#2a2624" stroke="#1b120c" stroke-width="6"/>
      <circle cx="180" cy="140" r="78" fill="#151413" stroke="#1b120c" stroke-width="6"/>${Array.from({ length: 9 }, (_, i) => { const a = (-210 + i * 30) * Math.PI / 180; return `<line x1="${180 + Math.cos(a) * 62}" y1="${140 + Math.sin(a) * 62}" x2="${180 + Math.cos(a) * 72}" y2="${140 + Math.sin(a) * 72}" stroke="#ddd" stroke-width="3"/>`; }).join('')}
      <line class="needle" x1="180" y1="140" x2="${180 + Math.cos((-210 + rpm * 240) * Math.PI / 180) * 64}" y2="${140 + Math.sin((-210 + rpm * 240) * Math.PI / 180) * 64}" stroke="#ff4a2a" stroke-width="5" stroke-linecap="round"/>
      <text x="180" y="200" font-family="Special Elite, monospace" font-size="14" fill="#aaa" text-anchor="middle">o/min ×1000</text>
      <g transform="translate(300 80)"><rect width="230" height="80" rx="8" fill="#151413" stroke="#1b120c" stroke-width="4"/>
        <circle cx="40" cy="40" r="17" fill="${lampOil ? '#ff3a2a' : '#3a2220'}"/><text x="40" y="45" font-size="13" text-anchor="middle" fill="#111" font-family="monospace">OLJE</text>
        <circle cx="115" cy="40" r="17" fill="${lampEng ? '#ffb03a' : '#3a3020'}"/><text x="115" y="45" font-size="13" text-anchor="middle" fill="#111" font-family="monospace">MOT</text>
        <circle cx="190" cy="40" r="17" fill="${lampBat ? '#ff3a2a' : '#3a2220'}"/><text x="190" y="45" font-size="13" text-anchor="middle" fill="#111" font-family="monospace">BAT</text></g>
      <rect x="330" y="190" width="60" height="60" rx="30" fill="#4a4440" stroke="#1b120c" stroke-width="4"/><rect x="354" y="200" width="12" height="40" rx="4" fill="${state.key ? '#c9a23a' : '#8a8680'}" stroke="#1b120c" stroke-width="3" transform="rotate(${state.key ? 40 : 0} 360 220)"/>
      <rect x="430" y="196" width="48" height="48" rx="8" fill="${lights ? '#ffe88a' : '#3a3632'}" stroke="#1b120c" stroke-width="4"/><text x="454" y="226" font-size="18" text-anchor="middle" font-family="monospace">☼</text>
      <path d="M20,300 q120,-120 300,-60" stroke="#141210" stroke-width="40" fill="none"/></svg>
    <div class="dash-side"><div class="dash-head">FØRERPLASSEN</div>
      <button class="opt primary" data-d="engine" ${state.cranking || state.running ? 'disabled' : ''}>Vri om nøkkelen (motortest)</button>
      <button class="opt" data-d="lights">${lights ? 'Slå av lysene' : 'Slå på lys og viskere (lystest)'}</button>
      <button class="opt" data-d="scan" ${s.held === 'scanner' ? '' : 'disabled'}>${s.held === 'scanner' ? 'Les feilkoder (diagnose)' : 'Diagnose: hold diagnoseverktøyet'}</button>
      <div class="dash-log">${state.log || ''}</div>
      <button class="opt" data-d="close">Lukk døra</button></div></div>`;
}
function onDash(e) {
  const b = e.target.closest('[data-d]');
  if (!b || b.disabled || busy) return;
  const d = b.dataset.d;
  G.audio?.play('click', { volume: 0.4 });
  if (d === 'close') { closeDash(); return; }
  if (d === 'engine') engineTest();
  if (d === 'lights') lightTest();
  if (d === 'scan') runScanner();
}
function closeDash() {
  if (busy) return;
  dash.classList.add('hidden');
  G.audio?.play('car_door_close', { volume: 0.6 });
  if (lights) { lights = false; renderAll(); }
}

function engineTest() {
  const s = S();
  const job = s.job;
  const has = (id) => job.faults.some((f) => f.id === id && !f.fixed);
  const fast = s.upgrades.fast_test ? 0.5 : 1;
  const noStart = has('dead_battery') ? 'dead' : has('starter_fault') ? 'relay' : null;
  const slow = has('weak_battery') || has('cold_start') || has('worn_plugs');
  const misfire = has('misfire') || has('worn_plugs');
  const loud = has('exhaust_damaged') || has('exhaust_noise');
  const weak = has('dirty_filter');
  let t = 0, phase = 'crank', log = '';
  G.audio?.play('keys', { volume: 0.6 });
  if (noStart === 'dead') { G.audio?.synth('tick'); }
  else if (noStart === 'relay') G.audio?.synth('click2');
  else G.audio?.synth('crank', { n: slow ? 8 : 3, slow });
  const crankDur = noStart ? 1.6 : slow ? 2.6 : 0.9;
  const runDur = 3.4 * fast;
  busy = { kind: 'engine', step(dt) {
    t += dt;
    if (phase === 'crank') {
      renderDashLive({ key: true, cranking: !!noStart || true, rpm: noStart === 'dead' ? 0 : 0.08 + Math.random() * 0.06, log: noStart === 'dead' ? 'Ingenting skjer…' : noStart ? 'Klikk. Klikk.' : 'Startmotoren drar…' });
      if (t >= crankDur) {
        if (noStart) return finish('Motoren starter ikke.');
        phase = 'run'; t = 0;
        G.audio?.play('car_start', { volume: 0.7 });
        G.audio?.loop('engine_idle', loud ? 0.75 : 0.45, 0.3, { rate: 1 });
        if (loud) G.audio?.loop('engine_rev', 0.35, 0.3, { rate: 0.8 });
        art.classList.add('running');
      }
    } else {
      let rpm = 0.22 + Math.sin(t * 3) * 0.02;
      if (t > runDur * 0.35 && t < runDur * 0.7) rpm = weak ? 0.38 : 0.55; // gi litt gass
      if (misfire && Math.random() < dt * 5) { rpm -= 0.12; G.audio?.synth('sputter', { volume: 0.7 }); G.audio?.tweak('engine_idle', { volume: 0.2 }); setTimeout(() => G.audio?.tweak('engine_idle', { volume: 0.45 }), 120); }
      if (loud && Math.random() < dt * 2) { G.audio?.synth('rattle', { volume: 0.5 }); puff(); }
      G.audio?.tweak('engine_idle', { rate: 0.85 + rpm * 0.9 });
      renderDashLive({ key: true, running: true, rpm, log: misfire ? 'Motoren går ujevnt…' : loud ? 'Det brøler fra eksosen…' : weak ? 'Den tar seg tregt opp…' : 'Motoren går.' });
      if (t >= runDur) finish();
    }
  } };
  function finish(msg) {
    busy = null;
    art.classList.remove('running');
    if (phase === 'run') { G.audio?.play('car_stop', { volume: 0.6 }); G.audio?.stopLoop('engine_idle', 0.6); G.audio?.stopLoop('engine_rev', 0.4); }
    const found = inspect('engine');
    renderDash({ log: found.length ? `${found.length} funn – se lappen.` : msg || 'Motoren går fint og jevnt.' });
    showFindings(found, [800, 300], msg ? `${msg} Ingen ny forklaring – prøv diagnoseverktøyet eller sjekk batteriet.` : 'Motoren går fint. Ingen lyder, ingen lamper.');
  }
}
let dashT = 0;
function renderDashLive(state) {
  const now = performance.now();
  if (now - dashT < 80) return; // ikke tegn dashbordet hvert bilde
  dashT = now;
  renderDash(state);
}
function puff() {
  const p = document.createElement('div');
  p.className = 'puff';
  const G2 = geometry(S().job.car.model);
  p.style.left = `${L.car.x + G2.minX * SC - 20}px`;
  p.style.top = `${CAR_TOP + (G2.m.sill + 10) * SC - S().lift * L.liftH}px`;
  root.appendChild(p);
  setTimeout(() => p.remove(), 1200);
}

function lightTest() {
  lights = !lights;
  renderAll();
  renderDash();
  if (!lights) return;
  G.audio?.play('clip', { volume: 0.5 });
  G.audio?.play('wiper', { volume: 0.5, delay: 0.3 });
  busy = { kind: 'lights', t: 0, step(dt) {
    this.t += dt;
    if (this.t > 1.3) {
      busy = null;
      const found = inspect('lights');
      showFindings(found, [800, 300], 'Alle lys virker, og viskerne tørker rent.');
    }
  } };
}

function runScanner() {
  const s = S();
  G.audio?.synth('beep');
  busy = { kind: 'scan', t: 0, step(dt) {
    this.t += dt;
    if (Math.random() < dt * 8) G.audio?.synth('tick', { volume: 0.4 });
    renderDashLive({ log: `Leser feilkoder${'.'.repeat(1 + Math.floor(this.t * 3) % 3)}` });
    if (this.t > (s.upgrades.fast_test ? 1 : 2)) {
      busy = null;
      const found = inspect('scanner');
      G.audio?.synth(found.length ? 'beep_lo' : 'beep');
      renderDash({ log: found.length ? found.map((f) => esc(FAULTS[f.fault.id].tests.scanner.split(':')[0])).join('<br>') : s.upgrades.scanner2 ? 'Ingen lagrede feilkoder.' : 'Ingen koder. (Gammel maskin – leser bare elektronikk.)' });
      showFindings(found, [800, 300], s.upgrades.scanner2 ? 'Ingen feilkoder lagret.' : 'Ingen feilkoder. Den gamle maskinen leser bare elektriske feil – motorfeil må finnes med motortesten.');
    }
  } };
}

// Motorrommet: peilestav
function openEngineBay() {
  dash.classList.add('hidden');
  engineBay.classList.remove('hidden');
  renderEngineBay();
}
function renderEngineBay(dip = null) {
  const s = S();
  const job = s.job;
  const low = job.faults.some((f) => f.id === 'low_oil' && !f.fixed);
  const old = job.faults.some((f) => f.id === 'oil_service' && !f.fixed);
  engineBay.innerHTML = `<div class="dash-inner"><svg class="dash-svg" viewBox="0 0 560 300">
    <rect x="0" y="20" width="560" height="280" rx="20" fill="#3a3632" stroke="#1b120c" stroke-width="6"/>
    <rect x="150" y="70" width="260" height="150" rx="16" fill="#5a5450" stroke="#1b120c" stroke-width="5"/>${[0, 1, 2, 3].map((i) => `<rect x="${178 + i * 56}" y="58" width="22" height="30" fill="#2a2a2a" stroke="#1b120c" stroke-width="3"/>`).join('')}
    <rect x="30" y="120" width="100" height="80" rx="6" fill="#2a2a2c" stroke="#1b120c" stroke-width="4"/><rect x="40" y="108" width="18" height="14" fill="#b8322a" stroke="#1b120c" stroke-width="3"/><rect x="100" y="108" width="18" height="14" fill="#3a3a3a" stroke="#1b120c" stroke-width="3"/>
    <rect x="430" y="90" width="100" height="70" rx="8" fill="#2a2a2a" stroke="#1b120c" stroke-width="4"/><text x="480" y="130" font-family="monospace" font-size="13" fill="#aaa" text-anchor="middle">LUFTFILTER</text>
    <g transform="translate(${dip ? 330 : 380} ${dip ? 20 : 170}) rotate(${dip ? -20 : 0})"><circle cx="0" cy="0" r="14" fill="none" stroke="#e8c84a" stroke-width="7"/><rect x="-3" y="12" width="6" height="${dip ? 150 : 40}" fill="#cfcdc6" stroke="#1b120c" stroke-width="2"/>
      ${dip ? `<rect x="-3" y="${12 + 150 - (low ? 8 : 50)}" width="6" height="${low ? 8 : 50}" fill="${old ? '#141008' : '#9a6a20'}"/><path d="M-12,${130} l24,0 M-12,${150} l24,0" stroke="#1b120c" stroke-width="3"/>` : ''}</g>
  </svg><div class="dash-side"><div class="dash-head">MOTORROMMET</div>
    <button class="opt primary" data-e="dip">Trekk opp peilestaven</button>
    <div class="dash-log">${dip ? (low ? 'Nesten tørr peilestav.' : old ? 'Olja er svart og tykk.' : 'Olja er fin og på nivå.') : s.held === 'lamp' ? 'Lys på bilen med lampa for å se etter støv og slitasje.' : 'Batteri, oljepeilestav og luftfilter.'}</div>
    <button class="opt" data-e="closehood">Lukk panseret</button><button class="opt" data-e="close">Tilbake</button></div></div>`;
}
function onEngineBay(e) {
  const b = e.target.closest('[data-e]');
  if (!b) return;
  G.audio?.play('click', { volume: 0.4 });
  const a = b.dataset.e;
  if (a === 'dip') {
    G.audio?.play('clip', { volume: 0.5 });
    renderEngineBay(true);
    const found = inspect('dipstick');
    showFindings(found, [800, 300], 'Olja er ren og på riktig nivå.');
  } else if (a === 'closehood') { S().hood = false; G.audio?.play('thump', { volume: 0.7 }); engineBay.classList.add('hidden'); renderAll(); }
  else engineBay.classList.add('hidden');
}

// ───────── Reparasjon ─────────
function repairAt(z, wheel) {
  const s = S();
  const held = s.held;
  const job = s.job;
  const match = (f) => {
    const d = FAULTS[f.id];
    if (f.fixed || d.tool !== held) return false;
    if (d.paintJob && f.prep > 0) return false;
    if (d.zone === 'wheel') return z === 'wheel' && (f.wheel === 'B' || f.wheel === wheel);
    if (d.zone === 'body') return z !== 'wheel';
    return zoneMatch(z, d.zone) || (d.zone === 'lock' && ['cabin', 'door'].includes(z));
  };
  const cands = job.faults.filter(match);
  if (!cands.length) {
    const other = job.faults.find((f) => !f.fixed && f.found && (FAULTS[f.id].zone === z || (z === 'wheel' && FAULTS[f.id].zone === 'wheel' && (f.wheel === wheel || f.wheel === 'B'))));
    if (other) return toast(`Feil verktøy. ${FAULTS[other.id].name} trenger ${TOOLS[FAULTS[other.id].tool].name.toLowerCase()}.`, 'warn');
    G.audio?.synth('wrong');
    return toast(`Ingenting å ${TOOLS[held].verb} her som du vet om. Undersøk bilen med tom hånd, lampe eller diagnose.`);
  }
  const f = cands.find((x) => x.found) || cands[0];
  const chk = repairCheck(f);
  if (!chk.ok) { G.audio?.synth('wrong'); return toast(chk.why, 'warn'); }
  closeDash(); engineBay.classList.add('hidden'); popup.classList.add('hidden');
  startMinigame(f, (q) => { completeRepair(f, q); });
}

// ───────── Løftebukk ─────────
function setLift(target) {
  const s = S();
  if (!s.job || s.phase !== 'working' || anim) { G.audio?.synth('wrong'); return toast('Ingen bil på løftebukken.'); }
  if (s.paint) return toast('Ikke rør løftebukken mens bilen lakkeres.', 'warn');
  if (target === liftTarget) return;
  if (target === 1 && s.hood) { s.hood = false; renderAll(); }
  liftTarget = target;
  G.audio?.play(target ? 'lift_up' : 'lift_down', { volume: 0.7, rate: s.upgrades.lift_pump ? 1.3 : 1 });
  closeDash(); engineBay.classList.add('hidden');
}

// ───────── Innkjøring og utkjøring ─────────
function startArrive() {
  anim = { kind: 'arrive', stage: 'open', t: 0, x: -1150 };
  S().lift = 0; liftTarget = 0; lights = false;
  renderAll();
  wrap.style.transform = `translate(${anim.x}px, 0)`;
  openGarageSound();
}
function startLeave() {
  const s = S();
  anim = { kind: 'leave', stage: 'lower', t: 0, x: 0 };
  liftTarget = 0;
  closeDash(); engineBay.classList.add('hidden');
  if (s.lift < 0.01) { anim.stage = 'start'; }
  else G.audio?.play('lift_down', { volume: 0.6 });
}
function openGarageSound() {
  G.audio?.play('gdoor_open', { volume: 0.8 }); G.audio?.synth('rollup', { volume: 0.8 });
  G.audio?.doorDraft(0.3, 2.6);
}
function closeGarageSound() { G.audio?.synth('rollup', { volume: 0.7 }); G.audio?.play('gdoor_close', { volume: 0.8, delay: 1.6 }); G.audio?.synth('thump', { delay: 1.9 }); }

function stepAnim(dt) {
  const s = S();
  const a = anim;
  a.t += dt;
  const DOOR = 1.5, DRIVE = 3.2;
  const setDoor = (k) => { s.garage = k; gDoor.style.transform = `translateY(${-k * 96}%)`; gLight.style.opacity = k; G.audio?.setGarageOpen(k); };
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  if (a.kind === 'arrive') {
    if (a.stage === 'open') {
      setDoor(Math.min(1, a.t / DOOR));
      if (a.t >= DOOR) { a.stage = 'drive'; a.t = 0; G.audio?.loop('car_drive', 0.5, 0.4, { rate: 0.85 }); art.querySelectorAll('.wheel').forEach((w) => w.classList.add('roll')); }
    } else if (a.stage === 'drive') {
      const k = Math.min(1, a.t / DRIVE);
      a.x = -1150 * (1 - ease(k));
      wrap.style.transform = `translate(${a.x}px, 0)`;
      G.audio?.tweak('car_drive', { rate: 0.6 + (1 - k) * 0.4, volume: 0.25 + (1 - k) * 0.35 });
      if (k >= 1) {
        a.stage = 'close'; a.t = 0;
        art.querySelectorAll('.wheel').forEach((w) => w.classList.remove('roll'));
        G.audio?.stopLoop('car_drive', 0.3); G.audio?.play('car_stop', { volume: 0.6 }); G.audio?.play('ratchet', { volume: 0.4, delay: 0.5 });
        closeGarageSound();
      }
    } else if (a.stage === 'close') {
      setDoor(Math.max(0, 1 - a.t / DOOR));
      if (a.t >= DOOR) { anim = null; wrap.style.transform = ''; flow.carParked(); renderAll(); }
    }
  } else {
    if (a.stage === 'lower') { if (s.lift <= 0.01) { a.stage = 'start'; a.t = 0; } return; }
    if (a.stage === 'start') {
      if (a.t < 0.05) { G.audio?.play('car_door_close', { volume: 0.5 }); G.audio?.synth('crank', { n: 2, delay: 0.4 }); G.audio?.play('car_start', { volume: 0.7, delay: 0.8 }); G.audio?.loop('engine_idle', 0.4, 0.5); openGarageSound(); }
      setDoor(Math.min(1, Math.max(0, (a.t - 0.6) / DOOR)));
      if (a.t >= DOOR + 0.8) { a.stage = 'drive'; a.t = 0; G.audio?.stopLoop('engine_idle', 0.3); G.audio?.loop('car_drive', 0.5, 0.3, { rate: 0.7 }); art.querySelectorAll('.wheel').forEach((w) => w.classList.add('roll', 'rev')); }
    } else if (a.stage === 'drive') {
      const k = Math.min(1, a.t / (DRIVE * 0.9));
      a.x = -1200 * (k * k);
      wrap.style.transform = `translate(${a.x}px, 0)`;
      G.audio?.tweak('car_drive', { volume: 0.5 * (1 - k * 0.7) });
      if (k >= 1) { a.stage = 'close'; a.t = 0; G.audio?.stopLoop('car_drive', 1); closeGarageSound(); }
    } else if (a.stage === 'close') {
      setDoor(Math.max(0, 1 - a.t / DOOR));
      if (a.t >= DOOR) { anim = null; wrap.style.transform = ''; art.innerHTML = ''; flow.carGone(); renderAll(); }
    }
  }
}

// ───────── Bilde for bilde ─────────
export function bayFrame(dt, visible) {
  const s = S();
  if (!s || !root) return;
  if (anim) stepAnim(dt);
  if (busy?.step) busy.step(dt);
  // Løftebukken
  const speed = s.upgrades.lift_pump ? 1.2 : 0.42;
  if (Math.abs(s.lift - liftTarget) > 0.001) {
    const before = s.lift > 0.95;
    s.lift += Math.sign(liftTarget - s.lift) * Math.min(Math.abs(liftTarget - s.lift), speed * dt);
    if (Math.abs(s.lift - liftTarget) < 0.002) { s.lift = liftTarget; G.audio?.synth('thump', { volume: 0.4 }); save(); }
    if (before !== (s.lift > 0.95)) { lampEl.innerHTML = renderLampLayer(s.job || { faults: [], car: { model: 'sedan' } }, s.lift > 0.95 || s.upgrades.lift_light); renderZones(); }
    if (Math.random() < dt * 4) renderSide();
  }
  const ly = -s.lift * L.liftH;
  wrap.style.top = `${CAR_TOP + ly}px`;
  armsEl.style.transform = `translateY(${ly}px)`;
  // Lampa følger musa: masken viser lampelaget bare i lyskjeglen
  const lamp = s.held === 'lamp' && mouse.inside && visible;
  const beam = root.querySelector('.lamp-beam');
  beam.classList.toggle('hidden', !lamp);
  root.classList.toggle('lamp-on', lamp);
  if (lamp) {
    const r = s.upgrades.work_light ? 200 : 120;
    beam.style.transform = `translate(${mouse.x - r}px, ${mouse.y - r}px)`;
    beam.style.width = beam.style.height = `${r * 2}px`;
    const lx = (mouse.x - L.car.x) / SC, lyy = (mouse.y - (CAR_TOP + ly)) / SC;
    lampEl.style.setProperty('--lx', `${(lx / 1000) * 100}%`);
    lampEl.style.setProperty('--ly', `${(lyy / 440) * 100}%`);
    lampEl.style.setProperty('--lr', `${r}px`);
  }
  if (visible && (s.garage > 0.02)) gSnow.step(dt);
}

export function resetBay() {
  anim = null; busy = null; lights = false;
  const s = S();
  if (!s) return;
  liftTarget = s.lift;
  dash?.classList.add('hidden'); engineBay?.classList.add('hidden'); popup?.classList.add('hidden'); meter?.classList.add('hidden');
  gDoor.style.transform = ''; gLight.style.opacity = 0; s.garage = 0;
  wrap.style.transform = '';
  renderAll();
  // Lagret midt i en innkjøring/utkjøring: fullfør i trygg rekkefølge
  if (s.phase === 'carIn') flow.carParked();
  if (s.phase === 'leaving' && s.job && !s.job.declined) startLeave();
}
export function closeBayPanels() {
  dash?.classList.add('hidden'); engineBay?.classList.add('hidden'); popup?.classList.add('hidden');
  if (lights) { lights = false; renderAll(); }
}
export function bayPanelOpen() { return dash && (!dash.classList.contains('hidden') || !engineBay.classList.contains('hidden')); }
