'use strict';
const { brHelp, brLink, ABGERUFEN } = require('./_util');

// ---------------------------------------------------------------------------
// Level 4 (Engineer): Rezepte, Trends & Audit Trail, Praxisprojekt High-Performance-HMI
// ---------------------------------------------------------------------------

const TYP_RECIPE = `TYPE
	Recipe_typ : STRUCT
		Name : STRING[20];
		Speed : REAL; (* % 0..100 *)
		Temp : REAL; (* °C 20..200 *)
		HoldTime : UINT; (* s 1..3600 *)
		Valid : BOOL; (* Speicherplatz belegt *)
	END_STRUCT;
	RcpCmd_typ : STRUCT
		Request : INT; (* 1 Laden, 2 Speichern, 3 Löschen; SPS setzt auf 0 zurück *)
		Index : INT; (* Speicherplatz 0..9 *)
	END_STRUCT;
	RcpStatus_typ : STRUCT
		Result : INT; (* 0 ok, 1 Index ungültig, 2 Platz leer, 3 Plausibilität, 4 Maschine läuft, 5 Name doppelt *)
		Count : INT; (* belegte Plätze *)
		ActiveName : STRING[20]; (* Name des aktiven Rezepts *)
		Dirty : BOOL; (* Editierpuffer weicht vom aktiven Rezept ab *)
	END_STRUCT;
	RcpHmi_typ : STRUCT
		Cmd : RcpCmd_typ;
		Edit : Recipe_typ; (* Editierpuffer, an die Eingabefelder gebunden *)
		Status : RcpStatus_typ;
	END_STRUCT;
END_TYPE
`;

const MAIN_RECIPE_SOL = `PROGRAM _INIT
	(* Beispielrezept auf Platz 0 *)
	aRecipe[0].Name := 'Standard';
	aRecipe[0].Speed := 50.0;
	aRecipe[0].Temp := 80.0;
	aRecipe[0].HoldTime := 60;
	aRecipe[0].Valid := TRUE;
	stActive := aRecipe[0];
	gHmi.Edit := aRecipe[0];
END_PROGRAM

PROGRAM _CYCLIC
	IF gHmi.Cmd.Request <> 0 THEN
		nIdx := gHmi.Cmd.Index;
		IF (nIdx < 0) OR (nIdx > 9) THEN
			nResult := 1;
		ELSIF gHmi.Cmd.Request = 1 THEN
			(* Laden *)
			IF diRunning THEN
				nResult := 4;
			ELSIF NOT aRecipe[nIdx].Valid THEN
				nResult := 2;
			ELSE
				stActive := aRecipe[nIdx];
				gHmi.Edit := aRecipe[nIdx];
				nResult := 0;
			END_IF;
		ELSIF gHmi.Cmd.Request = 2 THEN
			(* Speichern mit Plausibilitätsprüfung *)
			bPlausible := (LEN(gHmi.Edit.Name) > 0)
				AND (gHmi.Edit.Speed >= 0.0) AND (gHmi.Edit.Speed <= 100.0)
				AND (gHmi.Edit.Temp >= 20.0) AND (gHmi.Edit.Temp <= 200.0)
				AND (gHmi.Edit.HoldTime >= 1) AND (gHmi.Edit.HoldTime <= 3600);
			bDuplicate := FALSE;
			FOR i := 0 TO 9 DO
				IF (i <> nIdx) AND aRecipe[i].Valid AND (aRecipe[i].Name = gHmi.Edit.Name) THEN
					bDuplicate := TRUE;
				END_IF;
			END_FOR;
			IF NOT bPlausible THEN
				nResult := 3;
			ELSIF bDuplicate THEN
				nResult := 5;
			ELSE
				aRecipe[nIdx] := gHmi.Edit;
				aRecipe[nIdx].Valid := TRUE;
				gHmi.Edit.Valid := TRUE;
				stActive := aRecipe[nIdx];
				nResult := 0;
			END_IF;
		ELSIF gHmi.Cmd.Request = 3 THEN
			(* Löschen *)
			IF aRecipe[nIdx].Valid THEN
				aRecipe[nIdx].Valid := FALSE;
				aRecipe[nIdx].Name := '';
				nResult := 0;
			ELSE
				nResult := 2;
			END_IF;
		ELSE
			nResult := 1;
		END_IF;
		gHmi.Cmd.Request := 0;
	END_IF;

	(* Status *)
	nCount := 0;
	FOR i := 0 TO 9 DO
		IF aRecipe[i].Valid THEN
			nCount := nCount + 1;
		END_IF;
	END_FOR;
	gHmi.Status.Result := nResult;
	gHmi.Status.Count := nCount;
	gHmi.Status.ActiveName := stActive.Name;
	gHmi.Status.Dirty := (gHmi.Edit.Name <> stActive.Name) OR (gHmi.Edit.Speed <> stActive.Speed)
		OR (gHmi.Edit.Temp <> stActive.Temp) OR (gHmi.Edit.HoldTime <> stActive.HoldTime);

	(* Aktives Rezept an die Maschine *)
	aoSpeed := stActive.Speed;
	aoTemp := stActive.Temp;
END_PROGRAM
`;

function rcp(action, index) { return [{ set: { 'gHmi.Cmd.Index': index, 'gHmi.Cmd.Request': action } }, { cycles: 2 }]; }

