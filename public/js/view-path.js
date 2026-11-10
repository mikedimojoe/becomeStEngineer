/* Lernpfad: Anlagenübersicht (alle Bereiche, Fog of War) und Kompetenzbaum je Bereich */
(function () {
  'use strict';
  const App = window.App, h = App.h, B = App.badges;

  App.route('lernpfad', async (main, areaId) => {
    const C = App.catalog, s = App.state;
    main.appendChild(h('div.page-head', h('div.grow', h('div.eyebrow', 'Lernpfad'), h('h1', areaId ? App.area(areaId).title : 'Anlagenübersicht'),
      h('p', areaId ? App.area(areaId).description : 'Zehn Bereiche der Automatisierungstechnik. Jeder Bereich hat Niveaus, die mit deiner Stufe freigeschaltet werden. Gesperrtes kannst du schon lesen.'))));
    const tabs = h('div.areatabs', { role: 'toolbar', 'aria-label': 'Bereich wählen' },
      h('button', { 'aria-pressed': String(!areaId), style: { '--c': 'var(--signal)' }, onclick: () => App.go('#/lernpfad') }, 'Übersicht'),
      C.areas.map(a => h('button', { 'aria-pressed': String(a.id === areaId), style: { '--c': App.areaColor(a.id) }, onclick: () => App.go('#/lernpfad/' + a.id) },
        h('i'), a.short || a.title, h('small', 'N' + s.areas[a.id].niveau))));
    main.appendChild(tabs);
    if (!areaId) return main.appendChild(plantMap(s, C));
    main.appendChild(areaView(App.area(areaId), s));
  });

  // ---------- Anlagenübersicht ----------
  function plantMap(s, C) {
    const W = 1200, H = 470;
    const cols = 5, bw = 196, bh = 150, gx = (W - cols * bw) / (cols + 1);
    const pos = C.areas.map((a, i) => ({ a, x: gx + (i % cols) * (bw + gx), y: i < cols ? 50 : 270 }));
    const nextArea = s.next && s.next.area;
    let g = `<defs><pattern id="grd2" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#1A2F39"/></pattern>
      <pattern id="fog" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#0F1D25"/><path d="M0 0V8" stroke="#1E3540" stroke-width="3"/></pattern>
      <radialGradient id="radar"><stop offset="0" stop-color="#ED8934" stop-opacity=".35"/><stop offset="1" stop-color="#ED8934" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#grd2)"/>`;
    // Leitungen: Sammelschiene oben/unten
    g += `<path d="M${gx / 2} 230H${W - gx / 2}" stroke="#2C4957" stroke-width="3"/><text x="${gx / 2}" y="222" font-family="JetBrains Mono" font-size="10" fill="#5E7580">POWERLINK · Ausbildungsnetz</text>`;
    pos.forEach(({ x, y }) => { const cx = x + bw / 2; g += `<path d="M${cx} ${y < 200 ? y + bh : y}V230" stroke="#2C4957" stroke-width="2"/><circle cx="${cx}" cy="230" r="4" fill="#2C4957"/>`; });
    pos.forEach(({ a, x, y }) => {
      const st = s.areas[a.id];
      const open = a.modules.some(m => s.unlocked[m.id] && s.unlocked[m.id].ok) || st.complete > 0;
      const col = B.color(a.id);
      const cx = x + bw / 2;
      g += `<g class="station" data-a="${a.id}" tabindex="0" role="link" aria-label="${a.title}, Niveau ${st.niveau}${open ? '' : ', gesperrt'}" style="cursor:pointer">`;
      g += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="6" fill="#15262F" stroke="${open ? col : '#25404D'}" stroke-width="${open ? 1.6 : 1}"/>`;
      g += `<rect x="${x}" y="${y}" width="${bw}" height="26" rx="6" fill="${open ? col : '#25404D'}" fill-opacity="${open ? .16 : .3}"/>`;
      g += `<text x="${x + 12}" y="${y + 18}" font-family="JetBrains Mono" font-size="10.5" fill="${open ? col : '#5E7580'}" letter-spacing="1">=${a.id.toUpperCase().slice(0, 6)}</text>`;
      g += `<text x="${x + bw - 12}" y="${y + 18}" text-anchor="end" font-family="JetBrains Mono" font-size="10.5" fill="#8FA1A9">N${st.niveau}/${st.maxLevel}</text>`;
      g += `<g transform="translate(${x + 32},${y + 82})"><g transform="scale(1.3)" fill="none" stroke="${open ? col : '#3A5563'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${B.glyph(a.id)}</g></g>`;
      g += `<text x="${x + 64}" y="${y + 66}" font-family="Open Sans" font-weight="700" font-size="12.5" fill="${open ? '#fff' : '#6F8792'}">${wrap(a.title)[0]}</text>`;
      if (wrap(a.title)[1]) g += `<text x="${x + 64}" y="${y + 83}" font-family="Open Sans" font-weight="700" font-size="12.5" fill="${open ? '#fff' : '#6F8792'}">${wrap(a.title)[1]}</text>`;
      if (open) g += `<text x="${x + 64}" y="${y + 104}" font-family="JetBrains Mono" font-size="10.5" fill="#8FA1A9">${st.complete}/${st.total} Module${st.grade ? ' · Note ' + st.grade : ''}</text>`;
      // Niveau-Balken
      for (let L = 1; L <= 6; L++) {
        const bl = st.byLevel[L];
        const bx = x + 12 + (L - 1) * ((bw - 24) / 6), bwid = (bw - 24) / 6 - 4;
        const f = !bl ? 0 : L <= st.niveau ? 1 : bl.complete / Math.max(1, bl.modules);
        g += `<rect x="${bx}" y="${y + bh - 22}" width="${bwid}" height="7" fill="none" stroke="${bl ? '#2C4957' : '#1E3540'}" ${bl ? '' : 'stroke-dasharray="2 2"'}/>`;
        if (f > 0) g += `<rect x="${bx}" y="${y + bh - 22}" width="${(bwid * f).toFixed(1)}" height="7" fill="${col}"/>`;
      }
      if (!open) g += `<rect x="${x}" y="${y + 26}" width="${bw}" height="${bh - 26}" fill="url(#fog)" fill-opacity=".72"/><g transform="translate(${cx - 8},${y + 92})" fill="none" stroke="#8FA1A9" stroke-width="1.6"><rect x="2" y="7" width="12" height="9" rx="1.5"/><path d="M4.5 7V4.5a3.5 3.5 0 0 1 7 0V7"/></g><text x="${cx}" y="${y + 124}" text-anchor="middle" font-family="JetBrains Mono" font-size="10" fill="#8FA1A9">ab Stufe ${App.stageName(st.minLevel)}</text>`;
      if (a.id === nextArea) {
        g += `<circle cx="${x + 32}" cy="${y + 82}" r="26" fill="url(#radar)"><animate attributeName="r" values="10;34;10" dur="2.4s" repeatCount="indefinite"/></circle>`;
        g += `<rect x="${x - 3}" y="${y - 3}" width="${bw + 6}" height="${bh + 6}" rx="8" fill="none" stroke="#ED8934" class="pulse"/>`;
      }
      g += '</g>';
    });
    const svg = App.svg(`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Anlagenübersicht der Lernbereiche">${g}</svg>`);
    const goTo = e => { const t = e.target.closest('.station'); if (t) App.go('#/lernpfad/' + t.dataset.a); };
    svg.addEventListener('click', goTo);
    svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(e); } });
    const n = s.next || {};
    return h('div.grid', { style: { gridTemplateColumns: '1fr' } },
      h('section.pnl', h('div.ph', h('span', 'Anlagenübersicht · 10 Bereiche'), h('span', 'Orange: nächster Schritt')), h('div.pb.tree-wrap', svg)),
      n.kind === 'module' ? h('section.pnl.sig', h('div.ph', h('span', 'Nächster Schritt')), h('div.pb.row.wrap', h('div.grow', h('b', n.title), h('div.muted', n.why)), h('button.btn.primary', { onclick: () => App.openModule(n.module) }, 'Öffnen', App.icon('arrow')))) : null,
      introPanel());
  }
  function wrap(t) { if (t.length <= 15) return [t, '']; let i = t.lastIndexOf(' ', 15); if (i < 0) i = t.indexOf(' '); return i > 0 ? [t.slice(0, i), t.slice(i + 1)] : [t, '']; }

  function introPanel() {
    return h('section.pnl', h('div.ph', h('span', 'So funktioniert die Plattform')),
      h('div.pb.grid.g-3',
        h('div', h('h4', 'Module'), h('p.muted', 'Jedes Modul hat eine Einführung, Videos, Fachtexte, Ziele mit Schritt-für-Schritt-Anleitung, Programmierübungen in ST und eine Wissensprüfung mit 3 Fragen.')),
        h('div', h('h4', 'Bewertung'), h('p.muted', 'Code-Übungen zählen 70 %, Wissensfragen 30 %. Wiederholungen sind erlaubt, senken aber die Punkte leicht. Noten nach IHK-Schlüssel (92/81/67/50/30).')),
        h('div', h('h4', 'Stufen'), h('p.muted', 'Für jede Stufe brauchst du mehrere Bereiche auf dem geforderten Niveau, genug Kompetenzpunkte und eine bestandene Stufenprüfung. Für Junior zusätzlich den Elektro-Kompetenzcheck.'))));
  }

  // ---------- Bereich: Kompetenzbaum + Modulliste ----------
  function areaView(a, s) {
    const st = s.areas[a.id];
    const wrapEl = h('div.grid', { style: { gridTemplateColumns: '1fr' } });
    wrapEl.appendChild(h('section.pnl', h('div.ph', h('span', 'Kompetenzbaum'), h('span', `Niveau ${st.niveau} von ${st.maxLevel} · ${st.complete}/${st.total} Module${st.grade ? ' · Note ' + st.grade : ''}`)),
      h('div.pb.tree-wrap.tree', tree(a, s)),
      h('div.pb.row.wrap', { style: { paddingTop: 0, fontSize: '12px', color: 'var(--muted)' } }, legend())));
    const levels = [...new Set(a.modules.map(m => m.level))].sort();
    const list = h('section.pnl', h('div.ph', h('span', 'Module'), h('span', a.modules.length + ' gesamt')));
    const body = h('div.pb');
    for (const L of levels) {
      const bl = st.byLevel[L];
      body.appendChild(h('div.levelhead', h('h3', `Niveau ${L} · ${App.stageName(L)}`), h('span.muted.mono', { style: { fontSize: '12px' } }, `${bl.complete}/${bl.modules} abgeschlossen`), bl.grade ? App.gradeCell(bl.grade, bl.points) : null,
        s.stage < L ? h('span.chip.warnc', App.icon('lock'), `ab Stufe ${App.stageName(L)}`) : null));
      body.appendChild(h('div.modlist', a.modules.filter(m => m.level === L).map(m => modRow(m, s))));
    }
    list.appendChild(body);
    wrapEl.appendChild(list);
    return wrapEl;
  }
  function legend() {
    const it = (svg, t) => h('span.row', { style: { gap: '6px' } }, App.svg(`<svg width="18" height="18" viewBox="-10 -10 20 20">${svg}</svg>`), t);
    return [it('<circle r="7" fill="none" stroke="#8FA1A9" stroke-width="1.6"/>', 'Lektion'), it(`<polygon points="${hexP(0, 0, 8)}" fill="none" stroke="#8FA1A9" stroke-width="1.6"/>`, 'Praxisprojekt (mit Nachweis)'),
      it('<rect x="-5.5" y="-5.5" width="11" height="11" transform="rotate(45)" fill="none" stroke="#8FA1A9" stroke-width="1.6"/>', 'Zusatzmodul (Bonus)'),
      it('<circle r="7" fill="#5FBF8F"/>', 'abgeschlossen'), it('<circle r="7" fill="none" stroke="#5E7580" stroke-dasharray="2 2"/>', 'gesperrt (lesbar)'), it('<circle r="7" fill="none" stroke="#ED8934" stroke-width="2"/>', 'nächster Schritt')];
  }
  function hexP(cx, cy, r) { const p = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' '); }

  function tree(a, s) {
    const levels = [...new Set(a.modules.map(m => m.level))].sort();
    const colW = 200, rowH = 92, padX = 90, padY = 60;
    const byL = levels.map(L => a.modules.filter(m => m.level === L));
    const maxRows = Math.max(...byL.map(x => x.length));
    const W = padX * 2 + (levels.length - 1) * colW, H = padY * 2 + (maxRows - 1) * rowH + 20;
    const pos = {};
    byL.forEach((ms, ci) => ms.forEach((m, ri) => { pos[m.id] = { x: padX + ci * colW, y: padY + (ri + (maxRows - ms.length) / 2) * rowH }; }));
    const col = B.color(a.id);
    const nextId = s.next && s.next.module;
    let g = `<defs><pattern id="grd3" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#1A2F39"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#grd3)"/>`;
    levels.forEach((L, ci) => { g += `<text x="${padX + ci * colW}" y="22" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="#8FA1A9" letter-spacing="1">N${L} · ${App.stageName(L).toUpperCase()}</text>`; });
    // Kanten
    for (const m of a.modules) for (const r of m.req || []) {
      const p = pos[m.id];
      if (pos[r]) {
        const q = pos[r]; const done = s.modules[r].complete;
        const mx = (q.x + p.x) / 2;
        g += `<path d="M${q.x + 24} ${q.y}C${mx} ${q.y} ${mx} ${p.y} ${p.x - 24} ${p.y}" fill="none" stroke="${done ? col : '#2C4957'}" stroke-width="2" ${done && !s.modules[m.id].complete ? 'class="flowing"' : ''} stroke-opacity="${done ? .9 : 1}"/>`;
      } else {
        const ext = App.mod(r);
        if (ext) g += `<text x="${p.x}" y="${p.y - 34}" text-anchor="middle" font-family="JetBrains Mono" font-size="9.5" fill="${s.modules[r] && s.modules[r].complete ? '#5FBF8F' : '#8FA1A9'}">← ${App.area(ext.area).short || ext.area}</text>`;
      }
    }
    for (const m of a.modules) {
      const p = pos[m.id], st = s.modules[m.id], un = s.unlocked[m.id];
      const locked = !un.ok, done = st.complete, isNext = m.id === nextId;
      const stroke = done ? col : locked ? '#5E7580' : col;
      const fill = done ? col : '#15262F';
      let shape;
      if (m.kind === 'projekt') shape = `<polygon class="shape" points="${hexP(0, 0, 26)}" fill="${fill}" stroke="${stroke}" stroke-width="2" ${locked ? 'stroke-dasharray="3 3"' : ''}/>`;
      else if (m.kind === 'zusatz') shape = `<rect class="shape" x="-17" y="-17" width="34" height="34" transform="rotate(45)" fill="${fill}" stroke="${stroke}" stroke-width="2" ${locked ? 'stroke-dasharray="3 3"' : ''}/>`;
      else shape = `<circle class="shape" r="22" fill="${fill}" stroke="${stroke}" stroke-width="2" ${locked ? 'stroke-dasharray="3 3"' : ''}/>`;
      let inner = '';
      if (done) inner = `<path d="M-8 0-2 6 9-6" stroke="#0F1D25" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      else if (locked) inner = `<g transform="translate(-6,-8)" fill="none" stroke="#8FA1A9" stroke-width="1.6"><rect x="0" y="6" width="12" height="9" rx="1.5"/><path d="M2.5 6V4a3.5 3.5 0 0 1 7 0v2"/></g>`;
      else {
        const pct = st.pct / 100, r = 15, c = 2 * Math.PI * r;
        inner = `<circle r="${r}" fill="none" stroke="#2C4957" stroke-width="3"/><circle r="${r}" fill="none" stroke="${col}" stroke-width="3" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90)"/><text y="4" text-anchor="middle" font-family="JetBrains Mono" font-size="10" fill="#fff">${st.pct}</text>`;
      }
      const t = m.title.length > 26 ? m.title.slice(0, 25) + '…' : m.title;
      g += `<g class="node" data-m="${m.id}" transform="translate(${p.x},${p.y})" tabindex="0" role="button" aria-label="${App.esc(m.title)}${done ? ', abgeschlossen' : locked ? ', gesperrt' : ', ' + st.pct + ' Prozent'}">`;
      if (isNext) g += `<circle r="34" fill="none" stroke="#ED8934" stroke-width="2" class="pulse"/>`;
      g += shape + inner;
      g += `<text y="44" text-anchor="middle" font-family="Open Sans" font-size="11.5" font-weight="600" fill="${locked ? '#6F8792' : '#DDE4E7'}">${App.esc(t)}</text></g>`;
    }
    const svg = App.svg(`<svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W, 900)}px" role="group" aria-label="Kompetenzbaum ${App.esc(a.title)}">${g}</svg>`);
    const open = e => { const n = e.target.closest('.node'); if (n) App.openModule(n.dataset.m); };
    svg.addEventListener('click', open);
    svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } });
    return svg;
  }

  function modRow(m, s) {
    const st = s.modules[m.id], un = s.unlocked[m.id];
    const icon = m.kind === 'projekt' ? App.svg(B.project(m.area, m.badge, !st.complete, 28)) : App.svg(`<svg width="26" height="26" viewBox="-13 -13 26 26"><circle r="10" fill="${st.complete ? B.color(m.area) : 'none'}" stroke="${un.ok ? B.color(m.area) : '#5E7580'}" stroke-width="2" ${m.kind === 'zusatz' ? 'stroke-dasharray="3 2"' : ''}/>${st.complete ? '<path d="M-4 0-1 3 5-3" stroke="#0F1D25" stroke-width="2.4" fill="none"/>' : ''}</svg>`);
    const sub = [m.summary];
    const info = [];
    if (m.kind === 'projekt') info.push(h('span.tag', 'Projekt'));
    if (m.kind === 'zusatz') info.push(h('span.tag', 'Zusatz'));
    if (!un.ok) info.push(h('span.chip.warnc', App.icon('lock'), un.stageOk ? (un.reqOk ? 'Vorstufe offen' : 'Voraussetzung offen') : 'ab ' + App.stageName(m.level)));
    if (st.proofStatus === 'pending') info.push(h('span.chip.warnc', 'Nachweis in Prüfung'));
    if (st.proofStatus === 'rejected') info.push(h('span.chip.badc', 'Nachweis zurückgegeben'));
    return h('button.modrow' + (un.ok ? '' : '.locked') + (s.next && s.next.module === m.id ? '.next-up' : ''), { onclick: () => App.openModule(m.id) },
      h('span.ic', icon), h('span', h('div.t', m.title), h('div.s', sub.join(' '))), h('span.row', info),
      h('span.pc', st.complete ? (st.score !== null ? 'Note ' + gradeOf(st.score) : '✓') : `${st.pct} %`));
  }
  const gradeOf = p => p >= 92 ? 1 : p >= 81 ? 2 : p >= 67 ? 3 : p >= 50 ? 4 : p >= 30 ? 5 : 6;
  App.gradeOf = gradeOf;
})();
