// Oppdragsgenerator, økonomi og vurdering. Alle feil på en bil bestemmes når oppdraget lages –
// ingenting dukker opp tilfeldig underveis. Generatoren tar hensyn til progresjon, opplåste feil,
// lager, biltype, kundens historie og variasjon fra tidligere oppdrag.
import { G, S } from './state.js';
import { FAULTS, unlockedFaults } from '../data/faults.js';
import { PARTS } from '../data/parts.js';
import { STORIES, STORY_IDS } from '../data/stories.js';
import { makeCar, COLORS, COLOR_BY_ID, EXTRA_PAINT } from '../data/cars.js';
import { CHARACTERS } from '../data/characters.js';
import { VOICES } from '../data/dialogue/voices.js';

export const QUALITY = [
  { name: 'Dårlig', mult: 0.6, cls: 'q0' },
  { name: 'Akseptabelt', mult: 0.85, cls: 'q1' },
  { name: 'Godt', mult: 1.0, cls: 'q2' },
  { name: 'Svært godt', mult: 1.15, cls: 'q3' },
];
export const WARRANTY_COST = 120; // dårlig arbeid koster litt garantiarbeid senere

// ───────── Lager og priser ─────────
export function capacity(s = S()) { return s.upgrades.shelf2 ? 16 : s.upgrades.shelf1 ? 10 : 6; }
export function partPrice(id, s = S()) {
  const d = s.upgrades.wholesale2 ? 0.7 : s.upgrades.wholesale ? 0.85 : 1;
  return Math.round(PARTS[id].price * d);
}
/** Hvor mange av en del finnes totalt (hylle + delekasse) */
export const haveTotal = (id, s = S()) => (s.stock[id] || 0) + (s.crate[id] || 0);

/** Pris kunden betaler for én feil, før kvalitet og kundens humør. */
export function faultValue(fid) {
  const f = FAULTS[fid];
  const qty = f.qty || 1;
  const part = f.part ? PARTS[f.part].price * 1.3 * qty : 0;
  const extra = f.extra ? PARTS[f.extra].price * 1.3 : 0;
  return Math.round(f.labour + part + extra);
}

// ───────── Generator ─────────
function difficulty(n) {
  return {
    pExtra: n < 3 ? 0 : Math.min(0.55, 0.1 + n * 0.014),
    pThird: n < 14 ? 0 : Math.min(0.3, (n - 14) * 0.012),
    pHidden: n < 4 ? 0 : Math.min(0.55, 0.15 + n * 0.012),
    pVague: Math.min(0.75, 0.2 + n * 0.018),
  };
}

function pickChar(rng, s) {
  const recent = new Set(s.recentChars.slice(-10));
  const pool = CHARACTERS.filter((c) => !recent.has(c.id));
  return rng.pick(pool.length ? pool : CHARACTERS);
}

/** Feil som kan brukes nå, med vekt. Nye feiltyper og enkle feil vektes opp tidlig. */
function weightOf(fid, s, poor) {
  const f = FAULTS[fid];
  let w = 1;
  if (s.carsTotal < 8 && f.diff > 1) w *= 0.4;
  if ((f.unlock || 0) >= s.carsTotal - 4 && (f.unlock || 0) > 0) w *= 2.2; // nettopp låst opp: møt den snart
  if (f.part && haveTotal(f.part, s) < (f.qty || 1)) w *= poor ? 0.05 : 0.45; // tomt på lager: litt sjeldnere
  if (poor && !f.part) w *= 3; // blakk: jobber uten deler hjelper deg videre
  if (f.cat === 'wash') w *= 0.8;
  return w;
}