const EX_RECIPE = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Rezeptverwaltung im Array von Strukturen',
  task: `In AS6 übernimmt **mapp Recipe** (MpRecipeXml/MpRecipeRegPar) das Speichern von Rezepten als Datei. Die Logik davor – Editierpuffer, Plausibilität, Laden nur im Stillstand – bleibt Aufgabe der Applikation. Hier verwaltest du 10 Rezepte in \`aRecipe : ARRAY[0..9] OF Recipe_typ\` (lokal). Die HMI bindet ihre Eingabefelder an den Editierpuffer \`gHmi.Edit\`.

**Anforderungen**
1. In \`_INIT\` liegt auf Platz 0 das Rezept „Standard“ (Speed 50, Temp 80, HoldTime 60, Valid). Es ist aktiv und steht im Editierpuffer.
2. \`Cmd.Request\` (1 Laden, 2 Speichern, 3 Löschen) mit \`Cmd.Index\` wird ausgewertet und auf 0 zurückgesetzt. Ergebnis in \`Status.Result\`.
3. **Index** außerhalb 0…9 oder unbekannte Aktion → 1.
4. **Laden:** nur wenn \`diRunning\` FALSE (sonst 4) und der Platz belegt ist (sonst 2). Kopiert das Rezept in das aktive Rezept und in den Editierpuffer.
5. **Speichern:** Plausibilität des Editierpuffers: Name nicht leer, Speed 0…100, Temp 20…200, HoldTime 1…3600 (sonst 3). Ein **anderer** belegter Platz mit gleichem Namen → 5. Bei Erfolg: Platz belegt, gespeichertes Rezept wird aktiv.
6. **Löschen:** belegter Platz wird frei (Valid FALSE, Name leer), sonst 2.
7. **Status:** \`Count\` = belegte Plätze, \`ActiveName\`, \`Dirty\` = Editierpuffer weicht in Name, Speed, Temp oder HoldTime vom aktiven Rezept ab.
8. Ausgänge: \`aoSpeed\`/\`aoTemp\` aus dem **aktiven** Rezept – nie direkt aus dem Editierpuffer.`,
  hints: [
    'Strukturen kannst du komplett zuweisen: stActive := aRecipe[nIdx];',
    'Prüfe den Index, bevor du auf aRecipe[nIdx] zugreifst – ein Zugriff außerhalb der Grenzen ist auf dem Target ein Laufzeitfehler.',
    'Die Namensprüfung auf Duplikate ist eine FOR-Schleife über alle Plätze außer dem Zielplatz.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'RcpHmi_typ', dir: 'in', writable: true, label: 'HMI-Schnittstelle Rezepte' },
    { name: 'diRunning', type: 'BOOL', dir: 'in', label: 'Maschine läuft', widget: 'switch' },
    { name: 'aoSpeed', type: 'REAL', dir: 'out', label: 'Sollgeschwindigkeit', widget: 'value', unit: '%' },
    { name: 'aoTemp', type: 'REAL', dir: 'out', label: 'Solltemperatur', widget: 'value', unit: '°C' }
  ],
  files: {
    main: `PROGRAM _INIT
	aRecipe[0].Name := 'Standard';
	aRecipe[0].Speed := 50.0;
	aRecipe[0].Temp := 80.0;
	aRecipe[0].HoldTime := 60;
	aRecipe[0].Valid := TRUE;
	gHmi.Edit := aRecipe[0];
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Laden, Speichern, Löschen mit Prüfungen; Status *)
	IF gHmi.Cmd.Request = 2 THEN
		aRecipe[gHmi.Cmd.Index] := gHmi.Edit;
		gHmi.Cmd.Request := 0;
	END_IF;
	aoSpeed := gHmi.Edit.Speed;
	aoTemp := gHmi.Edit.Temp;
END_PROGRAM
`,
    var: `VAR
	aRecipe : ARRAY[0..9] OF Recipe_typ;
END_VAR
`,
    typ: TYP_RECIPE
  },
  solution: {
    main: MAIN_RECIPE_SOL,
    var: `VAR
	aRecipe : ARRAY[0..9] OF Recipe_typ;
	stActive : Recipe_typ;
	nIdx : INT;
	nResult : INT;
	nCount : INT;
	i : INT;
	bPlausible : BOOL;
	bDuplicate : BOOL;
END_VAR
`,
    typ: TYP_RECIPE
  },
  tests: [
    { name: 'Startzustand und Speichern eines neuen Rezepts', steps: [
      { cycles: 2 },
      { expect: 'gHmi.Status.Count = 1 AND gHmi.Status.ActiveName = \'Standard\' AND NOT gHmi.Status.Dirty', msg: 'Start: ein Rezept „Standard“, aktiv, nicht geändert.' },
      { set: { 'gHmi.Edit.Name': 'Dick', 'gHmi.Edit.Speed': 30.0, 'gHmi.Edit.Temp': 120.0 } }, { cycles: 2 },
      { expect: 'gHmi.Status.Dirty', msg: 'Geänderter Editierpuffer muss Dirty melden.' },
      { expect: 'aoSpeed = 50.0', msg: 'Der Editierpuffer darf nicht direkt auf die Maschine wirken.' },
      ...rcp(2, 3),
      { expect: 'gHmi.Status.Result = 0 AND gHmi.Status.Count = 2 AND gHmi.Cmd.Request = 0', msg: 'Speichern auf Platz 3 muss gelingen.' },
      { expect: 'gHmi.Status.ActiveName = \'Dick\' AND aoSpeed = 30.0 AND NOT gHmi.Status.Dirty', msg: 'Das gespeicherte Rezept wird aktiv.' }
    ]},
    { name: 'Plausibilitätsprüfung beim Speichern', steps: [
      { set: { 'gHmi.Edit.Name': 'Heiss', 'gHmi.Edit.Temp': 250.0 } }, ...rcp(2, 1),
      { expect: 'gHmi.Status.Result = 3 AND gHmi.Status.Count = 1', msg: 'Temp 250 °C ist unplausibel und darf nicht gespeichert werden.' },
      { set: { 'gHmi.Edit.Temp': 150.0, 'gHmi.Edit.HoldTime': 0 } }, ...rcp(2, 1),
      { expect: 'gHmi.Status.Result = 3', msg: 'HoldTime 0 s ist unplausibel.' },
      { set: { 'gHmi.Edit.HoldTime': 30, 'gHmi.Edit.Name': '' } }, ...rcp(2, 1),
      { expect: 'gHmi.Status.Result = 3', msg: 'Ein leerer Name ist unplausibel.' }
    ]},
    { name: 'Doppelter Name und ungültiger Index', steps: [
      { set: { 'gHmi.Edit.Speed': 70.0 } }, ...rcp(2, 4),
      { expect: 'gHmi.Status.Result = 5 AND gHmi.Status.Count = 1', msg: '„Standard“ existiert schon auf Platz 0 – Speichern auf Platz 4 muss mit 5 abgelehnt werden.' },
      ...rcp(2, 0),
      { expect: 'gHmi.Status.Result = 0 AND aoSpeed = 70.0', msg: 'Überschreiben desselben Platzes mit gleichem Namen ist erlaubt.' },
      ...rcp(1, 10),
      { expect: 'gHmi.Status.Result = 1', msg: 'Index 10 ist ungültig.' },
      ...rcp(1, -1),
      { expect: 'gHmi.Status.Result = 1' }
    ]},
    { name: 'Laden nur im Stillstand und nur belegte Plätze', steps: [
      { set: { 'gHmi.Edit.Name': 'Fein', 'gHmi.Edit.Speed': 20.0 } }, ...rcp(2, 2),
      ...rcp(1, 0),
      { expect: 'gHmi.Status.Result = 0 AND aoSpeed = 50.0 AND gHmi.Edit.Name = \'Standard\'', msg: 'Laden von Platz 0 setzt aktives Rezept und Editierpuffer.' },
      { set: { diRunning: true } }, ...rcp(1, 2),
      { expect: 'gHmi.Status.Result = 4 AND aoSpeed = 50.0', msg: 'Im Betrieb darf kein Rezept geladen werden.' },
      { set: { diRunning: false } }, ...rcp(1, 7),
      { expect: 'gHmi.Status.Result = 2', msg: 'Leerer Platz: Ergebnis 2.' }
    ]},
    { name: 'Löschen', steps: [
      { set: { 'gHmi.Edit.Name': 'Weg' } }, ...rcp(2, 5),
      { expect: 'gHmi.Status.Count = 2' },
      ...rcp(3, 5),
      { expect: 'gHmi.Status.Result = 0 AND gHmi.Status.Count = 1', msg: 'Löschen gibt den Platz frei.' },
      ...rcp(3, 5),
      { expect: 'gHmi.Status.Result = 2', msg: 'Löschen eines leeren Platzes: Ergebnis 2.' },
      ...rcp(1, 5),
      { expect: 'gHmi.Status.Result = 2', msg: 'Ein gelöschtes Rezept kann nicht geladen werden.' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const MAIN_TREND_SOL = `PROGRAM _INIT
	nWrite := 0;
	nCount := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* 1. Löschen *)
	IF gTrend.Clear THEN
		nWrite := 0;
		nCount := 0;
		gTrend.Clear := FALSE;
	END_IF;

	(* 2. Abtastung alle 100 ms in den Ringpuffer *)
	tonSample(IN := NOT tonSample.Q, PT := T#100ms);
	IF tonSample.Q THEN
		aBuf[nWrite] := aiTemp;
		nWrite := (nWrite + 1) MOD 50;
		IF nCount < 50 THEN
			nCount := nCount + 1;
		END_IF;
	END_IF;

	(* 3. Chronologische Kopie für das Chart-Widget und Statistik *)
	nStart := (nWrite - nCount + 50) MOD 50;
	rSum := 0.0;
	FOR i := 0 TO 49 DO
		IF i < nCount THEN
			rVal := aBuf[(nStart + i) MOD 50];
			gTrend.Chart[i] := rVal;
			rSum := rSum + rVal;
			IF i = 0 THEN
				rMin := rVal;
				rMax := rVal;
			ELSE
				rMin := MIN(rMin, rVal);
				rMax := MAX(rMax, rVal);
			END_IF;
		ELSE
			gTrend.Chart[i] := 0.0;
		END_IF;
	END_FOR;

	gTrend.Count := nCount;
	IF nCount > 0 THEN
		gTrend.Min := rMin;
		gTrend.Max := rMax;
		gTrend.Avg := rSum / INT_TO_REAL(nCount);
	ELSE
		gTrend.Min := 0.0;
		gTrend.Max := 0.0;
		gTrend.Avg := 0.0;
	END_IF;
END_PROGRAM
`;

const TYP_TREND = `TYPE
	Trend_typ : STRUCT
		Clear : BOOL; (* HMI: Puffer löschen *)
		Count : INT; (* gültige Werte 0..50 *)
		Min : REAL;
		Max : REAL;
		Avg : REAL;
		Chart : ARRAY[0..49] OF REAL; (* Index 0 = ältester Wert *)
	END_STRUCT;
END_TYPE
`;

const EX_TREND = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Ringpuffer für einen Kurzzeittrend mit Statistik',
  task: `Für Langzeitaufzeichnung nutzt du in AS6 **mapp Data** (MpDataRecorder) und das **OnlineChart**- bzw. **OnlineChartHDA**-Widget. Für einen kompakten Kurzzeittrend direkt im Übersichtsbild (z. B. ein Sparkline-artiges Chart) reicht oft ein **Ringpuffer** in der SPS, der an ein Array-Binding geht.

**Anforderungen**
1. Tastet \`aiTemp\` alle **100 ms** ab (TON) und schreibt den Wert in einen Ringpuffer mit **50** Plätzen. Ist der Puffer voll, wird der älteste Wert überschrieben.
2. \`gTrend.Count\` = Anzahl gültiger Werte (max. 50).
3. \`gTrend.Chart[0..49]\`: die gültigen Werte **chronologisch**, Index 0 = ältester Wert; ungenutzte Plätze = 0.
4. \`gTrend.Min\`, \`gTrend.Max\`, \`gTrend.Avg\` über alle gültigen Werte; bei leerem Puffer 0.
5. \`gTrend.Clear\` leert den Puffer und wird zurückgesetzt.`,
  hints: [
    'Schreibzeiger: nWrite := (nWrite + 1) MOD 50. Der älteste Wert liegt bei (nWrite - nCount + 50) MOD 50.',
    'Für den Mittelwert: rSum / INT_TO_REAL(nCount) – AS6 wandelt INT nicht automatisch in REAL um, wenn du es explizit haben willst.',
    'Ein Array-Binding auf 50 Werte ist eine einzige OPC UA-Variable – deutlich günstiger als 50 Einzel-Bindings.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gTrend', type: 'Trend_typ', dir: 'in', writable: true, label: 'Trend-Schnittstelle (Array-Binding)' },
    { name: 'aiTemp', type: 'REAL', dir: 'in', label: 'Temperatur', widget: 'slider', min: 0, max: 100, unit: '°C' }
  ],
  files: {
    main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Abtastung, Ringpuffer, Chart-Kopie, Statistik, Clear *)
	gTrend.Max := MAX(gTrend.Max, aiTemp);
END_PROGRAM
`,
    var: `VAR
	aBuf : ARRAY[0..49] OF REAL;
	nWrite : INT;
	nCount : INT;
END_VAR
`,
    typ: TYP_TREND
  },
  solution: {
    main: MAIN_TREND_SOL,
    var: `VAR
	aBuf : ARRAY[0..49] OF REAL;
	nWrite : INT;
	nCount : INT;
	nStart : INT;
	i : INT;
	rVal : REAL;
	rSum : REAL;
	rMin : REAL;
	rMax : REAL;
	tonSample : TON;
END_VAR
`,
    typ: TYP_TREND
  },
  tests: [
    { name: 'Abtastrate und konstanter Wert', steps: [
      { set: { aiTemp: 20.0 } }, { ms: 1000 },
      { expect: 'gTrend.Count >= 8 AND gTrend.Count <= 11', msg: 'Nach 1 s müssen ca. 10 Werte (Abtastung 100 ms) im Puffer sein.' },
      { expect: 'ABS(gTrend.Avg - 20.0) < 0.01 AND gTrend.Min = 20.0 AND gTrend.Max = 20.0' }
    ]},
    { name: 'Puffer ist auf 50 Werte begrenzt und chronologisch', steps: [
      { set: { aiTemp: 10.0 } }, { ms: 2000 },
      { set: { aiTemp: 30.0 } }, { ms: 6500 },
      { expect: 'gTrend.Count = 50', msg: 'Der Puffer darf höchstens 50 Werte enthalten.' },
      { expect: 'gTrend.Chart[49] = 30.0', msg: 'Der neueste Wert gehört an Index 49.' },
      { set: { aiTemp: 50.0 } }, { ms: 300 },
      { expect: 'gTrend.Chart[49] = 50.0 AND gTrend.Chart[0] = 30.0', msg: 'Nach dem Überlauf muss Index 0 der älteste noch vorhandene Wert sein.' },
      { expect: 'gTrend.Min = 30.0 AND gTrend.Max = 50.0', msg: 'Die überschriebenen 10-°C-Werte dürfen nicht mehr in Min eingehen.' }
    ]},
    { name: 'Gemischte Werte: Min, Max, Mittelwert', steps: [
      { set: { aiTemp: 10.0 } }, { until: 'gTrend.Count = 5', maxMs: 1000 },
      { set: { aiTemp: 30.0 } }, { until: 'gTrend.Count = 10', maxMs: 1000 },
      { expect: 'gTrend.Min = 10.0 AND gTrend.Max = 30.0 AND ABS(gTrend.Avg - 20.0) < 0.01', msg: '5 × 10 °C und 5 × 30 °C ergeben Mittelwert 20 °C.' },
      { expect: 'gTrend.Chart[0] = 10.0 AND gTrend.Chart[9] = 30.0 AND gTrend.Chart[10] = 0.0', msg: 'Chart chronologisch, ungenutzte Plätze 0.' }
    ]},
    { name: 'Löschen', steps: [
      { set: { aiTemp: 40.0 } }, { ms: 800 },
      { set: { 'gTrend.Clear': true } }, { cycles: 1 },
      { expect: 'gTrend.Count = 0 AND gTrend.Avg = 0.0 AND NOT gTrend.Clear', msg: 'Clear muss den Puffer leeren und zurückgesetzt werden.' },
      { until: 'gTrend.Count = 1', maxMs: 300, msg: 'Nach dem Löschen läuft die Aufzeichnung weiter.' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const TYP_AUDIT = `TYPE
	AuditEntry_typ : STRUCT
		Seq : UDINT; (* laufende Nummer, 0 = leer *)
		ParId : INT; (* 1 = TempSet, 2 = SpeedSet *)
		OldValue : REAL;
		NewValue : REAL; (* übernommener bzw. abgelehnter Wert *)
		Level : INT; (* Benutzerlevel *)
		Denied : BOOL; (* TRUE = Änderung abgelehnt *)
	END_STRUCT;
	AuditLog_typ : STRUCT
		Entry : ARRAY[0..7] OF AuditEntry_typ;
		Count : UDINT; (* Gesamtzahl Ereignisse *)
		Newest : INT; (* Index des neuesten Eintrags, -1 = leer *)
	END_STRUCT;
	AuditPar_typ : STRUCT
		TempSet : REAL; (* °C 0..200 *)
		SpeedSet : REAL; (* % 0..100 *)
	END_STRUCT;
END_TYPE
`;

const MAIN_AUDIT_SOL_FB = `FUNCTION_BLOCK FB_AuditLog
	VAR_INPUT
		Execute : BOOL;
		ParId : INT;
		OldValue : REAL;
		NewValue : REAL;
		Level : INT;
		Denied : BOOL;
	END_VAR
	VAR_IN_OUT
		Audit : AuditLog_typ;
	END_VAR
	VAR
		nIdx : INT;
	END_VAR
	IF Execute THEN
		nIdx := (Audit.Newest + 1) MOD 8;
		Audit.Count := Audit.Count + 1;
		Audit.Entry[nIdx].Seq := Audit.Count;
		Audit.Entry[nIdx].ParId := ParId;
		Audit.Entry[nIdx].OldValue := OldValue;
		Audit.Entry[nIdx].NewValue := NewValue;
		Audit.Entry[nIdx].Level := Level;
		Audit.Entry[nIdx].Denied := Denied;
		Audit.Newest := nIdx;
	END_IF;
END_FUNCTION_BLOCK

PROGRAM _INIT
	gPar.TempSet := 60.0;
	gPar.SpeedSet := 50.0;
	rTempAcc := 60.0;
	rSpeedAcc := 50.0;
	gAudit.Newest := -1;
END_PROGRAM

PROGRAM _CYCLIC
	(* TempSet: jede Änderung wird protokolliert, auch eine abgelehnte *)
	IF gPar.TempSet <> rTempAcc THEN
		IF nUserLevel >= 2 THEN
			rNew := LIMIT(0.0, gPar.TempSet, 200.0);
			fbLog(Execute := TRUE, ParId := 1, OldValue := rTempAcc, NewValue := rNew, Level := nUserLevel, Denied := FALSE, Audit := gAudit);
			rTempAcc := rNew;
		ELSE
			fbLog(Execute := TRUE, ParId := 1, OldValue := rTempAcc, NewValue := gPar.TempSet, Level := nUserLevel, Denied := TRUE, Audit := gAudit);
		END_IF;
		gPar.TempSet := rTempAcc;
	END_IF;

	(* SpeedSet *)
	IF gPar.SpeedSet <> rSpeedAcc THEN
		IF nUserLevel >= 2 THEN
			rNew := LIMIT(0.0, gPar.SpeedSet, 100.0);
			fbLog(Execute := TRUE, ParId := 2, OldValue := rSpeedAcc, NewValue := rNew, Level := nUserLevel, Denied := FALSE, Audit := gAudit);
			rSpeedAcc := rNew;
		ELSE
			fbLog(Execute := TRUE, ParId := 2, OldValue := rSpeedAcc, NewValue := gPar.SpeedSet, Level := nUserLevel, Denied := TRUE, Audit := gAudit);
		END_IF;
		gPar.SpeedSet := rSpeedAcc;
	END_IF;

	aoTemp := rTempAcc;
	aoSpeed := rSpeedAcc;
END_PROGRAM
`;

const EX_AUDIT = {
  id: 'ex2', type: 'st', variant: 'schreiben',
  title: 'Audit Trail für Parameteränderungen',
  task: `In regulierten Branchen (z. B. Pharma, FDA 21 CFR Part 11) muss jede Parameteränderung nachvollziehbar sein: wer, was, alter Wert, neuer Wert. In AS6 übernimmt das **mapp Audit** (MpAuditTrail) samt **AuditList**-Widget. Hier baust du das Prinzip selbst: einen Ringpuffer \`gAudit\` mit 8 Einträgen.

Schreibe dafür einen **FUNCTION_BLOCK FB_AuditLog** (in AS6: Deklaration in der .fun-Datei) mit \`VAR_IN_OUT Log : AuditLog_typ\`, der bei \`Execute = TRUE\` einen Eintrag anhängt.

**Anforderungen**
1. Startwerte: \`gPar.TempSet\` 60 °C, \`gPar.SpeedSet\` 50 %. \`gAudit.Newest\` = -1 (leer).
2. Ändert die HMI einen Parameter, wird **jede** Änderung protokolliert: \`ParId\` (1 Temp, 2 Speed), \`OldValue\`, \`NewValue\`, \`Level\` (= \`nUserLevel\`), \`Denied\`.
3. **Ab Level 2** wird der Wert übernommen (begrenzt: Temp 0…200, Speed 0…100) und der **begrenzte** Wert als NewValue protokolliert. **Unter Level 2** wird abgelehnt: \`Denied\` TRUE, NewValue = versuchter Wert, Parameter wird auf den alten Wert zurückgeschrieben.
4. \`gAudit.Count\` zählt alle Einträge; \`Seq\` des Eintrags = Count nach dem Hinzufügen. Neuer Eintrag an Index \`(Newest + 1) MOD 8\`; \`Newest\` zeigt darauf. Ältere Einträge werden überschrieben.
5. Ändern sich beide Parameter im selben Zyklus, entstehen zwei Einträge.
6. \`aoTemp\`/\`aoSpeed\` = übernommene Werte.`,
  hints: [
    'Merke dir pro Parameter den zuletzt übernommenen Wert. Abweichung = Schreibzugriff der HMI.',
    'VAR_IN_OUT übergibt die Struktur als Referenz – der FB schreibt direkt in gAudit.',
    'Ein FB ohne Flankenauswertung (Execute als Pegel) darf nur in dem Zyklus aufgerufen werden, in dem wirklich protokolliert werden soll.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gPar', type: 'AuditPar_typ', dir: 'in', writable: true, label: 'Parameter (HMI, Read / Write)' },
    { name: 'gAudit', type: 'AuditLog_typ', dir: 'out', label: 'Audit-Protokoll (HMI, Read only)' },
    { name: 'nUserLevel', type: 'INT', dir: 'in', label: 'Benutzerlevel aus MpUserX', widget: 'slider', min: 0, max: 4 },
    { name: 'aoTemp', type: 'REAL', dir: 'out', label: 'Solltemperatur', widget: 'value', unit: '°C' },
    { name: 'aoSpeed', type: 'REAL', dir: 'out', label: 'Sollgeschwindigkeit', widget: 'value', unit: '%' }
  ],
  files: {
    main: `(* TODO: FUNCTION_BLOCK FB_AuditLog *)

PROGRAM _INIT
	gPar.TempSet := 60.0;
	gPar.SpeedSet := 50.0;
	gAudit.Newest := -1;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Änderungen erkennen, prüfen, protokollieren *)
	aoTemp := gPar.TempSet;
	aoSpeed := gPar.SpeedSet;
END_PROGRAM
`,
    var: `VAR
	rTempAcc : REAL;
	rSpeedAcc : REAL;
END_VAR
`,
    typ: TYP_AUDIT
  },
  solution: {
    main: MAIN_AUDIT_SOL_FB,
    var: `VAR
	rTempAcc : REAL;
	rSpeedAcc : REAL;
	rNew : REAL;
	fbLog : FB_AuditLog;
END_VAR
`,
    typ: TYP_AUDIT
  },
  tests: [
    { name: 'Übernommene Änderung wird protokolliert', steps: [
      { set: { nUserLevel: 2 } }, { cycles: 2 },
      { expect: 'gAudit.Count = 0 AND gAudit.Newest = -1', msg: 'Ohne Änderung kein Eintrag.' },
      { set: { 'gPar.TempSet': 80.0 } }, { cycles: 2 },
      { expect: 'gAudit.Count = 1 AND gAudit.Newest = 0', msg: 'Eine Änderung = ein Eintrag an Index 0.' },
      { expect: 'gAudit.Entry[0].ParId = 1 AND gAudit.Entry[0].OldValue = 60.0 AND gAudit.Entry[0].NewValue = 80.0', msg: 'ParId 1, alt 60, neu 80 erwartet.' },
      { expect: 'gAudit.Entry[0].Level = 2 AND NOT gAudit.Entry[0].Denied AND gAudit.Entry[0].Seq = 1 AND aoTemp = 80.0' }
    ]},
    { name: 'Abgelehnte Änderung wird protokolliert und zurückgeschrieben', steps: [
      { set: { nUserLevel: 1, 'gPar.SpeedSet': 90.0 } }, { cycles: 2 },
      { expect: 'gPar.SpeedSet = 50.0 AND aoSpeed = 50.0', msg: 'Level 1 darf nicht ändern – Rückschreiben auf 50.' },
      { expect: 'gAudit.Count = 1 AND gAudit.Entry[0].Denied AND gAudit.Entry[0].NewValue = 90.0 AND gAudit.Entry[0].ParId = 2', msg: 'Auch der abgelehnte Versuch muss mit dem versuchten Wert protokolliert werden.' },
      { cycles: 5 },
      { expect: 'gAudit.Count = 1', msg: 'Nach dem Rückschreiben darf kein weiterer Eintrag entstehen.' }
    ]},
    { name: 'Begrenzung und zwei Änderungen im selben Zyklus', steps: [
      { set: { nUserLevel: 3, 'gPar.TempSet': 500.0, 'gPar.SpeedSet': 75.0 } }, { cycles: 2 },
      { expect: 'gAudit.Count = 2', msg: 'Zwei geänderte Parameter ergeben zwei Einträge.' },
      { expect: 'gAudit.Entry[0].NewValue = 200.0 AND gPar.TempSet = 200.0', msg: 'Der begrenzte Wert (200) wird übernommen und protokolliert.' },
      { expect: 'gAudit.Entry[1].ParId = 2 AND gAudit.Entry[1].Seq = 2 AND gAudit.Newest = 1' }
    ]},
    { name: 'Ringpuffer überschreibt die ältesten Einträge', steps: [
      { set: { nUserLevel: 2 } },
      { set: { 'gPar.TempSet': 61.0 } }, { cycles: 2 }, { set: { 'gPar.TempSet': 62.0 } }, { cycles: 2 },
      { set: { 'gPar.TempSet': 63.0 } }, { cycles: 2 }, { set: { 'gPar.TempSet': 64.0 } }, { cycles: 2 },
      { set: { 'gPar.TempSet': 65.0 } }, { cycles: 2 }, { set: { 'gPar.TempSet': 66.0 } }, { cycles: 2 },
      { set: { 'gPar.TempSet': 67.0 } }, { cycles: 2 }, { set: { 'gPar.TempSet': 68.0 } }, { cycles: 2 },
      { set: { 'gPar.TempSet': 69.0 } }, { cycles: 2 }, { set: { 'gPar.TempSet': 70.0 } }, { cycles: 2 },
      { expect: 'gAudit.Count = 10 AND gAudit.Newest = 1', msg: '10 Einträge: Newest muss bei (10 - 1) MOD 8 = 1 stehen.' },
      { expect: 'gAudit.Entry[1].Seq = 10 AND gAudit.Entry[1].NewValue = 70.0 AND gAudit.Entry[1].OldValue = 69.0', msg: 'Eintrag 10 an Index 1.' },
      { expect: 'gAudit.Entry[2].Seq = 3', msg: 'Index 2 enthält den ältesten noch vorhandenen Eintrag (Seq 3).' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const TYP_HP = `TYPE
	AnalogPar_typ : STRUCT
		RangeMin : REAL; (* Messbereich *)
		RangeMax : REAL;
		LoLo : REAL; (* Alarmgrenzen *)
		Lo : REAL;
		Hi : REAL;
		HiHi : REAL;
		Hyst : REAL; (* Hysterese für das Zurückfallen *)
	END_STRUCT;
	AnalogStatus_typ : STRUCT
		State : INT; (* 0 normal, 1 Lo, 2 Hi, 3 LoLo, 4 HiHi, 9 ungültig *)
		StyleIdx : INT; (* 0 neutral, 2 Warnung, 3 Alarm, 4 ungültig *)
		Percent : REAL; (* Position im Messbereich 0..100 *)
		Trend : INT; (* -1 fallend, 0 stabil, 1 steigend *)
	END_STRUCT;
	HpHmi_typ : STRUCT
		Par : ARRAY[0..3] OF AnalogPar_typ;
		Point : ARRAY[0..3] OF AnalogStatus_typ;
		WorstStyle : INT; (* höchster StyleIdx aller Messstellen, für Übersicht/Kopfzeile *)
	END_STRUCT;
END_TYPE
`;

const FB_HP_SOL = `FUNCTION_BLOCK FB_AnalogInd
	VAR_INPUT
		Value : REAL;
		Par : AnalogPar_typ;
	END_VAR
	VAR_OUTPUT
		State : INT;
		StyleIdx : INT;
		Percent : REAL;
		Trend : INT;
	END_VAR
	VAR
		bValid : BOOL;
		tonTrend : TON;
		rLastSample : REAL;
		bHasSample : BOOL;
		rDead : REAL;
	END_VAR

	(* Plausibilität von Parametern und Messwert *)
	bValid := (Par.RangeMax > Par.RangeMin)
		AND (Par.LoLo <= Par.Lo) AND (Par.Lo < Par.Hi) AND (Par.Hi <= Par.HiHi)
		AND (Value >= Par.RangeMin) AND (Value <= Par.RangeMax);

	IF NOT bValid THEN
		State := 9;
	ELSIF Value >= Par.HiHi THEN
		State := 4;
	ELSIF Value <= Par.LoLo THEN
		State := 3;
	ELSE
		(* Hysterese: aus einem Grenzzustand erst zurück, wenn Grenze - Hyst unterschritten *)
		CASE State OF
			2, 4:
				IF Value < Par.Hi - Par.Hyst THEN
					State := 0;
				ELSE
					State := 2;
				END_IF;
			1, 3:
				IF Value > Par.Lo + Par.Hyst THEN
					State := 0;
				ELSE
					State := 1;
				END_IF;
		ELSE
			IF Value >= Par.Hi THEN
				State := 2;
			ELSIF Value <= Par.Lo THEN
				State := 1;
			ELSE
				State := 0;
			END_IF;
		END_CASE;
	END_IF;

	CASE State OF
		0: StyleIdx := 0;
		1, 2: StyleIdx := 2;
		3, 4: StyleIdx := 3;
	ELSE
		StyleIdx := 4;
	END_CASE;

	IF Par.RangeMax > Par.RangeMin THEN
		Percent := LIMIT(0.0, (Value - Par.RangeMin) / (Par.RangeMax - Par.RangeMin) * 100.0, 100.0);
	ELSE
		Percent := 0.0;
	END_IF;

	(* Trend: Vergleich mit dem Wert vor 1 s, Totband 1 % des Messbereichs *)
	tonTrend(IN := NOT tonTrend.Q, PT := T#1s);
	IF tonTrend.Q THEN
		rDead := (Par.RangeMax - Par.RangeMin) * 0.01;
		IF bHasSample THEN
			IF Value > rLastSample + rDead THEN
				Trend := 1;
			ELSIF Value < rLastSample - rDead THEN
				Trend := -1;
			ELSE
				Trend := 0;
			END_IF;
		END_IF;
		rLastSample := Value;
		bHasSample := TRUE;
	END_IF;
END_FUNCTION_BLOCK
`;

const MAIN_HP_INIT = `PROGRAM _INIT
	(* 0: Temperatur °C *)
	gHmi.Par[0].RangeMin := 0.0; gHmi.Par[0].RangeMax := 200.0;
	gHmi.Par[0].LoLo := 20.0; gHmi.Par[0].Lo := 40.0; gHmi.Par[0].Hi := 150.0; gHmi.Par[0].HiHi := 180.0; gHmi.Par[0].Hyst := 5.0;
	(* 1: Druck bar *)
	gHmi.Par[1].RangeMin := 0.0; gHmi.Par[1].RangeMax := 10.0;
	gHmi.Par[1].LoLo := 1.0; gHmi.Par[1].Lo := 2.0; gHmi.Par[1].Hi := 8.0; gHmi.Par[1].HiHi := 9.0; gHmi.Par[1].Hyst := 0.2;
	(* 2: Durchfluss l/min *)
	gHmi.Par[2].RangeMin := 0.0; gHmi.Par[2].RangeMax := 100.0;
	gHmi.Par[2].LoLo := 5.0; gHmi.Par[2].Lo := 10.0; gHmi.Par[2].Hi := 90.0; gHmi.Par[2].HiHi := 95.0; gHmi.Par[2].Hyst := 2.0;
	(* 3: Füllstand % *)
	gHmi.Par[3].RangeMin := 0.0; gHmi.Par[3].RangeMax := 100.0;
	gHmi.Par[3].LoLo := 5.0; gHmi.Par[3].Lo := 15.0; gHmi.Par[3].Hi := 85.0; gHmi.Par[3].HiHi := 95.0; gHmi.Par[3].Hyst := 2.0;
END_PROGRAM
`;

const MAIN_HP_SOL = FB_HP_SOL + '\n' + MAIN_HP_INIT + `
PROGRAM _CYCLIC
	aValue[0] := aiTemp;
	aValue[1] := aiPress;
	aValue[2] := aiFlow;
	aValue[3] := aiLevel;
	nWorst := 0;
	FOR i := 0 TO 3 DO
		aInd[i](Value := aValue[i], Par := gHmi.Par[i]);
		gHmi.Point[i].State := aInd[i].State;
		gHmi.Point[i].StyleIdx := aInd[i].StyleIdx;
		gHmi.Point[i].Percent := aInd[i].Percent;
		gHmi.Point[i].Trend := aInd[i].Trend;
		nWorst := MAX(nWorst, aInd[i].StyleIdx);
	END_FOR;
	gHmi.WorstStyle := nWorst;
END_PROGRAM
`;

const MAIN_HP_START = `(* TODO: FUNCTION_BLOCK FB_AnalogInd *)

` + MAIN_HP_INIT + `
PROGRAM _CYCLIC
	(* TODO: je Messstelle eine FB-Instanz, Ergebnisse in gHmi.Point, WorstStyle *)
	gHmi.Point[0].Percent := aiTemp / 2.0;
	IF aiTemp > 150.0 THEN
		gHmi.Point[0].State := 2;
	ELSE
		gHmi.Point[0].State := 0;
	END_IF;
END_PROGRAM
`;

const EX_HP = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Analoganzeige-Logik nach High-Performance-HMI-Prinzipien',
  task: `High-Performance-HMI (ISA-101) zeigt Messwerte nicht nur als Zahl, sondern **im Kontext**: Position im Messbereich, Normalbereich, Grenzen, Trendrichtung. Farbe erscheint **nur bei Abweichung**. Die SPS liefert dafür je Messstelle einen eindeutigen Zustand und einen Style-Index; das mapp View-Widget (z. B. ein Compound Widget „Analog-Indikator“) stellt dar.

Schreibe einen **FUNCTION_BLOCK FB_AnalogInd** (in AS6: Deklaration in der .fun-Datei) mit \`VAR_INPUT Value : REAL; Par : AnalogPar_typ;\` und \`VAR_OUTPUT State, StyleIdx : INT; Percent : REAL; Trend : INT;\`. Verwende vier Instanzen (\`ARRAY[0..3] OF FB_AnalogInd\`) für \`aiTemp\`, \`aiPress\`, \`aiFlow\`, \`aiLevel\`. Die Parameter sind in \`_INIT\` vorgegeben.

**Anforderungen**
1. **Ungültig (State 9):** Messwert außerhalb des Messbereichs (Sensorbruch, Überlauf) **oder** inkonsistente Grenzen (nicht LoLo ≤ Lo < Hi ≤ HiHi, oder RangeMax ≤ RangeMin).
2. **Grenzen:** Value ≥ HiHi → 4, Value ≤ LoLo → 3, Value ≥ Hi → 2, Value ≤ Lo → 1, sonst 0.
3. **Hysterese:** Aus Hi/HiHi geht es erst zurück auf normal, wenn Value < Hi − Hyst (dazwischen bleibt 2). Aus Lo/LoLo erst bei Value > Lo + Hyst (dazwischen bleibt 1).
4. **StyleIdx:** 0 normal (neutral grau), 2 bei Lo/Hi (Warnung), 3 bei LoLo/HiHi (Alarm), 4 bei ungültig.
5. **Percent** = Position im Messbereich in %, begrenzt auf 0…100.
6. **Trend:** Jede Sekunde wird der aktuelle Wert mit dem Wert vor 1 s verglichen; Änderung > 1 % des Messbereichs → +1 bzw. −1, sonst 0.
7. \`gHmi.Point[i]\` erhält die Ergebnisse, \`gHmi.WorstStyle\` den höchsten StyleIdx (für den Sammelindikator in der Kopfzeile).`,
  hints: [
    'Prüfe Ungültigkeit zuerst, dann HiHi/LoLo, dann die Hysterese abhängig vom bisherigen Zustand (CASE State OF 2, 4: … 1, 3: …).',
    'FB-Instanzen im Array rufst du so auf: aInd[i](Value := aValue[i], Par := gHmi.Par[i]);',
    'Ein Grenzwert ohne Hysterese erzeugt bei verrauschten Messwerten flatternde Anzeigen und Alarmfluten.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'HpHmi_typ', dir: 'in', writable: true, label: 'HMI-Schnittstelle Übersichtsbild' },
    { name: 'aiTemp', type: 'REAL', dir: 'in', label: 'Temperatur', widget: 'slider', min: -10, max: 220, unit: '°C', init: 100 },
    { name: 'aiPress', type: 'REAL', dir: 'in', label: 'Druck', widget: 'slider', min: 0, max: 12, unit: 'bar', init: 5 },
    { name: 'aiFlow', type: 'REAL', dir: 'in', label: 'Durchfluss', widget: 'slider', min: 0, max: 100, unit: 'l/min', init: 50 },
    { name: 'aiLevel', type: 'REAL', dir: 'in', label: 'Füllstand', widget: 'slider', min: 0, max: 100, unit: '%', init: 50 }
  ],
  files: {
    main: MAIN_HP_START,
    var: `VAR
	i : INT;
END_VAR
`,
    typ: TYP_HP
  },
  solution: {
    main: MAIN_HP_SOL,
    var: `VAR
	aInd : ARRAY[0..3] OF FB_AnalogInd;
	aValue : ARRAY[0..3] OF REAL;
	i : INT;
	nWorst : INT;
END_VAR
`,
    typ: TYP_HP
  },
  tests: [
    { name: 'Normalbereich: neutral, Prozentwert', steps: [
      { cycles: 3 },
      { expect: 'gHmi.Point[0].State = 0 AND gHmi.Point[0].StyleIdx = 0 AND gHmi.WorstStyle = 0', msg: 'Alle Werte im Normalbereich: Zustand 0, neutral.' },
      { expect: 'ABS(gHmi.Point[0].Percent - 50.0) < 0.01 AND ABS(gHmi.Point[1].Percent - 50.0) < 0.01', msg: '100 °C von 0…200 °C = 50 %; 5 bar von 0…10 bar = 50 %.' }
    ]},
    { name: 'Grenzen Hi und HiHi mit Hysterese', steps: [
      { set: { aiTemp: 155.0 } }, { cycles: 2 },
      { expect: 'gHmi.Point[0].State = 2 AND gHmi.Point[0].StyleIdx = 2 AND gHmi.WorstStyle = 2', msg: '155 °C ≥ Hi (150): Warnung.' },
      { set: { aiTemp: 148.0 } }, { cycles: 2 },
      { expect: 'gHmi.Point[0].State = 2', msg: 'Hysterese: 148 °C liegt nicht unter Hi − Hyst (145) – der Zustand bleibt 2.' },
      { set: { aiTemp: 144.0 } }, { cycles: 2 },
      { expect: 'gHmi.Point[0].State = 0', msg: 'Unter 145 °C zurück auf normal.' },
      { set: { aiTemp: 185.0 } }, { cycles: 2 },
      { expect: 'gHmi.Point[0].State = 4 AND gHmi.Point[0].StyleIdx = 3', msg: '185 °C ≥ HiHi (180): Alarm, StyleIdx 3.' },
      { set: { aiTemp: 170.0 } }, { cycles: 2 },
      { expect: 'gHmi.Point[0].State = 2', msg: 'Von HiHi zurück unter HiHi, aber über Hi: Warnung.' }
    ]},
    { name: 'Untere Grenzen mit Hysterese', steps: [
      { set: { aiPress: 1.8 } }, { cycles: 2 },
      { expect: 'gHmi.Point[1].State = 1 AND gHmi.Point[1].StyleIdx = 2', msg: '1,8 bar ≤ Lo (2): Warnung.' },
      { set: { aiPress: 2.1 } }, { cycles: 2 },
      { expect: 'gHmi.Point[1].State = 1', msg: 'Hysterese: 2,1 bar liegt nicht über Lo + Hyst (2,2).' },
      { set: { aiPress: 0.5 } }, { cycles: 2 },
      { expect: 'gHmi.Point[1].State = 3 AND gHmi.WorstStyle = 3', msg: '0,5 bar ≤ LoLo (1): Alarm.' },
      { set: { aiPress: 2.5 } }, { cycles: 2 },
      { expect: 'gHmi.Point[1].State = 0' }
    ]},
    { name: 'Ungültige Messwerte und inkonsistente Grenzen', steps: [
      { set: { aiTemp: -5.0 } }, { cycles: 2 },
      { expect: 'gHmi.Point[0].State = 9 AND gHmi.Point[0].StyleIdx = 4 AND gHmi.WorstStyle = 4', msg: 'Wert unter dem Messbereich (Sensorbruch): ungültig.' },
      { expect: 'gHmi.Point[0].Percent = 0.0', msg: 'Percent muss auf 0…100 begrenzt sein.' },
      { set: { aiTemp: 100.0, 'gHmi.Par[2].Lo': 95.0 } }, { cycles: 2 },
      { expect: 'gHmi.Point[0].State = 0 AND gHmi.Point[2].State = 9', msg: 'Lo (95) > Hi (90): inkonsistente Grenzen müssen als ungültig erkannt werden.' }
    ]},
    { name: 'Trendrichtung', steps: [
      { ms: 1100 },
      { set: { aiLevel: 60.0 } }, { ms: 1100 },
      { expect: 'gHmi.Point[3].Trend = 1', msg: 'Steigender Füllstand (+10 %) muss Trend +1 ergeben.' },
      { ms: 1100 },
      { expect: 'gHmi.Point[3].Trend = 0', msg: 'Konstanter Wert: Trend 0.' },
      { set: { aiLevel: 59.5 } }, { ms: 1100 },
      { expect: 'gHmi.Point[3].Trend = 0', msg: 'Änderung innerhalb des Totbands (1 %) ist kein Trend.' },
      { set: { aiLevel: 40.0 } }, { ms: 1100 },
      { expect: 'gHmi.Point[3].Trend = -1' }
    ]}
  ]
};

module.exports = [
  {
    id: 'hmi-4-rezepte',
    level: 4,
    kind: 'lektion',
    title: 'Rezeptverwaltung mit mapp Recipe',
    summary: 'Du verwaltest Produktrezepte mit MpRecipe, trennst Editierpuffer und aktives Rezept und prüfst Rezeptdaten auf Plausibilität.',
    minutes: 210,
    req: ['hmi-3-benutzer-sprache'],
    briefing: 'Rezepte bündeln die Parameter eines Produkts: Geschwindigkeit, Temperaturen, Zeiten. mapp Recipe (MpRecipeXml, MpRecipeRegPar) speichert registrierte Prozessvariablen als Datei, lädt sie wieder und bietet Widgets zur Anzeige. Die eigentliche Ingenieursarbeit ist das Konzept davor: Welche Parameter gehören ins Rezept, welche sind Maschinenparameter? Wer darf speichern? Wann darf geladen werden? Wie verhinderst du, dass ein halb editiertes Rezept auf die laufende Maschine wirkt? Du baust eine Rezeptverwaltung mit Editierpuffer, Plausibilitätsprüfung und Statusrückmeldung.',
    practice: 'Beim Produktwechsel lädt der Schichtführer ein Rezept. Ein Tippfehler bei der Temperatur (800 statt 80 °C) oder ein Laden während der Produktion kann Ausschuss oder Schäden verursachen – deshalb prüft die SPS jedes Rezept vor der Übernahme.',
    transfer: {
      tia: 'In TIA Portal entsprechen das den Rezepturen in WinCC (Rezepturansicht, Rezeptur-Datensätze) bzw. Datenbausteinen mit READ_DBL/WRIT_DBL oder Datenlogs auf der Speicherkarte.',
      codesys: 'CODESYS bietet den Rezepturverwalter (Recipe Manager) mit Rezepturdefinitionen; die Visualisierung hat dafür eigene Elemente.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lege das Rezeptkonzept fest',
        guide: {
          intro: 'Bevor du MpRecipe konfigurierst, klärst du, welche Variablen Rezeptparameter (produktabhängig) und welche Maschinenparameter (einmal bei Inbetriebnahme) sind.',
          steps: [
            'Liste alle Parameter deiner Maschine und markiere sie als „Produkt“ (Rezept) oder „Maschine“ (Konfiguration). B&R unterstützt dafür Kategorien in MpRecipe.',
            'Lege je Rezeptparameter Einheit, Grenzen und Standardwert fest.',
            'Definiere die Rechte: Wer darf laden (Bediener), wer speichern/löschen (Einrichter)?',
            'Definiere die Regeln: Laden nur im Stillstand oder an einem definierten Übernahmepunkt.',
            'Fasse alle Rezeptparameter in einer Struktur (`Recipe_typ`) zusammen.'
          ],
          done: 'Erledigt, wenn eine Tabelle Parameter – Kategorie – Einheit – Grenzen – Recht vorliegt und Recipe_typ angelegt ist.',
          tip: 'Eine Struktur je Kategorie lässt sich mit einem einzigen MpRecipeRegPar registrieren – das hält die Konfiguration klein.',
          link: brLink('MpRecipe Konzept', 'services/mapp_services/mprecipe/konzept/konzept.html')
        }
      },
      {
        id: 'o2',
        title: 'Konfiguriere MpRecipeXml und registriere Parameter',
        guide: {
          intro: 'MpRecipeXml speichert und lädt Rezepte als XML-Dateien auf einem Dateigerät; MpRecipeRegPar registriert die Prozessvariablen, die zum Rezept gehören.',
          steps: [
            'Füge in der Configuration View die mapp-Komponente **MpRecipeXml** ein und lege ein Dateigerät (z. B. `USER`) in der CPU-Konfiguration an.',
            'Rufe im Programm **MpRecipeRegPar** für deine Rezeptstruktur auf (PVName als String mit Task-Präfix, z. B. `\'Recipe:stEdit\'`).',
            'Rufe **MpRecipeXml** mit Enable, DeviceName und FileName auf; Save/Load lösen Speichern bzw. Laden aus.',
            'Werte Active, Error und StatusID aus und gib sie an die HMI weiter.',
            'Teste Speichern und Laden und prüfe die erzeugte XML-Datei.'
          ],
          done: 'Erledigt, wenn ein gespeichertes Rezept als Datei auf dem Dateigerät liegt und nach einem Neustart wieder geladen werden kann.',
          tip: 'Registriere den **Editierpuffer**, nicht die aktiven Maschinenparameter. Übernommen wird erst nach erfolgreicher Prüfung.',
          link: brLink('MpRecipeXml', 'services/mapp_services/mprecipe/lib/fb/mprecipexml/mc_x.html')
        }
      },
      {
        id: 'o3',
        title: 'Programmiere Editierpuffer, Plausibilität und Statusrückmeldung',
        guide: {
          intro: 'Die HMI bearbeitet nur den Editierpuffer. Die SPS prüft und übernimmt ihn in das aktive Rezept.',
          steps: [
            'Lege das Array der Rezepte und eine Variable für das aktive Rezept an.',
            'Werte das Kommando aus und prüfe zuerst den Index.',
            'Prüfe beim Speichern alle Grenzen und die Eindeutigkeit des Namens.',
            'Gib das Ergebnis als Nummer aus und berechne `Dirty`.',
            'Löse Übung 1.'
          ],
          done: 'Erledigt, wenn alle Tests von Übung 1 grün sind.',
          tip: 'Zeige `Dirty` in der HMI deutlich an („Änderungen nicht gespeichert“) und frage beim Verlassen der Seite nach.'
        }
      },
      {
        id: 'o4',
        title: 'Visualisiere die Rezeptverwaltung',
        guide: {
          intro: 'Die Rezeptseite zeigt die Rezeptliste, den Editierpuffer und das Ergebnis jeder Aktion.',
          steps: [
            'Platziere eine Liste (z. B. Table- oder ListBox-Widget) der Rezepte und ein Eingabeformular, gebunden an `gHmi.Edit`.',
            'Binde die Buttons Laden/Speichern/Löschen an `gHmi.Cmd.Request` (Write only) mit dem jeweiligen Wert.',
            'Zeige `Status.Result` über das Text System als Klartext an.',
            'Deaktiviere Speichern/Löschen per Rolle (enable) und frage beim Löschen per MessageBox nach.'
          ],
          done: 'Erledigt, wenn ein Rezept über die HMI gespeichert, geladen und gelöscht werden kann und jede Aktion eine verständliche Rückmeldung erzeugt.',
          tip: 'Das mapp Framework enthält ein fertiges Recipe-Modul mit mapp View-Seiten – ein guter Vergleich für dein eigenes Konzept.'
        }
      }
    ],
    videos: [
      { id: 'farf4ah7ieI', title: 'mapp Recipe Framework Tutorial', channel: 'B&R Industrial Automation', lang: 'en', why: 'Zeigt das Recipe-Modul des mapp Frameworks mit mapp View-Oberfläche.' },
      { id: '2hd9mVTA8C8', title: 'mapp Recipe 2 - Visualizing a recipe management in Visual Components 4 [sub: EN, DE, JA, PL, PT, RU]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Erklärt das Zusammenspiel von MpRecipe-Bausteinen und HMI (am Beispiel VC4, Prinzip identisch).' }
    ],
    readings: [
      brHelp('Konzept (mapp Recipe)', 'services/mapp_services/mprecipe/konzept/konzept.html', 15, 'Anforderungen an eine Rezeptverwaltung aus Sicht von Applikation, Endnutzer und Schichtleiter.', 'Automation Help – mapp Services 6'),
      brHelp('MpRecipeRegPar', 'services/mapp_services/mprecipe/lib/fb/mpreciperegpar/mc_x.html', 10, 'Registrieren von Prozessvariablen für ein Rezept.', 'Automation Help – mapp Services 6'),
      { title: 'mapp Framework – Recipe', author: 'B&R Community', institution: 'B&R Industrial Automation (Community-Projekt)', work: 'mapp Framework Dokumentation', year: 'o. J.', type: 'Dokumentation', minutes: 20, url: 'https://br-automation-community.github.io/mapp-Framework/recipe/', why: 'Referenzimplementierung einer Rezeptverwaltung inklusive HMI-Anbindung.', apa: 'B&R Community. (o. J.). *mapp Framework – Recipe*. B&R Industrial Automation. ' + ABGERUFEN + 'https://br-automation-community.github.io/mapp-Framework/recipe/' }
    ],
    quiz: [
      { type: 'single', q: 'Warum bindet die HMI ihre Rezept-Eingabefelder an einen Editierpuffer statt an die aktiven Maschinenparameter?', options: ['Weil OPC UA keine Strukturen kann', 'Damit halb eingegebene oder unplausible Werte nicht auf die laufende Maschine wirken', 'Weil mapp Recipe nur Puffer speichern kann', 'Damit die Seite schneller lädt'], correct: 1, explain: 'Erst die SPS übernimmt geprüfte Werte. So wirkt jeder Tastendruck nicht sofort auf den Prozess.' },
      { type: 'multi', q: 'Welche Prüfungen gehören vor das Speichern eines Rezepts?', options: ['Grenzen jedes Parameters', 'Name vorhanden und eindeutig', 'Index im gültigen Bereich', 'Uhrzeit des Clients'], correct: [0, 1, 2], explain: 'Plausibilität, Eindeutigkeit und gültige Indizes schützen Daten und Laufzeit. Die Client-Uhrzeit spielt keine Rolle.' },
      { type: 'single', q: 'Was passiert auf dem Target, wenn aRecipe[nIdx] mit nIdx = 10 bei ARRAY[0..9] gelesen wird?', options: ['Es wird automatisch Platz 0 gelesen', 'Ein Laufzeitfehler bzw. undefinierter Speicherzugriff – Index vorher prüfen', 'Der Wert ist immer 0', 'Das Array wächst automatisch'], correct: 1, explain: 'Bereichsüberschreitungen sind Laufzeitfehler (bei aktiver Prüfung) oder schlimmer: Überschreiben fremder Daten.' }
    ],
    exam: [
      { type: 'single', q: 'Welche B&R-Komponente speichert registrierte Rezeptvariablen als XML-Datei?', options: ['MpRecipeXml', 'MpAlarmXCore', 'MpUserXLogin', 'MpDataRecorder'], correct: 0, explain: 'MpRecipeXml speichert/lädt; MpRecipeRegPar registriert die Variablen.' },
      { type: 'single', q: 'Ein Rezept soll während der Produktion geladen werden. Was ist die sicherste Lösung?', options: ['Sofort übernehmen', 'Ablehnen oder erst an einem definierten Übernahmepunkt (z. B. Taktende/Stillstand) übernehmen', 'Nur die Temperatur übernehmen', 'Die Maschine sofort abschalten'], correct: 1, explain: 'Parametersprünge mitten im Prozess sind gefährlich. Ein definierter Übernahmepunkt macht das Verhalten vorhersagbar.' },
      { type: 'multi', q: 'Was zeigt der Status „Dirty“ an und wofür nutzt du ihn?', options: ['Editierpuffer weicht vom aktiven Rezept ab', 'Hinweis „Änderungen nicht gespeichert“', 'Nachfrage beim Verlassen der Seite', 'Fehlerhafte Verdrahtung'], correct: [0, 1, 2], explain: 'Dirty schützt vor Datenverlust und vor dem Irrtum, eine Änderung sei schon aktiv.' },
      { type: 'single', q: 'Welche Einordnung ist richtig?', options: ['Rezeptparameter ändern sich je Produkt, Maschinenparameter werden bei der Inbetriebnahme eingestellt.', 'Rezeptparameter und Maschinenparameter sind dasselbe.', 'Maschinenparameter ändern sich je Produkt.', 'Rezeptparameter dürfen nur vom Admin geladen werden.'], correct: 0, explain: 'Die Trennung bestimmt Rechte, Speicherort und Übernahmeregeln.' }
    ],
    exercises: [EX_RECIPE],
    proof: false
  },

  {
    id: 'hmi-4-trends-audit',
    level: 4,
    kind: 'lektion',
    title: 'Trends, Datenaufzeichnung und Audit Trail',
    summary: 'Du zeichnest Prozesswerte mit mapp Data auf, zeigst sie in Chart-Widgets und protokollierst Bedienhandlungen nachvollziehbar mit mapp Audit.',
    minutes: 240,
    req: ['hmi-3-benutzer-sprache'],
    briefing: 'Trends zeigen, wie sich ein Prozess entwickelt – oft wichtiger als der aktuelle Wert. mapp View bietet dafür OnlineChart (Live-Werte), OnlineChartHDA (historische Daten) und weitere Chart-Widgets; mapp Data (MpDataRecorder) zeichnet Werte dauerhaft auf. Der Audit Trail (mapp Audit, AuditList-Widget) beantwortet die Frage „Wer hat wann was geändert?“. Du lernst, wann welche Lösung passt, was Chart-Widgets an Performance kosten, und baust Ringpuffer und Audit-Protokoll selbst in ST.',
    practice: 'Bei Qualitätsreklamationen fragt der Kunde: Wie war die Temperatur bei Charge 4711, und wer hat den Sollwert geändert? Ohne Aufzeichnung und Audit Trail gibt es darauf keine belastbare Antwort.',
    transfer: {
      tia: 'In TIA Portal entsprechen das der Kurvenanzeige (Trend View) mit Datenlogs und dem Audit Trail von WinCC (Option „Audit“ für GMP-Umgebungen).',
      codesys: 'CODESYS bietet das Trend-Element mit Trendaufzeichnung sowie Bibliotheken für Datenlogging; Audit-Funktionen werden meist selbst implementiert.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Zeige einen Live-Trend mit dem OnlineChart-Widget',
        guide: {
          intro: 'Das OnlineChart stellt Live-Werte über die Zeit dar. Es besteht aus Chart, Zeitachse, Werteachse(n) und Graphen.',
          steps: [
            'Lege auf der Trend-Seite ein **OnlineChart** an; ergänze eine **OnlineChartTimeAxis** und eine Werteachse.',
            'Lege einen Graphen an und binde ihn an die OPC UA-Variable der Temperatur.',
            'Stelle Zeitbereich und Aktualisierung passend zum Prozess ein (Sekunden für Druck, Minuten für Temperatur).',
            'Zeichne Grenzwerte als Linien ein, damit der Trend Kontext hat.',
            'Teste mit dem Sägezahn-Signal aus dem B&R-Video und beobachte die CPU-Last des Clients.'
          ],
          done: 'Erledigt, wenn ein Live-Trend mit Zeitachse und Grenzwertlinie im Browser läuft.',
          tip: 'Laut B&R-Performance-Richtlinien sind Chart-Widgets aufwendig. Lieber ein Chart mit drei Graphen als drei Charts auf einer Seite.',
          link: brLink('OnlineChart Konzept', 'visualization/mappview/widgets/chart/onlinechart/widgets/konzept.html')
        }
      },
      {
        id: 'o2',
        title: 'Zeichne Prozessdaten mit mapp Data auf',
        guide: {
          intro: 'MpDataRecorder schreibt registrierte Variablen zyklisch oder ereignisgesteuert in Dateien – die Grundlage für historische Auswertungen.',
          steps: [
            'Füge die mapp-Komponente **MpDataRecorder** ein und lege das Dateigerät fest.',
            'Registriere die aufzuzeichnenden Variablen mit **MpDataRegPar** (ggf. mit Grenzen über MpDataRegParLimits).',
            'Lege Abtastzeit und Dateigröße fest – rechne den Speicherbedarf pro Tag aus.',
            'Starte die Aufzeichnung im Programm und prüfe die erzeugten Dateien.'
          ],
          done: 'Erledigt, wenn die Temperatur über mindestens 10 Minuten in eine Datei aufgezeichnet wurde.',
          tip: 'Abtastzeit nach Prozess wählen: Ein Temperaturprozess mit Minuten-Zeitkonstante braucht keine 10-ms-Werte.',
          link: brLink('mapp Data: Data Logging', 'services/mapp_services/mpdata/mpdata.html')
        }
      },
      {
        id: 'o3',
        title: 'Baue einen Ringpuffer für einen Kurzzeittrend',
        guide: {
          intro: 'Für einen kleinen Trend im Übersichtsbild genügt ein Ringpuffer, der als ein einziges Array-Binding an die HMI geht.',
          steps: [
            'Lege Puffer, Schreibzeiger und Zähler an.',
            'Taste mit einem TON ab und schreibe zyklisch über MOD.',
            'Kopiere die Werte chronologisch in das Ausgabe-Array und berechne Min/Max/Mittelwert.',
            'Löse Übung 1.'
          ],
          done: 'Erledigt, wenn alle Tests von Übung 1 grün sind.',
          tip: 'Rechne die Statistik nur bei neuem Sample, wenn der Puffer groß wird – das spart Zykluszeit.'
        }
      },
      {
        id: 'o4',
        title: 'Protokolliere Bedienhandlungen im Audit Trail',
        guide: {
          intro: 'mapp Audit zeichnet Ereignisse wie Wertänderungen, Benutzeraktionen und OPC UA-Ereignisse auf und zeigt sie im AuditList-Widget. Das Prinzip baust du in Übung 2 selbst nach.',
          steps: [
            'Füge **MpAuditTrail** in der Configuration View ein und konfiguriere die zu protokollierenden Ereignisse.',
            'Platziere ein **AuditList**-Widget und binde es an die Audit-Komponente.',
            'Prüfe: Ist jedem Eintrag ein Benutzer zugeordnet? Sind alte und neue Werte sichtbar?',
            'Löse Übung 2 (eigener Audit-Ringpuffer mit FUNCTION_BLOCK).'
          ],
          done: 'Erledigt, wenn alle Tests von Übung 2 grün sind und du die AuditList mit mindestens einer protokollierten Änderung gesehen hast.',
          tip: 'Protokolliere auch abgelehnte Versuche – gerade sie sind bei einer Untersuchung interessant.',
          link: brLink('mapp Audit Konzept', 'services/mapp_services/mpaudit/konzept/konzept.html')
        }
      }
    ],
    videos: [
      { id: 'Fj2pQLUcovc', title: 'OnlineChart-Widget Part 1 - Display sawtooth signal in graphic form [sub: EN, DE, PL, RU]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Offizielles B&R-Tutorial zum OnlineChart-Widget.' },
      { id: '8sY0b2slcr4', title: 'mapp Data Part 1 - Recording a temperature variable [sub: EN, DE, PL, RU]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Zeigt die Aufzeichnung einer Temperatur mit mapp Data.' },
      { id: 'N3qZ_5VMOVY', title: 'mapp Audit 1 - How to audit machine events [sub: EN, DE, PL, PT-BR, RU]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Einführung in mapp Audit für die Protokollierung von Maschinenereignissen.' }
    ],
    readings: [
      brHelp('Chart Widgets (Performance-Richtlinien)', 'visualization/mappview/guides/performanceguideline/chartwidgets.html', 10, 'Was Chart-Widgets an Client-Leistung kosten und wie man sie sparsam einsetzt.'),
      brHelp('mapp Audit: Konzept', 'services/mapp_services/mpaudit/konzept/konzept.html', 15, 'Anforderungen an einen Audit Trail aus Sicht von OEM, Applikation und Service.', 'Automation Help – mapp Services 6'),
      brHelp('AuditList', 'visualization/mappview/widgets/data/auditlist/widgets/auditlist.html', 10, 'Das Widget zur Anzeige der Audit-Ereignisse in mapp View.')
    ],
    quiz: [
      { type: 'single', q: 'Welches Widget eignet sich für historische, mit mapp Data aufgezeichnete Werte?', options: ['OnlineChartHDA', 'NumericInput', 'Login', 'NavigationButton'], correct: 0, explain: 'HDA steht für Historical Data Access; OnlineChart zeigt Live-Werte.' },
      { type: 'numeric', q: 'Ein Ringpuffer hat {n} Plätze, der Schreibzeiger steht nach dem letzten Schreiben auf {w}, der Puffer ist voll. Auf welchem Index liegt der älteste Wert?', params: { n: [20, 100, 10], w: [0, 19, 1] }, formula: 'w % n', unit: '', tol: 0, explain: 'Bei vollem Puffer zeigt der Schreibzeiger genau auf den ältesten Wert: (w − n + n) MOD n = w.' },
      { type: 'multi', q: 'Was gehört in einen Audit-Eintrag für eine Parameteränderung?', options: ['Benutzer bzw. Rolle', 'Alter und neuer Wert', 'Zeitpunkt bzw. laufende Nummer', 'Die Bildschirmauflösung des Clients'], correct: [0, 1, 2], explain: 'Wer, was, wann, von welchem auf welchen Wert – das macht eine Änderung nachvollziehbar.' }
    ],
    exam: [
      { type: 'single', q: 'Warum ist ein Array-Binding für einen Trend mit 50 Werten günstiger als 50 Einzel-Bindings?', options: ['Weil nur eine OPC UA-Variable überwacht und übertragen wird', 'Weil Arrays automatisch komprimiert werden', 'Weil Einzel-Bindings verboten sind', 'Weil der Browser keine 50 Widgets darstellen kann'], correct: 0, explain: 'Die Anzahl aktiver Bindings ist laut B&R-Performance-Richtlinien ein zentraler Faktor.' },
      { type: 'numeric', q: 'Ein MpDataRecorder zeichnet {v} REAL-Variablen (je 4 Byte) alle {t} s auf. Wie viele Byte Nutzdaten entstehen pro Tag (ohne Zeitstempel und Overhead)?', params: { v: [2, 20, 1], t: [1, 10, 1] }, formula: 'v * 4 * 86400 / t', unit: 'Byte', tol: 0.01, explain: 'Werte pro Tag = 86 400 s / t; je Abtastung v × 4 Byte.' },
      { type: 'single', q: 'Ein Bediener ohne Recht versucht, einen Sollwert zu ändern. Was sollte der Audit Trail enthalten?', options: ['Nichts, da nichts geändert wurde', 'Einen Eintrag „abgelehnt“ mit versuchtem Wert und Benutzer', 'Nur den neuen Wert', 'Einen Alarm'], correct: 1, explain: 'Abgelehnte Versuche sind sicherheits- und qualitätsrelevant.' },
      { type: 'single', q: 'Welcher Parameterübergabe-Typ erlaubt einem FUNCTION_BLOCK, direkt in eine übergebene Struktur zu schreiben?', options: ['VAR_INPUT', 'VAR_IN_OUT', 'VAR_OUTPUT', 'VAR CONSTANT'], correct: 1, explain: 'VAR_IN_OUT übergibt eine Referenz; Änderungen wirken auf das Original.' }
    ],
    exercises: [EX_TREND, EX_AUDIT],
    proof: false
  },

  {
    id: 'hmi-4-projekt-highperformance',
    level: 4,
    kind: 'projekt',
    title: 'Praxisprojekt: High-Performance-Übersichtsbild nach Corporate Design',
    summary: 'Du gestaltest ein Übersichtsbild nach ISA-101-Prinzipien, setzt Themes/Styles nach Corporate Design um, prüfst Ergonomie und Barrierefreiheit und programmierst die Analoganzeige-Logik als wiederverwendbaren FB.',
    minutes: 360,
    req: ['hmi-2-bedienkonzept', 'hmi-4-trends-audit'],
    briefing: 'High-Performance-HMI (ANSI/ISA-101.01) ist ein Gestaltungsansatz für Bedienoberflächen, die Bedienern helfen, Abweichungen früh zu erkennen: Graustufen als Grundton, Farbe nur für abnormale Zustände, Messwerte im Kontext (Analog-Indikatoren mit Normalbereich), eine Bildhierarchie von der Übersicht bis zum Detail. Gleichzeitig muss die Oberfläche zum Corporate Design des Maschinenbauers passen – das erreichst du in mapp View mit Themes und Styles statt mit Einzelformatierung. Ergonomie-Anforderungen (DIN EN ISO 9241 als Orientierung, Kontraste, Touch-Größen) und Barrierefreiheit (z. B. Kontrastregeln aus WCAG) prüfst du systematisch. Die SPS-Seite ist ein wiederverwendbarer Funktionsbaustein für Analoganzeigen.',
    practice: 'In Leitwarten und an komplexen Maschinen hat die Umstellung auf High-Performance-Grafiken nachweislich die Erkennung abnormaler Situationen verbessert. Maschinenbauer verlangen zudem einheitliche Oberflächen über alle Produktlinien – Themes sind dafür das Werkzeug.',
    transfer: {
      tia: 'WinCC Unified bietet Styles und „Faceplates“ für wiederverwendbare Anzeigen; Siemens stellt eigene High-Performance-Bibliotheken bereit.',
      codesys: 'In CODESYS nutzt du Visualisierungsstile und Frames bzw. eigene Visualisierungsbausteine mit Schnittstellenparametern.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf das Übersichtsbild nach High-Performance-Prinzipien',
        guide: {
          intro: 'ISA-101 beschreibt u. a. eine Bildhierarchie (Übersicht, Bereich, Detail, Diagnose) und den sparsamen Einsatz von Farbe. Das Übersichtsbild soll den Zustand der ganzen Maschine in Sekunden erfassbar machen.',
          steps: [
            'Skizziere das Übersichtsbild in Graustufen: Prozessschema stark vereinfacht, keine 3D-Effekte, keine Fotos.',
            'Stelle jede wichtige Messstelle als Analog-Indikator dar: Balken mit Normalbereich, Grenzmarken, Istwert, Trendpfeil.',
            'Lege fest, wann Farbe erscheint: nur bei Lo/Hi (Warnung), LoLo/HiHi (Alarm) und ungültigen Werten.',
            'Prüfe die Hierarchie: Von der Übersicht gelangst du mit einem Klick ins Detail jeder Messstelle.',
            'Vergleiche deinen Entwurf mit den Beispielen aus den RealPars-Videos.'
          ],
          done: 'Erledigt, wenn ein Entwurf in Graustufen vorliegt, auf dem Farbe ausschließlich Abweichungen kennzeichnet.',
          tip: 'Test: Druck das Bild in Graustufen aus. Wenn ein Bediener ohne Farbe noch erkennt, was normal ist, ist das Layout gut.'
        }
      },
      {
        id: 'o2',
        title: 'Setze das Corporate Design mit Themes und Styles um',
        guide: {
          intro: 'Themes bündeln Styles für alle Widgets. Statt jedes Widget einzeln zu formatieren, legst du benannte Styles an (z. B. „StateNormal“, „StateWarning“, „StateAlarm“) und wählst sie per Binding.',
          steps: [
            'Lege über **Themes und Styles** ein eigenes Theme an (Erstellen eines Themes) und hinterlege Firmenschrift und Grundfarben.',
            'Definiere Styles für die Zustände aus dem StyleIdx (0 neutral, 2 Warnung, 3 Alarm, 4 ungültig).',
            'Wende die Styles auf Widgets an und binde die Style-Auswahl an `gHmi.Point[i].StyleIdx` (z. B. über eine Zuordnung Wert → Style).',
            'Prüfe Kontraste von Text zu Hintergrund mit einem Kontrastrechner (WCAG-Kontrastverhältnis für normalen Text mindestens 4,5:1).',
            'Lege Touch-Ziele groß genug an und halte Abstände ein, damit auch mit Handschuhen bedient werden kann.'
          ],
          done: 'Erledigt, wenn alle Widgets ihr Aussehen aus dem Theme beziehen und die Zustands-Styles per Binding wechseln.',
          tip: 'Farben des Corporate Designs eignen sich für Logo, Kopfzeile und Navigation – nicht für Zustände. Kollidiert die Firmenfarbe mit Rot/Gelb, gewinnt die Zustandsbedeutung.',
          link: brLink('Themes und Styles', 'visualization/mappview/engineering/themesandstyles/themesandstyles.html')
        }
      },
      {
        id: 'o3',
        title: 'Programmiere den Analoganzeige-FB',
        guide: {
          intro: 'Ein FB je Messstelle berechnet Zustand, Style-Index, Prozentwert und Trend. So bleibt die Logik für alle Messstellen identisch.',
          steps: [
            'Deklariere `FB_AnalogInd` mit Eingang `Par : AnalogPar_typ` (in AS6 in der .fun-Datei).',
            'Prüfe Plausibilität von Grenzen und Messwert zuerst.',
            'Realisiere die Grenzwertlogik mit Hysterese abhängig vom vorherigen Zustand.',
            'Berechne Trend mit 1-s-Abtastung und Totband.',
            'Löse die Übung.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung grün sind.',
          tip: 'Lege Grenzwerte als Parameter an, nicht als Konstanten im FB. Dann kann derselbe Baustein Temperatur, Druck und Füllstand bedienen.'
        }
      },
      {
        id: 'o4',
        title: 'Führe eine Ergonomie- und Barrierefreiheitsprüfung durch und weise sie nach',
        guide: {
          intro: 'Am Ende prüfst du dein Bild gegen eine Checkliste und dokumentierst die Ergebnisse als Nachweis.',
          steps: [
            'Erstelle eine Checkliste: Grundsätze der Dialoggestaltung (ISO 9241-110), Kontrast, Schriftgröße, Touch-Ziele, Farbe nie als einziges Merkmal, Texte in der längsten Sprache.',
            'Prüfe das Bild mit einem Farbfehlsichtigkeits-Simulator (z. B. Entwicklerwerkzeuge des Browsers).',
            'Behebe gefundene Mängel und halte Vorher/Nachher-Screenshots fest.',
            'Lege Checkliste, Screenshots und Code im Repository ab und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Link eingereicht ist und Checkliste mit Ergebnissen, Screenshots und Code enthält.',
          tip: 'Barrierefreiheit ist an Maschinen auch Ergonomie: Blendung, Handschuhe, Abstand zum Panel und Zeitdruck wirken wie Einschränkungen.'
        }
      }
    ],
    videos: [
      { id: '5GEvFF8pGlc', title: 'What is High-Performance HMI?', channel: 'RealPars', lang: 'en', why: 'Kompakte Einführung in die Idee der High-Performance-HMI.' },
      { id: 'BwtoZUux1a8', title: 'Detailed Design Principles of High-Performance HMI Displays', channel: 'RealPars', lang: 'en', why: 'Konkrete Gestaltungsregeln: Graustufen, Analog-Indikatoren, Bildhierarchie.' },
      { id: 'D0h7CpPaFRI', title: 'E3 ISO 9241 – Gestaltung von Nutzungsschnittstellen', channel: 'Felix Winkelnkemper', lang: 'de', why: 'Deutschsprachige Vorlesungseinheit zur Normenreihe ISO 9241.' }
    ],
    readings: [
      { title: 'Best Design Practices: How to Create High Performance HMI to Enhance Operator Efficiency', author: 'Emerson Electric Co.', institution: 'Emerson Electric Co.', work: 'White Paper Movicon.NExT', year: 2023, type: 'Hersteller', minutes: 30, url: 'https://resources.ipd.com.au/documents/white-papers/Best-practices-for-high-performance-HMI-design_White%20Paper_ENUS_2023.pdf', why: 'Herstellerübergreifend anwendbare Gestaltungsregeln für High-Performance-HMIs.', apa: 'Emerson Electric Co. (2023). *Best design practices: How to create high performance HMI to enhance operator efficiency* [White Paper]. ' + ABGERUFEN + 'https://resources.ipd.com.au/documents/white-papers/Best-practices-for-high-performance-HMI-design_White%20Paper_ENUS_2023.pdf' },
      { title: 'ISA-101 Standards', author: 'International Society of Automation', institution: 'International Society of Automation (ISA)', work: 'ISA Standards', year: 'o. J.', type: 'Norm/Amtlich', minutes: 10, url: 'https://www.isa.org/standards-and-publications/isa-standards/isa-101-standards', why: 'Überblick über ANSI/ISA-101.01 (Human Machine Interfaces for Process Automation Systems) – nur referenziert.', apa: 'International Society of Automation. (o. J.). *ISA-101 standards*. ' + ABGERUFEN + 'https://www.isa.org/standards-and-publications/isa-standards/isa-101-standards' },
      { title: 'Web Content Accessibility Guidelines (WCAG) 2.2', author: 'World Wide Web Consortium', institution: 'W3C', work: 'W3C Recommendation', year: 2023, type: 'Norm/Amtlich', minutes: 30, url: 'https://www.w3.org/TR/WCAG22/', why: 'Kontrastverhältnisse und „Farbe nicht als einziges Merkmal“ – direkt auf HTML5-HMIs wie mapp View übertragbar.', apa: 'World Wide Web Consortium. (2023). *Web content accessibility guidelines (WCAG) 2.2*. W3C. ' + ABGERUFEN + 'https://www.w3.org/TR/WCAG22/' }
    ],
    quiz: [
      { type: 'single', q: 'Welche Aussage beschreibt High-Performance-HMI nach ISA-101 am besten?', options: ['Möglichst realistische 3D-Grafiken der Anlage', 'Graustufen als Grundton, Farbe nur für abnormale Zustände, Werte im Kontext', 'Alle Werte als große Zahlen ohne Grafik', 'Firmenfarben für alle Anzeigen'], correct: 1, explain: 'Das Ziel ist Situationsbewusstsein: Abweichungen sollen sofort ins Auge fallen.' },
      { type: 'single', q: 'Wozu dient die Hysterese in der Grenzwertlogik?', options: ['Sie verhindert flatternde Zustände bei verrauschten Messwerten um die Grenze', 'Sie macht die Anzeige schneller', 'Sie ersetzt die HiHi-Grenze', 'Sie rechnet Einheiten um'], correct: 0, explain: 'Ohne Hysterese wechselt der Zustand bei Rauschen ständig – das erzeugt Alarmfluten und Unruhe.' },
      { type: 'single', q: 'Warum werden Zustandsfarben über Styles statt über Einzelformatierung gesetzt?', options: ['Weil Einzelformatierung nicht möglich ist', 'Damit Aussehen zentral im Theme gepflegt und über alle Widgets konsistent bleibt', 'Weil Styles schneller übertragen werden', 'Weil Styles OPC UA ersetzen'], correct: 1, explain: 'Ein zentrales Theme ist die Voraussetzung für Corporate Design und Konsistenz.' }
    ],
    exam: [
      { type: 'numeric', q: 'Ein Messbereich geht von {a} bis {b} bar. Der Istwert ist {x} bar. Auf wie viel Prozent steht der Balken?', params: { a: [0, 2, 1], b: [10, 20, 2], x: [3, 9, 1] }, formula: '(x - a) / (b - a) * 100', unit: '%', tol: 0.01, explain: 'Percent = (Wert − Min) / (Max − Min) × 100.' },
      { type: 'multi', q: 'Welche Fälle soll ein Analog-Indikator als „ungültig“ kennzeichnen?', options: ['Messwert außerhalb des Messbereichs (z. B. Drahtbruch)', 'Inkonsistente Grenzen (Lo > Hi)', 'Wert exakt in der Mitte des Normalbereichs', 'Messbereich mit Max ≤ Min'], correct: [0, 1, 3], explain: 'Ungültige Daten dürfen nie wie gültige aussehen – sonst trifft der Bediener Entscheidungen auf falscher Grundlage.' },
      { type: 'single', q: 'Welches Kontrastverhältnis fordert WCAG 2.2 (Stufe AA) mindestens für normalen Text?', options: ['2:1', '3:1', '4,5:1', '10:1'], correct: 2, explain: '4,5:1 für normalen Text, 3:1 für großen Text und grafische Bedienelemente.' },
      { type: 'single', q: 'Warum ist ein FB mit Parameter-Struktur besser als vier kopierte Code-Blöcke?', options: ['Weil Kopieren in ST verboten ist', 'Weil Logik und Fehlerbehebung nur an einer Stelle stattfinden und jede Messstelle gleich reagiert', 'Weil FBs weniger Speicher brauchen als Variablen', 'Weil mapp View nur FBs anzeigen kann'], correct: 1, explain: 'Wiederverwendung reduziert Fehler und sorgt für konsistentes Verhalten aller Anzeigen.' }
    ],
    exercises: [EX_HP],
    proof: true,
    badge: 'High-Performance-HMI-Gestalter'
  }
];
