'use strict';
const { brHelp, brLink, ABGERUFEN } = require('./_util');

// ---------------------------------------------------------------------------
// Level 2 (Junior): mapp View Grundlagen, Bedienkonzept, Praxisprojekt Bedienpanel
// ---------------------------------------------------------------------------

const TYP_CONV = `TYPE
	ConvCmd_typ : STRUCT (* Kommandos HMI -> SPS (PushButton, Binding "Write only") *)
		Start : BOOL;
		Stop : BOOL;
		ResetCount : BOOL;
	END_STRUCT;
	ConvPar_typ : STRUCT (* Parameter HMI -> SPS (NumericInput, Binding "Read / Write") *)
		SpeedSet : REAL; (* Sollgeschwindigkeit in % *)
	END_STRUCT;
	ConvStatus_typ : STRUCT (* Status SPS -> HMI (Binding "Read only") *)
		Running : BOOL;
		(* TODO: SpeedAct : REAL; PartCount : UDINT; ergänzen *)
	END_STRUCT;
	ConvHmi_typ : STRUCT
		Cmd : ConvCmd_typ;
		Par : ConvPar_typ;
		Status : ConvStatus_typ;
	END_STRUCT;
END_TYPE
`;

const TYP_CONV_SOL = `TYPE
	ConvCmd_typ : STRUCT (* Kommandos HMI -> SPS (PushButton, Binding "Write only") *)
		Start : BOOL;
		Stop : BOOL;
		ResetCount : BOOL;
	END_STRUCT;
	ConvPar_typ : STRUCT (* Parameter HMI -> SPS (NumericInput, Binding "Read / Write") *)
		SpeedSet : REAL; (* Sollgeschwindigkeit in % *)
	END_STRUCT;
	ConvStatus_typ : STRUCT (* Status SPS -> HMI (Binding "Read only") *)
		Running : BOOL;
		SpeedAct : REAL; (* ausgegebene Geschwindigkeit in % *)
		PartCount : UDINT; (* gezählte Teile *)
	END_STRUCT;
	ConvHmi_typ : STRUCT
		Cmd : ConvCmd_typ;
		Par : ConvPar_typ;
		Status : ConvStatus_typ;
	END_STRUCT;
END_TYPE
`;

const MAIN_CONV_SOL = `PROGRAM _INIT
	gHmi.Par.SpeedSet := 50.0;
END_PROGRAM

PROGRAM _CYCLIC
	(* 1. Kommandos auswerten - Stop hat Vorrang *)
	IF gHmi.Cmd.Start AND NOT gHmi.Cmd.Stop THEN
		bRun := TRUE;
	END_IF;
	IF gHmi.Cmd.Stop THEN
		bRun := FALSE;
	END_IF;
	(* Kommandos quittieren: SPS setzt sie nach der Auswertung zurück *)
	gHmi.Cmd.Start := FALSE;
	gHmi.Cmd.Stop := FALSE;

	(* 2. Parameter plausibilisieren *)
	rSpeed := LIMIT(0.0, gHmi.Par.SpeedSet, 100.0);

	(* 3. Ausgänge *)
	doMotor := bRun;
	IF bRun THEN
		aoSpeed := rSpeed;
	ELSE
		aoSpeed := 0.0;
	END_IF;

	(* 4. Teilezähler mit Flankenauswertung *)
	rtPart(CLK := diPartSensor);
	IF rtPart.Q THEN
		nParts := nParts + 1;
	END_IF;
	IF gHmi.Cmd.ResetCount THEN
		nParts := 0;
		gHmi.Cmd.ResetCount := FALSE;
	END_IF;

	(* 5. Status für die HMI *)
	gHmi.Status.Running := bRun;
	gHmi.Status.SpeedAct := aoSpeed;
	gHmi.Status.PartCount := nParts;
END_PROGRAM
`;

const EX_CONV = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'HMI-Schnittstelle für ein Förderband',
  task: `In mapp View bindest du Widgets an OPC UA-Variablen. Damit das übersichtlich bleibt, legst du **eine** globale Struktur \`gHmi\` an, die nach **Cmd / Par / Status** gegliedert ist (in AS6: Datentypen in \`Types.typ\`, Variable in \`Global.var\`, im OPC UA Default View freigegeben).

**Aufgabe**
1. Ergänze in \`Types.typ\` die Struktur \`ConvStatus_typ\` um \`SpeedAct : REAL\` und \`PartCount : UDINT\`.
2. **Start/Stopp:** \`gHmi.Cmd.Start\` startet das Band (\`doMotor\` bleibt an), \`gHmi.Cmd.Stop\` stoppt es. Stop hat Vorrang.
3. **Kommando-Quittierung:** Die SPS setzt \`gHmi.Cmd.Start\`, \`gHmi.Cmd.Stop\` und \`gHmi.Cmd.ResetCount\` nach der Auswertung wieder auf FALSE (ein PushButton mit Binding „Write only“ schreibt nur TRUE).
4. **Parameter:** \`aoSpeed\` = \`gHmi.Par.SpeedSet\`, begrenzt auf 0…100 %, aber nur solange das Band läuft – sonst 0.
5. **Teilezähler:** Jede steigende Flanke von \`diPartSensor\` erhöht den Zähler um 1 (ein dauerhaft belegter Sensor zählt nur einmal). \`gHmi.Cmd.ResetCount\` setzt ihn auf 0.
6. **Status:** \`gHmi.Status.Running\`, \`gHmi.Status.SpeedAct\` (= \`aoSpeed\`) und \`gHmi.Status.PartCount\` werden jeden Zyklus aktualisiert.`,
  hints: [
    'Lokale Hilfsvariablen (bRun, rSpeed, nParts, rtPart : R_TRIG) gehören in Variables.var.',
    'LIMIT(MN, IN, MX) begrenzt einen Wert – achte auf die Reihenfolge der Argumente.',
    'Schreibe die Status-Struktur am Ende des Zyklus: so sieht die HMI immer einen konsistenten Stand.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'ConvHmi_typ', dir: 'in', label: 'HMI-Schnittstelle (OPC UA)' },
    { name: 'diPartSensor', type: 'BOOL', dir: 'in', label: 'Lichtschranke B1 Teileerkennung', widget: 'button' },
    { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Schütz K1 Bandmotor', widget: 'led' },
    { name: 'aoSpeed', type: 'REAL', dir: 'out', label: 'Sollwert Umrichter', widget: 'gauge', min: 0, max: 100, unit: '%' }
  ],
  scene: { type: 'conveyor', bind: { motor: 'doMotor', sensor: 'diPartSensor' } },
  files: {
    main: `PROGRAM _INIT
	gHmi.Par.SpeedSet := 50.0;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Kommandos auswerten und quittieren *)

	(* TODO: Parameter begrenzen, Ausgänge setzen *)

	(* TODO: Teilezähler *)

	gHmi.Status.Running := doMotor;
END_PROGRAM
`,
    var: `VAR
	bRun : BOOL;
END_VAR
`,
    typ: TYP_CONV
  },
  solution: {
    main: MAIN_CONV_SOL,
    var: `VAR
	bRun : BOOL;
	rSpeed : REAL;
	nParts : UDINT;
	rtPart : R_TRIG;
END_VAR
`,
    typ: TYP_CONV_SOL
  },
  tests: [
    { name: 'Start-Kommando startet und wird quittiert', steps: [
      { set: { 'gHmi.Cmd.Start': true } }, { cycles: 2 },
      { expect: 'doMotor', msg: 'Das Band muss nach gHmi.Cmd.Start laufen.' },
      { expect: 'gHmi.Cmd.Start = FALSE', msg: 'Die SPS muss das Start-Kommando nach der Auswertung zurücksetzen.' },
      { ms: 300 },
      { expect: 'doMotor AND gHmi.Status.Running', msg: 'Das Band muss weiterlaufen und Status.Running melden.' }
    ]},
    { name: 'Stop-Kommando stoppt und hat Vorrang', steps: [
      { set: { 'gHmi.Cmd.Start': true } }, { cycles: 2 },
      { set: { 'gHmi.Cmd.Stop': true } }, { cycles: 2 },
      { expect: 'NOT doMotor', msg: 'Stop muss das Band ausschalten.' },
      { expect: 'gHmi.Cmd.Stop = FALSE', msg: 'Auch das Stop-Kommando muss quittiert werden.' },
      { set: { 'gHmi.Cmd.Start': true, 'gHmi.Cmd.Stop': true } }, { cycles: 2 },
      { expect: 'NOT doMotor', msg: 'Start und Stop gleichzeitig: Stop hat Vorrang.' }
    ]},
    { name: 'Sollgeschwindigkeit wird begrenzt und nur im Betrieb ausgegeben', steps: [
      { set: { 'gHmi.Par.SpeedSet': 150.0 } }, { cycles: 2 },
      { expect: 'aoSpeed = 0.0', msg: 'Im Stillstand muss aoSpeed 0 sein.' },
      { set: { 'gHmi.Cmd.Start': true } }, { cycles: 2 },
      { expect: 'aoSpeed = 100.0', msg: '150 % muss auf 100 % begrenzt werden.' },
      { expect: 'gHmi.Status.SpeedAct = 100.0', msg: 'Status.SpeedAct muss den ausgegebenen Wert zeigen.' },
      { set: { 'gHmi.Par.SpeedSet': -5.0 } }, { cycles: 2 },
      { expect: 'aoSpeed = 0.0', msg: 'Negative Werte müssen auf 0 % begrenzt werden.' }
    ]},
    { name: 'Teilezähler zählt Flanken und lässt sich zurücksetzen', steps: [
      { set: { diPartSensor: true } }, { cycles: 5 },
      { set: { diPartSensor: false } }, { cycles: 2 },
      { set: { diPartSensor: true } }, { cycles: 2 },
      { set: { diPartSensor: false } }, { cycles: 2 },
      { set: { diPartSensor: true } }, { cycles: 2 },
      { set: { diPartSensor: false } }, { cycles: 2 },
      { expect: 'gHmi.Status.PartCount = 3', msg: 'Drei Teile (drei steigende Flanken) müssen 3 ergeben – ein dauerhaft belegter Sensor zählt nur einmal.' },
      { set: { 'gHmi.Cmd.ResetCount': true } }, { cycles: 2 },
      { expect: 'gHmi.Status.PartCount = 0 AND gHmi.Cmd.ResetCount = FALSE', msg: 'ResetCount muss den Zähler löschen und selbst quittiert werden.' }
    ]}
  ]
};

