// Bereich "system" – Level 4 (Engineer → Prüfung Master)
'use strict';
const { v } = require('./videos');
const { r } = require('./readings');

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'system-4-varianten',
    level: 4,
    kind: 'lektion',
    title: 'Konfigurationen, Maschinenvarianten und Software-Update im Feld',
    summary: 'Du verwaltest mehrere Configurations in einem Projekt, prüfst zur Laufzeit, ob die Hardware zur Variante passt, und migrierst remanente Daten sicher bei einem Software-Update.',
    minutes: 240,
    req: ['system-3-supervisor'],
    briefing: 'Ein Maschinenbauer liefert selten genau eine Maschine. Basis, Heizungsoption, Achsoption – jede Variante hat andere Hardware. In Automation Studio bildest du das mit **mehreren Konfigurationen** in der Configuration View ab: Die Logical View (Programme) teilen sich alle, Hardware, Softwarezuordnung, I/O-Mapping und permanente Variablen sind je Konfiguration. Nur die **aktive** Konfiguration wird gebaut und übertragen. Zur Laufzeit prüft robuste Software zusätzlich, ob die tatsächlich vorhandenen Module zur gewählten Variante passen. Beim **Software-Update im Feld** kommt ein zweites Thema hinzu: Ändert sich die Struktur remanenter Daten, braucht die neue Software eine **Datenversion** und eine Migrationsroutine – sonst interpretiert sie alte Werte falsch. Ein Downgrade auf Daten einer neueren Version muss erkannt und blockiert werden.',
    practice: 'Ein Servicetechniker spielt beim Kunden eine neue Softwareversion ein. Wenn die Geschwindigkeit danach plötzlich in m/min statt mm/s interpretiert wird, fährt die Maschine 60-mal zu schnell – oder gar nicht. Datenversionierung verhindert genau das.',
    transfer: {
      tia: 'TIA kennt keine Configurations wie AS; Varianten löst man über Optionenhandling (Konfigurationssteuerung mit Datensatz 196) oder Bibliotheken mit Typen und Versionen.',
      codesys: 'CODESYS bietet Applikationen/Geräte je Variante und Bedingtes Übersetzen (`{IF defined(...)}`); TwinCAT unterstützt Varianten über "Projektvarianten" und das Automation Interface.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lege eine zweite Konfiguration an und aktiviere sie',
        guide: {
          intro: 'Die Configuration View ist die zweite Registerseite des Projektexplorers. Jede Konfiguration ist ein Wurzelknoten.',
          steps: [
            'Wechsle mit **Strg+Alt+C** in die Configuration View.',
            'Füge über das Kontextmenü des Projekts eine neue Konfiguration hinzu (z. B. `Variante_Heizung`) und wähle die CPU.',
            'Ergänze in der Physical View dieser Konfiguration die zusätzlichen Module (z. B. Temperaturmodul).',
            'Setze die neue Konfiguration per Doppelklick oder **Als aktive Konfiguration setzen** aktiv und kompiliere mit **F7**.',
            'Wechsle zurück und prüfe, dass Build und Transfer immer die aktive Konfiguration betreffen.'
          ],
          done: 'Erledigt, wenn beide Konfigurationen fehlerfrei bauen und du weißt, welche gerade aktiv ist.',
          tip: 'Benenne Konfigurationen nach Varianten, nicht nach Personen oder Datum. "Var_Heizung" verstehst du in fünf Jahren noch.',
          link: { label: 'B&R Help: Configuration View', url: 'https://help.br-automation.com/#/de/6/projectmanagement/configurationview/projectorganisation_configurationview.html' }
        }
      },
      {
        id: 'o2',
        title: 'Plane das Software-Update im Feld',
        guide: {
          intro: 'Ein Update ist ein geplanter Eingriff. Vorher sicherst du alles, was die neue Software nicht automatisch übernimmt.',
          steps: [
            'Lies die Community-Richtlinie zur Vermeidung von Datenverlust bei Updates.',
            'Erstelle eine Checkliste: remanente PVs exportieren, nichtflüchtige Bereiche sichern, Benutzerdateien sichern, System Dump vorher/nachher.',
            'Lege fest, wie du bei Problemen auf den alten Stand zurückkommst (Rückfallpaket, z. B. RUC-Paket des alten Stands).',
            'Ergänze, welche Versionen (AS, AR, mapp, eigene Datenversion) vorher und nachher dokumentiert werden.'
          ],
          done: 'Erledigt, wenn deine Update-Checkliste Sicherung, Durchführung, Prüfung und Rückfall abdeckt.',
          tip: 'Ein Update ohne getestetes Rückfallpaket ist eine Wette. Teste das Rückspielen an der ARsim, bevor du zum Kunden fährst.'
        }
      },
      {
        id: 'o3',
        title: 'Führe eine Datenversion für remanente Daten ein',
        guide: {
          intro: 'Die Datenversion ist eine remanente Zahl, die beschreibt, in welchem Format die übrigen Daten vorliegen.',
          steps: [
            'Lege eine remanente Variable `gnDataVersion : UINT` und eine Konstante `DATA_VERSION` im Programm an.',
            'Prüfe im ersten Zyklus: gleich → nichts tun; kleiner → migrieren; 0 → Standardwerte; größer → Fehler (Downgrade).',
            'Schreibe für jeden Versionssprung eine eigene Migrationsfunktion (1→2, 2→3 …) und rufe sie nacheinander auf.',
            'Löse die zweite Übung dieses Moduls.'
          ],
          done: 'Erledigt, wenn deine Migrationslogik alle vier Fälle (gleich, älter, leer, neuer) behandelt und die Tests grün sind.',
          tip: 'Migriere schrittweise (1→2→3), nicht direkt (1→3). So bleibt jede Migrationsfunktion klein und testbar.'
        }
      }
    ],
    videos: [
      v('W8YledEhVKY', 'en', 'Zeigt die Vorlagen in AS6 – Ausgangspunkt für standardisierte Varianten.'),
      v('lysaFX4DRSY', 'en', 'Erklärt Release-Zyklen und Versionierung bei B&R – wichtig für die Update-Planung.'),
      v('fW1FnG-wskY', 'en', 'Zeigt den Wechsel der Automation-Runtime-Version eines Projekts.')
    ],
    readings: [
      r('elektroAnl4', 'Der Ausbildungsrahmenplan nennt ausdrücklich "Versionswechsel von Software durchführen".'),
      r('hConfigView', 'Aufbau und Bedienung der Configuration View, aktive Konfiguration.'),
      r('cUpdateGuide', 'Praxisrichtlinie: welche Daten vor einem Update auf B&R-Steuerungen gesichert werden müssen.')
    ],
    quiz: [
      { type: 'single', q: 'Worauf beziehen sich Build, Transfer und Monitormodus in einem Projekt mit mehreren Konfigurationen?',
        options: ['Auf alle Konfigurationen gleichzeitig', 'Immer auf die aktive Konfiguration', 'Auf die zuletzt angelegte Konfiguration', 'Auf die Konfiguration mit der neuesten AR'],
        correct: 1, explain: 'Laut Hilfe beziehen sich Build, Transfer und Monitormodus immer auf die aktive Konfiguration.' },
      { type: 'single', q: 'Die Daten in der Steuerung haben Version 3, die neue Software kennt nur Version 2. Was ist richtig?',
        options: ['Daten auf Version 2 zurückschreiben', 'Downgrade erkennen, Maschine nicht freigeben und melden', 'Ignorieren', 'Standardwerte laden'],
        correct: 1, explain: 'Die alte Software kennt das neuere Format nicht. Sie darf die Daten weder verwenden noch überschreiben.' },
      { type: 'single', q: 'Variante A erwartet Module in Bitmaske 2#0000_0111, vorhanden ist 2#0000_0101. Welche Maske fehlt?',
        options: ['2#0000_0001', '2#0000_0010', '2#0000_0100', '2#0000_0000'],
        correct: 1, explain: 'Fehlend = erwartet AND NOT vorhanden = 0111 AND 1010 = 0010.' }
    ],
    exam: [
      { type: 'multi', q: 'Was gehört je Konfiguration in die Configuration View?',
        options: ['Hardwarekonfiguration', 'Softwarezuordnung zu Taskklassen', 'I/O-Zuordnungen', 'Die gemeinsamen ST-Programme der Logical View'],
        correct: [0, 1, 2], explain: 'Programme liegen gemeinsam in der Logical View; Konfigurationen beschreiben Hardware, Softwarezuordnung, I/O- und PV-Rangierungen.' },
      { type: 'numeric', q: 'Eine Geschwindigkeit von {V} mm/s soll nach einem Update in m/min gespeichert werden. Welcher Wert ergibt sich?',
        params: { V: [50, 1000, 50] }, formula: 'V * 0.06', unit: 'm/min', tol: 0.01,
        explain: '1 mm/s = 0,001 m · 60 /min = 0,06 m/min.' },
      { type: 'single', q: 'Warum testest du das Rückfallpaket vor einem Feld-Update?',
        options: ['Weil AS6 das verlangt', 'Damit du bei einem fehlgeschlagenen Update sicher und schnell auf den alten Stand zurückkommst', 'Damit die Lizenz verlängert wird', 'Weil das Logbuch sonst voll läuft'],
        correct: 1, explain: 'Ein ungetesteter Rückweg ist im Ernstfall oft keiner.' },
      { type: 'single', q: 'Ein Modul ist vorhanden, wird aber von der aktiven Variante nicht erwartet. Wie bewertest du das?',
        options: ['Als harten Fehler, die Maschine darf nie starten', 'Als Warnung: Funktion ist nicht gefährdet, aber die Variante stimmt evtl. nicht', 'Gar nicht', 'Als Lizenzfehler'],
        correct: 1, explain: 'Zusätzliche Module verhindern die Funktion nicht, deuten aber auf eine falsche Variantenwahl hin.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Variantenprüfung per Bitmaske',
        task: 'Die gewählte Maschinenvariante steht in `nVariant` (USINT). Die vorhandenen Module kommen als Bitmaske `wModulesPresent` (WORD, Bit i = ModuleOk von Steckplatz i).\n\nErwartete Module je Variante:\n- Variante 1 (Basis): Steckplätze 0–2 → `16#0007`\n- Variante 2 (Heizung): Steckplätze 0–4 → `16#001F`\n- Variante 3 (Achse): Steckplätze 0–2, 5, 6 → `16#0067`\n\nAusgaben:\n- `doVariantInvalid` = TRUE, wenn `nVariant` nicht 1, 2 oder 3 ist (dann erwartete Maske 0).\n- `wMissing` = erwartet AND NOT vorhanden, `wUnexpected` = vorhanden AND NOT erwartet.\n- `doConfigOk` = gültige Variante **und** nichts fehlt.\n- `doUnexpectedWarn` = mindestens ein unerwartetes Modul.\n- `nFirstMissing` = niedrigster Steckplatz in `wMissing`, `-1`, wenn keiner fehlt.',
        hints: ['Die erwartete Maske bestimmst du mit `CASE nVariant OF 1: … ELSE … END_CASE`.', 'Ein Bit i prüfst du mit `(SHR(wMissing, i) AND 16#0001) <> 0`.'],
        cycleMs: 10,
        io: [
          { name: 'nVariant', type: 'USINT', dir: 'in', label: 'Gewählte Variante', widget: 'slider', min: 0, max: 5, init: 1 },
          { name: 'wModulesPresent', type: 'WORD', dir: 'in', label: 'Vorhandene Module (Bitmaske)', widget: 'value' },
          { name: 'doConfigOk', type: 'BOOL', dir: 'out', label: 'Konfiguration OK', widget: 'led' },
          { name: 'doVariantInvalid', type: 'BOOL', dir: 'out', label: 'Variante ungültig', widget: 'led' },
          { name: 'doUnexpectedWarn', type: 'BOOL', dir: 'out', label: 'Unerwartete Module', widget: 'led' },
          { name: 'wMissing', type: 'WORD', dir: 'out', label: 'Fehlende Module', widget: 'value' },
          { name: 'wUnexpected', type: 'WORD', dir: 'out', label: 'Unerwartete Module', widget: 'value' },
          { name: 'nFirstMissing', type: 'INT', dir: 'out', label: 'Erster fehlender Steckplatz', widget: 'value' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: erwartete Maske je Variante, Vergleich, erster fehlender Steckplatz *)\n\tdoConfigOk := wModulesPresent <> 0;\nEND_PROGRAM\n',
          var: 'VAR\n\twExpected : WORD;\n\ti : INT;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tdoVariantInvalid := FALSE;\n\tCASE nVariant OF\n\t\t1: wExpected := 16#0007;\n\t\t2: wExpected := 16#001F;\n\t\t3: wExpected := 16#0067;\n\tELSE\n\t\twExpected := 0;\n\t\tdoVariantInvalid := TRUE;\n\tEND_CASE\n\n\twMissing := wExpected AND NOT wModulesPresent;\n\twUnexpected := wModulesPresent AND NOT wExpected;\n\tdoConfigOk := NOT doVariantInvalid AND (wMissing = 0);\n\tdoUnexpectedWarn := wUnexpected <> 0;\n\n\tnFirstMissing := -1;\n\tFOR i := 0 TO 15 DO\n\t\tIF (SHR(wMissing, i) AND 16#0001) <> 0 THEN\n\t\t\tnFirstMissing := i;\n\t\t\tEXIT;\n\t\tEND_IF\n\tEND_FOR\nEND_PROGRAM\n',
          var: 'VAR\n\twExpected : WORD;\n\ti : INT;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Basis-Variante vollständig', steps: [
            { set: { nVariant: 1, wModulesPresent: 7 } }, { cycles: 2 },
            { expect: 'doConfigOk AND NOT doUnexpectedWarn AND wMissing = 0 AND nFirstMissing = -1', msg: 'Variante 1 mit Modulen 0–2: alles OK.' }
          ]},
          { name: 'Heizungsvariante mit fehlenden Modulen', steps: [
            { set: { nVariant: 2, wModulesPresent: 7 } }, { cycles: 2 },
            { expect: 'NOT doConfigOk AND wMissing = 24', msg: 'Variante 2 erwartet 0–4; es fehlen Steckplatz 3 und 4 (Maske 24).' },
            { expect: 'nFirstMissing = 3', msg: 'Erster fehlender Steckplatz ist 3.' }
          ]},
          { name: 'Achsvariante mit zusätzlichen Modulen', steps: [
            { set: { nVariant: 3, wModulesPresent: 127 } }, { cycles: 2 },
            { expect: 'doConfigOk AND doUnexpectedWarn AND wUnexpected = 24', msg: 'Alle erwarteten Module da, Steckplätze 3 und 4 sind unerwartet (Warnung, kein Fehler).' }
          ]},
          { name: 'Achsvariante exakt', steps: [
            { set: { nVariant: 3, wModulesPresent: 103 } }, { cycles: 2 },
            { expect: 'doConfigOk AND NOT doUnexpectedWarn', msg: 'Maske 16#0067 passt exakt zu Variante 3.' }
          ]},
          { name: 'Ungültige Variante', steps: [
            { set: { nVariant: 0, wModulesPresent: 7 } }, { cycles: 2 },
            { expect: 'doVariantInvalid AND NOT doConfigOk', msg: 'Variante 0 ist ungültig – keine Freigabe.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'Datenmigration nach einem Software-Update',
        task: 'Die remanenten Daten bestehen aus `gnDataVersion` (UINT), `grSpeed` (REAL) und `grAccel` (REAL). Die neue Software arbeitet mit **Datenversion 2**:\n- Version 1 speicherte `grSpeed` in **mm/s** und kannte `grAccel` noch nicht.\n- Version 2 speichert `grSpeed` in **m/min** und `grAccel` in mm/s² (Standard 500.0).\n\nFühre im **ersten Zyklus** (Merker `bInitDone`, die Tests setzen die Daten vor dem ersten Zyklus) folgende Prüfung aus:\n1. Version 0 (leer, z. B. nach Kaltstart): Standardwerte `grSpeed := 12.0`, `grAccel := 500.0`, Version 2, `doDefaultsLoaded`.\n2. Version 1: `grSpeed := grSpeed * 0.06`, `grAccel := 500.0`, Version 2, `doMigrated`.\n3. Version 2: nichts ändern.\n4. Version > 2 (Downgrade): Daten **nicht** ändern, `doVersionError` setzen.\n5. Danach **Plausibilität** (nicht bei Versionsfehler): Liegt `grSpeed` nicht in 0.1 … 60.0 m/min, Standardwerte laden und `doDefaultsLoaded` setzen.\n\n`doMachineEnable` ist TRUE, sobald die Prüfung ohne Versionsfehler abgeschlossen ist.',
        hints: ['Verwende `CASE gnDataVersion OF 0: … 1: … 2: ; ELSE … END_CASE`.', 'Lege `DATA_VERSION : UINT := 2;` als Konstante an.'],
        cycleMs: 10,
        io: [
          { name: 'gnDataVersion', type: 'UINT', dir: 'out', label: 'Datenversion (RETAIN)', widget: 'value' },
          { name: 'grSpeed', type: 'REAL', dir: 'out', label: 'Geschwindigkeit (RETAIN)', widget: 'value' },
          { name: 'grAccel', type: 'REAL', dir: 'out', label: 'Beschleunigung (RETAIN)', widget: 'value' },
          { name: 'doMigrated', type: 'BOOL', dir: 'out', label: 'Daten migriert', widget: 'led' },
          { name: 'doDefaultsLoaded', type: 'BOOL', dir: 'out', label: 'Standardwerte geladen', widget: 'led' },
          { name: 'doVersionError', type: 'BOOL', dir: 'out', label: 'Versionsfehler (Downgrade)', widget: 'led' },
          { name: 'doMachineEnable', type: 'BOOL', dir: 'out', label: 'Maschine freigegeben', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Versionsprüfung und Migration im ersten Zyklus *)\n\tdoMachineEnable := TRUE;\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tDATA_VERSION : UINT := 2;\nEND_VAR\nVAR\n\tbInitDone : BOOL;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tIF NOT bInitDone THEN\n\t\tCASE gnDataVersion OF\n\t\t\t0:\n\t\t\t\tgrSpeed := 12.0;\n\t\t\t\tgrAccel := 500.0;\n\t\t\t\tgnDataVersion := DATA_VERSION;\n\t\t\t\tdoDefaultsLoaded := TRUE;\n\t\t\t1:\n\t\t\t\tgrSpeed := grSpeed * 0.06;\n\t\t\t\tgrAccel := 500.0;\n\t\t\t\tgnDataVersion := DATA_VERSION;\n\t\t\t\tdoMigrated := TRUE;\n\t\t\t2:\n\t\t\t\t; (* aktuell *)\n\t\tELSE\n\t\t\tdoVersionError := TRUE;\n\t\tEND_CASE\n\n\t\tIF NOT doVersionError THEN\n\t\t\tIF (grSpeed < 0.1) OR (grSpeed > 60.0) THEN\n\t\t\t\tgrSpeed := 12.0;\n\t\t\t\tgrAccel := 500.0;\n\t\t\t\tdoDefaultsLoaded := TRUE;\n\t\t\tEND_IF\n\t\tEND_IF\n\t\tbInitDone := TRUE;\n\tEND_IF\n\tdoMachineEnable := bInitDone AND NOT doVersionError;\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tDATA_VERSION : UINT := 2;\nEND_VAR\nVAR\n\tbInitDone : BOOL;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Version 1 wird migriert', steps: [
            { set: { gnDataVersion: 1, grSpeed: 200.0, grAccel: 0.0 } }, { cycles: 2 },
            { expect: 'ABS(grSpeed - 12.0) < 0.001 AND ABS(grAccel - 500.0) < 0.001', msg: '200 mm/s = 12 m/min; Beschleunigung mit Standard 500.' },
            { expect: 'gnDataVersion = 2 AND doMigrated AND doMachineEnable AND NOT doDefaultsLoaded' }
          ]},
          { name: 'Version 2 bleibt unverändert', steps: [
            { set: { gnDataVersion: 2, grSpeed: 30.0, grAccel: 800.0 } }, { cycles: 2 },
            { expect: 'ABS(grSpeed - 30.0) < 0.001 AND ABS(grAccel - 800.0) < 0.001', msg: 'Aktuelle Daten dürfen nicht verändert werden.' },
            { expect: 'NOT doMigrated AND NOT doDefaultsLoaded AND doMachineEnable' }
          ]},
          { name: 'Leere Daten: Standardwerte', steps: [
            { cycles: 2 },
            { expect: 'gnDataVersion = 2 AND ABS(grSpeed - 12.0) < 0.001 AND doDefaultsLoaded AND doMachineEnable', msg: 'Version 0 lädt Standardwerte und setzt Version 2.' }
          ]},
          { name: 'Downgrade wird blockiert', steps: [
            { set: { gnDataVersion: 3, grSpeed: 45.0 } }, { cycles: 2 },
            { expect: 'doVersionError AND NOT doMachineEnable', msg: 'Daten einer neueren Version: Fehler, keine Freigabe.' },
            { expect: 'gnDataVersion = 3 AND ABS(grSpeed - 45.0) < 0.001', msg: 'Die neueren Daten dürfen nicht verändert werden.' }
          ]},
          { name: 'Unplausibler Wert nach Migration', steps: [
            { set: { gnDataVersion: 1, grSpeed: 5000.0 } }, { cycles: 2 },
            { expect: 'ABS(grSpeed - 12.0) < 0.001 AND doDefaultsLoaded AND doMachineEnable', msg: '5000 mm/s = 300 m/min liegt außerhalb 0,1 … 60: Standardwerte laden.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'system-4-plattform',
    level: 4,
    kind: 'projekt',
    title: 'Praxisprojekt: Hypervisor/GPOS, Lizenzierung und Remote-Wartung',
    summary: 'Du koppelst Automation Runtime mit einem Windows- oder Linux-System über den B&R Hypervisor, überwachst die Kopplung mit Heartbeats und gibst Remote-Zugriffe nur unter klaren Bedingungen frei.',
    minutes: 300,
    req: ['system-4-varianten'],
    briefing: 'Der B&R Hypervisor führt Automation Runtime parallel zu einem General Purpose OS (GPOS: Windows oder Linux) auf einem Zielsystem aus. Er partitioniert CPU-Kerne, Speicher und Peripherie, sodass jedes Betriebssystem logisch getrennt läuft; zur Kommunikation stehen virtuelles Ethernet, Shared Memory und Events bereit. Das Echtzeitsystem ordnet sich dabei nicht unter. Genau deshalb muss die AR-Seite damit rechnen, dass die GPOS-Seite hängt, neu startet oder ein Update installiert – also überwacht sie ein Lebenszeichen und schaltet auf einen sicheren Ersatzbetrieb. Dazu kommen zwei organisatorische Themen: **Lizenzierung** (Automation-Studio-Lizenz am Arbeitsplatz, Technology Guarding für lizenzpflichtige Runtime-Funktionen) und **Remote-Wartung** – laut BSI gehört die Fernwartungskomponente in eine DMZ, Zugriffe müssen vor Ort freigegeben, protokolliert und zeitlich begrenzt sein.',
    practice: 'Panel-PCs mit Windows-HMI und AR im Hypervisor sind Standard. Hängt Windows nach einem Update, muss die Maschine trotzdem kontrolliert weiterlaufen oder anhalten – und der Remote-Zugang darf sich nicht selbstständig öffnen.',
    transfer: {
      tia: 'Vergleichbar ist der Betrieb einer Software-Controller-CPU (S7-1500 Software Controller) neben Windows auf einem IPC. Fernwartung bei Siemens z. B. über SINEMA Remote Connect.',
      codesys: 'TwinCAT läuft als Echtzeiterweiterung neben Windows (isolierte Kerne); CODESYS Control RTE ähnlich. Fernwartung erfolgt über Herstellerlösungen oder VPN-Router.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Beschreibe die Hypervisor-Architektur deines Zielsystems',
        guide: {
          intro: 'Bevor du programmierst, legst du fest, welche Ressourcen AR und GPOS bekommen und wie sie kommunizieren.',
          steps: [
            'Lies die Hilfe-Seite **B&R Hypervisor** und die Community-Installationsanleitung für Windows.',
            'Skizziere: Welche CPU-Kerne bekommt AR, welche das GPOS? Welche Schnittstellen (Ethernet, USB) gehören wem?',
            'Lege den Kommunikationsweg fest (virtuelles Ethernet oder Shared Memory) und begründe ihn.',
            'Notiere, welche Seite welche Daten schreibt (z. B. GPOS-Heartbeat → AR, AR-Heartbeat → GPOS).'
          ],
          done: 'Erledigt, wenn deine Architekturskizze Kernaufteilung, Schnittstellen und Datenrichtungen zeigt.',
          tip: 'Beide Systeme sind logisch getrennt, teilen sich aber den Last Level Cache. Laufzeitmessungen der AR-Seite deshalb immer unter realer GPOS-Last machen.',
          link: { label: 'B&R Help: B&R Hypervisor', url: 'https://help.br-automation.com/#/de/6/automationruntime/targets/hypervisor/hypervisor.html' }
        }
      },
      {
        id: 'o2',
        title: 'Kläre die Lizenzierung',
        guide: {
          intro: 'Lizenzen betreffen den Engineering-Arbeitsplatz und lizenzpflichtige Funktionen auf der Steuerung.',
          steps: [
            'Prüfe am Arbeitsplatz, welche Automation-Studio-Lizenz aktiv ist (Arbeitsplatzlizenz oder Technology Guard).',
            'Lies die Hilfe-Seite **Technology Guarding** und notiere, wie der Technology Guarding Assistent beim Kompilieren hilft.',
            'Liste für dein Projekt auf, welche verwendeten mapp-Komponenten lizenzpflichtig sein könnten, und wie die Lizenz auf die Steuerung kommt.'
          ],
          done: 'Erledigt, wenn du für Arbeitsplatz und Steuerung den Lizenzweg dokumentiert hast.',
          tip: 'Kläre Lizenzen vor der Auslieferung. Eine fehlende Runtime-Lizenz fällt sonst erst beim Kunden auf.',
          link: { label: 'B&R Help: Technology Guarding', url: 'https://help.br-automation.com/#/de/6/revinfos/technologyguarding/technology_guarding.html' }
        }
      },
      {
        id: 'o3',
        title: 'Lege ein Remote-Wartungskonzept fest',
        guide: {
          intro: 'Die BSI-Empfehlung zur industriellen Fernwartung beschreibt die Anforderungen nach Stand der Technik.',
          steps: [
            'Lies BSI-CS 108 (Fernwartung im industriellen Umfeld).',
            'Lege fest: Fernwartungskomponente in der DMZ, Freigabe durch Personal vor Ort (Schlüsselschalter), Sitzungsdauer, Protokollierung.',
            'Vergleiche mit dem B&R-Angebot Secure Remote Maintenance (SiteManager).',
            'Übertrage die Freigabebedingungen in die Übung dieses Moduls.'
          ],
          done: 'Erledigt, wenn dein Konzept Architektur, Freigabe, Zeitbegrenzung und Protokollierung beschreibt.',
          tip: 'Direkte Internetanbindung einer SPS entspricht laut BSI nicht dem Stand der Technik. Das gilt auch "nur kurz für den Service".',
          link: { label: 'B&R Help: Secure Remote Maintenance', url: 'https://help.br-automation.com/#/de/6/hardware/secure_remote_maintenance/secure_remote_maintenance.html' }
        }
      },
      {
        id: 'o4',
        title: 'Programmiere die Kopplungsüberwachung und reiche den Nachweis ein',
        guide: {
          intro: 'Die Übung bildet die Heartbeat-Kopplung zwischen AR und GPOS und die Remote-Freigabe nach.',
          steps: [
            'Löse die Übung, bis alle Tests grün sind.',
            'Übertrage die Logik in dein AS6-Projekt (ARsim genügt; den GPOS-Zähler simulierst du mit einem zweiten Task).',
            'Teste mit dem Trace: GPOS-Ausfall, Wiederkehr mit Entprellung, Remote-Sitzung mit Zeitablauf.',
            'Lege Projekt, Architekturskizze, Remote-Konzept und Trace im Repository ab und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist.',
          tip: 'Lass die Wiederkehr eines Partners nie nach einer einzigen Änderung gelten. Ein Neustart der GPOS-Seite erzeugt oft einzelne Zuckungen.'
        }
      }
    ],
    videos: [
      v('MbWZp8950_c', 'en', 'Einstieg in den B&R Hypervisor: AR und GPOS auf einem Gerät.'),
      v('oOAcjyuouUM', 'en', 'Zeigt Shared Memory als Kommunikationsweg zwischen den Systemen im Hypervisor.'),
      v('LUo8BAw2jUk', 'en', 'B&R-Video zu sicherer Fernwartung von Maschinen.')
    ],
    readings: [
      r('tudScheduling', 'Uni-Vorlesung zu Echtzeit-Scheduling – warum Partitionierung von Kernen Echtzeit garantiert.'),
      r('hHypervisor', 'Grundlegende Eigenschaften und Kommunikationskanäle des B&R Hypervisors.'),
      r('bsiFernwartung', 'Amtliche Empfehlung des BSI zu Architektur und Absicherung industrieller Fernwartung.')
    ],
    quiz: [
      { type: 'single', q: 'Welche Kombination ist mit dem B&R Hypervisor laut Hilfe nicht möglich?',
        options: ['AR und Windows', 'AR und Linux', 'Zwei GPOS (Linux und Windows) gleichzeitig', 'AR allein'],
        correct: 2, explain: 'Der Betrieb von zwei GPOS ist nicht möglich.' },
      { type: 'multi', q: 'Welche Kommunikationskanäle stellt der B&R Hypervisor zwischen den Systemen bereit?',
        options: ['Virtuelle Ethernet-Schnittstelle', 'Shared Memory', 'Events', 'Gemeinsame Variablen ohne Konfiguration'],
        correct: [0, 1, 2], explain: 'Die Hilfe nennt virtuelles Ethernet, Shared Memory und Events.' },
      { type: 'single', q: 'Wo sollte eine Fernwartungskomponente laut BSI-Empfehlung liegen?',
        options: ['Direkt im Produktionsnetz', 'In einer vorgelagerten Zone (DMZ)', 'Auf der SPS selbst', 'Im Internet ohne Firewall'],
        correct: 1, explain: 'Die Komponente sollte in einer DMZ liegen; Firewalls begrenzen erlaubte Adressbereiche.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Bedingungen sind für eine Remote-Sitzung an einer Maschine sinnvoll?',
        options: ['Freigabe vor Ort (z. B. Schlüsselschalter)', 'Zeitliche Begrenzung der Sitzung', 'Maschine im sicheren Zustand für schreibende Eingriffe', 'Dauerhafte Freigabe, damit der Service nicht warten muss'],
        correct: [0, 1, 2], explain: 'Dauerfreigaben widersprechen dem Prinzip der kontrollierten, protokollierten Fernwartung.' },
      { type: 'single', q: 'Warum wartet die Wiederkehr-Erkennung eines Partners auf mehrere aufeinanderfolgende Heartbeat-Änderungen?',
        options: ['Um Speicher zu sparen', 'Um ein Flattern zwischen "verloren" und "da" bei instabilem Partner zu vermeiden (Entprellung)', 'Weil der Zähler sonst überläuft', 'Weil das die Lizenz verlangt'],
        correct: 1, explain: 'Entprellung verhindert ständige Umschaltungen zwischen Normal- und Ersatzbetrieb.' },
      { type: 'single', q: 'Was regelt Technology Guarding bei B&R?',
        options: ['Die Zykluszeit', 'Die Lizenzierung lizenzpflichtiger Software-Funktionen', 'Die Hardware-Konfiguration', 'Den Not-Halt'],
        correct: 1, explain: 'Technology Guarding ist das Lizenzierungskonzept für lizenzpflichtige Funktionen.' },
      { type: 'numeric', q: 'Der GPOS-Heartbeat kommt alle {T} ms. Die Wiederkehr gilt nach 5 Änderungen. Wie lange dauert die Wiederkehr mindestens (ms), wenn die erste Änderung sofort kommt?',
        params: { T: [50, 200, 50] }, formula: '4 * T', unit: 'ms', tol: 0.01,
        explain: 'Zwischen der 1. und 5. Änderung liegen 4 Intervalle.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'AR↔GPOS-Kopplung und Remote-Freigabe',
        task: '**Teil A – Heartbeats**\n1. `gnArCounter` (UDINT) erhöht sich in **jedem** Zyklus um 1 (Lebenszeichen der AR-Seite für das GPOS).\n2. `gnGposCounter` (UDINT) wird von der GPOS-Seite geschrieben (Simulation: alle 100 ms +1, abschaltbar mit `diGposAlive`). Ändert er sich **1 s** lang nicht → `doGposLost := TRUE`, `nLossCount` (UINT) +1, `doVisuFallback := TRUE` (lokale Ersatzbedienung).\n3. Wiederkehr: Erst nach **5 Änderungen** des Zählers seit dem Ausfall wird `doGposLost` (und `doVisuFallback`) automatisch FALSE. Bleibt der Zähler währenddessen erneut 1 s stehen, beginnt die Zählung von vorn.\n\n**Teil B – Remote-Sitzung**\n4. Eine Sitzung startet mit der **steigenden Flanke** von `diRemoteRequest`, wenn gleichzeitig `diLocalPermit` (Schlüsselschalter vor Ort), `diMachineStopped` und kein GPOS-Ausfall vorliegen.\n5. Die Sitzung endet sofort, wenn eine dieser Bedingungen wegfällt oder die Anforderung zurückgenommen wird, und spätestens nach **5 s** (in der Übung verkürzt). Danach ist eine **neue Flanke** nötig.\n6. `doRemoteActive` zeigt die laufende Sitzung.',
        hints: ['`fbGposWd(IN := gnGposCounter = nLastGpos, PT := T#1s);` vor dem Aktualisieren von `nLastGpos` aufrufen.', 'Die Sitzungszeit überwachst du mit einem TON, dessen IN die Sitzung selbst ist.'],
        cycleMs: 10,
        io: [
          { name: 'diGposAlive', type: 'BOOL', dir: 'in', label: 'GPOS-Anwendung läuft (Simulation)', widget: 'switch', init: true },
          { name: 'gnGposCounter', type: 'UDINT', dir: 'in', label: 'Heartbeat GPOS (Shared Memory)', widget: 'value' },
          { name: 'diRemoteRequest', type: 'BOOL', dir: 'in', label: 'Anforderung Remote-Sitzung', widget: 'switch' },
          { name: 'diLocalPermit', type: 'BOOL', dir: 'in', label: 'Schlüsselschalter Fernwartung', widget: 'switch' },
          { name: 'diMachineStopped', type: 'BOOL', dir: 'in', label: 'Maschine steht', widget: 'switch' },
          { name: 'gnArCounter', type: 'UDINT', dir: 'out', label: 'Heartbeat AR', widget: 'value' },
          { name: 'doGposLost', type: 'BOOL', dir: 'out', label: 'GPOS ausgefallen', widget: 'led' },
          { name: 'doVisuFallback', type: 'BOOL', dir: 'out', label: 'Ersatzbedienung aktiv', widget: 'led' },
          { name: 'nLossCount', type: 'UINT', dir: 'out', label: 'Anzahl Ausfälle', widget: 'value' },
          { name: 'doRemoteActive', type: 'BOOL', dir: 'out', label: 'Remote-Sitzung aktiv', widget: 'led' }
        ],
        plant: {
          var: 'VAR\n\trT : REAL;\nEND_VAR\n',
          code: 'IF diGposAlive THEN\n\trT := rT + PLANT_DT;\n\tIF rT >= 0.0995 THEN\n\t\trT := 0.0;\n\t\tgnGposCounter := gnGposCounter + 1;\n\tEND_IF\nEND_IF'
        },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO Teil A: Heartbeats *)\n\tgnArCounter := gnArCounter + 1;\n\n\t(* TODO Teil B: Remote-Sitzung *)\n\tdoRemoteActive := diRemoteRequest AND diLocalPermit;\nEND_PROGRAM\n',
          var: 'VAR\n\tnLastGpos : UDINT;\n\tnGoodChanges : INT;\n\tbSession : BOOL;\n\tbAllowed : BOOL;\n\tfbGposWd : TON;\n\tfbSession : TON;\n\trtRequest : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Teil A: Heartbeats *)\n\tgnArCounter := gnArCounter + 1;\n\n\tfbGposWd(IN := gnGposCounter = nLastGpos, PT := T#1s);\n\tIF fbGposWd.Q THEN\n\t\tIF NOT doGposLost THEN\n\t\t\tdoGposLost := TRUE;\n\t\t\tnLossCount := nLossCount + 1;\n\t\tEND_IF\n\t\tnGoodChanges := 0;\n\tELSIF doGposLost AND (gnGposCounter <> nLastGpos) THEN\n\t\tnGoodChanges := nGoodChanges + 1;\n\t\tIF nGoodChanges >= 5 THEN\n\t\t\tdoGposLost := FALSE;\n\t\t\tnGoodChanges := 0;\n\t\tEND_IF\n\tEND_IF\n\tnLastGpos := gnGposCounter;\n\tdoVisuFallback := doGposLost;\n\n\t(* Teil B: Remote-Sitzung *)\n\tbAllowed := diRemoteRequest AND diLocalPermit AND diMachineStopped AND NOT doGposLost;\n\trtRequest(CLK := diRemoteRequest);\n\tIF rtRequest.Q AND bAllowed THEN\n\t\tbSession := TRUE;\n\tEND_IF\n\tIF NOT bAllowed THEN\n\t\tbSession := FALSE;\n\tEND_IF\n\tfbSession(IN := bSession, PT := T#5s);\n\tIF fbSession.Q THEN\n\t\tbSession := FALSE;\n\tEND_IF\n\tdoRemoteActive := bSession;\nEND_PROGRAM\n',
          var: 'VAR\n\tnLastGpos : UDINT;\n\tnGoodChanges : INT;\n\tbSession : BOOL;\n\tbAllowed : BOOL;\n\tfbGposWd : TON;\n\tfbSession : TON;\n\trtRequest : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'AR-Heartbeat zählt jeden Zyklus', steps: [
            { cycles: 10 },
            { expect: 'gnArCounter >= 9 AND gnArCounter <= 11', msg: 'Nach 10 Zyklen muss der AR-Zähler bei etwa 10 stehen.' },
            { ms: 500 },
            { expect: 'NOT doGposLost', msg: 'Bei laufender GPOS-Seite kein Ausfall.' }
          ]},
          { name: 'GPOS-Ausfall nach 1 s', steps: [
            { ms: 300 },
            { set: { diGposAlive: false } }, { ms: 800 },
            { expect: 'NOT doGposLost', msg: 'Unter 1 s ohne Änderung noch kein Ausfall.' },
            { until: 'doGposLost', maxMs: 500, msg: 'Nach 1 s ohne Änderung muss der Ausfall erkannt werden.' },
            { expect: 'doVisuFallback AND nLossCount = 1' }
          ]},
          { name: 'Wiederkehr erst nach 5 Änderungen', steps: [
            { set: { diGposAlive: false } },
            { until: 'doGposLost', maxMs: 1500 },
            { set: { diGposAlive: true } }, { ms: 300 },
            { expect: 'doGposLost', msg: 'Nach etwa 3 Änderungen ist der Partner noch nicht zurück (Entprellung).' },
            { until: 'NOT doGposLost', maxMs: 400, msg: 'Nach 5 Änderungen muss der Ausfall automatisch zurückgehen.' },
            { expect: 'NOT doVisuFallback AND nLossCount = 1' }
          ]},
          { name: 'Remote-Sitzung nur mit Freigabe vor Ort', steps: [
            { set: { diMachineStopped: true, diRemoteRequest: true } }, { cycles: 3 },
            { expect: 'NOT doRemoteActive', msg: 'Ohne Schlüsselschalter keine Sitzung.' },
            { set: { diRemoteRequest: false } }, { cycles: 2 },
            { set: { diLocalPermit: true, diRemoteRequest: true } }, { cycles: 3 },
            { expect: 'doRemoteActive', msg: 'Mit Freigabe, Stillstand und neuer Anforderung startet die Sitzung.' },
            { set: { diLocalPermit: false } }, { cycles: 2 },
            { expect: 'NOT doRemoteActive', msg: 'Wegfall der Freigabe beendet die Sitzung sofort.' }
          ]},
          { name: 'Sitzung endet nach 5 s, Neustart nur mit neuer Flanke', steps: [
            { set: { diMachineStopped: true, diLocalPermit: true, diRemoteRequest: true } }, { cycles: 3 },
            { expect: 'doRemoteActive' },
            { ms: 4500 },
            { expect: 'doRemoteActive', msg: 'Vor Ablauf von 5 s läuft die Sitzung noch.' },
            { until: 'NOT doRemoteActive', maxMs: 1000, msg: 'Nach 5 s muss die Sitzung enden.' },
            { ms: 500 },
            { expect: 'NOT doRemoteActive', msg: 'Ohne neue Flanke darf keine neue Sitzung starten.' },
            { set: { diRemoteRequest: false } }, { cycles: 2 }, { set: { diRemoteRequest: true } }, { cycles: 2 },
            { expect: 'doRemoteActive', msg: 'Eine neue Anforderung startet eine neue Sitzung.' }
          ]},
          { name: 'Keine Sitzung bei laufender Maschine', steps: [
            { set: { diMachineStopped: false, diLocalPermit: true, diRemoteRequest: true } }, { ms: 500 },
            { expect: 'NOT doRemoteActive', msg: 'Bei laufender Maschine darf keine Sitzung starten.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Plattform-Integrator'
  }
];
