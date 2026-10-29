# VERKSTED69

Spill nummer 4 i NordNorge 69-serien (etter NATTSKIFT 69, KIOSK69 og MOTELL69). Du driver et gammelt bilverksted
ved riksveien: kundene – alle de 30 originale figurene – kommer inn én og én, forteller hvorfor bilen er der, og du
finner feilene, henter verktøy og deler og reparerer bilen med ekte minispill.

Rent nettleserspill (HTML/CSS/JS + Vite). Ingen backend, ingen AI og ingen betalte API-er under spilling.

## Kjøre lokalt

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # statisk bygg i dist/
npm run preview    # test produksjonsbygget
node scripts/sim.mjs 150 6969   # hodeløs test av generator, dialog og økonomi
```

## Kontroller

| | |
|---|---|
| **A / D** eller **← / →** | Bytt kameravinkel: BIL · VERKTØY · MOTTAK · KONTOR (ingen wrap-around) |
| **Mus** | Klikk på gjenstander, dra-og-slipp i minispillene |
| **Esc** | Lukk minispill/PC/arbeidsordre, ellers pause |

Spillet starter alltid i MOTTAK. A én gang = verktøy og deler, A to ganger = bilen og løftebukken, D = kontoret.

## Spillflyt

1. **Mottak:** kunden går inn døra, forteller historien sin og symptomene. GODTA (eller avslå) arbeidsordren.
2. **Bilen kommer inn:** kunden går, garasjeporten går opp, bilen kjører inn i hallen og porten lukkes (kort 2D-animasjon,
   ingen filmsekvens – du kan bytte vinkel mens det skjer).
3. **Feilsøking i hallen:** klikk på bilen med tom hånd (se nærmere, førerplass med motortest og lystest, panser og
   peilestav, hjultest når bilen er løftet, gyngetest), hold **arbeidslampa** (lyser opp slitasje og lekkasjer, også under
   bilen) eller **diagnoseverktøyet** (feilkoder). Hver funnet feil forklares, og havner på arbeidsordren.
   Alle feil er bestemt når oppdraget lages; noen har kunden ikke merket (EKSTRA – betales i tillegg).
4. **Verktøy og deler:** ta verktøyet fra pegboardet (det bæres mellom vinklene) og legg deler i delekassa.
5. **Reparasjon:** klikk på riktig sted på bilen med riktig verktøy → minispill. Kvalitet: dårlig / akseptabelt / godt /
   svært godt. Delene trekkes fra delekassa når jobben er ferdig.
6. **Henting:** «Kall inn kunden» → kunden kommer tilbake, reagerer på arbeidet og prisen → ta betalt på terminalen →
   bilen rygger ut gjennom porten. Først da kan neste kunde komme.

**Arbeidsdagen** er 10 virkelige minutter (07:00–17:00). Når tida er ute kommer ingen nye kunder, men bilen du har inne
gjøres ferdig. Deretter dagsrapport. Penger, biler, oppgraderinger, lager og opplåsinger følger med til neste dag.

## Feil og minispill

45 feiltyper i 8 kategorier (hjul og dekk, batteri og elektrisk, motor og service, bremser og understell, eksos og
lekkasjer, karosseri og rust, vinterproblemer, bilvask og kosmetikk), definert som data i `src/data/faults.js`.
Hver feil har sone på bilen, inspeksjoner som avslører den (med forklaring), verktøy, del, minispill, pris og opplåsing.
Nye kategorier låses opp ved 3, 6, 10, 15, 20 og 28 ferdige biler; flere og mer skjulte feil per bil etter hvert.

17 minispillmoduler i `src/ui/minigames/`: hjulbytte (stjernemønster), avbalansering, hjulstilling, batteribytte
(minus av først / pluss på først), ledninger/relé/sensor, lyspære (riktig sokkel), olje (tapping, filter, presisjonsfylling),
luftfilter (vri og moment), tennplugger (finn sylinderen som fusker), bremser (rekkefølge), støtdemper/oppheng,
timing-stramming, eksos (riktig rørform/pakning), bulk (timing-slag), formtilpasning (fanger, panel, lykt, visker),
skrubbing (vask, søle, grøft, is, rust + maling, polering i sirkler, sliping, salt – skitten forsvinner faktisk) og
måler (lading, varmepistol).

**Lakkering** er halvautomatisk: slip med lakkutstyret ved bilen → velg farge på PC-en → lakkboksen gjør jobben
(trykket kan justeres underveis for bedre resultat) → bilen får ny farge.

## Økonomi og oppgraderinger

Kunden betaler arbeid + del med påslag, justert for kvalitet og figurens betalingsvilje. Dårlig arbeid gir garantikostnad.
Deler bestilles på PC-en og leveres umiddelbart. Begrenset hyllekapasitet. Blir du blakk, foretrekker generatoren jobber
uten deler (vask, bulk, is …) så du aldri står fast.

30 oppgraderinger i 7 kategorier (`src/data/upgrades.js`), hver med pris **og** krav til antall ferdige biler (som aldri
trekkes fra), og hver med en faktisk spilleffekt (muttertrekker, presisjon, rask test, ny diagnosemaskin, lys under
løftebukken, hyllekapasitet, rabatter, lakkboks, høytrykk, verktøytralle, kaffe …).

## Kodestruktur

```
src/
  core/      rng (startpakken), bus, innstillinger, hjelpere
  data/      characters.js + vocals.js (originale), faults.js, parts.js, upgrades.js, cars.js, stories.js,
             dialogue/ (symptoms.js, cast_a.js, cast_b.js – replikkbanker for alle 30, voices.js – setter sammen samtaler)
  game/      state (felles tilstand + versjonert lagring), jobs (generator, økonomi, vurdering),
             workshop (inspeksjoner, delekasse, reparasjon, lager, oppgraderinger, lakk), flow (kunde- og dagsflyt)
  audio/     Audio.js (Web Audio, lydbilder ute/inne, looper, syntetiske verkstedlyder)
  ui/        Portrait.js (original, uendret), PortraitView, Speech, Snow, Hud, Menu, WorkOrder, Pc, icons, layout.js,
             art/furniture.js (disk, arbeidsbenk, pult, port, løftebukk som egne SVG-lag), car/CarArt.js (8 bilmodeller),
             views/ (Bay, Tools, Reception, Office), minigames/ (17 moduler + kit)
public/assets/  bg/ (Higgsfield), audio/ (NOX SOUND CC0 + startpakken)
art_src/        Higgsfield-originaler (2736×1536)
scripts/        convert-bg.mjs, convert-audio.mjs, sim.mjs
docs/           higgsfield-prompts.md, lydkilder.md, karakterprofiler/
```

`src/ui/layout.js` har alle koordinater målt i bakgrunnene. Ny bilfeil = ny post i `faults.js` (eventuelt nytt
symptom i `dialogue/symptoms.js` og ny historie i `stories.js`).

## Grafikk og lyd

- Fem bakgrunner generert med Higgsfield (FLUX 3, 2K) – se `docs/higgsfield-prompts.md`.
- Figurene tegnes med originalens SVG-system; ingen figurer er generert på nytt.
- Disk, arbeidsbenk, pegboard-verktøy, deleskuffer, delekasse, løftebukk, garasjeport, biler, PC, lakkblander og alt
  annet interaktivt er egne SVG-/DOM-lag over bakgrunnene.
- Lyd: se `docs/lydkilder.md`. Ingen musikk, ingen forteller. Lyden starter etter første klikk.
