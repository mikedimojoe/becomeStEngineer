'use strict';
const { R, V, pulse, help } = require('./_sources');

// ---------------------------------------------------------------------------
// Level 2 – Junior: Anforderungen & Signallisten, Inbetriebnahme-Checkliste, Code Review
// ---------------------------------------------------------------------------

const loadDataSets = [
  '\t\t(* --- Testdaten laden (Fixture, nicht aendern) --- *)',
  '\t\tCASE nDataSet OF',
  '\t\t1:',
  '\t\t\tnSignals := 5;',
  "\t\t\taSignals[0].sName := 'diStart';  aSignals[0].eDir := DIR_IN;  aSignals[0].nModule := 1; aSignals[0].nChannel := 1;",
  "\t\t\taSignals[1].sName := 'diStop';   aSignals[1].eDir := DIR_IN;  aSignals[1].nModule := 1; aSignals[1].nChannel := 2;",
  "\t\t\taSignals[2].sName := 'doMotor';  aSignals[2].eDir := DIR_OUT; aSignals[2].nModule := 2; aSignals[2].nChannel := 1;",
  "\t\t\taSignals[3].sName := 'aiTemp';   aSignals[3].eDir := DIR_IN;  aSignals[3].nModule := 3; aSignals[3].nChannel := 1; aSignals[3].rMin := 0.0; aSignals[3].rMax := 150.0;",
  "\t\t\taSignals[4].sName := 'aoSpeed';  aSignals[4].eDir := DIR_OUT; aSignals[4].nModule := 4; aSignals[4].nChannel := 1; aSignals[4].rMin := 0.0; aSignals[4].rMax := 100.0;",
  '\t\t2:',
  '\t\t\tnSignals := 7;',
  "\t\t\taSignals[0].sName := 'diStart';    aSignals[0].eDir := DIR_IN;  aSignals[0].nModule := 1; aSignals[0].nChannel := 1;",
  "\t\t\taSignals[1].sName := 'doLamp';     aSignals[1].eDir := DIR_IN;  aSignals[1].nModule := 1; aSignals[1].nChannel := 2;",
  "\t\t\taSignals[2].sName := 'diReady';    aSignals[2].eDir := DIR_IN;  aSignals[2].nModule := 1; aSignals[2].nChannel := 1;",
  "\t\t\taSignals[3].sName := '';           aSignals[3].eDir := DIR_OUT; aSignals[3].nModule := 2; aSignals[3].nChannel := 3;",
  "\t\t\taSignals[4].sName := 'aiPressure'; aSignals[4].eDir := DIR_IN;  aSignals[4].nModule := 3; aSignals[4].nChannel := 20; aSignals[4].rMin := 0.0; aSignals[4].rMax := 10.0;",
  "\t\t\taSignals[5].sName := 'aiLevel';    aSignals[5].eDir := DIR_IN;  aSignals[5].nModule := 3; aSignals[5].nChannel := 2; aSignals[5].rMin := 100.0; aSignals[5].rMax := 0.0;",
  "\t\t\taSignals[6].sName := 'doValve';    aSignals[6].eDir := DIR_OUT; aSignals[6].nModule := 2; aSignals[6].nChannel := 4;",
  '\t\t3: (* bewusst nicht geloescht: Eintraege ab Index 3 stammen noch vom vorherigen Datensatz *)',
  '\t\t\tnSignals := 3;',
  "\t\t\taSignals[0].sName := 'diPartA'; aSignals[0].eDir := DIR_IN;  aSignals[0].nModule := 5; aSignals[0].nChannel := 1;",
  "\t\t\taSignals[1].sName := 'diPartB'; aSignals[1].eDir := DIR_IN;  aSignals[1].nModule := 5; aSignals[1].nChannel := 0;",
  "\t\t\taSignals[2].sName := 'doPusher'; aSignals[2].eDir := DIR_OUT; aSignals[2].nModule := 6; aSignals[2].nChannel := 1;",
  '\t\tEND_CASE'
].join('\n');

const signalTyp = 'TYPE\n\tSignalDir_enum :\n\t\t(\n\t\tDIR_IN,\n\t\tDIR_OUT\n\t\t);\n\tSignal_typ : STRUCT\n\t\tsName : STRING[32]; (* Variablenname laut Signalliste *)\n\t\teDir : SignalDir_enum;\n\t\tnModule : INT; (* Steckplatz der I/O-Karte *)\n\t\tnChannel : INT; (* Kanal 1..16 *)\n\t\trMin : REAL; (* nur analog: Messbereich *)\n\t\trMax : REAL;\n\tEND_STRUCT;\nEND_TYPE\n';

const signalVarStart = 'VAR\n\taSignals : ARRAY[0..7] OF Signal_typ;\n\tnSignals : INT;\n\taErrorCode : ARRAY[0..7] OF USINT; (* 0 = ok, sonst Fehlercode der ersten verletzten Regel *)\n\trtCheck : R_TRIG;\n\ti : INT;\n\tj : INT;\nEND_VAR\n';

