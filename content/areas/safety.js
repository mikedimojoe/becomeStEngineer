'use strict';
module.exports = {
  id: 'safety',
  title: 'Funktionale Sicherheit',
  short: 'Safety',
  description: 'Rechtsrahmen, Risikobeurteilung, Sicherheitsfunktionen und Normen (EN ISO 12100, EN ISO 13849, IEC 62061) bis zur B&R-Sicherheitstechnik mit SafeLOGIC, mapp Safety und SafeDESIGNER. Die Code-Übungen betreffen die Standard-SPS-Seite: Statusauswertung, Quittierung, Diagnose und kontrollierte Stopps. Alles als Orientierung, keine Rechtsberatung; sicherheitsgerichtete Programmierung nur nach Unterweisung und mit Validierung.',
  sources: [
    'B&R Automation Help 6 – mapp Safety, SafeDESIGNER, PLCopen_SF, SafeMOTION (inkl. Verweis auf Trainingsmodul TM510 „Arbeiten mit dem SafeDESIGNER“): https://help.br-automation.com/#/de/6/safety/mapp_safety/mapp_safety.html',
    'IFA Report 1/2025 – Funktionale Sicherheit von Maschinensteuerungen (DIN EN ISO 13849): https://publikationen.dguv.de/forschung/ifa/ifa-report/5091/ifa-report-1/2025-funktionale-sicherheit-von-maschinensteuerungen-anwendung-der-din-en-iso-13849',
    'IFA Report 2/2016 – Sicherheitsbezogene Anwendungssoftware, Matrixmethode (mit Hochschule Bonn-Rhein-Sieg): https://dguv.de/ifa/publikationen/reports-download/reports-2016/ifa-report-2-2016/index.jsp',
    'TH Köln, Modulhandbuch Bachelor Elektrotechnik – Modul „Funktionale Sicherheit“: https://f07-studieninfo.web.th-koeln.de/mhb/versions/2023-03-06-14-00-00/html_pdf/M_FSI_BaET2020.pdf',
    'Bergische Universität Wuppertal – Übungskonzept zur Risikobeurteilung sicherheitsbezogener Maschinensteuerungen: https://www.arbeitssicherheit.uni-wuppertal.de/fileadmin/site/arbeitssicherheit/Publikationen/Fachartikel/Neues_aus_Forschung_und_Lehre_/M._Gerhold_-_Uebungskonzept_zur_Risikobeurteilung_von_sicherheitsbezogenen_Maschinensteuerungen_-_SiIng_05-2010.pdf.pdf',
    'Universität Stuttgart IAG – Risikoanalyse und Sicherheitskonzept: https://www.iag.uni-stuttgart.de/iag-intern/dokumente/PDF-Arbeitssicherheit/04-Pilz-Uni-Stgt.-27.10.2020-Risikoanalyse-und-Sicherheitskonzept.pdf',
    'DGUV Test – Maschinenverordnung (EU) 2023/1230, Geltung ab 20.01.2027: https://www.dguv.de/dguv-test/prod-testing-certi/conform-prod/machinery/eu-maschinenverordnung/index.jsp',
    'DGUV FBHM-022 – Manipulation von Schutzeinrichtungen: https://publikationen.dguv.de/widgets/pdf/download/article/4435',
    'B&R Community – Praxisfragen zu Safety (z. B. CRC der SafeAPPLICATION lesen): https://community.br-automation.com/t/reading-crc-of-safety-program-in-as-project/9789'
  ],
  modules: [
    ...require('./safety/level3'),
    ...require('./safety/level4'),
    ...require('./safety/level5'),
    ...require('./safety/level6')
  ]
};
