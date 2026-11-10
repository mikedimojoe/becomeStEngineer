// Gemeinsame, geprüfte Quellen (Videos per oEmbed, Texte per HTTP 200) für den Bereich „Engineering-Praxis“.
'use strict';

const AB = 'Abgerufen am 10. November 2026, von ';
const BR = 'B&R Industrial Automation GmbH';
const help = (path) => 'https://help.br-automation.com/#/de/6/' + path;
const brHelp = (title, path, minutes, why) => ({
  title, author: BR, institution: BR, work: 'Automation Studio 6 – Online-Hilfe', year: 2026,
  type: 'Hersteller', minutes, url: help(path), why,
  apa: `${BR}. (2026). *${title}* [Automation Studio 6 Online-Hilfe]. ${AB}${help(path)}`
});

const GLINZ = 'https://files.ifi.uzh.ch/rerg/amadeus/teaching/courses/software_engineering_hs09/skript/';
const glinz = (kap, title, minutes, why) => ({
  title: `Software Engineering – Kapitel ${kap}: ${title}`, author: 'Martin Glinz', institution: 'Universität Zürich, Institut für Informatik',
  work: 'Vorlesungsskript Software Engineering – Eine Einführung', year: 2005, type: 'Uni-Skript', minutes,
  url: `${GLINZ}Kapitel_${String(kap).padStart(2, '0')}.pdf`, why,
  apa: `Glinz, M. (2005). *Software Engineering – Eine Einführung, Kapitel ${kap}: ${title}* [Vorlesungsskript]. Universität Zürich. ${AB}${GLINZ}Kapitel_${String(kap).padStart(2, '0')}.pdf`
});

const TUBAF = 'https://tubaf-ifi-liascript.github.io/assets/pdf/';
const tubaf = (file, title, minutes, why) => ({
  title, author: 'Sebastian Zug, Galina Rudolf, André Dietrich', institution: 'TU Bergakademie Freiberg',
  work: 'Vorlesung Softwareentwicklung (SoSe 2023)', year: 2023, type: 'Uni-Skript', minutes, url: TUBAF + file, why,
  apa: `Zug, S., Rudolf, G. & Dietrich, A. (2023). *${title}* [Vorlesungsunterlagen Softwareentwicklung]. TU Bergakademie Freiberg. ${AB}${TUBAF}${file}`
});

