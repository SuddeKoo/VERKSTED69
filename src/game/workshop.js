// Verkstedlogikk: inspeksjoner, delekasse, reparasjoner, lager, oppgraderinger og lakkering.
// Ren spilltilstand – UI-et lytter på bussen (G.bus) og tegner det som endres.
import { G, S, save } from './state.js';
import { FAULTS } from '../data/faults.js';
import { PARTS, TOOLS } from '../data/parts.js';
import { UPGRADE_BY_ID, canBuy } from '../data/upgrades.js';
import { capacity, partPrice, partsFor, QUALITY } from './jobs.js';
import { COLOR_BY_ID } from '../data/cars.js';

const emit = (e, d) => G.bus.emit(e, d);
export const toast = (text, kind = '') => emit('toast', { text, kind });

// ───────── Verktøy ─────────
export function toolAvailable(id, s = S()) {
  const t = TOOLS[id];
  if (t.unlockCars && s.carsTotal < t.unlockCars) return false;
  if (t.unlockUpgrade && !s.upgrades[t.unlockUpgrade]) return false;
  return true;
}
export function pickTool(id) {
  const s = S();
  if (!toolAvailable(id)) return toast('Det verktøyet er ikke låst opp ennå.', 'warn');
  if (s.held === id) return;
  s.held = id;
  if (s.cartTool === id) s.cartTool = null;
  G.audio?.play('pickup', { volume: 0.7 }); G.audio?.synth('clank', { volume: 0.5 });
  emit('held');
}
export function hangTool() {
  const s = S();
  if (!s.held) return;
  s.held = null;
  G.audio?.synth('tool_hang');
  emit('held');
}
/** Verktøytralla ved bilen (oppgradering): bytt verktøy i hånda med verktøyet på tralla */
export function swapCart() {
  const s = S();
  if (!s.upgrades.tool_cart) return;
  [s.held, s.cartTool] = [s.cartTool, s.held];
  G.audio?.synth('clank', { volume: 0.6 });
  emit('held');
}

// ───────── Delekassa ─────────
export function crateCount(s = S()) { return Object.values(s.crate).reduce((a, b) => a + b, 0); }
export const CRATE_MAX = 6;
export function takePart(id) {
  const s = S();
  if ((s.stock[id] || 0) <= 0) { G.audio?.synth('wrong'); return toast(`Tomt for ${PARTS[id].name.toLowerCase()}. Bestill på PC-en på kontoret (D).`, 'warn'); }
  if (crateCount() >= CRATE_MAX) { G.audio?.synth('wrong'); return toast('Delekassa er full. Legg noe tilbake først.', 'warn'); }
  s.stock[id]--; s.crate[id] = (s.crate[id] || 0) + 1;
  G.audio?.play('box', { volume: 0.5 }); G.audio?.play('part_drop', { volume: 0.5, delay: 0.12 });
  emit('stock');
}
export function returnPart(id) {
  const s = S();
  if (!s.crate[id]) return;
  s.crate[id]--; if (!s.crate[id]) delete s.crate[id];
  s.stock[id] = (s.stock[id] || 0) + 1;
  G.audio?.play('put', { volume: 0.5 });
  emit('stock');
}
/** Ubrukte deler går tilbake på hylla når bilen har kjørt */
export function emptyCrate() {
  const s = S();
  for (const [id, n] of Object.entries(s.crate)) s.stock[id] = (s.stock[id] || 0) + n;
  s.crate = {};
  emit('stock');
}

// ───────── Inspeksjoner ─────────
/**
 * Kjør en test på bilen. where: { zone, wheel } for tester som gjelder ett område.
 * Returnerer funnede feil (nye) med forklaringen spilleren får.
 */
