'use strict';
const { R, V, pulse, help } = require('./_sources');

// ---------------------------------------------------------------------------
// Level 3 – Senior: Testkonzept, Inbetriebnahme beim Kunden & Änderungsmanagement, Abnahme
// ---------------------------------------------------------------------------

const fbHoursDecl = `FUNCTION_BLOCK FB_OperatingHours
	VAR_INPUT
		bRunning : BOOL;          (* Aggregat laeuft *)
		bServiceDone : BOOL;      (* Wartung durchgefuehrt: Wartungszaehler auf 0 *)
		nCycleMs : UDINT;         (* Zykluszeit der Task-Klasse in ms *)
		nServiceIntervalS : UDINT; (* Wartungsintervall in s, 0 = keine Wartungsueberwachung *)
	END_VAR
	VAR_OUTPUT
		nTotalSeconds : UDINT;    (* Gesamtlaufzeit, wird nie zurueckgesetzt *)
		nSinceServiceS : UDINT;   (* Laufzeit seit letzter Wartung *)
		nStarts : UDINT;          (* Anzahl Einschaltvorgaenge *)
		bServiceDue : BOOL;
		rTotalHours : REAL;
	END_VAR
	VAR
		nMsAcc : UDINT;           (* angesammelte Millisekunden < 1000 *)
		rtRun : R_TRIG;
	END_VAR
`;

