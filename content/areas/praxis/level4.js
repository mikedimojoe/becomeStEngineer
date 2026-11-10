'use strict';
const { R, V, pulse, help } = require('./_sources');

// ---------------------------------------------------------------------------
// Level 4 – Engineer: Aufwandsschätzung & Software-Design, Normen-Orientierung, technische Schulden
// ---------------------------------------------------------------------------

const fbValveDecl = `(* FB_ValveCtrl – Implementierung nach Software-Design-Dokument SDD-VLV-01 (siehe Aufgabe) *)
FUNCTION_BLOCK FB_ValveCtrl
	VAR_INPUT
		bOpenCmd : BOOL;   (* Befehl: Ventil oeffnen *)
		bFbOpen : BOOL;    (* Endlagenrueckmeldung offen *)
		bFbClosed : BOOL;  (* Endlagenrueckmeldung geschlossen *)
		tTimeout : TIME;   (* max. Stellzeit *)
		bReset : BOOL;     (* Fehler quittieren *)
	END_VAR
	VAR_OUTPUT
		bOut : BOOL;       (* Ansteuerung Magnetventil *)
		bIsOpen : BOOL;
		bIsClosed : BOOL;
		bError : BOOL;
		nErrorId : UINT;   (* 0 = ok, 1 = Timeout Oeffnen, 2 = Timeout Schliessen, 3 = Endlagen gleichzeitig *)
	END_VAR
	VAR
		tonOpen : TON;
		tonClose : TON;
	END_VAR
`;
const valveProgram = `
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbValve(bOpenCmd := diOpenCmd, bFbOpen := diOpen, bFbClosed := diClosed, tTimeout := T#1s, bReset := diReset);
	doValve := fbValve.bOut;
	doValveError := fbValve.bError;
	nValveErrorId := fbValve.nErrorId;
END_PROGRAM
`;

