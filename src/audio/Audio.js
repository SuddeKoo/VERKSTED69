// Lydmotor (Web Audio). Bygget på lydmotoren fra MOTELL69/startpakken, med verkstedets egne lydbilder.
// Filer: NOX SOUND Essentials (CC0) + startpakkens utvalgte WAV-er. Det lydpakken ikke har (skralle,
// muttertrekker, hammer mot metall, sprøytepistol, kasseapparat, minispill-lyder) lages syntetisk.
// Ingen musikk, ingen forteller.
import { vocalProfile, vocalSound } from '../data/vocals.js';

const BASE = 'assets/audio/';

export const SOUND_MAP = {
  click: ['sfx/button_1.wav', 'sfx/button_2.wav'],
  pickup: ['sfx/pickup.wav'],
  put: ['sfx/put_down.wav'],
  paper: ['sfx/paper_1.wav', 'sfx/paper_2.wav'],
  clasp: ['sfx/clasp.wav'],
  thud: ['sfx/thud.wav'],
  keys: ['sfx/car_keys_1.wav', 'sfx/car_keys_2.wav', 'sfx/key_1.wav'],
  key_insert: ['sfx/key_insert.wav'],
  door: ['sfx/door_entrance.wav', 'sfx/door_open.wav'],
  step: ['sfx/step_conc_1.wav', 'sfx/step_conc_2.wav', 'sfx/step_conc_3.wav'],
  step_snow: ['sfx/step_snow_1.wav', 'sfx/step_snow_2.wav', 'sfx/step_snow_3.wav', 'sfx/step_snow_4.wav'],
  car_start: ['sfx/car_start.wav'],
  car_stop: ['sfx/car_stop.wav'],
  car_pass: ['sfx/car_pass.wav'],
  truck_pass: ['sfx/truck_pass.wav'],
  car_door_open: ['sfx/car_door_open.wav'],
  car_door_close: ['sfx/car_door_close.wav'],
  ratchet: ['sfx/ratchet_1.wav', 'sfx/ratchet_2.wav'],
  lift_up: ['sfx/lift_motor_up.wav'],
  lift_down: ['sfx/lift_motor_down.wav'],
  thump: ['sfx/thump.wav'],
  hood: ['sfx/hood_open.wav'],
  horn: ['sfx/horn.wav'],
  clip: ['sfx/clip.wav'],
  box: ['sfx/box_open.wav'],
  wiper: ['sfx/wiper.wav'],
  gdoor_open: ['sfx/gdoor_open.wav'],
  gdoor_close: ['sfx/gdoor_close.wav'],
  pc_on: ['sfx/pc_on.wav'],
  pc_load: ['sfx/pc_load.wav'],
  booth_fan: ['sfx/booth_fan.wav'],
  part_drop: ['sfx/part_drop.wav'],
  m_laugh: ['voice/m_laugh_1.wav', 'voice/m_laugh_2.wav'],
  f_laugh: ['voice/f_laugh_1.wav', 'voice/f_laugh_2.wav'],
  m_sigh: ['voice/m_sigh_1.wav', 'voice/m_sigh_2.wav'],
  f_sigh: ['voice/f_sigh_1.wav', 'voice/f_sigh_2.wav'],
  m_surprise: ['voice/m_surprise_1.wav', 'voice/m_surprise_2.wav'],
  f_surprise: ['voice/f_surprise_1.wav'],
  m_hmm: ['voice/m_hmm_1.wav', 'voice/m_hmm_2.wav'],
  f_hmm: ['voice/f_hmm_1.wav', 'voice/f_hmm_2.wav'],
  m_nod: ['voice/m_nod_1.wav', 'voice/m_nod_2.wav'],
  f_nod: ['voice/f_nod_1.wav', 'voice/f_nod_2.wav'],
  m_breath: ['voice/m_breath_1.wav', 'voice/m_breath_2.wav', 'voice/m_breath_3.wav'],
  f_breath: ['voice/f_breath_1.wav', 'voice/f_breath_2.wav', 'voice/f_breath_3.wav'],
  f_sniff: ['voice/f_sniff.wav'],
  m_grunt: ['voice/m_grunt_1.wav', 'voice/m_grunt_2.wav'],
  f_grunt: ['voice/f_grunt_1.wav', 'voice/f_grunt_2.wav'],
  m_nervous: ['voice/m_nervous.wav'],
  f_nervous: ['voice/f_nervous.wav'],
  m_throat: ['voice/m_throat.wav', 'voice/m_cough.wav'],
  f_throat: ['voice/f_throat.wav', 'voice/f_cough.wav'],
};

