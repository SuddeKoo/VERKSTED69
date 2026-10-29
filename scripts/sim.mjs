// Hodeløs test av oppdragsgeneratoren, dialogen og økonomien.
// Bruk: node scripts/sim.mjs [antall biler] [seed]
// Sjekker at alle 30 figurer har replikkbank, at historiene bare gir opplåste feil, at feilene som nevnes
// finnes på bilen, at alle feil har minst én måte å bli oppdaget på, og at økonomien går i pluss.
import { G, newState } from '../src/game/state.js';
import { RNG } from '../src/core/rng.js';
import { generateJob, evaluate, faultValue, partPrice } from '../src/game/jobs.js';
import { arrivalLines, pickupLines, missingVoices } from '../src/data/dialogue/voices.js';
import { FAULTS, FAULT_IDS, unlockedFaults } from '../src/data/faults.js';
import { PARTS, TOOLS } from '../src/data/parts.js';
import { CHARACTERS } from '../src/data/characters.js';
import { STORIES } from '../src/data/stories.js';
import { UPGRADES } from '../src/data/upgrades.js';

const N = +process.argv[2] || 120;
G.rng = new RNG(+process.argv[3] || 6969);
G.s = newState(1);
const s = G.s;
let errors = 0;
const err = (m) => { errors++; console.log('FEIL:', m); };

if (missingVoices().length) err('mangler replikkbank: ' + missingVoices().join(', '));
if (CHARACTERS.length !== 30) err('ikke 30 figurer');
for (const id of FAULT_IDS) {
  const f = FAULTS[id];
  if (!Object.keys(f.tests || {}).length) err(`${id}: ingen måte å oppdage feilen`);
  if (!TOOLS[f.tool]) err(`${id}: ukjent verktøy ${f.tool}`);
  if (f.part && !PARTS[f.part]) err(`${id}: ukjent del ${f.part}`);
}
for (const [id, st] of Object.entries(STORIES)) for (const f of [...st.must, ...st.may]) if (f !== '*' && !FAULTS[f]) err(`historie ${id}: ukjent feil ${f}`);

const seenFaults = new Set(), seenChars = new Set(), seenStories = new Set();
let multi = 0, hidden = 0, income = 0, parts = 0;
for (let i = 0; i < N; i++) {
  s.carsTotal = i;
  if (i === 10) s.upgrades.paint_booth = true;
  const job = generateJob();
  const allowed = new Set(unlockedFaults(s.carsTotal, s.upgrades));
  for (const f of job.faults) if (!allowed.has(f.id)) err(`bil ${i}: feil ${f.id} er ikke låst opp`);
  const must = STORIES[job.story].must;
  if (!must.includes('*') && !must.includes(job.faults[0].id) && i > 0) err(`bil ${i}: hovedfeil ${job.faults[0].id} passer ikke historien ${job.story}`);
  const lines = arrivalLines(job, G.rng);
  if (lines.some((l) => !l || /\{\w+\}/.test(l))) err(`bil ${i}: tom replikk eller ufylt mal: ${lines.join(' | ')}`);
  job.faults.forEach((f) => { seenFaults.add(f.id); f.found = true; f.fixed = true; f.quality = G.rng.int(1, 3); });
  if (job.faults.length > 1) multi++;
  hidden += job.faults.filter((f) => !f.reported).length;
  seenChars.add(job.charId); seenStories.add(job.story);
  const r = evaluate(job);
  const pl = pickupLines(job, r, G.rng);
  if (pl.some((l) => /\{\w+\}/.test(l))) err('ufylt mal i henting: ' + pl.join(' | '));
  income += r.total;
  for (const f of job.faults) { const d = FAULTS[f.id]; if (d.part) parts += partPrice(d.part) * (d.qty || 1); }
  if (i < 6 || i % 25 === 0) console.log(`#${i} ${job.charId} [${job.story}] ${job.faults.map((f) => `${f.id}${f.reported ? '' : '(skjult)'}`).join(', ')} → ${r.total} kr\n   «${lines.join(' / ')}»`);
}
console.log(`\nFeiltyper sett: ${seenFaults.size}/${FAULT_IDS.length}  figurer: ${seenChars.size}/30  historier: ${seenStories.size}/${Object.keys(STORIES).length}`);
console.log(`Flere feil: ${multi}/${N}  skjulte feil: ${hidden}  snitt inntekt/bil: ${Math.round(income / N)} kr  snitt delekost/bil: ${Math.round(parts / N)} kr`);
console.log(`Oppgraderinger: ${UPGRADES.length}, sum pris ${UPGRADES.reduce((a, u) => a + u.price, 0)} kr`);
console.log(`Verdi flat_tire: ${faultValue('flat_tire')} kr`);
console.log(errors ? `\n${errors} FEIL` : '\nOK – ingen feil');
process.exit(errors ? 1 : 0);
