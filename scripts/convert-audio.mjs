// Konverterer NOX SOUND-WAV (48 kHz / 24-bit / stereo) til små spillfiler: mono, 16-bit, 22 050 Hz.
// Ingen ffmpeg nødvendig. Bruk: node scripts/convert-audio.mjs <sti til Essentials_Series_NOX_SOUND>
// Lisens: NOX SOUND Essentials Series er CC0 («All these sounds are under CC0 license», README-PDF i pakken).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) { console.error('Mangler sti til NOX-mappa'); process.exit(1); }
const OUT = path.resolve('public/assets/audio');
const RATE = 22050;
const N = 'Nature_Essentials_NOX_SOUND/', E = 'Electromagnetic_NOX_SOUND/Electromagnetic_', C = 'Vehicle_Essentials_NOX_SOUND/Vehicle_Essential_Car/Vehicle_Car_';
const T = 'Vehicle_Essentials_NOX_SOUND/Vehicle_Essential_Truck/Vehicle_Truck_', S = 'Sample_A_Sound_Effect/', F = 'Footsteps_Essentials_NOX_SOUND/';

// [kilde, mål, { start, dur, loop, gain }]
const JOBS = [
  // Ambience
  [N + 'Ambiance_Wind_Forest_Loop_Stereo.wav', 'amb/out_wind_forest.wav', { start: 2, dur: 24, loop: true }],
  [N + 'Ambiance_Night_Loop_Stereo.wav', 'amb/out_night.wav', { start: 1, dur: 22, loop: true }],
  [N + 'Ambiance_Wind_Calm_Loop_Stereo.wav', 'amb/in_wind_calm.wav', { start: 1, dur: 22, loop: true }],
  [E + 'Electric_Box_Loop_Mono_Elektrousi_01.wav', 'amb/room_tone.wav', { start: 0.5, dur: 12, loop: true }],
  [E + 'Fan_Idle_Loop_Mono_Elektrousi_01.wav', 'amb/heater_fan.wav', { start: 0.5, dur: 12, loop: true }],
  [E + 'Neon_Light_Loop_Mono_Elektrousi_02.wav', 'amb/tube_hum.wav', { start: 0.5, dur: 10, loop: true }],
  [T + 'Idle_Exterior_Front_Loop_Stereo_01.wav', 'amb/far_idle.wav', { start: 1, dur: 14, loop: true }],
  ['Iceland_Packs_NOX_SOUND/Iceland_Flows_NOX_SOUND/Ambiance_Stream_Light_Skaftafell_Loop_Stereo_01.wav', 'amb/water_hose.wav', { start: 1, dur: 10, loop: true }],
  [N + 'Ambiance_Stream_Calm_Loop_Stereo.wav', 'amb/water_soft.wav', { start: 1, dur: 10, loop: true }],
  [C + 'Engine_Idle_Exterior_Loop_Mono_01.wav', 'amb/engine_idle.wav', { start: 0.5, dur: 8, loop: true }],
  [C + 'Engine_2000_RPM_Front_Exterior_Loop_Mono.wav', 'amb/engine_rev.wav', { start: 0.5, dur: 6, loop: true }],
  [C + 'Drive_Exterior_Short_Loop_Mono.wav', 'amb/car_drive.wav', { start: 0, dur: 6, loop: true }],
  [E + 'Computer_Keyboard_Loop_Mono_Elektrousi_01.wav', 'amb/keyboard.wav', { start: 0.2, dur: 6, loop: true }],
  // Effekter
  [C + 'Start_Engine_Exterior_Mono.wav', 'sfx/car_start.wav', { dur: 4 }],
  [C + 'Stop_Engine_Exterior_Mono.wav', 'sfx/car_stop.wav', { dur: 3 }],
  [C + 'Drive_Exterior_Loop_Mono.wav', 'sfx/car_pass.wav', { dur: 9 }],
  [T + 'Drive_Exterior_Loop_Stereo_01.wav', 'sfx/truck_pass.wav', { start: 1, dur: 9 }],
  [C + 'Door_Opening_Exterior_Mono_01.wav', 'sfx/car_door_open.wav', { dur: 2 }],
  [C + 'Door_Closing_Exterior_Mono_01.wav', 'sfx/car_door_close.wav', { dur: 2.2 }],
  [C + 'Keys_Mono_01.wav', 'sfx/car_keys_1.wav', { dur: 2 }],
  [C + 'Keys_Mono_02.wav', 'sfx/car_keys_2.wav', { dur: 2 }],
  [C + 'Hand_Brake_Mono_01.wav', 'sfx/ratchet_1.wav', { dur: 1.5 }],
  [C + 'Hand_Brake_Mono_02.wav', 'sfx/ratchet_2.wav', { dur: 1.5 }],
  [C + 'Electric_Window_Opening_Mono.wav', 'sfx/lift_motor_up.wav', { dur: 3.5 }],
  [C + 'Electric_Window_Closing_Mono.wav', 'sfx/lift_motor_down.wav', { dur: 3.5 }],
  [C + 'Trunk_Close_Impact_Mono.wav', 'sfx/thump.wav', { dur: 1.6 }],
  [C + 'Trunk_Open_Mono.wav', 'sfx/hood_open.wav', { dur: 2 }],
  [C + 'Horn_Exterior_Mono.wav', 'sfx/horn.wav', { dur: 1.1 }],
  [C + 'Seat_Belt_Mono_01.wav', 'sfx/clip.wav', { dur: 1.2 }],
  [C + 'Glove_Box_Interior_Mono_01.wav', 'sfx/box_open.wav', { dur: 1.4 }],
  [C + 'Wiper_Exterior_Solo_Mono.wav', 'sfx/wiper.wav', { dur: 2 }],
  [T + 'Back_Door_Opening_Exterior_Mono_01.wav', 'sfx/gdoor_open.wav', { dur: 4.5 }],
  [T + 'Back_Door_Closing_Exterior_Mono_01.wav', 'sfx/gdoor_close.wav', { dur: 4.5 }],
  [E + 'Computer_On_Sequence_Mono_Elektrousi.wav', 'sfx/pc_on.wav', { dur: 4 }],
  [E + 'Computer_Load_Mono_Elektrousi.wav', 'sfx/pc_load.wav', { dur: 2.2 }],
  [E + 'Car_Fan_Sequence_Mono_Elektrousi_01.wav', 'sfx/booth_fan.wav', { start: 0.5, dur: 7 }],
  [F + 'Footsteps_DirtyGround/Footsteps_DirtyGround_Walk/Footsteps_DirtyGround_Walk_01.wav', 'sfx/step_conc_1.wav', { dur: 0.7 }],
  [F + 'Footsteps_DirtyGround/Footsteps_DirtyGround_Walk/Footsteps_DirtyGround_Walk_03.wav', 'sfx/step_conc_2.wav', { dur: 0.7 }],
  [F + 'Footsteps_DirtyGround/Footsteps_DirtyGround_Walk/Footsteps_DirtyGround_Walk_05.wav', 'sfx/step_conc_3.wav', { dur: 0.7 }],
  [F + 'Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_01.wav', 'sfx/step_snow_3.wav', { dur: 0.8 }],
  [F + 'Footsteps_Snow/Footsteps_Snow_Walk/Footsteps_Snow_Walk_02.wav', 'sfx/step_snow_4.wav', { dur: 0.8 }],
  [S + 'Household_Door_Wood_Open_Stereo.wav', 'sfx/door_entrance.wav', { dur: 3 }],
  [S + 'Household_Closet_Key_Insertion_Stereo.wav', 'sfx/key_insert.wav', { dur: 1.6 }],
  [S + 'Backpack_Medium_Polyester_Drop_Stereo.wav', 'sfx/part_drop.wav', { dur: 1.2 }],
];

