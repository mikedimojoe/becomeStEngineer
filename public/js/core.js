/* Kern: API, DOM-Helfer, Router, Toasts, Feedback-Animationen, Sound, Markdown, Syntax-Highlighting */
(function () {
  'use strict';
  const App = window.App = { state: null, user: null, catalog: null, routes: {}, cache: {} };

  // ---------- API ----------
  App.api = async function (method, url, body) {
    const opt = { method, headers: {}, credentials: 'same-origin' };
    if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    const r = await fetch(url, opt);
    let data = null;
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('json')) data = await r.json(); else data = await r.text();
    if (r.status === 401 && !url.startsWith('/api/login') && !url.startsWith('/api/setup')) { App.showLogin(); throw new Error('Bitte anmelden'); }
    if (!r.ok) throw new Error((data && data.error) || ('Fehler ' + r.status));
    return data;
  };
  App.get = url => App.api('GET', url);
  App.post = (url, b) => App.api('POST', url, b || {});

  // ---------- DOM ----------
  // h('div.cls#id', {attr}, ...children)
  const h = App.h = function (sel, attrs, ...kids) {
    const m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(sel) || [];
    const el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, (s, t, v) => { if (t === '.') el.classList.add(v); else el.id = v; });
    if (attrs !== null && attrs !== undefined && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'class') el.className += ' ' + v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = k => { if (k === null || k === undefined || k === false) return; if (Array.isArray(k)) return k.forEach(add); el.appendChild(k instanceof Node ? k : document.createTextNode(String(k))); };
    kids.forEach(add);
    return el;
  };
  App.svg = (markup) => { const t = document.createElement('template'); t.innerHTML = markup.trim(); return t.content.firstChild; };
  App.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.$ = (s, r) => (r || document).querySelector(s);
  App.$$ = (s, r) => [...(r || document).querySelectorAll(s)];
  App.clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  App.fmtDate = s => { if (!s) return ''; const d = new Date(String(s).replace(' ', 'T') + (String(s).includes('Z') || String(s).length <= 10 ? '' : 'Z')); return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); };
  App.fmtTime = s => { if (!s) return ''; const d = new Date(String(s).replace(' ', 'T') + 'Z'); return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  App.fmtMin = m => { m = Math.round(m || 0); if (m < 60) return m + ' min'; return (m / 60).toFixed(1).replace('.', ',') + ' h'; };
  App.fmtN = n => (n == null ? '–' : Number(n).toLocaleString('de-DE'));
  App.areaColor = id => `var(--a-${id})`;
  App.area = id => App.catalog.areas.find(a => a.id === id);
  App.mod = id => { for (const a of App.catalog.areas) { const m = a.modules.find(x => x.id === id); if (m) return m; } return null; };
  App.stageName = s => App.catalog.stages[s - 1];
  App.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  App.copy = async (text, msg) => { try { await navigator.clipboard.writeText(text); } catch (e) { const ta = h('textarea', { style: { position: 'fixed', opacity: 0 } }, text); document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } App.toast(msg || 'Kopiert', 'ok'); };
  App.gradeCell = (g, pts) => h('span.cellg.g' + (g || 0), { title: pts != null ? pts + ' Punkte' : 'noch keine Bewertung' }, g ? String(g) : '–');

  // ---------- Icons (eigene, 16×16, Strichstärke 1.6) ----------
  const I = {
    dash: '<path d="M2 9h3l2-5 3 9 2-4h2"/>', path: '<circle cx="3" cy="8" r="1.8"/><circle cx="13" cy="3" r="1.8"/><circle cx="13" cy="13" r="1.8"/><path d="M4.8 8H8l3.3-4M8 8l3.3 4"/>',
    code: '<path d="M5 4 1.5 8 5 12M11 4l3.5 4-3.5 4M9.5 2.5l-3 11"/>', exam: '<rect x="2.5" y="1.5" width="11" height="13" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h3"/>',
    prog: '<path d="M2 14V8M6 14V4M10 14V9M14 14V2"/>', src: '<path d="M2 2.5h5a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 0 7 12.5H2zM14 2.5H9.5A1.5 1.5 0 0 0 8 4v10a1.5 1.5 0 0 1 1.5-1.5H14z"/>',
    team: '<circle cx="6" cy="5" r="2.4"/><path d="M1.5 14c.5-3 2.3-4.5 4.5-4.5s4 1.5 4.5 4.5M11 2.8a2.3 2.3 0 0 1 0 4.4M12.6 9.6c1.2.6 1.9 2 2.1 4.4"/>',
    user: '<circle cx="8" cy="5" r="3"/><path d="M2.5 14.5c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/>', check: '<path d="M3 8.5 6.5 12 13 4.5"/>', x: '<path d="M4 4l8 8M12 4l-8 8"/>',
    lock: '<rect x="3.5" y="7" width="9" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/>', play: '<path d="M5 3.5v9l7-4.5z"/>', stop: '<rect x="4" y="4" width="8" height="8" rx="1"/>',
    reset: '<path d="M3 8a5 5 0 1 0 1.5-3.5M3 2.5V5h2.5"/>', step: '<path d="M4 3.5v9l6-4.5zM12 3.5v9"/>', test: '<path d="M6 1.5v5L2.5 13a1 1 0 0 0 .9 1.5h9.2a1 1 0 0 0 .9-1.5L10 6.5v-5M5 1.5h6M4.5 10h7"/>',
    arrow: '<path d="M2.5 8h10M8.5 4l4 4-4 4"/>', back: '<path d="M13.5 8h-10M7.5 4l-4 4 4 4"/>', full: '<path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"/>', close: '<path d="M4 4l8 8M12 4l-8 8"/>',
    copy: '<rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/>', ext: '<path d="M9 2.5h4.5V7M13.5 2.5 7 9M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3"/>',
    video: '<rect x="1.5" y="3.5" width="9.5" height="9" rx="1.5"/><path d="m11 6.5 3.5-2v7l-3.5-2"/>', book: '<path d="M3 2h8.5A1.5 1.5 0 0 1 13 3.5V14H4.5A1.5 1.5 0 0 1 3 12.5zM3 12.5A1.5 1.5 0 0 1 4.5 11H13"/>',
    bulb: '<path d="M6 12.5h4M6.5 14.5h3M8 1.5a4.5 4.5 0 0 0-2.7 8.1c.5.4.7.9.7 1.4h4c0-.5.2-1 .7-1.4A4.5 4.5 0 0 0 8 1.5z"/>', flag: '<path d="M3 14.5v-13M3 2h9l-2 3 2 3H3"/>',
    sound: '<path d="M2.5 6v4h2.5l3.5 3V3L5 6zM11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6.3 6.3 0 0 1 0 9"/>', logout: '<path d="M6 2.5H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3M10.5 11l3-3-3-3M13.5 8H6"/>',
    star: '<path d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z"/>', clock: '<circle cx="8" cy="8" r="6.2"/><path d="M8 4.5V8l2.5 1.5"/>', link: '<path d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.8 2.8 0 0 1 4 4L11 8.5M9 11.5l-1.2 1.2a2.8 2.8 0 0 1-4-4L5 7.5"/>',
    plus: '<path d="M8 3v10M3 8h10"/>', down: '<path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/>', edit: '<path d="M10.5 2.5l3 3L6 13H3v-3z"/>', trash: '<path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4"/>', term: '<rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><path d="m4.5 6 2 2-2 2M8 10.5h3.5"/>',
    print: '<path d="M4 6V1.5h8V6M4 11.5H2.5v-5h11v5H12M4 9.5h8v5H4z"/>', chev: '<path d="m6 3.5 4.5 4.5L6 12.5"/>', info: '<circle cx="8" cy="8" r="6.2"/><path d="M8 7.5v4M8 5v.1"/>'
  };
  App.icon = (n, cls) => App.svg(`<svg class="${cls || ''}" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`);

  // ---------- Toasts ----------
  App.toast = function (msg, kind, ms) {
    let box = App.$('.toasts'); if (!box) { box = h('div.toasts', { role: 'status', 'aria-live': 'polite' }); document.body.appendChild(box); }
    const t = h('div.toast' + (kind ? '.' + kind : ''), msg);
    box.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, ms || 3200);
  };
  App.floatKP = function (n, el) {
    if (!n) return;
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0 };
    const f = h('div.floatkp', '+' + n + ' KP');
    f.style.left = (r.left + r.width / 2 - 30) + 'px'; f.style.top = (r.top - 10) + 'px';
    document.body.appendChild(f); setTimeout(() => f.remove(), 1400);
  };

  // ---------- Sound (Web Audio, synthetisch) ----------
  let actx = null;
  const sound = App.sound = {
    enabled() { return !App.user || !App.user.settings || App.user.settings.sound !== false; },
    tone(freq, dur, type, vol, delay) {
      if (!this.enabled()) return;
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        const t0 = actx.currentTime + (delay || 0);
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.06, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
      } catch (e) { /* kein Audio */ }
    },
    click() { this.tone(1200, 0.04, 'square', 0.015); },
    ok() { this.tone(660, 0.09, 'sine', 0.05); this.tone(990, 0.14, 'sine', 0.05, 0.08); },
    fail() { this.tone(220, 0.16, 'triangle', 0.05); },
    level() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'sine', 0.05, i * 0.11)); },
    stage() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.35, i % 2 ? 'triangle' : 'sine', 0.045, i * 0.13)); }
  };

  // ---------- Vollbild-Rückmeldungen in Warteschlange ----------
  const fxQueue = []; let fxBusy = false;
  App.fx = function (o) { fxQueue.push(o); if (!fxBusy) nextFx(); };
  function nextFx() {
    const o = fxQueue.shift(); if (!o) { fxBusy = false; return; }
    fxBusy = true;
    if (o.sound) sound[o.sound] && sound[o.sound]();
    const card = h('div.card', { role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title },
      o.svg ? App.svg(o.svg) : null, h('div.eyebrow', o.eyebrow || ''), h('h2', o.title), o.text ? h('p', o.text) : null);
    const big = card.querySelector('svg'); if (big) big.classList.add('big');
    const ov = h('div.fx', card, h('div.hint', 'Klicken oder Taste drücken'));
    const close = () => { ov.remove(); document.removeEventListener('keydown', close); setTimeout(nextFx, 150); };
    ov.addEventListener('click', close); setTimeout(() => document.addEventListener('keydown', close), 400);
    document.body.appendChild(ov);
    setTimeout(() => { if (document.body.contains(ov)) close(); }, o.ms || 4200);
  }
  // Rückmeldung nach Server-Antwort mit completion
  App.handleCompletion = function (c, beforeState) {
    if (!c || !c.completed) return;
    const m = App.mod(c.module);
    if (c.badge) App.fx({ eyebrow: 'Praxisprojekt abgeschlossen', title: c.badge, text: m.title, svg: App.badges.project(m.area, c.badge), sound: 'level', ms: 5200 });
    else App.fx({ eyebrow: 'Modul abgeschlossen', title: m.title, text: `+${App.catalog.kp.module} KP · ${App.area(m.area).title}`, svg: App.badges.check(m.area), sound: 'ok' });
    if (beforeState) {
      const before = beforeState.areas[c.area] ? beforeState.areas[c.area].niveau : 0;
      if (c.niveau > before) App.fx({ eyebrow: 'Kompetenz erreicht', title: `${App.area(c.area).title} · Niveau ${c.niveau}`, text: 'Alle Module dieses Niveaus abgeschlossen.', svg: App.badges.ring(c.area, c.niveau), sound: 'level' });
    }
  };

  // ---------- Mini-Markdown (sicher: erst escapen) ----------
  App.md = function (src) {
    if (!src) return '';
    const lines = App.esc(src).split('\n');
    let out = '', list = null, inCode = false, code = '';
    const inline = s => s.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    const flush = () => { if (list) { out += list === 'table' ? '</tbody></table>' : `</${list}>`; list = null; } };
    for (const l of lines) {
      if (/^```/.test(l)) { if (inCode) { out += `<pre class="code">${App.hl(code.replace(/\n$/, ''), 'st', true)}</pre>`; code = ''; inCode = false; } else { flush(); inCode = true; } continue; }
      if (inCode) { code += l + '\n'; continue; }
      let m;
      if (/^\s*\|.*\|\s*$/.test(l)) { // Tabelle
        const cells = l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;
        if (list !== 'table') { flush(); out += '<table class="tbl md-tbl"><thead><tr>' + cells.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'; list = 'table'; continue; }
        out += '<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>'; continue;
      }
      if ((m = /^\s*[-*•]\s+(.*)/.exec(l))) { if (list !== 'ul') { flush(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; continue; }
      if ((m = /^\s*\d+[.)]\s+(.*)/.exec(l))) { if (list !== 'ol') { flush(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; continue; }
      flush();
      if ((m = /^(#{1,4})\s+(.*)/.exec(l))) { out += `<h4>${inline(m[2])}</h4>`; continue; }
      if (!l.trim()) continue;
      out += `<p>${inline(l)}</p>`;
    }
    if (inCode) out += `<pre class="code">${App.hl(code, 'st', true)}</pre>`;
    flush();
    return out;
  };

  // ---------- Syntax-Highlighting (ST, bash) ----------
  const ST_KW = new Set('PROGRAM END_PROGRAM FUNCTION END_FUNCTION FUNCTION_BLOCK END_FUNCTION_BLOCK ACTION END_ACTION VAR VAR_INPUT VAR_OUTPUT VAR_IN_OUT VAR_TEMP VAR_GLOBAL END_VAR CONSTANT RETAIN TYPE END_TYPE STRUCT END_STRUCT ARRAY OF IF THEN ELSIF ELSE END_IF CASE END_CASE FOR TO BY DO END_FOR WHILE END_WHILE REPEAT UNTIL END_REPEAT EXIT RETURN CONTINUE AND OR XOR NOT MOD TRUE FALSE'.split(' '));
  const ST_TY = new Set('BOOL SINT INT DINT LINT USINT UINT UDINT ULINT BYTE WORD DWORD LWORD REAL LREAL TIME DATE_AND_TIME DT DATE TOD STRING WSTRING AXIS_REF TON TOF TP R_TRIG F_TRIG CTU CTD CTUD SR RS'.split(' '));
  App.hl = function (src, lang, escaped) {
    const s = escaped ? src.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : String(src);
    if (lang === 'bash' || lang === 'text') {
      return App.esc(s).replace(/^(\$ )?(git|cd|ls|echo|cat)\b/gm, (m0, p, c) => (p || '') + `<span class="hl-kw">${c}</span>`).replace(/(#.*)$/gm, '<span class="hl-cm">$1</span>');
    }
    let out = '', i = 0;
    const n = s.length;
    while (i < n) {
      const c = s[i];
      if (c === '(' && s[i + 1] === '*') { const j = s.indexOf('*)', i + 2); const e = j < 0 ? n : j + 2; out += `<span class="hl-cm">${App.esc(s.slice(i, e))}</span>`; i = e; continue; }
      if (c === '/' && s[i + 1] === '/') { const j = s.indexOf('\n', i); const e = j < 0 ? n : j; out += `<span class="hl-cm">${App.esc(s.slice(i, e))}</span>`; i = e; continue; }
      if (c === "'" || c === '"') { let j = i + 1; while (j < n && s[j] !== c && s[j] !== '\n') j++; out += `<span class="hl-str">${App.esc(s.slice(i, j + 1))}</span>`; i = j + 1; continue; }
      if (/[0-9]/.test(c)) { let j = i; while (j < n && /[0-9A-Fa-f_#.eE]/.test(s[j]) && !(s[j] === '.' && s[j + 1] === '.')) j++; out += `<span class="hl-num">${App.esc(s.slice(i, j))}</span>`; i = j; continue; }
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < n && /[A-Za-z0-9_]/.test(s[j])) j++;
        let w = s.slice(i, j); const U = w.toUpperCase();
        if (s[j] === '#' && /^(T|TIME)$/.test(U)) { let k = j + 1; while (k < n && /[0-9A-Za-z_.]/.test(s[k])) k++; out += `<span class="hl-num">${App.esc(s.slice(i, k))}</span>`; i = k; continue; }
        if (ST_KW.has(U)) out += `<span class="hl-kw">${w}</span>`;
        else if (ST_TY.has(U) || /^Mp|^MC_|^MT/.test(w)) out += `<span class="hl-ty">${w}</span>`;
        else if (s[j] === '(') out += `<span class="hl-fn">${w}</span>`;
        else out += App.esc(w);
        i = j; continue;
      }
      if (':=<>+-*/'.includes(c)) { out += `<span class="hl-op">${App.esc(c)}</span>`; i++; continue; }
      out += App.esc(c); i++;
    }
    return out;
  };
  App.codeBlock = function (text, lang) {
    const pre = h('pre.code', { html: App.hl(text, lang) });
    const b = h('button.iconbtn.copy', { title: 'Kopieren', 'aria-label': 'Code kopieren', onclick: () => App.copy(text, 'Code kopiert') }, App.icon('copy'));
    pre.appendChild(b);
    return pre;
  };

  // ---------- Router ----------
  App.route = (name, fn) => { App.routes[name] = fn; };
  App.go = (hash) => { if (location.hash === hash) App.render(); else location.hash = hash; };
  App.render = async function () {
    const hash = location.hash.replace(/^#\/?/, '') || 'leitstand';
    const [name, ...args] = hash.split('/');
    const fn = App.routes[name] || App.routes.leitstand;
    App.$$('.nav a').forEach(a => a.setAttribute('aria-current', a.dataset.r === name ? 'page' : 'false'));
    const main = App.$('main.view');
    App.clear(main);
    App.currentModule = null;
    try { await fn(main, ...args.map(decodeURIComponent)); }
    catch (e) { console.error(e); main.appendChild(h('div.pnl', h('div.pb', h('b.bad', 'Fehler: '), e.message))); }
    main.focus({ preventScroll: true });
  };
  window.addEventListener('hashchange', () => { App.closeOverlay(true); App.render(); });

  // ---------- Overlay (Modul, Labor) ----------
  App.overlay = null;
  App.openOverlay = function (content, opts) {
    App.closeOverlay(true);
    const full = !!(App.user && App.user.settings && App.user.settings.fullscreen);
    const ov = h('div.overlay' + (full ? '.full' : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': opts && opts.label || 'Detail' });
    ov.appendChild(content);
    ov.addEventListener('mousedown', e => { if (e.target === ov && !(opts && opts.sticky)) App.closeOverlay(); });
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    App.overlay = { el: ov, opts: opts || {} };
    return ov;
  };
  App.closeOverlay = function (silent) {
    if (!App.overlay) return;
    const o = App.overlay; App.overlay = null;
    if (o.opts.onClose) o.opts.onClose();
    o.el.remove(); document.body.style.overflow = '';
    if (!silent && o.opts.after) o.opts.after();
  };
  App.toggleFull = async function () {
    if (!App.overlay) return;
    const full = App.overlay.el.classList.toggle('full');
    App.user.settings.fullscreen = full;
    App.post('/api/settings', { settings: { fullscreen: full } }).catch(() => {});
  };
  document.addEventListener('keydown', e => {
    if (!App.overlay) return;
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName);
    if (e.key === 'Escape' && !typing) { e.preventDefault(); App.closeOverlay(); }
    if ((e.key === 'f' || e.key === 'F') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); App.toggleFull(); }
  });

  // ---------- Zustand neu laden ----------
  App.refresh = async function () {
    const r = await App.get('/api/me');
    const before = App.state;
    App.state = r.state; App.user = r.user;
    App.updateStatus();
    if (before && r.state.stage > before.stage) {
      App.fx({ eyebrow: 'Stufenaufstieg', title: App.stageName(r.state.stage), text: 'Neue Inhalte freigeschaltet. Glückwunsch!', svg: App.badges.stage(r.state.stage, 160), sound: 'stage', ms: 6500 });
    }
    return { before, after: r.state };
  };
  App.updateStatus = function () {
    const s = App.state; if (!s) return;
    const st = App.$('#st-stage'); if (st) st.textContent = s.stageName.toUpperCase();
    const k = App.$('#st-kp'); if (k) k.textContent = App.fmtN(s.kp);
    const next = s.stage < 7 ? s.stageReq[s.stage + 1].kp : s.kp;
    const kt = App.$('#st-kpt'); if (kt) kt.textContent = '/' + App.fmtN(next);
    const bar = App.$('#st-bar'); if (bar) bar.style.width = Math.min(100, 100 * s.kp / Math.max(1, next)) + '%';
  };

  // ---------- Aktive Lernzeit (Heartbeat) ----------
  let active = 0, lastAct = Date.now();
  ['mousemove', 'keydown', 'scroll', 'click'].forEach(ev => document.addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - lastAct < 120000 && App.user) active += 15;
    if (active >= 60) { const s = active; active = 0; App.post('/api/heartbeat', { seconds: s, module: App.currentModule || null }).catch(() => {}); }
  }, 15000);
})();