const exHours = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Betriebsstundenzähler als testbarer Baustein',
  task: [
    'Für die Wartungsplanung braucht jede Pumpe einen **Betriebsstundenzähler**. Implementiere den Funktionsbaustein `FB_OperatingHours` so, dass er die folgenden Testfälle (aus dem Testkonzept, Ebene Unit-Test) besteht. Das Programm, das den Baustein aufruft, ist bereits fertig. In AS6 lägen Deklaration (`.fun`) und Implementierung (`.st`) in einer eigenen Bibliothek – hier steht beides in `Main.st`.',
    '',
    '**Spezifikation:**',
    '- Läuft `bRunning`, wird pro Aufruf `nCycleMs` auf einen ms-Akku addiert. Jede volle Sekunde erhöht `nTotalSeconds` und `nSinceServiceS` um 1 – **der Rest bleibt erhalten** (keine Rundungsverluste bei kurzen Laufzeiten).',
    '- `nStarts` zählt steigende Flanken von `bRunning`.',
    '- `bServiceDone` setzt nur `nSinceServiceS` auf 0, `nTotalSeconds` bleibt.',
    '- `bServiceDue` = `nServiceIntervalS > 0 AND nSinceServiceS >= nServiceIntervalS` (Intervall 0 = Überwachung aus).',
    '- `rTotalHours` = `nTotalSeconds / 3600.0`.',
    '',
    'Für die Simulation: Zykluszeit 100 ms, Wartungsintervall 5 s.'
  ].join('\n'),
  hints: [
    'Akku: `nMsAcc := nMsAcc + nCycleMs; WHILE nMsAcc >= 1000 DO nMsAcc := nMsAcc - 1000; … END_WHILE`.',
    'Umwandlung für die Stunden: `UDINT_TO_REAL(nTotalSeconds) / 3600.0`.',
    'In einer echten Anlage gehören `nTotalSeconds` und `nMsAcc` in remanente Variablen (RETAIN bzw. PERMANENT), damit sie einen Spannungsausfall überstehen.'
  ],
  cycleMs: 100,
  io: [
    { name: 'diRun', type: 'BOOL', dir: 'in', label: 'Pumpe EIN', widget: 'switch' },
    { name: 'diServiceDone', type: 'BOOL', dir: 'in', label: 'Wartung quittieren', widget: 'button' },
    { name: 'nServiceInterval', type: 'UDINT', dir: 'in', label: 'Wartungsintervall [s]', widget: 'slider', min: 0, max: 20, init: 5 },
    { name: 'doPump', type: 'BOOL', dir: 'out', label: 'Pumpe läuft', widget: 'led' },
    { name: 'doServiceDue', type: 'BOOL', dir: 'out', label: 'Wartung fällig', widget: 'led' },
    { name: 'rHours', type: 'REAL', dir: 'out', label: 'Betriebsstunden', widget: 'value', unit: 'h' }
  ],
  scene: { type: 'motor', bind: { run: 'doPump' } },
  files: {
    main: fbHoursDecl + '\n\t(* TODO: Implementierung *)\n\nEND_FUNCTION_BLOCK\n\nPROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tdoPump := diRun;\n\tfbHours(bRunning := doPump, bServiceDone := diServiceDone, nCycleMs := 100, nServiceIntervalS := nServiceInterval);\n\tdoServiceDue := fbHours.bServiceDue;\n\trHours := fbHours.rTotalHours;\nEND_PROGRAM\n',
    var: 'VAR\n\tfbHours : FB_OperatingHours;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: fbHoursDecl + `
	rtRun(CLK := bRunning);
	IF rtRun.Q THEN
		nStarts := nStarts + 1;
	END_IF

	IF bRunning THEN
		nMsAcc := nMsAcc + nCycleMs;
		WHILE nMsAcc >= 1000 DO
			nMsAcc := nMsAcc - 1000;
			nTotalSeconds := nTotalSeconds + 1;
			nSinceServiceS := nSinceServiceS + 1;
		END_WHILE
	END_IF

	IF bServiceDone THEN
		nSinceServiceS := 0;
	END_IF

	bServiceDue := (nServiceIntervalS > 0) AND (nSinceServiceS >= nServiceIntervalS);
	rTotalHours := UDINT_TO_REAL(nTotalSeconds) / 3600.0;
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	doPump := diRun;
	fbHours(bRunning := doPump, bServiceDone := diServiceDone, nCycleMs := 100, nServiceIntervalS := nServiceInterval);
	doServiceDue := fbHours.bServiceDue;
	rHours := fbHours.rTotalHours;
END_PROGRAM
`,
    var: 'VAR\n\tfbHours : FB_OperatingHours;\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'TC-01 Laufzeit wird gezählt', steps: [
      { set: { diRun: true } }, { ms: 3000 },
      { expect: 'fbHours.nTotalSeconds >= 2 AND fbHours.nTotalSeconds <= 4', msg: 'Nach 3 s Laufzeit muss nTotalSeconds ≈ 3 sein.' }
    ] },
    { name: 'TC-02 Stillstand zählt nicht', steps: [
      { ms: 2000 }, { expect: 'fbHours.nTotalSeconds = 0 AND fbHours.nStarts = 0', msg: 'Ohne bRunning darf nichts gezählt werden.' }
    ] },
    { name: 'TC-03 Restzeit geht nicht verloren', steps: [
      { set: { diRun: true } }, { ms: 1500 }, { set: { diRun: false } }, { ms: 500 },
      { set: { diRun: true } }, { ms: 1500 }, { set: { diRun: false } }, { cycles: 1 },
      { expect: 'fbHours.nTotalSeconds = 3', msg: '2 × 1,5 s müssen 3 s ergeben – der ms-Rest darf nicht verworfen werden.' }
    ] },
    { name: 'TC-04 Einschaltvorgänge', steps: [
      ...pulse('diRun', 3, 3, 3), { expect: 'fbHours.nStarts = 3', msg: 'Drei Einschaltvorgänge erwartet.' }
    ] },
    { name: 'TC-05 Wartung fällig und quittieren', steps: [
      { set: { diRun: true } }, { ms: 6000 },
      { expect: 'doServiceDue', msg: 'Nach > 5 s Laufzeit muss die Wartung fällig sein.' },
      ...pulse('diServiceDone', 1),
      { expect: 'NOT doServiceDue AND fbHours.nTotalSeconds >= 5', msg: 'Quittieren setzt nur den Wartungszähler zurück, nicht die Gesamtlaufzeit.' }
    ] },
    { name: 'TC-06 Intervall 0 = Überwachung aus', steps: [
      { set: { nServiceInterval: 0, diRun: true } }, { ms: 3000 },
      { expect: 'NOT doServiceDue AND fbHours.nTotalSeconds > 0', msg: 'Mit Intervall 0 darf nie eine Wartung gemeldet werden.' }
    ] }
  ]
};

const evTyp = 'TYPE\n\tEvent_typ : STRUCT\n\t\tnCode : UINT;    (* Ereigniscode *)\n\t\tnTimeMs : UDINT; (* Zeitstempel in ms seit Start *)\n\tEND_STRUCT;\nEND_TYPE\n';
const evVar = 'VAR\n\taBuffer : ARRAY[0..4] OF Event_typ; (* Ringpuffer *)\n\taView : ARRAY[0..4] OF Event_typ;   (* Sicht: [0] = neuestes Ereignis *)\n\tnWriteIdx : INT;     (* naechste Schreibposition *)\n\tnEntries : INT;      (* gueltige Eintraege, max. 5 *)\n\tnOverwritten : UDINT; (* ueberschriebene Eintraege *)\n\tnTimeMs : UDINT;\n\trtFault1 : R_TRIG;\n\trtFault2 : R_TRIG;\n\trtDoor : R_TRIG;\nEND_VAR\n\nVAR CONSTANT\n\tBUF_SIZE : INT := 5;\n\tCYCLE_MS : UDINT := 10;\n\tEV_FAULT1 : UINT := 101;\n\tEV_FAULT2 : UINT := 102;\n\tEV_DOOR : UINT := 201;\nEND_VAR\n';

const exRing = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Ereignisprotokoll als Ringpuffer',
  task: [
    'Beim Kunden tritt sporadisch ein Stillstand auf. Damit du beim nächsten Besuch weißt, **was in welcher Reihenfolge** passiert ist, baust du ein Ereignisprotokoll in die Steuerung ein.',
    '',
    '**Anforderungen:**',
    '- `nTimeMs` zählt pro Zyklus um `CYCLE_MS` (10 ms) hoch.',
    '- Steigende Flanken erzeugen Ereignisse: `diFault1` → 101, `diFault2` → 102, `diDoorOpen` → 201. Treten mehrere Flanken im **selben Zyklus** auf, werden alle in der Reihenfolge 101, 102, 201 eingetragen.',
    '- Jedes Ereignis wird mit Code und Zeitstempel in den Ringpuffer `aBuffer[0..4]` an `nWriteIdx` geschrieben, danach `nWriteIdx := (nWriteIdx + 1) MOD BUF_SIZE`.',
    '- `nEntries` zählt bis maximal 5. Ist der Puffer voll, wird der älteste Eintrag überschrieben und `nOverwritten` erhöht.',
    '- `aView[0..4]` zeigt die Einträge **neuestes zuerst**; nicht belegte Plätze haben Code 0 und Zeit 0. Die Sicht wird jeden Zyklus berechnet.',
    '- `diClear` löscht Puffer, Sicht und Zähler.',
    '',
    'Hinweis: In AS6 würdest du solche Ereignisse zusätzlich mit der Bibliothek **ArEventLog** in ein Logbuch der Steuerung schreiben, damit sie im Logger erscheinen.'
  ].join('\n'),
  hints: [
    'Sammle die neuen Ereigniscodes eines Zyklus erst in einem kleinen Array `aNew[0..2]` mit Zähler `nNew` und füge sie dann in einer Schleife ein.',
    'Index des k-neuesten Eintrags: `(nWriteIdx + BUF_SIZE - 1 - k) MOD BUF_SIZE`.',
    'Strukturelemente einzeln zuweisen: `aView[k].nCode := aBuffer[nIdx].nCode;`.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diFault1', type: 'BOOL', dir: 'in', label: 'Störung 1: Motorschutz', widget: 'button' },
    { name: 'diFault2', type: 'BOOL', dir: 'in', label: 'Störung 2: Druck zu niedrig', widget: 'button' },
    { name: 'diDoorOpen', type: 'BOOL', dir: 'in', label: 'Schutztür geöffnet', widget: 'button' },
    { name: 'diClear', type: 'BOOL', dir: 'in', label: 'Protokoll löschen', widget: 'button' },
    { name: 'nLastCode', type: 'UINT', dir: 'out', label: 'Letztes Ereignis', widget: 'value' }
  ],
  files: {
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tnTimeMs := nTimeMs + CYCLE_MS;\n\trtFault1(CLK := diFault1);\n\trtFault2(CLK := diFault2);\n\trtDoor(CLK := diDoorOpen);\n\n\t(* TODO: Ereignisse in den Ringpuffer schreiben, Sicht berechnen, Loeschen *)\n\n\tnLastCode := aView[0].nCode;\nEND_PROGRAM\n',
    var: evVar,
    typ: evTyp
  },
  solution: {
    main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	nTimeMs := nTimeMs + CYCLE_MS;
	rtFault1(CLK := diFault1);
	rtFault2(CLK := diFault2);
	rtDoor(CLK := diDoorOpen);

	(* Neue Ereignisse dieses Zyklus sammeln (feste Reihenfolge) *)
	nNew := 0;
	IF rtFault1.Q THEN aNew[nNew] := EV_FAULT1; nNew := nNew + 1; END_IF
	IF rtFault2.Q THEN aNew[nNew] := EV_FAULT2; nNew := nNew + 1; END_IF
	IF rtDoor.Q THEN aNew[nNew] := EV_DOOR; nNew := nNew + 1; END_IF

	IF diClear THEN
		FOR k := 0 TO BUF_SIZE - 1 DO
			aBuffer[k].nCode := 0;
			aBuffer[k].nTimeMs := 0;
		END_FOR
		nWriteIdx := 0;
		nEntries := 0;
		nOverwritten := 0;
	ELSE
		FOR k := 0 TO nNew - 1 DO
			IF nEntries >= BUF_SIZE THEN
				nOverwritten := nOverwritten + 1; (* aeltester Eintrag wird ueberschrieben *)
			ELSE
				nEntries := nEntries + 1;
			END_IF
			aBuffer[nWriteIdx].nCode := aNew[k];
			aBuffer[nWriteIdx].nTimeMs := nTimeMs;
			nWriteIdx := (nWriteIdx + 1) MOD BUF_SIZE;
		END_FOR
	END_IF

	(* Sicht: neuestes Ereignis zuerst *)
	FOR k := 0 TO BUF_SIZE - 1 DO
		IF k < nEntries THEN
			nIdx := (nWriteIdx + BUF_SIZE - 1 - k) MOD BUF_SIZE;
			aView[k].nCode := aBuffer[nIdx].nCode;
			aView[k].nTimeMs := aBuffer[nIdx].nTimeMs;
		ELSE
			aView[k].nCode := 0;
			aView[k].nTimeMs := 0;
		END_IF
	END_FOR

	nLastCode := aView[0].nCode;
END_PROGRAM
`,
    var: evVar + '\nVAR\n\taNew : ARRAY[0..2] OF UINT;\n\tnNew : INT;\n\tk : INT;\n\tnIdx : INT;\nEND_VAR\n',
    typ: evTyp
  },
  tests: [
    { name: 'Ein Ereignis wird eingetragen', steps: [
      ...pulse('diFault1', 1),
      { expect: 'nEntries = 1 AND aView[0].nCode = 101 AND aView[0].nTimeMs > 0 AND aView[1].nCode = 0', msg: 'Nach einer Störung 1 muss genau ein Eintrag 101 mit Zeitstempel vorhanden sein.' }
    ] },
    { name: 'Reihenfolge neuestes zuerst', steps: [
      ...pulse('diFault1', 1), { ms: 50 }, ...pulse('diDoorOpen', 1), { ms: 50 }, ...pulse('diFault2', 1),
      { expect: 'aView[0].nCode = 102 AND aView[1].nCode = 201 AND aView[2].nCode = 101', msg: 'Erwartete Sicht: 102, 201, 101.' },
      { expect: 'aView[0].nTimeMs > aView[1].nTimeMs AND aView[1].nTimeMs > aView[2].nTimeMs', msg: 'Zeitstempel müssen vom neuesten zum ältesten abnehmen.' }
    ] },
    { name: 'Überlauf: ältester Eintrag wird überschrieben', steps: [
      ...pulse('diFault1', 1), ...pulse('diFault2', 1), ...pulse('diDoorOpen', 1), ...pulse('diFault1', 1),
      ...pulse('diFault2', 1), ...pulse('diDoorOpen', 1), ...pulse('diFault1', 1),
      { expect: 'nEntries = 5 AND nOverwritten = 2', msg: 'Nach 7 Ereignissen: 5 Einträge, 2 überschrieben.' },
      { expect: 'aView[0].nCode = 101 AND aView[1].nCode = 201 AND aView[4].nCode = 201', msg: 'Sicht nach Überlauf falsch: neuestes 101, ältestes (3. Ereignis) 201.' }
    ] },
    { name: 'Gleichzeitige Ereignisse gehen nicht verloren', steps: [
      { set: { diFault1: true, diFault2: true } }, { cycles: 1 }, { set: { diFault1: false, diFault2: false } }, { cycles: 1 },
      { expect: 'nEntries = 2 AND aView[0].nCode = 102 AND aView[1].nCode = 101', msg: 'Beide Störungen im selben Zyklus müssen eingetragen werden (101 vor 102).' }
    ] },
    { name: 'Protokoll löschen', steps: [
      ...pulse('diFault1', 1), ...pulse('diDoorOpen', 1), ...pulse('diClear', 1),
      { expect: 'nEntries = 0 AND aView[0].nCode = 0 AND nOverwritten = 0', msg: 'diClear muss das Protokoll vollständig löschen.' },
      ...pulse('diFault2', 1), { expect: 'nEntries = 1 AND aView[0].nCode = 102', msg: 'Nach dem Löschen muss neu protokolliert werden.' }
    ] }
  ]
};

