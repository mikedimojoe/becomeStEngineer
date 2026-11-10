// Inhalte laden, Fragen rendern, Bewertung berechnen (Punkte, Niveaus, Noten, Stufen, nächster Schritt)
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const AREA_ORDER = ['logik', 'elektro', 'git', 'praxis', 'system', 'komm', 'motion', 'hmi', 'regelung', 'safety'];
const STAGES = ['Grundkurs', 'Junior', 'Senior', 'Engineer', 'Master', 'Guru', 'Genie'];
const KP = { objective: 15, quiz: 40, exercise: 60, module: 75, project: 400, zusatz: 50, exam: 250 };

// Anforderungen je Stufe (Ziel-Stufe → Bereich: Niveau)
const ALL = lvl => Object.fromEntries(AREA_ORDER.map(a => [a, lvl]));
const STAGE_REQ = {
  2: { areas: { logik: 1, elektro: 1, git: 1, praxis: 1, system: 1 }, elektroCheck: true },
  3: { areas: { logik: 2, elektro: 2, git: 2, praxis: 2, system: 2, komm: 2, motion: 2, hmi: 2 } },
  4: { areas: ALL(3) },
  5: { areas: ALL(4) },
  6: { areas: ALL(5) },
  7: { areas: ALL(6) }
};
const EARLY_PASS = 67; // vorgezogene Prüfung: mind. Note 3
const PASS = 50;

// IHK-Notenschlüssel (100-Punkte-Skala)
function grade(points) {
  if (points == null || isNaN(points)) return null;
  if (points >= 92) return 1; if (points >= 81) return 2; if (points >= 67) return 3;
  if (points >= 50) return 4; if (points >= 30) return 5; return 6;
}
const GRADE_TEXT = { 1: 'sehr gut', 2: 'gut', 3: 'befriedigend', 4: 'ausreichend', 5: 'mangelhaft', 6: 'ungenügend' };

// ---------- Inhalte ----------
let C = null;
function load() {
  const areas = [];
  for (const id of AREA_ORDER) {
    const p = path.join(ROOT, 'content', 'areas', id + '.js');
    if (!fs.existsSync(p)) continue;
    delete require.cache[require.resolve(p)];
    const a = require(p);
    a.modules.sort((x, y) => x.level - y.level);
    areas.push(a);
  }
  const modules = new Map();
  for (const a of areas) for (const m of a.modules) { m.area = a.id; modules.set(m.id, m); }
  // "schaltet frei"-Index
  const unlocks = new Map();
  for (const m of modules.values()) for (const r of m.req || []) { if (!unlocks.has(r)) unlocks.set(r, []); unlocks.get(r).push(m.id); }
  const exams = {};
  const exDir = path.join(ROOT, 'content', 'exams');
  if (fs.existsSync(exDir)) for (const f of fs.readdirSync(exDir).filter(f => f.endsWith('.js'))) { const e = require(path.join(exDir, f)); exams[e.id] = e; }
  // KP-Summen je Level (für die Punktekurve)
  const kpUpTo = {};
  for (let L = 1; L <= 6; L++) {
    let s = 0;
    for (const m of modules.values()) if (m.level <= L && m.kind !== 'zusatz') s += moduleMaxKP(m);
    kpUpTo[L] = s;
  }
  const kpThreshold = {};
  for (let S = 2; S <= 7; S++) kpThreshold[S] = Math.round(kpUpTo[S - 1] * 0.8 / 50) * 50;
  C = { areas, modules, unlocks, exams, kpThreshold, version: Date.now() };
  return C;
}
function content() { return C || load(); }
function moduleMaxKP(m) {
  return (m.objectives || []).length * KP.objective + KP.quiz + (m.exercises || []).length * KP.exercise + KP.module + (m.kind === 'projekt' ? KP.project : 0) + (m.kind === 'zusatz' ? KP.zusatz : 0);
}

