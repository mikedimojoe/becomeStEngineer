// Steuerungslogik – Level 4 (Engineer → Prüfung Master)
'use strict';
const { vid, br, R } = require('./_src');

const nevers = (expr, n, msg) => Array.from({ length: n }, () => ({ never: expr, msg }));
const pulse = (v) => [{ set: { [v]: true } }, { cycles: 2 }, { set: { [v]: false } }];

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

const PML_TYP = `TYPE
	ePackMLState : (
		PML_CLEARING := 1,
		PML_STOPPED := 2,
		PML_STARTING := 3,
		PML_IDLE := 4,
		PML_EXECUTE := 6,
		PML_STOPPING := 7,
		PML_ABORTING := 8,
		PML_ABORTED := 9,
		PML_HOLDING := 10,
		PML_HELD := 11,
		PML_UNHOLDING := 12,
		PML_RESETTING := 15
	);
END_TYPE
`;

module.exports = [
  // ===================================================================
  {
    id: 'logik-4-fb-design',
    level: 4,
    kind: 'lektion',
    title: 'Wiederverwendbare Bausteine: Schnittstellen, Execute/Done und Referenzen',
    summary: 'Du entwirfst Funktionsbausteine mit PLCopen-konformen Schnittstellen und übergibst Daten per Referenz (VAR_IN_OUT, ADR).',
    minutes: 240,
    req: ['logik-3-projekt-station'],
    briefing: 'Ab dieser Stufe schreibst du Bausteine, die andere verwenden. Dafür reicht „funktioniert“ nicht: Die Schnittstelle muss vorhersagbar sein. PLCopen hat dafür Konventionen etabliert, die auch mapp Technology von B&R nutzt: Execute (flankengesteuert) mit Done/Busy/Error/ErrorID, oder Enable (pegelgesteuert) mit Valid/Busy/Error. Daten, die ein Baustein verändern soll, übergibst du per Referenz – in IEC 61131-3 über VAR_IN_OUT, in B&R zusätzlich mit ADR() und dynamischen Variablen (REFERENCE TO / ACCESS). Dazu gehören klare Regeln: Jede Instanz hat ihren eigenen Zustand, jeder Baustein wird jeden Zyklus aufgerufen, Ausgänge sind nach jedem Aufruf konsistent.',
    practice: 'mapp-Bausteine wie MpAxisBasic oder die PLCopen-Motion-Bausteine (MC_MoveAbsolute …) folgen exakt diesen Regeln. Wer sie versteht, kann eigene Bausteine bauen, die sich für Kollegen „wie mapp“ anfühlen.',
    transfer: {
      tia: 'TIA nutzt dieselben PLCopen-Regeln für Technologie-Objekte (MC_*); Referenzen gibt es über InOut-Parameter und REF_TO / VARIANT.',
      codesys: 'CODESYS: VAR_IN_OUT, POINTER TO und REFERENCE TO; zusätzlich Methoden, Properties und Interfaces für objektorientierte Bausteine.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Wende das Execute/Done/Busy/Error-Verhalten an',
        guide: {
          intro: 'Die PLCopen-Regeln machen das Verhalten eines Bausteins vorhersagbar.',
          steps: [
            'Lies in „Creating PLCopen Compliant Libraries“ das Verhalten von Execute und den Ausgängen nach.',
            'Regel 1: Eine **steigende Flanke** an Execute startet die Aktion; Busy ist TRUE, solange sie läuft.',
            'Regel 2: Done bzw. Error bleiben gesetzt, solange Execute TRUE ist, und werden mit Execute = FALSE zurückgesetzt.',
            'Regel 3: Fällt Execute vor dem Ende ab, läuft die Aktion weiter; Done bzw. Error werden dann für **genau einen Zyklus** gesetzt.',
            'Regel 4: Done, Busy und Error sind nie gleichzeitig TRUE.'
          ],
          done: 'Erledigt, wenn du das Zeitdiagramm Execute/Busy/Done für beide Fälle (Execute lang, Execute kurz) zeichnen kannst.',
          tip: 'Teste deinen Baustein mit einem Execute-Impuls von einem Zyklus – genau so rufen Schrittketten ihn oft auf.',
          link: { label: 'PLCopen: Creating PLCopen Compliant Libraries', url: 'https://www.plcopen.org/download_file/view/7ea712b1-1f89-43fc-870c-6006e415956f/' }
        }
      },
      {
        id: 'o2',
        title: 'Übergib Daten per Referenz mit VAR_IN_OUT',
        guide: {
          intro: 'VAR_INPUT kopiert den Wert in die Instanz; Änderungen im Baustein kommen beim Aufrufer nicht an. VAR_IN_OUT arbeitet direkt auf der Variablen des Aufrufers.',
          steps: [
            'Deklariere im FB `VAR_IN_OUT nCount : INT; END_VAR`.',
            'Rufe ihn mit einer Variablen auf: `fbCountA(bIn := doA, nCount := stStats.nCountA);` – Konstanten oder Ausdrücke sind für VAR_IN_OUT nicht erlaubt.',
            'Vergleiche das Verhalten mit einer Variante, in der nCount ein VAR_INPUT ist.',
            'Nutze VAR_IN_OUT für große Strukturen (z. B. Rezept, Achsdaten), um Kopien zu vermeiden.'
          ],
          done: 'Erledigt, wenn ein Baustein eine Variable des Aufrufers zuverlässig verändert.',
          tip: 'Ein VAR_IN_OUT ist eine versteckte Abhängigkeit – dokumentiere im Kopfkommentar, was der Baustein dort schreibt.'
        }
      },
      {
        id: 'o3',
        title: 'Verstehe ADR() und dynamische Variablen in AS6',
        guide: {
          intro: 'B&R-Bibliotheken arbeiten oft mit Adressen: ADR() liefert die Speicheradresse, REFERENCE TO und ACCESS binden eine dynamische Variable daran.',
          steps: [
            'Lies in der B&R-Hilfe „Dynamische Variablen“: `pValue : REFERENCE TO REAL;` und `pValue ACCESS ADR(rTarget);`.',
            'Nutze ADR() bei Bibliotheksfunktionen, z. B. `brsmemset(ADR(stData), 0, SIZEOF(stData));` zum Löschen einer Struktur.',
            'Prüfe vor jedem ACCESS, dass die Adresse gültig ist (ungleich 0) und der Datentyp passt.',
            'Vergleiche: Wann reicht VAR_IN_OUT, wann brauchst du eine dynamische Variable (z. B. Auswahl eines Datensatzes zur Laufzeit)?'
          ],
          code: { lang: 'st', text: '(* Struktur sicher löschen *)\nbrsmemset(ADR(stRecipe), 0, SIZEOF(stRecipe));\n(* Dynamische Variable *)\npActual ACCESS ADR(aRecipe[nIdx]);' },
          done: 'Erledigt, wenn du erklären kannst, warum `brsmemset(ADR(x), 0, 1000)` bei einer 40-Byte-Struktur gefährlich ist.',
          tip: 'Verwende immer SIZEOF() statt fester Längen – bei einer Strukturänderung stimmt die Länge sonst nicht mehr.',
          link: { label: 'B&R Help: Dynamische Variablen', url: 'https://help.br-automation.com/#/de/6/programming/variables/programmingmodel_variables_dynamic.html' }
        }
      },
      {
        id: 'o4',
        title: 'Prüfe Bausteine auf Instanz- und Aufruffehler',
        guide: {
          intro: 'Die häufigsten FB-Fehler sind keine Logikfehler, sondern Nutzungsfehler.',
          steps: [
            'Suche mit Strg+Umschalt+F nach allen Aufrufen einer Instanz – kommt sie mehrfach vor?',
            'Prüfe, ob jede Instanz in jedem Zyklus genau einmal aufgerufen wird (nicht in IF/CASE versteckt).',
            'Prüfe, ob Ausgänge erst nach dem Aufruf gelesen werden.',
            'Nutze die Querverweisliste (Strg+Alt+R), um Schreibzugriffe auf eine Variable zu finden.'
          ],
          done: 'Erledigt, wenn du in der Fehlersuche-Übung alle Nutzungsfehler gefunden hast.',
          tip: 'Ein Baustein pro Gerät, ein Aufruf pro Zyklus, Aufruf vor dem Lesen der Ausgänge – diese drei Regeln verhindern die meisten Probleme.',
          link: { label: 'B&R Help: Instanzvariablen von Funktionsbausteinen', url: 'https://help.br-automation.com/#/de/6/programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions_instancevariables.html' }
        }
      }
    ],
    videos: [
      vid('G8zK-QkTVoE', 'de', 'Funktionsbaustein für einen Zylinder in ST – Schnittstellenentwurf an einem Praxisbeispiel.'),
      vid('q9DEAzAAZec', 'de', 'Einzelsteuerfunktionen: wie man Aktoren einheitlich kapselt.'),
      vid('WqIBhiW2LOg', 'de', 'Pointer und Referenzen in IEC 61131-3 – Hintergrund zu ADR und REFERENCE TO.')
    ],
    readings: [
      R.plcopenLibraries,
      br('programming/variables/programmingmodel_variables_dynamic.html', 'Dynamische Variablen', 'REFERENCE TO und ACCESS in AS6 mit Beispielen.', 15),
      br('libraries/operator/fbks/adr.html', 'OPERATOR - ADR()', 'Beschreibung der ADR-Funktion in AS6.', 5)
    ],
    quiz: [
      { type: 'single', q: 'Execute wird nach 2 Zyklen wieder FALSE, die Bewegung dauert 1 s. Wie verhält sich Done nach PLCopen?',
        options: ['Done wird nie gesetzt', 'Done ist nach Ende der Bewegung genau einen Zyklus TRUE', 'Done bleibt bis zum nächsten Execute TRUE', 'Die Bewegung wird abgebrochen'], correct: 1,
        explain: 'Die Aktion läuft weiter; Done wird für einen Zyklus angezeigt, damit der Aufrufer das Ende erkennen kann.' },
      { type: 'single', q: 'Ein FB soll einen Zähler des Aufrufers erhöhen. Welche Deklaration ist richtig?',
        options: ['VAR_INPUT nCount : INT;', 'VAR_OUTPUT nCount : INT;', 'VAR_IN_OUT nCount : INT;', 'VAR nCount : INT;'], correct: 2,
        explain: 'Nur VAR_IN_OUT wirkt direkt auf der Variablen des Aufrufers.' },
      { type: 'multi', q: 'Welche Aussagen zu Enable-Bausteinen (z. B. MpAxisBasic) sind richtig?',
        options: ['Enable ist pegelgesteuert', 'Solange Enable TRUE ist, arbeitet der Baustein kontinuierlich', 'Enable muss als Flanke kommen', 'Mit Enable = FALSE wird der Baustein deaktiviert'], correct: [0, 1, 3],
        explain: 'Enable-Bausteine arbeiten, solange Enable anliegt; Execute-Bausteine reagieren auf die Flanke.' }
    ],
    exam: [
      { type: 'single', q: 'Was ist an diesem Aufruf falsch?', code: { lang: 'st', text: 'fbDeb(bIn := diSensorA, tDelay := T#50ms);\ndoA := fbDeb.bOut;\nfbDeb(bIn := diSensorB, tDelay := T#50ms);\ndoB := fbDeb.bOut;' },
        options: ['Nichts', 'Eine Instanz wird für zwei Signale verwendet; die internen Timer vermischen beide Zustände', 'T#50ms ist zu kurz', 'Ausgänge dürfen nicht direkt zugewiesen werden'], correct: 1,
        explain: 'Jede Instanz hat genau ein Gedächtnis. Zwei Signale brauchen zwei Instanzen.' },
      { type: 'single', q: 'Warum ist `brsmemset(ADR(stData), 0, 200);` riskanter als `brsmemset(ADR(stData), 0, SIZEOF(stData));`?',
        options: ['Es ist langsamer', 'Ist stData kleiner als 200 Byte, wird fremder Speicher überschrieben', 'SIZEOF ist in AS6 nicht erlaubt', 'Es gibt keinen Unterschied'], correct: 1,
        explain: 'Speicherfunktionen kennen keine Typgrenzen; nur SIZEOF hält die Länge automatisch passend.' },
      { type: 'multi', q: 'Was gehört zu einer guten FB-Schnittstelle?',
        options: ['Einheitliches Verhalten (Execute/Done oder Enable/Valid)', 'ErrorID mit dokumentierten Werten', 'Interne Zwischenvariablen als VAR_OUTPUT, damit man alles sieht', 'Parameter mit Einheit im Kommentar'], correct: [0, 1, 3],
        explain: 'Interne Variablen gehören in VAR; die Schnittstelle bleibt schlank und stabil.' },
      { type: 'single', q: 'Ein FB wird nur innerhalb von `IF bAuto THEN … END_IF` aufgerufen. Was passiert beim Wechsel auf bAuto = FALSE während Busy?',
        options: ['Der FB bricht sauber ab', 'Der FB wird nicht mehr bearbeitet, Ausgänge (z. B. Ventile) bleiben in ihrem letzten Zustand', 'Der FB setzt Error', 'Die Runtime ruft den FB automatisch weiter auf'], correct: 1,
        explain: 'Ohne Aufruf passiert nichts – auch kein Abschalten. Deshalb FBs immer aufrufen und Freigaben als Eingang übergeben.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'FB_CylMove mit PLCopen-Schnittstelle',
        task: `Schreibe den Funktionsbaustein **FB_CylMove** für einen Zylinder mit bistabilem Ventil – mit PLCopen-konformem Execute-Verhalten. In AS6 läge die Schnittstelle in der .fun-Datei einer Bibliothek; hier schreibst du ihn oben in \`Main.st\`.

**Schnittstelle**
- VAR_INPUT: \`Execute : BOOL; ToWork : BOOL; Timeout : TIME; IsOut : BOOL; IsIn : BOOL;\` (ToWork = TRUE → ausfahren, FALSE → einfahren)
- VAR_OUTPUT: \`Done, Busy, Error : BOOL; ErrorID : UINT; Extend, Retract : BOOL;\`

**Verhalten**
1. Steigende Flanke an Execute übernimmt ToWork und startet die Bewegung (**Busy**). Weitere Flanken während Busy werden ignoriert.
2. Ziel-Endlage erreicht → Busy FALSE, **Done** TRUE (auch sofort, wenn der Zylinder schon dort steht).
3. Ziel nicht innerhalb Timeout erreicht → **Error**, **ErrorID** = 16#1001 (Ausfahren) bzw. 16#1002 (Einfahren), Ventile aus.
4. Done, Error und ErrorID bleiben, solange Execute TRUE ist; Execute = FALSE setzt sie zurück. Ist Execute bei Ende der Bewegung schon FALSE, sind Done bzw. Error **genau einen Zyklus** sichtbar.
5. **Extend** bzw. **Retract** nur während Busy.

Das Programm ruft eine Instanz mit Timeout 2 s auf und gibt die Ausgänge auf die I/O.`,
        hints: ['Merke dir den Abschluss in einer Hilfsvariablen bJustFinished, die am Anfang jedes Aufrufs FALSE wird.', 'Rücksetzen: `IF NOT Execute AND NOT Busy AND NOT bJustFinished THEN Done := FALSE; …`', 'SEL(G, IN0, IN1) liefert IN1 bei G = TRUE.'],
        cycleMs: 10,
        io: [
          { name: 'diExecute', type: 'BOOL', dir: 'in', label: 'Execute', widget: 'switch' },
          { name: 'diToWork', type: 'BOOL', dir: 'in', label: 'Ziel: ausgefahren', widget: 'switch' },
          { name: 'diJam', type: 'BOOL', dir: 'in', label: 'Simulation: Zylinder klemmt', widget: 'switch' },
          { name: 'diIsOut', type: 'BOOL', dir: 'in', label: 'Endlage vorn', widget: 'led' },
          { name: 'diIsIn', type: 'BOOL', dir: 'in', label: 'Endlage hinten', widget: 'led' },
          { name: 'rStroke', type: 'REAL', dir: 'in', label: 'Hub (Simulation)', widget: 'gauge', min: 0, max: 1 },
          { name: 'doExtend', type: 'BOOL', dir: 'out', label: 'Spule ausfahren', widget: 'led' },
          { name: 'doRetract', type: 'BOOL', dir: 'out', label: 'Spule einfahren', widget: 'led' },
          { name: 'doBusy', type: 'BOOL', dir: 'out', label: 'Busy', widget: 'led' },
          { name: 'doDone', type: 'BOOL', dir: 'out', label: 'Done', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Error', widget: 'led' },
          { name: 'nErrorID', type: 'UINT', dir: 'out', label: 'ErrorID', widget: 'value' }
        ],
        scene: { type: 'cylinder', bind: { extend: 'doExtend', retract: 'doRetract', isOut: 'diIsOut', isIn: 'diIsIn', stroke: 'rStroke' } },
        plant: CYL_PLANT,
        files: {
          main: `FUNCTION_BLOCK FB_CylMove
	VAR_INPUT
		Execute : BOOL;
		ToWork : BOOL;
		Timeout : TIME;
		IsOut : BOOL;
		IsIn : BOOL;
	END_VAR
	VAR_OUTPUT
		Done : BOOL;
		Busy : BOOL;
		Error : BOOL;
		ErrorID : UINT;
		Extend : BOOL;
		Retract : BOOL;
	END_VAR
	VAR
	END_VAR
	(* erste Version: pegelgesteuert, ohne Überwachung *)
	Extend := Execute AND ToWork AND NOT IsOut;
	Retract := Execute AND NOT ToWork AND NOT IsIn;
	Busy := Extend OR Retract;
	Done := (ToWork AND IsOut) OR (NOT ToWork AND IsIn);
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbCyl(Execute := diExecute, ToWork := diToWork, Timeout := T#2s, IsOut := diIsOut, IsIn := diIsIn);
	doExtend := fbCyl.Extend;
	doRetract := fbCyl.Retract;
	doBusy := fbCyl.Busy;
	doDone := fbCyl.Done;
	doError := fbCyl.Error;
	nErrorID := fbCyl.ErrorID;
END_PROGRAM
`, var: 'VAR\n\tfbCyl : FB_CylMove;\nEND_VAR\n', typ: '' },
        solution: {
          main: `(* Bewegt einen Zylinder in die Ziel-Endlage. PLCopen-Execute-Verhalten.
   ErrorID: 16#1001 = Ausfahren Timeout, 16#1002 = Einfahren Timeout *)
FUNCTION_BLOCK FB_CylMove
	VAR_INPUT
		Execute : BOOL;
		ToWork : BOOL;
		Timeout : TIME;
		IsOut : BOOL;
		IsIn : BOOL;
	END_VAR
	VAR_OUTPUT
		Done : BOOL;
		Busy : BOOL;
		Error : BOOL;
		ErrorID : UINT;
		Extend : BOOL;
		Retract : BOOL;
	END_VAR
	VAR
		rtExecute : R_TRIG;
		tonTimeout : TON;
		bTarget : BOOL;
		bJustFinished : BOOL;
	END_VAR
	bJustFinished := FALSE;
	rtExecute(CLK := Execute);
	IF rtExecute.Q AND NOT Busy THEN
		bTarget := ToWork;
		Busy := TRUE;
		Done := FALSE;
		Error := FALSE;
		ErrorID := 0;
	END_IF

	tonTimeout(IN := Busy, PT := Timeout);
	IF Busy THEN
		IF (bTarget AND IsOut) OR (NOT bTarget AND IsIn) THEN
			Busy := FALSE;
			Done := TRUE;
			bJustFinished := TRUE;
		ELSIF tonTimeout.Q THEN
			Busy := FALSE;
			Error := TRUE;
			ErrorID := SEL(bTarget, 16#1002, 16#1001);
			bJustFinished := TRUE;
		END_IF
	END_IF

	IF NOT Execute AND NOT Busy AND NOT bJustFinished THEN
		Done := FALSE;
		Error := FALSE;
		ErrorID := 0;
	END_IF

	Extend := Busy AND bTarget;
	Retract := Busy AND NOT bTarget;
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbCyl(Execute := diExecute, ToWork := diToWork, Timeout := T#2s, IsOut := diIsOut, IsIn := diIsIn);
	doExtend := fbCyl.Extend;
	doRetract := fbCyl.Retract;
	doBusy := fbCyl.Busy;
	doDone := fbCyl.Done;
	doError := fbCyl.Error;
	nErrorID := fbCyl.ErrorID;
END_PROGRAM
`, var: 'VAR\n\tfbCyl : FB_CylMove;\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Ausfahren: Busy, dann Done solange Execute', steps: [
            { set: { diToWork: true, diExecute: true } }, { cycles: 2 },
            { expect: 'doBusy AND doExtend AND NOT doDone', msg: 'Nach Execute-Flanke: Busy und Ventil ausfahren.' },
            { until: 'doDone', maxMs: 1500, msg: 'Done muss nach Erreichen der Endlage kommen.' },
            { expect: 'NOT doBusy AND NOT doExtend AND NOT doError', msg: 'Bei Done: Busy aus, Ventil aus.' },
            { ms: 500 },
            { expect: 'doDone', msg: 'Done muss stehen bleiben, solange Execute TRUE ist.' },
            { set: { diExecute: false } }, { cycles: 1 },
            { expect: 'NOT doDone', msg: 'Execute = FALSE muss Done zurücksetzen.' }
          ]},
          { name: 'Kurzer Execute-Impuls: Done genau einen Zyklus', steps: [
            { set: { diToWork: true } },
            ...pulse('diExecute'),
            { expect: 'doBusy', msg: 'Die Bewegung muss auch nach Abfallen von Execute weiterlaufen.' },
            { until: 'doDone', maxMs: 1500, msg: 'Auch bei kurzem Execute muss Done kommen.' },
            { cycles: 1 },
            { expect: 'NOT doDone', msg: 'Bei bereits abgefallenem Execute darf Done nur einen Zyklus sichtbar sein.' }
          ]},
          { name: 'Ziel bereits erreicht', steps: [
            { set: { diToWork: false } }, { cycles: 2 },
            { set: { diExecute: true } }, { cycles: 2 },
            { expect: 'doDone AND NOT doBusy AND NOT doRetract', msg: 'Steht der Zylinder schon in der Ziel-Endlage, muss sofort Done kommen.' }
          ]},
          { name: 'Timeout beim Ausfahren', steps: [
            { set: { diJam: true, diToWork: true, diExecute: true } },
            { ms: 1800 },
            { expect: 'doBusy AND NOT doError', msg: 'Der Fehler darf nicht vor dem Timeout kommen.' },
            { until: 'doError', maxMs: 600, msg: 'Nach 2 s ohne Endlage muss Error kommen.' },
            { expect: 'nErrorID = 16#1001 AND NOT doBusy AND NOT doExtend', msg: 'ErrorID 16#1001, Busy und Ventil aus.' },
            { ms: 300 },
            { expect: 'doError', msg: 'Error bleibt, solange Execute TRUE ist.' },
            { set: { diExecute: false } }, { cycles: 1 },
            { expect: 'NOT doError AND nErrorID = 0', msg: 'Execute = FALSE setzt Error und ErrorID zurück.' }
          ]},
          { name: 'Timeout beim Einfahren', steps: [
            { set: { diToWork: true, diExecute: true } },
            { until: 'doDone', maxMs: 1500 },
            { set: { diExecute: false } }, { cycles: 2 },
            { set: { diJam: true, diToWork: false, diExecute: true } },
            { until: 'doError', maxMs: 2600, msg: 'Auch beim Einfahren muss der Timeout greifen.' },
            { expect: 'nErrorID = 16#1002 AND NOT doRetract', msg: 'ErrorID 16#1002 beim Einfahren.' }
          ]},
          { name: 'Flanke während Busy wird ignoriert', steps: [
            { set: { diToWork: true } },
            ...pulse('diExecute'),
            { ms: 300 },
            { set: { diToWork: false } },
            ...pulse('diExecute'),
            { expect: 'doExtend AND NOT doRetract', msg: 'Eine neue Flanke während Busy darf die Richtung nicht ändern.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'fehlersuche',
        title: 'Fehlersuche: Entprellung und Zählung mit Bausteinen',
        task: `Zwei Sensoren werden entprellt und ihre Impulse in einer Statistikstruktur gezählt. Die Bausteine **FB_Debounce** und **FB_EdgeCount** sind fachlich fast richtig – aber ihre Nutzung und eine Schnittstelle sind fehlerhaft. Finde und behebe alle Fehler.

**Anforderungen**
- **doA** / **doB**: entprellte Signale von diSensorA / diSensorB. Ein Signal wird erst TRUE, wenn der Eingang 50 ms stabil TRUE ist, und erst FALSE, wenn er 50 ms stabil FALSE ist. A und B sind völlig unabhängig.
- **FB_EdgeCount** erhöht bei jeder steigenden Flanke seines Eingangs den Zähler, den der Aufrufer übergibt (stStats.nCountA bzw. stStats.nCountB).
- **nCountA**, **nCountB** zeigen die Zählerstände aus stStats.`,
        hints: ['Wie viele Instanzen von FB_Debounce braucht man?', 'Wird jede Instanz in jedem Zyklus aufgerufen?', 'Kann ein VAR_INPUT eine Variable des Aufrufers verändern?'],
        cycleMs: 10,
        io: [
          { name: 'diSensorA', type: 'BOOL', dir: 'in', label: 'Sensor A (prellt)', widget: 'button' },
          { name: 'diSensorB', type: 'BOOL', dir: 'in', label: 'Sensor B (prellt)', widget: 'button' },
          { name: 'doA', type: 'BOOL', dir: 'out', label: 'A entprellt', widget: 'led' },
          { name: 'doB', type: 'BOOL', dir: 'out', label: 'B entprellt', widget: 'led' },
          { name: 'nCountA', type: 'INT', dir: 'out', label: 'Zähler A', widget: 'value' },
          { name: 'nCountB', type: 'INT', dir: 'out', label: 'Zähler B', widget: 'value' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doA', 'doB'] } },
        files: {
          main: `FUNCTION_BLOCK FB_Debounce
	VAR_INPUT
		bIn : BOOL;
		tDelay : TIME;
	END_VAR
	VAR_OUTPUT
		bOut : BOOL;
	END_VAR
	VAR
		tonOn : TON;
		tonOff : TON;
	END_VAR
	tonOn(IN := bIn, PT := tDelay);
	tonOff(IN := NOT bIn, PT := tDelay);
	IF tonOn.Q THEN
		bOut := TRUE;
	ELSIF tonOff.Q THEN
		bOut := FALSE;
	END_IF
END_FUNCTION_BLOCK

FUNCTION_BLOCK FB_EdgeCount
	VAR_INPUT
		bIn : BOOL;
		nCount : INT;
	END_VAR
	VAR
		rtIn : R_TRIG;
	END_VAR
	rtIn(CLK := bIn);
	IF rtIn.Q THEN
		nCount := nCount + 1;
	END_IF
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbDeb(bIn := diSensorA, tDelay := T#50ms);
	doA := fbDeb.bOut;
	fbDeb(bIn := diSensorB, tDelay := T#50ms);
	doB := fbDeb.bOut;

	IF doA THEN
		fbCountA(bIn := doA, nCount := stStats.nCountA);
	END_IF
	fbCountB(bIn := doB, nCount := stStats.nCountB);

	nCountA := stStats.nCountA;
	nCountB := stStats.nCountB;
END_PROGRAM
`,
          var: 'VAR\n\tfbDeb : FB_Debounce;\n\tfbCountA : FB_EdgeCount;\n\tfbCountB : FB_EdgeCount;\n\tstStats : stSensorStats;\nEND_VAR\n',
          typ: 'TYPE\n\tstSensorStats : STRUCT\n\t\tnCountA : INT;\n\t\tnCountB : INT;\n\tEND_STRUCT;\nEND_TYPE\n'
        },
        solution: {
          main: `FUNCTION_BLOCK FB_Debounce
	VAR_INPUT
		bIn : BOOL;
		tDelay : TIME;
	END_VAR
	VAR_OUTPUT
		bOut : BOOL;
	END_VAR
	VAR
		tonOn : TON;
		tonOff : TON;
	END_VAR
	tonOn(IN := bIn, PT := tDelay);
	tonOff(IN := NOT bIn, PT := tDelay);
	IF tonOn.Q THEN
		bOut := TRUE;
	ELSIF tonOff.Q THEN
		bOut := FALSE;
	END_IF
END_FUNCTION_BLOCK

(* Zählt steigende Flanken von bIn im Zähler des Aufrufers *)
FUNCTION_BLOCK FB_EdgeCount
	VAR_INPUT
		bIn : BOOL;
	END_VAR
	VAR_IN_OUT
		nCount : INT;
	END_VAR
	VAR
		rtIn : R_TRIG;
	END_VAR
	rtIn(CLK := bIn);
	IF rtIn.Q THEN
		nCount := nCount + 1;
	END_IF
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbDebA(bIn := diSensorA, tDelay := T#50ms);
	fbDebB(bIn := diSensorB, tDelay := T#50ms);
	doA := fbDebA.bOut;
	doB := fbDebB.bOut;

	fbCountA(bIn := doA, nCount := stStats.nCountA);
	fbCountB(bIn := doB, nCount := stStats.nCountB);

	nCountA := stStats.nCountA;
	nCountB := stStats.nCountB;
END_PROGRAM
`,
          var: 'VAR\n\tfbDebA : FB_Debounce;\n\tfbDebB : FB_Debounce;\n\tfbCountA : FB_EdgeCount;\n\tfbCountB : FB_EdgeCount;\n\tstStats : stSensorStats;\nEND_VAR\n',
          typ: 'TYPE\n\tstSensorStats : STRUCT\n\t\tnCountA : INT;\n\t\tnCountB : INT;\n\tEND_STRUCT;\nEND_TYPE\n'
        },
        tests: [
          { name: 'Kurzer Störimpuls wird unterdrückt', steps: [
            { set: { diSensorA: true } }, { ms: 30 }, { set: { diSensorA: false } },
            { never: 'doA', msg: 'Ein 30-ms-Impuls darf das entprellte Signal nicht setzen.' }
          ]},
          { name: 'A und B unabhängig', steps: [
            { set: { diSensorA: true } }, { ms: 200 },
            { expect: 'doA AND NOT doB', msg: 'Nur A ist betätigt – doA TRUE, doB FALSE. Eigene Instanz je Signal?' },
            { set: { diSensorB: true } }, { ms: 200 },
            { set: { diSensorA: false } }, { ms: 200 },
            { expect: 'NOT doA AND doB', msg: 'Nach Wechsel: doA FALSE, doB TRUE.' }
          ]},
          { name: 'Entprellung in beide Richtungen', steps: [
            { set: { diSensorA: true } }, { ms: 100 },
            { expect: 'doA', msg: 'Nach 100 ms stabil TRUE muss doA TRUE sein.' },
            { set: { diSensorA: false } }, { ms: 30 },
            { expect: 'doA', msg: 'Ein kurzer Einbruch (30 ms) darf doA nicht abschalten.' },
            { ms: 70 },
            { expect: 'NOT doA', msg: 'Nach 100 ms stabil FALSE muss doA FALSE sein.' }
          ]},
          { name: 'Zählung A', steps: [
            { set: { diSensorA: true } }, { ms: 100 }, { set: { diSensorA: false } }, { ms: 100 },
            { set: { diSensorA: true } }, { ms: 100 }, { set: { diSensorA: false } }, { ms: 100 },
            { set: { diSensorA: true } }, { ms: 100 }, { set: { diSensorA: false } }, { ms: 100 },
            { expect: 'nCountA = 3', msg: 'Drei Impulse an A müssen stStats.nCountA = 3 ergeben.' }
          ]},
          { name: 'Zählung B', steps: [
            { set: { diSensorB: true } }, { ms: 100 }, { set: { diSensorB: false } }, { ms: 100 },
            { set: { diSensorB: true } }, { ms: 100 }, { set: { diSensorB: false } }, { ms: 100 },
            { expect: 'nCountB = 2 AND nCountA = 0', msg: 'Zwei Impulse an B: nCountB = 2, nCountA unverändert.' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-4-zyklus-tasks',
    level: 4,
    kind: 'lektion',
    title: 'Zykluszeit, Performance und Task-Kommunikation',
    summary: 'Du verteilst rechenintensive Aufgaben über mehrere Zyklen, misst Laufzeiten und tauschst Daten konsistent zwischen Tasks aus.',
    minutes: 210,
    req: ['logik-4-fb-design'],
    briefing: 'Automation Runtime arbeitet deterministisch: Jede Taskklasse muss in ihrer Zykluszeit fertig werden, sonst folgt eine Zykluszeitverletzung. Große Schleifen, Dateioperationen oder String-Verarbeitung gehören deshalb in langsamere Taskklassen oder werden über mehrere Zyklen verteilt (Time-Slicing). Mit dem Profiler misst du Laufzeiten und Auslastung. Sobald mehrere Taskklassen dieselben Daten nutzen, entsteht ein zweites Problem: Eine schnelle Task kann eine langsame mitten im Schreiben unterbrechen – der Leser sieht halb alte, halb neue Daten. Abhilfe schaffen Handshakes, Doppelpuffer oder Sequenzzähler.',
    practice: 'Eine Qualitätsauswertung über 10 000 Messwerte im 2-ms-Motion-Task bringt die Maschine zum Stehen. Ein Rezept, das die HMI-Task schreibt, während die Prozess-Task liest, erzeugt sporadische, kaum reproduzierbare Fehler.',
    transfer: {
      tia: 'In TIA entspricht das der Aufteilung in OB1 und Weckalarm-OBs; Datenkonsistenz sichert man dort mit gleichen Mechanismen oder Systemfunktionen zum Sperren von Alarmen.',
      codesys: 'CODESYS: Tasks mit Prioritäten in der Taskkonfiguration, Monitoring der Laufzeiten; für Konsistenz gibt es Semaphoren in Bibliotheken.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Miss Laufzeiten mit dem Profiler',
        guide: {
          intro: 'Der Profiler zeichnet Laufzeiten von Tasks und Taskklassen auf dem Zielsystem auf.',
          steps: [
            'Öffne den Profiler für dein Zielsystem (in AS6 unter Open bzw. über die Diagnosewerkzeuge, Hilfe-Stichwort „Profiler“).',
            'Starte eine Aufzeichnung und lies für jede Task Netto- und Bruttolaufzeit ab.',
            'Vergleiche die Laufzeit aller Tasks einer Taskklasse mit deren Zykluszeit und Toleranz.',
            'Baue absichtlich eine große FOR-Schleife ein und beobachte die Änderung.'
          ],
          done: 'Erledigt, wenn du für dein Projekt die Auslastung jeder Taskklasse in Prozent angeben kannst.',
          tip: 'Plane höchstens etwa 50–70 % Auslastung je Taskklasse ein – Reserven brauchst du für Erweiterungen und Lastspitzen.',
          link: { label: 'B&R Help: Profiler', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/profile/diagnosis_profile.html' }
        }
      },
      {
        id: 'o2',
        title: 'Verteile Rechenlast über mehrere Zyklen',
        guide: {
          intro: 'Time-Slicing: Jeder Zyklus bearbeitet nur einen Teil der Daten.',
          steps: [
            'Führe einen Index nIdx und eine Konstante MAX_PER_CYCLE ein.',
            'Bearbeite pro Zyklus die Elemente nIdx … nIdx + MAX_PER_CYCLE − 1, dann `nIdx := nIdx + MAX_PER_CYCLE`.',
            'Melde Busy während der Berechnung und Done, wenn alle Elemente bearbeitet sind.',
            'Sperre neue Anforderungen, solange Busy ist.'
          ],
          done: 'Erledigt, wenn die Berechnung über mehrere Zyklen verteilt ist und dasselbe Ergebnis liefert wie in einem Zyklus.',
          tip: 'Alternativ kommt die Berechnung in eine langsame Taskklasse. Time-Slicing ist die Wahl, wenn das Ergebnis im Kontext der schnellen Task gebraucht wird.',
          link: { label: 'B&R Help: Zykluszeitüberwachung', url: 'https://help.br-automation.com/#/de/6/automationruntime/operationmethode/moduledatasec/cycletimemonitoring.html' }
        }
      },
      {
        id: 'o3',
        title: 'Plane Taskklassen und Prioritäten',
        guide: {
          intro: 'Taskklassen mit kürzerer Zykluszeit haben höhere Priorität und unterbrechen langsamere.',
          steps: [
            'Lies in der B&R-Hilfe nach, wie Taskklassenprioritäten vergeben werden.',
            'Ordne Funktionen zu: Motion/schnelle Regelung → schnelle Taskklasse, Ablauflogik → mittlere, HMI-Aufbereitung/Rezepte/Logging → langsame.',
            'Lege fest, welche Daten zwischen Taskklassen ausgetauscht werden, und wer schreibt bzw. liest.',
            'Dokumentiere die Aufteilung im Repository.'
          ],
          done: 'Erledigt, wenn jede Variable, die zwischen Taskklassen geteilt wird, genau einen Schreiber hat.',
          tip: '„Ein Schreiber, viele Leser“ ist die wichtigste Regel für globale Variablen über Taskgrenzen.',
          link: { label: 'B&R Help: Taskklassenpriorität', url: 'https://help.br-automation.com/#/de/6/automationruntime/taskclasses/scheduling/scheduling_tcpriority_sg4.html' }
        }
      },
      {
        id: 'o4',
        title: 'Tausche Daten konsistent über einen Handshake aus',
        guide: {
          intro: 'Ein Datensatz besteht oft aus mehreren Variablen, die zusammenpassen müssen.',
          steps: [
            'Der Schreiber füllt alle Daten und setzt erst danach das Flag bNewData.',
            'Der Leser übernimmt die Daten nur bei bNewData und quittiert mit bAck.',
            'Der Schreiber setzt bNewData zurück, sobald bAck kommt, und schreibt erst wieder, wenn bAck abgefallen ist.',
            'Teste mit einem Konsistenzkriterium, das ein halb geschriebener Datensatz verletzt.'
          ],
          done: 'Erledigt, wenn dein Leser nie einen inkonsistenten Datensatz übernimmt und keinen Datensatz verliert.',
          tip: 'Alternative ohne Rückkanal: Sequenzzähler vor und nach den Daten schreiben – der Leser übernimmt nur, wenn beide gleich sind.'
        }
      }
    ],
    videos: [
      vid('0ii18sjwdiY', 'en', 'Wiederholung: Programme in Taskklassen und deren Zykluszeiten.'),
      vid('BdcfD1SXbeE', 'en', 'CPU-Timing und Taskklassen in Automation Studio einrichten.'),
      vid('EYGlEg0OXjs', 'de', 'Hochschulvorlesung zu SPS-Arbeitsweise und Zyklus – Grundlage für Performance-Überlegungen.')
    ],
    readings: [
      br('automationruntime/operationmethode/moduledatasec/cycletimemonitoring.html', 'Zykluszeitüberwachung', 'Wie Automation Runtime Zykluszeiten überwacht und was bei Verletzung passiert.', 10),
      br('diagnostics_support/diagnosis/profile/diagnosis_profile.html', 'Profiler', 'Laufzeitmessung und Auslastung von Tasks auf dem Zielsystem.', 15),
      br('automationruntime/taskclasses/scheduling/scheduling_tcpriority_sg4.html', 'Taskklassenpriorität', 'Prioritäten und Unterbrechung zwischen Taskklassen.', 10)
    ],
    quiz: [
      { type: 'numeric', q: 'Eine Auswertung über {N} Werte braucht 2 µs pro Wert. Wie viele Zyklen sind mindestens nötig, wenn pro Zyklus höchstens 0,4 ms dafür verwendet werden dürfen?',
        params: { N: [1000, 20000, 1000] }, formula: 'Math.ceil(N * 0.002 / 0.4)', unit: 'Zyklen', tol: 0.01,
        explain: 'Gesamtzeit N · 2 µs; geteilt durch 0,4 ms pro Zyklus, aufgerundet.' },
      { type: 'single', q: 'Warum kann ein Leser in einer langsamen Task inkonsistente Daten sehen, wenn eine schnelle Task mehrere Variablen nacheinander schreibt?',
        options: ['Weil langsame Tasks Daten verlieren', 'Weil die schnelle Task die langsame unterbrechen kann – mitten im Lesen', 'Wegen des Compilers', 'Das ist nicht möglich'], correct: 1,
        explain: 'Die höher priorisierte Task unterbricht die langsamere jederzeit. Ohne Konsistenzmechanismus mischt der Leser alte und neue Werte.' },
      { type: 'single', q: 'Was passiert, wenn die Summe der Laufzeiten einer Taskklasse sporadisch die Zykluszeit, aber nicht Zykluszeit + Toleranz überschreitet?',
        options: ['Sofortige Zykluszeitverletzung', 'Der nächste Zyklusstart verschiebt sich; das kann Timing-Probleme verursachen', 'Nichts', 'Die Task wird abgebrochen'], correct: 1,
        explain: 'Laut B&R-Hilfe fängt die Toleranz sporadische Überschreitungen ab, der nächste Zyklus startet verschoben.' }
    ],
    exam: [
      { type: 'single', q: 'Welche Maßnahme hilft NICHT gegen Zykluszeitverletzungen durch eine große Auswertung?',
        options: ['Auswertung in eine langsamere Taskklasse verschieben', 'Auswertung über mehrere Zyklen verteilen', 'Toleranz auf das Zehnfache erhöhen und weiter im schnellen Task rechnen', 'Algorithmus optimieren'], correct: 2,
        explain: 'Eine größere Toleranz kaschiert das Problem und verschiebt Zyklen – das Timing der schnellen Task leidet trotzdem.' },
      { type: 'multi', q: 'Welche Mechanismen sichern Datenkonsistenz zwischen Taskklassen?',
        options: ['Handshake mit NewData/Ack', 'Sequenzzähler vor und nach den Daten', 'Doppelpuffer mit Umschaltindex', 'Mehrere Schreiber auf dieselbe Variable'], correct: [0, 1, 2],
        explain: 'Mehrere Schreiber auf dieselbe Variable sind die Ursache, nicht die Lösung.' },
      { type: 'single', q: 'Eine WHILE-Schleife wartet auf einen Eingang: `WHILE NOT diReady DO END_WHILE;`. Was passiert?',
        options: ['Das Programm wartet, bis diReady TRUE wird', 'Da Eingänge im Zyklus nicht aktualisiert werden, endet die Schleife nie – Zykluszeitverletzung', 'Der Compiler optimiert die Schleife weg', 'Die Schleife läuft genau einmal'], correct: 1,
        explain: 'Das Prozessabbild wird erst zwischen den Zyklen aktualisiert. Warten heißt in der SPS: Zustand halten und im nächsten Zyklus erneut prüfen.' },
      { type: 'numeric', q: 'Taskklasse 1 hat {T} ms Zykluszeit, die Programme darin brauchen zusammen 0,6 ms. Wie hoch ist die Auslastung in Prozent?',
        params: { T: [1, 10, 1] }, formula: '0.6 / T * 100', unit: '%', tol: 0.01,
        explain: 'Auslastung = Laufzeit / Zykluszeit · 100 %.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Auswertung über mehrere Zyklen verteilen',
        task: `Das Programm wertet bei einer Flanke an **diCalc** 1000 Messwerte (\`aData\`) aus: Mittelwert **rMean** und Maximum **rMax**. Bisher passiert alles in einem Zyklus – im schnellen Task zu viel.

Erweitere das Programm:
1. Pro Zyklus dürfen **höchstens 100 Elemente** bearbeitet werden. **nIterThisCycle** zeigt, wie viele Schleifendurchläufe im aktuellen Zyklus stattfanden (am Zyklusanfang auf 0 setzen, pro Element +1).
2. **doBusy** = TRUE, solange die Auswertung läuft; **doDone** = TRUE nach Abschluss bis zur nächsten Anforderung.
3. rMean und rMax werden erst bei Abschluss aktualisiert (keine Zwischenergebnisse).
4. Eine neue Flanke an diCalc während doBusy wird ignoriert. Nach Abschluss startet eine neue Flanke eine neue Auswertung (doDone geht dann sofort auf FALSE).`,
        hints: ['Ein Index nIdx merkt sich, wo die Auswertung im nächsten Zyklus weitermacht.', 'Schleife: `FOR i := nIdx TO MIN(nIdx + 99, 999) DO …`', 'Zwischensummen in eigenen Variablen, Ergebnisse erst am Ende übernehmen.'],
        cycleMs: 10,
        io: [
          { name: 'diCalc', type: 'BOOL', dir: 'in', label: 'Auswertung anfordern', widget: 'button' },
          { name: 'doBusy', type: 'BOOL', dir: 'out', label: 'Busy', widget: 'led' },
          { name: 'doDone', type: 'BOOL', dir: 'out', label: 'Done', widget: 'led' },
          { name: 'rMean', type: 'REAL', dir: 'out', label: 'Mittelwert', widget: 'value' },
          { name: 'rMax', type: 'REAL', dir: 'out', label: 'Maximum', widget: 'value' },
          { name: 'nIterThisCycle', type: 'INT', dir: 'out', label: 'Schleifendurchläufe im Zyklus', widget: 'value' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT
	FOR i := 0 TO 999 DO
		aData[i] := INT_TO_REAL(i MOD 50);
	END_FOR
END_PROGRAM

PROGRAM _CYCLIC
	rtCalc(CLK := diCalc);
	nIterThisCycle := 0;
	IF rtCalc.Q THEN
		rSum := 0.0;
		rMaxTmp := aData[0];
		FOR i := 0 TO 999 DO
			rSum := rSum + aData[i];
			IF aData[i] > rMaxTmp THEN
				rMaxTmp := aData[i];
			END_IF
			nIterThisCycle := nIterThisCycle + 1;
		END_FOR
		rMean := rSum / 1000.0;
		rMax := rMaxTmp;
		doDone := TRUE;
	END_IF
END_PROGRAM
`, var: 'VAR\n\taData : ARRAY[0..999] OF REAL;\n\ti : INT;\n\trtCalc : R_TRIG;\n\trSum : REAL;\n\trMaxTmp : REAL;\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	FOR i := 0 TO 999 DO
		aData[i] := INT_TO_REAL(i MOD 50);
	END_FOR
END_PROGRAM

PROGRAM _CYCLIC
	rtCalc(CLK := diCalc);
	nIterThisCycle := 0;

	IF rtCalc.Q AND NOT doBusy THEN
		doBusy := TRUE;
		doDone := FALSE;
		nIdx := 0;
		rSum := 0.0;
		rMaxTmp := aData[0];
	END_IF

	IF doBusy THEN
		nEnd := MIN(nIdx + MAX_PER_CYCLE - 1, 999);
		FOR i := nIdx TO nEnd DO
			rSum := rSum + aData[i];
			IF aData[i] > rMaxTmp THEN
				rMaxTmp := aData[i];
			END_IF
			nIterThisCycle := nIterThisCycle + 1;
		END_FOR
		nIdx := nEnd + 1;
		IF nIdx > 999 THEN
			rMean := rSum / 1000.0;
			rMax := rMaxTmp;
			doBusy := FALSE;
			doDone := TRUE;
		END_IF
	END_IF
END_PROGRAM
`, var: 'VAR CONSTANT\n\tMAX_PER_CYCLE : INT := 100;\nEND_VAR\nVAR\n\taData : ARRAY[0..999] OF REAL;\n\ti : INT;\n\tnIdx : INT;\n\tnEnd : INT;\n\trtCalc : R_TRIG;\n\trSum : REAL;\n\trMaxTmp : REAL;\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Ergebnis korrekt', steps: [
            ...pulse('diCalc'),
            { until: 'doDone', maxMs: 500, msg: 'Die Auswertung muss innerhalb weniger Zyklen fertig werden.' },
            { expect: 'ABS(rMean - 24.5) < 0.01 AND ABS(rMax - 49.0) < 0.01', msg: 'Mittelwert 24,5 und Maximum 49 erwartet.' }
          ]},
          { name: 'Höchstens 100 Elemente pro Zyklus', steps: [
            { set: { diCalc: true } }, { cycles: 1 },
            { expect: 'nIterThisCycle > 0 AND nIterThisCycle <= 100', msg: 'Im ersten Zyklus müssen 1 bis 100 Elemente bearbeitet werden – nicht alle 1000.' },
            { set: { diCalc: false } },
            { never: 'nIterThisCycle > 100', msg: 'Pro Zyklus dürfen höchstens 100 Elemente bearbeitet werden.' }
          ]},
          { name: 'Busy über mehrere Zyklen, keine Zwischenergebnisse', steps: [
            ...pulse('diCalc'),
            { cycles: 3 },
            { expect: 'doBusy AND NOT doDone', msg: 'Die Auswertung muss über mehrere Zyklen laufen (Busy).' },
            { expect: 'rMean = 0.0 AND rMax = 0.0', msg: 'Ergebnisse dürfen erst bei Abschluss geschrieben werden.' },
            { until: 'doDone', maxMs: 300 },
            { expect: 'NOT doBusy', msg: 'Bei Done muss Busy aus sein.' }
          ]},
          { name: 'Anforderung während Busy ignoriert, Neustart danach', steps: [
            ...pulse('diCalc'),
            { cycles: 3 },
            ...pulse('diCalc'),
            { until: 'doDone', maxMs: 300 },
            { expect: 'ABS(rMean - 24.5) < 0.01', msg: 'Eine Anforderung während Busy darf die Auswertung nicht verfälschen.' },
            { never: 'doBusy', msg: 'Nach Abschluss darf ohne neue Anforderung nichts mehr laufen.' },
            ...pulse('diCalc'),
            { expect: 'doBusy AND NOT doDone', msg: 'Eine neue Anforderung nach Abschluss muss neu starten.' },
            { until: 'doDone', maxMs: 300 }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'Konsistente Datenübernahme per Handshake',
        task: `Eine andere Task (hier von der Anlagensimulation nachgebildet) liefert Datensätze aus zwei Werten **giValA** und **giValB** und schreibt sie **nacheinander in verschiedenen Zyklen**. Ein Datensatz ist konsistent, wenn **giValB = −giValA**. Zusätzlich zählt sie mit **giSeq** die gelieferten Datensätze.

Protokoll des Schreibers:
1. Er schreibt nur, wenn **doAck** = FALSE ist: zuerst giValA, im nächsten Zyklus giValB, danach setzt er **giNewData** = TRUE.
2. Sobald **doAck** = TRUE ist, setzt er giNewData = FALSE und wartet, bis doAck wieder FALSE ist.

Schreibe den Leser:
- Übernimm einen Datensatz nur bei giNewData = TRUE in **rUsedA**/**rUsedB**, zähle **nReceived** hoch und quittiere mit **doAck** = TRUE.
- Setze doAck zurück, sobald giNewData = FALSE ist.
- rUsedA und rUsedB müssen **jederzeit** zusammenpassen; kein Datensatz darf verloren gehen.`,
        hints: ['Der Leser darf giValA/giValB nur im Moment von giNewData = TRUE lesen.', 'doAck nicht im selben Zyklus setzen und wieder löschen.', 'Zwei Zweige: Übernahme (giNewData AND NOT doAck) und Rücksetzen (NOT giNewData).'],
        cycleMs: 10,
        io: [
          { name: 'giValA', type: 'REAL', dir: 'in', label: 'Wert A (andere Task)', widget: 'value' },
          { name: 'giValB', type: 'REAL', dir: 'in', label: 'Wert B (andere Task)', widget: 'value' },
          { name: 'giNewData', type: 'BOOL', dir: 'in', label: 'Neue Daten', widget: 'led' },
          { name: 'giSeq', type: 'INT', dir: 'in', label: 'Gelieferte Datensätze', widget: 'value' },
          { name: 'doAck', type: 'BOOL', dir: 'out', label: 'Quittung', widget: 'led' },
          { name: 'rUsedA', type: 'REAL', dir: 'out', label: 'Übernommen A', widget: 'value' },
          { name: 'rUsedB', type: 'REAL', dir: 'out', label: 'Übernommen B', widget: 'value' },
          { name: 'nReceived', type: 'INT', dir: 'out', label: 'Empfangene Datensätze', widget: 'value' }
        ],
        scene: { type: 'generic' },
        plant: {
          var: 'VAR\n\tnPhase : INT;\n\tnCnt : INT;\nEND_VAR\n',
          code: `CASE nPhase OF
	0:
		IF NOT doAck THEN
			nCnt := nCnt + 1;
			giValA := INT_TO_REAL(nCnt);
			nPhase := 1;
		END_IF
	1:
		giValB := -INT_TO_REAL(nCnt);
		nPhase := 2;
	2:
		giNewData := TRUE;
		giSeq := nCnt;
		nPhase := 3;
	3:
		IF doAck THEN
			giNewData := FALSE;
			nPhase := 4;
		END_IF
	4:
		IF NOT doAck THEN
			nPhase := 0;
		END_IF
END_CASE
`
        },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* naive Übernahme in jedem Zyklus *)
	rUsedA := giValA;
	rUsedB := giValB;
END_PROGRAM
`, var: 'VAR\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	nReceived := 0;
	doAck := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	IF giNewData AND NOT doAck THEN
		rUsedA := giValA;
		rUsedB := giValB;
		nReceived := nReceived + 1;
		doAck := TRUE;
	ELSIF NOT giNewData THEN
		doAck := FALSE;
	END_IF
END_PROGRAM
`, var: 'VAR\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Immer konsistente Daten', steps: [
            ...nevers('rUsedA <> -rUsedB', 3, 'Inkonsistenter Datensatz übernommen (A und B passen nicht zusammen).')
          ]},
          { name: 'Durchsatz', steps: [
            { ms: 1000 },
            { expect: 'nReceived >= 10', msg: 'Nach 1 s müssen mindestens 10 Datensätze übernommen sein.' }
          ]},
          { name: 'Kein Datensatz verloren', steps: [
            { ms: 1500 },
            { expect: 'nReceived > 0 AND giSeq - nReceived <= 1', msg: 'Es darf kein gelieferter Datensatz verloren gehen.' },
            { expect: 'ABS(rUsedA - INT_TO_REAL(nReceived)) < 0.01', msg: 'Der zuletzt übernommene Datensatz muss zur Anzahl passen.' }
          ]},
          { name: 'Quittung folgt dem Protokoll', steps: [
            ...nevers('doAck AND NOT giNewData', 2, 'doAck muss zurückgesetzt werden, sobald giNewData FALSE ist.')
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-4-projekt-packml',
    level: 4,
    kind: 'projekt',
    title: 'Praxisprojekt: PackML-Zustandsmodell',
    summary: 'Du implementierst das PackML-Zustandsmodell (OMAC, ISA-TR88.00.02) für eine Maschine – mit Acting- und Wait-States, Befehlen und Abort-Pfad.',
    minutes: 360,
    req: ['logik-4-zyklus-tasks'],
    briefing: 'PackML ist ein Industriestandard der OMAC, beschrieben in ISA-TR88.00.02, und baut auf den Konzepten von ISA-88 auf. Er definiert ein einheitliches Zustandsmodell für Maschinen (Stopped, Idle, Execute, Held, Aborted …), Befehle (Reset, Start, Stop, Hold, Abort, Clear …) und Datenstrukturen (PackTags). Dadurch können Linienleitsysteme Maschinen verschiedener Hersteller gleich bedienen. Man unterscheidet Acting States (Zustände mit „-ing“, die eine Aktion ausführen und mit State Complete enden) und Wait States (warten auf einen Befehl). B&R bietet mit mapp PackML eine fertige Komponente; hier implementierst du den Kern selbst, um das Modell wirklich zu verstehen.',
    practice: 'Verpackungs- und Abfüllmaschinen werden heute oft mit PackML-Pflicht ausgeschrieben. Das Linienleitsystem schickt Start/Stop/Hold, die Maschine meldet ihren Zustand – egal welcher Hersteller sie gebaut hat.',
    transfer: {
      tia: 'Siemens bietet mit der OMAC-PackML-Bibliothek (LPMLV30) eine fertige Umsetzung; das Zustandsmodell ist identisch.',
      codesys: 'Für CODESYS/TwinCAT gibt es PackML-Bibliotheken (z. B. Beckhoff Tc3_PackML); auch dort entspricht das Modell ISA-TR88.00.02.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Verstehe Zustände, Befehle und State Complete',
        guide: {
          intro: 'PackML trennt Acting States (tun etwas) von Wait States (warten auf Befehl).',
          steps: [
            'Lies die OMAC-Einführung zu PackML und die B&R-Hilfe zu mapp PackML.',
            'Zeichne das Zustandsmodell: Stopped → Resetting → Idle → Starting → Execute; Hold/Unhold; Stop- und Abort-Pfad mit Clearing.',
            'Markiere Acting States: Sie enden mit „State Complete“ (SC), wenn ihre Aktion fertig ist.',
            'Notiere, aus welchen Zuständen Stop und Abort wirken.'
          ],
          done: 'Erledigt, wenn dein Zustandsdiagramm alle Zustände dieser Übung mit Befehlen und SC-Übergängen enthält.',
          tip: 'Abort wirkt aus allen Zuständen außer Aborting/Aborted; Stop aus allen außer Stopped, Stopping, Aborting, Aborted und Clearing.',
          link: { label: 'B&R Help: mapp PackML', url: 'https://help.br-automation.com/#/de/6/services/mapp_services/mppackml/mppackml.html' }
        }
      },
      {
        id: 'o2',
        title: 'Implementiere das Modell mit Enum und CASE',
        guide: {
          intro: 'Der Enum nutzt die PackML-Zustandsnummern, damit sie direkt an ein Leitsystem gemeldet werden können.',
          steps: [
            'Nutze den vorgegebenen Enum `ePackMLState` mit den Zustandsnummern aus ISA-TR88.00.02.',
            'Werte alle Befehle als Flanken aus; ein Fehler (diFault) wirkt wie ein Abort.',
            'Programmiere zentrale Übergänge für Abort und Stop vor dem CASE, die übrigen im CASE.',
            'Simuliere State Complete mit einem Timer, der bei jedem Zustandswechsel neu startet.'
          ],
          done: 'Erledigt, wenn alle Übergänge deines Diagramms im Code stehen und die automatischen Tests grün sind.',
          tip: 'Ein Timer mit IN := „Zustand ist Acting State“ reicht nicht, wenn zwei Acting States direkt aufeinander folgen (z. B. Starting → Stopping). Setze ihn beim Zustandswechsel explizit zurück.'
        }
      },
      {
        id: 'o3',
        title: 'Verbinde Maschinenfunktion und Zustandsmodell',
        guide: {
          intro: 'Das Zustandsmodell steuert, die Maschinenfunktion führt aus.',
          steps: [
            'Lege fest, was in jedem Zustand passiert: Execute = Produktion (Band läuft), Held = Band steht, Teile bleiben liegen.',
            'In einer echten Maschine meldet die Maschinenfunktion State Complete (z. B. „Starting: Achsen referenziert“) statt eines Timers.',
            'Leite Ausgänge zentral aus dem Zustand ab.',
            'Überlege, welche Zustände du für deine Maschine mit „Disable“ überspringen würdest (PackML erlaubt das z. B. für Suspend).'
          ],
          done: 'Erledigt, wenn das Band nur in Execute läuft und du die Zuordnung dokumentiert hast.',
          tip: 'Bleibe beim Standard: Eigene Zusatzzustände machen den Vorteil von PackML zunichte.'
        }
      },
      {
        id: 'o4',
        title: 'Dokumentiere und reiche ein',
        guide: {
          intro: 'PackML lebt von Vergleichbarkeit – dokumentiere deine Umsetzung so, dass ein Linienintegrator sie versteht.',
          steps: [
            'Lege eine Tabelle an: Zustand, Nummer, Aktion, Ausgänge, erlaubte Befehle.',
            'Committe Code und Dokumentation, pushe auf git.breitner.de.',
            'Reiche den Link ein.'
          ],
          done: 'Erledigt, wenn alle Tests grün sind und der Link eingereicht ist.',
          tip: 'Vergleiche deine Umsetzung mit mapp PackML: Welche Funktionen (Betriebsarten, PackTags, Zeitstatistik) bringt die fertige Komponente zusätzlich mit?'
        }
      }
    ],
    videos: [
      vid('CQS-R5COOLw', 'en', 'Offizielle OMAC-Einführung in PackML.'),
      vid('4aYTqiOTJT4', 'en', 'Ausführliches Webinar zu Zustandsmodell, Betriebsarten und PackTags.'),
      vid('L-bFWpLBPt4', 'en', 'Zustandsautomaten in der SPS allgemein erklärt – Brücke zwischen CASE und PackML.')
    ],
    readings: [
      R.omacPackml,
      br('services/mapp_services/mppackml/mppackml.html', 'mapp PackML: OMAC PackML Standard', 'Wie B&R PackML mit mapp PackML umsetzt.', 20),
      R.isa88
    ],
    quiz: [
      { type: 'single', q: 'Welcher Zustand ist ein Acting State?',
        options: ['Idle', 'Held', 'Starting', 'Aborted'], correct: 2,
        explain: 'Acting States enden auf „-ing“ und werden mit State Complete verlassen.' },
      { type: 'single', q: 'Die Maschine ist in Aborted. Welcher Befehl führt weiter?',
        options: ['Reset', 'Start', 'Clear', 'Unhold'], correct: 2,
        explain: 'Aborted → Clear → Clearing → Stopped. Erst dann ist Reset möglich.' },
      { type: 'single', q: 'Welche PackML-Zustandsnummer hat Execute?',
        options: ['4', '6', '11', '2'], correct: 1,
        explain: 'Nach ISA-TR88.00.02: Stopped = 2, Idle = 4, Execute = 6, Held = 11.' }
    ],
    exam: [
      { type: 'multi', q: 'Aus welchen Zuständen ist der Befehl Stop wirksam?',
        options: ['Execute', 'Held', 'Aborted', 'Idle'], correct: [0, 1, 3],
        explain: 'In Aborted wirkt nur Clear; Stop ist dort ohne Wirkung.' },
      { type: 'single', q: 'Warum darf ein Fehler (z. B. Not-Halt-Rückmeldung) die Maschine in Aborting führen, ohne dass ein Befehl kommt?',
        options: ['Darf er nicht', 'PackML sieht vor, dass interne Ereignisse Zustandswechsel wie Abort oder Stop auslösen', 'Nur in Execute', 'Nur in Simulation'], correct: 1,
        explain: 'Befehle kommen von außen oder von der Maschine selbst; ein Fehler ist ein typischer interner Abort-Auslöser.' },
      { type: 'single', q: 'Auf welchem Standard baut PackML begrifflich auf?',
        options: ['IEC 61131-3', 'ISA-88', 'IEC 62443', 'EN ISO 13849'], correct: 1,
        explain: 'PackML (ISA-TR88.00.02) nutzt die Konzepte des ISA-88-Modells für Maschinen.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'PackML-Zustandsmodell für eine Bandmaschine',
        task: `Implementiere das PackML-Zustandsmodell (Teilmenge ohne Suspend und Complete). Der Enum **ePackMLState** mit den Zustandsnummern ist vorgegeben, die Zustandsvariable heißt **eState**; Startzustand ist **PML_STOPPED**.

**Befehle** (jeweils steigende Flanke): diCmdReset, diCmdStart, diCmdStop, diCmdHold, diCmdUnhold, diCmdAbort, diCmdClear. Eine steigende Flanke an **diFault** wirkt wie Abort.

**Übergänge**
- STOPPED –Reset→ RESETTING –SC→ IDLE –Start→ STARTING –SC→ EXECUTE
- EXECUTE –Hold→ HOLDING –SC→ HELD –Unhold→ UNHOLDING –SC→ EXECUTE
- **Stop** aus IDLE, STARTING, EXECUTE, HOLDING, HELD, UNHOLDING, RESETTING → STOPPING –SC→ STOPPED
- **Abort** aus allen Zuständen außer ABORTING/ABORTED → ABORTING –SC→ ABORTED
- ABORTED –Clear (nur wenn diFault = FALSE)→ CLEARING –SC→ STOPPED
- Abort hat Vorrang vor Stop, Stop vor allen anderen Befehlen.

**State Complete (SC)** simulierst du mit einer Zeit je Acting State: RESETTING und STARTING 500 ms, alle anderen Acting States 300 ms. Die Zeit beginnt bei jedem Zustandswechsel neu.

**Ausgänge**: **doMotor** nur in EXECUTE, **doLampAborted** in ABORTING/ABORTED.`,
        hints: ['Zustandswechsel erkennen: `IF eState <> eLastState THEN tonSC(IN := FALSE); eLastState := eState; END_IF`', 'Zuerst Abort prüfen, dann Stop, dann das CASE mit den übrigen Befehlen.', 'Acting State und Zeit: z. B. `bActing := eState = PML_STARTING OR …`'],
        cycleMs: 10,
        io: [
          { name: 'diCmdReset', type: 'BOOL', dir: 'in', label: 'Reset', widget: 'button' },
          { name: 'diCmdStart', type: 'BOOL', dir: 'in', label: 'Start', widget: 'button' },
          { name: 'diCmdStop', type: 'BOOL', dir: 'in', label: 'Stop', widget: 'button' },
          { name: 'diCmdHold', type: 'BOOL', dir: 'in', label: 'Hold', widget: 'button' },
          { name: 'diCmdUnhold', type: 'BOOL', dir: 'in', label: 'Unhold', widget: 'button' },
          { name: 'diCmdAbort', type: 'BOOL', dir: 'in', label: 'Abort', widget: 'button' },
          { name: 'diCmdClear', type: 'BOOL', dir: 'in', label: 'Clear', widget: 'button' },
          { name: 'diFault', type: 'BOOL', dir: 'in', label: 'Maschinenfehler', widget: 'switch' },
          { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Bandmotor', widget: 'led' },
          { name: 'doLampAborted', type: 'BOOL', dir: 'out', label: 'Meldeleuchte Aborted', widget: 'led' }
        ],
        scene: { type: 'conveyor', bind: { motor: 'doMotor' } },
        files: {
          main: `PROGRAM _INIT
	eState := PML_STOPPED;
END_PROGRAM

PROGRAM _CYCLIC
	rtReset(CLK := diCmdReset);
	rtStart(CLK := diCmdStart);

	CASE eState OF
		PML_STOPPED:
			IF rtReset.Q THEN
				eState := PML_IDLE;
			END_IF
		PML_IDLE:
			IF rtStart.Q THEN
				eState := PML_EXECUTE;
			END_IF
	END_CASE

	doMotor := eState = PML_EXECUTE;
END_PROGRAM
`,
          var: 'VAR\n\teState : ePackMLState;\n\trtReset : R_TRIG;\n\trtStart : R_TRIG;\nEND_VAR\n',
          typ: PML_TYP
        },
        solution: {
          main: `PROGRAM _INIT
	eState := PML_STOPPED;
	eLastState := PML_STOPPED;
END_PROGRAM

PROGRAM _CYCLIC
	(* Befehle *)
	rtReset(CLK := diCmdReset);
	rtStart(CLK := diCmdStart);
	rtStop(CLK := diCmdStop);
	rtHold(CLK := diCmdHold);
	rtUnhold(CLK := diCmdUnhold);
	rtAbort(CLK := diCmdAbort);
	rtClear(CLK := diCmdClear);
	rtFault(CLK := diFault);

	(* State Complete simulieren: Zeit startet bei jedem Zustandswechsel neu *)
	IF eState <> eLastState THEN
		tonSC(IN := FALSE, PT := T#0s);
		eLastState := eState;
	END_IF
	IF eState = PML_RESETTING OR eState = PML_STARTING THEN
		tSC := T#500ms;
	ELSE
		tSC := T#300ms;
	END_IF
	tonSC(IN := TRUE, PT := tSC);
	bSC := tonSC.Q;

	(* Abort hat Vorrang *)
	IF (rtAbort.Q OR rtFault.Q) AND eState <> PML_ABORTING AND eState <> PML_ABORTED THEN
		eState := PML_ABORTING;
	(* dann Stop *)
	ELSIF rtStop.Q AND (eState = PML_IDLE OR eState = PML_STARTING OR eState = PML_EXECUTE
			OR eState = PML_HOLDING OR eState = PML_HELD OR eState = PML_UNHOLDING OR eState = PML_RESETTING) THEN
		eState := PML_STOPPING;
	ELSE
		CASE eState OF
			PML_STOPPED:
				IF rtReset.Q THEN eState := PML_RESETTING; END_IF
			PML_RESETTING:
				IF bSC THEN eState := PML_IDLE; END_IF
			PML_IDLE:
				IF rtStart.Q THEN eState := PML_STARTING; END_IF
			PML_STARTING:
				IF bSC THEN eState := PML_EXECUTE; END_IF
			PML_EXECUTE:
				IF rtHold.Q THEN eState := PML_HOLDING; END_IF
			PML_HOLDING:
				IF bSC THEN eState := PML_HELD; END_IF
			PML_HELD:
				IF rtUnhold.Q THEN eState := PML_UNHOLDING; END_IF
			PML_UNHOLDING:
				IF bSC THEN eState := PML_EXECUTE; END_IF
			PML_STOPPING:
				IF bSC THEN eState := PML_STOPPED; END_IF
			PML_ABORTING:
				IF bSC THEN eState := PML_ABORTED; END_IF
			PML_ABORTED:
				IF rtClear.Q AND NOT diFault THEN eState := PML_CLEARING; END_IF
			PML_CLEARING:
				IF bSC THEN eState := PML_STOPPED; END_IF
		END_CASE
	END_IF

	doMotor := eState = PML_EXECUTE;
	doLampAborted := eState = PML_ABORTING OR eState = PML_ABORTED;
END_PROGRAM
`,
          var: `VAR
	eState : ePackMLState;
	eLastState : ePackMLState;
	rtReset : R_TRIG;
	rtStart : R_TRIG;
	rtStop : R_TRIG;
	rtHold : R_TRIG;
	rtUnhold : R_TRIG;
	rtAbort : R_TRIG;
	rtClear : R_TRIG;
	rtFault : R_TRIG;
	tonSC : TON;
	tSC : TIME;
	bSC : BOOL;
END_VAR
`,
          typ: PML_TYP
        },
        tests: [
          { name: 'Hochlauf: Stopped → Resetting → Idle → Starting → Execute', steps: [
            { cycles: 2 },
            { expect: 'eState = PML_STOPPED AND NOT doMotor', msg: 'Startzustand ist STOPPED.' },
            ...pulse('diCmdStart'), { cycles: 2 },
            { expect: 'eState = PML_STOPPED', msg: 'Start ist in STOPPED ohne Wirkung.' },
            ...pulse('diCmdReset'), { cycles: 1 },
            { expect: 'eState = PML_RESETTING', msg: 'Reset aus STOPPED führt nach RESETTING.' },
            { ms: 350 },
            { expect: 'eState = PML_RESETTING', msg: 'RESETTING dauert 500 ms.' },
            { until: 'eState = PML_IDLE', maxMs: 400, msg: 'Nach State Complete muss IDLE erreicht werden.' },
            ...pulse('diCmdStart'), { cycles: 1 },
            { expect: 'eState = PML_STARTING AND NOT doMotor', msg: 'Start aus IDLE führt nach STARTING – Motor noch aus.' },
            { until: 'eState = PML_EXECUTE', maxMs: 700, msg: 'Nach STARTING muss EXECUTE folgen.' },
            { cycles: 1 },
            { expect: 'doMotor', msg: 'In EXECUTE läuft der Motor.' }
          ]},
          { name: 'Hold und Unhold', steps: [
            ...pulse('diCmdReset'), { until: 'eState = PML_IDLE', maxMs: 800 },
            ...pulse('diCmdStart'), { until: 'eState = PML_EXECUTE', maxMs: 800 },
            ...pulse('diCmdHold'), { cycles: 1 },
            { expect: 'eState = PML_HOLDING AND NOT doMotor', msg: 'Hold führt nach HOLDING, Motor aus.' },
            { until: 'eState = PML_HELD', maxMs: 500 },
            ...pulse('diCmdStart'), { cycles: 2 },
            { expect: 'eState = PML_HELD', msg: 'Start ist in HELD ohne Wirkung.' },
            ...pulse('diCmdUnhold'), { cycles: 1 },
            { expect: 'eState = PML_UNHOLDING', msg: 'Unhold führt nach UNHOLDING.' },
            { until: 'eState = PML_EXECUTE', maxMs: 500, msg: 'Nach UNHOLDING folgt EXECUTE.' }
          ]},
          { name: 'Stop aus Execute', steps: [
            ...pulse('diCmdReset'), { until: 'eState = PML_IDLE', maxMs: 800 },
            ...pulse('diCmdStart'), { until: 'eState = PML_EXECUTE', maxMs: 800 },
            ...pulse('diCmdStop'), { cycles: 1 },
            { expect: 'eState = PML_STOPPING AND NOT doMotor', msg: 'Stop führt nach STOPPING, Motor sofort aus.' },
            { until: 'eState = PML_STOPPED', maxMs: 500, msg: 'Nach STOPPING folgt STOPPED.' }
          ]},
          { name: 'Stop in Starting: Stopping dauert volle Zeit', steps: [
            ...pulse('diCmdReset'), { until: 'eState = PML_IDLE', maxMs: 800 },
            ...pulse('diCmdStart'), { ms: 400 },
            ...pulse('diCmdStop'), { cycles: 1 },
            { expect: 'eState = PML_STOPPING', msg: 'Stop in STARTING führt nach STOPPING.' },
            { ms: 200 },
            { expect: 'eState = PML_STOPPING', msg: 'STOPPING muss 300 ms dauern – wird die Zeit beim Zustandswechsel neu gestartet?' },
            { until: 'eState = PML_STOPPED', maxMs: 300 }
          ]},
          { name: 'Abort durch Fehler, Clear erst ohne Fehler', steps: [
            ...pulse('diCmdReset'), { until: 'eState = PML_IDLE', maxMs: 800 },
            { set: { diFault: true } }, { cycles: 1 },
            { expect: 'eState = PML_ABORTING AND doLampAborted', msg: 'Ein Fehler wirkt wie Abort.' },
            { until: 'eState = PML_ABORTED', maxMs: 500 },
            ...pulse('diCmdReset'), ...pulse('diCmdStop'), { cycles: 2 },
            { expect: 'eState = PML_ABORTED', msg: 'Reset und Stop sind in ABORTED ohne Wirkung.' },
            ...pulse('diCmdClear'), { cycles: 2 },
            { expect: 'eState = PML_ABORTED', msg: 'Clear darf bei anstehendem Fehler nicht wirken.' },
            { set: { diFault: false } }, { cycles: 1 },
            ...pulse('diCmdClear'), { cycles: 1 },
            { expect: 'eState = PML_CLEARING', msg: 'Clear ohne Fehler führt nach CLEARING.' },
            { until: 'eState = PML_STOPPED', maxMs: 500, msg: 'Nach CLEARING folgt STOPPED.' },
            { expect: 'NOT doLampAborted', msg: 'Meldeleuchte Aborted aus.' }
          ]},
          { name: 'Abort hat Vorrang und wirkt auch in Stopping', steps: [
            ...pulse('diCmdReset'), { until: 'eState = PML_IDLE', maxMs: 800 },
            ...pulse('diCmdStart'), { until: 'eState = PML_EXECUTE', maxMs: 800 },
            { set: { diCmdStop: true, diCmdAbort: true } }, { cycles: 1 }, { set: { diCmdStop: false, diCmdAbort: false } },
            { expect: 'eState = PML_ABORTING', msg: 'Bei gleichzeitigem Stop und Abort gewinnt Abort.' },
            { until: 'eState = PML_ABORTED', maxMs: 500 },
            ...pulse('diCmdClear'), { until: 'eState = PML_STOPPED', maxMs: 500 },
            ...pulse('diCmdReset'), { until: 'eState = PML_IDLE', maxMs: 800 },
            ...pulse('diCmdStop'), { cycles: 1 },
            ...pulse('diCmdAbort'), { cycles: 1 },
            { expect: 'eState = PML_ABORTING', msg: 'Abort muss auch in STOPPING wirken.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'PackML-Zustandsmodell'
  }
];
