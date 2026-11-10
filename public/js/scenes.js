/* Anlagen-Szenen für die Simulation: Förderband, Tank, Achse, Ampel, Zylinder, Leuchtmelder, Motor */
(function () {
  'use strict';
  const App = window.App;
  const S = App.scenes = {};
  const OFF = '#2C4957', ON = '#ED8934', LINE = '#4E6875', TXT = '#8FA1A9';
  const lab = (x, y, t, a) => `<text x="${x}" y="${y}" font-family="JetBrains Mono" font-size="11" fill="${TXT}" text-anchor="${a || 'start'}">${t}</text>`;

  // Szene erzeugen: liefert { el, update(read) } – read(name) liefert Wert oder undefined
  S.create = function (scene) {
    if (!scene || !scene.type || scene.type === 'generic') return null;
    const f = S[scene.type];
    if (!f) return null;
    const wrap = document.createElement('div');
    wrap.className = 'scene';
    const r = f(scene.bind || {}, scene);
    wrap.innerHTML = r.svg;
    const root = wrap.firstChild;
    const q = sel => root.querySelector(sel);
    return { el: wrap, update: read => r.update(q, read, root) };
  };
  const b = (read, name) => !!(name && read(name));
  const n = (read, name, d) => { const v = name ? read(name) : undefined; return typeof v === 'number' ? v : (typeof v === 'boolean' ? (v ? 1 : 0) : d || 0); };

  S.conveyor = function (bind) {
    const svg = `<svg viewBox="0 0 600 170" role="img" aria-label="Förderband">
      <rect x="40" y="96" width="520" height="22" rx="11" fill="#15262F" stroke="${LINE}" stroke-width="2"/>
      <g id="belt">${Array.from({ length: 27 }, (_, i) => `<path d="M${52 + i * 19} 99v16" stroke="#3A5563" stroke-width="2"/>`).join('')}</g>
      <circle cx="51" cy="107" r="11" fill="#1F3742" stroke="${LINE}" stroke-width="2"/><circle cx="549" cy="107" r="11" fill="#1F3742" stroke="${LINE}" stroke-width="2"/>
      <g id="motor" transform="translate(549,140)"><circle r="14" fill="#15262F" stroke="${OFF}" stroke-width="2"/><text y="4" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="${TXT}">M</text></g>
      ${lab(500, 166, 'M1 Bandmotor')}
      <g id="part"><rect x="-18" y="-26" width="36" height="26" rx="3" fill="#B1886B" stroke="#D9B595"/></g>
      <g transform="translate(430,40)"><rect x="-8" y="0" width="16" height="22" rx="2" fill="#15262F" stroke="${LINE}"/><path id="beam" d="M0 22V96" stroke="${OFF}" stroke-width="2" stroke-dasharray="4 4"/><circle id="s1" cx="0" cy="11" r="4" fill="${OFF}"/></g>
      ${lab(430, 30, 'B1', 'middle')}
      <g id="s2g" transform="translate(140,40)" ${bind.sensor2 ? '' : 'style="display:none"'}><rect x="-8" y="0" width="16" height="22" rx="2" fill="#15262F" stroke="${LINE}"/><path id="beam2" d="M0 22V96" stroke="${OFF}" stroke-width="2" stroke-dasharray="4 4"/><circle id="s2" cx="0" cy="11" r="4" fill="${OFF}"/></g>
      ${bind.sensor2 ? lab(140, 30, 'B2', 'middle') : ''}
      <text id="cnt" x="40" y="30" font-family="JetBrains Mono" font-size="13" fill="#fff"></text>
      <path id="dir" d="M300 140h40l-8-6M340 140l-8 6" stroke="${OFF}" stroke-width="2" fill="none"/></svg>`;
    let off = 0, ownPos = 0;
    return { svg, update(q, read) {
      const run = b(read, bind.motor), rev = b(read, bind.reverse);
      q('#motor circle').setAttribute('stroke', run ? ON : OFF);
      if (run) off = (off + (rev ? -2 : 2) + 19) % 19;
      q('#belt').setAttribute('transform', `translate(${off - 9},0)`);
      let p = bind.partPos ? n(read, bind.partPos) : null;
      if (p === null) { if (run) ownPos = (ownPos + (rev ? -0.004 : 0.004) + 1) % 1; p = ownPos; }
      p = Math.max(0, Math.min(1, p));
      q('#part').setAttribute('transform', `translate(${(70 + p * 460).toFixed(1)},96)`);
      const s1 = b(read, bind.sensor), s2 = b(read, bind.sensor2);
      q('#s1').setAttribute('fill', s1 ? ON : OFF); q('#beam').setAttribute('stroke', s1 ? ON : OFF);
      q('#s2').setAttribute('fill', s2 ? ON : OFF); q('#beam2').setAttribute('stroke', s2 ? ON : OFF);
      q('#cnt').textContent = bind.count ? 'Zähler: ' + n(read, bind.count) : '';
      q('#dir').setAttribute('stroke', run ? ON : OFF);
      q('#dir').setAttribute('transform', rev ? 'translate(640,0) scale(-1,1)' : '');
    } };
  };

  S.tank = function (bind) {
    const svg = `<svg viewBox="0 0 600 230" role="img" aria-label="Behälter">
      <path d="M40 30H190" stroke="${LINE}" stroke-width="8"/><g id="vin" transform="translate(120,30)"><path d="M-12 -10 12 10V-10L-12 10z" fill="#15262F" stroke="${OFF}" stroke-width="2"/></g>${lab(108, 18, 'Y1 Zulauf')}
      <rect x="200" y="30" width="200" height="170" rx="6" fill="#0F1D25" stroke="${LINE}" stroke-width="3"/>
      <rect id="liq" x="203" y="197" width="194" height="0" fill="#6FA8DC" fill-opacity=".45"/>
      <path d="M300 200V214H460" stroke="${LINE}" stroke-width="8"/><g id="vout" transform="translate(440,214)"><path d="M-12 -10 12 10V-10L-12 10z" fill="#15262F" stroke="${OFF}" stroke-width="2"/></g>${lab(426, 200, 'Y2 Ablauf')}
      <g id="heat"><path d="M220 186h160" stroke="${OFF}" stroke-width="4" stroke-dasharray="10 6"/></g>${lab(206, 225, 'E1 Heizung')}
      <g id="mix" transform="translate(300,110)"><path d="M0 -90V40" stroke="${LINE}" stroke-width="3"/><path id="blade" d="M-30 40h60" stroke="${OFF}" stroke-width="5" stroke-linecap="round"/></g>
      <g transform="translate(412,52)"><circle id="lsh" r="6" fill="${OFF}"/></g>${lab(424, 56, 'LSH')}
      <g transform="translate(412,180)"><circle id="lsl" r="6" fill="${OFF}"/></g>${lab(424, 184, 'LSL')}
      <text id="lv" x="500" y="100" font-family="JetBrains Mono" font-size="20" fill="#fff" text-anchor="middle"></text>${lab(500, 120, 'Füllstand', 'middle')}
      <text id="tp" x="500" y="160" font-family="JetBrains Mono" font-size="20" fill="#fff" text-anchor="middle"></text>${lab(500, 180, bind.temp ? 'Temperatur' : '', 'middle')}
      </svg>`;
    let ang = 0;
    return { svg, update(q, read) {
      const lv = Math.max(0, Math.min(100, n(read, bind.level)));
      const hgt = 164 * lv / 100;
      const liq = q('#liq'); liq.setAttribute('y', (197 - hgt).toFixed(1)); liq.setAttribute('height', hgt.toFixed(1));
      q('#vin path').setAttribute('stroke', b(read, bind.inlet) ? ON : OFF); q('#vin path').setAttribute('fill', b(read, bind.inlet) ? 'rgba(237,137,52,.25)' : '#15262F');
      q('#vout path').setAttribute('stroke', b(read, bind.outlet) ? ON : OFF); q('#vout path').setAttribute('fill', b(read, bind.outlet) ? 'rgba(237,137,52,.25)' : '#15262F');
      q('#heat path').setAttribute('stroke', b(read, bind.heater) ? '#E26B55' : OFF);
      const mix = b(read, bind.mixer); if (mix) ang = (ang + 12) % 360;
      q('#blade').setAttribute('transform', `scale(${Math.cos(ang * Math.PI / 180).toFixed(2)},1)`); q('#blade').setAttribute('stroke', mix ? ON : OFF);
      q('#mix').style.display = bind.mixer ? '' : 'none';
      q('#lsh').setAttribute('fill', b(read, bind.lsHigh) ? ON : OFF); q('#lsl').setAttribute('fill', b(read, bind.lsLow) ? ON : OFF);
      q('#lv').textContent = bind.level ? lv.toFixed(1) + ' %' : '';
      q('#tp').textContent = bind.temp ? n(read, bind.temp).toFixed(1) + ' °C' : '';
    } };
  };

  S.axis = function (bind) {
    const mn = typeof bind.min === 'number' ? bind.min : 0, mx = typeof bind.max === 'number' ? bind.max : 1000;
    const svg = `<svg viewBox="0 0 600 150" role="img" aria-label="Linearachse">
      <rect x="40" y="70" width="520" height="16" rx="3" fill="#15262F" stroke="${LINE}" stroke-width="2"/>
      ${Array.from({ length: 11 }, (_, i) => `<path d="M${60 + i * 48} 90v8" stroke="${LINE}"/>${lab(60 + i * 48, 112, Math.round(mn + (mx - mn) * i / 10), 'middle')}`).join('')}
      <path d="M60 64V92M540 64V92" stroke="#E26B55" stroke-width="2"/>
      <g id="sl"><rect x="-26" y="40" width="52" height="30" rx="4" fill="#1F3742" stroke="${OFF}" stroke-width="2"/><path d="M0 70v16" stroke="${OFF}" stroke-width="3"/></g>
      <g transform="translate(24,78)"><rect x="-16" y="-16" width="32" height="32" rx="4" fill="#15262F" stroke="${LINE}" stroke-width="2"/><text y="4" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="${TXT}">M</text></g>
      <text id="pos" x="300" y="26" text-anchor="middle" font-family="JetBrains Mono" font-size="16" fill="#fff"></text>
      <g font-family="JetBrains Mono" font-size="11"><circle id="pw" cx="60" cy="138" r="5" fill="${OFF}"/><text x="70" y="142" fill="${TXT}">Power</text>
      <circle id="hm" cx="150" cy="138" r="5" fill="${OFF}"/><text x="160" y="142" fill="${TXT}">Referenziert</text>
      <circle id="er" cx="270" cy="138" r="5" fill="${OFF}"/><text x="280" y="142" fill="${TXT}">Fehler</text></g></svg>`;
    return { svg, update(q, read) {
      let v = read(bind.position);
      if (v && typeof v === 'object' && 'position' in v) v = v.position;
      const p = typeof v === 'number' ? v : 0;
      const x = 60 + 480 * Math.max(-0.05, Math.min(1.05, (p - mn) / ((mx - mn) || 1)));
      q('#sl').setAttribute('transform', `translate(${x.toFixed(1)},0)`);
      q('#pos').textContent = p.toFixed(2) + ' mm';
      const ax = read(bind.position);
      const pw = bind.powered ? b(read, bind.powered) : ax && ax.powered, hm = bind.homed ? b(read, bind.homed) : ax && ax.homed, er = bind.error ? b(read, bind.error) : ax && ax.error;
      q('#pw').setAttribute('fill', pw ? '#5FBF8F' : OFF); q('#hm').setAttribute('fill', hm ? '#5FBF8F' : OFF); q('#er').setAttribute('fill', er ? '#E26B55' : OFF);
      q('#sl rect').setAttribute('stroke', er ? '#E26B55' : pw ? ON : OFF);
    } };
  };

  S.trafficlight = function (bind) {
    const svg = `<svg viewBox="0 0 600 200" role="img" aria-label="Ampel">
      <path d="M0 170H600" stroke="#2C4957" stroke-width="40"/><path d="M0 170H600" stroke="#4E6875" stroke-width="2" stroke-dasharray="20 16"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${250 + i * 18}" y="150" width="10" height="40" fill="#8FA1A9" opacity=".5"/>`).join('')}
      <g transform="translate(150,20)"><rect width="54" height="140" rx="8" fill="#0B171D" stroke="${LINE}" stroke-width="2"/>
        <circle id="r" cx="27" cy="27" r="17" fill="${OFF}"/><circle id="y" cx="27" cy="70" r="17" fill="${OFF}"/><circle id="g" cx="27" cy="113" r="17" fill="${OFF}"/></g>${lab(177, 195, 'Fahrzeuge', 'middle')}
      <g id="ped" transform="translate(440,40)"><rect width="44" height="96" rx="6" fill="#0B171D" stroke="${LINE}" stroke-width="2"/>
        <circle id="pr" cx="22" cy="26" r="14" fill="${OFF}"/><circle id="pg" cx="22" cy="70" r="14" fill="${OFF}"/></g>${lab(462, 152, 'Fußgänger', 'middle')}
      <g transform="translate(530,90)"><rect x="-14" y="-14" width="28" height="28" rx="4" fill="#15262F" stroke="${LINE}"/><circle id="rq" r="7" fill="${OFF}"/></g>${lab(530, 125, 'Taster', 'middle')}</svg>`;
    return { svg, update(q, read) {
      q('#r').setAttribute('fill', b(read, bind.red) ? '#E26B55' : OFF); q('#y').setAttribute('fill', b(read, bind.yellow) ? '#E6B450' : OFF); q('#g').setAttribute('fill', b(read, bind.green) ? '#5FBF8F' : OFF);
      q('#pr').setAttribute('fill', b(read, bind.pedRed) ? '#E26B55' : OFF); q('#pg').setAttribute('fill', b(read, bind.pedGreen) ? '#5FBF8F' : OFF);
      q('#rq').setAttribute('fill', b(read, bind.request) ? ON : OFF);
      q('#ped').style.opacity = bind.pedRed || bind.pedGreen ? 1 : .3;
    } };
  };

  S.cylinder = function (bind) {
    const svg = `<svg viewBox="0 0 600 160" role="img" aria-label="Pneumatikzylinder">
      <rect x="80" y="50" width="220" height="60" rx="4" fill="#15262F" stroke="${LINE}" stroke-width="3"/>
      <g id="pist"><rect x="0" y="53" width="14" height="54" fill="#4E6875"/><rect x="14" y="74" width="260" height="12" fill="#8FA1A9"/><rect x="274" y="62" width="22" height="36" rx="3" fill="#B1886B"/></g>
      <g transform="translate(120,40)"><circle id="bi" r="6" fill="${OFF}"/></g>${lab(108, 30, 'B1 hinten')}
      <g transform="translate(270,40)"><circle id="bo" r="6" fill="${OFF}"/></g>${lab(258, 30, 'B2 vorne')}
      <path d="M100 110v30h-40M260 110v30h40" stroke="${LINE}" stroke-width="3" fill="none"/>
      <g transform="translate(150,140)"><rect id="y1" x="-30" y="-12" width="60" height="24" rx="3" fill="#15262F" stroke="${OFF}" stroke-width="2"/><text y="4" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="${TXT}">Y1 aus</text></g>
      <g transform="translate(230,140)"><rect id="y2" x="-30" y="-12" width="60" height="24" rx="3" fill="#15262F" stroke="${OFF}" stroke-width="2"/><text y="4" text-anchor="middle" font-family="JetBrains Mono" font-size="11" fill="${TXT}">Y2 ein</text></g></svg>`;
    let pos = 0;
    return { svg, update(q, read) {
      let st = bind.stroke ? n(read, bind.stroke) : null;
      if (st === null) { const ext = b(read, bind.extend), ret = b(read, bind.retract); if (ext && !ret) pos = Math.min(1, pos + 0.03); if (ret && !ext) pos = Math.max(0, pos - 0.03); if (!bind.retract && !ext) pos = Math.max(0, pos - 0.03); st = pos; }
      q('#pist').setAttribute('transform', `translate(${(84 + 190 * Math.max(0, Math.min(1, st))).toFixed(1)},0)`);
      q('#bi').setAttribute('fill', b(read, bind.isIn) ? ON : OFF); q('#bo').setAttribute('fill', b(read, bind.isOut) ? ON : OFF);
      q('#y1').setAttribute('stroke', b(read, bind.extend) ? ON : OFF); q('#y2').setAttribute('stroke', b(read, bind.retract) ? ON : OFF);
    } };
  };

  S.lamp = function (bind) {
    const lamps = Array.isArray(bind.lamps) ? bind.lamps : [];
    const w = Math.max(300, lamps.length * 120);
    const svg = `<svg viewBox="0 0 ${w} 130" role="img" aria-label="Leuchtmelder">${lamps.map((l, i) => { const x = 60 + i * ((w - 120) / Math.max(1, lamps.length - 1 || 1)); const cx = lamps.length === 1 ? w / 2 : x;
      return `<g transform="translate(${cx},55)"><circle r="30" fill="#0B171D" stroke="${LINE}" stroke-width="3"/><circle class="lp" data-i="${i}" r="22" fill="${OFF}"/><path d="M-12-12l24 24M12-12l-24 24" stroke="#0F1D25" stroke-width="2" opacity=".5"/></g>${lab(cx, 112, l, 'middle')}`; }).join('')}</svg>`;
    return { svg, update(q, read, root) {
      root.querySelectorAll('.lp').forEach(c => { const on = b(read, lamps[+c.dataset.i]); const nm = lamps[+c.dataset.i].toLowerCase(); const col = /red|rot|fault|error|stoer|hupe|alarm/.test(nm) ? '#E26B55' : /green|gruen|ok|ready|run/.test(nm) ? '#5FBF8F' : /yellow|gelb|warn/.test(nm) ? '#E6B450' : ON;
        c.setAttribute('fill', on ? col : OFF); c.style.filter = on ? `drop-shadow(0 0 8px ${col})` : ''; });
    } };
  };

  S.motor = function (bind) {
    const svg = `<svg viewBox="0 0 600 160" role="img" aria-label="Motor">
      <g transform="translate(160,80)"><circle r="56" fill="#15262F" stroke="${LINE}" stroke-width="3"/><text y="-14" text-anchor="middle" font-family="JetBrains Mono" font-size="18" fill="#fff">M</text><text y="8" text-anchor="middle" font-family="JetBrains Mono" font-size="12" fill="${TXT}">3~</text>
        <g id="rot"><path d="M0 22V48M-22 35h44" stroke="${OFF}" stroke-width="4" stroke-linecap="round"/></g></g>
      <path d="M216 80H330" stroke="${LINE}" stroke-width="10"/>
      <text id="sp" x="450" y="60" font-family="JetBrains Mono" font-size="20" fill="#fff" text-anchor="middle"></text>${lab(450, 78, 'Drehzahl', 'middle')}
      <text id="cu" x="450" y="118" font-family="JetBrains Mono" font-size="20" fill="#fff" text-anchor="middle"></text>${lab(450, 136, 'Strom', 'middle')}
      <g transform="translate(40,24)"><circle id="ft" r="8" fill="${OFF}"/></g>${lab(54, 28, 'Störung')}</svg>`;
    let ang = 0;
    return { svg, update(q, read) {
      const run = b(read, bind.run), sp = n(read, bind.speed, run ? 100 : 0);
      if (run) ang = (ang + Math.max(4, Math.min(30, Math.abs(sp) / 50))) % 360;
      q('#rot').setAttribute('transform', `translate(0,-35) rotate(${ang}) translate(0,35)`);
      q('#rot path').setAttribute('stroke', run ? ON : OFF);
      q('#sp').textContent = bind.speed ? sp.toFixed(0) : (run ? 'läuft' : 'steht');
      q('#cu').textContent = bind.current ? n(read, bind.current).toFixed(2) + ' A' : '';
      q('#ft').setAttribute('fill', b(read, bind.fault) ? '#E26B55' : OFF);
    } };
  };
})();
