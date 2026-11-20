// One-off: pull datasets out of the design's .dc.html sources into src/data/*.json
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
const out = path.resolve('src/data');
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');
const grab = (src, name) => {
  const m = src.match(new RegExp(`const ${name} = (.*);\\n`));
  if (!m) throw new Error('missing ' + name);
  return JSON.parse(m[1]);
};
const write = (f, v) => fs.writeFileSync(path.join(out, f), JSON.stringify(v, null, 1) + '\n');

const ve = read('project/Vaestoennuste.dc.html');
write('vaestoennuste.json', { areas: grab(ve, 'AREAS'), data: grab(ve, 'DATA') });

const ajo = read('project/Ajomatkat.dc.html');
write('ajomatkat.json', { kunnat: grab(ajo, 'KUNNAT'), points: grab(ajo, 'PTS') });

const kk = read('project/Kuntakortit.dc.html');
write('kuntakortit.json', { kunnat: grab(kk, 'KUNNAT'), data: grab(kk, 'DATA') });

// Tables in Vaestotiedot: rows of cells with bold / na flags
const vt = read('project/Vaestotiedot.dc.html');
const tables = [...vt.matchAll(/<table class="kt">([\s\S]*?)<\/table>/g)].map((t) => {
  const cell = (c) => {
    const text = c[2].replace(/<br>/g, '\n').replace(/<[^>]+>/g, '').trim();
    return { text, bold: /font-weight: 600/.test(c[1]), na: /class="na"/.test(c[1]), note: /class="note"/.test(c[1]) };
  };
  const rows = (sec) => {
    const m = t[1].match(new RegExp(`<${sec}>([\\s\\S]*?)</${sec}>`));
    return [...m[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((r) =>
      [...r[1].matchAll(/<t[dh]([^>]*)>([\s\S]*?)<\/t[dh]>/g)].map(cell));
  };
  const head = rows('thead')[0].map((c) => c.text);
  return { head, body: rows('tbody'), foot: rows('tfoot') };
});
write('vaestotiedot-tables.json', tables);
console.log('ok');
