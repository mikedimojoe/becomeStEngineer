/* Structured Text – Projekt (B&R-Struktur: Main.st / Variables.var / Types.typ + I/O + Anlagen-Simulation) */
(function (ST) {
  'use strict';
  const { STError, T, Compiler, Scope, coerce, defaultValue, typeName } = ST;
  const lc = s => String(s).toLowerCase();

  function newRuntime(cycleMs) {
    return {
      types: new Map(), fbDefs: new Map(), userFuncs: new Map(), funcs: new Map(), actions: new Map(),
      constants: new Map(), enumMembers: new Map(), builtinConsts: new Map(),
      budget: 0, now: 0, cycleMs, dt: cycleMs / 1000, cycleCount: 0,
      sim: {}, // Zustände der Simulationsbausteine (Achsen, TCP, Alarme)
      logs: [], log(msg) { this.logs.push({ t: this.now, msg }); if (this.logs.length > 500) this.logs.shift(); }
    };
  }

  // TYPE-Deklarationen registrieren (zweistufig, Vorwärtsreferenzen erlaubt)
  function registerTypes(rt, comp, typeDecls) {
    const pending = [];
    for (const td of typeDecls) {
      const key = lc(td.name);
      if (rt.types.has(key) && !rt.types.get(key).builtin) throw new STError(`Datentyp "${td.name}" ist doppelt definiert`, td.file, td.line);
      if (T[td.name.toUpperCase()]) throw new STError(`"${td.name}" ist ein reservierter Datentyp`, td.file, td.line);
      if (td.spec.t === 'struct') {
        const st = { k: 'STRUCT', name: td.name, fields: [], fmap: new Map() };
        rt.types.set(key, st); pending.push([td, st]);
      } else if (td.spec.t === 'enum') {
        const et = { k: 'ENUM', name: td.name, members: [], map: new Map() };
        rt.types.set(key, et); pending.push([td, et]);
      } else {
        const holder = { placeholder: true, name: td.name };
        holder.resolved = () => { throw new STError(`Datentyp "${td.name}" verweist zirkulär auf sich selbst`, td.file, td.line); };
        rt.types.set(key, holder); pending.push([td, holder]);
      }
    }
    // Enums zuerst (Werte werden in Strukturen/Arrays gebraucht)
    for (const [td, t] of pending) if (t.k === 'ENUM') {
      let next = 0;
      for (const m of td.spec.members) {
        let v = next;
        if (m.value) { comp.file = td.file; v = comp.constInt(m.value, td.file); }
        if (t.map.has(lc(m.name))) throw new STError(`Enum-Wert "${m.name}" doppelt in ${td.name}`, td.file, m.line);
        t.members.push({ name: m.name, value: v });
        t.map.set(lc(m.name), v);
        const prev = rt.enumMembers.get(lc(m.name));
        if (prev && prev.type !== t) prev.ambiguous = true;
        else rt.enumMembers.set(lc(m.name), { type: t });
        next = v + 1;
      }
      if (td.spec.init) {
        const iv = td.spec.init.t === 'id' ? t.map.get(lc(td.spec.init.name)) : null;
        if (iv !== undefined && iv !== null) { const idx = t.members.findIndex(m => m.value === iv); if (idx > 0) t.members.unshift(t.members.splice(idx, 1)[0]); }
      }
    }
    // Aliase
    for (const [td, h] of pending) if (h.placeholder) {
      const resolving = { busy: false };
      h.resolved = () => {
        if (h.final) return h.final;
        if (resolving.busy) throw new STError(`Datentyp "${td.name}" verweist zirkulär auf sich selbst`, td.file, td.line);
        resolving.busy = true;
        comp.file = td.file;
        const base = comp.resolveType(td.spec, td.file);
        h.final = base;
        return base;
      };
    }
    for (const [, h] of pending) if (h.placeholder) { const r = h.resolved(); rt.types.set(lc(h.name), r); }
    // Strukturen
    for (const [td, st] of pending) if (st.k === 'STRUCT') {
      comp.file = td.file;
      for (const f of td.spec.fields) {
        const key = lc(f.name);
        if (st.fmap.has(key)) throw new STError(`Element "${f.name}" doppelt in ${td.name}`, td.file, f.line);
        const fld = { name: f.name, key, type: null, initSpec: f.init, line: f.line, specT: f.type };
        st.fields.push(fld); st.fmap.set(key, fld);
      }
    }
    for (const [td, st] of pending) if (st.k === 'STRUCT') {
      for (const fld of st.fields) {
        fld.type = comp.resolveType(fld.specT, td.file);
        if (fld.type === st) throw new STError(`Struktur ${td.name} enthält sich selbst`, td.file, fld.line);
      }
    }
    for (const [td, st] of pending) if (st.k === 'STRUCT') {
      for (const fld of st.fields) if (fld.initSpec) fld.initFn = comp.initFn(fld.initSpec, fld.type, td.file);
    }
  }

  // VAR-Deklarationen → Scope-Einträge
  function declare(rt, comp, scope, decls, opts) {
    const list = [];
    for (const d of decls) {
      const key = lc(d.name);
      if (scope.vars.has(key)) throw new STError(`Variable "${d.name}" ist doppelt deklariert`, d.file, d.line);
      if (T[d.name.toUpperCase()] || ST.builtinFns[d.name.toUpperCase()]) throw new STError(`"${d.name}" ist ein reservierter Name`, d.file, d.line);
      comp.file = d.file;
      const type = comp.resolveType(d.type, d.file);
      const entry = { name: d.name, key, type, kind: d.kind, base: scope.base, constant: d.constant, retain: d.retain, line: d.line, file: d.file };
      if (d.kind === 'VAR_IN_OUT') entry.ioRef = true;
      if (d.init) entry.initFn = comp.initFn(d.init, type, d.file);
      if (d.constant) {
        if (!entry.initFn) throw new STError(`Konstante "${d.name}" braucht einen Wert (:= …)`, d.file, d.line);
        entry.cval = entry.initFn();
        rt.constants.set(key, entry);
      }
      if (opts && opts.readonly) entry.readonly = true;
      scope.add(entry);
      list.push(entry);
    }
    return list;
  }
  function initMem(rt, entries, mem) {
    for (const e of entries) {
      if (e.ioRef) { mem[e.key] = null; continue; }
      mem[e.key] = e.initFn ? e.initFn() : defaultValue(e.type, rt);
    }
    return mem;
  }

  // Benutzer-FBs & Funktionen
  function registerPous(rt, comp, units, globalScope) {
    const fbs = [], funcs = [];
    for (const u of units) { fbs.push(...u.fbs); funcs.push(...u.funcs); }
    for (const f of fbs) {
      const key = lc(f.name);
      if (rt.fbDefs.has(key) || rt.types.has(key)) throw new STError(`"${f.name}" ist bereits definiert`, f.file, f.line);
      const def = { name: f.name, user: true, vars: new Map(), inputList: [], ast: f };
      def.type = { k: 'FB', name: f.name, def };
      rt.fbDefs.set(key, def);
    }
    for (const f of funcs) {
      const key = lc(f.name);
      if (rt.userFuncs.has(key) || rt.fbDefs.has(key)) throw new STError(`"${f.name}" ist bereits definiert`, f.file, f.line);
      rt.userFuncs.set(key, { name: f.name, vars: new Map(), inputList: [], ast: f });
    }
    // Signaturen
    for (const def of [...rt.fbDefs.values()].filter(d => d.user)) {
      const f = def.ast;
      const scope = new Scope(globalScope, 'self');
      def.entries = declare(rt, comp, scope, f.vars);
      def.scope = scope;
      for (const e of def.entries) {
        def.vars.set(e.key, e);
        if (e.kind === 'VAR_INPUT' || e.kind === 'VAR_IN_OUT') def.inputList.push(e);
      }
      def.create = r => { const inst = {}; initMem(r, def.entries, inst); return inst; };
    }
    for (const uf of rt.userFuncs.values()) {
      const f = uf.ast;
      comp.file = f.file;
      uf.retType = comp.resolveType(f.retType, f.file);
      const scope = new Scope(globalScope, 'f');
      uf.entries = declare(rt, comp, scope, f.vars);
      const ret = { name: f.name, key: lc(f.name), type: uf.retType, kind: 'RETURN', base: 'f', line: f.line };
      if (!scope.vars.has(ret.key)) scope.add(ret);
      uf.scope = scope;
      for (const e of uf.entries) {
        uf.vars.set(e.key, e);
        if (e.kind === 'VAR_INPUT' || e.kind === 'VAR_IN_OUT') uf.inputList.push(e);
      }
      uf.newFrame = r => { const fr = initMem(r, uf.entries, {}); fr[ret.key] = defaultValue(uf.retType, r); return fr; };
    }
    // Rümpfe
    for (const def of [...rt.fbDefs.values()].filter(d => d.user)) {
      comp.scope = def.scope; comp.file = def.ast.file; comp.allowActions = false; comp.loopDepth = 0;
      const body = comp.stmts(def.ast.body);
      def.exec = (inst, r, env) => { body({ g: env.g, self: inst, k: env.k }); };
    }
    for (const uf of rt.userFuncs.values()) {
      comp.scope = uf.scope; comp.file = uf.ast.file; comp.allowActions = false; comp.loopDepth = 0;
      const body = comp.stmts(uf.ast.body);
      const rk = lc(uf.name);
      uf.run = (frame, env) => { body({ g: env.g, f: frame, k: env.k }); return frame[rk]; };
    }
  }

  // ---------- Projekt erstellen ----------
  function parseTypeString(str) {
    const p = ST.parseUnit('VAR x : ' + str + '; END_VAR', 'io');
    return p.vars[0].type;
  }

  ST.createProject = function (opt) {
    const files = opt.files || {};
    const cycleMs = opt.cycleMs || 10;
    const rt = newRuntime(cycleMs);
    ST.installLibrary(rt);
    rt.axisConfig = opt.axis || {};
    rt.tcpServer = opt.tcpServer || null;
    const comp = new Compiler(rt);

    const units = {};
    const parse = (src, name) => ST.parseUnit(src || '', name);
    units.typ = parse(files.typ, 'Types.typ');
    units.var = parse(files.var, 'Variables.var');
    units.main = parse(files.main, 'Main.st');
    const extra = (files.extra || []).map(f => parse(f.text, f.name));
    for (const [n, u] of Object.entries({ typ: units.typ, var: units.var })) {
      const fname = n === 'typ' ? 'Types.typ' : 'Variables.var';
      if (n === 'typ' && (u.vars.length || Object.keys(u.programs).length || u.fbs.length)) throw new STError('In Types.typ gehören nur TYPE … END_TYPE Blöcke', fname, 1);
      if (n === 'var' && (u.types.length || Object.keys(u.programs).length || u.fbs.length)) throw new STError('In Variables.var gehören nur VAR … END_VAR Blöcke', fname, 1);
    }
    const allUnits = [units.typ, units.var, units.main, ...extra];
    registerTypes(rt, comp, allUnits.flatMap(u => u.types));

    // Globale Variablen (I/O)
    const gProg = new Scope(null, 'g'), gPlant = new Scope(null, 'g');
    const gEntries = [];
    for (const io of (opt.io || [])) {
      comp.file = 'Global.var';
      const spec = parseTypeString(io.type || 'BOOL');
      const type = comp.resolveType(spec, 'Global.var');
      const entry = { name: io.name, key: lc(io.name), type, kind: 'VAR_GLOBAL', base: 'g', io, line: 0, file: 'Global.var' };
      if (io.init !== undefined) entry.initFn = () => coerce(io.init, type);
      gEntries.push(entry);
      gProg.add(Object.assign({}, entry, { readonly: io.dir === 'in' && !io.writable }));
      gPlant.add(Object.assign({}, entry, { readonly: io.dir === 'out' }));
    }
    registerPous(rt, comp, allUnits, gProg);

    // Programm-Scope
    const pScope = new Scope(gProg, 'p');
    const progDecls = [...units.var.vars, ...units.main.vars];
    for (const slot of ['init', 'cyclic', 'exit']) if (units.main.programs[slot]) progDecls.push(...units.main.programs[slot].vars);
    const pEntries = declare(rt, comp, pScope, progDecls);
    // Aktionen
    comp.scope = pScope; comp.allowActions = true;
    const actionAsts = allUnits.flatMap(u => u.actions);
    for (const a of actionAsts) { if (rt.actions.has(lc(a.name))) throw new STError(`Aktion ${a.name} doppelt`, 'Main.st', a.line); rt.actions.set(lc(a.name), { name: a.name, run: null, ast: a }); }
    for (const a of rt.actions.values()) { comp.file = 'Main.st'; comp.loopDepth = 0; const b = comp.stmts(a.ast.body); a.run = env => b(env); }
    const progs = {};
    for (const slot of ['init', 'cyclic', 'exit']) {
      const pr = units.main.programs[slot];
      comp.file = 'Main.st'; comp.loopDepth = 0; comp.scope = pScope; comp.allowActions = true;
      progs[slot] = pr ? comp.stmts(pr.body) : null;
    }
    if (!units.main.programs.cyclic && !opt.allowNoCyclic) throw new STError('PROGRAM _CYCLIC fehlt in Main.st', 'Main.st', 1);

    // Anlagen-Simulation
    let plantRun = null, qScope = null, qEntries = [];
    if (opt.plant && (opt.plant.code || opt.plant.var)) {
      const pu = ST.parseUnit(opt.plant.var || '', 'Anlage.var');
      qScope = new Scope(gPlant, 'q');
      qScope.add({ name: 'PLANT_DT', key: 'plant_dt', type: T.REAL, base: 'q', constant: false, readonly: true });
      qScope.add({ name: 'PLANT_TIME', key: 'plant_time', type: T.TIME, base: 'q', readonly: true });
      qScope.add({ name: 'PLANT_CYCLE', key: 'plant_cycle', type: T.UDINT, base: 'q', readonly: true });
      qEntries = declare(rt, comp, qScope, pu.vars);
      const body = ST.parseStatements(opt.plant.code || '', 'Anlage.st');
      comp.scope = qScope; comp.file = 'Anlage.st'; comp.allowActions = false; comp.loopDepth = 0;
      plantRun = comp.stmts(body);
    }

    const BUDGET = opt.budget || 200000;
    const project = {
      rt, cycleMs, io: opt.io || [], env: null, initialized: false, error: null,
      reset() {
        rt.now = 0; rt.cycleCount = 0; rt.sim = {}; rt.logs = [];
        if (ST.resetSim) ST.resetSim(rt);
        const g = initMem(rt, gEntries, {});
        const p = initMem(rt, pEntries, {});
        const q = qScope ? initMem(rt, qEntries, { plant_dt: Math.fround(cycleMs / 1000), plant_time: 0, plant_cycle: 0 }) : {};
        this.env = { g, p, q, k: {} };
        rt.globalsRef = g;
        this.initialized = false; this.error = null;
      },
      init() {
        if (!this.env) this.reset();
        rt.budget = BUDGET;
        if (progs.init) progs.init(this.env);
        this.initialized = true;
      },
      cycle() {
        if (!this.initialized) this.init();
        rt.now += cycleMs; rt.cycleCount++;
        if (opt.tcpOfflineVar) rt.tcpOffline = !!this.env.g[lc(opt.tcpOfflineVar)];
        if (ST.stepSim) ST.stepSim(rt);
        if (plantRun) {
          this.env.q.plant_time = rt.now; this.env.q.plant_cycle = rt.cycleCount;
          rt.budget = BUDGET;
          try { plantRun(this.env); } catch (e) { if (e instanceof STError) { e.message = '[Anlagen-Simulation] ' + e.message; } throw e; }
        }
        rt.budget = BUDGET;
        progs.cyclic && progs.cyclic(this.env);
      },
      exit() { if (progs.exit) { rt.budget = BUDGET; progs.exit(this.env); } },
      runMs(ms) { const n = Math.max(1, Math.round(ms / cycleMs)); for (let i = 0; i < n; i++) this.cycle(); },
      // Ausdruck im Programm-Kontext auswerten (für Tests und Watch)
      compileExpr(src) {
        const ast = ST.parseExpression(src, 'Test');
        // Suchreihenfolge: Programm-Variablen → Globale → Anlagen-Variablen
        const chain = new Scope(null, 'p'); chain.vars = pScope.vars;
        const glob = new Scope(null, 'g'); glob.vars = gProg.vars;
        const plant = new Scope(null, 'q'); plant.vars = qScope ? qScope.vars : new Map();
        chain.parent = glob; glob.parent = plant;
        comp.scope = chain; comp.file = 'Test'; comp.allowActions = false;
        return comp.expr(ast);
      },
      eval(src) { const c = this.compileExpr(src); rt.budget = BUDGET; return { value: c.ev(this.env), type: c.ty }; },
      // Wert setzen (Pfad wie "stCmd.bStart" oder "aValues[2]")
      set(path, value) {
        const c = this.compileExpr(path);
        if (!c.ref) throw new STError(`"${path}" ist keine Variable`, 'Test', 0);
        const [o, k] = c.ref(this.env);
        o[k] = (c.ty.k === 'STRUCT' || c.ty.k === 'ARRAY') ? value : coerce(c.ty.k === 'ENUM' && typeof value === 'string' ? c.ty.map.get(lc(value)) : value, c.ty);
      },
      get(path) { return this.eval(path).value; },
      // Flache Liste aller Variablen für das Watch-Fenster
      watch(scopeName) {
        const out = [];
        const walk = (name, type, val, depth) => {
          if (out.length > 400) return;
          if (type.k === 'STRUCT') { out.push({ name, type: type.name, depth, group: true }); for (const f of type.fields) walk(name + '.' + f.name, f.type, val[f.key], depth + 1); }
          else if (type.k === 'ARRAY') {
            out.push({ name, type: typeName(type), depth, group: true });
            const d = type.dims[0];
            if (type.dims.length === 1) for (let i = d.lo; i <= d.hi && i - d.lo < 64; i++) walk(`${name}[${i}]`, type.elem, val[i - d.lo], depth + 1);
          } else if (type.k === 'FB') {
            out.push({ name, type: type.name, depth, group: true });
            for (const e of type.def.watchList || type.def.entries || []) if (!e.hidden && e.kind !== 'VAR_IN_OUT') walk(name + '.' + e.name, e.type, val[e.key], depth + 1);
          } else if (type.k === 'OPAQUE') {
            out.push({ name, type: type.name, depth, value: type.show ? type.show(val) : '…' });
          } else {
            let v = val;
            if (type.k === 'ENUM') { const m = type.members.find(x => x.value === val); v = m ? m.name : val; }
            out.push({ name, type: typeName(type), depth, value: v, kind: type.k, raw: val });
          }
        };
        const env = this.env || {};
        if (!scopeName || scopeName === 'p') for (const e of pEntries) if (!e.constant) walk(e.name, e.type, env.p[e.key], 0);
        if (!scopeName || scopeName === 'g') for (const e of gEntries) walk(e.name, e.type, env.g[e.key], 0);
        return out;
      },
      fmt(v, type) { return ST.formatValue(v, type); }
    };
    project.reset();
    return project;
  };

  ST.formatValue = function (v, type) {
    if (!type) return String(v);
    switch (type.k) {
      case 'BOOL': return v ? 'TRUE' : 'FALSE';
      case 'REAL': { if (!isFinite(v)) return String(v); const r = Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-4 && v !== 0) ? v.toExponential(4) : (+v.toFixed(4)).toString(); return r.includes('.') || r.includes('e') ? r : r + '.0'; }
      case 'TIME': return 'T#' + ST.formatTime(v);
      case 'STRING': return "'" + v + "'";
      case 'ENUM': { const m = type.members.find(x => x.value === v); return m ? m.name : String(v); }
      case 'INT': return typeof v === 'object' ? 'ADR(…)' : String(v);
      default: return String(v);
    }
  };
  ST.formatTime = function (ms) {
    if (ms === 0) return '0ms';
    let s = ms < 0 ? '-' : ''; ms = Math.abs(ms);
    const parts = [[86400000, 'd'], [3600000, 'h'], [60000, 'm'], [1000, 's'], [1, 'ms']];
    for (const [f, u] of parts) { if (ms >= f) { s += Math.floor(ms / f) + u; ms %= f; } }
    return s;
  };

  // ---------- Testlauf einer Übung ----------
  ST.runTests = function (ex, files, opts) {
    opts = opts || {};
    const result = { ok: false, compileError: null, tests: [], passed: 0, total: (ex.tests || []).length };
    let proj;
    const mk = () => ST.createProject({ files, io: ex.io, plant: ex.plant, cycleMs: ex.cycleMs || 10, axis: ex.axis, tcpServer: ex.tcpServer, tcpOfflineVar: ex.tcpOfflineVar });
    try { proj = mk(); } catch (e) {
      if (!(e instanceof STError)) e = new STError(e.message, '?', 0, 'Interner Fehler');
      result.compileError = { file: e.file, line: e.line, kind: e.kind, message: e.message, text: e.toString() };
      return result;
    }
    for (const t of ex.tests || []) {
      const tr = { name: t.name, ok: true, msg: null, step: null };
      try {
        proj = mk();
        proj.init();
        const cyc = proj.cycleMs;
        t.steps.forEach((st, i) => {
          tr.step = i;
          if (st.set) for (const [k, v] of Object.entries(st.set)) proj.set(k, v);
          if (st.cycles) for (let c = 0; c < st.cycles; c++) proj.cycle();
          if (st.ms && !st.never) proj.runMs(st.ms);
          if (st.expect) {
            const r = proj.eval(st.expect);
            if (r.type.k !== 'BOOL') throw new Error('Test-Ausdruck ist nicht BOOL: ' + st.expect);
            if (!r.value) throw Object.assign(new Error(st.msg || `Erwartet: ${st.expect}`), { testFail: true, detail: describe(proj, st.expect) });
          }
          if (st.until) {
            const c = proj.compileExpr(st.until);
            const max = Math.max(1, Math.round((st.maxMs || 5000) / cyc));
            let okU = false;
            for (let k = 0; k < max; k++) { proj.cycle(); if (c.ev(proj.env)) { okU = true; break; } }
            if (!okU) throw Object.assign(new Error(st.msg || `Innerhalb von ${st.maxMs || 5000} ms nicht erreicht: ${st.until}`), { testFail: true, detail: describe(proj, st.until) });
          }
          if (st.never) {
            const c = proj.compileExpr(st.never);
            const max = Math.max(1, Math.round((st.ms || 1000) / cyc));
            for (let k = 0; k < max; k++) { proj.cycle(); if (c.ev(proj.env)) throw Object.assign(new Error(st.msg || `Darf nicht eintreten: ${st.never} (nach ${(k + 1) * cyc} ms)`), { testFail: true, detail: describe(proj, st.never) }); }
          }
        });
      } catch (e) {
        tr.ok = false;
        if (e instanceof STError) { tr.msg = e.toString(); tr.runtime = true; }
        else tr.msg = e.message;
        tr.detail = e.detail || null;
      }
      if (tr.ok) result.passed++;
      result.tests.push(tr);
      if (opts.stopOnRuntimeError && tr.runtime) break;
    }
    result.ok = result.total > 0 && result.passed === result.total;
    return result;
  };
  // Variablen eines Ausdrucks mit Ist-Werten beschreiben (Hilfe bei fehlgeschlagenem Test)
  function describe(proj, expr) {
    const names = [...new Set((expr.match(/[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*|\[[^\]]+\])*/g) || []))]
      .filter(n => !/^(AND|OR|XOR|NOT|MOD|TRUE|FALSE|T|TIME)$/i.test(n));
    const parts = [];
    for (const n of names.slice(0, 6)) {
      try { const r = proj.eval(n); if (r.type.k !== 'STRUCT' && r.type.k !== 'ARRAY' && r.type.k !== 'FB') parts.push(`${n} = ${ST.formatValue(r.value, r.type)}`); } catch (e) { /* kein Variablenname */ }
    }
    return parts.length ? 'Ist-Werte: ' + parts.join(', ') : null;
  }
})(typeof window !== 'undefined' ? (window.ST = window.ST || {}) : (global.ST = global.ST || {}));
