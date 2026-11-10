// Bereich "system" – Level 5 (Master → Prüfung Guru)
'use strict';
const { v } = require('./videos');
const { r } = require('./readings');

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'system-5-architektur',
    level: 5,
    kind: 'lektion',
    title: 'Systemarchitektur großer Anlagen und Performance-Optimierung',
    summary: 'Du strukturierst die Software großer Anlagen in wiederverwendbare Bausteine, verteilst Rechenlast über Zyklen und Taskklassen und begründest Architekturentscheidungen mit Messwerten.',
    minutes: 300,
    req: ['system-4-plattform'],
    briefing: 'Große Anlagen haben Dutzende Stationen, hunderte Module und mehrere Steuerungen. Ohne Architektur wird daraus ein Projekt, das niemand mehr sicher ändern kann. Drei Prinzipien tragen: **Modularität** (eine Maschineneinheit = ein Baustein mit klarer Schnittstelle, mehrfach instanziiert), **Trennung nach Zeitanforderung** (schnelle Regelung, Ablaufsteuerung, Diagnose, Visualisierung und Kommunikation in passenden Taskklassen bzw. auf passenden Steuerungen) und **messbare Performance**. Lange Berechnungen – Statistiken über große Felder, Rezepturvergleiche, Dateioperationen – gehören nicht in einen einzigen Zyklus der schnellen Taskklasse. Du verteilst sie per **Time Slicing** in Häppchen auf mehrere Zyklen oder verschiebst sie in eine langsame Klasse. Ob das reicht, entscheidet nicht das Bauchgefühl, sondern der Profiler.',
    practice: 'Eine Anlage wächst von 4 auf 12 Stationen. Ist die Stationsdiagnose ein wiederverwendbarer Baustein, sind es 8 neue Instanzen. Ist sie kopierter Code, sind es 8 neue Fehlerquellen – und eine Zykluszeit, die plötzlich nicht mehr reicht.',
    transfer: {
      tia: 'Entspricht in TIA Bibliotheken mit Typen (versionierte FBs), mehreren OB-Weckalarmen für unterschiedliche Zeitebenen und der Aufteilung großer Berechnungen über mehrere OB1-Zyklen.',
      codesys: 'In CODESYS/TwinCAT: Bibliotheken bzw. objektorientierte FBs (Interfaces, Methoden), mehrere Tasks mit Prioritäten und – bei TwinCAT – die Verteilung auf mehrere Echtzeitkerne.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Zerlege eine Anlage in Softwaremodule',
        guide: {
          intro: 'Architektur beginnt auf dem Papier: Welche Einheiten gibt es, was ist ihre Schnittstelle, wer darf wen aufrufen?',
          steps: [
            'Wähle eine reale oder fiktive Anlage mit mindestens vier Stationen.',
            'Zeichne die Hierarchie: Anlage → Station → Funktionseinheit (Achse, Ventilinsel, Sensorgruppe).',
            'Lege für jede Einheit die Schnittstelle fest: Kommandos (Start, Stop, Reset), Status (Ready, Busy, Error, Code), Parameter.',
            'Ordne jede Einheit einer Taskklasse zu und begründe die Zykluszeit.'
          ],
          done: 'Erledigt, wenn dein Architekturdiagramm Hierarchie, Schnittstellen und Taskklassen-Zuordnung zeigt.',
          tip: 'Eine einheitliche Kommando-/Status-Schnittstelle für alle Einheiten (z. B. nach dem Vorbild von mapp-Komponenten) macht HMI, Diagnose und Tests deutlich einfacher.'
        }
      },
      {
        id: 'o2',
        title: 'Baue einen wiederverwendbaren Diagnose-Baustein',
        guide: {
          intro: 'Ein Funktionsbaustein kapselt Zustand und Logik. In AS6 liegen die Deklarationen in der `.fun`-Datei der Bibliothek bzw. des Programms.',
          steps: [
            'Lege eine eigene Bibliothek in der Logical View an (z. B. `DiagLib`).',
            'Füge einen Funktionsbaustein `FB_ModuleDiag` hinzu; die Ein- und Ausgänge deklarierst du in der `.fun`-Datei.',
            'Implementiere Entprellung, Speicherung und Zähler (Übung 2 dieses Moduls).',
            'Instanziiere den Baustein für mehrere Module und prüfe im Watch die Instanzdaten.'
          ],
          done: 'Erledigt, wenn ein Baustein in mindestens vier Instanzen ohne Codekopie läuft.',
          tip: 'Versioniere Bibliotheken. Eine Änderung am Baustein wirkt auf alle Instanzen – das ist Stärke und Risiko zugleich.'
        }
      },
      {
        id: 'o3',
        title: 'Optimiere eine lange Berechnung mit Time Slicing',
        guide: {
          intro: 'Statt 1000 Elemente in einem Zyklus zu verarbeiten, verarbeitest du 100 pro Zyklus und meldest danach "fertig".',
          steps: [
            'Miss mit dem Profiler die Laufzeit des Programms mit der Berechnung in einem Zyklus.',
            'Baue die Berechnung als Zustandsautomat um: Start → Häppchen verarbeiten → Fertig (Übung 1).',
            'Miss erneut und vergleiche maximale Laufzeit und Gesamtdauer.',
            'Dokumentiere den Kompromiss: niedrigere Spitzenlast gegen längere Gesamtdauer.'
          ],
          done: 'Erledigt, wenn du Vorher/Nachher-Messwerte der maximalen Tasklaufzeit dokumentiert hast.',
          tip: 'Daten, die während einer zyklusübergreifenden Berechnung geändert werden, können zu inkonsistenten Ergebnissen führen. Kopiere sie beim Start oder sperre sie.',
          link: { label: 'B&R Help: Profiler', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/profile/diagnosis_profile.html' }
        }
      }
    ],
    videos: [
      v('k5O5zhkPAAM', 'en', 'B&R erklärt das mapp-Konzept: wiederverwendbare, konfigurierbare Softwarekomponenten.'),
      v('HJ3qYE_l5v0', 'de', 'Deutschsprachig: Funktionsbausteine modular erweitern.'),
      v('QkoICj3Xjno', 'de', 'Prinzipien Modularität, Lokalität und Dekomposition aus der Softwarearchitektur.')
    ],
    readings: [
      r('iasStrukturen', 'Hochschulfolien zu Automatisierungshierarchien, verteilten und redundanten Strukturen.'),
      r('tumEchtzeit', 'Uni-Vorlesung: Scheduling, Prioritäten und Auslastung – die Grundlage für die Taskklassen-Planung.'),
      r('hProfiler', 'Messen statt raten: Tasklaufzeiten, Stack und User Events mit dem Profiler.')
    ],
    quiz: [
      { type: 'single', q: 'Eine Berechnung über 1000 Elemente verursacht Laufzeitspitzen in Cyclic #1. Was ist die beste erste Maßnahme?',
        options: ['Toleranz der Taskklasse erhöhen', 'Berechnung über mehrere Zyklen verteilen oder in eine langsamere Taskklasse verschieben', 'Mehr Variablen remanent machen', 'Logger deaktivieren'],
        correct: 1, explain: 'Die Ursache – zu viel Arbeit in einem Zyklus – muss beseitigt werden.' },
      { type: 'single', q: 'Welchen Vorteil hat ein Funktionsbaustein mit mehreren Instanzen gegenüber kopiertem Code?',
        options: ['Er ist immer schneller', 'Logik existiert einmal; jede Instanz hat ihren eigenen Zustand', 'Er braucht keinen Speicher', 'Er kann nicht fehlerhaft sein'],
        correct: 1, explain: 'Eine Logik, viele Zustände: Korrekturen wirken überall, Instanzdaten bleiben getrennt.' },
      { type: 'numeric', q: '{N} Elemente sollen mit höchstens 100 Elementen pro Zyklus verarbeitet werden. Wie viele Zyklen brauchst du mindestens?',
        params: { N: [200, 2000, 100] }, formula: 'Math.ceil(N / 100)', unit: 'Zyklen', tol: 0.001,
        explain: 'Zyklen = aufrunden(N / 100).' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Aufgaben gehören typischerweise in eine langsame Taskklasse (z. B. 100 ms)?',
        options: ['Visualisierungslogik', 'Statistik und Diagnoseauswertung', 'Lageregelung einer Servoachse', 'Datei- und Rezepturverwaltung'],
        correct: [0, 1, 3], explain: 'Lageregelung braucht kurze, deterministische Zyklen; die anderen Aufgaben vertragen längere Zykluszeiten.' },
      { type: 'single', q: 'Was ist ein Risiko von Time Slicing?',
        options: ['Die Steuerung geht in SERVICE.', 'Ändern sich die Eingangsdaten während der zyklusübergreifenden Berechnung, wird das Ergebnis inkonsistent.', 'Der Profiler funktioniert nicht mehr.', 'Es sind keine FOR-Schleifen mehr erlaubt.'],
        correct: 1, explain: 'Abhilfe: Daten beim Start kopieren oder für die Dauer der Berechnung sperren.' },
      { type: 'single', q: 'Eine Anlage soll auf 12 Stationen erweitert werden. Welche Architektur skaliert am besten?',
        options: ['Code jeder Station kopieren und anpassen', 'Ein parametrierbarer Stationsbaustein mit einheitlicher Kommando-/Status-Schnittstelle, mehrfach instanziiert', 'Alle Stationen in einem großen Programm mit globalen Variablen', 'Eine Steuerung pro Sensor'],
        correct: 1, explain: 'Wiederverwendung und einheitliche Schnittstellen sind die Grundlage für skalierbare Anlagensoftware.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Lange Berechnung per Time Slicing verteilen',
        task: 'Das Programm wertet 1000 Produktionswerte `aData[0..999]` aus (Summe und Maximum). Der vorhandene Code macht das in **einem** Zyklus – der Profiler zeigt Laufzeitspitzen. Baue ihn um:\n\n1. Steigende Flanke an `diStartCalc` startet die Berechnung (`doBusy := TRUE`, `doDone := FALSE`, Summe/Maximum/Zykluszähler zurücksetzen). Während `doBusy` werden weitere Startflanken ignoriert.\n2. Pro Zyklus werden **höchstens 100 Elemente** verarbeitet. Die Anzahl im aktuellen Zyklus steht in `nProcessedThisCycle` (0, wenn nicht gerechnet wird).\n3. Nach dem letzten Element: `doBusy := FALSE`, `doDone := TRUE`, Ergebnis in `nSum` (DINT) und `nMax` (INT). `nCyclesUsed` zählt die Rechenzyklen.\n\nDie Daten werden in `_INIT` mit `aData[i] := (INT_TO_DINT(i) * 37) MOD 1000` gefüllt (eine Permutation von 0 … 999; die Rechnung läuft in DINT, weil 999 · 37 den INT-Bereich überschreitet).',
        hints: ['Ein Index `nPos` merkt sich über Zyklen hinweg, wo du weitermachst.', 'Die innere Schleife läuft von `nPos` bis `MIN(nPos + 99, 999)`.'],
        cycleMs: 10,
        io: [
          { name: 'diStartCalc', type: 'BOOL', dir: 'in', label: 'Berechnung starten', widget: 'button' },
          { name: 'doBusy', type: 'BOOL', dir: 'out', label: 'Berechnung läuft', widget: 'led' },
          { name: 'doDone', type: 'BOOL', dir: 'out', label: 'Berechnung fertig', widget: 'led' },
          { name: 'nSum', type: 'DINT', dir: 'out', label: 'Summe', widget: 'value' },
          { name: 'nMax', type: 'INT', dir: 'out', label: 'Maximum', widget: 'value' },
          { name: 'nCyclesUsed', type: 'INT', dir: 'out', label: 'Benötigte Zyklen', widget: 'value' },
          { name: 'nProcessedThisCycle', type: 'INT', dir: 'out', label: 'Elemente in diesem Zyklus', widget: 'value' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\tFOR i := 0 TO 999 DO\n\t\taData[i] := (INT_TO_DINT(i) * 37) MOD 1000;   (* DINT: 999 * 37 passt nicht in INT *)\n\tEND_FOR\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\trtStart(CLK := diStartCalc);\n\tnProcessedThisCycle := 0;\n\tIF rtStart.Q THEN\n\t\t(* Bisher: alles in einem Zyklus *)\n\t\tnSum := 0;\n\t\tnMax := 0;\n\t\tFOR i := 0 TO 999 DO\n\t\t\tnSum := nSum + aData[i];\n\t\t\tIF aData[i] > nMax THEN nMax := aData[i]; END_IF\n\t\t\tnProcessedThisCycle := nProcessedThisCycle + 1;\n\t\tEND_FOR\n\t\tnCyclesUsed := 1;\n\t\tdoDone := TRUE;\n\tEND_IF\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tCHUNK : INT := 100;\nEND_VAR\nVAR\n\taData : ARRAY[0..999] OF INT;\n\ti : INT;\n\tnPos : INT;\n\tnEnd : INT;\n\trtStart : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\tFOR i := 0 TO 999 DO\n\t\taData[i] := (INT_TO_DINT(i) * 37) MOD 1000;   (* DINT: 999 * 37 passt nicht in INT *)\n\tEND_FOR\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\trtStart(CLK := diStartCalc);\n\tnProcessedThisCycle := 0;\n\n\tIF rtStart.Q AND NOT doBusy THEN\n\t\tnSum := 0;\n\t\tnMax := 0;\n\t\tnPos := 0;\n\t\tnCyclesUsed := 0;\n\t\tdoDone := FALSE;\n\t\tdoBusy := TRUE;\n\tEND_IF\n\n\tIF doBusy THEN\n\t\tnEnd := MIN(nPos + CHUNK - 1, 999);\n\t\tFOR i := nPos TO nEnd DO\n\t\t\tnSum := nSum + aData[i];\n\t\t\tIF aData[i] > nMax THEN nMax := aData[i]; END_IF\n\t\t\tnProcessedThisCycle := nProcessedThisCycle + 1;\n\t\tEND_FOR\n\t\tnPos := nEnd + 1;\n\t\tnCyclesUsed := nCyclesUsed + 1;\n\t\tIF nPos > 999 THEN\n\t\t\tdoBusy := FALSE;\n\t\t\tdoDone := TRUE;\n\t\tEND_IF\n\tEND_IF\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tCHUNK : INT := 100;\nEND_VAR\nVAR\n\taData : ARRAY[0..999] OF INT;\n\ti : INT;\n\tnPos : INT;\n\tnEnd : INT;\n\trtStart : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Ergebnis ist korrekt', steps: [
            { set: { diStartCalc: true } }, { cycles: 1 }, { set: { diStartCalc: false } },
            { until: 'doDone', maxMs: 300, msg: 'Die Berechnung muss fertig werden.' },
            { expect: 'nSum = 499500 AND nMax = 999', msg: 'Summe 0 … 999 = 499500, Maximum 999.' }
          ]},
          { name: 'Höchstens 100 Elemente pro Zyklus', steps: [
            { set: { diStartCalc: true } }, { cycles: 1 },
            { expect: 'nProcessedThisCycle <= 100 AND nProcessedThisCycle > 0', msg: 'Im ersten Rechenzyklus dürfen höchstens 100 Elemente verarbeitet werden.' },
            { expect: 'doBusy AND NOT doDone', msg: 'Nach dem ersten Zyklus läuft die Berechnung noch.' },
            { set: { diStartCalc: false } }, { cycles: 4 },
            { expect: 'nProcessedThisCycle <= 100', msg: 'Auch in den Folgezyklen höchstens 100 Elemente.' }
          ]},
          { name: 'Genau 10 Rechenzyklen', steps: [
            { set: { diStartCalc: true } }, { cycles: 1 }, { set: { diStartCalc: false } },
            { until: 'doDone', maxMs: 300 },
            { expect: 'nCyclesUsed = 10 AND NOT doBusy', msg: '1000 Elemente à 100 pro Zyklus = 10 Zyklen.' },
            { cycles: 2 },
            { expect: 'nProcessedThisCycle = 0', msg: 'Nach dem Ende wird nicht weitergerechnet.' }
          ]},
          { name: 'Startflanke während der Berechnung wird ignoriert', steps: [
            { set: { diStartCalc: true } }, { cycles: 1 }, { set: { diStartCalc: false } }, { cycles: 3 },
            { set: { diStartCalc: true } }, { cycles: 1 }, { set: { diStartCalc: false } },
            { until: 'doDone', maxMs: 300 },
            { expect: 'nSum = 499500 AND nCyclesUsed = 10', msg: 'Eine zweite Startflanke darf die laufende Berechnung nicht neu starten oder verfälschen.' }
          ]},
          { name: 'Zweiter Durchlauf liefert dasselbe Ergebnis', steps: [
            { set: { diStartCalc: true } }, { cycles: 1 }, { set: { diStartCalc: false } },
            { until: 'doDone', maxMs: 300 },
            { set: { diStartCalc: true } }, { cycles: 1 }, { set: { diStartCalc: false } },
            { expect: 'doBusy AND NOT doDone', msg: 'Ein neuer Start setzt doDone zurück.' },
            { until: 'doDone', maxMs: 300 },
            { expect: 'nSum = 499500', msg: 'Die Summe muss vor jedem Durchlauf zurückgesetzt werden.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'Wiederverwendbarer Diagnose-Baustein FB_ModuleDiag',
        task: 'Schreibe den Funktionsbaustein `FB_ModuleDiag` (in AS6 stehen die Deklarationen in der `.fun`-Datei; hier schreibst du ihn in `Main.st` oberhalb der Programme) und verwende ihn für vier Module.\n\n**Schnittstelle:**\n- `VAR_INPUT`: `bModuleOk : BOOL; tDebounce : TIME; bAck : BOOL;`\n- `VAR_OUTPUT`: `bWarning : BOOL; bFault : BOOL; nFaultCount : UINT;`\n\n**Verhalten:**\n1. `bWarning` = Modul aktuell nicht OK, aber noch keine `tDebounce` lang.\n2. Ist das Modul `tDebounce` lang nicht OK, wird `bFault` gesetzt (gespeichert) und `nFaultCount` einmal erhöht.\n3. Steigende Flanke an `bAck` setzt `bFault` zurück – nur wenn `bModuleOk` wieder TRUE ist.\n\n**Programm:** Instanzen `fbDiag1 … fbDiag4` für `diModuleOk1 … 4`, `tDebounce := T#100ms`, gemeinsames `diAck`. `doAnyFault` = mindestens eine Instanz hat `bFault`. `nTotalFaults` (UINT) = Summe aller `nFaultCount`.',
        hints: ['Ein TON und ein R_TRIG gehören als interne Variablen (VAR) in den FB.', 'Die Flanke von bAck wertest du im FB aus, damit jede Instanz für sich entscheidet.'],
        cycleMs: 10,
        io: [
          { name: 'diModuleOk1', type: 'BOOL', dir: 'in', label: 'ModuleOk 1', widget: 'switch', init: true },
          { name: 'diModuleOk2', type: 'BOOL', dir: 'in', label: 'ModuleOk 2', widget: 'switch', init: true },
          { name: 'diModuleOk3', type: 'BOOL', dir: 'in', label: 'ModuleOk 3', widget: 'switch', init: true },
          { name: 'diModuleOk4', type: 'BOOL', dir: 'in', label: 'ModuleOk 4', widget: 'switch', init: true },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'doAnyFault', type: 'BOOL', dir: 'out', label: 'Sammelstörung', widget: 'led' },
          { name: 'nTotalFaults', type: 'UINT', dir: 'out', label: 'Störungen gesamt', widget: 'value' }
        ],
        files: {
          main: 'FUNCTION_BLOCK FB_ModuleDiag\n\tVAR_INPUT\n\t\tbModuleOk : BOOL;\n\t\ttDebounce : TIME;\n\t\tbAck : BOOL;\n\tEND_VAR\n\tVAR_OUTPUT\n\t\tbWarning : BOOL;\n\t\tbFault : BOOL;\n\t\tnFaultCount : UINT;\n\tEND_VAR\n\tVAR\n\t\tfbDebounce : TON;\n\t\trtAck : R_TRIG;\n\tEND_VAR\n\t(* TODO *)\nEND_FUNCTION_BLOCK\n\nPROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: vier Instanzen aufrufen und auswerten *)\nEND_PROGRAM\n',
          var: 'VAR\n\tfbDiag1 : FB_ModuleDiag;\n\tfbDiag2 : FB_ModuleDiag;\n\tfbDiag3 : FB_ModuleDiag;\n\tfbDiag4 : FB_ModuleDiag;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'FUNCTION_BLOCK FB_ModuleDiag\n\tVAR_INPUT\n\t\tbModuleOk : BOOL;\n\t\ttDebounce : TIME;\n\t\tbAck : BOOL;\n\tEND_VAR\n\tVAR_OUTPUT\n\t\tbWarning : BOOL;\n\t\tbFault : BOOL;\n\t\tnFaultCount : UINT;\n\tEND_VAR\n\tVAR\n\t\tfbDebounce : TON;\n\t\trtAck : R_TRIG;\n\tEND_VAR\n\tfbDebounce(IN := NOT bModuleOk, PT := tDebounce);\n\tIF fbDebounce.Q AND NOT bFault THEN\n\t\tbFault := TRUE;\n\t\tnFaultCount := nFaultCount + 1;\n\tEND_IF\n\tbWarning := NOT bModuleOk AND NOT fbDebounce.Q;\n\trtAck(CLK := bAck);\n\tIF rtAck.Q AND bModuleOk THEN\n\t\tbFault := FALSE;\n\tEND_IF\nEND_FUNCTION_BLOCK\n\nPROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tfbDiag1(bModuleOk := diModuleOk1, tDebounce := T#100ms, bAck := diAck);\n\tfbDiag2(bModuleOk := diModuleOk2, tDebounce := T#100ms, bAck := diAck);\n\tfbDiag3(bModuleOk := diModuleOk3, tDebounce := T#100ms, bAck := diAck);\n\tfbDiag4(bModuleOk := diModuleOk4, tDebounce := T#100ms, bAck := diAck);\n\tdoAnyFault := fbDiag1.bFault OR fbDiag2.bFault OR fbDiag3.bFault OR fbDiag4.bFault;\n\tnTotalFaults := fbDiag1.nFaultCount + fbDiag2.nFaultCount + fbDiag3.nFaultCount + fbDiag4.nFaultCount;\nEND_PROGRAM\n',
          var: 'VAR\n\tfbDiag1 : FB_ModuleDiag;\n\tfbDiag2 : FB_ModuleDiag;\n\tfbDiag3 : FB_ModuleDiag;\n\tfbDiag4 : FB_ModuleDiag;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Kurzer Aussetzer ist nur eine Warnung', steps: [
            { set: { diModuleOk2: false } }, { ms: 50 },
            { expect: 'fbDiag2.bWarning AND NOT fbDiag2.bFault AND NOT doAnyFault', msg: 'Unter 100 ms: Warnung, aber keine Störung.' },
            { set: { diModuleOk2: true } }, { ms: 200 },
            { expect: 'NOT fbDiag2.bWarning AND NOT doAnyFault AND nTotalFaults = 0', msg: 'Ein kurzer Aussetzer darf nicht als Störung gezählt werden.' }
          ]},
          { name: 'Dauerhafter Ausfall wird gespeichert und einmal gezählt', steps: [
            { set: { diModuleOk3: false } }, { ms: 500 },
            { expect: 'fbDiag3.bFault AND doAnyFault AND fbDiag3.nFaultCount = 1', msg: 'Nach 100 ms: Störung, genau einmal gezählt.' },
            { set: { diModuleOk3: true } }, { ms: 100 },
            { expect: 'fbDiag3.bFault', msg: 'Die Störung bleibt gespeichert, bis quittiert wird.' }
          ]},
          { name: 'Quittieren nur bei OK-Modul', steps: [
            { set: { diModuleOk1: false } }, { ms: 300 },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'fbDiag1.bFault', msg: 'Quittieren bei anstehendem Fehler darf die Störung nicht löschen.' },
            { set: { diModuleOk1: true } }, { cycles: 2 },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'NOT fbDiag1.bFault AND NOT doAnyFault AND fbDiag1.nFaultCount = 1', msg: 'Nach Quittieren bei OK-Modul ist die Störung weg, der Zähler bleibt.' }
          ]},
          { name: 'Instanzen sind unabhängig', steps: [
            { set: { diModuleOk2: false, diModuleOk4: false } }, { ms: 300 },
            { set: { diModuleOk2: true } }, { cycles: 2 },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'NOT fbDiag2.bFault AND fbDiag4.bFault', msg: 'Modul 2 lässt sich quittieren, Modul 4 (weiter gestört) nicht.' },
            { expect: 'nTotalFaults = 2 AND fbDiag1.nFaultCount = 0', msg: 'Zwei Störungen gesamt, Modul 1 unbeteiligt.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'system-5-diagnosekonzept',
    level: 5,
    kind: 'projekt',
    title: 'Praxisprojekt: Diagnosekonzept für den Service mit Sensor-Plausibilisierung',
    summary: 'Du entwirfst ein Diagnosekonzept mit Meldecodes, Prioritäten und Quittierregeln und setzt es an einer redundanten Druckmessung mit 2-aus-3-Auswertung um.',
    minutes: 360,
    req: ['system-5-architektur'],
    briefing: 'Ein Diagnosekonzept beantwortet für jede Störung drei Fragen: **Was** ist passiert (eindeutiger Code und Text), **wo** (Einheit, Modul, Kanal) und **was ist zu tun** (Handlungsanweisung, Quittierregel). Es legt Prioritäten fest, damit bei einer Fehlerkaskade die Ursache oben steht, und es trennt Sammelmeldungen für den Bediener von Detaildiagnose für den Service. Systemseitig stützt es sich auf ModuleOk, Logger, SDM und System Dump; anwendungsseitig auf eigene Plausibilisierung. Ein klassisches Beispiel ist die **redundante Messung**: Drei Sensoren messen dieselbe Größe. Der Median ist robust gegen einen Ausreißer; ein Sensor, der zu lange vom Median abweicht, wird als defekt markiert. Mit zwei gesunden Sensoren läuft die Anlage eingeschränkt weiter, mit weniger muss sie in einen sicheren Zustand. Diese Logik ersetzt **keine** Sicherheitsfunktion nach Maschinenrichtlinie – sie verbessert Verfügbarkeit und Diagnose.',
    practice: 'Ein Drucksensor driftet langsam weg. Ohne Plausibilisierung regelt die Anlage auf einen falschen Wert und produziert Ausschuss. Mit 2-aus-3-Auswertung läuft sie weiter, meldet "Sensor 3 abweichend" und der Service tauscht gezielt das richtige Teil.',
    transfer: {
      tia: 'In TIA übernehmen ProDiag bzw. Meldeklassen und Systemdiagnose das Meldekonzept; 2-aus-3-Auswertungen werden im Anwenderprogramm (oder in F-Programmen für Sicherheitsfunktionen) gebaut.',
      codesys: 'CODESYS nutzt den Alarm-Manager mit Alarmklassen; TwinCAT den EventLogger. Die Plausibilisierung selbst ist Anwendungscode, für Sicherheitsfunktionen TwinSAFE/SafetyPLC.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf die Meldestruktur',
        guide: {
          intro: 'Bevor du Codes vergibst, legst du Klassen, Prioritäten und Quittierregeln fest.',
          steps: [
            'Definiere Meldeklassen: Information, Warnung, Störung (Maschine hält), Systemfehler.',
            'Lege ein Codeschema fest, z. B. Hunderterstelle = Art (1xx Messbereich, 2xx Abweichung, 9xx kein gültiger Messwert), Einerstelle = Sensor.',
            'Bestimme Prioritäten: Welche Meldung verdrängt welche in der Anzeige?',
            'Lege je Klasse fest, ob und wann quittiert werden darf.'
          ],
          done: 'Erledigt, wenn Klassen, Codeschema, Prioritäten und Quittierregeln in einer Tabelle stehen.',
          tip: 'Codes einmal vergeben, nie umnummerieren. Service-Handbücher, Ersatzteillisten und Kundendokumentation verweisen darauf.'
        }
      },
      {
        id: 'o2',
        title: 'Plane die Systemdiagnose für den Service',
        guide: {
          intro: 'Neben deinen eigenen Meldungen nutzt der Service die Systemwerkzeuge. Das Konzept sagt, wann welches Werkzeug zum Einsatz kommt.',
          steps: [
            'Lege fest, welche Informationen der Bediener am HMI sieht und welche der Service über den SDM abruft.',
            'Beschreibe den Ablauf bei einer unbekannten Störung: Logger lesen, System Dump ziehen, Trace anstoßen.',
            'Prüfe, ob der SDM im Projekt aktiviert und vom Servicenetz erreichbar ist (Fernwartung nach BSI-Empfehlung).',
            'Ergänze die Rückmeldeschleife: Wie fließen Erkenntnisse aus dem Feld in neue Diagnosen ein?'
          ],
          done: 'Erledigt, wenn dein Konzept den Weg vom Bedienerhinweis bis zum System Dump beschreibt.',
          tip: 'Ein System Dump vor und nach jedem Eingriff dokumentiert den Zustand der Maschine besser als jedes Protokoll.',
          link: { label: 'B&R Help: SDM – System Dump', url: 'https://help.br-automation.com/#/de/6/automationruntime/targets/sdm/sdm/sdm2_sdmpage_systemdump.html' }
        }
      },
      {
        id: 'o3',
        title: 'Setze die 2-aus-3-Auswertung um',
        guide: {
          intro: 'Die Übung enthält die vollständige Anforderung. Lies sie zweimal, bevor du anfängst.',
          steps: [
            'Implementiere Messbereichsprüfung, Median, Abweichungsüberwachung mit Entprellzeit und Ergebnisbildung.',
            'Teste zuerst Normalfall, dann jeden Fehlerfall einzeln.',
            'Prüfe Grenzfälle: Was passiert genau an der Grenze 0,5 bar? Was bei zwei gleichzeitig defekten Sensoren?',
            'Kapsle die Auswertung in deinem AS6-Projekt als Funktionsbaustein, damit sie für weitere Messstellen wiederverwendbar ist.'
          ],
          done: 'Erledigt, wenn alle Tests grün sind und die Auswertung als FB in deinem Projekt vorliegt.',
          tip: 'Median von drei Werten: `MAX(MIN(a, b), MIN(MAX(a, b), c))` – ohne Sortieren.'
        }
      },
      {
        id: 'o4',
        title: 'Reiche das Diagnosekonzept ein',
        guide: {
          intro: 'Das Konzept ist ein Dokument für Kollegen aus Service und Konstruktion – schreibe es so, dass sie es ohne dich verstehen.',
          steps: [
            'Fasse Meldestruktur, Systemdiagnose-Ablauf und die Sensor-Plausibilisierung in einem Dokument zusammen.',
            'Lege Dokument und AS6-Projekt im Repository auf git.breitner.de ab.',
            'Lass das Konzept von einer zweiten Person gegenlesen und arbeite die Rückmeldung ein.',
            'Reiche den Link als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link mit gegengelesenem Konzept eingereicht ist.',
          tip: 'Ein gutes Diagnosekonzept erkennst du daran, dass der Service mit ihm einen Fehler findet, den du selbst nicht vorhergesehen hast.'
        }
      }
    ],
    videos: [
      v('PvfSQi4rh7Y', 'de', 'Herstellerübergreifend: integriertes System für Diagnose und Instandhaltung einer Anlage.'),
      v('FgccDJ2MK9c', 'de', 'Festo Didactic zu intelligenter Instandhaltung – wohin sich Diagnosekonzepte entwickeln.'),
      v('l6qDxm0LFQQ', 'en', 'Grundlagen redundanter Sensorik und warum Redundanz die Verfügbarkeit erhöht.')
    ],
    readings: [
      r('iasStrukturen', 'Hochschulfolien zu Automatisierungsstrukturen mit Redundanz (Abschnitt 2.5).'),
      r('bsiIcs', 'Amtliches Kompendium zur Sicherheit industrieller Steuerungen – Rahmen für Fernzugriff auf Diagnosedaten.'),
      r('hSdmDump', 'Der System Dump als Kern der Servicediagnose.')
    ],
    quiz: [
      { type: 'single', q: 'Drei Sensoren messen 5,0 / 5,1 / 9,0 bar. Welcher Wert ist als Median robust?',
        options: ['5,0 bar', '5,1 bar', '6,37 bar (Mittelwert)', '9,0 bar'],
        correct: 1, explain: 'Der Median ignoriert den Ausreißer 9,0; der Mittelwert wird von ihm verzerrt.' },
      { type: 'single', q: 'Warum bekommt die Abweichungsüberwachung eine Entprellzeit?',
        options: ['Um Rechenzeit zu sparen', 'Damit kurze Störungen (z. B. Druckspitzen) nicht sofort einen Sensor als defekt markieren', 'Weil REAL-Vergleiche sonst nicht funktionieren', 'Damit der Logger nicht voll läuft'],
        correct: 1, explain: 'Entprellung unterscheidet kurzzeitige Ereignisse von dauerhaften Abweichungen.' },
      { type: 'single', q: 'Ersetzt eine 2-aus-3-Auswertung im Standardprogramm eine Sicherheitsfunktion?',
        options: ['Ja, immer', 'Nein; Sicherheitsfunktionen erfordern zertifizierte Sicherheitstechnik und Bewertung nach den einschlägigen Normen', 'Ja, wenn die Zykluszeit kurz ist', 'Nur bei Drucksensoren'],
        correct: 1, explain: 'Die Plausibilisierung verbessert Verfügbarkeit und Diagnose, ist aber keine Sicherheitsfunktion.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Fragen muss ein gutes Diagnosekonzept für jede Störung beantworten?',
        options: ['Was ist passiert?', 'Wo ist es passiert?', 'Was ist zu tun?', 'Wer hat den Code geschrieben?'],
        correct: [0, 1, 2], explain: 'Was, wo und Handlungsanweisung – das ist die Basis jeder brauchbaren Meldung.' },
      { type: 'single', q: 'Bei der redundanten Messung fallen zwei von drei Sensoren aus. Was ist die richtige Reaktion?',
        options: ['Mit dem verbleibenden Sensor normal weiterfahren', 'Kein gültiger Messwert mehr: Störung melden und Prozess in einen definierten Zustand bringen', 'Den letzten gültigen Wert einfrieren und weiterfahren', 'Nichts tun'],
        correct: 1, explain: 'Mit einem Sensor ist keine Plausibilisierung mehr möglich.' },
      { type: 'numeric', q: 'Zwei verbleibende Sensoren messen {A} bar und {B} bar. Welcher Ersatzwert (Mittelwert) wird verwendet?',
        params: { A: [4, 6, 0.1], B: [4, 6, 0.1] }, formula: '(A + B) / 2', unit: 'bar', tol: 0.01,
        explain: 'Mittelwert der beiden gesunden Sensoren.' },
      { type: 'single', q: 'Warum verdrängt die Meldung "kein gültiger Messwert" (9xx) in der Anzeige eine einzelne Sensorabweichung (2xx)?',
        options: ['Weil höhere Zahlen wichtiger sind', 'Weil sie den gravierenderen Zustand beschreibt und die Handlung des Bedieners bestimmt', 'Weil sie zuerst auftritt', 'Weil 2xx-Meldungen nicht quittierbar sind'],
        correct: 1, explain: 'Die Priorität richtet sich nach der Auswirkung auf den Prozess.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Redundante Druckmessung mit 2-aus-3-Auswertung',
        task: 'Drei Drucksensoren liefern `rP1`, `rP2`, `rP3` (REAL, bar, Messbereich 0 … 10 bar).\n\n1. **Messbereich:** Ein Wert < 0.0 oder > 10.0 ist ungültig (Drahtbruch/Kurzschluss). Der Sensor ist sofort nicht gesund.\n2. **Abweichung:** Sind alle drei Sensoren im Messbereich und nicht gesperrt, wird jeder mit dem **Median** verglichen. Weicht ein Sensor **mehr als 0.5 bar** ab, und zwar länger als **200 ms**, wird er **gesperrt** (gespeichert).\n3. **Gesund** = im Messbereich und nicht gesperrt.\n4. **Ergebnis `rPValid`:** 3 gesunde → Median; 2 gesunde → Mittelwert der beiden und `doDegraded := TRUE`; weichen diese beiden mehr als 0.5 bar voneinander ab oder sind weniger als 2 gesund → `doSensorFault := TRUE`, `rPValid := 0.0`.\n5. **Quittieren:** Steigende Flanke an `diAck` hebt alle Sperren auf (besteht die Abweichung weiter, sperrt die Überwachung nach 200 ms erneut).\n6. **Diagnosecode `nDiag`** (höchste Priorität zuerst): 900 = kein gültiger Messwert (`doSensorFault`); 101 … 103 = Messbereichsfehler Sensor 1 … 3 (kleinster Index); 201 … 203 = Sensor 1 … 3 gesperrt; 0 = alles in Ordnung.',
        hints: ['Median: `MAX(MIN(a, b), MIN(MAX(a, b), c))`.', 'Je Sensor ein TON: `fbDev1(IN := bCompare AND ABS(rP1 - rMedian) > 0.5, PT := T#200ms);`', 'Zähle die gesunden Sensoren und entscheide dann mit IF/ELSIF über das Ergebnis.'],
        cycleMs: 10,
        io: [
          { name: 'rP1', type: 'REAL', dir: 'in', label: 'Drucksensor 1', widget: 'slider', min: -2, max: 12, unit: 'bar', init: 5.0 },
          { name: 'rP2', type: 'REAL', dir: 'in', label: 'Drucksensor 2', widget: 'slider', min: -2, max: 12, unit: 'bar', init: 5.1 },
          { name: 'rP3', type: 'REAL', dir: 'in', label: 'Drucksensor 3', widget: 'slider', min: -2, max: 12, unit: 'bar', init: 4.9 },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'rPValid', type: 'REAL', dir: 'out', label: 'Plausibler Druck', widget: 'gauge', min: 0, max: 10, unit: 'bar' },
          { name: 'doDegraded', type: 'BOOL', dir: 'out', label: 'Eingeschränkter Betrieb (2 Sensoren)', widget: 'led' },
          { name: 'doSensorFault', type: 'BOOL', dir: 'out', label: 'Kein gültiger Messwert', widget: 'led' },
          { name: 'nDiag', type: 'INT', dir: 'out', label: 'Diagnosecode', widget: 'value' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO 1: Messbereich *)\n\t(* TODO 2: Median und Abweichungsüberwachung *)\n\t(* TODO 3: Ergebnis *)\n\t(* TODO 4: Quittieren und Diagnosecode *)\n\trPValid := (rP1 + rP2 + rP3) / 3.0;\nEND_PROGRAM\n',
          var: 'VAR\n\tbRange1 : BOOL;\n\tbRange2 : BOOL;\n\tbRange3 : BOOL;\n\tbLock1 : BOOL;\n\tbLock2 : BOOL;\n\tbLock3 : BOOL;\n\tbHealthy1 : BOOL;\n\tbHealthy2 : BOOL;\n\tbHealthy3 : BOOL;\n\tbCompare : BOOL;\n\trMedian : REAL;\n\trA : REAL;\n\trB : REAL;\n\tnHealthy : INT;\n\tfbDev1 : TON;\n\tfbDev2 : TON;\n\tfbDev3 : TON;\n\trtAck : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Quittieren: Sperren aufheben *)\n\trtAck(CLK := diAck);\n\tIF rtAck.Q THEN\n\t\tbLock1 := FALSE; bLock2 := FALSE; bLock3 := FALSE;\n\tEND_IF\n\n\t(* 1: Messbereich *)\n\tbRange1 := (rP1 >= 0.0) AND (rP1 <= 10.0);\n\tbRange2 := (rP2 >= 0.0) AND (rP2 <= 10.0);\n\tbRange3 := (rP3 >= 0.0) AND (rP3 <= 10.0);\n\n\t(* 2: Median und Abweichung *)\n\tbCompare := bRange1 AND bRange2 AND bRange3 AND NOT bLock1 AND NOT bLock2 AND NOT bLock3;\n\trMedian := MAX(MIN(rP1, rP2), MIN(MAX(rP1, rP2), rP3));\n\tfbDev1(IN := bCompare AND (ABS(rP1 - rMedian) > 0.5), PT := T#200ms);\n\tfbDev2(IN := bCompare AND (ABS(rP2 - rMedian) > 0.5), PT := T#200ms);\n\tfbDev3(IN := bCompare AND (ABS(rP3 - rMedian) > 0.5), PT := T#200ms);\n\tIF fbDev1.Q THEN bLock1 := TRUE; END_IF\n\tIF fbDev2.Q THEN bLock2 := TRUE; END_IF\n\tIF fbDev3.Q THEN bLock3 := TRUE; END_IF\n\n\t(* 3: gesunde Sensoren *)\n\tbHealthy1 := bRange1 AND NOT bLock1;\n\tbHealthy2 := bRange2 AND NOT bLock2;\n\tbHealthy3 := bRange3 AND NOT bLock3;\n\tnHealthy := 0;\n\tIF bHealthy1 THEN nHealthy := nHealthy + 1; END_IF\n\tIF bHealthy2 THEN nHealthy := nHealthy + 1; END_IF\n\tIF bHealthy3 THEN nHealthy := nHealthy + 1; END_IF\n\n\t(* 4: Ergebnis *)\n\tdoDegraded := FALSE;\n\tdoSensorFault := FALSE;\n\tIF nHealthy = 3 THEN\n\t\trPValid := rMedian;\n\tELSIF nHealthy = 2 THEN\n\t\tIF NOT bHealthy1 THEN rA := rP2; rB := rP3;\n\t\tELSIF NOT bHealthy2 THEN rA := rP1; rB := rP3;\n\t\tELSE rA := rP1; rB := rP2;\n\t\tEND_IF\n\t\tIF ABS(rA - rB) > 0.5 THEN\n\t\t\tdoSensorFault := TRUE;\n\t\t\trPValid := 0.0;\n\t\tELSE\n\t\t\tdoDegraded := TRUE;\n\t\t\trPValid := (rA + rB) / 2.0;\n\t\tEND_IF\n\tELSE\n\t\tdoSensorFault := TRUE;\n\t\trPValid := 0.0;\n\tEND_IF\n\n\t(* 5: Diagnosecode nach Priorität *)\n\tIF doSensorFault THEN nDiag := 900;\n\tELSIF NOT bRange1 THEN nDiag := 101;\n\tELSIF NOT bRange2 THEN nDiag := 102;\n\tELSIF NOT bRange3 THEN nDiag := 103;\n\tELSIF bLock1 THEN nDiag := 201;\n\tELSIF bLock2 THEN nDiag := 202;\n\tELSIF bLock3 THEN nDiag := 203;\n\tELSE nDiag := 0;\n\tEND_IF\nEND_PROGRAM\n',
          var: 'VAR\n\tbRange1 : BOOL;\n\tbRange2 : BOOL;\n\tbRange3 : BOOL;\n\tbLock1 : BOOL;\n\tbLock2 : BOOL;\n\tbLock3 : BOOL;\n\tbHealthy1 : BOOL;\n\tbHealthy2 : BOOL;\n\tbHealthy3 : BOOL;\n\tbCompare : BOOL;\n\trMedian : REAL;\n\trA : REAL;\n\trB : REAL;\n\tnHealthy : INT;\n\tfbDev1 : TON;\n\tfbDev2 : TON;\n\tfbDev3 : TON;\n\trtAck : R_TRIG;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Normalfall: Median', steps: [
            { set: { rP1: 5.0, rP2: 5.1, rP3: 4.9 } }, { cycles: 5 },
            { expect: 'ABS(rPValid - 5.0) < 0.001 AND NOT doDegraded AND NOT doSensorFault AND nDiag = 0', msg: 'Drei gesunde Sensoren: Median 5,0 bar, Code 0.' }
          ]},
          { name: 'Drahtbruch an Sensor 2', steps: [
            { set: { rP1: 5.0, rP2: -1.0, rP3: 4.9 } }, { cycles: 3 },
            { expect: 'doDegraded AND NOT doSensorFault AND nDiag = 102', msg: 'Sensor 2 außerhalb des Messbereichs: eingeschränkter Betrieb, Code 102.' },
            { expect: 'ABS(rPValid - 4.95) < 0.001', msg: 'Ersatzwert = Mittelwert aus 5,0 und 4,9.' }
          ]},
          { name: 'Drift an Sensor 3 wird nach 200 ms gesperrt', steps: [
            { set: { rP1: 5.0, rP2: 5.1, rP3: 6.0 } }, { cycles: 5 },
            { expect: 'NOT doDegraded AND ABS(rPValid - 5.1) < 0.001', msg: 'Vor Ablauf der Entprellzeit: noch Median (5,1).' },
            { ms: 300 },
            { expect: 'doDegraded AND nDiag = 203 AND ABS(rPValid - 5.05) < 0.001', msg: 'Nach 200 ms ist Sensor 3 gesperrt; Ersatzwert 5,05, Code 203.' },
            { set: { rP3: 5.0 } }, { cycles: 5 },
            { expect: 'doDegraded AND nDiag = 203', msg: 'Die Sperre bleibt gespeichert, auch wenn der Wert zurückkommt.' },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'NOT doDegraded AND nDiag = 0', msg: 'Nach dem Quittieren ist Sensor 3 wieder gesund.' }
          ]},
          { name: 'Zwei Sensoren außerhalb des Messbereichs', steps: [
            { set: { rP1: 11.0, rP2: -1.0, rP3: 5.0 } }, { cycles: 3 },
            { expect: 'doSensorFault AND rPValid = 0.0 AND nDiag = 900', msg: 'Nur ein gesunder Sensor: kein gültiger Messwert, Code 900.' }
          ]},
          { name: 'Kurze Spitze wird toleriert', steps: [
            { set: { rP1: 7.0, rP2: 5.1, rP3: 4.9 } }, { ms: 100 },
            { set: { rP1: 5.0 } }, { ms: 500 },
            { expect: 'NOT doDegraded AND NOT doSensorFault AND nDiag = 0', msg: 'Eine Abweichung unter 200 ms darf keinen Sensor sperren.' }
          ]},
          { name: 'Zwei gesunde, aber widersprüchliche Sensoren', steps: [
            { set: { rP1: 5.0, rP2: -1.0, rP3: 6.0 } }, { cycles: 3 },
            { expect: 'doSensorFault AND nDiag = 900', msg: 'Die beiden verbleibenden Sensoren weichen 1 bar voneinander ab: kein gültiger Messwert.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Diagnose-Architekt'
  }
];