const stationTyp = 'TYPE\n\tStationState_enum :\n\t\t(\n\t\tST_IDLE,\n\t\tST_RUN,\n\t\tST_ERROR\n\t\t);\nEND_TYPE\n';
const stationVarStart = 'VAR\n\teState : StationState_enum;\n\tnErrorId : UINT;   (* 0 = kein Fehler, 1 = Stau, 2 = Teilemangel, 3 = Not-Halt-Kreis *)\n\tnPartCount : UDINT;\nEND_VAR\n';

const exStation = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Abnahmefähige Förderstation mit Zustandsautomat',
  task: [
    'Implementiere die Steuerung einer Förderstation so, dass sie die **FAT-Testfälle** besteht. Das Pflichtenheft fordert:',
    '',
    '| ID | Anforderung |',
    '|---|---|',
    '| REQ-01 | Zustände `ST_IDLE`, `ST_RUN`, `ST_ERROR` (Enum in `Types.typ`), Startzustand `ST_IDLE`. |',
    '| REQ-02 | Steigende Flanke `diStart` in `ST_IDLE` startet, wenn `diStop` (Öffner, TRUE = nicht betätigt) und `diEStopOk` TRUE sind. |',
    '| REQ-03 | `diStop` = FALSE in `ST_RUN` → `ST_IDLE`. |',
    '| REQ-04 | **Stau:** Lichtschranke `diSensor` länger als 2 s belegt in `ST_RUN` → `ST_ERROR`, `nErrorId = 1`. |',
    '| REQ-05 | **Teilemangel:** in `ST_RUN` länger als 5 s kein Teil an der Lichtschranke → `ST_ERROR`, `nErrorId = 2`. |',
    '| REQ-06 | `diEStopOk` = FALSE (Rückmeldung des Not-Halt-Kreises von der Sicherheitssteuerung) → in jedem Zustand `ST_ERROR`, `nErrorId = 3`. |',
    '| REQ-07 | Quittieren (steigende Flanke `diAck`) in `ST_ERROR` nur, wenn `diEStopOk` TRUE und `diSensor` frei → `ST_IDLE`, `nErrorId = 0`. |',
    '| REQ-08 | `nPartCount` zählt in `ST_RUN` jedes Teil (fallende Flanke `diSensor`). |',
    '| REQ-09 | `doMotor` nur in `ST_RUN`, `doFault` nur in `ST_ERROR` – jeweils genau einmal geschrieben. |',
    '',
    'Wichtig: Die eigentliche Sicherheitsfunktion (Not-Halt) realisiert die Sicherheitssteuerung. Dein Programm wertet nur deren Rückmeldung aus.'
  ].join('\n'),
  hints: [
    'Rufe alle Timer und Flankenbausteine **vor** der CASE-Anweisung jeden Zyklus auf, z. B. `tonJam(IN := (eState = ST_RUN) AND diSensor, PT := T#2s);`.',
    'Die Not-Halt-Überwachung (REQ-06) steht vor der CASE-Anweisung, damit sie in jedem Zustand wirkt.',
    'Fallende Flanke ohne F_TRIG: `bSensorOld AND NOT diSensor`, danach `bSensorOld := diSensor;`.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Taster S1 Start', widget: 'button' },
    { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Taster S2 Stopp (Öffner)', widget: 'switch', init: true },
    { name: 'diEStopOk', type: 'BOOL', dir: 'in', label: 'Not-Halt-Kreis OK (von Sicherheitssteuerung)', widget: 'switch', init: true },
    { name: 'diSensor', type: 'BOOL', dir: 'in', label: 'Lichtschranke B1 Bandende', widget: 'switch' },
    { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Taster S3 Quittieren', widget: 'button' },
    { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Schütz K1 Bandmotor', widget: 'led' },
    { name: 'doFault', type: 'BOOL', dir: 'out', label: 'Meldeleuchte H2 Störung', widget: 'led' }
  ],
  scene: { type: 'conveyor', bind: { motor: 'doMotor', sensor: 'diSensor' } },
  files: {
    main: 'PROGRAM _INIT\n\teState := ST_IDLE;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Timer und Flanken, Not-Halt-Ueberwachung, Zustandsautomat, Ausgaenge *)\n\tCASE eState OF\n\tST_IDLE:\n\t\t;\n\tST_RUN:\n\t\t;\n\tST_ERROR:\n\t\t;\n\tEND_CASE\nEND_PROGRAM\n',
    var: stationVarStart,
    typ: stationTyp
  },
  solution: {
    main: `(* Foerderstation: Zustandsautomat mit Stau-, Teilemangel- und Not-Halt-Kreis-Ueberwachung *)
PROGRAM _INIT
	eState := ST_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	(* Bausteine jeden Zyklus aufrufen, damit Timer sauber zuruecksetzen *)
	rtStart(CLK := diStart);
	rtAck(CLK := diAck);
	bPartPassed := bSensorOld AND NOT diSensor;
	bSensorOld := diSensor;
	tonJam(IN := (eState = ST_RUN) AND diSensor, PT := JAM_TIME);
	tonNoParts(IN := (eState = ST_RUN) AND NOT diSensor, PT := NO_PARTS_TIME);

	(* REQ-06: Rueckmeldung Not-Halt-Kreis wirkt in jedem Zustand *)
	IF (NOT diEStopOk) AND (eState <> ST_ERROR) THEN
		eState := ST_ERROR;
		nErrorId := ERR_ESTOP;
	END_IF

	CASE eState OF
	ST_IDLE:
		IF rtStart.Q AND diStop AND diEStopOk THEN
			eState := ST_RUN;
		END_IF

	ST_RUN:
		IF bPartPassed THEN
			nPartCount := nPartCount + 1;
		END_IF
		IF NOT diStop THEN
			eState := ST_IDLE;
		ELSIF tonJam.Q THEN
			eState := ST_ERROR;
			nErrorId := ERR_JAM;
		ELSIF tonNoParts.Q THEN
			eState := ST_ERROR;
			nErrorId := ERR_NO_PARTS;
		END_IF

	ST_ERROR:
		IF rtAck.Q AND diEStopOk AND NOT diSensor THEN
			eState := ST_IDLE;
			nErrorId := 0;
		END_IF
	END_CASE

	(* REQ-09: Ausgaenge genau einmal *)
	doMotor := (eState = ST_RUN);
	doFault := (eState = ST_ERROR);
END_PROGRAM
`,
    var: stationVarStart + '\nVAR\n\trtStart : R_TRIG;\n\trtAck : R_TRIG;\n\tbSensorOld : BOOL;\n\tbPartPassed : BOOL;\n\ttonJam : TON;\n\ttonNoParts : TON;\nEND_VAR\n\nVAR CONSTANT\n\tJAM_TIME : TIME := T#2s;\n\tNO_PARTS_TIME : TIME := T#5s;\n\tERR_JAM : UINT := 1;\n\tERR_NO_PARTS : UINT := 2;\n\tERR_ESTOP : UINT := 3;\nEND_VAR\n',
    typ: stationTyp
  },
  tests: [
    { name: 'FAT-01 Start und Stopp', steps: [
      ...pulse('diStart', 1),
      { expect: 'eState = ST_RUN AND doMotor AND NOT doFault', msg: 'REQ-02: Start-Taster muss die Station starten.' },
      { set: { diStop: false } }, { cycles: 2 },
      { expect: 'eState = ST_IDLE AND NOT doMotor', msg: 'REQ-03: Stopp (Öffner) muss die Station anhalten.' },
      ...pulse('diStart', 1),
      { expect: 'eState = ST_IDLE', msg: 'REQ-02: Bei betätigtem Stopp darf nicht gestartet werden.' }
    ] },
    { name: 'FAT-02 Stauerkennung nach 2 s', steps: [
      ...pulse('diStart', 1), { set: { diSensor: true } }, { ms: 1500 },
      { expect: 'eState = ST_RUN', msg: 'REQ-04: Nach 1,5 s Belegung noch kein Stau.' },
      { until: 'eState = ST_ERROR', maxMs: 1000, msg: 'REQ-04: Nach 2 s Belegung muss Stau erkannt werden.' },
      { expect: 'nErrorId = 1 AND NOT doMotor AND doFault', msg: 'REQ-04/09: Stau → nErrorId 1, Motor aus, Störleuchte an.' }
    ] },
    { name: 'FAT-03 Quittieren nur bei beseitigter Ursache', steps: [
      ...pulse('diStart', 1), { set: { diSensor: true } }, { ms: 2500 }, ...pulse('diAck', 1),
      { expect: 'eState = ST_ERROR', msg: 'REQ-07: Quittieren bei belegter Lichtschranke darf nicht wirken.' },
      { set: { diSensor: false } }, ...pulse('diAck', 1),
      { expect: 'eState = ST_IDLE AND nErrorId = 0 AND NOT doFault', msg: 'REQ-07: Nach Beseitigen muss Quittieren nach ST_IDLE führen.' }
    ] },
    { name: 'FAT-04 Not-Halt-Kreis', steps: [
      ...pulse('diStart', 1), { set: { diEStopOk: false } }, { cycles: 1 },
      { expect: 'eState = ST_ERROR AND nErrorId = 3 AND NOT doMotor', msg: 'REQ-06: Not-Halt-Kreis offen → sofort Fehler 3, Motor aus.' },
      ...pulse('diAck', 1), ...pulse('diStart', 1),
      { expect: 'eState = ST_ERROR AND NOT doMotor', msg: 'REQ-07: Ohne Not-Halt-Kreis OK kein Quittieren/Start.' },
      { set: { diEStopOk: true } }, ...pulse('diAck', 1), ...pulse('diStart', 1),
      { expect: 'eState = ST_RUN', msg: 'Nach Wiederherstellen, Quittieren und Start muss die Station laufen.' }
    ] },
    { name: 'FAT-05 Teile zählen und Teilemangel', steps: [
      ...pulse('diStart', 1), ...pulse('diSensor', 3, 20, 20),
      { expect: 'nPartCount = 3 AND eState = ST_RUN', msg: 'REQ-08: Drei Teile müssen gezählt werden.' },
      { until: 'eState = ST_ERROR', maxMs: 6000, msg: 'REQ-05: Nach 5 s ohne Teil muss Teilemangel gemeldet werden.' },
      { expect: 'nErrorId = 2', msg: 'REQ-05: Teilemangel ist Fehler 2.' }
    ] },
    { name: 'FAT-06 Kein Teilemangel bei regelmäßigem Teilefluss', steps: [
      ...pulse('diStart', 1),
      ...[1, 2, 3].flatMap(() => [{ ms: 3500 }, { set: { diSensor: true } }, { ms: 300 }, { set: { diSensor: false } }]), { cycles: 2 },
      { expect: 'eState = ST_RUN AND nPartCount = 3', msg: 'Teile alle 3,5 s dürfen keinen Teilemangel auslösen – wird der Timer bei jedem Teil zurückgesetzt?' }
    ] }
  ]
};

module.exports = [
  {
    id: 'praxis-3-testkonzept', level: 3, kind: 'lektion',
    title: 'Testkonzept: Unit, Integration, FAT und SAT',
    summary: 'Testebenen planen, Testfälle aus Anforderungen ableiten und Bausteine testbar entwerfen.',
    minutes: 180, req: ['praxis-2-code-review'],
    briefing: 'Ab der Senior-Stufe nimmst du Maschinen selbstständig in Betrieb – und musst vorher belegen können, dass die Software funktioniert. Ein Testkonzept legt fest, was auf welcher Ebene getestet wird: einzelne Bausteine im Unit-Test, das Zusammenspiel im Integrationstest, die gesamte Maschine in der Werksabnahme (FAT) und vor Ort beim Kunden (SAT). Die B&R-Programmierrichtlinie nennt Unit-, Integrations-, System- und Bedienbarkeitstests; für Automation Studio gibt es ein Unit-Test-Framework. Du lernst, Testfälle aus Anforderungen und Grenzwerten abzuleiten und schreibst einen Baustein, der gegen eine Testfall-Liste entwickelt wird.',
    practice: 'Jeder Fehler, den ein Unit-Test im Büro findet, kostet Minuten. Derselbe Fehler bei der SAT beim Kunden kostet Tage, Reisekosten und Vertrauen.',
    transfer: {
      tia: 'Siemens bietet mit PLCSIM (Advanced) und dem Test Suite Advanced Werkzeuge für Unit- und Systemtests von S7-Programmen.',
      codesys: 'CODESYS hat den Test Manager, für TwinCAT gibt es das freie Framework TcUnit – das Prinzip „Testfall = Vorbedingung, Aktion, erwartetes Ergebnis“ ist überall gleich.'
    },
    objectives: [
      {
        id: 'o1', title: 'Ordne Testebenen und Verantwortlichkeiten zu',
        guide: {
          intro: 'Jede Testebene prüft etwas anderes und wird von anderen Personen durchgeführt.',
          steps: [
            '**Unit-Test:** ein Baustein isoliert (z. B. `FB_OperatingHours`), durch den Entwickler, automatisiert, bei jeder Änderung.',
            '**Integrationstest:** mehrere Bausteine/Tasks zusammen, z. B. mit Anlagen-Simulation (ArSim + Simulationsprogramm).',
            '**FAT (Factory Acceptance Test):** komplette Maschine im eigenen Werk, mit Kunde, gegen das Pflichtenheft.',
            '**SAT (Site Acceptance Test):** beim Kunden, im realen Umfeld mit echten Produkten und Schnittstellen.',
            'Lege für jede Ebene fest: Testumgebung, Testdaten, Verantwortlicher, Abbruch- und Erfolgskriterien.'
          ],
          done: 'Erledigt, wenn du für ein Projekt eine Tabelle mit den vier Testebenen, Umgebung und Verantwortlichem erstellt hast.',
          tip: 'Was in der FAT nicht getestet werden kann (echte Produkte, Leitsystem), muss explizit für die SAT vorgemerkt werden.',
          link: { label: 'B&R Help: Testen (Programmierrichtlinie)', url: help('programming/guidelines/codingguideline_tests.html') }
        }
      },
      {
        id: 'o2', title: 'Leite Testfälle aus Anforderungen und Grenzwerten ab',
        guide: {
          intro: '„Teste an den natürlichen Grenzen“ – Normalfall, Grenzfall und Fehlerfall gehören zu jeder Anforderung.',
          steps: [
            'Nimm eine Anforderung, z. B. „Wartung fällig nach 5 s Laufzeit, Intervall 0 = aus“.',
            'Normalfall: 6 s Laufzeit → fällig. Grenzfall: genau 5 s, 4,9 s, Intervall 0. Fehlerfall: Quittieren während Laufzeit.',
            'Schreibe jeden Testfall mit ID, Vorbedingung, Aktion, erwartetem Ergebnis.',
            'Prüfe Äquivalenzklassen: Was verhält sich gleich? Ein Test pro Klasse reicht.',
            'Verknüpfe Testfall-ID und Anforderungs-ID (Rückverfolgbarkeit).'
          ],
          done: 'Erledigt, wenn du für `FB_OperatingHours` mindestens sechs Testfälle mit ID und erwartetem Ergebnis aufgeschrieben hast.',
          tip: 'Rundungsfehler und Zählerüberläufe sind klassische Grenzfälle. Frage dich immer: Was passiert nach 10 Jahren Dauerbetrieb?'
        }
      },
      {
        id: 'o3', title: 'Entwirf Bausteine testbar',
        guide: {
          intro: 'Testbar ist ein Baustein, wenn alle Abhängigkeiten über Eingänge kommen und alle Ergebnisse über Ausgänge sichtbar sind.',
          steps: [
            'Keine globalen Variablen im FB lesen – Werte als `VAR_INPUT` übergeben (hier auch die Zykluszeit).',
            'Ergebnisse als `VAR_OUTPUT` herausgeben, damit ein Test sie prüfen kann.',
            'Zeitabhängiges Verhalten über eine übergebene Zeitbasis steuern, damit ein Test Zeit simulieren kann.',
            'Implementiere den FB in der Übung gegen die Testfälle TC-01 bis TC-06.',
            'In AS6: Lege für Bibliotheksbausteine ein eigenes Testprogramm an, das nur in einer Testkonfiguration läuft.'
          ],
          done: 'Erledigt, wenn die Übung „Betriebsstundenzähler“ alle sechs Testfälle besteht.',
          tip: 'Wenn ein Baustein schwer zu testen ist, ist er meist auch schwer zu verstehen – ein Hinweis auf zu viele Aufgaben in einem Baustein.'
        }
      },
      {
        id: 'o4', title: 'Lerne das Unit-Test-Framework von Automation Studio kennen',
        guide: {
          intro: 'B&R stellt für Automation Studio eine UnitTest-Lösung bereit, mit der Testfälle in der Steuerung bzw. Simulation laufen und als JUnit-Bericht exportiert werden.',
          steps: [
            'Lies in der AS-Hilfe die Übersicht der UnitTest-Lösung und den Abschnitt „Getting started“.',
            'Verstehe die Begriffe Testsuite, Testfall, Assertion und Testansicht.',
            'Notiere, wie die Ergebnisse im JUnit-Format exportiert werden – so lassen sie sich in eine CI-Pipeline einbinden.',
            'Vergleiche mit Community-Frameworks (z. B. GoogleTest-artige Workflows) und entscheide im Team, was ihr nutzt.',
            'Halte die Entscheidung im Testkonzept fest.'
          ],
          done: 'Erledigt, wenn du in drei Sätzen erklären kannst, wie ein Unit-Test in AS6 aufgebaut ist und wie das Ergebnis exportiert wird.',
          tip: 'Tests, die nicht automatisch laufen, werden irgendwann nicht mehr ausgeführt. Ziel ist: jede Änderung → alle Unit-Tests.',
          link: { label: 'B&R Help: UnitTest – Übersicht', url: help('technologysolutions/ts_unittest/general/ts_unittest.html') }
        }
      }
    ],
    videos: [V.nativeWebTests, V.realparsFat, V.fatVsSat],
    readings: [R.tubafTesten, R.brTests, R.brUnitTest],
    quiz: [
      { type: 'single', q: 'Welche Testebene prüft einen einzelnen Funktionsbaustein isoliert?', options: ['SAT', 'FAT', 'Unit-Test', 'Integrationstest'], correct: 2,
        explain: 'Der Unit-Test prüft eine isolierte Einheit; Integrations-, FAT- und SAT-Tests prüfen größere Zusammenhänge.' },
      { type: 'single', q: 'Ein FB zählt Sekunden mit `nSeconds := nSeconds + nCycleMs / 1000;` (Ganzzahlen, Zyklus 100 ms). Was ist das Problem?',
        code: { lang: 'st', text: 'nSeconds := nSeconds + nCycleMs / 1000;' },
        options: ['Keines', 'Ganzzahldivision 100 / 1000 = 0 – es wird nie etwas gezählt', 'Der Wert läuft sofort über', 'REAL fehlt im Namen'],
        correct: 1, explain: 'Bei Ganzzahlen ist 100 / 1000 = 0. Man sammelt Millisekunden in einem Akku und zieht volle Sekunden ab.' },
      { type: 'multi', q: 'Was gehört zu einem vollständigen Testfall?',
        options: ['ID', 'Vorbedingung', 'Aktion', 'Erwartetes Ergebnis'], correct: [0, 1, 2, 3],
        explain: 'Ohne eines dieser Elemente ist ein Testfall nicht reproduzierbar oder nicht bewertbar.' }
    ],
    exam: [
      { type: 'single', q: 'Wo findet die SAT statt?', options: ['Im eigenen Werk', 'Beim Kunden am Aufstellort', 'In der Simulation', 'Beim Steuerungshersteller'], correct: 1,
        explain: 'Site Acceptance Test = Abnahme am Aufstellort.' },
      { type: 'numeric', q: 'Ein UDINT-Sekundenzähler läuft bei 4 294 967 295 über. Nach wie vielen Jahren Dauerbetrieb passiert das (365 Tage/Jahr, gerundet)? Der Zähler zählt alle {S} s um 1.',
        params: { S: [1, 1, 1] }, formula: '4294967295 * S / (3600 * 24 * 365)', unit: 'Jahre', tol: 0.02,
        explain: '4 294 967 295 s / 31 536 000 s ≈ 136 Jahre – für Sekunden reicht UDINT, für Millisekunden (≈ 49,7 Tage) nicht.' },
      { type: 'multi', q: 'Welche Eigenschaften machen einen FB gut testbar?',
        options: ['Alle Abhängigkeiten kommen über VAR_INPUT', 'Ergebnisse sind über VAR_OUTPUT sichtbar', 'Er liest direkt globale I/O-Variablen', 'Zeitbasis ist als Eingang übergeben'],
        correct: [0, 1, 3], explain: 'Direkter Zugriff auf globale Variablen koppelt den FB an eine konkrete Anlage und erschwert Tests.' },
      { type: 'single', q: 'Welcher Testfall ist ein Grenzfall für „Wartung fällig ab 5 s Laufzeit“?',
        options: ['10 s Laufzeit', 'Genau 5 s und 4,9 s Laufzeit', '0 s Laufzeit ohne Einschalten', 'Pumpe läuft rückwärts'], correct: 1,
        explain: 'Grenzfälle liegen direkt an und neben der Schwelle.' }
    ],
    exercises: [exHours],
    proof: false
  },
  {
    id: 'praxis-3-inbetriebnahme-kunde', level: 3, kind: 'lektion',
    title: 'Inbetriebnahme beim Kunden und Änderungsmanagement',
    summary: 'Vor Ort professionell arbeiten, Änderungen kontrolliert einspielen und Diagnose für sporadische Fehler einbauen.',
    minutes: 180, req: ['praxis-2-inbetriebnahme-checkliste', 'praxis-3-testkonzept'],
    briefing: 'Beim Kunden gelten andere Regeln als im Büro: Die Anlage gehört dem Kunden, Produktionszeit ist teuer, und jede Änderung muss nachvollziehbar sein. Änderungsmanagement heißt: Änderungswünsche schriftlich erfassen, bewerten, freigeben, umsetzen, testen und dokumentieren – inklusive Software-Stand vorher und nachher. B&R Automation Studio unterstützt das mit dem Quelldatei-Vergleich gegen das Zielsystem und dem Logger. Für sporadische Fehler baust du in diesem Modul ein eigenes Ereignisprotokoll als Ringpuffer.',
    practice: 'Ein „kleiner Fix“ ohne Abstimmung, ohne Commit und ohne Test ist die häufigste Ursache dafür, dass nach einem Jahr niemand mehr weiß, welcher Stand auf der Anlage läuft.',
    transfer: {
      tia: 'TIA Portal bietet den Online-Offline-Vergleich und den Diagnosepuffer; Änderungsprozesse sind herstellerunabhängig.',
      codesys: 'CODESYS zeigt beim Login, ob das Projekt auf der Steuerung abweicht (Online Change vs. Download). Auch hier gilt: Stand vorher sichern.'
    },
    objectives: [
      {
        id: 'o1', title: 'Bereite den Einsatz beim Kunden vor',
        guide: {
          intro: 'Eine gute Vorbereitung entscheidet, ob du vor Ort arbeitest oder suchst.',
          steps: [
            'Projektstand taggen (z. B. `v1.3.0-sat`) und eine lauffähige Offline-Kopie inkl. passender AS-Version und Hardware-Upgrades mitnehmen.',
            'Zugangsdaten, IP-Adressen, Ansprechpartner und Sicherheitsunterweisung des Kunden vorab klären.',
            'Checkliste und Protokollvorlagen ausdrucken bzw. offline verfügbar haben.',
            'Vor jeder Änderung: aktuellen Stand der Steuerung sichern (Upload/Backup) und mit deinem Projekt vergleichen.',
            'Tägliche Abstimmung mit dem Kunden: Was wird heute gemacht, wann steht die Anlage?'
          ],
          done: 'Erledigt, wenn du eine Packliste für einen Kundeneinsatz mit Software, Dokumenten und Kontakten erstellt hast.',
          tip: 'Nimm nie an, dass auf der Anlage dein letzter Stand läuft. Vergleiche immer zuerst.'
        }
      },
      {
        id: 'o2', title: 'Vergleiche den Stand auf der Steuerung mit deinem Projekt',
        guide: {
          intro: 'Mit dem Quelldatei-Vergleich auf dem Zielsystem siehst du, ob jemand nach deiner letzten Übertragung etwas geändert hat.',
          steps: [
            'Aktiviere den Quelldatei-Vergleich auf dem Zielsystem bei der Übertragung (Einstellung in der Konfiguration), sonst gibt es später keine Vergleichsdaten.',
            'Online-Verbindung aufbauen.',
            'Für das ganze Projekt: **Projekt › Quelldateien auf dem Zielsystem vergleichen**.',
            'Für ein einzelnes Programm: Kontextmenü im Logical View › **Quelldateien vergleichen › Auf dem Zielsystem**.',
            'Unterschiede dokumentieren und klären, **bevor** du überträgst.'
          ],
          done: 'Erledigt, wenn du einen Vergleich gegen das Zielsystem durchgeführt und das Ergebnis notiert hast.',
          tip: 'Ist auf der Steuerung ein unbekannter Stand, sichere ihn zuerst als eigenen Git-Branch – auch fremde Änderungen gehören ins Repository.',
          link: { label: 'B&R Help: Übersichtsvergleich auf dem Zielsystem', url: help('projectmanagement/projectcompare/projectcompare_overview_target.html') }
        }
      },
      {
        id: 'o3', title: 'Führe Änderungen über einen Änderungsprozess ein',
        guide: {
          intro: 'Jede Änderung beim Kunden durchläuft dieselben Schritte – auch die kleine.',
          steps: [
            '**Erfassen:** Änderungswunsch mit Datum, Auftraggeber, Beschreibung, Begründung (Change Request).',
            '**Bewerten:** Aufwand, Risiko, Auswirkung auf Sicherheit und Abnahme. Bei Sicherheitsbezug: Risikobeurteilung durch Verantwortliche prüfen lassen.',
            '**Freigeben:** schriftlich durch den Kunden (Kosten, Termin).',
            '**Umsetzen und testen:** im Branch, Commit mit Ticket-ID, Test nach Testkonzept.',
            '**Dokumentieren:** neue Version taggen, Änderungsprotokoll und betroffene Dokumente aktualisieren.'
          ],
          done: 'Erledigt, wenn du für eine Beispieländerung einen vollständigen Change Request mit allen fünf Schritten ausgefüllt hast.',
          tip: 'Änderungen an der Funktion einer Maschine können eine „wesentliche Veränderung“ sein – das ist dann keine reine Softwarefrage mehr.'
        }
      },
      {
        id: 'o4', title: 'Baue ein Ereignisprotokoll für sporadische Fehler',
        guide: {
          intro: 'Sporadische Fehler findest du nur mit Aufzeichnung. Ein Ringpuffer speichert die letzten N Ereignisse mit Zeitstempel und überschreibt das älteste.',
          steps: [
            'Lies in der AS-Hilfe, wie der Logger Ereignisse speichert (ebenfalls Ringpuffer).',
            'Definiere die Ereigniscodes im Team (z. B. 1xx Störungen, 2xx Bedienereignisse).',
            'Implementiere den Ringpuffer mit Schreibindex und MOD-Rechnung in der Übung.',
            'Berechne eine Sicht „neuestes zuerst“ für die Visualisierung.',
            'Für die echte Anlage: Ereignisse zusätzlich mit **ArEventLog** in ein Logbuch schreiben, damit sie im Logger und im Export erscheinen.'
          ],
          done: 'Erledigt, wenn die Übung „Ereignisprotokoll als Ringpuffer“ alle Tests besteht.',
          tip: 'Teste den Überlauf immer explizit – die meisten Ringpuffer-Fehler zeigen sich erst beim (N+1)-ten Eintrag.',
          link: { label: 'B&R Help: ArEventLog', url: help('libraries/areventlog/areventlog.html') }
        }
      }
    ],
    videos: [V.ringbufferLinz, V.logger, V.wesentlicheVeraenderung],
    readings: [R.glinzKonfig, R.brCompareTarget, R.brEventLog],
    quiz: [
      { type: 'single', q: 'Ein Ringpuffer hat 5 Plätze, `nWriteIdx` ist 4. Wo landet der nächste Eintrag danach?',
        options: ['Index 5', 'Index 0', 'Index 4', 'Der Puffer läuft über und stoppt'], correct: 1,
        explain: '(4 + 1) MOD 5 = 0 – der Schreibindex springt zurück an den Anfang.' },
      { type: 'multi', q: 'Was gehört zu einem Change Request?', options: ['Begründung der Änderung', 'Bewertung von Aufwand und Risiko', 'Freigabe durch den Auftraggeber', 'Spontane Umsetzung ohne Test'],
        correct: [0, 1, 2], explain: 'Jede Änderung wird getestet und dokumentiert.' },
      { type: 'single', q: 'Was machst du zuerst, bevor du beim Kunden eine Änderung überträgst?',
        options: ['Sofort übertragen, um Zeit zu sparen', 'Den aktuellen Stand der Steuerung sichern und mit deinem Projekt vergleichen', 'Die Steuerung kalt starten', 'Den Logger löschen'],
        correct: 1, explain: 'Nur so weißt du, ob auf der Anlage Änderungen sind, die du sonst überschreiben würdest.' }
    ],
    exam: [
      { type: 'numeric', q: 'Ein Ringpuffer hat {N} Plätze. Es wurden {E} Ereignisse eingetragen (E > N). Wie viele Ereignisse wurden überschrieben?',
        params: { N: [5, 20, 1], E: [25, 60, 1] }, formula: 'E - N', unit: '', tol: 0.001,
        explain: 'Gespeichert bleiben die letzten N, überschrieben wurden E − N.' },
      { type: 'single', q: 'Welcher Index enthält in einem Ringpuffer der Größe 5 mit `nWriteIdx = 2` das neueste Ereignis?',
        options: ['0', '1', '2', '4'], correct: 1, explain: '(2 + 5 − 1) MOD 5 = 1.' },
      { type: 'single', q: 'Der Kunde wünscht vor Ort eine geänderte Taktzeit. Was ist korrekt?',
        options: ['Sofort im Code ändern, der Kunde hat es ja gewünscht', 'Wunsch erfassen, Auswirkungen bewerten, schriftlich freigeben lassen, umsetzen, testen, dokumentieren', 'Ablehnen, Änderungen sind nach der FAT verboten', 'Nur den Wert im Watch ändern'],
        correct: 1, explain: 'Auch gewünschte Änderungen laufen durch den Änderungsprozess.' },
      { type: 'multi', q: 'Warum versieht man Ereignisse im Protokoll mit Zeitstempeln?',
        options: ['Um die Reihenfolge eindeutig zu machen', 'Um Abstände zwischen Ereignissen zu bewerten', 'Um Ereignisse mit Logger-Einträgen und Aussagen des Personals abzugleichen', 'Weil der Ringpuffer sonst nicht funktioniert'],
        correct: [0, 1, 2], explain: 'Der Ringpuffer funktioniert auch ohne Zeitstempel, aber die Diagnose wird erst damit aussagekräftig.' }
    ],
    exercises: [exRing],
    proof: false
  },
  {
    id: 'praxis-3-abnahme', level: 3, kind: 'projekt',
    title: 'Abnahme: FAT-fähige Stationssteuerung',
    summary: 'Eine komplette Stationsfunktion mit Zustandsautomat und Fehlerbehandlung gegen ein FAT-Protokoll entwickeln und abnehmen.',
    minutes: 240, req: ['praxis-3-testkonzept'],
    briefing: 'Die Abnahme ist der formale Nachweis, dass die Maschine das Pflichtenheft erfüllt. Grundlage ist ein Abnahmeprotokoll mit Testfällen, die auf Anforderungen verweisen; Ergebnis ist eine Abnahmeerklärung mit Mängelliste. Im Ausbildungsrahmenplan heißt das: „technische Einrichtungen für die Benutzung frei- und übergeben, Abnahmeprotokolle anfertigen“. In diesem Praxisprojekt entwickelst du eine Förderstation mit Zustandsautomat, Stau-, Teilemangel- und Not-Halt-Kreis-Überwachung gegen sechs FAT-Testfälle und erstellst das zugehörige Abnahmeprotokoll.',
    practice: 'Bei der FAT stehen Kunde, Projektleiter und du an der Maschine. Wer jeden Testfall vorab im Büro durchgespielt hat, erlebt keine Überraschungen.',
    transfer: {
      tia: 'Zustandsautomaten werden in SCL meist ebenfalls mit CASE und einer Schrittvariablen (oder GRAPH) umgesetzt; das FAT-Vorgehen ist herstellerneutral.',
      codesys: 'In CODESYS/TwinCAT gleiche Struktur mit ENUM und CASE; Timer werden ebenfalls außerhalb der CASE-Anweisung aufgerufen.'
    },
    objectives: [
      {
        id: 'o1', title: 'Erstelle ein FAT-Protokoll aus dem Pflichtenheft',
        guide: {
          intro: 'Jede Anforderung bekommt mindestens einen Testfall. Das Protokoll ist die Arbeitsgrundlage für die Abnahme.',
          steps: [
            'Übernimm die Anforderungen REQ-01 bis REQ-09 aus der Aufgabenstellung in eine Tabelle.',
            'Formuliere je Anforderung einen Testfall (FAT-01 …) mit Vorbedingung, Aktion, erwartetem Ergebnis.',
            'Füge Fehlerfälle hinzu: Quittieren bei anstehender Ursache, Start bei offenem Not-Halt-Kreis.',
            'Ergänze Spalten für Ist-Ergebnis, i. O./n. i. O., Bemerkung, Unterschrift.',
            'Lege das Protokoll im Repository unter `Doc/FAT/` ab.'
          ],
          done: 'Erledigt, wenn dein FAT-Protokoll jede REQ-ID mindestens einmal referenziert.',
          tip: 'Lass das Protokoll vor der FAT vom Kunden freigeben – dann ist klar, was „abgenommen“ bedeutet.'
        }
      },
      {
        id: 'o2', title: 'Implementiere den Zustandsautomaten mit Fehlerbehandlung',
        guide: {
          intro: 'Ein Zustandsautomat macht das Verhalten vorhersagbar und testbar. Fehlerüberwachungen und Timer liegen außerhalb der CASE-Anweisung.',
          steps: [
            'Lege das Enum `StationState_enum` in `Types.typ` an (in AS6: Logical View › Programm › `Types.typ` öffnen).',
            'Rufe alle Timer und Flankenbausteine einmal pro Zyklus vor der CASE-Anweisung auf.',
            'Platziere übergeordnete Überwachungen (Not-Halt-Kreis) vor der CASE-Anweisung.',
            'Programmiere die Übergänge je Zustand; jeder Fehler setzt eine eindeutige `nErrorId`.',
            'Leite die Ausgänge am Ende aus dem Zustand ab.'
          ],
          code: { lang: 'st', text: 'tonJam(IN := (eState = ST_RUN) AND diSensor, PT := JAM_TIME);\nCASE eState OF\nST_RUN:\n\tIF tonJam.Q THEN\n\t\teState := ST_ERROR;\n\t\tnErrorId := ERR_JAM;\n\tEND_IF\nEND_CASE\ndoMotor := (eState = ST_RUN);' },
          done: 'Erledigt, wenn die Übung „Abnahmefähige Förderstation“ alle sechs FAT-Testfälle besteht.',
          tip: 'Zeichne den Automaten vorher als Zustandsdiagramm. Jeder Pfeil ist ein Testfall.'
        }
      },
      {
        id: 'o3', title: 'Führe die FAT durch und dokumentiere Mängel',
        guide: {
          intro: 'Bei der FAT wird jeder Testfall vor Zeugen durchgeführt und das Ergebnis eingetragen.',
          steps: [
            'Notiere den exakten Software-Stand (Git-Tag) im Protokollkopf.',
            'Führe die Testfälle in der vereinbarten Reihenfolge durch; beobachte im Watch `eState` und `nErrorId`.',
            'Trage jedes Ergebnis sofort ein – nicht „später aus dem Gedächtnis“.',
            'Mängel mit Klassifizierung (A = verhindert Abnahme, B = Nacharbeit vor SAT, C = Schönheitsfehler) aufnehmen.',
            'Vereinbare mit dem Kunden Termine für die Mängelbeseitigung.'
          ],
          done: 'Erledigt, wenn du ein ausgefülltes FAT-Protokoll mit Software-Stand und Mängelliste erstellt hast.',
          tip: 'Ein gefundener Mangel ist kein Versagen – ein verschwiegener schon.'
        }
      },
      {
        id: 'o4', title: 'Reiche das Projekt als Nachweis ein',
        guide: {
          intro: 'Der Nachweis besteht aus Code, FAT-Protokoll und Abnahmeerklärung im Repository.',
          steps: [
            'Committe Code und Protokoll in einem Feature-Branch, z. B. `feature/foerderstation-fat`.',
            'Lass das Ergebnis von einem Kollegen reviewen.',
            'Tagge den abgenommenen Stand, z. B. `v1.0.0-fat`.',
            'Reiche den Link zum Merge-Request auf git.breitner.de ein.',
            'Dein Ausbilder bestätigt das Abzeichen nach Durchsicht.'
          ],
          done: 'Erledigt, wenn der Link zum Merge-Request mit Code und FAT-Protokoll eingereicht ist.',
          tip: 'Ein Tag pro Abnahmestand macht später jede Rückfrage „was lief bei der FAT?“ in Sekunden beantwortbar.',
          link: { label: 'B&R Help: Verwenden von Versionskontrollsystemen', url: help('projectmanagement/sourcecontrol/external/projectorganisation_sourcecontrol.html') }
        }
      }
    ],
    videos: [V.realparsFat, V.fatVsSat, V.plcopen7steps],
    readings: [R.glinzQualitaet, R.ausbRahmenplan, R.wikiFat],
    quiz: [
      { type: 'single', q: 'Warum gehört die Not-Halt-Kreis-Überwachung im Zustandsautomaten vor die CASE-Anweisung?',
        options: ['Weil CASE sonst nicht übersetzt', 'Damit sie unabhängig vom aktuellen Zustand in jedem Zyklus wirkt', 'Weil sie dann schneller ist als die Sicherheitssteuerung', 'Das ist reine Geschmackssache'],
        correct: 1, explain: 'Eine übergeordnete Überwachung darf in keinem Zustand vergessen werden.' },
      { type: 'single', q: 'Was ist ein A-Mangel bei der Abnahme?', options: ['Ein Schönheitsfehler', 'Ein Mangel, der die Abnahme verhindert', 'Ein Mangel, den der Kunde selbst behebt', 'Ein Dokumentationsfehler ohne Auswirkung'],
        correct: 1, explain: 'A-Mängel verhindern die Abnahme, B-Mängel werden nachgearbeitet, C-Mängel sind geringfügig.' },
      { type: 'multi', q: 'Welche Aussagen zur FAT stimmen?', options: ['Sie findet im Werk des Herstellers statt', 'Sie prüft gegen das Pflichtenheft', 'Sie ersetzt die SAT immer vollständig', 'Der Software-Stand wird im Protokoll festgehalten'],
        correct: [0, 1, 3], explain: 'Was nur vor Ort prüfbar ist, bleibt für die SAT.' }
    ],
    exam: [
      { type: 'single', q: 'Welcher Fehler steckt in diesem Ausschnitt?',
        code: { lang: 'st', text: 'CASE eState OF\nST_RUN:\n\ttonNoParts(IN := NOT diSensor, PT := T#5s);\n\tIF tonNoParts.Q THEN eState := ST_ERROR; END_IF\nST_ERROR:\n\tIF rtAck.Q THEN eState := ST_IDLE; END_IF\nEND_CASE' },
        options: ['Keiner', 'Der Timer wird nur in ST_RUN aufgerufen; nach Quittieren und Neustart ist Q sofort TRUE', 'CASE erlaubt keine Enums', 'rtAck ist kein gültiger Name'],
        correct: 1, explain: 'In ST_ERROR wird der Timer nicht mit IN = FALSE aufgerufen, behält also ET/Q. Beim nächsten Start meldet er sofort Teilemangel.' },
      { type: 'single', q: 'Welche Rolle hat das SPS-Programm beim Not-Halt, wenn eine Sicherheitssteuerung eingesetzt wird?',
        options: ['Es realisiert die Sicherheitsfunktion', 'Es wertet die Rückmeldung aus, setzt die Station in einen definierten Zustand und meldet', 'Es darf den Not-Halt quittieren, ohne die Sicherheitssteuerung', 'Keine'],
        correct: 1, explain: 'Die Sicherheitsfunktion liegt in der Sicherheitssteuerung; die Standard-SPS reagiert betrieblich darauf.' },
      { type: 'multi', q: 'Was gehört in eine Abnahmeerklärung?', options: ['Datum und Software-Stand', 'Liste offener Mängel mit Fristen', 'Unterschriften von Auftraggeber und Auftragnehmer', 'Der komplette Quellcode'],
        correct: [0, 1, 2], explain: 'Quellcode wird separat übergeben bzw. hinterlegt, er gehört nicht in die Erklärung.' },
      { type: 'numeric', q: 'Eine FAT umfasst {T} Testfälle à durchschnittlich {M} Minuten. Wie viele Stunden planst du inkl. 25 % Reserve?',
        params: { T: [20, 60, 5], M: [5, 15, 1] }, formula: 'T * M * 1.25 / 60', unit: 'h', tol: 0.02,
        explain: 'Dauer = Testfälle × Minuten × 1,25 / 60.' }
    ],
    exercises: [exStation],
    proof: true,
    badge: 'Abnahme-Verantwortung'
  }
];
