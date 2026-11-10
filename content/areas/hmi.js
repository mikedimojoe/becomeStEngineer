'use strict';
// Bereich "Visualisierung" (mapp View in Automation Studio 6), Level 2–6.
module.exports = {
  id: 'hmi',
  title: 'Visualisierung',
  short: 'HMI',
  description: 'HMI-Entwicklung mit mapp View in Automation Studio 6: Pages, Layouts, Contents, Widgets, Bindings über OPC UA, Events & Actions, Alarme, Benutzer, Rezepte, Trends und Styles. Dazu die ST-Logik hinter der HMI sowie Bedienkonzept, High-Performance-HMI, HMI-Architektur, Sicherheit und Usability bis hin zu Design-Systemen für Produktfamilien.',
  sources: [
    'B&R Automation Help (AS6) – mapp View: Getting Started, Engineering, Performance-Richtlinien, Cybersicherheit: https://help.br-automation.com/#/de/6/visualization/mappview/mappview.html',
    'B&R Automation Help – Style Guide für Visualisierungen: https://help.br-automation.com/#/de/6/visualization/visuguide/styleguide/style_general.html',
    'B&R Automation Help – mapp Services (MpAlarmX, MpUserX, MpRecipe, MpData, MpAudit): https://help.br-automation.com/#/de/6/services/mapp_services/mpalarmx/lib/fb/mpalarmxset/mc_x.html',
    'B&R-Schulung SEM611 „Creating an HMI application with mapp View“ / Trainingsmodul TM611 „Working with mapp View“ (Themen: Styling, OPC UA-Binding, Medien, Benutzerrollen, Lokalisierung, Events & Actions; Inhalte nur über Themenliste genutzt, Hefte nicht frei verfügbar)',
    'mapp Framework (B&R Community): https://br-automation-community.github.io/mapp-Framework/',
    'Ausbildungsrahmenplan Elektroniker/in für Automatisierungstechnik, Anlage 4 IndElAusbV (Visualisierungssysteme in Betrieb nehmen und anpassen): https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html',
    'Hochschule Bielefeld, Modulbeschreibung FH-MMI-2030 Mensch-Maschine-Interaktion (Prof. Loviscach): https://ekvv.uni-bielefeld.de/sinfo/publ/modul/370125967/pdf',
    'BTU Cottbus-Senftenberg, Modul 33302 Mensch-Maschine-Kommunikation: https://www.b-tu.de/modul/33302',
    'ISA-101 (HMI) und ISA-18.2 (Alarm-Management), nur referenziert: https://www.isa.org/standards-and-publications/isa-standards/isa-101-standards',
    'DIN EN ISO 9241-110/-11 (Dialoggestaltung, Gebrauchstauglichkeit) und W3C WCAG 2.2 als Orientierung: https://www.w3.org/TR/WCAG22/',
    'BSI-CS 108 Fernwartung im industriellen Umfeld: https://www.allianz-fuer-cybersicherheit.de/SharedDocs/Downloads/Webs/ACS/DE/BSI-CS/BSI-CS_108.pdf',
    'Nielsen Norman Group (Heuristiken, Usability-Tests, Design-Systeme): https://www.nngroup.com/articles/usability-testing-101/'
  ],
  modules: [
    ...require('./hmi/level2'),
    ...require('./hmi/level3'),
    ...require('./hmi/level4'),
    ...require('./hmi/level5'),
    ...require('./hmi/level6')
  ]
};