const exSignalliste = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Plausibilitätsprüfung einer Signalliste',
  task: [
    'Bevor die I/O-Konfiguration aufgebaut wird, soll ein kleines Prüfprogramm die **Signalliste** auf typische Fehler untersuchen. Die Liste liegt als Array `aSignals` vom Typ `Signal_typ` vor (siehe `Types.typ`), `nSignals` gibt an, wie viele Einträge gültig sind. Das Laden der Testdaten (`nDataSet` 1–3) ist im Startcode schon vorhanden.',
    '',
    'Bei steigender Flanke an `diCheck` sollen **nur die ersten `nSignals` Einträge** geprüft werden. Pro Eintrag gilt die **erste** verletzte Regel (Reihenfolge 1 → 5):',
    '',
    '| Code | Regel |',
    '|---|---|',
    '| 1 | Name ist leer (`LEN(sName) = 0`) |',
    "| 2 | Präfix passt nicht zur Richtung: Eingänge beginnen mit `di` oder `ai`, Ausgänge mit `do` oder `ao` (`LEFT(sName, 2)`) |",
    '| 3 | Kanal außerhalb 1..16 |',
    '| 4 | Doppelbelegung: gleicher `nModule` **und** `nChannel` wie ein **früherer** Eintrag |',
    '| 5 | Analogsignal (`ai`/`ao`) mit `rMin >= rMax` |',
    '',
    '- Ergebnis je Eintrag in `aErrorCode[i]` (0 = in Ordnung). Einträge ab Index `nSignals` haben Code 0.',
    '- `nErrorCount` = Anzahl fehlerhafter Einträge, `doListOk` = TRUE, wenn mindestens ein Eintrag vorhanden und kein Fehler gefunden wurde.',
    '',
    'Lege die Fehlercodes als Konstanten an (z. B. `ERR_NAME_EMPTY : USINT := 1;`).'
  ].join('\n'),
  hints: [
    'Setze zu Beginn jeder Prüfung alle 8 Einträge von `aErrorCode` auf 0 und `nErrorCount` auf 0.',
    'Die Doppelbelegung prüfst du mit einer zweiten Schleife `FOR j := 0 TO i - 1` – für i = 0 läuft sie gar nicht.',
    'Strings vergleichst du mit `=`: `LEFT(aSignals[i].sName, 2) = \'di\'`. Speichere das Präfix in einer Hilfsvariable `sPrefix : STRING[2]`.'
  ],
  cycleMs: 10,
  io: [
    { name: 'nDataSet', type: 'INT', dir: 'in', label: 'Testdatensatz (1–3)', widget: 'slider', min: 1, max: 3, init: 1 },
    { name: 'diCheck', type: 'BOOL', dir: 'in', label: 'Prüfung starten', widget: 'button' },
    { name: 'nErrorCount', type: 'INT', dir: 'out', label: 'Fehlerhafte Einträge', widget: 'value' },
    { name: 'doListOk', type: 'BOOL', dir: 'out', label: 'Signalliste in Ordnung', widget: 'led' }
  ],
  files: {
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\trtCheck(CLK := diCheck);\n\tIF rtCheck.Q THEN\n' + loadDataSets + '\n\n\t\t(* TODO: Signalliste pruefen, aErrorCode, nErrorCount und doListOk setzen *)\n\n\tEND_IF\nEND_PROGRAM\n',
    var: signalVarStart,
    typ: signalTyp
  },
  solution: {
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\trtCheck(CLK := diCheck);\n\tIF rtCheck.Q THEN\n' + loadDataSets + `

		(* --- Pruefung: nur die ersten nSignals Eintraege, erste verletzte Regel gewinnt --- *)
		nErrorCount := 0;
		FOR i := 0 TO 7 DO
			aErrorCode[i] := 0;
		END_FOR
		FOR i := 0 TO nSignals - 1 DO
			sPrefix := LEFT(aSignals[i].sName, 2);
			bAnalog := (sPrefix = 'ai') OR (sPrefix = 'ao');
			IF LEN(aSignals[i].sName) = 0 THEN
				aErrorCode[i] := ERR_NAME_EMPTY;
			ELSIF NOT ((((sPrefix = 'di') OR (sPrefix = 'ai')) AND (aSignals[i].eDir = DIR_IN))
					OR (((sPrefix = 'do') OR (sPrefix = 'ao')) AND (aSignals[i].eDir = DIR_OUT))) THEN
				aErrorCode[i] := ERR_PREFIX;
			ELSIF (aSignals[i].nChannel < 1) OR (aSignals[i].nChannel > MAX_CHANNEL) THEN
				aErrorCode[i] := ERR_CHANNEL;
			ELSE
				FOR j := 0 TO i - 1 DO
					IF (aSignals[j].nModule = aSignals[i].nModule) AND (aSignals[j].nChannel = aSignals[i].nChannel) THEN
						aErrorCode[i] := ERR_DUPLICATE;
					END_IF
				END_FOR
				IF (aErrorCode[i] = 0) AND bAnalog AND (aSignals[i].rMin >= aSignals[i].rMax) THEN
					aErrorCode[i] := ERR_RANGE;
				END_IF
			END_IF
			IF aErrorCode[i] <> 0 THEN
				nErrorCount := nErrorCount + 1;
			END_IF
		END_FOR
		doListOk := (nSignals > 0) AND (nErrorCount = 0);
	END_IF
END_PROGRAM
`,
    var: signalVarStart + '\nVAR\n\tsPrefix : STRING[2];\n\tbAnalog : BOOL;\nEND_VAR\n\nVAR CONSTANT\n\tMAX_CHANNEL : INT := 16;\n\tERR_NAME_EMPTY : USINT := 1;\n\tERR_PREFIX : USINT := 2;\n\tERR_CHANNEL : USINT := 3;\n\tERR_DUPLICATE : USINT := 4;\n\tERR_RANGE : USINT := 5;\nEND_VAR\n',
    typ: signalTyp
  },
  tests: [
    { name: 'Fehlerfreie Liste wird erkannt', steps: [
      { set: { nDataSet: 1 } }, ...pulse('diCheck', 1),
      { expect: 'nErrorCount = 0 AND doListOk', msg: 'Datensatz 1 ist fehlerfrei – doListOk muss TRUE sein.' }
    ] },
    { name: 'Fehlerhafte Liste: Anzahl', steps: [
      { set: { nDataSet: 2 } }, ...pulse('diCheck', 1),
      { expect: 'nErrorCount = 5 AND NOT doListOk', msg: 'Datensatz 2 enthält 5 fehlerhafte Einträge.' }
    ] },
    { name: 'Fehlerhafte Liste: richtige Codes', steps: [
      { set: { nDataSet: 2 } }, ...pulse('diCheck', 1),
      { expect: 'aErrorCode[0] = 0 AND aErrorCode[1] = 2 AND aErrorCode[2] = 4 AND aErrorCode[3] = 1', msg: 'Erwartet: [0]=0 (ok), [1]=2 (Präfix), [2]=4 (doppelt), [3]=1 (Name leer).' },
      { expect: 'aErrorCode[4] = 3 AND aErrorCode[5] = 5 AND aErrorCode[6] = 0', msg: 'Erwartet: [4]=3 (Kanal 20), [5]=5 (rMin >= rMax), [6]=0.' }
    ] },
    { name: 'Nur nSignals Einträge prüfen, alte Codes löschen', steps: [
      { set: { nDataSet: 2 } }, ...pulse('diCheck', 1),
      { set: { nDataSet: 3 } }, ...pulse('diCheck', 1),
      { expect: 'nErrorCount = 1 AND aErrorCode[1] = 3', msg: 'Datensatz 3: nur Eintrag 1 (Kanal 0) ist fehlerhaft.' },
      { expect: 'aErrorCode[4] = 0 AND aErrorCode[5] = 0', msg: 'Einträge ab nSignals dürfen nicht geprüft werden und müssen Code 0 haben.' }
    ] },
    { name: 'Prüfung nur auf Flanke', steps: [
      { set: { nDataSet: 2 } }, { cycles: 5 },
      { expect: 'nErrorCount = 0 AND NOT doListOk', msg: 'Ohne diCheck darf nichts geprüft werden.' }
    ] }
  ]
};

const exIoTest = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Signaltest-Assistent mit Prüfprotokoll',
  task: [
    'Bei der Inbetriebnahme wird jeder Ausgang einzeln geprüft („Signaltest“). Schreibe einen kleinen Assistenten, der die vier Meldeleuchten `doH1`–`doH4` nacheinander einschaltet und das Ergebnis protokolliert.',
    '',
    '**Ablauf:**',
    '- `nStep` = 0: bereit. Steigende Flanke an `diStartTest` (nur in Schritt 0 oder 5) startet den Test: Protokoll löschen (`aResult[1..4] := 0`, `nNokCount := 0`), `nStep := 1`.',
    '- In Schritt 1–4 ist **nur** die Leuchte `doH<nStep>` eingeschaltet. Der Prüfer bestätigt per Flanke: `diOk` → `aResult[nStep] := 1`, `diNok` → `aResult[nStep] := 2` und `nNokCount` + 1. Danach nächster Schritt.',
    '- Schritt 5: Test fertig, alle Leuchten aus, `doTestDone` = TRUE.',
    '- `diAbort` (Pegel) bricht jederzeit ab: `nStep := 0`, alle Leuchten aus. Bereits erfasste Ergebnisse bleiben stehen.',
    '',
    'Jeder Ausgang wird **an genau einer Stelle** geschrieben (am Ende des Zyklus aus `nStep` abgeleitet).'
  ].join('\n'),
  hints: [
    'Ein Tastendruck darf nur einen Schritt weiterschalten – nutze R_TRIG für `diOk` und `diNok`.',
    '`aResult : ARRAY[1..4] OF USINT;` – dann kannst du direkt `aResult[nStep]` schreiben.',
    'Ausgänge am Ende: `doH1 := (nStep = 1);` usw.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diStartTest', type: 'BOOL', dir: 'in', label: 'Signaltest starten', widget: 'button' },
    { name: 'diOk', type: 'BOOL', dir: 'in', label: 'Prüfer: Leuchte i. O.', widget: 'button' },
    { name: 'diNok', type: 'BOOL', dir: 'in', label: 'Prüfer: Leuchte n. i. O.', widget: 'button' },
    { name: 'diAbort', type: 'BOOL', dir: 'in', label: 'Abbruch', widget: 'button' },
    { name: 'doH1', type: 'BOOL', dir: 'out', label: 'Meldeleuchte H1', widget: 'led' },
    { name: 'doH2', type: 'BOOL', dir: 'out', label: 'Meldeleuchte H2', widget: 'led' },
    { name: 'doH3', type: 'BOOL', dir: 'out', label: 'Meldeleuchte H3', widget: 'led' },
    { name: 'doH4', type: 'BOOL', dir: 'out', label: 'Meldeleuchte H4', widget: 'led' },
    { name: 'doTestDone', type: 'BOOL', dir: 'out', label: 'Signaltest abgeschlossen', widget: 'led' }
  ],
  scene: { type: 'lamp', bind: { lamps: ['doH1', 'doH2', 'doH3', 'doH4'] } },
  files: {
    main: 'PROGRAM _INIT\n\tnStep := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Signaltest-Assistent *)\n\nEND_PROGRAM\n',
    var: 'VAR\n\tnStep : INT; (* 0 = bereit, 1..4 = Leuchte i wird geprueft, 5 = fertig *)\n\taResult : ARRAY[1..4] OF USINT; (* 0 = offen, 1 = i. O., 2 = n. i. O. *)\n\tnNokCount : INT;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: `PROGRAM _INIT
	nStep := 0;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStartTest);
	rtOk(CLK := diOk);
	rtNok(CLK := diNok);

	IF diAbort THEN
		nStep := STEP_IDLE;
	ELSIF rtStart.Q AND ((nStep = STEP_IDLE) OR (nStep = STEP_DONE)) THEN
		FOR i := 1 TO 4 DO
			aResult[i] := RES_OPEN;
		END_FOR
		nNokCount := 0;
		nStep := 1;
	ELSIF (nStep >= 1) AND (nStep <= 4) THEN
		IF rtOk.Q THEN
			aResult[nStep] := RES_OK;
			nStep := nStep + 1;
		ELSIF rtNok.Q THEN
			aResult[nStep] := RES_NOK;
			nNokCount := nNokCount + 1;
			nStep := nStep + 1;
		END_IF
	END_IF

	(* Ausgaenge genau einmal schreiben *)
	doH1 := (nStep = 1);
	doH2 := (nStep = 2);
	doH3 := (nStep = 3);
	doH4 := (nStep = 4);
	doTestDone := (nStep = STEP_DONE);
