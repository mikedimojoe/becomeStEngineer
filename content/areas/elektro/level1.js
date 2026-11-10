'use strict';
// Bereich elektro – Level 1 (Grundkurs → Prüfung Junior)
const { vid, rd, HINWEIS } = require('./refs');

const EMPTY_MAIN = 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\nEND_PROGRAM\n';

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'elektro-1-grundgroessen',
    level: 1,
    kind: 'lektion',
    title: 'Spannung, Strom, Widerstand und Leistung',
    summary: 'Ohmsches Gesetz, Reihen- und Parallelschaltung, Spannungsteiler sowie Leistung und Arbeit – gerechnet und in ST umgesetzt.',
    minutes: 150,
    req: [],
    briefing: 'Jede Steuerung, jeder Sensor und jeder Antrieb gehorcht denselben Grundgesetzen: U = R · I und P = U · I. Wer diese Zusammenhänge sicher beherrscht, kann Sicherungen auslegen, Netzteile dimensionieren und Messwerte plausibilisieren. In diesem Modul rechnest du Reihen- und Parallelschaltungen, verstehst den Spannungsteiler und berechnest elektrische Arbeit. Zum Abschluss setzt du die Formeln in Structured Text um – inklusive Schutz gegen Division durch null.',
    practice: 'Typische Fragen an der Maschine: Reicht das 24-V-Netzteil mit 10 A für alle Ventile? Wie viel Strom zieht eine 230-V-Heizpatrone mit 2 kW? Warum zeigt ein Analogeingang plötzlich nur die halbe Spannung (belasteter Spannungsteiler)?',
    transfer: {
      tia: 'In TIA Portal rechnest du dasselbe in SCL mit REAL-Variablen; Division durch null liefert dort ebenfalls keinen Laufzeitfehler, sondern Inf/NaN – du musst selbst abfangen.',
      codesys: 'In CODESYS/TwinCAT ist ST nahezu identisch. Division durch null bei REAL ergibt je nach Zielsystem Inf oder eine Exception – auch hier gilt: vorher prüfen.'
    },
    objectives: [
      {
        id: 'o1', title: 'Wende das Ohmsche Gesetz sicher an',
        guide: {
          intro: 'U = R · I ist die Basis jeder Berechnung. Du übst das Umstellen und den Umgang mit Einheitenvorsätzen.',
          steps: [
            'Schreibe das Formeldreieck U – R · I auf und stelle nach I und R um.',
            'Rechne: Ein Relais mit 24 V hat eine Spule mit 1,2 kΩ. Wie groß ist der Spulenstrom? (Ergebnis: 20 mA)',
            'Rechne Einheitenvorsätze konsequent um: 4,7 kΩ = 4700 Ω, 20 mA = 0,02 A, 2,2 MΩ = 2 200 000 Ω.',
            'Prüfe jedes Ergebnis mit einer Plausibilitätsabschätzung: Größerer Widerstand → kleinerer Strom.',
            'Notiere drei Geräte aus deiner Maschine mit Nennspannung und Strom (Typenschild/Datenblatt) und berechne daraus den Widerstand bzw. die Leistung.'
          ],
          code: { lang: 'text', text: 'I = U / R = 24 V / 1200 Ω = 0,02 A = 20 mA' },
          done: 'Erledigt, wenn du U, I und R in beliebiger Kombination ohne Formelsammlung umstellen und mit Vorsätzen (m, k, M) korrekt rechnen kannst.',
          tip: 'Rechne immer zuerst in Grundeinheiten (V, A, Ω) und setze die Vorsätze erst im Ergebnis wieder ein – das vermeidet Faktor-1000-Fehler.'
        }
      },
      {
        id: 'o2', title: 'Berechne Reihen- und Parallelschaltungen',
        guide: {
          intro: 'In der Reihenschaltung addieren sich die Widerstände, in der Parallelschaltung die Leitwerte.',
          steps: [
            'Reihenschaltung: R_ges = R1 + R2 + … ; der Strom ist überall gleich, die Spannungen teilen sich auf.',
            'Parallelschaltung: 1/R_ges = 1/R1 + 1/R2 + … ; die Spannung ist überall gleich, die Ströme addieren sich.',
            'Für zwei parallele Widerstände nutzt du R_ges = R1 · R2 / (R1 + R2).',
            'Kontrolle: R_ges einer Parallelschaltung ist immer kleiner als der kleinste Einzelwiderstand.',
            'Übertrage das auf die Praxis: Mehrere Verbraucher an 24 V DC sind parallel geschaltet – der Gesamtstrom ist die Summe der Einzelströme.'
          ],
          done: 'Erledigt, wenn du eine gemischte Schaltung (R1 in Reihe zu R2 ∥ R3) vollständig mit Teilspannungen und Teilströmen berechnen kannst.',
          tip: 'Zeichne bei gemischten Schaltungen schrittweise Ersatzschaltbilder – erst die innerste Parallelschaltung zusammenfassen.'
        }
      },
      {
        id: 'o3', title: 'Verstehe den Spannungsteiler',
        guide: {
          intro: 'Spannungsteiler begegnen dir in Sensorik, Analogeingängen und Pegelanpassungen.',
          steps: [
            'Unbelasteter Teiler: U2 = U · R2 / (R1 + R2).',
            'Belasteter Teiler: Der Lastwiderstand RL liegt parallel zu R2 – berechne erst R2 ∥ RL, dann U2.',
            'Rechne ein Beispiel: U = 24 V, R1 = 14 kΩ, R2 = 10 kΩ → U2 = 10 V (unbelastet).',
            'Rechne mit RL = 10 kΩ (Eingangswiderstand eines Messgeräts): R2 ∥ RL = 5 kΩ → U2 ≈ 6,3 V.',
            'Leite daraus die Regel ab: Der Lastwiderstand sollte mindestens 10× größer sein als R2, sonst bricht die Spannung ein.'
          ],
          done: 'Erledigt, wenn du begründen kannst, warum ein hochohmiger Analogeingang (z. B. > 100 kΩ) einen Spannungsteiler kaum belastet.',
          tip: 'Ein Spannungsteiler ist keine Spannungsversorgung – für Lasten brauchst du ein Netzteil oder einen Regler.'
        }
      },
      {
        id: 'o4', title: 'Berechne Leistung, Arbeit und Kosten',
        guide: {
          intro: 'P = U · I = I² · R = U² / R und W = P · t. Leistung bestimmt Erwärmung, Arbeit bestimmt die Energiekosten.',
          steps: [
            'Berechne die Leistung einer 24-V-Ventilspule mit 0,25 A: P = 6 W.',
            'Berechne die Arbeit einer 2-kW-Heizung über 8 h: W = 16 kWh.',
            'Berechne die Kosten bei 0,30 €/kWh: 4,80 €.',
            'Prüfe die Verlustleistung eines Widerstands: P = I² · R – überschreitet sie die Nennbelastbarkeit, wird er zu heiß.',
            'Bestimme den Wirkungsgrad η = P_ab / P_zu eines Netzteils (z. B. 240 W ab, 265 W auf → η ≈ 0,91).'
          ],
          done: 'Erledigt, wenn du für ein 24-V-Netzteil die Summe aller Verbraucherleistungen bilden und daraus den nötigen Nennstrom ableiten kannst.',
          tip: 'Plane beim 24-V-Netzteil Reserve ein (häufig 20–30 %), damit Einschaltströme von Ventilen und Relais es nicht in die Strombegrenzung treiben.'
        }
      },
      {
        id: 'o5', title: 'Setze die Formeln in ST um',
        guide: {
          intro: 'Du berechnest Strom und Leistung aus Messwerten in einem AS6-Programm.',
          steps: [
            'Lege in Automation Studio 6 im Logical View über das Kontextmenü **Add Object › Program** ein ST-Programm an.',
            'Deklariere in der Variablendatei REAL-Variablen für U, R, I und P.',
            'Prüfe vor jeder Division, ob der Divisor größer null ist.',
            'Teste in der Simulation (ARsim) mit der Watch-Ansicht, indem du U und R veränderst.',
            'Löse die Übung unten und lass alle Tests grün laufen.'
          ],
          code: { lang: 'st', text: 'IF rR > 0.0 THEN\n\trI := rU / rR;\nELSE\n\trI := 0.0;\n\tbError := TRUE;\nEND_IF' },
          done: 'Erledigt, wenn alle Tests der Übung „Heizwiderstand überwachen“ bestehen.',
          tip: 'Rechne in REAL und konvertiere erst am Ende in Ganzzahlen – Integer-Division schneidet Nachkommastellen ab.'
        }
      }
    ],
    videos: [
      vid('ohm', 'Kompakte Wiederholung des Ohmschen Gesetzes mit Formeldreieck.'),
      vid('reihe', 'Reihen-, Parallelschaltung, Spannungs- und Stromteiler in einem Durchgang.'),
      vid('leistung', 'Leistung und Arbeit mit Rechenbeispielen aus der Ausbildung.')
    ],
    readings: [
      rd('pannek', 'Kapitel zu Gleichstromkreisen: Grundgrößen, Kirchhoffsche Regeln und Leistung.'),
      rd('bibbTq', 'Zeigt, welche Grundlagenkompetenzen im Beruf Elektroniker/-in für Automatisierungstechnik verlangt werden.')
    ],
    quiz: [
      { type: 'numeric', q: 'Eine Ventilspule hat R = {R} Ω und liegt an U = {U} V DC. Wie groß ist der Strom in mA?',
        params: { R: [48, 240, 8], U: [12, 24, 12] }, formula: 'U / R * 1000', unit: 'mA', tol: 0.02,
        explain: 'I = U / R. Ergebnis in A mit 1000 multiplizieren, um mA zu erhalten.' },
      { type: 'numeric', q: 'Zwei Widerstände R1 = {R1} Ω und R2 = {R2} Ω sind parallel geschaltet. Wie groß ist der Ersatzwiderstand?',
        params: { R1: [100, 1000, 50], R2: [100, 1000, 50] }, formula: 'R1 * R2 / (R1 + R2)', unit: 'Ω', tol: 0.01,
        explain: 'R_ges = R1 · R2 / (R1 + R2). Das Ergebnis ist kleiner als der kleinere Einzelwiderstand.' },
      { type: 'single', q: 'Ein unbelasteter Spannungsteiler aus zwei gleich großen Widerständen liegt an 24 V. Ein Messgerät mit einem Innenwiderstand, der genauso groß ist wie R2, wird an R2 angeschlossen. Was misst du?',
        options: ['12 V', '8 V', '16 V', '24 V'], correct: 1,
        explain: 'R2 ∥ RL = R/2. U2 = 24 V · (R/2) / (R + R/2) = 24 V / 3 = 8 V. Der belastete Teiler bricht ein.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine Heizpatrone hat die Nennleistung P = {P} W bei U = 230 V. Wie groß ist ihr Widerstand im Betrieb?',
        params: { P: [500, 3000, 250] }, formula: '230 * 230 / P', unit: 'Ω', tol: 0.01,
        explain: 'R = U² / P.' },
      { type: 'numeric', q: 'Eine Maschine nimmt im Mittel {P} kW auf und läuft {h} Stunden pro Tag an 220 Tagen im Jahr. Wie hoch sind die Energiekosten pro Jahr bei 0,25 €/kWh?',
        params: { P: [2, 20, 1], h: [8, 16, 8] }, formula: 'P * h * 220 * 0.25', unit: '€', tol: 0.01,
        explain: 'W = P · t; Kosten = W · Preis.' },
      { type: 'numeric', q: 'Unbelasteter Spannungsteiler: U = 24 V, R1 = {R1} kΩ, R2 = 10 kΩ. Wie groß ist U2?',
        params: { R1: [2, 30, 2] }, formula: '24 * 10 / (R1 + 10)', unit: 'V', tol: 0.01,
        explain: 'U2 = U · R2 / (R1 + R2).' },
      { type: 'multi', q: 'Welche Aussagen zur Parallelschaltung sind richtig?',
        options: ['An allen Zweigen liegt dieselbe Spannung.', 'Der Gesamtwiderstand ist kleiner als der kleinste Einzelwiderstand.', 'Der Strom ist in allen Zweigen gleich.', 'Die Zweigströme addieren sich zum Gesamtstrom.'],
        correct: [0, 1, 3], explain: 'In der Parallelschaltung ist die Spannung gleich, die Ströme addieren sich (Knotenregel).' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Heizwiderstand überwachen',
        task: 'Eine Heizung wird über eine Messung von Spannung und Widerstand überwacht.\n\n' +
          '**Anforderungen:**\n' +
          '1. Berechne den Strom `rI` in A aus `rU` (V) und `rR` (Ω).\n' +
          '2. Berechne die Leistung `rP` in W.\n' +
          '3. Setze `bOverload` auf TRUE, wenn `rP` größer als die zulässige Leistung `rPmax` (500 W, Konstante in Variables.var) ist.\n' +
          '4. Ist `rR` kleiner oder gleich 0, sind `rI` und `rP` = 0, `bError` = TRUE und `bOverload` = FALSE (Messfehler, keine Division durch null).\n' +
          '5. Ist der Messwert gültig, ist `bError` = FALSE.',
        hints: ['P = U · I oder P = U² / R.', 'Prüfe `rR > 0.0`, bevor du dividierst.'],
        cycleMs: 10,
        io: [
          { name: 'rU', type: 'REAL', dir: 'in', label: 'Spannung U in V', widget: 'slider', min: 0, max: 400, init: 24 },
          { name: 'rR', type: 'REAL', dir: 'in', label: 'Widerstand R in Ω', widget: 'slider', min: 0, max: 1000, init: 12 },
          { name: 'rI', type: 'REAL', dir: 'out', label: 'Strom I', widget: 'value', unit: 'A' },
          { name: 'rP', type: 'REAL', dir: 'out', label: 'Leistung P', widget: 'gauge', min: 0, max: 2000, unit: 'W' },
          { name: 'bOverload', type: 'BOOL', dir: 'out', label: 'Überlast', widget: 'led' },
          { name: 'bError', type: 'BOOL', dir: 'out', label: 'Messfehler', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Strom, Leistung, Überlast und Messfehler berechnen\n\trI := rU / rR;\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\trPmax : REAL := 500.0;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tIF rR > 0.0 THEN\n\t\trI := rU / rR;\n\t\trP := rU * rI;\n\t\tbError := FALSE;\n\t\tbOverload := rP > rPmax;\n\tELSE\n\t\trI := 0.0;\n\t\trP := 0.0;\n\t\tbError := TRUE;\n\t\tbOverload := FALSE;\n\tEND_IF\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\trPmax : REAL := 500.0;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Normalfall 24 V / 12 Ω', steps: [
            { set: { rU: 24.0, rR: 12.0 } }, { cycles: 2 },
            { expect: 'ABS(rI - 2.0) < 0.001', msg: 'I = 24 V / 12 Ω = 2 A erwartet.' },
            { expect: 'ABS(rP - 48.0) < 0.01', msg: 'P = 48 W erwartet.' },
            { expect: 'NOT bOverload AND NOT bError' }
          ]},
          { name: 'Überlast bei 230 V / 100 Ω', steps: [
            { set: { rU: 230.0, rR: 100.0 } }, { cycles: 2 },
            { expect: 'ABS(rP - 529.0) < 0.1', msg: 'P = 529 W erwartet.' },
            { expect: 'bOverload', msg: '529 W > 500 W – Überlast muss gemeldet werden.' }
          ]},
          { name: 'Grenzfall genau 500 W ist keine Überlast', steps: [
            { set: { rU: 100.0, rR: 20.0 } }, { cycles: 2 },
            { expect: 'ABS(rP - 500.0) < 0.01' },
            { expect: 'NOT bOverload', msg: 'Nur „größer als“ 500 W ist Überlast.' }
          ]},
          { name: 'R = 0 ist Messfehler', steps: [
            { set: { rU: 24.0, rR: 0.0 } }, { cycles: 2 },
            { expect: 'bError', msg: 'R ≤ 0 muss als Messfehler erkannt werden.' },
            { expect: 'rI = 0.0 AND rP = 0.0 AND NOT bOverload' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-1-sicherheit',
    level: 1,
    kind: 'lektion',
    title: 'Elektrische Gefährdung, 5 Sicherheitsregeln und 24-V-Steuerspannung',
    summary: 'Wirkung des Stroms auf den Menschen, die 5 Sicherheitsregeln, Elektrofachkraft und Schutzkleinspannung im Schaltschrank.',
    minutes: 120,
    req: ['elektro-1-grundgroessen'],
    briefing: 'Elektrischer Strom ist unsichtbar – deshalb brauchst du feste Regeln, bevor du an einer Anlage arbeitest. Du lernst, wie Strom auf den Körper wirkt, wer welche Arbeiten ausführen darf (Elektrofachkraft, elektrotechnisch unterwiesene Person) und wie die 5 Sicherheitsregeln den spannungsfreien Zustand herstellen. Außerdem verstehst du, warum Steuerungen mit 24 V DC als SELV/PELV arbeiten und was das für deine Arbeit am Schaltschrank bedeutet. ' + HINWEIS,
    practice: 'Vor jedem Tausch eines Sensors oder Schützes im Schaltschrank musst du entscheiden: Reicht es, die 24-V-Steuerspannung abzuschalten, oder muss der Hauptschalter freigeschaltet, gesichert und die Spannungsfreiheit festgestellt werden?',
    transfer: {
      tia: 'Die Regeln sind herstellerunabhängig. In Siemens-Anlagen sind die 24-V-Kreise ebenfalls als PELV ausgeführt; die Lastspannung (L+/M) der ET 200 entspricht der Potentialgruppe bei B&R X20.',
      codesys: 'Auch bei Beckhoff-Klemmen (Powerkontakte 24 V) gilt: Steuerspannung abschalten ersetzt nicht das Freischalten der Netzseite.'
    },
    objectives: [
      {
        id: 'o1', title: 'Beschreibe die Gefährdung durch elektrischen Strom',
        guide: {
          intro: 'Nicht die Spannung allein, sondern der Strom durch den Körper und seine Einwirkdauer bestimmen die Gefahr.',
          steps: [
            'Erkläre den Zusammenhang I = U / R_Körper; der Körperwiderstand liegt grob in der Größenordnung von 1 kΩ und schwankt stark (Feuchtigkeit, Kontaktfläche).',
            'Nenne die Wirkungen: Muskelverkrampfung (Loslassschwelle), Herzkammerflimmern, Verbrennungen, Sekundärunfälle (Sturz).',
            'Lies in der BG-ETEM-Broschüre nach, welche Ersthelfer-Maßnahmen nach einem Stromunfall vorgeschrieben sind (ärztliche Vorstellung auch ohne sichtbare Verletzung).',
            'Unterscheide AC und DC: Wechselstrom im Bereich 50 Hz gilt als besonders gefährlich für das Herz.',
            'Notiere, welche Spannungen in deiner Maschine vorkommen (z. B. 400 V AC Leistung, 230 V AC Hilfsspannung, 24 V DC Steuerung, Zwischenkreis eines Umrichters mit über 500 V DC).'
          ],
          done: 'Erledigt, wenn du für jede Spannungsebene deiner Maschine benennen kannst, wo sie anliegt und welche Gefahr von ihr ausgeht.',
          tip: 'Umrichter-Zwischenkreise bleiben nach dem Abschalten minutenlang geladen – Wartezeit auf dem Gerät beachten.',
          link: { label: 'BG ETEM: Sicher arbeiten mit elektrischem Strom', url: 'https://medien.bgetem.de/medienportal/artikel/VDAwOA--/@@download/download' }
        }
      },
      {
        id: 'o2', title: 'Wende die 5 Sicherheitsregeln in der richtigen Reihenfolge an',
        guide: {
          intro: 'Die 5 Sicherheitsregeln (DIN VDE 0105-100, DGUV Vorschrift 3) stellen den spannungsfreien Zustand her und sichern ihn für die Dauer der Arbeit.',
          steps: [
            '1. Freischalten – allpolig trennen (Hauptschalter, Leitungsschutzschalter, Sicherungen).',
            '2. Gegen Wiedereinschalten sichern – Vorhängeschloss am Hauptschalter, Verbotsschild, Sicherungseinsätze entnehmen.',
            '3. Spannungsfreiheit feststellen – mit zweipoligem Spannungsprüfer allpolig an der Arbeitsstelle; Prüfer vorher und nachher an einer bekannten Spannungsquelle testen.',
            '4. Erden und Kurzschließen – zuerst erden, dann kurzschließen (in Niederspannungsanlagen je nach Gefährdung; bei Freileitungen und Hochspannung immer).',
            '5. Benachbarte, unter Spannung stehende Teile abdecken oder abschranken.',
            'Die Aufhebung erfolgt in umgekehrter Reihenfolge, nachdem alle Personen informiert und Werkzeuge entfernt sind.'
          ],
          done: 'Erledigt, wenn du die 5 Regeln in der richtigen Reihenfolge aufsagen und jeweils ein konkretes Hilfsmittel nennen kannst.',
          tip: 'Ein Multimeter ist kein Spannungsprüfer im Sinne der Regel 3 – verwende einen zweipoligen Spannungsprüfer nach DIN EN 61243-3.',
          link: { label: 'Voltimum: Die 5 Sicherheitsregeln', url: 'https://content.voltimum.com/de/125889/die_5_sicherheitsregeln_und_der_betrieb_von_elektrischen_anlagen.pdf' }
        }
      },
      {
        id: 'o3', title: 'Unterscheide Elektrofachkraft, EuP und Laie',
        guide: {
          intro: 'Wer was darf, regeln DGUV Vorschrift 3 und DIN VDE 1000-10.',
          steps: [
            'Elektrofachkraft: fachliche Ausbildung, Kenntnisse und Erfahrung sowie Kenntnis der Normen – kann Arbeiten beurteilen und Gefahren erkennen.',
            'Elektrotechnisch unterwiesene Person (EuP): von einer Elektrofachkraft für bestimmte Aufgaben unterwiesen.',
            'Elektrotechnischer Laie: darf nur bestimmungsgemäß bedienen.',
            'Lies in der DGUV Information 203-050 nach, was „unter Leitung und Aufsicht einer Elektrofachkraft“ bedeutet.',
            'Kläre mit deinem Ausbilder, welche Tätigkeiten du im Betrieb aktuell ausführen darfst.'
          ],
          done: 'Erledigt, wenn du für drei Tätigkeiten (Sensor tauschen, Motor anklemmen, Programm ändern) begründen kannst, welche Qualifikation nötig ist.',
          tip: 'Auszubildende arbeiten an elektrischen Anlagen grundsätzlich unter Leitung und Aufsicht einer Elektrofachkraft.'
        }
      },
      {
        id: 'o4', title: 'Erkläre SELV/PELV und die 24-V-Steuerspannung',
        guide: {
          intro: 'Steuerungen arbeiten mit Kleinspannung. Das senkt die Gefahr, ersetzt aber nicht den Schutz der Netzseite.',
          steps: [
            'SELV: Schutzkleinspannung, sicher getrennt, nicht geerdet. PELV: wie SELV, aber mit Verbindung zum Schutzleiter (in Schaltschränken üblich: 0 V geerdet).',
            'Die Grenzwerte für Kleinspannung liegen bei 50 V AC bzw. 120 V DC.',
            'Ein 24-V-Netzteil mit sicherer Trennung (Sicherheitstransformator bzw. Schaltnetzteil mit verstärkter Isolierung) speist die Steuerung.',
            'Erkenne im Schaltplan die Potentiale L+ / M (bzw. +24 V / 0 V) und ihre Absicherung (Sicherungsautomat oder elektronische Lastkreisüberwachung).',
            'Prüfe im Schaltschrank: Ist die 0-V-Schiene mit PE verbunden (PELV)? Gibt es eine Isolationsüberwachung (SELV/ungeerdet)?'
          ],
          done: 'Erledigt, wenn du in einem realen Schaltschrank Netzteil, 24-V-Absicherung und PE-Verbindung der 0-V-Schiene zeigen kannst.',
          tip: 'Die Erdung der 0-V-Seite (PELV) sorgt dafür, dass ein Erdschluss auf der 24-V-Seite zu einem Kurzschluss führt und abgeschaltet wird, statt unbemerkt Ausgänge zu setzen.'
        }
      }
    ],
    videos: [
      vid('sr5', 'Die 5 Sicherheitsregeln Schritt für Schritt.'),
      vid('sr5b', 'Praxisnahe Erläuterung, warum die Reihenfolge wichtig ist.'),
      vid('selv', 'SELV und PELV verständlich erklärt.')
    ],
    readings: [
      rd('bgetemF40', 'Kurze Praxisbroschüre der BG ETEM zum sicheren Arbeiten mit Strom.'),
      rd('bgetemNachschlagen', 'Nachschlagewerk mit über 300 Begriffen von „5 Sicherheitsregeln“ bis „Elektrofachkraft“.'),
      rd('volt5sr', 'Ausführliche Erläuterung der Sicherheitsregeln und des Betriebs elektrischer Anlagen.')
    ],
    quiz: [
      { type: 'single', q: 'Welche ist die dritte der 5 Sicherheitsregeln?',
        options: ['Erden und Kurzschließen', 'Spannungsfreiheit feststellen', 'Gegen Wiedereinschalten sichern', 'Benachbarte Teile abdecken'], correct: 1,
        explain: 'Reihenfolge: Freischalten – gegen Wiedereinschalten sichern – Spannungsfreiheit feststellen – erden und kurzschließen – benachbarte Teile abdecken/abschranken.' },
      { type: 'numeric', q: 'Eine Person berührt eine Spannung von {U} V. Der Körperwiderstand beträgt {R} Ω. Wie groß ist der Körperstrom in mA?',
        params: { U: [50, 230, 10], R: [1000, 3000, 500] }, formula: 'U / R * 1000', unit: 'mA', tol: 0.02,
        explain: 'I = U / R. Schon wenige 10 mA AC können lebensgefährlich sein.' },
      { type: 'single', q: 'Was unterscheidet PELV von SELV?',
        options: ['PELV darf höhere Spannungen führen.', 'Bei PELV ist der Stromkreis mit dem Schutzleiter verbunden (geerdet).', 'PELV braucht keine sichere Trennung.', 'SELV ist nur für Wechselspannung zulässig.'], correct: 1,
        explain: 'Beide sind sicher getrennte Kleinspannung; PELV ist geerdet, SELV nicht.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Maßnahmen gehören zu „Gegen Wiedereinschalten sichern“?',
        options: ['Vorhängeschloss am Hauptschalter', 'Verbotsschild „Nicht schalten“', 'Spannungsprüfer an der Arbeitsstelle', 'Entnahme der Sicherungseinsätze'], correct: [0, 1, 3],
        explain: 'Der Spannungsprüfer gehört zu Regel 3 (Spannungsfreiheit feststellen).' },
      { type: 'single', q: 'Womit stellst du die Spannungsfreiheit nach den Sicherheitsregeln fest?',
        options: ['Mit einem einpoligen Phasenprüfer', 'Mit einem zweipoligen Spannungsprüfer, der vorher und nachher getestet wurde', 'Durch Ablesen der Meldeleuchte am Schaltschrank', 'Durch Abschalten der 24-V-Versorgung'], correct: 1,
        explain: 'Nur ein zweipoliger Spannungsprüfer (DIN EN 61243-3) mit Eigentest ist zulässig.' },
      { type: 'single', q: 'Welche Spannungsgrenze gilt für Kleinspannung bei Gleichspannung (oberwellenfrei)?',
        options: ['25 V', '50 V', '120 V', '230 V'], correct: 2, explain: 'Kleinspannung: bis 50 V AC bzw. 120 V DC.' },
      { type: 'single', q: 'In welcher Reihenfolge wird beim Erden und Kurzschließen vorgegangen?',
        options: ['Erst kurzschließen, dann erden', 'Erst erden, dann kurzschließen', 'Gleichzeitig', 'Reihenfolge ist egal'], correct: 1,
        explain: 'Die Erdungs- und Kurzschließvorrichtung wird zuerst mit der Erde verbunden, dann mit den Leitern.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Freischalt-Checkliste als Schrittkette',
        task: 'Ein Wartungsterminal soll die Arbeitsfreigabe erst anzeigen, wenn die 5 Sicherheitsregeln **in der richtigen Reihenfolge** quittiert wurden. Jede Regel wird über einen Schalter bestätigt (TRUE = erledigt).\n\n' +
          '**Anforderungen:**\n' +
          '1. Die Schrittvariable `nStep` (0…5) zählt die korrekt quittierten Regeln. Regel n darf nur quittiert werden, wenn Regel n−1 bereits quittiert ist.\n' +
          '2. Wird eine Regel quittiert, deren Vorgänger noch fehlt, gilt das als Reihenfolgefehler: `doFehler` = TRUE, `nStep` = 0.\n' +
          '3. Fällt eine bereits quittierte Bestätigung wieder weg (Schalter zurück), fällt `nStep` auf 0 zurück.\n' +
          '4. `doArbeitFrei` ist nur bei `nStep` = 5 und ohne Fehler TRUE.\n' +
          '5. Der Fehler lässt sich mit `diQuit` nur zurücksetzen, wenn alle fünf Schalter auf FALSE stehen.\n\n' +
          'Hinweis: Diese Übung trainiert Logik – sie ersetzt keine echte Freischaltung.',
        hints: ['Nutze ein CASE über nStep: In jedem Schritt prüfst du den erlaubten nächsten Schalter und verbotene spätere Schalter.', 'Den Rückfall (Bedingung 3) prüfst du nach dem CASE: Ist nStep ≥ n, muss Schalter n noch TRUE sein.'],
        cycleMs: 10,
        io: [
          { name: 'diFreigeschaltet', type: 'BOOL', dir: 'in', label: '1 Freigeschaltet', widget: 'switch' },
          { name: 'diGesichert', type: 'BOOL', dir: 'in', label: '2 Gegen Wiedereinschalten gesichert', widget: 'switch' },
          { name: 'diSpgFrei', type: 'BOOL', dir: 'in', label: '3 Spannungsfreiheit festgestellt', widget: 'switch' },
          { name: 'diGeerdet', type: 'BOOL', dir: 'in', label: '4 Geerdet und kurzgeschlossen', widget: 'switch' },
          { name: 'diAbgedeckt', type: 'BOOL', dir: 'in', label: '5 Benachbarte Teile abgedeckt', widget: 'switch' },
          { name: 'diQuit', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'doArbeitFrei', type: 'BOOL', dir: 'out', label: 'Arbeit freigegeben', widget: 'led' },
          { name: 'doFehler', type: 'BOOL', dir: 'out', label: 'Reihenfolgefehler', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\tnStep := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Reihenfolge prüfen\n\tdoArbeitFrei := diFreigeschaltet AND diGesichert AND diSpgFrei AND diGeerdet AND diAbgedeckt;\nEND_PROGRAM\n',
          var: 'VAR\n\tnStep : INT;\n\tbOrderError : BOOL;\n\tbAny : BOOL;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	nStep := 0;
	bOrderError := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	bAny := diFreigeschaltet OR diGesichert OR diSpgFrei OR diGeerdet OR diAbgedeckt;

	IF bOrderError THEN
		nStep := 0;
		IF diQuit AND NOT bAny THEN
			bOrderError := FALSE;
		END_IF
	ELSE
		CASE nStep OF
			0:
				IF diFreigeschaltet THEN
					nStep := 1;
				ELSIF diGesichert OR diSpgFrei OR diGeerdet OR diAbgedeckt THEN
					bOrderError := TRUE;
				END_IF
			1:
				IF diGesichert THEN
					nStep := 2;
				ELSIF diSpgFrei OR diGeerdet OR diAbgedeckt THEN
					bOrderError := TRUE;
				END_IF
			2:
				IF diSpgFrei THEN
					nStep := 3;
				ELSIF diGeerdet OR diAbgedeckt THEN
					bOrderError := TRUE;
				END_IF
			3:
				IF diGeerdet THEN
					nStep := 4;
				ELSIF diAbgedeckt THEN
					bOrderError := TRUE;
				END_IF
			4:
				IF diAbgedeckt THEN
					nStep := 5;
				END_IF
		END_CASE

		// Rückfall, wenn eine bereits quittierte Regel wegfällt
		IF (nStep >= 1 AND NOT diFreigeschaltet) OR (nStep >= 2 AND NOT diGesichert)
			OR (nStep >= 3 AND NOT diSpgFrei) OR (nStep >= 4 AND NOT diGeerdet)
			OR (nStep >= 5 AND NOT diAbgedeckt) THEN
			nStep := 0;
		END_IF
		IF bOrderError THEN
			nStep := 0;
		END_IF
	END_IF

	doArbeitFrei := (nStep = 5) AND NOT bOrderError;
	doFehler := bOrderError;
END_PROGRAM
`,
          var: 'VAR\n\tnStep : INT;\n\tbOrderError : BOOL;\n\tbAny : BOOL;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Richtige Reihenfolge gibt frei', steps: [
            { set: { diFreigeschaltet: true } }, { cycles: 2 },
            { set: { diGesichert: true } }, { cycles: 2 },
            { set: { diSpgFrei: true } }, { cycles: 2 },
            { set: { diGeerdet: true } }, { cycles: 2 },
            { expect: 'NOT doArbeitFrei', msg: 'Vor Regel 5 darf keine Freigabe kommen.' },
            { set: { diAbgedeckt: true } }, { cycles: 2 },
            { expect: 'doArbeitFrei AND NOT doFehler', msg: 'Nach allen 5 Regeln muss die Arbeit freigegeben sein.' }
          ]},
          { name: 'Regel 3 vor Regel 2 ist ein Reihenfolgefehler', steps: [
            { set: { diFreigeschaltet: true } }, { cycles: 2 },
            { set: { diSpgFrei: true } }, { cycles: 2 },
            { expect: 'doFehler', msg: 'Spannungsfreiheit vor dem Sichern muss als Fehler erkannt werden.' },
            { set: { diGesichert: true, diGeerdet: true, diAbgedeckt: true } }, { cycles: 5 },
            { expect: 'NOT doArbeitFrei', msg: 'Bei Reihenfolgefehler darf nie freigegeben werden.' }
          ]},
          { name: 'Wegfall einer Bestätigung nimmt Freigabe zurück', steps: [
            { set: { diFreigeschaltet: true } }, { cycles: 2 },
            { set: { diGesichert: true } }, { cycles: 2 },
            { set: { diSpgFrei: true } }, { cycles: 2 },
            { set: { diGeerdet: true } }, { cycles: 2 },
            { set: { diAbgedeckt: true } }, { cycles: 2 },
            { expect: 'doArbeitFrei' },
            { set: { diGesichert: false } }, { cycles: 2 },
            { expect: 'NOT doArbeitFrei AND nStep <= 1', msg: 'Schloss entfernt → Freigabe weg, Schrittkette muss neu durchlaufen werden.' },
            { set: { diGesichert: true } }, { cycles: 3 },
            { expect: 'NOT doArbeitFrei', msg: 'Nach Wiederherstellen einer Bestätigung darf nicht automatisch freigegeben werden.' }
          ]},
          { name: 'Quittieren nur, wenn alle Schalter zurückgesetzt', steps: [
            { set: { diGesichert: true } }, { cycles: 2 },
            { expect: 'doFehler' },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } }, { cycles: 1 },
            { expect: 'doFehler', msg: 'Solange ein Schalter TRUE ist, darf nicht quittiert werden.' },
            { set: { diGesichert: false } }, { cycles: 1 },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } }, { cycles: 1 },
            { expect: 'NOT doFehler', msg: 'Mit allen Schaltern auf FALSE muss das Quittieren den Fehler löschen.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-1-projekt-steuerstromkreis',
    level: 1,
    kind: 'projekt',
    title: 'Praxisprojekt: Steuerstromkreis mit Selbsthaltung und Meldeleuchten',
    summary: 'Schütz, Selbsthaltung, drahtbruchsichere Stopp-Taster, Motorschutz-Hilfskontakt, Lampentest und Sammelstörung – als SPS-Programm.',
    minutes: 240,
    req: ['elektro-1-sicherheit'],
    briefing: 'Das Schütz ist der Grundbaustein jeder Motorsteuerung: Eine Spule (A1/A2) betätigt Haupt- und Hilfskontakte. Mit einem Hilfskontakt parallel zum Start-Taster entsteht die Selbsthaltung. Stopp-Taster, Not-Halt-Kreise und Motorschutzkontakte werden als Öffner ausgeführt, damit ein Drahtbruch zum sicheren Zustand „Aus“ führt. In diesem Projekt baust du diese Logik als SPS-Programm nach und ergänzt die Meldeleuchten-Logik mit Lampentest und blinkender Störmeldung.',
    practice: 'Auf jeder Maschine findest du Bedientaster (grün Ein, rot/schwarz Aus), Meldeleuchten (grün Betrieb, rot/gelb Störung) und einen Lampentest-Taster. Wenn der Stopp-Taster als Öffner verdrahtet ist und ein Draht abfällt, darf die Maschine nicht mehr starten – genau das prüfst du hier.',
    transfer: {
      tia: 'In TIA Portal entspricht die Selbsthaltung in KOP einer Parallelschaltung des Ausgangs zum Start-Kontakt; in SCL schreibst du dieselbe Gleichung. Öffner-Eingänge werden mit „Öffner“-Kontakt (–|/|–) abgefragt.',
      codesys: 'In CODESYS gilt dasselbe; der SR-/RS-Baustein der Standardbibliothek bildet die Selbsthaltung mit Setz- bzw. Rücksetzdominanz.'
    },
    objectives: [
      {
        id: 'o1', title: 'Lies Schütz- und Kontaktbezeichnungen',
        guide: {
          intro: 'Kontakte sind genormt nummeriert – damit findest du sie im Plan und am Gerät.',
          steps: [
            'Spule: A1 (+) und A2 (−).',
            'Hauptkontakte: 1-2, 3-4, 5-6 (Netz oben ungerade, Last unten gerade).',
            'Hilfskontakte: zweistellig; die zweite Ziffer 3-4 bedeutet Schließer, 1-2 Öffner (z. B. 13-14 Schließer, 21-22 Öffner).',
            'Motorschutz/Überlastrelais: 95-96 Öffner (Auslösung), 97-98 Schließer (Meldung).',
            'Suche an einem realen Schütz die Bezeichnungen und vergleiche sie mit dem Datenblatt.'
          ],
          done: 'Erledigt, wenn du an einem Schütz Spule, Haupt- und Hilfskontakte zeigen und die Kontaktart aus der Nummer ableiten kannst.',
          tip: 'Die erste Ziffer eines Hilfskontakts ist die Ordnungsziffer (1., 2., 3. Kontakt), die zweite die Funktionsziffer.'
        }
      },
      {
        id: 'o2', title: 'Verstehe Selbsthaltung und Drahtbruchsicherheit',
        guide: {
          intro: 'Selbsthaltung speichert den Befehl „Ein“; das Öffnerprinzip sorgt für sicheres Abschalten.',
          steps: [
            'Zeichne den Steuerstromkreis: L+ → Stopp-Öffner → Start-Schließer ∥ K1(13-14) → Spule K1 → M.',
            'Überlege: Was passiert, wenn der Draht zum Stopp-Taster bricht? (Spule stromlos → Aus.)',
            'Überlege: Was passiert, wenn bei einem Schließer-Stopp der Draht bricht? (Stopp wirkungslos – gefährlich.)',
            'Übertrage auf die SPS: Ein Öffner-Eingang ist im Normalzustand TRUE; FALSE bedeutet „Stopp gedrückt oder Drahtbruch“.',
            'Vereinbare: Stopp dominiert immer gegenüber Start (rücksetzdominant).'
          ],
          code: { lang: 'st', text: 'doK1 := (diStart OR doK1) AND diStop AND diMotorschutz;' },
          done: 'Erledigt, wenn du erklären kannst, warum Stopp, Not-Halt und Motorschutz immer als Öffner ausgeführt werden.',
          tip: 'Not-Halt-Funktionen sind Sicherheitsfunktionen und gehören in eine Sicherheitssteuerung bzw. sichere Schaltgeräte – nicht in die Standard-SPS.'
        }
      },
      {
        id: 'o3', title: 'Programmiere die Motorsteuerung mit Störmeldung',
        guide: {
          intro: 'Du setzt die Steuerung aus Übung 1 in AS6 um.',
          steps: [
            'Lege die I/O-Variablen in der Global.var an und verbinde sie im **I/O Mapping** des Digitalmoduls (Doppelklick auf das Modul im Physical View).',
            'Programmiere die Selbsthaltung mit Stopp-Dominanz.',
            'Speichere die Motorschutz-Auslösung in einem Merker, damit die rote Leuchte auch nach Rückstellen des Motorschutzes bis zum nächsten Start bleibt.',
            'Teste in ARsim über **Watch** (Variablen per Drag & Drop hinzufügen, Werte forcen).',
            'Lass die Tests der Übung laufen.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung „Selbsthaltung drahtbruchsicher“ bestehen.',
          tip: 'Ein automatischer Wiederanlauf nach Rückkehr einer Störung ist unzulässig – der Bediener muss bewusst neu starten.'
        }
      },
      {
        id: 'o4', title: 'Baue Lampentest und Sammelstörung',
        guide: {
          intro: 'Neue Störungen blinken, quittierte Störungen leuchten dauernd, der Lampentest prüft die Leuchtmittel.',
          steps: [
            'Erzeuge einen 1-Hz-Blinktakt mit einem TON, der sich selbst zurücksetzt.',
            'Erkenne neue Störungen mit R_TRIG je Störsignal und setze einen Merker „unquittiert“.',
            'Quittieren löscht den Merker; die Leuchte zeigt dann Dauerlicht, solange die Störung ansteht.',
            'Der Lampentest schaltet alle Meldeleuchten ein, solange der Taster gedrückt ist.',
            'Löse Übung 2 und reiche den Projektnachweis (Link zu deinem Repository oder Screenshot der grünen Tests) ein.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung „Lampentest und Sammelstörung“ bestehen und dein Nachweis eingereicht ist.',
          tip: 'Die Hupe wird mit dem Quittieren abgeschaltet, die Leuchte erst, wenn die Ursache behoben ist.'
        }
      }
    ],
    videos: [
      vid('selbst', 'Die klassische Selbsthaltung mit Schütz im Stromlaufplan.'),
      vid('selbst2', 'Selbsthaltung als Grundschaltung jeder Schützsteuerung.')
    ],
    readings: [
      rd('pannek', 'Grundlagen zu Stromkreisen, Schaltern und Relais als Wiederholung.'),
      rd('bgetemNachschlagen', 'Begriffe rund um Schaltgeräte und sicheren Betrieb nachschlagen.')
    ],
    quiz: [
      { type: 'single', q: 'Welche Kontaktbezeichnung hat typischerweise der Hilfsschließer eines Schützes, der für die Selbsthaltung genutzt wird?',
        options: ['21-22', '13-14', '95-96', 'A1-A2'], correct: 1,
        explain: 'Funktionsziffern 3-4 kennzeichnen Schließer; 13-14 ist der erste Hilfsschließer.' },
      { type: 'single', q: 'Warum wird der Stopp-Taster als Öffner angeschlossen?',
        options: ['Weil Öffner billiger sind', 'Damit ein Drahtbruch die Maschine abschaltet statt den Stopp unwirksam zu machen', 'Weil die SPS nur Öffner lesen kann', 'Damit der Taster nicht prellt'], correct: 1,
        explain: 'Drahtbruchsicherheit: Unterbrechung = Stopp.' },
      { type: 'single', q: 'Was ergibt `doK1 := (diStart OR doK1) AND diStop;`, wenn Start und Stopp gleichzeitig betätigt werden (diStart = TRUE, diStop = FALSE)?',
        options: ['doK1 = TRUE', 'doK1 = FALSE', 'doK1 behält den alten Wert', 'Laufzeitfehler'], correct: 1,
        explain: 'Die UND-Verknüpfung mit diStop macht die Schaltung rücksetzdominant.' }
    ],
    exam: [
      { type: 'single', q: 'Welche Kontakte eines thermischen Überlastrelais werden in den Steuerstromkreis zur Abschaltung des Schützes eingeschleift?',
        options: ['97-98', '95-96', '13-14', '1-2'], correct: 1, explain: '95-96 ist der Öffner, der bei Auslösung den Schützkreis unterbricht.' },
      { type: 'multi', q: 'Welche Eigenschaften hat eine korrekt programmierte Störmeldung nach dem Prinzip „neu blinkt, quittiert leuchtet“?',
        options: ['Neue Störung → Leuchte blinkt', 'Quittiert und Störung steht noch an → Dauerlicht', 'Quittiert und Störung weg → Leuchte aus', 'Störung weg, aber unquittiert → Leuchte sofort aus'], correct: [0, 1, 2],
        explain: 'Eine unquittierte Störung bleibt blinkend sichtbar, auch wenn die Ursache schon verschwunden ist.' },
      { type: 'numeric', q: 'Ein Schütz hat eine Spulenleistung von {P} W bei 24 V DC. Wie viele dieser Schütze kann ein 24-V-Netzteil mit {I} A maximal gleichzeitig versorgen (ohne Reserve, abgerundet)?',
        params: { P: [2, 6, 1], I: [2, 10, 1] }, formula: 'floor(I * 24 / P)', unit: 'Stück', tol: 0,
        explain: 'Anzahl = (U · I) / P_Spule, abgerundet.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Selbsthaltung drahtbruchsicher',
        task: 'Ein Bandmotor wird über Schütz K1 geschaltet.\n\n' +
          '**Anforderungen:**\n' +
          '1. `diStart` (Schließer, Taster) schaltet `doK1` ein; K1 bleibt nach dem Loslassen an (Selbsthaltung).\n' +
          '2. `diStop` ist ein **Öffner** (TRUE = nicht betätigt). FALSE schaltet K1 sofort ab. Stopp dominiert.\n' +
          '3. `diMotorschutz` ist der Hilfskontakt 95-96 (Öffner). FALSE schaltet K1 ab und setzt `doH2` (Störung).\n' +
          '4. `doH2` bleibt an, bis der Motorschutz zurückgestellt **und** neu gestartet wird.\n' +
          '5. Kein automatischer Wiederanlauf: Kommt `diMotorschutz` zurück, bleibt K1 aus.\n' +
          '6. `doH1` (Betrieb, grün) zeigt `doK1` an.',
        hints: ['Die Störung speicherst du in einem eigenen BOOL (bFault).', 'Start soll nur wirken, wenn kein Motorschutzfehler aktiv ist.'],
        cycleMs: 10,
        io: [
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'S2 Start (Schließer)', widget: 'button' },
          { name: 'diStop', type: 'BOOL', dir: 'in', label: 'S1 Stopp (Öffner)', widget: 'switch', init: true },
          { name: 'diMotorschutz', type: 'BOOL', dir: 'in', label: 'Q1 Motorschutz 95-96 (Öffner)', widget: 'switch', init: true },
          { name: 'doK1', type: 'BOOL', dir: 'out', label: 'K1 Netzschütz', widget: 'led' },
          { name: 'doH1', type: 'BOOL', dir: 'out', label: 'H1 Betrieb (grün)', widget: 'led' },
          { name: 'doH2', type: 'BOOL', dir: 'out', label: 'H2 Störung (rot)', widget: 'led' }
        ],
        scene: { type: 'motor', bind: { run: 'doK1', fault: 'doH2' } },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Selbsthaltung, Stopp-Öffner, Motorschutz\n\tdoK1 := diStart;\n\tdoH1 := doK1;\nEND_PROGRAM\n',
          var: 'VAR\n\tbFault : BOOL;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	bFault := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	// Motorschutz ausgelöst -> Störung speichern
	IF NOT diMotorschutz THEN
		bFault := TRUE;
	END_IF
	// Neuer Start quittiert die Störung, wenn der Motorschutz zurückgestellt ist
	IF diStart AND diMotorschutz AND diStop THEN
		bFault := FALSE;
	END_IF

	doK1 := (diStart OR doK1) AND diStop AND diMotorschutz AND NOT bFault;
	doH1 := doK1;
	doH2 := bFault;
END_PROGRAM
`,
          var: 'VAR\n\tbFault : BOOL;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Start mit Selbsthaltung', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { ms: 200 },
            { expect: 'doK1 AND doH1', msg: 'K1 muss nach dem Loslassen von Start anbleiben (Selbsthaltung).' }
          ]},
          { name: 'Stopp-Öffner schaltet ab und dominiert', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
            { set: { diStop: false } }, { cycles: 2 },
            { expect: 'NOT doK1', msg: 'Stopp (FALSE) muss K1 abschalten.' },
            { set: { diStart: true } }, { cycles: 3 },
            { expect: 'NOT doK1', msg: 'Bei gedrücktem Stopp darf Start nicht wirken (Stopp dominiert).' }
          ]},
          { name: 'Drahtbruch am Stopp verhindert den Start', steps: [
            { set: { diStop: false } }, { cycles: 1 },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { never: 'doK1', ms: 500, msg: 'Mit unterbrochenem Stopp-Kreis darf der Motor nie anlaufen.' }
          ]},
          { name: 'Motorschutz: Abschalten, Störung, kein Wiederanlauf', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
            { set: { diMotorschutz: false } }, { cycles: 2 },
            { expect: 'NOT doK1 AND doH2', msg: 'Motorschutz muss K1 abschalten und H2 setzen.' },
            { set: { diMotorschutz: true } },
            { never: 'doK1', ms: 500, msg: 'Kein automatischer Wiederanlauf nach Rückstellen des Motorschutzes.' },
            { expect: 'doH2', msg: 'H2 bleibt bis zum Neustart an.' },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
            { expect: 'doK1 AND NOT doH2', msg: 'Neuer Start quittiert die Störung und startet den Motor.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'Lampentest und Sammelstörung',
        task: 'Zwei Störsignale werden zu einer Sammelstörung zusammengefasst.\n\n' +
          '**Anforderungen:**\n' +
          '1. `diStoerung1` und `diStoerung2` (TRUE = Störung aktiv).\n' +
          '2. Eine **neue** Störung (steigende Flanke an einem der beiden Signale) setzt den Zustand „unquittiert“: `doH2` blinkt mit 1 Hz (500 ms an / 500 ms aus), `doHupe` ist an.\n' +
          '3. `diQuit` quittiert: Hupe aus. Steht noch eine Störung an, leuchtet `doH2` dauernd; sonst ist `doH2` aus.\n' +
          '4. Ist eine Störung bereits verschwunden, aber noch unquittiert, blinkt `doH2` weiter.\n' +
          '5. `doH1` (Betriebsbereit, grün) ist an, wenn keine Störung ansteht.\n' +
          '6. `diLampentest` schaltet `doH1` und `doH2` ein, solange er gedrückt ist (die Hupe nicht).',
        hints: ['Blinktakt: fbBlink(IN := NOT fbBlink.Q, PT := T#500ms); bei fbBlink.Q den Merker bBlink toggeln.', 'Je Störsignal ein R_TRIG.'],
        cycleMs: 10,
        io: [
          { name: 'diStoerung1', type: 'BOOL', dir: 'in', label: 'Störung 1', widget: 'switch' },
          { name: 'diStoerung2', type: 'BOOL', dir: 'in', label: 'Störung 2', widget: 'switch' },
          { name: 'diQuit', type: 'BOOL', dir: 'in', label: 'S5 Quittieren', widget: 'button' },
          { name: 'diLampentest', type: 'BOOL', dir: 'in', label: 'S6 Lampentest', widget: 'button' },
          { name: 'doH1', type: 'BOOL', dir: 'out', label: 'H1 Betriebsbereit (grün)', widget: 'led' },
          { name: 'doH2', type: 'BOOL', dir: 'out', label: 'H2 Sammelstörung (rot)', widget: 'led' },
          { name: 'doHupe', type: 'BOOL', dir: 'out', label: 'Hupe', widget: 'led' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doH1', 'doH2', 'doHupe'] } },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Blinktakt, Flanken, Quittierung, Lampentest\n\tdoH2 := diStoerung1 OR diStoerung2;\n\tdoH1 := NOT doH2;\nEND_PROGRAM\n',
          var: 'VAR\n\tfbBlink : TON;\n\tbBlink : BOOL;\n\tfbEdge1 : R_TRIG;\n\tfbEdge2 : R_TRIG;\n\tbUnquit : BOOL;\n\tbActive : BOOL;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	bUnquit := FALSE;
	bBlink := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	// 1-Hz-Blinktakt
	fbBlink(IN := NOT fbBlink.Q, PT := T#500ms);
	IF fbBlink.Q THEN
		bBlink := NOT bBlink;
	END_IF

	bActive := diStoerung1 OR diStoerung2;
	fbEdge1(CLK := diStoerung1);
	fbEdge2(CLK := diStoerung2);
	IF fbEdge1.Q OR fbEdge2.Q THEN
		bUnquit := TRUE;
	END_IF
	IF diQuit THEN
		bUnquit := FALSE;
	END_IF

	doH2 := diLampentest OR (bUnquit AND bBlink) OR (NOT bUnquit AND bActive);
	doH1 := diLampentest OR NOT bActive;
	doHupe := bUnquit;
END_PROGRAM
`,
          var: 'VAR\n\tfbBlink : TON;\n\tbBlink : BOOL;\n\tfbEdge1 : R_TRIG;\n\tfbEdge2 : R_TRIG;\n\tbUnquit : BOOL;\n\tbActive : BOOL;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Neue Störung blinkt und hupt', steps: [
            { set: { diStoerung1: true } }, { cycles: 2 },
            { expect: 'doHupe AND NOT doH1', msg: 'Neue Störung: Hupe an, H1 aus.' },
            { until: 'doH2', maxMs: 1200, msg: 'H2 muss blinken (an).' },
            { until: 'NOT doH2', maxMs: 1200, msg: 'H2 muss blinken (aus).' },
            { until: 'doH2', maxMs: 1200, msg: 'H2 muss wieder angehen.' }
          ]},
          { name: 'Quittierte, anstehende Störung leuchtet dauernd', steps: [
            { set: { diStoerung2: true } }, { cycles: 2 },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } },
            { expect: 'NOT doHupe', msg: 'Quittieren schaltet die Hupe ab.' },
            { never: 'NOT doH2', ms: 1500, msg: 'Nach dem Quittieren muss H2 bei anstehender Störung dauernd leuchten.' }
          ]},
          { name: 'Verschwundene, unquittierte Störung blinkt weiter', steps: [
            { set: { diStoerung1: true } }, { cycles: 2 }, { set: { diStoerung1: false } }, { cycles: 2 },
            { expect: 'doH1', msg: 'Ohne anstehende Störung ist H1 an.' },
            { until: 'doH2', maxMs: 1200 }, { until: 'NOT doH2', maxMs: 1200, msg: 'Unquittiert muss H2 weiter blinken.' },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } },
            { never: 'doH2', ms: 1500, msg: 'Quittiert und Störung weg → H2 aus.' }
          ]},
          { name: 'Lampentest schaltet alle Leuchten', steps: [
            { set: { diLampentest: true } }, { cycles: 2 },
            { expect: 'doH1 AND doH2', msg: 'Lampentest muss H1 und H2 einschalten.' },
            { expect: 'NOT doHupe', msg: 'Die Hupe gehört nicht zum Lampentest.' },
            { set: { diLampentest: false } }, { cycles: 2 },
            { expect: 'NOT doH2' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Steuerstromkreis-Grundlagen'
  }
];