const MAIN_LAMP_SOL = `PROGRAM _INIT
	nColorIdx := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* Blinktakt 1 Hz: 500 ms an, 500 ms aus *)
	tonBlink(IN := NOT tonBlink.Q, PT := T#500ms);
	IF tonBlink.Q THEN
		bBlink := NOT bBlink;
	END_IF;

	(* Störung speichern: neue Störung = unquittiert *)
	rtFault(CLK := diFault);
	IF rtFault.Q THEN
		bFaultLatched := TRUE;
		bUnack := TRUE;
	END_IF;
	rtAck(CLK := diAck);
	IF rtAck.Q THEN
		bUnack := FALSE;
	END_IF;
	IF NOT diFault AND NOT bUnack THEN
		bFaultLatched := FALSE;
	END_IF;

	(* Priorität: Störung > Warnung > Betrieb > neutral *)
	doLampRed := FALSE;
	doLampYellow := FALSE;
	doLampGreen := FALSE;
	IF bFaultLatched THEN
		nColorIdx := 3;
		IF bUnack THEN
			doLampRed := bBlink;
		ELSE
			doLampRed := TRUE;
		END_IF;
	ELSIF diWarning THEN
		nColorIdx := 2;
		doLampYellow := TRUE;
	ELSIF diRunning THEN
		nColorIdx := 1;
		doLampGreen := TRUE;
	ELSE
		nColorIdx := 0;
	END_IF;
END_PROGRAM
`;

const EX_LAMP = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Statusfarben: Ampel und Style-Index für die HMI',
  task: `Farbe ist in einer guten HMI **Zustandsinformation** – nicht Dekoration. Die SPS berechnet deshalb einen eindeutigen Zustand; die HMI bildet ihn über einen Style auf eine Farbe ab. Gleichzeitig zeigt eine Signalsäule denselben Zustand an.

**Anforderungen**
1. **Priorität:** Störung > Warnung > Betrieb > neutral. Es leuchtet immer **höchstens eine** Lampe.
2. **Grün** \`doLampGreen\`: \`diRunning\` und keine Warnung/Störung.
3. **Gelb** \`doLampYellow\`: \`diWarning\` und keine gespeicherte Störung.
4. **Rot** \`doLampRed\`: Eine neue Störung (\`diFault\` steigende Flanke) wird gespeichert und ist **unquittiert** → Rot **blinkt** mit 1 Hz (500 ms an / 500 ms aus). Nach Quittieren (\`diAck\`, steigende Flanke) leuchtet Rot **dauerhaft**, solange die Störung ansteht. Ist die Störung weg **und** quittiert, erlischt Rot. Eine kurz aufgetretene, schon wieder verschwundene Störung blinkt weiter, bis jemand quittiert.
5. **Style-Index** \`nColorIdx\` (INT) für ein Style-Binding in mapp View: 0 = neutral, 1 = Betrieb, 2 = Warnung, 3 = Störung.`,
  hints: [
    'Ein Blinktakt geht mit einem TON, der sich selbst zurücksetzt: tonBlink(IN := NOT tonBlink.Q, PT := T#500ms).',
    'Speichere zwei Dinge getrennt: „Störung gespeichert“ und „unquittiert“.',
    'Setze alle Lampen am Anfang auf FALSE und schalte dann in einer IF/ELSIF-Kette nach Priorität genau eine ein.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diRunning', type: 'BOOL', dir: 'in', label: 'Maschine in Betrieb', widget: 'switch' },
    { name: 'diWarning', type: 'BOOL', dir: 'in', label: 'Warnung (z. B. Füllstand niedrig)', widget: 'switch' },
    { name: 'diFault', type: 'BOOL', dir: 'in', label: 'Störung (z. B. Motorschutz)', widget: 'switch' },
    { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Taster Quittieren', widget: 'button' },
    { name: 'doLampRed', type: 'BOOL', dir: 'out', label: 'Signalsäule Rot', widget: 'led' },
    { name: 'doLampYellow', type: 'BOOL', dir: 'out', label: 'Signalsäule Gelb', widget: 'led' },
    { name: 'doLampGreen', type: 'BOOL', dir: 'out', label: 'Signalsäule Grün', widget: 'led' },
    { name: 'nColorIdx', type: 'INT', dir: 'out', label: 'Style-Index für HMI', widget: 'value' }
  ],
  scene: { type: 'lamp', bind: { lamps: ['doLampRed', 'doLampYellow', 'doLampGreen'] } },
  files: {
    main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Blinktakt, Störungsspeicher, Quittierung, Priorität *)
	doLampGreen := diRunning;
	doLampYellow := diWarning;
	doLampRed := diFault;
END_PROGRAM
`,
    var: `VAR
	nDummy : INT;
END_VAR
`,
    typ: ''
  },
  solution: {
    main: MAIN_LAMP_SOL,
    var: `VAR
	tonBlink : TON;
	bBlink : BOOL;
	rtFault : R_TRIG;
	rtAck : R_TRIG;
	bFaultLatched : BOOL;
	bUnack : BOOL;
END_VAR
`,
    typ: ''
  },
  tests: [
    { name: 'Neutral: ohne Signal ist alles aus', steps: [
      { cycles: 5 },
      { expect: 'NOT doLampRed AND NOT doLampYellow AND NOT doLampGreen', msg: 'Ohne Signal darf keine Lampe leuchten.' },
      { expect: 'nColorIdx = 0' }
    ]},
    { name: 'Priorität Betrieb < Warnung', steps: [
      { set: { diRunning: true } }, { cycles: 3 },
      { expect: 'doLampGreen AND NOT doLampYellow AND nColorIdx = 1', msg: 'Im Betrieb nur Grün, Index 1.' },
      { set: { diWarning: true } }, { cycles: 3 },
      { expect: 'doLampYellow AND NOT doLampGreen AND nColorIdx = 2', msg: 'Warnung verdrängt Grün, Index 2 – nie zwei Lampen gleichzeitig.' }
    ]},
    { name: 'Unquittierte Störung blinkt mit 1 Hz', steps: [
      { set: { diRunning: true, diFault: true } }, { cycles: 3 },
      { expect: 'nColorIdx = 3 AND NOT doLampGreen', msg: 'Störung hat höchste Priorität.' },
      { until: 'doLampRed', maxMs: 1200, msg: 'Rot muss innerhalb einer Blinkperiode angehen.' },
      { until: 'NOT doLampRed', maxMs: 800, msg: 'Rot muss blinken (wieder ausgehen).' },
      { until: 'doLampRed', maxMs: 800, msg: 'Rot muss erneut angehen (Blinken).' }
    ]},
    { name: 'Nach Quittieren leuchtet Rot dauerhaft, danach erlischt es', steps: [
      { set: { diFault: true } }, { ms: 200 },
      { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
      { never: 'NOT doLampRed', ms: 1500, msg: 'Quittierte, anstehende Störung: Rot muss dauerhaft leuchten.' },
      { set: { diFault: false } }, { cycles: 3 },
      { expect: 'NOT doLampRed AND nColorIdx = 0', msg: 'Störung weg und quittiert: Rot muss aus sein.' }
    ]},
    { name: 'Kurze Störung bleibt gespeichert bis zur Quittierung', steps: [
      { set: { diFault: true } }, { ms: 50 }, { set: { diFault: false } }, { cycles: 2 },
      { expect: 'nColorIdx = 3', msg: 'Auch eine schon verschwundene Störung muss bis zur Quittierung angezeigt werden.' },
      { until: 'doLampRed', maxMs: 1200, msg: 'Die gespeicherte Störung muss weiter blinken.' },
      { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
      { expect: 'NOT doLampRed AND nColorIdx = 0', msg: 'Nach dem Quittieren ist die Störung gelöscht.' }
    ]}
  ]
};

const TYP_LIFT = `TYPE
	LiftCmd_typ : STRUCT
		JogUp : BOOL; (* Taste "Heben" - PushButton, solange gedrückt TRUE *)
		JogDown : BOOL; (* Taste "Senken" *)
		Heartbeat : UINT; (* Lebenszeichen: die HMI erhöht den Wert zyklisch *)
	END_STRUCT;
	LiftPar_typ : STRUCT
		HandMode : BOOL; (* TRUE = Handbetrieb angewählt *)
	END_STRUCT;
	LiftStatus_typ : STRUCT
		JogEnabled : BOOL; (* Tipptasten bedienbar (für Widget-Eigenschaft enable) *)
		MsgId : INT; (* Meldungsnummer für das Text System *)
		Position : REAL; (* Hubposition in % *)
	END_STRUCT;
	LiftHmi_typ : STRUCT
		Cmd : LiftCmd_typ;
		Par : LiftPar_typ;
		Status : LiftStatus_typ;
	END_STRUCT;
