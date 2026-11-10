/* Modul-Fenster: Einführung, Praxisbezug, Videos, Lesestoff, Ziele mit Anleitung, Übungen, Wissensprüfung, Nachweis */
(function () {
  'use strict';
  const App = window.App, h = App.h, B = App.badges;

  App.openModule = async function (id, focus) {
    let m;
    try { m = await App.get('/api/module/' + encodeURIComponent(id)); } catch (e) { return App.toast(e.message, 'bad'); }
    App.currentModule = id;
    const sheet = h('div.sheet');
    const ov = App.openOverlay(sheet, { label: m.title, onClose: () => { App.currentModule = null; }, after: () => { if (/^#\/(leitstand|lernpfad)/.test(location.hash) || !location.hash) App.render(); } });
    void ov;
    renderModule(sheet, m, focus);
  };

  function renderModule(sheet, m, focus) {
    App.clear(sheet);
    const st = m.state, un = m.unlocked, area = App.area(m.area);
    const head = h('div.sheet-head',
      h('span.tag', { style: { color: App.areaColor(m.area), borderColor: App.areaColor(m.area) } }, area.short || area.title),
      h('span.tag', `N${m.level} · ${App.stageName(m.level)}`),
      m.kind === 'projekt' ? h('span.tag', { style: { color: 'var(--signal)' } }, 'Praxisprojekt') : m.kind === 'zusatz' ? h('span.tag', 'Zusatzmodul') : null,
      h('h2.grow', m.title),
      h('button.iconbtn', { title: 'Vollbild umschalten (F)', 'aria-label': 'Vollbild umschalten', onclick: App.toggleFull }, App.icon('full')),
      h('button.iconbtn', { title: 'Schließen (Esc)', 'aria-label': 'Schließen', onclick: () => App.closeOverlay() }, App.icon('close')));
    const main = h('div.sheet-main');
    const side = h('aside.sheet-side');
    sheet.append(head, h('div.sheet-body', main, side));
    if (!un.ok) main.appendChild(h('div.locknote', App.icon('lock'), ' ', lockText(m, un)));
    let n = 0;
    const sec = (title, ...kids) => h('section.sec', h('h3', h('span.no', String(++n).padStart(2, '0')), title), ...kids);
    // 1 Einführung
    const intro = [h('p.lead', m.briefing)];
    if (m.practice) intro.push(h('div.note', h('b', 'Praxisbezug'), m.practice));
    if (m.transfer) {
      const bg = App.user.background;
      const t = m.transfer;
      if (t.tia && (bg === 'tia' || bg === 'keine' || bg === 'andere')) intro.push(h('div.note', h('b', 'Umsteiger · Siemens TIA Portal'), t.tia));
      if (t.codesys && (bg === 'codesys' || bg === 'keine' || bg === 'andere')) intro.push(h('div.note', h('b', 'Umsteiger · CODESYS / TwinCAT'), t.codesys));
    }
    main.appendChild(sec('Einführung', ...intro));
    // 2 Videos
    if ((m.videos || []).length) main.appendChild(sec('Videos', h('div.videos', m.videos.map(v => videoCard(m, v)))));
    // 3 Lesestoff
    if ((m.readings || []).length) main.appendChild(sec('Lesestoff', h('div.reads', sortReads(m.readings).map(readCard))));
    // 4 Ziele
    const objBox = h('div.objs');
    main.appendChild(sec('Ziele', h('p.muted', 'Öffne ein Ziel, folge der Anleitung und markiere es als erledigt. Danach öffnet sich das nächste.'), objBox));
    renderObjectives(objBox, m);
    // 5 Übungen
    if ((m.exercises || []).length) {
      main.appendChild(sec('Programmierübungen', h('p.muted', 'Übungen zählen 70 % der Modulnote. Du kannst beliebig oft testen; jede fehlgeschlagene Prüfung vor dem Bestehen kostet 5 % (mindestens 60 % bleiben).'),
        h('div.exlist', m.exercises.map(x => h('div.exrow',
          h('div', h('div.et', x.title), h('div.em', [x.type === 'git' ? 'git bash (Simulator)' : 'Structured Text', x.variant ? ' · ' + ({ schreiben: 'Programm schreiben', fehlersuche: 'Fehlersuche', erweitern: 'Erweitern' }[x.variant] || x.variant) : '',
            x.attempts ? ` · ${x.attempts} Prüfung(en)` : ''].join(''))),
          h('div.row', x.solved ? h('span.chip.okc', App.icon('check'), 'gelöst') : x.attempts ? h('span.chip', `${x.best}/${(x.tests || x.checks || []).length} Tests`) : null,
            h('button.btn' + (x.solved ? '' : '.primary'), { onclick: () => App.openLab(m, x), disabled: !un.ok && App.user.role === 'learner' ? true : null }, App.icon('code'), x.solved ? 'Öffnen' : 'Bearbeiten')))))));
    }
    // 6 Wissensprüfung
    main.appendChild(sec('Wissensprüfung', quizBox(m)));
    // 7 Nachweis
    if (m.proof) main.appendChild(sec('Praxisnachweis', proofBox(m)));
    // Seitenleiste
    buildSide(side, m);
    if (focus === 'quiz') setTimeout(() => main.querySelector('.quiz') && main.querySelector('.quiz').scrollIntoView({ behavior: 'smooth' }), 100);
  }
  function lockText(m, un) {
    if (!un.stageOk) return `Gesperrt bis Stufe ${App.stageName(m.level)}. Du kannst schon lesen, aber noch nicht bearbeiten.`;
    if (!un.prevOk) return `Erst Niveau ${m.level - 1} in ${App.area(m.area).title} abschließen. Lesen ist erlaubt.`;
    return 'Voraussetzungen offen: ' + un.missing.map(id => (App.mod(id) || { title: id }).title).join(', ');
  }
  const typeRank = { 'Uni-Skript': 0, 'Fachbuch': 1, 'Dokumentation': 2, 'Hersteller': 2, 'Norm/Amtlich': 3, 'Artikel': 4 };
  const sortReads = rs => rs.slice().sort((a, b) => (typeRank[a.type] ?? 5) - (typeRank[b.type] ?? 5));

  function videoCard(m, v) {
    const seen = (m.state.videos || []).includes(v.id);
    const cb = h('input', { type: 'checkbox', checked: seen ? true : null, onchange: async () => { await App.post('/api/progress/video', { module: m.id, video: v.id, seen: cb.checked }).catch(() => {}); if (cb.checked) App.sound.click(); } });
    return h('article.vid',
      h('a.th', { href: `https://www.youtube.com/watch?v=${v.id}`, target: '_blank', rel: 'noopener', style: { backgroundImage: `url(https://i.ytimg.com/vi/${v.id}/hqdefault.jpg)` }, 'aria-label': 'Video öffnen: ' + v.title },
        App.svg('<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#0B171D" fill-opacity=".75" stroke="#ED8934" stroke-width="2"/><path d="M19 15v18l14-9z" fill="#ED8934"/></svg>')),
      h('div.vb', h('div.vt', v.title), h('div.vm', `${v.channel} · ${(v.lang || '').toUpperCase()}${v.minutes ? ' · ' + v.minutes + ' min' : ''}`), h('div.vw', v.why), h('label', cb, 'Gesehen')));
  }
  function readCard(r) {
    return h('article.read',
      h('div.rh', h('a.rt', { href: r.url, target: '_blank', rel: 'noopener' }, r.title, ' ', App.icon('ext')), h('span.tag', r.type)),
      h('div.rm', [r.author, r.institution, r.work, r.year, r.minutes ? r.minutes + ' min Lesezeit' : ''].filter(Boolean).join(' · ')),
      h('div', { style: { fontSize: '13px' } }, r.why),
      h('div.apa', h('span', r.apa), h('button.iconbtn', { title: 'Zitat kopieren', 'aria-label': 'Zitat kopieren', onclick: () => App.copy(r.apa, 'Zitat kopiert') }, App.icon('copy'))));
  }

  // ---------- Ziele ----------
  function renderObjectives(box, m) {
    App.clear(box);
    const done = m.state.objDone || [];
    const curIdx = m.objectives.findIndex(o => !done.includes(o.id));
    m.objectives.forEach((o, i) => {
      const isDone = done.includes(o.id), isCur = i === curIdx;
      const body = h('div.og', { hidden: !isCur ? true : null }, guide(o.guide));
      const ck = h('span.ck', isDone ? App.icon('check') : null);
      if (isDone) ck.firstChild.style.cssText = 'width:14px;height:14px;color:#0F1D25';
      const btn = h('button.oh', { 'aria-expanded': String(isCur), onclick: () => { body.hidden = !body.hidden; btn.setAttribute('aria-expanded', String(!body.hidden)); } },
        ck, h('span.ot', o.title), h('span.mono.faint', { style: { fontSize: '11px' } }, `+${App.catalog.kp.objective} KP`));
      const can = m.unlocked.ok && (isDone || i <= curIdx);
      const act = h('div.row', { style: { marginTop: '12px' } },
        isDone ? h('button.btn.small.ghost', { disabled: !can || null, onclick: () => toggle(o, false) }, 'Als offen markieren')
          : h('button.btn.primary', { disabled: !can || null, onclick: e => toggle(o, true, e.currentTarget) }, App.icon('check'), 'Als erledigt markieren'),
        !can && !isDone ? h('span.muted', { style: { fontSize: '12px' } }, m.unlocked.ok ? 'Erst die vorherigen Ziele erledigen' : 'Modul gesperrt') : null);
      body.appendChild(act);
      box.appendChild(h('div.obj' + (isDone ? '.done' : '') + (isCur ? '.cur' : ''), btn, body));
    });
    async function toggle(o, val, el) {
      try {
        const before = App.state;
        const r = await App.post('/api/progress/objective', { module: m.id, objective: o.id, done: val });
        m.state.objDone = r.done; m.state.objCount = r.done.length;
        if (val) { App.sound.ok(); App.floatKP(App.catalog.kp.objective, el); }
        renderObjectives(box, m);
        const nextCur = box.querySelector('.obj.cur');
        if (nextCur && val) nextCur.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await App.refresh(); App.handleCompletion(r.completion, before);
        if (r.completion && r.completion.completed) reloadSide(m);
      } catch (e) { App.toast(e.message, 'bad'); }
    }
  }
  function guide(g) {
    if (!g) return null;
    const md = s => h('span', { html: App.md(s).replace(/^<p>|<\/p>$/g, '') });
    return h('div',
      g.intro ? h('p', md(g.intro)) : null,
      h('ol', (g.steps || []).map(s => h('li', md(s)))),
      g.code ? App.codeBlock(g.code.text, g.code.lang) : null,
      g.done ? h('div.done-when', h('b', { style: { color: 'var(--ok)' } }, '✓ '), md(g.done)) : null,
      g.tip ? h('div.tip', App.icon('bulb'), ' ', md(g.tip)) : null,
      g.link ? h('p', { style: { marginTop: '8px' } }, h('a', { href: g.link.url, target: '_blank', rel: 'noopener' }, g.link.label || g.link.url, ' ', App.icon('ext'))) : null);
  }

  // ---------- Wissensprüfung ----------
  function quizBox(m) {
    const st = m.state;
    const box = h('div.quiz');
    if (st.quizOk) box.appendChild(h('p', h('span.chip.okc', App.icon('check'), 'Bestanden'), ' ', h('span.muted', `nach ${st.quizAttempts} Versuch(en) · ${st.quizScore} Punkte`)));
    box.appendChild(h('p.muted', 'Bestanden ist sie erst, wenn alle Antworten stimmen. Neue Versuche sind erlaubt – mit neuer Reihenfolge und neuen Zahlenwerten.'));
    const answers = [];
    const qEls = m.quiz.map((q, i) => questionEl(q, i, answers, 'mq-' + m.id));
    box.append(...qEls);
    const btn = h('button.btn.primary', { disabled: (!m.unlocked.ok) || null, onclick: async () => {
      try {
        btn.disabled = true;
        const before = App.state;
        const r = await App.post('/api/quiz/' + m.id, { answers });
        r.results.forEach((res, i) => showResult(qEls[i], m.quiz[i], res));
        if (r.passed) { App.sound.ok(); App.floatKP(st.quizOk ? 0 : App.catalog.kp.quiz, btn); App.toast(st.quizOk ? 'Wieder alles richtig.' : 'Wissensprüfung bestanden!', 'ok'); st.quizOk = true; }
        else { App.sound.fail(); App.toast(`${r.results.filter(x => x.ok).length} von ${r.results.length} richtig. Lies die Erklärungen und versuch es erneut.`, 'bad', 4500); }
        await App.refresh(); App.handleCompletion(r.completion, before);
        btn.replaceWith(h('button.btn', { onclick: () => App.openModule(m.id, 'quiz') }, App.icon('reset'), 'Neuer Versuch'));
      } catch (e) { btn.disabled = false; App.toast(e.message, 'bad'); }
    } }, 'Antworten prüfen');
    box.appendChild(btn);
    return box;
  }
  App.questionEl = questionEl;
  function questionEl(q, i, answers, name) {
    const el = h('div.qq', h('div.qt', `${i + 1}. `, h('span', { html: App.md(q.q).replace(/^<p>|<\/p>$/g, '') })));
    if (q.code) el.appendChild(App.codeBlock(q.code.text, q.code.lang));
    if (q.figure) { const f = h('figure'); f.innerHTML = sanitizeSvg(q.figure); el.appendChild(f); }
    if (q.type === 'numeric') {
      const inp = h('input.inp', { inputmode: 'decimal', placeholder: 'Zahl eingeben', style: { maxWidth: '200px' }, 'aria-label': 'Antwort', oninput: () => { answers[i] = inp.value; } });
      el.appendChild(h('div.row', inp, q.unit ? h('span.mono', q.unit) : null));
    } else {
      const multi = q.type === 'multi';
      if (multi) answers[i] = [];
      el.appendChild(h('div.opts', { role: multi ? 'group' : 'radiogroup' }, q.options.map((o, k) => {
        const inp = h('input', { type: multi ? 'checkbox' : 'radio', name: name + '-' + i, value: k, onchange: () => {
          if (multi) { const s = new Set(answers[i]); inp.checked ? s.add(k) : s.delete(k); answers[i] = [...s]; } else answers[i] = k;
        } });
        return h('label.opt', inp, h('span', { html: App.md(o).replace(/^<p>|<\/p>$/g, '') }));
      })));
      if (multi) el.appendChild(h('div.faint', { style: { fontSize: '12px', marginTop: '6px' } }, 'Mehrere Antworten möglich'));
    }
    return el;
  }
  function showResult(el, q, res) {
    el.classList.remove('right', 'wrong'); el.classList.add(res.ok ? 'right' : 'wrong');
    App.$$('.exp', el).forEach(x => x.remove());
    if (res.solution && res.solution.correct !== undefined) {
      const corr = [].concat(res.solution.correct);
      App.$$('.opt', el).forEach((o, k) => { if (corr.includes(k)) o.classList.add('sol'); });
    }
    const sol = res.solution && res.solution.value !== undefined ? ` Richtig: ${String(res.solution.value).replace('.', ',')} ${res.solution.unit || ''}.` : '';
    el.appendChild(h('div.exp', h('b', res.ok ? '✓ Richtig. ' : '✗ Leider falsch.' + sol + ' '), h('span', { html: App.md(res.explain || '').replace(/^<p>|<\/p>$/g, '') })));
    App.$$('input', el).forEach(x => { x.disabled = true; });
  }
  App.showQuizResult = showResult;
  function sanitizeSvg(s) {
    if (!/^\s*<svg[\s>]/.test(s)) return '';
    return s.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '').replace(/\son\w+='[^']*'/gi, '').replace(/javascript:/gi, '');
  }

  // ---------- Nachweis ----------
  function proofBox(m) {
    const st = m.state;
    const inp = h('input.inp', { type: 'url', placeholder: 'https://git.breitner.de/…', value: st.proof || '' });
    const status = { none: ['', 'Noch nicht eingereicht'], pending: ['warnc', 'Wird vom Ausbilder geprüft'], approved: ['okc', 'Bestätigt'], rejected: ['badc', 'Zurückgegeben'] }[st.proofStatus] || ['', ''];
    return h('div',
      h('p.muted', 'Lade dein Ergebnis auf git.breitner.de (oder einen anderen Ort, den dein Ausbilder vorgibt) und reiche den Link ein. Erst nach Bestätigung gilt das Projekt als abgeschlossen.'),
      h('div.row', h('span.chip.' + (status[0] || 'x'), status[1])), st.proofComment ? h('div.note', h('b', 'Kommentar Ausbilder'), st.proofComment) : null,
      h('div.row', { style: { marginTop: '10px' } }, inp, h('button.btn.primary', { disabled: (!m.unlocked.ok || st.proofStatus === 'approved') || null, onclick: async () => {
        try { await App.post('/api/proof/' + m.id, { url: inp.value }); App.toast('Nachweis eingereicht', 'ok'); App.openModule(m.id); } catch (e) { App.toast(e.message, 'bad'); }
      } }, App.icon('link'), 'Einreichen')));
  }

  // ---------- Seitenleiste ----------
  function buildSide(side, m) {
    App.clear(side);
    const st = m.state;
    const r = 30, c = 2 * Math.PI * r;
    const ring = App.svg(`<svg width="76" height="76" viewBox="-38 -38 76 76"><circle r="${r}" fill="none" stroke="#25404D" stroke-width="6"/><circle r="${r}" fill="none" stroke="${B.color(m.area)}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(c * st.pct / 100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90)"/><text y="5" text-anchor="middle" font-family="JetBrains Mono" font-size="15" fill="#fff">${st.pct}%</text></svg>`);
    side.appendChild(h('div.side-block.progress-ring', ring, h('div', h('div', { style: { fontWeight: 700, color: '#fff' } }, st.complete ? 'Abgeschlossen' : st.started ? 'In Bearbeitung' : 'Nicht begonnen'),
      h('div.muted.mono', { style: { fontSize: '12px' } }, `${App.fmtN(st.kp)} / ${App.fmtN(m.maxKP)} KP`),
      st.score !== null ? h('div.row', { style: { marginTop: '4px' } }, App.gradeCell(App.gradeOf(st.score), st.score), h('span.muted', { style: { fontSize: '12px' } }, st.score + ' Punkte')) : null)));
    const items = [
      [`${st.objCount}/${st.nObj} Ziele`, st.objCount === st.nObj],
      [`${st.exSolved}/${st.exs.length} Übungen`, st.exSolved === st.exs.length],
      ['Wissensprüfung', st.quizOk]
    ];
    if (m.proof) items.push(['Praxisnachweis', st.proofStatus === 'approved']);
    side.appendChild(h('div.side-block', h('h4', 'Status'), h('ul.side-list', items.map(([t, ok]) => h('li', h('span', { class: ok ? 'ok' : 'faint' }, ok ? '●' : '○'), t)))));
    side.appendChild(h('div.side-block', h('h4', 'Belohnung'), h('ul.side-list',
      h('li', `Ziel +${App.catalog.kp.objective} · Übung +${App.catalog.kp.exercise} · Quiz +${App.catalog.kp.quiz}`),
      h('li', `Modulabschluss +${App.catalog.kp.module}${m.kind === 'projekt' ? ' · Projekt +' + App.catalog.kp.project : ''}${m.kind === 'zusatz' ? ' · Bonus +' + App.catalog.kp.zusatz : ''}`))));
    if (m.badge) side.appendChild(h('div.side-block', h('h4', 'Abzeichen'), h('div.row', App.svg(B.project(m.area, m.badge, !st.complete, 54)), h('b', m.badge))));
    side.appendChild(h('div.side-block', h('h4', 'Voraussetzungen'), (m.req || []).length ? h('ul.side-list', m.req.map(id => { const r2 = App.mod(id); const ok = App.state.modules[id] && App.state.modules[id].complete;
      return h('li', h('span', { class: ok ? 'ok' : 'warn' }, ok ? '✓' : '•'), h('a', { href: '#', onclick: e => { e.preventDefault(); App.openModule(id); } }, r2 ? r2.title : id)); })) : h('p.muted', 'Keine')));
    side.appendChild(h('div.side-block', h('h4', 'Schaltet frei'), (m.unlocks || []).length ? h('ul.side-list', m.unlocks.map(id => { const r2 = App.mod(id);
      return h('li', h('span.faint', '→'), h('a', { href: '#', onclick: e => { e.preventDefault(); App.openModule(id); } }, r2 ? r2.title : id)); })) : h('p.muted', 'Nächstes Niveau dieses Bereichs')));
    side.appendChild(h('div.side-block', h('h4', 'Aufwand'), h('ul.side-list', h('li', App.icon('clock'), ` geplant ca. ${m.minutes || '–'} min`), h('li', App.icon('clock'), ` bisher ${App.fmtMin((st.timeSec || 0) / 60)}`))));
    side.appendChild(h('p.faint', { style: { fontSize: '11.5px' } }, h('kbd', 'F'), ' Vollbild · ', h('kbd', 'Esc'), ' schließen'));
  }
  async function reloadSide() { /* Seitenleiste aktualisiert sich beim nächsten Öffnen */ }
})();
