// Hovedmeny: verkstedet utenfra (Higgsfield) med snø, lysflimmer i lampene, bil som passerer på veien og
// utendørs ambience. Pluss innstillinger, pause og dagsrapport. Ingen filmsekvenser: NYTT SPILL og
// FORTSETT går rett inn i kundemottaket.
import { G } from '../game/state.js';
import { BG } from './layout.js';
import { Snow } from './Snow.js';
import { PortraitView } from './PortraitView.js';
import { CHARACTERS } from '../data/characters.js';
import { hasSave, peekSave } from '../game/state.js';
import { saveSettings } from '../core/settings.js';
import { kr, esc, clockOf } from '../core/util.js';
import { toggleFullscreen } from './Hud.js';

let menu, snowA, snowB, layer, npcs = [];

export function mountMenu(screen, handlers) {
  menu = document.createElement('div');
  menu.className = 'menu';
  menu.innerHTML = `
    <div class="menu-layer"><img class="bg" src="${BG.menu}" alt="" draggable="false">
      <div class="glow-door"></div><div class="glow-sign"></div><div class="glow-lamp"></div><div class="car-lights"></div></div>
    <canvas class="snow-far" width="1600" height="900"></canvas>
    <div class="menu-npcs"></div>
    <canvas class="snow-near" width="1600" height="900"></canvas>
    <div class="menu-shade"></div>
    <div class="title"><span class="t-main">VERKSTED</span><span class="t-69">69</span></div>
    <div class="tagline">«Det e ikkje motoren. Det e aldri motoren.»</div>
    <div class="paper-note"><b>VERKSTED 69</b>Bilverksted ved riksveien. Én løftebukk, én PC og et pegboard. Åpent 07–17. Ingen timeavtale.</div>
    <div class="menu-buttons">
      <button class="mbtn" data-act="new"><b>NYTT SPILL</b><small>Første arbeidsdag. Nøklan ligg på disken.</small></button>
      <button class="mbtn" data-act="continue"><b>FORTSETT</b><small class="cont-sub"></small></button>
      <button class="mbtn" data-act="settings"><b>INNSTILLINGER</b><small>Lyd, teksthastighet, fullskjerm</small></button>
    </div>
    <div class="menu-foot">Et fiktivt, absurd spill. Alle personer, bilmerker og hendelser er oppdiktet. Lyder: NOX SOUND (CC0). Bakgrunner: Higgsfield. Ingen AI kjører i spillet.</div>
    <div class="click-hint">Klikk for lyd</div>
    <div class="confirm hidden"><div class="paper-panel"><h2>NYTT SPILL?</h2><p>Det finnes allerede et lagret verksted. Nytt spill sletter det.</p><div class="rep-btns"><button class="opt primary" data-c="yes">START PÅ NYTT</button><button class="opt" data-c="no">AVBRYT</button></div></div></div>`;
  screen.appendChild(menu);
  layer = menu.querySelector('.menu-layer');
  snowA = new Snow(menu.querySelector('.snow-far'), { count: 120, size: 0.7, alpha: 0.55, speed: 0.7 });
  snowB = new Snow(menu.querySelector('.snow-near'), { count: 40, size: 1.6, alpha: 0.8, speed: 1.3 });
  menu.querySelector('.menu-buttons').addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    G.audio?.unlock();
    G.audio?.play('click');
    if (b.dataset.act === 'new' && hasSave()) { menu.querySelector('.confirm').classList.remove('hidden'); return; }
    handlers[b.dataset.act]?.();
  });
  menu.querySelector('.confirm').addEventListener('click', (e) => {
    const c = e.target.closest('[data-c]');
    if (!c) return;
    G.audio?.play('click');
    menu.querySelector('.confirm').classList.add('hidden');
    if (c.dataset.c === 'yes') handlers.new();
  });
  menu.querySelectorAll('.mbtn').forEach((b) => b.addEventListener('pointerenter', () => G.audio?.synth('hover')));
  menu.addEventListener('pointermove', (e) => {
    const r = menu.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
    layer.style.transform = `scale(1.045) translate(${-nx * 14}px, ${-ny * 8}px)`;
    menu.querySelector('.menu-npcs').style.transform = `translate(${-nx * 26}px, ${-ny * 6}px)`;
  });
  menu.addEventListener('pointerdown', () => { G.audio?.unlock(); menu.querySelector('.click-hint')?.remove(); }, { once: true });
}

