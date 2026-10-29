// Koordinater (scene 1600×900) målt opp i Higgsfield-bakgrunnene i public/assets/bg/.
// Bytter du et bakgrunnsbilde, justerer du bare tallene her – alle interaktive lag følger med.
export const W = 1600, H = 900;

export const BG = {
  menu: 'assets/bg/menu.jpg',
  bay: 'assets/bg/bay.jpg',
  tools: 'assets/bg/tools.jpg',
  reception: 'assets/bg/reception.jpg',
  office: 'assets/bg/office.jpg',
};

// Kameravinkler fra venstre mot høyre. Spillet starter alltid i MOTTAK (2).
export const VIEWS = [
  { id: 'bay', name: 'BIL', long: 'Bil og løftebukk' },
  { id: 'tools', name: 'VERKTØY', long: 'Verktøy og deler' },
  { id: 'reception', name: 'MOTTAK', long: 'Kundemottak' },
  { id: 'office', name: 'KONTOR', long: 'Kontor og lakkering' },
];
export const START_VIEW = 2;

export const RECEPTION = {
  counterTop: 604,                                    // SVG-disken: kunden skjules under denne kanten
  door: { x: 26, y: 76, w: 214, h: 604 },             // inngangsdøra (glass med snø)
  doorGlass: { x: 58, y: 150, w: 142, h: 270 },
  window: { x: 540, y: 160, w: 500, h: 270 },         // vinduet inn mot løftebukken
  lamps: [{ x: 200, y: 22, w: 290 }, { x: 735, y: 22, w: 350 }],
  guest: { x: 800, bottom: 790, w: 440 },             // kunden ved disken
  enter: { x: 150, bottom: 700, s: 0.58 },            // i døråpningen
  speech: { x: 1046, y: 120, w: 380 },
  panel: { x: 1180, y: 560, w: 400, h: 330 },         // arbeidsordre/valg på disken (høyre)
  clipboard: { x: 70, y: 640, w: 330, h: 240 },       // arbeidsordren på klemmebrett
  terminal: { x: 905, y: 650, w: 200, h: 150 },       // betalingsterminal
  bell: { x: 470, y: 560, w: 80, h: 60 },
  keyHook: { x: 560, y: 668, w: 150, h: 120 },        // bilnøkkelen legges her
  note: { x: 422, y: 806, w: 300, h: 80 },
  mug: { x: 1110, y: 780, w: 70, h: 84 },
};

export const TOOLS_VIEW = {
  pegboard: { x: 362, y: 150, w: 892, h: 388 },
  benchTop: 604,
  bins: { x: 52, y: 640, cols: 12, w: 98, h: 112, gap: 4 },  // to rader med deleskuffer
  crate: { x: 1300, y: 600, w: 270, h: 280 },        // delekassa
  window: { x: 0, y: 150, w: 190, h: 320 },
};

export const BAY = {
  floor: 790,                                         // bakken bilen står på
  garage: { x: 62, y: 144, w: 494, h: 408 },           // porten i bakgrunnen (SVG-porten dekker denne)
  car: { x: 300, w: 1000 },                            // bilens plass (1000 enheter → 1000 px)
  liftH: 150,                                          // så høyt løftebukken løfter
  posts: [262, 1338],                                  // løftebukkens søyler
  control: { x: 1376, y: 430, w: 92, h: 150 },         // betjeningsboks på søylen
  order: { x: 1418, y: 92, w: 172, h: 300 },           // arbeidsordren henger på veggen
  crate: { x: 1400, y: 700, w: 190, h: 160 },          // delekassa ved bilen
  cart: { x: 70, y: 700, w: 170, h: 160 },             // verktøytralla (oppgradering)
};

export const OFFICE = {
  deskTop: 600,
  monitor: { x: 250, y: 236, w: 520, h: 400 },
  screen: { x: 300, y: 276, w: 420, h: 300 },          // den grønne skjermen i monitoren
  paint: { x: 1060, y: 380, w: 300, h: 500 },          // lakkblanderen
  window: { x: 0, y: 150, w: 190, h: 330 },
};
