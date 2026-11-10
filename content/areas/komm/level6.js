'use strict';
const { ABGERUFEN, H, brHelp } = require('./_common');

const FC_CRC = `FUNCTION FC_Crc16Step : WORD
	VAR_INPUT
		wCrc : WORD;
		usByte : USINT;
	END_VAR
	VAR
		w : WORD;
		b : USINT;
	END_VAR
	(* CRC-16/MODBUS: Polynom 16#A001 (reflektiert), Startwert 16#FFFF *)
	w := wCrc XOR USINT_TO_WORD(usByte);
	FOR b := 0 TO 7 DO
		IF (w AND 16#0001) <> 0 THEN
			w := SHR(w, 1) XOR 16#A001;
		ELSE
			w := SHR(w, 1);
		END_IF;
	END_FOR;
	FC_Crc16Step := w;
END_FUNCTION
`;

const FB_HEAD = `FUNCTION_BLOCK FB_FrameRx
	VAR_INPUT
		bStrobe : BOOL;   (* TRUE = in usByte liegt ein neues Byte *)
		usByte : USINT;
	END_VAR
	VAR_OUTPUT
		bFrameOk : BOOL;  (* 1 Aufruf lang TRUE: gültiger Rahmen *)
		bCrcError : BOOL; (* 1 Aufruf lang TRUE *)
		bLenError : BOOL; (* 1 Aufruf lang TRUE *)
		usSeq : USINT;
		usLen : USINT;
		aData : ARRAY[0..7] OF USINT;
	END_VAR
	VAR
		usState : USINT;
		usIdx : USINT;
		usSeqTmp : USINT;
		usLenTmp : USINT;
		wCrc : WORD;
		wRxCrc : WORD;
		aBuf : ARRAY[0..7] OF USINT;
		k : USINT;
	END_VAR
	bFrameOk := FALSE;
	bCrcError := FALSE;
	bLenError := FALSE;
	IF bStrobe THEN
		CASE usState OF
			0: (* Warten auf STX *)
				IF usByte = 16#02 THEN
					wCrc := 16#FFFF;
					usState := 1;
				END_IF;
			1: (* SEQ *)
				usSeqTmp := usByte;
				wCrc := FC_Crc16Step(wCrc, usByte);
				usState := 2;
`;

const FB_SOL_REST = `			2: (* LEN *)
				IF usByte > 8 THEN
					bLenError := TRUE;
					usState := 0; (* Resynchronisation: wieder auf STX warten *)
				ELSE
					usLenTmp := usByte;
					wCrc := FC_Crc16Step(wCrc, usByte);
					usIdx := 0;
					IF usByte = 0 THEN
						usState := 4;
					ELSE
						usState := 3;
					END_IF;
				END_IF;
			3: (* DATA *)
				aBuf[usIdx] := usByte;
				wCrc := FC_Crc16Step(wCrc, usByte);
				usIdx := usIdx + 1;
				IF usIdx >= usLenTmp THEN
					usState := 4;
				END_IF;
			4: (* CRC Low-Byte *)
				wRxCrc := USINT_TO_WORD(usByte);
				usState := 5;
			5: (* CRC High-Byte *)
				wRxCrc := wRxCrc OR SHL(USINT_TO_WORD(usByte), 8);
				IF wRxCrc = wCrc THEN
					bFrameOk := TRUE;
					usSeq := usSeqTmp;
					usLen := usLenTmp;
					FOR k := 0 TO 7 DO
						aData[k] := aBuf[k];
					END_FOR;
				ELSE
					bCrcError := TRUE;
				END_IF;
				usState := 0;
		END_CASE;
	END_IF;
END_FUNCTION_BLOCK
`;

const FB_START_REST = `			2: (* LEN *)
				IF usByte > 8 THEN
					bLenError := TRUE;
					usState := 0;
				ELSE
					usLenTmp := usByte;
					usIdx := 0;
					IF usByte = 0 THEN
						usState := 4;
					ELSE
						usState := 3;
					END_IF;
				END_IF;
			3: (* DATA *)
				aBuf[usIdx] := usByte;
				usIdx := usIdx + 1;
				IF usIdx >= usLenTmp THEN
					usState := 4;
				END_IF;
			4: (* CRC Low-Byte *)
				usState := 5;
			5: (* CRC High-Byte – TODO: CRC prüfen! *)
				bFrameOk := TRUE;
				usSeq := usSeqTmp;
				usLen := usLenTmp;
				FOR k := 0 TO 7 DO
					aData[k] := aBuf[k];
				END_FOR;
				usState := 0;
		END_CASE;
	END_IF;
END_FUNCTION_BLOCK
`;

const PRG_SOL = `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbRx(bStrobe := diRxStrobe, usByte := usRxByte);
	IF fbRx.bFrameOk THEN
		udFramesOk := udFramesOk + 1;
		IF bHaveSeq AND fbRx.usSeq <> UINT_TO_USINT((USINT_TO_UINT(usLastSeq) + 1) MOD 256) THEN
			udSeqErrors := udSeqErrors + 1;
		END_IF;
		usLastSeq := fbRx.usSeq;
		bHaveSeq := TRUE;
		IF fbRx.usLen >= 2 THEN
			uiLastValue := WORD_TO_UINT(SHL(USINT_TO_WORD(fbRx.aData[0]), 8) OR USINT_TO_WORD(fbRx.aData[1]));
		END_IF;
	END_IF;
	IF fbRx.bCrcError THEN
		udCrcErrors := udCrcErrors + 1;
	END_IF;
	IF fbRx.bLenError THEN
		udLenErrors := udLenErrors + 1;
	END_IF;
	doFrameOk := fbRx.bFrameOk;
END_PROGRAM
`;

const PRG_START = `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbRx(bStrobe := diRxStrobe, usByte := usRxByte);
	IF fbRx.bFrameOk THEN
		udFramesOk := udFramesOk + 1;
		usLastSeq := fbRx.usSeq;
		IF fbRx.usLen >= 2 THEN
			uiLastValue := WORD_TO_UINT(SHL(USINT_TO_WORD(fbRx.aData[0]), 8) OR USINT_TO_WORD(fbRx.aData[1]));
		END_IF;
	END_IF;
	(* TODO: Sequenzprüfung, Fehlerzähler *)
	IF fbRx.bLenError THEN
		udLenErrors := udLenErrors + 1;
	END_IF;
	doFrameOk := fbRx.bFrameOk;
END_PROGRAM
`;

