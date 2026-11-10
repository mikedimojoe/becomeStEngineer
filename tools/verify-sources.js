#!/usr/bin/env node
// Prüft alle YouTube-IDs (oEmbed) und Text-URLs (HTTP 200) einer oder aller Bereichsdateien.
// Aufruf: node tools/verify-sources.js [content/areas/<id>.js ...] [--fix-titles]
//   --fix-titles  übernimmt Titel/Kanal aus oEmbed in die Ausgabe (schreibt nichts, druckt Korrekturen)
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const AREA_DIR = path.join(__dirname, '..', 'content', 'areas');
let files = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!files.length) files = fs.readdirSync(AREA_DIR).filter(f => f.endsWith('.js')).map(f => path.join(AREA_DIR, f));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
function curl(args) {
  try { return execFileSync('curl', ['-s', '-m', '25', '-A', UA, ...args], { encoding: 'utf8', maxBuffer: 20e6 }); }
  catch (e) { return e.stdout || ''; }
}
const cache = new Map();
function oembed(id) {
  if (cache.has('v' + id)) return cache.get('v' + id);
  const out = curl([`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`]);
  let r = null; try { r = JSON.parse(out); } catch (e) { /* kein JSON */ }
  cache.set('v' + id, r); return r;
}
function status(url) {
  if (cache.has('u' + url)) return cache.get('u' + url);
  let code = curl(['-L', '-o', '/dev/null', '-w', '%{http_code}', url]).trim();
  if (code !== '200') code = curl(['-L', '-r', '0-2000', '-o', '/dev/null', '-w', '%{http_code}', url]).trim() === '206' ? '200' : code;
  cache.set('u' + url, code); return code;
}
const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

let bad = 0, ok = 0;
for (const f of files) {
  const p = path.resolve(f);
  delete require.cache[require.resolve(p)];
  const a = require(p);
  for (const m of a.modules) {
    for (const v of m.videos || []) {
      const r = oembed(v.id);
      if (!r) { bad++; console.log(`VIDEO FEHLT  ${m.id}  ${v.id}  (${v.title})`); continue; }
      if (norm(r.title) !== norm(v.title) || norm(r.author_name) !== norm(v.channel)) {
        bad++; console.log(`VIDEO ABWEICHUNG ${m.id} ${v.id}\n   ist:  ${v.title} | ${v.channel}\n   soll: ${r.title} | ${r.author_name}`);
      } else ok++;
    }
    const links = [...(m.readings || []).map(r => r.url), ...(m.objectives || []).map(o => o.guide && o.guide.link && o.guide.link.url).filter(Boolean)];
    for (const u of links) {
      const c = status(u);
      if (c !== '200') { bad++; console.log(`URL ${c}  ${m.id}  ${u}`); } else ok++;
    }
  }
}
console.log(`\n${ok} ok, ${bad} Probleme`);
process.exit(bad ? 1 : 0);