export function generateJob(forceChar) {
  const s = S();
  const rng = G.rng;
  const n = s.carsTotal;
  const dif = difficulty(n);
  const unlocked = new Set(unlockedFaults(n, s.upgrades));
  // Spilleren må aldri bli sittende fast: blakk og tomt lager → jobber uten deler
  const poor = s.money < 350;
  const char = forceChar ? forceChar : pickChar(rng, s);
  const voice = VOICES[char.id] || {};

  let best = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    // Første bil i et nytt spill: en enkel, tydelig punktering
    const storyId = n === 0 && !s.job ? 'pulling' : rng.weighted(STORY_IDS.map((id) => [id, STORIES[id].weight * (voice.storyBias?.[id] || 1)]), (x) => x[1])[0];
    const story = STORIES[storyId];
    const expand = (list) => (list.includes('*') ? [...unlocked] : list.filter((f) => unlocked.has(f)));
    let mustPool = expand(story.must);
    if (n === 0 && !s.job) mustPool = ['flat_tire'];
    if (!mustPool.length) continue;
    const main = rng.weighted(mustPool.map((f) => [f, weightOf(f, s, poor)]), (x) => x[1])[0];
    const faults = [main];
    const addFrom = (pool) => {
      const cands = pool.filter((f) => !faults.includes(f) && !conflicts(f, faults));
      if (!cands.length) return null;
      const f = rng.weighted(cands.map((x) => [x, weightOf(x, s, poor)]), (x) => x[1])[0];
      faults.push(f);
      return f;
    };
    const hiddenSet = new Set();
    if (rng.chance(dif.pExtra)) {
      const hidden = rng.chance(dif.pHidden);
      const f = addFrom(hidden ? [...unlocked].filter((x) => !FAULTS[x].request) : (expand(story.may).length ? expand(story.may) : [...unlocked]));
      if (f && hidden && FAULTS[f].seen !== 'visible') hiddenSet.add(f);
    }
    if (rng.chance(dif.pThird)) {
      const f = addFrom([...unlocked].filter((x) => !FAULTS[x].request && FAULTS[x].seen !== 'visible'));
      if (f) hiddenSet.add(f);
    }
    const combo = [...faults].sort().join('+');
    best = { storyId, faults, hiddenSet, combo };
    if (!s.recentCombos.includes(combo)) break;
  }
  if (!best) best = { storyId: 'unknown', faults: ['wash_basic'], hiddenSet: new Set(), combo: 'wash_basic' };

  // Bilen. Noen historier passer bedre til noen biler (pickup i grøfta, varebil med slep …)
  const prefer = best.storyId === 'towing' ? rng.pick(['pickup', 'suv', 'van']) : best.storyId === 'camping' ? rng.pick(['van', 'wagon', 'suv']) : null;
  const car = makeCar(rng, prefer);
  const side = () => rng.pick(['F', 'R']);
  const knows = voice.knows ?? 0.5; // hvor ofte kunden vet nøyaktig hva som er galt

  const faults = best.faults.map((fid, i) => {
    const f = FAULTS[fid];
    const hidden = best.hiddenSet.has(fid);
    return {
      id: fid,
      wheel: f.zone === 'wheel' ? (f.mgOpts?.both ? 'B' : side()) : null,
      reported: !hidden,
      // Synlige skader og bestilte jobber beskrives med egne ord; ellers vet kunden det noen ganger nøyaktig
      exact: !hidden && !f.request && f.seen !== 'visible' && rng.chance(knows * (1 - dif.pVague * 0.6)),
      found: false,          // bekreftet av en inspeksjon
      foundBy: null,
      fixed: false,
      quality: null,
      prep: f.paintJob ? 0 : null, // lakkjobber: sliping først, så lakkering på PC-en
      main: i === 0,
    };
  });
  // Bilens synlige tilstand følger feilene (skitt, is …)
  if (faults.some((f) => ['wash_heavy', 'ditch_wash'].includes(f.id))) car.dirt = 0.9;
  else if (faults.some((f) => f.id === 'wash_basic')) car.dirt = 0.65;
  let wantColor = null;
  if (faults.some((f) => f.id === 'cosmetic')) {
    const opts = COLORS.filter((c) => c.paint || (s.upgrades.paint_colors && EXTRA_PAINT.includes(c.id))).filter((c) => c.id !== car.color);
    wantColor = rng.pick(opts).id;
  }

  s.recentChars.push(char.id); if (s.recentChars.length > 14) s.recentChars.shift();
  s.recentCombos.push(best.combo); if (s.recentCombos.length > 8) s.recentCombos.shift();

  return {
    id: `j${s.day}_${Date.now().toString(36)}`,
    charId: char.id,
    story: best.storyId,
    car,
    faults,
    wantColor,
    tests: {},             // inspeksjoner som er gjort: { 'spin:F': true, engine: true, … }
    lines: null,           // ankomstreplikker (lagres så lasting viser det samme)
    accepted: false,
    payment: null,
    started: S().t,
  };
}

