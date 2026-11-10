'use strict';
module.exports = {
  id: 'praxis',
  title: 'Engineering-Praxis',
  short: 'Praxis',
  description: 'Wie professionelle SPS-Software entsteht: Arbeitsweise im Team, Coding Guidelines, Anforderungen und Signallisten, Inbetriebnahme, Tests und Abnahme, Normen-Orientierung, Architektur-Entscheidungen, Standardisierung sowie Mentoring und technische Führung. Jede Stufe verbindet Methodik mit ST-Übungen aus dem Engineering-Alltag.',
  sources: [
    'Ausbildungsrahmenplan Elektroniker/-in für Automatisierungstechnik (IndElAusbV, Anlage 4): https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html',
    'B&R Automation Studio 6 Online-Hilfe, Programmierrichtlinien (Namenskonventionen, Dokumentation, Testen): https://help.br-automation.com/#/de/6/programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions.html',
    'PLCopen Software Construction Guidelines: https://www.plcopen.org/guidelines/software-construction-guidelines/',
    'M. Glinz: Software Engineering – Vorlesungsskript, Universität Zürich: https://files.ifi.uzh.ch/rerg/amadeus/teaching/courses/software_engineering_hs09/skript/',
    'TU Bergakademie Freiberg, Vorlesung Softwareentwicklung (Testen, Dokumentation): https://tubaf-ifi-liascript.github.io/softwareentwicklung.html',
    'Ausbilder-Eignungsverordnung (AusbEignV): https://www.gesetze-im-internet.de/ausbeignv_2009/',
    'Google Engineering Practices (Code Review): https://google.github.io/eng-practices/review/',
    'IHK Nürnberg: Themakompakt EU-Maschinenverordnung (EU) 2023/1230: https://ihk-nuernberg.de/fileadmin/IHK_Nuernberg/Innovation-Technologie-Forschung/Dokumente/IHK-ThemanKompatk_Maschinen-Verordnung_EU_2023.pdf'
  ],
  modules: [
    ...require('./praxis/level1'),
    ...require('./praxis/level2'),
    ...require('./praxis/level3'),
    ...require('./praxis/level4'),
    ...require('./praxis/level5'),
    ...require('./praxis/level6')
  ]
};