const R = {
  // Uni-Skripte
  glinzMessung: glinz(2, 'Zielsetzung, Messung', 30, 'Warum man Qualität nur verbessern kann, was man messen kann – Grundlage für Metriken.'),
  glinzSchaetzung: glinz(5, 'Software-Aufwandschätzung', 40, 'Expertenschätzung, Delphi-Methode und algorithmische Verfahren kompakt und hochschulgeprüft.'),
  glinzSpezifikation: glinz(7, 'Spezifikation von Anforderungen', 45, 'Wie gute Anforderungen aussehen – genau das, was du in einem Lasten- und Pflichtenheft prüfst.'),
  glinzQualitaet: glinz(9, 'Software-Qualitätsmanagement', 45, 'Prüfverfahren und Reviewtechnik: Ablauf, Rollen und Nutzen von Reviews.'),
  glinzDoku: glinz(10, 'Dokumentation', 20, 'Welche Dokumente ein Softwareprojekt braucht und für wen sie geschrieben werden.'),
  glinzKonfig: glinz(11, 'Konfigurationsverwaltung', 25, 'Kennzeichnung, Release und Änderungswesen – die Basis für sauberes Änderungsmanagement.'),
  glinzProduktivitaet: glinz(12, 'Produktivitätsfaktoren', 30, 'Mehrfachverwendung von Software und die Rolle der Menschen im Team.'),
  tubafProzess: tubaf('07ba0c3af.pdf', 'Softwareentwicklung als Prozess', 30, 'Softwareentwicklungszyklus und typische Fehlerquellen – Einordnung, warum Arbeitsweise zählt.'),
  tubafTesten: tubaf('06265a6c3.pdf', 'Testen von Software', 45, 'Testebenen (Unit, Integration, Abnahme), Testplanung und Code-Reviews als Qualitätssicherung.'),
  tubafDoku: tubaf('7332381.pdf', 'Dokumentation und Build-Tools', 30, 'Ziele von Dokumentation im Code und daneben – übertragbar auf ST-Projekte.'),

  // Amtliche Quellen / Ausbildungsordnung
  ausbRahmenplan: {
    title: 'Verordnung über die Berufsausbildung in den industriellen Elektroberufen – Anlage 4: Ausbildungsrahmenplan Elektroniker/-in für Automatisierungstechnik',
    author: 'Bundesministerium der Justiz', institution: 'Bundesamt für Justiz (gesetze-im-internet.de)', work: 'IndElAusbV', year: 2018,
    type: 'Norm/Amtlich', minutes: 25, url: 'https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html',
    why: 'Der amtliche Ausbildungsrahmenplan nennt systematische Fehlersuche, Inbetriebnahme- und Abnahmeprotokolle, Teamarbeit und Kundenbetreuung als Pflichtinhalte.',
    apa: `Bundesministerium der Justiz. (2018). *Verordnung über die Berufsausbildung in den industriellen Elektroberufen, Anlage 4*. ${AB}https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html`
  },
  ausbEignV: {
    title: 'Ausbilder-Eignungsverordnung (AusbEignV 2009)', author: 'Bundesministerium der Justiz', institution: 'Bundesamt für Justiz (gesetze-im-internet.de)',
    work: 'AusbEignV', year: 2009, type: 'Norm/Amtlich', minutes: 15, url: 'https://www.gesetze-im-internet.de/ausbeignv_2009/',
    why: 'Die vier Handlungsfelder der Ausbildereignung strukturieren, was gutes Anleiten und Prüfen ausmacht.',
    apa: `Bundesministerium der Justiz. (2009). *Ausbilder-Eignungsverordnung*. ${AB}https://www.gesetze-im-internet.de/ausbeignv_2009/`
  },
  ihkMvo: {
    title: 'IHK-Themakompakt: EU-Maschinenverordnung', author: 'IHK Nürnberg für Mittelfranken', institution: 'IHK Nürnberg für Mittelfranken',
    work: 'IHK-Themakompakt Innovation | Umwelt', year: 2023, type: 'Norm/Amtlich', minutes: 15,
    url: 'https://ihk-nuernberg.de/fileadmin/IHK_Nuernberg/Innovation-Technologie-Forschung/Dokumente/IHK-ThemanKompatk_Maschinen-Verordnung_EU_2023.pdf',
    why: 'Fünfseitige Übersicht zur Verordnung (EU) 2023/1230 inkl. der Pflicht, sicherheitsrelevante Quellcodes/Programmierlogik auf Anfrage bereitzustellen.',
    apa: `IHK Nürnberg für Mittelfranken. (2023). *IHK-Themakompakt: EU-Maschinenverordnung*. ${AB}https://ihk-nuernberg.de/fileadmin/IHK_Nuernberg/Innovation-Technologie-Forschung/Dokumente/IHK-ThemanKompatk_Maschinen-Verordnung_EU_2023.pdf`
  },
  euMachinery: {
    title: 'Machinery – Internal Market, Industry, Entrepreneurship and SMEs', author: 'Europäische Kommission', institution: 'Europäische Kommission, GD GROW',
    work: 'Sectors: Mechanical engineering', year: 2026, type: 'Norm/Amtlich', minutes: 15,
    url: 'https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/machinery_en',
    why: 'Offizielle Einstiegsseite der EU-Kommission zur Maschinenverordnung mit Leitfäden und Übergangsfristen.',
    apa: `Europäische Kommission. (2026). *Machinery*. ${AB}https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/machinery_en`
  },
  ekasMvo: {
    title: 'Maschinenverordnung (EU) 2023/1230 – Neue Pflichten für Inverkehrbringer von Maschinen', author: 'Vock', institution: 'Eidgenössische Koordinationskommission für Arbeitssicherheit (EKAS)',
    work: 'EKAS-Arbeitstagung 2024, Referat AT13', year: 2024, type: 'Norm/Amtlich', minutes: 20,
    url: 'https://www.ekas.admin.ch/fileadmin/Dokumente/Tagungen/Arbeitstagung/2024/Referate/DE/AT13_Vock_d_2024_-_Maschinenverordnung_EU_20231230_Neue_Pflichten_fuer_Inverkehrbringer_von_Maschinen.pdf',
    why: 'Behördenvortrag mit Fokus auf neue Anforderungen an Software, Schutz vor Korrumpierung und wesentliche Veränderung.',
    apa: `Vock. (2024). *Maschinenverordnung (EU) 2023/1230 – Neue Pflichten für Inverkehrbringer von Maschinen* [Vortrag]. EKAS. ${AB}https://www.ekas.admin.ch/fileadmin/Dokumente/Tagungen/Arbeitstagung/2024/Referate/DE/AT13_Vock_d_2024_-_Maschinenverordnung_EU_20231230_Neue_Pflichten_fuer_Inverkehrbringer_von_Maschinen.pdf`
  },
  dguvPruefung: {
    title: 'Prüfung der elektrischen Ausrüstung von Maschinen', author: 'Institut für Arbeitsschutz der DGUV (IFA)', institution: 'Deutsche Gesetzliche Unfallversicherung',
    work: 'IFA-Praxishilfen Maschinenschutz', year: 2020, type: 'Norm/Amtlich', minutes: 20,
    url: 'https://www.dguv.de/ifa/praxishilfen/praxishilfen-maschinenschutz/pruefung-der-elektrischen-ausruestung-von-maschinen/index.jsp',
    why: 'IFA-Prüfliste auf Basis der EN 60204-1 – zeigt, welche Prüfungen vor der Inbetriebnahme dokumentiert werden.',
    apa: `IFA – Institut für Arbeitsschutz der DGUV. (2020). *Prüfung der elektrischen Ausrüstung von Maschinen*. ${AB}https://www.dguv.de/ifa/praxishilfen/praxishilfen-maschinenschutz/pruefung-der-elektrischen-ausruestung-von-maschinen/index.jsp`
  },
  din60204: {
    title: 'DIN EN 60204-1 (VDE 0113-1): Sicherheit von Maschinen – Elektrische Ausrüstung von Maschinen – Teil 1: Allgemeine Anforderungen',
    author: 'DIN Media', institution: 'DIN Media GmbH', work: 'Normenverzeichnis', year: 2026, type: 'Norm/Amtlich', minutes: 10,
    url: 'https://www.dinmedia.de/de/norm/din-en-60204-1/400530593',
    why: 'Normdatenblatt mit Ausgabestand und Anwendungsbereich – die Norm selbst ist kostenpflichtig und wird hier nur referenziert.',
    apa: `DIN Media. (2026). *DIN EN 60204-1 (VDE 0113-1)* [Normdatenblatt]. ${AB}https://www.dinmedia.de/de/norm/din-en-60204-1/400530593`
  },
  nistMcCabe: {
    title: 'Structured Testing: A Testing Methodology Using the Cyclomatic Complexity Metric (NIST SP 500-235)',
    author: 'Arthur H. Watson, Thomas J. McCabe', institution: 'National Institute of Standards and Technology', work: 'NIST Special Publication 500-235',
    year: 1996, type: 'Norm/Amtlich', minutes: 40, url: 'https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication500-235.pdf',
    why: 'Die Originalquelle zur zyklomatischen Komplexität und wie sie die Zahl der nötigen Testfälle bestimmt.',
    apa: `Watson, A. H. & McCabe, T. J. (1996). *Structured Testing: A Testing Methodology Using the Cyclomatic Complexity Metric* (NIST SP 500-235). NIST. ${AB}https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication500-235.pdf`
  },

  // B&R Online-Hilfe
  brNaming: brHelp('Namenskonventionen', 'programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions.html', 15,
    'B&Rs eigene Programmierrichtlinie: sprechende Namen, Präfixe, Längengrenzen in AS und Automation Runtime.'),
  brNamingVars: brHelp('Namenskonventionen – Variablen', 'programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions_variables.html', 15,
    'Präfixe di/do/ai/ao/g, kleinster möglicher Gültigkeitsbereich und „Ausgänge an genau EINER Stelle schreiben“.'),
  brComments: brHelp('Kommentare', 'programming/guidelines/documentation/codingguideline_docu_comments.html', 10,
    'Was kommentiert wird (das Warum) und was nicht (das Offensichtliche) – laut B&R-Richtlinie.'),
  brIndent: brHelp('Einrückung und Kommentare', 'programming/guidelines/layout/projectorganisation_layout_engagementandcomments.html', 10,
    'Layout-Regeln: einheitliche Formatierung, Kommentare aktuell halten, Änderungen mit Datum/Version dokumentieren.'),
  brTests: brHelp('Testen', 'programming/guidelines/codingguideline_tests.html', 10,
    'B&Rs Richtlinie zu Unit-, Integrations-, System- und Bedienbarkeitstests sowie gegenseitigen Reviews.'),
  brUnitTest: brHelp('UnitTest – Übersicht', 'technologysolutions/ts_unittest/general/ts_unittest.html', 20,
    'Das Unit-Test-Framework für Automation Studio: Testfälle, Testansicht und JUnit-Export.'),
  brLogger: brHelp('Logger', 'diagnostics_support/diagnosis/logger/diagnosis_logger.html', 15,
    'Wie der Logger Ereignisse der Steuerung als Ringpuffer speichert und wie du ihn öffnest und exportierst.'),
  brHelpExplorer: brHelp('Arbeiten mit dem Help Explorer', 'diagnostics_support/helponhelp/help/helpwork.htm', 10,
    'Menüs, Favoriten und Suche im B&R Help Explorer – die Hilfe effizient nutzen.'),
  brShortcutsDebug: brHelp('Tastenkombinationen – Debugger', 'projectmanagement/shortcuts/desktop_shortcuts_debugger.html', 10,
    'F9, F10, F11 und Co.: Haltepunkte und Einzelschritt im AS-Debugger.'),
  brWatch: brHelp('Aktivierung des Variablenmonitors', 'diagnostics_support/diagnosis/watch/diagnosis_watch_activate.html', 10,
    'Watch für globale und task-lokale Variablen öffnen (Strg+W) – Grundwerkzeug bei jeder Inbetriebnahme.'),
  brCompareTarget: brHelp('Übersichtsvergleich auf dem Zielsystem', 'projectmanagement/projectcompare/projectcompare_overview_target.html', 10,
    'Projekt mit dem Stand auf der Steuerung vergleichen – Pflicht vor jeder Änderung beim Kunden.'),
  brCrossRef: brHelp('Querverweis', 'projectmanagement/output/desktop_output_crossreference.html', 10,
    'Wo wird eine Variable gelesen oder geschrieben? Der Querverweis beantwortet es nach dem Build.'),
  brEventLog: brHelp('ArEventLog', 'libraries/areventlog/areventlog.html', 15,
    'Bibliothek, um eigene Ereignisse der Applikation in Logbücher der Steuerung zu schreiben.'),
  brReuse: brHelp('Wiederverwendung', 'projectmanagement/modularapp/reuse.html', 10,
    'Export/Import von Anwendungsmodulen – B&Rs Mechanismus für Wiederverwendung über Projekte hinweg.'),
  brConventions: brHelp('Implementierungsrichtlinien', 'projectmanagement/modularapp/conventions.html', 15,
    'Paketstruktur für Anwendungsmodule und Rahmenprojekte – Grundlage für Standardisierung im Unternehmen.'),
  brFramework: brHelp('Rahmenprojekte', 'projectmanagement/modularapp/frameworkprojects.html', 15,
    'Wie ein Framework-Projekt die gemeinsame Basis für viele Maschinenvarianten bildet.'),
  brSourceControl: brHelp('Verwenden von Versionskontrollsystemen', 'projectmanagement/sourcecontrol/external/projectorganisation_sourcecontrol.html', 10,
    'Warum AS-Projekte mit externen Versionskontrollsystemen wie Git funktionieren und was zu beachten ist.'),

  // Hersteller / Fachorganisationen
  plcopenScg: {
    title: 'PLCopen Software Construction Guidelines', author: 'PLCopen', institution: 'PLCopen', work: 'PLCopen Guidelines', year: 2026,
    type: 'Hersteller', minutes: 20, url: 'https://www.plcopen.org/guidelines/software-construction-guidelines/',
    why: 'Übersicht der herstellerneutralen PLCopen Coding Guidelines (Namensregeln), OOP-Leitfaden und Software-Qualitätsmetriken.',
    apa: `PLCopen. (2026). *Software Construction Guidelines*. ${AB}https://www.plcopen.org/guidelines/software-construction-guidelines/`
  },
  beckhoffConventions: {
    title: 'Programmierkonventionen zur Erstellung der IEC 61131-3', author: 'Beckhoff Automation GmbH & Co. KG', institution: 'Beckhoff Automation',
    work: 'Beckhoff Information System – TwinCAT PLC Control', year: 2026, type: 'Hersteller', minutes: 15,
    url: 'https://infosys.beckhoff.com/content/1031/tcplccontrol/12703362827.html',
    why: 'Vergleich: wie ein anderer IEC-61131-3-Hersteller Präfixe und Bibliotheksnamen regelt.',
    apa: `Beckhoff Automation. (2026). *Programmierkonventionen zur Erstellung der IEC 61131-3*. ${AB}https://infosys.beckhoff.com/content/1031/tcplccontrol/12703362827.html`
  },
  fischertechnikIbn: {
    title: 'Inbetriebnahme (Hardware) – Lernfabrik Fertigungslinie 24V', author: 'fischertechnik GmbH', institution: 'fischertechnik GmbH',
    work: 'Technische Dokumente Industrie und Hochschulen', year: 2020, type: 'Hersteller', minutes: 20,
    url: 'https://fischertechnik.de/-/media/fischertechnik/rebrush/industrie-und-hochschulen/technische-dokumente/fertigungslinie-24v/de/03_inbetriebnahme_hardware.pdf',
    why: 'Lehrmaterial für Hochschulen mit einem durchgängigen Inbetriebnahmeprotokoll Schritt für Schritt.',
    apa: `fischertechnik GmbH. (2020). *Inbetriebnahme (Hardware) – Fertigungslinie 24V* [Lehrmaterial]. ${AB}https://fischertechnik.de/-/media/fischertechnik/rebrush/industrie-und-hochschulen/technische-dokumente/fertigungslinie-24v/de/03_inbetriebnahme_hardware.pdf`
  },

  // Artikel / freie Fachliteratur
  googleReviewer: {
    title: 'How to do a code review', author: 'Google', institution: 'Google LLC', work: 'Google Engineering Practices Documentation', year: 2026,
    type: 'Artikel', minutes: 30, url: 'https://google.github.io/eng-practices/review/reviewer/',
    why: 'Der wohl bekannteste frei verfügbare Review-Leitfaden: worauf achten, wie schnell, wie kommentieren.',
    apa: `Google. (2026). *How to do a code review*. Google Engineering Practices. ${AB}https://google.github.io/eng-practices/review/reviewer/`
  },
  googleDeveloper: {
    title: 'The CL author’s guide to getting through code review', author: 'Google', institution: 'Google LLC', work: 'Google Engineering Practices Documentation', year: 2026,
    type: 'Artikel', minutes: 20, url: 'https://google.github.io/eng-practices/review/developer/',
    why: 'Die andere Seite: kleine Änderungen, gute Beschreibungen und souveräner Umgang mit Review-Kommentaren.',
    apa: `Google. (2026). *The CL author’s guide to getting through code review*. Google Engineering Practices. ${AB}https://google.github.io/eng-practices/review/developer/`
  },
  communityCompare: {
    title: 'Guide: Project Compare', author: 'michael.bertsch', institution: 'B&R Community', work: 'community.br-automation.com', year: 2024,
    type: 'Artikel', minutes: 10, url: 'https://community.br-automation.com/t/guide-project-compare/3755',
    why: 'Praxisbeitrag: Code-Review zweier Projektstände mit der Vergleichsfunktion von Automation Studio.',
    apa: `michael.bertsch. (2024). *Guide: Project Compare*. B&R Community. ${AB}https://community.br-automation.com/t/guide-project-compare/3755`
  },
  communityLizard: {
    title: 'Static Code Analysis in CI/CD using Lizard', author: 'wLahn', institution: 'B&R Community', work: 'community.br-automation.com', year: 2025,
    type: 'Artikel', minutes: 15, url: 'https://community.br-automation.com/t/static-code-analysis-in-ci-cd-using-lizard/8578',
    why: 'Erfahrungsbericht, wie ein Team zyklomatische Komplexität von Structured Text automatisiert in der CI misst.',
    apa: `wLahn. (2025). *Static Code Analysis in CI/CD using Lizard*. B&R Community. ${AB}https://community.br-automation.com/t/static-code-analysis-in-ci-cd-using-lizard/8578`
  },
  communityUnitFw: {
    title: 'Unit Integration Framework for B&R Automation Studio (GoogleTest-style test workflow)', author: 'umraniab', institution: 'B&R Community',
    work: 'community.br-automation.com', year: 2026, type: 'Artikel', minutes: 15,
    url: 'https://community.br-automation.com/t/unit-integration-framework-for-b-r-automation-studio-googletest-style-test-workflow/10454',
    why: 'Zeigt, wie Unit- und Integrationstests für AS-Projekte in der Praxis automatisiert werden.',
    apa: `umraniab. (2026). *Unit Integration Framework for B&R Automation Studio*. B&R Community. ${AB}https://community.br-automation.com/t/unit-integration-framework-for-b-r-automation-studio-googletest-style-test-workflow/10454`
  },
  communityMarkdown: {
    title: 'Markdown-Documentation in Automation Studio', author: 'Samuel', institution: 'B&R Community', work: 'community.br-automation.com', year: 2026,
    type: 'Artikel', minutes: 10, url: 'https://community.br-automation.com/t/markdown-documentation-in-automation-studio/12679',
    why: 'Diskussion, wie Teams Projektdokumentation versioniert direkt im AS-Projekt halten.',
    apa: `Samuel. (2026). *Markdown-Documentation in Automation Studio*. B&R Community. ${AB}https://community.br-automation.com/t/markdown-documentation-in-automation-studio/12679`
  },
  nygardAdr: {
    title: 'Documenting Architecture Decisions', author: 'Michael Nygard', institution: 'Cognitect', work: 'Cognitect Blog', year: 2011,
    type: 'Artikel', minutes: 10, url: 'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions',
    why: 'Der Originalartikel, der das ADR-Format (Kontext, Entscheidung, Status, Konsequenzen) eingeführt hat.',
    apa: `Nygard, M. (2011). *Documenting Architecture Decisions*. Cognitect. ${AB}https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions`
  },
  adrGithub: {
    title: 'Architectural Decision Records (ADRs)', author: 'ADR GitHub Organization', institution: 'adr.github.io', work: 'adr.github.io', year: 2026,
    type: 'Artikel', minutes: 15, url: 'https://adr.github.io/',
    why: 'Vorlagen (MADR, Nygard) und Werkzeuge rund um ADRs.',
    apa: `ADR GitHub Organization. (2026). *Architectural Decision Records*. ${AB}https://adr.github.io/`
  },
  arc42: {
    title: 'arc42 – Overview', author: 'Gernot Starke, Peter Hruschka', institution: 'arc42', work: 'arc42 Template', year: 2026,
    type: 'Fachbuch', minutes: 20, url: 'https://arc42.org/overview',
    why: 'Frei verfügbares, weit verbreitetes Gliederungsschema für Software-Design- und Architekturdokumente.',
    apa: `Starke, G. & Hruschka, P. (2026). *arc42 Overview*. ${AB}https://arc42.org/overview`
  },
  fowlerDebt: {
    title: 'Technical Debt', author: 'Martin Fowler', institution: 'martinfowler.com', work: 'Bliki', year: 2019,
    type: 'Artikel', minutes: 10, url: 'https://martinfowler.com/bliki/TechnicalDebt.html',
    why: 'Die klassische Erklärung: Schuld, Zinsen und wann sich das Abtragen lohnt.',
    apa: `Fowler, M. (2019). *Technical Debt*. ${AB}https://martinfowler.com/bliki/TechnicalDebt.html`
  },
  fowlerQuadrant: {
    title: 'Technical Debt Quadrant', author: 'Martin Fowler', institution: 'martinfowler.com', work: 'Bliki', year: 2009,
    type: 'Artikel', minutes: 10, url: 'https://martinfowler.com/bliki/TechnicalDebtQuadrant.html',
    why: 'Bewusste vs. unbewusste, umsichtige vs. leichtsinnige Schulden – ein Raster für Diskussionen im Team.',
    apa: `Fowler, M. (2009). *Technical Debt Quadrant*. ${AB}https://martinfowler.com/bliki/TechnicalDebtQuadrant.html`
  },
  planningPoker: {
    title: 'Planning Poker', author: 'Mike Cohn', institution: 'Mountain Goat Software', work: 'Agile Planning', year: 2026,
    type: 'Artikel', minutes: 10, url: 'https://www.mountaingoatsoftware.com/agile/planning-poker',
    why: 'Die Delphi-artige Teamschätzung kompakt erklärt.',
    apa: `Cohn, M. (2026). *Planning Poker*. Mountain Goat Software. ${AB}https://www.mountaingoatsoftware.com/agile/planning-poker`
  },
  sreIncidents: {
    title: 'Managing Incidents', author: 'Andrew Stribblehill', institution: 'Google', work: 'Site Reliability Engineering (O’Reilly, frei online)', year: 2016,
    type: 'Fachbuch', minutes: 25, url: 'https://sre.google/sre-book/managing-incidents/',
    why: 'Rollen und Kommunikation in einer Störung: Incident Commander, Kommunikationsverantwortlicher, klare Statusmeldungen.',
    apa: `Stribblehill, A. (2016). Managing Incidents. In B. Beyer et al. (Hrsg.), *Site Reliability Engineering*. O’Reilly. ${AB}https://sre.google/sre-book/managing-incidents/`
  },
  srePostmortem: {
    title: 'Postmortem Culture: Learning from Failure', author: 'John Lunney, Sue Lueder', institution: 'Google', work: 'Site Reliability Engineering (O’Reilly, frei online)', year: 2016,
    type: 'Fachbuch', minutes: 20, url: 'https://sre.google/sre-book/postmortem-culture/',
    why: 'Schuldfreie Nachbetrachtung: wie man nach einer Eskalation lernt statt Schuldige sucht.',
    apa: `Lunney, J. & Lueder, S. (2016). Postmortem Culture: Learning from Failure. In B. Beyer et al. (Hrsg.), *Site Reliability Engineering*. O’Reilly. ${AB}https://sre.google/sre-book/postmortem-culture/`
  },
  staffEng: {
    title: 'StaffEng Guides', author: 'Will Larson', institution: 'staffeng.com', work: 'Staff Engineer: Leadership beyond the management track', year: 2021,
    type: 'Fachbuch', minutes: 25, url: 'https://staffeng.com/guides/',
    why: 'Frei lesbare Kapitel zu technischer Führung ohne Personalverantwortung: Richtung vorgeben, Sponsoring, Entscheidungen.',
    apa: `Larson, W. (2021). *StaffEng Guides*. ${AB}https://staffeng.com/guides/`
  },
  diataxis: {
    title: 'Diátaxis – A systematic approach to technical documentation', author: 'Daniele Procida', institution: 'diataxis.fr', work: 'Diátaxis', year: 2026,
    type: 'Artikel', minutes: 20, url: 'https://diataxis.fr/',
    why: 'Vier Dokumentationsarten (Tutorial, How-to, Referenz, Erklärung) – hilft, Lerninhalte und Wissenstransfer sauber zu trennen.',
    apa: `Procida, D. (2026). *Diátaxis*. ${AB}https://diataxis.fr/`
  },
  writeTheDocs: {
    title: 'Docs as Code', author: 'Write the Docs', institution: 'Write the Docs', work: 'Write the Docs Guide', year: 2026,
    type: 'Artikel', minutes: 10, url: 'https://www.writethedocs.org/guide/docs-as-code/',
    why: 'Dokumentation wie Code behandeln: versioniert, reviewt, im selben Repository.',
    apa: `Write the Docs. (2026). *Docs as Code*. ${AB}https://www.writethedocs.org/guide/docs-as-code/`
  },
  wikiLastenheft: {
    title: 'Lastenheft', author: 'Wikipedia-Autoren', institution: 'Wikimedia Foundation', work: 'Wikipedia, Die freie Enzyklopädie', year: 2026,
    type: 'Artikel', minutes: 10, url: 'https://de.wikipedia.org/wiki/Lastenheft',
    why: 'Kompakte Abgrenzung von Lasten- und Pflichtenheft mit Verweisen auf VDI 2519 und DIN 69901-5.',
    apa: `Wikipedia-Autoren. (2026). *Lastenheft*. Wikipedia. ${AB}https://de.wikipedia.org/wiki/Lastenheft`
  },
  wikiFat: {
    title: 'Factory acceptance test', author: 'Wikipedia-Autoren', institution: 'Wikimedia Foundation', work: 'Wikipedia, The Free Encyclopedia', year: 2026,
    type: 'Artikel', minutes: 10, url: 'https://en.wikipedia.org/wiki/Factory_acceptance_test',
    why: 'Überblick über Ablauf und Inhalt einer Werksabnahme (FAT) und Abgrenzung zur SAT.',
    apa: `Wikipedia-Autoren. (2026). *Factory acceptance test*. Wikipedia. ${AB}https://en.wikipedia.org/wiki/Factory_acceptance_test`
  }
};

