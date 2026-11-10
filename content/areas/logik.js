// Bereich Steuerungslogik – Level 1–6
'use strict';
module.exports = {
  id: 'logik',
  title: 'Steuerungslogik',
  short: 'Logik',
  description: 'Programmieren in Structured Text mit B&R Automation Studio 6: von booleschen Verknüpfungen, Flanken und Timern über Zustandsautomaten und eigene Funktionsbausteine bis zu PackML, Software-Architektur, Testbarkeit und Framework-Design. Der Kernbereich der Ausbildung mit den meisten Code-Aufgaben.',
  sources: [
    'B&R Online-Hilfe Automation Studio 6 (Structured Text, Taskklassen, Datentypen, STANDARD-Bibliothek, UnitTest, mapp PackML): https://help.br-automation.com/#/de/6/programming/programs/structuredtext/programmingmodel_programs_structuredtext.html',
    'Ausbildungsrahmenplan Elektroniker/-in für Automatisierungstechnik 2018 (IHK Arnsberg): https://www.ihk-arnsberg.de/upload/RP_Elektroniker_in_fuer_Automatisierungstechnik_2018_28781.pdf',
    'BIBB-Berufsprofil Elektroniker/-in für Automatisierungstechnik: https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/655665',
    'PLCopen Software Construction Guidelines (Coding Guidelines, Libraries, SFC, OOP): https://plcopen.org/software-construction-guidelines',
    'OMAC PackML / ISA-TR88.00.02: https://www.omac.org/packml',
    'ISA-88 Batch Control (Physical/Procedural Model): https://www.isa.org/standards-and-publications/isa-standards/isa-88-standards',
    'Vogel-Heuser et al., TU München: Modularity and Architecture of PLC-based Software (JSS 2017): https://arxiv.org/abs/2212.04321',
    'Adam & Adam: SPS-Programmierung nach IEC 61131-3 (Springer Vieweg, Leseprobe Signalspeicher): https://beckassets.blob.core.windows.net/product/readingsample/15334475/9783662467152-c1.pdf'
  ],
  modules: [
    ...require('./logik/level1'),
    ...require('./logik/level2'),
    ...require('./logik/level3'),
    ...require('./logik/level4'),
    ...require('./logik/level5'),
    ...require('./logik/level6')
  ]
};
