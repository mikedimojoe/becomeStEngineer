// Steuerungslogik – Level 1 (Grundkurs → Prüfung Junior)
'use strict';
const { vid, br, R } = require('./_src');

const EMPTY_MAIN = `PROGRAM _INIT
	(* einmalig beim Start *)
END_PROGRAM

PROGRAM _CYCLIC
	(* dein Code *)
END_PROGRAM
`;

module.exports = [
  // ===================================================================
  {
    id: 'logik-1-einstieg',
    level: 1,
    kind: 'lektion',
    title: 'AS6-Projekt, Task-Zyklus und boolesche Logik',
    summary: 'Du legst ein AS6-Projekt an, verstehst den zyklischen Ablauf einer Task und schreibst erste Verknüpfungen in Structured Text.',
    minutes: 120,
    req: [],
    briefing: 'Jede B&R-Steuerung arbeitet zyklisch: Eingänge lesen, Programm abarbeiten, Ausgänge schreiben – in der Taskklasse alle paar Millisekunden. In Automation Studio 6 organisierst du dein Projekt in drei Sichten: Logical View (Programme, Datentypen, Bibliotheken), Configuration View (welches Programm läuft in welcher Taskklasse, auf welcher CPU) und Physical View (Hardware, I/O-Mapping). Dieses Modul legt das Fundament: Projekt anlegen, Variablen mit passenden Datentypen deklarieren (.var), Operatoren und boolesche Logik in ST anwenden. Wer den Zyklus wirklich verstanden hat, macht später bei Flanken, Timern und Zustandsautomaten keine typischen Anfängerfehler.',
    practice: 'Freigabebedingungen („Band darf laufen, wenn Schutztür zu UND kein Motorschutzfehler UND Automatik aktiv“) sind die häufigste Codezeile in jeder Maschine. Wer Öffner/Schließer und Operator-Rangfolge falsch denkt, baut Fehler, die erst an der Anlage auffallen.',
    transfer: {
      tia: 'In TIA Portal entspricht die Taskklasse dem zyklischen OB1 bzw. Weckalarm-OBs (OB30 ff.); ST heißt dort SCL. Variablen liegen in PLC-Variablentabellen bzw. Instanz-DBs statt in .var-Dateien.',
      codesys: 'In CODESYS/TwinCAT konfigurierst du Tasks in der Taskkonfiguration und weist ihnen Programme (PRG) zu. Deklaration und Code stehen dort im selben POU-Editor, in AS6 getrennt in .var und .st.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lege ein AS6-Projekt mit ARsim-Zielsystem an',
        guide: {
          intro: 'Für alle Übungen reicht die Automation Runtime Simulation (ARsim) auf deinem PC – du brauchst keine echte Hardware.',
          steps: [
            'Starte Automation Studio 6 und wähle **Datei › Neues Projekt** (Strg+Umschalt+N).',
            'Gib als Projektnamen `Logik01` an und wähle einen Pfad ohne Leer- und Sonderzeichen, z. B. `C:\\Projekte\\`.',
            'Wähle im Projektassistenten bei der Hardwarekonfiguration „Eine neue Hardwarekonfiguration manuell definieren“ und gib der Konfiguration einen Namen, z. B. `Sim`.',
            'Wähle im Katalog die Kategorie **Standard PC** und darunter **PC** – das ist das Zielsystem für ARsim. Schließe mit **Fertigstellen** ab.',
            'Wechsle zwischen den Sichten: Logical View (Strg+Alt+L), Configuration View (Strg+Alt+C), Physical View (Strg+Alt+P).'
          ],
          done: 'Erledigt, wenn dein Projekt geöffnet ist und du in allen drei Sichten erklären kannst, was dort liegt.',
          tip: 'Lege von Anfang an ein Git-Repository im Projektordner an. Die Ordner `Temp/` und `Binaries/` gehören in die `.gitignore`.',
          link: { label: 'B&R Help: Erstellen eines Projektes', url: 'https://help.br-automation.com/#/de/6/gettingstarted/general_createproject.htm' }
        }
      },
      {
        id: 'o2',
        title: 'Füge ein ST-Programm ein und ordne es einer Taskklasse zu',
        guide: {
          intro: 'Ein Programm wird erst ausgeführt, wenn es in der Software-Konfiguration der CPU einer Taskklasse zugeordnet ist.',
          steps: [
            'Markiere in der Logical View den Projektordner und öffne den **Objektkatalog** (rechts im Arbeitsbereich).',
            'Füge per Doppelklick ein **Program** in der Sprache **Structured Text** ein und nenne es `Main`. AS6 legt `Main.st` und `Main.var` (bzw. `Variables.var`) an.',
            'Wechsle in die Configuration View, öffne die **Software**-Konfiguration der CPU und prüfe, in welcher zyklischen Taskklasse (Cyclic #1 … #8) dein Programm liegt.',
            'Öffne die Eigenschaften der Taskklasse und lies Zykluszeit und Toleranz ab. Notiere beide Werte.',
            'Merke dir: Alle Programme einer Taskklasse müssen gemeinsam innerhalb der Zykluszeit fertig sein, sonst meldet die Runtime eine Zykluszeitverletzung.'
          ],
          done: 'Erledigt, wenn `Main` in einer zyklischen Taskklasse liegt und du deren Zykluszeit kennst.',
          tip: 'Schnelle Logik (z. B. Motion-nahe Abläufe) gehört in eine schnelle Taskklasse, langsame Dinge (Rezepte, Dateizugriffe) in eine langsame. Nicht alles in Cyclic #1 packen.',
          link: { label: 'B&R Help: Zyklische Taskklassen', url: 'https://help.br-automation.com/#/de/6/automationruntime/taskclasses/taskclasses_normal_sg4.html' }
        }
      },
      {
        id: 'o3',
        title: 'Deklariere Variablen mit passenden Datentypen',
        guide: {
          intro: 'Variablen deklarierst du in der .var-Datei des Programms (lokal) oder in Global.var (global). Der Datentyp bestimmt Wertebereich und Speicherbedarf.',
          steps: [
            'Öffne `Main.var` per Doppelklick. Du kannst zwischen Tabellen- und Textansicht wechseln.',
            'Deklariere in der Textansicht einen Zähler `nCycles : UDINT;`, einen Schalter `bEnable : BOOL;` und einen Messwert `rTemp : REAL := 20.0;`.',
            'Mache dir den Wertebereich klar: INT −32768…32767, UINT 0…65535, DINT ca. ±2,1 Mrd., REAL Gleitkomma mit ca. 7 signifikanten Stellen.',
            'Nutze eine einheitliche Präfix-Konvention (z. B. b = BOOL, n = Ganzzahl, r = REAL, s = STRING, t = TIME, di/do = digitale I/O).',
            'Gehe im Code mit dem Cursor auf eine Variable und springe mit Strg+D zur Deklaration.'
          ],
          code: { lang: 'var', text: 'VAR\n\tnCycles : UDINT;\n\tbEnable : BOOL;\n\trTemp : REAL := 20.0;\nEND_VAR' },
          done: 'Erledigt, wenn dein Programm ohne Fehler kompiliert (F7) und alle Variablen sinnvolle Typen haben.',
          tip: 'Wähle den kleinsten Datentyp, der sicher reicht – aber rechne mit Überlauf: Ein INT-Zähler, der alle 10 ms erhöht wird, läuft nach gut 5 Minuten über.',
          link: { label: 'B&R Help: Einfache Datentypen', url: 'https://help.br-automation.com/#/de/6/programming/datatypes/programmingmodel_datatypes_simple.html' }
        }
      },
      {
        id: 'o4',
        title: 'Übertrage das Programm und beobachte Variablen online',
        guide: {
          intro: 'Erst im Online-Betrieb siehst du, ob deine Logik tut, was du denkst.',
          steps: [
            'Kompiliere mit **F7** (Projekt › Konfiguration erstellen). Springe mit F4 zur nächsten Meldung im Ausgabefenster.',
            'Starte die ARsim und übertrage mit **Strg+F5** (Projekt › Ins Zielsystem übertragen).',
            'Aktiviere im geöffneten Code den Monitormodus mit **Strg+M** – Werte erscheinen direkt im Quelltext.',
            'Öffne über das Kontextmenü des Programms den **Watch**-Monitor, füge `nCycles` hinzu und beobachte, wie der Wert in jedem Zyklus steigt.',
            'Schreibe im Watch einen Wert auf `bEnable` und beobachte die Reaktion.'
          ],
          done: 'Erledigt, wenn du im Watch-Fenster siehst, wie `nCycles` hochzählt, und einen Eingang von Hand umschalten kannst.',
          tip: 'Rechne nach: Steigt `nCycles` in 10 s um 1000, läuft deine Taskklasse mit 10 ms. So prüfst du die Zykluszeit ohne Profiler.',
          link: { label: 'B&R Help: Variablenmonitor (Watch)', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/watch/diagnosis_watch.html' }
        }
      }
    ],
    videos: [
      vid('9HexRg_qDwI', 'de', 'Zeigt Schritt für Schritt das Anlegen eines ersten Projekts in Automation Studio.'),
      vid('0ii18sjwdiY', 'en', 'Erklärt, wie Programme Taskklassen zugeordnet werden und was die Zykluszeit bedeutet.'),
      vid('5d44GUp-mZg', 'de', 'Berufsschulvideo zu SPS-Zyklus und Reaktionszeit – genau das Denkmodell für dieses Modul.')
    ],
    readings: [
      br('automationruntime/taskclasses/taskclasses_cycletime.html', 'Zykluszeit', 'Definiert Zykluszeit, Laufzeit, Restzeit und Toleranz einer Taskklasse und erklärt die Zykluszeitverletzung.', 10),
      br('projectmanagement/logicalview/projectorganisation_logicalview.html', 'Logical View', 'Beschreibt, welche Objekte in der Logical View liegen und wie sie organisiert werden.', 10),
      R.ihkRahmenplan
    ],
    quiz: [
      { type: 'single', q: 'In welcher Sicht von Automation Studio legst du fest, in welcher Taskklasse ein Programm läuft?',
        options: ['Logical View', 'Configuration View', 'Physical View', 'Im Programmcode selbst'], correct: 1,
        explain: 'Die Zuordnung von Programmen zu Taskklassen erfolgt in der Software-Konfiguration der jeweiligen Konfiguration – also in der Configuration View.' },
      { type: 'single', q: 'Welchen Wert hat `x` nach `x := TRUE OR FALSE AND FALSE;`?',
        options: ['TRUE', 'FALSE', 'Compilerfehler', 'Abhängig vom Zyklus'], correct: 0,
        explain: 'AND bindet stärker als OR: `TRUE OR (FALSE AND FALSE)` = `TRUE OR FALSE` = TRUE. Im Zweifel immer klammern.' },
      { type: 'numeric', q: 'Ein Programm erhöht in jedem Zyklus eine Variable um 1. Die Taskklasse hat {T} ms Zykluszeit. Wie groß ist der Wert nach 60 s?',
        params: { T: [2, 20, 1] }, formula: '60000 / T', unit: '', tol: 0.01,
        explain: 'Anzahl Zyklen = Zeit / Zykluszeit = 60000 ms / T ms.' }
    ],
    exam: [
      { type: 'single', q: 'Ein Taster S2 ist als Öffner angeschlossen (unbetätigt = TRUE). Welche Bedingung bedeutet „S2 ist betätigt“?',
        options: ['diS2', 'NOT diS2', 'diS2 = 1', 'diS2 XOR TRUE = FALSE'], correct: 1,
        explain: 'Beim Öffner liefert der Eingang im Ruhezustand TRUE. Betätigt = Kontakt offen = FALSE, also `NOT diS2`. Öffner werden für Stopp-Funktionen verwendet, weil Drahtbruch dann wie „Stopp“ wirkt.' },
      { type: 'single', q: 'Was passiert, wenn die Summe der Laufzeiten aller Tasks einer Taskklasse die Zykluszeit plus Toleranz überschreitet?',
        options: ['Die Taskklasse wird einfach langsamer', 'Die Runtime meldet eine Zykluszeitverletzung und startet im Servicemodus', 'Der Compiler verhindert das', 'Die Ausgänge werden eingefroren, das Programm läuft weiter'], correct: 1,
        explain: 'Laut B&R-Hilfe ist das ein verbotener Betriebszustand: Zykluszeitverletzung mit Neustart im Servicemodus.' },
      { type: 'multi', q: 'Welche Aussagen zu Datentypen in ST sind richtig?',
        options: ['INT hat den Wertebereich −32768 … 32767', 'REAL ist für exakte Gleichheitsvergleiche gut geeignet', 'UDINT kann keine negativen Werte darstellen', 'BOOL kennt die Werte TRUE und FALSE'], correct: [0, 2, 3],
        explain: 'REAL ist Gleitkomma mit Rundungsfehlern – Vergleiche wie `rX = 0.3` sind unzuverlässig. Die übrigen Aussagen stimmen.' },
      { type: 'single', q: 'Welche Datei enthält in AS6 die lokalen Variablen eines Programms?',
        options: ['Main.st', 'Types.typ', 'Die .var-Datei des Programms', 'Cpu.sw'], correct: 2,
        explain: 'Lokale (tasklokale) Variablen stehen in der .var-Datei des Programms, globale in Global.var, Datentypen in .typ-Dateien.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Verknüpfungen an einer Leuchtmeldertafel',
        task: `Programmiere eine Leuchtmeldertafel mit drei Schaltern und vier Meldeleuchten:

- **doH1** leuchtet, wenn **diS1 UND diS2** eingeschaltet sind.
- **doH2** leuchtet, wenn **diS1 ODER diS2** eingeschaltet ist.
- **doH3** leuchtet, wenn **genau einer** der beiden Schalter diS1, diS2 eingeschaltet ist (Exklusiv-ODER).
- **doH4** leuchtet, wenn **diS1** eingeschaltet ist **und** der Öffner **diS3** betätigt ist (Öffner: unbetätigt = TRUE, betätigt = FALSE).
- **nCycles** (UDINT) zählt in jedem Zyklus um 1 hoch – so siehst du, dass dein Programm zyklisch läuft.

Schreibe die Logik als Zuweisungen in \`_CYCLIC\`, ohne IF.`,
        hints: ['Eine Zuweisung wie `doH1 := diS1 AND diS2;` wird in jedem Zyklus neu berechnet.', 'Für „genau einer“ gibt es den Operator XOR.', 'Öffner betätigt bedeutet `NOT diS3`.'],
        cycleMs: 10,
        io: [
          { name: 'diS1', type: 'BOOL', dir: 'in', label: 'Schalter S1', widget: 'switch' },
          { name: 'diS2', type: 'BOOL', dir: 'in', label: 'Schalter S2', widget: 'switch' },
          { name: 'diS3', type: 'BOOL', dir: 'in', label: 'Öffner S3 (unbetätigt = TRUE)', widget: 'switch', init: true },
          { name: 'doH1', type: 'BOOL', dir: 'out', label: 'H1: S1 UND S2', widget: 'led' },
          { name: 'doH2', type: 'BOOL', dir: 'out', label: 'H2: S1 ODER S2', widget: 'led' },
          { name: 'doH3', type: 'BOOL', dir: 'out', label: 'H3: genau einer', widget: 'led' },
          { name: 'doH4', type: 'BOOL', dir: 'out', label: 'H4: S1 und S3 betätigt', widget: 'led' },
          { name: 'nCycles', type: 'UDINT', dir: 'out', label: 'Zykluszähler', widget: 'value' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doH1', 'doH2', 'doH3', 'doH4'] } },
        files: { main: EMPTY_MAIN, var: '', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	nCycles := 0;
END_PROGRAM

PROGRAM _CYCLIC
	nCycles := nCycles + 1;
	doH1 := diS1 AND diS2;
	doH2 := diS1 OR diS2;
	doH3 := diS1 XOR diS2;
	doH4 := diS1 AND NOT diS3;
END_PROGRAM
`, var: '', typ: '' },
        tests: [
          { name: 'Grundstellung: alles aus', steps: [
            { cycles: 3 },
            { expect: 'NOT doH1 AND NOT doH2 AND NOT doH3 AND NOT doH4', msg: 'Ohne betätigte Schalter darf keine Leuchte an sein (S3 ist als Öffner TRUE).' }
          ]},
          { name: 'UND, ODER, XOR mit S1 allein', steps: [
            { set: { diS1: true } }, { cycles: 2 },
            { expect: 'NOT doH1', msg: 'H1 (UND) darf mit nur S1 nicht leuchten.' },
            { expect: 'doH2', msg: 'H2 (ODER) muss mit S1 leuchten.' },
            { expect: 'doH3', msg: 'H3 (genau einer) muss mit S1 allein leuchten.' }
          ]},
          { name: 'Beide Schalter', steps: [
            { set: { diS1: true, diS2: true } }, { cycles: 2 },
            { expect: 'doH1 AND doH2', msg: 'Mit S1 und S2 müssen H1 und H2 leuchten.' },
            { expect: 'NOT doH3', msg: 'H3 darf bei zwei eingeschalteten Schaltern nicht leuchten (XOR).' }
          ]},
          { name: 'Öffner S3 richtig ausgewertet', steps: [
            { set: { diS1: true } }, { cycles: 2 },
            { expect: 'NOT doH4', msg: 'S3 ist unbetätigt (TRUE) – H4 darf noch nicht leuchten.' },
            { set: { diS3: false } }, { cycles: 2 },
            { expect: 'doH4', msg: 'S3 betätigt (FALSE) und S1 an – H4 muss leuchten.' }
          ]},
          { name: 'Zykluszähler läuft', steps: [
            { cycles: 100 },
            { expect: 'nCycles >= 99 AND nCycles <= 101', msg: 'nCycles muss in jedem Zyklus genau um 1 steigen.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'fehlersuche',
        title: 'Fehlersuche: Freigabe eines Förderbands',
        task: `Ein Kollege hat die Freigabelogik für ein Förderband geschrieben. Bei der Inbetriebnahme läuft das Band in Situationen, in denen es stehen müsste. Finde und behebe **alle** Fehler.

**Anforderungen:**
- **doEnable** (Band freigegeben) = Automatik **diAuto** aktiv **UND** (Schutztür **diDoorLeft** zu **ODER** Wartungsschlüssel **diKeyService**) **UND** Motorschutz in Ordnung. Der Motorschutzkontakt **diMotorOk** ist ein Öffner-Signal: TRUE = in Ordnung, FALSE = ausgelöst.
- **doLampFault** leuchtet, wenn der Motorschutz ausgelöst hat.
- **doLampReady** leuchtet, wenn das Band freigegeben ist **und** die Schutztür zu ist.

Hinweis: Das ist eine Betriebsfunktion, keine Sicherheitsfunktion – Personenschutz an Schutztüren übernimmt in der Praxis die Sicherheitstechnik (z. B. SafeLOGIC).`,
        hints: ['Prüfe die Rangfolge von AND und OR – Klammern fehlen?', 'Wie ist das Öffner-Signal diMotorOk zu lesen?', 'Lies jede Zeile laut als deutschen Satz vor und vergleiche mit der Anforderung.'],
        cycleMs: 10,
        io: [
          { name: 'diAuto', type: 'BOOL', dir: 'in', label: 'Automatik', widget: 'switch' },
          { name: 'diDoorLeft', type: 'BOOL', dir: 'in', label: 'Schutztür zu', widget: 'switch' },
          { name: 'diKeyService', type: 'BOOL', dir: 'in', label: 'Wartungsschlüssel', widget: 'switch' },
          { name: 'diMotorOk', type: 'BOOL', dir: 'in', label: 'Motorschutz OK (Öffner)', widget: 'switch', init: true },
          { name: 'doEnable', type: 'BOOL', dir: 'out', label: 'Band freigegeben', widget: 'led' },
          { name: 'doLampFault', type: 'BOOL', dir: 'out', label: 'Meldeleuchte Störung', widget: 'led' },
          { name: 'doLampReady', type: 'BOOL', dir: 'out', label: 'Meldeleuchte Bereit', widget: 'led' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doEnable', 'doLampReady', 'doLampFault'] } },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Freigabe Förderband *)
	doEnable := diAuto AND diDoorLeft OR diKeyService AND NOT diMotorOk;
	doLampFault := diMotorOk;
	doLampReady := doEnable OR diDoorLeft;
END_PROGRAM
`, var: '', typ: '' },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Freigabe Förderband *)
	doEnable := diAuto AND (diDoorLeft OR diKeyService) AND diMotorOk;
	doLampFault := NOT diMotorOk;
	doLampReady := doEnable AND diDoorLeft;
END_PROGRAM
`, var: '', typ: '' },
        tests: [
          { name: 'Normalfall: Automatik, Tür zu, Motorschutz ok', steps: [
            { set: { diAuto: true, diDoorLeft: true } }, { cycles: 2 },
            { expect: 'doEnable AND doLampReady AND NOT doLampFault', msg: 'Band muss freigegeben sein, Bereit-Leuchte an, keine Störung.' }
          ]},
          { name: 'Wartungsschlüssel ohne Automatik', steps: [
            { set: { diKeyService: true } }, { cycles: 2 },
            { expect: 'NOT doEnable', msg: 'Ohne Automatik darf das Band nie freigegeben sein – auch nicht mit Wartungsschlüssel (Klammern!).' }
          ]},
          { name: 'Motorschutz ausgelöst', steps: [
            { set: { diAuto: true, diDoorLeft: true, diMotorOk: false } }, { cycles: 2 },
            { expect: 'NOT doEnable', msg: 'Bei ausgelöstem Motorschutz (FALSE) darf das Band nicht laufen.' },
            { expect: 'doLampFault', msg: 'Störungsleuchte muss bei ausgelöstem Motorschutz leuchten.' }
          ]},
          { name: 'Wartungsschlüssel ersetzt Tür', steps: [
            { set: { diAuto: true, diKeyService: true } }, { cycles: 2 },
            { expect: 'doEnable', msg: 'Automatik + Wartungsschlüssel + Motorschutz ok → Freigabe.' },
            { expect: 'NOT doLampReady', msg: 'Bereit-Leuchte nur bei geschlossener Tür.' }
          ]},
          { name: 'Tür zu allein reicht nicht für Bereit', steps: [
            { set: { diDoorLeft: true } }, { cycles: 2 },
            { expect: 'NOT doLampReady', msg: 'Bereit verlangt Freigabe UND Tür zu – nicht ODER.' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-1-speicher-zeit',
    level: 1,
    kind: 'lektion',
    title: 'Selbsthaltung, Flanken, Timer und Zähler',
    summary: 'Speichern, Flanken erkennen, Zeiten bilden und zählen – die vier Werkzeuge, die jede Ablauflogik braucht.',
    minutes: 150,
    req: ['logik-1-einstieg'],
    briefing: 'Ein Taster liefert nur so lange TRUE, wie er gedrückt ist – eine Maschine muss sich aber merken, dass sie gestartet wurde. Dafür gibt es Selbsthaltung bzw. Setz-/Rücksetzlogik mit klarer Dominanz. Weil die SPS zyklisch arbeitet, ist ein gedrückter Taster viele Zyklen lang TRUE; wer nur einmal reagieren will, braucht eine Flankenerkennung (R_TRIG, F_TRIG). Zeitverhalten bildest du mit den IEC-Timern TON, TOF und TP, Stückzahlen mit Zählern. Alle diese Bausteine sind Funktionsbausteine mit Gedächtnis: Sie brauchen eine Instanz und müssen in jedem Zyklus aufgerufen werden.',
    practice: 'Start/Stopp mit Selbsthaltung, Teilezählung an der Lichtschranke, Anlaufwarnung, Lüfternachlauf – das ist Alltag an jedem Förderband. Der klassische Fehler: Zählen ohne Flanke (ein Teil = 20 Zählimpulse) oder ein Timer, der nur innerhalb eines IF aufgerufen wird.',
    transfer: {
      tia: 'TIA Portal nutzt dieselben IEC-Timer (TON, TOF, TP) als Multiinstanz oder Instanz-DB; Flanken mit R_TRIG/F_TRIG oder P_TRIG/N_TRIG. Selbsthaltung in SCL ebenfalls als boolesche Zuweisung oder mit SR/RS.',
      codesys: 'Identische Standardbausteine aus der Standard-Bibliothek (TON, TOF, TP, R_TRIG, CTU …). Instanzen deklarierst du im VAR-Bereich des POUs.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Programmiere eine Selbsthaltung mit Rücksetzdominanz',
        guide: {
          intro: 'Die Selbsthaltung „hält“ den Ausgang über sich selbst. Entscheidend ist, wer gewinnt, wenn Start und Stopp gleichzeitig anliegen.',
          steps: [
            'Schreibe die Grundform: `doMotor := (diStart OR doMotor) AND diStop;` – diStop ist ein Öffner (TRUE = nicht gedrückt).',
            'Prüfe gedanklich: Start und Stopp gleichzeitig gedrückt → Ergebnis FALSE. Das ist **rücksetzdominant** und für Stopp-Funktionen Pflicht.',
            'Alternativ mit IF: zuerst Setzbedingung, danach Rücksetzbedingung – die zuletzt ausgeführte Anweisung gewinnt.',
            'Teste online mit Strg+M: Start kurz drücken, Ausgang bleibt an; Stopp drücken, Ausgang fällt ab.'
          ],
          code: { lang: 'st', text: 'IF diStart THEN\n\tdoMotor := TRUE;\nEND_IF\nIF NOT diStop OR NOT diMotorOk THEN\n\tdoMotor := FALSE; (* zuletzt = dominant *)\nEND_IF' },
          done: 'Erledigt, wenn dein Ausgang bei gleichzeitigem Start und Stopp sicher aus bleibt.',
          tip: 'Die Standardbausteine RS (rücksetzdominant) und SR (setzdominant) machen die Dominanz explizit lesbar.',
          link: { label: 'B&R Help: IF-Anweisung', url: 'https://help.br-automation.com/#/de/6/programming/programs/structuredtext/programmingmodel_programs_structuredtext_if.html' }
        }
      },
      {
        id: 'o2',
        title: 'Erkenne Flanken mit R_TRIG und F_TRIG',
        guide: {
          intro: 'R_TRIG liefert genau einen Zyklus lang Q = TRUE, wenn CLK von FALSE auf TRUE wechselt.',
          steps: [
            'Deklariere in der .var-Datei eine Instanz: `rtStart : R_TRIG;`.',
            'Rufe die Instanz **in jedem Zyklus unbedingt** auf: `rtStart(CLK := diStart);`.',
            'Werte danach `rtStart.Q` aus, z. B. `IF rtStart.Q THEN nCount := nCount + 1; END_IF`.',
            'Beobachte im Watch, dass `rtStart.Q` nur einen Zyklus TRUE ist – im Monitormodus siehst du es meist gar nicht aufblitzen. Nutze einen Zähler, um es zu beweisen.'
          ],
          done: 'Erledigt, wenn ein Tastendruck den Zähler genau um 1 erhöht, egal wie lange du drückst.',
          tip: 'Rufe Flanken- und Timer-Instanzen nie nur innerhalb eines IF auf. Sonst sehen sie den Signalwechsel nicht und reagieren beim nächsten Mal falsch.',
          link: { label: 'B&R Help: R_TRIG()', url: 'https://help.br-automation.com/#/de/6/libraries/standard/fbks/r_trig.html' }
        }
      },
      {
        id: 'o3',
        title: 'Setze TON, TOF und TP gezielt ein',
        guide: {
          intro: 'TON verzögert das Einschalten, TOF das Ausschalten, TP erzeugt einen Impuls fester Länge.',
          steps: [
            'Deklariere `tonReady : TON;` und rufe ihn auf: `tonReady(IN := diRun, PT := T#2s);` – `tonReady.Q` wird 2 s nach diRun TRUE.',
            'Deklariere `tofFan : TOF;` – `tofFan(IN := diRun, PT := T#3s);` hält `Q` nach dem Abschalten von diRun noch 3 s.',
            'Probiere `TP`: Ein kurzer Impuls an IN erzeugt einen Ausgangsimpuls von genau PT – nachtriggern während des Impulses ist nicht möglich.',
            'Lies `ET` (Elapsed Time) im Watch mit, um das Zeitverhalten zu sehen.',
            'Zeichne für jeden Timer ein Zeitdiagramm IN/Q/ET und vergleiche mit der Messung.'
          ],
          code: { lang: 'st', text: 'tonReady(IN := diRun, PT := T#2s);\ntofFan(IN := diRun, PT := T#3s);\ndoReady := tonReady.Q;\ndoFan := tofFan.Q;' },
          done: 'Erledigt, wenn du für alle drei Timer das Zeitdiagramm erklären kannst und es mit der Simulation übereinstimmt.',
          tip: 'Die Timer-Auflösung ist durch die Zykluszeit begrenzt: Ein TON mit 25 ms in einer 10-ms-Task schaltet nach 30 ms.',
          link: { label: 'B&R Help: TON()', url: 'https://help.br-automation.com/#/de/6/libraries/standard/fbks/ton.html' }
        }
      },
      {
        id: 'o4',
        title: 'Zähle Ereignisse flankengesteuert',
        guide: {
          intro: 'Zähler erhöhen sich nur bei einer Flanke – sonst zählt jeder Zyklus.',
          steps: [
            'Nutze entweder den Standardbaustein `CTU` (zählt bei steigender Flanke an CU) oder R_TRIG + eigene Addition.',
            'Lege eine Rücksetzbedingung fest (z. B. Quittiertaster) und prüfe, dass das Rücksetzen Vorrang hat.',
            'Vergleiche den Zählerstand mit einem Sollwert (z. B. 5 Teile = Karton voll) und leite eine Meldung ab.',
            'Teste den Grenzfall: Was passiert beim 6. Teil, wenn der Karton schon voll ist?'
          ],
          done: 'Erledigt, wenn dein Zähler auch bei langsam vorbeifahrenden Teilen genau eins pro Teil zählt.',
          tip: 'Für Produktionszähler, die einen Neustart überleben müssen, gibt es Retain-Variablen – in AS6 als „permanente“ bzw. Retain-Variablen konfigurierbar.',
          link: { label: 'B&R Help: Retain Variablen', url: 'https://help.br-automation.com/#/de/6/programming/variables/retainvariables_retainvariables.html' }
        }
      }
    ],
    videos: [
      vid('rcG7HphQxWU', 'de', 'Flipflops, Trigger, Zähler und Zeitgeber der IEC 61131-3 in einem Durchgang erklärt.'),
      vid('Y1Nr0-9u3o0', 'de', 'Hochschulvorlesung zur Flankenauswertung mit R_TRIG und F_TRIG.'),
      vid('MLsgFp5nRKk', 'en', 'Selbsthaltung, Set/Reset und SR/RS in ST – mit Fokus auf die Dominanz.')
    ],
    readings: [
      R.adam,
      br('libraries/standard/fbks/ton.html', 'STANDARD - TON()', 'Offizielle Beschreibung von Ein- und Ausgängen sowie Zeitverhalten des TON in AS6.', 10),
      br('libraries/standard/fbks/r_trig.html', 'STANDARD - R_TRIG()', 'Funktionsweise der Flankenerkennung aus der STANDARD-Bibliothek.', 5)
    ],
    quiz: [
      { type: 'single', q: 'Ein Teil fährt 300 ms lang an einer Lichtschranke vorbei, die Task läuft mit 10 ms. Um wie viel erhöht sich `nParts`, wenn der Code `IF diSensor THEN nParts := nParts + 1; END_IF` lautet?',
        options: ['1', 'etwa 30', '300', '0'], correct: 1,
        explain: 'Der Sensor ist ca. 30 Zyklen TRUE – ohne Flankenerkennung wird in jedem davon gezählt.' },
      { type: 'single', q: 'Welcher Timer hält einen Lüfter nach dem Abschalten des Motors noch eine Zeit lang an?',
        options: ['TON', 'TOF', 'TP', 'CTU'], correct: 1,
        explain: 'TOF (Ausschaltverzögerung): Q folgt IN sofort auf TRUE und fällt erst PT nach dem Abfallen von IN ab.' },
      { type: 'single', q: 'Was ist das Ergebnis von `doMotor := (diStart OR doMotor) AND diStop;`, wenn Start gedrückt ist und gleichzeitig der Stopp-Öffner betätigt wird (diStop = FALSE)?',
        options: ['TRUE – Start gewinnt', 'FALSE – Stopp gewinnt', 'Der alte Wert bleibt', 'Abhängig von der Reihenfolge im Zyklus'], correct: 1,
        explain: 'Das UND mit diStop macht die Schaltung rücksetzdominant – Stopp gewinnt immer.' }
    ],
    exam: [
      { type: 'single', q: 'Warum ist folgender Code fehlerhaft?', code: { lang: 'st', text: 'IF diRun THEN\n\ttonDelay(IN := TRUE, PT := T#2s);\nEND_IF\ndoReady := tonDelay.Q;' },
        options: ['T#2s ist keine gültige Zeitangabe', 'Der Timer wird bei diRun = FALSE nicht aufgerufen und deshalb nie zurückgesetzt', 'TON darf nicht in IF stehen, das gibt einen Compilerfehler', 'doReady wird nie TRUE'], correct: 1,
        explain: 'Wird die Instanz nicht aufgerufen, sieht sie IN = FALSE nie. Q bleibt TRUE, beim nächsten Start ist doReady sofort da. Timer immer unbedingt aufrufen.' },
      { type: 'numeric', q: 'Ein TON hat PT = {P} ms und läuft in einer Taskklasse mit 10 ms. Nach wie vielen Zyklen (mindestens) wird Q TRUE, wenn IN dauerhaft TRUE ist?',
        params: { P: [100, 2000, 100] }, formula: 'P / 10', unit: 'Zyklen', tol: 0.05,
        explain: 'Q wird TRUE, sobald ET ≥ PT ist, also nach PT / Zykluszeit Zyklen (± 1 Zyklus je nach Aufrufzeitpunkt).' },
      { type: 'multi', q: 'Welche Aussagen zu Funktionsbaustein-Instanzen (TON, R_TRIG …) sind richtig?',
        options: ['Jede Instanz hat ein eigenes Gedächtnis', 'Eine Instanz darf für mehrere unabhängige Signale verwendet werden', 'Instanzen werden in der .var-Datei deklariert', 'Instanzen müssen in jedem Zyklus aufgerufen werden, damit sie Signalwechsel sehen'], correct: [0, 2, 3],
        explain: 'Eine Instanz für mehrere Signale vermischt deren Zustände – jede Aufgabe bekommt eine eigene Instanz.' },
      { type: 'single', q: 'Welcher Baustein erzeugt bei einem 50-ms-Tastendruck einen Ausgangsimpuls von genau 1 s?',
        options: ['TON mit PT = T#1s', 'TOF mit PT = T#1s', 'TP mit PT = T#1s', 'F_TRIG'], correct: 2,
        explain: 'TP (Pulse) startet mit der steigenden Flanke einen Impuls der Länge PT, unabhängig von der Dauer des Eingangs.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Förderband mit Selbsthaltung und Teilezählung',
        task: `Ein Förderband transportiert Teile zu einer Lichtschranke am Bandende. Programmiere:

1. **Start/Stopp:** Ein kurzer Druck auf **diStart** startet das Band (**doMotor**), es läuft nach dem Loslassen weiter (Selbsthaltung).
2. **Stopp-Öffner diStop** (TRUE = nicht betätigt) und **Motorschutz diMotorOk** (TRUE = in Ordnung) schalten das Band sofort ab. Stopp ist dominant: Start bei gleichzeitig betätigtem Stopp darf das Band nicht starten.
3. **Teilezählung:** Jedes Teil, das die Lichtschranke **diEnd** erreicht, erhöht **nParts** (INT) um genau 1 – egal wie lange das Teil vor der Lichtschranke steht.
4. **Karton voll:** Bei **nParts = 5** stoppt das Band, **doFull** leuchtet. Solange doFull ansteht, lässt sich das Band nicht starten.
5. **diReset** setzt nParts auf 0 und löscht doFull.

Die Anlagensimulation bewegt das Teil nur bei laufendem Band (ca. 2 s pro Teil, Lichtschranke ca. 0,2 s belegt).`,
        hints: ['Für die Zählung brauchst du eine R_TRIG-Instanz auf diEnd.', 'Rufe die R_TRIG-Instanz in jedem Zyklus auf, nicht nur bei laufendem Band.', 'Reihenfolge: erst zählen, dann voll-Bedingung, dann die Selbsthaltung mit allen Abschaltbedingungen.'],
        cycleMs: 10,
        io: [
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start-Taster S1', widget: 'button' },
          { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Stopp-Taster S0 (Öffner)', widget: 'switch', init: true },
          { name: 'diMotorOk', type: 'BOOL', dir: 'in', label: 'Motorschutz Q1 OK', widget: 'switch', init: true },
          { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Zähler zurücksetzen', widget: 'button' },
          { name: 'diEnd', type: 'BOOL', dir: 'in', label: 'Lichtschranke Bandende B1', widget: 'led' },
          { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Schütz K1 Bandmotor', widget: 'led' },
          { name: 'doFull', type: 'BOOL', dir: 'out', label: 'Meldung Karton voll', widget: 'led' },
          { name: 'nParts', type: 'INT', dir: 'out', label: 'Teilezähler', widget: 'value' },
          { name: 'rPartPos', type: 'REAL', dir: 'in', label: 'Teileposition (Simulation)', widget: 'gauge', min: 0, max: 1 }
        ],
        scene: { type: 'conveyor', bind: { motor: 'doMotor', sensor: 'diEnd', partPos: 'rPartPos', count: 'nParts' } },
        plant: {
          var: 'VAR\n\trPos : REAL;\nEND_VAR\n',
          code: `IF doMotor THEN
	rPos := rPos + 0.5 * PLANT_DT;
	IF rPos >= 1.0 THEN
		rPos := 0.0;
	END_IF
END_IF
rPartPos := rPos;
diEnd := rPos >= 0.8 AND rPos < 0.9;
`
        },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Start/Stopp – noch ohne Selbsthaltung *)
	doMotor := diStart AND diStop;
END_PROGRAM
`, var: 'VAR\n\t(* hier deine Instanzen und Hilfsvariablen *)\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	nParts := 0;
	doFull := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	(* Teilezählung mit Flanke *)
	rtEnd(CLK := diEnd);
	IF rtEnd.Q THEN
		nParts := nParts + 1;
	END_IF
	IF diReset THEN
		nParts := 0;
	END_IF
	doFull := nParts >= 5;

	(* Selbsthaltung, rücksetzdominant *)
	IF diStart AND NOT doFull THEN
		doMotor := TRUE;
	END_IF
	IF NOT diStop OR NOT diMotorOk OR doFull THEN
		doMotor := FALSE;
	END_IF
END_PROGRAM
`, var: 'VAR\n\trtEnd : R_TRIG;\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Start mit Selbsthaltung', steps: [
            { set: { diStart: true } }, { cycles: 2 },
            { expect: 'doMotor', msg: 'Start-Taster muss das Band starten.' },
            { set: { diStart: false } }, { ms: 300 },
            { expect: 'doMotor', msg: 'Selbsthaltung fehlt: Band muss nach Loslassen weiterlaufen.' }
          ]},
          { name: 'Stopp ist dominant', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
            { set: { diStop: false } }, { cycles: 2 },
            { expect: 'NOT doMotor', msg: 'Stopp-Öffner betätigt (FALSE) muss das Band stoppen.' },
            { set: { diStart: true } }, { cycles: 3 },
            { expect: 'NOT doMotor', msg: 'Start bei betätigtem Stopp darf das Band nicht starten (Rücksetzdominanz).' }
          ]},
          { name: 'Motorschutz schaltet ab', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { ms: 200 },
            { set: { diMotorOk: false } }, { cycles: 2 },
            { expect: 'NOT doMotor', msg: 'Ausgelöster Motorschutz muss das Band abschalten.' },
            { set: { diMotorOk: true } }, { ms: 200 },
            { expect: 'NOT doMotor', msg: 'Nach Rückkehr des Motorschutzes darf das Band nicht von selbst wieder anlaufen.' }
          ]},
          { name: 'Ein Teil = ein Zählimpuls', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { ms: 2500 },
            { expect: 'nParts = 1', msg: 'Nach dem ersten Teil muss nParts genau 1 sein – Flankenerkennung fehlt?' }
          ]},
          { name: 'Karton voll und Reset', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { until: 'doFull', maxMs: 12000, msg: 'Nach 5 Teilen muss doFull kommen.' },
            { cycles: 2 },
            { expect: 'NOT doMotor AND nParts = 5', msg: 'Bei 5 Teilen muss das Band stehen und nParts = 5 sein.' },
            { set: { diStart: true } }, { cycles: 3 }, { set: { diStart: false } },
            { expect: 'NOT doMotor', msg: 'Bei vollem Karton darf das Band nicht starten.' },
            { set: { diReset: true } }, { cycles: 2 }, { set: { diReset: false } }, { cycles: 2 },
            { expect: 'nParts = 0 AND NOT doFull', msg: 'diReset muss Zähler und Meldung zurücksetzen.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'fehlersuche',
        title: 'Fehlersuche: Anlaufverzögerung und Lüfternachlauf',
        task: `Ein Motor wird über **diRun** eingeschaltet (doMotor folgt diRun). Zusätzlich gilt:

- **doReady** meldet „Motor hochgelaufen“ **2 s** nach dem Einschalten. Beim Ausschalten fällt doReady sofort ab. Bei jedem neuen Einschalten muss wieder 2 s gewartet werden.
- **doFan** (Lüfter) läuft, solange der Motor läuft, und **3 s nach** dem Ausschalten weiter.
- **nStarts** zählt jede Einschaltung (steigende Flanke von diRun) genau einmal.

Der vorhandene Code erfüllt das nicht. Finde die Fehler und korrigiere sie.`,
        hints: ['Wird jede Timer-Instanz in jedem Zyklus aufgerufen?', 'Welcher Timer-Typ passt zu „läuft nach“?', 'Prüfe die Zeitangaben genau.'],
        cycleMs: 10,
        io: [
          { name: 'diRun', type: 'BOOL', dir: 'in', label: 'Motor ein', widget: 'switch' },
          { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Motor', widget: 'led' },
          { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Hochgelaufen', widget: 'led' },
          { name: 'doFan', type: 'BOOL', dir: 'out', label: 'Lüfter', widget: 'led' },
          { name: 'nStarts', type: 'INT', dir: 'out', label: 'Anzahl Starts', widget: 'value' }
        ],
        scene: { type: 'motor', bind: { run: 'doMotor' } },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	doMotor := diRun;

	IF diRun THEN
		tonReady(IN := TRUE, PT := T#2s);
		IF diRun THEN
			nStarts := nStarts + 1;
		END_IF
	END_IF
	doReady := tonReady.Q;

	tofFan(IN := NOT diRun, PT := T#3ms);
	doFan := tofFan.Q;
END_PROGRAM
`, var: 'VAR\n\ttonReady : TON;\n\ttofFan : TON;\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	doMotor := diRun;

	tonReady(IN := diRun, PT := T#2s);
	doReady := tonReady.Q;

	rtRun(CLK := diRun);
	IF rtRun.Q THEN
		nStarts := nStarts + 1;
	END_IF

	tofFan(IN := diRun, PT := T#3s);
	doFan := tofFan.Q;
END_PROGRAM
`, var: 'VAR\n\ttonReady : TON;\n\ttofFan : TOF;\n\trtRun : R_TRIG;\nEND_VAR\n', typ: '' },
        tests: [
          { name: 'Hochlaufmeldung nach 2 s', steps: [
            { set: { diRun: true } }, { ms: 1800 },
            { expect: 'doMotor AND NOT doReady', msg: 'doReady darf nicht vor 2 s kommen.' },
            { ms: 400 },
            { expect: 'doReady', msg: 'doReady muss nach 2 s TRUE sein.' }
          ]},
          { name: 'Neuer Start wartet erneut 2 s', steps: [
            { set: { diRun: true } }, { ms: 2500 },
            { set: { diRun: false } }, { cycles: 2 },
            { expect: 'NOT doReady', msg: 'Beim Ausschalten muss doReady sofort abfallen.' },
            { set: { diRun: true } }, { cycles: 5 },
            { expect: 'NOT doReady', msg: 'Nach Neustart muss wieder 2 s gewartet werden – wird der Timer immer aufgerufen?' }
          ]},
          { name: 'Lüfter läuft mit und 3 s nach', steps: [
            { set: { diRun: true } }, { cycles: 3 },
            { expect: 'doFan', msg: 'Lüfter muss mit dem Motor laufen.' },
            { set: { diRun: false } }, { ms: 2700 },
            { expect: 'doFan', msg: 'Lüfter muss 3 s nachlaufen.' },
            { ms: 500 },
            { expect: 'NOT doFan', msg: 'Lüfter muss nach 3 s aus sein.' }
          ]},
          { name: 'Lüfter ist im Ruhezustand aus', steps: [
            { ms: 4000 },
            { expect: 'NOT doFan', msg: 'Ohne Motorlauf darf der Lüfter nicht laufen.' }
          ]},
          { name: 'Starts werden einmal gezählt', steps: [
            { set: { diRun: true } }, { ms: 500 }, { set: { diRun: false } }, { ms: 200 },
            { set: { diRun: true } }, { ms: 500 },
            { expect: 'nStarts = 2', msg: 'Zwei Einschaltungen müssen nStarts = 2 ergeben (Flanke!).' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-1-projekt-ampel',
    level: 1,
    kind: 'projekt',
    title: 'Praxisprojekt: Fußgänger-Bedarfsampel',
    summary: 'Du programmierst eine Bedarfsampel mit Schrittvariable, Timern und Mindestgrünzeit – dein erstes vollständiges Ablaufprogramm.',
    minutes: 240,
    req: ['logik-1-speicher-zeit'],
    briefing: 'Eine Bedarfsampel ist ein ideales erstes Ablaufprogramm: wenige Signale, aber klare Zeitfolgen, eine gespeicherte Anforderung und eine harte Bedingung, die nie verletzt werden darf (Kfz-Grün und Fußgänger-Grün nie gleichzeitig). Du arbeitest mit einer Schrittvariablen (INT) und IF/ELSIF, einem Schritt-Timer und einer Mindestgrünzeit. Das Muster „Schritt + Timer + Transition“ ist die Vorstufe zur Schrittkette mit CASE und Enum in Level 2.',
    practice: 'Dasselbe Muster steckt in jeder Taktstraße: Schritt aktiv, Aktion ausführen, auf Zeit oder Sensor warten, weiterschalten – und Verriegelungen, die in keinem Zustand verletzt werden dürfen.',
    transfer: {
      tia: 'In TIA Portal würdest du das als SCL-Baustein mit Schrittvariable oder mit GRAPH umsetzen.',
      codesys: 'In CODESYS bietet sich SFC (AS) an; die textuelle Variante mit Schrittvariable funktioniert identisch.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf den Ablauf als Zeitdiagramm und Schrittliste',
        guide: {
          intro: 'Bevor du Code schreibst, legst du Schritte, Ausgänge und Weiterschaltbedingungen fest.',
          steps: [
            'Lege eine Tabelle an: Schritt-Nr., Kfz-Signal, Fußgänger-Signal, Dauer bzw. Weiterschaltbedingung.',
            'Schritte: 0 Kfz grün (Grundstellung) → 1 Kfz gelb 2 s → 2 Alles rot 1 s → 3 Fußgänger grün 4 s → 4 Räumzeit 2 s → 5 Kfz rot-gelb 1 s → 0.',
            'Lege fest: Schritt 0 → 1 nur, wenn eine Anforderung gespeichert ist **und** die Mindestgrünzeit von 6 s abgelaufen ist.',
            'Markiere die Verriegelung: In keinem Schritt dürfen Kfz-Grün und Fußgänger-Grün gleichzeitig TRUE sein.'
          ],
          done: 'Erledigt, wenn deine Schrittliste vollständig ist und jede Weiterschaltbedingung eindeutig ist.',
          tip: 'Zeitdiagramme vor dem Programmieren sparen an der Anlage Stunden. Lege sie mit ins Repository.'
        }
      },
      {
        id: 'o2',
        title: 'Programmiere Schrittvariable und Schritt-Timer',
        guide: {
          intro: 'Ein einziger Timer genügt, wenn er bei jedem Schrittwechsel neu gestartet wird.',
          steps: [
            'Deklariere `nStep : INT;`, `nStepLast : INT;`, `tonStep : TON;` und `tStepTime : TIME;`.',
            'Erkenne den Schrittwechsel: Wenn `nStep <> nStepLast`, rufe `tonStep(IN := FALSE)` auf und merke dir den neuen Schritt.',
            'Wähle die Schrittzeit mit IF/ELSIF je nach nStep und rufe `tonStep(IN := TRUE, PT := tStepTime);` auf.',
            'Schreibe die Transitionen als IF/ELSIF-Kette: `IF nStep = 1 AND tonStep.Q THEN nStep := 2; ...`',
            'Bilde die Ausgänge **am Ende** aus nStep, z. B. `doGreen := nStep = 0;`.'
          ],
          code: { lang: 'st', text: 'IF nStep <> nStepLast THEN\n\ttonStep(IN := FALSE);\n\tnStepLast := nStep;\nEND_IF\ntonStep(IN := TRUE, PT := tStepTime);' },
          done: 'Erledigt, wenn die Ampel ohne Anforderung dauerhaft Kfz-grün zeigt und der Ablauf nach einer Anforderung korrekt durchläuft.',
          tip: 'Ausgänge nur an einer Stelle aus dem Schritt ableiten – nie in mehreren IF-Zweigen setzen und rücksetzen.',
          link: { label: 'B&R Help: Beispiel TON in ST', url: 'https://help.br-automation.com/#/de/6/libraries/standard/samples/st/ex_st_ton.html' }
        }
      },
      {
        id: 'o3',
        title: 'Speichere die Anforderung und sichere die Mindestgrünzeit',
        guide: {
          intro: 'Ein kurzer Tastendruck muss genügen – und der Kfz-Verkehr bekommt trotzdem seine Mindestgrünzeit.',
          steps: [
            'Speichere die Anforderung bei einer steigenden Flanke von diRequest (R_TRIG) in `bRequest`.',
            'Zeige die gespeicherte Anforderung mit **doWait** („Signal kommt“) an.',
            'Lösche bRequest, sobald die Fußgänger-Grünphase beginnt.',
            'Rufe einen eigenen TON für die Mindestgrünzeit auf: `tonMinGreen(IN := nStep = 0, PT := T#6s);`.'
          ],
          done: 'Erledigt, wenn eine Anforderung direkt nach dem Umschalten auf Kfz-Grün erst nach 6 s zu Gelb führt.',
          tip: 'Teste Grenzfälle: Anforderung während Fußgänger-Grün, Dauerdruck, Anforderung kurz vor Ablauf der Mindestgrünzeit.'
        }
      },
      {
        id: 'o4',
        title: 'Dokumentiere und reiche das Projekt ein',
        guide: {
          intro: 'Ein Praxisprojekt ist erst fertig, wenn ein Kollege es versteht und nachprüfen kann.',
          steps: [
            'Kommentiere jeden Schritt im Code mit seiner Bedeutung.',
            'Lege dein Zeitdiagramm (Bild oder Markdown-Tabelle) in das Repository.',
            'Committe mit einer aussagekräftigen Nachricht, z. B. `feat: Bedarfsampel mit Mindestgrünzeit`, und pushe auf git.breitner.de.',
            'Reiche den Link als Nachweis ein.'
          ],
          done: 'Erledigt, wenn alle automatischen Tests grün sind und der Link zu deinem Repository eingereicht ist.',
          tip: 'Bitte einen Kollegen, deinen Code ohne Erklärung zu lesen. Was er nicht versteht, braucht einen Kommentar oder einen besseren Namen.'
        }
      }
    ],
    videos: [
      vid('CJQEOftD4aM', 'de', 'Einführung in Ablaufsteuerungen und Schrittketten aus Sicht der Elektroniker-Prüfung.'),
      vid('EYGlEg0OXjs', 'de', 'Wiederholung: Prozessabbild und Zyklus – warum Ausgänge erst am Zyklusende wirken.')
    ],
    readings: [
      br('libraries/standard/samples/st/ex_st_ton.html', 'STANDARD - Beispiel TON in strukturiertem Text', 'Kurzes B&R-Beispiel für den korrekten Aufruf eines TON in ST.', 5),
      br('programming/programs/structuredtext/programmingmodel_programs_structuredtext_if.html', 'IF-Anweisung', 'Syntax von IF/ELSIF/ELSE in Automation Studio.', 5),
      R.bibb
    ],
    quiz: [
      { type: 'single', q: 'Warum werden die Ampelausgänge am Ende des Zyklus aus `nStep` abgeleitet statt in den Transitionen gesetzt?',
        options: ['Weil ST das so vorschreibt', 'Damit jeder Ausgang genau eine Zuweisung hat und kein Schritt einen Ausgang „vergisst“', 'Weil Timer sonst nicht funktionieren', 'Wegen der Zykluszeit'], correct: 1,
        explain: 'Eine zentrale Ausgangszuweisung pro Signal macht Verriegelungen prüfbar und verhindert hängende Ausgänge.' },
      { type: 'single', q: 'Welche Bedingung muss in keinem Schritt jemals TRUE werden?',
        options: ['doRed AND doYellow', 'doGreen AND doPedGreen', 'doPedRed AND doRed', 'doWait AND doGreen'], correct: 1,
        explain: 'Kfz-Grün und Fußgänger-Grün gleichzeitig wäre ein gefährlicher Zustand. Rot-Gelb und „Signal kommt“ während Grün sind normal.' },
      { type: 'numeric', q: 'Gelb 2 s, Alles-Rot 1 s, Fußgänger-Grün {G} s, Räumzeit 2 s, Rot-Gelb 1 s. Wie lange dauert ein Fußgängerzyklus ohne Kfz-Grün?',
        params: { G: [4, 15, 1] }, formula: '2 + 1 + G + 2 + 1', unit: 's', tol: 0.01,
        explain: 'Summe aller Schrittzeiten außer Kfz-Grün.' }
    ],
    exam: [
      { type: 'single', q: 'Was passiert, wenn der Schritt-Timer beim Schrittwechsel nicht zurückgesetzt wird?',
        options: ['Nichts, TON setzt sich selbst zurück', 'Der neue Schritt sieht sofort tonStep.Q = TRUE und wird übersprungen', 'Der Timer läuft doppelt so schnell', 'Compilerfehler'], correct: 1,
        explain: 'Bleibt IN dauerhaft TRUE, bleibt auch Q TRUE – jeder folgende Schritt würde sofort weiterschalten.' },
      { type: 'single', q: 'Warum speichert man die Fußgängeranforderung bei der steigenden Flanke statt den Tasterpegel auszuwerten?',
        options: ['Ein kurzer Tastendruck während der Mindestgrünzeit würde sonst verloren gehen', 'Pegel sind in ST nicht auswertbar', 'Weil der Taster prellt', 'Damit doWait blinkt'], correct: 0,
        explain: 'Die Anforderung muss gespeichert werden, bis sie bedient ist. Die Flanke sorgt zusätzlich dafür, dass Dauerdruck nicht mehrfach anfordert.' },
      { type: 'multi', q: 'Welche Tests gehören zu einer vollständigen Abnahme der Bedarfsampel?',
        options: ['Grundstellung nach Neustart', 'Anforderung während der Mindestgrünzeit', 'Verriegelung Kfz-Grün/Fußgänger-Grün über einen ganzen Zyklus', 'Ausschließlich der Normalablauf'], correct: [0, 1, 2],
        explain: 'Gute Tests prüfen Normalfall, Grenzfall und die harte Verriegelung – nicht nur den „Gutfall“.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Bedarfsampel mit Mindestgrünzeit',
        task: `Programmiere die Fußgänger-Bedarfsampel:

| Schritt | Kfz | Fußgänger | Weiter, wenn … |
|---|---|---|---|
| 0 | grün | rot | Anforderung gespeichert **und** Kfz-Grün seit ≥ 6 s |
| 1 | gelb | rot | 2 s |
| 2 | rot | rot | 1 s |
| 3 | rot | grün | 4 s |
| 4 | rot | rot (Räumzeit) | 2 s |
| 5 | rot + gelb | rot | 1 s → Schritt 0 |

- **diRequest** (Taster): Ein kurzer Druck während Kfz-Grün speichert die Anforderung. **doWait** („Signal kommt“) leuchtet, solange die Anforderung gespeichert ist; sie wird mit Beginn von Fußgänger-Grün gelöscht.
- Die Mindestgrünzeit von 6 s gilt ab Beginn jeder Kfz-Grünphase (auch nach dem Programmstart).
- Kfz-Grün und Fußgänger-Grün dürfen **niemals** gleichzeitig an sein; Fußgänger-Grün nur, wenn Kfz rot ist.
- Verwende eine Schrittvariable (INT) und IF/ELSIF – CASE lernst du in Level 2.`,
        hints: ['Ein Schritt-Timer, der bei jedem Schrittwechsel mit IN := FALSE zurückgesetzt wird, reicht für alle Schrittzeiten.', 'Leite alle Ausgänge am Ende des Zyklus aus nStep ab.', 'Für die Mindestgrünzeit: eigener TON mit IN := (nStep = 0).'],
        cycleMs: 10,
        io: [
          { name: 'diRequest', type: 'BOOL', dir: 'in', label: 'Anforderungstaster', widget: 'button' },
          { name: 'doRed', type: 'BOOL', dir: 'out', label: 'Kfz rot', widget: 'led' },
          { name: 'doYellow', type: 'BOOL', dir: 'out', label: 'Kfz gelb', widget: 'led' },
          { name: 'doGreen', type: 'BOOL', dir: 'out', label: 'Kfz grün', widget: 'led' },
          { name: 'doPedRed', type: 'BOOL', dir: 'out', label: 'Fußgänger rot', widget: 'led' },
          { name: 'doPedGreen', type: 'BOOL', dir: 'out', label: 'Fußgänger grün', widget: 'led' },
          { name: 'doWait', type: 'BOOL', dir: 'out', label: 'Signal kommt', widget: 'led' }
        ],
        scene: { type: 'trafficlight', bind: { red: 'doRed', yellow: 'doYellow', green: 'doGreen', pedRed: 'doPedRed', pedGreen: 'doPedGreen', request: 'doWait' } },
        files: {
          main: `PROGRAM _INIT
	nStep := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* Grundstellung – der Ablauf fehlt noch *)
	doGreen := TRUE;
	doPedRed := TRUE;
END_PROGRAM
`, var: 'VAR\n\tnStep : INT;\nEND_VAR\n', typ: '' },
        solution: {
          main: `PROGRAM _INIT
	nStep := 0;
	nStepLast := 0;
	bRequest := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	(* Anforderung speichern *)
	rtRequest(CLK := diRequest);
	IF rtRequest.Q AND nStep = 0 THEN
		bRequest := TRUE;
	END_IF

	(* Mindestgrünzeit *)
	tonMinGreen(IN := (nStep = 0), PT := T#6s);

	(* Schritt-Timer bei Schrittwechsel neu starten *)
	IF nStep <> nStepLast THEN
		tonStep(IN := FALSE, PT := T#0s);
		nStepLast := nStep;
	END_IF
	IF nStep = 1 THEN
		tStepTime := T#2s;
	ELSIF nStep = 2 THEN
		tStepTime := T#1s;
	ELSIF nStep = 3 THEN
		tStepTime := T#4s;
	ELSIF nStep = 4 THEN
		tStepTime := T#2s;
	ELSIF nStep = 5 THEN
		tStepTime := T#1s;
	ELSE
		tStepTime := T#1h;
	END_IF
	tonStep(IN := TRUE, PT := tStepTime);

	(* Transitionen *)
	IF nStep = 0 THEN
		IF bRequest AND tonMinGreen.Q THEN
			nStep := 1;
		END_IF
	ELSIF nStep = 1 THEN
		IF tonStep.Q THEN nStep := 2; END_IF
	ELSIF nStep = 2 THEN
		IF tonStep.Q THEN
			nStep := 3;
			bRequest := FALSE;
		END_IF
	ELSIF nStep = 3 THEN
		IF tonStep.Q THEN nStep := 4; END_IF
	ELSIF nStep = 4 THEN
		IF tonStep.Q THEN nStep := 5; END_IF
	ELSIF nStep = 5 THEN
		IF tonStep.Q THEN nStep := 0; END_IF
	ELSE
		nStep := 0;
	END_IF

	(* Ausgänge zentral aus dem Schritt *)
	doGreen := nStep = 0;
	doYellow := nStep = 1 OR nStep = 5;
	doRed := nStep >= 2 AND nStep <= 5;
	doPedGreen := nStep = 3;
	doPedRed := NOT doPedGreen;
	doWait := bRequest;
END_PROGRAM
`,
          var: `VAR
	nStep : INT;
	nStepLast : INT;
	bRequest : BOOL;
	tStepTime : TIME;
	rtRequest : R_TRIG;
	tonMinGreen : TON;
	tonStep : TON;
END_VAR
`, typ: '' },
        tests: [
          { name: 'Grundstellung: Kfz grün, Fußgänger rot', steps: [
            { cycles: 5 },
            { expect: 'doGreen AND doPedRed AND NOT doRed AND NOT doYellow AND NOT doPedGreen', msg: 'Ohne Anforderung: Kfz grün, Fußgänger rot.' },
            { ms: 10000 },
            { expect: 'doGreen AND NOT doYellow', msg: 'Ohne Anforderung darf die Ampel nicht umschalten.' }
          ]},
          { name: 'Vollständiger Ablauf mit korrekten Zeiten', steps: [
            { ms: 7000 },
            { set: { diRequest: true } }, { ms: 100 }, { set: { diRequest: false } },
            { until: 'doYellow', maxMs: 500, msg: 'Nach abgelaufener Mindestgrünzeit muss eine Anforderung sofort zu Gelb führen.' },
            { expect: 'NOT doGreen', msg: 'Bei Gelb muss Grün aus sein.' },
            { ms: 1800 }, { expect: 'doYellow', msg: 'Gelbphase muss 2 s dauern.' },
            { ms: 400 }, { expect: 'doRed AND NOT doYellow AND doPedRed', msg: 'Nach Gelb: Alles rot.' },
            { ms: 1200 }, { expect: 'doPedGreen AND doRed', msg: 'Nach 1 s Alles-Rot: Fußgänger grün.' },
            { ms: 4200 }, { expect: 'doPedRed AND NOT doPedGreen AND doRed AND NOT doYellow', msg: 'Nach 4 s Fußgänger-Grün: Räumzeit mit Alles-Rot.' },
            { ms: 2200 }, { expect: 'doRed AND doYellow', msg: 'Nach der Räumzeit: Rot-Gelb.' },
            { ms: 1200 }, { expect: 'doGreen AND NOT doRed AND NOT doYellow', msg: 'Nach Rot-Gelb: wieder Kfz grün.' }
          ]},
          { name: 'Verriegelung über einen ganzen Zyklus', steps: [
            { set: { diRequest: true } }, { ms: 100 }, { set: { diRequest: false } },
            { never: 'doGreen AND doPedGreen', ms: 20000, msg: 'Kfz-Grün und Fußgänger-Grün gleichzeitig – gefährlich!' }
          ]},
          { name: 'Fußgänger-Grün nur bei Kfz rot', steps: [
            { set: { diRequest: true } }, { ms: 100 }, { set: { diRequest: false } },
            { never: 'doPedGreen AND (doYellow OR NOT doRed)', ms: 20000, msg: 'Fußgänger-Grün nur, wenn Kfz ausschließlich rot zeigt.' }
          ]},
          { name: 'Mindestgrünzeit und gespeicherte Anforderung', steps: [
            { set: { diRequest: true } }, { ms: 100 }, { set: { diRequest: false } },
            { cycles: 2 },
            { expect: 'doWait', msg: '„Signal kommt“ muss nach dem Tastendruck leuchten.' },
            { ms: 5400 },
            { expect: 'doGreen AND NOT doYellow AND NOT doRed', msg: 'Gelb darf nicht vor Ablauf der Mindestgrünzeit (6 s) kommen.' },
            { until: 'doYellow', maxMs: 1500, msg: 'Die gespeicherte Anforderung muss nach 6 s bedient werden.' },
            { until: 'doPedGreen', maxMs: 4000 },
            { expect: 'NOT doWait', msg: 'Mit Beginn von Fußgänger-Grün muss die Anforderung gelöscht sein.' }
          ]},
          { name: 'Mindestgrünzeit gilt auch nach einem Zyklus', steps: [
            { ms: 7000 },
            { set: { diRequest: true } }, { ms: 100 }, { set: { diRequest: false } },
            { until: 'doGreen AND NOT doRed', maxMs: 12000, msg: 'Der Ablauf muss zu Kfz-Grün zurückkehren.' },
            { set: { diRequest: true } }, { ms: 100 }, { set: { diRequest: false } },
            { ms: 5000 },
            { expect: 'doGreen AND NOT doYellow AND NOT doRed', msg: 'Nach Rückkehr zu Grün gilt erneut die Mindestgrünzeit.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Ablaufsteuerung Grundlagen'
  }
];
