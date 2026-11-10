#!/usr/bin/env node
// becomeStEngineer – lokaler Server (Node.js ≥ 22.13, keine externen Pakete)
// Start: node server/server.js   (Port über PORT=8080, Datenordner über DATA_DIR)
'use strict';
process.removeAllListeners('warning');
process.on('warning', w => { if (w.name !== 'ExperimentalWarning') console.warn(w); });
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { DatabaseSync } = require('node:sqlite');
const E = require('./engine');
const ST = require('../public/js/st/index-node.js');
const GIT = require('../public/js/gitsim.js');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data');
const PORT = +process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
fs.mkdirSync(DATA, { recursive: true });
fs.mkdirSync(path.join(DATA, 'backups'), { recursive: true });

// ---------- Datenbank ----------
const db = new DatabaseSync(path.join(DATA, 'becomestengineer.db'));
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, kind TEXT DEFAULT 'mitarbeiter', description TEXT, created TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE, display_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'learner',
  group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL, pw_hash TEXT, pw_salt TEXT, must_change INTEGER DEFAULT 1, active INTEGER DEFAULT 1,
  background TEXT DEFAULT 'keine', settings TEXT DEFAULT '{}', created TEXT DEFAULT (datetime('now')), last_login TEXT, last_seen TEXT);
CREATE TABLE IF NOT EXISTS trainer_groups (trainer_id INTEGER REFERENCES users(id) ON DELETE CASCADE, group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE, PRIMARY KEY (trainer_id, group_id));
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, created TEXT DEFAULT (datetime('now')), expires INTEGER);
CREATE TABLE IF NOT EXISTS progress (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, module_id TEXT, objectives TEXT DEFAULT '[]', videos TEXT DEFAULT '[]',
  quiz_attempts INTEGER DEFAULT 0, quiz_passed INTEGER DEFAULT 0, quiz_score REAL, quiz_best REAL DEFAULT 0, started_at TEXT, completed_at TEXT, time_sec INTEGER DEFAULT 0,
  proof_url TEXT, proof_status TEXT DEFAULT 'none', proof_comment TEXT, reviewer_id INTEGER, reviewed_at TEXT, PRIMARY KEY (user_id, module_id));
CREATE TABLE IF NOT EXISTS exercise_best (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, module_id TEXT, exercise_id TEXT, best_passed INTEGER DEFAULT 0, total INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0, failed_before_solve INTEGER DEFAULT 0, solved_at TEXT, score REAL DEFAULT 0, code TEXT, draft TEXT, PRIMARY KEY (user_id, module_id, exercise_id));
CREATE TABLE IF NOT EXISTS exercise_runs (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, module_id TEXT, exercise_id TEXT, ts TEXT DEFAULT (datetime('now')),
  passed INTEGER, total INTEGER, compile_error TEXT, failed TEXT);
