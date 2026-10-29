# Lydkilder og lisenser

## NOX SOUND – Essentials Series (CC0)
Lisens bekreftet i `Essentials_Series_README.pdf` i lydpakken: «All these sounds are under CC0 license.»
Konvertert med `node scripts/convert-audio.mjs <NOX-mappe>` (mono, 16-bit, 22 050 Hz, normalisert, sømløse looper).

| Fil i spillet | Kilde | Brukes til |
|---|---|---|
| amb/out_wind_forest.wav | Nature/Ambiance_Wind_Forest_Loop | Meny: vintervind (hovedlaget) |
| amb/out_night.wav | Nature/Ambiance_Night_Loop | Meny: svak nattbakgrunn |
| amb/far_idle.wav | Truck/Idle_Exterior_Front_Loop_01 | Meny: en lastebil som går på tomgang langt unna |
| amb/in_wind_calm.wav | Nature/Ambiance_Wind_Calm_Loop | Inne: vind gjennom veggene (lavpass, åpner seg når porten går opp) |
| amb/room_tone.wav | Electromagnetic/Electric_Box_Loop_01 | Inne: svak romtone (lavt i miksen) |
| amb/heater_fan.wav | Electromagnetic/Fan_Idle_Loop_01 | Inne: varmeviften på veggen |
| amb/tube_hum.wav | Electromagnetic/Neon_Light_Loop_02 | Inne: lysrør (svært lavt – ingen konstant summing) |
| amb/engine_idle.wav, engine_rev.wav | Car/Engine_Idle_Exterior_Loop_01, Engine_2000_RPM_Front | Motortest, utkjøring |
| amb/car_drive.wav | Car/Drive_Exterior_Short_Loop | Bilen kjører inn/ut |
| amb/water_hose.wav, water_soft.wav | Iceland/Stream_Light_Skaftafell_01, Nature/Stream_Calm | Bilvask og spyling |
| amb/keyboard.wav | Electromagnetic/Computer_Keyboard_Loop_01 | Reserve (PC) |
| sfx/car_start, car_stop | Car/Start_Engine, Stop_Engine | Motor |
| sfx/car_pass, truck_pass | Car/Drive_Exterior_Loop, Truck/Drive_Exterior_Loop_01 | Biler på veien (meny og dempet inne) |
| sfx/car_door_open/close | Car/Door_Opening/Closing_Exterior_01 | Førerdøra |
| sfx/car_keys_1–2 | Car/Keys_01–02 | Bilnøkkelen leveres |
| sfx/ratchet_1–2 | Car/Hand_Brake_01–02 | Skralle (håndbrekkets klikk) |
| sfx/lift_motor_up/down | Car/Electric_Window_Opening/Closing | Løftebukkens motor |
| sfx/thump, hood_open | Car/Trunk_Close_Impact, Trunk_Open | Panser og tunge deler |
| sfx/horn, clip, box_open, wiper | Car/Horn, Seat_Belt_01, Glove_Box_01, Wiper_Solo | Klips, deleskuffer, viskere |
| sfx/gdoor_open/close | Truck/Back_Door_Opening/Closing_Exterior_01 | Garasjeporten (sammen med syntetisk rulling) |
| sfx/pc_on, pc_load | Electromagnetic/Computer_On_Sequence, Computer_Load | PC-en |
| sfx/booth_fan | Electromagnetic/Car_Fan_Sequence_01 | Lakkboksens vifte |
| sfx/step_conc_1–3, step_snow_3–4 | Footsteps/DirtyGround_Walk_01/03/05, Snow_Walk_01/02 | Fottrinn |
| sfx/door_entrance, key_insert, part_drop | Sample/Door_Wood_Open, Closet_Key_Insertion, Backpack_Medium_Drop | Inngangsdør, dørlås, deler i kassa |

## Fra startpakken (opprinnelig NOX SOUND CC0)
`amb/wind.wav` (andre vindlag på menyen), `amb/wind_calm.wav`, `amb/neon_hum.wav`, `sfx/button_*`, `sfx/key_*`,
`sfx/paper_*`, `sfx/pickup`, `sfx/put_down`, `sfx/clasp`, `sfx/thud`, `sfx/door_open`, `sfx/step_snow_1–2`,
`sfx/step_tile_*` og alle `voice/*` (korte stemmelyder – aldri én lyd per bokstav).

## Syntetiske lyder (Web Audio, laget i koden)
Finnes ikke i lydpakkene, så de er generert i stedet for å bruke filer med ukjent lisens: metallklang, hammer mot metall,
muttertrekker, skiftenøkkel, bolt ut, gnist, helling og tapping av olje, skrubbing/skraping/sliping/polering, sprøyting,
varmepistol, startmotor som drar, klikk-klikk fra startrelé, motorfusking, bremsehvin og -skraping, skrangling, knirk fra
støtdemper, garasjeportens rulling, kasseapparat, levering, oppgradering, dørbjelle, lysrørflimmer, drypp, radiator.

## Miks
Meny: to vindlag med egne vindkast og stille perioder, svak natt, lastebil langt unna. Inne: dempet vind, varmevifte og
romtone lavt; vinden blir tydelig når inngangsdøra eller garasjeporten går. Situasjonslyder (motor, vann) startes og
stoppes av spillet. Kompressor på masterbussen mot klipping, grense på samtidige effekter og minsteavstand mellom like
lyder mot lydspam. Egne volumer for hoved, ambience, lydeffekter og stemmer, pluss mute.
