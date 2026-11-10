'use strict';
const { HINWEIS, ST_HINWEIS, ABGERUFEN, brHelp, brReading } = require('./_common');

// ---------------------------------------------------------------------------
// Level 5 – Master: Safe Motion, Validierung, Dokumentation, Änderungsmanagement
// ---------------------------------------------------------------------------

const IFA2016_URL = 'https://dguv.de/ifa/publikationen/reports-download/reports-2016/ifa-report-2-2016/index.jsp';

const m1 = {
  id: 'safety-5-safemotion',
  level: 5,
  kind: 'lektion',
  title: 'Safe Motion: STO, SS1, SS2, SOS, SLS, SDI, SLP',
  summary: 'Antriebsintegrierte Sicherheitsfunktionen mit SafeMOTION – und wie die Standard-SPS einen kontrollierten Stopp mit Zeitüberwachung begleitet.',
  minutes: 200,
  req: ['safety-4-projekt-plcopen'],
  briefing: 'Moderne Servoantriebe (bei B&R ACOPOS P3, ACOPOSmulti, ACOPOSmotor mit SafeMOTION) überwachen Bewegungen selbst sicher. Die Grundfunktionen nach IEC 61800-5-2: **STO** (Safe Torque Off, Stopp 0), **SS1** (Safe Stop 1: Bremsen, dann STO), **SS2** (Safe Stop 2: Bremsen, dann SOS), **SOS** (Safe Operating Stop: Stillstand bei anliegender Regelung), **SLS** (Safely Limited Speed), **SDI** (Safe Direction), **SLP** (Safely Limited Position). ' +
    'Viele Funktionen brauchen eine sichere Geberauswertung; SS1 gibt es zeit- oder rampenüberwacht mit unterschiedlichem erreichbarem PL. ' +
    'Wichtig für dich als Programmierer: Die **Sicherheitsfunktion überwacht**, die **Standard-Applikation bremst**. Fordert die SafeLOGIC SS1 an, muss das Standardprogramm die Achse sofort an der Rampe stillsetzen – sonst greift die Überwachung und schaltet hart ab.' + HINWEIS,
  practice: 'An einer Verpackungsmaschine öffnet der Bediener die Tür im Einrichtbetrieb: SLS begrenzt die Geschwindigkeit, beim Not-Halt bremst SS1 alle Achsen kontrolliert, bevor STO die Energie wegnimmt.',
  transfer: {
    tia: 'SINAMICS Safety Integrated bietet dieselben Funktionen (STO, SS1, SLS …), parametriert im Startdrive. Die Rollenverteilung „Antrieb überwacht, Steuerung bremst“ ist identisch.',
    codesys: 'Bei Beckhoff übernehmen TwinSAFE-Drive-Optionen (z. B. AX8000 mit TwinSAFE) die Überwachung; die NC-Achse bremst funktional.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Ordne die Safe-Motion-Funktionen zu',
      guide: {
        intro: 'Jede Funktion hat eine klare Wirkung und einen Einsatzzweck.',
        steps: [
          'Öffne in der B&R-Hilfe die Übersicht „Sicherheitsfunktionen“ der SafeMOTION-Module und notiere STO, STO1, SBC, SOS, SS1, SS2, SLS, SMS, SLI, SDI, SLA, SLP, SMP, SLT.',
          'Ordne jeder Funktion zu: Stoppfunktion oder Überwachungsfunktion? Energie bleibt oder Energie weg?',
          'Lies die Tabelle „Integrierte Sicherheitsfunktionen“ und notiere, welche Funktionen eine sichere Geberauswertung benötigen und welche PL/SIL jeweils erreichbar sind.',
          'Notiere den Unterschied zwischen SS1 zeitüberwacht (nach Ablauf der Zeit STO) und rampenüberwacht (Drehzahl muss unter einer Hüllkurve bleiben).',
          'Ordne für eine Hubachse, ein Förderband und eine Rundtaktachse sinnvolle Funktionen zu.'
        ],
        done: 'Erledigt, wenn du für jede der sieben Kernfunktionen (STO, SS1, SS2, SOS, SLS, SDI, SLP) Wirkung, Stoppkategorie bzw. Zweck und Geberbedarf nennen kannst.',
        tip: 'SOS hält die Achse im Stillstand mit Regelung – ideal für Eingriffe, bei denen die Position nicht verloren gehen darf. STO ist dafür ungeeignet, wenn Last wirkt.',
        link: { label: 'B&R Help: SafeMOTION – Sicherheitsfunktionen', url: brHelp('safety/safety_hardware/safemotion/ms-safety/sicherheitstechnik/sicherheitsfunktionen.html') }
      }
    },
    {
      id: 'o2',
      title: 'Plane das Zusammenspiel von SS1 und funktionalem Stopp',
      guide: {
        intro: 'Damit SS1 nicht in die Überwachung läuft, muss die Standard-Applikation schneller bremsen, als die Sicherheitsfunktion es erlaubt.',
        steps: [
          'Berechne die Bremszeit: t = n / a (z. B. 1500 min⁻¹ bei 3000 min⁻¹/s = 0,5 s).',
          'Lege die Überwachungszeit der Standard-Seite kleiner als die SS1-Zeit der Sicherheitsfunktion fest (z. B. 1,0 s gegen 1,2 s), damit die Standard-Seite einen Fehler zuerst meldet.',
          'Lege fest, ab welcher Drehzahl „Stillstand“ gilt (Stillstandsschwelle, z. B. 10 min⁻¹).',
          'Programmiere den Ablauf als Zustandsautomat: RUN → STOPPING (Rampe, Reglerfreigabe bleibt) → IDLE (Freigabe weg) bzw. FAULT bei Zeitüberschreitung.',
          'Teste mit reduzierter Bremsleistung (Simulationsschalter), dass die Zeitüberwachung greift.'
        ],
        code: { lang: 'st', text: 'rSpeedCmd := MAX(rSpeedCmd - rDecel * rCycleS, 0.0);\nIF ABS(rActSpeed) < rStandstill THEN\n\tdoDriveEnable := FALSE;\nEND_IF;' },
        done: 'Erledigt, wenn die Übung „Kontrollierter Stopp mit Zeitüberwachung“ alle Tests besteht.',
        tip: 'In mapp Motion übernimmt der Stop-Befehl von MpAxisBasic die Rampe. Die Übung rechnet die Rampe selbst, damit du das Prinzip siehst.',
        link: { label: 'B&R Help: Integrierte Sicherheitsfunktionen', url: brHelp('safety/safety_hardware/safemotion/ms-safety/sicherheitstechnik/integrierte_sicherheitsfunktionen_.html') }
      }
    },
    {
      id: 'o3',
      title: 'Binde Safe Motion im SafeDESIGNER ein',
      guide: {
        intro: 'Die Bibliothek openSAFETY_BuR_Motion_SF stellt die Safe-Motion-Bausteine im SafeDESIGNER bereit.',
        steps: [
          'Öffne in der B&R-Hilfe die Übersicht der Bibliothek `openSAFETY_BuR_Motion_SF` und die Bausteine `SF_OS_Motion_Basic_BR` und `SF_OS_Motion_Speed_BR`.',
          'Notiere, welche Anforderungseingänge (z. B. für STO, SS1, SLS) und welche Statusausgänge es gibt.',
          'Lies den Abschnitt „Fehlervermeidung“ der Bibliothek und notiere die wichtigsten Hinweise.',
          'Skizziere, welche Statusausgänge du in der Standard-Applikation für Diagnose und Bedienführung lesen würdest.'
        ],
        done: 'Erledigt, wenn deine Skizze zu einer Achse die angeforderten Funktionen, die Statusrückmeldungen und die Reaktion der Standard-Applikation enthält.',
        tip: 'Wird eine Sicherheitsfunktion nicht verwendet, muss der entsprechende Eingang frei bleiben – das verhindert ungewollte Konfiguration.',
        link: { label: 'B&R Help: openSAFETY_BuR_Motion_SF', url: brHelp('safety/mapp_safety/programming/safedesigner_lib/opensafety_bur_motion_sf/opensafety_bur_motion_sf.html') }
      }
    }
  ],
  videos: [
    { id: 'CdlppwQAXf0', title: 'Schmersal Product Animations - PSC1 Functions: STO Safe Torque Off', channel: 'SchmersalUSA', lang: 'en', why: 'Animation des Drehzahlverlaufs bei STO.' },
    { id: 'GYxzR8-34A4', title: 'Schmersal Product Animations - PSC1 Functions: SS1 Safe Stop 1', channel: 'SchmersalUSA', lang: 'en', why: 'Animation von SS1: erst Bremsen, dann STO.' },
    { id: 'X4iagCxkeGs', title: 'B&R: SafeMotion Experience', channel: 'Automazione Oggi', lang: 'it', why: 'Praxisdemonstration der B&R-SafeMOTION-Funktionen (Bild aussagekräftig, Ton italienisch).' }
  ],
  readings: [
    brReading('SafeMOTION – Sicherheitsfunktionen', 'safety/safety_hardware/safemotion/ms-safety/sicherheitstechnik/sicherheitsfunktionen.html', 'Vollständige Liste der antriebsintegrierten Sicherheitsfunktionen der ACOPOS-Familie.', 30),
    brReading('Integrierte Sicherheitsfunktionen', 'safety/safety_hardware/safemotion/ms-safety/sicherheitstechnik/integrierte_sicherheitsfunktionen_.html', 'Tabelle mit erreichbarem PL/SIL und Geberbedarf je Funktion.', 20),
    brReading('Übersicht Sicherheitslevel für die Sicherheitsfunktionen der ACOPOS Produktfamilie', 'safety/safety_hardware/safemotion/ms-safety/ubersicht_uber_die_sicherheitsfunktionen_der_acopos_baureihe.html', 'Vergleicht verdrahtete und netzwerkbasierte Sicherheitstechnik bei B&R-Antrieben.', 15)
  ],
  quiz: [
    { type: 'single', q: 'Welche Funktion bremst den Antrieb und hält ihn danach mit aktiver Regelung sicher im Stillstand?', options: ['STO', 'SS1', 'SS2', 'SLS'], correct: 2, explain: 'SS2 = Bremsen und Übergang in SOS (Energie bleibt). SS1 endet in STO.' },
    { type: 'numeric', q: 'Eine Achse läuft mit n = {n} min⁻¹ und bremst mit a = {a} min⁻¹/s. Wie lange dauert die Bremsung bis zum Stillstand?',
      params: { n: [1000, 3000, 250], a: [2000, 6000, 1000] }, formula: 'n / a * 1000', unit: 'ms', tol: 0.02,
      explain: 't = n / a. Bei 1500 min⁻¹ und 3000 min⁻¹/s sind das 0,5 s = 500 ms.' },
    { type: 'single', q: 'Die SafeLOGIC fordert SS1 an. Was muss das Standardprogramm tun?', options: ['Nichts, die Sicherheitsfunktion macht alles', 'Sofort die Reglerfreigabe wegnehmen', 'Die Achse an der Rampe stillsetzen, damit die Sicherheitsüberwachung nicht auslöst', 'Die Geschwindigkeit erhöhen'], correct: 2, explain: 'Die Überwachung prüft nur. Bremst die Applikation nicht, endet SS1 per Zeit- oder Rampenüberwachung in einem harten STO.' }
  ],
  exam: [
    { type: 'single', q: 'Welche Stoppkategorie entspricht STO?', options: ['Stoppkategorie 0', 'Stoppkategorie 1', 'Stoppkategorie 2', 'Keine'], correct: 0, explain: 'STO nimmt die drehmomentbildende Energie sofort weg (ungesteuertes Stillsetzen).' },
    { type: 'single', q: 'Wozu dient SDI?', options: ['Geschwindigkeitsbegrenzung', 'Überwachung der zulässigen Bewegungsrichtung', 'Positionsgrenze', 'Bremsenansteuerung'], correct: 1, explain: 'Safe Direction lässt nur eine Bewegungsrichtung zu.' },
    { type: 'multi', q: 'Welche Funktionen benötigen typischerweise eine sichere Geberauswertung?', options: ['STO', 'SLS', 'SOS', 'SLP'], correct: [1, 2, 3], explain: 'STO braucht keinen Geber; Drehzahl-, Stillstands- und Positionsüberwachungen schon.' },
    { type: 'single', q: 'Warum sollte die Zeitüberwachung der Standard-Seite kürzer sein als die SS1-Zeit der Sicherheitsfunktion?', options: ['Damit die Standard-Seite einen langsamen Stopp zuerst und verständlich meldet', 'Damit die Sicherheitsfunktion abgeschaltet werden kann', 'Weil die Norm das so vorschreibt', 'Damit die Bremse geschont wird'], correct: 0, explain: 'Es geht um Diagnose und Verfügbarkeit – die Sicherheitsfunktion bleibt die letzte Instanz.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Kontrollierter Stopp mit Zeitüberwachung (SS1-ähnlich)',
      task: ST_HINWEIS +
        'Die SafeLOGIC fordert über `diSafetyOK = FALSE` einen Safe Stop 1 an. Die Sicherheitsfunktion überwacht – **dein Standardprogramm bremst**. Programmiere einen Zustandsautomaten (`ST_IDLE, ST_RUN, ST_STOPPING, ST_FAULT`), Zykluszeit 10 ms:\n\n' +
        '- `ST_IDLE`: `doDriveEnable = FALSE`, `rSpeedCmd = 0`. Steigende Flanke an `diStart` bei `diSafetyOK` → `ST_RUN` (Wiederanlaufsperre: nie automatisch starten).\n' +
        '- `ST_RUN`: `doDriveEnable = TRUE`, `rSpeedCmd = 1500.0` (min⁻¹). `diSafetyOK = FALSE` → `ST_STOPPING`.\n' +
        '- `ST_STOPPING`: **Freigabe bleibt**, `rSpeedCmd` fährt mit **3000 min⁻¹/s** (= 30 min⁻¹ pro Zyklus) Richtung 0, `nDiag = 1`. Ist `ABS(rActSpeed) < 10.0` → Freigabe weg, `doStopDone = TRUE`, `nDiag = 0`, `ST_IDLE`.\n' +
        '- **Zeitüberwachung:** Ist nach **1 s** in `ST_STOPPING` kein Stillstand erreicht → Freigabe sofort weg, `rSpeedCmd = 0`, `nDiag = 2`, `ST_FAULT`.\n' +
        '- `ST_FAULT`: Freigabe aus; steigende Flanke an `diAck` bei `diSafetyOK` → `nDiag = 0`, `ST_IDLE`.\n\n' +
        'Die Simulation bildet den Antrieb nach (max. 3000 min⁻¹/s; mit `simLowTorque` nur 500 min⁻¹/s beim Bremsen; ohne Freigabe trudelt er langsam aus).',
      hints: ['`tonStopMon(IN := (eState = ST_STOPPING), PT := T#1s);` vor dem CASE aufrufen.', 'Die Rampe: `rSpeedCmd := MAX(rSpeedCmd - rDecel * rCycleS, 0.0);` mit `rCycleS := 0.01`.', '`doStopDone` beim nächsten Start zurücksetzen.'],
      cycleMs: 10,
      io: [
        { name: 'diSafetyOK', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: keine Stopp-Anforderung', widget: 'switch' },
        { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start-Taster', widget: 'button' },
        { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
        { name: 'simLowTorque', type: 'BOOL', dir: 'in', label: 'Simulation: Bremsleistung reduziert', widget: 'switch' },
        { name: 'rActSpeed', type: 'REAL', dir: 'in', label: 'Istdrehzahl [min⁻¹]', widget: 'gauge', min: 0, max: 1600, unit: 'min⁻¹' },
        { name: 'doDriveEnable', type: 'BOOL', dir: 'out', label: 'Reglerfreigabe', widget: 'led' },
        { name: 'rSpeedCmd', type: 'REAL', dir: 'out', label: 'Solldrehzahl [min⁻¹]', widget: 'gauge', min: 0, max: 1600, unit: 'min⁻¹' },
        { name: 'doStopDone', type: 'BOOL', dir: 'out', label: 'Kontrollierter Stopp abgeschlossen', widget: 'led' },
        { name: 'nDiag', type: 'INT', dir: 'out', label: 'Diagnose', widget: 'value' }
      ],
      scene: { type: 'motor', bind: { run: 'doDriveEnable', speed: 'rActSpeed' } },
      plant: {
        var: 'VAR\n\trStep : REAL;\n\trLim : REAL;\nEND_VAR\n',
        code: `IF doDriveEnable THEN
	rStep := rSpeedCmd - rActSpeed;
	IF rStep < 0.0 AND simLowTorque THEN
		rLim := 500.0 * PLANT_DT;
	ELSE
		rLim := 3000.0 * PLANT_DT;
	END_IF;
	rActSpeed := rActSpeed + LIMIT(-rLim, rStep, rLim);
ELSE
	rActSpeed := MAX(rActSpeed - 200.0 * PLANT_DT, 0.0);
END_IF;`
      },
      files: {
        main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Zustandsautomat mit Rampe und Zeitüberwachung *)
	rtStart(CLK := diStart);
	IF NOT diSafetyOK THEN
		doDriveEnable := FALSE;
		rSpeedCmd := 0.0;
	ELSIF rtStart.Q THEN
		doDriveEnable := TRUE;
		rSpeedCmd := 1500.0;
	END_IF;
END_PROGRAM
`,
        var: 'VAR\n\trtStart : R_TRIG;\nEND_VAR\n',
        typ: 'TYPE\n\teStopState : (ST_IDLE, ST_RUN, ST_STOPPING, ST_FAULT);\nEND_TYPE\n'
      },
      solution: {
        main: `PROGRAM _INIT
	eState := ST_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	rtAck(CLK := diAck);
	tonStopMon(IN := (eState = ST_STOPPING), PT := T#1s);

	CASE eState OF
	ST_IDLE:
		doDriveEnable := FALSE;
		rSpeedCmd := 0.0;
		IF rtStart.Q AND diSafetyOK THEN
			doStopDone := FALSE;
			eState := ST_RUN;
		END_IF;

	ST_RUN:
		doDriveEnable := TRUE;
		rSpeedCmd := rNominalSpeed;
		IF NOT diSafetyOK THEN
			eState := ST_STOPPING;
		END_IF;

	ST_STOPPING:
		doDriveEnable := TRUE;
		nDiag := 1;
		rSpeedCmd := MAX(rSpeedCmd - rDecel * rCycleS, 0.0);
		IF ABS(rActSpeed) < rStandstill THEN
			doDriveEnable := FALSE;
			doStopDone := TRUE;
			nDiag := 0;
			eState := ST_IDLE;
		ELSIF tonStopMon.Q THEN
			doDriveEnable := FALSE;
			rSpeedCmd := 0.0;
			nDiag := 2;
			eState := ST_FAULT;
		END_IF;

	ST_FAULT:
		doDriveEnable := FALSE;
		rSpeedCmd := 0.0;
		IF rtAck.Q AND diSafetyOK THEN
			nDiag := 0;
			eState := ST_IDLE;
		END_IF;
	END_CASE;
END_PROGRAM
`,
        var: 'VAR\n\teState : eStopState;\n\trtStart : R_TRIG;\n\trtAck : R_TRIG;\n\ttonStopMon : TON;\nEND_VAR\nVAR CONSTANT\n\trNominalSpeed : REAL := 1500.0;\n\trDecel : REAL := 3000.0;\n\trCycleS : REAL := 0.01;\n\trStandstill : REAL := 10.0;\nEND_VAR\n',
        typ: 'TYPE\n\teStopState : (ST_IDLE, ST_RUN, ST_STOPPING, ST_FAULT);\nEND_TYPE\n'
      },
      tests: [
        { name: 'Start nur mit Freigabe und Flanke', steps: [
          { set: { diStart: true } }, { cycles: 3 }, { set: { diStart: false } },
          { expect: 'NOT doDriveEnable', msg: 'Ohne diSafetyOK darf nicht gestartet werden.' },
          { set: { diSafetyOK: true } },
          { never: 'doDriveEnable', ms: 200, msg: 'Wiederanlaufsperre: Freigabe allein startet nicht.' },
          { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { until: 'rActSpeed > 1400.0', maxMs: 2000, msg: 'Die Achse muss auf Nenndrehzahl hochlaufen.' },
          { expect: 'doDriveEnable', msg: 'Im Lauf muss die Reglerfreigabe anliegen.' }
        ]},
        { name: 'Kontrollierter Stopp: erst Rampe, dann Freigabe weg', steps: [
          { set: { diSafetyOK: true, diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { until: 'rActSpeed > 1400.0', maxMs: 2000 },
          { set: { diSafetyOK: false } }, { cycles: 2 },
          { expect: 'doDriveEnable', msg: 'SS1-ähnlich: Die Freigabe darf nicht sofort wegfallen, erst wird gebremst.' },
          { until: 'NOT doDriveEnable', maxMs: 1000, msg: 'Nach dem Bremsen muss die Freigabe wegfallen.' },
          { expect: 'rActSpeed < 20.0 AND doStopDone AND nDiag = 0', msg: 'Freigabe erst im Stillstand wegnehmen; doStopDone setzen.' }
        ]},
        { name: 'Rampe statt Sprung', steps: [
          { set: { diSafetyOK: true, diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { until: 'rActSpeed > 1400.0', maxMs: 2000 }, { ms: 100 },
          { set: { diSafetyOK: false } }, { cycles: 12 },
          { expect: 'rSpeedCmd > 900.0 AND rSpeedCmd < 1450.0', msg: 'Nach 120 ms muss der Sollwert an der Rampe (3000 min⁻¹/s) liegen, nicht auf 0 springen.' }
        ]},
        { name: 'Zeitüberwachung bei zu schwacher Bremsung', steps: [
          { set: { simLowTorque: true, diSafetyOK: true, diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { until: 'rActSpeed > 1400.0', maxMs: 2000 },
          { set: { diSafetyOK: false } },
          { ms: 900 },
          { expect: 'doDriveEnable', msg: 'Vor Ablauf der Überwachungszeit (1 s) darf die Freigabe nicht wegfallen.' },
          { ms: 200 },
          { expect: 'NOT doDriveEnable AND nDiag = 2', msg: 'Nach 1 s ohne Stillstand: Freigabe weg und Code 2.' },
          { set: { diSafetyOK: true } }, { ms: 200 },
          { expect: 'nDiag = 2 AND NOT doDriveEnable', msg: 'FAULT bleibt bis zur Quittierung.' },
          { set: { diAck: true } }, { cycles: 2 },
          { expect: 'nDiag = 0 AND NOT doDriveEnable', msg: 'Quittieren führt nach IDLE, ohne zu starten.' }
        ]},
        { name: 'Kein Wiederanlauf nach Stopp', steps: [
          { set: { diSafetyOK: true, diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { until: 'rActSpeed > 1400.0', maxMs: 2000 },
          { set: { diSafetyOK: false } },
          { until: 'doStopDone', maxMs: 1200 },
          { set: { diSafetyOK: true } },
          { never: 'doDriveEnable', ms: 300, msg: 'Nach Rückkehr der Freigabe darf die Achse nicht selbst anlaufen.' }
        ]}
      ]
    }
  ],
  proof: false
};

// ---------------------------------------------------------------------------
const m2 = {
  id: 'safety-5-validierung',
  level: 5,
  kind: 'lektion',
  title: 'Validierung, Spezifikation und Dokumentation',
  summary: 'Sicherheitsfunktionen spezifizieren, Software nach V-Modell entwickeln, nach EN ISO 13849-2 validieren und Nachweise erzeugen.',
  minutes: 200,
  req: ['safety-5-safemotion'],
  briefing: 'Eine Sicherheitsfunktion ist erst fertig, wenn sie validiert ist. Die EN ISO 13849-2 beschreibt die Validierung durch Analyse und Prüfung: Stimmen Spezifikation, Architektur, Kennwerte und Software? Funktioniert jede Sicherheitsfunktion bei Anforderung und bei Fehlern? ' +
    'Grundlage ist die **Sicherheitsfunktions-Spezifikation** (Safety Requirements Specification): auslösendes Ereignis, Reaktion, sicherer Zustand, Reaktionszeit, PLr, Betriebsarten, Rücksetzverhalten. Für die Anwendungssoftware empfiehlt das IFA die **Matrixmethode** entlang des V-Modells. ' +
    'Die Standard-SPS kann bei Validierungstests helfen, z. B. Reaktions- und Nachlaufzeiten messen und protokollieren – das Ergebnis bewertest aber immer du.' + HINWEIS,
  practice: 'Bei der Abnahme legst du ein Validierungsprotokoll vor: jede Sicherheitsfunktion mit Testfall, erwarteter Reaktion, gemessener Reaktionszeit, Datum, Prüfer und CRC der geprüften SafeAPPLICATION.',
  transfer: {
    tia: 'Siemens erzeugt einen „Safety-Ausdruck“ mit F-Signaturen als Teil der Abnahmedokumentation. Die Validierung selbst ist herstellerunabhängig.',
    codesys: 'Die IFA-Matrixmethode und SOFTEMA sind herstellerneutral und für jede Safety-Plattform nutzbar.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Schreibe eine Sicherheitsfunktions-Spezifikation',
      guide: {
        intro: 'Ohne Spezifikation gibt es nichts, wogegen validiert werden kann.',
        steps: [
          'Lege je Sicherheitsfunktion ein Datenblatt an: Name, ID (z. B. SF-03), auslösendes Ereignis, Sensoren, Logik, Aktoren.',
          'Beschreibe Reaktion und sicheren Zustand (z. B. „SS1, max. 1,2 s, danach STO an Achsen 1–3“).',
          'Lege PLr, Kategorie, maximale Reaktionszeit, Rücksetzverhalten (Quittierung/Wiederanlaufsperre) und gültige Betriebsarten fest.',
          'Ordne jeder Funktion die Gefährdung aus der Risikobeurteilung zu (Rückverfolgbarkeit).',
          'Lass die Spezifikation von einer zweiten Person prüfen und versioniere sie zusammen mit dem Code.'
        ],
        done: 'Erledigt, wenn für mindestens drei Sicherheitsfunktionen vollständige, geprüfte Datenblätter vorliegen.',
        tip: 'Formuliere testbar: „innerhalb von 200 ms“ statt „schnell“. Jede Anforderung wird später zu einem Testfall.',
        link: { label: 'IFA Report 2/2016: Matrixmethode', url: IFA2016_URL }
      }
    },
    {
      id: 'o2',
      title: 'Entwickle die Anwendungssoftware nach dem V-Modell',
      guide: {
        intro: 'EN ISO 13849-1 fordert für sicherheitsbezogene Anwendungssoftware (SRASW) einen strukturierten Prozess.',
        steps: [
          'Lies im IFA Report 2/2016 die Kapitel zum V-Modell und zur Matrixmethode.',
          'Ordne deine Arbeitsschritte den Ebenen zu: Spezifikation ↔ Validierung, Systementwurf ↔ Integrationstest, Modulentwurf ↔ Modultest, Codierung.',
          'Nutze im SafeDESIGNER nur bewährte Bausteine (PLCopen_SF), halte Programmierregeln ein und kommentiere jede Sicherheitsfunktion.',
          'Erstelle für jeden Baustein einen Modultest mit Grenz- und Fehlerfällen (Simulation EasySim als Vortest).',
          'Dokumentiere Reviews (wer, wann, Ergebnis) – sie sind ein Nachweis für die Vermeidung systematischer Fehler.'
        ],
        done: 'Erledigt, wenn deine Testfalltabelle jede Anforderung der Spezifikation mindestens einem Test zuordnet.',
        tip: 'SOFTEMA vom IFA hilft, Matrixmethode und Dokumentation konsequent anzuwenden.'
      }
    },
    {
      id: 'o3',
      title: 'Validiere an der Maschine und miss Reaktionszeiten',
      guide: {
        intro: 'Die Validierung an der realen Maschine ist durch keine Simulation ersetzbar.',
        steps: [
          'Lies in der B&R-Hilfe „Inbetriebnahme / Validierung der gesamten Sicherheitsfunktion“: Alle verwendeten Sicherheitsfunktionen müssen getestet werden.',
          'Prüfe jede Funktion bei Anforderung, bei Fehlern (z. B. Kanal-Querschluss, Diskrepanz) und in allen Betriebsarten.',
          'Miss die Reaktionszeit vom Auslösen bis zum Stillstand mehrfach und dokumentiere Minimum, Maximum und Mittelwert.',
          'Nutze dafür ein Messprogramm in der Standard-SPS (Übung dieses Moduls) und vergleiche mit der Spezifikation.',
          'Halte im Protokoll die CRC der geprüften SafeAPPLICATION fest.'
        ],
        done: 'Erledigt, wenn die Übung „Reaktionszeitmessung für das Validierungsprotokoll“ alle Tests besteht und du ein Protokollmuster mit CRC-Feld angelegt hast.',
        tip: 'Miss immer unter ungünstigen Bedingungen (max. Last, max. Geschwindigkeit) – sonst ist der Nachlauf zu optimistisch.',
        link: { label: 'B&R Help: Inbetriebnahme / Validierung', url: brHelp('safety/safety_diagnostics/svc-scenarios/inbetriebnahme.html') }
      }
    }
  ],
  videos: [
    { id: '1adyUOukVvE', title: 'Ihr Weg zur Maschinensicherheit: 5/6 Sicherheitsvalidierung für Maschinen | Pilz', channel: 'Pilz GmbH & Co. KG', lang: 'de', why: 'Erklärt Ablauf und Inhalte einer Sicherheitsvalidierung.' },
    { id: 'ap3XKlt0DNE', title: 'CE Kennzeichnung: Schritt 4 – Validierung nach EN ISO 13849 (Funktionale Sicherheit)', channel: 'Ingenieurbüro Leimkühler GmbH', lang: 'de', why: 'Ordnet die Validierung in den CE-Prozess ein.' },
    { id: 'OzL5c7W5DX8', title: '13849 Softema Teil 6 - Validierung', channel: 'MBT Maschinenbautage', lang: 'de', why: 'Zeigt die Validierung von Anwendungssoftware mit SOFTEMA.' }
  ],
  readings: [
    {
      title: 'Sicherheitsbezogene Anwendungssoftware von Maschinen – Die Matrixmethode des IFA (IFA Report 2/2016)', author: 'Huelke, M., Becker, N., & Eggeling, M.', institution: 'IFA der DGUV und Hochschule Bonn-Rhein-Sieg',
      work: 'IFA Report 2/2016', year: 2016, type: 'Norm/Amtlich', minutes: 90, url: IFA2016_URL,
      why: 'Praxisnahe Methode zur Spezifikation, Validierung und Dokumentation von Sicherheitssoftware, entstanden in einem Hochschulprojekt.',
      apa: 'Huelke, M., Becker, N., & Eggeling, M. (2016). *Sicherheitsbezogene Anwendungssoftware von Maschinen – Die Matrixmethode des IFA* (IFA Report 2/2016). DGUV. ' + ABGERUFEN + IFA2016_URL
    },
    brReading('Inbetriebnahme / Validierung der gesamten Sicherheitsfunktion', 'safety/safety_diagnostics/svc-scenarios/inbetriebnahme.html', 'B&R-Vorgaben für die Validierung bei der Inbetriebnahme.', 15),
    brReading('Projekt senden (herunterladen)', 'safety/mapp_safety/programming/safedesigner/safety-controler-start-up/projekt_senden_-_herunterladen.html', 'Was beim Übertragen gilt und warum die Simulation den realen Funktionstest nicht ersetzt.', 15)
  ],
  quiz: [
    { type: 'single', q: 'Welche Norm beschreibt die Validierung sicherheitsbezogener Steuerungsteile?', options: ['EN ISO 13849-2', 'EN 60204-1', 'EN ISO 12100', 'IEC 61131-3'], correct: 0, explain: 'EN ISO 13849-2 regelt die Validierung durch Analyse und Prüfung.' },
    { type: 'multi', q: 'Was gehört in eine Sicherheitsfunktions-Spezifikation?', options: ['Auslösendes Ereignis und Reaktion', 'Sicherer Zustand und Reaktionszeit', 'PLr und Rücksetzverhalten', 'Farbe des HMI-Buttons'], correct: [0, 1, 2], explain: 'Die Spezifikation beschreibt alles, was später validiert wird. Gestaltungsdetails des HMI gehören nicht dazu.' },
    { type: 'single', q: 'Darf die SafeDESIGNER-Simulation den Funktionstest an der Maschine ersetzen?', options: ['Ja, wenn alle Tests grün sind', 'Nein, sie ist nur ein Vortest', 'Ja, bei PL a', 'Nur bei Software-Änderungen'], correct: 1, explain: 'Laut B&R-Hilfe darf die Simulation den echten Funktionstest mit SafeLOGIC und sicheren I/Os keinesfalls ersetzen.' }
  ],
  exam: [
    { type: 'single', q: 'Welchem Prozessmodell folgt die Entwicklung sicherheitsbezogener Anwendungssoftware nach EN ISO 13849-1?', options: ['Wasserfall ohne Tests', 'V-Modell', 'Scrum ohne Dokumentation', 'Kein Modell vorgegeben'], correct: 1, explain: 'Die Norm fordert ein V-Modell mit Verifikation und Validierung auf jeder Ebene.' },
    { type: 'single', q: 'Warum gehört die CRC der SafeAPPLICATION ins Validierungsprotokoll?', options: ['Sie ist dekorativ', 'Sie belegt eindeutig, welcher Programmstand validiert wurde', 'Sie ersetzt die Unterschrift', 'Sie ist für das HMI nötig'], correct: 1, explain: 'Nur mit CRC lässt sich später nachweisen, dass der laufende Stand der geprüfte ist.' },
    { type: 'multi', q: 'Welche Prüfungen gehören zur Validierung einer Schutztürüberwachung?', options: ['Öffnen im Betrieb – Reaktion und Reaktionszeit', 'Fehlersimulation, z. B. ein Kanal unterbrochen', 'Prüfung der Wiederanlaufsperre', 'Nur Sichtprüfung des Schalters'], correct: [0, 1, 2], explain: 'Validierung umfasst Funktion bei Anforderung, Fehlerverhalten und Rücksetzverhalten.' },
    { type: 'single', q: 'Wer bewertet die von der Standard-SPS gemessenen Reaktionszeiten?', options: ['Das Programm selbst', 'Die verantwortliche, qualifizierte Person bei der Validierung', 'Der Bediener', 'Niemand, sie werden nur gespeichert'], correct: 1, explain: 'Messwerte sind ein Hilfsmittel; die Bewertung ist Teil der dokumentierten Validierung.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Reaktionszeitmessung für das Validierungsprotokoll',
      task: ST_HINWEIS +
        'Für das Validierungsprotokoll soll die Standard-SPS die Zeit vom Betätigen des Not-Halts bis zur Stillstandsmeldung des Antriebs messen (Messhilfe, keine Sicherheitsfunktion).\n\n' +
        '- Start einer Messung: **fallende Flanke** von `diEStopReleased`.\n' +
        '- Ende: `diDriveStandstill = TRUE` → `nLastStopMs` (DINT, Millisekunden), `nTestCount` + 1, `nMaxStopMs` aktualisieren. Liegt die Zeit über `nLimitMs` (Konstante 800), wird `doLimitExceeded` gesetzt (bleibt gesetzt).\n' +
        '- Kommt innerhalb von **5 s** kein Stillstand: `nTimeouts` + 1, `doLimitExceeded` setzen, Messung beenden.\n' +
        '- Wird der Not-Halt vor dem Stillstand wieder entriegelt: Messung ungültig, `nInvalid` + 1.\n' +
        '- Ein dauerhaft gedrückter Not-Halt zählt nur **einmal**. Ein bereits beim Programmstart gedrückter Not-Halt ist keine Messung (keine Flanke).\n' +
        '- Steigende Flanke an `diClearStats` setzt alle Zähler, Maximalwert und `doLimitExceeded` zurück.\n\n' +
        'Simulation: Der Antrieb steht ca. 400 ms nach dem Not-Halt (`simSlowStop`: ca. 900 ms, `simNoStandstill`: nie).',
      hints: ['Ein `TON` mit `PT := T#5s` liefert über `ET` die Messzeit und über `Q` den Timeout. `TIME_TO_DINT(tonMeas.ET)` ergibt Millisekunden.', 'Rufe den TON nach dem Setzen von `bMeasuring` auf, damit die Messung im selben Zyklus startet.'],
      cycleMs: 10,
      io: [
        { name: 'diEStopReleased', type: 'BOOL', dir: 'in', label: 'Not-Halt entriegelt', widget: 'switch', init: true },
        { name: 'diClearStats', type: 'BOOL', dir: 'in', label: 'Statistik löschen', widget: 'button' },
        { name: 'simSlowStop', type: 'BOOL', dir: 'in', label: 'Simulation: langer Nachlauf', widget: 'switch' },
        { name: 'simNoStandstill', type: 'BOOL', dir: 'in', label: 'Simulation: kein Stillstand', widget: 'switch' },
        { name: 'diDriveStandstill', type: 'BOOL', dir: 'in', label: 'Antrieb: Stillstand (simuliert)', widget: 'led' },
        { name: 'nLastStopMs', type: 'DINT', dir: 'out', label: 'Letzte Stoppzeit [ms]', widget: 'value' },
        { name: 'nMaxStopMs', type: 'DINT', dir: 'out', label: 'Maximale Stoppzeit [ms]', widget: 'value' },
        { name: 'nTestCount', type: 'INT', dir: 'out', label: 'Gültige Messungen', widget: 'value' },
        { name: 'nTimeouts', type: 'INT', dir: 'out', label: 'Timeouts', widget: 'value' },
        { name: 'nInvalid', type: 'INT', dir: 'out', label: 'Ungültige Messungen', widget: 'value' },
        { name: 'doLimitExceeded', type: 'BOOL', dir: 'out', label: 'Grenzwert überschritten', widget: 'led' }
      ],
      plant: {
        var: 'VAR\n\tnCnt : INT;\n\tnLim : INT;\nEND_VAR\n',
        code: `IF NOT diEStopReleased THEN
	IF nCnt < 1000 THEN
		nCnt := nCnt + 1;
	END_IF;
ELSE
	nCnt := 0;
END_IF;
IF simSlowStop THEN
	nLim := 90;
ELSE
	nLim := 40;
END_IF;
diDriveStandstill := NOT diEStopReleased AND (nCnt >= nLim) AND NOT simNoStandstill;`
      },
      files: {
        main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Messung starten, beenden, auswerten *)\n\tftEStop(CLK := diEStopReleased);\n\tIF ftEStop.Q THEN\n\t\tnTestCount := nTestCount + 1;\n\tEND_IF;\nEND_PROGRAM\n',
        var: 'VAR\n\tftEStop : F_TRIG;\nEND_VAR\nVAR CONSTANT\n\tnLimitMs : DINT := 800;\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	ftEStop(CLK := diEStopReleased);
	rtClear(CLK := diClearStats);

	IF ftEStop.Q THEN
		bMeasuring := TRUE;
	END_IF;
	tonMeas(IN := bMeasuring, PT := T#5s);

	IF bMeasuring THEN
		IF diDriveStandstill THEN
			nLastStopMs := TIME_TO_DINT(tonMeas.ET);
			nTestCount := nTestCount + 1;
			nMaxStopMs := MAX(nMaxStopMs, nLastStopMs);
			IF nLastStopMs > nLimitMs THEN
				doLimitExceeded := TRUE;
			END_IF;
			bMeasuring := FALSE;
		ELSIF diEStopReleased THEN
			nInvalid := nInvalid + 1;
			bMeasuring := FALSE;
		ELSIF tonMeas.Q THEN
			nTimeouts := nTimeouts + 1;
			doLimitExceeded := TRUE;
			bMeasuring := FALSE;
		END_IF;
	END_IF;

	IF rtClear.Q THEN
		nLastStopMs := 0;
		nMaxStopMs := 0;
		nTestCount := 0;
		nTimeouts := 0;
		nInvalid := 0;
		doLimitExceeded := FALSE;
	END_IF;
END_PROGRAM
`,
        var: 'VAR\n\tftEStop : F_TRIG;\n\trtClear : R_TRIG;\n\ttonMeas : TON;\n\tbMeasuring : BOOL;\nEND_VAR\nVAR CONSTANT\n\tnLimitMs : DINT := 800;\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Normale Messung', steps: [
          { cycles: 2 }, { set: { diEStopReleased: false } }, { ms: 600 },
          { expect: 'nTestCount = 1 AND nLastStopMs >= 350 AND nLastStopMs <= 450 AND NOT doLimitExceeded', msg: 'Stoppzeit ca. 400 ms erwartet, eine gültige Messung.' }
        ]},
        { name: 'Langer Nachlauf überschreitet Grenzwert', steps: [
          { cycles: 2 }, { set: { diEStopReleased: false } }, { ms: 600 },
          { set: { diEStopReleased: true } }, { ms: 100 },
          { set: { simSlowStop: true, diEStopReleased: false } }, { ms: 1200 },
          { expect: 'nTestCount = 2 AND nMaxStopMs >= 850 AND nMaxStopMs <= 950 AND doLimitExceeded', msg: 'Zweite Messung ca. 900 ms: Maximum aktualisieren und Grenzwert melden.' },
          { set: { simSlowStop: false, diEStopReleased: true } }, { ms: 100 },
          { set: { diEStopReleased: false } }, { ms: 600 },
          { expect: 'nTestCount = 3 AND nLastStopMs < 500 AND nMaxStopMs >= 850 AND doLimitExceeded', msg: 'Grenzwertmeldung und Maximum bleiben nach einer schnellen Messung erhalten.' }
        ]},
        { name: 'Timeout ohne Stillstand', steps: [
          { cycles: 2 }, { set: { simNoStandstill: true, diEStopReleased: false } }, { ms: 5300 },
          { expect: 'nTimeouts = 1 AND nTestCount = 0 AND doLimitExceeded', msg: 'Nach 5 s ohne Stillstand: Timeout zählen und Grenzwert melden.' }
        ]},
        { name: 'Abgebrochene Messung', steps: [
          { cycles: 2 }, { set: { diEStopReleased: false } }, { ms: 100 },
          { set: { diEStopReleased: true } }, { cycles: 2 },
          { expect: 'nInvalid = 1 AND nTestCount = 0', msg: 'Entriegeln vor dem Stillstand macht die Messung ungültig.' }
        ]},
        { name: 'Dauerhaft gedrückt zählt einmal', steps: [
          { cycles: 2 }, { set: { diEStopReleased: false } }, { ms: 2000 },
          { expect: 'nTestCount = 1 AND nInvalid = 0 AND nTimeouts = 0', msg: 'Ein gehaltener Not-Halt ist genau eine Messung.' }
        ]},
        { name: 'Statistik löschen', steps: [
          { cycles: 2 }, { set: { simSlowStop: true, diEStopReleased: false } }, { ms: 1200 },
          { set: { diClearStats: true } }, { cycles: 2 },
          { expect: 'nTestCount = 0 AND nMaxStopMs = 0 AND NOT doLimitExceeded', msg: 'Löschen setzt Zähler, Maximum und Grenzwertmeldung zurück.' }
        ]}
      ]
    }
  ],
  proof: false
};

// ---------------------------------------------------------------------------
const m3 = {
  id: 'safety-5-projekt-aenderung',
  level: 5,
  kind: 'projekt',
  title: 'Praxisprojekt: Parametrierung, Freigabe und Änderungsmanagement',
  summary: 'Prüfsummen, Passwortebenen, Projektvergleich und Versionierung der SafeAPPLICATION – und eine CRC-Überwachung in der Standard-SPS.',
  minutes: 300,
  req: ['safety-5-validierung'],
  briefing: 'Jede Änderung an der Sicherheitsapplikation oder an sicherheitsrelevanten Parametern macht die Validierung ungültig, soweit die Änderung reicht. Deshalb braucht jede Maschine ein **Änderungsmanagement**: Wer darf ändern, wer gibt frei, wie wird nachgewiesen, welcher Stand läuft? ' +
    'Der SafeDESIGNER unterstützt das mit **Passwortebenen** (Entwicklung, Inbetriebnahme, Wartung), einem **Ereignisprotokoll**, **Prüfsummen (CRC)** im Projekt-Info-Dialog, dem **Projektvergleich** (Projekt › Projekte vergleichen…, auch online mit der Sicherheitssteuerung) und Regeln für **Versionskontrollsysteme**: Ein automatischer oder teilweiser Merge der SafeDESIGNER-Quellen ist nicht zulässig. Ein Modultausch (SafeNODE) muss bestätigt und die betroffenen Funktionen müssen validiert werden. ' +
    'Die Standard-SPS kann zusätzlich prüfen, ob die laufende SafeAPPLICATION der freigegebenen entspricht, und Änderungen protokollieren.' + HINWEIS,
  practice: 'Ein Servicetechniker hat nachts „nur kurz“ einen Parameter geändert. Am Morgen meldet die Maschine „Sicherheitsapplikation nicht freigegeben“ und läuft nur im Inbetriebnahmemodus – genau so soll es sein.',
  transfer: {
    tia: 'In TIA Portal übernehmen die F-Gesamtsignatur und die F-Änderungshistorie diese Rolle; der Abnahme-Ausdruck enthält die Signatur.',
    codesys: 'TwinSAFE-Projekte haben eine Projekt-CRC, die beim Download geprüft und im Standardprojekt gelesen werden kann.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Richte Passwortebenen und Rollen ein',
      guide: {
        intro: 'Zugriffsschutz ist die erste Maßnahme gegen unkontrollierte Änderungen.',
        steps: [
          'Lies in der B&R-Hilfe „Kennwortschutz für Projekte und Sicherheitssteuerung“: Projektkennwort (Ebenen Entwicklung, Inbetriebnahme, Wartung) und Steuerungskennwort.',
          'Lege fest, welche Rolle (Entwickler, Inbetriebnehmer, Instandhalter) welche Ebene erhält, und dokumentiere die Passwortverwaltung (Tresor, Vier-Augen-Prinzip).',
          'Prüfe, dass sicherheitsrelevante Änderungen im Ereignisprotokoll mit Windows-Benutzer und Berechtigungsebene erscheinen.',
          'Lege in AS6 unter `AccessAndSecurity › UserRoleSystem` fest, wer die SafeDOMAIN über mapp Safety bedienen darf (Rolle `BR_SafetyAdmin`).'
        ],
        done: 'Erledigt, wenn eine Rollen-/Ebenen-Matrix für dein Projekt vorliegt und von der verantwortlichen Person freigegeben ist.',
        tip: 'Ein Passwort, das „alle kennen“, ist kein Schutz. Personalisierte Zugänge machen das Ereignisprotokoll erst aussagekräftig.',
        link: { label: 'B&R Help: Kennwortschutz', url: brHelp('safety/mapp_safety/programming/safedesigner/intro/kennwortschutz.html') }
      }
    },
    {
      id: 'o2',
      title: 'Vergleiche Projektstände und lies die CRC',
      guide: {
        intro: 'Prüfsumme und Projektvergleich zeigen, ob und wo sich zwei Stände unterscheiden.',
        steps: [
          'Öffne im SafeDESIGNER **Projekt › Projekte vergleichen…** und vergleiche zwei Stände deines Projekts.',
          'Nutze **Projekt › Mit Projekt auf der Sicherheitssteuerung vergleichen**, um das geladene Projekt mit dem auf der SafeLOGIC zu vergleichen.',
          'Lies im Projekt-Info-Dialog die projektrelevanten CRCs und trage sie in dein Freigabeprotokoll ein.',
          'Beachte: Die Vergleichsergebnisse sind laut B&R „informell“ – maßgeblich sind die CRCs.',
          'Notiere, über welche Bibliothek (`SfDomain`) die Standard-Applikation Informationen der SafeDOMAIN, z. B. die CRC, lesen kann.'
        ],
        done: 'Erledigt, wenn dein Freigabeprotokoll die CRC des freigegebenen Stands enthält und du einen Unterschied per Projektvergleich nachweisen kannst.',
        tip: 'Ein Forum-Beitrag in der B&R Community zeigt, wie die CRC per SfDomainInfo gelesen wird – prüfe solche Hinweise immer gegen die offizielle Hilfe.',
        link: { label: 'B&R Help: Vergleichen von Projekten', url: brHelp('safety/mapp_safety/programming/safedesigner/intro/projekte_vergleichen.html') }
      }
    },
    {
      id: 'o3',
      title: 'Versioniere die SafeAPPLICATION richtig',
      guide: {
        intro: 'Git ist für Standardcode selbstverständlich – für SafeDESIGNER-Quellen gelten besondere Regeln.',
        steps: [
          'Lies „Einsatz von Versionskontrollsystemen“ in der B&R-Hilfe.',
          'Halte fest: Kein automatischer oder teilweiser Merge der SafeDESIGNER-Quellen; paralleles Ändern ist nicht unterstützt.',
          'Lege in `.gitattributes` die SafeDESIGNER-Dateien als binär bzw. „merge=binary“ fest und lege eine Regel an, dass nur eine Person gleichzeitig an der SafeAPPLICATION arbeitet (z. B. Lock oder Ticket).',
          'Achte darauf, dass `DLFiles` und `.bin`-Dateien nicht schreibgeschützt ausgecheckt werden.',
          'Tagge jeden freigegebenen Stand mit Version und CRC, z. B. `safety-v1.3.0-crc5A3C91E7`.'
        ],
        done: 'Erledigt, wenn dein Repository eine dokumentierte Regel für SafeDESIGNER-Dateien enthält und der freigegebene Stand getaggt ist.',
        tip: 'Ein Merge-Konflikt in einer Sicherheitsapplikation wird nie „aufgelöst“, sondern die Änderung wird auf dem freigegebenen Stand neu gemacht und neu validiert.',
        link: { label: 'B&R Help: Einsatz von Versionskontrollsystemen', url: brHelp('safety/mapp_safety/programming/safedesigner/intro/versionskontrollsysteme.html') }
      }
    },
    {
      id: 'o4',
      title: 'Überwache die Freigabe in der Standard-SPS',
      guide: {
        intro: 'Die Standard-SPS vergleicht die CRC der laufenden SafeAPPLICATION mit dem freigegebenen Wert und protokolliert Änderungen.',
        steps: [
          'Lege die freigegebene CRC als Konstante im Standardprogramm ab – sie ändert sich nur mit einer neuen Freigabe.',
          'Sperre den Automatikbetrieb funktional, wenn die CRC abweicht, und erlaube ihn nur mit Inbetriebnahme-Schlüsselschalter und deutlicher Warnung.',
          'Protokolliere jede neue CRC in einem Ringpuffer.',
          'Bearbeite die Projektübung, bis alle Tests bestehen, und reiche den Repository-Link als Nachweis ein.'
        ],
        done: 'Erledigt, wenn die Projektübung alle Tests besteht und der Nachweis eingereicht ist.',
        tip: 'Die CRC-Prüfung in der Standard-SPS ist eine organisatorische Hilfe, keine Sicherheitsfunktion – die Sicherheitsfunktionen bleiben auch bei abweichender CRC aktiv.'
      }
    }
  ],
  videos: [
    { id: 'Hzn19U5R_yI', title: '13849 Softema Teil 1 - Einführung', channel: 'MBT Maschinenbautage', lang: 'de', why: 'Einführung in die strukturierte Entwicklung und Dokumentation von Sicherheitssoftware.' },
    { id: 'BzTumXHCdZE', title: '13849 Softema Teil 2 - V-Modell', channel: 'MBT Maschinenbautage', lang: 'de', why: 'Zeigt, wie Änderungen im V-Modell zurück durch Verifikation und Validierung laufen.' }
  ],
  readings: [
    brReading('Kennwortschutz für Projekte und Sicherheitssteuerung', 'safety/mapp_safety/programming/safedesigner/intro/kennwortschutz.html', 'Passwortebenen und Ereignisprotokoll des SafeDESIGNER.', 15),
    brReading('Einsatz von Versionskontrollsystemen', 'safety/mapp_safety/programming/safedesigner/intro/versionskontrollsysteme.html', 'Verbindliche Regeln für SafeDESIGNER-Quellen in Git & Co.', 10),
    brReading('Tauschen eines SafeNodes', 'safety/safety_diagnostics/svc-scenarios/tauschen_von_modulen.html', 'Warum jeder Modultausch bestätigt und validiert werden muss.', 15)
  ],
  quiz: [
    { type: 'single', q: 'Ist ein automatischer Git-Merge von SafeDESIGNER-Quellen zulässig?', options: ['Ja, wenn keine Konflikte auftreten', 'Nein, automatischer oder teilweiser Merge ist nicht zulässig', 'Nur auf dem main-Branch', 'Nur mit Rebase'], correct: 1, explain: 'Laut B&R-Hilfe müssen Code-Verwaltungssysteme einen Merge der SafeDESIGNER-Sourcen explizit verhindern.' },
    { type: 'single', q: 'Was muss nach dem Tausch eines SafeNODEs geschehen?', options: ['Nichts, Parameter werden automatisch geladen', 'Der Tausch muss bestätigt und die betroffenen Sicherheitsfunktionen müssen validiert werden', 'Die SafeLOGIC muss ersetzt werden', 'Das Projekt muss neu kompiliert werden'], correct: 1, explain: 'Parameter werden automatisch geladen, aber vertauschte Stecker/Klemmen erkennt nur die Validierung.' },
    { type: 'multi', q: 'Welche Werkzeuge des SafeDESIGNER unterstützen das Änderungsmanagement?', options: ['Projektvergleich (auch online)', 'CRCs im Projekt-Info-Dialog', 'Ereignisprotokoll mit Benutzer und Berechtigungsebene', 'Automatischer Merge'], correct: [0, 1, 2], explain: 'Merge ist gerade nicht vorgesehen.' }
  ],
  exam: [
    { type: 'single', q: 'Welche Passwortebene des Projektkennworts erreichst du durch Abbrechen der Passwortabfrage?', options: ['Entwicklung', 'Inbetriebnahme', 'Wartung', 'Keine'], correct: 2, explain: 'Die Ebene Wartung erreicht man per ESC/Abbrechen – mit eingeschränkten Rechten.' },
    { type: 'single', q: 'Die CRC der laufenden SafeAPPLICATION weicht vom Freigabeprotokoll ab. Was ist die richtige Reaktion?', options: ['Weiterproduzieren, die Sicherheitsfunktionen sind ja aktiv', 'Ursache klären, Änderung bewerten, betroffene Funktionen validieren und neu freigeben', 'Das Freigabeprotokoll anpassen', 'Die CRC-Prüfung deaktivieren'], correct: 1, explain: 'Eine unbekannte Änderung macht die Validierung ungültig, bis sie bewertet und geprüft ist.' },
    { type: 'multi', q: 'Was gehört in einen Änderungsantrag für die Sicherheitsapplikation?', options: ['Beschreibung und Grund der Änderung', 'Betroffene Sicherheitsfunktionen und Auswirkungsanalyse', 'Geplante Validierungsschritte', 'Name des Lieblings-Editors'], correct: [0, 1, 2], explain: 'Dazu kommen Freigabe, neue CRC und Datum der Validierung.' },
    { type: 'single', q: 'Warum ist die CRC-Prüfung in der Standard-SPS keine Sicherheitsfunktion?', options: ['Weil die Standard-SPS dafür nicht qualifiziert ist und die Prüfung organisatorischen Zwecken dient', 'Weil CRC-Werte zu groß sind', 'Weil sie zu selten läuft', 'Weil sie verboten ist'], correct: 0, explain: 'Sie unterstützt das Änderungsmanagement; die Sicherheitsfunktionen selbst bleiben unverändert aktiv.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Freigabeüberwachung mit CRC-Logbuch',
      task: ST_HINWEIS +
        'Die Standard-SPS liest die CRC der laufenden SafeAPPLICATION (`diSafeCrc`, UDINT; in der Praxis z. B. über die Bibliothek SfDomain). Die freigegebene CRC steht als Konstante `udReleasedCrc := 16#5A3C91E7` im Programm.\n\n' +
        '- `diSafeCrc = 0` bedeutet „noch nicht gelesen“: `nDiag = 2`, kein Automatikbetrieb, kein Logbucheintrag.\n' +
        '- CRC = freigegeben: `nDiag = 0`.\n' +
        '- CRC ≠ freigegeben: `nDiag = 1` (Sicherheitsapplikation nicht freigegeben). Mit Inbetriebnahme-Schlüssel `diCommissioningKey`: `nDiag = 3` und `doLampWarn = TRUE`.\n' +
        '- `doAutoAllowed = diSafetyOK AND` (CRC freigegeben **oder** (Schlüssel gesteckt und CRC gelesen)).\n' +
        '- **Logbuch:** Jede neue, gültige CRC (≠ 0 und ≠ zuletzt gesehene) wird in den Ringpuffer `aCrcLog : ARRAY[0..4] OF UDINT` an Position `nLogIndex` geschrieben; danach `nLogIndex := (nLogIndex + 1) MOD 5` und `nLogCount` + 1. Dieselbe CRC mehrfach hintereinander erzeugt keinen neuen Eintrag.',
      hints: ['Merke dir die zuletzt gesehene CRC in `udLastCrc`.', 'Prüfe `diSafeCrc = 0` zuerst – das ist der „unbekannt“-Fall.'],
      cycleMs: 10,
      io: [
        { name: 'diSafeCrc', type: 'UDINT', dir: 'in', label: 'CRC der laufenden SafeAPPLICATION', widget: 'value' },
        { name: 'diSafetyOK', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Freigabe', widget: 'switch', init: true },
        { name: 'diCommissioningKey', type: 'BOOL', dir: 'in', label: 'Schlüsselschalter Inbetriebnahme', widget: 'switch' },
        { name: 'doAutoAllowed', type: 'BOOL', dir: 'out', label: 'Automatikbetrieb erlaubt', widget: 'led' },
        { name: 'doLampWarn', type: 'BOOL', dir: 'out', label: 'Warnleuchte „nicht freigegeben“', widget: 'led' },
        { name: 'nDiag', type: 'INT', dir: 'out', label: 'Diagnose', widget: 'value' },
        { name: 'nLogCount', type: 'INT', dir: 'out', label: 'Logbucheinträge', widget: 'value' }
      ],
      files: {
        main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Diagnose und Logbuch *)\n\tdoAutoAllowed := diSafetyOK;\nEND_PROGRAM\n',
        var: 'VAR\n\taCrcLog : ARRAY[0..4] OF UDINT;\n\tnLogIndex : INT;\n\tudLastCrc : UDINT;\nEND_VAR\nVAR CONSTANT\n\tudReleasedCrc : UDINT := 16#5A3C91E7;\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	IF diSafeCrc = 0 THEN
		bReleased := FALSE;
		bCrcKnown := FALSE;
		nDiag := 2;
	ELSE
		bCrcKnown := TRUE;
		(* Logbuch: nur neue CRC-Werte *)
		IF diSafeCrc <> udLastCrc THEN
			aCrcLog[nLogIndex] := diSafeCrc;
			nLogIndex := (nLogIndex + 1) MOD 5;
			nLogCount := nLogCount + 1;
			udLastCrc := diSafeCrc;
		END_IF;
		bReleased := (diSafeCrc = udReleasedCrc);
		IF bReleased THEN
			nDiag := 0;
		ELSIF diCommissioningKey THEN
			nDiag := 3;
		ELSE
			nDiag := 1;
		END_IF;
	END_IF;

	doLampWarn := (nDiag = 3);
	doAutoAllowed := diSafetyOK AND (bReleased OR (diCommissioningKey AND bCrcKnown));
END_PROGRAM
`,
        var: 'VAR\n\taCrcLog : ARRAY[0..4] OF UDINT;\n\tnLogIndex : INT;\n\tudLastCrc : UDINT;\n\tbReleased : BOOL;\n\tbCrcKnown : BOOL;\nEND_VAR\nVAR CONSTANT\n\tudReleasedCrc : UDINT := 16#5A3C91E7;\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Freigegebene CRC', steps: [
          { set: { diSafeCrc: 0x5A3C91E7 } }, { cycles: 2 },
          { expect: 'doAutoAllowed AND nDiag = 0 AND NOT doLampWarn', msg: 'Freigegebene CRC: Automatik erlaubt, Code 0.' },
          { set: { diSafetyOK: false } }, { cycles: 1 },
          { expect: 'NOT doAutoAllowed', msg: 'Ohne Freigabe der SafeLOGIC kein Automatikbetrieb.' }
        ]},
        { name: 'Abweichende CRC sperrt Automatik', steps: [
          { set: { diSafeCrc: 0x11111111 } }, { cycles: 2 },
          { expect: 'NOT doAutoAllowed AND nDiag = 1', msg: 'Nicht freigegebene CRC: Code 1, kein Automatikbetrieb.' }
        ]},
        { name: 'Inbetriebnahme-Schlüssel', steps: [
          { set: { diSafeCrc: 0x11111111, diCommissioningKey: true } }, { cycles: 2 },
          { expect: 'doAutoAllowed AND doLampWarn AND nDiag = 3', msg: 'Mit Schlüssel: Betrieb erlaubt, aber Warnung und Code 3.' },
          { set: { diSafeCrc: 0 } }, { cycles: 2 },
          { expect: 'NOT doAutoAllowed AND nDiag = 2', msg: 'CRC unbekannt: auch mit Schlüssel kein Betrieb.' }
        ]},
        { name: 'CRC 0 erzeugt keinen Logeintrag', steps: [
          { cycles: 3 },
          { expect: 'nDiag = 2 AND nLogCount = 0 AND NOT doAutoAllowed', msg: 'Ungelesene CRC: Code 2, kein Logeintrag.' }
        ]},
        { name: 'Logbuch protokolliert Änderungen', steps: [
          { set: { diSafeCrc: 0x5A3C91E7 } }, { cycles: 2 },
          { set: { diSafeCrc: 0x0BADC0DE } }, { cycles: 3 },
          { set: { diSafeCrc: 0x5A3C91E7 } }, { cycles: 2 },
          { expect: 'nLogCount = 3 AND aCrcLog[0] = 16#5A3C91E7 AND aCrcLog[1] = 16#0BADC0DE AND aCrcLog[2] = 16#5A3C91E7', msg: 'Jede neue CRC wird genau einmal eingetragen.' }
        ]},
        { name: 'Ringpuffer läuft über', steps: [
          { set: { diSafeCrc: 1 } }, { cycles: 1 },
          { set: { diSafeCrc: 2 } }, { cycles: 1 },
          { set: { diSafeCrc: 3 } }, { cycles: 1 },
          { set: { diSafeCrc: 4 } }, { cycles: 1 },
          { set: { diSafeCrc: 5 } }, { cycles: 1 },
          { set: { diSafeCrc: 6 } }, { cycles: 1 },
          { expect: 'nLogCount = 6 AND aCrcLog[0] = 6 AND aCrcLog[1] = 2 AND nLogIndex = 1', msg: 'Der sechste Eintrag überschreibt Position 0, nächster Index ist 1.' }
        ]}
      ]
    }
  ],
  proof: true,
  badge: 'Safety-Änderungsmanagement'
};

module.exports = [m1, m2, m3];
