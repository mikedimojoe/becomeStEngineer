'use strict';
const { ABGERUFEN, H, brHelp } = require('./_common');

// Gemeinsame Beschreibung der simulierten AsTCP-Bausteine (für Aufgabentexte)
const TCP_SIM = '\n\n**Simulierte AsTCP-Bausteine (Annahmen der Übungsumgebung):**\n' +
  '* `TcpOpen(enable, pIfAddr, port, options → status, ident)` – öffnet einen Socket. `pIfAddr := 0` (alle Schnittstellen), `port := 0` (Port automatisch), `options := 0`. Bei Erfolg `status = ERR_OK` und `ident <> 0`.\n' +
  '* `TcpClient(enable, ident, pServer, portserv → status)` – verbindet mit dem Server. `pServer := ADR(sServer)` (STRING mit der IP-Adresse). Die simulierte Gegenstelle ist ein **Echo-Server auf 127.0.0.1:5000**. Jede andere Adresse oder jeder andere Port liefert einen Fehlerstatus.\n' +
  '* `TcpSend(enable, ident, pData, datalen, flags → status, sentlen)` – sendet `datalen` Bytes ab `pData := ADR(…)`.\n' +
  '* `TcpRecv(enable, ident, pData, datamax, flags → status, recvlen)` – kopiert höchstens `datamax` empfangene Bytes nach `pData`. Liegt nichts vor: `status = tcpERR_NO_DATA`. Ist die Verbindung weg: `tcpERR_NOT_CONNECTED`. Der Echo-Server schickt gesendete Bytes unverändert zurück. Bei einem STRING-Puffer wird das Ergebnis nullterminiert.\n' +
  '* `TcpClose(enable, ident, how → status)` – schließt den Socket, `how := 0`.\n' +
  '* Alle Bausteine arbeiten **asynchron**: Der erste Aufruf mit `enable := TRUE` liefert `status = ERR_FUB_BUSY` (65535), der nächste das Ergebnis. Wird ein Baustein danach weiter mit `enable := TRUE` aufgerufen, startet er einen neuen Auftrag.\n' +
  '* Verwende die Konstanten `ERR_OK`, `ERR_FUB_BUSY`, `tcpERR_NO_DATA`, `tcpERR_NOT_CONNECTED` statt fester Zahlen. Jeder andere Status ist ein Fehler.\n' +
  '* Mit dem Schalter `diNetDown` simulierst du eine Netzunterbrechung: Senden/Empfangen liefern dann `tcpERR_NOT_CONNECTED`, Verbinden schlägt fehl.';

