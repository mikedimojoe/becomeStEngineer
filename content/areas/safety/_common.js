'use strict';
// Gemeinsame Bausteine für den Bereich "Funktionale Sicherheit".

const HINWEIS = ' **Hinweis:** Alle Inhalte sind Orientierung, keine Rechtsberatung. ' +
  'Sicherheitsgerichtete Programmierung nur nach Unterweisung und immer mit Validierung.';

const ST_HINWEIS = '> **Wichtig:** Echte Sicherheitslogik gehört in den **SafeDESIGNER** (SafeLOGIC), nicht in Standard-ST. ' +
  'Diese Übung betrifft ausschließlich die **Standard-SPS-Seite**: Sie wertet Statussignale der Sicherheitssteuerung aus, ' +
  'erzeugt Meldungen, Quittieranforderungen und funktionale Abläufe. Die Abschaltung selbst übernimmt immer die Sicherheitssteuerung.\n\n';

const ABGERUFEN = 'Abgerufen am 10. November 2026, von ';

// B&R Online-Hilfe (AS6, deutsch)
const brHelp = p => 'https://help.br-automation.com/#/de/6/' + p;

function brReading(title, path, why, minutes) {
  const url = brHelp(path);
  return {
    title, author: 'B&R Industrial Automation', institution: 'B&R Industrial Automation GmbH',
    work: 'Automation Help 6 – Safety-Technologie', year: 2026, type: 'Hersteller',
    minutes: minutes || 20, url, why,
    apa: `B&R Industrial Automation. (2026). *${title}*. Automation Help 6. ${ABGERUFEN}${url}`
  };
}

const MAIN_EMPTY = 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\nEND_PROGRAM\n';

module.exports = { HINWEIS, ST_HINWEIS, ABGERUFEN, brHelp, brReading, MAIN_EMPTY };
