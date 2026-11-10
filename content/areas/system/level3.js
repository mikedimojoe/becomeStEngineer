// Bereich "system" – Level 3 (Senior → Prüfung Engineer)
'use strict';
const { v } = require('./videos');
const { r } = require('./readings');

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'system-3-debugging',
    level: 3,
    kind: 'lektion',
    title: 'Debugging: Haltepunkte, Einzelschritt und Line Coverage',
    summary: 'Du findest Logikfehler systematisch mit Debugger, Haltepunkten, Debugger-Watch und Zeilenüberwachung, statt zu raten.',
    minutes: 180,
    req: ['system-2-diagnose'],
    briefing: 'Ein Watch zeigt dir Werte, aber nicht, wie sie zustande kommen. Der Debugger hält das Programm an einer Zeile an (Haltepunkt, F9), du gehst im Einzelschritt (F11) oder Prozedurschritt (F10) weiter und setzt mit F5 fort. Wichtig für die Praxis: Läuft ein Haltepunkt auf, wird die **gesamte Taskklasse** angehalten. I/O-Ausgänge behalten ihren Zustand, laufende Antriebe werden **nicht** angehalten. Die Zeilenüberwachung (Line Coverage) im Monitormodus zeigt dir ohne Anhalten, welche Zeilen im aktuellen Zyklus durchlaufen werden – ideal, um tote Zweige oder falsche Bedingungen zu finden. Gutes Debugging ist methodisch: Hypothese bilden, gezielt beobachten, eine Ursache nach der anderen beseitigen.',
    practice: 'An einer laufenden Maschine sind Haltepunkte tabu, weil sie eine ganze Taskklasse einfrieren. Dort arbeitest du mit Line Coverage, Watch und Trace. Den Debugger nutzt du an der ARsim oder an einer gesicherten Maschine.',
    transfer: {
      tia: 'TIA bietet "Beobachten" (Brille) und bei S7-1500 Haltepunkte in SCL; die Zeilenhervorhebung im Beobachtungsmodus entspricht grob der Line Coverage.',
      codesys: 'CODESYS: Haltepunkte (F9), Einzelschritt (F8), Prozedurschritt (F10), Flusskontrolle (entspricht Line Coverage). TwinCAT übernimmt diese Funktionen aus CODESYS.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Setze Haltepunkte und gehe im Einzelschritt',
        guide: {
          intro: 'Der Debugger wird über das Menü Debug gesteuert. Arbeite an der ARsim, damit keine Maschine stehen bleibt.',
          steps: [
            'Verbinde dich mit der ARsim und öffne das Programm im ST-Editor.',
            'Starte den Debugger mit **Umschalt+F5** (**Debug › Debugging starten/stoppen**).',
            'Setze mit **F9** einen Haltepunkt in einer Zeile innerhalb einer IF-Verzweigung.',
            'Sobald der Haltepunkt aufläuft, gehe mit **F11** (Einzelschritt) und **F10** (Prozedurschritt) weiter und beobachte die Werte im Debugger Watch (**Strg+Alt+W**).',
            'Setze mit **F5** fort und entferne alle Haltepunkte mit **Strg+F9**.'
          ],
          done: 'Erledigt, wenn du einen Haltepunkt ausgelöst, zwei Schritte ausgeführt und alle Haltepunkte wieder entfernt hast.',
          tip: 'Haltepunkte in einem Funktionsbaustein halten bei jeder Instanz an. Grenze sie mit Bedingungen ein, wenn der Editor das anbietet.',
          link: { label: 'B&R Help: Tastenkombinationen – Debugger', url: 'https://help.br-automation.com/#/de/6/projectmanagement/shortcuts/desktop_shortcuts_debugger.html' }
        }
      },
      {
        id: 'o2',
        title: 'Bewerte die Folgen eines Haltepunkts an der Maschine',
        guide: {
          intro: 'Die Hilfe beschreibt genau, was beim Auflaufen eines Haltepunkts passiert. Das musst du vor jeder Fehlersuche an Hardware wissen.',
          steps: [
            'Lies in der Hilfe den Abschnitt "Was passiert beim Auflaufen auf einen Haltepunkt?".',
            'Notiere: Was passiert mit der eigenen Taskklasse, mit anderen Taskklassen, mit I/O-Ausgängen, mit Antrieben?',
            'Formuliere zwei Regeln, wann du an einer realen Anlage keinen Haltepunkt setzen darfst.'
          ],
          done: 'Erledigt, wenn deine Notiz alle vier Punkte und zwei begründete Regeln enthält.',
          tip: 'Antriebe laufen beim Haltepunkt weiter, aber deine Überwachungslogik nicht. Genau das macht Haltepunkte an Achsen gefährlich.',
          link: { label: 'B&R Help: Debugger – Haltepunkte', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/debugging/diagnosis_debugging_breakpoints.html' }
        }
      },
      {
        id: 'o3',
        title: 'Finde tote Zweige mit Line Coverage',
        guide: {
          intro: 'Die Zeilenüberwachung zeigt im Monitormodus, welche Zeilen durchlaufen werden – ohne die Taskklasse anzuhalten.',
          steps: [
            'Öffne das Programm und aktiviere den Monitormodus mit **Strg+M** (**Ansicht › Monitor**).',
            'Schalte im Monitormodus die Zeilenüberwachung (Line Coverage) ein.',
            'Ändere im Watch eine Eingangsbedingung und beobachte, welche Zweige markiert werden.',
            'Suche eine Zeile, die nie durchlaufen wird, und begründe, ob sie überflüssig oder ein Fehler ist.'
          ],
          done: 'Erledigt, wenn du einen nie durchlaufenen Zweig gefunden und bewertet hast.',
          tip: 'Line Coverage zeigt den Durchlauf im Zyklus, nicht den Wert. Kombiniere sie mit dem Watch.',
          link: { label: 'B&R Help: Zeilenüberwachung', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/monitormode/linecoverage/diagnosis_monitormode_linecoverage.html' }
        }
      },
      {
        id: 'o4',
        title: 'Arbeite die Fehlersuche methodisch ab',
        guide: {
          intro: 'In der Übung stecken mehrere Fehler. Finde sie einzeln, nicht alle auf einmal.',
          steps: [
            'Lies die Anforderungen und führe die Tests einmal aus. Notiere, welche Tests scheitern.',
            'Bilde zu jedem gescheiterten Test eine Hypothese (z. B. "Flanke statt Pegel").',
            'Prüfe die Hypothese im Code, korrigiere genau eine Stelle und teste erneut.',
            'Wiederhole, bis alle Tests grün sind, und schreibe zu jedem Fehler eine Zeile in dein Protokoll.'
          ],
          done: 'Erledigt, wenn alle Tests grün sind und dein Protokoll jeden gefundenen Fehler mit Ursache nennt.',
          tip: 'Ein Fehler pro Änderung. Wer fünf Dinge gleichzeitig ändert, weiß hinterher nicht, was geholfen hat.'
        }
      }
    ],
    videos: [
      v('bAM8wtVAyLE', 'de', 'Zeigt Watch, Trace und Debugger in Automation Studio auf Deutsch.'),
      v('zh_feZqqLmg', 'de', 'Systematische Fehlersuche-Strategie aus der Mechatroniker-Prüfungsvorbereitung.')
    ],
    readings: [
      r('elektroAnl4', 'Der Ausbildungsrahmenplan fordert "systematisch-methodische Fehlersuche an komplexen Automatisierungssystemen".'),
      r('hBreakpoints', 'Offizielle Beschreibung der Haltepunkte und ihrer Wirkung auf Taskklassen, I/O und Antriebe.'),
      r('hShortcutsDebug', 'Alle Debugger-Tastenkürzel auf einer Seite.')
    ],
    quiz: [
      { type: 'single', q: 'Was passiert beim Auflaufen eines Haltepunkts in einer Taskklasse?',
        options: ['Nur das eine Programm hält an.', 'Die gesamte Taskklasse wird angehalten.', 'Die Steuerung geht in SERVICE.', 'Alle Ausgänge werden auf 0 gesetzt.'],
        correct: 1, explain: 'Die Taskklasse wird unmittelbar angehalten; Ausgänge behalten ihren Zustand.' },
      { type: 'single', q: 'Welche Taste setzt bzw. löscht in AS6 einen Haltepunkt?',
        options: ['F5', 'F7', 'F9', 'F11'],
        correct: 2, explain: 'F9 = Haltepunkt setzen/löschen, F5 = Weiter, F11 = Einzelschritt, F7 = Konfiguration kompilieren.' },
      { type: 'single', q: 'Ein Zähler zählt um mehrere hundert pro Tastendruck statt um 1. Welcher Fehler ist am wahrscheinlichsten?',
        options: ['Falscher Datentyp', 'Es wird der Pegel statt der Flanke ausgewertet', 'Die Taskklasse ist zu langsam', 'Der Logger ist voll'],
        correct: 1, explain: 'Bei 10 ms Zykluszeit zählt eine Pegelauswertung in jedem Zyklus, solange der Taster gedrückt ist.' }
    ],
    exam: [
      { type: 'multi', q: 'Was gilt laut B&R-Hilfe beim Auflaufen eines Haltepunkts?',
        options: ['Ausgänge der I/O-Module behalten ihren Zustand', 'Laufende Antriebe werden nicht angehalten', 'Asynchron ausgeführte Funktionsbausteine werden nicht angehalten', 'Alle Taskklassen stoppen garantiert im selben Moment'],
        correct: [0, 1, 2], explain: 'Andere Taskklassen werden "so schnell wie möglich" gestoppt – ohne Garantie, dass es sofort geschieht.' },
      { type: 'single', q: 'Welches Werkzeug nutzt du an einer laufenden Anlage, um zu sehen, welche Programmzweige durchlaufen werden, ohne anzuhalten?',
        options: ['Haltepunkt', 'Line Coverage im Monitormodus', 'Kaltstart', 'Profiler'],
        correct: 1, explain: 'Line Coverage zeigt den Durchlauf, ohne die Taskklasse anzuhalten.' },
      { type: 'single', q: 'Eine Schleife `FOR i := 0 TO 4 DO a[i] := 0; END_FOR` arbeitet auf `a : ARRAY[0..3] OF INT`. Was ist das Problem?',
        options: ['Keins', 'Zugriff außerhalb der Feldgrenzen bei i = 4', 'FOR-Schleifen sind in ST nicht erlaubt', 'Die Schleife läuft endlos'],
        correct: 1, explain: 'Das Feld hat 4 Elemente (0..3). Index 4 liegt außerhalb und führt je nach System zu Laufzeitfehler oder Speicherüberschreibung.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'fehlersuche',
        title: 'Störungszähler mit fünf Fehlern',
        task: 'Das Programm soll die Störungen von vier Motoren auswerten. Es enthält **fünf Fehler**. Finde und behebe sie.\n\nAnforderungen:\n- `anCount[0..3]` zählt für jeden Motor die **steigenden Flanken** seines Störsignals `diFault1 … diFault4`.\n- `nTotal` = Summe aller vier Zähler (in jedem Zyklus neu berechnet).\n- `nWorst` = Nummer **1 … 4** des Motors mit den meisten Störungen; `0`, wenn alle Zähler 0 sind. Bei Gleichstand gewinnt der kleinere Index.\n- `doAnyFault` = TRUE, solange **mindestens ein** Störsignal ansteht.',
        hints: ['Prüfe die Schleifengrenzen gegen die Feldgrenzen.', 'Flankenerkennung in einer Schleife: merke dir den alten Zustand in einem zweiten Feld `abPrev`.', 'Welche Variable müsste vor dem Summieren auf 0 gesetzt werden?'],
        cycleMs: 10,
        io: [
          { name: 'diFault1', type: 'BOOL', dir: 'in', label: 'Störung Motor 1', widget: 'button' },
          { name: 'diFault2', type: 'BOOL', dir: 'in', label: 'Störung Motor 2', widget: 'button' },
          { name: 'diFault3', type: 'BOOL', dir: 'in', label: 'Störung Motor 3', widget: 'button' },
          { name: 'diFault4', type: 'BOOL', dir: 'in', label: 'Störung Motor 4', widget: 'button' },
          { name: 'nTotal', type: 'INT', dir: 'out', label: 'Störungen gesamt', widget: 'value' },
          { name: 'nWorst', type: 'INT', dir: 'out', label: 'Motor mit den meisten Störungen', widget: 'value' },
          { name: 'doAnyFault', type: 'BOOL', dir: 'out', label: 'Sammelstörung', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tabIn[0] := diFault1;\n\tabIn[1] := diFault2;\n\tabIn[2] := diFault3;\n\tabIn[3] := diFault4;\n\n\tFOR i := 0 TO 3 DO\n\t\tIF abIn[i] THEN\n\t\t\tanCount[i] := anCount[i] + 1;\n\t\tEND_IF\n\t\tnTotal := nTotal + anCount[i];\n\tEND_FOR\n\n\tnWorst := 0;\n\tnMax := 0;\n\tFOR i := 0 TO 3 DO\n\t\tIF anCount[i] >= nMax THEN\n\t\t\tnMax := anCount[i];\n\t\t\tnWorst := i;\n\t\tEND_IF\n\tEND_FOR\n\n\tdoAnyFault := abIn[0] AND abIn[1] AND abIn[2] AND abIn[3];\nEND_PROGRAM\n',
          var: 'VAR\n\tabIn : ARRAY[0..3] OF BOOL;\n\tabPrev : ARRAY[0..3] OF BOOL;\n\tanCount : ARRAY[0..3] OF INT;\n\tnMax : INT;\n\ti : INT;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tabIn[0] := diFault1;\n\tabIn[1] := diFault2;\n\tabIn[2] := diFault3;\n\tabIn[3] := diFault4;\n\n\tnTotal := 0;                          (* Fehler 1: Summe zurücksetzen *)\n\tFOR i := 0 TO 3 DO\n\t\tIF abIn[i] AND NOT abPrev[i] THEN    (* Fehler 2: Flanke statt Pegel *)\n\t\t\tanCount[i] := anCount[i] + 1;\n\t\tEND_IF\n\t\tabPrev[i] := abIn[i];\n\t\tnTotal := nTotal + anCount[i];\n\tEND_FOR\n\n\tnWorst := 0;\n\tnMax := 0;\n\tFOR i := 0 TO 3 DO\n\t\tIF anCount[i] > nMax THEN            (* Fehler 3: > statt >= (Gleichstand, 0-Fall) *)\n\t\t\tnMax := anCount[i];\n\t\t\tnWorst := i + 1;                 (* Fehler 4: Motornummer 1..4 *)\n\t\tEND_IF\n\tEND_FOR\n\n\tdoAnyFault := abIn[0] OR abIn[1] OR abIn[2] OR abIn[3];   (* Fehler 5: ODER *)\nEND_PROGRAM\n',
          var: 'VAR\n\tabIn : ARRAY[0..3] OF BOOL;\n\tabPrev : ARRAY[0..3] OF BOOL;\n\tanCount : ARRAY[0..3] OF INT;\n\tnMax : INT;\n\ti : INT;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Ohne Störung bleibt alles 0', steps: [
            { cycles: 20 },
            { expect: 'nTotal = 0 AND nWorst = 0 AND NOT doAnyFault', msg: 'Ohne Störung: Summe 0, kein schlechtester Motor, keine Sammelstörung.' }
          ]},
          { name: 'Lange Störung zählt nur einmal', steps: [
            { set: { diFault2: true } }, { cycles: 10 }, { set: { diFault2: false } }, { cycles: 2 },
            { expect: 'anCount[1] = 1', msg: 'Eine anstehende Störung ist eine Flanke, egal wie lange sie ansteht.' },
            { expect: 'nTotal = 1', msg: 'Die Summe muss jeden Zyklus neu gebildet werden, nicht aufaddiert.' }
          ]},
          { name: 'Schlechtester Motor wird mit Nummer 1..4 gemeldet', steps: [
            { set: { diFault3: true } }, { cycles: 2 }, { set: { diFault3: false } }, { cycles: 2 },
            { set: { diFault3: true } }, { cycles: 2 }, { set: { diFault3: false } }, { cycles: 2 },
            { set: { diFault3: true } }, { cycles: 2 }, { set: { diFault3: false } }, { cycles: 2 },
            { set: { diFault1: true } }, { cycles: 2 }, { set: { diFault1: false } }, { cycles: 2 },
            { expect: 'nTotal = 4', msg: 'Drei Störungen an Motor 3 und eine an Motor 1 ergeben 4.' },
            { expect: 'nWorst = 3', msg: 'Motor 3 hat die meisten Störungen.' }
          ]},
          { name: 'Gleichstand: kleinerer Index gewinnt', steps: [
            { set: { diFault2: true, diFault4: true } }, { cycles: 2 }, { set: { diFault2: false, diFault4: false } }, { cycles: 2 },
            { expect: 'nWorst = 2', msg: 'Bei Gleichstand zwischen Motor 2 und 4 gewinnt Motor 2.' }
          ]},
          { name: 'Sammelstörung bei einer einzelnen Störung', steps: [
            { set: { diFault4: true } }, { cycles: 2 },
            { expect: 'doAnyFault', msg: 'Schon eine anstehende Störung muss die Sammelstörung setzen.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'system-3-zykluszeit',
    level: 3,
    kind: 'lektion',
    title: 'Trace, Profiler und Zykluszeitanalyse',
    summary: 'Du zeichnest Signale mit dem Trace auf, misst Tasklaufzeiten mit dem Profiler, konfigurierst Taskklassen und analysierst eine Zykluszeitverletzung inklusive Backtrace.',
    minutes: 210,
    req: ['system-3-debugging'],
    briefing: 'Der Scheduler von Automation Runtime überwacht, ob jede Taskklasse ihre Zykluszeit einhält. Ist die Abarbeitung nach Zykluszeit plus eingestellter Toleranz nicht fertig, löst das System eine Exception aus, schreibt einen Logbucheintrag und startet in SERVICE. Ursachen sind zu lange Laufzeiten oder eine überlastete höher priorisierte Taskklasse. Zur Analyse nutzt du drei Werkzeuge: Der **Trace** zeichnet Variablen in einem festen Zeitraster auf (manuell oder per Trigger). Der **Profiler** misst Tasklaufzeiten, Systemlast und Stack und zeigt Minimal-, Maximal- und Mittelwerte sowie den zeitlichen Verlauf. Der **Logger** liefert zum Fehlereintrag den **Backtrace** – die Aufrufkette, die zur Exception geführt hat. Zusätzlich lernst du, eigene Laufzeitstatistiken im Programm zu führen und blockierende Schleifen in nicht blockierende Schrittketten umzubauen.',
    practice: 'Eine Maschine geht sporadisch einmal pro Woche in SERVICE. Der Logger sagt "Zykluszeitverletzung", der Profiler zeigt, welcher Task in diesem Moment zu lang lief, und der Trace zeigt, welche Eingangssituation das auslöste.',
    transfer: {
      tia: 'S7: Überschreitung der Zyklusüberwachungszeit ruft OB80 auf; Zykluszeiten liest du unter Online & Diagnose. Der Trace entspricht der Trace-Funktion im TIA Portal.',
      codesys: 'CODESYS: Taskkonfiguration mit Watchdog (Zeit und Empfindlichkeit), Taskmonitor für Laufzeiten, Trace-Objekt; TwinCAT zusätzlich Echtzeit-Auslastung und Scope View.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Zeichne Signale mit dem Trace auf',
        guide: {
          intro: 'Der Trace wird aus der Softwarekonfiguration geöffnet. Die Werte werden auf der Steuerung gepuffert und danach in den PC übertragen.',
          steps: [
            'Markiere in der Physical View die CPU und öffne **Öffnen › Software**.',
            'Markiere das Programm und öffne **Öffnen › Trace**.',
            'Füge zwei Variablen hinzu (z. B. Startsignal und Ausgang) und konfiguriere einen Trigger auf die steigende Flanke des Startsignals.',
            'Übertrage die Trace-Konfiguration, löse den Trigger aus und lade die Daten nach dem Stopp in den PC.',
            'Miss im Diagramm die Verzögerung zwischen Startsignal und Ausgang.'
          ],
          done: 'Erledigt, wenn du eine getriggerte Aufzeichnung mit zwei Kurven gespeichert und eine Zeitdifferenz abgelesen hast.',
          tip: 'Speichere Traces mit sprechendem Namen. Beim nächsten Fehlerbild lädst du den alten Trace zum Vergleich in dieselbe Liste.',
          link: { label: 'B&R Help: Trace', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/trace/diagnosis_trace.html' }
        }
      },
      {
        id: 'o2',
        title: 'Miss Tasklaufzeiten mit dem Profiler',
        guide: {
          intro: 'Der Profiler misst autark auf dem Zielsystem und zeigt Min-, Max- und Mittelwerte je Task sowie einen zeitlichen Verlauf.',
          steps: [
            'Öffne den Profiler über die Softwarekonfiguration bzw. das Menü **Öffnen** bei bestehender Online-Verbindung.',
            'Konfiguriere die Aufzeichnung der Tasklaufzeiten und übertrage die Konfiguration.',
            'Lass die Anlage einige Minuten laufen und lade die Messung hoch.',
            'Lies für jede Taskklasse die maximale Laufzeit ab und berechne die Restzeit bis zur Zykluszeit.'
          ],
          done: 'Erledigt, wenn du für jede Taskklasse Zykluszeit, maximale Laufzeit und Auslastung in Prozent notiert hast.',
          tip: 'Plane höchstens 70–80 % Auslastung je Taskklasse ein. Die Reserve brauchst du für seltene Spitzen und spätere Erweiterungen.',
          link: { label: 'B&R Help: Profiler', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/profile/diagnosis_profile.html' }
        }
      },
      {
        id: 'o3',
        title: 'Konfiguriere Taskklassen und Toleranz',
        guide: {
          intro: 'Für zyklische Taskklassen stellst du Zykluszeit und eine erlaubte Zykluszeitverletzung (Toleranz) ein.',
          steps: [
            'Öffne die CPU-Konfiguration und suche die Einstellungen der Taskklassen.',
            'Stelle für Cyclic #4 eine Zykluszeit von 100 ms ein und lies die eingestellte Toleranz ab.',
            'Verschiebe ein rechenintensives Programm aus Cyclic #1 in Cyclic #4 und vergleiche im Profiler die Auslastung vorher/nachher.',
            'Dokumentiere, warum du die Toleranz nicht einfach erhöhst, um Zykluszeitverletzungen zu vermeiden.'
          ],
          done: 'Erledigt, wenn deine Taskklassen-Tabelle (Klasse, Zykluszeit, Toleranz, Programme, Auslastung) vollständig ist.',
          tip: 'Eine größere Toleranz verschiebt nur den Zeitpunkt der Exception, sie beseitigt die Ursache nicht.',
          link: { label: 'B&R Help: Zykluszeitüberwachung', url: 'https://help.br-automation.com/#/de/6/automationruntime/operationmethode/moduledatasec/cycletimemonitoring.html' }
        }
      },
      {
        id: 'o4',
        title: 'Analysiere eine Zykluszeitverletzung mit Logger und Backtrace',
        guide: {
          intro: 'An der ARsim kannst du gefahrlos eine Endlosschleife einbauen und die Spuren im Logbuch untersuchen.',
          steps: [
            'Baue in ein Testprogramm eine Schleife ein, die nie endet (z. B. `WHILE TRUE DO … END_WHILE`), und übertrage es auf die ARsim.',
            'Die Steuerung geht in SERVICE. Öffne **Öffnen › Logger** und lies die Logbücher aus.',
            'Markiere den Eintrag der Zykluszeitverletzung und öffne die Backtrace-Information des Eintrags.',
            'Identifiziere Task und Programmstelle, entferne die Schleife und starte mit Warmstart neu.'
          ],
          done: 'Erledigt, wenn du Task und Ursache aus Logger und Backtrace benannt und die Steuerung wieder in RUN gebracht hast.',
          tip: 'Nicht jeder Logbucheintrag hat Backtrace-Daten. Fehlen sie, helfen Profiler-Aufzeichnung und Zeitstempel weiter.',
          link: { label: 'B&R Help: Exception Taskklasse', url: 'https://help.br-automation.com/#/de/6/automationruntime/taskclasses/exceptiontaskclass/exceptionstaskclass_sg4.htm' }
        }
      }
    ],
    videos: [
      v('r9oJctqcCZg', 'en', 'Zeigt den PLC Trace in Automation Studio Schritt für Schritt.'),
      v('gLkPL0BHIGQ', 'en', 'Zeigt, wo die Zykluszeit einer Taskklasse geändert wird.'),
      v('hsakSEhHaQg', 'de', 'Erklärt auf Deutsch, wie SPS-Zykluszeit und Buszykluszeit zusammenhängen.')
    ],
    readings: [
      r('tumEchtzeit', 'Uni-Vorlesung zu Echtzeitsystemen: Fristen, Scheduling, Watchdogs – die Theorie hinter Taskklassen.'),
      r('hCycleMon', 'So überwacht Automation Runtime die Zykluszeit und wann eine Exception entsteht.'),
      r('cCycleViolation', 'Praxisbeitrag aus der B&R Community zu Zykluszeitverletzungen durch falsche Taskklassen-Einstellungen.')
    ],
    quiz: [
      { type: 'single', q: 'Wann löst Automation Runtime bei einer zyklischen Taskklasse eine Exception wegen Zykluszeitverletzung aus?',
        options: ['Sobald die Laufzeit 50 % der Zykluszeit überschreitet', 'Wenn die Abarbeitung nach Zykluszeit plus Toleranz noch nicht abgeschlossen ist', 'Bei jedem Warmstart', 'Nur wenn der Profiler läuft'],
        correct: 1, explain: 'Maßgeblich sind eingestellte Zykluszeit und erlaubte Zykluszeitverletzung (Toleranz).' },
      { type: 'single', q: 'Welches Werkzeug zeigt Min/Max/Mittel der Tasklaufzeiten?',
        options: ['Watch', 'Logger', 'Profiler', 'Physical View'],
        correct: 2, explain: 'Der Profiler misst Tasklaufzeiten, System- und Stackauslastung.' },
      { type: 'numeric', q: 'Eine Taskklasse hat {C} ms Zykluszeit, der Profiler misst maximal {L} ms Laufzeit. Wie hoch ist die maximale Auslastung in %?',
        params: { C: [10, 20, 10], L: [2, 8, 1] }, formula: 'L / C * 100', unit: '%', tol: 0.01,
        explain: 'Auslastung = Laufzeit / Zykluszeit · 100 %.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Ursachen kann eine Zykluszeitverletzung in Cyclic #4 haben?',
        options: ['Die Tasks in Cyclic #4 brauchen zusammen länger als die Zykluszeit', 'Eine höher priorisierte Taskklasse (z. B. Cyclic #1) ist zu stark ausgelastet', 'Eine WHILE-Schleife wartet auf einen Eingang', 'Die Variable ist als RETAIN deklariert'],
        correct: [0, 1, 2], explain: 'Laufzeit, Verdrängung durch höhere Prioritäten und blockierende Schleifen führen zu Verletzungen.' },
      { type: 'single', q: 'Warum ist `WHILE NOT diInPosition DO END_WHILE` in einem zyklischen Task falsch?',
        options: ['WHILE ist in ST verboten', 'Der Eingang wird während der Schleife nicht neu eingelesen; der Task blockiert bis zur Zykluszeitverletzung', 'Die Schleife ist zu schnell', 'Weil diInPosition ein Ausgang ist'],
        correct: 1, explain: 'Das Prozessabbild wird erst nach dem Zyklus aktualisiert. Warten muss über mehrere Zyklen in einer Schrittkette erfolgen.' },
      { type: 'single', q: 'Was zeigt der Backtrace eines Logbucheintrags?',
        options: ['Die IP-Adresse des Service-PCs', 'Die Aufrufkette bis zur Stelle, an der die Exception auftrat', 'Den Verlauf einer Variablen', 'Die Lizenzinformation'],
        correct: 1, explain: 'Der Backtrace hilft, Task und Funktionsaufruf der Fehlerstelle zu identifizieren.' },
      { type: 'numeric', q: 'Ein Ringpuffer speichert {N} Zykluszeit-Messwerte bei 10 ms Taskzyklus. Welchen Zeitraum in Sekunden deckt er ab?',
        params: { N: [50, 500, 50] }, formula: 'N * 0.01', unit: 's', tol: 0.01,
        explain: 'Zeitraum = Anzahl Werte · Abtastintervall.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Zykluszeit-Statistik über einen Ringpuffer',
        task: 'Die gemessene Laufzeit der Taskklasse kommt als `gnCycleTimeUs` (UDINT, µs). Budget: Zykluszeit `CYCLE_US = 10000`, Toleranz `TOL_US = 2000`.\n\nIn **jedem Zyklus** gilt:\n1. Den aktuellen Wert in einen Ringpuffer `aBuf : ARRAY[0..49] OF UDINT` schreiben (Schreibindex `nIdx`, läuft 0 … 49 und beginnt wieder bei 0). `nSamples` = Anzahl gültiger Werte (max. 50).\n2. Über alle gültigen Werte berechnen: `nMinUs`, `nMaxUs` (UDINT) und `rAvgUs` (REAL).\n3. `doWarning` = TRUE, wenn `rAvgUs` > 80 % von `CYCLE_US`.\n4. `nViolations` (UDINT) zählt jeden Messwert > `CYCLE_US + TOL_US` (nicht auf das Fenster begrenzt).\n5. Steigende Flanke an `diReset`: Puffer leeren (`nSamples`, `nIdx`, `nViolations` auf 0), danach im **selben Zyklus** den aktuellen Wert als ersten neuen Wert übernehmen.\n\nSind keine Werte vorhanden, sind Min, Max und Mittelwert 0.',
        hints: ['Solange der Puffer nicht voll ist, liegen die gültigen Werte in den Indizes 0 … nSamples−1 – auch wenn er voll ist, sind es alle 50.', 'Summe als UDINT bilden und mit `UDINT_TO_REAL` umwandeln.'],
        cycleMs: 10,
        io: [
          { name: 'gnCycleTimeUs', type: 'UDINT', dir: 'in', label: 'Gemessene Laufzeit', widget: 'slider', min: 0, max: 20000, unit: 'µs' },
          { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Statistik zurücksetzen', widget: 'button' },
          { name: 'nMinUs', type: 'UDINT', dir: 'out', label: 'Minimum', widget: 'value', unit: 'µs' },
          { name: 'nMaxUs', type: 'UDINT', dir: 'out', label: 'Maximum', widget: 'value', unit: 'µs' },
          { name: 'rAvgUs', type: 'REAL', dir: 'out', label: 'Mittelwert', widget: 'gauge', min: 0, max: 20000, unit: 'µs' },
          { name: 'nSamples', type: 'INT', dir: 'out', label: 'Anzahl Werte', widget: 'value' },
          { name: 'nViolations', type: 'UDINT', dir: 'out', label: 'Verletzungen', widget: 'value' },
          { name: 'doWarning', type: 'BOOL', dir: 'out', label: 'Auslastung > 80 %', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Reset, Ringpuffer, Statistik, Verletzungen *)\n\tnMaxUs := gnCycleTimeUs;\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tCYCLE_US : UDINT := 10000;\n\tTOL_US : UDINT := 2000;\nEND_VAR\nVAR\n\taBuf : ARRAY[0..49] OF UDINT;\n\tnIdx : INT;\n\ti : INT;\n\tnSum : UDINT;\n\trtReset : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Reset *)\n\trtReset(CLK := diReset);\n\tIF rtReset.Q THEN\n\t\tnSamples := 0;\n\t\tnIdx := 0;\n\t\tnViolations := 0;\n\tEND_IF\n\n\t(* Ringpuffer *)\n\taBuf[nIdx] := gnCycleTimeUs;\n\tnIdx := (nIdx + 1) MOD 50;\n\tIF nSamples < 50 THEN\n\t\tnSamples := nSamples + 1;\n\tEND_IF\n\tIF gnCycleTimeUs > CYCLE_US + TOL_US THEN\n\t\tnViolations := nViolations + 1;\n\tEND_IF\n\n\t(* Statistik *)\n\tnSum := 0;\n\tnMinUs := aBuf[0];\n\tnMaxUs := aBuf[0];\n\tFOR i := 0 TO nSamples - 1 DO\n\t\tnSum := nSum + aBuf[i];\n\t\tIF aBuf[i] < nMinUs THEN nMinUs := aBuf[i]; END_IF\n\t\tIF aBuf[i] > nMaxUs THEN nMaxUs := aBuf[i]; END_IF\n\tEND_FOR\n\trAvgUs := UDINT_TO_REAL(nSum) / INT_TO_REAL(nSamples);\n\tdoWarning := rAvgUs > 0.8 * UDINT_TO_REAL(CYCLE_US);\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tCYCLE_US : UDINT := 10000;\n\tTOL_US : UDINT := 2000;\nEND_VAR\nVAR\n\taBuf : ARRAY[0..49] OF UDINT;\n\tnIdx : INT;\n\ti : INT;\n\tnSum : UDINT;\n\trtReset : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Konstante Laufzeit', steps: [
            { set: { gnCycleTimeUs: 4000 } }, { cycles: 10 },
            { expect: 'nSamples = 10 AND nMinUs = 4000 AND nMaxUs = 4000', msg: '10 Werte à 4000 µs: Min = Max = 4000.' },
            { expect: 'ABS(rAvgUs - 4000.0) < 0.5 AND NOT doWarning', msg: 'Mittelwert 4000 µs, keine Warnung.' }
          ]},
          { name: 'Min, Max und Mittelwert über gemischte Werte', steps: [
            { set: { gnCycleTimeUs: 3000 } }, { cycles: 5 },
            { set: { gnCycleTimeUs: 9000 } }, { cycles: 5 },
            { expect: 'nMinUs = 3000 AND nMaxUs = 9000', msg: 'Min 3000, Max 9000.' },
            { expect: 'ABS(rAvgUs - 6000.0) < 0.5 AND NOT doWarning', msg: 'Mittelwert 6000 µs (60 %) – keine Warnung.' }
          ]},
          { name: 'Ringpuffer verdrängt alte Werte', steps: [
            { set: { gnCycleTimeUs: 2000 } }, { cycles: 50 },
            { set: { gnCycleTimeUs: 9000 } }, { cycles: 50 },
            { expect: 'nSamples = 50 AND nMinUs = 9000', msg: 'Nach 50 neuen Werten darf kein alter Wert (2000) mehr im Fenster sein.' },
            { expect: 'doWarning', msg: 'Mittelwert 9000 µs > 8000 µs – Warnung.' }
          ]},
          { name: 'Verletzungen werden gezählt', steps: [
            { set: { gnCycleTimeUs: 13000 } }, { cycles: 3 },
            { set: { gnCycleTimeUs: 12000 } }, { cycles: 4 },
            { set: { gnCycleTimeUs: 5000 } }, { cycles: 5 },
            { expect: 'nViolations = 3', msg: 'Nur Werte über 12000 µs zählen (12000 selbst ist noch erlaubt).' }
          ]},
          { name: 'Reset leert die Statistik', steps: [
            { set: { gnCycleTimeUs: 13000 } }, { cycles: 5 },
            { set: { gnCycleTimeUs: 5000, diReset: true } }, { cycles: 1 },
            { set: { diReset: false } }, { cycles: 2 },
            { expect: 'nSamples = 3 AND nViolations = 0', msg: 'Reset-Zyklus übernimmt den ersten neuen Wert, danach 2 weitere: 3 Werte, 0 Verletzungen.' },
            { expect: 'nMinUs = 5000 AND nMaxUs = 5000', msg: 'Nach dem Reset dürfen keine alten 13000-µs-Werte in die Statistik eingehen.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'fehlersuche',
        title: 'Zykluszeitverletzung durch Warteschleife beheben',
        task: 'Das Programm fährt einen Zylinder aus und wartet in einer `WHILE`-Schleife auf die Endlage. Auf dem Zielsystem führt das zur **Zykluszeitverletzung**, weil sich das Prozessabbild innerhalb eines Zyklus nicht ändert.\n\nBaue das Programm **nicht blockierend** um:\n- Steigende Flanke an `diStart` (wenn `doMove` FALSE ist): `doMove := TRUE`, `doDone` und `doTimeout` zurücksetzen.\n- Solange `doMove` TRUE ist: Meldet `diInPosition` die Endlage → `doMove := FALSE`, `doDone := TRUE`.\n- Ist die Endlage nach **2 s** nicht erreicht → `doMove := FALSE`, `doTimeout := TRUE` (Überwachungszeit mit `TON`).\n\nDie Simulation fährt den Zylinder in 0,5 s aus; mit `diBlocked` klemmt er.',
        hints: ['Jede Warteschleife in einem zyklischen Task wird zu einer Bedingung, die in jedem Zyklus erneut geprüft wird.', '`fbTimeout(IN := doMove, PT := T#2s);` überwacht die Bewegung. Achte darauf, wo du den Timer aufrufst: Er muss nach einem Timeout mindestens einmal `IN = FALSE` sehen, bevor die nächste Bewegung startet.'],
        cycleMs: 10,
        io: [
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start', widget: 'button' },
          { name: 'diBlocked', type: 'BOOL', dir: 'in', label: 'Zylinder klemmt (Simulation)', widget: 'switch' },
          { name: 'diInPosition', type: 'BOOL', dir: 'in', label: 'Endlage ausgefahren', widget: 'led' },
          { name: 'rStroke', type: 'REAL', dir: 'in', label: 'Hub', widget: 'gauge', min: 0, max: 1 },
          { name: 'doMove', type: 'BOOL', dir: 'out', label: 'Ventil Ausfahren', widget: 'led' },
          { name: 'doDone', type: 'BOOL', dir: 'out', label: 'Fertig', widget: 'led' },
          { name: 'doTimeout', type: 'BOOL', dir: 'out', label: 'Überwachungszeit abgelaufen', widget: 'led' }
        ],
        scene: { type: 'cylinder', bind: { extend: 'doMove', isOut: 'diInPosition', stroke: 'rStroke' } },
        plant: {
          var: 'VAR\nEND_VAR\n',
          code: 'IF doMove AND NOT diBlocked THEN\n\trStroke := rStroke + 2.0 * PLANT_DT;\nEND_IF\nIF rStroke > 1.0 THEN\n\trStroke := 1.0;\nEND_IF\ndiInPosition := rStroke >= 1.0;'
        },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tIF diStart THEN\n\t\tdoMove := TRUE;\n\t\tWHILE NOT diInPosition DO\n\t\t\tnWait := nWait + 1;\n\t\tEND_WHILE\n\t\tdoMove := FALSE;\n\t\tdoDone := TRUE;\n\tEND_IF\nEND_PROGRAM\n',
          var: 'VAR\n\tnWait : UDINT;\n\trtStart : R_TRIG;\n\tfbTimeout : TON;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Timer VOR dem Start aufrufen: so sieht er nach einem Timeout einmal IN = FALSE und setzt sich zurück *)\n\tfbTimeout(IN := doMove, PT := T#2s);\n\n\trtStart(CLK := diStart);\n\tIF rtStart.Q AND NOT doMove THEN\n\t\tdoMove := TRUE;\n\t\tdoDone := FALSE;\n\t\tdoTimeout := FALSE;\n\tEND_IF\n\n\tIF doMove THEN\n\t\tIF diInPosition THEN\n\t\t\tdoMove := FALSE;\n\t\t\tdoDone := TRUE;\n\t\tELSIF fbTimeout.Q THEN\n\t\t\tdoMove := FALSE;\n\t\t\tdoTimeout := TRUE;\n\t\tEND_IF\n\tEND_IF\nEND_PROGRAM\n',
          var: 'VAR\n\tnWait : UDINT;\n\trtStart : R_TRIG;\n\tfbTimeout : TON;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Ohne Start passiert nichts', steps: [
            { ms: 300 },
            { expect: 'NOT doMove AND NOT doDone AND NOT doTimeout' }
          ]},
          { name: 'Ausfahren ohne Blockieren der Task', steps: [
            { set: { diStart: true } }, { cycles: 2 },
            { expect: 'doMove', msg: 'Nach dem Start muss das Ventil angesteuert sein – ohne dass der Zyklus hängt.' },
            { set: { diStart: false } },
            { until: 'doDone', maxMs: 1500, msg: 'Nach Erreichen der Endlage muss doDone kommen.' },
            { expect: 'NOT doMove AND NOT doTimeout', msg: 'In der Endlage Ventil aus, keine Zeitüberschreitung.' }
          ]},
          { name: 'Überwachungszeit bei klemmendem Zylinder', steps: [
            { set: { diBlocked: true, diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { ms: 1700 },
            { expect: 'doMove AND NOT doTimeout', msg: 'Vor Ablauf von 2 s darf die Überwachung nicht ansprechen.' },
            { until: 'doTimeout', maxMs: 700, msg: 'Nach 2 s muss doTimeout kommen.' },
            { expect: 'NOT doMove AND NOT doDone', msg: 'Bei Zeitüberschreitung Ventil aus, kein Fertig.' }
          ]},
          { name: 'Neustart nach Zeitüberschreitung', steps: [
            { set: { diBlocked: true, diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { until: 'doTimeout', maxMs: 2500 },
            { set: { diBlocked: false, diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { expect: 'doMove AND NOT doTimeout', msg: 'Ein neuer Start setzt die Zeitüberschreitung zurück.' },
            { until: 'doDone', maxMs: 1500 }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'system-3-supervisor',
    level: 3,
    kind: 'projekt',
    title: 'Praxisprojekt: Diagnose-Supervisor und Offline-Installation',
    summary: 'Du baust einen Zustandsautomaten, der Hochlauf, Modulstatus, Not-Halt-Kreis und Heartbeat eines Partnersystems überwacht, und lieferst das Projekt als Offline-Installation aus.',
    minutes: 300,
    req: ['system-3-zykluszeit', 'system-2-speicher'],
    briefing: 'In diesem Projekt fügst du alles aus Level 1–3 zu einer Maschinenfunktion zusammen. Ein Supervisor-Zustandsautomat führt die Maschine durch INIT, CHECK, READY, RUN und ERROR. Er wertet die ModuleOk-Signale der Station, den Status des Not-Halt-Kreises (nur als Meldung – die Sicherheitsfunktion selbst liegt in der Sicherheitstechnik) und das Lebenszeichen eines Partnersystems (z. B. Leitrechner oder HMI) aus. Fehler werden nach dem First-out-Prinzip gemeldet: Der **erste** Fehler bestimmt den Fehlercode, Folgefehler überschreiben ihn nicht. Zum Abschluss lieferst du das Projekt so aus, wie es im Feld üblich ist: als Runtime-Utility-Center-Paket bzw. Offline-Installation auf einem Speichermedium.',
    practice: 'First-out-Meldungen sparen dem Service Stunden: Fällt die Einspeisung aus, melden zehn Module Fehler – entscheidend ist nur der erste. Und wer beim Kunden ohne Automation Studio ein Update einspielen muss, braucht ein fertiges Installationspaket.',
    transfer: {
      tia: 'Zustandsautomaten baust du in TIA typischerweise mit CASE in SCL oder mit GRAPH. Offline-Weitergabe erfolgt dort über eine SIMATIC Memory Card bzw. ein Projektarchiv/"Laden über Speicherkarte".',
      codesys: 'In CODESYS entspricht das einem CASE-basierten Zustandsautomaten oder AS (Ablaufsprache). Auslieferung ohne IDE z. B. über Bootprojekt-Dateien auf SD-Karte; TwinCAT nutzt das Bootprojekt im Boot-Verzeichnis.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf den Zustandsautomaten',
        guide: {
          intro: 'Bevor du programmierst, zeichnest du die Zustände und Übergänge. Jeder Übergang braucht eine eindeutige Bedingung.',
          steps: [
            'Zeichne die Zustände INIT (0), CHECK (10), READY (20), RUN (30) und ERROR (90) als Kreise.',
            'Beschrifte jeden Übergang mit seiner Bedingung (z. B. "alle Module OK und Partner lebt").',
            'Lege die Fehlercodes fest: 1–3 Modul, 10 Not-Halt-Kreis, 20 Partner-Heartbeat.',
            'Definiere die Ausgänge je Zustand (doReady, doMotor, doFault) in einer Tabelle.'
          ],
          done: 'Erledigt, wenn Zustandsdiagramm und Ausgangstabelle vollständig sind und zur Aufgabenstellung passen.',
          tip: 'Lege Zustandsnummern in Zehnerschritten an. Dann kannst du später Zwischenzustände einfügen, ohne alles umzunummerieren.'
        }
      },
      {
        id: 'o2',
        title: 'Programmiere und teste den Supervisor',
        guide: {
          intro: 'Die Übung prüft dein Programm gegen die Anforderungen. Danach überträgst du es in dein AS6-Projekt.',
          steps: [
            'Lege in `Types.typ` den Aufzählungstyp `eSupState` an und deklariere die Zustandsvariable.',
            'Berechne Fehlerursachen und Heartbeat-Überwachung **vor** der `CASE`-Anweisung.',
            'Programmiere die Zustände und achte darauf, dass `nErrorCode` nur beim Eintritt in ERROR gesetzt wird (First-out).',
            'Führe alle Tests aus, bis sie grün sind, und übertrage das Programm in dein AS6-Projekt (ARsim).',
            'Zeichne mit dem Trace einen Fehlerfall auf (Zustand, Fehlercode, Ursache).'
          ],
          code: { lang: 'typ', text: 'TYPE\n\teSupState : (ST_INIT := 0, ST_CHECK := 10, ST_READY := 20, ST_RUN := 30, ST_ERROR := 90);\nEND_TYPE' },
          done: 'Erledigt, wenn alle Tests grün sind und ein Trace eines Fehlerfalls vorliegt.',
          tip: 'Spiegele den Zustand zusätzlich als Zahl (nStateNo) auf eine Variable. HMI, Trace und Service lesen Zahlen leichter als Enums.'
        }
      },
      {
        id: 'o3',
        title: 'Erzeuge ein RUC-Paket und eine Offline-Installation',
        guide: {
          intro: 'Automation Studio erzeugt aus Build-Ergebnis und Konfiguration ein RUC-Paket. Im Runtime Utility Center wird daraus eine Offline-Installation oder ein Installationspaket.',
          steps: [
            'Kompiliere das Projekt mit **F7**.',
            'Wähle **Projekt › Ins Runtime Utility Center exportieren** und speichere das RUC-Paket.',
            'Öffne das Paket im Runtime Utility Center und wähle die Aktion **Offline-Installation** (Ziel: CF-Karte/Speichermedium) oder **Installationspaket** (z. B. für USB-Stick).',
            'Wende das Paket auf ein Medium bzw. eine Steuerung an und kontrolliere nach dem Neustart im Logger, dass das System korrekt hochgelaufen ist.'
          ],
          done: 'Erledigt, wenn ein RUC-Paket existiert und die Installation mit Logger-Kontrolle dokumentiert ist.',
          tip: 'Beim Erstellen eines neuen Speicherabbilds werden alle Daten des Speichers gelöscht – also auch remanente Daten. Sichere sie vorher.',
          link: { label: 'B&R Help: Projektinstallation mittels RUC', url: 'https://help.br-automation.com/#/de/6/automationruntime/enhancedtransfer/handling/export_ruc/export_ruc.html' }
        }
      },
      {
        id: 'o4',
        title: 'Reiche den Nachweis ein',
        guide: {
          intro: 'Der Ausbilder prüft Code, Zustandsdiagramm und Installationsnachweis.',
          steps: [
            'Lege Projekt, Zustandsdiagramm (Bild/PDF), Trace-Datei und Logger-Export im Repository auf git.breitner.de ab.',
            'Beschreibe in der README die Fehlercodes und das Quittierkonzept.',
            'Reiche den Link als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist.',
          tip: 'Die Fehlercode-Tabelle aus der README ist später die Grundlage für das Service-Handbuch.'
        }
      }
    ],
    videos: [
      v('vqf0njnr2Rc', 'de', 'Deutschsprachig: Backups von Programmen in Automation Studio erstellen – Grundlage für jede Auslieferung.'),
      v('BPhore8zNtw', 'de', 'Überblick über Werkzeuge zur SPS-Fehlersuche, wenn eine Anlage steht.')
    ],
    readings: [
      r('thmSps', 'Hochschulskript: zyklische Bearbeitung, Zeitüberwachung und Reaktionszeiten als Basis für den Supervisor.'),
      r('hRucExport', 'Ablauf einer Projektinstallation mit RUC-Paket.'),
      r('hInstallPackage', 'Getting Started: Erstes Projekt mittels Installationspaket übertragen.')
    ],
    quiz: [
      { type: 'single', q: 'Was bedeutet First-out bei Fehlermeldungen?',
        options: ['Der neueste Fehler wird angezeigt.', 'Der zuerst aufgetretene Fehler wird festgehalten; Folgefehler überschreiben ihn nicht.', 'Fehler werden alphabetisch sortiert.', 'Nur der erste Fehler nach dem Einschalten zählt.'],
        correct: 1, explain: 'First-out hilft, die eigentliche Ursache einer Fehlerkaskade zu erkennen.' },
      { type: 'single', q: 'Wie erzeugst du in AS6 ein Paket für das Runtime Utility Center?',
        options: ['Online › Dienste › Kaltstart', 'Projekt › Ins Runtime Utility Center exportieren', 'Extras › Upgrades', 'Öffnen › Logger'],
        correct: 1, explain: 'Der Menüeintrag Projekt › Ins Runtime Utility Center exportieren erzeugt das RUC-Paket.' },
      { type: 'single', q: 'Ein Partnersystem sendet alle 100 ms einen hochzählenden Zähler. Wann erkennst du einen Ausfall sinnvoll?',
        options: ['Sobald sich der Zähler in einem Zyklus nicht ändert', 'Wenn sich der Zähler für eine Überwachungszeit (z. B. 500 ms) nicht geändert hat', 'Wenn der Zähler 0 ist', 'Nie, Zähler sind immer zuverlässig'],
        correct: 1, explain: 'Bei 10 ms Taskzyklus ändert sich der Zähler nur alle 10 Zyklen. Eine Überwachungszeit größer als das Sendeintervall ist nötig.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Eigenschaften hat ein guter Zustandsautomat für eine Maschine?',
        options: ['Jeder Zustand legt seine Ausgänge eindeutig fest', 'Fehlerbedingungen werden in allen relevanten Zuständen geprüft', 'Übergänge hängen von eindeutigen Bedingungen ab', 'Ausgänge werden an beliebigen Stellen außerhalb des Automaten zusätzlich gesetzt'],
        correct: [0, 1, 2], explain: 'Verstreute Ausgangszuweisungen machen den Automaten undurchschaubar.' },
      { type: 'single', q: 'Warum gehört der Not-Halt-Status im Supervisor nur in die Diagnose und nicht in die Sicherheitsfunktion?',
        options: ['Weil Not-Halt unwichtig ist', 'Weil die Sicherheitsfunktion in zertifizierter Sicherheitstechnik umgesetzt werden muss; die Standard-SPS meldet nur', 'Weil ST keine BOOL-Signale kennt', 'Weil der Supervisor zu langsam ist'],
        correct: 1, explain: 'Funktionale Sicherheit erfordert Sicherheitssteuerungen bzw. -schaltgeräte; die Standardsteuerung darf den Status nur auswerten und melden.' },
      { type: 'single', q: 'Was passiert beim Erstellen eines neuen Speicherabbilds durch eine Offline-Installation mit den Daten auf dem Medium?',
        options: ['Sie bleiben erhalten.', 'Alle Daten des Speichers werden gelöscht.', 'Nur das Logbuch wird gelöscht.', 'Nur remanente Variablen bleiben.'],
        correct: 1, explain: 'Die B&R-Hilfe warnt: Bei einem neuen Abbild werden alle Daten gelöscht.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Diagnose-Supervisor als Zustandsautomat',
        task: 'Programmiere den Supervisor mit dem Aufzählungstyp `eSupState` und spiegle den Zustand als Zahl in `nStateNo` (0, 10, 20, 30, 90).\n\n**Fehlerursachen** (in jedem Zyklus vor der CASE-Anweisung bestimmen, Priorität in dieser Reihenfolge):\n1–3: `diModuleOk1 … 3` FALSE → Code 1, 2, 3 · 10: `diEStopOk` FALSE · 20: Partner-Heartbeat ausgefallen.\n\n**Heartbeat:** `gnPartnerHb` (UINT) zählt im Partnersystem alle 100 ms hoch. Der Partner gilt als OK, wenn sich der Zähler mindestens einmal geändert hat **und** die letzte Änderung höchstens **500 ms** zurückliegt.\n\n**Zustände:**\n- **INIT (0):** Ausgänge aus, sofort nach CHECK.\n- **CHECK (10):** Sind alle Ursachen frei → READY. Sind sie nach **3 s** nicht frei → ERROR mit dem Code der aktuellen Ursache.\n- **READY (20):** `doReady` TRUE. Steigende Flanke `diStart` bei `diStop` TRUE (Öffner) → RUN.\n- **RUN (30):** `doMotor` TRUE. `diStop` FALSE → READY.\n- In READY und RUN führt **jede** Ursache sofort nach ERROR.\n- **ERROR (90):** `doFault` TRUE, Motor aus. `nErrorCode` wird **nur beim Eintritt** gesetzt (First-out), `nFaultCount` (UINT) zählt jeden Eintritt. Steigende Flanke `diAck` **ohne anstehende Ursache** → `nErrorCode := 0`, zurück nach CHECK.',
        hints: ['`fbHbTimeout(IN := gnPartnerHb = nLastHb, PT := T#500ms);` – danach `nLastHb := gnPartnerHb;`', 'Eine Hilfsvariable `nCause` (0 = keine Ursache) vereinfacht alle Zustände.', 'Leite die Ausgänge nach der CASE-Anweisung zentral aus dem neuen Zustand ab – dann stimmen sie schon im Zyklus des Übergangs.', 'Rufe R_TRIG- und TON-Instanzen außerhalb der CASE-Anweisung auf, sonst verpassen sie Flanken.'],
        cycleMs: 10,
        io: [
          { name: 'diModuleOk1', type: 'BOOL', dir: 'in', label: 'ModuleOk Modul 1', widget: 'switch', init: true },
          { name: 'diModuleOk2', type: 'BOOL', dir: 'in', label: 'ModuleOk Modul 2', widget: 'switch', init: true },
          { name: 'diModuleOk3', type: 'BOOL', dir: 'in', label: 'ModuleOk Modul 3', widget: 'switch', init: true },
          { name: 'diEStopOk', type: 'BOOL', dir: 'in', label: 'Not-Halt-Kreis geschlossen (Meldung)', widget: 'switch', init: true },
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start', widget: 'button' },
          { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Stopp (Öffner)', widget: 'switch', init: true },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'diPartnerAlive', type: 'BOOL', dir: 'in', label: 'Partnersystem aktiv (Simulation)', widget: 'switch', init: true },
          { name: 'gnPartnerHb', type: 'UINT', dir: 'in', label: 'Heartbeat-Zähler Partner', widget: 'value' },
          { name: 'nStateNo', type: 'INT', dir: 'out', label: 'Zustand', widget: 'value' },
          { name: 'nErrorCode', type: 'INT', dir: 'out', label: 'Fehlercode (First-out)', widget: 'value' },
          { name: 'nFaultCount', type: 'UINT', dir: 'out', label: 'Anzahl Störungen', widget: 'value' },
          { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Bereit', widget: 'led' },
          { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Motor', widget: 'led' },
          { name: 'doFault', type: 'BOOL', dir: 'out', label: 'Störung', widget: 'led' }
        ],
        scene: { type: 'motor', bind: { run: 'doMotor', fault: 'doFault' } },
        plant: {
          var: 'VAR\n\trT : REAL;\nEND_VAR\n',
          code: 'IF diPartnerAlive THEN\n\trT := rT + PLANT_DT;\n\tIF rT >= 0.0995 THEN\n\t\trT := 0.0;\n\t\tgnPartnerHb := gnPartnerHb + 1;\n\tEND_IF\nEND_IF'
        },
        files: {
          main: 'PROGRAM _INIT\n\teState := ST_INIT;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Fehlerursachen und Heartbeat bestimmen *)\n\n\tCASE eState OF\n\t\tST_INIT:\n\t\t\tnStateNo := 0;\n\t\t\teState := ST_CHECK;\n\n\t\tST_CHECK:\n\t\t\tnStateNo := 10;\n\t\t\t(* TODO *)\n\n\t\tST_READY:\n\t\t\tnStateNo := 20;\n\t\t\t(* TODO *)\n\n\t\tST_RUN:\n\t\t\tnStateNo := 30;\n\t\t\t(* TODO *)\n\n\t\tST_ERROR:\n\t\t\tnStateNo := 90;\n\t\t\t(* TODO *)\n\tEND_CASE\nEND_PROGRAM\n',
          var: 'VAR\n\teState : eSupState;\n\tnCause : INT;\n\tnLastHb : UINT;\n\tbHbSeen : BOOL;\n\tbPartnerOk : BOOL;\n\tfbHbTimeout : TON;\n\tfbCheckTimeout : TON;\n\trtStart : R_TRIG;\n\trtAck : R_TRIG;\nEND_VAR\n',
          typ: 'TYPE\n\teSupState : (ST_INIT := 0, ST_CHECK := 10, ST_READY := 20, ST_RUN := 30, ST_ERROR := 90);\nEND_TYPE\n'
        },
        solution: {
          main: 'PROGRAM _INIT\n\teState := ST_INIT;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Heartbeat des Partners *)\n\tfbHbTimeout(IN := gnPartnerHb = nLastHb, PT := T#500ms);\n\tIF gnPartnerHb <> nLastHb THEN\n\t\tbHbSeen := TRUE;\n\tEND_IF\n\tnLastHb := gnPartnerHb;\n\tbPartnerOk := bHbSeen AND NOT fbHbTimeout.Q;\n\n\t(* Fehlerursache nach Priorität *)\n\tIF NOT diModuleOk1 THEN nCause := 1;\n\tELSIF NOT diModuleOk2 THEN nCause := 2;\n\tELSIF NOT diModuleOk3 THEN nCause := 3;\n\tELSIF NOT diEStopOk THEN nCause := 10;\n\tELSIF NOT bPartnerOk THEN nCause := 20;\n\tELSE nCause := 0;\n\tEND_IF\n\n\trtStart(CLK := diStart);\n\trtAck(CLK := diAck);\n\tfbCheckTimeout(IN := eState = ST_CHECK, PT := T#3s);\n\n\t(* Übergänge *)\n\tCASE eState OF\n\t\tST_INIT:\n\t\t\teState := ST_CHECK;\n\n\t\tST_CHECK:\n\t\t\tIF nCause = 0 THEN\n\t\t\t\teState := ST_READY;\n\t\t\tELSIF fbCheckTimeout.Q THEN\n\t\t\t\tnErrorCode := nCause;\n\t\t\t\tnFaultCount := nFaultCount + 1;\n\t\t\t\teState := ST_ERROR;\n\t\t\tEND_IF\n\n\t\tST_READY:\n\t\t\tIF nCause <> 0 THEN\n\t\t\t\tnErrorCode := nCause;\n\t\t\t\tnFaultCount := nFaultCount + 1;\n\t\t\t\teState := ST_ERROR;\n\t\t\tELSIF rtStart.Q AND diStop THEN\n\t\t\t\teState := ST_RUN;\n\t\t\tEND_IF\n\n\t\tST_RUN:\n\t\t\tIF nCause <> 0 THEN\n\t\t\t\tnErrorCode := nCause;\n\t\t\t\tnFaultCount := nFaultCount + 1;\n\t\t\t\teState := ST_ERROR;\n\t\t\tELSIF NOT diStop THEN\n\t\t\t\teState := ST_READY;\n\t\t\tEND_IF\n\n\t\tST_ERROR:\n\t\t\tIF rtAck.Q AND nCause = 0 THEN\n\t\t\t\tnErrorCode := 0;\n\t\t\t\teState := ST_CHECK;\n\t\t\tEND_IF\n\tEND_CASE\n\n\t(* Ausgänge zentral aus dem (neuen) Zustand ableiten *)\n\tCASE eState OF\n\t\tST_INIT:  nStateNo := 0;\n\t\tST_CHECK: nStateNo := 10;\n\t\tST_READY: nStateNo := 20;\n\t\tST_RUN:   nStateNo := 30;\n\t\tST_ERROR: nStateNo := 90;\n\tEND_CASE\n\tdoReady := (eState = ST_READY) OR (eState = ST_RUN);\n\tdoMotor := eState = ST_RUN;\n\tdoFault := eState = ST_ERROR;\nEND_PROGRAM\n',
          var: 'VAR\n\teState : eSupState;\n\tnCause : INT;\n\tnLastHb : UINT;\n\tbHbSeen : BOOL;\n\tbPartnerOk : BOOL;\n\tfbHbTimeout : TON;\n\tfbCheckTimeout : TON;\n\trtStart : R_TRIG;\n\trtAck : R_TRIG;\nEND_VAR\n',
          typ: 'TYPE\n\teSupState : (ST_INIT := 0, ST_CHECK := 10, ST_READY := 20, ST_RUN := 30, ST_ERROR := 90);\nEND_TYPE\n'
        },
        tests: [
          { name: 'Hochlauf bis READY', steps: [
            { until: 'nStateNo = 20', maxMs: 1000, msg: 'Mit OK-Modulen und lebendem Partner muss READY erreicht werden.' },
            { expect: 'doReady AND NOT doMotor AND NOT doFault AND nErrorCode = 0' }
          ]},
          { name: 'Start und Stopp', steps: [
            { until: 'nStateNo = 20', maxMs: 1000 },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
            { expect: 'nStateNo = 30 AND doMotor', msg: 'Start-Flanke in READY führt nach RUN mit laufendem Motor.' },
            { set: { diStop: false } }, { cycles: 2 },
            { expect: 'nStateNo = 20 AND NOT doMotor', msg: 'Stopp (Öffner offen) führt zurück nach READY.' }
          ]},
          { name: 'Modulfehler im Betrieb, Quittieren erst ohne Ursache', steps: [
            { until: 'nStateNo = 20', maxMs: 1000 },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
            { set: { diModuleOk2: false } }, { cycles: 2 },
            { expect: 'nStateNo = 90 AND NOT doMotor AND doFault AND nErrorCode = 2', msg: 'Modul 2 fällt aus: ERROR, Motor aus, Code 2.' },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'nStateNo = 90', msg: 'Quittieren bei anstehender Ursache darf ERROR nicht verlassen.' },
            { set: { diModuleOk2: true } }, { cycles: 2 },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } },
            { until: 'nStateNo = 20', maxMs: 1000, msg: 'Nach Quittieren ohne Ursache über CHECK zurück nach READY.' },
            { expect: 'nErrorCode = 0 AND nFaultCount = 1' }
          ]},
          { name: 'Ausfall des Partner-Heartbeats', steps: [
            { until: 'nStateNo = 20', maxMs: 1000 },
            { set: { diPartnerAlive: false } }, { ms: 350 },
            { expect: 'nStateNo = 20', msg: 'Unter 500 ms ohne Änderung darf noch kein Fehler kommen.' },
            { until: 'nStateNo = 90', maxMs: 600, msg: 'Nach 500 ms ohne Heartbeat-Änderung muss ERROR folgen.' },
            { expect: 'nErrorCode = 20' }
          ]},
          { name: 'Hochlauf-Timeout in CHECK', steps: [
            { set: { diModuleOk3: false } },
            { ms: 2500 },
            { expect: 'nStateNo = 10', msg: 'Während der ersten 3 s wartet CHECK auf die Module.' },
            { until: 'nStateNo = 90', maxMs: 1000, msg: 'Nach 3 s in CHECK muss ERROR folgen.' },
            { expect: 'nErrorCode = 3', msg: 'Ursache ist Modul 3.' }
          ]},
          { name: 'First-out: Folgefehler überschreibt nicht', steps: [
            { until: 'nStateNo = 20', maxMs: 1000 },
            { set: { diEStopOk: false } }, { cycles: 2 },
            { set: { diModuleOk1: false } }, { cycles: 2 },
            { expect: 'nStateNo = 90 AND nErrorCode = 10', msg: 'Der erste Fehler (Not-Halt-Kreis, 10) bleibt gemeldet, obwohl Modul 1 eine höhere Priorität hat.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Diagnose-Supervisor'
  }
];
