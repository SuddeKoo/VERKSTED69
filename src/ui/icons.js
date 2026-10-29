// Håndtegnede SVG-ikoner for verktøy (pegboard, hånd) og reservedeler (skuffer, delekasse).
// Samme blekkstrek som figurene: tykk, mørk kontur og flate, skitne farger.
const INK = '#1b120c';
const sw = 'stroke="#1b120c" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"';

// viewBox 0 0 120 150 (verktøy)
const TOOL_ART = {
  lamp: `<rect x="50" y="70" width="20" height="66" rx="6" fill="#d8a838" ${sw}/><path d="M30,20 L90,20 L80,72 L40,72 Z" fill="#3a3632" ${sw}/><ellipse cx="60" cy="20" rx="30" ry="9" fill="#fff4c4" ${sw}/><path d="M40,30 L80,30 M42,44 L78,44 M44,58 L76,58" stroke="${INK}" stroke-width="3"/><path d="M60,136 q-30,10 -40,-6" stroke="${INK}" stroke-width="4" fill="none"/>`,
  scanner: `<rect x="22" y="14" width="76" height="104" rx="12" fill="#c8a234" ${sw}/><rect x="32" y="26" width="56" height="38" rx="4" fill="#24402e" ${sw}/><text x="60" y="51" font-family="monospace" font-size="15" fill="#7cff7a" text-anchor="middle">P0302</text><circle cx="44" cy="82" r="7" fill="#3a3632" ${sw}/><circle cx="76" cy="82" r="7" fill="#3a3632" ${sw}/><rect x="40" y="96" width="40" height="10" rx="3" fill="#3a3632"/><path d="M60,118 q0,22 -26,26" stroke="${INK}" stroke-width="6" fill="none"/><rect x="18" y="136" width="22" height="12" rx="2" fill="#3a3632" ${sw}/>`,
  wheel: `<path d="M60,14 L60,136 M14,75 L106,75" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="M60,14 L60,136 M14,75 L106,75" stroke="#9a9894" stroke-width="9" stroke-linecap="round"/><circle cx="60" cy="14" r="10" fill="#6a6662" ${sw}/><circle cx="60" cy="136" r="10" fill="#6a6662" ${sw}/><circle cx="14" cy="75" r="10" fill="#6a6662" ${sw}/><circle cx="106" cy="75" r="10" fill="#6a6662" ${sw}/>`,
  wrench: `<g transform="rotate(-20 60 75)"><rect x="52" y="30" width="16" height="96" rx="6" fill="#a8a6a0" ${sw}/><path d="M38,14 a22,22 0 1 0 44,0 l-8,0 l0,14 l-28,0 l0,-14 z" fill="#a8a6a0" ${sw}/><circle cx="60" cy="130" r="16" fill="#a8a6a0" ${sw}/><circle cx="60" cy="130" r="8" fill="#3a3632"/></g><g transform="rotate(24 60 75)"><rect x="56" y="34" width="12" height="90" rx="5" fill="#b3402e" ${sw}/></g>`,
  service: `<path d="M24,40 L70,40 L70,128 L24,128 Z" fill="#3c6aa0" ${sw}/><path d="M70,58 L96,44 L104,52 L76,72" fill="#3c6aa0" ${sw}/><rect x="34" y="22" width="26" height="18" fill="#2a2a2a" ${sw}/><text x="47" y="92" font-family="Rubik Dirt, Impact" font-size="20" fill="#f1e6c8" text-anchor="middle">OIL</text><circle cx="90" cy="118" r="18" fill="#7a6e52" ${sw}/><circle cx="90" cy="118" r="7" fill="#3a3632"/>`,
  elec: `<rect x="36" y="20" width="48" height="74" rx="8" fill="#e0b83a" ${sw}/><rect x="44" y="30" width="32" height="20" fill="#24402e" ${sw}/><circle cx="60" cy="72" r="11" fill="#3a3632" ${sw}/><path d="M48,94 q-14,30 -28,40 M72,94 q14,30 28,40" stroke="${INK}" stroke-width="6" fill="none"/><path d="M14,128 l12,14 l6,-6 z" fill="#b8322a" ${sw}/><path d="M106,128 l-12,14 l-6,-6 z" fill="#2a2a2a" ${sw}/>`,
  body: `<rect x="54" y="48" width="12" height="94" rx="5" fill="#8a5a2a" ${sw}/><rect x="22" y="18" width="76" height="34" rx="8" fill="#6a6662" ${sw}/><path d="M22,26 L10,22 L10,48 L22,44" fill="#6a6662" ${sw}/><path d="M98,24 q18,10 0,22" fill="#5a5652" ${sw}/>`,
  wash: `<rect x="24" y="64" width="72" height="44" rx="16" fill="#e8c84a" ${sw}/><path d="M30,74 l60,0 M30,86 l60,0 M30,98 l60,0" stroke="#b8982a" stroke-width="4"/><path d="M40,64 L46,22 L74,22 L80,64" fill="#3c8ab0" ${sw}/><circle cx="34" cy="128" r="7" fill="#cde8f4" ${sw}/><circle cx="58" cy="136" r="5" fill="#cde8f4" ${sw}/><circle cx="84" cy="126" r="8" fill="#cde8f4" ${sw}/>`,
  heat: `<path d="M20,40 L78,40 L92,58 L78,76 L20,76 Z" fill="#c43a2a" ${sw}/><rect x="40" y="76" width="22" height="58" rx="6" fill="#2a2a2a" ${sw}/><rect x="92" y="50" width="20" height="16" fill="#6a6662" ${sw}/><path d="M112,46 q8,12 0,24 M118,40 q12,18 0,36" stroke="#ff8a3a" stroke-width="4" fill="none"/>`,
  paint: `<path d="M30,50 L82,50 L82,78 L30,78 Z" fill="#7a8a96" ${sw}/><path d="M82,58 L108,58 L108,70 L82,70" fill="#4a4a4a" ${sw}/><rect x="42" y="78" width="16" height="56" rx="5" fill="#2a2a2a" ${sw}/><path d="M38,50 L44,16 L68,16 L74,50" fill="#c4622a" ${sw}/><circle cx="114" cy="64" r="4" fill="#c4622a"/><circle cx="118" cy="56" r="3" fill="#c4622a" opacity=".7"/>`,
};

