/* Shell: Start/Login, Ersteinrichtung, Passwortwechsel, Navigation */
(function () {
  'use strict';
  const App = window.App, h = App.h;

  const NAV = [
    { r: 'leitstand', label: 'Leitstand', icon: 'dash' },
    { r: 'lernpfad', label: 'Lernpfad', icon: 'path' },
    { r: 'labor', label: 'Code-Labor', icon: 'code', opt: true },
    { r: 'pruefungen', label: 'Prüfungen', icon: 'exam' },
    { r: 'fortschritt', label: 'Fortschritt', icon: 'prog' },
    { r: 'quellen', label: 'Quellen', icon: 'src', opt: true },
    { r: 'ausbildung', label: 'Ausbildung', icon: 'team', staff: true }
  ];

  App.start = async function () {
    try {
      const setup = await App.get('/api/setup');
      if (setup.needsSetup) return showSetup();
      await App.refresh();
      await boot();
    } catch (e) { if (!/anmelden/.test(e.message)) App.showLogin(e.message); }
  };

  async function boot() {
    App.catalog = await App.get('/api/catalog');
    if (App.user.mustChange) return showPwChange(true);
    buildShell();
    App.render();
  }

  function buildShell() {
    const root = App.clear(App.$('#app'));
    const nav = h('nav.nav', { 'aria-label': 'Hauptnavigation' },
      NAV.filter(n => !n.staff || App.user.role !== 'learner').map(n => h('a' + (n.opt ? '.opt' : ''), { href: '#/' + n.r, 'data-r': n.r, 'aria-label': n.label, title: n.label }, App.icon(n.icon), h('span', n.label))));
    const userBtn = h('button.userbtn', { onclick: () => App.go('#/profil'), title: 'Profil und Einstellungen' }, App.icon('user'), App.user.name.split(' ')[0]);
    const top = h('header.top',
      h('a.brand', { href: '#/leitstand', 'aria-label': 'Startseite' }, App.svg(App.badges.logo(17)), h('b', 'BREITNER'), h('span', '// ST ENGINEER')),
      nav,
      h('div.status', { 'aria-label': 'Status' },
        h('span.stg', h('span.led'), 'STUFE ', h('b#st-stage', '')),
        h('span', 'KP ', h('b#st-kp', ''), h('span#st-kpt', '')),
        h('span.kpbar', h('i#st-bar')), userBtn));
    root.append(top, h('main.view', { tabindex: '-1' }));
    App.updateStatus();
  }

  // ---------- Login ----------
  function bootSide(lines) {
    const boot = h('div.boot', { 'aria-hidden': 'true' });
    const side = h('div.bootside',
      h('div', h('div.row', App.svg(App.badges.logo(26)), h('b', { style: { color: 'var(--orange)', fontWeight: 800, fontSize: '22px', letterSpacing: '.05em' } }, 'BREITNER')),
        h('div.eyebrow', { style: { marginTop: '6px' } }, 'ST Engineer · Ausbildungsplattform')),
      boot,
      h('div.muted', { style: { fontSize: '13px', maxWidth: '460px' } }, 'Vom Grundkurs bis zur Stufe Genie: SPS-Programmierung mit B&R Automation Studio 6 in Structured Text – mit echten Übungen, Simulation und nachvollziehbarer Bewertung.'));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0;
    const tick = () => {
      if (i >= lines.length) return;
      const [t, cls] = lines[i++];
      boot.appendChild(h('div', { class: cls || '' }, t));
      setTimeout(tick, reduce ? 0 : 140 + Math.random() * 160);
    };
    tick();
    return side;
  }
  const BOOT = [
    ['BR Automation Runtime · Lernumgebung'], ['> Lade Konfiguration ..................... ', ''], ['  Task-Klasse Cyclic #1 · 10 ms', 'faint'],
    ['> ST-Compiler ............................ OK', 'okb'], ['> Simulation (ArSim-Modell) ............... OK', 'okb'], ['> Lehrplan: 10 Bereiche · 7 Stufen ........ OK', 'okb'],
    ['> Bewertung nach IHK-Notenschlüssel ....... OK', 'okb'], ['> Zustand: RUN', 'sigb'], ['', ''], ['Warte auf Anmeldung _', 'pulse']
  ];
  App.showLogin = function (msg) {
    App.closeOverlay(true);
    const root = App.clear(App.$('#app'));
    const err = h('div.err-msg', { role: 'alert' }, msg && !/anmelden/i.test(msg) ? msg : '');
    const user = h('input.inp', { name: 'username', autocomplete: 'username', required: true, autofocus: true });
    const pw = h('input.inp', { name: 'password', type: 'password', autocomplete: 'current-password', required: true });
    const form = h('form', { onsubmit: async e => {
      e.preventDefault(); err.textContent = '';
      try { await App.post('/api/login', { username: user.value, password: pw.value }); App.sound.ok(); await App.refresh(); await boot(); }
      catch (x) { err.textContent = x.message; App.sound.fail(); pw.select(); }
    } },
      h('div.eyebrow', 'Anmeldung'), h('h1', 'Willkommen zurück'), h('p.muted', 'Melde dich mit den Zugangsdaten an, die du von deinem Ausbilder bekommen hast.'),
      h('label.fld', h('span', 'Benutzername'), user), h('label.fld', h('span', 'Passwort'), pw), err,
      h('button.btn.primary.big', { type: 'submit', style: { width: '100%' } }, 'Anmelden', App.icon('arrow')),
      h('p.faint', { style: { fontSize: '12px', marginTop: '16px' } }, 'Passwort vergessen? Dein Ausbilder oder Admin kann es zurücksetzen.'));
    root.appendChild(h('div.login', bootSide(BOOT), h('div.formside', form)));
  };

  function showSetup() {
    const root = App.clear(App.$('#app'));
    const err = h('div.err-msg', { role: 'alert' });
    const name = h('input.inp', { required: true, placeholder: 'z. B. Mike Freckmann' });
    const user = h('input.inp', { required: true, autocomplete: 'username', placeholder: 'admin' });
    const pw = h('input.inp', { type: 'password', required: true, minlength: 8, autocomplete: 'new-password' });
    const form = h('form', { onsubmit: async e => {
      e.preventDefault();
      try { await App.post('/api/setup', { name: name.value, username: user.value, password: pw.value }); await App.refresh(); await boot(); App.toast('Admin-Konto angelegt. Lege jetzt Gruppen und Lernende an.', 'ok', 6000); App.go('#/ausbildung'); }
      catch (x) { err.textContent = x.message; }
    } },
      h('div.eyebrow', 'Ersteinrichtung'), h('h1', 'Admin-Konto anlegen'), h('p.muted', 'Die Datenbank ist leer. Das erste Konto wird Administrator und sieht alle Gruppen und Bewertungen.'),
      h('label.fld', h('span', 'Anzeigename'), name), h('label.fld', h('span', 'Benutzername'), user), h('label.fld', h('span', 'Passwort (mind. 8 Zeichen)'), pw), err,
      h('button.btn.primary.big', { type: 'submit', style: { width: '100%' } }, 'Einrichten'));
    root.appendChild(h('div.login', bootSide(BOOT.slice(0, 8).concat([['> Datenbank: neu angelegt', 'sigb'], ['Ersteinrichtung erforderlich _', 'pulse']])), h('div.formside', form)));
  }

  function showPwChange(force) {
    const root = App.clear(App.$('#app'));
    const err = h('div.err-msg', { role: 'alert' });
    const pw = h('input.inp', { type: 'password', required: true, minlength: 8, autocomplete: 'new-password' });
    const pw2 = h('input.inp', { type: 'password', required: true, minlength: 8, autocomplete: 'new-password' });
    const form = h('form', { onsubmit: async e => {
      e.preventDefault();
      if (pw.value !== pw2.value) { err.textContent = 'Die Passwörter stimmen nicht überein.'; return; }
      try { await App.post('/api/password', { password: pw.value }); await App.refresh(); await boot(); App.toast('Passwort gespeichert', 'ok'); }
      catch (x) { err.textContent = x.message; }
    } },
      h('div.eyebrow', 'Erste Anmeldung'), h('h1', `Hallo ${App.user.name.split(' ')[0]}!`), h('p.muted', 'Lege bitte ein eigenes Passwort fest. Das Startpasswort deines Ausbilders gilt danach nicht mehr.'),
      h('label.fld', h('span', 'Neues Passwort (mind. 8 Zeichen)'), pw), h('label.fld', h('span', 'Wiederholen'), pw2), err,
      h('button.btn.primary.big', { type: 'submit', style: { width: '100%' } }, 'Speichern und starten'));
    root.appendChild(h('div.login', bootSide(BOOT), h('div.formside', form)));
    void force;
  }
})();
