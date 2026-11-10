'use strict';
// Bereich „Elektrotechnische Grundlagen“ – Zielniveau: ausgelernte/r Elektroniker/in für Automatisierungstechnik.
// Inhalte liegen in content/areas/elektro/level*.js; Quellen in content/areas/elektro/refs.js.
module.exports = {
  id: 'elektro',
  title: 'Elektrotechnische Grundlagen',
  short: 'Elektro',
  description: 'Vom Ohmschen Gesetz über Drehstrom, Schütz- und Motorsteuerungen, Sensorik und Aktorik bis zu Netzsystemen, Schutzmaßnahmen, Prüfungen nach DIN VDE 0100-600 / DIN EN 60204-1, EMV und Frequenzumrichter. Jede Lektion verbindet die Elektrotechnik mit einer ST-Übung, wie sie an realen B&R-Maschinen vorkommt. Orientierung, keine Rechts- oder Sicherheitsberatung; Arbeiten an elektrischen Anlagen nur durch Elektrofachkräfte.',
  sources: [
    'BIBB – Berufsprofil Elektroniker/in für Automatisierungstechnik: https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/655665',
    'BIBB – TQ-Berufsset Elektroniker/-in für Automatisierungstechnik (2023): https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/regulation/TQ_Elektroniker_fuer_Automatisierungstechnik_2023.pdf',
    'IHK Berlin – Ausbildungsberuf Elektroniker/in für Automatisierungstechnik: https://www.ihk.de/berlin/ausbildung/ausbildungsberufe-von-a-bis-z/elektronikerautomatist-2262322',
    'Pannek, Universität Bremen – Skript Elektrotechnik: https://www.tu-braunschweig.de/fileadmin/Redaktionsgruppen/Institute_Fakultaet_4/ITL/Lehre/Vorlesungen/Skripte/UniBremen/2018_et.pdf',
    'Binder, TU Darmstadt – Elektrische Maschinen und Antriebe: https://www.ew.tu-darmstadt.de/media/ew/rd/ew_vorlesungen/lv_ema/EMA_Skript_2022_23_komp.pdf',
    'BG ETEM – Sicherheit zum Nachschlagen Elektrotechnik: https://medien.bgetem.de/medienportal/artikel/TUIwMzI-/@@download/download',
    'IHK-Orientierungshilfe Inbetriebnahme/VDE-Prüfung: https://ihk.de/blueprint/servlet/resource/blob/5263712/49b537556b8690ffe0685e89ac2e3c09/orientierungshilfe-zq-effft-teil-2-data.pdf',
    'B&R Community (Analog-I/O, Diagnose): https://community.br-automation.com/'
  ],
  modules: [
    ...require('./elektro/level1'),
    ...require('./elektro/level2'),
    ...require('./elektro/level3'),
    ...require('./elektro/level4')
  ]
};
