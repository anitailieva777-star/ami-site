// Сглобява po-blizo/index.html и po-blizo/dizain.html от шаблоните и генерираните SVG.
// Пускане: cd po-blizo-src && node build.mjs
import fs from 'fs';
import { execFileSync } from 'child_process';
const here = new URL('.', import.meta.url).pathname, out = here + '../po-blizo/';
const sky = execFileSync('node', [here + 'sky.mjs'], { encoding: 'utf8' });
const cards = execFileSync('node', [here + 'cards.mjs'], { encoding: 'utf8' });
for (const [t, o] of [['index.tpl.html', 'index.html'], ['dizain.tpl.html', 'dizain.html']])
  fs.writeFileSync(out + o, fs.readFileSync(here + t, 'utf8').split('{{SKY}}').join(sky).split('{{CARDS}}').join(cards));
console.log('ok');
