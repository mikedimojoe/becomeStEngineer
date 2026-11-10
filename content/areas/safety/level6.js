'use strict';
const { HINWEIS, ST_HINWEIS, ABGERUFEN, brHelp, brReading } = require('./_common');

// ---------------------------------------------------------------------------
// Level 6 – Guru: Sicherheitskonzept Gesamtanlage, Manipulationsschutz, Fehlerausschlüsse, Audit
// ---------------------------------------------------------------------------

const m1 = {
  id: 'safety-6-gesamtkonzept',
  level: 6,
  kind: 'lektion',
  title: 'Sicherheitskonzept für eine Gesamtanlage',
  summary: 'Zonen, Wirkbereiche des Not-Halts, SafeDOMAIN-übergreifende Kommunikation und eine Stoppmatrix mit Erstauslöser-Erkennung.',
  minutes: 240,
  req: ['safety-5-projekt-aenderung'],
  briefing: 'Eine Fertigungslinie besteht aus mehreren Maschinen und Zonen. Das **Sicherheitskonzept** legt fest, welche Schutzeinrichtung welche Gefährdung in welcher Zone abdeckt, wie weit ein Not-Halt wirkt (Wirkbereich), welche Zonen beim Öffnen einer gemeinsamen Tür stehen müssen und wie Maschinen sicherheitstechnisch gekoppelt werden. ' +
    'Bei B&R lassen sich mehrere SafeDOMAINs per **SafeDOMAIN-to-SafeDOMAIN-Kommunikation** oder **openSAFETY over UDP** verbinden, z. B. für einen globalen Not-Halt im Maschinenverbund. Wichtig: Eine Gesamtheit von Maschinen kann selbst als Maschine gelten – mit eigener Risikobeurteilung und eigener Konformitätsbewertung. ' +
    'Als Architekt entwirfst du die Stoppmatrix (Ursache × Zone) und sorgst dafür, dass die Standard-Applikation die Zonen funktional koordiniert und den **Erstauslöser** eindeutig meldet.' + HINWEIS,
  practice: 'An einer Linie mit Zuführung, Bearbeitung und Abführung darf das Öffnen der Wartungstür zwischen Bearbeitung und Abführung nur diese beiden Zonen stoppen – die Zuführung muss aber funktional anhalten, damit sich kein Material staut.',
  transfer: {
    tia: 'Siemens bietet für die Kopplung F-CPU-zu-F-CPU die F-Kommunikation (z. B. I-Device, Flexible F-Link). Die Stoppmatrix ist ein herstellerunabhängiges Engineering-Artefakt.',
    codesys: 'In TwinSAFE werden Zonen meist als TwinSAFE-Gruppen modelliert; die Kopplung erfolgt über FSoE-Verbindungen zwischen Logiken.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Entwirf Zonen und Stoppmatrix',
      guide: {
        intro: 'Die Stoppmatrix ist das zentrale Dokument des Sicherheitskonzepts.',
        steps: [
          'Teile die Anlage in Zonen, sodass jede Zone durch eigene Schutzeinrichtungen sicher betretbar ist.',
          'Liste alle Auslöser (Not-Halt-Taster, Türen, Lichtgitter, Zustimmtaster) in Zeilen und alle Zonen in Spalten auf.',
          'Trage in jede Zelle die Reaktion ein (z. B. SS1, STO, keine) und begründe sie mit der Risikobeurteilung.',
          'Lege für Not-Halt-Taster den Wirkbereich fest: Ein Not-Halt am Hauptpult wirkt meist auf die ganze Anlage, ein lokaler Taster nur auf die erreichbaren Gefährdungen.',
          'Prüfe Übergänge zwischen Zonen (gemeinsame Türen, Fördertechnik) und definiere funktionale Kaskaden, die keine Sicherheitsfunktion sind.'
        ],
        done: 'Erledigt, wenn deine Stoppmatrix jeden Auslöser jeder Zone zuordnet und von einer zweiten Person geprüft ist.',
        tip: 'Kennzeichne Not-Halt-Taster mit eingeschränktem Wirkbereich deutlich vor Ort – Bediener erwarten sonst, dass jeder Taster alles stoppt.',
        link: { label: 'B&R Help: SafeDOMAIN-to-SafeDOMAIN Kommunikation', url: brHelp('safety/mapp_safety/concept/sd2sd-comm/sd2sd-comm.html') }
      }
    },
    {
      id: 'o2',
      title: 'Plane die Struktur von SafeDOMAINs',
      guide: {
        intro: 'Die Aufteilung in SafeDOMAINs beeinflusst Wartbarkeit, Änderungsaufwand und Validierungsumfang.',
        steps: [
          'Lies in der B&R-Hilfe das Konzept-Kapitel von mapp Safety (Organisation und Konfiguration).',
          'Entscheide: eine große SafeDOMAIN für die Linie oder je Maschine eine SafeDOMAIN mit Kopplung? Notiere Vor- und Nachteile (Änderungsumfang, Revalidierung, Lieferantenschnittstellen).',
          'Lege fest, welche sicheren Daten zwischen den SafeDOMAINs fließen (z. B. globaler Not-Halt, Zonenfreigaben).',
          'Prüfe die Verfügbarkeit der Kopplung im Datenblatt der eingesetzten SafeLOGIC (Hardware-Upgrade).',
          'Dokumentiere die Struktur als Diagramm im Sicherheitskonzept.'
        ],
        done: 'Erledigt, wenn dein Konzept die SafeDOMAIN-Struktur mit Begründung und Datenfluss enthält.',
        tip: 'Je Maschine eine SafeDOMAIN erleichtert Änderungen: Eine Änderung an Maschine B erzwingt dann keine Revalidierung der Logik von Maschine A.',
        link: { label: 'B&R Help: mapp Safety – Konzept', url: brHelp('safety/mapp_safety/concept/concept.html') }
      }
    },
    {
      id: 'o3',
      title: 'Koordiniere die Zonen in der Standard-Applikation',
      guide: {
        intro: 'Die Standard-Applikation kennt den Zonenzustand und hält vor- und nachgelagerte Zonen funktional an.',
        steps: [
          'Bilde die Stoppmatrix als 2D-Array `aMap : ARRAY[1..6,1..3] OF BOOL` im Standardprogramm nach (nur zur Diagnose und Koordination).',
          'Berechne je Zone den Status aus den Statussignalen der SafeLOGIC.',
          'Halte eine Zone funktional an, wenn die nachfolgende Zone steht (Kaskade gegen Materialstau).',
          'Ermittle den Erstauslöser per Flankenerkennung und halte ihn bis zur Quittierung.',
          'Bearbeite die Übung „Zonen-Stoppmatrix mit Erstauslöser“ und prüfe Grenzfälle (mehrere Auslöser im selben Zyklus, Auslöser schon beim Start aktiv).'
        ],
        done: 'Erledigt, wenn die Übung alle Tests besteht.',
        tip: 'Die Matrix im Standardprogramm muss mit der im SafeDESIGNER übereinstimmen – prüfe das bei jeder Änderung im Review.'
      }
    }
  ],
  videos: [
    { id: 'hoDk4uEgSXE', title: 'Ihr Weg zur Maschinensicherheit: 2/6 Sicherheitskonzept für Maschinen | Pilz', channel: 'Pilz GmbH & Co. KG', lang: 'de', why: 'Vom Ergebnis der Risikobeurteilung zum Sicherheitskonzept.' },
    { id: 'WlO5NFsLOHQ', title: 'Ihr Weg zur Maschinensicherheit: 3/6 Sicherheitsdesign bei Maschinen | Pilz', channel: 'Pilz GmbH & Co. KG', lang: 'de', why: 'Zeigt, wie aus dem Konzept ein Sicherheitsdesign wird.' },
    { id: 'fd0mYV0fG_A', title: 'Ihr Weg zur Maschinensicherheit: 4/6 Systemintegration für Maschinen | Pilz', channel: 'Pilz GmbH & Co. KG', lang: 'de', why: 'Behandelt die Integration mehrerer Maschinen und Komponenten.' }
  ],
  readings: [
    {
      title: 'Risikobeurteilung und Sicherheitskonzept', author: 'EUCHNER GmbH + Co. KG', institution: 'EUCHNER GmbH + Co. KG',
      work: 'Safety Services – Fachinformation', year: 2020, type: 'Hersteller', minutes: 25,
      url: 'https://www.euchner.de/de-de/wp-content/uploads/R/i/Risikobeurteilung-und-Sicherheitskonzept.pdf',
      why: 'Herstellersicht auf den Weg von der Risikobeurteilung zum Sicherheitskonzept.',
      apa: 'EUCHNER GmbH + Co. KG. (2020). *Risikobeurteilung und Sicherheitskonzept*. ' + ABGERUFEN + 'https://www.euchner.de/de-de/wp-content/uploads/R/i/Risikobeurteilung-und-Sicherheitskonzept.pdf'
    },
    brReading('SafeDOMAIN-to-SafeDOMAIN Kommunikation', 'safety/mapp_safety/concept/sd2sd-comm/sd2sd-comm.html', 'Sichere Kopplung mehrerer SafeLOGICs, z. B. für einen globalen Not-Halt.', 20),
    brReading('mapp Safety – Konzept', 'safety/mapp_safety/concept/concept.html', 'Organisation und Konfiguration von mapp Safety als Grundlage der Architekturentscheidung.', 15)
  ],
  quiz: [
    { type: 'single', q: 'Was legt eine Stoppmatrix fest?', options: ['Welche Auslöser in welcher Zone welche Reaktion bewirken', 'Die Taktzeit jeder Zone', 'Die IP-Adressen der SafeNODEs', 'Die Farbe der Not-Halt-Taster'], correct: 0, explain: 'Sie ist die tabellarische Verbindung von Auslösern, Zonen und Stoppreaktionen.' },
    { type: 'single', q: 'Wie kann bei B&R ein globaler Not-Halt über mehrere Maschinen mit eigener SafeLOGIC realisiert werden?', options: ['Über die Standard-SPS per OPC UA', 'Über SafeDOMAIN-to-SafeDOMAIN-Kommunikation bzw. openSAFETY', 'Über einen Merker in mapp View', 'Gar nicht'], correct: 1, explain: 'Sichere Informationen zwischen SafeDOMAINs laufen über die SafeLOGICs, nicht über Standardkommunikation.' },
    { type: 'single', q: 'Warum braucht die Standard-Applikation einen Erstauslöser-Speicher?', options: ['Weil nach einem Not-Halt oft Folgeauslösungen anstehen und sonst die eigentliche Ursache unklar ist', 'Weil die SafeLOGIC keine Diagnose kennt', 'Weil die Norm das fordert', 'Für die Zykluszeitmessung'], correct: 0, explain: 'Der Erstauslöser zeigt die Ursache; Folgemeldungen verdecken sie sonst.' }
  ],
  exam: [
    { type: 'multi', q: 'Welche Aussagen zu einer verketteten Anlage sind richtig?', options: ['Die Gesamtheit kann selbst als Maschine gelten', 'Jede Teilmaschine braucht trotzdem eigene Schutzmaßnahmen', 'Ein Not-Halt muss immer alles stoppen, egal wo er sitzt', 'Der Wirkbereich jedes Not-Halts muss festgelegt und erkennbar sein'], correct: [0, 1, 3], explain: 'Der Wirkbereich wird in der Risikobeurteilung festgelegt; er muss nicht immer die ganze Anlage umfassen.' },
    { type: 'single', q: 'Warum ist die funktionale Kaskade (vorgelagerte Zone hält an, wenn nachgelagerte steht) keine Sicherheitsfunktion?', options: ['Weil sie nur Materialstau verhindert und keine Gefährdung für Personen abdeckt', 'Weil sie zu langsam ist', 'Weil sie in ST geschrieben ist', 'Weil sie verboten ist'], correct: 0, explain: 'Sie dient der Verfügbarkeit und Prozessqualität. Schützt sie dagegen Personen, gehört sie in die Sicherheitslogik.' },
    { type: 'single', q: 'Ein Vorteil getrennter SafeDOMAINs pro Maschine ist …', options: ['Änderungen an einer Maschine erzwingen keine Revalidierung der anderen Logik', 'Es werden keine SafeLOGICs mehr benötigt', 'Die Kommunikation ist schneller', 'Es gibt keine Validierung mehr'], correct: 0, explain: 'Klare Grenzen reduzieren den Änderungs- und Validierungsumfang.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Zonen-Stoppmatrix mit Erstauslöser',
      task: ST_HINWEIS +
        'Eine Linie hat drei Zonen (1 Zuführung, 2 Bearbeitung, 3 Abführung). Die SafeLOGIC meldet sechs Auslöser als Status (TRUE = in Ordnung). Die Stoppmatrix (`aMap : ARRAY[1..6,1..3] OF BOOL`, in `_INIT` zu belegen):\n\n' +
        '| Nr. | Auslöser | Zone 1 | Zone 2 | Zone 3 |\n|---|---|---|---|---|\n' +
        '| 1 | `diNH1` Not-Halt Hauptpult | x | x | x |\n' +
        '| 2 | `diNH2` Not-Halt Bearbeitung | x | x | |\n' +
        '| 3 | `diNH3` Not-Halt Abführung | | | x |\n' +
        '| 4 | `diT1` Tür Zuführung | x | | |\n' +
        '| 5 | `diT2` Tür Bearbeitung | | x | |\n' +
        '| 6 | `diT3` Tür zwischen Zone 2 und 3 | | x | x |\n\n' +
        'Anforderungen:\n' +
        '- `doZone1Ok … doZone3Ok`: Zone ist frei, wenn kein ihr zugeordneter Auslöser aktiv ist. Werte die Matrix mit verschachtelten `FOR`-Schleifen aus.\n' +
        '- **Funktionale Kaskade:** `doRun1 = diAutoOn AND Zone1 AND Zone2`, `doRun2 = diAutoOn AND Zone2 AND Zone3`, `doRun3 = diAutoOn AND Zone3`.\n' +
        '- `nActiveCount` = Anzahl aktiver Auslöser.\n' +
        '- **Erstauslöser** `nFirstOut`: Nummer des ersten Auslösers, der seit der letzten Quittierung aktiv wurde (fallende Flanke). Werden mehrere im selben Zyklus aktiv, gilt die kleinste Nummer. Ist ein Auslöser schon beim Programmstart aktiv, zählt er als Auslösung. Folgeauslösungen überschreiben `nFirstOut` nicht.\n' +
        '- Steigende Flanke an `diAck` löscht `nFirstOut` nur, wenn kein Auslöser mehr aktiv ist.',
      hints: ['Kopiere die sechs Eingänge in `aDevOk[1..6]` und merke den Vorzyklus in `aDevOld` (in `_INIT` alle auf TRUE setzen).', 'Bei der Flankensuche verlässt `EXIT` die Schleife beim ersten Treffer – dann gilt automatisch die kleinste Nummer.'],
      cycleMs: 10,
      io: [
        { name: 'diNH1', type: 'BOOL', dir: 'in', label: 'Not-Halt Hauptpult OK', widget: 'switch', init: true },
        { name: 'diNH2', type: 'BOOL', dir: 'in', label: 'Not-Halt Bearbeitung OK', widget: 'switch', init: true },
        { name: 'diNH3', type: 'BOOL', dir: 'in', label: 'Not-Halt Abführung OK', widget: 'switch', init: true },
        { name: 'diT1', type: 'BOOL', dir: 'in', label: 'Tür Zuführung zu', widget: 'switch', init: true },
        { name: 'diT2', type: 'BOOL', dir: 'in', label: 'Tür Bearbeitung zu', widget: 'switch', init: true },
        { name: 'diT3', type: 'BOOL', dir: 'in', label: 'Tür Zone 2/3 zu', widget: 'switch', init: true },
        { name: 'diAutoOn', type: 'BOOL', dir: 'in', label: 'Automatik ein', widget: 'switch', init: true },
        { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
        { name: 'doZone1Ok', type: 'BOOL', dir: 'out', label: 'Zone 1 frei', widget: 'led' },
        { name: 'doZone2Ok', type: 'BOOL', dir: 'out', label: 'Zone 2 frei', widget: 'led' },
        { name: 'doZone3Ok', type: 'BOOL', dir: 'out', label: 'Zone 3 frei', widget: 'led' },
        { name: 'doRun1', type: 'BOOL', dir: 'out', label: 'Zone 1 fördert', widget: 'led' },
        { name: 'doRun2', type: 'BOOL', dir: 'out', label: 'Zone 2 fördert', widget: 'led' },
        { name: 'doRun3', type: 'BOOL', dir: 'out', label: 'Zone 3 fördert', widget: 'led' },
        { name: 'nActiveCount', type: 'INT', dir: 'out', label: 'Aktive Auslöser', widget: 'value' },
        { name: 'nFirstOut', type: 'INT', dir: 'out', label: 'Erstauslöser', widget: 'value' }
      ],
      scene: { type: 'lamp', bind: { lamps: ['doRun1', 'doRun2', 'doRun3'] } },
      files: {
        main: 'PROGRAM _INIT\n\t(* TODO: Matrix belegen *)\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Zonenstatus, Kaskade, Erstauslöser *)\n\tdoZone1Ok := diNH1 AND diNH2 AND diT1;\n\tdoZone2Ok := diNH1 AND diNH2 AND diT2;\n\tdoZone3Ok := diNH1 AND diNH3;\n\tdoRun1 := diAutoOn AND doZone1Ok;\n\tdoRun2 := diAutoOn AND doZone2Ok;\n\tdoRun3 := diAutoOn AND doZone3Ok;\nEND_PROGRAM\n',
        var: 'VAR\n\taMap : ARRAY[1..6,1..3] OF BOOL;\n\taDevOk : ARRAY[1..6] OF BOOL;\n\taDevOld : ARRAY[1..6] OF BOOL;\n\taZoneOk : ARRAY[1..3] OF BOOL;\n\ti : INT;\n\tz : INT;\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `PROGRAM _INIT
	(* Stoppmatrix: Auslöser i wirkt auf Zone z *)
	aMap[1,1] := TRUE; aMap[1,2] := TRUE; aMap[1,3] := TRUE;
	aMap[2,1] := TRUE; aMap[2,2] := TRUE;
	aMap[3,3] := TRUE;
	aMap[4,1] := TRUE;
	aMap[5,2] := TRUE;
	aMap[6,2] := TRUE; aMap[6,3] := TRUE;
	FOR i := 1 TO 6 DO
		aDevOld[i] := TRUE;
	END_FOR;
END_PROGRAM

PROGRAM _CYCLIC
	aDevOk[1] := diNH1;
	aDevOk[2] := diNH2;
	aDevOk[3] := diNH3;
	aDevOk[4] := diT1;
	aDevOk[5] := diT2;
	aDevOk[6] := diT3;

	(* Zonenstatus aus der Matrix *)
	nActiveCount := 0;
	FOR z := 1 TO 3 DO
		aZoneOk[z] := TRUE;
	END_FOR;
	FOR i := 1 TO 6 DO
		IF NOT aDevOk[i] THEN
			nActiveCount := nActiveCount + 1;
			FOR z := 1 TO 3 DO
				IF aMap[i,z] THEN
					aZoneOk[z] := FALSE;
				END_IF;
			END_FOR;
		END_IF;
	END_FOR;
	doZone1Ok := aZoneOk[1];
	doZone2Ok := aZoneOk[2];
	doZone3Ok := aZoneOk[3];

	(* Funktionale Kaskade gegen Materialstau – keine Sicherheitsfunktion *)
	doRun1 := diAutoOn AND aZoneOk[1] AND aZoneOk[2];
	doRun2 := diAutoOn AND aZoneOk[2] AND aZoneOk[3];
	doRun3 := diAutoOn AND aZoneOk[3];

	(* Erstauslöser *)
	IF nFirstOut = 0 THEN
		FOR i := 1 TO 6 DO
			IF aDevOld[i] AND NOT aDevOk[i] THEN
				nFirstOut := i;
				EXIT;
			END_IF;
		END_FOR;
	END_IF;
	FOR i := 1 TO 6 DO
		aDevOld[i] := aDevOk[i];
	END_FOR;

	rtAck(CLK := diAck);
	IF rtAck.Q AND nActiveCount = 0 THEN
		nFirstOut := 0;
	END_IF;
END_PROGRAM
`,
        var: 'VAR\n\taMap : ARRAY[1..6,1..3] OF BOOL;\n\taDevOk : ARRAY[1..6] OF BOOL;\n\taDevOld : ARRAY[1..6] OF BOOL;\n\taZoneOk : ARRAY[1..3] OF BOOL;\n\ti : INT;\n\tz : INT;\n\trtAck : R_TRIG;\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Alles frei', steps: [
          { cycles: 2 },
          { expect: 'doZone1Ok AND doZone2Ok AND doZone3Ok AND doRun1 AND doRun2 AND doRun3 AND nActiveCount = 0 AND nFirstOut = 0', msg: 'Ohne Auslöser sind alle Zonen frei und fördern.' }
        ]},
        { name: 'Lokaler Not-Halt Bearbeitung', steps: [
          { cycles: 2 }, { set: { diNH2: false } }, { cycles: 2 },
          { expect: 'NOT doZone1Ok AND NOT doZone2Ok AND doZone3Ok', msg: 'NH2 stoppt Zone 1 und 2, Zone 3 bleibt frei.' },
          { expect: 'NOT doRun1 AND NOT doRun2 AND doRun3 AND nFirstOut = 2', msg: 'Zone 3 fördert weiter, Erstauslöser 2.' }
        ]},
        { name: 'Gemeinsame Tür und Kaskade', steps: [
          { cycles: 2 }, { set: { diT3: false } }, { cycles: 2 },
          { expect: 'doZone1Ok AND NOT doZone2Ok AND NOT doZone3Ok', msg: 'Tür 3 stoppt Zone 2 und 3.' },
          { expect: 'NOT doRun1', msg: 'Kaskade: Zone 1 muss anhalten, weil Zone 2 steht.' }
        ]},
        { name: 'Erstauslöser bleibt bis zur Quittierung', steps: [
          { cycles: 2 }, { set: { diT1: false } }, { cycles: 2 },
          { set: { diNH1: false } }, { cycles: 2 },
          { expect: 'nFirstOut = 4 AND nActiveCount = 2', msg: 'Tür 1 war zuerst: nFirstOut = 4.' },
          { set: { diT1: true, diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { cycles: 1 },
          { expect: 'nFirstOut = 4', msg: 'Quittieren bei noch aktivem Not-Halt darf den Erstauslöser nicht löschen.' },
          { set: { diNH1: true } }, { cycles: 1 }, { set: { diAck: true } }, { cycles: 2 },
          { expect: 'nFirstOut = 0', msg: 'Quittieren ohne aktive Auslöser löscht den Erstauslöser.' }
        ]},
        { name: 'Gleichzeitige Auslösung', steps: [
          { cycles: 2 }, { set: { diNH3: false, diT2: false } }, { cycles: 2 },
          { expect: 'nFirstOut = 3', msg: 'Bei gleichzeitiger Auslösung gilt die kleinste Nummer (3).' }
        ]},
        { name: 'Auslöser beim Start aktiv', steps: [
          { set: { diT2: false } }, { cycles: 2 },
          { expect: 'nFirstOut = 5 AND NOT doZone2Ok', msg: 'Ein beim Start aktiver Auslöser muss als Erstauslöser erscheinen.' }
        ]}
      ]
    }
  ],
  proof: false
};

// ---------------------------------------------------------------------------
const m2 = {
  id: 'safety-6-manipulation',
  level: 6,
  kind: 'lektion',
  title: 'Manipulationsschutz und Fehlerausschlüsse',
  summary: 'Umgehungsanreize nach EN ISO 14119 bewerten und vermeiden, Fehlerausschlüsse begründen – und Manipulationsverdacht in der Standard-SPS erkennen.',
  minutes: 220,
  req: ['safety-6-gesamtkonzept'],
  briefing: 'Nach Einschätzung von Fachleuten geht gut ein Viertel der Unfälle an Maschinen auf manipulierte Schutzeinrichtungen zurück. Ursache ist fast immer ein **Manipulationsanreiz**: Die Schutzeinrichtung behindert Einrichten, Störungsbeseitigung oder Sicht auf den Prozess. Die EN ISO 14119 fordert deshalb, den Anreiz zu bewerten und zu minimieren; das IFA bietet dafür die Webanwendung MaSeM. ' +
    'Erst kommt die Konstruktion (Betriebsarten für Einrichten, Sichtfenster, sichere Eingriffsmöglichkeiten), dann der Schutz gegen einfaches Umgehen (codierte Betätiger, verdeckter Einbau) und zuletzt die **Erkennung** – etwa durch Plausibilitätsprüfungen in der Standard-SPS. ' +
    'Zweites Thema sind **Fehlerausschlüsse**: Bestimmte Fehler (z. B. Bruch eines formschlüssigen Betätigers) dürfen nur unter strengen, dokumentierten Bedingungen ausgeschlossen werden; für PL e sind sie stark eingeschränkt.' + HINWEIS,
  practice: 'An einer Handarbeitsstation wird jedes Teil von Hand eingelegt. Läuft die Maschine zehn Zyklen, ohne dass die Tür je geöffnet wurde, ist der Türschalter vermutlich überbrückt – die Standard-SPS kann das erkennen und melden.',
  transfer: {
    tia: 'Die Plausibilitätsüberwachung ist herstellerunabhängig. In TIA Portal würdest du sie im Standardprogramm mit Statusbits des F-Programms aufbauen.',
    codesys: 'Gleiches gilt für CODESYS/TwinCAT: Prozesswissen (Zyklus, Bedienhandlungen) liegt in der Standard-Applikation und ergänzt die Safety-Diagnose.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Bewerte den Manipulationsanreiz',
      guide: {
        intro: 'Die Bewertung nach EN ISO 14119 fragt, welchen Vorteil eine Umgehung bringt.',
        steps: [
          'Lies das DGUV-Papier FBHM-022 „Manipulation von Schutzeinrichtungen – Verhindern, Erschweren, Erkennen“.',
          'Liste für eine Beispielmaschine alle Tätigkeiten im Schutzbereich auf (Einrichten, Störung beseitigen, Reinigen, Beobachten).',
          'Bewerte je Tätigkeit, ob eine Umgehung schneller, bequemer oder mit besserer Sicht wäre.',
          'Nutze die IFA-Webanwendung MaSeM, um den Anreiz zu bestimmen und zu dokumentieren.',
          'Leite konstruktive Maßnahmen ab (z. B. Einrichtbetrieb mit SLS und Zustimmtaster) – erst danach Maßnahmen gegen Umgehung.'
        ],
        done: 'Erledigt, wenn für jede Schutzeinrichtung deiner Beispielmaschine eine Anreizbewertung mit Maßnahmen vorliegt.',
        tip: 'Maschinen mit hohem Manipulationsanreiz gelten nach IFA nicht als sicher. Wer den Anreiz beseitigt, braucht weniger Kontrolle.',
        link: { label: 'IFA: Manipulation von Schutzeinrichtungen verhindern', url: 'https://www.dguv.de/ifa/stopp-manipulation/index.jsp' }
      }
    },
    {
      id: 'o2',
      title: 'Wähle Maßnahmen gegen einfaches Umgehen',
      guide: {
        intro: 'EN ISO 14119 unterscheidet Bauarten von Verriegelungseinrichtungen und Codierungsstufen.',
        steps: [
          'Unterscheide unkodierte, gering, mittel und hoch codierte Betätiger und notiere, wann welche Stufe sinnvoll ist.',
          'Plane zusätzliche Maßnahmen: verdeckter Einbau, nicht lösbare Befestigung, Überwachung der Zuhaltung, Plausibilitätsprüfung im Prozess.',
          'Prüfe bei Zuhaltungen: Rückmeldung „verriegelt“ bei offener Tür ist ein Hinweis auf Manipulation oder Defekt.',
          'Lege fest, welche Prüfungen die Standard-SPS übernimmt (Erkennung) und welche die SafeLOGIC (Abschaltung).'
        ],
        done: 'Erledigt, wenn jede Schutztür deines Konzepts eine Codierungsstufe und mindestens eine Erkennungsmaßnahme hat.',
        tip: 'Eine Erkennung im Standardprogramm ist kein Ersatz für eine geeignete Codierung – sie macht Umgehungen aber sichtbar und auditierbar.',
        link: { label: 'IFA: MaSeM-Webanwendung', url: 'https://dguv.de/ifa/praxishilfen/praxishilfen-maschinenschutz/defeating-protective-devices/web-app-masem/index.jsp' }
      }
    },
    {
      id: 'o3',
      title: 'Begründe Fehlerausschlüsse',
      guide: {
        intro: 'Ein Fehlerausschluss ist eine dokumentierte Begründung, warum ein Fehler nicht betrachtet werden muss.',
        steps: [
          'Lies im IFA Report 1/2025 den Abschnitt zu Fehlerausschlüssen und den Fehlerlisten der EN ISO 13849-2.',
          'Notiere typische Fehlerausschlüsse (z. B. Kurzschluss zwischen getrennt verlegten Leitungen) und deren Bedingungen.',
          'Halte fest, dass der mechanische Fehlerausschluss eines Betätigers für PL e nur eingeschränkt zulässig ist.',
          'Dokumentiere jeden Fehlerausschluss mit Begründung, Bedingungen und Prüfung bei der Validierung.'
        ],
        done: 'Erledigt, wenn dein Sicherheitskonzept eine Liste aller Fehlerausschlüsse mit Begründung enthält.',
        tip: 'Jeder Fehlerausschluss ist ein Prüfpunkt bei der Abnahme. Weniger Ausschlüsse bedeuten weniger Diskussionen.',
        link: { label: 'IFA Report 1/2025 (PDF)', url: 'https://publikationen.dguv.de/widgets/pdf/download/article/5091' }
      }
    }
  ],
  videos: [
    { id: 'oMTbDD8cNlE', title: 'Manipulation von Schutzeinrichtungen', channel: 'DGUV', lang: 'de', why: 'Die DGUV erklärt Ursachen und Folgen von Manipulationen.' },
    { id: 'JMdeq7HyEIs', title: 'Sicherheitszuhaltung PSENmlock | Pilz', channel: 'Pilz GmbH & Co. KG', lang: 'de', why: 'Beispiel einer hoch codierten Zuhaltung mit Manipulationsschutz.' }
  ],
  readings: [
    {
      title: 'Manipulation von Schutzeinrichtungen – Verhindern, Erschweren, Erkennen (Fachbereich AKTUELL FBHM-022)', author: 'DGUV Fachbereich Holz und Metall', institution: 'Deutsche Gesetzliche Unfallversicherung (DGUV)',
      work: 'Fachbereich AKTUELL FBHM-022', year: 2021, type: 'Norm/Amtlich', minutes: 30,
      url: 'https://publikationen.dguv.de/widgets/pdf/download/article/4435',
      why: 'Praxisnahe Darstellung, wie Manipulation verhindert, erschwert und erkannt wird.',
      apa: 'DGUV Fachbereich Holz und Metall. (2021). *Manipulation von Schutzeinrichtungen – Verhindern, Erschweren, Erkennen* (FBHM-022). DGUV. ' + ABGERUFEN + 'https://publikationen.dguv.de/widgets/pdf/download/article/4435'
    },
    {
      title: 'Neue App: Manipulationsanreiz von Schutzeinrichtungen an Maschinen bewerten (Aus der Arbeit des IFA 0395)', author: 'Institut für Arbeitsschutz der DGUV', institution: 'Deutsche Gesetzliche Unfallversicherung (DGUV)',
      work: 'Aus der Arbeit des IFA', year: 2019, type: 'Norm/Amtlich', minutes: 10,
      url: 'https://publikationen.dguv.de/widgets/pdf/download/article/3388',
      why: 'Kurzinfo zur Bewertungsmethode des Manipulationsanreizes, die in EN ISO 14119 eingeflossen ist.',
      apa: 'Institut für Arbeitsschutz der DGUV. (2019). *Neue App: Manipulationsanreiz von Schutzeinrichtungen an Maschinen bewerten* (Aus der Arbeit des IFA 0395). DGUV. ' + ABGERUFEN + 'https://publikationen.dguv.de/widgets/pdf/download/article/3388'
    },
    {
      title: 'Manipulation von Schutzeinrichtungen verhindern', author: 'Institut für Arbeitsschutz der DGUV', institution: 'Deutsche Gesetzliche Unfallversicherung (DGUV)',
      work: 'IFA Themenseite', year: 2026, type: 'Norm/Amtlich', minutes: 15,
      url: 'https://www.dguv.de/ifa/stopp-manipulation/index.jsp',
      why: 'Einstiegsseite des IFA mit Hintergrund, Befragungsergebnissen und Werkzeugen.',
      apa: 'Institut für Arbeitsschutz der DGUV. (2026). *Manipulation von Schutzeinrichtungen verhindern*. DGUV. ' + ABGERUFEN + 'https://www.dguv.de/ifa/stopp-manipulation/index.jsp'
    }
  ],
  quiz: [
    { type: 'single', q: 'Was ist nach EN ISO 14119 der erste Ansatz gegen Manipulation?', options: ['Höher codierte Schalter einbauen', 'Den Manipulationsanreiz durch Konstruktion und geeignete Betriebsarten minimieren', 'Bediener schulen', 'Kameras installieren'], correct: 1, explain: 'Wer den Anreiz beseitigt, verhindert die Ursache. Codierung und Erkennung kommen ergänzend dazu.' },
    { type: 'single', q: 'Eine Zuhaltung meldet „verriegelt“, der Türkontakt meldet „offen“. Was ist das wahrscheinlich?', options: ['Normalzustand', 'Manipulation (z. B. Ersatzbetätiger) oder Defekt', 'Ein Kommunikationsfehler der Standard-SPS', 'Ein Bedienfehler am HMI'], correct: 1, explain: 'Bei offener Tür kann der Riegel nicht im Betätiger stecken – die Signale sind unplausibel.' },
    { type: 'multi', q: 'Welche Aussagen zu Fehlerausschlüssen sind richtig?', options: ['Sie müssen begründet und dokumentiert werden', 'Für PL e sind sie eingeschränkt', 'Sie sind eine bequeme Abkürzung ohne Bedingungen', 'Sie werden bei der Validierung geprüft'], correct: [0, 1, 3], explain: 'Fehlerausschlüsse haben Bedingungen, die bei Konstruktion und Validierung nachgewiesen werden.' }
  ],
  exam: [
    { type: 'single', q: 'Welches IFA-Werkzeug unterstützt die Bewertung des Manipulationsanreizes?', options: ['SISTEMA', 'SOFTEMA', 'MaSeM', 'SafeDESIGNER'], correct: 2, explain: 'MaSeM ist die Webanwendung zur Bestimmung des Manipulationsanreizes.' },
    { type: 'single', q: 'Warum ist eine Manipulationserkennung in der Standard-SPS sinnvoll, obwohl sie nicht sicher ist?', options: ['Sie ersetzt codierte Schalter', 'Sie macht Umgehungen sichtbar, protokolliert sie und unterbindet den Automatikbetrieb funktional', 'Sie ist gesetzlich vorgeschrieben', 'Sie beschleunigt die Maschine'], correct: 1, explain: 'Erkennung ergänzt Konstruktion und Codierung und unterstützt Betreiber und Audit.' },
    { type: 'single', q: 'Welche Maßnahme erschwert das Umgehen eines Türschalters am wirksamsten gegen einfache Mittel?', options: ['Unkodierter Magnetschalter', 'Hoch codierter Betätiger mit verdecktem, nicht lösbarem Einbau', 'Ein Warnschild', 'Eine HMI-Meldung'], correct: 1, explain: 'Hohe Codierung plus Einbaumaßnahmen erschweren den Einsatz von Ersatzbetätigern.' },
    { type: 'multi', q: 'Welche Tätigkeiten erzeugen typischerweise einen Manipulationsanreiz, wenn die Maschine sie nicht sicher unterstützt?', options: ['Einrichten im Tippbetrieb', 'Beobachten des Prozesses aus der Nähe', 'Störungsbeseitigung bei laufender Maschine', 'Abschalten am Hauptschalter'], correct: [0, 1, 2], explain: 'Fehlt eine sichere Lösung (z. B. SLS mit Zustimmtaster), wird die Schutzeinrichtung umgangen.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Manipulationsverdacht erkennen',
      task: ST_HINWEIS +
        'An einer Handbeschickung muss der Bediener vor jedem Zyklus die Schutztür öffnen, um ein Teil einzulegen. Die Standard-SPS erkennt zwei Fehlerbilder und sperrt den Automatikbetrieb **funktional** (`doBlockAuto`):\n\n' +
        '1. **Zyklen ohne Türöffnung:** Bei jeder steigenden Flanke von `diCycleDone` wird geprüft, ob die Tür seit dem letzten Zyklus mindestens einmal geöffnet war. Wenn nicht, zählt `nCyclesNoOpen` hoch, sonst wird er 0. Ab **3** Zyklen ohne Öffnung: Manipulationsverdacht, `nDiag = 10`.\n' +
        '2. **Diskrepanz Tür/Zuhaltung:** `diDoorClosed = FALSE`, aber `diLockActive = TRUE` länger als **100 ms** → `nDiag = 20` (hat Vorrang vor 10).\n\n' +
        'Beide Meldungen sind **gespeichert**. Sie lassen sich nur mit einer steigenden Flanke am Schlüsselschalter `diSupervisorKey` zurücksetzen – und nur, wenn die Diskrepanz nicht mehr ansteht. Beim Zurücksetzen wird auch `nCyclesNoOpen` gelöscht.\n\n' +
        '`nSuspectCount` zählt jedes neue Auftreten eines Verdachts (Code 10 oder 20 wird gesetzt) für das Audit-Protokoll. `doBlockAuto = TRUE`, solange eine Meldung gespeichert ist.',
      hints: ['Ein `R_TRIG` auf `NOT diDoorClosed` erkennt das Öffnen der Tür.', 'Zum Zählen neuer Verdachtsfälle: vorher prüfen, ob das jeweilige Merkerbit schon gesetzt war.', 'Kurze Diskrepanzen beim Schließen sind normal – deshalb die 100-ms-Toleranz.'],
      cycleMs: 10,
      io: [
        { name: 'diDoorClosed', type: 'BOOL', dir: 'in', label: 'Schutztür geschlossen', widget: 'switch', init: true },
        { name: 'diLockActive', type: 'BOOL', dir: 'in', label: 'Zuhaltung verriegelt (Rückmeldung)', widget: 'switch' },
        { name: 'diCycleDone', type: 'BOOL', dir: 'in', label: 'Maschinenzyklus beendet', widget: 'button' },
        { name: 'diSupervisorKey', type: 'BOOL', dir: 'in', label: 'Schlüsselschalter Schichtleitung', widget: 'button' },
        { name: 'doBlockAuto', type: 'BOOL', dir: 'out', label: 'Automatik gesperrt', widget: 'led' },
        { name: 'nDiag', type: 'INT', dir: 'out', label: 'Diagnose', widget: 'value' },
        { name: 'nCyclesNoOpen', type: 'INT', dir: 'out', label: 'Zyklen ohne Türöffnung', widget: 'value' },
        { name: 'nSuspectCount', type: 'INT', dir: 'out', label: 'Verdachtsfälle (Audit)', widget: 'value' }
      ],
      files: {
        main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Zyklen ohne Türöffnung, Diskrepanz, Speicherung, Reset *)\n\tIF NOT diDoorClosed AND diLockActive THEN\n\t\tnDiag := 20;\n\tELSE\n\t\tnDiag := 0;\n\tEND_IF;\n\tdoBlockAuto := nDiag <> 0;\nEND_PROGRAM\n',
        var: 'VAR\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	rtOpen(CLK := NOT diDoorClosed);
	rtCycle(CLK := diCycleDone);
	rtKey(CLK := diSupervisorKey);

	IF rtOpen.Q THEN
		bOpenedSinceCycle := TRUE;
	END_IF;

	(* 1. Zyklen ohne Türöffnung *)
	IF rtCycle.Q THEN
		IF bOpenedSinceCycle THEN
			nCyclesNoOpen := 0;
		ELSE
			nCyclesNoOpen := nCyclesNoOpen + 1;
		END_IF;
		bOpenedSinceCycle := FALSE;
	END_IF;
	IF nCyclesNoOpen >= 3 AND NOT bSuspect THEN
		bSuspect := TRUE;
		nSuspectCount := nSuspectCount + 1;
	END_IF;

	(* 2. Diskrepanz Tür / Zuhaltung *)
	tonDisc(IN := NOT diDoorClosed AND diLockActive, PT := T#100ms);
	IF tonDisc.Q AND NOT bDiscrepancy THEN
		bDiscrepancy := TRUE;
		nSuspectCount := nSuspectCount + 1;
	END_IF;

	(* Rücksetzen nur durch Schichtleitung und nur ohne anstehende Diskrepanz *)
	IF rtKey.Q AND NOT (NOT diDoorClosed AND diLockActive) THEN
		bSuspect := FALSE;
		bDiscrepancy := FALSE;
		nCyclesNoOpen := 0;
	END_IF;

	IF bDiscrepancy THEN
		nDiag := 20;
	ELSIF bSuspect THEN
		nDiag := 10;
	ELSE
		nDiag := 0;
	END_IF;
	doBlockAuto := bDiscrepancy OR bSuspect;
END_PROGRAM
`,
        var: 'VAR\n\trtOpen : R_TRIG;\n\trtCycle : R_TRIG;\n\trtKey : R_TRIG;\n\ttonDisc : TON;\n\tbOpenedSinceCycle : BOOL;\n\tbSuspect : BOOL;\n\tbDiscrepancy : BOOL;\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Normale Handbeschickung', steps: [
          { cycles: 2 },
          { set: { diDoorClosed: false } }, { cycles: 2 }, { set: { diDoorClosed: true } }, { cycles: 2 }, { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diDoorClosed: false } }, { cycles: 2 }, { set: { diDoorClosed: true } }, { cycles: 2 }, { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diDoorClosed: false } }, { cycles: 2 }, { set: { diDoorClosed: true } }, { cycles: 2 }, { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diDoorClosed: false } }, { cycles: 2 }, { set: { diDoorClosed: true } }, { cycles: 2 }, { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { expect: 'nDiag = 0 AND NOT doBlockAuto AND nCyclesNoOpen = 0', msg: 'Mit Türöffnung vor jedem Zyklus darf kein Verdacht entstehen.' }
        ]},
        { name: 'Drei Zyklen ohne Türöffnung', steps: [
          { cycles: 2 },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { expect: 'nCyclesNoOpen = 2 AND nDiag = 0', msg: 'Nach zwei Zyklen ohne Öffnung noch kein Verdacht.' },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { expect: 'nDiag = 10 AND doBlockAuto AND nSuspectCount = 1', msg: 'Ab drei Zyklen ohne Öffnung: Code 10, Automatik gesperrt.' }
        ]},
        { name: 'Verdacht bleibt gespeichert', steps: [
          { cycles: 2 },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diDoorClosed: false } }, { cycles: 2 }, { set: { diDoorClosed: true } }, { cycles: 2 }, { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { expect: 'nDiag = 10 AND doBlockAuto', msg: 'Der Verdacht darf nicht durch normales Weiterarbeiten verschwinden.' },
          { set: { diSupervisorKey: true } }, { cycles: 2 },
          { expect: 'nDiag = 0 AND NOT doBlockAuto AND nCyclesNoOpen = 0 AND nSuspectCount = 1', msg: 'Schlüsselschalter setzt zurück, Audit-Zähler bleibt.' }
        ]},
        { name: 'Diskrepanz Tür/Zuhaltung', steps: [
          { cycles: 2 }, { set: { diDoorClosed: false, diLockActive: true } }, { ms: 200 },
          { expect: 'nDiag = 20 AND doBlockAuto', msg: 'Tür offen und Zuhaltung verriegelt > 100 ms: Code 20.' },
          { set: { diSupervisorKey: true } }, { cycles: 2 }, { set: { diSupervisorKey: false } }, { cycles: 1 },
          { expect: 'nDiag = 20', msg: 'Rücksetzen bei anstehender Diskrepanz ist nicht erlaubt.' },
          { set: { diLockActive: false } }, { cycles: 2 }, { set: { diSupervisorKey: true } }, { cycles: 2 },
          { expect: 'nDiag = 0 AND NOT doBlockAuto', msg: 'Nach Behebung setzt der Schlüsselschalter zurück.' }
        ]},
        { name: 'Diskrepanz hat Vorrang', steps: [
          { cycles: 2 },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diCycleDone: true } }, { cycles: 1 }, { set: { diCycleDone: false } }, { cycles: 1 },
          { set: { diDoorClosed: false, diLockActive: true } }, { ms: 200 },
          { expect: 'nDiag = 20 AND nSuspectCount = 2', msg: 'Beide Fehlerbilder: Code 20 hat Vorrang, zwei Verdachtsfälle gezählt.' }
        ]},
        { name: 'Kurze Diskrepanz wird toleriert', steps: [
          { cycles: 2 }, { set: { diDoorClosed: false, diLockActive: true } }, { ms: 50 },
          { set: { diDoorClosed: true } }, { ms: 300 },
          { expect: 'nDiag = 0 AND NOT doBlockAuto AND nSuspectCount = 0', msg: 'Eine Diskrepanz unter 100 ms (Schaltvorgang) darf keinen Alarm auslösen.' }
        ]}
      ]
    }
  ],
  proof: false
};

