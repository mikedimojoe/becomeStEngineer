/* Leitstand: Stufenverlauf, nächster Schritt, Kompetenzniveaus, Kennzahlen, Aktivität */
(function () {
  'use strict';
  const App = window.App, h = App.h;

  App.route('leitstand', async (main) => {
    const s = App.state, C = App.catalog;
    const log = await App.get('/api/log').catch(() => ({ time: [], events: [] }));
    main.append(
      h('div.page-head', h('div.grow', h('div.eyebrow', greeting()), h('h1', App.user.name), h('p', `${App.user.group || 'Ohne Gruppe'} · Stufe ${s.stageName} · ${App.fmtN(s.kp)} Kompetenzpunkte`)))
    );
    const grid = h('div.grid.g-dash');
    grid.append(flowPanel(s, C), nextPanel(s), sidePanels(s, log), weekPanel(s, log), feedPanel(log));
    main.appendChild(grid);
  });
  function greeting() { const hr = new Date().getHours(); return hr < 11 ? 'Guten Morgen' : hr < 18 ? 'Guten Tag' : 'Guten Abend'; }

  // Stufenverlauf als Prozesslinie
  function flowPanel(s, C) {
    const W = 1200, H = 150, xs = C.stages.map((_, i) => 80 + i * ((W - 160) / 6));
    const next = s.stage < 7 ? s.stageReq[s.stage + 1] : null;
    let frac = 0;
    if (next) { const tot = next.items.reduce((a, i) => a + i.total, 0) || 1; frac = next.items.reduce((a, i) => a + Math.min(i.done, i.total), 0) / tot; }
    let g = `<defs><pattern id="grd" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#1E3540"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#grd)"/>`;
    g += `<path d="M${xs[0]} 62H${xs[6]}" stroke="#2C4957" stroke-width="6" stroke-linecap="round"/>`;
    const reach = s.stage >= 7 ? xs[6] : xs[s.stage - 1] + (xs[s.stage] - xs[s.stage - 1]) * frac;
    g += `<path d="M${xs[0]} 62H${reach.toFixed(1)}" stroke="#ED8934" stroke-width="6" stroke-linecap="round"/>`;
    if (s.stage < 7) g += `<path d="M${reach.toFixed(1)} 62H${xs[s.stage]}" stroke="#ED8934" stroke-opacity=".5" stroke-width="2" class="flowing"/>`;
    C.stages.forEach((name, i) => {
      const S = i + 1, done = S <= s.stage, cur = S === s.stage + 1;
      const col = done ? '#5FBF8F' : cur ? '#ED8934' : '#2C4957';
      g += `<g transform="translate(${xs[i]},62)" class="stg" data-s="${S}" style="cursor:pointer">`;
      g += `<rect x="-22" y="-22" width="44" height="44" rx="4" fill="#0F1D25" stroke="${col}" stroke-width="2"/>`;
      g += done ? '<path d="M-8 0-2 6 9-6" stroke="#5FBF8F" stroke-width="3" fill="none"/>' : `<text y="5" text-anchor="middle" font-family="JetBrains Mono" font-size="14" fill="${cur ? '#ED8934' : '#5B7480'}">${S}</text>`;
      if (cur) g += '<rect x="-29" y="-29" width="58" height="58" rx="6" fill="none" stroke="#ED8934" class="pulse"/>';
      g += `<text y="44" text-anchor="middle" font-family="Open Sans" font-weight="700" font-size="13" fill="${done || cur ? '#fff' : '#6F8792'}">${name}</text>`;
      const sub = done ? (S === 1 ? 'Start' : 'erreicht') : cur ? `${Math.round(frac * 100)} % · ${App.fmtN(s.stageReq[S].kp)} KP` : `${App.fmtN(s.stageReq[S] ? s.stageReq[S].kp : 0)} KP`;
      g += `<text y="60" text-anchor="middle" font-family="JetBrains Mono" font-size="10.5" fill="#6F8792">${sub}</text></g>`;
    });
    const svg = App.svg(`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Stufenverlauf: aktuell ${s.stageName}">${g}</svg>`);
    svg.addEventListener('click', e => { const t = e.target.closest('.stg'); if (t) App.go('#/pruefungen'); });
    return h('section.pnl.flow.span-all', h('div.ph', h('span', 'Ausbildungsverlauf'), h('span', `Stufe ${s.stage} von 7`)), h('div.pb', svg));
  }

  // Nächster Schritt – genau eine Empfehlung
  function nextPanel(s) {
    const n = s.next || {};
    let action;
    if (n.kind === 'module') action = () => App.openModule(n.module);
    else if (n.kind === 'exam') action = () => App.go('#/pruefungen/' + n.exam);
    else action = () => App.go('#/lernpfad');
    const meta = [];
    if (n.area) meta.push(`${App.area(n.area).title.toUpperCase()} · ${App.stageName(n.level || 1).toUpperCase()}`);
    else if (n.kind === 'exam') meta.push('PRÜFUNG');
    return h('section.pnl.sig.next', { 'aria-label': 'Nächster Schritt' },
      h('div.ph', h('span', 'Nächster Schritt'), h('span', n.minutes ? `ca. ${n.minutes} min · +${n.kp} KP` : '')),
      h('div.pb',
        h('div', h('div.eyebrow.sig', meta.join('')), h('h2', n.title || 'Lernpfad öffnen'), h('p.why', n.why || ''), n.sub ? h('div.sub', '▸ ', n.sub) : null, n.unlocks ? h('div.unl', n.unlocks) : null),
        h('button.btn.primary.big', { onclick: action }, n.kind === 'exam' ? 'Zur Prüfung' : 'Fortsetzen', App.icon('arrow'))));
  }

  function levelRows(s) {
    return h('div.lv-list', App.catalog.areas.map(a => {
      const st = s.areas[a.id];
      const locked = !a.modules.some(m => s.unlocked[m.id] && s.unlocked[m.id].ok) && st.complete === 0;
      const segs = [];
      for (let L = 1; L <= 6; L++) {
        const bl = st.byLevel[L];
        if (!bl) { segs.push(h('i.na')); continue; }
        if (L <= st.niveau) segs.push(h('i.f'));
        else if (L === st.niveau + 1 || (st.niveau === 0 && L === st.minLevel)) segs.push(h('i.p', { style: { '--p': Math.round(100 * bl.complete / Math.max(1, bl.modules)) + '%' } }));
        else segs.push(h('i'));
      }
      return h('a.lv' + (locked ? '.locked' : ''), { href: '#/lernpfad/' + a.id, style: { '--c': App.areaColor(a.id) } },
        h('span.nm', a.title), h('span.n', `N${st.niveau}${locked ? ' · gesperrt' : st.grade ? ' · Note ' + st.grade : ''}`), h('div.segs', segs));
    }));
  }
  function sidePanels(s) {
    return h('aside.stack', { style: { gridRow: 'span 3' } },
      h('section.pnl', h('div.ph', h('span', 'Kompetenzniveau'), h('span', 'N0–N6')), h('div.pb', levelRows(s))));
  }
  function weekPanel(s, log) {
    const since = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
    const min = log.time.filter(t => t.day >= since).reduce((a, t) => a + t.minutes, 0);
    const weekEvents = log.events.filter(e => e.ts.slice(0, 10) >= since);
    const mods = weekEvents.filter(e => e.type === 'modul' || e.type === 'projekt').length;
    const ex = weekEvents.filter(e => e.type === 'uebung').length;
    const scored = Object.values(s.areas).filter(a => a.points !== null && a.points !== undefined);
    const pts = scored.length ? Math.round(scored.reduce((x, a) => x + a.points, 0) / scored.length) : null;
    const grade = pts === null ? '–' : pts >= 92 ? 1 : pts >= 81 ? 2 : pts >= 67 ? 3 : pts >= 50 ? 4 : pts >= 30 ? 5 : 6;
    return h('section.pnl', h('div.ph', h('span', 'Kennzahlen · letzte 7 Tage'), h('a.act', { href: '#/fortschritt' }, 'Details')),
      h('div.kpi', h('div', h('b', App.fmtMin(min)), h('span', 'Lernzeit')), h('div', h('b', String(mods)), h('span', 'Module abgeschlossen')),
        h('div', h('b', String(ex)), h('span', 'Übungen gelöst')), h('div', h('b', String(grade)), h('span', pts === null ? 'Gesamtnote' : `Gesamtnote · ${pts} P.`))));
  }
  function feedPanel(log) {
    const list = log.events.slice(0, 9);
    return h('section.pnl', h('div.ph', h('span', 'Aktivität'), h('a.act', { href: '#/fortschritt' }, 'Alle')),
      h('div.pb', list.length ? h('ul.feed', list.map(e => h('li', h('time', App.fmtTime(e.ts)), h('span', { class: 't-' + e.type }, e.text))))
        : h('p.muted', 'Noch keine Aktivität. Starte mit dem nächsten Schritt oben.')));
  }
})();