END_PROGRAM
`,
    var: 'VAR\n\tnStep : INT; (* 0 = bereit, 1..4 = Leuchte i wird geprueft, 5 = fertig *)\n\taResult : ARRAY[1..4] OF USINT; (* 0 = offen, 1 = i. O., 2 = n. i. O. *)\n\tnNokCount : INT;\n\trtStart : R_TRIG;\n\trtOk : R_TRIG;\n\trtNok : R_TRIG;\n\ti : INT;\nEND_VAR\n\nVAR CONSTANT\n\tSTEP_IDLE : INT := 0;\n\tSTEP_DONE : INT := 5;\n\tRES_OPEN : USINT := 0;\n\tRES_OK : USINT := 1;\n\tRES_NOK : USINT := 2;\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Start schaltet nur H1 ein', steps: [
      ...pulse('diStartTest', 1),
      { expect: 'nStep = 1 AND doH1 AND NOT doH2 AND NOT doH3 AND NOT doH4', msg: 'Nach dem Start darf nur doH1 leuchten.' }
    ] },
    { name: 'Alle vier i. O.', steps: [
      ...pulse('diStartTest', 1), ...pulse('diOk', 4),
      { expect: 'doTestDone AND nNokCount = 0 AND aResult[1] = 1 AND aResult[4] = 1', msg: 'Nach 4× i. O. muss der Test fertig und fehlerfrei sein.' },
      { expect: 'NOT doH1 AND NOT doH2 AND NOT doH3 AND NOT doH4', msg: 'Nach dem Test müssen alle Leuchten aus sein.' }
    ] },
    { name: 'Gemischte Ergebnisse werden protokolliert', steps: [
      ...pulse('diStartTest', 1), ...pulse('diOk', 1), ...pulse('diNok', 1), ...pulse('diOk', 1), ...pulse('diNok', 1),
      { expect: 'nNokCount = 2 AND aResult[1] = 1 AND aResult[2] = 2 AND aResult[3] = 1 AND aResult[4] = 2', msg: 'Protokoll falsch: erwartet 1,2,1,2 und nNokCount = 2.' }
    ] },
    { name: 'Gedrückt gehaltene Taste schaltet nur einen Schritt', steps: [
      ...pulse('diStartTest', 1), { set: { diOk: true } }, { ms: 500 },
      { expect: 'nStep = 2 AND doH2', msg: 'Eine gehaltene i.-O.-Taste darf nur einen Schritt weiterschalten (Flanke!).' }
    ] },
    { name: 'Abbruch schaltet alles aus', steps: [
      ...pulse('diStartTest', 1), ...pulse('diOk', 1), ...pulse('diAbort', 1),
      { expect: 'nStep = 0 AND NOT doH2 AND NOT doTestDone AND aResult[1] = 1', msg: 'Abbruch: Schritt 0, Leuchten aus, erfasstes Ergebnis bleibt.' }
    ] },
    { name: 'Neustart löscht das alte Protokoll', steps: [
      ...pulse('diStartTest', 1), ...pulse('diNok', 4), ...pulse('diStartTest', 1),
      { expect: 'nStep = 1 AND NOT doTestDone AND aResult[1] = 0 AND nNokCount = 0', msg: 'Ein neuer Test muss das Protokoll zurücksetzen.' }
    ] }
  ]
};

const tankIo = [
  { name: 'diAuto', type: 'BOOL', dir: 'in', label: 'Wahlschalter Automatik', widget: 'switch' },
  { name: 'diDrain', type: 'BOOL', dir: 'in', label: 'Entleeren anfordern', widget: 'switch' },
  { name: 'diLsHigh', type: 'BOOL', dir: 'in', label: 'Überfüllsicherung LSH (separater Grenzschalter)', widget: 'switch' },
  { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittiertaster', widget: 'button' },
  { name: 'rLevel', type: 'REAL', dir: 'in', label: 'Füllstand', widget: 'gauge', min: 0, max: 100, unit: '%', init: 50 },
  { name: 'doInlet', type: 'BOOL', dir: 'out', label: 'Zulaufpumpe P1', widget: 'led' },
  { name: 'doOutlet', type: 'BOOL', dir: 'out', label: 'Ablaufpumpe P2', widget: 'led' },
  { name: 'doAlarm', type: 'BOOL', dir: 'out', label: 'Alarmleuchte Überfüllung', widget: 'led' }
];

const exReview = {
  id: 'ex1', type: 'st', variant: 'fehlersuche',
  title: 'Review-Befunde umsetzen: Tanksteuerung',
  task: [
    'Ein Junior hat die Füllstandsregelung eines Vorlagetanks geschrieben und bittet dich um ein **Code Review**. Schreibe zuerst deine Befunde auf (was, warum, Vorschlag) und setze sie dann um.',
    '',
    '**Anforderungen aus dem Pflichtenheft:**',
    '1. Im Automatikbetrieb (`diAuto`) arbeitet die Zulaufpumpe als Zweipunktregelung mit **Hysterese**: Einschalten bei `rLevel < 40 %`, Ausschalten bei `rLevel >= 80 %`. Dazwischen bleibt der letzte Zustand erhalten (Startzustand: aus).',
    '2. Spricht die **Überfüllsicherung** `diLsHigh` an, ist der Zulauf **sofort** aus und `doAlarm` wird gespeichert. `diAck` löscht den Alarm nur, wenn `diLsHigh` nicht mehr ansteht. Solange der Alarm ansteht, bleibt der Zulauf aus.',
    '3. Die Ablaufpumpe läuft bei `diDrain`, aber nur bei `rLevel > 10 %` (Trockenlaufschutz).',
    '4. Jeder Ausgang wird an **genau einer** Stelle geschrieben (B&R-Programmierrichtlinie).',
    '',
    'Der Code enthält vier Abweichungen. Konstanten statt magischer Zahlen sind ein fünfter (nicht getesteter) Befund.'
  ].join('\n'),
  hints: [
    'Suche zuerst alle Stellen, an denen `doInlet` geschrieben wird. Welche Zuweisung „gewinnt“ am Zyklusende?',
    'Für die Hysterese brauchst du eine Zustandsvariable (z. B. `bFilling`), die nur an den Schwellen umschaltet.',
    'Speichern und Quittieren: `IF diLsHigh THEN doAlarm := TRUE; ELSIF diAck THEN doAlarm := FALSE; END_IF`.'
  ],
  cycleMs: 10,
  io: tankIo,
  scene: { type: 'tank', bind: { level: 'rLevel', inlet: 'doInlet', outlet: 'doOutlet', lsHigh: 'diLsHigh' } },
  plant: {
    var: 'VAR\n\trFlow : REAL := 0.2; (* %/Zyklus *)\nEND_VAR\n',
    code: 'IF doInlet THEN rLevel := rLevel + rFlow; END_IF\nIF doOutlet THEN rLevel := rLevel - rFlow; END_IF\nIF rLevel > 100.0 THEN rLevel := 100.0; END_IF\nIF rLevel < 0.0 THEN rLevel := 0.0; END_IF\n'
  },
  files: {
    main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	IF diAuto AND rLevel < 80.0 THEN
		doInlet := TRUE;
	ELSE
		doInlet := FALSE;
	END_IF

	doAlarm := diLsHigh;
	IF diLsHigh THEN
		doInlet := FALSE;
	END_IF

	doOutlet := diDrain;

	(* nachtraeglich eingefuegt, damit der Tank schneller voll wird *)
	IF diAuto THEN
		doInlet := rLevel < 80.0;
	END_IF
END_PROGRAM
`,
    var: 'VAR\n\tbDummy : BOOL;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: `(* Tanksteuerung: Zweipunktregelung mit Hysterese, Ueberfuellsicherung, Trockenlaufschutz *)
