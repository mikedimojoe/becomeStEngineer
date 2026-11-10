#!/usr/bin/env node
// End-to-End-Test der Bewertung: Lernende/r schließt die Junior-Anforderungen ab, besteht Elektro-Check und Stufenprüfung.
// Startet einen eigenen Server mit leerer Test-Datenbank.  Aufruf: node tools/e2e-stage.js
'use strict';
const path = require('path');
const fs = require('fs');
const os = require('os');
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'bse-e2e-'));
process.env.DATA_DIR = DATA;
const { server, db } = require('../server/server.js');
const E = require('../server/engine.js');

let port, cookie = { admin: '', lena: '' };
async function call(who, method, url, body) {
  const r = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'Content-Type': 'application/json', Cookie: cookie[who] }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc) cookie[who] = sc.split(';')[0];
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${method} ${url}: ${j && j.error}`);
  return j;
}
const ok = (c, m) => { if (!c) { console.error('FEHLER: ' + m); process.exitCode = 1; } else console.log('ok   ' + m); };
function answersFor(qs, seedBase) {
  return qs.map((q, i) => {
    const r = E.renderQuestion(q, seedBase + ':' + i);
    if (q.type === 'single') return r._map.indexOf(q.correct);
    if (q.type === 'multi') return q.correct.map(c => r._map.indexOf(c));
    return E.solutionText(q, r).value;
  });
}

server.listen(0, '127.0.0.1', async () => {
  port = server.address().port;
  try {
    await call('admin', 'POST', '/api/setup', { username: 'admin', password: 'admin1234', name: 'Admin' });
    await call('admin', 'POST', '/api/admin/groups', { name: 'Test', kind: 'dual' });
    const u = await call('admin', 'POST', '/api/admin/users', { username: 'lena', name: 'Lena', groupId: 1, password: 'start1234' });
    await call('lena', 'POST', '/api/login', { username: 'lena', password: 'start1234' });
    await call('lena', 'POST', '/api/password', { password: 'lena12345' });
    const uid = u.id;
    let me = await call('lena', 'GET', '/api/me');
    ok(me.state.stage === 1, 'Startstufe Grundkurs');
    // Gesperrtes Modul darf nicht bearbeitet werden
    const lockedId = E.content().areas.find(a => a.id === 'logik').modules.find(m => m.level === 2).id;
    let blocked = false; try { await call('lena', 'POST', '/api/progress/objective', { module: lockedId, objective: E.content().modules.get(lockedId).objectives[0].id, done: true }); } catch (e) { blocked = /gesperrt/.test(e.message); }
    ok(blocked, 'Level-2-Modul ist in Stufe Grundkurs gesperrt');
    // Junior-Anforderungen abarbeiten (Reihenfolge nach req)
    const R = E.STAGE_REQ[2];
    const todo = [];
    for (const [aid, L] of Object.entries(R.areas)) for (const m of E.content().areas.find(a => a.id === aid).modules) if (m.level <= L && m.kind !== 'zusatz') todo.push(m);
    let guard = 0;
    while (todo.length && guard++ < 200) {
      me = await call('lena', 'GET', '/api/me');
      const idx = todo.findIndex(m => me.state.unlocked[m.id].ok);
      if (idx < 0) throw new Error('Kein freies Modul mehr, offen: ' + todo.map(m => m.id).join(', '));
      const m = todo.splice(idx, 1)[0];
      for (const o of m.objectives) await call('lena', 'POST', '/api/progress/objective', { module: m.id, objective: o.id, done: true });
      for (const x of m.exercises || []) {
        if (x.type === 'st') { await call('lena', 'POST', `/api/exercise/${m.id}/${x.id}/check`, { files: { main: 'PROGRAM _CYCLIC\nEND_PROGRAM', var: '', typ: '' } }); // ein Fehlversuch
          const r = await call('lena', 'POST', `/api/exercise/${m.id}/${x.id}/check`, { files: x.solution }); ok(r.ok && r.score === 95, `Übung ${m.id}/${x.id} gelöst (95 Punkte nach 1 Fehlversuch)`); }
        else { const r = await call('lena', 'POST', `/api/exercise/${m.id}/${x.id}/check`, { history: x.solution }); ok(r.ok, `Git-Übung ${m.id}/${x.id} gelöst`); }
      }
      const p = db.prepare('SELECT quiz_attempts FROM progress WHERE user_id = ? AND module_id = ?').get(uid, m.id);
      const ans = answersFor(m.quiz, `${uid}:${m.id}:quiz:${p ? p.quiz_attempts : 0}`);
      const qr = await call('lena', 'POST', '/api/quiz/' + m.id, { answers: ans });
      ok(qr.passed, `Quiz ${m.id} bestanden`);
      if (m.proof) {
        await call('lena', 'POST', '/api/proof/' + m.id, { url: 'https://git.breitner.de/ausbildung/lena/' + m.id });
        await call('admin', 'POST', `/api/admin/proofs/${uid}/${m.id}`, { approve: true, comment: 'passt' });
      }
      me = await call('lena', 'GET', '/api/me');
      ok(me.state.modules[m.id].complete, `Modul ${m.id} abgeschlossen (Note ${E.grade(me.state.modules[m.id].score)})`);
    }
    me = await call('lena', 'GET', '/api/me');
    const R2 = me.state.stageReq[2];
    ok(R2.items.every(i => i.ok), 'Alle Bereichs-Anforderungen für Junior erfüllt');
    ok(R2.kpOk, `KP ${me.state.kp} ≥ ${R2.kp}`);
    ok(!R2.ready && me.state.next.exam === 'elektro-check', 'Nächster Schritt: Elektro-Kompetenzcheck');
    // Elektro-Check
    let ex = await call('lena', 'POST', '/api/exam/elektro-check/start');
    let row = db.prepare('SELECT seed, plan FROM exams WHERE id = ?').get(ex.id);
    let plan = JSON.parse(row.plan);
    let ans = plan.questions.map((x, i) => answersFor([E.questionByRef(x.ref)], row.seed + ':' + i + '§')[0]);
    // answersFor hängt ':0' an → Seed exakt nachbilden
    ans = plan.questions.map((x, i) => { const q = E.questionByRef(x.ref); const r = E.renderQuestion(q, row.seed + ':' + i); return q.type === 'single' ? r._map.indexOf(q.correct) : q.type === 'multi' ? q.correct.map(c => r._map.indexOf(c)) : E.solutionText(q, r).value; });
    let res = await call('lena', 'POST', `/api/exam/attempt/${ex.id}/submit`, { answers: ans, codes: {} });
    ok(res.passed && res.score === 100, `Elektro-Check bestanden (${res.score} Punkte, Note ${res.grade})`);
    me = await call('lena', 'GET', '/api/me');
    ok(me.state.stageReq[2].ready && me.state.next.exam === 'stage-2', 'Nächster Schritt: Stufenprüfung Junior');
    // Stufenprüfung Junior
    ex = await call('lena', 'POST', '/api/exam/stage-2/start');
    row = db.prepare('SELECT seed, plan FROM exams WHERE id = ?').get(ex.id);
    plan = JSON.parse(row.plan);
    ans = plan.questions.map((x, i) => { const q = E.questionByRef(x.ref); const r = E.renderQuestion(q, row.seed + ':' + i); return q.type === 'single' ? r._map.indexOf(q.correct) : q.type === 'multi' ? q.correct.map(c => r._map.indexOf(c)) : E.solutionText(q, r).value; });
    const codes = {}; for (const ref of plan.tasks) codes[ref] = { files: E.exerciseByRef(ref).solution };
    ok(plan.tasks.length >= 1, `Stufenprüfung enthält ${plan.questions.length} Fragen und ${plan.tasks.length} Programmieraufgaben`);
    res = await call('lena', 'POST', `/api/exam/attempt/${ex.id}/submit`, { answers: ans, codes });
    ok(res.passed && res.stageUp && res.stageUp.stage === 2, `Stufenprüfung bestanden → Stufe ${res.stageUp && res.stageUp.name} (${res.score} Punkte)`);
    me = await call('lena', 'GET', '/api/me');
    ok(me.state.stage === 2, 'Stufe ist jetzt Junior');
    ok(me.state.unlocked[lockedId].ok, 'Level-2-Modul ist jetzt freigeschaltet');
    // Vorgezogene Prüfung: falsch beantwortet → nicht bestanden, 67 nötig
    ex = await call('lena', 'POST', '/api/exam/stage-3/start');
    ok(ex.early && ex.pass === 67, 'Senior-Prüfung gilt als vorgezogen (67 Punkte nötig)');
    res = await call('lena', 'POST', `/api/exam/attempt/${ex.id}/submit`, { answers: [], codes: {} });
    ok(!res.passed && !res.stageUp, `Leere vorgezogene Prüfung nicht bestanden (${res.score} Punkte)`);
    // Admin-Sicht
    const ov = await call('admin', 'GET', '/api/admin/overview');
    const lena = ov.users.find(x => x.username === 'lena');
    ok(lena.stage === 2 && lena.grade !== null, `Admin sieht Stufe ${lena.stageName}, Gesamtnote ${lena.grade}`);
    const rep = await call('admin', 'GET', '/api/admin/user/' + uid);
    ok(rep.exercises.length > 10, `Bericht: ${rep.exercises.length} bearbeitete Übungen, ${rep.exams.length} Prüfungen`);
    let denied = false; try { await call('lena', 'GET', '/api/admin/overview'); } catch (e) { denied = /Ausbilder/.test(e.message); }
    ok(denied, 'Lernende haben keinen Zugriff auf die Admin-API');
  } catch (e) { console.error('ABBRUCH:', e.message); process.exitCode = 1; }
  server.close(); db.close();
  fs.rmSync(DATA, { recursive: true, force: true });
});