// ---------- Fragen rendern (zufällige Parameter, deterministisch je Person/Versuch) ----------
function rng(seed) {
  let h = crypto.createHash('sha256').update(String(seed)).digest();
  let i = 0;
  return () => { if (i >= 28) { h = crypto.createHash('sha256').update(h).digest(); i = 0; } const v = h.readUInt32BE(i) / 0x100000000; i += 4; return v; };
}
function renderQuestion(q, seed) {
  const out = { type: q.type, q: q.q, options: q.options, code: q.code, figure: q.figure, unit: q.unit, multi: q.type === 'multi' };
  if (q.type === 'numeric') {
    const r = rng(seed);
    const vals = {};
    for (const [k, [mn, mx, st]] of Object.entries(q.params || {})) {
      const n = Math.floor((mx - mn) / st + 1e-9) + 1;
      vals[k] = +(mn + Math.floor(r() * n) * st).toFixed(6);
    }
    out.q = q.q.replace(/\{(\w+)\}/g, (s, k) => vals[k] !== undefined ? fmtNum(vals[k]) : s);
    out._vals = vals;
  }
  if ((q.type === 'single' || q.type === 'multi') && q.options) {
    // Antworten mischen (Reihenfolge je Versuch)
    const r = rng(seed + ':o');
    const idx = q.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    if (q.options.some(o => /^(alle|keine) (der |genannten )?/i.test(o) || /^(A|B) und (B|C)/.test(o))) idx.sort((a, b) => a - b);
    out.options = idx.map(i => q.options[i]);
    out._map = idx;
  }
  return out;
}
const fmtNum = v => String(v).replace('.', ',');
function numericAnswer(q, vals) {
  const names = Object.keys(q.params || {});
  return Function(...names, 'with(Math){return (' + q.formula + ');}')(...names.map(n => vals[n]));
}
function parseNum(s) { if (typeof s === 'number') return s; const v = parseFloat(String(s || '').replace(/\s/g, '').replace(',', '.')); return isNaN(v) ? null : v; }
// Antwort prüfen; answer: Index/Indexliste in gemischter Reihenfolge bzw. Zahl
function checkAnswer(q, rendered, answer) {
  if (q.type === 'single') return rendered._map[answer] === q.correct;
  if (q.type === 'multi') {
    const picked = new Set((answer || []).map(i => rendered._map[i]));
    const corr = new Set(q.correct);
    return picked.size === corr.size && [...corr].every(c => picked.has(c));
  }
  if (q.type === 'numeric') {
    const v = parseNum(answer); if (v === null) return false;
    const right = numericAnswer(q, rendered._vals);
    const tol = q.tol === undefined ? 0.01 : q.tol;
    return Math.abs(v - right) <= Math.max(Math.abs(right) * tol, 1e-9);
  }
  return false;
}
function solutionText(q, rendered) {
  if (q.type === 'single') return { correct: rendered._map.indexOf(q.correct) };
  if (q.type === 'multi') return { correct: q.correct.map(c => rendered._map.indexOf(c)) };
  if (q.type === 'numeric') { const r = numericAnswer(q, rendered._vals); return { value: +r.toPrecision(5), unit: q.unit || '' }; }
  return {};
}
function publicQuestion(r) { const o = Object.assign({}, r); delete o._vals; delete o._map; return o; }

// ---------- Modul für den Browser aufbereiten ----------
function publicModule(m, opts) {
  const o = Object.assign({}, m);
  o.exercises = (m.exercises || []).map(x => {
    const e = Object.assign({}, x);
    if (!opts.showSolution(x)) delete e.solution;
    if (e.type === 'git') delete e.checks_hidden;
    return e;
  });
  delete o.quiz; delete o.exam;
  o.quizCount = (m.quiz || []).length;
  o.maxKP = moduleMaxKP(m);
  o.unlocks = (content().unlocks.get(m.id) || []);
  return o;
}

