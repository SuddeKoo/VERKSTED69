// Oppgraderinger kjøpes på PC-en. Begge krav må være oppfylt: price (trekkes) og cars (totalt ferdige biler,
// som aldri reduseres). Hver oppgradering har en faktisk effekt i spillet – se fx-feltet og hvor den brukes.
//
// Balanse: en jevn dag gir 5–8 biler og ca. 2 500–4 500 kr netto tidlig, 5 000–8 000 senere.
// Første kjøp skal komme etter 1–2 dager, og de dyreste trenger 30–60 biler og flere dager med sparing.

export const UPGRADE_CATS = {
  tools: 'Verktøy', lift: 'Løftebukk', diag: 'Diagnose', stock: 'Lager', paint: 'Lakkering', wash: 'Bilvask', shop: 'Verksted',
};

export const UPGRADES = [
  // ── Verktøy ──
  { id: 'impact', cat: 'tools', name: 'Muttertrekker', price: 1400, cars: 4,
    desc: 'Luftdrevet muttertrekker. Hjulmuttere løsnes og strammes med ett klikk i stedet for å holde inne.' },
  { id: 'torque', cat: 'tools', name: 'Momentnøkkel', price: 2200, cars: 9,
    desc: 'Bolter og muttere strammes alltid riktig: stramme-minispill gir minst «godt» resultat.' },
  { id: 'precision1', cat: 'tools', name: 'Presisjonsverktøy I', price: 2600, cars: 12,
    desc: 'Treffsonene i olje-, balanse-, hjulstillings-, bulk- og varmespillene blir 30 % bredere.' },
  { id: 'precision2', cat: 'tools', name: 'Presisjonsverktøy II', price: 6500, cars: 32, req: 'precision1',
    desc: 'Ytterligere 30 % bredere treffsoner og saktere bevegelige markører.' },
  { id: 'fast_tools', cat: 'tools', name: 'Hurtigkoplinger', price: 3800, cars: 22,
    desc: 'Alle reparasjoner som krever at du holder inne, går 40 % raskere.' },

  // ── Løftebukk ──
  { id: 'lift_pump', cat: 'lift', name: 'Ny hydraulikkpumpe', price: 1100, cars: 3,
    desc: 'Løftebukken går tre ganger så fort opp og ned.' },
  { id: 'lift_light', cat: 'lift', name: 'Lys under løftebukken', price: 2400, cars: 14,
    desc: 'Understellet lyses opp når bilen er løftet: lekkasjer og løse deler kan klikkes uten lampe.' },
  { id: 'car_chart', cat: 'lift', name: 'Bilplansje på veggen', price: 900, cars: 2,
    desc: 'Arbeidsordren viser hvilke inspeksjoner som er gjort på hvert område av bilen.' },

  // ── Diagnose ──
  { id: 'manual', cat: 'diag', name: 'Symptomhåndbok', price: 650, cars: 2,
    desc: 'Arbeidsordren foreslår hvilke tester som kan forklare symptomene kunden beskriver.' },
  { id: 'fast_test', cat: 'diag', name: 'Rask motortest', price: 1600, cars: 7,
    desc: 'Motortesten og hjultesten tar halve tiden.' },
  { id: 'scanner2', cat: 'diag', name: 'Ny diagnosemaskin', price: 3600, cars: 16,
    desc: 'Diagnoseverktøyet finner også motorfeil og løse ledninger, ikke bare feilkoder fra elektronikken.' },
  { id: 'vib_meter', cat: 'diag', name: 'Vibrasjonsmåler', price: 2300, cars: 19,
    desc: 'Hjultesten avslører også skjult understellsslark på samme side.' },
  { id: 'sniffer', cat: 'diag', name: 'Lekkasjesøker', price: 2800, cars: 24,
    desc: 'Motortesten avslører også lekkasjer og løse eksosdeler, uten å løfte bilen.' },

  // ── Lager ──
  { id: 'shelf1', cat: 'stock', name: 'Ekstra hylle', price: 900, cars: 3,
    desc: 'Plass til 10 av hver del i stedet for 6.' },
  { id: 'shelf2', cat: 'stock', name: 'Lagerreol', price: 3200, cars: 18, req: 'shelf1',
    desc: 'Plass til 16 av hver del.' },
  { id: 'bulk', cat: 'stock', name: 'Kassebestilling', price: 1300, cars: 8,
    desc: 'Bestill fem om gangen fra PC-en.' },
  { id: 'wholesale', cat: 'stock', name: 'Grossistavtale', price: 2900, cars: 13,
    desc: 'Alle deler 15 % billigere.' },
  { id: 'wholesale2', cat: 'stock', name: 'Storkundeavtale', price: 8500, cars: 40, req: 'wholesale',
    desc: 'Alle deler 30 % billigere (erstatter grossistavtalen).' },

  // ── Lakkering ──
  { id: 'paint_booth', cat: 'paint', name: 'Lakkboks', price: 3400, cars: 10,
    desc: 'Låser opp lakkering: lakkskader og kunder som vil ha ny farge. Lakkutstyret henger på veggen.' },
  { id: 'paint_speed', cat: 'paint', name: 'Bedre sprøytepistol', price: 2600, cars: 17, req: 'paint_booth',
    desc: 'Lakkeringen tar halve tiden.' },
  { id: 'paint_colors', cat: 'paint', name: 'Fargekart+', price: 1900, cars: 15, req: 'paint_booth',
    desc: 'Seks nye farger. Kunder med fargeønske betaler 20 % ekstra når du treffer fargen.' },
  { id: 'paint_clear', cat: 'paint', name: 'Klarlakk', price: 4200, cars: 26, req: 'paint_booth',
    desc: 'Lakkjobber får ett kvalitetsnivå bedre resultat.' },
  { id: 'paint_mixer', cat: 'paint', name: 'Lakkblander', price: 3600, cars: 30, req: 'paint_booth',
    desc: 'Hver lakkjobb bruker halvparten så mye lakk (én boks holder til to jobber).' },

  // ── Bilvask ──
  { id: 'pressure', cat: 'wash', name: 'Høytrykksspyler', price: 1200, cars: 5,
    desc: 'Vaskeverktøyet dekker 60 % større område.' },
  { id: 'foam', cat: 'wash', name: 'Skumkanon', price: 2200, cars: 12,
    desc: 'Skitt, søle, is og rust løsner dobbelt så fort.' },
  { id: 'wax', cat: 'wash', name: 'Voks og polish', price: 2900, cars: 21,
    desc: 'Alle vaske- og poleringsjobber får ett kvalitetsnivå bedre resultat.' },

  // ── Verksted ──
  { id: 'work_light', cat: 'shop', name: 'Bedre arbeidslys', price: 1500, cars: 6,
    desc: 'Lampa lyser opp et dobbelt så stort område, og områder du ikke har sjekket, markeres svakt.' },
  { id: 'tool_cart', cat: 'shop', name: 'Verktøytralle', price: 2100, cars: 11,
    desc: 'En tralle ved bilen der du kan legge fra deg ett ekstra verktøy og bytte uten å gå til veggen.' },
  { id: 'coffee', cat: 'shop', name: 'Kaffetrakter i resepsjonen', price: 800, cars: 4,
    desc: 'Kundene er i bedre humør: +6 % betaling og mer tilgivelse for småfeil.' },
  { id: 'sign', cat: 'shop', name: 'Nytt skilt ved veien', price: 5200, cars: 36,
    desc: 'Flere kunder med store oppdrag: +10 % betaling på alle jobber.' },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

/** Kan kjøpes nå? Returnerer { ok, why } */
export function canBuy(u, s) {
  if (s.upgrades[u.id]) return { ok: false, why: 'Kjøpt' };
  if (u.req && !s.upgrades[u.req]) return { ok: false, why: `Krever «${UPGRADE_BY_ID[u.req].name}»` };
  if (s.carsTotal < u.cars) return { ok: false, why: `Krever ${u.cars} ferdige biler (${s.carsTotal})` };
  if (s.money < u.price) return { ok: false, why: 'For lite penger' };
  return { ok: true };
}
