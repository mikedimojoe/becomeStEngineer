'use strict';
const { brHelp, brLink, ABGERUFEN } = require('./_util');

// ---------------------------------------------------------------------------
// Level 3 (Senior): Navigation/Dialoge/Event Binding, Benutzer/Sprache/Einheiten,
// Praxisprojekt Alarmsystem
// ---------------------------------------------------------------------------

const TYP_NAV = `TYPE
	NavCmd_typ : STRUCT
		GotoPage : INT; (* angeforderte Seite, 0 = keine Anforderung *)
		Back : BOOL; (* Zurück-Taste *)
		OpenDialog : INT; (* angeforderter Dialog, 0 = keiner *)
		CloseDialog : BOOL;
	END_STRUCT;
	NavPar_typ : STRUCT
		AutoAlarmPage : BOOL; (* bei neuem Alarm automatisch zur Alarmseite *)
	END_STRUCT;
	NavStatus_typ : STRUCT
		ActivePage : INT; (* aktuelle Seite, wird per Eventbinding in einen Seitenwechsel umgesetzt *)
		DialogId : INT; (* offener Dialog, 0 = keiner *)
		HistoryCount : INT; (* Einträge im Zurück-Speicher *)
		LastError : INT; (* 0 ok, 1 unbekannte Seite, 2 nicht im Betrieb erlaubt, 3 Dialog offen, 4 kein Zurück möglich *)
	END_STRUCT;
	NavHmi_typ : STRUCT
		Cmd : NavCmd_typ;
		Par : NavPar_typ;
		Status : NavStatus_typ;
	END_STRUCT;
END_TYPE
`;

const MAIN_NAV_SOL = `PROGRAM _INIT
	gHmi.Status.ActivePage := PAGE_HOME;
	nHistCount := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* 1. Anforderung übernehmen und quittieren *)
	nReq := gHmi.Cmd.GotoPage;
	gHmi.Cmd.GotoPage := 0;
	rtAlarm(CLK := diNewAlarm);
	IF rtAlarm.Q AND gHmi.Par.AutoAlarmPage AND (gHmi.Status.DialogId = 0) THEN
		nReq := PAGE_ALARM;
	END_IF;

	(* 2. Dialoge *)
	IF gHmi.Cmd.CloseDialog THEN
		gHmi.Status.DialogId := 0;
		gHmi.Cmd.CloseDialog := FALSE;
	END_IF;
	IF gHmi.Cmd.OpenDialog <> 0 THEN
		IF gHmi.Status.DialogId = 0 THEN
			gHmi.Status.DialogId := gHmi.Cmd.OpenDialog;
		END_IF;
		gHmi.Cmd.OpenDialog := 0;
	END_IF;

	(* 3. Seitenwechsel prüfen *)
	IF nReq <> 0 THEN
		bValid := (nReq = PAGE_HOME) OR (nReq = PAGE_TREND) OR (nReq = PAGE_ALARM)
			OR (nReq = PAGE_RECIPE) OR (nReq = PAGE_SETUP);
		IF gHmi.Status.DialogId <> 0 THEN
			gHmi.Status.LastError := 3;
		ELSIF NOT bValid THEN
			gHmi.Status.LastError := 1;
		ELSIF (nReq = PAGE_SETUP) AND diRunning THEN
			gHmi.Status.LastError := 2;
		ELSIF nReq <> gHmi.Status.ActivePage THEN
			(* aktuelle Seite in den Zurück-Speicher, ältester Eintrag fällt heraus *)
			IF nHistCount >= 5 THEN
				FOR i := 0 TO 3 DO
					aHistory[i] := aHistory[i + 1];
				END_FOR;
				nHistCount := 4;
			END_IF;
			aHistory[nHistCount] := gHmi.Status.ActivePage;
			nHistCount := nHistCount + 1;
			gHmi.Status.ActivePage := nReq;
			gHmi.Status.LastError := 0;
		ELSE
			gHmi.Status.LastError := 0; (* gleiche Seite: nichts zu tun *)
		END_IF;
	END_IF;

	(* 4. Zurück *)
	IF gHmi.Cmd.Back THEN
		IF gHmi.Status.DialogId <> 0 THEN
			gHmi.Status.LastError := 3;
		ELSIF nHistCount > 0 THEN
			nHistCount := nHistCount - 1;
			gHmi.Status.ActivePage := aHistory[nHistCount];
			gHmi.Status.LastError := 0;
		ELSE
			gHmi.Status.LastError := 4;
		END_IF;
		gHmi.Cmd.Back := FALSE;
	END_IF;

	gHmi.Status.HistoryCount := nHistCount;
END_PROGRAM
`;

const VAR_NAV_START = `VAR CONSTANT
	PAGE_HOME : INT := 10;
	PAGE_TREND : INT := 20;
	PAGE_ALARM : INT := 30;
	PAGE_RECIPE : INT := 40;
	PAGE_SETUP : INT := 60;
END_VAR
VAR
	nReq : INT;
END_VAR
`;

const VAR_NAV_SOL = `VAR CONSTANT
	PAGE_HOME : INT := 10;
	PAGE_TREND : INT := 20;
	PAGE_ALARM : INT := 30;
	PAGE_RECIPE : INT := 40;
	PAGE_SETUP : INT := 60;
END_VAR
VAR
	nReq : INT;
	bValid : BOOL;
	aHistory : ARRAY[0..4] OF INT;
	nHistCount : INT;
	i : INT;
	rtAlarm : R_TRIG;
END_VAR
`;

function goto(p) { return [{ set: { 'gHmi.Cmd.GotoPage': p } }, { cycles: 2 }]; }
const back = [{ set: { 'gHmi.Cmd.Back': true } }, { cycles: 2 }];

