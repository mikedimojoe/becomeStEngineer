'use strict';
const { HINWEIS, ST_HINWEIS, ABGERUFEN, brHelp, brReading } = require('./_common');

// ---------------------------------------------------------------------------
// Level 4 – Engineer: EN ISO 13849-1, IEC 62061, B&R-Sicherheitstechnik, PLCopen Safety
// ---------------------------------------------------------------------------

const IFA2025_URL = 'https://publikationen.dguv.de/forschung/ifa/ifa-report/5091/ifa-report-1/2025-funktionale-sicherheit-von-maschinensteuerungen-anwendung-der-din-en-iso-13849';

const m1 = {
  id: 'safety-4-iso13849',
  level: 4,
  kind: 'lektion',
  title: 'EN ISO 13849-1 und IEC 62061',
  summary: 'Vom Risikograph zum PLr, von Kategorie, MTTFD, DC und CCF zum erreichten Performance Level – plus SIL nach IEC 62061.',
  minutes: 180,
  req: ['safety-3-projekt-schnittstelle'],
  briefing: 'Jede Sicherheitsfunktion braucht eine Zuverlässigkeitsanforderung. Nach EN ISO 13849-1 bestimmst du sie mit dem Risikograph als **erforderlichen Performance Level PLr** (a bis e) aus Schwere der Verletzung (S), Häufigkeit/Dauer der Exposition (F) und Möglichkeit zur Vermeidung (P). ' +
    'Den **erreichten PL** ermittelst du aus der Architektur (Kategorie B, 1, 2, 3, 4), der mittleren Zeit bis zum gefahrbringenden Ausfall je Kanal (MTTFD), dem Diagnosedeckungsgrad (DCavg) und Maßnahmen gegen Ausfälle gemeinsamer Ursache (CCF, mind. 65 Punkte ab Kategorie 2). PL ≥ PLr ist das Ziel. ' +
    'Die IEC 62061 beschreibt dasselbe Ziel mit dem Safety Integrity Level (SIL 1–3). Das Werkzeug der Praxis ist SISTEMA vom IFA; die Programmierübung baut eine vereinfachte Rechenhilfe, die SISTEMA nicht ersetzt.' + HINWEIS,
  practice: 'In jedem Sicherheitskonzept steht pro Sicherheitsfunktion eine Zeile „PLr d – erreicht PL d, Kat. 3“. Du musst diese Zeile lesen, hinterfragen und mit den Bauteildaten (B10D, MTTFD) nachrechnen können.',
  transfer: {
    tia: 'Siemens bietet mit dem Safety Evaluation Tool ein Online-Werkzeug für PL/SIL-Berechnungen; die Normgrundlage ist identisch. Bibliotheken liefern für F-Bausteine die PFHD-Werte.',
    codesys: 'Beckhoff und andere Hersteller liefern SISTEMA-Bibliotheken mit Kennwerten ihrer Safety-Klemmen – so wie B&R Kennwerte für SafeLOGIC und SafeIO bereitstellt.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Ermittle den PLr mit dem Risikograph',
      guide: {
        intro: 'Der Risikograph hat drei Entscheidungen mit je zwei Stufen und führt zu PLr a bis e.',
        steps: [
          'Lies im IFA Report 1/2025 das Kapitel zur Bestimmung des PLr.',
          'Entscheide **S**: S1 leichte, reversible Verletzung – S2 schwere, irreversible Verletzung oder Tod.',
          'Entscheide **F**: F1 selten bis weniger häufig und/oder kurze Expositionsdauer – F2 häufig bis dauernd und/oder lange Dauer.',
          'Entscheide **P**: P1 Vermeidung unter bestimmten Bedingungen möglich – P2 kaum möglich.',
          'Lies den PLr ab: S1F1P1 = a, S1F1P2 = b, S1F2P1 = b, S1F2P2 = c, S2F1P1 = c, S2F1P2 = d, S2F2P1 = d, S2F2P2 = e.',
          'Notiere die Möglichkeit der Norm, bei geringer Eintrittswahrscheinlichkeit des Gefährdungsereignisses um eine Stufe abzusenken – und begründe es, wenn du sie nutzt.'
        ],
        done: 'Erledigt, wenn du für die Sicherheitsfunktionen aus deiner Risikobeurteilung (Level 3) jeweils einen begründeten PLr notiert hast.',
        tip: 'S, F und P sind Bewertungen, keine Messwerte. Lass die Einstufung von einer zweiten Person gegenprüfen.',
        link: { label: 'IFA Report 1/2025 (DGUV)', url: IFA2025_URL }
      }
    },
    {
      id: 'o2',
      title: 'Bestimme den erreichten PL aus Kategorie, MTTFD, DC und CCF',
      guide: {
        intro: 'Das vereinfachte Verfahren der EN ISO 13849-1 (Säulendiagramm) verknüpft Kategorie, DCavg und MTTFD je Kanal zum PL.',
        steps: [
          'Ordne die **Kategorie** zu: B/1 einkanalig ohne Test, 2 einkanalig mit Test, 3 zweikanalig (Einzelfehler führt nicht zum Verlust), 4 zweikanalig mit hoher Fehleraufdeckung.',
          'Berechne MTTFD je Kanal; bei Verschleißteilen aus B10D: n_op = d_op · h_op · 3600 / t_Zyklus und MTTFD = B10D / (0,1 · n_op). Klassen: niedrig 3 bis < 10 Jahre, mittel 10 bis < 30, hoch 30 bis 100.',
          'Bestimme DCavg: kein < 60 %, niedrig 60 bis < 90 %, mittel 90 bis < 99 %, hoch ≥ 99 %.',
          'Prüfe CCF (Ausfälle gemeinsamer Ursache): Ab Kategorie 2 sind mindestens 65 Punkte nach Anhang F nötig.',
          'Lies den PL ab und vergleiche mit dem PLr. Lege dazu in SISTEMA ein Projekt mit einer Sicherheitsfunktion an und vergleiche das Ergebnis mit deiner Handrechnung.'
        ],
        done: 'Erledigt, wenn du für eine zweikanalige Schutztürüberwachung PL, Kategorie, MTTFD-Klasse und DC-Klasse begründet angeben kannst und SISTEMA dasselbe Ergebnis liefert.',
        tip: 'Kategorie 4 verlangt hohe MTTFD und hohen DC – „zweikanalig“ allein reicht nicht.',
        link: { label: 'IFA: Software SISTEMA', url: 'https://www.dguv.de/ifa/praxishilfen/praxishilfen-maschinenschutz/software-sistema/index.jsp' }
      }
    },
    {
      id: 'o3',
      title: 'Ordne SIL nach IEC 62061 ein',
      guide: {
        intro: 'IEC 62061 ist die sektorspezifische Umsetzung der IEC 61508 für Maschinen. Viele Hersteller geben beide Kennwerte an.',
        steps: [
          'Notiere die Zuordnung über die Ausfallrate PFHD (1/h): PL e ↔ SIL 3, PL d ↔ SIL 2, PL b/c ↔ SIL 1; PL a hat keine SIL-Entsprechung.',
          'Lies in der B&R-Hilfe die Seite „Integrierte Sicherheitsfunktionen“ und sieh dir an, wie dort für jede Funktion PL/Kategorie und SIL nebeneinander angegeben sind.',
          'Halte fest: Die Gesamt-PFHD einer Sicherheitsfunktion ist (vereinfacht) die Summe der PFHD von Sensor, Logik und Aktor.',
          'Entscheide für dein Projekt, nach welcher Norm du nachweist, und bleibe innerhalb einer Sicherheitsfunktion bei einer Methode.'
        ],
        done: 'Erledigt, wenn du zu einer gegebenen PFHD den passenden PL und SIL nennen kannst.',
        tip: 'Mischen ist möglich (Teilsysteme nach der jeweils anderen Norm), muss aber sauber dokumentiert werden.',
        link: { label: 'B&R Help: Integrierte Sicherheitsfunktionen', url: brHelp('safety/safety_hardware/safemotion/ms-safety/sicherheitstechnik/integrierte_sicherheitsfunktionen_.html') }
      }
    }
  ],
  videos: [
    { id: 'iN692JhDvPg', title: 'Grundlagen EN 13849 Sicherheit von Maschinen', channel: 'EPLAN kurz erklärt', lang: 'de', why: 'Überblick über Kategorien, MTTFD, DC und PL.' },
    { id: 'ZS2KCCAaqVY', title: 'Der Risikograph an einem Praxisbeispiel 💡 So machst du deine Risikoeinschätzung ✔', channel: 'EPLAN kurz erklärt', lang: 'de', why: 'Wendet den Risikograph an einem konkreten Beispiel an.' },
    { id: 'G-2iyDZW3aU', title: 'Was ist der Unterschied zwischen PL und SIL?', channel: 'Dirk Leitsch', lang: 'de', why: 'Grenzt EN ISO 13849-1 und IEC 62061 voneinander ab.' }
  ],
  readings: [
    {
      title: 'Übungskonzept zur Risikobeurteilung von sicherheitsbezogenen Maschinensteuerungen', author: 'Gerhold, M.', institution: 'Bergische Universität Wuppertal, Fachgebiet Arbeitssicherheit',
      work: 'Sicherheitsingenieur 05/2010 (Neues aus Forschung und Lehre)', year: 2010, type: 'Uni-Skript', minutes: 25,
      url: 'https://www.arbeitssicherheit.uni-wuppertal.de/fileadmin/site/arbeitssicherheit/Publikationen/Fachartikel/Neues_aus_Forschung_und_Lehre_/M._Gerhold_-_Uebungskonzept_zur_Risikobeurteilung_von_sicherheitsbezogenen_Maschinensteuerungen_-_SiIng_05-2010.pdf.pdf',
      why: 'Lehrkonzept einer Universität zur Anwendung des Risikographen und der PL-Ermittlung.',
      apa: 'Gerhold, M. (2010). *Übungskonzept zur Risikobeurteilung von sicherheitsbezogenen Maschinensteuerungen*. Sicherheitsingenieur, 05/2010. Bergische Universität Wuppertal. ' + ABGERUFEN + 'https://www.arbeitssicherheit.uni-wuppertal.de/fileadmin/site/arbeitssicherheit/Publikationen/Fachartikel/Neues_aus_Forschung_und_Lehre_/M._Gerhold_-_Uebungskonzept_zur_Risikobeurteilung_von_sicherheitsbezogenen_Maschinensteuerungen_-_SiIng_05-2010.pdf.pdf'
    },
    {
      title: 'Funktionale Sicherheit von Maschinensteuerungen – Anwendung der DIN EN ISO 13849 (IFA Report 1/2025)', author: 'Hauke, M., Bömer, T., Werner, C., Zimmermann, J. et al.', institution: 'Institut für Arbeitsschutz der DGUV (IFA)',
      work: 'IFA Report 1/2025', year: 2025, type: 'Norm/Amtlich', minutes: 90, url: IFA2025_URL,
      why: 'Das Standardwerk zur Anwendung der EN ISO 13849-1:2023 mit vielen Schaltungsbeispielen.',
      apa: 'Hauke, M., Bömer, T., Werner, C., Zimmermann, J. et al. (2025). *Funktionale Sicherheit von Maschinensteuerungen – Anwendung der DIN EN ISO 13849* (IFA Report 1/2025). DGUV. ' + ABGERUFEN + IFA2025_URL
    },
    {
      title: 'Software SISTEMA', author: 'Institut für Arbeitsschutz der DGUV', institution: 'Deutsche Gesetzliche Unfallversicherung (DGUV)',
      work: 'IFA Praxishilfen Maschinenschutz', year: 2026, type: 'Norm/Amtlich', minutes: 15,
      url: 'https://www.dguv.de/ifa/praxishilfen/praxishilfen-maschinenschutz/software-sistema/index.jsp',
      why: 'Download und Dokumentation des kostenlosen Werkzeugs zur PL-Berechnung.',
      apa: 'Institut für Arbeitsschutz der DGUV. (2026). *Software SISTEMA*. DGUV. ' + ABGERUFEN + 'https://www.dguv.de/ifa/praxishilfen/praxishilfen-maschinenschutz/software-sistema/index.jsp'
    }
  ],
  quiz: [
    { type: 'single', q: 'Welcher PLr ergibt sich im Risikograph für S2, F2, P1?', options: ['PLr b', 'PLr c', 'PLr d', 'PLr e'], correct: 2, explain: 'S2 → F2 → P1 führt zu PLr d; nur S2F2P2 ergibt PLr e.' },
    { type: 'numeric', q: 'Ein Schütz hat B10D = {B} Schaltspiele. Es schaltet an 220 Tagen je 16 h mit einer Zykluszeit von {t} s. Wie groß ist MTTFD = B10D / (0,1 · n_op) mit n_op = 220 · 16 · 3600 / t?',
      params: { B: [1000000, 2000000, 500000], t: [30, 120, 10] }, formula: 'B / (0.1 * (220 * 16 * 3600 / t))', unit: 'Jahre', tol: 0.02,
      explain: 'n_op = 220 · 16 · 3600 / t Schaltspiele pro Jahr. MTTFD = B10D / (0,1 · n_op). Bei B10D = 1 000 000 und t = 30 s: n_op = 422 400, MTTFD ≈ 23,7 Jahre (mittel).' },
    { type: 'single', q: 'Welche Kombination ist für PL e nach dem vereinfachten Verfahren nötig?', options: ['Kategorie 3, DC mittel, MTTFD hoch', 'Kategorie 4, DC hoch, MTTFD hoch', 'Kategorie 1, MTTFD hoch', 'Kategorie 2, DC hoch, MTTFD hoch'], correct: 1, explain: 'Im Säulendiagramm erreicht nur Kategorie 4 mit DC hoch und MTTFD hoch PL e; Kategorie 3 endet bei PL d.' }
  ],
  exam: [
    { type: 'single', q: 'Ab welcher Kategorie sind Maßnahmen gegen Ausfälle gemeinsamer Ursache (CCF ≥ 65 Punkte) gefordert?', options: ['Ab Kategorie B', 'Ab Kategorie 1', 'Ab Kategorie 2', 'Nur bei Kategorie 4'], correct: 2, explain: 'Für Kategorie 2, 3 und 4 müssen CCF-Maßnahmen mit mindestens 65 Punkten nachgewiesen werden.' },
    { type: 'single', q: 'Welche MTTFD-Klasse hat ein Kanal mit 25 Jahren?', options: ['niedrig', 'mittel', 'hoch', 'unzulässig'], correct: 1, explain: 'Niedrig 3 bis < 10, mittel 10 bis < 30, hoch 30 bis 100 Jahre.' },
    { type: 'single', q: 'Welcher SIL entspricht in etwa PL d?', options: ['SIL 1', 'SIL 2', 'SIL 3', 'SIL 4'], correct: 1, explain: 'PL d und SIL 2 liegen im selben PFHD-Bereich (10⁻⁷ bis < 10⁻⁶ 1/h).' },
    { type: 'multi', q: 'Welche Größen gehen in die Bestimmung des erreichten PL ein?', options: ['Kategorie (Architektur)', 'MTTFD je Kanal', 'DCavg', 'Zykluszeit der Standard-Task'], correct: [0, 1, 2], explain: 'Dazu kommen CCF und systematische Aspekte (z. B. Software). Die Task-Zykluszeit gehört nicht dazu.' },
    { type: 'single', q: 'Was bedeutet Kategorie 3?', options: ['Einkanalig mit bewährten Bauteilen', 'Einkanalig mit periodischem Test', 'Ein Einzelfehler führt nicht zum Verlust der Sicherheitsfunktion; einige, aber nicht alle Fehler werden erkannt', 'Fehlerhäufung wird immer erkannt'], correct: 2, explain: 'Kategorie 3 ist einfehlersicher mit teilweiser Fehlererkennung; Kategorie 4 erkennt zusätzlich Fehlerhäufungen.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Rechenhilfe: PLr und vereinfachter PL',
      task: '> **Hinweis:** Diese Übung ist eine **Rechenhilfe zum Verständnis** der EN ISO 13849-1. Sie ersetzt keine Berechnung mit SISTEMA und keinen Normtext.\n\n' +
        'Schreibe in `Main.st` vier Funktionen (in AS6 lägen die Deklarationen in einer `.fun`-Datei) und verwende sie im zyklischen Programm:\n\n' +
        '1. `FC_RequiredPL(bS2, bF2, bP2 : BOOL) : INT` – Risikograph, Ergebnis 1 = a … 5 = e. (S1F1P1 = a, S1F1P2 = b, S1F2P1 = b, S1F2P2 = c, S2F1P1 = c, S2F1P2 = d, S2F2P1 = d, S2F2P2 = e)\n' +
        '2. `FC_MttfdClass(rYears : REAL) : INT` – 0 = < 3 Jahre (unzulässig), 1 = niedrig (3 bis < 10), 2 = mittel (10 bis < 30), 3 = hoch (≥ 30).\n' +
        '3. `FC_DcClass(rPercent : REAL) : INT` – 0 = kein (< 60 %), 1 = niedrig (60 bis < 90), 2 = mittel (90 bis < 99), 3 = hoch (≥ 99).\n' +
        '4. `FC_EstimatePL(nCat, nMttfd, nDc : INT; bCcfOk : BOOL) : INT` – vereinfachtes Verfahren, 0 = nicht abgedeckt:\n' +
        '   - Kat. B (`nCat = 0`): MTTFD niedrig → a, mittel → b, hoch → 0 (nicht abgedeckt). DC wird nicht angerechnet.\n' +
        '   - Kat. 1: nur MTTFD hoch → c, sonst 0.\n' +
        '   - Kat. 2: DC niedrig → a/b/c, DC mittel → b/c/d (für MTTFD niedrig/mittel/hoch). DC kein → 0. DC hoch wird konservativ wie mittel behandelt.\n' +
        '   - Kat. 3: DC niedrig → b/c/d, DC mittel → c/d/d. DC kein → 0, DC hoch wie mittel.\n' +
        '   - Kat. 4: nur MTTFD hoch und DC hoch → e, sonst 0.\n' +
        '   - Ab Kat. 2 gilt: Ist `bCcfOk = FALSE`, ist das Ergebnis 0. MTTFD-Klasse 0 ergibt immer 0.\n\n' +
        'Im zyklischen Programm: `nPLr`, `nMttfdClass`, `nDcClass`, `nPL` berechnen und `doPlSufficient := (nPL > 0) AND (nPL >= nPLr)`.',
      hints: ['Funktionen deklarierst du mit `FUNCTION FC_Name : INT`, `VAR_INPUT … END_VAR` und weist das Ergebnis dem Funktionsnamen zu.', 'Für Kat. 2/3 hilft `nDcUse := MIN(nDc, 2);`.', 'Vergleiche bei REAL immer mit REAL-Literalen (`3.0`, `60.0`).'],
      cycleMs: 10,
      io: [
        { name: 'diS2', type: 'BOOL', dir: 'in', label: 'S2: schwere Verletzung', widget: 'switch' },
        { name: 'diF2', type: 'BOOL', dir: 'in', label: 'F2: häufige Exposition', widget: 'switch' },
        { name: 'diP2', type: 'BOOL', dir: 'in', label: 'P2: Vermeidung kaum möglich', widget: 'switch' },
        { name: 'nCat', type: 'INT', dir: 'in', label: 'Kategorie (0 = B … 4)', widget: 'slider', min: 0, max: 4 },
        { name: 'rMttfdYears', type: 'REAL', dir: 'in', label: 'MTTFD je Kanal [Jahre]', widget: 'slider', min: 0, max: 100 },
        { name: 'rDcPercent', type: 'REAL', dir: 'in', label: 'DCavg [%]', widget: 'slider', min: 0, max: 100 },
        { name: 'diCcfOk', type: 'BOOL', dir: 'in', label: 'CCF ≥ 65 Punkte', widget: 'switch', init: true },
        { name: 'nPLr', type: 'INT', dir: 'out', label: 'PLr (1 = a … 5 = e)', widget: 'value' },
        { name: 'nMttfdClass', type: 'INT', dir: 'out', label: 'MTTFD-Klasse', widget: 'value' },
        { name: 'nDcClass', type: 'INT', dir: 'out', label: 'DC-Klasse', widget: 'value' },
        { name: 'nPL', type: 'INT', dir: 'out', label: 'PL (0 = nicht abgedeckt)', widget: 'value' },
        { name: 'doPlSufficient', type: 'BOOL', dir: 'out', label: 'PL ≥ PLr', widget: 'led' }
      ],
      files: {
        main: `FUNCTION FC_RequiredPL : INT
	VAR_INPUT
		bS2 : BOOL;
		bF2 : BOOL;
		bP2 : BOOL;
	END_VAR
	FC_RequiredPL := 0; (* TODO *)
END_FUNCTION

FUNCTION FC_MttfdClass : INT
	VAR_INPUT
		rYears : REAL;
	END_VAR
	FC_MttfdClass := 0; (* TODO *)
END_FUNCTION

FUNCTION FC_DcClass : INT
	VAR_INPUT
		rPercent : REAL;
	END_VAR
	FC_DcClass := 0; (* TODO *)
END_FUNCTION

FUNCTION FC_EstimatePL : INT
	VAR_INPUT
		nCat : INT;
		nMttfd : INT;
		nDc : INT;
		bCcfOk : BOOL;
	END_VAR
	FC_EstimatePL := 0; (* TODO *)
END_FUNCTION

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	nPLr := FC_RequiredPL(diS2, diF2, diP2);
	nMttfdClass := FC_MttfdClass(rMttfdYears);
	nDcClass := FC_DcClass(rDcPercent);
	nPL := FC_EstimatePL(nCat, nMttfdClass, nDcClass, diCcfOk);
	doPlSufficient := (nPL > 0) AND (nPL >= nPLr);
END_PROGRAM
`,
        var: 'VAR\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `FUNCTION FC_RequiredPL : INT
	VAR_INPUT
		bS2 : BOOL;
		bF2 : BOOL;
		bP2 : BOOL;
	END_VAR
	VAR
		nRes : INT;
	END_VAR
	(* a = 1; jede "schwere" Stufe erhöht: S um 2, F und P um 1 *)
	nRes := 1;
	IF bS2 THEN
		nRes := nRes + 2;
	END_IF;
	IF bF2 THEN
		nRes := nRes + 1;
	END_IF;
	IF bP2 THEN
		nRes := nRes + 1;
	END_IF;
	FC_RequiredPL := nRes;
END_FUNCTION

FUNCTION FC_MttfdClass : INT
	VAR_INPUT
		rYears : REAL;
	END_VAR
	IF rYears < 3.0 THEN
		FC_MttfdClass := 0;
	ELSIF rYears < 10.0 THEN
		FC_MttfdClass := 1;
	ELSIF rYears < 30.0 THEN
		FC_MttfdClass := 2;
	ELSE
		FC_MttfdClass := 3;
	END_IF;
END_FUNCTION

FUNCTION FC_DcClass : INT
	VAR_INPUT
		rPercent : REAL;
	END_VAR
	IF rPercent < 60.0 THEN
		FC_DcClass := 0;
	ELSIF rPercent < 90.0 THEN
		FC_DcClass := 1;
	ELSIF rPercent < 99.0 THEN
		FC_DcClass := 2;
	ELSE
		FC_DcClass := 3;
	END_IF;
END_FUNCTION

FUNCTION FC_EstimatePL : INT
	VAR_INPUT
		nCat : INT;
		nMttfd : INT;
		nDc : INT;
		bCcfOk : BOOL;
	END_VAR
	VAR
		nRes : INT;
		nDcUse : INT;
	END_VAR
	nRes := 0;
	IF nMttfd >= 1 AND nMttfd <= 3 THEN
		CASE nCat OF
		0: (* Kategorie B *)
			IF nMttfd <= 2 THEN
				nRes := nMttfd;
			END_IF;
		1:
			IF nMttfd = 3 THEN
				nRes := 3;
			END_IF;
		2, 3:
			nDcUse := MIN(nDc, 2);
			IF nDcUse >= 1 THEN
				(* Kat. 2 DC niedrig = MTTFD-Klasse; jede Stufe Kat./DC +1; max. PL d *)
				nRes := MIN(nMttfd + (nCat - 2) + (nDcUse - 1), 4);
			END_IF;
		4:
			IF nMttfd = 3 AND nDc = 3 THEN
				nRes := 5;
			END_IF;
		END_CASE;
		IF nCat >= 2 AND NOT bCcfOk THEN
			nRes := 0;
		END_IF;
	END_IF;
	FC_EstimatePL := nRes;
END_FUNCTION

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	nPLr := FC_RequiredPL(diS2, diF2, diP2);
	nMttfdClass := FC_MttfdClass(rMttfdYears);
	nDcClass := FC_DcClass(rDcPercent);
	nPL := FC_EstimatePL(nCat, nMttfdClass, nDcClass, diCcfOk);
	doPlSufficient := (nPL > 0) AND (nPL >= nPLr);
END_PROGRAM
`,
        var: 'VAR\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Risikograph', steps: [
          { set: { diS2: true, diF2: true, diP2: true } }, { cycles: 1 },
          { expect: 'nPLr = 5', msg: 'S2F2P2 muss PLr e (5) ergeben.' },
          { set: { diS2: false, diF2: false, diP2: false } }, { cycles: 1 },
          { expect: 'nPLr = 1', msg: 'S1F1P1 muss PLr a (1) ergeben.' },
          { set: { diF2: true } }, { cycles: 1 },
          { expect: 'nPLr = 2', msg: 'S1F2P1 muss PLr b (2) ergeben.' },
          { set: { diS2: true, diF2: false } }, { cycles: 1 },
          { expect: 'nPLr = 3', msg: 'S2F1P1 muss PLr c (3) ergeben.' }
        ]},
        { name: 'Klassengrenzen MTTFD und DC', steps: [
          { set: { rMttfdYears: 9.9, rDcPercent: 59.9 } }, { cycles: 1 },
          { expect: 'nMttfdClass = 1 AND nDcClass = 0', msg: '9,9 Jahre = niedrig, 59,9 % = kein DC.' },
          { set: { rMttfdYears: 10.0, rDcPercent: 60.0 } }, { cycles: 1 },
          { expect: 'nMttfdClass = 2 AND nDcClass = 1', msg: '10 Jahre = mittel, 60 % = niedrig.' },
          { set: { rMttfdYears: 30.0, rDcPercent: 99.0 } }, { cycles: 1 },
          { expect: 'nMttfdClass = 3 AND nDcClass = 3', msg: '30 Jahre = hoch, 99 % = hoch.' },
          { set: { rMttfdYears: 2.5, rDcPercent: 90.0 } }, { cycles: 1 },
          { expect: 'nMttfdClass = 0 AND nDcClass = 2', msg: '2,5 Jahre ist unzulässig (0), 90 % = mittel.' }
        ]},
        { name: 'Kategorie 3 ist auf PL d begrenzt', steps: [
          { set: { nCat: 3, rMttfdYears: 25.0, rDcPercent: 95.0 } }, { cycles: 1 },
          { expect: 'nPL = 4', msg: 'Kat. 3, MTTFD mittel, DC mittel muss PL d (4) ergeben.' },
          { set: { rMttfdYears: 60.0, rDcPercent: 99.5 } }, { cycles: 1 },
          { expect: 'nPL = 4', msg: 'Kat. 3 mit hohen Werten bleibt PL d.' },
          { set: { rMttfdYears: 5.0, rDcPercent: 70.0 } }, { cycles: 1 },
          { expect: 'nPL = 2', msg: 'Kat. 3, MTTFD niedrig, DC niedrig muss PL b (2) ergeben.' }
        ]},
        { name: 'Kategorie 4 und Kategorie B', steps: [
          { set: { nCat: 4, rMttfdYears: 50.0, rDcPercent: 99.0 } }, { cycles: 1 },
          { expect: 'nPL = 5', msg: 'Kat. 4, MTTFD hoch, DC hoch muss PL e ergeben.' },
          { set: { rDcPercent: 95.0 } }, { cycles: 1 },
          { expect: 'nPL = 0', msg: 'Kat. 4 mit DC mittel ist nicht abgedeckt (0).' },
          { set: { nCat: 0, rMttfdYears: 50.0 } }, { cycles: 1 },
          { expect: 'nPL = 0', msg: 'Kat. B mit MTTFD hoch ist im vereinfachten Verfahren nicht abgedeckt.' },
          { set: { rMttfdYears: 15.0 } }, { cycles: 1 },
          { expect: 'nPL = 2', msg: 'Kat. B mit MTTFD mittel ergibt PL b.' }
        ]},
        { name: 'CCF und Vergleich mit PLr', steps: [
          { set: { nCat: 3, rMttfdYears: 25.0, rDcPercent: 95.0, diS2: true, diF2: false, diP2: true } }, { cycles: 1 },
          { expect: 'nPLr = 4 AND nPL = 4 AND doPlSufficient', msg: 'PLr d und PL d: ausreichend.' },
          { set: { diCcfOk: false } }, { cycles: 1 },
          { expect: 'nPL = 0 AND NOT doPlSufficient', msg: 'Ohne CCF-Nachweis ist Kat. 3 nicht erreicht.' },
          { set: { diCcfOk: true, nCat: 1, rMttfdYears: 40.0 } }, { cycles: 1 },
          { expect: 'nPL = 3 AND NOT doPlSufficient', msg: 'Kat. 1 (PL c) reicht für PLr d nicht.' }
        ]}
      ]
    }
  ],
  proof: false
};

// ---------------------------------------------------------------------------
const m2 = {
  id: 'safety-4-br-safety',
  level: 4,
  kind: 'lektion',
  title: 'B&R-Sicherheitstechnik: SafeLOGIC, Safe-I/O, mapp Safety, openSAFETY',
  summary: 'Aufbau einer SafeDOMAIN in AS6 mit SafeLOGIC, X20-Safe-I/O und SafeDESIGNER – und wie openSAFETY die Daten transportiert.',
  minutes: 180,
  req: ['safety-4-iso13849'],
  briefing: 'B&R integriert die Sicherheitstechnik in dasselbe Engineering wie die Standardautomatisierung. Die **SafeLOGIC** (z. B. X20SL8100) bzw. die kompakte **SafeLOGIC-X** arbeitet als Sicherheitssteuerung, die sicheren X20-I/O-Module (z. B. X20SI4100, X20SO2110) und SafeMOTION-Antriebe sind **SafeNODEs**. Zusammen bilden sie eine **SafeDOMAIN**. ' +
    'Konfiguriert wird mit **mapp Safety** in der Configuration View, programmiert im **SafeDESIGNER** in FUP, KOP oder ST mit SAFEBOOL-Datentypen und PLCopen-Safety-Bausteinen. ' +
    'Die Daten laufen über **openSAFETY**: Sie werden in einem sicheren Container übertragen, sodass POWERLINK, X2X oder ein UDP-Tunnel selbst keinen sicherheitstechnischen Beitrag leisten müssen. Die Standard-SPS kann diese Container lesen, aber nicht sicher verändern.' + HINWEIS,
  practice: 'Bei der Inbetriebnahme einer B&R-Maschine fügst du SafeNODEs ein, vergibst die SafeDOMAIN-ID, überträgst die SafeAPPLICATION und wertest im Standardprogramm aus, welche SafeNODEs betriebsbereit sind.',
  transfer: {
    tia: 'Siemens nutzt PROFIsafe über PROFINET; F-Peripherie wird im Gerätekonfigurator eingefügt, F-Adressen entsprechen grob den SafeNODE-Nummern. Die Prinzipien „Black Channel“ und sicherer Container sind gleich.',
    codesys: 'Beckhoff nutzt FSoE (Safety over EtherCAT) mit TwinSAFE-Logik; auch hier ist das Netzwerk ein Black Channel.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Projektiere SafeLOGIC und Safe-I/O in AS6',
      guide: {
        intro: 'Die Hardware der SafeDOMAIN legst du wie jede andere Hardware im System Designer an.',
        steps: [
          'Öffne in AS6 den **System Designer** deines Projekts und setze den Fokus auf die POWERLINK-Schnittstelle der Steuerung.',
          'Setze in der Toolbox die Filter „Safety“ und „Controller“ und füge die SafeLOGIC per Doppelklick ein (z. B. X20SL8100).',
          'Setze den Fokus auf die Steuerung (lokaler X2X-Bus), stelle die Filter auf „Safety“ und „I/O“ und füge X20SI4100 (sichere Eingänge) und X20SO2110 (sichere Ausgänge) ein.',
          'Trage in der Konfiguration aller Module dieselbe **SafeDOMAIN ID** ein.',
          'Prüfe in der Physical View, dass alle SafeNODEs unter der richtigen Schnittstelle hängen.'
        ],
        done: 'Erledigt, wenn dein Projekt eine SafeLOGIC und zwei Safe-I/O-Module mit identischer SafeDOMAIN ID enthält und fehlerfrei übersetzt.',
        tip: 'SafeLOGIC-X kann für kleine Applikationen eine eigene SafeLOGIC ersetzen. Prüfe im Datenblatt, wie viele SafeNODEs sie verwalten kann, bevor du dich festlegst.',
        link: { label: 'B&R Help: SafeNODEs einfügen', url: brHelp('safety/mapp_safety/getting-started/safenodes_einfugen.html') }
      }
    },
    {
      id: 'o2',
      title: 'Konfiguriere mapp Safety',
      guide: {
        intro: 'mapp Safety verbindet Standardprojekt und SafeDOMAIN und regelt Berechtigungen für sicherheitsrelevante Aktionen.',
        steps: [
          'Lege in der Configuration View unter `AccessAndSecurity › UserRoleSystem` einen Benutzer `SafetyAdmin` mit der Rolle `BR_SafetyAdmin` an.',
          'Füge über die Toolbox unter `mappSafety` die Dateien „Safety“ und „SafeDOMAIN“ ein.',
          'Öffne `config.sfdomain`: Trage dieselbe SafeDOMAIN ID wie bei der Hardware ein, vergib ein Passwort (mind. 6 Zeichen) und den Namen des SafeDESIGNER-Projekts (ohne Leerzeichen und Sonderzeichen).',
          'Öffne `Settings.sfcfg` und prüfe die Berechtigungen; deaktiviere die vorgefertigte HMI-Visualisierung, wenn du sie nicht nutzt.',
          'Übersetze das Projekt (Build) und behebe alle Meldungen im Output-Fenster.'
        ],
        done: 'Erledigt, wenn das Projekt mit mapp-Safety-Konfiguration fehlerfrei übersetzt und der SafeDESIGNER-Projektname gesetzt ist.',
        tip: 'Nutzt das Projekt MpUserX mit Passwortwechsel bei der ersten Anmeldung, funktioniert der Login der mapp-Safety-Visualisierung erst nach diesem Wechsel.',
        link: { label: 'B&R Help: mapp Safety konfigurieren', url: brHelp('safety/mapp_safety/getting-started/mapp_safety_konfigurieren.html') }
      }
    },
    {
      id: 'o3',
      title: 'Erstelle eine erste SafeAPPLICATION im SafeDESIGNER',
      guide: {
        intro: 'Der SafeDESIGNER wird aus AS6 heraus geöffnet und hat eine eigene Passwortverwaltung.',
        steps: [
          'Öffne den SafeDESIGNER in der Physical View per Rechtsklick auf die SafeLOGIC › **SafeDESIGNER**.',
          'Vergib beim ersten Öffnen die Passwörter für die Ebenen „Entwicklung“ und „Inbetriebnahme“ und dokumentiere, wer sie verwaltet.',
          'Ziehe aus dem **Edit Wizard** einen `AND_S`-Baustein in das Arbeitsblatt und aus der **Safety View** die Datenpunkte `SafeModuleOk` zweier SafeNODEs auf die Eingänge.',
          'Hänge an den Ausgang eine lokale Variable `s_myVar` (Doppelklick auf den Ausgang, Scope „Local“).',
          'Kompiliere das Projekt fehlerfrei und teste es zuerst in der Simulation (EasySim), bevor du es an die SafeLOGIC sendest.'
        ],
        done: 'Erledigt, wenn dein SafeDESIGNER-Projekt fehlerfrei kompiliert und du in der Simulation den Ausgang `s_myVar` beobachten kannst.',
        tip: 'Die Simulation ersetzt niemals den Funktionstest mit realer SafeLOGIC und realen Sensoren/Aktoren – sie ist ein Vortest.',
        link: { label: 'B&R Help: Einfache Logik erstellen und kompilieren', url: brHelp('safety/mapp_safety/getting-started/logik_erstellen_und_kompilieren.html') }
      }
    },
    {
      id: 'o4',
      title: 'Verstehe openSAFETY als Black Channel',
      guide: {
        intro: 'openSAFETY ist busunabhängig: Sicherheit entsteht durch die Telegrammstruktur, nicht durch das Netzwerk.',
        steps: [
          'Lies die B&R-Hilfeseite „Kommunikation“ zu openSAFETY-Containern.',
          'Notiere die Schutzmechanismen eines Sicherheitsprotokolls: Prüfsumme (CRC), laufende Nummer/Zeitstempel, Watchdog (Timeout), Kennung von Sender und Empfänger.',
          'Halte fest: Lesender Zugriff der Standard-Applikation auf openSAFETY-Daten ist an jeder Stelle erlaubt, schreibend wirkt nur die sichere Gegenstelle.',
          'Lies die Seite „openSAFETY over UDP“: Damit lassen sich SafeNODEs über IP-Netze verbinden, z. B. zwischen zwei Maschinen.'
        ],
        done: 'Erledigt, wenn du erklären kannst, warum ein defekter POWERLINK-Switch nicht zum Verlust der Sicherheitsfunktion, sondern zum sicheren Zustand führt.',
        tip: 'Kommunikationsausfall führt zum sicheren Zustand – das ist sicher, aber nicht verfügbar. Plane deshalb Diagnose, damit die Ursache schnell gefunden wird.',
        link: { label: 'B&R Help: Kommunikation (openSAFETY)', url: brHelp('safety/safety_general/kommunikation-sp.html') }
      }
    }
  ],
  videos: [
    { id: 'XpicjwJDsRI', title: 'SafeLOGIC X', channel: 'B&R Industrial Automation', lang: 'en', why: 'Vorstellung der kompakten Sicherheitssteuerung durch B&R.' },
    { id: 'kJU-327Xs3Q', title: 'Welcome to a new era in machine safety: Meet Safety+ by B&R', channel: 'B&R Industrial Automation', lang: 'en', why: 'Zeigt die neueste Generation der B&R-Sicherheitstechnik (Safety+) als Ausblick.' },
    { id: 'LqaGbFOs_XM', title: 'Wireless openSAFETY - Industrie Datenfunk Lösungen - B&R Systeme', channel: 'DATAEAGLE TV', lang: 'de', why: 'Praxisbeispiel: openSAFETY über Funk – der Kanal trägt nicht zur Sicherheit bei.' }
  ],
  readings: [
    brReading('mapp Safety – Getting Started', 'safety/mapp_safety/getting-started/getting-started.html', 'Offizieller Einstieg: Hardware projektieren, mapp Safety konfigurieren, SafeAPPLICATION erstellen, Inbetriebnahme.', 40),
    brReading('Kommunikation (openSAFETY)', 'safety/safety_general/kommunikation-sp.html', 'Erklärt den openSAFETY-Container und warum das Netzwerk keinen sicherheitstechnischen Beitrag leistet.', 10),
    brReading('openSAFETY over UDP', 'safety/mapp_safety/concept/opensafety-over-udp/opensafety-over-udp.html', 'Zeigt, wie SafeNODEs über IP-Netze getunnelt werden.', 15)
  ],
  quiz: [
    { type: 'single', q: 'Wo wird bei B&R mit mapp Safety die Sicherheitslogik programmiert?', options: ['In einem ST-Programm der Logical View', 'Im SafeDESIGNER', 'In mapp View', 'Im System Designer'], correct: 1, explain: 'Der SafeDESIGNER (Aufruf per Rechtsklick in der Physical View) ist das Werkzeug für die SafeAPPLICATION.' },
    { type: 'single', q: 'Was müssen alle Module einer SafeDOMAIN gemeinsam haben?', options: ['Dieselbe IP-Adresse', 'Dieselbe SafeDOMAIN ID', 'Dieselbe Firmware wie die Standard-CPU', 'Denselben X2X-Steckplatz'], correct: 1, explain: 'Alle Hardware-Module einer SafeDOMAIN müssen dieselbe SafeDOMAIN ID in ihrer Konfiguration haben – auch die config.sfdomain.' },
    { type: 'multi', q: 'Welche Aussagen zu openSAFETY sind richtig?', options: ['Die Daten liegen in einem sicheren Container', 'POWERLINK muss dafür sicherheitszertifiziert sein', 'Lesender Zugriff durch die Standard-Applikation ist erlaubt', 'openSAFETY kann auch über UDP getunnelt werden'], correct: [0, 2, 3], explain: 'Das Netzwerk ist ein „Black Channel“; die Sicherheit liegt im Protokoll, nicht im Bus.' }
  ],
  exam: [
    { type: 'single', q: 'Welche Passwort-Ebenen vergibst du beim ersten Öffnen des SafeDESIGNER-Projekts?', options: ['Administrator und Gast', 'Entwicklung und Inbetriebnahme', 'Lesen und Schreiben', 'Keine'], correct: 1, explain: 'Das Projektkennwort kennt die Ebenen Entwicklung, Inbetriebnahme und Wartung; die ersten beiden werden beim ersten Öffnen vergeben.' },
    { type: 'single', q: 'Was passiert sicherheitstechnisch, wenn die openSAFETY-Kommunikation zu einem sicheren Ausgangsmodul abbricht?', options: ['Der Ausgang behält seinen letzten Wert', 'Der SafeNODE geht nach Ablauf der Überwachungszeit in den sicheren Zustand', 'Die Standard-SPS übernimmt', 'Nichts, POWERLINK puffert'], correct: 1, explain: 'Watchdog/Timeout im Sicherheitsprotokoll führen zum sicheren Zustand.' },
    { type: 'single', q: 'Welche Rolle muss der Benutzer für sicherheitsrelevante Aktionen mit mapp Safety 6.x haben?', options: ['BR_Engineer', 'BR_SafetyAdmin', 'Administrator', 'Anonymous'], correct: 1, explain: 'Laut Getting Started wird ein Benutzer „SafetyAdmin“ mit der vordefinierten Rolle BR_SafetyAdmin angelegt.' },
    { type: 'multi', q: 'Welche Programmiersprachen bietet der SafeDESIGNER?', options: ['FUP (FBS)', 'KOP', 'ST', 'C++'], correct: [0, 1, 2], explain: 'Grafisch FBS und KOP sowie textuell ST – C/C++ gibt es für die sichere Applikation nicht.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'SafeNODE-Diagnose mit Hochlaufunterdrückung',
      task: ST_HINWEIS +
        'Die Standard-CPU liest den Status der SafeLOGIC (`diSafeLogicRun`) und `SafeModuleOK` dreier SafeNODEs (`diModOk1` Not-Halt-Eingänge, `diModOk2` Türeingänge, `diModOk3` Ausgangsmodul). Schreibe die Diagnose:\n\n' +
        '- Kopiere die drei Modul-Signale jeden Zyklus in ein lokales `aModOk : ARRAY[1..3] OF BOOL` und werte es in einer `FOR`-Schleife aus.\n' +
        '- `nMissing` = Anzahl Module ohne OK. `doHwOk` = SafeLOGIC läuft und alle Module OK.\n' +
        '- **Hochlauf:** SafeNODEs brauchen nach dem Einschalten einige Sekunden. Solange der Hochlauf nicht abgeschlossen ist, zeigt `nDiag = 10`. Der Hochlauf ist abgeschlossen, wenn einmal alles OK war **oder** 5 s seit Programmstart vergangen sind.\n' +
        '- Nach dem Hochlauf: `nDiag = 20` wenn die SafeLOGIC nicht läuft, sonst `20 + n` für das **erste** fehlende Modul n (21, 22, 23), sonst `0`.\n' +
        '- **Historie:** `nLastFault` speichert den zuletzt aufgetretenen Code ≥ 20 und bleibt nach Behebung stehen, bis eine steigende Flanke an `diAckDiag` kommt und alles OK ist.',
      hints: ['`tonStartup(IN := TRUE, PT := T#5s);` läuft einmal ab und bleibt dann TRUE.', 'Ein gelatchtes `bStartupDone := bStartupDone OR tonStartup.Q OR doHwOk;` beendet den Hochlauf.', 'Mit `EXIT` verlässt du die FOR-Schleife beim ersten Treffer – zähle `nMissing` dann in einer eigenen Schleife.'],
      cycleMs: 10,
      io: [
        { name: 'diSafeLogicRun', type: 'BOOL', dir: 'in', label: 'SafeLOGIC im Zustand RUN', widget: 'switch' },
        { name: 'diModOk1', type: 'BOOL', dir: 'in', label: 'SafeModuleOK SafeNODE 1 (X20SI4100 Not-Halt)', widget: 'switch' },
        { name: 'diModOk2', type: 'BOOL', dir: 'in', label: 'SafeModuleOK SafeNODE 2 (X20SI4100 Türen)', widget: 'switch' },
        { name: 'diModOk3', type: 'BOOL', dir: 'in', label: 'SafeModuleOK SafeNODE 3 (X20SO2110)', widget: 'switch' },
        { name: 'diAckDiag', type: 'BOOL', dir: 'in', label: 'Diagnose quittieren', widget: 'button' },
        { name: 'doHwOk', type: 'BOOL', dir: 'out', label: 'Safety-Hardware betriebsbereit', widget: 'led' },
        { name: 'nMissing', type: 'INT', dir: 'out', label: 'Anzahl Module nicht OK', widget: 'value' },
        { name: 'nDiag', type: 'INT', dir: 'out', label: 'Diagnosecode', widget: 'value' },
        { name: 'nLastFault', type: 'INT', dir: 'out', label: 'Letzter Fehlercode', widget: 'value' }
      ],
      files: {
        main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Array füllen, Hochlauf, Diagnose, Historie *)\n\tdoHwOk := diSafeLogicRun AND diModOk1 AND diModOk2 AND diModOk3;\n\tIF doHwOk THEN\n\t\tnDiag := 0;\n\tELSE\n\t\tnDiag := 20;\n\tEND_IF;\nEND_PROGRAM\n',
        var: 'VAR\n\taModOk : ARRAY[1..3] OF BOOL;\n\ti : INT;\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	aModOk[1] := diModOk1;
	aModOk[2] := diModOk2;
	aModOk[3] := diModOk3;

	nMissing := 0;
	FOR i := 1 TO 3 DO
		IF NOT aModOk[i] THEN
			nMissing := nMissing + 1;
		END_IF;
	END_FOR;
	doHwOk := diSafeLogicRun AND (nMissing = 0);

	tonStartup(IN := TRUE, PT := T#5s);
	bStartupDone := bStartupDone OR tonStartup.Q OR doHwOk;

	IF NOT bStartupDone THEN
		nDiag := 10;
	ELSIF NOT diSafeLogicRun THEN
		nDiag := 20;
	ELSE
		nDiag := 0;
		FOR i := 1 TO 3 DO
			IF NOT aModOk[i] THEN
				nDiag := 20 + i;
				EXIT;
			END_IF;
		END_FOR;
	END_IF;

	(* Historie *)
	IF nDiag >= 20 THEN
		nLastFault := nDiag;
	END_IF;
	rtAckDiag(CLK := diAckDiag);
	IF rtAckDiag.Q AND nDiag = 0 THEN
		nLastFault := 0;
	END_IF;
END_PROGRAM
`,
        var: 'VAR\n\taModOk : ARRAY[1..3] OF BOOL;\n\ti : INT;\n\ttonStartup : TON;\n\tbStartupDone : BOOL;\n\trtAckDiag : R_TRIG;\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Hochlauf unterdrückt Fehlermeldungen', steps: [
          { ms: 1000 },
          { expect: 'nDiag = 10 AND NOT doHwOk', msg: 'Während der ersten 5 s ohne OK muss Code 10 (Hochlauf) stehen.' },
          { ms: 4500 },
          { expect: 'nDiag = 20 AND nMissing = 3', msg: 'Nach 5 s ohne laufende SafeLOGIC muss Code 20 stehen.' }
        ]},
        { name: 'Alles in Ordnung', steps: [
          { set: { diSafeLogicRun: true, diModOk1: true, diModOk2: true, diModOk3: true } }, { cycles: 2 },
          { expect: 'doHwOk AND nDiag = 0 AND nMissing = 0', msg: 'Alle Module OK: doHwOk und Code 0.' }
        ]},
        { name: 'Erstes fehlendes Modul wird gemeldet', steps: [
          { set: { diSafeLogicRun: true, diModOk1: true, diModOk2: true, diModOk3: true } }, { ms: 100 },
          { set: { diModOk2: false } }, { cycles: 2 },
          { expect: 'nDiag = 22 AND nMissing = 1 AND NOT doHwOk', msg: 'Modul 2 fehlt: Code 22.' },
          { set: { diModOk3: false } }, { cycles: 2 },
          { expect: 'nDiag = 22 AND nMissing = 2', msg: 'Das erste fehlende Modul (2) bestimmt den Code.' }
        ]},
        { name: 'Historie bleibt bis zur Quittierung', steps: [
          { set: { diSafeLogicRun: true, diModOk1: true, diModOk2: true, diModOk3: true } }, { ms: 100 },
          { set: { diModOk3: false } }, { cycles: 2 },
          { set: { diModOk3: true } }, { cycles: 2 },
          { expect: 'nDiag = 0 AND nLastFault = 23', msg: 'Nach Behebung muss nLastFault = 23 stehen bleiben.' },
          { set: { diAckDiag: true } }, { cycles: 2 }, { set: { diAckDiag: false } },
          { expect: 'nLastFault = 0', msg: 'Quittieren bei OK löscht die Historie.' }
        ]},
        { name: 'SafeLOGIC nicht in RUN hat Vorrang', steps: [
          { set: { diSafeLogicRun: true, diModOk1: true, diModOk2: true, diModOk3: true } }, { ms: 200 },
          { set: { diSafeLogicRun: false, diModOk1: false } }, { cycles: 2 },
          { expect: 'nDiag = 20', msg: 'Läuft die SafeLOGIC nicht, ist Code 20 die Ursache, auch wenn Module fehlen.' },
          { set: { diAckDiag: true } }, { cycles: 2 },
          { expect: 'nLastFault = 20', msg: 'Quittieren bei anstehender Störung darf die Historie nicht löschen.' }
        ]}
      ]
    }
  ],
  proof: false
};

// ---------------------------------------------------------------------------
const m3 = {
  id: 'safety-4-projekt-plcopen',
  level: 4,
  kind: 'projekt',
  title: 'Praxisprojekt: PLCopen-Safety-Bausteine verstehen',
  summary: 'SF_EmergencyStop, SF_GuardMonitoring, SF_ESPE und SF_TwoHandControl im SafeDESIGNER – und ein Lernmodell des Not-Halt-Bausteins in Standard-ST.',
  minutes: 300,
  req: ['safety-4-br-safety'],
  briefing: 'PLCopen hat für die Sicherheitstechnik standardisierte Funktionsbausteine definiert, die alle großen Hersteller anbieten – bei B&R in der SafeDESIGNER-Bibliothek **PLCopen_SF**. Alle Bausteine haben dasselbe Muster: `Activate`, sichere Eingänge (`S_…`), Anlaufsperren (`S_StartReset`, `S_AutoReset`), `Reset`, ein sicherer Freigabeausgang und `Ready`, `Error`, `DiagCode`. ' +
    'Wer den DiagCode lesen kann, findet Störungen in Minuten statt Stunden. In diesem Projekt baust du deshalb das Verhalten von **SF_EmergencyStop** in Standard-ST nach – ausdrücklich als **Lernmodell**, nicht als Sicherheitsfunktion – und schreibst einen Dekoder, der die DiagCodes im HMI verständlich anzeigt.' + HINWEIS,
  practice: 'An der Maschine siehst du im Watch-Fenster des SafeDESIGNER oder im HMI nur einen DiagCode wie 16#8005. Die Standard-SPS übersetzt ihn in „Not-Halt entriegelt – bitte quittieren“.',
  transfer: {
    tia: 'Die Siemens-Bausteine ESTOP1, SFDOOR usw. folgen nicht exakt PLCopen, haben aber vergleichbare Diagnoseausgänge (DIAG). Das Lernmodell hilft dir, beide Welten zu vergleichen.',
    codesys: 'CODESYS Safety bietet die PLCopen-Bausteine mit denselben DiagCodes – deine Dekoder-Funktion ist fast 1:1 übertragbar.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Lies die Schnittstelle eines PLCopen-Safety-Bausteins',
      guide: {
        intro: 'Alle PLCopen-Safety-Bausteine folgen derselben Schnittstellenlogik.',
        steps: [
          'Öffne in der B&R-Hilfe die Seite **SF_EmergencyStop** und notiere Eingänge, Ausgänge, Datentypen (BOOL/SAFEBOOL) und Startwerte.',
          'Lies den Abschnitt **Statusnummern**: 0000 nicht aktiviert, 8001 Initialisierung, 8002/8003 Anlaufsperre nach Aktivierung, 8000 Freigabe, 8004/8005 Not-Halt betätigt bzw. entriegelt mit Wiederanlaufsperre, C001/C002 statisches Reset-Signal.',
          'Vergleiche mit **SF_GuardMonitoring**: Zusätzlich gibt es zwei Kanäle (`S_GuardSwitch1/2`) und eine `DiscrepancyTime`.',
          'Sieh dir **SF_ESPE** (Lichtgitter) und **SF_TwoHandControlTypeIII** an und notiere, welche Eingänge dort neu sind.',
          'Trage in einer Tabelle zusammen, welche DiagCodes bei allen Bausteinen dieselbe Bedeutung haben (0000, 8000, 8001).'
        ],
        done: 'Erledigt, wenn deine Tabelle für vier Bausteine Eingänge, Ausgänge und mindestens fünf DiagCodes enthält.',
        tip: 'DiagCodes ab 16#C000 sind Fehler (Error = TRUE), ab 16#8000 Statusmeldungen. Diese Struktur gilt bausteinübergreifend.',
        link: { label: 'B&R Help: SF_EmergencyStop – Statusnummern', url: brHelp('safety/mapp_safety/programming/safedesigner_lib/plcopen_sf/fbks/sf_emergencystop/statusnummern.html') }
      }
    },
    {
      id: 'o2',
      title: 'Verschalte SF_EmergencyStop im SafeDESIGNER',
      guide: {
        intro: 'Nur nach Unterweisung und in einer Testumgebung: Du baust eine Not-Halt-Funktion in der Simulation auf.',
        steps: [
          'Öffne den SafeDESIGNER und lege ein Arbeitsblatt an. Füge aus dem Edit Wizard (Bibliothek PLCopen_SF) `SF_EmergencyStop` ein.',
          'Verbinde `S_EStopIn` mit dem Kanal des sicheren Eingangsmoduls, `S_StartReset` und `S_AutoReset` mit der Konstante SAFEFALSE (Anlaufsperren aktiv).',
          'Verbinde `Reset` mit einer Variable, die von der Standard-Applikation beschrieben wird, und `S_EStopOut` mit dem sicheren Ausgang.',
          'Beachte die Best Practice: Funktionsbausteine nicht innerhalb von IF oder Schleifen aufrufen.',
          'Teste in EasySim alle Zustände und notiere die DiagCodes, die du beobachtest.'
        ],
        done: 'Erledigt, wenn du in der Simulation die Codes 8001 → 8003 → 8000 → 8004 → 8005 → 8000 nacheinander erzeugt hast.',
        tip: 'Ein Reset aus der Standard-SPS ist zulässig, weil der Baustein Flanken prüft. Ob BOOL oder SAFEBOOL am Reset nötig ist, hängt von deiner Risikobeurteilung ab.',
        link: { label: 'B&R Help: Best practice (SafeDESIGNER)', url: brHelp('safety/mapp_safety/programming/best_practice.html') }
      }
    },
    {
      id: 'o3',
      title: 'Baue das Lernmodell und den Dekoder in Standard-ST',
      guide: {
        intro: 'Ein eigenes Modell zwingt dich, jede Zustandsänderung genau zu verstehen. Es ist ausdrücklich keine Sicherheitsfunktion.',
        steps: [
          'Lege in `Types.typ` einen Enum für die internen Zustände an und schreibe den `FUNCTION_BLOCK FB_EStopModel` (in AS6 lägen die Deklarationen in einer `.fun`-Datei).',
          'Bilde die Übergänge nach der Statusnummern-Tabelle ab und gib `DiagCode` als WORD aus.',
          'Schreibe die Funktion `FC_EStopDiagText`, die einen DiagCode in einen Klartext für das HMI übersetzt.',
          'Lass die Tests laufen, bis alle bestehen, und vergleiche dein Modell mit dem Signalablaufdiagramm in der B&R-Hilfe.',
          'Committe dein Projekt und reiche den Link als Nachweis ein.'
        ],
        done: 'Erledigt, wenn beide Projektübungen alle Tests bestehen und dein Nachweis-Link eingereicht ist.',
        tip: 'Benenne das Modell im Code deutlich (z. B. Kommentarblock „LERNMODELL – keine Sicherheitsfunktion“), damit es nie in ein reales Projekt kopiert wird.',
        link: { label: 'B&R Help: SF_EmergencyStop – Signalablaufdiagramme', url: brHelp('safety/mapp_safety/programming/safedesigner_lib/plcopen_sf/fbks/sf_emergencystop/signalablaufdiagramme.html') }
      }
    }
  ],
  videos: [
    { id: 'es2WI8W3LgY', title: 'PLCopen Safety Introduction', channel: 'PLCopen', lang: 'en', why: 'Die PLCopen-Organisation erklärt Konzept und Ziele der Safety-Bausteine.' },
    { id: 'uzfU5Uonya8', title: 'Webinar - New PLCopen safety library V2', channel: 'ABB PLC', lang: 'en', why: 'Zeigt die Neuerungen von PLCopen Safety V2 (z. B. Ausgänge für Reset-Anforderung) herstellerübergreifend.' }
  ],
  readings: [
    brReading('SF_EmergencyStop – Statusnummern', 'safety/mapp_safety/programming/safedesigner_lib/plcopen_sf/fbks/sf_emergencystop/statusnummern.html', 'Die vollständige DiagCode-Tabelle, Grundlage für Lernmodell und Dekoder.', 20),
    brReading('SF_GuardMonitoring', 'safety/mapp_safety/programming/safedesigner_lib/plcopen_sf/fbks/sf_guardmonitoring/sf_guardmonitoring.html', 'Zweikanalige Schutztürüberwachung mit Diskrepanzzeit im Vergleich zum Not-Halt-Baustein.', 20),
    brReading('PLCopen_SF – Funktionsbausteine', 'safety/mapp_safety/programming/safedesigner_lib/plcopen_sf/fbks/fbks.html', 'Übersicht aller PLCopen-Safety-Bausteine im SafeDESIGNER.', 10)
  ],
  quiz: [
    { type: 'single', q: 'Welcher DiagCode von SF_EmergencyStop bedeutet „Not-Halt entriegelt, Wiederanlaufsperre aktiv – Reset ausführen“?', options: ['16#8000', '16#8004', '16#8005', '16#C001'], correct: 2, explain: '8004 = Not-Halt betätigt, 8005 = entriegelt, Anlaufsperre (S_AutoReset = SAFEFALSE) aktiv.' },
    { type: 'single', q: 'Was bewirkt S_AutoReset = SAFETRUE?', options: ['Nach Entriegeln wird der Ausgang ohne Reset wieder freigegeben', 'Der Baustein ist deaktiviert', 'Reset-Fehler werden ignoriert', 'Der Ausgang bleibt immer SAFEFALSE'], correct: 0, explain: 'Ohne Anlaufsperre schaltet der Freigabeausgang nach Rückkehr von S_EStopIn wieder ein – nur zulässig, wenn dadurch keine Gefahr entsteht.' },
    { type: 'single', q: 'Wodurch entsteht DiagCode 16#C001?', options: ['Not-Halt-Taster defekt', 'Statisches TRUE an Reset bei aktiver Anlaufsperre nach Aktivierung', 'Activate = FALSE', 'Kommunikationsfehler'], correct: 1, explain: 'Der Baustein erwartet eine steigende Flanke; ein bereits anstehendes TRUE wird als Fehler erkannt.' }
  ],
  exam: [
    { type: 'multi', q: 'Welche Ausgänge haben (fast) alle PLCopen-Safety-Bausteine gemeinsam?', options: ['Ready', 'Error', 'DiagCode', 'MotorSpeed'], correct: [0, 1, 2], explain: 'Dazu kommt ein sicherer Freigabeausgang (z. B. S_EStopOut, S_GuardMonitoring).' },
    { type: 'single', q: 'Welchen Zweck hat die DiscrepancyTime bei SF_GuardMonitoring?', options: ['Sie verzögert den Reset', 'Sie begrenzt die Zeit, in der zwei Kanäle unterschiedliche Zustände haben dürfen', 'Sie legt die Zykluszeit fest', 'Sie ist die Nachlaufzeit'], correct: 1, explain: 'Zweikanalige Schalter schalten nie exakt gleichzeitig; über der Diskrepanzzeit wird ein Fehler erkannt.' },
    { type: 'single', q: 'Warum ist dein FB_EStopModel in Standard-ST keine Sicherheitsfunktion?', options: ['Weil er falsch programmiert ist', 'Weil Standard-CPU und Standard-ST nicht nach IEC 61508 entwickelt, nicht zertifiziert und ohne sichere Datentypen sind', 'Weil WORD-Ausgänge verboten sind', 'Weil er keinen Reset hat'], correct: 1, explain: 'Gleiche Logik auf ungeeigneter Plattform ergibt keine Sicherheitsfunktion.' },
    { type: 'single', q: 'Wie verhält sich SF_EmergencyStop beim DiagCode 16#8001?', options: ['Dauerhafter Fehler', 'Initialisierung nach Aktivierung, nach einem Zyklus abgeschlossen', 'Freigabe aktiv', 'Baustein deaktiviert'], correct: 1, explain: '8001 ist ein Übergangszustand direkt nach Activate = TRUE.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Lernmodell SF_EmergencyStop',
      task: '> **LERNMODELL – keine Sicherheitsfunktion.** Echte Not-Halt-Logik gehört in den SafeDESIGNER (Baustein SF_EmergencyStop der Bibliothek PLCopen_SF). Dieses Modell in Standard-ST dient ausschließlich dem Verständnis der Zustände und DiagCodes.\n\n' +
        'Schreibe `FUNCTION_BLOCK FB_EStopModel` mit den Eingängen `Activate, S_EStopIn, S_StartReset, S_AutoReset, Reset : BOOL` und den Ausgängen `Ready, S_EStopOut, Error : BOOL; DiagCode : WORD`. Verhalten (vereinfacht nach der B&R-Statusnummern-Tabelle):\n\n' +
        '| Code | Zustand | Übergänge |\n|---|---|---|\n' +
        '| 16#0000 | nicht aktiviert | Activate = TRUE → 8001 |\n' +
        '| 16#8001 | Initialisierung (1 Zyklus) | S_StartReset = FALSE → 8002; sonst S_EStopIn → 8000, sonst → 8004 |\n' +
        '| 16#8002 | Anlaufsperre nach Aktivierung, Not-Halt betätigt | S_EStopIn = TRUE: Reset = TRUE → C001, sonst → 8003 |\n' +
        '| 16#8003 | Anlaufsperre nach Aktivierung, entriegelt | S_EStopIn = FALSE → 8002; steigende Flanke Reset → 8000 |\n' +
        '| 16#8000 | Freigabe | S_EStopIn = FALSE → 8004 |\n' +
        '| 16#8004 | Not-Halt betätigt | S_EStopIn = TRUE: S_AutoReset → 8000; sonst Reset = TRUE → C002, sonst → 8005 |\n' +
        '| 16#8005 | entriegelt, Wiederanlaufsperre | S_EStopIn = FALSE → 8004; steigende Flanke Reset → 8000 |\n' +
        '| 16#C001 / 16#C002 | statisches Reset-Signal | Reset = FALSE → 8003 bzw. 8005 |\n\n' +
        'Immer: `Activate = FALSE` → 0000 (aus jedem Zustand). `Ready = Activate`, `S_EStopOut` nur bei 8000, `Error` bei C001/C002.\n\n' +
        'Das Programm ruft eine Instanz `fbEStop` auf und gibt `doReady`, `doEStopOut`, `doError`, `wDiagCode` aus.',
      hints: ['Ein interner Enum-Zustand ist robuster als ein CASE über WORD-Konstanten. Den DiagCode bildest du am Ende mit einem zweiten CASE.', 'Die Reset-Flanke: `bResetEdge := Reset AND NOT bResetOld; bResetOld := Reset;` – in jedem Aufruf.'],
      cycleMs: 10,
      io: [
        { name: 'diActivate', type: 'BOOL', dir: 'in', label: 'Activate', widget: 'switch', init: true },
        { name: 'diEStop', type: 'BOOL', dir: 'in', label: 'S_EStopIn (TRUE = entriegelt)', widget: 'switch', init: true },
        { name: 'diStartReset', type: 'BOOL', dir: 'in', label: 'S_StartReset', widget: 'switch' },
        { name: 'diAutoReset', type: 'BOOL', dir: 'in', label: 'S_AutoReset', widget: 'switch' },
        { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Reset', widget: 'button' },
        { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Ready', widget: 'led' },
        { name: 'doEStopOut', type: 'BOOL', dir: 'out', label: 'S_EStopOut (Modell)', widget: 'led' },
        { name: 'doError', type: 'BOOL', dir: 'out', label: 'Error', widget: 'led' },
        { name: 'wDiagCode', type: 'WORD', dir: 'out', label: 'DiagCode', widget: 'value' }
      ],
      files: {
        main: `(* LERNMODELL – keine Sicherheitsfunktion *)
FUNCTION_BLOCK FB_EStopModel
	VAR_INPUT
		Activate : BOOL;
		S_EStopIn : BOOL;
		S_StartReset : BOOL;
		S_AutoReset : BOOL;
		Reset : BOOL;
	END_VAR
	VAR_OUTPUT
		Ready : BOOL;
		S_EStopOut : BOOL;
		Error : BOOL;
		DiagCode : WORD;
	END_VAR
	(* TODO: Zustandsautomat nach Tabelle *)
	Ready := Activate;
	S_EStopOut := Activate AND S_EStopIn;
	DiagCode := 16#8000;
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbEStop(Activate := diActivate, S_EStopIn := diEStop, S_StartReset := diStartReset, S_AutoReset := diAutoReset, Reset := diReset);
	doReady := fbEStop.Ready;
	doEStopOut := fbEStop.S_EStopOut;
	doError := fbEStop.Error;
	wDiagCode := fbEStop.DiagCode;
END_PROGRAM
`,
        var: 'VAR\n\tfbEStop : FB_EStopModel;\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `(* LERNMODELL – keine Sicherheitsfunktion *)
FUNCTION_BLOCK FB_EStopModel
	VAR_INPUT
		Activate : BOOL;
		S_EStopIn : BOOL;
		S_StartReset : BOOL;
		S_AutoReset : BOOL;
		Reset : BOOL;
	END_VAR
	VAR_OUTPUT
		Ready : BOOL;
		S_EStopOut : BOOL;
		Error : BOOL;
		DiagCode : WORD;
	END_VAR
	VAR
		eState : eEStopState;
		bResetOld : BOOL;
		bResetEdge : BOOL;
	END_VAR
	bResetEdge := Reset AND NOT bResetOld;
	bResetOld := Reset;

	IF NOT Activate THEN
		eState := ES_IDLE;
	ELSE
		CASE eState OF
		ES_IDLE:
			eState := ES_INIT;
		ES_INIT:
			IF NOT S_StartReset THEN
				eState := ES_START_LOCK_PRESSED;
			ELSIF S_EStopIn THEN
				eState := ES_ENABLED;
			ELSE
				eState := ES_PRESSED;
			END_IF;
		ES_START_LOCK_PRESSED:
			IF S_EStopIn THEN
				IF Reset THEN
					eState := ES_ERR_START;
				ELSE
					eState := ES_START_LOCK_RELEASED;
				END_IF;
			END_IF;
		ES_START_LOCK_RELEASED:
			IF NOT S_EStopIn THEN
				eState := ES_START_LOCK_PRESSED;
			ELSIF bResetEdge THEN
				eState := ES_ENABLED;
			END_IF;
		ES_ENABLED:
			IF NOT S_EStopIn THEN
				eState := ES_PRESSED;
			END_IF;
		ES_PRESSED:
			IF S_EStopIn THEN
				IF S_AutoReset THEN
					eState := ES_ENABLED;
				ELSIF Reset THEN
					eState := ES_ERR_AUTO;
				ELSE
					eState := ES_RELEASED;
				END_IF;
			END_IF;
		ES_RELEASED:
			IF NOT S_EStopIn THEN
				eState := ES_PRESSED;
			ELSIF bResetEdge THEN
				eState := ES_ENABLED;
			END_IF;
		ES_ERR_START:
			IF NOT Reset THEN
				eState := ES_START_LOCK_RELEASED;
			END_IF;
		ES_ERR_AUTO:
			IF NOT Reset THEN
				eState := ES_RELEASED;
			END_IF;
		END_CASE;
	END_IF;

	CASE eState OF
	ES_IDLE: DiagCode := 16#0000;
	ES_INIT: DiagCode := 16#8001;
	ES_START_LOCK_PRESSED: DiagCode := 16#8002;
	ES_START_LOCK_RELEASED: DiagCode := 16#8003;
	ES_ENABLED: DiagCode := 16#8000;
	ES_PRESSED: DiagCode := 16#8004;
	ES_RELEASED: DiagCode := 16#8005;
	ES_ERR_START: DiagCode := 16#C001;
	ES_ERR_AUTO: DiagCode := 16#C002;
	END_CASE;

	Ready := Activate;
	S_EStopOut := (eState = ES_ENABLED);
	Error := (eState = ES_ERR_START) OR (eState = ES_ERR_AUTO);
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbEStop(Activate := diActivate, S_EStopIn := diEStop, S_StartReset := diStartReset, S_AutoReset := diAutoReset, Reset := diReset);
	doReady := fbEStop.Ready;
	doEStopOut := fbEStop.S_EStopOut;
	doError := fbEStop.Error;
	wDiagCode := fbEStop.DiagCode;
END_PROGRAM
`,
        var: 'VAR\n\tfbEStop : FB_EStopModel;\nEND_VAR\n',
        typ: 'TYPE\n\teEStopState : (ES_IDLE, ES_INIT, ES_START_LOCK_PRESSED, ES_START_LOCK_RELEASED, ES_ENABLED, ES_PRESSED, ES_RELEASED, ES_ERR_START, ES_ERR_AUTO);\nEND_TYPE\n'
      },
      tests: [
        { name: 'Nicht aktiviert', steps: [
          { set: { diActivate: false } }, { cycles: 3 },
          { expect: 'wDiagCode = 16#0000 AND NOT doEStopOut AND NOT doReady', msg: 'Activate = FALSE: DiagCode 0000, keine Freigabe.' }
        ]},
        { name: 'Anlaufsperre nach Aktivierung', steps: [
          { cycles: 5 },
          { expect: 'wDiagCode = 16#8003 AND NOT doEStopOut AND doReady', msg: 'Mit S_StartReset = FALSE und entriegeltem Not-Halt: 8003 (Reset erforderlich).' },
          { set: { diReset: true } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#8000 AND doEStopOut', msg: 'Reset-Flanke muss die Freigabe (8000) erteilen.' }
        ]},
        { name: 'Not-Halt mit Wiederanlaufsperre', steps: [
          { cycles: 5 }, { set: { diReset: true } }, { cycles: 2 }, { set: { diReset: false } }, { cycles: 2 },
          { set: { diEStop: false } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#8004 AND NOT doEStopOut', msg: 'Not-Halt betätigt: 8004.' },
          { set: { diEStop: true } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#8005', msg: 'Entriegelt mit Wiederanlaufsperre: 8005.' },
          { never: 'doEStopOut', ms: 500, msg: 'Ohne Reset darf keine Freigabe kommen.' },
          { set: { diReset: true } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#8000 AND doEStopOut', msg: 'Reset-Flanke in 8005 muss freigeben.' }
        ]},
        { name: 'Ohne Anlaufsperren (S_StartReset, S_AutoReset)', steps: [
          { set: { diStartReset: true, diAutoReset: true } }, { cycles: 3 },
          { expect: 'wDiagCode = 16#8000 AND doEStopOut', msg: 'Ohne Anlaufsperre direkt 8000.' },
          { set: { diEStop: false } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#8004', msg: 'Not-Halt betätigt: 8004.' },
          { set: { diEStop: true } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#8000', msg: 'Mit S_AutoReset kehrt die Freigabe ohne Reset zurück.' }
        ]},
        { name: 'Statisches Reset nach Aktivierung (C001)', steps: [
          { set: { diReset: true, diEStop: false } }, { cycles: 5 },
          { expect: 'wDiagCode = 16#8002', msg: 'Not-Halt betätigt nach Aktivierung mit Anlaufsperre: 8002.' },
          { set: { diEStop: true } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#C001 AND doError AND NOT doEStopOut', msg: 'Reset steht beim Entriegeln bereits an: Fehler C001.' },
          { set: { diReset: false } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#8003 AND NOT doError', msg: 'Reset = FALSE verlässt C001 nach 8003.' }
        ]},
        { name: 'Statisches Reset nach Not-Halt (C002)', steps: [
          { cycles: 5 }, { set: { diReset: true } }, { cycles: 2 }, { set: { diReset: false } }, { cycles: 2 },
          { set: { diEStop: false } }, { cycles: 2 },
          { set: { diReset: true } }, { cycles: 2 },
          { set: { diEStop: true } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#C002 AND doError', msg: 'Reset steht beim Entriegeln an: Fehler C002.' },
          { set: { diReset: false } }, { cycles: 2 },
          { expect: 'wDiagCode = 16#8005 AND NOT doEStopOut', msg: 'Reset = FALSE verlässt C002 nach 8005 – ohne Freigabe.' }
        ]}
      ]
    },
    {
      id: 'ex2', type: 'st', variant: 'schreiben',
      title: 'DiagCode-Dekoder für das HMI',
      task: ST_HINWEIS +
        'Die SafeLOGIC stellt den DiagCode von `SF_EmergencyStop` als nicht-sicheres WORD (`wDiagCode`) bereit. Schreibe die Funktion `FC_EStopDiagText(wCode : WORD) : STRING[80]` und gib den Text in `sDiagText` aus. Zusätzlich setzt das Programm `doNeedsReset` (Reset-Aufforderung im HMI) und `doIsError`.\n\n' +
        '| Code | Text (exakt) | doNeedsReset | doIsError |\n|---|---|---|---|\n' +
        '| 16#0000 | `Baustein nicht aktiv` | FALSE | FALSE |\n' +
        '| 16#8000 | `Freigabe` | FALSE | FALSE |\n' +
        '| 16#8001 | `Initialisierung` | FALSE | FALSE |\n' +
        '| 16#8002, 16#8004 | `Not-Halt betätigt` | FALSE | FALSE |\n' +
        '| 16#8003, 16#8005 | `Not-Halt entriegelt - bitte quittieren` | TRUE | FALSE |\n' +
        '| 16#C001, 16#C002 | `Reset-Taster prüfen (Dauersignal)` | FALSE | TRUE |\n' +
        '| alle anderen | `Unbekannter Code` | FALSE | TRUE |',
      hints: ['Eine IF/ELSIF-Kette mit `OR` für Code-Paare ist gut lesbar.', 'Die Hilfsausgänge lassen sich direkt aus Vergleichen bilden.'],
      cycleMs: 10,
      io: [
        { name: 'wDiagCode', type: 'WORD', dir: 'in', label: 'DiagCode SF_EmergencyStop', widget: 'value' },
        { name: 'sDiagText', type: 'STRING[80]', dir: 'out', label: 'HMI-Text', widget: 'value' },
        { name: 'doNeedsReset', type: 'BOOL', dir: 'out', label: 'HMI: Quittieren', widget: 'led' },
        { name: 'doIsError', type: 'BOOL', dir: 'out', label: 'HMI: Fehler', widget: 'led' }
      ],
      files: {
        main: `FUNCTION FC_EStopDiagText : STRING[80]
	VAR_INPUT
		wCode : WORD;
	END_VAR
	(* TODO *)
	FC_EStopDiagText := 'Unbekannter Code';
END_FUNCTION

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	sDiagText := FC_EStopDiagText(wDiagCode);
	doNeedsReset := FALSE;
	doIsError := FALSE;
END_PROGRAM
`,
        var: 'VAR\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `FUNCTION FC_EStopDiagText : STRING[80]
	VAR_INPUT
		wCode : WORD;
	END_VAR
	IF wCode = 16#0000 THEN
		FC_EStopDiagText := 'Baustein nicht aktiv';
	ELSIF wCode = 16#8000 THEN
		FC_EStopDiagText := 'Freigabe';
	ELSIF wCode = 16#8001 THEN
		FC_EStopDiagText := 'Initialisierung';
	ELSIF wCode = 16#8002 OR wCode = 16#8004 THEN
		FC_EStopDiagText := 'Not-Halt betätigt';
	ELSIF wCode = 16#8003 OR wCode = 16#8005 THEN
		FC_EStopDiagText := 'Not-Halt entriegelt - bitte quittieren';
	ELSIF wCode = 16#C001 OR wCode = 16#C002 THEN
		FC_EStopDiagText := 'Reset-Taster prüfen (Dauersignal)';
	ELSE
		FC_EStopDiagText := 'Unbekannter Code';
	END_IF;
END_FUNCTION

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	sDiagText := FC_EStopDiagText(wDiagCode);
	doNeedsReset := (wDiagCode = 16#8003) OR (wDiagCode = 16#8005);
	doIsError := (wDiagCode = 16#C001) OR (wDiagCode = 16#C002)
		OR NOT ((wDiagCode = 16#0000) OR (wDiagCode = 16#8000) OR (wDiagCode = 16#8001)
		OR (wDiagCode = 16#8002) OR (wDiagCode = 16#8003) OR (wDiagCode = 16#8004) OR (wDiagCode = 16#8005));
END_PROGRAM
`,
        var: 'VAR\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Freigabe und inaktiv', steps: [
          { set: { wDiagCode: 0x8000 } }, { cycles: 1 },
          { expect: "sDiagText = 'Freigabe' AND NOT doNeedsReset AND NOT doIsError", msg: '16#8000 muss „Freigabe“ ergeben.' },
          { set: { wDiagCode: 0 } }, { cycles: 1 },
          { expect: "sDiagText = 'Baustein nicht aktiv'", msg: '16#0000 muss „Baustein nicht aktiv“ ergeben.' }
        ]},
        { name: 'Not-Halt betätigt und entriegelt', steps: [
          { set: { wDiagCode: 0x8004 } }, { cycles: 1 },
          { expect: "sDiagText = 'Not-Halt betätigt' AND NOT doNeedsReset", msg: '16#8004 muss „Not-Halt betätigt“ ergeben.' },
          { set: { wDiagCode: 0x8005 } }, { cycles: 1 },
          { expect: "sDiagText = 'Not-Halt entriegelt - bitte quittieren' AND doNeedsReset", msg: '16#8005 verlangt Quittierung.' },
          { set: { wDiagCode: 0x8003 } }, { cycles: 1 },
          { expect: 'doNeedsReset AND NOT doIsError', msg: '16#8003 verlangt ebenfalls Quittierung.' }
        ]},
        { name: 'Fehlercodes', steps: [
          { set: { wDiagCode: 0xC002 } }, { cycles: 1 },
          { expect: "sDiagText = 'Reset-Taster prüfen (Dauersignal)' AND doIsError AND NOT doNeedsReset", msg: '16#C002 ist ein Fehler.' },
          { set: { wDiagCode: 0xC001 } }, { cycles: 1 },
          { expect: 'doIsError', msg: '16#C001 ist ein Fehler.' }
        ]},
        { name: 'Unbekannter Code', steps: [
          { set: { wDiagCode: 0x1234 } }, { cycles: 1 },
          { expect: "sDiagText = 'Unbekannter Code' AND doIsError", msg: 'Unbekannte Codes müssen als Fehler gemeldet werden.' },
          { set: { wDiagCode: 0x8001 } }, { cycles: 1 },
          { expect: "sDiagText = 'Initialisierung' AND NOT doIsError", msg: '16#8001 ist kein Fehler.' }
        ]}
      ]
    }
  ],
  proof: true,
  badge: 'PLCopen-Safety-Leser'
};

module.exports = [m1, m2, m3];