export const AMBIENCE_MAP = {
  out_wind: 'amb/out_wind_forest.wav',
  wind_old: 'amb/wind.wav',            // andre vindlag (startpakken, NOX SOUND CC0)
  out_night: 'amb/out_night.wav',
  far_idle: 'amb/far_idle.wav',        // en lastebil som står og går et sted langt borte
  in_wind: 'amb/in_wind_calm.wav',
  room_tone: 'amb/room_tone.wav',
  heater: 'amb/heater_fan.wav',
  tube: 'amb/tube_hum.wav',
  // Situasjonslooper (startes/stoppes av spillet)
  engine_idle: 'amb/engine_idle.wav',
  engine_rev: 'amb/engine_rev.wav',
  car_drive: 'amb/car_drive.wav',
  water: 'amb/water_hose.wav',
  water_soft: 'amb/water_soft.wav',
  keyboard: 'amb/keyboard.wav',
};

// Lydbilder (før gruppevolum). Ute: vinden dominerer, en tomgangsdur langt unna, nesten ingen summing.
// Inne: dempet vind gjennom veggene, svak varmevifte og romtone – aldri en høy konstant elektrisk summing.
const SCENES = {
  outdoor: { out_wind: 0.74, wind_old: 0.36, out_night: 0.1, far_idle: 0.035 },
  indoor: { in_wind: 0.32, room_tone: 0.03, heater: 0.05, tube: 0.012 },
  silent: {},
};
const WIND = { out_wind: 2600, wind_old: 1800, in_wind: 520 };
const WEATHER = {
  outdoor: { loops: ['out_wind', 'wind_old'], every: [4, 11], strength: [1.25, 2.1], calm: 0.55 },
  indoor: { loops: ['in_wind'], every: [12, 28], strength: [1.2, 1.7], calm: 0.8 },
};
// Situasjonslooper som er «utendørs» filtreres når porten er lukket
const SITUATION = ['engine_idle', 'engine_rev', 'car_drive', 'water', 'water_soft', 'keyboard'];