// ---------------------------------------------------------------------------
const m3 = {
  id: 'safety-6-projekt-audit',
  level: 6,
  kind: 'projekt',
  title: 'Praxisprojekt: Audit-fähige Safety-Schnittstelle',
  summary: 'Ein wiederverwendbarer Funktionsbaustein je Sicherheitsfunktion, zentrale Quittierung, Erstauslöser, Klemmerkennung und Auslösezähler – vorbereitet für Audit und Abnahme.',
  minutes: 360,
  req: ['safety-6-manipulation'],
  briefing: 'Am Ende eines Maschinenprojekts stehen **Abnahme** und **Audit**: Konformitätsbewertung, technische Dokumentation, Validierungsprotokoll, Betriebsanleitung, und später wiederkehrende Prüfungen beim Betreiber. Ab dem 20.01.2027 gelten dafür die Anforderungen der Maschinenverordnung (EU) 2023/1230, u. a. mit digitaler Betriebsanleitung und erweiterten Anforderungen an Schutz gegen Korruption und an sicherheitsrelevante Software. ' +
    'Ein Auditor fragt: Welche Sicherheitsfunktionen gibt es? Wie oft haben sie ausgelöst? Was war die Ursache? Wurde jede Quittierung bewusst ausgeführt? Eine saubere, wiederverwendbare Safety-Schnittstelle in der Standard-SPS beantwortet diese Fragen. ' +
    'In diesem Abschlussprojekt baust du sie als Architektur: ein Funktionsbaustein je Sicherheitsfunktion, eine zentrale Quittier- und Wiederanlauflogik, Erstauslöser, Klemmerkennung und Zähler – getestet an Grenzfällen.' + HINWEIS,
  practice: 'Bei der wiederkehrenden Prüfung zeigt der Betreiber am HMI: Not-Halt 14 Auslösungen, Tür 412, Lichtgitter 3, Erstauslöser jeweils gespeichert, keine Quittierung mit klemmendem Taster. Das ist die Grundlage für ein gutes Audit.',
  transfer: {
    tia: 'In TIA Portal würdest du dieselbe Architektur mit einem Standard-FB je F-Funktion (Auswertung von Statusbits) und einem zentralen ACK-Handling aufbauen.',
    codesys: 'In CODESYS/TwinCAT bietet sich eine FB-Instanz je TwinSAFE-Gruppe bzw. Sicherheitsfunktion an, gern mit Interface und Array von Instanzen.'
  },
  objectives: [
    {
      id: 'o1',
      title: 'Bereite die Abnahmedokumentation vor',
      guide: {
        intro: 'Die Abnahme prüft, ob die Maschine dem Sicherheitskonzept entspricht und nachweislich validiert ist.',
        steps: [
          'Stelle zusammen: Risikobeurteilung, Sicherheitskonzept mit Stoppmatrix, Sicherheitsfunktions-Spezifikationen, PL-Nachweise (SISTEMA-Bericht), Validierungsprotokoll mit CRC, Liste der Fehlerausschlüsse.',
          'Prüfe für die Maschinenverordnung: Gilt sie für dein Inverkehrbringen (ab 20.01.2027)? Sieh dir die Folien von Suva/EKAS zu den neuen Pflichten an.',
          'Lege eine Checkliste für die Abnahme an (jede Sicherheitsfunktion, jede Betriebsart, Quittierung, Wiederanlauf, Diagnose).',
          'Plane, welche Daten die Standard-SPS für wiederkehrende Prüfungen bereitstellt (Auslösezähler, Erstauslöser, Diagnosehistorie).'
        ],
        done: 'Erledigt, wenn deine Abnahmemappe vollständig ist und eine zweite Person sie anhand der Checkliste geprüft hat.',
        tip: 'Dokumentation, die erst nach der Abnahme entsteht, ist meist lückenhaft. Schreibe sie parallel zum Engineering.',
        link: { label: 'Suva/EKAS: Maschinenverordnung – neue Pflichten', url: 'https://www.ekas.admin.ch/fileadmin/Dokumente/Tagungen/Arbeitstagung/2024/Referate/DE/AT13_Vock_d_2024_-_Maschinenverordnung_EU_20231230_Neue_Pflichten_fuer_Inverkehrbringer_von_Maschinen.pdf' }
      }
    },
    {
      id: 'o2',
      title: 'Entwirf die wiederverwendbare Architektur',
      guide: {
        intro: 'Ein Funktionsbaustein je Sicherheitsfunktion macht die Schnittstelle erweiterbar und testbar.',
        steps: [
          'Definiere `FUNCTION_BLOCK FB_SafetyFunction` (in AS6: Deklaration in der `.fun`-Datei einer eigenen Bibliothek) mit den Eingängen `bOk` (Freigabe) und `bResetReq` (Baustein wartet auf Reset, wie der Ausgang „ResetRequest“ der PLCopen-Safety-Bausteine V2).',
          'Gib aus: `bDemand` (Funktion angefordert), `bNeedsAck` (quittierbar), `bTripped` (Auslösung in diesem Zyklus) und `nTrips` (Zähler).',
          'Lege die Aggregation im Programm fest: Erstauslöser, Diagnose-Priorität, zentrale Quittierung, Wiederanlaufsperre, Klemmerkennung.',
          'Schreibe die Architektur als kurzes Design-Dokument mit Schnittstellen-Tabelle in dein Repository.'
        ],
        done: 'Erledigt, wenn das Design-Dokument alle Schnittstellen und Prioritäten beschreibt.',
        tip: 'Halte die FB-Schnittstelle schmal. Je weniger ein FB weiß, desto einfacher lässt er sich in jedem Projekt wiederverwenden.'
      }
    },
    {
      id: 'o3',
      title: 'Implementiere, teste und reiche den Nachweis ein',
      guide: {
        intro: 'Die Projektübung prüft Normalfall, Grenzfälle und Fehlerbilder.',
        steps: [
          'Implementiere `FB_SafetyFunction` und das Programm nach Aufgabenstellung.',
          'Lass die Tests laufen und analysiere jeden fehlgeschlagenen Test mit Watch-Werten.',
          'Ergänze im Repository eine Testbeschreibung, die jeden Test einer Anforderung zuordnet (Rückverfolgbarkeit wie im V-Modell).',
          'Committe, tagge den Stand und reiche den Link als Nachweis ein.'
        ],
        done: 'Erledigt, wenn alle Tests bestehen und der Ausbilder deinen Nachweis bestätigt hat.',
        tip: 'Ein Auditor liest lieber eine kurze, vollständige Rückverfolgbarkeitstabelle als hundert Seiten Prosa.'
      }
    }
  ],
  videos: [
    { id: 'OpM7jvZQ4Jw', title: 'Ihr Weg zur Maschinensicherheit: 6/6 Dienstleistungen entlang des Maschinenlebenszyklus | Pilz', channel: 'Pilz GmbH & Co. KG', lang: 'de', why: 'Sicherheit über den Lebenszyklus: Abnahme, wiederkehrende Prüfung, Änderungen.' },
    { id: 'DynFBG6iTRQ', title: 'MBT 2023: Neue Maschinenverordnung - (fast) alle Änderungen', channel: 'MBT Maschinenbautage', lang: 'de', why: 'Ausführlicher Überblick über die Änderungen durch die Maschinenverordnung.' },
    { id: 'WNS-odS4CY0', title: 'Validation of machines under consideration of the new EN ISO 13849-2', channel: 'IRSST - Santé et sécurité du travail', lang: 'en', why: 'Vortrag eines Arbeitsschutzinstituts zur Validierung vor der Abnahme.' }
  ],
  readings: [
    {
      title: 'Maschinenverordnung (EU) 2023/1230 – Neue Pflichten für Inverkehrbringer von Maschinen', author: 'Vock, M.', institution: 'Eidgenössische Koordinationskommission für Arbeitssicherheit (EKAS)',
      work: 'EKAS-Arbeitstagung 2024, Referat AT13', year: 2024, type: 'Norm/Amtlich', minutes: 30,
      url: 'https://www.ekas.admin.ch/fileadmin/Dokumente/Tagungen/Arbeitstagung/2024/Referate/DE/AT13_Vock_d_2024_-_Maschinenverordnung_EU_20231230_Neue_Pflichten_fuer_Inverkehrbringer_von_Maschinen.pdf',
      why: 'Behördenvortrag mit den neuen Pflichten und Fristen der Maschinenverordnung.',
      apa: 'Vock, M. (2024). *Maschinenverordnung (EU) 2023/1230 – Neue Pflichten für Inverkehrbringer von Maschinen* [Vortragsfolien]. EKAS-Arbeitstagung 2024. ' + ABGERUFEN + 'https://www.ekas.admin.ch/fileadmin/Dokumente/Tagungen/Arbeitstagung/2024/Referate/DE/AT13_Vock_d_2024_-_Maschinenverordnung_EU_20231230_Neue_Pflichten_fuer_Inverkehrbringer_von_Maschinen.pdf'
    },
    {
      title: 'Merkblatt EU-Maschinenverordnung', author: 'IHK Nürnberg für Mittelfranken', institution: 'IHK Nürnberg für Mittelfranken',
      work: 'Merkblätter Innovation und Technologie', year: 2024, type: 'Norm/Amtlich', minutes: 20,
      url: 'https://ihk-nuernberg.de/fileadmin/IHK_Nuernberg/Innovation-Technologie-Forschung/Merkblaetter/Merkblatt-EU-Maschinenverordnung.pdf',
      why: 'Kompakte Zusammenfassung der Pflichten und Übergangsregeln für Hersteller.',
      apa: 'IHK Nürnberg für Mittelfranken. (2024). *Merkblatt EU-Maschinenverordnung*. ' + ABGERUFEN + 'https://ihk-nuernberg.de/fileadmin/IHK_Nuernberg/Innovation-Technologie-Forschung/Merkblaetter/Merkblatt-EU-Maschinenverordnung.pdf'
    },
    brReading('Fehleraufdeckung modulinterner Fehler', 'safety/safety_hardware/int-error-detection/int-error-detection.html', 'Wann die internen Tests der Safety-Module laufen – relevant für die Bewertung bei der Abnahme.', 10)
  ],
  quiz: [
    { type: 'multi', q: 'Was gehört in eine Abnahmemappe für die funktionale Sicherheit?', options: ['Risikobeurteilung und Sicherheitskonzept', 'PL-Nachweise und Validierungsprotokoll mit CRC', 'Liste der Fehlerausschlüsse', 'Quellcode der HMI-Animationen'], correct: [0, 1, 2], explain: 'Nachweisdokumente der Sicherheit; HMI-Gestaltung gehört nicht dazu.' },
    { type: 'single', q: 'Warum sollte ein klemmender Quittiertaster in der Standard-SPS erkannt werden?', options: ['Weil sonst jede neue Anforderung ohne bewusste Handlung quittiert werden könnte und die Ursache verborgen bleibt', 'Weil Taster teuer sind', 'Weil die SafeLOGIC keine Taster kennt', 'Für die Energieeffizienz'], correct: 0, explain: 'Die PLCopen-Bausteine erkennen Dauersignale ebenfalls; die Standard-SPS meldet die Ursache verständlich und blockiert weitere Reset-Pulse.' },
    { type: 'single', q: 'Welcher Vorteil ergibt sich aus einem FB je Sicherheitsfunktion?', options: ['Wiederverwendbarkeit, einheitliche Diagnose und einfache Erweiterung um weitere Funktionen', 'Weniger Speicherbedarf als eine einzige Routine', 'Die Sicherheitsfunktion wird dadurch sicher', 'Man braucht keine Tests mehr'], correct: 0, explain: 'Die Architektur verbessert Wartbarkeit und Testbarkeit – sicher wird dadurch nichts, das bleibt Aufgabe der SafeLOGIC.' }
  ],
  exam: [
    { type: 'single', q: 'Ab welchem Datum gelten die Anforderungen der Maschinenverordnung für neu in Verkehr gebrachte Maschinen?', options: ['29.06.2023', '20.01.2027', '01.01.2026', '20.01.2030'], correct: 1, explain: 'Die Maschinenverordnung gilt ab 20.01.2027.' },
    { type: 'multi', q: 'Welche Informationen helfen bei der wiederkehrenden Prüfung einer Maschine?', options: ['Auslösezähler je Sicherheitsfunktion', 'Gespeicherte Erstauslöser', 'Hinweise auf Manipulationsverdacht', 'Die Lieblingsfarbe des Bedieners'], correct: [0, 1, 2], explain: 'Diese Daten zeigen, wie die Schutzeinrichtungen tatsächlich genutzt werden.' },
    { type: 'single', q: 'Eine Quittierung soll nur wirken, wenn keine Sicherheitsfunktion mehr angefordert ist. Warum?', options: ['Weil ein Reset bei anstehender Anforderung wirkungslos ist und eine falsche Erwartung beim Bediener weckt', 'Weil die CPU sonst abstürzt', 'Weil es die Norm verbietet zu quittieren', 'Das ist egal'], correct: 0, explain: 'Klare Bedienführung: erst Ursache beseitigen, dann quittieren, dann starten.' },
    { type: 'single', q: 'Was ist der Zweck einer Rückverfolgbarkeitstabelle Test ↔ Anforderung?', options: ['Nachweis, dass jede Anforderung geprüft wurde', 'Ersatz für die Validierung an der Maschine', 'Grundlage für die Stückliste', 'Formatierung des Codes'], correct: 0, explain: 'Sie belegt Vollständigkeit der Verifikation, wie im V-Modell gefordert.' }
  ],
  exercises: [
    {
      id: 'ex1', type: 'st', variant: 'schreiben',
      title: 'Audit-fähige Safety-Schnittstelle mit FB je Sicherheitsfunktion',
      task: ST_HINWEIS +
        'Die Simulation bildet drei Sicherheitsfunktionen der SafeLOGIC nach: Not-Halt (1), Schutztür (2), Lichtgitter (3). Für jede Funktion liest du `di…Ok` (Freigabe) und `di…RR` (Reset angefordert, wie „ResetRequest“ bei PLCopen V2). Eine steigende Flanke an `doResetRequest` quittiert alle quittierbaren Funktionen.\n\n' +
        '**1. FUNCTION_BLOCK `FB_SafetyFunction`** (in AS6: `.fun`-Datei einer Bibliothek)\n' +
        '- Eingänge `bOk`, `bResetReq`; Ausgänge `bDemand := NOT bOk AND NOT bResetReq`, `bNeedsAck := NOT bOk AND bResetReq`, `bTripped` (TRUE genau in dem Zyklus, in dem `bOk` von TRUE auf FALSE fällt), `nTrips : UDINT` (zählt Auslösungen; der Zustand „noch nie freigegeben“ beim Start ist keine Auslösung).\n\n' +
        '**2. Programm** mit drei Instanzen `fbEStop`, `fbDoor`, `fbLc`:\n' +
        '- **Quittierung:** Steigende Flanke an `diAck` erzeugt einen 100-ms-Puls `doResetRequest`, wenn mindestens eine Funktion quittierbar ist, **keine** Funktion mehr angefordert ist und der Taster nicht klemmt.\n' +
        '- **Klemmerkennung:** `diAck` länger als 3 s TRUE → `nDiag = 99`; solange er klemmt, keine Reset-Pulse.\n' +
        '- **Wiederanlaufsperre:** `doMotor` nur per Start-Flanke bei allen Freigaben und `diStop = TRUE`; fällt eine Freigabe oder `diStop`, sofort aus.\n' +
        '- **Erstauslöser** `nFirstOut` (1/2/3): erste Funktion mit `bTripped`, solange `nFirstOut = 0`; gelöscht beim nächsten erfolgreichen Start.\n' +
        '- **Diagnose `nDiag`** (Priorität): 99 Klemmer › `10 + n` erste angeforderte Funktion (11, 12, 13) › `20 + n` erste quittierbare Funktion (21, 22, 23) › 0.',
      hints: ['Rufe alle drei FB-Instanzen am Anfang jedes Zyklus auf, danach Flanken und Timer.', 'Der Erstauslöser nutzt `fbX.bTripped`, nicht den Pegel – so bleibt die Reihenfolge erhalten.', 'Beim Hochlauf sind alle Funktionen quittierbar (Code 21) – das ist gewollt.'],
      cycleMs: 10,
      io: [
        { name: 'diEStopDev', type: 'BOOL', dir: 'in', label: 'Not-Halt-Taster entriegelt', widget: 'switch', init: true },
        { name: 'diDoorDev', type: 'BOOL', dir: 'in', label: 'Schutztür geschlossen', widget: 'switch', init: true },
        { name: 'diLcDev', type: 'BOOL', dir: 'in', label: 'Lichtgitter frei', widget: 'switch', init: true },
        { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittiertaster', widget: 'button' },
        { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start', widget: 'button' },
        { name: 'diStop', type: 'BOOL', dir: 'in', label: 'Stopp (Öffner)', widget: 'switch', init: true },
        { name: 'diEStopOk', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Not-Halt Freigabe', widget: 'led' },
        { name: 'diEStopRR', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Not-Halt Reset angefordert', widget: 'led' },
        { name: 'diDoorOk', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Tür Freigabe', widget: 'led' },
        { name: 'diDoorRR', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Tür Reset angefordert', widget: 'led' },
        { name: 'diLcOk', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Lichtgitter Freigabe', widget: 'led' },
        { name: 'diLcRR', type: 'BOOL', dir: 'in', label: 'SafeLOGIC: Lichtgitter Reset angefordert', widget: 'led' },
        { name: 'doResetRequest', type: 'BOOL', dir: 'out', label: 'Reset-Anforderung an SafeLOGIC', widget: 'led' },
        { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Maschine läuft', widget: 'led' },
        { name: 'nDiag', type: 'INT', dir: 'out', label: 'Diagnose', widget: 'value' },
        { name: 'nFirstOut', type: 'INT', dir: 'out', label: 'Erstauslöser', widget: 'value' }
      ],
      scene: { type: 'conveyor', bind: { motor: 'doMotor' } },
      plant: {
        var: 'VAR\n\tbRstOld : BOOL;\n\tbRstEdge : BOOL;\nEND_VAR\n',
        code: `bRstEdge := doResetRequest AND NOT bRstOld;
bRstOld := doResetRequest;
IF NOT diEStopDev THEN
	diEStopOk := FALSE; diEStopRR := FALSE;
ELSIF NOT diEStopOk THEN
	IF bRstEdge THEN diEStopOk := TRUE; diEStopRR := FALSE; ELSE diEStopRR := TRUE; END_IF;
END_IF;
IF NOT diDoorDev THEN
	diDoorOk := FALSE; diDoorRR := FALSE;
ELSIF NOT diDoorOk THEN
	IF bRstEdge THEN diDoorOk := TRUE; diDoorRR := FALSE; ELSE diDoorRR := TRUE; END_IF;
END_IF;
IF NOT diLcDev THEN
	diLcOk := FALSE; diLcRR := FALSE;
ELSIF NOT diLcOk THEN
	IF bRstEdge THEN diLcOk := TRUE; diLcRR := FALSE; ELSE diLcRR := TRUE; END_IF;
END_IF;`
      },
      files: {
        main: `FUNCTION_BLOCK FB_SafetyFunction
	VAR_INPUT
		bOk : BOOL;
		bResetReq : BOOL;
	END_VAR
	VAR_OUTPUT
		bDemand : BOOL;
		bNeedsAck : BOOL;
		bTripped : BOOL;
		nTrips : UDINT;
	END_VAR
	(* TODO *)
	bDemand := NOT bOk;
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbEStop(bOk := diEStopOk, bResetReq := diEStopRR);
	fbDoor(bOk := diDoorOk, bResetReq := diDoorRR);
	fbLc(bOk := diLcOk, bResetReq := diLcRR);
	(* TODO: Quittierung, Klemmerkennung, Wiederanlaufsperre, Erstauslöser, Diagnose *)
	doResetRequest := diAck;
	doMotor := diEStopOk AND diDoorOk AND diLcOk AND diStart;
END_PROGRAM
`,
        var: 'VAR\n\tfbEStop : FB_SafetyFunction;\n\tfbDoor : FB_SafetyFunction;\n\tfbLc : FB_SafetyFunction;\nEND_VAR\n',
        typ: ''
      },
      solution: {
        main: `FUNCTION_BLOCK FB_SafetyFunction
	VAR_INPUT
		bOk : BOOL;
		bResetReq : BOOL;
	END_VAR
	VAR_OUTPUT
		bDemand : BOOL;
		bNeedsAck : BOOL;
		bTripped : BOOL;
		nTrips : UDINT;
	END_VAR
	VAR
		bOkOld : BOOL;
	END_VAR
	bTripped := bOkOld AND NOT bOk;
	IF bTripped THEN
		nTrips := nTrips + 1;
	END_IF;
	bOkOld := bOk;
	bNeedsAck := NOT bOk AND bResetReq;
	bDemand := NOT bOk AND NOT bResetReq;
END_FUNCTION_BLOCK

PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbEStop(bOk := diEStopOk, bResetReq := diEStopRR);
	fbDoor(bOk := diDoorOk, bResetReq := diDoorRR);
	fbLc(bOk := diLcOk, bResetReq := diLcRR);

	rtAck(CLK := diAck);
	rtStart(CLK := diStart);
	tonAckStuck(IN := diAck, PT := T#3s);

	bAllOk := diEStopOk AND diDoorOk AND diLcOk;
	bAnyDemand := fbEStop.bDemand OR fbDoor.bDemand OR fbLc.bDemand;
	bAnyAck := fbEStop.bNeedsAck OR fbDoor.bNeedsAck OR fbLc.bNeedsAck;

	(* Erstauslöser *)
	IF nFirstOut = 0 THEN
		IF fbEStop.bTripped THEN
			nFirstOut := 1;
		ELSIF fbDoor.bTripped THEN
			nFirstOut := 2;
		ELSIF fbLc.bTripped THEN
			nFirstOut := 3;
		END_IF;
	END_IF;

	(* Zentrale Quittierung *)
	tpReset(IN := rtAck.Q AND bAnyAck AND NOT bAnyDemand AND NOT tonAckStuck.Q, PT := T#100ms);
	doResetRequest := tpReset.Q;

	(* Wiederanlaufsperre *)
	IF NOT bAllOk OR NOT diStop THEN
		doMotor := FALSE;
	ELSIF rtStart.Q THEN
		doMotor := TRUE;
		nFirstOut := 0;
	END_IF;

	(* Diagnose nach Priorität *)
	IF tonAckStuck.Q THEN
		nDiag := 99;
	ELSIF fbEStop.bDemand THEN
		nDiag := 11;
	ELSIF fbDoor.bDemand THEN
		nDiag := 12;
	ELSIF fbLc.bDemand THEN
		nDiag := 13;
	ELSIF fbEStop.bNeedsAck THEN
		nDiag := 21;
	ELSIF fbDoor.bNeedsAck THEN
		nDiag := 22;
	ELSIF fbLc.bNeedsAck THEN
		nDiag := 23;
	ELSE
		nDiag := 0;
	END_IF;
END_PROGRAM
`,
        var: 'VAR\n\tfbEStop : FB_SafetyFunction;\n\tfbDoor : FB_SafetyFunction;\n\tfbLc : FB_SafetyFunction;\n\trtAck : R_TRIG;\n\trtStart : R_TRIG;\n\ttonAckStuck : TON;\n\ttpReset : TP;\n\tbAllOk : BOOL;\n\tbAnyDemand : BOOL;\n\tbAnyAck : BOOL;\nEND_VAR\n',
        typ: ''
      },
      tests: [
        { name: 'Hochlauf, Quittierung, Start', steps: [
          { cycles: 2 },
          { expect: 'nDiag = 21 AND NOT doMotor', msg: 'Beim Hochlauf sind alle Funktionen quittierbar: Code 21.' },
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { cycles: 2 },
          { expect: 'diEStopOk AND diDoorOk AND diLcOk AND nDiag = 0', msg: 'Eine Quittierung gibt alle quittierbaren Funktionen frei.' },
          { expect: 'fbEStop.nTrips = 0 AND fbDoor.nTrips = 0', msg: 'Der Hochlauf zählt nicht als Auslösung.' },
          { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { expect: 'doMotor', msg: 'Start-Flanke bei allen Freigaben startet die Maschine.' }
        ]},
        { name: 'Türauslösung mit Erstauslöser und Wiederanlaufsperre', steps: [
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { cycles: 2 },
          { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { set: { diDoorDev: false } }, { cycles: 2 },
          { expect: 'NOT doMotor AND nDiag = 12 AND nFirstOut = 2 AND fbDoor.nTrips = 1', msg: 'Tür offen: Motor aus, Code 12, Erstauslöser 2, Zähler 1.' },
          { set: { diDoorDev: true } }, { cycles: 2 },
          { expect: 'nDiag = 22', msg: 'Tür geschlossen: quittierbar, Code 22.' },
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } },
          { never: 'doMotor', ms: 200, msg: 'Nach Quittierung kein selbstständiger Anlauf.' },
          { expect: 'nFirstOut = 2', msg: 'Erstauslöser bleibt bis zum nächsten Start stehen.' },
          { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
          { expect: 'doMotor AND nFirstOut = 0', msg: 'Erfolgreicher Start löscht den Erstauslöser.' }
        ]},
        { name: 'Quittierung bei anstehender Anforderung wirkungslos', steps: [
          { cycles: 2 }, { set: { diDoorDev: false } }, { cycles: 2 },
          { set: { diAck: true } },
          { never: 'doResetRequest', ms: 200, msg: 'Solange eine Funktion angefordert ist, darf kein Reset-Puls kommen.' },
          { expect: 'nDiag = 12', msg: 'Die angeforderte Tür hat Vorrang vor quittierbaren Funktionen.' }
        ]},
        { name: 'Klemmender Quittiertaster', steps: [
          { cycles: 2 }, { set: { diAck: true } }, { ms: 3200 },
          { expect: 'nDiag = 99', msg: 'Quittiertaster > 3 s gedrückt: Code 99.' },
          { set: { diDoorDev: false } }, { cycles: 2 }, { set: { diDoorDev: true } }, { cycles: 3 },
          { expect: 'NOT diDoorOk AND NOT doResetRequest', msg: 'Bei klemmendem Taster darf keine Quittierung erfolgen.' },
          { set: { diAck: false } }, { cycles: 2 },
          { expect: 'nDiag = 22', msg: 'Nach Loslassen zeigt die Diagnose wieder die quittierbare Tür.' }
        ]},
        { name: 'Erstauslöser und Priorität', steps: [
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { cycles: 2 },
          { set: { diDoorDev: false } }, { cycles: 2 },
          { set: { diEStopDev: false } }, { cycles: 2 },
          { expect: 'nFirstOut = 2 AND nDiag = 11', msg: 'Tür war zuerst (nFirstOut = 2), Not-Halt hat Diagnose-Priorität (11).' }
        ]},
        { name: 'Auslösezähler', steps: [
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { ms: 200 },
          { set: { diEStopDev: false } }, { cycles: 2 }, { set: { diEStopDev: true } }, { cycles: 2 },
          { set: { diAck: true } }, { cycles: 3 }, { set: { diAck: false } }, { ms: 200 },
          { set: { diEStopDev: false } }, { cycles: 2 }, { set: { diEStopDev: true } }, { cycles: 2 },
          { expect: 'fbEStop.nTrips = 2 AND fbDoor.nTrips = 0 AND fbLc.nTrips = 0', msg: 'Zwei Not-Halt-Auslösungen, sonst keine.' }
        ]}
      ]
    }
  ],
  proof: true,
  badge: 'Safety-Systemarchitekt'
};

module.exports = [m1, m2, m3];
