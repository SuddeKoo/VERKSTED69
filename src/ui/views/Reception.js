// SENTER – kundemottaket. Lag: bakgrunn → kunden → disken (SVG) → gjenstander på disken → boble/panel.
// Kunden går inn gjennom døra, forteller historien, får arbeidsordren og går. Kommer tilbake når bilen er ferdig.
import { G, S } from '../../game/state.js';
import { BG, RECEPTION as L } from '../layout.js';
import { counterSvg } from '../art/furniture.js';
import { PortraitView } from '../PortraitView.js';
import { Speech } from '../Speech.js';
import { CHAR_BY_ID } from '../../data/characters.js';
import { MODELS, COLOR_BY_ID } from '../../data/cars.js';
import { FAULTS } from '../../data/faults.js';
import { renderCar } from '../car/CarArt.js';
import * as flow from '../../game/flow.js';
import { openWorkOrder } from '../WorkOrder.js';
import { esc, kr } from '../../core/util.js';
import { Snow } from '../Snow.js';

let root, guests, speech, panel, guest = null, walkRaf = 0, snow, terminal, winCar, clip, keys;
const box = (r) => `left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px`;

export function mountReception(el) {
  root = el;
  el.innerHTML = `
    <img class="bg" src="${BG.reception}" alt="" draggable="false">
    ${L.lamps.map((l) => `<div class="lamp-glow" style="left:${l.x - 120}px;top:${l.y - 20}px;width:${l.w + 240}px;height:380px"></div>`).join('')}
    <canvas class="win-snow" style="${box(L.doorGlass)}"></canvas>
    <div class="door-draft" style="${box(L.door)}"></div>
    <div class="win-car" style="${box(L.window)}"></div>
    <div class="guests"></div>
    ${counterSvg()}
    <button class="prop clipboard" style="${box(L.clipboard)}" aria-label="Arbeidsordre"></button>
    <div class="prop decor keys hidden" style="${box(L.keyHook)}"></div>
    <button class="prop bell" style="${box(L.bell)}" aria-label="Ring på bjella"><svg viewBox="0 0 80 60"><ellipse cx="40" cy="54" rx="32" ry="6" fill="#2a2420" stroke="#1b120c" stroke-width="3"/><path d="M14,52 Q14,14 40,14 Q66,14 66,52 Z" fill="#c9a23a" stroke="#1b120c" stroke-width="4"/><path d="M24,30 q10,-10 22,-10" stroke="#f6dc84" stroke-width="4" fill="none"/><rect x="36" y="4" width="8" height="12" rx="3" fill="#7a6a3a" stroke="#1b120c" stroke-width="3"/></svg></button>
    <button class="prop terminal" style="${box(L.terminal)}" aria-label="Betalingsterminal"></button>
    <div class="prop decor mug hidden" style="${box(L.mug)}"><svg viewBox="0 0 70 84"><path class="steam" d="M22,20 q-6,-8 0,-16 M36,18 q-6,-8 0,-16" stroke="#ddd" stroke-width="3" fill="none" opacity=".6"/><rect x="10" y="26" width="42" height="52" rx="6" fill="#e9e2cc" stroke="#1b120c" stroke-width="4"/><path d="M52,38 q16,4 0,26" stroke="#1b120c" stroke-width="5" fill="none"/><ellipse cx="31" cy="30" rx="18" ry="4" fill="#3a2010"/></svg></div>
    <div class="boss-note" style="${box(L.note)}">Kunden forteller → GODTA. Bilen står i hallen (A A). Verktøy og deler (A). PC og lakk (D). Kall inn kunden når du er ferdig, ta betalt på terminalen. <b>– Kåre</b></div>
    <div class="bubble hidden" style="left:${L.speech.x}px;top:${L.speech.y}px;width:${L.speech.w}px"><div class="bubble-name"></div><div class="bubble-text"></div></div>
    <div class="desk-panel" style="left:${L.panel.x}px;top:${L.panel.y}px;width:${L.panel.w}px;max-height:${L.panel.h}px"></div>`;
  guests = el.querySelector('.guests');
  speech = new Speech(el.querySelector('.bubble'));
  panel = el.querySelector('.desk-panel');
  terminal = el.querySelector('.terminal');
  winCar = el.querySelector('.win-car');
  clip = el.querySelector('.clipboard');
  keys = el.querySelector('.keys');
  snow = new Snow(el.querySelector('.win-snow'), { count: 40, size: 0.8, alpha: 0.7, speed: 0.8 });

  clip.addEventListener('click', () => { G.audio?.play('paper', { volume: 0.6 }); openWorkOrder(); });
  el.querySelector('.bell').addEventListener('click', ringBell);
  terminal.addEventListener('click', () => { if (S().phase === 'pickup' && !S().job.paid && panel.dataset.pay) flow.takePayment(); else G.audio?.synth('beep_lo'); });
  panel.addEventListener('click', onPanel);
  guests.addEventListener('pointerdown', () => { if (speech.busy) speech.skip(); });

  G.bus.on('cust:arrive', (job) => enter(job, () => flow.atDesk()));
  G.bus.on('cust:talk', (lines) => {
    const job = S().job;
    speech.play(CHAR_BY_ID[job.charId].first, lines, guest?.pv, () => { job.heard = true; renderPanel(); });
    renderPanel();
  });
  G.bus.on('cust:say', ({ text, then }) => {
    const job = S().job;
    renderPanel();
    speech.say(CHAR_BY_ID[job.charId].first, text, guest?.pv, () => { if (then === 'leave') leave(() => { speech.hide(); flow.customerGone(); }); });
  });
  G.bus.on('cust:return', (job) => { renderPanel(); enter(job, () => flow.backAtDesk(), true); });
  G.bus.on('cust:pickup', ({ lines, result }) => {
    const mood = { great: 'happy', good: 'happy', ok: 'normal', bad: 'irritated', partial: 'irritated', angry: 'angry' }[result.mood] || 'normal';
    guest?.pv.setMood(mood);
    speech.play(CHAR_BY_ID[S().job.charId].first, lines, guest?.pv, () => { panel.dataset.pay = '1'; renderPanel(); });
    renderPanel();
  });
  for (const ev of ['job', 'car', 'money', 'upgrades', 'paint']) G.bus.on(ev, () => { renderPanel(); renderProps(); });
  G.bus.on('car', renderWindowCar);
  G.bus.on('ui:reset', resetReception);
}

