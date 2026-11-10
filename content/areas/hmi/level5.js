'use strict';
const { brHelp, brLink, ABGERUFEN } = require('./_util');

// ---------------------------------------------------------------------------
// Level 5 (Master): HMI-Architektur & Performance (Projekt), Custom Widgets & Sicherheit
// ---------------------------------------------------------------------------

const TYP_CMD = `TYPE
	CmdReq_typ : STRUCT (* HMI -> SPS *)
		Cmd : INT; (* 1 Init, 2 Start, 3 Stop *)
		Seq : UDINT; (* von der HMI je Anforderung erhöht *)
	END_STRUCT;
	CmdRsp_typ : STRUCT (* SPS -> HMI *)
		AckSeq : UDINT; (* Seq der zuletzt beantworteten Anforderung *)
		Result : INT; (* 0 ok, 1 unbekannt, 2 belegt, 3 Timeout, 4 im Zustand nicht erlaubt *)
		Busy : BOOL;
	END_STRUCT;
	ModuleIf_typ : STRUCT
		Req : CmdReq_typ;
		Rsp : CmdRsp_typ;
		Initialized : BOOL;
		Running : BOOL;
	END_STRUCT;
	MachineHmi_typ : STRUCT
		Module : ARRAY[0..1] OF ModuleIf_typ;
	END_STRUCT;
END_TYPE
`;

const FB_CMD = `FUNCTION_BLOCK FB_CmdHandler
	VAR_INPUT
		Req : CmdReq_typ;
		Complete : BOOL; (* Modul meldet: aktives Kommando fertig *)
		ErrorIn : INT; (* Ergebnis des Moduls bei Complete *)
		Timeout : TIME;
	END_VAR
	VAR_OUTPUT
		NewCmd : INT; (* einen Zyklus lang das neu angenommene Kommando, sonst 0 *)
		Busy : BOOL;
		Rsp : CmdRsp_typ;
	END_VAR
	VAR
		nLastSeq : UDINT;
		nActSeq : UDINT;
		tonTimeout : TON;
	END_VAR

	NewCmd := 0;

	(* 1. Laufendes Kommando abschließen *)
	IF Busy AND Complete THEN
		Busy := FALSE;
		Rsp.Result := ErrorIn;
		Rsp.AckSeq := nActSeq;
	END_IF;
	tonTimeout(IN := Busy, PT := Timeout);
	IF tonTimeout.Q THEN
		Busy := FALSE;
		Rsp.Result := 3;
		Rsp.AckSeq := nActSeq;
		tonTimeout(IN := FALSE);
	END_IF;

	(* 2. Neue Anforderung nur bei neuer Sequenznummer *)
	IF Req.Seq <> nLastSeq THEN
		nLastSeq := Req.Seq;
		IF Busy THEN
			Rsp.Result := 2;
			Rsp.AckSeq := Req.Seq;
		ELSE
			NewCmd := Req.Cmd;
			nActSeq := Req.Seq;
			Busy := TRUE;
		END_IF;
	END_IF;

	Rsp.Busy := Busy;
END_FUNCTION_BLOCK
`;

const MAIN_CMD_SOL = FB_CMD + `
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	FOR i := 0 TO 1 DO
		fbCmd[i](Req := gHmi.Module[i].Req, Complete := aComplete[i], ErrorIn := aErr[i], Timeout := T#3s);
		aComplete[i] := FALSE;
		aErr[i] := 0;

		(* Kommando abbrechen, wenn der Handler nicht mehr belegt ist (z. B. Timeout) *)
		IF NOT fbCmd[i].Busy THEN
			aInitActive[i] := FALSE;
		END_IF;

		(* Modullogik: reagiert nur auf NewCmd und meldet Complete *)
		CASE fbCmd[i].NewCmd OF
			0: ;
			1: (* Init: lang laufend, fertig mit Rückmeldung *)
				aInitActive[i] := TRUE;
				aInitialized[i] := FALSE;
			2: (* Start: nur initialisiert *)
				IF aInitialized[i] THEN
					aRun[i] := TRUE;
				ELSE
					aErr[i] := 4;
				END_IF;
				aComplete[i] := TRUE;
			3: (* Stop: immer *)
				aRun[i] := FALSE;
				aComplete[i] := TRUE;
		ELSE
			aErr[i] := 1;
			aComplete[i] := TRUE;
		END_CASE;

		IF aInitActive[i] AND diInitDone[i] THEN
			aInitActive[i] := FALSE;
			aInitialized[i] := TRUE;
			aComplete[i] := TRUE;
		END_IF;

		doInit[i] := aInitActive[i];
		doRun[i] := aRun[i];
		gHmi.Module[i].Rsp := fbCmd[i].Rsp;
		gHmi.Module[i].Initialized := aInitialized[i];
		gHmi.Module[i].Running := aRun[i];
	END_FOR;
END_PROGRAM
`;

const VAR_CMD_SOL = `VAR
	fbCmd : ARRAY[0..1] OF FB_CmdHandler;
	aComplete : ARRAY[0..1] OF BOOL;
	aErr : ARRAY[0..1] OF INT;
	aInitActive : ARRAY[0..1] OF BOOL;
	aInitialized : ARRAY[0..1] OF BOOL;
	aRun : ARRAY[0..1] OF BOOL;
	i : INT;
END_VAR
`;

function req(mod, cmd, seq) { return [{ set: { [`gHmi.Module[${mod}].Req.Cmd`]: cmd, [`gHmi.Module[${mod}].Req.Seq`]: seq } }, { cycles: 3 }]; }