/** To feil som ikke gir mening sammen (samme hjul byttet to ganger osv.) */
function conflicts(fid, list) {
  const pairs = [['flat_tire', 'worn_tire'], ['dead_battery', 'weak_battery'], ['misfire', 'worn_plugs'], ['wash_basic', 'wash_heavy'], ['wash_basic', 'ditch_wash'], ['wash_heavy', 'ditch_wash'], ['worn_brakes', 'brake_noise'], ['exhaust_damaged', 'exhaust_noise'], ['paint_damage', 'cosmetic'], ['oil_service', 'low_oil'], ['tire_season', 'worn_tire'], ['tire_season', 'flat_tire'], ['cold_start', 'dead_battery'], ['cold_start', 'weak_battery'], ['dent', 'door_panel'], ['polish', 'cosmetic']];
  return list.some((o) => pairs.some(([a, b]) => (a === fid && b === o) || (b === fid && a === o)));
}

// ───────── Vurdering og betaling ─────────
export function evaluate(job) {
  const s = S();
  const voice = VOICES[job.charId] || {};
  let total = 0, warranty = 0;
  const fixed = job.faults.filter((f) => f.fixed);
  const missedReported = job.faults.filter((f) => f.reported && !f.fixed);
  const extraFixed = job.faults.filter((f) => !f.reported && f.fixed);
  const missedHidden = job.faults.filter((f) => !f.reported && !f.found);
  for (const f of fixed) {
    let v = faultValue(f.id) * QUALITY[f.quality].mult;
    if (FAULTS[f.id].paintJob && job.wantColor && job.car.color === job.wantColor && s.upgrades.paint_colors) v *= 1.2;
    total += v;
    if (f.quality === 0) warranty += WARRANTY_COST;
  }
  let mult = voice.pay ?? 1;
  if (s.upgrades.coffee) mult += 0.06;
  if (s.upgrades.sign) mult += 0.1;
  if (missedReported.length) mult -= 0.12 * missedReported.length;
  total = Math.max(0, Math.round(total * mult / 10) * 10);
  const avgQ = fixed.length ? fixed.reduce((a, f) => a + f.quality, 0) / fixed.length : 0;
  let mood = 'ok';
  if (!fixed.length || missedReported.length >= Math.max(1, job.faults.filter((f) => f.reported).length)) mood = 'angry';
  else if (missedReported.length) mood = 'partial';
  else if (avgQ >= 2.5) mood = 'great';
  else if (avgQ >= 1.5) mood = 'good';
  else if (avgQ < 0.8) mood = 'bad';
  return { total, warranty, avgQ, mood, fixed: fixed.length, missedReported: missedReported.length, extraFixed: extraFixed.length, missedHidden: missedHidden.length };
}

/** Hvilke deler kreves for å reparere en feil */
export function partsFor(fault) {
  const f = FAULTS[fault.id];
  const need = {};
  if (f.part) need[f.part] = (need[f.part] || 0) + (f.qty || 1);
  if (f.extra) need[f.extra] = (need[f.extra] || 0) + 1;
  if (f.paintJob) delete need.paint; // lakken brukes i lakkboksen, ikke ved sliping
  return need;
}

export function colorName(id) { return COLOR_BY_ID[id]?.name || id; }
