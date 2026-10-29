// Skalerer Higgsfield-bakgrunnene (art_src/*.png, 2736×1536) til spillets 1920×1080-JPG-er.
// Bakgrunnene er generert UTEN disk, arbeidsbenk, løftebukk og pult – de tegnes som egne SVG-lag i spillet.
// Bruk: node scripts/convert-bg.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const JOBS = [
  ['art_src/center_v2.png', 'public/assets/bg/reception.jpg'],
  ['art_src/tools_v1.png', 'public/assets/bg/tools.jpg'],
  ['art_src/bay_v1.png', 'public/assets/bg/bay.jpg'],
  ['art_src/office_v1.png', 'public/assets/bg/office.jpg'],
  ['art_src/menu_v1.png', 'public/assets/bg/menu.jpg'],
];

fs.mkdirSync('public/assets/bg', { recursive: true });
for (const [src, dst] of JOBS) {
  if (!fs.existsSync(src)) { console.warn('mangler', src); continue; }
  await sharp(src).resize(1920, 1080, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toFile(dst);
  console.log('OK', dst, (fs.statSync(dst).size / 1024).toFixed(0) + ' kB');
}