export function showMenu() {
  menu.classList.remove('hidden');
  layer.style.transform = 'scale(1.045)';
  const save = peekSave();
  const cont = menu.querySelector('[data-act="continue"]');
  cont.disabled = !save;
  menu.querySelector('.cont-sub').textContent = save
    ? `Dag ${save.day} · ${clockOf(save.t)} · ${kr(save.money)} · ${save.carsTotal} biler ferdig`
    : 'Ingen lagret arbeidsdag ennå';
  for (const p of npcs) p.destroy();
  npcs = [];
  const box = menu.querySelector('.menu-npcs');
  box.innerHTML = '';
  G.rng.pickN(CHARACTERS, 3).forEach((c, i) => {
    const p = new PortraitView(c.id, { mood: i === 1 ? 'happy' : 'normal', cls: `menu-npc n${i}` });
    box.appendChild(p.el);
    npcs.push(p);
  });
  G.audio?.setScene('outdoor');
}
export function hideMenu() {
  menu.classList.add('hidden');
  for (const p of npcs) p.destroy();
  npcs = [];
}
export const menuVisible = () => !menu.classList.contains('hidden');

let carT = 6, clankT = 14;
export function menuFrame(dt) {
  if (menu.classList.contains('hidden')) return;
  snowA.step(dt); snowB.step(dt);
  carT -= dt;
  if (carT < 0) { carT = 30 + Math.random() * 40; passCar(); }
  clankT -= dt;
  if (clankT < 0) { clankT = 20 + Math.random() * 30; G.audio?.synth(Math.random() < 0.5 ? 'clank' : 'hammer', { volume: 0.12, muffled: true }); }
}
function passCar() {
  const c = menu.querySelector('.car-lights');
  c.classList.remove('go'); void c.offsetWidth; c.classList.add('go');
  G.audio?.play(Math.random() < 0.3 ? 'truck_pass' : 'car_pass', { volume: 0.32, muffled: true });
}

