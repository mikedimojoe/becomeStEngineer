/* Fortschritt: Kompetenzen & Abzeichen, Lernzeit mit Wochendiagramm, Aktivität, Wochenrückblick */
(function () {
  'use strict';
  const App = window.App, h = App.h, B = App.badges;

  App.route('fortschritt', async (main, tab) => {
    tab = tab || 'kompetenzen';
    const log = await App.get('/api/log');
    main.appendChild(h('div.page-head', h('div.grow', h('div.eyebrow', 'Fortschritt'), h('h1', 'Dein Stand'), h('p', 'Kompetenzen, Abzeichen, Lernzeit und dein Wochenrückblick.')),
      h('div.seg', { role: 'tablist' }, [['kompetenzen', 'Kompetenzen'], ['lernzeit', 'Lernzeit'], ['aktivitaet', 'Aktivität'], ['rueckblick', 'Wochenrückblick']].map(([k, t]) =>
        h('button', { 'aria-pressed': String(k === tab), onclick: () => App.go('#/fortschritt/' + k) }, t)))));
    if (tab === 'lernzeit') return main.appendChild(timeView(log));
    if (tab === 'aktivitaet') return main.appendChild(h('section.pnl', h('div.ph', h('span', 'Aktivität'), h('span', log.events.length + ' Einträge')), h('div.pb', h('ul.feed', log.events.map(e => h('li', h('time', App.fmtTime(e.ts)), h('span', { class: 't-' + e.type }, e.text)))))));
    if (tab === 'rueckblick') return main.appendChild(reflectView(log));
    main.appendChild(competenceView(App.state));
  });

  App.competenceView = competenceView;
  function competenceView(s, readOnly) {
    const wrap = h('div.stack');
    wrap.appendChild(h('section.pnl', h('div.ph', h('span', 'Kompetenzringe'), h('span', 'Niveau je Bereich')),
      h('div.pb.rings', App.catalog.areas.map(a => { const st = s.areas[a.id];
        return h('div.ringc', App.svg(B.ring(a.id, st.niveau, st.maxLevel, st.minLevel)), h('div.rn', a.title), h('div.rs', `N${st.niveau}/${st.maxLevel} · ${st.complete}/${st.total} Module`), st.grade ? h('div', { style: { marginTop: '6px' } }, App.gradeCell(st.grade, st.points)) : null); }))));
    // Noten-Matrix Bereich × Niveau
    const levels = [1, 2, 3, 4, 5, 6];
    wrap.appendChild(h('section.pnl', h('div.ph', h('span', 'Bewertung'), h('span', 'Note je Bereich und Niveau (IHK-Schlüssel)')),
      h('div.tbl-wrap', h('table.tbl.matrix', h('thead', h('tr', h('th', 'Bereich'), levels.map(L => h('th', { style: { textAlign: 'center' } }, `N${L}`)), h('th', { style: { textAlign: 'center' } }, 'Gesamt'))),
        h('tbody', App.catalog.areas.map(a => { const st = s.areas[a.id];
          return h('tr', h('td', h('span', { style: { color: App.areaColor(a.id) } }, '■ '), a.title), levels.map(L => { const bl = st.byLevel[L];
            return h('td.mc', !bl ? h('span.faint', '·') : bl.grade ? App.gradeCell(bl.grade, bl.points) : h('span.mono.faint', { style: { fontSize: '11px' } }, `${bl.complete}/${bl.modules}`)); }),
            h('td.mc', App.gradeCell(st.grade, st.points))); }))))));
    // Abzeichen
    const projects = [];
    for (const a of App.catalog.areas) for (const m of a.modules) if (m.kind === 'projekt') projects.push(m);
    const got = projects.filter(m => s.modules[m.id].complete).length;
    wrap.appendChild(h('section.pnl', h('div.ph', h('span', 'Abzeichen aus Praxisprojekten'), h('span', `${got} von ${projects.length}`)),
      h('div.pb.badges', projects.map(m => { const ok = s.modules[m.id].complete;
        return h('div.bdg' + (ok ? '' : '.off'), { title: m.title }, App.svg(B.project(m.area, m.badge, !ok)), h('div.bn', m.badge), h('div.bs', `${App.area(m.area).short || App.area(m.area).title} · N${m.level}`)); }))));
    wrap.appendChild(h('section.pnl', h('div.ph', h('span', 'Stufen-Abzeichen')),
      h('div.pb.badges', App.catalog.stages.map((n, i) => h('div.bdg' + (i + 1 <= s.stage ? '' : '.off'), App.svg(B.stage(i + 1, 72, i + 1 > s.stage)), h('div.bn', n), h('div.bs', i + 1 <= s.stage ? 'erreicht' : `${App.fmtN(s.stageReq[i + 1] ? s.stageReq[i + 1].kp : 0)} KP + Prüfung`))))));
    void readOnly;
    return wrap;
  }

  // ---------- Lernzeit ----------
  function weekKey(d) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() + '-W' + String(Math.ceil(((t - y) / 864e5 + 1) / 7)).padStart(2, '0'); }
  App.weekKey = weekKey;
  App.weekChart = function (time, weeks) {
    weeks = weeks || 12;
    const buckets = [];
    for (let i = weeks - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 7 * 864e5); buckets.push({ k: weekKey(d), m: 0 }); }
    for (const t of time) { const k = weekKey(new Date(t.day + 'T12:00:00')); const b = buckets.find(x => x.k === k); if (b) b.m += t.minutes || t.m || 0; }
    const max = Math.max(60, ...buckets.map(b => b.m));
    const W = 720, H = 200, pad = 34, bw = (W - pad - 10) / weeks;
    let g = '<g class="grid">';
    for (let i = 0; i <= 4; i++) { const y = H - 24 - (H - 44) * i / 4; g += `<line x1="${pad}" x2="${W}" y1="${y}" y2="${y}"/><text x="${pad - 6}" y="${y + 3}" text-anchor="end">${(max * i / 4 / 60).toFixed(1)}h</text>`; }
    g += '</g>';
    buckets.forEach((b, i) => { const hgt = (H - 44) * b.m / max; const x = pad + i * bw + 6; g += `<rect class="bar${i === weeks - 1 ? ' cur' : ''}" x="${x}" y="${H - 24 - hgt}" width="${bw - 12}" height="${hgt}" rx="2"><title>${b.k}: ${App.fmtMin(b.m)}</title></rect><text x="${x + (bw - 12) / 2}" y="${H - 8}" text-anchor="middle">${b.k.slice(6)}</text>`; });
    return h('div.chart', App.svg(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Lernzeit pro Woche">${g}</svg>`));
  };
  function timeView(log) {
    const day = h('input.inp', { type: 'date', value: new Date().toISOString().slice(0, 10) });
    const min = h('input.inp', { type: 'number', min: 1, max: 720, value: 60 });
    const note = h('input.inp', { placeholder: 'z. B. Laborversuch Förderband, Berufsschule' });
    const total = log.time.reduce((a, t) => a + t.minutes, 0);
    return h('div.grid.g-dash',
      h('section.pnl', h('div.ph', h('span', 'Lernzeit pro Woche'), h('span', 'gesamt ' + App.fmtMin(total))), h('div.pb', App.weekChart(log.time))),
      h('section.pnl', h('div.ph', h('span', 'Lernzeit eintragen')), h('div.pb',
        h('p.muted', { style: { fontSize: '13px' } }, 'Aktive Zeit in der Plattform wird automatisch erfasst. Trage hier Zeit ein, die du außerhalb gelernt hast – z. B. an der Maschine oder in der Berufsschule.'),
        h('label.fld', h('span', 'Datum'), day), h('label.fld', h('span', 'Minuten'), min), h('label.fld', h('span', 'Notiz'), note),
        h('button.btn.primary', { onclick: async () => { try { await App.post('/api/time', { day: day.value, minutes: +min.value, note: note.value }); App.toast('Eingetragen', 'ok'); App.render(); } catch (e) { App.toast(e.message, 'bad'); } } }, App.icon('plus'), 'Eintragen'))),
      h('section.pnl.span-all', h('div.ph', h('span', 'Einträge')), h('div.tbl-wrap', h('table.tbl', h('thead', h('tr', h('th', 'Datum'), h('th', 'Dauer'), h('th', 'Art'), h('th', 'Notiz'), h('th', ''))),
        h('tbody', log.time.slice(0, 80).map(t => h('tr', h('td.mono', App.fmtDate(t.day)), h('td.mono', App.fmtMin(t.minutes)), h('td', h('span.tag', t.source)), h('td', t.note || ''),
          h('td', t.source === 'manuell' ? h('button.iconbtn', { 'aria-label': 'Löschen', onclick: async () => { await App.api('DELETE', '/api/time/' + t.id); App.render(); } }, App.icon('trash')) : null))))))));
  }

  // ---------- Wochenrückblick ----------
  function reflectView(log) {
    const wk = weekKey(new Date());
    const cur = log.reflections.find(r => r.week === wk) || {};
    const good = h('textarea.inp', { rows: 4 }, cur.good || '');
    const blocked = h('textarea.inp', { rows: 4 }, cur.blocked || '');
    const goal = h('input.inp', { value: cur.goal || '', placeholder: 'Ein konkretes Ziel, z. B. „Modul Zustandsautomaten abschließen“' });
    const scene = App.svg(`<svg viewBox="0 0 300 160" role="img" aria-label="Werkbank am Feierabend">
      <rect x="0" y="0" width="300" height="160" fill="#0B171D"/><path d="M20 118H280" stroke="#4E6875" stroke-width="6"/><path d="M40 121v30M260 121v30" stroke="#4E6875" stroke-width="4"/>
      <g transform="translate(70,82)"><path d="M0 0h34v26a8 8 0 0 1-8 8H8a8 8 0 0 1-8-8z" fill="#1F3742" stroke="#B1886B" stroke-width="2"/><path d="M34 6h6a6 6 0 0 1 0 12h-6" fill="none" stroke="#B1886B" stroke-width="2"/>
        <path d="M9 -6c-4-6 4-8 0-16M18 -4c-4-6 4-8 0-16M27 -6c-4-6 4-8 0-16" fill="none" stroke="#8FA1A9" stroke-width="1.6" stroke-linecap="round" opacity=".7">
        <animateTransform attributeName="transform" type="translate" values="0 2;0 -3;0 2" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values=".2;.7;.2" dur="3s" repeatCount="indefinite"/></path></g>
      <g transform="translate(150,60)"><rect x="0" y="20" width="96" height="38" rx="3" fill="#15262F" stroke="#465157"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${8 + i * 14}" y="28" width="9" height="22" rx="1" fill="#2D3235" stroke="#4E6875"/><circle cx="${12.5 + i * 14}" cy="32" r="2" fill="${i % 2 ? '#5FBF8F' : '#ED8934'}"><animate attributeName="opacity" values="1;.2;1" dur="${1 + i * .37}s" repeatCount="indefinite"/></circle>`).join('')}</g>
      <path d="M232 20 222 48h20z" fill="#ED8934" opacity=".15"/><circle cx="232" cy="18" r="4" fill="#ED8934"/><path d="M232 22v-14H200" stroke="#465157" stroke-width="2" fill="none"/></svg>`);
    return h('div.grid.g-dash',
      h('section.pnl', h('div.ph', h('span', `Rückblick ${wk}`), h('span', 'drei Fragen · 5 Minuten')),
        h('div.pb',
          h('label.fld', h('span', 'Was lief diese Woche gut?'), good), h('label.fld', h('span', 'Was hat dich blockiert?'), blocked), h('label.fld', h('span', 'Ein Ziel für nächste Woche'), goal),
          h('button.btn.primary', { onclick: async () => { try { await App.post('/api/reflection', { week: wk, good: good.value, blocked: blocked.value, goal: goal.value }); App.sound.ok(); App.toast('Rückblick gespeichert – dein Ausbilder sieht ihn in der Auswertung.', 'ok'); App.render(); } catch (e) { App.toast(e.message, 'bad'); } } }, 'Speichern'))),
      h('aside.stack', h('section.pnl', h('div.pb', { style: { padding: 0 } }, scene)),
        h('section.pnl', h('div.ph', h('span', 'Frühere Rückblicke')), h('div.pb', log.reflections.filter(r => r.week !== wk).length ? log.reflections.filter(r => r.week !== wk).map(r => h('div.note', h('b', r.week), r.goal ? h('div', h('span.muted', 'Ziel: '), r.goal) : null, r.good ? h('div', h('span.muted', 'Gut: '), r.good) : null, r.blocked ? h('div', h('span.muted', 'Blockiert: '), r.blocked) : null)) : h('p.muted', 'Noch keine.')))));
  }
})();
