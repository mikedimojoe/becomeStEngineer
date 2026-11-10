'use strict';
const { R, V, pulse, help } = require('./_sources');

// ---------------------------------------------------------------------------
// Level 1 – Grundkurs: Arbeitsweise, Dokumentation, Fehlersuche, Coding Guidelines
// ---------------------------------------------------------------------------

const exTeilezaehler = {
  id: 'ex1', type: 'st', variant: 'fehlersuche',
  title: 'Teilezähler mit drei Fehlern',
  task: [
    'Ein Kollege hat für eine Verpackungsstation einen Teilezähler geschrieben. Die Lichtschranke `diSensor` meldet jedes Teil, nach **10 Teilen** ist eine Charge voll.',
    'Der Code läuft, liefert aber falsche Werte – und die Variablennamen helfen dir nicht weiter. Gehe **systematisch** vor (Symptom beobachten → Hypothese → prüfen → beheben).',
    '',
    '**Anforderungen:**',
    '- Jedes Teil wird **genau einmal** gezählt, egal wie lange es in der Lichtschranke steht (steigende Flanke).',
    '- `nCount` zeigt den aktuellen Zählerstand.',
    '- `doBatchFull` ist TRUE, sobald **mindestens 10** Teile gezählt sind.',
    '- `diReset` setzt den Zähler auf 0 zurück.',
    '',
    'Tipp: Benenne die lokalen Variablen beim Reparieren gleich sprechend um (z. B. `nPartCount`, `rtSensor`) und ersetze die „magische“ 10 durch eine Konstante.'
  ].join('\n'),
  hints: [
    'Beobachte im Watch, um wie viel `nCount` steigt, wenn du den Sensor eine Sekunde lang betätigst. Was passiert in jedem Zyklus?',
    'Welche Variable wird beim Reset auf 0 gesetzt – und welche wird angezeigt?',
    '„Mindestens 10“ heißt `>=`, nicht `>`.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diSensor', type: 'BOOL', dir: 'in', label: 'Lichtschranke B1 (Teil erkannt)', widget: 'button' },
    { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Taster S3 Zähler zurücksetzen', widget: 'button' },
    { name: 'nCount', type: 'INT', dir: 'out', label: 'Zählerstand', widget: 'value' },
    { name: 'doBatchFull', type: 'BOOL', dir: 'out', label: 'Meldeleuchte H1 Charge voll', widget: 'led' }
  ],
  scene: { type: 'conveyor', bind: { sensor: 'diSensor', count: 'nCount' } },
  files: {
    main: 'PROGRAM _INIT\n\ta := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* zaehlen *)\n\tIF diSensor THEN\n\t\ta := a + 1;\n\tEND_IF\n\n\tIF diReset THEN\n\t\tb := 0;\n\tEND_IF\n\n\tnCount := a;\n\tdoBatchFull := a > 10;\nEND_PROGRAM\n',
    var: 'VAR\n\ta : INT;\n\tb : INT;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: 'PROGRAM _INIT\n\tnPartCount := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Jedes Teil nur einmal zaehlen: steigende Flanke der Lichtschranke *)\n\trtSensor(CLK := diSensor);\n\tIF rtSensor.Q THEN\n\t\tnPartCount := nPartCount + 1;\n\tEND_IF\n\n\tIF diReset THEN\n\t\tnPartCount := 0;\n\tEND_IF\n\n\tnCount := nPartCount;\n\tdoBatchFull := nPartCount >= BATCH_SIZE;\nEND_PROGRAM\n',
    var: 'VAR\n\trtSensor : R_TRIG;\n\tnPartCount : INT;\nEND_VAR\n\nVAR CONSTANT\n\tBATCH_SIZE : INT := 10; (* Teile pro Charge laut Pflichtenheft *)\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Ein Teil wird genau einmal gezählt', steps: [
      { set: { diSensor: true } }, { cycles: 5 }, { set: { diSensor: false } }, { cycles: 2 },
      { expect: 'nCount = 1', msg: 'Ein Teil, das 5 Zyklen im Sensor steht, muss genau 1 ergeben – Flankenauswertung fehlt.' }
    ] },
    { name: 'Teil bleibt lange in der Lichtschranke', steps: [
      { set: { diSensor: true } }, { ms: 2000 }, { expect: 'nCount = 1', msg: 'Auch nach 2 s darf nur 1 Teil gezählt sein.' }
    ] },
    { name: 'Charge voll ab genau 10 Teilen', steps: [
      ...pulse('diSensor', 9), { expect: 'NOT doBatchFull', msg: 'Bei 9 Teilen darf die Charge noch nicht voll sein.' },
      ...pulse('diSensor', 1), { expect: 'doBatchFull AND nCount = 10', msg: 'Bei 10 Teilen muss doBatchFull TRUE sein (>= statt >).' }
    ] },
    { name: 'Reset setzt den Zähler zurück', steps: [
      ...pulse('diSensor', 3), ...pulse('diReset', 1),
      { expect: 'nCount = 0 AND NOT doBatchFull', msg: 'Nach dem Reset muss nCount 0 sein – wird die richtige Variable zurückgesetzt?' },
      ...pulse('diSensor', 1), { expect: 'nCount = 1', msg: 'Nach dem Reset muss wieder ab 1 gezählt werden.' }
    ] }
  ]
};

