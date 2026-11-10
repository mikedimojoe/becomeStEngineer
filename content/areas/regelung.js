// Bereich Regelungstechnik (Level 3–6)
'use strict';
module.exports = {
  id: 'regelung',
  title: 'Regelungstechnik',
  short: 'Regelung',
  description: 'Vom Regelkreis und Zweipunktregler über PI/PID-Regler, Einstellregeln und Anti-Windup bis zu Kaskade, Vorsteuerung, Split-Range, Zustandsregelung und Regelgüte – programmiert in Structured Text und mit mapp Control (MTBasics, MTTemp) in Automation Studio 6.',
  sources: [
    'TU Graz, Institut für Regelungs- und Automatisierungstechnik: Skriptum Regelungssysteme (2025) – https://tugraz.at/fileadmin/user_upload/Institute/IRT/Skripten/Regelungssysteme_WS2425.pdf',
    'Schumacher/Leonhard, TU Braunschweig: Grundlagen der Regelungstechnik (2003) – https://www.fzt.haw-hamburg.de/pers/Scholz/materialFM2/Skript_GdR.pdf',
    'Schumacher, TU Braunschweig: Erweiterte Methoden der Regelungstechnik (2019) – https://www.tu-braunschweig.de/fileadmin/Redaktionsgruppen/Institute_Fakultaet_5/IFR/Dateien_RT/Erweiterte_Methoden_der_RT/Skript_EMDR.pdf',
    'Diehl, Universität Freiburg: Systemtheorie und Regelungstechnik 1 (2014) – https://www.imtek.uni-freiburg.de/data/lehrstuehle/systemtheorie/dokumente/lehre/systemtheorie-und-regelungstechnik/systemtheorie.pdf',
    'Hochschule Zittau/Görlitz: Praktikum Regelungstechnik I – https://www.hszg.de/fileadmin/user_upload/Redakteure/PRIVAT/Labore_E/Automatisierungstechnik/46-Labor_Regelungstechnik_1/Prakt_RT1_04BO.pdf',
    'TH Köln: Modulhandbuch Regelungstechnik (Bachelor Elektrotechnik) – https://f07-studieninfo.web.th-koeln.de/mhb/versions/2023-02-24-20-00-00/html_pdf/M_RT_BaET2020.pdf',
    'B&R Automation Help 6: mapp Control Tools (MTBasics, MTFilter, MTIdentify), mapp Temperature, MTTemp – https://help.br-automation.com/#/de/6/mechatronics/mappcontrol/mappcontroltools/mappcontroltools.html',
    'SAMSON AG: Technische Informationen L101/L102 (Begriffe, Regler und Regelstrecken) – https://norway.samsongroup.com/document/l102de.pdf',
    'Verordnung über die Berufsausbildung in den industriellen Elektroberufen (IndElAusbV), Ausbildungsrahmenplan – https://www.gesetze-im-internet.de/indelausbv_2007/BJNR167800007.html',
    'BIBB-Berufsprofil Elektroniker/-in für Automatisierungstechnik – https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/655665'
  ],
  modules: [
    ...require('./regelung/level3'),
    ...require('./regelung/level4'),
    ...require('./regelung/level5'),
    ...require('./regelung/level6')
  ]
};
