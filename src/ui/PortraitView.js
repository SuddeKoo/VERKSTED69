// Innpakning rundt originalens SVG-portretter (Portrait.js er uendret fra startpakken): humør, blunking,
// munnbevegelse mens de snakker og idle-animasjon etter karakterens «anim».
// Animasjon skjer på innpakningen (transform), ikke inne i SVG-filteret, for jevn FPS.
import { renderPortrait } from './Portrait.js';
import { CHAR_BY_ID } from '../data/characters.js';

const live = new Set();
const cache = new Map();

function svgFor(charId, mood) {
  const key = `${charId}|${mood}`;
  if (!cache.has(key)) {
    cache.set(key, renderPortrait(CHAR_BY_ID[charId], { mood, uid: `${charId}_${mood}_${cache.size}` }));
    if (cache.size > 120) cache.delete(cache.keys().next().value);
  }
  return cache.get(key);
}

export class PortraitView {
  constructor(charId, { mood = 'normal', cls = '' } = {}) {
    this.charId = charId;
    this.mood = null;
    const ch = CHAR_BY_ID[charId];
    this.el = document.createElement('div');
    this.el.className = `pv ${cls}`;
    this.inner = document.createElement('div');
    this.inner.className = `pv-anim anim-${ch.anim || 'still'}`;
    this.inner.style.animationDelay = `${-Math.random() * 6}s`;
    this.el.appendChild(this.inner);
    this.setMood(mood);
    live.add(this);
  }
  setMood(mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    this.inner.innerHTML = svgFor(this.charId, mood);
  }
  talk(seconds) {
    clearTimeout(this.talkT);
    this.el.classList.add('talk');
    this.talkT = setTimeout(() => this.el.classList.remove('talk'), Math.max(300, seconds * 1000));
  }
  quiet() { clearTimeout(this.talkT); this.el.classList.remove('talk'); }
  blink() {
    if (this.el.classList.contains('blink')) return;
    this.el.classList.add('blink');
    setTimeout(() => this.el.classList.remove('blink'), 150);
  }
  destroy() {
    clearTimeout(this.talkT);
    live.delete(this);
    this.el.remove();
  }
}

// Én felles blunketimer for alle synlige portretter
setInterval(() => {
  for (const p of live) if (Math.random() < 0.28 && p.el.isConnected) p.blink();
}, 900);
