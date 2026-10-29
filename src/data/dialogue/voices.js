// Samler replikkbankene for alle 30 figurer og setter sammen kundesamtaler som passer til oppdraget.
import { CAST_A } from './cast_a.js';
import { CAST_B } from './cast_b.js';
import { SYMPTOMS, EXACT, HUNCH, SIDE } from './symptoms.js';
import { STORIES } from '../stories.js';
import { FAULTS } from '../faults.js';
import { MODELS, COLOR_BY_ID } from '../cars.js';
import { CHAR_BY_ID } from '../characters.js';
import { fill } from '../../core/util.js';

export const VOICES = { ...CAST_A, ...CAST_B };

const lastPicked = new Map();
/** Velg en replikk, men unngå den samme to ganger på rad for samme figur og nøkkel. */
function pick(rng, list, key) {
  if (!list?.length) return null;
  if (list.length === 1) return list[0];
  let i = Math.floor(rng.next() * list.length);
  if (lastPicked.get(key) === i) i = (i + 1) % list.length;
  lastPicked.set(key, i);
  return list[i];
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
function vars(job, extra = {}) {
  const m = MODELS[job.car.model];
  return { car: m.kind.toLowerCase(), model: m.name, color: COLOR_BY_ID[job.wantColor || job.car.color]?.name || '', ...extra };
}
function withFault(t, name) {
  return t.replace(/\{FAULT\}/g, name.toUpperCase()).replace(/\{Fault\}/g, cap(name)).replace(/\{fault\}/g, name.toLowerCase());
}

/** Samtalen når kunden kommer inn: hilsen → historie → symptomer → bekymring. */
export function arrivalLines(job, rng) {
  const v = VOICES[job.charId] || {};
  const id = job.charId;
  const lines = [];
  lines.push(pick(rng, v.greet, `${id}.greet`));
  // Historie: figurens egen versjon hvis den finnes, sjelden en helt egen spesialhistorie
  const own = v.story?.[job.story];
  let story = own && rng.chance(0.7) ? pick(rng, own, `${id}.s.${job.story}`) : pick(rng, STORIES[job.story].lines, `g.${job.story}`);
  if (rng.chance(0.08) && v.rare?.length) story = `${story} ${pick(rng, v.rare, `${id}.rare`)}`;
  lines.push(story);
  // Det kunden vet om feilene. Skjulte feil nevnes aldri.
  const loud = /^[^a-zæøå]*$/.test(v.greet?.[0] || 'a'); // Tom snakker med store bokstaver
  for (const f of job.faults.filter((x) => x.reported)) {
    const def = FAULTS[f.id];
    let t;
    if (f.exact) t = withFault(pick(rng, v.exact?.length ? v.exact : EXACT, `${id}.exact`), def.name);
    else {
      const sym = def.sym.find((k) => SYMPTOMS[k]) || 'ugly';
      t = pick(rng, SYMPTOMS[sym], `sym.${sym}`);
      if (f.wheel && f.wheel !== 'B' && rng.chance(0.6)) t = t.replace(/\.$/, '') + ` – ${SIDE[f.wheel]}, trur æ.`;
      if (job.story === 'wrong_guess' && f.main) t = `${t} ${withFault(pick(rng, HUNCH, 'hunch'), 'motoren')}`;
    }
    f.said = fill(t, vars(job)); // arbeidsordren siterer det kunden faktisk sa
    lines.push(loud ? t.toUpperCase() : t);
  }
  if (rng.chance(0.75)) lines.push(pick(rng, v.ask, `${id}.ask`));
  return lines.filter(Boolean).map((t) => fill(t, vars(job)));
}

export function acceptLine(job, rng) { return fill(pick(rng, VOICES[job.charId]?.accept, `${job.charId}.accept`) || 'Takk.', vars(job)); }
export function backLine(job, rng) { return fill(pick(rng, VOICES[job.charId]?.back, `${job.charId}.back`) || 'Ferdig?', vars(job)); }
export function byeLine(job, rng) { return fill(pick(rng, VOICES[job.charId]?.bye, `${job.charId}.bye`) || 'Ha det.', vars(job)); }
export function declineLine(job, rng) {
  const v = VOICES[job.charId] || {};
  const mood = v.pay < 0.95 ? ['Ja ja. Da kjøre æ til et annet verksted. Et billigere et.'] : ['Å. Ok. Da får æ finne et annet sted.', 'Greit. Æ prøver i Alta.', 'Synd. Ha det.'];
  return pick(rng, mood, 'decline');
}

/** Reaksjon ved henting: kvalitet + ekstrafunn + pris. */
export function pickupLines(job, result, rng) {
  const v = VOICES[job.charId] || {};
  const id = job.charId;
  const out = [];
  out.push(pick(rng, v[result.mood] || v.good, `${id}.${result.mood}`) || 'Takk.');
  if (result.extraFixed) out.push(pick(rng, v.extra, `${id}.extra`));
  out.push(fill(pick(rng, v.price, `${id}.price`) || '{price}.', { price: `${result.total.toLocaleString('nb-NO')} kroner` }));
  return out.filter(Boolean).map((t) => fill(t, vars(job)));
}

export function rareLine(charId, rng) { return pick(rng, VOICES[charId]?.rare, `${charId}.rare`); }
export const firstName = (id) => CHAR_BY_ID[id]?.first || id;

// Sjekk at alle 30 figurer har en bank (kalles fra testkroken / sim)
export function missingVoices() {
  return Object.keys(CHAR_BY_ID).filter((id) => !VOICES[id]);
}
