// Hvordan kunder beskriver feil. vague = symptomet slik en vanlig sjåfør merker det (spilleren må finne
// årsaken selv). Når kunden vet hva som er galt, brukes figurens egen «exact»-mal med feilnavnet.
// {side} = «foran»/«bak», {fault} = feilnavnet i småbokstaver.

export const SYMPTOMS = {
  flat: ['Det ene dekket ser litt… trist ut.', 'Et av hjulan e flatere enn de andre.'],
  pull: ['Den trekke til sida når æ kjøre.', 'Æ må holde fast i rattet hele tida, ellers havne æ i grøfta igjen.'],
  slippery: ['Den glir sånn i svingan. Mer enn før.', 'Den har dårlig feste. Som å kjøre på smør.'],
  noise_front: ['Det dure fra fronten når æ kjøre fort.', 'Det kommer en lyd fra framhjulan. Eller bak. Fra et hjul.'],
  vibration: ['Rattet riste i åtti. Æ kjøre derfor sytti. Eller nitti.', 'Hele bilen vibrerer. Kaffen min hoppe ut av koppen.'],
  shaky_wheel: ['Det føles som et av hjulan danse når farta øke.'],
  season: ['Den har fortsatt sommerdekk. Æ veit, æ veit.', 'Æ trenger vinterdekk på. Det e på høy tid, sa naboen.'],
  uneven_wear: ['Dekkan blir slitt på innsida. Bare på innsida. Rart.'],
  slowstart: ['Den starte, men den bruke lang tid. Som mæ om morran.', 'Den hoste og harke før den går i gang.'],
  dim_lights: ['Lysan e svake når den går på tomgang.'],
  nostart: ['Den starte ikkje. I det hele tatt.', 'Æ vri om nøkkelen og ingenting skjer. Ingenting.'],
  dark_dash: ['Dashbordet e helt mørkt. Ikkje et lys.'],
  click_start: ['Når æ vri om nøkkelen sie den bare «klikk». Ikkje noe mer.'],
  dark_light: ['Det ene frontlyset virke ikkje.', 'Bilen ser ut som den blunke. Det ene lyset e borte.'],
  dark_rear: ['Han bak mæ blinka og pekte på bakenden min. Baklysan, trur æ.'],
  flicker: ['Lysan blafre når æ kjøre over hump.', 'Det blinke rart i dashbordet. Som et diskotek.'],
  warnlight: ['Det lyse en varsellampe. Æ har ikkje lest ka den betyr.', 'En lampe i dashbordet lyse. Gul. Eller oransje.'],
  service: ['Den ska ha service. Olje og sånt.', 'Det står i boka at den skulle hatt service for to år siden.'],
  smell: ['Det lukte rart når æ kjøre.', 'Det lukte brent. Eller varmt. Eller dyrt.'],
  weak: ['Den har ingen kraft i motbakkan.', 'Den e treg. Trøtt. Den har mista livslysten.'],
  stutter: ['Motoren hakke og hoste. Den går ujevnt.', 'Det rykke i hele bilen på tomgang.'],
  grind: ['Det skrape når æ bremse. Metall mot metall.', 'Det høres ut som en kvern når æ bremse.'],
  long_brake: ['Den bruke lang tid på å stoppe.'],
  squeal: ['Den hvine når æ bremse. Folk snur sæ.', 'Bremsan pipe som en mus i en felle.'],
  bumpy: ['Den gynge som en båt over humpan.', 'Den hoppe og sprette i hver eneste hump.'],
  rattle: ['Det skrangle et sted under bilen.', 'Det klirre og skrangle når æ kjøre på grusvei.'],
  clunk: ['Det klonke under bilen over humpan.'],
  scrape: ['Det skrape i bakken når æ kjøre over drensrenna.'],
  loud_exhaust: ['Den bråke som en traktor. Den gjorde ikkje det før.', 'Den har fått en sånn sportsbil-lyd. Æ ba ikkje om det.'],
  drip: ['Det drypper nåkka under den.', 'Det ligg en mørk flekk der æ parkere.'],
  ugly: ['Den ser stygg ut. Stygg-ere.', 'Den ser ut som den har vært i krig.'],
  dent: ['Det e en bulk i døra.'],
  rust: ['Rusten e i ferd med å spise bilen.', 'Det e rust. Rust e kreft for bila.'],
  door_stuck: ['Døra går ikkje ordentlig igjen.'],
  flap: ['Det henge en list og blafre i vinden.'],
  scratch: ['Noen har ripa opp hele sida.', 'Lakken e ødelagt. Noen har vært ute med nøkkel.'],
  cold: ['Den hate kulda. Akkurat som mæ.', 'Under minus tjue nekter den å samarbeide.'],
  icy: ['Den e dekka av is. Helt.', 'Æ har ikkje sett vinduan på en uke.'],
  cantopen: ['Æ får ikkje opp døra. Låsen e frosset.', 'Nøkkelen går ikkje inn i låsen.'],
  cantsee: ['Æ ser ingenting gjennom frontruta.', 'Viskeran gjør vondt verre.'],
  dirty: ['Den trenger en vask. En ordentlig en.', 'Den e møkkete. Æ vet ikkje lenger ka farge den har.'],
  dull: ['Lakken e så matt. Den skinte før.', 'Den ser gammel og grå ut.'],
  newcolor: ['Æ vil ha ny farge på den. {color}.', 'Kan dokker lakke den {color}? Æ har bestemt mæ.'],
};

// Felles maler når kunden vet hva som er galt (brukes når figuren ikke har egne)
export const EXACT = [
  'Det e {fault}. Det e æ ganske sikker på.',
  'Æ trur det e {fault}.',
  '{Fault}. Det har æ sett før.',
];
// Kunden vet ikke helt, men har en teori
export const HUNCH = ['Kan det vær {fault}? Æ bare gjette.', 'Kanskje {fault}? Nei, æ vet ikkje.'];

export const SIDE = { F: 'foran', R: 'bak', B: 'på alle hjulan' };
