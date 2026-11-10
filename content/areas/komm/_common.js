'use strict';
// Gemeinsame Helfer für den Bereich komm (Vernetzung & Kommunikation)
const ABGERUFEN = 'Abgerufen am 10. November 2026, von ';
// B&R Online-Hilfe AS6 (englisch). Pfade stammen aus der Such-API von help.br-automation.com.
const H = p => 'https://help.br-automation.com/#/en/6/' + p;
function brHelp(title, path, why, minutes, extra) {
  const url = H(path);
  return Object.assign({
    title, author: 'B&R Industrial Automation', institution: 'B&R Industrial Automation GmbH',
    work: 'B&R Online-Hilfe, Automation Studio 6', year: 2026, type: 'Hersteller',
    minutes: minutes || 20, url, why,
    apa: `B&R Industrial Automation. (2026). *${title}*. B&R Online-Hilfe (Automation Studio 6). ${ABGERUFEN}${url}`
  }, extra || {});
}
module.exports = { ABGERUFEN, H, brHelp };