END_TYPE
`;

const MAIN_LIFT_SOL = `PROGRAM _INIT
	nLastHb := gHmi.Cmd.Heartbeat;
END_PROGRAM

PROGRAM _CYCLIC
	(* 1. Lebenszeichen der HMI überwachen (Timeout 1 s) *)
	bHbChanged := gHmi.Cmd.Heartbeat <> nLastHb;
	nLastHb := gHmi.Cmd.Heartbeat;
	tonHb(IN := NOT bHbChanged, PT := T#1s);
	bConnOk := NOT tonHb.Q;

	(* 2. Tippbetrieb mit Verriegelungen *)
	bUp := FALSE;
	bDown := FALSE;
	nMsg := 0;
	IF gHmi.Cmd.JogUp OR gHmi.Cmd.JogDown THEN
		IF NOT gHmi.Par.HandMode THEN
			nMsg := 5; (* nicht im Handbetrieb *)
		ELSIF NOT bConnOk THEN
			nMsg := 3; (* HMI-Verbindung verloren *)
		ELSIF gHmi.Cmd.JogUp AND gHmi.Cmd.JogDown THEN
			nMsg := 4; (* beide Richtungen *)
		ELSIF gHmi.Cmd.JogUp THEN
			IF diTop THEN
				nMsg := 1; (* Endlage oben *)
			ELSE
				bUp := TRUE;
			END_IF;
		ELSE
			IF diBottom THEN
				nMsg := 2; (* Endlage unten *)
			ELSE
				bDown := TRUE;
			END_IF;
		END_IF;
	END_IF;
	doUp := bUp;
	doDown := bDown;

	(* 3. Status für die HMI *)
	gHmi.Status.JogEnabled := gHmi.Par.HandMode AND bConnOk;
	gHmi.Status.MsgId := nMsg;
	gHmi.Status.Position := aiStroke * 100.0;
END_PROGRAM
`;

const EX_LIFT = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Tippbetrieb Hubtisch: Totmann, Lebenszeichen, Meldungen',
  task: `Ein Hubtisch wird im Handbetrieb über zwei PushButtons „Heben“ und „Senken“ der mapp View-HMI getippt. Ein PushButton ist TRUE, solange er gedrückt ist. Geht die Verbindung zur HMI verloren (Browser geschlossen, Netzwerk weg), bleibt der zuletzt geschriebene Wert TRUE stehen. Deshalb überwacht die SPS ein **Lebenszeichen**: Die HMI erhöht \`gHmi.Cmd.Heartbeat\` regelmäßig.

Die Datentypen in \`Types.typ\` sind vorgegeben. Die Anlage (Hubtisch, 0,5 Hub/s) ist simuliert.

**Anforderungen**
1. **Totmann:** \`doUp\`/\`doDown\` sind nur aktiv, solange die jeweilige Taste gedrückt ist.
2. **Freigaben:** Fahren nur, wenn \`gHmi.Par.HandMode\` TRUE ist **und** sich das Lebenszeichen in der letzten **1 s** geändert hat.
3. **Verriegelungen:** Beide Tasten gleichzeitig → keine Bewegung. Heben stoppt bei \`diTop\`, Senken bei \`diBottom\`.
4. **Meldungen** \`gHmi.Status.MsgId\` (nur solange eine Taste gedrückt ist, sonst 0), Priorität in dieser Reihenfolge: 5 = nicht im Handbetrieb, 3 = HMI-Verbindung verloren, 4 = beide Richtungen, 1 = Endlage oben, 2 = Endlage unten. 0 = in Ordnung.
5. **Status:** \`gHmi.Status.JogEnabled\` = Handbetrieb UND Verbindung in Ordnung (für die Widget-Eigenschaft *enable*), \`gHmi.Status.Position\` = \`aiStroke\` × 100 (%).`,
  hints: [
    'Merke dir das Lebenszeichen des letzten Zyklus. Hat es sich geändert, startest du einen TON neu (IN := NOT bChanged).',
    'Setze doUp/doDown und die Meldung am Zyklusanfang zurück und baue eine IF/ELSIF-Kette in der Prioritätsreihenfolge.',
    'Die Meldungsnummer mappst du in mapp View über das Text System auf mehrsprachige Texte – die SPS liefert nur die Nummer.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gHmi', type: 'LiftHmi_typ', dir: 'in', label: 'HMI-Schnittstelle (OPC UA)' },
    { name: 'diTop', type: 'BOOL', dir: 'in', label: 'Endschalter oben B2' },
    { name: 'diBottom', type: 'BOOL', dir: 'in', label: 'Endschalter unten B1' },
    { name: 'aiStroke', type: 'REAL', dir: 'in', label: 'Hubposition 0…1', widget: 'gauge', min: 0, max: 1 },
    { name: 'doUp', type: 'BOOL', dir: 'out', label: 'Ventil Heben Y1', widget: 'led' },
    { name: 'doDown', type: 'BOOL', dir: 'out', label: 'Ventil Senken Y2', widget: 'led' }
  ],
  scene: { type: 'cylinder', bind: { extend: 'doUp', retract: 'doDown', isOut: 'diTop', isIn: 'diBottom', stroke: 'aiStroke' } },
  plant: {
    var: `VAR
	rStroke : REAL;
END_VAR
`,
    code: `IF doUp THEN
	rStroke := rStroke + 0.5 * PLANT_DT;
END_IF;
IF doDown THEN
	rStroke := rStroke - 0.5 * PLANT_DT;
END_IF;
rStroke := LIMIT(0.0, rStroke, 1.0);
aiStroke := rStroke;
diTop := rStroke >= 1.0;
diBottom := rStroke <= 0.0;
`
  },
  files: {
    main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Lebenszeichen überwachen *)

	(* TODO: Freigaben, Verriegelungen, Meldungen *)
	doUp := gHmi.Cmd.JogUp;
	doDown := gHmi.Cmd.JogDown;

	gHmi.Status.Position := aiStroke * 100.0;
END_PROGRAM
`,
    var: `VAR
	nLastHb : UINT;
END_VAR
`,
    typ: TYP_LIFT
  },
  solution: {
    main: MAIN_LIFT_SOL,
    var: `VAR
	nLastHb : UINT;
	bHbChanged : BOOL;
	tonHb : TON;
	bConnOk : BOOL;
	bUp : BOOL;
	bDown : BOOL;
	nMsg : INT;
