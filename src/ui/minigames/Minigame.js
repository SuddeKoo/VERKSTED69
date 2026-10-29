// Ramme for reparasjonsminispillene: et nærbilde over bilkameraet med tittel, instruks, fremdrift og Avbryt.
// Hvert minispill er en modul som får en ctx og kaller ctx.done(kvalitet 0–3). Avbryt bruker ingen deler.
import { G, S } from '../../game/state.js';
import { FAULTS } from '../../data/faults.js';
import { TOOLS, PARTS } from '../../data/parts.js';
import { toolSvg } from '../icons.js';
import { esc } from '../../core/util.js';
import wheel from './wheel.js';
import balance from './balance.js';
import align from './align.js';
import battery from './battery.js';
import wires from './wires.js';
import bulb from './bulb.js';
import oil from './oil.js';
import filter from './filter.js';
import plugs from './plugs.js';
import brakes from './brakes.js';
import assembly from './assembly.js';
import tighten from './tighten.js';
import exhaust from './exhaust.js';
import dent from './dent.js';
import fit from './fit.js';
import scrub from './scrub.js';
import gauge from './gauge.js';

const MODULES = {
  wheel_swap: wheel, balance, align, battery, wires, bulb, oil, filter, plugs, brakes, tighten, exhaust, dent, fit, scrub,
  shock: (c) => assembly({ ...c, opts: { ...c.opts, kind: 'shock' } }),
  hanger: (c) => assembly({ ...c, opts: { ...c.opts, kind: 'hanger' } }),
  lamp_unit: (c) => fit({ ...c, opts: { ...c.opts, shape: 'headlamp' } }),
  wiper: (c) => fit({ ...c, opts: { ...c.opts, shape: 'wiper' } }),
  charge: (c) => gauge({ ...c, opts: { ...c.opts, kind: 'charge' } }),
  heat: (c) => gauge({ ...c, opts: { ...c.opts, kind: 'heat' } }),
};

let modal = null, cleanup = null, frameFns = new Set();

export function mountMinigames(overlay) {
  modal = document.createElement('div');
  modal.className = 'modal mg-modal hidden';
  overlay.appendChild(modal);
}
export const minigameOpen = () => modal && !modal.classList.contains('hidden');

export function startMinigame(fault, onDone) {
  const def = FAULTS[fault.id];
  const s = S();
  const up = s.upgrades;
  const mod = MODULES[def.mg];
  if (!mod) { console.warn('Mangler minispill', def.mg); onDone(2); return; }
  modal.innerHTML = `<div class="mg-frame">
    <div class="mg-head"><div class="mg-tool">${toolSvg(def.tool)}</div><div><h2>${esc(def.name)}</h2><div class="mg-sub">${esc(TOOLS[def.tool].name)}${def.part ? ` · ${esc(PARTS[def.part].name)}${def.qty > 1 ? ` ×${def.qty}` : ''}` : ''}${def.extra ? ` + ${esc(PARTS[def.extra].name.toLowerCase())}` : ''}</div></div>
      <div class="mg-steps"></div><button class="opt bad mg-cancel">AVBRYT (Esc)</button></div>
    <div class="mg-hint"></div>
    <div class="mg-stage"></div>
  </div>`;
  modal.classList.remove('hidden');
  const stage = modal.querySelector('.mg-stage');
  const hintEl = modal.querySelector('.mg-hint');
  const stepsEl = modal.querySelector('.mg-steps');
  let finished = false;
  const precision = 1 + (up.precision1 ? 0.3 : 0) + (up.precision2 ? 0.3 : 0);
  const ctx = {
    el: stage,
    fault, def, job: s.job, up,
    opts: { ...(def.mgOpts || {}) },
    precision,
    slow: up.precision2 ? 0.75 : 1,        // markører beveger seg saktere
    hold: up.fast_tools ? 0.6 : 1,          // hvor lenge du må holde inne
    audio: G.audio,
    hint(t) { hintEl.innerHTML = t; },
    steps(list, i) { stepsEl.innerHTML = list.map((l, k) => `<span class="${k < i ? 'done' : k === i ? 'now' : ''}">${esc(l)}</span>`).join('<i>›</i>'); },
    frame(fn) { frameFns.add(fn); return () => frameFns.delete(fn); },
    done(q) {
      if (finished) return;
      finished = true;
      q = Math.max(0, Math.min(3, Math.round(q)));
      const label = ['DÅRLIG', 'AKSEPTABELT', 'GODT', 'SVÆRT GODT'][q];
      stage.insertAdjacentHTML('beforeend', `<div class="mg-result q${q}"><b>${label}</b><span>${['Det holder… så vidt.', 'Greit nok.', 'Godt jobba.', 'Perfekt utført!'][q]}</span></div>`);
      G.audio?.synth(q >= 2 ? 'done' : q === 0 ? 'bad' : 'good');
      setTimeout(() => { close(); onDone(q); }, 1100);
    },
    mistake(text) {
      G.audio?.synth('wrong');
      const m = document.createElement('div');
      m.className = 'mg-oops'; m.textContent = text || 'Feil!';
      stage.appendChild(m); setTimeout(() => m.remove(), 1200);
      if (G.settings.shake) { stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
    },
  };
  modal.querySelector('.mg-cancel').onclick = () => { G.audio?.play('click'); close(); };
  if (!G.settings.hints) hintEl.classList.add('quiet');
  try { cleanup = mod(ctx) || null; } catch (e) { console.error(e); close(); onDone(1); }
}

export function closeMinigame() { close(); }
function close() {
  try { cleanup?.(); } catch (e) { console.error(e); }
  cleanup = null;
  frameFns.clear();
  modal?.classList.add('hidden');
  if (modal) modal.innerHTML = '';
}

export function minigameFrame(dt) {
  if (!minigameOpen() || G.paused) return;
  for (const fn of [...frameFns]) fn(dt);
}
