'use strict';
// Bereich elektro – Level 2 (Junior → Prüfung Senior)
const { vid, rd, HINWEIS } = require('./refs');
const SVG = require('./svg');

const SECTIONS_VAR = 'VAR\n\taSections : ARRAY[0..8] OF REAL := [0.75, 1.0, 1.5, 2.5, 4.0, 6.0, 10.0, 16.0, 25.0];\n\trDropMax : REAL;\n\trAmin : REAL;\n\ti : INT;\n\tbFound : BOOL;\nEND_VAR\nVAR CONSTANT\n\trKappa : REAL := 56.0; (* Kupfer in m/(Ohm*mm2) *)\nEND_VAR\n';

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'elektro-2-leitung-bauelemente',
    level: 2,
    kind: 'lektion',
    title: 'Leitungsberechnung, Kondensator und Spule',
    summary: 'Spannungsfall und Querschnitt von Leitungen, Kondensator und Spule im Gleichstromkreis, Abschaltüberspannung und Freilaufdiode.',
    minutes: 180,
    req: ['elektro-1-projekt-steuerstromkreis'],
    briefing: 'Lange Leitungen sind Widerstände: Ein Ventil am Ende einer 50-m-Leitung bekommt nicht mehr 24 V, sondern weniger – und schaltet im schlimmsten Fall nicht sicher. Du lernst den Spannungsfall zu berechnen und den passenden Querschnitt zu wählen. Danach geht es um Kondensator und Spule: Ladekurven, Zeitkonstante τ und die gefährliche Abschaltüberspannung einer Spule, die du mit Freilaufdiode, Varistor oder RC-Glied begrenzt.',
    practice: 'Ein Sensor am Ende eines Förderbands meldet sporadisch Fehler, ein Magnetventil zieht bei Kälte nicht an, ein Relaiskontakt ist nach kurzer Zeit verbrannt: Ursache sind oft Spannungsfall auf der Leitung oder fehlende Schutzbeschaltung einer Induktivität.',
    transfer: {
      tia: 'Die Berechnung ist herstellerunabhängig; Siemens bietet mit SIMARIS Planungswerkzeuge für Leitungen, in der SPS rechnest du mit REAL wie in AS6.',
      codesys: 'In CODESYS deklarierst du die Normreihe ebenfalls als ARRAY OF REAL mit Initialwerten und durchsuchst sie mit einer FOR-Schleife.'
    },
    objectives: [
      {
        id: 'o1', title: 'Berechne den Spannungsfall auf einer Leitung',
        guide: {
          intro: 'Der Leitungswiderstand ist R = l / (κ · A). Bei Gleich- und Wechselstrom fließt der Strom hin und zurück – deshalb die doppelte Länge.',
          steps: [
            'Gleichstrom / Wechselstrom: ΔU = 2 · l · I / (κ · A) (ohmsche Last, bei Wechselstrom mit cos φ multiplizieren).',
            'Drehstrom (symmetrisch): ΔU = √3 · l · I · cos φ / (κ · A).',
            'Leitfähigkeit Kupfer: κ ≈ 56 m/(Ω·mm²) bei 20 °C (bei Betriebstemperatur geringer, z. B. ≈ 48).',
            'Rechne: 24 V DC, Ventil 0,5 A, Leitung 2 × 0,75 mm², l = 40 m → ΔU ≈ 0,95 V (4 %).',
            'Prüfe, ob die verbleibende Spannung im zulässigen Bereich des Verbrauchers liegt (Datenblatt, z. B. 24 V −15 %).'
          ],
          code: { lang: 'text', text: 'ΔU = 2 · 40 m · 0,5 A / (56 m/(Ω·mm²) · 0,75 mm²) = 0,95 V' },
          done: 'Erledigt, wenn du für eine Leitung den Spannungsfall in V und % berechnen und mit dem Grenzwert vergleichen kannst.',
          tip: 'Rechne bei 24-V-Steuerleitungen den Einschaltstrom von Ventilen und den Spannungsfall auf der 0-V-Leitung mit – beide addieren sich.'
        }
      },
      {
        id: 'o2', title: 'Wähle den Querschnitt aus der Normreihe',
        guide: {
          intro: 'Der Querschnitt muss drei Bedingungen erfüllen: Strombelastbarkeit, Schutz durch die Überstromschutzeinrichtung und zulässigen Spannungsfall.',
          steps: [
            'Stelle die Formel nach A um: A_min = 2 · l · I / (κ · ΔU_max).',
            'Wähle den nächstgrößeren Normquerschnitt: 0,75 – 1 – 1,5 – 2,5 – 4 – 6 – 10 – 16 – 25 mm².',
            'Prüfe die Strombelastbarkeit für Verlegeart und Häufung (Tabellen der DIN VDE 0298-4 bzw. DIN EN 60204-1).',
            'Prüfe, ob die vorgeschaltete Sicherung die Leitung schützt (I_n ≤ I_z).',
            'Dokumentiere die Auslegung im Kabelplan.'
          ],
          done: 'Erledigt, wenn du zu gegebener Länge, Strom und zulässigem Spannungsfall den Normquerschnitt bestimmen und begründen kannst.',
          tip: 'In Maschinen werden für Steuerleitungen im Schaltschrank häufig 0,75 mm² (oder kleiner bei Elektronik) verwendet – Mindestquerschnitte nennt DIN EN 60204-1.'
        }
      },
      {
        id: 'o3', title: 'Erkläre Kondensator und Spule im Gleichstromkreis',
        guide: {
          intro: 'Kondensatoren speichern Energie im elektrischen Feld, Spulen im magnetischen Feld. Beide reagieren mit der Zeitkonstante τ.',
          steps: [
            'Kondensator: Q = C · U; Ladung über R: τ = R · C; nach 5 τ gilt der Vorgang als abgeschlossen.',
            'Spule: τ = L / R; der Strom kann sich nicht sprunghaft ändern.',
            'Rechne: R = 10 kΩ, C = 100 µF → τ = 1 s; nach 1 τ ist der Kondensator auf ≈ 63 % geladen.',
            'Reihen-/Parallelschaltung: Kondensatoren parallel addieren sich (C = C1 + C2), Spulen in Reihe addieren sich.',
            'Ordne Anwendungen zu: Zwischenkreis eines Umrichters (C), Glättung im Netzteil (C), Schützspule und Ventilspule (L).'
          ],
          done: 'Erledigt, wenn du τ für eine RC- und eine RL-Schaltung berechnen und die Ladekurve skizzieren kannst.',
          tip: 'Große Kondensatoren (Zwischenkreis!) können nach dem Abschalten noch gefährliche Spannung führen – Entladezeit beachten. ' + HINWEIS
        }
      },
      {
        id: 'o4', title: 'Begrenze die Abschaltüberspannung von Spulen',
        guide: {
          intro: 'Beim Abschalten einer Spule entsteht eine hohe Induktionsspannung (u = −L · di/dt), die Kontakte abbrennt und Halbleiterausgänge zerstört.',
          steps: [
            'Freilaufdiode antiparallel zur Spule (Kathode an +): beste Begrenzung, aber verlängerte Abfallzeit.',
            'Diode + Z-Diode oder Varistor: begrenzt auf einen höheren Wert, schnellere Abfallzeit.',
            'RC-Glied: für AC-Spulen geeignet.',
            'Prüfe im Datenblatt deines Halbleiterausgangs, ob eine interne Löschschaltung vorhanden ist und welche Energie sie verträgt.',
            'Kontrolliere die Polung: Eine falsch gepolte Freilaufdiode erzeugt beim Einschalten einen Kurzschluss.'
          ],
          done: 'Erledigt, wenn du für eine 24-V-DC-Ventilspule eine Schutzbeschaltung auswählen und ihre Auswirkung auf die Abfallzeit erklären kannst.',
          tip: 'Bei schnell taktenden Ventilen kann die Freilaufdiode die Abfallzeit so stark verlängern, dass der Prozess leidet – dann Diode + Z-Diode einsetzen.'
        }
      }
    ],
    videos: [
      vid('dufall', 'Spannungsfall Schritt für Schritt berechnet.'),
      vid('leitung', 'Leitungsberechnung mit Blick auf die Abschlussprüfung.'),
      vid('freilauf', 'Abschaltüberspannung an Induktivitäten und Freilaufdiode.')
    ],
    readings: [
      rd('pannek', 'Kapitel zu Kapazität, Induktivität und Schaltvorgängen.'),
      rd('bibbTq', 'Einordnung: Leitungen dimensionieren und Betriebsmittel auswählen als Kompetenzen des Berufs.')
    ],
    quiz: [
      { type: 'numeric', q: 'Eine 24-V-DC-Leitung (Kupfer, κ = 56 m/(Ω·mm²)) hat die einfache Länge l = {l} m und den Querschnitt 1,5 mm². Es fließen I = {I} A. Wie groß ist der Spannungsfall?',
        params: { l: [10, 100, 5], I: [1, 6, 0.5] }, formula: '2 * l * I / (56 * 1.5)', unit: 'V', tol: 0.02,
        explain: 'ΔU = 2 · l · I / (κ · A).' },
      { type: 'numeric', q: 'Ein Kondensator C = {C} µF wird über R = {R} kΩ geladen. Wie groß ist die Zeitkonstante τ?',
        params: { C: [10, 470, 10], R: [1, 47, 1] }, formula: 'C * R / 1000', unit: 's', tol: 0.01,
        explain: 'τ = R · C; kΩ · µF = 10³ · 10⁻⁶ = 10⁻³ s.' },
      { type: 'single', q: 'Wie wird eine Freilaufdiode an einer 24-V-DC-Relaisspule angeschlossen?',
        options: ['In Reihe zur Spule', 'Antiparallel zur Spule, Kathode an +24 V', 'Parallel zur Spule, Anode an +24 V', 'Zwischen Spule und Schutzleiter'], correct: 1,
        explain: 'Im Betrieb sperrt die Diode; beim Abschalten führt sie den Spulenstrom im Kreis weiter.' }
    ],
    exam: [
      { type: 'numeric', q: 'Ein Ventil mit 0,5 A soll über eine Leitung mit l = {l} m an 24 V DC betrieben werden. Der Spannungsfall darf 5 % nicht überschreiten. Wie groß ist der rechnerische Mindestquerschnitt (κ = 56)?',
        params: { l: [20, 120, 10] }, formula: '2 * l * 0.5 / (56 * 1.2)', unit: 'mm²', tol: 0.02,
        explain: 'A_min = 2 · l · I / (κ · ΔU_max), ΔU_max = 5 % von 24 V = 1,2 V.' },
      { type: 'numeric', q: 'Drehstrommotor: I = {I} A, cos φ = 0,85, Leitung 2,5 mm² Cu, l = {l} m. Wie groß ist der Spannungsfall (κ = 56)?',
        params: { I: [5, 20, 1], l: [20, 80, 5] }, formula: 'sqrt(3) * l * I * 0.85 / (56 * 2.5)', unit: 'V', tol: 0.02,
        explain: 'ΔU = √3 · l · I · cos φ / (κ · A).' },
      { type: 'single', q: 'Nach wie vielen Zeitkonstanten gilt der Ladevorgang eines Kondensators praktisch als abgeschlossen?',
        options: ['1 τ', '2 τ', '5 τ', '10 τ'], correct: 2, explain: 'Nach 5 τ ist die Spannung auf über 99 % des Endwerts angestiegen.' },
      { type: 'multi', q: 'Welche Maßnahmen begrenzen die Abschaltüberspannung einer DC-Spule?',
        options: ['Freilaufdiode', 'Diode mit Z-Diode', 'Varistor', 'Größerer Leitungsquerschnitt'], correct: [0, 1, 2],
        explain: 'Der Querschnitt hat keinen nennenswerten Einfluss auf die Induktionsspannung.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Querschnitt automatisch auswählen',
        task: 'Für ein Engineering-Werkzeug soll das Programm zu einer 24-V-DC-Leitung den kleinsten zulässigen Normquerschnitt bestimmen.\n\n' +
          '**Anforderungen:**\n' +
          '1. Eingänge: einfache Leitungslänge `rLength` (m), Strom `rCurrent` (A), Nennspannung `rUn` (V), zulässiger Spannungsfall `rMaxDropPct` (%).\n' +
          '2. Berechne `rAmin = 2 · l · I / (κ · ΔU_max)` mit κ = 56 und ΔU_max = rUn · rMaxDropPct / 100.\n' +
          '3. Wähle aus `aSections` (aufsteigend, 0,75 … 25 mm²) den **kleinsten** Querschnitt ≥ rAmin und gib ihn in `rSection` aus.\n' +
          '4. Berechne mit diesem Querschnitt den tatsächlichen Spannungsfall `rDropV` (V) und `rDropPct` (%).\n' +
          '5. Reicht auch 25 mm² nicht: `bNoSection` = TRUE, `rSection`, `rDropV`, `rDropPct` = 0.\n' +
          '6. Bei unsinnigen Eingaben (rLength < 0, rCurrent < 0, rUn ≤ 0 oder rMaxDropPct ≤ 0): `bInputError` = TRUE und alle Ergebnisse 0.',
        hints: ['Durchsuche das Array mit FOR i := 0 TO 8 und EXIT, sobald ein passender Querschnitt gefunden ist.', 'Setze bNoSection und bInputError in jedem Zyklus neu.'],
        cycleMs: 10,
        io: [
          { name: 'rLength', type: 'REAL', dir: 'in', label: 'Leitungslänge (einfach)', widget: 'slider', min: 0, max: 500, unit: 'm', init: 50 },
          { name: 'rCurrent', type: 'REAL', dir: 'in', label: 'Strom', widget: 'slider', min: 0, max: 20, unit: 'A', init: 2 },
          { name: 'rUn', type: 'REAL', dir: 'in', label: 'Nennspannung', widget: 'slider', min: 0, max: 48, unit: 'V', init: 24 },
          { name: 'rMaxDropPct', type: 'REAL', dir: 'in', label: 'Zulässiger Spannungsfall', widget: 'slider', min: 0, max: 10, unit: '%', init: 5 },
          { name: 'rSection', type: 'REAL', dir: 'out', label: 'Gewählter Querschnitt', widget: 'value', unit: 'mm²' },
          { name: 'rDropV', type: 'REAL', dir: 'out', label: 'Spannungsfall', widget: 'value', unit: 'V' },
          { name: 'rDropPct', type: 'REAL', dir: 'out', label: 'Spannungsfall', widget: 'gauge', min: 0, max: 10, unit: '%' },
          { name: 'bNoSection', type: 'BOOL', dir: 'out', label: 'Kein Querschnitt ausreichend', widget: 'led' },
          { name: 'bInputError', type: 'BOOL', dir: 'out', label: 'Eingabefehler', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Mindestquerschnitt berechnen und aus aSections auswählen\n\trSection := aSections[0];\nEND_PROGRAM\n',
          var: SECTIONS_VAR,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	bInputError := (rLength < 0.0) OR (rCurrent < 0.0) OR (rUn <= 0.0) OR (rMaxDropPct <= 0.0);
	bNoSection := FALSE;
	rSection := 0.0;
	rDropV := 0.0;
	rDropPct := 0.0;

	IF NOT bInputError THEN
		rDropMax := rUn * rMaxDropPct / 100.0;
		rAmin := 2.0 * rLength * rCurrent / (rKappa * rDropMax);
		bFound := FALSE;
		FOR i := 0 TO 8 DO
			IF aSections[i] >= rAmin THEN
				rSection := aSections[i];
				bFound := TRUE;
				EXIT;
			END_IF
		END_FOR
		IF bFound THEN
			rDropV := 2.0 * rLength * rCurrent / (rKappa * rSection);
			rDropPct := rDropV / rUn * 100.0;
		ELSE
			bNoSection := TRUE;
			rSection := 0.0;
		END_IF
	END_IF
END_PROGRAM
`,
          var: SECTIONS_VAR,
          typ: ''
        },
        tests: [
          { name: '50 m, 2 A, 24 V, 5 % → 4 mm²', steps: [
            { set: { rLength: 50.0, rCurrent: 2.0, rUn: 24.0, rMaxDropPct: 5.0 } }, { cycles: 2 },
            { expect: 'rSection = 4.0', msg: 'A_min ≈ 2,98 mm² → nächster Normquerschnitt 4 mm².' },
            { expect: 'ABS(rDropV - 0.8929) < 0.005', msg: 'ΔU = 200 / (56 · 4) ≈ 0,893 V.' },
            { expect: 'ABS(rDropPct - 3.72) < 0.02' },
            { expect: 'NOT bNoSection AND NOT bInputError' }
          ]},
          { name: 'Kurze Leitung → kleinster Querschnitt', steps: [
            { set: { rLength: 10.0, rCurrent: 0.5, rUn: 24.0, rMaxDropPct: 5.0 } }, { cycles: 2 },
            { expect: 'rSection = 0.75', msg: 'A_min ≈ 0,15 mm² → 0,75 mm² (kleinster Wert der Reihe).' },
            { expect: 'ABS(rDropV - 0.2381) < 0.002' }
          ]},
          { name: 'Zu lang: kein Querschnitt ausreichend', steps: [
            { set: { rLength: 300.0, rCurrent: 5.0, rUn: 24.0, rMaxDropPct: 5.0 } }, { cycles: 2 },
            { expect: 'bNoSection', msg: 'A_min ≈ 44,6 mm² > 25 mm² muss gemeldet werden.' },
            { expect: 'rSection = 0.0 AND rDropV = 0.0' }
          ]},
          { name: 'Ungültige Eingabe', steps: [
            { set: { rLength: 20.0, rCurrent: -1.0, rUn: 24.0, rMaxDropPct: 5.0 } }, { cycles: 2 },
            { expect: 'bInputError AND rSection = 0.0', msg: 'Negativer Strom ist ein Eingabefehler.' },
            { set: { rCurrent: 1.0, rMaxDropPct: 0.0 } }, { cycles: 2 },
            { expect: 'bInputError', msg: 'Zulässiger Spannungsfall 0 % → Division durch null vermeiden, Eingabefehler melden.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-2-wechsel-drehstrom',
    level: 2,
    kind: 'lektion',
    title: 'Wechselstrom und Drehstrom',
    summary: 'Effektivwert, Blindwiderstände, Wirk-, Blind- und Scheinleistung, cos φ sowie Stern- und Dreieckschaltung im Drehstromnetz.',
    minutes: 180,
    req: ['elektro-2-leitung-bauelemente'],
    briefing: 'Antriebe, Heizungen und Netzteile hängen am 400/230-V-Drehstromnetz. Du lernst die Kenngrößen sinusförmiger Wechselgrößen (Scheitelwert, Effektivwert, Frequenz), das Verhalten von Spule und Kondensator bei Wechselstrom und die drei Leistungsarten. Im Drehstromteil berechnest du Ströme und Leistungen in Stern- und Dreieckschaltung und verstehst, warum der Leistungsfaktor cos φ für Netzbetreiber und Energiekosten wichtig ist.',
    practice: 'Auf dem Typenschild eines Motors stehen 400 V, 12 A und cos φ = 0,82 – daraus berechnest du die aufgenommene Wirkleistung. Mit einer Stromzange prüfst du, ob alle drei Außenleiter gleich belastet sind.',
    transfer: {
      tia: 'Siemens-Energiemessmodule (z. B. AI Energy Meter) liefern P, Q, S und cos φ direkt; die Formeln dahinter sind dieselben.',
      codesys: 'Beckhoff-Leistungsmessklemmen liefern ebenfalls P/Q/S; für eigene Auswertungen nutzt du SQRT und die Standard-Mathefunktionen.'
    },
    objectives: [
      {
        id: 'o1', title: 'Bestimme die Kenngrößen von Wechselgrößen',
        guide: {
          intro: 'Eine Sinusspannung wird durch Scheitelwert, Effektivwert, Frequenz und Phasenlage beschrieben.',
          steps: [
            'Effektivwert: U = Û / √2 (230 V Effektivwert ↔ ≈ 325 V Scheitelwert).',
            'Periodendauer T = 1 / f; bei 50 Hz sind das 20 ms.',
            'Kreisfrequenz ω = 2 · π · f.',
            'Unterscheide Effektivwertmessung (True RMS) und Mittelwertmessung bei verzerrten Signalen (z. B. Umrichterausgang).',
            'Rechne die Spitzenspannung zwischen zwei Außenleitern: 400 V · √2 ≈ 566 V.'
          ],
          done: 'Erledigt, wenn du aus Effektivwert, Scheitelwert, Spitze-Spitze-Wert und Frequenz jede andere Größe berechnen kannst.',
          tip: 'Für Messungen an Umrichtern brauchst du ein True-RMS-Messgerät mit Tiefpassfilter.'
        }
      },
      {
        id: 'o2', title: 'Berechne Blindwiderstände und Impedanz',
        guide: {
          intro: 'Spule und Kondensator haben bei Wechselstrom frequenzabhängige Blindwiderstände.',
          steps: [
            'Induktiver Blindwiderstand: X_L = 2 · π · f · L (Strom eilt der Spannung um 90° nach).',
            'Kapazitiver Blindwiderstand: X_C = 1 / (2 · π · f · C) (Strom eilt um 90° vor).',
            'Reihenschaltung R–L: Z = √(R² + X_L²), cos φ = R / Z.',
            'Rechne: L = 0,1 H bei 50 Hz → X_L ≈ 31,4 Ω.',
            'Zeichne das Zeigerdiagramm für eine R-L-Reihenschaltung.'
          ],
          done: 'Erledigt, wenn du für eine R-L-Reihenschaltung Z, I und φ berechnen kannst.',
          tip: 'Merkhilfe: „Beim Kondensator eilt der Strom vor, bei Induktivitäten kommt er zu spät.“'
        }
      },
      {
        id: 'o3', title: 'Berechne Wirk-, Blind- und Scheinleistung',
        guide: {
          intro: 'S = U · I, P = S · cos φ, Q = S · sin φ, S² = P² + Q² (Leistungsdreieck).',
          steps: [
            'Einphasig: P = U · I · cos φ.',
            'Drehstrom (symmetrisch): P = √3 · U · I · cos φ mit U = Außenleiterspannung, I = Außenleiterstrom.',
            'Blindleistungskompensation: Kondensatoren liefern kapazitive Blindleistung und verbessern cos φ.',
            'Rechne: 400 V, 10 A, cos φ = 0,9 → S ≈ 6,93 kVA, P ≈ 6,24 kW, Q ≈ 3,02 kvar.',
            'Bestimme, wie sich ein schlechter cos φ auf den Strom (und damit auf Leitung und Sicherung) auswirkt.'
          ],
          done: 'Erledigt, wenn du aus Typenschilddaten S, P und Q eines Motors berechnen kannst.',
          tip: 'Die Typenschildleistung eines Motors ist die mechanische Abgabeleistung – für die elektrische Aufnahme teilst du durch den Wirkungsgrad.'
        }
      },
      {
        id: 'o4', title: 'Unterscheide Stern- und Dreieckschaltung',
        guide: {
          intro: 'Im 400/230-V-Netz liegen zwischen den Außenleitern 400 V, zwischen Außenleiter und N 230 V.',
          steps: [
            'Stern (Y): U_Strang = U / √3, I_Strang = I_Leiter.',
            'Dreieck (Δ): U_Strang = U, I_Leiter = √3 · I_Strang.',
            'Bei gleichen Strangwiderständen ist die Leistung in Dreieck dreimal so groß wie in Stern.',
            'Lies am Motorklemmbrett ab, wie die Brücken für Stern bzw. Dreieck gesetzt werden (U1-V1-W1, W2-U2-V2).',
            'Rechne: Heizung mit 3 × 53 Ω im Stern an 400 V → I ≈ 4,36 A, P ≈ 3 kW; im Dreieck → P ≈ 9 kW.'
          ],
          done: 'Erledigt, wenn du für eine symmetrische Last Strang- und Leiterwerte in Stern und Dreieck berechnen kannst.',
          tip: 'Ein im Stern betriebener Motor mit Brückenfehler (eine Brücke fehlt) läuft nur zweiphasig – er brummt und erwärmt sich schnell.'
        }
      }
    ],
    videos: [
      vid('effektiv', 'Effektiv- und Scheitelwert einfach erklärt.'),
      vid('sterndreieck', 'Stern- und Dreieckschaltung im direkten Vergleich.'),
      vid('cosphi', 'Schein-, Wirk- und Blindleistung anschaulich berechnet.')
    ],
    readings: [
      rd('pannek', 'Kapitel zu Wechselstrom, Wechselstromwiderständen und Drehstrom.'),
      rd('hszg', 'Praktikumsanleitung mit Strom-, Spannungs- und Leistungszusammenhängen bei Stern und Dreieck.')
    ],
    quiz: [
      { type: 'numeric', q: 'Eine Sinusspannung hat den Effektivwert U = {U} V. Wie groß ist der Scheitelwert?',
        params: { U: [24, 400, 2] }, formula: 'U * sqrt(2)', unit: 'V', tol: 0.01, explain: 'Û = U · √2.' },
      { type: 'numeric', q: 'Ein Drehstrommotor nimmt an 400 V den Strom I = {I} A bei cos φ = {c} auf. Wie groß ist die aufgenommene Wirkleistung?',
        params: { I: [2, 40, 1], c: [0.7, 0.95, 0.05] }, formula: 'sqrt(3) * 400 * I * c / 1000', unit: 'kW', tol: 0.02,
        explain: 'P = √3 · U · I · cos φ.' },
      { type: 'single', q: 'Eine symmetrische ohmsche Last wird von Stern auf Dreieck umgeklemmt (gleiche Netzspannung). Wie ändert sich die Leistung?',
        options: ['Sie halbiert sich', 'Sie bleibt gleich', 'Sie verdreifacht sich', 'Sie steigt um √3'], correct: 2,
        explain: 'Strangspannung steigt um √3, damit auch der Strangstrom → Strangleistung × 3.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine Spule mit L = {L} mH liegt an 230 V / 50 Hz (Wicklungswiderstand vernachlässigt). Wie groß ist der Strom?',
        params: { L: [100, 1000, 50] }, formula: '230 / (2 * PI * 50 * L / 1000)', unit: 'A', tol: 0.02,
        explain: 'X_L = 2πfL; I = U / X_L.' },
      { type: 'numeric', q: 'Ein Verbraucher hat S = {S} kVA und P = {P} kW. Wie groß ist die Blindleistung?',
        params: { S: [10, 20, 1], P: [5, 9, 1] }, formula: 'sqrt(S * S - P * P)', unit: 'kvar', tol: 0.02,
        explain: 'Q = √(S² − P²).' },
      { type: 'numeric', q: 'Drei gleiche Heizwiderstände R = {R} Ω sind im Dreieck an 400 V angeschlossen. Wie groß ist der Außenleiterstrom?',
        params: { R: [20, 200, 10] }, formula: 'sqrt(3) * 400 / R', unit: 'A', tol: 0.02,
        explain: 'I_Strang = 400 V / R; I_Leiter = √3 · I_Strang.' },
      { type: 'single', q: 'Wie groß ist die Spannung zwischen Außenleiter und Neutralleiter im 400/230-V-Netz?',
        options: ['400 V', '230 V', '133 V', '690 V'], correct: 1, explain: 'U_Strang = 400 V / √3 ≈ 230 V.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Leistungsmessung am Motorabgang',
        task: 'Ein Messumformer liefert die Außenleiterspannung, die drei Außenleiterströme und cos φ eines Motorabgangs.\n\n' +
          '**Anforderungen:**\n' +
          '1. Berechne den Mittelwert der Ströme `rIavg`.\n' +
          '2. Berechne `rS` (kVA), `rP` (kW) und `rQ` (kvar) mit √3 · U · I_avg (Q über sin φ = √(1 − cos² φ)).\n' +
          '3. Unsymmetrie: `rUnbalPct` = größte Abweichung eines Stroms vom Mittelwert in % des Mittelwerts. Ist rIavg < 0,1 A, ist rUnbalPct = 0.\n' +
          '4. `bUnbalance` = TRUE bei rUnbalPct > 10 %.\n' +
          '5. `bLowCosPhi` = TRUE, wenn cos φ < 0,9 und rIavg ≥ 0,1 A.\n' +
          '6. Ungültige Eingaben (rU ≤ 0, cos φ < 0 oder > 1): `bInputError` = TRUE, rS, rP, rQ = 0.',
        hints: ['Die Funktion SQRT ist verfügbar; √3 ≈ 1.7320508.', 'MAX(ABS(a), ABS(b), ABS(c)) oder verschachtelte MAX-Aufrufe für die größte Abweichung.'],
        cycleMs: 10,
        io: [
          { name: 'rU', type: 'REAL', dir: 'in', label: 'Außenleiterspannung', widget: 'slider', min: 0, max: 690, unit: 'V', init: 400 },
          { name: 'rI1', type: 'REAL', dir: 'in', label: 'Strom L1', widget: 'slider', min: 0, max: 50, unit: 'A' },
          { name: 'rI2', type: 'REAL', dir: 'in', label: 'Strom L2', widget: 'slider', min: 0, max: 50, unit: 'A' },
          { name: 'rI3', type: 'REAL', dir: 'in', label: 'Strom L3', widget: 'slider', min: 0, max: 50, unit: 'A' },
          { name: 'rCosPhi', type: 'REAL', dir: 'in', label: 'cos φ', widget: 'slider', min: 0, max: 1, init: 0.85 },
          { name: 'rIavg', type: 'REAL', dir: 'out', label: 'Mittlerer Strom', widget: 'value', unit: 'A' },
          { name: 'rS', type: 'REAL', dir: 'out', label: 'Scheinleistung', widget: 'value', unit: 'kVA' },
          { name: 'rP', type: 'REAL', dir: 'out', label: 'Wirkleistung', widget: 'gauge', min: 0, max: 40, unit: 'kW' },
          { name: 'rQ', type: 'REAL', dir: 'out', label: 'Blindleistung', widget: 'value', unit: 'kvar' },
          { name: 'rUnbalPct', type: 'REAL', dir: 'out', label: 'Unsymmetrie', widget: 'value', unit: '%' },
          { name: 'bUnbalance', type: 'BOOL', dir: 'out', label: 'Unsymmetrie > 10 %', widget: 'led' },
          { name: 'bLowCosPhi', type: 'BOOL', dir: 'out', label: 'cos φ zu klein', widget: 'led' },
          { name: 'bInputError', type: 'BOOL', dir: 'out', label: 'Eingabefehler', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO\n\trIavg := (rI1 + rI2 + rI3) / 3.0;\n\trP := rU * rIavg * rCosPhi / 1000.0; (* Achtung: Faktor fehlt *)\nEND_PROGRAM\n',
          var: 'VAR\n\trSinPhi : REAL;\n\trMaxDev : REAL;\nEND_VAR\nVAR CONSTANT\n\tSQRT3 : REAL := 1.7320508;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	rIavg := (rI1 + rI2 + rI3) / 3.0;
	bInputError := (rU <= 0.0) OR (rCosPhi < 0.0) OR (rCosPhi > 1.0);

	IF bInputError THEN
		rS := 0.0;
		rP := 0.0;
		rQ := 0.0;
	ELSE
		rSinPhi := SQRT(1.0 - rCosPhi * rCosPhi);
		rS := SQRT3 * rU * rIavg / 1000.0;
		rP := rS * rCosPhi;
		rQ := rS * rSinPhi;
	END_IF

	IF rIavg >= 0.1 THEN
		rMaxDev := MAX(ABS(rI1 - rIavg), ABS(rI2 - rIavg));
		rMaxDev := MAX(rMaxDev, ABS(rI3 - rIavg));
		rUnbalPct := rMaxDev / rIavg * 100.0;
	ELSE
		rUnbalPct := 0.0;
	END_IF
	bUnbalance := rUnbalPct > 10.0;
	bLowCosPhi := (rCosPhi < 0.9) AND (rIavg >= 0.1);
END_PROGRAM
`,
          var: 'VAR\n\trSinPhi : REAL;\n\trMaxDev : REAL;\nEND_VAR\nVAR CONSTANT\n\tSQRT3 : REAL := 1.7320508;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Symmetrische Last 400 V / 10 A / cos φ 0,95', steps: [
            { set: { rU: 400.0, rI1: 10.0, rI2: 10.0, rI3: 10.0, rCosPhi: 0.95 } }, { cycles: 2 },
            { expect: 'ABS(rS - 6.928) < 0.01', msg: 'S = √3 · 400 V · 10 A ≈ 6,93 kVA.' },
            { expect: 'ABS(rP - 6.582) < 0.01', msg: 'P = S · cos φ ≈ 6,58 kW.' },
            { expect: 'ABS(rQ - 2.163) < 0.01', msg: 'Q = S · sin φ ≈ 2,16 kvar.' },
            { expect: 'NOT bUnbalance AND NOT bLowCosPhi AND NOT bInputError' }
          ]},
          { name: 'Unsymmetrie wird erkannt', steps: [
            { set: { rU: 400.0, rI1: 10.0, rI2: 10.0, rI3: 13.0, rCosPhi: 0.9 } }, { cycles: 2 },
            { expect: 'ABS(rUnbalPct - 18.18) < 0.1', msg: 'Mittelwert 11 A, größte Abweichung 2 A → 18,2 %.' },
            { expect: 'bUnbalance' },
            { set: { rI3: 10.5 } }, { cycles: 2 },
            { expect: 'NOT bUnbalance', msg: '≈ 3,3 % Unsymmetrie ist zulässig.' }
          ]},
          { name: 'Schlechter cos φ', steps: [
            { set: { rU: 400.0, rI1: 8.0, rI2: 8.0, rI3: 8.0, rCosPhi: 0.75 } }, { cycles: 2 },
            { expect: 'bLowCosPhi', msg: 'cos φ = 0,75 < 0,9 muss gemeldet werden.' }
          ]},
          { name: 'Stillstand und ungültige Eingaben', steps: [
            { set: { rU: 400.0, rI1: 0.0, rI2: 0.0, rI3: 0.0, rCosPhi: 0.5 } }, { cycles: 2 },
            { expect: 'rUnbalPct = 0.0 AND NOT bLowCosPhi', msg: 'Ohne Strom keine Unsymmetrie- oder cos-φ-Meldung.' },
            { set: { rI1: 5.0, rI2: 5.0, rI3: 5.0, rCosPhi: 1.2 } }, { cycles: 2 },
            { expect: 'bInputError AND rP = 0.0', msg: 'cos φ > 1 ist ungültig.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-2-projekt-wendeschuetz',
    level: 2,
    kind: 'projekt',
    title: 'Praxisprojekt: Schaltpläne lesen und Wendeschützschaltung',
    summary: 'Referenzkennzeichnung nach EN IEC 81346, Schaltzeichen nach IEC 60617, Klemmenplan – und eine Wendeschützsteuerung mit Verriegelung und Umschaltpause in ST.',
    minutes: 300,
    req: ['elektro-2-wechsel-drehstrom'],
    briefing: 'Bevor du ein Programm für einen Motorabgang schreibst, musst du den Schaltplan lesen können: Wer ist -QA1, wo liegt +S1, welche Klemme ist -X1:12? Du lernst die Referenzkennzeichnung nach DIN EN IEC 81346, die wichtigsten Schaltzeichen nach IEC 60617 und den Aufbau von Stromlauf- und Klemmenplänen. Danach setzt du die Wendeschützschaltung um: Rechts-/Linkslauf mit Selbsthaltung, gegenseitiger Verriegelung und Umschaltpause – die SPS ersetzt dabei nicht die elektrische Schützverriegelung im Schaltschrank.',
    practice: 'Rolltore, Hubtische und Förderer mit Richtungswechsel nutzen Wendeschützschaltungen. Ziehen beide Schütze gleichzeitig an, entsteht ein Kurzschluss zwischen zwei Außenleitern – deshalb wird doppelt verriegelt: elektrisch über Öffner und im Programm.',
    transfer: {
      tia: 'In TIA Portal programmierst du die Verriegelung identisch; EPLAN-Pläne mit 81346-Kennzeichnung sind in Siemens- wie in B&R-Projekten üblich.',
      codesys: 'In CODESYS bildest du die Umschaltpause ebenfalls mit TON ab; die Hardware-Verriegelung (mechanisch/elektrisch) bleibt Pflicht.'
    },
    objectives: [
      {
        id: 'o1', title: 'Lies Referenzkennzeichen nach EN IEC 81346',
        guide: {
          intro: 'Ein Referenzkennzeichen beschreibt ein Objekt aus verschiedenen Aspekten: Funktion (=), Produkt (-), Ort (+).',
          steps: [
            'Vorzeichen: „=“ Funktionsaspekt (z. B. =FOE Förderer), „-“ Produktaspekt (z. B. -QA1), „+“ Ortsaspekt (z. B. +S1 Schaltschrank 1).',
            'Kennbuchstaben (Klassen) nach DIN EN IEC 81346-2: z. B. B (Sensor), F (Schutz), K (Signalverarbeitung, Relais, SPS), M (Antrieb), P (Anzeige), Q (Schalten von Energie, Leistungsschütz), S (manuelle Betätigung), T (Umwandlung, z. B. Netzteil), W (Leiten, Kabel), X (Verbinden, Klemmen).',
            'Neuere Pläne nutzen zweistellige Unterklassen (z. B. QA für Leistungsschalter/Schütz, BG für Näherungssensor, SF für Taster, PF für Meldeleuchte).',
            'Ältere Pläne nach DIN 40719 kennzeichnen Schütze oft noch mit -K1 – beides wirst du in der Praxis finden.',
            'Suche in einem realen EPLAN-Plan deiner Maschine je ein Beispiel für jeden Aspekt.'
          ],
          done: 'Erledigt, wenn du für fünf Betriebsmittel eines realen Plans Funktion, Ort und Klasse benennen kannst.',
          tip: 'Die Kennzeichnung ist kein Selbstzweck: Mit „+S1-XD1:12“ findet der Servicetechniker die Klemme ohne Suchen.',
          link: { label: 'mkDoc: Normen für die Schaltplanerstellung', url: 'https://ww3.cad.de/foren/ubb/uploads/Stelvio/Schaltplanrelevante_Normen.pdf' }
        }
      },
      {
        id: 'o2', title: 'Erkenne Schaltzeichen und Planarten',
        guide: {
          intro: 'Schaltzeichen nach IEC 60617 sind international – Planarten strukturieren die Dokumentation.',
          steps: [
            'Schließer, Öffner, Wechsler, Spule, Taster, Meldeleuchte, Sicherung, Motor, Klemme – zeichne jedes Symbol einmal selbst.',
            'Stromlaufplan in aufgelöster Darstellung: Haupt- und Steuerstromkreis getrennt, Signalfluss von oben nach unten, Strompfade nummeriert.',
            'Kontaktspiegel unter der Spule zeigt, in welchem Strompfad die Kontakte des Schützes liegen.',
            'Klemmenplan: welche Ader auf welche Klemme, mit Ziel und Brücken.',
            'Übersichtsschaltplan: einpolige Darstellung, z. B. Energieverteilung.'
          ],
          done: 'Erledigt, wenn du an einem Plan für einen Kontakt das zugehörige Schütz und umgekehrt für ein Schütz alle Kontakte findest.',
          tip: 'Kontakte werden im Plan immer im unbetätigten Zustand gezeichnet (Anlage spannungslos).'
        }
      },
      {
        id: 'o3', title: 'Verstehe die Wendeschützschaltung',
        guide: {
          intro: 'Durch Vertauschen von zwei Außenleitern ändert sich die Drehrichtung des Drehfelds.',
          steps: [
            'Hauptstromkreis: -Q1 (Rechts) schaltet L1-L2-L3, -Q2 (Links) schaltet L3-L2-L1 auf den Motor.',
            'Schützverriegelung: Öffner von Q2 im Spulenkreis von Q1 und umgekehrt.',
            'Tasterverriegelung: Öffner des Gegenrichtungstasters im eigenen Pfad – ermöglicht direktes Umschalten.',
            'Zusätzlich häufig: mechanische Verriegelung der beiden Schütze.',
            'Für die Steuerung: Umschaltpause vorsehen, damit der Lichtbogen des abschaltenden Schützes sicher erloschen ist, und Reversieren unter Last mit Blick auf Mechanik und Strom bewerten.'
          ],
          done: 'Erledigt, wenn du in der Abbildung der Wendeschützschaltung beide Verriegelungskontakte zeigen und ihre Funktion erklären kannst.',
          tip: 'Die Software-Verriegelung ist eine zusätzliche Maßnahme. Sie ersetzt nie die elektrische Verriegelung über Hilfskontakte im Schaltschrank.'
        }
      },
      {
        id: 'o4', title: 'Programmiere die Wendeschützsteuerung',
        guide: {
          intro: 'Du realisierst Rechts-/Linkslauf mit Selbsthaltung, Verriegelung und 300 ms Umschaltpause.',
          steps: [
            'Speichere die gewünschte Richtung in einer Zustandsvariablen (0 = Stopp, 1 = Rechts, 2 = Links).',
            'Bei einem Richtungswechsel zuerst auf 0 schalten und eine Anforderung merken.',
            'Ein TON misst, wie lange beide Schütze aus sind; erst nach 300 ms darf die neue Richtung einschalten.',
            'Stopp (Öffner) und Motorschutz (Öffner) schalten sofort beide Richtungen ab und löschen die Anforderung.',
            'Teste in ARsim mit der Watch-Ansicht und reiche nach bestandenen Tests den Nachweis ein.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung „Wendeschützsteuerung mit Verriegelung“ bestehen.',
          tip: 'Werden beide Richtungstaster gleichzeitig gedrückt, ist „Stopp“ die einzig sichere Reaktion.'
        }
      }
    ],
    videos: [
      vid('k81346', 'Kennbuchstaben nach IEC 81346 in der Praxis eines E-CAD-Systems.'),
      vid('schaltplan', 'Wie man Schaltpläne systematisch liest.'),
      vid('wende', 'Wendeschützschaltung mit Rechts- und Linkslauf erklärt.')
    ],
    readings: [
      rd('mkdoc', 'Übersicht der für Schaltpläne relevanten Normen (u. a. 81346, 60617, 61082).'),
      rd('bibbTq', 'Kompetenzen „Schaltungsunterlagen lesen und erstellen“ im Berufsbild.')
    ],
    quiz: [
      { type: 'single', q: 'Welches Vorzeichen kennzeichnet im Referenzkennzeichen nach EN IEC 81346 den Ortsaspekt?',
        options: ['=', '-', '+', '#'], correct: 2, explain: '= Funktion, - Produkt, + Ort.' },
      { type: 'single', q: 'Welche Funktion hat der Kontakt -K1 13/14 in der abgebildeten Schaltung?', figure: SVG.selbsthaltung,
        options: ['Verriegelung', 'Selbsthaltung', 'Not-Halt', 'Motorschutz'], correct: 1,
        explain: 'Der Schließer des eigenen Schützes parallel zum Start-Taster hält die Spule nach dem Loslassen.' },
      { type: 'single', q: 'Welche Kontakte bilden in der abgebildeten Wendeschützschaltung die Schützverriegelung?', figure: SVG.wendeschuetz,
        options: ['-K1 13/14 und -K2 13/14', '-K2 21/22 im Pfad von -K1 und -K1 21/22 im Pfad von -K2', '-S2 und -S3', '-S1'], correct: 1,
        explain: 'Der Öffner des jeweils anderen Schützes verhindert, dass beide Spulen gleichzeitig Strom bekommen.' }
    ],
    exam: [
      { type: 'single', q: 'Welche Klasse nach EN IEC 81346-2 passt zu einem Drucktaster?',
        options: ['B', 'P', 'S', 'X'], correct: 2, explain: 'S: Umwandlung einer manuellen Betätigung in ein Signal.' },
      { type: 'single', q: 'In welchem Zustand werden Kontakte im Stromlaufplan dargestellt?',
        options: ['Im betätigten Zustand', 'Im unbetätigten, spannungslosen Zustand', 'Im Betriebszustand der Maschine', 'Beliebig'], correct: 1,
        explain: 'Grundregel: unbetätigt, stromlos.' },
      { type: 'multi', q: 'Welche Maßnahmen verhindern, dass bei einer Wendeschützschaltung beide Schütze gleichzeitig anziehen?',
        options: ['Gegenseitige Verriegelung über Öffner der Schütze', 'Mechanische Verriegelung', 'Software-Verriegelung in der SPS (zusätzlich)', 'Größere Sicherung'], correct: [0, 1, 2],
        explain: 'Hardware-Verriegelung ist Pflicht, die SPS-Verriegelung ergänzt sie.' },
      { type: 'single', q: 'Was zeigt der Kontaktspiegel unter einer Schützspule?',
        options: ['Die Spulenspannung', 'In welchen Strompfaden die Kontakte dieses Schützes liegen', 'Die Hersteller-Bestellnummer', 'Den Querschnitt der Leitung'], correct: 1,
        explain: 'Der Kontaktspiegel verweist auf die Strompfade der Haupt- und Hilfskontakte.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Wendeschützsteuerung mit Verriegelung',
        task: 'Ein Förderer wird über -QA1 (Rechts, `doK1`) und -QA2 (Links, `doK2`) angesteuert. Der Startcode enthält zwei einfache Selbsthaltungen **ohne Verriegelung** – erweitere ihn.\n\n' +
          '**Anforderungen:**\n' +
          '1. `diRechts` bzw. `diLinks` (Taster) starten die jeweilige Richtung mit Selbsthaltung.\n' +
          '2. `doK1` und `doK2` dürfen **nie** gleichzeitig TRUE sein.\n' +
          '3. Richtungswechsel direkt per Taster: Das laufende Schütz fällt sofort ab, das andere zieht erst nach einer **Umschaltpause von 300 ms** an. Aus dem Stillstand (beide Schütze länger als 300 ms aus) startet die Richtung sofort.\n' +
          '4. Beide Richtungstaster gleichzeitig: beide Schütze aus.\n' +
          '5. `diStop` (Öffner) und `diMotorschutz` (Öffner 95-96) schalten sofort ab und löschen eine gemerkte Anforderung. Kein automatischer Wiederanlauf.\n\n' +
          'Hinweis: Im Schaltschrank bleibt die elektrische Verriegelung über Hilfsöffner Pflicht.',
        hints: ['nDir: 0 = Stopp, 1 = Rechts, 2 = Links; nPending merkt die angeforderte Richtung.', 'fbOffTime(IN := nDir = 0, PT := T#300ms) – nur wenn fbOffTime.Q, darf nPending übernommen werden.'],
        cycleMs: 10,
        io: [
          { name: 'diRechts', type: 'BOOL', dir: 'in', label: '-SF2 Rechts', widget: 'button' },
          { name: 'diLinks', type: 'BOOL', dir: 'in', label: '-SF3 Links', widget: 'button' },
          { name: 'diStop', type: 'BOOL', dir: 'in', label: '-SF1 Stopp (Öffner)', widget: 'switch', init: true },
          { name: 'diMotorschutz', type: 'BOOL', dir: 'in', label: '-FC1 Motorschutz 95-96 (Öffner)', widget: 'switch', init: true },
          { name: 'doK1', type: 'BOOL', dir: 'out', label: '-QA1 Rechtslauf', widget: 'led' },
          { name: 'doK2', type: 'BOOL', dir: 'out', label: '-QA2 Linkslauf', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// Einfache Selbsthaltungen ohne Verriegelung – erweitern!\n\tdoK1 := (diRechts OR doK1) AND diStop AND diMotorschutz;\n\tdoK2 := (diLinks OR doK2) AND diStop AND diMotorschutz;\nEND_PROGRAM\n',
          var: 'VAR\n\tnDir : INT;\n\tnPending : INT;\n\tfbOffTime : TON;\n\tbOk : BOOL;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	nDir := 0;
	nPending := 0;
END_PROGRAM

PROGRAM _CYCLIC
	bOk := diStop AND diMotorschutz;

	IF NOT bOk OR (diRechts AND diLinks) THEN
		nDir := 0;
		nPending := 0;
	ELSIF diRechts AND nDir <> 1 THEN
		nDir := 0;
		nPending := 1;
	ELSIF diLinks AND nDir <> 2 THEN
		nDir := 0;
		nPending := 2;
	END_IF

	// Umschaltpause: beide Schütze müssen mindestens 300 ms aus sein
	fbOffTime(IN := (nDir = 0), PT := T#300ms);
	IF (nPending <> 0) AND fbOffTime.Q THEN
		nDir := nPending;
		nPending := 0;
	END_IF

	doK1 := (nDir = 1);
	doK2 := (nDir = 2);
END_PROGRAM
`,
          var: 'VAR\n\tnDir : INT;\n\tnPending : INT;\n\tfbOffTime : TON;\n\tbOk : BOOL;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Rechtslauf mit Selbsthaltung', steps: [
            { ms: 500 },
            { set: { diRechts: true } }, { cycles: 2 }, { set: { diRechts: false } }, { ms: 200 },
            { expect: 'doK1 AND NOT doK2', msg: 'Rechtslauf muss nach dem Loslassen weiterlaufen.' }
          ]},
          { name: 'Umschalten mit Pause, nie beide gleichzeitig', steps: [
            { ms: 500 },
            { set: { diRechts: true } }, { cycles: 2 }, { set: { diRechts: false } }, { ms: 500 },
            { set: { diLinks: true } }, { cycles: 2 }, { set: { diLinks: false } },
            { expect: 'NOT doK1 AND NOT doK2', msg: 'Beim Umschalten muss zuerst das laufende Schütz abfallen.' },
            { never: 'doK1 AND doK2', ms: 100, msg: 'K1 und K2 dürfen nie gleichzeitig an sein.' },
            { expect: 'NOT doK2', msg: 'K2 darf erst nach der Umschaltpause von 300 ms einschalten.' },
            { until: 'doK2', maxMs: 400, msg: 'Nach der Umschaltpause muss der Linkslauf einschalten.' },
            { expect: 'NOT doK1' }
          ]},
          { name: 'Beide Taster gleichzeitig → Stopp', steps: [
            { ms: 500 },
            { set: { diRechts: true, diLinks: true } },
            { never: 'doK1 OR doK2', ms: 500, msg: 'Beide Richtungstaster gleichzeitig dürfen kein Schütz einschalten.' }
          ]},
          { name: 'Stopp-Öffner und Drahtbruch', steps: [
            { ms: 500 },
            { set: { diLinks: true } }, { cycles: 2 }, { set: { diLinks: false } }, { cycles: 2 },
            { expect: 'doK2' },
            { set: { diStop: false } }, { cycles: 2 },
            { expect: 'NOT doK1 AND NOT doK2', msg: 'Stopp muss sofort abschalten.' },
            { set: { diRechts: true } }, { cycles: 2 }, { set: { diRechts: false } },
            { never: 'doK1 OR doK2', ms: 600, msg: 'Bei offenem Stopp-Kreis darf nichts anlaufen – auch nicht nachträglich.' }
          ]},
          { name: 'Motorschutz: kein Wiederanlauf', steps: [
            { ms: 500 },
            { set: { diRechts: true } }, { cycles: 2 }, { set: { diRechts: false } }, { cycles: 2 },
            { set: { diMotorschutz: false } }, { cycles: 2 },
            { expect: 'NOT doK1' },
            { set: { diMotorschutz: true } },
            { never: 'doK1 OR doK2', ms: 800, msg: 'Nach Rückstellen des Motorschutzes kein automatischer Wiederanlauf.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Wendeschaltung'
  }
];
