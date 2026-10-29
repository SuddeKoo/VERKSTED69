// VERKSTED69 – alle bilfeil, datadrevet. Ny feil = ny post her (+ evt. replikker i dialogue/symptoms.js).
//
// zone     område på bilen der feilen sitter og repareres (se ui/car/CarArt.js → ZONES)
// tool     verktøy som må holdes for å starte reparasjonen
// part     reservedel (data/parts.js) som brukes når reparasjonen er ferdig, qty antall
// mg       reparasjonsminispill (ui/minigames/*), mgOpts sendes med
// labour   arbeidspris (kr) – kunden betaler arbeid + del med påslag, justert for kvalitet
// unlock   antall ferdige biler før feilen kan dukke opp (eller upgrade: id)
// seen     'visible' = synlig på bilen fra start (klikk for å bekrefte), 'lamp' = synlig bare i lampelyset,
//          'none' = må avsløres av en test
// tests    inspeksjoner som avslører feilen, med forklaring spilleren får (hvorfor feilen ble funnet)
// sym      symptomer kunden kan beskrive (dialogue/symptoms.js), visual = tegnet skade (CarArt)
// diff     vanskelighetsgrad 1–3 (påvirker minispill og hvor tidlig feilen blir vanlig)

export const CATEGORIES = {
  wheels: { name: 'Hjul og dekk', icon: '◎' },
  elec: { name: 'Batteri og elektrisk', icon: 'ϟ' },
  engine: { name: 'Motor og service', icon: '⚙' },
  brakes: { name: 'Bremser og understell', icon: '◍' },
  exhaust: { name: 'Eksos og lekkasjer', icon: '≋' },
  body: { name: 'Karosseri og rust', icon: '▣' },
  winter: { name: 'Vinterproblemer', icon: '❄' },
  wash: { name: 'Bilvask og kosmetikk', icon: '✦' },
};

