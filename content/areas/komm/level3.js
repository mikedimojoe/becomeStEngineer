'use strict';
const { ABGERUFEN, H, brHelp } = require('./_common');

module.exports = [
  // ───────────────────────────── L3 · OPC UA Grundlagen & Server in AS6 ─────────────────────────────
  {
    id: 'komm-3-opcua',
    level: 3,
    kind: 'lektion',
    title: 'OPC UA: Grundlagen und Server in Automation Studio 6',
    summary: 'Client/Server, Adressraum, Nodes und Datentypen – und wie du Variablen über die OPC UA Default View deiner B&R-Steuerung freigibst.',
    minutes: 180,
    req: ['komm-2-netzwerk'],
    briefing: 'OPC UA (IEC 62541) ist der herstellerunabhängige Standard, über den Leitsysteme, MES, Prüfstände und Visualisierungen mit deiner Steuerung sprechen. ' +
      'Ein OPC-UA-Server stellt einen **Adressraum** aus Nodes bereit (Objects, Variables, Methods, ObjectTypes …), die über References verknüpft und über eine NodeId eindeutig adressiert sind. ' +
      'Auf B&R-Steuerungen aktivierst du den OPC UA Client/Server in der Konfiguration und gibst Variablen gezielt über die **OPC UA Default View** frei. ' +
      'In diesem Modul baust du außerdem eine saubere Schnittstellen-Struktur (Command/Parameter/Status), wie sie ein OPC-UA-Client erwartet.',
    practice: 'Das Leitsystem des Kunden will Auftragsdaten schreiben und Status/Zähler lesen. Statt einzelner, verstreuter Variablen stellst du eine dokumentierte Struktur bereit – mit klaren Rechten (lesen/schreiben) je Element.',
    transfer: {
      tia: 'Im TIA Portal aktivierst du den OPC-UA-Server in den CPU-Eigenschaften und steuerst die Sichtbarkeit über „Erreichbar aus HMI/OPC UA“ bzw. Server-Schnittstellen.',
      codesys: 'In CODESYS gibst du Variablen über die Symbolkonfiguration frei (Häkchen „OPC UA Features“); in TwinCAT über den TF6100 OPC UA Server und Attribute im Code.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre den OPC-UA-Adressraum mit Nodes, NodeIds und References',
        guide: {
          intro: 'Ein OPC-UA-Server ist mehr als eine Variablenliste: Er bildet ein Informationsmodell als Graph ab.',
          steps: [
            'Lies in der OPC-UA-Spezifikation (Part 1 Overview und Part 3 Address Space Model) die Abschnitte zu NodeClasses und References.',
            'Notiere die acht NodeClasses: Object, Variable, Method, ObjectType, VariableType, ReferenceType, DataType, View.',
            'Erkläre den Aufbau einer NodeId: Namespace-Index + Identifier, z. B. `ns=6;s=::Program:gMachine.Status.State`.',
            'Unterscheide BrowseName (programmatischer Name), DisplayName (lokalisierbare Anzeige) und NodeId (eindeutige Adresse).',
            'Erkläre, warum ein Client Nodes per Browse findet und Werte per Read/Write oder Subscription (MonitoredItems) austauscht.'
          ],
          done: 'Erledigt, wenn du an einem Beispiel-Node NodeId, BrowseName, DataType und AccessLevel benennen kannst.',
          tip: 'Subscriptions sind für zyklisches Lesen fast immer besser als ständiges Pollen per Read – der Server meldet nur Änderungen.',
          link: { label: 'OPC UA Part 3: Address Space Model', url: 'https://reference.opcfoundation.org/Core/Part3/v105/docs/' }
        }
      },
      {
        id: 'o2',
        title: 'Aktiviere den OPC UA Client/Server und lege eine Default View an',
        guide: {
          intro: 'Auf B&R-Steuerungen liegt die OPC-UA-Konfiguration in der Configuration View unter Connectivity/OpcUaCs.',
          steps: [
            'Öffne die **Configuration View** deiner Konfiguration und navigiere zu **<CPU> › Connectivity › OpcUaCs**.',
            'Öffne die Konfigurationsdatei (*.uacfg) und aktiviere den OPC UA Client/Server.',
            'Füge über den **Object Catalog** (Kategorie „OPC“) das Objekt **Default view** ein – es entsteht eine `.uad`-Datei.',
            'Öffne die `.uad`-Datei per Doppelklick. Markiere die freizugebenden Variablen und aktiviere sie (Kontextmenü bzw. Schaltfläche „Enable tag“).',
            'Lege je Element die Zugriffsrechte fest (z. B. Status nur lesen, Command schreiben) und übertrage das Projekt.'
          ],
          done: 'Erledigt, wenn das Projekt fehlerfrei baut und die freigegebenen Variablen in der Default View als aktiviert markiert sind.',
          tip: 'Gib nur frei, was ein Client wirklich braucht. Jede freigegebene Variable ist Teil deiner Schnittstelle – und Angriffsfläche.',
          link: { label: 'B&R Help: Add an OPC UA default view', url: H('communication/opcua/defaultview/opcua_defaultviewcreate.html') }
        }
      },
      {
        id: 'o3',
        title: 'Verbinde dich mit UaExpert und lies Werte',
        guide: {
          intro: 'UaExpert (Unified Automation) ist ein frei erhältlicher OPC-UA-Testclient und Standardwerkzeug bei der Inbetriebnahme.',
          steps: [
            'Starte die Simulation (ARsim) oder die reale Steuerung mit aktivem OPC-UA-Server.',
            'Lege in UaExpert über **Server › Add** einen Server an. Endpoint-URL: `opc.tcp://<IP-Adresse>:4840` (bei ARsim `opc.tcp://127.0.0.1:4840`).',
            'Verbinde zunächst mit Security Policy „None“ (nur im Labor!) und browse im Address Space bis zu deinen Variablen.',
            'Ziehe Variablen per Drag & Drop ins **Data Access View** und beobachte, wie sich die Werte ändern.',
            'Schreibe einen Wert in eine beschreibbare Variable und prüfe in Automation Studio im Watch-Fenster, dass er ankommt.'
          ],
          done: 'Erledigt, wenn du mindestens eine Variable per UaExpert gelesen und eine geschrieben hast.',
          tip: 'Wenn der Server nicht erscheint: Port 4840 erreichbar (Firewall)? Server aktiviert? Richtige IP? Der Fehler steht im Logger von Automation Studio.'
        }
      },
      {
        id: 'o4',
        title: 'Entwirf eine OPC-UA-taugliche Schnittstellen-Struktur',
        guide: {
          intro: 'Eine gute Schnittstelle trennt Befehle, Parameter und Status und definiert einen Handshake.',
          steps: [
            'Lege in einer `.typ`-Datei drei Strukturen an: `typMachineCmd` (Befehle, Client schreibt), `typMachinePar` (Parameter, Client schreibt), `typMachineStatus` (Status, nur lesen).',
            'Fasse sie in `typMachineIf` zusammen und lege eine globale Variable `gMachine : typMachineIf` an.',
            'Definiere den Handshake: Client setzt einen Befehl auf TRUE, die SPS führt ihn aus und setzt ihn zurück (Quittung durch Rücksetzen).',
            'Ergänze einen Heartbeat-Zähler im Status, damit der Client die Lebendigkeit der SPS erkennt.',
            'Dokumentiere jedes Element mit Einheit, Wertebereich und Richtung – z. B. als Kommentar in der `.typ`-Datei.'
          ],
          code: { lang: 'typ', text: 'TYPE\n\ttypMachineCmd : STRUCT\n\t\tStart : BOOL; (* Client setzt, SPS quittiert durch Rücksetzen *)\n\t\tStop : BOOL;\n\t\tReset : BOOL;\n\tEND_STRUCT;\nEND_TYPE' },
          done: 'Erledigt, wenn deine Struktur Befehle, Parameter und Status trennt und der Handshake dokumentiert ist.',
          tip: 'Ändere eine einmal freigegebene Schnittstelle nur versioniert – der Client des Kunden hängt an jedem Namen.'
        }
      }
    ],
    videos: [
      { id: 'jLqssXIw4mU', title: 'OPC, OPC DA, OPC UA, Server, Client, Item, Informationsmodell, Nodes, TSN | Prof. Griesbauer', channel: 'Prof Joe', lang: 'de', why: 'Vorlesung zu Client/Server, Informationsmodell und Nodes.' },
      { id: 'gglTOwxyE4Q', title: 'Aufbau und Nutzen von OPC UA', channel: 'Mittelstand-Digital Zentrum Darmstadt', lang: 'de', why: 'Kompakter deutscher Überblick über Aufbau und Nutzen.' },
      { id: 'LFHmf_uj5P0', title: 'B&R OPCUA (server) and UaExpert (Client)|| B&R DPTA & TH', channel: 'Phi Ha Automation', lang: 'en', why: 'Zeigt den OPC-UA-Server einer B&R-Steuerung mit UaExpert als Client.' }
    ],
    readings: [
      {
        title: 'Informationsmodellierung im OPC UA Adressraum', author: 'Vielweber, T.', institution: 'Hochschule für Angewandte Wissenschaften Hamburg',
        work: 'Bachelorarbeit', year: 2018, type: 'Uni-Skript', minutes: 45,
        url: 'https://reposit.haw-hamburg.de/bitstream/20.500.12738/8415/1/Bachelorarbeit_Tobias_Vielweber.pdf',
        why: 'Hochschularbeit, die den Adressraum und die Modellierung eines Laborprozesses Schritt für Schritt erklärt.',
        apa: 'Vielweber, T. (2018). *Informationsmodellierung im OPC UA Adressraum* [Bachelorarbeit]. HAW Hamburg. ' + ABGERUFEN + 'https://reposit.haw-hamburg.de/bitstream/20.500.12738/8415/1/Bachelorarbeit_Tobias_Vielweber.pdf'
      },
      {
        title: 'OPC 10000-1: OPC Unified Architecture Part 1 – Overview and Concepts', author: 'OPC Foundation', institution: 'OPC Foundation',
        work: 'OPC UA Online Reference', year: 2022, type: 'Dokumentation', minutes: 30,
        url: 'https://reference.opcfoundation.org/Core/Part1/v105/docs/',
        why: 'Offizieller Überblick über Konzepte, Client/Server und Informationsmodell.',
        apa: 'OPC Foundation. (2022). *OPC 10000-1: OPC Unified Architecture Part 1 – Overview and Concepts* (Version 1.05). ' + ABGERUFEN + 'https://reference.opcfoundation.org/Core/Part1/v105/docs/'
      },
      brHelp('OPC UA C/S default view configuration', 'communication/opcua/configuration/opcuacs_uadcfg.html', 'Beschreibt die Konfigurationsdatei der Default View und ihre Parametergruppen.', 15)
    ],
    quiz: [
      {
        type: 'single', q: 'Was identifiziert einen Node im OPC-UA-Adressraum eindeutig?',
        options: ['Der DisplayName', 'Die NodeId (Namespace-Index + Identifier)', 'Der Datentyp', 'Die Reihenfolge im Browse-Baum'], correct: 1,
        explain: 'Die NodeId ist die eindeutige Adresse. DisplayName ist lokalisierbar und nicht eindeutig.'
      },
      {
        type: 'single', q: 'Wo fügst du in AS6 die OPC UA Default View ein?',
        options: ['In der Logical View unter dem Programm', 'In der Configuration View unter <CPU> › Connectivity › OpcUaCs', 'In der Physical View an der Ethernet-Schnittstelle', 'Im mapp View Editor'], correct: 1,
        explain: 'Laut B&R-Hilfe wird die Default View über den Object Catalog unter CPU/Connectivity/OpcUaCs eingefügt (.uad-Datei).'
      },
      {
        type: 'multi', q: 'Welche Aussagen zu einem Befehls-Handshake über OPC UA sind sinnvoll?',
        options: ['Der Client setzt das Befehlsbit, die SPS setzt es nach Übernahme zurück.', 'Die SPS reagiert nur auf Flanken bzw. quittierte Befehle, damit ein Befehl nicht doppelt ausgeführt wird.', 'Status-Variablen sollten für den Client schreibbar sein.', 'Ein Heartbeat im Status zeigt dem Client, dass die SPS-Logik lebt.'], correct: [0, 1, 3],
        explain: 'Status gehört nur lesend freigegeben. Quittung durch Rücksetzen und Heartbeat sind bewährte Muster.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Welcher Mechanismus ist für das zyklische Beobachten vieler Werte am effizientesten?',
        options: ['Read-Aufruf in jedem Client-Zyklus', 'Subscription mit MonitoredItems', 'Browse in jedem Zyklus', 'Methodenaufruf'], correct: 1,
        explain: 'Bei Subscriptions sammelt der Server Änderungen und meldet sie im Publishing-Intervall – weniger Last als Pollen.'
      },
      {
        type: 'multi', q: 'Welche gehören zu den NodeClasses von OPC UA?',
        options: ['Object', 'Variable', 'Method', 'Task'], correct: [0, 1, 2],
        explain: 'NodeClasses: Object, Variable, Method, ObjectType, VariableType, ReferenceType, DataType, View. „Task“ gibt es nicht.'
      },
      {
        type: 'single', q: 'Ein Client kann deine Steuerung nicht finden. Was prüfst du zuerst?',
        options: ['Ob die Variable den richtigen Kommentar hat', 'Erreichbarkeit (ping), Port 4840 und ob der OPC UA Client/Server aktiviert ist', 'Die Zykluszeit der Task', 'Ob mapp View installiert ist'], correct: 1,
        explain: 'Bottom-up: Netzwerk, Port, Server aktiv – erst dann die Freigabe einzelner Variablen.'
      },
      {
        type: 'single', q: 'Welche Endpoint-URL ist für einen OPC-UA-Server auf 192.168.10.20 mit Standardport korrekt?',
        options: ['http://192.168.10.20:4840', 'opc.tcp://192.168.10.20:4840', 'opc.tcp://192.168.10.20:502', 'tcp://192.168.10.20/opcua'], correct: 1,
        explain: 'Das binäre OPC-UA-Protokoll nutzt das Schema opc.tcp, Standardport 4840.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Maschinenschnittstelle für einen OPC-UA-Client',
        task: 'Entwirf eine Schnittstellen-Struktur, die später über die OPC UA Default View freigegeben wird, und implementiere den Befehls-Handshake.\n\n' +
          '**Datentypen (Types.typ) – genau diese Namen, damit Client und Tests sie finden:**\n' +
          '* `typMachineCmd`: `Start`, `Stop`, `Reset` (BOOL)\n' +
          '* `typMachinePar`: `SpeedSet` (REAL, %)\n' +
          '* `typMachineStatus`: `State` (INT: 0 = Idle, 1 = Running, 9 = Error), `Running` (BOOL), `ErrorId` (UDINT), `SpeedAct` (REAL), `Heartbeat` (UDINT)\n' +
          '* `typMachineIf`: `Cmd : typMachineCmd`, `Par : typMachinePar`, `Status : typMachineStatus`\n\n' +
          'Die globale Variable `gMachine : typMachineIf` ist bereits angelegt (in AS6 läge sie in der `Global.var`).\n\n' +
          '**Verhalten:**\n' +
          '1. Jeder Befehl wird nach der Auswertung von der SPS **zurückgesetzt** (Quittung), auch wenn er im aktuellen Zustand nicht erlaubt ist.\n' +
          '2. `Start` in Idle → Running. `Stop` in Running → Idle.\n' +
          '3. Im Zustand Running ist `SpeedAct` = `SpeedSet`, begrenzt auf 0..100. Sonst 0.\n' +
          '4. Ist `diFault` TRUE → Error mit `ErrorId` = 1001 (aus jedem Zustand). `Reset` in Error wirkt nur, wenn `diFault` FALSE ist → Idle, `ErrorId` = 0.\n' +
          '5. `Running` = (State = 1). `Heartbeat` wird in jedem Zyklus um 1 erhöht.',
        hints: ['Werte den Zustand mit `CASE gMachine.Status.State OF` aus.', 'Setze am Ende des Zyklus alle drei Befehlsbits auf FALSE.', 'LIMIT(0.0, gMachine.Par.SpeedSet, 100.0)'],
        cycleMs: 10,
        io: [
          { name: 'gMachine', type: 'typMachineIf', dir: 'out', label: 'OPC-UA-Schnittstelle (Client schreibt Cmd/Par, liest Status)' },
          { name: 'diFault', type: 'BOOL', dir: 'in', label: 'Störung Antrieb', widget: 'switch' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT
	gMachine.Status.State := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Zustandsautomat mit Befehls-Handshake *)
	IF gMachine.Cmd.Start THEN
		gMachine.Status.State := 1;
	END_IF;
END_PROGRAM
`,
          var: 'VAR\nEND_VAR\n',
          typ: `TYPE
	typMachineCmd : STRUCT
		Start : BOOL;
		Stop : BOOL;
		Reset : BOOL;
	END_STRUCT;
	typMachinePar : STRUCT
		SpeedSet : REAL;
	END_STRUCT;
	typMachineStatus : STRUCT
		State : INT;
		(* TODO: Running, ErrorId, SpeedAct, Heartbeat ergänzen *)
	END_STRUCT;
	typMachineIf : STRUCT
		Cmd : typMachineCmd;
		Par : typMachinePar;
		Status : typMachineStatus;
	END_STRUCT;
END_TYPE
`
        },
        solution: {
          main: `PROGRAM _INIT
	gMachine.Status.State := 0;
END_PROGRAM

PROGRAM _CYCLIC
	(* Störung hat Vorrang *)
	IF diFault AND gMachine.Status.State <> 9 THEN
		gMachine.Status.State := 9;
		gMachine.Status.ErrorId := 1001;
	END_IF;

	CASE gMachine.Status.State OF
		0: (* Idle *)
			IF gMachine.Cmd.Start THEN
				gMachine.Status.State := 1;
			END_IF;
		1: (* Running *)
			IF gMachine.Cmd.Stop THEN
				gMachine.Status.State := 0;
			END_IF;
		9: (* Error *)
			IF gMachine.Cmd.Reset AND NOT diFault THEN
				gMachine.Status.State := 0;
				gMachine.Status.ErrorId := 0;
			END_IF;
	END_CASE;

	(* Quittung: Befehle immer zurücksetzen *)
	gMachine.Cmd.Start := FALSE;
	gMachine.Cmd.Stop := FALSE;
	gMachine.Cmd.Reset := FALSE;

	(* Status *)
	gMachine.Status.Running := gMachine.Status.State = 1;
	IF gMachine.Status.Running THEN
		gMachine.Status.SpeedAct := LIMIT(0.0, gMachine.Par.SpeedSet, 100.0);
	ELSE
		gMachine.Status.SpeedAct := 0.0;
	END_IF;
	gMachine.Status.Heartbeat := gMachine.Status.Heartbeat + 1;
END_PROGRAM
`,
          var: 'VAR\nEND_VAR\n',
          typ: `TYPE
	typMachineCmd : STRUCT
		Start : BOOL; (* Client setzt, SPS quittiert durch Rücksetzen *)
		Stop : BOOL;
		Reset : BOOL;
	END_STRUCT;
	typMachinePar : STRUCT
		SpeedSet : REAL; (* Sollgeschwindigkeit in %, 0..100 *)
	END_STRUCT;
	typMachineStatus : STRUCT
		State : INT; (* 0 = Idle, 1 = Running, 9 = Error *)
		Running : BOOL;
		ErrorId : UDINT;
		SpeedAct : REAL; (* % *)
		Heartbeat : UDINT; (* +1 je Zyklus *)
	END_STRUCT;
	typMachineIf : STRUCT
		Cmd : typMachineCmd;
		Par : typMachinePar;
		Status : typMachineStatus;
	END_STRUCT;
END_TYPE
`
        },
        tests: [
          { name: 'Start wird ausgeführt und quittiert', steps: [
            { set: { 'gMachine.Cmd.Start': true } }, { cycles: 2 },
            { expect: 'gMachine.Status.State = 1 AND gMachine.Status.Running', msg: 'Start in Idle muss nach Running führen.' },
            { expect: 'NOT gMachine.Cmd.Start', msg: 'Die SPS muss den Befehl nach der Übernahme zurücksetzen (Quittung).' }
          ]},
          { name: 'Geschwindigkeit begrenzt und nur im Running', steps: [
            { set: { 'gMachine.Par.SpeedSet': 150.0 } }, { cycles: 2 },
            { expect: 'gMachine.Status.SpeedAct = 0.0', msg: 'In Idle muss SpeedAct 0 sein.' },
            { set: { 'gMachine.Cmd.Start': true } }, { cycles: 2 },
            { expect: 'ABS(gMachine.Status.SpeedAct - 100.0) < 0.01', msg: 'SpeedSet 150 muss auf 100 begrenzt werden.' },
            { set: { 'gMachine.Cmd.Stop': true } }, { cycles: 2 },
            { expect: 'gMachine.Status.State = 0 AND NOT gMachine.Cmd.Stop', msg: 'Stop führt nach Idle und wird quittiert.' }
          ]},
          { name: 'Störung und Reset', steps: [
            { set: { 'gMachine.Cmd.Start': true } }, { cycles: 2 },
            { set: { diFault: true } }, { cycles: 2 },
            { expect: 'gMachine.Status.State = 9 AND gMachine.Status.ErrorId = 1001 AND NOT gMachine.Status.Running', msg: 'Bei diFault muss Error mit ErrorId 1001 folgen.' },
            { set: { 'gMachine.Cmd.Reset': true } }, { cycles: 2 },
            { expect: 'gMachine.Status.State = 9 AND NOT gMachine.Cmd.Reset', msg: 'Reset bei anstehender Störung bleibt wirkungslos, wird aber quittiert.' },
            { set: { diFault: false } }, { cycles: 1 },
            { set: { 'gMachine.Cmd.Reset': true } }, { cycles: 2 },
            { expect: 'gMachine.Status.State = 0 AND gMachine.Status.ErrorId = 0', msg: 'Nach Wegfall der Störung führt Reset nach Idle.' }
          ]},
          { name: 'Unerlaubter Befehl wird trotzdem quittiert', steps: [
            { set: { 'gMachine.Cmd.Stop': true } }, { cycles: 2 },
            { expect: 'gMachine.Status.State = 0 AND NOT gMachine.Cmd.Stop', msg: 'Stop in Idle ändert nichts, muss aber zurückgesetzt werden.' }
          ]},
          { name: 'Heartbeat zählt', steps: [
            { cycles: 10 },
            { expect: 'gMachine.Status.Heartbeat >= 9', msg: 'Der Heartbeat muss jeden Zyklus um 1 steigen.' }
          ]}
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────── L3 · Modbus TCP und IO-Link ─────────────────────────────
  {
    id: 'komm-3-modbus-iolink',
    level: 3,
    kind: 'lektion',
    title: 'Modbus TCP und IO-Link',
    summary: 'Registermodell, Funktionscodes und Datenmapping bei Modbus TCP sowie Prozess- und Parameterdaten bei IO-Link.',
    minutes: 180,
    req: ['komm-2-feldbus'],
    briefing: 'Modbus TCP ist das „kleinste gemeinsame Vielfache“ der Industriekommunikation: Energiezähler, Frequenzumrichter, Kältegeräte und Fremdsteuerungen sprechen es fast immer. ' +
      'Das Protokoll kennt nur 16-Bit-Register und Bits – alles Größere (DINT, REAL) setzt du selbst aus zwei Registern zusammen, und die Wort- und Byte-Reihenfolge steht im Datenblatt des Geräts. ' +
      'IO-Link bringt Intelligenz in Sensoren: neben dem Prozesswert gibt es Parameter, Diagnose und eine Gerätebeschreibung (IODD). ' +
      'Du lernst beide Systeme und programmierst ein robustes Register-Mapping.',
    practice: 'Ein Energiezähler im Schaltschrank liefert Spannung als REAL in zwei Registern und Energie als DINT. Ohne korrektes Mapping zeigt das HMI unsinnige Werte – ein typischer Inbetriebnahme-Fehler.',
    transfer: {
      tia: 'Im TIA Portal nutzt du MB_CLIENT/MB_SERVER-Bausteine; das Zusammensetzen von REAL aus Registern erfolgt oft über AT-Sichten oder Slice-Zugriffe.',
      codesys: 'In CODESYS gibt es einen Modbus-TCP-Client im Gerätebaum; die Typkonvertierung erfolgt mit UNION oder Pointern.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre das Modbus-Datenmodell und die wichtigsten Funktionscodes',
        guide: {
          intro: 'Modbus kennt vier Datenbereiche und eine Handvoll Funktionscodes.',
          steps: [
            'Lies in der Modbus Application Protocol Specification die Abschnitte zum Datenmodell und zu den Funktionscodes.',
            'Notiere die Bereiche: Coils (Bits, R/W), Discrete Inputs (Bits, R), Input Registers (16 Bit, R), Holding Registers (16 Bit, R/W).',
            'Ordne Funktionscodes zu: FC1 Read Coils, FC2 Read Discrete Inputs, FC3 Read Holding Registers, FC4 Read Input Registers, FC5/FC6 Write Single, FC15/FC16 Write Multiple.',
            'Erkläre den MBAP-Header bei Modbus TCP (Transaction ID, Protocol ID, Length, Unit ID) und den Port 502.',
            'Achte auf den Adress-Offset: Datenblatt-Register „40001“ entspricht meist Protokolladresse 0 im Holding-Register-Bereich.'
          ],
          done: 'Erledigt, wenn du für „lies 2 Holding Register ab Adresse 100“ Funktionscode, Startadresse und Anzahl angeben kannst.',
          tip: 'Prüfe Adressierung immer zuerst mit einem PC-Tool (z. B. einem Modbus-Client) gegen das Gerät, bevor du in der SPS suchst.',
          link: { label: 'Modbus Application Protocol Specification (PDF)', url: 'https://www.modbus.org/file/secure/modbusprotocolspecification.pdf' }
        }
      },
      {
        id: 'o2',
        title: 'Konfiguriere Modbus TCP in Automation Studio 6',
        guide: {
          intro: 'B&R bietet Modbus TCP als Konfiguration in der Physical View an – ohne eigenen Socket-Code.',
          steps: [
            'Lies in der B&R-Hilfe die Modbus-TCP-Guideline (Übersicht der Konfigurationsmöglichkeiten).',
            'Füge an der Ethernet-Schnittstelle in der Physical View das gewünschte Modbus-Gerät bzw. den generischen Modbus-TCP-Teilnehmer ein (genaue Objektbezeichnung laut Hilfe deiner AS-Version).',
            'Lege die Kommunikationsblöcke an: Funktionscode, Startadresse, Anzahl, Zykluszeit.',
            'Mappe die Register im **I/O Mapping** auf Variablen (z. B. `awReg : ARRAY[0..5] OF WORD`).',
            'Prüfe online, ob die Register zyklisch aktualisiert werden.'
          ],
          done: 'Erledigt, wenn du die Konfigurationsschritte für das Lesen von 6 Holding Registern beschreiben oder in einem Projekt zeigen kannst.',
          tip: 'Lege die Zykluszeit für Modbus nicht kleiner fest als nötig – viele einfache Geräte vertragen keine Anfragen im Millisekundentakt.',
          link: { label: 'B&R Help: Modbus TCP', url: H('communication/fieldbuses/modbus/modbusguideline.html') }
        }
      },
      {
        id: 'o3',
        title: 'Setze DINT und REAL aus zwei Registern zusammen',
        guide: {
          intro: 'Ein 32-Bit-Wert belegt zwei Register. Ob zuerst das High- oder das Low-Wort kommt („Word Swap“), steht im Datenblatt.',
          steps: [
            'Setze High- und Low-Wort zu einem DWORD zusammen: `dw := SHL(WORD_TO_DWORD(wHi), 16) OR WORD_TO_DWORD(wLo);`',
            'Für DINT: `DWORD_TO_DINT(dw)` übernimmt das Bitmuster (Zweierkomplement).',
            'Für REAL (IEEE 754): Vorzeichen = Bit 31, Exponent = Bits 30..23 (Bias 127), Mantisse = Bits 22..0. Wert = (−1)^s · (1 + m/2^23) · 2^(e−127).',
            'In AS6 würdest du alternativ `brsmemcpy` mit `ADR()` verwenden – in der Übung rechnest du den Wert aus, um das Format zu verstehen.'
          ],
          code: { lang: 'st', text: 'dwRaw := SHL(WORD_TO_DWORD(wHi), 16) OR WORD_TO_DWORD(wLo);\nusExp := DWORD_TO_USINT(SHR(dwRaw, 23) AND 16#FF);' },
          done: 'Erledigt, wenn du 16#43668000 von Hand als 230,5 decodiert hast.',
          tip: 'Ein Wert wie 1,2·10^-38 oder 4,5·10^9 statt 230 V ist das klassische Zeichen für vertauschte Wörter.'
        }
      },
      {
        id: 'o4',
        title: 'Beschreibe IO-Link-Prozessdaten, Parameter und IODD',
        guide: {
          intro: 'IO-Link verbindet einen Sensor oder Aktor über eine Standard-3-Leiter-Verbindung mit einem Master-Port.',
          steps: [
            'Erkläre die Rollen: IO-Link-Master (z. B. X20-IO-Link-Modul), IO-Link-Device (Sensor/Aktor), Punkt-zu-Punkt-Verbindung.',
            'Unterscheide zyklische Prozessdaten (z. B. Abstand in mm + Statusbits) und azyklische Parameter (ISDU, Index/Subindex).',
            'Lade für einen IO-Link-Sensor die IODD und lies daraus die Aufteilung der Prozessdaten (Bitposition, Länge, Skalierung).',
            'Lies in der B&R-Hilfe beim IO-Link-Modul (z. B. X20DS438A) die Funktionsbeschreibung zu IO-Link.'
          ],
          done: 'Erledigt, wenn du für einen Sensor deiner Wahl die Prozessdatenstruktur aus der IODD beschreiben kannst.',
          tip: 'IO-Link-Geräte lassen sich nach dem Tausch automatisch parametrieren (Data Storage) – ein großer Vorteil bei Servicefällen.',
          link: { label: 'B&R Help: IO-Link (X20DS438A)', url: H('hardware/x20ds438a/iolinkfunktionsbeschreibung/io-link.html') }
        }
      }
    ],
    videos: [
      { id: '_Eho-RtgAHM', title: 'Wie funktioniert Modbus - Schnell & einfach erklärt - Meistertipps in 6 Minuten', channel: 'Torben Ledermann', lang: 'de', why: 'Kurzer, verständlicher Einstieg in Register und Funktionscodes.' },
      { id: 'DNVtEFe9ydY', title: 'Modbus Grundlagen - SPS programmieren lernen - Online Profikurs (Kapitel 14.1)', channel: 'sps4you', lang: 'de', why: 'Modbus-Grundlagen aus Sicht der SPS-Programmierung.' },
      { id: 'OOFfyKvXT08', title: 'Was ist IO-Link? (1/10)', channel: 'Murrelektronik GmbH', lang: 'de', why: 'Herstellerreihe zu IO-Link, Teil 1 mit den Grundbegriffen.' }
    ],
    readings: [
      {
        title: 'MODBUS Application Protocol Specification V1.1b3', author: 'Modbus Organization', institution: 'Modbus Organization, Inc.',
        work: 'Spezifikation', year: 2012, type: 'Dokumentation', minutes: 40,
        url: 'https://www.modbus.org/file/secure/modbusprotocolspecification.pdf',
        why: 'Primärquelle für Datenmodell und Funktionscodes.',
        apa: 'Modbus Organization. (2012). *MODBUS Application Protocol Specification V1.1b3*. ' + ABGERUFEN + 'https://www.modbus.org/file/secure/modbusprotocolspecification.pdf'
      },
      {
        title: 'MODBUS Messaging on TCP/IP Implementation Guide', author: 'Modbus Organization', institution: 'Modbus Organization, Inc.',
        work: 'Implementierungsleitfaden', year: 2006, type: 'Dokumentation', minutes: 30,
        url: 'https://www.modbus.org/file/secure/messagingimplementationguide.pdf',
        why: 'Erklärt MBAP-Header, Verbindungsverwaltung und Timeouts bei Modbus TCP.',
        apa: 'Modbus Organization. (2006). *MODBUS Messaging on TCP/IP Implementation Guide V1.0b*. ' + ABGERUFEN + 'https://www.modbus.org/file/secure/messagingimplementationguide.pdf'
      },
      brHelp('IO-Link (X20DS438A)', 'hardware/x20ds438a/iolinkfunktionsbeschreibung/io-link.html', 'Funktionsbeschreibung eines B&R-IO-Link-Mastermoduls.', 20)
    ],
    quiz: [
      {
        type: 'single', q: 'Mit welchem Funktionscode liest du Holding Registers?',
        options: ['FC1', 'FC3', 'FC5', 'FC16'], correct: 1,
        explain: 'FC3 = Read Holding Registers. FC1 liest Coils, FC5 schreibt eine Coil, FC16 schreibt mehrere Register.'
      },
      {
        type: 'single', q: 'Ein REAL-Wert steht in zwei Registern: Reg0 = 16#4366, Reg1 = 16#8000 (High-Wort zuerst). Welcher Wert ist es?',
        options: ['230,5', '16742,0', '−230,5', '0,5'], correct: 0,
        explain: '16#43668000: Vorzeichen 0, Exponent 134 − 127 = 7, Mantisse 1,80078125 → 1,80078125 · 128 = 230,5.'
      },
      {
        type: 'multi', q: 'Was gehört zu IO-Link?',
        options: ['Zyklische Prozessdaten', 'Azyklische Parameter (Index/Subindex)', 'Gerätebeschreibung IODD', 'Ein Bus mit bis zu 240 Teilnehmern an einer Leitung'], correct: [0, 1, 2],
        explain: 'IO-Link ist Punkt-zu-Punkt: ein Gerät pro Master-Port, kein Bus.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Welcher TCP-Port ist für Modbus TCP registriert?',
        options: ['102', '502', '4840', '8080'], correct: 1,
        explain: 'Modbus TCP nutzt Port 502.'
      },
      {
        type: 'numeric', q: 'Ein Energiezähler liefert einen UDINT-Wert in zwei Registern: High = {H}, Low = {L} (dezimal). Wie groß ist der Wert?',
        params: { H: [0, 20, 1], L: [0, 65535, 1] }, formula: 'H * 65536 + L', unit: '', tol: 0,
        explain: 'Wert = High · 65536 + Low.'
      },
      {
        type: 'single', q: 'Der angezeigte Spannungswert ist 1,7·10^-38 statt ca. 230 V. Was ist die wahrscheinlichste Ursache?',
        options: ['Sensor defekt', 'Wort-Reihenfolge der beiden Register vertauscht', 'Falsche IP-Adresse', 'Zykluszeit zu groß'], correct: 1,
        explain: 'Vertauschte Wörter führen bei IEEE-754-Werten zu extrem kleinen oder großen Zahlen.'
      },
      {
        type: 'single', q: 'Was ist ein Vorteil von IO-Link „Data Storage“?',
        options: ['Höhere Übertragungsrate', 'Automatisches Wiederherstellen der Geräteparameter nach Gerätetausch', 'Verschlüsselung der Prozessdaten', 'Mehr als ein Gerät pro Port'], correct: 1,
        explain: 'Der Master speichert die Parameter und überträgt sie nach einem Tausch automatisch auf das neue Gerät.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Register-Mapping eines Energiezählers',
        task: 'Ein Energiezähler liefert per Modbus TCP sechs Holding Register, die bereits per I/O-Mapping in `wReg0..wReg5` stehen (16-Bit-Register, Wortreihenfolge **High-Wort zuerst**):\n\n' +
          '| Register | Inhalt |\n|---|---|\n| 0–1 | Energie in Wh, **DINT** (Zweierkomplement) |\n| 2–3 | Spannung in V, **REAL** (IEEE 754) |\n| 4 | Strom in 0,01 A, **INT** (vorzeichenbehaftet) |\n| 5 | Statusbits: Bit 0 = Messwerte gültig, Bit 3 = Überlast |\n\n' +
          '**Anforderungen:**\n' +
          '1. `diEnergy` aus Reg 0/1.\n' +
          '2. `rVoltage` aus Reg 2/3 – berechne den REAL-Wert aus Vorzeichen, Exponent und Mantisse (Bitmuster 0 → 0.0; denormalisierte Zahlen musst du nicht behandeln).\n' +
          '3. `rCurrent` = Reg 4 als INT · 0,01.\n' +
          '4. `doValid` = Bit 0 von Reg 5, `doOverload` = Bit 3 von Reg 5.\n\n' +
          'Annahmen: `DWORD_TO_DINT` und `WORD_TO_INT` übernehmen das Bitmuster (Zweierkomplement); `**` ist der Potenzoperator.',
        hints: ['dwE := SHL(WORD_TO_DWORD(wReg0), 16) OR WORD_TO_DWORD(wReg1);', 'Exponent: `SHR(dwU, 23) AND 16#FF`, Mantisse: `dwU AND 16#7FFFFF`.', 'Wert := (1.0 + UDINT_TO_REAL(DWORD_TO_UDINT(dwMant)) / 8388608.0) * 2.0 ** INT_TO_REAL(iExp - 127);'],
        cycleMs: 10,
        io: [
          { name: 'wReg0', type: 'WORD', dir: 'in', label: 'Reg 0 (Energie High)', widget: 'value', init: 0 },
          { name: 'wReg1', type: 'WORD', dir: 'in', label: 'Reg 1 (Energie Low)', widget: 'value', init: 0 },
          { name: 'wReg2', type: 'WORD', dir: 'in', label: 'Reg 2 (Spannung High)', widget: 'value', init: 0 },
          { name: 'wReg3', type: 'WORD', dir: 'in', label: 'Reg 3 (Spannung Low)', widget: 'value', init: 0 },
          { name: 'wReg4', type: 'WORD', dir: 'in', label: 'Reg 4 (Strom 0,01 A)', widget: 'value', init: 0 },
          { name: 'wReg5', type: 'WORD', dir: 'in', label: 'Reg 5 (Status)', widget: 'value', init: 0 },
          { name: 'diEnergy', type: 'DINT', dir: 'out', label: 'Energie', widget: 'value', unit: 'Wh' },
          { name: 'rVoltage', type: 'REAL', dir: 'out', label: 'Spannung', widget: 'gauge', min: 0, max: 400, unit: 'V' },
          { name: 'rCurrent', type: 'REAL', dir: 'out', label: 'Strom', widget: 'value', unit: 'A' },
          { name: 'doValid', type: 'BOOL', dir: 'out', label: 'Messwerte gültig', widget: 'led' },
          { name: 'doOverload', type: 'BOOL', dir: 'out', label: 'Überlast', widget: 'led' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Energie: High-Wort zuerst *)
	diEnergy := WORD_TO_DINT(wReg0) * 65536 + WORD_TO_DINT(wReg1);
	(* TODO: Spannung als IEEE 754 decodieren *)
	rVoltage := 0.0;
	(* TODO: Strom, Statusbits *)
END_PROGRAM
`,
          var: `VAR
	dwE : DWORD;
	dwU : DWORD;
	dwMant : DWORD;
	iExp : INT;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Energie: DINT, High-Wort zuerst *)
	dwE := SHL(WORD_TO_DWORD(wReg0), 16) OR WORD_TO_DWORD(wReg1);
	diEnergy := DWORD_TO_DINT(dwE);

	(* Spannung: IEEE 754 *)
	dwU := SHL(WORD_TO_DWORD(wReg2), 16) OR WORD_TO_DWORD(wReg3);
	iExp := DWORD_TO_INT(SHR(dwU, 23) AND 16#FF);
	dwMant := dwU AND 16#7FFFFF;
	IF iExp = 0 THEN
		rVoltage := 0.0;
	ELSE
		rVoltage := (1.0 + UDINT_TO_REAL(DWORD_TO_UDINT(dwMant)) / 8388608.0) * 2.0 ** INT_TO_REAL(iExp - 127);
		IF (SHR(dwU, 31) AND 1) = 1 THEN
			rVoltage := -rVoltage;
		END_IF;
	END_IF;

	(* Strom: INT in 0,01 A *)
	rCurrent := INT_TO_REAL(WORD_TO_INT(wReg4)) * 0.01;

	(* Status *)
	doValid := wReg5.0;
	doOverload := wReg5.3;
END_PROGRAM
`,
          var: `VAR
	dwE : DWORD;
	dwU : DWORD;
	dwMant : DWORD;
	iExp : INT;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Positive Energie', steps: [
            { set: { wReg0: 0x0001, wReg1: 0xE240 } }, { cycles: 2 },
            { expect: 'diEnergy = 123456', msg: '16#0001E240 entspricht 123456 Wh.' }
          ]},
          { name: 'Spannung 230,5 V (IEEE 754)', steps: [
            { set: { wReg2: 0x4366, wReg3: 0x8000 } }, { cycles: 2 },
            { expect: 'ABS(rVoltage - 230.5) < 0.01', msg: '16#43668000 muss 230,5 ergeben.' }
          ]},
          { name: 'Negative Werte', steps: [
            { set: { wReg0: 0xFFFF, wReg1: 0xFFFE, wReg2: 0xC144, wReg3: 0x0000, wReg4: 0xFF9C } }, { cycles: 2 },
            { expect: 'diEnergy = -2', msg: '16#FFFFFFFE ist als DINT −2 (Zweierkomplement).' },
            { expect: 'ABS(rVoltage + 12.25) < 0.01', msg: '16#C1440000 entspricht −12,25.' },
            { expect: 'ABS(rCurrent + 1.0) < 0.001', msg: '16#FF9C = −100 → −1,00 A.' }
          ]},
          { name: 'Nullwert und Strom', steps: [
            { set: { wReg4: 1234 } }, { cycles: 2 },
            { expect: 'rVoltage = 0.0', msg: 'Bitmuster 0 ergibt 0,0 V.' },
            { expect: 'ABS(rCurrent - 12.34) < 0.001', msg: '1234 → 12,34 A.' }
          ]},
          { name: 'Statusbits', steps: [
            { set: { wReg5: 0x0009 } }, { cycles: 2 },
            { expect: 'doValid AND doOverload' },
            { set: { wReg5: 0x0001 } }, { cycles: 2 },
            { expect: 'doValid AND NOT doOverload', msg: 'Nur Bit 0 gesetzt: gültig, keine Überlast.' }
          ]}
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────── L3 · Projekt: Diagnose & Kommunikations-Watchdog ─────────────────────────────
  {
    id: 'komm-3-watchdog-projekt',
    level: 3,
    kind: 'projekt',
    title: 'Praxisprojekt: Kommunikationsdiagnose mit Wireshark und Watchdog',
    summary: 'Du zeichnest Verkehr mit Wireshark auf, filterst OPC UA, Modbus und POWERLINK und baust einen Heartbeat-Watchdog, der die Maschine bei Kommunikationsausfall sicher stoppt.',
    minutes: 240,
    req: ['komm-3-opcua', 'komm-3-modbus-iolink'],
    briefing: 'Kommunikation fällt aus – das ist keine Frage des Ob, sondern des Wann: Kabel werden gezogen, Leitsysteme neu gestartet, Switches getauscht. ' +
      'Eine professionelle Maschine erkennt das zuverlässig und reagiert definiert. Dafür brauchst du zwei Fähigkeiten: Verkehr sichtbar machen (Wireshark) und Lebendigkeit überwachen (Heartbeat-Watchdog). ' +
      'In diesem Projekt kombinierst du beides und dokumentierst das Ergebnis für deinen Ausbilder.',
    practice: 'Ein Leitsystem schreibt Aufträge per OPC UA und erwartet, dass die Maschine stoppt, wenn es selbst ausfällt. Der Kunde fordert in der Abnahme den Nachweis: Stecker ziehen – Maschine stoppt innerhalb von 0,5 s und meldet eine Störung.',
    transfer: {
      tia: 'In PROFINET übernimmt der Watchdog des IO-Device diese Aufgabe für zyklische Daten. Für Applikationsdaten (z. B. per OPC UA) baust du einen Heartbeat wie hier.',
      codesys: 'Gleiches Muster in CODESYS/TwinCAT: Lebensbit/Zähler vom Partner, TON als Timeout, Fehler speichernd mit Quittierung.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Zeichne Netzwerkverkehr mit Wireshark auf',
        guide: {
          intro: 'Wireshark macht sichtbar, was wirklich auf der Leitung passiert – unverzichtbar, wenn sich zwei Systeme gegenseitig die Schuld geben.',
          steps: [
            'Installiere Wireshark und wähle unter **Capture › Options** die Netzwerkkarte, die mit dem Maschinennetz verbunden ist.',
            'Starte die Aufzeichnung (Strg+E) und erzeuge Verkehr: ping zur Steuerung, Verbindung mit UaExpert.',
            'Filtere mit Display-Filtern: `icmp`, `arp`, `tcp.port == 4840`, `opcua`, `mbtcp`, `epl` (POWERLINK).',
            'Öffne ein Paket und klappe die Schichten auf: Ethernet II (MAC), IPv4, TCP (Ports, Flags), Anwendung.',
            'Speichere die Aufzeichnung als `.pcapng` und notiere die Filter, die du verwendet hast.'
          ],
          code: { lang: 'text', text: 'ip.addr == 192.168.10.20 && tcp.port == 4840\ntcp.flags.syn == 1\nmbtcp && modbus.func_code == 3\nepl' },
          done: 'Erledigt, wenn du eine Aufzeichnung mit sichtbarem TCP-Verbindungsaufbau (SYN, SYN-ACK, ACK) zu Port 4840 hast.',
          tip: 'Für POWERLINK brauchst du einen Hub oder einen Mirror-Port bzw. TAP – an einem normalen Switch-Port siehst du nur deinen eigenen Verkehr.',
          link: { label: 'Wireshark User’s Guide: Capturing', url: 'https://www.wireshark.org/docs/wsug_html_chunked/ChapterCapture.html' }
        }
      },
      {
        id: 'o2',
        title: 'Analysiere einen TCP-Verbindungsabbruch',
        guide: {
          intro: 'Wie sieht ein sauberer Abbau aus, wie ein harter Abbruch?',
          steps: [
            'Verbinde UaExpert mit dem Server und trenne die Verbindung regulär. Suche die Pakete mit FIN-Flag (`tcp.flags.fin == 1`).',
            'Verbinde erneut und ziehe dann das Netzwerkkabel bzw. beende den Server hart. Beobachte Retransmissions (`tcp.analysis.retransmission`) und RST-Pakete.',
            'Miss mit der Zeitspalte, wie lange es dauert, bis der Client den Abbruch bemerkt.',
            'Halte fest: TCP allein erkennt einen Ausfall oft erst nach Sekunden. Deshalb brauchst du auf Applikationsebene einen Watchdog.'
          ],
          done: 'Erledigt, wenn du in deiner Aufzeichnung einen regulären Abbau (FIN) und einen Abbruch (Retransmissions/RST) zeigen kannst.',
          tip: 'Statistics › Conversations zeigt dir alle Verbindungen auf einen Blick – ideal, um unerwartete Teilnehmer zu finden.',
          link: { label: 'B&R Help: POWERLINK – External diagnostic tools', url: H('communication/powerlink/powerlink_diagnostic_sniffer.html') }
        }
      },
      {
        id: 'o3',
        title: 'Implementiere einen Heartbeat-Watchdog',
        guide: {
          intro: 'Der Partner erhöht zyklisch einen Zähler. Ändert er sich zu lange nicht, gilt die Kommunikation als gestört.',
          steps: [
            'Vergleiche in jedem Zyklus den empfangenen Zähler mit dem zuletzt gespeicherten Wert.',
            'Starte einen `TON`, solange sich der Wert nicht ändert; jede Änderung setzt ihn zurück.',
            'Läuft der Timer ab, setze eine speichernde Störung und schalte sicherheitsgerichtete Funktionen ab (hier: Motor).',
            'Die Störung darf erst quittiert werden, wenn die Kommunikation wieder läuft.',
            'Sende einen eigenen Heartbeat zurück, damit auch der Partner dich überwachen kann.'
          ],
          done: 'Erledigt, wenn deine Übung alle Tests besteht.',
          tip: 'Wähle das Timeout als Vielfaches des Heartbeat-Intervalls (z. B. 5×), sonst führen einzelne verspätete Telegramme zu Fehlalarmen.'
        }
      },
      {
        id: 'o4',
        title: 'Dokumentiere den Nachweis',
        guide: {
          intro: 'Ein Projekt ist erst fertig, wenn es nachvollziehbar dokumentiert ist.',
          steps: [
            'Lege im Git-Repository (z. B. git.breitner.de) einen Ordner `doku/komm-l3` an.',
            'Lege die `.pcapng`-Aufzeichnung und Screenshots der Filter ab.',
            'Beschreibe in einer README: Heartbeat-Intervall, Timeout, Reaktion, Quittierung, gemessene Reaktionszeit.',
            'Committe Code und Doku und reiche den Link als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist und Code, Aufzeichnung und README enthält.',
          tip: 'Achte darauf, dass Aufzeichnungen keine Passwörter oder Kundendaten enthalten, bevor du sie teilst.'
        }
      }
    ],
    videos: [
      { id: 'XvNKSNI0K_0', title: 'WIRESHARK IN 20 MINUTEN LERNEN [Full-HD] [GER] Wireshark Crashkurs', channel: 'hackandcode', lang: 'de', why: 'Deutscher Crashkurs zu Aufzeichnung und Filtern.' },
      { id: 'Xi7Ek7BDsMo', title: 'What is a heartbeat bit? | Panel City Explains', channel: 'Panel City | Unplugged Automation Lab', lang: 'en', why: 'Erklärt das Heartbeat-Prinzip zwischen Steuerungen.' },
      { id: 'Tyj1uFz2t7k', title: 'Industrielle Kommunikation, Digitale Schleifen, RS-232, RS-422, RS-485, IO-Link | Prof. Griesbauer', channel: 'Prof Joe', lang: 'de', why: 'Vorlesung zu serieller Kommunikation und IO-Link als Hintergrund für die Diagnose.' }
    ],
    readings: [
      {
        title: 'Wireshark User’s Guide', author: 'Lamping, U., Sharpe, R., & Warnicke, E.', institution: 'Wireshark Foundation',
        work: 'Wireshark Documentation', year: 2026, type: 'Dokumentation', minutes: 40,
        url: 'https://www.wireshark.org/docs/wsug_html_chunked/',
        why: 'Offizielles Handbuch zu Aufzeichnung, Filtern und Statistik.',
        apa: 'Lamping, U., Sharpe, R., & Warnicke, E. (2026). *Wireshark User’s Guide*. Wireshark Foundation. ' + ABGERUFEN + 'https://www.wireshark.org/docs/wsug_html_chunked/'
      },
      {
        title: 'Display Filter Reference: Ethernet POWERLINK V2', author: 'Wireshark Foundation', institution: 'Wireshark Foundation',
        work: 'Display Filter Reference', year: 2026, type: 'Dokumentation', minutes: 10,
        url: 'https://www.wireshark.org/docs/dfref/e/epl.html',
        why: 'Alle Filterfelder für POWERLINK-Telegramme (SoC, PReq, PRes, SoA).',
        apa: 'Wireshark Foundation. (2026). *Display Filter Reference: Ethernet POWERLINK V2*. ' + ABGERUFEN + 'https://www.wireshark.org/docs/dfref/e/epl.html'
      },
      brHelp('POWERLINK – External diagnostic tools', 'communication/powerlink/powerlink_diagnostic_sniffer.html', 'B&R-Hinweise zur Diagnose von POWERLINK mit Wireshark.', 10)
    ],
    quiz: [
      {
        type: 'single', q: 'Mit welchem Wireshark-Display-Filter siehst du nur OPC-UA-Verkehr über den Standardport?',
        options: ['port 4840', 'tcp.port == 4840', 'opcua.port = 4840', 'ip.port == 4840'], correct: 1,
        explain: 'Display-Filter verwenden Feldnamen wie tcp.port. „port 4840“ ist Capture-Filter-Syntax (BPF).'
      },
      {
        type: 'numeric', q: 'Der Partner sendet alle {T} ms einen neuen Heartbeat. Du willst 5 ausbleibende Telegramme tolerieren. Wie groß wählst du das Timeout?',
        params: { T: [20, 200, 10] }, formula: 'T * 5', unit: 'ms', tol: 0,
        explain: 'Timeout = Anzahl tolerierter Ausfälle × Intervall.'
      },
      {
        type: 'single', q: 'Warum reicht TCP allein nicht zur Ausfallerkennung?',
        options: ['TCP erkennt Abbrüche überhaupt nicht.', 'Ohne Datenverkehr oder Keepalive bemerkt TCP einen Kabelbruch oft erst nach Sekunden bis Minuten.', 'TCP ist verbindungslos.', 'TCP wird von Firewalls immer blockiert.'], correct: 1,
        explain: 'Retransmission-Timeouts sind lang. Ein Applikations-Heartbeat erkennt Ausfälle in definierter Zeit.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Warum siehst du an einem normalen Switch-Port mit Wireshark keinen POWERLINK-Verkehr zwischen anderen Knoten?',
        options: ['Wireshark unterstützt POWERLINK nicht.', 'Ein Switch leitet Unicast-Verkehr nur an den Zielport weiter; du brauchst Hub, Mirror-Port oder TAP.', 'POWERLINK ist verschlüsselt.', 'POWERLINK nutzt kein Ethernet.'], correct: 1,
        explain: 'Zum Mitschneiden fremden Verkehrs brauchst du einen Messpunkt, der alle Pakete sieht.'
      },
      {
        type: 'multi', q: 'Welche Eigenschaften hat ein guter Kommunikations-Watchdog?',
        options: ['Fehler wird gespeichert und muss quittiert werden.', 'Quittierung ist nur möglich, wenn die Kommunikation wieder läuft.', 'Timeout als Vielfaches des Heartbeat-Intervalls', 'Der Fehler wird jeden Zyklus neu gezählt.'], correct: [0, 1, 2],
        explain: 'Ein Ausfall soll genau einmal gezählt werden; speichernd mit Quittierung und sinnvollem Timeout.'
      },
      {
        type: 'single', q: 'Welches TCP-Flag kennzeichnet den regulären Verbindungsabbau?',
        options: ['SYN', 'FIN', 'PSH', 'URG'], correct: 1,
        explain: 'FIN beendet die Verbindung geordnet; RST bricht sie hart ab.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Heartbeat-Watchdog mit Störungsquittierung',
        task: 'Ein Leitsystem erhöht alle 100 ms den Zähler `uiHeartbeatIn` (UINT). Die Anlagen-Simulation bildet das nach; mit dem Schalter `diPartnerOk` kannst du den Partner „ausfallen“ lassen.\n\n' +
          '**Anforderungen:**\n' +
          '1. Ändert sich `uiHeartbeatIn` **länger als 500 ms** nicht, setze die speichernde Störung `doCommFault`.\n' +
          '2. Jeder Ausfall erhöht `udFaultCount` genau **einmal**.\n' +
          '3. `doMotor` = `diRunReq` UND keine Störung.\n' +
          '4. Quittieren mit steigender Flanke an `diAck` – aber nur, wenn die Kommunikation wieder läuft (Heartbeat ändert sich wieder).\n' +
          '5. Sende einen eigenen Heartbeat: `uiHeartbeatOut` alle 100 ms um 1 erhöhen.',
        hints: ['Merke dir den letzten Wert: `IF uiHeartbeatIn <> uiLastHb THEN … END_IF`.', 'TON fbTimeout mit IN := NOT bChanged – jede Änderung setzt ihn für einen Zyklus zurück.', 'Selbst rücksetzender Takt: `fbPulse(IN := NOT fbPulse.Q, PT := T#100ms);`'],
        cycleMs: 10,
        io: [
          { name: 'uiHeartbeatIn', type: 'UINT', dir: 'in', label: 'Heartbeat vom Leitsystem', widget: 'value' },
          { name: 'diPartnerOk', type: 'BOOL', dir: 'in', label: 'Simulation: Partner aktiv', widget: 'switch', init: true },
          { name: 'diRunReq', type: 'BOOL', dir: 'in', label: 'Laufanforderung', widget: 'switch' },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittiertaster', widget: 'button' },
          { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Motor', widget: 'led' },
          { name: 'doCommFault', type: 'BOOL', dir: 'out', label: 'Störung Kommunikation', widget: 'led' },
          { name: 'uiHeartbeatOut', type: 'UINT', dir: 'out', label: 'Eigener Heartbeat', widget: 'value' },
          { name: 'udFaultCount', type: 'UDINT', dir: 'out', label: 'Anzahl Ausfälle', widget: 'value' }
        ],
        scene: { type: 'motor', bind: { run: 'doMotor', fault: 'doCommFault' } },
        plant: {
          var: 'VAR\n\tfbPartner : TON;\nEND_VAR\n',
          code: 'fbPartner(IN := diPartnerOk AND NOT fbPartner.Q, PT := T#100ms);\nIF fbPartner.Q THEN\n\tuiHeartbeatIn := uiHeartbeatIn + 1;\nEND_IF;\n'
        },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Heartbeat überwachen, Störung speichern, quittieren *)
	doMotor := diRunReq;
END_PROGRAM
`,
          var: `VAR
	uiLastHb : UINT;
	bChanged : BOOL;
	fbTimeout : TON;
	fbAck : R_TRIG;
	fbPulse : TON;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Änderung erkennen *)
	bChanged := uiHeartbeatIn <> uiLastHb;
	uiLastHb := uiHeartbeatIn;

	(* Timeout: läuft, solange sich nichts ändert *)
	fbTimeout(IN := NOT bChanged, PT := T#500ms);
	IF fbTimeout.Q AND NOT doCommFault THEN
		doCommFault := TRUE;
		udFaultCount := udFaultCount + 1;
	END_IF;

	(* Quittierung nur bei laufender Kommunikation *)
	fbAck(CLK := diAck);
	IF fbAck.Q AND doCommFault AND NOT fbTimeout.Q THEN
		doCommFault := FALSE;
	END_IF;

	doMotor := diRunReq AND NOT doCommFault;

	(* Eigener Heartbeat alle 100 ms *)
	fbPulse(IN := NOT fbPulse.Q, PT := T#100ms);
	IF fbPulse.Q THEN
		uiHeartbeatOut := uiHeartbeatOut + 1;
	END_IF;
END_PROGRAM
`,
          var: `VAR
	uiLastHb : UINT;
	bChanged : BOOL;
	fbTimeout : TON;
	fbAck : R_TRIG;
	fbPulse : TON;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Normalbetrieb ohne Fehlalarm', steps: [
            { set: { diRunReq: true } },
            { never: 'doCommFault', ms: 2000, msg: 'Bei laufendem Heartbeat darf keine Störung kommen.' },
            { expect: 'doMotor', msg: 'Ohne Störung muss der Motor laufen.' }
          ]},
          { name: 'Ausfall wird in 0,5 s erkannt', steps: [
            { set: { diRunReq: true } }, { ms: 500 },
            { set: { diPartnerOk: false } },
            { never: 'doCommFault', ms: 350, msg: 'Die Störung kommt zu früh – Timeout 500 ms ab der letzten Änderung.' },
            { until: 'doCommFault', maxMs: 400, msg: 'Spätestens 500 ms nach der letzten Änderung muss doCommFault kommen.' },
            { expect: 'NOT doMotor', msg: 'Bei Kommunikationsstörung muss der Motor stoppen.' },
            { expect: 'udFaultCount = 1' }
          ]},
          { name: 'Störung speichert und lässt sich nach Wiederkehr quittieren', steps: [
            { set: { diRunReq: true, diPartnerOk: false } },
            { until: 'doCommFault', maxMs: 1000 },
            { set: { diPartnerOk: true } }, { ms: 500 },
            { expect: 'doCommFault', msg: 'Die Störung muss gespeichert bleiben, bis quittiert wird.' },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 1 },
            { expect: 'NOT doCommFault AND doMotor', msg: 'Nach Quittierung bei laufender Kommunikation ist die Störung weg.' },
            { expect: 'udFaultCount = 1', msg: 'Ein Ausfall darf nur einmal gezählt werden.' }
          ]},
          { name: 'Quittieren bei anstehendem Ausfall wirkungslos', steps: [
            { set: { diPartnerOk: false } },
            { until: 'doCommFault', maxMs: 1000 },
            { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
            { expect: 'doCommFault', msg: 'Solange der Partner ausgefallen ist, darf die Quittierung nicht wirken.' }
          ]},
          { name: 'Eigener Heartbeat alle 100 ms', steps: [
            { ms: 1000 },
            { expect: 'uiHeartbeatOut >= 8 AND uiHeartbeatOut <= 11', msg: 'In 1 s muss uiHeartbeatOut etwa 9- bis 10-mal erhöht werden.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Kommunikations-Diagnostiker'
  }
];
