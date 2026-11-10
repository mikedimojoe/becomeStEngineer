'use strict';
const { R, V, pulse, help } = require('./_sources');

// ---------------------------------------------------------------------------
// Level 6 – Guru: Lehren & Mentoring, technische Führung, Eskalationen, Meta-Aufgabe Lernplattform
// ---------------------------------------------------------------------------

const batchTyp = 'TYPE\n\tBatchState_enum :\n\t\t(\n\t\tBS_IDLE,\n\t\tBS_FILL,\n\t\tBS_MIX,\n\t\tBS_DRAIN\n\t\t);\nEND_TYPE\n';
const batchVarBase = 'VAR\n\teState : BatchState_enum;\n\tnBatchCount : UDINT;\n\trtStart : R_TRIG;\n\ttonMix : TON;\nEND_VAR\n\nVAR CONSTANT\n\tFILL_LEVEL : REAL := 60.0; (* % *)\n\tMIX_TIME : TIME := T#1s;\nEND_VAR\n';

const exJunior = {
  id: 'ex1', type: 'st', variant: 'fehlersuche',
  title: 'Mentoring-Fall: Chargensteuerung eines Juniors',
  task: [
    'Ein Junior hat seine erste Chargensteuerung geschrieben (Füllen → Mischen → Entleeren). Beim ersten Durchlauf scheint alles zu funktionieren – trotzdem melden die Bediener Probleme. Deine Aufgabe als Mentor: **Finde die Ursachen, behebe sie und bereite für jede eine kurze Erklärung vor**, die das zugrunde liegende Prinzip vermittelt (nicht nur die Korrektur).',
    '',
    '**Bedienermeldungen:**',
    '1. „Der Chargenzähler zeigt nach einer Charge 300 statt 1.“',
    '2. „Ab der zweiten Charge wird gar nicht mehr gemischt.“',
    '3. „Wenn ich beim Füllen Stopp drücke, läuft die Pumpe weiter.“',
    '',
    '**Sollverhalten:** Start (steigende Flanke `diStart`, nur in `BS_IDLE` und bei `diStop` = TRUE) → `BS_FILL` (Zulauf bis `FILL_LEVEL`) → `BS_MIX` (Rührwerk für `MIX_TIME`) → `BS_DRAIN` (Ablauf bis `diLsLow`) → `BS_IDLE`, Chargenzähler + 1. `diStop` = FALSE (Öffner) → sofort `BS_IDLE`, alle Ausgänge aus.',
    '',
    'Die drei Fehler stehen für drei typische Lernthemen: Flanke vs. Zustand, Timer-Aufruf in CASE, Ausgänge aus dem Zustand ableiten.'
  ].join('\n'),
  hints: [
    'Meldung 1: Wie oft wird der Code in `BS_IDLE` ausgeführt, solange `bBatchDone` TRUE ist?',
    'Meldung 2: Wann wird `tonMix` mit `IN := FALSE` aufgerufen?',
    'Meldung 3: Wer setzt `doInlet` zurück, wenn der Zustand von außen auf `BS_IDLE` gesetzt wird?'
  ],
  cycleMs: 10,
  io: [
    { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Taster Charge starten', widget: 'button' },
    { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Taster Stopp (Öffner)', widget: 'switch', init: true },
    { name: 'diLsLow', type: 'BOOL', dir: 'in', label: 'Grenzschalter leer', widget: 'led' },
    { name: 'rLevel', type: 'REAL', dir: 'in', label: 'Füllstand', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'doInlet', type: 'BOOL', dir: 'out', label: 'Zulaufventil', widget: 'led' },
    { name: 'doMixer', type: 'BOOL', dir: 'out', label: 'Rührwerk', widget: 'led' },
    { name: 'doOutlet', type: 'BOOL', dir: 'out', label: 'Ablaufpumpe', widget: 'led' }
  ],
  scene: { type: 'tank', bind: { level: 'rLevel', inlet: 'doInlet', outlet: 'doOutlet', mixer: 'doMixer', lsLow: 'diLsLow' } },
  plant: {
    var: 'VAR\n\trFlow : REAL := 0.5;\nEND_VAR\n',
    code: 'IF doInlet THEN rLevel := rLevel + rFlow; END_IF\nIF doOutlet THEN rLevel := rLevel - rFlow; END_IF\nIF rLevel > 100.0 THEN rLevel := 100.0; END_IF\nIF rLevel < 0.0 THEN rLevel := 0.0; END_IF\ndiLsLow := rLevel <= 1.0;\n'
  },
  files: {
    main: `PROGRAM _INIT
	eState := BS_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	CASE eState OF
	BS_IDLE:
		IF bBatchDone THEN
			nBatchCount := nBatchCount + 1;
		END_IF
		IF rtStart.Q THEN
			bBatchDone := FALSE;
			eState := BS_FILL;
		END_IF
	BS_FILL:
		doInlet := TRUE;
		IF rLevel >= FILL_LEVEL THEN
			doInlet := FALSE;
			eState := BS_MIX;
		END_IF
	BS_MIX:
		doMixer := TRUE;
		tonMix(IN := TRUE, PT := MIX_TIME);
		IF tonMix.Q THEN
			doMixer := FALSE;
			eState := BS_DRAIN;
		END_IF
	BS_DRAIN:
		doOutlet := TRUE;
		IF diLsLow THEN
			doOutlet := FALSE;
			bBatchDone := TRUE;
			eState := BS_IDLE;
		END_IF
	END_CASE

	IF NOT diStop THEN
		eState := BS_IDLE;
	END_IF
END_PROGRAM
`,
    var: batchVarBase + '\nVAR\n\tbBatchDone : BOOL;\nEND_VAR\n',
    typ: batchTyp
  },
  solution: {
    main: `(* Chargensteuerung: Fuellen -> Mischen -> Entleeren *)
PROGRAM _INIT
	eState := BS_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	(* Lernthema 2: Timer jeden Zyklus aufrufen, IN aus dem Zustand ableiten -> wird beim Verlassen zurueckgesetzt *)
	tonMix(IN := (eState = BS_MIX), PT := MIX_TIME);

	IF NOT diStop THEN
		eState := BS_IDLE;
	END_IF

	CASE eState OF
	BS_IDLE:
		IF rtStart.Q AND diStop THEN
			eState := BS_FILL;
		END_IF
	BS_FILL:
		IF rLevel >= FILL_LEVEL THEN
			eState := BS_MIX;
		END_IF
	BS_MIX:
		IF tonMix.Q THEN
			eState := BS_DRAIN;
		END_IF
	BS_DRAIN:
		IF diLsLow THEN
			(* Lernthema 1: Ereignis (Uebergang) zaehlen, nicht Zustand *)
			nBatchCount := nBatchCount + 1;
			eState := BS_IDLE;
		END_IF
	END_CASE

	(* Lernthema 3: Ausgaenge aus dem Zustand ableiten - kein Ausgang bleibt haengen *)
	doInlet := (eState = BS_FILL);
	doMixer := (eState = BS_MIX);
	doOutlet := (eState = BS_DRAIN);
END_PROGRAM
`,
    var: batchVarBase,
    typ: batchTyp
  },
  tests: [
    { name: 'Meldung 1: eine Charge = Zähler 1', steps: [
      { cycles: 2 }, ...pulse('diStart', 1),
      { until: 'doOutlet', maxMs: 5000, msg: 'Die Charge erreicht das Entleeren nicht.' },
      { until: 'NOT doOutlet', maxMs: 4000, msg: 'Entleeren endet nicht.' },
      { cycles: 20 },
      { expect: 'nBatchCount = 1 AND eState = BS_IDLE', msg: 'Nach genau einer Charge muss nBatchCount = 1 sein.' }
    ] },
    { name: 'Meldung 2: zweite Charge wird gemischt', steps: [
      { cycles: 2 }, ...pulse('diStart', 1),
      { until: 'eState = BS_IDLE AND NOT doOutlet AND diLsLow', maxMs: 8000 },
      { cycles: 5 }, ...pulse('diStart', 1),
      { until: 'doMixer', maxMs: 4000, msg: 'In der zweiten Charge muss das Rührwerk anlaufen.' },
      { never: 'doOutlet', ms: 400, msg: 'Die zweite Charge muss wieder ≈ 1 s mischen – wird tonMix zurückgesetzt?' }
    ] },
    { name: 'Meldung 3: Stopp beim Füllen schaltet alles aus', steps: [
      { cycles: 2 }, ...pulse('diStart', 1), { ms: 300 },
      { expect: 'doInlet', msg: 'Nach dem Start muss gefüllt werden.' },
      { set: { diStop: false } }, { cycles: 2 },
      { expect: 'eState = BS_IDLE AND NOT doInlet AND NOT doMixer AND NOT doOutlet', msg: 'Stopp muss sofort alle Ausgänge abschalten.' }
    ] },
    { name: 'Kein Start bei betätigtem Stopp', steps: [
      { set: { diStop: false } }, { cycles: 2 }, ...pulse('diStart', 1),
      { expect: 'eState = BS_IDLE AND NOT doInlet', msg: 'Bei betätigtem Stopp darf keine Charge starten.' }
    ] }
  ]
};

const ffVar = 'VAR\n\tnFirstFault : INT;     (* 0 = kein Fehler, sonst Nummer des Erstfehlers 1..4 *)\n\tnFaultEvents : UDINT;  (* Anzahl Erstfehler-Ereignisse *)\n\taRing : ARRAY[0..9] OF INT;   (* Vorgeschichte aiPressure *)\n\taFrozen : ARRAY[0..9] OF INT; (* eingefrorene Aufzeichnung, [0] = aeltester Wert *)\n\tnFrozenSamples : INT;\n\tbFrozen : BOOL;\nEND_VAR\n\nVAR CONSTANT\n\tRING_SIZE : INT := 10;\n\tPOST_SAMPLES : INT := 3; (* Werte nach dem Ausloesen *)\nEND_VAR\n';

const exFirstFault = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Erstfehler-Erkennung mit eingefrorener Vorgeschichte',
  task: [
    'Eskalation beim Kunden: Eine Anlage stoppt sporadisch, alle vier Störmeldungen stehen gleichzeitig an, niemand weiß, was zuerst kam. Der Kunde verlangt bis morgen eine belastbare Aussage. Du baust eine **Erstfehler-Erkennung** (First-Out) mit einer **Aufzeichnung des Prozesswerts** vor und nach dem Fehler – wie ein Trace mit Trigger.',
    '',
    '**Erstfehler:**',
    '- Solange `nFirstFault = 0` ist, wird bei einem anstehenden Fehler `diFault1`…`diFault4` dessen Nummer gespeichert; bei gleichzeitigen Fehlern im selben Zyklus die **niedrigste** Nummer. Spätere Fehler überschreiben den Erstfehler nicht. `nFaultEvents` + 1, `doFirstOut` zeigt `nFirstFault <> 0`.',
    '- `diAck` (Pegel) löscht Erstfehler und Aufzeichnung nur, wenn **kein** Fehler mehr ansteht.',
    '',
    '**Aufzeichnung (pro Zyklus):**',
    '- Solange nicht eingefroren, wird zuerst `aiPressure` in den Ringpuffer `aRing[0..9]` geschrieben (danach erst die Fehlerauswertung).',
    '- Nach dem Auslösen werden noch `POST_SAMPLES` = 3 weitere Werte aufgezeichnet, dann wird eingefroren: `aFrozen[0..9]` enthält die letzten Werte **chronologisch** (ältester zuerst), `nFrozenSamples` die Anzahl gültiger Werte, `bFrozen` = TRUE. Waren weniger als 10 Werte aufgezeichnet, stehen sie ab `aFrozen[0]`, der Rest ist 0.',
    '- Eingefroren wird nicht weiter aufgezeichnet.'
  ].join('\n'),
  hints: [
    'Schreibindex `nIdx` und Anzahl `nSamples` (max. 10) wie beim Ringpuffer; ältester Eintrag bei vollem Puffer: `aRing[(nIdx + k) MOD RING_SIZE]`.',
    'Ablauf pro Zyklus: Quittieren → (nicht eingefroren?) Wert aufzeichnen und ggf. Nachlauf zählen/einfrieren → Erstfehler auswerten.',
    'Für den Nachlauf: `bTriggered` und `nPost`. Im Auslösezyklus ist der aktuelle Wert schon aufgezeichnet, `nPost` beginnt bei 0.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diFault1', type: 'BOOL', dir: 'in', label: 'Störung 1: Druck zu niedrig', widget: 'switch' },
    { name: 'diFault2', type: 'BOOL', dir: 'in', label: 'Störung 2: Motorschutz Pumpe', widget: 'switch' },
    { name: 'diFault3', type: 'BOOL', dir: 'in', label: 'Störung 3: Ventil Endlage', widget: 'switch' },
    { name: 'diFault4', type: 'BOOL', dir: 'in', label: 'Störung 4: Füllstand', widget: 'switch' },
    { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
    { name: 'aiPressure', type: 'INT', dir: 'in', label: 'Druck (Rohwert)', widget: 'slider', min: 0, max: 32767 },
    { name: 'doFirstOut', type: 'BOOL', dir: 'out', label: 'Erstfehler gespeichert', widget: 'led' }
  ],
  files: {
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Quittieren, Aufzeichnung mit Nachlauf und Einfrieren, Erstfehler *)\n\n\tdoFirstOut := (nFirstFault <> 0);\nEND_PROGRAM\n',
    var: ffVar,
    typ: ''
  },
  solution: {
    main: `(* Erstfehler-Erkennung mit Vorgeschichte (Trace mit Trigger und Nachlauf) *)
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	bAnyFault := diFault1 OR diFault2 OR diFault3 OR diFault4;

	(* Quittieren nur ohne anstehenden Fehler *)
	IF diAck AND NOT bAnyFault THEN
		nFirstFault := 0;
		bTriggered := FALSE;
		bFrozen := FALSE;
		nPost := 0;
		nIdx := 0;
		nSamples := 0;
		nFrozenSamples := 0;
		FOR k := 0 TO RING_SIZE - 1 DO
			aRing[k] := 0;
			aFrozen[k] := 0;
		END_FOR
	END_IF

	(* Aufzeichnung *)
	IF NOT bFrozen THEN
		aRing[nIdx] := aiPressure;
		nIdx := (nIdx + 1) MOD RING_SIZE;
		IF nSamples < RING_SIZE THEN
			nSamples := nSamples + 1;
		END_IF
		IF bTriggered THEN
			nPost := nPost + 1;
			IF nPost >= POST_SAMPLES THEN
				(* chronologisch einfrieren *)
				FOR k := 0 TO RING_SIZE - 1 DO
					IF nSamples < RING_SIZE THEN
						IF k < nSamples THEN
							aFrozen[k] := aRing[k];
						ELSE
							aFrozen[k] := 0;
						END_IF
					ELSE
						aFrozen[k] := aRing[(nIdx + k) MOD RING_SIZE];
					END_IF
				END_FOR
				nFrozenSamples := nSamples;
				bFrozen := TRUE;
			END_IF
		END_IF
	END_IF

	(* Erstfehler: niedrigste Nummer gewinnt bei Gleichzeitigkeit *)
	IF nFirstFault = 0 THEN
		IF diFault1 THEN
			nFirstFault := 1;
		ELSIF diFault2 THEN
			nFirstFault := 2;
		ELSIF diFault3 THEN
			nFirstFault := 3;
		ELSIF diFault4 THEN
			nFirstFault := 4;
		END_IF
		IF nFirstFault <> 0 THEN
			nFaultEvents := nFaultEvents + 1;
			bTriggered := TRUE;
			nPost := 0;
		END_IF
	END_IF

	doFirstOut := (nFirstFault <> 0);
END_PROGRAM
`,
    var: ffVar + '\nVAR\n\tbAnyFault : BOOL;\n\tbTriggered : BOOL;\n\tnPost : INT;\n\tnIdx : INT;\n\tnSamples : INT;\n\tk : INT;\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Einzelner Fehler wird als Erstfehler gespeichert', steps: [
      { set: { diFault3: true } }, { cycles: 2 },
      { expect: 'nFirstFault = 3 AND doFirstOut AND nFaultEvents = 1', msg: 'Störung 3 muss als Erstfehler gespeichert werden.' }
    ] },
    { name: 'Folgefehler überschreiben nicht', steps: [
      { set: { diFault3: true } }, { cycles: 2 }, { set: { diFault1: true, diFault2: true } }, { cycles: 5 },
      { expect: 'nFirstFault = 3 AND nFaultEvents = 1', msg: 'Später auftretende Fehler dürfen den Erstfehler nicht ändern.' }
    ] },
    { name: 'Gleichzeitige Fehler: niedrigste Nummer', steps: [
      { set: { diFault2: true, diFault4: true } }, { cycles: 1 },
      { expect: 'nFirstFault = 2', msg: 'Bei Gleichzeitigkeit im selben Zyklus gewinnt die niedrigste Nummer.' }
    ] },
    { name: 'Quittieren nur ohne anstehenden Fehler', steps: [
      { set: { diFault1: true } }, { cycles: 2 }, ...pulse('diAck', 2),
      { expect: 'nFirstFault = 1', msg: 'Bei anstehendem Fehler darf nicht quittiert werden.' },
      { set: { diFault1: false } }, ...pulse('diAck', 2),
      { expect: 'nFirstFault = 0 AND NOT bFrozen AND NOT doFirstOut', msg: 'Nach Beseitigen und Quittieren muss alles zurückgesetzt sein.' },
      { set: { diFault4: true } }, { cycles: 2 },
      { expect: 'nFirstFault = 4 AND nFaultEvents = 2', msg: 'Nach dem Quittieren muss ein neuer Erstfehler erfasst werden.' }
    ] },
    { name: 'Vorgeschichte mit Nachlauf einfrieren', steps: [
      ...[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].flatMap(v => [{ set: { aiPressure: v } }, { cycles: 1 }]),
      { set: { aiPressure: 110, diFault1: true } }, { cycles: 1 },
      { expect: 'NOT bFrozen', msg: 'Im Auslösezyklus darf noch nicht eingefroren sein (Nachlauf fehlt).' },
      ...[120, 130, 140].flatMap(v => [{ set: { aiPressure: v } }, { cycles: 1 }]),
      { set: { aiPressure: 150 } }, { cycles: 3 },
      { expect: 'bFrozen AND nFrozenSamples = 10', msg: 'Nach 3 Nachlaufwerten muss eingefroren sein.' },
      { expect: 'aFrozen[0] = 50 AND aFrozen[6] = 110 AND aFrozen[9] = 140', msg: 'Erwartet chronologisch 50 … 110 (Auslöser) … 140; 150 darf nicht mehr aufgezeichnet sein.' }
    ] },
    { name: 'Fehler kurz nach dem Start: weniger als 10 Werte', steps: [
      { set: { aiPressure: 7, diFault2: true } }, { cycles: 1 }, { cycles: 3 },
      { expect: 'bFrozen AND nFrozenSamples = 4 AND aFrozen[0] = 7 AND aFrozen[3] = 7 AND aFrozen[4] = 0', msg: 'Mit 4 aufgezeichneten Werten: aFrozen[0..3] = 7, Rest 0.' }
    ] }
  ]
};

