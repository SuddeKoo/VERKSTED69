// Snakkeboble med skrivemaskineffekt. Klikk fullfører linja, nytt klikk går videre.
import { G } from '../game/state.js';
import { TEXT_SPEED } from '../core/settings.js';
import { esc } from '../core/util.js';

export class Speech {
  constructor(el) {
    this.el = el;
    this.nameEl = el.querySelector('.bubble-name');
    this.textEl = el.querySelector('.bubble-text');
    this.queue = [];
    this.timer = null;
    this.el.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.skip(); });
  }
  /** lines: string[]; portrait: PortraitView; done: callback etter siste linje */
  play(name, lines, portrait, done) {
    this.stop();
    this.name = name;
    this.queue = lines.slice();
    this.portrait = portrait;
    this.done = done;
    this.next();
  }
  next() {
    clearTimeout(this.timer); clearInterval(this.typer);
    const line = this.queue.shift();
    if (line == null) {
      this.portrait?.quiet();
      const d = this.done; this.done = null;
      d?.();
      return;
    }
    this.el.classList.remove('hidden');
    this.el.classList.remove('bump'); void this.el.offsetWidth; this.el.classList.add('bump');
    this.nameEl.textContent = this.name || '';
    const cps = TEXT_SPEED[G.settings.textSpeed] ?? 55;
    this.full = line;
    this.typing = cps > 0;
    const dur = line.length / Math.max(1, cps || 9999);
    this.portrait?.talk(cps ? dur + 0.2 : Math.min(2, line.length / 40));
    G.audio?.play('paper', { volume: 0.12, gap: 0.6 });
    if (!cps) { this.textEl.innerHTML = esc(line); this.typing = false; this.wait(); return; }
    let i = 0;
    this.textEl.textContent = '';
    this.typer = setInterval(() => {
      i = Math.min(line.length, i + Math.max(1, Math.round(cps / 30)));
      this.textEl.textContent = line.slice(0, i);
      if (i >= line.length) { clearInterval(this.typer); this.typing = false; this.wait(); }
    }, 1000 / 30);
  }
  wait() {
    // Går videre av seg selv etter lesetid, eller med klikk
    const read = 1.4 + this.full.length * 0.045;
    this.timer = setTimeout(() => this.next(), read * 1000);
  }
  skip() {
    if (this.typing) { clearInterval(this.typer); this.typing = false; this.textEl.textContent = this.full; this.portrait?.quiet(); this.wait(); return; }
    this.next();
  }
  /** Én enkelt replikk uten kø */
  say(name, line, portrait, done) { this.play(name, [line], portrait, done); }
  stop() {
    clearTimeout(this.timer); clearInterval(this.typer);
    this.queue = []; this.done = null; this.typing = false;
    this.portrait?.quiet();
  }
  hide() { this.stop(); this.el.classList.add('hidden'); }
  get busy() { return !!this.done || this.queue.length > 0; }
}
