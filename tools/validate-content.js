#!/usr/bin/env node
// Strukturprüfung der Inhaltsdateien.
// Aufruf: node tools/validate-content.js [content/areas/<id>.js ...]   (ohne Argument: alle Bereiche)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const AREA_DIR = path.join(ROOT, 'content', 'areas');
const AREA_IDS = ['logik', 'elektro', 'git', 'praxis', 'system', 'komm', 'motion', 'hmi', 'regelung', 'safety'];
const READING_TYPES = ['Uni-Skript', 'Fachbuch', 'Dokumentation', 'Hersteller', 'Norm/Amtlich', 'Artikel'];
const KINDS = ['lektion', 'projekt', 'zusatz'];

let files = process.argv.slice(2);
const all = files.length === 0;
if (all) files = fs.readdirSync(AREA_DIR).filter(f => f.endsWith('.js')).map(f => path.join(AREA_DIR, f));

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

// Alle Modul-IDs aller Bereiche sammeln (für bereichsübergreifende req)
const allModuleIds = new Set();
const loaded = [];
for (const f of fs.readdirSync(AREA_DIR).filter(f => f.endsWith('.js'))) {
  const p = path.join(AREA_DIR, f);
  try {
    delete require.cache[require.resolve(p)];
    const a = require(p);
    (a.modules || []).forEach(m => allModuleIds.add(m.id));
    if (files.some(x => path.resolve(x) === p)) loaded.push([p, a]);
  } catch (e) {
    if (files.some(x => path.resolve(x) === p)) err(f, 'lädt nicht: ' + e.message);
  }
}

function checkQuestion(where, q) {
  if (!q || typeof q.q !== 'string' || !q.q.trim()) return err(where, 'Fragetext fehlt');
  if (!q.explain) warn(where, 'explain fehlt');
  if (q.type === 'single') {
    if (!Array.isArray(q.options) || q.options.length < 2) err(where, 'options fehlen');
    else if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) err(where, 'correct ungültig');
  } else if (q.type === 'multi') {
    if (!Array.isArray(q.options) || q.options.length < 3) err(where, 'options fehlen (min. 3)');
    else if (!Array.isArray(q.correct) || !q.correct.length || q.correct.some(c => !Number.isInteger(c) || c < 0 || c >= q.options.length)) err(where, 'correct ungültig');
  } else if (q.type === 'numeric') {
    if (!q.formula) return err(where, 'formula fehlt');
    const params = q.params || {};
    for (const [k, v] of Object.entries(params)) {
      if (!Array.isArray(v) || v.length !== 3 || v.some(x => typeof x !== 'number') || v[0] > v[1] || v[2] <= 0) err(where, `param ${k} muss [min,max,step] sein`);
      if (!q.q.includes('{' + k + '}')) warn(where, `param {${k}} kommt im Fragetext nicht vor`);
    }
    try {
      const names = Object.keys(params);
      const vals = names.map(n => params[n][0]);
      const r = Function(...names, 'with(Math){return (' + q.formula + ');}')(...vals);
      if (typeof r !== 'number' || !isFinite(r)) err(where, 'formula liefert keine Zahl: ' + r);
    } catch (e) { err(where, 'formula Fehler: ' + e.message); }
    if (typeof q.tol !== 'number') warn(where, 'tol fehlt (Standard 0.01)');
  } else err(where, 'type muss single|multi|numeric sein');
  if (q.figure && !/^\s*<svg[\s>]/.test(q.figure)) err(where, 'figure muss mit <svg beginnen');
}

function checkUrl(where, url) {
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) err(where, 'URL ungültig: ' + url);
}

