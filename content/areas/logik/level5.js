// Steuerungslogik – Level 5 (Master → Prüfung Guru)
'use strict';
const { vid, br, R } = require('./_src');

const pulse = (v) => [{ set: { [v]: true } }, { cycles: 2 }, { set: { [v]: false } }];

const CONV_TYP = `TYPE
	stConvCmd : STRUCT
		bRun : BOOL;
		bReset : BOOL;
	END_STRUCT;
	stConvStatus : STRUCT
		bRunning : BOOL;
		bFault : BOOL;
		nFaultId : INT;
	END_STRUCT;
	eLineState : (LINE_STOPPED, LINE_STARTING, LINE_RUNNING, LINE_STOPPING, LINE_FAULT);
END_TYPE
`;

const FB_CONVEYOR = `(* Equipment Module: ein Förderband.
   Fehler 1 = Motorschutz ausgelöst, 2 = keine Rückmeldung innerhalb 500 ms.
   Fehler sind gespeichert; Cmd.bReset (Flanke) quittiert, wenn die Ursache behoben ist. *)
FUNCTION_BLOCK FB_Conveyor
	VAR_INPUT
		Cmd : stConvCmd;
		bMotorOk : BOOL;
		bFeedback : BOOL;
	END_VAR
	VAR_OUTPUT
		Status : stConvStatus;
		bMotor : BOOL;
	END_VAR
	VAR
		rtReset : R_TRIG;
		tonFeedback : TON;
	END_VAR
	rtReset(CLK := Cmd.bReset);
	IF rtReset.Q AND bMotorOk THEN
		Status.bFault := FALSE;
		Status.nFaultId := 0;
	END_IF
	IF NOT bMotorOk AND NOT Status.bFault THEN
		Status.bFault := TRUE;
		Status.nFaultId := 1;
	END_IF
	tonFeedback(IN := bMotor AND NOT bFeedback, PT := T#500ms);
	IF tonFeedback.Q AND NOT Status.bFault THEN
		Status.bFault := TRUE;
		Status.nFaultId := 2;
	END_IF
	bMotor := Cmd.bRun AND NOT Status.bFault;
	Status.bRunning := bMotor AND bFeedback;
END_FUNCTION_BLOCK
`;

const UUT = `(* Unit under Test – NICHT verändern.
   Skaliert nRaw (0..32767, Werte außerhalb werden begrenzt) linear auf rLo..rHi.
   nMutant <> 0 wählt eine absichtlich fehlerhafte Variante (Mutationstest). *)
FUNCTION FC_ScaleUut : REAL
	VAR_INPUT
		nRaw : INT;
		rLo : REAL;
		rHi : REAL;
		nMutant : INT;
	END_VAR
	CASE nMutant OF
		1:
			FC_ScaleUut := rLo + (rHi - rLo) * INT_TO_REAL(LIMIT(0, nRaw, 32767)) / 32768.0;
		2:
			FC_ScaleUut := rLo + (rHi - rLo) * INT_TO_REAL(nRaw) / 32767.0;
		3:
			FC_ScaleUut := (rHi - rLo) * INT_TO_REAL(LIMIT(0, nRaw, 32767)) / 32767.0;
		4:
			FC_ScaleUut := LIMIT(rLo, rLo + (rHi - rLo) * INT_TO_REAL(nRaw) / 32767.0, rHi);
	ELSE
		FC_ScaleUut := rLo + (rHi - rLo) * INT_TO_REAL(LIMIT(0, nRaw, 32767)) / 32767.0;
	END_CASE
END_FUNCTION

(* Hilfsfunktion für Assertions *)
FUNCTION FC_Near : BOOL
	VAR_INPUT
		rIs : REAL;
		rExpected : REAL;
		rTol : REAL;
	END_VAR
	FC_Near := ABS(rIs - rExpected) <= rTol;
END_FUNCTION
`;

const caseLine = (raw, lo, hi, exp, tol, comment) => `	(* ${comment} *)
	nTestsRun := nTestsRun + 1;
	IF NOT FC_Near(FC_ScaleUut(${raw}, ${lo}, ${hi}, nMutant), ${exp}, ${tol}) THEN
		nTestsFailed := nTestsFailed + 1;
	END_IF
`;