export const FAULTS = {
  // ───────── HJUL OG DEKK ─────────
  flat_tire: {
    cat: 'wheels', name: 'Punktering', zone: 'wheel', tool: 'wheel', part: 'tire', mg: 'wheel_swap', labour: 260, unlock: 0, diff: 1,
    seen: 'visible', visual: 'flat', sym: ['flat', 'pull'],
    tests: { look: 'Dekket er helt flatt. Det ligger en skrue i slitebanen.', spin: 'Hjulet slarker rundt uten luft. Punktert.' },
  },
  worn_tire: {
    cat: 'wheels', name: 'Slitt dekk', zone: 'wheel', tool: 'wheel', part: 'tire', mg: 'wheel_swap', labour: 220, unlock: 0, diff: 1,
    seen: 'lamp', visual: 'worn_tread', sym: ['slippery', 'noise_front'],
    tests: { lamp: 'I lampelyset ser du at mønsteret er nede i to millimeter. Glatt som et skøytebrett.', spin: 'Slitebanen er blank og ujevn når hjulet går rundt.' },
  },
  bent_rim: {
    cat: 'wheels', name: 'Skadet felg', zone: 'wheel', tool: 'wheel', part: 'rim', mg: 'wheel_swap', mgOpts: { rim: true }, labour: 300, unlock: 20, diff: 2,
    seen: 'lamp', visual: 'bent_rim', sym: ['vibration', 'pull'],
    tests: { spin: 'Felgen slår tydelig når hjulet spinner – den er bøyd i kanten.', lamp: 'Lampen viser en bulk i felgkanten.' },
  },
  imbalance: {
    cat: 'wheels', name: 'Ubalanse', zone: 'wheel', tool: 'wheel', part: 'weights', mg: 'balance', labour: 180, unlock: 6, diff: 1,
    seen: 'none', sym: ['vibration', 'shaky_wheel'],
    tests: { spin: 'Vibrasjonsmåleren slår ut ved høy fart. Hjulet er ute av balanse.' },
  },
  tire_season: {
    cat: 'wheels', name: 'Dekkskift (vinter)', zone: 'wheel', tool: 'wheel', part: 'tire', qty: 2, mg: 'wheel_swap', mgOpts: { both: true }, labour: 340, unlock: 28, diff: 1,
    seen: 'visible', request: true, visual: 'summer_tires', sym: ['season'],
    tests: { look: 'Sommerdekk. I november. I Nord-Norge.' },
  },
  alignment: {
    cat: 'wheels', name: 'Skjev hjulstilling', zone: 'wheel', tool: 'wheel', part: null, mg: 'align', labour: 320, unlock: 20, diff: 2,
    seen: 'none', sym: ['pull', 'uneven_wear'],
    tests: { spin: 'Hjulet peker litt innover når det går. Hjulstillingen er skjev.', lamp: 'Dekket er slitt bare på innsiden. Klassisk skjev hjulstilling.' },
  },

  // ───────── BATTERI OG ELEKTRISK ─────────
  weak_battery: {
    cat: 'elec', name: 'Svakt batteri', zone: 'hood', tool: 'elec', part: 'battery', mg: 'battery', labour: 180, unlock: 3, diff: 1,
    seen: 'none', sym: ['slowstart', 'dim_lights'],
    tests: { engine: 'Startmotoren drar seint og trøtt. Spenningen faller til 9 volt under start.', scanner: 'Kode B1325: lav systemspenning.' },
  },
  dead_battery: {
    cat: 'elec', name: 'Defekt batteri', zone: 'hood', tool: 'elec', part: 'battery', mg: 'battery', labour: 200, unlock: 3, diff: 1,
    seen: 'none', sym: ['nostart', 'dark_dash'],
    tests: { engine: 'Ingenting skjer når du vrir om. Dashbordet er mørkt. Batteriet er dødt.', lights: 'Lysene lyser knapt. Batteriet er tomt.' },
  },
  starter_fault: {
    cat: 'elec', name: 'Startproblemer (relé)', zone: 'hood', tool: 'elec', part: 'relay', mg: 'wires', mgOpts: { pairs: 3, relay: true }, labour: 340, unlock: 15, diff: 2,
    seen: 'none', sym: ['click_start', 'nostart'],
    tests: { engine: 'Bare et lite «klikk» når du vrir om – startreleet slipper ikke strøm til startmotoren.', scanner: 'Kode P0615: feil i startrelékretsen.' },
  },
  bulb_out: {
    cat: 'elec', name: 'Defekt lyspære', zone: 'headlight', tool: 'elec', part: 'bulb', mg: 'bulb', mgOpts: { front: true }, labour: 90, unlock: 0, diff: 1,
    seen: 'none', visual: 'dark_head', sym: ['dark_light'],
    tests: { lights: 'Frontlyset forblir mørkt når du slår på lysene. Pæra er gått.' },
  },
  headlight_broken: {
    cat: 'elec', name: 'Knust frontlykt', zone: 'headlight', tool: 'elec', part: 'headlamp', mg: 'lamp_unit', labour: 240, unlock: 3, diff: 1,
    seen: 'visible', visual: 'smashed_head', sym: ['dark_light', 'ugly'],
    tests: { look: 'Lyktglasset er knust og reflektoren bøyd. Hele lyktehuset må byttes.', lights: 'Lyset spraker og blinker bak knust glass.' },
  },
  taillight_out: {
    cat: 'elec', name: 'Defekt baklys', zone: 'taillight', tool: 'elec', part: 'bulb', mg: 'bulb', mgOpts: { rear: true }, labour: 90, unlock: 3, diff: 1,
    seen: 'none', visual: 'dark_tail', sym: ['dark_rear'],
    tests: { lights: 'Baklyset tennes ikke. Pæra bak er gått.' },
  },
  wiring_fault: {
    cat: 'elec', name: 'Elektrisk feil', zone: 'hood', tool: 'elec', part: 'wire', mg: 'wires', mgOpts: { pairs: 4 }, labour: 300, unlock: 15, diff: 2,
    seen: 'none', sym: ['flicker', 'warnlight'],
    tests: { scanner: 'Kode U0100: brudd i ledningsnettet. Et par kontakter har korrodert.', lights: 'Lysene blafrer når du rister i ledningene under panseret.' },
  },

  // ───────── MOTOR OG SERVICE ─────────
  oil_service: {
    cat: 'engine', name: 'Oljeskift', zone: 'hood', tool: 'service', part: 'oil', extra: 'filter', mg: 'oil', mgOpts: { full: true }, labour: 380, unlock: 3, diff: 1,
    seen: 'none', request: true, sym: ['service'],
    tests: { dipstick: 'Olja er svart som tjære og tykk. Godt over tiden for service.', scanner: 'Serviceintervall overskredet med 14 000 km.' },
  },
  low_oil: {
    cat: 'engine', name: 'Lavt oljenivå', zone: 'hood', tool: 'service', part: 'oil', mg: 'oil', labour: 120, unlock: 0, diff: 1,
    seen: 'none', sym: ['warnlight', 'smell'],
    tests: { dipstick: 'Peilestaven er nesten tørr. Oljenivået er langt under minimum.', engine: 'Oljelampa lyser rødt så fort motoren går.' },
  },
  dirty_filter: {
    cat: 'engine', name: 'Tett filter', zone: 'hood', tool: 'service', part: 'filter', mg: 'filter', labour: 140, unlock: 6, diff: 1,
    seen: 'lamp', sym: ['weak', 'smell'],
    tests: { lamp: 'Luftfilteret er grått av støv, mus og noe som kan ha vært en vott.', engine: 'Motoren puster tungt og drar dårlig opp på turtall.' },
  },
  misfire: {
    cat: 'engine', name: 'Motorfusking', zone: 'hood', tool: 'service', part: 'plugs', mg: 'plugs', mgOpts: { bad: 1 }, labour: 360, unlock: 15, diff: 2,
    seen: 'none', sym: ['stutter', 'warnlight'],
    tests: { engine: 'Turtelleren hakker og motoren fusker på én sylinder. Det rister i hele bilen.', scanner: 'Kode P0302: tenningsfeil sylinder 2.' },
  },
  worn_plugs: {
    cat: 'engine', name: 'Slitte tennplugger', zone: 'hood', tool: 'service', part: 'plugs', mg: 'plugs', mgOpts: { bad: 4 }, labour: 300, unlock: 15, diff: 2,
    seen: 'none', sym: ['weak', 'slowstart'],
    tests: { scanner: 'Kode P0300: tilfeldige tenningsfeil. Pluggene er utbrent.', engine: 'Motoren går ujevnt på tomgang og bruker lang tid på å ta seg.' },
  },
  sensor_fault: {
    cat: 'engine', name: 'Sensorfeil', zone: 'hood', tool: 'elec', part: 'sensor', mg: 'wires', mgOpts: { pairs: 3, sensor: true }, labour: 280, unlock: 15, diff: 2,
    seen: 'none', sym: ['warnlight'],
    tests: { scanner: 'Kode P0135: oksygensensoren svarer ikke.' },
  },

  // ───────── BREMSER OG UNDERSTELL ─────────
  worn_brakes: {
    cat: 'brakes', name: 'Slitte bremser', zone: 'wheel', tool: 'wrench', part: 'pads', mg: 'brakes', labour: 380, unlock: 6, diff: 2,
    seen: 'lamp', sym: ['grind', 'long_brake'],
    tests: { spin: 'Det skraper metall mot metall når du bremser hjulet. Klossene er borte.', lamp: 'Gjennom felgen ser du at bremseklossen er tynn som en kjeks.' },
  },
  brake_noise: {
    cat: 'brakes', name: 'Bremselyd', zone: 'wheel', tool: 'wrench', part: 'pads', mg: 'brakes', mgOpts: { shims: true }, labour: 280, unlock: 6, diff: 1,
    seen: 'none', sym: ['squeal'],
    tests: { spin: 'Et høyt hvin hver gang hjulet bremses. Klossene har glasert seg.' },
  },
  bad_shock: {
    cat: 'brakes', name: 'Skadet støtdemper', zone: 'under', tool: 'wrench', part: 'shock', mg: 'shock', labour: 420, unlock: 20, diff: 2,
    seen: 'none', visual: 'shock_leak', sym: ['bumpy', 'noise_front'],
    tests: { bounce: 'Bilen gynger fire–fem ganger etter at du har trykket den ned. Dempen er død.', under: 'Støtdemperen er våt av olje. Den lekker.' },
  },
  loose_part: {
    cat: 'brakes', name: 'Løs komponent', zone: 'under', tool: 'wrench', part: 'bolts', mg: 'tighten', labour: 160, unlock: 20, diff: 1,
    seen: 'none', visual: 'loose_under', sym: ['rattle', 'clunk'],
    tests: { under: 'Et varmeskjold henger og slenger i én bolt. Det skrangler.', spin: 'Det klonker under bilen når hjulet går rundt.' },
  },
  underbody: {
    cat: 'brakes', name: 'Understellsskade', zone: 'under', tool: 'wrench', part: 'bolts', mg: 'tighten', mgOpts: { hits: 6 }, labour: 360, unlock: 28, diff: 2,
    seen: 'none', visual: 'bent_under', sym: ['clunk', 'pull'],
    tests: { under: 'Et stag under bilen er bøyd og to fester har løsnet. Noen har kjørt på noe hardt.' },
  },

  // ───────── EKSOS OG LEKKASJER ─────────
  exhaust_damaged: {
    cat: 'exhaust', name: 'Skadet eksos', zone: 'exhaust', tool: 'wrench', part: 'pipe', mg: 'exhaust', labour: 380, unlock: 10, diff: 2,
    seen: 'none', visual: 'exhaust_hole', sym: ['loud_exhaust', 'smell'],
    tests: { engine: 'Det brøler fra bakenden og det puffer røyk ut på siden av røret. Eksosen har et hull.', under: 'Eksosrøret er rustet gjennom midt på.' },
  },
  exhaust_loose: {
    cat: 'exhaust', name: 'Løs eksos', zone: 'exhaust', tool: 'wrench', part: 'hanger', mg: 'hanger', labour: 180, unlock: 10, diff: 1,
    seen: 'visible', visual: 'exhaust_hang', sym: ['rattle', 'scrape'],
    tests: { look: 'Eksosrøret henger og sleper nesten i bakken.', under: 'Gummiopphenget er røket. Røret henger i en ståltråd.' },
  },
  exhaust_noise: {
    cat: 'exhaust', name: 'Unormal eksoslyd', zone: 'exhaust', tool: 'wrench', part: 'seal', mg: 'exhaust', mgOpts: { seal: true }, labour: 260, unlock: 10, diff: 1,
    seen: 'none', sym: ['loud_exhaust', 'rattle'],
    tests: { engine: 'Det plystrer og knatrer i skjøten bak motoren. Pakningen er blåst.' },
  },
  small_leak: {
    cat: 'exhaust', name: 'Mindre lekkasje', zone: 'under', tool: 'wrench', part: 'seal', mg: 'tighten', mgOpts: { leak: true }, labour: 240, unlock: 20, diff: 1,
    seen: 'none', visual: 'drip', sym: ['drip', 'smell'],
    tests: { under: 'Det drypper fra en pakning under motoren. En liten svart dam på gulvet.', lamp: 'Det skinner vått og fett under bilen.' },
  },

  // ───────── KAROSSERI OG RUST ─────────
  dent: {
    cat: 'body', name: 'Bulk', zone: 'door', tool: 'body', part: null, mg: 'dent', labour: 300, unlock: 0, diff: 1,
    seen: 'visible', visual: 'dent', sym: ['ugly', 'dent'],
    tests: { look: 'En stor bulk i dørpartiet. Lakken er heldigvis hel.' },
  },
  bumper_damage: {
    cat: 'body', name: 'Skadet støtfanger', zone: 'bumperF', tool: 'body', part: 'bumper', mg: 'fit', mgOpts: { shape: 'bumper' }, labour: 360, unlock: 10, diff: 2,
    seen: 'visible', visual: 'bumper_hang', sym: ['ugly', 'scrape'],
    tests: { look: 'Støtfangeren er sprukket og henger i ett klips.' },
  },
  rust_spot: {
    cat: 'body', name: 'Rustflekk', zone: 'body', tool: 'body', part: 'rustkit', mg: 'scrub', mgOpts: { mode: 'rust' }, labour: 260, unlock: 10, diff: 1,
    seen: 'visible', visual: 'rust', sym: ['rust'],
    tests: { look: 'Rusten har spist seg gjennom lakken over hjulbuen.' },
  },
  door_panel: {
    cat: 'body', name: 'Skadet dørpanel', zone: 'door', tool: 'body', part: 'panel', mg: 'fit', mgOpts: { shape: 'panel' }, labour: 420, unlock: 20, diff: 2,
    seen: 'visible', visual: 'crumple', sym: ['ugly', 'door_stuck'],
    tests: { look: 'Dørpanelet er krøllet som en brusboks. Det må byttes.' },
  },
  loose_body: {
    cat: 'body', name: 'Løs karosseridel', zone: 'body', tool: 'body', part: 'bolts', mg: 'tighten', mgOpts: { clips: true }, labour: 150, unlock: 20, diff: 1,
    seen: 'visible', visual: 'loose_trim', sym: ['rattle', 'flap'],
    tests: { look: 'En sidelist har løsnet og blafrer i vinden.' },
  },
  paint_damage: {
    cat: 'body', name: 'Lakkskade', zone: 'body', tool: 'paint', part: 'paint', mg: 'scrub', mgOpts: { mode: 'sand' }, paintJob: true, labour: 520, unlock: 0, upgrade: 'paint_booth', diff: 2,
    seen: 'visible', visual: 'scratch', sym: ['ugly', 'scratch'],
    tests: { look: 'Dype riper gjennom lakken langs hele siden. Må slipes og lakkeres.' },
  },

  // ───────── VINTERPROBLEMER ─────────
  cold_start: {
    cat: 'winter', name: 'Kaldstartproblem', zone: 'hood', tool: 'elec', part: null, mg: 'charge', labour: 220, unlock: 10, diff: 1,
    seen: 'none', sym: ['slowstart', 'cold'],
    tests: { engine: 'Motoren drar og drar i kulda før den så vidt tar seg. Batteriet er nedkjølt og tomt.', scanner: 'Lav spenning registrert ved kaldstart, minus 24 grader.' },
  },
  ice_snow: {
    cat: 'winter', name: 'Is og snø på bilen', zone: 'body', tool: 'wash', part: null, mg: 'scrub', mgOpts: { mode: 'ice' }, labour: 160, unlock: 0, diff: 1,
    seen: 'visible', visual: 'ice', sym: ['icy', 'cantsee'],
    tests: { look: 'Bilen er dekket av et tykt islag. Vinduene er helt blinde.' },
  },
  frozen_lock: {
    cat: 'winter', name: 'Fastfrosset dørlås', zone: 'lock', tool: 'heat', part: null, mg: 'heat', labour: 170, unlock: 10, diff: 1,
    seen: 'none', sym: ['cantopen'],
    tests: { key: 'Nøkkelen går ikke inn. Låsen er full av is.' },
  },
  bad_visibility: {
    cat: 'winter', name: 'Dårlig sikt (viskere)', zone: 'glass', tool: 'service', part: 'wiper', mg: 'wiper', labour: 110, unlock: 10, diff: 1,
    seen: 'lamp', visual: 'smear', sym: ['cantsee'],
    tests: { lamp: 'Viskerbladene er revet opp og har laget buer i frontruta.', lights: 'Når du slår på viskerne, smører de bare skitten utover.' },
  },
  winter_wear: {
    cat: 'winter', name: 'Saltskader etter vinteren', zone: 'under', tool: 'wash', part: 'rustkit', mg: 'scrub', mgOpts: { mode: 'salt' }, labour: 280, unlock: 28, diff: 1,
    seen: 'none', visual: 'salt_under', sym: ['rust', 'dirty'],
    tests: { under: 'Hele understellet er hvitt av veisalt og begynnende rust.' },
  },

  // ───────── BILVASK OG KOSMETIKK ─────────
  wash_basic: {
    cat: 'wash', name: 'Bilvask', zone: 'body', tool: 'wash', part: null, mg: 'scrub', mgOpts: { mode: 'wash' }, labour: 180, unlock: 0, diff: 1,
    seen: 'visible', request: true, visual: 'dirt', sym: ['dirty'],
    tests: { look: 'Bilen er grå av veistøv og salt.' },
  },
  wash_heavy: {
    cat: 'wash', name: 'Ekstra skitten bil', zone: 'body', tool: 'wash', part: null, mg: 'scrub', mgOpts: { mode: 'wash', layers: 2 }, labour: 280, unlock: 6, diff: 1,
    seen: 'visible', request: true, visual: 'dirt_heavy', sym: ['dirty'],
    tests: { look: 'Skitten sitter i lag. Det kan være en rød bil under der. Eller blå.' },
  },
  mud: {
    cat: 'wash', name: 'Fjerning av søle', zone: 'wheel', tool: 'wash', part: null, mg: 'scrub', mgOpts: { mode: 'mud', both: true }, labour: 190, unlock: 3, diff: 1,
    seen: 'visible', visual: 'mud', sym: ['dirty', 'vibration'],
    tests: { look: 'Hjulbuene er pakket fulle av frossen søle.' },
  },
  ditch_wash: {
    cat: 'wash', name: 'Vask etter grøftekjøring', zone: 'body', tool: 'wash', part: null, mg: 'scrub', mgOpts: { mode: 'ditch' }, labour: 320, unlock: 20, diff: 1,
    seen: 'visible', visual: 'ditch', sym: ['dirty'],
    tests: { look: 'Gress, jord og en halv brøytestikk sitter fast i fronten.' },
  },
  polish: {
    cat: 'wash', name: 'Polering', zone: 'body', tool: 'wash', part: null, mg: 'scrub', mgOpts: { mode: 'polish' }, labour: 300, unlock: 28, diff: 1,
    seen: 'visible', request: true, visual: 'dull', sym: ['dull'],
    tests: { look: 'Lakken er matt og grå av alder. Den trenger polering.' },
  },
  cosmetic: {
    cat: 'wash', name: 'Kosmetisk oppfriskning (lakk)', zone: 'body', tool: 'paint', part: 'paint', mg: 'scrub', mgOpts: { mode: 'sand' }, paintJob: true, labour: 640, unlock: 0, upgrade: 'paint_booth', diff: 2,
    seen: 'visible', request: true, visual: 'dull', sym: ['newcolor'],
    tests: { look: 'Kunden vil ha ny farge. Hele bilen må slipes og lakkeres.' },
  },
};

