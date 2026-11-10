// Geprüfte Quellen (oEmbed bzw. HTTP 200 / B&R-Hilfe-API) für den Bereich Steuerungslogik
'use strict';
const V = {
  '9HexRg_qDwI': { id: "9HexRg_qDwI", title: "B&R Automation Studio - Erstes Projekt erstellen", channel: "DevelopSessions" },
  '0ii18sjwdiY': { id: "0ii18sjwdiY", title: "B&R Automation Studio Supplementary Info 3: Program Task Class", channel: "The Automation Kid" },
  '8Crx_mnpPjs': { id: "8Crx_mnpPjs", title: "Informationsverarbeitung in einer SPS", channel: "Christian Stöcker" },
  'Y_SKSs-e8IE': { id: "Y_SKSs-e8IE", title: "CODESYS ST, IF, THEN, ELSE, WHILE, FOR, Programm, Deklaration, Implementierung | Prof. Griesbauer", channel: "Prof Joe" },
  'EYGlEg0OXjs': { id: "EYGlEg0OXjs", title: "SPS Arbeitsweise, Prozessabbild Eingänge/Ausgänge, Zyklus, FUP, KOP, ST, SFC, CFC | Prof. Gries.", channel: "Prof Joe" },
  '5d44GUp-mZg': { id: "5d44GUp-mZg", title: "SPS 006 Zyklus Reaktionszeit SPS", channel: "Staatliche BS 1 Ansbach - Elektroabteilung" },
  'rcG7HphQxWU': { id: "rcG7HphQxWU", title: "SPS-Programmierung #02: Standardfunktionsbausteine (Flipflops, Trigger, Zähler, Zeitgeber)", channel: "Christian Stöcker" },
  'Y1Nr0-9u3o0': { id: "Y1Nr0-9u3o0", title: "Flankenauswertung, Signal-Flanken, Rising-Edge, Falling-Edge, F_TRIG, R_TRIG | Prof. Griesbauer", channel: "Prof Joe" },
  'q0lRxSSeJuQ': { id: "q0lRxSSeJuQ", title: "R_TRIG & F_TRIG: Einmalige Aktionen in der zyklischen SPS-Welt der IEC 61131-3", channel: "Meisterschulen München Landmaschinenmechanik" },
  'MLsgFp5nRKk': { id: "MLsgFp5nRKk", title: "Self-Holding, Set/Reset, and SR/RS in CODESYS ST | Explained for Beginners | Tutorial #15", channel: "Industrial Automation" },
  'FZYOuOPoluU': { id: "FZYOuOPoluU", title: "SPS-Programmierung #03: Bedingte Anweisungen (IF..THEN..ELSE und CASE..OF)", channel: "Christian Stöcker" },
  'N1Fj4fm64zw': { id: "N1Fj4fm64zw", title: "SPS-Programmierung #09: ENUM (Aufzählungsdatentyp)", channel: "Christian Stöcker" },
  'SMczIl9NySs': { id: "SMczIl9NySs", title: "Schrittketten übersichtlich programmieren mit ENUM | CODESYS ST Tutorial", channel: "SPS Schmiede" },
  'SHioximEM4M': { id: "SHioximEM4M", title: "CODESYS ST Tutorial: Schrittketten mit CASE programmieren", channel: "SPS Schmiede" },
  'Ctylnfib1nE': { id: "Ctylnfib1nE", title: "SPS-Programmierung #06: Arrays", channel: "Christian Stöcker" },
  'RP_iQLjanfg': { id: "RP_iQLjanfg", title: "SPS-Programmierung #07: Schleifen (FOR, REPEAT, WHILE)", channel: "Christian Stöcker" },
  '2jquvnAlJfE': { id: "2jquvnAlJfE", title: "Tutorial #15: Datentypen STRUCT und ENUM in CoDeSys - Beispiel in Structured Text (ST)", channel: "Der Automatisierungskanal" },
  'D8rOMnVo8Hw': { id: "D8rOMnVo8Hw", title: "Tutorial #16: ARRAY und FOR-Schleife in CoDeSys - Berechnung von Mittelwerten in Structured Text", channel: "Der Automatisierungskanal" },
  '9pCY6O4GOng': { id: "9pCY6O4GOng", title: "Automation Studio - Types", channel: "Reinhard Halusa" },
  'HPOF_2u1TR0': { id: "HPOF_2u1TR0", title: "Automation Studio - Eigene Funktionen erstellen", channel: "Reinhard Halusa" },
  'V2uiKtsWjKk': { id: "V2uiKtsWjKk", title: "How to... create and call a Function Block in B&R Automation Studio", channel: "MA-IT MyAutomation - Kennis en Kunde in IA en IT" },
  'HI5bQ64P814': { id: "HI5bQ64P814", title: "SPS-Programmierung #05: POUs Programm, Funktionsbaustein und Funktion", channel: "Christian Stöcker" },
  'wDNiReGEZGs': { id: "wDNiReGEZGs", title: "SPS-Programmierung #13: Ablaufsteuerungen", channel: "Christian Stöcker" },
  'CJQEOftD4aM': { id: "CJQEOftD4aM", title: "SPS#1 :: Schrittkette / Ablaufsteuerung / Grafcet :: Einführung :: Elektroniker :: EBT", channel: "Prüfungsvorbereitung.Elektroniker" },
  'a9CybsUtuBE': { id: "a9CybsUtuBE", title: "Automation Studio - Standardbibliotheken", channel: "Reinhard Halusa" },
  'bVcpYIc4Bc8': { id: "bVcpYIc4Bc8", title: "Version Freedom in Automation Studio 6 | B&R Industrial Automation", channel: "AutoMates" },
  'L4hSrbbu6yE': { id: "L4hSrbbu6yE", title: "How to Upgrade Your Project to Automation Studio 6  | B&R Industrial Automation", channel: "AutoMates" },
  'G8zK-QkTVoE': { id: "G8zK-QkTVoE", title: "CODESYS ST Tutorial: Function Block (FB) erstellen - Praxisbeispiel Zylinder", channel: "SPS Schmiede" },
  'q9DEAzAAZec': { id: "q9DEAzAAZec", title: "SPS-Programmierung #12: Einzelsteuerfunktionen", channel: "Christian Stöcker" },
  'WqIBhiW2LOg': { id: "WqIBhiW2LOg", title: "SPS-Programmierung #08: Pointer und Referenzen", channel: "Christian Stöcker" },
  'anwcKwwwH4A': { id: "anwcKwwwH4A", title: "Indirekte Adressierung, IEC-Zeiger, IEC-Arrays, POINTER_TO_[Typ], ADR, ^ | Prof. Griesbauer", channel: "Prof Joe" },
  'CQS-R5COOLw': { id: "CQS-R5COOLw", title: "What is PackML?", channel: "OMAC—Organization for Machine Automation & Control" },
  'L-bFWpLBPt4': { id: "L-bFWpLBPt4", title: "PLC State Machines Explained", channel: "LeMaster Tech" },
  '4aYTqiOTJT4': { id: "4aYTqiOTJT4", title: "Webinar: Understanding PackML", channel: "Yaskawa America - Drives & Motion Division" },
  'BdcfD1SXbeE': { id: "BdcfD1SXbeE", title: "Ship in Six Tutorial: Set Up CPU Timing (Automation Studio)", channel: "Loupe" },
  'Gc0ijazVlj0': { id: "Gc0ijazVlj0", title: "SPS-Programmierung #20: Interfaces (Schnittstellen)", channel: "Christian Stöcker" },
  'HJ3qYE_l5v0': { id: "HJ3qYE_l5v0", title: "SPS-Programmierung #22: Funktionsbausteine modular erweitern", channel: "Christian Stöcker" },
  'Lp3WKHD2d_U': { id: "Lp3WKHD2d_U", title: "CODESYS Objektorientierte Programmierung, FB, Interface, Property, Methode | Prof. Griesbauer", channel: "Prof Joe" },
  'Cw6sFw6JK7Q': { id: "Cw6sFw6JK7Q", title: "B&R Automation Studio Unit Test Setup Part 1", channel: "Jamal Muhammad" },
  'H_WnejbHM10': { id: "H_WnejbHM10", title: "Unit testing in TwinCAT - Introduction (Part 1/4)", channel: "Jakob Sagatowski" },
  'FnXY6MA3axw': { id: "FnXY6MA3axw", title: "PLC programming using TwinCAT 3 - Test driven development (Part 17a/18)", channel: "Jakob Sagatowski" },
  '4n6l8NFlWi8': { id: "4n6l8NFlWi8", title: "Revolutionizing Automation Engineering with VS Code and Software Development Practices", channel: "Elite Automation" },
  '8LqPtQLzB0c': { id: "8LqPtQLzB0c", title: "Modular software development - multi-user PLC programming & code generation", channel: "Siemens Software" },
  '1g6eYnlzKtA': { id: "1g6eYnlzKtA", title: "PLC programming using TwinCAT 3 - Version control (Part 13/18)", channel: "Jakob Sagatowski" },
  'I3LkUDPtN0k': { id: "I3LkUDPtN0k", title: "PLC Code in Git: Nautilus, Open-Source IEC 61131-3 in VS Code", channel: "Joy Automation" },
  'XQqSW2CU0Qw': { id: "XQqSW2CU0Qw", title: "B&R Automation Studio Basics Supplementary Info 1 - Logger", channel: "The Automation Kid" },
  'RsZ6IRjBbbc': { id: "RsZ6IRjBbbc", title: "B&R Automation Studio Basics Ex 2", channel: "The Automation Kid" },
  'cM5_eV2LgaM': { id: "cM5_eV2LgaM", title: "B&R Automation Studio Basics Ex 1", channel: "The Automation Kid" },
  '0aPM5_2Poz4': { id: "0aPM5_2Poz4", title: "B&R Automation Studio Quick Dive Intro", channel: "The Automation Kid" },
  'PTw3gPFbmfI': { id: "PTw3gPFbmfI", title: "Machine States That Matter Running Stopped Faulted Starved Using a Packaging Line Demo", channel: "Vlad Romanov" },
  'AyM09VVWR4s': { id: "AyM09VVWR4s", title: "B&R Automation Studio Agentic Bridge", channel: "B&R Industrial Automation" },
};