export function inspect(test, where = {}) {
  const s = S(), job = s.job;
  if (!job) return [];
  const found = [];
  const up = s.upgrades;
  for (const f of job.faults) {
    if (f.found || f.fixed) continue;
    const def = FAULTS[f.id];
    let why = def.tests[test];
    // Oppgraderinger som gir testene mer kraft
    if (!why && test === 'engine' && up.sniffer && (def.tests.under || def.zone === 'exhaust')) why = def.tests.under || def.tests.look;
    if (!why && test === 'spin' && up.vib_meter && def.zone === 'under' && def.tests.under) why = `Vibrasjonsmåleren fanger opp slark i understellet: ${def.tests.under.toLowerCase()}`;
    if (!why) continue;
    if (test === 'scanner' && !up.scanner2 && !['elec', 'engine'].includes(def.cat)) continue;
    if (test === 'scanner' && !up.scanner2 && ['misfire', 'wiring_fault'].includes(f.id)) continue;
    // Områdetester gjelder bare området du sjekket
    if (where.zone) {
      const z = def.zone;
      if (where.zone === 'wheel' && (z !== 'wheel' || (f.wheel !== 'B' && f.wheel !== where.wheel)) && !(test === 'spin' && up.vib_meter && z === 'under')) continue;
      if (where.zone !== 'wheel' && test !== 'under' && !zoneMatch(where.zone, z) && !(test === 'look' && z === 'body')) continue;
      if (test === 'under' && !['under', 'exhaust'].includes(z) && !def.tests.under) continue;
    }
    f.found = true; f.foundBy = test;
    found.push({ fault: f, why });
  }
  job.tests[testKey(test, where)] = true;
  if (found.length) {
    s.today.found += found.filter((x) => !x.fault.reported).length;
    G.audio?.synth('good', { volume: 0.7 });
    emit('job');
  }
  return found;
}
export const testKey = (test, where = {}) => `${test}${where.zone ? ':' + where.zone : ''}${where.wheel ? ':' + where.wheel : ''}`;

/** Klikkede områder på bilen og hvilke feilsoner de dekker */
export function zoneMatch(clicked, faultZone) {
  if (clicked === faultZone) return true;
  const groups = { body: ['body', 'door', 'bumperF', 'bumperR', 'glass', 'lock'], door: ['door', 'lock'], bumperF: ['bumperF'], hood: ['hood'], under: ['under', 'exhaust'], exhaust: ['exhaust', 'under'] };
  return (groups[clicked] || []).includes(faultZone);
}

// ───────── Reparasjon ─────────
/** Kan feilen repareres nå med det du har? */
export function repairCheck(f) {
  const s = S();
  const def = FAULTS[f.id];
  if (f.fixed) return { ok: false, why: 'Allerede reparert.' };
  if (!f.found) return { ok: false, why: 'Du vet ikke hva som er galt her ennå. Undersøk først.' };
  if (f.prep != null && f.prep > 0 && def.paintJob) return { ok: false, why: 'Slipt og klar. Start lakkeringen på PC-en på kontoret (D).' };
  if (s.held !== def.tool) return { ok: false, why: `Dette trenger ${TOOLS[def.tool].name.toLowerCase()}. Hent det på verktøyveggen (D).`, tool: def.tool };
  const needsLift = def.zone === 'wheel' || def.zone === 'under' || def.zone === 'exhaust';
  if (needsLift && s.lift < 0.99) return { ok: false, why: 'Løft bilen først (knappen på løftebukken).' };
  if (def.zone === 'hood' && !s.hood) return { ok: false, why: 'Åpne panseret først (klikk på panseret med tom hånd).' };
  for (const [pid, n] of Object.entries(partsFor(f))) {
    if ((s.crate[pid] || 0) < n) {
      const inStock = s.stock[pid] || 0;
      return { ok: false, why: inStock >= n - (s.crate[pid] || 0) ? `Du trenger ${n > 1 ? n + ' × ' : ''}${PARTS[pid].name.toLowerCase()} i delekassa. Hent på arbeidsbenken (D).` : `Tomt for ${PARTS[pid].name.toLowerCase()} på lager. Bestill på PC-en (kontoret).`, part: pid };
    }
  }
  return { ok: true };
}

/** Minispillet er ferdig. quality 0–3. */
export function completeRepair(f, quality) {
  const s = S();
  const def = FAULTS[f.id];
  let q = Math.max(0, Math.min(3, Math.round(quality)));
  if (def.cat === 'wash' && s.upgrades.wax && !def.paintJob) q = Math.min(3, q + 1);
  for (const [pid, n] of Object.entries(partsFor(f))) {
    s.crate[pid] -= n; if (s.crate[pid] <= 0) delete s.crate[pid];
  }
  if (def.paintJob) {
    f.prep = Math.max(1, q); // slipt – lakkeres på PC-en
    toast(`Slipt og maskert (${QUALITY[q].name.toLowerCase()}). Gå til kontoret og start lakkeringen.`, 'good');
  } else {
    f.fixed = true; f.quality = q;
    if (f.id === 'wash_basic' || f.id === 'wash_heavy' || f.id === 'ditch_wash') s.job.car.dirt = Math.max(0, 0.05 + (3 - q) * 0.05);
    toast(`${def.name}: ${QUALITY[q].name.toLowerCase()} resultat.`, q >= 2 ? 'good' : q === 0 ? 'problem' : '');
    G.audio?.synth('done');
  }
  emit('stock'); emit('job'); emit('car');
  save();
}

