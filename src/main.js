// VERKSTED69 – oppstart: scene som skaleres til vinduet, fire kameravinkler (A/D), input og hovedsløyfe.
import '@fontsource/rubik-dirt/latin-400.css';
import '@fontsource/special-elite/latin-400.css';
import '@fontsource/patrick-hand/latin-400.css';
import '../styles/main.css';

import { G, S, newState, save, loadSave, clearSave } from './game/state.js';
import { RNG } from './core/rng.js';
import { loadSettings } from './core/settings.js';
import { Audio } from './audio/Audio.js';
import { svgDefs } from './ui/Portrait.js';
import { W, H, VIEWS, START_VIEW } from './ui/layout.js';
import { mountBay, bayFrame, closeBayPanels, bayPanelOpen } from './ui/views/Bay.js';
import { mountTools, toolsFrame } from './ui/views/Tools.js';
import { mountReception, receptionFrame } from './ui/views/Reception.js';
import { mountOffice, officeFrame } from './ui/views/Office.js';
import { mountWorkOrder, openWorkOrder, closeWorkOrder, isOpen as orderOpen } from './ui/WorkOrder.js';
import { mountPc, isPcOpen, closePc } from './ui/Pc.js';
import { mountMinigames, minigameOpen, minigameFrame, closeMinigame, startMinigame } from './ui/minigames/Minigame.js';
import { mountHud, showHud, setHudView, renderHud, hudFrame } from './ui/Hud.js';
import { mountMenu, showMenu, hideMenu, menuFrame, mountPanels } from './ui/Menu.js';
import * as flow from './game/flow.js';
import { tickPaint, toast } from './game/workshop.js';

// Bare for testing: ?raf=timer lar spillet gå videre i en skjult fane (nettleseren pauser ellers animasjonsrammer)
if (import.meta.env.DEV && location.search.includes('raf=timer')) {
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
}

G.settings = loadSettings();
G.audio = new Audio(G.settings);
document.body.classList.toggle('no-flicker', !G.settings.flicker);

// ───────────── DOM ─────────────
const app = document.getElementById('app');
app.innerHTML = `${svgDefs()}<div id="stage"><div id="world">${VIEWS.map((v, i) => `<div class="view v-${v.id}" style="left:${i * W}px"></div>`).join('')}</div><div id="screen"></div><div id="overlay"></div></div>`;
const stage = document.getElementById('stage');
const world = document.getElementById('world');
const overlay = document.getElementById('overlay');
const screen = document.getElementById('screen');
world.style.width = `${VIEWS.length * W}px`;
let scale = 1;
function fit() {
  scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', fit);
fit();

mountBay(world.querySelector('.v-bay'));
mountTools(world.querySelector('.v-tools'));
mountReception(world.querySelector('.v-reception'));
mountOffice(world.querySelector('.v-office'));
mountWorkOrder(overlay);
mountPc(overlay);
mountMinigames(overlay);

// ───────────── Kamera: fire vinkler på én akse, ingen wrap-around ─────────────
let view = START_VIEW;
function setView(v) {
  const s = S();
  if (!s || G.paused || minigameOpen()) return;
  const nv = Math.max(0, Math.min(VIEWS.length - 1, v));
  if (nv === view) return;
  if (orderOpen()) closeWorkOrder();
  if (isPcOpen()) closePc();
  closeBayPanels();
  view = nv;
  G.view = view;
  world.style.transform = `translateX(${-view * W}px)`;
  world.dataset.view = view;
  G.audio?.play('step', { volume: 0.14, rate: 1.15 });
  setHudView(view);
}
function snapView(v) {
  view = v; G.view = v;
  world.style.transition = 'none';
  world.style.transform = `translateX(${-view * W}px)`;
  void world.offsetWidth;
  world.style.transition = '';
  setHudView(view);
}
mountHud(overlay, setView);
G.bus.on('ui:order', () => openWorkOrder());

// ───────────── Skjermer ─────────────
let mode = 'menu';
const panels = mountPanels(overlay, {
  resume: () => setPause(false),
  settings: () => panels.openSettings('pause'),
  menu: () => { save(); setPause(false); toMenu(); },
  nextDay: () => { panels.showReport(null); flow.startNextDay(); renderHud(); toast(`Dag ${S().day}. Verkstedet åpner.`, 'good'); },
  toMenu: () => { panels.showReport(null); save(); toMenu(); },
});

mountMenu(screen, {
  new: () => {
    clearSave();
    G.s = newState();
    G.rng = new RNG(G.s.seed);
    save();
    enterGame();
    toast('Første arbeidsdag. Den første kunden kommer snart inn døra.', 'good');
  },
  continue: () => {
    if (!loadSave()) return;
    enterGame();
    if (S().betweenDays) panels.showReport(S().lastReport);
  },
  settings: () => panels.openSettings('main'),
});

function enterGame() {
  mode = 'game';
  G.paused = false;
  hideMenu();
  panels.closeAll();
  showHud(true);
  stage.classList.add('in-game');
  G.audio?.setScene('indoor', 1.5);
  G.audio?.play('door', { volume: 0.5 });
  G.bus.emit('ui:reset');
  snapView(START_VIEW); // alltid kundemottaket
  renderHud();
}

function toMenu() {
  mode = 'menu';
  G.paused = true;
  closeMinigame(); closeWorkOrder(); closePc(); closeBayPanels();
  G.audio?.stopSituation();
  showHud(false);
  stage.classList.remove('in-game');
  showMenu();
}

function setPause(on) {
  if (mode !== 'game') return;
  G.paused = on;
  if (on) { panels.openPause(); save(); G.audio?.stopSituation(); } else panels.closeAll();
}
G.bus.on('ui:pause', () => setPause(true));
G.bus.on('day:end', (r) => { closeMinigame(); closeWorkOrder(); closePc(); panels.showReport(r); });

// ───────────── Input ─────────────
window.addEventListener('keydown', (e) => {
  if (mode !== 'game') { if (e.key === 'Escape') panels.back(); return; }
  const k = e.key.toLowerCase();
  if (k === 'escape') {
    e.preventDefault();
    if (panels.screen() === 'settings') return panels.back();          // tilbake til pausemenyen
    if (panels.screen() === 'pause') return setPause(false);
    if (minigameOpen()) return closeMinigame();
    if (isPcOpen()) return closePc();
    if (orderOpen()) return closeWorkOrder();
    if (bayPanelOpen()) return closeBayPanels();
    if (panels.reportOpen()) return;
    return setPause(true);
  }
  if (G.paused || panels.reportOpen()) return;
  if (k === 'a' || k === 'arrowleft') setView(view - 1);
  if (k === 'd' || k === 'arrowright') setView(view + 1);
});
document.addEventListener('pointerdown', () => G.audio.unlock(), { once: true });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'game') { save(); if (!G.paused && !panels.reportOpen()) setPause(true); } });
window.addEventListener('pagehide', () => { if (mode === 'game') save(); });