const EX_CMD = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Wiederverwendbarer Kommando-Handshake mit Sequenznummer und Timeout',
  task: `Einfache „Kommando-Bits“ (Level 2) reichen bei großen Maschinen nicht: Lang laufende Kommandos brauchen eine Rückmeldung, ein Client darf nach einem Verbindungsabbruch ein Kommando nicht doppelt auslösen, und mehrere Module sollen dieselbe Schnittstelle haben. Deshalb trennst du **Kommunikation** (generischer FB) von **Modullogik**.

Die HMI schreibt je Modul \`Req.Cmd\` und eine **neue** \`Req.Seq\` (z. B. per Eventbinding: Seq + 1). Die SPS antwortet in \`Rsp\`.

Schreibe einen **FUNCTION_BLOCK FB_CmdHandler** (Deklaration in AS6 in der .fun-Datei) mit \`VAR_INPUT Req : CmdReq_typ; Complete : BOOL; ErrorIn : INT; Timeout : TIME;\` und \`VAR_OUTPUT NewCmd : INT; Busy : BOOL; Rsp : CmdRsp_typ;\`. Verwende ihn für **zwei** Module (\`ARRAY[0..1] OF FB_CmdHandler\`).

**Anforderungen FB**
1. Eine Anforderung gilt nur als neu, wenn sich \`Req.Seq\` gegenüber der zuletzt gesehenen ändert. Gleiche Seq erneut geschrieben → keine Ausführung.
2. Neue Anforderung bei freiem Handler: \`NewCmd\` = Kommando für **genau einen** Aufruf, \`Busy\` TRUE. Bei belegtem Handler: sofort \`Rsp.Result\` = 2, \`Rsp.AckSeq\` = diese Seq, das laufende Kommando läuft weiter.
3. \`Complete\` beendet das laufende Kommando: \`Busy\` FALSE, \`Rsp.Result\` = \`ErrorIn\`, \`Rsp.AckSeq\` = Seq des Kommandos.
4. Läuft ein Kommando länger als \`Timeout\` (3 s): \`Rsp.Result\` = 3, \`Busy\` FALSE. \`Rsp.Busy\` spiegelt \`Busy\`.

**Anforderungen Modullogik** (je Modul i, Ausgänge \`doInit[i]\`, \`doRun[i]\`, Rückmeldung \`diInitDone[i]\` aus der Anlage)
5. Cmd 1 **Init**: \`doInit[i]\` bis \`diInitDone[i]\`, dann initialisiert und Complete (0). Bei Timeout wird \`doInit[i]\` abgeschaltet.
6. Cmd 2 **Start**: nur wenn initialisiert (sonst Ergebnis 4), dann \`doRun[i]\`. Cmd 3 **Stop**: \`doRun[i]\` aus. Andere Kommandos: Ergebnis 1. Start/Stop/unbekannt melden sofort Complete.
7. \`gHmi.Module[i].Rsp\`, \`.Initialized\`, \`.Running\` werden gespiegelt. Die Module sind unabhängig.`,
  hints: [
    'Der FB kennt keine Kommandos, nur Sequenznummern, Busy und Timeout – dadurch ist er für jedes Modul wiederverwendbar.',
    'Rufe den FB am Zyklusanfang auf und setze Complete/ErrorIn danach in der Modullogik; der FB sieht sie im nächsten Zyklus.',
    'Den Timeout-TON setzt du nach Ablauf mit einem zweiten Aufruf tonTimeout(IN := FALSE) zurück.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'MachineHmi_typ', dir: 'in', writable: true, label: 'HMI-Schnittstelle Module' },
    { name: 'diInitDone', type: 'ARRAY[0..1] OF BOOL', dir: 'in', label: 'Init fertig (Anlage)' },
    { name: 'diInitBlocked', type: 'BOOL', dir: 'in', label: 'Simulation: Init von Modul 1 hängt', widget: 'switch' },
    { name: 'doInit', type: 'ARRAY[0..1] OF BOOL', dir: 'out', label: 'Init aktiv' },
    { name: 'doRun', type: 'ARRAY[0..1] OF BOOL', dir: 'out', label: 'Modul läuft' }
  ],
  plant: {
    var: `VAR
	aT : ARRAY[0..1] OF REAL;
	k : INT;
END_VAR
`,
    code: `FOR k := 0 TO 1 DO
	IF doInit[k] AND NOT (diInitBlocked AND (k = 1)) THEN
		aT[k] := aT[k] + PLANT_DT;
	ELSE
		aT[k] := 0.0;
	END_IF;
	diInitDone[k] := aT[k] >= 1.0;
END_FOR;
`
  },
  files: {
    main: `(* TODO: FUNCTION_BLOCK FB_CmdHandler *)

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: zwei Handler-Instanzen + Modullogik *)
	FOR i := 0 TO 1 DO
		IF gHmi.Module[i].Req.Cmd = 2 THEN
			doRun[i] := TRUE;
		ELSIF gHmi.Module[i].Req.Cmd = 3 THEN
			doRun[i] := FALSE;
		END_IF;
	END_FOR;
END_PROGRAM
`,
    var: `VAR
	i : INT;
END_VAR
`,
    typ: TYP_CMD
  },
  solution: { main: MAIN_CMD_SOL, var: VAR_CMD_SOL, typ: TYP_CMD },
  tests: [
    { name: 'Start ohne Init wird mit Ergebnis 4 beantwortet', steps: [
      ...req(0, 2, 1),
      { expect: 'NOT doRun[0] AND gHmi.Module[0].Rsp.Result = 4 AND gHmi.Module[0].Rsp.AckSeq = 1', msg: 'Start ohne Init: Ergebnis 4, AckSeq 1.' },
      { expect: 'NOT gHmi.Module[0].Rsp.Busy' }
    ]},
    { name: 'Init mit Rückmeldung, danach Start', steps: [
      ...req(0, 1, 1),
      { expect: 'doInit[0] AND gHmi.Module[0].Rsp.Busy', msg: 'Init muss laufen und Busy melden.' },
      { until: 'NOT gHmi.Module[0].Rsp.Busy', maxMs: 2000, msg: 'Nach der Rückmeldung (1 s) muss Init fertig sein.' },
      { expect: 'gHmi.Module[0].Rsp.Result = 0 AND gHmi.Module[0].Rsp.AckSeq = 1 AND gHmi.Module[0].Initialized AND NOT doInit[0]' },
      ...req(0, 2, 2),
      { expect: 'doRun[0] AND gHmi.Module[0].Rsp.AckSeq = 2 AND gHmi.Module[0].Rsp.Result = 0', msg: 'Nach Init muss Start gelingen.' }
    ]},
    { name: 'Gleiche Sequenznummer wird nicht erneut ausgeführt', steps: [
      ...req(0, 1, 5), { until: 'gHmi.Module[0].Initialized', maxMs: 2000 },
      ...req(0, 2, 6),
      { expect: 'doRun[0]' },
      { set: { 'gHmi.Module[0].Req.Cmd': 3 } }, { cycles: 5 },
      { expect: 'doRun[0] AND gHmi.Module[0].Rsp.AckSeq = 6', msg: 'Ohne neue Seq darf das geänderte Kommando nicht ausgeführt werden (z. B. Wiederholung nach Reconnect).' },
      ...req(0, 3, 7),
      { expect: 'NOT doRun[0] AND gHmi.Module[0].Rsp.AckSeq = 7' }
    ]},
    { name: 'Belegter Handler lehnt ab, Timeout beendet hängendes Init', steps: [
      { set: { diInitBlocked: true } },
      ...req(1, 1, 1),
      { expect: 'doInit[1] AND gHmi.Module[1].Rsp.Busy' },
      ...req(1, 2, 2),
      { expect: 'gHmi.Module[1].Rsp.Result = 2 AND gHmi.Module[1].Rsp.AckSeq = 2 AND gHmi.Module[1].Rsp.Busy', msg: 'Während Init läuft, muss Start mit „belegt“ (2) beantwortet werden.' },
      { until: 'NOT gHmi.Module[1].Rsp.Busy', maxMs: 3500, msg: 'Nach 3 s muss der Timeout greifen.' },
      { expect: 'gHmi.Module[1].Rsp.Result = 3 AND gHmi.Module[1].Rsp.AckSeq = 1 AND NOT doInit[1] AND NOT gHmi.Module[1].Initialized', msg: 'Timeout: Ergebnis 3 für Seq 1, Init-Ausgang aus.' }
    ]},
    { name: 'Module arbeiten unabhängig, unbekanntes Kommando', steps: [
      { set: { diInitBlocked: true } },
      ...req(1, 1, 1),
      ...req(0, 1, 1),
      { until: 'gHmi.Module[0].Initialized', maxMs: 2000, msg: 'Ein hängendes Modul 1 darf Modul 0 nicht blockieren.' },
      { expect: 'gHmi.Module[1].Rsp.Busy' },
      ...req(0, 9, 2),
      { expect: 'gHmi.Module[0].Rsp.Result = 1 AND gHmi.Module[0].Rsp.AckSeq = 2', msg: 'Unbekanntes Kommando: Ergebnis 1.' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const TYP_PAGE = `TYPE
	Event_typ : STRUCT
		Id : UDINT;
		Severity : INT; (* 0 Info, 1 Warnung, 2 Fehler, 3 kritisch *)
		Value : REAL;
	END_STRUCT;
	ListPar_typ : STRUCT
		MinSeverity : INT; (* Filter: nur Einträge mit Severity >= MinSeverity *)
	END_STRUCT;
	ListCmd_typ : STRUCT
		Next : BOOL;
		Prev : BOOL;
		First : BOOL;
	END_STRUCT;
	ListStatus_typ : STRUCT
		Page : INT; (* 0-basiert *)
		PageCount : INT;
		MatchCount : INT;
		RowsUsed : INT; (* belegte Zeilen der aktuellen Seite *)
		Row : ARRAY[0..9] OF Event_typ; (* einzig gebundenes Fenster: 10 Zeilen *)
	END_STRUCT;
	ListHmi_typ : STRUCT
		Par : ListPar_typ;
		Cmd : ListCmd_typ;
		Status : ListStatus_typ;
	END_STRUCT;
END_TYPE
`;

const MAIN_PAGE_SOL = `PROGRAM _INIT
	(* Testdaten: 200 Ereignisse *)
	FOR i := 0 TO 199 DO
		aEvents[i].Id := INT_TO_UDINT(i + 1);
		aEvents[i].Severity := i MOD 4;
		aEvents[i].Value := INT_TO_REAL(i) * 0.5;
	END_FOR;
	nPage := 0;
	nLastFilter := -1;
END_PROGRAM

PROGRAM _CYCLIC
	(* 1. Filter nur bei Änderung neu aufbauen *)
	nFilter := LIMIT(0, gHmi.Par.MinSeverity, 3);
	IF nFilter <> nLastFilter THEN
		nMatch := 0;
		FOR i := 0 TO 199 DO
			IF aEvents[i].Severity >= nFilter THEN
				aIndex[nMatch] := i;
				nMatch := nMatch + 1;
			END_IF;
		END_FOR;
		nLastFilter := nFilter;
		nPage := 0;
	END_IF;

	(* 2. Blättern *)
	IF nMatch = 0 THEN
		nPageCount := 0;
	ELSE
		nPageCount := (nMatch + 9) / 10;
	END_IF;
	IF gHmi.Cmd.Next THEN
		nPage := nPage + 1;
		gHmi.Cmd.Next := FALSE;
	END_IF;
	IF gHmi.Cmd.Prev THEN
		nPage := nPage - 1;
		gHmi.Cmd.Prev := FALSE;
	END_IF;
	IF gHmi.Cmd.First THEN
		nPage := 0;
		gHmi.Cmd.First := FALSE;
	END_IF;
	nPage := LIMIT(0, nPage, MAX(nPageCount - 1, 0));

	(* 3. Fenster füllen *)
	nRows := 0;
	FOR k := 0 TO 9 DO
		j := nPage * 10 + k;
		IF j < nMatch THEN
			gHmi.Status.Row[k] := aEvents[aIndex[j]];
			nRows := nRows + 1;
		ELSE
			gHmi.Status.Row[k].Id := 0;
			gHmi.Status.Row[k].Severity := 0;
			gHmi.Status.Row[k].Value := 0.0;
		END_IF;
	END_FOR;

	gHmi.Status.Page := nPage;
	gHmi.Status.PageCount := nPageCount;
	gHmi.Status.MatchCount := nMatch;
	gHmi.Status.RowsUsed := nRows;
END_PROGRAM
`;

const VAR_PAGE_SOL = `VAR
	aEvents : ARRAY[0..199] OF Event_typ;
	aIndex : ARRAY[0..199] OF INT;
	nMatch : INT;
	nFilter : INT;
	nLastFilter : INT;
	nPage : INT;
	nPageCount : INT;
	nRows : INT;
	i : INT;
	j : INT;
	k : INT;
END_VAR
`;

const EX_PAGE = {
  id: 'ex2', type: 'st', variant: 'schreiben',
  title: 'Performance: Gefilterte Liste mit Blättern statt 200 Bindings',
  task: `Laut B&R-Performance-Richtlinien bestimmt die **Anzahl aktiver Bindings** die Leistung einer Visualisierung. Eine Ereignisliste mit 200 Einträgen bindet man deshalb nicht komplett, sondern liefert ein **Fenster** von 10 Zeilen (\`gHmi.Status.Row\`), das die SPS beim Blättern und Filtern neu befüllt.

\`aEvents : ARRAY[0..199] OF Event_typ\` wird in \`_INIT\` mit Testdaten gefüllt: Id = i + 1, Severity = i MOD 4, Value = i × 0,5.

**Anforderungen**
1. **Filter:** Nur Einträge mit Severity ≥ \`Par.MinSeverity\` (begrenzt auf 0…3). Die Trefferliste (Indexliste) wird **nur bei Änderung des Filters** neu aufgebaut; dabei springt die Anzeige auf Seite 0.
2. \`Status.MatchCount\` = Treffer, \`Status.PageCount\` = Seiten zu je 10 Zeilen (aufgerundet, 0 bei keinem Treffer).
3. **Blättern:** \`Cmd.Next\`, \`Cmd.Prev\`, \`Cmd.First\` (werden zurückgesetzt). Die Seite bleibt immer im Bereich 0…PageCount − 1.
4. **Fenster:** \`Status.Row[0..9]\` enthält die Einträge der aktuellen Seite in Originalreihenfolge; unbenutzte Zeilen haben Id 0. \`Status.RowsUsed\` = belegte Zeilen.`,
  hints: [
    'Baue eine Indexliste aIndex der Treffer – dann ist Blättern nur noch aEvents[aIndex[Seite * 10 + k]].',
    'Aufrunden in Ganzzahlarithmetik: (nMatch + 9) / 10.',
    'Typumwandlungen explizit: INT_TO_UDINT, INT_TO_REAL.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'ListHmi_typ', dir: 'in', writable: true, label: 'HMI-Schnittstelle Ereignisliste' }
  ],
  files: {
    main: `PROGRAM _INIT
	FOR i := 0 TO 199 DO
		aEvents[i].Id := INT_TO_UDINT(i + 1);
		aEvents[i].Severity := i MOD 4;
		aEvents[i].Value := INT_TO_REAL(i) * 0.5;
	END_FOR;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Filter, Seitenzahl, Blättern, Fenster *)
	FOR k := 0 TO 9 DO
		gHmi.Status.Row[k] := aEvents[k];
	END_FOR;
END_PROGRAM
`,
    var: `VAR
	aEvents : ARRAY[0..199] OF Event_typ;
	i : INT;
	k : INT;
END_VAR
`,
    typ: TYP_PAGE
  },
  solution: { main: MAIN_PAGE_SOL, var: VAR_PAGE_SOL, typ: TYP_PAGE },
  tests: [
    { name: 'Ohne Filter: 200 Treffer, 20 Seiten', steps: [
      { cycles: 2 },
      { expect: 'gHmi.Status.MatchCount = 200 AND gHmi.Status.PageCount = 20 AND gHmi.Status.Page = 0', msg: '200 Einträge = 20 Seiten.' },
      { expect: 'gHmi.Status.Row[0].Id = 1 AND gHmi.Status.Row[9].Id = 10 AND gHmi.Status.RowsUsed = 10' }
    ]},
    { name: 'Blättern und Grenzen', steps: [
      { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.Page = 1 AND gHmi.Status.Row[0].Id = 11 AND NOT gHmi.Cmd.Next', msg: 'Seite 1 beginnt mit Id 11.' },
      { set: { 'gHmi.Cmd.Prev': true } }, { cycles: 2 },
      { set: { 'gHmi.Cmd.Prev': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.Page = 0', msg: 'Vor Seite 0 darf nicht geblättert werden.' }
    ]},
    { name: 'Filter: nur kritische Einträge', steps: [
      { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 },
      { set: { 'gHmi.Par.MinSeverity': 3 } }, { cycles: 2 },
      { expect: 'gHmi.Status.MatchCount = 50 AND gHmi.Status.PageCount = 5 AND gHmi.Status.Page = 0', msg: 'Severity 3 trifft jeden vierten Eintrag (50), Filterwechsel springt auf Seite 0.' },
      { expect: 'gHmi.Status.Row[0].Id = 4 AND gHmi.Status.Row[1].Id = 8 AND gHmi.Status.Row[0].Severity = 3', msg: 'Erste Treffer: Id 4, 8, …' }
    ]},
    { name: 'Letzte Seite teilweise belegt', steps: [
      { set: { 'gHmi.Par.MinSeverity': 1 } }, { cycles: 2 },
      { expect: 'gHmi.Status.MatchCount = 150 AND gHmi.Status.PageCount = 15' },
      { set: { 'gHmi.Par.MinSeverity': 2 } }, { cycles: 2 },
      { expect: 'gHmi.Status.MatchCount = 100 AND gHmi.Status.PageCount = 10' },
      { set: { 'gHmi.Par.MinSeverity': 9 } }, { cycles: 2 },
      { expect: 'gHmi.Status.MatchCount = 50', msg: 'MinSeverity wird auf 0…3 begrenzt.' },
      { set: { 'gHmi.Par.MinSeverity': 3 } }, { cycles: 2 },
      { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 }, { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 },
      { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 }, { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 },
      { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 }, { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.Page = 4', msg: 'Nach der letzten Seite darf nicht weitergeblättert werden.' },
      { set: { 'gHmi.Cmd.First': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.Page = 0' }
    ]},
    { name: 'Teilweise belegte Seite und leere Zeilen', steps: [
      { set: { 'gHmi.Par.MinSeverity': 3 } }, { cycles: 2 },
      { set: { 'gHmi.Par.MinSeverity': 0 } }, { cycles: 2 },
      { set: { 'gHmi.Cmd.Next': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.RowsUsed = 10' },
      { set: { 'gHmi.Par.MinSeverity': 1 } }, { cycles: 2 },
      { expect: 'gHmi.Status.Row[0].Id = 2 AND gHmi.Status.Row[2].Id = 4 AND gHmi.Status.Row[3].Id = 6', msg: 'Severity ≥ 1: Id 2, 3, 4, 6, 7, 8, …' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const TYP_REMOTE = `TYPE
	RemoteReq_typ : STRUCT (* vom Fernzugriffs-Client *)
		Request : BOOL; (* Sitzung anfordern *)
		Heartbeat : UINT;
		WriteSeq : UDINT; (* je Schreibauftrag erhöht *)
		SpeedSet : REAL; (* gewünschter Wert *)
	END_STRUCT;
	LocalCmd_typ : STRUCT (* vom Bediener am Panel *)
		Approve : BOOL;
		Revoke : BOOL;
	END_STRUCT;
	RemoteStatus_typ : STRUCT
		State : INT; (* 0 aus, 1 angefragt, 2 aktiv, 3 gesperrt *)
		Reason : INT; (* Grund der letzten Beendigung: 0 -, 1 Schlüsselschalter, 2 keine Zustimmung, 3 Lebenszeichen, 4 widerrufen, 5 ungültige Schreibaufträge *)
		Rejected : INT; (* abgewiesene Schreibaufträge in der Sitzung *)
	END_STRUCT;
END_TYPE
`;

const MAIN_REMOTE_SOL = `PROGRAM _INIT
	rSpeed := 50.0;
END_PROGRAM

PROGRAM _CYCLIC
	(* Lebenszeichen des Fernzugriffs *)
	bHbChanged := gRemote.Heartbeat <> nLastHb;
	nLastHb := gRemote.Heartbeat;
	tonHb(IN := (nState = ST_ACTIVE) AND NOT bHbChanged, PT := T#5s);
	tonApprove(IN := nState = ST_REQUESTED, PT := T#30s);

	(* Übergeordnet: Schlüsselschalter und Widerruf beenden jede Sitzung *)
	IF (nState <> ST_OFF) AND NOT diKeyRemote THEN
		nState := ST_OFF;
		gStatus.Reason := 1;
	ELSIF (nState <> ST_OFF) AND gLocal.Revoke THEN
		nState := ST_OFF;
		gStatus.Reason := 4;
	END_IF;
	gLocal.Revoke := FALSE;

	CASE nState OF
		ST_OFF:
			IF rtReq.Q THEN
				IF diKeyRemote THEN
					nState := ST_REQUESTED;
					gStatus.Reason := 0;
				ELSE
					gStatus.Reason := 1;
				END_IF;
			END_IF;
		ST_REQUESTED:
			IF gLocal.Approve THEN
				nState := ST_ACTIVE;
				gStatus.Rejected := 0;
				nLastSeq := gRemote.WriteSeq;
			ELSIF tonApprove.Q THEN
				nState := ST_OFF;
				gStatus.Reason := 2;
			END_IF;
		ST_ACTIVE:
			IF tonHb.Q THEN
				nState := ST_OFF;
				gStatus.Reason := 3;
			ELSIF gRemote.WriteSeq <> nLastSeq THEN
				nLastSeq := gRemote.WriteSeq;
				IF (gRemote.SpeedSet >= 0.0) AND (gRemote.SpeedSet <= 100.0) THEN
					rSpeed := gRemote.SpeedSet;
				ELSE
					gStatus.Rejected := gStatus.Rejected + 1;
					IF gStatus.Rejected >= 3 THEN
						nState := ST_LOCKED;
						gStatus.Reason := 5;
					END_IF;
				END_IF;
			END_IF;
		ST_LOCKED:
			; (* nur Widerruf am Panel oder Schlüsselschalter hebt die Sperre auf *)
	END_CASE;
	gLocal.Approve := FALSE;
	rtReq(CLK := gRemote.Request);

	(* Anzeige an der Maschine: Fernzugriff aktiv = Dauerlicht, angefragt = Blinken *)
	tonBlink(IN := NOT tonBlink.Q, PT := T#500ms);
	IF tonBlink.Q THEN
		bBlink := NOT bBlink;
	END_IF;
	doRemoteLamp := (nState = ST_ACTIVE) OR (nState = ST_LOCKED) OR ((nState = ST_REQUESTED) AND bBlink);

	gStatus.State := nState;
	aoSpeed := rSpeed;
END_PROGRAM
`;

const VAR_REMOTE_CONST = `VAR CONSTANT
	ST_OFF : INT := 0;
	ST_REQUESTED : INT := 1;
	ST_ACTIVE : INT := 2;
	ST_LOCKED : INT := 3;
END_VAR
`;

const EX_REMOTE = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Fernzugriff absichern: Schlüsselschalter, Zustimmung, Lebenszeichen, Sperre',
  task: `mapp View ist eine Web-Anwendung – jeder Browser im Netz kann Client werden. Organisatorische und technische Maßnahmen (Netzsegmentierung, HTTPS, Benutzerverwaltung, VPN; siehe BSI-Empfehlung zur Fernwartung) kommen zuerst. Zusätzlich sichert die **Maschinenlogik** ab, was ein Fernzugriff bewirken darf: Der Bediener vor Ort behält die Kontrolle.

**Zustände** \`gStatus.State\`: 0 aus, 1 angefragt, 2 aktiv, 3 gesperrt.

**Anforderungen**
1. **Anfrage:** Steigende Flanke von \`gRemote.Request\` → Zustand 1, aber nur wenn der Schlüsselschalter \`diKeyRemote\` an der Maschine TRUE ist (sonst bleibt 0, \`Reason\` = 1).
2. **Zustimmung vor Ort:** \`gLocal.Approve\` (Panel an der Maschine) innerhalb **30 s** → Zustand 2; sonst zurück auf 0 mit \`Reason\` = 2. \`gLocal.Approve\` und \`gLocal.Revoke\` werden immer zurückgesetzt. Beim Aktivieren wird \`Rejected\` auf 0 gesetzt und die aktuelle \`gRemote.WriteSeq\` als gesehen übernommen.
3. **Schreiben (nur im Zustand 2):** Eine neue \`gRemote.WriteSeq\` ist ein Schreibauftrag. \`SpeedSet\` im Bereich 0…100 wird übernommen (\`aoSpeed\`), sonst abgewiesen und \`Rejected\` erhöht. Beim **dritten** abgewiesenen Auftrag → Zustand 3 (gesperrt, \`Reason\` = 5). In allen anderen Zuständen wird nichts übernommen.
4. **Lebenszeichen:** Ändert sich \`gRemote.Heartbeat\` im Zustand 2 für 5 s nicht → 0, \`Reason\` = 3.
5. **Übergeordnet:** Schlüsselschalter aus → 0 (\`Reason\` 1); \`gLocal.Revoke\` → 0 (\`Reason\` 4) – aus jedem Zustand, auch aus „gesperrt“.
6. **Signalleuchte** \`doRemoteLamp\`: blinkt (500 ms) im Zustand 1, leuchtet in 2 und 3, sonst aus.
7. Startwert \`aoSpeed\` = 50.`,
  hints: [
    'Prüfe die übergeordneten Bedingungen (Schlüsselschalter, Widerruf) vor dem CASE – so gelten sie in jedem Zustand.',
    'Die Request-Flanke erkennst du mit R_TRIG. Rufe ihn so auf, dass der Wechsel auf TRUE genau einmal wirkt.',
    'Ein Schreibauftrag ist eine neue Sequenznummer – nicht ein geänderter Wert. So werden auch zwei gleiche Werte nacheinander gezählt.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gRemote', type: 'RemoteReq_typ', dir: 'in', writable: true, label: 'Fernzugriffs-Client' },
    { name: 'gLocal', type: 'LocalCmd_typ', dir: 'in', writable: true, label: 'Bedienpanel vor Ort' },
    { name: 'gStatus', type: 'RemoteStatus_typ', dir: 'out', label: 'Status Fernzugriff' },
    { name: 'diKeyRemote', type: 'BOOL', dir: 'in', label: 'Schlüsselschalter Fernzugriff', widget: 'switch' },
    { name: 'doRemoteLamp', type: 'BOOL', dir: 'out', label: 'Leuchte „Fernzugriff“', widget: 'led' },
    { name: 'aoSpeed', type: 'REAL', dir: 'out', label: 'Sollgeschwindigkeit', widget: 'value', unit: '%' }
  ],
  scene: { type: 'lamp', bind: { lamps: ['doRemoteLamp'] } },
  files: {
    main: `PROGRAM _INIT
	rSpeed := 50.0;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Zustandsautomat Fernzugriff *)
	IF gRemote.Request THEN
		nState := ST_ACTIVE;
	END_IF;
	IF nState = ST_ACTIVE THEN
		rSpeed := gRemote.SpeedSet;
	END_IF;
	gStatus.State := nState;
	aoSpeed := rSpeed;
END_PROGRAM
`,
    var: VAR_REMOTE_CONST + `VAR
	nState : INT;
	rSpeed : REAL;
END_VAR
`,
    typ: TYP_REMOTE
  },
  solution: {
    main: MAIN_REMOTE_SOL,
    var: VAR_REMOTE_CONST + `VAR
	nState : INT;
	rSpeed : REAL;
	rtReq : R_TRIG;
	tonApprove : TON;
	tonHb : TON;
	bHbChanged : BOOL;
	nLastHb : UINT;
	nLastSeq : UDINT;
	tonBlink : TON;
	bBlink : BOOL;
END_VAR
`,
    typ: TYP_REMOTE
  },
  tests: [
    { name: 'Ohne Schlüsselschalter keine Sitzung', steps: [
      { set: { 'gRemote.Request': true } }, { cycles: 3 },
      { expect: 'gStatus.State = 0 AND gStatus.Reason = 1 AND NOT doRemoteLamp', msg: 'Schlüsselschalter aus: Anfrage abweisen, Reason 1.' },
      { set: { 'gRemote.WriteSeq': 1, 'gRemote.SpeedSet': 80.0 } }, { cycles: 3 },
      { expect: 'aoSpeed = 50.0', msg: 'Ohne aktive Sitzung darf nichts übernommen werden.' }
    ]},
    { name: 'Anfrage, Zustimmung vor Ort, gültiger Schreibauftrag', steps: [
      { set: { diKeyRemote: true, 'gRemote.Request': true } }, { cycles: 3 },
      { expect: 'gStatus.State = 1', msg: 'Mit Schlüsselschalter: Zustand angefragt.' },
      { until: 'doRemoteLamp', maxMs: 1200 }, { until: 'NOT doRemoteLamp', maxMs: 800, msg: 'Im Zustand „angefragt“ muss die Leuchte blinken.' },
      { set: { 'gRemote.WriteSeq': 1, 'gRemote.SpeedSet': 80.0 } }, { cycles: 3 },
      { expect: 'aoSpeed = 50.0', msg: 'Vor der Zustimmung darf nichts übernommen werden.' },
      { set: { 'gLocal.Approve': true } }, { cycles: 3 },
      { expect: 'gStatus.State = 2 AND doRemoteLamp AND NOT gLocal.Approve', msg: 'Zustimmung vor Ort aktiviert die Sitzung.' },
      { expect: 'aoSpeed = 50.0', msg: 'Der vor der Zustimmung gesendete Auftrag darf nicht nachträglich wirken.' },
      { set: { 'gRemote.WriteSeq': 2, 'gRemote.SpeedSet': 70.0, 'gRemote.Heartbeat': 1 } }, { cycles: 3 },
      { expect: 'aoSpeed = 70.0', msg: 'Gültiger Schreibauftrag in aktiver Sitzung wird übernommen.' }
    ]},
    { name: 'Keine Zustimmung innerhalb 30 s', steps: [
      { set: { diKeyRemote: true, 'gRemote.Request': true } }, { cycles: 3 },
      { ms: 29000 },
      { expect: 'gStatus.State = 1' },
      { ms: 1500 },
      { expect: 'gStatus.State = 0 AND gStatus.Reason = 2', msg: 'Ohne Zustimmung nach 30 s zurück auf aus, Reason 2.' }
    ]},
    { name: 'Drei ungültige Schreibaufträge sperren, Widerruf hebt auf', steps: [
      { set: { diKeyRemote: true, 'gRemote.Request': true } }, { cycles: 3 },
      { set: { 'gLocal.Approve': true } }, { cycles: 3 },
      { set: { 'gRemote.WriteSeq': 1, 'gRemote.SpeedSet': 150.0, 'gRemote.Heartbeat': 1 } }, { cycles: 3 },
      { set: { 'gRemote.WriteSeq': 2, 'gRemote.SpeedSet': -1.0, 'gRemote.Heartbeat': 2 } }, { cycles: 3 },
      { expect: 'gStatus.State = 2 AND gStatus.Rejected = 2 AND aoSpeed = 50.0' },
      { set: { 'gRemote.WriteSeq': 3, 'gRemote.SpeedSet': 999.0, 'gRemote.Heartbeat': 3 } }, { cycles: 3 },
      { expect: 'gStatus.State = 3 AND gStatus.Reason = 5', msg: 'Der dritte ungültige Auftrag muss den Fernzugriff sperren.' },
      { set: { 'gRemote.WriteSeq': 4, 'gRemote.SpeedSet': 60.0 } }, { cycles: 3 },
      { expect: 'aoSpeed = 50.0', msg: 'Im gesperrten Zustand wird nichts übernommen.' },
      { set: { 'gLocal.Revoke': true } }, { cycles: 3 },
      { expect: 'gStatus.State = 0 AND gStatus.Reason = 4 AND NOT gLocal.Revoke', msg: 'Widerruf vor Ort beendet auch den gesperrten Zustand.' }
    ]},
    { name: 'Lebenszeichen und Schlüsselschalter beenden die Sitzung', steps: [
      { set: { diKeyRemote: true, 'gRemote.Request': true } }, { cycles: 3 },
      { set: { 'gLocal.Approve': true } }, { cycles: 3 },
      { ms: 4000 }, { set: { 'gRemote.Heartbeat': 1 } }, { ms: 4000 },
      { expect: 'gStatus.State = 2', msg: 'Ein Lebenszeichen innerhalb von 5 s hält die Sitzung.' },
      { ms: 1500 },
      { expect: 'gStatus.State = 0 AND gStatus.Reason = 3', msg: '5 s ohne Lebenszeichen: Sitzung beendet, Reason 3.' },
      { set: { 'gRemote.Request': false } }, { cycles: 2 }, { set: { 'gRemote.Request': true } }, { cycles: 3 },
      { set: { 'gLocal.Approve': true } }, { cycles: 3 },
      { expect: 'gStatus.State = 2' },
      { set: { diKeyRemote: false } }, { cycles: 3 },
      { expect: 'gStatus.State = 0 AND gStatus.Reason = 1', msg: 'Schlüsselschalter aus beendet die Sitzung sofort.' }
    ]}
  ]
};

module.exports = [
  {
    id: 'hmi-5-projekt-architektur',
    level: 5,
    kind: 'projekt',
    title: 'Praxisprojekt: HMI-Architektur und Performance',
    summary: 'Du entwirfst die Schnittstellenarchitektur zwischen SPS und HMI für eine modulare Maschine, trennst Logik und Darstellung konsequent und optimierst die Visualisierung nach den B&R-Performance-Richtlinien.',
    minutes: 420,
    req: ['hmi-3-projekt-alarme', 'hmi-4-projekt-highperformance'],
    briefing: 'Ab einer gewissen Größe entscheidet die Architektur über Wartbarkeit und Leistung einer HMI. Grundprinzipien: Die SPS ist die einzige Wahrheit; die HMI enthält keine Maschinenlogik. Jedes Maschinenmodul hat dieselbe Schnittstellenstruktur (Kommandos mit Handshake, Parameter, Status), damit Pages, Contents und Compound Widgets wiederverwendbar sind. Bei der Performance zählen Anzahl der Pages und Widgets mit Binding, Widget-Klassen, Eventbindings, Verschachtelungstiefe und Sampling-Rate. B&R gibt dafür in den Hardware- und Software-Richtlinien konkrete Orientierungswerte je Panel-Klasse (z. B. T50, T80, C80).',
    practice: 'Eine Linie mit acht gleichen Modulen bekommt eine HMI, in der jedes Modul dieselbe Seite nutzt – parametriert nur über den Modul-Index. Ein Panel T50 mit zu vielen Bindings und Charts reagiert dagegen träge, und Bediener drücken Tasten mehrfach.',
    transfer: {
      tia: 'In TIA Portal entspricht das Faceplates mit Schnittstellen-UDTs, PLC-Datentypen pro Modul und dem „Bildbaustein“-Konzept; Performance-Hinweise gibt Siemens je Panel-Typ (Mengengerüst).',
      codesys: 'In CODESYS werden Visualisierungsbausteine mit Schnittstellenparametern (VAR_IN_OUT auf Modulstrukturen) und Frames verwendet; für große Projekte ein klares Datenmodell je Modul.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf eine einheitliche Modul-Schnittstelle',
        guide: {
          intro: 'Jedes Maschinenmodul bekommt dieselbe Schnittstellenstruktur. Die HMI kennt nur diese Struktur und den Modul-Index.',
          steps: [
            'Zerlege die Maschine in Module (z. B. Zuführung, Bearbeitung, Abtransport) und lege je Modul eine Instanz von `ModuleIf_typ` an.',
            'Gliedere jede Schnittstelle in Req (Kommando + Sequenznummer), Rsp (Quittung, Ergebnis, Busy), Par und Status.',
            'Lege die Schnittstelle als `ARRAY[0..n] OF ModuleIf_typ` an – dann reicht ein Content, der per Index auf ein Modul zeigt.',
            'Lege fest, welche Teile im OPC UA Default View freigegeben werden und mit welchen Rechten.',
            'Dokumentiere die Schnittstelle versioniert (Änderungen an der Struktur sind Breaking Changes für die HMI).'
          ],
          done: 'Erledigt, wenn eine dokumentierte Schnittstellenstruktur für mindestens zwei Module existiert und im OPC UA Default View freigegeben ist.',
          tip: 'Behandle die HMI-Schnittstelle wie eine API: neue Felder am Ende ergänzen, nichts umbenennen, Versionsnummer pflegen.'
        }
      },
      {
        id: 'o2',
        title: 'Realisiere den Kommando-Handshake als wiederverwendbaren FB',
        guide: {
          intro: 'Ein generischer FB übernimmt Sequenznummer, Busy, Timeout und Quittung. Die Modullogik reagiert nur auf neu angenommene Kommandos.',
          steps: [
            'Implementiere `FB_CmdHandler` (Übung 1) und deklariere ihn in der .fun-Datei deiner Bibliothek.',
            'Instanziiere ihn je Modul in einem Array.',
            'Erzeuge in mapp View die Sequenznummer per Eventbinding (Wert lesen, +1, schreiben) bzw. über ein Compound Widget mit dieser Logik.',
            'Zeige Busy und Result in der HMI an; deaktiviere Buttons, solange Busy TRUE ist.',
            'Löse Übung 1.'
          ],
          done: 'Erledigt, wenn alle Tests von Übung 1 grün sind.',
          tip: 'Die Sequenznummer macht Kommandos idempotent: Ein Client, der nach einem Reconnect seinen letzten Stand erneut schreibt, löst nichts doppelt aus.'
        }
      },
      {
        id: 'o3',
        title: 'Analysiere und optimiere die Performance',
        guide: {
          intro: 'Die B&R-Richtlinien nennen Orientierungswerte (z. B. Widgets mit Binding pro Page, Widget-Klassen A/B/C, Anzahl Ereignisse) je Client-Hardware und Software-Regeln für das Design.',
          steps: [
            'Lies die **Hardware-Richtlinien** und ordne dein Zielpanel einer Klasse zu (z. B. T50: empfohlene Widget-Klassen A und B).',
            'Zähle je Page die Widgets mit Binding und die Eventbindings; vergleiche mit den Orientierungswerten.',
            'Nutze die mapp View-Diagnoseseite **Aktive Bindings**, um tatsächlich aktive Bindings zu sehen.',
            'Optimiere: Listen per Fenster statt Vollbindung (Übung 2), Array-Bindings, statisches Layout, flache Container-Verschachtelung, passende OPC UA-Sampling-Rate, ggf. Content-Pre-Caching.',
            'Miss Seitenwechselzeiten vor und nach der Optimierung (Stoppuhr bzw. Browser-Entwicklerwerkzeuge).'
          ],
          done: 'Erledigt, wenn eine Tabelle Page – Bindings – Widgets – Eventbindings vorher/nachher vorliegt und Übung 2 grün ist.',
          tip: 'Ein Binding auf ein großes Array mit 200 Strukturen ist billiger als 200 Bindings – aber teurer als ein Fenster mit 10 Zeilen, wenn sich die Daten ständig ändern.',
          link: brLink('Hardware Richtlinien', 'visualization/mappview/guides/performanceguideline/common_hardwareguidance.html')
        }
      },
      {
        id: 'o4',
        title: 'Weise die Architektur nach',
        guide: {
          intro: 'Als Nachweis dokumentierst du Architektur, Schnittstelle und Performance-Messung im Repository.',
          steps: [
            'Zeichne ein Architekturdiagramm: Module, Schnittstellenstrukturen, OPC UA, mapp View-Server, Clients.',
            'Lege die Schnittstellendokumentation und die Performance-Tabelle ab.',
            'Committe Code und Konfiguration mit sauberer Historie (ein Commit je logischer Änderung).',
            'Reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Link eingereicht ist und Diagramm, Schnittstellendoku, Performance-Tabelle und Code enthält.',
          tip: 'Ein Architekturdiagramm auf einer Seite ist für neue Kollegen wertvoller als 50 Seiten Fließtext.'
        }
      }
    ],
    videos: [
      { id: 'S2BHEnAyzoE', title: 'UI Template for mappView - Modular Design for Multidisplay HMI Projects', channel: 'AGD LAB', lang: 'en', why: 'Zeigt einen modularen Aufbau von mapp View-Projekten für mehrere Displaygrößen.' },
      { id: '-nH08fDesrE', title: 'mapp Framework Overview', channel: 'B&R Industrial Automation', lang: 'en', why: 'Überblick über das modulare mapp Framework als Referenzarchitektur für SPS und HMI.' }
    ],
    readings: [
      brHelp('Software Richtlinien (Performance)', 'visualization/mappview/guides/performanceguideline/performance_software.html', 30, 'Statisches Layout, Anzahl aktiver Bindings, Eventbindings, Styling, Pre-Caching, Sampling-Rate, Verschachtelungstiefe, Listen und Charts.'),
      brHelp('Hardware Richtlinien', 'visualization/mappview/guides/performanceguideline/common_hardwareguidance.html', 15, 'Orientierungswerte für Pages, Widgets mit Binding, Widget-Klassen und Ereignisse je Client-Hardware.'),
      { title: 'mapp Framework – Visualization considerations', author: 'B&R Community', institution: 'B&R Industrial Automation (Community-Projekt)', work: 'mapp Framework Dokumentation', year: 'o. J.', type: 'Dokumentation', minutes: 15, url: 'https://br-automation-community.github.io/mapp-Framework/general/visualization_consideration/', why: 'Hinweise, wie die Framework-Module in eine eigene mapp View-Architektur eingebunden werden.', apa: 'B&R Community. (o. J.). *mapp Framework – Visualization considerations*. B&R Industrial Automation. ' + ABGERUFEN + 'https://br-automation-community.github.io/mapp-Framework/general/visualization_consideration/' }
    ],
    quiz: [
      { type: 'single', q: 'Was verhindert die Sequenznummer im Kommando-Handshake?', options: ['Dass Kommandos zu schnell ausgeführt werden', 'Dass ein erneut geschriebenes, identisches Kommando (z. B. nach Reconnect) doppelt ausgeführt wird', 'Dass die HMI abstürzt', 'Dass Alarme entstehen'], correct: 1, explain: 'Nur eine neue Seq ist eine neue Anforderung – das macht Kommandos idempotent.' },
      { type: 'multi', q: 'Welche Faktoren nennen die B&R-Performance-Richtlinien für mapp View?', options: ['Anzahl aktiver Bindings', 'Eventbindings und Verschachtelungstiefe von Containern', 'Sampling-Rate (OPC UA) und Chart-Widgets', 'Länge der Variablennamen in ST'], correct: [0, 1, 2], explain: 'Die Software-Richtlinien listen u. a. Bindings, Eventbindings, Styling, Pre-Caching, Sampling-Rate, Verschachtelung, Charts und Listen.' },
      { type: 'single', q: 'Warum enthält die HMI in einer guten Architektur keine Maschinenlogik?', options: ['Weil JavaScript verboten ist', 'Weil mehrere Clients sonst unterschiedliche Entscheidungen treffen könnten und die Logik nicht zentral testbar wäre', 'Weil Widgets keine Logik können', 'Weil OPC UA zu langsam ist'], correct: 1, explain: 'Die SPS ist die einzige Wahrheit. Die HMI stellt dar und nimmt Bedienwünsche entgegen.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine Liste mit {n} Einträgen wird in Seiten zu {p} Zeilen angezeigt. Wie viele Seiten gibt es?', params: { n: [11, 250, 1], p: [5, 20, 5] }, formula: 'ceil(n / p)', unit: 'Seiten', tol: 0, explain: 'Aufrunden: (n + p − 1) / p in Ganzzahlarithmetik.' },
      { type: 'single', q: 'Welche Widget-Klassen empfiehlt die B&R-Hardware-Richtlinie für ein T50-Panel?', options: ['A und B', 'Nur C', 'A, B und C ohne Einschränkung', 'Keine Widgets mit Binding'], correct: 0, explain: 'Für T50 werden die Widget-Klassen A und B empfohlen; C (komplexe Widgets) erst ab leistungsfähigeren Clients.' },
      { type: 'single', q: 'Ein Kommando läuft und ein zweites trifft ein. Was antwortet der Handler in der Übung?', options: ['Er bricht das erste ab', 'Er beantwortet das zweite sofort mit „belegt“ und lässt das erste weiterlaufen', 'Er ignoriert beide', 'Er führt beide parallel aus'], correct: 1, explain: 'Klare Semantik: ein Kommando gleichzeitig, jede Anforderung bekommt eine Antwort.' },
      { type: 'multi', q: 'Welche Maßnahmen reduzieren die Anzahl aktiver Bindings?', options: ['Fenster (Paging) statt vollständiger Listenbindung', 'Ein Content für alle gleichartigen Module mit Index', 'Array-Bindings statt Einzelvariablen', 'Jeden Wert in drei Widgets gleichzeitig anzeigen'], correct: [0, 1, 2], explain: 'Weniger, gezieltere Bindings entlasten Server, Netzwerk und Client.' }
    ],
    exercises: [EX_CMD, EX_PAGE],
    proof: true,
    badge: 'HMI-Architekt'
  },

  {
    id: 'hmi-5-widgets-sicherheit',
    level: 5,
    kind: 'lektion',
    title: 'Custom Widgets, Widget-Bibliotheken und sicherer Fernzugriff',
    summary: 'Du lernst Compound und Derived Widgets sowie Widget Libraries kennen und sicherst mapp View-Clients und Fernzugriffe technisch und organisatorisch ab.',
    minutes: 300,
    req: ['hmi-5-projekt-architektur'],
    briefing: 'Wiederverwendung auf Widget-Ebene: Ein Derived Widget ist ein vorkonfiguriertes Standard-Widget (z. B. ein Button im Firmenstil), ein Compound Widget fasst mehrere Widgets mit eigenen Eigenschaften, Ereignissen und Aktionen zusammen (z. B. ein Analog-Indikator oder ein Modul-Bedienfeld). Widget Libraries bündeln sie versioniert für mehrere Projekte. Zweites Thema ist Sicherheit: mapp View ist ein Webserver, OPC UA die Datenschnittstelle. B&R beschreibt in der Security-Anwenderdokumentation die Einordnung nach IEC 62443; das BSI gibt Empfehlungen zur Fernwartung. Du kombinierst technische Maßnahmen (HTTPS, Rollen, Segmentierung) mit Maschinenlogik, die dem Bediener vor Ort die Kontrolle lässt.',
    practice: 'Serviceeinsätze per Fernzugriff sparen Reisen, sind aber ein Einfallstor. Kunden fordern zunehmend Nachweise nach IEC 62443; ein Schlüsselschalter „Fernzugriff erlaubt“ und eine Zustimmung vor Ort sind übliche Maßnahmen.',
    transfer: {
      tia: 'In WinCC Unified entsprechen Compound Widgets den Faceplates bzw. „Custom Web Controls“; für Fernzugriff gibt es Web-Clients mit Benutzerverwaltung und Siemens-Empfehlungen zur Netzwerksicherheit.',
      codesys: 'CODESYS bietet Visualisierungsbausteine in Bibliotheken; für Fernzugriff WebVisu mit Benutzerverwaltung und verschlüsselter Verbindung (HTTPS) sowie das CODESYS Security Agent-Konzept.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erstelle ein Derived und ein Compound Widget',
        guide: {
          intro: 'Derived Widgets kapseln vorkonfigurierte Standard-Widgets, Compound Widgets kombinieren mehrere Widgets zu einem neuen Baustein mit eigener Schnittstelle.',
          steps: [
            'Lege ein **Derived Widget** an (z. B. `ButtonPrimary`) mit festem Style und Mindestgröße für Touch.',
            'Lege ein **Compound Widget** `AnalogIndicator` an: Balken, Grenzmarken, NumericOutput, Trendpfeil.',
            'Definiere die Eigenschaften des Compound Widgets so, dass sie zu `AnalogStatus_typ` passen (Struktur-Binding für Compound Widgets).',
            'Ergänze bei Bedarf eigene Ereignisse/Aktionen (EventScript) – beachte die dokumentierten Limitierungen von Compound Widgets.',
            'Setze das Compound Widget viermal im Übersichtsbild ein.'
          ],
          done: 'Erledigt, wenn ein Compound Widget mit Struktur-Binding mehrfach verwendet wird und eine Änderung am Widget überall wirkt.',
          tip: 'Ein Compound Widget ist eine API: Eigenschaften gut benennen, dokumentieren und nicht ohne Not ändern.',
          link: brLink('Compound Widget', 'visualization/mappview/engineering/customwidgets/lv_customwidgets_compound/compoundwidget.html')
        }
      },
      {
        id: 'o2',
        title: 'Organisiere Widgets in einer versionierten Widget Library',
        guide: {
          intro: 'Eine Widget Library bündelt eigene Widgets für mehrere Projekte und wird versioniert.',
          steps: [
            'Erstelle eine **Widget Library** und verschiebe dein Derived und Compound Widget dorthin.',
            'Lege Ressourcen (Bilder, Styles) in der Library ab.',
            'Vergib eine Versionsnummer und baue die Library.',
            'Binde die Library in ein zweites Projekt ein und prüfe die Wiederverwendung.',
            'Lege die Library in einem eigenen Git-Repository mit Changelog ab.'
          ],
          done: 'Erledigt, wenn die Library in zwei Projekten verwendet wird und eine Versionsnummer trägt.',
          tip: 'Semantische Versionierung: Neue Eigenschaft = Minor, umbenannte Eigenschaft = Major. Projekte sollen bewusst aktualisieren.',
          link: brLink('Widget Library', 'visualization/mappview/engineering/customwidgets/lv_widgetlibrary/widgetlibrary.html')
        }
      },
      {
        id: 'o3',
        title: 'Sichere mapp View-Clients und OPC UA ab',
        guide: {
          intro: 'Die B&R Security-Anwenderdokumentation ordnet mapp View in die Referenzarchitektur nach IEC 62443 ein (Level 1 und 2, vertrauenswürdige Zonen). Daraus folgen konkrete Maßnahmen.',
          steps: [
            'Lies die **Security Anwenderdokumentation** von mapp View und notiere die Annahmen zum Einsatzumfeld.',
            'Richte **HTTPS** für die mapp View-Clients ein (B&R-Hilfe „HTTPS Verbindung mit mapp View Clients“).',
            'Ersetze den anonymen OPC UA-Zugang aus dem Getting Started durch Benutzer und Rollen (MpUserX) mit minimalen Rechten.',
            'Segmentiere das Netz: Maschinennetz getrennt vom Büronetz, Fernzugriff nur über ein abgesichertes Gateway/VPN.',
            'Dokumentiere die Maßnahmen als Teil der Betriebsanleitung für den Betreiber.'
          ],
          done: 'Erledigt, wenn HTTPS aktiv ist, kein anonymer Schreibzugriff mehr besteht und eine Maßnahmenliste dokumentiert ist.',
          tip: 'Das Getting Started erlaubt aus Bequemlichkeit anonymen Zugriff. Das ist für ARsim in Ordnung, für eine ausgelieferte Maschine nicht.',
          link: brLink('Security Anwenderdokumentation', 'visualization/mappview/cybersecurity/userdocu.html')
        }
      },
      {
        id: 'o4',
        title: 'Programmiere die Fernzugriffs-Freigabe in ST',
        guide: {
          intro: 'Die Maschinenlogik stellt sicher, dass ein Fernzugriff nur mit Schlüsselschalter und Zustimmung vor Ort wirkt und bei Missbrauch gesperrt wird.',
          steps: [
            'Modelliere die Sitzung als Zustandsautomat (aus, angefragt, aktiv, gesperrt).',
            'Prüfe übergeordnete Bedingungen (Schlüsselschalter, Widerruf) vor dem CASE.',
            'Werte Schreibaufträge über Sequenznummern aus und validiere jeden Wert.',
            'Überwache das Lebenszeichen und zeige den Zustand an der Maschine an.',
            'Löse die Übung.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung grün sind.',
          tip: 'Eine sichtbare Leuchte „Fernzugriff aktiv“ an der Maschine ist eine einfache, sehr wirksame Maßnahme: Niemand vor Ort wird von Fernbewegungen überrascht.'
        }
      }
    ],
    videos: [
      { id: 'eEtrNIRXg8E', title: 'How to... create a compound widget (custom Widget) in B&R mapp View', channel: 'MA-IT MyAutomation - Kennis en Kunde in IA en IT', lang: 'en', why: 'Zeigt Schritt für Schritt die Erstellung eines Compound Widgets.' },
      { id: 'Beg5aEHkqLA', title: 'UI Template for mappView - Dark and light themes in your HMI project', channel: 'AGD LAB', lang: 'en', why: 'Zeigt wiederverwendbare Vorlagen mit umschaltbaren Themes – Grundlage für Widget-Bibliotheken.' }
    ],
    readings: [
      brHelp('Security Anwenderdokumentation (mapp View)', 'visualization/mappview/cybersecurity/userdocu.html', 30, 'Einsatzzweck, Sicherheitskontext nach IEC 62443 und Maßnahmen für mapp View.'),
      brHelp('HTTPS Verbindung mit mapp View Clients', 'visualization/mappview/guides/comissioning/https_connection_ios.html', 15, 'Einrichtung verschlüsselter Verbindungen zwischen Client und mapp View-Server.'),
      { title: 'Fernwartung im industriellen Umfeld (BSI-CS 108)', author: 'Bundesamt für Sicherheit in der Informationstechnik', institution: 'BSI / Allianz für Cyber-Sicherheit', work: 'BSI-Veröffentlichungen zur Cyber-Sicherheit', year: 2018, type: 'Norm/Amtlich', minutes: 30, url: 'https://www.allianz-fuer-cybersicherheit.de/SharedDocs/Downloads/Webs/ACS/DE/BSI-CS/BSI-CS_108.pdf', why: 'Amtliche Empfehlungen zu Architektur, Kommunikation und Organisation von Fernwartungszugängen.', apa: 'Bundesamt für Sicherheit in der Informationstechnik. (2018). *Fernwartung im industriellen Umfeld* (BSI-CS 108, Version 2.0). Allianz für Cyber-Sicherheit. ' + ABGERUFEN + 'https://www.allianz-fuer-cybersicherheit.de/SharedDocs/Downloads/Webs/ACS/DE/BSI-CS/BSI-CS_108.pdf' }
    ],
    quiz: [
      { type: 'single', q: 'Was unterscheidet ein Compound Widget von einem Derived Widget?', options: ['Ein Compound Widget kombiniert mehrere Widgets mit eigener Schnittstelle; ein Derived Widget ist ein vorkonfiguriertes einzelnes Widget', 'Es gibt keinen Unterschied', 'Derived Widgets können keine Bindings haben', 'Compound Widgets laufen nur auf Panel PCs'], correct: 0, explain: 'Derived = Standard-Widget mit Voreinstellungen; Compound = Zusammensetzung mehrerer Widgets.' },
      { type: 'single', q: 'Warum sollte der anonyme OPC UA-Zugang aus dem Getting Started nicht in eine ausgelieferte Maschine gelangen?', options: ['Weil er langsamer ist', 'Weil dann jeder Client im Netz ohne Anmeldung lesen und – je nach Rolle – schreiben kann', 'Weil er nur auf ARsim funktioniert', 'Weil mapp View dann keine Themes lädt'], correct: 1, explain: 'Anonymer Zugriff ist für die Entwicklung bequem, im Feld aber ein Sicherheitsrisiko.' },
      { type: 'multi', q: 'Welche Maßnahmen gehören zu einem abgesicherten Fernzugriff?', options: ['Verschlüsselte Verbindung (HTTPS/VPN)', 'Zustimmung bzw. Freigabe vor Ort', 'Netzsegmentierung', 'Ein gemeinsames Admin-Passwort für alle Techniker'], correct: [0, 1, 2], explain: 'Personengebundene Konten statt Sammelpasswörtern – sonst ist nicht nachvollziehbar, wer zugegriffen hat.' }
    ],
    exam: [
      { type: 'single', q: 'In welche Ebenen der Referenzarchitektur nach IEC 62443 ordnet B&R mapp View ein?', options: ['Level 1 und 2, vertrauenswürdige Zonen', 'Level 4 (Unternehmensnetz)', 'Internet ohne Zonen', 'Level 0 (Feldgeräte)'], correct: 0, explain: 'Laut Security-Anwenderdokumentation befindet sich mapp View in Level 1 und 2 innerhalb vertrauenswürdiger Zonen.' },
      { type: 'single', q: 'Warum zählt die Fernzugriffs-Logik abgewiesene Schreibaufträge und sperrt nach dem dritten?', options: ['Um Speicher zu sparen', 'Fehlbedienung oder Angriff zu begrenzen und den Bediener vor Ort entscheiden zu lassen', 'Weil OPC UA nur drei Fehler erlaubt', 'Um die Performance zu verbessern'], correct: 1, explain: 'Wiederholte ungültige Aufträge sind ein Warnsignal. Die Sperre hebt nur der Bediener vor Ort auf.' },
      { type: 'multi', q: 'Welche Inhalte gehören in eine Widget Library?', options: ['Eigene Derived und Compound Widgets', 'Zugehörige Ressourcen (Bilder, Styles)', 'Eine Versionsnummer', 'Die Rezeptdaten der Maschine'], correct: [0, 1, 2], explain: 'Rezeptdaten sind Laufzeitdaten der Maschine und gehören nicht in eine Widget-Bibliothek.' },
      { type: 'single', q: 'Ein Servicetechniker schreibt per Fernzugriff einen Sollwert, während vor Ort jemand an der Maschine arbeitet. Welche Maßnahme ist am wirksamsten gegen Überraschungen?', options: ['Größere Schrift im Remote-Client', 'Sichtbare Anzeige „Fernzugriff aktiv“ an der Maschine plus Zustimmung vor Ort', 'Schnellere Netzwerkverbindung', 'Kein Logging'], correct: 1, explain: 'Wer vor Ort ist, muss wissen und entscheiden, dass jemand aus der Ferne eingreift.' }
    ],
    exercises: [EX_REMOTE],
    proof: false
  }
];
