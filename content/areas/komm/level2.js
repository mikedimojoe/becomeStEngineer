'use strict';
const { ABGERUFEN, H, brHelp } = require('./_common');

module.exports = [
  // ───────────────────────────── L2 · Netzwerkgrundlagen ─────────────────────────────
  {
    id: 'komm-2-netzwerk',
    level: 2,
    kind: 'lektion',
    title: 'Netzwerkgrundlagen für die Automatisierung',
    summary: 'OSI- und TCP/IP-Modell, IPv4, Subnetzmaske, Gateway, Ports, ARP, DHCP und ping – das Handwerkszeug für jede Inbetriebnahme.',
    minutes: 150,
    req: [],
    briefing: 'Jede moderne Steuerung hängt an mindestens einem Ethernet-Netz: für Automation Studio, für OPC UA, für die Visualisierung und zum Leitsystem. ' +
      'Wenn die Verbindung nicht klappt, liegt die Ursache fast immer in den Grundlagen: falsche IP-Adresse, falsche Subnetzmaske, fehlendes Gateway oder ein belegter Port. ' +
      'In diesem Modul lernst du die Schichtenmodelle als Diagnose-Landkarte kennen, rechnest Subnetze von Hand und mit ST und prüfst Verbindungen mit ping und arp. ' +
      'Damit legst du die Basis für alle weiteren Kommunikationsthemen.',
    practice: 'Bei der Inbetriebnahme bekommst du vom Kunden-IT einen Adressbereich (z. B. 192.168.10.0/24) und musst SPS, Panel und Laptop so einstellen, dass sie sich sehen – und das Leitsystem über das Gateway erreicht wird.',
    transfer: {
      tia: 'Im TIA Portal stellst du die IP-Adresse in den Eigenschaften der PROFINET-Schnittstelle ein („Ethernet-Adressen“); die Grundlagen (Maske, Gateway, ARP) sind identisch.',
      codesys: 'In CODESYS/TwinCAT stellst du die Adresse meist im Betriebssystem des Controllers (Windows/Linux) ein; Netzwerkgrundlagen und Werkzeuge (ping, arp, Wireshark) sind dieselben.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Ordne Protokolle den Schichten des OSI- und TCP/IP-Modells zu',
        guide: {
          intro: 'Die Schichtenmodelle sind deine Diagnose-Landkarte: Du arbeitest dich von unten (Kabel, Link-LED) nach oben (Anwendung) vor.',
          steps: [
            'Zeichne die 7 OSI-Schichten (Physical, Data Link, Network, Transport, Session, Presentation, Application) und daneben die 4 Schichten des TCP/IP-Modells (Link, Internet, Transport, Application).',
            'Ordne zu: Ethernet-Kabel/RJ45 → Schicht 1, MAC-Adresse/Switch → Schicht 2, IPv4/Router → Schicht 3, TCP/UDP mit Ports → Schicht 4, OPC UA/Modbus TCP/HTTP → Anwendung.',
            'Notiere für jede Schicht ein typisches Fehlerbild: Link-LED aus (1), doppelte MAC/falsches VLAN (2), falsche Maske/Gateway (3), Port blockiert (4), falsche Zugangsdaten (7).',
            'Ergänze, wo POWERLINK einzuordnen ist: Es nutzt Standard-Ethernet auf Schicht 1/2 und regelt den Buszugriff selbst (kein IP für die zyklischen Daten).'
          ],
          done: 'Erledigt, wenn du für fünf Protokolle (Ethernet, IPv4, TCP, UDP, OPC UA) die Schicht und je ein typisches Fehlerbild nennen kannst.',
          tip: 'Bei der Fehlersuche immer bottom-up: erst Link-LED und Kabel, dann ping, dann Port, dann Anwendung. Das spart Stunden.'
        }
      },
      {
        id: 'o2',
        title: 'Berechne Netzadresse, Broadcast und Hostanzahl eines IPv4-Subnetzes',
        guide: {
          intro: 'Zwei Geräte sprechen nur direkt miteinander (ohne Router), wenn ihre Netzanteile – IP-Adresse UND-verknüpft mit der Subnetzmaske – gleich sind.',
          steps: [
            'Schreibe die Adresse 192.168.10.20 und die Maske 255.255.255.0 (/24) binär untereinander.',
            'Verknüpfe bitweise mit UND: Ergebnis ist die Netzadresse 192.168.10.0. Alle Hostbits auf 1 ergeben die Broadcast-Adresse 192.168.10.255.',
            'Berechne die nutzbaren Hosts: 2^(32 − Präfix) − 2, bei /24 also 254, bei /28 also 14.',
            'Wiederhole mit 172.16.5.130/26 und prüfe dein Ergebnis mit einem Online-Rechner oder `ipcalc` (Linux).'
          ],
          code: { lang: 'text', text: 'IP     11000000.10101000.00001010.00010100  192.168.10.20\nMaske  11111111.11111111.11111111.00000000  255.255.255.0 (/24)\nNetz   11000000.10101000.00001010.00000000  192.168.10.0' },
          done: 'Erledigt, wenn du für 172.16.5.130/26 Netzadresse (172.16.5.128), Broadcast (172.16.5.191) und Hostanzahl (62) ohne Hilfsmittel bestimmt hast.',
          tip: 'In Maschinennetzen ist /24 der Normalfall. Kleinere Netze (/28, /29) begegnen dir bei Kopplungen zwischen Maschine und Leitsystem.'
        }
      },
      {
        id: 'o3',
        title: 'Prüfe Erreichbarkeit mit ping, arp und ipconfig',
        guide: {
          intro: 'Die Kommandozeile ist dein erstes Diagnosewerkzeug – noch bevor du Automation Studio öffnest.',
          steps: [
            'Öffne unter Windows die Eingabeaufforderung (Win+R, `cmd`) und lass dir mit `ipconfig /all` die eigene Adresse, Maske, Gateway und MAC-Adresse anzeigen.',
            'Pinge eine Steuerung oder dein Gateway: `ping 192.168.10.1`. Notiere die Antwortzeit (time=…ms) und den TTL-Wert.',
            'Zeige den ARP-Cache mit `arp -a` an und finde die MAC-Adresse des eben gepingten Geräts.',
            'Pinge eine Adresse in einem fremden Subnetz ohne eingetragenes Gateway und beobachte die Meldung (z. B. „Ziel nicht erreichbar“ oder Zeitüberschreitung).',
            'Prüfe mit `netstat -an`, welche TCP-Ports dein PC gerade offen hat (Zustand LISTENING/ESTABLISHED).'
          ],
          code: { lang: 'bash', text: 'ipconfig /all\nping -n 4 192.168.10.1\narp -a\nnetstat -an | findstr 4840' },
          done: 'Erledigt, wenn du zu einem gepingten Gerät IP-Adresse, MAC-Adresse und Antwortzeit dokumentiert hast.',
          tip: 'Viele Industrie-PCs und Firewalls beantworten ping absichtlich nicht. Kein ping heißt also nicht zwingend „Gerät aus“.'
        }
      },
      {
        id: 'o4',
        title: 'Erkläre DHCP, Gateway und Ports am Beispiel einer Maschine',
        guide: {
          intro: 'Maschinen bekommen meist feste Adressen, das Büro-Netz arbeitet mit DHCP. Du musst beides auseinanderhalten können.',
          steps: [
            'Beschreibe den DHCP-Ablauf in vier Schritten: Discover, Offer, Request, Acknowledge (DORA).',
            'Begründe, warum eine SPS im Maschinennetz in der Regel eine feste IP-Adresse bekommt (Clients wie HMI und Leitsystem müssen sie zuverlässig finden).',
            'Erkläre die Rolle des Default-Gateways: Es wird nur für Ziele außerhalb des eigenen Subnetzes benutzt.',
            'Liste wichtige Ports auf: 4840 (OPC UA), 502 (Modbus TCP), 80/443 (HTTP/HTTPS, z. B. mapp View), 123 (NTP), 11169 (B&R ANSL, Online-Verbindung von Automation Studio – laut B&R-Hilfe prüfen).'
          ],
          done: 'Erledigt, wenn du einem Kollegen erklären kannst, warum ein HMI im Subnetz 192.168.10.0/24 eine SPS unter 192.168.20.5 nur mit Gateway erreicht.',
          tip: 'Lass dir vom Kunden einen Adressplan geben und trage alle Geräte mit IP, Maske, Gateway und Funktion in eine Tabelle ein – das ist Teil der Maschinendokumentation.',
          link: { label: 'B&R Help: Ethernet interface configuration', url: H('communication/networkconfiguration/networkconfiguration_ethernetsg4.html') }
        }
      }
    ],
    videos: [
      { id: '9F_AwkOmXZk', title: 'Das OSI-Modell - 7 Schichten in unter 5 Minuten einfach erklärt', channel: 'Patrick Boekhoven', lang: 'de', why: 'Kompakter Überblick über alle 7 Schichten als Einstieg.' },
      { id: '29yUTg9h_NI', title: 'IPv4 einfach erklärt: IP-Adressen, Subnetzmaske, NAT & Gateway', channel: 'IT-Services Gerald Leitner', lang: 'de', why: 'Erklärt Adresse, Maske und Gateway mit praxisnahen Beispielen.' },
      { id: 'WOcpjbEcOy0', title: 'Wie funktioniert das Address Resolution Protocol (ARP)?', channel: 'Patrick Boekhoven', lang: 'de', why: 'Zeigt, wie aus einer IP-Adresse eine MAC-Adresse wird – wichtig für die Diagnose.' }
    ],
    readings: [
      {
        title: 'Rechnernetze – Scriptum Teil 1', author: 'Irmscher, K.', institution: 'Universität Leipzig, Institut für Informatik',
        work: 'Vorlesungsskript Rechnernetze', year: 2010, type: 'Uni-Skript', minutes: 45,
        url: 'https://www.informatik.uni-leipzig.de/~irmscher/lehre/skripte/RechnernetzeScriptum_T1.pdf',
        why: 'Hochschulskript mit OSI- und TCP/IP-Referenzmodell und den Aufgaben der einzelnen Schichten.',
        apa: 'Irmscher, K. (2010). *Rechnernetze – Scriptum Teil 1* [Vorlesungsskript]. Universität Leipzig. ' + ABGERUFEN + 'https://www.informatik.uni-leipzig.de/~irmscher/lehre/skripte/RechnernetzeScriptum_T1.pdf'
      },
      {
        title: 'Grundlagen Rechnernetze und Verteilte Systeme – Skript', author: 'Lehrstuhl für Netzarchitekturen und Netzdienste', institution: 'Technische Universität München',
        work: 'Vorlesungsskript GRNVS, SS 2014', year: 2014, type: 'Uni-Skript', minutes: 40,
        url: 'https://www.net.in.tum.de/fileadmin/RI/teaching/grnvs/ss14/grnvs-script-2014.pdf',
        why: 'Vertieft Adressierung, ARP, IPv4-Subnetting und Transportschicht mit Rechenbeispielen.',
        apa: 'Lehrstuhl für Netzarchitekturen und Netzdienste. (2014). *Grundlagen Rechnernetze und Verteilte Systeme* [Vorlesungsskript, Entwurf]. Technische Universität München. ' + ABGERUFEN + 'https://www.net.in.tum.de/fileadmin/RI/teaching/grnvs/ss14/grnvs-script-2014.pdf'
      },
      {
        title: 'RFC 826: An Ethernet Address Resolution Protocol', author: 'Plummer, D. C.', institution: 'IETF / RFC Editor',
        work: 'Request for Comments', year: 1982, type: 'Norm/Amtlich', minutes: 15,
        url: 'https://www.rfc-editor.org/rfc/rfc826',
        why: 'Die Originalspezifikation von ARP – kurz und gut lesbar.',
        apa: 'Plummer, D. C. (1982). *An Ethernet Address Resolution Protocol* (RFC 826). RFC Editor. ' + ABGERUFEN + 'https://www.rfc-editor.org/rfc/rfc826'
      }
    ],
    quiz: [
      {
        type: 'single', q: 'Auf welcher OSI-Schicht arbeitet ein Router, der zwei IPv4-Subnetze verbindet?',
        options: ['Schicht 1 (Physical)', 'Schicht 2 (Data Link)', 'Schicht 3 (Network)', 'Schicht 7 (Application)'], correct: 2,
        explain: 'Router werten IP-Adressen aus und vermitteln zwischen Netzen – das ist die Vermittlungsschicht (Network Layer, Schicht 3).'
      },
      {
        type: 'numeric', q: 'Wie viele Hosts kannst du in einem IPv4-Subnetz mit Präfix /{P} adressieren (Netz- und Broadcastadresse abgezogen)?',
        params: { P: [22, 30, 1] }, formula: 'Math.pow(2, 32 - P) - 2', unit: 'Hosts', tol: 0,
        explain: 'Hostanzahl = 2^(32 − Präfix) − 2. Die erste Adresse ist die Netzadresse, die letzte die Broadcastadresse.'
      },
      {
        type: 'multi', q: 'Welche Aussagen über ARP sind richtig?',
        options: ['ARP ermittelt zu einer IPv4-Adresse im eigenen Subnetz die MAC-Adresse.', 'ARP-Anfragen werden als Broadcast gesendet.', 'ARP vergibt IP-Adressen an neue Geräte.', 'Mit `arp -a` siehst du unter Windows den ARP-Cache.'],
        correct: [0, 1, 3],
        explain: 'ARP löst IP- in MAC-Adressen auf (Broadcast-Anfrage, Unicast-Antwort). Adressvergabe ist Aufgabe von DHCP.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Ein HMI hat 192.168.10.50/24, die SPS 192.168.10.200/16. Was gilt?',
        options: ['Beide liegen sicher im selben Subnetz.', 'Das HMI sieht die SPS als im eigenen Netz liegend; die SPS sieht das HMI ebenfalls im eigenen (größeren) Netz – es funktioniert, ist aber inkonsistent konfiguriert.', 'Ohne Router keine Verbindung möglich.', 'Die Subnetzmaske spielt bei Ethernet keine Rolle.'],
        correct: 1,
        explain: 'Für beide Geräte liegt das Gegenüber im jeweils eigenen Netz, die Kommunikation klappt. Unterschiedliche Masken im selben Segment sind aber ein Konfigurationsfehler, der bei Broadcasts und Routing Probleme macht.'
      },
      {
        type: 'single', q: 'Welcher Port ist für OPC UA (opc.tcp) standardmäßig registriert?',
        options: ['502', '4840', '44818', '1883'], correct: 1,
        explain: '4840 ist der IANA-registrierte Port für OPC UA. 502 = Modbus TCP, 44818 = EtherNet/IP, 1883 = MQTT.'
      },
      {
        type: 'multi', q: 'Welche Informationen bekommt ein Client typischerweise per DHCP?',
        options: ['IP-Adresse', 'Subnetzmaske', 'Default-Gateway', 'Die MAC-Adresse des Clients'], correct: [0, 1, 2],
        explain: 'DHCP liefert Adresse, Maske, Gateway (und oft DNS). Die MAC-Adresse ist fest in der Netzwerkkarte hinterlegt.'
      },
      {
        type: 'numeric', q: 'Wie lautet das letzte Oktett der Broadcastadresse des Netzes 192.168.1.{X}/27?',
        params: { X: [0, 224, 32] }, formula: 'X + 31', unit: '', tol: 0,
        explain: 'Ein /27-Netz umfasst 32 Adressen. Netzadresse X (Vielfaches von 32), Broadcast = X + 31.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Subnetzprüfung in ST',
        task: 'Ein Bediengerät soll vor dem Verbindungsaufbau prüfen, ob eine eingegebene Zieladresse im **eigenen Subnetz** der Steuerung liegt.\n\n' +
          'Die eigene Adresse der Steuerung ist fest **192.168.10.20**. Die Zieladresse kommt als vier Oktette `usDst1..usDst4` (USINT), das Präfix (z. B. 24 für /24) als `usPrefix`.\n\n' +
          '**Anforderungen:**\n' +
          '1. Setze die vier Oktette zu einem `DWORD` zusammen (Oktett 1 = höchstwertiges Byte, mit `SHL` und `OR`).\n' +
          '2. Bilde die Subnetzmaske aus dem Präfix (Präfix 24 → 16#FFFFFF00). Tipp: Schleife über die Präfix-Bits, `SHL` einer DWORD-Variable mit Wert 1.\n' +
          '3. `doValid` = TRUE, wenn das Präfix im Bereich **1..30** liegt **und** die Zieladresse weder die Netzadresse noch die Broadcastadresse ihres Netzes ist.\n' +
          '4. `doSameNet` = TRUE, wenn `doValid` und die Netzanteile von eigener und Zieladresse gleich sind.\n' +
          '5. `udHosts` = Anzahl nutzbarer Hosts im Netz (2^(32−Präfix) − 2), bei ungültigem Präfix 0.\n\n' +
          'Hinweis: Die invertierte Maske bekommst du mit `dwMask XOR 16#FFFFFFFF`.',
        hints: ['Baue die Maske mit `FOR i := 0 TO usPrefix - 1 DO dwMask := dwMask OR SHL(dwOne, 31 - i); END_FOR` – vorher dwMask := 0 setzen.', 'Netzadresse = Adresse AND Maske, Broadcast = Netzadresse OR (Maske XOR 16#FFFFFFFF).', 'udHosts = DWORD_TO_UDINT(invertierte Maske) − 1.'],
        cycleMs: 10,
        io: [
          { name: 'usDst1', type: 'USINT', dir: 'in', label: 'Ziel-IP Oktett 1', widget: 'slider', min: 0, max: 255, init: 192 },
          { name: 'usDst2', type: 'USINT', dir: 'in', label: 'Ziel-IP Oktett 2', widget: 'slider', min: 0, max: 255, init: 168 },
          { name: 'usDst3', type: 'USINT', dir: 'in', label: 'Ziel-IP Oktett 3', widget: 'slider', min: 0, max: 255, init: 10 },
          { name: 'usDst4', type: 'USINT', dir: 'in', label: 'Ziel-IP Oktett 4', widget: 'slider', min: 0, max: 255, init: 77 },
          { name: 'usPrefix', type: 'USINT', dir: 'in', label: 'Präfixlänge (/x)', widget: 'slider', min: 0, max: 32, init: 24 },
          { name: 'doValid', type: 'BOOL', dir: 'out', label: 'Adresse gültig', widget: 'led' },
          { name: 'doSameNet', type: 'BOOL', dir: 'out', label: 'Im eigenen Subnetz', widget: 'led' },
          { name: 'udHosts', type: 'UDINT', dir: 'out', label: 'Nutzbare Hosts', widget: 'value' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT
	(* Eigene Adresse 192.168.10.20 *)
	dwOwn := 16#C0A80A14;
END_PROGRAM

PROGRAM _CYCLIC
	(* TODO 1: Zieladresse aus usDst1..usDst4 zusammensetzen *)

	(* TODO 2: Maske aus usPrefix bilden *)

	(* TODO 3: doValid, doSameNet, udHosts berechnen *)
	doValid := FALSE;
	doSameNet := FALSE;
	udHosts := 0;
END_PROGRAM
`,
          var: `VAR
	dwOwn : DWORD;
	dwDst : DWORD;
	dwMask : DWORD;
	dwOne : DWORD := 1;
	i : USINT;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	(* Eigene Adresse 192.168.10.20 *)
	dwOwn := 16#C0A80A14;
END_PROGRAM

PROGRAM _CYCLIC
	(* 1: Zieladresse zusammensetzen, Oktett 1 = MSB *)
	dwDst := SHL(USINT_TO_DWORD(usDst1), 24) OR SHL(USINT_TO_DWORD(usDst2), 16)
	      OR SHL(USINT_TO_DWORD(usDst3), 8) OR USINT_TO_DWORD(usDst4);

	(* 2: Maske aus Präfix *)
	dwMask := 0;
	IF usPrefix >= 1 AND usPrefix <= 32 THEN
		FOR i := 0 TO usPrefix - 1 DO
			dwMask := dwMask OR SHL(dwOne, 31 - i);
		END_FOR;
	END_IF;
	dwInv := dwMask XOR 16#FFFFFFFF;
	dwNet := dwDst AND dwMask;
	dwBcast := dwNet OR dwInv;

	(* 3: Auswertung *)
	doValid := usPrefix >= 1 AND usPrefix <= 30 AND dwDst <> dwNet AND dwDst <> dwBcast;
	doSameNet := doValid AND ((dwOwn AND dwMask) = dwNet);
	IF usPrefix >= 1 AND usPrefix <= 30 THEN
		udHosts := DWORD_TO_UDINT(dwInv) - 1;
	ELSE
		udHosts := 0;
	END_IF;
END_PROGRAM
`,
          var: `VAR
	dwOwn : DWORD;
	dwDst : DWORD;
	dwMask : DWORD;
	dwInv : DWORD;
	dwNet : DWORD;
	dwBcast : DWORD;
	dwOne : DWORD := 1;
	i : USINT;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Gleiches /24-Netz wird erkannt', steps: [
            { cycles: 2 },
            { expect: 'doValid', msg: '192.168.10.77/24 ist eine gültige Hostadresse.' },
            { expect: 'doSameNet', msg: '192.168.10.77 liegt im Netz 192.168.10.0/24 der Steuerung.' }
          ]},
          { name: 'Fremdes Netz, aber gleich bei /16', steps: [
            { set: { usDst3: 11, usDst4: 5 } }, { cycles: 2 },
            { expect: 'doValid AND NOT doSameNet', msg: '192.168.11.5 liegt bei /24 nicht im Netz 192.168.10.0.' },
            { set: { usPrefix: 16 } }, { cycles: 2 },
            { expect: 'doSameNet', msg: 'Bei /16 gehören 192.168.10.20 und 192.168.11.5 zum selben Netz.' }
          ]},
          { name: 'Broadcast- und Netzadresse sind ungültig', steps: [
            { set: { usDst4: 255 } }, { cycles: 2 },
            { expect: 'NOT doValid AND NOT doSameNet', msg: '192.168.10.255 ist die Broadcastadresse bei /24.' },
            { set: { usDst4: 0 } }, { cycles: 2 },
            { expect: 'NOT doValid', msg: '192.168.10.0 ist die Netzadresse bei /24.' }
          ]},
          { name: 'Hostanzahl wird berechnet', steps: [
            { cycles: 2 }, { expect: 'udHosts = 254', msg: '/24 hat 254 nutzbare Hosts.' },
            { set: { usPrefix: 30, usDst4: 21 } }, { cycles: 2 }, { expect: 'udHosts = 2', msg: '/30 hat 2 nutzbare Hosts.' }
          ]},
          { name: 'Ungültiges Präfix', steps: [
            { set: { usPrefix: 31 } }, { cycles: 2 },
            { expect: 'NOT doValid AND udHosts = 0', msg: 'Präfix 31 ist laut Anforderung ungültig, udHosts muss 0 sein.' }
          ]}
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────── L2 · Ethernet, POWERLINK, X2X in AS6 ─────────────────────────────
  {
    id: 'komm-2-as6-netz',
    level: 2,
    kind: 'lektion',
    title: 'Ethernet, POWERLINK und X2X Link in Automation Studio 6',
    summary: 'Du konfigurierst die Ethernet-Schnittstelle einer X20-CPU, verstehst den POWERLINK-Zyklus und den X2X Link und wertest Knotenzustände aus.',
    minutes: 150,
    req: ['komm-2-netzwerk'],
    briefing: 'Eine B&R-Steuerung hat typischerweise mehrere Schnittstellen: eine Ethernet-Schnittstelle für Engineering, OPC UA und HMI, eine POWERLINK-Schnittstelle für Antriebe und dezentrale I/O sowie den X2X Link als Rückwandbus zu den X20-Modulen. ' +
      'Du lernst, wo diese Schnittstellen in der Physical View von Automation Studio 6 auftauchen, wie du IP-Adresse und Hostname einstellst und wie POWERLINK seine Echtzeit erreicht (Managing Node, Controlled Nodes, isochrone und asynchrone Phase). ' +
      'In der Übung wertest du – wie eine Diagnose-Task – aus, welche Knoten eines Netzwerks fehlen.',
    practice: 'Nach dem Tausch eines Buskopplers bleibt die Maschine stehen: Du musst in Automation Studio oder im System Diagnostics Manager erkennen, welcher POWERLINK-Knoten fehlt und ob die Knotennummer am Gerät stimmt.',
    transfer: {
      tia: 'Entspricht der Gerätekonfiguration in der Netzsicht des TIA Portals (PROFINET-IO-System mit Gerätenamen). Die Diagnose fehlender Teilnehmer erfolgt dort über Baugruppenzustand und Diagnosepuffer.',
      codesys: 'In TwinCAT übernimmt EtherCAT die Rolle von POWERLINK; fehlende Slaves erkennst du am WcState bzw. in der Online-Ansicht des EtherCAT-Masters.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Stelle die Ethernet-Schnittstelle einer CPU in der Physical View ein',
        guide: {
          intro: 'Die Ethernet-Parameter einer CPU stellst du in der Konfiguration der Schnittstelle (z. B. IF2) ein.',
          steps: [
            'Öffne dein AS6-Projekt und wechsle in die **Physical View**.',
            'Klappe die CPU auf, markiere die Ethernet-Schnittstelle (z. B. IF2) und öffne über das Kontextmenü die **Configuration**.',
            'Setze unter dem Mode-Parameter „Enter IP address manually“ und trage IP-Adresse, Subnetzmaske und Default-Gateway laut Adressplan ein. Vergib einen sprechenden Hostnamen.',
            'Achte darauf, keine führenden Nullen einzugeben (010.043… würde als Oktalzahl interpretiert).',
            'Übertrage die Konfiguration (Build und Transfer) und prüfe die Erreichbarkeit mit `ping`.'
          ],
          done: 'Erledigt, wenn die CPU (oder ARsim) unter der eingestellten Adresse per ping antwortet und Automation Studio sich online verbindet.',
          tip: 'Lege für Engineering-Laptops einen festen zweiten Adressbereich an, statt bei jedem Kunden die Laptop-Adresse umzustellen.',
          link: { label: 'B&R Help: Ethernet interface configuration', url: H('communication/networkconfiguration/networkconfiguration_ethernetsg4.html') }
        }
      },
      {
        id: 'o2',
        title: 'Erkläre den POWERLINK-Zyklus',
        guide: {
          intro: 'POWERLINK ist ein offenes Echtzeit-Ethernet (IEC 61158/61784-2). Ein Managing Node (MN) steuert den Buszugriff, Controlled Nodes (CN) antworten nur auf Aufforderung.',
          steps: [
            'Lies in der B&R-Hilfe den Abschnitt POWERLINK-Übersicht (Managing Node, Controlled Node, Verkabelung).',
            'Zeichne einen Zyklus: SoC (Start of Cycle) → isochrone Phase mit PReq/PRes je CN → SoA (Start of Asynchronous) → asynchrone Phase (z. B. für IP-Verkehr).',
            'Erkläre, warum es dabei keine Kollisionen gibt: Nur wer vom MN aufgefordert wird, sendet.',
            'Suche in der Physical View die POWERLINK-Schnittstelle (z. B. IF3) und finde den Parameter für die Zykluszeit.',
            'Notiere die Knotennummern der CNs (Nummernschalter am Gerät) und vergleiche sie mit der Konfiguration.'
          ],
          done: 'Erledigt, wenn du den Ablauf eines POWERLINK-Zyklus mit SoC, PReq/PRes und SoA skizzieren und die Rolle von MN und CN erklären kannst.',
          tip: 'Eine falsch eingestellte Knotennummer am Gerät ist einer der häufigsten Inbetriebnahmefehler.',
          link: { label: 'B&R Help: POWERLINK', url: H('communication/powerlink/powerlink_start.html') }
        }
      },
      {
        id: 'o3',
        title: 'Ordne den X2X Link als Rückwandbus ein',
        guide: {
          intro: 'Der X2X Link verbindet CPU bzw. Buskoppler mit den X20-I/O-Modulen – über die Rückwand oder per Kabel zu abgesetzten Stationen.',
          steps: [
            'Öffne in der B&R-Hilfe den Abschnitt X2X Link und lies die Grundeigenschaften (Topologie, Leitungslänge, Zyklus).',
            'Sieh dir in der Physical View an, wie die X20-Module unter der X2X-Schnittstelle der CPU angeordnet sind.',
            'Vergleiche: POWERLINK verbindet Stationen (Buskoppler, Antriebe), X2X verbindet die Module innerhalb bzw. zwischen Stationen.',
            'Öffne den **I/O Mapping**-Editor eines Moduls und finde den Status-Datenpunkt `ModuleOk`.'
          ],
          done: 'Erledigt, wenn du für eine gegebene Hardware (CPU, Buskoppler, Antrieb, I/O-Module) sagen kannst, welche Verbindung POWERLINK und welche X2X ist.',
          tip: 'Den Datenpunkt `ModuleOk` jedes Moduls auf eine Variable zu mappen, gehört zur guten Praxis – damit kann die Applikation gezielt reagieren.',
          link: { label: 'B&R Help: X2X Link', url: H('communication/x2x/x2x_link_home.html') }
        }
      }
    ],
    videos: [
      { id: 'pbxDdnnHAyY', title: 'POWERLINK - One network for all systems', channel: 'B&R Industrial Automation', lang: 'en', why: 'Herstellervideo zum Grundprinzip von POWERLINK.' },
      { id: 'awjid4mFyv8', title: 'Integrated Automation with POWERLINK', channel: 'B&R Industrial Automation', lang: 'en', why: 'Zeigt, wie Antriebe, I/O und Safety über ein Netz laufen.' },
      { id: 'CTL0U96x15o', title: 'What is Ethernet Powerlink?', channel: 'Automation Engineer', lang: 'en', why: 'Erklärt den Ablauf eines POWERLINK-Zyklus aus Anwendersicht.' }
    ],
    readings: [
      {
        title: 'Kapitel 8: Kommunikationsschnittstellen', author: 'Pischtschan, M.', institution: 'Fachhochschule Nordwestschweiz (FHNW)',
        work: 'Skript zum MAS Modul Servotechnik', year: 2024, type: 'Uni-Skript', minutes: 30,
        url: 'https://bookdown.org/martin_pischtschan/skript_mas_att/kommunikationsschnittstellen.html',
        why: 'Hochschulskript zu Feldbussen und Echtzeit-Ethernet im Antriebsumfeld.',
        apa: 'Pischtschan, M. (2024). *Skript zum MAS Modul Servotechnik: Kapitel 8 Kommunikationsschnittstellen*. Fachhochschule Nordwestschweiz. ' + ABGERUFEN + 'https://bookdown.org/martin_pischtschan/skript_mas_att/kommunikationsschnittstellen.html'
      },
      brHelp('POWERLINK', 'communication/powerlink/powerlink_start.html', 'Offizieller Einstieg: Managing/Controlled Node, Verkabelung, Redundanz.', 25),
      brHelp('X2X Link', 'communication/x2x/x2x_link_home.html', 'Grundlagen des B&R-Rückwandbusses.', 15)
    ],
    quiz: [
      {
        type: 'single', q: 'Warum gibt es bei POWERLINK in der isochronen Phase keine Kollisionen?',
        options: ['Weil nur Switches verwendet werden dürfen.', 'Weil nur der Knoten sendet, den der Managing Node per PReq auffordert.', 'Weil alle Knoten gleichzeitig senden und die Daten überlagert werden.', 'Weil POWERLINK kein Ethernet verwendet.'], correct: 1,
        explain: 'Der Managing Node vergibt das Senderecht (Poll Request). Controlled Nodes antworten mit PRes – zeitgesteuert, ohne Konkurrenz um das Medium.'
      },
      {
        type: 'multi', q: 'Welche Parameter stellst du für eine Ethernet-Schnittstelle mit fester Adresse typischerweise ein?',
        options: ['IP-Adresse', 'Subnetzmaske', 'Default-Gateway', 'POWERLINK-Knotennummer'], correct: [0, 1, 2],
        explain: 'Die Knotennummer gehört zu POWERLINK-Schnittstellen. Für Ethernet sind Adresse, Maske, Gateway (und Hostname) relevant.'
      },
      {
        type: 'single', q: 'Wofür steht der X2X Link?',
        options: ['Für die Kopplung zweier Steuerungen über OPC UA', 'Für den Bus zwischen CPU/Buskoppler und X20/X67-I/O-Modulen', 'Für das WLAN-Modul der CPU', 'Für die Verbindung zum Leitsystem'], correct: 1,
        explain: 'X2X Link ist der B&R-I/O-Bus zwischen Kopf (CPU oder Buskoppler) und den I/O-Modulen.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Was passiert in der asynchronen Phase eines POWERLINK-Zyklus?',
        options: ['Zeitkritische Prozessdaten aller Knoten werden übertragen.', 'Ein vom MN per SoA zugeteilter Knoten darf nicht zeitkritische Daten (z. B. IP-Verkehr, Parameter) senden.', 'Alle Knoten werden neu gestartet.', 'Die Zykluszeit wird neu berechnet.'], correct: 1,
        explain: 'Nach dem SoA darf genau ein Knoten asynchrone Daten senden – z. B. Konfigurationsdaten oder Standard-IP-Telegramme.'
      },
      {
        type: 'single', q: 'Warum sollte man bei der IP-Adresse „010.043.128.137“ vorsichtig sein?',
        options: ['Führende Nullen können als Oktalzahl interpretiert werden.', 'Adressen mit 0 sind generell verboten.', 'Sie ist eine Broadcastadresse.', 'Sie liegt im POWERLINK-Bereich.'], correct: 0,
        explain: 'Laut B&R-Hilfe wird eine führende Null als Oktalzahl interpretiert – die Adresse wäre dann 8.35.128.137.'
      },
      {
        type: 'multi', q: 'Welche Fehlerbilder deuten auf ein Problem mit einem POWERLINK-Knoten hin?',
        options: ['Station/Modul in der Online-Ansicht als „nicht vorhanden“ gemeldet', 'Falsche Knotennummer am Nummernschalter', 'ModuleOk der zugehörigen Module ist FALSE', 'Die Ethernet-Schnittstelle IF2 hat eine feste IP-Adresse'], correct: [0, 1, 2],
        explain: 'Fehlende Station, falsche Knotennummer und ModuleOk = FALSE sind typische Symptome. Eine feste IP auf IF2 ist normal.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Knotendiagnose: Welche Station fehlt?',
        task: 'Eine Diagnose-Task bekommt zwei Bitmasken (je Bit ein Netzwerkknoten, **Bit 0 = Knoten 1**, Bit 31 = Knoten 32):\n\n' +
          '* `dwCfgNodes` – welche Knoten konfiguriert sind\n* `dwOkNodes` – welche Knoten aktuell betriebsbereit melden (vergleichbar mit gemappten `ModuleOk`-Datenpunkten)\n\n' +
          '**Anforderungen:**\n' +
          '1. `usMissing` = Anzahl der konfigurierten Knoten, die **nicht** betriebsbereit sind. Nicht konfigurierte Knoten werden ignoriert, auch wenn ihr Ok-Bit gesetzt ist.\n' +
          '2. `usFirstMissing` = kleinste Knotennummer (1..32) eines fehlenden Knotens, 0 wenn keiner fehlt.\n' +
          '3. `doAllOk` = TRUE, wenn kein konfigurierter Knoten fehlt.\n' +
          '4. `doWarn` = TRUE, wenn mindestens ein Knoten **länger als 500 ms** ununterbrochen fehlt (Entprellung mit `TON`).\n\n' +
          'Einzelne Bits einer DWORD-Variable mit variablem Index prüfst du mit `(SHR(dw, i) AND 1) = 1`.',
        hints: ['Schleife `FOR i := 0 TO 31 DO … END_FOR`; Knotennummer = i + 1.', 'Fehlende Knoten: `dwCfgNodes AND (dwOkNodes XOR 16#FFFFFFFF)`.', 'usFirstMissing nur setzen, solange es noch 0 ist.'],
        cycleMs: 10,
        io: [
          { name: 'dwCfgNodes', type: 'DWORD', dir: 'in', label: 'Konfigurierte Knoten (Bitmaske)', widget: 'slider', min: 0, max: 255, init: 15 },
          { name: 'dwOkNodes', type: 'DWORD', dir: 'in', label: 'Betriebsbereite Knoten (Bitmaske)', widget: 'slider', min: 0, max: 255, init: 15 },
          { name: 'usMissing', type: 'USINT', dir: 'out', label: 'Anzahl fehlender Knoten', widget: 'value' },
          { name: 'usFirstMissing', type: 'USINT', dir: 'out', label: 'Erster fehlender Knoten', widget: 'value' },
          { name: 'doAllOk', type: 'BOOL', dir: 'out', label: 'Alle Knoten OK', widget: 'led' },
          { name: 'doWarn', type: 'BOOL', dir: 'out', label: 'Warnung Knotenausfall', widget: 'led' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: fehlende Knoten zählen, ersten fehlenden Knoten bestimmen *)
	doAllOk := dwCfgNodes = dwOkNodes;
END_PROGRAM
`,
          var: `VAR
	dwMissingMask : DWORD;
	i : USINT;
	fbWarn : TON;
END_VAR
`,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	dwMissingMask := dwCfgNodes AND (dwOkNodes XOR 16#FFFFFFFF);
	usMissing := 0;
	usFirstMissing := 0;
	FOR i := 0 TO 31 DO
		IF (SHR(dwMissingMask, i) AND 1) = 1 THEN
			usMissing := usMissing + 1;
			IF usFirstMissing = 0 THEN
				usFirstMissing := i + 1;
			END_IF;
		END_IF;
	END_FOR;
	doAllOk := usMissing = 0;
	fbWarn(IN := usMissing > 0, PT := T#500ms);
	doWarn := fbWarn.Q;
END_PROGRAM
`,
          var: `VAR
	dwMissingMask : DWORD;
	i : USINT;
	fbWarn : TON;
END_VAR
`,
          typ: ''
        },
        tests: [
          { name: 'Alle konfigurierten Knoten OK', steps: [
            { cycles: 3 },
            { expect: 'doAllOk AND usMissing = 0 AND usFirstMissing = 0 AND NOT doWarn' }
          ]},
          { name: 'Knoten 3 fehlt', steps: [
            { set: { dwOkNodes: 11 } }, { cycles: 2 },
            { expect: 'NOT doAllOk', msg: 'Knoten 3 (Bit 2) fehlt, doAllOk muss FALSE sein.' },
            { expect: 'usMissing = 1 AND usFirstMissing = 3', msg: 'Ein Knoten fehlt, und zwar Knoten 3.' }
          ]},
          { name: 'Nicht konfigurierte Knoten werden ignoriert', steps: [
            { set: { dwOkNodes: 255 } }, { cycles: 2 },
            { expect: 'doAllOk AND usMissing = 0', msg: 'Zusätzliche Ok-Bits nicht konfigurierter Knoten dürfen nicht stören.' },
            { set: { dwCfgNodes: 0x80000001, dwOkNodes: 1 } }, { cycles: 2 },
            { expect: 'usMissing = 1 AND usFirstMissing = 32', msg: 'Knoten 32 (Bit 31) ist konfiguriert, meldet aber nicht.' }
          ]},
          { name: 'Warnung erst nach 500 ms', steps: [
            { set: { dwOkNodes: 7 } },
            { never: 'doWarn', ms: 400, msg: 'Die Warnung darf nicht vor 500 ms kommen (Entprellung).' },
            { until: 'doWarn', maxMs: 300, msg: 'Nach 500 ms Ausfall muss doWarn kommen.' },
            { set: { dwOkNodes: 15 } }, { cycles: 2 },
            { expect: 'NOT doWarn AND doAllOk', msg: 'Ist der Knoten wieder da, verschwindet die Warnung.' }
          ]}
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────── L2 · Feldbus-Überblick ─────────────────────────────
  {
    id: 'komm-2-feldbus',
    level: 2,
    kind: 'lektion',
    title: 'Feldbusse im Überblick: PROFINET, EtherCAT, EtherNet/IP, Modbus, IO-Link',
    summary: 'Du vergleichst die gängigen Feldbusse und Industrial-Ethernet-Systeme und lernst, warum Byte-Reihenfolge (Endianness) beim Datenaustausch zählt.',
    minutes: 120,
    req: ['komm-2-netzwerk'],
    briefing: 'In der Praxis triffst du nicht nur B&R-Komponenten: Kundenvorgaben verlangen oft PROFINET, EtherNet/IP oder Modbus, und Sensoren kommen zunehmend mit IO-Link. ' +
      'Du lernst, wie sich die Systeme bei Zugriffsverfahren (Master/Slave, Provider/Consumer, Summenrahmen), Echtzeitfähigkeit und Gerätebeschreibung (GSDML, ESI, EDS, IODD) unterscheiden. ' +
      'Außerdem lernst du ein Detail, das bei jedem Fremdgerät zuschlägt: Mehrbyte-Werte werden je nach System in Big- oder Little-Endian übertragen.',
    practice: 'Eine Maschine soll an eine Siemens-Linie (PROFINET) angebunden werden, ein Zulieferaggregat spricht Modbus TCP. Du musst entscheiden, welche B&R-Schnittstelle (z. B. Buskoppler, Interfacemodul) gebraucht wird, und die Rohdaten korrekt interpretieren.',
    transfer: {
      tia: 'PROFINET ist im TIA Portal das native System; Geräte werden per GSDML eingebunden. S7-CPUs arbeiten intern Big-Endian.',
      codesys: 'TwinCAT setzt auf EtherCAT (ESI-Dateien); x86-basierte Steuerungen sind Little-Endian – genau wie B&R-CPUs auf Intel-Basis.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Vergleiche Industrial-Ethernet-Systeme anhand fester Kriterien',
        guide: {
          intro: 'Ein strukturierter Vergleich hilft dir bei Kundengesprächen und Architekturentscheidungen.',
          steps: [
            'Lege eine Tabelle an mit den Spalten: System, Organisation, Zugriffsverfahren, typische Zykluszeit, Gerätebeschreibung, B&R-Anbindung.',
            'Trage ein: PROFINET (PI, Provider/Consumer, GSDML), EtherCAT (ETG, Summenrahmen/Processing on the fly, ESI), EtherNet/IP (ODVA, CIP, EDS), POWERLINK (EPSG, Polling durch MN, XDD), Modbus TCP (Client/Server, keine Gerätebeschreibung).',
            'Recherchiere in der B&R-Hilfe, über welche Wege B&R-Steuerungen diese Systeme anbinden (z. B. Interfacemodule, Buskoppler, Software-Stacks) – trage nur ein, was du belegen kannst.',
            'Ergänze IO-Link als Punkt-zu-Punkt-Verbindung zum Sensor (kein Feldbus, sondern „letzter Meter“, Gerätebeschreibung IODD).'
          ],
          done: 'Erledigt, wenn deine Tabelle mindestens fünf Systeme mit allen Spalten enthält.',
          tip: 'Die Gerätebeschreibungsdatei ist bei Fremdgeräten dein erster Anlaufpunkt – frag beim Lieferanten immer nach der aktuellen Version.',
          link: { label: 'B&R Help: Modbus TCP', url: H('communication/fieldbuses/modbus/modbusguideline.html') }
        }
      },
      {
        id: 'o2',
        title: 'Erkläre Big- und Little-Endian an einem Beispiel',
        guide: {
          intro: 'Ein WORD mit dem Wert 16#1234 besteht aus den Bytes 16#12 (High) und 16#34 (Low). Die Reihenfolge, in der diese Bytes im Speicher oder auf der Leitung liegen, ist die Endianness.',
          steps: [
            'Schreibe 16#1234 in Big-Endian (12 34, „Netzwerk-Byte-Reihenfolge“) und Little-Endian (34 12, Intel-Prozessoren).',
            'Überlege, welcher Wert entsteht, wenn ein Little-Endian-System Big-Endian-Bytes ohne Tausch interpretiert (16#3412 = 13330 statt 4660).',
            'Schreibe in ST den Tausch eines WORD mit `SHL`, `SHR`, `AND` und `OR` auf.',
            'Erweitere auf ein DWORD (4 Bytes): Reihenfolge 12 34 56 78 ↔ 78 56 34 12.'
          ],
          code: { lang: 'st', text: 'wSwapped := SHL(wRaw AND 16#00FF, 8) OR SHR(wRaw, 8);' },
          done: 'Erledigt, wenn du ohne Hilfsmittel den Byte-Tausch für WORD und DWORD in ST aufschreiben kannst.',
          tip: 'Modbus und die meisten Ethernet-Protokolle übertragen Big-Endian. B&R-CPUs auf Intel-Basis rechnen intern Little-Endian.'
        }
      },
      {
        id: 'o3',
        title: 'Ordne Feldbusse in die Automatisierungspyramide ein',
        guide: {
          intro: 'Nicht jedes Protokoll gehört auf jede Ebene. Die Einordnung hilft dir bei der Wahl.',
          steps: [
            'Zeichne die Ebenen: Feld (Sensor/Aktor), Steuerung, Leitebene (SCADA/HMI), Betriebsleitebene (MES), Unternehmensebene (ERP).',
            'Ordne zu: IO-Link → Feld; POWERLINK/EtherCAT/PROFINET → Feld–Steuerung; OPC UA → Steuerung–Leitebene–MES; MQTT → MES/Cloud.',
            'Diskutiere, warum harte Echtzeit nur auf den unteren Ebenen gebraucht wird.'
          ],
          done: 'Erledigt, wenn deine Pyramide jedes der Protokolle PROFINET, EtherCAT, POWERLINK, Modbus TCP, IO-Link, OPC UA und MQTT mindestens einer Ebene zuordnet.',
          tip: 'Die strenge Pyramide löst sich durch OPC UA und MQTT zunehmend auf – für das Verständnis von Echtzeitanforderungen ist sie trotzdem nützlich.'
        }
      }
    ],
    videos: [
      { id: 'hHIRprcxLE0', title: 'Industrial Ethernet, PROFINET IO/CBA/RT/IRT, EtherCAT, Master/Slave | Prof. Griesbauer', channel: 'Prof Joe', lang: 'de', why: 'Vorlesungsmitschnitt mit dem Vergleich der Echtzeit-Ethernet-Verfahren.' },
      { id: '26EdImSwRio', title: 'Netzwerke, Feldbusse, Industrielle Anforderungen, Determinismus, Latenz, Robust | Prof. Griesbauer', channel: 'Prof Joe', lang: 'de', why: 'Erklärt, warum industrielle Netze andere Anforderungen haben als Büro-Netze.' },
      { id: '6g5pL1ilHgI', title: 'Little Endian vs. Big Endian', channel: 'BitLemon', lang: 'en', why: 'Anschauliche Animation zur Byte-Reihenfolge.' }
    ],
    readings: [
      {
        title: 'Kapitel 8: Kommunikationsschnittstellen', author: 'Pischtschan, M.', institution: 'Fachhochschule Nordwestschweiz (FHNW)',
        work: 'Skript zum MAS Modul Servotechnik', year: 2024, type: 'Uni-Skript', minutes: 30,
        url: 'https://bookdown.org/martin_pischtschan/skript_mas_att/kommunikationsschnittstellen.html',
        why: 'Überblick über Feldbusse nach IEC 61158 und Echtzeit-Ethernet.',
        apa: 'Pischtschan, M. (2024). *Skript zum MAS Modul Servotechnik: Kapitel 8 Kommunikationsschnittstellen*. Fachhochschule Nordwestschweiz. ' + ABGERUFEN + 'https://bookdown.org/martin_pischtschan/skript_mas_att/kommunikationsschnittstellen.html'
      },
      {
        title: 'EtherCAT – Technologie', author: 'EtherCAT Technology Group', institution: 'EtherCAT Technology Group',
        work: 'Technologie-Einführung', year: 2026, type: 'Dokumentation', minutes: 20,
        url: 'https://www.ethercat.org/de/technology.html',
        why: 'Erklärt das Summenrahmen-Prinzip („Processing on the fly“) aus erster Hand.',
        apa: 'EtherCAT Technology Group. (2026). *EtherCAT – Technologie*. ' + ABGERUFEN + 'https://www.ethercat.org/de/technology.html'
      },
      {
        title: 'EtherNet/IP', author: 'ODVA', institution: 'ODVA, Inc.',
        work: 'Key Technologies', year: 2026, type: 'Dokumentation', minutes: 15,
        url: 'https://www.odva.org/technology-standards/key-technologies/ethernet-ip/',
        why: 'Offizielle Kurzbeschreibung von EtherNet/IP und CIP.',
        apa: 'ODVA. (2026). *EtherNet/IP*. ' + ABGERUFEN + 'https://www.odva.org/technology-standards/key-technologies/ethernet-ip/'
      }
    ],
    quiz: [
      {
        type: 'single', q: 'Welches System arbeitet nach dem Summenrahmen-Prinzip, bei dem ein Telegramm alle Slaves durchläuft?',
        options: ['Modbus TCP', 'EtherCAT', 'IO-Link', 'MQTT'], correct: 1,
        explain: 'Bei EtherCAT liest und schreibt jeder Slave seine Daten „im Durchlauf“ in einen gemeinsamen Rahmen.'
      },
      {
        type: 'single', q: 'Ein Gerät sendet das WORD 16#1234 Big-Endian (erst 16#12, dann 16#34). Eine Little-Endian-CPU kopiert die Bytes ungetauscht in ein WORD. Welcher Wert steht drin?',
        options: ['16#1234', '16#3412', '16#2143', '16#4321'], correct: 1,
        explain: 'Little-Endian legt das niederwertige Byte zuerst ab. Das zuerst empfangene 16#12 wird zum Low-Byte → 16#3412.'
      },
      {
        type: 'multi', q: 'Welche Zuordnung von Gerätebeschreibungsdatei zu System ist richtig?',
        options: ['GSDML – PROFINET', 'ESI – EtherCAT', 'EDS – EtherNet/IP', 'IODD – Modbus TCP'], correct: [0, 1, 2],
        explain: 'IODD ist die Gerätebeschreibung für IO-Link. Modbus TCP kennt keine standardisierte Gerätebeschreibungsdatei.'
      }
    ],
    exam: [
      {
        type: 'single', q: 'Was ist IO-Link?',
        options: ['Ein Echtzeit-Ethernet für Antriebe', 'Eine serielle Punkt-zu-Punkt-Verbindung zwischen IO-Link-Master und einem Sensor/Aktor', 'Ein Cloud-Protokoll', 'Ein Nachfolger von OPC UA'], correct: 1,
        explain: 'IO-Link (IEC 61131-9) verbindet genau ein Gerät mit einem Master-Port über ungeschirmte Standardleitung.'
      },
      {
        type: 'single', q: 'Welches Zugriffsverfahren nutzt PROFINET IO für zyklische Daten?',
        options: ['Token Passing', 'Provider/Consumer mit zyklischem Senden', 'Summenrahmen', 'Publish/Subscribe über einen Broker'], correct: 1,
        explain: 'Bei PROFINET IO senden IO-Controller und IO-Devices ihre Daten zyklisch als Provider; der jeweilige Partner ist Consumer.'
      },
      {
        type: 'numeric', q: 'Ein Big-Endian-Gerät sendet die Bytes 16#00 und 16#{B} (dezimal {B}) für ein WORD. Welchen Dezimalwert erhältst du, wenn du sie fälschlich als Little-Endian interpretierst?',
        params: { B: [1, 200, 1] }, formula: 'B * 256', unit: '', tol: 0,
        explain: 'Falsch interpretiert wird das zweite Byte zum High-Byte: Wert = B · 256 + 0.'
      }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Byte-Reihenfolge tauschen und Messwert skalieren',
        task: 'Ein Temperaturfühler an einem Fremd-Feldbus liefert seine Werte **Big-Endian**. Die Rohdaten landen ungetauscht in `wRaw` (WORD) bzw. `dwRaw` (DWORD) auf deiner Little-Endian-CPU.\n\n' +
          '**Anforderungen:**\n' +
          '1. `wSwapped` = `wRaw` mit vertauschten Bytes (16#3412 → 16#1234). Benutze `SHL`, `SHR`, `AND`, `OR`.\n' +
          '2. `dwSwapped` = `dwRaw` mit umgekehrter Byte-Reihenfolge (16#78563412 → 16#12345678).\n' +
          '3. `rTemp` = getauschter WORD-Wert als **vorzeichenbehaftete** Zahl (INT, Zweierkomplement) in 0,1 °C, also geteilt durch 10.0. Beispiel: 16#00E6 → 23,0 °C, 16#FF38 → −20,0 °C.\n\n' +
          'Annahme: `WORD_TO_INT` übernimmt das Bitmuster (Zweierkomplement), wie auf dem echten Target.',
        hints: ['Maskiere vor dem Schieben nach links, damit kein Bit über die Datentypgrenze „wandert“: `SHL(wRaw AND 16#00FF, 8)`.', 'Für das DWORD brauchst du vier Teilterme, z. B. `SHL(dwRaw AND 16#000000FF, 24)`.', 'rTemp := INT_TO_REAL(WORD_TO_INT(wSwapped)) / 10.0;'],
        cycleMs: 10,
        io: [
          { name: 'wRaw', type: 'WORD', dir: 'in', label: 'Rohwert WORD (Big-Endian-Bytes)', widget: 'slider', min: 0, max: 65535, init: 0 },
          { name: 'dwRaw', type: 'DWORD', dir: 'in', label: 'Rohwert DWORD (Big-Endian-Bytes)', widget: 'value', init: 0 },
          { name: 'wSwapped', type: 'WORD', dir: 'out', label: 'WORD getauscht', widget: 'value' },
          { name: 'dwSwapped', type: 'DWORD', dir: 'out', label: 'DWORD getauscht', widget: 'value' },
          { name: 'rTemp', type: 'REAL', dir: 'out', label: 'Temperatur', widget: 'gauge', min: -50, max: 150, unit: '°C' }
        ],
        scene: { type: 'generic' },
        files: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Bytes tauschen *)
	wSwapped := wRaw;
	dwSwapped := dwRaw;
	(* TODO: Temperatur in °C *)
	rTemp := 0.0;
END_PROGRAM
`,
          var: 'VAR\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	wSwapped := SHL(wRaw AND 16#00FF, 8) OR SHR(wRaw, 8);
	dwSwapped := SHL(dwRaw AND 16#000000FF, 24)
	          OR SHL(dwRaw AND 16#0000FF00, 8)
	          OR (SHR(dwRaw, 8) AND 16#0000FF00)
	          OR (SHR(dwRaw, 24) AND 16#000000FF);
	rTemp := INT_TO_REAL(WORD_TO_INT(wSwapped)) / 10.0;
END_PROGRAM
`,
          var: 'VAR\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'WORD wird getauscht', steps: [
            { set: { wRaw: 0x3412 } }, { cycles: 2 },
            { expect: 'wSwapped = 16#1234', msg: '16#3412 muss zu 16#1234 werden.' }
          ]},
          { name: 'DWORD wird getauscht', steps: [
            { set: { dwRaw: 0x78563412 } }, { cycles: 2 },
            { expect: 'dwSwapped = 16#12345678', msg: '16#78563412 muss zu 16#12345678 werden.' }
          ]},
          { name: 'Positive Temperatur', steps: [
            { set: { wRaw: 0xE600 } }, { cycles: 2 },
            { expect: 'ABS(rTemp - 23.0) < 0.01', msg: '16#E600 (getauscht 16#00E6 = 230) entspricht 23,0 °C.' }
          ]},
          { name: 'Negative Temperatur (Zweierkomplement)', steps: [
            { set: { wRaw: 0x38FF } }, { cycles: 2 },
            { expect: 'ABS(rTemp + 20.0) < 0.01', msg: '16#38FF (getauscht 16#FF38 = −200) entspricht −20,0 °C.' }
          ]}
        ]
      }
    ],
    proof: false
  }
];
