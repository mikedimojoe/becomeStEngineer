'use strict';
const { HINWEIS, ST_HINWEIS, ABGERUFEN, brHelp, brReading } = require('./_common');

// ---------------------------------------------------------------------------
// Level 3 – Senior: Rechtsrahmen, Sicherheitsfunktionen, Standard-SPS ↔ Sicherheits-SPS
// ---------------------------------------------------------------------------

const m1 = {
  id: 'safety-3-rechtsrahmen',
  level: 3,
  kind: 'lektion',
  title: 'Rechtsrahmen und Risikobeurteilung',
  summary: 'Maschinenrichtlinie, Maschinenverordnung, EN ISO 12100 – und welche Rolle die Standard-SPS dabei spielt.',
  minutes: 120,
  req: [],
  briefing: 'Bevor du eine einzige Sicherheitsfunktion programmierst, musst du wissen, warum es sie gibt: Der Hersteller einer Maschine muss nachweisen, dass er alle Gefährdungen beurteilt und die Risiken ausreichend gemindert hat. ' +
    'Rechtsgrundlage in der EU ist bis 19.01.2027 die Maschinenrichtlinie 2006/42/EG, ab dem **20. Januar 2027** gilt unmittelbar die Maschinenverordnung (EU) 2023/1230. ' +
    'Das Werkzeug für die Beurteilung ist die EN ISO 12100 mit der 3-Stufen-Methode. Am Ende des Moduls kannst du außerdem erklären, warum die Standard-SPS Statussignale der Sicherheitssteuerung nur auswertet und nie selbst die Sicherheit trägt.' + HINWEIS,
  practice: 'Bei jeder Maschinenabnahme fragt jemand nach Risikobeurteilung, Konformitätserklärung und Sicherheitskonzept. Als Programmierer lieferst du dazu die Umsetzung der Sicherheitsfunktionen und die Diagnose im Standardprogramm.',
  transfer: {
    tia: 'Rechtsrahmen und Normen sind herstellerunabhängig. In TIA Portal liegt die Sicherheitslogik im F-Programm (STEP 7 Safety), das Standardprogramm liest F-Statusbits – das Prinzip „Standard wertet aus, Safety schaltet ab“ ist identisch.',
    codesys: 'In CODESYS/TwinCAT gilt dasselbe: TwinSAFE- bzw. CODESYS-Safety-Projekte sind getrennt vom Standardprojekt, Diagnose kommt über Statusvariablen ins Standardprogramm.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Ordne Maschinenrichtlinie und Maschinenverordnung zeitlich ein',
      guide: {
        intro: 'Richtlinie und Verordnung gelten nicht gleichzeitig. Du musst wissen, nach welchem Rechtsakt eine Maschine in Verkehr gebracht wird.',
        steps: [
          'Lies das Merkblatt der DGUV Test zur Maschinenverordnung (Link unten) und notiere die Daten: Veröffentlichung im Amtsblatt 29.06.2023, Geltung ab 20.01.2027.',
          'Halte fest: Bis einschließlich 19.01.2027 wird nach der Maschinenrichtlinie 2006/42/EG in Verkehr gebracht, ab 20.01.2027 nur noch nach der Verordnung (EU) 2023/1230 – ohne Übergangsfrist für das Inverkehrbringen.',
          'Notiere den Unterschied Richtlinie ↔ Verordnung: Eine Verordnung gilt unmittelbar in allen Mitgliedstaaten, eine Richtlinie musste national umgesetzt werden (in Deutschland über das ProdSG und die 9. ProdSV).',
          'Sammle drei Neuerungen der Verordnung, die für Software relevant sind: Schutz gegen Korruption/Manipulation (Cybersecurity-Aspekte), Sicherheitsbauteile auch als Software, Anforderungen an selbstlernende Systeme.',
          'Lege in deinem Projektordner eine Datei `Docs/Rechtsrahmen.md` mit diesen Punkten an.'
        ],
        done: 'Erledigt, wenn du ohne Unterlagen sagen kannst, welcher Rechtsakt für eine Maschine gilt, die am 15.01.2027 bzw. am 01.03.2027 in Verkehr gebracht wird.',
        tip: 'Der Zeitpunkt des Inverkehrbringens zählt, nicht das Baujahr oder der Auftragseingang. Kläre das im Projekt früh mit der Konstruktion.',
        link: { label: 'DGUV Test: Regulation (EU) 2023/1230', url: 'https://www.dguv.de/dguv-test/prod-testing-certi/conform-prod/machinery/eu-maschinenverordnung/index.jsp' }
      }
    },
    {
      id: 'o2',
      title: 'Führe eine Risikobeurteilung nach EN ISO 12100 durch',
      guide: {
        intro: 'Die EN ISO 12100 beschreibt einen iterativen Prozess. Du übst ihn an einem einfachen Förderband mit Schutztür.',
        steps: [
          'Lege die **Grenzen der Maschine** fest: Verwendungsgrenzen (bestimmungsgemäße Verwendung, vorhersehbare Fehlanwendung), räumliche und zeitliche Grenzen, Lebensphasen (Transport, Inbetriebnahme, Betrieb, Reinigung, Instandhaltung).',
          '**Identifiziere Gefährdungen** systematisch je Lebensphase, z. B. Einziehstelle an der Umlenkrolle, Quetschen am Hubtisch, unerwarteter Anlauf nach Störungsbeseitigung.',
          '**Schätze das Risiko** je Gefährdung ein: Schadensausmaß, Häufigkeit/Dauer der Exposition, Eintrittswahrscheinlichkeit, Möglichkeit zur Vermeidung.',
          '**Bewerte** das Risiko: Ist eine Minderung nötig? Wenn ja, wende die 3-Stufen-Methode an: 1. inhärent sichere Konstruktion, 2. technische Schutzmaßnahmen (hier entstehen Sicherheitsfunktionen), 3. Benutzerinformation.',
          'Dokumentiere jede Gefährdung als Zeile in einer Tabelle (Gefährdung, Lebensphase, Risiko vorher, Maßnahme, Risiko nachher) und prüfe, ob durch die Maßnahme neue Gefährdungen entstehen.'
        ],
        done: 'Erledigt, wenn deine Tabelle mindestens fünf Gefährdungen über mindestens drei Lebensphasen enthält und jeder technischen Maßnahme eine benannte Sicherheitsfunktion zugeordnet ist.',
        tip: 'Fang nie mit der Lösung an („wir bauen ein Lichtgitter“). Erst die Gefährdung, dann die Maßnahme – sonst fehlen später Gefährdungen in der Dokumentation.',
        link: { label: 'Suva: Das Wichtigste zur Risikobeurteilung (EN ISO 12100)', url: 'https://www.suva.ch/de-ch/download/dokument/sicherheit-von-maschinen-br-das-wichtigste-zur-risikobeurteilung-br-ueberblick-ueber-den-inhalt-der-en-iso-12100--ce15-1.d' }
      }
    },
    {
      id: 'o3',
      title: 'Trenne Sicherheitslogik und Standardlogik in AS6',
      guide: {
        intro: 'In einem B&R-Projekt mit mapp Safety liegen Standard-Applikation und SafeAPPLICATION nebeneinander, aber streng getrennt.',
        steps: [
          'Öffne in Automation Studio 6 ein Projekt und wechsle in die **Physical View**: SafeLOGIC und sichere I/O-Module (SafeNODEs) erscheinen dort wie normale Hardware.',
          'Öffne die **Configuration View**: Unter `mappSafety` liegen die Konfigurationsdateien (`Settings.sfcfg`, `config.sfdomain`) der SafeDOMAIN.',
          'Merke: Die Sicherheitslogik wird nicht in der Logical View als ST-Programm angelegt, sondern im **SafeDESIGNER** (Aufruf in der Physical View per Rechtsklick › SafeDESIGNER).',
          'Lege in der **Logical View** ein normales ST-Programm `SafetyDiag` an (Rechtsklick › Add Object › Program). Hier wertest du später nur Statussignale aus.',
          'Skizziere auf Papier: Sensor → sicheres Eingangsmodul → SafeLOGIC → sicheres Ausgangsmodul → Aktor. Zeichne gestrichelt, welche Statussignale die Standard-CPU lesen darf.'
        ],
        done: 'Erledigt, wenn du in deinem Projekt zeigen kannst, wo die SafeAPPLICATION konfiguriert wird und wo dein Standardprogramm `SafetyDiag` liegt.',
        tip: 'Statussignale der Sicherheitssteuerung (z. B. SafeModuleOK oder Freigabestatus) sind in der Standard-CPU nicht sicher. Nutze sie für Diagnose und Bedienführung, nie als Ersatz für eine Abschaltung.',
        link: { label: 'B&R Help: mapp Safety – Getting Started', url: brHelp('safety/mapp_safety/getting-started/getting-started.html') }
      }
    }
  ],
  videos: [
    { id: 'SmIQVl1BRMA', title: 'Maschinenverordnung vs. Maschinenrichtlinie', channel: 'CE Expert', lang: 'de', why: 'Kompakter Vergleich der beiden Rechtsakte und der Übergangsregeln.' },
    { id: '3skupAwxXx4', title: 'Risikobeurteilung nach Maschinenrichtlinie und EN ISO 12100', channel: 'Dirk Leitsch', lang: 'de', why: 'Erklärt den Ablauf der Risikobeurteilung Schritt für Schritt.' },
    { id: 'qbCml5EyrhE', title: 'Ihr Weg zur Maschinensicherheit: 1/6 Risikobeurteilung von Maschinen | Pilz', channel: 'Pilz GmbH & Co. KG', lang: 'de', why: 'Sicht eines Sicherheitstechnik-Herstellers auf die Risikobeurteilung im Lebenszyklus.' }
  ],
  readings: [
    {
      title: 'Risikoanalyse und Sicherheitskonzept (Vortrag für Maschinen in Forschung und Lehre)', author: 'Pilz GmbH & Co. KG', institution: 'Universität Stuttgart, Institut für Arbeitssicherheit (IAG)',
      work: 'Vortragsunterlagen Arbeitssicherheit', year: 2020, type: 'Uni-Skript', minutes: 40,
      url: 'https://www.iag.uni-stuttgart.de/iag-intern/dokumente/PDF-Arbeitssicherheit/04-Pilz-Uni-Stgt.-27.10.2020-Risikoanalyse-und-Sicherheitskonzept.pdf',
      why: 'Folien zum Ablauf der Risikobeurteilung nach EN ISO 12100 bis zum Sicherheitskonzept, gehalten an der Universität Stuttgart.',
      apa: 'Pilz GmbH & Co. KG. (2020). *Risikoanalyse und Sicherheitskonzept* [Vortragsfolien]. Universität Stuttgart, IAG. ' + ABGERUFEN + 'https://www.iag.uni-stuttgart.de/iag-intern/dokumente/PDF-Arbeitssicherheit/04-Pilz-Uni-Stgt.-27.10.2020-Risikoanalyse-und-Sicherheitskonzept.pdf'
    },
    {
      title: 'Regulation (EU) 2023/1230', author: 'DGUV Test', institution: 'Deutsche Gesetzliche Unfallversicherung (DGUV)',
      work: 'DGUV Test – Konformität von Produkten', year: 2024, type: 'Norm/Amtlich', minutes: 15,
      url: 'https://www.dguv.de/dguv-test/prod-testing-certi/conform-prod/machinery/eu-maschinenverordnung/index.jsp',
      why: 'Amtsnahe Übersicht zur Maschinenverordnung mit den Geltungsdaten.',
      apa: 'DGUV Test. (2024). *Regulation (EU) 2023/1230*. Deutsche Gesetzliche Unfallversicherung. ' + ABGERUFEN + 'https://www.dguv.de/dguv-test/prod-testing-certi/conform-prod/machinery/eu-maschinenverordnung/index.jsp'
    },
    {
      title: 'Sicherheit von Maschinen – Das Wichtigste zur Risikobeurteilung. Überblick über den Inhalt der EN ISO 12100', author: 'Suva', institution: 'Suva (Schweizerische Unfallversicherungsanstalt)',
      work: 'Suva Factsheet CE15-1', year: 2015, type: 'Norm/Amtlich', minutes: 15,
      url: 'https://www.suva.ch/de-ch/download/dokument/sicherheit-von-maschinen-br-das-wichtigste-zur-risikobeurteilung-br-ueberblick-ueber-den-inhalt-der-en-iso-12100--ce15-1.d',
      why: 'Kurzer, amtlicher Überblick über die Schritte der Risikobeurteilung.',
      apa: 'Suva. (2015). *Sicherheit von Maschinen – Das Wichtigste zur Risikobeurteilung* (CE15-1). ' + ABGERUFEN + 'https://www.suva.ch/de-ch/download/dokument/sicherheit-von-maschinen-br-das-wichtigste-zur-risikobeurteilung-br-ueberblick-ueber-den-inhalt-der-en-iso-12100--ce15-1.d'
    }
  ],
  quiz: [
    { type: 'single', q: 'Ab wann gilt die Maschinenverordnung (EU) 2023/1230 für das Inverkehrbringen von Maschinen?', options: ['29. Juni 2023', '14. Januar 2025', '20. Januar 2027', '1. Januar 2030'], correct: 2, explain: 'Die Verordnung wurde am 29.06.2023 veröffentlicht und gilt im Wesentlichen ab 20.01.2027; bis dahin gilt die Maschinenrichtlinie 2006/42/EG.' },
    { type: 'single', q: 'Welche Reihenfolge der Risikominderung sieht die 3-Stufen-Methode der EN ISO 12100 vor?', options: ['Benutzerinformation – technische Schutzmaßnahmen – Konstruktion', 'Inhärent sichere Konstruktion – technische Schutzmaßnahmen – Benutzerinformation', 'Technische Schutzmaßnahmen – Konstruktion – Benutzerinformation', 'Nur technische Schutzmaßnahmen'], correct: 1, explain: 'Zuerst Gefährdungen konstruktiv vermeiden, dann absichern (hier entstehen Sicherheitsfunktionen), erst zuletzt informieren und warnen.' },
    { type: 'multi', q: 'Wofür darf das Standardprogramm Statussignale der Sicherheitssteuerung verwenden?', options: ['Diagnosemeldungen am HMI', 'Ersatz der sicheren Abschaltung, wenn die SafeLOGIC ausfällt', 'Bedienführung, z. B. „Quittieren erforderlich“', 'Funktionales Stillsetzen von Antrieben vor der sicheren Abschaltung'], correct: [0, 2, 3], explain: 'Statussignale in der Standard-CPU sind nicht sicher. Sie dienen Diagnose, Bedienung und funktionalen Abläufen – die Abschaltung bleibt Aufgabe der Sicherheitssteuerung.' }
  ],
  exam: [
    { type: 'single', q: 'Wie wirkt eine EU-Verordnung im Unterschied zu einer EU-Richtlinie?', options: ['Sie muss erst in nationales Recht umgesetzt werden', 'Sie gilt unmittelbar in allen Mitgliedstaaten', 'Sie ist nur eine Empfehlung', 'Sie gilt nur für neue Mitgliedstaaten'], correct: 1, explain: 'Verordnungen gelten unmittelbar; Richtlinien müssen national umgesetzt werden (Maschinenrichtlinie in Deutschland über ProdSG/9. ProdSV).' },
    { type: 'single', q: 'Welcher Schritt gehört NICHT zur Risikobeurteilung nach EN ISO 12100?', options: ['Festlegung der Grenzen der Maschine', 'Identifizierung der Gefährdungen', 'Risikoeinschätzung und -bewertung', 'Berechnung der Zykluszeit der Standard-CPU'], correct: 3, explain: 'Die Risikobeurteilung umfasst Grenzen, Gefährdungsidentifikation, Risikoeinschätzung und Risikobewertung; die Zykluszeit ist ein Implementierungsdetail.' },
    { type: 'multi', q: 'Welche Lebensphasen musst du bei der Gefährdungsidentifikation betrachten?', options: ['Transport und Montage', 'Normalbetrieb', 'Reinigung und Instandhaltung', 'Nur den Automatikbetrieb'], correct: [0, 1, 2], explain: 'Die Risikobeurteilung betrachtet alle Lebensphasen – gerade bei Störungsbeseitigung und Wartung passieren viele Unfälle.' },
    { type: 'single', q: 'Eine Maschine wird am 25.01.2027 erstmals in Verkehr gebracht. Welcher Rechtsakt ist anzuwenden?', options: ['Maschinenrichtlinie 2006/42/EG', 'Maschinenverordnung (EU) 2023/1230', 'Beide wahlweise', 'Keiner, wenn die Maschine 2026 bestellt wurde'], correct: 1, explain: 'Maßgeblich ist das Inverkehrbringen; ab 20.01.2027 gilt die Verordnung.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Statussignale der Sicherheitssteuerung auswerten',
      task: ST_HINWEIS +
        'Die SafeLOGIC meldet der Standard-CPU vier nicht-sichere Statussignale. Schreibe im Programm `SafetyDiag` die Auswertung für das HMI:\n\n' +
        '- `doMachineReady` ist nur TRUE, wenn **alle** Signale TRUE sind (`diSafetyOK`, `diEStopReleased`, `diDoorClosed`, `diLightCurtainFree`).\n' +
        '- `nDiagCode` zeigt die **wichtigste** Ursache, Priorität von oben nach unten:\n' +
        '  - `1` = Not-Halt betätigt (`diEStopReleased = FALSE`)\n' +
        '  - `2` = Schutztür offen (`diDoorClosed = FALSE`)\n' +
        '  - `3` = Lichtgitter unterbrochen (`diLightCurtainFree = FALSE`)\n' +
        '  - `9` = SafetyOK fehlt, ohne dass eine der obigen Ursachen ansteht (Sammelstörung, z. B. Modulfehler)\n' +
        '  - `0` = alles in Ordnung\n' +
        '- Vertraue nicht nur `diSafetyOK`: Meldet die SafeLOGIC OK, aber die Tür ist offen, darf `doMachineReady` nicht TRUE sein (Plausibilität).',
      hints: ['Eine IF/ELSIF-Kette bildet die Priorität direkt ab.', '`doMachineReady := (nDiagCode = 0);` spart doppelte Logik.'],
      cycleMs: 10,
      io: [
        { name: 'diSafetyOK', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Sammelfreigabe', widget: 'switch', init: true },
        { name: 'diEStopReleased', type: 'BOOL', dir: 'in', label: 'Status Not-Halt entriegelt', widget: 'switch', init: true },
        { name: 'diDoorClosed', type: 'BOOL', dir: 'in', label: 'Status Schutztür geschlossen', widget: 'switch', init: true },
        { name: 'diLightCurtainFree', type: 'BOOL', dir: 'in', label: 'Status Lichtgitter frei', widget: 'switch', init: true },
        { name: 'doMachineReady', type: 'BOOL', dir: 'out', label: 'HMI: Maschine bereit', widget: 'led' },
        { name: 'nDiagCode', type: 'INT', dir: 'out', label: 'HMI: Diagnosecode', widget: 'value' }
      ],
      files: {
        main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Diagnosecode nach Priorität bilden *)\n\tdoMachineReady := diSafetyOK;\nEND_PROGRAM\n',
        var: 'VAR\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* Standard-SPS: reine Auswertung, keine Abschaltung *)
	IF NOT diEStopReleased THEN
		nDiagCode := 1;
	ELSIF NOT diDoorClosed THEN
		nDiagCode := 2;
	ELSIF NOT diLightCurtainFree THEN
		nDiagCode := 3;
	ELSIF NOT diSafetyOK THEN
		nDiagCode := 9;
	ELSE
		nDiagCode := 0;
	END_IF;
	doMachineReady := (nDiagCode = 0);
END_PROGRAM
`,
        var: 'VAR\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Alles in Ordnung', steps: [
          { set: { diSafetyOK: true, diEStopReleased: true, diDoorClosed: true, diLightCurtainFree: true } }, { cycles: 2 },
          { expect: 'doMachineReady AND nDiagCode = 0', msg: 'Bei allen Signalen TRUE muss die Maschine bereit sein und Code 0 melden.' }
        ]},
        { name: 'Not-Halt hat höchste Priorität', steps: [
          { set: { diSafetyOK: false, diEStopReleased: false, diDoorClosed: false } }, { cycles: 2 },
          { expect: 'nDiagCode = 1 AND NOT doMachineReady', msg: 'Not-Halt und offene Tür gleichzeitig: Code 1 erwartet.' }
        ]},
        { name: 'Tür und Lichtgitter einzeln', steps: [
          { set: { diSafetyOK: false, diDoorClosed: false } }, { cycles: 2 },
          { expect: 'nDiagCode = 2', msg: 'Offene Schutztür muss Code 2 liefern.' },
          { set: { diDoorClosed: true, diLightCurtainFree: false } }, { cycles: 2 },
          { expect: 'nDiagCode = 3 AND NOT doMachineReady', msg: 'Unterbrochenes Lichtgitter muss Code 3 liefern.' }
        ]},
        { name: 'Sammelstörung ohne erkennbare Ursache', steps: [
          { set: { diSafetyOK: false } }, { cycles: 2 },
          { expect: 'nDiagCode = 9 AND NOT doMachineReady', msg: 'SafetyOK fehlt bei sonst guten Signalen: Code 9 erwartet.' }
        ]},
        { name: 'Plausibilität: SafetyOK allein reicht nicht', steps: [
          { set: { diSafetyOK: true, diDoorClosed: false } }, { cycles: 2 },
          { expect: 'NOT doMachineReady AND nDiagCode = 2', msg: 'SafeLOGIC meldet OK, Tür ist aber offen – Standardprogramm darf nicht „bereit“ melden.' }
        ]}
      ]
    }
  ],
  proof: false
};

// ---------------------------------------------------------------------------
const m2 = {
  id: 'safety-3-sicherheitsfunktionen',
  level: 3,
  kind: 'lektion',
  title: 'Sicherheitsfunktionen und Stoppkategorien',
  summary: 'Not-Halt, Schutztür, Lichtgitter, Zweihand – und wie Stoppkategorie 0, 1 und 2 eine Maschine stillsetzen.',
  minutes: 150,
  req: ['safety-3-rechtsrahmen'],
  briefing: 'Aus der Risikobeurteilung entstehen konkrete Sicherheitsfunktionen. Die wichtigsten an Fertigungsmaschinen sind der Not-Halt (EN ISO 13850) als ergänzende Schutzmaßnahme, die Schutztürüberwachung (verriegelnde Trennende Schutzeinrichtung, EN ISO 14119), berührungslos wirkende Schutzeinrichtungen wie Lichtgitter (Sicherheitsabstand nach EN ISO 13855) und die Zweihandschaltung (EN ISO 13851). ' +
    'Jede Sicherheitsfunktion endet in einem Stopp – und die EN 60204-1 unterscheidet Stoppkategorie 0 (sofortiges Abschalten der Energie), 1 (gesteuertes Stillsetzen, danach Energie weg) und 2 (gesteuertes Stillsetzen, Energie bleibt). ' +
    'Auf der Standard-SPS-Seite kümmerst du dich um Quittierung, Wiederanlaufsperre und verständliche Meldungen.' + HINWEIS,
  practice: 'Ein Bediener drückt Not-Halt, entriegelt den Taster und erwartet, dass die Maschine erst nach Quittieren und erneutem Start wieder anläuft. Genau dieses Verhalten prüft jeder Abnahmeingenieur zuerst.',
  transfer: {
    tia: 'In STEP 7 Safety heißen die Bausteine ESTOP1 (Not-Halt bis Stoppkategorie 1), SFDOOR (Schutztür), TWO_HAND; quittiert wird über ACK_GL bzw. den ACK-Eingang. Die Wiederanlaufsperre ist dort ebenfalls Teil des Bausteins.',
    codesys: 'CODESYS Safety und TwinSAFE nutzen die PLCopen-Bausteine SF_EmergencyStop, SF_GuardMonitoring, SF_ESPE, SF_TwoHandControlTypeII/III – wie im B&R SafeDESIGNER.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Unterscheide Not-Halt und Not-Aus und ordne die Stoppkategorie zu',
      guide: {
        intro: 'Not-Halt (Emergency Stop) setzt eine gefährliche Bewegung still, Not-Aus (Emergency Switching Off) schaltet elektrische Energie bei elektrischen Gefährdungen ab.',
        steps: [
          'Lies in der BG-RCI-Broschüre den Abschnitt zu den Begriffen Not-Halt und Not-Aus.',
          'Notiere: Not-Halt ist eine **ergänzende Schutzmaßnahme** und ersetzt keine Schutzeinrichtung; er muss nach EN ISO 13850 als Stoppkategorie 0 oder 1 wirken.',
          'Zeichne für einen Servoantrieb den Geschwindigkeitsverlauf für Stopp 0 (Antrieb trudelt aus bzw. wird mechanisch gebremst), Stopp 1 (Rampe bis Stillstand, dann Energie weg) und Stopp 2 (Rampe, Energie bleibt, Stillstand wird überwacht).',
          'Begründe für eine schwere vertikale Achse, warum Stopp 1 mit Haltebremse sinnvoller ist als Stopp 0 ohne Bremse.',
          'Halte fest: Das Entriegeln des Not-Halt-Tasters darf **keinen** Wiederanlauf auslösen; dafür ist eine separate, bewusste Rückstellung nötig.'
        ],
        done: 'Erledigt, wenn du zu drei Beispielmaschinen (Förderband, Presse, Hubachse) eine begründete Stoppkategorie für den Not-Halt angeben kannst.',
        tip: 'Stoppkategorie 2 ist für den Not-Halt nicht zulässig, weil die Energie anliegt – sie ist aber typisch für Betriebsstopps und sichere Stillstandsüberwachung.',
        link: { label: 'BG RCI: NOT-HALT-Befehlsgeräte', url: 'https://www.bgrci.de/fileadmin/BGRCI/Downloads/DL_Praevention/Fachwissen/Maschinensicherheit/2024-01-28_NOT-HALT-Befehlsger%C3%A4te_BG_RCI_aktuell.pdf' }
      }
    },
    {
      id: 'o2',
      title: 'Lerne die Schutzeinrichtungen Tür, Lichtgitter und Zweihand kennen',
      guide: {
        intro: 'Schutzeinrichtungen verhindern, dass Personen den Gefahrbereich während einer gefährlichen Bewegung erreichen.',
        steps: [
          '**Schutztür:** Ein Verriegelungsschalter meldet „geschlossen“. Mit **Zuhaltung** bleibt die Tür verschlossen, bis die gefährliche Bewegung beendet ist (z. B. nachlaufende Spindel).',
          '**Lichtgitter:** Der Sicherheitsabstand S berechnet sich nach EN ISO 13855 vereinfacht als S = K · T + C mit Annäherungsgeschwindigkeit K, Gesamtnachlaufzeit T und Zuschlag C abhängig von der Auflösung.',
          '**Zweihandschaltung:** Beide Taster müssen innerhalb von 0,5 s betätigt und während der gefährlichen Bewegung gehalten werden; Typ III verlangt zusätzlich, dass beide losgelassen werden, bevor neu gestartet wird.',
          'Öffne in der B&R-Hilfe die Bausteinübersicht der Bibliothek PLCopen_SF und suche die zugehörigen Bausteine `SF_GuardMonitoring`, `SF_ESPE`, `SF_TwoHandControlTypeIII`.',
          'Ordne in deiner Risikobeurteilung aus dem vorigen Modul jeder technischen Maßnahme eine dieser Sicherheitsfunktionen zu.'
        ],
        done: 'Erledigt, wenn jede Sicherheitsfunktion deiner Tabelle einen Sensor, einen PLCopen-Baustein und eine Stoppkategorie hat.',
        tip: 'Den Nachlauf misst du an der realen Maschine nach – Datenblattwerte allein reichen für den Sicherheitsabstand nicht.',
        link: { label: 'B&R Help: PLCopen_SF – Funktionsbausteine', url: brHelp('safety/mapp_safety/programming/safedesigner_lib/plcopen_sf/fbks/fbks.html') }
      }
    },
    {
      id: 'o3',
      title: 'Implementiere Quittierung und Wiederanlaufsperre auf der Standard-Seite',
      guide: {
        intro: 'Die Sicherheitssteuerung verlangt nach dem Rückstellen eines Not-Halts eine Reset-Flanke. Die Standard-SPS liefert diese Flanke kontrolliert und sorgt dafür, dass die Maschine nicht von selbst anläuft.',
        steps: [
          'Lege im Programm `SafetyDiag` eine Instanz `rtAck : R_TRIG;` für den Quittiertaster an.',
          'Gib die Reset-Anforderung nur bei steigender Flanke und nur dann aus, wenn alle Schutzeinrichtungen wieder in Ordnung sind und die SafeLOGIC tatsächlich auf Quittierung wartet.',
          'Forme die Anforderung mit einem `TP` zu einem kurzen Puls (z. B. 100 ms). Ein Dauer-TRUE erkennt der PLCopen-Baustein als Fehler.',
          'Setze den Antrieb nach Rückkehr der Freigabe nicht automatisch ein: Erst eine neue Start-Flanke startet die Maschine (Wiederanlaufsperre).',
          'Teste in der Simulation: Not-Halt drücken, entriegeln, Taster festhalten – es darf keine Quittierung erfolgen.'
        ],
        code: { lang: 'st', text: 'rtAck(CLK := diAckButton);\ntpReset(IN := rtAck.Q AND bResetAllowed, PT := T#100ms);\ndoResetRequest := tpReset.Q;' },
        done: 'Erledigt, wenn die Übung „Quittierung mit Flanke und Wiederanlaufsperre“ alle Tests besteht.',
        tip: 'Die Reset-Taste ist ein Befehlsgerät außerhalb des Gefahrbereichs mit Sicht auf den Gefahrbereich – das klärt der Konstrukteur, du prüfst es bei der Inbetriebnahme.',
        link: { label: 'B&R Help: SF_EmergencyStop – Reset', url: brHelp('safety/mapp_safety/programming/safedesigner_lib/plcopen_sf/fbks/sf_emergencystop/reset_s_startreset_s_autoreset.html') }
      }
    }
  ],
  videos: [
    { id: 'rqQNYICWOnQ', title: 'Was ist der Unterschied zwischen Not-Halt und Not-Aus?', channel: 'Dirk Leitsch', lang: 'de', why: 'Klärt die oft verwechselten Begriffe Not-Halt und Not-Aus.' },
    { id: 'UMcIks8Mq6o', title: 'Not-Halt-Funktion am Förderband', channel: 'Siemens Knowledge Hub', lang: 'de', why: 'Zeigt eine Not-Halt-Funktion mit Quittierung an einer konkreten Anlage.' },
    { id: 'HYsjkDcimrI', title: 'Sicherheitsabstand und Nachlaufmessung', channel: 'Maschinensicherheit', lang: 'de', why: 'Erklärt, warum der Nachlauf den Sicherheitsabstand von Schutzeinrichtungen bestimmt.' }
  ],
  readings: [
    {
      title: 'NOT-HALT-Befehlsgeräte', author: 'BG RCI', institution: 'Berufsgenossenschaft Rohstoffe und chemische Industrie',
      work: 'Fachwissen Maschinensicherheit', year: 2024, type: 'Norm/Amtlich', minutes: 30,
      url: 'https://www.bgrci.de/fileadmin/BGRCI/Downloads/DL_Praevention/Fachwissen/Maschinensicherheit/2024-01-28_NOT-HALT-Befehlsger%C3%A4te_BG_RCI_aktuell.pdf',
      why: 'Unfallversicherungsträger erklärt Begriffe, Anforderungen und typische Fehler beim Not-Halt.',
      apa: 'BG RCI. (2024). *NOT-HALT-Befehlsgeräte*. Berufsgenossenschaft Rohstoffe und chemische Industrie. ' + ABGERUFEN + 'https://www.bgrci.de/fileadmin/BGRCI/Downloads/DL_Praevention/Fachwissen/Maschinensicherheit/2024-01-28_NOT-HALT-Befehlsger%C3%A4te_BG_RCI_aktuell.pdf'
    },
    {
      title: 'Sicherheit von Maschinen – Das Wichtigste zur Risikominderung. Überblick über den Inhalt der EN ISO 12100', author: 'Suva', institution: 'Suva (Schweizerische Unfallversicherungsanstalt)',
      work: 'Suva Factsheet CE14-2', year: 2015, type: 'Norm/Amtlich', minutes: 15,
      url: 'https://www.suva.ch/de-ch/download/factsheets/sicherheit-von-maschinen---das-wichtigste-zur-risikominderung--ueberblick-ueber-den-inhalt-der-en-iso-12100--ce14-2.d',
      why: 'Ordnet trennende und nicht trennende Schutzeinrichtungen in die Risikominderung ein.',
      apa: 'Suva. (2015). *Sicherheit von Maschinen – Das Wichtigste zur Risikominderung* (CE14-2). ' + ABGERUFEN + 'https://www.suva.ch/de-ch/download/factsheets/sicherheit-von-maschinen---das-wichtigste-zur-risikominderung--ueberblick-ueber-den-inhalt-der-en-iso-12100--ce14-2.d'
    },
    brReading('SF_EmergencyStop – Funktion', 'safety/mapp_safety/programming/safedesigner_lib/plcopen_sf/fbks/sf_emergencystop/funktion.html', 'Beschreibt Betätigen, Entriegeln und die optionale Anlaufsperre des Not-Halt-Bausteins im SafeDESIGNER.', 15)
  ],
  quiz: [
    { type: 'single', q: 'Welche Stoppkategorie beschreibt „gesteuertes Stillsetzen, danach wird die Energie unterbrochen“?', options: ['Stoppkategorie 0', 'Stoppkategorie 1', 'Stoppkategorie 2', 'Stoppkategorie 3'], correct: 1, explain: 'Stopp 1: Bremsen an der Rampe bis zum Stillstand, dann Energie weg (bei Antrieben z. B. SS1 → STO).' },
    { type: 'numeric', q: 'Ein Lichtgitter mit Auflösung d = {d} mm hat eine Gesamtnachlaufzeit T = {T} ms. Berechne den Sicherheitsabstand vereinfacht mit S = 2000 mm/s · T + 8 · (d − 14) mm (Annahme: Ergebnis ≤ 500 mm).',
      params: { d: [14, 30, 2], T: [50, 150, 10] }, formula: '2000 * T / 1000 + 8 * (d - 14)', unit: 'mm', tol: 0.02,
      explain: 'T in Sekunden umrechnen: S = 2000 · T/1000 + 8 · (d − 14). Bei T = 100 ms und d = 14 mm ergibt das 200 mm.' },
    { type: 'single', q: 'Der Not-Halt wurde entriegelt. Was muss als Nächstes passieren?', options: ['Die Maschine läuft automatisch wieder an', 'Eine bewusste Rückstellung (Quittierung) ist erforderlich, der Start erfolgt danach separat', 'Die Steuerung muss neu gestartet werden', 'Nichts – der Not-Halt ist nur eine Meldung'], correct: 1, explain: 'Das Entriegeln allein darf keinen Wiederanlauf auslösen (EN ISO 13850). Quittieren und Starten sind getrennte Handlungen.' }
  ],
  exam: [
    { type: 'single', q: 'Warum muss die Reset-Anforderung an die Sicherheitssteuerung flankengesteuert sein?', options: ['Damit die CPU-Last sinkt', 'Weil ein klemmender Taster oder ein Dauersignal sonst unbemerkt eine Quittierung auslösen würde', 'Weil SafeDESIGNER keine BOOL-Signale kennt', 'Das ist nur eine Stilfrage'], correct: 1, explain: 'Die PLCopen-Bausteine werten nur steigende Flanken aus und erkennen statisches TRUE als Fehler (z. B. DiagCode C001/C002).' },
    { type: 'single', q: 'Welche Zweihandschaltung verlangt, dass beide Taster losgelassen werden, bevor erneut gestartet werden kann, und dass beide innerhalb von 0,5 s betätigt werden?', options: ['Typ I', 'Typ II', 'Typ III', 'Typ IV'], correct: 2, explain: 'Typ III ergänzt die Anforderungen von Typ II um die Synchronbetätigung innerhalb 0,5 s.' },
    { type: 'multi', q: 'Welche Aussagen zum Not-Halt sind richtig?', options: ['Er ist eine ergänzende Schutzmaßnahme', 'Er ersetzt eine Schutztür', 'Er wirkt als Stoppkategorie 0 oder 1', 'Er muss eindeutig erkennbar und schnell erreichbar sein'], correct: [0, 2, 3], explain: 'Not-Halt ergänzt Schutzeinrichtungen, ersetzt sie aber nie. Stoppkategorie 2 ist nicht zulässig.' },
    { type: 'single', q: 'Wozu dient eine Zuhaltung an einer Schutztür?', options: ['Sie hält die Tür geschlossen, bis die gefährliche Bewegung beendet ist', 'Sie ersetzt den Verriegelungsschalter', 'Sie dient nur dem Diebstahlschutz', 'Sie erhöht die Taktzeit'], correct: 0, explain: 'Bei Nachlauf (z. B. Spindel) muss die Tür zugehalten werden, bis keine Gefährdung mehr besteht.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Quittierung mit Flanke und Wiederanlaufsperre',
      task: ST_HINWEIS +
        'Die Anlagen-Simulation bildet die SafeLOGIC nach: Ist Not-Halt oder Schutztür nicht in Ordnung, fällt `diSafetyOK`. Nach dem Rückstellen kehrt `diSafetyOK` erst zurück, wenn die Standard-SPS eine **steigende Flanke** an `doResetRequest` ausgibt.\n\n' +
        'Anforderungen an dein Programm:\n' +
        '1. `doResetRequest` wird nur bei **steigender Flanke** von `diAckButton` ausgegeben – und nur, wenn `diEStopReleased` und `diDoorClosed` TRUE sind und `diSafetyOK` FALSE ist (es gibt etwas zu quittieren).\n' +
        '2. `doResetRequest` ist ein **Puls von 100 ms**, auch wenn der Taster länger gedrückt wird.\n' +
        '3. **Wiederanlaufsperre:** `doMotor` wird nur durch eine steigende Flanke von `diStart` eingeschaltet und nur, wenn `diSafetyOK` TRUE ist. Fällt `diSafetyOK` oder wird `diStop` (Öffner) betätigt, geht `doMotor` sofort aus und bleibt aus – auch nach erfolgreicher Quittierung.\n' +
        '4. Ein dauerhaft gedrückter Start-Taster darf nach der Quittierung **keinen** Anlauf auslösen.',
      hints: ['Verwende `R_TRIG` für Quittier- und Start-Taster und rufe die Instanzen in jedem Zyklus auf.', 'Ein `TP` mit `PT := T#100ms` formt den Reset-Puls.', 'Ausschalten hat Vorrang: Prüfe zuerst `NOT diSafetyOK OR NOT diStop`.'],
      cycleMs: 10,
      io: [
        { name: 'diEStopReleased', type: 'BOOL', dir: 'in', label: 'Not-Halt entriegelt', widget: 'switch', init: true },
        { name: 'diDoorClosed', type: 'BOOL', dir: 'in', label: 'Schutztür geschlossen', widget: 'switch', init: true },
        { name: 'diAckButton', type: 'BOOL', dir: 'in', label: 'Quittiertaster S3', widget: 'button' },
        { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start-Taster S1', widget: 'button' },
        { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Stopp-Taster S2 (Öffner)', widget: 'switch', init: true },
        { name: 'diSafetyOK', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Freigabe (simuliert)', widget: 'led' },
        { name: 'doResetRequest', type: 'BOOL', dir: 'out', label: 'Reset-Anforderung an SafeLOGIC', widget: 'led' },
        { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Band-Freigabe (funktional)', widget: 'led' }
      ],
      scene: { type: 'conveyor', bind: { motor: 'doMotor' } },
      plant: {
        var: 'VAR\n\tbResetOld : BOOL;\nEND_VAR\n',
        code: `IF NOT diEStopReleased OR NOT diDoorClosed THEN
	diSafetyOK := FALSE;
ELSIF doResetRequest AND NOT bResetOld THEN
	diSafetyOK := TRUE;
END_IF;
bResetOld := doResetRequest;`
      },
      files: {
        main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Flanken, Reset-Puls, Wiederanlaufsperre *)\n\tdoResetRequest := diAckButton;\n\tdoMotor := diSafetyOK AND diStart;\nEND_PROGRAM\n',
        var: 'VAR\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	rtAck(CLK := diAckButton);
	rtStart(CLK := diStart);

	(* Quittierung nur, wenn es etwas zu quittieren gibt und alles in Ordnung ist *)
	bResetAllowed := diEStopReleased AND diDoorClosed AND NOT diSafetyOK;
	tpReset(IN := rtAck.Q AND bResetAllowed, PT := T#100ms);
	doResetRequest := tpReset.Q;

	(* Wiederanlaufsperre: Ausschalten hat Vorrang, Einschalten nur per Flanke *)
	IF NOT diSafetyOK OR NOT diStop THEN
		doMotor := FALSE;
	ELSIF rtStart.Q THEN
		doMotor := TRUE;
	END_IF;
END_PROGRAM
`,
        var: 'VAR\n\trtAck : R_TRIG;\n\trtStart : R_TRIG;\n\ttpReset : TP;\n\tbResetAllowed : BOOL;\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Quittierung erst nach Entriegeln', steps: [
          { set: { diEStopReleased: false } }, { cycles: 2 },
          { set: { diAckButton: true } }, { cycles: 3 },
          { expect: 'NOT doResetRequest', msg: 'Bei betätigtem Not-Halt darf keine Reset-Anforderung ausgegeben werden.' },
          { set: { diAckButton: false, diEStopReleased: true } }, { cycles: 3 },
          { expect: 'NOT diSafetyOK', msg: 'Nach dem Entriegeln darf die Freigabe nicht ohne Quittierung zurückkehren.' },
          { set: { diAckButton: true } }, { cycles: 4 },
          { expect: 'diSafetyOK', msg: 'Nach Quittierung (Flanke) muss die SafeLOGIC wieder freigeben.' }
        ]},
        { name: 'Dauersignal am Quittiertaster quittiert nicht', steps: [
          { set: { diDoorClosed: false, diAckButton: true } }, { cycles: 5 },
          { set: { diDoorClosed: true } }, { ms: 500 },
          { expect: 'NOT diSafetyOK', msg: 'Ein festgehaltener Quittiertaster darf beim Schließen der Tür keine Quittierung auslösen.' }
        ]},
        { name: 'Reset ist ein kurzer Puls', steps: [
          { set: { diAckButton: true } },
          { until: 'doResetRequest', maxMs: 100, msg: 'Quittiertaster löst keine Reset-Anforderung aus.' },
          { ms: 300 },
          { expect: 'NOT doResetRequest', msg: 'Die Reset-Anforderung muss nach ca. 100 ms enden, auch wenn der Taster gehalten wird.' }
        ]},
        { name: 'Wiederanlaufsperre nach Quittierung', steps: [
          { set: { diAckButton: true } }, { cycles: 4 }, { set: { diAckButton: false } }, { cycles: 2 },
          { expect: 'diSafetyOK AND NOT doMotor', msg: 'Nach der Quittierung darf das Band nicht von selbst laufen.' },
          { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { expect: 'doMotor', msg: 'Start-Flanke bei Freigabe muss das Band einschalten.' },
          { set: { diDoorClosed: false } }, { cycles: 3 },
          { expect: 'NOT doMotor', msg: 'Offene Tür (Freigabe weg) muss das Band ausschalten.' },
          { set: { diDoorClosed: true } }, { cycles: 2 },
          { set: { diAckButton: true } }, { cycles: 4 }, { set: { diAckButton: false } },
          { never: 'doMotor', ms: 300, msg: 'Nach erneuter Quittierung darf das Band nicht von selbst anlaufen.' }
        ]},
        { name: 'Gehaltener Start-Taster startet nicht', steps: [
          { set: { diStart: true } }, { cycles: 3 },
          { expect: 'NOT doMotor', msg: 'Ohne Freigabe darf der Start nichts bewirken.' },
          { set: { diAckButton: true } }, { cycles: 4 }, { set: { diAckButton: false } },
          { never: 'doMotor', ms: 300, msg: 'Ein dauerhaft gedrückter Start-Taster darf nach der Quittierung keinen Anlauf auslösen.' }
        ]},
        { name: 'Stopp-Taster schaltet aus', steps: [
          { set: { diAckButton: true } }, { cycles: 4 }, { set: { diAckButton: false } },
          { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
          { set: { diStop: false } }, { cycles: 2 },
          { expect: 'NOT doMotor', msg: 'Stopp-Taster (Öffner) muss das Band ausschalten.' },
          { set: { diStop: true } },
          { never: 'doMotor', ms: 200, msg: 'Nach Loslassen des Stopp-Tasters darf das Band nicht wieder anlaufen.' }
        ]}
      ]
    }
  ],
  proof: false
};

// ---------------------------------------------------------------------------
const m3 = {
  id: 'safety-3-projekt-schnittstelle',
  level: 3,
  kind: 'projekt',
  title: 'Praxisprojekt: Standard-SPS an der Sicherheits-SPS',
  summary: 'Ein Förderband mit vollständigem Zustandsautomat für Quittierung, Wiederanlaufsperre, Plausibilitäts- und Quittierüberwachung.',
  minutes: 240,
  req: ['safety-3-sicherheitsfunktionen'],
  briefing: 'Eine Sicherheits-SPS (bei B&R die SafeLOGIC bzw. SafeLOGIC-X) ist nach IEC 61508 entwickelt, zertifiziert und arbeitet mit sicheren Datentypen (SAFEBOOL), Selbsttests und einem eigenen, geschützten Programm. Eine Standard-SPS hat das alles nicht – deshalb ist sie nicht für Sicherheitsfunktionen gedacht. ' +
    'In der Praxis arbeiten beide eng zusammen: Die SafeLOGIC schaltet ab, die Standard-SPS führt den Bediener, stoppt funktional, quittiert kontrolliert und erkennt Unstimmigkeiten. ' +
    'In diesem Projekt baust du die komplette Standard-Seite eines Förderbands als Zustandsautomat mit Fehlerbehandlung.' + HINWEIS,
  practice: 'An jeder B&R-Maschine mit mapp Safety existiert ein Standardprogramm, das genau diese Schnittstelle bedient. Fehler darin sind keine Sicherheitslücken, aber sie machen eine Maschine unbedienbar oder verschleiern die Störungsursache.',
  transfer: {
    tia: 'In TIA Portal entspricht das dem Zusammenspiel von F-CPU-Programm und Standard-OBs; der Standard liest z. B. QBAD/PASS_OUT-Signale und sendet ACK_REI-Anforderungen.',
    codesys: 'In TwinCAT liest das Standardprojekt Diagnose der TwinSAFE-Gruppe (z. B. Group State) und gibt ErrAck-Signale als nicht-sichere Eingänge an die Gruppe.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Vergleiche Standard-SPS und Sicherheits-SPS',
      guide: {
        intro: 'Bevor du die Schnittstelle programmierst, musst du die Unterschiede beider Steuerungen begründen können.',
        steps: [
          'Lies in der B&R-Hilfe die Einführung zum SafeDESIGNER: Er basiert auf IEC 61131-3 und erfüllt die Anforderungen der IEC 61508 an den Entwicklungsprozess.',
          'Notiere die Unterschiede: zertifizierte Hardware mit Selbsttests und Fehleraufdeckung, sichere Datentypen (SAFEBOOL, SAFEINT), eingeschränkter Sprachumfang, Passwortschutz und Prüfsummen, sichere Kommunikation über openSAFETY.',
          'Lies die Seite „Zustände (Status) der Sicherheitssteuerung“ und schreibe die Zustände RUN [Sicher], Stop [Debug] usw. mit Bedeutung heraus.',
          'Erstelle eine Schnittstellenliste: Welche Signale liest die Standard-SPS (Status), welche schreibt sie (z. B. Reset-Anforderung als nicht-sicheres BOOL)?',
          'Lege die Liste als `Docs/Safety-Schnittstelle.md` in deinem Projekt-Repository ab.'
        ],
        done: 'Erledigt, wenn deine Schnittstellenliste jede Variable mit Richtung, Datentyp und Bedeutung enthält.',
        tip: 'Reset-Signale aus der Standard-SPS sind erlaubt, weil der PLCopen-Baustein Flanken prüft und ein unbeabsichtigter Reset allein keine gefährliche Bewegung auslöst – der Start bleibt eine eigene Handlung.',
        link: { label: 'B&R Help: SafeDESIGNER – Einführung', url: brHelp('safety/mapp_safety/programming/safedesigner/intro/intro.html') }
      }
    },
    {
      id: 'o2',
      title: 'Entwirf den Zustandsautomaten',
      guide: {
        intro: 'Ein Zustandsautomat macht die Bedienlogik testbar und verständlich.',
        steps: [
          'Definiere in `Types.typ` einen Enum `eMachineState : (ST_WAIT_ACK, ST_READY, ST_RUN, ST_FAULT);`.',
          'Zeichne die Übergänge: WAIT_ACK → READY (Freigabe da), READY → RUN (Start-Flanke), RUN → READY (Stopp), RUN/READY → WAIT_ACK (Freigabe weg), jeder Zustand → FAULT (unplausibel).',
          'Lege fest, welche Ausgänge in welchem Zustand aktiv sind (Motor nur in RUN, Leuchtmelder „Quittieren“ nur in WAIT_ACK bei quittierbarer Lage).',
          'Definiere Diagnosecodes: 1 Not-Halt, 2 Tür, 9 Quittierung erforderlich, 90 Statussignale unplausibel, 91 Quittierung ohne Wirkung.',
          'Schreibe die Übergänge als `CASE eState OF … END_CASE` und rufe alle Timer und Flankenbausteine außerhalb des CASE auf.'
        ],
        done: 'Erledigt, wenn dein Zustandsdiagramm alle Übergänge der Aufgabenstellung enthält und mit dem Code übereinstimmt.',
        tip: 'Timer und R_TRIG innerhalb eines CASE-Zweigs laufen nur, wenn der Zweig aktiv ist – ein häufiger Grund für „hängende“ Timer.'
      }
    },
    {
      id: 'o3',
      title: 'Programmiere Überwachungen und teste sie',
      guide: {
        intro: 'Die Standard-SPS kann Unstimmigkeiten erkennen und verständlich melden, auch wenn sie selbst nichts sicher abschaltet.',
        steps: [
          'Plausibilität: Meldet `diSafetyOK` TRUE, obwohl Not-Halt oder Tür nicht in Ordnung sind, und hält das länger als 200 ms an, wechsle nach ST_FAULT (Code 90).',
          'Quittierüberwachung: Kommt nach einer Reset-Anforderung innerhalb von 1 s keine Freigabe, melde Code 91.',
          'Nutze die Simulationsschalter `simResetIgnored` und `simStuckOK`, um beide Fehlerbilder auszulösen.',
          'Lass die automatischen Tests laufen und korrigiere, bis alle bestehen.',
          'Committe Code und Schnittstellenbeschreibung in dein Repository und reiche den Link als Nachweis ein.'
        ],
        done: 'Erledigt, wenn alle Tests der Projektübung bestehen und dein Nachweis-Link eingereicht ist.',
        tip: 'Ein FAULT-Zustand sollte nur durch eine bewusste Handlung (Quittierung) verlassen werden – nie automatisch, sonst übersieht man sporadische Fehler.'
      }
    }
  ],
  videos: [
    { id: 'aXjAA3NJEBo', title: 'Virtuelle SPS und Safety-SPS', channel: 'Beckhoff Automation Deutschland', lang: 'de', why: 'Erklärt herstellerneutral, warum Sicherheitssteuerungen anders aufgebaut sind als Standard-Steuerungen.' },
    { id: 'F54YknFVz58', title: 'From Safety Relay To Intelligent Safety With X20 Safety Controller I B&R Automation', channel: 'AutoMates', lang: 'en', why: 'Zeigt den Weg vom Sicherheitsschaltgerät zur X20-Sicherheitssteuerung.' },
    { id: 'XpicjwJDsRI', title: 'SafeLOGIC X', channel: 'B&R Industrial Automation', lang: 'en', why: 'B&R stellt die kompakte Sicherheitssteuerung SafeLOGIC-X vor.' }
  ],
  readings: [
    brReading('SafeDESIGNER – Einführung', 'safety/mapp_safety/programming/safedesigner/intro/intro.html', 'Grundlagen des Werkzeugs für sichere Anwendungen: IEC 61131-3, IEC 61508, PLCopen-Bausteine, Anwenderverwaltung.', 15),
    brReading('Zustände (Status) der Sicherheitssteuerung', 'safety/mapp_safety/programming/safedesigner/safety-controler-start-up/zustande_sicherheitssteuerung.html', 'Welche Zustände eine SafeLOGIC einnehmen kann und was sie für die Inbetriebnahme bedeuten.', 15)
  ],
  quiz: [
    { type: 'single', q: 'Warum sollte ein Timer (TON) nicht nur innerhalb eines CASE-Zweigs aufgerufen werden?', options: ['Weil TON in CASE verboten ist', 'Weil er dann nur in diesem Zustand aktualisiert wird und beim Verlassen seinen Zustand „einfriert“', 'Weil das die Zykluszeit verdoppelt', 'Das ist unproblematisch'], correct: 1, explain: 'Ein nicht aufgerufener FB wird nicht aktualisiert. Das gilt übrigens auch im SafeDESIGNER (Best practice: FBs nicht in bedingten Anweisungen aufrufen).' },
    { type: 'multi', q: 'Was unterscheidet eine Sicherheits-SPS von einer Standard-SPS?', options: ['Entwicklung und Zertifizierung nach IEC 61508', 'Sichere Datentypen wie SAFEBOOL', 'Höhere Taktfrequenz', 'Selbsttests zur Fehleraufdeckung und definierter sicherer Zustand'], correct: [0, 1, 3], explain: 'Die Taktfrequenz ist kein Sicherheitsmerkmal. Entscheidend sind Entwicklungsprozess, Fehleraufdeckung und sichere Datenhaltung.' },
    { type: 'single', q: 'Die SafeLOGIC meldet „Freigabe“, obwohl der Not-Halt gedrückt ist. Wie reagiert dein Standardprogramm sinnvoll?', options: ['Ignorieren, die SafeLOGIC hat immer recht', 'Nach kurzer Toleranzzeit in einen Fehlerzustand wechseln, Motor funktional aus, Meldung „unplausibel“', 'Den Not-Halt im Standardprogramm überbrücken', 'Die SafeLOGIC neu starten'], correct: 1, explain: 'Die Standard-SPS kann Unplausibilitäten erkennen und melden. Ursache klären (Verdrahtung, Programm) – nie überbrücken.' }
  ],
  exam: [
    { type: 'single', q: 'Welche Rolle hat die Standard-SPS beim Not-Halt einer B&R-Maschine mit SafeLOGIC?', options: ['Sie schaltet die Antriebe sicher ab', 'Sie wertet Status aus, führt den Bediener und stoppt funktional; die sichere Abschaltung macht die SafeLOGIC', 'Sie hat keine Rolle', 'Sie ersetzt die SafeLOGIC bei Kommunikationsausfall'], correct: 1, explain: 'Sicherheitsfunktion = SafeLOGIC + sichere I/O. Die Standard-SPS ergänzt Bedienung und Diagnose.' },
    { type: 'single', q: 'Warum darf ein Fehlerzustand „Statussignale unplausibel“ nicht automatisch verlassen werden?', options: ['Weil sporadische Fehler sonst unbemerkt bleiben', 'Weil der Speicher sonst überläuft', 'Weil das gegen IEC 61131-3 verstößt', 'Weil HMI-Meldungen sonst nicht angezeigt werden'], correct: 0, explain: 'Eine bewusste Quittierung erzwingt, dass jemand die Meldung wahrnimmt und die Ursache prüft.' },
    { type: 'multi', q: 'Welche Signale gehören typischerweise in die Schnittstelle Standard-SPS ↔ SafeLOGIC?', options: ['Freigabestatus der Sicherheitsfunktionen (lesen)', 'Reset-/Quittieranforderung (schreiben, nicht sicher)', 'Sichere Abschaltbefehle an STO-Eingänge (schreiben)', 'SafeModuleOK der SafeNODEs (lesen)'], correct: [0, 1, 3], explain: 'Sichere Abschaltbefehle kommen ausschließlich aus der SafeLOGIC über openSAFETY bzw. sichere Ausgänge.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Förderband mit Sicherheits-Zustandsautomat',
      task: ST_HINWEIS +
        'Programmiere die Standard-Seite eines Förderbands als Zustandsautomat (`eMachineState` in `Types.typ`). Die Simulation bildet die SafeLOGIC nach (Reset per Flanke an `doResetRequest`).\n\n' +
        '**Zustände und Ausgänge**\n' +
        '- `ST_WAIT_ACK` (Startzustand): `doMotor = FALSE`. `doLampAck` leuchtet, wenn Not-Halt entriegelt, Tür zu und `diSafetyOK = FALSE` (quittierbar). Steigende Flanke an `diAck` in dieser Lage → `doResetRequest` als 100-ms-Puls. Ist `diSafetyOK` TRUE und sind Not-Halt/Tür in Ordnung → `ST_READY`, `nDiagCode := 0`.\n' +
        '- `ST_READY`: Start-Flanke an `diStart` bei `diStop = TRUE` → `ST_RUN`. Fällt `diSafetyOK` → `ST_WAIT_ACK`.\n' +
        '- `ST_RUN`: `doMotor = TRUE`. `diStop = FALSE` → `ST_READY`; `diSafetyOK = FALSE` → `ST_WAIT_ACK`. Motor sofort aus.\n' +
        '- `ST_FAULT`: `doMotor = FALSE`, `nDiagCode = 90`. Verlassen nur mit Quittier-Flanke, wenn die Signale wieder plausibel sind → `ST_WAIT_ACK`.\n\n' +
        '**Diagnose in `ST_WAIT_ACK`:** `1` Not-Halt betätigt, `2` Tür offen, sonst `9` (Quittierung erforderlich). Ausnahme: Ein anstehender Code `91` bleibt stehen, bis erneut quittiert wird.\n\n' +
        '**Überwachungen**\n' +
        '- Plausibilität: `diSafetyOK = TRUE`, obwohl Not-Halt betätigt oder Tür offen, länger als **200 ms** → `ST_FAULT` (aus jedem Zustand).\n' +
        '- Quittierüberwachung: Nach einer Quittierung muss `diSafetyOK` innerhalb von **1 s** kommen, sonst `nDiagCode := 91`.\n\n' +
        'Simulationsschalter: `simResetIgnored` (SafeLOGIC nimmt Reset nicht an), `simStuckOK` (Freigabesignal „klebt“ auf TRUE).',
      hints: ['Alle FBs (R_TRIG, TP, TON) außerhalb des CASE aufrufen. Ein Hilfs-BOOL `bResetTrig` wird im CASE gesetzt und danach an den TP übergeben.', 'Ein BOOL `bAckPending` steuert den TON der Quittierüberwachung.', 'Die Plausibilitätsprüfung vor dem CASE erzwingt den Übergang nach ST_FAULT aus jedem Zustand.'],
      cycleMs: 10,
      io: [
        { name: 'diEStopReleased', type: 'BOOL', dir: 'in', label: 'Not-Halt entriegelt', widget: 'switch', init: true },
        { name: 'diDoorClosed', type: 'BOOL', dir: 'in', label: 'Schutztür geschlossen', widget: 'switch', init: true },
        { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittiertaster', widget: 'button' },
        { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start-Taster', widget: 'button' },
        { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Stopp-Taster (Öffner)', widget: 'switch', init: true },
        { name: 'simResetIgnored', type: 'BOOL', dir: 'in', label: 'Simulation: SafeLOGIC nimmt Reset nicht an', widget: 'switch' },
        { name: 'simStuckOK', type: 'BOOL', dir: 'in', label: 'Simulation: Freigabesignal klebt', widget: 'switch' },
        { name: 'diSafetyOK', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Freigabe (simuliert)', widget: 'led' },
        { name: 'doResetRequest', type: 'BOOL', dir: 'out', label: 'Reset-Anforderung an SafeLOGIC', widget: 'led' },
        { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Band läuft', widget: 'led' },
        { name: 'doLampAck', type: 'BOOL', dir: 'out', label: 'Leuchtmelder „Quittieren“', widget: 'led' },
        { name: 'nDiagCode', type: 'INT', dir: 'out', label: 'Diagnosecode', widget: 'value' }
      ],
      scene: { type: 'conveyor', bind: { motor: 'doMotor' } },
      plant: {
        var: 'VAR\n\tbResetOld : BOOL;\nEND_VAR\n',
        code: `IF simStuckOK THEN
	diSafetyOK := TRUE;
ELSIF NOT diEStopReleased OR NOT diDoorClosed THEN
	diSafetyOK := FALSE;
ELSIF doResetRequest AND NOT bResetOld AND NOT simResetIgnored THEN
	diSafetyOK := TRUE;
END_IF;
bResetOld := doResetRequest;`
      },
      files: {
        main: `PROGRAM _INIT
	eState := ST_WAIT_ACK;
END_PROGRAM

PROGRAM _CYCLIC
	rtStart(CLK := diStart);

	CASE eState OF
	ST_WAIT_ACK:
		doMotor := FALSE;
		(* TODO: Quittierung, Diagnose, Übergang nach ST_READY *)
		IF diSafetyOK THEN
			eState := ST_READY;
		END_IF;

	ST_READY:
		IF rtStart.Q THEN
			eState := ST_RUN;
		END_IF;

	ST_RUN:
		doMotor := TRUE;
		(* TODO: Stopp und Wegfall der Freigabe *)

	ST_FAULT:
		doMotor := FALSE;
	END_CASE;
END_PROGRAM
`,
        var: 'VAR\n\teState : eMachineState;\n\trtStart : R_TRIG;\nEND_VAR\n',
        typ: 'TYPE\n\teMachineState : (ST_WAIT_ACK, ST_READY, ST_RUN, ST_FAULT);\nEND_TYPE\n'
      },
      solution: {
        main: `PROGRAM _INIT
	eState := ST_WAIT_ACK;
	nDiagCode := 9;
END_PROGRAM

PROGRAM _CYCLIC
	rtAck(CLK := diAck);
	rtStart(CLK := diStart);
	bGuardsOk := diEStopReleased AND diDoorClosed;
	bResetTrig := FALSE;

	(* Plausibilität: Freigabe trotz nicht erfüllter Schutzeinrichtung *)
	tonPlaus(IN := diSafetyOK AND NOT bGuardsOk, PT := T#200ms);
	IF tonPlaus.Q THEN
		eState := ST_FAULT;
	END_IF;

	CASE eState OF
	ST_WAIT_ACK:
		doMotor := FALSE;
		IF NOT diEStopReleased THEN
			nDiagCode := 1;
		ELSIF NOT diDoorClosed THEN
			nDiagCode := 2;
		ELSIF nDiagCode <> 91 THEN
			nDiagCode := 9;
		END_IF;
		IF rtAck.Q AND bGuardsOk AND NOT diSafetyOK THEN
			bResetTrig := TRUE;
			bAckPending := TRUE;
			nDiagCode := 9;
		END_IF;
		IF diSafetyOK AND bGuardsOk THEN
			bAckPending := FALSE;
			nDiagCode := 0;
			eState := ST_READY;
		END_IF;

	ST_READY:
		doMotor := FALSE;
		IF NOT diSafetyOK THEN
			eState := ST_WAIT_ACK;
		ELSIF rtStart.Q AND diStop THEN
			eState := ST_RUN;
		END_IF;

	ST_RUN:
		doMotor := TRUE;
		IF NOT diSafetyOK THEN
			doMotor := FALSE;
			eState := ST_WAIT_ACK;
		ELSIF NOT diStop THEN
			doMotor := FALSE;
			eState := ST_READY;
		END_IF;

	ST_FAULT:
		doMotor := FALSE;
		bAckPending := FALSE;
		nDiagCode := 90;
		IF rtAck.Q AND NOT (diSafetyOK AND NOT bGuardsOk) THEN
			nDiagCode := 9;
			eState := ST_WAIT_ACK;
		END_IF;
	END_CASE;

	(* Reset-Puls und Quittierüberwachung *)
	tpReset(IN := bResetTrig, PT := T#100ms);
	doResetRequest := tpReset.Q;
	tonAckTimeout(IN := bAckPending, PT := T#1s);
	IF tonAckTimeout.Q THEN
		bAckPending := FALSE;
		nDiagCode := 91;
	END_IF;

	doLampAck := (eState = ST_WAIT_ACK) AND bGuardsOk AND NOT diSafetyOK;
END_PROGRAM
`,
        var: 'VAR\n\teState : eMachineState;\n\trtAck : R_TRIG;\n\trtStart : R_TRIG;\n\ttpReset : TP;\n\ttonPlaus : TON;\n\ttonAckTimeout : TON;\n\tbGuardsOk : BOOL;\n\tbResetTrig : BOOL;\n\tbAckPending : BOOL;\nEND_VAR\n',
        typ: 'TYPE\n\teMachineState : (ST_WAIT_ACK, ST_READY, ST_RUN, ST_FAULT);\nEND_TYPE\n'
      },
      tests: [
        { name: 'Hochlauf, Quittierung und Start', steps: [
          { cycles: 2 },
          { expect: 'NOT doMotor AND doLampAck AND nDiagCode = 9', msg: 'Nach dem Start: Motor aus, „Quittieren“ leuchtet, Code 9.' },
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { cycles: 2 },
          { expect: 'diSafetyOK AND nDiagCode = 0 AND NOT doLampAck', msg: 'Nach Quittierung: Freigabe da, Code 0.' },
          { never: 'doMotor', ms: 200, msg: 'Wiederanlaufsperre: Ohne Start-Flanke darf das Band nicht laufen.' },
          { set: { diStart: true } }, { cycles: 3 }, { set: { diStart: false } },
          { expect: 'doMotor', msg: 'Start-Flanke im Zustand READY muss das Band starten.' }
        ]},
        { name: 'Not-Halt im Lauf', steps: [
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { cycles: 2 },
          { set: { diStart: true } }, { cycles: 3 }, { set: { diStart: false } },
          { set: { diEStopReleased: false } }, { cycles: 2 },
          { expect: 'NOT doMotor AND nDiagCode = 1', msg: 'Not-Halt: Motor aus und Code 1.' },
          { set: { diEStopReleased: true } }, { cycles: 2 },
          { expect: 'doLampAck AND nDiagCode = 9', msg: 'Nach dem Entriegeln: „Quittieren“ und Code 9.' },
          { never: 'doMotor', ms: 300, msg: 'Nach Entriegeln darf das Band nicht anlaufen.' }
        ]},
        { name: 'Quittierung ohne Wirkung wird gemeldet', steps: [
          { set: { simResetIgnored: true, diAck: true } }, { cycles: 3 }, { set: { diAck: false } },
          { ms: 1200 },
          { expect: 'nDiagCode = 91 AND NOT doMotor', msg: 'Kommt die Freigabe nicht innerhalb 1 s, muss Code 91 stehen.' },
          { ms: 300 },
          { expect: 'nDiagCode = 91', msg: 'Code 91 muss stehen bleiben, bis erneut quittiert wird.' }
        ]},
        { name: 'Klebendes Freigabesignal führt zu FAULT', steps: [
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { cycles: 2 },
          { set: { diStart: true } }, { cycles: 3 }, { set: { diStart: false } },
          { set: { simStuckOK: true } }, { cycles: 2 },
          { set: { diEStopReleased: false } }, { ms: 300 },
          { expect: 'NOT doMotor AND nDiagCode = 90', msg: 'Freigabe trotz Not-Halt > 200 ms: FAULT mit Code 90.' },
          { set: { simStuckOK: false } }, { cycles: 2 }, { set: { diEStopReleased: true } }, { ms: 200 },
          { expect: 'nDiagCode = 90', msg: 'FAULT darf nicht automatisch verlassen werden.' },
          { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 2 },
          { expect: 'nDiagCode = 9 AND doLampAck', msg: 'Quittieren im FAULT führt zurück nach WAIT_ACK (Code 9).' }
        ]},
        { name: 'Stopp-Taster und Wiederanlaufsperre', steps: [
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { cycles: 2 },
          { set: { diStart: true } }, { cycles: 3 }, { set: { diStart: false } },
          { set: { diStop: false } }, { cycles: 2 },
          { expect: 'NOT doMotor', msg: 'Stopp-Taster muss das Band anhalten.' },
          { set: { diStop: true } },
          { never: 'doMotor', ms: 300, msg: 'Nach Loslassen des Stopp-Tasters kein selbstständiger Anlauf.' }
        ]}
      ]
    }
  ],
  proof: true,
  badge: 'Safety-Schnittstelle'
};

module.exports = [m1, m2, m3];
