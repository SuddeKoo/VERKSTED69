// Hvorfor står bilen på verkstedet? Hver historie sier hvilke feil som kan forklare den (must: minst én
// av disse blir hovedfeilen, may: mulige følgefeil). Generatoren velger bare feil som er låst opp, så det
// kunden forteller, alltid stemmer med bilens faktiske skader.
// lines = nøytrale replikker (alle figurer). Figurene har egne varianter i dialogue/cast*.js (story.<id>).

export const STORIES = {
  moose: {
    weight: 1.2, must: ['headlight_broken', 'bumper_damage', 'dent'], may: ['dent', 'headlight_broken', 'alignment', 'bumper_damage'],
    lines: [
      'Æ kjørte på en elg ved Skaidi. Eller elgen kjørte på mæ. Det e litt uklart.',
      'Elg. Midt i veien. Han sto der som om han eide E6. Han gjør vel det.',
      'Det kom en elg ut av ingenting. Han gikk videre. Bilen gjorde ikkje det.',
    ],
  },
  ditch: {
    weight: 1.2, must: ['ditch_wash', 'mud', 'flat_tire', 'bent_rim'], may: ['alignment', 'bumper_damage', 'wash_heavy', 'loose_part', 'underbody', 'mud'],
    lines: [
      'Æ skled i grøfta i Kvænangsbotn. Traktoren som dro mæ opp, va ikkje gratis.',
      'Glatt som såpe. Og så va æ i grøfta. Og så va æ i grøfta litt til.',
      'Æ havna i grøfta. Æ va ikkje den første i dag, sa brøytemannen.',
    ],
  },
  tree: {
    weight: 0.8, must: ['dent', 'bumper_damage', 'headlight_broken', 'door_panel'], may: ['alignment', 'dent'],
    lines: [
      'Æ traff ei bjørk ute på vidda. Den eneste bjørka på flere mil. Æ fant den.',
      'Et tre. Det sto der i går òg, påstår de.',
    ],
  },
  reversed: {
    weight: 0.8, must: ['dent', 'taillight_out', 'loose_body'], may: ['dent', 'taillight_out'],
    lines: [
      'Æ rygga inn i min egen garasje. Den har stått der i tjue år. Den flytta seg ikkje.',
      'Æ rygga litt for langt. Inn i postkassa. Og så litt inn i naboens postkasse.',
    ],
  },
  towing: {
    weight: 0.6, must: ['loose_part', 'bumper_damage', 'underbody'], may: ['worn_brakes', 'loose_part'],
    lines: [
      'Æ prøvde å dra løs svogerens bil fra en snøfonn. Hans bil e fin. Min e ikkje det.',
      'Vi slepte en gammel traktor med tau. Tauet holdt. Det gjorde ikkje bilen.',
    ],
  },
  parked: {
    weight: 1.2, must: ['dead_battery', 'weak_battery', 'ice_snow', 'frozen_lock', 'cold_start', 'flat_tire'], may: ['rust_spot', 'wash_basic', 'low_oil', 'bad_visibility', 'ice_snow'],
    lines: [
      'Bilen har stått ute siden oktober. Æ glømte litt at æ hadde den.',
      'Den har stått under en snøskavl i tre måneder. Vi fant den med lavinesøker.',
      'Den har stått ute hele vinteren. Æ trudde den va robust. Den va ikkje det.',
    ],
  },
  friend: {
    weight: 0.9, must: ['wiring_fault', 'sensor_fault', 'starter_fault', 'misfire', 'exhaust_loose', 'loose_part', 'bulb_out'], may: ['bulb_out', 'loose_body', 'low_oil'],
    lines: [
      'En kompis prøvde å fikse den. Han har sett mange videoa på nettet.',
      'Svogeren min skrudde litt på den. Han hadde tre skruer til overs etterpå.',
      'Naboen sa han va mekaniker. Det viste seg at han mente «mekanisk interessert».',
    ],
  },
  rock: {
    weight: 0.8, must: ['exhaust_damaged', 'small_leak', 'underbody', 'loose_part', 'flat_tire'], may: ['exhaust_loose', 'small_leak'],
    lines: [
      'Æ kjørte over en stein på skogsbilveien. En stor stein. En steinete stein.',
      'Det lå en stein midt i veien. Den ligg der fortsatt. Med litt av bilen min under.',
    ],
  },
  drift: {
    weight: 0.8, must: ['ice_snow', 'bumper_damage', 'headlight_broken', 'mud'], may: ['frozen_lock', 'dent', 'bad_visibility'],
    lines: [
      'Æ kjørte rett inn i en snøskavl. Æ trudde det va snø. Det va mest is.',
      'Brøytekanten va høyere enn bilen. Æ prøvde likevel.',
    ],
  },
  camping: {
    weight: 0.7, must: ['mud', 'wash_heavy', 'worn_tire', 'flat_tire'], may: ['dirty_filter', 'bulb_out', 'mud'],
    lines: [
      'Vi va på telttur. Det regna. Det snødde. Teltet blåste til Finland. Bilen ble igjen i myra.',
      'Campingturen gikk ikkje som planlagt. Ingenting av den, egentlig.',
    ],
  },
  borrowed: {
    weight: 0.8, must: ['dent', 'bumper_damage', 'door_panel', 'worn_brakes', 'low_oil', 'paint_damage'], may: ['dent', 'low_oil', 'bulb_out', 'wash_heavy'],
    lines: [
      'Æ lånte bort bilen til brorsønnen min. Han sa den va «sånn da han fikk den».',
      'Noen lånte bilen. De leverte den tilbake. Det e det eneste positive æ kan si.',
    ],
  },
  unknown: {
    weight: 1, must: ['*'], may: ['*'],
    lines: [
      'Æ vet ærlig talt ikkje ka som har skjedd. Den bare e sånn.',
      'Den var fin i går. Nu e den ikkje det. Det e alt æ vet.',
      'Spør ikkje mæ. Æ bare kjøre den.',
    ],
  },
  noise: {
    weight: 1.1, must: ['brake_noise', 'worn_brakes', 'exhaust_noise', 'exhaust_loose', 'loose_part', 'bad_shock', 'loose_body', 'imbalance'], may: ['loose_part', 'loose_body'],
    lines: [
      'Den lager en lyd. En sånn lyd en bil ikkje ska lage.',
      'Det kommer en rar lyd fra et sted. Æ har skrudd opp radioen, men den høres fortsatt.',
    ],
  },
  tiny_dent: {
    weight: 0.6, must: ['dent'], may: [],
    lines: [
      'Det e en bulk. Se på den. Den ødelegge HELE bilen.',
      'Æ har ikkje sovet siden æ så bulken. Det e en katastrofe.',
    ],
  },
  wrong_guess: {
    weight: 0.7, must: ['exhaust_loose', 'loose_body', 'brake_noise', 'imbalance', 'flat_tire', 'mud', 'loose_part'], may: [],
    lines: [
      'Æ e ganske sikker på at det e motoren. Det e alltid motoren.',
      'Det e helt klart motoren. Æ har hørt på den i en uke.',
    ],
  },
  service: {
    weight: 1, must: ['oil_service', 'wash_basic', 'tire_season', 'polish', 'cosmetic'], may: ['wash_basic', 'low_oil', 'bulb_out', 'worn_tire'],
    lines: [
      'Den ska bare ha en vanlig service. Ingenting dramatisk. Forhåpentligvis.',
      'Bare en vanlig tur innom. Den har gått mye i det siste.',
    ],
  },
  winter_check: {
    weight: 0.8, must: ['bad_visibility', 'worn_tire', 'weak_battery', 'tire_season', 'cold_start'], may: ['worn_tire', 'bulb_out', 'ice_snow'],
    lines: [
      'Æ ska over Kvænangsfjellet i morra. Den må tåle det.',
      'Vinteren har begynt for alvor. Bilen har ikkje fått med seg det.',
    ],
  },
  selling: {
    weight: 0.6, must: ['wash_basic', 'polish', 'rust_spot', 'dent', 'cosmetic', 'paint_damage'], may: ['wash_basic', 'rust_spot', 'dent'],
    lines: [
      'Æ ska selge den. Den må se ut som den aldri har vært i Nord-Norge.',
      'Bilen ska selges. Æ har skrevet «pent brukt» i annonsen. Gjør det sant.',
    ],
  },
  warning: {
    weight: 0.9, must: ['low_oil', 'sensor_fault', 'misfire', 'wiring_fault', 'weak_battery', 'worn_plugs'], may: ['low_oil', 'dirty_filter'],
    lines: [
      'Det lyser en lampe i dashbordet. En gul en. Med et bilde av en motor.',
      'Ei varsellampe har lyst i tre uker. Æ har satt en lapp over den.',
    ],
  },
  lights: {
    weight: 0.8, must: ['bulb_out', 'taillight_out', 'headlight_broken', 'wiring_fault'], may: ['bulb_out', 'taillight_out'],
    lines: [
      'En bilist blinka til mæ i hele går. Æ trudde han va hyggelig. Det va lysan.',
      'Politiet stoppa mæ for lysan. Æ lova å fikse det i dag.',
    ],
  },
  pulling: {
    weight: 0.8, must: ['alignment', 'flat_tire', 'worn_brakes', 'bent_rim', 'imbalance'], may: ['worn_tire'],
    lines: [
      'Bilen vil hele tida til venstre. Æ vil til høyre.',
      'Den trekke sånn til sida. Æ må holde rattet som om æ styrer en båt.',
    ],
  },
  starting: {
    weight: 1, must: ['dead_battery', 'weak_battery', 'starter_fault', 'cold_start', 'worn_plugs'], may: ['bulb_out', 'low_oil'],
    lines: [
      'Den vil ikkje starte. Den måtte dyttes hit av tre menn og en hund.',
      'Den starte bare når den har lyst. Den har ikkje så mye lyst.',
    ],
  },
  smell: {
    weight: 0.6, must: ['small_leak', 'exhaust_damaged', 'dirty_filter', 'low_oil'], may: ['small_leak'],
    lines: [
      'Det lukte rart i bilen. Brent. Eller olje. Eller begge deler.',
      'Det drypper nåkka under den. Det ligg en svart dam i oppkjørselen.',
    ],
  },
};
export const STORY_IDS = Object.keys(STORIES);
