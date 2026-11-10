'use strict';
// Hilfsfunktionen für den Bereich "Visualisierung" (hmi).
// B&R Automation Help (AS6, deutsch): Pfade wurden über die Such-API von help.br-automation.com ermittelt.

const ABGERUFEN = 'Abgerufen am 10. November 2026, von ';
const BR_HELP = 'https://help.br-automation.com/#/de/6/';

/** Reading-Objekt für eine Seite der B&R Automation Help (AS6). */
function brHelp(title, path, minutes, why, work) {
  const url = BR_HELP + path;
  return {
    title,
    author: 'B&R Industrial Automation',
    institution: 'B&R Industrial Automation GmbH',
    work: work || 'Automation Help – mapp View 6',
    year: 'o. J.',
    type: 'Hersteller',
    minutes,
    url,
    why,
    apa: `B&R Industrial Automation. (o. J.). *${title}*. ${work || 'Automation Help – mapp View 6'}. ${ABGERUFEN}${url}`
  };
}

/** Link-Objekt für guide.link auf die B&R Automation Help. */
function brLink(label, path) {
  return { label: 'B&R Help: ' + label, url: BR_HELP + path };
}

module.exports = { brHelp, brLink, ABGERUFEN, BR_HELP };
