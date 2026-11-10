/* Structured Text – Typsystem, Compiler (AST → Closures) und Laufzeit */
(function (ST) {
  'use strict';
  const STError = ST.STError;
  const lc = s => String(s).toLowerCase();

  // ---------- Elementare Typen ----------
  const INTS = {
    SINT: [8, true], USINT: [8, false], BYTE: [8, false, true],
    INT: [16, true], UINT: [16, false], WORD: [16, false, true],
    DINT: [32, true], UDINT: [32, false], DWORD: [32, false, true],
    LINT: [64, true], ULINT: [64, false], LWORD: [64, false, true],
    DATE_AND_TIME: [32, false], DT: [32, false], DATE: [32, false], TIME_OF_DAY: [32, false], TOD: [32, false]
  };
  const T = {};
  for (const [name, [bits, signed, bitstr]] of Object.entries(INTS)) T[name] = { k: 'INT', name, bits, signed, bitstr: !!bitstr };
  T.DT = T.DATE_AND_TIME; T.TOD = T.TIME_OF_DAY;
  T.BOOL = { k: 'BOOL', name: 'BOOL' };
  T.REAL = { k: 'REAL', name: 'REAL', bits: 32 };
  T.LREAL = { k: 'REAL', name: 'LREAL', bits: 64 };
  T.TIME = { k: 'TIME', name: 'TIME' };
  T.LIT_INT = { k: 'INT', name: 'ANY_INT', bits: 64, signed: true, lit: true };
  T.LIT_REAL = { k: 'REAL', name: 'ANY_REAL', bits: 64, lit: true };
  T.VOID = { k: 'VOID', name: 'VOID' };
  T.REF = { k: 'REF', name: 'ADR' };
  T.STRING80 = { k: 'STRING', name: 'STRING[80]', len: 80 };
  ST.T = T;

  const isNum = t => t.k === 'INT' || t.k === 'REAL';
  const isIntT = t => t.k === 'INT';
  const typeName = t => {
    if (!t) return '?';
    if (t.k === 'STRING') return (t.wide ? 'WSTRING' : 'STRING') + '[' + t.len + ']';
    if (t.k === 'ARRAY') return 'ARRAY[' + t.dims.map(d => d.lo + '..' + d.hi).join(',') + '] OF ' + typeName(t.elem);
    if (t.lit) return t.k === 'INT' ? 'Ganzzahl-Literal' : 'Gleitkomma-Literal';
    return t.name;
  };
  ST.typeName = typeName;

  function wrapInt(v, t) {
    if (typeof v === 'boolean') v = v ? 1 : 0;
    if (typeof v !== 'number') return v; // Referenzen (ADR) bleiben erhalten
    if (!isFinite(v)) v = 0;
    v = Math.trunc(v);
    if (t.bits >= 64 || t.lit) return v;
    if (t.bits === 32) return t.signed ? v | 0 : v >>> 0;
    const m = 2 ** t.bits;
    v = ((v % m) + m) % m;
    if (t.signed && v >= m / 2) v -= m;
    return v;
  }
  function coerce(v, t) {
    switch (t.k) {
      case 'BOOL': return !!v;
      case 'INT': return wrapInt(v, t);
      case 'REAL': return t.bits === 32 ? Math.fround(+v) : +v;
      case 'TIME': return typeof v === 'number' ? (Math.trunc(v) | 0) : 0;
      case 'STRING': { const s = String(v == null ? '' : v); return s.length > t.len ? s.slice(0, t.len) : s; }
      case 'ENUM': return typeof v === 'number' ? v | 0 : v;
      default: return v;
    }
  }
  ST.coerce = coerce;

  function sizeOf(t) {
    switch (t.k) {
      case 'BOOL': return 1;
      case 'INT': return t.lit ? 4 : t.bits / 8;
      case 'REAL': return t.bits / 8;
      case 'TIME': case 'ENUM': case 'REF': return 4;
      case 'STRING': return (t.len + 1) * (t.wide ? 2 : 1);
      case 'ARRAY': return t.dims.reduce((n, d) => n * (d.hi - d.lo + 1), 1) * sizeOf(t.elem);
      case 'STRUCT': return t.fields.reduce((n, f) => n + sizeOf(f.type), 0);
      case 'FB': return 64;
      case 'OPAQUE': return t.size || 4;
      default: return 4;
    }
  }
  ST.sizeOf = sizeOf;

  // Byte-Serialisierung (Little Endian wie auf x86/ARM-Targets) für brsmemcpy, TCP …
  function toBytes(v, t, out) {
    out = out || [];
    const dv = new DataView(new ArrayBuffer(8));
    const pushN = n => { for (let i = 0; i < n; i++) out.push(dv.getUint8(i)); };
    switch (t.k) {
      case 'BOOL': out.push(v ? 1 : 0); break;
      case 'INT': {
        const b = t.lit ? 32 : t.bits;
        if (b === 8) out.push(v & 0xff);
        else if (b === 16) { dv.setUint16(0, v & 0xffff, true); pushN(2); }
        else if (b === 32) { dv.setUint32(0, v >>> 0, true); pushN(4); }
        else { dv.setBigInt64(0, BigInt(Math.trunc(v)), true); pushN(8); }
        break;
      }
      case 'TIME': case 'ENUM': dv.setInt32(0, typeof v === 'number' ? v | 0 : 0, true); pushN(4); break;
      case 'REAL':
        if (t.bits === 32) { dv.setFloat32(0, v, true); pushN(4); } else { dv.setFloat64(0, v, true); pushN(8); }
        break;
      case 'STRING': {
        for (let i = 0; i <= t.len; i++) out.push(i < v.length ? v.charCodeAt(i) & 0xff : 0);
        break;
      }
      case 'ARRAY': {
        const rec = (arr, d) => { for (const x of arr) { if (d < t.dims.length - 1) rec(x, d + 1); else toBytes(x, t.elem, out); } };
        rec(v, 0); break;
      }
      case 'STRUCT': for (const f of t.fields) toBytes(v[f.key], f.type, out); break;
      default: for (let i = 0; i < sizeOf(t); i++) out.push(0);
    }
    return out;
  }
  function fromBytes(bytes, pos, t) {
    // liefert [wert, neuePos]
    const get = n => { const dv = new DataView(new ArrayBuffer(8)); for (let i = 0; i < n; i++) dv.setUint8(i, bytes[pos + i] || 0); return dv; };
    switch (t.k) {
      case 'BOOL': return [!!bytes[pos], pos + 1];
      case 'INT': {
        const b = t.lit ? 32 : t.bits;
        if (b === 8) { const x = bytes[pos] || 0; return [t.signed && x > 127 ? x - 256 : x, pos + 1]; }
        if (b === 16) { const dv = get(2); return [t.signed ? dv.getInt16(0, true) : dv.getUint16(0, true), pos + 2]; }
        if (b === 32) { const dv = get(4); return [t.signed ? dv.getInt32(0, true) : dv.getUint32(0, true), pos + 4]; }
        const dv = get(8); return [Number(t.signed ? dv.getBigInt64(0, true) : dv.getBigUint64(0, true)), pos + 8];
      }
      case 'TIME': case 'ENUM': return [get(4).getInt32(0, true), pos + 4];
      case 'REAL': return t.bits === 32 ? [get(4).getFloat32(0, true), pos + 4] : [get(8).getFloat64(0, true), pos + 8];
      case 'STRING': {
        let s = '';
        for (let i = 0; i < t.len; i++) { const c = bytes[pos + i]; if (!c) break; s += String.fromCharCode(c); }
        return [s, pos + t.len + 1];
      }
      case 'ARRAY': {
        const rec = d => {
          const dim = t.dims[d]; const arr = [];
          for (let i = dim.lo; i <= dim.hi; i++) {
            if (d < t.dims.length - 1) arr.push(rec(d + 1));
            else { const r = fromBytes(bytes, pos, t.elem); arr.push(r[0]); pos = r[1]; }
          }
          return arr;
        };
        const v = rec(0); return [v, pos];
      }
      case 'STRUCT': {
        const o = {};
        for (const f of t.fields) { const r = fromBytes(bytes, pos, f.type); o[f.key] = r[0]; pos = r[1]; }
        return [o, pos];
      }
      default: return [defaultValue(t), pos + sizeOf(t)];
    }
  }
  ST.toBytes = toBytes; ST.fromBytes = fromBytes;

  function defaultValue(t, rt) {
    switch (t.k) {
      case 'BOOL': return false;
      case 'INT': case 'REAL': case 'TIME': return 0;
      case 'STRING': return '';
      case 'ENUM': return t.members.length ? t.members[0].value : 0;
      case 'ARRAY': {
        const rec = d => {
          const dim = t.dims[d]; const arr = new Array(dim.hi - dim.lo + 1);
          for (let i = 0; i < arr.length; i++) arr[i] = d < t.dims.length - 1 ? rec(d + 1) : defaultValue(t.elem, rt);
          return arr;
        };
        return rec(0);
      }
      case 'STRUCT': {
        const o = {};
        for (const f of t.fields) o[f.key] = f.initFn ? f.initFn() : defaultValue(f.type, rt);
        return o;
      }
      case 'FB': return t.def.create(rt);
      case 'OPAQUE': return t.create ? t.create(rt) : {};
      default: return 0;
    }
  }
  ST.defaultValue = defaultValue;

  function deepCopy(v, t) {
    if (t.k === 'ARRAY') return v.map(x => (t.dims.length > 1 && Array.isArray(x)) ? deepCopy(x, { k: 'ARRAY', dims: t.dims.slice(1), elem: t.elem }) : deepCopy(x, t.elem));
    if (t.k === 'STRUCT') { const o = {}; for (const f of t.fields) o[f.key] = deepCopy(v[f.key], f.type); return o; }
    return v;
  }
  ST.deepCopy = deepCopy;

  function sameType(a, b) {
    if (a === b) return true;
    if (a.k !== b.k) return false;
    if (a.k === 'STRUCT' || a.k === 'ENUM' || a.k === 'FB' || a.k === 'OPAQUE') return a.name === b.name;
    if (a.k === 'ARRAY') return a.dims.length === b.dims.length && a.dims.every((d, i) => d.hi - d.lo === b.dims[i].hi - b.dims[i].lo) && sameType(a.elem, b.elem);
    if (a.k === 'STRING') return true;
    return a.name === b.name;
  }

  // Zuweisungskompatibilität – liefert null (ok) oder Fehlermeldung
  function assignError(src, dst) {
    if (dst.k === 'INT' && src.k === 'INT') return null;
    if (dst.k === 'REAL' && (src.k === 'INT' || src.k === 'REAL')) return null;
    if (dst.k === 'INT' && src.k === 'REAL') return `REAL-Wert kann nicht implizit in ${typeName(dst)} umgewandelt werden – nutze z. B. REAL_TO_${dst.name === 'ANY_INT' ? 'INT' : dst.name}() oder TRUNC()`;
    if (dst.k === 'TIME' && src.k === 'TIME') return null;
    if (dst.k === 'TIME' && src.k === 'INT') return src.lit ? 'Zahl kann nicht direkt TIME zugewiesen werden – schreibe ein TIME-Literal, z. B. T#500ms' : `${typeName(src)} kann nicht implizit TIME zugewiesen werden – nutze ${src.name === 'UDINT' ? 'UDINT' : 'DINT'}_TO_TIME()`;
    if (dst.k === 'INT' && src.k === 'TIME') return `TIME kann nicht implizit ${typeName(dst)} zugewiesen werden – nutze TIME_TO_${dst.name === 'UDINT' ? 'UDINT' : 'DINT'}()`;
    if (dst.k === 'BOOL' && src.k === 'BOOL') return null;
    if (dst.k === 'STRING' && src.k === 'STRING') return null;
    if (dst.k === 'ENUM' && src.k === 'ENUM') return dst.name === src.name ? null : `Enum ${src.name} passt nicht zu ${dst.name}`;
    if (dst.k === 'ENUM' && src.k === 'INT') return null;
    if (dst.k === 'INT' && src.k === 'ENUM') return null;
    if (dst.k === 'INT' && src.k === 'REF') return null;
    if (dst.k === 'REF') return null;
    if ((dst.k === 'STRUCT' || dst.k === 'ARRAY' || dst.k === 'OPAQUE') && sameType(src, dst)) return null;
    if (dst.k === 'FB') return 'Funktionsbaustein-Instanzen können nicht zugewiesen werden';
    if (dst.k === 'BOOL' && src.k === 'INT') return `${typeName(src)} kann nicht BOOL zugewiesen werden – nutze z. B. "x <> 0"`;
    if (dst.k === 'INT' && src.k === 'BOOL') return `BOOL kann nicht ${typeName(dst)} zugewiesen werden – nutze BOOL_TO_${dst.name === 'ANY_INT' ? 'INT' : dst.name}()`;
    if (dst.k === 'STRING') return `${typeName(src)} kann nicht STRING zugewiesen werden – nutze z. B. ${src.name || 'INT'}_TO_STRING()`;
    if (src.k === 'STRING') return `STRING kann nicht ${typeName(dst)} zugewiesen werden – nutze z. B. STRING_TO_${dst.name || 'INT'}()`;
    return `${typeName(src)} kann nicht ${typeName(dst)} zugewiesen werden`;
  }
  ST.assignError = assignError;

  // gemeinsamer Ergebnistyp zweier Ganzzahl-/Realtypen
  function arithType(a, b) {
    if (a.k === 'REAL' || b.k === 'REAL') {
      if ((a.k === 'REAL' && a.bits === 64 && !a.lit) || (b.k === 'REAL' && b.bits === 64 && !b.lit)) return T.LREAL;
      return T.REAL;
    }
    if (a.lit && b.lit) return T.LIT_INT;
    if (a.lit) return b.bitstr ? b : b;
    if (b.lit) return a;
    if (a.bits !== b.bits) return a.bits > b.bits ? a : b;
    if (a.signed !== b.signed) return a.signed ? a : b;
    return a;
  }

  // ---------- Laufzeit-Signale ----------
  const SIG_NONE = 0, SIG_EXIT = 1, SIG_CONTINUE = 2, SIG_RETURN = 3;

  class CycleViolation extends STError {
    constructor(file, line) { super('Zykluszeitverletzung – die Task wurde nicht rechtzeitig fertig (Endlosschleife?). Auf dem echten Target geht die CPU jetzt in SERVICE.', file, line, 'Laufzeitfehler'); }
  }
  ST.CycleViolation = CycleViolation;

  // ---------- Compiler ----------
  class Compiler {
    constructor(rt) {
      this.rt = rt;               // Laufzeit (für Typen-Registry & FBs)
      this.types = rt.types;      // Map lc(name) → Typ
    }
    err(msg, node, file) { throw new STError(msg, file || this.file, node && node.line, 'Fehler'); }

    // Typ-Spec → Typobjekt
    resolveType(spec, file) {
      const f = file || this.file;
      switch (spec.t) {
        case 'named': {
          const key = spec.name.toUpperCase();
          if (T[key] && !T[key].lit && key !== 'VOID' && key !== 'REF') return T[key];
          if (key === 'STRING') return T.STRING80;
          const ut = this.types.get(lc(spec.name));
          if (ut) return ut.resolved ? ut.resolved() : ut;
          const fb = this.rt.fbDefs.get(lc(spec.name));
          if (fb) return fb.type;
          this.err(`Unbekannter Datentyp "${spec.name}"`, spec, f);
        }
        // eslint-disable-next-line no-fallthrough
        case 'string': {
          const len = spec.len ? this.constInt(spec.len, f) : 80;
          return { k: 'STRING', name: (spec.wide ? 'WSTRING' : 'STRING'), len, wide: spec.wide };
        }
        case 'array': {
          const dims = spec.dims.map(([lo, hi]) => ({ lo: this.constInt(lo, f), hi: this.constInt(hi, f) }));
          dims.forEach(d => { if (d.hi < d.lo) this.err(`Array-Grenzen [${d.lo}..${d.hi}] ungültig`, spec, f); if (d.hi - d.lo > 100000) this.err('Array zu groß für den Simulator (max. 100000 Elemente)', spec, f); });
          return { k: 'ARRAY', dims, elem: this.resolveType(spec.elem, f) };
        }
      }
      this.err('Datentyp kann nicht aufgelöst werden', spec, f);
    }
    constInt(expr, file) {
      const v = this.constValue(expr, file);
      if (typeof v !== 'number' || !Number.isInteger(v)) this.err('Konstanter Ganzzahl-Ausdruck erwartet', expr, file);
      return v;
    }
    constValue(expr, file) {
      // Konstanten-Ausdrücke (für Array-Grenzen, STRING-Längen, Enum-Werte)
      const scope = { lookup: name => { const c = this.rt.constants.get(lc(name)); return c; } };
      const saved = this.scope;
      this.scope = new Scope(null, 'const');
      for (const [k, c] of this.rt.constants) this.scope.vars.set(k, c);
      try {
        const c = this.expr(expr);
        return c.ev(this.rt.constEnv || {});
      } catch (e) {
        if (e instanceof STError && /Unbekannt/.test(e.message)) this.err('Hier ist nur ein konstanter Ausdruck erlaubt (Literal oder VAR CONSTANT)', expr, file);
        throw e;
      } finally { this.scope = saved; void scope; }
    }

    // Initialwert → Funktion () => Wert
    initFn(init, type, file) {
      if (!init) return null;
      if (init.t === 'arrinit') {
        if (type.k !== 'ARRAY') this.err('Array-Initialisierung [..] nur für ARRAY-Variablen', init, file);
        const flat = [];
        for (const it of init.items) for (let i = 0; i < it.count; i++) flat.push(it.init);
        const elemT = type.elem;
        const total = type.dims.reduce((n, d) => n * (d.hi - d.lo + 1), 1);
        if (flat.length > total) this.err(`Zu viele Initialwerte (${flat.length}) für ${typeName(type)}`, init, file);
        const fns = flat.map(x => x ? this.initFn(x, elemT, file) : null);
        return () => {
          const v = defaultValue(type, this.rt);
          let k = 0;
          const fill = (arr, d) => {
            for (let i = 0; i < arr.length && k < fns.length; i++) {
              if (d < type.dims.length - 1) fill(arr[i], d + 1);
              else { const fn = fns[k++]; if (fn) arr[i] = fn(); }
            }
          };
          fill(v, 0);
          return v;
        };
      }
      if (init.t === 'structinit') {
        if (type.k !== 'STRUCT' && type.k !== 'FB') this.err('Struktur-Initialisierung (a := …) nur für Strukturen', init, file);
        const parts = init.fields.map(f => {
          const fld = type.k === 'STRUCT' ? type.fmap.get(lc(f.name)) : type.def.vars.get(lc(f.name));
          if (!fld) this.err(`${typeName(type)} hat kein Element "${f.name}"`, init, file);
          return [fld.key, this.initFn(f.init, fld.type, file)];
        });
        return () => { const v = defaultValue(type, this.rt); for (const [k, fn] of parts) v[k] = fn(); return v; };
      }
      const saved = this.scope;
      this.scope = new Scope(null, 'const');
      for (const [k, c] of this.rt.constants) this.scope.vars.set(k, c);
      let c;
      try { c = this.expr(init, type); } finally { this.scope = saved; }
      const e = assignError(c.ty, type);
      if (e) this.err(e, init, file);
      return () => coerce(c.ev(this.rt.constEnv || {}), type);
    }

    // ----- Ausdrücke -----
    // liefert { ty, ev(env), ref?(env) → [obj,key], lv?: true, isConst? }
    expr(n, expected) {
      const self = this;
      switch (n.t) {
        case 'num': {
          let ty = n.isInt ? T.LIT_INT : T.LIT_REAL;
          if (n.ty) {
            if (T[n.ty]) ty = T[n.ty];
            else if (n.ty === 'TOD') ty = T.TOD; else if (n.ty === 'DATE') ty = T.DATE; else if (n.ty === 'DATE_AND_TIME') ty = T.DATE_AND_TIME;
          }
          const v = ty.k === 'BOOL' ? !!n.v : n.v;
          return { ty, ev: () => v, isConst: true, cval: v };
        }
        case 'bool': return { ty: T.BOOL, ev: () => n.v, isConst: true, cval: n.v };
        case 'str': { const len = Math.max(80, n.v.length); return { ty: { k: 'STRING', name: 'STRING', len }, ev: () => n.v, isConst: true, cval: n.v, strLit: true }; }
        case 'time': return { ty: T.TIME, ev: () => n.v, isConst: true, cval: n.v };
        case 'enumlit': {
          const et = this.types.get(lc(n.type));
          if (!et || et.k !== 'ENUM') this.err(`"${n.type}" ist kein Enum-Typ`, n);
          const m = et.map.get(lc(n.name));
          if (m === undefined) this.err(`Enum ${et.name} hat keinen Wert "${n.name}"`, n);
          return { ty: et, ev: () => m, isConst: true, cval: m };
        }
        case 'id': {
          const r = this.scope.lookup(n.name);
          if (r) return this.varAccess(r, n);
          const em = this.rt.enumMembers.get(lc(n.name));
          if (em) {
            if (em.ambiguous && !(expected && expected.k === 'ENUM')) this.err(`Enum-Wert "${n.name}" ist mehrdeutig – schreibe Typ#Wert`, n);
            const et = (expected && expected.k === 'ENUM' && expected.map.has(lc(n.name))) ? expected : em.type;
            const v = et.map.get(lc(n.name));
            return { ty: et, ev: () => v, isConst: true, cval: v };
          }
          const c = this.rt.builtinConsts.get(lc(n.name));
          if (c) return { ty: c.type, ev: () => c.value, isConst: true, cval: c.value };
          if (this.rt.funcs.has(lc(n.name)) || ST.builtinFns[n.name.toUpperCase()] || this.rt.userFuncs.has(lc(n.name)))
            this.err(`Funktion "${n.name}" braucht Klammern: ${n.name}(…)`, n);
          this.err(`Unbekannte Variable "${n.name}" – ist sie in Variables.var deklariert?`, n);
        }
        // eslint-disable-next-line no-fallthrough
        case 'member': {
          const o = this.expr(n.obj);
          const ot = o.ty;
          let fld;
          if (ot.k === 'STRUCT') fld = ot.fmap.get(lc(n.name));
          else if (ot.k === 'FB') { fld = ot.def.vars.get(lc(n.name)); if (fld && fld.hidden) fld = null; }
          else if (ot.k === 'OPAQUE' && ot.fmap) fld = ot.fmap.get(lc(n.name));
          else this.err(`"${n.name}": ${typeName(ot)} hat keine Elemente`, n);
          if (!fld) this.err(`${typeName(ot)} hat kein Element "${n.name}"`, n);
          const key = fld.key, ty = fld.type;
          const oev = o.ev;
          return {
            ty, lv: o.lv, readonlyFB: ot.k === 'FB' && fld.kind === 'VAR_OUTPUT',
            ev: env => { const ob = oev(env); return ob[key]; },
            ref: env => [oev(env), key]
          };
        }
        case 'bit': {
          const o = this.expr(n.obj);
          if (!isIntT(o.ty)) this.err(`Bitzugriff .${n.bit} nur auf Ganzzahl-/Bitstring-Variablen`, n);
          const bits = o.ty.lit ? 32 : o.ty.bits;
          if (n.bit >= bits) this.err(`Bit ${n.bit} existiert nicht in ${typeName(o.ty)} (0..${bits - 1})`, n);
          const b = n.bit, oev = o.ev, oref = o.ref, oty = o.ty;
          const big = bits > 32;
          return {
            ty: T.BOOL, lv: o.lv,
            ev: env => big ? Math.floor(oev(env) / 2 ** b) % 2 === 1 : ((oev(env) >>> b) & 1) === 1,
            ref: oref && (env => {
              const [obj, key] = oref(env);
              return [{ get v() { return big ? Math.floor(obj[key] / 2 ** b) % 2 === 1 : ((obj[key] >>> b) & 1) === 1; },
                set v(x) { const cur = obj[key]; const bitv = 2 ** b; const isSet = big ? Math.floor(cur / bitv) % 2 === 1 : ((cur >>> b) & 1) === 1; obj[key] = coerce(x ? (isSet ? cur : cur + bitv) : (isSet ? cur - bitv : cur), oty); } }, 'v'];
            })
          };
        }
        case 'index': {
          const o = this.expr(n.obj);
          if (o.ty.k !== 'ARRAY') this.err(`Index [..] nur auf ARRAY-Variablen (ist ${typeName(o.ty)})`, n);
          const dims = o.ty.dims;
          if (n.idx.length !== dims.length) this.err(`${typeName(o.ty)} braucht ${dims.length} Index(e), angegeben: ${n.idx.length}`, n);
          const idx = n.idx.map(ix => { const c = this.expr(ix); if (!isIntT(c.ty) && c.ty.k !== 'ENUM') this.err('Array-Index muss eine Ganzzahl sein', ix); return c.ev; });
          const oev = o.ev, file = this.file, line = n.line;
          const resolve = env => {
            let arr = oev(env);
            for (let d = 0; d < dims.length; d++) {
              const i = idx[d](env);
              if (i < dims[d].lo || i > dims[d].hi) throw new STError(`Array-Index ${i} außerhalb der Grenzen [${dims[d].lo}..${dims[d].hi}] – auf dem Target führt das zu Speicherfehlern`, file, line, 'Laufzeitfehler');
              if (d < dims.length - 1) arr = arr[i - dims[d].lo];
              else return [arr, i - dims[d].lo];
            }
          };
          return { ty: o.ty.elem, lv: o.lv, ev: env => { const [a, k] = resolve(env); return a[k]; }, ref: resolve };
        }
        case 'un': {
          const e = this.expr(n.e, expected);
          if (n.op === 'NOT') {
            if (e.ty.k === 'BOOL') { const ev = e.ev; return { ty: T.BOOL, ev: env => !ev(env) }; }
            if (isIntT(e.ty)) { const ev = e.ev, ty = e.ty.lit ? T.DWORD : e.ty; return { ty, ev: env => coerce(~ev(env), ty) }; }
            this.err(`NOT ist für ${typeName(e.ty)} nicht definiert`, n);
          }
          if (isNum(e.ty) || e.ty.k === 'TIME') { const ev = e.ev, ty = e.ty; return { ty, ev: env => coerce(-ev(env), ty) }; }
          this.err(`Negation ist für ${typeName(e.ty)} nicht definiert`, n);
        }
        // eslint-disable-next-line no-fallthrough
        case 'bin': return this.binary(n, expected);
        case 'call': return this.call(n, false);
      }
      this.err('Unbekannter Ausdruck', n);
      void self;
    }
    varAccess(r, n) {
      const key = r.key, ty = r.type, base = r.base;
      const res = {
        ty, lv: !r.constant, constant: r.constant, decl: r,
        ev: env => env[base][key],
        ref: env => [env[base], key]
      };
      if (r.ioRef) { // VAR_IN_OUT (Referenz)
        res.ev = env => { const rf = env[base][key]; return rf[0][rf[1]]; };
        res.ref = env => env[base][key];
      }
      if (r.constant && r.cval !== undefined) { const cv = r.cval; res.isConst = true; res.cval = cv; res.ev = () => cv; res.ref = null; }
      return res;
    }
    binary(n, expected) {
      const op = n.op;
      let l = this.expr(n.l), r = this.expr(n.r);
      // Enum-Literale anhand der Gegenseite auflösen
      if (n.l.t === 'id' && l.ty.k === 'ENUM' && r.ty.k === 'ENUM' && l.ty !== r.ty && l.isConst) l = this.expr(n.l, r.ty);
      if (n.r.t === 'id' && r.ty.k === 'ENUM' && l.ty.k === 'ENUM' && l.ty !== r.ty && r.isConst) r = this.expr(n.r, l.ty);
      const le = l.ev, re = r.ev, lt = l.ty, rt = r.ty;
      const file = this.file, line = n.line;
      const fail = () => this.err(`Operator ${op} ist für ${typeName(lt)} und ${typeName(rt)} nicht definiert`, n);
      if (op === 'AND' || op === 'OR' || op === 'XOR') {
        if (lt.k === 'BOOL' && rt.k === 'BOOL') {
          if (op === 'AND') return { ty: T.BOOL, ev: env => le(env) && re(env) };
          if (op === 'OR') return { ty: T.BOOL, ev: env => le(env) || re(env) };
          return { ty: T.BOOL, ev: env => le(env) !== re(env) };
        }
        if (isIntT(lt) && isIntT(rt)) {
          const ty = arithType(lt, rt);
          const big = ty.bits > 32;
          const f = op === 'AND' ? (a, b) => a & b : op === 'OR' ? (a, b) => a | b : (a, b) => a ^ b;
          if (big) { const fb = op === 'AND' ? (a, b) => a & b : op === 'OR' ? (a, b) => a | b : (a, b) => a ^ b; return { ty, ev: env => Number(fb(BigInt.asUintN(64, BigInt(le(env))), BigInt.asUintN(64, BigInt(re(env))))) }; }
          return { ty, ev: env => coerce(f(le(env), re(env)), ty) };
        }
        if ((lt.k === 'BOOL' && isIntT(rt)) || (rt.k === 'BOOL' && isIntT(lt))) this.err(`${op} zwischen BOOL und ${typeName(lt.k === 'BOOL' ? rt : lt)} nicht erlaubt – vergleiche z. B. "x <> 0"`, n);
        fail();
      }
      if (['=', '<>', '<', '>', '<=', '>='].includes(op)) {
        const ok = (isNum(lt) && isNum(rt)) || (lt.k === 'TIME' && (rt.k === 'TIME' || rt.lit)) || (rt.k === 'TIME' && lt.lit) ||
          (lt.k === 'STRING' && rt.k === 'STRING') || (lt.k === 'BOOL' && rt.k === 'BOOL' && (op === '=' || op === '<>')) ||
          (lt.k === 'ENUM' && (rt.k === 'ENUM' || isIntT(rt))) || (rt.k === 'ENUM' && isIntT(lt)) ||
          (lt.k === 'TIME' && isIntT(rt)) || (rt.k === 'TIME' && isIntT(lt)) ||
          (lt.k === 'REF' || rt.k === 'REF');
        if (!ok) {
          if (lt.k === 'BOOL' || rt.k === 'BOOL') this.err(`Vergleich ${op} zwischen ${typeName(lt)} und ${typeName(rt)} nicht möglich`, n);
          fail();
        }
        if (lt.k === 'ENUM' && rt.k === 'ENUM' && lt.name !== rt.name) this.err(`Vergleich verschiedener Enum-Typen ${lt.name} und ${rt.name}`, n);
        const real32 = (lt.k === 'REAL' || rt.k === 'REAL');
        const f32 = real32 && !(lt.k === 'REAL' && lt.bits === 64 && !lt.lit) && !(rt.k === 'REAL' && rt.bits === 64 && !rt.lit);
        const f = { '=': (a, b) => a === b, '<>': (a, b) => a !== b, '<': (a, b) => a < b, '>': (a, b) => a > b, '<=': (a, b) => a <= b, '>=': (a, b) => a >= b }[op];
        if (f32) return { ty: T.BOOL, ev: env => f(Math.fround(le(env)), Math.fround(re(env))) };
        if (real32) return { ty: T.BOOL, ev: env => f(+le(env), +re(env)) };
        return { ty: T.BOOL, ev: env => f(le(env), re(env)) };
      }
      if (op === '+' || op === '-' || op === '*' || op === '/' || op === 'MOD' || op === '**') {
        if (lt.k === 'STRING' || rt.k === 'STRING') this.err(`Strings können nicht mit ${op} verknüpft werden – nutze CONCAT()`, n);
        if (lt.k === 'BOOL' || rt.k === 'BOOL') this.err(`Rechnen mit BOOL ist nicht erlaubt (${op})`, n);
        // TIME-Arithmetik
        if (lt.k === 'TIME' || rt.k === 'TIME') {
          let ty = T.TIME;
          if ((op === '+' || op === '-') && !((lt.k === 'TIME' || lt.lit) && (rt.k === 'TIME' || rt.lit))) {
            if (!((lt.k === 'TIME' && isIntT(rt)) || (rt.k === 'TIME' && isIntT(lt)))) fail();
          }
          if (op === '*' && !(lt.k === 'TIME' ? isNum(rt) : isNum(lt))) fail();
          if (op === '/' && !(lt.k === 'TIME' && isNum(rt))) fail();
          if (op === 'MOD' && !(lt.k === 'TIME' && (rt.k === 'TIME' || isIntT(rt)))) fail();
          if (op === '**') fail();
          const fn = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => { if (b === 0) throw new STError('Division durch 0', file, line, 'Laufzeitfehler'); return a / b; }, 'MOD': (a, b) => b === 0 ? 0 : a % b }[op];
          return { ty, ev: env => coerce(fn(le(env), re(env)), ty) };
        }
        if (lt.k === 'ENUM' || rt.k === 'ENUM') this.err('Mit Enum-Werten kann nicht gerechnet werden', n);
        if (!isNum(lt) || !isNum(rt)) fail();
        if (op === '**') return { ty: lt.bits === 64 || rt.bits === 64 ? T.LREAL : T.REAL, ev: env => Math.pow(le(env), re(env)) };
        const ty = arithType(lt, rt);
        if (op === 'MOD') {
          if (ty.k !== 'INT') this.err('MOD ist nur für Ganzzahlen definiert', n);
          return { ty, ev: env => { const b = re(env); if (b === 0) return 0; return coerce(le(env) % b, ty); } };
        }
        if (ty.k === 'REAL') {
          const f32 = ty.bits === 32;
          const fn = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b, '/': (a, b) => a / b }[op];
          return { ty, ev: f32 ? env => Math.fround(fn(le(env), re(env))) : env => fn(le(env), re(env)) };
        }
        if (op === '/') return { ty, ev: env => { const b = re(env); if (b === 0) throw new STError('Ganzzahl-Division durch 0 – auf dem Target ein Laufzeitfehler (Exception)', file, line, 'Laufzeitfehler'); return coerce(Math.trunc(le(env) / b), ty); } };
        if (op === '*' && ty.bits === 32) return { ty, ev: env => coerce(Math.imul(le(env), re(env)), ty) };
        const fn = { '+': (a, b) => a + b, '-': (a, b) => a - b, '*': (a, b) => a * b }[op];
        return { ty, ev: env => coerce(fn(le(env), re(env)), ty) };
      }
      fail();
    }

    // ----- Aufrufe -----
    call(n, asStatement) {
      const line = n.line, file = this.file;
      // 1) Benutzerfunktion
      const name = n.callee;
      if (name) {
        const uf = this.rt.userFuncs.get(lc(name));
        if (uf) return this.callUserFunc(uf, n);
        const bf = ST.builtinFns[name.toUpperCase()] || this.rt.funcs.get(lc(name));
        if (bf && !this.scope.lookup(name)) return this.callBuiltin(bf, n, name.toUpperCase());
        const conv = !this.scope.lookup(name) && ST.conversion(name.toUpperCase());
        if (conv) return this.callBuiltin(conv, n, name.toUpperCase());
        if (!this.scope.lookup(name)) {
          const act = this.rt.actions.get(lc(name));
          if (act && this.allowActions) {
            if (n.args.length) this.err('Aktionen werden ohne Parameter aufgerufen', n);
            return { ty: T.VOID, ev: env => { act.run(env); } };
          }
          if (this.rt.fbDefs.has(lc(name))) this.err(`"${name}" ist ein Funktionsbaustein-Typ – lege eine Instanz an (z. B. ${name}_0 : ${name};) und rufe die Instanz auf`, n);
          if (act && !this.allowActions) this.err(`Aktion "${name}" ist hier nicht sichtbar`, n);
          if (n.bare) this.err(`Unbekannter Bezeichner "${name}" – Anweisung unvollständig? (":=" fehlt?)`, n);
          this.err(`Unbekannte Funktion oder Instanz "${name}"`, n);
        }
      }
      // 2) FB-Instanz
      const tgt = this.expr(n.target);
      if (tgt.ty.k !== 'FB') {
        if (n.bare) this.err(`"${name}" allein ist keine Anweisung – meintest du "${name} := …;"?`, n);
        this.err(`${name || 'Ausdruck'} ist keine Funktionsbaustein-Instanz`, n);
      }
      const def = tgt.ty.def;
      const inputs = [], outputs = [];
      let posIdx = 0;
      for (const a of n.args) {
        let v;
        if (a.name) {
          v = def.vars.get(lc(a.name));
          if (!v || v.hidden) this.err(`${def.name} hat keinen Parameter "${a.name}"`, n);
        } else {
          v = def.inputList[posIdx++];
          if (!v) this.err(`Zu viele Parameter für ${def.name}`, n);
        }
        if (a.out) {
          if (v.kind !== 'VAR_OUTPUT') this.err(`"=>" nur für Ausgänge – ${v.name} ist ein Eingang (nutze ":=")`, n);
          const dst = this.expr(a.expr);
          if (!dst.ref || !dst.lv) this.err('Ziel von "=>" muss eine Variable sein', n);
          const e = assignError(v.type, dst.ty); if (e) this.err(e + ` (${def.name}.${v.name})`, n);
          outputs.push([v.key, dst.ref, dst.ty]);
        } else {
          if (v.kind === 'VAR_OUTPUT') this.err(`${v.name} ist ein Ausgang – lies ihn nach dem Aufruf mit ${name || 'instanz'}.${v.name} oder nutze "=>"`, n);
          if (v.kind === 'VAR' || v.kind === 'VAR_TEMP') this.err(`${v.name} ist eine interne Variable von ${def.name}`, n);
          const src = this.expr(a.expr, v.type);
          if (v.kind === 'VAR_IN_OUT') {
            if (!src.ref) this.err(`VAR_IN_OUT ${v.name} braucht eine Variable`, n);
            const e = assignError(src.ty, v.type); if (e) this.err(e + ` (${def.name}.${v.name})`, n);
            inputs.push([v.key, null, v.type, src.ref, true]);
          } else if (v.type.k === 'REF' && src.ty.k !== 'REF' && !(src.ty.k === 'INT' && !src.ref)) {
            if (!src.ref) this.err(`${def.name}.${v.name} erwartet ADR(variable)`, n);
            const sref = src.ref, sty = src.ty;
            inputs.push([v.key, env => { const [o, k] = sref(env); return { __adr: true, obj: o, key: k, type: sty }; }, v.type, null, false, T.REF]);
          } else {
            const e = assignError(src.ty, v.type); if (e) this.err(e + ` (${def.name}.${v.name})`, n);
            if (v.type.k === 'REF' && src.ty.k === 'INT') { inputs.push([v.key, src.ev, v.type, null, false, T.REF]); continue; }
            inputs.push([v.key, src.ev, v.type, null, false, src.ty]);
          }
        }
      }
      const tev = tgt.ev;
      const rt = this.rt;
      return {
        ty: T.VOID, ev: env => {
          const inst = tev(env);
          for (const [k, ev, ty, ref, io, sty] of inputs) {
            if (io) inst[k] = ref(env);
            else { const val = ev(env); inst[k] = (ty.k === 'STRUCT' || ty.k === 'ARRAY') ? deepCopy(val, ty) : (sty && sty.k === 'REF' ? val : coerce(val, ty)); }
          }
          def.exec(inst, rt, env);
          for (const [k, ref, ty] of outputs) { const [o, kk] = ref(env); o[kk] = (ty.k === 'STRUCT' || ty.k === 'ARRAY') ? deepCopy(inst[k], ty) : coerce(inst[k], ty); }
        }
      };
      void line; void file; void asStatement;
    }
    callUserFunc(uf, n) {
      const args = [];
      let pos = 0;
      const assigned = new Set();
      for (const a of n.args) {
        let v;
        if (a.name) { v = uf.vars.get(lc(a.name)); if (!v || (v.kind !== 'VAR_INPUT' && v.kind !== 'VAR_IN_OUT' && v.kind !== 'VAR_OUTPUT')) this.err(`${uf.name} hat keinen Parameter "${a.name}"`, n); }
        else { v = uf.inputList[pos++]; if (!v) this.err(`Zu viele Parameter für ${uf.name} (erwartet ${uf.inputList.length})`, n); }
        assigned.add(v.key);
        if (a.out || v.kind === 'VAR_OUTPUT') {
          const dst = this.expr(a.expr);
          args.push({ key: v.key, out: true, ref: dst.ref, ty: dst.ty });
          continue;
        }
        const src = this.expr(a.expr, v.type);
        if (v.kind === 'VAR_IN_OUT') {
          if (!src.ref) this.err(`VAR_IN_OUT ${v.name} braucht eine Variable`, n);
          args.push({ key: v.key, io: true, ref: src.ref });
        } else {
          const e = assignError(src.ty, v.type); if (e) this.err(e + ` (Parameter ${v.name} von ${uf.name})`, n);
          args.push({ key: v.key, ev: src.ev, ty: v.type, sty: src.ty });
        }
      }
      for (const v of uf.inputList) if (!assigned.has(v.key) && !v.init && v.kind === 'VAR_INPUT') {
        if (!uf.inputList.some(x => x.init)) { /* IEC: fehlende Eingänge = Initialwert */ }
      }
      const rt = this.rt;
      return {
        ty: uf.retType, ev: env => {
          const frame = uf.newFrame(rt);
          for (const a of args) {
            if (a.out) continue;
            if (a.io) frame[a.key] = a.ref(env);
            else { const val = a.ev(env); frame[a.key] = (a.ty.k === 'STRUCT' || a.ty.k === 'ARRAY') ? deepCopy(val, a.ty) : (a.sty.k === 'REF' ? val : coerce(val, a.ty)); }
          }
          const r = uf.run(frame, env);
          for (const a of args) if (a.out) { const [o, k] = a.ref(env); o[k] = coerce(frame[a.key], a.ty); }
          return r;
        }
      };
    }
    callBuiltin(bf, n, NAME) {
      // Argumente kompilieren (benannt → Position)
      const names = bf.params || [];
      const ordered = [];
      let pos = 0;
      for (const a of n.args) {
        let idx;
        if (a.name) { idx = names.findIndex(p => p.toUpperCase() === a.name.toUpperCase()); if (idx < 0) this.err(`${NAME} hat keinen Parameter "${a.name}"`, n); }
        else idx = pos++;
        ordered[idx] = a;
      }
      for (let i = 0; i < ordered.length; i++) if (!ordered[i]) this.err(`${NAME}: Parameter ${names[i] || i + 1} fehlt`, n);
      if (bf.special) return bf.special(n, this, ordered);
      const comp = ordered.map((a, i) => {
        if (bf.refArgs && bf.refArgs.includes(i)) {
          const c = this.expr(a.expr);
          return c;
        }
        return this.expr(a.expr, bf.expectArg && bf.expectArg(i));
      });
      if (bf.min !== undefined && comp.length < bf.min) this.err(`${NAME} braucht mindestens ${bf.min} Parameter`, n);
      if (bf.max !== undefined && comp.length > bf.max) this.err(`${NAME} erlaubt höchstens ${bf.max} Parameter`, n);
      const tys = comp.map(c => c.ty);
      let ty;
      try { ty = bf.sig(tys, comp, this); } catch (e) { if (e instanceof STError) throw e; this.err(`${NAME}: ${e.message}`, n); }
      const evs = comp.map(c => c.ev);
      const impl = bf.impl, rt = this.rt, file = this.file, line = n.line;
      if (bf.raw) { // Zugriff auf Ausdrucks-Objekte (z. B. ADR, SIZEOF)
        const r = bf.raw(comp, tys, this, n);
        return Object.assign({ ty }, r);
      }
      return {
        ty, ev: env => {
          const args = evs.map(e => e(env));
          try { return impl(args, tys, rt, ty); } catch (e) { if (e instanceof STError) throw e; throw new STError(`${NAME}: ${e.message}`, file, line, 'Laufzeitfehler'); }
        }
      };
    }

    // ----- Anweisungen -----
    stmts(list) {
      const fns = list.map(s => this.stmt(s));
      const n = fns.length;
      if (n === 0) return () => SIG_NONE;
      if (n === 1) return fns[0];
      return env => { for (let i = 0; i < n; i++) { const r = fns[i](env); if (r) return r; } return SIG_NONE; };
    }
    stmt(s) {
      const rt = this.rt, file = this.file, line = s.line;
      const tick = () => { if (--rt.budget < 0) throw new CycleViolation(file, line); };
      switch (s.s) {
        case 'assign': {
          const l = this.expr(s.lhs);
          if (!l.ref) this.err('Links von ":=" muss eine Variable stehen', s);
          if (l.constant) this.err(`"${s.lhs.name}" ist eine Konstante (VAR CONSTANT) und kann nicht geändert werden`, s);
          if (l.readonlyFB) this.err('Ausgänge eines Funktionsbausteins können nicht beschrieben werden', s);
          if (l.decl && l.decl.readonly) this.err(`"${l.decl.name}" ist ein Eingang der Anlage und wird von der Simulation geschrieben – nur lesen`, s);
          if (l.ty.k === 'FB') this.err('Funktionsbaustein-Instanzen können nicht zugewiesen werden', s);
          const r = this.expr(s.rhs, l.ty);
          const e = assignError(r.ty, l.ty);
          if (e) this.err(e, s);
          if (r.ty.k === 'VOID') this.err('Die Funktion liefert keinen Wert', s);
          const ref = l.ref, rev = r.ev, ty = l.ty;
          if (ty.k === 'STRUCT' || ty.k === 'ARRAY') return env => { const [o, k] = ref(env); o[k] = deepCopy(rev(env), ty); tick(); return SIG_NONE; };
          if (r.ty.k === 'REF') return env => { const [o, k] = ref(env); o[k] = rev(env); tick(); return SIG_NONE; };
          return env => { const v = rev(env); const [o, k] = ref(env); o[k] = coerce(v, ty); tick(); return SIG_NONE; };
        }
        case 'call': {
          const c = this.call(s.call, true);
          const ev = c.ev;
          return env => { ev(env); tick(); return SIG_NONE; };
        }
        case 'if': {
          const conds = s.conds.map(([c, b]) => {
            const ce = this.expr(c);
            if (ce.ty.k !== 'BOOL') this.err(`IF-Bedingung muss BOOL sein (ist ${typeName(ce.ty)})`, c);
            return [ce.ev, this.stmts(b)];
          });
          const els = s.els ? this.stmts(s.els) : null;
          return env => {
            tick();
            for (let i = 0; i < conds.length; i++) if (conds[i][0](env)) return conds[i][1](env);
            return els ? els(env) : SIG_NONE;
          };
        }
        case 'case': {
          const sel = this.expr(s.sel);
          if (!isIntT(sel.ty) && sel.ty.k !== 'ENUM') this.err(`CASE-Ausdruck muss Ganzzahl oder Enum sein (ist ${typeName(sel.ty)})`, s);
          const seen = new Map();
          const branches = s.branches.map(b => {
            const labels = b.labels.map(lb => {
              const lo = this.expr(lb.lo, sel.ty);
              if (!lo.isConst) this.err('CASE-Label muss eine Konstante sein', b);
              if (sel.ty.k === 'ENUM' && lo.ty.k === 'ENUM' && lo.ty.name !== sel.ty.name) this.err(`CASE-Label ${typeName(lo.ty)} passt nicht zu ${sel.ty.name}`, b);
              const hi = lb.hi ? this.expr(lb.hi, sel.ty) : null;
              const a = lo.cval, z = hi ? hi.cval : lo.cval;
              for (let v = a; v <= z && v - a < 10000; v++) {
                if (seen.has(v)) this.err(`CASE-Label ${v} kommt doppelt vor (Zeile ${seen.get(v)})`, b);
                seen.set(v, b.line);
              }
              return [a, z];
            });
            return [labels, this.stmts(b.body)];
          });
          const els = s.els ? this.stmts(s.els) : null;
          const sev = sel.ev;
          return env => {
            tick();
            const v = sev(env);
            for (let i = 0; i < branches.length; i++) {
              const ls = branches[i][0];
              for (let j = 0; j < ls.length; j++) if (v >= ls[j][0] && v <= ls[j][1]) return branches[i][1](env);
            }
            return els ? els(env) : SIG_NONE;
          };
        }
        case 'for': {
          const v = this.expr(s.v);
          if (!v.ref || !isIntT(v.ty)) this.err('FOR-Laufvariable muss eine Ganzzahl-Variable sein', s);
          const from = this.expr(s.from, v.ty), to = this.expr(s.to, v.ty), by = s.by ? this.expr(s.by, v.ty) : null;
          [from, to, by].forEach(x => { if (x && !isIntT(x.ty) && x.ty.k !== 'ENUM') this.err('FOR-Grenzen müssen Ganzzahlen sein', s); });
          this.loopDepth = (this.loopDepth || 0) + 1;
          const body = this.stmts(s.body);
          this.loopDepth--;
          const ref = v.ref, fe = from.ev, te = to.ev, be = by ? by.ev : () => 1, ty = v.ty;
          return env => {
            const [o, k] = ref(env);
            const end = te(env), step = be(env);
            if (step === 0) throw new STError('FOR mit Schrittweite 0 – Endlosschleife', file, line, 'Laufzeitfehler');
            o[k] = coerce(fe(env), ty);
            while (step > 0 ? o[k] <= end : o[k] >= end) {
              tick();
              const r = body(env);
              if (r === SIG_EXIT) break;
              if (r === SIG_RETURN) return r;
              const next = o[k] + step;
              const wrapped = coerce(next, ty);
              o[k] = wrapped;
              if (wrapped !== next) break; // Überlauf beendet die Schleife
            }
            return SIG_NONE;
          };
        }
        case 'while': {
          const c = this.expr(s.cond);
          if (c.ty.k !== 'BOOL') this.err('WHILE-Bedingung muss BOOL sein', s);
          this.loopDepth = (this.loopDepth || 0) + 1;
          const body = this.stmts(s.body);
          this.loopDepth--;
          const ce = c.ev;
          return env => {
            while (ce(env)) { tick(); const r = body(env); if (r === SIG_EXIT) break; if (r === SIG_RETURN) return r; }
            return SIG_NONE;
          };
        }
        case 'repeat': {
          this.loopDepth = (this.loopDepth || 0) + 1;
          const body = this.stmts(s.body);
          this.loopDepth--;
          const c = this.expr(s.cond);
          if (c.ty.k !== 'BOOL') this.err('UNTIL-Bedingung muss BOOL sein', s);
          const ce = c.ev;
          return env => {
            do { tick(); const r = body(env); if (r === SIG_EXIT) break; if (r === SIG_RETURN) return r; } while (!ce(env));
            return SIG_NONE;
          };
        }
        case 'exit': if (!this.loopDepth) this.err('EXIT nur innerhalb einer Schleife', s); return () => SIG_EXIT;
        case 'continue': if (!this.loopDepth) this.err('CONTINUE nur innerhalb einer Schleife', s); return () => SIG_CONTINUE;
        case 'return': return () => SIG_RETURN;
      }
      this.err('Unbekannte Anweisung', s);
    }
  }
  // CONTINUE in Schleifenrumpf: Signal wird im Rumpf (stmts) zurückgegeben → Schleife fährt fort
  // (stmts bricht beim Signal ab; Schleifen behandeln SIG_CONTINUE wie SIG_NONE)

  class Scope {
    constructor(parent, base) { this.parent = parent; this.base = base; this.vars = new Map(); }
    add(decl) { this.vars.set(decl.key, decl); }
    lookup(name) {
      const k = lc(name);
      for (let s = this; s; s = s.parent) { const v = s.vars.get(k); if (v) return v; }
      return null;
    }
  }
  ST.Scope = Scope;
  ST.Compiler = Compiler;
  ST.SIG = { NONE: SIG_NONE, EXIT: SIG_EXIT, CONTINUE: SIG_CONTINUE, RETURN: SIG_RETURN };
  ST.arithType = arithType;
  ST.sameType = sameType;
})(typeof window !== 'undefined' ? (window.ST = window.ST || {}) : (global.ST = global.ST || {}));
