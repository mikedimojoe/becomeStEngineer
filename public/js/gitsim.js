/* Git-Simulator für Übungen (git bash) – deterministisch, läuft im Browser (window.GITSIM) und in Node. */
(function (root, factory) {
  const G = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = G; else root.GITSIM = G;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  // ---------- Hilfsfunktionen ----------
  function hash(str) {
    let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995, out = '';
    for (let r = 0; r < 5; r++) {
      for (let i = 0; i < str.length; i++) { h1 = Math.imul(h1 ^ str.charCodeAt(i), 16777619) >>> 0; h2 = Math.imul(h2 + str.charCodeAt(i) + r, 2246822507) >>> 0; }
      out += ((h1 ^ h2 ^ Math.imul(r + 1, 2654435761)) >>> 0).toString(16).padStart(8, '0');
      h1 = (h1 + 0x9e3779b9) >>> 0;
    }
    return out.slice(0, 40);
  }
  const clone = o => JSON.parse(JSON.stringify(o));
  const short = h => h ? h.slice(0, 7) : '';
  const lines = s => (s === '' ? [] : s.replace(/\r/g, '').split('\n'));
  const eqTree = (a, b) => { const ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length) return false; return ka.every(k => a[k] === b[k]); };

  function tokenize(cmd) {
    const out = []; let cur = '', q = null, has = false;
    for (let i = 0; i < cmd.length; i++) {
      const c = cmd[i];
      if (q) { if (c === q) q = null; else if (c === '\\' && q === '"' && i + 1 < cmd.length && '"\\$'.includes(cmd[i + 1])) cur += cmd[++i]; else cur += c; continue; }
      if (c === '"' || c === "'") { q = c; has = true; continue; }
      if (c === ' ' || c === '\t') { if (cur || has) { out.push(cur); cur = ''; has = false; } continue; }
      if (c === '>' ) { if (cur || has) { out.push(cur); cur = ''; has = false; } if (cmd[i + 1] === '>') { out.push('>>'); i++; } else out.push('>'); continue; }
      cur += c;
    }
    if (q) throw new Error('Anführungszeichen nicht geschlossen');
    if (cur || has) out.push(cur);
    return out;
  }

  // ---------- Repository-Modell ----------
  function newRepo() { return { commits: {}, branches: {}, tags: {}, HEAD: { branch: 'main' }, index: {}, work: {}, merging: null, stash: [], upstream: {}, remoteRefs: {}, remoteTags: {} }; }
  function newRemote() { return { commits: {}, branches: {}, tags: {} }; }

  function makeCommit(st, repo, parents, msg, files, author, extra) {
    st.clock++;
    const body = JSON.stringify([parents, msg, files, author, st.clock]);
    const h = hash(body);
    repo.commits[h] = Object.assign({ hash: h, parents, msg, files: clone(files), author: author || 'Lernende*r <lernen@breitner.de>', time: st.clock }, extra || {});
    return h;
  }
  function headHash(repo) { return repo.HEAD.branch ? repo.branches[repo.HEAD.branch] || null : repo.HEAD.detached; }
  function headTree(repo) { const h = headHash(repo); return h ? repo.commits[h].files : {}; }
  function resolve(st, repo, ref) {
    if (!ref) return null;
    let m = /^(.*?)(~(\d*)|\^+)$/.exec(ref);
    if (m) {
      let h = resolve(st, repo, m[1] || 'HEAD');
      let n = m[2].startsWith('~') ? (m[3] === '' ? 1 : +m[3]) : m[2].length;
      while (h && n-- > 0) h = (repo.commits[h].parents || [])[0] || null;
      return h;
    }
    if (ref === 'HEAD' || ref === '@') return headHash(repo);
    if (repo.branches[ref] !== undefined) return repo.branches[ref];
    if (repo.tags[ref]) return repo.tags[ref];
    const rr = ref.replace(/^remotes\//, '');
    if (repo.remoteRefs[rr]) return repo.remoteRefs[rr];
    if (/^[0-9a-f]{4,40}$/.test(ref)) {
      const hits = Object.keys(repo.commits).filter(h => h.startsWith(ref));
      if (hits.length === 1) return hits[0];
    }
    return null;
  }
  function ancestors(repo, h) {
    const seen = new Set(); const stack = h ? [h] : [];
    while (stack.length) { const x = stack.pop(); if (seen.has(x) || !repo.commits[x]) continue; seen.add(x); stack.push(...repo.commits[x].parents); }
    return seen;
  }
  function isAncestor(repo, a, b) { return !!a && ancestors(repo, b).has(a); }
  function mergeBase(repo, a, b) {
    const A = ancestors(repo, a);
    const queue = [b]; const seen = new Set();
    // Breitensuche von b aus, erster gemeinsamer Vorfahr mit größtem Zeitstempel
    let best = null;
    while (queue.length) {
      const x = queue.shift(); if (!x || seen.has(x)) continue; seen.add(x);
      if (A.has(x)) { if (!best || repo.commits[x].time > repo.commits[best].time) best = x; continue; }
      queue.push(...repo.commits[x].parents);
    }
    return best;
  }

  // ---------- .gitignore ----------
  function ignoreRules(work) {
    const txt = work['.gitignore'] || '';
    return lines(txt).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  }
  function globToRe(g) { return new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\u0000/g, '.*') + '$'); }
  function isIgnored(work, path) {
    const rules = ignoreRules(work);
    let ign = false;
    for (let r of rules) {
      let neg = false; if (r.startsWith('!')) { neg = true; r = r.slice(1); }
      let hit;
      const anchored = r.startsWith('/'); if (anchored) r = r.slice(1);
      if (r.endsWith('/')) { const d = r.slice(0, -1); const re = globToRe(d); const parts = path.split('/').slice(0, -1); hit = anchored ? re.test(parts[0] || '') : parts.some((p, i) => re.test(p) || re.test(parts.slice(0, i + 1).join('/'))); }
      else if (r.includes('/')) hit = globToRe(r).test(path) || path.startsWith(r + '/');
      else { const re = globToRe(r); hit = path.split('/').some(p => re.test(p)); }
      if (hit) ign = !neg;
    }
    return ign;
  }

  // ---------- Diff / Merge ----------
  function lcsTable(a, b) {
    const n = a.length, m = b.length;
    const t = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
    return t;
  }
  function diffOps(a, b) { // [{op:' '|'-'|'+', line}]
    if (a.length * b.length > 4e6) return [...a.map(l => ({ op: '-', line: l })), ...b.map(l => ({ op: '+', line: l }))];
    const t = lcsTable(a, b); const ops = []; let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { ops.push({ op: ' ', line: a[i] }); i++; j++; }
      else if (t[i + 1][j] >= t[i][j + 1]) ops.push({ op: '-', line: a[i++] });
      else ops.push({ op: '+', line: b[j++] });
    }
    while (i < a.length) ops.push({ op: '-', line: a[i++] });
    while (j < b.length) ops.push({ op: '+', line: b[j++] });
    return ops;
  }
  function hunks(base, side) { // Liste {s, e, lines} : base[s..e) wird ersetzt
    const ops = diffOps(base, side); const out = []; let bi = 0; let cur = null;
    for (const o of ops) {
      if (o.op === ' ') { if (cur) { out.push(cur); cur = null; } bi++; continue; }
      if (!cur) cur = { s: bi, e: bi, lines: [] };
      if (o.op === '-') { bi++; cur.e = bi; } else cur.lines.push(o.line);
    }
    if (cur) out.push(cur);
    return out;
  }
  function merge3(baseS, oursS, theirsS, oursName, theirsName) {
    if (oursS === theirsS) return { text: oursS, conflict: false };
    if (baseS === oursS) return { text: theirsS, conflict: false };
    if (baseS === theirsS) return { text: oursS, conflict: false };
    const base = lines(baseS || ''), ours = lines(oursS || ''), theirs = lines(theirsS || '');
    const ho = hunks(base, ours).map(h => Object.assign(h, { side: 'o' }));
    const ht = hunks(base, theirs).map(h => Object.assign(h, { side: 't' }));
    const all = [...ho, ...ht].sort((x, y) => x.s - y.s || x.e - y.e);
    const out = []; let pos = 0; let conflict = false; let k = 0;
    while (k < all.length) {
      let grp = [all[k]]; let s = all[k].s, e = all[k].e; k++;
      while (k < all.length && (all[k].s < e || (all[k].s === e && (all[k].e === e || all[k].s === s)) )) { grp.push(all[k]); e = Math.max(e, all[k].e); k++; }
      for (let i = pos; i < s; i++) out.push(base[i]);
      const os = grp.filter(g => g.side === 'o'), ts = grp.filter(g => g.side === 't');
      const build = (hs) => { const res = []; let p = s; for (const h of hs) { for (let i = p; i < h.s; i++) res.push(base[i]); res.push(...h.lines); p = h.e; } for (let i = p; i < e; i++) res.push(base[i]); return res; };
      if (!os.length) out.push(...build(ts));
      else if (!ts.length) out.push(...build(os));
      else {
        const a = build(os), b = build(ts);
        if (a.join('\n') === b.join('\n')) out.push(...a);
        else { conflict = true; out.push('<<<<<<< ' + oursName, ...a, '=======', ...b, '>>>>>>> ' + theirsName); }
      }
      pos = e;
    }
    for (let i = pos; i < base.length; i++) out.push(base[i]);
    const endNl = (oursS || '').endsWith('\n') || (theirsS || '').endsWith('\n');
    return { text: out.join('\n') + (endNl && out.length && !out.join('\n').endsWith('\n') ? '' : ''), conflict };
  }
  function unifiedDiff(path, a, b) {
    if (a === b) return '';
    const ops = diffOps(lines(a || ''), lines(b || ''));
    let s = `diff --git a/${path} b/${path}\n`;
    if (a === undefined) s += 'new file mode 100644\n';
    if (b === undefined) s += 'deleted file mode 100644\n';
    s += `--- ${a === undefined ? '/dev/null' : 'a/' + path}\n+++ ${b === undefined ? '/dev/null' : 'b/' + path}\n`;
    // vereinfachte Hunks mit 2 Zeilen Kontext
    const keep = ops.map((o, i) => o.op !== ' ' || ops.slice(Math.max(0, i - 2), i + 3).some(x => x.op !== ' '));
    let inH = false;
    ops.forEach((o, i) => {
      if (!keep[i]) { inH = false; return; }
      if (!inH) { s += '@@\n'; inH = true; }
      s += (o.op === ' ' ? ' ' : o.op) + o.line + '\n';
    });
    return s;
  }

  // ---------- Zustand ----------
  function setup(ex) {
    const S = ex.setup || {};
    const st = { clock: 0, cwd: '/c/Projekte', home: '/c/Projekte', user: null, repoDir: null, repo: null, remote: newRemote(), remoteUrl: S.remote || 'https://git.breitner.de/ausbildung/projekt.git', remoteName: 'origin', history: [], cloned: false, pendingRemote: null, fs: {} };
    if (S.user !== false) st.user = { name: 'Lernende Person', email: 'lernen@breitner.de' };
    // Remote aufbauen
    const R = st.remote;
    const tmp = { commits: R.commits };
    const author = 'Ausbilder <ausbildung@breitner.de>';
    const c0 = makeCommit(st, tmp, [], S.initialMsg || 'Initialer Stand', S.files || { 'README.md': '# Projekt\n' }, author, { setup: true });
    let tipMain = c0; let tree = clone(S.files || { 'README.md': '# Projekt\n' });
    for (const c of S.commits || []) { tree = applyFiles(tree, c.files); tipMain = makeCommit(st, tmp, [tipMain], c.msg, tree, c.author || author, { setup: true }); }
    R.branches.main = tipMain;
    for (const [b, list] of Object.entries(S.branches || {})) {
      let tip = tipMain, t = clone(tree);
      for (const c of list) { t = applyFiles(t, c.files); tip = makeCommit(st, tmp, [tip], c.msg, t, c.author || author, { setup: true }); }
      R.branches[b] = tip;
    }
    for (const [t, ref] of Object.entries(S.tags || {})) R.tags[t] = R.branches[ref] || tipMain;
    const repoName = (st.remoteUrl.split('/').pop() || 'projekt').replace(/\.git$/, '');
    st.repoName = repoName;
    if (S.cloned !== false) { doClone(st, st.remoteUrl, repoName, true); st.cwd = st.repoDir; }
    if (S.remoteCommits && S.remoteCommits.length) {
      if (S.cloned !== false) applyRemoteCommits(st, S.remoteCommits); else st.pendingRemote = S.remoteCommits;
    }
    if (S.workFiles && st.repo) for (const [p, c] of Object.entries(S.workFiles)) { if (c === null) delete st.repo.work[p]; else st.repo.work[p] = c; }
    st.history = [];
    return st;
  }
  function applyFiles(tree, files) { const t = clone(tree); for (const [p, c] of Object.entries(files || {})) { if (c === null) delete t[p]; else t[p] = c; } return t; }
  function applyRemoteCommits(st, list) {
    const R = st.remote;
    for (const c of list) {
      const b = c.branch || 'main';
      const parent = R.branches[b] || R.branches.main;
      const tree = applyFiles(parent ? R.commits[parent].files : {}, c.files);
      R.branches[b] = makeCommit(st, { commits: R.commits }, parent ? [parent] : [], c.msg, tree, (c.author || 'Kollege') + ' <kollege@breitner.de>', { setup: true });
    }
  }
  function doClone(st, url, dir, silent) {
    const repo = newRepo();
    Object.assign(repo.commits, clone(st.remote.commits));
    for (const [b, h] of Object.entries(st.remote.branches)) repo.remoteRefs['origin/' + b] = h;
    repo.remoteTags = clone(st.remote.tags);
    Object.assign(repo.tags, clone(st.remote.tags));
    repo.branches.main = st.remote.branches.main;
    repo.upstream.main = 'origin/main';
    repo.HEAD = { branch: 'main' };
    repo.index = clone(repo.commits[repo.branches.main].files);
    repo.work = clone(repo.index);
    repo.remotes = { origin: url };
    st.repo = repo; st.repoDir = st.home + '/' + dir; st.cloned = true;
    if (!silent && st.pendingRemote) { applyRemoteCommits(st, st.pendingRemote); st.pendingRemote = null; }
  }

  // ---------- Status ----------
  function status(repo) {
    const head = headTree(repo);
    const staged = [], unstaged = [], untracked = [];
    const keys = new Set([...Object.keys(head), ...Object.keys(repo.index)]);
    for (const k of [...keys].sort()) {
      if (!(k in head)) staged.push(['new file', k]);
      else if (!(k in repo.index)) staged.push(['deleted', k]);
      else if (head[k] !== repo.index[k]) staged.push(['modified', k]);
    }
    for (const k of Object.keys(repo.index).sort()) {
      if (!(k in repo.work)) unstaged.push(['deleted', k]);
      else if (repo.work[k] !== repo.index[k]) unstaged.push(['modified', k]);
    }
    for (const k of Object.keys(repo.work).sort()) if (!(k in repo.index) && !isIgnored(repo.work, k)) untracked.push(k);
    return { staged, unstaged, untracked };
  }
  const conflictText = s => /^(<<<<<<<|>>>>>>>)( |$)/m.test(s || '');

  // ---------- Befehle ----------
  function relPath(st, p) {
    if (!st.repo || !st.cwd.startsWith(st.repoDir)) return p;
    const sub = st.cwd.slice(st.repoDir.length).replace(/^\//, '');
    const full = (sub ? sub + '/' : '') + p;
    const parts = [];
    for (const x of full.split('/')) { if (x === '..') parts.pop(); else if (x && x !== '.') parts.push(x); }
    return parts.join('/');
  }
  function inRepo(st) { return st.repo && st.cwd.startsWith(st.repoDir); }
  function needRepo(st) { if (!inRepo(st)) throw new GitErr('fatal: not a git repository (or any of the parent directories): .git\n(Hinweis: Wechsle mit "cd ' + (st.repoDir ? st.repoDir.split('/').pop() : '<ordner>') + '" in das Repository.)'); }
  class GitErr extends Error {}

  function exec(st, raw) {
    if (raw && typeof raw === 'object' && raw.write) { // Editor-Speichern
      needRepo(st); st.history.push(raw); st.repo.work[relPath(st, raw.write)] = raw.content; return '';
    }
    const cmd = String(raw || '').trim();
    if (!cmd) return '';
    st.history.push(cmd);
    try { return run(st, cmd); } catch (e) { if (e instanceof GitErr) return e.message; if (/Anführungszeichen/.test(e.message)) return 'bash: ' + e.message; throw e; }
  }

  function run(st, cmd) {
    // mehrere Befehle mit && / ;
    if (/&&|;/.test(cmd.replace(/"[^"]*"|'[^']*'/g, ''))) {
      const parts = []; let cur = '', q = null;
      for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (q) { cur += c; if (c === q) q = null; continue; }
        if (c === '"' || c === "'") { q = c; cur += c; continue; }
        if (c === ';') { parts.push(cur); cur = ''; continue; }
        if (c === '&' && cmd[i + 1] === '&') { parts.push(cur); cur = ''; i++; continue; }
        cur += c;
      }
      parts.push(cur);
      return parts.map(p => p.trim()).filter(Boolean).map(p => run(st, p)).filter(Boolean).join('\n');
    }
    const t = tokenize(cmd);
    const c0 = t[0];
    // Umleitung echo "x" > datei
    const redir = t.findIndex(x => x === '>' || x === '>>');
    if (redir > 0) {
      const target = t[redir + 1];
      if (!target) throw new GitErr('bash: Syntaxfehler: Ziel der Umleitung fehlt');
      let text;
      if (c0 === 'echo') { const args = t.slice(1, redir); const noNl = args[0] === '-n'; const e = args[0] === '-e'; text = args.filter(a => a !== '-n' && a !== '-e').join(' '); if (e) text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t'); if (!noNl) text += '\n'; }
      else if (c0 === 'printf') { text = t.slice(1, redir).join(' ').replace(/\\n/g, '\n').replace(/\\t/g, '\t'); }
      else if (c0 === 'cat') { const src = files(st)[relPath(st, t[1])]; if (src === undefined) throw new GitErr(`cat: ${t[1]}: No such file or directory`); text = src; }
      else throw new GitErr(`bash: Umleitung nur mit echo/printf/cat im Simulator`);
      const fs = files(st); const p = relPath(st, target);
      fs[p] = t[redir] === '>>' ? (fs[p] || '') + text : text;
      return '';
    }
    switch (c0) {
      case 'git': return git(st, t.slice(1));
      case 'pwd': return st.cwd;
      case 'cd': {
        const d = t[1] || st.home;
        if (d === '~' || d === st.home) { st.cwd = st.home; return ''; }
        if (d === '..') { if (st.cwd !== '/c' ) st.cwd = st.cwd.split('/').slice(0, -1).join('/') || '/'; return ''; }
        if (st.repoDir && (d === st.repoDir.split('/').pop() || d === st.repoDir || d === './' + st.repoDir.split('/').pop()) && st.cwd === st.home) { st.cwd = st.repoDir; return ''; }
        if (inRepo(st)) {
          const p = relPath(st, d);
          if (Object.keys(st.repo.work).some(f => f.startsWith(p + '/'))) { st.cwd = st.repoDir + '/' + p; return ''; }
        }
        throw new GitErr(`bash: cd: ${d}: No such file or directory`);
      }
      case 'ls': {
        const all = t.includes('-a') || t.includes('-la') || t.includes('-al');
        if (!inRepo(st)) { if (st.cwd === st.home && st.repoDir) return st.repoDir.split('/').pop() + '/'; return ''; }
        const sub = st.cwd.slice(st.repoDir.length).replace(/^\//, '');
        const pre = sub ? sub + '/' : '';
        const target = t.slice(1).find(x => !x.startsWith('-'));
        const base = target ? relPath(st, target) + '/' : pre;
        const names = new Set();
        for (const f of Object.keys(st.repo.work)) if (f.startsWith(base === '/' ? '' : base)) { const rest = f.slice(base === '/' ? 0 : base.length); const n = rest.split('/')[0]; names.add(rest.includes('/') ? n + '/' : n); }
        if (all && !sub) names.add('.git/');
        return [...names].filter(n => all || !n.startsWith('.')).sort().join('  ');
      }
      case 'cat': {
        if (!t[1]) throw new GitErr('cat: Datei fehlt');
        const v = files(st)[relPath(st, t[1])];
        if (v === undefined) throw new GitErr(`cat: ${t[1]}: No such file or directory`);
        return v.replace(/\n$/, '');
      }
      case 'echo': return t.slice(1).join(' ');
      case 'touch': { const fs = files(st); for (const f of t.slice(1)) { const p = relPath(st, f); if (fs[p] === undefined) fs[p] = ''; } return ''; }
      case 'mkdir': return '';
      case 'rm': {
        const fs = files(st); const rec = t.includes('-r') || t.includes('-rf');
        for (const f of t.slice(1).filter(x => !x.startsWith('-'))) {
          const p = relPath(st, f);
          if (fs[p] !== undefined) delete fs[p];
          else if (rec) Object.keys(fs).filter(k => k.startsWith(p + '/')).forEach(k => delete fs[k]);
          else throw new GitErr(`rm: cannot remove '${f}': No such file or directory`);
        }
        return '';
      }
      case 'mv': { const fs = files(st); const a = relPath(st, t[1]), b = relPath(st, t[2]); if (fs[a] === undefined) throw new GitErr(`mv: cannot stat '${t[1]}'`); fs[b] = fs[a]; delete fs[a]; return ''; }
      case 'clear': return '\u001bclear';
      case 'edit': case 'nano': case 'notepad': case 'code': case 'vim': case 'vi':
        if (!t[1]) throw new GitErr(`${c0}: Datei fehlt`);
        needRepo(st);
        return '\u001bedit ' + relPath(st, t[1]);
      case 'help': return HELP;
      case 'history': return st.history.map((h, i) => `${String(i + 1).padStart(4)}  ${typeof h === 'string' ? h : 'edit ' + h.write}`).join('\n');
      default: throw new GitErr(`bash: ${c0}: command not found${c0 && c0.startsWith('Git') ? ' (Tipp: Befehle klein schreiben: git …)' : ''}`);
    }
  }
  function files(st) { needRepo(st); return st.repo.work; }

  const HELP = `Verfügbar im Simulator:
  git init | clone <url> | status | add | commit | log | branch | checkout | switch | merge | diff
  git restore | reset | revert | tag | push | pull | fetch | remote | stash | config | rm | mv | show
  ls, cat <datei>, echo "text" > datei, echo "text" >> datei, edit <datei>, cd, pwd, touch, rm, mv, clear`;

  function git(st, a) {
    const sub = a[0];
    const flags = new Set(a.filter(x => x.startsWith('-')));
    const args = a.slice(1).filter(x => !x.startsWith('-'));
    const optVal = (...names) => { for (const n of names) { const i = a.indexOf(n); if (i >= 0) return a[i + 1]; const eq = a.find(x => x.startsWith(n + '=')); if (eq) return eq.slice(n.length + 1); } return undefined; };
    const R = st.repo;
    switch (sub) {
      case undefined: case 'help': case '--help': return 'usage: git <command> [<args>]\n' + HELP;
      case '--version': case 'version': return 'git version 2.47.0.windows.1';
      case 'config': {
        if (flags.has('--list') || flags.has('-l')) return st.user ? `user.name=${st.user.name}\nuser.email=${st.user.email}` : '';
        const key = args[0];
        const val = a.slice(a.indexOf(key) + 1).filter(x => !x.startsWith('--')).join(' ');
        if (!key) throw new GitErr('usage: git config [--global] <name> <value>');
        if (key === 'user.name' || key === 'user.email') {
          if (!val) return st.user ? st.user[key.split('.')[1]] || '' : '';
          st.user = st.user || { name: '', email: '' };
          st.user[key.split('.')[1]] = val; return '';
        }
        return '';
      }
      case 'init': {
        if (st.repo && inRepo(st)) return `Reinitialized existing Git repository in ${st.repoDir}/.git/`;
        const repo = newRepo(); repo.remotes = {};
        st.repo = repo; st.repoDir = st.cwd; st.cloned = false;
        return `Initialized empty Git repository in ${st.cwd}/.git/`;
      }
      case 'clone': {
        const url = args[0];
        if (!url) throw new GitErr('fatal: You must specify a repository to clone.');
        if (url.replace(/\/$/, '') !== st.remoteUrl) {
          if (/git\.breitner\.de/.test(url)) throw new GitErr(`remote: Repository not found.\nfatal: repository '${url}' not found\n(Hinweis: Die URL der Aufgabe lautet ${st.remoteUrl})`);
          throw new GitErr(`fatal: unable to access '${url}': Could not resolve host (im Simulator ist nur ${st.remoteUrl} erreichbar)`);
        }
        if (st.cloned && st.repoDir) throw new GitErr(`fatal: destination path '${st.repoDir.split('/').pop()}' already exists and is not an empty directory.`);
        const dir = args[1] || st.repoName;
        doClone(st, url, dir);
        return `Cloning into '${dir}'...\nremote: Enumerating objects: ${Object.keys(st.repo.commits).length * 3}, done.\nReceiving objects: 100%, done.`;
      }
      case 'remote': {
        needRepo(st);
        if (args[0] === 'add') { if (!args[1] || !args[2]) throw new GitErr('usage: git remote add <name> <url>'); R.remotes[args[1]] = args[2]; if (args[2] === st.remoteUrl) st.remoteName = args[1]; return ''; }
        if (args[0] === 'set-url') { R.remotes[args[1]] = args[2]; return ''; }
        if (args[0] === 'remove' || args[0] === 'rm') { delete R.remotes[args[1]]; return ''; }
        if (flags.has('-v')) return Object.entries(R.remotes || {}).map(([n, u]) => `${n}\t${u} (fetch)\n${n}\t${u} (push)`).join('\n');
        return Object.keys(R.remotes || {}).join('\n');
      }
      case 'status': {
        needRepo(st);
        const s = status(R);
        let out = R.HEAD.branch ? `On branch ${R.HEAD.branch}` : `HEAD detached at ${short(R.HEAD.detached)}`;
        const up = R.HEAD.branch && R.upstream[R.HEAD.branch];
        if (up && R.remoteRefs[up] !== undefined) {
          const lh = R.branches[R.HEAD.branch], rh = R.remoteRefs[up];
          const ahead = [...ancestors(R, lh)].filter(x => !ancestors(R, rh).has(x)).length;
          const behind = [...ancestors(R, rh)].filter(x => !ancestors(R, lh).has(x)).length;
          if (!ahead && !behind) out += `\nYour branch is up to date with '${up}'.`;
          else if (ahead && !behind) out += `\nYour branch is ahead of '${up}' by ${ahead} commit${ahead > 1 ? 's' : ''}.\n  (use "git push" to publish your local commits)`;
          else if (!ahead && behind) out += `\nYour branch is behind '${up}' by ${behind} commit${behind > 1 ? 's' : ''}, and can be fast-forwarded.\n  (use "git pull" to update your local branch)`;
          else out += `\nYour branch and '${up}' have diverged.`;
        }
        if (!headHash(R)) out += '\n\nNo commits yet';
        if (R.merging) {
          const unmerged = Object.keys(R.work).filter(k => conflictText(R.work[k]) && R.merging.conflicts.includes(k) && R.index[k] !== R.work[k]);
          out += unmerged.length ? '\nYou have unmerged paths.\n  (fix conflicts and run "git commit")\n  (use "git merge --abort" to abort the merge)\n\nUnmerged paths:\n' + unmerged.map(k => `\tboth modified:   ${k}`).join('\n') : '\nAll conflicts fixed but you are still merging.\n  (use "git commit" to conclude merge)';
        }
        if (s.staged.length) out += '\n\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)\n' + s.staged.map(([k, f]) => `\t${(k + ':').padEnd(12)}${f}`).join('\n');
        const uns = s.unstaged.filter(([, f]) => !(R.merging && R.merging.conflicts.includes(f) && conflictText(R.work[f]) && R.index[f] !== R.work[f]));
        if (uns.length) out += '\n\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n' + uns.map(([k, f]) => `\t${(k + ':').padEnd(12)}${f}`).join('\n');
        if (s.untracked.length) out += '\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n' + s.untracked.map(f => '\t' + f).join('\n');
        if (!s.staged.length && !s.unstaged.length && !s.untracked.length && !R.merging) out += '\n\nnothing to commit, working tree clean';
        else if (!s.staged.length && !R.merging) out += '\n\nno changes added to commit (use "git add" and/or "git commit -a")';
        return out;
      }
      case 'add': {
        needRepo(st);
        const all = flags.has('-A') || flags.has('--all') || args.includes('.') || flags.has('-u');
        const targets = args.length ? args : (all ? ['.'] : []);
        if (!targets.length) return 'Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?';
        const out = [];
        for (const tg of targets) {
          const p = tg === '.' || tg === '*' ? relPath(st, '.') : relPath(st, tg);
          const isAll = tg === '.' || tg === '*';
          const keys = new Set([...Object.keys(R.work), ...Object.keys(R.index)]);
          let matched = 0;
          for (const k of keys) {
            const hit = isAll ? (p === '' || k.startsWith(p + '/') || k === p) : (k === p || k.startsWith(p + '/') || (/[*?]/.test(p) && globToRe(p).test(k)));
            if (!hit) continue;
            if (flags.has('-u') && !(k in R.index)) continue;
            if (!(k in R.work)) { delete R.index[k]; matched++; continue; }
            if (isIgnored(R.work, k) && !(k in R.index)) { if (!isAll && k === p) out.push(`The following paths are ignored by one of your .gitignore files:\n${k}\nhint: Use -f if you really want to add them.`); continue; }
            R.index[k] = R.work[k]; matched++;
          }
          if (!matched && !isAll && !out.length) throw new GitErr(`fatal: pathspec '${tg}' did not match any files`);
        }
        return out.join('\n');
      }
      case 'rm': {
        needRepo(st);
        const cached = flags.has('--cached');
        const rec = flags.has('-r');
        for (const f of args) {
          const p = relPath(st, f);
          const ks = Object.keys(R.index).filter(k => k === p || (rec && k.startsWith(p + '/')));
          if (!ks.length) throw new GitErr(`fatal: pathspec '${f}' did not match any files`);
          for (const k of ks) { delete R.index[k]; if (!cached) delete R.work[k]; }
        }
        return args.map(f => `rm '${relPath(st, f)}'`).join('\n');
      }
      case 'mv': {
        needRepo(st);
        const [x, y] = args.map(p => relPath(st, p));
        if (R.work[x] === undefined) throw new GitErr(`fatal: bad source, source=${x}`);
        R.work[y] = R.work[x]; delete R.work[x];
        if (x in R.index) { R.index[y] = R.index[x]; delete R.index[x]; }
        return '';
      }
      case 'commit': {
        needRepo(st);
        if (!st.user || !st.user.name || !st.user.email) throw new GitErr('Author identity unknown\n\n*** Please tell me who you are.\n\nRun\n\n  git config --global user.email "you@example.com"\n  git config --global user.name "Your Name"\n\nto set your account\'s default identity.');
        let msg = optVal('-m', '--message');
        const amIdx = a.findIndex(x => x === '-am' || x === '-ma');
        if (amIdx >= 0) msg = a[amIdx + 1];
        if (flags.has('-a') || amIdx >= 0) for (const k of Object.keys(R.index)) { if (k in R.work) R.index[k] = R.work[k]; else delete R.index[k]; }
        if (msg === undefined && !flags.has('--no-edit') && !(flags.has('--amend'))) {
          if (R.merging) msg = R.merging.msg; else throw new GitErr('Aborting commit due to empty commit message.\n(Hinweis: Im Simulator gibt es keinen Editor – nutze git commit -m "Nachricht")');
        }
        if (msg !== undefined && !String(msg).trim()) throw new GitErr('Aborting commit due to empty commit message.');
        const parent = headHash(R);
        if (R.merging) {
          const still = R.merging.conflicts.filter(k => conflictText(R.index[k]) && R.index[k] !== undefined && R.work[k] === R.index[k] && false);
          const unstaged = R.merging.conflicts.filter(k => R.index[k] !== R.work[k] && conflictText(R.work[k]));
          if (unstaged.length) throw new GitErr('error: Committing is not possible because you have unmerged files.\nhint: Fix them up in the work tree, and then use \'git add/rm <file>\'\nhint: as appropriate to mark resolution and make a commit.\nfatal: Exiting because of an unresolved conflict.');
          void still;
          const h = makeCommit(st, R, [parent, R.merging.theirs], msg || R.merging.msg, R.index, `${st.user.name} <${st.user.email}>`);
          setHead(R, h); R.merging = null;
          return `[${R.HEAD.branch || 'detached HEAD'} ${short(h)}] ${msg || 'Merge'}`;
        }
        if (flags.has('--amend')) {
          if (!parent) throw new GitErr('fatal: You have nothing to amend.');
          const old = R.commits[parent];
          const h = makeCommit(st, R, old.parents, msg || old.msg, R.index, `${st.user.name} <${st.user.email}>`);
          setHead(R, h);
          return `[${R.HEAD.branch} ${short(h)}] ${msg || old.msg}`;
        }
        const s = status(R);
        if (!s.staged.length) {
          if (s.unstaged.length || s.untracked.length) throw new GitErr(`On branch ${R.HEAD.branch}\n` + (s.unstaged.length ? 'Changes not staged for commit:\n' + s.unstaged.map(([k, f]) => `\t${k}: ${f}`).join('\n') + '\n' : '') + (s.untracked.length ? 'Untracked files:\n' + s.untracked.map(f => '\t' + f).join('\n') + '\n' : '') + 'no changes added to commit (use "git add" and/or "git commit -a")');
          throw new GitErr(`On branch ${R.HEAD.branch}\nnothing to commit, working tree clean`);
        }
        const h = makeCommit(st, R, parent ? [parent] : [], msg, R.index, `${st.user.name} <${st.user.email}>`);
        setHead(R, h);
        const root = parent ? '' : ' (root-commit)';
        return `[${R.HEAD.branch || 'detached HEAD'}${root} ${short(h)}] ${msg}\n ${s.staged.length} file${s.staged.length > 1 ? 's' : ''} changed`;
      }
      case 'log': {
        needRepo(st);
        const n = +(optVal('-n') || (a.find(x => /^-\d+$/.test(x)) || '').slice(1)) || 1e9;
        const one = flags.has('--oneline');
        const nv = optVal('-n'); if (nv !== undefined) { const ix = args.indexOf(nv); if (ix >= 0) args.splice(ix, 1); }
        const starts = flags.has('--all') ? [...Object.values(R.branches), ...Object.values(R.remoteRefs)] : [resolve(st, R, args[0] || 'HEAD')];
        if (!starts[0] && !flags.has('--all')) { if (!headHash(R)) throw new GitErr(`fatal: your current branch '${R.HEAD.branch}' does not have any commits yet`); throw new GitErr(`fatal: ambiguous argument '${args[0]}': unknown revision`); }
        const set = new Set(); starts.forEach(h => ancestors(R, h).forEach(x => set.add(x)));
        const list = [...set].map(h => R.commits[h]).sort((x, y) => y.time - x.time).slice(0, n);
        const deco = h => {
          const ds = [];
          if (headHash(R) === h) ds.push(R.HEAD.branch ? `HEAD -> ${R.HEAD.branch}` : 'HEAD');
          for (const [b, x] of Object.entries(R.branches)) if (x === h && b !== R.HEAD.branch) ds.push(b);
          for (const [b, x] of Object.entries(R.remoteRefs)) if (x === h) ds.push(b);
          for (const [b, x] of Object.entries(R.tags)) if (x === h) ds.push('tag: ' + b);
          return ds.length ? ` (${ds.join(', ')})` : '';
        };
        const g = flags.has('--graph') ? (c => (c.parents.length > 1 ? '*   ' : '* ')) : () => '';
        if (one) return list.map(c => `${g(c)}${short(c.hash)}${deco(c.hash)} ${c.msg.split('\n')[0]}`).join('\n');
        return list.map(c => `${g(c)}commit ${c.hash}${deco(c.hash)}\n${c.parents.length > 1 ? 'Merge: ' + c.parents.map(short).join(' ') + '\n' : ''}Author: ${c.author}\n\n    ${c.msg}\n`).join('\n');
      }
      case 'show': {
        needRepo(st);
        const h = resolve(st, R, args[0] || 'HEAD');
        if (!h) throw new GitErr(`fatal: ambiguous argument '${args[0]}': unknown revision`);
        const c = R.commits[h]; const p = c.parents[0] ? R.commits[c.parents[0]].files : {};
        const ks = [...new Set([...Object.keys(p), ...Object.keys(c.files)])].sort();
        return `commit ${c.hash}\nAuthor: ${c.author}\n\n    ${c.msg}\n\n` + ks.map(k => unifiedDiff(k, p[k], c.files[k])).filter(Boolean).join('');
      }
      case 'diff': {
        needRepo(st);
        const staged = flags.has('--staged') || flags.has('--cached');
        const base = staged ? headTree(R) : R.index; const cmp = staged ? R.index : R.work;
        if (args.length >= 1 && resolve(st, R, args[0])) {
          const a1 = R.commits[resolve(st, R, args[0])].files; const b1 = args[1] && resolve(st, R, args[1]) ? R.commits[resolve(st, R, args[1])].files : R.work;
          const ks = [...new Set([...Object.keys(a1), ...Object.keys(b1)])].sort();
          return ks.map(k => unifiedDiff(k, a1[k], b1[k])).filter(Boolean).join('');
        }
        const ks = [...new Set([...Object.keys(base), ...Object.keys(cmp)])].filter(k => staged || k in base).filter(k => !args.length || args.some(x => relPath(st, x) === k)).sort();
        return ks.map(k => unifiedDiff(k, base[k], cmp[k])).filter(Boolean).join('');
      }
      case 'branch': {
        needRepo(st);
        if (flags.has('-d') || flags.has('-D')) {
          const out = [];
          for (const b of args) {
            if (!(b in R.branches)) throw new GitErr(`error: branch '${b}' not found.`);
            if (b === R.HEAD.branch) throw new GitErr(`error: Cannot delete branch '${b}' checked out at '${st.repoDir}'`);
            if (flags.has('-d') && !isAncestor(R, R.branches[b], headHash(R)) && !(R.upstream[b] && R.remoteRefs[R.upstream[b]] === R.branches[b])) throw new GitErr(`error: The branch '${b}' is not fully merged.\nhint: If you are sure you want to delete it, run 'git branch -D ${b}'`);
            out.push(`Deleted branch ${b} (was ${short(R.branches[b])}).`); delete R.branches[b]; delete R.upstream[b];
          }
          return out.join('\n');
        }
        if (flags.has('-m') || flags.has('-M')) {
          const [x, y] = args.length === 2 ? args : [R.HEAD.branch, args[0]];
          if (!(x in R.branches)) throw new GitErr(`error: refname ${x} not found`);
          R.branches[y] = R.branches[x]; delete R.branches[x]; if (R.HEAD.branch === x) R.HEAD.branch = y; return '';
        }
        if (args.length) {
          const b = args[0];
          if (!validBranch(b)) throw new GitErr(`fatal: '${b}' is not a valid branch name`);
          if (b in R.branches) throw new GitErr(`fatal: a branch named '${b}' already exists`);
          const h = resolve(st, R, args[1] || 'HEAD');
          if (!h) throw new GitErr(`fatal: not a valid object name: '${args[1] || R.HEAD.branch}'`);
          R.branches[b] = h; return '';
        }
        const lst = Object.keys(R.branches).sort().map(b => (b === R.HEAD.branch ? '* ' : '  ') + b + (flags.has('-v') || flags.has('-vv') ? ` ${short(R.branches[b])}${flags.has('-vv') && R.upstream[b] ? ' [' + R.upstream[b] + ']' : ''} ${R.commits[R.branches[b]].msg}` : ''));
        if (!R.HEAD.branch) lst.unshift(`* (HEAD detached at ${short(R.HEAD.detached)})`);
        if (flags.has('-a') || flags.has('-r')) { const rr = Object.keys(R.remoteRefs).sort().map(r => '  remotes/' + r); return (flags.has('-r') ? rr.map(x => x.replace('remotes/', '')) : [...lst, ...rr]).join('\n'); }
        return lst.join('\n');
      }
      case 'checkout': case 'switch': {
        needRepo(st);
        const create = (sub === 'checkout' && flags.has('-b')) || (sub === 'switch' && (flags.has('-c') || flags.has('--create')));
        const force = flags.has('-f') || flags.has('--force');
        if (sub === 'checkout' && a.includes('--')) { // checkout -- datei
          const fs = a.slice(a.indexOf('--') + 1);
          for (const f of fs) { const p = relPath(st, f); if (!(p in R.index)) throw new GitErr(`error: pathspec '${f}' did not match any file(s) known to git`); R.work[p] = R.index[p]; }
          return `Updated ${fs.length} path${fs.length > 1 ? 's' : ''} from the index`;
        }
        let target = args[0];
        if (!target) throw new GitErr(sub === 'switch' ? 'fatal: missing branch or commit argument' : 'fatal: You must specify a branch to checkout.');
        if (create) {
          if (!validBranch(target)) throw new GitErr(`fatal: '${target}' is not a valid branch name`);
          if (target in R.branches) throw new GitErr(`fatal: a branch named '${target}' already exists`);
          const start = resolve(st, R, args[1] || 'HEAD');
          if (!start) throw new GitErr('fatal: You are on a branch yet to be born');
          checkoutTree(R, R.commits[start].files, force);
          R.branches[target] = start; R.HEAD = { branch: target };
          if (args[1] && /^origin\//.test(args[1])) R.upstream[target] = args[1];
          return `Switched to a new branch '${target}'`;
        }
        if (sub === 'checkout' && !(target in R.branches) && !R.remoteRefs['origin/' + target]) {
          const p = relPath(st, target);
          if (p in R.index && !resolve(st, R, target)) { R.work[p] = R.index[p]; return 'Updated 1 path from the index'; }
        }
        if (!(target in R.branches)) {
          if (R.remoteRefs['origin/' + target]) { // DWIM: lokalen Tracking-Branch anlegen
            checkoutTree(R, R.commits[R.remoteRefs['origin/' + target]].files, force);
            R.branches[target] = R.remoteRefs['origin/' + target]; R.upstream[target] = 'origin/' + target; R.HEAD = { branch: target };
            return `branch '${target}' set up to track 'origin/${target}'.\nSwitched to a new branch '${target}'`;
          }
          const h = resolve(st, R, target);
          if (h && (sub === 'checkout' || flags.has('--detach') || flags.has('-d'))) { checkoutTree(R, R.commits[h].files, force); R.HEAD = { detached: h }; return `Note: switching to '${target}'.\n\nYou are in 'detached HEAD' state.\nHEAD is now at ${short(h)} ${R.commits[h].msg}`; }
          throw new GitErr(sub === 'switch' ? `fatal: invalid reference: ${target}` : `error: pathspec '${target}' did not match any file(s) known to git`);
        }
        if (R.HEAD.branch === target) return `Already on '${target}'`;
        if (R.merging) throw new GitErr('error: you need to resolve your current index first');
        checkoutTree(R, R.commits[R.branches[target]].files, force);
        R.HEAD = { branch: target };
        return `Switched to branch '${target}'`;
      }
      case 'restore': {
        needRepo(st);
        const stagedF = flags.has('--staged') || flags.has('-S');
        const src = optVal('--source', '-s');
        const fs = args.filter(x => x !== src);
        if (!fs.length) throw new GitErr('fatal: you must specify path(s) to restore');
        for (const f of fs) {
          const p = relPath(st, f);
          if (stagedF) { const h = headTree(R); if (p in h) R.index[p] = h[p]; else delete R.index[p]; }
          else {
            const from = src ? R.commits[resolve(st, R, src)].files : R.index;
            if (!(p in from)) throw new GitErr(`error: pathspec '${f}' did not match any file(s) known to git`);
            R.work[p] = from[p];
          }
        }
        return '';
      }
      case 'reset': {
        needRepo(st);
        const mode = flags.has('--hard') ? 'hard' : flags.has('--soft') ? 'soft' : 'mixed';
        const ref = args[0] && resolve(st, R, args[0]) ? args[0] : 'HEAD';
        const paths = args.filter(x => x !== ref && !resolve(st, R, x));
        if (paths.length) { const h = headTree(R); for (const f of paths) { const p = relPath(st, f); if (p in h) R.index[p] = h[p]; else delete R.index[p]; } return 'Unstaged changes after reset:\n' + paths.map(p => 'M\t' + p).join('\n'); }
        const h = resolve(st, R, ref);
        if (!h) throw new GitErr(`fatal: ambiguous argument '${ref}': unknown revision`);
        setHead(R, h); R.merging = null;
        if (mode !== 'soft') R.index = clone(R.commits[h].files);
        if (mode === 'hard') { for (const k of Object.keys(R.work)) if (!(k in R.index) && (k in (R.commits[h].files) || true) && !isUntrackedKeep(R, k)) delete R.work[k]; Object.assign(R.work, clone(R.index)); return `HEAD is now at ${short(h)} ${R.commits[h].msg}`; }
        return '';
      }
      case 'revert': {
        needRepo(st);
        if (!st.user) throw new GitErr('Author identity unknown');
        const h = resolve(st, R, args[0]);
        if (!h) throw new GitErr(`fatal: bad revision '${args[0]}'`);
        const c = R.commits[h]; const p = c.parents[0] ? R.commits[c.parents[0]].files : {};
        const s = status(R); if (s.staged.length || s.unstaged.length) throw new GitErr('error: your local changes would be overwritten by revert.\nhint: commit your changes or stash them to proceed.');
        const tree = clone(headTree(R));
        const ks = new Set([...Object.keys(p), ...Object.keys(c.files)]);
        let conflict = false;
        for (const k of ks) {
          if (p[k] === c.files[k]) continue;
          const m = merge3(c.files[k], tree[k], p[k], 'HEAD', 'parent of ' + short(h));
          if (m.conflict) conflict = true;
          if (p[k] === undefined && tree[k] === c.files[k]) delete tree[k]; else if (m.text !== undefined) tree[k] = m.text;
        }
        if (conflict) { R.work = clone(tree); throw new GitErr(`error: could not revert ${short(h)}... ${c.msg}\nhint: after resolving the conflicts, mark the corrected paths with 'git add <paths>' and commit`); }
        R.index = clone(tree); R.work = clone(tree);
        const nh = makeCommit(st, R, [headHash(R)], `Revert "${c.msg}"\n\nThis reverts commit ${h}.`, tree, `${st.user.name} <${st.user.email}>`);
        setHead(R, nh);
        return `[${R.HEAD.branch} ${short(nh)}] Revert "${c.msg}"`;
      }
      case 'merge': {
        needRepo(st);
        if (flags.has('--abort')) { if (!R.merging) throw new GitErr('fatal: There is no merge to abort (MERGE_HEAD missing).'); R.index = clone(headTree(R)); R.work = clone(R.index); R.merging = null; return ''; }
        if (flags.has('--continue')) return git(st, ['commit', '--no-edit']);
        if (R.merging) throw new GitErr('error: Merging is not possible because you have unmerged files.');
        const name = args[0];
        if (!name) throw new GitErr('fatal: No remote for the current branch.');
        const theirs = resolve(st, R, name);
        if (!theirs) throw new GitErr(`merge: ${name} - not something we can merge`);
        const ours = headHash(R);
        const s = status(R); if (s.staged.length || s.unstaged.length) throw new GitErr('error: Your local changes to the following files would be overwritten by merge:\n' + [...s.staged, ...s.unstaged].map(x => '\t' + x[1]).join('\n') + '\nPlease commit your changes or stash them before you merge.\nAborting');
        if (isAncestor(R, theirs, ours)) return 'Already up to date.';
        const msg = optVal('-m') || `Merge branch '${name.replace(/^origin\//, '')}'${R.HEAD.branch && R.HEAD.branch !== 'main' ? ` into ${R.HEAD.branch}` : ''}`;
        if (isAncestor(R, ours, theirs) && !flags.has('--no-ff')) {
          setHead(R, theirs); R.index = clone(R.commits[theirs].files); R.work = Object.assign(untrackedOnly(R), clone(R.index));
          return `Updating ${short(ours)}..${short(theirs)}\nFast-forward`;
        }
        if (flags.has('--ff-only')) throw new GitErr('fatal: Not possible to fast-forward, aborting.');
        const base = mergeBase(R, ours, theirs);
        const B = base ? R.commits[base].files : {}, O = R.commits[ours].files, Th = R.commits[theirs].files;
        const tree = {}; const conflicts = [];
        for (const k of new Set([...Object.keys(B), ...Object.keys(O), ...Object.keys(Th)])) {
          const b = B[k], o = O[k], t = Th[k];
          if (o === t) { if (o !== undefined) tree[k] = o; continue; }
          if (b === o) { if (t !== undefined) tree[k] = t; continue; }
          if (b === t) { if (o !== undefined) tree[k] = o; continue; }
          if (o === undefined || t === undefined) { conflicts.push(k); tree[k] = o !== undefined ? o : t; continue; }
          const m = merge3(b, o, t, 'HEAD', name);
          tree[k] = m.text; if (m.conflict) conflicts.push(k);
        }
        if (conflicts.length) {
          R.work = Object.assign(untrackedOnly(R), clone(tree));
          R.index = clone(O);
          for (const k of Object.keys(tree)) if (!conflicts.includes(k)) R.index[k] = tree[k];
          R.merging = { theirs, msg, conflicts };
          return conflicts.map(k => `Auto-merging ${k}\nCONFLICT (content): Merge conflict in ${k}`).join('\n') + '\nAutomatic merge failed; fix conflicts and then commit the result.';
        }
        if (!st.user) throw new GitErr('Author identity unknown');
        const h = makeCommit(st, R, [ours, theirs], msg, tree, `${st.user.name} <${st.user.email}>`);
        setHead(R, h); R.index = clone(tree); R.work = Object.assign(untrackedOnly(R), clone(tree));
        return `Merge made by the 'ort' strategy.`;
      }
      case 'tag': {
        needRepo(st);
        if (flags.has('-d')) { for (const tg of args) { if (!R.tags[tg]) throw new GitErr(`error: tag '${tg}' not found.`); delete R.tags[tg]; } return ''; }
        const annot = optVal('-a');
        const msgT = optVal('-m');
        const name = annot || args.find(x => x !== msgT);
        if (!name) return Object.keys(R.tags).sort().join('\n');
        if (R.tags[name]) throw new GitErr(`fatal: tag '${name}' already exists`);
        const ref = args.filter(x => x !== name && x !== msgT)[0];
        const h = resolve(st, R, ref || 'HEAD');
        if (!h) throw new GitErr('fatal: Failed to resolve \'HEAD\' as a valid ref.');
        if (annot && !msgT) throw new GitErr('fatal: no tag message (im Simulator: git tag -a <name> -m "Nachricht")');
        R.tags[name] = h; return '';
      }
      case 'stash': {
        needRepo(st);
        const op = args[0] || 'push';
        if (op === 'list') return R.stash.map((s, i) => `stash@{${i}}: WIP on ${s.branch}: ${s.msg}`).join('\n');
        if (op === 'pop' || op === 'apply') {
          if (!R.stash.length) throw new GitErr('error: No stash entries found.');
          const s = op === 'pop' ? R.stash.shift() : R.stash[0];
          for (const [k, v] of Object.entries(s.work)) { if (v === null) delete R.work[k]; else R.work[k] = v; }
          return `On branch ${R.HEAD.branch}\nDropped refs/stash@{0}`;
        }
        if (op === 'drop') { R.stash.shift(); return 'Dropped refs/stash@{0}'; }
        const s = status(R);
        if (!s.staged.length && !s.unstaged.length) return 'No local changes to save';
        const diff = {};
        const head = headTree(R);
        for (const k of new Set([...Object.keys(head), ...Object.keys(R.work)])) if (k in R.index || k in head) { if (R.work[k] !== head[k]) diff[k] = R.work[k] === undefined ? null : R.work[k]; }
        R.stash.unshift({ branch: R.HEAD.branch, msg: R.commits[headHash(R)].msg, work: diff });
        R.index = clone(head); for (const k of Object.keys(diff)) { if (k in head) R.work[k] = head[k]; else delete R.work[k]; }
        return `Saved working directory and index state WIP on ${R.HEAD.branch}: ${short(headHash(R))} ${R.commits[headHash(R)].msg}`;
      }
      case 'fetch': { needRepo(st); remoteCheck(st, args[0]); const n = fetch(st); return n ? `From ${st.remoteUrl}\n` + n : ''; }
      case 'pull': {
        needRepo(st); remoteCheck(st, args[0]);
        const b = args[1] || R.HEAD.branch;
        const out = fetch(st);
        const up = args[1] ? 'origin/' + args[1] : R.upstream[R.HEAD.branch] || (R.remoteRefs['origin/' + b] ? null : null);
        if (!up) throw new GitErr(`There is no tracking information for the current branch.\nPlease specify which branch you want to merge with.\n\n    git pull origin ${R.HEAD.branch}\n\nIf you wish to set tracking information for this branch you can do so with:\n\n    git branch --set-upstream-to=origin/${R.HEAD.branch} ${R.HEAD.branch}`);
        const r = git(st, ['merge', up, '-m', `Merge branch '${b}' of ${st.remoteUrl}`]);
        return (out ? `From ${st.remoteUrl}\n${out}\n` : '') + r;
      }
      case 'push': {
        needRepo(st);
        const remote = args[0] || 'origin';
        if (!R.remotes || !R.remotes[remote]) throw new GitErr(`fatal: '${remote}' does not appear to be a git repository\nfatal: Could not read from remote repository.`);
        if (R.remotes[remote] !== st.remoteUrl) throw new GitErr(`fatal: unable to access '${R.remotes[remote]}': Could not resolve host`);
        if (st.pendingRemote) { applyRemoteCommits(st, st.pendingRemote); st.pendingRemote = null; }
        const setUp = flags.has('-u') || flags.has('--set-upstream');
        const out = [];
        if (flags.has('--tags')) {
          for (const [tg, h] of Object.entries(R.tags)) if (st.remote.tags[tg] !== h) { copyCommits(R, st.remote, h); st.remote.tags[tg] = h; R.remoteTags[tg] = h; out.push(` * [new tag]         ${tg} -> ${tg}`); }
          if (!args[1]) return out.length ? `To ${st.remoteUrl}\n` + out.join('\n') : 'Everything up-to-date';
        }
        let refs = args.slice(1);
        if (!refs.length) {
          if (!R.HEAD.branch) throw new GitErr('fatal: You are not currently on a branch.');
          if (!R.upstream[R.HEAD.branch] && !setUp) throw new GitErr(`fatal: The current branch ${R.HEAD.branch} has no upstream branch.\nTo push the current branch and set the remote as upstream, use\n\n    git push --set-upstream origin ${R.HEAD.branch}\n`);
          refs = [R.HEAD.branch];
        }
        for (const ref of refs) {
          if (R.tags[ref] && !R.branches[ref]) { copyCommits(R, st.remote, R.tags[ref]); st.remote.tags[ref] = R.tags[ref]; R.remoteTags[ref] = R.tags[ref]; out.push(` * [new tag]         ${ref} -> ${ref}`); continue; }
          const [src, dst] = ref.includes(':') ? ref.split(':') : [ref, ref];
          const h = R.branches[src];
          if (!h) throw new GitErr(`error: src refspec ${src} does not match any`);
          const old = st.remote.branches[dst];
          if (old && !isAncestor(R, old, h) && !flags.has('--force') && !flags.has('-f') && !flags.has('--force-with-lease')) {
            if (!R.commits[old]) throw new GitErr(`To ${st.remoteUrl}\n ! [rejected]        ${src} -> ${dst} (fetch first)\nerror: failed to push some refs to '${st.remoteUrl}'\nhint: Updates were rejected because the remote contains work that you do not\nhint: have locally. This is usually caused by another repository pushing to\nhint: the same ref. Integrate the remote changes (e.g. 'git pull ...')\nhint: before pushing again.`);
            throw new GitErr(`To ${st.remoteUrl}\n ! [rejected]        ${src} -> ${dst} (non-fast-forward)\nerror: failed to push some refs to '${st.remoteUrl}'\nhint: Updates were rejected because the tip of your current branch is behind\nhint: its remote counterpart. Integrate the remote changes (e.g. 'git pull ...')`);
          }
          if (old === h) { out.push('Everything up-to-date'); if (setUp) R.upstream[src] = 'origin/' + dst; continue; }
          copyCommits(R, st.remote, h);
          st.remote.branches[dst] = h; R.remoteRefs['origin/' + dst] = h;
          out.push(old ? `   ${short(old)}..${short(h)}  ${src} -> ${dst}` : ` * [new branch]      ${src} -> ${dst}`);
          if (setUp) { R.upstream[src] = 'origin/' + dst; out.push(`branch '${src}' set up to track 'origin/${dst}'.`); }
          if (!old) out.splice(out.length - (setUp ? 1 : 0), 0, `remote:\nremote: To create a merge request for ${dst}, visit:\nremote:   ${st.remoteUrl.replace(/\.git$/, '')}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${encodeURIComponent(dst)}\nremote:`);
        }
        return `To ${st.remoteUrl}\n` + out.join('\n');
      }
      case 'rebase': case 'cherry-pick': case 'bisect': case 'submodule': case 'worktree': case 'reflog':
        throw new GitErr(`git ${sub}: Im Übungs-Simulator nicht verfügbar – übe diesen Befehl in einem echten Repository (siehe Anleitung).`);
      default: throw new GitErr(`git: '${sub}' is not a git command. See 'git --help'.`);
    }
  }
  function validBranch(b) { return /^[A-Za-z0-9._\/-]+$/.test(b) && !b.startsWith('-') && !b.endsWith('/') && !b.includes('..') && !b.endsWith('.lock'); }
  function isUntrackedKeep(R, k) { return !(k in headTree(R)) && !(k in R.index) && false; }
  function untrackedOnly(R) { const o = {}; for (const [k, v] of Object.entries(R.work)) if (!(k in R.index) && !(k in headTree(R))) o[k] = v; return o; }
  function setHead(R, h) { if (R.HEAD.branch) R.branches[R.HEAD.branch] = h; else R.HEAD.detached = h; }
  function checkoutTree(R, tree, force) {
    const head = headTree(R);
    const s = status(R);
    const dirty = [...s.staged, ...s.unstaged].map(x => x[1]);
    const blocking = dirty.filter(k => (tree[k] !== head[k]));
    if (blocking.length && !force) throw new GitErr('error: Your local changes to the following files would be overwritten by checkout:\n' + blocking.map(k => '\t' + k).join('\n') + '\nPlease commit your changes or stash them before you switch branches.\nAborting');
    const keepWork = {}; const keepIdx = {};
    if (!force) for (const k of dirty) { keepWork[k] = R.work[k]; keepIdx[k] = R.index[k]; }
    const untracked = untrackedOnly(R);
    R.index = clone(tree); R.work = Object.assign(untracked, clone(tree));
    for (const k of Object.keys(keepWork)) { if (keepWork[k] === undefined) delete R.work[k]; else R.work[k] = keepWork[k]; if (keepIdx[k] === undefined) delete R.index[k]; else R.index[k] = keepIdx[k]; }
  }
  function copyCommits(from, toRepo, h) { for (const x of ancestors(from, h)) if (!toRepo.commits[x]) toRepo.commits[x] = clone(from.commits[x]); }
  function remoteCheck(st, name) { const R = st.repo; const n = name || 'origin'; if (!R.remotes || !R.remotes[n]) throw new GitErr(`fatal: '${n}' does not appear to be a git repository`); }
  function fetch(st) {
    const R = st.repo; const out = [];
    if (st.pendingRemote) { applyRemoteCommits(st, st.pendingRemote); st.pendingRemote = null; }
    for (const [b, h] of Object.entries(st.remote.branches)) {
      copyCommits(st.remote, R, h);
      const old = R.remoteRefs['origin/' + b];
      if (old !== h) out.push(old ? `   ${short(old)}..${short(h)}  ${b}       -> origin/${b}` : ` * [new branch]      ${b}       -> origin/${b}`);
      R.remoteRefs['origin/' + b] = h;
    }
    for (const [tg, h] of Object.entries(st.remote.tags)) { copyCommits(st.remote, R, h); if (!R.tags[tg]) { R.tags[tg] = h; out.push(` * [new tag]         ${tg}       -> ${tg}`); } }
    return out.join('\n');
  }

  // ---------- Checks ----------
  function treeOf(st, branch) {
    const R = st.repo; if (!R) return null;
    if (!branch) return R.work;
    const h = resolve(st, R, branch); return h ? R.commits[h].files : null;
  }
  function checkState(ex, st) {
    const R = st.repo;
    return (ex.checks || []).map(c => {
      let ok = false, msg = c.msg;
      const def = m => { if (!msg) msg = m; };
      try {
        switch (c.type) {
          case 'repoExists': ok = !!R; def('Es gibt noch kein Repository (git clone / git init).'); break;
          case 'currentBranch': ok = !!R && R.HEAD.branch === c.name; def(`Du bist nicht auf dem Branch "${c.name}".`); break;
          case 'branchExists': ok = !!R && c.name in R.branches; def(`Branch "${c.name}" existiert nicht.`); break;
          case 'branchNotExists': ok = !!R && !(c.name in R.branches); def(`Branch "${c.name}" sollte gelöscht sein.`); break;
          case 'commitCountMin': {
            const h = R && resolve(st, R, c.branch || 'HEAD');
            const n = h ? [...ancestors(R, h)].filter(x => !R.commits[x].setup && (c.includeMerges || R.commits[x].parents.length < 2)).length : 0;
            ok = n >= c.n; def(`Auf "${c.branch || 'HEAD'}" brauchst du mindestens ${c.n} eigene Commit(s) – gefunden: ${n}.`); break;
          }
          case 'lastCommitMsgMatches': {
            const h = R && resolve(st, R, c.branch || 'HEAD');
            ok = !!h && new RegExp(c.pattern, c.flags || '').test(R.commits[h].msg); def(`Die letzte Commit-Nachricht auf "${c.branch || 'HEAD'}" passt nicht zum Muster ${c.pattern}.`); break;
          }
          case 'anyCommitMsgMatches': {
            const h = R && resolve(st, R, c.branch || 'HEAD');
            ok = !!h && [...ancestors(R, h)].some(x => !R.commits[x].setup && new RegExp(c.pattern, c.flags || '').test(R.commits[x].msg)); def(`Keine Commit-Nachricht passt zu ${c.pattern}.`); break;
          }
          case 'fileContains': { const tr = treeOf(st, c.branch); ok = !!tr && typeof tr[c.path] === 'string' && tr[c.path].includes(c.text); def(`${c.path}${c.branch ? ' auf ' + c.branch : ''} enthält nicht "${c.text}".`); break; }
          case 'fileNotContains': { const tr = treeOf(st, c.branch); ok = !!tr && (tr[c.path] === undefined || !tr[c.path].includes(c.text)); def(`${c.path} enthält noch "${c.text}".`); break; }
          case 'fileExists': { const tr = treeOf(st, c.branch); ok = !!tr && tr[c.path] !== undefined; def(`${c.path} fehlt${c.branch ? ' auf ' + c.branch : ''}.`); break; }
          case 'clean': { const s = R && status(R); ok = !!s && !s.staged.length && !s.unstaged.length && !s.untracked.length && !R.merging; def('Es gibt noch nicht committete Änderungen (git status).'); break; }
          case 'merged': { const a = R && resolve(st, R, c.from), b = R && resolve(st, R, c.into); ok = !!a && !!b && isAncestor(R, a, b); def(`"${c.from}" ist noch nicht in "${c.into}" gemergt.`); break; }
          case 'remoteHasBranch': ok = c.name in st.remote.branches; def(`Branch "${c.name}" ist noch nicht auf dem Server (git push).`); break;
          case 'remoteInSync': ok = !!R && R.branches[c.branch] !== undefined && st.remote.branches[c.branch] === R.branches[c.branch]; def(`Lokaler und entfernter Stand von "${c.branch}" sind nicht gleich (pull/push).`); break;
          case 'remoteContainsCommitOf': { ok = !!R && Object.values(st.remote.commits).some(x => !x.setup && new RegExp(c.pattern || '.').test(x.msg)); def('Auf dem Server ist noch kein eigener Commit.'); break; }
          case 'noConflictMarkers': { const tr = R ? [R.work, headTree(R)] : []; ok = !!R && !R.merging && tr.every(t => Object.values(t).every(v => !conflictText(v))); def('Es sind noch Konfliktmarker (<<<<<<< / >>>>>>>) vorhanden oder der Merge ist nicht abgeschlossen.'); break; }
          case 'tagExists': ok = !!R && (c.remote ? !!st.remote.tags[c.name] : !!R.tags[c.name]); def(`Tag "${c.name}" fehlt${c.remote ? ' auf dem Server' : ''}.`); break;
          case 'userConfigured': ok = !!st.user && !!st.user.name && !!st.user.email; def('user.name und user.email sind nicht gesetzt (git config).'); break;
          case 'fileNotTracked': ok = !!R && !(c.path in R.index) && !(c.path in headTree(R)); def(`${c.path} wird noch versioniert – gehört in .gitignore bzw. git rm --cached.`); break;
          case 'fileTracked': ok = !!R && (c.path in headTree(R)); def(`${c.path} ist noch nicht committet.`); break;
          case 'ignored': ok = !!R && isIgnored(R.work, c.path); def(`${c.path} wird von .gitignore nicht ignoriert.`); break;
          case 'commandUsed': ok = st.history.some(h => typeof h === 'string' && new RegExp(c.pattern).test(h)); def(`Erwarteter Befehl wurde nicht benutzt (${c.pattern}).`); break;
          case 'upstreamSet': ok = !!R && !!R.upstream[c.branch]; def(`Für "${c.branch}" ist kein Upstream gesetzt (git push -u).`); break;
          case 'stashEmpty': ok = !!R && R.stash.length === 0; def('Es liegen noch Einträge im Stash.'); break;
          case 'headCommitIsMerge': { const h = R && headHash(R); ok = !!h && R.commits[h].parents.length > 1; def('Der letzte Commit ist kein Merge-Commit.'); break; }
          case 'isRevertOf': { const h = R && resolve(st, R, c.branch || 'HEAD'); ok = !!h && [...ancestors(R, h)].some(x => /^Revert "/.test(R.commits[x].msg) && (!c.pattern || new RegExp(c.pattern).test(R.commits[x].msg))); def('Es gibt keinen Revert-Commit.'); break; }
          case 'branchContainsMsg': { const h = R && resolve(st, R, c.branch); ok = !!h && [...ancestors(R, h)].some(x => new RegExp(c.pattern, c.flags || '').test(R.commits[x].msg)); def(`"${c.branch}" enthält keinen Commit "${c.pattern}".`); break; }
          case 'branchNotContainsMsg': { const h = R && resolve(st, R, c.branch); ok = !!h && ![...ancestors(R, h)].some(x => new RegExp(c.pattern, c.flags || '').test(R.commits[x].msg)); def(`"${c.branch}" enthält noch einen Commit "${c.pattern}".`); break; }
          default: ok = false; msg = 'Unbekannter Check-Typ: ' + c.type;
        }
      } catch (e) { ok = false; msg = 'Check-Fehler: ' + e.message; }
      return { type: c.type, ok, msg: ok ? null : msg };
    });
  }
  function replay(ex, history) {
    const st = setup(ex);
    let transcript = '';
    const errors = [];
    for (const h of history) {
      const out = exec(st, h);
      transcript += `$ ${typeof h === 'string' ? h : 'edit ' + h.write}\n${out}\n`;
      if (/^(fatal|error):/m.test(out) || /command not found|Aborting commit/.test(out) || (/^git commit/.test(h) && /nothing to commit|no changes added/.test(out))) errors.push(`${typeof h === 'string' ? h : 'edit'} → ${out.split('\n')[0]}`);
    }
    return { st, transcript, errors };
  }
  function runSolution(ex) {
    const r = replay(ex, ex.solution || []);
    return { checks: checkState(ex, r.st), errors: r.errors, transcript: r.transcript };
  }
  function prompt(st) {
    const dir = st.cwd.replace(st.home, '~/Projekte').replace(/^\/c\/Projekte/, '~/Projekte');
    const br = inRepo(st) ? ` (${st.repo.HEAD.branch || short(st.repo.HEAD.detached)}${st.repo.merging ? '|MERGING' : ''})` : '';
    return { user: 'azubi@BREITNER-PC', sys: 'MINGW64', dir, branch: br };
  }
  // Übersicht für die Seitenleiste
  function overview(st) {
    const R = st.repo;
    if (!R) return { repo: false };
    const s = status(R);
    const commits = Object.values(R.commits).sort((a, b) => b.time - a.time).slice(0, 30).map(c => ({ hash: short(c.hash), msg: c.msg.split('\n')[0], parents: c.parents.map(short), refs: [
      ...Object.entries(R.branches).filter(([, h]) => h === c.hash).map(([b]) => b),
      ...Object.entries(R.remoteRefs).filter(([, h]) => h === c.hash).map(([b]) => b),
      ...Object.entries(R.tags).filter(([, h]) => h === c.hash).map(([b]) => 'tag:' + b)], head: headHash(R) === c.hash }));
    return { repo: true, branch: R.HEAD.branch, merging: !!R.merging, status: s, commits, files: Object.keys(R.work).sort(), remoteBranches: Object.keys(st.remote.branches) };
  }

  return { setup, exec, checkState, replay, runSolution, prompt, overview, status, merge3, isIgnored };
});
