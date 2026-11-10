/* Prüfungen: Stufenprüfungen, Elektro-Kompetenzcheck, Prüfung durchführen, Ergebnisse */
(function () {
  'use strict';
  const App = window.App, h = App.h, B = App.badges;

  App.route('pruefungen', async (main, examId, attemptId) => {
    if (examId === 'ergebnis' && attemptId) return resultView(main, attemptId);
    if (examId) return runExam(main, examId);
    const s = App.state;
    const hist = await App.get('/api/exams');
    main.appendChild(h('div.page-head', h('div.grow', h('div.eyebrow', 'Prüfungen'), h('h1', 'Stufen und Kompetenzchecks'),
      h('p', `Bestanden ab ${App.catalog.pass} Punkten (Note 4). Eine vorgezogene Stufenprüfung – ohne erfüllte Anforderungen – braucht mindestens ${App.catalog.earlyPass} Punkte (Note 3) und erkennt die Inhalte darunter an. Code zählt 60 %, Fragen 40 %.`))));
    const grid = h('div.grid.g-2');
    // Ladder
    const ladder = h('div.ladder');
    for (let S = 1; S <= 7; S++) {
      const R = s.stageReq[S];
      const cur = S === s.stage + 1, got = S <= s.stage;
      const rung = h('div.rung' + (cur ? '.cur' : '') + (!got && !cur ? '.off' : ''), App.svg(B.stage(S, 56, !got)),
        h('div', h('div', h('b', { style: { color: '#fff' } }, App.stageName(S)), ' ', got ? h('span.chip.okc', 'erreicht') : cur ? h('span.chip.on', 'nächste Stufe') : null),
          S === 1 ? h('div.muted', { style: { fontSize: '12.5px' } }, 'Startstufe für alle') : reqList(R, cur)),
        S > 1 && cur ? examButtons(R) : S > 1 && R.exam ? h('span.mono.muted', `${R.exam.score} P. · Note ${R.exam.grade}`) : h('span'));
      ladder.appendChild(rung);
    }
    grid.appendChild(h('section.pnl', h('div.ph', h('span', 'Stufenleiter'), h('span', 'Grundkurs → Genie')), h('div.pb', ladder)));
    // Elektro-Check + Verlauf
    const ec = App.catalog.exams['elektro-check'];
    const ecBest = s.examBest['elektro-check'];
    grid.appendChild(h('div.stack',
      h('section.pnl.sig', h('div.ph', h('span', 'Elektro-Kompetenzcheck'), h('span', 'Pflicht für Junior')),
        h('div.pb', h('p', ec.description || 'Prüft die elektrischen Grundfertigkeiten auf dem Niveau eines ausgelernten Elektronikers für Automatisierungstechnik.'),
          h('p.muted', { style: { fontSize: '13px' } }, '48 zufällig gezogene Fragen aus 8 Kategorien mit wechselnden Zahlenwerten. Beliebig oft wiederholbar; zählt das beste Ergebnis.'),
          h('div.row', ecBest ? h('span.chip.' + (ecBest.passed ? 'okc' : 'badc'), `Bestes Ergebnis: ${ecBest.score} P. · Note ${ecBest.grade}`) : h('span.chip', 'noch nicht abgelegt'), h('span.grow'),
            h('button.btn.primary', { onclick: () => App.go('#/pruefungen/elektro-check') }, ecBest ? 'Erneut ablegen' : 'Starten', App.icon('arrow'))))),
      h('section.pnl', h('div.ph', h('span', 'Verlauf')), hist.length ? h('div.tbl-wrap', h('table.tbl', h('thead', h('tr', h('th', 'Prüfung'), h('th', 'Datum'), h('th', 'Fragen'), h('th', 'Code'), h('th', 'Punkte'), h('th', 'Note'), h('th', ''))),
        h('tbody', hist.map(x => h('tr' + (x.finished ? '.click' : ''), { onclick: x.finished ? () => App.go('#/pruefungen/ergebnis/' + x.id) : null },
          h('td', examTitle(x.exam_id), x.early ? h('span.tag', { style: { marginLeft: '6px' } }, 'vorgezogen') : null), h('td.mono', App.fmtDate(x.started)),
          h('td.mono', x.q_score != null ? Math.round(x.q_score) + ' %' : '–'), h('td.mono', x.code_score != null ? Math.round(x.code_score) + ' %' : '–'),
          h('td.mono', x.finished ? x.score : 'offen'), h('td', x.finished ? App.gradeCell(x.grade, x.score) : h('a', { href: '#/pruefungen/' + x.exam_id }, 'fortsetzen')),
          h('td', x.finished ? h('span', { class: x.passed ? 'ok' : 'bad' }, x.passed ? 'bestanden' : 'nicht bestanden') : null))))))
        : h('div.pb.muted', 'Noch keine Prüfungen abgelegt.'))));
    main.appendChild(grid);
  });
  function examTitle(id) { return id === 'elektro-check' ? 'Elektro-Kompetenzcheck' : 'Stufenprüfung ' + App.stageName(+id.split('-')[1]); }
  const okIcon = ok => App.svg(`<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${ok ? '#5FBF8F' : 'none'}" stroke="${ok ? '#5FBF8F' : '#5E7580'}" stroke-width="1.6"/>${ok ? '<path d="M5 8.2 7 10l4-4.2" stroke="#0F1D25" stroke-width="1.8" fill="none"/>' : ''}</svg>`);
  function reqList(R, open) {
    const items = R.items.map(i => h('li', okIcon(i.ok), `${App.area(i.area).title} N${i.level}`, h('span.faint.mono', { style: { fontSize: '11px' } }, ` ${i.done}/${i.total}`)));
    items.push(h('li', okIcon(R.kpOk), `${App.fmtN(R.kp)} Kompetenzpunkte`));
    if (R.elektroCheck) items.push(h('li', okIcon(R.elektroOk), 'Elektro-Kompetenzcheck'));
    items.push(h('li', okIcon(!!(R.exam && R.exam.passed)), 'Stufenprüfung'));
    return open ? h('ul.req-list', items) : h('details', h('summary', { style: { cursor: 'pointer', fontSize: '12.5px', color: 'var(--muted)' } }, 'Anforderungen'), h('ul.req-list', items));
  }
  function examButtons(R) {
    const id = 'stage-' + R.stage;
    return h('div', { style: { display: 'grid', gap: '6px' } },
      R.ready ? h('button.btn.primary', { onclick: () => App.go('#/pruefungen/' + id) }, 'Prüfung ablegen')
        : h('button.btn', { title: `Vorziehen: mind. ${App.catalog.earlyPass} Punkte nötig`, onclick: () => { if (confirm(`Stufenprüfung „${R.name}“ vorziehen?\n\nDie Anforderungen sind noch nicht erfüllt. Bestanden ist die Prüfung dann erst ab ${App.catalog.earlyPass} Punkten (Note 3). Dafür werden die Inhalte darunter anerkannt.`)) App.go('#/pruefungen/' + id); } }, 'Vorziehen'));
  }

  // ---------- Prüfung durchführen ----------
  async function runExam(main, examId) {
    let ex;
    try { ex = await App.post(`/api/exam/${examId}/start`); } catch (e) { main.appendChild(h('div.pnl', h('div.pb', h('b.bad', e.message), ' ', h('a', { href: '#/pruefungen' }, 'Zurück')))); return; }
    const answers = Array.isArray(ex.saved) ? ex.saved : [];
    const codes = ex.savedCodes || {};
    const save = App.debounce(() => App.post(`/api/exam/attempt/${ex.id}/save`, { answers, codes }).catch(() => {}), 1200);
    main.appendChild(h('div.page-head', h('div.grow', h('div.eyebrow', ex.early ? 'Prüfung · vorgezogen' : 'Prüfung'), h('h1', ex.title), h('p', `${ex.description} Bestanden ab ${ex.pass} Punkten. Kein Zeitlimit – deine Antworten werden laufend gespeichert.`)),
      h('a.btn.ghost', { href: '#/pruefungen' }, App.icon('back'), 'Später fortsetzen')));
    // Fragen
    const qBox = h('div.quiz');
    const qEls = ex.questions.map((q, i) => {
      const el = App.questionEl(q, i, answers, 'ex' + ex.id);
      restore(el, q, answers[i]);
      el.addEventListener('change', save); el.addEventListener('input', save);
      const ar = q.area && App.area(q.area);
      if (ar) el.prepend(h('div.eyebrow', { style: { marginBottom: '6px', color: App.areaColor(q.area) } }, ar.title));
      else if (q.area) el.prepend(h('div.eyebrow', { style: { marginBottom: '6px' } }, q.area));
      return el;
    });
    qBox.append(...qEls);
    if (ex.questions.length) main.appendChild(h('section.pnl', { style: { marginBottom: '20px' } }, h('div.ph', h('span', `Teil 1 · Fragen (${ex.questions.length})`), h('span', `${Math.round(ex.weights.questions * 100)} %`)), h('div.pb', qBox)));
    // Code-Aufgaben
    const labs = [];
    ex.tasks.forEach((t, k) => {
      const holder = h('div', { style: { height: '760px', display: 'flex', flexDirection: 'column', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden' } });
      const lab = App.stLab({ ex: t, saved: codes[t.ref], onSave: p => { codes[t.ref] = p; save(); },
        onCheck: async p => { codes[t.ref] = p; save(); return App.post(`/api/exam/attempt/${ex.id}/run`, Object.assign({ ref: t.ref }, p)); } });
      labs.push(lab);
      holder.appendChild(lab.el); lab.el.style.height = '100%';
      main.appendChild(h('section.pnl', { style: { marginBottom: '20px' } }, h('div.ph', h('span', `Teil 2 · Programmieraufgabe ${k + 1} von ${ex.tasks.length}: ${t.title}`), h('span', `${Math.round(ex.weights.code * 100 / ex.tasks.length)} %`)),
        h('div.pb', h('p.muted', { style: { fontSize: '13px' } }, '„Prüfen“ zeigt dir die Tests, wertet aber noch nicht. Gewertet wird beim Abgeben.'), holder)));
    });
    const submit = h('button.btn.primary.big', { onclick: async () => {
      const open = ex.questions.filter((q, i) => answers[i] === undefined || answers[i] === '' || (Array.isArray(answers[i]) && !answers[i].length)).length;
      if (!confirm(`Prüfung jetzt abgeben?${open ? `\n\n${open} Frage(n) sind noch unbeantwortet.` : ''}`)) return;
      submit.disabled = true;
      labs.forEach((l, k) => { codes[ex.tasks[k].ref] = { files: l.getFiles() }; });
      try {
        const before = App.state;
        const r = await App.post(`/api/exam/attempt/${ex.id}/submit`, { answers, codes });
        labs.forEach(l => l.destroy());
        r.questions.forEach((res, i) => App.showQuizResult(qEls[i], ex.questions[i], res));
        App.fx({ eyebrow: r.passed ? 'Prüfung bestanden' : 'Nicht bestanden', title: `${r.score} Punkte · Note ${r.grade}`, text: `${ex.title} – ${r.gradeText}. ${r.passed ? '' : 'Benötigt: ' + r.need + ' Punkte.'}`, svg: r.passed ? App.badges.check('logik') : null, sound: r.passed ? 'level' : 'fail', ms: 5000 });
        await App.refresh();
        void before;
        App.go('#/pruefungen/ergebnis/' + ex.id);
      } catch (e) { submit.disabled = false; App.toast(e.message, 'bad'); }
    } }, 'Prüfung abgeben', App.icon('arrow'));
    main.appendChild(h('div.row', { style: { justifyContent: 'flex-end', margin: '10px 0 40px' } }, submit));
  }
  function restore(el, q, a) {
    if (a === undefined) return;
    if (q.type === 'numeric') { const i = el.querySelector('input'); if (i) i.value = a; return; }
    const inputs = App.$$('input', el);
    [].concat(a).forEach(k => { if (inputs[k]) inputs[k].checked = true; });
  }

  async function resultView(main, aid) {
    const r = await App.get('/api/exam/attempt/' + aid);
    const d = r.detail || { questions: [], code: [] };
    const byArea = {};
    d.questions.forEach(q => { const k = q.area || '–'; byArea[k] = byArea[k] || { ok: 0, n: 0 }; byArea[k].n++; if (q.ok) byArea[k].ok++; });
    main.appendChild(h('div.page-head', h('div.grow', h('div.eyebrow', 'Prüfungsergebnis'), h('h1', r.plan.title), h('p', `${App.fmtTime(r.finished)} · ${r.early ? 'vorgezogen · ' : ''}${r.passed ? 'bestanden' : 'nicht bestanden'}`)),
      h('a.btn.ghost', { href: '#/pruefungen' }, App.icon('back'), 'Zur Übersicht')));
    main.appendChild(h('div.grid.g-3',
      h('section.pnl', h('div.ph', h('span', 'Ergebnis')), h('div.pb', h('div.row', App.gradeCell(r.grade, r.score), h('b', { style: { fontSize: '26px', color: '#fff' } }, r.score + ' Punkte')), h('p.muted', r.passed ? 'Bestanden.' : 'Nicht bestanden – du kannst die Prüfung jederzeit wiederholen.'))),
      h('section.pnl', h('div.ph', h('span', 'Fragen nach Bereich')), h('div.pb', h('table.tbl', h('tbody', Object.entries(byArea).map(([k, v]) => h('tr', h('td', App.area(k) ? App.area(k).title : k), h('td.mono', `${v.ok}/${v.n}`), h('td.mono', Math.round(100 * v.ok / v.n) + ' %'))))))),
      h('section.pnl', h('div.ph', h('span', 'Programmieraufgaben')), h('div.pb', d.code.length ? h('table.tbl', h('tbody', d.code.map(c => h('tr', h('td', c.title), h('td.mono', `${c.passed}/${c.total}`), h('td', c.ok ? h('span.ok', '✓') : h('span.bad', c.compileError ? 'Übersetzungsfehler' : '✗')))))) : h('p.muted', 'Keine')))));
    const wrong = d.questions.map((q, i) => ({ q, i })).filter(x => !x.q.ok);
    if (wrong.length) main.appendChild(h('section.pnl', { style: { marginTop: '20px' } }, h('div.ph', h('span', `Falsch beantwortet (${wrong.length})`)), h('div.pb', wrong.map(({ q, i }) => h('div.note', h('b', `Frage ${i + 1}${q.area && App.area(q.area) ? ' · ' + App.area(q.area).title : ''}`), h('span', { html: App.md(q.explain || '').replace(/^<p>|<\/p>$/g, '') }))))));
  }
})();