module.exports = [
  // ───────────────────────────── L4 · TCP/UDP-Sockets mit AsTCP ─────────────────────────────
  {
    id: 'komm-4-tcp',
    level: 4,
    kind: 'lektion',
    title: 'TCP- und UDP-Sockets mit AsTCP/AsUDP',
    summary: 'Du programmierst einen TCP-Client als Zustandsautomaten mit den asynchronen AsTCP-Bausteinen – mit sauberer Fehlerbehandlung und Ressourcenfreigabe.',
    minutes: 240,
    req: ['komm-3-watchdog-projekt'],
    briefing: 'Nicht jedes Gerät spricht OPC UA oder Modbus: Kamerasysteme, Scanner, Etikettendrucker und Prüfrechner nutzen oft ein eigenes Telegramm-Protokoll über TCP oder UDP. ' +
      'Mit den Bibliotheken **AsTCP** und **AsUDP** programmierst du solche Verbindungen selbst. Die Bausteine arbeiten asynchron: Sie melden ERR_FUB_BUSY (65535), bis der Auftrag erledigt ist. ' +
      'Deshalb gehört jede Socket-Kommunikation in einen Zustandsautomaten: Öffnen, Verbinden, Senden, Empfangen, Schließen – und in jedem Zustand eine Fehlerbehandlung, die den Socket wieder freigibt.',
    practice: 'Ein Kamerasystem liefert nach jedem Trigger per TCP einen String mit Prüfergebnis. Bricht die Verbindung ab und dein Programm schließt den Socket nicht, gehen der Steuerung nach einigen Stunden die Socket-Ressourcen aus.',
    transfer: {
      tia: 'Im TIA Portal entspricht das der „Open User Communication“ mit TCON, TSEND, TRCV, TDISCON bzw. TSEND_C/TRCV_C. Auch dort arbeiten die Bausteine asynchron (BUSY/DONE/ERROR).',
      codesys: 'In CODESYS nutzt du die Bibliothek SysSocket bzw. Net Base Services (TCP_Connection, TCP_Write, TCP_Read), in TwinCAT den TF6310 TCP/IP.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Unterscheide TCP und UDP und wähle das passende Protokoll',
        guide: {
          intro: 'TCP liefert einen zuverlässigen, geordneten Byte-Strom über eine Verbindung; UDP überträgt einzelne Datagramme ohne Verbindung und ohne Zustellgarantie.',
          steps: [
            'Lies in der B&R-Hilfe die Einführung zu AsTCP („TCP – Transmission control protocol“) und zu AsUDP.',
            'Erkläre den Drei-Wege-Handschlag (SYN, SYN-ACK, ACK) und den Verbindungsabbau (FIN).',
            'Erkläre, warum TCP ein **Strom** ist: Zwei gesendete Telegramme können zusammen oder in Teilen ankommen. Du brauchst also ein Telegrammende (Länge oder Endezeichen).',
            'Ordne Anwendungsfälle zu: Kamera-Ergebnis (TCP), zyklischer Status-Broadcast an viele Empfänger (UDP), Zeitsynchronisation NTP (UDP).'
          ],
          done: 'Erledigt, wenn du für drei Anwendungsfälle begründet TCP oder UDP wählen kannst.',
          tip: 'Die B&R-Community diskutiert genau dieses Problem: TcpRecv kann zwei Telegramme auf einmal in den Puffer schreiben.',
          link: { label: 'B&R Help: AsTCP', url: H('libraries/astcp/astcp.html') }
        }
      },
      {
        id: 'o2',
        title: 'Lies die Schnittstellen von TcpOpen, TcpClient, TcpSend, TcpRecv und TcpClose',
        guide: {
          intro: 'Die Parameter der AsTCP-Bausteine findest du in der B&R-Hilfe unter Libraries › AsTCP › Function blocks.',
          steps: [
            'Öffne in Automation Studio die Hilfe (F1) und suche nach `TcpOpen`.',
            'Notiere Ein- und Ausgänge: `enable`, `pIfAddr`, `port`, `options` → `status`, `ident`.',
            'Notiere für TcpClient (`ident`, `pServer`, `portserv`), TcpSend (`pData`, `datalen`, `flags`, → `sentlen`), TcpRecv (`pData`, `datamax`, → `recvlen`) und TcpClose (`how`).',
            'Notiere die wichtigsten Statuswerte: 0 (ERR_OK), 65535 (ERR_FUB_BUSY), 32605 (tcpERR_NO_DATA), 32608 (tcpERR_INVALID), 32609 (tcpERR_NOT_CONNECTED).',
            'Füge die Bibliothek AsTCP in der Logical View über **Add Object › Library** zu deinem Projekt hinzu.'
          ],
          done: 'Erledigt, wenn du eine Tabelle aller fünf Bausteine mit Ein-/Ausgängen und den fünf Statuswerten hast.',
          tip: 'Laut Hilfe muss nach tcpERR_INVALID bei TcpClient der Socket mit TcpClose geschlossen und für einen neuen Versuch komplett neu geöffnet werden.',
          link: { label: 'B&R Help: TcpClient()', url: H('libraries/astcp/fbks/tcpclient.html') }
        }
      },
      {
        id: 'o3',
        title: 'Baue einen Client-Zustandsautomaten mit Fehlerbehandlung',
        guide: {
          intro: 'Jeder Zustand ruft genau einen Baustein auf und wertet `status` aus: 65535 = warten, 0 = weiter, sonst Fehler.',
          steps: [
            'Lege die Zustände fest: IDLE, OPEN, CONNECT, READY, SEND, RECV, CLOSE, CLOSE_ERR, ERROR.',
            'Rufe den Baustein im Zustand mit `enable := TRUE` auf und frage danach `status` ab.',
            'Speichere bei Fehlern den Status für die Diagnose und gehe in CLOSE_ERR – der Socket muss immer geschlossen werden.',
            'Überwache das Warten auf Antwort mit einem Timeout (TON).',
            'Teste mit einem PC-Werkzeug als Gegenstelle (z. B. einem einfachen TCP-Echo-Server) und Wireshark.'
          ],
          code: { lang: 'st', text: '20: (* CONNECT *)\n\tTcpClient_0(enable := TRUE, ident := udIdent, pServer := ADR(sServer), portserv := uiPort);\n\tIF TcpClient_0.status = ERR_OK THEN\n\t\tuiState := 30;\n\tELSIF TcpClient_0.status <> ERR_FUB_BUSY THEN\n\t\tuiErrorStatus := TcpClient_0.status;\n\t\tuiState := 90;\n\tEND_IF;' },
          done: 'Erledigt, wenn deine Übung alle Tests besteht.',
          tip: 'Gib jedem Zustand eine Nummer mit Lücken (10, 20, 30 …). So kannst du später Zwischenzustände einfügen, ohne die Diagnose-Doku zu ändern.'
        }
      },
      {
        id: 'o4',
        title: 'Setze UDP für einen Status-Broadcast ein',
        guide: {
          intro: 'AsUDP funktioniert ähnlich, aber ohne Verbindung: UdpOpen, UdpSend (mit Zieladresse), UdpRecv, UdpClose.',
          steps: [
            'Öffne in der B&R-Hilfe die Bausteinübersicht von AsUDP und vergleiche die Parameter mit AsTCP.',
            'Skizziere einen Automaten für das zyklische Senden eines Status-Datagramms an 192.168.10.255 (Broadcast im /24-Netz).',
            'Überlege, was beim Empfänger passiert, wenn ein Datagramm verloren geht, und wie eine Sequenznummer hilft.'
          ],
          done: 'Erledigt, wenn dein Automaten-Entwurf für UDP fertig ist und du den Unterschied in der Fehlerbehandlung zu TCP erklären kannst.',
          tip: 'Broadcasts werden von Routern nicht weitergeleitet – für Verkehr über Netzgrenzen brauchst du Unicast oder Multicast.',
          link: { label: 'B&R Help: AsUDP', url: H('libraries/asudp/asudp.html') }
        }
      }
    ],
    videos: [
      { id: 'whZ2o8WtS8A', title: 'Erklär mir: TCP- und UDP-Verbindung | TCP Handshake [Deutsch/German]', channel: 'GamesNotOver', lang: 'de', why: 'Erklärt Handshake und Unterschied TCP/UDP auf Deutsch.' },
      { id: 'oPsRk-7ihfI', title: 'TCP vs UDP einfach erklärt | Unterschiede, Vorteile & wann welches Protokoll?', channel: 'MyDigiAcademy', lang: 'de', why: 'Entscheidungshilfe, wann welches Protokoll passt.' },
      { id: 'QLvDf3o7BpE', title: 'TCP and UDP: Sockets', channel: 'Rick Graziani', lang: 'en', why: 'Hochschuldozent erklärt Sockets, Ports und Client/Server.' }
    ],
    readings: [
      brHelp('AsTCP – TCP (Transmission control protocol)', 'libraries/astcp/gen/astcp_datagram.html', 'Grundlagen von TCP aus Sicht der B&R-Bibliothek.', 20),
      brHelp('TcpRecv()', 'libraries/astcp/fbks/tcprecv.html', 'Parameter, Statuswerte und Verhalten beim Verbindungsende.', 15),
      {
        title: 'RFC 9293: Transmission Control Protocol (TCP)', author: 'Eddy, W.', institution: 'IETF / RFC Editor',
        work: 'Request for Comments', year: 2022, type: 'Norm/Amtlich', minutes: 40,
        url: 'https://www.rfc-editor.org/rfc/rfc9293',
        why: 'Aktuelle TCP-Spezifikation inkl. Zustandsdiagramm – zum Nachschlagen.',
        apa: 'Eddy, W. (Hrsg.). (2022). *Transmission Control Protocol (TCP)* (RFC 9293). RFC Editor. ' + ABGERUFEN + 'https://www.rfc-editor.org/rfc/rfc9293'
      }
    ],
    quiz: [
      {
        type: 'single', q: 'TcpClient liefert im ersten Aufruf status = 65535. Was tust du?',
        options: ['Fehler melden und Socket schließen', 'Im nächsten Zyklus erneut aufrufen, bis ein anderer Status kommt', 'Den Baustein mit enable := FALSE aufrufen', 'Sofort TcpSend aufrufen'], correct: 1,
        explain: '65535 = ERR_FUB_BUSY: Der Auftrag läuft noch. Der Baustein muss weiter aufgerufen werden.'
      },
      {
        type: 'single', q: 'TcpRecv liefert status = 0 und recvlen = 0. Was bedeutet das?',
        options: ['Es liegen noch keine Daten vor.', 'Die Gegenstelle hat die Verbindung (mindestens schreibend) geschlossen.', 'Der Puffer ist zu klein.', 'Die Verbindung ist besonders schnell.'], correct: 1,
        explain: 'Laut B&R-Hilfe heißt recvlen = 0 bei ERR_OK, dass die Gegenstelle geschlossen hat – du solltest mit TcpClose reagieren.'
      },
      {
        type: 'multi', q: 'Welche Aussagen zu TCP sind richtig?',
        options: ['TCP überträgt einen Byte-Strom; Telegrammgrenzen bleiben nicht erhalten.', 'TCP garantiert Reihenfolge und Zustellung (oder meldet einen Fehler).', 'TCP ist verbindungslos.', 'Ein Verbindungsaufbau beginnt mit einem SYN-Segment.'], correct: [0, 1, 3],
        explain: 'TCP ist verbindungsorientiert; Telegrammgrenzen muss die Anwendung selbst definieren.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'TcpClient meldet tcpERR_INVALID (32608). Was verlangt die B&R-Hilfe für einen neuen Versuch?',
        options: ['TcpClient einfach erneut aufrufen', 'Socket mit TcpClose schließen und mit TcpOpen neu öffnen', 'Die SPS neu starten', 'Den Port erhöhen'], correct: 1,
        explain: 'Nach tcpERR_INVALID muss der Socket geschlossen und komplett neu geöffnet werden.'
      },
      {
        type: 'single', q: 'Warum gehört jeder Socket-Ablauf in einen Zustandsautomaten?',
        options: ['Weil ST keine IF-Anweisungen kennt', 'Weil die Bausteine asynchron sind und über mehrere Zyklen laufen', 'Weil sonst die Zykluszeit sinkt', 'Weil AsTCP nur in Ladder funktioniert'], correct: 1,
        explain: 'Asynchrone Bausteine liefern ihr Ergebnis erst nach mehreren Zyklen; der Automat merkt sich, wo der Ablauf steht.'
      },
      {
        type: 'multi', q: 'Welche Fehler führen in der Praxis zu „ausgehenden“ Sockets auf der Steuerung?',
        options: ['Nach einem Fehler wird TcpClose nicht aufgerufen.', 'Bei jedem Reconnect wird ein neuer TcpOpen ausgeführt, der alte Socket aber nicht geschlossen.', 'Der Empfangspuffer wird vor TcpRecv geleert.', 'Der Socket wird bei einem Timeout geschlossen.'], correct: [0, 1],
        explain: 'Jeder geöffnete Socket belegt Ressourcen, bis er geschlossen wird.'
      },
      {
        type: 'single', q: 'Welcher Parameter von TcpRecv schützt davor, dass mehr Bytes geschrieben werden, als der Puffer fasst?',
        options: ['recvlen', 'datamax', 'flags', 'ident'], correct: 1,
        explain: 'datamax gibt die Größe des Empfangspuffers an. Stimmt der Wert nicht, kann Speicher überschrieben werden.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'TCP-Echo-Client als Zustandsautomat',
        task: 'Programmiere einen TCP-Client, der sich mit dem simulierten Echo-Server verbindet, einen Text sendet und die Antwort empfängt.\n\n' +
          '**Zustände (`uiState`):** 0 IDLE, 10 OPEN, 20 CONNECT, 30 READY, 40 SEND, 50 RECV, 80 CLOSE, 90 CLOSE_ERR, 99 ERROR.\n\n' +
          '**Anforderungen:**\n' +
          '1. `diConnect` = TRUE startet in IDLE den Ablauf OPEN → CONNECT → READY. Server-IP steht in `sServer` (\'127.0.0.1\'), der Port in `uiPort`.\n' +
          '2. `doConnected` = TRUE in READY, SEND und RECV.\n' +
          '3. In READY startet eine steigende Flanke an `diSend` das Senden von `sTxText` (vorher in den Sendepuffer `sTxBuf` kopieren; `datalen` = Länge des Textes).\n' +
          '4. In RECV wird `TcpRecv` so lange aufgerufen, bis Daten da sind (`tcpERR_NO_DATA` = noch keine Daten). Die Antwort steht danach in `sRxText`, dann zurück nach READY. Kommt nach **2 s** keine Antwort, gilt das als Fehler mit `uiErrorStatus := 50000`. `status = 0` mit `recvlen = 0` (Gegenstelle hat geschlossen) ist ebenfalls ein Fehler (`uiErrorStatus := tcpERR_NOT_CONNECTED`).\n' +
          '5. Bei jedem Fehler (Status ≠ ERR_OK/ERR_FUB_BUSY): `uiErrorStatus` speichern, Socket schließen (CLOSE_ERR), dann ERROR mit `doError` = TRUE. Ist der Socket noch gar nicht geöffnet (Fehler in OPEN), direkt nach ERROR.\n' +
          '6. `diConnect` = FALSE in READY → CLOSE → IDLE. In ERROR führt `diConnect` = FALSE zurück nach IDLE (Fehler zurücksetzen).\n\n' +
          'Der Startcode enthält bereits OPEN. In AS6 müsstest du zusätzlich die Bibliothek AsTCP (und AsBrStr für brsmemset) einbinden.' + TCP_SIM,
        hints: ['Muster je Zustand: Baustein mit enable := TRUE aufrufen → IF status = ERR_OK THEN weiter ELSIF status <> ERR_FUB_BUSY THEN Fehler END_IF.', 'Vor dem Wechsel nach RECV: `brsmemset(ADR(sRxBuf), 0, 81);`', 'Timeout: `fbRxTimeout(IN := uiState = 50, PT := T#2s);` am Zyklusanfang aufrufen.', 'datalen := INT_TO_UDINT(LEN(sTxBuf))'],
        cycleMs: 10,
        io: [
          { name: 'diConnect', type: 'BOOL', dir: 'in', label: 'Verbinden', widget: 'switch' },
          { name: 'diSend', type: 'BOOL', dir: 'in', label: 'Senden', widget: 'button' },
          { name: 'sTxText', type: 'STRING[80]', dir: 'in', label: 'Sendetext', init: 'Hallo SPS' },
          { name: 'uiPort', type: 'UINT', dir: 'in', label: 'Server-Port', widget: 'slider', min: 4990, max: 5010, init: 5000 },
          { name: 'diNetDown', type: 'BOOL', dir: 'in', label: 'Simulation: Netz unterbrochen', widget: 'switch' },
          { name: 'doConnected', type: 'BOOL', dir: 'out', label: 'Verbunden', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Fehler', widget: 'led' },
          { name: 'uiErrorStatus', type: 'UINT', dir: 'out', label: 'Letzter Fehlerstatus', widget: 'value' },
          { name: 'sRxText', type: 'STRING[80]', dir: 'out', label: 'Empfangener Text', widget: 'value' }
        ],
        scene: { type: 'generic' },
        tcpOfflineVar: 'diNetDown',
        files: {
          main: `PROGRAM _INIT
	sServer := '127.0.0.1';
	uiState := 0;
END_PROGRAM

PROGRAM _CYCLIC
	CASE uiState OF
		0: (* IDLE *)
			IF diConnect THEN
				uiState := 10;
			END_IF;

		10: (* OPEN *)
			TcpOpen_0(enable := TRUE, pIfAddr := 0, port := 0, options := 0);
			IF TcpOpen_0.status = ERR_OK THEN
				udIdent := TcpOpen_0.ident;
				uiState := 20;
			ELSIF TcpOpen_0.status <> ERR_FUB_BUSY THEN
				uiErrorStatus := TcpOpen_0.status;
				uiState := 99;
			END_IF;

		(* TODO: 20 CONNECT, 30 READY, 40 SEND, 50 RECV, 80 CLOSE, 90 CLOSE_ERR, 99 ERROR *)
	END_CASE;

	doConnected := FALSE;
	doError := uiState = 99;
END_PROGRAM
`,
          var: `VAR
	uiState : UINT;
	udIdent : UDINT;
	sServer : STRING[20];
	sTxBuf : STRING[80];
	sRxBuf : STRING[80];
	TcpOpen_0 : TcpOpen;
	TcpClient_0 : TcpClient;
	TcpSend_0 : TcpSend;
	TcpRecv_0 : TcpRecv;
	TcpClose_0 : TcpClose;
	fbSendEdge : R_TRIG;
	fbRxTimeout : TON;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	sServer := '127.0.0.1';
	uiState := 0;
END_PROGRAM

PROGRAM _CYCLIC
	fbSendEdge(CLK := diSend);
	fbRxTimeout(IN := uiState = 50, PT := T#2s);

	CASE uiState OF
		0: (* IDLE *)
			IF diConnect THEN
				uiErrorStatus := 0;
				uiState := 10;
			END_IF;

		10: (* OPEN *)
			TcpOpen_0(enable := TRUE, pIfAddr := 0, port := 0, options := 0);
			IF TcpOpen_0.status = ERR_OK THEN
				udIdent := TcpOpen_0.ident;
				uiState := 20;
			ELSIF TcpOpen_0.status <> ERR_FUB_BUSY THEN
				uiErrorStatus := TcpOpen_0.status;
				uiState := 99;
			END_IF;

		20: (* CONNECT *)
			TcpClient_0(enable := TRUE, ident := udIdent, pServer := ADR(sServer), portserv := uiPort);
			IF TcpClient_0.status = ERR_OK THEN
				uiState := 30;
			ELSIF TcpClient_0.status <> ERR_FUB_BUSY THEN
				uiErrorStatus := TcpClient_0.status;
				uiState := 90;
			END_IF;

		30: (* READY *)
			IF NOT diConnect THEN
				uiState := 80;
			ELSIF fbSendEdge.Q THEN
				sTxBuf := sTxText;
				uiState := 40;
			END_IF;

		40: (* SEND *)
			TcpSend_0(enable := TRUE, ident := udIdent, pData := ADR(sTxBuf), datalen := INT_TO_UDINT(LEN(sTxBuf)), flags := 0);
			IF TcpSend_0.status = ERR_OK THEN
				brsmemset(ADR(sRxBuf), 0, 81);
				uiState := 50;
			ELSIF TcpSend_0.status <> ERR_FUB_BUSY THEN
				uiErrorStatus := TcpSend_0.status;
				uiState := 90;
			END_IF;

		50: (* RECV *)
			TcpRecv_0(enable := TRUE, ident := udIdent, pData := ADR(sRxBuf), datamax := 80, flags := 0);
			IF TcpRecv_0.status = ERR_OK THEN
				IF TcpRecv_0.recvlen > 0 THEN
					sRxText := sRxBuf;
					uiState := 30;
				ELSE
					uiErrorStatus := tcpERR_NOT_CONNECTED; (* Gegenstelle hat geschlossen *)
					uiState := 90;
				END_IF;
			ELSIF TcpRecv_0.status = tcpERR_NO_DATA OR TcpRecv_0.status = ERR_FUB_BUSY THEN
				IF fbRxTimeout.Q THEN
					uiErrorStatus := 50000;
					uiState := 90;
				END_IF;
			ELSE
				uiErrorStatus := TcpRecv_0.status;
				uiState := 90;
			END_IF;

		80, 90: (* CLOSE / CLOSE_ERR *)
			TcpClose_0(enable := TRUE, ident := udIdent, how := 0);
			IF TcpClose_0.status <> ERR_FUB_BUSY THEN
				udIdent := 0;
				IF uiState = 80 THEN
					uiState := 0;
				ELSE
					uiState := 99;
				END_IF;
			END_IF;

		99: (* ERROR *)
			IF NOT diConnect THEN
				uiState := 0;
			END_IF;
	END_CASE;

	doConnected := uiState = 30 OR uiState = 40 OR uiState = 50;
	doError := uiState = 99;
END_PROGRAM
`,
          var: `VAR
	uiState : UINT;
	udIdent : UDINT;
	sServer : STRING[20];
	sTxBuf : STRING[80];
	sRxBuf : STRING[80];
	TcpOpen_0 : TcpOpen;
	TcpClient_0 : TcpClient;
	TcpSend_0 : TcpSend;
	TcpRecv_0 : TcpRecv;
	TcpClose_0 : TcpClose;
	fbSendEdge : R_TRIG;
	fbRxTimeout : TON;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Verbindung zum Echo-Server', steps: [
            { set: { diConnect: true } },
            { until: 'doConnected', maxMs: 1000, msg: 'Der Client muss sich mit 127.0.0.1:5000 verbinden (OPEN → CONNECT → READY).' },
            { expect: 'uiState = 30 AND NOT doError' }
          ]},
          { name: 'Echo: gesendeter Text kommt zurück', steps: [
            { set: { diConnect: true, sTxText: 'Teil 4711' } },
            { until: 'doConnected', maxMs: 1000 },
            { set: { diSend: true } },
            { until: "sRxText = 'Teil 4711'", maxMs: 1000, msg: 'Die Antwort des Echo-Servers muss in sRxText stehen.' },
            { expect: 'uiState = 30', msg: 'Nach dem Empfang muss der Client wieder in READY sein.' }
          ]},
          { name: 'Falscher Port führt zu Fehler und geschlossenem Socket', steps: [
            { set: { uiPort: 5001, diConnect: true } },
            { until: 'doError', maxMs: 1000, msg: 'Verbindung zu Port 5001 muss scheitern und in ERROR enden.' },
            { expect: 'uiErrorStatus <> ERR_OK AND uiErrorStatus <> ERR_FUB_BUSY AND NOT doConnected', msg: 'Der Fehlerstatus von TcpClient muss in uiErrorStatus gespeichert werden.' },
            { expect: 'udIdent = 0', msg: 'Vor ERROR muss der Socket mit TcpClose geschlossen worden sein (udIdent zurücksetzen).' }
          ]},
          { name: 'Fehler zurücksetzen und neu verbinden', steps: [
            { set: { uiPort: 5001, diConnect: true } },
            { until: 'doError', maxMs: 1000 },
            { set: { diConnect: false, uiPort: 5000 } }, { cycles: 2 },
            { expect: 'NOT doError AND uiState = 0', msg: 'diConnect = FALSE muss den Fehler zurücksetzen.' },
            { set: { diConnect: true } },
            { until: 'doConnected', maxMs: 1000, msg: 'Danach muss eine neue Verbindung möglich sein.' }
          ]},
          { name: 'Netzunterbrechung beim Senden', steps: [
            { set: { diConnect: true } },
            { until: 'doConnected', maxMs: 1000 },
            { set: { diNetDown: true, diSend: true } },
            { until: 'doError', maxMs: 1000, msg: 'Eine Unterbrechung beim Senden muss über CLOSE_ERR nach ERROR führen.' },
            { expect: 'uiErrorStatus = tcpERR_NOT_CONNECTED AND udIdent = 0', msg: 'Status speichern und Socket schließen.' }
          ]},
          { name: 'Regulär trennen', steps: [
            { set: { diConnect: true } },
            { until: 'doConnected', maxMs: 1000 },
            { set: { diConnect: false } },
            { until: 'uiState = 0', maxMs: 500, msg: 'diConnect = FALSE muss über CLOSE nach IDLE führen.' },
            { expect: 'NOT doConnected AND NOT doError' }
          ]}
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────── L4 · OPC UA Client in der SPS & Security ─────────────────────────────
  {
    id: 'komm-4-opcua-client',
    level: 4,
    kind: 'lektion',
    title: 'OPC UA Client in der SPS (AsOpcUac) und OPC UA Security',
    summary: 'Die Steuerung wird selbst zum OPC-UA-Client: Verbindungsaufbau mit UA_Connect, Lesen im Execute/Done-Modell, Zertifikate, Security Policies und Benutzerrechte.',
    minutes: 240,
    req: ['komm-3-opcua', 'komm-4-tcp'],
    briefing: 'Wenn zwei Steuerungen oder eine Steuerung und ein Prüfrechner Daten austauschen sollen, kann die B&R-Steuerung selbst OPC-UA-Client sein. ' +
      'Die Bibliothek **AsOpcUac** enthält die PLCopen-Bausteine UA_Connect, UA_NodeGetHandle, UA_Read, UA_Write, UA_Disconnect u. a. Sie arbeiten im **Execute/Done-Modell**: steigende Flanke an Execute startet, Busy läuft, Done oder Error beendet. ' +
      'Gleichzeitig wird OPC UA produktiv nur mit Security betrieben: Anwendungszertifikate, Security Policy (z. B. Basic256Sha256), Message Security Mode (Sign, SignAndEncrypt) und Benutzerauthentifizierung mit Rollen.',
    practice: 'Eine Abfüllmaschine holt sich vor jedem Batch die Rezeptdaten vom OPC-UA-Server des Leitstands. Fällt der Server aus, muss die Maschine das erkennen, den aktuellen Batch sauber zu Ende fahren und die Verbindung später automatisch wieder aufbauen.',
    transfer: {
      tia: 'S7-1500 bietet einen OPC-UA-Client über die Bausteine OPC_UA_Connect, OPC_UA_ReadList usw. – ebenfalls im Execute/Done-Stil und ebenfalls mit Zertifikatsverwaltung.',
      codesys: 'In CODESYS gibt es den OPC UA Client über die Bibliothek „OPC UA Client SL“, in TwinCAT den TF6100 mit PLCopen-Bausteinen (UA_Connect …).'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Verstehe das Execute/Done-Modell der PLCopen-Bausteine',
        guide: {
          intro: 'Die UA_-Bausteine wurden von PLCopen und OPC Foundation gemeinsam spezifiziert und funktionieren alle gleich.',
          steps: [
            'Öffne in der B&R-Hilfe die Bibliothek AsOpcUac und den Baustein UA_Connect.',
            'Notiere die Ein-/Ausgänge: Execute, ServerEndpointUrl, SessionConnectInfo, Timeout → Done, Busy, Error, ErrorID, ConnectionHdl.',
            'Zeichne das Zeitdiagramm: Execute ↑ → Busy → Done (bleibt, solange Execute TRUE) → Execute ↓ → Done ↓.',
            'Erkläre, warum ein neuer Auftrag eine neue steigende Flanke an Execute braucht.',
            'Skizziere die Reihenfolge: UA_Connect → UA_NodeGetHandle → UA_Read (zyklisch) → UA_NodeReleaseHandle → UA_Disconnect.'
          ],
          done: 'Erledigt, wenn du das Zeitdiagramm von Execute, Busy, Done und Error korrekt zeichnen kannst.',
          tip: 'Werte Error und ErrorID immer aus – ErrorID ist ein OPC-UA-StatusCode (z. B. 16#80040000 BadResourceUnavailable bei zu vielen Verbindungen).',
          link: { label: 'B&R Help: UA_Connect', url: H('communication/opcua/libraries/asopcuac/fbks/ua_connect/ua_connect.html') }
        }
      },
      {
        id: 'o2',
        title: 'Erkläre die Security-Konzepte von OPC UA',
        guide: {
          intro: 'OPC UA trennt Anwendungsauthentifizierung (Zertifikate) und Benutzerauthentifizierung (Anonymous, Benutzername/Passwort, Zertifikat).',
          steps: [
            'Lies OPC UA Part 2 (Security Model) – Abschnitte zu Application Instance Certificates, Security Policies und Message Security Modes.',
            'Notiere die Modes: None, Sign, SignAndEncrypt. Notiere eine aktuelle Policy, z. B. Basic256Sha256 oder Aes128_Sha256_RsaOaep.',
            'Erkläre das Vertrauensmodell: Server und Client müssen das Zertifikat des jeweils anderen vertrauen (Trusted List) – sonst wird die Verbindung abgelehnt.',
            'Erkläre den Unterschied zwischen selbstsignierten und CA-signierten Zertifikaten und warum eine CA in großen Anlagen die Verwaltung erleichtert (Stichwort Global Discovery Server).'
          ],
          done: 'Erledigt, wenn du erklären kannst, warum eine Verbindung mit SignAndEncrypt fehlschlägt, solange das Client-Zertifikat auf dem Server nicht als vertrauenswürdig eingestuft ist.',
          tip: 'Policy „None“ ist nur für Labor und Erstinbetriebnahme gedacht. Dokumentiere, wann du sie wieder abschaltest.',
          link: { label: 'OPC UA Part 2: Security Model', url: 'https://reference.opcfoundation.org/Core/Part2/v105/docs/' }
        }
      },
      {
        id: 'o3',
        title: 'Konfiguriere Zertifikate und Benutzerrollen auf der B&R-Steuerung',
        guide: {
          intro: 'Auf B&R-Steuerungen verwaltest du Zertifikate im Managed Certificate Store und Benutzer im User Role System.',
          steps: [
            'Lies in der B&R-Hilfe den Abschnitt „TLS/SSL managed certificate store“ und finde heraus, wo eigene und vertrauenswürdige Zertifikate abgelegt werden.',
            'Lies den Abschnitt zum User Role System (OPC UA System Behavior) und lege eine Rolle „Leitsystem“ mit Lese-/Schreibrechten nur auf die Schnittstellen-Struktur an.',
            'Lege einen Benutzer an, ordne ihm die Rolle zu und deaktiviere anonymen Zugriff für produktive Variablen.',
            'Teste mit UaExpert: Verbindung mit Benutzername/Passwort und Policy Basic256Sha256; das Server-Zertifikat musst du in UaExpert einmalig vertrauen.'
          ],
          done: 'Erledigt, wenn ein Zugriff ohne Benutzer abgewiesen wird und mit Benutzer der Rolle „Leitsystem“ funktioniert.',
          tip: 'Zertifikate laufen ab. Trage Ablaufdaten in den Wartungsplan der Maschine ein.',
          link: { label: 'B&R Help: User role system (OPC UA)', url: H('communication/opcua/system_behavior/system_behavior_userrolesystem.html') }
        }
      },
      {
        id: 'o4',
        title: 'Programmiere eine robuste Client-Sequenz mit Wiederverbindung',
        guide: {
          intro: 'Die Übung simuliert die UA-Bausteine über eine Anlagen-Simulation mit Execute/Done/Error-Signalen.',
          steps: [
            'Lege die Zustände an: IDLE, CONNECT, CONNECTED (Warten 1 s), READ, DISCONNECT, WAIT_RETRY (5 s).',
            'Setze Execute nur im zugehörigen Zustand und nimm es beim Verlassen zurück.',
            'Überwache jeden Auftrag mit einem Timeout (2 s).',
            'Bei Lesefehler: Verbindung abbauen, Wert als ungültig markieren, nach 5 s neu verbinden.'
          ],
          done: 'Erledigt, wenn deine Übung alle Tests besteht.',
          tip: 'Ein Zustandswechsel-Flag (bEntry) setzt Timer zuverlässig zurück, auch wenn zwei Zustände direkt aufeinanderfolgen, die denselben Timer nutzen.'
        }
      }
    ],
    videos: [
      { id: 'Vf9B5YNl77U', title: 'Learn OPC UA Basics #4: OPC UA Security', channel: 'Prosys OPC Ltd', lang: 'en', why: 'Klare Erklärung von Zertifikaten, Policies und Modes.' },
      { id: 'aakGiYLZzoY', title: 'OPC UA Security erklärt: Signieren, Verschlüsseln oder offen?', channel: 'Grollmus | TIA Portal & Automatisierung', lang: 'de', why: 'Deutsche Einordnung von None, Sign und SignAndEncrypt.' },
      { id: 'zEYJXgvoUXA', title: 'RobotStudio Tutorial | OPC UA Client with Automation Studio [SUB: EN, PT-BR]', channel: 'B&R Industrial Automation', lang: 'en', why: 'B&R-Video: Steuerung als OPC-UA-Client in Automation Studio.' }
    ],
    readings: [
      brHelp('AsOpcUac', 'communication/opcua/libraries/asopcuac/asopcuac.html', 'Übersicht der Client-Bibliothek und Bezug zur PLCopen-Spezifikation.', 20),
      {
        title: 'OPC 10000-2: OPC Unified Architecture Part 2 – Security Model', author: 'OPC Foundation', institution: 'OPC Foundation',
        work: 'OPC UA Online Reference', year: 2022, type: 'Dokumentation', minutes: 40,
        url: 'https://reference.opcfoundation.org/Core/Part2/v105/docs/',
        why: 'Primärquelle für das Sicherheitsmodell von OPC UA.',
        apa: 'OPC Foundation. (2022). *OPC 10000-2: OPC Unified Architecture Part 2 – Security Model* (Version 1.05). ' + ABGERUFEN + 'https://reference.opcfoundation.org/Core/Part2/v105/docs/'
      },
      brHelp('TLS/SSL managed certificate store', 'access_and_security/ssl/ssl_managedcertificatestore.html', 'Zertifikatsverwaltung auf B&R-Steuerungen.', 15)
    ],
    quiz: [
      {
        type: 'single', q: 'UA_Read hat Done = TRUE gemeldet. Was musst du tun, um einen weiteren Lesevorgang zu starten?',
        options: ['Execute auf TRUE lassen', 'Execute auf FALSE setzen und mit einer neuen steigenden Flanke neu starten', 'UA_Connect erneut aufrufen', 'Den Baustein neu instanziieren'], correct: 1,
        explain: 'Im Execute/Done-Modell startet jede steigende Flanke einen neuen Auftrag.'
      },
      {
        type: 'single', q: 'Welcher Message Security Mode schützt sowohl vor Manipulation als auch vor Mitlesen?',
        options: ['None', 'Sign', 'SignAndEncrypt', 'Anonymous'], correct: 2,
        explain: 'Sign schützt die Integrität, SignAndEncrypt zusätzlich die Vertraulichkeit. Anonymous ist eine Benutzer-Authentifizierungsart, kein Mode.'
      },
      {
        type: 'multi', q: 'Welche Punkte gehören zur Benutzer- bzw. Rechteverwaltung bei OPC UA auf B&R-Steuerungen?',
        options: ['User Role System mit Rollen und Benutzern', 'Zugriffsrechte pro Node/Rolle', 'Anonymen Zugriff für produktive Variablen sperren', 'Die IP-Adresse der CPU ändern'], correct: [0, 1, 2],
        explain: 'Rollen, Rechte und das Abschalten anonymen Zugriffs gehören zusammen. Die IP-Adresse ist kein Sicherheitsmerkmal.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Eine Verbindung mit SignAndEncrypt wird vom Server abgelehnt (BadSecurityChecksFailed). Was ist die wahrscheinlichste Ursache?',
        options: ['Falscher Port', 'Das Client-Zertifikat ist auf dem Server nicht als vertrauenswürdig hinterlegt (oder abgelaufen).', 'Zu kurze Zykluszeit', 'Die Variable ist ein REAL'], correct: 1,
        explain: 'Bei aktivierter Security müssen sich Client und Server gegenseitig vertrauen; abgelehnte oder abgelaufene Zertifikate sind der häufigste Grund.'
      },
      {
        type: 'single', q: 'Warum sollte ein SPS-Client nach einem Verbindungsfehler eine Wartezeit vor dem nächsten Versuch einhalten?',
        options: ['Weil die SPS sonst abstürzt', 'Um Server und Netz nicht mit Verbindungsversuchen zu überlasten und Logbücher nicht zu fluten', 'Weil OPC UA das verbietet', 'Weil Zertifikate sonst ablaufen'], correct: 1,
        explain: 'Retry-Wartezeiten (ggf. mit Backoff) sind gute Praxis für robuste Clients.'
      },
      {
        type: 'multi', q: 'Welche Ausgänge haben die PLCopen-UA-Bausteine typischerweise?',
        options: ['Done', 'Busy', 'Error', 'ErrorID'], correct: [0, 1, 2, 3],
        explain: 'Alle vier gehören zum Execute/Done-Modell.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'OPC-UA-Client-Sequenz mit Wiederverbindung',
        task: 'Die UA-Bausteine sind hier durch eine Anlagen-Simulation ersetzt, die sich wie die PLCopen-Bausteine verhält: Dein Programm setzt die Execute-Signale `doExecConnect`, `doExecRead`, `doExecDisconnect`; die Simulation meldet `diConnDone`/`diConnError`, `diReadDone`/`diReadError` und `diDiscDone`. Done und Error bleiben anstehend, solange Execute TRUE ist. Der gelesene Wert steht nach `diReadDone` in `rRemoteValue`.\n\n' +
          'Simulation: Connect dauert 200 ms (Error, wenn `diServerOnline` = FALSE), Read 50 ms (Error, wenn Server offline oder nicht verbunden), Disconnect 20 ms.\n\n' +
          '**Zustände (`uiState`):** 0 IDLE, 10 CONNECT, 20 CONNECTED, 30 READ, 40 DISCONNECT, 50 WAIT_RETRY.\n\n' +
          '**Anforderungen:**\n' +
          '1. `diEnable` startet CONNECT. Nach Connect-Done wird sofort gelesen (READ), danach alle **1 s** erneut (Warten in CONNECTED).\n' +
          '2. Nach jedem Read-Done: `rValue` := `rRemoteValue`, `doValueValid` := TRUE, `uiReadCount` + 1.\n' +
          '3. Execute-Signale nur im eigenen Zustand setzen und nach Done/Error zurücknehmen. Nie zwei Execute gleichzeitig.\n' +
          '4. Connect-Error → WAIT_RETRY. Read-Error → `doValueValid` := FALSE → DISCONNECT → WAIT_RETRY. WAIT_RETRY wartet **5 s** und geht dann nach CONNECT.\n' +
          '5. Jeder Auftrag (CONNECT, READ, DISCONNECT) wird mit **2 s** Timeout überwacht (Timeout wie Error behandeln). Jeder Fehler erhöht `uiErrorCount`.\n' +
          '6. `diEnable` = FALSE in CONNECTED → DISCONNECT → IDLE; in WAIT_RETRY direkt → IDLE.\n' +
          '7. `doConnected` = TRUE in CONNECTED und READ.\n\n' +
          'Der Startcode verbindet und liest bereits – es fehlen Fehlerbehandlung, Timeout und Wiederverbindung.',
        hints: ['Zustandswechsel erkennen: `bEntry := uiState <> uiPrevState; uiPrevState := uiState;` am Zyklusanfang.', 'Timer: `fbTimeout(IN := (uiState = 10 OR uiState = 30 OR uiState = 40) AND NOT bEntry, PT := T#2s);`', 'In WAIT_RETRY: `fbRetry(IN := uiState = 50 AND NOT bEntry, PT := T#5s);`'],
        cycleMs: 10,
        io: [
          { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Client aktivieren', widget: 'switch' },
          { name: 'diServerOnline', type: 'BOOL', dir: 'in', label: 'Simulation: Server erreichbar', widget: 'switch', init: true },
          { name: 'rServerValue', type: 'REAL', dir: 'in', label: 'Simulation: Wert im Server', widget: 'slider', min: 0, max: 100, init: 42.5 },
          { name: 'diConnDone', type: 'BOOL', dir: 'in', label: 'UA_Connect.Done', widget: 'led' },
          { name: 'diConnError', type: 'BOOL', dir: 'in', label: 'UA_Connect.Error', widget: 'led' },
          { name: 'diReadDone', type: 'BOOL', dir: 'in', label: 'UA_Read.Done', widget: 'led' },
          { name: 'diReadError', type: 'BOOL', dir: 'in', label: 'UA_Read.Error', widget: 'led' },
          { name: 'diDiscDone', type: 'BOOL', dir: 'in', label: 'UA_Disconnect.Done', widget: 'led' },
          { name: 'rRemoteValue', type: 'REAL', dir: 'in', label: 'UA_Read: gelesener Wert', widget: 'value' },
          { name: 'doExecConnect', type: 'BOOL', dir: 'out', label: 'UA_Connect.Execute', widget: 'led' },
          { name: 'doExecRead', type: 'BOOL', dir: 'out', label: 'UA_Read.Execute', widget: 'led' },
          { name: 'doExecDisconnect', type: 'BOOL', dir: 'out', label: 'UA_Disconnect.Execute', widget: 'led' },
          { name: 'doConnected', type: 'BOOL', dir: 'out', label: 'Verbunden', widget: 'led' },
          { name: 'doValueValid', type: 'BOOL', dir: 'out', label: 'Wert gültig', widget: 'led' },
          { name: 'rValue', type: 'REAL', dir: 'out', label: 'Wert in der SPS', widget: 'value' },
          { name: 'uiReadCount', type: 'UINT', dir: 'out', label: 'Anzahl Lesevorgänge', widget: 'value' },
          { name: 'uiErrorCount', type: 'UINT', dir: 'out', label: 'Anzahl Fehler', widget: 'value' }
        ],
        scene: { type: 'generic' },
        plant: {
          var: 'VAR\n\tfbC : TON;\n\tfbR : TON;\n\tfbD : TON;\n\tbConn : BOOL;\nEND_VAR\n',
          code: 'fbC(IN := doExecConnect, PT := T#200ms);\n' +
            'diConnDone := doExecConnect AND fbC.Q AND diServerOnline;\n' +
            'diConnError := doExecConnect AND fbC.Q AND NOT diServerOnline;\n' +
            'IF diConnDone THEN\n\tbConn := TRUE;\nEND_IF;\n' +
            'fbR(IN := doExecRead, PT := T#50ms);\n' +
            'diReadDone := doExecRead AND fbR.Q AND bConn AND diServerOnline;\n' +
            'diReadError := doExecRead AND fbR.Q AND NOT (bConn AND diServerOnline);\n' +
            'IF diReadDone THEN\n\trRemoteValue := rServerValue;\nEND_IF;\n' +
            'fbD(IN := doExecDisconnect, PT := T#20ms);\n' +
            'diDiscDone := doExecDisconnect AND fbD.Q;\n' +
            'IF diDiscDone THEN\n\tbConn := FALSE;\nEND_IF;\n'
        },
        files: {
          main: `PROGRAM _INIT
	uiState := 0;
END_PROGRAM

PROGRAM _CYCLIC
	fbWait(IN := uiState = 20, PT := T#1s);

	CASE uiState OF
		0: (* IDLE *)
			IF diEnable THEN
				uiState := 10;
			END_IF;

		10: (* CONNECT *)
			doExecConnect := TRUE;
			IF diConnDone THEN
				doExecConnect := FALSE;
				uiState := 30;
			END_IF;

		20: (* CONNECTED *)
			IF fbWait.Q THEN
				uiState := 30;
			END_IF;

		30: (* READ *)
			doExecRead := TRUE;
			IF diReadDone THEN
				doExecRead := FALSE;
				rValue := rRemoteValue;
				doValueValid := TRUE;
				uiReadCount := uiReadCount + 1;
				uiState := 20;
			END_IF;

		(* TODO: Fehlerbehandlung, Timeout, 40 DISCONNECT, 50 WAIT_RETRY, diEnable = FALSE *)
	END_CASE;

	doConnected := uiState = 20 OR uiState = 30;
END_PROGRAM
`,
          var: `VAR
	uiState : UINT;
	uiPrevState : UINT;
	bEntry : BOOL;
	fbWait : TON;
	fbTimeout : TON;
	fbRetry : TON;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	uiState := 0;
	uiPrevState := 0;
END_PROGRAM

PROGRAM _CYCLIC
	bEntry := uiState <> uiPrevState;
	uiPrevState := uiState;
	fbWait(IN := uiState = 20 AND NOT bEntry, PT := T#1s);
	fbTimeout(IN := (uiState = 10 OR uiState = 30 OR uiState = 40) AND NOT bEntry, PT := T#2s);
	fbRetry(IN := uiState = 50 AND NOT bEntry, PT := T#5s);

	CASE uiState OF
		0: (* IDLE *)
			doExecConnect := FALSE;
			doExecRead := FALSE;
			doExecDisconnect := FALSE;
			IF diEnable THEN
				uiState := 10;
			END_IF;

		10: (* CONNECT *)
			doExecConnect := TRUE;
			IF diConnDone THEN
				doExecConnect := FALSE;
				uiState := 30;
			ELSIF diConnError OR fbTimeout.Q THEN
				doExecConnect := FALSE;
				uiErrorCount := uiErrorCount + 1;
				uiState := 50;
			END_IF;

		20: (* CONNECTED *)
			IF NOT diEnable THEN
				uiState := 40;
			ELSIF fbWait.Q THEN
				uiState := 30;
			END_IF;

		30: (* READ *)
			doExecRead := TRUE;
			IF diReadDone THEN
				doExecRead := FALSE;
				rValue := rRemoteValue;
				doValueValid := TRUE;
				uiReadCount := uiReadCount + 1;
				uiState := 20;
			ELSIF diReadError OR fbTimeout.Q THEN
				doExecRead := FALSE;
				doValueValid := FALSE;
				uiErrorCount := uiErrorCount + 1;
				uiState := 40;
			END_IF;

		40: (* DISCONNECT *)
			doExecDisconnect := TRUE;
			IF diDiscDone OR fbTimeout.Q THEN
				doExecDisconnect := FALSE;
				IF fbTimeout.Q THEN
					uiErrorCount := uiErrorCount + 1;
				END_IF;
				IF diEnable THEN
					uiState := 50;
				ELSE
					uiState := 0;
				END_IF;
			END_IF;

		50: (* WAIT_RETRY *)
			IF NOT diEnable THEN
				uiState := 0;
			ELSIF fbRetry.Q THEN
				uiState := 10;
			END_IF;
	END_CASE;

	doConnected := uiState = 20 OR uiState = 30;
	IF NOT doConnected THEN
		doValueValid := FALSE;
	END_IF;
END_PROGRAM
`,
          var: `VAR
	uiState : UINT;
	uiPrevState : UINT;
	bEntry : BOOL;
	fbWait : TON;
	fbTimeout : TON;
	fbRetry : TON;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Verbinden und zyklisch lesen', steps: [
            { set: { diEnable: true } },
            { until: 'doConnected', maxMs: 1000, msg: 'Nach diEnable muss die Verbindung stehen.' },
            { until: 'uiReadCount >= 2', maxMs: 3000, msg: 'Es muss etwa jede Sekunde gelesen werden.' },
            { expect: 'doValueValid AND ABS(rValue - 42.5) < 0.01', msg: 'rValue muss den Wert aus dem Server enthalten.' }
          ]},
          { name: 'Werteänderung im Server kommt an', steps: [
            { set: { diEnable: true } },
            { until: 'uiReadCount >= 1', maxMs: 1000 },
            { set: { rServerValue: 17.0 } },
            { until: 'ABS(rValue - 17.0) < 0.01', maxMs: 1500, msg: 'Der neue Wert muss beim nächsten Lesen übernommen werden.' }
          ]},
          { name: 'Serverausfall: abbauen und Wartezeit einhalten', steps: [
            { set: { diEnable: true } },
            { until: 'uiReadCount >= 1', maxMs: 1000 },
            { set: { diServerOnline: false } },
            { until: 'NOT doValueValid', maxMs: 1500, msg: 'Ein Lesefehler muss den Wert ungültig machen.' },
            { until: 'NOT doConnected', maxMs: 500, msg: 'Nach dem Lesefehler muss die Verbindung abgebaut werden.' },
            { expect: 'uiErrorCount >= 1' },
            { never: 'doExecConnect', ms: 4000, msg: 'Vor dem nächsten Verbindungsversuch müssen 5 s gewartet werden.' }
          ]},
          { name: 'Automatische Wiederverbindung', steps: [
            { set: { diEnable: true } },
            { until: 'uiReadCount >= 1', maxMs: 1000 },
            { set: { diServerOnline: false } },
            { until: 'NOT doConnected', maxMs: 2000 },
            { ms: 1000 },
            { set: { diServerOnline: true } },
            { until: 'doConnected AND doValueValid', maxMs: 7000, msg: 'Nach der Wartezeit muss sich der Client selbst wieder verbinden.' }
          ]},
          { name: 'Nie zwei Aufträge gleichzeitig', steps: [
            { set: { diEnable: true } },
            { never: '(doExecConnect AND doExecRead) OR (doExecRead AND doExecDisconnect) OR (doExecConnect AND doExecDisconnect)', ms: 3000, msg: 'Execute-Signale dürfen sich nicht überlappen.' }
          ]},
          { name: 'Deaktivieren baut sauber ab', steps: [
            { set: { diEnable: true } },
            { until: 'uiReadCount >= 1', maxMs: 1000 },
            { until: 'uiState = 20', maxMs: 500 },
            { set: { diEnable: false } },
            { until: 'uiState = 0', maxMs: 500, msg: 'diEnable = FALSE muss über DISCONNECT nach IDLE führen.' },
            { expect: 'NOT doExecConnect AND NOT doExecRead AND NOT doExecDisconnect AND NOT doConnected' }
          ]}
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────── L4 · Projekt: Telegramm-Gateway ─────────────────────────────
  {
    id: 'komm-4-gateway-projekt',
    level: 4,
    kind: 'projekt',
    title: 'Praxisprojekt: Telegramm-Protokoll mit Serialisierung und Reconnect',
    summary: 'Du serialisierst Daten in ein eigenes Binärtelegramm mit Checksumme, parst es fehlertolerant und baust eine Verbindungsverwaltung mit Backoff und Alarm.',
    minutes: 300,
    req: ['komm-4-tcp'],
    briefing: 'In diesem Projekt baust du die beiden Bausteine, die jede eigene Socket-Kommunikation braucht: ein **Telegramm-Protokoll** (Daten in Bytes serialisieren, Byte-Reihenfolge festlegen, Checksumme, Rahmen) und eine **Verbindungsverwaltung**, die Ausfälle erkennt und kontrolliert wieder verbindet. ' +
      'Serialisieren heißt: Strukturen und Mehrbyte-Werte in eine festgelegte Byte-Folge bringen – unabhängig davon, wie die CPU sie intern speichert. ' +
      'Beide Teile sind so geschnitten, dass du sie später mit den AsTCP-Bausteinen aus dem vorigen Modul zu einem Gateway verbindest.',
    practice: 'Eine Etikettiermaschine schickt Teilenummer und Position an einen Prüfrechner. Das Protokoll ist im Lastenheft festgelegt (Big-Endian, XOR-Checksumme). Bricht das Netz kurz weg, darf die Maschine nicht im Sekundentakt Verbindungsversuche starten, soll aber nach drei Fehlversuchen einen Alarm melden.',
    transfer: {
      tia: 'Im TIA Portal serialisierst du mit Serialize/Deserialize oder Slice-Zugriffen; die Verbindungsverwaltung baust du um TSEND_C/TRCV_C.',
      codesys: 'In CODESYS nutzt du MEMCPY, UNION oder Pointer zum Serialisieren; die Reconnect-Logik ist identisch.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Spezifiziere ein Telegramm',
        guide: {
          intro: 'Ein Protokoll ist erst dann gut, wenn zwei Teams es unabhängig voneinander implementieren können.',
          steps: [
            'Lege den Rahmen fest: STX (16#02), LEN (Anzahl Nutzbytes), Nutzdaten, Checksumme, ETX (16#03).',
            'Lege für jedes Feld Datentyp, Byte-Position und Byte-Reihenfolge fest (hier: Big-Endian / „Netzwerk-Byte-Reihenfolge“).',
            'Lege das Checksummenverfahren fest (hier: XOR über LEN und Nutzdaten) und welche Bytes es abdeckt.',
            'Dokumentiere das Telegramm als Tabelle (Offset, Länge, Typ, Bedeutung, Beispielwert) in einer Markdown-Datei im Repository.'
          ],
          code: { lang: 'text', text: 'Offset  Länge  Inhalt\n0       1      STX = 16#02\n1       1      LEN = 6\n2       2      Teilenummer UINT (Big-Endian)\n4       4      Position in µm DINT (Big-Endian)\n8       1      XOR über Byte 1..7\n9       1      ETX = 16#03' },
          done: 'Erledigt, wenn deine Telegramm-Spezifikation alle Felder mit Offset, Typ und Byte-Reihenfolge enthält.',
          tip: 'Lege immer eine Versionsnummer oder Telegrammkennung fest – Protokolle wachsen.'
        }
      },
      {
        id: 'o2',
        title: 'Serialisiere und parse Byte-Arrays in ST',
        guide: {
          intro: 'Mit SHL, SHR, AND und OR zerlegst du Werte in Bytes und setzt sie wieder zusammen – unabhängig von der Endianness der CPU.',
          steps: [
            'Zerlege ein DWORD in vier Bytes: `DWORD_TO_USINT(SHR(dw, 24) AND 16#FF)` usw.',
            'Berechne die Checksumme mit einer FOR-Schleife und XOR.',
            'Prüfe beim Empfang zuerst Rahmen (STX, LEN, ETX), dann Checksumme – erst danach übernimmst du die Werte.',
            'Behalte bei einem fehlerhaften Telegramm die letzten gültigen Werte und zähle den Fehler.'
          ],
          done: 'Erledigt, wenn Übung 1 alle Tests besteht.',
          tip: 'In AS6 kannst du mit `brsmemcpy(ADR(abBuf[2]), ADR(uiValue), 2)` kopieren – das übernimmt aber die Byte-Reihenfolge der CPU. Für ein Big-Endian-Protokoll musst du trotzdem tauschen.',
          link: { label: 'B&R Community: TcpRecv concatenates two tcp packets', url: 'https://community.br-automation.com/t/tcprecv-concatenates-two-tcp-packets-and-puts-them-into-buffer-at-once/3267' }
        }
      },
      {
        id: 'o3',
        title: 'Baue eine Verbindungsverwaltung mit Backoff',
        guide: {
          intro: 'Exponentieller Backoff verlängert die Wartezeit nach jedem Fehlversuch – das schont Netz und Gegenstelle.',
          steps: [
            'Lege die Zustände an: IDLE, CONNECTING, ONLINE, BACKOFF.',
            'Zähle Fehlversuche; wähle die Wartezeit per CASE: 0,5 s, 1 s, 2 s, ab dem 4. Versuch 4 s.',
            'Melde ab dem 3. Fehlversuch einen Alarm, versuche aber weiter.',
            'Setze Zähler und Alarm bei erfolgreicher Verbindung zurück.'
          ],
          done: 'Erledigt, wenn Übung 2 alle Tests besteht.',
          tip: 'Ein oberes Limit für den Backoff ist Pflicht – sonst wartet die Maschine nach einem langen Ausfall unnötig lange.'
        }
      },
      {
        id: 'o4',
        title: 'Integriere und dokumentiere',
        guide: {
          intro: 'Zum Abschluss setzt du die Teile zusammen und lieferst den Nachweis.',
          steps: [
            'Kombiniere in einem AS6-Projekt den TCP-Client aus komm-4-tcp mit Telegramm und Verbindungsverwaltung (Sendepuffer `ARRAY[0..9] OF USINT`, `pData := ADR(abTx)`).',
            'Teste gegen einen PC-Server (z. B. ein kleines Python-Skript) und schneide mit Wireshark mit.',
            'Prüfe im Hex-Dump von Wireshark, dass die Bytes exakt deiner Spezifikation entsprechen.',
            'Lege Spezifikation, Code und Mitschnitt im Repository ab und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link mit Spezifikation, Code und Mitschnitt eingereicht ist.',
          tip: 'Ein Testskript auf der Gegenseite, das bewusst kaputte Telegramme schickt, findet Fehler im Parser schneller als jeder Review.'
        }
      }
    ],
    videos: [
      { id: '6g5pL1ilHgI', title: 'Little Endian vs. Big Endian', channel: 'BitLemon', lang: 'en', why: 'Wiederholung zur Byte-Reihenfolge beim Serialisieren.' },
      { id: 'FJeIQuPg8mI', title: 'Anwendung: Zyklische Redundanzprüfung (CRC, Cyclic Redundancy Check)', channel: 'Weitz / HAW Hamburg', lang: 'de', why: 'Hochschulvideo zu Prüfsummen und warum sie Fehler erkennen.' },
      { id: 'whZ2o8WtS8A', title: 'Erklär mir: TCP- und UDP-Verbindung | TCP Handshake [Deutsch/German]', channel: 'GamesNotOver', lang: 'de', why: 'Hintergrund zu Verbindungsaufbau und -abbruch für die Reconnect-Logik.' }
    ],
    readings: [
      {
        title: 'RFC 1071: Computing the Internet Checksum', author: 'Braden, R., Borman, D., & Partridge, C.', institution: 'IETF / RFC Editor',
        work: 'Request for Comments', year: 1988, type: 'Norm/Amtlich', minutes: 20,
        url: 'https://www.rfc-editor.org/rfc/rfc1071',
        why: 'Klassiker zur Berechnung einfacher Prüfsummen und ihren Grenzen.',
        apa: 'Braden, R., Borman, D., & Partridge, C. (1988). *Computing the Internet Checksum* (RFC 1071). RFC Editor. ' + ABGERUFEN + 'https://www.rfc-editor.org/rfc/rfc1071'
      },
      brHelp('TcpSend()', 'libraries/astcp/fbks/tcpsend.html', 'Parameter pData/datalen für das Senden von Byte-Arrays.', 10),
      {
        title: 'TcpRecv concatenates two tcp packets and puts them into buffer at once', author: 'B&R Community', institution: 'B&R Industrial Automation Community',
        work: 'Forumsbeitrag', year: 2024, type: 'Artikel', minutes: 10,
        url: 'https://community.br-automation.com/t/tcprecv-concatenates-two-tcp-packets-and-puts-them-into-buffer-at-once/3267',
        why: 'Praxisfall, warum ein Protokoll Telegrammgrenzen selbst festlegen muss.',
        apa: 'B&R Community. (2024). *TcpRecv concatenates two tcp packets and puts them into buffer at once* [Forumsbeitrag]. ' + ABGERUFEN + 'https://community.br-automation.com/t/tcprecv-concatenates-two-tcp-packets-and-puts-them-into-buffer-at-once/3267'
      }
    ],
    quiz: [
      {
        type: 'single', q: 'Der DINT-Wert 100000 (16#000186A0) wird Big-Endian in vier Bytes serialisiert. Welches Byte steht an erster Stelle?',
        options: ['16#A0', '16#00', '16#86', '16#01'], correct: 1,
        explain: 'Big-Endian: höchstwertiges Byte zuerst → 00 01 86 A0.'
      },
      {
        type: 'single', q: 'Welche Eigenschaft hat eine XOR-Checksumme über alle Bytes?',
        options: ['Sie erkennt jede Einzelbyte-Verfälschung, aber nicht jede Vertauschung von Bytes.', 'Sie erkennt alle Fehler.', 'Sie korrigiert Fehler.', 'Sie ist sicherer als CRC.'], correct: 0,
        explain: 'XOR ist reihenfolgeunabhängig – vertauschte Bytes bleiben unerkannt. CRC ist deutlich stärker.'
      },
      {
        type: 'numeric', q: 'Backoff: Startwert 500 ms, Verdopplung pro Versuch. Wie lang ist die Wartezeit vor Versuch Nummer {N} (Versuch 1 = 500 ms)?',
        params: { N: [1, 4, 1] }, formula: '500 * Math.pow(2, N - 1)', unit: 'ms', tol: 0,
        explain: 'Wartezeit = 500 ms · 2^(N−1).'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Ein empfangenes Telegramm hat eine falsche Checksumme. Was soll der Empfänger tun?',
        options: ['Die Werte trotzdem übernehmen', 'Das Telegramm verwerfen, letzte gültige Werte behalten, Fehler zählen/melden', 'Die SPS stoppen', 'Die Checksumme neu berechnen und eintragen'], correct: 1,
        explain: 'Ungültige Daten dürfen nie in die Prozesslogik gelangen.'
      },
      {
        type: 'multi', q: 'Warum braucht ein TCP-Protokoll einen Rahmen (Länge oder Endekennung)?',
        options: ['TCP ist ein Byte-Strom ohne Telegrammgrenzen.', 'TcpRecv kann Teile eines Telegramms oder mehrere Telegramme auf einmal liefern.', 'TCP verliert Bytes ohne Rahmen.', 'Damit sich der Empfänger nach Fehlern neu synchronisieren kann.'], correct: [0, 1, 3],
        explain: 'TCP verliert keine Bytes, aber Grenzen gehen verloren. Rahmen ermöglichen Zerlegung und Resynchronisation.'
      },
      {
        type: 'single', q: 'Warum ist ein oberes Limit beim exponentiellen Backoff sinnvoll?',
        options: ['Sonst läuft der Zähler über.', 'Damit die Wiederverbindung nach längeren Ausfällen nicht unnötig spät erfolgt.', 'Damit mehr Verbindungsversuche pro Sekunde möglich sind.', 'Weil TCP das vorschreibt.'], correct: 1,
        explain: 'Ohne Limit wüchse die Wartezeit unbegrenzt.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Telegramm serialisieren und prüfen',
        task: 'Baue das Telegramm aus dem Lastenheft und werte das Empfangstelegramm aus.\n\n' +
          '| Byte | Inhalt |\n|---|---|\n| 0 | STX = 16#02 |\n| 1 | LEN = 6 |\n| 2–3 | `uiPartNo` (UINT, Big-Endian) |\n| 4–7 | `diPos` (DINT, Big-Endian, Zweierkomplement) |\n| 8 | XOR über Byte 1..7 |\n| 9 | ETX = 16#03 |\n\n' +
          '**Senden:** Schreibe das Telegramm jeden Zyklus in `abTx` (ARRAY[0..9] OF USINT).\n\n' +
          '**Empfangen:** Die Simulation spiegelt `abTx` in `abRx` zurück (Leitung), einen Zyklus verzögert. Mit `diCorrupt` verfälscht sie das Byte an Position `usCorruptIdx` (XOR 16#FF).\n' +
          '1. Steht in `abRx[0]` kein STX, liegt kein Telegramm vor: `doRxValid` := FALSE, kein Fehler.\n' +
          '2. Sonst: Ist LEN = 6, ETX = 16#03 und die Checksumme korrekt, übernimm `uiRxPartNo` und `diRxPos` und setze `doRxValid` := TRUE.\n' +
          '3. Andernfalls `doRxValid` := FALSE, `udErrCount` + 1 und die letzten gültigen Werte behalten.\n\n' +
          'Annahme: `DINT_TO_DWORD` und `DWORD_TO_DINT` übernehmen das Bitmuster.',
        hints: ['wTmp := UINT_TO_WORD(uiPartNo); abTx[2] := WORD_TO_USINT(SHR(wTmp, 8)); abTx[3] := WORD_TO_USINT(wTmp AND 16#00FF);', 'Checksumme: usCs := 0; FOR i := 1 TO 7 DO usCs := usCs XOR abTx[i]; END_FOR;', 'Zusammensetzen: SHL(USINT_TO_DWORD(abRx[4]), 24) OR SHL(USINT_TO_DWORD(abRx[5]), 16) OR …'],
        cycleMs: 10,
        io: [
          { name: 'uiPartNo', type: 'UINT', dir: 'in', label: 'Teilenummer', widget: 'slider', min: 0, max: 65535, init: 4660 },
          { name: 'diPos', type: 'DINT', dir: 'in', label: 'Position in µm', widget: 'slider', min: -100000, max: 100000, init: 100000 },
          { name: 'diCorrupt', type: 'BOOL', dir: 'in', label: 'Simulation: Byte verfälschen', widget: 'switch' },
          { name: 'usCorruptIdx', type: 'USINT', dir: 'in', label: 'Simulation: verfälschtes Byte', widget: 'slider', min: 0, max: 9, init: 5 },
          { name: 'abTx', type: 'ARRAY[0..9] OF USINT', dir: 'out', label: 'Sendetelegramm' },
          { name: 'abRx', type: 'ARRAY[0..9] OF USINT', dir: 'in', label: 'Empfangstelegramm (von der Simulation)' },
          { name: 'uiRxPartNo', type: 'UINT', dir: 'out', label: 'Empfangene Teilenummer', widget: 'value' },
          { name: 'diRxPos', type: 'DINT', dir: 'out', label: 'Empfangene Position', widget: 'value' },
          { name: 'doRxValid', type: 'BOOL', dir: 'out', label: 'Telegramm gültig', widget: 'led' },
          { name: 'udErrCount', type: 'UDINT', dir: 'out', label: 'Fehlerhafte Telegramme', widget: 'value' }
        ],
        scene: { type: 'generic' },
        plant: {
          var: 'VAR\n\tk : INT;\nEND_VAR\n',
          code: 'FOR k := 0 TO 9 DO\n\tabRx[k] := abTx[k];\nEND_FOR;\nIF diCorrupt AND usCorruptIdx <= 9 THEN\n\tabRx[usCorruptIdx] := abRx[usCorruptIdx] XOR 16#FF;\nEND_IF;\n'
        },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Senden *)
	abTx[0] := 16#02;
	abTx[1] := 6;
	(* TODO: Teilenummer, Position, Checksumme *)
	abTx[9] := 16#03;

	(* Empfangen *)
	(* TODO: Rahmen und Checksumme prüfen, Werte übernehmen *)
	doRxValid := abRx[0] = 16#02;
END_PROGRAM
`,
          var: `VAR
	wTmp : WORD;
	dwTmp : DWORD;
	usCs : USINT;
	i : INT;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* ---------- Senden ---------- *)
	abTx[0] := 16#02;
	abTx[1] := 6;
	wTmp := UINT_TO_WORD(uiPartNo);
	abTx[2] := WORD_TO_USINT(SHR(wTmp, 8));
	abTx[3] := WORD_TO_USINT(wTmp AND 16#00FF);
	dwTmp := DINT_TO_DWORD(diPos);
	abTx[4] := DWORD_TO_USINT(SHR(dwTmp, 24) AND 16#FF);
	abTx[5] := DWORD_TO_USINT(SHR(dwTmp, 16) AND 16#FF);
	abTx[6] := DWORD_TO_USINT(SHR(dwTmp, 8) AND 16#FF);
	abTx[7] := DWORD_TO_USINT(dwTmp AND 16#FF);
	usCs := 0;
	FOR i := 1 TO 7 DO
		usCs := usCs XOR abTx[i];
	END_FOR;
	abTx[8] := usCs;
	abTx[9] := 16#03;

	(* ---------- Empfangen ---------- *)
	IF abRx[0] <> 16#02 THEN
		doRxValid := FALSE; (* kein Telegramm *)
	ELSE
		usCs := 0;
		FOR i := 1 TO 7 DO
			usCs := usCs XOR abRx[i];
		END_FOR;
		IF abRx[1] = 6 AND abRx[9] = 16#03 AND abRx[8] = usCs THEN
			uiRxPartNo := WORD_TO_UINT(SHL(USINT_TO_WORD(abRx[2]), 8) OR USINT_TO_WORD(abRx[3]));
			diRxPos := DWORD_TO_DINT(SHL(USINT_TO_DWORD(abRx[4]), 24) OR SHL(USINT_TO_DWORD(abRx[5]), 16)
			                      OR SHL(USINT_TO_DWORD(abRx[6]), 8) OR USINT_TO_DWORD(abRx[7]));
			doRxValid := TRUE;
		ELSE
			doRxValid := FALSE;
			udErrCount := udErrCount + 1;
		END_IF;
	END_IF;
END_PROGRAM
`,
          var: `VAR
	wTmp : WORD;
	dwTmp : DWORD;
	usCs : USINT;
	i : INT;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Nutzdaten Big-Endian serialisiert', steps: [
            { cycles: 2 },
            { expect: 'abTx[2] = 16#12 AND abTx[3] = 16#34', msg: 'Teilenummer 4660 = 16#1234 → Byte 2 = 16#12, Byte 3 = 16#34.' },
            { expect: 'abTx[4] = 16#00 AND abTx[5] = 16#01 AND abTx[6] = 16#86 AND abTx[7] = 16#A0', msg: 'Position 100000 = 16#000186A0, höchstwertiges Byte zuerst.' }
          ]},
          { name: 'Rahmen und Checksumme', steps: [
            { cycles: 2 },
            { expect: 'abTx[0] = 16#02 AND abTx[1] = 6 AND abTx[9] = 16#03' },
            { expect: 'abTx[8] = 16#07', msg: 'XOR über 06 12 34 00 01 86 A0 ergibt 16#07.' }
          ]},
          { name: 'Rundlauf mit negativer Position', steps: [
            { set: { diPos: -2500, uiPartNo: 65000 } }, { cycles: 4 },
            { expect: 'doRxValid', msg: 'Das gespiegelte Telegramm muss gültig sein.' },
            { expect: 'diRxPos = -2500 AND uiRxPartNo = 65000', msg: 'Negative Werte und große UINT-Werte müssen korrekt zurückkommen.' }
          ]},
          { name: 'Kein Fehler im Normalbetrieb', steps: [
            { ms: 500 },
            { expect: 'udErrCount = 0 AND doRxValid', msg: 'Im Normalbetrieb (auch im ersten Zyklus ohne Telegramm) darf kein Fehler gezählt werden.' }
          ]},
          { name: 'Verfälschtes Nutzbyte wird erkannt', steps: [
            { set: { diPos: 777 } }, { cycles: 4 },
            { expect: 'doRxValid AND diRxPos = 777' },
            { set: { diCorrupt: true, usCorruptIdx: 5, diPos: 999 } }, { cycles: 4 },
            { expect: 'NOT doRxValid AND udErrCount > 0', msg: 'Ein verfälschtes Byte muss über die Checksumme erkannt werden.' },
            { expect: 'diRxPos = 777', msg: 'Bei ungültigem Telegramm bleibt der letzte gültige Wert stehen.' }
          ]},
          { name: 'Verfälschtes ETX wird erkannt', steps: [
            { set: { diCorrupt: true, usCorruptIdx: 9 } }, { cycles: 4 },
            { expect: 'NOT doRxValid AND udErrCount > 0', msg: 'Ein falsches Endezeichen macht das Telegramm ungültig.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'erweitern',
        title: 'Verbindungsverwaltung mit Backoff und Alarm',
        task: 'Die Verbindung selbst ist hier abstrahiert: Dein Programm setzt die Verbindungsanforderung `doConnReq`, die Simulation meldet nach 300 ms `diLinkUp`, sofern die Gegenstelle erreichbar ist (`diServerAvail`). Fällt die Gegenstelle weg, geht `diLinkUp` sofort auf FALSE.\n\n' +
          '**Zustände (`uiState`):** 0 IDLE, 10 CONNECTING, 20 ONLINE, 30 BACKOFF.\n\n' +
          '**Anforderungen:**\n' +
          '1. `diEnable` startet CONNECTING (`doConnReq` = TRUE in CONNECTING und ONLINE).\n' +
          '2. `diLinkUp` in CONNECTING → ONLINE (`doOnline` = TRUE), dabei `uiRetryCount` := 0 und `doAlarm` := FALSE.\n' +
          '3. Fehlversuch = kein Link nach **1 s** in CONNECTING **oder** Linkverlust in ONLINE. Dann `uiRetryCount` + 1 und BACKOFF (`doConnReq` = FALSE).\n' +
          '4. Wartezeit im BACKOFF abhängig von `uiRetryCount`: 1 → 500 ms, 2 → 1 s, 3 → 2 s, ab 4 → 4 s. Danach wieder CONNECTING.\n' +
          '5. Ab `uiRetryCount` ≥ 3: `doAlarm` := TRUE (es wird trotzdem weiter versucht).\n' +
          '6. `diEnable` = FALSE → sofort IDLE, `uiRetryCount` := 0, `doAlarm` := FALSE.\n\n' +
          'Der Startcode verbindet sofort wieder, ohne Wartezeit – erweitere ihn.',
        hints: ['Setze in CONNECTING/ONLINE ein Flag `bFail` und werte es nach dem CASE einmal zentral aus.', 'Wartezeit per CASE uiRetryCount OF 1: tBackoff := T#500ms; … ELSE tBackoff := T#4s; END_CASE', 'fbBackoff(IN := uiState = 30, PT := tBackoff); am Zyklusanfang aufrufen.'],
        cycleMs: 10,
        io: [
          { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Verbindung aktivieren', widget: 'switch' },
          { name: 'diServerAvail', type: 'BOOL', dir: 'in', label: 'Simulation: Gegenstelle erreichbar', widget: 'switch', init: true },
          { name: 'diLinkUp', type: 'BOOL', dir: 'in', label: 'Verbindung steht (von Simulation)', widget: 'led' },
          { name: 'doConnReq', type: 'BOOL', dir: 'out', label: 'Verbindungsanforderung', widget: 'led' },
          { name: 'doOnline', type: 'BOOL', dir: 'out', label: 'Online', widget: 'led' },
          { name: 'uiRetryCount', type: 'UINT', dir: 'out', label: 'Fehlversuche', widget: 'value' },
          { name: 'doAlarm', type: 'BOOL', dir: 'out', label: 'Alarm Verbindung', widget: 'led' }
        ],
        scene: { type: 'generic' },
        plant: {
          var: 'VAR\n\tfbUp : TON;\nEND_VAR\n',
          code: 'fbUp(IN := doConnReq AND diServerAvail, PT := T#300ms);\ndiLinkUp := fbUp.Q;\n'
        },
        files: {
          main: `PROGRAM _INIT
	uiState := 0;
END_PROGRAM

PROGRAM _CYCLIC
	CASE uiState OF
		0: (* IDLE *)
			IF diEnable THEN
				uiState := 10;
			END_IF;

		10: (* CONNECTING *)
			IF diLinkUp THEN
				uiState := 20;
			END_IF;

		20: (* ONLINE *)
			IF NOT diLinkUp THEN
				uiState := 10; (* TODO: Backoff statt sofortiger Wiederverbindung *)
			END_IF;
	END_CASE;

	IF NOT diEnable THEN
		uiState := 0;
	END_IF;

	doConnReq := uiState = 10 OR uiState = 20;
	doOnline := uiState = 20;
END_PROGRAM
`,
          var: `VAR
	uiState : UINT;
	bFail : BOOL;
	tBackoff : TIME;
	fbConnTimeout : TON;
	fbBackoff : TON;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	uiState := 0;
	tBackoff := T#500ms;
END_PROGRAM

PROGRAM _CYCLIC
	fbConnTimeout(IN := uiState = 10, PT := T#1s);
	fbBackoff(IN := uiState = 30, PT := tBackoff);
	bFail := FALSE;

	CASE uiState OF
		0: (* IDLE *)
			IF diEnable THEN
				uiState := 10;
			END_IF;

		10: (* CONNECTING *)
			IF diLinkUp THEN
				uiState := 20;
				uiRetryCount := 0;
				doAlarm := FALSE;
			ELSIF fbConnTimeout.Q THEN
				bFail := TRUE;
			END_IF;

		20: (* ONLINE *)
			IF NOT diLinkUp THEN
				bFail := TRUE;
			END_IF;

		30: (* BACKOFF *)
			IF fbBackoff.Q THEN
				uiState := 10;
			END_IF;
	END_CASE;

	(* Zentrale Behandlung eines Fehlversuchs *)
	IF bFail THEN
		uiRetryCount := uiRetryCount + 1;
		CASE uiRetryCount OF
			1: tBackoff := T#500ms;
			2: tBackoff := T#1s;
			3: tBackoff := T#2s;
		ELSE
			tBackoff := T#4s;
		END_CASE;
		IF uiRetryCount >= 3 THEN
			doAlarm := TRUE;
		END_IF;
		uiState := 30;
	END_IF;

	IF NOT diEnable THEN
		uiState := 0;
		uiRetryCount := 0;
		doAlarm := FALSE;
	END_IF;

	doConnReq := uiState = 10 OR uiState = 20;
	doOnline := uiState = 20;
END_PROGRAM
`,
          var: `VAR
	uiState : UINT;
	bFail : BOOL;
	tBackoff : TIME;
	fbConnTimeout : TON;
	fbBackoff : TON;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Verbindung kommt', steps: [
            { set: { diEnable: true } },
            { until: 'doOnline', maxMs: 1000, msg: 'Mit erreichbarer Gegenstelle muss die Verbindung nach ca. 300 ms stehen.' },
            { expect: 'uiRetryCount = 0 AND NOT doAlarm' }
          ]},
          { name: 'Linkverlust: Backoff statt Sofort-Reconnect', steps: [
            { set: { diEnable: true } },
            { until: 'doOnline', maxMs: 1000 },
            { set: { diServerAvail: false } },
            { until: 'NOT doOnline', maxMs: 100, msg: 'Linkverlust muss sofort erkannt werden.' },
            { cycles: 1 },
            { expect: 'NOT doConnReq AND uiRetryCount = 1', msg: 'Nach Linkverlust: Anforderung weg, erster Fehlversuch gezählt.' },
            { never: 'doConnReq', ms: 400, msg: 'Vor dem nächsten Versuch müssen 500 ms gewartet werden.' }
          ]},
          { name: 'Alarm nach drei Fehlversuchen', steps: [
            { set: { diServerAvail: false, diEnable: true } },
            { never: 'doAlarm', ms: 3000, msg: 'Der Alarm kommt zu früh (erst nach dem 3. Fehlversuch).' },
            { until: 'doAlarm', maxMs: 3000, msg: 'Nach drei Fehlversuchen (1 s + 0,5 s + 1 s + 1 s + 1 s) muss doAlarm kommen.' },
            { expect: 'uiRetryCount = 3' }
          ]},
          { name: 'Erholung setzt Alarm und Zähler zurück', steps: [
            { set: { diServerAvail: false, diEnable: true } },
            { until: 'doAlarm', maxMs: 6000 },
            { set: { diServerAvail: true } },
            { until: 'doOnline', maxMs: 4000, msg: 'Nach Ablauf des Backoffs muss die Verbindung wieder stehen.' },
            { expect: 'NOT doAlarm AND uiRetryCount = 0' }
          ]},
          { name: 'Deaktivieren', steps: [
            { set: { diEnable: true } },
            { until: 'doOnline', maxMs: 1000 },
            { set: { diEnable: false } }, { cycles: 2 },
            { expect: 'NOT doConnReq AND NOT doOnline AND uiState = 0 AND uiRetryCount = 0' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Protokoll-Integrator'
  }
];