PROGRAM _INIT
	bFilling := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	(* Ueberfuellsicherung: Alarm speichern, Quittierung nur ohne anstehende Ursache *)
	IF diLsHigh THEN
		doAlarm := TRUE;
	ELSIF diAck THEN
		doAlarm := FALSE;
	END_IF

	(* Zweipunktregler mit Hysterese, damit die Pumpe nicht taktet *)
	IF (NOT diAuto) OR doAlarm THEN
		bFilling := FALSE;
	ELSIF rLevel < LEVEL_ON THEN
		bFilling := TRUE;
	ELSIF rLevel >= LEVEL_OFF THEN
		bFilling := FALSE;
	END_IF

	(* Ausgaenge: jeder genau einmal *)
	doInlet := bFilling AND NOT diLsHigh;
	doOutlet := diDrain AND (rLevel > LEVEL_DRY);
END_PROGRAM
`,
    var: 'VAR\n\tbFilling : BOOL; (* Zustand des Zweipunktreglers *)\nEND_VAR\n\nVAR CONSTANT\n\tLEVEL_ON : REAL := 40.0;  (* % Einschaltschwelle *)\n\tLEVEL_OFF : REAL := 80.0; (* % Ausschaltschwelle *)\n\tLEVEL_DRY : REAL := 10.0; (* % Trockenlaufschutz *)\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Hysterese: kein Takten zwischen 40 % und 80 %', steps: [
      { set: { rLevel: 30, diAuto: true } }, { cycles: 2 },
      { expect: 'doInlet', msg: 'Unter 40 % muss die Zulaufpumpe laufen.' },
      { until: 'NOT doInlet', maxMs: 5000, msg: 'Zulauf schaltet bei 80 % nicht ab.' },
      { expect: 'rLevel >= 79.5', msg: 'Der Zulauf darf erst bei 80 % abschalten.' },
      { set: { diDrain: true } },
      { never: 'doInlet', ms: 700, msg: 'Zwischen 80 % und 40 % darf der Zulauf nicht wieder einschalten (Hysterese).' },
      { until: 'doInlet', maxMs: 2000, msg: 'Unter 40 % muss der Zulauf wieder einschalten.' },
      { expect: 'rLevel < 40.5', msg: 'Wiedereinschalten erst unter 40 %.' }
    ] },
    { name: 'Überfüllsicherung schaltet Zulauf sofort ab', steps: [
      { set: { rLevel: 30, diAuto: true } }, { cycles: 2 },
      { set: { rLevel: 50, diLsHigh: true } }, { cycles: 2 },
      { expect: 'NOT doInlet AND doAlarm', msg: 'Bei Überfüllsicherung muss der Zulauf aus sein – wird doInlet später noch einmal überschrieben?' }
    ] },
    { name: 'Alarm wird gespeichert und quittiert', steps: [
      { set: { diLsHigh: true } }, { cycles: 2 }, { set: { diLsHigh: false } }, { cycles: 2 },
      { expect: 'doAlarm', msg: 'Der Alarm muss gespeichert bleiben, bis quittiert wird.' },
      ...pulse('diAck', 2),
      { expect: 'NOT doAlarm', msg: 'Quittierung ohne anstehende Ursache muss den Alarm löschen.' }
    ] },
    { name: 'Quittierung bei anstehender Ursache wirkungslos', steps: [
      { set: { diLsHigh: true } }, { cycles: 2 }, ...pulse('diAck', 2),
      { expect: 'doAlarm', msg: 'Solange diLsHigh ansteht, darf der Alarm nicht gelöscht werden.' }
    ] },
    { name: 'Trockenlaufschutz der Ablaufpumpe', steps: [
      { set: { rLevel: 8, diDrain: true } }, { cycles: 2 },
      { expect: 'NOT doOutlet', msg: 'Unter 10 % darf die Ablaufpumpe nicht laufen.' },
      { set: { rLevel: 50 } }, { cycles: 2 },
      { expect: 'doOutlet', msg: 'Über 10 % soll die Ablaufpumpe bei diDrain laufen.' }
    ] }
  ]
};

module.exports = [
  {
    id: 'praxis-2-anforderungen', level: 2, kind: 'lektion',
    title: 'Lastenheft, Pflichtenheft und Signallisten lesen',
    summary: 'Aus Anforderungen testbare Funktionen ableiten und Signallisten auf Plausibilität prüfen.',
    minutes: 150, req: ['praxis-1-coding-guidelines'],
    briefing: 'Jede Maschine beginnt mit Anforderungen. Das Lastenheft beschreibt, was der Kunde will; das Pflichtenheft, wie der Auftragnehmer es umsetzt. Für den SPS-Programmierer sind zusätzlich die Signalliste (I/O-Liste) und der Schaltplan entscheidend: Sie verbinden jede Variable mit Klemme, Karte und Kanal. Wer diese Dokumente systematisch liest, findet Widersprüche, bevor sie beim Kunden auffallen. Du lernst, Anforderungen in prüfbare Aussagen zu übersetzen und eine Signalliste automatisch auf typische Fehler zu prüfen.',
    practice: 'Eine doppelt belegte Klemme oder ein vertauschter Messbereich in der I/O-Liste kostet bei der Inbetriebnahme Stunden. Ein Plausibilitätscheck vor dem Aufbau der Hardware-Konfiguration fängt solche Fehler früh.',
    transfer: {
      tia: 'In TIA Portal lassen sich PLC-Variablentabellen aus Excel importieren/exportieren; die gleiche Prüfung (Präfix, Doppelbelegung, Bereich) machst du dort vor dem Import.',
      codesys: 'In CODESYS/TwinCAT wird die I/O-Zuordnung über Mapping bzw. Verknüpfung gemacht; auch hier lohnt sich eine Prüfung der Signalliste vor dem Verknüpfen.'
    },
    objectives: [
      {
        id: 'o1', title: 'Unterscheide Lastenheft und Pflichtenheft',
        guide: {
          intro: 'Lastenheft = Was und Wofür (Auftraggeber). Pflichtenheft = Wie und Womit (Auftragnehmer). Beide sind Vertragsgrundlage für die Abnahme.',
          steps: [
            'Lies im Lastenheft die Abschnitte Ziel, Funktionen, Leistungsdaten (z. B. Takte/min) und Randbedingungen.',
            'Markiere jede Anforderung, die du nicht **prüfen** kannst („schnell“, „benutzerfreundlich“) – das sind Rückfragen an den Projektleiter.',
            'Suche im Pflichtenheft die Umsetzung jeder Lastenheft-Anforderung. Fehlt eine, notiere sie als offene Frage.',
            'Formuliere jede Software-Anforderung als prüfbaren Satz: „Wenn …, dann … innerhalb von …“.',
            'Gib jeder Anforderung eine ID (z. B. `REQ-012`) – darauf verweisen später Tests und Abnahmeprotokoll.'
          ],
          done: 'Erledigt, wenn du für ein Beispiel-Lastenheft fünf Anforderungen als prüfbare Sätze mit ID formuliert hast.',
          tip: 'Was nicht im Pflichtenheft steht, ist bei der Abnahme schwer einzufordern – und schwer abzulehnen. Kläre es vorher schriftlich.'
        }
      },
      {
        id: 'o2', title: 'Lies eine Signalliste und den Schaltplan zusammen',
        guide: {
          intro: 'Eine Signalliste enthält je Signal mindestens: Betriebsmittelkennzeichen, Beschreibung, Variablenname, Richtung, Karte/Steckplatz, Kanal, Typ (digital/analog) und Messbereich.',
          steps: [
            'Öffne die Signalliste (meist Excel/EPLAN-Export) und den Schaltplan parallel.',
            'Prüfe für Stichproben: Stimmt der Kanal in der Liste mit der Klemmenbezeichnung im Plan überein?',
            'Prüfe die Richtung: Ein Sensor ist ein Eingang (`di`/`ai`), ein Ventil oder Schütz ein Ausgang (`do`/`ao`).',
            'Prüfe bei Analogsignalen Messbereich und Einheit (z. B. 0–10 V = 0–150 °C) und ob Drahtbrucherkennung (4–20 mA) gefordert ist.',
            'Lege in AS6 die I/O-Zuordnung (I/O Mapping des Moduls im **Physical View**) erst an, wenn die Liste geprüft ist.'
          ],
          done: 'Erledigt, wenn du in einer Signalliste mindestens drei Merkmale je Signal gegen den Schaltplan geprüft hast.',
          tip: 'Halte Liste und Programm synchron: Wer einen Variablennamen ändert, ändert ihn auch in der Signalliste – am besten im selben Commit.',
          link: { label: 'B&R Help: Namenskonventionen – Variablen (I/O-Präfixe)', url: help('programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions_variables.html') }
        }
      },
      {
        id: 'o3', title: 'Prüfe eine Signalliste automatisiert',
        guide: {
          intro: 'Wiederkehrende Prüfungen automatisiert man. In der Übung bildest du die Signalliste als Array von Strukturen ab und prüfst fünf Regeln.',
          steps: [
            'Lege den Datentyp `Signal_typ` in `Types.typ` an (Name, Richtung als Enum, Modul, Kanal, Messbereich).',
            'Schreibe die Prüfung als Schleife über `0..nSignals-1`; die erste verletzte Regel bestimmt den Code.',
            'Prüfe Doppelbelegungen mit einer inneren Schleife über alle früheren Einträge.',
            'Lege Fehlercodes als Konstanten an – so steht im Code `ERR_DUPLICATE` statt einer 4.',
            'Teste mit allen drei Datensätzen, besonders mit dem Grenzfall „alte Einträge im Array“.'
          ],
          done: 'Erledigt, wenn die Übung „Plausibilitätsprüfung einer Signalliste“ alle Tests besteht.',
          tip: 'Grenzen von Schleifen sind die häufigste Fehlerquelle: Prüfe immer den Fall „0 Einträge“ und „Array voll“.'
        }
      }
    ],
    videos: [V.sophist, V.grosserLasten, V.ioList],
    readings: [R.glinzSpezifikation, R.ausbRahmenplan, R.wikiLastenheft],
    quiz: [
      { type: 'single', q: 'Wer erstellt üblicherweise das Pflichtenheft?', options: ['Der Auftraggeber', 'Der Auftragnehmer', 'Die Berufsgenossenschaft', 'Der Hersteller der Steuerung'], correct: 1,
        explain: 'Der Auftragnehmer beschreibt im Pflichtenheft, wie er die Anforderungen des Lastenhefts umsetzt.' },
      { type: 'single', q: 'Welche Anforderung ist prüfbar formuliert?',
        options: ['Die Anlage soll schnell reagieren.', 'Nach Betätigen von Not-Halt soll die Anlage zuverlässig stehen.', 'Bei Stau (Lichtschranke B3 länger als 2 s belegt) stoppt das Band innerhalb eines Zyklus und meldet Fehler 1.', 'Die Bedienung soll intuitiv sein.'],
        correct: 2, explain: 'Nur die dritte Anforderung nennt Bedingung, erwartete Reaktion und messbare Grenze.' },
      { type: 'multi', q: 'Welche Fehler kann eine automatische Plausibilitätsprüfung einer Signalliste finden?',
        options: ['Doppelt belegte Kanäle', 'Präfix passt nicht zur Richtung', 'Falsch angeschlossene Leitung an der Klemme', 'Messbereich mit Min ≥ Max'],
        correct: [0, 1, 3], explain: 'Eine falsche Verdrahtung ist in der Liste nicht sichtbar – sie fällt erst beim Signaltest auf.' }
    ],
    exam: [
      { type: 'single', q: 'Wie viele Durchläufe hat die innere Schleife `FOR j := 0 TO i - 1` für i = 0?',
        options: ['0', '1', '−1', 'Endlosschleife'], correct: 0, explain: 'Endwert −1 ist kleiner als Startwert 0, die Schleife wird nicht durchlaufen.' },
      { type: 'single', q: 'Ein Analogeingang 0–10 V soll 0–150 °C abbilden. Was gehört zwingend in die Signalliste?',
        options: ['Nur der Variablenname', 'Messbereich und physikalische Einheit', 'Die Zykluszeit des Tasks', 'Der Name des Programmierers'],
        correct: 1, explain: 'Ohne Messbereich und Einheit kann niemand die Skalierung prüfen.' },
      { type: 'multi', q: 'Was tust du, wenn Lastenheft und Signalliste sich widersprechen?',
        options: ['Den Widerspruch dokumentieren', 'Beim Projektleiter/Kunden schriftlich klären', 'Die Variante wählen, die einfacher zu programmieren ist', 'Nach Klärung beide Dokumente aktualisieren lassen'],
        correct: [0, 1, 3], explain: 'Widersprüche werden geklärt und dokumentiert, nicht still im Code entschieden.' },
      { type: 'single', q: 'Wozu dient eine Anforderungs-ID wie REQ-012?',
        options: ['Zur Lizenzierung', 'Zur Rückverfolgbarkeit zwischen Anforderung, Code, Test und Abnahme', 'Als Variablenname', 'Zur Sortierung im Logger'],
        correct: 1, explain: 'Über die ID lässt sich nachweisen, welche Anforderung wie umgesetzt und getestet wurde.' }
    ],
    exercises: [exSignalliste],
    proof: false
  },
  {
    id: 'praxis-2-inbetriebnahme-checkliste', level: 2, kind: 'lektion',
    title: 'Inbetriebnahme-Checkliste und -Protokoll',
    summary: 'Eine Inbetriebnahme planen, Signale systematisch testen und das Ergebnis nachvollziehbar protokollieren.',
    minutes: 150, req: ['praxis-2-anforderungen'],
    briefing: 'Inbetriebnahme ist der Moment, in dem Software auf echte Hardware trifft. Eine Checkliste sorgt dafür, dass nichts vergessen wird: Sicherheitsprüfungen, Spannungsversorgung, Kommunikation, Signaltest, Funktionstest. Das Protokoll dokumentiert jeden Schritt mit Ergebnis, Datum und Namen – der Ausbildungsrahmenplan verlangt ausdrücklich, Inbetriebnahmeprotokolle zu erstellen und Anlagen zu übergeben. In diesem Modul baust du eine eigene Checkliste und programmierst einen Signaltest-Assistenten, der das Prüfprotokoll gleich mitschreibt.',
    practice: 'Beim Signaltest prüfen meist zwei Personen: Einer bedient am Schaltschrank, einer beobachtet an der Maschine. Ein Assistent im Programm, der Ausgänge der Reihe nach schaltet und das Ergebnis speichert, spart Funkverkehr und Zettelwirtschaft.',
    transfer: {
      tia: 'Im TIA Portal nutzt man Beobachtungs- und Forcetabellen für den Signaltest; das Prinzip „ein Ausgang nach dem anderen, Ergebnis protokollieren“ ist identisch.',
      codesys: 'In CODESYS/TwinCAT werden Ausgänge in der Online-Ansicht geschrieben oder geforct; auch dort gehört das Ergebnis in ein Protokoll.'
    },
    objectives: [
      {
        id: 'o1', title: 'Erstelle eine Inbetriebnahme-Checkliste',
        guide: {
          intro: 'Eine gute Checkliste folgt der Reihenfolge der Inbetriebnahme: erst sicher, dann spannungsfrei prüfbar, dann Schritt für Schritt unter Spannung.',
          steps: [
            'Sicherheit: Gefährdungen geklärt, Not-Halt und Schutzeinrichtungen geprüft (durch befugte Personen), Arbeitsbereich abgesperrt.',
            'Elektrik: Prüfprotokoll der elektrischen Ausrüstung (z. B. nach EN 60204-1) liegt vor – das macht die Elektrofachkraft, nicht die Software.',
            'Steuerung: Firmware/AR-Version, Projektstand (Git-Tag), IP-Adressen, Online-Verbindung.',
            'Signaltest: jeder Eingang und Ausgang laut Signalliste, Ergebnis je Signal.',
            'Funktionstest: jede Anforderung (REQ-ID) aus dem Pflichtenheft, inklusive Fehlerfälle.'
          ],
          done: 'Erledigt, wenn deine Checkliste für eine Beispielstation alle fünf Blöcke mit mindestens je zwei Punkten enthält.',
          tip: 'Eine Checkliste ist nie fertig: Ergänze nach jeder Inbetriebnahme, was gefehlt hat.',
          link: { label: 'DGUV IFA: Prüfung der elektrischen Ausrüstung von Maschinen', url: 'https://www.dguv.de/ifa/praxishilfen/praxishilfen-maschinenschutz/pruefung-der-elektrischen-ausruestung-von-maschinen/index.jsp' }
        }
      },
      {
        id: 'o2', title: 'Führe einen Signaltest mit dem Watch durch',
        guide: {
          intro: 'Beim Signaltest wird jedes Signal der Liste einzeln an der Maschine ausgelöst bzw. geschaltet und im Programm beobachtet.',
          steps: [
            'Stelle sicher, dass das Programm keine Ausgänge selbstständig schaltet (Task angehalten oder Inbetriebnahme-Modus).',
            'Öffne den Watch mit **Strg+W** für die I/O-Variablen bzw. die I/O-Ansicht im Monitormodus (**Strg+M**).',
            'Eingänge: Sensor betätigen, Wert im Watch prüfen, Ergebnis in die Liste eintragen.',
            'Ausgänge: Wert im Watch setzen bzw. forcen, Reaktion an der Maschine beobachten (zweite Person), eintragen.',
            'Forcing **immer** wieder aufheben und im Protokoll vermerken, dass keine Forces mehr aktiv sind.'
          ],
          done: 'Erledigt, wenn du für eine Station alle I/Os getestet und das Ergebnis je Signal protokolliert hast.',
          tip: 'Aktive Forces sind eine der häufigsten Ursachen für „unerklärliches“ Verhalten nach der Inbetriebnahme. Prüfe vor dem Verlassen der Anlage, dass keine Forces aktiv sind.',
          link: { label: 'B&R Help: Aktivierung des Variablenmonitors', url: help('diagnostics_support/diagnosis/watch/diagnosis_watch_activate.html') }
        }
      },
      {
        id: 'o3', title: 'Programmiere einen Signaltest-Assistenten',
        guide: {
          intro: 'Ein Assistent schaltet die Ausgänge nacheinander und speichert die Bestätigung des Prüfers in einem Array – das Ergebnis ist direkt das Protokoll.',
          steps: [
            'Modelliere den Ablauf über eine Schrittvariable `nStep` (0 = bereit, 1..4 = Prüfung, 5 = fertig).',
            'Werte alle Taster mit Flanken aus, damit ein Druck genau einen Schritt weiterschaltet.',
            'Schreibe die Ausgänge am Zyklusende genau einmal aus `nStep` ab.',
            'Teste die Fehlerfälle: Abbruch, gedrückt gehaltene Taste, Neustart nach Abschluss.',
            'Überlege, wie das Protokoll aus `aResult` in die Visualisierung oder eine CSV-Datei käme.'
          ],
          done: 'Erledigt, wenn die Übung „Signaltest-Assistent“ alle Tests besteht.',
          tip: 'Ein Inbetriebnahme-Hilfsprogramm gehört ins Repository, aber nicht in die Auslieferkonfiguration – nutze eine eigene Konfiguration oder einen Freigabeschalter.'
        }
      },
      {
        id: 'o4', title: 'Schreibe ein Inbetriebnahme-Protokoll',
        guide: {
          intro: 'Das Protokoll ist der Nachweis, was wann von wem mit welchem Ergebnis geprüft wurde.',
          steps: [
            'Kopf: Anlage, Kunde, Datum, Beteiligte, Software-Stand (Git-Tag/Commit-Hash), AR-Version.',
            'Je Prüfpunkt: ID, Beschreibung, Soll, Ist, Ergebnis (i. O./n. i. O.), Bemerkung.',
            'Mängel mit Maßnahme und Verantwortlichem aufnehmen, nicht „vergessen“.',
            'Abschluss: offene Punkte, Unterschriften, Übergabe an den Betreiber.',
            'Lege das Protokoll versioniert im Projektordner ab (z. B. `Doc/Inbetriebnahme/`).'
          ],
          done: 'Erledigt, wenn du eine Protokollvorlage mit Kopf, Prüfpunkttabelle und Mängelliste erstellt hast.',
          tip: 'Notiere den exakten Software-Stand. „Die Version vom Dienstag“ hilft in einem Jahr niemandem.',
          link: { label: 'Lehrmaterial fischertechnik: Inbetriebnahmeprotokoll', url: 'https://fischertechnik.de/-/media/fischertechnik/rebrush/industrie-und-hochschulen/technische-dokumente/fertigungslinie-24v/de/03_inbetriebnahme_hardware.pdf' }
        }
      }
    ],
    videos: [V.eplanPruef, V.debugTools],
    readings: [R.ausbRahmenplan, R.fischertechnikIbn, R.dguvPruefung],
    quiz: [
      { type: 'single', q: 'Warum wird jeder Taster im Signaltest-Assistenten mit einer Flanke ausgewertet?',
        options: ['Damit die Zykluszeit sinkt', 'Damit ein gehaltener Tastendruck nicht mehrere Schritte überspringt', 'Weil Pegel in ST nicht abfragbar sind', 'Weil der Watch nur Flanken anzeigt'],
        correct: 1, explain: 'Bei Pegelauswertung würde der Schritt in jedem Zyklus weiterschalten, solange die Taste gedrückt ist.' },
      { type: 'multi', q: 'Was gehört in den Kopf eines Inbetriebnahme-Protokolls?',
        options: ['Software-Stand (Tag oder Commit-Hash)', 'Datum und Beteiligte', 'Anlage und Kunde', 'Das Passwort der Steuerung'],
        correct: [0, 1, 2], explain: 'Passwörter gehören nie in ein Protokoll.' },
      { type: 'single', q: 'Du hast beim Signaltest einen Ausgang geforct. Was ist vor dem Verlassen der Anlage Pflicht?',
        options: ['Das Projekt neu übersetzen', 'Alle Forces aufheben und dies protokollieren', 'Die Steuerung ausschalten', 'Den Logger löschen'],
        correct: 1, explain: 'Vergessene Forces führen zu gefährlichem oder unerklärlichem Verhalten.' }
    ],
    exam: [
      { type: 'single', q: 'In welcher Reihenfolge läuft eine Inbetriebnahme typischerweise ab?',
        options: ['Funktionstest → Signaltest → Sicherheit', 'Sicherheit → Elektrik geprüft → Steuerung/Kommunikation → Signaltest → Funktionstest', 'Signaltest → Sicherheit → Funktionstest', 'Funktionstest → Abnahme → Signaltest'],
        correct: 1, explain: 'Erst Sicherheit und elektrische Prüfung, dann Steuerung, dann Signal- und Funktionstest.' },
      { type: 'single', q: 'Wer führt die Prüfung der elektrischen Ausrüstung (z. B. Isolationswiderstand, Schutzleiter) durch?',
        options: ['Der SPS-Programmierer per Software', 'Eine Elektrofachkraft mit geeigneten Prüfmitteln', 'Der Kunde', 'Niemand, das macht die Steuerung automatisch'],
        correct: 1, explain: 'Elektrische Prüfungen sind Aufgabe einer Elektrofachkraft; die Software kann sie nicht ersetzen.' },
      { type: 'multi', q: 'Welche Angaben gehören zu jedem Prüfpunkt im Protokoll?',
        options: ['Soll-Zustand', 'Ist-Zustand', 'Ergebnis i. O./n. i. O.', 'Lieblingsfarbe des Prüfers'], correct: [0, 1, 2],
        explain: 'Soll, Ist und Ergebnis machen einen Prüfpunkt nachvollziehbar.' },
      { type: 'numeric', q: 'Eine Station hat {DI} digitale Eingänge und {DO} digitale Ausgänge. Für jedes Signal planst du 1,5 Minuten Signaltest. Wie viele Minuten planst du insgesamt?',
        params: { DI: [16, 64, 4], DO: [8, 32, 4] }, formula: '(DI + DO) * 1.5', unit: 'min', tol: 0.01,
        explain: 'Gesamtdauer = (Anzahl Eingänge + Anzahl Ausgänge) × 1,5 min.' }
    ],
    exercises: [exIoTest],
    proof: false
  },
  {
    id: 'praxis-2-code-review', level: 2, kind: 'projekt',
    title: 'Code Review geben und empfangen',
    summary: 'Reviews strukturiert durchführen, Befunde sachlich formulieren und Feedback souverän annehmen.',
    minutes: 180, req: ['praxis-2-anforderungen'],
    briefing: 'Ein Code Review ist die günstigste Qualitätssicherung, die es gibt: Ein zweites Paar Augen findet Fehler, die Tests nicht abdecken, und verbreitet Wissen im Team. Die B&R-Programmierrichtlinie empfiehlt, dass Teammitglieder ihre Arbeit gegenseitig prüfen. Gute Reviews sind konkret, begründet und freundlich; gute Autoren liefern kleine Änderungen mit klarer Beschreibung und nehmen Feedback als Hilfe an. In diesem Praxisprojekt reviewst du die Tanksteuerung eines Kollegen, setzt die Befunde um und reichst das Review als Merge-Request auf git.breitner.de ein.',
    practice: 'Bei BREITNER geht keine Änderung ohne Review in den Hauptzweig. Am häufigsten gefunden werden: Ausgänge an mehreren Stellen geschrieben, fehlende Flanken, fehlende Hysterese und magische Zahlen.',
    transfer: {
      tia: 'TIA-Projekte lassen sich mit der Vergleichsfunktion (Offline/Offline) reviewen; mit TIA Portal Openness und SIMATIC AX auch textbasiert in Git.',
      codesys: 'CODESYS bietet Projektvergleich; TwinCAT-Projekte sind textbasiert (XML) und werden oft direkt in Git-Merge-Requests reviewt.'
    },
    objectives: [
      {
        id: 'o1', title: 'Bereite ein Review vor',
        guide: {
          intro: 'Vor dem Lesen des Codes brauchst du den Kontext: Welche Anforderung wird umgesetzt, was hat sich geändert?',
          steps: [
            'Lies die Beschreibung des Merge-Requests und die betroffene Anforderung (REQ-ID).',
            'Lass dir die Änderungen anzeigen: im Git-Werkzeug als Diff oder in AS6 mit **Datei › Quelldateien vergleichen** (Kontextmenü eines Programms).',
            'Übersetze den Stand selbst (**F7**) – Warnungen sind schon der erste Befund.',
            'Prüfe mit dem Querverweis (**Strg+Alt+R**), wo jeder Ausgang geschrieben wird.',
            'Plane max. 60 Minuten am Stück – danach sinkt die Fehlerfindungsrate deutlich.'
          ],
          done: 'Erledigt, wenn du Kontext, Diff und Build-Ergebnis der Änderung kennst, bevor du den ersten Kommentar schreibst.',
          tip: 'Reviewe kleine Änderungen sofort. Große Änderungen bittest du in kleinere Teile aufzuteilen.',
          link: { label: 'B&R Community: Guide Project Compare', url: 'https://community.br-automation.com/t/guide-project-compare/3755' }
        }
      },
      {
        id: 'o2', title: 'Prüfe nach einer Review-Checkliste',
        guide: {
          intro: 'Eine feste Checkliste macht Reviews vergleichbar und verhindert, dass nur Formatierung diskutiert wird.',
          steps: [
            '**Funktion:** Erfüllt der Code die Anforderung inkl. Grenz- und Fehlerfälle?',
            '**Sicherheit/Robustheit:** Sichere Zustände bei Fehlern, keine Division durch 0, keine Endlosschleifen?',
            '**Struktur:** Ausgänge genau einmal geschrieben, Timer jeden Zyklus aufgerufen, Flanken wo nötig?',
            '**Lesbarkeit:** Namen nach Guideline, Konstanten statt magischer Zahlen, Kommentare erklären das Warum.',
            '**Tests:** Wie wurde getestet, sind die Tests nachvollziehbar?'
          ],
          done: 'Erledigt, wenn du für die Tanksteuerung zu jedem Checklistenpunkt eine Aussage notiert hast.',
          tip: 'Kennzeichne Befunde nach Gewicht: „Muss“ (Fehler), „Sollte“ (Wartbarkeit), „Nit“ (Geschmack).',
          link: { label: 'Google Engineering Practices: How to do a code review', url: 'https://google.github.io/eng-practices/review/reviewer/' }
        }
      },
      {
        id: 'o3', title: 'Formuliere Befunde sachlich und konkret',
        guide: {
          intro: 'Ein guter Review-Kommentar beschreibt Beobachtung, Auswirkung und Vorschlag – über den Code, nie über die Person.',
          steps: [
            'Beobachtung: „`doInlet` wird in Zeile 5 und Zeile 18 geschrieben.“',
            'Auswirkung: „Die zweite Zuweisung überschreibt die Abschaltung durch die Überfüllsicherung.“',
            'Vorschlag: „Zustand in `bFilling` berechnen und `doInlet` einmal am Ende zuweisen.“',
            'Stelle Fragen, wenn du die Absicht nicht verstehst: „Was war der Grund für …?“',
            'Lobe konkret, was gut ist – das zeigt, was beibehalten werden soll.'
          ],
          done: 'Erledigt, wenn deine Befunde zur Tanksteuerung alle nach Beobachtung – Auswirkung – Vorschlag formuliert sind.',
          tip: '„Du hast vergessen …“ wirkt anders als „Hier fehlt …“. Formuliere über den Code.'
        }
      },
      {
        id: 'o4', title: 'Setze Befunde um und nimm Feedback an',
        guide: {
          intro: 'Als Autor ist ein Review keine Prüfung deiner Person, sondern Hilfe für das Produkt.',
          steps: [
            'Beantworte jeden Kommentar: umgesetzt (mit Commit), begründet abgelehnt oder als Ticket für später.',
            'Setze die Befunde in kleinen Commits um, z. B. `fix: Ausgang doInlet nur einmal schreiben`.',
            'Teste nach jeder Korrektur – hier mit den automatischen Tests der Übung.',
            'Bei Uneinigkeit: kurz sprechen statt langer Kommentar-Ping-Pong; Ergebnis im Merge-Request festhalten.',
            'Reiche den Link zum Merge-Request auf git.breitner.de als Nachweis ein.'
          ],
          done: 'Erledigt, wenn die Übung alle Tests besteht und der Merge-Request mit beantworteten Kommentaren als Nachweis eingereicht ist.',
          tip: 'Bedanke dich für gefundene Fehler – jeder Fehler im Review ist einer weniger beim Kunden.',
          link: { label: 'Google Engineering Practices: The CL author’s guide', url: 'https://google.github.io/eng-practices/review/developer/' }
        }
      }
    ],
    videos: [V.nativeWebReview, V.farleyReview, V.jetbrainsReview],
    readings: [R.glinzQualitaet, R.googleReviewer, R.communityCompare],
    quiz: [
      { type: 'single', q: 'Welcher Review-Befund wiegt am schwersten?',
        code: { lang: 'st', text: 'IF diAuto THEN\n\tdoValve := rLevel < 80.0;\nEND_IF\n(* ... 40 Zeilen spaeter ... *)\nIF diEmergencyLevel THEN\n\tdoValve := FALSE;\nEND_IF\nIF bManual THEN\n\tdoValve := diManualOpen;\nEND_IF' },
        options: ['Die Zahl 80.0 ist nicht als Konstante angelegt', 'doValve wird an drei Stellen geschrieben; der Handbetrieb überschreibt die Notabschaltung', 'Der Kommentar ist auf Deutsch', 'Es fehlt eine Leerzeile'],
        correct: 1, explain: 'Die letzte Zuweisung gewinnt. Im Handbetrieb wird die Notabschaltung ausgehebelt – ein funktionaler Fehler mit Sicherheitsbezug.' },
      { type: 'single', q: 'Welcher Kommentar ist im Sinne eines guten Reviews formuliert?',
        options: ['„Das ist falsch.“', '„Du hast schon wieder keine Flanke benutzt.“', '„Hier zählt der Zähler in jedem Zyklus, solange B1 belegt ist. Vorschlag: R_TRIG auf diSensor.“', '„Würde ich anders machen.“'],
        correct: 2, explain: 'Beobachtung, Auswirkung und konkreter Vorschlag, bezogen auf den Code.' },
      { type: 'single', q: 'Was ist an diesem Code problematisch?',
        code: { lang: 'st', text: 'CASE nStep OF\n1:\n\ttonWait(IN := TRUE, PT := T#2s);\n\tIF tonWait.Q THEN nStep := 2; END_IF\n2:\n\t(* ... *)\nEND_CASE' },
        options: ['CASE darf keine Zahlen verwenden', 'Der Timer wird nur in Schritt 1 aufgerufen und nie zurückgesetzt – beim nächsten Durchlauf ist Q sofort TRUE', 'T#2s ist keine gültige Zeitangabe', 'Nichts'],
        correct: 1, explain: 'Ein TON wird nur zurückgesetzt, wenn er mit IN = FALSE aufgerufen wird. Timer gehören außerhalb der CASE-Anweisung jeden Zyklus aufgerufen.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Aussagen zu Code Reviews stimmen?',
        options: ['Reviews verbreiten Wissen im Team', 'Kleine Änderungen lassen sich besser reviewen', 'Ein Review ersetzt Tests vollständig', 'Befunde sollen sich auf den Code beziehen, nicht auf die Person'],
        correct: [0, 1, 3], explain: 'Reviews ergänzen Tests, ersetzen sie aber nicht.' },
      { type: 'single', q: 'Ein Reviewer schlägt eine Änderung vor, die du für falsch hältst. Was tust du?',
        options: ['Den Kommentar ignorieren', 'Begründet antworten und bei Bedarf kurz persönlich klären; Ergebnis festhalten', 'Den Reviewer wechseln', 'Die Änderung ungeprüft übernehmen'],
        correct: 1, explain: 'Sachliche Begründung und schnelle Klärung halten das Review produktiv.' },
      { type: 'single', q: 'Was ist an diesem Ausdruck für eine Hysterese falsch?',
        code: { lang: 'st', text: 'doHeater := rTemp < 60.0;\nIF rTemp > 65.0 THEN\n\tdoHeater := FALSE;\nEND_IF' },
        options: ['Nichts, das ist eine Hysterese', 'Zwischen 60 und 65 °C ist die Heizung immer aus – es gibt keinen gespeicherten Zustand, also keine Hysterese', 'Vergleiche mit REAL sind verboten', 'Die Heizung schaltet nie ein'],
        correct: 1, explain: 'Eine Hysterese braucht einen Zustand, der nur an den Schwellen umschaltet. Hier wirkt nur die 60-°C-Schwelle.' },
      { type: 'single', q: 'Wie lange sollte eine einzelne Review-Sitzung ungefähr maximal dauern?',
        options: ['10 Minuten', '60 Minuten', '4 Stunden', 'So lange wie nötig, ohne Pause'], correct: 1,
        explain: 'Erfahrungswerte aus der Reviewtechnik zeigen, dass die Aufmerksamkeit nach etwa einer Stunde deutlich nachlässt.' }
    ],
    exercises: [exReview],
    proof: true,
    badge: 'Code-Reviewer'
  }
];
