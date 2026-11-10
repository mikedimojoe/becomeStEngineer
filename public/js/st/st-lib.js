/* Structured Text – Standardbibliothek (IEC 61131-3) und vereinfachte B&R-Simulationsbausteine */
(function (ST) {
  'use strict';
  const { STError, T, coerce, defaultValue, typeName, toBytes, fromBytes, sizeOf, arithType } = ST;
  const lc = s => String(s).toLowerCase();
  const isNum = t => t.k === 'INT' || t.k === 'REAL';
  const isInt = t => t.k === 'INT';

  // ---------- Funktionen ----------
  const F = {};
  const numSig = name => tys => { if (!isNum(tys[0])) throw new Error(`${name} erwartet eine Zahl (ist ${typeName(tys[0])})`); return tys[0].k === 'REAL' && tys[0].bits === 64 && !tys[0].lit ? T.LREAL : T.REAL; };
  const math1 = (name, fn) => { F[name] = { params: ['IN'], min: 1, max: 1, sig: numSig(name), impl: (a, t, rt, ty) => coerce(fn(+a[0]), ty) }; };
  math1('SQRT', Math.sqrt); math1('EXP', Math.exp); math1('LN', Math.log); math1('LOG', Math.log10);
  math1('SIN', Math.sin); math1('COS', Math.cos); math1('TAN', Math.tan);
  math1('ASIN', Math.asin); math1('ACOS', Math.acos); math1('ATAN', Math.atan);
  F.ATAN2 = { params: ['Y', 'X'], min: 2, max: 2, sig: tys => { if (!isNum(tys[0]) || !isNum(tys[1])) throw new Error('ATAN2 erwartet Zahlen'); return T.REAL; }, impl: (a, t, rt, ty) => coerce(Math.atan2(a[0], a[1]), ty) };
  F.EXPT = { params: ['IN1', 'IN2'], min: 2, max: 2, sig: tys => { if (!isNum(tys[0]) || !isNum(tys[1])) throw new Error('EXPT erwartet Zahlen'); return tys[0].k === 'REAL' ? tys[0] : T.REAL; }, impl: (a, t, rt, ty) => coerce(Math.pow(a[0], a[1]), ty) };
  F.ABS = { params: ['IN'], min: 1, max: 1, sig: tys => { if (!isNum(tys[0]) && tys[0].k !== 'TIME') throw new Error('ABS erwartet eine Zahl'); return tys[0].lit ? (tys[0].k === 'INT' ? T.DINT : T.REAL) : tys[0]; }, impl: (a, t, rt, ty) => coerce(Math.abs(a[0]), ty) };
  F.TRUNC = { params: ['IN'], min: 1, max: 1, sig: tys => { if (!isNum(tys[0])) throw new Error('TRUNC erwartet eine Zahl'); return T.DINT; }, impl: a => coerce(Math.trunc(a[0]), T.DINT) };
  const commonType = (tys, name) => {
    let r = tys[0];
    for (const t of tys.slice(1)) {
      if (isNum(r) && isNum(t)) r = arithType(r, t);
      else if (r.k === t.k && (r.k === 'TIME' || r.k === 'STRING' || r.k === 'BOOL' || (r.k === 'ENUM' && r.name === t.name))) r = r.k === 'STRING' ? (r.len >= t.len ? r : t) : r;
      else if ((r.k === 'TIME' && t.lit) || (t.k === 'TIME' && r.lit)) r = T.TIME;
      else throw new Error(`${name}: Typen ${typeName(r)} und ${typeName(t)} passen nicht zusammen`);
    }
    if (r.lit) r = r.k === 'INT' ? T.DINT : T.REAL;
    return r;
  };
  F.MIN = { params: [], min: 2, sig: tys => commonType(tys, 'MIN'), impl: (a, t, rt, ty) => coerce(a.reduce((x, y) => (y < x ? y : x)), ty) };
  F.MAX = { params: [], min: 2, sig: tys => commonType(tys, 'MAX'), impl: (a, t, rt, ty) => coerce(a.reduce((x, y) => (y > x ? y : x)), ty) };
  F.LIMIT = { params: ['MN', 'IN', 'MX'], min: 3, max: 3, sig: tys => commonType(tys, 'LIMIT'), impl: (a, t, rt, ty) => coerce(Math.min(Math.max(a[1], a[0]), a[2]), ty) };
  F.SEL = { params: ['G', 'IN0', 'IN1'], min: 3, max: 3, sig: tys => { if (tys[0].k !== 'BOOL') throw new Error('SEL: G muss BOOL sein'); return commonType(tys.slice(1), 'SEL'); }, impl: (a, t, rt, ty) => coerce(a[0] ? a[2] : a[1], ty) };
  F.MUX = { params: ['K'], min: 2, sig: tys => { if (!isInt(tys[0])) throw new Error('MUX: K muss eine Ganzzahl sein'); return commonType(tys.slice(1), 'MUX'); }, impl: (a, t, rt, ty) => { const k = a[0]; if (k < 0 || k >= a.length - 1) throw new Error(`K = ${k} außerhalb 0..${a.length - 2}`); return coerce(a[k + 1], ty); } };
  F.MOVE = { params: ['IN'], min: 1, max: 1, sig: tys => tys[0].lit ? (tys[0].k === 'INT' ? T.DINT : T.REAL) : tys[0], impl: a => a[0] };
  const shiftSig = name => tys => { if (!isInt(tys[0]) || !isInt(tys[1])) throw new Error(`${name} erwartet Ganzzahl/Bitstring und Anzahl`); return tys[0].lit ? T.DWORD : tys[0]; };
  const bitsOf = ty => ty.lit ? 32 : ty.bits;
  F.SHL = { params: ['IN', 'N'], min: 2, max: 2, sig: shiftSig('SHL'), impl: (a, t, rt, ty) => coerce(a[0] * 2 ** a[1], ty) };
  F.SHR = { params: ['IN', 'N'], min: 2, max: 2, sig: shiftSig('SHR'), impl: (a, t, rt, ty) => { const b = bitsOf(ty); const m = 2 ** b; const u = ((a[0] % m) + m) % m; return coerce(Math.floor(u / 2 ** a[1]), ty); } };
  F.ROL = { params: ['IN', 'N'], min: 2, max: 2, sig: shiftSig('ROL'), impl: (a, t, rt, ty) => { const b = bitsOf(ty), m = 2 ** b, n = a[1] % b; const u = ((a[0] % m) + m) % m; return coerce((u * 2 ** n) % m + Math.floor(u / 2 ** (b - n)), ty); } };
  F.ROR = { params: ['IN', 'N'], min: 2, max: 2, sig: shiftSig('ROR'), impl: (a, t, rt, ty) => { const b = bitsOf(ty), m = 2 ** b, n = a[1] % b; const u = ((a[0] % m) + m) % m; return coerce(Math.floor(u / 2 ** n) + (u % 2 ** n) * 2 ** (b - n), ty); } };
  // Strings (Positionen 1-basiert wie IEC)
  const strArg = (tys, i, name) => { if (tys[i].k !== 'STRING') throw new Error(`${name}: Parameter ${i + 1} muss STRING sein`); };
  const intArg = (tys, i, name) => { if (!isInt(tys[i])) throw new Error(`${name}: Parameter ${i + 1} muss eine Ganzzahl sein`); };
  const S255 = { k: 'STRING', name: 'STRING', len: 255 };
  F.LEN = { params: ['IN'], min: 1, max: 1, sig: tys => { strArg(tys, 0, 'LEN'); return T.INT; }, impl: a => a[0].length };
  F.LEFT = { params: ['IN', 'L'], min: 2, max: 2, sig: tys => { strArg(tys, 0, 'LEFT'); intArg(tys, 1, 'LEFT'); return S255; }, impl: a => a[0].slice(0, Math.max(0, a[1])) };
  F.RIGHT = { params: ['IN', 'L'], min: 2, max: 2, sig: tys => { strArg(tys, 0, 'RIGHT'); intArg(tys, 1, 'RIGHT'); return S255; }, impl: a => a[1] <= 0 ? '' : a[0].slice(-a[1]) };
  F.MID = { params: ['IN', 'L', 'P'], min: 3, max: 3, sig: tys => { strArg(tys, 0, 'MID'); intArg(tys, 1, 'MID'); intArg(tys, 2, 'MID'); return S255; }, impl: a => a[0].substr(Math.max(0, a[2] - 1), Math.max(0, a[1])) };
  F.CONCAT = { params: [], min: 2, sig: tys => { tys.forEach((t, i) => strArg(tys, i, 'CONCAT')); return S255; }, impl: a => a.join('') };
  F.FIND = { params: ['IN1', 'IN2'], min: 2, max: 2, sig: tys => { strArg(tys, 0, 'FIND'); strArg(tys, 1, 'FIND'); return T.INT; }, impl: a => a[0].indexOf(a[1]) + 1 };
  F.INSERT = { params: ['IN1', 'IN2', 'P'], min: 3, max: 3, sig: tys => { strArg(tys, 0, 'INSERT'); strArg(tys, 1, 'INSERT'); intArg(tys, 2, 'INSERT'); return S255; }, impl: a => a[0].slice(0, a[2]) + a[1] + a[0].slice(a[2]) };
  F.DELETE = { params: ['IN', 'L', 'P'], min: 3, max: 3, sig: tys => { strArg(tys, 0, 'DELETE'); return S255; }, impl: a => a[0].slice(0, a[2] - 1) + a[0].slice(a[2] - 1 + a[1]) };
  F.REPLACE = { params: ['IN1', 'IN2', 'L', 'P'], min: 4, max: 4, sig: tys => { strArg(tys, 0, 'REPLACE'); strArg(tys, 1, 'REPLACE'); return S255; }, impl: a => a[0].slice(0, a[3] - 1) + a[1] + a[0].slice(a[3] - 1 + a[2]) };

  // ADR / SIZEOF
  F.ADR = {
    params: ['IN'], special(n, comp, ordered) {
      if (ordered.length !== 1) comp.err('ADR erwartet genau einen Parameter', n);
      const a = ordered[0].expr;
      if (a.t === 'str') { const v = a.v; const ty = { k: 'STRING', name: 'STRING', len: Math.max(1, v.length) }; return { ty: T.REF, ev: () => ({ __adr: true, obj: { v }, key: 'v', type: ty, constant: true }) }; }
      const c = comp.expr(a);
      if (!c.ref) comp.err('ADR() braucht eine Variable', n);
      const ref = c.ref, ty = c.ty;
      return { ty: T.REF, ev: env => { const [o, k] = ref(env); return { __adr: true, obj: o, key: k, type: ty }; } };
    }
  };
  F.SIZEOF = {
    params: ['IN'], special(n, comp, ordered) {
      if (ordered.length !== 1) comp.err('SIZEOF erwartet genau einen Parameter', n);
      const a = ordered[0].expr;
      let size;
      if (a.t === 'id' && !comp.scope.lookup(a.name)) {
        try { size = sizeOf(comp.resolveType({ t: 'named', name: a.name, line: a.line })); } catch (e) { comp.err(`SIZEOF: "${a.name}" ist weder Variable noch Datentyp`, n); }
      } else size = sizeOf(comp.expr(a).ty);
      return { ty: T.UDINT, ev: () => size, isConst: true, cval: size };
    }
  };
  // brs* (AsBrStr) – arbeiten auf ADR()-Referenzen
  const deref = (p, name) => { if (!p || !p.__adr) throw new Error(`${name}: Parameter muss ADR(variable) sein`); return p; };
  const readStr = p => { const v = p.obj[p.key]; return typeof v === 'string' ? v : bytesToStr(toBytes(v, p.type)); };
  const bytesToStr = b => { let s = ''; for (const c of b) { if (!c) break; s += String.fromCharCode(c); } return s; };
  const writeStr = (p, s) => {
    if (p.constant) throw new Error('Ziel darf kein Literal sein');
    if (p.type.k === 'STRING') { if (s.length > p.type.len) throw new Error(`String (${s.length} Zeichen) passt nicht in ${typeName(p.type)} – auf dem Target würde Speicher überschrieben!`); p.obj[p.key] = s; return; }
    const bytes = toBytes(p.obj[p.key], p.type);
    if (s.length + 1 > bytes.length) throw new Error('Zielbereich zu klein – Speicher würde überschrieben');
    for (let i = 0; i <= s.length; i++) bytes[i] = i < s.length ? s.charCodeAt(i) & 0xff : 0;
    p.obj[p.key] = fromBytes(bytes, 0, p.type)[0];
  };
  const refSig = ret => () => ret;
  F.BRSSTRCPY = { params: ['pDest', 'pSrc'], min: 2, max: 2, sig: refSig(T.UDINT), impl: a => { const d = deref(a[0], 'brsstrcpy'), s = deref(a[1], 'brsstrcpy'); writeStr(d, readStr(s)); return 0; } };
  F.BRSSTRCAT = { params: ['pDest', 'pSrc'], min: 2, max: 2, sig: refSig(T.UDINT), impl: a => { const d = deref(a[0], 'brsstrcat'), s = deref(a[1], 'brsstrcat'); writeStr(d, readStr(d) + readStr(s)); return 0; } };
  F.BRSSTRLEN = { params: ['pString'], min: 1, max: 1, sig: refSig(T.UDINT), impl: a => readStr(deref(a[0], 'brsstrlen')).length };
  F.BRSSTRCMP = { params: ['pString1', 'pString2'], min: 2, max: 2, sig: refSig(T.DINT), impl: a => { const x = readStr(deref(a[0], 'brsstrcmp')), y = readStr(deref(a[1], 'brsstrcmp')); return x < y ? -1 : x > y ? 1 : 0; } };
  F.BRSITOA = { params: ['value', 'pString'], min: 2, max: 2, sig: refSig(T.UDINT), impl: a => { writeStr(deref(a[1], 'brsitoa'), String(Math.trunc(a[0]))); return 0; } };
  F.BRSATOI = { params: ['pString'], min: 1, max: 1, sig: refSig(T.DINT), impl: a => { const v = parseInt(readStr(deref(a[0], 'brsatoi')), 10); return isNaN(v) ? 0 : v | 0; } };
  F.BRSFTOA = { params: ['value', 'pString'], min: 2, max: 2, sig: refSig(T.UDINT), impl: a => { writeStr(deref(a[1], 'brsftoa'), realToStr(a[0])); return 0; } };
  F.BRSATOF = { params: ['pString'], min: 1, max: 1, sig: refSig(T.REAL), impl: a => { const v = parseFloat(readStr(deref(a[0], 'brsatof'))); return isNaN(v) ? 0 : Math.fround(v); } };
  F.BRSMEMSET = {
    params: ['pDest', 'value', 'length'], min: 3, max: 3, sig: refSig(T.UDINT), impl: a => {
      const d = deref(a[0], 'brsmemset');
      const size = sizeOf(d.type);
      if (a[2] > size) throw new Error(`length ${a[2]} > SIZEOF(Ziel) ${size} – Speicher würde überschrieben`);
      const bytes = toBytes(d.obj[d.key], d.type);
      for (let i = 0; i < a[2]; i++) bytes[i] = a[1] & 0xff;
      d.obj[d.key] = fromBytes(bytes, 0, d.type)[0];
      return 0;
    }
  };
  F.BRSMEMCPY = {
    params: ['pDest', 'pSrc', 'length'], min: 3, max: 3, sig: refSig(T.UDINT), impl: a => {
      const d = deref(a[0], 'brsmemcpy'), s = deref(a[1], 'brsmemcpy');
      if (a[2] > sizeOf(d.type)) throw new Error(`length ${a[2]} > SIZEOF(Ziel) ${sizeOf(d.type)} – Speicher würde überschrieben`);
      if (a[2] > sizeOf(s.type)) throw new Error(`length ${a[2]} > SIZEOF(Quelle) ${sizeOf(s.type)}`);
      const sb = toBytes(s.obj[s.key], s.type), db = toBytes(d.obj[d.key], d.type);
      for (let i = 0; i < a[2]; i++) db[i] = sb[i];
      d.obj[d.key] = fromBytes(db, 0, d.type)[0];
      return 0;
    }
  };
  F.BRSMEMCMP = {
    params: ['pMem1', 'pMem2', 'length'], min: 3, max: 3, sig: refSig(T.DINT), impl: a => {
      const x = deref(a[0], 'brsmemcmp'), y = deref(a[1], 'brsmemcmp');
      const xb = toBytes(x.obj[x.key], x.type), yb = toBytes(y.obj[y.key], y.type);
      for (let i = 0; i < a[2]; i++) { if ((xb[i] || 0) !== (yb[i] || 0)) return (xb[i] || 0) < (yb[i] || 0) ? -1 : 1; }
      return 0;
    }
  };
  // B&R-typisch klein geschrieben – beide Schreibweisen
  for (const k of Object.keys(F)) if (k.startsWith('BRS')) F[k].lower = k.toLowerCase();

  function realToStr(v) {
    if (!isFinite(v)) return String(v);
    if (v === Math.trunc(v) && Math.abs(v) < 1e7) return String(v);
    let s = (+Math.fround(v).toPrecision(7)).toString();
    return s;
  }

  ST.builtinFns = F;

  // ---------- Konvertierungen X_TO_Y ----------
  const CONV_TYPES = ['BOOL', 'SINT', 'INT', 'DINT', 'LINT', 'USINT', 'UINT', 'UDINT', 'ULINT', 'BYTE', 'WORD', 'DWORD', 'LWORD', 'REAL', 'LREAL', 'TIME', 'STRING', 'WSTRING', 'DT', 'DATE_AND_TIME', 'DATE', 'TOD', 'TIME_OF_DAY'];
  const convCache = {};
  function kindOk(src, t) {
    if (!src) return true;
    const st = T[src] || (src === 'STRING' || src === 'WSTRING' ? { k: 'STRING' } : null);
    if (!st) return true;
    if (st.k === 'INT') return t.k === 'INT' || t.k === 'ENUM';
    if (st.k === 'REAL') return t.k === 'REAL' || t.k === 'INT';
    return st.k === t.k || (st.k === 'TIME' && t.lit);
  }
  ST.conversion = function (NAME) {
    if (convCache[NAME] !== undefined) return convCache[NAME];
    let m = /^([A-Z_]+?)_TO_([A-Z_]+)$/.exec(NAME);
    let src = null, dst = null;
    if (m && CONV_TYPES.includes(m[1]) && CONV_TYPES.includes(m[2])) { src = m[1]; dst = m[2]; }
    else if ((m = /^TO_([A-Z_]+)$/.exec(NAME)) && CONV_TYPES.includes(m[1])) dst = m[1];
    else return (convCache[NAME] = null);
    const dstT = dst === 'STRING' || dst === 'WSTRING' ? S255 : T[dst];
    const def = {
      params: ['IN'], min: 1, max: 1,
      sig: tys => { if (!kindOk(src, tys[0])) throw new Error(`erwartet ${src}, bekommt ${typeName(tys[0])}`); return dstT; },
      impl: (a, tys) => convert(a[0], tys[0], dstT)
    };
    return (convCache[NAME] = def);
  };
  function convert(v, from, to) {
    if (to.k === 'STRING') {
      switch (from.k) {
        case 'BOOL': return v ? 'TRUE' : 'FALSE';
        case 'REAL': return realToStr(v);
        case 'TIME': return 'T#' + ST.formatTime(v);
        case 'STRING': return v;
        case 'ENUM': return String(v);
        default: return String(v);
      }
    }
    if (from.k === 'STRING') {
      const s = String(v).trim();
      if (to.k === 'BOOL') return /^(TRUE|1)$/i.test(s);
      if (to.k === 'REAL') { const x = parseFloat(s); return coerce(isNaN(x) ? 0 : x, to); }
      if (to.k === 'TIME') { try { return ST.parseTime(s.replace(/^T(IME)?#/i, ''), '', 0); } catch (e) { return 0; } }
      const x = parseInt(s, 10); return coerce(isNaN(x) ? 0 : x, to);
    }
    if (to.k === 'BOOL') return v !== 0 && v !== false;
    if (from.k === 'BOOL') return coerce(v ? 1 : 0, to);
    if (from.k === 'REAL' && (to.k === 'INT' || to.k === 'TIME')) { const r = v < 0 ? -Math.round(-v) : Math.round(v); return coerce(r, to); }
    return coerce(v, to);
  }

  // ---------- Native Funktionsbausteine ----------
  function typeOf(rt, s) {
    if (typeof s !== 'string') return s;
    const U = s.toUpperCase();
    if (T[U]) return T[U];
    if (U === 'ADR') return T.REF;
    const m = /^STRING\[(\d+)\]$/.exec(U); if (m) return { k: 'STRING', name: 'STRING', len: +m[1] };
    const t = rt.types.get(lc(s)); if (t) return t;
    throw new Error('Interner Typ unbekannt: ' + s);
  }
  function nativeFB(rt, spec) {
    const def = { name: spec.name, native: true, vars: new Map(), inputList: [], entries: [] };
    def.type = { k: 'FB', name: spec.name, def };
    const add = (list, kind) => (list || []).forEach(([name, ty, init]) => {
      const e = { name, key: lc(name), type: typeOf(rt, ty), kind, init };
      def.vars.set(e.key, e); def.entries.push(e);
      if (kind === 'VAR_INPUT' || kind === 'VAR_IN_OUT') def.inputList.push(e);
    });
    add(spec.in, 'VAR_INPUT'); add(spec.inout, 'VAR_IN_OUT'); add(spec.out, 'VAR_OUTPUT');
    def.create = r => {
      const inst = {};
      for (const e of def.entries) inst[e.key] = e.kind === 'VAR_IN_OUT' ? null : (e.init !== undefined ? coerce(e.init, e.type) : defaultValue(e.type, r));
      Object.defineProperty(inst, '__s', { value: spec.state ? spec.state() : {}, enumerable: false, writable: true });
      return inst;
    };
    def.exec = (inst, r) => spec.exec(inst, r, inst.__s);
    rt.fbDefs.set(lc(spec.name), def);
    return def;
  }
  const rising = (s, key, v) => { const r = v && !s[key]; s[key] = v; return r; };

  function installStandard(rt) {
    nativeFB(rt, { name: 'TON', in: [['IN', 'BOOL'], ['PT', 'TIME']], out: [['Q', 'BOOL'], ['ET', 'TIME']], state: () => ({ run: false, start: 0 }),
      exec(i, r, s) {
        if (!i.in) { s.run = false; i.q = false; i.et = 0; return; }
        if (!s.run) { s.run = true; s.start = r.now; }
        i.et = Math.min(r.now - s.start, i.pt); i.q = i.et >= i.pt;
      } });
    nativeFB(rt, { name: 'TOF', in: [['IN', 'BOOL'], ['PT', 'TIME']], out: [['Q', 'BOOL'], ['ET', 'TIME']], state: () => ({ run: false, start: 0, prev: false }),
      exec(i, r, s) {
        if (i.in) { s.run = false; i.q = true; i.et = 0; }
        else if (i.q || s.run) {
          if (!s.run) { s.run = true; s.start = r.now; }
          i.et = Math.min(r.now - s.start, i.pt);
          if (i.et >= i.pt) { i.q = false; }
        }
        s.prev = i.in;
      } });
    nativeFB(rt, { name: 'TP', in: [['IN', 'BOOL'], ['PT', 'TIME']], out: [['Q', 'BOOL'], ['ET', 'TIME']], state: () => ({ run: false, start: 0, prev: false }),
      exec(i, r, s) {
        if (i.in && !s.prev && !s.run) { s.run = true; s.start = r.now; }
        if (s.run) { i.et = Math.min(r.now - s.start, i.pt); i.q = i.et < i.pt; if (!i.q) s.run = false; }
        else { i.q = false; if (!i.in) i.et = 0; }
        s.prev = i.in;
      } });
    nativeFB(rt, { name: 'R_TRIG', in: [['CLK', 'BOOL']], out: [['Q', 'BOOL']], state: () => ({ m: false }), exec(i, r, s) { i.q = i.clk && !s.m; s.m = i.clk; } });
    nativeFB(rt, { name: 'F_TRIG', in: [['CLK', 'BOOL']], out: [['Q', 'BOOL']], state: () => ({ m: false }), exec(i, r, s) { i.q = !i.clk && s.m; s.m = i.clk; } });
    nativeFB(rt, { name: 'SR', in: [['S1', 'BOOL'], ['R', 'BOOL']], out: [['Q1', 'BOOL']], exec(i) { i.q1 = i.s1 || (!i.r && i.q1); } });
    nativeFB(rt, { name: 'RS', in: [['S', 'BOOL'], ['R1', 'BOOL']], out: [['Q1', 'BOOL']], exec(i) { i.q1 = !i.r1 && (i.s || i.q1); } });
    nativeFB(rt, { name: 'CTU', in: [['CU', 'BOOL'], ['RESET', 'BOOL'], ['PV', 'INT']], out: [['Q', 'BOOL'], ['CV', 'INT']], state: () => ({ m: false }),
      exec(i, r, s) { const e = i.cu && !s.m; s.m = i.cu; if (i.reset) i.cv = 0; else if (e && i.cv < 32767) i.cv++; i.q = i.cv >= i.pv; } });
    nativeFB(rt, { name: 'CTD', in: [['CD', 'BOOL'], ['LOAD', 'BOOL'], ['PV', 'INT']], out: [['Q', 'BOOL'], ['CV', 'INT']], state: () => ({ m: false }),
      exec(i, r, s) { const e = i.cd && !s.m; s.m = i.cd; if (i.load) i.cv = i.pv; else if (e && i.cv > -32768) i.cv--; i.q = i.cv <= 0; } });
    nativeFB(rt, { name: 'CTUD', in: [['CU', 'BOOL'], ['CD', 'BOOL'], ['RESET', 'BOOL'], ['LOAD', 'BOOL'], ['PV', 'INT']], out: [['QU', 'BOOL'], ['QD', 'BOOL'], ['CV', 'INT']], state: () => ({ mu: false, md: false }),
      exec(i, r, s) {
        const eu = i.cu && !s.mu, ed = i.cd && !s.md; s.mu = i.cu; s.md = i.cd;
        if (i.reset) i.cv = 0; else if (i.load) i.cv = i.pv;
        else { if (eu && !ed && i.cv < 32767) i.cv++; else if (ed && !eu && i.cv > -32768) i.cv--; }
        i.qu = i.cv >= i.pv; i.qd = i.cv <= 0;
      } });
  }

  // ---------- Strukturtypen der Simulationsbausteine ----------
  function struct(rt, name, fields) {
    const st = { k: 'STRUCT', name, fields: [], fmap: new Map(), builtin: true };
    for (const [fname, ty, init] of fields) {
      const f = { name: fname, key: lc(fname), type: typeOf(rt, ty) };
      if (init !== undefined) f.initFn = () => coerce(init, f.type);
      st.fields.push(f); st.fmap.set(f.key, f);
    }
    rt.types.set(lc(name), st);
    return st;
  }
  function enumT(rt, name, members) {
    const et = { k: 'ENUM', name, members: [], map: new Map(), builtin: true };
    members.forEach(([n, v]) => { et.members.push({ name: n, value: v }); et.map.set(lc(n), v); rt.enumMembers.set(lc(n), { type: et }); });
    rt.types.set(lc(name), et);
    return et;
  }
  function konst(rt, name, ty, value) { rt.builtinConsts.set(lc(name), { type: typeOf(rt, ty), value }); }

  // ---------- Achs-Simulation ----------
  const AX_ERR = { NOT_POWERED: 1001, NOT_HOMED: 1002, SW_LIMIT: 1003, DRIVE_FAULT: 1004, INVALID_PAR: 1005, NOT_ENABLED: 1006 };
  function newAxis() {
    return { position: 0, velocity: 0, powered: false, homed: false, error: false, errorID: 0, mode: 'idle', target: 0, vmax: 0, acc: 0, dec: 0,
      vtarget: 0, cmd: 0, doneCmd: -1, abortedCmd: -1, powerTimer: 0, homeTimer: 0, homePos: 0, cfg: null, reg: false };
  }
  function axisOf(rt, adr, own) {
    let ax = adr && adr.__adr ? adr.obj[adr.key] : (adr && typeof adr === 'object' && 'position' in adr ? adr : own);
    if (!ax) return null;
    if (!ax.reg) { ax.reg = true; (rt.sim.axes = rt.sim.axes || []).push(ax); ax.cfg = rt.axisConfig || {}; }
    return ax;
  }
  function axisError(ax, id) { ax.error = true; ax.errorID = id; ax.mode = 'estop'; }
  function axisCmd(ax) { ax.cmd++; return ax.cmd; }
  function stepAxis(rt, ax) {
    const dt = rt.dt;
    const cfg = ax.cfg || {};
    if (cfg.faultVar && rt.globalsRef && rt.globalsRef[lc(cfg.faultVar)] && !ax.error) axisError(ax, AX_ERR.DRIVE_FAULT);
    if (ax.powerTimer > 0) { ax.powerTimer -= dt * 1000; if (ax.powerTimer <= 0) ax.powered = !ax.error; }
    if (!ax.powered) { ax.velocity = 0; if (ax.mode !== 'idle' && ax.mode !== 'estop') { ax.abortedCmd = ax.cmd; ax.mode = 'idle'; } return; }
    const decel = (d) => { const s = Math.sign(ax.velocity); const nv = Math.abs(ax.velocity) - d * dt; ax.velocity = nv <= 0 ? 0 : s * nv; };
    switch (ax.mode) {
      case 'estop': decel(Math.max(ax.dec, 10000)); ax.position += ax.velocity * dt; break;
      case 'home':
        ax.homeTimer -= dt * 1000;
        if (ax.homeTimer <= 0) { ax.position = ax.homePos; ax.homed = true; ax.mode = 'idle'; ax.doneCmd = ax.cmd; }
        break;
      case 'move': {
        const dist = ax.target - ax.position;
        const dir = Math.sign(dist);
        const v = ax.velocity * dir; // Geschwindigkeit in Zielrichtung
        const stopDist = v > 0 ? v * v / (2 * ax.dec) : 0;
        let nv;
        if (Math.abs(dist) <= stopDist + 1e-9) nv = Math.max(v - ax.dec * dt, 0);
        else nv = v > ax.vmax ? Math.max(v - ax.dec * dt, ax.vmax) : Math.min(v + ax.acc * dt, ax.vmax);
        let step = nv * dt;
        if (step >= Math.abs(dist) - 1e-9 || (nv === 0 && Math.abs(dist) < Math.max(1e-6, ax.dec * dt * dt))) {
          ax.position = ax.target; ax.velocity = 0; ax.mode = 'idle'; ax.doneCmd = ax.cmd;
        } else { ax.position += dir * step; ax.velocity = dir * nv; }
        break;
      }
      case 'vel': case 'jog': {
        const dv = ax.vtarget - ax.velocity;
        const a = Math.abs(ax.vtarget) >= Math.abs(ax.velocity) && Math.sign(ax.vtarget || 1) === Math.sign(ax.velocity || ax.vtarget || 1) ? ax.acc : ax.dec;
        if (Math.abs(dv) <= a * dt) ax.velocity = ax.vtarget; else ax.velocity += Math.sign(dv) * a * dt;
        ax.position += ax.velocity * dt;
        if (ax.velocity === ax.vtarget && ax.mode === 'vel') ax.inVel = true;
        break;
      }
      case 'stop': case 'halt':
        decel(ax.dec);
        ax.position += ax.velocity * dt;
        if (ax.velocity === 0) { ax.doneCmd = ax.cmd; ax.mode = ax.mode === 'stop' ? 'stopped' : 'idle'; }
        break;
      default: ax.velocity = 0;
    }
    if (ax.mode === 'jog' && ax.homed) { // Tippen stoppt an der Software-Endlage (kein Fehler)
      if (cfg.min !== undefined && ax.position <= cfg.min && ax.velocity < 0) { ax.position = cfg.min; ax.velocity = 0; ax.vtarget = 0; }
      if (cfg.max !== undefined && ax.position >= cfg.max && ax.velocity > 0) { ax.position = cfg.max; ax.velocity = 0; ax.vtarget = 0; }
    }
    if (cfg.min !== undefined && ax.homed && ax.position < cfg.min) { ax.position = cfg.min; ax.velocity = 0; axisError(ax, AX_ERR.SW_LIMIT); }
    if (cfg.max !== undefined && ax.homed && ax.position > cfg.max) { ax.position = cfg.max; ax.velocity = 0; axisError(ax, AX_ERR.SW_LIMIT); }
  }
  function startMove(ax, target, v, a, d) {
    if (!ax.powered) { axisError(ax, AX_ERR.NOT_POWERED); return -1; }
    if (!ax.homed) { axisError(ax, AX_ERR.NOT_HOMED); return -1; }
    if (!(v > 0) || !(a > 0) || !(d > 0)) { axisError(ax, AX_ERR.INVALID_PAR); return -1; }
    const cfg = ax.cfg || {};
    if ((cfg.min !== undefined && target < cfg.min) || (cfg.max !== undefined && target > cfg.max)) { axisError(ax, AX_ERR.SW_LIMIT); return -1; }
    if (ax.mode !== 'idle' && ax.mode !== 'stopped') ax.abortedCmd = ax.cmd;
    const id = axisCmd(ax);
    ax.mode = 'move'; ax.target = target; ax.vmax = v; ax.acc = a; ax.dec = d; ax.inVel = false;
    return id;
  }
  function startVel(ax, v, a, d, mode) {
    if (!ax.powered) { axisError(ax, AX_ERR.NOT_POWERED); return -1; }
    if (!(a > 0) || !(d > 0)) { axisError(ax, AX_ERR.INVALID_PAR); return -1; }
    if (ax.mode !== 'idle' && ax.mode !== 'stopped' && ax.mode !== mode) ax.abortedCmd = ax.cmd;
    const id = axisCmd(ax);
    ax.mode = mode || 'vel'; ax.vtarget = v; ax.acc = a; ax.dec = d; ax.inVel = false;
    return id;
  }

  function installMotion(rt) {
    rt.types.set('axis_ref', { k: 'OPAQUE', name: 'AXIS_REF', builtin: true, create: newAxis, size: 4,
      show: a => `Pos ${(+a.position).toFixed(2)} · v ${(+a.velocity).toFixed(1)} · ${a.error ? 'Fehler ' + a.errorID : a.powered ? (a.homed ? 'bereit' : 'nicht referenziert') : 'aus'}`,
      fmap: new Map([['position', { key: 'position', type: T.LREAL }], ['velocity', { key: 'velocity', type: T.REAL }], ['poweron', { key: 'powered', type: T.BOOL }], ['ishomed', { key: 'homed', type: T.BOOL }], ['error', { key: 'error', type: T.BOOL }], ['errorid', { key: 'errorID', type: T.DINT }]]) });
    rt.types.set('mcaxistype', rt.types.get('axis_ref'));
    enumT(rt, 'McDirectionEnum', [['mcDIR_POSITIVE', 0], ['mcDIR_NEGATIVE', 1], ['mcDIR_CURRENT', 2], ['mcDIR_SHORTEST_WAY', 3]]);
    enumT(rt, 'McHomingModeEnum', [['mcHOMING_DIRECT', 0], ['mcHOMING_DEFAULT', 1]]);
    struct(rt, 'MpAxisHomingType', [['Mode', 'McHomingModeEnum'], ['Position', 'LREAL']]);
    struct(rt, 'MpAxisJogType', [['Velocity', 'REAL', 10], ['Acceleration', 'REAL', 100], ['Deceleration', 'REAL', 100]]);
    struct(rt, 'MpAxisStopType', [['Deceleration', 'REAL', 0]]);
    struct(rt, 'MpAxisBasicParType', [['Position', 'LREAL'], ['Distance', 'LREAL'], ['Velocity', 'REAL', 10], ['Acceleration', 'REAL', 100], ['Deceleration', 'REAL', 100], ['Direction', 'McDirectionEnum'], ['Homing', 'MpAxisHomingType'], ['Jog', 'MpAxisJogType'], ['Stop', 'MpAxisStopType']]);
    struct(rt, 'MpAxisBasicInfoType', [['AxisInitialized', 'BOOL'], ['ReadyToPowerOn', 'BOOL'], ['PLCopenState', 'STRING[32]'], ['ErrorText', 'STRING[80]']]);
    for (const [k, v] of Object.entries(AX_ERR)) konst(rt, 'mcSIM_ERR_' + k, 'DINT', v);

    nativeFB(rt, {
      name: 'MpAxisBasic',
      in: [['MpLink', 'ADR'], ['Enable', 'BOOL'], ['ErrorReset', 'BOOL'], ['Parameters', 'ADR'], ['Update', 'BOOL'], ['Power', 'BOOL'], ['Home', 'BOOL'],
        ['MoveVelocity', 'BOOL'], ['MoveAbsolute', 'BOOL'], ['MoveAdditive', 'BOOL'], ['Stop', 'BOOL'], ['JogPositive', 'BOOL'], ['JogNegative', 'BOOL'], ['ReleaseBrake', 'BOOL']],
      out: [['Active', 'BOOL'], ['Error', 'BOOL'], ['StatusID', 'DINT'], ['UpdateDone', 'BOOL'], ['Position', 'LREAL'], ['Velocity', 'REAL'], ['CommandBusy', 'BOOL'], ['CommandAborted', 'BOOL'],
        ['PowerOn', 'BOOL'], ['IsHomed', 'BOOL'], ['InVelocity', 'BOOL'], ['InPosition', 'BOOL'], ['MoveActive', 'BOOL'], ['Stopped', 'BOOL'], ['Info', 'MpAxisBasicInfoType']],
      state: () => ({ own: newAxis(), e: {}, cmd: -1, kind: '' }),
      exec(i, r, s) {
        const ax = axisOf(r, i.mplink, s.own);
        const par = i.parameters && i.parameters.__adr ? i.parameters.obj[i.parameters.key] : null;
        const P = par || { position: 0, distance: 0, velocity: 10, acceleration: 100, deceleration: 100, direction: 0, homing: { mode: 0, position: 0 }, jog: { velocity: 10, acceleration: 100, deceleration: 100 }, stop: { deceleration: 0 } };
        if (!i.enable) {
          if (ax.powered || ax.powerTimer > 0) { ax.powered = false; ax.powerTimer = 0; }
          Object.assign(i, { active: false, error: false, statusid: 0, poweron: false, ishomed: false, inposition: false, invelocity: false, moveactive: false, stopped: false, commandbusy: false, commandaborted: false });
          s.e = {}; s.cmd = -1; return;
        }
        i.active = true;
        const e = s.e;
        if (rising(e, 'reset', i.errorreset) && ax.error) { ax.error = false; ax.errorID = 0; ax.mode = 'idle'; ax.velocity = 0; }
        // Power (Pegel)
        if (i.power && !ax.powered && ax.powerTimer <= 0 && !ax.error) ax.powerTimer = 100;
        if (!i.power && (ax.powered || ax.powerTimer > 0)) { ax.powered = false; ax.powerTimer = 0; if (ax.mode !== 'idle') { ax.abortedCmd = ax.cmd; ax.mode = 'idle'; } ax.velocity = 0; }
        const startOk = () => { if (!ax.powered) { axisError(ax, AX_ERR.NOT_POWERED); return false; } return !ax.error; };
        if (rising(e, 'home', i.home) && startOk()) { s.cmd = axisCmd(ax); s.kind = 'home'; ax.mode = 'home'; ax.homeTimer = 200; ax.homed = false; ax.homePos = P.homing ? +P.homing.position : 0; }
        if (rising(e, 'abs', i.moveabsolute) && startOk()) { s.cmd = startMove(ax, +P.position, +P.velocity, +P.acceleration, +P.deceleration); s.kind = 'abs'; }
        if (rising(e, 'add', i.moveadditive) && startOk()) { s.cmd = startMove(ax, ax.position + +P.distance, +P.velocity, +P.acceleration, +P.deceleration); s.kind = 'add'; }
        if (rising(e, 'vel', i.movevelocity) && startOk()) { if (!ax.homed && false) axisError(ax, AX_ERR.NOT_HOMED); else { s.cmd = startVel(ax, (P.direction === 1 ? -1 : 1) * Math.abs(+P.velocity), +P.acceleration, +P.deceleration, 'vel'); s.kind = 'vel'; } }
        // Jog (Pegel)
        const jog = i.jogpositive ? 1 : i.jognegative ? -1 : 0;
        if (jog && !s.jog && startOk()) { s.cmd = startVel(ax, jog * Math.abs(+(P.jog ? P.jog.velocity : 10)), +(P.jog ? P.jog.acceleration : 100), +(P.jog ? P.jog.deceleration : 100), 'jog'); s.kind = 'jog'; }
        if (!jog && s.jog && ax.mode === 'jog') { ax.mode = 'halt'; ax.dec = +(P.jog ? P.jog.deceleration : 100) || 100; s.cmd = axisCmd(ax); s.kind = 'halt'; }
        s.jog = jog;
        // Stop (Pegel)
        if (rising(e, 'stop', i.stop) && ax.powered) { if (ax.mode !== 'idle' && ax.mode !== 'stopped') ax.abortedCmd = ax.cmd; s.cmd = axisCmd(ax); s.kind = 'stop'; ax.mode = 'stop'; ax.dec = +(P.stop && P.stop.deceleration) || +P.deceleration || 100; }
        if (!i.stop && ax.mode === 'stopped') ax.mode = 'idle';
        if (i.update) { i.updatedone = true; } else i.updatedone = false;
        i.error = ax.error; i.statusid = ax.error ? ax.errorID : 0;
        i.poweron = ax.powered; i.ishomed = ax.homed;
        i.position = ax.position; i.velocity = Math.fround(ax.velocity);
        i.moveactive = ['move', 'vel', 'jog', 'home', 'halt'].includes(ax.mode);
        i.inposition = (s.kind === 'abs' || s.kind === 'add') && ax.doneCmd === s.cmd && ax.mode === 'idle';
        i.invelocity = s.kind === 'vel' && ax.mode === 'vel' && ax.inVel;
        i.stopped = i.stop && (ax.mode === 'stopped' || (ax.mode === 'idle' && ax.velocity === 0));
        i.commandbusy = ax.mode === 'home' || (ax.mode === 'move');
        i.commandaborted = s.cmd >= 0 && ax.abortedCmd === s.cmd;
        i.info.axisinitialized = true; i.info.readytopoweron = !ax.error;
        i.info.plcopenstate = plcState(ax);
        i.info.errortext = ax.error ? errText(ax.errorID) : '';
      }
    });
    // PLCopen
    const mcOut = [['Done', 'BOOL'], ['Busy', 'BOOL'], ['Active', 'BOOL'], ['CommandAborted', 'BOOL'], ['Error', 'BOOL'], ['ErrorID', 'DINT']];
    const execFB = (name, extraIn, start, isDone) => nativeFB(rt, {
      name, in: [['Axis', 'ADR'], ['Execute', 'BOOL'], ...extraIn], out: mcOut, state: () => ({ prev: false, cmd: -1, busy: false, fin: false }),
      exec(i, r, s) {
        const ax = axisOf(r, i.axis, null);
        if (!ax) { i.error = true; i.errorid = 1006; return; }
        const edge = i.execute && !s.prev; s.prev = i.execute;
        if (edge) {
          i.done = false; i.error = false; i.errorid = 0; i.commandaborted = false;
          const id = start(i, ax);
          if (id < 0) { i.error = true; i.errorid = ax.errorID || AX_ERR.INVALID_PAR; s.busy = false; s.fin = true; }
          else { s.cmd = id; s.busy = true; s.fin = false; }
        }
        if (s.busy) {
          if (ax.error) { s.busy = false; s.fin = true; i.error = true; i.errorid = ax.errorID; }
          else if (ax.abortedCmd === s.cmd) { s.busy = false; s.fin = true; i.commandaborted = true; }
          else if (isDone(ax, s.cmd)) { s.busy = false; s.fin = true; i.done = true; }
        }
        i.busy = s.busy; i.active = s.busy && ax.cmd === s.cmd;
        if (!i.execute && s.fin && !edge) { // Ausgänge nach fallender Flanke zurücksetzen (mind. 1 Zyklus sichtbar)
          if (s.shown) { i.done = false; i.error = false; i.errorid = 0; i.commandaborted = false; s.fin = false; s.shown = false; } else s.shown = true;
        } else s.shown = false;
      }
    });
    const doneByCmd = (ax, id) => ax.doneCmd === id;
    execFB('MC_Home', [['Position', 'LREAL'], ['HomingMode', 'McHomingModeEnum']], (i, ax) => { if (!ax.powered) { axisError(ax, AX_ERR.NOT_POWERED); return -1; } if (ax.mode !== 'idle' && ax.mode !== 'stopped') ax.abortedCmd = ax.cmd; const id = axisCmd(ax); ax.mode = 'home'; ax.homeTimer = 200; ax.homed = false; ax.homePos = +i.position; return id; }, doneByCmd);
    execFB('MC_MoveAbsolute', [['Position', 'LREAL'], ['Velocity', 'REAL'], ['Acceleration', 'REAL'], ['Deceleration', 'REAL'], ['Direction', 'McDirectionEnum']], (i, ax) => startMove(ax, +i.position, +i.velocity, +i.acceleration, +i.deceleration), doneByCmd);
    execFB('MC_MoveRelative', [['Distance', 'LREAL'], ['Velocity', 'REAL'], ['Acceleration', 'REAL'], ['Deceleration', 'REAL']], (i, ax) => startMove(ax, ax.position + +i.distance, +i.velocity, +i.acceleration, +i.deceleration), doneByCmd);
    execFB('MC_MoveAdditive', [['Distance', 'LREAL'], ['Velocity', 'REAL'], ['Acceleration', 'REAL'], ['Deceleration', 'REAL']], (i, ax) => startMove(ax, (ax.mode === 'move' ? ax.target : ax.position) + +i.distance, +i.velocity, +i.acceleration, +i.deceleration), doneByCmd);
    execFB('MC_Halt', [['Deceleration', 'REAL']], (i, ax) => { if (!ax.powered) { axisError(ax, AX_ERR.NOT_POWERED); return -1; } if (ax.mode !== 'idle') ax.abortedCmd = ax.cmd; const id = axisCmd(ax); ax.mode = 'halt'; ax.dec = +i.deceleration || 100; if (ax.velocity === 0) { ax.mode = 'idle'; ax.doneCmd = id; } return id; }, doneByCmd);
    execFB('MC_Reset', [], (i, ax) => { const id = axisCmd(ax); if (ax.error) { ax.error = false; ax.errorID = 0; ax.mode = 'idle'; ax.velocity = 0; } ax.doneCmd = id; return id; }, doneByCmd);
    // MC_Stop: Achse bleibt in "Stopping", solange Execute TRUE
    nativeFB(rt, { name: 'MC_Stop', in: [['Axis', 'ADR'], ['Execute', 'BOOL'], ['Deceleration', 'REAL']], out: mcOut, state: () => ({ prev: false, cmd: -1 }),
      exec(i, r, s) {
        const ax = axisOf(r, i.axis, null); if (!ax) { i.error = true; return; }
        if (i.execute && !s.prev) {
          if (!ax.powered) { i.error = true; i.errorid = AX_ERR.NOT_POWERED; }
          else { if (ax.mode !== 'idle' && ax.mode !== 'stopped') ax.abortedCmd = ax.cmd; s.cmd = axisCmd(ax); ax.mode = 'stop'; ax.dec = +i.deceleration || 100; i.done = false; i.error = false; }
        }
        s.prev = i.execute;
        i.busy = i.execute && ax.mode === 'stop';
        i.done = i.execute && (ax.mode === 'stopped' || (ax.doneCmd === s.cmd && ax.velocity === 0));
        if (!i.execute) { if (ax.mode === 'stopped') ax.mode = 'idle'; i.done = false; i.busy = false; i.error = false; }
        i.active = i.busy;
      } });
    nativeFB(rt, { name: 'MC_MoveVelocity', in: [['Axis', 'ADR'], ['Execute', 'BOOL'], ['Velocity', 'REAL'], ['Acceleration', 'REAL'], ['Deceleration', 'REAL'], ['Direction', 'McDirectionEnum']],
      out: [['InVelocity', 'BOOL'], ['Busy', 'BOOL'], ['Active', 'BOOL'], ['CommandAborted', 'BOOL'], ['Error', 'BOOL'], ['ErrorID', 'DINT']], state: () => ({ prev: false, cmd: -1, busy: false }),
      exec(i, r, s) {
        const ax = axisOf(r, i.axis, null); if (!ax) { i.error = true; return; }
        if (i.execute && !s.prev) {
          i.error = false; i.errorid = 0; i.commandaborted = false; i.invelocity = false;
          const id = startVel(ax, (i.direction === 1 ? -1 : 1) * Math.abs(+i.velocity), +i.acceleration, +i.deceleration, 'vel');
          if (id < 0) { i.error = true; i.errorid = ax.errorID; s.busy = false; } else { s.cmd = id; s.busy = true; }
        }
        s.prev = i.execute;
        if (s.busy) {
          if (ax.error) { s.busy = false; i.error = true; i.errorid = ax.errorID; i.invelocity = false; }
          else if (ax.abortedCmd === s.cmd || ax.cmd !== s.cmd) { s.busy = false; i.commandaborted = true; i.invelocity = false; }
          else i.invelocity = ax.mode === 'vel' && !!ax.inVel;
        }
        i.busy = s.busy; i.active = s.busy;
        if (!i.execute && !s.busy) { i.invelocity = false; i.commandaborted = false; i.error = i.error && false; }
      } });
    nativeFB(rt, { name: 'MC_Power', in: [['Axis', 'ADR'], ['Enable', 'BOOL']], out: [['Status', 'BOOL'], ['Busy', 'BOOL'], ['Error', 'BOOL'], ['ErrorID', 'DINT']],
      exec(i, r) {
        const ax = axisOf(r, i.axis, null); if (!ax) { i.error = true; return; }
        if (i.enable) { if (!ax.powered && ax.powerTimer <= 0 && !ax.error) ax.powerTimer = 100; }
        else if (ax.powered || ax.powerTimer > 0) { ax.powered = false; ax.powerTimer = 0; if (ax.mode !== 'idle' && ax.mode !== 'estop') { ax.abortedCmd = ax.cmd; ax.mode = 'idle'; } ax.velocity = 0; }
        i.status = ax.powered; i.busy = i.enable; i.error = i.enable && ax.error && !ax.powered && ax.powerTimer <= 0 && false; i.errorid = 0;
      } });
    nativeFB(rt, { name: 'MC_ReadActualPosition', in: [['Axis', 'ADR'], ['Enable', 'BOOL']], out: [['Valid', 'BOOL'], ['Busy', 'BOOL'], ['Error', 'BOOL'], ['ErrorID', 'DINT'], ['Position', 'LREAL']],
      exec(i, r) { const ax = axisOf(r, i.axis, null); if (!ax) return; i.valid = i.enable; i.busy = i.enable; i.position = i.enable ? ax.position : i.position; } });
    nativeFB(rt, { name: 'MC_ReadActualVelocity', in: [['Axis', 'ADR'], ['Enable', 'BOOL']], out: [['Valid', 'BOOL'], ['Busy', 'BOOL'], ['Error', 'BOOL'], ['ErrorID', 'DINT'], ['Velocity', 'REAL']],
      exec(i, r) { const ax = axisOf(r, i.axis, null); if (!ax) return; i.valid = i.enable; i.busy = i.enable; i.velocity = i.enable ? ax.velocity : i.velocity; } });
    nativeFB(rt, { name: 'MC_ReadAxisError', in: [['Axis', 'ADR'], ['Enable', 'BOOL']], out: [['Valid', 'BOOL'], ['Busy', 'BOOL'], ['Error', 'BOOL'], ['ErrorID', 'DINT'], ['AxisErrorID', 'DINT']],
      exec(i, r) { const ax = axisOf(r, i.axis, null); if (!ax) return; i.valid = i.enable; i.busy = i.enable; i.axiserrorid = ax.error ? ax.errorID : 0; } });
    nativeFB(rt, { name: 'MC_ReadStatus', in: [['Axis', 'ADR'], ['Enable', 'BOOL']],
      out: [['Valid', 'BOOL'], ['Busy', 'BOOL'], ['Error', 'BOOL'], ['ErrorID', 'DINT'], ['ErrorStop', 'BOOL'], ['Disabled', 'BOOL'], ['Stopping', 'BOOL'], ['Homing', 'BOOL'], ['StandStill', 'BOOL'], ['DiscreteMotion', 'BOOL'], ['ContinuousMotion', 'BOOL'], ['SynchronizedMotion', 'BOOL']],
      exec(i, r) {
        const ax = axisOf(r, i.axis, null); if (!ax) return;
        const st = plcState(ax);
        i.valid = i.enable; i.busy = i.enable;
        i.errorstop = st === 'ErrorStop'; i.disabled = st === 'Disabled'; i.stopping = st === 'Stopping'; i.homing = st === 'Homing';
        i.standstill = st === 'StandStill'; i.discretemotion = st === 'DiscreteMotion'; i.continuousmotion = st === 'ContinuousMotion'; i.synchronizedmotion = false;
      } });
  }
  function plcState(ax) {
    if (ax.error) return 'ErrorStop';
    if (!ax.powered) return 'Disabled';
    switch (ax.mode) {
      case 'home': return 'Homing';
      case 'move': case 'halt': return 'DiscreteMotion';
      case 'vel': case 'jog': return 'ContinuousMotion';
      case 'stop': case 'stopped': return 'Stopping';
      default: return 'StandStill';
    }
  }
  function errText(id) {
    return { 1001: 'Achse nicht eingeschaltet (Power fehlt)', 1002: 'Achse nicht referenziert (Home fehlt)', 1003: 'Software-Endlage erreicht/Ziel außerhalb', 1004: 'Antriebsfehler', 1005: 'Ungültige Parameter (Geschwindigkeit/Beschleunigung ≤ 0)', 1006: 'Achse nicht verbunden' }[id] || 'Fehler ' + id;
  }

  // ---------- mapp Control ----------
  function installControl(rt) {
    struct(rt, 'MTPIDParametersType', [['Gain', 'REAL', 1], ['IntegrationTime', 'REAL', 0], ['DerivativeTime', 'REAL', 0], ['FilterTime', 'REAL', 0]]);
    nativeFB(rt, { name: 'MTBasicsPID',
      in: [['Enable', 'BOOL'], ['PIDParameters', 'MTPIDParametersType'], ['MinOut', 'REAL', -100], ['MaxOut', 'REAL', 100], ['Invert', 'BOOL'], ['Update', 'BOOL'], ['SetValue', 'REAL'], ['ActValue', 'REAL'], ['HoldOut', 'BOOL'], ['TrackingValue', 'REAL'], ['EnableTracking', 'BOOL']],
      out: [['Active', 'BOOL'], ['Error', 'BOOL'], ['StatusID', 'DINT'], ['UpdateDone', 'BOOL'], ['Out', 'REAL'], ['ControlError', 'REAL'], ['ProportionalPart', 'REAL'], ['IntegrationPart', 'REAL'], ['DerivativePart', 'REAL'], ['TrackingActive', 'BOOL']],
      state: () => ({ i: 0, prevE: 0, d: 0, first: true }),
      exec(i, r, s) {
        if (!i.enable) { Object.assign(i, { active: false, out: 0, controlerror: 0, proportionalpart: 0, integrationpart: 0, derivativepart: 0, error: false, statusid: 0 }); s.i = 0; s.first = true; s.d = 0; return; }
        const P = i.pidparameters;
        if (i.minout >= i.maxout) { i.error = true; i.statusid = -1; i.active = false; return; }
        i.error = false; i.statusid = 0; i.active = true; i.updatedone = i.update;
        const dt = r.dt;
        let e = i.setvalue - i.actvalue; if (i.invert) e = -e;
        const kp = P.gain;
        const pPart = kp * e;
        let dPart = 0;
        if (P.derivativetime > 0 && !s.first) {
          const raw = kp * P.derivativetime * (e - s.prevE) / dt;
          const a = P.filtertime > 0 ? dt / (P.filtertime + dt) : 1;
          s.d = s.d + a * (raw - s.d); dPart = s.d;
        }
        if (i.enabletracking) { s.i = i.trackingvalue - pPart - dPart; i.trackingactive = true; }
        else if (!i.holdout && P.integrationtime > 0) {
          const ni = s.i + kp * e * dt / P.integrationtime;
          const u = pPart + ni + dPart;
          // Anti-Windup: Integrator nur, wenn Ausgang nicht in der Begrenzung weiter getrieben wird
          if ((u > i.maxout && e * kp > 0) || (u < i.minout && e * kp < 0)) s.i = Math.min(Math.max(s.i, i.minout - pPart - dPart), i.maxout - pPart - dPart);
          else s.i = ni;
          i.trackingactive = false;
        }
        if (!(P.integrationtime > 0)) s.i = 0;
        s.prevE = e; s.first = false;
        const out = i.holdout ? i.out : Math.min(Math.max(pPart + s.i + dPart, i.minout), i.maxout);
        i.out = Math.fround(out); i.controlerror = Math.fround(e);
        i.proportionalpart = Math.fround(pPart); i.integrationpart = Math.fround(s.i); i.derivativepart = Math.fround(dPart);
      } });
    nativeFB(rt, { name: 'MTBasicsPT1', in: [['Enable', 'BOOL'], ['Gain', 'REAL', 1], ['TimeConstant', 'REAL'], ['Update', 'BOOL'], ['In', 'REAL']], out: [['Active', 'BOOL'], ['Error', 'BOOL'], ['StatusID', 'DINT'], ['UpdateDone', 'BOOL'], ['Out', 'REAL']],
      state: () => ({ y: 0 }),
      exec(i, r, s) {
        if (!i.enable) { i.active = false; i.out = 0; s.y = 0; return; }
        if (i.timeconstant < 0) { i.error = true; i.statusid = -1; return; }
        i.active = true; i.error = false;
        const a = i.timeconstant > 0 ? r.dt / (i.timeconstant + r.dt) : 1;
        s.y += a * (i.gain * i.in - s.y); i.out = Math.fround(s.y); i.updatedone = i.update;
      } });
    nativeFB(rt, { name: 'MTBasicsPWM', in: [['Enable', 'BOOL'], ['DutyCycle', 'REAL'], ['Period', 'REAL', 1], ['MinPulseWidth', 'REAL'], ['Update', 'BOOL']], out: [['Active', 'BOOL'], ['Error', 'BOOL'], ['StatusID', 'DINT'], ['UpdateDone', 'BOOL'], ['Out', 'BOOL']],
      state: () => ({ t0: 0 }),
      exec(i, r, s) {
        if (!i.enable) { i.active = false; i.out = false; s.t0 = r.now; return; }
        if (!(i.period > 0)) { i.error = true; i.statusid = -1; return; }
        i.active = true; i.error = false;
        const per = i.period * 1000;
        const ph = (r.now - s.t0) % per;
        let on = Math.min(Math.max(i.dutycycle, 0), 100) / 100 * per;
        if (on > 0 && on < i.minpulsewidth * 1000) on = 0;
        i.out = ph < on; i.updatedone = i.update;
      } });
  }

  // ---------- Kommunikation (AsTCP-ähnlich, simulierte Gegenstelle) ----------
  const TCP = { ERR_OK: 0, ERR_FUB_BUSY: 65535, ERR_FUB_ENABLE_FALSE: 65534, tcpERR_NO_DATA: 32605, tcpERR_NOT_CONNECTED: 32609, tcpERR_INVALID_IDENT: 32600, tcpERR_INVALID: 32608, tcpERR_SOCKET_CREATE: 32602, tcpERR_TIMEOUT: 32652 };
  function tcpState(rt) { return rt.sim.tcp || (rt.sim.tcp = { sockets: new Map(), next: 1001, server: rt.tcpServer || { ip: '127.0.0.1', port: 5000, mode: 'echo' } }); }
  function asyncFB(rt, name, ins, outs, startFn) {
    nativeFB(rt, { name, in: [['enable', 'BOOL'], ...ins], out: [['status', 'UINT'], ...outs], state: () => ({ pending: 0 }),
      exec(i, r, s) {
        if (!i.enable) { i.status = TCP.ERR_FUB_ENABLE_FALSE; s.pending = 0; return; }
        if (!s.pending) { s.pending = 1; i.status = TCP.ERR_FUB_BUSY; return; }
        s.pending = 0;
        i.status = startFn(i, r, tcpState(r));
      } });
  }
  function adrBytes(p, len) { if (!p || !p.__adr) throw new Error('pData muss ADR(variable) sein'); const b = toBytes(p.obj[p.key], p.type); return b.slice(0, len); }
  function adrStr(p) { if (!p) return ''; if (p.__adr) { const v = p.obj[p.key]; return typeof v === 'string' ? v : ''; } return ''; }
  function installComm(rt) {
    for (const [k, v] of Object.entries(TCP)) konst(rt, k, 'UINT', v);
    konst(rt, 'tcpOPT_REUSEADDR', 'UDINT', 1);
    asyncFB(rt, 'TcpOpen', [['pIfAddr', 'ADR'], ['port', 'UINT'], ['options', 'UDINT']], [['ident', 'UDINT']], (i, r, st) => {
      const id = st.next++; st.sockets.set(id, { connected: false, rx: [], port: i.port }); i.ident = id; return TCP.ERR_OK;
    });
    asyncFB(rt, 'TcpClient', [['ident', 'UDINT'], ['portserv', 'UINT'], ['pServer', 'ADR']], [], (i, r, st) => {
      const so = st.sockets.get(i.ident); if (!so) return TCP.tcpERR_INVALID_IDENT;
      const ip = adrStr(i.pserver);
      if (ip !== st.server.ip || i.portserv !== st.server.port) return TCP.tcpERR_TIMEOUT;
      if (r.tcpOffline) return TCP.tcpERR_TIMEOUT;
      so.connected = true; return TCP.ERR_OK;
    });
    asyncFB(rt, 'TcpSend', [['ident', 'UDINT'], ['pData', 'ADR'], ['datalen', 'UDINT'], ['flags', 'UDINT']], [['sentlen', 'UDINT']], (i, r, st) => {
      const so = st.sockets.get(i.ident); if (!so) return TCP.tcpERR_INVALID_IDENT;
      if (!so.connected || r.tcpOffline) { so.connected = false; return TCP.tcpERR_NOT_CONNECTED; }
      const bytes = adrBytes(i.pdata, i.datalen);
      i.sentlen = bytes.length;
      const reply = st.server.mode === 'upper' ? bytes.map(b => (b >= 97 && b <= 122 ? b - 32 : b)) : bytes;
      (st.lastSent = st.lastSent || []).push(bytes);
      so.rx.push(...reply);
      return TCP.ERR_OK;
    });
    asyncFB(rt, 'TcpRecv', [['ident', 'UDINT'], ['pData', 'ADR'], ['datamax', 'UDINT'], ['flags', 'UDINT']], [['recvlen', 'UDINT']], (i, r, st) => {
      const so = st.sockets.get(i.ident); if (!so) return TCP.tcpERR_INVALID_IDENT;
      if (!so.connected || r.tcpOffline) { so.connected = false; i.recvlen = 0; return TCP.tcpERR_NOT_CONNECTED; }
      if (!so.rx.length) { i.recvlen = 0; return TCP.tcpERR_NO_DATA; }
      const p = i.pdata; if (!p || !p.__adr) throw new Error('pData muss ADR(variable) sein');
      const max = Math.min(i.datamax, sizeOf(p.type));
      const chunk = so.rx.splice(0, max);
      const buf = toBytes(p.obj[p.key], p.type);
      for (let k = 0; k < chunk.length; k++) buf[k] = chunk[k];
      if (p.type.k === 'STRING' && chunk.length < buf.length) buf[chunk.length] = 0;
      p.obj[p.key] = fromBytes(buf, 0, p.type)[0];
      i.recvlen = chunk.length; return TCP.ERR_OK;
    });
    asyncFB(rt, 'TcpClose', [['ident', 'UDINT'], ['how', 'UDINT']], [], (i, r, st) => {
      if (!st.sockets.has(i.ident)) return TCP.tcpERR_INVALID_IDENT;
      st.sockets.delete(i.ident); return TCP.ERR_OK;
    });
  }

  // ---------- mapp AlarmX (vereinfacht) ----------
  function alarms(rt) { return rt.sim.alarms || (rt.sim.alarms = new Map()); }
  function installAlarms(rt) {
    rt.types.set('mpcomidenttype', { k: 'OPAQUE', name: 'MpComIdentType', builtin: true, create: () => ({}), show: () => 'MpLink', size: 8 });
    enumT(rt, 'MpAlarmXAlarmStateEnum', [['mpALARMX_STATE_NONE', 0], ['mpALARMX_STATE_ACTIVE', 1], ['mpALARMX_STATE_ACKNOWLEDGED', 2]]);
    const alarmFn = (name, extra, impl, ret) => {
      F[name.toUpperCase()] = { params: ['MpLink', 'Name', ...extra], lower: name,
        special(n, comp, ordered) {
          if (ordered.length !== 2 + extra.length) comp.err(`${name} erwartet ${2 + extra.length} Parameter (MpLink, Name${extra.length ? ', ' + extra.join(', ') : ''})`, n);
          const link = comp.expr(ordered[0].expr);
          if (link.ty.k !== 'OPAQUE' && link.ty.k !== 'REF') comp.err(`${name}: MpLink muss die Core-Variable sein (z. B. gAlarmXCore)`, n);
          const nm = comp.expr(ordered[1].expr);
          if (nm.ty.k !== 'STRING') comp.err(`${name}: Name muss ein STRING sein`, n);
          const ex = ordered.slice(2).map(a => comp.expr(a.expr).ev);
          const rt2 = comp.rt;
          return { ty: ret, ev: env => impl(alarms(rt2), String(nm.ev(env)), ex.map(e => e(env)), rt2) };
        } };
    };
    alarmFn('MpAlarmXSet', [], (al, n, x, r) => { const a = al.get(n) || { active: false, acked: true, count: 0 }; if (!a.active) { a.active = true; a.acked = false; a.count++; a.since = r.now; } al.set(n, a); return a.count; }, T.UDINT);
    alarmFn('MpAlarmXReset', [], (al, n) => { const a = al.get(n); if (a) { a.active = false; if (a.acked) al.delete(n); } return 0; }, T.DINT);
    alarmFn('MpAlarmXAcknowledge', [], (al, n) => { const a = al.get(n); if (a) { a.acked = true; if (!a.active) al.delete(n); } return 0; }, T.DINT);
    alarmFn('MpAlarmXCheckState', ['State'], (al, n, x) => { const a = al.get(n); if (!a) return x[0] === 0; if (x[0] === 1) return a.active; if (x[0] === 2) return a.acked; return false; }, T.BOOL);
    nativeFB(rt, { name: 'MpAlarmXCore', in: [['MpLink', 'ADR'], ['Enable', 'BOOL'], ['ErrorReset', 'BOOL']], out: [['Active', 'BOOL'], ['Error', 'BOOL'], ['StatusID', 'DINT'], ['ActiveAlarms', 'UDINT'], ['PendingAlarms', 'UDINT']],
      exec(i, r) {
        i.active = i.enable;
        const al = alarms(r);
        let act = 0, pend = 0; for (const a of al.values()) { if (a.active) act++; if (a.active || !a.acked) pend++; }
        i.activealarms = i.enable ? act : 0; i.pendingalarms = i.enable ? pend : 0;
      } });
    nativeFB(rt, { name: 'MpAlarmXAcknowledgeAll', in: [['MpLink', 'ADR'], ['Execute', 'BOOL']], out: [['Done', 'BOOL'], ['Error', 'BOOL']], state: () => ({ prev: false }),
      exec(i, r, s) { if (i.execute && !s.prev) { const al = alarms(r); for (const [k, a] of al) { a.acked = true; if (!a.active) al.delete(k); } i.done = true; } if (!i.execute) i.done = false; s.prev = i.execute; } });
  }

  // ---------- Installation ----------
  ST.installLibrary = function (rt) {
    installStandard(rt);
    installMotion(rt);
    installControl(rt);
    installComm(rt);
    installAlarms(rt);
    // klein geschriebene Varianten (brsstrcpy …) über Lookup
    for (const [k, f] of Object.entries(F)) if (f.lower) rt.funcs.set(f.lower.toLowerCase(), f);
  };
  ST.stepSim = function (rt) {
    if (rt.sim.axes) for (const ax of rt.sim.axes) stepAxis(rt, ax);
  };
  ST.resetSim = function (rt) { rt.sim = {}; };
  ST.alarmList = rt => [...alarms(rt).entries()].map(([name, a]) => ({ name, active: a.active, acknowledged: a.acked, since: a.since }));
  ST.AX_ERR = AX_ERR;
  ST.TCP = TCP;
})(typeof window !== 'undefined' ? (window.ST = window.ST || {}) : (global.ST = global.ST || {}));