const exValve = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Implementierung nach Design-Dokument: Ventil mit Endlagenüberwachung',
  task: [
    'Aus dem Software-Design-Dokument **SDD-VLV-01** ist die Schnittstelle von `FB_ValveCtrl` bereits deklariert. Implementiere das Verhalten exakt nach Spezifikation – das Aufrufprogramm ist fertig.',
    '',
    '**SDD-VLV-01, Abschnitt 4 „Verhalten“:**',
    '1. `bOut = bOpenCmd AND NOT bError` – im Fehlerfall fällt das Ventil in die sichere Stellung „geschlossen“ (Federrückstellung).',
    '2. `bIsOpen = bFbOpen AND NOT bFbClosed`, `bIsClosed = bFbClosed AND NOT bFbOpen`.',
    '3. **Timeout Öffnen (1):** `bOpenCmd` aktiv, aber `bFbOpen` nicht innerhalb `tTimeout` → Fehler.',
    '4. **Timeout Schließen (2):** `bOpenCmd` inaktiv, aber `bFbClosed` nicht innerhalb `tTimeout` → Fehler.',
    '5. **Endlagen gleichzeitig (3):** `bFbOpen AND bFbClosed` → sofort Fehler (Sensorfehler).',
    '6. Ein Fehler bleibt gespeichert, bis `bReset` TRUE ist. `bReset` löscht `bError` und `nErrorId`; besteht die Ursache weiter, wird der Fehler im selben Zyklus erneut gesetzt.',
    '7. Während `bError` laufen keine Timeout-Timer.',
    '',
    'Die Simulation: Das Ventil braucht 0,5 s für einen Hub. `diStuck` blockiert die Mechanik, `diSensorFault` meldet beide Endlagen gleichzeitig.'
  ].join('\n'),
  hints: [
    'Reihenfolge im FB: Reset auswerten → Timer aufrufen → Fehlerbedingungen prüfen → Ausgänge berechnen.',
    '`tonOpen(IN := bOpenCmd AND NOT bFbOpen AND NOT bError, PT := tTimeout);`',
    'Nur setzen, nie im selben Block wieder löschen: `IF tonOpen.Q THEN bError := TRUE; nErrorId := 1; END_IF`.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diOpenCmd', type: 'BOOL', dir: 'in', label: 'Befehl Ventil öffnen', widget: 'switch' },
    { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
    { name: 'diStuck', type: 'BOOL', dir: 'in', label: 'Simulation: Ventil klemmt', widget: 'switch' },
    { name: 'diSensorFault', type: 'BOOL', dir: 'in', label: 'Simulation: Endlagenschalter defekt', widget: 'switch' },
    { name: 'diOpen', type: 'BOOL', dir: 'in', label: 'Endlage offen', widget: 'led' },
    { name: 'diClosed', type: 'BOOL', dir: 'in', label: 'Endlage geschlossen', widget: 'led' },
    { name: 'rStroke', type: 'REAL', dir: 'in', label: 'Ventilstellung (Simulation)', widget: 'gauge', min: 0, max: 1 },
    { name: 'doValve', type: 'BOOL', dir: 'out', label: 'Magnetventil Y5', widget: 'led' },
    { name: 'doValveError', type: 'BOOL', dir: 'out', label: 'Ventilfehler', widget: 'led' },
    { name: 'nValveErrorId', type: 'UINT', dir: 'out', label: 'Fehlernummer', widget: 'value' }
  ],
  scene: { type: 'cylinder', bind: { extend: 'doValve', isOut: 'diOpen', isIn: 'diClosed', stroke: 'rStroke' } },
  plant: {
    var: 'VAR\n\trSpeed : REAL := 0.02;\nEND_VAR\n',
    code: 'IF NOT diStuck THEN\n\tIF doValve THEN rStroke := rStroke + rSpeed; ELSE rStroke := rStroke - rSpeed; END_IF\nEND_IF\nIF rStroke > 1.0 THEN rStroke := 1.0; END_IF\nIF rStroke < 0.0 THEN rStroke := 0.0; END_IF\ndiOpen := rStroke >= 0.999;\ndiClosed := rStroke <= 0.001;\nIF diSensorFault THEN\n\tdiOpen := TRUE;\n\tdiClosed := TRUE;\nEND_IF\n'
  },
  files: {
    main: fbValveDecl + '\n\t(* TODO: Verhalten nach SDD-VLV-01, Abschnitt 4 *)\n\nEND_FUNCTION_BLOCK\n' + valveProgram,
    var: 'VAR\n\tfbValve : FB_ValveCtrl;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: fbValveDecl + `
	(* 6: Quittieren *)
	IF bReset THEN
		bError := FALSE;
		nErrorId := 0;
	END_IF

	(* 3/4/7: Stellzeitueberwachung, nur ohne anstehenden Fehler *)
	tonOpen(IN := bOpenCmd AND NOT bFbOpen AND NOT bError, PT := tTimeout);
	tonClose(IN := (NOT bOpenCmd) AND NOT bFbClosed AND NOT bError, PT := tTimeout);

	(* 5: Sensorfehler hat Vorrang *)
	IF bFbOpen AND bFbClosed THEN
		bError := TRUE;
		nErrorId := 3;
	ELSIF tonOpen.Q THEN
		bError := TRUE;
		nErrorId := 1;
	ELSIF tonClose.Q THEN
		bError := TRUE;
		nErrorId := 2;
	END_IF

	(* 1/2: Ausgaenge *)
	bOut := bOpenCmd AND NOT bError;
	bIsOpen := bFbOpen AND NOT bFbClosed;
	bIsClosed := bFbClosed AND NOT bFbOpen;
END_FUNCTION_BLOCK
` + valveProgram,
    var: 'VAR\n\tfbValve : FB_ValveCtrl;\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Normal öffnen ohne Fehler', steps: [
      { cycles: 2 }, { set: { diOpenCmd: true } },
      { until: 'fbValve.bIsOpen', maxMs: 1000, msg: 'Ventil erreicht die Endlage „offen“ nicht.' },
      { never: 'doValveError', ms: 700, msg: 'Im Normalbetrieb darf kein Fehler auftreten.' },
      { expect: 'doValve', msg: 'bOut muss bei bOpenCmd TRUE bleiben.' }
    ] },
    { name: 'Timeout beim Öffnen', steps: [
      { cycles: 2 }, { set: { diStuck: true, diOpenCmd: true } }, { ms: 900 },
      { expect: 'NOT doValveError', msg: 'Vor Ablauf von tTimeout (1 s) darf kein Fehler kommen.' },
      { until: 'doValveError', maxMs: 500, msg: 'Nach 1 s ohne Endlage „offen“ muss Fehler 1 kommen.' },
      { expect: 'nValveErrorId = 1 AND NOT doValve', msg: 'Fehler 1 und Ventil in sicherer Stellung (bOut = FALSE) erwartet.' }
    ] },
    { name: 'Timeout beim Schließen', steps: [
      { cycles: 2 }, { set: { diOpenCmd: true } }, { until: 'diOpen', maxMs: 1000 },
      { set: { diStuck: true, diOpenCmd: false } },
      { until: 'doValveError', maxMs: 1500, msg: 'Ventil schließt nicht – Fehler 2 erwartet.' },
      { expect: 'nValveErrorId = 2', msg: 'Timeout Schließen ist Fehler 2.' }
    ] },
    { name: 'Beide Endlagen gleichzeitig', steps: [
      { cycles: 2 }, { set: { diSensorFault: true } }, { cycles: 2 },
      { expect: 'doValveError AND nValveErrorId = 3 AND NOT fbValve.bIsOpen AND NOT fbValve.bIsClosed', msg: 'Beide Endlagen aktiv → sofort Fehler 3, keine gültige Stellung.' }
    ] },
    { name: 'Quittieren nach beseitigter Ursache', steps: [
      { cycles: 2 }, { set: { diStuck: true, diOpenCmd: true } }, { until: 'doValveError', maxMs: 1500 },
      { set: { diStuck: false, diOpenCmd: false } }, ...pulse('diReset', 1),
      { expect: 'NOT doValveError AND nValveErrorId = 0', msg: 'Nach Quittieren muss der Fehler gelöscht sein.' },
      { never: 'doValveError', ms: 700, msg: 'Ohne Ursache darf der Fehler nicht wiederkommen.' }
    ] },
    { name: 'Quittieren bei anstehender Ursache', steps: [
      { cycles: 2 }, { set: { diSensorFault: true } }, { cycles: 2 }, ...pulse('diReset', 1),
      { expect: 'doValveError AND nValveErrorId = 3', msg: 'Besteht die Ursache weiter, muss der Fehler sofort wieder gesetzt sein.' }
    ] }
  ]
};

const exRestart = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Wiederanlaufsperre nach Spannungswiederkehr und Schutzkreis-Unterbrechung',
  task: [
    'Die vorhandene Motorsteuerung startet nach dem Einschalten der Steuerung oder nach dem Wiederschließen des Schutzkreises **selbsttätig**, wenn `diStart` noch betätigt ist oder hängt. Die EN 60204-1 verlangt sinngemäß, dass ein Rücksetzen bzw. eine Spannungswiederkehr **keinen** Wiederanlauf auslösen darf (Orientierung, keine Rechtsberatung – maßgeblich ist die Risikobeurteilung).',
    '',
    'Erweitere das Programm um eine **Wiederanlaufsperre**:',
    '- Nach dem Start der Steuerung (`_INIT`) ist `bResetRequired` TRUE.',
    '- Ist `diSafetyOk` (Rückmeldung der Sicherheitssteuerung: Schutzkreis geschlossen) FALSE, wird `bResetRequired` TRUE und der Motor sofort ausgeschaltet.',
    '- Die Quittierung erfolgt mit der **fallenden Flanke** von `diReset` (Loslassen) und wirkt nur, wenn `diSafetyOk` TRUE ist. Ein klemmender Taster quittiert also nicht.',
    '- Quittieren allein startet **nie** den Motor. Start nur mit **steigender Flanke** von `diStart`, wenn `bResetRequired` FALSE und `diStop` (Öffner) TRUE.',
    '- `doResetLamp` zeigt `bResetRequired` an.',
    '',
    'Hinweis: Die Sicherheitsfunktion selbst (z. B. Not-Halt, Schutztürüberwachung) realisiert die Sicherheitssteuerung (z. B. SafeLOGIC mit mapp Safety). Dieses Programm ist die betriebliche Ergänzung in der Standardsteuerung.'
  ].join('\n'),
  hints: [
    'Fallende Flanke ohne F_TRIG: `bResetFalling := bResetOld AND NOT diReset; bResetOld := diReset;`',
    'Reihenfolge: erst Sperre berechnen, dann Start/Stopp. So wirkt die Sperre im selben Zyklus.',
    'Steigende Flanke für Start mit R_TRIG – ein gedrückt gehaltener Start-Taster darf nach dem Quittieren nichts auslösen.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diSafetyOk', type: 'BOOL', dir: 'in', label: 'Schutzkreis geschlossen (Sicherheitssteuerung)', widget: 'switch', init: true },
    { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Taster S4 Quittieren/Reset', widget: 'button' },
    { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Taster S1 Start', widget: 'button' },
    { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Taster S2 Stopp (Öffner)', widget: 'switch', init: true },
    { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Schütz K1 Antrieb', widget: 'led' },
    { name: 'doResetLamp', type: 'BOOL', dir: 'out', label: 'Leuchtmelder „Quittieren erforderlich“', widget: 'led' }
  ],
  scene: { type: 'motor', bind: { run: 'doMotor' } },
  files: {
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tIF diStart AND diSafetyOk THEN\n\t\tbRun := TRUE;\n\tEND_IF\n\tIF (NOT diStop) OR (NOT diSafetyOk) THEN\n\t\tbRun := FALSE;\n\tEND_IF\n\tdoMotor := bRun;\nEND_PROGRAM\n',
    var: 'VAR\n\tbRun : BOOL;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: `(* Motorsteuerung mit Wiederanlaufsperre (Orientierung EN 60204-1: kein selbsttaetiger Anlauf nach Reset/Spannungswiederkehr) *)
PROGRAM _INIT
	bResetRequired := TRUE; (* nach Spannungswiederkehr immer quittieren *)
	bRun := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	bResetFalling := bResetOld AND NOT diReset;
	bResetOld := diReset;

	(* Wiederanlaufsperre *)
	IF NOT diSafetyOk THEN
		bResetRequired := TRUE;
	ELSIF bResetFalling THEN
		bResetRequired := FALSE;
	END_IF

	(* Start/Stopp: Quittieren startet nie selbst *)
	IF bResetRequired OR (NOT diStop) THEN
		bRun := FALSE;
	ELSIF rtStart.Q THEN
		bRun := TRUE;
	END_IF

	doMotor := bRun;
	doResetLamp := bResetRequired;
END_PROGRAM
`,
    var: 'VAR\n\tbRun : BOOL;\n\tbResetRequired : BOOL;\n\tbResetOld : BOOL;\n\tbResetFalling : BOOL;\n\trtStart : R_TRIG;\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Kein Anlauf nach Spannungswiederkehr', steps: [
      ...pulse('diStart', 1),
      { expect: 'NOT doMotor AND doResetLamp', msg: 'Nach dem Einschalten darf Start ohne Quittieren nichts bewirken.' }
    ] },
    { name: 'Quittieren, dann starten', steps: [
      ...pulse('diReset', 3),
      { expect: 'NOT doMotor AND NOT doResetLamp', msg: 'Quittieren hebt die Sperre auf, startet aber nicht.' },
      ...pulse('diStart', 1), { expect: 'doMotor', msg: 'Nach Quittieren muss Start den Motor einschalten.' }
    ] },
    { name: 'Schutzkreis offen: Motor aus, Sperre aktiv', steps: [
      ...pulse('diReset', 3), ...pulse('diStart', 1), { set: { diSafetyOk: false } }, { cycles: 1 },
      { expect: 'NOT doMotor', msg: 'Schutzkreis offen → Motor sofort aus.' },
      { set: { diSafetyOk: true } }, { cycles: 5 },
      { expect: 'NOT doMotor AND doResetLamp', msg: 'Nach Schließen des Schutzkreises kein selbsttätiger Wiederanlauf.' }
    ] },
    { name: 'Quittieren bei offenem Schutzkreis wirkungslos', steps: [
      { set: { diSafetyOk: false } }, ...pulse('diReset', 3), { set: { diSafetyOk: true } }, { cycles: 3 },
      { expect: 'doResetLamp', msg: 'Ein Reset bei offenem Schutzkreis darf die Sperre nicht aufheben.' }
    ] },
    { name: 'Gehaltener Start-Taster startet nach Quittieren nicht', steps: [
      { set: { diStart: true } }, { cycles: 3 }, ...pulse('diReset', 3),
      { never: 'doMotor', ms: 300, msg: 'Ein bereits gedrückter Start-Taster darf nach dem Quittieren nicht anlaufen lassen (Flanke!).' }
    ] },
    { name: 'Klemmender Reset-Taster quittiert nicht', steps: [
      { set: { diReset: true } }, { ms: 500 },
      { expect: 'doResetLamp', msg: 'Quittieren erst mit fallender Flanke – ein klemmender Taster darf nicht quittieren.' }
    ] }
  ]
};

const fbMotorDecl = `FUNCTION_BLOCK FB_MotorCtrl
	VAR_INPUT
		bRun : BOOL;
		bOverload : BOOL;
		bFeedback : BOOL;
		bReset : BOOL;
		tFbTimeout : TIME;
	END_VAR
	VAR_OUTPUT
		bOut : BOOL;
		bFault : BOOL;
		nFaultId : USINT; (* 1 = Motorschutz, 2 = Rueckmeldung fehlt *)
	END_VAR
	VAR
		tonFb : TON;
	END_VAR
`;

const motorIo = [];
for (let i = 1; i <= 4; i++) {
  motorIo.push(
    { name: `diRun${i}`, type: 'BOOL', dir: 'in', label: `Motor ${i}: Ein-Befehl`, widget: 'switch' },
    { name: `diOverload${i}`, type: 'BOOL', dir: 'in', label: `Motor ${i}: Motorschutz ausgelöst`, widget: 'switch' },
    { name: `diFb${i}`, type: 'BOOL', dir: 'in', label: `Motor ${i}: Schützrückmeldung`, widget: 'led' },
    { name: `doMotor${i}`, type: 'BOOL', dir: 'out', label: `Motor ${i}: Schütz`, widget: 'led' },
    { name: `doFault${i}`, type: 'BOOL', dir: 'out', label: `Motor ${i}: Störung`, widget: 'led' }
  );
}
motorIo.push(
  { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Sammelquittierung', widget: 'button' },
  { name: 'diNoFb3', type: 'BOOL', dir: 'in', label: 'Simulation: Rückmeldung Motor 3 defekt', widget: 'switch' }
);

const copyBlock = (i, timer) => `	(* Motor ${i} *)
	IF diOverload${i} THEN
		bFault${i} := TRUE;
	END_IF
	tonFb${i}(IN := doMotor${i} AND NOT diFb${i}, PT := T#1s);
	IF tonFb${timer}.Q THEN
		bFault${i} := TRUE;
	END_IF
	IF diReset AND NOT diOverload${i} THEN
		bFault${i} := FALSE;
	END_IF
	doMotor${i} := diRun${i} AND NOT bFault${i};
	doFault${i} := bFault${i};
`;

const exDebt = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Technische Schulden abbauen: Copy-Paste zu Funktionsbaustein',
  task: [
    'Das Programm steuert drei Motoren mit Motorschutz- und Rückmeldeüberwachung. Jeder Motor ist per **Copy-Paste** entstanden – und beim dritten Kopieren ist ein Fehler passiert. Jetzt soll ein **vierter Motor** dazukommen.',
    '',
    '**Aufgabe:**',
    '1. Lege einen Funktionsbaustein `FB_MotorCtrl` an (Schnittstelle siehe unten) und implementiere darin die Logik **einmal**.',
    '2. Ersetze die drei Kopien durch die Instanzen `fbMotor1` … `fbMotor3` und ergänze `fbMotor4` für den neuen Motor (`diRun4`, `diOverload4`, `diFb4`, `doMotor4`, `doFault4`).',
    '3. Der Kopierfehler bei Motor 3 ist damit automatisch behoben – prüfe es mit dem Test „Rückmeldung Motor 3 fehlt“.',
    '',
    '**Schnittstelle `FB_MotorCtrl`:** Eingänge `bRun, bOverload, bFeedback, bReset : BOOL; tFbTimeout : TIME;` – Ausgänge `bOut, bFault : BOOL; nFaultId : USINT;` (1 = Motorschutz, 2 = Rückmeldung fehlt).',
    '',
    '**Verhalten je Motor:** Motorschutz → Störung (1). Läuft der Motor (`bOut`) ohne Rückmeldung länger als `tFbTimeout` (1 s) → Störung (2). Quittieren (`bReset`) löscht die Störung, wenn kein Motorschutz ansteht. `bOut = bRun AND NOT bFault`.',
    '',
    'In AS6 legst du den FB im **Logical View** über das Kontextmenü als neues Objekt (Funktionsbaustein) an; die Deklaration liegt dann in einer `.fun`-Datei. Hier steht er oben in `Main.st`.'
  ].join('\n'),
  hints: [
    'Der Kopierfehler: Bei Motor 3 wird `tonFb2.Q` statt `tonFb3.Q` abgefragt.',
    'Der Timer im FB nutzt den Ausgang `bOut` aus dem letzten Aufruf: `tonFb(IN := bOut AND NOT bFeedback, PT := tFbTimeout);`.',
    'Übergib `tFbTimeout := T#1s` bei jedem Aufruf.'
  ],
  cycleMs: 10,
  io: motorIo,
  plant: {
    var: 'VAR\n\tbDummy : BOOL;\nEND_VAR\n',
    code: 'diFb1 := doMotor1;\ndiFb2 := doMotor2;\ndiFb3 := doMotor3 AND NOT diNoFb3;\ndiFb4 := doMotor4;\n'
  },
  files: {
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n' + copyBlock(1, 1) + '\n' + copyBlock(2, 2) + '\n' + copyBlock(3, 2) + '\t(* TODO: Motor 4 *)\nEND_PROGRAM\n',
    var: 'VAR\n\tbFault1 : BOOL;\n\tbFault2 : BOOL;\n\tbFault3 : BOOL;\n\ttonFb1 : TON;\n\ttonFb2 : TON;\n\ttonFb3 : TON;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: fbMotorDecl + `
	(* Motorschutz *)
	IF bOverload THEN
		bFault := TRUE;
		nFaultId := 1;
	END_IF
	(* Rueckmeldeueberwachung: Schuetz angesteuert, aber keine Rueckmeldung *)
	tonFb(IN := bOut AND NOT bFeedback, PT := tFbTimeout);
	IF tonFb.Q THEN
		bFault := TRUE;
		nFaultId := 2;
	END_IF
	(* Quittieren nur ohne anstehenden Motorschutz *)
	IF bReset AND NOT bOverload THEN
		bFault := FALSE;
		nFaultId := 0;
	END_IF
	bOut := bRun AND NOT bFault;
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbMotor1(bRun := diRun1, bOverload := diOverload1, bFeedback := diFb1, bReset := diReset, tFbTimeout := FB_TIMEOUT);
	fbMotor2(bRun := diRun2, bOverload := diOverload2, bFeedback := diFb2, bReset := diReset, tFbTimeout := FB_TIMEOUT);
	fbMotor3(bRun := diRun3, bOverload := diOverload3, bFeedback := diFb3, bReset := diReset, tFbTimeout := FB_TIMEOUT);
	fbMotor4(bRun := diRun4, bOverload := diOverload4, bFeedback := diFb4, bReset := diReset, tFbTimeout := FB_TIMEOUT);

	doMotor1 := fbMotor1.bOut;  doFault1 := fbMotor1.bFault;
	doMotor2 := fbMotor2.bOut;  doFault2 := fbMotor2.bFault;
	doMotor3 := fbMotor3.bOut;  doFault3 := fbMotor3.bFault;
	doMotor4 := fbMotor4.bOut;  doFault4 := fbMotor4.bFault;
END_PROGRAM
`,
    var: 'VAR\n\tfbMotor1 : FB_MotorCtrl;\n\tfbMotor2 : FB_MotorCtrl;\n\tfbMotor3 : FB_MotorCtrl;\n\tfbMotor4 : FB_MotorCtrl;\nEND_VAR\n\nVAR CONSTANT\n\tFB_TIMEOUT : TIME := T#1s;\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Struktur: vier FB-Instanzen', steps: [
      { cycles: 2 }, { expect: 'NOT fbMotor1.bOut AND NOT fbMotor4.bFault', msg: 'Es gibt keine Instanzen fbMotor1 … fbMotor4 vom Typ FB_MotorCtrl.' }
    ] },
    { name: 'Rückmeldung Motor 3 fehlt (Kopierfehler)', steps: [
      { set: { diNoFb3: true, diRun3: true } },
      { until: 'doFault3', maxMs: 1500, msg: 'Motor 3 muss ohne Rückmeldung nach 1 s eine Störung melden.' },
      { expect: 'NOT doMotor3 AND fbMotor3.nFaultId = 2', msg: 'Störung 2 (Rückmeldung fehlt), Schütz aus.' }
    ] },
    { name: 'Neuer Motor 4 funktioniert', steps: [
      { set: { diRun4: true } }, { cycles: 3 }, { expect: 'doMotor4 AND NOT doFault4', msg: 'Motor 4 muss laufen.' },
      { set: { diOverload4: true } }, { cycles: 2 },
      { expect: 'doFault4 AND NOT doMotor4 AND fbMotor4.nFaultId = 1', msg: 'Motorschutz Motor 4 → Störung 1, Schütz aus.' }
    ] },
    { name: 'Quittieren nach Motorschutz', steps: [
      { set: { diRun1: true, diOverload1: true } }, { cycles: 2 }, ...pulse('diReset', 1),
      { expect: 'doFault1', msg: 'Quittieren bei anstehendem Motorschutz darf nicht wirken.' },
      { set: { diOverload1: false } }, ...pulse('diReset', 1), { cycles: 2 },
      { expect: 'NOT doFault1 AND doMotor1', msg: 'Nach Quittieren muss Motor 1 wieder laufen.' }
    ] },
    { name: 'Motoren sind unabhängig', steps: [
      { set: { diRun1: true, diRun2: true, diOverload2: true } }, { ms: 1500 },
      { expect: 'doMotor1 AND NOT doFault1 AND doFault2', msg: 'Eine Störung an Motor 2 darf Motor 1 nicht beeinflussen.' }
    ] }
  ]
};

module.exports = [
  {
    id: 'praxis-4-schaetzung-design', level: 4, kind: 'lektion',
    title: 'Aufwandsschätzung und Software-Design-Dokumente',
    summary: 'Aufwände begründet schätzen und Bausteine vor der Implementierung in einem Design-Dokument festlegen.',
    minutes: 180, req: ['praxis-3-abnahme'],
    briefing: 'Als Engineer verantwortest du nicht nur Code, sondern auch Zusagen: Wie lange dauert die Software für diese Maschine? Gute Schätzungen zerlegen die Arbeit, nutzen Erfahrungswerte und nennen Unsicherheiten offen – Expertenschätzung, Delphi-Methode bzw. Planning Poker und Drei-Punkt-Schätzung sind bewährte Verfahren. Bevor größere Bausteine entstehen, beschreibt ein Software-Design-Dokument (SDD) Schnittstellen, Zustände, Fehlerverhalten und Entscheidungen; arc42 liefert dafür eine bewährte Gliederung. Du übst beides und implementierst einen Baustein exakt nach Design-Spezifikation.',
    practice: 'Ein Angebot mit „ca. 3 Wochen Software“ ohne Herleitung ist ein Risiko für Firma und Team. Ein SDD, das Kunde und Kollegen vorab gelesen haben, verhindert, dass bei der FAT über das Verhalten diskutiert wird.',
    transfer: {
      tia: 'Auch im TIA-Umfeld werden FB-Schnittstellen häufig vorab in Styleguides oder Bibliotheksdokumentationen festgelegt (z. B. Siemens-Bibliotheken wie LBC/LGF).',
      codesys: 'In CODESYS/TwinCAT werden Schnittstellen gern als INTERFACE deklariert; das Design-Dokument beschreibt dann Verträge und Fehlerverhalten.'
    },
    objectives: [
      {
        id: 'o1', title: 'Zerlege eine Aufgabe für die Schätzung',
        guide: {
          intro: 'Große Brocken schätzt niemand zuverlässig. Zerlege bis auf Pakete von 0,5 bis 3 Tagen.',
          steps: [
            'Gliedere nach Funktionen der Maschine (Stationen, Achsen, HMI, Kommunikation) und Querschnittsaufgaben (Alarme, Rezepte, Diagnose).',
            'Ergänze Aufgaben, die gern vergessen werden: Tests, Dokumentation, Reviews, FAT/SAT, Reisezeiten, Änderungen.',
            'Schätze jedes Paket mit Erfahrungswerten aus abgeschlossenen Projekten (Ist-Aufwände aus der Zeiterfassung).',
            'Markiere Pakete mit hoher Unsicherheit (neue Technologie, unklare Anforderungen).',
            'Summiere und vergleiche mit einem ähnlichen Altprojekt (Analogieschätzung).'
          ],
          done: 'Erledigt, wenn du für eine Beispielmaschine eine Liste von mindestens zehn Arbeitspaketen mit Schätzwert hast.',
          tip: 'Schätze Aufwand (Personentage), nicht Termine. Termine ergeben sich erst aus Aufwand, Verfügbarkeit und Abhängigkeiten.'
        }
      },
      {
        id: 'o2', title: 'Nutze Drei-Punkt-Schätzung und Teamschätzung',
        guide: {
          intro: 'Die Drei-Punkt-Schätzung (PERT) macht Unsicherheit sichtbar, Planning Poker nutzt das Wissen des Teams.',
          steps: [
            'Schätze je Paket optimistisch (O), wahrscheinlich (M) und pessimistisch (P).',
            'Berechne den Erwartungswert E = (O + 4·M + P) / 6 und als Streumaß (P − O) / 6.',
            'Planning Poker: Alle schätzen verdeckt, decken gleichzeitig auf, die Extreme begründen, dann neu schätzen.',
            'Dokumentiere Annahmen („Rezeptverwaltung mit mapp Recipe, keine Sonderformate“).',
            'Vergleiche nach Projektende Schätzung und Ist und lerne daraus.'
          ],
          done: 'Erledigt, wenn du für drei Pakete eine PERT-Schätzung mit Annahmen dokumentiert hast.',
          tip: 'Eine große Spanne zwischen O und P ist eine wertvolle Information – kläre die Ursache, statt sie wegzurechnen.',
          link: { label: 'Mountain Goat Software: Planning Poker', url: 'https://www.mountaingoatsoftware.com/agile/planning-poker' }
        }
      },
      {
        id: 'o3', title: 'Schreibe ein Software-Design-Dokument',
        guide: {
          intro: 'Ein SDD beschreibt, was gebaut wird und warum – so genau, dass ein Kollege es implementieren und ein Tester es prüfen kann.',
          steps: [
            'Gliederung angelehnt an arc42: Ziel/Kontext, Bausteinsicht, Schnittstellen, Laufzeitverhalten, Fehlerbehandlung, Entscheidungen, Risiken.',
            'Schnittstelle als Tabelle: Name, Typ, Richtung, Einheit, Wertebereich, Bedeutung.',
            'Verhalten als nummerierte Regeln oder Zustandsdiagramm – jede Regel ist später ein Testfall.',
            'Fehlerverhalten: Fehlernummern, sicherer Zustand, Quittierung.',
            'Lege das SDD als Markdown im Repository ab (z. B. `Doc/Design/SDD-VLV-01.md`) und lasse es reviewen.'
          ],
          done: 'Erledigt, wenn du für `FB_ValveCtrl` ein SDD mit Schnittstellentabelle und nummerierten Verhaltensregeln geschrieben hast.',
          tip: 'Schreib das SDD, bevor du programmierst. Wenn sich etwas nicht klar beschreiben lässt, ist es noch nicht verstanden.',
          link: { label: 'arc42 Overview', url: 'https://arc42.org/overview' }
        }
      },
      {
        id: 'o4', title: 'Implementiere exakt nach Spezifikation',
        guide: {
          intro: 'Ein guter Baustein tut genau das, was im SDD steht – nicht mehr, nicht weniger.',
          steps: [
            'Übernimm die Schnittstelle unverändert aus dem SDD.',
            'Implementiere Regel für Regel und kennzeichne sie im Kommentar (`(* 3: Timeout Oeffnen *)`).',
            'Prüfe die Reihenfolge (Reset → Timer → Fehler → Ausgänge) – sie bestimmt Grenzfälle.',
            'Teste jede Regel einzeln und die Kombinationen (Quittieren bei anstehender Ursache).',
            'Weicht die Implementierung vom SDD ab, wird zuerst das SDD geändert und reviewt.'
          ],
          done: 'Erledigt, wenn die Übung „Ventil mit Endlagenüberwachung“ alle Tests besteht.',
          tip: 'Fehler, die bei anstehender Ursache sofort wiederkommen, sind kein Bug, sondern Absicht – das muss im SDD stehen.'
        }
      }
    ],
    videos: [V.aufwand, V.planningPoker, V.arc42Innoq],
    readings: [R.glinzSchaetzung, R.arc42, R.planningPoker],
    quiz: [
      { type: 'numeric', q: 'Drei-Punkt-Schätzung: optimistisch {O} PT, wahrscheinlich {M} PT, pessimistisch {P} PT. Wie groß ist der PERT-Erwartungswert?',
        params: { O: [2, 5, 1], M: [6, 10, 1], P: [12, 20, 1] }, formula: '(O + 4 * M + P) / 6', unit: 'PT', tol: 0.01,
        explain: 'E = (O + 4·M + P) / 6.' },
      { type: 'multi', q: 'Was gehört in ein Software-Design-Dokument für einen Baustein?',
        options: ['Schnittstellentabelle mit Einheiten und Wertebereichen', 'Verhaltensregeln bzw. Zustandsdiagramm', 'Fehlerverhalten und sicherer Zustand', 'Die Gehaltsstufe des Entwicklers'], correct: [0, 1, 2],
        explain: 'Schnittstelle, Verhalten und Fehlerbehandlung sind der Kern eines SDD.' },
      { type: 'single', q: 'Warum decken beim Planning Poker alle gleichzeitig auf?',
        options: ['Um Zeit zu sparen', 'Damit niemand von der ersten genannten Zahl beeinflusst wird (Ankereffekt)', 'Weil es so im Pflichtenheft steht', 'Damit der Projektleiter entscheiden kann'], correct: 1,
        explain: 'Verdecktes Schätzen verhindert den Ankereffekt; die Diskussion der Extremwerte bringt verstecktes Wissen hervor.' }
    ],
    exam: [
      { type: 'single', q: 'Welche Aufgaben werden bei Software-Schätzungen für Maschinen am häufigsten vergessen?',
        options: ['Programmierung der Hauptfunktion', 'Tests, Dokumentation, Inbetriebnahme, Reisen und Änderungen', 'Das Anlegen des AS-Projekts', 'Die Auswahl der Steuerung'], correct: 1,
        explain: 'Gerade die Nebenaufgaben summieren sich oft auf einen großen Teil des Gesamtaufwands.' },
      { type: 'numeric', q: 'Für ein Paket gilt O = {O} PT und P = {P} PT. Wie groß ist die PERT-Standardabweichung (P − O)/6?',
        params: { O: [1, 5, 1], P: [8, 20, 1] }, formula: '(P - O) / 6', unit: 'PT', tol: 0.01, explain: 'σ ≈ (P − O) / 6.' },
      { type: 'single', q: 'Im SDD steht: „Bei Sensorfehler (beide Endlagen) sofort Fehler 3.“ Die Implementierung meldet erst nach 1 s. Was tust du?',
        options: ['Den Test anpassen', 'Die Implementierung korrigieren; gibt es einen fachlichen Grund für die Verzögerung, zuerst das SDD ändern und reviewen lassen', 'Nichts, 1 s ist ausreichend schnell', 'Den Fehler deaktivieren'], correct: 1,
        explain: 'Spezifikation und Code müssen übereinstimmen. Änderungen am Verhalten gehen über das Dokument.' },
      { type: 'multi', q: 'Welche Regeln für Schätzungen sind sinnvoll?',
        options: ['Annahmen dokumentieren', 'Unsicherheiten offen benennen', 'Schätzung nach Projektende mit dem Ist vergleichen', 'Möglichst niedrig schätzen, um den Auftrag zu bekommen'], correct: [0, 1, 2],
        explain: 'Bewusst zu niedrige Schätzungen verlagern das Problem nur in die Inbetriebnahme.' }
    ],
    exercises: [exValve],
    proof: false
  },
  {
    id: 'praxis-4-normen', level: 4, kind: 'lektion',
    title: 'Normen-Überblick: Maschinenverordnung, EN 60204-1 und die Rolle der Software im CE-Prozess',
    summary: 'Orientierung, welche Regelwerke für Maschinensoftware relevant sind und was das für deine tägliche Arbeit bedeutet – keine Rechtsberatung.',
    minutes: 150, req: ['praxis-3-abnahme'],
    briefing: 'Maschinen dürfen in der EU nur mit CE-Kennzeichnung in Verkehr gebracht werden. Bisher regelte das die Maschinenrichtlinie 2006/42/EG; ab dem 20. Januar 2027 gilt die Maschinenverordnung (EU) 2023/1230, die Software ausdrücklich stärker berücksichtigt – etwa bei Sicherheitsbauteilen, Schutz vor Manipulation und der Pflicht, sicherheitsrelevanten Quellcode bzw. Programmierlogik Behörden auf Anfrage bereitzustellen. Harmonisierte Normen wie die EN 60204-1 (elektrische Ausrüstung) konkretisieren Anforderungen, etwa zu Stopp-Kategorien und Wiederanlauf. Dieses Modul gibt dir Orientierung; verbindliche Bewertungen treffen die Verantwortlichen im Unternehmen – dies ist keine Rechtsberatung.',
    practice: 'Ein Software-Update, das eine Sicherheitsfunktion oder die bestimmungsgemäße Verwendung verändert, kann eine Neubewertung der Risikobeurteilung erfordern. Deshalb gehört „Normrelevanz prüfen“ in jeden Change Request.',
    transfer: {
      tia: 'Die regulatorischen Anforderungen sind herstellerunabhängig – sie gelten für TIA-, CODESYS- und B&R-Projekte gleichermaßen.',
      codesys: 'Auch für CODESYS-Safety oder TwinCAT Safety gelten die gleichen Normen; Unterschiede liegen nur in den Werkzeugen für den Nachweis.'
    },
    objectives: [
      {
        id: 'o1', title: 'Ordne die Regelwerke ein',
        guide: {
          intro: 'Gesetz (Verordnung) → harmonisierte Normen → Firmenstandards. Wer die Hierarchie kennt, weiß, wo welche Antwort steht.',
          steps: [
            'Verordnung (EU) 2023/1230: legt grundlegende Sicherheits- und Gesundheitsschutzanforderungen fest; gilt ab 20.01.2027 unmittelbar in allen EU-Staaten.',
            'Bis dahin: Maschinenrichtlinie 2006/42/EG, in Deutschland über das ProdSG/9. ProdSV umgesetzt.',
            'Harmonisierte Normen (z. B. EN ISO 12100 Risikobeurteilung, EN ISO 13849-1 Sicherheitsfunktionen, EN 60204-1 elektrische Ausrüstung) lösen die Vermutungswirkung aus.',
            'Lies die IHK-Kurzinformation zur Maschinenverordnung und markiere alle Stellen, die Software betreffen.',
            'Notiere: Wer im Unternehmen ist für CE-Konformität verantwortlich? (Meist Konstruktion/Produktsicherheit, nicht die Software allein.)'
          ],
          done: 'Erledigt, wenn du die drei Ebenen mit je einem Beispiel und die verantwortliche Stelle in deinem Unternehmen benennen kannst.',
          tip: 'Normtexte sind urheberrechtlich geschützt und kostenpflichtig. Arbeite mit den offiziellen Fassungen aus der Firmenbibliothek, nicht mit Kopien aus dem Internet.',
          link: { label: 'IHK Nürnberg: Themakompakt EU-Maschinenverordnung', url: 'https://ihk-nuernberg.de/fileadmin/IHK_Nuernberg/Innovation-Technologie-Forschung/Dokumente/IHK-ThemanKompatk_Maschinen-Verordnung_EU_2023.pdf' }
        }
      },
      {
        id: 'o2', title: 'Verstehe die Rolle der Software im CE-Prozess',
        guide: {
          intro: 'Software liefert Beiträge zur technischen Dokumentation und zu Schutzmaßnahmen – sie ersetzt aber nicht die Risikobeurteilung.',
          steps: [
            'Risikobeurteilung (EN ISO 12100): Die Software-Abteilung liefert Informationen über Betriebsarten, Bedienabläufe und Fehlerreaktionen.',
            'Sicherheitsfunktionen werden in der Sicherheitssteuerung (z. B. SafeLOGIC/mapp Safety) mit validierten Bausteinen realisiert und nach EN ISO 13849 bewertet.',
            'Standard-Software ergänzt betrieblich (Wiederanlaufsperre, Meldungen, definierte Zustände) – ohne Sicherheitsfunktion zu sein.',
            'Dokumentation: Software-Stände, Änderungsnachweise, Validierungsprotokolle gehören in die technischen Unterlagen.',
            'Schutz vor Manipulation: Zugangsschutz, Benutzerrollen und Nachweis von Eingriffen (z. B. Protokollierung von Änderungen) einplanen.'
          ],
          done: 'Erledigt, wenn du für ein Projekt aufgelistet hast, welche Software-Dokumente in die technischen Unterlagen einfließen.',
          tip: 'Nach Maschinenverordnung müssen Quellcodes bzw. Programmierlogik, die für Sicherheitsanforderungen relevant sind, auf begründete Anfrage einer Behörde bereitgestellt werden können – sauber versionierte Repositories sind dafür Voraussetzung.',
          link: { label: 'EU-Kommission: Machinery', url: 'https://single-market-economy.ec.europa.eu/sectors/mechanical-engineering/machinery_en' }
        }
      },
      {
        id: 'o3', title: 'Kenne die software-relevanten Inhalte der EN 60204-1',
        guide: {
          intro: 'Die EN 60204-1 betrifft vor allem die elektrische Ausrüstung, enthält aber Anforderungen, die direkt das Steuerungsverhalten berühren.',
          steps: [
            'Stopp-Kategorien 0, 1 und 2: Was ist der Unterschied (sofortiges Abschalten der Energie, gesteuertes Stillsetzen mit anschließender Abschaltung, Stillsetzen mit Energie)?',
            'Wiederanlauf: Das Rücksetzen eines Stopps bzw. die Spannungswiederkehr darf keinen gefährlichen Wiederanlauf auslösen.',
            'Betriebsarten und Steuerfunktionen im Fehlerfall: definierte Reaktionen statt undefinierter Zustände.',
            'Prüfungen der elektrischen Ausrüstung (Schutzleiter, Isolation, Funktion) vor der Inbetriebnahme – Aufgabe der Elektrofachkraft.',
            'Prüfe im Normdatenblatt den aktuellen Ausgabestand der Norm und frag nach, welche Ausgabe im Projekt gilt.'
          ],
          done: 'Erledigt, wenn du die drei Stopp-Kategorien erklären und die Übung „Wiederanlaufsperre“ gelöst hast.',
          tip: 'Bei jeder Funktion, die „Anlauf“ auslösen kann, frag dich: Was passiert nach Spannungsausfall, nach Not-Halt, nach Schutztür auf/zu?',
          link: { label: 'DIN Media: DIN EN 60204-1 (Normdatenblatt)', url: 'https://www.dinmedia.de/de/norm/din-en-60204-1/400530593' }
        }
      },
      {
        id: 'o4', title: 'Prüfe Software-Änderungen auf Normrelevanz',
        guide: {
          intro: 'Nicht jede Änderung ist kritisch – aber jede muss daraufhin geprüft werden.',
          steps: [
            'Ergänze dein Change-Request-Formular um die Frage: „Betrifft die Änderung Sicherheitsfunktionen, Betriebsarten oder die bestimmungsgemäße Verwendung?“',
            'Bei Ja: Produktsicherheit/Konstruktion einbeziehen, Risikobeurteilung prüfen lassen.',
            'Änderungen an Sicherheitsprogrammen nur nach dem Prozess für Sicherheitssoftware (Validierung, Prüfsummen, Freigabe).',
            'Dokumentiere die Entscheidung mit Datum und Namen im Change Request.',
            'Halte fest, welche Version an welcher Maschine läuft (Seriennummer ↔ Software-Stand).'
          ],
          done: 'Erledigt, wenn dein Change-Request-Formular eine Normrelevanz-Prüfung enthält.',
          tip: 'Im Zweifel fragen. Die Einordnung einer „wesentlichen Veränderung“ ist eine Fachentscheidung der Verantwortlichen, keine Entscheidung des Programmierers allein.'
        }
      }
    ],
    videos: [V.dguvCe, V.eaton60204, V.mbtMvo],
    readings: [R.ihkMvo, R.euMachinery, R.din60204],
    quiz: [
      { type: 'single', q: 'Ab wann gilt die Maschinenverordnung (EU) 2023/1230 in vollem Umfang?', options: ['29. Juni 2023', '20. Januar 2027', '1. Januar 2025', 'Sie ersetzt die Richtlinie nicht'], correct: 1,
        explain: 'Die Verordnung wurde 2023 veröffentlicht und gilt im Wesentlichen ab dem 20. Januar 2027.' },
      { type: 'single', q: 'Welche Aussage zur Wiederanlaufsperre ist richtig?',
        options: ['Nach Spannungswiederkehr soll die Maschine automatisch weiterlaufen', 'Das Rücksetzen eines Stopps bzw. die Spannungswiederkehr darf keinen gefährlichen Wiederanlauf auslösen; ein separater Startbefehl ist nötig', 'Die Wiederanlaufsperre ersetzt die Sicherheitssteuerung', 'Sie ist nur für Hydraulik relevant'], correct: 1,
        explain: 'Quittieren und Starten sind getrennte Handlungen. Die Sperre ist eine betriebliche Ergänzung.' },
      { type: 'multi', q: 'Welche Software-Beiträge gehören typischerweise zu den technischen Unterlagen einer Maschine?',
        options: ['Versionierte Software-Stände', 'Validierungs- bzw. Testprotokolle', 'Beschreibung von Betriebsarten und Fehlerreaktionen', 'Private Notizen des Programmierers'], correct: [0, 1, 2],
        explain: 'Nachvollziehbare, versionierte Nachweise – keine privaten Notizen.' }
    ],
    exam: [
      { type: 'single', q: 'Was bedeutet Stopp-Kategorie 1 nach EN 60204-1?',
        options: ['Sofortiges Abschalten der Energie', 'Gesteuertes Stillsetzen, danach Abschalten der Energie', 'Stillsetzen, Energie bleibt erhalten', 'Kein Stopp'], correct: 1,
        explain: 'Kategorie 0 = sofort, Kategorie 1 = gesteuert stillsetzen und dann abschalten, Kategorie 2 = stillsetzen mit Energie.' },
      { type: 'single', q: 'Wer entscheidet in der Regel, ob eine Software-Änderung eine wesentliche Veränderung darstellt?',
        options: ['Der Programmierer allein', 'Die im Unternehmen verantwortlichen Stellen auf Basis der Risikobeurteilung', 'Der Steuerungshersteller', 'Niemand, Software ist nie relevant'], correct: 1,
        explain: 'Das ist eine Fachentscheidung mit rechtlicher Tragweite; die Software liefert die Informationen.' },
      { type: 'multi', q: 'Welche Anforderungen der Maschinenverordnung betreffen Software besonders?',
        options: ['Schutz vor Korrumpierung/Manipulation', 'Bereitstellung sicherheitsrelevanter Quellcodes bzw. Programmierlogik auf Anfrage der Behörde', 'Software als Sicherheitsbauteil, wenn separat in Verkehr gebracht', 'Pflicht zur Programmierung in ST'], correct: [0, 1, 2],
        explain: 'Eine Programmiersprache schreibt die Verordnung nicht vor.' },
      { type: 'single', q: 'Warum werden Normen in den Lerninhalten nur referenziert und nicht zitiert?',
        options: ['Weil sie unwichtig sind', 'Weil Normtexte urheberrechtlich geschützt sind und nur die offiziellen Ausgaben verbindlich sind', 'Weil sie nur auf Englisch existieren', 'Weil sie jedes Jahr ungültig werden'], correct: 1,
        explain: 'Verbindlich ist immer die gültige, offizielle Ausgabe.' }
    ],
    exercises: [exRestart],
    proof: false
  },
  {
    id: 'praxis-4-technische-schulden', level: 4, kind: 'projekt',
    title: 'Technische Schulden erkennen und abbauen',
    summary: 'Schulden im Code benennen, priorisieren und mit einem sicheren Refactoring abtragen.',
    minutes: 240, req: ['praxis-4-schaetzung-design'],
    briefing: 'Technische Schulden entstehen, wenn kurzfristige Lösungen langfristig Mehraufwand erzeugen: kopierter Code, fehlende Tests, veraltete Bibliotheken, unklare Namen. Wie bei finanziellen Schulden fallen „Zinsen“ an – jede Änderung dauert länger und ist fehleranfälliger. Martin Fowlers Schulden-Quadrant hilft zu unterscheiden, ob Schulden bewusst und umsichtig oder leichtsinnig entstanden sind. In diesem Praxisprojekt findest du Schulden in einer realistischen Motorsteuerung, baust Copy-Paste-Code in einen wiederverwendbaren Funktionsbaustein um und dokumentierst Aufwand und Nutzen für das Management.',
    practice: 'Der vierte Motor kommt fast immer – und mit Copy-Paste kopiert man auch die Fehler. Wer vorher in einen FB investiert, spart bei jeder weiteren Variante.',
    transfer: {
      tia: 'In TIA Portal entspricht das dem Umbau von kopierten Netzwerken in einen FB mit Instanz-DBs bzw. Multiinstanzen und der Ablage in einer Bibliothek.',
      codesys: 'In CODESYS/TwinCAT werden FBs mit Instanzen oder Arrays von FBs genutzt; Bibliotheken (.library/.compiled-library) machen sie projektübergreifend verfügbar.'
    },
    objectives: [
      {
        id: 'o1', title: 'Erkenne typische technische Schulden in SPS-Projekten',
        guide: {
          intro: 'Schulden haben Symptome – du musst sie nur sehen.',
          steps: [
            'Suche Copy-Paste: mit **Bearbeiten › Suchen und Ersetzen › Suchen in Dateien** (Umschalt+Strg+F) nach wiederkehrenden Mustern, z. B. `tonFb`.',
            'Prüfe mit dem Querverweis (**Strg+Alt+R**) Variablen, die an vielen Stellen geschrieben werden.',
            'Suche auskommentierten Altcode, `TODO`-Marker und magische Zahlen.',
            'Liste veraltete Bibliotheks- und AS-Versionen (Upgrade-Schulden).',
            'Notiere fehlende Tests und Dokumentation als eigene Schuldenposten.'
          ],
          done: 'Erledigt, wenn du in der Übungsaufgabe mindestens vier Schuldenposten benannt hast.',
          tip: 'Kopien sind am gefährlichsten, wenn sie fast gleich sind – kleine Abweichungen sind oft Kopierfehler.',
          link: { label: 'B&R Help: Querverweis', url: help('projectmanagement/output/desktop_output_crossreference.html') }
        }
      },
      {
        id: 'o2', title: 'Bewerte und priorisiere Schulden',
        guide: {
          intro: 'Nicht jede Schuld muss sofort getilgt werden. Entscheidend ist das Verhältnis von Zinsen zu Tilgungsaufwand.',
          steps: [
            'Ordne jeden Posten im Fowler-Quadranten ein (bewusst/unbewusst, umsichtig/leichtsinnig).',
            'Schätze die „Zinsen“: Wie oft wird der Code geändert? Wie viel Mehraufwand entsteht pro Änderung?',
            'Schätze den Tilgungsaufwand (Refactoring + Test).',
            'Priorisiere: hohe Zinsen und kleiner Aufwand zuerst; Schulden mit Sicherheitsbezug immer zuerst.',
            'Führe ein Schuldenregister (Ticket-Label `tech-debt`), damit nichts verloren geht.'
          ],
          done: 'Erledigt, wenn deine Schuldenliste für jeden Posten Zinsen, Aufwand und Priorität enthält.',
          tip: 'Sprich mit dem Management in Zahlen: „Jeder neue Motor kostet uns heute 2 h statt 15 min und hat ein Fehlerrisiko.“',
          link: { label: 'Martin Fowler: Technical Debt Quadrant', url: 'https://martinfowler.com/bliki/TechnicalDebtQuadrant.html' }
        }
      },
      {
        id: 'o3', title: 'Führe das Refactoring sicher durch',
        guide: {
          intro: 'Sicheres Refactoring: erst Tests, dann kleine Schritte, nach jedem Schritt testen.',
          steps: [
            'Lege einen Branch an, z. B. `refactor/fb-motorctrl`.',
            'Schreibe bzw. nutze Tests, die das aktuelle Verhalten festhalten (Charakterisierungstests).',
            'Lege den FB im Logical View über das Kontextmenü als neues Objekt an und verschiebe die Logik eines Motors hinein.',
            'Ersetze Motor für Motor, übersetze mit **F7** und teste nach jedem Schritt.',
            'Ergänze danach den vierten Motor – jetzt eine Zeile statt eines Kopierblocks.'
          ],
          done: 'Erledigt, wenn die Übung „Copy-Paste zu Funktionsbaustein“ alle Tests besteht.',
          tip: 'Behebst du beim Refactoring einen Fehler (hier Motor 3), dokumentiere ihn separat – es ist eine Verhaltensänderung, die der Kunde merkt.'
        }
      },
      {
        id: 'o4', title: 'Dokumentiere und reiche das Projekt ein',
        guide: {
          intro: 'Ein Refactoring ist erst fertig, wenn andere verstehen, was geändert wurde und warum.',
          steps: [
            'Beschreibe im Merge-Request: Ziel, Vorgehen, gefundene Fehler, Testergebnis.',
            'Schätze die künftige Einsparung (z. B. pro weiterem Motor).',
            'Lege die FB-Schnittstelle im Design-Dokument bzw. in der Bibliotheksdokumentation ab.',
            'Lass das Refactoring reviewen.',
            'Reiche den Link zum Merge-Request auf git.breitner.de als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Merge-Request mit Beschreibung, Test und Schuldenliste als Nachweis eingereicht ist.',
          tip: 'Pfadfinderregel: Hinterlasse Code etwas besser, als du ihn vorgefunden hast – aber in einem eigenen Commit.'
        }
      }
    ],
    videos: [V.wolffDebt, V.tielkeRefactoring, V.plcopenLibs],
    readings: [R.fowlerDebt, R.fowlerQuadrant, R.brReuse],
    quiz: [
      { type: 'single', q: 'Welcher Fehler ist hier durch Copy-Paste entstanden?',
        code: { lang: 'st', text: 'tonFb3(IN := doMotor3 AND NOT diFb3, PT := T#1s);\nIF tonFb2.Q THEN\n\tbFault3 := TRUE;\nEND_IF' },
        options: ['Die Zeit T#1s ist zu kurz', 'Motor 3 fragt den Timer von Motor 2 ab und erkennt eine fehlende Rückmeldung nie', 'NOT ist falsch gesetzt', 'Kein Fehler'], correct: 1,
        explain: 'tonFb2.Q statt tonFb3.Q – ein typischer Kopierfehler, den ein FB unmöglich macht.' },
      { type: 'multi', q: 'Was sind technische Schulden?', options: ['Kopierter, fast identischer Code', 'Fehlende automatische Tests', 'Veraltete Bibliotheksversionen', 'Ein sauber dokumentierter FB'], correct: [0, 1, 2],
        explain: 'Ein dokumentierter, getesteter FB ist das Gegenteil von Schulden.' },
      { type: 'single', q: 'Was gehört an den Anfang eines Refactorings?', options: ['Alles auf einmal umschreiben', 'Tests, die das aktuelle Verhalten festhalten', 'Neue Funktionen einbauen', 'Die Kommentare löschen'], correct: 1,
        explain: 'Ohne Tests weißt du nicht, ob das Verhalten erhalten blieb.' }
    ],
    exam: [
      { type: 'single', q: 'Im Fowler-Quadranten: „Wir wissen, dass es unsauber ist, liefern aber jetzt und räumen nach der FAT auf.“ Welche Art Schuld ist das?',
        options: ['Leichtsinnig und unbewusst', 'Umsichtig und bewusst', 'Leichtsinnig und bewusst', 'Umsichtig und unbewusst'], correct: 1,
        explain: 'Die Schuld wird bewusst und mit Plan zur Tilgung eingegangen.' },
      { type: 'numeric', q: 'Ein Copy-Paste-Motor kostet {A} min, ein neuer FB-Aufruf 15 min. Das Refactoring kostet {R} min. Ab wie vielen zusätzlichen Motoren lohnt es sich (Break-even, aufgerundet nicht nötig)?',
        params: { A: [60, 180, 30], R: [240, 600, 60] }, formula: 'R / (A - 15)', unit: 'Motoren', tol: 0.02,
        explain: 'Break-even = Refactoring-Aufwand / Einsparung pro Motor.' },
      { type: 'multi', q: 'Welche Vorteile bringt die Umstellung auf FB-Instanzen?',
        options: ['Logik existiert nur einmal', 'Fehlerkorrekturen wirken für alle Motoren', 'Neue Motoren sind ein Aufruf mehr', 'Die Zykluszeit sinkt immer auf null'], correct: [0, 1, 2],
        explain: 'Die Zykluszeit bleibt ungefähr gleich; der Gewinn liegt in Wartbarkeit und Fehlerfreiheit.' },
      { type: 'single', q: 'Wann sollte eine Schuld mit Sicherheitsbezug abgebaut werden?', options: ['Wenn Zeit ist', 'Mit höchster Priorität', 'Nie, sie ist ja bekannt', 'Nach der nächsten Maschine'], correct: 1,
        explain: 'Sicherheitsrelevante Mängel haben immer Vorrang.' }
    ],
    exercises: [exDebt],
    proof: true,
    badge: 'Refactoring-Praxis'
  }
];