const exZylinderRefactoring = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Refactoring nach Coding Guideline + Schaltspielzähler',
  task: [
    'Der folgende Code steuert einen Pneumatikzylinder: Ein Startimpuls fährt ihn aus, in der vorderen Endlage fährt er automatisch zurück. Er funktioniert – ist aber nach keiner Richtlinie benannt.',
    '',
    '**Teil 1 – Refactoring (Verhalten bleibt gleich):** Benenne nach der BREITNER/B&R-Konvention um:',
    '- `t1` → `rtStart` (Instanz eines R_TRIG: Präfix `rt`)',
    '- `x` → `bExtendCmd` (lokale BOOL-Variable: Präfix `b`)',
    '- Ergänze einen kurzen Kopfkommentar (Zweck des Programms) und einen Kommentar, **warum** der Rückhub automatisch erfolgt.',
    '',
    '**Teil 2 – Erweiterung Diagnose-Zähler:**',
    '- `nStrokeCount : UDINT` zählt jeden vollständigen Ausfahrhub (steigende Flanke der Endlage `diIsOut`; Flanken-Instanz `rtIsOut`).',
    '- `doMaintenance` wird TRUE, wenn `nStrokeCount >= MAINT_STROKES`. Lege `MAINT_STROKES : UDINT := 5` als Konstante an (in der Realität z. B. 5 Mio. Schaltspiele laut Datenblatt – für die Simulation 5).',
    '- `diMaintDone` (Wartung durchgeführt) setzt den Zähler auf 0.',
    '',
    'Hinweis: In AS6 legst du lokale Variablen in der Datei `Variables.var` des Programms an, Konstanten im Abschnitt `VAR CONSTANT`.'
  ].join('\n'),
  hints: [
    'Umbenennen geht in AS6 am sichersten über Suchen/Ersetzen im Programm (Strg+H) – danach mit F7 neu übersetzen, der Compiler findet vergessene Stellen.',
    'Für den Zähler brauchst du eine zweite R_TRIG-Instanz auf `diIsOut`.',
    'UDINT und Ganzzahl-Literale lassen sich direkt vergleichen: `nStrokeCount >= MAINT_STROKES`.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Taster S1 Start Hub', widget: 'button' },
    { name: 'diMaintDone', type: 'BOOL', dir: 'in', label: 'Taster S5 Wartung erledigt', widget: 'button' },
    { name: 'diIsOut', type: 'BOOL', dir: 'in', label: 'Endlage B2 vorn', widget: 'led' },
    { name: 'diIsIn', type: 'BOOL', dir: 'in', label: 'Endlage B1 hinten', widget: 'led' },
    { name: 'rStroke', type: 'REAL', dir: 'in', label: 'Kolbenposition (Simulation)', widget: 'gauge', min: 0, max: 1 },
    { name: 'doExtend', type: 'BOOL', dir: 'out', label: 'Ventil Y1 Ausfahren', widget: 'led' },
    { name: 'doMaintenance', type: 'BOOL', dir: 'out', label: 'Meldeleuchte H4 Wartung fällig', widget: 'led' }
  ],
  scene: { type: 'cylinder', bind: { extend: 'doExtend', isOut: 'diIsOut', isIn: 'diIsIn', stroke: 'rStroke' } },
  plant: {
    var: 'VAR\n\trSpeed : REAL := 0.05;\nEND_VAR\n',
    code: 'IF doExtend THEN\n\trStroke := rStroke + rSpeed;\nELSE\n\trStroke := rStroke - rSpeed;\nEND_IF\nIF rStroke > 1.0 THEN rStroke := 1.0; END_IF\nIF rStroke < 0.0 THEN rStroke := 0.0; END_IF\ndiIsOut := rStroke >= 0.999;\ndiIsIn := rStroke <= 0.001;\n'
  },
  files: {
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tt1(CLK := diStart);\n\tIF t1.Q AND diIsIn THEN\n\t\tx := TRUE;\n\tEND_IF\n\tIF diIsOut THEN\n\t\tx := FALSE;\n\tEND_IF\n\tdoExtend := x;\nEND_PROGRAM\n',
    var: 'VAR\n\tt1 : R_TRIG;\n\tx : BOOL;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: '(* Programm Cylinder: Einzelhub eines Pneumatikzylinders mit Schaltspielzaehler.\n   Start-Impuls -> Ausfahren, vordere Endlage -> automatisch Rueckhub. *)\nPROGRAM _INIT\n\tnStrokeCount := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\trtStart(CLK := diStart);\n\trtIsOut(CLK := diIsOut);\n\n\t(* Ausfahren nur aus der hinteren Endlage *)\n\tIF rtStart.Q AND diIsIn THEN\n\t\tbExtendCmd := TRUE;\n\tEND_IF\n\t(* Rueckhub automatisch, damit der Zylinder nie dauerhaft im Arbeitsraum steht *)\n\tIF diIsOut THEN\n\t\tbExtendCmd := FALSE;\n\tEND_IF\n\tdoExtend := bExtendCmd;\n\n\t(* Diagnose: Schaltspiele zaehlen, Wartung anfordern *)\n\tIF rtIsOut.Q THEN\n\t\tnStrokeCount := nStrokeCount + 1;\n\tEND_IF\n\tIF diMaintDone THEN\n\t\tnStrokeCount := 0;\n\tEND_IF\n\tdoMaintenance := nStrokeCount >= MAINT_STROKES;\nEND_PROGRAM\n',
    var: 'VAR\n\trtStart : R_TRIG;\n\trtIsOut : R_TRIG;\n\tbExtendCmd : BOOL;\n\tnStrokeCount : UDINT; (* vollstaendige Ausfahrhuebe seit letzter Wartung *)\nEND_VAR\n\nVAR CONSTANT\n\tMAINT_STROKES : UDINT := 5; (* Simulation; real laut Datenblatt *)\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Variablen sind nach Guideline benannt', steps: [
      { cycles: 2 }, { expect: 'NOT bExtendCmd AND NOT rtStart.Q AND nStrokeCount = 0', msg: 'Es gibt keine Variablen rtStart, bExtendCmd und nStrokeCount – Umbenennung/Erweiterung fehlt.' }
    ] },
    { name: 'Ein Hub: aus- und wieder einfahren, Zähler = 1', steps: [
      { cycles: 2 }, ...pulse('diStart', 1),
      { until: 'diIsOut', maxMs: 2000, msg: 'Zylinder fährt nicht aus.' },
      { until: 'diIsIn', maxMs: 2000, msg: 'Zylinder fährt nicht automatisch zurück.' },
      { expect: 'nStrokeCount = 1 AND NOT doMaintenance', msg: 'Nach einem Hub muss nStrokeCount = 1 sein.' }
    ] },
    { name: 'Wartung fällig nach 5 Hüben', steps: [
      { cycles: 2 },
      ...[1, 2, 3, 4, 5].flatMap(() => [...pulse('diStart', 1), { until: 'diIsOut', maxMs: 2000 }, { until: 'diIsIn', maxMs: 2000 }]),
      { expect: 'nStrokeCount = 5 AND doMaintenance', msg: 'Nach 5 Hüben muss doMaintenance TRUE sein.' }
    ] },
    { name: 'Wartung erledigt setzt Zähler zurück', steps: [
      { cycles: 2 },
      ...[1, 2, 3, 4, 5].flatMap(() => [...pulse('diStart', 1), { until: 'diIsOut', maxMs: 2000 }, { until: 'diIsIn', maxMs: 2000 }]),
      ...pulse('diMaintDone', 1),
      { expect: 'nStrokeCount = 0 AND NOT doMaintenance', msg: 'diMaintDone muss den Zähler und die Meldung zurücksetzen.' }
    ] }
  ]
};