export const FAULT_IDS = Object.keys(FAULTS);

// Inspeksjoner spilleren kan gjøre på bilen (ui/views/Bay.js). need = krav (verktøy i hånda / løftebukk oppe).
export const TESTS = {
  look:     { name: 'Visuell sjekk', how: 'Klikk på synlige skader med tom hånd.' },
  lamp:     { name: 'Lampesjekk', how: 'Hold arbeidslampa og lys over bilen.' },
  engine:   { name: 'Motortest', how: 'Klikk på dørvinduet og vri om nøkkelen.' },
  lights:   { name: 'Lystest', how: 'Klikk på dørvinduet og slå på lysene.' },
  scanner:  { name: 'Diagnose', how: 'Hold diagnoseverktøyet og klikk på dørvinduet.' },
  dipstick: { name: 'Peilestav', how: 'Åpne panseret og trekk opp peilestaven.' },
  spin:     { name: 'Hjultest', how: 'Løft bilen og klikk på et hjul for å spinne det.' },
  under:    { name: 'Understell', how: 'Løft bilen og lys under den med lampa.' },
  bounce:   { name: 'Gyngetest', how: 'Trykk bilen ned i fronten (bilen må stå nede).' },
  key:      { name: 'Dørlås', how: 'Prøv nøkkelen i dørlåsen.' },
};

/** Hvilke feil kan dukke opp nå (ferdige biler + kjøpte oppgraderinger). */
export function unlockedFaults(carsDone, upgrades) {
  return FAULT_IDS.filter((id) => {
    const f = FAULTS[id];
    if (f.upgrade && !upgrades[f.upgrade]) return false;
    return carsDone >= (f.unlock || 0);
  });
}

// Når nye kategorier låses opp (vises i dagsrapporten og på PC-en)
export const UNLOCK_STEPS = [
  { at: 0, text: 'Punkteringer, pærer, olje, bulker, is og vask' },
  { at: 3, text: 'Batterier, oljeskift, frontlykter, baklys og søle' },
  { at: 6, text: 'Bremser, ubalanse, filter og ekstra skitne biler' },
  { at: 10, text: 'Eksos, rust, støtfangere, frosne låser, kaldstart og viskere – og varmepistolen' },
  { at: 15, text: 'Motorfusking, tennplugger, sensorer, ledninger og startrelé' },
  { at: 20, text: 'Støtdempere, hjulstilling, felger, lekkasjer, paneler og grøftevask' },
  { at: 28, text: 'Understell, saltskader, dekkskift og polering' },
];
