// Bilbiblioteket: åtte gjenbrukbare 2D-modeller sett fra siden (fronten mot høyre).
// Alle modeller tegnes i samme koordinatsystem: 1000 × 420, bakken ved y = 420. Treffsonene
// (hjul, panser, lykter, dør, understell …) regnes ut fra de samme tallene, så en reparasjon treffer
// riktig sted uansett modell. Merker og modellnavn er oppdiktet.

export const GROUND = 420;

export const MODELS = {
  wagon: {
    name: 'Polarbil 245 Kombi', kind: 'Stasjonsvogn', years: [1979, 1993],
    body: [[30, 360], [28, 238], [66, 224], [92, 112], [130, 100], [575, 100], [652, 200], [905, 212], [958, 232], [968, 300], [960, 360]],
    glass: [[112, 120], [565, 118], [636, 202], [108, 206]], pillars: [300, 468], belt: 210,
    wheels: { R: 245, F: 790, r: 62 }, sill: 360, door: [300, 636], hood: [652, 958], light: { F: [930, 236], R: [44, 252] },
  },
  hatch: {
    name: 'Krafs Mini GL', kind: 'Kompakt småbil', years: [1983, 2001],
    body: [[130, 360], [124, 252], [148, 140], [200, 112], [560, 112], [642, 205], [850, 222], [882, 250], [886, 360]],
    glass: [[176, 134], [552, 128], [626, 206], [160, 210]], pillars: [360], belt: 212,
    wheels: { R: 272, F: 742, r: 56 }, sill: 360, door: [360, 630], hood: [642, 880], light: { F: [862, 244], R: [140, 248] },
  },
  sedan: {
    name: 'Torsk 1.8 Sedan', kind: 'Sedan', years: [1981, 1998],
    body: [[38, 360], [36, 232], [200, 218], [270, 118], [322, 104], [562, 104], [652, 205], [910, 214], [960, 236], [966, 360]],
    glass: [[292, 124], [556, 120], [634, 206], [232, 212]], pillars: [430], belt: 214,
    wheels: { R: 228, F: 800, r: 60 }, sill: 360, door: [300, 640], hood: [652, 962], light: { F: [936, 236], R: [52, 246] },
  },
  pickup: {
    name: 'Vidda Pickup 4WD', kind: 'Pickup', years: [1978, 1996],
    body: [[30, 362], [30, 214], [402, 212], [412, 96], [602, 92], [662, 196], [920, 206], [964, 230], [968, 362]],
    glass: [[432, 112], [592, 108], [646, 198], [428, 202]], pillars: [], belt: 204,
    wheels: { R: 205, F: 800, r: 70 }, sill: 362, door: [412, 650], hood: [662, 964], light: { F: [940, 230], R: [40, 236] },
    bed: true,
  },
  suv: {
    name: 'Fjellmann LX 4×4', kind: 'SUV', years: [1985, 2003],
    body: [[38, 372], [36, 172], [58, 82], [640, 80], [702, 182], [930, 192], [962, 216], [966, 372]],
    glass: [[80, 98], [630, 96], [686, 186], [70, 190]], pillars: [262, 452], belt: 192,
    wheels: { R: 232, F: 792, r: 74 }, sill: 372, door: [452, 690], hood: [702, 962], light: { F: [938, 214], R: [48, 220] },
    spare: true,
  },
  van: {
    name: 'Saltvann Transport', kind: 'Gammel varebil', years: [1980, 1997],
    body: [[30, 362], [30, 92], [62, 60], [762, 60], [872, 182], [955, 202], [966, 362]],
    glass: [[648, 80], [752, 80], [852, 186], [644, 192]], pillars: [], belt: 196,
    wheels: { R: 222, F: 760, r: 62 }, sill: 362, door: [640, 860], hood: [872, 962], light: { F: [940, 214], R: [40, 230] },
    van: true,
  },
  coupe: {
    name: 'Bølgen GTE Coupé', kind: 'Eldre sportsbil', years: [1977, 1992],
    body: [[40, 365], [40, 252], [150, 240], [300, 152], [360, 138], [562, 138], [652, 226], [930, 238], [968, 262], [968, 365]],
    glass: [[328, 156], [552, 152], [628, 226], [214, 234]], pillars: [], belt: 232,
    wheels: { R: 232, F: 792, r: 56 }, sill: 365, door: [330, 640], hood: [652, 966], light: { F: [944, 258], R: [56, 262] },
    sporty: true,
  },
  mpv: {
    name: 'Nordlys Familia 7', kind: 'Sliten familiebil', years: [1988, 2004],
    body: [[40, 362], [38, 172], [70, 108], [122, 95], [622, 95], [762, 192], [930, 210], [962, 236], [966, 362]],
    glass: [[100, 114], [612, 112], [736, 194], [86, 198]], pillars: [262, 470], belt: 200,
    wheels: { R: 240, F: 782, r: 60 }, sill: 362, door: [470, 740], hood: [762, 962], light: { F: [940, 234], R: [46, 226] },
  },
};
export const MODEL_IDS = Object.keys(MODELS);

