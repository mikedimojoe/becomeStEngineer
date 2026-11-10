/* Structured Text (IEC 61131-3, B&R-Dialekt) – Lexer & Parser
 * Läuft im Browser (window.ST) und in Node (global.ST). */
(function (ST) {
  'use strict';

  class STError extends Error {
    constructor(msg, file, line, kind) {
      super(msg);
      this.file = file; this.line = line; this.kind = kind || 'Syntaxfehler';
    }
    toString() { return (this.file ? this.file + (this.line ? ' Zeile ' + this.line : '') + ': ' : '') + this.kind + ': ' + this.message; }
  }
  ST.STError = STError;

  const KEYWORDS = new Set(('PROGRAM END_PROGRAM FUNCTION END_FUNCTION FUNCTION_BLOCK END_FUNCTION_BLOCK ACTION END_ACTION ' +
    'VAR VAR_INPUT VAR_OUTPUT VAR_IN_OUT VAR_TEMP VAR_GLOBAL VAR_EXTERNAL END_VAR CONSTANT RETAIN PERSISTENT NON_RETAIN ' +
    'TYPE END_TYPE STRUCT END_STRUCT ARRAY OF STRING WSTRING IF THEN ELSIF ELSE END_IF CASE END_CASE FOR TO BY DO END_FOR ' +
    'WHILE END_WHILE REPEAT UNTIL END_REPEAT EXIT RETURN CONTINUE AND OR XOR NOT MOD TRUE FALSE REFERENCE POINTER').split(' '));

  // ---------- Lexer ----------
  function lex(src, file) {
    const toks = [];
    let i = 0, line = 1;
    const n = src.length;
    const push = (type, value, extra) => toks.push(Object.assign({ type, value, line, file }, extra));
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === ' ') { i++; continue; }
      // Kommentare
      if (c === '(' && src[i + 1] === '*') {
        const start = line; i += 2; let depth = 1;
        while (i < n && depth > 0) {
          if (src[i] === '(' && src[i + 1] === '*') { depth++; i += 2; continue; }
          if (src[i] === '*' && src[i + 1] === ')') { depth--; i += 2; continue; }
          if (src[i] === '\n') line++;
          i++;
        }
        if (depth > 0) throw new STError('Kommentar (* … *) wird nicht geschlossen', file, start);
        continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        const start = line; i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        if (i >= n) throw new STError('Kommentar /* … */ wird nicht geschlossen', file, start);
        i += 2; continue;
      }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      // Strings
      if (c === "'" || c === '"') {
        const q = c; let s = ''; i++;
        while (true) {
          if (i >= n || src[i] === '\n') throw new STError('String-Literal wird nicht geschlossen', file, line);
          const d = src[i];
          if (d === q) { i++; break; }
          if (d === '$') {
            const e = src[i + 1];
            const map = { "'": "'", '"': '"', '$': '$', 'N': '\n', 'n': '\n', 'L': '\n', 'l': '\n', 'R': '\r', 'r': '\r', 'T': '\t', 't': '\t', 'P': '\f', 'p': '\f' };
            if (map[e] !== undefined) { s += map[e]; i += 2; continue; }
            if (/[0-9A-Fa-f]{2}/.test(src.substr(i + 1, 2))) { s += String.fromCharCode(parseInt(src.substr(i + 1, 2), 16)); i += 3; continue; }
            s += '$'; i++; continue;
          }
          s += d; i++;
        }
        push('str', s, { wide: q === '"' });
        continue;
      }
      // Zahlen
      if (/[0-9]/.test(c)) {
        let j = i;
        while (j < n && /[0-9_]/.test(src[j])) j++;
        if (src[j] === '#') { // Basis-Literal 16#FF
          const base = parseInt(src.slice(i, j).replace(/_/g, ''), 10);
          let k = j + 1;
          while (k < n && /[0-9A-Fa-f_]/.test(src[k])) k++;
          const digits = src.slice(j + 1, k).replace(/_/g, '');
          if (![2, 8, 16].includes(base) || !digits) throw new STError('Ungültiges Basis-Literal ' + src.slice(i, k), file, line);
          const v = parseInt(digits, base);
          if (isNaN(v)) throw new STError('Ungültiges Literal ' + src.slice(i, k), file, line);
          push('num', v, { isInt: true });
          i = k; continue;
        }
        let isReal = false;
        if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) {
          isReal = true; j++;
          while (j < n && /[0-9_]/.test(src[j])) j++;
        }
        if ((src[j] === 'e' || src[j] === 'E') && /[-+0-9]/.test(src[j + 1] || '')) {
          let k = j + 1; if (src[k] === '+' || src[k] === '-') k++;
          if (/[0-9]/.test(src[k] || '')) { isReal = true; j = k; while (j < n && /[0-9_]/.test(src[j])) j++; }
        }
        const text = src.slice(i, j).replace(/_/g, '');
        push('num', isReal ? parseFloat(text) : parseInt(text, 10), { isInt: !isReal });
        i = j; continue;
      }
      // Bezeichner / Schlüsselwörter / typisierte Literale
      if (/[A-Za-z_]/.test(c)) {
        let j = i;
        while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        const word = src.slice(i, j);
        const up = word.toUpperCase();
        if (src[j] === '#') {
          // T#1s, TIME#.., INT#5, BOOL#1, DT#… , Enum#Wert
          if (up === 'T' || up === 'TIME' || up === 'LT' || up === 'LTIME') {
            let k = j + 1;
            while (k < n && /[0-9A-Za-z_.\-]/.test(src[k])) k++;
            const lit = src.slice(j + 1, k);
            push('time', parseTime(lit, file, line));
            i = k; continue;
          }
          if (up === 'D' || up === 'DATE' || up === 'DT' || up === 'DATE_AND_TIME' || up === 'TOD' || up === 'TIME_OF_DAY') {
            let k = j + 1;
            while (k < n && /[0-9:\-.]/.test(src[k])) k++;
            push('dt', parseDT(up, src.slice(j + 1, k), file, line), { dtKind: up });
            i = k; continue;
          }
          push('typed', up, { word });
          i = j + 1; continue;
        }
        if (KEYWORDS.has(up)) push('kw', up);
        else push('id', word);
        i = j; continue;
      }
      // Operatoren
      const two = src.substr(i, 2);
      if ([':=', '=>', '<=', '>=', '<>', '**', '..'].includes(two)) { push('op', two); i += 2; continue; }
      if ('+-*/=<>()[],;:.&^#'.includes(c)) { push('op', c); i++; continue; }
      throw new STError('Unerwartetes Zeichen "' + c + '"', file, line);
    }
    push('eof', null);
    return toks;
  }

  function parseTime(lit, file, line) {
    let s = lit.toLowerCase().replace(/_/g, '');
    let neg = false;
    if (s.startsWith('-')) { neg = true; s = s.slice(1); }
    const re = /([0-9]+(?:\.[0-9]+)?)(ms|us|ns|d|h|m|s)/g;
    let m, total = 0, consumed = 0;
    while ((m = re.exec(s))) {
      if (m.index !== consumed) break;
      const v = parseFloat(m[1]);
      total += v * { d: 86400000, h: 3600000, m: 60000, s: 1000, ms: 1, us: 0.001, ns: 0.000001 }[m[2]];
      consumed = re.lastIndex;
    }
    if (!consumed || consumed !== s.length) throw new STError('Ungültiges TIME-Literal T#' + lit, file, line);
    return Math.round(neg ? -total : total);
  }
  function parseDT(kind, lit, file, line) {
    let d;
    if (kind === 'D' || kind === 'DATE') d = Date.parse(lit + 'T00:00:00Z');
    else if (kind === 'TOD' || kind === 'TIME_OF_DAY') { const p = lit.split(':').map(Number); return Math.round(((p[0] * 60 + p[1]) * 60 + (p[2] || 0)) * 1000); }
    else { const k = lit.lastIndexOf('-'); d = Date.parse(lit.slice(0, k) + 'T' + lit.slice(k + 1) + 'Z'); }
    if (isNaN(d)) throw new STError('Ungültiges Datums-Literal ' + lit, file, line);
    return Math.floor(d / 1000);
  }

  // ---------- Parser ----------
  class Parser {
    constructor(toks, file) { this.t = toks; this.p = 0; this.file = file; }
    get cur() { return this.t[this.p]; }
    peek(k = 1) { return this.t[Math.min(this.p + k, this.t.length - 1)]; }
    err(msg, tok) { tok = tok || this.cur; throw new STError(msg, this.file, tok.line); }
    isKw(k) { return this.cur.type === 'kw' && this.cur.value === k; }
    isOp(o) { return this.cur.type === 'op' && this.cur.value === o; }
    acceptKw(k) { if (this.isKw(k)) { this.p++; return true; } return false; }
    acceptOp(o) { if (this.isOp(o)) { this.p++; return true; } return false; }
    expectKw(k, ctx) { if (!this.acceptKw(k)) this.err(`"${k}" erwartet${ctx ? ' ' + ctx : ''}, gefunden ${this.desc()}`); }
    expectOp(o, ctx) { if (!this.acceptOp(o)) this.err(`"${o}" erwartet${ctx ? ' ' + ctx : ''}, gefunden ${this.desc()}`); }
    desc(tok) {
      tok = tok || this.cur;
      if (tok.type === 'eof') return 'Dateiende';
      if (tok.type === 'str') return `'${tok.value}'`;
      return `"${tok.type === 'kw' || tok.type === 'op' ? tok.value : tok.value}"`;
    }
    ident(ctx) {
      if (this.cur.type === 'id') return this.t[this.p++].value;
      // Einige Schlüsselwörter sind als Namen erlaubt (z. B. Strukturelemente)
      this.err(`Bezeichner erwartet${ctx ? ' ' + ctx : ''}, gefunden ${this.desc()}`);
    }
    // Namen nach "." – hier sind auch Schlüsselwörter erlaubt (z. B. .TO, .AT)
    memberName() {
      if (this.cur.type === 'id' || this.cur.type === 'kw') return String(this.t[this.p++].value);
      this.err('Elementname nach "." erwartet');
    }

    // ----- Einheit (Datei) -----
    parseUnit() {
      const unit = { programs: {}, fbs: [], funcs: [], actions: [], types: [], vars: [] };
      while (this.cur.type !== 'eof') {
        if (this.isKw('PROGRAM')) this.parseProgram(unit);
        else if (this.isKw('FUNCTION_BLOCK')) unit.fbs.push(this.parsePou('FUNCTION_BLOCK'));
        else if (this.isKw('FUNCTION')) unit.funcs.push(this.parsePou('FUNCTION'));
        else if (this.isKw('ACTION')) unit.actions.push(this.parseAction());
        else if (this.isKw('TYPE')) unit.types.push(...this.parseTypeBlock());
        else if (this.isVarStart()) unit.vars.push(...this.parseVarBlock());
        else if (this.acceptOp(';')) continue;
        else this.err(`PROGRAM, FUNCTION_BLOCK, FUNCTION, ACTION, TYPE oder VAR erwartet, gefunden ${this.desc()}`);
      }
      return unit;
    }
    isVarStart() { return this.cur.type === 'kw' && /^VAR/.test(this.cur.value) && this.cur.value !== 'END_VAR'; }
    parseProgram(unit) {
      const tok = this.cur; this.expectKw('PROGRAM');
      const name = this.ident('nach PROGRAM');
      const vars = [];
      while (this.isVarStart()) vars.push(...this.parseVarBlock());
      const body = this.parseStatements(['END_PROGRAM']);
      this.expectKw('END_PROGRAM', `(PROGRAM ${name} ab Zeile ${tok.line})`);
      const key = name.toUpperCase();
      const slot = key === '_INIT' ? 'init' : key === '_EXIT' ? 'exit' : 'cyclic';
      if (unit.programs[slot]) this.err(`PROGRAM ${name} ist doppelt vorhanden`, tok);
      unit.programs[slot] = { name, vars, body, line: tok.line };
    }
    parsePou(kind) {
      const tok = this.cur; this.expectKw(kind);
      const name = this.ident('nach ' + kind);
      let retType = null;
      if (kind === 'FUNCTION') {
        if (this.acceptOp(':')) retType = this.parseTypeSpec();
        else this.err(`FUNCTION ${name} braucht einen Rückgabetyp, z. B. "FUNCTION ${name} : REAL"`);
      }
      const vars = [];
      while (this.isVarStart()) vars.push(...this.parseVarBlock());
      const end = kind === 'FUNCTION' ? 'END_FUNCTION' : 'END_FUNCTION_BLOCK';
      const body = this.parseStatements([end]);
      this.expectKw(end, `(${kind} ${name} ab Zeile ${tok.line})`);
      return { kind, name, retType, vars, body, line: tok.line, file: this.file };
    }
    parseAction() {
      const tok = this.cur; this.expectKw('ACTION');
      const name = this.ident('nach ACTION');
      this.acceptOp(':');
      const body = this.parseStatements(['END_ACTION']);
      this.expectKw('END_ACTION', `(ACTION ${name} ab Zeile ${tok.line})`);
      return { name, body, line: tok.line };
    }

    // ----- Typen -----
    parseTypeBlock() {
      this.expectKw('TYPE');
      const types = [];
      while (!this.isKw('END_TYPE')) {
        if (this.cur.type === 'eof') this.err('END_TYPE fehlt');
        const tok = this.cur;
        const name = this.ident('(Typname) in TYPE-Block');
        this.expectOp(':', `nach Typname ${name}`);
        let spec;
        if (this.isKw('STRUCT')) {
          this.p++;
          const fields = [];
          while (!this.isKw('END_STRUCT')) {
            if (this.cur.type === 'eof') this.err('END_STRUCT fehlt');
            fields.push(...this.parseDecl('FIELD'));
          }
          this.expectKw('END_STRUCT');
          spec = { t: 'struct', fields };
        } else if (this.isOp('(')) {
          this.p++;
          const members = [];
          do {
            const mt = this.cur;
            const mname = this.ident('(Enum-Wert)');
            let value = null;
            if (this.acceptOp(':=')) value = this.parseExpr();
            members.push({ name: mname, value, line: mt.line });
          } while (this.acceptOp(','));
          this.expectOp(')', 'am Ende der Enum-Liste');
          let base = null;
          if (this.cur.type === 'id') base = this.ident();
          spec = { t: 'enum', members, base };
          if (this.acceptOp(':=')) spec.init = this.parseExpr();
        } else {
          spec = this.parseTypeSpec();
          if (this.acceptOp(':=')) spec = Object.assign({}, spec, { init: this.parseInit() });
        }
        this.acceptOp(';');
        types.push({ name, spec, line: tok.line, file: this.file });
      }
      this.expectKw('END_TYPE');
      return types;
    }
    parseTypeSpec() {
      const tok = this.cur;
      if (this.acceptKw('ARRAY')) {
        this.expectOp('[', 'nach ARRAY');
        const dims = [];
        do {
          const lo = this.parseExpr();
          this.expectOp('..', 'in Array-Grenzen (z. B. [0..9])');
          const hi = this.parseExpr();
          dims.push([lo, hi]);
        } while (this.acceptOp(','));
        this.expectOp(']');
        this.expectKw('OF', 'nach Array-Grenzen');
        const elem = this.parseTypeSpec();
        return { t: 'array', dims, elem, line: tok.line };
      }
      if (this.isKw('STRING') || this.isKw('WSTRING')) {
        const wide = this.cur.value === 'WSTRING'; this.p++;
        let len = null;
        if (this.acceptOp('[')) { len = this.parseExpr(); this.expectOp(']'); }
        else if (this.acceptOp('(')) { len = this.parseExpr(); this.expectOp(')'); }
        return { t: 'string', len, wide, line: tok.line };
      }
      if (this.acceptKw('REFERENCE') || this.acceptKw('POINTER')) {
        this.err('REFERENCE TO / POINTER TO wird im Simulator nicht unterstützt – nutze ADR() nur als Baustein-Argument', tok);
      }
      if (this.cur.type === 'id') return { t: 'named', name: this.ident(), line: tok.line };
      this.err(`Datentyp erwartet, gefunden ${this.desc()}`);
    }

    // ----- Variablen -----
    parseVarBlock() {
      const tok = this.cur;
      const kind = this.t[this.p++].value; // VAR, VAR_INPUT, …
      let constant = false, retain = false;
      while (this.cur.type === 'kw' && ['CONSTANT', 'RETAIN', 'PERSISTENT', 'NON_RETAIN'].includes(this.cur.value)) {
        if (this.cur.value === 'CONSTANT') constant = true;
        if (this.cur.value === 'RETAIN' || this.cur.value === 'PERSISTENT') retain = true;
        this.p++;
      }
      const decls = [];
      while (!this.isKw('END_VAR')) {
        if (this.cur.type === 'eof' || (this.cur.type === 'kw' && ['PROGRAM', 'FUNCTION', 'FUNCTION_BLOCK', 'END_PROGRAM', 'END_FUNCTION', 'END_FUNCTION_BLOCK', 'IF'].includes(this.cur.value)))
          this.err(`END_VAR fehlt (${kind}-Block ab Zeile ${tok.line})`);
        decls.push(...this.parseDecl(kind, constant, retain));
      }
      this.expectKw('END_VAR');
      return decls;
    }
    parseDecl(kind, constant, retain) {
      const tok = this.cur;
      const names = [this.ident('(Variablenname)')];
      while (this.acceptOp(',')) names.push(this.ident('(Variablenname)'));
      this.expectOp(':', `nach Variablenname ${names[0]}`);
      const type = this.parseTypeSpec();
      let init = null;
      if (this.acceptOp(':=')) init = this.parseInit();
      if (!this.acceptOp(';')) this.err(`";" erwartet nach Deklaration von ${names.join(', ')}`);
      return names.map(name => ({ name, type, init, kind, constant: !!constant, retain: !!retain, line: tok.line, file: this.file }));
    }
    parseInit() {
      if (this.isOp('[')) {
        this.p++;
        const items = [];
        if (!this.isOp(']')) {
          do {
            // 5(0) Wiederholung
            if (this.cur.type === 'num' && this.peek().type === 'op' && this.peek().value === '(') {
              const count = this.t[this.p++].value; this.p++;
              const e = this.isOp(')') ? null : this.parseInit();
              this.expectOp(')');
              items.push({ count, init: e });
            } else items.push({ count: 1, init: this.parseInit() });
          } while (this.acceptOp(','));
        }
        this.expectOp(']');
        return { t: 'arrinit', items };
      }
      if (this.isOp('(') && this.peek().type === 'id' && this.peek(2).type === 'op' && this.peek(2).value === ':=') {
        this.p++;
        const fields = [];
        do {
          const name = this.ident();
          this.expectOp(':=');
          fields.push({ name, init: this.parseInit() });
        } while (this.acceptOp(','));
        this.expectOp(')');
        return { t: 'structinit', fields };
      }
      return this.parseExpr();
    }

    // ----- Anweisungen -----
    parseStatements(ends) {
      const list = [];
      while (true) {
        const c = this.cur;
        if (c.type === 'eof') return list;
        if (c.type === 'kw' && ends.includes(c.value)) return list;
        if (c.type === 'kw' && ['END_IF', 'END_CASE', 'END_FOR', 'END_WHILE', 'END_REPEAT', 'END_PROGRAM', 'END_FUNCTION', 'END_FUNCTION_BLOCK', 'END_ACTION', 'ELSE', 'ELSIF', 'UNTIL'].includes(c.value))
          this.err(`Unerwartetes ${c.value}${ends.length ? ' (erwartet: ' + ends.join(' / ') + ')' : ''}`);
        if (this.acceptOp(';')) continue;
        if (this.isCaseLabelStart(ends)) return list;
        list.push(this.parseStatement());
      }
    }
    isCaseLabelStart(ends) {
      // In CASE-Zweigen beginnt ein neues Label mit Ausdruck gefolgt von ":" bzw. "," / ".."
      if (!ends.includes('__CASE__')) return false;
      let k = this.p, depth = 0;
      while (k < this.t.length) {
        const tk = this.t[k];
        if (tk.type === 'eof') return false;
        if (tk.type === 'op') {
          if (tk.value === '(' || tk.value === '[') depth++;
          else if (tk.value === ')' || tk.value === ']') depth--;
          else if (depth === 0 && tk.value === ':') return true;
          else if (depth === 0 && (tk.value === ':=' || tk.value === ';')) return false;
        }
        if (tk.type === 'kw' && !['TRUE', 'FALSE', 'NOT', 'AND', 'OR', 'XOR', 'MOD'].includes(tk.value)) return false;
        k++;
      }
      return false;
    }
    parseStatement() {
      const tok = this.cur;
      const line = tok.line;
      if (tok.type === 'kw') {
        switch (tok.value) {
          case 'IF': {
            this.p++;
            const conds = [];
            let cond = this.parseExpr();
            this.expectKw('THEN', 'nach IF-Bedingung');
            let body = this.parseStatements(['ELSIF', 'ELSE', 'END_IF']);
            conds.push([cond, body]);
            let els = null;
            while (true) {
              if (this.acceptKw('ELSIF')) {
                cond = this.parseExpr();
                this.expectKw('THEN', 'nach ELSIF-Bedingung');
                body = this.parseStatements(['ELSIF', 'ELSE', 'END_IF']);
                conds.push([cond, body]);
              } else if (this.acceptKw('ELSE')) {
                els = this.parseStatements(['END_IF']);
                this.expectKw('END_IF', `(IF ab Zeile ${line})`);
                break;
              } else { this.expectKw('END_IF', `(IF ab Zeile ${line})`); break; }
            }
            this.acceptOp(';');
            return { s: 'if', conds, els, line };
          }
          case 'CASE': {
            this.p++;
            const sel = this.parseExpr();
            this.expectKw('OF', 'nach CASE-Ausdruck');
            const branches = [];
            let els = null;
            while (!this.isKw('END_CASE')) {
              if (this.cur.type === 'eof') this.err(`END_CASE fehlt (CASE ab Zeile ${line})`);
              if (this.acceptKw('ELSE')) { els = this.parseStatements(['END_CASE']); break; }
              const bline = this.cur.line;
              const labels = [];
              do {
                const lo = this.parseExpr();
                if (this.acceptOp('..')) labels.push({ lo, hi: this.parseExpr() });
                else labels.push({ lo, hi: null });
              } while (this.acceptOp(','));
              this.expectOp(':', 'nach CASE-Label');
              const body = this.parseStatements(['ELSE', 'END_CASE', '__CASE__']);
              branches.push({ labels, body, line: bline });
            }
            this.expectKw('END_CASE', `(CASE ab Zeile ${line})`);
            this.acceptOp(';');
            return { s: 'case', sel, branches, els, line };
          }
          case 'FOR': {
            this.p++;
            const v = this.parsePostfix();
            this.expectOp(':=', 'in FOR-Anweisung');
            const from = this.parseExpr();
            this.expectKw('TO', 'in FOR-Anweisung');
            const to = this.parseExpr();
            let by = null;
            if (this.acceptKw('BY')) by = this.parseExpr();
            this.expectKw('DO', 'in FOR-Anweisung');
            const body = this.parseStatements(['END_FOR']);
            this.expectKw('END_FOR', `(FOR ab Zeile ${line})`);
            this.acceptOp(';');
            return { s: 'for', v, from, to, by, body, line };
          }
          case 'WHILE': {
            this.p++;
            const cond = this.parseExpr();
            this.expectKw('DO', 'nach WHILE-Bedingung');
            const body = this.parseStatements(['END_WHILE']);
            this.expectKw('END_WHILE', `(WHILE ab Zeile ${line})`);
            this.acceptOp(';');
            return { s: 'while', cond, body, line };
          }
          case 'REPEAT': {
            this.p++;
            const body = this.parseStatements(['UNTIL']);
            this.expectKw('UNTIL', `(REPEAT ab Zeile ${line})`);
            const cond = this.parseExpr();
            this.expectKw('END_REPEAT', `(REPEAT ab Zeile ${line})`);
            this.acceptOp(';');
            return { s: 'repeat', cond, body, line };
          }
          case 'EXIT': this.p++; this.expectSemi(); return { s: 'exit', line };
          case 'CONTINUE': this.p++; this.expectSemi(); return { s: 'continue', line };
          case 'RETURN': this.p++; this.expectSemi(); return { s: 'return', line };
          default:
            this.err(`Anweisung erwartet, gefunden ${this.desc()}`);
        }
      }
      // Zuweisung oder Aufruf
      const lhs = this.parsePostfix();
      if (this.acceptOp(':=')) {
        const rhs = this.parseExpr();
        this.expectSemi();
        return { s: 'assign', lhs, rhs, line };
      }
      if (this.isOp('=') ) this.err('"=" ist ein Vergleich – für eine Zuweisung brauchst du ":="');
      if (lhs.t === 'call') { this.expectSemi(); return { s: 'call', call: lhs, line }; }
      if (lhs.t === 'id') { this.expectSemi(); return { s: 'call', call: { t: 'call', callee: lhs.name, target: lhs, args: [], line, bare: true }, line }; }
      this.err(`":=" oder Aufruf erwartet, gefunden ${this.desc()}`);
    }
    expectSemi() { if (!this.acceptOp(';')) this.err(`";" fehlt am Ende der Anweisung (danach folgt ${this.desc()})`, this.t[Math.max(0, this.p - 1)]); }

    // ----- Ausdrücke -----
    parseExpr() { return this.parseOr(); }
    parseOr() {
      let l = this.parseXor();
      while (this.isKw('OR')) { const line = this.cur.line; this.p++; l = { t: 'bin', op: 'OR', l, r: this.parseXor(), line }; }
      return l;
    }
    parseXor() {
      let l = this.parseAnd();
      while (this.isKw('XOR')) { const line = this.cur.line; this.p++; l = { t: 'bin', op: 'XOR', l, r: this.parseAnd(), line }; }
      return l;
    }
    parseAnd() {
      let l = this.parseEq();
      while (this.isKw('AND') || this.isOp('&')) { const line = this.cur.line; this.p++; l = { t: 'bin', op: 'AND', l, r: this.parseEq(), line }; }
      return l;
    }
    parseEq() {
      let l = this.parseRel();
      while (this.isOp('=') || this.isOp('<>')) { const op = this.cur.value, line = this.cur.line; this.p++; l = { t: 'bin', op, l, r: this.parseRel(), line }; }
      return l;
    }
    parseRel() {
      let l = this.parseAdd();
      while (this.isOp('<') || this.isOp('>') || this.isOp('<=') || this.isOp('>=')) { const op = this.cur.value, line = this.cur.line; this.p++; l = { t: 'bin', op, l, r: this.parseAdd(), line }; }
      return l;
    }
    parseAdd() {
      let l = this.parseMul();
      while (this.isOp('+') || this.isOp('-')) { const op = this.cur.value, line = this.cur.line; this.p++; l = { t: 'bin', op, l, r: this.parseMul(), line }; }
      return l;
    }
    parseMul() {
      let l = this.parsePow();
      while (this.isOp('*') || this.isOp('/') || this.isKw('MOD')) { const op = this.cur.value, line = this.cur.line; this.p++; l = { t: 'bin', op, l, r: this.parsePow(), line }; }
      return l;
    }
    parsePow() {
      let l = this.parseUnary();
      while (this.isOp('**')) { const line = this.cur.line; this.p++; l = { t: 'bin', op: '**', l, r: this.parseUnary(), line }; }
      return l;
    }
    parseUnary() {
      const line = this.cur.line;
      if (this.acceptOp('-')) {
        // negative Literale direkt falten
        const e = this.parseUnary();
        if (e.t === 'num') return Object.assign({}, e, { v: -e.v });
        if (e.t === 'time') return Object.assign({}, e, { v: -e.v });
        return { t: 'un', op: '-', e, line };
      }
      if (this.acceptOp('+')) return this.parseUnary();
      if (this.acceptKw('NOT')) return { t: 'un', op: 'NOT', e: this.parseUnary(), line };
      return this.parsePostfix();
    }
    parsePostfix() {
      let e = this.parsePrimary();
      while (true) {
        const line = this.cur.line;
        if (this.isOp('.')) {
          this.p++;
          if (this.cur.type === 'num' && this.cur.isInt) { e = { t: 'bit', obj: e, bit: this.t[this.p++].value, line }; continue; }
          e = { t: 'member', obj: e, name: this.memberName(), line };
          continue;
        }
        if (this.isOp('[')) {
          this.p++;
          const idx = [this.parseExpr()];
          while (this.acceptOp(',')) idx.push(this.parseExpr());
          this.expectOp(']', 'nach Array-Index');
          e = { t: 'index', obj: e, idx, line };
          continue;
        }
        if (this.isOp('(') && (e.t === 'id' || e.t === 'member' || e.t === 'index')) {
          this.p++;
          const args = [];
          if (!this.isOp(')')) {
            do {
              if ((this.cur.type === 'id' || this.cur.type === 'kw') && this.peek().type === 'op' && (this.peek().value === ':=' || this.peek().value === '=>')) {
                const name = String(this.t[this.p++].value);
                const out = this.t[this.p++].value === '=>';
                args.push({ name, out, expr: out ? this.parsePostfix() : this.parseExpr() });
              } else args.push({ name: null, expr: this.parseExpr() });
            } while (this.acceptOp(','));
          }
          this.expectOp(')', 'am Ende der Parameterliste');
          e = { t: 'call', callee: e.t === 'id' ? e.name : null, target: e, args, line };
          continue;
        }
        if (this.isOp('^')) this.err('Dereferenzierung (^) wird im Simulator nicht unterstützt');
        return e;
      }
    }
    parsePrimary() {
      const tok = this.cur;
      const line = tok.line;
      switch (tok.type) {
        case 'num': this.p++; return { t: 'num', v: tok.value, isInt: tok.isInt, line };
        case 'str': this.p++; return { t: 'str', v: tok.value, line };
        case 'time': this.p++; return { t: 'time', v: tok.value, line };
        case 'dt': this.p++; return { t: 'num', v: tok.value, isInt: true, ty: tok.dtKind === 'TOD' || tok.dtKind === 'TIME_OF_DAY' ? 'TOD' : (tok.dtKind === 'D' || tok.dtKind === 'DATE' ? 'DATE' : 'DATE_AND_TIME'), line };
        case 'typed': {
          this.p++;
          const ty = tok.value;
          if (this.cur.type === 'id') { // Enum#Wert
            const name = this.ident();
            return { t: 'enumlit', type: tok.word, name, line };
          }
          const v = this.parseUnary();
          if (v.t === 'num') return Object.assign({}, v, { ty });
          if (v.t === 'bool') return Object.assign({}, v, { ty });
          if (v.t === 'str') return v;
          this.err('Literal nach ' + ty + '# erwartet');
        }
        // fallthrough
        case 'id': this.p++; return { t: 'id', name: tok.value, line };
        case 'kw':
          if (tok.value === 'TRUE' || tok.value === 'FALSE') { this.p++; return { t: 'bool', v: tok.value === 'TRUE', line }; }
          if (tok.value === 'STRING' || tok.value === 'WSTRING') { this.p++; return { t: 'id', name: tok.value, line }; }
          break;
        case 'op':
          if (tok.value === '(') {
            this.p++;
            const e = this.parseExpr();
            this.expectOp(')', 'schließende Klammer');
            return e;
          }
          break;
      }
      this.err(`Ausdruck erwartet, gefunden ${this.desc()}`);
    }
  }

  ST.lex = lex;
  ST.parseUnit = function (src, file) {
    const p = new Parser(lex(src || '', file), file);
    return p.parseUnit();
  };
  ST.parseExpression = function (src, file) {
    const p = new Parser(lex(src, file || 'Ausdruck'), file || 'Ausdruck');
    const e = p.parseExpr();
    if (p.cur.type !== 'eof') p.err('Unerwartetes ' + p.desc() + ' im Ausdruck');
    return e;
  };
  ST.parseStatements = function (src, file) {
    const p = new Parser(lex(src || '', file), file);
    const body = p.parseStatements([]);
    if (p.cur.type !== 'eof') p.err('Unerwartetes ' + p.desc());
    return body;
  };
  ST.parseTime = parseTime;
})(typeof window !== 'undefined' ? (window.ST = window.ST || {}) : (global.ST = global.ST || {}));