// ───────── Lager og PC ─────────
export function buyPart(id, qty = 1) {
  const s = S();
  const cap = capacity();
  const room = cap - (s.stock[id] || 0) - (s.crate[id] || 0);
  qty = Math.min(qty, room);
  if (qty <= 0) { G.audio?.synth('wrong'); return toast(`Hylla for ${PARTS[id].name.toLowerCase()} er full (${cap}).`, 'warn'); }
  const cost = partPrice(id) * qty;
  if (s.money < cost) { G.audio?.synth('wrong'); return toast('Ikke nok penger.', 'warn'); }
  s.money -= cost; s.today.expenses += cost; s.today.parts += cost; s.stats.expenses += cost;
  s.stock[id] = (s.stock[id] || 0) + qty;
  G.audio?.synth('deliver'); G.audio?.play('part_drop', { volume: 0.6, delay: 0.2 });
  emit('stock'); emit('money');
  toast(`Levert: ${qty} × ${PARTS[id].name.toLowerCase()} (−${cost} kr)`, 'good');
  save();
}

export function buyUpgrade(id) {
  const s = S();
  const u = UPGRADE_BY_ID[id];
  const c = canBuy(u, s);
  if (!c.ok) { G.audio?.synth('wrong'); return toast(c.why, 'warn'); }
  s.money -= u.price; // antall ferdige biler røres ikke – det er et permanent krav
  s.today.expenses += u.price; s.today.upgrades += u.price; s.stats.expenses += u.price;
  s.upgrades[id] = true;
  G.audio?.synth('upgrade');
  emit('money'); emit('upgrades'); emit('stock'); emit('held');
  toast(`Oppgradert: ${u.name}!`, 'good');
  save();
}

// ───────── Lakkering (halvautomatisk) ─────────
export function paintFault(job = S().job) {
  return job?.faults.find((f) => FAULTS[f.id].paintJob && !f.fixed && f.prep > 0);
}
export function paintDuration() { return S().upgrades.paint_speed ? 9 : 18; }
export function startPaint(colorId) {
  const s = S();
  const f = paintFault();
  if (!f || s.paint) return;
  const needTin = s.upgrades.paint_mixer ? 0.5 : 1;
  if ((s.stock.paint || 0) + (s.paintLeft || 0) < needTin) { G.audio?.synth('wrong'); return toast('Tomt for lakk. Bestill en boks på LAGER-fanen.', 'warn'); }
  // Halv boks igjen etter lakkblanderen
  if (s.paintLeft >= needTin) s.paintLeft -= needTin;
  else { s.stock.paint--; s.paintLeft = (s.paintLeft || 0) + 1 - needTin; }
  s.paint = { t: 0, dur: paintDuration(), color: f.id === 'paint_damage' ? s.job.car.color : colorId, pressure: 0.5, good: 0, total: 0 };
  G.audio?.play('booth_fan', { volume: 0.6 });
  emit('paint'); emit('stock');
}
/** Kalles hvert bilde mens lakkeringen går. Trykket må holdes i det grønne for best resultat. */
export function tickPaint(dt) {
  const s = S();
  const p = s.paint;
  if (!p) return;
  p.t += dt;
  p.pressure += (Math.sin(p.t * 1.7) * 0.25 + (Math.random() - 0.5) * 0.6) * dt;
  p.pressure = Math.max(0, Math.min(1, p.pressure));
  p.total += dt; if (Math.abs(p.pressure - 0.5) < 0.17) p.good += dt;
  if (Math.random() < dt * 2.2) G.audio?.synth('spray', { volume: 0.5 });
  if (p.t >= p.dur) finishPaint();
}
export function nudgePressure(d) { if (S().paint) { S().paint.pressure = Math.max(0, Math.min(1, S().paint.pressure + d)); G.audio?.synth('tick'); } }
function finishPaint() {
  const s = S();
  const p = s.paint;
  const f = paintFault();
  s.paint = null;
  if (!f) return emit('paint');
  const steady = p.total ? p.good / p.total : 0.5;
  let q = Math.round(f.prep * 0.5 + steady * 2.2);
  if (s.upgrades.paint_clear) q++;
  q = Math.max(0, Math.min(3, q));
  s.job.car.color = p.color;
  f.fixed = true; f.quality = q;
  G.audio?.synth('done');
  toast(`Lakkert ${COLOR_BY_ID[p.color]?.name || ''}: ${QUALITY[q].name.toLowerCase()} resultat.`, q >= 2 ? 'good' : '');
  emit('paint'); emit('job'); emit('car');
  save();
}
