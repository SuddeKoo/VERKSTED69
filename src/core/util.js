// Små hjelpere for tid, tall og DOM.
export const DAY_SECONDS = 600; // én arbeidsdag = 10 virkelige minutter

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/** Sekunder brukt av dagen → spillklokke 07:00–17:00 («HH:MM») */
export function clockOf(sec) {
  const m = Math.floor(7 * 60 + (clamp(sec, 0, DAY_SECONDS) / DAY_SECONDS) * 600);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
/** Gjenstående tid «m:ss» */
export function mss(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function kr(n) {
  return `${Math.round(n).toLocaleString('nb-NO').replace(/\s/g, ' ')} kr`;
}

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

export function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/** «{x}»-maler i replikker */
export function fill(text, vars = {}) {
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