// ───────── Innstillinger / pause / dagsrapport ─────────
// Pause og innstillinger er én menytilstand: innstillingene ERSTATTER pausemenyen (aldri to modaler oppå
// hverandre), og TILBAKE går dit de ble åpnet fra.
export function mountPanels(overlay, h) {
  const nav = { screen: null, from: null };
  const set = document.createElement('div');
  set.className = 'modal settings-modal hidden';
  overlay.appendChild(set);
  const renderSet = () => {
    const s = G.settings;
    const slider = (k, l) => `<label class="sl"><span>${l}</span><input type="range" min="0" max="1" step="0.05" value="${s[k]}" data-k="${k}"><em>${Math.round(s[k] * 100)}</em></label>`;
    const chips = (k, opts) => opts.map(([v, l]) => `<button class="chip ${s[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
    set.innerHTML = `<div class="paper-panel"><h2>INNSTILLINGER</h2>
      ${slider('master', 'Hovedvolum')}${slider('amb', 'Ambience')}${slider('sfx', 'Lydeffekter')}${slider('voice', 'Stemmelyder')}
      <div class="row"><span>Lyd</span>${chips('muted', [[false, 'På'], [true, 'Av (mute)']])}</div>
      <div class="row"><span>Teksthastighet</span>${chips('textSpeed', [['slow', 'Rolig'], ['normal', 'Normal'], ['fast', 'Rask'], ['instant', 'Med en gang']])}</div>
      <div class="row"><span>Flimring/blinking</span>${chips('flicker', [[true, 'På'], [false, 'Redusert']])}</div>
      <div class="row"><span>Risting</span>${chips('shake', [[true, 'På'], [false, 'Av']])}</div>
      <div class="row"><span>Hjelpetekster</span>${chips('hints', [[true, 'Vis'], [false, 'Skjul']])}</div>
      <div class="row"><span>Skjerm</span><button class="chip" data-fs="1">${document.fullscreenElement ? 'Avslutt fullskjerm' : 'Fullskjerm'}</button></div>
      <button class="opt primary" data-close>TILBAKE</button></div>`;
  };
  set.addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    G.settings[k] = +e.target.value;
    e.target.nextElementSibling.textContent = Math.round(G.settings[k] * 100);
    G.audio?.applyVolumes(); saveSettings(G.settings);
  });
  set.addEventListener('click', (e) => {
    const c = e.target.closest('[data-v]');
    if (c) {
      const k = c.dataset.k, raw = c.dataset.v;
      G.settings[k] = raw === 'true' ? true : raw === 'false' ? false : isNaN(+raw) ? raw : +raw;
      G.audio?.applyVolumes(); saveSettings(G.settings);
      document.body.classList.toggle('no-flicker', !G.settings.flicker);
      G.audio?.play('click', { volume: 0.4 });
      renderSet();
    }
    if (e.target.closest('[data-fs]')) { toggleFullscreen(); setTimeout(renderSet, 300); }
    if (e.target.closest('[data-close]') || e.target === set) back();
  });

  const pause = document.createElement('div');
  pause.className = 'modal pause-modal hidden';
  pause.innerHTML = `<div class="paper-panel"><h2>PAUSE</h2><p class="muted">Klokka står. Bilen står. Kunden står og ser på klokka.</p>
    <button class="opt primary" data-p="resume">FORTSETT</button>
    <button class="opt" data-p="settings">INNSTILLINGER</button>
    <button class="opt" data-p="menu">LAGRE OG GÅ TIL HOVEDMENYEN</button></div>`;
  overlay.appendChild(pause);
  pause.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]');
    if (b) { G.audio?.play('click'); h[b.dataset.p]?.(); } else if (e.target === pause) h.resume();
  });

  const rep = document.createElement('div');
  rep.className = 'modal report-modal hidden';
  overlay.appendChild(rep);
  rep.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { G.audio?.play('click'); h[b.dataset.r]?.(); } });

  const show = (screen) => {
    nav.screen = screen;
    pause.classList.toggle('hidden', screen !== 'pause');
    set.classList.toggle('hidden', screen !== 'settings');
  };
  function back() {
    if (nav.screen !== 'settings') return;
    show(nav.from === 'pause' ? 'pause' : null);
    G.audio?.play('click', { volume: 0.4 });
  }
  return {
    openSettings(from = 'main') { nav.from = from; renderSet(); show('settings'); },
    openPause() { nav.from = null; show('pause'); },
    closeAll() { nav.from = null; show(null); },
    back,
    screen: () => nav.screen,
    reportOpen: () => !rep.classList.contains('hidden'),
    showReport(r) {
      if (!r) { rep.classList.add('hidden'); return; }
      const net = r.income - r.expenses;
      rep.innerHTML = `<div class="paper-panel report"><h2>DAGSRAPPORT · DAG ${r.day}</h2>
        <table>
          <tr><td>Ferdige biler i dag</td><td>${r.cars}</td></tr>
          <tr><td>Inntekter</td><td>${kr(r.income)}</td></tr>
          <tr><td>Utgifter (deler ${kr(r.parts)}, oppgraderinger ${kr(r.upgrades)})</td><td>−${kr(r.expenses)}</td></tr>
          <tr><td>Netto</td><td class="${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}${kr(net)}</td></tr>
          <tr><td>Snitt reparasjonskvalitet</td><td>${r.quality || '—'}</td></tr>
          <tr><td>Ekstra feil funnet</td><td>${r.found}</td></tr>
          ${r.declined ? `<tr><td>Avslåtte oppdrag</td><td>${r.declined}</td></tr>` : ''}
          <tr><td>Kassa</td><td>${kr(r.money)}</td></tr>
          <tr><td>Ferdige biler totalt (permanent)</td><td>${r.carsTotal}</td></tr>
        </table>
        ${r.unlocks.length ? `<h3>Nytt på verkstedet</h3><ul>${r.unlocks.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : ''}
        ${r.nextUps.length ? `<h3>Oppgraderinger du har nok biler til</h3><ul>${r.nextUps.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : ''}
        <div class="rep-btns"><button class="opt primary" data-r="nextDay">NESTE ARBEIDSDAG</button><button class="opt" data-r="toMenu">LAGRE OG AVSLUTT</button></div></div>`;
      rep.classList.remove('hidden');
    },
  };
}
