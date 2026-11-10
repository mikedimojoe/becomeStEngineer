#!/usr/bin/env node
// Prüft alle Übungen: Musterlösung muss alle Tests/Checks bestehen, Startcode darf nicht alle bestehen.
// Aufruf: node tools/check-exercises.js [content/areas/<id>.js ...] [-v]
'use strict';
const fs = require('fs');
const path = require('path');
const ST = require('../public/js/st/index-node.js');
const GIT = require('../public/js/gitsim.js');

const AREA_DIR = path.join(__dirname, '..', 'content', 'areas');
const verbose = process.argv.includes('-v');
let files = process.argv.slice(2).filter(a => !a.startsWith('-'));
if (!files.length) files = fs.readdirSync(AREA_DIR).filter(f => f.endsWith('.js')).map(f => path.join(AREA_DIR, f));

let ok = 0, bad = 0;
const fail = (where, msg) => { bad++; console.log(`FEHLER ${where}\n       ${msg.replace(/\n/g, '\n       ')}`); };

for (const f of files) {
  const p = path.resolve(f);
  delete require.cache[require.resolve(p)];
  const area = require(p);
  for (const m of area.modules) {
    for (const ex of m.exercises || []) {
      const where = `${m.id} › ${ex.id} (${ex.title})`;
      if (ex.type === 'st') {
        const sol = ST.runTests(ex, ex.solution || {});
        if (sol.compileError) { fail(where, 'Musterlösung übersetzt nicht: ' + sol.compileError.text); continue; }
        if (!sol.ok) {
          fail(where, 'Musterlösung besteht nicht alle Tests (' + sol.passed + '/' + sol.total + '):\n' +
            sol.tests.filter(t => !t.ok).map(t => `- ${t.name}: ${t.msg}${t.detail ? ' (' + t.detail + ')' : ''}`).join('\n'));
          continue;
        }
        const start = ST.runTests(ex, ex.files || {});
        if (start.compileError) {
          // Startcode darf Lücken haben, soll aber übersetzbar sein → Warnung
          console.log(`WARN   ${where}: Startcode übersetzt nicht: ${start.compileError.text}`);
        } else if (start.ok) { fail(where, 'Startcode besteht bereits alle Tests – Tests zu schwach oder Startcode zu vollständig'); continue; }
        ok++;
        if (verbose) console.log(`ok     ${where}  (Lösung ${sol.passed}/${sol.total}, Start ${start.compileError ? 'Übersetzungsfehler' : start.passed + '/' + start.total})`);
      } else if (ex.type === 'git') {
        let res;
        try { res = GIT.runSolution(ex); } catch (e) { fail(where, 'Simulator-Fehler: ' + e.message); continue; }
        const failed = res.checks.filter(c => !c.ok);
        if (res.errors.length) console.log(`WARN   ${where}: Befehle mit Fehlermeldung:\n       ` + res.errors.join('\n       '));
        if (failed.length) { fail(where, 'Musterlösung erfüllt nicht alle Checks:\n' + failed.map(c => `- ${c.type}: ${c.msg}`).join('\n') + '\nAusgabe:\n' + res.transcript.slice(-1500)); continue; }
        const start = GIT.checkState(ex, GIT.setup(ex));
        if (start.every(c => c.ok)) { fail(where, 'Ausgangszustand erfüllt bereits alle Checks'); continue; }
        ok++;
        if (verbose) console.log(`ok     ${where}`);
      }
    }
  }
}
console.log(`\n${ok} Übungen ok, ${bad} fehlerhaft`);
process.exit(bad ? 1 : 0);
