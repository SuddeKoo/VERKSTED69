// Skrubbespill: bilvask, søle, grøftevask, is, rust, polering, sliping og saltvask.
// Den rene bilen ligger under et ekte skittlag (canvas). Der du drar verktøyet, forsvinner skitten gradvis,
// og fremdriften måles på et rutenett. Rust: slip bort rusten, mal så over flekken.
import { renderCar, bodyPath, geometry } from '../car/CarArt.js';
import { COLOR_BY_ID } from '../../data/cars.js';
import { RNG } from '../../core/rng.js';

const CW = 1100, CH = 600, OX = 50, OY = 100; // bilen tegnes 1000 × 440 med denne forskyvningen
const GX = 110, GY = 60;                       // rutenett for fremdrift

const MODES = {
  wash:   { tool: 'Svamp og såpe', hint: 'Dra svampen over bilen til all skitten er borte.', sound: 'water', hard: 1 },
  mud:    { tool: 'Høytrykk', hint: 'Spyl bort sølen rundt hjulbuene.', sound: 'water', hard: 1.4 },
  ditch:  { tool: 'Høytrykk og børste', hint: 'Spyl bort jord, gress og søle fra hele bilen.', sound: 'water', hard: 1.3 },
  ice:    { tool: 'Isskrape', hint: 'Skrap bort isen. Den sitter hardt – gå over flere ganger.', sound: 'scrape', hard: 2.4 },
  rust:   { tool: 'Slipeskive', hint: 'Slip bort rusten helt ned til blankt metall.', sound: 'grind', hard: 1.8 },
  polish: { tool: 'Polermaskin', hint: 'Poler i <b>runde bevegelser</b> – rette strøk virker ikke.', sound: 'polish', hard: 1.4 },
  sand:   { tool: 'Slipekloss', hint: 'Slip ned den skadde lakken jevnt over hele siden.', sound: 'scrape', hard: 1.5 },
  salt:   { tool: 'Spyler og børste', hint: 'Vask bort veisaltet fra understellet og nedre del av bilen.', sound: 'water', hard: 1.2 },
};

