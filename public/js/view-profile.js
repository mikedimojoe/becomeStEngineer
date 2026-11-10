/* Profil: Name, Vorkenntnisse, Sound, Vollbild, Passwort, Export, Abmelden */
(function () {
  'use strict';
  const App = window.App, h = App.h;
  App.route('profil', async (main) => {
    const u = App.user;
    const name = h('input.inp', { value: u.name });
    const bg = h('select.inp', [['keine', 'Keine SPS-Erfahrung'], ['tia', 'Siemens TIA Portal / STEP 7'], ['codesys', 'CODESYS / Beckhoff TwinCAT'], ['andere', 'Andere Systeme']].map(([v, t]) => h('option', { value: v, selected: u.background === v ? true : null }, t)));
    const snd = h('input', { type: 'checkbox', checked: u.settings.sound !== false ? true : null });
    const full = h('input', { type: 'checkbox', checked: u.settings.fullscreen ? true : null });
    const oldPw = h('input.inp', { type: 'password', autocomplete: 'current-password' });
    const newPw = h('input.inp', { type: 'password', autocomplete: 'new-password' });
    main.append(h('div.page-head', h('div.grow', h('div.eyebrow', 'Profil'), h('h1', u.name), h('p', `${u.username} · ${({ admin: 'Admin', trainer: 'Ausbilder', learner: 'Lernende/r' })[u.role]}${u.group ? ' · ' + u.group : ''}`)),
      h('button.btn', { onclick: async () => { await App.post('/api/logout'); location.hash = ''; App.showLogin(); } }, App.icon('logout'), 'Abmelden')),
      h('div.grid.g-2',
        h('section.pnl', h('div.ph', h('span', 'Persönliches')), h('div.pb',
          h('label.fld', h('span', 'Anzeigename'), name),
          h('label.fld', h('span', 'Vorkenntnisse (für Umsteiger-Hinweise in den Modulen)'), bg),
          h('label.row', { style: { marginBottom: '12px' } }, h('span.switch', snd, h('i')), 'Soundeffekte'),
          h('label.row', { style: { marginBottom: '16px' } }, h('span.switch', full, h('i')), 'Module und Labor im Vollbild öffnen (Taste F)'),
          h('button.btn.primary', { onclick: async () => {
            try { await App.post('/api/settings', { name: name.value, background: bg.value, settings: { sound: snd.checked, fullscreen: full.checked } }); await App.refresh(); App.toast('Gespeichert', 'ok'); App.render(); } catch (e) { App.toast(e.message, 'bad'); }
          } }, 'Speichern'))),
        h('section.pnl', h('div.ph', h('span', 'Passwort ändern')), h('div.pb',
          h('label.fld', h('span', 'Aktuelles Passwort'), oldPw), h('label.fld', h('span', 'Neues Passwort (mind. 8 Zeichen)'), newPw),
          h('button.btn', { onclick: async () => { try { await App.post('/api/password', { old: oldPw.value, password: newPw.value }); App.toast('Passwort geändert', 'ok'); oldPw.value = newPw.value = ''; } catch (e) { App.toast(e.message, 'bad'); } } }, 'Ändern'))),
        h('section.pnl', h('div.ph', h('span', 'Meine Daten')), h('div.pb',
          h('p.muted', 'Exportiere deinen kompletten Lernstand als JSON-Datei: Fortschritt, gelöste Übungen samt Code, Prüfungen, Lernzeit und Rückblicke.'),
          h('a.btn', { href: '/api/export', download: '' }, App.icon('down'), 'Export (JSON)'))),
        h('section.pnl', h('div.ph', h('span', 'Tastenkürzel')), h('div.pb', h('table.tbl', h('tbody',
          [['F', 'Modul/Labor im Vollbild'], ['Esc', 'Fenster schließen'], ['F5', 'Simulation starten/stoppen'], ['Strg + Enter', 'Übung prüfen'], ['Strg + S', 'Code speichern'], ['Strg + /', 'Zeile auskommentieren'], ['Tab / Umschalt + Tab', 'Einrücken'], ['↑ / ↓', 'Befehlshistorie im Git-Terminal']]
            .map(([k, t]) => h('tr', h('td', h('kbd', k)), h('td', t)))))))));
  });
})();