function readWav(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Error('Ikke WAV: ' + file);
  let off = 12, fmt = null, data = null;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === 'fmt ') fmt = { format: b.readUInt16LE(off + 8), ch: b.readUInt16LE(off + 10), rate: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    else if (id === 'data') data = b.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size & 1);
  }
  if (!fmt || !data) throw new Error('Mangler fmt/data: ' + file);
  if (fmt.format === 0xfffe) fmt.format = fmt.bits === 32 ? 3 : 1; // WAVE_FORMAT_EXTENSIBLE
  const bps = fmt.bits / 8, frames = Math.floor(data.length / (bps * fmt.ch));
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < fmt.ch; c++) {
      const p = (i * fmt.ch + c) * bps;
      let v;
      if (fmt.format === 3) v = data.readFloatLE(p);
      else if (fmt.bits === 16) v = data.readInt16LE(p) / 32768;
      else if (fmt.bits === 24) v = data.readIntLE(p, 3) / 8388608;
      else if (fmt.bits === 32) v = data.readInt32LE(p) / 2147483648;
      else throw new Error('Ukjent bitdybde ' + fmt.bits);
      s += v;
    }
    out[i] = s / fmt.ch;
  }
  return { rate: fmt.rate, samples: out };
}

function resample(src, from, to) {
  if (from === to) return src;
  const k = Math.max(1, Math.round(from / to)); // enkel lavpass før nedsampling
  const lp = new Float32Array(src.length);
  let acc = 0;
  for (let i = 0; i < src.length; i++) { acc += src[i]; if (i >= k) acc -= src[i - k]; lp[i] = acc / Math.min(i + 1, k); }
  const n = Math.floor(src.length * to / from), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * from / to, i0 = Math.floor(x), f = x - i0;
    out[i] = lp[i0] * (1 - f) + lp[Math.min(i0 + 1, lp.length - 1)] * f;
  }
  return out;
}

