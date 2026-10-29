// Felles spilltilstand. Alle fire kameravinkler leser og skriver det samme objektet, så et hjul som er
// tatt av, et verktøy i hånda eller en bestilt del er det samme uansett hvor kameraet står.
import { Bus } from '../core/bus.js';
import { RNG } from '../core/rng.js';
import { PARTS, PART_IDS } from '../data/parts.js';

export const SAVE_VERSION = 2;
const KEY = 'verksted69.save';

export const G = {
  bus: new Bus(),
  rng: new RNG(),
  s: null,          // lagret tilstand (se newState)
  settings: null,
  audio: null,
  paused: true,
  view: 2,          // 0 bil · 1 verktøy · 2 mottak · 3 kontor
};
export const S = () => G.s;

export function newState(seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0) {
  const stock = {};
  for (const id of PART_IDS) stock[id] = PARTS[id].start;
  return {
    v: SAVE_VERSION,
    seed,
    day: 1,
    t: 0,                 // sekunder brukt av dagen (0–600)
    dayClosed: false,     // tida er ute: ingen nye kunder
    betweenDays: false,   // dagsrapporten vises
    money: 900,
    carsTotal: 0,         // reduseres aldri
    upgrades: {},
    stock,
    crate: {},            // deler i delekassa (tatt ut av hylla, ikke brukt ennå)
    held: null,           // verktøy i hånda
    cartTool: null,       // verktøy på verktøytralla (oppgradering)
    job: null,            // aktivt oppdrag (bare ett)
    phase: 'idle',        // idle | arriving | talking | carIn | working | pickup | leaving
    nextIn: 4,            // sekunder til neste kunde
    lift: 0,              // 0 nede – 1 oppe
    hood: false,          // panseret åpent
    garage: 0,            // 0 lukket – 1 åpen port
    paint: null,          // { t, dur, color } lakkering pågår
    paintLeft: 0,         // åpnet lakkboks (lakkblanderen bruker en halv boks per jobb)
    today: freshDay(),
    lastReport: null,
    recentChars: [],
    recentCombos: [],
    unlockedSeen: 0,      // hvor mange opplåsingssteg spilleren har fått beskjed om
    stats: { income: 0, expenses: 0, best: 0, perfect: 0, days: 0 },
  };
}

export function freshDay() {
  return { cars: 0, income: 0, expenses: 0, parts: 0, upgrades: 0, quality: [], declined: 0, found: 0, missed: 0, events: [] };
}

// ───────── Lagring ─────────
export function save() {
  if (!G.s) return;
  try { localStorage.setItem(KEY, JSON.stringify(G.s)); } catch { /* full eller privat modus */ }
}

export function hasSave() { return !!peekSave(); }

export function peekSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadSave() {
  const s = peekSave();
  if (!s) return false;
  G.s = s;
  G.rng = new RNG((s.seed + s.day * 7919 + Math.floor(s.t)) >>> 0);
  return true;
}

export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* */ } }

/** Gamle eller ødelagte lagringer repareres i stedet for å krasje spillet. */
function migrate(s) {
  if (!s || typeof s !== 'object' || typeof s.v !== 'number' || s.v > SAVE_VERSION) return null;
  const base = newState(s.seed || 1);
  const out = { ...base, ...s, v: SAVE_VERSION };
  out.stock = { ...base.stock };
  for (const id of PART_IDS) out.stock[id] = Math.max(0, Math.floor(+s.stock?.[id] || 0));
  out.crate = {};
  for (const [k, n] of Object.entries(s.crate || {})) if (PARTS[k] && n > 0) out.crate[k] = Math.floor(n);
  out.upgrades = typeof s.upgrades === 'object' && s.upgrades ? s.upgrades : {};
  out.today = { ...freshDay(), ...(s.today || {}) };
  out.stats = { ...base.stats, ...(s.stats || {}) };
  for (const k of ['money', 'carsTotal', 'day', 't']) if (!isFinite(out[k])) out[k] = base[k];
  out.carsTotal = Math.max(0, Math.floor(out.carsTotal));
  // Et oppdrag midt i en animasjon gjenopptas i en trygg fase
  if (out.job) {
    if (!out.job.car || !Array.isArray(out.job.faults)) { out.job = null; out.phase = 'idle'; }
    else if (out.phase === 'arriving' || out.phase === 'talking') out.phase = 'talking';
    else if (out.phase === 'carIn') out.phase = 'working';
    else if (out.phase === 'pickup' || out.phase === 'leaving') out.phase = 'pickup';
  } else out.phase = 'idle';
  if (out.paint && !out.job) out.paint = null;
  out.garage = 0;
  return out;
}

if (import.meta.env?.DEV) window.__G = G;