CREATE TABLE IF NOT EXISTS answers (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, ref TEXT, kind TEXT, correct INTEGER, ts TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS exams (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, exam_id TEXT, early INTEGER DEFAULT 0, seed TEXT, plan TEXT,
  started TEXT DEFAULT (datetime('now')), finished TEXT, score REAL, q_score REAL, code_score REAL, grade INTEGER, passed INTEGER DEFAULT 0, answers TEXT, codes TEXT, detail TEXT);
CREATE TABLE IF NOT EXISTS stages (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, stage INTEGER, achieved_at TEXT DEFAULT (datetime('now')), via TEXT, PRIMARY KEY (user_id, stage));
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, ts TEXT DEFAULT (datetime('now')), type TEXT, text TEXT, data TEXT);
CREATE TABLE IF NOT EXISTS timelog (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, day TEXT, minutes REAL, note TEXT, source TEXT DEFAULT 'manuell', module_id TEXT, ts TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS reflections (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, week TEXT, good TEXT, blocked TEXT, goal TEXT, ts TEXT DEFAULT (datetime('now')), UNIQUE(user_id, week));
CREATE INDEX IF NOT EXISTS ix_events_user ON events(user_id, ts);
CREATE INDEX IF NOT EXISTS ix_answers_user ON answers(user_id, ref);
CREATE INDEX IF NOT EXISTS ix_time_user ON timelog(user_id, day);
`);
const q = (sql, ...a) => db.prepare(sql).all(...a);
const one = (sql, ...a) => db.prepare(sql).get(...a);
const run = (sql, ...a) => db.prepare(sql).run(...a);
const tx = fn => { db.exec('BEGIN'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };

E.load();

// ---------- Hilfen ----------
function hashPw(pw, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return { salt, hash: crypto.scryptSync(String(pw), salt, 64).toString('hex') }; }
function checkPw(u, pw) { if (!u.pw_hash) return false; const h = crypto.scryptSync(String(pw), u.pw_salt, 64); return crypto.timingSafeEqual(h, Buffer.from(u.pw_hash, 'hex')); }
const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const today = () => new Date().toISOString().slice(0, 10);
function isoWeek(d) { d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day); const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return d.getUTCFullYear() + '-W' + String(Math.ceil(((d - y) / 86400000 + 1) / 7)).padStart(2, '0'); }
function event(uid, type, text, data) { run('INSERT INTO events (user_id, type, text, data) VALUES (?,?,?,?)', uid, type, text, data ? JSON.stringify(data) : null); }
class HttpErr extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const bad = (msg, code) => { throw new HttpErr(code || 400, msg); };
function userRows(uid) {
  return {
    progress: q('SELECT * FROM progress WHERE user_id = ?', uid),
    ex: q('SELECT module_id, exercise_id, best_passed, total, attempts, solved_at, score FROM exercise_best WHERE user_id = ?', uid),
    exams: q('SELECT id, exam_id, early, score, grade, passed, finished, started FROM exams WHERE user_id = ? AND finished IS NOT NULL', uid),
    stages: q('SELECT * FROM stages WHERE user_id = ?', uid)
  };
}
function stateOf(uid) { const s = E.computeState(userRows(uid)); s.next = E.nextStep(s); return s; }
function ensureProgress(uid, mid) { run('INSERT OR IGNORE INTO progress (user_id, module_id, started_at) VALUES (?,?,?)', uid, mid, now()); return one('SELECT * FROM progress WHERE user_id = ? AND module_id = ?', uid, mid); }
function publicUser(u) { if (!u) return null; const g = u.group_id ? one('SELECT name, kind FROM groups WHERE id = ?', u.group_id) : null; return { id: u.id, username: u.username, name: u.display_name, role: u.role, group: g ? g.name : null, groupKind: g ? g.kind : null, groupId: u.group_id, background: u.background, settings: JSON.parse(u.settings || '{}'), mustChange: !!u.must_change, created: u.created, lastLogin: u.last_login, lastSeen: u.last_seen, active: !!u.active }; }
function canSee(viewer, target) {
  if (viewer.role === 'admin') return true;
  if (viewer.id === target.id) return true;
  if (viewer.role === 'trainer') return !!one('SELECT 1 FROM trainer_groups WHERE trainer_id = ? AND group_id = ?', viewer.id, target.group_id);
  return false;
}
function visibleUsers(viewer) {
  if (viewer.role === 'admin') return q('SELECT * FROM users ORDER BY display_name');
  return q('SELECT u.* FROM users u JOIN trainer_groups t ON t.group_id = u.group_id WHERE t.trainer_id = ? ORDER BY u.display_name', viewer.id);
}
// Stufen automatisch nachziehen (Grundkurs ist Startstufe)
function ensureStage1(uid) { run("INSERT OR IGNORE INTO stages (user_id, stage, via) VALUES (?, 1, 'start')", uid); }
function moduleComplete(uid, mid) {
  const s = E.computeState(userRows(uid));
  const m = s.modules[mid];
  if (m && m.complete) {
    const p = one('SELECT completed_at FROM progress WHERE user_id = ? AND module_id = ?', uid, mid);
    if (p && !p.completed_at) {
      run('UPDATE progress SET completed_at = ? WHERE user_id = ? AND module_id = ?', now(), uid, mid);
      const mod = E.content().modules.get(mid);
      event(uid, mod.kind === 'projekt' ? 'projekt' : 'modul', `${mod.kind === 'projekt' ? 'Praxisprojekt' : 'Modul'} abgeschlossen: ${mod.title}`, { module: mid, badge: mod.badge || null });
      // Bereichs-Niveau erreicht?
      const a = s.areas[mod.area];
      return { completed: true, module: mid, badge: mod.kind === 'projekt' ? mod.badge : null, niveau: a.niveau, area: mod.area };
    }
  }
  return { completed: false };
}

// ---------- Übungen bewerten ----------
function scoreExercise(solved, passed, total, failedBefore) {
  if (solved) return Math.round(100 * Math.max(0.6, 1 - 0.05 * failedBefore));
  return total ? Math.round(80 * passed / total) : 0;
}
function runExercise(ex, payload) {
  if (ex.type === 'st') {
    const files = { main: String(payload.files && payload.files.main || ''), var: String(payload.files && payload.files.var || ''), typ: String(payload.files && payload.files.typ || '') };
    if (files.main.length + files.var.length + files.typ.length > 200000) bad('Code zu groß');
    const r = ST.runTests(ex, files);
    return { type: 'st', ok: r.ok, passed: r.passed, total: r.total, compileError: r.compileError, tests: r.tests.map(t => ({ name: t.name, ok: t.ok, msg: t.msg, detail: t.detail })), stored: files };
  }
  if (ex.type === 'git') {
    const hist = Array.isArray(payload.history) ? payload.history.slice(0, 2000) : [];
    const r = GIT.replay(ex, hist);
    const checks = GIT.checkState(ex, r.st);
    const passed = checks.filter(c => c.ok).length;
    return { type: 'git', ok: passed === checks.length, passed, total: checks.length, tests: checks.map(c => ({ name: c.type, ok: c.ok, msg: c.msg })), stored: { history: hist } };
  }
  bad('Unbekannter Übungstyp');
}

// ---------- Routen ----------
const routes = [];
const route = (method, pattern, opts, fn) => { if (typeof opts === 'function') { fn = opts; opts = {}; } const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (s, k) => { keys.push(k); return '([^/]+)'; }) + '$'); routes.push({ method, re, keys, fn, opts }); };

// Setup / Login
route('GET', '/api/setup', { public: true }, () => ({ needsSetup: !one('SELECT 1 FROM users WHERE role = ? LIMIT 1', 'admin') }));
route('POST', '/api/setup', { public: true }, (ctx, b) => {
  if (one('SELECT 1 FROM users WHERE role = ? LIMIT 1', 'admin')) bad('Ist bereits eingerichtet', 403);
  if (!b.username || !b.password || String(b.password).length < 8) bad('Benutzername und Passwort (mind. 8 Zeichen) nötig');
  const { salt, hash } = hashPw(b.password);
  const r = run('INSERT INTO users (username, display_name, role, pw_hash, pw_salt, must_change) VALUES (?,?,?,?,?,0)', b.username.trim(), (b.name || b.username).trim(), 'admin', hash, salt);
  ensureStage1(r.lastInsertRowid);
  return login(ctx, one('SELECT * FROM users WHERE id = ?', r.lastInsertRowid));
});
const loginAttempts = new Map();
route('POST', '/api/login', { public: true }, (ctx, b) => {
  const key = ctx.ip + '|' + String(b.username || '').toLowerCase();
  const la = loginAttempts.get(key) || { n: 0, t: 0 };
  if (la.n >= 8 && Date.now() - la.t < 5 * 60000) bad('Zu viele Fehlversuche – bitte 5 Minuten warten', 429);
  const u = one('SELECT * FROM users WHERE username = ? AND active = 1', String(b.username || '').trim());
  if (!u || !checkPw(u, b.password)) { loginAttempts.set(key, { n: la.n + 1, t: Date.now() }); bad('Benutzername oder Passwort falsch', 401); }
  loginAttempts.delete(key);
  return login(ctx, u);
});
function login(ctx, u) {
  const token = crypto.randomBytes(32).toString('hex');
  run('INSERT INTO sessions (token, user_id, expires) VALUES (?,?,?)', token, u.id, Date.now() + 1000 * 3600 * 24 * 14);
  run('UPDATE users SET last_login = ? WHERE id = ?', now(), u.id);
  ensureStage1(u.id);
  ctx.setCookie = `bse=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${3600 * 24 * 14}`;
  return { ok: true, user: publicUser(u) };
}
route('POST', '/api/logout', (ctx) => { run('DELETE FROM sessions WHERE token = ?', ctx.token); ctx.setCookie = 'bse=; Path=/; Max-Age=0'; return { ok: true }; });
route('POST', '/api/password', (ctx, b) => {
  const u = one('SELECT * FROM users WHERE id = ?', ctx.user.id);
  if (!u.must_change && !checkPw(u, b.old)) bad('Altes Passwort falsch', 403);
  if (!b.password || String(b.password).length < 8) bad('Das neue Passwort braucht mindestens 8 Zeichen');
  const { salt, hash } = hashPw(b.password);
  run('UPDATE users SET pw_hash = ?, pw_salt = ?, must_change = 0 WHERE id = ?', hash, salt, u.id);
  return { ok: true };
});

// Inhalte
let catalogCache = null;
function catalog() {
  if (catalogCache && catalogCache.v === E.content().version) return catalogCache.data;
  const Cn = E.content();
  const data = {
    stages: E.STAGES, kp: E.KP, stageReq: E.STAGE_REQ, kpThreshold: Cn.kpThreshold, earlyPass: E.EARLY_PASS, pass: E.PASS,
    areas: Cn.areas.map(a => ({ id: a.id, title: a.title, short: a.short, description: a.description,
      modules: a.modules.map(m => ({ id: m.id, area: a.id, level: m.level, kind: m.kind, title: m.title, summary: m.summary, minutes: m.minutes, req: m.req || [], badge: m.badge || null, proof: !!m.proof,
        objectives: (m.objectives || []).length, exercises: (m.exercises || []).map(x => ({ id: x.id, type: x.type, title: x.title, variant: x.variant || null })), maxKP: E.moduleMaxKP(m), unlocks: Cn.unlocks.get(m.id) || [] })) })),
    exams: { 'elektro-check': { title: Cn.exams['elektro-check'] ? Cn.exams['elektro-check'].title : 'Elektro-Kompetenzcheck', description: Cn.exams['elektro-check'] ? Cn.exams['elektro-check'].description : '' } }
  };
  catalogCache = { v: Cn.version, data };
  return data;
}
route('GET', '/api/catalog', () => catalog());
route('GET', '/api/module/:id', (ctx) => {
  const m = E.content().modules.get(ctx.params.id); if (!m) bad('Modul nicht gefunden', 404);
  const uid = ctx.user.id;
  const st = stateOf(uid);
  const p = one('SELECT * FROM progress WHERE user_id = ? AND module_id = ?', uid, m.id) || { quiz_attempts: 0 };
  const best = new Map(q('SELECT * FROM exercise_best WHERE user_id = ? AND module_id = ?', uid, m.id).map(r => [r.exercise_id, r]));
  const staff = ctx.user.role !== 'learner';
  const mod = E.publicModule(m, { showSolution: x => staff || !!(best.get(x.id) && best.get(x.id).solved_at) });
  mod.exercises.forEach(x => { const b = best.get(x.id); x.saved = b ? JSON.parse(b.draft || b.code || 'null') : null; x.solved = !!(b && b.solved_at); x.attempts = b ? b.attempts : 0; x.best = b ? b.best_passed : 0; });
  // Quiz in aktueller Versuchs-Variante
  const seed = `${uid}:${m.id}:quiz:${p.quiz_attempts || 0}`;
  mod.quiz = (m.quiz || []).map((qq, i) => E.publicQuestion(E.renderQuestion(qq, seed + ':' + i)));
  mod.state = st.modules[m.id];
  mod.unlocked = st.unlocked[m.id];
  return mod;
});
route('GET', '/api/sources', () => {
  const out = [];
  for (const a of E.content().areas) for (const m of a.modules) {
    for (const r of m.readings || []) out.push(Object.assign({ kind: 'text', area: a.id, module: m.id, moduleTitle: m.title }, r));
    for (const v of m.videos || []) out.push(Object.assign({ kind: 'video', area: a.id, module: m.id, moduleTitle: m.title }, v));
  }
  return out;
});

// Eigener Zustand
route('GET', '/api/me', (ctx) => {
  const u = one('SELECT * FROM users WHERE id = ?', ctx.user.id);
  run('UPDATE users SET last_seen = ? WHERE id = ?', now(), u.id);
  return { user: publicUser(u), state: stateOf(u.id) };
});
route('POST', '/api/settings', (ctx, b) => {
  const u = one('SELECT * FROM users WHERE id = ?', ctx.user.id);
  const s = Object.assign(JSON.parse(u.settings || '{}'), b.settings || {});
  const bg = ['keine', 'tia', 'codesys', 'andere'].includes(b.background) ? b.background : u.background;
  run('UPDATE users SET settings = ?, background = ?, display_name = ? WHERE id = ?', JSON.stringify(s), bg, (b.name || u.display_name).slice(0, 80), u.id);
  return { ok: true };
});
function requireUnlocked(uid, mid) {
  const st = stateOf(uid);
  if (!st.unlocked[mid] || !st.unlocked[mid].ok) bad('Modul ist noch gesperrt – du kannst es lesen, aber noch nicht bearbeiten', 403);
  return st;
}
route('POST', '/api/progress/objective', (ctx, b) => {
  const m = E.content().modules.get(b.module); if (!m) bad('Modul unbekannt', 404);
  requireUnlocked(ctx.user.id, m.id);
  const p = ensureProgress(ctx.user.id, m.id);
  const done = JSON.parse(p.objectives || '[]');
  const ids = m.objectives.map(o => o.id);
  const idx = ids.indexOf(b.objective); if (idx < 0) bad('Ziel unbekannt');
  if (b.done) {
    if (ids.slice(0, idx).some(i => !done.includes(i))) bad('Erst die vorherigen Ziele erledigen');
    if (!done.includes(b.objective)) { done.push(b.objective); event(ctx.user.id, 'ziel', `Ziel erledigt: ${m.objectives[idx].title}`, { module: m.id }); }
  } else {
    const k = done.indexOf(b.objective); if (k >= 0) done.splice(k, 1);
  }
  run('UPDATE progress SET objectives = ? WHERE user_id = ? AND module_id = ?', JSON.stringify(done), ctx.user.id, m.id);
  return { ok: true, done, completion: moduleComplete(ctx.user.id, m.id), kp: E.KP.objective };
});
route('POST', '/api/progress/video', (ctx, b) => {
  const p = ensureProgress(ctx.user.id, b.module);
  const v = JSON.parse(p.videos || '[]');
  if (b.seen && !v.includes(b.video)) v.push(b.video);
  if (!b.seen) { const k = v.indexOf(b.video); if (k >= 0) v.splice(k, 1); }
  run('UPDATE progress SET videos = ? WHERE user_id = ? AND module_id = ?', JSON.stringify(v), ctx.user.id, b.module);
  return { ok: true };
});
route('POST', '/api/quiz/:module', (ctx, b) => {
  const m = E.content().modules.get(ctx.params.module); if (!m) bad('Modul unbekannt', 404);
  requireUnlocked(ctx.user.id, m.id);
  const p = ensureProgress(ctx.user.id, m.id);
  const seed = `${ctx.user.id}:${m.id}:quiz:${p.quiz_attempts || 0}`;
  const answers = b.answers || [];
  const res = m.quiz.map((qq, i) => {
    const r = E.renderQuestion(qq, seed + ':' + i);
    const ok = E.checkAnswer(qq, r, answers[i]);
    run('INSERT INTO answers (user_id, ref, kind, correct) VALUES (?,?,?,?)', ctx.user.id, `q:${m.id}:${i}`, 'quiz', ok ? 1 : 0);
    return { ok, explain: qq.explain, solution: E.solutionText(qq, r) };
  });
  const nOk = res.filter(r => r.ok).length;
  const passed = nOk === m.quiz.length;
  const attempts = (p.quiz_attempts || 0) + 1;
  const frac = nOk / m.quiz.length;
  const best = Math.max(p.quiz_best || 0, frac);
  let score = p.quiz_passed ? p.quiz_score : (passed ? Math.max(50, 100 - 15 * (attempts - 1)) : Math.round(best * 80));
  run('UPDATE progress SET quiz_attempts = ?, quiz_best = ?, quiz_passed = ?, quiz_score = ? WHERE user_id = ? AND module_id = ?', attempts, best, p.quiz_passed || passed ? 1 : 0, score, ctx.user.id, m.id);
  if (passed && !p.quiz_passed) event(ctx.user.id, 'quiz', `Wissensprüfung bestanden: ${m.title} (Versuch ${attempts})`, { module: m.id });
  return { passed, results: res, attempts, score, completion: passed ? moduleComplete(ctx.user.id, m.id) : { completed: false } };
});
route('POST', '/api/exercise/:module/:ex/save', (ctx, b) => {
  const m = E.content().modules.get(ctx.params.module); if (!m) bad('Modul unbekannt', 404);
  const ex = (m.exercises || []).find(x => x.id === ctx.params.ex); if (!ex) bad('Übung unbekannt', 404);
  const draft = JSON.stringify(b.files ? { files: b.files } : { history: b.history || [] }).slice(0, 300000);
  run('INSERT INTO exercise_best (user_id, module_id, exercise_id, total, draft) VALUES (?,?,?,?,?) ON CONFLICT(user_id, module_id, exercise_id) DO UPDATE SET draft = excluded.draft', ctx.user.id, m.id, ex.id, (ex.tests || ex.checks || []).length, draft);
  return { ok: true };
});
route('POST', '/api/exercise/:module/:ex/check', (ctx, b) => {
  const m = E.content().modules.get(ctx.params.module); if (!m) bad('Modul unbekannt', 404);
  const ex = (m.exercises || []).find(x => x.id === ctx.params.ex); if (!ex) bad('Übung unbekannt', 404);
  requireUnlocked(ctx.user.id, m.id);
  ensureProgress(ctx.user.id, m.id);
  const r = runExercise(ex, b);
  const prev = one('SELECT * FROM exercise_best WHERE user_id = ? AND module_id = ? AND exercise_id = ?', ctx.user.id, m.id, ex.id);
  const attempts = (prev ? prev.attempts : 0) + 1;
  const solvedBefore = !!(prev && prev.solved_at);
  const failedBefore = (prev ? prev.failed_before_solve : 0) + (r.ok || solvedBefore ? 0 : 1);
  const bestPassed = Math.max(prev ? prev.best_passed : 0, r.passed);
  const solved = solvedBefore || r.ok;
  const score = solvedBefore ? prev.score : scoreExercise(r.ok, bestPassed, r.total, prev ? prev.failed_before_solve : 0);
  const stored = JSON.stringify(r.type === 'st' ? { files: r.stored } : r.stored);
  run(`INSERT INTO exercise_best (user_id, module_id, exercise_id, best_passed, total, attempts, failed_before_solve, solved_at, score, code, draft) VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(user_id, module_id, exercise_id) DO UPDATE SET best_passed = excluded.best_passed, total = excluded.total, attempts = excluded.attempts, failed_before_solve = excluded.failed_before_solve,
       solved_at = COALESCE(exercise_best.solved_at, excluded.solved_at), score = excluded.score, code = CASE WHEN excluded.solved_at IS NOT NULL OR exercise_best.solved_at IS NULL THEN excluded.code ELSE exercise_best.code END, draft = excluded.draft`,
    ctx.user.id, m.id, ex.id, bestPassed, r.total, attempts, failedBefore, r.ok && !solvedBefore ? now() : (solvedBefore ? prev.solved_at : null), score, stored, stored);
  run('INSERT INTO exercise_runs (user_id, module_id, exercise_id, passed, total, compile_error, failed) VALUES (?,?,?,?,?,?,?)', ctx.user.id, m.id, ex.id, r.passed, r.total,
    r.compileError ? r.compileError.text : null, JSON.stringify(r.tests.filter(t => !t.ok).map(t => t.name)));
  if (r.ok && !solvedBefore) event(ctx.user.id, 'uebung', `Übung gelöst: ${ex.title} (${attempts}. Prüfung)`, { module: m.id, exercise: ex.id });
  const out = { ok: r.ok, passed: r.passed, total: r.total, compileError: r.compileError, tests: r.tests, attempts, score, firstSolve: r.ok && !solvedBefore };
  if (r.ok) { out.solution = ex.solution || null; out.completion = moduleComplete(ctx.user.id, m.id); }
  return out;
});
route('POST', '/api/proof/:module', (ctx, b) => {
  const m = E.content().modules.get(ctx.params.module); if (!m || !m.proof) bad('Kein Nachweis für dieses Modul nötig');
  requireUnlocked(ctx.user.id, m.id);
  const url = String(b.url || '').trim();
  if (!/^https?:\/\/\S+$/.test(url)) bad('Bitte einen gültigen Link angeben (z. B. https://git.breitner.de/…)');
  ensureProgress(ctx.user.id, m.id);
  run("UPDATE progress SET proof_url = ?, proof_status = 'pending', proof_comment = NULL WHERE user_id = ? AND module_id = ?", url, ctx.user.id, m.id);
  event(ctx.user.id, 'nachweis', `Nachweis eingereicht: ${m.title}`, { module: m.id, url });
  return { ok: true };
});
route('POST', '/api/heartbeat', (ctx, b) => {
  const sec = Math.min(Math.max(+b.seconds || 0, 0), 120);
  if (!sec) return { ok: true };
  if (b.module && E.content().modules.has(b.module)) { ensureProgress(ctx.user.id, b.module); run('UPDATE progress SET time_sec = time_sec + ? WHERE user_id = ? AND module_id = ?', sec, ctx.user.id, b.module); }
  const row = one("SELECT id FROM timelog WHERE user_id = ? AND day = ? AND source = 'automatisch'", ctx.user.id, today());
  if (row) run('UPDATE timelog SET minutes = minutes + ? WHERE id = ?', sec / 60, row.id);
  else run("INSERT INTO timelog (user_id, day, minutes, source, note) VALUES (?,?,?,'automatisch','Aktive Zeit in der Plattform')", ctx.user.id, today(), sec / 60);
  run('UPDATE users SET last_seen = ? WHERE id = ?', now(), ctx.user.id);
  return { ok: true };
});
route('GET', '/api/log', (ctx) => {
  const uid = ctx.query.user ? +ctx.query.user : ctx.user.id;
  const t = one('SELECT * FROM users WHERE id = ?', uid); if (!t || !canSee(ctx.user, t)) bad('Kein Zugriff', 403);
  return {
    time: q('SELECT id, day, minutes, note, source, module_id FROM timelog WHERE user_id = ? ORDER BY day DESC, id DESC LIMIT 400', uid),
    events: q('SELECT ts, type, text, data FROM events WHERE user_id = ? ORDER BY id DESC LIMIT 200', uid),
    reflections: q('SELECT week, good, blocked, goal, ts FROM reflections WHERE user_id = ? ORDER BY week DESC', uid)
  };
});
route('POST', '/api/time', (ctx, b) => {
  const min = +b.minutes; if (!(min > 0 && min <= 720)) bad('Minuten zwischen 1 und 720');
  const day = /^\d{4}-\d{2}-\d{2}$/.test(b.day || '') ? b.day : today();
  run("INSERT INTO timelog (user_id, day, minutes, note, source) VALUES (?,?,?,?,'manuell')", ctx.user.id, day, min, String(b.note || '').slice(0, 300));
  return { ok: true };
});
route('DELETE', '/api/time/:id', (ctx) => { run("DELETE FROM timelog WHERE id = ? AND user_id = ? AND source = 'manuell'", +ctx.params.id, ctx.user.id); return { ok: true }; });
route('POST', '/api/reflection', (ctx, b) => {
  const week = b.week || isoWeek(new Date());
  run('INSERT INTO reflections (user_id, week, good, blocked, goal) VALUES (?,?,?,?,?) ON CONFLICT(user_id, week) DO UPDATE SET good = excluded.good, blocked = excluded.blocked, goal = excluded.goal, ts = datetime(\'now\')',
    ctx.user.id, week, String(b.good || '').slice(0, 2000), String(b.blocked || '').slice(0, 2000), String(b.goal || '').slice(0, 500));
  event(ctx.user.id, 'rueckblick', `Wochenrückblick ${week} gespeichert`);
  return { ok: true, week };
});

// ---------- Prüfungen ----------
function examAccess(uid, examId, st) {
  if (examId === 'elektro-check') return { ok: true, early: false };
  const m = /^stage-(\d)$/.exec(examId); if (!m) bad('Prüfung unbekannt', 404);
  const S = +m[1];
  if (S !== st.stage + 1) bad(S <= st.stage ? 'Diese Stufe hast du bereits.' : `Erst die Stufe ${E.STAGES[S - 2]} erreichen.`, 403);
  const R = st.stageReq[S];
  return { ok: true, early: !R.ready };
}
route('GET', '/api/exams', (ctx) => {
  const uid = ctx.query.user ? +ctx.query.user : ctx.user.id;
  const t = one('SELECT * FROM users WHERE id = ?', uid); if (!t || !canSee(ctx.user, t)) bad('Kein Zugriff', 403);
  return q('SELECT id, exam_id, early, started, finished, score, q_score, code_score, grade, passed FROM exams WHERE user_id = ? ORDER BY id DESC', uid);
});
function examView(row, uid) {
  const plan = JSON.parse(row.plan);
  const questions = plan.questions.map((x, i) => { const qq = E.questionByRef(x.ref); return Object.assign(E.publicQuestion(E.renderQuestion(qq, row.seed + ':' + i)), { area: x.area || x.category }); });
  const tasks = plan.tasks.map(ref => { const ex = E.exerciseByRef(ref); const c = Object.assign({}, ex); delete c.solution; delete c.hints; c.ref = ref; return c; });
  return { id: row.id, examId: row.exam_id, title: plan.title, description: plan.description, early: !!row.early, pass: row.early ? E.EARLY_PASS : plan.pass, weights: plan.weights, questions, tasks, started: row.started, saved: JSON.parse(row.answers || 'null'), savedCodes: JSON.parse(row.codes || 'null') };
}
route('POST', '/api/exam/:id/start', (ctx) => {
  const uid = ctx.user.id;
  const st = stateOf(uid);
  const acc = examAccess(uid, ctx.params.id, st);
  const open = one('SELECT * FROM exams WHERE user_id = ? AND exam_id = ? AND finished IS NULL', uid, ctx.params.id);
  if (open) return examView(open, uid);
  const seed = crypto.randomBytes(8).toString('hex');
  const plan = E.buildExam(ctx.params.id, st, seed);
  if (!plan.questions.length && !plan.tasks.length) bad('Für diese Prüfung gibt es noch keine Inhalte');
  const r = run('INSERT INTO exams (user_id, exam_id, early, seed, plan) VALUES (?,?,?,?,?)', uid, ctx.params.id, acc.early ? 1 : 0, seed, JSON.stringify(plan));
  event(uid, 'pruefung', `Prüfung begonnen: ${plan.title}${acc.early ? ' (vorgezogen)' : ''}`);
  return examView(one('SELECT * FROM exams WHERE id = ?', r.lastInsertRowid), uid);
});
route('POST', '/api/exam/attempt/:aid/save', (ctx, b) => {
  const row = one('SELECT * FROM exams WHERE id = ? AND user_id = ? AND finished IS NULL', +ctx.params.aid, ctx.user.id); if (!row) bad('Prüfung nicht offen', 404);
  run('UPDATE exams SET answers = ?, codes = ? WHERE id = ?', JSON.stringify(b.answers || []).slice(0, 100000), JSON.stringify(b.codes || {}).slice(0, 400000), row.id);
  return { ok: true };
});
route('POST', '/api/exam/attempt/:aid/run', (ctx, b) => {
  const row = one('SELECT * FROM exams WHERE id = ? AND user_id = ? AND finished IS NULL', +ctx.params.aid, ctx.user.id); if (!row) bad('Prüfung nicht offen', 404);
  const plan = JSON.parse(row.plan);
  if (!plan.tasks.includes(b.ref)) bad('Aufgabe gehört nicht zur Prüfung');
  const r = runExercise(E.exerciseByRef(b.ref), b);
  return { ok: r.ok, passed: r.passed, total: r.total, compileError: r.compileError, tests: r.tests };
});
route('POST', '/api/exam/attempt/:aid/submit', (ctx, b) => {
  const uid = ctx.user.id;
  const row = one('SELECT * FROM exams WHERE id = ? AND user_id = ? AND finished IS NULL', +ctx.params.aid, uid); if (!row) bad('Prüfung nicht offen', 404);
  const plan = JSON.parse(row.plan);
  const answers = b.answers || [];
  const qres = plan.questions.map((x, i) => {
    const qq = E.questionByRef(x.ref); const r = E.renderQuestion(qq, row.seed + ':' + i);
    const ok = E.checkAnswer(qq, r, answers[i]);
    run('INSERT INTO answers (user_id, ref, kind, correct) VALUES (?,?,?,?)', uid, x.ref, 'exam', ok ? 1 : 0);
    return { ref: x.ref, area: x.area || x.category, ok, explain: qq.explain, solution: E.solutionText(qq, r) };
  });
  const codes = b.codes || {};
  const cres = plan.tasks.map(ref => { const ex = E.exerciseByRef(ref); const r = runExercise(ex, codes[ref] || {}); return { ref, title: ex.title, passed: r.passed, total: r.total, ok: r.ok, compileError: r.compileError ? r.compileError.text : null }; });
  const qScore = plan.questions.length ? 100 * qres.filter(r => r.ok).length / plan.questions.length : null;
  const cScore = cres.length ? 100 * cres.reduce((s, r) => s + (r.total ? r.passed / r.total : 0), 0) / cres.length : null;
  let score = qScore !== null && cScore !== null ? plan.weights.questions * qScore + plan.weights.code * cScore : (qScore !== null ? qScore : cScore);
  score = Math.round(score * 10) / 10;
  const need = row.early ? E.EARLY_PASS : plan.pass;
  const passed = score >= need;
  const g = E.grade(score);
  run('UPDATE exams SET finished = ?, score = ?, q_score = ?, code_score = ?, grade = ?, passed = ?, answers = ?, codes = ?, detail = ? WHERE id = ?', now(), score, qScore, cScore, g, passed ? 1 : 0,
    JSON.stringify(answers), JSON.stringify(codes).slice(0, 400000), JSON.stringify({ questions: qres, code: cres }), row.id);
  event(uid, 'pruefung', `${plan.title}: ${score} Punkte, Note ${g} – ${passed ? 'bestanden' : 'nicht bestanden'}`, { exam: row.exam_id, score });
  let stageUp = null;
  if (passed && /^stage-/.test(row.exam_id)) {
    const S = +row.exam_id.split('-')[1];
    const via = row.early ? 'pruefung' : 'regulaer';
    run('INSERT OR IGNORE INTO stages (user_id, stage, via) VALUES (?,?,?)', uid, S, via);
    stageUp = { stage: S, name: E.STAGES[S - 1], via };
    event(uid, 'stufe', `Stufe erreicht: ${E.STAGES[S - 1]}${row.early ? ' (per vorgezogener Prüfung anerkannt)' : ''}`, stageUp);
  }
  return { score, qScore, cScore, grade: g, gradeText: E.GRADE_TEXT[g], passed, need, questions: qres, code: cres, stageUp };
});
route('GET', '/api/exam/attempt/:aid', (ctx) => {
  const row = one('SELECT * FROM exams WHERE id = ?', +ctx.params.aid); if (!row) bad('Nicht gefunden', 404);
  const t = one('SELECT * FROM users WHERE id = ?', row.user_id); if (!canSee(ctx.user, t)) bad('Kein Zugriff', 403);
  return { id: row.id, examId: row.exam_id, early: !!row.early, started: row.started, finished: row.finished, score: row.score, grade: row.grade, passed: !!row.passed, detail: JSON.parse(row.detail || 'null'), plan: JSON.parse(row.plan) };
});

// Eigene Daten exportieren
route('GET', '/api/export', (ctx) => {
  const uid = ctx.query.user ? +ctx.query.user : ctx.user.id;
  const t = one('SELECT * FROM users WHERE id = ?', uid); if (!t || !canSee(ctx.user, t)) bad('Kein Zugriff', 403);
  ctx.download = `becomestengineer-${t.username}-${today()}.json`;
  return { exportedAt: now(), user: publicUser(t), state: stateOf(uid), progress: q('SELECT * FROM progress WHERE user_id = ?', uid), exercises: q('SELECT module_id, exercise_id, best_passed, total, attempts, solved_at, score, code FROM exercise_best WHERE user_id = ?', uid),
    exams: q('SELECT exam_id, early, started, finished, score, grade, passed FROM exams WHERE user_id = ?', uid), stages: q('SELECT * FROM stages WHERE user_id = ?', uid), time: q('SELECT * FROM timelog WHERE user_id = ?', uid), reflections: q('SELECT * FROM reflections WHERE user_id = ?', uid) };
});

// ---------- Ausbildung (Admin & Ausbilder) ----------
const staff = { staff: true };
function summary(u) {
  const st = stateOf(u.id);
  const mins = one('SELECT COALESCE(SUM(minutes),0) m FROM timelog WHERE user_id = ?', u.id).m;
  const week = one("SELECT COALESCE(SUM(minutes),0) m FROM timelog WHERE user_id = ? AND day >= date('now','-6 day')", u.id).m;
  const pend = q("SELECT module_id FROM progress WHERE user_id = ? AND proof_status = 'pending'", u.id).length;
  const scores = Object.values(st.areas).filter(a => a.points !== null);
  const pts = scores.length ? Math.round(scores.reduce((s, a) => s + a.points, 0) / scores.length) : null;
  return Object.assign(publicUser(u), { stage: st.stage, stageName: st.stageName, kp: st.kp, points: pts, grade: E.grade(pts), minutes: Math.round(mins), weekMinutes: Math.round(week), pendingProofs: pend,
    areas: Object.fromEntries(Object.values(st.areas).map(a => [a.id, { niveau: a.niveau, grade: a.grade, points: a.points, pct: a.pct }])), elektroOk: st.elektroOk, next: st.next && st.next.title });
}
route('GET', '/api/admin/overview', staff, (ctx) => {
  const users = visibleUsers(ctx.user).filter(u => u.role === 'learner' || ctx.user.role === 'admin');
  const groups = ctx.user.role === 'admin' ? q('SELECT * FROM groups ORDER BY name') : q('SELECT g.* FROM groups g JOIN trainer_groups t ON t.group_id = g.id WHERE t.trainer_id = ? ORDER BY g.name', ctx.user.id);
  const trainers = q("SELECT u.id, u.display_name name, group_concat(t.group_id) groups FROM users u LEFT JOIN trainer_groups t ON t.trainer_id = u.id WHERE u.role = 'trainer' GROUP BY u.id");
  return { users: users.map(summary), groups, trainers: trainers.map(t => ({ id: t.id, name: t.name, groups: t.groups ? String(t.groups).split(',').map(Number) : [] })), role: ctx.user.role };
});
route('GET', '/api/admin/user/:id', staff, (ctx) => {
  const u = one('SELECT * FROM users WHERE id = ?', +ctx.params.id); if (!u || !canSee(ctx.user, u)) bad('Kein Zugriff', 403);
  const st = stateOf(u.id);
  // Schwachstellen: Fragen mit Fehlern
  const ans = q('SELECT ref, SUM(correct) ok, COUNT(*) n FROM answers WHERE user_id = ? GROUP BY ref', u.id);
  const weak = [];
  for (const a of ans) {
    if (a.ok === a.n) continue;
    const [kind, mid, i] = a.ref.split(':');
    let text = null, area = null, module = null;
    if (kind === 'ec') { const qq = E.content().exams['elektro-check'].questions[+mid]; text = qq && qq.q; area = 'elektro'; module = 'Elektro-Kompetenzcheck · ' + (qq && qq.category); }
    else { const m = E.content().modules.get(mid); if (m) { const qq = (kind === 'q' ? m.quiz : m.exam)[+i]; text = qq && qq.q; area = m.area; module = m.title; } }
    weak.push({ ref: a.ref, text, area, module, wrong: a.n - a.ok, total: a.n });
  }
  weak.sort((x, y) => y.wrong - x.wrong);
  const runs = q('SELECT module_id, exercise_id, COUNT(*) n, SUM(passed = total) ok, MAX(ts) last, SUM(compile_error IS NOT NULL) compile FROM exercise_runs WHERE user_id = ? GROUP BY module_id, exercise_id', u.id);
  const failedTests = {};
  for (const r of q('SELECT module_id, exercise_id, failed FROM exercise_runs WHERE user_id = ? AND failed IS NOT NULL AND failed <> \'[]\'', u.id)) {
    const k = r.module_id + '/' + r.exercise_id; failedTests[k] = failedTests[k] || {};
    for (const t of JSON.parse(r.failed)) failedTests[k][t] = (failedTests[k][t] || 0) + 1;
  }
  const exercises = runs.map(r => { const m = E.content().modules.get(r.module_id); const ex = m && (m.exercises || []).find(x => x.id === r.exercise_id); const b = one('SELECT * FROM exercise_best WHERE user_id = ? AND module_id = ? AND exercise_id = ?', u.id, r.module_id, r.exercise_id);
    return { module: r.module_id, moduleTitle: m && m.title, area: m && m.area, exercise: r.exercise_id, title: ex && ex.title, runs: r.n, compileErrors: r.compile, solved: !!(b && b.solved_at), score: b ? b.score : 0, best: b ? b.best_passed : 0, total: b ? b.total : 0, last: r.last, failedTests: failedTests[r.module_id + '/' + r.exercise_id] || {} }; });
  const time = q('SELECT day, SUM(minutes) m FROM timelog WHERE user_id = ? GROUP BY day ORDER BY day', u.id);
  return { user: summary(u), state: st, weak: weak.slice(0, 60), exercises, exams: q('SELECT id, exam_id, early, started, finished, score, q_score, code_score, grade, passed FROM exams WHERE user_id = ? ORDER BY id DESC', u.id),
    events: q('SELECT ts, type, text FROM events WHERE user_id = ? ORDER BY id DESC LIMIT 80', u.id), time, reflections: q('SELECT * FROM reflections WHERE user_id = ? ORDER BY week DESC LIMIT 12', u.id),
    proofs: q("SELECT module_id, proof_url, proof_status, proof_comment, reviewed_at FROM progress WHERE user_id = ? AND proof_url IS NOT NULL", u.id) };
});
route('GET', '/api/admin/user/:id/code/:module/:ex', staff, (ctx) => {
  const u = one('SELECT * FROM users WHERE id = ?', +ctx.params.id); if (!u || !canSee(ctx.user, u)) bad('Kein Zugriff', 403);
  const b = one('SELECT code, draft, solved_at, attempts FROM exercise_best WHERE user_id = ? AND module_id = ? AND exercise_id = ?', u.id, ctx.params.module, ctx.params.ex);
  return b ? { code: JSON.parse(b.code || b.draft || 'null'), solved: !!b.solved_at, attempts: b.attempts } : { code: null };
});
route('POST', '/api/admin/users', staff, (ctx, b) => {
  const role = ctx.user.role === 'admin' && ['admin', 'trainer', 'learner'].includes(b.role) ? b.role : 'learner';
  const gid = b.groupId ? +b.groupId : null;
  if (ctx.user.role === 'trainer' && (!gid || !one('SELECT 1 FROM trainer_groups WHERE trainer_id = ? AND group_id = ?', ctx.user.id, gid))) bad('Ausbilder können nur in eigenen Gruppen anlegen', 403);
  const username = String(b.username || '').trim();
  if (!/^[A-Za-z0-9._-]{2,40}$/.test(username)) bad('Benutzername: 2–40 Zeichen, Buchstaben, Ziffern, . _ -');
  if (one('SELECT 1 FROM users WHERE username = ?', username)) bad('Benutzername existiert bereits');
  const pw = b.password || crypto.randomBytes(5).toString('hex');
  const { salt, hash } = hashPw(pw);
  const r = run('INSERT INTO users (username, display_name, role, group_id, pw_hash, pw_salt, must_change) VALUES (?,?,?,?,?,?,1)', username, String(b.name || username).slice(0, 80), role, gid, hash, salt);
  ensureStage1(r.lastInsertRowid);
  return { ok: true, id: r.lastInsertRowid, initialPassword: pw };
});
route('PATCH', '/api/admin/user/:id', staff, (ctx, b) => {
  const u = one('SELECT * FROM users WHERE id = ?', +ctx.params.id); if (!u || !canSee(ctx.user, u)) bad('Kein Zugriff', 403);
  const out = { ok: true };
  if (b.name) run('UPDATE users SET display_name = ? WHERE id = ?', String(b.name).slice(0, 80), u.id);
  if (b.groupId !== undefined) {
    if (ctx.user.role === 'trainer' && b.groupId && !one('SELECT 1 FROM trainer_groups WHERE trainer_id = ? AND group_id = ?', ctx.user.id, +b.groupId)) bad('Keine Berechtigung für diese Gruppe', 403);
    run('UPDATE users SET group_id = ? WHERE id = ?', b.groupId ? +b.groupId : null, u.id);
  }
  if (b.role && ctx.user.role === 'admin' && ['admin', 'trainer', 'learner'].includes(b.role)) {
    if (u.role === 'admin' && b.role !== 'admin' && one("SELECT COUNT(*) n FROM users WHERE role = 'admin' AND active = 1").n <= 1) bad('Der letzte Admin kann nicht herabgestuft werden');
    run('UPDATE users SET role = ? WHERE id = ?', b.role, u.id);
  }
  if (b.active !== undefined && ctx.user.role === 'admin' && u.id !== ctx.user.id) { run('UPDATE users SET active = ? WHERE id = ?', b.active ? 1 : 0, u.id); if (!b.active) run('DELETE FROM sessions WHERE user_id = ?', u.id); }
  if (b.resetPassword) {
    const pw = crypto.randomBytes(5).toString('hex'); const { salt, hash } = hashPw(pw);
    run('UPDATE users SET pw_hash = ?, pw_salt = ?, must_change = 1 WHERE id = ?', hash, salt, u.id); run('DELETE FROM sessions WHERE user_id = ?', u.id);
    out.initialPassword = pw;
  }
  if (b.trainerGroups && ctx.user.role === 'admin') {
    tx(() => { run('DELETE FROM trainer_groups WHERE trainer_id = ?', u.id); for (const g of b.trainerGroups) run('INSERT OR IGNORE INTO trainer_groups VALUES (?,?)', u.id, +g); });
  }
  return out;
});
route('DELETE', '/api/admin/user/:id', staff, (ctx) => {
  if (ctx.user.role !== 'admin') bad('Nur Admins', 403);
  const u = one('SELECT * FROM users WHERE id = ?', +ctx.params.id); if (!u) bad('Nicht gefunden', 404);
  if (u.id === ctx.user.id) bad('Du kannst dich nicht selbst löschen');
  run('DELETE FROM users WHERE id = ?', u.id);
  return { ok: true };
});
route('POST', '/api/admin/groups', staff, (ctx, b) => {
  if (ctx.user.role !== 'admin') bad('Nur Admins', 403);
  const name = String(b.name || '').trim(); if (!name) bad('Name fehlt');
  const kind = ['berufsschule', 'dual', 'mitarbeiter'].includes(b.kind) ? b.kind : 'mitarbeiter';
  if (b.id) run('UPDATE groups SET name = ?, kind = ?, description = ? WHERE id = ?', name, kind, b.description || null, +b.id);
  else run('INSERT INTO groups (name, kind, description) VALUES (?,?,?)', name, kind, b.description || null);
  return { ok: true };
});
route('DELETE', '/api/admin/groups/:id', staff, (ctx) => { if (ctx.user.role !== 'admin') bad('Nur Admins', 403); run('DELETE FROM groups WHERE id = ?', +ctx.params.id); return { ok: true }; });
route('GET', '/api/admin/proofs', staff, (ctx) => {
  const ids = new Set(visibleUsers(ctx.user).map(u => u.id));
  return q("SELECT p.user_id, u.display_name name, p.module_id, p.proof_url, p.proof_status, p.proof_comment FROM progress p JOIN users u ON u.id = p.user_id WHERE p.proof_status = 'pending' ORDER BY p.user_id")
    .filter(r => ids.has(r.user_id)).map(r => Object.assign(r, { moduleTitle: (E.content().modules.get(r.module_id) || {}).title, badge: (E.content().modules.get(r.module_id) || {}).badge }));
});
route('POST', '/api/admin/proofs/:uid/:module', staff, (ctx, b) => {
  const u = one('SELECT * FROM users WHERE id = ?', +ctx.params.uid); if (!u || !canSee(ctx.user, u)) bad('Kein Zugriff', 403);
  const status = b.approve ? 'approved' : 'rejected';
  run('UPDATE progress SET proof_status = ?, proof_comment = ?, reviewer_id = ?, reviewed_at = ? WHERE user_id = ? AND module_id = ?', status, String(b.comment || '').slice(0, 1000) || null, ctx.user.id, now(), u.id, ctx.params.module);
  const m = E.content().modules.get(ctx.params.module);
  event(u.id, 'nachweis', `Nachweis ${b.approve ? 'bestätigt' : 'zurückgegeben'}: ${m ? m.title : ctx.params.module}${b.comment ? ' – „' + b.comment + '“' : ''}`, { module: ctx.params.module });
  if (b.approve) moduleComplete(u.id, ctx.params.module);
  return { ok: true };
});
route('GET', '/api/admin/export.csv', staff, (ctx) => {
  const rows = visibleUsers(ctx.user).map(summary);
  const areas = E.content().areas.map(a => a.id);
  const head = ['Name', 'Benutzer', 'Rolle', 'Gruppe', 'Stufe', 'KP', 'Punkte', 'Note', 'Lernzeit (h)', 'Elektro-Check', ...areas.flatMap(a => [a + ' Niveau', a + ' Note'])];
  const esc = v => { const s = v == null ? '' : String(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const lines = [head.join(';'), ...rows.map(r => [r.name, r.username, r.role, r.group, r.stageName, r.kp, r.points, r.grade, (r.minutes / 60).toFixed(1).replace('.', ','), r.elektroOk ? 'bestanden' : '', ...areas.flatMap(a => [r.areas[a] ? r.areas[a].niveau : '', r.areas[a] ? r.areas[a].grade : ''])].map(esc).join(';'))];
  ctx.raw = { type: 'text/csv; charset=utf-8', body: '﻿' + lines.join('\r\n'), file: `bewertung-${today()}.csv` };
});
route('POST', '/api/admin/backup', staff, (ctx) => {
  if (ctx.user.role !== 'admin') bad('Nur Admins', 403);
  return { ok: true, file: backup() };
});
route('POST', '/api/admin/reload', staff, (ctx) => { if (ctx.user.role !== 'admin') bad('Nur Admins', 403); E.load(); return { ok: true, modules: E.content().modules.size }; });

function backup() {
  const f = path.join(DATA, 'backups', `becomestengineer-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)}.db`);
  db.exec(`VACUUM INTO '${f.replace(/'/g, "''")}'`);
  const all = fs.readdirSync(path.join(DATA, 'backups')).filter(x => x.endsWith('.db')).sort();
  while (all.length > 30) fs.unlinkSync(path.join(DATA, 'backups', all.shift()));
  return path.basename(f);
}
// tägliches Backup
let lastBackupDay = null;
setInterval(() => { const d = today(); if (d !== lastBackupDay && new Date().getHours() >= 2) { lastBackupDay = d; try { backup(); } catch (e) { console.error('Backup fehlgeschlagen', e.message); } } run('DELETE FROM sessions WHERE expires < ?', Date.now()); }, 15 * 60000).unref();

