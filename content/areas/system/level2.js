// Bereich "system" – Level 2 (Junior → Prüfung Senior)
'use strict';
const { v } = require('./videos');
const { r } = require('./readings');

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'system-2-runtime',
    level: 2,
    kind: 'lektion',
    title: 'Automation Runtime, Hochlauf und Betriebszustände',
    summary: 'Du verstehst, wie Automation Runtime hochläuft, was RUN, SERVICE, BOOT und DIAGNOSE bedeuten und wie Warm- und Kaltstart Variablen beeinflussen.',
    minutes: 150,
    req: ['system-1-inbetriebnahme'],
    briefing: 'Automation Runtime (AR) ist das Echtzeitbetriebssystem der B&R-Steuerungen. Es startet die Taskklassen, verwaltet Speicher und I/O und protokolliert Ereignisse. Nach jedem Hochlauf befindet sich die Steuerung in einem definierten Betriebszustand: **RUN** (Taskklassen laufen), **SERVICE** (Taskklassensystem steht, Systemdienste wie Projektinstallation, Logbuch, Watch sind verfügbar), **DIAGNOSE** (nur Logbuch lesen, Projektinstallation, Warm-/Kaltstart) und **BOOT** (nur Grundsystem, z. B. ohne gültige Anwendung). Ob Werte erhalten bleiben, hängt von der Hochlaufart ab: Bei einem Warmstart behalten remanente Variablen ihren Wert, bei einem Kaltstart nicht. Auf der Anwenderseite bildest du Betriebsarten der Maschine (Automatik, Hand, Service) ab – mit sauberer Plausibilitätsprüfung.',
    practice: 'Ein Servicetechniker ruft an: "Die Steuerung blinkt und nichts läuft." Wer weiß, dass Laufzeitfehler wie eine Division durch 0 die CPU in SERVICE versetzen, schaut sofort ins Logbuch statt die Maschine neu zu verdrahten.',
    transfer: {
      tia: 'Bei S7-1500 entspricht RUN/STOP den Betriebszuständen der CPU; der Diagnosepuffer übernimmt die Rolle des Logbuchs. Warm-/Kaltstart heißen dort Anlaufarten (z. B. Warmstart über OB100).',
      codesys: 'CODESYS kennt Start/Stopp sowie Reset warm/kalt/ursprung; TwinCAT unterscheidet Config- und Run-Mode des Systems sowie Start/Stopp der PLC-Laufzeit.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Löse gezielt Warmstart, Kaltstart und Stopp aus',
        guide: {
          intro: 'Die Hochlaufarten erreichst du im Menü Online › Dienste. Beobachte dabei die Statusleiste und die Variablenwerte.',
          steps: [
            'Verbinde dich mit der ARsim oder einer echten Steuerung (Statusleiste zeigt RUN).',
            'Öffne den Watch und beobachte eine Zählervariable, die im Programm hochzählt.',
            'Führe **Online › Dienste › Warmstart** aus (Umschalt+Strg+W) und notiere, ob der Zähler zurückgesetzt wurde.',
            'Führe **Online › Dienste › Zielsystem stoppen** aus: Die Steuerung geht in SERVICE. Prüfe, dass der Watch weiter Werte liefert, das Programm aber nicht mehr zählt.',
            'Starte mit **Online › Dienste › Kaltstart** (Umschalt+Strg+C) neu.'
          ],
          done: 'Erledigt, wenn du für Warmstart, Stopp und Kaltstart notiert hast, welcher Betriebszustand folgte und was mit dem Zähler passierte.',
          tip: 'Stopp heißt bei B&R: Hochlauf in den Zustand SERVICE. Die Ausgänge werden dabei auf 0 gesetzt – kläre vorher, was das an der Maschine bedeutet.',
          link: { label: 'B&R Help: Menü Online', url: 'https://help.br-automation.com/#/de/6/projectmanagement/menus/desktop_menus_online.html' }
        }
      },
      {
        id: 'o2',
        title: 'Ordne die Betriebszustände ihren Auslösern zu',
        guide: {
          intro: 'Nicht nur Befehle aus AS6, auch Fehler führen zu einem Hochlauf in einen bestimmten Zustand.',
          steps: [
            'Lies in der Hilfe die Seite **Betriebszustände** (Hochlauf und Betriebszustände).',
            'Erstelle eine Tabelle: Auslöser (Warmstart, Kaltstart, Stopp, Diagnose, Anwendungsfehler, Konfigurationsfehler) → Betriebszustand.',
            'Notiere, welche Dienste in SERVICE und welche in DIAGNOSE verfügbar sind.',
            'Ergänze, was bei einem Kaltstart zusätzlich passiert (VAR_RETAIN wird neu initialisiert, USERRAM-Datenobjekte gelöscht).'
          ],
          done: 'Erledigt, wenn deine Tabelle alle sechs Auslöser korrekt zuordnet.',
          tip: 'Merkregel: Anwendungsfehler → SERVICE, Konfigurations-/Systemfehler → DIAGNOSE.',
          link: { label: 'B&R Help: Betriebszustände', url: 'https://help.br-automation.com/#/de/6/automationruntime/operationmethode/operationmode.html' }
        }
      },
      {
        id: 'o3',
        title: 'Verstehe Taskklassen und Zykluszeit',
        guide: {
          intro: 'AR bietet bis zu acht zyklische Taskklassen (Cyclic #1 … #8), deren Zykluszeit in 1-ms-Schritten einstellbar ist. Cyclic #1 hat die höchste Priorität.',
          steps: [
            'Öffne in der Physical View die Softwarekonfiguration der CPU (Kontextmenü **Software**).',
            'Finde die Taskklassen und lies für Cyclic #1 und Cyclic #4 die eingestellte Zykluszeit ab.',
            'Verschiebe ein Programm per Drag & Drop in eine andere Taskklasse und übertrage das Projekt.',
            'Notiere, warum schnelle Regelungen in Cyclic #1 und Visualisierungslogik in einer langsamen Klasse liegen sollten.'
          ],
          done: 'Erledigt, wenn du für dein Projekt jedes Programm einer begründeten Taskklasse zugeordnet hast.',
          tip: 'Lege nicht alles in die schnellste Klasse. Jede Mikrosekunde dort fehlt allen niedriger priorisierten Klassen.',
          link: { label: 'B&R Help: Zyklische Taskklassen', url: 'https://help.br-automation.com/#/de/6/automationruntime/taskclasses/taskclasses_normal_sg4.html' }
        }
      }
    ],
    videos: [
      v('5d44GUp-mZg', 'de', 'Berufsschulvideo zu SPS-Zyklus und Reaktionszeit – Grundlage für Taskklassen.'),
      v('0ii18sjwdiY', 'en', 'Zeigt, wie Programme in Automation Studio Taskklassen zugeordnet werden.'),
      v('hsakSEhHaQg', 'de', 'Erklärt den Unterschied zwischen SPS-Zykluszeit und Buszykluszeit.')
    ],
    readings: [
      r('thmSps', 'Hochschulskript zu Zyklus, Zykluszeitüberwachung und Taskverarbeitung in SPSen.'),
      r('hOperation', 'Die verbindliche B&R-Beschreibung von Hochlaufarten und Betriebszuständen.'),
      r('hTaskClasses', 'Übersicht über die zyklischen Taskklassen der Automation Runtime.')
    ],
    quiz: [
      { type: 'single', q: 'In welchen Betriebszustand geht eine B&R-Steuerung nach einer Division durch 0 im Anwenderprogramm?',
        options: ['RUN', 'SERVICE', 'DIAGNOSE', 'BOOT'],
        correct: 1, explain: 'Zur Laufzeit erkannte Anwendungsfehler (Zykluszeitverletzung, Division durch 0 …) führen zum Hochlauf in SERVICE.' },
      { type: 'single', q: 'Was passiert bei einem Kaltstart mit VAR_RETAIN-Variablen?',
        options: ['Sie behalten ihren Wert.', 'Sie werden neu initialisiert.', 'Sie werden auf die CF-Karte geschrieben.', 'Sie werden zu permanenten Variablen.'],
        correct: 1, explain: 'Bei einem Kaltstart werden remanente Variablen neu initialisiert; beim Warmstart bleiben sie erhalten.' },
      { type: 'multi', q: 'Welche Dienste stehen im Betriebszustand SERVICE zur Verfügung?',
        options: ['Projektinstallation', 'Logbuch auslesen', 'PV-Watch', 'Zyklische Abarbeitung der Anwenderprogramme'],
        correct: [0, 1, 2], explain: 'In SERVICE läuft das Taskklassensystem nicht, alle Systemdienste sind aber verfügbar.' }
    ],
    exam: [
      { type: 'single', q: 'Eine Steuerung meldet nach dem Einschalten einen Konfigurationsfehler (falsches Modul gesteckt). In welchem Zustand landet sie?',
        options: ['RUN', 'SERVICE', 'DIAGNOSE', 'Warmstart'],
        correct: 2, explain: 'Konfigurations- und Systemfehler führen in DIAGNOSE; dort kannst du das Logbuch lesen und neu installieren.' },
      { type: 'single', q: 'Wie viele zyklische Taskklassen bietet Automation Runtime auf SG4-Zielsystemen höchstens?',
        options: ['2', '4', '8', '16'],
        correct: 2, explain: 'Cyclic #1 bis Cyclic #8.' },
      { type: 'numeric', q: 'Cyclic #1 läuft mit {T} ms. Wie oft wird ein Task dieser Klasse pro Sekunde ausgeführt?',
        params: { T: [1, 10, 1] }, formula: '1000 / T', unit: '1/s', tol: 0.01,
        explain: 'Ausführungen pro Sekunde = 1000 ms / Zykluszeit.' },
      { type: 'multi', q: 'Welche Regeln sind für eine Betriebsartenumschaltung an einer Maschine sinnvoll?',
        options: ['Umschalten nur im Stillstand', 'Mehrere gleichzeitig aktive Betriebsarten als Fehler werten', 'Unplausible Wahlschalterstellung kurz entprellen (Schalter in Zwischenstellung)', 'Bei unplausibler Stellung die zuletzt gewählte Betriebsart unbegrenzt beibehalten'],
        correct: [0, 1, 2], explain: 'Eine dauerhaft unplausible Stellung ist ein Fehler. Sie darf nicht stillschweigend ignoriert werden.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Betriebsartenumschaltung mit Plausibilität',
        task: 'Ein Wahlschalter liefert drei Kontakte: `diModeAuto`, `diModeManual`, `diModeService`. Das vorhandene Programm übernimmt die Stellung einfach in `nModeActive` (0 = keine, 1 = Automatik, 2 = Hand, 3 = Service). Erweitere es um folgende Regeln:\n\n1. **Plausibilität:** Genau ein Kontakt muss aktiv sein. Sind **keiner oder mehrere** Kontakte länger als **200 ms** aktiv bzw. inaktiv, setze `doModeFault` (gespeichert) und `nModeActive := 0`.\n2. **Zwischenstellung:** Während der Schalter kurz (< 200 ms) zwischen zwei Stellungen steht, bleibt die bisherige Betriebsart erhalten.\n3. **Stillstand:** Eine neue Betriebsart wird nur übernommen, wenn `diMachineStopped` TRUE ist. Sonst bleibt die alte aktiv und `doChangeBlocked` ist TRUE, solange die Anwahl von der aktiven Betriebsart abweicht.\n4. **Quittieren:** `doModeFault` wird nur mit einer **steigenden Flanke** an `diAck` zurückgesetzt – und nur, wenn genau ein Kontakt aktiv ist.\n\nNach dem Start ist `nModeActive` = 0, bis eine plausible Anwahl im Stillstand vorliegt.',
        hints: ['Zähle zuerst die aktiven Kontakte (`nActive`). Alles Weitere hängt davon ab.', 'Ein `TON` mit `IN := nActive <> 1` und `PT := T#200ms` erledigt Regel 1 und 2.', 'Bearbeite die Quittierung vor der Umschaltlogik, dann wird die Betriebsart im gleichen Zyklus wieder übernommen.'],
        cycleMs: 10,
        io: [
          { name: 'diModeAuto', type: 'BOOL', dir: 'in', label: 'Wahlschalter Automatik', widget: 'switch' },
          { name: 'diModeManual', type: 'BOOL', dir: 'in', label: 'Wahlschalter Hand', widget: 'switch' },
          { name: 'diModeService', type: 'BOOL', dir: 'in', label: 'Wahlschalter Service', widget: 'switch' },
          { name: 'diMachineStopped', type: 'BOOL', dir: 'in', label: 'Maschine steht', widget: 'switch' },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'nModeActive', type: 'INT', dir: 'out', label: 'Aktive Betriebsart', widget: 'value' },
          { name: 'doModeFault', type: 'BOOL', dir: 'out', label: 'Fehler Betriebsartenwahl', widget: 'led' },
          { name: 'doChangeBlocked', type: 'BOOL', dir: 'out', label: 'Umschaltung gesperrt', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\tnModeActive := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Bisheriger Stand: übernimmt die Stellung ungeprüft *)\n\tIF diModeAuto THEN\n\t\tnModeActive := 1;\n\tELSIF diModeManual THEN\n\t\tnModeActive := 2;\n\tELSIF diModeService THEN\n\t\tnModeActive := 3;\n\tEND_IF\n\t(* TODO: Plausibilität, Stillstand, Quittierung *)\nEND_PROGRAM\n',
          var: 'VAR\n\tnActive : INT;\n\tnRequested : INT;\n\tfbImplausible : TON;\n\trtAck : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\tnModeActive := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* 1. Aktive Kontakte zählen und Anwahl bestimmen *)\n\tnActive := 0;\n\tnRequested := 0;\n\tIF diModeAuto THEN nActive := nActive + 1; nRequested := 1; END_IF\n\tIF diModeManual THEN nActive := nActive + 1; nRequested := 2; END_IF\n\tIF diModeService THEN nActive := nActive + 1; nRequested := 3; END_IF\n\n\t(* 2. Plausibilität mit 200 ms Toleranz für Zwischenstellungen *)\n\tfbImplausible(IN := nActive <> 1, PT := T#200ms);\n\tIF fbImplausible.Q THEN\n\t\tdoModeFault := TRUE;\n\tEND_IF\n\n\t(* 3. Quittieren nur bei plausibler Stellung *)\n\trtAck(CLK := diAck);\n\tIF rtAck.Q AND nActive = 1 THEN\n\t\tdoModeFault := FALSE;\n\tEND_IF\n\n\t(* 4. Umschaltlogik *)\n\tIF doModeFault THEN\n\t\tnModeActive := 0;\n\t\tdoChangeBlocked := FALSE;\n\tELSIF nActive = 1 THEN\n\t\tIF nRequested <> nModeActive THEN\n\t\t\tIF diMachineStopped THEN\n\t\t\t\tnModeActive := nRequested;\n\t\t\t\tdoChangeBlocked := FALSE;\n\t\t\tELSE\n\t\t\t\tdoChangeBlocked := TRUE;\n\t\t\tEND_IF\n\t\tELSE\n\t\t\tdoChangeBlocked := FALSE;\n\t\tEND_IF\n\tEND_IF\n\t(* nActive <> 1 und noch kein Fehler: Zwischenstellung, alles bleibt *)\nEND_PROGRAM\n',
          var: 'VAR\n\tnActive : INT;\n\tnRequested : INT;\n\tfbImplausible : TON;\n\trtAck : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Automatik im Stillstand anwählen', steps: [
            { set: { diMachineStopped: true, diModeAuto: true } }, { cycles: 3 },
            { expect: 'nModeActive = 1 AND NOT doModeFault', msg: 'Plausible Anwahl im Stillstand muss übernommen werden.' }
          ]},
          { name: 'Umschalten während des Betriebs ist gesperrt', steps: [
            { set: { diMachineStopped: true, diModeAuto: true } }, { cycles: 3 },
            { set: { diMachineStopped: false } }, { cycles: 2 },
            { set: { diModeAuto: false, diModeManual: true } }, { cycles: 5 },
            { expect: 'nModeActive = 1 AND doChangeBlocked', msg: 'Bei laufender Maschine bleibt Automatik aktiv und doChangeBlocked muss TRUE sein.' },
            { set: { diMachineStopped: true } }, { cycles: 3 },
            { expect: 'nModeActive = 2 AND NOT doChangeBlocked', msg: 'Im Stillstand wird Hand übernommen und die Sperrmeldung geht weg.' }
          ]},
          { name: 'Zwischenstellung unter 200 ms ist kein Fehler', steps: [
            { set: { diMachineStopped: true, diModeAuto: true } }, { cycles: 3 },
            { set: { diModeAuto: false } }, { ms: 100 },
            { expect: 'nModeActive = 1 AND NOT doModeFault', msg: 'Kurze Zwischenstellung: alte Betriebsart bleibt, kein Fehler.' },
            { set: { diModeManual: true } }, { cycles: 3 },
            { expect: 'nModeActive = 2 AND NOT doModeFault', msg: 'Danach wird Hand übernommen.' }
          ]},
          { name: 'Zwei Kontakte gleichzeitig: Fehler, Quittieren erst wenn plausibel', steps: [
            { set: { diMachineStopped: true, diModeAuto: true, diModeManual: true } }, { ms: 300 },
            { expect: 'doModeFault AND nModeActive = 0', msg: 'Zwei aktive Kontakte länger als 200 ms sind ein Fehler; Betriebsart 0.' },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'doModeFault', msg: 'Quittieren bei weiterhin unplausibler Stellung darf den Fehler nicht löschen.' },
            { set: { diModeManual: false } }, { cycles: 3 },
            { expect: 'doModeFault', msg: 'Der Fehler ist gespeichert und braucht eine Quittierung.' },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'NOT doModeFault AND nModeActive = 1', msg: 'Nach Quittierung bei plausibler Stellung wird Automatik übernommen.' }
          ]},
          { name: 'Dauerhaft keine Stellung ist ein Fehler', steps: [
            { set: { diMachineStopped: true, diModeService: true } }, { cycles: 3 },
            { expect: 'nModeActive = 3' },
            { set: { diModeService: false } }, { ms: 400 },
            { expect: 'doModeFault AND nModeActive = 0', msg: 'Kein Kontakt länger als 200 ms aktiv: Fehler und Betriebsart 0.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'system-2-diagnose',
    level: 2,
    kind: 'lektion',
    title: 'Logger, Watch, Fehlernummern und System Diagnostics Manager',
    summary: 'Du liest das Logbuch der Steuerung, schlägst Fehlernummern nach, nutzt den SDM im Browser und baust eine eigene Fehlerhistorie mit Zeitstempel.',
    minutes: 180,
    req: ['system-2-runtime'],
    briefing: 'Der Logger zeigt Ereignisse, die Automation Runtime protokolliert: schwerwiegende Fehler (z. B. Zykluszeitverletzung), Warnungen und Systemmeldungen (Warmstart, Kaltstart). Die Einträge liegen auf der Steuerung in Logbüchern, die als Ringpuffer arbeiten – die ältesten Einträge werden überschrieben. Jede Fehlernummer ist in der Hilfe unter "Automation Runtime Systemfehler" mit Kurztext, Beschreibung und Behebungsvorschlag dokumentiert. Der System Diagnostics Manager (SDM) bietet ähnliche Informationen ganz ohne Automation Studio im Webbrowser unter `http://<IP-Adresse>/sdm`: Hardwarebaum, Softwaremodule, Logbücher, I/O-Zustände und den System Dump. Zusätzlich lernst du, eine eigene Fehlerhistorie im Programm zu führen – denn das Logbuch kennt deine Maschinenfehler nicht.',
    practice: 'Beim Kunden hast du oft nur einen Laptop mit Browser. Mit dem SDM ziehst du einen System Dump, schickst ihn an die Entwicklung und sparst dir eine zweite Anreise.',
    transfer: {
      tia: 'Das Gegenstück ist der Diagnosepuffer der S7-CPU (Online & Diagnose) und der Webserver der CPU. Fehlernummern schlägst du in der TIA-Hilfe bzw. im Diagnosepuffer-Text nach.',
      codesys: 'CODESYS hat das SPS-Logbuch (Gerät › Log) und optional den Webserver; TwinCAT protokolliert ins Windows-Ereignisprotokoll bzw. die TwinCAT-Meldungsanzeige (Logger-Fenster).'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lies und filtere das Logbuch',
        guide: {
          intro: 'Den Logger öffnest du bei bestehender Online-Verbindung. Er liest die Logbücher der Steuerung aus und zeigt sie als Liste.',
          steps: [
            'Stelle die Online-Verbindung her (ARsim genügt).',
            'Öffne den Logger über **Öffnen › Logger**.',
            'Lass die Logbücher auslesen und sortiere nach Zeitstempel.',
            'Löse über **Online › Dienste › Warmstart** einen Warmstart aus und lies die Logbücher erneut aus – finde den Eintrag des Warmstarts.',
            'Exportiere die Einträge zu Archivierungszwecken über die Exportfunktion des Loggers.'
          ],
          done: 'Erledigt, wenn du den Warmstart-Eintrag mit Zeitstempel gefunden und eine Exportdatei erzeugt hast.',
          tip: 'Lies das Logbuch immer, bevor du neu startest oder neu installierst – Ringpuffer verzeihen keine Ungeduld.',
          link: { label: 'B&R Help: Logger', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/logger/diagnosis_logger.html' }
        }
      },
      {
        id: 'o2',
        title: 'Schlage eine Fehlernummer nach',
        guide: {
          intro: 'Jede AR-Fehlerseite hat denselben Aufbau: Fehlernummer, Fehlerkonstante, Kurztext, Beschreibung, Behebungsvorschlag, Reaktion der Komponente.',
          steps: [
            'Markiere im Logger einen Fehlereintrag und drücke **F1** bzw. nutze die Suche der B&R-Hilfe mit der Fehlernummer.',
            'Öffne zum Üben in der Hilfe den Bereich **9200 – 9299 AR-Neustartgründe** und lies Fehler 9204.',
            'Notiere Kurztext und Behebungsvorschlag in deinem Diagnoseprotokoll.',
            'Formuliere in einem Satz, welche Maßnahme du vor Ort als Erstes prüfen würdest.'
          ],
          done: 'Erledigt, wenn dein Protokoll Nummer, Kurztext, Ursache und erste Maßnahme für einen Fehler enthält.',
          tip: 'Fehlernummern werden oft hexadezimal und dezimal angegeben (z. B. 9204 = 16#23F4). Suche im Zweifel mit beiden.',
          link: { label: 'B&R Help: Automation Runtime Systemfehler', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/sys_error/files/sys_error.htm' }
        }
      },
      {
        id: 'o3',
        title: 'Diagnostiziere mit dem System Diagnostics Manager',
        guide: {
          intro: 'Der SDM läuft auf der Steuerung und wird mit einem Webbrowser aufgerufen. Er muss im Projekt aktiviert sein.',
          steps: [
            'Prüfe in der Systemkonfiguration der CPU, dass Webserver und SDM aktiviert sind, und übertrage das Projekt.',
            'Öffne im Browser `http://<IP-Adresse>/sdm` (bei ARsim: die lokale Adresse der Simulation).',
            'Navigiere durch Hardware, Software und Logbücher und vergleiche mit dem Logger in AS6.',
            'Erstelle über die SDM-Seite **System Dump** einen Dump und lade ihn herunter.',
            'Nutze den Browser im privaten Modus, damit keine veralteten Werte aus dem Cache angezeigt werden.'
          ],
          done: 'Erledigt, wenn du einen System Dump als Datei gespeichert hast.',
          tip: 'Ein System Dump enthält Logbücher, Hardware- und Softwarestände in einer Datei – genau das, was der Support zuerst fragt.',
          link: { label: 'B&R Help: Zugriff auf den SDM', url: 'https://help.br-automation.com/#/de/6/automationruntime/targets/sdm/sdm/sdm_access.htm' }
        }
      },
      {
        id: 'o4',
        title: 'Nutze den Watch zum Ändern und Forcen',
        guide: {
          intro: 'Im Variablenmonitor kannst du Werte ändern und I/O-Variablen forcen (zwangssetzen). Forcen hält den Kanalwert fest, auch wenn das Programm etwas anderes schreibt.',
          steps: [
            'Öffne den Watch eines Programms und füge eine I/O-Variable hinzu.',
            'Ändere einen Wert per Doppelklick in der Wertspalte.',
            'Aktiviere für einen Ausgang **Online › Forcen › Forcen Ein** und beobachte den Kanal.',
            'Hebe das Forcen mit **Online › Forcen › Forcen Global Aus** vollständig auf.'
          ],
          done: 'Erledigt, wenn du einen Ausgang geforct und das Forcen anschließend global aufgehoben hast.',
          tip: 'Forcen an einer realen Maschine nur mit Absprache und gesicherter Anlage. Vergessenes Forcen ist eine klassische Fehlerquelle.',
          link: { label: 'B&R Help: Variablenmonitor (Watch)', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/watch/diagnosis_watch.html' }
        }
      }
    ],
    videos: [
      v('XQqSW2CU0Qw', 'en', 'Zeigt den Logger in Automation Studio an einem Basisbeispiel.'),
      v('bAM8wtVAyLE', 'de', 'Deutschsprachige Einführung in Watch, Trace und Debugger.'),
      v('IbUOaG-2ZRU', 'en', 'Präsentation des System Diagnostics Manager (Browser-Diagnose ohne Engineering-Tool).')
    ],
    readings: [
      r('elektroAnl4', 'Der Ausbildungsrahmenplan verlangt ausdrücklich "Testsoftware und Diagnosesysteme einsetzen" – hier steht, was geprüft wird.'),
      r('hLogger', 'Offizielle Beschreibung des Loggers und der Logbücher als Ringpuffer.'),
      r('hSdm', 'Diagnosemöglichkeiten des SDM im Überblick.')
    ],
    quiz: [
      { type: 'single', q: 'Unter welcher URL erreichst du die SVG-Seiten des SDM?',
        options: ['http://<IP>/diag', 'http://<IP>/sdm', 'http://<IP>:11160', 'https://help.br-automation.com/sdm'],
        correct: 1, explain: 'Die SDM-SVG-Seiten liegen unter http://<IP-Adresse>/sdm.' },
      { type: 'single', q: 'Was passiert, wenn ein Logbuch voll ist?',
        options: ['Die Steuerung geht in SERVICE.', 'Neue Einträge werden verworfen.', 'Die ältesten Einträge werden überschrieben (Ringpuffer).', 'Das Logbuch wird auf die CF-Karte ausgelagert.'],
        correct: 2, explain: 'Logbücher arbeiten als Ringpuffer.' },
      { type: 'multi', q: 'Welche Informationen findest du auf einer AR-Fehlerseite der Hilfe?',
        options: ['Fehlerkonstante', 'Behebungsvorschlag', 'Reaktion der Komponente', 'Name des Programmierers'],
        correct: [0, 1, 2], explain: 'Aufbau: Nummer, Konstante, Kurztext, Beschreibung, Behebungsvorschlag, Reaktion.' }
    ],
    exam: [
      { type: 'single', q: 'Warum führst du zusätzlich zum AR-Logbuch eine eigene Fehlerhistorie im Anwenderprogramm?',
        options: ['Weil das Logbuch nur auf ARsim funktioniert', 'Weil das AR-Logbuch die maschinenspezifischen Fehler (z. B. "Teil fehlt") nicht kennt', 'Weil Logbücher keinen Zeitstempel haben', 'Weil Fehlernummern geheim sind'],
        correct: 1, explain: 'AR protokolliert System- und Laufzeitereignisse. Prozess- und Maschinenfehler musst du selbst erfassen (z. B. mit ArEventLog oder mapp AlarmX).' },
      { type: 'single', q: 'Was enthält ein System Dump typischerweise?',
        options: ['Nur das Anwenderprogramm im Quelltext', 'Logbücher, Hardware- und Softwarestände der Steuerung', 'Die Lizenzschlüssel', 'Das Windows-Ereignisprotokoll des Service-PCs'],
        correct: 1, explain: 'Der Dump fasst Systemzustand, Module, Versionen und Logbücher zusammen.' },
      { type: 'single', q: 'Warum soll der Browser für den SDM im privaten Modus laufen?',
        options: ['Aus Datenschutzgründen', 'Damit keine zwischengespeicherten, veralteten Werte angezeigt werden', 'Weil der SDM sonst nicht startet', 'Damit die Lizenz geprüft wird'],
        correct: 1, explain: 'Laut B&R-Hilfe können sonst veraltete Werte aus dem Cache erscheinen.' },
      { type: 'single', q: 'Eine Fehlerhistorie mit 5 Einträgen speichert den neuesten Eintrag immer an Index 0. Was passiert beim 6. Fehler?',
        options: ['Der neueste wird verworfen.', 'Alle Einträge rücken um eins nach hinten, der älteste fällt heraus.', 'Die Historie wird gelöscht.', 'Index 5 wird geschrieben.'],
        correct: 1, explain: 'Beim Schieberegister-Prinzip rücken alle Einträge nach, der älteste geht verloren.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Fehlerhistorie mit Zeitstempel',
        task: 'Die Maschine meldet ihren aktuellen Fehler als Code `nErrorCode` (UINT, 0 = kein Fehler). Die Simulation liefert eine Systemzeit `gnTimeMs` (DINT, ms seit Start, +10 je Zyklus).\n\nFühre eine Historie der **letzten 5 Fehler** in `aHist : ARRAY[0..4] OF stHistEntry` (Typ in `Types.typ`: `nCode : UINT; nTime : DINT;`):\n\n1. Ein Eintrag entsteht, wenn sich `nErrorCode` gegenüber dem letzten Zyklus ändert **und** der neue Wert ≠ 0 ist. Ein anstehender Fehler erzeugt nur **einen** Eintrag.\n2. Der **neueste** Eintrag steht immer in `aHist[0]`; ältere rücken nach hinten, der älteste fällt bei vollem Speicher heraus.\n3. `nHistCount` = Anzahl gültiger Einträge (max. 5), `nTotalErrors` (UDINT) = Gesamtzahl aller erfassten Fehler (wird **nicht** begrenzt).\n4. Steigende Flanke an `diClear` löscht die Historie (`nHistCount := 0`, alle Einträge 0). `nTotalErrors` bleibt erhalten.',
        hints: ['Merke dir den Code des letzten Zyklus in `nLastCode`.', 'Schieben: `FOR i := 4 TO 1 BY -1 DO aHist[i].nCode := aHist[i-1].nCode; aHist[i].nTime := aHist[i-1].nTime; END_FOR`'],
        cycleMs: 10,
        io: [
          { name: 'nErrorCode', type: 'UINT', dir: 'in', label: 'Aktueller Fehlercode', widget: 'slider', min: 0, max: 999 },
          { name: 'diClear', type: 'BOOL', dir: 'in', label: 'Historie löschen', widget: 'button' },
          { name: 'gnTimeMs', type: 'DINT', dir: 'in', label: 'Systemzeit', widget: 'value', unit: 'ms' },
          { name: 'nHistCount', type: 'INT', dir: 'out', label: 'Einträge in der Historie', widget: 'value' },
          { name: 'nTotalErrors', type: 'UDINT', dir: 'out', label: 'Fehler gesamt', widget: 'value' }
        ],
        plant: {
          var: 'VAR\nEND_VAR\n',
          code: 'gnTimeMs := gnTimeMs + 10;'
        },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: neuen Fehler erkennen, Historie schieben, Löschen *)\n\nEND_PROGRAM\n',
          var: 'VAR\n\taHist : ARRAY[0..4] OF stHistEntry;\n\tnLastCode : UINT;\n\ti : INT;\n\trtClear : R_TRIG;\nEND_VAR\n',
          typ: 'TYPE\n\tstHistEntry : STRUCT\n\t\tnCode : UINT;\n\t\tnTime : DINT;\n\tEND_STRUCT;\nEND_TYPE\n'
        },
        solution: {
          main: 'PROGRAM _INIT\n\tnHistCount := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Löschen *)\n\trtClear(CLK := diClear);\n\tIF rtClear.Q THEN\n\t\tFOR i := 0 TO 4 DO\n\t\t\taHist[i].nCode := 0;\n\t\t\taHist[i].nTime := 0;\n\t\tEND_FOR\n\t\tnHistCount := 0;\n\tEND_IF\n\n\t(* Neuer Fehler? *)\n\tIF (nErrorCode <> nLastCode) AND (nErrorCode <> 0) THEN\n\t\tFOR i := 4 TO 1 BY -1 DO\n\t\t\taHist[i].nCode := aHist[i - 1].nCode;\n\t\t\taHist[i].nTime := aHist[i - 1].nTime;\n\t\tEND_FOR\n\t\taHist[0].nCode := nErrorCode;\n\t\taHist[0].nTime := gnTimeMs;\n\t\tIF nHistCount < 5 THEN\n\t\t\tnHistCount := nHistCount + 1;\n\t\tEND_IF\n\t\tnTotalErrors := nTotalErrors + 1;\n\tEND_IF\n\tnLastCode := nErrorCode;\nEND_PROGRAM\n',
          var: 'VAR\n\taHist : ARRAY[0..4] OF stHistEntry;\n\tnLastCode : UINT;\n\ti : INT;\n\trtClear : R_TRIG;\nEND_VAR\n',
          typ: 'TYPE\n\tstHistEntry : STRUCT\n\t\tnCode : UINT;\n\t\tnTime : DINT;\n\tEND_STRUCT;\nEND_TYPE\n'
        },
        tests: [
          { name: 'Ein neuer Fehler erzeugt einen Eintrag', steps: [
            { cycles: 2 },
            { set: { nErrorCode: 101 } }, { cycles: 2 },
            { expect: 'nHistCount = 1 AND aHist[0].nCode = 101 AND nTotalErrors = 1', msg: 'Fehler 101 muss genau einmal in aHist[0] stehen.' }
          ]},
          { name: 'Anstehender Fehler wird nur einmal erfasst', steps: [
            { set: { nErrorCode: 101 } }, { ms: 500 },
            { expect: 'nHistCount = 1 AND nTotalErrors = 1', msg: 'Solange derselbe Code ansteht, darf kein weiterer Eintrag entstehen.' }
          ]},
          { name: 'Neuester Eintrag steht vorne', steps: [
            { set: { nErrorCode: 101 } }, { cycles: 3 },
            { set: { nErrorCode: 0 } }, { cycles: 3 },
            { set: { nErrorCode: 202 } }, { cycles: 3 },
            { set: { nErrorCode: 303 } }, { cycles: 3 },
            { expect: 'aHist[0].nCode = 303 AND aHist[1].nCode = 202 AND aHist[2].nCode = 101', msg: 'Reihenfolge muss neu → alt sein: 303, 202, 101.' },
            { expect: 'nHistCount = 3', msg: 'Der Wechsel auf 0 erzeugt keinen Eintrag.' }
          ]},
          { name: 'Zeitstempel stimmt', steps: [
            { ms: 1000 },
            { set: { nErrorCode: 55 } }, { cycles: 1 },
            { expect: 'aHist[0].nTime >= 1000 AND aHist[0].nTime <= 1030', msg: 'Der Zeitstempel muss die Systemzeit beim Auftreten (≈ 1000 ms) enthalten.' }
          ]},
          { name: 'Volle Historie: ältester fällt heraus', steps: [
            { set: { nErrorCode: 1 } }, { cycles: 2 },
            { set: { nErrorCode: 2 } }, { cycles: 2 },
            { set: { nErrorCode: 3 } }, { cycles: 2 },
            { set: { nErrorCode: 4 } }, { cycles: 2 },
            { set: { nErrorCode: 5 } }, { cycles: 2 },
            { set: { nErrorCode: 6 } }, { cycles: 2 },
            { set: { nErrorCode: 7 } }, { cycles: 2 },
            { expect: 'nHistCount = 5 AND nTotalErrors = 7', msg: 'Maximal 5 Einträge, aber 7 Fehler gesamt.' },
            { expect: 'aHist[0].nCode = 7 AND aHist[4].nCode = 3', msg: 'Neuester (7) vorne, ältester verbliebener (3) hinten.' }
          ]},
          { name: 'Historie löschen', steps: [
            { set: { nErrorCode: 11 } }, { cycles: 2 },
            { set: { nErrorCode: 12 } }, { cycles: 2 },
            { set: { diClear: true } }, { cycles: 2 }, { set: { diClear: false } }, { cycles: 2 },
            { expect: 'nHistCount = 0 AND aHist[0].nCode = 0 AND aHist[1].nCode = 0', msg: 'Nach dem Löschen muss die Historie leer sein.' },
            { expect: 'nTotalErrors = 2', msg: 'Der Gesamtzähler bleibt beim Löschen erhalten.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'system-2-speicher',
    level: 2,
    kind: 'projekt',
    title: 'Praxisprojekt: Speicherarten, Retain- und Permanent-Variablen',
    summary: 'Du deklarierst remanente und permanente Variablen, prüfst ihr Verhalten bei Warm- und Kaltstart und baust einen Stückzähler, der Speicherfehler erkennt.',
    minutes: 210,
    req: ['system-2-runtime'],
    briefing: 'Steuerungen verwenden verschiedene Speicher: DRAM (schnell, flüchtig), batteriegepuffertes SRAM und Flash (z. B. CompactFlash) für Betriebssystem und Anwendung. Für Variablen bedeutet das: Normale Variablen werden bei jedem Hochlauf initialisiert. **Remanente** Variablen (`VAR RETAIN`) behalten ihren Wert beim Warmstart, verlieren ihn aber beim Kaltstart. **Permanente** Variablen liegen im kaltstartsicheren Bereich und überstehen auch einen Kaltstart; sie werden in der Configuration View in der Datei `CPU.per` eingetragen. Die Speichergröße für beide Bereiche stellst du in der CPU-Konfiguration ein. Weil Puffer leer werden können und Software-Updates Datenstrukturen verändern, sichert robuste Software ihre Daten zusätzlich ab – zum Beispiel mit einer Inverskopie und einer Sicherungskopie.',
    practice: 'Stückzähler, Betriebsstunden, Kalibrierwerte: Gehen sie nach einem Batteriewechsel verloren, gibt es Ärger mit Kunde und Qualitätssicherung. Wer erkennt, dass Daten ungültig sind, kann sie aus einer Sicherung wiederherstellen und das melden.',
    transfer: {
      tia: 'In TIA entspricht das dem Attribut "Remanenz" im DB bzw. "Speicherremanent". Einen separaten kaltstartsicheren Bereich wie B&R-permanent gibt es so nicht; Rezepturen liegen dort oft in Ladespeicher-DBs.',
      codesys: 'CODESYS kennt `VAR RETAIN` und `VAR PERSISTENT` (übersteht auch Reset kalt); in TwinCAT werden PERSISTENT-Daten beim regulären Herunterfahren in eine Datei geschrieben.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Deklariere eine remanente Variable und stelle den Speicher ein',
        guide: {
          intro: 'Remanente Variablen werden nach IEC 61131-3 mit RETAIN gekennzeichnet. Das Attribut gilt für den ganzen Deklarationsabschnitt bis END_VAR.',
          steps: [
            'Öffne die `.var`-Datei deines Programms im Texteditor.',
            'Lege einen eigenen Abschnitt an: `VAR RETAIN nPartsRetain : UDINT; END_VAR`.',
            'Öffne die CPU-Konfiguration und stelle unter **Speicher › PV Speicher › Remanente globale PVs** die benötigte Größe ein (für globale Variablen).',
            'Kompiliere (F7), übertrage (Strg+F5) und lasse den Zähler im Watch hochzählen.'
          ],
          code: { lang: 'var', text: 'VAR RETAIN\n\tnPartsRetain : UDINT;\nEND_VAR' },
          done: 'Erledigt, wenn die Variable im Watch sichtbar ist und der Build fehlerfrei ist.',
          tip: 'Lege nur ab, was wirklich remanent sein muss. Jede remanente Variable wird gepuffert und muss bei Updates mitgedacht werden.',
          link: { label: 'B&R Help: Remanente Variablen', url: 'https://help.br-automation.com/#/de/6/programming/variables/retainvariables_remanentevariablen.html' }
        }
      },
      {
        id: 'o2',
        title: 'Lege eine permanente Variable an',
        guide: {
          intro: 'Permanente Variablen sind remanente globale Variablen, die zusätzlich in der Datei CPU.per der Konfiguration eingetragen werden.',
          steps: [
            'Deklariere in `Global.var` eine remanente globale Variable, z. B. `gnPartsBackup : UDINT;` in einem `VAR RETAIN`-Abschnitt.',
            'Öffne in der Configuration View (Strg+Alt+C) die Datei `CPU.per` per Doppelklick.',
            'Füge mit **Einf** die Variable hinzu und vergib einen Offset (oder nutze **Offsets neu berechnen** – Vorsicht bei bestehenden Anlagen).',
            'Stelle in der CPU-Konfiguration unter **Speicher › PV Speicher › Permanente PVs** die Größe ein und übertrage das Projekt.'
          ],
          done: 'Erledigt, wenn die Variable in CPU.per eingetragen und das Projekt übertragen ist.',
          tip: 'Ändere Offsets permanenter Variablen in einer laufenden Anlage nie ohne Migrationsplan – sonst liest das neue Programm alte Daten an falscher Stelle.',
          link: { label: 'B&R Help: Permanente Variablen', url: 'https://help.br-automation.com/#/de/6/programming/variables/retainvariables_permanentevariablen.html' }
        }
      },
      {
        id: 'o3',
        title: 'Prüfe das Verhalten bei Warm- und Kaltstart',
        guide: {
          intro: 'Die Theorie überprüfst du mit einem kleinen Versuch: drei Zähler, drei Speicherarten.',
          steps: [
            'Lege drei Zähler an: normal (`VAR`), remanent (`VAR RETAIN`), permanent (über `CPU.per`). Alle drei zählen dieselben Impulse.',
            'Führe einen **Warmstart** aus und notiere alle drei Werte.',
            'Führe einen **Kaltstart** aus und notiere erneut.',
            'Vergleiche mit der Tabelle in der Hilfe und erkläre Abweichungen (ARsim unterstützt nicht jede Speicherart wie echte Hardware).'
          ],
          done: 'Erledigt, wenn dein Versuchsprotokoll für alle drei Speicherarten das Verhalten bei Warm- und Kaltstart zeigt.',
          tip: 'Permanente Variablen werden nicht auf allen Zielsystemen unterstützt. Prüfe das Datenblatt der CPU.'
        }
      },
      {
        id: 'o4',
        title: 'Programmiere den abgesicherten Stückzähler und reiche den Nachweis ein',
        guide: {
          intro: 'Die Übung bildet die Absicherung remanenter Daten in Software nach. Auf der echten Steuerung ersetzt du die Simulation durch echte RETAIN-/permanente Variablen.',
          steps: [
            'Löse die Übung dieses Moduls im Browser, bis alle Tests grün sind.',
            'Übertrage die Lösung in dein AS6-Projekt; deklariere `gnPartsRetain`, `gnPartsInv` remanent und `gnPartsBackup` permanent.',
            'Simuliere einen Datenverlust, indem du im Watch `gnPartsInv` verfälschst, und führe einen Warmstart aus. Prüfe, dass `doRestored` kommt.',
            'Lege Projekt und Versuchsprotokoll im Repository auf git.breitner.de ab und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link mit Projekt und Protokoll eingereicht ist.',
          tip: 'Die Inverskopie (Wert und bitweises Komplement) ist ein einfacher, schneller Konsistenztest. Für Strukturen nimmst du eine Prüfsumme (z. B. CRC).'
        }
      }
    ],
    videos: [
      v('NZF8LRcbRRo', 'en', 'Zeigt remanente und permanente Variablen direkt in Automation Studio.'),
      v('W-SGX49QNH4', 'de', 'Erklärt remanente Variablen auf Deutsch am Beispiel CODESYS – hilfreich für den Vergleich.'),
      v('IXIY07RsuTE', 'de', 'Deutschsprachiges Beispiel zu Retain- und Persistent-Variablen in Structured Text.')
    ],
    readings: [
      r('thmSps', 'Das Hochschulskript erklärt remanente und nicht remanente Datenbereiche im Aufbau einer SPS.'),
      r('hMemory', 'B&R-Übersicht über DRAM, SRAM und Flash und deren Verwendung.'),
      r('hPermanent', 'Schritt für Schritt: permanente Variablen mit CPU.per und Speichergröße.')
    ],
    quiz: [
      { type: 'single', q: 'Welche Variable überlebt bei B&R einen Kaltstart?',
        options: ['Normale VAR-Variable', 'VAR RETAIN ohne CPU.per-Eintrag', 'Permanente Variable (CPU.per)', 'Keine'],
        correct: 2, explain: 'Permanente Variablen bleiben bei Warm- und Kaltstart erhalten; RETAIN nur beim Warmstart.' },
      { type: 'single', q: 'Worauf bezieht sich das Attribut RETAIN in einer .var-Datei?',
        options: ['Nur auf die nächste Zeile', 'Auf den gesamten Deklarationsabschnitt bis END_VAR', 'Auf alle Variablen des Projekts', 'Nur auf Strukturen'],
        correct: 1, explain: 'RETAIN gilt für den ganzen Abschnitt.' },
      { type: 'single', q: 'Ein Zähler steht auf 500, seine Inverskopie müsste 16#FFFFFFFF − 500 sein, ist aber 123. Was schließt du?',
        options: ['Alles in Ordnung', 'Die remanenten Daten sind inkonsistent und dürfen nicht ungeprüft verwendet werden', 'Die CPU ist defekt', 'Die Taskklasse ist zu langsam'],
        correct: 1, explain: 'Wert und Inverskopie passen nicht zusammen – die Daten sind verfälscht (z. B. Pufferausfall).' }
    ],
    exam: [
      { type: 'single', q: 'Wo stellst du die Speichergröße für remanente globale Variablen ein?',
        options: ['In der Logical View', 'In der CPU-Konfiguration unter Speicher › PV Speicher', 'Im Logger', 'In Extras › Upgrades'],
        correct: 1, explain: 'Speicher › PV Speicher › Remanente globale PVs bzw. Permanente PVs.' },
      { type: 'multi', q: 'Was solltest du vor einem Software-Update an einer B&R-Steuerung sichern?',
        options: ['Remanente Prozessvariablen (Zähler, Kalibrierwerte)', 'Daten in nichtflüchtigen Bereichen, die das System nicht automatisch sichert', 'Den Bildschirmschoner des Service-PCs', 'Benutzerdateien auf der Steuerung'],
        correct: [0, 1, 3], explain: 'Die B&R-Community-Richtlinie nennt remanente PVs, NON_VOLATILE-Bereiche und Dateien als kritische Daten.' },
      { type: 'single', q: 'Warum führst du eine Konsistenzprüfung remanenter Daten im ersten Zyklus durch und nicht später?',
        options: ['Weil später keine Zeit mehr ist', 'Damit keine Logik mit ungeprüften Daten arbeitet, bevor sie validiert sind', 'Weil der erste Zyklus länger dauern darf', 'Das ist egal'],
        correct: 1, explain: 'Validierung vor Verwendung: Ungültige Daten dürfen keine Aktion auslösen.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Retain-Stückzähler mit Konsistenzprüfung',
        task: 'Die globalen Variablen `gnPartsRetain`, `gnPartsInv` (remanent) und `gnPartsBackup` (permanent) bilden den Speicher eines Stückzählers nach. Die Tests setzen diese Werte vor dem ersten Zyklus, als ob die Steuerung gerade hochläuft.\n\n1. **Zählen:** Jede steigende Flanke an `diPartSensor` erhöht `gnPartsRetain` um 1. Danach gilt immer `gnPartsInv = INV_BASE − gnPartsRetain` mit `INV_BASE : UDINT := 4294967295` (16#FFFFFFFF).\n2. **Sicherung:** Immer wenn `gnPartsRetain` nach dem Zählen ein Vielfaches von 10 ist, kopiere den Wert nach `gnPartsBackup`.\n3. **Konsistenzprüfung im ersten Zyklus:** Führe die Prüfung im ersten Durchlauf von `_CYCLIC` aus (Merker `bInitDone`). Ist `gnPartsInv <> INV_BASE − gnPartsRetain`, übernimm `gnPartsBackup`, berechne die Inverskopie neu und setze `doRestored` (gespeichert).\n4. **Rücksetzen:** Steigende Flanke an `diResetBtn` **bei aktivem Schlüsselschalter** `diResetKey` setzt Zähler und Sicherung auf 0 (Inverskopie anpassen). Jede steigende Flanke an `diResetBtn` quittiert außerdem `doRestored`.\n\n*In AS6 deklarierst du die Variablen als `VAR RETAIN` bzw. trägst sie in `CPU.per` ein.*',
        hints: ['`IF NOT bInitDone THEN … bInitDone := TRUE; END_IF` steht ganz oben in `_CYCLIC`.', 'Vielfaches von 10: `gnPartsRetain MOD 10 = 0`.'],
        cycleMs: 10,
        io: [
          { name: 'diPartSensor', type: 'BOOL', dir: 'in', label: 'Teilesensor B1', widget: 'button' },
          { name: 'diResetKey', type: 'BOOL', dir: 'in', label: 'Schlüsselschalter Reset', widget: 'switch' },
          { name: 'diResetBtn', type: 'BOOL', dir: 'in', label: 'Taster Reset/Quittieren', widget: 'button' },
          { name: 'gnPartsRetain', type: 'UDINT', dir: 'out', label: 'Stückzahl (RETAIN)', widget: 'value' },
          { name: 'gnPartsInv', type: 'UDINT', dir: 'out', label: 'Inverskopie (RETAIN)', widget: 'value', init: 4294967295 },
          { name: 'gnPartsBackup', type: 'UDINT', dir: 'out', label: 'Sicherung (permanent)', widget: 'value' },
          { name: 'doRestored', type: 'BOOL', dir: 'out', label: 'Daten wiederhergestellt', widget: 'led' }
        ],
        scene: { type: 'conveyor', bind: { sensor: 'diPartSensor', count: 'gnPartsRetain' } },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO 1: Konsistenzprüfung im ersten Zyklus *)\n\n\t(* TODO 2: Zählen + Inverskopie + Sicherung *)\n\n\t(* TODO 3: Reset und Quittierung *)\n\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tINV_BASE : UDINT := 4294967295;\nEND_VAR\nVAR\n\tbInitDone : BOOL;\n\trtPart : R_TRIG;\n\trtReset : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* 1: Konsistenzprüfung im ersten Zyklus *)\n\tIF NOT bInitDone THEN\n\t\tIF gnPartsInv <> INV_BASE - gnPartsRetain THEN\n\t\t\tgnPartsRetain := gnPartsBackup;\n\t\t\tgnPartsInv := INV_BASE - gnPartsRetain;\n\t\t\tdoRestored := TRUE;\n\t\tEND_IF\n\t\tbInitDone := TRUE;\n\tEND_IF\n\n\t(* 2: Zählen, Inverskopie, Sicherung *)\n\trtPart(CLK := diPartSensor);\n\tIF rtPart.Q THEN\n\t\tgnPartsRetain := gnPartsRetain + 1;\n\t\tgnPartsInv := INV_BASE - gnPartsRetain;\n\t\tIF gnPartsRetain MOD 10 = 0 THEN\n\t\t\tgnPartsBackup := gnPartsRetain;\n\t\tEND_IF\n\tEND_IF\n\n\t(* 3: Reset und Quittierung *)\n\trtReset(CLK := diResetBtn);\n\tIF rtReset.Q THEN\n\t\tdoRestored := FALSE;\n\t\tIF diResetKey THEN\n\t\t\tgnPartsRetain := 0;\n\t\t\tgnPartsBackup := 0;\n\t\t\tgnPartsInv := INV_BASE;\n\t\tEND_IF\n\tEND_IF\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tINV_BASE : UDINT := 4294967295;\nEND_VAR\nVAR\n\tbInitDone : BOOL;\n\trtPart : R_TRIG;\n\trtReset : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Teile zählen mit Inverskopie', steps: [
            { cycles: 2 },
            { set: { diPartSensor: true } }, { cycles: 2 }, { set: { diPartSensor: false } }, { cycles: 2 },
            { set: { diPartSensor: true } }, { cycles: 2 }, { set: { diPartSensor: false } }, { cycles: 2 },
            { set: { diPartSensor: true } }, { cycles: 2 }, { set: { diPartSensor: false } }, { cycles: 2 },
            { expect: 'gnPartsRetain = 3', msg: 'Drei Flanken = drei Teile (Flanke, nicht Pegel zählen).' },
            { expect: 'gnPartsInv = 4294967292', msg: 'Die Inverskopie muss INV_BASE − 3 sein.' },
            { expect: 'NOT doRestored', msg: 'Bei konsistentem Start darf keine Wiederherstellung gemeldet werden.' }
          ]},
          { name: 'Sicherung bei jedem 10. Teil', steps: [
            { set: { gnPartsRetain: 8, gnPartsInv: 4294967287, gnPartsBackup: 0 } }, { cycles: 2 },
            { set: { diPartSensor: true } }, { cycles: 2 }, { set: { diPartSensor: false } }, { cycles: 2 },
            { expect: 'gnPartsRetain = 9 AND gnPartsBackup = 0', msg: 'Bei 9 Teilen noch keine Sicherung.' },
            { set: { diPartSensor: true } }, { cycles: 2 }, { set: { diPartSensor: false } }, { cycles: 2 },
            { set: { diPartSensor: true } }, { cycles: 2 }, { set: { diPartSensor: false } }, { cycles: 2 },
            { expect: 'gnPartsRetain = 11 AND gnPartsBackup = 10', msg: 'Bei 10 Teilen muss gesichert worden sein, bei 11 nicht erneut.' }
          ]},
          { name: 'Konsistente Daten bleiben beim Hochlauf erhalten', steps: [
            { set: { gnPartsRetain: 500, gnPartsInv: 4294966795, gnPartsBackup: 490 } }, { cycles: 3 },
            { expect: 'gnPartsRetain = 500 AND NOT doRestored', msg: 'Konsistente Daten dürfen nicht überschrieben werden.' }
          ]},
          { name: 'Verfälschte Daten werden aus der Sicherung geholt', steps: [
            { set: { gnPartsRetain: 500, gnPartsInv: 123, gnPartsBackup: 490 } }, { cycles: 3 },
            { expect: 'gnPartsRetain = 490 AND doRestored', msg: 'Bei inkonsistenter Inverskopie muss die Sicherung (490) übernommen und doRestored gesetzt werden.' },
            { expect: 'gnPartsInv = 4294966805', msg: 'Nach der Wiederherstellung muss die Inverskopie zum Wert passen.' },
            { set: { diResetBtn: true } }, { cycles: 2 }, { set: { diResetBtn: false } }, { cycles: 2 },
            { expect: 'NOT doRestored AND gnPartsRetain = 490', msg: 'Reset-Taster ohne Schlüssel quittiert nur die Meldung.' }
          ]},
          { name: 'Rücksetzen nur mit Schlüsselschalter', steps: [
            { set: { gnPartsRetain: 25, gnPartsInv: 4294967270, gnPartsBackup: 20 } }, { cycles: 2 },
            { set: { diResetBtn: true } }, { cycles: 2 }, { set: { diResetBtn: false } }, { cycles: 2 },
            { expect: 'gnPartsRetain = 25', msg: 'Ohne Schlüsselschalter darf nicht zurückgesetzt werden.' },
            { set: { diResetKey: true } }, { cycles: 1 },
            { set: { diResetBtn: true } }, { cycles: 2 }, { set: { diResetBtn: false } }, { cycles: 2 },
            { expect: 'gnPartsRetain = 0 AND gnPartsBackup = 0 AND gnPartsInv = 4294967295', msg: 'Mit Schlüssel: Zähler, Sicherung und Inverskopie zurücksetzen.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Datenhüter'
  }
];
