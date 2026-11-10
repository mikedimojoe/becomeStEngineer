/* Selbst gezeichnete Abzeichen (SVG): Stufen, Bereiche, Projekte, Niveau-Ringe */
(function () {
  'use strict';
  const B = window.App.badges = {};
  const COL = { logik: '#ED8934', elektro: '#E6B450', git: '#B1886B', praxis: '#A29376', system: '#7FB3C8', komm: '#6FA8DC', motion: '#5FBF8F', hmi: '#C792EA', regelung: '#E58FA8', safety: '#E26B55' };
  B.color = id => COL[id] || '#ED8934';
  const hex = (cx, cy, r) => { const p = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 90); p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); } return p.join(' '); };

  // Bereichs-Symbole (Linienzeichnungen, 24×24 um Mittelpunkt 0,0)
  const GLYPH = {
    logik: '<path d="M-9 -6h6l4 6-4 6h-6M1 0h8M-12 -3h3M-12 3h3"/>',
    elektro: '<path d="M2 -11 -6 1h6l-2 10 8-12H0z"/>',
    git: '<circle cx="-5" cy="-7" r="2.5"/><circle cx="-5" cy="7" r="2.5"/><circle cx="6" cy="-2" r="2.5"/><path d="M-5 -4.5v9M6 0.5c0 4-6 3-10 4.5"/>',
    praxis: '<path d="M-9 9 3 -3M1 -8l7 7-3 3-7-7zM-10 10l3-1-2-2z"/>',
    system: '<rect x="-10" y="-8" width="20" height="13" rx="1.5"/><path d="M-4 9h8M0 5v4M-6 -3h4M-6 0h7"/>',
    komm: '<circle cx="0" cy="0" r="2.2"/><path d="M-6 -6a8.5 8.5 0 0 0 0 12M6 -6a8.5 8.5 0 0 1 0 12M-10 -10a14 14 0 0 0 0 20M10 -10a14 14 0 0 1 0 20"/>',
    motion: '<circle cx="0" cy="0" r="8"/><circle cx="0" cy="0" r="2.5"/><path d="M0 -8v-3M0 8v3M-8 0h-3M8 0h3M5.7 -5.7l2 -2M-5.7 5.7l-2 2"/>',
    hmi: '<rect x="-10" y="-8" width="20" height="14" rx="2"/><path d="M-6 2l4-4 3 3 5-5M-3 10h6"/>',
    regelung: '<path d="M-11 6h4c3 0 3-12 7-12s3 8 6 8h5M-11 -2h22" stroke-dasharray="0"/>',
    safety: '<path d="M0 -11 9 -7v6c0 6-4 9.5-9 11-5-1.5-9-5-9-11v-6z"/><path d="M-4 0l3 3 5-6"/>'
  };
  B.glyph = id => GLYPH[id] || GLYPH.logik;

  // Stufen-Abzeichen 1–7
  const STAGE_STYLE = [
    { rim: '#6F8792', fill: '#15262F', acc: '#9DB0B8' },   // Grundkurs – Stahl
    { rim: '#8FA1A9', fill: '#17303B', acc: '#C9D3D7' },   // Junior
    { rim: '#B1886B', fill: '#1B3A4A', acc: '#D9B595' },   // Senior – Kupfer
    { rim: '#ED8934', fill: '#1B3A4A', acc: '#F5B57D' },   // Engineer – Orange
    { rim: '#ED8934', fill: '#22404F', acc: '#FFD08A' },   // Master
    { rim: '#E6B450', fill: '#22404F', acc: '#FFE2A0' },   // Guru – Gold
    { rim: '#FFD36B', fill: '#2A4A5A', acc: '#FFF1C2' }    // Genie
  ];
  B.stage = function (s, size, off) {
    const st = STAGE_STYLE[Math.max(0, Math.min(6, s - 1))];
    const rim = off ? '#3A5563' : st.rim, acc = off ? '#4E6875' : st.acc, fill = off ? '#14242C' : st.fill;
    let inner = '';
    switch (s) {
      case 1: inner = `<path d="M-16 0h9M7 0h9M-7 -8v16M7 -8v16M-7 0 5 -7" stroke="${acc}" stroke-width="3" fill="none" stroke-linecap="round"/>`; break; // Schließer
      case 2: inner = `<path d="M-14 -2 0 -12 14 -2M-14 9 0 -1 14 9" stroke="${acc}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; break;
      case 3: inner = `<path d="M-15 -10h30L0 14z" fill="${acc}"/><path d="M-15 -10h30L0 14z" fill="none" stroke="${rim}" stroke-width="1.5"/>`; break; // Dreieck (Marke)
      case 4: inner = gear(0, 0, 14, 10, 8, acc) + `<circle r="4.5" fill="${fill}"/>`; break;
      case 5: inner = gear(0, -2, 12, 8.5, 8, acc) + `<circle cy="-2" r="4" fill="${fill}"/>` + laurel(acc); break;
      case 6: inner = `<circle r="17" fill="none" stroke="${acc}" stroke-width="1.5" stroke-dasharray="2 3"/>` + star(0, 0, 13, 5.5, acc); break;
      default: inner = `<polygon points="${hex(0, 0, 18)}" fill="none" stroke="${acc}" stroke-width="1.5"/>` + star(0, 0, 14, 6, acc) + `<circle r="3" fill="${fill}"/>` + `<path d="M-22 -22l4 4M22 -22l-4 4M-22 22l4-4M22 22l-4-4" stroke="${acc}" stroke-width="2" stroke-linecap="round"/>`;
    }
    const ticks = Array.from({ length: 7 }, (_, i) => { const a = Math.PI / 180 * (-150 + i * 20); const on = i < s; return `<circle cx="${(34 * Math.cos(a)).toFixed(1)}" cy="${(34 * Math.sin(a) + 1).toFixed(1)}" r="2.2" fill="${on && !off ? acc : '#2C4957'}"/>`; }).join('');
    return `<svg viewBox="-50 -50 100 100" width="${size || 64}" height="${size || 64}" role="img" aria-label="Stufe ${s}">
      <polygon points="${hex(0, 0, 44)}" fill="${fill}" stroke="${rim}" stroke-width="3"/>
      <polygon points="${hex(0, 0, 38)}" fill="none" stroke="${rim}" stroke-opacity=".45" stroke-width="1"/>
      ${ticks}<g transform="translate(0,3)">${inner}</g></svg>`;
  };
  function gear(cx, cy, ro, ri, n, col) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n, r = i % 2 ? ri : ro;
      d += (i ? 'L' : 'M') + (cx + r * Math.cos(a0)).toFixed(1) + ' ' + (cy + r * Math.sin(a0)).toFixed(1) + 'L' + (cx + r * Math.cos(a1)).toFixed(1) + ' ' + (cy + r * Math.sin(a1)).toFixed(1);
    }
    return `<path d="${d}Z" fill="${col}"/>`;
  }
  function star(cx, cy, ro, ri, col) {
    let p = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, r = i % 2 ? ri : ro; p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1)); }
    return `<polygon points="${p.join(' ')}" fill="${col}"/>`;
  }
  function laurel(col) {
    let s = '';
    for (let i = 0; i < 4; i++) { const y = 14 - i * 6; s += `<ellipse cx="${-17 + i * 1.5}" cy="${y}" rx="2" ry="4" transform="rotate(${-30 + i * 10} ${-17 + i * 1.5} ${y})" fill="${col}"/><ellipse cx="${17 - i * 1.5}" cy="${y}" rx="2" ry="4" transform="rotate(${30 - i * 10} ${17 - i * 1.5} ${y})" fill="${col}"/>`; }
    return s;
  }

  // Projekt-Abzeichen (Elite-Fähigkeit)
  B.project = function (area, name, off, size) {
    const c = off ? '#3A5563' : B.color(area);
    return `<svg viewBox="-40 -40 80 80" width="${size || 72}" height="${size || 72}" role="img" aria-label="${(name || '').replace(/"/g, '')}">
      <polygon points="${hex(0, 0, 36)}" fill="#15262F" stroke="${c}" stroke-width="2.5"/>
      <polygon points="${hex(0, 0, 30)}" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-opacity=".5"/>
      <g transform="scale(1.15)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${B.glyph(area)}</g>
      <path d="M-14 31h28" stroke="${c}" stroke-width="2"/></svg>`;
  };
  B.check = function (area) {
    const c = B.color(area);
    return `<svg viewBox="-40 -40 80 80" width="96" height="96"><circle r="34" fill="none" stroke="${c}" stroke-width="2.5" stroke-dasharray="214" stroke-dashoffset="214"><animate attributeName="stroke-dashoffset" to="0" dur=".7s" fill="freeze"/></circle><path d="M-13 1l9 9 17-19" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="44" stroke-dashoffset="44"><animate attributeName="stroke-dashoffset" to="0" begin=".45s" dur=".4s" fill="freeze"/></path></svg>`;
  };
  // Niveau-Ring: 6 Segmente
  B.ring = function (area, niveau, maxLevel, minLevel, pct, size) {
    const c = B.color(area);
    maxLevel = maxLevel || 6; minLevel = minLevel || 1;
    let s = '';
    for (let i = 0; i < 6; i++) {
      const L = i + 1;
      const a0 = -90 + i * 60 + 3, a1 = -90 + (i + 1) * 60 - 3;
      const p = (a, r) => [(r * Math.cos(a * Math.PI / 180)).toFixed(2), (r * Math.sin(a * Math.PI / 180)).toFixed(2)];
      const [x0, y0] = p(a0, 30), [x1, y1] = p(a1, 30);
      const na = L < minLevel || L > maxLevel;
      const on = L <= niveau;
      s += `<path d="M${x0} ${y0} A30 30 0 0 1 ${x1} ${y1}" fill="none" stroke="${na ? '#1E3540' : on ? c : '#2C4957'}" stroke-width="7" ${na ? 'stroke-dasharray="2 3"' : ''}/>`;
    }
    return `<svg viewBox="-40 -40 80 80" width="${size || 92}" height="${size || 92}" role="img" aria-label="Niveau ${niveau}">${s}
      <g transform="scale(.75)" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${B.glyph(area)}</g>
      <text y="33" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="#8FA1A9"></text></svg>`;
  };
  B.logo = function (h) { return `<svg width="${(h || 18) * 1.3}" height="${h || 18}" viewBox="0 0 26 20" aria-hidden="true"><path d="M1 1h24L13 19z" fill="#fff"/></svg>`; };
})();