// Video mit Sprache und Begründung
function vid(id, lang, why) {
  const v = V[id];
  if (!v) throw new Error('Video nicht geprüft: ' + id);
  return { id: v.id, title: v.title, channel: v.channel, lang, why };
}

const ABGERUFEN = 'Abgerufen am 10. November 2026, von ';
const BR_BASE = 'https://help.br-automation.com/#/de/6/';

// B&R-Online-Hilfe (AS6, deutsch). Pfade über die Such-API der Hilfe geprüft.
function br(path, title, why, minutes) {
  const url = BR_BASE + path;
  return {
    title, author: 'B&R Industrial Automation', institution: 'B&R Industrial Automation GmbH',
    work: 'B&R Online-Hilfe, Automation Studio 6', year: 2026, type: 'Dokumentation',
    minutes: minutes || 15, url, why,
    apa: `B&R Industrial Automation. (2026). *${title}*. B&R Online-Hilfe (Automation Studio 6). ${ABGERUFEN}${url}`
  };
}

// Sonstige Quellen
function ref(o) {
  return Object.assign({}, o, { apa: o.apa + ' ' + ABGERUFEN + o.url });
}

const R = {
  // ---------- Hochschulen / Fachbuch / Amtlich ----------
  tumSlides: ref({
    title: 'Modularity and architecture of PLC-based software for automated production systems: An analysis in industrial companies (Vortragsfolien)',
    author: 'Vogel-Heuser, B.', institution: 'Technische Universität München, Lehrstuhl für Automatisierung und Informationssysteme',
    work: 'Software Engineering 2018, Universität Ulm', year: 2018, type: 'Uni-Skript', minutes: 25,
    url: 'https://www.mec.ed.tum.de/fileadmin/w00cbp/ais/Temp/Modularity_and_architecture_of_PLC-based_software.pdf',
    why: 'Zeigt, wie Maschinenbauer ihre SPS-Software in Modulebenen strukturieren und wie man Reifegrad misst.',
    apa: 'Vogel-Heuser, B. (2018). *Modularity and architecture of PLC-based software for automated production systems: An analysis in industrial companies* [Vortragsfolien]. Technische Universität München.'
  }),
  tumPaper: ref({
    title: 'Modularity and Architecture of PLC-based Software for Automated Production Systems: An analysis in industrial companies',
    author: 'Vogel-Heuser, B., Fischer, J., Feldmann, S., Ulewicz, S., Rösch, S.', institution: 'Technische Universität München',
    work: 'Journal of Systems and Software 131 (Preprint arXiv:2212.04321)', year: 2017, type: 'Artikel', minutes: 60,
    url: 'https://arxiv.org/abs/2212.04321',
    why: 'Empirische Studie aus 16 Unternehmen: welche Architekturebenen und Modularisierungsmuster sich in der Praxis bewähren.',
    apa: 'Vogel-Heuser, B., Fischer, J., Feldmann, S., Ulewicz, S. & Rösch, S. (2017). Modularity and architecture of PLC-based software for automated production systems: An analysis in industrial companies. *Journal of Systems and Software, 131*. arXiv:2212.04321.'
  }),
  plcverif: ref({
    title: 'PLCverif: Status of a Formal Verification Tool for Programmable Logic Controller',
    author: 'Lopez-Miguel, I. D., Tournier, J.-C., Fernandez Adiego, B.', institution: 'CERN',
    work: 'arXiv:2203.17253', year: 2022, type: 'Artikel', minutes: 30,
    url: 'https://arxiv.org/abs/2203.17253',
    why: 'Zeigt, wie CERN SPS-Code formal gegen Anforderungen prüft – der nächste Schritt nach Unit-Tests.',
    apa: 'Lopez-Miguel, I. D., Tournier, J.-C. & Fernandez Adiego, B. (2022). *PLCverif: Status of a formal verification tool for programmable logic controller*. arXiv:2203.17253.'
  }),
  koziolek: ref({
    title: 'Automated Control Logic Test Case Generation using Large Language Models',
    author: 'Koziolek, H., Ashiwal, V., Bandyopadhyay, S., Chandrika, K. R.', institution: 'ABB Corporate Research',
    work: 'arXiv:2405.01874', year: 2024, type: 'Artikel', minutes: 30,
    url: 'https://arxiv.org/abs/2405.01874',
    why: 'Aktueller Forschungsstand, wie Testfälle für IEC-61131-3-Code automatisch erzeugt werden – und wo die Grenzen liegen.',
    apa: 'Koziolek, H., Ashiwal, V., Bandyopadhyay, S. & Chandrika, K. R. (2024). *Automated control logic test case generation using large language models*. arXiv:2405.01874.'
  }),
  adam: ref({
    title: 'SPS-Programmierung in Anweisungsliste nach IEC 61131-3 – Leseprobe Kapitel 6: Schaltungen mit Signalspeichern',
    author: 'Adam, H.-J., Adam, M.', institution: 'Springer Vieweg',
    work: 'SPS-Programmierung in Anweisungsliste nach IEC 61131-3, 5. Auflage', year: 2015, type: 'Fachbuch', minutes: 30,
    url: 'https://beckassets.blob.core.windows.net/product/readingsample/15334475/9783662467152-c1.pdf',
    why: 'Systematische Herleitung von Selbsthaltung, Setz-/Rücksetzdominanz und Speichern – sprachunabhängig übertragbar auf ST.',
    apa: 'Adam, H.-J. & Adam, M. (2015). *SPS-Programmierung in Anweisungsliste nach IEC 61131-3* (5. Aufl., Leseprobe Kap. 6). Springer Vieweg.'
  }),
  bibb: ref({
    title: 'Elektroniker für Automatisierungstechnik/Elektronikerin für Automatisierungstechnik (Ausbildung)',
    author: 'Bundesinstitut für Berufsbildung', institution: 'BIBB',
    work: 'BIBB-Berufesuche', year: 2018, type: 'Norm/Amtlich', minutes: 15,
    url: 'https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/655665',
    why: 'Amtliches Berufsprofil: Hier steht, welche Steuerungs- und Programmierkompetenzen die Ausbildungsordnung verlangt.',
    apa: 'Bundesinstitut für Berufsbildung. (2018). *Elektroniker für Automatisierungstechnik/Elektronikerin für Automatisierungstechnik (Ausbildung)*. BIBB.'
  }),
  ihkRahmenplan: ref({
    title: 'Ausbildungsrahmenplan Elektroniker/-in für Automatisierungstechnik (2018)',
    author: 'IHK Arnsberg', institution: 'Industrie- und Handelskammer Arnsberg',
    work: 'Verordnung über die Berufsausbildung in den industriellen Elektroberufen, Ausbildungsrahmenplan', year: 2018, type: 'Norm/Amtlich', minutes: 20,
    url: 'https://www.ihk-arnsberg.de/upload/RP_Elektroniker_in_fuer_Automatisierungstechnik_2018_28781.pdf',
    why: 'Zeigt die Lernziele „Steuerungsprogramme erstellen, ändern und testen“ im Detail – die Grundlage für Level 1 bis 3.',
    apa: 'IHK Arnsberg. (2018). *Ausbildungsrahmenplan Elektroniker/-in für Automatisierungstechnik*.'
  }),
  wikiST: ref({
    title: 'Strukturierter Text', author: 'Wikipedia-Autoren', institution: 'Wikimedia Foundation',
    work: 'Wikipedia, die freie Enzyklopädie', year: 2026, type: 'Artikel', minutes: 10,
    url: 'https://de.wikipedia.org/wiki/Strukturierter_Text',
    why: 'Kompakter Überblick über Herkunft, Syntax und Einordnung von ST in die IEC 61131-3.',
    apa: 'Wikipedia-Autoren. (2026). *Strukturierter Text*. Wikipedia.'
  }),
  wikiAutomat: ref({
    title: 'Endlicher Automat', author: 'Wikipedia-Autoren', institution: 'Wikimedia Foundation',
    work: 'Wikipedia, die freie Enzyklopädie', year: 2026, type: 'Artikel', minutes: 20,
    url: 'https://de.wikipedia.org/wiki/Endlicher_Automat',
    why: 'Theoretische Grundlage: Zustände, Übergänge, Moore- und Mealy-Automat – das Modell hinter jeder CASE-Schrittkette.',
    apa: 'Wikipedia-Autoren. (2026). *Endlicher Automat*. Wikipedia.'
  }),
  // ---------- Verbände / Standards ----------
  plcopenGuidelines: ref({
    title: 'PLCopen Software Construction Guidelines', author: 'PLCopen', institution: 'PLCopen',
    work: 'PLCopen Software Construction Guidelines (Coding Guidelines, Libraries, OOP, SFC, Metrics)', year: 2023, type: 'Dokumentation', minutes: 45,
    url: 'https://plcopen.org/software-construction-guidelines',
    why: 'Herstellerübergreifende Regeln für Namensgebung, Struktur und Qualität von IEC-61131-3-Code.',
    apa: 'PLCopen. (2023). *PLCopen software construction guidelines*.'
  }),
  plcopenLibraries: ref({
    title: 'Creating PLCopen Compliant Libraries', author: 'PLCopen', institution: 'PLCopen',
    work: 'PLCopen Software Construction Guidelines', year: 2017, type: 'Dokumentation', minutes: 40,
    url: 'https://www.plcopen.org/download_file/view/7ea712b1-1f89-43fc-870c-6006e415956f/',
    why: 'Erklärt das Execute/Done/Busy/Error-Verhalten und wie man Bausteinschnittstellen konsistent gestaltet.',
    apa: 'PLCopen. (2017). *Creating PLCopen compliant libraries*.'
  }),
  plcopenSfc: ref({
    title: "PLCopen Structuring with SFC – do's and don'ts", author: 'PLCopen', institution: 'PLCopen',
    work: 'PLCopen Software Construction Guidelines', year: 2018, type: 'Dokumentation', minutes: 30,
    url: 'https://www.plcopen.org/download_file/view/97fffec2-4833-40c7-826d-ba3e1d5be170/',
    why: 'Praxisregeln für Ablaufsteuerungen (Schritte, Transitionen, Fehlerzweige), die direkt auf CASE-Schrittketten übertragbar sind.',
    apa: "PLCopen. (2018). *Structuring with SFC – do's and don'ts*."
  }),
  plcopenOop: ref({
    title: 'PLCopen Guidelines for Object Oriented Programming', author: 'PLCopen', institution: 'PLCopen',
    work: 'PLCopen Software Construction Guidelines', year: 2021, type: 'Dokumentation', minutes: 45,
    url: 'https://www.plcopen.org/download_file/view/215f0051-df6c-4b88-8725-7894c500c695/',
    why: 'Wie Kapselung, Schnittstellen und Komposition in IEC 61131-3 gedacht sind – Grundlage für Architekturentscheidungen.',
    apa: 'PLCopen. (2021). *Guidelines for object oriented programming*.'
  }),
  omacPackml: ref({
    title: 'PackML', author: 'OMAC', institution: 'Organization for Machine Automation and Control',
    work: 'OMAC PackML', year: 2026, type: 'Dokumentation', minutes: 20,
    url: 'https://www.omac.org/packml',
    why: 'Offizielle Einführung in das PackML-Zustandsmodell und die PackTags von OMAC.',
    apa: 'OMAC. (2026). *PackML*. Organization for Machine Automation and Control.'
  }),
  isa88: ref({
    title: 'ISA-88 Series of Standards – Batch Process Control', author: 'International Society of Automation', institution: 'ISA',
    work: 'ISA-88 Standards', year: 2026, type: 'Norm/Amtlich', minutes: 10,
    url: 'https://www.isa.org/standards-and-publications/isa-standards/isa-88-standards',
    why: 'Überblick über das Physical und Procedural Model (Unit, Equipment Module, Control Module), auf dem PackML aufbaut.',
    apa: 'International Society of Automation. (2026). *ISA-88 series of standards – Batch process control*. ISA.'
  }),
  tcunit: ref({
    title: 'TcUnit – An unit testing framework for Beckhoff\'s TwinCAT 3', author: 'Sagatowski, J.', institution: 'TcUnit (Open Source)',
    work: 'TcUnit Dokumentation', year: 2026, type: 'Dokumentation', minutes: 30,
    url: 'https://tcunit.org/',
    why: 'Gut dokumentiertes Open-Source-Testframework für ST – zeigt Test-Suites, Assertions und CI-Einbindung.',
    apa: "Sagatowski, J. (2026). *TcUnit – An unit testing framework for Beckhoff's TwinCAT 3*."
  }),
  codesysSt: ref({
    title: 'Programmieren in ST (Structured Text)', author: 'CODESYS GmbH', institution: 'CODESYS Group',
    work: 'CODESYS Online Help', year: 2026, type: 'Hersteller', minutes: 20,
    url: 'https://content.helpme-codesys.com/en/CODESYS%20Development%20System/_cds_programming_in_st.html',
    why: 'Vergleichsquelle: ST in CODESYS/TwinCAT – hilfreich, um Unterschiede zu AS6 zu erkennen.',
    apa: 'CODESYS GmbH. (2026). *Programming in ST*. CODESYS Online Help.'
  })
};

module.exports = { vid, br, ref, R };