function writeWav(file, s) {
  const b = Buffer.alloc(44 + s.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(s.length * 2, 40);
  for (let i = 0; i < s.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s[i])) * 32767), 44 + i * 2);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, b);
}

for (const [src, dst, o] of JOBS) {
  const full = path.join(ROOT, src);
  if (!fs.existsSync(full)) { console.warn('MANGLER', src); continue; }
  const { rate, samples } = readWav(full);
  let s = resample(samples, rate, RATE);
  const a = Math.min(Math.floor((o.start || 0) * RATE), Math.max(0, s.length - RATE));
  const len = Math.min(s.length - a, Math.floor((o.dur || 999) * RATE));
  s = s.slice(a, a + len);
  if (o.loop) {
    // Sømløs loop: kryssfade slutten inn i starten
    const xf = Math.min(Math.floor(RATE * 1.2), Math.floor(s.length / 3)), outS = new Float32Array(s.length - xf);
    for (let i = 0; i < outS.length; i++) outS[i] = s[i];
    for (let i = 0; i < xf; i++) { const t = i / xf; outS[i] = s[s.length - xf + i] * (1 - t) + s[i] * t; }
    s = outS;
  } else {
    const fi = Math.min(Math.floor(RATE * 0.005), s.length), fo = Math.min(Math.floor(RATE * 0.08), s.length);
    for (let i = 0; i < fi; i++) s[i] *= i / fi;
    for (let i = 0; i < fo; i++) s[s.length - 1 - i] *= i / fo;
  }
  let peak = 0; for (const v of s) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? Math.min(4, 0.7 / peak) * (o.gain || 1) : 1; // toppnivå −3 dB
  for (let i = 0; i < s.length; i++) s[i] *= g;
  writeWav(path.join(OUT, dst), s);
  console.log('OK', dst, (s.length / RATE).toFixed(1) + 's');
}