module.exports = [
  // ===================================================================
  {
    id: 'logik-5-architektur',
    level: 5,
    kind: 'lektion',
    title: 'Software-Architektur: Schichten, Module und Schnittstellen',
    summary: 'Du strukturierst Maschinensoftware in Schichten (Unit, Equipment Module, Control Module) mit klaren Command/Status-Schnittstellen.',
    minutes: 240,
    req: ['logik-4-projekt-packml'],
    briefing: 'Große Maschinen scheitern selten an einzelnen Codezeilen, sondern an der Architektur: Jeder greift auf jede globale Variable zu, Abhängigkeiten sind unsichtbar, Änderungen haben Nebenwirkungen. Bewährt hat sich eine Schichtung nach ISA-88: Control Modules (einzelne Aktoren/Sensoren), Equipment Modules (Funktionsgruppen wie ein Förderband), Units (Maschine bzw. Linie mit Zustandsmodell). Zwischen den Schichten fließen Befehle nach unten (Command-Struktur) und Zustände nach oben (Status-Struktur) – nie quer. Studien der TU München zeigen, dass Maschinenbauer mit klarer Modularisierung ihre Software deutlich besser wiederverwenden und variantenreich konfigurieren können.',
    practice: 'Eine Linie mit fünf Bändern, die in der richtigen Reihenfolge anfahren und leerfahren, ist eine typische Unit-Aufgabe. Wenn jedes Band als Equipment Module mit Cmd/Status gekapselt ist, ist das sechste Band eine Zeile Code.',
    transfer: {
      tia: 'In TIA entspricht das einer FB-Hierarchie mit Multiinstanzen und UDTs für Cmd/Status; Siemens propagiert das u. a. in seinen Programmierstyleguides.',
      codesys: 'In CODESYS/TwinCAT setzt man das oft objektorientiert um (FB mit Methoden, Interfaces wie I_Conveyor); das Schichtenprinzip ist identisch.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Ordne Funktionen den Architekturschichten zu',
        guide: {
          intro: 'Jede Funktion gehört genau in eine Schicht.',
          steps: [
            'Lies die ISA-88-Übersicht und die TUM-Studie zur Modularität von SPS-Software.',
            'Liste für eine Linie mit zwei Bändern: Control Modules (Motor, Sensor), Equipment Modules (Band), Unit (Linie).',
            'Lege für jede Schicht fest: Welche Befehle bekommt sie, welche Zustände meldet sie?',
            'Prüfe: Greift irgendeine Schicht direkt auf Interna einer anderen zu? Das ist ein Architekturfehler.'
          ],
          done: 'Erledigt, wenn dein Architekturdiagramm nur Pfeile von oben nach unten (Commands) und von unten nach oben (Status) enthält.',
          tip: 'Equipment Modules kennen ihre Nachbarn nicht. Koordination (z. B. Anfahrreihenfolge) ist immer Aufgabe der darüberliegenden Schicht.',
          link: { label: 'ISA-88 Series of Standards', url: 'https://www.isa.org/standards-and-publications/isa-standards/isa-88-standards' }
        }
      },
      {
        id: 'o2',
        title: 'Definiere Command- und Status-Strukturen',
        guide: {
          intro: 'Die Schnittstelle eines Moduls ist ein Vertrag. Strukturen machen ihn explizit.',
          steps: [
            'Lege in einer .typ-Datei je Modultyp `stXxxCmd` und `stXxxStatus` an.',
            'Befehle sind Wünsche (bRun, bReset), Status sind Fakten (bRunning, bFault, nFaultId).',
            'Übergib Cmd als VAR_INPUT und lies Status als VAR_OUTPUT – keine globalen Variablen zwischen den Schichten.',
            'Versioniere Schnittstellenänderungen bewusst (Changelog), denn alle Aufrufer hängen davon ab.'
          ],
          code: { lang: 'typ', text: 'TYPE\n\tstConvCmd : STRUCT\n\t\tbRun : BOOL;\n\t\tbReset : BOOL;\n\tEND_STRUCT;\n\tstConvStatus : STRUCT\n\t\tbRunning : BOOL;\n\t\tbFault : BOOL;\n\t\tnFaultId : INT;\n\tEND_STRUCT;\nEND_TYPE' },
          done: 'Erledigt, wenn jedes Modul ausschließlich über Cmd und Status angesprochen wird.',
          tip: 'Ein Status-Bit „bRunning“ bedeutet „läuft wirklich“ (mit Rückmeldung), nicht „soll laufen“. Diese Unterscheidung verhindert viele Koordinationsfehler.'
        }
      },
      {
        id: 'o3',
        title: 'Organisiere Module im AS6-Projekt',
        guide: {
          intro: 'Die Architektur muss sich in der Logical View wiederfinden.',
          steps: [
            'Lege Equipment-Module als Funktionsbausteine in einer Anwenderbibliothek an (wiederverwendbar, getestet).',
            'Lege je Unit ein Package mit Programm, lokalen Typen und Dokumentation an.',
            'Prüfe die Paketabhängigkeiten – Bibliotheken dürfen nicht von Units abhängen.',
            'Vergib Instanznamen nach Anlagenkennzeichen (z. B. fbConvInfeed statt fbConv1).'
          ],
          done: 'Erledigt, wenn jemand ohne Erklärung in der Logical View findet, wo die Anfahrlogik der Linie steht.',
          tip: 'Ein Modul, das man nicht einzeln testen kann, ist zu eng gekoppelt.',
          link: { label: 'B&R Help: Abhängigkeiten von Paketen', url: 'https://help.br-automation.com/#/de/6/programming/packages/programmingmodel_packages_dependences.html' }
        }
      },
      {
        id: 'o4',
        title: 'Erweitere eine bestehende Architektur, ohne sie zu brechen',
        guide: {
          intro: 'Die Qualität einer Architektur zeigt sich bei der ersten Erweiterung.',
          steps: [
            'Ergänze ein zweites Equipment Module, ohne den FB zu ändern.',
            'Implementiere die Koordination (Reihenfolge, Fehlerreaktion) in der Unit.',
            'Prüfe, dass alle Status-Informationen nach oben aggregiert werden (Linienstörung mit Fehlerquelle).',
            'Lasse die automatischen Tests laufen, bevor du committest.'
          ],
          done: 'Erledigt, wenn die Erweiterung ohne Änderung am Equipment Module funktioniert.',
          tip: 'Wenn du für eine Erweiterung den Baustein ändern musst, fehlt ihm eine Schnittstelle – ändere die Schnittstelle bewusst, nicht durch einen Workaround.'
        }
      }
    ],
    videos: [
      vid('HJ3qYE_l5v0', 'de', 'Funktionsbausteine modular erweitern – Strategien für wachsende Software.'),
      vid('Gc0ijazVlj0', 'de', 'Interfaces als Vertrag zwischen Modulen (IEC 61131-3 OOP).'),
      vid('Lp3WKHD2d_U', 'de', 'Hochschulvorlesung zu FB, Interface, Property und Methode.')
    ],
    readings: [
      R.tumSlides,
      R.tumPaper,
      R.plcopenOop
    ],
    quiz: [
      { type: 'single', q: 'Wer entscheidet über die Anfahrreihenfolge zweier Förderbänder?',
        options: ['Band 1 fragt Band 2 direkt', 'Die übergeordnete Unit (Linie)', 'Eine globale Variable, die beide Bänder lesen', 'Das HMI'], correct: 1,
        explain: 'Koordination gehört in die übergeordnete Schicht; Equipment Modules kennen sich nicht.' },
      { type: 'single', q: 'Was gehört in eine Status-Struktur?',
        options: ['Befehle an das Modul', 'Fakten über den Zustand des Moduls (läuft, Fehler, Fehlernummer)', 'Parameter des HMI', 'Interne Timer'], correct: 1,
        explain: 'Status meldet nach oben, was ist – Befehle fließen in der Cmd-Struktur nach unten.' },
      { type: 'multi', q: 'Welche Ebenen nennt das ISA-88-Physical-Model (unterhalb der Prozesszelle)?',
        options: ['Unit', 'Equipment Module', 'Control Module', 'Task Class'], correct: [0, 1, 2],
        explain: 'Taskklassen sind ein Laufzeitkonzept der Steuerung, keine Ebene des Anlagenmodells.' }
    ],
    exam: [
      { type: 'single', q: 'Welches Problem entsteht, wenn Module direkt auf globale Variablen anderer Module zugreifen?',
        options: ['Höhere Zykluszeit', 'Versteckte Abhängigkeiten: Änderungen an einem Modul brechen andere, Module lassen sich nicht einzeln testen', 'Speichermangel', 'Keines'], correct: 1,
        explain: 'Explizite Schnittstellen machen Abhängigkeiten sichtbar und testbar.' },
      { type: 'single', q: 'Warum stoppt beim Leerfahren einer Linie zuerst das vorgelagerte Band?',
        options: ['Weil es näher am Schaltschrank ist', 'Damit die nachfolgenden Bänder die Teile noch abtransportieren und kein Stau entsteht', 'Aus Energiegründen', 'Zufällig'], correct: 1,
        explain: 'Anfahren von hinten nach vorn, Leerfahren von vorn nach hinten – so entsteht kein Stau.' },
      { type: 'multi', q: 'Welche Merkmale beschreiben ein gutes Equipment Module?',
        options: ['Eigenes Fehlermodell mit Fehlernummern', 'Schnittstelle nur über Cmd/Status', 'Kennt die benachbarten Module', 'Einzeln testbar'], correct: [0, 1, 3],
        explain: 'Kenntnis der Nachbarn wäre Kopplung – genau das soll vermieden werden.' },
      { type: 'numeric', q: 'Eine Linie hat {N} Bänder, jedes startet 1 s nach dem nachgelagerten. Wie lange dauert der vollständige Hochlauf (vom Start des letzten bis zum Start des ersten Bandes)?',
        params: { N: [2, 12, 1] }, formula: 'N - 1', unit: 's', tol: 0.01,
        explain: 'Zwischen N Bändern gibt es N − 1 Verzögerungen.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Linie aus zwei Equipment Modules koordinieren',
        task: `Das Equipment Module **FB_Conveyor** (Cmd/Status-Schnittstelle, Fehlermodell) ist fertig und getestet – **ändere es nicht**. Bisher steuert das Programm nur Band 1 direkt. Baue die Unit-Ebene „Linie“ mit zwei Bändern: Band 1 (Zufuhr) übergibt an Band 2 (Abfuhr).

1. **Zweites Band**: Instanz für Band 2 mit diMotorOk2, diFb2 → doMotor2.
2. **Linienstart** (Flanke **diLineStart**): zuerst Band 2; Band 1 startet **1 s**, nachdem Band 2 wirklich läuft (Status.bRunning).
3. **Linienstopp** (Flanke **diLineStop**): Band 1 sofort aus, Band 2 läuft **2 s** nach (Leerfahren), dann aus.
4. **Fehler** eines Bandes: beide Bänder sofort aus, **doLineFault** an, **nLineFaultId** = 10 · Bandnummer + Fehlernummer des Bandes (z. B. Motorschutz an Band 2 → 21).
5. **diLineReset** (Flanke) gibt den Reset an beide Bänder weiter. Sind danach alle Bänder fehlerfrei, ist die Linie gestoppt (kein automatischer Wiederanlauf) und nLineFaultId = 0.
6. **doLineRunning** = beide Bänder laufen im Linienbetrieb.

Der Enum **eLineState** ist in \`Types.typ\` vorbereitet.`,
        hints: ['Reihenfolge im Zyklus: Status lesen → Linienzustand → Commands setzen → FBs aufrufen → Ausgänge.', 'Fehler zentral vor dem CASE: `IF fbConv1.Status.bFault OR fbConv2.Status.bFault THEN eLine := LINE_FAULT; END_IF`', 'Reset: `stCmd1.bReset := diLineReset;` – der FB erkennt die Flanke selbst.'],
        cycleMs: 10,
        io: [
          { name: 'diLineStart', type: 'BOOL', dir: 'in', label: 'Linie Start', widget: 'button' },
          { name: 'diLineStop', type: 'BOOL', dir: 'in', label: 'Linie Stopp', widget: 'button' },
          { name: 'diLineReset', type: 'BOOL', dir: 'in', label: 'Linie Quittieren', widget: 'button' },
          { name: 'diMotorOk1', type: 'BOOL', dir: 'in', label: 'Motorschutz Band 1 OK', widget: 'switch', init: true },
          { name: 'diMotorOk2', type: 'BOOL', dir: 'in', label: 'Motorschutz Band 2 OK', widget: 'switch', init: true },
          { name: 'diFb1', type: 'BOOL', dir: 'in', label: 'Rückmeldung Band 1', widget: 'led' },
          { name: 'diFb2', type: 'BOOL', dir: 'in', label: 'Rückmeldung Band 2', widget: 'led' },
          { name: 'doMotor1', type: 'BOOL', dir: 'out', label: 'Band 1 (Zufuhr)', widget: 'led' },
          { name: 'doMotor2', type: 'BOOL', dir: 'out', label: 'Band 2 (Abfuhr)', widget: 'led' },
          { name: 'doLineRunning', type: 'BOOL', dir: 'out', label: 'Linie läuft', widget: 'led' },
          { name: 'doLineFault', type: 'BOOL', dir: 'out', label: 'Linienstörung', widget: 'led' },
          { name: 'nLineFaultId', type: 'INT', dir: 'out', label: 'Fehlerquelle', widget: 'value' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doMotor2', 'doMotor1', 'doLineRunning', 'doLineFault'] } },
        plant: { var: '', code: 'diFb1 := doMotor1;\ndiFb2 := doMotor2;\n' },
        files: {
          main: `${FB_CONVEYOR}
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* bisher: Band 1 direkt bedient *)
	rtStart(CLK := diLineStart);
	rtStop(CLK := diLineStop);
	IF rtStart.Q THEN
		stCmd1.bRun := TRUE;
	END_IF
	IF rtStop.Q THEN
		stCmd1.bRun := FALSE;
	END_IF
	stCmd1.bReset := diLineReset;

	fbConv1(Cmd := stCmd1, bMotorOk := diMotorOk1, bFeedback := diFb1);
	doMotor1 := fbConv1.bMotor;
END_PROGRAM
`,
          var: 'VAR\n\tfbConv1 : FB_Conveyor;\n\tstCmd1 : stConvCmd;\n\trtStart : R_TRIG;\n\trtStop : R_TRIG;\nEND_VAR\n',
          typ: CONV_TYP
        },
        solution: {
          main: `${FB_CONVEYOR}
PROGRAM _INIT
	eLine := LINE_STOPPED;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diLineStart);
	rtStop(CLK := diLineStop);

	(* Status der Equipment Modules (aus dem letzten Aufruf) *)
	tonStartDelay(IN := eLine = LINE_STARTING AND fbConv2.Status.bRunning, PT := T#1s);
	tonStopDelay(IN := eLine = LINE_STOPPING, PT := T#2s);

	IF fbConv1.Status.bFault OR fbConv2.Status.bFault THEN
		eLine := LINE_FAULT;
	END_IF

	CASE eLine OF
		LINE_STOPPED:
			stCmd1.bRun := FALSE;
			stCmd2.bRun := FALSE;
			IF rtStart.Q THEN
				eLine := LINE_STARTING;
			END_IF

		LINE_STARTING:
			stCmd2.bRun := TRUE;
			IF rtStop.Q THEN
				eLine := LINE_STOPPING;
			ELSIF tonStartDelay.Q THEN
				eLine := LINE_RUNNING;
			END_IF

		LINE_RUNNING:
			stCmd1.bRun := TRUE;
			stCmd2.bRun := TRUE;
			IF rtStop.Q THEN
				eLine := LINE_STOPPING;
			END_IF

		LINE_STOPPING:
			stCmd1.bRun := FALSE;
			stCmd2.bRun := TRUE;
			IF tonStopDelay.Q THEN
				eLine := LINE_STOPPED;
			END_IF

		LINE_FAULT:
			stCmd1.bRun := FALSE;
			stCmd2.bRun := FALSE;
			IF NOT fbConv1.Status.bFault AND NOT fbConv2.Status.bFault THEN
				eLine := LINE_STOPPED;
			END_IF
	END_CASE

	stCmd1.bReset := diLineReset;
	stCmd2.bReset := diLineReset;

	(* Equipment Modules aufrufen *)
	fbConv1(Cmd := stCmd1, bMotorOk := diMotorOk1, bFeedback := diFb1);
	fbConv2(Cmd := stCmd2, bMotorOk := diMotorOk2, bFeedback := diFb2);

	(* Status nach oben aggregieren *)
	doMotor1 := fbConv1.bMotor;
	doMotor2 := fbConv2.bMotor;
	doLineRunning := eLine = LINE_RUNNING AND fbConv1.Status.bRunning AND fbConv2.Status.bRunning;
	doLineFault := eLine = LINE_FAULT;
	IF fbConv1.Status.bFault THEN
		nLineFaultId := 10 + fbConv1.Status.nFaultId;
	ELSIF fbConv2.Status.bFault THEN
		nLineFaultId := 20 + fbConv2.Status.nFaultId;
	ELSE
		nLineFaultId := 0;
	END_IF
END_PROGRAM
`,
          var: `VAR
	eLine : eLineState;
	fbConv1 : FB_Conveyor;
	fbConv2 : FB_Conveyor;
	stCmd1 : stConvCmd;
	stCmd2 : stConvCmd;
	rtStart : R_TRIG;
	rtStop : R_TRIG;
	tonStartDelay : TON;
	tonStopDelay : TON;
END_VAR
`,
          typ: CONV_TYP
        },
        tests: [
          { name: 'Anfahren: Band 2 zuerst, Band 1 nach 1 s', steps: [
            ...pulse('diLineStart'), { cycles: 3 },
            { expect: 'doMotor2 AND NOT doMotor1', msg: 'Beim Linienstart muss zuerst Band 2 (Abfuhr) anlaufen.' },
            { ms: 800 },
            { expect: 'NOT doMotor1', msg: 'Band 1 darf erst 1 s nach Band 2 starten.' },
            { ms: 400 },
            { expect: 'doMotor1 AND doMotor2', msg: 'Nach 1 s müssen beide Bänder laufen.' },
            { cycles: 2 },
            { expect: 'doLineRunning', msg: 'Linie läuft muss gemeldet werden.' }
          ]},
          { name: 'Leerfahren: Band 1 sofort, Band 2 nach 2 s', steps: [
            ...pulse('diLineStart'), { ms: 1500 },
            ...pulse('diLineStop'), { cycles: 2 },
            { expect: 'NOT doMotor1 AND doMotor2 AND NOT doLineRunning', msg: 'Beim Stopp muss Band 1 sofort stoppen, Band 2 weiterlaufen.' },
            { ms: 1700 },
            { expect: 'doMotor2', msg: 'Band 2 muss 2 s nachlaufen.' },
            { ms: 500 },
            { expect: 'NOT doMotor2', msg: 'Nach 2 s muss auch Band 2 stehen.' }
          ]},
          { name: 'Störung Band 2 stoppt die Linie', steps: [
            ...pulse('diLineStart'), { ms: 1500 },
            { set: { diMotorOk2: false } }, { cycles: 3 },
            { expect: 'NOT doMotor1 AND NOT doMotor2', msg: 'Bei einer Bandstörung müssen beide Bänder stoppen.' },
            { expect: 'doLineFault AND nLineFaultId = 21', msg: 'Linienstörung mit Fehlerquelle 21 (Band 2, Motorschutz).' }
          ]},
          { name: 'Störung Band 1', steps: [
            ...pulse('diLineStart'), { ms: 1500 },
            { set: { diMotorOk1: false } }, { cycles: 3 },
            { expect: 'NOT doMotor1 AND NOT doMotor2 AND doLineFault AND nLineFaultId = 11', msg: 'Störung an Band 1: beide aus, Fehlerquelle 11.' }
          ]},
          { name: 'Quittieren nur ohne Ursache, kein Wiederanlauf', steps: [
            ...pulse('diLineStart'), { ms: 1500 },
            { set: { diMotorOk2: false } }, { cycles: 3 },
            ...pulse('diLineReset'), { cycles: 2 },
            { expect: 'doLineFault', msg: 'Bei weiter ausgelöstem Motorschutz darf die Quittierung nicht wirken.' },
            { set: { diMotorOk2: true } }, { cycles: 2 },
            ...pulse('diLineReset'), { cycles: 3 },
            { expect: 'NOT doLineFault AND nLineFaultId = 0 AND NOT doMotor1 AND NOT doMotor2', msg: 'Nach Quittierung: Linie gestoppt, kein automatischer Wiederanlauf.' },
            ...pulse('diLineStart'),
            { until: 'doLineRunning', maxMs: 2000, msg: 'Nach Quittierung muss die Linie wieder startbar sein.' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-5-projekt-robust',
    level: 5,
    kind: 'projekt',
    title: 'Praxisprojekt: Testbare und fehlertolerante Software',
    summary: 'Du schreibst Unit-Tests, prüfst ihre Wirksamkeit mit Mutationstests und baust eine fehlertolerante 2-aus-3-Messwertauswertung.',
    minutes: 360,
    req: ['logik-5-architektur'],
    briefing: 'Auf Guru-Niveau reicht es nicht, dass Code funktioniert – du musst es beweisen und er muss mit gestörter Umgebung umgehen. Testbarkeit entsteht durch Design: reine Funktionen, Bausteine mit klaren Schnittstellen, keine versteckten globalen Abhängigkeiten. AS6 bringt dafür die Technology Solution UnitTest mit (Testprogramme mit Test Suites, Test Sets und Assertions, Ausgabe im JUnit-Format für CI). Wie gut deine Tests sind, misst du mit Mutationstests: Man baut absichtlich Fehler ein – gute Tests finden jeden. Fehlertoleranz bedeutet: Sensorfehler erkennen (Drahtbruch, Messbereich, Plausibilität), redundante Messungen auswerten (2-aus-3), bei Mehrfachfehlern in einen sicheren Zustand gehen und all das diagnostizierbar melden.',
    practice: 'Ein Füllstand mit drei Sensoren, von denen einer driftet, darf weder die Pumpe verrückt spielen lassen noch die Anlage unnötig stoppen. Und eine Bibliotheksänderung ohne Testlauf darf es in der Firma nicht mehr geben.',
    transfer: {
      tia: 'Siemens bietet Unit-Tests im TIA Portal Test Suite; Redundanzauswertungen sind dort ebenfalls selbst zu programmieren oder kommen aus Branchenbibliotheken.',
      codesys: 'CODESYS Test Manager bzw. das Open-Source-Framework TcUnit für TwinCAT; das Prinzip Test Suite – Test – Assert ist identisch.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Richte Unit-Tests in AS6 ein',
        guide: {
          intro: 'Die Technology Solution UnitTest stellt in AS6 ein Test-Framework mit Testprogrammen, Test Sets und Assertions bereit.',
          steps: [
            'Lies in der B&R-Hilfe die Übersicht und „Test Suite (Test Programm)“ zur Technology Solution UnitTest.',
            'Lege laut „Getting Started“ ein Testprogramm an. Beachte: Die Testprogramme der UnitTest-Lösung werden in C/C++ geschrieben und rufen deine ST-Bausteine bzw. Funktionen auf.',
            'Registriere die Test Suite in einer eigenen Konfiguration, damit Testcode nicht auf die Maschine gelangt.',
            'Führe die Tests über die Unit-Test-Ansicht aus und exportiere das Ergebnis im JUnit-Format.'
          ],
          done: 'Erledigt, wenn mindestens ein Test für einen deiner Bausteine in AS6 läuft und ein Report erzeugt wird.',
          tip: 'Eine eigene Testkonfiguration (z. B. auf ARsim) hält Produktions- und Testcode sauber getrennt und erlaubt Tests in der CI-Pipeline.',
          link: { label: 'B&R Help: Solution UnitTest – Übersicht', url: 'https://help.br-automation.com/#/de/6/technologysolutions/ts_unittest/general/ts_unittest.html' }
        }
      },
      {
        id: 'o2',
        title: 'Prüfe die Qualität deiner Tests mit Mutanten',
        guide: {
          intro: 'Ein Test, der nie fehlschlägt, beweist nichts. Mutationstests zeigen, ob Tests Fehler finden.',
          steps: [
            'Leite Testfälle systematisch ab: Normalwerte, Grenzwerte (0, Vollausschlag), ungültige Werte (negativ), Sonderfälle (inverser Bereich, Offset).',
            'Wähle Toleranzen bewusst: Zu große Toleranzen lassen echte Fehler durch.',
            'Führe deine Tests gegen jede Mutante aus – jede muss mindestens einen Test fehlschlagen lassen.',
            'Ergänze für jede „überlebende“ Mutante einen Testfall.'
          ],
          done: 'Erledigt, wenn deine Tests alle Mutanten der Übung erkennen und die korrekte Implementierung bestehen.',
          tip: 'Mutanten zeigen, welche Anforderungen du nicht getestet hast – meist Grenzwerte und Sonderfälle.'
        }
      },
      {
        id: 'o3',
        title: 'Werte redundante Sensoren fehlertolerant aus',
        guide: {
          intro: '2-aus-3 (2oo3) heißt: Die Mehrheit entscheidet, ein einzelner Ausreißer wird überstimmt.',
          steps: [
            'Prüfe jeden Rohwert auf Gültigkeit (Messbereich, Drahtbruch).',
            'Bilde aus drei gültigen Werten den Median: `MAX(MIN(a, b), MIN(MAX(a, b), c))`.',
            'Markiere Sensoren als fehlerhaft, die länger als eine Toleranzzeit vom Median abweichen.',
            'Definiere den Degraded-Betrieb (2 gültige) und den sicheren Zustand (weniger als 2 gültig oder Widerspruch zwischen 2).'
          ],
          done: 'Erledigt, wenn ein einzelner Sensorfehler den Prozess nicht stört, aber gemeldet wird.',
          tip: 'Fehlertoleranz in der Betriebslogik ersetzt keine Sicherheitsfunktion nach EN ISO 13849 – Überfüllsicherungen gehören zusätzlich in die Sicherheitstechnik.'
        }
      },
      {
        id: 'o4',
        title: 'Dokumentiere und reiche ein',
        guide: {
          intro: 'Tests sind Dokumentation – sie zeigen, was der Code garantiert.',
          steps: [
            'Lege für jede Anforderung mindestens einen Testfall an und verlinke beide (z. B. Tabelle im README).',
            'Dokumentiere das Fehlermodell der Messwertauswertung (Fehlerarten, Reaktion, Quittierung).',
            'Committe Tests und Code gemeinsam; pushe auf git.breitner.de und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn alle automatischen Tests grün sind und der Link eingereicht ist.',
          tip: 'Führe die Tests vor jedem Merge aus – am besten automatisch in der CI-Pipeline.'
        }
      }
    ],
    videos: [
      vid('Cw6sFw6JK7Q', 'en', 'Einrichtung von Unit-Tests in B&R Automation Studio, Schritt für Schritt.'),
      vid('H_WnejbHM10', 'en', 'Einführung in Unit-Tests für ST am Beispiel TcUnit – Konzepte sind übertragbar.'),
      vid('FnXY6MA3axw', 'en', 'Test Driven Development für SPS-Code.')
    ],
    readings: [
      br('technologysolutions/ts_unittest/general/ts_unittest.html', 'Übersicht', 'Einstieg in die Technology Solution UnitTest von B&R.', 15),
      br('technologysolutions/ts_unittest/general/ts_test_suite.html', 'Test Suite (Test Programm)', 'Aufbau von Testprogrammen, Test Sets und Report in AS6.', 15),
      R.plcverif
    ],
    quiz: [
      { type: 'single', q: 'Eine Mutante ersetzt den Nenner 32767 durch 32768. Welcher Testfall erkennt sie am sichersten?',
        options: ['Rohwert 0 erwartet 0 %', 'Rohwert 32767 erwartet genau 100 % mit enger Toleranz', 'Rohwert 16384 mit Toleranz 1 %', 'Rohwert −100'], correct: 1,
        explain: 'Bei Vollausschlag ist die Abweichung am größten (≈ 0,003 %); nur eine enge Toleranz erkennt sie.' },
      { type: 'numeric', q: 'Drei Sensoren melden 48,0 %, {B} % und 51,0 %. Welchen Wert liefert die Median-Auswahl (B liegt zwischen 0 und 100)?',
        params: { B: [0, 100, 1] }, formula: 'Math.max(Math.min(48, B), Math.min(Math.max(48, B), 51))', unit: '%', tol: 0.01,
        explain: 'Median = mittlerer Wert der drei. Ein Ausreißer nach oben oder unten wird ignoriert.' },
      { type: 'single', q: 'Nur zwei Sensoren sind gültig und widersprechen sich dauerhaft. Was ist die richtige Reaktion?',
        options: ['Den höheren Wert nehmen', 'Den Mittelwert nehmen und weiterproduzieren', 'Sicheren Zustand einnehmen, weil keine Mehrheit entscheiden kann', 'Den Widerspruch ignorieren'], correct: 2,
        explain: 'Mit zwei widersprüchlichen Werten ist nicht entscheidbar, welcher stimmt – fail-safe.' }
    ],
    exam: [
      { type: 'multi', q: 'Was macht Code testbar?',
        options: ['Reine Funktionen ohne Seiteneffekte', 'Klare Schnittstellen statt globaler Variablen', 'Möglichst lange Programme in einer Datei', 'Abhängigkeiten, die man im Test ersetzen kann'], correct: [0, 1, 3],
        explain: 'Lange, monolithische Programme sind schwer isoliert zu testen.' },
      { type: 'single', q: 'In welcher Sprache werden die Testprogramme der B&R Technology Solution UnitTest geschrieben?',
        options: ['Structured Text', 'C/C++', 'Python', 'Kontaktplan'], correct: 1,
        explain: 'Die Test Suites bestehen laut B&R-Hilfe aus C/C++-Dateien (testsuite.c, Set_*.c); getestet werden kann Code beliebiger Sprache.' },
      { type: 'single', q: 'Ein analoger 4–20-mA-Sensor liefert dauerhaft den kleinsten Rohwert. Was ist die wahrscheinlichste Ursache?',
        options: ['Behälter leer', 'Drahtbruch bzw. Sensorausfall (unter 4 mA)', 'Zykluszeit zu kurz', 'Falsche Skalierung'], correct: 1,
        explain: 'Der Live-Zero von 4 mA erlaubt, Drahtbruch (< 3,6 mA) von „0 %“ zu unterscheiden – das muss die Auswertung nutzen.' },
      { type: 'single', q: 'Was ist der Zweck einer Toleranzzeit bei der Plausibilitätsprüfung?',
        options: ['Rechenzeit sparen', 'Kurzzeitige Abweichungen (Schwappen, Störimpulse) nicht als Sensorfehler zu werten', 'Den Median zu berechnen', 'Die Quittierung zu verzögern'], correct: 1,
        explain: 'Erst eine dauerhafte Abweichung deutet auf einen Sensorfehler hin.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Fehlertolerante 2-aus-3-Füllstandsmessung',
        task: `Ein Behälter hat drei redundante Füllstandsensoren **aiLevel1..3** (Rohwert 0…32766 = gültig, entspricht 0…100 % mit Faktor 100/32767). Programmiere die Auswertung:

1. **Bereichsfehler**: Rohwert < 0 (Drahtbruch) oder ≥ 32767 (Überlauf) → Sensor sofort fehlerhaft.
2. **Plausibilität** (nur bei 3 gültigen Sensoren): weicht ein Sensor länger als **500 ms** um mehr als **5 %** vom Median ab → fehlerhaft.
3. Sensorfehler sind **gespeichert** (**doSensorFault1..3**). Flanke an **diAck** löscht sie, wenn der Rohwert wieder im Bereich ist. **nValidCount** = Anzahl fehlerfreier Sensoren.
4. **rLevel**: 3 gültig → Median; 2 gültig → Mittelwert der beiden; sonst bleibt der letzte Wert stehen.
5. **doDegraded**: genau 2 gültige Sensoren und kein sicherer Zustand.
6. **doFailSafe**: weniger als 2 gültige Sensoren **oder** bei 2 gültigen Sensoren eine Abweichung > 5 % länger als 500 ms (keine Mehrheit). Der Widerspruch wird ebenfalls mit diAck quittiert.
7. **doPump** (Zulauf): ein unter 40 %, aus über 60 % (Hysterese), im sicheren Zustand immer aus.`,
        hints: ['Arrays erleichtern die Arbeit: `aVal : ARRAY[1..3] OF REAL; aFault : ARRAY[1..3] OF BOOL; aTon : ARRAY[1..3] OF TON;`', 'Median: `MAX(MIN(a, b), MIN(MAX(a, b), c))`', 'Plausibilitäts-Timer immer aufrufen; bei weniger als 3 gültigen Sensoren mit IN := FALSE.'],
        cycleMs: 10,
        io: [
          { name: 'aiLevel1', type: 'INT', dir: 'in', label: 'Sensor 1 Rohwert', widget: 'slider', min: -2000, max: 32767 },
          { name: 'aiLevel2', type: 'INT', dir: 'in', label: 'Sensor 2 Rohwert', widget: 'slider', min: -2000, max: 32767 },
          { name: 'aiLevel3', type: 'INT', dir: 'in', label: 'Sensor 3 Rohwert', widget: 'slider', min: -2000, max: 32767 },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'rLevel', type: 'REAL', dir: 'out', label: 'Füllstand (ausgewertet)', widget: 'gauge', min: 0, max: 100, unit: '%' },
          { name: 'nValidCount', type: 'INT', dir: 'out', label: 'Gültige Sensoren', widget: 'value' },
          { name: 'doSensorFault1', type: 'BOOL', dir: 'out', label: 'Sensor 1 fehlerhaft', widget: 'led' },
          { name: 'doSensorFault2', type: 'BOOL', dir: 'out', label: 'Sensor 2 fehlerhaft', widget: 'led' },
          { name: 'doSensorFault3', type: 'BOOL', dir: 'out', label: 'Sensor 3 fehlerhaft', widget: 'led' },
          { name: 'doDegraded', type: 'BOOL', dir: 'out', label: 'Eingeschränkter Betrieb', widget: 'led' },
          { name: 'doFailSafe', type: 'BOOL', dir: 'out', label: 'Sicherer Zustand', widget: 'led' },
          { name: 'doPump', type: 'BOOL', dir: 'out', label: 'Zulaufpumpe', widget: 'led' }
        ],
        scene: { type: 'tank', bind: { level: 'rLevel', inlet: 'doPump' } },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* erste Version: nur Sensor 1 *)
	rLevel := INT_TO_REAL(aiLevel1) * 100.0 / 32767.0;
	nValidCount := 1;
	IF rLevel < 40.0 THEN
		doPump := TRUE;
	ELSIF rLevel > 60.0 THEN
		doPump := FALSE;
	END_IF
END_PROGRAM
`, var: 'VAR\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	rLevel := 0.0;
END_PROGRAM

PROGRAM _CYCLIC
	aRaw[1] := aiLevel1;
	aRaw[2] := aiLevel2;
	aRaw[3] := aiLevel3;
	rtAck(CLK := diAck);

	(* 1. Quittierung, Skalierung, Bereichsprüfung *)
	FOR i := 1 TO 3 DO
		aInRange[i] := aRaw[i] >= 0 AND aRaw[i] < 32767;
		aVal[i] := INT_TO_REAL(aRaw[i]) * 100.0 / 32767.0;
		IF rtAck.Q AND aInRange[i] THEN
			aFault[i] := FALSE;
		END_IF
		IF NOT aInRange[i] THEN
			aFault[i] := TRUE;
		END_IF
	END_FOR
	IF rtAck.Q THEN
		bDiscrepancy := FALSE;
	END_IF

	(* 2. Plausibilität bei 3 gültigen Sensoren *)
	nValidCount := 0;
	FOR i := 1 TO 3 DO
		IF NOT aFault[i] THEN
			nValidCount := nValidCount + 1;
		END_IF
	END_FOR
	rMedian := MAX(MIN(aVal[1], aVal[2]), MIN(MAX(aVal[1], aVal[2]), aVal[3]));
	FOR i := 1 TO 3 DO
		aTon[i](IN := nValidCount = 3 AND ABS(aVal[i] - rMedian) > 5.0, PT := T#500ms);
		IF aTon[i].Q THEN
			aFault[i] := TRUE;
		END_IF
	END_FOR

	(* 3. Gültige Werte neu zählen und zusammenfassen *)
	nValidCount := 0;
	rSum := 0.0;
	nFirst := 0;
	nSecond := 0;
	FOR i := 1 TO 3 DO
		IF NOT aFault[i] THEN
			nValidCount := nValidCount + 1;
			rSum := rSum + aVal[i];
			IF nFirst = 0 THEN
				nFirst := i;
			ELSE
				nSecond := i;
			END_IF
		END_IF
	END_FOR

	(* 4. Widerspruch bei zwei Sensoren *)
	IF nValidCount = 2 THEN
		tonDiscrepancy(IN := ABS(aVal[nFirst] - aVal[nSecond]) > 5.0, PT := T#500ms);
	ELSE
		tonDiscrepancy(IN := FALSE, PT := T#500ms);
	END_IF
	IF tonDiscrepancy.Q THEN
		bDiscrepancy := TRUE;
	END_IF

	doFailSafe := nValidCount < 2 OR bDiscrepancy;
	doDegraded := nValidCount = 2 AND NOT doFailSafe;

	IF NOT doFailSafe THEN
		IF nValidCount = 3 THEN
			rLevel := rMedian;
		ELSE
			rLevel := rSum / 2.0;
		END_IF
	END_IF

	(* 5. Pumpe mit Hysterese, sicherer Zustand = aus *)
	IF doFailSafe THEN
		doPump := FALSE;
	ELSIF rLevel < 40.0 THEN
		doPump := TRUE;
	ELSIF rLevel > 60.0 THEN
		doPump := FALSE;
	END_IF

	doSensorFault1 := aFault[1];
	doSensorFault2 := aFault[2];
	doSensorFault3 := aFault[3];
END_PROGRAM
`,
          var: `VAR
	aRaw : ARRAY[1..3] OF INT;
	aVal : ARRAY[1..3] OF REAL;
	aInRange : ARRAY[1..3] OF BOOL;
	aFault : ARRAY[1..3] OF BOOL;
	aTon : ARRAY[1..3] OF TON;
	tonDiscrepancy : TON;
	rtAck : R_TRIG;
	bDiscrepancy : BOOL;
	rMedian : REAL;
	rSum : REAL;
	i : INT;
	nFirst : INT;
	nSecond : INT;
END_VAR
`, typ: '' },
        tests: [
          { name: 'Normalbetrieb und Pumpen-Hysterese', steps: [
            { set: { aiLevel1: 9830, aiLevel2: 9830, aiLevel3: 9830 } }, { cycles: 3 },
            { expect: 'ABS(rLevel - 30.0) < 0.1 AND nValidCount = 3 AND NOT doDegraded AND NOT doFailSafe', msg: 'Drei gleiche Sensoren: 30 %, alle gültig.' },
            { expect: 'doPump', msg: 'Unter 40 % muss die Pumpe laufen.' },
            { set: { aiLevel1: 16384, aiLevel2: 16384, aiLevel3: 16384 } }, { cycles: 3 },
            { expect: 'doPump', msg: '50 % liegt in der Hysterese – Pumpe bleibt an.' },
            { set: { aiLevel1: 21299, aiLevel2: 21299, aiLevel3: 21299 } }, { cycles: 3 },
            { expect: 'NOT doPump', msg: 'Über 60 % muss die Pumpe aus sein.' },
            { set: { aiLevel1: 16384, aiLevel2: 16384, aiLevel3: 16384 } }, { cycles: 3 },
            { expect: 'NOT doPump', msg: '50 % in der Hysterese – Pumpe bleibt aus.' }
          ]},
          { name: 'Ausreißer: Median sofort, Fehler nach 500 ms', steps: [
            { set: { aiLevel1: 16384, aiLevel2: 16384, aiLevel3: 26214 } }, { cycles: 2 },
            { expect: 'ABS(rLevel - 50.0) < 0.1', msg: 'Der Median muss einen einzelnen Ausreißer sofort ausblenden.' },
            { ms: 300 },
            { expect: 'NOT doSensorFault3 AND nValidCount = 3', msg: 'Vor Ablauf der Toleranzzeit noch kein Sensorfehler.' },
            { ms: 400 },
            { expect: 'doSensorFault3 AND nValidCount = 2 AND doDegraded AND NOT doFailSafe', msg: 'Nach 500 ms Abweichung: Sensor 3 fehlerhaft, eingeschränkter Betrieb.' },
            { expect: 'ABS(rLevel - 50.0) < 0.1', msg: 'Mit den zwei verbleibenden Sensoren 50 %.' }
          ]},
          { name: 'Drahtbruch sofort erkannt, Quittierung erst nach Behebung', steps: [
            { set: { aiLevel1: 16384, aiLevel2: -1500, aiLevel3: 17039 } }, { cycles: 2 },
            { expect: 'doSensorFault2 AND nValidCount = 2', msg: 'Drahtbruch (negativer Rohwert) muss sofort erkannt werden.' },
            { expect: 'ABS(rLevel - 51.0) < 0.1', msg: 'Mittelwert der beiden gültigen Sensoren (50 % und 52 %).' },
            { set: { aiLevel2: 16384 } }, { cycles: 5 },
            { expect: 'doSensorFault2', msg: 'Sensorfehler bleiben bis zur Quittierung gespeichert.' },
            ...pulse('diAck'), { cycles: 2 },
            { expect: 'NOT doSensorFault2 AND nValidCount = 3 AND NOT doDegraded', msg: 'Nach Quittierung ist Sensor 2 wieder gültig.' }
          ]},
          { name: 'Zwei Ausfälle: sicherer Zustand', steps: [
            { set: { aiLevel1: 9830, aiLevel2: 9830, aiLevel3: 9830 } }, { cycles: 3 },
            { expect: 'doPump', msg: 'Vorbedingung: Pumpe läuft bei 30 %.' },
            { set: { aiLevel1: -1500, aiLevel2: 32767 } }, { cycles: 2 },
            { expect: 'doFailSafe AND NOT doPump AND nValidCount = 1', msg: 'Weniger als 2 gültige Sensoren: sicherer Zustand, Pumpe aus.' },
            { expect: 'ABS(rLevel - 30.0) < 0.1', msg: 'Im sicheren Zustand bleibt der letzte gültige Wert stehen.' },
            ...pulse('diAck'), { cycles: 2 },
            { expect: 'doFailSafe', msg: 'Quittierung darf bei weiter gestörten Sensoren nichts ändern.' }
          ]},
          { name: 'Widerspruch zwischen zwei Sensoren', steps: [
            { set: { aiLevel1: 16384, aiLevel2: 22937, aiLevel3: -1500 } }, { cycles: 2 },
            { expect: 'nValidCount = 2 AND NOT doFailSafe', msg: 'Zwei gültige Sensoren – noch kein sicherer Zustand.' },
            { ms: 700 },
            { expect: 'doFailSafe AND NOT doPump AND NOT doDegraded', msg: 'Zwei widersprüchliche Sensoren (50 % / 70 %) ohne Mehrheit: sicherer Zustand.' },
            { set: { aiLevel2: 16384 } }, { cycles: 2 },
            { expect: 'doFailSafe', msg: 'Der Widerspruch bleibt bis zur Quittierung gespeichert.' },
            ...pulse('diAck'), { cycles: 2 },
            { expect: 'NOT doFailSafe AND doDegraded', msg: 'Nach Quittierung: eingeschränkter Betrieb (Sensor 3 weiter defekt).' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'Unit-Tests schreiben und mit Mutanten prüfen',
        task: `Die Funktion **FC_ScaleUut** (Unit under Test) skaliert einen Rohwert linear: \`rLo + (rHi − rLo) · LIMIT(0, nRaw, 32767) / 32767\`. Sie funktioniert auch für **fallende Bereiche** (rLo > rHi). **Verändere FC_ScaleUut nicht.**

Schreibe in \`_CYCLIC\` eine Test-Suite, die bei jedem Zyklus läuft:
- Jeder Testfall ruft \`FC_ScaleUut(…, nMutant)\` auf, vergleicht mit \`FC_Near(ist, soll, toleranz)\`, erhöht **nTestsRun** und bei Fehlschlag **nTestsFailed**. **doAllPassed** = keine Fehlschläge. Setze die Zähler am Zyklusanfang auf 0.
- Mindestens **6** Testfälle.

Die Bewertung führt deine Tests gegen die korrekte Implementierung (**nMutant = 0** – alle Tests müssen bestehen) und gegen **vier fehlerhafte Mutanten** (nMutant = 1…4 – jede muss mindestens einen deiner Tests fehlschlagen lassen). Welche Fehler die Mutanten enthalten, erfährst du nicht – leite deine Testfälle aus der Spezifikation ab: Normalwerte, Grenzwerte, ungültige Rohwerte, Offset und fallender Bereich.`,
        hints: ['Grenzwerte mit enger Toleranz prüfen (z. B. 0.0001 bei Vollausschlag).', 'Was soll bei nRaw = −500 herauskommen?', 'Ein Bereich 4…20 deckt fehlenden Offset auf, ein Bereich 100…0 einen falschen Umgang mit fallenden Bereichen.'],
        cycleMs: 10,
        io: [
          { name: 'nMutant', type: 'INT', dir: 'in', label: 'Implementierung (0 = korrekt, 1–4 = Mutante)', widget: 'slider', min: 0, max: 4 },
          { name: 'nTestsRun', type: 'INT', dir: 'out', label: 'Ausgeführte Tests', widget: 'value' },
          { name: 'nTestsFailed', type: 'INT', dir: 'out', label: 'Fehlgeschlagene Tests', widget: 'value' },
          { name: 'doAllPassed', type: 'BOOL', dir: 'out', label: 'Alle Tests bestanden', widget: 'led' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `${UUT}
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	nTestsRun := 0;
	nTestsFailed := 0;

${caseLine(0, '0.0', '100.0', '0.0', '0.001', 'Testfall 1: Nullpunkt')}
	(* TODO: weitere Testfälle *)

	doAllPassed := nTestsFailed = 0;
END_PROGRAM
`, var: 'VAR\nEND_VAR\n', typ: '' },
        solution: {
          main: `${UUT}
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	nTestsRun := 0;
	nTestsFailed := 0;

${caseLine(0, '0.0', '100.0', '0.0', '0.001', 'Testfall 1: Nullpunkt')}
${caseLine(32767, '0.0', '100.0', '100.0', '0.0001', 'Testfall 2: Vollausschlag exakt')}
${caseLine(16384, '0.0', '100.0', '50.0015', '0.01', 'Testfall 3: Halbskala')}
${caseLine(-500, '0.0', '100.0', '0.0', '0.001', 'Testfall 4: negativer Rohwert wird begrenzt')}
${caseLine(0, '4.0', '20.0', '4.0', '0.001', 'Testfall 5: Offset am Nullpunkt')}
${caseLine(32767, '4.0', '20.0', '20.0', '0.001', 'Testfall 6: Offset bei Vollausschlag')}
${caseLine(8192, '100.0', '0.0', '75.0', '0.01', 'Testfall 7: fallender Bereich')}
	doAllPassed := nTestsFailed = 0;
END_PROGRAM
`, var: 'VAR\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Korrekte Implementierung besteht alle Tests', steps: [
            { set: { nMutant: 0 } }, { cycles: 2 },
            { expect: 'nTestsRun >= 6', msg: 'Die Test-Suite muss mindestens 6 Testfälle ausführen.' },
            { expect: 'nTestsFailed = 0 AND doAllPassed', msg: 'Gegen die korrekte Implementierung dürfen keine Tests fehlschlagen – Erwartungswert oder Toleranz falsch?' }
          ]},
          { name: 'Mutante 1 wird erkannt', steps: [
            { set: { nMutant: 1 } }, { cycles: 2 },
            { expect: 'nTestsFailed > 0 AND NOT doAllPassed', msg: 'Mutante 1 überlebt – ein Grenzwert wird nicht genau genug geprüft.' }
          ]},
          { name: 'Mutante 2 wird erkannt', steps: [
            { set: { nMutant: 2 } }, { cycles: 2 },
            { expect: 'nTestsFailed > 0', msg: 'Mutante 2 überlebt – teste ungültige Rohwerte.' }
          ]},
          { name: 'Mutante 3 wird erkannt', steps: [
            { set: { nMutant: 3 } }, { cycles: 2 },
            { expect: 'nTestsFailed > 0', msg: 'Mutante 3 überlebt – teste Bereiche, die nicht bei 0 beginnen.' }
          ]},
          { name: 'Mutante 4 wird erkannt', steps: [
            { set: { nMutant: 4 } }, { cycles: 2 },
            { expect: 'nTestsFailed > 0', msg: 'Mutante 4 überlebt – teste einen fallenden Bereich (rLo > rHi).' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Robustheit & Testbarkeit'
  }
];