export class Audio {
  constructor(settings) {
    this.settings = settings;
    this.ctx = null;
    this.buffers = new Map();
    this.loading = new Map();
    this.loops = new Map();
    this.lastPick = {};
    this.voiceBusyUntil = 0;
    this.active = 0;
    this.lastPlayed = {};
    this.scene = 'silent';
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.comp = this.ctx.createDynamicsCompressor(); // hindrer klipping når mye skjer samtidig
      this.comp.threshold.value = -10; this.comp.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.connect(this.comp).connect(this.ctx.destination);
      this.groups = {};
      for (const g of ['sfx', 'amb', 'voice']) { this.groups[g] = this.ctx.createGain(); this.groups[g].connect(this.master); }
      // Dempet «utenfra»-filter (biler på veien, ting bak en vegg)
      this.muffle = this.ctx.createBiquadFilter();
      this.muffle.type = 'lowpass'; this.muffle.frequency.value = 900;
      this.muffle.connect(this.groups.sfx);
      // Garasjeporten: lukket port demper alt som skjer ute
      this.outside = this.ctx.createBiquadFilter();
      this.outside.type = 'lowpass'; this.outside.frequency.value = 700;
      this.outside.connect(this.groups.sfx);
      this.applyVolumes();
      this.preload(['click', 'step', 'pickup', 'put', 'ratchet', 'clip', 'paper', 'door']);
      if (this.pendingScene) this.setScene(this.pendingScene);
    } catch (e) {
      console.warn('Lyd utilgjengelig:', e);
    }
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = this.settings, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.05);
    this.groups.sfx.gain.setTargetAtTime(s.sfx, t, 0.05);
    this.groups.amb.gain.setTargetAtTime(s.amb, t, 0.05);
    this.groups.voice.gain.setTargetAtTime(s.voice, t, 0.05);
  }

  /** Åpen port slipper lyden utenfra inn (vind, biler som kommer) */
  setGarageOpen(k) {
    if (!this.ctx) return;
    this.outside.frequency.setTargetAtTime(700 + k * 6000, this.ctx.currentTime, 0.3);
    const e = this.loops.get('in_wind');
    if (e) e.filter?.frequency.setTargetAtTime(WIND.in_wind + k * 2600, this.ctx.currentTime, 0.4);
  }

  async load(path) {
    if (this.buffers.has(path)) return this.buffers.get(path);
    if (this.loading.has(path)) return this.loading.get(path);
    const p = fetch(BASE + path)
      .then((r) => { if (!r.ok) throw new Error(path); return r.arrayBuffer(); })
      .then((ab) => this.ctx.decodeAudioData(ab))
      .then((buf) => { this.buffers.set(path, buf); return buf; })
      .catch(() => { this.buffers.set(path, null); return null; });
    this.loading.set(path, p);
    return p;
  }

  preload(names) {
    if (!this.ctx) return;
    for (const n of names) for (const f of SOUND_MAP[n] || []) this.load(f);
  }

  pickFile(name) {
    const files = SOUND_MAP[name];
    if (!files) return null;
    let i = Math.floor(Math.random() * files.length);
    if (files.length > 1 && i === this.lastPick[name]) i = (i + 1) % files.length;
    this.lastPick[name] = i;
    return files[i];
  }

  /** opts: { volume, rate, group, delay, vary, muffled, outside, gap } */
  async play(name, opts = {}) {
    if (!this.ctx || this.settings.muted) return null;
    // Mot lydspam: samme lyd kan ikke starte oftere enn «gap» sekunder
    const now = this.ctx.currentTime, gap = opts.gap ?? 0.045;
    if (!opts.delay && now - (this.lastPlayed[name] || -9) < gap) return null;
    this.lastPlayed[name] = now;
    if (name === 'door' && !opts.muffled) this.doorDraft(opts.delay || 0);
    if (this.active > 12 && (opts.group || 'sfx') === 'sfx') return null;
    const file = this.pickFile(name);
    if (!file) return this.synth(name, opts);
    const buf = await this.load(file);
    if (!buf) return null;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const vary = opts.vary ?? 0.05;
    src.playbackRate.value = (opts.rate || 1) * (1 + (Math.random() * 2 - 1) * vary);
    const g = this.ctx.createGain();
    g.gain.value = (opts.volume ?? 1) * (1 + (Math.random() * 2 - 1) * 0.08);
    src.connect(g).connect(opts.muffled ? this.muffle : opts.outside ? this.outside : this.groups[opts.group || 'sfx']);
    this.active++;
    src.onended = () => { this.active--; };
    src.start(this.ctx.currentTime + (opts.delay || 0));
    return src;
  }

  /** Kort vokallyd (kremt, humring, sukk) etter karakterens profil. Aldri én lyd per bokstav. */
  vocal(ch, situation) {
    if (!this.ctx || !ch) return;
    const now = this.ctx.currentTime;
    if (now < this.voiceBusyUntil) return;
    const prof = vocalProfile(ch);
    const sit = prof[situation] || prof.talk;
    if (Math.random() > sit.p) return;
    const kind = weighted(sit.mix);
    const name = vocalSound(kind, ch.voice?.type);
    this.voiceBusyUntil = now + 1.2;
    this.play(name, { group: 'voice', rate: (prof.rate || 1) * (ch.voice?.pitch ? 0.85 + ch.voice.pitch * 0.15 : 1), vary: 0.04, volume: 0.8 });
  }

  // ── Looper ──
  async loop(name, volume = 1, fade = 1.5, opts = {}) {
    if (!this.ctx) return;
    const cur = this.loops.get(name);
    if (cur) {
      cur.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, fade / 3);
      if (opts.rate && cur.src) cur.src.playbackRate.setTargetAtTime(opts.rate, this.ctx.currentTime, 0.2);
      return;
    }
    const entry = { gain: this.ctx.createGain(), mod: this.ctx.createGain(), filter: null, src: null };
    entry.gain.gain.value = 0;
    entry.gain.connect(entry.mod);
    if (WIND[name]) {
      entry.filter = this.ctx.createBiquadFilter();
      entry.filter.type = 'lowpass'; entry.filter.frequency.value = WIND[name]; entry.filter.Q.value = 0.4;
      entry.mod.connect(entry.filter).connect(this.groups.amb);
    } else entry.mod.connect(SITUATION.includes(name) ? this.groups.sfx : this.groups.amb);
    this.loops.set(name, entry);
    const buf = await this.load(AMBIENCE_MAP[name]);
    if (!buf || this.loops.get(name) !== entry) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    if (opts.rate) src.playbackRate.value = opts.rate;
    src.connect(entry.gain);
    src.start(0, Math.random() * buf.duration);
    entry.src = src;
    entry.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, fade / 3);
  }

  /** Justere en løkke som går (turtall, volum) */
  tweak(name, { volume, rate } = {}) {
    const e = this.loops.get(name);
    if (!e || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (volume != null) e.gain.gain.setTargetAtTime(volume, t, 0.08);
    if (rate != null && e.src) e.src.playbackRate.setTargetAtTime(rate, t, 0.08);
  }

  stopLoop(name, fade = 1.2) {
    const e = this.loops.get(name);
    if (!e || !this.ctx) return;
    this.loops.delete(name);
    e.gain.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
    setTimeout(() => { try { e.src?.stop(); } catch { /* stoppet */ } e.gain.disconnect(); e.mod.disconnect(); e.filter?.disconnect(); }, fade * 1000 + 300);
  }

  stopSituation() { for (const n of SITUATION) this.stopLoop(n, 0.4); }

  /** Kryssfade mellom lydbilder (meny ute → verksted inne). */
  setScene(name, fade = 2) {
    this.scene = name;
    if (!this.ctx) { this.pendingScene = name; return; }
    const want = SCENES[name] || {};
    for (const k of [...this.loops.keys()]) if (!(k in want) && !SITUATION.includes(k)) this.stopLoop(k, fade);
    if (name !== 'indoor') this.stopSituation();
    for (const [k, v] of Object.entries(want)) this.loop(k, v, fade);
    this.weather();
  }

  weather() {
    clearTimeout(this.weatherTimer);
    const w = WEATHER[this.scene];
    if (!w || !this.ctx) return;
    const next = () => {
      if (WEATHER[this.scene] !== w) return;
      if (Math.random() < 0.18) this.lull(w); else this.gust(w.strength[0] + Math.random() * (w.strength[1] - w.strength[0]));
      this.weatherTimer = setTimeout(next, (w.every[0] + Math.random() * (w.every[1] - w.every[0])) * 1000);
    };
    this.weatherTimer = setTimeout(next, 2500 + Math.random() * 3000);
  }

  gust(k = this.scene === 'outdoor' ? 1.8 : 1.4, opts = {}) {
    if (!this.ctx) return;
    const w = WEATHER[this.scene];
    if (!w) return;
    const t = this.ctx.currentTime;
    const rise = opts.rise ?? 0.6 + Math.random() * 1.4, hold = opts.hold ?? 0.6 + Math.random() * 2.2, fall = opts.fall ?? 1.2 + Math.random() * 2.4;
    w.loops.forEach((name, i) => {
      const e = this.loops.get(name);
      if (!e) return;
      const at = t + i * (0.15 + Math.random() * 0.5), kk = i ? 1 + (k - 1) * (0.5 + Math.random() * 0.6) : k;
      e.mod.gain.cancelScheduledValues(at);
      e.mod.gain.setTargetAtTime(kk, at, rise / 3);
      e.mod.gain.setTargetAtTime(1, at + rise + hold, fall / 3);
    });
  }

  lull(w) {
    const t = this.ctx.currentTime;
    for (const name of w.loops) {
      const e = this.loops.get(name);
      if (!e) continue;
      e.mod.gain.cancelScheduledValues(t);
      e.mod.gain.setTargetAtTime(w.calm, t, 1.2);
      e.mod.gain.setTargetAtTime(1, t + 3 + Math.random() * 3, 1.5);
    }
  }

  /** Inngangsdøra eller porten åpnes: vinden blir tydelig et øyeblikk. */
  doorDraft(delay = 0, k = 2.2) {
    if (this.scene !== 'indoor') return;
    setTimeout(() => this.gust(k, { rise: 0.25, hold: 1.1, fall: 2.2 }), delay * 1000);
  }

  // ── Syntetiske lyder (finnes ikke i lydpakkene) ──
  synth(name, opts = {}) {
    if (!this.ctx) return null;
    const t = this.ctx.currentTime + (opts.delay || 0);
    const vol = opts.volume ?? 1;
    const out = opts.muffled ? this.muffle : opts.outside ? this.outside : this.groups.sfx;
    const tone = (freq, dur, type = 'sine', v = 0.2, start = t, glide = 0) => {
      const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, start);
      if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * glide), start + dur);
      g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(v * vol, start + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g).connect(out); o.start(start); o.stop(start + dur + 0.05);
    };
    const n = (dur, f, v, s = t, type = 'bandpass', q = 0.8) => this.noise(dur, f, v * vol, s, out, type, q);
    switch (name) {
      case 'hover': tone(1400, 0.04, 'triangle', 0.025); break;
      case 'good': tone(660, 0.1, 'triangle', 0.08); tone(990, 0.16, 'triangle', 0.08, t + 0.1); break;
      case 'bad': tone(220, 0.22, 'sawtooth', 0.05); tone(165, 0.3, 'sawtooth', 0.05, t + 0.16); break;
      case 'wrong': tone(180, 0.12, 'square', 0.04); tone(140, 0.16, 'square', 0.04, t + 0.1); break;
      case 'bell': for (let k = 0; k < 2; k++) { const s = t + k * 0.16; tone(1760, 1.1, 'sine', 0.09 / (k + 1), s); tone(1760 * 2.76, 0.4, 'sine', 0.03, s); } break;
      case 'clank': // metall mot metall (verktøy på benken, nøkkel som slår)
        tone(1250 + Math.random() * 300, 0.35, 'triangle', 0.07); tone(2870, 0.18, 'sine', 0.04); tone(4100, 0.08, 'sine', 0.03); n(0.04, 3000, 0.25); break;
      case 'tool_hang': tone(980, 0.25, 'triangle', 0.05); n(0.05, 2400, 0.18); break;
      case 'hammer': n(0.05, 900, 0.6); tone(420, 0.25, 'triangle', 0.12); tone(1680, 0.12, 'sine', 0.05); break;
      case 'impact': // muttertrekker: brrrt
        for (let i = 0; i < 9; i++) { n(0.03, 1400, 0.22, t + i * 0.045); tone(95, 0.04, 'square', 0.04, t + i * 0.045); }
        tone(170, 0.42, 'sawtooth', 0.025, t, 1.3); break;
      case 'wrench': for (let i = 0; i < 4; i++) { n(0.02, 3200, 0.2, t + i * 0.07); tone(2400, 0.02, 'square', 0.015, t + i * 0.07); } break;
      case 'bolt_out': n(0.06, 2000, 0.15); tone(3200, 0.12, 'sine', 0.04, t + 0.05); break;
      case 'spark': for (let i = 0; i < 5; i++) n(0.02, 5000 + Math.random() * 3000, 0.25, t + i * 0.03); tone(60, 0.15, 'sawtooth', 0.05); break;
      case 'pour': for (let i = 0; i < 6; i++) tone(220 + Math.random() * 160, 0.09, 'sine', 0.05, t + i * 0.11, 0.7); n(0.6, 700, 0.06, t, 'lowpass'); break;
      case 'drain': n(1.2, 500, 0.12, t, 'lowpass'); for (let i = 0; i < 8; i++) tone(160 + Math.random() * 100, 0.1, 'sine', 0.03, t + i * 0.14, 0.6); break;
      case 'scrub': n(0.12, 1800 + Math.random() * 1500, 0.07, t, 'bandpass', 1.2); break;
      case 'scrape': n(0.14, 4200, 0.09, t, 'highpass', 0.6); break;
      case 'grind': n(0.16, 2600, 0.12, t, 'bandpass', 3); tone(510, 0.16, 'sawtooth', 0.02); break;
      case 'polish': n(0.16, 1100, 0.04, t, 'bandpass', 0.5); break;
      case 'spray': n(0.5, 6000, 0.08, t, 'highpass', 0.3); break;
      case 'hiss': n(0.4, 3500, 0.07, t, 'highpass', 0.4); break;
      case 'heat': n(0.3, 800, 0.06, t, 'lowpass'); tone(110, 0.3, 'sawtooth', 0.012); break;
      case 'crank': // startmotoren drar: rrr-rrr
        for (let i = 0; i < (opts.n || 6); i++) { tone(70 + (opts.slow ? 0 : 20), 0.16, 'sawtooth', 0.06, t + i * (opts.slow ? 0.32 : 0.2)); n(0.1, 300, 0.12, t + i * (opts.slow ? 0.32 : 0.2), 'lowpass'); }
        break;
      case 'click2': n(0.02, 2200, 0.35); n(0.02, 2200, 0.3, t + 0.35); break;
      case 'sputter': for (let i = 0; i < 4; i++) { n(0.07, 220, 0.45, t + i * 0.13 + Math.random() * 0.05, 'lowpass'); } break;
      case 'squeal': tone(3100, 0.7, 'sine', 0.04, t, 1.04); tone(3170, 0.7, 'sine', 0.03, t); break;
      case 'grindbrake': n(0.6, 1600, 0.12, t, 'bandpass', 4); tone(240, 0.6, 'sawtooth', 0.018); break;
      case 'rattle': for (let i = 0; i < 7; i++) n(0.03, 2600, 0.18, t + i * 0.06 + Math.random() * 0.03); break;
      case 'creak': tone(140, 0.5, 'sawtooth', 0.02, t, 1.4); n(0.4, 900, 0.04, t, 'bandpass', 6); break;
      case 'pop': tone(300, 0.08, 'sine', 0.08, t, 0.4); n(0.03, 1200, 0.2); break;
      case 'snap': n(0.03, 3600, 0.3); tone(1900, 0.05, 'square', 0.03); break;
      case 'rollup': // garasjeporten: panelene ruller over hjulene
        for (let i = 0; i < 14; i++) { n(0.05, 900 + Math.random() * 600, 0.14, t + i * 0.15); tone(140, 0.06, 'triangle', 0.02, t + i * 0.15); }
        n(2.2, 260, 0.08, t, 'lowpass'); break;
      case 'register': // kasseapparat: klikk-klikk-pling
        n(0.03, 2500, 0.3); n(0.03, 2500, 0.3, t + 0.09); n(0.12, 600, 0.25, t + 0.2, 'lowpass'); tone(2093, 0.9, 'sine', 0.06, t + 0.3); tone(2637, 0.7, 'sine', 0.035, t + 0.3); break;
      case 'deliver': tone(523, 0.12, 'triangle', 0.06); tone(659, 0.12, 'triangle', 0.06, t + 0.08); n(0.2, 400, 0.2, t + 0.14, 'lowpass'); break;
      case 'upgrade': [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.06, t + i * 0.09)); break;
      case 'unlock': [392, 523, 659].forEach((f, i) => tone(f, 0.3, 'sine', 0.06, t + i * 0.12)); break;
      case 'done': tone(880, 0.12, 'triangle', 0.07); tone(1320, 0.3, 'triangle', 0.07, t + 0.1); break;
      case 'beep': tone(1200, 0.08, 'square', 0.03); break;
      case 'beep_lo': tone(600, 0.12, 'square', 0.03); break;
      case 'tick': n(0.01, 3000, 0.12); break;
      case 'flicker': for (let i = 0; i < 3; i++) tone(120, 0.05, 'sawtooth', 0.02, t + i * 0.11); break;
      case 'drip': tone(1400, 0.06, 'sine', 0.04, t, 0.5); break;
      case 'radiator': for (let i = 0; i < 3; i++) n(0.02, 1800, 0.12, t + i * 0.18); break;
      default: tone(440, 0.04, 'square', 0.02);
    }
    return null;
  }

  noise(dur, freq, vol, start, out = this.groups.sfx, type = 'bandpass', q = 0.8) {
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = vol;
    src.connect(f).connect(g).connect(out);
    src.start(start);
  }
}

function weighted(mix) {
  const e = Object.entries(mix);
  let r = Math.random() * e.reduce((s, [, w]) => s + w, 0);
  for (const [k, w] of e) { r -= w; if (r <= 0) return k; }
  return e[0][0];
}