// Farger (navn brukes i dialog og lakkering). paint: true = kan velges i lakkboksen fra start.
export const COLORS = [
  { id: 'rust_red', name: 'rustrød', hex: '#8f2f24', paint: true },
  { id: 'navy', name: 'marineblå', hex: '#253a5e', paint: true },
  { id: 'white', name: 'hvit', hex: '#d9d4c4', paint: true },
  { id: 'black', name: 'svart', hex: '#2a2a2c', paint: true },
  { id: 'moss', name: 'mosegrønn', hex: '#4d5e36', paint: true },
  { id: 'silver', name: 'sølvgrå', hex: '#9a9c98', paint: true },
  { id: 'beige', name: 'beige', hex: '#bba57a' },
  { id: 'brown', name: 'brun', hex: '#5e3f28' },
  { id: 'mustard', name: 'sennepsgul', hex: '#c69a2e' },
  { id: 'teal', name: 'petroleumsblå', hex: '#2c6467' },
  { id: 'wine', name: 'vinrød', hex: '#5c1f2e' },
  { id: 'orange', name: 'oransje', hex: '#c4622a' },
];
export const COLOR_BY_ID = Object.fromEntries(COLORS.map((c) => [c.id, c]));
// Fargekart+ gir disse i tillegg i lakkboksen
export const EXTRA_PAINT = ['beige', 'brown', 'mustard', 'teal', 'wine', 'orange'];

/** Ny tilfeldig bil. Utseendet er bestemt én gang og lagres i oppdraget. */
export function makeCar(rng, prefer) {
  const modelId = prefer && MODELS[prefer] ? prefer : rng.pick(MODEL_IDS);
  const m = MODELS[modelId];
  const color = rng.pick(COLORS).id;
  const year = rng.int(m.years[0], m.years[1]);
  const age = 2026 - year;
  return {
    model: modelId,
    color,
    year,
    rust: Math.min(1, Math.max(0, (age - 18) / 26 + rng.next() * 0.25)), // gammel bil = mer rust
    dirt: 0.15 + rng.next() * 0.25,      // litt veiskitt på alle biler (ikke en jobb i seg selv)
    hubcap: rng.pick(['steel', 'cap', 'alloy', 'steel']),
    trim: rng.pick(['none', 'stripe', 'none', 'twotone']),
    trimColor: rng.pick(COLORS).id,
    plate: `${rng.pick(['ZE', 'VD', 'UB', 'YB', 'SV', 'ZT', 'ZX', 'VJ'])} ${rng.int(10000, 99999)}`,
    seed: rng.int(1, 1e9),
    roofbox: modelId === 'wagon' && rng.chance(0.3),
  };
}