function ringBell() {
  const s = S();
  G.audio?.synth('bell');
  const b = root.querySelector('.bell'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  if (s.phase === 'idle' && !s.dayClosed && !s.betweenDays) { s.nextIn = Math.min(s.nextIn, 0.6); }
}

// ───────── Kunden går ─────────
const W0 = L.guest.w, H0 = W0 * 1.3;
function place(el, p, bob = 0) {
  el.style.transform = `translate(${p.x - W0 / 2}px, ${p.bottom - H0 + bob}px) scale(${p.s ?? 1})`;
  el.style.filter = `brightness(${0.5 + 0.5 * (((p.s ?? 1) - L.enter.s) / (1 - L.enter.s))})`;
}
function walk(from, to, dur, done) {
  cancelAnimationFrame(walkRaf);
  const t0 = performance.now();
  let lastStep = 0;
  const step = (now) => {
    if (!guest) return;
    if (G.paused) { walkRaf = requestAnimationFrame(step); return; } // pause fryser gangen
    const k = Math.min(1, (now - t0) / (dur * 1000));
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const p = { x: from.x + (to.x - from.x) * e, bottom: from.bottom + (to.bottom - from.bottom) * e, s: (from.s ?? 1) + ((to.s ?? 1) - (from.s ?? 1)) * e };
    const ph = k * dur * 3.2;
    place(guest.el, p, Math.abs(Math.sin(ph * Math.PI)) * -9 * (1 - k * 0.6));
    if (Math.floor(ph) !== lastStep && k < 0.97) { lastStep = Math.floor(ph); G.audio?.play('step', { volume: 0.22 * (p.s ?? 1), gap: 0.2 }); }
    if (k < 1) walkRaf = requestAnimationFrame(step); else done?.();
  };
  walkRaf = requestAnimationFrame(step);
}
function moodFor(ch) {
  const t = ch.traits || {};
  if (t.nerv > 25) return 'nervous';
  if (t.irr > 30) return 'irritated';
  if (t.joy > 40) return 'happy';
  return 'normal';
}
function enter(job, done, returning = false) {
  removeGuest();
  const ch = CHAR_BY_ID[job.charId];
  const pv = new PortraitView(ch.id, { mood: returning ? 'normal' : moodFor(ch), cls: 'guest-pv' });
  const el = document.createElement('div');
  el.className = 'guest';
  el.style.width = `${W0}px`; el.style.height = `${H0}px`;
  el.appendChild(pv.el);
  guests.appendChild(el);
  guest = { el, pv };
  place(el, L.enter);
  doorOpen();
  G.audio?.vocal(ch, 'arrive');
  walk(L.enter, { x: L.guest.x, bottom: L.guest.bottom, s: 1 }, 1.7, done);
  renderPanel();
}
function leave(done) {
  if (!guest) { done?.(); return; }
  guest.el.classList.add('leaving');
  walk({ x: L.guest.x, bottom: L.guest.bottom, s: 1 }, L.enter, 1.5, () => {
    doorOpen();
    // Fjernes helt fra DOM og minne før neste kunde kan komme
    removeGuest();
    done?.();
  });
}
function removeGuest() {
  cancelAnimationFrame(walkRaf);
  if (guest) { guest.pv.destroy(); guest.el.remove(); guest = null; }
}
function doorOpen() {
  G.audio?.play('door', { volume: 0.55 });
  G.audio?.synth('bell', { volume: 0.35, delay: 0.15 });
  const d = root.querySelector('.door-draft');
  d.classList.remove('open'); void d.offsetWidth; d.classList.add('open');
}

// ───────── Panel på disken ─────────
function carLine(job) {
  const m = MODELS[job.car.model];
  return `${m.name} · ${COLOR_BY_ID[job.car.color].name} · ${job.car.year}`;
}
function renderPanel() {
  const s = S();
  if (!s || !panel) return;
  const job = s.job;
  let h = '';
  if (!job) {
    h = s.dayClosed ? `<div class="panel-head">STENGT</div><p class="panel-empty">Klokka er fem. Ingen flere kunder i dag.</p>`
      : `<div class="panel-head">MOTTAKET</div><p class="panel-empty">Ingen kunder akkurat nå.<br><small>Neste kommer snart. Ring på bjella for å rope inn neste.</small></p>`;
    delete panel.dataset.pay;
  } else if (s.phase === 'arriving') {
    h = `<div class="panel-head">KUNDE</div><p class="panel-empty">Noen kommer inn døra…</p>`;
  } else if (s.phase === 'talking') {
    const ch = CHAR_BY_ID[job.charId];
    const reported = job.faults.filter((f) => f.reported).length;
    h = `<div class="panel-head">NY ARBEIDSORDRE</div>
      <div class="panel-who">${esc(ch.name)}</div>
      <div class="panel-car">${esc(carLine(job))}</div>
      <div class="panel-hint">${reported} problem${reported === 1 ? '' : 'er'} nevnt. Se arbeidsordren for detaljer.</div>
      <div class="panel-opts">
        <button class="opt primary" data-a="accept" ${job.heard ? '' : 'disabled'}>GODTA OPPDRAGET</button>
        <button class="opt" data-a="order">Les arbeidsordren</button>
        <button class="opt" data-a="replay">Hør historien igjen</button>
        <button class="opt bad" data-a="decline" ${job.heard ? '' : 'disabled'}>Avslå</button>
      </div>`;
  } else if (s.phase === 'carIn') {
    h = `<div class="panel-head">BILEN KOMMER INN</div><p class="panel-empty">Porten går opp. Bilen kjører inn i hallen.<br><small>Hallen: trykk A to ganger.</small></p>`;
  } else if (s.phase === 'working') {
    const found = job.faults.filter((f) => f.found), fixed = job.faults.filter((f) => f.fixed);
    const anyFixed = fixed.length > 0;
    h = `<div class="panel-head">BILEN STÅR INNE</div>
      <div class="panel-car">${esc(carLine(job))}</div>
      <div class="panel-hint">${found.length} bekreftet · ${fixed.length} reparert${s.paint ? ' · lakkeres nå' : ''}</div>
      <div class="panel-opts">
        <button class="opt primary" data-a="call" ${s.paint ? 'disabled' : ''}>${anyFixed ? 'BILEN ER FERDIG – KALL INN KUNDEN' : 'KALL INN KUNDEN (ingenting gjort)'}</button>
        <button class="opt" data-a="order">Arbeidsordren</button>
      </div>`;
  } else if (s.phase === 'pickup') {
    const r = job.result;
    h = `<div class="panel-head">HENTING</div><div class="panel-who">${esc(CHAR_BY_ID[job.charId].name)}</div>
      ${panel.dataset.pay ? `<div class="pay-sum">${kr(r.total)}</div><div class="panel-hint">Ta betalt på terminalen ved siden av deg.</div><div class="panel-opts"><button class="opt primary" data-a="pay">TA BETALT</button></div>` : '<p class="panel-empty">Kunden ser på bilen…</p>'}`;
  } else {
    h = `<div class="panel-head">HA DET</div><p class="panel-empty">Kunden går ut. Bilen kjører straks.</p>`;
    delete panel.dataset.pay;
  }
  panel.innerHTML = h;
  terminal.classList.toggle('ready', s.phase === 'pickup' && !!panel.dataset.pay && !job?.paid);
  terminal.innerHTML = terminalSvg(s.phase === 'pickup' && panel.dataset.pay ? job.result.total : null);
}
function onPanel(e) {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  G.audio?.play('click');
  const a = b.dataset.a, job = S().job;
  if (a === 'accept') flow.accept();
  else if (a === 'decline') flow.decline();
  else if (a === 'order') openWorkOrder();
  else if (a === 'replay' && job?.lines) speech.play(CHAR_BY_ID[job.charId].first, job.lines, guest?.pv, () => renderPanel());
  else if (a === 'call') {
    if (!job.faults.some((f) => f.fixed) && !b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Sikker? Kunden betaler ingenting'; return; }
    flow.callCustomer();
  } else if (a === 'pay') flow.takePayment();
}

function terminalSvg(amount) {
  return `<svg viewBox="0 0 200 150"><rect x="20" y="30" width="160" height="112" rx="14" fill="#3a3d40" stroke="#1b120c" stroke-width="5"/><rect x="38" y="44" width="124" height="40" rx="4" fill="${amount != null ? '#1f3a24' : '#16211a'}" stroke="#1b120c" stroke-width="3"/>
    <text x="100" y="72" font-family="Special Elite, monospace" font-size="${amount != null ? 19 : 14}" fill="#7cff7a" text-anchor="middle">${amount != null ? kr(amount) : 'KLAR'}</text>
    ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${48 + c * 36}" y="${92 + r * 16}" width="28" height="11" rx="3" fill="#cfcdc6" stroke="#1b120c" stroke-width="1.5"/>`).join('')).join('')}
    <rect x="70" y="8" width="60" height="26" rx="4" fill="#efe9d6" stroke="#1b120c" stroke-width="3"/></svg>`;
}

function renderProps() {
  const s = S();
  if (!s) return;
  const job = s.job;
  keys.classList.toggle('hidden', !(job && job.accepted && ['working', 'carIn'].includes(s.phase)));
  keys.innerHTML = job ? `<svg viewBox="0 0 150 120"><circle cx="40" cy="40" r="22" fill="none" stroke="#c9a23a" stroke-width="7"/><rect x="58" y="34" width="70" height="14" rx="4" fill="#b8b6ae" stroke="#1b120c" stroke-width="3"/><path d="M100,48 l0,12 m14,-12 l0,8" stroke="#1b120c" stroke-width="5"/><rect x="18" y="66" width="84" height="38" rx="6" fill="#e9e2cc" stroke="#1b120c" stroke-width="3" transform="rotate(-8 60 85)"/><text x="58" y="92" font-family="Special Elite, monospace" font-size="14" text-anchor="middle" fill="#1b120c" transform="rotate(-8 60 85)">${esc(job.car.plate)}</text></svg>` : '';
  root.querySelector('.mug').classList.toggle('hidden', !s.upgrades.coffee);
  root.querySelector('.boss-note').classList.toggle('hidden', s.carsTotal >= 6);
  // Klemmebrettet viser kort status for oppdraget
  const lines = job ? job.faults.filter((f) => f.found).map((f) => `<li class="${f.fixed ? 'done' : ''}">${esc(FAULTS[f.id].name)}</li>`).join('') : '';
  clip.innerHTML = `<div class="clip-board"><div class="clip-head">ARBEIDSORDRE</div>${job ? `<div class="clip-car">${esc(MODELS[job.car.model].kind)} · ${esc(job.car.plate)}</div><ul>${lines || '<li class="muted">Ingen feil bekreftet ennå</li>'}</ul>` : '<div class="clip-car muted">Ingen bil inne</div>'}</div>`;
}

/** Bilen syns svakt gjennom vinduet inn mot hallen når den står der */
function renderWindowCar() {
  const s = S();
  const show = s?.job && ['working', 'pickup'].includes(s.phase);
  winCar.innerHTML = show ? `<div class="win-car-inner" style="transform:translateY(${-s.lift * 28}px)">${renderCar(s.job, {})}</div>` : '';
}

export function resetReception() {
  speech?.hide();
  removeGuest();
  delete panel?.dataset.pay;
  const s = S();
  if (!s) return;
  renderPanel(); renderProps(); renderWindowCar();
  // Gjenoppta en kunde som sto ved disken da spillet ble lagret
  if (s.job && s.phase === 'talking') {
    enterQuick(s.job);
    speech.play(CHAR_BY_ID[s.job.charId].first, s.job.lines || [], guest?.pv, () => { s.job.heard = true; renderPanel(); });
  } else if (s.job && s.phase === 'pickup') {
    enterQuick(s.job);
    flow.backAtDesk();
  }
}
function enterQuick(job) {
  removeGuest();
  const ch = CHAR_BY_ID[job.charId];
  const pv = new PortraitView(ch.id, { mood: moodFor(ch), cls: 'guest-pv' });
  const el = document.createElement('div');
  el.className = 'guest';
  el.style.width = `${W0}px`; el.style.height = `${H0}px`;
  el.appendChild(pv.el);
  guests.appendChild(el);
  guest = { el, pv };
  place(el, { x: L.guest.x, bottom: L.guest.bottom, s: 1 });
}

export function receptionFrame(dt, visible) {
  if (visible) snow?.step(dt);
}