// ---------- Zustand einer Person berechnen ----------
// rows: { progress: [...], ex: [...], exams: [...], stages: [...] }
function computeState(rows) {
  const Cn = content();
  const prog = new Map(rows.progress.map(p => [p.module_id, p]));
  const exb = new Map(rows.ex.map(e => [e.module_id + '/' + e.exercise_id, e]));
  const stageRows = rows.stages || [];
  const stage = Math.max(1, ...stageRows.map(s => s.stage));
  const recognized = Math.max(1, ...stageRows.filter(s => s.via === 'pruefung').map(s => s.stage)); // per Prüfung anerkannt bis Level stage-1
  let kp = 0;
  const mods = {};
  for (const m of Cn.modules.values()) {
    const p = prog.get(m.id) || {};
    const objDone = safeJson(p.objectives, []);
    const nObj = (m.objectives || []).length;
    const objCount = (m.objectives || []).filter(o => objDone.includes(o.id)).length;
    const quizOk = !!p.quiz_passed;
    const exs = (m.exercises || []).map(x => {
      const b = exb.get(m.id + '/' + x.id);
      return { id: x.id, solved: !!(b && b.solved_at), best: b ? b.best_passed : 0, total: b ? b.total : (x.tests || x.checks || []).length, attempts: b ? b.attempts : 0, score: b ? b.score : 0 };
    });
    const exSolved = exs.filter(e => e.solved).length;
    const proofOk = m.kind !== 'projekt' || !m.proof || p.proof_status === 'approved';
    const complete = objCount === nObj && quizOk && exSolved === exs.length && proofOk;
    let k = objCount * KP.objective + (quizOk ? KP.quiz : 0) + exSolved * KP.exercise;
    if (complete) k += KP.module + (m.kind === 'projekt' ? KP.project : 0) + (m.kind === 'zusatz' ? KP.zusatz : 0);
    kp += k;
    // Modulnote: Code 70 %, Quiz 30 %
    const quizScore = p.quiz_score == null ? null : p.quiz_score;
    const codeScore = exs.length ? exs.reduce((s, e) => s + (e.score || 0), 0) / exs.length : null;
    const started = objCount > 0 || p.quiz_attempts > 0 || exs.some(e => e.attempts > 0);
    let score = null;
    if (started) {
      if (codeScore !== null && quizScore !== null) score = 0.7 * codeScore + 0.3 * quizScore;
      else if (codeScore !== null && exs.some(e => e.attempts)) score = quizScore === null ? codeScore : 0.7 * codeScore + 0.3 * quizScore;
      else if (quizScore !== null) score = codeScore === null ? quizScore : 0.3 * quizScore;
    }
    const steps = nObj + 1 + exs.length + (m.kind === 'projekt' && m.proof ? 1 : 0);
    const done = objCount + (quizOk ? 1 : 0) + exSolved + (m.kind === 'projekt' && m.proof && p.proof_status === 'approved' ? 1 : 0);
    mods[m.id] = { id: m.id, area: m.area, level: m.level, kind: m.kind, complete, started, kp: k, maxKP: moduleMaxKP(m), objDone, objCount, nObj, quizOk, quizAttempts: p.quiz_attempts || 0, quizScore,
      exs, exSolved, proof: p.proof_url || null, proofStatus: p.proof_status || 'none', proofComment: p.proof_comment || null, score: score === null ? null : Math.round(score), pct: Math.round(100 * done / Math.max(1, steps)),
      timeSec: p.time_sec || 0, videos: safeJson(p.videos, []), completedAt: p.completed_at || null };
  }
  // Exam-KP
  const passedExams = (rows.exams || []).filter(e => e.passed);
  kp += [...new Set(passedExams.map(e => e.exam_id))].length * KP.exam;

  // Niveaus je Bereich
  const meets = (areaId, L) => {
    if (L <= recognized - 1) return true;
    const a = Cn.areas.find(x => x.id === areaId); if (!a) return true;
    return a.modules.filter(m => m.level <= L && m.kind !== 'zusatz').every(m => mods[m.id].complete);
  };
  const areas = {};
  for (const a of Cn.areas) {
    const levels = [...new Set(a.modules.map(m => m.level))].sort();
    let niveau = 0;
    for (let L = 1; L <= 6; L++) { if (meets(a.id, L)) niveau = L; else break; }
    const maxLevel = Math.max(...levels);
    if (niveau > maxLevel) niveau = maxLevel;
    const byLevel = {};
    for (const L of levels) {
      const ms = a.modules.filter(m => m.level === L && m.kind !== 'zusatz');
      const scored = ms.map(m => mods[m.id]).filter(x => x.score !== null);
      const pts = scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : null;
      byLevel[L] = { modules: ms.length, complete: ms.filter(m => mods[m.id].complete).length, points: pts, grade: grade(pts), started: scored.length };
    }
    const allScored = a.modules.filter(m => m.kind !== 'zusatz').map(m => mods[m.id]).filter(x => x.score !== null);
    const pts = allScored.length ? Math.round(allScored.reduce((s, x) => s + x.score, 0) / allScored.length) : null;
    const total = a.modules.filter(m => m.kind !== 'zusatz').length;
    const comp = a.modules.filter(m => m.kind !== 'zusatz' && mods[m.id].complete).length;
    areas[a.id] = { id: a.id, niveau, minLevel: Math.min(...levels), maxLevel, byLevel, points: pts, grade: grade(pts), complete: comp, total, pct: Math.round(100 * comp / Math.max(1, total)) };
  }
  // Prüfungen
  const examBest = {};
  for (const e of rows.exams || []) if (e.finished) { const b = examBest[e.exam_id]; if (!b || e.score > b.score) examBest[e.exam_id] = e; }
  const elektroOk = !!(examBest['elektro-check'] && examBest['elektro-check'].passed);
  // Stufen-Anforderungen
  const stageReq = {};
  for (let S = 2; S <= 7; S++) {
    const R = STAGE_REQ[S];
    const items = Object.entries(R.areas).map(([aid, L]) => {
      const a = Cn.areas.find(x => x.id === aid);
      if (!a) return null;
      const lvl = Math.min(L, Math.max(...a.modules.map(m => m.level)));
      const ms = a.modules.filter(m => m.level <= lvl && m.kind !== 'zusatz');
      return { area: aid, level: lvl, ok: meets(aid, lvl), done: ms.filter(m => mods[m.id].complete).length, total: ms.length };
    }).filter(Boolean);
    const kpOk = kp >= Cn.kpThreshold[S];
    const checkOk = !R.elektroCheck || elektroOk;
    const ready = items.every(i => i.ok) && kpOk && checkOk;
    stageReq[S] = { stage: S, name: STAGES[S - 1], items, kp: Cn.kpThreshold[S], kpOk, elektroCheck: !!R.elektroCheck, elektroOk, ready, achieved: stage >= S, exam: examBest['stage-' + S] || null };
  }
  // Freischaltung
  const unlocked = {};
  for (const m of Cn.modules.values()) {
    const reqOk = (m.req || []).every(r => mods[r] && mods[r].complete);
    const stageOk = m.level <= stage;
    const prevOk = m.level <= 1 || meets(m.area, m.level - 1);
    unlocked[m.id] = { ok: reqOk && stageOk && prevOk, reqOk, stageOk, prevOk, missing: (m.req || []).filter(r => !(mods[r] && mods[r].complete)) };
  }
  return { kp, stage, stageName: STAGES[stage - 1], recognized, modules: mods, areas, stageReq, unlocked, examBest, elektroOk, next: null, kpThreshold: Cn.kpThreshold };
}
function safeJson(s, d) { try { return s ? JSON.parse(s) : d; } catch (e) { return d; } }

