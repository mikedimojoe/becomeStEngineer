'use strict';
const { ABGERUFEN, H, brHelp } = require('./_common');

module.exports = [
  // ───────────────────────────── L5 · Companion Specifications & PackML ─────────────────────────────
  {
    id: 'komm-5-companion',
    level: 5,
    kind: 'lektion',
    title: 'OPC UA Companion Specifications und PackML-Schnittstelle',
    summary: 'Statt eigener Schnittstellen nutzt du standardisierte Informationsmodelle: OPC UA Companion Specifications und das PackML-Zustandsmodell (ISA-TR88.00.02, OPC 30050).',
    minutes: 270,
    req: ['komm-4-opcua-client'],
    briefing: 'Jede selbst erfundene Schnittstelle muss beim Kunden neu erklärt, neu implementiert und neu getestet werden. Companion Specifications lösen das: Branchenverbände (VDMA, OMAC, OPC Foundation u. a.) definieren gemeinsame Informationsmodelle, z. B. für Verpackungsmaschinen (PackML), Spritzgießmaschinen (EUROMAP) oder Machinery (OPC 40001). ' +
      'PackML beschreibt ein Zustandsmodell mit 17 Zuständen, standardisierten Befehlen und den PackTags (Command, Status, Admin). ' +
      'B&R unterstützt PackML mit **mapp PackML**, das du in diesem Modul konzeptionell kennenlernst. In der Übung implementierst du einen Ausschnitt des Zustandsmodells selbst, um die Regeln wirklich zu verstehen.',
    practice: 'Ein Getränkehersteller verlangt, dass alle Maschinen seiner Linie PackML sprechen. Das Linien-MES schickt Befehle (Reset, Start, Hold …) per OPC UA und erwartet den StateCurrent-Wert nach Standard – egal, welcher Hersteller die Maschine gebaut hat.',
    transfer: {
      tia: 'Siemens bietet die „OMAC PackML“-Bibliothek (LPMLV30) und OPC-UA-Companion-Spec-Unterstützung über Server-Schnittstellen im TIA Portal.',
      codesys: 'Für CODESYS/TwinCAT gibt es PackML-Bibliotheken (z. B. TwinCAT PackML) und die Einbindung von NodeSet-XML-Dateien in den OPC-UA-Server.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre Aufbau und Nutzen einer Companion Specification',
        guide: {
          intro: 'Eine Companion Specification ist ein OPC-UA-Informationsmodell (ObjectTypes, VariableTypes, DataTypes) für eine Domäne, ausgeliefert als NodeSet2-XML.',
          steps: [
            'Öffne die OPC UA Online Reference und sieh dir die Liste der Companion Specifications an.',
            'Wähle PackML (OPC 30050) und finde die Typen für Status, Command und Admin.',
            'Erkläre den Unterschied zwischen Basismodell (OPC UA Part 5), Companion Specification und herstellerspezifischer Erweiterung.',
            'Notiere, wie ein Client eine konforme Maschine erkennt: über den Typ (HasTypeDefinition) und den Namespace-URI der Companion Specification.'
          ],
          done: 'Erledigt, wenn du an PackML zeigen kannst, welche Nodes standardisiert sind und wo herstellerspezifische Daten hingehören.',
          tip: 'Prüfe vor jedem Projekt, ob es für die Branche bereits eine Companion Specification gibt – das spart Spezifikationsaufwand und Diskussionen.',
          link: { label: 'OPC 30050: PackML', url: 'https://reference.opcfoundation.org/PackML/v101/docs/' }
        }
      },
      {
        id: 'o2',
        title: 'Beschreibe das PackML-Zustandsmodell',
        guide: {
          intro: 'PackML unterscheidet Wartezustände (Stopped, Idle, Held, Suspended, Complete, Aborted), Acting-Zustände (z. B. Resetting, Starting, Stopping) und Execute.',
          steps: [
            'Zeichne das Zustandsdiagramm mit den StateCurrent-Werten: 1 Clearing, 2 Stopped, 3 Starting, 4 Idle, 5 Suspended, 6 Execute, 7 Stopping, 8 Aborting, 9 Aborted, 10 Holding, 11 Held, 12 Unholding, 13 Suspending, 14 Unsuspending, 15 Resetting, 16 Completing, 17 Complete.',
            'Trage die Befehle (CntrlCmd) ein: 1 Reset, 2 Start, 3 Stop, 4 Hold, 5 Unhold, 6 Suspend, 7 Unsuspend, 8 Abort, 9 Clear.',
            'Markiere, wann ein Acting-Zustand von selbst endet („State Complete“, SC) und wann ein Befehl nötig ist.',
            'Markiere die Zustände, aus denen Stop bzw. Abort möglich sind.'
          ],
          done: 'Erledigt, wenn dein Diagramm alle Zustände, Befehle und SC-Übergänge enthält.',
          tip: 'Unit Modes (Production, Maintenance, Manual) legen fest, welche Zustände überhaupt erreichbar sind – das kommt noch dazu.'
        }
      },
      {
        id: 'o3',
        title: 'Ordne mapp PackML in ein AS6-Projekt ein',
        guide: {
          intro: 'mapp PackML stellt Zustandsmaschine, PackTags und Auditing als konfigurierbare mapp-Komponente bereit.',
          steps: [
            'Lies in der B&R-Hilfe den Einstieg „mapp PackML: OMAC PackML standard“ und die Getting-Started-Anleitung.',
            'Notiere, welche Konfiguration (Unit Modes, Zustände) in der Configuration View und welche Logik im Programm liegt.',
            'Lies den Abschnitt zur PackTags-Struktur und vergleiche sie mit OPC 30050.',
            'Skizziere, wie du die PackTags über die OPC UA Default View bzw. ein Informationsmodell nach außen gibst.'
          ],
          done: 'Erledigt, wenn du die Aufteilung zwischen mapp-PackML-Konfiguration und eigener Applikationslogik erklären kannst.',
          tip: 'Auch mit mapp PackML musst du die Acting-Zustände (z. B. was beim Starting passiert) selbst programmieren – mapp liefert den Rahmen.',
          link: { label: 'B&R Help: mapp PackML', url: H('services/mapp_services/mppackml/mppackml.html') }
        }
      },
      {
        id: 'o4',
        title: 'Implementiere einen PackML-Ausschnitt mit Befehlsprüfung',
        guide: {
          intro: 'In der Übung programmierst du die Zustände Stopped, Resetting, Idle, Starting, Execute, Holding, Held, Unholding, Stopping, Aborting, Aborted und Clearing.',
          steps: [
            'Lege die PackTags-Struktur (Command, Status) an.',
            'Werte Befehle nur bei CmdChangeRequest aus und quittiere durch Rücksetzen.',
            'Lehne Befehle ab, die im aktuellen Zustand nicht erlaubt sind, und zähle sie.',
            'Beende Acting-Zustände über einen „State Complete“-Timer.',
            'Setze Abort bei NOT-HALT aus jedem Zustand außer Aborting/Aborted durch.'
          ],
          done: 'Erledigt, wenn deine Übung alle Tests besteht.',
          tip: 'Teste die Übergänge systematisch mit einer Zustandsübergangstabelle – jede Zeile wird ein Testfall.'
        }
      }
    ],
    videos: [
      { id: 'CQS-R5COOLw', title: 'What is PackML?', channel: 'OMAC—Organization for Machine Automation & Control', lang: 'en', why: 'Einführung direkt von OMAC, dem Herausgeber von PackML.' },
      { id: 'bkbLVDs84nQ', title: '3.7 Integrating OPC UA Companion Specs into PLC by Schneider-Electric', channel: 'TheOPCFoundation', lang: 'en', why: 'Zeigt die Integration einer Companion Specification in eine Steuerung.' },
      { id: 'odDQ83bzoWE', title: 'Why We Need VDMA OPC UA Companion Specification!', channel: 'rua vdma', lang: 'en', why: 'Begründet den Nutzen standardisierter Informationsmodelle aus Sicht des Maschinenbaus.' }
    ],
    readings: [
      {
        title: 'OPC 30050: PackML – Packaging Machine Language', author: 'OPC Foundation & OMAC', institution: 'OPC Foundation',
        work: 'OPC UA Online Reference, Companion Specification', year: 2020, type: 'Dokumentation', minutes: 45,
        url: 'https://reference.opcfoundation.org/PackML/v101/docs/',
        why: 'Das standardisierte OPC-UA-Informationsmodell für PackML.',
        apa: 'OPC Foundation & OMAC. (2020). *OPC 30050: PackML – Packaging Machine Language* (Version 1.01). OPC Foundation. ' + ABGERUFEN + 'https://reference.opcfoundation.org/PackML/v101/docs/'
      },
      {
        title: 'PackML', author: 'OMAC', institution: 'Organization for Machine Automation and Control',
        work: 'Technologie-Übersicht', year: 2026, type: 'Dokumentation', minutes: 15,
        url: 'https://www.omac.org/packml',
        why: 'Herausgeberseite mit Überblick über Zustandsmodell und PackTags.',
        apa: 'OMAC. (2026). *PackML*. Organization for Machine Automation and Control. ' + ABGERUFEN + 'https://www.omac.org/packml'
      },
      brHelp('mapp PackML: OMAC PackML standard', 'services/mapp_services/mppackml/mppackml.html', 'Wie B&R PackML als mapp-Komponente umsetzt.', 25)
    ],
    quiz: [
      {
        type: 'single', q: 'Welcher StateCurrent-Wert steht in PackML für „Execute“?',
        options: ['2', '4', '6', '11'], correct: 2,
        explain: '2 = Stopped, 4 = Idle, 6 = Execute, 11 = Held.'
      },
      {
        type: 'single', q: 'Die Maschine ist in Stopped. Das MES schickt Start (CntrlCmd = 2). Was passiert nach PackML?',
        options: ['Die Maschine geht nach Starting.', 'Der Befehl ist in Stopped nicht zulässig; erst Reset führt über Resetting nach Idle.', 'Die Maschine geht nach Execute.', 'Die Maschine geht nach Aborting.'], correct: 1,
        explain: 'Start ist nur in Idle zulässig. Aus Stopped führt Reset nach Resetting → Idle.'
      },
      {
        type: 'multi', q: 'Was bringt eine Companion Specification?',
        options: ['Herstellerübergreifend gleiche Struktur und Semantik', 'Weniger Integrationsaufwand beim Kunden', 'Automatische Echtzeitfähigkeit', 'Erkennbarkeit über standardisierte Typen und Namespace'], correct: [0, 1, 3],
        explain: 'Companion Specifications standardisieren das Informationsmodell, nicht das Zeitverhalten.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Welcher Zustand ist in PackML ein „Acting“-Zustand, der nach Abschluss seiner Aktion (SC) automatisch weiterschaltet?',
        options: ['Idle', 'Held', 'Resetting', 'Aborted'], correct: 2,
        explain: 'Resetting, Starting, Stopping, Aborting, Clearing, Holding, Unholding usw. sind Acting-Zustände.'
      },
      {
        type: 'single', q: 'Aus welchem Zustand führt der Befehl Clear?',
        options: ['Aus Aborted über Clearing nach Stopped', 'Aus Held nach Execute', 'Aus Idle nach Stopped', 'Aus Execute nach Complete'], correct: 0,
        explain: 'Clear ist der Weg aus Aborted (nach Behebung der Ursache) über Clearing nach Stopped.'
      },
      {
        type: 'multi', q: 'Welche Gruppen gehören zu den PackTags?',
        options: ['Command', 'Status', 'Admin', 'Motion'], correct: [0, 1, 2],
        explain: 'PackTags sind in Command, Status und Admin gegliedert.'
      },
      {
        type: 'single', q: 'In welchem Format werden OPC-UA-Informationsmodelle (z. B. Companion Specifications) ausgetauscht?',
        options: ['GSDML', 'NodeSet2-XML', 'IODD', 'JSON Schema'], correct: 1,
        explain: 'Informationsmodelle werden als NodeSet2-XML-Dateien verteilt und in Server importiert.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'PackML-Zustandsmaschine (Ausschnitt)',
        task: 'Implementiere einen Ausschnitt des PackML-Zustandsmodells mit der Schnittstelle `gPackTags` (Typen sind vorgegeben).\n\n' +
          '**Zustände (StateCurrent):** 1 Clearing, 2 Stopped, 3 Starting, 4 Idle, 6 Execute, 7 Stopping, 8 Aborting, 9 Aborted, 10 Holding, 11 Held, 12 Unholding, 15 Resetting.\n\n' +
          '**Befehle (CntrlCmd):** 1 Reset, 2 Start, 3 Stop, 4 Hold, 5 Unhold, 8 Abort, 9 Clear.\n\n' +
          '**Anforderungen:**\n' +
          '1. Startzustand ist Stopped (2).\n' +
          '2. Ein Befehl wird nur ausgewertet, wenn `Command.CmdChangeRequest` = TRUE ist; die SPS setzt das Bit danach zurück.\n' +
          '3. Erlaubt sind: Reset in Stopped → Resetting; Start in Idle → Starting; Hold in Execute → Holding; Unhold in Held → Unholding; Stop in allen Zuständen außer Stopped, Stopping, Aborting, Aborted, Clearing → Stopping; Abort außer in Aborting/Aborted → Aborting; Clear in Aborted → Clearing, aber nur wenn `diEStop` (Öffner) TRUE ist.\n' +
          '4. Nicht erlaubte Befehle ändern nichts, erhöhen aber `Status.RejectCount` (nicht Teil von PackML, Diagnose-Erweiterung).\n' +
          '5. Acting-Zustände enden nach **200 ms** (State Complete): Resetting → Idle, Starting → Execute, Holding → Held, Unholding → Execute, Stopping → Stopped, Aborting → Aborted, Clearing → Stopped. Der Timer muss bei jedem Zustandswechsel neu starten.\n' +
          '6. `diEStop` = FALSE erzwingt Aborting aus jedem Zustand außer Aborting/Aborted.\n' +
          '7. `Status.CurMachSpeed` = `Command.MachSpeed` in Execute, sonst 0.\n\n' +
          'Der Startcode schaltet Befehle direkt in den Zielzustand – ohne Acting-Zustände, ohne Prüfung.',
        hints: ['Zustandswechsel erkennen: `bEntry := gPackTags.Status.StateCurrent <> diPrevState; diPrevState := gPackTags.Status.StateCurrent;`', 'bActing := Zustand ist 1, 3, 7, 8, 10, 12 oder 15. Timer: fbSC(IN := bActing AND NOT bEntry, PT := T#200ms);', 'Werte Befehle mit einer Variablen bAccepted aus; am Ende IF NOT bAccepted THEN RejectCount + 1.'],
        cycleMs: 10,
        io: [
          { name: 'gPackTags', type: 'typPackTags', dir: 'out', label: 'PackTags (Command vom MES, Status an das MES)' },
          { name: 'diEStop', type: 'BOOL', dir: 'in', label: 'NOT-HALT-Kreis geschlossen (Öffner)', widget: 'switch', init: true }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT
	gPackTags.Status.StateCurrent := 2;
END_PROGRAM

PROGRAM _CYCLIC
	IF gPackTags.Command.CmdChangeRequest THEN
		gPackTags.Command.CmdChangeRequest := FALSE;
		CASE gPackTags.Command.CntrlCmd OF
			1: gPackTags.Status.StateCurrent := 4;
			2: gPackTags.Status.StateCurrent := 6;
			3: gPackTags.Status.StateCurrent := 2;
		END_CASE;
	END_IF;
	(* TODO: Acting-Zustände, Befehlsprüfung, Hold/Unhold, Abort/Clear, NOT-HALT, Geschwindigkeit *)
END_PROGRAM
`,
          var: `VAR
	diPrevState : DINT;
	bEntry : BOOL;
	bActing : BOOL;
	bAccepted : BOOL;
	diCmd : DINT;
	fbSC : TON;
END_VAR
`,
          typ: `TYPE
	typPackCommand : STRUCT
		CntrlCmd : DINT;
		CmdChangeRequest : BOOL;
		MachSpeed : REAL;
	END_STRUCT;
	typPackStatus : STRUCT
		StateCurrent : DINT;
		CurMachSpeed : REAL;
		RejectCount : UDINT;
	END_STRUCT;
	typPackTags : STRUCT
		Command : typPackCommand;
		Status : typPackStatus;
	END_STRUCT;
END_TYPE
`
        },
        solution: {
          main: `PROGRAM _INIT
	gPackTags.Status.StateCurrent := 2;
	diPrevState := 2;
END_PROGRAM

PROGRAM _CYCLIC
	bEntry := gPackTags.Status.StateCurrent <> diPrevState;
	diPrevState := gPackTags.Status.StateCurrent;
	CASE gPackTags.Status.StateCurrent OF
		1, 3, 7, 8, 10, 12, 15: bActing := TRUE;
	ELSE
		bActing := FALSE;
	END_CASE;
	fbSC(IN := bActing AND NOT bEntry, PT := T#200ms);

	(* State Complete *)
	IF fbSC.Q THEN
		CASE gPackTags.Status.StateCurrent OF
			15: gPackTags.Status.StateCurrent := 4;  (* Resetting -> Idle *)
			3:  gPackTags.Status.StateCurrent := 6;  (* Starting -> Execute *)
			10: gPackTags.Status.StateCurrent := 11; (* Holding -> Held *)
			12: gPackTags.Status.StateCurrent := 6;  (* Unholding -> Execute *)
			7:  gPackTags.Status.StateCurrent := 2;  (* Stopping -> Stopped *)
			8:  gPackTags.Status.StateCurrent := 9;  (* Aborting -> Aborted *)
			1:  gPackTags.Status.StateCurrent := 2;  (* Clearing -> Stopped *)
		END_CASE;
	END_IF;

	(* Befehle *)
	IF gPackTags.Command.CmdChangeRequest THEN
		gPackTags.Command.CmdChangeRequest := FALSE;
		diCmd := gPackTags.Command.CntrlCmd;
		bAccepted := FALSE;
		CASE diCmd OF
			1: (* Reset *)
				IF gPackTags.Status.StateCurrent = 2 THEN
					gPackTags.Status.StateCurrent := 15; bAccepted := TRUE;
				END_IF;
			2: (* Start *)
				IF gPackTags.Status.StateCurrent = 4 THEN
					gPackTags.Status.StateCurrent := 3; bAccepted := TRUE;
				END_IF;
			3: (* Stop *)
				CASE gPackTags.Status.StateCurrent OF
					1, 2, 7, 8, 9: bAccepted := FALSE;
				ELSE
					gPackTags.Status.StateCurrent := 7; bAccepted := TRUE;
				END_CASE;
			4: (* Hold *)
				IF gPackTags.Status.StateCurrent = 6 THEN
					gPackTags.Status.StateCurrent := 10; bAccepted := TRUE;
				END_IF;
			5: (* Unhold *)
				IF gPackTags.Status.StateCurrent = 11 THEN
					gPackTags.Status.StateCurrent := 12; bAccepted := TRUE;
				END_IF;
			8: (* Abort *)
				IF gPackTags.Status.StateCurrent <> 8 AND gPackTags.Status.StateCurrent <> 9 THEN
					gPackTags.Status.StateCurrent := 8; bAccepted := TRUE;
				END_IF;
			9: (* Clear *)
				IF gPackTags.Status.StateCurrent = 9 AND diEStop THEN
					gPackTags.Status.StateCurrent := 1; bAccepted := TRUE;
				END_IF;
		END_CASE;
		IF NOT bAccepted THEN
			gPackTags.Status.RejectCount := gPackTags.Status.RejectCount + 1;
		END_IF;
	END_IF;

	(* NOT-HALT erzwingt Abort *)
	IF NOT diEStop AND gPackTags.Status.StateCurrent <> 8 AND gPackTags.Status.StateCurrent <> 9 THEN
		gPackTags.Status.StateCurrent := 8;
	END_IF;

	IF gPackTags.Status.StateCurrent = 6 THEN
		gPackTags.Status.CurMachSpeed := gPackTags.Command.MachSpeed;
	ELSE
		gPackTags.Status.CurMachSpeed := 0.0;
	END_IF;
END_PROGRAM
`,
          var: `VAR
	diPrevState : DINT;
	bEntry : BOOL;
	bActing : BOOL;
	bAccepted : BOOL;
	diCmd : DINT;
	fbSC : TON;
END_VAR
`,
          typ: `TYPE
	typPackCommand : STRUCT
		CntrlCmd : DINT;
		CmdChangeRequest : BOOL;
		MachSpeed : REAL;
	END_STRUCT;
	typPackStatus : STRUCT
		StateCurrent : DINT;
		CurMachSpeed : REAL;
		RejectCount : UDINT;
	END_STRUCT;
	typPackTags : STRUCT
		Command : typPackCommand;
		Status : typPackStatus;
	END_STRUCT;
END_TYPE
`
        },
        tests: [
          { name: 'Startzustand Stopped', steps: [
            { cycles: 2 },
            { expect: 'gPackTags.Status.StateCurrent = 2', msg: 'Nach dem Start muss die Maschine in Stopped (2) sein.' }
          ]},
          { name: 'Reset über Resetting nach Idle', steps: [
            { set: { 'gPackTags.Command.CntrlCmd': 1, 'gPackTags.Command.CmdChangeRequest': true } }, { cycles: 2 },
            { expect: 'gPackTags.Status.StateCurrent = 15 AND NOT gPackTags.Command.CmdChangeRequest', msg: 'Reset muss nach Resetting (15) führen und quittiert werden.' },
            { until: 'gPackTags.Status.StateCurrent = 4', maxMs: 500, msg: 'Resetting muss nach ca. 200 ms in Idle (4) enden.' }
          ]},
          { name: 'Unzulässiger Befehl wird abgelehnt', steps: [
            { set: { 'gPackTags.Command.CntrlCmd': 2, 'gPackTags.Command.CmdChangeRequest': true } }, { cycles: 3 },
            { expect: 'gPackTags.Status.StateCurrent = 2 AND gPackTags.Status.RejectCount = 1', msg: 'Start in Stopped ist nicht zulässig und muss gezählt werden.' },
            { expect: 'NOT gPackTags.Command.CmdChangeRequest' }
          ]},
          { name: 'Produktion mit Hold/Unhold', steps: [
            { set: { 'gPackTags.Command.MachSpeed': 120.0, 'gPackTags.Command.CntrlCmd': 1, 'gPackTags.Command.CmdChangeRequest': true } },
            { until: 'gPackTags.Status.StateCurrent = 4', maxMs: 500 },
            { set: { 'gPackTags.Command.CntrlCmd': 2, 'gPackTags.Command.CmdChangeRequest': true } }, { cycles: 2 },
            { expect: 'gPackTags.Status.StateCurrent = 3', msg: 'Start in Idle führt nach Starting (3).' },
            { until: 'gPackTags.Status.StateCurrent = 6', maxMs: 500, msg: 'Starting muss in Execute (6) enden.' },
            { expect: 'ABS(gPackTags.Status.CurMachSpeed - 120.0) < 0.01' },
            { set: { 'gPackTags.Command.CntrlCmd': 4, 'gPackTags.Command.CmdChangeRequest': true } },
            { until: 'gPackTags.Status.StateCurrent = 11', maxMs: 500, msg: 'Hold muss über Holding nach Held (11) führen.' },
            { expect: 'gPackTags.Status.CurMachSpeed = 0.0' },
            { set: { 'gPackTags.Command.CntrlCmd': 5, 'gPackTags.Command.CmdChangeRequest': true } },
            { until: 'gPackTags.Status.StateCurrent = 6', maxMs: 500, msg: 'Unhold muss über Unholding zurück nach Execute führen.' },
            { set: { 'gPackTags.Command.CntrlCmd': 3, 'gPackTags.Command.CmdChangeRequest': true } }, { cycles: 2 },
            { expect: 'gPackTags.Status.StateCurrent = 7', msg: 'Stop in Execute führt nach Stopping (7).' },
            { until: 'gPackTags.Status.StateCurrent = 2', maxMs: 500 }
          ]},
          { name: 'NOT-HALT, Abort und Clear', steps: [
            { set: { 'gPackTags.Command.CntrlCmd': 1, 'gPackTags.Command.CmdChangeRequest': true } },
            { until: 'gPackTags.Status.StateCurrent = 4', maxMs: 500 },
            { set: { diEStop: false } }, { cycles: 2 },
            { expect: 'gPackTags.Status.StateCurrent = 8', msg: 'NOT-HALT muss Aborting (8) erzwingen.' },
            { until: 'gPackTags.Status.StateCurrent = 9', maxMs: 500, msg: 'Aborting endet in Aborted (9).' },
            { set: { 'gPackTags.Command.CntrlCmd': 9, 'gPackTags.Command.CmdChangeRequest': true } }, { cycles: 3 },
            { expect: 'gPackTags.Status.StateCurrent = 9 AND gPackTags.Status.RejectCount = 1', msg: 'Clear bei offenem NOT-HALT-Kreis muss abgelehnt werden.' },
            { set: { diEStop: true } }, { cycles: 1 },
            { set: { 'gPackTags.Command.CntrlCmd': 9, 'gPackTags.Command.CmdChangeRequest': true } },
            { until: 'gPackTags.Status.StateCurrent = 2', maxMs: 600, msg: 'Clear muss über Clearing nach Stopped führen.' }
          ]}
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────── L5 · MQTT & Datenbank ─────────────────────────────
  {
    id: 'komm-5-iiot',
    level: 5,
    kind: 'lektion',
    title: 'IIoT-Anbindung: MQTT und Datenbanken',
    summary: 'Publish/Subscribe mit MQTT, Topic-Design, QoS und Sparkplug sowie die Anbindung von Datenbanken mit mapp Database – mit einem Report-by-Exception-Publisher in ST.',
    minutes: 240,
    req: ['komm-4-gateway-projekt'],
    briefing: 'Für Cloud, Data Lakes und Unified-Namespace-Architekturen hat sich MQTT durchgesetzt: Clients verbinden sich zu einem **Broker**, veröffentlichen Nachrichten unter **Topics** und abonnieren Topics anderer. ' +
      'Wichtige Begriffe sind QoS 0/1/2, Retained Messages, Last Will und Sparkplug B als Industrie-Konvention für Topics und Payloads. ' +
      'Für Produktionsdaten, Rezepte und Rückverfolgbarkeit binden Maschinen außerdem SQL-Datenbanken an – B&R bietet dafür mapp Database. ' +
      'Auf B&R-Steuerungen gibt es für MQTT keinen „einen“ Standardweg: Recherchiere aktuelle mapp-/Community-Lösungen und bewerte sie (Wartung, Lizenz, Security).',
    practice: 'Das Werk will alle Maschinenzustände in einem zentralen MQTT-Broker sehen. Wenn jede Maschine jeden Zyklus sendet, bricht der Broker zusammen – also sendest du nur bei Änderung (Report by Exception) und zusätzlich einen Lebenszeichen-Takt.',
    transfer: {
      tia: 'Siemens bietet die Bibliothek LMQTT_Client für S7-1500 und Datenbank-Anbindung über Partnerlösungen oder OPC UA/Edge-Geräte.',
      codesys: 'CODESYS hat die IIoT Libraries (MQTT Client SL), TwinCAT die TF6701 IoT Communication (MQTT) und TF6420 Database Server.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre MQTT: Broker, Topics, QoS, Retain, Last Will',
        guide: {
          intro: 'MQTT entkoppelt Sender und Empfänger über einen Broker.',
          steps: [
            'Lies in der MQTT-5.0-Spezifikation (OASIS) die Einleitung und die Abschnitte zu Topic Names/Filters und QoS.',
            'Erkläre die Wildcards `+` (eine Ebene) und `#` (alle folgenden Ebenen).',
            'Erkläre QoS 0 (höchstens einmal), 1 (mindestens einmal), 2 (genau einmal) und wann du welches nutzt.',
            'Erkläre Retained Messages (letzter Wert für neue Abonnenten) und Last Will (Broker meldet unerwarteten Verbindungsabbruch).',
            'Entwirf ein Topic-Schema nach Werk/Bereich/Linie/Maschine, z. B. `breitner/werk1/linie3/M01/status`.'
          ],
          done: 'Erledigt, wenn du ein Topic-Schema für drei Maschinen mit je Status-, Zähler- und Alarm-Topic dokumentiert hast.',
          tip: 'Lege Topics nie mit Leerzeichen, Umlauten oder führendem `/` an – das sorgt bei vielen Clients für Ärger.',
          link: { label: 'MQTT Version 5.0 (OASIS)', url: 'https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html' }
        }
      },
      {
        id: 'o2',
        title: 'Recherchiere MQTT-Lösungen für B&R-Steuerungen und bewerte sie',
        guide: {
          intro: 'Auf B&R-Systemen gibt es verschiedene Wege zu MQTT. Deine Aufgabe ist eine begründete Auswahl.',
          steps: [
            'Suche in der B&R Community nach „MQTT“ und lies die Threads zu Client-Bibliotheken (z. B. paho.mqtt.c-ar) und zur IIoT-Anbindung.',
            'Notiere für jede Lösung: Herkunft (B&R, Community, Drittanbieter), Lizenz, letzte Aktualisierung, TLS-Unterstützung, Wartungsaufwand.',
            'Vergleiche den direkten MQTT-Client in der SPS mit einem Edge-Gateway, das per OPC UA liest und per MQTT veröffentlicht.',
            'Schreibe eine Empfehlung (½ Seite) für ein Projekt mit 20 Maschinen.'
          ],
          done: 'Erledigt, wenn deine Bewertungstabelle mindestens zwei Lösungswege mit Vor- und Nachteilen enthält.',
          tip: 'Bei Community-Code gehört zur Bewertung, wer ihn pflegt – nach einem AS-Update musst du ihn sonst selbst anpassen.',
          link: { label: 'B&R Community: MQTT client example for B&R PLC', url: 'https://community.br-automation.com/t/mqtt-client-example-for-br-plc-link-to-sample/7302' }
        }
      },
      {
        id: 'o3',
        title: 'Plane eine Datenbank-Anbindung mit mapp Database',
        guide: {
          intro: 'mapp Database verbindet die Steuerung mit einer SQL-Datenbank (über einen Verbindungsdienst auf einem PC/Server).',
          steps: [
            'Lies in der B&R-Hilfe „mapp Database: Binding to a database“ und „Implementing mapp Database“.',
            'Notiere die Architektur: Steuerung ↔ Verbindungsdienst ↔ Datenbank und welche Komponente wo läuft.',
            'Entwirf eine Tabelle `produktion` (Zeitstempel, Maschine, Auftrag, Teile_gut, Teile_schlecht) und das passende INSERT-Statement.',
            'Überlege, wie die Maschine Daten zwischenspeichert, wenn die Datenbank nicht erreichbar ist (Pufferung, Store & Forward).'
          ],
          code: { lang: 'text', text: "INSERT INTO produktion (ts, maschine, auftrag, gut, schlecht)\nVALUES ('2026-11-10 08:15:00', 'M01', 'A4711', 1200, 3);" },
          done: 'Erledigt, wenn Architekturskizze, Tabellenentwurf und Pufferkonzept vorliegen.',
          tip: 'Schreibe nie im Maschinentakt einzelne Zeilen – sammle Daten und schreibe blockweise.',
          link: { label: 'B&R Help: mapp Database', url: H('services/mapp_services/mpdatabase/mpdatabase.html') }
        }
      },
      {
        id: 'o4',
        title: 'Baue Topic und JSON-Payload mit Report by Exception',
        guide: {
          intro: 'In der Übung bereitest du die Nachricht vor; das eigentliche Publish übernimmt später der gewählte MQTT-Client.',
          steps: [
            'Baue das Topic mit CONCAT aus festen Teilen und der Maschinen-ID.',
            'Baue die JSON-Payload mit CONCAT und den *_TO_STRING-Konvertierungen.',
            'Sende nur bei Änderung (Totband für Analogwerte) und spätestens alle 10 s als Lebenszeichen.',
            'Erzeuge für jedes Publish genau einen Zyklus lang `doPublish`.'
          ],
          done: 'Erledigt, wenn deine Übung alle Tests besteht.',
          tip: 'Ganzzahlige Festkommawerte (z. B. Temperatur in 0,1 °C) vermeiden Formatierungsprobleme mit Dezimaltrennzeichen und Exponentialdarstellung.'
        }
      }
    ],
    videos: [
      { id: 'D5dZDDLwRAM', title: 'MQTT schnell erklärt - Alles was du wissen musst - (Topics, Retain, QoS) für Home Assistant & co.', channel: 'Torben Ledermann', lang: 'de', why: 'Deutsche Erklärung von Topics, Retain und QoS.' },
      { id: '26qwbFZhjKQ', title: 'OPC UA vs MQTT: What is the difference, and when should you use each?', channel: 'IT and Automation Academy', lang: 'en', why: 'Hilft bei der Entscheidung zwischen OPC UA und MQTT.' },
      { id: '4lunu8XBZqo', title: 'MQTT Sparkplug Basics | Sparkplug Essentials Part 1', channel: 'HiveMQ', lang: 'en', why: 'Einführung in Sparkplug als Industrie-Konvention über MQTT.' }
    ],
    readings: [
      {
        title: 'MQTT Version 5.0', author: 'Banks, A., Briggs, E., Borgendale, K., & Gupta, R. (Hrsg.)', institution: 'OASIS',
        work: 'OASIS Standard', year: 2019, type: 'Norm/Amtlich', minutes: 45,
        url: 'https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html',
        why: 'Primärquelle für MQTT 5.0 – vor allem Kapitel 1 und 4.',
        apa: 'Banks, A., Briggs, E., Borgendale, K., & Gupta, R. (Hrsg.). (2019). *MQTT Version 5.0*. OASIS Standard. ' + ABGERUFEN + 'https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html'
      },
      {
        title: 'Eclipse Sparkplug', author: 'Eclipse Foundation', institution: 'Eclipse Foundation',
        work: 'Sparkplug Specification Project', year: 2026, type: 'Dokumentation', minutes: 20,
        url: 'https://sparkplug.eclipse.org/',
        why: 'Projektseite der Sparkplug-Spezifikation für Topic-Namensraum und Zustandsverwaltung.',
        apa: 'Eclipse Foundation. (2026). *Eclipse Sparkplug*. ' + ABGERUFEN + 'https://sparkplug.eclipse.org/'
      },
      brHelp('mapp Database: Binding to a database', 'services/mapp_services/mpdatabase/mpdatabase.html', 'B&R-Dokumentation zur Datenbank-Anbindung.', 20)
    ],
    quiz: [
      {
        type: 'single', q: 'Welches Topic-Filter abonniert die Status-Topics aller Maschinen von Werk 1, Linie 3 (`breitner/werk1/linie3/<Maschine>/status`)?',
        options: ['breitner/werk1/linie3/#/status', 'breitner/werk1/linie3/+/status', 'breitner/werk1/linie3/*/status', 'breitner/werk1/#'], correct: 1,
        explain: '`+` ersetzt genau eine Ebene. `#` darf nur am Ende stehen und würde alles darunter abonnieren.'
      },
      {
        type: 'single', q: 'Wofür ist die „Last Will“-Nachricht gedacht?',
        options: ['Sie wird beim regulären Abmelden gesendet.', 'Der Broker veröffentlicht sie, wenn ein Client die Verbindung unerwartet verliert.', 'Sie löscht alle Retained Messages.', 'Sie verschlüsselt die Verbindung.'], correct: 1,
        explain: 'Mit Last Will erfahren Abonnenten, dass ein Client (z. B. eine Maschine) offline gegangen ist.'
      },
      {
        type: 'multi', q: 'Welche Maßnahmen reduzieren die Datenlast beim Publizieren von Maschinendaten?',
        options: ['Report by Exception (nur bei Änderung)', 'Totband für Analogwerte', 'Jeden Task-Zyklus publizieren', 'Lebenszeichen in festem, großem Intervall'], correct: [0, 1, 3],
        explain: 'Änderungsgesteuertes Senden mit Totband plus seltenem Heartbeat ist der Standardansatz.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Welche QoS-Stufe garantiert, dass eine Nachricht genau einmal zugestellt wird?',
        options: ['QoS 0', 'QoS 1', 'QoS 2', 'Retain'], correct: 2,
        explain: 'QoS 2 nutzt einen vierstufigen Handshake für „exactly once“.'
      },
      {
        type: 'single', q: 'Was ist ein Vorteil eines Edge-Gateways (OPC UA → MQTT) gegenüber einem MQTT-Client direkt in der SPS?',
        options: ['Geringere Latenz im Regelkreis', 'Entkopplung: SPS-Programm bleibt unverändert, Security und Pufferung zentral im Gateway', 'Keine Netzwerkverbindung nötig', 'MQTT wird überflüssig'], correct: 1,
        explain: 'Das Gateway übernimmt IT-nahe Aufgaben; die SPS bleibt schlank. Nachteil: eine Komponente mehr.'
      },
      {
        type: 'multi', q: 'Was gehört zu einem robusten Datenbank-Logging einer Maschine?',
        options: ['Pufferung bei Datenbankausfall', 'Blockweises Schreiben', 'Eindeutiger Zeitstempel (synchronisierte Uhr, z. B. NTP)', 'Jede Variable in jedem Zyklus als eigene Zeile schreiben'], correct: [0, 1, 2],
        explain: 'Zyklisches Einzelschreiben überlastet Netz und Datenbank.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'MQTT-Nachricht mit Report by Exception',
        task: 'Bereite die Statusnachricht einer Maschine für einen MQTT-Client vor.\n\n' +
          '**Anforderungen:**\n' +
          "1. `sTopic` = `'breitner/werk1/'` + `sMachineId` + `'/status'` (z. B. `breitner/werk1/M01/status`).\n" +
          '2. `sPayload` = JSON ohne Leerzeichen in genau dieser Reihenfolge:\n   `{"id":"M01","run":true,"count":123,"temp_dC":215}`\n   – `run` als `true`/`false`, `count` = `diCount`, `temp_dC` = `rTemp` in 0,1 °C als Ganzzahl (`REAL_TO_INT(rTemp * 10.0)`).\n' +
          '3. `doPublish` ist für **genau einen Zyklus** TRUE, wenn\n   * es der erste Zyklus nach dem Start ist,\n   * `diCount` oder `diRunning` sich seit dem letzten Publish geändert hat,\n   * `rTemp` um **≥ 0,5** vom zuletzt publizierten Wert abweicht (Totband), oder\n   * seit dem letzten Publish **10 s** vergangen sind (Lebenszeichen).\n' +
          '4. Bei jedem Publish werden die publizierten Werte gespeichert und `uiPubCount` um 1 erhöht.\n\n' +
          'Strings werden mit `CONCAT` verkettet (nicht mit `+`).',
        hints: ['CONCAT akzeptiert mehrere Argumente: CONCAT(\'{"id":"\', sMachineId, \'","run":\', sRun, …).', 'Lebenszeichen: fbHb(IN := NOT doPublish, PT := T#10s); vor der Berechnung von doPublish aufrufen.', 'Totband: ABS(rTemp - rLastTemp) >= 0.5'],
        cycleMs: 10,
        io: [
          { name: 'sMachineId', type: 'STRING[20]', dir: 'in', label: 'Maschinen-ID', init: 'M01' },
          { name: 'diRunning', type: 'BOOL', dir: 'in', label: 'Maschine läuft', widget: 'switch', init: true },
          { name: 'diCount', type: 'DINT', dir: 'in', label: 'Stückzähler', widget: 'slider', min: 0, max: 1000, init: 123 },
          { name: 'rTemp', type: 'REAL', dir: 'in', label: 'Temperatur', widget: 'slider', min: -20, max: 100, unit: '°C', init: 21.5 },
          { name: 'sTopic', type: 'STRING[80]', dir: 'out', label: 'Topic', widget: 'value' },
          { name: 'sPayload', type: 'STRING[200]', dir: 'out', label: 'Payload', widget: 'value' },
          { name: 'doPublish', type: 'BOOL', dir: 'out', label: 'Publish-Impuls', widget: 'led' },
          { name: 'uiPubCount', type: 'UINT', dir: 'out', label: 'Anzahl Publishes', widget: 'value' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	sTopic := CONCAT('breitner/werk1/', sMachineId);
	(* TODO: Payload als JSON *)
	sPayload := '{}';
	(* TODO: Report by Exception und Lebenszeichen *)
	doPublish := TRUE;
	uiPubCount := uiPubCount + 1;
END_PROGRAM
`,
          var: `VAR
	bInitDone : BOOL;
	sRun : STRING[5];
	iTempDc : INT;
	diLastCount : DINT;
	bLastRunning : BOOL;
	rLastTemp : REAL;
	fbHb : TON;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Topic *)
	sTopic := CONCAT('breitner/werk1/', sMachineId, '/status');

	(* Payload *)
	IF diRunning THEN
		sRun := 'true';
	ELSE
		sRun := 'false';
	END_IF;
	iTempDc := REAL_TO_INT(rTemp * 10.0);
	sPayload := CONCAT('{"id":"', sMachineId, '","run":', sRun, ',"count":', DINT_TO_STRING(diCount),
	                   ',"temp_dC":', INT_TO_STRING(iTempDc), '}');

	(* Report by Exception + Lebenszeichen *)
	fbHb(IN := NOT doPublish, PT := T#10s);
	doPublish := NOT bInitDone
	          OR diCount <> diLastCount
	          OR diRunning <> bLastRunning
	          OR ABS(rTemp - rLastTemp) >= 0.5
	          OR fbHb.Q;
	IF doPublish THEN
		bInitDone := TRUE;
		diLastCount := diCount;
		bLastRunning := diRunning;
		rLastTemp := rTemp;
		uiPubCount := uiPubCount + 1;
	END_IF;
END_PROGRAM
`,
          var: `VAR
	bInitDone : BOOL;
	sRun : STRING[5];
	iTempDc : INT;
	diLastCount : DINT;
	bLastRunning : BOOL;
	rLastTemp : REAL;
	fbHb : TON;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Topic und Payload', steps: [
            { cycles: 2 },
            { expect: "sTopic = 'breitner/werk1/M01/status'", msg: 'Topic falsch aufgebaut.' },
            { expect: `sPayload = '{"id":"M01","run":true,"count":123,"temp_dC":215}'`, msg: 'Payload entspricht nicht dem geforderten JSON.' }
          ]},
          { name: 'Negative Temperatur und Stillstand', steps: [
            { set: { rTemp: -3.5, diRunning: false, sMachineId: 'M07' } }, { cycles: 2 },
            { expect: `sPayload = '{"id":"M07","run":false,"count":123,"temp_dC":-35}'` },
            { expect: "sTopic = 'breitner/werk1/M07/status'" }
          ]},
          { name: 'Nur bei Änderung senden (Totband)', steps: [
            { cycles: 3 },
            { expect: 'uiPubCount = 1', msg: 'Im ersten Zyklus genau ein Publish.' },
            { never: 'doPublish', ms: 500, msg: 'Ohne Änderung darf nicht gesendet werden.' },
            { set: { rTemp: 21.8 } },
            { never: 'doPublish', ms: 100, msg: 'Eine Änderung von 0,3 °C liegt im Totband.' },
            { set: { rTemp: 22.1 } }, { cycles: 1 },
            { expect: 'doPublish AND uiPubCount = 2', msg: 'Eine Abweichung von 0,6 °C zum letzten Publish muss senden.' },
            { cycles: 1 },
            { expect: 'NOT doPublish', msg: 'doPublish darf nur einen Zyklus lang anstehen.' }
          ]},
          { name: 'Zähleränderung sendet sofort', steps: [
            { cycles: 3 },
            { set: { diCount: 124 } }, { cycles: 1 },
            { expect: 'doPublish', msg: 'Eine Zähleränderung muss sofort publiziert werden.' }
          ]},
          { name: 'Lebenszeichen nach 10 s', steps: [
            { cycles: 3 },
            { never: 'doPublish', ms: 8000, msg: 'Vor 10 s darf ohne Änderung nicht gesendet werden.' },
            { until: 'doPublish', maxMs: 3000, msg: 'Nach 10 s ohne Änderung muss ein Lebenszeichen gesendet werden.' }
          ]}
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────── L5 · IT/OT-Security & Netzwerkarchitektur ─────────────────────────────
  {
    id: 'komm-5-security',
    level: 5,
    kind: 'lektion',
    title: 'IT/OT-Security nach IEC 62443 und Netzwerkarchitektur',
    summary: 'Zonen und Conduits, Security Levels, Segmentierung, DMZ und Firewall-Regeln – und eine First-Match-Regelauswertung in ST.',
    minutes: 240,
    req: ['komm-4-opcua-client'],
    briefing: 'Mit jeder Verbindung nach außen wird die Maschine angreifbar. Die Normenreihe **IEC 62443** gibt Orientierung: Sie teilt Anlagen in **Zonen** mit gleichem Schutzbedarf und **Conduits** (Kommunikationswege) zwischen ihnen, definiert **Security Levels** (SL 1–4) und Rollen (Betreiber, Integrator, Hersteller). ' +
      'Praktisch heißt das: Netze segmentieren, nur benötigte Dienste freigeben, Fernwartung über kontrollierte Zugänge, Benutzer und Rechte, Updates und Protokollierung. ' +
      'B&R-Steuerungen bringen eine konfigurierbare **Firewall** mit, deren Regeln du in diesem Modul verstehst und in ST nachbildest. ' +
      'Hinweis: Dieses Modul dient der Orientierung und ist keine Rechtsberatung; maßgeblich sind die Normtexte und die Vorgaben deines Unternehmens.',
    practice: 'Der Kunde verlangt, dass die Maschine nur OPC UA vom Leitstand und Engineering-Zugriff aus einem definierten Wartungsnetz zulässt. Alles andere soll blockiert und protokolliert werden.',
    transfer: {
      tia: 'Siemens setzt auf das Konzept „Defense in Depth“ mit Security-Modulen (SCALANCE, CP 1543-1 mit Firewall) und den Schutzstufen der CPU.',
      codesys: 'Bei PC-basierten Steuerungen (TwinCAT, CODESYS auf Linux/Windows) übernimmt die Betriebssystem-Firewall diese Rolle; die Konzepte aus IEC 62443 sind identisch.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre Zonen, Conduits und Security Levels',
        guide: {
          intro: 'IEC 62443 strukturiert Security über Zonen, Conduits und Zielniveaus.',
          steps: [
            'Lies im BSI ICS-Security-Kompendium die Abschnitte zu Netzsegmentierung und Bedrohungen für ICS.',
            'Definiere für eine Beispielanlage Zonen: Maschinennetz (Steuerung, Antriebe), Leitstand, Engineering/Wartung, Büro, Internet.',
            'Zeichne die Conduits und notiere je Conduit die erlaubten Protokolle (z. B. Leitstand → Maschine: OPC UA, Port 4840).',
            'Ordne den Zonen grob einen Ziel-Security-Level zu (SL 1: Schutz gegen zufällige Fehlbedienung … SL 4: Schutz gegen Angreifer mit hohen Ressourcen) – als Orientierung, nicht als Bewertung.'
          ],
          done: 'Erledigt, wenn deine Skizze mindestens vier Zonen mit Conduits und erlaubten Diensten enthält.',
          tip: 'Ein Asset-Verzeichnis (alle Geräte mit IP, Firmware, Funktion) ist die Grundlage jeder Security-Betrachtung.',
          link: { label: 'BSI: ICS-Security-Kompendium (PDF)', url: 'https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/ICS/ICS-Security_kompendium_pdf.pdf' }
        }
      },
      {
        id: 'o2',
        title: 'Entwirf eine segmentierte Netzwerkarchitektur mit DMZ',
        guide: {
          intro: 'Direkte Verbindungen vom Büro- oder Internetnetz ins Maschinennetz sind tabu. Dazwischen liegt eine DMZ.',
          steps: [
            'Zeichne: Internet – Firewall – Büro-IT – Firewall – OT-DMZ (z. B. Historian, Update-Server, Fernwartungs-Gateway) – Firewall – Leitstand – Maschinennetze.',
            'Lege fest: Verbindungen nur von innen nach außen initiieren oder über Proxy in der DMZ.',
            'Plane VLANs bzw. getrennte Subnetze je Maschine/Linie (z. B. 192.168.10.0/24, 192.168.20.0/24).',
            'Dokumentiere die Fernwartung: über ein Gateway in der DMZ, mit Freigabe durch den Betreiber, zeitlich begrenzt, protokolliert.'
          ],
          done: 'Erledigt, wenn deine Architektur eine DMZ enthält und kein Conduit direkt vom Internet ins Maschinennetz führt.',
          tip: 'POWERLINK- und X2X-Netze gehören in keine dieser Zonen nach außen – sie bleiben strikt maschinenintern.'
        }
      },
      {
        id: 'o3',
        title: 'Lies und formuliere Firewall-Regeln für eine B&R-Steuerung',
        guide: {
          intro: 'Die B&R-Firewall arbeitet mit Regeln im IP-Filter-Format; die Regeln werden der Reihe nach geprüft.',
          steps: [
            'Öffne in der B&R-Hilfe „Firewall“ und „Firewall syntax“ und lies Aufbau und Reihenfolge der Parameter (Aktion, Richtung, Protokoll, Quelle, Ziel, Port).',
            'Formuliere Regeln für: OPC UA vom Leitstand (192.168.10.0/24, TCP 4840) erlauben, Engineering-Netz (192.168.20.0/24) komplett erlauben, Modbus TCP (502) von überall sonst blockieren, NTP (UDP 123) vom Leitstand erlauben, Rest blockieren.',
            'Prüfe in der Hilfe, wie die Firewall in Automation Studio konfiguriert wird (interaktiver Modus/Expertenmodus) und wie sich das Schlüsselwort `quick` auf die Auswertung auswirkt.',
            'Teste die Regeln gedanklich mit Paketbeispielen und dokumentiere, welche Regel greift.'
          ],
          code: { lang: 'text', text: 'pass in quick proto tcp from 192.168.10.0/24 to me port = 4840\npass in quick from 192.168.20.0/24 to me\nblock in quick proto tcp from any to me port = 502\npass in quick proto udp from 192.168.10.0/24 to me port = 123\nblock in from any to me' },
          done: 'Erledigt, wenn deine Regeln die fünf Anforderungen abdecken und du für drei Beispielpakete die greifende Regel nennen kannst.',
          tip: 'Teste Firewall-Änderungen immer mit einem Rückfallweg (Vor-Ort-Zugang) – eine falsche Regel sperrt sonst auch dich aus.',
          link: { label: 'B&R Help: Firewall syntax', url: H('access_and_security/firewall/general/rule_syntax.html') }
        }
      },
      {
        id: 'o4',
        title: 'Bilde die First-Match-Auswertung in ST nach',
        guide: {
          intro: 'Die Übung zeigt dir, warum die Reihenfolge von Regeln entscheidend ist.',
          steps: [
            'Lege eine Regelstruktur (Aktion, Protokoll, Quellnetz, Zielport; 0 = beliebig) an.',
            'Initialisiere die Regeltabelle in `_INIT`.',
            'Prüfe die Regeln in einer FOR-Schleife und verlasse sie mit EXIT beim ersten Treffer.',
            'Ohne Treffer gilt Default Deny.'
          ],
          done: 'Erledigt, wenn deine Übung alle Tests besteht.',
          tip: 'Default Deny („alles verbieten, was nicht ausdrücklich erlaubt ist“) ist das Grundprinzip jeder Firewall-Konfiguration.'
        }
      }
    ],
    videos: [
      { id: 'oHGzIc92Ib0', title: 'Cyber-Sicherheit mit IEC 62443: So startest Du! - Open and Secure', channel: 'WAGO Germany', lang: 'de', why: 'Deutscher Einstieg in IEC 62443 aus Sicht eines Automatisierungsherstellers.' },
      { id: 'lGoaVrrkzqQ', title: 'Was ist eine DMZ in einem Netzwerk? (Demilitarisierte Zone)', channel: 'Patrick Boekhoven', lang: 'de', why: 'Erklärt das DMZ-Konzept für die Netzwerkarchitektur.' },
      { id: 'UNTmKT36cXQ', title: 'The IEC 62443 Standards Plainly Explained', channel: 'Plainly Explained', lang: 'en', why: 'Überblick über Aufbau und Teile der Normenreihe.' }
    ],
    readings: [
      {
        title: 'ICS-Security-Kompendium', author: 'Bundesamt für Sicherheit in der Informationstechnik', institution: 'BSI',
        work: 'BSI-Publikation', year: 2013, type: 'Norm/Amtlich', minutes: 60,
        url: 'https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/ICS/ICS-Security_kompendium_pdf.pdf',
        why: 'Amtliche deutsche Grundlage zu Bedrohungen und Maßnahmen für industrielle Steuerungen.',
        apa: 'Bundesamt für Sicherheit in der Informationstechnik. (2013). *ICS-Security-Kompendium*. BSI. ' + ABGERUFEN + 'https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/ICS/ICS-Security_kompendium_pdf.pdf'
      },
      {
        title: 'ISA/IEC 62443 Series of Standards', author: 'International Society of Automation', institution: 'ISA',
        work: 'Normenübersicht', year: 2026, type: 'Norm/Amtlich', minutes: 15,
        url: 'https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards',
        why: 'Übersicht über alle Teile der Normenreihe (Normtexte selbst sind kostenpflichtig).',
        apa: 'International Society of Automation. (2026). *ISA/IEC 62443 Series of Standards*. ' + ABGERUFEN + 'https://www.isa.org/standards-and-publications/isa-standards/isa-iec-62443-series-of-standards'
      },
      brHelp('Firewall', 'access_and_security/firewall/firewall_index.htm', 'Einstieg in die Firewall der B&R-Steuerungen.', 20)
    ],
    quiz: [
      {
        type: 'single', q: 'Was ist in IEC 62443 ein „Conduit“?',
        options: ['Ein Kabelkanal im Schaltschrank', 'Ein Kommunikationsweg zwischen Zonen, für den Sicherheitsanforderungen gelten', 'Ein Benutzerkonto', 'Ein Firmware-Update'], correct: 1,
        explain: 'Zonen gruppieren Assets mit gleichem Schutzbedarf, Conduits sind die Verbindungen dazwischen.'
      },
      {
        type: 'single', q: 'Regeln: 1) pass alles aus 192.168.20.0/24, 2) block TCP-Port 502 von überall. Ein Paket von 192.168.20.7 an Port 502 kommt an. Was passiert bei First-Match?',
        options: ['Blockiert durch Regel 2', 'Erlaubt durch Regel 1', 'Beide Regeln heben sich auf', 'Default Deny'], correct: 1,
        explain: 'Bei First-Match entscheidet die erste passende Regel – hier Regel 1.'
      },
      {
        type: 'multi', q: 'Welche Maßnahmen gehören zu einer segmentierten OT-Architektur?',
        options: ['DMZ zwischen IT und OT', 'Getrennte Subnetze/VLANs je Maschine oder Linie', 'Fernwartung direkt per Portweiterleitung aus dem Internet auf die SPS', 'Firewall-Regeln nach dem Prinzip Default Deny'], correct: [0, 1, 3],
        explain: 'Direkte Portweiterleitungen aus dem Internet sind ein schwerer Architekturfehler.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Welcher Security Level beschreibt nach IEC 62443 grob den Schutz gegen zufällige oder unbeabsichtigte Verstöße?',
        options: ['SL 1', 'SL 2', 'SL 3', 'SL 4'], correct: 0,
        explain: 'SL 1 adressiert zufällige Fehler; SL 2–4 steigende Angreiferfähigkeiten.'
      },
      {
        type: 'multi', q: 'Welche Rollen unterscheidet IEC 62443?',
        options: ['Betreiber (Asset Owner)', 'Integrator/Dienstleister', 'Produkthersteller', 'Endkunde des Produkts im Supermarkt'], correct: [0, 1, 2],
        explain: 'Die Norm verteilt Pflichten auf Betreiber, Integratoren und Hersteller.'
      },
      {
        type: 'single', q: 'Warum gehört ein Fernwartungszugang in die DMZ und nicht direkt ins Maschinennetz?',
        options: ['Weil er dort schneller ist', 'Weil Zugriffe so kontrolliert, freigegeben und protokolliert werden können, ohne das Maschinennetz direkt zu öffnen', 'Weil POWERLINK es verlangt', 'Weil DMZ-Geräte keine IP-Adresse brauchen'], correct: 1,
        explain: 'Die DMZ ist der kontrollierte Übergabepunkt zwischen den Zonen.'
      },
      {
        type: 'single', q: 'Was bedeutet „Default Deny“?',
        options: ['Alles ist erlaubt, außer es wird verboten.', 'Alles ist verboten, was nicht ausdrücklich erlaubt ist.', 'Nur Administratoren dürfen sich anmelden.', 'Die Firewall ist standardmäßig aus.'], correct: 1,
        explain: 'Default Deny minimiert die Angriffsfläche.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'fehlersuche',
        title: 'Firewall-Regeln mit First-Match auswerten',
        task: 'Ein Diagnosebaustein soll vorhersagen, wie die Firewall ein eingehendes Paket behandelt. Quelle ist immer `192.168.X.y`; relevant ist nur das dritte Oktett `usSrcNet` (X).\n\n' +
          '**Regeltabelle (Reihenfolge = Priorität, 0 = beliebig):**\n\n' +
          '| Nr. | Aktion | Protokoll | Quellnetz X | Zielport |\n|---|---|---|---|---|\n| 1 | pass | TCP (6) | 10 | 4840 |\n| 2 | pass | beliebig | 20 | beliebig |\n| 3 | block | TCP (6) | beliebig | 502 |\n| 4 | pass | UDP (17) | 10 | 123 |\n\n' +
          '**Anforderungen:**\n' +
          '1. Die **erste** passende Regel entscheidet (First-Match). `doPass` = Aktion dieser Regel, `usRule` = ihre Nummer.\n' +
          '2. Passt keine Regel: blockieren (Default Deny), `usRule` = 0.\n' +
          '3. Bei jeder steigenden Flanke an `diCheck` wird ein blockiertes Paket in `udBlocked` gezählt (Logging).\n\n' +
          'Der Startcode enthält einen Fehler: Er wertet alle Regeln aus und nimmt die **letzte** passende. Finde und behebe ihn und ergänze das Logging.',
        hints: ['Eine FOR-Schleife verlässt du mit EXIT.', 'Treffer: (Regel.usProto = 0 OR Regel.usProto = usProto) AND (… usSrcNet …) AND (… uiPort …).', 'R_TRIG für diCheck.'],
        cycleMs: 10,
        io: [
          { name: 'usSrcNet', type: 'USINT', dir: 'in', label: 'Quellnetz (3. Oktett)', widget: 'slider', min: 0, max: 255, init: 10 },
          { name: 'usProto', type: 'USINT', dir: 'in', label: 'Protokoll (6 = TCP, 17 = UDP)', widget: 'slider', min: 0, max: 17, init: 6 },
          { name: 'uiDstPort', type: 'UINT', dir: 'in', label: 'Zielport', widget: 'slider', min: 0, max: 65535, init: 4840 },
          { name: 'diCheck', type: 'BOOL', dir: 'in', label: 'Paket protokollieren', widget: 'button' },
          { name: 'doPass', type: 'BOOL', dir: 'out', label: 'Paket erlaubt', widget: 'led' },
          { name: 'usRule', type: 'USINT', dir: 'out', label: 'Greifende Regel', widget: 'value' },
          { name: 'udBlocked', type: 'UDINT', dir: 'out', label: 'Blockierte Pakete (Log)', widget: 'value' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT
	aRules[1].bPass := TRUE;  aRules[1].usProto := 6;  aRules[1].usSrcNet := 10; aRules[1].uiPort := 4840;
	aRules[2].bPass := TRUE;  aRules[2].usProto := 0;  aRules[2].usSrcNet := 20; aRules[2].uiPort := 0;
	aRules[3].bPass := FALSE; aRules[3].usProto := 6;  aRules[3].usSrcNet := 0;  aRules[3].uiPort := 502;
	aRules[4].bPass := TRUE;  aRules[4].usProto := 17; aRules[4].usSrcNet := 10; aRules[4].uiPort := 123;
END_PROGRAM

PROGRAM _CYCLIC
	doPass := FALSE;
	usRule := 0;
	FOR i := 1 TO 4 DO
		IF (aRules[i].usProto = 0 OR aRules[i].usProto = usProto)
		   AND (aRules[i].usSrcNet = 0 OR aRules[i].usSrcNet = usSrcNet)
		   AND (aRules[i].uiPort = 0 OR aRules[i].uiPort = uiDstPort) THEN
			doPass := aRules[i].bPass;
			usRule := i;
		END_IF;
	END_FOR;
	(* TODO: Logging blockierter Pakete *)
END_PROGRAM
`,
          var: `VAR
	aRules : ARRAY[1..4] OF typFwRule;
	i : USINT;
	fbCheck : R_TRIG;
END_VAR
`,
          typ: `TYPE
	typFwRule : STRUCT
		bPass : BOOL;     (* TRUE = pass, FALSE = block *)
		usProto : USINT;  (* 0 = beliebig, 6 = TCP, 17 = UDP *)
		usSrcNet : USINT; (* 3. Oktett des Quellnetzes, 0 = beliebig *)
		uiPort : UINT;    (* Zielport, 0 = beliebig *)
	END_STRUCT;
END_TYPE
`
        },
        solution: {
          main: `PROGRAM _INIT
	aRules[1].bPass := TRUE;  aRules[1].usProto := 6;  aRules[1].usSrcNet := 10; aRules[1].uiPort := 4840;
	aRules[2].bPass := TRUE;  aRules[2].usProto := 0;  aRules[2].usSrcNet := 20; aRules[2].uiPort := 0;
	aRules[3].bPass := FALSE; aRules[3].usProto := 6;  aRules[3].usSrcNet := 0;  aRules[3].uiPort := 502;
	aRules[4].bPass := TRUE;  aRules[4].usProto := 17; aRules[4].usSrcNet := 10; aRules[4].uiPort := 123;
END_PROGRAM

PROGRAM _CYCLIC
	doPass := FALSE; (* Default Deny *)
	usRule := 0;
	FOR i := 1 TO 4 DO
		IF (aRules[i].usProto = 0 OR aRules[i].usProto = usProto)
		   AND (aRules[i].usSrcNet = 0 OR aRules[i].usSrcNet = usSrcNet)
		   AND (aRules[i].uiPort = 0 OR aRules[i].uiPort = uiDstPort) THEN
			doPass := aRules[i].bPass;
			usRule := i;
			EXIT; (* First-Match *)
		END_IF;
	END_FOR;

	fbCheck(CLK := diCheck);
	IF fbCheck.Q AND NOT doPass THEN
		udBlocked := udBlocked + 1;
	END_IF;
END_PROGRAM
`,
          var: `VAR
	aRules : ARRAY[1..4] OF typFwRule;
	i : USINT;
	fbCheck : R_TRIG;
END_VAR
`,
          typ: `TYPE
	typFwRule : STRUCT
		bPass : BOOL;     (* TRUE = pass, FALSE = block *)
		usProto : USINT;  (* 0 = beliebig, 6 = TCP, 17 = UDP *)
		usSrcNet : USINT; (* 3. Oktett des Quellnetzes, 0 = beliebig *)
		uiPort : UINT;    (* Zielport, 0 = beliebig *)
	END_STRUCT;
END_TYPE
`
        },
        tests: [
          { name: 'OPC UA vom Leitstand erlaubt', steps: [
            { cycles: 2 },
            { expect: 'doPass AND usRule = 1' }
          ]},
          { name: 'Fremdes Netz: Default Deny', steps: [
            { set: { usSrcNet: 30 } }, { cycles: 2 },
            { expect: 'NOT doPass AND usRule = 0', msg: 'Kein Treffer → blockieren, usRule = 0.' }
          ]},
          { name: 'First-Match: Reihenfolge entscheidet', steps: [
            { set: { usSrcNet: 20, uiDstPort: 502 } }, { cycles: 2 },
            { expect: 'doPass AND usRule = 2', msg: 'Engineering-Netz: Regel 2 greift vor Regel 3 (First-Match).' },
            { set: { usSrcNet: 10 } }, { cycles: 2 },
            { expect: 'NOT doPass AND usRule = 3', msg: 'Modbus aus dem Leitstand wird von Regel 3 blockiert.' }
          ]},
          { name: 'UDP-Regel', steps: [
            { set: { usProto: 17, uiDstPort: 123 } }, { cycles: 2 },
            { expect: 'doPass AND usRule = 4', msg: 'NTP vom Leitstand erlaubt (Regel 4).' },
            { set: { uiDstPort: 4840 } }, { cycles: 2 },
            { expect: 'NOT doPass AND usRule = 0', msg: 'UDP 4840 passt auf keine Regel.' }
          ]},
          { name: 'Logging nur für blockierte Pakete', steps: [
            { set: { diCheck: true } }, { cycles: 2 }, { set: { diCheck: false } }, { cycles: 2 },
            { expect: 'udBlocked = 0', msg: 'Erlaubte Pakete werden nicht als blockiert gezählt.' },
            { set: { usSrcNet: 30, diCheck: true } }, { cycles: 2 }, { set: { diCheck: false } }, { cycles: 2 },
            { set: { diCheck: true } }, { cycles: 2 },
            { expect: 'udBlocked = 2', msg: 'Jede Flanke an diCheck mit blockiertem Paket zählt genau einmal.' }
          ]}
        ]
      }
    ],
    proof: false
  }
];
