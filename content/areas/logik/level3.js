// Steuerungslogik – Level 3 (Senior → Prüfung Engineer)
'use strict';
const { vid, br, R } = require('./_src');

const nevers = (expr, n, msg) => Array.from({ length: n }, () => ({ never: expr, msg }));

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

const TANK_PLANT = {
  var: 'VAR\n\trL : REAL;\n\trT : REAL := 20.0;\nEND_VAR\n',
  code: `IF doInlet THEN
	rL := rL + 20.0 * PLANT_DT;
END_IF
IF doOutlet THEN
	rL := rL - 25.0 * PLANT_DT;
END_IF
rL := LIMIT(0.0, rL, 100.0);
IF doHeater AND rL > 5.0 THEN
	rT := rT + 10.0 * PLANT_DT;
ELSIF rT > 20.0 THEN
	rT := rT - 0.5 * PLANT_DT;
END_IF
rLevel := rL;
rTemp := rT;
diLevelHigh := rL >= 80.0;
diLevelLow := rL <= 5.0;
`
};

const STATION_PLANT = {
  var: 'VAR\n\trPos : REAL;\n\trCyl : REAL;\nEND_VAR\n',
  code: `IF doBand THEN
	rPos := rPos + 0.4 * PLANT_DT;
	IF rPos >= 1.0 THEN
		rPos := 0.0;
	END_IF
END_IF
IF NOT diJam THEN
	IF doStamp THEN
		rCyl := rCyl + 2.0 * PLANT_DT;
	ELSE
		rCyl := rCyl - 2.0 * PLANT_DT;
	END_IF
END_IF
rCyl := LIMIT(0.0, rCyl, 1.0);
rPartPos := rPos;
diPartAtStation := rPos >= 0.5 AND rPos < 0.6 AND NOT diNoParts;
diStampDown := rCyl >= 0.99;
diStampUp := rCyl <= 0.01;
`
};