// ---------- Nächster Schritt (genau eine Empfehlung) ----------
function nextStep(state) {
  const Cn = content();
  const S = state.stage + 1;
  if (S > 7) return { kind: 'done', title: 'Alle Stufen erreicht', why: 'Du hast die Stufe Genie erreicht. Gib dein Wissen weiter – z. B. mit einem neuen Modul für diese Plattform.', unlocks: '' };
  const R = state.stageReq[S];
  // 1) Elektro-Check für Junior
  if (R.elektroCheck && !state.elektroOk && R.items.filter(i => i.area === 'elektro').every(i => i.ok)) {
    return { kind: 'exam', exam: 'elektro-check', title: 'Elektro-Kompetenzcheck ablegen', why: `Pflicht für die Stufe ${R.name}. Elektrotechnik Niveau 1 hast du – jetzt wird geprüft.`, unlocks: `Danach fehlt dir ${R.ready ? 'nur noch die Stufenprüfung' : 'nur noch ' + missingText(R)}.` };
  }
  // 2) Stufenprüfung
  if (R.ready) return { kind: 'exam', exam: 'stage-' + S, title: `Stufenprüfung „${R.name}“ ablegen`, why: 'Alle Anforderungen sind erfüllt.', unlocks: `Schaltet frei: alle Inhalte der Stufe ${R.name}.` };
  // 3) laufendes Modul fortsetzen, sonst nächstes offenes Modul der geforderten Bereiche
  const required = R.items.filter(i => !i.ok);
  const candidates = [];
  for (const it of required) {
    const a = Cn.areas.find(x => x.id === it.area);
    for (const m of a.modules) {
      if (m.level > it.level || m.kind === 'zusatz') continue;
      const st = state.modules[m.id];
      if (st.complete) continue;
      if (!state.unlocked[m.id].ok) continue;
      candidates.push({ m, st, prio: (st.started ? 0 : 1) * 1000 + m.level * 100 + AREA_ORDER.indexOf(m.area) * 10 + a.modules.indexOf(m) / 100 });
    }
  }
  candidates.sort((x, y) => x.prio - y.prio);
  const c = candidates[0];
  if (!c) {
    if (!R.kpOk) return { kind: 'kp', title: 'Kompetenzpunkte sammeln', why: `Für ${R.name} brauchst du ${R.kp} KP (aktuell ${state.kp}). Bearbeite Zusatzmodule oder offene Übungen.`, unlocks: '' };
    // blockiert durch Nachweis in Prüfung
    const pend = Object.values(state.modules).find(x => x.proofStatus === 'pending');
    if (pend) return { kind: 'wait', module: pend.id, title: 'Nachweis wird geprüft', why: 'Dein Ausbilder prüft gerade deinen Praxisnachweis. Bis dahin: Zusatzmodule oder Stufenprüfung vorziehen.', unlocks: '' };
    return { kind: 'exam', exam: 'stage-' + S, early: true, title: `Stufenprüfung „${R.name}“ vorziehen`, why: 'Aktuell sind keine Module frei. Du kannst die Prüfung vorziehen (mind. 67 Punkte).', unlocks: '' };
  }
  const m = c.m, st = c.st;
  let sub = '';
  if (st.objCount < st.nObj) sub = `Ziel ${st.objCount + 1} von ${st.nObj}: ${m.objectives[st.objCount].title}`;
  else if (st.exSolved < st.exs.length) { const ex = m.exercises.find(x => !st.exs.find(e => e.id === x.id).solved); sub = `Übung: ${ex.title}`; }
  else if (!st.quizOk) sub = 'Wissensprüfung (3 Fragen)';
  else if (m.kind === 'projekt' && st.proofStatus !== 'approved') sub = st.proofStatus === 'pending' ? 'Nachweis wird geprüft' : 'Nachweis-Link einreichen';
  const area = Cn.areas.find(x => x.id === m.area);
  const it = required.find(i => i.area === m.area);
  const unl = (Cn.unlocks.get(m.id) || []).map(id => Cn.modules.get(id)).filter(Boolean);
  const closes = it && it.done + 1 === it.total;
  let unlockTxt = unl.length ? 'Schaltet frei: ' + unl.slice(0, 3).map(x => x.title).join(' · ') : '';
  if (closes) unlockTxt = (unlockTxt ? unlockTxt + ' · ' : '') + `Schließt ${area.title} Niveau ${it.level} ab`;
  return { kind: 'module', module: m.id, area: m.area, title: m.title, sub,
    why: `Fehlt noch für die Stufe ${R.name}: ${area.title} Niveau ${it.level} (${it.done} von ${it.total} Modulen).`,
    unlocks: unlockTxt, minutes: m.minutes, kp: moduleMaxKP(m) - st.kp, level: m.level };
}
function missingText(R) {
  const miss = R.items.filter(i => !i.ok).map(i => `${areaTitle(i.area)} N${i.level}`);
  if (!R.kpOk) miss.push(`${R.kp} KP`);
  return miss.slice(0, 3).join(', ') + (miss.length > 3 ? ' …' : '');
}
function areaTitle(id) { const a = content().areas.find(x => x.id === id); return a ? a.title : id; }