END_VAR
`,
    typ: TYP_LIFT
  },
  tests: [
    { name: 'Tippen im Handbetrieb mit Lebenszeichen (Totmann)', steps: [
      { set: { 'gHmi.Par.HandMode': true, 'gHmi.Cmd.Heartbeat': 1, 'gHmi.Cmd.JogUp': true } }, { cycles: 3 },
      { expect: 'doUp AND gHmi.Status.MsgId = 0', msg: 'Heben muss im Handbetrieb mit gültigem Lebenszeichen fahren.' },
      { set: { 'gHmi.Cmd.JogUp': false } }, { cycles: 2 },
      { expect: 'NOT doUp', msg: 'Totmann: Nach Loslassen muss die Bewegung sofort stoppen.' }
    ]},
    { name: 'Kein Tippen außerhalb des Handbetriebs', steps: [
      { set: { 'gHmi.Par.HandMode': false, 'gHmi.Cmd.Heartbeat': 1, 'gHmi.Cmd.JogUp': true } }, { cycles: 3 },
      { expect: 'NOT doUp AND gHmi.Status.MsgId = 5', msg: 'Ohne Handbetrieb keine Bewegung, Meldung 5.' },
      { expect: 'NOT gHmi.Status.JogEnabled', msg: 'JogEnabled muss FALSE sein, damit die Tasten disabled dargestellt werden.' }
    ]},
    { name: 'Verbindungsverlust stoppt die Bewegung', steps: [
      { set: { 'gHmi.Par.HandMode': true, 'gHmi.Cmd.Heartbeat': 1, 'gHmi.Cmd.JogUp': true } }, { cycles: 3 },
      { expect: 'doUp' },
      { ms: 1300 },
      { expect: 'NOT doUp', msg: 'Ändert sich das Lebenszeichen 1 s lang nicht, muss die Bewegung stoppen.' },
      { expect: 'gHmi.Status.MsgId = 3 AND NOT gHmi.Status.JogEnabled', msg: 'Meldung 3 (Verbindung verloren) erwartet.' }
    ]},
    { name: 'Beide Tasten und Endlage unten', steps: [
      { set: { 'gHmi.Par.HandMode': true, 'gHmi.Cmd.Heartbeat': 1, 'gHmi.Cmd.JogUp': true, 'gHmi.Cmd.JogDown': true } }, { cycles: 3 },
      { expect: 'NOT doUp AND NOT doDown AND gHmi.Status.MsgId = 4', msg: 'Beide Richtungen gleichzeitig: keine Bewegung, Meldung 4.' },
      { set: { 'gHmi.Cmd.JogUp': false, 'gHmi.Cmd.Heartbeat': 2 } }, { cycles: 3 },
      { expect: 'NOT doDown AND gHmi.Status.MsgId = 2', msg: 'In der unteren Endlage darf Senken nicht fahren, Meldung 2.' }
    ]},
    { name: 'Heben bis Endlage oben', steps: [
      { set: { 'gHmi.Par.HandMode': true, 'gHmi.Cmd.Heartbeat': 1, 'gHmi.Cmd.JogUp': true } },
      { ms: 400 }, { set: { 'gHmi.Cmd.Heartbeat': 2 } },
      { ms: 400 }, { set: { 'gHmi.Cmd.Heartbeat': 3 } },
      { ms: 400 }, { set: { 'gHmi.Cmd.Heartbeat': 4 } },
      { ms: 400 }, { set: { 'gHmi.Cmd.Heartbeat': 5 } },
      { ms: 400 }, { set: { 'gHmi.Cmd.Heartbeat': 6 } },
      { ms: 400 }, { set: { 'gHmi.Cmd.Heartbeat': 7 } }, { cycles: 3 },
      { expect: 'diTop AND NOT doUp', msg: 'An der oberen Endlage muss Heben stoppen.' },
      { expect: 'gHmi.Status.MsgId = 1 AND gHmi.Status.Position >= 99.0', msg: 'Meldung 1 und Position ≈ 100 % erwartet.' }
    ]}
  ]
};

module.exports = [
  {
    id: 'hmi-2-mappview-grundlagen',
    level: 2,
    kind: 'lektion',
    title: 'mapp View Grundlagen: Page, Layout, Content und Binding',
    summary: 'Du legst eine mapp View-Visualisierung an, gestaltest Seiten mit Widgets und verbindest sie über OPC UA mit deinem ST-Programm.',
    minutes: 150,
    req: [],
    briefing: 'mapp View ist die HTML5-basierte HMI-Technologie in Automation Studio 6. Die Visualisierung läuft als Webserver auf der Steuerung; jeder Browser, jedes Power Panel und jeder Panel PC wird zum Client. Du lernst die Bausteine kennen: Visualization (.vis), Page, Layout mit Areas, Content und Widgets. Die Daten kommen ausschließlich über OPC UA: Jede Variable, die ein Widget anzeigen oder schreiben soll, muss im OPC UA Default View freigegeben sein. Zum Schluss baust du die passende Schnittstellen-Struktur in ST.',
    practice: 'An jeder modernen B&R-Maschine sitzt eine mapp View-Oberfläche – auf dem Power Panel am Schaltschrank, auf einem Panel PC am Bedienpult oder im Browser des Servicetechnikers. Eine saubere Cmd/Par/Status-Struktur entscheidet darüber, ob die HMI später wartbar bleibt.',
    transfer: {
      tia: 'In TIA Portal entspricht das WinCC Unified bzw. WinCC Comfort: Bilder statt Pages, HMI-Variablen statt OPC UA-Freigabe. Bei WinCC Unified laufen die Bilder ebenfalls im Browser (HTML5).',
      codesys: 'In CODESYS gibt es die integrierte Visualisierung mit WebVisu/TargetVisu; Variablen werden direkt aus der Applikation referenziert. Für externe HMIs nutzt man die Symbolkonfiguration bzw. den OPC UA Server.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lege eine mapp View-Visualisierung in einem ARsim-Projekt an',
        guide: {
          intro: 'Eine mapp View-Visualisierung besteht aus Objekten in der Logical View (Pages, Layouts, Contents, Themes) und in der Configuration View (mapp View-Konfiguration, Visualization). Die B&R-Vorlage „Default“ legt beides konsistent an.',
          steps: [
            'Lege in Automation Studio 6 ein neues Projekt an (**File › New Project…**), wähle als Hardware einen Standard-PC für ARsim. Laut B&R-Getting-Started muss die Option zum Kopieren der Automation Runtime-Dateien dabei **deaktiviert** bleiben.',
            'Wechsle in die **Logical View** und öffne den Objektkatalog (Toolbox). Füge das Objekt **mapp View** ein.',
            'Wähle im Dialog der Visualisierungs-Vorlagen **Default** und bestätige mit **Finish**. AS6 legt die mapp View-Packages in Logical View und Configuration View an.',
            'Öffne in der **Configuration View** die Visualisierung (.vis) und notiere die **Visualization id** (z. B. `FirstVisu`). Trage sie in der mapp View-Konfiguration als Default-Visualisierung ein.',
            'Führe einen Build aus (**F7**) und prüfe im Output-Fenster, dass keine mapp View-Fehler gemeldet werden.'
          ],
          done: 'Erledigt, wenn das Projekt fehlerfrei baut und Logical View sowie Configuration View einen mapp View-Ordner mit Visualisierung enthalten.',
          tip: 'Vergib sprechende IDs von Anfang an (z. B. `MainPage`, `MainLayout`, `cntMainOverview`). Die IDs tauchen in Bindings und Eventbindings wieder auf und sind später teuer umzubenennen.',
          link: brLink('Einfügen einer mapp View Visualisierung', 'visualization/mappview/guides/gettingstarted/insertnewvisualization.html')
        }
      },
      {
        id: 'o2',
        title: 'Gestalte eine Page mit Layout, Areas und Content',
        guide: {
          intro: 'Eine Page definiert den sichtbaren Bereich. Das Layout teilt ihn in Areas auf; in jede Area wird ein Content gelegt, der die Widgets enthält. So kannst du z. B. Kopfzeile und Navigation auf allen Seiten wiederverwenden.',
          steps: [
            'Füge in der Logical View ein **Layout** ein und lege darin zwei Areas an, z. B. `areaNav` (links, schmal) und `areaMain` (rechts).',
            'Lege eine **Page** `MainPage` an und weise ihr das Layout zu.',
            'Erzeuge in der Page für jede Area einen **Content** (z. B. `cntNavigation` und `cntMain`).',
            'Öffne `cntMain` im Content-Editor und ziehe aus der Toolbox ein **NumericOutput**- und ein **RadialGauge**-Widget hinein; ergänze ein **Label** mit Überschrift.',
            'Füge eine zweite Page `TempPage` mit demselben Layout ein. Der Navigations-Content kann von beiden Pages verwendet werden.',
            'Wähle ein mitgeliefertes **Theme** als StartTheme der Visualisierung, damit alle Widgets einheitlich aussehen.'
          ],
          done: 'Erledigt, wenn zwei Pages mit gemeinsamem Layout existieren und der Haupt-Content mindestens zwei Widgets enthält.',
          tip: 'Content wiederverwenden statt kopieren: Ein Navigations-Content, der auf allen Pages liegt, wird einmal gepflegt – das ist der erste Schritt zu einer konsistenten Bedienung.',
          link: brLink('Die Visualisierungsseite gestalten', 'visualization/mappview/guides/gettingstarted/pagedesign.html')
        }
      },
      {
        id: 'o3',
        title: 'Gib Variablen per OPC UA frei und binde sie an Widgets',
        guide: {
          intro: 'mapp View liest und schreibt Prozessdaten nur über OPC UA. Darum muss jede verwendete IEC-Variable im OPC UA Default View aktiviert sein; erst dann taucht sie im Binding-Dialog auf.',
          steps: [
            'Lege ein ST-Programm mit einer globalen Struktur an (z. B. `gHmi : ConvHmi_typ` in `Global.var`) und füge es dem Task-Class-Zyklus hinzu.',
            'Aktiviere in der **Configuration View** unter **Connectivity › OpcUaCs** in `UaCsConfig.uacfg` den OPC UA Server. Für den Einstieg konfigurierst du laut B&R-Getting-Started den anonymen Zugriff und weist für Schreibzugriffe eine passende Rolle zu.',
            'Füge unter **Connectivity › OpcUA** einmalig eine **OPC UA Default View** (`OpcUaMap.uad`) aus dem Objektkatalog ein.',
            'Öffne `OpcUaMap.uad`, markiere deine Variable und wähle im Kontextmenü **Tag aktivieren**. Bei Strukturen kannst du gezielt nur die benötigten Elemente aktivieren.',
            'Markiere im Content-Editor das Widget, öffne bei der Eigenschaft `value` den Binding-Dialog und wähle die OPC UA-Variable. Wähle den Binding Mode: **Read only** (oneWay) für Anzeigen, **Read / Write** (twoWay) für Eingaben, **Write only** (oneWayToSource) für Buttons.'
          ],
          code: { lang: 'typ', text: 'TYPE\n\tConvHmi_typ : STRUCT\n\t\tCmd : ConvCmd_typ;    (* HMI -> SPS, Write only *)\n\t\tPar : ConvPar_typ;    (* HMI <-> SPS, Read / Write *)\n\t\tStatus : ConvStatus_typ; (* SPS -> HMI, Read only *)\n\tEND_STRUCT;\nEND_TYPE' },
          done: 'Erledigt, wenn das RadialGauge den Wert einer SPS-Variable anzeigt und ein NumericInput einen Parameter in die SPS schreibt.',
          tip: 'Gibt der Binding-Dialog deine Variable nicht her, ist sie fast immer nicht im OPC UA Default View aktiviert – das ist der häufigste Anfängerfehler (auch in der B&R Community).',
          link: brLink('OPC UA Konfiguration', 'visualization/mappview/guides/gettingstarted/opcuaconfiguration.html')
        }
      },
      {
        id: 'o4',
        title: 'Teste die Visualisierung im Browser auf ARsim',
        guide: {
          intro: 'Nach Build und Transfer liefert der mapp View-Server auf der ARsim die Visualisierung an den Browser aus. So testest du ohne echtes Panel.',
          steps: [
            'Starte die Simulation (**Online › Settings** bzw. über die Symbolleiste ARsim aktivieren) und übertrage das Projekt (**Strg+F5** bzw. **Project › Transfer to Target**).',
            'Öffne Google Chrome und rufe `localhost:81/index.html?visuId=FirstVisu` auf (die visuId ist die Visualization id aus der .vis-Datei).',
            'Ist die Visualisierung als Default eingetragen, genügt `localhost:81` bzw. `localhost:81/index.html`.',
            'Ändere die Variable im **Watch**-Fenster von AS6 und beobachte, ob die Anzeige im Browser folgt. Schreibe einen Wert über das NumericInput und prüfe ihn im Watch.',
            'Wechsle über die Navigation zwischen `MainPage` und `TempPage`.'
          ],
          done: 'Erledigt, wenn du im Browser beide Seiten aufrufen kannst und Werte in beide Richtungen zwischen HMI und SPS übertragen werden.',
          tip: 'Teste früh auch auf der Zielauflösung des späteren Panels (z. B. 1280 × 800). Die Browser-Entwicklerwerkzeuge (F12) haben dafür eine Geräteansicht.',
          link: brLink('Die Visualisierung im Browser testen', 'visualization/mappview/guides/gettingstarted/testvisu.html')
        }
      }
    ],
    videos: [
      { id: 'dYegPV6bdl8', title: 'How to... get started with mapp View', channel: 'MA-IT MyAutomation - Kennis en Kunde in IA en IT', lang: 'en', why: 'Zeigt Schritt für Schritt das Anlegen einer ersten mapp View-Visualisierung in Automation Studio.' },
      { id: 'Lz_Nywfa2m8', title: 'How to... create a layout, a page and content in B&R mapp View', channel: 'MA-IT MyAutomation - Kennis en Kunde in IA en IT', lang: 'en', why: 'Erklärt das Zusammenspiel von Layout, Area, Page und Content an einem kleinen Beispiel.' },
      { id: '0RO-Veo4mBc', title: 'How to... activate OPC UA connectivity in B&R mapp View', channel: 'MA-IT MyAutomation - Kennis en Kunde in IA en IT', lang: 'en', why: 'Zeigt die OPC UA-Freigabe der Variablen, ohne die kein Binding funktioniert.' }
    ],
    readings: [
      brHelp('Getting Started (mapp View)', 'visualization/mappview/guides/gettingstarted/gettingstarted.html', 45, 'Das offizielle B&R-Tutorial: ARsim-Projekt, Visualisierung einfügen, Seiten gestalten, Daten verbinden, im Browser testen.'),
      brHelp('Widgets mit Daten verbinden', 'visualization/mappview/guides/gettingstarted/widgetswithdata.html', 20, 'Erklärt, warum jede verwendete IEC-Variable als OPC UA-Variable zur Verfügung stehen muss und wo Bindings gespeichert werden.'),
      brHelp('Binding Modes', 'visualization/mappview/engineering/variablesanddata/binding/bindingmodes.html', 15, 'Definiert oneWay, twoWay und oneWayToSource mit XML-Beispielen – Grundlage für die Cmd/Par/Status-Aufteilung.')
    ],
    quiz: [
      { type: 'single', q: 'Ein NumericOutput-Widget soll eine SPS-Variable anzeigen, im Binding-Dialog ist die Variable aber nicht auswählbar. Was ist die wahrscheinlichste Ursache?', options: ['Das Widget unterstützt keine REAL-Werte.', 'Die Variable ist im OPC UA Default View (.uad) nicht aktiviert.', 'Die Page hat kein Layout.', 'Der Browser ist nicht Google Chrome.'], correct: 1, explain: 'mapp View greift ausschließlich über OPC UA auf Prozessvariablen zu. Nicht aktivierte Variablen erscheinen nicht im Binding-Dialog.' },
      { type: 'single', q: 'Welche Aufgabe hat ein Layout in mapp View?', options: ['Es teilt die sichtbare Fläche einer Page in Areas auf, in die Contents gelegt werden.', 'Es legt die Farben aller Widgets fest.', 'Es speichert die Bindings eines Contents.', 'Es definiert die Sprache der Texte.'], correct: 0, explain: 'Page → referenziert Layout → Layout enthält Areas → in jeder Area liegt ein Content mit Widgets. Farben kommen aus Themes/Styles, Texte aus dem Text System.' },
      { type: 'multi', q: 'Welche Binding Modes passen zu welchem Widget? Wähle die sinnvollen Kombinationen.', options: ['NumericOutput (Anzeige) – Read only (oneWay)', 'NumericInput (Parameter) – Read / Write (twoWay)', 'PushButton für ein Kommando – Write only (oneWayToSource)', 'NumericOutput (Anzeige) – Write only (oneWayToSource)'], correct: [0, 1, 2], explain: 'Anzeigen lesen nur, Eingaben lesen und schreiben, Kommandotasten schreiben nur. Eine Anzeige mit Write only zeigt nie den SPS-Wert.' }
    ],
    exam: [
      { type: 'single', q: 'Unter welcher URL rufst du eine mapp View-Visualisierung mit der Visualization id „FirstVisu“ auf ARsim im Browser auf?', options: ['localhost:81/index.html?visuId=FirstVisu', 'localhost:4840/FirstVisu', 'localhost/ARsim/FirstVisu.vis', 'opc.tcp://localhost:81/FirstVisu'], correct: 0, explain: 'Laut B&R-Getting-Started liefert der mapp View-Server auf Port 81 aus; die visuId wird als URL-Parameter übergeben. 4840 ist der Standard-Port des OPC UA Servers.' },
      { type: 'multi', q: 'Welche Elemente gehören zu einer mapp View-Visualisierung in der Logical View?', options: ['Pages', 'Layouts', 'Contents', 'Die OPC UA Server-Konfiguration UaCsConfig.uacfg'], correct: [0, 1, 2], explain: 'Pages, Layouts, Contents (und Themes) liegen in der Logical View. Die OPC UA Server-Konfiguration liegt in der Configuration View unter Connectivity.' },
      { type: 'single', q: 'Warum setzt die SPS ein Kommando-Bit wie gHmi.Cmd.Start nach der Auswertung selbst zurück?', options: ['Weil OPC UA keine BOOL-Werte übertragen kann.', 'Weil ein PushButton mit Write only nur TRUE schreibt; ohne Rücksetzen bliebe das Kommando dauerhaft aktiv.', 'Weil mapp View sonst die Page nicht wechseln kann.', 'Damit der Watch-Monitor den Wert anzeigen kann.'], correct: 1, explain: 'Das Rücksetzen in der SPS quittiert das Kommando und macht es flankenartig – unabhängig davon, wie lange die HMI braucht, um wieder FALSE zu schreiben.' },
      { type: 'single', q: 'Welche Gliederung einer HMI-Schnittstellenstruktur ist in der Praxis üblich und gut wartbar?', options: ['Eine flache Liste aller Variablen in alphabetischer Reihenfolge', 'Cmd (HMI → SPS Kommandos), Par (Parameter), Status (SPS → HMI)', 'Je Widget eine eigene globale Variable', 'Alle Werte als STRING, damit die HMI sie direkt anzeigen kann'], correct: 1, explain: 'Die Aufteilung nach Datenrichtung macht Binding Modes, Rechte und Dokumentation eindeutig.' }
    ],
    exercises: [EX_CONV],
    proof: false
  },

  {
    id: 'hmi-2-bedienkonzept',
    level: 2,
    kind: 'lektion',
    title: 'Bedienkonzept: Konsistenz, Bildhierarchie und Farben für Zustände',
    summary: 'Du lernst die Grundregeln guter Maschinen-HMIs und setzt eine eindeutige Zustands- und Farblogik in ST um.',
    minutes: 120,
    req: ['hmi-2-mappview-grundlagen'],
    briefing: 'Eine HMI ist gut, wenn der Bediener ohne Nachdenken erkennt, in welchem Zustand die Maschine ist, und mit wenigen, immer gleichen Handgriffen eingreifen kann. Dazu brauchst du ein Bedienkonzept: feste Bildbereiche (Kopfzeile, Arbeitsbereich, Navigation), eine klare Bildhierarchie und konsistente Bedienelemente. Farbe wird sparsam und nur für Zustände eingesetzt – Rot heißt immer Störung, nie „Logo-Farbe“. Die Grundsätze der Dialoggestaltung (DIN EN ISO 9241-110) und der B&R Style Guide geben dir dafür die Orientierung.',
    practice: 'Bediener wechseln zwischen Maschinen verschiedener Hersteller. Wenn bei dir Grün „Achtung“ heißt oder die Quittiertaste auf jeder Seite woanders liegt, entstehen Bedienfehler, Stillstände und im schlimmsten Fall Unfälle.',
    transfer: {
      tia: 'Siemens empfiehlt für WinCC ebenfalls feste Bildbereiche und bietet mit den „HMI Templates“/Styles zentrale Gestaltungsvorgaben; Zustandsfarben werden über Grafiklisten bzw. dynamische Eigenschaften an einen Zustandswert gebunden.',
      codesys: 'In der CODESYS-Visualisierung bindest du Farben über „Farbvariablen“ bzw. Stile; auch hier gilt: die SPS liefert einen Zustand, die Visualisierung die Darstellung.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Plane Bildbereiche und Bildhierarchie für eine Maschine',
        guide: {
          intro: 'Der B&R Style Guide für Visualisierungen teilt den Bildschirm in feste Bereiche und die Bildnavigation in Ebenen ein. Diese Struktur planst du, bevor du die erste Page baust.',
          steps: [
            'Skizziere auf Papier drei feste Bereiche: Kopfzeile (Maschinenzustand, Benutzer, Uhrzeit, Sammelalarm), Arbeitsbereich (Inhalt), Fußzeile bzw. Navigationsleiste (Bildumschalttasten).',
            'Lege die 1. Navigationsebene fest, z. B. Home, Trend, Alarm, Rezept, Setup. Die B&R-Vorlage nummeriert die Bilder (10 Home, 20 Trend, 30 Alarm, 60 Setup …).',
            'Ordne jeder Hauptseite die Unterseiten der 2. Ebene zu (z. B. Alarm › Alarmhistorie). Mehr als drei Ebenen vermeidest du.',
            'Übertrage die Bereiche in ein mapp View-Layout mit Areas (`areaHeader`, `areaMain`, `areaNav`).',
            'Halte die Planung als Tabelle „Seite – Zweck – Benutzerrolle – Widgets“ im Projekt fest (z. B. als Markdown in Git).'
          ],
          done: 'Erledigt, wenn ein Layout mit Kopf-, Arbeits- und Navigationsbereich existiert und eine Seitenliste mit höchstens drei Ebenen vorliegt.',
          tip: 'Der Sammelalarm gehört in die Kopfzeile, nicht auf eine Unterseite: Ein Bediener muss auf jeder Seite sehen, dass etwas nicht stimmt.',
          link: brLink('Style Guide: Bildnavigation', 'visualization/visuguide/styleguide/style_navigation.html')
        }
      },
      {
        id: 'o2',
        title: 'Wende die Grundsätze der Dialoggestaltung auf eine Bedienseite an',
        guide: {
          intro: 'DIN EN ISO 9241-110 beschreibt Grundsätze wie Aufgabenangemessenheit, Selbstbeschreibungsfähigkeit, Erwartungskonformität, Fehlertoleranz und Steuerbarkeit. Die Norm selbst ist kostenpflichtig; die Prinzipien sind in vielen Lehrmaterialien erklärt.',
          steps: [
            'Nimm deine Seite aus dem Grundlagen-Modul und prüfe: Zeigt jede Eingabe ihre Einheit an (Selbstbeschreibungsfähigkeit)?',
            'Prüfe Erwartungskonformität: Liegen Start/Stopp/Quittieren auf allen Seiten an derselben Stelle, mit denselben Begriffen und Symbolen?',
            'Prüfe Fehlertoleranz: Haben NumericInputs sinnvolle `minValue`/`maxValue`, und wird ein ungültiger Wert in der SPS trotzdem abgefangen?',
            'Prüfe Steuerbarkeit: Kann der Bediener einen begonnenen Vorgang (z. B. Dialog) jederzeit abbrechen?',
            'Notiere je Grundsatz einen gefundenen Mangel und eine Verbesserung.'
          ],
          done: 'Erledigt, wenn du für mindestens vier Grundsätze je einen konkreten Befund mit Verbesserung dokumentiert hast.',
          tip: 'Begrenze Eingaben immer doppelt: im Widget für den Bediener und in der SPS für die Sicherheit. Die HMI ist nie die letzte Instanz.'
        }
      },
      {
        id: 'o3',
        title: 'Lege ein Farbkonzept fest, in dem Farbe nur Zustände bedeutet',
        guide: {
          intro: 'Neutrale Grautöne für Hintergründe und Bedienelemente, kräftige Farben ausschließlich für Zustände: So springt eine Abweichung sofort ins Auge. Die Leuchtmelder-Farben aus EN 60204-1 / IEC 60073 (Rot = Gefahr/Störung, Gelb = anormal, Grün = normal, Blau = Handlung erforderlich) dienen als Orientierung.',
          steps: [
            'Lies im B&R Style Guide das Kapitel „Farbgestaltung“: Dort sind Hintergründe und Steuerelemente in Grautönen definiert, Hervorhebung nur für aktive Elemente.',
            'Lege eine Tabelle Zustand → Farbe → Bedeutung an (neutral, Betrieb, Warnung, Störung) und verwende sie im gesamten Projekt.',
            'Prüfe, dass keine Zustandsfarbe für andere Zwecke benutzt wird (z. B. Rot als Rahmenfarbe eines Logos).',
            'Ergänze für jeden Zustand ein zweites Merkmal (Symbol, Text, Blinken), damit Personen mit Farbsehschwäche den Zustand ebenfalls erkennen.',
            'Lege in mapp View je Zustand einen Style an und binde später die Widget-Eigenschaft `style` an einen Zustandswert aus der SPS.'
          ],
          done: 'Erledigt, wenn eine Farbtabelle mit höchstens fünf Zustandsfarben vorliegt und jede Farbe ein zusätzliches nicht-farbliches Merkmal hat.',
          tip: 'Rund 8 % der Männer haben eine Rot-Grün-Sehschwäche. Ein Ausrufezeichen-Symbol plus Blinken ist eindeutiger als Rot allein.',
          link: brLink('Style Guide: Farbgestaltung', 'visualization/visuguide/styleguide/style_color.html')
        }
      },
      {
        id: 'o4',
        title: 'Berechne den Zustand in der SPS und bilde ihn auf Lampe und Style ab',
        guide: {
          intro: 'Die SPS entscheidet über den Zustand, die HMI nur über die Darstellung. So zeigen Signalsäule, Panel und Fernzugriff immer dasselbe.',
          steps: [
            'Definiere eine INT-Variable `nColorIdx` mit festen Werten (0 neutral, 1 Betrieb, 2 Warnung, 3 Störung).',
            'Berechne den Wert in einer IF/ELSIF-Kette nach Priorität (Störung zuerst).',
            'Steuere aus demselben Wert die Signalsäule an, damit HMI und Leuchtmelder nie widersprüchlich sind.',
            'Gib `nColorIdx` im OPC UA Default View frei und binde ihn in mapp View an die Style-Auswahl eines Widgets bzw. an ein Zustandsbild.',
            'Löse die Übung unten und prüfe Blinken und Quittierung im Simulator.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung grün sind.',
          tip: 'Blinken bedeutet „neu, nicht quittiert“. Hört das Blinken nach dem Quittieren nicht auf, verliert es seine Signalwirkung.'
        }
      }
    ],
    videos: [
      { id: '-1vxNbEu5as', title: 'Grundsätze der Dialoggestaltung - Einführung', channel: 'Indra Burkart', lang: 'de', why: 'Deutschsprachige Einführung in die Grundsätze der Dialoggestaltung nach DIN EN ISO 9241-110.' },
      { id: 'J3tudsMYNkE', title: 'Erwartungskonformität - Dialogprinzipien', channel: 'Indra Burkart', lang: 'de', why: 'Vertieft den Grundsatz, der für konsistente Maschinenbedienung am wichtigsten ist.' },
      { id: 'AWrz6hwF5eE', title: 'High-Performance HMI Colors | Palettes and Inspiration', channel: 'RealPars', lang: 'en', why: 'Zeigt, wie neutrale Paletten und sparsame Zustandsfarben in Industrie-HMIs aussehen.' }
    ],
    readings: [
      brHelp('Style Guide für Visualisierungen', 'visualization/visuguide/styleguide/style_general.html', 30, 'B&R-eigener Leitfaden zu Bildaufteilung, Navigation, Bedienelementen und Meldungen.', 'Automation Help – Visualisierung'),
      brHelp('Farbgestaltung (Style Guide)', 'visualization/visuguide/styleguide/style_color.html', 15, 'Konkrete RGB-Werte für Hintergründe, Steuerelemente und Rückmeldungen – Grautöne als Basis, Hervorhebung nur für Zustände.', 'Automation Help – Visualisierung'),
      { title: '10 Usability Heuristics for User Interface Design', author: 'Nielsen, J.', institution: 'Nielsen Norman Group', work: 'NN/g Articles', year: 1994, type: 'Artikel', minutes: 20, url: 'https://www.nngroup.com/articles/ten-usability-heuristics/', why: 'Die zehn klassischen Heuristiken (z. B. Sichtbarkeit des Systemzustands, Konsistenz) als kompakte Prüfliste.', apa: 'Nielsen, J. (1994). *10 usability heuristics for user interface design*. Nielsen Norman Group. ' + ABGERUFEN + 'https://www.nngroup.com/articles/ten-usability-heuristics/' }
    ],
    quiz: [
      { type: 'single', q: 'Welche Aussage beschreibt ein gutes Farbkonzept für eine Maschinen-HMI?', options: ['Jede Seite bekommt eine eigene Hintergrundfarbe, damit man sie unterscheiden kann.', 'Neutrale Grautöne als Basis, kräftige Farben nur für Zustände wie Warnung und Störung.', 'Rot für alle Buttons, weil es auffällt.', 'Die Firmenfarben werden für alle Statusanzeigen verwendet.'], correct: 1, explain: 'Wenn Farbe nur Zustand bedeutet, fällt eine Abweichung sofort auf. Dekorative Farben verwässern die Signalwirkung.' },
      { type: 'single', q: 'Warum berechnet die SPS den Zustandsindex (z. B. nColorIdx) und nicht die HMI?', options: ['Weil mapp View keine IF-Abfragen kann.', 'Damit Signalsäule, Panel und Fernzugriff immer denselben Zustand zeigen und die Logik an einer Stelle liegt.', 'Weil OPC UA nur INT übertragen kann.', 'Weil Styles sonst nicht funktionieren.'], correct: 1, explain: 'Trennung von Logik und Darstellung: Die SPS entscheidet, die HMI stellt dar. So gibt es keine widersprüchlichen Anzeigen.' },
      { type: 'multi', q: 'Welche Maßnahmen verbessern die Erkennbarkeit für Personen mit Rot-Grün-Sehschwäche?', options: ['Zusätzliches Symbol je Zustand', 'Blinken für unquittierte Störungen', 'Klartext-Meldung zum Zustand', 'Rot und Grün in gleicher Helligkeit nebeneinander'], correct: [0, 1, 2], explain: 'Ein zweites, nicht-farbliches Merkmal (Form, Text, Bewegung) macht den Zustand unabhängig von der Farbwahrnehmung erkennbar.' }
    ],
    exam: [
      { type: 'single', q: 'Welcher Grundsatz der Dialoggestaltung ist verletzt, wenn die Quittiertaste auf jeder Seite an einer anderen Stelle liegt?', options: ['Erwartungskonformität', 'Individualisierbarkeit', 'Lernförderlichkeit', 'Aufgabenangemessenheit'], correct: 0, explain: 'Erwartungskonformität verlangt konsistentes Verhalten und Aussehen – der Bediener erwartet die Taste immer am selben Ort.' },
      { type: 'single', q: 'Was bedeutet Blinken bei einer Störmeldung üblicherweise?', options: ['Die Störung ist besonders gefährlich.', 'Die Störung ist neu und noch nicht quittiert.', 'Die Maschine läuft im Handbetrieb.', 'Die Verbindung zur HMI ist unterbrochen.'], correct: 1, explain: 'Blinken signalisiert „neu, Aufmerksamkeit erforderlich“. Nach dem Quittieren wird die Anzeige ruhig, solange die Ursache ansteht.' },
      { type: 'multi', q: 'Welche Inhalte gehören in die Kopfzeile einer Maschinen-HMI, die auf allen Seiten sichtbar ist?', options: ['Maschinenzustand', 'Sammelalarm bzw. Alarmindikator', 'Angemeldeter Benutzer', 'Detaillierte PID-Parameter'], correct: [0, 1, 2], explain: 'Die Kopfzeile trägt die Informationen, die immer sichtbar sein müssen. Detailparameter gehören auf eine Unterseite.' },
      { type: 'single', q: 'Eine Signalsäule zeigt Grün, gleichzeitig ist Rot an. Welcher Entwurfsfehler liegt vermutlich vor?', options: ['Zu kurze Zykluszeit', 'Lampen werden unabhängig voneinander statt über eine priorisierte Zustandslogik angesteuert.', 'Der OPC UA Server ist deaktiviert.', 'Die Lampen sind falsch verdrahtet.'], correct: 1, explain: 'Ohne Priorisierung können sich Zustände überlagern. Eine IF/ELSIF-Kette (Störung > Warnung > Betrieb) verhindert widersprüchliche Anzeigen.' }
    ],
    exercises: [EX_LAMP],
    proof: false
  },

  {
    id: 'hmi-2-projekt-bedienpanel',
    level: 2,
    kind: 'projekt',
    title: 'Praxisprojekt: Bedienpanel für einen Hubtisch',
    summary: 'Du baust ein komplettes Hand-Bedienpanel mit Schnittstellenstruktur, Tipp-Tasten, Lebenszeichen-Überwachung und Meldungsnummern.',
    minutes: 240,
    req: ['hmi-2-mappview-grundlagen', 'hmi-2-bedienkonzept'],
    briefing: 'In diesem Projekt verbindest du alles aus Level 2: eine Cmd/Par/Status-Struktur, eine mapp View-Seite mit Tipp-Tasten, Statusanzeige und Meldungszeile sowie die ST-Logik dahinter. Besonderes Augenmerk liegt auf einer Schwachstelle jeder Web-HMI: Bricht die Verbindung ab, während ein Button gedrückt ist, bleibt der Wert TRUE stehen. Deshalb überwacht die SPS ein Lebenszeichen der HMI. Meldungen gibst du als Nummer aus und lässt sie vom Text System übersetzen.',
    practice: 'Hubtische, Pressen-Werkzeugwechsel oder Einrichtbetrieb an Verpackungsmaschinen werden häufig über HMI-Tipp-Tasten bedient. Lebenszeichen, Totmann-Funktion und Endlagenverriegelung sind dort Standard – sicherheitsrelevante Funktionen gehören zusätzlich in die Sicherheitstechnik (SafeLOGIC), nie allein in die HMI.',
    transfer: {
      tia: 'In WinCC verwendet man für Tipp-Tasten die Ereignisse „Drücken“/„Loslassen“ (SetzeBitBeiTaste). Ein Lebenszeichen wird oft über einen zyklischen Skript-Trigger realisiert.',
      codesys: 'In der CODESYS-Visualisierung entspricht das einem „Taster“-Element (tastend). Für WebVisu gibt es ebenfalls keine Garantie auf ein FALSE beim Verbindungsabbruch – auch hier hilft ein Lebenszeichen.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf die Schnittstelle LiftHmi_typ und gib sie frei',
        guide: {
          intro: 'Die Schnittstelle ist der Vertrag zwischen SPS- und HMI-Entwickler. Sie wird zuerst festgelegt und dokumentiert.',
          steps: [
            'Lege in `Types.typ` die Strukturen `LiftCmd_typ`, `LiftPar_typ`, `LiftStatus_typ` und `LiftHmi_typ` an (siehe Übung).',
            'Deklariere `gHmi : LiftHmi_typ` in `Global.var`.',
            'Aktiviere die Struktur im OPC UA Default View (`OpcUaMap.uad`, Kontextmenü **Tag aktivieren**).',
            'Dokumentiere je Element Datenrichtung, Binding Mode und Einheit in einem Kommentar direkt in der .typ-Datei.'
          ],
          done: 'Erledigt, wenn die Struktur baut, im OPC UA Default View aktiviert ist und jedes Element einen Kommentar mit Richtung/Einheit hat.',
          tip: 'Kommentare in .typ-Dateien werden in AS6 als Beschreibung angezeigt – das ist die günstigste Schnittstellendokumentation, die es gibt.'
        }
      },
      {
        id: 'o2',
        title: 'Baue die Bedienseite mit Tipp-Tasten, Statusanzeige und Freigabe',
        guide: {
          intro: 'Die Seite enthält zwei PushButtons, eine Positionsanzeige und eine Meldungszeile. Die Tasten sind nur bedienbar, wenn die SPS es erlaubt.',
          steps: [
            'Lege einen Content `cntLiftManual` an und platziere zwei **PushButton**-Widgets „Heben“ und „Senken“.',
            'Binde die Eigenschaft `value` der Buttons an `gHmi.Cmd.JogUp` bzw. `gHmi.Cmd.JogDown`.',
            'Binde die Eigenschaft `enable` beider Buttons an `gHmi.Status.JogEnabled` (Read only). Ein deaktivierter Button wird im Disabled-Zustand dargestellt.',
            'Zeige `gHmi.Status.Position` in einem **ProgressBar**- oder **NumericOutput**-Widget mit Einheit % an.',
            'Füge einen **ToggleButton** für `gHmi.Par.HandMode` hinzu (Read / Write).'
          ],
          done: 'Erledigt, wenn die Tasten im Automatikbetrieb ausgegraut sind und die Position im Browser live mitläuft.',
          tip: 'Zeige Bewegungsrichtungen mit Pfeilsymbolen und Text. Symbol + Text ist auch für Bediener anderer Muttersprache eindeutig.'
        }
      },
      {
        id: 'o3',
        title: 'Realisiere Lebenszeichen, Verriegelungen und Meldungsnummern in ST',
        guide: {
          intro: 'Die SPS muss sich selbst schützen: Sie bewegt nur, wenn alle Freigaben stimmen, und meldet den Grund, wenn nicht.',
          steps: [
            'Löse die Übung unten: Lebenszeichen-Überwachung mit TON (1 s), Totmann, Verriegelungen, Meldungspriorität.',
            'Lege im **Text System** (Configuration View › Textsystem) eine Textdatei mit den Meldungen 0–5 in Deutsch und Englisch an.',
            'Zeige die Meldung über ein Text-Widget an, dessen Text über die Meldungsnummer aus dem Text System gewählt wird.',
            'Erzeuge das Lebenszeichen in der HMI zyklisch (z. B. über ein zeitgesteuertes Ereignis im Eventbinding, das den Wert erhöht) und prüfe den Timeout, indem du den Browser-Tab schließt.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung grün sind und das Schließen des Browsers die Bewegung nach spätestens 1 s stoppt.',
          tip: 'Eine HMI-Tipp-Taste ist keine Sicherheitsfunktion. Gefährliche Bewegungen brauchen zusätzlich eine Zustimmeinrichtung und Sicherheitstechnik nach Risikobeurteilung.',
          link: brLink('Textsystem', 'visualization/mappview/engineering/textsystem/textsystem.html')
        }
      },
      {
        id: 'o4',
        title: 'Weise das Ergebnis nach',
        guide: {
          intro: 'Als Nachweis reichst du einen Link auf dein Repository ein, den dein Ausbilder prüft.',
          steps: [
            'Lege das Projekt in einem Repository auf git.breitner.de ab (ohne `Temp/` und `Binaries/`).',
            'Füge Screenshots der Bedienseite im Hand- und Automatikbetrieb hinzu.',
            'Beschreibe in einer README kurz die Schnittstelle (Tabelle der Elemente) und die Meldungsnummern.',
            'Reiche den Link als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Link eingereicht ist und Repository, Screenshots und Schnittstellentabelle enthält.',
          tip: 'Eine Tabelle „Element – Typ – Richtung – Binding Mode – Einheit – Beschreibung“ ist das, was Kollegen bei der Inbetriebnahme wirklich suchen.'
        }
      }
    ],
    videos: [
      { id: 'Q80mX6zHtu4', title: 'B&R | Automation Studio | Mapp View - Getting Started', channel: 'B&Rthers', lang: 'en', why: 'Zeigt eine komplette erste Bedienseite inklusive Bindings im Zusammenhang.' },
      { id: 'DNvRn9cNEAI', title: 'My First mapp View Tutorial# 1', channel: 'Brent Johnson', lang: 'en', why: 'Einsteiger-Serie, die Widgets platziert und mit Variablen verbindet – gut zum Nachbauen.' }
    ],
    readings: [
      brHelp('Rollen und Rechte (OPC UA-Variablen)', 'visualization/mappview/engineering/variablesanddata/opcua_variables/roleandrights.html', 15, 'Erklärt, dass Widgets ohne Schreibrecht automatisch disabled dargestellt werden und abgewiesene Schreibaufträge im Logbuch landen.'),
      brHelp('Textsystem (mapp View)', 'visualization/mappview/engineering/textsystem/textsystem.html', 20, 'Grundlage für Meldungstexte, die die SPS nur als Nummer liefert.'),
      { title: 'Ausbildungsrahmenplan für die Berufsausbildung zum Elektroniker für Automatisierungstechnik/zur Elektronikerin für Automatisierungstechnik (Anlage 4 IndElAusbV)', author: 'Bundesministerium der Justiz', institution: 'Bundesamt für Justiz', work: 'Verordnung über die Berufsausbildung in den industriellen Elektroberufen', year: 2018, type: 'Norm/Amtlich', minutes: 20, url: 'https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html', why: 'Zeigt, dass „Visualisierungssysteme in Betrieb nehmen und anpassen“ fester Bestandteil der Ausbildung ist.', apa: 'Bundesministerium der Justiz. (2018). *Ausbildungsrahmenplan für die Berufsausbildung zum Elektroniker für Automatisierungstechnik (Anlage 4 IndElAusbV)*. Bundesamt für Justiz. ' + ABGERUFEN + 'https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html' }
    ],
    quiz: [
      { type: 'single', q: 'Warum braucht eine Tipp-Taste in einer Web-HMI eine Lebenszeichen-Überwachung in der SPS?', options: ['Weil PushButtons nur einmal pro Sekunde schreiben.', 'Weil bei Verbindungsabbruch der zuletzt geschriebene Wert (TRUE) in der SPS stehen bleiben kann.', 'Weil OPC UA keine Echtzeit garantiert und deshalb Werte verloren gehen.', 'Weil der Browser sonst die Seite nicht lädt.'], correct: 1, explain: 'Die SPS bekommt bei Verbindungsverlust kein FALSE mehr. Ändert sich das Lebenszeichen nicht, muss sie selbst stoppen.' },
      { type: 'single', q: 'Welche Eigenschaft eines Buttons bindest du an gHmi.Status.JogEnabled, damit er im Automatikbetrieb ausgegraut ist?', options: ['value', 'enable', 'style', 'visible'], correct: 1, explain: 'Mit enable = FALSE wird das Widget im Disabled-Zustand dargestellt und ist nicht bedienbar, bleibt aber sichtbar.' },
      { type: 'single', q: 'Warum liefert die SPS eine Meldungsnummer statt eines fertigen Texts?', options: ['Strings sind in ST nicht erlaubt.', 'Das Text System übersetzt die Nummer in die gerade gewählte Sprache; die SPS bleibt sprachunabhängig.', 'OPC UA kann keine Strings übertragen.', 'Nummern sind sicherheitsgerichtet.'], correct: 1, explain: 'Trennung von Logik und Darstellung: Die Nummer ist der Vertrag, der Text ist Sache der HMI und ihres Text Systems.' }
    ],
    exam: [
      { type: 'single', q: 'Ein Bediener hält „Heben“ und „Senken“ gleichzeitig gedrückt. Was ist das richtige Verhalten?', options: ['Heben hat Vorrang.', 'Die zuletzt gedrückte Taste gewinnt.', 'Keine Bewegung und eine Meldung „beide Richtungen angewählt“.', 'Beide Ventile werden angesteuert.'], correct: 2, explain: 'Widersprüchliche Kommandos werden verriegelt; der Bediener bekommt einen klaren Hinweis.' },
      { type: 'multi', q: 'Welche Bedingungen müssen für eine Tippbewegung in der Übung erfüllt sein?', options: ['Handbetrieb angewählt', 'Lebenszeichen hat sich innerhalb 1 s geändert', 'Taste der Richtung gedrückt und Endlage dieser Richtung nicht erreicht', 'Teilezähler ist 0'], correct: [0, 1, 2], explain: 'Betriebsart, Verbindung und Endlage sind Freigaben; der Teilezähler spielt keine Rolle.' },
      { type: 'single', q: 'Wie wird die Lebenszeichen-Überwachung in der Übung typischerweise in ST realisiert?', options: ['Mit einem CTU, der bis 100 zählt.', 'Mit einem TON, dessen IN FALSE wird, sobald sich das Lebenszeichen ändert – läuft er ab, ist die Verbindung gestört.', 'Mit einem R_TRIG auf den Button.', 'Mit einer WHILE-Schleife, die auf die Änderung wartet.'], correct: 1, explain: 'Jede Änderung setzt den TON zurück. Eine WHILE-Schleife würde den Zyklus blockieren (Zykluszeitverletzung).' },
      { type: 'single', q: 'Ist die HMI-Tipp-Taste mit Lebenszeichen eine Sicherheitsfunktion im Sinne der Maschinenrichtlinie?', options: ['Ja, durch das Lebenszeichen ist sie sicher.', 'Nein, sicherheitsrelevante Funktionen müssen über geeignete Sicherheitstechnik nach Risikobeurteilung realisiert werden.', 'Ja, wenn der Browser Chrome ist.', 'Nur bei Verwendung von HTTPS.'], correct: 1, explain: 'Standard-SPS und HMI sind keine Sicherheitssteuerung. Das Lebenszeichen ist eine Verfügbarkeits- und Plausibilitätsmaßnahme, keine Sicherheitsfunktion.' }
    ],
    exercises: [EX_LIFT],
    proof: true,
    badge: 'HMI-Bedienpanel-Entwickler'
  }
];