const STATION_IO = [
  { name: 'diAuto', type: 'BOOL', dir: 'in', label: 'Betriebsart Automatik (sonst Hand)', widget: 'switch' },
  { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start', widget: 'button' },
  { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Stopp (Öffner)', widget: 'switch', init: true },
  { name: 'diStopCycle', type: 'BOOL', dir: 'in', label: 'Stopp am Taktende', widget: 'button' },
  { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
  { name: 'diJogBand', type: 'BOOL', dir: 'in', label: 'Hand: Band tippen', widget: 'button' },
  { name: 'diJogStamp', type: 'BOOL', dir: 'in', label: 'Hand: Stempel ab', widget: 'button' },
  { name: 'diNoParts', type: 'BOOL', dir: 'in', label: 'Simulation: keine Teile', widget: 'switch' },
  { name: 'diJam', type: 'BOOL', dir: 'in', label: 'Simulation: Stempel klemmt', widget: 'switch' },
  { name: 'diPartAtStation', type: 'BOOL', dir: 'in', label: 'Teil an Station B1', widget: 'led' },
  { name: 'diStampUp', type: 'BOOL', dir: 'in', label: 'Stempel oben B2', widget: 'led' },
  { name: 'diStampDown', type: 'BOOL', dir: 'in', label: 'Stempel unten B3', widget: 'led' },
  { name: 'rPartPos', type: 'REAL', dir: 'in', label: 'Teileposition (Simulation)', widget: 'gauge', min: 0, max: 1 },
  { name: 'doBand', type: 'BOOL', dir: 'out', label: 'Bandmotor', widget: 'led' },
  { name: 'doStamp', type: 'BOOL', dir: 'out', label: 'Ventil Stempel ab (monostabil)', widget: 'led' },
  { name: 'doAutoActive', type: 'BOOL', dir: 'out', label: 'Automatik aktiv', widget: 'led' },
  { name: 'doError', type: 'BOOL', dir: 'out', label: 'Sammelstörung', widget: 'led' },
  { name: 'nErrorId', type: 'INT', dir: 'out', label: 'Fehlernummer', widget: 'value' },
  { name: 'nParts', type: 'INT', dir: 'out', label: 'Gestempelte Teile', widget: 'value' }
];

const pulse = (v) => [{ set: { [v]: true } }, { cycles: 2 }, { set: { [v]: false } }];

module.exports = [
  // ===================================================================
  {
    id: 'logik-3-maschine',
    level: 3,
    kind: 'lektion',
    title: 'Maschinenfunktion: Betriebsarten, Schrittkette, Fehlerbehandlung',
    summary: 'Du baust aus einem Automatikablauf eine echte Maschinenfunktion mit Hand/Automatik, Taktende-Stopp, Fehlernummern und Quittierung.',
    minutes: 240,
    req: ['logik-2-projekt-bausteine'],
    briefing: 'Ein Automatikablauf allein ist noch keine Maschine. Bediener brauchen Betriebsarten (Hand zum Einrichten, Automatik für die Produktion), definierte Stopp-Arten (sofort vs. am Taktende), eindeutige Fehlernummern und eine Quittierung, die nur wirkt, wenn die Ursache behoben ist. Dazu kommen Verriegelungen, die in jeder Betriebsart gelten. Typisch für diese Stufe: Du erweiterst bestehenden Code, ohne ihn zu zerstören, und testest systematisch alle Übergänge zwischen Betriebsarten und Zuständen.',
    practice: 'Inbetriebnehmer verbringen die meiste Zeit nicht im Gutablauf, sondern mit Sonderfällen: Umschalten während der Bewegung, Störung mitten im Takt, Wiederanlauf nach Quittierung. Genau dort entscheidet sich, ob eine Maschine abgenommen wird.',
    transfer: {
      tia: 'In TIA-Projekten findet man dafür oft GRAPH-Schrittketten mit Betriebsartenbaustein; das Prinzip „Betriebsart → Freigabe der Kette“ ist identisch.',
      codesys: 'CODESYS-Projekte nutzen SFC oder CASE-Ketten; PackML-orientierte Bibliotheken bringen Betriebsarten- und Zustandsmodelle mit.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Definiere Betriebsarten und deren Regeln',
        guide: {
          intro: 'Betriebsarten legen fest, wer die Aktoren steuert: der Bediener (Hand) oder die Schrittkette (Automatik).',
          steps: [
            'Schreibe für jede Betriebsart auf, welche Aktoren wie bedient werden und welche Verriegelungen gelten.',
            'Lege fest, was beim Umschalten passiert: Automatik → Hand stoppt die Kette sofort, Hand → Automatik erfordert einen neuen Start aus der Grundstellung.',
            'Ergänze den Enum um einen Zustand für Hand (z. B. ST_MANUAL) und einen Fehlerzustand.',
            'Programmiere den Betriebsartenwechsel als zentralen Block **vor** dem CASE.'
          ],
          done: 'Erledigt, wenn du für jede Kombination aus Betriebsart und Zustand weißt, was die Maschine tut.',
          tip: 'Tipptasten im Handbetrieb wirken nur, solange sie gedrückt sind, und sind gegeneinander verriegelt – beide gleichzeitig = keine Bewegung.'
        }
      },
      {
        id: 'o2',
        title: 'Vergib eindeutige Fehlernummern',
        guide: {
          intro: 'Eine Sammelstörung ohne Ursache hilft niemandem. Jede Fehlerursache bekommt eine Nummer und später einen Text.',
          steps: [
            'Lege eine Fehlertabelle an: Nummer, Ursache, Abhilfe (z. B. 1 = Ausfahren zu lange → Zylinder/Druckluft prüfen).',
            'Setze `nErrorId` beim Übergang in den Fehlerzustand und nur dort.',
            'Lösche `nErrorId` erst bei erfolgreicher Quittierung.',
            'Nutze für jede Überwachung einen eigenen Timer, damit sich Überwachungszeiten nicht addieren.'
          ],
          done: 'Erledigt, wenn jede Störung eine eigene Nummer liefert und du sie in einer Tabelle dokumentiert hast.',
          tip: 'Fehlernummern sind eine Schnittstelle zu HMI und Service. Ändere sie nie stillschweigend; später wird daraus ein Alarm im mapp AlarmX.'
        }
      },
      {
        id: 'o3',
        title: 'Implementiere Stopp sofort und Stopp am Taktende',
        guide: {
          intro: 'Stopp sofort schaltet alles ab. Stopp am Taktende lässt den laufenden Takt sauber zu Ende laufen.',
          steps: [
            'Speichere die Taktende-Anforderung in einer BOOL-Variablen (Flanke am Taster).',
            'Werte die Anforderung nur an der Stelle der Kette aus, an der ein Takt endet.',
            'Lösche die Anforderung beim Übergang in die Grundstellung.',
            'Teste: Anforderung früh im Takt, spät im Takt, doppelt gedrückt.'
          ],
          done: 'Erledigt, wenn die Maschine nach Taktende-Stopp immer in Grundstellung steht und kein Teil halb bearbeitet bleibt.',
          tip: 'Sicherheitsrelevante Stopps (Not-Halt, Schutztür) laufen über die Sicherheitstechnik – deine Logik muss nur danach einen definierten Zustand herstellen.'
        }
      },
      {
        id: 'o4',
        title: 'Diagnostiziere Schrittketten mit Trace und Haltepunkten',
        guide: {
          intro: 'Fehler in Schrittketten sind oft Ein-Zyklus-Effekte. Die Werkzeuge von AS6 machen sie sichtbar.',
          steps: [
            'Öffne den Trace (Diagnosewerkzeug in AS6, Hilfe-Stichwort „Trace“) und zeichne Zustandsvariable, Ausgänge und Sensoren auf.',
            'Wähle als Trigger den Übergang in den Fehlerzustand.',
            'Setze im Debugger Haltepunkte mit F9 und gehe mit F10/F11 schrittweise durch den Code (Achtung: an einer realen Maschine bleiben dabei die Ausgänge stehen!).',
            'Vergleiche Trace und Zustandsdiagramm: Wo weicht der tatsächliche Ablauf ab?'
          ],
          done: 'Erledigt, wenn du einen Fehler in der Übungs-Schrittkette mit Trace-Aufzeichnung nachweisen kannst.',
          tip: 'Haltepunkte an einer laufenden Maschine nur nach Absprache und im sicheren Zustand – der Trace stört den Ablauf nicht.',
          link: { label: 'B&R Help: Debugger – Haltepunkte', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/debugging/diagnosis_debugging_breakpoints.html' }
        }
      }
    ],
    videos: [
      vid('SHioximEM4M', 'de', 'Schrittketten mit CASE in ST – Aufbau, Transitionen und typische Stolperstellen.'),
      vid('wDNiReGEZGs', 'de', 'Ablaufsteuerungen systematisch: von der Schrittkette zum Programm.'),
      vid('XQqSW2CU0Qw', 'en', 'Der Logger in Automation Studio – erste Anlaufstelle bei Laufzeitfehlern.')
    ],
    readings: [
      R.plcopenSfc,
      br('diagnostics_support/diagnosis/trace/diagnosis_trace.html', 'Trace', 'Aufzeichnung von Variablen zyklusgenau – das wichtigste Diagnosewerkzeug für Schrittketten.', 15),
      br('diagnostics_support/diagnosis/debugging/diagnosis_debugging_breakpoints.html', 'Debugger - Haltepunkte', 'Haltepunkte setzen und den Code schrittweise ausführen.', 10)
    ],
    quiz: [
      { type: 'single', q: 'Der Bediener schaltet während einer Zylinderbewegung von Automatik auf Hand. Was ist das übliche Verhalten?',
        options: ['Die Kette läuft zu Ende', 'Die Kette stoppt sofort, Aktoren werden abgeschaltet, der Bediener übernimmt mit Tipptasten', 'Die Maschine geht in Störung und muss quittiert werden', 'Nichts, die Betriebsart wird erst im nächsten Takt wirksam'], correct: 1,
        explain: 'Hand bedeutet: Der Bediener steuert. Die Automatik darf nicht weiterfahren. Wiederanlauf in Automatik erfolgt aus definierter Grundstellung.' },
      { type: 'single', q: 'Warum braucht jede Bewegungsüberwachung einen eigenen Timer, wenn zwei Bewegungszustände direkt aufeinander folgen?',
        options: ['Weil TON nur einmal pro Zyklus aufgerufen werden darf', 'Weil ein gemeinsamer Timer mit durchgehend TRUE-Eingang nicht zurückgesetzt wird und die Zeiten sich addieren', 'Wegen der Zykluszeit', 'Das ist nicht nötig'], correct: 1,
        explain: 'Bleibt IN beim Zustandswechsel TRUE, läuft der Timer weiter – die zweite Bewegung hätte nur noch die Restzeit.' },
      { type: 'multi', q: 'Welche Bedingungen sollten erfüllt sein, damit eine Quittierung den Fehlerzustand verlässt?',
        options: ['Steigende Flanke am Quittiertaster', 'Die Fehlerursache ist behoben (soweit prüfbar)', 'Die Maschine fährt danach automatisch wieder los', 'Die Fehlernummer wird gelöscht'], correct: [0, 1, 3],
        explain: 'Nach der Quittierung steht die Maschine – ein neuer Start ist eine bewusste Bedienhandlung.' }
    ],
    exam: [
      { type: 'single', q: 'Was bedeutet „Stopp am Taktende“?',
        options: ['Sofortiger Halt aller Antriebe', 'Der laufende Bearbeitungstakt wird beendet, danach bleibt die Maschine in Grundstellung stehen', 'Die Maschine stoppt bei der nächsten Störung', 'Der Not-Halt wird überbrückt'], correct: 1,
        explain: 'Taktende-Stopp vermeidet halb bearbeitete Teile und hinterlässt die Maschine in Grundstellung.' },
      { type: 'single', q: 'In einer Schrittkette wird ein Ausgang in einem Schritt gesetzt, aber nirgends zurückgesetzt. Welches Fehlerbild entsteht?',
        options: ['Compilerfehler', 'Der Ausgang bleibt in allen folgenden Schritten an', 'Der Ausgang flackert', 'Keines, ST setzt Ausgänge am Zyklusende automatisch zurück'], correct: 1,
        explain: 'Variablen behalten ihren Wert. Deshalb Ausgänge zentral aus dem Zustand ableiten.' },
      { type: 'multi', q: 'Welche Verriegelungen gehören in eine Stempelstation unabhängig von der Betriebsart?',
        options: ['Band läuft nur, wenn der Stempel oben ist', 'Stempel fährt nicht, während das Band läuft', 'Im Handbetrieb sind alle Verriegelungen aufgehoben', 'Tipptasten für gegensätzliche Bewegungen sind gegeneinander verriegelt'], correct: [0, 1, 3],
        explain: 'Verriegelungen gegen Maschinenschäden gelten in allen Betriebsarten – gerade beim Einrichten.' },
      { type: 'single', q: 'Eine Schrittkette startet nach einem Durchlauf sofort erneut, obwohl der Bediener den Start-Taster nur einmal lang gedrückt hat. Ursache?',
        options: ['Zykluszeit zu kurz', 'Start wird als Pegel statt als Flanke ausgewertet', 'Ein Timer fehlt', 'Die Taskklasse ist falsch'], correct: 1,
        explain: 'Solange der Taster gedrückt ist, ist die Startbedingung im Grundzustand sofort wieder erfüllt.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Zylinderstation um Betriebsarten und Fehlerbehandlung erweitern',
        task: `Der vorhandene Code fährt einen Zylinder im Automatik-Dauertakt (Ausfahren → 0,5 s Verweilen → Einfahren → von vorn) und zählt Takte in **nCycles**. Er kennt weder Betriebsarten noch Fehler. Erweitere ihn:

1. **Betriebsart** über **diAuto**: TRUE = Automatik, FALSE = Hand.
2. **Hand**: Tipptasten **diJogOut**/**diJogIn** steuern doExtend/doRetract direkt, nur solange gedrückt. Beide gleichzeitig → keine Bewegung. In Hand läuft keine Automatik.
3. **Umschalten** Automatik → Hand während eines Takts: Kette stoppt sofort, beide Spulen aus.
4. **Automatik-Start** (Flanke **diStart**) nur aus der Grundstellung (**diIsIn**). **doAutoActive** zeigt an, dass Automatik aktiv und störungsfrei ist.
5. **Stopp am Taktende**: Flanke an **diStopCycle** → laufender Takt wird beendet, danach bleibt der Zylinder in Grundstellung stehen (erneuter Start nötig).
6. **Fehler**: Ausfahren länger als 2 s → **nErrorId = 1**, Einfahren länger als 2 s → **nErrorId = 2**. Im Fehler: beide Spulen aus, **doError** an. Flanke an **diAck** löscht Fehler und nErrorId; danach steht die Station (in Automatik ist ein neuer Start nötig).

Erweitere dafür auch den Enum in \`Types.typ\`.`,
        hints: ['Lege den Betriebsartenwechsel als zentralen Block vor das CASE.', 'Nutze zwei getrennte Timeout-Timer für Aus- und Einfahren – im Dauertakt folgen beide Zustände direkt aufeinander.', 'Die Taktende-Anforderung wird beim Erreichen der Grundstellung ausgewertet.'],
        cycleMs: 10,
        io: [
          { name: 'diAuto', type: 'BOOL', dir: 'in', label: 'Automatik (sonst Hand)', widget: 'switch' },
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start', widget: 'button' },
          { name: 'diStopCycle', type: 'BOOL', dir: 'in', label: 'Stopp am Taktende', widget: 'button' },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'diJogOut', type: 'BOOL', dir: 'in', label: 'Hand: ausfahren', widget: 'button' },
          { name: 'diJogIn', type: 'BOOL', dir: 'in', label: 'Hand: einfahren', widget: 'button' },
          { name: 'diJam', type: 'BOOL', dir: 'in', label: 'Simulation: Zylinder klemmt', widget: 'switch' },
          { name: 'diIsOut', type: 'BOOL', dir: 'in', label: 'Endlage vorn', widget: 'led' },
          { name: 'diIsIn', type: 'BOOL', dir: 'in', label: 'Endlage hinten', widget: 'led' },
          { name: 'rStroke', type: 'REAL', dir: 'in', label: 'Hub (Simulation)', widget: 'gauge', min: 0, max: 1 },
          { name: 'doExtend', type: 'BOOL', dir: 'out', label: 'Spule ausfahren', widget: 'led' },
          { name: 'doRetract', type: 'BOOL', dir: 'out', label: 'Spule einfahren', widget: 'led' },
          { name: 'doAutoActive', type: 'BOOL', dir: 'out', label: 'Automatik aktiv', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Störung', widget: 'led' },
          { name: 'nErrorId', type: 'INT', dir: 'out', label: 'Fehlernummer', widget: 'value' },
          { name: 'nCycles', type: 'INT', dir: 'out', label: 'Taktzähler', widget: 'value' }
        ],
        scene: { type: 'cylinder', bind: { extend: 'doExtend', retract: 'doRetract', isOut: 'diIsOut', isIn: 'diIsIn', stroke: 'rStroke' } },
        plant: CYL_PLANT,
        files: {
          main: `PROGRAM _INIT
	eState := ST_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	tonDwell(IN := eState = ST_DWELL, PT := T#500ms);

	CASE eState OF
		ST_IDLE:
			IF rtStart.Q THEN
				eState := ST_EXTEND;
			END_IF

		ST_EXTEND:
			IF diIsOut THEN
				eState := ST_DWELL;
			END_IF

		ST_DWELL:
			IF tonDwell.Q THEN
				eState := ST_RETRACT;
			END_IF

		ST_RETRACT:
			IF diIsIn THEN
				nCycles := nCycles + 1;
				eState := ST_EXTEND;
			END_IF
	END_CASE

	doExtend := eState = ST_EXTEND;
	doRetract := eState = ST_RETRACT;
	doAutoActive := eState <> ST_IDLE;
END_PROGRAM
`,
          var: 'VAR\n\teState : eStation;\n\trtStart : R_TRIG;\n\ttonDwell : TON;\nEND_VAR\n',
          typ: 'TYPE\n\teStation : (ST_IDLE, ST_EXTEND, ST_DWELL, ST_RETRACT);\nEND_TYPE\n'
        },
        solution: {
          main: `PROGRAM _INIT
	eState := ST_MANUAL;
	nErrorId := 0;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	rtAck(CLK := diAck);
	rtStopCycle(CLK := diStopCycle);
	tonDwell(IN := eState = ST_DWELL, PT := T#500ms);
	tonTimeoutOut(IN := eState = ST_EXTEND, PT := T#2s);
	tonTimeoutIn(IN := eState = ST_RETRACT, PT := T#2s);

	(* Betriebsartenwechsel – Fehler bleibt bis zur Quittierung *)
	IF NOT diAuto AND eState <> ST_ERROR THEN
		eState := ST_MANUAL;
		bStopRequest := FALSE;
	ELSIF diAuto AND eState = ST_MANUAL THEN
		eState := ST_IDLE;
	END_IF

	(* Taktende-Stopp merken *)
	IF rtStopCycle.Q AND (eState = ST_EXTEND OR eState = ST_DWELL OR eState = ST_RETRACT) THEN
		bStopRequest := TRUE;
	END_IF

	bExtend := FALSE;
	bRetract := FALSE;
	CASE eState OF
		ST_MANUAL:
			bExtend := diJogOut AND NOT diJogIn;
			bRetract := diJogIn AND NOT diJogOut;

		ST_IDLE:
			bStopRequest := FALSE;
			IF rtStart.Q AND diIsIn THEN
				eState := ST_EXTEND;
			END_IF

		ST_EXTEND:
			bExtend := TRUE;
			IF diIsOut THEN
				eState := ST_DWELL;
			ELSIF tonTimeoutOut.Q THEN
				nErrorId := 1;
				eState := ST_ERROR;
			END_IF

		ST_DWELL:
			IF tonDwell.Q THEN
				eState := ST_RETRACT;
			END_IF

		ST_RETRACT:
			bRetract := TRUE;
			IF diIsIn THEN
				nCycles := nCycles + 1;
				IF bStopRequest THEN
					eState := ST_IDLE;
				ELSE
					eState := ST_EXTEND;
				END_IF
			ELSIF tonTimeoutIn.Q THEN
				nErrorId := 2;
				eState := ST_ERROR;
			END_IF

		ST_ERROR:
			IF rtAck.Q THEN
				nErrorId := 0;
				IF diAuto THEN
					eState := ST_IDLE;
				ELSE
					eState := ST_MANUAL;
				END_IF
			END_IF
	END_CASE

	IF eState = ST_ERROR THEN
		bExtend := FALSE;
		bRetract := FALSE;
	END_IF
	doExtend := bExtend;
	doRetract := bRetract;
	doAutoActive := diAuto AND eState <> ST_MANUAL AND eState <> ST_ERROR;
	doError := eState = ST_ERROR;
END_PROGRAM
`,
          var: `VAR
	eState : eStation;
	rtStart : R_TRIG;
	rtAck : R_TRIG;
	rtStopCycle : R_TRIG;
	tonDwell : TON;
	tonTimeoutOut : TON;
	tonTimeoutIn : TON;
	bStopRequest : BOOL;
	bExtend : BOOL;
	bRetract : BOOL;
END_VAR
`,
          typ: 'TYPE\n\teStation : (ST_MANUAL, ST_IDLE, ST_EXTEND, ST_DWELL, ST_RETRACT, ST_ERROR);\nEND_TYPE\n'
        },
        tests: [
          { name: 'Hand: Tippbetrieb mit Verriegelung', steps: [
            { set: { diJogOut: true } }, { cycles: 2 },
            { expect: 'doExtend AND NOT doRetract', msg: 'In Hand muss diJogOut den Zylinder ausfahren.' },
            { set: { diJogOut: false } }, { cycles: 2 },
            { expect: 'NOT doExtend', msg: 'Tippbetrieb: Bewegung nur, solange die Taste gedrückt ist.' },
            { set: { diJogOut: true, diJogIn: true } }, { cycles: 2 },
            { expect: 'NOT doExtend AND NOT doRetract', msg: 'Beide Tipptasten gleichzeitig: keine Bewegung.' }
          ]},
          { name: 'Hand sperrt Automatik', steps: [
            ...pulse('diStart'),
            { never: 'doExtend OR doRetract OR doAutoActive', msg: 'Im Handbetrieb darf der Start-Taster keine Automatik auslösen.' }
          ]},
          { name: 'Automatik-Dauertakt', steps: [
            { set: { diAuto: true } }, { cycles: 2 },
            ...pulse('diStart'),
            { cycles: 2 },
            { expect: 'doAutoActive AND doExtend', msg: 'Start in Automatik aus Grundstellung muss den Takt starten.' },
            { ms: 6000 },
            { expect: 'nCycles >= 2', msg: 'Im Dauertakt müssen nach 6 s mindestens zwei Takte gezählt sein.' }
          ]},
          { name: 'Umschalten auf Hand stoppt sofort', steps: [
            { set: { diAuto: true } }, { cycles: 2 },
            ...pulse('diStart'),
            { ms: 400 },
            { set: { diAuto: false } }, { cycles: 2 },
            { expect: 'NOT doExtend AND NOT doRetract AND NOT doAutoActive', msg: 'Beim Wechsel auf Hand muss die Bewegung sofort stoppen.' }
          ]},
          { name: 'Stopp am Taktende', steps: [
            { set: { diAuto: true } }, { cycles: 2 },
            ...pulse('diStart'),
            { ms: 500 },
            ...pulse('diStopCycle'),
            { until: 'nCycles = 1', maxMs: 3000, msg: 'Der laufende Takt muss zu Ende laufen.' },
            { cycles: 2 },
            { expect: 'diIsIn AND NOT doExtend', msg: 'Nach dem Takt muss der Zylinder in Grundstellung stehen bleiben.' },
            { never: 'doExtend', msg: 'Nach Taktende-Stopp darf kein neuer Takt starten.' },
            ...pulse('diStart'),
            { until: 'doExtend', maxMs: 200, msg: 'Ein neuer Start muss wieder möglich sein.' }
          ]},
          { name: 'Fehler 1 und 2 mit Quittierung', steps: [
            { set: { diAuto: true, diJam: true } }, { cycles: 2 },
            ...pulse('diStart'),
            { until: 'doError', maxMs: 2600, msg: 'Klemmt der Zylinder beim Ausfahren, muss nach 2 s eine Störung kommen.' },
            { cycles: 2 },
            { expect: 'nErrorId = 1 AND NOT doExtend AND NOT doRetract AND NOT doAutoActive', msg: 'Ausfahrfehler: nErrorId = 1, Spulen aus.' },
            { set: { diJam: false } },
            ...pulse('diAck'), { cycles: 2 },
            { expect: 'NOT doError AND nErrorId = 0 AND NOT doExtend', msg: 'Quittierung löscht den Fehler; die Station steht.' },
            ...pulse('diStart'),
            { until: 'diIsOut', maxMs: 1500 },
            { set: { diJam: true } },
            { until: 'doError', maxMs: 3200, msg: 'Klemmt der Zylinder beim Einfahren, muss nach 2 s eine Störung kommen.' },
            { expect: 'nErrorId = 2', msg: 'Einfahrfehler: nErrorId = 2.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'fehlersuche',
        title: 'Fehlersuche: Schrittkette eines Mischbehälters',
        task: `Ein Mischbehälter arbeitet chargenweise. Der Code eines Kollegen besteht die Abnahme nicht. Finde und behebe die Fehler.

**Ablauf (Enum eMix):**
1. **MIX_IDLE**: alles aus. Steigende Flanke an **diStart** und Behälter leer (**diLevelLow**) → MIX_FILL.
2. **MIX_FILL**: Zulauf **doInlet**, bis **diLevelHigh** → MIX_HEAT.
3. **MIX_HEAT**: Heizung **doHeater** und Rührwerk **doMixer**, bis **rTemp ≥ 60 °C** → MIX_STIR.
4. **MIX_STIR**: nur Rührwerk, **3 s** → MIX_DRAIN.
5. **MIX_DRAIN**: Ablauf **doOutlet**, bis Behälter leer (**diLevelLow**) → MIX_IDLE.

Zu- und Ablauf nie gleichzeitig. **diStop** (Öffner) bricht jederzeit ab → MIX_IDLE, alles aus. Jede Charge braucht einen neuen Startimpuls.`,
        hints: ['Werden Ausgänge beim Verlassen eines Schritts wieder abgeschaltet?', 'Prüfe die Weiterschaltbedingung im Ablaufschritt.', 'Wird der Rührtimer bei jeder Charge neu gestartet?', 'Was passiert, wenn der Start-Taster gedrückt bleibt?'],
        cycleMs: 10,
        io: [
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start Charge', widget: 'button' },
          { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Stopp (Öffner)', widget: 'switch', init: true },
          { name: 'diLevelHigh', type: 'BOOL', dir: 'in', label: 'Niveau voll', widget: 'led' },
          { name: 'diLevelLow', type: 'BOOL', dir: 'in', label: 'Niveau leer', widget: 'led' },
          { name: 'rLevel', type: 'REAL', dir: 'in', label: 'Füllstand', widget: 'gauge', min: 0, max: 100, unit: '%' },
          { name: 'rTemp', type: 'REAL', dir: 'in', label: 'Temperatur', widget: 'value', unit: '°C' },
          { name: 'doInlet', type: 'BOOL', dir: 'out', label: 'Zulaufventil', widget: 'led' },
          { name: 'doOutlet', type: 'BOOL', dir: 'out', label: 'Ablaufventil', widget: 'led' },
          { name: 'doHeater', type: 'BOOL', dir: 'out', label: 'Heizung', widget: 'led' },
          { name: 'doMixer', type: 'BOOL', dir: 'out', label: 'Rührwerk', widget: 'led' }
        ],
        scene: { type: 'tank', bind: { level: 'rLevel', inlet: 'doInlet', outlet: 'doOutlet', heater: 'doHeater', temp: 'rTemp', mixer: 'doMixer', lsHigh: 'diLevelHigh', lsLow: 'diLevelLow' } },
        plant: TANK_PLANT,
        files: {
          main: `PROGRAM _INIT
	eStep := MIX_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	CASE eStep OF
		MIX_IDLE:
			doInlet := FALSE;
			doOutlet := FALSE;
			doHeater := FALSE;
			doMixer := FALSE;
			IF diStart AND diLevelLow THEN
				eStep := MIX_FILL;
			END_IF

		MIX_FILL:
			doInlet := TRUE;
			IF diLevelHigh THEN
				doInlet := FALSE;
				eStep := MIX_HEAT;
			END_IF

		MIX_HEAT:
			doHeater := TRUE;
			doMixer := TRUE;
			IF rTemp >= 60.0 THEN
				eStep := MIX_STIR;
			END_IF

		MIX_STIR:
			doMixer := TRUE;
			tonStir(IN := TRUE, PT := T#3s);
			IF tonStir.Q THEN
				doMixer := FALSE;
				eStep := MIX_DRAIN;
			END_IF

		MIX_DRAIN:
			doOutlet := TRUE;
			IF NOT diLevelHigh THEN
				doOutlet := FALSE;
				eStep := MIX_IDLE;
			END_IF
	END_CASE

	IF NOT diStop THEN
		eStep := MIX_IDLE;
	END_IF
END_PROGRAM
`,
          var: 'VAR\n\teStep : eMix;\n\ttonStir : TON;\nEND_VAR\n',
          typ: 'TYPE\n\teMix : (MIX_IDLE, MIX_FILL, MIX_HEAT, MIX_STIR, MIX_DRAIN);\nEND_TYPE\n'
        },
        solution: {
          main: `PROGRAM _INIT
	eStep := MIX_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);
	tonStir(IN := eStep = MIX_STIR, PT := T#3s);

	CASE eStep OF
		MIX_IDLE:
			IF rtStart.Q AND diLevelLow THEN
				eStep := MIX_FILL;
			END_IF

		MIX_FILL:
			IF diLevelHigh THEN
				eStep := MIX_HEAT;
			END_IF

		MIX_HEAT:
			IF rTemp >= 60.0 THEN
				eStep := MIX_STIR;
			END_IF

		MIX_STIR:
			IF tonStir.Q THEN
				eStep := MIX_DRAIN;
			END_IF

		MIX_DRAIN:
			IF diLevelLow THEN
				eStep := MIX_IDLE;
			END_IF
	END_CASE

	IF NOT diStop THEN
		eStep := MIX_IDLE;
	END_IF

	(* Ausgänge zentral aus dem Schritt *)
	doInlet := eStep = MIX_FILL;
	doHeater := eStep = MIX_HEAT;
	doMixer := eStep = MIX_HEAT OR eStep = MIX_STIR;
	doOutlet := eStep = MIX_DRAIN;
END_PROGRAM
`,
          var: 'VAR\n\teStep : eMix;\n\trtStart : R_TRIG;\n\ttonStir : TON;\nEND_VAR\n',
          typ: 'TYPE\n\teMix : (MIX_IDLE, MIX_FILL, MIX_HEAT, MIX_STIR, MIX_DRAIN);\nEND_TYPE\n'
        },
        tests: [
          { name: 'Charge: Füllen, Heizen, Rühren, Entleeren', steps: [
            ...pulse('diStart'), { cycles: 2 },
            { expect: 'doInlet AND NOT doOutlet', msg: 'Nach Start: Zulauf öffnen.' },
            { until: 'diLevelHigh', maxMs: 4500 }, { cycles: 2 },
            { expect: 'doHeater AND doMixer AND NOT doInlet', msg: 'Heizen: Heizung und Rührwerk an, Zulauf zu.' },
            { until: 'rTemp >= 60.0', maxMs: 5000 }, { cycles: 2 },
            { expect: 'doMixer AND NOT doHeater', msg: 'Rühren: Heizung muss aus sein.' },
            { ms: 2500 },
            { expect: 'doMixer AND NOT doOutlet', msg: 'Es muss 3 s gerührt werden.' },
            { ms: 700 },
            { expect: 'doOutlet AND NOT doMixer', msg: 'Nach dem Rühren: Ablauf öffnen, Rührwerk aus.' },
            { until: 'diLevelLow', maxMs: 4000, msg: 'Der Behälter muss vollständig entleert werden.' }, { cycles: 2 },
            { expect: 'NOT doOutlet AND rLevel <= 5.0', msg: 'Leer: Ablauf zu, Behälter leer.' }
          ]},
          { name: 'Zu- und Ablauf nie gleichzeitig', steps: [
            ...pulse('diStart'),
            ...nevers('doInlet AND doOutlet', 16, 'Zu- und Ablauf gleichzeitig offen.')
          ]},
          { name: 'Dauerdruck startet keine zweite Charge', steps: [
            { set: { diStart: true } },
            { ms: 16000 },
            { expect: 'NOT doOutlet AND NOT doInlet', msg: 'Nach einer Charge muss die Anlage stehen.' },
            { never: 'doInlet', msg: 'Ohne neuen Startimpuls darf keine zweite Charge starten.' }
          ]},
          { name: 'Zweite Charge rührt wieder 3 s', steps: [
            ...pulse('diStart'),
            { until: 'doOutlet', maxMs: 14000 },
            { until: 'NOT doOutlet', maxMs: 5000 }, { cycles: 2 },
            ...pulse('diStart'),
            { until: 'doMixer AND NOT doHeater', maxMs: 9000 },
            { ms: 2500 },
            { expect: 'doMixer AND NOT doOutlet', msg: 'Auch bei der zweiten Charge muss 3 s gerührt werden – Timer zurückgesetzt?' }
          ]},
          { name: 'Stopp bricht ab', steps: [
            ...pulse('diStart'),
            { until: 'doHeater', maxMs: 5000 },
            { set: { diStop: false } }, { cycles: 2 },
            { expect: 'NOT doInlet AND NOT doOutlet AND NOT doHeater AND NOT doMixer', msg: 'Stopp muss alle Ausgänge abschalten.' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-3-strings-bibliotheken',
    level: 3,
    kind: 'lektion',
    title: 'Strings, Bibliotheken und Code-Struktur in AS6',
    summary: 'Du verarbeitest Telegramme und Meldetexte mit String-Funktionen und strukturierst dein Projekt mit Paketen, Bibliotheken und Namenskonventionen.',
    minutes: 180,
    req: ['logik-3-maschine'],
    briefing: 'Sobald eine Maschine mit Scannern, Waagen, MES oder dem HMI spricht, kommen Strings ins Spiel: Telegramme zerlegen, Werte konvertieren, Meldetexte zusammensetzen. IEC 61131-3 bietet dafür LEN, LEFT, RIGHT, MID, FIND, CONCAT und Konvertierungen wie STRING_TO_INT; B&R ergänzt mit der Bibliothek AsBrStr (brsstrcpy, brsstrcat …) speichernahe Funktionen. Gleichzeitig wächst das Projekt: Packages in der Logical View, eigene und Standard-Bibliotheken, saubere Namenskonventionen und klare Programmaufteilung entscheiden darüber, ob ein Kollege sich in deinem Projekt zurechtfindet.',
    practice: 'Ein Barcode-Scanner liefert „ID=1234;W=0567;Q=OK“, das HMI braucht „Teil 1234: 567 g“. Fehlerhafte Telegramme müssen erkannt werden, statt Unsinn in die Datenbank zu schreiben.',
    transfer: {
      tia: 'SCL bietet dieselben IEC-String-Funktionen (LEN, MID, FIND, CONCAT) sowie S_CONV/STRG_VAL. Bibliotheken heißen dort Global Libraries / Projektbibliothek.',
      codesys: 'CODESYS hat die Standard-Stringfunktionen und StringUtils; Bibliotheken werden über den Bibliotheksverwalter eingebunden.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Zerlege und erzeuge Strings mit IEC-Funktionen',
        guide: {
          intro: 'Positionen in IEC-Strings beginnen bei 1. FIND liefert 0, wenn nichts gefunden wurde.',
          steps: [
            'Finde Trennzeichen: `nPos := FIND(sTelegram, \';W=\');`.',
            'Schneide Teilstrings aus: `MID(sIn, Länge, Startposition)` – Achtung, Länge steht vor Position.',
            'Konvertiere: `nWeight := STRING_TO_INT(sW);` und zurück mit `INT_TO_STRING`.',
            'Setze Texte mit CONCAT zusammen – Strings werden in AS6 nicht mit + verkettet.',
            'Prüfe vor jeder Auswertung, ob alle Trennzeichen gefunden wurden und in sinnvoller Reihenfolge stehen.'
          ],
          code: { lang: 'st', text: 'nPosW := FIND(sTelegram, \';W=\');\nsId := MID(sTelegram, nPosW - 4, 4);\nsMessage := CONCAT(\'Teil \', INT_TO_STRING(nId));' },
          done: 'Erledigt, wenn du ein gültiges Telegramm zerlegen und ein ungültiges sicher erkennen kannst.',
          tip: 'Deklariere Strings immer mit Länge (`STRING[40]`). Zu kurze Zielstrings schneiden ab – bei brsstrcpy kann es sogar fremden Speicher überschreiben.',
          link: { label: 'B&R Help: STANDARD – Funktionsbausteine und Funktionen', url: 'https://help.br-automation.com/#/de/6/libraries/standard/fbks/fbks_standard.html' }
        }
      },
      {
        id: 'o2',
        title: 'Binde Standard- und B&R-Bibliotheken ein',
        guide: {
          intro: 'Bibliotheken liegen in der Logical View im Ordner Libraries und werden über den Objektkatalog hinzugefügt.',
          steps: [
            'Öffne in der Logical View den Ordner **Libraries** und füge über den Objektkatalog eine Bibliothek hinzu (z. B. **AsBrStr**).',
            'Öffne die Hilfe zur Bibliothek mit F1 auf einem Funktionsnamen.',
            'Kopiere einen String mit `brsstrcpy(ADR(sTarget), ADR(sSource));` und vergleiche das Verhalten mit einer direkten Zuweisung.',
            'Prüfe, in welcher Version die Bibliothek vorliegt – AS6 erlaubt verschiedene Versionen je Projekt.'
          ],
          done: 'Erledigt, wenn AsBrStr eingebunden ist und du den Unterschied zwischen Zuweisung und brsstrcpy erklären kannst.',
          tip: 'Bevorzuge in ST die IEC-Zuweisung und IEC-Funktionen. brs-Funktionen brauchst du, wenn du mit Adressen arbeitest (z. B. Puffer für Kommunikation).',
          link: { label: 'B&R Help: Bibliotheksverwaltung', url: 'https://help.br-automation.com/#/de/6/projectmanagement/logicalview/libraries/projectorganisation_logicalview_libraries.html' }
        }
      },
      {
        id: 'o3',
        title: 'Strukturiere das Projekt mit Packages und Namenskonventionen',
        guide: {
          intro: 'Ein Projekt mit 40 Programmen im Wurzelordner ist nicht wartbar.',
          steps: [
            'Lege in der Logical View Packages nach Maschinenfunktionen an (z. B. `Infeed`, `Stamp`, `Outfeed`, `Common`).',
            'Halte die B&R-Namenskonventionen ein (Hilfe: Namenskonventionen) und lege eine Präfix-Tabelle im Repository ab.',
            'Lege gemeinsam genutzte Datentypen in ein eigenes Package oder eine Bibliothek, nicht doppelt in mehrere Programme.',
            'Prüfe Paketabhängigkeiten, damit keine Zyklen entstehen.'
          ],
          done: 'Erledigt, wenn deine Logical View nach Funktionen gegliedert ist und jeder Name der Konvention folgt.',
          tip: 'Ein Programm pro Maschinenfunktion, nicht pro Programmierer. So kann man Funktionen später einzeln testen, übertragen und wiederverwenden.',
          link: { label: 'B&R Help: Namenskonventionen', url: 'https://help.br-automation.com/#/de/6/programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions.html' }
        }
      }
    ],
    videos: [
      vid('a9CybsUtuBE', 'de', 'Standardbibliotheken in Automation Studio – einbinden und nutzen.'),
      vid('bVcpYIc4Bc8', 'en', 'B&R zeigt, wie AS6 Bibliotheks- und Technologieversionen pro Projekt verwaltet.'),
      vid('L4hSrbbu6yE', 'en', 'Projektmigration auf AS6 – hilfreich, wenn du ältere Projekte strukturierst.')
    ],
    readings: [
      br('libraries/standard/fbks/fbks_standard.html', 'Funktionsbausteine und Funktionen', 'Übersicht der STANDARD-Bibliothek inklusive String-Funktionen.', 15),
      br('libraries/asbrstr/asbrstr.html', 'AsBrStr', 'B&R-Bibliothek für speichernahe String- und Speicherfunktionen.', 10),
      br('programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions.html', 'Namenskonventionen', 'Offizielle B&R-Empfehlungen für Namen von Variablen, Typen und Objekten.', 15)
    ],
    quiz: [
      { type: 'single', q: "Was liefert `MID('ID=1234;W=0567', 4, 4)`?",
        options: ["'1234'", "'=123'", "';W=0'", "'D=12'"], correct: 0,
        explain: 'MID(IN, L, P): 4 Zeichen ab Position 4 – Position 1 ist „I“, also „1234“.' },
      { type: 'single', q: 'Was liefert FIND, wenn der gesuchte Teilstring nicht vorkommt?',
        options: ['-1', '0', 'Die Länge des Strings', 'Einen Laufzeitfehler'], correct: 1,
        explain: 'Positionen beginnen bei 1, daher bedeutet 0 „nicht gefunden“ – unbedingt prüfen.' },
      { type: 'single', q: 'Wie verkettest du in AS6-ST zwei Strings?',
        options: ["sA + sB", "CONCAT(sA, sB)", "sA & sB", "sA || sB"], correct: 1,
        explain: 'ST kennt keinen +-Operator für Strings; dafür gibt es CONCAT.' }
    ],
    exam: [
      { type: 'numeric', q: "Ein Telegramm lautet 'ID={N};W=12'. Die ID hat immer vier Ziffern. An welcher Position beginnt ';W='?",
        params: { N: [1000, 9999, 1] }, formula: '8', unit: '', tol: 0,
        explain: "'ID=' belegt die Positionen 1–3, die vier Ziffern 4–7, also beginnt ';W=' an Position 8 – unabhängig vom Zahlenwert." },
      { type: 'single', q: 'Warum ist `brsstrcpy(ADR(sShort), ADR(sLong));` mit sShort : STRING[10] und einem 30 Zeichen langen sLong gefährlich?',
        options: ['Gar nicht, brsstrcpy kürzt automatisch', 'brsstrcpy kennt die Zielgröße nicht und kann über das Ziel hinaus Speicher überschreiben', 'Es gibt einen Compilerfehler', 'Die Funktion ist veraltet'], correct: 1,
        explain: 'Speicherfunktionen arbeiten mit Adressen ohne Längenprüfung. Deshalb Längen prüfen oder IEC-Zuweisung verwenden.' },
      { type: 'multi', q: 'Welche Maßnahmen verbessern die Struktur eines AS6-Projekts?',
        options: ['Packages nach Maschinenfunktionen', 'Gemeinsame Datentypen zentral ablegen', 'Alle Variablen global deklarieren, damit jeder sie nutzen kann', 'Einheitliche Namenskonventionen'], correct: [0, 1, 3],
        explain: 'Globale Variablen für alles erzeugen versteckte Abhängigkeiten. Lokal, was lokal sein kann.' },
      { type: 'single', q: "Welches Ergebnis liefert `CONCAT('Teil ', INT_TO_STRING(42))`?",
        options: ["'Teil 42'", "'Teil42'", "'Teil 0042'", "Compilerfehler"], correct: 0,
        explain: 'Das Leerzeichen steht im ersten String; INT_TO_STRING liefert die Zahl ohne führende Nullen.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Scanner-Telegramm zerlegen und Meldetext bilden',
        task: `Ein Scanner liefert in **sTelegram** Telegramme der Form \`ID=1234;W=0567;Q=OK\` (ID immer 4 Ziffern, Gewicht in g, Qualität OK oder NOK). Bei steigender Flanke an **diRead** wertest du das aktuelle Telegramm aus:

- Gültig, wenn das Telegramm mit \`ID=\` beginnt, \`;W=\` und \`;Q=\` in dieser Reihenfolge vorkommen und die ID größer 0 ist.
- Gültig: **nId**, **nWeight** (INT), **doQualityOk** (TRUE bei \`OK\`), **doValid** = TRUE und **sMessage** = \`Teil 1234: 567 g\` (Zahlen ohne führende Nullen). Bei Qualität NOK hängst du \` NOK\` an: \`Teil 1234: 567 g NOK\`.
- Ungültig: **doValid** = FALSE, nId = 0, nWeight = 0, doQualityOk = FALSE, sMessage = \`Telegramm ungültig\`.
- Zwischen zwei Lesevorgängen bleiben die Ergebnisse stehen.`,
        hints: ['Positionen: `nPosW := FIND(sTelegram, \';W=\');`, `nPosQ := FIND(sTelegram, \';Q=\');`', 'ID: `MID(sTelegram, nPosW - 4, 4)`; Gewicht: `MID(sTelegram, nPosQ - nPosW - 3, nPosW + 3)`; Qualität: `RIGHT(sTelegram, LEN(sTelegram) - nPosQ - 2)`.', 'Strings vergleichst du mit =, verketten mit CONCAT.'],
        cycleMs: 10,
        io: [
          { name: 'sTelegram', type: 'STRING[40]', dir: 'in', label: 'Telegramm vom Scanner', widget: 'value' },
          { name: 'diRead', type: 'BOOL', dir: 'in', label: 'Auswerten', widget: 'button' },
          { name: 'nId', type: 'INT', dir: 'out', label: 'Teile-ID', widget: 'value' },
          { name: 'nWeight', type: 'INT', dir: 'out', label: 'Gewicht', widget: 'value', unit: 'g' },
          { name: 'doQualityOk', type: 'BOOL', dir: 'out', label: 'Qualität OK', widget: 'led' },
          { name: 'doValid', type: 'BOOL', dir: 'out', label: 'Telegramm gültig', widget: 'led' },
          { name: 'sMessage', type: 'STRING[40]', dir: 'out', label: 'Meldetext', widget: 'value' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	rtRead(CLK := diRead);
	IF rtRead.Q THEN
		(* TODO: Telegramm prüfen und zerlegen *)
		sMessage := sTelegram;
	END_IF
END_PROGRAM
`, var: 'VAR\n\trtRead : R_TRIG;\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	sMessage := '';
END_PROGRAM

PROGRAM _CYCLIC
	rtRead(CLK := diRead);
	IF rtRead.Q THEN
		nPosW := FIND(sTelegram, ';W=');
		nPosQ := FIND(sTelegram, ';Q=');
		bOk := LEFT(sTelegram, 3) = 'ID=' AND nPosW = 8 AND nPosQ > nPosW + 3;
		IF bOk THEN
			nTmpId := STRING_TO_INT(MID(sTelegram, nPosW - 4, 4));
			bOk := nTmpId > 0;
		END_IF
		IF bOk THEN
			nId := nTmpId;
			nWeight := STRING_TO_INT(MID(sTelegram, nPosQ - nPosW - 3, nPosW + 3));
			sQuality := RIGHT(sTelegram, LEN(sTelegram) - nPosQ - 2);
			doQualityOk := sQuality = 'OK';
			doValid := TRUE;
			sMessage := CONCAT(CONCAT('Teil ', INT_TO_STRING(nId)), CONCAT(': ', CONCAT(INT_TO_STRING(nWeight), ' g')));
			IF NOT doQualityOk THEN
				sMessage := CONCAT(sMessage, ' NOK');
			END_IF
		ELSE
			nId := 0;
			nWeight := 0;
			doQualityOk := FALSE;
			doValid := FALSE;
			sMessage := 'Telegramm ungültig';
		END_IF
	END_IF
END_PROGRAM
`, var: 'VAR\n\trtRead : R_TRIG;\n\tnPosW : INT;\n\tnPosQ : INT;\n\tnTmpId : INT;\n\tbOk : BOOL;\n\tsQuality : STRING[10];\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Gültiges Telegramm, Qualität OK', steps: [
            { set: { sTelegram: 'ID=1234;W=0567;Q=OK' } }, ...pulse('diRead'), { cycles: 1 },
            { expect: 'doValid AND nId = 1234 AND nWeight = 567 AND doQualityOk', msg: 'ID 1234, Gewicht 567, Qualität OK erwartet.' },
            { expect: "sMessage = 'Teil 1234: 567 g'", msg: "Meldetext muss 'Teil 1234: 567 g' lauten." }
          ]},
          { name: 'Qualität NOK', steps: [
            { set: { sTelegram: 'ID=0042;W=1200;Q=NOK' } }, ...pulse('diRead'), { cycles: 1 },
            { expect: 'doValid AND nId = 42 AND nWeight = 1200 AND NOT doQualityOk', msg: 'ID 42, Gewicht 1200, Qualität NOK erwartet.' },
            { expect: "sMessage = 'Teil 42: 1200 g NOK'", msg: "Meldetext muss 'Teil 42: 1200 g NOK' lauten." }
          ]},
          { name: 'Ungültiges Telegramm', steps: [
            { set: { sTelegram: 'ID=1234;X=0567' } }, ...pulse('diRead'), { cycles: 1 },
            { expect: "NOT doValid AND nId = 0 AND nWeight = 0 AND NOT doQualityOk AND sMessage = 'Telegramm ungültig'", msg: 'Fehlendes ;W= muss als ungültig erkannt werden.' }
          ]},
          { name: 'Falscher Anfang und ID 0', steps: [
            { set: { sTelegram: 'XX=1234;W=0567;Q=OK' } }, ...pulse('diRead'), { cycles: 1 },
            { expect: 'NOT doValid', msg: "Telegramme ohne 'ID=' am Anfang sind ungültig." },
            { set: { sTelegram: 'ID=0000;W=0567;Q=OK' } }, ...pulse('diRead'), { cycles: 1 },
            { expect: 'NOT doValid', msg: 'ID 0 ist ungültig.' }
          ]},
          { name: 'Ergebnis bleibt bis zum nächsten Lesen', steps: [
            { set: { sTelegram: 'ID=1234;W=0567;Q=OK' } }, ...pulse('diRead'), { cycles: 1 },
            { set: { sTelegram: 'Müll' } }, { cycles: 20 },
            { expect: 'doValid AND nId = 1234', msg: 'Ohne neue Flanke an diRead müssen die Ergebnisse stehen bleiben.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'erweitern',
        title: 'Meldetexte und Meldehistorie',
        task: `Der vorhandene Code setzt aus der Alarmnummer **nAlarmId** einen Meldetext **sAlarmText** zusammen. Erweitere:

1. Unbekannte Nummern (alles außer 0–4) erzeugen \`Unbekannter Alarm <Nummer>\`, z. B. \`Unbekannter Alarm 17\`.
2. **Meldehistorie**: Das Array **aHistory** (in der .var-Datei bereits vorbereitet, Index 0 = neueste Meldung) speichert die letzten **5** Meldetexte. Ein neuer Eintrag entsteht, wenn sich nAlarmId auf einen Wert **ungleich 0** ändert (auch direkt von einem Alarm auf einen anderen). Ältere Einträge rutschen nach hinten, der älteste fällt heraus.
3. **nHistoryCount** = Anzahl gültiger Einträge (höchstens 5).
4. Ein anstehender Alarm, der länger ansteht, erzeugt **keinen** weiteren Eintrag.`,
        hints: ['Merke dir die Alarmnummer des letzten Zyklus und vergleiche.', 'Verschieben von hinten nach vorn: `FOR i := 4 TO 1 BY -1 DO aHistory[i] := aHistory[i - 1]; END_FOR`', 'Zahl in Text: INT_TO_STRING, Verkettung mit CONCAT.'],
        cycleMs: 10,
        io: [
          { name: 'nAlarmId', type: 'INT', dir: 'in', label: 'Alarmnummer', widget: 'slider', min: 0, max: 20 },
          { name: 'sAlarmText', type: 'STRING[40]', dir: 'out', label: 'Aktueller Meldetext', widget: 'value' },
          { name: 'nHistoryCount', type: 'INT', dir: 'out', label: 'Einträge in der Historie', widget: 'value' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	CASE nAlarmId OF
		0: sAlarmText := '';
		1: sAlarmText := 'Not-Halt betätigt';
		2: sAlarmText := 'Schutztür offen';
		3: sAlarmText := 'Druckluft fehlt';
		4: sAlarmText := 'Motorschutz ausgelöst';
	ELSE
		sAlarmText := 'Unbekannter Alarm';
	END_CASE
END_PROGRAM
`, var: 'VAR\n\taHistory : ARRAY[0..4] OF STRING[40];\n\ti : INT;\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	nLastId := 0;
	nHistoryCount := 0;
END_PROGRAM

PROGRAM _CYCLIC
	CASE nAlarmId OF
		0: sAlarmText := '';
		1: sAlarmText := 'Not-Halt betätigt';
		2: sAlarmText := 'Schutztür offen';
		3: sAlarmText := 'Druckluft fehlt';
		4: sAlarmText := 'Motorschutz ausgelöst';
	ELSE
		sAlarmText := CONCAT('Unbekannter Alarm ', INT_TO_STRING(nAlarmId));
	END_CASE

	IF nAlarmId <> nLastId AND nAlarmId <> 0 THEN
		FOR i := 4 TO 1 BY -1 DO
			aHistory[i] := aHistory[i - 1];
		END_FOR
		aHistory[0] := sAlarmText;
		IF nHistoryCount < 5 THEN
			nHistoryCount := nHistoryCount + 1;
		END_IF
	END_IF
	nLastId := nAlarmId;
END_PROGRAM
`, var: 'VAR\n\taHistory : ARRAY[0..4] OF STRING[40];\n\ti : INT;\n\tnLastId : INT;\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Bekannte und unbekannte Texte', steps: [
            { set: { nAlarmId: 3 } }, { cycles: 2 },
            { expect: "sAlarmText = 'Druckluft fehlt'", msg: 'Alarm 3 muss „Druckluft fehlt“ liefern.' },
            { set: { nAlarmId: 17 } }, { cycles: 2 },
            { expect: "sAlarmText = 'Unbekannter Alarm 17'", msg: "Unbekannte Nummer: 'Unbekannter Alarm 17' erwartet." }
          ]},
          { name: 'Historie: neueste Meldung vorn', steps: [
            { set: { nAlarmId: 1 } }, { cycles: 3 }, { set: { nAlarmId: 0 } }, { cycles: 3 },
            { set: { nAlarmId: 3 } }, { cycles: 3 },
            { expect: "aHistory[0] = 'Druckluft fehlt' AND aHistory[1] = 'Not-Halt betätigt'", msg: 'Neueste Meldung an Index 0, ältere dahinter.' },
            { expect: 'nHistoryCount = 2', msg: 'Zwei Einträge erwartet.' }
          ]},
          { name: 'Anstehender Alarm nur einmal', steps: [
            { set: { nAlarmId: 2 } }, { cycles: 50 },
            { expect: "nHistoryCount = 1 AND aHistory[0] = 'Schutztür offen' AND aHistory[1] = ''", msg: 'Ein anstehender Alarm darf nur einen Eintrag erzeugen.' }
          ]},
          { name: 'Direkter Wechsel zwischen Alarmen', steps: [
            { set: { nAlarmId: 1 } }, { cycles: 3 }, { set: { nAlarmId: 4 } }, { cycles: 3 },
            { expect: "nHistoryCount = 2 AND aHistory[0] = 'Motorschutz ausgelöst'", msg: 'Ein Wechsel von Alarm 1 auf 4 ist ein neuer Eintrag.' }
          ]},
          { name: 'Überlauf: nur die letzten 5', steps: [
            { set: { nAlarmId: 1 } }, { cycles: 2 }, { set: { nAlarmId: 0 } }, { cycles: 2 },
            { set: { nAlarmId: 2 } }, { cycles: 2 }, { set: { nAlarmId: 0 } }, { cycles: 2 },
            { set: { nAlarmId: 3 } }, { cycles: 2 }, { set: { nAlarmId: 0 } }, { cycles: 2 },
            { set: { nAlarmId: 4 } }, { cycles: 2 }, { set: { nAlarmId: 0 } }, { cycles: 2 },
            { set: { nAlarmId: 17 } }, { cycles: 2 }, { set: { nAlarmId: 0 } }, { cycles: 2 },
            { set: { nAlarmId: 3 } }, { cycles: 2 },
            { expect: 'nHistoryCount = 5', msg: 'Die Historie fasst höchstens 5 Einträge.' },
            { expect: "aHistory[0] = 'Druckluft fehlt' AND aHistory[1] = 'Unbekannter Alarm 17' AND aHistory[4] = 'Schutztür offen'", msg: 'Der älteste Eintrag (Alarm 1) muss herausgefallen sein.' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-3-projekt-station',
    level: 3,
    kind: 'projekt',
    title: 'Praxisprojekt: Stempelstation komplett',
    summary: 'Du programmierst eine vollständige Maschinenfunktion: Förderband und Stempel mit Betriebsarten, Schrittkette, Verriegelungen, Fehlernummern und Stückzähler.',
    minutes: 360,
    req: ['logik-3-strings-bibliotheken'],
    briefing: 'Dieses Projekt ist der Nachweis für die Stufe Engineer: Du setzt eine reale Maschinenfunktion selbstständig um – von der Anforderung über Zustandsdiagramm und Fehlertabelle bis zum getesteten Code. Die Station besteht aus einem Förderband und einem pneumatischen Stempel. Teile werden zur Station gefahren, gestempelt und weitertransportiert. Hand- und Automatikbetrieb, Stopp sofort und am Taktende, Überwachungszeiten mit Fehlernummern und die Verriegelung „Band nur bei Stempel oben“ gehören dazu.',
    practice: 'Genau so sieht eine Station in einer Montagelinie aus. Wer das sauber umsetzt, kann eine reale Station bei der Inbetriebnahme selbstständig übernehmen.',
    transfer: {
      tia: 'In TIA wäre das typischerweise ein FB je Station mit GRAPH- oder SCL-Kette und einem Betriebsartenbaustein.',
      codesys: 'In CODESYS ein FB oder Programm je Station; SFC oder CASE-Kette, Alarme über AlarmManager.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erstelle Zustandsdiagramm und Fehlertabelle',
        guide: {
          intro: 'Bevor du Code schreibst, muss der Ablauf auf Papier stimmen.',
          steps: [
            'Zeichne das Zustandsdiagramm: Hand, Grundstellung, Transport, Stempel ab, Stempel halten, Stempel auf, Ausfördern, Störung.',
            'Schreibe an jeden Pfeil die Bedingung, an jeden Zustand die aktiven Ausgänge.',
            'Erstelle die Fehlertabelle: 10 = kein Teil innerhalb 4 s, 20 = Stempel erreicht untere Endlage nicht innerhalb 1 s, 21 = Stempel erreicht obere Endlage nicht innerhalb 1 s.',
            'Lege die Verriegelungen fest, die in allen Betriebsarten gelten.'
          ],
          done: 'Erledigt, wenn Diagramm und Fehlertabelle im Repository liegen.',
          tip: 'Zeige das Diagramm dem Ausbilder, bevor du programmierst – Denkfehler sind auf Papier billig.'
        }
      },
      {
        id: 'o2',
        title: 'Implementiere Kette, Betriebsarten und Verriegelungen',
        guide: {
          intro: 'Halte die Struktur ein: Eingangsaufbereitung, Betriebsart, Kette, Fehler, Ausgänge.',
          steps: [
            'Rufe alle Flanken und Timer unbedingt am Anfang auf.',
            'Programmiere den Betriebsartenwechsel und den Stopp zentral vor dem CASE.',
            'Programmiere die Kette mit Enum und CASE; setze nErrorId nur beim Übergang in die Störung.',
            'Leite die Ausgänge am Ende ab und verknüpfe sie zusätzlich mit den Verriegelungen (z. B. `doBand := bBand AND diStampUp;`).'
          ],
          done: 'Erledigt, wenn der Automatikbetrieb Teile im Dauerbetrieb stempelt und zählt.',
          tip: 'Die Verriegelung am Ausgang ist die letzte Verteidigungslinie – auch wenn die Kette einen Fehler hat, fährt das Band nicht gegen den Stempel.'
        }
      },
      {
        id: 'o3',
        title: 'Teste Sonderfälle systematisch',
        guide: {
          intro: 'Ein Testprotokoll zeigt, dass du nicht nur den Gutablauf geprüft hast.',
          steps: [
            'Lege eine Testtabelle an: Testfall, Vorbedingung, Aktion, erwartetes Ergebnis, Ergebnis.',
            'Teste: Stopp in jedem Zustand, Taktende-Stopp, Umschalten auf Hand, alle Fehlernummern, Quittierung, Wiederanlauf.',
            'Zeichne mindestens einen Fehlerfall mit dem Trace auf und lege das Bild ins Repository.',
            'Lasse alle automatischen Tests der Übung laufen.'
          ],
          done: 'Erledigt, wenn dein Testprotokoll vollständig ist und alle automatischen Tests grün sind.',
          tip: 'Teste wie ein Bediener, der die Maschine nicht kennt: falsche Reihenfolge, Doppeldruck, Umschalten im falschen Moment.'
        }
      },
      {
        id: 'o4',
        title: 'Reiche das Projekt ein',
        guide: {
          intro: 'Code, Diagramm, Fehlertabelle und Testprotokoll gehören zusammen.',
          steps: [
            'Strukturiere das Repository: `Logical/`, `docs/` (Diagramm, Fehlertabelle, Testprotokoll).',
            'Committe in sinnvollen Schritten, z. B. `feat: Automatikkette`, `feat: Handbetrieb`, `test: Testprotokoll Stempelstation`.',
            'Pushe auf git.breitner.de und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Link eingereicht ist und der Ausbilder das Projekt bestätigt hat.',
          tip: 'Eine kurze README mit Bedienungsanleitung (Was tut welcher Taster?) ist Pflicht für jede Maschine.'
        }
      }
    ],
    videos: [
      vid('wDNiReGEZGs', 'de', 'Wiederholung Ablaufsteuerungen – die Grundlage der Stationskette.'),
      vid('RsZ6IRjBbbc', 'en', 'Praxisbeispiel aus der B&R-Grundlagenreihe: Programm in AS anlegen und testen.')
    ],
    readings: [
      R.plcopenGuidelines,
      br('programming/packages/programmingmodel_packages_dependences.html', 'Abhängigkeiten von Paketen', 'Wie Packages in AS voneinander abhängen dürfen – wichtig für eine saubere Stationsstruktur.', 10),
      R.ihkRahmenplan
    ],
    quiz: [
      { type: 'single', q: 'Warum wird die Verriegelung „Band nur bei Stempel oben“ zusätzlich direkt am Ausgang programmiert?',
        options: ['Weil die Kette das nicht kann', 'Als letzte Absicherung, falls die Kette einen Fehler hat oder im Handbetrieb', 'Weil es schneller ist', 'Weil die Norm das vorschreibt'], correct: 1,
        explain: 'Verriegelungen am Ausgang wirken unabhängig von Zustand und Betriebsart.' },
      { type: 'numeric', q: 'Ein Teil fährt mit {v} m/s und muss 0,5 m bis zur Station zurücklegen. Wie groß muss die Überwachungszeit mindestens sein (Fahrzeit · 1,5)?',
        params: { v: [0.1, 1.0, 0.1] }, formula: '0.5 / v * 1.5', unit: 's', tol: 0.02,
        explain: 't = s / v · Sicherheitsfaktor.' },
      { type: 'single', q: 'Welche Fehlernummer ist nach dem Stempeln zu erwarten, wenn der Stempel nicht mehr hochfährt?',
        options: ['10', '20', '21', '0'], correct: 2,
        explain: 'Laut Fehlertabelle: 21 = obere Endlage nicht erreicht.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Tests gehören zur Abnahme einer Station?',
        options: ['Gutablauf im Dauerbetrieb', 'Stopp in jedem Zustand', 'Jede Fehlernummer einmal auslösen und quittieren', 'Nur die Tests, die beim Programmieren aufgefallen sind'], correct: [0, 1, 2],
        explain: 'Abnahmetests sind systematisch, nicht zufällig.' },
      { type: 'single', q: 'Nach einem Stopp steht ein Teil noch unter dem Stempel. Was ist eine sinnvolle Wiederanlaufstrategie?',
        options: ['Automatisch weiterfahren', 'Bediener entscheidet: in Hand ausfördern oder Teil entnehmen, dann Start aus Grundstellung', 'Stempel sofort ausfahren', 'Störung, die nur der Programmierer quittieren kann'], correct: 1,
        explain: 'Nach einem Stopp stellt der Bediener einen definierten Zustand her; die Automatik startet aus der Grundstellung.' },
      { type: 'single', q: 'Warum ist `nErrorId` eine wichtige Schnittstelle?',
        options: ['Sie wird für die Zykluszeit gebraucht', 'HMI, Alarmverwaltung und Service verlassen sich auf eindeutige, stabile Fehlernummern', 'Weil der Compiler sie verlangt', 'Sie ist nur für Tests da'], correct: 1,
        explain: 'Fehlernummern werden in Meldetexte, Dokumentation und Statistiken übernommen.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Stempelstation mit Band und Stempel',
        task: `Programmiere die Stempelstation vollständig.

**Automatik** (diAuto = TRUE, Start-Flanke **diStart** aus Grundstellung mit Stempel oben):
1. **Transport**: doBand an, bis **diPartAtStation** → Band stopp. Kommt innerhalb **4 s** kein Teil → **Fehler 10**.
2. **Stempeln**: doStamp an (monostabiles Ventil), bis **diStampDown** (Überwachung **1 s** → **Fehler 20**), dann **300 ms** halten.
3. **Abheben**: doStamp aus, bis **diStampUp** (Überwachung **1 s** → **Fehler 21**). Dann **nParts** + 1.
4. **Ausfördern**: doBand an, bis das Teil die Station verlassen hat (diPartAtStation = FALSE). Danach wieder Transport (Dauerbetrieb).
- **diStopCycle** (Flanke): nach dem Ausfördern in Grundstellung stehen bleiben.
- **diStop** (Öffner): sofort alles aus, Kette in Grundstellung, kein selbsttätiger Wiederanlauf.
- **doAutoActive**: Automatik aktiv und störungsfrei.

**Hand** (diAuto = FALSE): **diJogBand** tippt das Band, **diJogStamp** fährt den Stempel ab (solange gedrückt). Automatik ist gesperrt.

**Störung**: alles aus, **doError** an, **nErrorId** = Fehlernummer. Flanke an **diAck** löscht Fehler und Nummer; danach steht die Station.

**Verriegelungen in allen Betriebsarten**: Band nur bei Stempel oben (**diStampUp**), Stempel nur bei stehendem Band.

Simulation: Band ca. 0,4 Längen/s, Stempelhub 0,5 s. Mit **diNoParts** und **diJam** erzeugst du Fehler.`,
        hints: ['Enum z. B. ST_MANUAL, ST_IDLE, ST_TRANSPORT, ST_STAMP_DOWN, ST_STAMP_HOLD, ST_STAMP_UP, ST_OUTFEED, ST_ERROR.', 'Für jede Überwachung einen eigenen TON mit IN abhängig vom Zustand.', 'Verriegelungen zum Schluss: `doBand := bBand AND diStampUp AND NOT bStamp;`'],
        cycleMs: 10,
        io: STATION_IO,
        scene: { type: 'conveyor', bind: { motor: 'doBand', sensor: 'diPartAtStation', partPos: 'rPartPos', count: 'nParts' } },
        plant: STATION_PLANT,
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Eingangsaufbereitung *)

	(* Betriebsart und Stopp *)

	(* Schrittkette *)

	(* Ausgänge mit Verriegelungen *)
	doBand := FALSE;
	doStamp := FALSE;
END_PROGRAM
`, var: 'VAR\nEND_VAR\n', typ: 'TYPE\nEND_TYPE\n' },
        solution: {
          main: `PROGRAM _INIT
	eState := ST_MANUAL;
	nErrorId := 0;
	nParts := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* Eingangsaufbereitung *)
	rtStart(CLK := diStart);
	rtAck(CLK := diAck);
	rtStopCycle(CLK := diStopCycle);
	tonNoPart(IN := eState = ST_TRANSPORT, PT := T#4s);
	tonDown(IN := eState = ST_STAMP_DOWN, PT := T#1s);
	tonHold(IN := eState = ST_STAMP_HOLD, PT := T#300ms);
	tonUp(IN := eState = ST_STAMP_UP, PT := T#1s);

	(* Betriebsart und Stopp *)
	IF eState <> ST_ERROR THEN
		IF NOT diAuto THEN
			eState := ST_MANUAL;
		ELSIF eState = ST_MANUAL THEN
			eState := ST_IDLE;
		ELSIF NOT diStop THEN
			eState := ST_IDLE;
		END_IF
	END_IF
	IF eState = ST_MANUAL OR eState = ST_IDLE OR eState = ST_ERROR THEN
		bStopRequest := FALSE;
	ELSIF rtStopCycle.Q THEN
		bStopRequest := TRUE;
	END_IF

	(* Schrittkette *)
	bBand := FALSE;
	bStamp := FALSE;
	CASE eState OF
		ST_MANUAL:
			bBand := diJogBand;
			bStamp := diJogStamp AND NOT diJogBand;

		ST_IDLE:
			IF rtStart.Q AND diStop AND diStampUp THEN
				eState := ST_TRANSPORT;
			END_IF

		ST_TRANSPORT:
			bBand := TRUE;
			IF diPartAtStation THEN
				eState := ST_STAMP_DOWN;
			ELSIF tonNoPart.Q THEN
				nErrorId := 10;
				eState := ST_ERROR;
			END_IF

		ST_STAMP_DOWN:
			bStamp := TRUE;
			IF diStampDown THEN
				eState := ST_STAMP_HOLD;
			ELSIF tonDown.Q THEN
				nErrorId := 20;
				eState := ST_ERROR;
			END_IF

		ST_STAMP_HOLD:
			bStamp := TRUE;
			IF tonHold.Q THEN
				eState := ST_STAMP_UP;
			END_IF

		ST_STAMP_UP:
			IF diStampUp THEN
				nParts := nParts + 1;
				eState := ST_OUTFEED;
			ELSIF tonUp.Q THEN
				nErrorId := 21;
				eState := ST_ERROR;
			END_IF

		ST_OUTFEED:
			bBand := TRUE;
			IF NOT diPartAtStation THEN
				IF bStopRequest THEN
					eState := ST_IDLE;
				ELSE
					eState := ST_TRANSPORT;
				END_IF
			END_IF

		ST_ERROR:
			IF rtAck.Q THEN
				nErrorId := 0;
				IF diAuto THEN
					eState := ST_IDLE;
				ELSE
					eState := ST_MANUAL;
				END_IF
			END_IF
	END_CASE

	IF eState = ST_ERROR THEN
		bBand := FALSE;
		bStamp := FALSE;
	END_IF

	(* Ausgänge mit Verriegelungen *)
	doBand := bBand AND diStampUp AND NOT bStamp;
	doStamp := bStamp AND NOT doBand;
	doAutoActive := diAuto AND eState <> ST_MANUAL AND eState <> ST_ERROR;
	doError := eState = ST_ERROR;
END_PROGRAM
`,
          var: `VAR
	eState : eStampStation;
	rtStart : R_TRIG;
	rtAck : R_TRIG;
	rtStopCycle : R_TRIG;
	tonNoPart : TON;
	tonDown : TON;
	tonHold : TON;
	tonUp : TON;
	bStopRequest : BOOL;
	bBand : BOOL;
	bStamp : BOOL;
END_VAR
`,
          typ: 'TYPE\n\teStampStation : (ST_MANUAL, ST_IDLE, ST_TRANSPORT, ST_STAMP_DOWN, ST_STAMP_HOLD, ST_STAMP_UP, ST_OUTFEED, ST_ERROR);\nEND_TYPE\n'
        },
        tests: [
          { name: 'Automatik-Dauerbetrieb mit Verriegelung', steps: [
            { set: { diAuto: true } }, { cycles: 2 },
            ...pulse('diStart'),
            ...nevers('doBand AND NOT diStampUp', 11, 'Das Band darf nur bei Stempel oben laufen.'),
            { expect: 'nParts >= 3 AND doAutoActive', msg: 'Nach 11 s Dauerbetrieb müssen mindestens 3 Teile gestempelt sein.' }
          ]},
          { name: 'Stopp am Taktende', steps: [
            { set: { diAuto: true } }, { cycles: 2 },
            ...pulse('diStart'),
            { until: 'doStamp', maxMs: 3000 },
            ...pulse('diStopCycle'),
            { until: 'nParts = 1', maxMs: 2000, msg: 'Das begonnene Teil muss fertig gestempelt werden.' },
            { ms: 1000 },
            { expect: 'NOT doBand AND NOT doStamp AND doAutoActive', msg: 'Nach dem Ausfördern muss die Station in Grundstellung stehen.' },
            { ms: 3000 },
            { expect: 'nParts = 1', msg: 'Nach Taktende-Stopp darf kein weiteres Teil bearbeitet werden.' }
          ]},
          { name: 'Stopp sofort ohne Wiederanlauf', steps: [
            { set: { diAuto: true } }, { cycles: 2 },
            ...pulse('diStart'),
            { ms: 500 },
            { set: { diStop: false } }, { cycles: 2 },
            { expect: 'NOT doBand AND NOT doStamp', msg: 'Stopp muss sofort alles abschalten.' },
            { set: { diStop: true } },
            { never: 'doBand OR doStamp', msg: 'Nach Stopp darf die Station nicht selbsttätig wieder anlaufen.' }
          ]},
          { name: 'Fehler 10: kein Teil', steps: [
            { set: { diAuto: true, diNoParts: true } }, { cycles: 2 },
            ...pulse('diStart'),
            { ms: 3700 },
            { expect: 'NOT doError', msg: 'Fehler 10 darf nicht vor 4 s kommen.' },
            { until: 'doError', maxMs: 800, msg: 'Ohne Teil muss nach 4 s Fehler 10 kommen.' },
            { cycles: 2 },
            { expect: 'nErrorId = 10 AND NOT doBand AND NOT doAutoActive', msg: 'Fehler 10, Band aus.' },
            { set: { diNoParts: false } },
            ...pulse('diAck'), { cycles: 2 },
            { expect: 'NOT doError AND nErrorId = 0', msg: 'Quittierung löscht den Fehler.' },
            { never: 'doBand', msg: 'Nach Quittierung steht die Station bis zum nächsten Start.' }
          ]},
          { name: 'Fehler 20: Stempel klemmt', steps: [
            { set: { diAuto: true } }, { cycles: 2 },
            ...pulse('diStart'),
            { until: 'doStamp', maxMs: 3000 },
            { set: { diJam: true } },
            { until: 'doError', maxMs: 1500, msg: 'Erreicht der Stempel die untere Endlage nicht, muss nach 1 s Fehler 20 kommen.' },
            { cycles: 2 },
            { expect: 'nErrorId = 20 AND NOT doStamp AND NOT doBand', msg: 'Fehler 20, Stempel und Band aus.' }
          ]},
          { name: 'Handbetrieb mit Verriegelung', steps: [
            { set: { diJogBand: true } }, { cycles: 2 },
            { expect: 'doBand', msg: 'In Hand muss diJogBand das Band bewegen.' },
            { set: { diJogBand: false } }, { cycles: 2 },
            { expect: 'NOT doBand', msg: 'Tippbetrieb: Band nur, solange die Taste gedrückt ist.' },
            { set: { diJogStamp: true } },
            { until: 'diStampDown', maxMs: 1000, msg: 'In Hand muss diJogStamp den Stempel absenken.' },
            { set: { diJogBand: true } }, { cycles: 3 },
            { expect: 'NOT doBand', msg: 'Bei abgesenktem Stempel darf das Band auch in Hand nicht laufen.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Maschinenfunktion'
  }
];