module.exports = [
  {
    id: 'praxis-1-arbeitsweise', level: 1, kind: 'lektion',
    title: 'Arbeitsweise im Team, Hilfe lesen, systematisch Fehler suchen',
    summary: 'Wie du im Team arbeitest, die B&R-Hilfe gezielt nutzt und Fehler nach Methode statt nach Gefühl findest.',
    minutes: 120, req: [],
    briefing: 'Programmieren ist nur ein Teil der Arbeit eines SPS-Engineers. Mindestens genauso wichtig ist, wie du arbeitest: Aufgaben klären, Stände absprechen, Informationen in der Dokumentation finden und Fehler so suchen, dass du sie auch erklären kannst. Der Ausbildungsrahmenplan für Elektroniker/-innen für Automatisierungstechnik nennt die „systematisch-methodische Fehlersuche“ ausdrücklich als Pflichtinhalt. In diesem Modul lernst du die B&R-Hilfe (F1), den Logger und den Watch als Standardwerkzeuge kennen und übst ein einfaches Vorgehensmodell zur Fehlersuche.',
    practice: 'An der realen Maschine heißt es oft „die Station zählt falsch“. Wer dann strukturiert Symptom, Hypothese und Prüfung dokumentiert, findet den Fehler schneller und kann ihn im Team nachvollziehbar übergeben.',
    transfer: {
      tia: 'Im TIA Portal entsprechen Watch-Tabellen und Diagnosepuffer dem B&R-Watch und Logger; die Hilfe öffnest du dort ebenfalls kontextsensitiv mit F1 (Informationssystem).',
      codesys: 'In CODESYS/TwinCAT nutzt du Online-Ansicht, Watch-Listen und das Meldungs-/Logbuch-Fenster; Haltepunkte setzt du ebenfalls mit F9.'
    },
    objectives: [
      {
        id: 'o1', title: 'Arbeite nach festen Team-Regeln',
        guide: {
          intro: 'Teams funktionieren, wenn alle wissen, wer woran arbeitet und wie ein Stand übergeben wird. Diese Regeln gelten bei BREITNER für jede Aufgabe.',
          steps: [
            'Kläre vor dem Start: **Was** ist das Ziel, **woran** erkennst du „fertig“, **bis wann**? Schreibe die drei Antworten in das Ticket oder in deine Notizen.',
            'Melde im Team (Daily, Chat oder Ticket), woran du arbeitest – so programmieren nie zwei Personen dieselbe Datei gleichzeitig.',
            'Arbeite in kleinen Schritten: übersetzen (**F7**), testen, sichern. Ein Stand, der nicht übersetzt, wird nicht weitergegeben.',
            'Hänge bei Fragen nicht länger als 30 Minuten fest: Formuliere, was du versucht hast und was du erwartest, und frag dann gezielt.',
            'Übergib einen Stand immer mit drei Sätzen: Was geändert, wie getestet, was offen ist.'
          ],
          done: 'Erledigt, wenn du für deine nächste Aufgabe Ziel, Fertig-Kriterium und Termin schriftlich festgehalten hast.',
          tip: 'Eine gute Frage enthält immer: Kontext, erwartetes Verhalten, beobachtetes Verhalten, was du schon versucht hast.'
        }
      },
      {
        id: 'o2', title: 'Finde Informationen in der B&R-Hilfe',
        guide: {
          intro: 'Die Automation-Studio-Hilfe ist offline im AS6 und online unter help.br-automation.com verfügbar. Wer sie schnell bedienen kann, spart täglich Zeit.',
          steps: [
            'Setze im ST-Editor den Cursor auf einen Baustein, z. B. `TON`, und drücke **F1** – die Hilfe öffnet kontextsensitiv die passende Seite.',
            'Öffne über **Hilfe › Suchen** (Strg+Alt+F3) die Volltextsuche und suche nach „Namenskonventionen“.',
            'Lege dir wichtige Seiten im Help Explorer als **Favoriten** an (Menü Favoriten), z. B. Namenskonventionen, Logger, Tastenkombinationen.',
            'Nutze parallel die Online-Hilfe im Browser: Dort kannst du Links zu Hilfeseiten kopieren und im Ticket oder Review mitschicken.',
            'Lies bei Bausteinen immer die Abschnitte zu Parametern **und** Fehlernummern – dort steht, was im Fehlerfall passiert.'
          ],
          done: 'Erledigt, wenn du per F1 die Hilfeseite zu `R_TRIG` geöffnet und mindestens drei Seiten als Favoriten gespeichert hast.',
          tip: 'Englische Hilfeseiten sind oft aktueller. Schalte bei Unklarheiten die Sprache um und vergleiche.',
          link: { label: 'B&R Help: Arbeiten mit dem Help Explorer', url: help('diagnostics_support/helponhelp/help/helpwork.htm') }
        }
      },
      {
        id: 'o3', title: 'Nutze Watch und Logger zur Diagnose',
        guide: {
          intro: 'Watch zeigt Variablenwerte live, der Logger zeigt Ereignisse der Steuerung (z. B. Zykluszeitverletzung, Neustart). Beides brauchst du bei jeder Fehlersuche.',
          steps: [
            'Baue eine Online-Verbindung zur Steuerung oder zur Simulation (ArSim) auf und übertrage das Projekt (**Strg+F5**).',
            'Markiere den Task in der Software-Konfiguration und öffne den Watch mit **Strg+W** (Öffnen › Watch).',
            'Füge die verdächtigen Variablen hinzu und beobachte sie, während du die Anlage bedienst.',
            'Öffne den Logger mit **Strg+L** (Öffnen › Logger) und prüfe, ob zum Zeitpunkt des Fehlers Einträge vorhanden sind.',
            'Exportiere die Logger-Daten bei Bedarf als Datei und hänge sie ans Ticket.'
          ],
          done: 'Erledigt, wenn du im Watch eine Variable live beobachtet und im Logger den letzten Warmstart gefunden hast.',
          tip: 'Der Logger ist ein Ringpuffer: Ist er voll, überschreiben neue Einträge die ältesten. Exportiere ihn früh, bevor wichtige Einträge verschwinden.',
          link: { label: 'B&R Help: Logger', url: help('diagnostics_support/diagnosis/logger/diagnosis_logger.html') }
        }
      },
      {
        id: 'o4', title: 'Suche Fehler nach dem Schema Symptom – Hypothese – Prüfung',
        guide: {
          intro: 'Systematische Fehlersuche heißt: erst beobachten, dann eine prüfbare Vermutung aufstellen, dann gezielt testen – und das dokumentieren.',
          steps: [
            '**Symptom** exakt beschreiben: Was passiert, was sollte passieren, wann tritt es auf, ist es reproduzierbar?',
            '**Eingrenzen**: Stimmen Eingangssignale (Watch)? Stimmen Ausgänge? Liegt der Fehler davor (Sensor/Verdrahtung), im Programm oder danach (Aktor)?',
            '**Hypothese** aufstellen, z. B. „Zähler erhöht sich in jedem Zyklus, solange der Sensor belegt ist“.',
            '**Prüfen** mit Watch, Haltepunkt (**F9**) und Einzelschritt (**F10**) oder durch gezieltes Betätigen des Sensors.',
            '**Beheben**, erneut testen und in drei Sätzen dokumentieren: Ursache, Änderung, Test.'
          ],
          done: 'Erledigt, wenn du die Übung „Teilezähler“ gelöst und für jeden der drei Fehler Symptom, Ursache und Korrektur notiert hast.',
          tip: 'Ändere bei der Fehlersuche immer nur eine Sache auf einmal – sonst weißt du nicht, was geholfen hat.',
          link: { label: 'B&R Help: Tastenkombinationen Debugger', url: help('projectmanagement/shortcuts/desktop_shortcuts_debugger.html') }
        }
      }
    ],
    videos: [V.debugTools, V.logger, V.plcTroubleshooting],
    readings: [R.tubafProzess, R.ausbRahmenplan, R.brLogger],
    quiz: [
      { type: 'single', q: 'Ein Zähler steigt um ca. 50, wenn ein Teil eine halbe Sekunde in der Lichtschranke steht (Zykluszeit 10 ms). Was ist die wahrscheinlichste Ursache?',
        options: ['Die Lichtschranke prellt', 'Der Zähler wird pegel- statt flankengesteuert erhöht', 'Die Zykluszeit ist zu kurz eingestellt', 'Der Zähler ist vom Typ INT statt DINT'],
        correct: 1, explain: '500 ms / 10 ms = 50 Zyklen. Wird in jedem Zyklus mit belegtem Sensor erhöht, steigt der Zähler um 50. Eine Flankenauswertung (R_TRIG) zählt genau einmal.' },
      { type: 'multi', q: 'Welche Werkzeuge von Automation Studio helfen dir bei der Fehlersuche im laufenden Programm?',
        options: ['Watch (Strg+W)', 'Logger (Strg+L)', 'Debugger mit Haltepunkten (F9)', 'Hardware-Katalog'],
        correct: [0, 1, 2], explain: 'Watch, Logger und Debugger sind Diagnose-Werkzeuge. Der Hardware-Katalog dient der Konfiguration.' },
      { type: 'single', q: 'Mit welcher Taste öffnest du in Automation Studio die Hilfe zum aktuell markierten Element?',
        options: ['F1', 'F5', 'F7', 'Strg+F5'], correct: 0, explain: 'F1 öffnet die Hilfe kontextsensitiv. F7 übersetzt die Konfiguration, Strg+F5 überträgt ins Zielsystem, F5 setzt im Debugger fort.' }
    ],
    exam: [
      { type: 'single', q: 'Was gehört NICHT zum ersten Schritt einer systematischen Fehlersuche?',
        options: ['Das Symptom genau beschreiben', 'Prüfen, ob der Fehler reproduzierbar ist', 'Sofort den Code an der vermuteten Stelle ändern', 'Klären, seit wann der Fehler auftritt'],
        correct: 2, explain: 'Erst beobachten und eingrenzen, dann eine Hypothese prüfen. Sofortiges Ändern ohne Hypothese verschleiert oft die Ursache.' },
      { type: 'single', q: 'Der Logger einer Steuerung ist voll. Was passiert mit neuen Einträgen?',
        options: ['Sie werden verworfen', 'Sie überschreiben die ältesten Einträge (Ringpuffer)', 'Die Steuerung geht in den Service-Modus', 'Der Logger wird automatisch gelöscht'],
        correct: 1, explain: 'Laut B&R-Hilfe arbeiten die Logbücher nach dem Ringpuffer-Prinzip: Die ältesten Einträge werden überschrieben.' },
      { type: 'multi', q: 'Welche Angaben gehören in eine gute Übergabe eines Arbeitsstands an Kollegen?',
        options: ['Was geändert wurde', 'Wie getestet wurde', 'Was noch offen ist', 'Wie lange du dafür gebraucht hast'],
        correct: [0, 1, 2], explain: 'Änderung, Test und offene Punkte machen einen Stand für andere nutzbar. Die Dauer ist für die Übergabe nicht relevant.' },
      { type: 'single', q: 'Im Watch siehst du, dass `diSensor` nie TRUE wird, obwohl die LED am Sensor leuchtet. Wo suchst du zuerst?',
        options: ['Im Zählprogramm', 'Bei Verdrahtung/I/O-Zuordnung zwischen Sensor und Eingangskarte', 'In der Visualisierung', 'In der Zykluszeit des Tasks'],
        correct: 1, explain: 'Das Signal kommt im Programm nicht an. Der Fehler liegt also vor dem Programm: Verdrahtung, Klemme, I/O-Mapping.' }
    ],
    exercises: [exTeilezaehler],
    proof: false
  },
  {
    id: 'praxis-1-coding-guidelines', level: 1, kind: 'lektion',
    title: 'Namenskonventionen, Coding Guidelines und Kommentare',
    summary: 'Sprechende Namen, Präfixe nach B&R/PLCopen und Kommentare, die das Warum erklären.',
    minutes: 120, req: ['praxis-1-arbeitsweise'],
    briefing: 'Code wird viel häufiger gelesen als geschrieben – von Kollegen, vom Service beim Kunden und von dir selbst in einem Jahr. Coding Guidelines legen fest, wie Variablen, Bausteine und Datentypen heißen, wie Code formatiert und kommentiert wird. B&R empfiehlt in der AS-Hilfe sprechende Namen und Präfixe wie di/do/ai/ao für I/Os; PLCopen hat herstellerneutrale Coding Guidelines veröffentlicht. Du lernst, wann Präfixe helfen (ungarische Notation light) und wann ein sprechender Name die bessere Wahl ist, und wendest das in einem Refactoring an.',
    practice: 'Bei der Inbetriebnahme sucht der Service im Watch nach „doMotor…“ – sind alle Ausgänge einheitlich benannt, stehen sie alphabetisch zusammen. Ein Name wie „x“ kostet beim Kunden Minuten pro Suche.',
    transfer: {
      tia: 'In TIA Portal sind PLC-Variablen und DB-Namen frei wählbar; viele Firmen nutzen ebenfalls Präfixe. Siemens empfiehlt im Programmierstyleguide sprechende Namen in CamelCase.',
      codesys: 'Beckhoff dokumentiert eigene Programmierkonventionen (Präfixe wie b, n, f, st, fb). Die Idee ist identisch – nur einzelne Präfixe unterscheiden sich, deshalb gilt immer die Firmenrichtlinie.'
    },
    objectives: [
      {
        id: 'o1', title: 'Wende die Präfix-Regeln für Variablen an',
        guide: {
          intro: 'Präfixe zeigen auf einen Blick Herkunft oder Datentyp einer Variablen. BREITNER nutzt die B&R-Empfehlung für I/Os und kurze Typpräfixe für lokale Variablen.',
          steps: [
            'I/O-Variablen: `di` (Digitaleingang), `do` (Digitalausgang), `ai` (Analogeingang), `ao` (Analogausgang), z. B. `diStartButton`, `doMotorConveyor`.',
            'Lokale Variablen: `b` BOOL, `n` Ganzzahl, `r` REAL, `s` STRING, `t` TIME, `e` Enum, `st` Struktur, `a` Array; FB-Instanzen nach Typ: `ton`, `rt`, `fb`.',
            'Konstanten in GROSSBUCHSTABEN mit Unterstrich: `BATCH_SIZE`, `MAX_TEMP`.',
            'Datentypen mit Suffix `_typ` bzw. Enum `_enum`, z. B. `Station_typ` – wie in den B&R-Standardbibliotheken.',
            'Öffne in AS6 die Hilfe **Namenskonventionen** (Hilfe › Suchen, Strg+Alt+F3) und vergleiche: B&R begrenzt Variablennamen auf 32 Zeichen.'
          ],
          code: { lang: 'var', text: 'VAR\n\tbExtendCmd : BOOL;      (* Ausfahrbefehl *)\n\tnStrokeCount : UDINT;   (* Schaltspiele seit Wartung *)\n\trtStart : R_TRIG;\nEND_VAR\nVAR CONSTANT\n\tMAINT_STROKES : UDINT := 5;\nEND_VAR' },
          done: 'Erledigt, wenn du in einem eigenen Programm alle Variablen nach diesem Schema benannt hast.',
          tip: 'Präfixe sind kein Ersatz für Bedeutung: `bFlag2` ist trotz Präfix ein schlechter Name, `bDoorClosed` ein guter.',
          link: { label: 'B&R Help: Namenskonventionen – Variablen', url: help('programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions_variables.html') }
        }
      },
      {
        id: 'o2', title: 'Unterscheide ungarische Notation und sprechende Namen',
        guide: {
          intro: 'Strenge ungarische Notation kodiert den Typ im Namen. Moderne Guidelines (auch PLCopen) betonen dagegen, dass der Name die Bedeutung transportieren muss.',
          steps: [
            'Lies in der PLCopen-Übersicht, welche Guidelines es gibt (Coding Guidelines, OOP, Software Quality Metrics).',
            'Vergleiche zwei Varianten: `iCnt` vs. `nPartCount`. Welche verstehst du ohne Kommentar?',
            'Merke dir die BREITNER-Regel: **kurzes Typpräfix + sprechender Name in CamelCase**, Englisch.',
            'Vermeide Abkürzungen, die nur du kennst. Erlaubt sind gängige wie Cfg, Mgr, Cmd, Ack.',
            'Prüfe, ob ein Name auch in der Watch-Sortierung sinnvoll gruppiert (alle `doConveyor…` stehen zusammen).'
          ],
          done: 'Erledigt, wenn du für fünf Variablen aus einem alten Projekt bessere Namen vorgeschlagen hast.',
          tip: 'Ein guter Name ersetzt einen Kommentar. Wenn du einen Kommentar brauchst, um eine Variable zu erklären, prüfe zuerst den Namen.',
          link: { label: 'PLCopen Software Construction Guidelines', url: 'https://www.plcopen.org/guidelines/software-construction-guidelines/' }
        }
      },
      {
        id: 'o3', title: 'Kommentiere das Warum, nicht das Was',
        guide: {
          intro: 'Die B&R-Richtlinie unterscheidet Zusammenfassungs-, Abschnitts- und Markerkommentare. Kommentiert wird, was der Code nicht selbst sagen kann.',
          steps: [
            'Schreibe am Programmanfang einen **Kopfkommentar**: Zweck, Ein-/Ausgänge, Besonderheiten.',
            'Kommentiere Abschnitte mit dem **Warum**: „Rückhub automatisch, damit der Zylinder nie im Arbeitsraum steht“ statt „Ventil aus“.',
            'Kommentiere physikalische Einheiten und Grenzwerte bei der Deklaration (`(* mm/s *)`).',
            'Nutze **Strg+K**, um markierte Zeilen im Editor auszukommentieren – aber lösche auskommentierten Altcode vor dem Commit; dafür gibt es Git.',
            'Aktualisiere Kommentare bei jeder Code-Änderung – ein falscher Kommentar ist schlimmer als keiner.'
          ],
          done: 'Erledigt, wenn dein Übungsprogramm einen Kopfkommentar und mindestens einen Warum-Kommentar hat.',
          tip: 'Markerkommentare wie `(* TODO *)` sind während der Entwicklung nützlich, gehören aber laut B&R-Richtlinie nicht in die Endversion.',
          link: { label: 'B&R Help: Kommentare', url: help('programming/guidelines/documentation/codingguideline_docu_comments.html') }
        }
      },
      {
        id: 'o4', title: 'Führe ein verhaltenserhaltendes Refactoring durch',
        guide: {
          intro: 'Refactoring heißt: Struktur und Namen verbessern, ohne das Verhalten zu ändern. Danach wird getestet, ob alles noch funktioniert.',
          steps: [
            'Lege vor dem Refactoring einen Commit an oder sichere das Projekt – so kannst du jederzeit vergleichen.',
            'Benenne mit **Bearbeiten › Suchen und Ersetzen › Ersetzen** (Strg+H) um; für mehrere Dateien **Ersetzen in Dateien** (Umschalt+Strg+H).',
            'Übersetze mit **F7**. Fehlermeldungen im Ausgabefenster springst du mit **F4** der Reihe nach an.',
            'Prüfe mit dem **Querverweis** (Strg+Alt+R), dass alte Namen nirgends mehr verwendet werden.',
            'Teste das Verhalten wie vorher und erweitere erst danach die Funktion (hier: Schaltspielzähler).'
          ],
          done: 'Erledigt, wenn die Übung „Refactoring + Schaltspielzähler“ alle Tests besteht.',
          tip: 'Trenne Refactoring und neue Funktion in zwei Commits – das macht Reviews viel einfacher.',
          link: { label: 'B&R Help: Querverweis', url: help('projectmanagement/output/desktop_output_crossreference.html') }
        }
      }
    ],
    videos: [V.namingSps4you, V.plcopenStructuring, V.cleanCode],
    readings: [R.tubafDoku, R.brNamingVars, R.plcopenScg],
    quiz: [
      { type: 'single', q: 'Welcher Name entspricht der BREITNER/B&R-Konvention für einen Digitalausgang, der das Schütz des Förderbandmotors schaltet?',
        options: ['Q_0_1', 'motor', 'doConveyorMotor', 'bMotorOut'], correct: 2,
        explain: 'Digitalausgänge bekommen das Präfix `do`, danach folgt ein sprechender Name in CamelCase.' },
      { type: 'single', q: 'Was ist an diesem Code im Sinne der Coding Guidelines am problematischsten?',
        code: { lang: 'st', text: 'IF x1 AND NOT x2 THEN\n\tc := c + 1;   (* c um 1 erhoehen *)\nEND_IF' },
        options: ['Fehlende Einrückung', 'Nichtssagende Namen und ein Kommentar, der nur das Offensichtliche wiederholt', 'Verwendung von NOT', 'IF statt CASE'], correct: 1,
        explain: 'x1, x2 und c verraten nichts über ihre Bedeutung, und der Kommentar beschreibt nur das Was. Besser: sprechende Namen, Kommentar zum Warum.' },
      { type: 'multi', q: 'Welche Aussagen zu Kommentaren stimmen laut B&R-Programmierrichtlinie?',
        options: ['Guter Code ist seine beste Dokumentation', 'Kommentare sollen das Warum erklären', 'Jede Zeile sollte kommentiert werden', 'Kommentare müssen bei Code-Änderungen angepasst werden'],
        correct: [0, 1, 3], explain: 'Offensichtliches wird nicht kommentiert. Kommentare liefern Information, die der Code nicht hat, und werden mit dem Code gepflegt.' }
    ],
    exam: [
      { type: 'single', q: 'Wie viele Zeichen darf ein Variablenname laut B&R-Namenskonvention maximal haben?',
        options: ['8', '16', '32', '255'], correct: 2, explain: 'Die B&R-Hilfe nennt für Variablen, Konstanten und Datentypen 32 Zeichen.' },
      { type: 'single', q: 'Warum sollten Variablen mit dem kleinstmöglichen Gültigkeitsbereich angelegt werden?',
        options: ['Weil globale Variablen mehr Speicher brauchen', 'Weil globale Variablen komplexe Wechselwirkungen erzeugen und Wiederverwendung erschweren', 'Weil lokale Variablen schneller übersetzt werden', 'Weil der Watch nur lokale Variablen anzeigt'],
        correct: 1, explain: 'Die B&R-Richtlinie begründet es mit schwer verständlichen Wechselwirkungen und schlechter Wartbarkeit/Wiederverwendung.' },
      { type: 'multi', q: 'Welche der folgenden Namen sind nach BREITNER-Konvention korrekt gebildet?',
        options: ['tonJamTimeout : TON', 'MAX_PRESSURE : REAL (Konstante)', 'DI_START : BOOL (Digitaleingang)', 'rTankLevel : REAL'],
        correct: [0, 1, 3], explain: 'Digitaleingänge beginnen mit kleinem `di` und CamelCase (`diStart`). GROSSBUCHSTABEN sind für Konstanten reserviert.' },
      { type: 'single', q: 'Was ist ein Refactoring?',
        options: ['Eine neue Funktion einbauen', 'Die Struktur des Codes verbessern, ohne das beobachtbare Verhalten zu ändern', 'Einen Fehler beheben', 'Das Projekt auf eine neue AS-Version migrieren'],
        correct: 1, explain: 'Refactoring ist verhaltenserhaltend. Neue Funktionen und Fehlerkorrekturen sind getrennte Änderungen.' }
    ],
    exercises: [exZylinderRefactoring],
    proof: false
  }
];
