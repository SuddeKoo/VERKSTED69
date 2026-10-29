// HUD: LED-klokke med dag og nedtelling, kasse, ferdige biler, kameraknapper (A/D), verktøy i hånda,
// delekassa og korte meldinger. Holdes diskret i hjørnene.
import { G, S } from '../game/state.js';
import { VIEWS } from './layout.js';
import { TOOLS, PARTS } from '../data/parts.js';
import { toolSvg, partSvg } from './icons.js';
import { hangTool } from '../game/workshop.js';
import { clockOf, mss, kr, esc, DAY_SECONDS } from '../core/util.js';

let hud, setView, curView = 2, lastClock = '';
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
const SEG_PATH = { a: 'M3,1 L19,1 L16,4 L6,4Z', b: 'M20,2 L20,16 L17,14 L17,5Z', c: 'M20,20 L20,34 L17,31 L17,22Z', d: 'M3,35 L19,35 L16,32 L6,32Z', e: 'M2,20 L2,34 L5,31 L5,22Z', f: 'M2,2 L2,16 L5,14 L5,5Z', g: 'M3,18 L6,16 L16,16 L19,18 L16,20 L6,20Z' };
const digit = (d) => `<svg class="seg" viewBox="0 0 22 36">${Object.entries(SEG_PATH).map(([k, p]) => `<path d="${p}" class="${SEG[d]?.includes(k) ? 'on' : ''}"/>`).join('')}</svg>`;

export function mountHud(overlay, onView) {
  setView = onView;
  hud = document.createElement('div');
  hud.className = 'hud hidden';
  hud.innerHTML = `
    <div class="hud-box"><div class="led"><div class="led-clock"></div><div class="led-day"></div></div>
      <div class="day-bar"><span></span></div>
      <div class="hud-row"><span class="money"></span><span class="cars" title="Ferdige biler totalt"></span></div></div>
    <div class="hud-tabs">${VIEWS.map((v, i) => `<button data-v="${i}" title="${esc(v.long)}">${v.name}</button>`).join('')}</div>
    <div class="hud-right"><button class="ind" data-h="order" title="Arbeidsordre">📋</button><button class="ind" data-h="fs" title="Fullskjerm">⛶</button><button class="ind" data-h="pause" title="Pause (Esc)">❚❚</button></div>
    <button class="edge edge-l" title="A / ←">‹</button><button class="edge edge-r" title="D / →">›</button>
    <div class="hand"></div>
    <div class="toasts"></div>`;
  overlay.appendChild(hud);
  hud.querySelector('.hud-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) setView(+b.dataset.v); });
  hud.querySelector('.edge-l').addEventListener('click', () => setView(curView - 1));
  hud.querySelector('.edge-r').addEventListener('click', () => setView(curView + 1));
  hud.querySelector('.hud-right').addEventListener('click', (e) => {
    const b = e.target.closest('[data-h]');
    if (!b) return;
    if (b.dataset.h === 'pause') G.bus.emit('ui:pause');
    if (b.dataset.h === 'fs') toggleFullscreen();
    if (b.dataset.h === 'order') G.bus.emit('ui:order');
  });
  hud.querySelector('.hand').addEventListener('click', (e) => {
    if (e.target.closest('[data-hang]')) hangTool();
  });
  for (const ev of ['money', 'held', 'stock', 'upgrades']) G.bus.on(ev, renderHud);
  G.bus.on('toast', ({ text, kind }) => toast(text, kind));
}

export function toggleFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  } catch { /* ikke støttet */ }
}

export function showHud(on) { hud.classList.toggle('hidden', !on); }
export function setHudView(v) {
  curView = v;
  hud.querySelectorAll('.hud-tabs button').forEach((b) => b.classList.toggle('on', +b.dataset.v === v));
  hud.querySelector('.edge-l').classList.toggle('hidden', v === 0);
  hud.querySelector('.edge-r').classList.toggle('hidden', v === VIEWS.length - 1);
  renderHud();
}

export function renderHud() {
  const s = S();
  if (!s || !hud) return;
  hud.querySelector('.money').textContent = kr(s.money);
  hud.querySelector('.cars').textContent = `🚗 ${s.carsTotal}`;
  const held = s.held;
  const crate = Object.entries(s.crate);
  hud.querySelector('.hand').innerHTML = `${held ? `<div class="hand-chip">${toolSvg(held, 'mini')}<span>${esc(TOOLS[held].name)}</span><button data-hang title="Henger verktøyet tilbake på veggen">Heng tilbake</button></div>` : '<div class="hand-chip empty">✋ Tom hånd</div>'}
    ${crate.length ? `<div class="crate-chip" title="Delekassa">${crate.map(([id, n]) => `<span>${partSvg(id)}${n > 1 ? `<b>${n}</b>` : ''}</span>`).join('')}</div>` : ''}`;
  hud.querySelector('.hand').title = crate.map(([id, n]) => `${n}× ${PARTS[id].name}`).join(', ');
}

/** Klokka oppdateres hvert bilde, men DOM røres bare når noe faktisk endres */
export function hudFrame() {
  const s = S();
  if (!s || !hud || hud.classList.contains('hidden')) return;
  const c = clockOf(s.t);
  const key = `${c}|${s.dayClosed}|${Math.ceil(DAY_SECONDS - s.t)}`;
  if (key === lastClock) return;
  lastClock = key;
  hud.querySelector('.led-clock').innerHTML = `${digit(+c[0])}${digit(+c[1])}<span class="colon">:</span>${digit(+c[3])}${digit(+c[4])}`;
  hud.querySelector('.led-day').innerHTML = `DAG ${s.day}<br>${s.dayClosed ? 'STENGT' : mss(DAY_SECONDS - s.t)}`;
  const bar = hud.querySelector('.day-bar span');
  bar.style.width = `${Math.min(100, (s.t / DAY_SECONDS) * 100)}%`;
  bar.classList.toggle('late', s.t > DAY_SECONDS * 0.85);
}

export function toast(text, kind = '') {
  if (!hud) return;
  const box = hud.querySelector('.toasts');
  while (box.children.length > 3) box.firstChild.remove();
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = text;
  box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 4600);
  setTimeout(() => t.remove(), 5200);
}