const PRG_VAR = `VAR
	fbRx : FB_FrameRx;
	bHaveSeq : BOOL;
END_VAR
`;

module.exports = [
  // ───────────────────────────── L6 · Projekt: Protokoll-Design ─────────────────────────────
  {
    id: 'komm-6-protokoll-projekt',
    level: 6,
    kind: 'projekt',
    title: 'Praxisprojekt: Robustes Protokoll-Design',
    summary: 'Du entwirfst und implementierst ein streamfähiges Binärprotokoll mit Rahmen, Sequenznummern und CRC-16 – als wiederverwendbaren Funktionsbaustein mit Grenzfall-Tests.',
    minutes: 360,
    req: ['komm-4-gateway-projekt', 'komm-5-security'],
    briefing: 'Auf Guru-Niveau geht es nicht mehr darum, ein Telegramm zu bauen, sondern ein Protokoll zu **entwerfen**, das Jahre im Feld übersteht: Es muss mit zerstückelten und zusammengeklebten TCP-Daten umgehen, Übertragungsfehler zuverlässig erkennen (CRC statt XOR), verlorene oder doppelte Telegramme bemerken (Sequenznummern), sich nach Störungen selbst neu synchronisieren und versionierbar sein. ' +
      'Du implementierst den Empfänger als **byteweisen Parser** in einem Funktionsbaustein: Er bekommt jedes Byte einzeln und ist dadurch unabhängig davon, wie TcpRecv die Daten portioniert. ' +
      'Dazu kommen Designentscheidungen, die du begründest und dokumentierst: Byte-Stuffing oder Längenfeld, Timeout zwischen Bytes, Quittungen und Wiederholungen.',
    practice: 'Ein Zulieferer liefert Prüfdaten über TCP. Im Feld treten sporadisch falsche Messwerte auf, weil der alte Parser annahm, dass ein TcpRecv-Aufruf genau ein Telegramm liefert. Dein neuer Parser muss dieses Fehlerbild prinzipiell ausschließen.',
    transfer: {
      tia: 'Dieselben Prinzipien gelten für TRCV im Ad-hoc-Modus. Viele Siemens-Projekte nutzen dafür eigene FBs mit Ringpuffern.',
      codesys: 'In CODESYS/TwinCAT wird ein solcher Parser typischerweise als FB mit Methoden (z. B. FB_Parser.AddByte) umgesetzt – objektorientiert, aber mit gleicher Logik.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lege die Designentscheidungen fest und begründe sie',
        guide: {
          intro: 'Ein gutes Protokoll ist eine Sammlung bewusster Entscheidungen.',
          steps: [
            'Rahmen: STX + Längenfeld (oder Endezeichen mit Byte-Stuffing). Begründe deine Wahl (Längenfeld = einfaches Parsen; Stuffing = sicherere Resynchronisation).',
            'Integrität: CRC-16/MODBUS (Polynom 16#A001 reflektiert, Startwert 16#FFFF) über SEQ, LEN und Daten. Begründe, warum CRC Vertauschungen und Burst-Fehler erkennt, XOR nicht.',
            'Reihenfolge/Verlust: 8-Bit-Sequenznummer mit Überlauf 255 → 0; Lücken und Duplikate erkennen.',
            'Grenzen: maximale Nutzlänge (hier 8 Byte), Verhalten bei Überlänge (verwerfen, resynchronisieren), Timeout zwischen zwei Bytes.',
            'Versionierung: Feld oder Telegrammkennung für spätere Erweiterungen.'
          ],
          code: { lang: 'text', text: 'STX(02) | SEQ | LEN(0..8) | DATA[LEN] | CRC_LO | CRC_HI\nCRC-16/MODBUS über SEQ, LEN, DATA' },
          done: 'Erledigt, wenn ein Design-Dokument (ADR-Stil: Kontext, Entscheidung, Konsequenzen) für Rahmen, CRC, Sequenz und Grenzen vorliegt.',
          tip: 'Ein „Architecture Decision Record“ pro Entscheidung hilft später, wenn jemand fragt, warum es so gebaut ist.'
        }
      },
      {
        id: 'o2',
        title: 'Implementiere den byteweisen Parser als Funktionsbaustein',
        guide: {
          intro: 'Der Parser ist ein Zustandsautomat über die Felder des Rahmens.',
          steps: [
            'Zustände: WAIT_STX, SEQ, LEN, DATA, CRC_LO, CRC_HI.',
            'Berechne die CRC inkrementell mit einer Funktion `FC_Crc16Step(wCrc, usByte)`.',
            'Melde Ergebnisse als Impulse (bFrameOk, bCrcError, bLenError) für genau einen Aufruf.',
            'Kehre nach jedem Fehler in WAIT_STX zurück (Resynchronisation).',
            'In AS6 legst du FB und Funktion in einer `.fun`-Datei (Deklaration) und einer `.st`-Datei (Implementierung) in einer eigenen Bibliothek ab.'
          ],
          done: 'Erledigt, wenn die Übung alle Tests besteht.',
          tip: 'Prüfe deine CRC-Implementierung gegen einen bekannten Testvektor: CRC-16/MODBUS der Bytes 01 02 03 ist 16#6161.'
        }
      },
      {
        id: 'o3',
        title: 'Teste Grenzfälle systematisch',
        guide: {
          intro: 'Robustheit zeigt sich an den Rändern.',
          steps: [
            'Lege eine Testmatrix an: gültig, CRC falsch, Länge zu groß, Länge 0, Sequenzlücke, Sequenzüberlauf 255→0, Müll vor STX, zwei Rahmen direkt hintereinander.',
            'Ergänze Fälle, die das Längenfeld-Design nicht abfängt (z. B. ein 16#02 im Müll vor dem echten Rahmen) und beschreibe, wie Byte-Stuffing oder ein Byte-Timeout helfen würde.',
            'Automatisiere die Tests (hier über die Simulation, im Projekt z. B. mit einem PC-Skript als Gegenstelle).'
          ],
          done: 'Erledigt, wenn deine Testmatrix mindestens acht Fälle mit erwartetem Ergebnis enthält.',
          tip: 'Fuzzing (zufällige Byte-Ströme) findet Abstürze und Endlosschleifen, an die niemand gedacht hat.'
        }
      },
      {
        id: 'o4',
        title: 'Dokumentiere und reiche den Nachweis ein',
        guide: {
          intro: 'Als Guru lieferst du Ergebnisse, die andere übernehmen können.',
          steps: [
            'Lege im Repository eine Bibliothek `BrtProto` mit FB, Funktion, README und Testmatrix an.',
            'Beschreibe die Schnittstelle des FB (Ein-/Ausgänge, Impulsverhalten, Grenzen) und die Integration mit TcpRecv.',
            'Lass einen Kollegen ein Code-Review machen und arbeite die Anmerkungen ein.',
            'Reiche den Link zum Repository als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist und Code, Design-Dokument und Testmatrix enthält.',
          tip: 'Versioniere die Bibliothek mit Semantic Versioning – Projekte sollen gezielt aktualisieren können.'
        }
      }
    ],
    videos: [
      { id: 't3ihrfmXbIk', title: 'CRC Verfahren (Prüfsumme berechnen)', channel: 'Franneck', lang: 'de', why: 'Rechnet das CRC-Verfahren Schritt für Schritt vor.' },
      { id: 'FJeIQuPg8mI', title: 'Anwendung: Zyklische Redundanzprüfung (CRC, Cyclic Redundancy Check)', channel: 'Weitz / HAW Hamburg', lang: 'de', why: 'Hochschulvideo zur Fehlererkennung mit CRC.' },
      { id: 'QLvDf3o7BpE', title: 'TCP and UDP: Sockets', channel: 'Rick Graziani', lang: 'en', why: 'Wiederholung: warum TCP ein Byte-Strom ist und Protokolle Rahmen brauchen.' }
    ],
    readings: [
      {
        title: 'MODBUS Application Protocol Specification V1.1b3', author: 'Modbus Organization', institution: 'Modbus Organization, Inc.',
        work: 'Spezifikation', year: 2012, type: 'Dokumentation', minutes: 20,
        url: 'https://www.modbus.org/file/secure/modbusprotocolspecification.pdf',
        why: 'Vorbild für ein etabliertes, schlankes Protokoll: Telegrammaufbau, Funktionscodes und Exception-Antworten.',
        apa: 'Modbus Organization. (2012). *MODBUS Application Protocol Specification V1.1b3*. ' + ABGERUFEN + 'https://www.modbus.org/file/secure/modbusprotocolspecification.pdf'
      },
      {
        title: 'RFC 9293: Transmission Control Protocol (TCP)', author: 'Eddy, W.', institution: 'IETF / RFC Editor',
        work: 'Request for Comments', year: 2022, type: 'Norm/Amtlich', minutes: 30,
        url: 'https://www.rfc-editor.org/rfc/rfc9293',
        why: 'Zum Nachlesen, warum TCP keine Nachrichtengrenzen kennt (Abschnitt zum Datenstrom).',
        apa: 'Eddy, W. (Hrsg.). (2022). *Transmission Control Protocol (TCP)* (RFC 9293). RFC Editor. ' + ABGERUFEN + 'https://www.rfc-editor.org/rfc/rfc9293'
      },
      {
        title: 'TcpRecv concatenates two tcp packets and puts them into buffer at once', author: 'B&R Community', institution: 'B&R Industrial Automation Community',
        work: 'Forumsbeitrag', year: 2024, type: 'Artikel', minutes: 10,
        url: 'https://community.br-automation.com/t/tcprecv-concatenates-two-tcp-packets-and-puts-them-into-buffer-at-once/3267',
        why: 'Realer Praxisfall, der genau dieses Protokoll-Design motiviert.',
        apa: 'B&R Community. (2024). *TcpRecv concatenates two tcp packets and puts them into buffer at once* [Forumsbeitrag]. ' + ABGERUFEN + 'https://community.br-automation.com/t/tcprecv-concatenates-two-tcp-packets-and-puts-them-into-buffer-at-once/3267'
      }
    ],
    quiz: [
      {
        type: 'single', q: 'Warum ist ein byteweiser Parser unabhängig davon, wie TcpRecv die Daten portioniert?',
        options: ['Weil er nur ganze Telegramme annimmt', 'Weil er seinen Zustand zwischen den Aufrufen speichert und jedes Byte einzeln verarbeitet', 'Weil TCP immer ganze Telegramme liefert', 'Weil er die Daten verwirft'], correct: 1,
        explain: 'Der Zustandsautomat merkt sich, wo im Rahmen er steht – egal, ob die Bytes einzeln oder in Blöcken kommen.'
      },
      {
        type: 'single', q: 'Eine 8-Bit-Sequenznummer steht bei 255. Welche Nummer erwartet der Empfänger als Nächstes?',
        options: ['256', '0', '1', '255'], correct: 1,
        explain: 'Überlauf: (255 + 1) MOD 256 = 0.'
      },
      {
        type: 'multi', q: 'Welche Fehler erkennt eine CRC-16 zuverlässig, eine XOR-Checksumme aber nicht?',
        options: ['Vertauschte Bytes', 'Viele Burst-Fehler über mehrere Bits', 'Eine einzelne verfälschte Bitposition', 'Doppelte Telegramme mit gleichem Inhalt'], correct: [0, 1],
        explain: 'Einzelbitfehler erkennen beide. Doppelte Telegramme erkennt nur eine Sequenznummer.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Welches Problem hat ein Protokoll mit STX und Längenfeld ohne Byte-Stuffing?',
        options: ['Es kann keine Länge übertragen.', 'Ein Datenbyte mit dem Wert von STX kann bei der Resynchronisation fälschlich als Rahmenbeginn erkannt werden.', 'Es ist nicht Big-Endian-fähig.', 'Es braucht immer UDP.'], correct: 1,
        explain: 'Nach einem Fehler sucht der Parser das nächste STX – auch mitten in Daten. CRC und Byte-Timeout begrenzen den Schaden, Stuffing verhindert ihn.'
      },
      {
        type: 'numeric', q: 'Ein Rahmen hat 1 Byte STX, 1 Byte SEQ, 1 Byte LEN, {N} Nutzbytes und 2 Byte CRC. Wie viele Bytes umfasst er?',
        params: { N: [0, 8, 1] }, formula: 'N + 5', unit: 'Byte', tol: 0,
        explain: 'Overhead 5 Byte + Nutzdaten.'
      },
      {
        type: 'single', q: 'Warum gehört der Parser in einen Funktionsbaustein in einer Bibliothek?',
        options: ['Weil ST sonst keine Schleifen kennt', 'Wiederverwendbarkeit, mehrere Instanzen (z. B. je Verbindung), getrennte Tests und Versionierung', 'Weil Programme kein CASE kennen', 'Weil FBs schneller rechnen'], correct: 1,
        explain: 'Ein FB kapselt Zustand und Logik; jede Verbindung bekommt ihre eigene Instanz.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Streamfähiger Parser mit CRC-16 und Sequenzprüfung',
        task: 'Die Simulation liefert einen Byte-Strom: In jedem Zyklus, in dem `diRxStrobe` TRUE ist, steht ein neues Byte in `usRxByte` (wie nach dem Zerlegen eines TcpRecv-Puffers). Mit `usScenario` (1–4) wählst du den Strom, mit `diStream` startest du ihn.\n\n' +
          '**Rahmen:** `STX(16#02) | SEQ | LEN (0..8) | DATA[LEN] | CRC_LO | CRC_HI` – CRC-16/MODBUS über SEQ, LEN und DATA (Funktion `FC_Crc16Step` ist vorgegeben).\n\n' +
          '**Szenarien:** 1 = Müllbytes, dann zwei gültige Rahmen (SEQ 1, 2) · 2 = Rahmen mit falscher CRC, dann gültiger Rahmen · 3 = gültige Rahmen SEQ 5 und SEQ 7 (Lücke) · 4 = Rahmen mit LEN = 9, danach gültiger Rahmen SEQ 3.\n\n' +
          '**Anforderungen:**\n' +
          '1. `FB_FrameRx` prüft die CRC: nur bei Übereinstimmung `bFrameOk`, sonst `bCrcError` (je einen Aufruf lang), danach wieder auf STX warten.\n' +
          '2. LEN > 8 → `bLenError` und Resynchronisation (bereits vorhanden).\n' +
          '3. Im Programm: Zähler `udFramesOk`, `udCrcErrors`, `udLenErrors`, `udSeqErrors`. Eine Sequenzlücke liegt vor, wenn nach einem gültigen Rahmen der nächste gültige nicht SEQ+1 (mit Überlauf 255 → 0) hat. Der erste gültige Rahmen wird nicht geprüft.\n' +
          '4. `usLastSeq` = SEQ des letzten gültigen Rahmens, `uiLastValue` = erste zwei Datenbytes (Big-Endian) des letzten gültigen Rahmens mit LEN ≥ 2.\n\n' +
          'Hinweis: In AS6 lägen FB und Funktion in einer Bibliothek (Deklaration in der `.fun`-Datei).',
        hints: ['Im Zustand LEN und DATA muss die CRC mit `wCrc := FC_Crc16Step(wCrc, usByte);` weitergerechnet werden.', 'CRC_LO und CRC_HI zu einem WORD zusammensetzen: `wRxCrc := wRxCrc OR SHL(USINT_TO_WORD(usByte), 8);`', 'Nächste erwartete Sequenz: UINT_TO_USINT((USINT_TO_UINT(usLastSeq) + 1) MOD 256)'],
        cycleMs: 10,
        io: [
          { name: 'usScenario', type: 'USINT', dir: 'in', label: 'Simulation: Szenario 1–4', widget: 'slider', min: 1, max: 4, init: 1 },
          { name: 'diStream', type: 'BOOL', dir: 'in', label: 'Simulation: Strom starten', widget: 'switch' },
          { name: 'usRxByte', type: 'USINT', dir: 'in', label: 'Empfangenes Byte', widget: 'value' },
          { name: 'diRxStrobe', type: 'BOOL', dir: 'in', label: 'Neues Byte', widget: 'led' },
          { name: 'udFramesOk', type: 'UDINT', dir: 'out', label: 'Gültige Rahmen', widget: 'value' },
          { name: 'udCrcErrors', type: 'UDINT', dir: 'out', label: 'CRC-Fehler', widget: 'value' },
          { name: 'udLenErrors', type: 'UDINT', dir: 'out', label: 'Längenfehler', widget: 'value' },
          { name: 'udSeqErrors', type: 'UDINT', dir: 'out', label: 'Sequenzfehler', widget: 'value' },
          { name: 'usLastSeq', type: 'USINT', dir: 'out', label: 'Letzte Sequenznummer', widget: 'value' },
          { name: 'uiLastValue', type: 'UINT', dir: 'out', label: 'Letzter Wert', widget: 'value' },
          { name: 'doFrameOk', type: 'BOOL', dir: 'out', label: 'Rahmen-OK-Impuls', widget: 'led' }
        ],
        scene: { type: 'generic' },
        plant: {
          var: 'VAR\n' +
            '\taS1 : ARRAY[0..16] OF USINT := [16#55, 16#AA, 16#02, 16#01, 16#03, 16#12, 16#34, 16#00, 16#AF, 16#41, 16#02, 16#02, 16#02, 16#01, 16#F4, 16#A0, 16#4B];\n' +
            '\taS2 : ARRAY[0..13] OF USINT := [16#02, 16#01, 16#02, 16#00, 16#10, 16#A1, 16#D5, 16#02, 16#02, 16#02, 16#00, 16#20, 16#A1, 16#84];\n' +
            '\taS3 : ARRAY[0..13] OF USINT := [16#02, 16#05, 16#02, 16#00, 16#05, 16#61, 16#2B, 16#02, 16#07, 16#02, 16#00, 16#07, 16#E1, 16#52];\n' +
            '\taS4 : ARRAY[0..11] OF USINT := [16#02, 16#01, 16#09, 16#11, 16#22, 16#02, 16#03, 16#02, 16#03, 16#E8, 16#A1, 16#1E];\n' +
            '\tiIdx : INT;\n\tiLen : INT;\nEND_VAR\n',
          code: 'diRxStrobe := FALSE;\n' +
            'IF diStream THEN\n' +
            '\tCASE usScenario OF\n\t\t1: iLen := 17;\n\t\t2: iLen := 14;\n\t\t3: iLen := 14;\n\tELSE\n\t\tiLen := 12;\n\tEND_CASE;\n' +
            '\tIF iIdx < iLen THEN\n' +
            '\t\tCASE usScenario OF\n\t\t\t1: usRxByte := aS1[iIdx];\n\t\t\t2: usRxByte := aS2[iIdx];\n\t\t\t3: usRxByte := aS3[iIdx];\n\t\tELSE\n\t\t\tusRxByte := aS4[iIdx];\n\t\tEND_CASE;\n' +
            '\t\tdiRxStrobe := TRUE;\n\t\tiIdx := iIdx + 1;\n\tEND_IF;\nEND_IF;\n'
        },
        files: {
          main: FC_CRC + '\n' + FB_HEAD + FB_START_REST + '\n' + PRG_START,
          var: PRG_VAR,
          typ: ''
        },
        solution: {
          main: FC_CRC + '\n' + FB_HEAD + FB_SOL_REST + '\n' + PRG_SOL,
          var: PRG_VAR,
          typ: ''
        },
        tests: [
          { name: 'Ohne Strom keine Rahmen', steps: [
            { ms: 200 },
            { expect: 'udFramesOk = 0 AND udCrcErrors = 0 AND udLenErrors = 0' }
          ]},
          { name: 'Szenario 1: Müll und zwei gültige Rahmen', steps: [
            { set: { usScenario: 1, diStream: true } }, { ms: 400 },
            { expect: 'udFramesOk = 2 AND udCrcErrors = 0 AND udSeqErrors = 0', msg: 'Zwei gültige Rahmen ohne Fehler erwartet (Müllbytes vor STX werden ignoriert).' },
            { expect: 'usLastSeq = 2 AND uiLastValue = 500', msg: 'Letzter Rahmen: SEQ 2, Daten 16#01F4 = 500.' }
          ]},
          { name: 'Szenario 2: CRC-Fehler wird erkannt', steps: [
            { set: { usScenario: 2, diStream: true } }, { ms: 400 },
            { expect: 'udCrcErrors = 1', msg: 'Der erste Rahmen hat eine falsche CRC.' },
            { expect: 'udFramesOk = 1 AND uiLastValue = 32', msg: 'Nur der zweite Rahmen (Wert 32) darf übernommen werden.' }
          ]},
          { name: 'Szenario 3: Sequenzlücke', steps: [
            { set: { usScenario: 3, diStream: true } }, { ms: 400 },
            { expect: 'udFramesOk = 2 AND udSeqErrors = 1 AND usLastSeq = 7', msg: 'SEQ 5 → 7: eine Lücke muss gezählt werden.' }
          ]},
          { name: 'Szenario 4: Überlänge und Resynchronisation', steps: [
            { set: { usScenario: 4, diStream: true } }, { ms: 400 },
            { expect: 'udLenErrors = 1', msg: 'LEN = 9 ist zu groß.' },
            { expect: 'udFramesOk = 1 AND usLastSeq = 3 AND uiLastValue = 1000 AND udCrcErrors = 0', msg: 'Nach der Resynchronisation muss der folgende Rahmen (SEQ 3, Wert 1000) erkannt werden.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Protokoll-Architekt'
  },

  // ───────────────────────────── L6 · Echtzeit, Performance und MES/Cloud ─────────────────────────────
  {
    id: 'komm-6-echtzeit-mes',
    level: 6,
    kind: 'lektion',
    title: 'Echtzeit, Performance und Integration in MES/Cloud',
    summary: 'POWERLINK-Zykluszeiten, Latenz und Jitter messen und bewerten, Task-Klassen abstimmen und die Maschine sauber in MES- und Cloud-Architekturen (ISA-95, Unified Namespace) einbinden.',
    minutes: 300,
    req: ['komm-5-iiot', 'komm-5-companion'],
    briefing: 'Auf höchster Stufe verantwortest du das Zeitverhalten des Gesamtsystems: Wie lange dauert es vom Sensor über POWERLINK, die Task-Klasse und zurück zum Antrieb? Wie stark schwankt diese Zeit (Jitter)? ' +
      'Du lernst, POWERLINK-Zykluszeit, Task-Klassen-Zykluszeit und I/O-Verzögerungen aufeinander abzustimmen und Messwerte statistisch auszuwerten. ' +
      'Gleichzeitig ordnest du die Maschine in die IT-Welt ein: ISA-95-Ebenen, MES-Funktionen (Aufträge, Rückmeldungen, OEE), Unified Namespace über MQTT und die Trennung von Echtzeit- und IT-Kommunikation.',
    practice: 'Ein Kunde bemängelt Positionsabweichungen an einer Fliegenden Säge. Ursache ist ein Jitter in der Übertragung von Encoderwerten. Du musst messen, bewerten und eine Architektur vorschlagen – und gleichzeitig die Produktionsdaten ans MES liefern, ohne die Echtzeit zu stören.',
    transfer: {
      tia: 'Bei PROFINET IRT stellst du Sendetakt und Update-Zeiten ein; Taktsynchronität (OB6x) entspricht der Synchronisation von Task-Klasse und POWERLINK.',
      codesys: 'Bei EtherCAT sind Distributed Clocks und die Task-Zykluszeit das Gegenstück; TwinCAT bietet Echtzeit-Monitoring für Jitter.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Stimme POWERLINK-Zyklus und Task-Klasse ab',
        guide: {
          intro: 'Gesamtlatenz = Eingangslatenz + Verarbeitung in der Task-Klasse + Ausgangslatenz. Alle drei hängen von Zykluszeiten und deren Synchronisation ab.',
          steps: [
            'Lies in der B&R-Hilfe die POWERLINK-Abschnitte zu Eingangs-, Ausgangs- und Gesamtlatenz.',
            'Lies den Abschnitt zu Task-Klassen-Einstellungen (I/O input delay „None“ bzw. „mid-cycle“).',
            'Lege für ein Beispiel fest: POWERLINK 400 µs, Task-Klasse #1 = 800 µs (ganzzahliges Vielfaches) und begründe die Wahl.',
            'Berechne die Gesamtlatenz im ungünstigsten Fall und vergleiche mit der Anforderung der Anwendung.',
            'Notiere, welche Fehler- und Warnmeldungen auftreten, wenn Zykluszeiten nicht zueinander passen (z. B. mapp-Meldungen „must be a multiple of each other“).'
          ],
          done: 'Erledigt, wenn du für dein Beispiel die Latenz im ungünstigsten Fall mit Rechenweg angeben kannst.',
          tip: 'Kürzere Zyklen sind nicht automatisch besser: Sie erhöhen CPU- und Netzlast. Lege die Zeiten nach der Anforderung der Regelung fest.',
          link: { label: 'B&R Help: POWERLINK total latency', url: H('communication/powerlink/powerlink_performance_latency_intoout.html') }
        }
      },
      {
        id: 'o2',
        title: 'Miss und bewerte Jitter statistisch',
        guide: {
          intro: 'Jitter ist die Abweichung der tatsächlichen von der nominellen Periode. Wichtig sind Minimum, Maximum, Mittelwert und maximale Abweichung.',
          steps: [
            'Zeichne mit dem Profiler bzw. einem Trace (z. B. Zeitstempel je Zyklus) Werte auf.',
            'Berechne Delta zwischen aufeinanderfolgenden Zeitstempeln, Min/Max und gleitenden Mittelwert über einen Ringpuffer.',
            'Definiere eine Grenze (z. B. ±50 µs) und eine Reaktion (Warnung, Alarm, Protokoll).',
            'Unterscheide Messfehler (z. B. Auflösung der Zeitbasis) von echtem Jitter.'
          ],
          done: 'Erledigt, wenn deine Übung alle Tests besteht.',
          tip: 'Zeige Jitter immer zusammen mit der Messmethode – ohne sie ist eine Zahl wertlos.'
        }
      },
      {
        id: 'o3',
        title: 'Ordne die Maschine in ISA-95 und einen Unified Namespace ein',
        guide: {
          intro: 'Die Maschine liefert Daten an viele Abnehmer – die Architektur entscheidet über Aufwand und Robustheit.',
          steps: [
            'Ordne Funktionen den ISA-95-Ebenen zu: Ebene 0–2 (Prozess, Steuerung, SCADA), Ebene 3 (MES: Aufträge, Rückmeldung, Qualität, OEE), Ebene 4 (ERP).',
            'Entwirf den Datenfluss: Auftrag MES → Maschine (OPC UA, z. B. PackML/Companion Spec), Rückmeldung Maschine → MES, Zustände/Zähler → Unified Namespace (MQTT).',
            'Lege fest, welche Kommunikation in einer eigenen Task-Klasse niedriger Priorität läuft, damit die Echtzeit nicht beeinflusst wird.',
            'Plane Pufferung und Zeitsynchronisation (NTP/PTP), damit Daten mit korrekten Zeitstempeln ankommen.'
          ],
          done: 'Erledigt, wenn dein Architekturdiagramm Ebenen, Protokolle, Datenrichtungen und Task-Zuordnung enthält.',
          tip: 'Trenne Echtzeit- und IT-Netz auch physisch bzw. per Schnittstelle: POWERLINK bleibt an IF3, IT-Verkehr läuft über IF2.',
          link: { label: 'ISA-95 Standard', url: 'https://www.isa.org/isa95' }
        }
      },
      {
        id: 'o4',
        title: 'Gib dein Wissen weiter',
        guide: {
          intro: 'Auf Genie-Niveau gehört Lehre dazu.',
          steps: [
            'Bereite einen 20-minütigen Vortrag für Junior-Kollegen vor: „Warum unsere Maschine 0,8 ms Task-Zyklus hat“.',
            'Nutze deine Messwerte und Architekturdiagramme aus diesem Modul.',
            'Halte den Vortrag und sammle Feedback.'
          ],
          done: 'Erledigt, wenn du den Vortrag gehalten und das Feedback dokumentiert hast.',
          tip: 'Erkläre jedes Zeitverhalten mit einem Zeitstrahl – Diagramme schlagen Formeln.'
        }
      }
    ],
    videos: [
      { id: 'kK5d-iMauFs', title: 'A Practical Approach to building a Real-Time Industrial Ethernet Network for Automation', channel: 'A3 Motion Control & Motors', lang: 'en', why: 'Vortrag zum praktischen Aufbau echtzeitfähiger Industrienetze.' },
      { id: 'IAhxYsMi4e8', title: 'What is the Automation Pyramid?', channel: 'RealPars', lang: 'en', why: 'Kompakte Erklärung der Ebenen nach ISA-95.' },
      { id: 'ywiHxnm2Bnk', title: 'Automation Pyramid and the Unified Namespace | Unified Namespace (UNS) Basics 1', channel: 'UMH', lang: 'en', why: 'Zeigt, wie der Unified Namespace die klassische Pyramide ergänzt.' }
    ],
    readings: [
      brHelp('POWERLINK – Total latency', 'communication/powerlink/powerlink_performance_latency_intoout.html', 'B&R-Berechnung der Gesamtlatenz vom Eingang zum Ausgang.', 25),
      brHelp('POWERLINK bus controller response times – Task class', 'communication/powerlink/powerlink_performance_latency_parameters_taskclass.html', 'Einfluss der I/O-Verzögerung der Task-Klasse auf die Reaktionszeit.', 15),
      {
        title: 'ISA-95 Standard: Enterprise-Control System Integration', author: 'International Society of Automation', institution: 'ISA',
        work: 'Normenübersicht', year: 2026, type: 'Norm/Amtlich', minutes: 15,
        url: 'https://www.isa.org/isa95',
        why: 'Überblick über die Ebenen und Modelle der Integration zwischen Steuerung und Unternehmens-IT.',
        apa: 'International Society of Automation. (2026). *ISA-95 Standard: Enterprise-Control System Integration*. ' + ABGERUFEN + 'https://www.isa.org/isa95'
      }
    ],
    quiz: [
      {
        type: 'single', q: 'POWERLINK läuft mit 400 µs Zykluszeit. Welche Task-Klassen-Zykluszeit ist günstig?',
        options: ['Ein ganzzahliges Vielfaches der POWERLINK-Zykluszeit (z. B. 2×)', 'Eine möglichst „krumme“ Zeit, damit sich nichts überlagert', 'Immer 10 ms', 'Egal'], correct: 0,
        explain: 'Synchronisierte, ganzzahlige Verhältnisse vermeiden Schwebungen und machen Latenzen berechenbar.'
      },
      {
        type: 'numeric', q: 'Nominelle Periode 2000 µs. Gemessene Deltas schwanken zwischen {A} µs und {B} µs. Wie groß ist die maximale Abweichung vom Nominalwert?',
        params: { A: [1900, 1995, 5], B: [2005, 2100, 5] }, formula: 'Math.max(2000 - A, B - 2000)', unit: 'µs', tol: 0,
        explain: 'Max. Abweichung = max(|min − nominal|, |max − nominal|).'
      },
      {
        type: 'multi', q: 'Welche Daten gehören typischerweise auf ISA-95-Ebene 3 (MES)?',
        options: ['Produktionsaufträge und Rückmeldungen', 'OEE-Kennzahlen', 'Lageregelkreis eines Servos', 'Qualitäts- und Rückverfolgbarkeitsdaten'], correct: [0, 1, 3],
        explain: 'Regelkreise gehören auf Ebene 1/2 und laufen in Echtzeit in der Steuerung.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Was bewirkt die Einstellung „I/O input delay: mid-cycle“ einer Task-Klasse laut B&R-Hilfe?',
        options: ['Die Task-Klasse startet einen halben Zyklus später; Eingänge werden kurz vor der Zyklusmitte gelesen – bei abgestimmtem POWERLINK kann das die Reaktionszeit um einen Zyklus verkürzen.', 'Die Task-Klasse läuft doppelt so oft.', 'Eingänge werden gar nicht mehr gelesen.', 'POWERLINK wird deaktiviert.'], correct: 0,
        explain: 'Die Ausführungszeit halbiert sich, dafür sind Eingangsdaten früher verfügbar.'
      },
      {
        type: 'single', q: 'Warum sollte MES- und Cloud-Kommunikation in einer eigenen Task-Klasse niedriger Priorität laufen?',
        options: ['Damit sie schneller ist', 'Damit lange oder unvorhersehbare Laufzeiten die Echtzeit-Tasks nicht verdrängen', 'Weil OPC UA das vorschreibt', 'Weil MQTT nur in Task-Klasse 8 läuft'], correct: 1,
        explain: 'Trennung nach Priorität schützt das deterministische Verhalten der Maschine.'
      },
      {
        type: 'multi', q: 'Welche Kennzahlen beschreiben das Zeitverhalten einer zyklischen Übertragung?',
        options: ['Minimale und maximale Periode', 'Mittelwert', 'Maximale Abweichung vom Nominalwert (Jitter)', 'Anzahl der Variablen im Programm'], correct: [0, 1, 2],
        explain: 'Die Variablenanzahl ist keine Zeitkennzahl.'
      },
      {
        type: 'single', q: 'Was ist der Kern eines Unified Namespace?',
        options: ['Eine zentrale, ereignisgesteuerte Datenstruktur (meist über MQTT), in der alle Systeme ihren aktuellen Zustand veröffentlichen und abonnieren', 'Ein neues Feldbussystem', 'Eine Datenbank in der SPS', 'Eine Firewall-Regel'], correct: 0,
        explain: 'Der UNS entkoppelt Produzenten und Konsumenten über einen gemeinsamen Namensraum.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Jitter-Statistik mit Ringpuffer',
        task: 'Die Simulation liefert in jedem Programmzyklus einen neuen Zeitstempel `udTsUs` (µs) eines zyklischen Telegramms, nominell alle **2000 µs**, mit kleinem Jitter. `diSpike` erzeugt einmalig ein verspätetes Telegramm (+80 µs) mit anschließendem Ausgleich (−80 µs).\n\n' +
          '**Anforderungen:**\n' +
          '1. Berechne ab dem zweiten Zeitstempel das Delta zum vorherigen (`udDelta`).\n' +
          '2. `udMinDelta`, `udMaxDelta` = kleinstes/größtes Delta seit Start bzw. Reset.\n' +
          '3. `diDevMax` = größte absolute Abweichung |Delta − 2000| seit Start bzw. Reset (DINT).\n' +
          '4. `rAvg16` = Mittelwert der letzten **16** Deltas (Ringpuffer `ARRAY[0..15] OF UDINT`; solange noch keine 16 Werte vorliegen, Mittelwert der vorhandenen).\n' +
          '5. `doAlarm` wird gesetzt (speichernd), sobald `diDevMax` > `uiLimitUs` ist.\n' +
          '6. Solange `diReset` TRUE ist, werden Min/Max, `diDevMax` und `doAlarm` zurückgesetzt (der Ringpuffer bleibt).',
        hints: ['Min-Startwert: 16#FFFFFFFF; Max-Startwert: 0.', 'Abweichung: ABS(UDINT_TO_DINT(udDelta) - 2000)', 'Ringindex: usIdx := (usIdx + 1) MOD 16;'],
        cycleMs: 10,
        io: [
          { name: 'udTsUs', type: 'UDINT', dir: 'in', label: 'Zeitstempel Telegramm (µs)', widget: 'value' },
          { name: 'diSpike', type: 'BOOL', dir: 'in', label: 'Simulation: Störung', widget: 'button' },
          { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Statistik zurücksetzen', widget: 'button' },
          { name: 'uiLimitUs', type: 'UINT', dir: 'in', label: 'Jitter-Grenze (µs)', widget: 'slider', min: 5, max: 200, init: 50 },
          { name: 'udMinDelta', type: 'UDINT', dir: 'out', label: 'Min. Periode (µs)', widget: 'value' },
          { name: 'udMaxDelta', type: 'UDINT', dir: 'out', label: 'Max. Periode (µs)', widget: 'value' },
          { name: 'diDevMax', type: 'DINT', dir: 'out', label: 'Max. Abweichung (µs)', widget: 'value' },
          { name: 'rAvg16', type: 'REAL', dir: 'out', label: 'Mittelwert letzte 16 (µs)', widget: 'value' },
          { name: 'doAlarm', type: 'BOOL', dir: 'out', label: 'Jitter-Alarm', widget: 'led' }
        ],
        scene: { type: 'generic' },
        plant: {
          var: 'VAR\n\taJit : ARRAY[0..7] OF DINT := [0, 10, -10, 20, -20, 5, -5, 0];\n\tk : INT;\n\tfbSpike : R_TRIG;\n\tiSpike : INT;\nEND_VAR\n',
          code: 'fbSpike(CLK := diSpike);\nIF fbSpike.Q THEN\n\tiSpike := 2;\nEND_IF;\n' +
            'IF iSpike = 2 THEN\n\tudTsUs := udTsUs + 2080;\n\tiSpike := 1;\n' +
            'ELSIF iSpike = 1 THEN\n\tudTsUs := udTsUs + 1920;\n\tiSpike := 0;\n' +
            'ELSE\n\tudTsUs := DINT_TO_UDINT(UDINT_TO_DINT(udTsUs) + 2000 + aJit[k]);\n\tk := (k + 1) MOD 8;\nEND_IF;\n'
        },
        files: {
          main: `PROGRAM _INIT
	udMinDelta := 16#FFFFFFFF;
END_PROGRAM

PROGRAM _CYCLIC
	IF bHaveLast THEN
		udDelta := udTsUs - udLastTs;
		udMinDelta := MIN(udMinDelta, udDelta);
		udMaxDelta := MAX(udMaxDelta, udDelta);
		(* TODO: Abweichung, Ringpuffer, Mittelwert, Alarm, Reset *)
	END_IF;
	udLastTs := udTsUs;
	bHaveLast := TRUE;
END_PROGRAM
`,
          var: `VAR
	bHaveLast : BOOL;
	udLastTs : UDINT;
	udDelta : UDINT;
	diDev : DINT;
	aRing : ARRAY[0..15] OF UDINT;
	usIdx : USINT;
	usCnt : USINT;
	udSum : UDINT;
	k : USINT;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	udMinDelta := 16#FFFFFFFF;
	udMaxDelta := 0;
END_PROGRAM

PROGRAM _CYCLIC
	IF diReset THEN
		udMinDelta := 16#FFFFFFFF;
		udMaxDelta := 0;
		diDevMax := 0;
		doAlarm := FALSE;
	END_IF;

	IF bHaveLast THEN
		udDelta := udTsUs - udLastTs;
		udMinDelta := MIN(udMinDelta, udDelta);
		udMaxDelta := MAX(udMaxDelta, udDelta);

		diDev := ABS(UDINT_TO_DINT(udDelta) - 2000);
		IF diDev > diDevMax THEN
			diDevMax := diDev;
		END_IF;
		IF diDevMax > UINT_TO_DINT(uiLimitUs) THEN
			doAlarm := TRUE;
		END_IF;

		(* Ringpuffer der letzten 16 Deltas *)
		aRing[usIdx] := udDelta;
		usIdx := (usIdx + 1) MOD 16;
		IF usCnt < 16 THEN
			usCnt := usCnt + 1;
		END_IF;
		udSum := 0;
		FOR k := 0 TO usCnt - 1 DO
			udSum := udSum + aRing[k];
		END_FOR;
		rAvg16 := UDINT_TO_REAL(udSum) / USINT_TO_REAL(usCnt);
	END_IF;
	udLastTs := udTsUs;
	bHaveLast := TRUE;
END_PROGRAM
`,
          var: `VAR
	bHaveLast : BOOL;
	udLastTs : UDINT;
	udDelta : UDINT;
	diDev : DINT;
	aRing : ARRAY[0..15] OF UDINT;
	usIdx : USINT;
	usCnt : USINT;
	udSum : UDINT;
	k : USINT;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Minimum und Maximum', steps: [
            { ms: 500 },
            { expect: 'udMinDelta = 1980 AND udMaxDelta = 2020', msg: 'Die Deltas schwanken zwischen 1980 und 2020 µs.' }
          ]},
          { name: 'Mittelwert und Abweichung im Normalbetrieb', steps: [
            { ms: 500 },
            { expect: 'ABS(rAvg16 - 2000.0) < 0.01', msg: 'Der Mittelwert über 16 Deltas muss 2000 µs sein.' },
            { expect: 'diDevMax = 20 AND NOT doAlarm', msg: 'Max. Abweichung 20 µs liegt unter der Grenze von 50 µs.' }
          ]},
          { name: 'Störung löst Alarm aus', steps: [
            { ms: 300 },
            { set: { diSpike: true } }, { cycles: 5 },
            { expect: 'doAlarm AND diDevMax = 80', msg: 'Eine Abweichung von 80 µs muss den Alarm setzen.' },
            { expect: 'udMaxDelta = 2080 AND udMinDelta = 1920' }
          ]},
          { name: 'Reset der Statistik', steps: [
            { ms: 300 },
            { set: { diSpike: true } }, { cycles: 5 },
            { set: { diSpike: false, diReset: true } }, { cycles: 2 },
            { set: { diReset: false } }, { ms: 300 },
            { expect: 'NOT doAlarm AND diDevMax = 20 AND udMinDelta = 1980 AND udMaxDelta = 2020', msg: 'Nach dem Reset beginnt die Statistik neu.' },
            { expect: 'ABS(rAvg16 - 2000.0) < 0.01', msg: 'Nach 16 ungestörten Deltas ist der Mittelwert wieder 2000 µs.' }
          ]},
          { name: 'Grenze ist parametrierbar', steps: [
            { set: { uiLimitUs: 15 } }, { ms: 300 },
            { expect: 'doAlarm', msg: 'Bei einer Grenze von 15 µs muss die Abweichung von 20 µs alarmieren.' }
          ]}
        ]
      }
    ],
    proof: false
  }
];
