// Målerspill: hold en verdi i det grønne feltet til jobben er ferdig.
// charge: lad et nedkjølt batteri – juster ladestrømmen så spenningen holder seg i det grønne.
// heat: tin en frossen lås med varmepistolen – hold inne for varme, men ikke svi lakken.
import { svgStage, svgEl, svgButton, INK } from './kit.js';

export default function gaugeGame(ctx) {
  const heat = ctx.opts.kind === 'heat';
  const svg = svgStage(ctx, `<rect width="1100" height="600" fill="#2f2b28"/>
    ${heat
      ? `<rect x="120" y="100" width="560" height="400" rx="30" fill="#7a8a96" stroke="${INK}" stroke-width="7"/><rect x="340" y="270" width="120" height="40" rx="10" fill="#3a3632" stroke="${INK}" stroke-width="5"/><circle class="lock" cx="490" cy="290" r="26" fill="#dff1ff" stroke="${INK}" stroke-width="5"/><g class="gun" transform="translate(600 160)"><path d="M0,0 L130,0 L150,26 L130,52 L0,52 Z" fill="#c43a2a" stroke="${INK}" stroke-width="5"/><rect x="40" y="52" width="40" height="90" rx="8" fill="#2a2a2a" stroke="${INK}" stroke-width="5"/></g><path class="flame" d="M600,186 q-40,-14 -80,40 q30,-4 80,-20" fill="#ff8a3a" opacity="0"/>`
      : `<rect x="120" y="230" width="380" height="240" rx="12" fill="#2a2a2c" stroke="${INK}" stroke-width="7"/><rect x="160" y="300" width="300" height="60" fill="#e0b83a"/><rect x="580" y="200" width="300" height="230" rx="16" fill="#e0b83a" stroke="${INK}" stroke-width="7"/><text x="730" y="410" text-anchor="middle" font-family="Rubik Dirt" font-size="26">LADER</text><path d="M180,230 q100,-160 420,10" stroke="#c43a2a" stroke-width="14" fill="none"/><path d="M440,230 q60,-80 160,30" stroke="#2a2a2a" stroke-width="14" fill="none"/>`}
    <g transform="translate(920 60)"><rect width="110" height="440" rx="14" fill="#1d1a18" stroke="${INK}" stroke-width="6"/><rect class="g-zone" x="8" width="94" fill="#4f8a5a"/><rect class="g-bad" x="8" y="6" width="94" height="70" fill="#8a2a1a" opacity=".7"/><rect class="g-val" x="20" width="70" fill="#ffd84a"/>
      <text x="55" y="-14" text-anchor="middle" font-family="Special Elite" font-size="18" fill="#cfc6b2">${heat ? 'VARME' : 'VOLT'}</text></g>
    <rect x="120" y="530" width="560" height="26" rx="6" fill="#2a2a2a" stroke="${INK}" stroke-width="4"/><rect class="prog" x="123" y="533" width="0" height="20" fill="${heat ? '#8ac8ff' : '#7cff7a'}"/>
    <text class="g-txt" x="400" y="80" text-anchor="middle" font-family="Special Elite" font-size="24" fill="#cfc6b2"></text>`);
  const zH = 100 * ctx.precision, zY = 160;
  svg.querySelector('.g-zone').setAttribute('y', zY); svg.querySelector('.g-zone').setAttribute('height', zH);
  const valEl = svg.querySelector('.g-val'), prog = svg.querySelector('.prog'), txt = svg.querySelector('.g-txt');
  let v = heat ? 30 : 120, rate = 0, progress = 0, inBand = 0, total = 0, over = 0, holding = false, sndT = 0;
  // v = høyde fra bunnen (0–428)
  const setV = () => { const h = Math.max(0, Math.min(428, v)); valEl.setAttribute('y', 434 - h); valEl.setAttribute('height', h); };
  const bandLo = 434 - zY - zH, bandHi = 434 - zY;
  ctx.steps([heat ? 'Tin låsen' : 'Lad batteriet'], 0);
  if (heat) {
    ctx.hint('Hold inne museknappen for å varme. Hold varmen i det <b>grønne</b> – for varmt (rødt) svir lakken.');
    const downF = (e) => { e.preventDefault(); holding = true; };
    const upF = () => { holding = false; };
    svg.addEventListener('pointerdown', downF);
    window.addEventListener('pointerup', upF);
    ctx.cleanupHeat = () => window.removeEventListener('pointerup', upF);
  } else {
    ctx.hint('Juster ladestrømmen med − og + slik at spenningen holder seg i det <b>grønne</b> til batteriet er ladet.');
    svgButton(svg, 600, 460, 120, 56, '− A', () => { rate -= 1; ctx.audio?.synth('tick'); });
    svgButton(svg, 740, 460, 120, 56, '+ A', () => { rate += 1; ctx.audio?.synth('tick'); });
    rate = -1;
  }
  const stop = ctx.frame((dt) => {
    if (heat) {
      v += (holding ? 150 : -90) * dt * ctx.slow;
      svg.querySelector('.flame').setAttribute('opacity', holding ? 0.9 : 0);
      sndT -= dt; if (holding && sndT <= 0) { sndT = 0.28; ctx.audio?.synth('heat', { volume: 0.6 }); }
    } else {
      v += (rate * 22 + Math.sin(performance.now() / 700) * 14 + (Math.random() - 0.5) * 30) * dt * ctx.slow;
      sndT -= dt; if (sndT <= 0) { sndT = 0.6; ctx.audio?.synth('tick', { volume: 0.3 }); }
    }
    v = Math.max(0, Math.min(428, v));
    setV();
    const ok = v >= bandLo && v <= bandHi;
    const tooHot = v > 434 - 76;
    total += dt;
    if (ok) { inBand += dt; progress += dt / 6; }
    if (tooHot) over += dt;
    prog.setAttribute('width', Math.min(554, progress * 554));
    txt.textContent = ok ? (heat ? 'Isen smelter…' : 'Lader…') : tooHot ? (heat ? 'FOR VARMT!' : 'FOR HØY SPENNING!') : heat ? 'For kaldt' : 'For lav strøm';
    if (heat) svg.querySelector('.lock').setAttribute('fill', progress > 0.66 ? '#9a9894' : progress > 0.33 ? '#bcd8ea' : '#dff1ff');
    if (progress >= 1) {
      stop(); ctx.cleanupHeat?.();
      ctx.audio?.play(heat ? 'key_insert' : 'clip');
      const eff = inBand / Math.max(0.1, total);
      ctx.done((eff > 0.75 ? 3 : eff > 0.55 ? 2 : eff > 0.35 ? 1 : 0) - (over > 1.5 ? 1 : 0));
    }
  });
  return () => { stop(); ctx.cleanupHeat?.(); };
}
