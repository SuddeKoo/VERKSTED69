// Kundeflyt og arbeidsdag. Én kunde og én bil om gangen:
// idle → arriving → talking → (godta) carIn → working → (ferdig) pickup → leaving → idle
// Neste kunde går ikke inn før forrige har gått ut og bilen har kjørt (animasjonene bekrefter det).
import { G, S, save, freshDay } from './state.js';
import { generateJob, evaluate, QUALITY } from './jobs.js';
import { arrivalLines, acceptLine, backLine, pickupLines, byeLine, declineLine } from '../data/dialogue/voices.js';
import { emptyCrate, toast } from './workshop.js';
import { UNLOCK_STEPS } from '../data/faults.js';
import { UPGRADES, canBuy } from '../data/upgrades.js';
import { DAY_SECONDS } from '../core/util.js';
import { CHAR_BY_ID } from '../data/characters.js';

const emit = (e, d) => G.bus.emit(e, d);

export function tick(dt) {
  const s = S();
  if (!s || G.paused || s.betweenDays) return;
  s.t += dt;
  if (!s.dayClosed && s.t >= DAY_SECONDS) {
    s.dayClosed = true;
    toast(s.job ? 'Klokka er fem. Gjør ferdig bilen du har inne – det kommer ingen flere i dag.' : 'Klokka er fem. Verkstedet stenger.', 'warn');
    G.audio?.synth('bell', { volume: 0.5 });
    emit('clock');
  }
  if (s.phase === 'idle') {
    if (s.dayClosed) return endDay();
    s.nextIn -= dt;
    if (s.nextIn <= 0) arrive();
  }
}

// ───────── Ankomst ─────────
function arrive() {
  const s = S();
  s.job = generateJob();
  s.phase = 'arriving';
  emit('cust:arrive', s.job);
  save();
}
/** Kunden står ved disken (animasjonen er ferdig) */
export function atDesk() {
  const s = S();
  if (s.phase !== 'arriving' && s.phase !== 'talking') return;
  s.phase = 'talking';
  if (!s.job.lines) s.job.lines = arrivalLines(s.job, G.rng);
  emit('cust:talk', s.job.lines);
  G.audio?.vocal(CHAR_BY_ID[s.job.charId], 'arrive');
  save();
}

export function accept() {
  const s = S();
  if (s.phase !== 'talking') return;
  s.job.accepted = true;
  s.phase = 'carIn';
  emit('cust:say', { text: acceptLine(s.job, G.rng), then: 'leave' });
  G.audio?.play('keys', { volume: 0.8, delay: 0.3 });
  save();
}
export function decline() {
  const s = S();
  if (s.phase !== 'talking') return;
  s.today.declined++;
  s.phase = 'leaving';
  s.job.declined = true;
  emit('cust:say', { text: declineLine(s.job, G.rng), then: 'leave' });
  G.audio?.vocal(CHAR_BY_ID[s.job.charId], 'deny');
}

/** Kunden har gått ut av mottaket */
export function customerGone() {
  const s = S();
  if (s.phase === 'carIn') emit('car:arrive', s.job);              // bilen kjører inn gjennom porten
  else if (s.phase === 'leaving' && s.job?.declined) finishJob();  // avslått: ingen bil
  else if (s.phase === 'leaving') emit('car:leave', s.job);        // betalt: bilen kjører ut
}
/** Bilen står på plass og porten er lukket */
export function carParked() {
  const s = S();
  if (s.phase !== 'carIn') return;
  s.phase = 'working';
  toast(G.view === 0 ? 'Bilen står på plass. Undersøk den: klikk med tom hånd, lampe eller diagnoseverktøy.' : `Bilen står på løftebukken. Trykk A ${G.view === 1 ? 'én gang' : G.view === 2 ? 'to ganger' : 'tre ganger'} for å gå dit.`, '');
  emit('job');
  save();
}