const EX_NAV = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Navigationsmanager mit Zurück-Speicher und Dialogsperre',
  task: `In größeren Projekten entscheidet die SPS, ob ein Seitenwechsel erlaubt ist (Betriebszustand, offener Dialog, automatische Alarmseite). Die HMI schreibt eine **Seitenanforderung**, die SPS antwortet mit der **aktiven Seite**; ein Eventbinding in mapp View (Ereignis „ValueChanged“ auf \`Status.ActivePage\` → Aktion *Navigate*) setzt sie um. Die Datentypen sind vorgegeben.

Seiten: 10 Home, 20 Trend, 30 Alarm, 40 Rezept, 60 Setup (Konstanten in \`Variables.var\`).

**Anforderungen**
1. Nach dem Start ist \`Status.ActivePage\` = 10.
2. \`Cmd.GotoPage\` ≠ 0 wird ausgewertet und **immer** auf 0 zurückgesetzt. Unbekannte Seite → keine Änderung, \`LastError\` = 1. Setup (60) bei laufender Maschine (\`diRunning\`) → \`LastError\` = 2. Erfolgreicher Wechsel → \`LastError\` = 0. Anforderung der bereits aktiven Seite ändert nichts.
3. **Zurück-Speicher:** Bei jedem erfolgreichen Wechsel wird die bisherige Seite gespeichert (max. 5 Einträge; bei vollem Speicher fällt der älteste heraus). \`Cmd.Back\` springt zur zuletzt gespeicherten Seite; leerer Speicher → \`LastError\` = 4. \`Status.HistoryCount\` zeigt die Anzahl. \`Cmd.Back\` wird quittiert.
4. **Dialoge:** \`Cmd.OpenDialog\` (≠ 0) öffnet den Dialog nur, wenn keiner offen ist (\`Status.DialogId\`), \`Cmd.CloseDialog\` schließt ihn. Beide werden quittiert. Solange ein Dialog offen ist, werden Seitenwechsel und Zurück abgelehnt (\`LastError\` = 3) – ein modaler Dialog muss zuerst geschlossen werden.
5. **Auto-Alarmseite:** Bei steigender Flanke von \`diNewAlarm\` wird – wenn \`Par.AutoAlarmPage\` TRUE und kein Dialog offen ist – wie bei einer Anforderung auf Seite 30 gewechselt.`,
  hints: [
    'Übernimm Cmd.GotoPage zuerst in eine lokale Variable und setze das Kommando sofort zurück – so geht keine Anforderung verloren und keine wird doppelt ausgeführt.',
    'Den Zurück-Speicher realisierst du als ARRAY[0..4] OF INT plus Zähler (Stack). Beim Überlauf verschiebst du die Elemente mit einer FOR-Schleife um eins nach vorn.',
    'Prüfe in einer IF/ELSIF-Kette in dieser Reihenfolge: Dialog offen, Seite unbekannt, Setup im Betrieb, gleiche Seite.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'NavHmi_typ', dir: 'in', writable: true, label: 'HMI-Schnittstelle Navigation' },
    { name: 'diRunning', type: 'BOOL', dir: 'in', label: 'Maschine läuft', widget: 'switch' },
    { name: 'diNewAlarm', type: 'BOOL', dir: 'in', label: 'Neuer Alarm (Sammelmeldung)', widget: 'button' }
  ],
  files: {
    main: `PROGRAM _INIT
	gHmi.Status.ActivePage := PAGE_HOME;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Prüfungen, Zurück-Speicher, Dialoge, Auto-Alarmseite *)
	IF gHmi.Cmd.GotoPage <> 0 THEN
		gHmi.Status.ActivePage := gHmi.Cmd.GotoPage;
		gHmi.Cmd.GotoPage := 0;
	END_IF;
END_PROGRAM
`,
    var: VAR_NAV_START,
    typ: TYP_NAV
  },
  solution: { main: MAIN_NAV_SOL, var: VAR_NAV_SOL, typ: TYP_NAV },
  tests: [
    { name: 'Gültiger Seitenwechsel und Kommando-Quittierung', steps: [
      { cycles: 2 },
      { expect: 'gHmi.Status.ActivePage = 10', msg: 'Startseite muss Home (10) sein.' },
      ...goto(20),
      { expect: 'gHmi.Status.ActivePage = 20 AND gHmi.Cmd.GotoPage = 0', msg: 'Wechsel auf Trend (20) erwartet, Kommando muss zurückgesetzt sein.' },
      { expect: 'gHmi.Status.HistoryCount = 1' },
      ...goto(20),
      { expect: 'gHmi.Status.HistoryCount = 1', msg: 'Anforderung der aktiven Seite darf keinen Eintrag im Zurück-Speicher erzeugen.' }
    ]},
    { name: 'Unbekannte Seite und Setup im Betrieb werden abgelehnt', steps: [
      ...goto(99),
      { expect: 'gHmi.Status.ActivePage = 10 AND gHmi.Status.LastError = 1', msg: 'Unbekannte Seite: keine Änderung, LastError = 1.' },
      { set: { diRunning: true } }, ...goto(60),
      { expect: 'gHmi.Status.ActivePage = 10 AND gHmi.Status.LastError = 2', msg: 'Setup bei laufender Maschine: LastError = 2.' },
      { set: { diRunning: false } }, ...goto(60),
      { expect: 'gHmi.Status.ActivePage = 60 AND gHmi.Status.LastError = 0', msg: 'Im Stillstand ist Setup erlaubt.' }
    ]},
    { name: 'Zurück-Taste läuft den Verlauf rückwärts', steps: [
      ...goto(20), ...goto(30), ...back,
      { expect: 'gHmi.Status.ActivePage = 20 AND gHmi.Cmd.Back = FALSE', msg: 'Zurück von 30 muss auf 20 führen.' },
      ...back,
      { expect: 'gHmi.Status.ActivePage = 10 AND gHmi.Status.HistoryCount = 0' },
      ...back,
      { expect: 'gHmi.Status.ActivePage = 10 AND gHmi.Status.LastError = 4', msg: 'Leerer Zurück-Speicher: LastError = 4.' }
    ]},
    { name: 'Zurück-Speicher ist auf 5 Einträge begrenzt', steps: [
      ...goto(20), ...goto(30), ...goto(40), ...goto(20), ...goto(30), ...goto(40), ...goto(20),
      { expect: 'gHmi.Status.HistoryCount = 5', msg: 'Der Speicher darf höchstens 5 Einträge haben.' },
      ...back, ...back, ...back, ...back, ...back,
      { expect: 'gHmi.Status.ActivePage = 30 AND gHmi.Status.HistoryCount = 0', msg: 'Nach 5× Zurück muss die älteste gespeicherte Seite (30) aktiv sein – ältere Einträge sind herausgefallen.' }
    ]},
    { name: 'Offener Dialog sperrt die Navigation', steps: [
      { set: { 'gHmi.Cmd.OpenDialog': 7 } }, { cycles: 2 },
      { expect: 'gHmi.Status.DialogId = 7 AND gHmi.Cmd.OpenDialog = 0', msg: 'Dialog 7 muss offen sein, Kommando quittiert.' },
      ...goto(20),
      { expect: 'gHmi.Status.ActivePage = 10 AND gHmi.Status.LastError = 3', msg: 'Bei offenem Dialog muss der Seitenwechsel abgelehnt werden.' },
      { set: { 'gHmi.Cmd.CloseDialog': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.DialogId = 0 AND gHmi.Cmd.CloseDialog = FALSE' },
      ...goto(20),
      { expect: 'gHmi.Status.ActivePage = 20', msg: 'Nach dem Schließen ist Navigation wieder möglich.' }
    ]},
    { name: 'Automatische Alarmseite bei neuem Alarm', steps: [
      { set: { diNewAlarm: true } }, { cycles: 2 }, { set: { diNewAlarm: false } }, { cycles: 2 },
      { expect: 'gHmi.Status.ActivePage = 10', msg: 'Ohne Par.AutoAlarmPage kein automatischer Wechsel.' },
      { set: { 'gHmi.Par.AutoAlarmPage': true, diNewAlarm: true } }, { cycles: 2 },
      { expect: 'gHmi.Status.ActivePage = 30 AND gHmi.Status.HistoryCount = 1', msg: 'Mit Par.AutoAlarmPage muss die Alarmseite (30) aktiv werden.' },
      { cycles: 20 },
      { expect: 'gHmi.Status.HistoryCount = 1', msg: 'Ein dauerhaft anstehendes Signal darf nur einmal (Flanke) wirken.' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const TYP_USER = `TYPE
	UserCmd_typ : STRUCT (* PushButtons: TRUE solange gedrückt *)
		Start : BOOL;
		Stop : BOOL;
		ResetCounter : BOOL;
	END_STRUCT;
	UserPar_typ : STRUCT
		SpeedSet : REAL; (* % - Schreibrecht ab Einrichter *)
		LogoutSec : UINT; (* automatische Abmeldung nach Inaktivität, 0 = aus *)
	END_STRUCT;
	UserStatus_typ : STRUCT
		Level : INT; (* wirksames Level 0..4 *)
		EnStart : BOOL; (* für Widget-Eigenschaft enable *)
		EnParam : BOOL;
		EnReset : BOOL;
		LastDenied : INT; (* 0 keine, 1 Start, 2 Parameter, 3 Reset *)
		StartCount : UDINT;
	END_STRUCT;
	UserHmi_typ : STRUCT
		Cmd : UserCmd_typ;
		Par : UserPar_typ;
		Status : UserStatus_typ;
	END_STRUCT;
END_TYPE
`;

const MAIN_USER_SOL = `PROGRAM _INIT
	gHmi.Par.SpeedSet := 50.0;
	gHmi.Par.LogoutSec := 300;
	rSpeedAccepted := 50.0;
	nLastLogin := 0;
	nLevel := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* 1. Neue Anmeldung erkennen (Level kommt von MpUserX) *)
	bActivity := FALSE;
	IF nLoginLevel <> nLastLogin THEN
		nLastLogin := nLoginLevel;
		nLevel := LIMIT(LVL_NONE, nLoginLevel, LVL_ADMIN);
		bLoggedOut := FALSE;
		bActivity := TRUE;
	END_IF;

	(* 2. Flanken der Tasten *)
	rtStart(CLK := gHmi.Cmd.Start);
	rtStop(CLK := gHmi.Cmd.Stop);
	rtReset(CLK := gHmi.Cmd.ResetCounter);
	IF rtStart.Q OR rtStop.Q OR rtReset.Q THEN
		bActivity := TRUE;
	END_IF;

	(* 3. Start - ab Bediener *)
	IF rtStart.Q THEN
		IF nLevel >= LVL_OPERATOR THEN
			IF NOT bRun THEN
				gHmi.Status.StartCount := gHmi.Status.StartCount + 1;
			END_IF;
			bRun := TRUE;
			gHmi.Status.LastDenied := 0;
		ELSE
			gHmi.Status.LastDenied := 1;
		END_IF;
	END_IF;
	(* Stop - immer erlaubt, auch ohne Anmeldung *)
	IF rtStop.Q THEN
		bRun := FALSE;
	END_IF;

	(* 4. Zähler zurücksetzen - ab Instandhaltung *)
	IF rtReset.Q THEN
		IF nLevel >= LVL_SERVICE THEN
			gHmi.Status.StartCount := 0;
			gHmi.Status.LastDenied := 0;
		ELSE
			gHmi.Status.LastDenied := 3;
		END_IF;
	END_IF;

	(* 5. Parameter - ab Einrichter, sonst zurückschreiben *)
	IF gHmi.Par.SpeedSet <> rSpeedAccepted THEN
		bActivity := TRUE;
		IF nLevel >= LVL_SETTER THEN
			rSpeedAccepted := LIMIT(0.0, gHmi.Par.SpeedSet, 100.0);
			gHmi.Status.LastDenied := 0;
		ELSE
			gHmi.Status.LastDenied := 2;
		END_IF;
		gHmi.Par.SpeedSet := rSpeedAccepted;
	END_IF;

	(* 6. Automatische Abmeldung *)
	tonSec(IN := NOT tonSec.Q AND NOT bActivity, PT := T#1s);
	IF bActivity THEN
		nIdleSec := 0;
	ELSIF tonSec.Q THEN
		nIdleSec := nIdleSec + 1;
	END_IF;
	IF (nLevel > LVL_NONE) AND (gHmi.Par.LogoutSec > 0) AND (nIdleSec >= gHmi.Par.LogoutSec) THEN
		nLevel := LVL_NONE;
		bLoggedOut := TRUE;
	END_IF;
	doLogout := bLoggedOut AND (nLoginLevel <> 0);

	(* 7. Ausgänge und Status *)
	doMotor := bRun;
	gHmi.Status.Level := nLevel;
	gHmi.Status.EnStart := nLevel >= LVL_OPERATOR;
	gHmi.Status.EnParam := nLevel >= LVL_SETTER;
	gHmi.Status.EnReset := nLevel >= LVL_SERVICE;
END_PROGRAM
`;

const VAR_USER_CONST = `VAR CONSTANT
	LVL_NONE : INT := 0;
	LVL_OPERATOR : INT := 1; (* Bediener *)
	LVL_SETTER : INT := 2; (* Einrichter *)
	LVL_SERVICE : INT := 3; (* Instandhaltung *)
	LVL_ADMIN : INT := 4;
END_VAR
`;

function press(btn) { return [{ set: { ['gHmi.Cmd.' + btn]: true } }, { cycles: 2 }, { set: { ['gHmi.Cmd.' + btn]: false } }, { cycles: 2 }]; }

const EX_USER = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Bedienrechte je Benutzerrolle mit Flankenauswertung und Auto-Logout',
  task: `Die Benutzerverwaltung übernimmt in AS6 **mapp UserX** (MpUserX): Anmeldung, Passwörter, Rollen. Die Maschinenlogik muss trotzdem selbst prüfen, ob eine Aktion erlaubt ist – ein manipulierter Client darf nichts auslösen. Hier liefert die (simulierte) Benutzerverwaltung das Level des angemeldeten Benutzers als INT \`nLoginLevel\`: 0 = niemand, 1 = Bediener, 2 = Einrichter, 3 = Instandhaltung, 4 = Admin (Konstanten in \`Variables.var\`).

**Anforderungen**
1. **Flanken:** Die PushButtons \`Cmd.Start\`, \`Cmd.Stop\`, \`Cmd.ResetCounter\` sind TRUE, solange sie gedrückt sind. Jede Taste wirkt nur einmal pro Betätigung (steigende Flanke).
2. **Rechte:** Start ab Level 1. Stop **immer** (auch Level 0). ResetCounter (setzt \`Status.StartCount\` auf 0) ab Level 3. Abgelehnte Aktionen setzen \`Status.LastDenied\` (1 Start, 2 Parameter, 3 Reset), erlaubte setzen es auf 0.
3. \`Status.StartCount\` zählt jeden Start aus dem Stillstand. \`doMotor\` zeigt den Betrieb.
4. **Parameter:** Eine Änderung von \`Par.SpeedSet\` wird nur ab Level 2 übernommen (begrenzt auf 0…100). Sonst schreibt die SPS den letzten gültigen Wert zurück (Startwert 50).
5. **Freigaben für die HMI:** \`Status.EnStart\`, \`Status.EnParam\`, \`Status.EnReset\` (an die Widget-Eigenschaft *enable* gebunden). \`Status.Level\` = wirksames Level.
6. **Auto-Logout:** Jede Aktivität (Tastenflanke, Parameteränderung, neue Anmeldung) setzt einen Inaktivitätszähler zurück. Nach \`Par.LogoutSec\` Sekunden ohne Aktivität (Standard 300, 0 = aus) wird das wirksame Level 0 und \`doLogout\` fordert die Abmeldung bei MpUserX an, bis \`nLoginLevel\` 0 ist oder sich ändert. Eine neue Anmeldung (\`nLoginLevel\` ändert sich) gilt sofort.`,
  hints: [
    'Je Taste ein R_TRIG. Werte Start vor Stop aus, dann gewinnt Stop bei gleichzeitiger Betätigung.',
    'Für den Parameter brauchst du eine Kopie des zuletzt akzeptierten Werts. Weicht gHmi.Par.SpeedSet davon ab, hat jemand geschrieben.',
    'Ein 1-s-Takt: tonSec(IN := NOT tonSec.Q AND NOT bActivity, PT := T#1s). Aktivität startet den Takt neu, damit die Zeit ab der letzten Aktion zählt.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'UserHmi_typ', dir: 'in', writable: true, label: 'HMI-Schnittstelle' },
    { name: 'nLoginLevel', type: 'INT', dir: 'in', label: 'Level aus MpUserX (0–4)', widget: 'slider', min: 0, max: 4 },
    { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Antrieb läuft', widget: 'led' },
    { name: 'doLogout', type: 'BOOL', dir: 'out', label: 'Logout-Anforderung an MpUserXLogin', widget: 'led' }
  ],
  scene: { type: 'motor', bind: { run: 'doMotor' } },
  files: {
    main: `PROGRAM _INIT
	gHmi.Par.SpeedSet := 50.0;
	gHmi.Par.LogoutSec := 300;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Flanken, Rechteprüfung, Parameter, Auto-Logout *)
	IF gHmi.Cmd.Start THEN
		doMotor := TRUE;
	END_IF;
	IF gHmi.Cmd.Stop THEN
		doMotor := FALSE;
	END_IF;
	gHmi.Status.Level := nLoginLevel;
END_PROGRAM
`,
    var: VAR_USER_CONST + `VAR
	nLevel : INT;
END_VAR
`,
    typ: TYP_USER
  },
  solution: {
    main: MAIN_USER_SOL,
    var: VAR_USER_CONST + `VAR
	nLevel : INT;
	nLastLogin : INT;
	bLoggedOut : BOOL;
	bActivity : BOOL;
	bRun : BOOL;
	rtStart : R_TRIG;
	rtStop : R_TRIG;
	rtReset : R_TRIG;
	rSpeedAccepted : REAL;
	tonSec : TON;
	nIdleSec : UINT;
END_VAR
`,
    typ: TYP_USER
  },
  tests: [
    { name: 'Ohne Anmeldung kein Start, Stop immer erlaubt', steps: [
      ...press('Start'),
      { expect: 'NOT doMotor AND gHmi.Status.LastDenied = 1', msg: 'Level 0 darf nicht starten (LastDenied = 1).' },
      { expect: 'NOT gHmi.Status.EnStart' },
      { set: { nLoginLevel: 1 } }, { cycles: 2 },
      ...press('Start'),
      { expect: 'doMotor AND gHmi.Status.StartCount = 1', msg: 'Bediener (Level 1) darf starten.' },
      { set: { nLoginLevel: 0 } }, { cycles: 2 },
      ...press('Stop'),
      { expect: 'NOT doMotor', msg: 'Stop muss auch ohne Anmeldung wirken.' }
    ]},
    { name: 'Tasten wirken nur einmal pro Betätigung', steps: [
      { set: { nLoginLevel: 1, 'gHmi.Cmd.Start': true } }, { cycles: 50 },
      { set: { 'gHmi.Cmd.Start': false } }, { cycles: 2 },
      { expect: 'gHmi.Status.StartCount = 1', msg: 'Gedrückt halten darf nur einen Start zählen.' },
      ...press('Stop'), ...press('Start'),
      { expect: 'gHmi.Status.StartCount = 2 AND doMotor' }
    ]},
    { name: 'Parameter nur ab Einrichter, sonst Rückschreiben', steps: [
      { set: { nLoginLevel: 1 } }, { cycles: 2 },
      { set: { 'gHmi.Par.SpeedSet': 80.0 } }, { cycles: 2 },
      { expect: 'gHmi.Par.SpeedSet = 50.0 AND gHmi.Status.LastDenied = 2', msg: 'Bediener darf den Parameter nicht ändern – die SPS muss 50 zurückschreiben.' },
      { set: { nLoginLevel: 2 } }, { cycles: 2 },
      { set: { 'gHmi.Par.SpeedSet': 80.0 } }, { cycles: 2 },
      { expect: 'gHmi.Par.SpeedSet = 80.0 AND gHmi.Status.EnParam', msg: 'Einrichter darf den Parameter ändern.' },
      { set: { 'gHmi.Par.SpeedSet': 150.0 } }, { cycles: 2 },
      { expect: 'gHmi.Par.SpeedSet = 100.0', msg: 'Der übernommene Wert muss auf 100 begrenzt werden.' }
    ]},
    { name: 'Zähler-Reset erst ab Instandhaltung', steps: [
      { set: { nLoginLevel: 2 } }, { cycles: 2 },
      ...press('Start'), ...press('Stop'),
      ...press('ResetCounter'),
      { expect: 'gHmi.Status.StartCount = 1 AND gHmi.Status.LastDenied = 3', msg: 'Einrichter darf den Zähler nicht löschen.' },
      { set: { nLoginLevel: 3 } }, { cycles: 2 },
      ...press('ResetCounter'),
      { expect: 'gHmi.Status.StartCount = 0 AND gHmi.Status.EnReset', msg: 'Instandhaltung darf den Zähler löschen.' }
    ]},
    { name: 'Automatische Abmeldung nach Inaktivität', steps: [
      { set: { nLoginLevel: 2, 'gHmi.Par.LogoutSec': 2 } }, { cycles: 2 },
      { ms: 1500 },
      { expect: 'gHmi.Status.Level = 2', msg: 'Vor Ablauf der Zeit muss der Benutzer angemeldet bleiben.' },
      ...press('Start'),
      { ms: 1500 },
      { expect: 'gHmi.Status.Level = 2', msg: 'Eine Aktivität muss die Inaktivitätszeit neu starten.' },
      { until: 'gHmi.Status.Level = 0', maxMs: 1500, msg: 'Nach LogoutSec ohne Aktivität muss das Level 0 werden.' },
      { expect: 'doLogout AND NOT gHmi.Status.EnParam', msg: 'doLogout muss die Abmeldung bei MpUserX anfordern.' },
      { expect: 'doMotor', msg: 'Die Abmeldung darf die laufende Maschine nicht stoppen.' },
      { set: { nLoginLevel: 3 } }, { cycles: 2 },
      { expect: 'gHmi.Status.Level = 3 AND NOT doLogout', msg: 'Eine neue Anmeldung gilt sofort.' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const TYP_UNIT = `TYPE
	UnitCmd_typ : STRUCT
		ApplyLength : BOOL; (* Eingabe übernehmen *)
	END_STRUCT;
	UnitPar_typ : STRUCT
		UnitSystem : INT; (* 0 = metrisch, 1 = imperial *)
		LengthInput : REAL; (* Eingabe in Anzeigeeinheit *)
	END_STRUCT;
	UnitStatus_typ : STRUCT
		LengthDisp : REAL; (* Istposition in Anzeigeeinheit *)
		TempDisp : REAL;
		PressDisp : REAL;
		LengthMin : REAL; (* Grenzen in Anzeigeeinheit, für NumericInput minValue/maxValue *)
		LengthMax : REAL;
		LengthUnit : STRING[8];
		TempUnit : STRING[8];
		PressUnit : STRING[8];
		InputError : BOOL;
	END_STRUCT;
	UnitHmi_typ : STRUCT
		Cmd : UnitCmd_typ;
		Par : UnitPar_typ;
		Status : UnitStatus_typ;
	END_STRUCT;
END_TYPE
`;

const MAIN_UNIT_SOL = `PROGRAM _INIT
	rSetMm := 100.0;
	nLastSystem := -1;
END_PROGRAM

PROGRAM _CYCLIC
	(* 1. Einheitensystem bestimmen (ungültig -> metrisch) *)
	bImperial := gHmi.Par.UnitSystem = 1;

	(* 2. Faktoren: Anzeige = SI * k + d *)
	IF bImperial THEN
		rLenFactor := 1.0 / 25.4;
		gHmi.Status.LengthUnit := 'in';
		gHmi.Status.TempUnit := 'degF';
		gHmi.Status.PressUnit := 'psi';
		gHmi.Status.TempDisp := aiTempC * 1.8 + 32.0;
		gHmi.Status.PressDisp := aiPressBar * 14.5038;
	ELSE
		rLenFactor := 1.0;
		gHmi.Status.LengthUnit := 'mm';
		gHmi.Status.TempUnit := 'degC';
		gHmi.Status.PressUnit := 'bar';
		gHmi.Status.TempDisp := aiTempC;
		gHmi.Status.PressDisp := aiPressBar;
	END_IF;
	gHmi.Status.LengthDisp := aiPosMm * rLenFactor;
	gHmi.Status.LengthMin := LEN_MIN_MM * rLenFactor;
	gHmi.Status.LengthMax := LEN_MAX_MM * rLenFactor;

	(* 3. Bei Umschaltung Eingabefeld in neuer Einheit vorbelegen *)
	nSystem := SEL(bImperial, 0, 1);
	IF nSystem <> nLastSystem THEN
		gHmi.Par.LengthInput := rSetMm * rLenFactor;
		nLastSystem := nSystem;
	END_IF;

	(* 4. Eingabe übernehmen: Anzeigeeinheit -> mm, Grenzen in SI prüfen *)
	IF gHmi.Cmd.ApplyLength THEN
		rInMm := gHmi.Par.LengthInput / rLenFactor;
		IF (rInMm >= LEN_MIN_MM - 0.001) AND (rInMm <= LEN_MAX_MM + 0.001) THEN
			rSetMm := LIMIT(LEN_MIN_MM, rInMm, LEN_MAX_MM);
			gHmi.Status.InputError := FALSE;
		ELSE
			gHmi.Status.InputError := TRUE;
			gHmi.Par.LengthInput := rSetMm * rLenFactor;
		END_IF;
		gHmi.Cmd.ApplyLength := FALSE;
	END_IF;

	aoSetMm := rSetMm;
END_PROGRAM
`;

const VAR_UNIT_CONST = `VAR CONSTANT
	LEN_MIN_MM : REAL := 10.0;
	LEN_MAX_MM : REAL := 500.0;
END_VAR
`;

const EX_UNIT = {
  id: 'ex2', type: 'st', variant: 'schreiben',
  title: 'Einheitenumrechnung metrisch/imperial für Anzeige und Eingabe',
  task: `Maschinen für den US-Markt brauchen Zoll, °F und psi. **Intern rechnet die SPS immer in SI-Einheiten** (mm, °C, bar); nur die Schnittstelle zur HMI wird umgerechnet. (mapp View kann Einheiten über OPC UA EngineeringUnits auch selbst umrechnen – hier baust du die Logik zum Verständnis und für Fälle ohne Unit-Konfiguration selbst.)

**Anforderungen**
1. \`Par.UnitSystem\`: 0 = metrisch, 1 = imperial; jeder andere Wert wird wie metrisch behandelt.
2. **Anzeige:** \`Status.LengthDisp\` aus \`aiPosMm\` (Zoll = mm / 25,4), \`Status.TempDisp\` aus \`aiTempC\` (°F = °C × 1,8 + 32), \`Status.PressDisp\` aus \`aiPressBar\` (psi = bar × 14,5038).
3. **Einheitentexte:** \`Status.LengthUnit\` 'mm'/'in', \`Status.TempUnit\` 'degC'/'degF', \`Status.PressUnit\` 'bar'/'psi'.
4. **Grenzen:** Der Sollwert ist auf 10…500 mm begrenzt. \`Status.LengthMin\`/\`LengthMax\` liefern diese Grenzen in Anzeigeeinheit (für minValue/maxValue des NumericInput).
5. **Eingabe:** \`Cmd.ApplyLength\` übernimmt \`Par.LengthInput\` (Anzeigeeinheit) als Sollwert \`aoSetMm\` (mm). Liegt der umgerechnete Wert außerhalb 10…500 mm, bleibt der Sollwert unverändert, \`Status.InputError\` wird TRUE und das Eingabefeld zeigt wieder den gültigen Sollwert. Gültige Eingabe → \`InputError\` FALSE. Das Kommando wird quittiert. Startwert: 100 mm.
6. **Umschaltung:** Ändert sich das Einheitensystem (und einmal nach dem Start), schreibt die SPS den aktuellen Sollwert in der neuen Einheit in \`Par.LengthInput\`.`,
  hints: [
    'Arbeite mit einem Faktor rLenFactor (1.0 oder 1/25.4). Dann gilt: Anzeige = mm * Faktor, mm = Eingabe / Faktor.',
    'Grenzen immer in SI prüfen, nicht in der Anzeigeeinheit – sonst hast du zwei Wahrheiten.',
    'Merke dir das zuletzt verwendete Einheitensystem und initialisiere es in _INIT mit -1, dann wird das Eingabefeld beim Start einmal vorbelegt.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'UnitHmi_typ', dir: 'in', writable: true, label: 'HMI-Schnittstelle Einheiten' },
    { name: 'aiPosMm', type: 'REAL', dir: 'in', label: 'Istposition', widget: 'slider', min: 0, max: 600, unit: 'mm', init: 254 },
    { name: 'aiTempC', type: 'REAL', dir: 'in', label: 'Temperatur', widget: 'slider', min: -20, max: 200, unit: '°C', init: 100 },
    { name: 'aiPressBar', type: 'REAL', dir: 'in', label: 'Druck', widget: 'slider', min: 0, max: 10, unit: 'bar', init: 2 },
    { name: 'aoSetMm', type: 'REAL', dir: 'out', label: 'Sollposition', widget: 'value', unit: 'mm' }
  ],
  files: {
    main: `PROGRAM _INIT
	rSetMm := 100.0;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Umrechnung, Einheitentexte, Grenzen, Eingabe, Umschaltung *)
	gHmi.Status.LengthDisp := aiPosMm;
	gHmi.Status.TempDisp := aiTempC;
	gHmi.Status.PressDisp := aiPressBar;
	aoSetMm := rSetMm;
END_PROGRAM
`,
    var: VAR_UNIT_CONST + `VAR
	rSetMm : REAL;
END_VAR
`,
    typ: TYP_UNIT
  },
  solution: {
    main: MAIN_UNIT_SOL,
    var: VAR_UNIT_CONST + `VAR
	rSetMm : REAL;
	rInMm : REAL;
	rLenFactor : REAL;
	bImperial : BOOL;
	nSystem : INT;
	nLastSystem : INT;
END_VAR
`,
    typ: TYP_UNIT
  },
  tests: [
    { name: 'Metrische Anzeige und Vorbelegung', steps: [
      { cycles: 2 },
      { expect: 'ABS(gHmi.Status.LengthDisp - 254.0) < 0.01 AND gHmi.Status.LengthUnit = \'mm\'', msg: 'Metrisch: Anzeige in mm.' },
      { expect: 'ABS(gHmi.Par.LengthInput - 100.0) < 0.01', msg: 'Nach dem Start muss das Eingabefeld den Sollwert 100 mm zeigen.' },
      { expect: 'gHmi.Status.TempUnit = \'degC\' AND ABS(gHmi.Status.TempDisp - 100.0) < 0.01' }
    ]},
    { name: 'Imperiale Anzeige', steps: [
      { set: { 'gHmi.Par.UnitSystem': 1 } }, { cycles: 2 },
      { expect: 'ABS(gHmi.Status.LengthDisp - 10.0) < 0.001 AND gHmi.Status.LengthUnit = \'in\'', msg: '254 mm = 10 in.' },
      { expect: 'ABS(gHmi.Status.TempDisp - 212.0) < 0.01 AND gHmi.Status.TempUnit = \'degF\'', msg: '100 °C = 212 °F.' },
      { expect: 'ABS(gHmi.Status.PressDisp - 29.0076) < 0.01 AND gHmi.Status.PressUnit = \'psi\'', msg: '2 bar = 29,0076 psi.' },
      { expect: 'ABS(gHmi.Status.LengthMax - 19.685) < 0.01 AND ABS(gHmi.Status.LengthMin - 0.3937) < 0.001', msg: 'Grenzen 10…500 mm in Zoll erwartet.' }
    ]},
    { name: 'Umschaltung belegt das Eingabefeld in neuer Einheit', steps: [
      { cycles: 2 },
      { set: { 'gHmi.Par.UnitSystem': 1 } }, { cycles: 2 },
      { expect: 'ABS(gHmi.Par.LengthInput - 3.937) < 0.01', msg: '100 mm müssen als 3,937 in im Eingabefeld stehen.' },
      { set: { 'gHmi.Par.UnitSystem': 7 } }, { cycles: 2 },
      { expect: 'gHmi.Status.LengthUnit = \'mm\' AND ABS(gHmi.Par.LengthInput - 100.0) < 0.01', msg: 'Ungültiges Einheitensystem wird wie metrisch behandelt.' }
    ]},
    { name: 'Eingabe in Zoll wird als mm übernommen', steps: [
      { set: { 'gHmi.Par.UnitSystem': 1 } }, { cycles: 2 },
      { set: { 'gHmi.Par.LengthInput': 5.0, 'gHmi.Cmd.ApplyLength': true } }, { cycles: 2 },
      { expect: 'ABS(aoSetMm - 127.0) < 0.01 AND NOT gHmi.Status.InputError', msg: '5 in = 127 mm.' },
      { expect: 'gHmi.Cmd.ApplyLength = FALSE', msg: 'Das Kommando muss quittiert werden.' }
    ]},
    { name: 'Ungültige Eingabe wird abgewiesen', steps: [
      { cycles: 2 },
      { set: { 'gHmi.Par.LengthInput': 600.0, 'gHmi.Cmd.ApplyLength': true } }, { cycles: 2 },
      { expect: 'ABS(aoSetMm - 100.0) < 0.01 AND gHmi.Status.InputError', msg: '600 mm liegt außerhalb – Sollwert bleibt 100 mm, InputError TRUE.' },
      { expect: 'ABS(gHmi.Par.LengthInput - 100.0) < 0.01', msg: 'Das Eingabefeld muss den gültigen Sollwert zurückbekommen.' },
      { set: { 'gHmi.Par.UnitSystem': 1 } }, { cycles: 2 },
      { set: { 'gHmi.Par.LengthInput': 0.2, 'gHmi.Cmd.ApplyLength': true } }, { cycles: 2 },
      { expect: 'ABS(aoSetMm - 100.0) < 0.01 AND gHmi.Status.InputError', msg: '0,2 in = 5,08 mm liegt unter 10 mm und muss abgewiesen werden.' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const TYP_TANK = `TYPE
	AlarmEntry_typ : STRUCT
		Name : STRING[32]; (* Name des Alarms in der MpAlarmXList-Konfiguration *)
		Cause : BOOL; (* Ursache steht an *)
		Active : BOOL; (* Alarm ist in MpAlarmX gesetzt *)
		Unack : BOOL; (* noch nicht quittiert *)
	END_STRUCT;
	TankCmd_typ : STRUCT
		Start : BOOL;
		Stop : BOOL;
		AckAll : BOOL; (* Sammelquittierung *)
	END_STRUCT;
	TankPar_typ : STRUCT
		LevelSet : REAL; (* Füllstand Ende Befüllen in % *)
		TempSet : REAL; (* Temperatur Ende Heizen in °C *)
	END_STRUCT;
	TankStatus_typ : STRUCT
		State : INT; (* 0 Bereit, 10 Befüllen, 20 Heizen, 90 Störung *)
		ActiveCount : INT; (* anstehende Alarme *)
		UnackCount : INT; (* unquittierte Alarme *)
	END_STRUCT;
	TankHmi_typ : STRUCT
		Cmd : TankCmd_typ;
		Par : TankPar_typ;
		Status : TankStatus_typ;
	END_STRUCT;
END_TYPE
`;

const MAIN_TANK_START = `PROGRAM _INIT
	gHmi.Par.LevelSet := 80.0;
	gHmi.Par.TempSet := 60.0;
	(* TODO: Alarmnamen eintragen: TempHigh, Overflow, InletNoFlow *)
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := gHmi.Cmd.Start);
	gHmi.Cmd.Start := FALSE;

	(* TODO: Ursachen erkennen, MpAlarmXSet/Reset, Quittierung, Zähler, Störzustand *)

	CASE nState OF
		ST_IDLE:
			IF rtStart.Q THEN
				nState := ST_FILL;
			END_IF;
		ST_FILL:
			IF aiLevel >= gHmi.Par.LevelSet THEN
				nState := ST_HEAT;
			END_IF;
		ST_HEAT:
			IF aiTemp >= gHmi.Par.TempSet THEN
				nState := ST_IDLE;
			END_IF;
	END_CASE;

	doInlet := nState = ST_FILL;
	doHeater := nState = ST_HEAT;
	gHmi.Status.State := nState;
END_PROGRAM
`;

const MAIN_TANK_SOL = `PROGRAM _INIT
	gHmi.Par.LevelSet := 80.0;
	gHmi.Par.TempSet := 60.0;
	aAlarm[0].Name := 'TempHigh';
	aAlarm[1].Name := 'Overflow';
	aAlarm[2].Name := 'InletNoFlow';
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := gHmi.Cmd.Start);
	gHmi.Cmd.Start := FALSE;

	(* 1. Ursachen *)
	aAlarm[0].Cause := aiTemp > TEMP_MAX;
	aAlarm[1].Cause := diLsHigh;
	(* Zulaufüberwachung: Ventil offen, aber Füllstand steigt 3 s lang nicht um 1 % *)
	rtInlet(CLK := doInlet);
	IF rtInlet.Q THEN
		rLevelAtOpen := aiLevel;
	END_IF;
	tonFlow(IN := doInlet AND (aiLevel < rLevelAtOpen + 1.0), PT := T#3s);
	aAlarm[2].Cause := tonFlow.Q;

	(* 2. Alarme setzen/zurücksetzen (MpAlarmX) und quittieren *)
	nActive := 0;
	nUnack := 0;
	FOR i := 0 TO 2 DO
		IF aAlarm[i].Cause AND NOT aAlarm[i].Active THEN
			aAlarm[i].Active := TRUE;
			aAlarm[i].Unack := TRUE;
			MpAlarmXSet(gAlarmXCore, aAlarm[i].Name);
		ELSIF NOT aAlarm[i].Cause AND aAlarm[i].Active THEN
			aAlarm[i].Active := FALSE;
			MpAlarmXReset(gAlarmXCore, aAlarm[i].Name);
		END_IF;
		IF gHmi.Cmd.AckAll THEN
			aAlarm[i].Unack := FALSE;
		END_IF;
		IF aAlarm[i].Active THEN
			nActive := nActive + 1;
		END_IF;
		IF aAlarm[i].Unack THEN
			nUnack := nUnack + 1;
		END_IF;
	END_FOR;
	gHmi.Cmd.AckAll := FALSE;

	(* 3. Alarmreaktion: jeder anstehende Alarm führt in den Störzustand *)
	IF (nActive > 0) AND (nState <> ST_ERROR) THEN
		nState := ST_ERROR;
	END_IF;
	IF gHmi.Cmd.Stop THEN
		IF nState <> ST_ERROR THEN
			nState := ST_IDLE;
		END_IF;
		gHmi.Cmd.Stop := FALSE;
	END_IF;

	(* 4. Ablauf *)
	CASE nState OF
		ST_IDLE:
			IF rtStart.Q AND (nActive = 0) AND (nUnack = 0) THEN
				nState := ST_FILL;
			END_IF;
		ST_FILL:
			IF aiLevel >= gHmi.Par.LevelSet THEN
				nState := ST_HEAT;
			END_IF;
		ST_HEAT:
			IF aiTemp >= gHmi.Par.TempSet THEN
				nState := ST_IDLE;
			END_IF;
		ST_ERROR:
			(* erst verlassen, wenn alle Ursachen weg UND alles quittiert *)
			IF (nActive = 0) AND (nUnack = 0) THEN
				nState := ST_IDLE;
			END_IF;
	END_CASE;

	(* 5. Ausgänge und Status *)
	doInlet := nState = ST_FILL;
	doHeater := nState = ST_HEAT;
	gHmi.Status.State := nState;
	gHmi.Status.ActiveCount := nActive;
	gHmi.Status.UnackCount := nUnack;
END_PROGRAM
`;

const VAR_TANK_CONST = `VAR CONSTANT
	ST_IDLE : INT := 0;
	ST_FILL : INT := 10;
	ST_HEAT : INT := 20;
	ST_ERROR : INT := 90;
	TEMP_MAX : REAL := 90.0;
END_VAR
`;

const EX_TANK = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Alarmsystem für einen Heiztank mit MpAlarmX',
  task: `Ein Tank wird befüllt und aufgeheizt. Der Ablauf (Bereit → Befüllen → Heizen → Bereit) ist vorhanden. Erweitere ihn um ein **Alarmsystem**, das mit **mapp AlarmX** zusammenarbeitet. In der Simulation sind die Bausteine vereinfacht: \`MpAlarmXSet(gAlarmXCore, Name)\` setzt den benutzerdefinierten Alarm *Name* aus der MpAlarmXList-Konfiguration, \`MpAlarmXReset(gAlarmXCore, Name)\` setzt ihn zurück (Ursache weg). Angezeigt und quittiert wird in mapp View im **AlarmList**-Widget; hier spiegelst du den Zustand zusätzlich in einem Array von Strukturen, damit die Maschinenlogik darauf reagieren kann.

**Alarme** (\`aAlarm : ARRAY[0..2] OF AlarmEntry_typ\`, Typ vorgegeben):
| Index | Name | Ursache |
|---|---|---|
| 0 | TempHigh | \`aiTemp\` > 90 °C |
| 1 | Overflow | Überlauf-Grenzschalter \`diLsHigh\` |
| 2 | InletNoFlow | Zulaufventil 3 s offen, aber Füllstand ist seit dem Öffnen nicht um 1 % gestiegen |

**Anforderungen**
1. Steigende Ursache → Alarm **einmal** mit \`MpAlarmXSet\` setzen, \`Active\` und \`Unack\` TRUE. Ursache weg → \`MpAlarmXReset\`, \`Active\` FALSE (\`Unack\` bleibt bis zur Quittierung).
2. \`Cmd.AckAll\` quittiert alle Alarme (\`Unack\` FALSE) und wird zurückgesetzt.
3. \`Status.ActiveCount\` / \`Status.UnackCount\` zählen anstehende bzw. unquittierte Alarme.
4. **Alarmreaktion:** Jeder anstehende Alarm führt sofort in den Zustand 90 (Störung): Zulauf und Heizung aus.
5. Der Störzustand wird erst verlassen (→ 0 Bereit), wenn **keine Ursache mehr ansteht und alles quittiert ist**. Ein Neustart braucht danach ein neues \`Cmd.Start\`; in Bereit wird ein Start nur angenommen, wenn nichts ansteht oder unquittiert ist.
6. \`Cmd.Stop\` beendet Befüllen/Heizen (→ 0), aber nicht den Störzustand, und wird zurückgesetzt.`,
  hints: [
    'Arbeite die Alarme in einer FOR-Schleife über das Array ab – so ist ein vierter Alarm nur noch ein Eintrag mehr.',
    'Für die Zulaufüberwachung merkst du dir den Füllstand bei der steigenden Flanke von doInlet und lässt einen TON laufen, solange doInlet AND (aiLevel < Startwert + 1.0).',
    'Reihenfolge im Zyklus: Ursachen → Alarme/Quittierung/Zähler → Übergang in Störung → CASE-Ablauf → Ausgänge.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'TankHmi_typ', dir: 'in', writable: true, label: 'HMI-Schnittstelle Tank' },
    { name: 'gAlarmXCore', type: 'MpComIdentType', dir: 'in', label: 'MpLink der MpAlarmXCore-Konfiguration' },
    { name: 'aiLevel', type: 'REAL', dir: 'in', label: 'Füllstand', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'aiTemp', type: 'REAL', dir: 'in', label: 'Temperatur', widget: 'gauge', min: 0, max: 120, unit: '°C' },
    { name: 'diLsHigh', type: 'BOOL', dir: 'in', label: 'Überlauf-Grenzschalter' },
    { name: 'diValveStuck', type: 'BOOL', dir: 'in', label: 'Simulation: Zulaufventil klemmt', widget: 'switch' },
    { name: 'doInlet', type: 'BOOL', dir: 'out', label: 'Zulaufventil Y1', widget: 'led' },
    { name: 'doHeater', type: 'BOOL', dir: 'out', label: 'Heizung E1', widget: 'led' }
  ],
  scene: { type: 'tank', bind: { level: 'aiLevel', inlet: 'doInlet', heater: 'doHeater', temp: 'aiTemp', lsHigh: 'diLsHigh' } },
  plant: {
    var: `VAR
	rLevel : REAL;
	rTemp : REAL := 20.0;
END_VAR
`,
    code: `IF doInlet AND NOT diValveStuck THEN
	rLevel := rLevel + 20.0 * PLANT_DT;
END_IF;
rLevel := LIMIT(0.0, rLevel, 100.0);
IF doHeater THEN
	rTemp := rTemp + 10.0 * PLANT_DT;
ELSIF rTemp > 20.0 THEN
	rTemp := rTemp - 1.0 * PLANT_DT;
END_IF;
aiLevel := rLevel;
aiTemp := rTemp;
diLsHigh := rLevel >= 98.0;
`
  },
  files: {
    main: MAIN_TANK_START,
    var: VAR_TANK_CONST + `VAR
	nState : INT;
	rtStart : R_TRIG;
END_VAR
`,
    typ: TYP_TANK
  },
  solution: {
    main: MAIN_TANK_SOL,
    var: VAR_TANK_CONST + `VAR
	nState : INT;
	rtStart : R_TRIG;
	rtInlet : R_TRIG;
	tonFlow : TON;
	rLevelAtOpen : REAL;
	aAlarm : ARRAY[0..2] OF AlarmEntry_typ;
	i : INT;
	nActive : INT;
	nUnack : INT;
END_VAR
`,
    typ: TYP_TANK
  },
  tests: [
    { name: 'Normaler Ablauf ohne Alarm', steps: [
      { set: { 'gHmi.Cmd.Start': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.State = 10 AND doInlet', msg: 'Start muss das Befüllen starten.' },
      { until: 'gHmi.Status.State = 20', maxMs: 6000, msg: 'Bei 80 % muss das Heizen beginnen.' },
      { expect: 'doHeater AND NOT doInlet' },
      { until: 'gHmi.Status.State = 0', maxMs: 8000, msg: 'Bei 60 °C muss der Ablauf enden.' },
      { expect: 'gHmi.Status.ActiveCount = 0 AND gHmi.Status.UnackCount = 0', msg: 'Im Normalablauf darf kein Alarm auftreten.' }
    ]},
    { name: 'Übertemperatur: Störung, Abkühlen, Quittieren', steps: [
      { set: { 'gHmi.Par.TempSet': 120.0, 'gHmi.Cmd.Start': true } }, { cycles: 2 },
      { until: 'gHmi.Status.State = 90', maxMs: 15000, msg: 'Über 90 °C muss der Störzustand (90) folgen.' },
      { expect: 'NOT doHeater AND gHmi.Status.UnackCount = 1', msg: 'Heizung aus, ein unquittierter Alarm.' },
      { until: 'gHmi.Status.ActiveCount = 0', maxMs: 5000, msg: 'Nach dem Abkühlen muss die Ursache verschwinden.' },
      { cycles: 5 },
      { expect: 'gHmi.Status.State = 90 AND gHmi.Status.UnackCount = 1', msg: 'Ohne Quittierung muss die Störung bestehen bleiben.' },
      { set: { 'gHmi.Cmd.AckAll': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.State = 0 AND gHmi.Status.UnackCount = 0 AND gHmi.Cmd.AckAll = FALSE', msg: 'Nach dem Quittieren: Bereit, keine unquittierten Alarme, Kommando zurückgesetzt.' }
    ]},
    { name: 'Überlauf stoppt den Zulauf', steps: [
      { set: { 'gHmi.Par.LevelSet': 100.0, 'gHmi.Cmd.Start': true } }, { cycles: 2 },
      { until: 'gHmi.Status.State = 90', maxMs: 8000, msg: 'Der Überlauf-Grenzschalter muss eine Störung auslösen.' },
      { expect: 'NOT doInlet AND gHmi.Status.ActiveCount = 1', msg: 'Zulauf aus, Overflow steht an.' },
      { set: { 'gHmi.Cmd.AckAll': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.State = 90', msg: 'Quittieren allein reicht nicht, solange die Ursache ansteht.' }
    ]},
    { name: 'Zulaufüberwachung erkennt klemmendes Ventil', steps: [
      { set: { diValveStuck: true, 'gHmi.Cmd.Start': true } }, { cycles: 2 },
      { ms: 2500 },
      { expect: 'gHmi.Status.State = 10 AND doInlet', msg: 'Die Überwachungszeit beträgt 3 s – nicht früher auslösen.' },
      { until: 'gHmi.Status.State = 90', maxMs: 1500, msg: 'Nach 3 s ohne Füllstandsanstieg muss InletNoFlow auslösen.' },
      { cycles: 3 },
      { expect: 'NOT doInlet AND gHmi.Status.ActiveCount = 0 AND gHmi.Status.UnackCount = 1', msg: 'Ventil zu → Ursache weg, Alarm bleibt unquittiert.' },
      { set: { 'gHmi.Cmd.Start': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.State = 90', msg: 'Start darf eine unquittierte Störung nicht übergehen.' },
      { set: { 'gHmi.Cmd.AckAll': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.State = 0' }
    ]},
    { name: 'Stop beendet das Befüllen', steps: [
      { set: { 'gHmi.Cmd.Start': true } }, { ms: 500 },
      { set: { 'gHmi.Cmd.Stop': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.State = 0 AND NOT doInlet AND gHmi.Cmd.Stop = FALSE', msg: 'Stop muss das Befüllen beenden und quittiert werden.' }
    ]}
  ]
};

module.exports = [
  {
    id: 'hmi-3-navigation',
    level: 3,
    kind: 'lektion',
    title: 'Navigation, Dialoge und Event Binding',
    summary: 'Du strukturierst die Bedienung über Navigation, Dialoge und Eventbindings und baust einen Navigationsmanager als Zustandsautomat in ST.',
    minutes: 180,
    req: ['hmi-2-projekt-bedienpanel'],
    briefing: 'Sobald eine HMI mehr als zwei Seiten hat, brauchst du ein Navigationskonzept: Navigation-Widgets für die feste Menüleiste, Dialoge für Rückfragen und Detaileingaben, und Eventbindings, die Ereignisse (Klick, Wertänderung, Login) mit Aktionen (Navigate, OpenDialog, Variable schreiben) verbinden. Manche Navigationsentscheidungen gehören in die SPS: Darf die Setup-Seite im Betrieb geöffnet werden? Soll bei einem neuen Alarm automatisch die Alarmseite erscheinen? Du lernst beide Seiten und baust einen Navigationsmanager mit Zurück-Speicher.',
    practice: 'An einer Verpackungsmaschine bedient ein Schichtführer zehn bis dreißig Seiten. Ohne klares Navigationskonzept suchen Bediener Funktionen, öffnen im Betrieb Einrichtseiten oder übersehen Alarme, weil sie gerade auf einer Unterseite sind.',
    transfer: {
      tia: 'In WinCC Unified entsprechen Eventbindings den Ereignissen eines Objekts mit Systemfunktionen (z. B. „Bildwechsel“, „Popup öffnen“); Bildwechsel aus der SPS sind über die Bereichszeiger bzw. Skripte möglich.',
      codesys: 'In der CODESYS-Visualisierung werden Eingabekonfigurationen (OnMouseClick › „Visualisierung wechseln“) verwendet; ein SPS-gesteuerter Bildwechsel geht über die Variable CurrentVisu.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Baue eine Menüleiste mit dem Navigation-Widget',
        guide: {
          intro: 'mapp View bietet ein Navigation-Widget mit NavigationButtons, das automatisch aus einer Navigationsdatei (.navigation) befüllt werden kann. So bleibt die Menüleiste auf allen Seiten gleich.',
          steps: [
            'Füge im mapp View-Package der Configuration View eine **Navigation** (.navigation) hinzu und trage deine Pages der 1. Ebene ein (Home, Trend, Alarm, Rezept, Setup).',
            'Referenziere die Navigation in der Visualisierung (.vis).',
            'Lege im Navigations-Content ein **Navigation**-Widget an und verbinde es mit der Navigationsdatei.',
            'Prüfe im Browser, dass der aktive Menüpunkt markiert ist und sich die Leiste beim Seitenwechsel nicht neu aufbaut (gemeinsamer Content).',
            'Ergänze einen **Zurück**-Button (siehe B&R-FAQ „Zurück Button (Navigation)“).'
          ],
          done: 'Erledigt, wenn alle Hauptseiten über die Menüleiste erreichbar sind und der aktive Eintrag hervorgehoben ist.',
          tip: 'Halte die Reihenfolge der Menüpunkte über alle Maschinen einer Produktfamilie gleich – Bediener navigieren nach Position, nicht nach Text.',
          link: brLink('Automatische Navigation (.navigation)', 'visualization/mappview/engineering/organization/filetypes/navigation.html')
        }
      },
      {
        id: 'o2',
        title: 'Verbinde Ereignisse und Aktionen im Eventbinding',
        guide: {
          intro: 'Ein Eventbinding verknüpft ein Ereignis mit einer oder mehreren Aktionen. Es wird als .eventbinding-Datei im mapp View-Package gespeichert und muss in der .vis referenziert sein.',
          steps: [
            'Markiere im Content-Editor einen Button und öffne im Eigenschaftsfenster bei **Events** das Ereignis **Click** im Eventbinding-Editor.',
            'Wähle als Aktion **OpenDialog** und gib die ID eines Dialogs an (Dialog vorher über **Dialog einfügen** anlegen).',
            'Lege ein zweites Eventbinding an: Ereignis **ValueChanged** einer OPC UA-Variable (z. B. `gHmi.Status.ActivePage`) → Aktion **Navigate** zur passenden Page. Für mehrere Seiten nutzt du je Wert eine Bedingung.',
            'Prüfe, dass die EventBindingSet-Id in der Visualisierung (.vis) referenziert ist – sonst wird die Datei ignoriert.',
            'Teste im Browser: Klick öffnet den Dialog, eine Wertänderung in der SPS (Watch) wechselt die Seite.'
          ],
          done: 'Erledigt, wenn ein Button einen Dialog öffnet und ein Wertwechsel in der SPS einen Seitenwechsel auslöst.',
          tip: 'Eventbindings, die auf Prozesswerte reagieren, laufen für jeden Client. Bei drei angemeldeten Clients wechseln alle drei die Seite – plane das bewusst (Session-Variablen sind clientlokal).',
          link: brLink('Eventbinding (.eventbinding)', 'visualization/mappview/engineering/organization/filetypes/eventbinding.html')
        }
      },
      {
        id: 'o3',
        title: 'Setze Dialoge für Rückfragen und Detaileingaben ein',
        guide: {
          intro: 'Dialoge bündeln Detaileingaben, ohne die Seite zu verlassen. Ein modaler Dialog sperrt die Seite dahinter, bis er geschlossen ist.',
          steps: [
            'Füge im mapp View-Package einen **Dialog** ein und lege darin einen Content mit Eingabefeldern und den Buttons „Übernehmen“ / „Abbrechen“ an.',
            'Konfiguriere den Dialog als modal, damit die darunterliegende Seite nicht bedienbar ist.',
            'Verbinde „Übernehmen“ per Eventbinding mit zwei Aktionen nacheinander: Wert schreiben, dann **CloseDialog**.',
            'Verwende für sicherheitskritische Rückfragen („Achse referenzieren?“) eine MessageBox mit klarer Ja/Nein-Formulierung.',
            'Prüfe Steuerbarkeit: Jeder Dialog muss ohne Änderung abbrechbar sein.'
          ],
          done: 'Erledigt, wenn ein modaler Dialog Werte übernimmt bzw. ohne Änderung abbricht.',
          tip: 'Beschrifte Buttons mit dem Ergebnis („Rezept speichern“) statt mit „OK“ – das ist selbstbeschreibend und verhindert Fehlbedienung.',
          link: brLink('OpenDialog (Aktion)', 'visualization/mappview/engineering/eventaction/cv_actions/cv_actions_clientsystem/opendialog.html')
        }
      },
      {
        id: 'o4',
        title: 'Programmiere einen Navigationsmanager in ST',
        guide: {
          intro: 'Die SPS prüft Seitenanforderungen gegen den Maschinenzustand, führt einen Zurück-Speicher und erzwingt die Alarmseite bei neuen Alarmen.',
          steps: [
            'Lege die Seitennummern als Konstanten an (10, 20, 30, 40, 60) – dieselben Nummern stehen im Eventbinding.',
            'Übernimm die Anforderung in eine lokale Variable und quittiere das Kommando sofort.',
            'Prüfe in fester Reihenfolge: Dialog offen → Seite bekannt → im Betrieb erlaubt → gleiche Seite.',
            'Realisiere den Zurück-Speicher als ARRAY mit Zähler (Stack) und Überlaufbehandlung.',
            'Löse die Übung und prüfe alle Tests.'
          ],
          code: { lang: 'st', text: 'IF nHistCount >= 5 THEN\n\tFOR i := 0 TO 3 DO\n\t\taHistory[i] := aHistory[i + 1];\n\tEND_FOR;\n\tnHistCount := 4;\nEND_IF;' },
          done: 'Erledigt, wenn alle Tests der Übung grün sind.',
          tip: 'Fehlercodes statt stiller Ablehnung: Der Bediener soll erfahren, warum die Seite nicht aufgeht (Text über das Text System).'
        }
      }
    ],
    videos: [
      { id: 'VNHR9bXDHTQ', title: 'How to.... B&R mapp View Content carousel and Flyout widgets', channel: 'MA-IT MyAutomation - Kennis en Kunde in IA en IT', lang: 'en', why: 'Zeigt Flyout und ContentCarousel als Alternativen zu Seitenwechseln für Menüs und Detailansichten.' },
      { id: '45AhSkV81Oc', title: 'B&R Visualization: MappView', channel: 'Phi Huynh', lang: 'en', why: 'Überblick über Aufbau und Bedienung einer mapp View-Visualisierung mit mehreren Seiten.' },
      { id: 'ZD7Bth87jjk', title: 'Steuerbarkeit - Dialogprinzipen', channel: 'Indra Burkart', lang: 'de', why: 'Erklärt den Grundsatz Steuerbarkeit – zentral für Dialoge, Abbrechen und Zurück.' }
    ],
    readings: [
      brHelp('Eventbinding (.eventbinding)', 'visualization/mappview/engineering/organization/filetypes/eventbinding.html', 15, 'Definition, XML-Aufbau und Referenzierung von Eventbindings.'),
      brHelp('Dialog einfügen', 'visualization/mappview/engineering/dialog/adddialog.html', 15, 'Zeigt, wie Dialoge im mapp View-Package angelegt werden.'),
      brHelp('Style Guide: Bildnavigation', 'visualization/visuguide/styleguide/style_navigation.html', 15, 'B&R-Vorschlag für Navigationsebenen und Bildnummern einer Maschinen-HMI.', 'Automation Help – Visualisierung')
    ],
    quiz: [
      { type: 'single', q: 'Ein neu angelegtes Eventbinding wird zur Laufzeit ignoriert. Was prüfst du zuerst?', options: ['Ob der Browser JavaScript erlaubt', 'Ob die EventBindingSet-Id in der Visualisierung (.vis) referenziert ist', 'Ob der Button eine Breite größer 100 px hat', 'Ob der OPC UA Server auf Port 81 läuft'], correct: 1, explain: 'Laut B&R-Hilfe muss das EventBindingSet in der .vis referenziert sein, damit die Datei berücksichtigt wird.' },
      { type: 'single', q: 'Warum übernimmt der Navigationsmanager Cmd.GotoPage in eine lokale Variable und setzt das Kommando sofort zurück?', options: ['Weil INT-Variablen nicht verglichen werden können.', 'Damit jede Anforderung genau einmal ausgewertet wird, auch wenn sie abgelehnt wird.', 'Weil mapp View sonst die Seite zweimal öffnet.', 'Weil OPC UA nur einmal pro Sekunde schreibt.'], correct: 1, explain: 'Das Rücksetzen quittiert die Anforderung. Bliebe sie stehen, würde eine abgelehnte Anforderung in jedem Zyklus erneut ausgewertet.' },
      { type: 'multi', q: 'Welche Gründe sprechen dafür, einen Seitenwechsel in der SPS zu prüfen statt nur in der HMI?', options: ['Der Maschinenzustand (z. B. „läuft“) ist in der SPS bekannt.', 'Mehrere Clients sehen dieselbe Regel.', 'Ein manipulierter Client kann die Regel nicht umgehen, wenn die SPS die Daten der Seite schützt.', 'Die SPS rendert die Seiten schneller als der Browser.'], correct: [0, 1, 2], explain: 'Logik gehört an eine Stelle mit Zugriff auf den Maschinenzustand. Gerendert wird immer im Client.' }
    ],
    exam: [
      { type: 'single', q: 'Welche Datenstruktur eignet sich für einen Zurück-Speicher der letzten Seiten?', options: ['Ein Stack (ARRAY + Zähler, zuletzt rein – zuerst raus)', 'Ein einzelnes INT', 'Ein STRING mit allen Seitennamen', 'Ein TON-Baustein'], correct: 0, explain: 'Zurück springt zur zuletzt gespeicherten Seite – das ist LIFO, also ein Stack.' },
      { type: 'single', q: 'Eine Seitenanforderung der aktuell aktiven Seite kommt an. Was ist das sinnvolle Verhalten?', options: ['Seite erneut in den Zurück-Speicher legen', 'Nichts ändern, keinen Eintrag erzeugen', 'Fehler „unbekannte Seite“ melden', 'Zur Startseite wechseln'], correct: 1, explain: 'Sonst füllt sich der Zurück-Speicher mit Duplikaten, und Zurück scheint „nicht zu funktionieren“.' },
      { type: 'multi', q: 'Welche Elemente gehören zu einem Eventbinding in mapp View?', options: ['Ereignis (z. B. Click, ValueChanged)', 'Aktion (z. B. Navigate, OpenDialog)', 'Optional Bedingungen bzw. mehrere Aktionen nacheinander', 'Die IP-Adresse des Clients'], correct: [0, 1, 2], explain: 'Ein Eventbinding verbindet Ereignisse mit Aktionen, ggf. mit Bedingungen und Aktionsfolgen. Die Client-IP ist kein Bestandteil.' },
      { type: 'single', q: 'Warum sollte ein modaler Dialog Seitenwechsel sperren?', options: ['Damit halb eingegebene Daten nicht unbemerkt verloren gehen oder in falschem Kontext übernommen werden', 'Weil Dialoge nur auf der Startseite funktionieren', 'Weil sonst der OPC UA Server abstürzt', 'Weil das die Performance verbessert'], correct: 0, explain: 'Ein Dialog ist ein abgeschlossener Bedienvorgang. Er wird übernommen oder abgebrochen, bevor die Navigation weitergeht.' }
    ],
    exercises: [EX_NAV],
    proof: false
  },

  {
    id: 'hmi-3-benutzer-sprache',
    level: 3,
    kind: 'lektion',
    title: 'Benutzerverwaltung, Mehrsprachigkeit und Einheiten',
    summary: 'Du richtest Rollen und Rechte mit mapp UserX ein, machst die HMI mehrsprachig und rechnest Einheiten sauber zwischen SI und Anzeige um.',
    minutes: 210,
    req: ['hmi-3-navigation'],
    briefing: 'Nicht jeder darf alles: Bediener starten und stoppen, Einrichter ändern Parameter, die Instandhaltung setzt Zähler zurück. mapp UserX (MpUserX) verwaltet Benutzer, Passwörter und Rollen; mapp View deaktiviert Widgets automatisch, wenn die Rolle kein Schreibrecht auf die OPC UA-Variable hat. Die Maschinenlogik prüft trotzdem selbst. Außerdem lernst du das Text System für Mehrsprachigkeit (LanguageSelector) und die saubere Trennung von SI-Werten in der SPS und Anzeigeeinheiten in der HMI.',
    practice: 'Exportmaschinen werden in fünf Sprachen und mit imperialen Einheiten ausgeliefert. Audits (z. B. in der Pharmaindustrie) verlangen, dass jede Parameteränderung einem angemeldeten Benutzer mit passender Rolle zugeordnet werden kann.',
    transfer: {
      tia: 'In TIA Portal entspricht das der Benutzerverwaltung (User Management Component, Rollen/Funktionsrechte), dem Projekttextsystem mit Sprachumschaltung und den Einheiten in WinCC Unified.',
      codesys: 'CODESYS bietet die Visualisierungs-Benutzerverwaltung (Gruppen/Rechte je Element), Textlisten für Mehrsprachigkeit und Einheitenumrechnung über die Bibliothek bzw. eigene Funktionen.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Richte Rollen und Rechte mit mapp UserX ein',
        guide: {
          intro: 'Rollen werden im Benutzerrollensystem von AS6 definiert und mit MpUserX verwaltet. OPC UA-Rechte je Rolle steuern, welche Variablen eine Rolle lesen bzw. schreiben darf.',
          steps: [
            'Füge in der Configuration View die **MpUserX**-Konfiguration ein und lege im Benutzerrollensystem die Rollen „Operator“, „Setter“, „Service“ und „Admin“ an.',
            'Lege Testbenutzer an und weise ihnen Rollen zu.',
            'Vergib im OPC UA Default View (`OpcUaMap.uad`) Rechte je Rolle: z. B. Schreibrecht auf `gHmi.Par` erst ab „Setter“.',
            'Platziere ein **Login**-Widget im Kopfbereich und teste: Ohne Schreibrecht werden NumericInputs im Disabled-Zustand dargestellt.',
            'Ordne jeder Rolle ein Level (INT) zu, das die SPS für ihre eigene Rechteprüfung nutzt (z. B. über MpUserX bzw. ein Mapping in deinem Programm).'
          ],
          done: 'Erledigt, wenn ein Bediener-Login Parameterfelder deaktiviert und ein Einrichter-Login sie freigibt.',
          tip: 'Rechte doppelt prüfen: HMI-Rechte verbessern die Bedienung, SPS-Rechte schützen die Maschine. Ein Browser-Client kann manipuliert werden, die SPS-Logik nicht.',
          link: brLink('mapp UserX: Benutzerverwaltung', 'services/mapp_services/mpuserx/mpuserx.html')
        }
      },
      {
        id: 'o2',
        title: 'Programmiere die Rechteprüfung und den Auto-Logout in ST',
        guide: {
          intro: 'Tasten werden flankengesteuert ausgewertet und gegen das Level geprüft; Parameteränderungen ohne Recht werden zurückgeschrieben.',
          steps: [
            'Lege die Level als Konstanten an (0 bis 4).',
            'Werte jede Taste mit einem R_TRIG aus und prüfe das Level vor der Ausführung.',
            'Erkenne Parameteränderungen über den Vergleich mit dem zuletzt akzeptierten Wert.',
            'Zähle die Inaktivität in Sekunden und fordere nach Ablauf die Abmeldung an.',
            'Löse Übung 1.'
          ],
          done: 'Erledigt, wenn alle Tests von Übung 1 grün sind.',
          tip: 'Stop ist immer erlaubt. Eine Rechteprüfung, die das Anhalten einer Maschine verhindert, ist ein Sicherheitsproblem.'
        }
      },
      {
        id: 'o3',
        title: 'Mache die HMI mehrsprachig mit dem Text System',
        guide: {
          intro: 'Alle Texte (Labels, Meldungen, Alarmtexte) kommen aus dem Text System. Welche Sprachen zur Laufzeit verfügbar sind, legst du in der Textsystem-Konfiguration fest.',
          steps: [
            'Öffne in der Configuration View den Knoten **Textsystem** und lege die Sprachen `de` und `en` an.',
            'Lege eine Textdatei (.tmx) mit Text-IDs an, z. B. `Msg.Lift.1` = „Endlage oben erreicht“ / „Upper end position reached“.',
            'Ersetze feste Label-Texte durch Text-IDs (Eigenschaft `text` mit Verweis auf das Text System).',
            'Platziere ein **LanguageSelector**-Widget in der Kopfzeile; es wird automatisch mit allen verfügbaren Sprachen befüllt.',
            'Teste die Umschaltung und achte auf abgeschnittene Texte (Englisch ist oft kürzer, andere Sprachen deutlich länger).'
          ],
          done: 'Erledigt, wenn alle Texte einer Seite beim Sprachwechsel umschalten und keiner abgeschnitten ist.',
          tip: 'Plane Widgets für ca. 30 % längere Texte als im Deutschen – oder prüfe mit der längsten Zielsprache.',
          link: brLink('Sprachumschaltung', 'visualization/mappview/engineering/textsystem/languagechange.html')
        }
      },
      {
        id: 'o4',
        title: 'Trenne SI-Werte und Anzeigeeinheiten',
        guide: {
          intro: 'Die SPS rechnet intern in SI-Einheiten. Umgerechnet wird nur an der Schnittstelle – entweder über die Einheiten von OPC UA/mapp View oder in einer klar abgegrenzten ST-Schicht.',
          steps: [
            'Lege für jede physikalische Größe die SI-Einheit fest und dokumentiere sie im Variablenkommentar.',
            'Informiere dich in der B&R-Hilfe über das Unit-Verhalten zwischen OPC UA-Variablen und Widgets.',
            'Rechne Anzeige und Eingabe mit einem Faktor um und prüfe Grenzen immer in SI.',
            'Löse Übung 2 und teste die Umschaltung metrisch/imperial.'
          ],
          done: 'Erledigt, wenn alle Tests von Übung 2 grün sind.',
          tip: 'Eine Temperatur-Umrechnung hat einen Offset (+32). Für Temperaturdifferenzen (z. B. Hysterese) gilt nur der Faktor 1,8 – ein klassischer Fehler.',
          link: brLink('Unit Verhalten OPC UA – Widget', 'visualization/mappview/engineering/variablesanddata/opcua_variables/widget_unitbehavior.html')
        }
      }
    ],
    videos: [
      { id: 'XJxwKo7PZRI', title: 'mapp UserX 1 - creating a user management system [sub: EN, DE, JA, PL]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Offizielles B&R-Tutorial zum Aufbau einer Benutzerverwaltung mit mapp UserX (deutsche Untertitel).' },
      { id: 'i40L0Yfbvkc', title: 'mapp UserX Framework Tutorial', channel: 'B&R Industrial Automation', lang: 'en', why: 'Zeigt das vorgefertigte UserX-Modul des mapp Frameworks inklusive mapp View-Seiten.' },
      { id: 'GsBk6G42Uvs', title: 'Unit management in mapp [sub: EN, DE, PL]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Erklärt die Einheitenverwaltung in mapp Technology.' }
    ],
    readings: [
      brHelp('Rollen und Rechte (OPC UA-Variablen)', 'visualization/mappview/engineering/variablesanddata/opcua_variables/roleandrights.html', 15, 'Wie Rollen und OPC UA-Rechte das Verhalten von Widgets bestimmen.'),
      brHelp('Sprachumschaltung', 'visualization/mappview/engineering/textsystem/languagechange.html', 10, 'LanguageSelector-Widget und Konfiguration der Laufzeitsprachen.'),
      { title: 'mapp Framework – UserX', author: 'B&R Community', institution: 'B&R Industrial Automation (Community-Projekt)', work: 'mapp Framework Dokumentation', year: 'o. J.', type: 'Dokumentation', minutes: 20, url: 'https://br-automation-community.github.io/mapp-Framework/', why: 'Vorgefertigte, quelloffene Module (u. a. UserX, AlarmX, Recipe) mit mapp View-Seiten als Referenzarchitektur.', apa: 'B&R Community. (o. J.). *mapp Framework*. B&R Industrial Automation. ' + ABGERUFEN + 'https://br-automation-community.github.io/mapp-Framework/' }
    ],
    quiz: [
      { type: 'single', q: 'Ein Bediener ohne Schreibrecht auf gHmi.Par.SpeedSet sieht das NumericInput. Wie stellt mapp View es dar?', options: ['Es ist unsichtbar.', 'Im Disabled-Zustand, eine Eingabe ist nicht möglich.', 'Normal; die SPS bekommt den Wert trotzdem.', 'Es zeigt eine Fehlermeldung „Access denied“.'], correct: 1, explain: 'Laut B&R-Hilfe werden eingabefähige Widgets ohne Schreibrecht im Disabled-Zustand angezeigt; abgewiesene Schreibaufträge landen im Logbuch.' },
      { type: 'numeric', q: 'Ein Sollwert von {mm} mm soll in Zoll angezeigt werden. Welcher Wert erscheint?', params: { mm: [10, 500, 5] }, formula: 'mm / 25.4', unit: 'in', tol: 0.01, explain: '1 in = 25,4 mm, also Zoll = mm / 25,4.' },
      { type: 'single', q: 'Warum muss Stop auch ohne Anmeldung (Level 0) wirken?', options: ['Weil Stop keinen OPC UA-Zugriff braucht.', 'Weil das Anhalten einer Maschine nie durch eine Rechteprüfung verhindert werden darf.', 'Weil MpUserX Stop automatisch erlaubt.', 'Weil Level 0 der Admin ist.'], correct: 1, explain: 'Rechte schützen vor unbefugtem Starten und Ändern – nicht vor dem Anhalten.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine Temperatur von {c} °C soll in °F angezeigt werden. Welcher Wert erscheint?', params: { c: [-20, 200, 5] }, formula: 'c * 1.8 + 32', unit: '°F', tol: 0.01, explain: '°F = °C × 1,8 + 32.' },
      { type: 'single', q: 'Eine Hysterese von 5 K soll in Fahrenheit angezeigt werden. Wie rechnest du?', options: ['5 × 1,8 + 32 = 41 °F', '5 × 1,8 = 9 °F (nur Faktor, kein Offset)', '5 / 1,8 = 2,78 °F', '5 + 32 = 37 °F'], correct: 1, explain: 'Für Differenzen entfällt der Nullpunkt-Offset; nur der Faktor 1,8 gilt.' },
      { type: 'multi', q: 'Was zählt in der Übung als Aktivität, die den Auto-Logout-Zähler zurücksetzt?', options: ['Steigende Flanke einer Taste', 'Änderung eines Parameters', 'Neue Anmeldung', 'Laufen der Maschine'], correct: [0, 1, 2], explain: 'Nur Bedienhandlungen zählen. Eine laufende Maschine ist keine Bedienung – sonst würde nie abgemeldet.' },
      { type: 'single', q: 'Wo werden die zur Laufzeit verfügbaren Sprachen einer mapp View-HMI festgelegt?', options: ['Im LanguageSelector-Widget', 'In der Textsystem-Konfiguration der Configuration View', 'Im Browser', 'In der OPC UA Default View'], correct: 1, explain: 'Der LanguageSelector zeigt automatisch die Sprachen, die in der Textsystem-Konfiguration definiert sind.' },
      { type: 'single', q: 'Ein Bediener schreibt per manipuliertem Client einen neuen Parameter, obwohl seine Rolle das nicht darf und die OPC UA-Rechte falsch konfiguriert sind. Was verhindert die Übernahme?', options: ['Nichts', 'Die Rechteprüfung in der SPS, die den letzten gültigen Wert zurückschreibt', 'Der LanguageSelector', 'Das Theme'], correct: 1, explain: 'Defense in depth: Die SPS prüft unabhängig von der HMI. Das ist die letzte Verteidigungslinie.' }
    ],
    exercises: [EX_USER, EX_UNIT],
    proof: false
  },

  {
    id: 'hmi-3-projekt-alarme',
    level: 3,
    kind: 'projekt',
    title: 'Praxisprojekt: Alarmsystem mit mapp AlarmX',
    summary: 'Du konfigurierst Alarme mit MpAlarmX, zeigst sie im AlarmList-Widget an und verknüpfst Alarmursachen, Quittierung und Störzustand einer Tankanlage.',
    minutes: 300,
    req: ['hmi-3-navigation', 'hmi-3-benutzer-sprache'],
    briefing: 'Alarme sind der wichtigste Kanal zwischen Maschine und Bediener. mapp AlarmX (MpAlarmX) verwaltet Alarmdefinitionen (MpAlarmXList), Zustände (aktiv, quittiert, bestätigt), Historie und die Anbindung an das AlarmList-Widget. Die Maschinenlogik liefert die Ursachen, setzt Alarme mit MpAlarmXSet und setzt sie mit MpAlarmXReset zurück. In diesem Projekt baust du eine vollständige Maschinenfunktion: Ablauf als Zustandsautomat, Alarmerkennung inklusive Überwachungszeit, Alarmreaktion und eine saubere Regel für das Verlassen des Störzustands.',
    practice: 'Schlechte Alarmkonzepte erzeugen Alarmfluten – hunderte Meldungen, von denen keine beachtet wird. Normen wie ISA-18.2 / IEC 62682 beschreiben Alarm-Management als Lebenszyklus: jeder Alarm braucht eine Ursache, eine Bedeutung und eine Bedienerreaktion.',
    transfer: {
      tia: 'In TIA Portal entsprechen MpAlarmX-Benutzeralarme den ProDiag- bzw. Bitmeldungen/Program_Alarm mit Meldeklassen und Quittierpflicht; die Anzeige erfolgt im Meldefenster/Alarm Control.',
      codesys: 'CODESYS nutzt die Alarmkonfiguration mit Alarmgruppen und -klassen; angezeigt wird in der Alarmtabelle der Visualisierung.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Konfiguriere MpAlarmXCore und eine Alarmliste',
        guide: {
          intro: 'Die Alarmdefinitionen liegen in einer MpAlarmXList-Konfiguration, die in der MpAlarmXCore-Konfiguration verlinkt wird. Jeder Alarm hat Name, Text, Schwere und Verhalten (z. B. Quittier- und Bestätigungspflicht).',
          steps: [
            'Füge in der Configuration View die mapp-Komponente **MpAlarmXCore** ein (Name z. B. `gAlarmXCore`).',
            'Füge eine **MpAlarmXList**-Konfiguration ein und lege die Alarme `TempHigh`, `Overflow` und `InletNoFlow` an; vergib Text-IDs für mehrsprachige Alarmtexte.',
            'Lege für jeden Alarm die Schwere (Severity) und das Verhalten fest, z. B. „Confirm = Required“ für Alarme, deren Behebung bestätigt werden muss.',
            'Verlinke die Liste in der MpAlarmXCore-Konfiguration unter **Alarm list**.',
            'Dokumentiere je Alarm: Ursache, Konsequenz, Bedienerreaktion (Alarm-Rationalisierung).'
          ],
          done: 'Erledigt, wenn drei Alarme mit Text, Schwere und Verhalten konfiguriert und im Core verlinkt sind.',
          tip: 'Ein Alarm ohne definierte Bedienerreaktion ist eine Information, keine Alarmmeldung. Solche Einträge gehören in ein Ereignisprotokoll.',
          link: brLink('Alarm quittieren und bestätigen (Anwendungsfall)', 'services/mapp_services/mpalarmx/usecase/anwendungsfall_12/anwendungsfall_12.html')
        }
      },
      {
        id: 'o2',
        title: 'Zeige Alarme im AlarmList-Widget an und quittiere sie',
        guide: {
          intro: 'Das AlarmList-Widget zeigt die Alarme des Cores. Quittiert wird über Buttons, die die Aktionen „Acknowledge“ bzw. „Confirm“ des Widgets auslösen.',
          steps: [
            'Lege auf der Alarmseite ein **AlarmList**-Widget an und binde dessen MpLink an `gAlarmXCore` (mapp Link Binding).',
            'Füge Buttons „Quittieren“ und „Alle quittieren“ hinzu und verbinde ihren Click per Eventbinding mit den Widget-Aktionen der AlarmList.',
            'Zeige in der Kopfzeile einen Sammelalarm-Indikator, gebunden an `gHmi.Status.UnackCount` (Style je nach Wert).',
            'Teste mit dem MpAlarmXCore-Baustein bzw. im Watch, ob gesetzte Alarme in der Liste erscheinen.'
          ],
          done: 'Erledigt, wenn ein gesetzter Alarm in der AlarmList erscheint und über einen Button quittiert werden kann.',
          tip: 'Zeigt die AlarmList nichts an, hilft die mapp View-Diagnoseseite „Aktive Bindings“, um das MpLink-Binding zu prüfen.',
          link: brLink('AlarmList', 'visualization/mappview/widgets/data/alarmlist/widgets/alarmlist.html')
        }
      },
      {
        id: 'o3',
        title: 'Verknüpfe Alarmursachen, MpAlarmXSet/Reset und den Störzustand',
        guide: {
          intro: 'Die SPS erkennt Ursachen, setzt und löscht Alarme und reagiert mit einem Störzustand, der erst bei behobener Ursache und Quittierung verlassen wird.',
          steps: [
            'Lege ein `ARRAY[0..2] OF AlarmEntry_typ` an und trage in `_INIT` die Alarmnamen ein – exakt wie in der MpAlarmXList.',
            'Berechne die Ursachen; für InletNoFlow eine Überwachungszeit mit TON.',
            'Setze Alarme nur bei steigender Ursache (`MpAlarmXSet`) und setze sie bei fallender Ursache zurück (`MpAlarmXReset`).',
            'Ergänze den Zustand 90 im CASE: Eintritt bei jedem anstehenden Alarm, Austritt nur bei „nichts aktiv UND nichts unquittiert“.',
            'Löse die Übung und prüfe alle Tests.'
          ],
          code: { lang: 'st', text: 'IF aAlarm[i].Cause AND NOT aAlarm[i].Active THEN\n\taAlarm[i].Active := TRUE;\n\taAlarm[i].Unack := TRUE;\n\tMpAlarmXSet(gAlarmXCore, aAlarm[i].Name);\nEND_IF;' },
          done: 'Erledigt, wenn alle Tests der Übung grün sind.',
          tip: 'MpAlarmXSet in jedem Zyklus aufzurufen ist ein typischer Fehler – setze nur bei Flanke. Der Name muss exakt zur Konfiguration passen, sonst meldet MpAlarmX einen Fehler.',
          link: brLink('MpAlarmXSet', 'services/mapp_services/mpalarmx/lib/fb/mpalarmxset/mc_x.html')
        }
      },
      {
        id: 'o4',
        title: 'Weise das Ergebnis nach',
        guide: {
          intro: 'Als Nachweis reichst du dein Repository mit Projekt, Alarmliste und Screenshots ein.',
          steps: [
            'Exportiere die Alarmrationalisierung (Tabelle Alarm – Ursache – Konsequenz – Reaktion – Schwere) als Markdown ins Repository.',
            'Füge Screenshots der AlarmList mit aktivem, quittiertem und gelöschtem Alarm hinzu.',
            'Committe den Stand mit einer aussagekräftigen Nachricht (z. B. `feat: Alarmsystem Tank mit MpAlarmX`).',
            'Reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Link eingereicht ist und Alarmtabelle, Screenshots und Code enthält.',
          tip: 'Lass einen Kollegen ohne Vorwissen die Alarmtexte lesen: Versteht er, was zu tun ist? Wenn nicht, ist der Text zu technisch.'
        }
      }
    ],
    videos: [
      { id: 'faf7QmFy1s8', title: 'mapp AlarmX 1 – How to set up an alarm management [sub: EN, DE, PL, PT-BR, RU]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Offizielles B&R-Tutorial zum Aufbau eines Alarm-Managements mit mapp AlarmX.' },
      { id: 'JD0DjRO_WA8', title: 'mapp AlarmX 5 - Visualizing alarms in mapp View [sub: EN, DE, PL, RU]', channel: 'B&R Industrial Automation', lang: 'en', why: 'Zeigt die Anbindung von mapp AlarmX an das AlarmList-Widget in mapp View.' },
      { id: '9xzOPi0nzro', title: 'ISA 18.2  - Setting a new Standard in Alarm Management', channel: 'exida', lang: 'en', why: 'Einordnung des Alarm-Managements als Lebenszyklus nach ISA-18.2.' }
    ],
    readings: [
      brHelp('MpAlarmXSet', 'services/mapp_services/mpalarmx/lib/fb/mpalarmxset/mc_x.html', 10, 'Schnittstelle der Funktion: MpLink, Name, Rückgabe der Instanz-ID.', 'Automation Help – mapp Services 6'),
      brHelp('Alarm quittieren und bestätigen', 'services/mapp_services/mpalarmx/usecase/anwendungsfall_12/anwendungsfall_12.html', 20, 'B&R-Anwendungsfall mit MpAlarmXList, AlarmList-Widget und Buttons für Acknowledge/Confirm.', 'Automation Help – mapp Services 6'),
      { title: 'ISA-18 Series of Standards', author: 'International Society of Automation', institution: 'International Society of Automation (ISA)', work: 'ISA Standards', year: 'o. J.', type: 'Norm/Amtlich', minutes: 10, url: 'https://www.isa.org/standards-and-publications/isa-standards/isa-18-series-of-standards', why: 'Überblick über ISA-18.2 (Management of Alarm Systems) – Norm nur referenziert.', apa: 'International Society of Automation. (o. J.). *ISA-18 series of standards*. ' + ABGERUFEN + 'https://www.isa.org/standards-and-publications/isa-standards/isa-18-series-of-standards' }
    ],
    quiz: [
      { type: 'single', q: 'Wann ruft die Maschinenlogik MpAlarmXSet für einen benutzerdefinierten Alarm auf?', options: ['In jedem Zyklus, solange die Ursache ansteht', 'Einmal bei steigender Ursache (Flanke)', 'Nur beim Quittieren', 'Beim Start der Steuerung für alle Alarme'], correct: 1, explain: 'Der Alarm wird einmal gesetzt; danach verwaltet MpAlarmX seinen Zustand. Ursache weg → MpAlarmXReset.' },
      { type: 'single', q: 'Wann darf der Störzustand im Projekt verlassen werden?', options: ['Sobald der Bediener quittiert', 'Sobald die Ursache weg ist', 'Erst wenn keine Ursache mehr ansteht UND alle Alarme quittiert sind', 'Nach 10 Sekunden'], correct: 2, explain: 'Beides ist nötig: behobene Ursache (technisch) und Quittierung (Bediener hat es wahrgenommen).' },
      { type: 'multi', q: 'Was gehört zur Rationalisierung eines Alarms?', options: ['Ursache', 'Konsequenz bei Nichtbeachtung', 'Erwartete Bedienerreaktion', 'Lieblingsfarbe des Programmierers'], correct: [0, 1, 2], explain: 'Ein Alarm ohne Reaktion ist keine Alarmmeldung. Die Rationalisierung verhindert Alarmfluten.' }
    ],
    exam: [
      { type: 'single', q: 'Warum braucht die Zulaufüberwachung (InletNoFlow) eine Überwachungszeit?', options: ['Weil Ventile und Füllstand träge reagieren; sofortiges Auslösen würde Fehlalarme erzeugen', 'Weil MpAlarmX nur alle 3 s schreiben kann', 'Weil die HMI langsamer ist', 'Weil TON-Bausteine Pflicht sind'], correct: 0, explain: 'Diskrepanzüberwachungen brauchen eine Zeit, die größer als die normale Reaktionszeit des Prozesses ist.' },
      { type: 'single', q: 'Welche Konfiguration muss in MpAlarmXCore verlinkt sein, damit benutzerdefinierte Alarme bekannt sind?', options: ['MpAlarmXList', 'OpcUaMap.uad', 'Textsystem', 'MpUserX'], correct: 0, explain: 'Die Alarmdefinitionen stehen in der MpAlarmXList, die in der MpAlarmXCore-Konfiguration unter „Alarm list“ verlinkt wird.' },
      { type: 'multi', q: 'Welche Maßnahmen beugen einer Alarmflut vor?', options: ['Folgealarme unterdrücken, wenn eine Hauptursache bereits ansteht', 'Für jeden Alarm eine Bedienerreaktion festlegen', 'Informationen ohne Handlungsbedarf als Ereignis statt Alarm protokollieren', 'Jeden Sensorzustand als Alarm melden'], correct: [0, 1, 2], explain: 'Weniger, aber aussagekräftige Alarme. Jeder Sensorzustand als Alarm ist die Ursache von Alarmfluten.' },
      { type: 'single', q: 'Ein Alarm wurde quittiert, die Ursache steht aber noch an. Was zeigt die Maschine im Projekt?', options: ['Bereit', 'Weiterhin Störzustand, Alarm aktiv aber quittiert', 'Automatischen Neustart', 'Keinen Alarm mehr'], correct: 1, explain: 'Quittieren bestätigt die Wahrnehmung, behebt aber nicht die Ursache.' }
    ],
    exercises: [EX_TANK],
    proof: true,
    badge: 'Alarmsystem-Entwickler'
  }
];