export default function scrubGame(ctx) {
  const mode = ctx.opts.mode || 'wash';
  const M = MODES[mode];
  const job = ctx.job;
  const model = job.car.model;
  const G2 = geometry(model);
  // Bilen slik den blir når jobben er gjort (denne feilen fikset, ingen skitt)
  const clean = { ...job, car: { ...job.car, dirt: mode === 'wash' || mode === 'ditch' ? 0 : job.car.dirt }, faults: job.faults.map((f) => (f === ctx.fault ? { ...f, fixed: true } : f)) };
  ctx.el.innerHTML = `<div class="scrub"><div class="scrub-car" style="left:${(OX / CW) * 100}%;top:${(OY / CH) * 100}%;width:${(1000 / CW) * 100}%;height:${(440 / CH) * 100}%">${renderCar(clean, {})}</div>
    <canvas class="scrub-paint" width="${CW}" height="${CH}"></canvas><canvas class="scrub-dirt" width="${CW}" height="${CH}"></canvas>
    <div class="scrub-brush"></div><div class="scrub-ui"><div class="scrub-bar"><span></span></div><b class="scrub-pct">0 %</b><button class="opt primary scrub-done" disabled>FERDIG</button></div></div>`;
  const wrap = ctx.el.querySelector('.scrub');
  const cv = ctx.el.querySelector('.scrub-dirt'), g = cv.getContext('2d');
  const pv = ctx.el.querySelector('.scrub-paint'), pg = pv.getContext('2d');
  const brush = ctx.el.querySelector('.scrub-brush');
  const bar = ctx.el.querySelector('.scrub-bar span'), pctEl = ctx.el.querySelector('.scrub-pct'), doneBtn = ctx.el.querySelector('.scrub-done');
  const rng = new RNG(job.car.seed + 7);
  const body = new Path2D(bodyPath(model));
  let phase = 'clean'; // rust: clean → paint
  const radius = 44 * (ctx.up.pressure && ['wash', 'mud', 'ditch', 'salt'].includes(mode) ? 1.6 : 1);
  const strength = (ctx.up.foam ? 2 : 1) / M.hard;
  ctx.steps(mode === 'rust' ? ['Slip bort rust', 'Mal over'] : [M.tool], 0);
  ctx.hint(M.hint);

  // ── Tegn skittlaget i bilens koordinater ──
  const grid = new Float32Array(GX * GY);  // hvor mye skitt som er igjen i hver rute (0–1)
  const want = new Uint8Array(GX * GY);    // ruter som teller
  g.save(); g.translate(OX, OY);
  const area = (fn) => { g.save(); fn(); g.restore(); };
  const blob = (x, y, r, col, a = 1) => { g.globalAlpha = a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, r, r * (0.6 + rng.next() * 0.5), rng.next() * 3, 0, 6.283); g.fill(); };
  const wheelsClip = () => { g.beginPath(); for (const k of ['F', 'R']) { const [wx, wy] = G2.wheel[k]; g.moveTo(wx + G2.r + 40, wy); g.arc(wx, wy, G2.r + 40, 0, 6.283); } };
  if (mode === 'wash' || mode === 'ditch' || mode === 'polish' || mode === 'sand') {
    area(() => {
      g.clip(body);
      const base = mode === 'polish' ? '#aaa69a' : mode === 'sand' ? '#c9c2b0' : '#6b5a40';
      g.fillStyle = base; g.globalAlpha = mode === 'polish' ? 0.62 : mode === 'sand' ? 0.55 : 0.82; g.fillRect(0, 0, 1000, 440);
      for (let i = 0; i < 260; i++) blob(rng.next() * 1000, 80 + rng.next() * 330, 8 + rng.next() * 30, mode === 'polish' ? '#8a8578' : mode === 'sand' ? '#efe6d2' : rng.chance(0.5) ? '#4a3a26' : '#7a6a4c', 0.5);
      if (mode === 'sand') { g.globalAlpha = 0.9; g.strokeStyle = '#f2ece0'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(80 + i * 30, G2.m.belt + 30 + i * 14); g.quadraticCurveTo(500, G2.m.belt + 20 + i * 12, 900, G2.m.belt + 40 + i * 8); g.stroke(); } }
    });
    if (mode === 'ditch') area(() => { g.globalAlpha = 0.95; for (let i = 0; i < 40; i++) { g.strokeStyle = '#4a6a2a'; g.lineWidth = 4; g.beginPath(); const x = 600 + rng.next() * 380, y = 250 + rng.next() * 140; g.moveTo(x, y); g.lineTo(x + (rng.next() - 0.5) * 30, y - 30 - rng.next() * 30); g.stroke(); } for (let i = 0; i < 40; i++) blob(rng.next() * 1000, 330 + rng.next() * 90, 14 + rng.next() * 26, '#3d2c18', 0.9); });
  } else if (mode === 'mud') {
    area(() => { wheelsClip(); g.clip(); for (let i = 0; i < 120; i++) { const k = rng.chance(0.5) ? 'F' : 'R'; const [wx, wy] = G2.wheel[k]; const a = rng.next() * 6.28, d = rng.next() * (G2.r + 34); blob(wx + Math.cos(a) * d, wy + Math.sin(a) * d * 0.9, 12 + rng.next() * 22, rng.chance(0.6) ? '#4a3620' : '#5e4528', 0.95); } });
  } else if (mode === 'ice') {
    area(() => { g.beginPath(); g.rect(0, 0, 1000, G2.m.belt + 40); g.clip(); g.clip(body); g.fillStyle = '#e6f1f8'; g.globalAlpha = 0.95; g.fillRect(0, 0, 1000, 440); for (let i = 0; i < 160; i++) blob(rng.next() * 1000, rng.next() * (G2.m.belt + 40), 6 + rng.next() * 18, rng.chance(0.5) ? '#ffffff' : '#bcd8ea', 0.8); });
  } else if (mode === 'rust') {
    const [rx, ry] = [G2.wheel.R[0] + 10, G2.m.sill - G2.r - 26];
    area(() => { g.clip(body); for (let i = 0; i < 70; i++) blob(rx + (rng.next() - 0.5) * 150, ry + (rng.next() - 0.5) * 70, 8 + rng.next() * 22, rng.chance(0.5) ? '#8a3e16' : '#5a2208', 0.95); });
  } else if (mode === 'salt') {
    area(() => { g.beginPath(); g.rect(0, G2.m.sill - 90, 1000, 200); g.clip(); for (let i = 0; i < 420; i++) blob(G2.minX + rng.next() * (G2.maxX - G2.minX), G2.m.sill - 80 + rng.next() * 110, 2 + rng.next() * 6, '#f2f0e8', 0.9); });
  }
  g.restore();
  // Fremdriftsnett: les av skittlaget én gang
  const img = g.getImageData(0, 0, CW, CH).data;
  let total = 0;
  for (let gy = 0; gy < GY; gy++) for (let gx = 0; gx < GX; gx++) {
    const px = Math.floor((gx + 0.5) * (CW / GX)), py = Math.floor((gy + 0.5) * (CH / GY));
    const a = img[(py * CW + px) * 4 + 3] / 255;
    if (a > 0.15) { want[gy * GX + gx] = 1; grid[gy * GX + gx] = 1; total++; }
  }
  if (!total) total = 1;
  // Maleområdet for rust (fase 2) = samme ruter som rusten
  const paintWant = mode === 'rust' ? want.slice() : null;
  const paintGrid = new Float32Array(GX * GY);
  let paintTotal = 0;
  if (paintWant) for (let i = 0; i < paintWant.length; i++) paintTotal += paintWant[i];

  // ── Skrubbing ──
  let down = false, last = null, lastAng = null, turn = 0, sndT = 0, soundOn = false;
  const toLocal = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * CW, ((e.clientY - r.top) / r.height) * CH]; };
  const progress = () => {
    let left = 0;
    if (phase === 'paint') { let done = 0; for (let i = 0; i < paintGrid.length; i++) if (paintWant[i]) done += Math.min(1, paintGrid[i]); return done / Math.max(1, paintTotal); }
    for (let i = 0; i < grid.length; i++) if (want[i]) left += grid[i];
    return 1 - left / total;
  };
  const apply = (x, y, k) => {
    if (phase === 'paint') {
      pg.globalAlpha = 0.5 * k; pg.fillStyle = COLOR_BY_ID[job.car.color]?.hex || '#777';
      pg.save(); pg.translate(OX, OY); pg.clip(body); pg.translate(-OX, -OY); pg.beginPath(); pg.arc(x, y, radius * 0.8, 0, 6.283); pg.fill(); pg.restore();
    } else {
      g.globalCompositeOperation = 'destination-out';
      const grd = g.createRadialGradient(x, y, 0, x, y, radius);
      grd.addColorStop(0, `rgba(0,0,0,${Math.min(1, 0.55 * k * strength)})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, radius, 0, 6.283); g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    const gr = radius / (CW / GX);
    const cx = x / (CW / GX), cy = y / (CH / GY);
    for (let gy = Math.max(0, Math.floor(cy - gr)); gy <= Math.min(GY - 1, Math.ceil(cy + gr)); gy++) {
      for (let gx = Math.max(0, Math.floor(cx - gr)); gx <= Math.min(GX - 1, Math.ceil(cx + gr)); gx++) {
        const d = Math.hypot(gx - cx, gy - cy) / gr;
        if (d > 1) continue;
        const i = gy * GX + gx;
        if (phase === 'paint') paintGrid[i] += (1 - d) * 0.5 * k;
        else grid[i] = Math.max(0, grid[i] - (1 - d) * 0.42 * k * strength);
      }
    }
  };
  const onMove = (e) => {
    const [x, y] = toLocal(e);
    const r = cv.getBoundingClientRect();
    brush.style.transform = `translate(${(x / CW) * r.width - radius * (r.width / CW)}px, ${(y / CH) * r.height - radius * (r.width / CW)}px)`;
    brush.style.width = brush.style.height = `${radius * 2 * (r.width / CW)}px`;
    if (!down) return;
    if (last) {
      const dx = x - last[0], dy = y - last[1], dist = Math.hypot(dx, dy);
      if (dist < 2) return;
      let k = Math.min(1, dist / 20);
      if (mode === 'polish' && phase !== 'paint') {
        // Bare runde bevegelser polerer: retningen må endre seg jevnt
        const ang = Math.atan2(dy, dx);
        if (lastAng != null) { let da = ang - lastAng; if (da > Math.PI) da -= 6.283; if (da < -Math.PI) da += 6.283; turn = turn * 0.8 + Math.abs(da) * 0.2; }
        lastAng = ang;
        k *= Math.min(1, turn * 6);
      }
      const steps = Math.ceil(dist / (radius * 0.4));
      for (let i = 1; i <= steps; i++) apply(last[0] + (dx * i) / steps, last[1] + (dy * i) / steps, k);
      sndT -= 0.016;
      if (sndT <= 0) { sndT = mode === 'polish' ? 0.18 : 0.12; if (M.sound !== 'water') ctx.audio?.synth(phase === 'paint' ? 'spray' : M.sound, { volume: 0.5 }); }
      update();
    }
    last = [x, y];
  };
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); cv.setPointerCapture(e.pointerId); down = true; last = toLocal(e);
    if (M.sound === 'water' && !soundOn) { soundOn = true; ctx.audio?.loop('water', 0.5, 0.2); }
  });
  cv.addEventListener('pointermove', onMove);
  const up = () => { down = false; last = null; lastAng = null; if (soundOn) { soundOn = false; ctx.audio?.stopLoop('water', 0.4); } };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { brush.style.opacity = 0; });
  cv.addEventListener('pointerenter', () => { brush.style.opacity = 1; });

  const results = [];
  const update = () => {
    const p = progress();
    bar.style.width = `${Math.round(p * 100)}%`;
    pctEl.textContent = `${Math.round(p * 100)} %`;
    doneBtn.disabled = p < 0.75;
    if (p >= 0.985) finishPhase(p);
  };
  const finishPhase = (p) => {
    if (finishPhase.lock) return;
    finishPhase.lock = true;
    results.push(p);
    if (mode === 'rust' && phase === 'clean') {
      phase = 'paint';
      ctx.steps(['Slip bort rust', 'Mal over'], 1);
      ctx.hint('Rusten er borte. Mal over det blanke metallet med lakk i bilens farge.');
      ctx.audio?.synth('good');
      setTimeout(() => { finishPhase.lock = false; update(); }, 50);
      return;
    }
    up();
    const avg = results.reduce((a, b) => a + b, 0) / results.length;
    ctx.done(avg >= 0.97 ? 3 : avg >= 0.9 ? 2 : avg >= 0.8 ? 1 : 0);
  };
  doneBtn.addEventListener('click', () => finishPhase(progress()));
  return () => { if (soundOn) ctx.audio?.stopLoop('water', 0.3); void wrap; };
}