const V = {
  debugTools: { id: 'bAM8wtVAyLE', title: 'B&R Automation Studio - Debug Tools Watch Trace Debugger', channel: 'DevelopSessions', lang: 'de', why: 'Watch, Trace und Debugger in Automation Studio auf Deutsch gezeigt – deine Werkzeuge für systematische Fehlersuche.' },
  logger: { id: 'XQqSW2CU0Qw', title: 'B&R Automation Studio Basics Supplementary Info 1 - Logger', channel: 'The Automation Kid', lang: 'en', why: 'Kurz und praktisch: Logger öffnen, Einträge lesen und einordnen.' },
  plcTroubleshooting: { id: 'bFvgWXkbMU0', title: 'PLC Troubleshooting 101:   Basic Tips and Tricks', channel: 'RealPars', lang: 'en', why: 'Herstellerneutraler Ablauf der Fehlersuche an einer SPS-Anlage.' },
  namingSps4you: { id: '3SdKE_MR71Q', title: '💡 Die 3 wichtigsten Namenskonventionen für SPS-Programmierer!', channel: 'sps4you', lang: 'de', why: 'Deutscher Kurzüberblick über gängige Namenskonventionen in der SPS-Welt.' },
  plcopenStructuring: { id: '-dPrSeeLEiM', title: 'PLCopen The Need for Software Structuring', channel: 'PLCopen', lang: 'en', why: 'PLCopen erklärt, warum Struktur und Regeln in SPS-Software immer wichtiger werden.' },
  plcopen7steps: { id: 'aUjWaybMVdk', title: 'PLCopen Structuring Software Developement   7 steps to success', channel: 'PLCopen', lang: 'en', why: 'Der PLCopen-Vorgehensweg von der Anforderung bis zur getesteten Software in sieben Schritten.' },
  plcopenLibs: { id: 'IXWXl357_ww', title: 'PLCopen Function Block Libraries', channel: 'PLCopen', lang: 'en', why: 'Wie herstellerneutrale Bausteinbibliotheken Wiederverwendung ermöglichen.' },
  cleanCode: { id: 'Cch7uZegyr8', title: 'Clean Code Teil 1: Warum Clean Code? + 5 Tipps für sauberen Code!', channel: 'Programmieren Starten', lang: 'de', why: 'Allgemeine Clean-Code-Regeln auf Deutsch – direkt übertragbar auf Structured Text.' },
  sophist: { id: '4nsowaRXq5I', title: 'Lastenheft und Pflichtenheft einfach erklärt: Der Unterschied und was hineingehört', channel: 'SOPHIST GmbH', lang: 'de', why: 'Requirements-Engineering-Spezialisten erklären Inhalt und Unterschied beider Dokumente.' },
  grosserLasten: { id: 'Ek4eTQbqlvc', title: 'Unterschied zwischen Lasten-  und Pflichtenheft', channel: 'Thomas Grosser', lang: 'de', why: 'Kurze Wiederholung der Abgrenzung „Was“ (Kunde) vs. „Wie“ (Auftragnehmer).' },
  ioList: { id: 'nfyKnTWDgoM', title: 'I/O List Preparation Explained | The Ultimate Guide for Instrumentation & Control', channel: 'InstruNexus', lang: 'en', why: 'Welche Spalten eine I/O-Liste braucht und wie sie mit Schaltplan und Programm zusammenhängt.' },
  eplanPruef: { id: 'qgWQGp0OZJs', title: 'Elektrische Prüfung ⚡ von Maschinen nach EN60204-1. Prüfprotokoll ausfüllen.', channel: 'EPLAN kurz erklärt', lang: 'de', why: 'Zeigt ein reales Prüfprotokoll – das Gegenstück zu deinem Software-Inbetriebnahmeprotokoll.' },
  nativeWebReview: { id: 'b35FvjoUqUs', title: 'Code-Reviews // deutsch', channel: 'the native web GmbH', lang: 'de', why: 'Deutschsprachige Einführung: Ziele, Ablauf und Fallstricke von Code-Reviews.' },
  farleyReview: { id: 'd9_fweNDjKw', title: 'Better Code Reviews in 6 SIMPLE STEPS', channel: 'Modern Software Engineering', lang: 'en', why: 'Dave Farley über Reviews, die Qualität verbessern statt nur zu bremsen.' },
  jetbrainsReview: { id: 'a9_0UUUNt-Y', title: 'Code Review Best Practices', channel: 'JetBrains', lang: 'en', why: 'Konkrete Praktiken für Reviewer und Autoren.' },
  nativeWebTests: { id: 'A7ej4cgwgRk', title: 'Tests: Unit, Integration & Co. // deutsch', channel: 'the native web GmbH', lang: 'de', why: 'Die Testebenen auf Deutsch erklärt – Grundlage für dein Testkonzept.' },
  realparsFat: { id: 'UgwHIpQkaK8', title: 'Factory Acceptance Test Explained - Part 1 | Power the Control Panel', channel: 'RealPars', lang: 'en', why: 'Wie eine FAT an einem Schaltschrank praktisch abläuft.' },
  fatVsSat: { id: 'BjR2yQKs8Xw', title: 'FAT vs SAT - Factory Acceptance Test FAT vs  Site Acceptance Test SAT', channel: 'Electrical Engineering XYZ', lang: 'en', why: 'Abgrenzung Werksabnahme vs. Abnahme beim Kunden.' },
  ringbufferLinz: { id: 'dk1grmOIohk', title: 'Effizienter Ringbuffer', channel: 'Department of Medical Engineering Linz, UASUA', lang: 'de', why: 'Hochschulvideo: Aufbau und Indexrechnung eines Ringpuffers.' },
  wesentlicheVeraenderung: { id: 'E0PxvyeFLxc', title: 'Wesentliche Veränderung von Maschinen❓ Und was ist mit der CE Kennzeichnung🤔', channel: 'EPLAN kurz erklärt', lang: 'de', why: 'Warum Software-Änderungen beim Kunden eine Frage der wesentlichen Veränderung sein können.' },
  aufwand: { id: 'yNC0dB8mqgE', title: 'Software Engineering Tutorial Deutsch #14 - Aufwandsschätzung', channel: 'Programmieren Starten', lang: 'de', why: 'Schätzverfahren im Überblick auf Deutsch.' },
  planningPoker: { id: 'APDKb7Wo3gw', title: 'Planning Poker: So einfach funktioniert die agile Schätzmethode', channel: 'Projekte leicht gemacht', lang: 'de', why: 'Teamschätzung Schritt für Schritt.' },
  arc42Innoq: { id: '2tlg0B60ef8', title: 'Sparsame Dokumentation – arc42 in Aktion – INNOQ Technology Lunch', channel: 'INNOQ', lang: 'de', why: 'Wie man ein Design-Dokument schlank, aber vollständig hält.' },
  dguvCe: { id: 'zZXH24-mzmc', title: 'Der Weg zur CE-Kennzeichnung', channel: 'DGUV', lang: 'de', why: 'Die gesetzliche Unfallversicherung erklärt den CE-Prozess – amtliche Perspektive.' },
  eaton60204: { id: 'DMS3v2OItLI', title: 'Einführung in EN 60204-1', channel: 'Eaton', lang: 'de', why: 'Überblick über Inhalte der EN 60204-1, u. a. Stopp-Kategorien und Wiederanlauf.' },
  mbtMvo: { id: 'DynFBG6iTRQ', title: 'MBT 2023: Neue Maschinenverordnung - (fast) alle Änderungen', channel: 'MBT Maschinenbautage', lang: 'de', why: 'Fachvortrag zu den Änderungen der Maschinenverordnung (EU) 2023/1230 gegenüber der Richtlinie.' },
  wolffDebt: { id: 'aYE8vfNQulw', title: 'Technische Schulden', channel: 'Eberhard Wolff', lang: 'de', why: 'Eberhard Wolff über technische Schulden und wie man mit dem Management darüber spricht.' },
  tielkeRefactoring: { id: 'jaMTZ6NzvEg', title: 'Refactoring von Martin Fowler - Ein Überblick', channel: 'David Tielke', lang: 'de', why: 'Refactoring-Grundbegriffe auf Deutsch: kleine, verhaltenserhaltende Schritte.' },
  adrCodeOpinion: { id: '6H6zfCNeqek', title: 'Architecture Decision Records (ADR) as a LOG that answers "WHY?"', channel: 'CodeOpinion', lang: 'en', why: 'Wie ADRs das „Warum“ hinter Entscheidungen festhalten.' },
  mccabeToby: { id: 'sah9hTIDlu4', title: 'Zyklomatische Komplexität - Mehr Softwarequalität mit der McCabe-Metrik', channel: 'Toby Solutions - Software Engineering Insights', lang: 'de', why: 'McCabe-Metrik auf Deutsch berechnet und eingeordnet.' },
  mappFramework: { id: '-nH08fDesrE', title: 'mapp Framework Overview', channel: 'B&R Industrial Automation', lang: 'en', why: 'B&Rs eigener Ansatz für standardisierte, wiederverwendbare Applikationsbausteine.' },
  mappConcept: { id: 'k5O5zhkPAAM', title: 'mapp concept - What is mapp Technology? [sub: EN, DE, JA, PL, PT-BR, RU]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Das Konzept hinter mapp: konfigurieren statt programmieren, einheitliche Schnittstellen.' },
  vierStufen: { id: 'WwAt-68loSg', title: 'Die vier Stufen Methode  - Ausbildung in der Praxis', channel: 'IHK zu Dortmund', lang: 'de', why: 'Die klassische Unterweisungsmethode der IHK – Basis für strukturiertes Anleiten.' },
  pragmaticMentor: { id: 'aEjoWJuvhs0', title: '3 pieces of mentorship advice for software engineers', channel: 'The Pragmatic Engineer', lang: 'en', why: 'Kurze, erfahrungsbasierte Mentoring-Tipps aus der Softwarebranche.' },
  googleMentor: { id: 'lyup0aETO7U', title: '4 mentorship concepts you should know', channel: 'Google for Developers', lang: 'en', why: 'Mentoring-Konzepte kompakt erklärt.' },
  harvard: { id: 'vMgJFrfjlhY', title: 'Harvard-Konzept im Konfliktgespräch: 4 Prinzipien für Führungskräfte', channel: '2 Meter Jason', lang: 'de', why: 'Sachbezogen verhandeln: Interessen statt Positionen – hilfreich in Eskalationen.' },
  postmortem: { id: '9JYVOUKNQ3A', title: 'How to run a Post-Mortem meeting, step-by-step', channel: 'Bran van der Meer', lang: 'en', why: 'Leitfaden für die Nachbesprechung nach einer Störung.' }
};

// Hilfsfunktionen für Test-Schritte
const pulse = (name, n = 1, high = 1, low = 1) => {
  const s = [];
  for (let i = 0; i < n; i++) s.push({ set: { [name]: true } }, { cycles: high }, { set: { [name]: false } }, { cycles: low });
  return s;
};

module.exports = { R, V, pulse, help };