// ---------- HTTP ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
function send(req, res, code, body, headers) {
  headers = Object.assign({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }, headers || {});
  let buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
  if (buf.length > 1024 && /gzip/.test(req.headers['accept-encoding'] || '') && /json|text|javascript|svg/.test(headers['Content-Type'] || '')) { buf = zlib.gzipSync(buf); headers['Content-Encoding'] = 'gzip'; }
  headers['Content-Length'] = buf.length;
  res.writeHead(code, headers); res.end(buf);
}
function serveStatic(req, res, p) {
  let file = path.normalize(path.join(PUB, decodeURIComponent(p)));
  if (!file.startsWith(PUB)) return send(req, res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUB, 'index.html');
  const ext = path.extname(file);
  send(req, res, 200, fs.readFileSync(file), { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=300' });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname === '/' ? '/index.html' : url.pathname);
  const ctx = { ip: req.socket.remoteAddress, query: Object.fromEntries(url.searchParams), params: {} };
  try {
    const r = routes.find(x => x.method === req.method && x.re.test(url.pathname));
    if (!r) bad('Nicht gefunden', 404);
    const m = r.re.exec(url.pathname); r.keys.forEach((k, i) => { ctx.params[k] = decodeURIComponent(m[i + 1]); });
    const cookie = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith('bse='));
    ctx.token = cookie ? cookie.slice(4) : null;
    if (!r.opts.public) {
      const s = ctx.token && one('SELECT s.*, u.id uid FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires > ? AND u.active = 1', ctx.token, Date.now());
      if (!s) bad('Bitte anmelden', 401);
      ctx.user = one('SELECT id, role, group_id, display_name FROM users WHERE id = ?', s.uid);
      if (r.opts.staff && ctx.user.role === 'learner') bad('Nur für Ausbilder und Admins', 403);
    }
    let body = {};
    if (req.method !== 'GET') {
      if (req.headers['content-type'] && !/application\/json/.test(req.headers['content-type'])) bad('JSON erwartet', 415);
      const chunks = []; let size = 0;
      for await (const c of req) { size += c.length; if (size > 2e6) bad('Anfrage zu groß', 413); chunks.push(c); }
      body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
    }
    const out = await r.fn(ctx, body);
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
    if (ctx.setCookie) headers['Set-Cookie'] = ctx.setCookie;
    if (ctx.raw) return send(req, res, 200, ctx.raw.body, { 'Content-Type': ctx.raw.type, 'Content-Disposition': `attachment; filename="${ctx.raw.file}"` });
    if (ctx.download) headers['Content-Disposition'] = `attachment; filename="${ctx.download}"`;
    send(req, res, 200, out === undefined ? { ok: true } : out, headers);
  } catch (e) {
    const code = e.code && typeof e.code === 'number' ? e.code : (e instanceof SyntaxError ? 400 : 500);
    if (code === 500) console.error(e);
    send(req, res, code, { error: code === 500 ? 'Interner Fehler: ' + e.message : e.message }, { 'Content-Type': 'application/json; charset=utf-8' });
  }
});
if (require.main === module) {
  server.listen(PORT, HOST, () => {
    const C = E.content();
    console.log(`becomeStEngineer läuft auf http://localhost:${PORT}  (${C.modules.size} Module, ${[...C.modules.values()].reduce((s, m) => s + (m.exercises || []).length, 0)} Übungen)`);
    console.log(`Daten: ${DATA}`);
    if (!one("SELECT 1 FROM users WHERE role = 'admin'")) console.log('Erster Start: Im Browser öffnen und das Admin-Konto anlegen.');
  });
}
module.exports = { server, db };
