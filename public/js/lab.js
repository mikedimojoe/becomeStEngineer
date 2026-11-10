/* Code-Labor: ST-Projekt mit Editor, Simulation, I/O-Panel, Watch, Tests – und Git-Terminal (Simulator) */
(function () {
  'use strict';
  const App = window.App, h = App.h;
  const FILES = [['main', 'Main.st'], ['var', 'Variables.var'], ['typ', 'Types.typ']];

  // ---------- Öffnen aus einem Modul ----------
  App.openLab = function (m, ex) {
    const sheet = h('div.sheet');
    App.currentModule = m.id;
    let lab;
    App.openOverlay(sheet, { label: 'Code-Labor: ' + ex.title, sticky: true, onClose: () => { lab && lab.destroy(); }, after: () => App.openModule(m.id) });
    const head = h('div.sheet-head', h('span.tag', 'Code-Labor'), h('h2.grow', ex.title),
      h('button.iconbtn', { title: 'Vollbild umschalten (F)', 'aria-label': 'Vollbild', onclick: App.toggleFull }, App.icon('full')),
      h('button.iconbtn', { title: 'Zurück zum Modul (Esc)', 'aria-label': 'Schließen', onclick: () => App.closeOverlay() }, App.icon('close')));
    sheet.appendChild(head);
    const opts = {
      ex, saved: ex.saved, solved: ex.solved, solution: ex.solution,
      onSave: App.debounce(payload => App.post(`/api/exercise/${m.id}/${ex.id}/save`, payload).catch(() => {}), 1500),
      onCheck: async payload => {
        const before = App.state;
        const r = await App.post(`/api/exercise/${m.id}/${ex.id}/check`, payload);
        if (r.ok && r.firstSolve) { App.floatKP(App.catalog.kp.exercise); App.fx({ eyebrow: 'Übung gelöst', title: ex.title, text: `Alle ${r.total} Tests bestanden · ${r.score} Punkte`, svg: App.badges.check(m.area), sound: 'ok', ms: 3200 }); }
        await App.refresh();
        App.handleCompletion(r.completion, before);
        return r;
      }
    };
    lab = ex.type === 'git' ? App.gitLab(opts) : App.stLab(opts);
    sheet.appendChild(lab.el);
  };

  // ---------- ST-Labor ----------
  App.stLab = function (o) {
    const ex = o.ex;
    const start = ex.files || { main: '', var: '', typ: '' };
    let files = Object.assign({ main: '', var: '', typ: '' }, start, (o.saved && o.saved.files) || {});
    let cur = 'main', proj = null, running = false, raf = null, speed = 1, lastT = 0, acc = 0, dirty = false, watchPrev = {};
    const readCache = new Map();
    const ed = App.Editor({ label: 'Structured Text Editor' });
    const tabs = h('div.tabs', { role: 'tablist' });
    const consoleEl = h('div.lab-console', { role: 'log', 'aria-live': 'polite' });
    const stateEl = h('span.runstate', 'STOP');
    const simbox = h('div.simbox');
    const ioPanel = h('div.iopanel');
    const watchBody = h('tbody');
    const testsBox = h('div.tests-list');
    const timeEl = h('span.mono.faint', { style: { fontSize: '12px' } }, 't = 0 ms');
    const log = (msg, cls, line, file) => {
      const l = h('div.l' + (cls ? '.' + cls : ''));
      if (line && file) { const a = h('a', { onclick: () => jumpTo(file, line) }, `${file}:${line}`); l.append(a, ' ', msg); } else l.textContent = msg;
      consoleEl.appendChild(l); consoleEl.scrollTop = 1e9;
    };
    function jumpTo(file, line) {
      const k = (FILES.find(f => f[1] === file) || [])[0];
      if (k) { selectTab(k); ed.setError(line); ed.gotoLine(line); }
    }
    function selectTab(k) {
      files[cur] = ed.get(); cur = k;
      App.$$('button', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === k)));
      ed.set(files[k]);
    }
    FILES.forEach(([k, name]) => tabs.appendChild(h('button', { role: 'tab', 'data-k': k, 'aria-selected': String(k === cur), onclick: () => selectTab(k) }, name)));
    ed.set(files.main);
    ed.onChange = v => { files[cur] = v; dirty = true; o.onSave && o.onSave({ files: Object.assign({}, files) }); };
    ed.onRun = () => (running ? stop() : run());
    ed.onCheck = () => check();
    ed.onSave = () => { o.onSave && o.onSave({ files }); App.toast('Gespeichert', 'ok', 1200); };

    function compile() {
      files[cur] = ed.get();
      try {
        proj = ST.createProject({ files, io: ex.io || [], plant: ex.plant, cycleMs: ex.cycleMs || 10, axis: ex.axis, tcpServer: ex.tcpServer, tcpOfflineVar: ex.tcpOfflineVar });
        proj.init();
        readCache.clear(); watchPrev = {};
        ed.setError(null);
        log(`Übersetzt ✓ – ${(ex.io || []).length} I/O-Variablen, Task-Klasse ${ex.cycleMs || 10} ms`, 'ok');
        dirty = false;
        stateEl.textContent = 'BEREIT'; stateEl.className = 'runstate';
        updateAll();
        return true;
      } catch (e) {
        proj = null;
        if (e instanceof ST.STError) { log(`${e.kind}: ${e.message}`, 'err', e.line, e.file); if (e.file === FILES.find(f => f[0] === cur)[1]) ed.setError(e.line); else jumpTo(e.file, e.line); }
        else log('Interner Fehler: ' + e.message, 'err');
        stateEl.textContent = 'FEHLER'; stateEl.className = 'runstate err';
        return false;
      }
    }
    function run() {
      if (!proj || dirty) { if (!compile()) return; }
      running = true; stateEl.textContent = 'RUN'; stateEl.className = 'runstate run';
      btnRun.replaceChildren(App.icon('stop'), 'Stopp'); lastT = performance.now(); acc = 0;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false; cancelAnimationFrame(raf);
      if (proj) { stateEl.textContent = 'STOP'; stateEl.className = 'runstate'; }
      btnRun.replaceChildren(App.icon('play'), 'Start');
    }
    function stepOnce(n) {
      if (!proj || dirty) { if (!compile()) return; }
      try { for (let i = 0; i < n; i++) proj.cycle(); } catch (e) { runtimeError(e); }
      updateAll();
    }
    function runtimeError(e) {
      stop();
      if (e instanceof ST.STError) log(`${e.kind}: ${e.message}`, 'err', e.line, e.file); else log(e.message, 'err');
      stateEl.textContent = 'SERVICE'; stateEl.className = 'runstate err';
      proj = null;
    }
    function loop(t) {
      if (!running) return;
      const dt = Math.min(250, t - lastT); lastT = t;
      acc += dt * speed;
      const cyc = ex.cycleMs || 10;
      let n = Math.floor(acc / cyc); acc -= n * cyc;
      n = Math.min(n, 2000);
      try { for (let i = 0; i < n; i++) { applyHeld(); proj.cycle(); } } catch (e) { runtimeError(e); return; }
      updateAll();
      raf = requestAnimationFrame(loop);
    }
    function reset() { stop(); proj = null; dirty = true; App.$$('.push.on', ioPanel).forEach(b => b.classList.remove('on')); held.clear(); compile(); log('Zurückgesetzt – _INIT ausgeführt', 'info'); }

    // Lesen für Szene/Watch
    function read(path) {
      if (!proj || !path) return undefined;
      let c = readCache.get(path);
      if (c === undefined) { try { c = proj.compileExpr(path); } catch (e) { c = null; } readCache.set(path, c); }
      if (!c) return undefined;
      try { return c.ev(proj.env); } catch (e) { return undefined; }
    }

    // I/O-Panel
    const held = new Set();
    function applyHeld() { for (const n of held) proj.set(n, true); }
    const ioEls = [];
    for (const io of ex.io || []) {
      if (!io.widget && !/^(BOOL|U?S?D?L?INT|REAL|LREAL|BYTE|WORD|DWORD)$/i.test(io.type)) continue;
      const w = io.widget || (io.type === 'BOOL' ? (io.dir === 'in' ? 'switch' : 'led') : 'value');
      const box = h('div.io', h('div.il', io.label || io.name), h('div.vn', io.name + ' : ' + io.type));
      let upd = null;
      if (w === 'button' && io.dir === 'in') {
        const b = h('button.push', { 'aria-pressed': 'false' }, 'drücken');
        const down = e => { e.preventDefault(); held.add(io.name); b.classList.add('on'); if (proj) proj.set(io.name, true); };
        const up = () => { held.delete(io.name); b.classList.remove('on'); if (proj) proj.set(io.name, false); };
        b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', () => held.has(io.name) && up());
        b.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') down(e); }); b.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') up(); });
        box.appendChild(b);
        upd = () => {};
      } else if (w === 'switch' && io.dir === 'in') {
        const inp = h('input', { type: 'checkbox', 'aria-label': io.label || io.name, onchange: () => proj && proj.set(io.name, inp.checked) });
        if (io.init) inp.checked = true;
        box.appendChild(h('label.row', h('span.switch', inp, h('i')), h('span.iv', '')));
        upd = () => { const v = read(io.name); inp.checked = !!v; box.querySelector('.iv').textContent = v ? 'TRUE' : 'FALSE'; };
      } else if (w === 'slider' && io.dir === 'in') {
        const mn = io.min !== undefined ? io.min : 0, mx = io.max !== undefined ? io.max : 100;
        const inp = h('input', { type: 'range', min: mn, max: mx, step: io.type === 'REAL' ? (mx - mn) / 200 : 1, value: io.init !== undefined ? io.init : mn, 'aria-label': io.label || io.name });
        const val = h('span.iv');
        inp.addEventListener('input', () => { if (proj) proj.set(io.name, +inp.value); });
        box.append(inp, val);
        let userTouched = false; inp.addEventListener('pointerdown', () => { userTouched = true; }); inp.addEventListener('pointerup', () => { userTouched = false; });
        upd = () => { const v = read(io.name); if (typeof v === 'number') { val.textContent = fmt(v, io); if (!userTouched && document.activeElement !== inp) inp.value = v; } };
      } else if (w === 'led' || io.type === 'BOOL') {
        const lp = h('span.lamp'); box.appendChild(h('div.row', lp, h('span.iv', '')));
        upd = () => { const v = !!read(io.name); lp.classList.toggle('on', v); box.querySelector('.iv').textContent = v ? 'TRUE' : 'FALSE'; };
      } else if (w === 'gauge') {
        const mn = io.min !== undefined ? io.min : 0, mx = io.max !== undefined ? io.max : 100;
        const bar = h('i'); const val = h('span.iv'); box.append(h('div.gauge', bar), val);
        upd = () => { const v = read(io.name); if (typeof v === 'number') { bar.style.width = Math.max(0, Math.min(100, 100 * (v - mn) / ((mx - mn) || 1))) + '%'; val.textContent = fmt(v, io); } };
      } else {
        const val = h('span.iv'); box.appendChild(val);
        if (io.dir === 'in') {
          const inp = h('input.inp', { style: { padding: '4px 6px' }, 'aria-label': io.label || io.name, onchange: () => proj && proj.set(io.name, +inp.value.replace(',', '.')) });
          box.appendChild(inp);
        }
        upd = () => { const v = read(io.name); val.textContent = v === undefined ? '–' : fmt(v, io); };
      }
      ioEls.push(upd); ioPanel.appendChild(box);
    }
    function fmt(v, io) { if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'; if (typeof v !== 'number') return String(v); return (io.type === 'REAL' || io.type === 'LREAL' ? (+v.toFixed(2)).toString().replace('.', ',') : String(v)) + (io.unit ? ' ' + io.unit : ''); }

    const scene = App.scenes.create(ex.scene);
    if (scene) simbox.appendChild(scene.el);
    simbox.appendChild(ioPanel);

    function updateWatch() {
      if (!proj) return;
      const rows = proj.watch();
      const frag = document.createDocumentFragment();
      for (const r of rows.slice(0, 250)) {
        const v = r.group ? '' : ST.formatValue(r.raw !== undefined ? r.raw : r.value, r.kind ? { k: r.kind, members: [] } : null);
        const shown = r.kind === 'ENUM' ? r.value : (r.value === undefined ? '' : r.kind ? v : String(r.value));
        const chg = watchPrev[r.name] !== undefined && watchPrev[r.name] !== shown;
        watchPrev[r.name] = shown;
        const short = !r.depth ? r.name : /\]$/.test(r.name) ? r.name.slice(r.name.lastIndexOf('[')) : r.name.slice(r.name.lastIndexOf('.') + 1);
        frag.appendChild(h('tr', h('td', { style: { paddingLeft: (10 + r.depth * 14) + 'px', color: r.group ? 'var(--muted)' : '' } }, short),
          h('td.v' + (chg ? '.chg' : ''), shown), h('td.ty', r.type)));
      }
      App.clear(watchBody).appendChild(frag);
    }
    let lastWatch = 0;
    function updateAll() {
      ioEls.forEach(f => f());
      if (scene) scene.update(read);
      if (proj) timeEl.textContent = `t = ${App.fmtN(proj.rt.now)} ms · Zyklus ${App.fmtN(proj.rt.cycleCount)}`;
      const t = performance.now();
      if (t - lastWatch > 180 || !running) { lastWatch = t; updateWatch(); }
    }

    // Tests anzeigen
    function showTests(r, src) {
      App.clear(testsBox);
      if (r.compileError) { testsBox.appendChild(h('div.tst.badt', h('span.bad', '✗'), h('span', 'Übersetzung fehlgeschlagen'), h('span.m', r.compileError.text))); log(r.compileError.text, 'err', r.compileError.line, r.compileError.file); return; }
      for (const t of r.tests) testsBox.appendChild(h('div.tst' + (t.ok ? '.okt' : '.badt'), h('span', { class: t.ok ? 'ok' : 'bad' }, t.ok ? '✓' : '✗'), h('span', t.name), !t.ok && t.msg ? h('span.m', t.msg + (t.detail ? ' · ' + t.detail : '')) : null));
      testsBox.prepend(h('div', { style: { fontWeight: 700, color: r.ok ? 'var(--ok)' : 'var(--text-hi)', marginBottom: '4px' } }, `${r.passed}/${r.total} Tests bestanden${src ? ' · ' + src : ''}${r.score !== undefined ? ' · ' + r.score + ' Punkte' : ''}`));
    }
    function localTests() {
      files[cur] = ed.get();
      const r = ST.runTests(ex, files);
      if (!ex.tests || !ex.tests.length) { log('Für diese Aufgabe gibt es keine lokalen Tests.', 'info'); return; }
      showTests(r, 'lokal (ohne Bewertung)');
      log(`Lokaler Testlauf: ${r.passed}/${r.total}`, r.ok ? 'ok' : 'warn');
    }
    async function check() {
      files[cur] = ed.get();
      if (!o.onCheck) return localTests();
      btnCheck.disabled = true;
      try {
        const r = await o.onCheck({ files: Object.assign({}, files) });
        showTests(r, 'gewertet');
        log(`Prüfung: ${r.passed}/${r.total} Tests${r.ok ? ' – bestanden ✓' : ''}`, r.ok ? 'ok' : 'warn');
        if (r.ok) { App.sound.ok(); if (r.solution && !o.solution) { o.solution = r.solution; solBtn.hidden = false; } }
        else App.sound.fail();
      } catch (e) { log(e.message, 'err'); App.toast(e.message, 'bad'); }
      btnCheck.disabled = false;
    }

    // Leiste
    const btnRun = h('button.btn.primary.small', { onclick: () => (running ? stop() : run()), title: 'Start/Stopp (F5)' }, App.icon('play'), 'Start');
    const btnCheck = h('button.btn.small', { onclick: check, title: 'Prüfen und werten (Strg+Enter)', style: { borderColor: 'var(--signal)' } }, App.icon('test'), o.onCheck ? 'Prüfen' : 'Tests');
    const speedSeg = h('div.seg', { role: 'group', 'aria-label': 'Simulationsgeschwindigkeit' }, [1, 5, 20].map(f => h('button', { 'aria-pressed': String(f === 1), onclick: e => { speed = f; App.$$('button', speedSeg).forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); } }, f + '×')));
    const solBtn = h('button.btn.small.ghost', { hidden: !o.solution || null, onclick: () => showSolution() }, App.icon('bulb'), 'Musterlösung');
    function showSolution() {
      const s = o.solution; if (!s) return;
      const box = h('div', FILES.filter(([k]) => s[k]).map(([k, n]) => h('div', h('div.eyebrow', n), App.codeBlock(s[k], 'st'))));
      App.toast('Musterlösung unten in der Aufgabe eingeblendet', 'ok');
      taskEl.appendChild(h('div', { style: { marginTop: '12px' } }, h('h4', 'Musterlösung'), box));
      taskEl.scrollTop = 1e9;
    }
    const bar = h('div.lab-bar',
      h('span.title', 'ST'), stateEl, btnRun,
      h('button.btn.small', { onclick: () => stepOnce(1), title: 'Einen Zyklus ausführen' }, App.icon('step'), 'Zyklus'),
      h('button.btn.small', { onclick: reset, title: 'Neu übersetzen und _INIT' }, App.icon('reset'), 'Reset'),
      speedSeg, timeEl, h('span.grow'),
      h('button.btn.small.ghost', { onclick: localTests, title: 'Tests nur lokal laufen lassen (ohne Wertung)' }, 'Lokal testen'),
      btnCheck, solBtn,
      h('button.btn.small.ghost', { onclick: () => { if (confirm('Startcode wiederherstellen? Deine Änderungen gehen verloren.')) { files = Object.assign({ main: '', var: '', typ: '' }, start); ed.set(files[cur]); dirty = true; o.onSave && o.onSave({ files }); } } }, 'Startcode'));
    const taskEl = h('div.lab-task', h('div.md', { html: App.md(ex.task || '') }),
      (ex.hints || []).length ? h('details', h('summary', { style: { cursor: 'pointer', color: 'var(--kupfer)', fontWeight: 600 } }, `Hinweise (${ex.hints.length})`), h('ul', ex.hints.map(t => h('li', { html: App.md(t).replace(/^<p>|<\/p>$/g, '') })))) : null,
      (ex.tests || []).length ? h('details', h('summary', { style: { cursor: 'pointer', color: 'var(--muted)', fontWeight: 600, marginTop: '6px' } }, `Prüfkriterien (${ex.tests.length})`), h('ul', ex.tests.map(t => h('li', t.name)))) : null);
    const left = h('div.lab-left', taskEl, tabs, ed.el, consoleEl);
    const right = h('div.lab-right',
      simbox,
      h('div.pnl', { style: { margin: '0 12px 12px' } }, h('div.ph', h('span', 'Prüfergebnis')), h('div.pb', testsBox)),
      h('div.pnl.watch', { style: { margin: '0 12px 12px' } }, h('div.ph', h('span', 'Watch'), h('span', 'Variablen live')), h('div', { style: { maxHeight: '340px', overflow: 'auto' } }, h('table', h('thead', h('tr', h('th', 'Name'), h('th', 'Wert'), h('th', 'Typ'))), watchBody))));
    testsBox.appendChild(h('p.muted', { style: { margin: 0, fontSize: '13px' } }, o.solved ? 'Bereits gelöst – du kannst weiter experimentieren.' : 'Noch nicht geprüft. „Prüfen“ startet die gewertete Prüfung auf dem Server.'));
    const el = h('div.lab', bar, left, right);
    log('Code-Labor bereit. F5 = Start/Stopp · Strg+Enter = Prüfen · Strg+S = Speichern · Strg+/ = Kommentar', 'info');
    setTimeout(() => compile(), 30);
    return { el, destroy() { stop(); if (o.onSave) o.onSave({ files }); }, getFiles: () => { files[cur] = ed.get(); return Object.assign({}, files); } };
  };

  // ---------- Git-Labor ----------
  App.gitLab = function (o) {
    const ex = o.ex;
    let history = (o.saved && o.saved.history) || [];
    let st = null;
    const term = h('div.term', { role: 'log', 'aria-label': 'Git Bash' });
    const input = h('input', { 'aria-label': 'Befehl eingeben', autocomplete: 'off', spellcheck: 'false' });
    const prompt = h('span');
    const inl = h('div.inl', prompt, input);
    const side = h('div', { style: { padding: '12px' } });
    const testsBox = h('div.tests-list');
    let hIdx = -1;
    const println = (t, cls) => { const l = h('div.ln' + (cls ? '.' + cls : ''), t); term.insertBefore(l, inl); };
    function promptHtml() {
      const p = GITSIM.prompt(st);
      prompt.innerHTML = `<span class="pr-user">${p.user}</span> <span class="pr-sys">${p.sys}</span> <span class="pr-dir">${App.esc(p.dir)}</span><span class="pr-br">${App.esc(p.branch)}</span><br>$&nbsp;`;
    }
    function fresh(silent) {
      st = GITSIM.setup(ex);
      App.$$('.ln', term).forEach(x => x.remove());
      if (!silent) println('Git-Simulator · tippe "help" für alle Befehle · Remote: ' + (ex.setup && ex.setup.remote || ''), 'o-ok');
      promptHtml(); overview();
    }
    function exec(cmd, record) {
      if (typeof cmd === 'string') println(GITSIM.prompt(st).dir + (GITSIM.prompt(st).branch || '') + ' $ ' + cmd);
      const out = GITSIM.exec(st, cmd);
      if (record !== false) { history.push(cmd); o.onSave && o.onSave({ history }); }
      if (out === '\u001bclear') { App.$$('.ln', term).forEach(x => x.remove()); }
      else if (out && out.startsWith('\u001bedit ')) openEditor(out.slice(6));
      else if (out) println(out, /^(fatal|error|bash):|rejected|CONFLICT|Aborting/m.test(out) ? 'o-err' : '');
      promptHtml(); overview();
      term.scrollTop = 1e9;
    }
    function replay() {
      fresh(true);
      for (const c of history) { const out = GITSIM.exec(st, c); if (typeof c === 'string') { println('$ ' + c); if (out && !out.startsWith('\u001b')) println(out, /^(fatal|error):/m.test(out) ? 'o-err' : ''); } else println('(Datei gespeichert: ' + c.write + ')', 'o-ok'); }
      promptHtml(); overview(); term.scrollTop = 1e9;
    }
    input.addEventListener('keydown', e => {
      const cmds = history.filter(x => typeof x === 'string');
      if (e.key === 'Enter') { const v = input.value; input.value = ''; hIdx = -1; if (v.trim()) exec(v); else { println('$'); } }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (!cmds.length) return; hIdx = hIdx < 0 ? cmds.length - 1 : Math.max(0, hIdx - 1); input.value = cmds[hIdx]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hIdx < 0) return; hIdx++; if (hIdx >= cmds.length) { hIdx = -1; input.value = ''; } else input.value = cmds[hIdx]; }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); App.$$('.ln', term).forEach(x => x.remove()); }
      else if (e.key === 'Tab') { e.preventDefault(); complete(); }
    });
    function complete() {
      const v = input.value; const parts = v.split(' '); const last = parts[parts.length - 1];
      const ov = GITSIM.overview(st);
      const cands = [...(ov.files || []), ...Object.keys((st.repo && st.repo.branches) || {})].filter(x => x.startsWith(last));
      if (cands.length === 1) { parts[parts.length - 1] = cands[0]; input.value = parts.join(' '); }
    }
    term.addEventListener('click', () => { if (!window.getSelection().toString()) input.focus(); });
    term.appendChild(inl);

    function openEditor(path) {
      const content = (st.repo && st.repo.work[path]) || '';
      const ed = App.Editor({ label: 'Datei bearbeiten: ' + path, lang: /\.(st|var|typ|fun)$/.test(path) ? 'st' : 'text' });
      ed.set(content);
      const dlg = h('div.pnl', { style: { position: 'absolute', inset: '40px', zIndex: 5, display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow)' } },
        h('div.ph', h('span', 'Editor · ' + path), h('span.row', h('button.btn.small.primary', { onclick: save }, 'Speichern (Strg+S)'), h('button.btn.small.ghost', { onclick: () => dlg.remove() }, 'Abbrechen'))), ed.el);
      ed.el.style.flex = '1';
      ed.onSave = save;
      function save() { exec({ write: path, content: ed.get() }); println(`(Datei gespeichert: ${path})`, 'o-ok'); dlg.remove(); input.focus(); }
      el.style.position = 'relative';
      el.appendChild(dlg); setTimeout(() => ed.focus(), 30);
    }
    function overview() {
      const ov = GITSIM.overview(st);
      App.clear(side);
      if (!ov.repo) { side.appendChild(h('p.muted', 'Noch kein Repository. Klone es mit git clone <url>.')); return; }
      const s = ov.status;
      side.append(
        h('div.pnl', { style: { marginBottom: '12px' } }, h('div.ph', h('span', 'Repository'), h('span', ov.branch ? 'Branch ' + ov.branch : 'HEAD detached')),
          h('div.pb', { style: { fontSize: '13px' } },
            ov.merging ? h('div.chip.warnc', 'MERGE läuft – Konflikte lösen') : null,
            h('div', h('b.ok', s.staged.length), ' vorgemerkt · ', h('b.warn', s.unstaged.length), ' geändert · ', h('b.faint', s.untracked.length), ' unversioniert'),
            h('div.faint', { style: { marginTop: '6px', fontSize: '12px' } }, 'Server-Branches: ', ov.remoteBranches.join(', ')))),
        h('div.pnl', { style: { marginBottom: '12px' } }, h('div.ph', h('span', 'Historie')), h('div.pb.gitgraph', ov.commits.slice(0, 14).map(c => h('div.c', h('span', { style: { color: c.head ? 'var(--signal)' : 'var(--muted)' } }, c.parents.length > 1 ? '◆' : '●'), h('span.faint', c.hash),
          h('span', c.refs.map(r => h('span.ref.' + (r.startsWith('origin/') ? 'r' : r.startsWith('tag:') ? 't' : 'b'), r.replace('tag:', '🏷 '))), c.msg))))),
        h('div.pnl', h('div.ph', h('span', 'Dateien')), h('div.pb.mono', { style: { fontSize: '12px', maxHeight: '160px', overflow: 'auto' } }, ov.files.map(f => h('div', { style: { cursor: 'pointer' }, onclick: () => { input.value = 'cat ' + f; input.focus(); } }, f)))));
    }
    async function check() {
      btnCheck.disabled = true;
      try {
        const r = o.onCheck ? await o.onCheck({ history }) : (() => { const res = GITSIM.checkState(ex, st); return { ok: res.every(x => x.ok), passed: res.filter(x => x.ok).length, total: res.length, tests: res.map(c => ({ name: c.type, ok: c.ok, msg: c.msg })) }; })();
        App.clear(testsBox);
        testsBox.appendChild(h('div', { style: { fontWeight: 700, color: r.ok ? 'var(--ok)' : '#fff' } }, `${r.passed}/${r.total} Prüfpunkte erfüllt${r.score !== undefined ? ' · ' + r.score + ' Punkte' : ''}`));
        r.tests.forEach(t => testsBox.appendChild(h('div.tst' + (t.ok ? '.okt' : '.badt'), h('span', { class: t.ok ? 'ok' : 'bad' }, t.ok ? '✓' : '✗'), h('span', label(t.name)), !t.ok && t.msg ? h('span.m', t.msg) : null)));
        if (r.ok) App.sound.ok(); else App.sound.fail();
        if (r.ok && r.solution) { solBtn.hidden = false; o.solution = r.solution; }
      } catch (e) { App.toast(e.message, 'bad'); }
      btnCheck.disabled = false;
    }
    const LABELS = { currentBranch: 'Aktueller Branch', branchExists: 'Branch vorhanden', commitCountMin: 'Anzahl eigener Commits', lastCommitMsgMatches: 'Commit-Nachricht', fileContains: 'Dateiinhalt', clean: 'Arbeitsverzeichnis sauber', merged: 'Gemergt', remoteHasBranch: 'Branch auf dem Server', remoteInSync: 'Mit Server synchron', noConflictMarkers: 'Keine Konfliktmarker', tagExists: 'Tag vorhanden', userConfigured: 'Name/E-Mail gesetzt', fileNotTracked: 'Datei nicht versioniert', commandUsed: 'Befehl verwendet', repoExists: 'Repository vorhanden', upstreamSet: 'Upstream gesetzt', headCommitIsMerge: 'Merge-Commit', ignored: 'Ignoriert (.gitignore)', fileTracked: 'Datei versioniert', fileExists: 'Datei vorhanden', isRevertOf: 'Revert-Commit', anyCommitMsgMatches: 'Commit-Nachricht', stashEmpty: 'Stash leer', branchNotExists: 'Branch gelöscht', fileNotContains: 'Dateiinhalt entfernt', branchContainsMsg: 'Commit enthalten', branchNotContainsMsg: 'Commit nicht enthalten', remoteContainsCommitOf: 'Commit auf dem Server' };
    const label = t => LABELS[t] || t;
    const btnCheck = h('button.btn.small.primary', { onclick: check }, App.icon('test'), 'Prüfen');
    const solBtn = h('button.btn.small.ghost', { hidden: !o.solution || null, onclick: () => { taskEl.appendChild(h('div', h('h4', 'Musterlösung'), App.codeBlock(o.solution.map(c => '$ ' + c).join('\n'), 'bash'))); taskEl.scrollTop = 1e9; } }, App.icon('bulb'), 'Musterlösung');
    const bar = h('div.lab-bar', h('span.title', 'git bash'), h('span.runstate.run', 'MINGW64'), h('span.grow'),
      h('button.btn.small.ghost', { onclick: () => { if (confirm('Übung neu starten? Alle eingegebenen Befehle werden verworfen.')) { history = []; o.onSave && o.onSave({ history }); fresh(); } } }, App.icon('reset'), 'Neu starten'),
      btnCheck, solBtn);
    const taskEl = h('div.lab-task', h('div.md', { html: App.md(ex.task || '') }),
      (ex.hints || []).length ? h('details', h('summary', { style: { cursor: 'pointer', color: 'var(--kupfer)', fontWeight: 600 } }, `Hinweise (${ex.hints.length})`), h('ul', ex.hints.map(t => h('li', { html: App.md(t).replace(/^<p>|<\/p>$/g, '') })))) : null,
      h('details', h('summary', { style: { cursor: 'pointer', color: 'var(--muted)', fontWeight: 600, marginTop: '6px' } }, `Prüfpunkte (${(ex.checks || []).length})`), h('ul', (ex.checks || []).map(c => h('li', label(c.type) + (c.name ? ': ' + c.name : c.branch ? ': ' + c.branch : c.path ? ': ' + c.path : ''))))));
    const left = h('div.lab-left', taskEl, term);
    const right = h('div.lab-right', side, h('div.pnl', { style: { margin: '0 12px 12px' } }, h('div.ph', h('span', 'Prüfergebnis')), h('div.pb', testsBox)));
    testsBox.appendChild(h('p.muted', { style: { margin: 0, fontSize: '13px' } }, o.solved ? 'Bereits gelöst.' : 'Arbeite die Aufgabe im Terminal ab und klicke dann „Prüfen“. Gewertet wird der Endzustand.'));
    const el = h('div.lab', bar, left, right);
    if (history.length) replay(); else fresh();
    setTimeout(() => input.focus(), 50);
    return { el, destroy() { o.onSave && o.onSave({ history }); }, getHistory: () => history.slice() };
  };

  // ---------- Route: freies Labor + Übungsübersicht ----------
  App.route('labor', async (main) => {
    const s = App.state;
    main.appendChild(h('div.page-head', h('div.grow', h('div.eyebrow', 'Code-Labor'), h('h1', 'Üben und ausprobieren'), h('p', 'Alle Programmierübungen deiner freigeschalteten Module – und ein freies Projekt mit 8 Eingängen und 8 Ausgängen zum Experimentieren.'))));
    const rows = [];
    for (const a of App.catalog.areas) for (const m of a.modules) {
      if (!s.unlocked[m.id].ok) continue;
      for (const x of m.exercises) { const es = s.modules[m.id].exs.find(e => e.id === x.id); rows.push({ a, m, x, es }); }
    }
    const open = rows.filter(r => !r.es.solved), done = rows.filter(r => r.es.solved);
    const table = list => h('div.tbl-wrap', h('table.tbl', h('thead', h('tr', h('th', 'Übung'), h('th', 'Modul'), h('th', 'Typ'), h('th', 'Stand'), h('th', ''))),
      h('tbody', list.map(r => h('tr.click', { onclick: () => App.openModule(r.m.id) }, h('td', h('b', r.x.title)), h('td', h('span.muted', r.m.title)), h('td', h('span.tag', r.x.type === 'git' ? 'git' : 'ST')),
        h('td.mono', r.es.solved ? h('span.ok', '✓ ' + r.es.score + ' P.') : r.es.attempts ? `${r.es.best}/${r.es.total}` : '–'), h('td', App.icon('chev')))))));
    main.appendChild(h('div.grid', { style: { gridTemplateColumns: '1fr' } },
      h('section.pnl', h('div.ph', h('span', 'Freies Projekt'), h('span', 'ohne Wertung')), h('div.pb.row.wrap', h('p.grow', { style: { margin: 0 } }, 'Ein leeres B&R-Projekt mit diIn0..7, doOut0..7, einem Analogeingang und einem Analogausgang. Ideal zum Ausprobieren von Timern, Zählern und Zustandsautomaten.'),
        h('button.btn.primary', { onclick: openPlayground }, App.icon('code'), 'Freies Projekt öffnen'))),
      h('section.pnl', h('div.ph', h('span', `Offene Übungen (${open.length})`)), open.length ? table(open) : h('div.pb.muted', 'Keine offenen Übungen in freigeschalteten Modulen.')),
      h('section.pnl', h('div.ph', h('span', `Gelöst (${done.length})`)), done.length ? table(done) : h('div.pb.muted', 'Noch keine gelösten Übungen.'))));
  });
  function openPlayground() {
    const io = [];
    for (let i = 0; i < 8; i++) io.push({ name: 'diIn' + i, type: 'BOOL', dir: 'in', label: 'Eingang ' + i, widget: i < 4 ? 'button' : 'switch' });
    for (let i = 0; i < 8; i++) io.push({ name: 'doOut' + i, type: 'BOOL', dir: 'out', label: 'Ausgang ' + i, widget: 'led' });
    io.push({ name: 'aiValue', type: 'INT', dir: 'in', label: 'Analogeingang (0..32767)', widget: 'slider', min: 0, max: 32767 });
    io.push({ name: 'aoValue', type: 'REAL', dir: 'out', label: 'Analogausgang', widget: 'gauge', min: 0, max: 100 });
    let saved = null; try { saved = JSON.parse(localStorage.getItem('bse-playground') || 'null'); } catch (e) { /* kein Speicher */ }
    const ex = { title: 'Freies Projekt', task: 'Freies Experimentierfeld. Es gibt keine Tests und keine Wertung. Dein Code wird nur in diesem Browser gespeichert.', io, cycleMs: 10, scene: { type: 'lamp', bind: { lamps: ['doOut0', 'doOut1', 'doOut2', 'doOut3'] } },
      files: { main: 'PROGRAM _INIT\n\t\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// Beispiel: Taster 0 schaltet Ausgang 0 mit Selbsthaltung, Taster 1 stoppt\n\tdoOut0 := (diIn0 OR doOut0) AND NOT diIn1;\n\tfbBlink(IN := doOut0 AND NOT fbBlink.Q, PT := T#500ms);\n\tIF fbBlink.Q THEN doOut1 := NOT doOut1; END_IF\n\taoValue := INT_TO_REAL(aiValue) / 327.67;\nEND_PROGRAM\n', var: 'VAR\n\tfbBlink : TON;\nEND_VAR\n', typ: '' } };
    const sheet = h('div.sheet');
    let lab;
    App.openOverlay(sheet, { label: 'Freies Projekt', sticky: true, onClose: () => lab && lab.destroy() });
    sheet.appendChild(h('div.sheet-head', h('span.tag', 'Code-Labor'), h('h2.grow', 'Freies Projekt'), h('button.iconbtn', { onclick: App.toggleFull, 'aria-label': 'Vollbild' }, App.icon('full')), h('button.iconbtn', { onclick: () => App.closeOverlay(), 'aria-label': 'Schließen' }, App.icon('close'))));
    lab = App.stLab({ ex, saved: saved ? { files: saved } : null, onSave: App.debounce(p => { try { localStorage.setItem('bse-playground', JSON.stringify(p.files)); } catch (e) { /* voll */ } }, 800) });
    sheet.appendChild(lab.el);
  }
})();