for (const [p, a] of loaded) {
  const fname = path.basename(p);
  if (!AREA_IDS.includes(a.id)) err(fname, 'unbekannte Bereichs-id ' + a.id);
  if (fname !== a.id + '.js') err(fname, 'Dateiname muss <id>.js sein');
  ['title', 'short', 'description'].forEach(k => { if (!a[k]) err(fname, k + ' fehlt'); });
  if (!Array.isArray(a.modules) || !a.modules.length) { err(fname, 'modules leer'); continue; }
  const ids = new Set();
  const projectsPerLevel = {};
  for (const m of a.modules) {
    const w = `${fname} › ${m.id || '?'}`;
    if (!m.id || !m.id.startsWith(a.id + '-')) err(w, 'id muss mit "' + a.id + '-" beginnen');
    if (ids.has(m.id)) err(w, 'doppelte id');
    ids.add(m.id);
    if (!Number.isInteger(m.level) || m.level < 1 || m.level > 6) err(w, 'level 1–6');
    if (!KINDS.includes(m.kind)) err(w, 'kind ungültig');
    ['title', 'summary', 'briefing', 'practice'].forEach(k => { if (!m[k]) err(w, k + ' fehlt'); });
    if (!m.minutes) warn(w, 'minutes fehlt');
    (m.req || []).forEach(r => { if (!allModuleIds.has(r)) err(w, 'req existiert nicht: ' + r); if (r === m.id) err(w, 'req auf sich selbst'); });
    // Ziele + Anleitungen
    if (!Array.isArray(m.objectives) || m.objectives.length < 2) err(w, 'mind. 2 objectives');
    else {
      const oids = new Set();
      m.objectives.forEach((o, i) => {
        const wo = `${w} › Ziel ${o.id || i}`;
        if (!o.id || oids.has(o.id)) err(wo, 'id fehlt/doppelt'); oids.add(o.id);
        if (!o.title) err(wo, 'title fehlt');
        const g = o.guide;
        if (!g) return err(wo, 'guide fehlt (Anzahl Anleitungen = Anzahl Ziele)');
        if (!g.intro) err(wo, 'guide.intro fehlt');
        if (!Array.isArray(g.steps) || g.steps.length < 3 || g.steps.length > 7) err(wo, 'guide.steps 3–7');
        if (!g.done || !/^Erledigt, wenn/.test(g.done)) err(wo, 'guide.done muss mit "Erledigt, wenn" beginnen');
        if (!g.tip) warn(wo, 'guide.tip fehlt');
        if (g.link) checkUrl(wo, g.link.url);
        if (g.code && (!g.code.text || !g.code.lang)) err(wo, 'guide.code braucht lang+text');
      });
    }
    // Videos
    (m.videos || []).forEach((v, i) => {
      const wv = `${w} › Video ${i}`;
      if (!/^[A-Za-z0-9_-]{11}$/.test(v.id || '')) err(wv, 'YouTube-ID ungültig');
      ['title', 'channel', 'lang', 'why'].forEach(k => { if (!v[k]) err(wv, k + ' fehlt'); });
    });
    if (!m.videos || m.videos.length < 1) warn(w, 'keine Videos');
    // Readings
    (m.readings || []).forEach((r, i) => {
      const wr = `${w} › Text ${i}`;
      ['title', 'author', 'institution', 'work', 'year', 'type', 'minutes', 'url', 'why', 'apa'].forEach(k => { if (r[k] === undefined || r[k] === '') err(wr, k + ' fehlt'); });
      if (r.type && !READING_TYPES.includes(r.type)) err(wr, 'type ungültig: ' + r.type);
      checkUrl(wr, r.url);
      if (r.apa && r.url && !r.apa.includes(r.url)) warn(wr, 'APA enthält die URL nicht');
    });
    if (!m.readings || m.readings.length < 1) warn(w, 'keine Texte');
    // Quiz
    if (!Array.isArray(m.quiz) || m.quiz.length !== 3) err(w, 'quiz muss genau 3 Fragen haben');
    (m.quiz || []).forEach((q, i) => checkQuestion(`${w} › Quiz ${i + 1}`, q));
    if (!Array.isArray(m.exam) || m.exam.length < 3) warn(w, 'exam: 3–5 Prüfungsfragen empfohlen');
    (m.exam || []).forEach((q, i) => checkQuestion(`${w} › Prüfung ${i + 1}`, q));
    // Übungen
    const exIds = new Set();
    (m.exercises || []).forEach((x, i) => {
      const wx = `${w} › Übung ${x.id || i}`;
      if (!x.id || exIds.has(x.id)) err(wx, 'id fehlt/doppelt'); exIds.add(x.id);
      if (!['st', 'git'].includes(x.type)) err(wx, 'type st|git');
      if (!x.title || !x.task) err(wx, 'title/task fehlt');
      if (x.type === 'st') {
        if (!x.files || typeof x.files.main !== 'string') err(wx, 'files.main fehlt');
        if (!x.solution || typeof x.solution.main !== 'string') err(wx, 'solution.main fehlt');
        if (!Array.isArray(x.tests) || x.tests.length < 2) err(wx, 'mind. 2 tests');
        if (!Array.isArray(x.io)) err(wx, 'io fehlt');
      }
      if (x.type === 'git') {
        if (!x.setup) err(wx, 'setup fehlt');
        if (!Array.isArray(x.checks) || !x.checks.length) err(wx, 'checks fehlen');
        if (!Array.isArray(x.solution) || !x.solution.length) err(wx, 'solution (Befehlsliste) fehlt');
      }
    });
    if (m.kind === 'projekt') {
      projectsPerLevel[m.level] = (projectsPerLevel[m.level] || 0) + 1;
      if (!m.badge) err(w, 'projekt braucht badge');
      if (!m.proof) warn(w, 'projekt sollte proof: true haben');
      if (!(m.exercises || []).length) err(w, 'projekt braucht mind. 1 Übung');
    }
  }
  for (const [lvl, n] of Object.entries(projectsPerLevel)) if (n > 1) err(fname, `Level ${lvl}: mehr als 1 projekt`);
  // Zyklen in req
  const byId = Object.fromEntries(a.modules.map(m => [m.id, m]));
  const state = {};
  const visit = (id, stack) => {
    if (state[id] === 2 || !byId[id]) return;
    if (state[id] === 1) return err(fname, 'Zyklus in req: ' + [...stack, id].join(' → '));
    state[id] = 1;
    (byId[id].req || []).forEach(r => visit(r, [...stack, id]));
    state[id] = 2;
  };
  a.modules.forEach(m => visit(m.id, []));
  const lv = [...new Set(a.modules.map(m => m.level))].sort();
  console.log(`${fname}: ${a.modules.length} Module, Level ${lv.join(',')}, ` +
    `${a.modules.reduce((s, m) => s + (m.exercises || []).length, 0)} Übungen, ` +
    `${a.modules.reduce((s, m) => s + (m.videos || []).length, 0)} Videos, ` +
    `${a.modules.reduce((s, m) => s + (m.readings || []).length, 0)} Texte`);
}

warnings.forEach(w => console.log('  WARN  ' + w));
errors.forEach(e => console.log('  FEHLER ' + e));
console.log(errors.length ? `\n${errors.length} Fehler, ${warnings.length} Warnungen` : `\nOK (${warnings.length} Warnungen)`);
process.exit(errors.length ? 1 : 0);