// ---------- Prüfungen zusammenstellen ----------
function buildExam(examId, state, seed) {
  const Cn = content();
  const r = rng(seed);
  const pick = (arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  if (examId === 'elektro-check') {
    const E = Cn.exams['elektro-check'];
    const qs = [];
    for (const [cat, n] of Object.entries(E.draw)) {
      const pool = E.questions.map((q, i) => ({ q, ref: 'ec:' + i })).filter(x => x.q.category === cat);
      qs.push(...pick(pool, n));
    }
    return { id: examId, title: E.title, description: E.description, questions: qs.map(x => ({ ref: x.ref, category: x.q.category })), tasks: [], weights: { questions: 1, code: 0 }, pass: E.passScore || PASS };
  }
  const S = +examId.split('-')[1];
  const L = S - 1;
  const R = STAGE_REQ[S];
  const areaIds = Object.keys(R.areas).filter(a => Cn.areas.find(x => x.id === a));
  // Fragen: aus exam-Pools der Module bis Level L, Schwerpunkt auf Level L
  const pool = [];
  for (const aid of areaIds) {
    const a = Cn.areas.find(x => x.id === aid);
    for (const m of a.modules) {
      if (m.level > Math.min(L, R.areas[aid]) || m.kind === 'zusatz') continue;
      (m.exam || []).forEach((q, i) => pool.push({ ref: `m:${m.id}:${i}`, area: aid, level: m.level, w: m.level === Math.min(L, R.areas[aid]) ? 3 : 1 }));
    }
  }
  const nQ = Math.min(pool.length, 16 + 2 * S);
  const chosen = [];
  const bag = pool.slice();
  while (chosen.length < nQ && bag.length) {
    const tot = bag.reduce((s, x) => s + x.w, 0);
    let t = r() * tot, k = 0;
    while (t > bag[k].w) { t -= bag[k].w; k++; }
    chosen.push(bag.splice(k, 1)[0]);
  }
  // Code-Aufgaben: aus Projektmodulen/Lektionen des Ziel-Levels, unterschiedliche Bereiche
  const exPool = [];
  for (const aid of areaIds) {
    const a = Cn.areas.find(x => x.id === aid);
    const lvl = Math.min(L, R.areas[aid]);
    for (const m of a.modules) if (m.level === lvl && m.kind !== 'zusatz') for (const x of m.exercises || []) if (x.type === 'st') exPool.push({ ref: `${m.id}/${x.id}`, area: aid, projekt: m.kind === 'projekt' });
  }
  const tasks = [];
  const usedAreas = new Set();
  for (const x of pick(exPool.filter(x => x.projekt), exPool.length).concat(pick(exPool.filter(x => !x.projekt), exPool.length))) {
    if (tasks.length >= (S >= 5 ? 3 : 2)) break;
    if (usedAreas.has(x.area)) continue;
    usedAreas.add(x.area); tasks.push(x.ref);
  }
  return { id: examId, title: `Stufenprüfung ${STAGES[S - 1]}`, description: `Fragen aus ${areaIds.length} Bereichen und ${tasks.length} Programmieraufgaben in ST. Code zählt 60 %, Fragen 40 %.`, questions: chosen.map(x => ({ ref: x.ref, area: x.area, level: x.level })), tasks, weights: { questions: 0.4, code: 0.6 }, pass: PASS };
}
function questionByRef(ref) {
  const Cn = content();
  if (ref.startsWith('ec:')) return Cn.exams['elektro-check'].questions[+ref.slice(3)];
  const [, mid, i] = ref.split(':');
  const m = Cn.modules.get(mid);
  return m && m.exam ? m.exam[+i] : null;
}
function exerciseByRef(ref) {
  const [mid, xid] = ref.split('/');
  const m = content().modules.get(mid);
  return m ? (m.exercises || []).find(x => x.id === xid) : null;
}

module.exports = { load, content, STAGES, AREA_ORDER, KP, STAGE_REQ, PASS, EARLY_PASS, grade, GRADE_TEXT, renderQuestion, checkAnswer, solutionText, publicQuestion, publicModule, computeState, nextStep, buildExam, questionByRef, exerciseByRef, moduleMaxKP, rng };
