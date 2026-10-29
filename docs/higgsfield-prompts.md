# VERKSTED69 – Higgsfield-bakgrunner

## Status (29.10.2026)
Godkjent tak: 21 kreditter. **Brukt: 18 kreditter** (6 bilder × 3, FLUX 3 Image, 2K, 16:9). Saldo før: 27,45, etter: 9,45.

| Bilde | Fil | Merknad |
|---|---|---|
| Mottak v1 | `art_src/center_v1.png` (forkastet) | Lignet for mye på MOTELL69-resepsjonen (gult panel, glassdør, vindu, klokke) |
| Verktøyveggen | `art_src/tools_v1.png` → `public/assets/bg/tools.jpg` | Tomt pegboard – verktøyene er egne SVG-lag |
| Hallen / løftebukk | `art_src/bay_v1.png` → `bay.jpg` | Garasjeport til venstre; tomt gulv for bil og løftebukk (SVG) |
| Kontor og lakk | `art_src/office_v1.png` → `office.jpg` | Tomt gulv for pulten (SVG) |
| Mottak v2 | `art_src/center_v2.png` → `reception.jpg` | Ny versjon med tydelig verkstedidentitet: dekkreol, oljekanner, vindu inn mot løftebukken |
| Meny | `art_src/menu_v1.png` → `menu.jpg` | Verkstedet utenfra med skilt «VERKSTED 69» |

Skalert til 1920×1080 JPG med `node scripts/convert-bg.mjs`. Koordinater for interaktive lag: `src/ui/layout.js`.

## Stilreferanser (lastet opp)
- `ref_kiosk_center.jpg` – KIOSK69-interiør fra startpakken (strek og lys).
- `ref_motell_center.jpg` – MOTELL69-resepsjonen (strek, tekstur).
- `ref_motell_menu.jpg` – MOTELL69-menyen (nattehimmel, snø, fjell – kun stemning, ikke bygningen).
Etter det første bildet ble verkstedbildene selv brukt som referanse, så alle innendørsscenene er samme bygning.

## Prinsipper
- Samme håndtegnede graphic novel-strek som serien, men et nytt miljø: betongblokk, stålbjelker, rør, kjettingtalje,
  oljeflekker, dekk, garasjeport, oljekanner – ingen kopi av resepsjons-/kiosk-komposisjonene.
- Det nedre partiet (der disk, benk, pult og bil skal stå) er bedt om tomt, slik at forgrunnen er egne SVG-lag.
  Ingen ferdig disk i bakgrunnen (lærdom fra MOTELL69).

## Prompter (forkortet stilblokk først i hver)
> Hand-drawn 2D graphic-novel illustration for a video game background, thick black ink outlines, cross-hatching,
> gritty grain and grime texture, worn dirty surfaces, slightly grotesque comic style, muted colours … SAME old
> Northern Norwegian car repair workshop … No people, no logos, no readable text. Not photorealistic, not 3D. 16:9.

1. **Verktøyvegg:** camera facing the tool wall; one very large EMPTY perforated pegboard (64 % × 46 %, top at 10 %);
   frosty window left, metal locker right, caged work lamps; lower 38 % empty – no workbench.
2. **Hallen:** main repair bay; closed sectional garage door on the LEFT of the back wall (40 % × 58 %); concrete blocks,
   steel I-beams, chain hoist, hose reel, heater fan, exhaust pipes and fan belts on nails, oil drum, tyres, compressor;
   central floor completely empty – no car, no lift.
3. **Kontor/lakk:** office nook (window, cork board with invoices, calendar, filing cabinet) and paint-mixing corner
   (shelf of paint tins, plastic spray curtain, spray gun, extractor fan); lower 38 % empty – no desk.
4. **Mottak v2:** customer drop-off: steel-framed glass entrance door, tyre rack, wide interior window into the bay
   with a red two-post lift (no car), hazard-striped doorway, oil cans, coffee machine; lower 40 % empty floor.
5. **Meny:** shabby workshop by a dark road at night; corrugated metal and concrete, snowy roof with icicles, two
   garage doors, sign «VERKSTED 69», old 1980s car in the snow, tyres, oil drum, fuel pump, street lamp, snow poles,
   spruce forest and mountains; left third darker for title and buttons.