// ───────── Henting og betaling ─────────
export function callCustomer() {
  const s = S();
  if (s.phase !== 'working' || s.paint) return;
  s.phase = 'pickup';
  s.lift = 0; s.hood = false;
  s.job.result = evaluate(s.job);
  emit('car'); emit('lift');
  emit('cust:return', s.job);
  save();
}
/** Kunden er tilbake ved disken */
export function backAtDesk() {
  const s = S();
  const r = s.job.result;
  const lines = [backLine(s.job, G.rng), ...pickupLines(s.job, r, G.rng)];
  emit('cust:pickup', { lines, result: r });
  const moodVoc = r.mood === 'great' || r.mood === 'good' ? 'approve' : r.mood === 'ok' ? 'talk' : 'deny';
  G.audio?.vocal(CHAR_BY_ID[s.job.charId], moodVoc);
}
/** Spilleren tar betalt på terminalen */
export function takePayment() {
  const s = S();
  if (s.phase !== 'pickup' || s.job.paid) return;
  const r = s.job.result;
  s.job.paid = true;
  s.money += r.total - r.warranty;
  s.today.income += r.total; s.today.expenses += r.warranty;
  s.stats.income += r.total;
  s.today.cars++; s.carsTotal++;          // permanent progresjon
  s.today.quality.push(r.avgQ);
  s.today.missed += r.missedHidden;
  s.stats.best = Math.max(s.stats.best, r.total);
  if (r.avgQ >= 2.9) s.stats.perfect++;
  G.audio?.synth('register');
  emit('money');
  if (r.warranty) toast(`Garantiarbeid etter dårlig utført jobb: −${r.warranty} kr`, 'problem');
  const step = UNLOCK_STEPS.find((u) => u.at === s.carsTotal && u.at > 0);
  if (step) { toast(`Nytt på verkstedet: ${step.text}.`, 'good'); G.audio?.synth('unlock', { delay: 0.6 }); }
  const affordable = UPGRADES.find((u) => u.cars === s.carsTotal);
  if (affordable) toast(`Ny oppgradering på PC-en: ${affordable.name}`, '');
  s.phase = 'leaving';
  emit('cust:say', { text: byeLine(s.job, G.rng), then: 'leave' });
  save();
}

/** Bilen har kjørt ut og porten er lukket */
export function carGone() { finishJob(); }

function finishJob() {
  const s = S();
  s.job = null;
  s.phase = 'idle';
  s.paint = null;
  s.lift = 0; s.hood = false;
  emptyCrate();
  s.nextIn = 3 + G.rng.next() * 5;
  emit('job'); emit('car');
  save();
}

// ───────── Dagsslutt ─────────
function endDay() {
  const s = S();
  if (s.betweenDays) return;
  const q = s.today.quality;
  const avg = q.length ? q.reduce((a, b) => a + b, 0) / q.length : null;
  const unlocks = UNLOCK_STEPS.filter((u) => u.at > s.unlockedSeen && u.at <= s.carsTotal && u.at > 0).map((u) => u.text);
  s.unlockedSeen = Math.max(s.unlockedSeen, s.carsTotal);
  const nextUps = UPGRADES.filter((u) => !s.upgrades[u.id] && canBuy(u, { ...s, money: Infinity }).ok).slice(0, 4).map((u) => u.name);
  s.lastReport = {
    day: s.day,
    cars: s.today.cars,
    income: s.today.income,
    expenses: s.today.expenses,
    parts: s.today.parts,
    upgrades: s.today.upgrades,
    quality: avg == null ? null : QUALITY[Math.round(avg)].name,
    qualityNum: avg,
    found: s.today.found,
    missed: s.today.missed,
    declined: s.today.declined,
    money: s.money,
    carsTotal: s.carsTotal,
    unlocks,
    nextUps,
  };
  s.stats.days++;
  s.betweenDays = true;
  s.held = s.held; // verktøyet blir liggende i hånda til i morgen
  emit('day:end', s.lastReport);
  save();
}

export function startNextDay() {
  const s = S();
  s.day++;
  s.t = 0;
  s.dayClosed = false;
  s.betweenDays = false;
  s.today = freshDay();
  s.nextIn = 3;
  emit('clock'); emit('money');
  save();
}
