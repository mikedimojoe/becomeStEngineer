// Bereich "system" – Systemkonfiguration & Diagnose (Level 1–5)
'use strict';
module.exports = {
  id: 'system',
  title: 'Systemkonfiguration & Diagnose',
  short: 'System',
  description: 'Von der Installation von Automation Studio 6 über Hardware-Konfiguration, ARsim und Online-Verbindung bis zu Logger, SDM, Trace, Profiler und Debugger. In den höheren Stufen geht es um Konfigurationsvarianten, Software-Updates im Feld, Hypervisor, Remote-Wartung, Systemarchitektur und Diagnosekonzepte für den Service.',
  sources: [
    'Ausbildungsrahmenplan Elektroniker/-in für Automatisierungstechnik (IndElAusbV, Anlage 4) – u. a. "Test- und Diagnosesoftware einsetzen", "Versionswechsel von Software durchführen", "Systemdaten, Diagnosedaten auswerten": https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html',
    'Mechatroniker-Ausbildungsverordnung (Rahmen für Diagnose/Instandhaltung): https://www.gesetze-im-internet.de/mechatronikerausbv/',
    'B&R Automation Help (AS6) – Kapitel Diagnose (Logger, Watch, Trace, Profiler, Debugger), Automation Runtime (Betriebszustände, Taskklassen, Speicher, SDM, Hypervisor), Projektverwaltung (Upgrades, Physical/Configuration View, RUC): https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/logger/diagnosis_logger.html',
    'B&R-Trainingsmodul TM223 "Automation Studio Diagnostics" (Gliederung Logger → Profiler, über die B&R-Academy-Seite gefunden; Domain aus dem Build-Container nicht prüfbar): https://br-automation.com/ja/academy/classroom-training/training-modules/automation-studio-control-technology-programming-languages/tm223-automation-studio-diagnostics',
    'THM – Grundwissen SPS-Technik (Zyklus, Zykluszeitüberwachung, remanente Daten): https://homepages.thm.de/~mlth53/wp-content/uploads/2010/04/sps',
    'Universität Stuttgart IAS – Prozessautomatisierung, Kap. 2 (Gerätesysteme, Hierarchien, Redundanz): https://www4.informatik.uni-erlangen.de/Lehre/WS03/V_STP1/Skript/stp1-pa-ws03-kapitel2.pdf',
    'TU München – Vorlesung Echtzeitsysteme (Scheduling, Watchdogs, Virtualisierung): https://archive.air.in.tum.de/pub/Main/TeachingWs2008Echtzeitsysteme/echtzeit_komplett.pdf',
    'TU Dresden – Schedulingstrategien für Echtzeitsysteme: https://os.inf.tu-dresden.de/Studium/Bs/WS2022/V05-Echtzeitsysteme.pdf',
    'BSI – Fernwartung im industriellen Umfeld (BSI-CS 108) und ICS-Security-Kompendium: https://www.allianz-fuer-cybersicherheit.de/SharedDocs/Downloads/Webs/ACS/DE/BSI-CS/BSI-CS_108.pdf?__blob=publicationFile',
    'B&R Community – Richtlinie zu Datenverlust bei PLC-Software-Updates: https://community.br-automation.com/t/guideline-minimizing-information-loss-risks-during-plc-software-updates/9831'
  ],
  modules: [
    ...require('./system/level1'),
    ...require('./system/level2'),
    ...require('./system/level3'),
    ...require('./system/level4'),
    ...require('./system/level5')
  ]
};
