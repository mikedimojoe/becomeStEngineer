/* Ausbildung (Admin/Ausbilder): Übersicht, Gruppenmatrix, Nachweise, Konten & Gruppen, Personenbericht, Zeugnis */
(function () {
  'use strict';
  const App = window.App, h = App.h, B = App.badges;
  const ROLE = { admin: 'Admin', trainer: 'Ausbilder', learner: 'Lernende/r' };
  const KIND = { berufsschule: 'Berufsschule', dual: 'Duales Studium', mitarbeiter: 'Mitarbeiter' };

  App.route('ausbildung', async (main, tab, id) => {
    if (App.user.role === 'learner') return main.appendChild(h('p', 'Kein Zugriff.'));
    if (tab === 'person' && id) return personView(main, +id);
    tab = tab || 'uebersicht';
    const ov = await App.get('/api/admin/overview');
    const proofs = await App.get('/api/admin/proofs');
    main.appendChild(h('div.page-head', h('div.grow', h('div.eyebrow', 'Ausbildung'), h('h1', 'Bewertung und Verwaltung'), h('p', 'Was können deine Lernenden – und was noch nicht? Alle Bewertungen nach IHK-Notenschlüssel, berechnet aus Code-Übungen (70 %) und Wissensfragen (30 %).')),
      h('div.seg', [['uebersicht', 'Übersicht'], ['matrix', 'Gruppenmatrix'], ['nachweise', `Nachweise${proofs.length ? ' (' + proofs.length + ')' : ''}`], ['konten', 'Konten & Gruppen'], ['daten', 'Export & System']].map(([k, t]) =>
        h('button', { 'aria-pressed': String(k === tab), onclick: () => App.go('#/ausbildung/' + k) }, t)))));
    const fns = { uebersicht: overview, matrix, nachweise: proofsView, konten: accounts, daten: dataView };
    (fns[tab] || overview)(main, ov, proofs);
  });

  function groupFilter(ov, onChange) {
    const sel = h('select.inp', { style: { width: 'auto' }, onchange: () => onChange(sel.value) }, h('option', { value: '' }, 'Alle Gruppen'), ov.groups.map(g => h('option', { value: g.id }, g.name)));
    return sel;
  }
  const learners = (ov, gid) => ov.users.filter(u => u.role === 'learner' && (!gid || String(u.groupId) === String(gid)));

  // ---------- Übersicht ----------
  function overview(main, ov) {
    let gid = '';
    const tbody = h('tbody');
    const kpis = h('div.grid.g-4', { style: { marginBottom: '20px' } });
    const draw = () => {
      const us = learners(ov, gid);
      App.clear(kpis).append(
        kpi(us.length, 'Lernende'), kpi(us.filter(u => u.weekMinutes > 0).length, 'aktiv in 7 Tagen'),
        kpi(avg(us.map(u => u.grade).filter(Boolean)), 'Ø Note'), kpi(us.reduce((a, u) => a + u.pendingProofs, 0), 'offene Nachweise'));
      App.clear(tbody);
      us.sort((a, b) => b.stage - a.stage || b.kp - a.kp).forEach(u => tbody.appendChild(h('tr.click', { onclick: () => App.go('#/ausbildung/person/' + u.id) },
        h('td', h('b', u.name), h('div.faint', { style: { fontSize: '11.5px' } }, u.username)), h('td', u.group || '–'),
        h('td', h('span.row', { style: { gap: '6px' } }, App.svg(B.stage(u.stage, 26)), u.stageName)), h('td.mono', App.fmtN(u.kp)), h('td', App.gradeCell(u.grade, u.points)),
        h('td', u.elektroOk ? h('span.ok', '✓') : h('span.faint', '–')),
        h('td', h('span.row', { style: { gap: '3px' } }, App.catalog.areas.map(a => { const x = u.areas[a.id]; return h('span', { title: `${a.title}: N${x.niveau}${x.grade ? ', Note ' + x.grade : ''}`, style: { display: 'inline-block', width: '16px', height: '16px', borderRadius: '2px', background: x.niveau ? App.areaColor(a.id) : 'transparent', border: '1px solid ' + (x.pct ? App.areaColor(a.id) : 'var(--line)'), opacity: x.niveau ? .35 + .65 * x.niveau / 6 : 1, fontSize: '9px', lineHeight: '14px', textAlign: 'center', color: '#0F1D25', fontFamily: 'var(--f-mono)', fontWeight: 700 } }, x.niveau || ''); }))),
        h('td.mono', App.fmtMin(u.weekMinutes)), h('td.mono', App.fmtMin(u.minutes)), h('td.mono.faint', u.lastSeen ? App.fmtDate(u.lastSeen) : 'nie'),
        h('td', { style: { maxWidth: '240px', fontSize: '12.5px' } }, u.next || ''), h('td', u.pendingProofs ? h('span.chip.warnc', u.pendingProofs) : null))));
      if (!us.length) tbody.appendChild(h('tr', h('td', { colspan: 12 }, h('span.muted', 'Keine Lernenden. Lege unter „Konten & Gruppen“ welche an.'))));
    };
    main.append(h('div.row', { style: { marginBottom: '14px' } }, groupFilter(ov, v => { gid = v; draw(); })), kpis,
      h('section.pnl', h('div.ph', h('span', 'Lernende'), h('span', 'Klick öffnet den vollständigen Bericht')), h('div.tbl-wrap', h('table.tbl',
        h('thead', h('tr', ['Name', 'Gruppe', 'Stufe', 'KP', 'Note', 'Elektro', 'Niveau je Bereich', '7 Tage', 'Gesamt', 'Zuletzt', 'Nächster Schritt', 'Nachweis'].map(t => h('th', t)))), tbody))));
    draw();
  }
  const kpi = (v, t) => h('section.pnl', h('div.kpi', { style: { gridTemplateColumns: '1fr' } }, h('div', h('b', String(v)), h('span', t))));
  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1).replace('.', ',') : '–';

  // ---------- Gruppenmatrix ----------
  function matrix(main, ov) {
    let gid = '', mode = 'note';
    const box = h('div');
    const draw = () => {
      const us = learners(ov, gid);
      const tbl = h('table.tbl.matrix', h('thead', h('tr', h('th', 'Name'), App.catalog.areas.map(a => h('th', { style: { textAlign: 'center', color: App.areaColor(a.id) } }, a.short || a.title)), h('th', { style: { textAlign: 'center' } }, 'Gesamt'))),
        h('tbody', us.map(u => h('tr.click', { onclick: () => App.go('#/ausbildung/person/' + u.id) }, h('td', h('b', u.name), h('div.faint', { style: { fontSize: '11.5px' } }, u.stageName)),
          App.catalog.areas.map(a => { const x = u.areas[a.id]; return h('td.mc', mode === 'note' ? App.gradeCell(x.grade, x.points) : h('span.mono', { style: { color: x.niveau ? '#fff' : 'var(--faint)' } }, `N${x.niveau}`, h('span.faint', { style: { fontSize: '10px' } }, ` ${x.pct}%`))); }),
          h('td.mc', App.gradeCell(u.grade, u.points))))));
      // Gruppenschnitt
      const foot = h('tr', h('td', h('b', 'Ø Gruppe')), App.catalog.areas.map(a => { const g = us.map(u => u.areas[a.id].grade).filter(Boolean); return h('td.mc.mono', g.length ? avg(g) : '–'); }), h('td.mc.mono', avg(us.map(u => u.grade).filter(Boolean))));
      tbl.appendChild(h('tfoot', foot));
      App.clear(box).appendChild(h('div.tbl-wrap', tbl));
    };
    const seg = h('div.seg', [['note', 'Noten'], ['niveau', 'Niveaus']].map(([k, t]) => h('button', { 'aria-pressed': String(k === mode), onclick: e => { mode = k; App.$$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); draw(); } }, t)));
    main.append(h('div.row', { style: { marginBottom: '14px' } }, groupFilter(ov, v => { gid = v; draw(); }), seg, h('span.grow'), h('span.muted', { style: { fontSize: '12px' } }, 'Noten: 1 sehr gut … 6 ungenügend · – noch nicht bewertet')),
      h('section.pnl', h('div.ph', h('span', 'Bereich × Person')), box));
    draw();
  }

  // ---------- Nachweise ----------
  function proofsView(main, ov, proofs) {
    if (!proofs.length) return main.appendChild(h('section.pnl', h('div.pb.muted', 'Keine offenen Nachweise.')));
    main.appendChild(h('div.stack', proofs.map(p => {
      const cm = h('input.inp', { placeholder: 'Kommentar (optional, sieht die/der Lernende)' });
      const m = App.mod(p.module_id);
      return h('section.pnl', h('div.ph', h('span', p.name), h('span', m ? App.area(m.area).title : '')),
        h('div.pb', h('div.row.wrap', m ? App.svg(B.project(m.area, p.badge, false, 46)) : null, h('div.grow', h('b', p.moduleTitle), h('div', h('a', { href: p.proof_url, target: '_blank', rel: 'noopener' }, p.proof_url, ' ', App.icon('ext'))))),
          h('div.row', { style: { marginTop: '10px' } }, cm,
            h('button.btn.primary', { onclick: async () => { await App.post(`/api/admin/proofs/${p.user_id}/${p.module_id}`, { approve: true, comment: cm.value }); App.toast('Bestätigt', 'ok'); App.render(); } }, App.icon('check'), 'Bestätigen'),
            h('button.btn.danger', { onclick: async () => { if (!cm.value) return App.toast('Bitte kurz begründen, was fehlt.', 'bad'); await App.post(`/api/admin/proofs/${p.user_id}/${p.module_id}`, { approve: false, comment: cm.value }); App.toast('Zurückgegeben', 'ok'); App.render(); } }, 'Zurückgeben'),
            h('button.btn.ghost', { onclick: () => App.go('#/ausbildung/person/' + p.user_id) }, 'Bericht'))));
    })));
  }

  // ---------- Konten & Gruppen ----------
  function accounts(main, ov) {
    const isAdmin = ov.role === 'admin';
    const gname = h('input.inp', { placeholder: 'z. B. Berufsschule 2026' });
    const gkind = h('select.inp', Object.entries(KIND).map(([k, t]) => h('option', { value: k }, t)));
    const uname = h('input.inp', { placeholder: 'Vor- und Nachname' });
    const ulogin = h('input.inp', { placeholder: 'z. B. l.hoffmann' });
    const urole = h('select.inp', Object.entries(ROLE).filter(([k]) => isAdmin || k === 'learner').map(([k, t]) => h('option', { value: k, selected: k === 'learner' ? true : null }, t)));
    const ugroup = h('select.inp', h('option', { value: '' }, '– keine –'), ov.groups.map(g => h('option', { value: g.id }, g.name)));
    const created = h('div');
    main.appendChild(h('div.grid.g-2',
      isAdmin ? h('section.pnl', h('div.ph', h('span', 'Gruppe anlegen')), h('div.pb',
        h('label.fld', h('span', 'Name'), gname), h('label.fld', h('span', 'Art'), gkind),
        h('button.btn.primary', { onclick: async () => { try { await App.post('/api/admin/groups', { name: gname.value, kind: gkind.value }); App.toast('Gruppe angelegt', 'ok'); App.render(); } catch (e) { App.toast(e.message, 'bad'); } } }, App.icon('plus'), 'Anlegen'),
        h('table.tbl', { style: { marginTop: '14px' } }, h('tbody', ov.groups.map(g => h('tr', h('td', h('b', g.name)), h('td', KIND[g.kind] || g.kind), h('td.mono', ov.users.filter(u => u.groupId === g.id).length + ' Pers.'),
          h('td', h('button.iconbtn', { 'aria-label': 'Gruppe löschen', onclick: async () => { if (confirm(`Gruppe „${g.name}“ löschen? Die Personen bleiben erhalten (ohne Gruppe).`)) { await App.api('DELETE', '/api/admin/groups/' + g.id); App.render(); } } }, App.icon('trash'))))))))) : null,
      h('section.pnl', h('div.ph', h('span', 'Person anlegen')), h('div.pb',
        h('label.fld', h('span', 'Name'), uname), h('label.fld', h('span', 'Benutzername'), ulogin),
        h('div.grid.g-2', { style: { gap: '10px' } }, h('label.fld', h('span', 'Rolle'), urole), h('label.fld', h('span', 'Gruppe'), ugroup)),
        h('button.btn.primary', { onclick: async () => {
          try { const r = await App.post('/api/admin/users', { name: uname.value, username: ulogin.value, role: urole.value, groupId: ugroup.value || null });
            App.clear(created).appendChild(h('div.note', h('b', 'Startpasswort'), h('span.mono', { style: { fontSize: '16px', color: '#fff' } }, r.initialPassword), h('div.muted', { style: { fontSize: '12px' } }, `Gib es ${uname.value} persönlich. Beim ersten Login wird ein eigenes Passwort festgelegt.`)));
            uname.value = ulogin.value = ''; setTimeout(() => App.render(), 15000);
          } catch (e) { App.toast(e.message, 'bad'); } } }, App.icon('plus'), 'Anlegen'), created)),
      h('section.pnl.span-all', h('div.ph', h('span', 'Konten'), h('span', ov.users.length + ' gesamt')), h('div.tbl-wrap', h('table.tbl',
        h('thead', h('tr', ['Name', 'Benutzer', 'Rolle', 'Gruppe', isAdmin ? 'Betreut (Ausbilder)' : '', 'Status', ''].map(t => h('th', t)))),
        h('tbody', ov.users.map(u => {
          const role = h('select.inp', { style: { width: 'auto', padding: '4px 6px' }, disabled: !isAdmin || null, onchange: () => patch(u.id, { role: role.value }) }, Object.entries(ROLE).map(([k, t]) => h('option', { value: k, selected: u.role === k ? true : null }, t)));
          const grp = h('select.inp', { style: { width: 'auto', padding: '4px 6px' }, onchange: () => patch(u.id, { groupId: grp.value || null }) }, h('option', { value: '' }, '–'), ov.groups.map(g => h('option', { value: g.id, selected: u.groupId === g.id ? true : null }, g.name)));
          const tr = ov.trainers.find(t => t.id === u.id);
          const tg = isAdmin && u.role === 'trainer' ? h('div.row.wrap', { style: { gap: '4px' } }, ov.groups.map(g => { const on = tr && tr.groups.includes(g.id);
            return h('button.chip' + (on ? '.on' : ''), { onclick: () => { const cur = new Set(tr ? tr.groups : []); on ? cur.delete(g.id) : cur.add(g.id); patch(u.id, { trainerGroups: [...cur] }, true); } }, g.name); })) : '';
          return h('tr', h('td', h('b', u.name)), h('td.mono', u.username), h('td', role), h('td', grp), isAdmin ? h('td', tg) : h('td'), h('td', u.active ? h('span.ok', 'aktiv') : h('span.bad', 'gesperrt')),
            h('td', h('div.row', { style: { gap: '4px' } },
              h('button.btn.small.ghost', { onclick: async () => { if (!confirm(`Passwort von ${u.name} zurücksetzen?`)) return; const r = await App.api('PATCH', '/api/admin/user/' + u.id, { resetPassword: true }); alert(`Neues Startpasswort für ${u.name}:\n\n${r.initialPassword}`); } }, 'Passwort'),
              isAdmin && u.id !== App.user.id ? h('button.btn.small.ghost', { onclick: () => patch(u.id, { active: !u.active }, true) }, u.active ? 'Sperren' : 'Entsperren') : null,
              isAdmin && u.id !== App.user.id ? h('button.iconbtn', { 'aria-label': 'Löschen', onclick: async () => { if (confirm(`${u.name} endgültig löschen? Alle Lernstände gehen verloren.`)) { await App.api('DELETE', '/api/admin/user/' + u.id); App.render(); } } }, App.icon('trash')) : null)));
        })))))));
    async function patch(id, body, rerender) { try { await App.api('PATCH', '/api/admin/user/' + id, body); App.toast('Gespeichert', 'ok', 1500); if (rerender) App.render(); } catch (e) { App.toast(e.message, 'bad'); } }
  }

  // ---------- Export & System ----------
  function dataView(main, ov) {
    const isAdmin = ov.role === 'admin';
    main.appendChild(h('div.grid.g-3',
      h('section.pnl', h('div.ph', h('span', 'Bewertung exportieren')), h('div.pb', h('p.muted', 'CSV für Excel (Semikolon, UTF-8): Stufe, KP, Gesamtnote, Lernzeit, Elektro-Check, Niveau und Note je Bereich.'), h('a.btn.primary', { href: '/api/admin/export.csv' }, App.icon('down'), 'CSV herunterladen'))),
      isAdmin ? h('section.pnl', h('div.ph', h('span', 'Datensicherung')), h('div.pb', h('p.muted', 'Täglich automatisch nach 2 Uhr, die letzten 30 Sicherungen bleiben im Ordner data/backups. Hier kannst du sofort eine Sicherung erstellen.'),
        h('button.btn', { onclick: async () => { const r = await App.post('/api/admin/backup'); App.toast('Sicherung erstellt: ' + r.file, 'ok', 5000); } }, 'Jetzt sichern'))) : null,
      isAdmin ? h('section.pnl', h('div.ph', h('span', 'Inhalte neu laden')), h('div.pb', h('p.muted', 'Nach Änderungen an content/areas/*.js die Inhalte ohne Neustart neu einlesen.'),
        h('button.btn', { onclick: async () => { const r = await App.post('/api/admin/reload'); App.cache = {}; App.catalog = await App.get('/api/catalog'); App.toast(`${r.modules} Module geladen`, 'ok'); } }, App.icon('reset'), 'Neu laden'))) : null));
  }

  // ---------- Personenbericht ----------
  async function personView(main, id) {
    const d = await App.get('/api/admin/user/' + id);
    const u = d.user, s = d.state;
    const C = App.catalog;
    main.appendChild(h('div.print-only', h('div.row', { style: { justifyContent: 'space-between', borderBottom: '3px solid #ED8934', paddingBottom: '8px', marginBottom: '16px' } },
      h('div', h('b', { style: { color: '#ED8934', fontSize: '22px', letterSpacing: '.05em' } }, 'BREITNER'), h('div', { style: { fontSize: '11px', letterSpacing: '.15em' } }, 'AUSBILDUNG · SPS-PROGRAMMIERUNG')),
      h('div', { style: { textAlign: 'right', fontSize: '12px' } }, 'Leistungsnachweis', h('br'), 'Stand ' + new Date().toLocaleDateString('de-DE')))));
    main.appendChild(h('div.page-head', h('div.row', App.svg(B.stage(s.stage, 64)), h('div.grow', h('div.eyebrow', 'Personenbericht'), h('h1', u.name),
      h('p', `${u.group || 'ohne Gruppe'} · Stufe ${s.stageName} · ${App.fmtN(s.kp)} KP · Lernzeit ${App.fmtMin(u.minutes)} · zuletzt aktiv ${u.lastSeen ? App.fmtTime(u.lastSeen) : 'nie'}`))),
      h('span.grow'), h('div.row.no-print', h('a.btn.ghost', { href: '#/ausbildung' }, App.icon('back'), 'Zurück'), h('a.btn.ghost', { href: '/api/export?user=' + u.id }, App.icon('down'), 'JSON'), h('button.btn', { onclick: () => print() }, App.icon('print'), 'Zeugnis drucken'))));
    // Zusammenfassung: kann / kann noch nicht
    const can = [], cannot = [];
    for (const a of C.areas) {
      const st = s.areas[a.id];
      if (st.niveau > 0) can.push(`${a.title}: Niveau ${st.niveau}${st.grade ? ' (Note ' + st.grade + ')' : ''}`);
      const nextL = Math.max(st.niveau + 1, st.minLevel);
      if (nextL <= st.maxLevel && nextL <= s.stage) { const bl = st.byLevel[nextL]; if (bl) cannot.push(`${a.title}: Niveau ${nextL} offen (${bl.complete}/${bl.modules} Module)`); }
    }
    const weakAreas = {};
    d.weak.forEach(w => { if (w.area) weakAreas[w.area] = (weakAreas[w.area] || 0) + w.wrong; });
    main.appendChild(h('div.grid.g-3', { style: { marginBottom: '20px' } },
      h('section.pnl', h('div.ph', h('span', 'Kann')), h('div.pb', can.length ? h('ul.side-list', can.map(t => h('li', h('span.ok', '●'), t))) : h('p.muted', 'Noch kein Niveau abgeschlossen.'), s.elektroOk ? h('p.ok', { style: { marginTop: '8px' } }, '✓ Elektro-Kompetenzcheck bestanden') : null)),
      h('section.pnl', h('div.ph', h('span', 'Kann noch nicht')), h('div.pb', cannot.length ? h('ul.side-list', cannot.map(t => h('li', h('span.warn', '○'), t))) : h('p.muted', 'Für die aktuelle Stufe ist alles erledigt.'), !s.elektroOk ? h('p.warn', { style: { marginTop: '8px' } }, '○ Elektro-Kompetenzcheck nicht bestanden') : null)),
      h('section.pnl', h('div.ph', h('span', 'Schwachstellen')), h('div.pb', Object.keys(weakAreas).length ? h('ul.side-list', Object.entries(weakAreas).sort((a, b) => b[1] - a[1]).map(([a, n]) => h('li', h('span.bad', '■'), `${App.area(a) ? App.area(a).title : a}: ${n} Fehler in Fragen`))) : h('p.muted', 'Keine auffälligen Fehler.'),
        h('p.muted', { style: { marginTop: '8px', fontSize: '12.5px' } }, 'Nächster Schritt: ', s.next ? s.next.title : '–')))));
    main.appendChild(App.competenceView(s, true));
    // Stufen-Anforderungen der nächsten Stufe
    if (s.stage < 7) {
      const R = s.stageReq[s.stage + 1];
      main.appendChild(h('section.pnl', { style: { marginTop: '20px' } }, h('div.ph', h('span', `Anforderungen für ${R.name}`)), h('div.pb.grid.g-4', R.items.map(i => h('div', h('div', { style: { fontWeight: 600, color: i.ok ? 'var(--ok)' : '#fff' } }, App.area(i.area).title, ' N', i.level), h('div.muted.mono', { style: { fontSize: '12px' } }, `${i.done}/${i.total} Module`))),
        h('div', h('div', { style: { fontWeight: 600, color: R.kpOk ? 'var(--ok)' : '#fff' } }, 'Kompetenzpunkte'), h('div.muted.mono', { style: { fontSize: '12px' } }, `${App.fmtN(s.kp)} / ${App.fmtN(R.kp)}`)))));
    }
    // Übungen
    main.appendChild(h('section.pnl', { style: { marginTop: '20px' } }, h('div.ph', h('span', 'Programmierübungen'), h('span', `${d.exercises.filter(e => e.solved).length} gelöst · ${d.exercises.length} bearbeitet`)),
      d.exercises.length ? h('div.tbl-wrap', h('table.tbl', h('thead', h('tr', ['Übung', 'Bereich', 'Prüfungen', 'Übersetzungsfehler', 'Bester Stand', 'Punkte', 'Häufig fehlgeschlagen', ''].map(t => h('th', t)))),
        h('tbody', d.exercises.sort((a, b) => (a.solved - b.solved) || b.runs - a.runs).map(e => h('tr', h('td', h('b', e.title || e.exercise), h('div.faint', { style: { fontSize: '11.5px' } }, e.moduleTitle)), h('td', e.area ? App.area(e.area).short : ''),
          h('td.mono', e.runs), h('td.mono', e.compileErrors || 0), h('td.mono', `${e.best}/${e.total}`), h('td', e.solved ? h('span.ok.mono', e.score) : h('span.warn.mono', e.score)),
          h('td', { style: { fontSize: '12px', maxWidth: '280px' } }, Object.entries(e.failedTests).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => h('div', `${n}× ${t}`))),
          h('td.no-print', h('button.btn.small.ghost', { onclick: () => showCode(u, e) }, 'Code'))))))) : h('div.pb.muted', 'Noch keine Übungen bearbeitet.')));
    // Fragen
    main.appendChild(h('section.pnl', { style: { marginTop: '20px' } }, h('div.ph', h('span', 'Falsch beantwortete Fragen'), h('span', d.weak.length + ' Fragen')),
      d.weak.length ? h('div.tbl-wrap', h('table.tbl', h('thead', h('tr', h('th', 'Frage'), h('th', 'Modul'), h('th', 'falsch'))), h('tbody', d.weak.slice(0, 40).map(w => h('tr', h('td', { style: { maxWidth: '520px' } }, w.text || w.ref), h('td', { style: { fontSize: '12px' } }, w.module || ''), h('td.mono', `${w.wrong}/${w.total}`)))))) : h('div.pb.muted', 'Keine.')));
    // Prüfungen + Zeit
    main.appendChild(h('div.grid.g-2', { style: { marginTop: '20px' } },
      h('section.pnl', h('div.ph', h('span', 'Prüfungen')), d.exams.length ? h('table.tbl', h('tbody', d.exams.map(x => h('tr', h('td', x.exam_id === 'elektro-check' ? 'Elektro-Kompetenzcheck' : 'Stufe ' + App.stageName(+x.exam_id.split('-')[1]), x.early ? ' (vorgezogen)' : ''), h('td.mono', App.fmtDate(x.started)),
        h('td.mono', x.finished ? `${x.score} P.` : 'offen'), h('td', x.finished ? App.gradeCell(x.grade, x.score) : null), h('td', x.finished ? h('span', { class: x.passed ? 'ok' : 'bad' }, x.passed ? 'bestanden' : 'nicht bestanden') : null))))) : h('div.pb.muted', 'Keine.')),
      h('section.pnl', h('div.ph', h('span', 'Lernzeit pro Woche')), h('div.pb', App.weekChart(d.time.map(t => ({ day: t.day, minutes: t.m })))))));
    // Rückblicke + Aktivität
    main.appendChild(h('div.grid.g-2', { style: { marginTop: '20px' } },
      h('section.pnl', h('div.ph', h('span', 'Wochenrückblicke')), h('div.pb', d.reflections.length ? d.reflections.map(r => h('div.note', h('b', r.week), r.good ? h('div', h('span.muted', 'Gut: '), r.good) : null, r.blocked ? h('div', h('span.muted', 'Blockiert: '), r.blocked) : null, r.goal ? h('div', h('span.muted', 'Ziel: '), r.goal) : null)) : h('p.muted', 'Keine.'))),
      h('section.pnl.no-print', h('div.ph', h('span', 'Aktivität')), h('div.pb', h('ul.feed', d.events.slice(0, 40).map(e => h('li', h('time', App.fmtTime(e.ts)), h('span', { class: 't-' + e.type }, e.text))))))));
    main.appendChild(h('div.print-only', { style: { marginTop: '40px' } }, h('div.row', { style: { justifyContent: 'space-between', gap: '60px' } },
      h('div.grow', { style: { borderTop: '1px solid #333', paddingTop: '4px', fontSize: '12px' } }, 'Ort, Datum'), h('div.grow', { style: { borderTop: '1px solid #333', paddingTop: '4px', fontSize: '12px' } }, 'Ausbilder/in'), h('div.grow', { style: { borderTop: '1px solid #333', paddingTop: '4px', fontSize: '12px' } }, 'Lernende/r'))));
  }
  async function showCode(u, e) {
    const r = await App.get(`/api/admin/user/${u.id}/code/${e.module}/${e.exercise}`);
    const sheet = h('div.sheet', h('div.sheet-head', h('span.tag', 'Code'), h('h2.grow', `${u.name} · ${e.title}`), h('button.iconbtn', { onclick: () => App.closeOverlay(), 'aria-label': 'Schließen' }, App.icon('close'))));
    const body = h('div', { style: { padding: '20px' } });
    if (!r.code) body.appendChild(h('p.muted', 'Kein Code gespeichert.'));
    else if (r.code.files) for (const [k, n] of [['main', 'Main.st'], ['var', 'Variables.var'], ['typ', 'Types.typ']]) { if (r.code.files[k]) body.append(h('div.eyebrow', n), App.codeBlock(r.code.files[k], 'st')); }
    else if (r.code.history) body.appendChild(App.codeBlock(r.code.history.map(c => typeof c === 'string' ? '$ ' + c : '# Datei gespeichert: ' + c.write).join('\n'), 'bash'));
    body.prepend(h('p.muted', `${r.solved ? 'Gelöst' : 'Noch nicht gelöst'} · ${r.attempts} Prüfungen · ${r.solved ? 'Stand der gelösten Fassung' : 'letzter Stand'}`));
    sheet.appendChild(body);
    App.openOverlay(sheet, { label: 'Code' });
  }
})();