// ───────────── Sjeldne bakgrunnslyder i verkstedet ─────────────
let nextAmbient = 20, saveT = 0;
function ambient(dt) {
  nextAmbient -= dt;
  if (nextAmbient > 0) return;
  nextAmbient = 30 + Math.random() * 50;
  const r = Math.random();
  if (r < 0.28) G.audio?.play(Math.random() < 0.3 ? 'truck_pass' : 'car_pass', { volume: 0.4, muffled: true });
  else if (r < 0.45) G.audio?.gust();
  else if (r < 0.58) G.audio?.synth('radiator', { volume: 0.5 });
  else if (r < 0.7) G.audio?.synth('drip', { volume: 0.6 });
  else if (r < 0.84 && G.settings.flicker) {
    G.audio?.synth('flicker', { volume: 0.6 });
    document.querySelectorAll('.lamp-glow').forEach((l) => { l.classList.remove('flick'); void l.offsetWidth; l.classList.add('flick'); });
  } else G.audio?.synth('clank', { volume: 0.15, muffled: true });
}

// ───────────── Sløyfe ─────────────
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (mode === 'game') {
    if (!G.paused) {
      flow.tick(dt);
      if (!S().betweenDays) tickPaint(dt);
      ambient(dt);
      saveT += dt;
      if (saveT > 20) { saveT = 0; save(); }
    }
    bayFrame(G.paused ? 0 : dt, view === 0);
    toolsFrame(dt, view === 1);
    receptionFrame(dt, view === 2);
    officeFrame(dt, view === 3);
    minigameFrame(dt);
    hudFrame();
  } else menuFrame(dt);
  requestAnimationFrame(frame);
}
showMenu();
requestAnimationFrame(frame);

// Testkrok i utviklingsmodus
if (import.meta.env.DEV) {
  Promise.all([import('./game/workshop.js'), import('./game/jobs.js')]).then(([workshop, jobs]) => {
    window.__v69 = { G, S, flow, workshop, jobs, setView, startMinigame, closeMinigame, get view() { return view; },
      skip(sec) { for (let i = 0; i < sec * 20; i++) flow.tick(0.05); },
      // Kjør hele bildeoppdateringen manuelt (for testing når nettleseren struper animasjonsrammer)
      step(sec) { for (let i = 0; i < sec * 20; i++) { flow.tick(0.05); tickPaint(0.05); bayFrame(0.05, view === 0); minigameFrame(0.05); } hudFrame(); } };
  });
}