const hystDecl = `FUNCTION_BLOCK FB_LimitSwitch
	VAR_INPUT
		rValue : REAL;
		rOn : REAL;    (* Einschaltschwelle *)
		rOff : REAL;   (* Ausschaltschwelle, muss < rOn sein *)
	END_VAR
	VAR_OUTPUT
		bOut : BOOL;
		bError : BOOL; (* Parameterfehler *)
	END_VAR
`;
const hystProgram = `
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbLimit(rValue := rTemp, rOn := rOnLimit, rOff := rOffLimit);
	doCooling := fbLimit.bOut;
	doParamError := fbLimit.bError;
END_PROGRAM
`;

const exPlatform = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Referenzübung: so sieht eine gute Übung aus',
  task: [
    'Bevor du selbst ein Modul für becomeStEngineer schreibst, löse diese kleine Referenzübung und **analysiere danach ihre Tests**: Es gibt einen Normalfall, einen Grenzfall, einen Fehlerfall und einen Test, der gezielt eine typische Fehllösung (fehlende Hysterese) erkennt. Genau so sollen deine eigenen Übungen aufgebaut sein.',
    '',
    '**Spezifikation `FB_LimitSwitch`:**',
    '- `bOut` wird TRUE bei `rValue >= rOn` und FALSE bei `rValue <= rOff`; dazwischen bleibt der Zustand.',
    '- Ist `rOff >= rOn`, ist die Parametrierung ungültig: `bError` = TRUE, `bOut` = FALSE.',
    '',
    'Das Programm nutzt den Baustein für eine Lüfteransteuerung (`rOnLimit` 80 °C, `rOffLimit` 75 °C).'
  ].join('\n'),
  hints: [
    'Erst Parameter prüfen, dann die Schaltlogik.',
    'Schreibe nach dem Lösen zu jedem Test einen Satz, welche Fehllösung er erkennt – das ist die Vorlage für deine eigenen Tests.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rTemp', type: 'REAL', dir: 'in', label: 'Temperatur', widget: 'slider', min: 0, max: 120 },
    { name: 'rOnLimit', type: 'REAL', dir: 'in', label: 'Einschaltschwelle', widget: 'value', init: 80 },
    { name: 'rOffLimit', type: 'REAL', dir: 'in', label: 'Ausschaltschwelle', widget: 'value', init: 75 },
    { name: 'doCooling', type: 'BOOL', dir: 'out', label: 'Lüfter', widget: 'led' },
    { name: 'doParamError', type: 'BOOL', dir: 'out', label: 'Parameterfehler', widget: 'led' }
  ],
  files: {
    main: hystDecl + '\n\t(* TODO *)\n\nEND_FUNCTION_BLOCK\n' + hystProgram,
    var: 'VAR\n\tfbLimit : FB_LimitSwitch;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: hystDecl + `
	IF rOff >= rOn THEN
		bError := TRUE;
		bOut := FALSE;
		RETURN;
	END_IF
	bError := FALSE;
	IF rValue >= rOn THEN
		bOut := TRUE;
	ELSIF rValue <= rOff THEN
		bOut := FALSE;
	END_IF
END_FUNCTION_BLOCK
` + hystProgram,
    var: 'VAR\n\tfbLimit : FB_LimitSwitch;\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Normalfall: über der Schwelle ein', steps: [
      { set: { rTemp: 85 } }, { cycles: 2 }, { expect: 'doCooling AND NOT doParamError', msg: '85 °C ≥ 80 °C → Lüfter ein.' }
    ] },
    { name: 'Grenzfall: genau auf den Schwellen', steps: [
      { set: { rTemp: 80 } }, { cycles: 2 }, { expect: 'doCooling', msg: 'Genau 80 °C muss einschalten (>=).' },
      { set: { rTemp: 75 } }, { cycles: 2 }, { expect: 'NOT doCooling', msg: 'Genau 75 °C muss ausschalten (<=).' }
    ] },
    { name: 'Typische Fehllösung: keine Hysterese', steps: [
      { set: { rTemp: 85 } }, { cycles: 2 }, { set: { rTemp: 77 } }, { cycles: 2 },
      { expect: 'doCooling', msg: 'Zwischen den Schwellen muss der Zustand gehalten werden.' },
      { set: { rTemp: 70 } }, { cycles: 2 }, { set: { rTemp: 77 } }, { cycles: 2 },
      { expect: 'NOT doCooling', msg: 'Von unten kommend darf bei 77 °C nicht eingeschaltet werden.' }
    ] },
    { name: 'Fehlerfall: ungültige Parameter', steps: [
      { set: { rTemp: 90, rOffLimit: 85 } }, { cycles: 2 },
      { expect: 'doParamError AND NOT doCooling', msg: 'rOff ≥ rOn ist ungültig → bError TRUE und Ausgang aus.' },
      { set: { rOffLimit: 75 } }, { cycles: 2 },
      { expect: 'NOT doParamError AND doCooling', msg: 'Nach Korrektur der Parameter arbeitet der Baustein wieder normal.' }
    ] }
  ]
};

module.exports = [
  {
    id: 'praxis-6-mentoring-fuehrung', level: 6, kind: 'lektion',
    title: 'Lehren, Mentoring und technische Führung',
    summary: 'Wissen wirksam weitergeben, Juniors entwickeln und technische Richtung vorgeben – ohne Mikromanagement.',
    minutes: 180, req: ['praxis-5-standardisierung'],
    briefing: 'Auf der höchsten Stufe zählt nicht mehr, wie viel du selbst programmierst, sondern wie viel dein Team durch dich besser wird. Lehren heißt, Lernziele zu setzen, schrittweise anzuleiten (z. B. mit der Vier-Stufen-Methode aus der Ausbildereignung) und Fehler als Lernanlass zu nutzen. Mentoring ist längerfristig: Ziele des Mentees, regelmäßige Gespräche, Feedback. Technische Führung (Staff-/Lead-Rolle) bedeutet, Richtung vorzugeben, Entscheidungen zu ermöglichen und Standards vorzuleben. In der Übung bereitest du einen Mentoring-Fall vor: drei typische Junior-Fehler finden, beheben und das Prinzip dahinter erklären.',
    practice: 'Ein Junior, der verstanden hat, warum Timer außerhalb der CASE-Anweisung stehen, macht den Fehler nie wieder. Einer, dem man nur die korrigierte Zeile gibt, macht ihn im nächsten Projekt erneut.',
    transfer: {
      tia: 'Die Lernthemen (Flanke vs. Zustand, Timeraufruf, Ausgänge aus Zuständen) sind in SCL identisch – gute Mentoren erklären herstellerneutrale Prinzipien.',
      codesys: 'Gleiches gilt für CODESYS/TwinCAT: Das IEC-61131-3-Verhalten von TON und Flanken ist überall dasselbe.'
    },
    objectives: [
      {
        id: 'o1', title: 'Leite strukturiert an: Vier-Stufen-Methode',
        guide: {
          intro: 'Die Vier-Stufen-Methode ist die klassische Unterweisungsmethode der Ausbildung und funktioniert auch für Software-Themen.',
          steps: [
            '**Vorbereiten:** Lernziel formulieren („Du kannst einen Timer in einem Zustandsautomaten korrekt einsetzen“), Material und Beispiel bereitlegen, Vorwissen erfragen.',
            '**Vormachen und erklären:** Live in AS6 zeigen, dabei das Warum erklären, nicht nur das Wie.',
            '**Nachmachen lassen:** Der Lernende setzt es selbst um und erklärt dabei, was er tut.',
            '**Üben und kontrollieren:** eigenständige Übung, danach gemeinsame Auswertung (z. B. mit automatischen Tests).',
            'Halte das Lernziel und das Ergebnis kurz fest.'
          ],
          done: 'Erledigt, wenn du eine 30-minütige Unterweisung nach der Vier-Stufen-Methode geplant und durchgeführt hast.',
          tip: 'Lass den Lernenden die Tastatur bedienen. Wer zuschaut, glaubt es zu können; wer tippt, lernt es.',
          link: { label: 'Ausbilder-Eignungsverordnung (AusbEignV)', url: 'https://www.gesetze-im-internet.de/ausbeignv_2009/' }
        }
      },
      {
        id: 'o2', title: 'Nutze Fehler als Lernanlass',
        guide: {
          intro: 'Ein Fehler im Code eines Juniors ist die beste Gelegenheit, ein Prinzip zu vermitteln.',
          steps: [
            'Lass den Junior das Symptom selbst beschreiben und eine Hypothese aufstellen, bevor du hilfst.',
            'Stelle Fragen statt Antworten zu geben: „Wann wird der Timer mit IN = FALSE aufgerufen?“',
            'Formuliere das Prinzip allgemein („Bausteine mit Gedächtnis jeden Zyklus aufrufen“).',
            'Verweise auf eine Quelle (Hilfe, Guideline), damit das Prinzip nachlesbar ist.',
            'Löse die Übung „Mentoring-Fall“ und schreibe zu jedem Fehler eine Zwei-Satz-Erklärung.'
          ],
          done: 'Erledigt, wenn die Übung alle Tests besteht und du für jeden der drei Fehler das Prinzip in zwei Sätzen formuliert hast.',
          tip: 'Sammle wiederkehrende Junior-Fehler im Team-Wiki – das ist der Grundstock für Schulungen und Review-Checklisten.'
        }
      },
      {
        id: 'o3', title: 'Führe Mentoring-Gespräche',
        guide: {
          intro: 'Mentoring ist eine Beziehung über Monate. Struktur hilft beiden Seiten.',
          steps: [
            'Kläre im ersten Gespräch die Ziele des Mentees (fachlich, z. B. „eigenständige SAT“, und persönlich).',
            'Vereinbare einen festen Rhythmus (z. B. alle zwei Wochen 30 min) und halte ihn ein.',
            'Gib Feedback konkret, zeitnah und auf Verhalten bezogen („In deinem Review-Kommentar …“).',
            'Übertrage schrittweise Verantwortung: erst Teilaufgabe mit Review, dann eigenständig mit Rückfrage.',
            'Prüfe nach drei Monaten gemeinsam den Fortschritt gegenüber den Zielen.'
          ],
          done: 'Erledigt, wenn du mit einem Mentee Ziele, Rhythmus und einen ersten Entwicklungsschritt vereinbart hast.',
          tip: 'Die wichtigste Frage im Mentoring: „Was würdest du tun?“ – erst danach deine Sicht.'
        }
      },
      {
        id: 'o4', title: 'Übernimm technische Führung',
        guide: {
          intro: 'Technische Führung ohne Personalverantwortung wirkt über Richtung, Standards und Unterstützung.',
          steps: [
            'Formuliere eine technische Richtung für 6–12 Monate (z. B. „alle neuen Projekte auf Firmenbibliothek v2 und mapp“).',
            'Mache Entscheidungen transparent (ADRs) und beteilige die Betroffenen vor der Entscheidung.',
            'Lebe Standards vor: deine Merge-Requests sind klein, getestet, gut beschrieben.',
            'Sponsore andere: Gib Kollegen sichtbare Aufgaben und nenne ihren Beitrag.',
            'Reserviere Zeit für Reviews und Fragen – Erreichbarkeit ist Teil der Rolle.'
          ],
          done: 'Erledigt, wenn du eine technische Richtung schriftlich formuliert und mit dem Team besprochen hast.',
          tip: 'Wenn du die einzige Person bist, die ein Problem lösen kann, hast du ein Führungsproblem, kein technisches.',
          link: { label: 'StaffEng Guides', url: 'https://staffeng.com/guides/' }
        }
      }
    ],
    videos: [V.vierStufen, V.pragmaticMentor, V.googleMentor],
    readings: [R.ausbEignV, R.glinzProduktivitaet, R.staffEng],
    quiz: [
      { type: 'single', q: 'In welcher Reihenfolge laufen die Stufen der Vier-Stufen-Methode ab?',
        options: ['Vormachen – Vorbereiten – Üben – Nachmachen', 'Vorbereiten – Vormachen/Erklären – Nachmachen – Üben/Kontrollieren', 'Üben – Vormachen – Vorbereiten – Nachmachen', 'Nachmachen – Vormachen – Vorbereiten – Üben'], correct: 1,
        explain: 'Vorbereiten, Vormachen und Erklären, Nachmachen lassen, Üben und Kontrollieren.' },
      { type: 'single', q: 'Welches Prinzip vermittelst du bei diesem Junior-Code?',
        code: { lang: 'st', text: 'BS_IDLE:\n\tIF bBatchDone THEN\n\t\tnBatchCount := nBatchCount + 1;\n\tEND_IF' },
        options: ['Zähler immer als UDINT', 'Ereignisse (Übergänge) zählen, nicht Zustände – ein Zustand gilt viele Zyklen lang', 'CASE immer mit ELSE', 'Kommentare auf Englisch'], correct: 1,
        explain: 'Der Code läuft in jedem Zyklus, solange bBatchDone TRUE ist. Gezählt wird beim Übergang.' },
      { type: 'multi', q: 'Was zeichnet gutes Feedback im Mentoring aus?', options: ['Konkret und auf Verhalten bezogen', 'Zeitnah', 'Allgemein über die Persönlichkeit', 'Mit Raum für die Sicht des Mentees'], correct: [0, 1, 3],
        explain: 'Feedback bezieht sich auf beobachtbares Verhalten, nicht auf die Person.' }
    ],
    exam: [
      { type: 'single', q: 'Ein Junior fragt zum dritten Mal nach demselben Thema. Was ist die wirksamste Reaktion?',
        options: ['Die Lösung wieder diktieren', 'Gemeinsam das Prinzip erarbeiten, eine Quelle zeigen und eine Übung vereinbaren', 'Auf die Hilfe verweisen und gehen', 'Das Thema selbst übernehmen'], correct: 1,
        explain: 'Wiederholte Fragen zeigen, dass das Prinzip fehlt – nicht die einzelne Antwort.' },
      { type: 'single', q: 'Warum bleibt in diesem Code ein Ausgang hängen, wenn von außen `eState := BS_IDLE` gesetzt wird?',
        code: { lang: 'st', text: 'BS_FILL:\n\tdoInlet := TRUE;\n\tIF rLevel >= 60.0 THEN\n\t\tdoInlet := FALSE;\n\t\teState := BS_MIX;\n\tEND_IF' },
        options: ['Weil REAL-Vergleiche ungenau sind', 'Weil doInlet nur im Zweig BS_FILL zurückgesetzt wird; verlässt man den Zustand anders, bleibt er TRUE', 'Weil CASE keine Ausgänge setzen darf', 'Er bleibt nicht hängen'], correct: 1,
        explain: 'Ausgänge besser einmal aus dem Zustand ableiten: doInlet := (eState = BS_FILL).' },
      { type: 'multi', q: 'Welche Tätigkeiten gehören zu technischer Führung?', options: ['Technische Richtung formulieren', 'Entscheidungen transparent machen', 'Kollegen sichtbare Aufgaben geben', 'Alle schwierigen Aufgaben selbst lösen'], correct: [0, 1, 2],
        explain: 'Wer alles selbst löst, wird zum Engpass.' },
      { type: 'single', q: 'Was ist ein gutes Lernziel?', options: ['„Timer verstehen“', '„Du kannst einen TON in einem Zustandsautomaten so einsetzen, dass er bei jedem Eintritt in den Zustand neu startet, und das mit einem Test zeigen.“', '„Viel üben“', '„Die Hilfe lesen“'], correct: 1,
        explain: 'Ein Lernziel ist beobachtbar und überprüfbar formuliert.' }
    ],
    exercises: [exJunior],
    proof: false
  },
  {
    id: 'praxis-6-eskalation', level: 6, kind: 'lektion',
    title: 'Kundenkommunikation in Eskalationen',
    summary: 'In kritischen Situationen ruhig kommunizieren, Fakten schaffen und das Problem strukturiert lösen.',
    minutes: 180, req: ['praxis-3-inbetriebnahme-kunde', 'praxis-5-adr-metriken'],
    briefing: 'Steht beim Kunden die Produktion, zählt jede Stunde – und der Ton wird rauer. Eine Eskalation erfordert zwei Dinge gleichzeitig: technische Ursachenforschung und professionelle Kommunikation. Bewährt haben sich klare Rollen (wer löst, wer kommuniziert), regelmäßige Statusmeldungen mit Fakten statt Vermutungen und eine schuldfreie Nachbetrachtung (Postmortem). Sachbezogenes Verhandeln nach dem Harvard-Konzept hilft, über Interessen statt Positionen zu sprechen. Technisch brauchst du Daten: In der Übung baust du eine Erstfehler-Erkennung mit eingefrorener Vorgeschichte.',
    practice: 'Ein Satz wie „Wir haben die Ursache noch nicht, aber seit 14:00 zeichnen wir den Druck vor jedem Stillstand auf; nächster Status um 16:00“ beruhigt mehr als jede Vermutung.',
    transfer: {
      tia: 'In TIA Portal würdest du dafür Trace-Aufzeichnungen mit Trigger und den Diagnosepuffer nutzen; die Kommunikation bleibt dieselbe.',
      codesys: 'In CODESYS/TwinCAT gibt es Trace mit Trigger (Scope); die Erstfehler-Logik schreibst du dort ebenfalls selbst oder nutzt Event-Logger.'
    },
    objectives: [
      {
        id: 'o1', title: 'Organisiere die Eskalation mit klaren Rollen',
        guide: {
          intro: 'Ohne Rollen reden alle mit allen, und niemand löst das Problem.',
          steps: [
            'Bestimme einen **Koordinator** (Incident Commander): entscheidet über Vorgehen und Prioritäten.',
            'Bestimme eine Person für **Kommunikation**: einziger Ansprechpartner für Kunde und eigenes Management.',
            'Die **Techniker** arbeiten ungestört an der Ursache.',
            'Führe ein Protokoll mit Uhrzeit: Beobachtungen, Maßnahmen, Ergebnisse.',
            'Vereinbare feste Status-Zeitpunkte (z. B. stündlich) und halte sie ein – auch wenn es nichts Neues gibt.'
          ],
          done: 'Erledigt, wenn du für ein Szenario „Anlage steht beim Kunden“ Rollen, Protokollvorlage und Statusrhythmus festgelegt hast.',
          tip: 'Wer gleichzeitig debuggt und telefoniert, macht beides schlecht.',
          link: { label: 'Google SRE Book: Managing Incidents', url: 'https://sre.google/sre-book/managing-incidents/' }
        }
      },
      {
        id: 'o2', title: 'Kommuniziere sachlich unter Druck',
        guide: {
          intro: 'Der Kunde braucht Klarheit, keine Rechtfertigung.',
          steps: [
            'Höre zu und fasse zusammen: „Sie verlieren pro Stunde X Teile, die Anlage stoppt seit gestern sporadisch.“',
            'Trenne Fakten, Vermutungen und nächste Schritte – und benenne sie so.',
            'Nenne nur Termine, die du halten kannst; lieber „nächster Status um 16:00“ als „bis 16:00 gelöst“.',
            'Sprich über Interessen (Produktion sichern) statt Positionen („das ist nicht unser Fehler“) – Harvard-Konzept.',
            'Bestätige Vereinbarungen schriftlich (kurze Mail mit Fakten, Maßnahmen, nächstem Termin).'
          ],
          done: 'Erledigt, wenn du eine Statusmeldung mit Fakten, Vermutungen und nächsten Schritten für das Übungsszenario geschrieben hast.',
          tip: 'Schuldfragen klärt man nach der Lösung, nicht währenddessen.'
        }
      },
      {
        id: 'o3', title: 'Schaffe Fakten mit gezielter Diagnose',
        guide: {
          intro: 'Bei sporadischen Fehlern helfen nur Aufzeichnungen, die genau den kritischen Moment erfassen.',
          steps: [
            'Prüfe zuerst den Logger (**Strg+L**) und exportiere ihn.',
            'Nutze für Signalverläufe den Trace in AS6 (im Kontextmenü des Tasks bzw. über **Öffnen › Trace**) mit Trigger auf die Störung.',
            'Wo das nicht reicht: baue eine Erstfehler-Erkennung mit Vorgeschichte in die Applikation (Übung).',
            'Spiele Diagnose-Code nur über den Änderungsprozess ein (Change Request, Kunde informiert, Stand getaggt).',
            'Werte die Daten gemeinsam mit dem Kunden aus – das schafft Vertrauen.'
          ],
          done: 'Erledigt, wenn die Übung „Erstfehler-Erkennung“ alle Tests besteht.',
          tip: 'Bei gleichzeitig anstehenden Störungen ist fast immer nur eine die Ursache; die anderen sind Folgefehler.',
          link: { label: 'B&R Help: Logger', url: help('diagnostics_support/diagnosis/logger/diagnosis_logger.html') }
        }
      },
      {
        id: 'o4', title: 'Führe eine schuldfreie Nachbetrachtung durch',
        guide: {
          intro: 'Nach der Lösung beginnt das Lernen. Ein Postmortem fragt „Was hat das ermöglicht?“ statt „Wer war schuld?“.',
          steps: [
            'Erstelle eine Zeitleiste aus dem Protokoll.',
            'Bestimme die Ursache und die beitragenden Faktoren (Technik, Prozess, Kommunikation).',
            'Leite Maßnahmen mit Verantwortlichen und Terminen ab (z. B. Erstfehler-Erkennung in den Standard aufnehmen).',
            'Teile das Ergebnis im Team und – angemessen – mit dem Kunden.',
            'Prüfe nach einigen Wochen, ob die Maßnahmen umgesetzt sind.'
          ],
          done: 'Erledigt, wenn du ein Postmortem mit Zeitleiste, Ursachen und Maßnahmen für das Übungsszenario geschrieben hast.',
          tip: 'Ein Postmortem ohne umgesetzte Maßnahmen ist nur eine Geschichte.',
          link: { label: 'Google SRE Book: Postmortem Culture', url: 'https://sre.google/sre-book/postmortem-culture/' }
        }
      }
    ],
    videos: [V.harvard, V.postmortem, V.debugTools],
    readings: [R.sreIncidents, R.srePostmortem, R.ausbRahmenplan],
    quiz: [
      { type: 'single', q: 'Welche Statusmeldung ist in einer Eskalation am besten?',
        options: ['„Wir sind dran.“', '„Das liegt sicher an Ihrer Druckluft.“', '„Fakt: 4 Stillstände seit 8:00, jeweils Störung 1 zuerst. Vermutung: Druckabfall. Nächster Schritt: Aufzeichnung läuft, nächster Status 11:00.“', '„Bis heute Abend ist alles gelöst.“'], correct: 2,
        explain: 'Fakten, Vermutung und nächster Schritt mit Termin – klar getrennt.' },
      { type: 'single', q: 'Warum friert die Aufzeichnung erst nach einigen Nachlaufwerten ein?',
        options: ['Um Speicher zu sparen', 'Damit man auch sieht, wie sich der Prozess unmittelbar nach dem Fehler verhält', 'Weil der Ringpuffer sonst überläuft', 'Aus Performancegründen'], correct: 1,
        explain: 'Vor- und Nachgeschichte zusammen zeigen Ursache und Wirkung – wie Pre- und Post-Trigger im Trace.' },
      { type: 'multi', q: 'Welche Rollen sind in einer Eskalation hilfreich?', options: ['Koordinator', 'Kommunikationsverantwortlicher', 'Techniker für die Ursachenanalyse', 'Schuldiger'], correct: [0, 1, 2],
        explain: 'Schuldzuweisung gehört weder in die Eskalation noch ins Postmortem.' }
    ],
    exam: [
      { type: 'single', q: 'Was bedeutet „Interessen statt Positionen“ nach dem Harvard-Konzept?',
        options: ['Auf der eigenen Forderung bestehen', 'Die dahinterliegenden Bedürfnisse beider Seiten klären und Lösungen dafür suchen', 'Dem Kunden immer recht geben', 'Nur schriftlich kommunizieren'], correct: 1,
        explain: 'Hinter „Sie müssen sofort kommen“ steckt das Interesse „Produktion sichern“ – dafür gibt es oft mehrere Lösungen.' },
      { type: 'single', q: 'Bei einer Störung stehen vier Meldungen gleichzeitig an. Was zeigt die Erstfehler-Erkennung?',
        options: ['Die schwerwiegendste Meldung', 'Die Meldung, die zuerst kam (bei Gleichzeitigkeit nach festgelegter Priorität)', 'Die zuletzt quittierte Meldung', 'Alle vier gleichzeitig'], correct: 1,
        explain: 'First-Out speichert den ersten Fehler; Folgefehler überschreiben ihn nicht.' },
      { type: 'multi', q: 'Was gehört in ein Postmortem?', options: ['Zeitleiste', 'Ursache und beitragende Faktoren', 'Maßnahmen mit Verantwortlichen und Terminen', 'Namen der Schuldigen'], correct: [0, 1, 2],
        explain: 'Postmortems sind schuldfrei, damit Fakten offen auf den Tisch kommen.' },
      { type: 'numeric', q: 'Ein Ringpuffer mit {N} Werten wird alle {T} ms beschrieben. Wie viele Millisekunden Vorgeschichte enthält er maximal?',
        params: { N: [10, 100, 10], T: [2, 20, 2] }, formula: 'N * T', unit: 'ms', tol: 0.001,
        explain: 'Vorgeschichte = Anzahl Werte × Abtastzeit.' }
    ],
    exercises: [exFirstFault],
    proof: false
  },
  {
    id: 'praxis-6-plattform-erweitern', level: 6, kind: 'zusatz',
    title: 'Erweitere die Lernplattform',
    summary: 'Schreibe ein eigenes Modul im Schema-Format für becomeStEngineer – mit geprüften Quellen und einer ST-Übung inklusive Tests.',
    minutes: 360, req: ['praxis-6-mentoring-fuehrung'],
    briefing: 'Die beste Art, ein Thema zu meistern, ist, es anderen beizubringen. In dieser Meta-Aufgabe erweiterst du becomeStEngineer selbst: Du wählst ein Thema, das dir in der Praxis gefehlt hat, und schreibst ein vollständiges Modul im verbindlichen Schema-Format – Ziele mit Anleitungen, geprüfte Videos und Texte, Quiz- und Prüfungsfragen sowie mindestens eine ST-Übung mit Startcode, Musterlösung und Tests. Die Referenzübung zeigt, wie gute Tests aufgebaut sind. Dein Beitrag wird über einen Merge-Request eingereicht und von einem Ausbilder geprüft.',
    practice: 'Jedes Modul, das ein erfahrener Kollege schreibt, enthält Praxiswissen, das in keinem Handbuch steht – und spart den nächsten Lernenden Wochen.',
    transfer: {
      tia: 'Wenn du aus der Siemens-Welt kommst: Ein Modul mit TIA-Vergleich im Feld `transfer` hilft Umsteigern besonders.',
      codesys: 'Gleiches gilt für CODESYS/TwinCAT – Vergleiche zeigen, was herstellerneutral ist und was B&R-spezifisch.'
    },
    objectives: [
      {
        id: 'o1', title: 'Wähle Thema, Level und Lernziele',
        guide: {
          intro: 'Ein gutes Modul hat einen klaren Platz im Lehrplan.',
          steps: [
            'Lies `docs/CONTENT_SCHEMA.md` im Repository vollständig – das Format ist verbindlich.',
            'Wähle Bereich und Level (Level 1 = Einstieg … Level 6 = Architektur/Lehre) und prüfe, welche Module es dort schon gibt.',
            'Formuliere 3–5 Lernziele, die beobachtbar sind („Du kannst …“).',
            'Lege die Voraussetzungen (`req`) fest – ohne Zyklen.',
            'Stimme Thema und Level kurz mit einem Ausbilder ab.'
          ],
          done: 'Erledigt, wenn Thema, Bereich, Level, Lernziele und Voraussetzungen abgestimmt sind.',
          tip: 'Lieber ein enges Thema gründlich als ein breites oberflächlich.'
        }
      },
      {
        id: 'o2', title: 'Schreibe Inhalte mit geprüften Quellen',
        guide: {
          intro: 'Auf becomeStEngineer gibt es keine erfundenen Quellen – jede URL und jedes Video wird automatisch geprüft.',
          steps: [
            'Schreibe briefing, practice und je Ziel eine Anleitung mit 3–7 konkreten Schritten (Menüpfade, Tastenkürzel).',
            'Suche 2–3 Videos; prüfe jede ID per oEmbed und übernimm Titel und Kanal exakt.',
            'Suche 2–3 Texte (Uni-Skripte zuerst, dann freie Bücher, Herstellerdoku, amtliche Quellen) und prüfe jede URL auf HTTP 200.',
            'Schreibe genau 3 Quizfragen und 3–5 andere Prüfungsfragen, gern mit Code-Snippet.',
            'Führe `node tools/verify-sources.js` und `node tools/validate-content.js` aus, bis beide 0 Fehler melden.'
          ],
          code: { lang: 'bash', text: 'node tools/validate-content.js content/areas/<id>.js\nnode tools/verify-sources.js content/areas/<id>.js' },
          done: 'Erledigt, wenn beide Prüfwerkzeuge für dein Modul 0 Fehler melden.',
          tip: 'Was du nicht prüfen kannst, lässt du weg. Eine Quelle weniger ist besser als eine falsche.'
        }
      },
      {
        id: 'o3', title: 'Entwirf eine ST-Übung mit aussagekräftigen Tests',
        guide: {
          intro: 'Code wiegt 70 % der Note – die Übung ist das Herzstück deines Moduls.',
          steps: [
            'Löse die Referenzübung „FB_LimitSwitch“ und analysiere ihre vier Tests (Normal-, Grenz-, Fehlerfall, typische Fehllösung).',
            'Schreibe die Aufgabe als Liste testbarer Anforderungen.',
            'Schreibe Musterlösung und Startcode; der Startcode soll übersetzbar sein, aber nicht alle Tests bestehen.',
            'Schreibe 3–6 Tests mit hilfreichen Fehlermeldungen (`msg`), die sagen, was erwartet wurde.',
            'Prüfe mit `node tools/check-exercises.js content/areas/<id>.js -v`.'
          ],
          done: 'Erledigt, wenn die Referenzübung gelöst ist und deine eigene Übung im Prüfwerkzeug als „ok“ erscheint.',
          tip: 'Ein guter Test scheitert genau an der typischen Fehllösung – überlege zuerst, wie Lernende es falsch machen würden.'
        }
      },
      {
        id: 'o4', title: 'Reiche den Beitrag ein',
        guide: {
          intro: 'Dein Modul durchläuft denselben Prozess wie Produktionscode.',
          steps: [
            'Lege einen Branch an, z. B. `content/praxis-neues-modul`.',
            'Committe mit aussagekräftiger Nachricht, z. B. `feat(content): Modul zu …`.',
            'Erstelle einen Merge-Request auf git.breitner.de mit Beschreibung: Thema, Level, Zielgruppe, Prüfergebnisse.',
            'Arbeite die Review-Kommentare ein.',
            'Reiche den Link zum Merge-Request als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Merge-Request mit grünen Prüfwerkzeugen als Nachweis eingereicht ist.',
          tip: 'Bitte einen Lernenden der Zielstufe, dein Modul vorab durchzuarbeiten – das ist der ehrlichste Test.',
          link: { label: 'Write the Docs: Docs as Code', url: 'https://www.writethedocs.org/guide/docs-as-code/' }
        }
      }
    ],
    videos: [V.vierStufen, V.nativeWebTests],
    readings: [R.diataxis, R.writeTheDocs, R.tubafTesten],
    quiz: [
      { type: 'single', q: 'Welche Regel gilt für Videos in becomeStEngineer?', options: ['Titel frei formulieren', 'ID per oEmbed prüfen und Titel/Kanal exakt übernehmen', 'Nur deutsche Videos', 'Nur B&R-Videos'], correct: 1,
        explain: 'Alle Video-IDs werden per oEmbed geprüft; Titel und Kanal müssen exakt übereinstimmen.' },
      { type: 'single', q: 'Was soll der Startcode einer Übung erfüllen?', options: ['Alle Tests bestehen', 'Übersetzbar sein, aber nicht alle Tests bestehen', 'Leer sein', 'Die Musterlösung enthalten'], correct: 1,
        explain: 'So können Lernende sofort starten, müssen die Aufgabe aber lösen.' },
      { type: 'multi', q: 'Welche Testarten sollte eine gute Übung abdecken?', options: ['Normalfall', 'Grenzfall', 'Fehlerfall', 'Nur den Normalfall, das reicht'], correct: [0, 1, 2],
        explain: 'Normal-, Grenz- und Fehlerfall – plus gern ein Test gegen eine typische Fehllösung.' }
    ],
    exam: [
      { type: 'single', q: 'Wie viele Quizfragen muss ein Modul laut Schema haben?', options: ['1', 'Genau 3', '3–5', 'Beliebig viele'], correct: 1,
        explain: 'Quiz: genau 3; Prüfungsfragen: 3–5, andere als im Quiz.' },
      { type: 'single', q: 'In welcher Reihenfolge werden Text-Quellen bevorzugt?', options: ['Blogs, Foren, Uni-Skripte', 'Uni-/Hochschulskripte, freie Fachbücher, Herstellerdoku, amtliche Quellen', 'Nur Herstellerdoku', 'Wikipedia zuerst'], correct: 1,
        explain: 'So steht es in den Prüfregeln des Content-Schemas.' },
      { type: 'multi', q: 'Welche Prüfwerkzeuge müssen vor dem Einreichen 0 Fehler melden?', options: ['validate-content.js', 'verify-sources.js', 'check-exercises.js', 'Ein Rechtschreibprogramm'], correct: [0, 1, 2],
        explain: 'Struktur, Quellen und Übungen werden automatisch geprüft.' }
    ],
    exercises: [exPlatform],
    proof: true
  }
];
