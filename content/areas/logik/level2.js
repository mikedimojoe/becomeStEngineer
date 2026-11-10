// Steuerungslogik – Level 2 (Junior → Prüfung Senior)
'use strict';
const { vid, br, R } = require('./_src');

const CYL_PLANT = {
  var: 'VAR\n\trPos : REAL;\nEND_VAR\n',
  code: `IF NOT diJam THEN
	IF doExtend AND NOT doRetract THEN
		rPos := rPos + 1.0 * PLANT_DT;
	ELSIF doRetract AND NOT doExtend THEN
		rPos := rPos - 1.0 * PLANT_DT;
	END_IF
END_IF
rPos := LIMIT(0.0, rPos, 1.0);
rStroke := rPos;
diIsOut := rPos >= 0.99;
diIsIn := rPos <= 0.01;
`
};

module.exports = [
  // ===================================================================
  {
    id: 'logik-2-zustand',
    level: 2,
    kind: 'lektion',
    title: 'CASE, Enums und Zustandsautomaten',
    summary: 'Du modellierst Abläufe als Zustandsautomat mit Enum-Datentyp und CASE – inklusive Timeout und Fehlerzustand.',
    minutes: 180,
    req: ['logik-1-projekt-ampel'],
    briefing: 'Die INT-Schrittvariable aus Level 1 funktioniert, ist aber fehleranfällig: Niemand weiß, was Schritt 4 bedeutet, und ein Tippfehler erzeugt einen Zustand, den es nicht gibt. Ein Enum-Datentyp (in AS6 in einer .typ-Datei) gibt jedem Zustand einen Namen; die CASE-Anweisung macht jeden Zustand zu einem klar abgegrenzten Block mit Aktionen und Transitionen. Dazu gehören immer ein definierter Grundzustand, ein Fehlerzustand und Überwachungszeiten (Timeouts) für jede Bewegung. Dieses Muster ist das wichtigste Werkzeug der gesamten Ausbildung.',
    practice: 'Jeder Pneumatikzylinder, jede Tür, jeder Greifer an einer Maschine ist intern ein kleiner Zustandsautomat: Grundstellung, fährt aus, ist ausgefahren, fährt ein, Störung. Fehlt der Timeout, steht die Maschine bei einem klemmenden Zylinder einfach still – ohne Meldung.',
    transfer: {
      tia: 'In SCL schreibst du CASE … OF identisch; Enums gibt es in TIA erst eingeschränkt, üblich sind Konstanten in der PLC-Variablentabelle oder ein UDT-Ersatz.',
      codesys: 'CODESYS kennt Enums als DUT ({attribute \'qualified_only\'} empfohlen) und identische CASE-Syntax. SFC ist die grafische Alternative.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lege einen Enum-Datentyp für die Zustände an',
        guide: {
          intro: 'Datentypen liegen in AS6 in .typ-Dateien in der Logical View – global im Projekt oder lokal im Programmpaket.',
          steps: [
            'Füge im Programmordner über den Objektkatalog eine **Data Type**-Datei hinzu (z. B. `Types.typ`), falls nicht vorhanden.',
            'Öffne sie in der Textansicht und deklariere den Enum: `eCylState : (CYL_RETRACTED, CYL_EXTENDING, CYL_EXTENDED, CYL_RETRACTING, CYL_ERROR);` zwischen `TYPE` und `END_TYPE`.',
            'Deklariere in der .var-Datei `eState : eCylState;` – der Startwert ist der erste Enum-Wert.',
            'Springe aus dem Code mit Strg+T zum Datentyp einer markierten Variablen.'
          ],
          code: { lang: 'typ', text: 'TYPE\n\teCylState : (CYL_RETRACTED, CYL_EXTENDING, CYL_EXTENDED, CYL_RETRACTING, CYL_ERROR);\nEND_TYPE' },
          done: 'Erledigt, wenn dein Projekt mit dem Enum fehlerfrei kompiliert (F7).',
          tip: 'Lege den Grundzustand immer als ersten Enum-Wert an. Dann startet die Maschine nach einem Neustart garantiert dort.',
          link: { label: 'B&R Help: Abgeleitete Datentypen', url: 'https://help.br-automation.com/#/de/6/programming/datatypes/programmingmodel_datatypes_derived.html' }
        }
      },
      {
        id: 'o2',
        title: 'Programmiere den Automaten mit CASE',
        guide: {
          intro: 'Jeder CASE-Zweig enthält genau einen Zustand: was dort passiert und wann er verlassen wird.',
          steps: [
            'Zeichne zuerst das Zustandsdiagramm (Kreise = Zustände, Pfeile = Transitionen mit Bedingung).',
            'Schreibe `CASE eState OF` und für jeden Zustand einen Zweig `CYL_EXTENDING:` mit Aktionen und `IF … THEN eState := …; END_IF`.',
            'Setze in jedem Zweig alle Ausgänge, die der Zustand bestimmt – oder setze sie zentral nach dem CASE aus dem Zustand.',
            'Ergänze `ELSE eState := CYL_ERROR;` für ungültige Werte.',
            'Teste online mit Strg+M: Der Zustandsname wird im Monitormodus direkt angezeigt.'
          ],
          done: 'Erledigt, wenn dein Zustandsdiagramm und der CASE-Block 1:1 übereinstimmen.',
          tip: 'Transitionen nur innerhalb des CASE schreiben. Zustandswechsel, die „von außen“ irgendwo im Code passieren, machen Automaten unlesbar – Ausnahme: ein zentraler Fehler-/Not-Halt-Übergang direkt nach dem CASE.',
          link: { label: 'B&R Help: CASE-Anweisung', url: 'https://help.br-automation.com/#/de/6/programming/programs/structuredtext/programmingmodel_programs_structuredtext_case.html' }
        }
      },
      {
        id: 'o3',
        title: 'Überwache Bewegungen mit Timeouts',
        guide: {
          intro: 'Jede Bewegung, die auf eine Rückmeldung wartet, braucht eine Zeitüberwachung.',
          steps: [
            'Rufe den Timeout-Timer **vor** dem CASE unbedingt auf: `tonTimeout(IN := eState = CYL_EXTENDING OR eState = CYL_RETRACTING, PT := T#2s);`.',
            'Prüfe im Bewegungszustand zuerst die Endlage, danach den Timeout (ELSIF).',
            'Schalte im Fehlerzustand alle Ventile ab und warte auf eine Quittierflanke.',
            'Simuliere einen klemmenden Zylinder und beobachte, ob die Störung nach der Überwachungszeit kommt.'
          ],
          done: 'Erledigt, wenn ein blockierter Zylinder nach der Überwachungszeit sicher in den Fehlerzustand geht.',
          tip: 'Lege die Überwachungszeit großzügig aus (ca. doppelte normale Fahrzeit) und mache sie als Parameter einstellbar.'
        }
      },
      {
        id: 'o4',
        title: 'Finde Fehler in einem bestehenden Automaten',
        guide: {
          intro: 'Bestehenden Code zu lesen und zu korrigieren ist im Beruf häufiger als Neuschreiben.',
          steps: [
            'Lies den Code und zeichne aus ihm das tatsächliche Zustandsdiagramm.',
            'Vergleiche mit der Anforderung: fehlende Transitionen, Ausgänge in falschen Zuständen, nicht zurückgesetzte Timer.',
            'Setze Haltepunkte (F9) oder nutze den Trace (Diagnosewerkzeug, Hilfe-Stichwort „Trace“), um einen Zustandswechsel zyklusgenau zu sehen.',
            'Korrigiere einen Fehler nach dem anderen und teste nach jeder Korrektur.'
          ],
          done: 'Erledigt, wenn du für jeden gefundenen Fehler beschreiben kannst, welches Fehlverhalten er an der Maschine auslöst.',
          tip: 'Ein Trace mit Zustandsvariable und Ausgängen zeigt Ein-Zyklus-Fehler (z. B. zwei Schütze gleichzeitig), die im Monitormodus unsichtbar bleiben.',
          link: { label: 'B&R Help: Trace', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/trace/diagnosis_trace.html' }
        }
      }
    ],
    videos: [
      vid('FZYOuOPoluU', 'de', 'IF und CASE in ST mit praktischen Beispielen.'),
      vid('N1Fj4fm64zw', 'de', 'Der Enum-Datentyp und warum er Zustandsvariablen lesbar macht.'),
      vid('SMczIl9NySs', 'de', 'Schrittkette mit ENUM und CASE in ST – exakt das Muster dieses Moduls.')
    ],
    readings: [
      R.wikiAutomat,
      br('programming/programs/structuredtext/programmingmodel_programs_structuredtext_case.html', 'CASE-Anweisung', 'Syntax der CASE-Anweisung in AS6 inklusive Wertelisten und ELSE.', 5),
      R.plcopenSfc
    ],
    quiz: [
      { type: 'single', q: 'Welchen Vorteil hat ein Enum gegenüber einer INT-Schrittvariable?',
        options: ['Er ist schneller', 'Zustände haben Namen und ungültige Werte werden vom Compiler erschwert', 'Er braucht keinen Speicher', 'CASE funktioniert nur mit Enums'], correct: 1,
        explain: 'Enums machen den Code selbsterklärend (CYL_EXTENDING statt 1) und verhindern Zuweisungen beliebiger Zahlen.' },
      { type: 'single', q: 'Wo sollte der Timer für die Bewegungsüberwachung aufgerufen werden?',
        options: ['Nur im CASE-Zweig der Bewegung', 'Vor dem CASE, unbedingt, mit IN abhängig vom Zustand', 'Im _INIT', 'Gar nicht, der Zylinder meldet sich'], correct: 1,
        explain: 'Nur ein unbedingter Aufruf sieht, wenn der Zustand verlassen wird, und setzt den Timer zurück.' },
      { type: 'multi', q: 'Was gehört zu einem robusten Zustandsautomaten?',
        options: ['Ein definierter Grundzustand', 'Ein Fehlerzustand mit Quittierung', 'Timeouts für Bewegungen', 'Möglichst viele Zustandswechsel außerhalb des CASE'], correct: [0, 1, 2],
        explain: 'Zustandswechsel außerhalb des CASE machen den Automaten schwer nachvollziehbar.' }
    ],
    exam: [
      { type: 'single', q: 'Was ist an diesem Code problematisch?', code: { lang: 'st', text: 'CASE eState OF\n\tST_FILL:\n\t\tdoValve := TRUE;\n\t\tIF diFull THEN eState := ST_HEAT; END_IF\n\tST_HEAT:\n\t\tdoHeater := TRUE;\n\t\tIF rTemp > 60.0 THEN eState := ST_IDLE; END_IF\nEND_CASE' },
        options: ['CASE darf keine IF enthalten', 'doValve und doHeater werden nie zurückgesetzt', 'Enums dürfen nicht ST_ heißen', 'rTemp darf nicht mit REAL verglichen werden'], correct: 1,
        explain: 'Ausgänge, die in einem Zweig gesetzt und nirgends zurückgesetzt werden, bleiben nach dem Zustandswechsel an. Besser: Ausgänge zentral aus dem Zustand ableiten.' },
      { type: 'single', q: 'Ein Stern-Dreieck-Anlauf schaltet in einem Zyklus K3 (Stern) aus und K2 (Dreieck) ein. Warum braucht man trotzdem eine Umschaltpause?',
        options: ['Die SPS ist zu schnell für das Schütz', 'Schütze haben mechanische Abfall- und Anzugszeiten; ohne Pause droht ein Kurzschluss über beide Schütze', 'Wegen der Zykluszeitverletzung', 'Sie ist nur für die Optik'], correct: 1,
        explain: 'Das Abfallen eines Schützes dauert länger als ein SPS-Zyklus. Zusätzlich gehört eine elektrische Verriegelung in die Hardware.' },
      { type: 'single', q: 'Welcher Wert steht nach dem Start in `eState : eMode;`, wenn `eMode : (MODE_OFF, MODE_MANUAL, MODE_AUTO);` deklariert ist und kein Initialwert angegeben wurde?',
        options: ['MODE_AUTO', 'MODE_OFF', 'Undefiniert', 'MODE_MANUAL'], correct: 1,
        explain: 'Ohne Initialwert erhält eine Enum-Variable den ersten Wert der Aufzählung (intern 0).' },
      { type: 'multi', q: 'Welche Transitionen eines Zylinder-Automaten sollten flankengesteuert sein?',
        options: ['Startbefehl vom Bediener', 'Quittierung im Fehlerzustand', 'Endlage erreicht', 'Timeout abgelaufen'], correct: [0, 1],
        explain: 'Bedienbefehle sollen pro Tastendruck genau einmal wirken. Endlagen und Timeouts sind Zustandsbedingungen und werden als Pegel ausgewertet.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Zylinder-Automat mit Timeout und Störung',
        task: `Ein Pneumatikzylinder mit bistabilem 5/2-Wegeventil (zwei Spulen) soll einen Arbeitstakt ausführen. Der Enum-Datentyp **eCylState** ist bereits in \`Types.typ\` angelegt, die Zustandsvariable heißt **eState**.

**Ablauf:**
1. **CYL_RETRACTED** (Grundstellung): beide Spulen aus. Eine steigende Flanke an **diStart** → CYL_EXTENDING.
2. **CYL_EXTENDING**: Spule **doExtend** an, bis Endlage **diIsOut** erreicht → CYL_EXTENDED.
3. **CYL_EXTENDED**: beide Spulen aus, **1 s** verweilen → CYL_RETRACTING.
4. **CYL_RETRACTING**: Spule **doRetract** an, bis Endlage **diIsIn** → CYL_RETRACTED.
5. Dauert Aus- oder Einfahren länger als **2 s** → **CYL_ERROR**: beide Spulen aus, **doError** an.
6. Aus CYL_ERROR nur mit steigender Flanke an **diAck** → CYL_RETRACTING (Zylinder fährt in Grundstellung).

Ein dauerhaft gedrückter Start-Taster darf nur **einen** Takt auslösen. Mit **diJam** kannst du in der Simulation einen klemmenden Zylinder erzeugen.`,
        hints: ['Rufe R_TRIG für Start und Quittierung sowie beide Timer (Verweilzeit, Timeout) vor dem CASE auf.', 'Timeout: `tonTimeout(IN := eState = CYL_EXTENDING OR eState = CYL_RETRACTING, PT := T#2s);`', 'Prüfe in den Bewegungszuständen zuerst die Endlage, dann den Timeout.'],
        cycleMs: 10,
        io: [
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start-Taster', widget: 'button' },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'diJam', type: 'BOOL', dir: 'in', label: 'Simulation: Zylinder klemmt', widget: 'switch' },
          { name: 'diIsOut', type: 'BOOL', dir: 'in', label: 'Endlage ausgefahren B2', widget: 'led' },
          { name: 'diIsIn', type: 'BOOL', dir: 'in', label: 'Endlage eingefahren B1', widget: 'led' },
          { name: 'rStroke', type: 'REAL', dir: 'in', label: 'Hub (Simulation)', widget: 'gauge', min: 0, max: 1 },
          { name: 'doExtend', type: 'BOOL', dir: 'out', label: 'Spule Y1 ausfahren', widget: 'led' },
          { name: 'doRetract', type: 'BOOL', dir: 'out', label: 'Spule Y2 einfahren', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Störung', widget: 'led' }
        ],
        scene: { type: 'cylinder', bind: { extend: 'doExtend', retract: 'doRetract', isOut: 'diIsOut', isIn: 'diIsIn', stroke: 'rStroke' } },
        plant: CYL_PLANT,
        files: {
          main: `PROGRAM _INIT
	eState := CYL_RETRACTED;
END_PROGRAM

PROGRAM _CYCLIC
	CASE eState OF
		CYL_RETRACTED:
			doExtend := FALSE;
			doRetract := FALSE;
			(* TODO: Start auswerten *)

		CYL_EXTENDING:
			(* TODO *)

		CYL_EXTENDED:
			(* TODO *)

		CYL_RETRACTING:
			(* TODO *)

		CYL_ERROR:
			(* TODO *)
	END_CASE
	doError := eState = CYL_ERROR;
END_PROGRAM
`,
          var: 'VAR\n\teState : eCylState;\nEND_VAR\n',
          typ: 'TYPE\n\teCylState : (CYL_RETRACTED, CYL_EXTENDING, CYL_EXTENDED, CYL_RETRACTING, CYL_ERROR);\nEND_TYPE\n'
        },
        solution: {
          main: `PROGRAM _INIT
	eState := CYL_RETRACTED;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	rtAck(CLK := diAck);
	tonDwell(IN := eState = CYL_EXTENDED, PT := T#1s);
	tonTimeout(IN := eState = CYL_EXTENDING OR eState = CYL_RETRACTING, PT := T#2s);

	CASE eState OF
		CYL_RETRACTED:
			doExtend := FALSE;
			doRetract := FALSE;
			IF rtStart.Q THEN
				eState := CYL_EXTENDING;
			END_IF

		CYL_EXTENDING:
			doExtend := TRUE;
			doRetract := FALSE;
			IF diIsOut THEN
				eState := CYL_EXTENDED;
			ELSIF tonTimeout.Q THEN
				eState := CYL_ERROR;
			END_IF

		CYL_EXTENDED:
			doExtend := FALSE;
			doRetract := FALSE;
			IF tonDwell.Q THEN
				eState := CYL_RETRACTING;
			END_IF

		CYL_RETRACTING:
			doExtend := FALSE;
			doRetract := TRUE;
			IF diIsIn THEN
				eState := CYL_RETRACTED;
			ELSIF tonTimeout.Q THEN
				eState := CYL_ERROR;
			END_IF

		CYL_ERROR:
			doExtend := FALSE;
			doRetract := FALSE;
			IF rtAck.Q THEN
				eState := CYL_RETRACTING;
			END_IF
	ELSE
		eState := CYL_ERROR;
	END_CASE
	doError := eState = CYL_ERROR;
END_PROGRAM
`,
          var: 'VAR\n\teState : eCylState;\n\trtStart : R_TRIG;\n\trtAck : R_TRIG;\n\ttonDwell : TON;\n\ttonTimeout : TON;\nEND_VAR\n',
          typ: 'TYPE\n\teCylState : (CYL_RETRACTED, CYL_EXTENDING, CYL_EXTENDED, CYL_RETRACTING, CYL_ERROR);\nEND_TYPE\n'
        },
        tests: [
          { name: 'Grundstellung nach Start', steps: [
            { cycles: 3 },
            { expect: 'eState = CYL_RETRACTED AND NOT doExtend AND NOT doRetract AND NOT doError', msg: 'Nach dem Start: Grundstellung, beide Spulen aus.' }
          ]},
          { name: 'Ausfahren bis Endlage', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { expect: 'doExtend AND NOT doRetract', msg: 'Nach Start muss Spule Y1 (ausfahren) an sein.' },
            { until: 'diIsOut', maxMs: 1500, msg: 'Zylinder erreicht die vordere Endlage nicht.' },
            { cycles: 2 },
            { expect: 'eState = CYL_EXTENDED AND NOT doExtend', msg: 'In der Endlage: Zustand CYL_EXTENDED, Spule aus.' }
          ]},
          { name: 'Verweilzeit 1 s und Rückfahrt', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { until: 'diIsOut', maxMs: 1500 }, { cycles: 2 },
            { ms: 800 },
            { expect: 'eState = CYL_EXTENDED AND NOT doRetract', msg: 'Verweilzeit von 1 s nicht eingehalten.' },
            { until: 'doRetract', maxMs: 400, msg: 'Nach 1 s Verweilzeit muss der Zylinder einfahren.' },
            { until: 'diIsIn', maxMs: 1500 }, { cycles: 2 },
            { expect: 'eState = CYL_RETRACTED AND NOT doExtend AND NOT doRetract', msg: 'Nach dem Einfahren: Grundstellung.' }
          ]},
          { name: 'Dauerdruck löst nur einen Takt aus', steps: [
            { set: { diStart: true } },
            { ms: 3600 },
            { expect: 'eState = CYL_RETRACTED', msg: 'Nach einem Takt muss der Zylinder wieder in Grundstellung sein.' },
            { never: 'doExtend', ms: 1000, msg: 'Dauerdruck auf Start darf keinen zweiten Takt auslösen (Flanke!).' }
          ]},
          { name: 'Timeout führt in Störung', steps: [
            { set: { diJam: true } },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { ms: 1800 },
            { expect: 'NOT doError', msg: 'Die Störung darf nicht vor 2 s kommen.' },
            { until: 'doError', maxMs: 600, msg: 'Ein klemmender Zylinder muss nach 2 s zur Störung führen.' },
            { cycles: 2 },
            { expect: 'NOT doExtend AND NOT doRetract', msg: 'Im Fehlerzustand müssen beide Spulen aus sein.' },
            { ms: 1000 },
            { expect: 'doError', msg: 'Die Störung darf nicht ohne Quittierung verschwinden.' }
          ]},
          { name: 'Quittieren fährt in Grundstellung', steps: [
            { set: { diJam: true } },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { until: 'doError', maxMs: 2600 },
            { set: { diJam: false } },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } },
            { until: 'eState = CYL_RETRACTED AND NOT doError', maxMs: 2000, msg: 'Nach Quittierung muss der Zylinder in Grundstellung gehen.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'fehlersuche',
        title: 'Fehlersuche: Stern-Dreieck-Anlauf',
        task: `Eine Pumpe wird über Stern-Dreieck gestartet. Ein Kollege hat den Zustandsautomaten geschrieben – an der Anlage fliegt gelegentlich die Sicherung, und nach einem Stopp startet der Motor direkt im Dreieck. Finde und behebe die Fehler.

**Anforderungen:**
- Grundstellung: alle Schütze aus.
- Steigende Flanke an **diStart** (nur wenn kein Überlastfehler ansteht) → **Stern**: Netzschütz **doMain** und Sternschütz **doStar** an, für **2 s**.
- Danach **Umschaltpause 50 ms**: nur doMain an.
- Danach **Dreieck**: doMain und Dreieckschütz **doDelta** an.
- **doStar und doDelta dürfen nie gleichzeitig an sein.**
- **diStop** (Öffner, FALSE = betätigt) schaltet in **jedem** Betriebszustand alles ab → Grundstellung.
- **diOverload** (Motorschutz, Öffner, FALSE = ausgelöst) → Störung: alles aus, **doFault** an.
- Störung nur per steigender Flanke an **diAck** quittierbar – und nur, wenn der Motorschutz wieder in Ordnung ist.
- Jeder neue Start beginnt wieder mit 2 s Stern.`,
        hints: ['Prüfe, ob der Stern-Timer bei jedem Start neu beginnt.', 'Welche Ausgänge sind in der Umschaltpause tatsächlich an?', 'Gilt Stopp wirklich in jedem Zustand?', 'Wie wird quittiert?'],
        cycleMs: 10,
        io: [
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start-Taster', widget: 'button' },
          { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Stopp-Taster (Öffner)', widget: 'switch', init: true },
          { name: 'diOverload', type: 'BOOL', dir: 'in', label: 'Motorschutz OK (Öffner)', widget: 'switch', init: true },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'doMain', type: 'BOOL', dir: 'out', label: 'Netzschütz K1', widget: 'led' },
          { name: 'doStar', type: 'BOOL', dir: 'out', label: 'Sternschütz K3', widget: 'led' },
          { name: 'doDelta', type: 'BOOL', dir: 'out', label: 'Dreieckschütz K2', widget: 'led' },
          { name: 'doFault', type: 'BOOL', dir: 'out', label: 'Störung', widget: 'led' }
        ],
        scene: { type: 'motor', bind: { run: 'doMain', fault: 'doFault' } },
        files: {
          main: `PROGRAM _INIT
	nState := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* 0 = Aus, 1 = Stern, 2 = Pause, 3 = Dreieck, 4 = Störung *)
	CASE nState OF
		0:
			doMain := FALSE;
			doStar := FALSE;
			doDelta := FALSE;
			IF diStart THEN
				nState := 1;
			END_IF

		1:
			doMain := TRUE;
			doStar := TRUE;
			tonStar(IN := TRUE, PT := T#2s);
			IF tonStar.Q THEN
				nState := 2;
			END_IF

		2:
			doDelta := TRUE;
			tonPause(IN := TRUE, PT := T#50ms);
			IF tonPause.Q THEN
				nState := 3;
			END_IF

		3:
			doStar := FALSE;
			doDelta := TRUE;

		4:
			doMain := FALSE;
			doStar := FALSE;
			doDelta := FALSE;
			doFault := TRUE;
			IF diAck THEN
				doFault := FALSE;
				nState := 0;
			END_IF
	END_CASE

	IF NOT diOverload THEN
		nState := 4;
	END_IF
	IF NOT diStop AND nState = 3 THEN
		nState := 0;
	END_IF
END_PROGRAM
`,
          var: 'VAR\n\tnState : INT;\n\ttonStar : TON;\n\ttonPause : TON;\nEND_VAR\n', typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	eState := SD_OFF;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	rtAck(CLK := diAck);
	tonStar(IN := eState = SD_STAR, PT := T#2s);
	tonPause(IN := eState = SD_PAUSE, PT := T#50ms);

	CASE eState OF
		SD_OFF:
			IF rtStart.Q AND diOverload AND diStop THEN
				eState := SD_STAR;
			END_IF

		SD_STAR:
			IF tonStar.Q THEN
				eState := SD_PAUSE;
			END_IF

		SD_PAUSE:
			IF tonPause.Q THEN
				eState := SD_DELTA;
			END_IF

		SD_DELTA:
			;

		SD_FAULT:
			IF rtAck.Q AND diOverload THEN
				eState := SD_OFF;
			END_IF
	END_CASE

	(* zentrale Abschaltbedingungen *)
	IF NOT diOverload THEN
		eState := SD_FAULT;
	ELSIF NOT diStop AND eState <> SD_FAULT THEN
		eState := SD_OFF;
	END_IF

	(* Ausgänge zentral aus dem Zustand *)
	doMain := eState = SD_STAR OR eState = SD_PAUSE OR eState = SD_DELTA;
	doStar := eState = SD_STAR;
	doDelta := eState = SD_DELTA;
	doFault := eState = SD_FAULT;
END_PROGRAM
`,
          var: 'VAR\n\teState : eStarDelta;\n\trtStart : R_TRIG;\n\trtAck : R_TRIG;\n\ttonStar : TON;\n\ttonPause : TON;\nEND_VAR\n',
          typ: 'TYPE\n\teStarDelta : (SD_OFF, SD_STAR, SD_PAUSE, SD_DELTA, SD_FAULT);\nEND_TYPE\n'
        },
        tests: [
          { name: 'Anlauf: Stern 2 s, dann Dreieck', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
            { expect: 'doMain AND doStar AND NOT doDelta', msg: 'Nach Start: Netz- und Sternschütz an.' },
            { ms: 1700 },
            { expect: 'doStar AND NOT doDelta', msg: 'Der Stern muss 2 s dauern.' },
            { ms: 500 },
            { expect: 'doMain AND doDelta AND NOT doStar', msg: 'Nach Stern und Pause: Dreieck.' }
          ]},
          { name: 'Stern und Dreieck nie gleichzeitig', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { never: 'doStar AND doDelta', msg: 'Stern- und Dreieckschütz gleichzeitig an – Kurzschluss!' },
            { never: 'doStar AND doDelta', msg: 'Stern- und Dreieckschütz gleichzeitig an – Kurzschluss!' },
            { never: 'doStar AND doDelta', msg: 'Stern- und Dreieckschütz gleichzeitig an – Kurzschluss!' }
          ]},
          { name: 'Neustart beginnt wieder mit Stern', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { ms: 3000 },
            { set: { diStop: false } }, { cycles: 3 },
            { expect: 'NOT doMain AND NOT doDelta', msg: 'Stopp muss alles abschalten.' },
            { set: { diStop: true } }, { cycles: 2 },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { ms: 1000 },
            { expect: 'doStar AND NOT doDelta', msg: 'Beim Neustart muss der Motor wieder 2 s im Stern laufen – Timer zurückgesetzt?' }
          ]},
          { name: 'Stopp wirkt auch im Stern', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { ms: 500 },
            { set: { diStop: false } }, { cycles: 3 },
            { expect: 'NOT doMain AND NOT doStar AND NOT doDelta', msg: 'Stopp im Stern muss alles abschalten.' }
          ]},
          { name: 'Überlast und Quittierung', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { ms: 3000 },
            { set: { diOverload: false } }, { cycles: 3 },
            { expect: 'doFault AND NOT doMain AND NOT doDelta', msg: 'Überlast: alles aus, Störung an.' },
            { set: { diAck: true } }, { cycles: 3 },
            { expect: 'doFault', msg: 'Quittieren darf bei weiter ausgelöstem Motorschutz nicht wirken.' },
            { set: { diAck: false } }, { cycles: 2 },
            { set: { diOverload: true } }, { cycles: 2 },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'NOT doFault AND NOT doMain', msg: 'Nach Quittierung mit intaktem Motorschutz: Grundstellung, Motor bleibt aus.' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-2-daten',
    level: 2,
    kind: 'lektion',
    title: 'Arrays, Schleifen, Strukturen und Analogwerte',
    summary: 'Du strukturierst Daten mit STRUCT und ARRAY, verarbeitest sie mit FOR-Schleifen und skalierst Analogwerte sauber.',
    minutes: 180,
    req: ['logik-2-zustand'],
    briefing: 'Sobald eine Maschine mehr als eine Handvoll Signale hat, brauchst du Datenstrukturen: Strukturen (STRUCT) fassen zusammengehörige Werte zusammen, Arrays speichern gleichartige Daten wie Rezepte, Messreihen oder Achsen. In AS6 definierst du beide in .typ-Dateien. Schleifen (FOR, WHILE, REPEAT) verarbeiten Arrays – aber immer mit Blick auf die Zykluszeit und die Array-Grenzen, denn ein Zugriff außerhalb der Grenzen ist einer der häufigsten Laufzeitfehler. Dazu kommt die Analogwertverarbeitung: Rohwerte eines X20-Analogmoduls (z. B. 0…32767) werden in physikalische Einheiten skaliert, begrenzt und gefiltert.',
    practice: 'Füllstand in Prozent, Druck in bar, Temperatur in °C – jeder Analogwert muss skaliert und plausibilisiert werden. Rezeptverwaltung mit Array of Struct steckt in jeder Verpackungs- oder Lebensmittelmaschine.',
    transfer: {
      tia: 'TIA kennt UDTs (PLC-Datentypen) und Arrays; die Skalierung übernehmen dort oft NORM_X/SCALE_X. In SCL sind FOR-Schleifen identisch.',
      codesys: 'Strukturen und Arrays werden als DUT angelegt; Array-Grenzen prüft optional die Bibliothek CheckBounds. Skalierung schreibt man meist selbst oder mit Util-Bibliotheken.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Definiere Strukturen und Arrays in einer .typ-Datei',
        guide: {
          intro: 'Strukturen fassen zusammengehörige Daten zu einem Datentyp zusammen.',
          steps: [
            'Öffne `Types.typ` in der Textansicht.',
            'Deklariere eine Struktur: `stRecipe : STRUCT sName : STRING[20]; rTemp : REAL; nSpeed : INT; END_STRUCT;`.',
            'Deklariere in der .var-Datei ein Array: `aRecipe : ARRAY[1..5] OF stRecipe;`.',
            'Greife mit `aRecipe[2].rTemp` auf ein Element zu und beobachte die Struktur im Watch (aufklappbar).'
          ],
          code: { lang: 'typ', text: 'TYPE\n\tstRecipe : STRUCT\n\t\tsName : STRING[20];\n\t\trTemp : REAL;\n\t\tnSpeed : INT;\n\tEND_STRUCT;\nEND_TYPE' },
          done: 'Erledigt, wenn du ein Array of Struct deklariert und im Watch alle Elemente gesehen hast.',
          tip: 'Lege Array-Grenzen als Konstante fest (`VAR CONSTANT MAX_RECIPES : INT := 5; END_VAR`) und nutze sie in allen Schleifen – so gibt es nur eine Stelle zum Ändern.',
          link: { label: 'B&R Help: Strukturen', url: 'https://help.br-automation.com/#/de/6/programming/datatypes/programmingmodel_datatypes_derived_struct.html' }
        }
      },
      {
        id: 'o2',
        title: 'Verarbeite Arrays mit FOR-Schleifen',
        guide: {
          intro: 'Die FOR-Schleife läuft innerhalb eines Zyklus komplett durch – sie ist kein Ablauf über mehrere Zyklen.',
          steps: [
            'Schreibe eine Schleife über alle Rezepte: `FOR i := 1 TO MAX_RECIPES DO … END_FOR;`.',
            'Suche das Maximum: Starte mit dem ersten Element und vergleiche in der Schleife.',
            'Prüfe jeden variablen Index vor dem Zugriff: `IF nIdx >= 1 AND nIdx <= MAX_RECIPES THEN …`.',
            'Beobachte, was passiert, wenn du absichtlich außerhalb der Grenzen zugreifst (in ARsim: Laufzeitfehler/Servicemodus).'
          ],
          done: 'Erledigt, wenn deine Schleife das Rezept mit der höchsten Temperatur findet und ungültige Indizes abgefangen sind.',
          tip: 'Verwende WHILE und REPEAT nur, wenn die Abbruchbedingung garantiert erreicht wird. Sonst droht eine Zykluszeitverletzung.',
          link: { label: 'B&R Help: FOR-Anweisung', url: 'https://help.br-automation.com/#/de/6/programming/programs/structuredtext/programmingmodel_programs_structuredtext_for.html' }
        }
      },
      {
        id: 'o3',
        title: 'Skaliere und begrenze einen Analogwert',
        guide: {
          intro: 'Ein Analogeingang liefert einen Rohwert, z. B. 0…32767 für 0…10 V. Daraus wird eine physikalische Größe.',
          steps: [
            'Lies im Datenblatt des Moduls (Physical View › Modul › Hilfe) den Wertebereich des Rohwerts nach.',
            'Rechne linear: `rValue := rMin + (rMax - rMin) * INT_TO_REAL(nRaw) / 32767.0;`.',
            'Begrenze mit `LIMIT(rMin, rValue, rMax)` – Rohwerte können über- oder unterlaufen.',
            'Achte auf die Typen: AS6 wandelt REAL nicht implizit in INT um – nutze `REAL_TO_INT`.'
          ],
          done: 'Erledigt, wenn 0, Halbskala und Vollausschlag exakt die erwarteten physikalischen Werte ergeben.',
          tip: 'Rechne immer in REAL und wandle erst am Ende. Ganzzahldivision `nRaw / 32767 * 100` ergibt fast immer 0.',
          link: { label: 'B&R Help: IEC 61131-3 Funktionen', url: 'https://help.br-automation.com/#/de/6/libraries/libraries/iec61131functions.html' }
        }
      },
      {
        id: 'o4',
        title: 'Filtere Messwerte mit einem Ringpuffer',
        guide: {
          intro: 'Ein gleitender Mittelwert glättet unruhige Signale, z. B. einen schwappenden Füllstand.',
          steps: [
            'Deklariere `aBuffer : ARRAY[0..9] OF REAL;` und einen Schreibindex `nIdx : INT;`.',
            'Schreibe in jedem Zyklus den neuen Wert an `aBuffer[nIdx]` und erhöhe `nIdx := (nIdx + 1) MOD 10;`.',
            'Bilde in einer FOR-Schleife die Summe und teile durch 10.',
            'Leite Grenzwertmeldungen mit Hysterese aus dem gefilterten Wert ab, damit sie nicht flattern.'
          ],
          done: 'Erledigt, wenn ein Sprung im Rohwert nach 10 Zyklen vollständig im Mittelwert angekommen ist.',
          tip: 'Die Filterzeit hängt von der Taskklasse ab: 10 Werte in 10 ms sind 100 ms Mittelung, in 100 ms schon 1 s.'
        }
      }
    ],
    videos: [
      vid('Ctylnfib1nE', 'de', 'Arrays in IEC 61131-3 – Deklaration, Zugriff, typische Fehler.'),
      vid('D8rOMnVo8Hw', 'de', 'ARRAY und FOR-Schleife am Beispiel einer Mittelwertbildung.'),
      vid('9pCY6O4GOng', 'de', 'Datentypen anlegen direkt in Automation Studio.')
    ],
    readings: [
      br('programming/datatypes/programmingmodel_datatypes_derived_arrays.html', 'Felder', 'Deklaration und Zugriff auf Arrays in AS6.', 10),
      br('programming/datatypes/programmingmodel_datatypes_derived_struct.html', 'Strukturen', 'Strukturen als abgeleitete Datentypen in AS6.', 10),
      br('programming/programs/structuredtext/programmingmodel_programs_structuredtext_for.html', 'FOR-Anweisung', 'Syntax und Verhalten der FOR-Schleife in ST.', 5)
    ],
    quiz: [
      { type: 'numeric', q: 'Ein Analogeingang liefert {N} (Bereich 0…32767 entspricht 0…10 bar). Welcher Druck in bar liegt an?',
        params: { N: [1000, 32000, 500] }, formula: 'N * 10 / 32767', unit: 'bar', tol: 0.01,
        explain: 'p = 10 bar · N / 32767.' },
      { type: 'single', q: 'Was liefert `nResult := 16000 / 32767 * 100;` mit INT-Werten?',
        options: ['48', '0', '49', 'Compilerfehler'], correct: 1,
        explain: 'Ganzzahldivision: 16000 / 32767 = 0, mal 100 bleibt 0. Erst in REAL umwandeln, dann rechnen.' },
      { type: 'single', q: 'Ein Array ist als `ARRAY[1..5] OF INT` deklariert. Was passiert bei `aValues[nIdx]` mit nIdx = 0?',
        options: ['Es wird aValues[1] gelesen', 'Es wird 0 geliefert', 'Zugriff außerhalb der Grenzen – Laufzeitfehler bzw. undefinierter Speicherzugriff', 'Das Array wird automatisch erweitert'], correct: 2,
        explain: 'Indizes müssen vor dem Zugriff geprüft werden. Je nach Konfiguration führt der Zugriff zu einem Laufzeitfehler oder überschreibt fremden Speicher.' }
    ],
    exam: [
      { type: 'single', q: 'Warum ist eine Grenzwertmeldung mit Hysterese besser als ein einfacher Vergleich `doHigh := rLevel > 90.0;`?',
        options: ['Sie ist schneller', 'Sie verhindert Flattern der Meldung, wenn der Wert um die Grenze schwankt', 'Sie braucht keinen Speicher', 'Hysterese ist in ST nicht möglich'], correct: 1,
        explain: 'Mit Ein- und Ausschaltschwelle (z. B. > 90 % ein, < 88 % aus) bleibt die Meldung stabil.' },
      { type: 'multi', q: 'Welche Aussagen zur FOR-Schleife in einer zyklischen Task sind richtig?',
        options: ['Sie läuft innerhalb eines Zyklus vollständig durch', 'Sehr große Schleifen verlängern die Laufzeit und können eine Zykluszeitverletzung auslösen', 'Die Laufvariable darf im Rumpf beliebig verändert werden', 'EXIT verlässt die Schleife vorzeitig'], correct: [0, 1, 3],
        explain: 'Die Laufvariable im Rumpf zu verändern ist schlechter Stil und kann zu Endlosschleifen führen.' },
      { type: 'numeric', q: 'Ein Ringpuffer hat {N} Elemente, die Taskklasse läuft mit 10 ms. Nach wie vielen ms ist ein Sprung des Eingangs vollständig im gleitenden Mittelwert angekommen?',
        params: { N: [5, 50, 5] }, formula: 'N * 10', unit: 'ms', tol: 0.05,
        explain: 'Nach N Zyklen ist der Puffer komplett mit neuen Werten gefüllt.' },
      { type: 'single', q: 'Welche Konvertierung ist in AS6-ST ohne Funktionsaufruf zulässig?',
        options: ['REAL → INT', 'INT → REAL', 'BOOL → INT', 'TIME → DINT'], correct: 1,
        explain: 'Ganzzahl → REAL ist verlustfrei bzw. erweiternd und implizit erlaubt; die anderen brauchen REAL_TO_INT, BOOL_TO_INT, TIME_TO_DINT.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Füllstand skalieren, filtern und überwachen',
        task: `Ein Füllstandsensor liefert über den Analogeingang **aiLevelRaw** (INT) den Rohwert 0…32767 für 0…100 %.

1. **rLevel** (REAL, %) = skalierter Rohwert, begrenzt auf 0…100 % (negative Rohwerte → 0 %).
2. **rLevelFilt** (REAL, %) = gleitender Mittelwert der **letzten 10 Werte von rLevel** (inklusive des aktuellen Zyklus). Verwende ein Array als Ringpuffer.
3. **doHigh**: an, wenn rLevelFilt **> 90 %**, aus erst, wenn rLevelFilt **< 88 %** (Hysterese).
4. **doLow**: an, wenn rLevelFilt **< 10 %**, aus erst, wenn rLevelFilt **> 12 %**.

Hinweis: AS6 wandelt REAL nicht automatisch in Ganzzahlen um. INT → REAL geht implizit oder mit INT_TO_REAL.`,
        hints: ['Skalierung: `INT_TO_REAL(aiLevelRaw) * 100.0 / 32767.0`, dann `LIMIT(0.0, …, 100.0)`.', 'Ringpuffer: `aBuf[nIdx] := rLevel; nIdx := (nIdx + 1) MOD 10;`', 'Hysterese: zwei IF – eins zum Setzen, eins zum Rücksetzen.'],
        cycleMs: 10,
        io: [
          { name: 'aiLevelRaw', type: 'INT', dir: 'in', label: 'Analogeingang Füllstand (Rohwert)', widget: 'slider', min: -1000, max: 32767 },
          { name: 'rLevel', type: 'REAL', dir: 'out', label: 'Füllstand', widget: 'gauge', min: 0, max: 100, unit: '%' },
          { name: 'rLevelFilt', type: 'REAL', dir: 'out', label: 'Füllstand gefiltert', widget: 'value', unit: '%' },
          { name: 'doHigh', type: 'BOOL', dir: 'out', label: 'Grenzwert hoch', widget: 'led' },
          { name: 'doLow', type: 'BOOL', dir: 'out', label: 'Grenzwert tief', widget: 'led' }
        ],
        scene: { type: 'tank', bind: { level: 'rLevelFilt', lsHigh: 'doHigh', lsLow: 'doLow' } },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Skalierung – noch ohne Begrenzung und Filter *)
	rLevel := INT_TO_REAL(aiLevelRaw) / 327.67;
END_PROGRAM
`, var: 'VAR\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	nIdx := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* Skalierung und Begrenzung *)
	rLevel := LIMIT(0.0, INT_TO_REAL(aiLevelRaw) * 100.0 / 32767.0, 100.0);

	(* Ringpuffer, gleitender Mittelwert über 10 Werte *)
	aBuf[nIdx] := rLevel;
	nIdx := (nIdx + 1) MOD 10;
	rSum := 0.0;
	FOR i := 0 TO 9 DO
		rSum := rSum + aBuf[i];
	END_FOR
	rLevelFilt := rSum / 10.0;

	(* Grenzwerte mit Hysterese *)
	IF rLevelFilt > 90.0 THEN
		doHigh := TRUE;
	ELSIF rLevelFilt < 88.0 THEN
		doHigh := FALSE;
	END_IF
	IF rLevelFilt < 10.0 THEN
		doLow := TRUE;
	ELSIF rLevelFilt > 12.0 THEN
		doLow := FALSE;
	END_IF
END_PROGRAM
`, var: 'VAR\n\taBuf : ARRAY[0..9] OF REAL;\n\tnIdx : INT;\n\ti : INT;\n\trSum : REAL;\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Skalierung 0 %, 50 %, 100 %', steps: [
            { set: { aiLevelRaw: 0 } }, { cycles: 2 },
            { expect: 'ABS(rLevel) < 0.01', msg: 'Rohwert 0 muss 0 % ergeben.' },
            { set: { aiLevelRaw: 16384 } }, { cycles: 2 },
            { expect: 'ABS(rLevel - 50.0) < 0.05', msg: 'Rohwert 16384 muss ca. 50 % ergeben.' },
            { set: { aiLevelRaw: 32767 } }, { cycles: 2 },
            { expect: 'ABS(rLevel - 100.0) < 0.01', msg: 'Rohwert 32767 muss genau 100 % ergeben.' }
          ]},
          { name: 'Begrenzung bei negativem Rohwert', steps: [
            { set: { aiLevelRaw: -800 } }, { cycles: 2 },
            { expect: 'rLevel >= 0.0 AND rLevel < 0.01', msg: 'Negative Rohwerte müssen auf 0 % begrenzt werden.' }
          ]},
          { name: 'Gleitender Mittelwert über 10 Werte', steps: [
            { set: { aiLevelRaw: 0 } }, { cycles: 20 },
            { set: { aiLevelRaw: 32767 } }, { cycles: 5 },
            { expect: 'ABS(rLevelFilt - 50.0) < 1.0', msg: 'Nach 5 von 10 neuen Werten muss der Mittelwert bei ca. 50 % liegen.' },
            { cycles: 5 },
            { expect: 'ABS(rLevelFilt - 100.0) < 0.1', msg: 'Nach 10 Zyklen muss der Mittelwert bei 100 % angekommen sein.' }
          ]},
          { name: 'Hysterese Grenzwert hoch', steps: [
            { set: { aiLevelRaw: 29818 } }, { cycles: 15 },
            { expect: 'doHigh', msg: '91 % muss doHigh setzen.' },
            { set: { aiLevelRaw: 29163 } }, { cycles: 15 },
            { expect: 'doHigh', msg: '89 % liegt in der Hysterese – doHigh muss an bleiben.' },
            { set: { aiLevelRaw: 28507 } }, { cycles: 15 },
            { expect: 'NOT doHigh', msg: 'Unter 88 % muss doHigh abfallen.' }
          ]},
          { name: 'Hysterese Grenzwert tief', steps: [
            { set: { aiLevelRaw: 2949 } }, { cycles: 15 },
            { expect: 'doLow', msg: '9 % muss doLow setzen.' },
            { set: { aiLevelRaw: 3604 } }, { cycles: 15 },
            { expect: 'doLow', msg: '11 % liegt in der Hysterese – doLow muss an bleiben.' },
            { set: { aiLevelRaw: 4260 } }, { cycles: 15 },
            { expect: 'NOT doLow', msg: 'Über 12 % muss doLow abfallen.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'erweitern',
        title: 'Rezeptverwaltung mit Array of Struct erweitern',
        task: `Eine Mischanlage arbeitet mit Rezepten. Der vorhandene Code legt drei Rezepte in einem Array of Struct an und gibt das gewählte Rezept aus. Erweitere ihn:

1. **Fünf Rezepte**: Ergänze Rezept 4 \`'Reinigung'\` (85,0 °C, 300 1/min) und Rezept 5 \`'Probe'\` (30,0 °C, 600 1/min).
2. **Bereichsprüfung**: Ist **nRecipeNo** kein gültiges Rezept (kleiner 1 oder größer 5), dann **doValid** = FALSE, **rSetTemp** = 0.0, **nSetSpeed** = 0, **sRecipeName** = '' – und kein Array-Zugriff außerhalb der Grenzen. Bei gültiger Nummer doValid = TRUE.
3. **nHottest**: Nummer des Rezepts mit der höchsten Temperatur (FOR-Schleife).
4. **nHotCount**: Anzahl der Rezepte mit einer Temperatur über 50,0 °C.

nHottest und nHotCount sollen auch bei ungültiger Rezeptnummer berechnet werden.`,
        hints: ['Die Array-Grenzen in der .var-Datei müssen mitwachsen.', 'Prüfe den Index, bevor du auf aRecipe[nRecipeNo] zugreifst.', 'Maximumsuche: mit Rezept 1 beginnen, dann ab 2 vergleichen.'],
        cycleMs: 10,
        io: [
          { name: 'nRecipeNo', type: 'INT', dir: 'in', label: 'Gewählte Rezeptnummer', widget: 'slider', min: 0, max: 7 },
          { name: 'doValid', type: 'BOOL', dir: 'out', label: 'Rezept gültig', widget: 'led' },
          { name: 'sRecipeName', type: 'STRING[20]', dir: 'out', label: 'Rezeptname', widget: 'value' },
          { name: 'rSetTemp', type: 'REAL', dir: 'out', label: 'Solltemperatur', widget: 'value', unit: '°C' },
          { name: 'nSetSpeed', type: 'INT', dir: 'out', label: 'Solldrehzahl', widget: 'value', unit: '1/min' },
          { name: 'nHottest', type: 'INT', dir: 'out', label: 'Heißestes Rezept', widget: 'value' },
          { name: 'nHotCount', type: 'INT', dir: 'out', label: 'Rezepte > 50 °C', widget: 'value' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT
	aRecipe[1].sName := 'Standard';
	aRecipe[1].rTemp := 60.0;
	aRecipe[1].nSpeed := 800;
	aRecipe[2].sName := 'Intensiv';
	aRecipe[2].rTemp := 75.5;
	aRecipe[2].nSpeed := 1200;
	aRecipe[3].sName := 'Schonend';
	aRecipe[3].rTemp := 45.0;
	aRecipe[3].nSpeed := 400;
END_PROGRAM

PROGRAM _CYCLIC
	sRecipeName := aRecipe[nRecipeNo].sName;
	rSetTemp := aRecipe[nRecipeNo].rTemp;
	nSetSpeed := aRecipe[nRecipeNo].nSpeed;
	doValid := TRUE;
END_PROGRAM
`,
          var: 'VAR\n\taRecipe : ARRAY[1..3] OF stRecipe;\n\ti : INT;\nEND_VAR\n',
          typ: 'TYPE\n\tstRecipe : STRUCT\n\t\tsName : STRING[20];\n\t\trTemp : REAL;\n\t\tnSpeed : INT;\n\tEND_STRUCT;\nEND_TYPE\n'
        },
        solution: {
          main: `PROGRAM _INIT
	aRecipe[1].sName := 'Standard';
	aRecipe[1].rTemp := 60.0;
	aRecipe[1].nSpeed := 800;
	aRecipe[2].sName := 'Intensiv';
	aRecipe[2].rTemp := 75.5;
	aRecipe[2].nSpeed := 1200;
	aRecipe[3].sName := 'Schonend';
	aRecipe[3].rTemp := 45.0;
	aRecipe[3].nSpeed := 400;
	aRecipe[4].sName := 'Reinigung';
	aRecipe[4].rTemp := 85.0;
	aRecipe[4].nSpeed := 300;
	aRecipe[5].sName := 'Probe';
	aRecipe[5].rTemp := 30.0;
	aRecipe[5].nSpeed := 600;
END_PROGRAM

PROGRAM _CYCLIC
	IF nRecipeNo >= 1 AND nRecipeNo <= MAX_RECIPES THEN
		sRecipeName := aRecipe[nRecipeNo].sName;
		rSetTemp := aRecipe[nRecipeNo].rTemp;
		nSetSpeed := aRecipe[nRecipeNo].nSpeed;
		doValid := TRUE;
	ELSE
		sRecipeName := '';
		rSetTemp := 0.0;
		nSetSpeed := 0;
		doValid := FALSE;
	END_IF

	nHottest := 1;
	nHotCount := 0;
	FOR i := 1 TO MAX_RECIPES DO
		IF aRecipe[i].rTemp > aRecipe[nHottest].rTemp THEN
			nHottest := i;
		END_IF
		IF aRecipe[i].rTemp > 50.0 THEN
			nHotCount := nHotCount + 1;
		END_IF
	END_FOR
END_PROGRAM
`,
          var: 'VAR CONSTANT\n\tMAX_RECIPES : INT := 5;\nEND_VAR\nVAR\n\taRecipe : ARRAY[1..5] OF stRecipe;\n\ti : INT;\nEND_VAR\n',
          typ: 'TYPE\n\tstRecipe : STRUCT\n\t\tsName : STRING[20];\n\t\trTemp : REAL;\n\t\tnSpeed : INT;\n\tEND_STRUCT;\nEND_TYPE\n'
        },
        tests: [
          { name: 'Bestehende Rezepte bleiben korrekt', steps: [
            { set: { nRecipeNo: 2 } }, { cycles: 2 },
            { expect: "doValid AND sRecipeName = 'Intensiv' AND ABS(rSetTemp - 75.5) < 0.01 AND nSetSpeed = 1200", msg: 'Rezept 2 muss Intensiv / 75,5 °C / 1200 liefern.' }
          ]},
          { name: 'Neue Rezepte 4 und 5', steps: [
            { set: { nRecipeNo: 4 } }, { cycles: 2 },
            { expect: "doValid AND sRecipeName = 'Reinigung' AND ABS(rSetTemp - 85.0) < 0.01 AND nSetSpeed = 300", msg: 'Rezept 4 fehlt oder ist falsch.' },
            { set: { nRecipeNo: 5 } }, { cycles: 2 },
            { expect: "doValid AND sRecipeName = 'Probe' AND ABS(rSetTemp - 30.0) < 0.01 AND nSetSpeed = 600", msg: 'Rezept 5 fehlt oder ist falsch.' }
          ]},
          { name: 'Ungültige Rezeptnummer 0', steps: [
            { set: { nRecipeNo: 0 } }, { cycles: 2 },
            { expect: "NOT doValid AND rSetTemp = 0.0 AND nSetSpeed = 0 AND sRecipeName = ''", msg: 'Rezept 0 ist ungültig: doValid FALSE und alle Sollwerte 0.' }
          ]},
          { name: 'Ungültige Rezeptnummer 6', steps: [
            { set: { nRecipeNo: 4 } }, { cycles: 2 },
            { set: { nRecipeNo: 6 } }, { cycles: 2 },
            { expect: 'NOT doValid AND rSetTemp = 0.0 AND nSetSpeed = 0', msg: 'Rezept 6 ist ungültig – Sollwerte dürfen nicht stehen bleiben.' }
          ]},
          { name: 'Auswertung über alle Rezepte', steps: [
            { set: { nRecipeNo: 0 } }, { cycles: 2 },
            { expect: 'nHottest = 4', msg: 'Das heißeste Rezept ist Nr. 4 (85 °C).' },
            { expect: 'nHotCount = 3', msg: 'Drei Rezepte liegen über 50 °C.' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-2-projekt-bausteine',
    level: 2,
    kind: 'projekt',
    title: 'Praxisprojekt: Eigene Funktionen und Funktionsbausteine',
    summary: 'Du kapselst Skalierung in einer FUNCTION und Pumpenlogik mit Rückmeldeüberwachung in einem FUNCTION_BLOCK – und verwendest beide mehrfach.',
    minutes: 240,
    req: ['logik-2-daten'],
    briefing: 'Copy & Paste ist der Feind wartbarer Steuerungssoftware: Zwei Pumpen mit identischer Logik bedeuten doppelten Code und doppelte Fehler. IEC 61131-3 kennt zwei Bausteinarten: Eine FUNCTION hat kein Gedächtnis und liefert für dieselben Eingänge immer dasselbe Ergebnis (z. B. Skalierung). Ein FUNCTION_BLOCK hat ein Gedächtnis (Instanzdaten) und wird pro Gerät einmal instanziiert (z. B. Pumpe mit Rückmeldeüberwachung). In AS6 legst du Funktionen und Funktionsbausteine typischerweise in einer Anwenderbibliothek an; die Schnittstelle steht in der .fun-Datei, der Code in einer .st-Datei.',
    practice: 'Jede Maschine hat Dutzende gleichartiger Aktoren – Pumpen, Ventile, Motoren. Ein gut getesteter Baustein, der 30-mal instanziiert wird, ist die Grundlage für jede spätere Bibliothek.',
    transfer: {
      tia: 'In TIA entsprechen FUNCTION und FUNCTION_BLOCK den Bausteinen FC und FB; FB-Instanzen liegen in Instanz-DBs oder als Multiinstanz im aufrufenden FB.',
      codesys: 'CODESYS: FUNCTION und FUNCTION_BLOCK als POUs, Deklaration und Code im selben Editor; Instanzen im VAR-Bereich.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lege eine Anwenderbibliothek mit Funktion und Funktionsbaustein an',
        guide: {
          intro: 'In AS6 werden eigene Funktionen und Funktionsbausteine im Knoten einer Bibliothek in der Logical View eingefügt.',
          steps: [
            'Füge über den Objektkatalog in der Logical View eine neue **IEC-Bibliothek** (Library) ein, z. B. `BtLib`.',
            'Markiere die Bibliothek und füge über die Kategorie **Function / Function Block** eine Funktion `FC_Scale` und einen Funktionsbaustein `FB_Pump` hinzu – ein Assistent führt dich durch Name, Sprache (ST) und Schnittstelle.',
            'Prüfe die Schnittstelle in der .fun-Datei (VAR_INPUT, VAR_OUTPUT, VAR) und den Code in der .st-Datei.',
            'Ordne die Bibliothek in der Configuration View der CPU zu, falls AS6 das nicht automatisch erledigt hat.'
          ],
          done: 'Erledigt, wenn `FC_Scale` und `FB_Pump` in deinem Programm aufrufbar sind und das Projekt fehlerfrei kompiliert.',
          tip: 'B&R empfiehlt, neue Funktionen zuerst mit einem einfachen Testprogramm zu prüfen, bevor man sie in einem komplexen Programm verwendet.',
          link: { label: 'B&R Help: Funktion / Funktionsblock erstellen', url: 'https://help.br-automation.com/#/de/6/libraries/libraries/userlibrary/userlibs_iec/ieclib_createfunction.html' }
        }
      },
      {
        id: 'o2',
        title: 'Schreibe eine zustandslose Skalierfunktion',
        guide: {
          intro: 'Eine Funktion gibt einen Wert zurück und hat keine Instanz.',
          steps: [
            'Definiere die Schnittstelle: `nRaw : INT; rMin : REAL; rMax : REAL;` als VAR_INPUT, Rückgabetyp REAL.',
            'Weise das Ergebnis dem Funktionsnamen zu: `FC_Scale := …;`.',
            'Begrenze den Rohwert auf 0…32767, bevor du skalierst.',
            'Rufe die Funktion zweimal mit unterschiedlichen Bereichen auf: `rPress1 := FC_Scale(aiPress1, 0.0, 10.0);`.'
          ],
          code: { lang: 'st', text: 'FUNCTION FC_Scale : REAL\n\tVAR_INPUT\n\t\tnRaw : INT;\n\t\trMin : REAL;\n\t\trMax : REAL;\n\tEND_VAR\n\tFC_Scale := rMin + (rMax - rMin) * INT_TO_REAL(LIMIT(0, nRaw, 32767)) / 32767.0;\nEND_FUNCTION' },
          done: 'Erledigt, wenn beide Kanäle mit derselben Funktion korrekt skaliert werden.',
          tip: 'Funktionen ohne Seiteneffekte lassen sich trivial testen – mache so viel Logik wie möglich zu reinen Funktionen.'
        }
      },
      {
        id: 'o3',
        title: 'Schreibe einen Funktionsbaustein mit Rückmeldeüberwachung',
        guide: {
          intro: 'Ein FB kapselt Zustand (Selbsthaltung, Timer, Fehler) und wird pro Gerät instanziiert.',
          steps: [
            'Lege die Schnittstelle fest: Eingänge `bStart, bStop, bFeedback, bReset, tMonitor`, Ausgänge `bOut, bError`.',
            'Deklariere interne Instanzen (R_TRIG, TON) im VAR-Bereich des FB – jede FB-Instanz hat dadurch eigene Timer.',
            'Programmiere: Start-Flanke setzt bOut (nur ohne Fehler), Stopp oder Fehler setzt zurück, fehlende Rückmeldung länger als tMonitor → bError.',
            'Instanziiere zweimal in der .var-Datei (`fbPump1, fbPump2 : FB_Pump;`) und rufe beide in jedem Zyklus auf.',
            'Lies die Ausgänge über die Instanz: `doPump1 := fbPump1.bOut;`.'
          ],
          done: 'Erledigt, wenn ein Rückmeldefehler an Pumpe 1 die Pumpe 2 nicht beeinflusst.',
          tip: 'Benenne Instanzen nach dem Gerät (fbPumpInlet statt fbPump1) – im Fehlerfall weiß dann jeder Servicetechniker, welche Pumpe gemeint ist.',
          link: { label: 'B&R Help: Aufruf von Funktionsblöcken', url: 'https://help.br-automation.com/#/de/6/programming/programs/structuredtext/programmingmodel_programs_structuredtext_fubinvocation.html' }
        }
      },
      {
        id: 'o4',
        title: 'Teste und reiche den Baustein ein',
        guide: {
          intro: 'Ein Baustein ist erst fertig, wenn seine Grenzfälle getestet und dokumentiert sind.',
          steps: [
            'Dokumentiere Ein- und Ausgänge im Kopfkommentar des FB (Bedeutung, Einheit, Default).',
            'Teste: Start/Stopp, Rückmeldefehler, Start während Fehler, Reset, beide Instanzen parallel.',
            'Committe Bibliothek und Programm getrennt mit klaren Nachrichten, z. B. `feat(lib): FB_Pump mit Rückmeldeüberwachung`.',
            'Reiche den Link zu deinem Repository auf git.breitner.de ein.'
          ],
          done: 'Erledigt, wenn alle automatischen Tests grün sind und der Link eingereicht ist.',
          tip: 'Ein Baustein, den du nicht in zwei Sätzen beschreiben kannst, macht zu viel. Teile ihn auf.'
        }
      }
    ],
    videos: [
      vid('HPOF_2u1TR0', 'de', 'Eigene Funktionen in Automation Studio anlegen – direkt in der AS-Oberfläche.'),
      vid('V2uiKtsWjKk', 'en', 'Funktionsbaustein in B&R Automation Studio erstellen und aufrufen.'),
      vid('HI5bQ64P814', 'de', 'Unterschied zwischen Programm, Funktionsbaustein und Funktion nach IEC 61131-3.')
    ],
    readings: [
      br('libraries/libraries/userlibrary/userlibs_iec/ieclib_createfunction.html', 'Funktion / Funktionsblock erstellen', 'Offizielle Anleitung für Funktionen und Funktionsbausteine in Anwenderbibliotheken.', 10),
      br('programming/programs/structuredtext/programmingmodel_programs_structuredtext_fubinvocation.html', 'Aufruf von Funktionsblöcken', 'Syntax des FB-Aufrufs in ST, Zugriff auf Ein- und Ausgänge.', 10),
      br('programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions_instancevariables.html', 'Instanzvariablen von Funktionsbausteinen', 'B&R-Empfehlung zur Benennung von FB-Instanzen.', 5)
    ],
    quiz: [
      { type: 'single', q: 'Wann verwendest du eine FUNCTION statt eines FUNCTION_BLOCK?',
        options: ['Wenn der Baustein sich Werte zwischen Zyklen merken muss', 'Wenn das Ergebnis nur von den aktuellen Eingängen abhängt', 'Wenn ein Timer benötigt wird', 'Immer, Funktionen sind schneller'], correct: 1,
        explain: 'Funktionen haben kein Gedächtnis. Sobald Timer, Flanken oder Selbsthaltung gebraucht werden, ist ein FB nötig.' },
      { type: 'single', q: 'Zwei Pumpen sollen dieselbe Logik verwenden. Wie viele Instanzen von FB_Pump brauchst du?',
        options: ['Eine, die man zweimal aufruft', 'Zwei – eine pro Pumpe', 'Keine, FBs braucht man nicht zu instanziieren', 'Das hängt von der Taskklasse ab'], correct: 1,
        explain: 'Jede Instanz hat eigene Zustandsdaten (Selbsthaltung, Timer). Eine gemeinsame Instanz würde die Zustände beider Pumpen vermischen.' },
      { type: 'numeric', q: 'FC_Scale(nRaw, 0.0, {M}) wird mit nRaw = 8192 aufgerufen (Bereich 0…32767). Welcher Wert ergibt sich?',
        params: { M: [10, 100, 10] }, formula: 'M * 8192 / 32767', unit: '', tol: 0.01,
        explain: 'Ergebnis = M · 8192 / 32767 ≈ M · 0,25.' }
    ],
    exam: [
      { type: 'single', q: 'In welcher Datei stehen in AS6 die Schnittstellendeklarationen von Funktionen und Funktionsbausteinen einer Bibliothek?',
        options: ['.var', '.typ', '.fun', '.st'], correct: 2,
        explain: 'Die .fun-Datei enthält die Deklaration (VAR_INPUT, VAR_OUTPUT …), der Code steht in .st.' },
      { type: 'single', q: 'Was ist hier falsch?', code: { lang: 'st', text: 'fbPump1(bStart := diStart1, bFeedback := diFb1);\nIF diStart2 THEN\n\tfbPump2(bStart := diStart2, bFeedback := diFb2);\nEND_IF' },
        options: ['Nichts', 'fbPump2 wird nur aufgerufen, solange diStart2 gedrückt ist – Überwachung und Stopp wirken sonst nicht', 'FB-Aufrufe brauchen immer alle Parameter', 'IF darf keine FB-Aufrufe enthalten'], correct: 1,
        explain: 'Ein FB muss jeden Zyklus aufgerufen werden, sonst bleiben seine Ausgänge eingefroren und interne Timer laufen nicht.' },
      { type: 'multi', q: 'Was gehört in den Kopfkommentar eines wiederverwendbaren FB?',
        options: ['Zweck in einem Satz', 'Bedeutung und Einheit aller Ein- und Ausgänge', 'Verhalten im Fehlerfall und wie quittiert wird', 'Der Name des Programmierers als einzige Information'], correct: [0, 1, 2],
        explain: 'Wer den FB verwendet, darf den Code nicht lesen müssen, um ihn richtig zu benutzen.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Zwei Pumpen mit FB_Pump und FC_Scale',
        task: `Eine Station hat zwei Pumpen mit Schützrückmeldung und zwei Drucksensoren. Schreibe **eine** Funktion und **einen** Funktionsbaustein und verwende sie für beide Pumpen bzw. Sensoren (in AS6 lägen sie in einer Bibliothek mit .fun-Datei; hier schreibst du sie oben in \`Main.st\`).

**FC_Scale(nRaw, rMin, rMax) : REAL**
- Skaliert einen Rohwert 0…32767 linear auf rMin…rMax. Rohwerte außerhalb 0…32767 werden vorher begrenzt.
- **rPress1** = Druck 1 mit 0…10 bar, **rPress2** = Druck 2 mit 0…16 bar.

**FB_Pump** – Eingänge \`bStart, bStop, bFeedback, bReset : BOOL; tMonitor : TIME\`, Ausgänge \`bOut, bError : BOOL\`
- Steigende Flanke an bStart setzt bOut (Selbsthaltung), aber nur, wenn kein Fehler ansteht.
- bStop = TRUE setzt bOut zurück.
- Ist bOut an, aber bFeedback länger als tMonitor FALSE → bError = TRUE, bOut = FALSE.
- Steigende Flanke an bReset löscht bError.

**Verdrahtung**: Pumpe 1: diStart1, Stopp-Öffner diStop1 (FALSE = betätigt), Rückmeldung diFb1 → doPump1, doErr1. Pumpe 2 entsprechend. **diReset** quittiert beide. Überwachungszeit **1 s**.
Mit diFault1/diFault2 simulierst du ein defektes Schütz (Rückmeldung bleibt aus).`,
        hints: ['Im FB brauchst du eigene Instanzen von R_TRIG und TON im VAR-Bereich.', 'Aufruf: `fbPump1(bStart := diStart1, bStop := NOT diStop1, bFeedback := diFb1, bReset := diReset, tMonitor := T#1s);`', 'LIMIT(0, nRaw, 32767) begrenzt den Rohwert.'],
        cycleMs: 10,
        io: [
          { name: 'diStart1', type: 'BOOL', dir: 'in', label: 'Start Pumpe 1', widget: 'button' },
          { name: 'diStop1', type: 'BOOL', dir: 'in', label: 'Stopp Pumpe 1 (Öffner)', widget: 'switch', init: true },
          { name: 'diStart2', type: 'BOOL', dir: 'in', label: 'Start Pumpe 2', widget: 'button' },
          { name: 'diStop2', type: 'BOOL', dir: 'in', label: 'Stopp Pumpe 2 (Öffner)', widget: 'switch', init: true },
          { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'diFault1', type: 'BOOL', dir: 'in', label: 'Simulation: Schütz 1 defekt', widget: 'switch' },
          { name: 'diFault2', type: 'BOOL', dir: 'in', label: 'Simulation: Schütz 2 defekt', widget: 'switch' },
          { name: 'diFb1', type: 'BOOL', dir: 'in', label: 'Rückmeldung Schütz 1', widget: 'led' },
          { name: 'diFb2', type: 'BOOL', dir: 'in', label: 'Rückmeldung Schütz 2', widget: 'led' },
          { name: 'aiPress1', type: 'INT', dir: 'in', label: 'Druck 1 Rohwert (0–10 bar)', widget: 'slider', min: -1000, max: 32767 },
          { name: 'aiPress2', type: 'INT', dir: 'in', label: 'Druck 2 Rohwert (0–16 bar)', widget: 'slider', min: -1000, max: 32767 },
          { name: 'doPump1', type: 'BOOL', dir: 'out', label: 'Pumpe 1', widget: 'led' },
          { name: 'doPump2', type: 'BOOL', dir: 'out', label: 'Pumpe 2', widget: 'led' },
          { name: 'doErr1', type: 'BOOL', dir: 'out', label: 'Störung Pumpe 1', widget: 'led' },
          { name: 'doErr2', type: 'BOOL', dir: 'out', label: 'Störung Pumpe 2', widget: 'led' },
          { name: 'rPress1', type: 'REAL', dir: 'out', label: 'Druck 1', widget: 'gauge', min: 0, max: 10, unit: 'bar' },
          { name: 'rPress2', type: 'REAL', dir: 'out', label: 'Druck 2', widget: 'gauge', min: 0, max: 16, unit: 'bar' }
        ],
        scene: { type: 'generic' },
        plant: {
          var: '',
          code: 'diFb1 := doPump1 AND NOT diFault1;\ndiFb2 := doPump2 AND NOT diFault2;\n'
        },
        files: {
          main: `FUNCTION FC_Scale : REAL
	VAR_INPUT
		nRaw : INT;
		rMin : REAL;
		rMax : REAL;
	END_VAR
	FC_Scale := 0.0; (* TODO *)
END_FUNCTION

FUNCTION_BLOCK FB_Pump
	VAR_INPUT
		bStart : BOOL;
		bStop : BOOL;
		bFeedback : BOOL;
		bReset : BOOL;
		tMonitor : TIME;
	END_VAR
	VAR_OUTPUT
		bOut : BOOL;
		bError : BOOL;
	END_VAR
	VAR
		(* TODO: interne Instanzen *)
	END_VAR
	(* TODO *)
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Instanzen aufrufen und Ausgänge zuweisen *)
END_PROGRAM
`, var: 'VAR\nEND_VAR\n', typ: '' },
        solution: {
          main: `(* Skaliert einen Rohwert 0..32767 linear auf rMin..rMax *)
FUNCTION FC_Scale : REAL
	VAR_INPUT
		nRaw : INT;
		rMin : REAL;
		rMax : REAL;
	END_VAR
	FC_Scale := rMin + (rMax - rMin) * INT_TO_REAL(LIMIT(0, nRaw, 32767)) / 32767.0;
END_FUNCTION

(* Pumpe mit Selbsthaltung und Rückmeldeüberwachung *)
FUNCTION_BLOCK FB_Pump
	VAR_INPUT
		bStart : BOOL;     (* Start, flankengesteuert *)
		bStop : BOOL;      (* Stopp aktiv = TRUE *)
		bFeedback : BOOL;  (* Rückmeldung Schütz *)
		bReset : BOOL;     (* Fehler quittieren, flankengesteuert *)
		tMonitor : TIME;   (* Überwachungszeit Rückmeldung *)
	END_VAR
	VAR_OUTPUT
		bOut : BOOL;
		bError : BOOL;
	END_VAR
	VAR
		rtStart : R_TRIG;
		rtReset : R_TRIG;
		tonMonitor : TON;
	END_VAR
	rtStart(CLK := bStart);
	rtReset(CLK := bReset);
	IF rtReset.Q THEN
		bError := FALSE;
	END_IF
	IF rtStart.Q AND NOT bError THEN
		bOut := TRUE;
	END_IF
	IF bStop OR bError THEN
		bOut := FALSE;
	END_IF
	tonMonitor(IN := bOut AND NOT bFeedback, PT := tMonitor);
	IF tonMonitor.Q THEN
		bError := TRUE;
		bOut := FALSE;
	END_IF
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbPump1(bStart := diStart1, bStop := NOT diStop1, bFeedback := diFb1, bReset := diReset, tMonitor := T#1s);
	fbPump2(bStart := diStart2, bStop := NOT diStop2, bFeedback := diFb2, bReset := diReset, tMonitor := T#1s);
	doPump1 := fbPump1.bOut;
	doErr1 := fbPump1.bError;
	doPump2 := fbPump2.bOut;
	doErr2 := fbPump2.bError;

	rPress1 := FC_Scale(aiPress1, 0.0, 10.0);
	rPress2 := FC_Scale(aiPress2, 0.0, 16.0);
END_PROGRAM
`, var: 'VAR\n\tfbPump1 : FB_Pump;\n\tfbPump2 : FB_Pump;\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Pumpe 1 Start und Stopp', steps: [
            { set: { diStart1: true } }, { cycles: 2 }, { set: { diStart1: false } },
            { ms: 2000 },
            { expect: 'doPump1 AND NOT doErr1', msg: 'Pumpe 1 muss nach Start laufen und mit Rückmeldung fehlerfrei bleiben.' },
            { set: { diStop1: false } }, { cycles: 2 },
            { expect: 'NOT doPump1', msg: 'Stopp muss Pumpe 1 abschalten.' }
          ]},
          { name: 'Pumpe 2 unabhängig', steps: [
            { set: { diStart2: true } }, { cycles: 2 }, { set: { diStart2: false } }, { ms: 500 },
            { expect: 'doPump2 AND NOT doPump1', msg: 'Pumpe 2 muss unabhängig von Pumpe 1 starten.' }
          ]},
          { name: 'Rückmeldefehler nach 1 s, andere Pumpe läuft weiter', steps: [
            { set: { diFault1: true } },
            { set: { diStart1: true, diStart2: true } }, { cycles: 2 }, { set: { diStart1: false, diStart2: false } },
            { ms: 800 },
            { expect: 'doPump1 AND NOT doErr1', msg: 'Der Rückmeldefehler darf nicht vor 1 s kommen.' },
            { ms: 400 },
            { expect: 'doErr1 AND NOT doPump1', msg: 'Ohne Rückmeldung muss nach 1 s die Störung kommen und die Pumpe abschalten.' },
            { expect: 'doPump2 AND NOT doErr2', msg: 'Pumpe 2 darf vom Fehler an Pumpe 1 nicht betroffen sein – eigene Instanz?' }
          ]},
          { name: 'Start gesperrt bei Fehler, Reset', steps: [
            { set: { diFault1: true } },
            { set: { diStart1: true } }, { cycles: 2 }, { set: { diStart1: false } },
            { until: 'doErr1', maxMs: 1500 },
            { set: { diStart1: true } }, { cycles: 2 }, { set: { diStart1: false } }, { cycles: 2 },
            { expect: 'NOT doPump1', msg: 'Bei anstehendem Fehler darf die Pumpe nicht starten.' },
            { set: { diFault1: false, diReset: true } }, { cycles: 2 }, { set: { diReset: false } }, { cycles: 2 },
            { expect: 'NOT doErr1', msg: 'diReset muss den Fehler löschen.' },
            { set: { diStart1: true } }, { cycles: 2 }, { set: { diStart1: false } }, { ms: 1500 },
            { expect: 'doPump1 AND NOT doErr1', msg: 'Nach Quittierung muss die Pumpe wieder starten.' }
          ]},
          { name: 'Skalierung mit einer Funktion für beide Bereiche', steps: [
            { set: { aiPress1: 16384, aiPress2: 32767 } }, { cycles: 2 },
            { expect: 'ABS(rPress1 - 5.0) < 0.01', msg: 'Halbskala an Kanal 1 muss 5 bar ergeben.' },
            { expect: 'ABS(rPress2 - 16.0) < 0.01', msg: 'Vollausschlag an Kanal 2 muss 16 bar ergeben.' },
            { set: { aiPress2: 0 } }, { cycles: 2 },
            { expect: 'ABS(rPress2) < 0.001', msg: 'Rohwert 0 muss 0 bar ergeben.' }
          ]},
          { name: 'Negative Rohwerte begrenzt', steps: [
            { set: { aiPress1: -500 } }, { cycles: 2 },
            { expect: 'rPress1 >= 0.0 AND rPress1 < 0.001', msg: 'Negative Rohwerte müssen auf 0 bar begrenzt werden.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Baustein-Entwickler'
  }
];