export function toolSvg(id, cls = '') {
  return `<svg class="tool-svg ${cls}" viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">${TOOL_ART[id] || ''}</svg>`;
}
/** Skyggeomriss på pegboardet der verktøyet hører hjemme */
export function toolShadow(id) {
  return `<svg class="tool-shadow" viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg"><g opacity=".55" style="filter:brightness(0)">${TOOL_ART[id] || ''}</g></svg>`;
}

// viewBox 0 0 80 60 (deler)
const PART_ART = {
  tire: `<circle cx="40" cy="30" r="26" fill="#1d1a18" ${sw}/><circle cx="40" cy="30" r="12" fill="#8a8680" ${sw}/>`,
  rim: `<circle cx="40" cy="30" r="24" fill="#b7b9b6" ${sw}/><path d="M40,8 L40,52 M18,30 L62,30" stroke="#6a6c68" stroke-width="6"/><circle cx="40" cy="30" r="6" fill="#3a3632"/>`,
  weights: `<rect x="12" y="20" width="22" height="16" rx="3" fill="#9a9894" ${sw}/><rect x="42" y="26" width="26" height="16" rx="3" fill="#9a9894" ${sw}/>`,
  battery: `<rect x="12" y="16" width="56" height="38" rx="4" fill="#2a2a2c" ${sw}/><rect x="18" y="8" width="10" height="8" fill="#b8322a" ${sw}/><rect x="52" y="8" width="10" height="8" fill="#3a3a3a" ${sw}/><rect x="20" y="26" width="40" height="10" fill="#e0b83a"/>`,
  relay: `<rect x="20" y="12" width="40" height="34" rx="4" fill="#2a4a6a" ${sw}/><path d="M28,46 l0,10 M40,46 l0,10 M52,46 l0,10" stroke="#c8a234" stroke-width="5"/>`,
  bulb: `<circle cx="40" cy="24" r="16" fill="#fff4c4" ${sw}/><rect x="32" y="38" width="16" height="16" fill="#9a9894" ${sw}/>`,
  headlamp: `<path d="M10,14 L64,10 L72,30 L64,50 L10,46 Z" fill="#d8e4ea" ${sw}/><circle cx="36" cy="30" r="12" fill="#fff4c4" ${sw}/>`,
  wire: `<path d="M8,40 q16,-30 32,0 t32,0" stroke="${INK}" stroke-width="9" fill="none"/><path d="M8,40 q16,-30 32,0 t32,0" stroke="#c43a2a" stroke-width="5" fill="none"/>`,
  sensor: `<rect x="30" y="8" width="20" height="26" rx="4" fill="#6a6662" ${sw}/><path d="M34,34 L46,34 L44,54 L36,54 Z" fill="#c8a234" ${sw}/>`,
  oil: `<rect x="18" y="14" width="40" height="42" rx="5" fill="#3c6aa0" ${sw}/><rect x="28" y="6" width="14" height="10" fill="#2a2a2a" ${sw}/><path d="M58,22 l12,-6 l4,6 l-14,10" fill="#3c6aa0" ${sw}/>`,
  filter: `<rect x="22" y="10" width="36" height="44" rx="6" fill="#d8a838" ${sw}/><path d="M22,22 L58,22 M22,34 L58,34 M22,46 L58,46" stroke="${INK}" stroke-width="2.5"/>`,
  plugs: `<g ${sw}><rect x="14" y="10" width="10" height="20" fill="#f2efe4"/><rect x="12" y="30" width="14" height="12" fill="#9a9894"/><rect x="34" y="10" width="10" height="20" fill="#f2efe4"/><rect x="32" y="30" width="14" height="12" fill="#9a9894"/><rect x="54" y="10" width="10" height="20" fill="#f2efe4"/><rect x="52" y="30" width="14" height="12" fill="#9a9894"/></g>`,
  pads: `<path d="M10,20 q30,-14 60,0 l-4,14 q-26,-10 -52,0 z" fill="#6a6662" ${sw}/><path d="M10,40 q30,-14 60,0 l-4,14 q-26,-10 -52,0 z" fill="#6a6662" ${sw}/>`,
  shock: `<rect x="34" y="4" width="12" height="20" fill="#9a9894" ${sw}/><rect x="28" y="24" width="24" height="32" rx="4" fill="#c43a2a" ${sw}/>`,
  bolts: `<g ${sw}><path d="M16,12 l10,0 l5,8 l-5,8 l-10,0 l-5,-8 z" fill="#a8a6a0"/><rect x="18" y="28" width="6" height="22" fill="#a8a6a0"/><path d="M48,16 l10,0 l5,8 l-5,8 l-10,0 l-5,-8 z" fill="#a8a6a0"/><rect x="50" y="32" width="6" height="20" fill="#a8a6a0"/></g>`,
  pipe: `<path d="M6,36 L50,36 Q66,36 72,20" stroke="${INK}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M6,36 L50,36 Q66,36 72,20" stroke="#8a8680" stroke-width="9" fill="none" stroke-linecap="round"/>`,
  hanger: `<circle cx="28" cy="30" r="13" fill="none" stroke="${INK}" stroke-width="10"/><circle cx="52" cy="30" r="13" fill="none" stroke="${INK}" stroke-width="10"/><circle cx="28" cy="30" r="13" fill="none" stroke="#3a3632" stroke-width="5"/><circle cx="52" cy="30" r="13" fill="none" stroke="#3a3632" stroke-width="5"/>`,
  seal: `<ellipse cx="40" cy="30" rx="28" ry="18" fill="none" stroke="${INK}" stroke-width="10"/><ellipse cx="40" cy="30" rx="28" ry="18" fill="none" stroke="#c8a234" stroke-width="5"/>`,
  bumper: `<path d="M6,22 L74,22 Q78,22 78,30 L78,40 L4,40 L4,30 Q4,22 8,22 Z" fill="#3a3734" ${sw}/>`,
  panel: `<rect x="12" y="8" width="56" height="46" rx="6" fill="#7a8a96" ${sw}/><rect x="20" y="14" width="40" height="14" fill="#2b3a4a" ${sw}/>`,
  rustkit: `<rect x="14" y="16" width="30" height="38" rx="4" fill="#9a5a2a" ${sw}/><rect x="48" y="24" width="20" height="30" rx="3" fill="#cfcdc6" ${sw}/><rect x="20" y="8" width="18" height="8" fill="#2a2a2a" ${sw}/>`,
  wiper: `<path d="M8,46 L70,14" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M8,46 L70,14" stroke="#4a4a4a" stroke-width="4" stroke-linecap="round"/>`,
  paint: `<rect x="18" y="12" width="44" height="42" rx="4" fill="#9a9894" ${sw}/><rect x="18" y="12" width="44" height="12" fill="#c4622a" ${sw}/><path d="M30,24 l0,16" stroke="#c4622a" stroke-width="5"/>`,
};

export function partSvg(id, cls = '') {
  return `<svg class="part-svg ${cls}" viewBox="0 0 80 60" xmlns="http://www.w3.org/2000/svg">${PART_ART[id] || ''}</svg>`;
}
