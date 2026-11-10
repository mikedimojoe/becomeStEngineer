/* Code-Editor: Textarea mit Syntax-Overlay, Zeilennummern, Einrückung, Fehlerzeile */
(function () {
  'use strict';
  const App = window.App, h = App.h;

  App.Editor = function (opts) {
    const gut = h('div.gut', { 'aria-hidden': 'true' });
    const pre = h('pre', { 'aria-hidden': 'true' });
    const ta = h('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': opts.label || 'Code-Editor', wrap: 'off' });
    const el = h('div.editor', gut, pre, ta);
    let errLine = null, readOnly = false;
    const ed = { el, ta, onChange: null, onRun: null, onCheck: null };
    function paint() {
      const v = ta.value;
      let html = App.hl(v + (v.endsWith('\n') ? ' ' : ''), opts.lang || 'st');
      if (errLine) {
        const lines = html.split('\n');
        if (lines[errLine - 1] !== undefined) lines[errLine - 1] = `<span class="errline">${lines[errLine - 1] || ' '}</span>`;
        html = lines.join('\n');
      }
      pre.innerHTML = html + '\n';
      const n = v.split('\n').length;
      let g = '';
      for (let i = 1; i <= n; i++) g += `<div${i === errLine ? ' class="err"' : ''}>${i}</div>`;
      gut.innerHTML = g;
      sync();
    }
    function sync() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gut.scrollTop = ta.scrollTop; }
    ta.addEventListener('scroll', sync);
    ta.addEventListener('input', () => { errLine = null; paint(); ed.onChange && ed.onChange(ta.value); });
    ta.addEventListener('keydown', e => {
      if (readOnly) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
        if (s !== en && v.slice(s, en).includes('\n')) { // Block einrücken
          const ls = v.lastIndexOf('\n', s - 1) + 1;
          const block = v.slice(ls, en);
          const nb = e.shiftKey ? block.replace(/^(\t| {1,4})/gm, '') : block.replace(/^/gm, '\t');
          ta.value = v.slice(0, ls) + nb + v.slice(en);
          ta.selectionStart = ls; ta.selectionEnd = ls + nb.length;
        } else if (!e.shiftKey) { ta.setRangeText('\t', s, en, 'end'); }
        ta.dispatchEvent(new Event('input'));
      } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const s = ta.selectionStart, v = ta.value;
        const ls = v.lastIndexOf('\n', s - 1) + 1;
        const line = v.slice(ls, s);
        let ind = (/^[\t ]*/.exec(line) || [''])[0];
        if (/\b(THEN|DO|ELSE|OF|REPEAT|STRUCT|VAR|VAR_INPUT|VAR_OUTPUT|VAR_IN_OUT|TYPE)\s*$/i.test(line) || /^\s*PROGRAM\b/i.test(line) || /:\s*$/.test(line)) ind += '\t';
        ta.setRangeText('\n' + ind, s, ta.selectionEnd, 'end');
        ta.dispatchEvent(new Event('input'));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); ed.onCheck && ed.onCheck(); }
      else if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r' && e.shiftKey)) { e.preventDefault(); ed.onRun && ed.onRun(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); ed.onSave && ed.onSave(); }
      else if ((e.ctrlKey || e.metaKey) && e.key === '/') { // Zeile auskommentieren
        e.preventDefault();
        const s = ta.selectionStart, v = ta.value, ls = v.lastIndexOf('\n', s - 1) + 1; let le = v.indexOf('\n', s); if (le < 0) le = v.length;
        const line = v.slice(ls, le);
        const nl = /^\s*\/\//.test(line) ? line.replace(/^(\s*)\/\/ ?/, '$1') : line.replace(/^(\s*)/, '$1// ');
        ta.setRangeText(nl, ls, le, 'end'); ta.dispatchEvent(new Event('input'));
      }
    });
    ed.set = v => { ta.value = v || ''; errLine = null; paint(); };
    ed.get = () => ta.value;
    ed.setError = line => { errLine = line || null; paint(); if (line) { ta.scrollTop = Math.max(0, (line - 5) * 20); sync(); } };
    ed.gotoLine = line => {
      const v = ta.value; let pos = 0;
      for (let i = 1; i < line; i++) { const k = v.indexOf('\n', pos); if (k < 0) break; pos = k + 1; }
      ta.focus(); ta.selectionStart = ta.selectionEnd = pos; ta.scrollTop = Math.max(0, (line - 5) * 20); sync();
    };
    ed.setReadOnly = ro => { readOnly = ro; ta.readOnly = ro; };
    ed.focus = () => ta.focus();
    paint();
    return ed;
  };
})();
