// Reservedeler og verktøy. Lageret er bevisst enkelt: ett tall per del, begrenset av hyllekapasitet.
// price = innkjøpspris på PC-en (før rabattoppgraderinger). bin = rekkefølge på arbeidsbenken.

export const PARTS = {
  tire:     { name: 'Dekk',            short: 'Dekk',     price: 290, icon: 'tire',    start: 4 },
  rim:      { name: 'Felg',            short: 'Felg',     price: 340, icon: 'rim',     start: 1 },
  weights:  { name: 'Balanselodd',     short: 'Lodd',     price: 25,  icon: 'weights', start: 6 },
  battery:  { name: 'Batteri',         short: 'Batteri',  price: 620, icon: 'battery', start: 1 },
  relay:    { name: 'Startrelé',       short: 'Relé',     price: 160, icon: 'relay',   start: 0 },
  bulb:     { name: 'Lyspære',         short: 'Pære',     price: 45,  icon: 'bulb',    start: 6 },
  headlamp: { name: 'Lyktehus',        short: 'Lykt',     price: 480, icon: 'headlamp', start: 0 },
  wire:     { name: 'Ledningssett',    short: 'Ledning',  price: 90,  icon: 'wire',    start: 1 },
  sensor:   { name: 'Sensor',          short: 'Sensor',   price: 260, icon: 'sensor',  start: 0 },
  oil:      { name: 'Motorolje (5 l)', short: 'Olje',     price: 210, icon: 'oil',     start: 3 },
  filter:   { name: 'Filter',          short: 'Filter',   price: 95,  icon: 'filter',  start: 2 },
  plugs:    { name: 'Tennplugger (sett)', short: 'Plugger', price: 170, icon: 'plugs', start: 0 },
  pads:     { name: 'Bremseklosser',   short: 'Klosser',  price: 280, icon: 'pads',    start: 1 },
  shock:    { name: 'Støtdemper',      short: 'Demper',   price: 460, icon: 'shock',   start: 0 },
  bolts:    { name: 'Bolter og klips', short: 'Bolter',   price: 35,  icon: 'bolts',   start: 6 },
  pipe:     { name: 'Eksosrør',        short: 'Eksos',    price: 390, icon: 'pipe',    start: 0 },
  hanger:   { name: 'Eksosoppheng',    short: 'Oppheng',  price: 60,  icon: 'hanger',  start: 1 },
  seal:     { name: 'Pakningssett',    short: 'Pakning',  price: 110, icon: 'seal',    start: 0 },
  bumper:   { name: 'Støtfanger',      short: 'Fanger',   price: 690, icon: 'bumper',  start: 0 },
  panel:    { name: 'Dørpanel',        short: 'Panel',    price: 560, icon: 'panel',   start: 0 },
  rustkit:  { name: 'Rustsett',        short: 'Rustsett', price: 140, icon: 'rustkit', start: 1 },
  wiper:    { name: 'Vindusviskere',   short: 'Viskere',  price: 85,  icon: 'wiper',   start: 1 },
  paint:    { name: 'Lakk (boks)',     short: 'Lakk',     price: 240, icon: 'paint',   start: 0 },
};
export const PART_IDS = Object.keys(PARTS);

// Verktøy på pegboardet. unlock: biler eller oppgradering som må til før det henger der.
export const TOOLS = {
  lamp:    { name: 'Arbeidslampe',      verb: 'lyse på',       desc: 'Avslører det du ikke ser med det blotte øye: slitasje, sprekker, lekkasjer.' },
  scanner: { name: 'Diagnoseverktøy',   verb: 'koble til',     desc: 'Koble til bilen gjennom døra og les feilkoder.' },
  wheel:   { name: 'Hjulverktøy',       verb: 'skru på hjul',  desc: 'Hjulkors, lodd og justering. Alt som har med hjul og dekk å gjøre.' },
  wrench:  { name: 'Fastnøkler',        verb: 'skru',          desc: 'Bremser, demper, eksos og understell.' },
  service: { name: 'Serviceverktøy',    verb: 'serve',         desc: 'Olje, filter, tennplugger og viskere.' },
  elec:    { name: 'Elektroverktøy',    verb: 'måle',          desc: 'Batteri, lys, ledninger og startsystem.' },
  body:    { name: 'Karosseriverktøy',  verb: 'rette',         desc: 'Hammer, mothold og klips. Bulker, fangere og paneler.' },
  wash:    { name: 'Vaskeutstyr',       verb: 'vaske',         desc: 'Svamp, børste, isskrape og polering.' },
  heat:    { name: 'Varmepistol',       verb: 'varme',         desc: 'Tiner frosne låser og mekanismer.', unlockCars: 10 },
  paint:   { name: 'Lakkutstyr',        verb: 'slipe',         desc: 'Sliper og maskerer før lakkering.', unlockUpgrade: 'paint_booth' },
};
export const TOOL_IDS = Object.keys(TOOLS);
