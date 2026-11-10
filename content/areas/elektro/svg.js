'use strict';
// Kleine Helfer für Stromlaufplan-Ausschnitte (inline SVG, nur currentColor).
// Kontakte vertikal gezeichnet, Strompfad von oben nach unten (IEC 60617-Stil, vereinfacht).

const T = (x, y, s, anchor) => `<text x="${x}" y="${y}" fill="currentColor" stroke="none" text-anchor="${anchor || 'end'}">${s}</text>`;
const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;

// Schließer zwischen y und y+32
function no(x, y, label, labelRight) {
  return L(x, y, x, y + 8) + L(x, y + 24, x, y + 32) + L(x, y + 24, x - 12, y + 6) +
    T(labelRight ? x + 10 : x - 16, y + 20, label, labelRight ? 'start' : 'end');
}
// Öffner zwischen y und y+32
function nc(x, y, label, labelRight) {
  return L(x, y, x, y + 8) + L(x, y + 8, x + 10, y + 8) + L(x, y + 24, x, y + 32) + L(x, y + 24, x + 13, y + 5) +
    T(labelRight ? x + 18 : x - 8, y + 20, label, labelRight ? 'start' : 'end');
}
// Spule zwischen y und y+40
function coil(x, y, label, labelRight) {
  return L(x, y, x, y + 8) + `<rect x="${x - 14}" y="${y + 8}" width="28" height="24"/>` + L(x, y + 32, x, y + 40) +
    T(labelRight ? x + 20 : x - 20, y + 24, label, labelRight ? 'start' : 'end');
}
const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="2.5" fill="currentColor"/>`;

function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="1.6" font-family="sans-serif" font-size="11">${body}</svg>`;
}

// Selbsthaltung: -S1 (Öffner), -S2 (Schließer) parallel -K1 13/14, Spule -K1
const selbsthaltung = svg(300, 250,
  L(30, 16, 280, 16) + T(24, 20, 'L+') + L(30, 236, 280, 236) + T(24, 240, 'M') +
  L(120, 16, 120, 36) + nc(120, 36, '-S1') +
  L(120, 68, 120, 88) + dot(120, 88) + L(120, 88, 190, 88) +
  no(120, 88, '-S2') + no(190, 88, '-K1 13/14', true) +
  L(120, 120, 120, 140) + L(190, 120, 190, 140) + L(120, 140, 190, 140) + dot(120, 140) +
  L(120, 140, 120, 160) + coil(120, 160, '-K1') + L(120, 200, 120, 236)
);

// Wendeschützschaltung: -S1 Stopp, Pfad K1 (S2 ∥ K1 13/14, K2 21/22), Pfad K2 (S3 ∥ K2 13/14, K1 21/22)
function pathBlock(x, sTaster, kSelf, kLock, kCoil) {
  return L(x, 76, x, 90) + dot(x, 90) + L(x, 90, x + 56, 90) +
    no(x, 90, sTaster) + no(x + 56, 90, kSelf, true) +
    L(x, 122, x, 136) + L(x + 56, 122, x + 56, 136) + L(x, 136, x + 56, 136) + dot(x, 136) +
    nc(x, 136, kLock) + L(x, 168, x, 180) + coil(x, 180, kCoil) + L(x, 220, x, 246);
}
const wendeschuetz = svg(420, 260,
  L(30, 16, 400, 16) + T(24, 20, 'L+') + L(30, 246, 400, 246) + T(24, 250, 'M') +
  L(70, 16, 70, 30) + nc(70, 30, '-S1') + L(70, 62, 70, 76) + L(70, 76, 280, 76) + dot(110, 76) + dot(280, 76) +
  L(70, 76, 110, 76) +
  pathBlock(110, '-S2', '-K1 13/14', '-K2 21/22', '-K1') +
  pathBlock(280, '-S3', '-K2 13/14', '-K1 21/22', '-K2')
);

// Sensor 3-Leiter PNP an Digitaleingang
const pnp3 = svg(360, 170,
  `<rect x="20" y="40" width="90" height="90"/>` + T(65, 34, 'Sensor -BG1', 'middle') +
  T(65, 90, 'PNP', 'middle') +
  L(110, 60, 230, 60) + T(118, 54, 'BN (1)', 'start') + L(110, 85, 230, 85) + T(118, 79, 'BK (4)', 'start') +
  L(110, 110, 230, 110) + T(118, 104, 'BU (3)', 'start') +
  `<rect x="230" y="40" width="110" height="90"/>` + T(285, 34, 'SPS-Eingangsmodul', 'middle') +
  T(240, 64, '+24 V', 'start') + T(240, 89, 'DI 1', 'start') + T(240, 114, '0 V (M)', 'start')
);

// PT100 in 2-, 3-, 4-Leiter (nur 3-Leiter gezeichnet)
const pt3 = svg(340, 150,
  `<rect x="40" y="50" width="24" height="50"/>` + T(36, 80, 'Pt100', 'end') +
  L(52, 50, 52, 30) + L(52, 30, 220, 30) + L(52, 100, 52, 120) + L(52, 120, 220, 120) + L(80, 120, 80, 75) + L(80, 75, 220, 75) +
  dot(80, 120) +
  `<rect x="220" y="15" width="100" height="120"/>` + T(270, 145, 'Messmodul', 'middle') +
  T(228, 34, 'Klemme 1', 'start') + T(228, 79, 'Klemme 2', 'start') + T(228, 124, 'Klemme 3', 'start')
);

module.exports = { selbsthaltung, wendeschuetz, pnp3, pt3, svg, no, nc, coil, L, T, dot };
