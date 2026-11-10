'use strict';
// Bereich elektro – Level 3 (Senior → Prüfung Engineer)
const { vid, rd, HINWEIS } = require('./refs');
const SVG = require('./svg');

const AI_VAR = 'VAR\n\trCurrent : REAL;\n\tfbLow : TON;\n\tfbHigh : TON;\nEND_VAR\n';
const PT_VAR = 'VAR\n\trR0 : REAL;\n\trRatio : REAL;\nEND_VAR\nVAR CONSTANT\n\tA : REAL := 3.9083E-3;\n\tB : REAL := -5.775E-7;\nEND_VAR\n';
const CYL_VAR = 'VAR\n\tfbTimeoutOut : TON;\n\tfbTimeoutIn : TON;\n\tbError : BOOL;\nEND_VAR\n';
const SD_VAR = 'VAR\n\teStep : eSdStep;\n\tfbStar : TON;\n\tfbPause : TON;\n\tbOk : BOOL;\nEND_VAR\n';
const SD_TYP = 'TYPE\n\teSdStep : (SD_OFF, SD_STAR, SD_PAUSE, SD_DELTA);\nEND_TYPE\n';
const MS_VAR = 'VAR\n\trImax : REAL;\n\trImin : REAL;\n\trRatio : REAL;\n\tfbPhase : TON;\nEND_VAR\nVAR CONSTANT\n\trDt : REAL := 0.01; (* Zykluszeit 10 ms in s *)\nEND_VAR\n';

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'elektro-3-sensorik',
    level: 3,
    kind: 'lektion',
    title: 'Sensorik: digitale und analoge Signale',
    summary: 'PNP/NPN, 2-/3-/4-Leiter-Anschluss, 0–10 V und 4–20 mA mit Drahtbruch-Erkennung, PT100/PT1000 und Thermoelemente – inklusive Auswertung in ST.',
    minutes: 240,
    req: ['elektro-2-projekt-wendeschuetz'],
    briefing: 'Sensoren sind die Augen der Maschine – und ihre Signale müssen in der SPS richtig ankommen. Du lernst, wie PNP- und NPN-Sensoren schalten, wie 2-, 3- und 4-Leiter-Anschlüsse funktionieren und warum sich 4–20 mA (Live Zero) für Drahtbruch-Erkennung eignet. Für die Temperaturmessung vergleichst du Widerstandsthermometer (PT100/PT1000, Kennlinie nach DIN EN 60751) und Thermoelemente (Seebeck-Effekt, Vergleichsstelle). In zwei ST-Übungen skalierst du ein 4–20-mA-Signal mit Fehlerdiagnose und berechnest die Temperatur aus dem PT-Widerstand.',
    practice: 'Ein Drucktransmitter meldet „0 bar“ – ist der Behälter leer oder die Leitung abgerissen? Mit 4–20 mA erkennst du den Unterschied. Bei einer PT100-Messung in 2-Leiter-Technik verfälschen 10 m Leitung die Temperatur um mehrere Kelvin – das erklärt manche „falsche“ Anzeige.',
    transfer: {
      tia: 'In TIA Portal skalierst du mit NORM_X/SCALE_X; die Analogwerte liegen bei Siemens typischerweise im Bereich 0…27648. Drahtbruchdiagnose wird im Modul parametriert und als Diagnosealarm gemeldet.',
      codesys: 'In CODESYS/TwinCAT liefern die Klemmen Status-Bits für Underrange/Overrange; die Skalierung schreibst du meist selbst oder nutzt Bibliotheken.'
    },
    objectives: [
      {
        id: 'o1', title: 'Schließe PNP- und NPN-Sensoren richtig an',
        guide: {
          intro: 'PNP-Sensoren schalten +24 V auf den Ausgang (plusschaltend, „sourcing“), NPN-Sensoren schalten den Ausgang auf 0 V (minusschaltend, „sinking“).',
          steps: [
            'Adernfarben bei 3-Leiter-Sensoren (M8/M12): BN (1) = +24 V, BU (3) = 0 V, BK (4) = Schaltausgang.',
            'In Europa üblich: PNP-Sensoren an plusschaltenden (sink) Digitaleingängen.',
            'Schließer/Öffner (NO/NC) ist unabhängig von PNP/NPN.',
            '2-Leiter-Sensoren liegen in Reihe zur Last: Reststrom im ausgeschalteten Zustand und Spannungsfall im eingeschalteten Zustand beachten.',
            'Prüfe im Datenblatt des B&R-Digitaleingangsmoduls, ob es für Sink- oder Source-Beschaltung ausgelegt ist und welche Pegel als 0/1 gelten (Eingangskennlinie Typ 1/3 nach IEC 61131-2).'
          ],
          done: 'Erledigt, wenn du in der Abbildung des 3-Leiter-PNP-Sensors jede Ader der richtigen Klemme zuordnen kannst.',
          tip: 'Die LED am Sensor zeigt nur den internen Schaltzustand – nicht, ob das Signal am SPS-Eingang ankommt. Miss im Zweifel am Eingang gegen 0 V.'
        }
      },
      {
        id: 'o2', title: 'Skaliere 0–10-V- und 4–20-mA-Signale',
        guide: {
          intro: 'Analogsignale werden im Modul digitalisiert; du rechnest den Rohwert in eine physikalische Größe um.',
          steps: [
            'Lineare Skalierung: y = y_min + (x − x_min) · (y_max − y_min) / (x_max − x_min).',
            '4–20 mA: 4 mA = Messbereichsanfang („Live Zero“), 20 mA = Messbereichsende.',
            'Fehlerbereiche nach NAMUR NE 43 (Orientierung): Messbereich 3,8…20,5 mA; < 3,6 mA oder > 21 mA gilt als Fehler (Drahtbruch bzw. Kurzschluss/Transmitterfehler).',
            '2-Leiter-Transmitter werden aus der Stromschleife versorgt, 3-/4-Leiter-Geräte haben eine eigene Versorgung – prüfe im Datenblatt des Analogmoduls, ob es die Schleife speist (siehe B&R-Community-Beitrag).',
            'Konfiguriere in AS6 im Physical View in der Modulkonfiguration den Kanaltyp (Spannung/Strom) und den Messbereich, bevor du Rohwerte interpretierst.'
          ],
          code: { lang: 'st', text: 'rPressure := (rCurrent - 4.0) / 16.0 * 10.0; (* 4…20 mA → 0…10 bar *)' },
          done: 'Erledigt, wenn du einen beliebigen Rohwert in mA und physikalische Einheit umrechnen und einen Drahtbruch erkennen kannst.',
          tip: 'Filtere Fehlerzustände zeitlich (z. B. 100 ms), damit kurze Störungen nicht sofort die Maschine stoppen – aber nicht so lang, dass ein echter Fehler zu spät erkannt wird.',
          link: { label: 'B&R Community: X20AI2622 mit 4–20 mA', url: 'https://community.br-automation.com/t/x20ai2622-input-signal-4-20ma/10149' }
        }
      },
      {
        id: 'o3', title: 'Werte PT100/PT1000 aus',
        guide: {
          intro: 'Platin-Widerstandsthermometer haben bei 0 °C den Nennwiderstand R0 (100 Ω bzw. 1000 Ω).',
          steps: [
            'Kennlinie für t ≥ 0 °C: R(t) = R0 · (1 + A·t + B·t²) mit A = 3,9083·10⁻³, B = −5,775·10⁻⁷.',
            'Faustwert: PT100 ändert sich um ≈ 0,385 Ω/K; bei 100 °C sind es 138,51 Ω.',
            '2-Leiter: Leitungswiderstand geht voll in die Messung ein; 3-Leiter: wird kompensiert, wenn alle Adern gleich sind; 4-Leiter: Messstrom und Spannungsmessung getrennt – am genauesten.',
            'Umkehrung der Kennlinie: t = (−A + √(A² − 4·B·(1 − R/R0))) / (2·B).',
            'In AS6 liefern Temperaturmodule (z. B. X20AT-Serie) meist bereits die Temperatur; für Sonderfälle nutzt du den Widerstandswert.'
          ],
          done: 'Erledigt, wenn du für einen gemessenen Widerstand die Temperatur berechnen und den Fehler einer 2-Leiter-Messung abschätzen kannst.',
          tip: 'PT1000 ist bei 2-Leiter-Technik zehnmal unempfindlicher gegenüber dem Leitungswiderstand als PT100.'
        }
      },
      {
        id: 'o4', title: 'Verstehe Thermoelemente',
        guide: {
          intro: 'Ein Thermoelement erzeugt eine kleine Thermospannung proportional zur Temperaturdifferenz zwischen Mess- und Vergleichsstelle.',
          steps: [
            'Typ K (NiCr-Ni) ≈ 41 µV/K, Typ J (Fe-CuNi) ≈ 52 µV/K.',
            'Die Vergleichsstellentemperatur (Klemmenstelle) muss gemessen und kompensiert werden.',
            'Zwischen Thermoelement und Modul nur passende Ausgleichsleitung verwenden – Kupferleitung erzeugt neue Thermopaare.',
            'Vergleiche: Thermoelemente für hohe Temperaturen und schnelle Ansprechzeit, PT100 für hohe Genauigkeit im mittleren Bereich.',
            'Lies im B&R-Community-Beitrag, wie Rohwerte in µV umgerechnet und über Tabellen in Temperatur gewandelt werden.'
          ],
          done: 'Erledigt, wenn du begründen kannst, wann du ein Thermoelement und wann einen PT100 wählst und warum eine Vergleichsstelle nötig ist.',
          tip: 'Eine falsch gepolte Ausgleichsleitung erzeugt einen Fehler, der mit der Klemmentemperatur schwankt – schwer zu finden.'
        }
      }
    ],
    videos: [
      vid('pnp', 'PNP- und NPN-Näherungsschalter an der SPS.'),
      vid('ma420', 'Analogwertverarbeitung mit 4–20 mA und A/D-Wandlung.'),
      vid('pt100', '2-, 3- und 4-Leiter-Schaltung beim Pt100.')
    ],
    readings: [
      rd('htwd', 'Praktikumsskript zu Widerstandsthermometern und Thermoelementen inkl. Kennlinien.'),
      rd('abb', 'Umfassendes Herstellerhandbuch zur industriellen Temperaturmessung.'),
      rd('brc420', 'Diskussion zur Versorgung von 2-Leiter-Transmittern an einem B&R-Analogmodul.')
    ],
    quiz: [
      { type: 'numeric', q: 'Ein Drucktransmitter (0–{pmax} bar) liefert 4–20 mA. Gemessen werden {I} mA. Welcher Druck liegt an?',
        params: { pmax: [6, 40, 2], I: [4, 20, 0.5] }, formula: '(I - 4) / 16 * pmax', unit: 'bar', tol: 0.01,
        explain: 'p = (I − 4 mA) / 16 mA · p_max.' },
      { type: 'single', q: 'Welche Ader des abgebildeten 3-Leiter-PNP-Sensors führt das Schaltsignal?', figure: SVG.pnp3,
        options: ['BN (1)', 'BK (4)', 'BU (3)', 'Keine – das Signal liegt auf dem Schirm'], correct: 1,
        explain: 'BN = +24 V, BU = 0 V, BK = Schaltausgang.' },
      { type: 'numeric', q: 'Ein PT100 hat bei t ≥ 0 °C die Kennlinie R = 100 Ω · (1 + 3,9083·10⁻³ · t − 5,775·10⁻⁷ · t²). Welchen Widerstand hat er bei {t} °C?',
        params: { t: [0, 400, 10] }, formula: '100 * (1 + 3.9083e-3 * t - 5.775e-7 * t * t)', unit: 'Ω', tol: 0.002,
        explain: 'Werte in die Callendar-Van-Dusen-Gleichung (t ≥ 0 °C) einsetzen.' }
    ],
    exam: [
      { type: 'single', q: 'Warum wird für Prozessmessungen häufig 4–20 mA statt 0–20 mA verwendet?',
        options: ['Weil 4 mA weniger Energie verbrauchen', 'Weil ein Drahtbruch (0 mA) vom Messbereichsanfang (4 mA) unterscheidbar ist', 'Weil 0–20 mA nicht genormt ist', 'Weil Stromsignale keine Leitung brauchen'], correct: 1,
        explain: 'Live Zero: 0 mA ist kein gültiger Messwert und deutet auf einen Fehler hin.' },
      { type: 'numeric', q: 'Ein PT100 wird in 2-Leiter-Technik über eine Kupferleitung mit 2 × {l} m, 0,5 mm² angeschlossen (κ = 56). Um wie viel Kelvin zeigt die Messung ungefähr zu viel an (0,385 Ω/K)?',
        params: { l: [5, 50, 5] }, formula: '(2 * l / (56 * 0.5)) / 0.385', unit: 'K', tol: 0.02,
        explain: 'R_Leitung = 2 · l / (κ · A); ΔT ≈ R_Leitung / 0,385 Ω/K.' },
      { type: 'single', q: 'Was zeigt die Abbildung?', figure: SVG.pt3,
        options: ['PT100 in 2-Leiter-Schaltung', 'PT100 in 3-Leiter-Schaltung', 'PT100 in 4-Leiter-Schaltung', 'Thermoelement mit Ausgleichsleitung'], correct: 1,
        explain: 'Drei Adern: eine zusätzliche Ader an einem Anschluss ermöglicht die Kompensation des Leitungswiderstands.' },
      { type: 'multi', q: 'Welche Aussagen zu Thermoelementen sind richtig?',
        options: ['Sie messen die Temperaturdifferenz zwischen Mess- und Vergleichsstelle.', 'Zur Verlängerung wird Ausgleichsleitung verwendet.', 'Sie benötigen einen Messstrom wie ein PT100.', 'Typ K liefert etwa 41 µV/K.'], correct: [0, 1, 3],
        explain: 'Thermoelemente sind aktive Sensoren, sie erzeugen selbst eine Spannung.' },
      { type: 'numeric', q: 'Ein 0–10-V-Signal entspricht 0–{nmax} 1/min. Der Analogeingang liefert 0…32767 für 0…10 V. Welche Drehzahl gehört zum Rohwert {raw}?',
        params: { nmax: [1000, 3000, 100], raw: [0, 32767, 1000] }, formula: 'raw / 32767 * nmax', unit: '1/min', tol: 0.01,
        explain: 'n = Rohwert / 32767 · n_max.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: '4–20-mA-Skalierung mit Drahtbruch-Erkennung',
        task: 'Ein Drucktransmitter (0…10 bar, 4…20 mA) ist an einem Analogeingang angeschlossen. Der Rohwert `nRaw` (INT) entspricht in dieser Übung linear **0…32767 = 0…24 mA**.\n\n' +
          '**Anforderungen:**\n' +
          '1. Berechne den Strom `rCurrent` in mA.\n' +
          '2. Berechne den Druck `rPressure` in bar (4 mA = 0 bar, 20 mA = 10 bar), begrenzt auf 0…10 bar.\n' +
          '3. `bWireBreak` = TRUE, wenn der Strom **länger als 100 ms** unter 3,6 mA liegt.\n' +
          '4. `bShortCircuit` = TRUE, wenn der Strom **länger als 100 ms** über 21 mA liegt.\n' +
          '5. `bValid` = NOT bWireBreak AND NOT bShortCircuit. Ist der Wert ungültig, ist `rPressure` = 0 (Ersatzwert).\n' +
          '6. Kehrt das Signal in den gültigen Bereich zurück, verschwinden die Fehler selbstständig.',
        hints: ['rCurrent := INT_TO_REAL(nRaw) * 24.0 / 32767.0;', 'Zwei TON-Instanzen für die Fehlerfilterung; LIMIT(0.0, x, 10.0) begrenzt.'],
        cycleMs: 10,
        io: [
          { name: 'nRaw', type: 'INT', dir: 'in', label: 'Analogeingang Rohwert', widget: 'slider', min: 0, max: 32767, init: 13653 },
          { name: 'rPressure', type: 'REAL', dir: 'out', label: 'Druck', widget: 'gauge', min: 0, max: 10, unit: 'bar' },
          { name: 'bWireBreak', type: 'BOOL', dir: 'out', label: 'Drahtbruch', widget: 'led' },
          { name: 'bShortCircuit', type: 'BOOL', dir: 'out', label: 'Kurzschluss / Überstrom', widget: 'led' },
          { name: 'bValid', type: 'BOOL', dir: 'out', label: 'Messwert gültig', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\trCurrent := INT_TO_REAL(nRaw) * 24.0 / 32767.0;\n\t// TODO: Begrenzung und Fehlererkennung\n\trPressure := (rCurrent - 4.0) / 16.0 * 10.0;\n\tbValid := TRUE;\nEND_PROGRAM\n',
          var: AI_VAR,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	rCurrent := INT_TO_REAL(nRaw) * 24.0 / 32767.0;

	fbLow(IN := rCurrent < 3.6, PT := T#100ms);
	fbHigh(IN := rCurrent > 21.0, PT := T#100ms);
	bWireBreak := fbLow.Q;
	bShortCircuit := fbHigh.Q;
	bValid := NOT bWireBreak AND NOT bShortCircuit;

	IF bValid THEN
		rPressure := LIMIT(0.0, (rCurrent - 4.0) / 16.0 * 10.0, 10.0);
	ELSE
		rPressure := 0.0;
	END_IF
END_PROGRAM
`,
          var: AI_VAR,
          typ: ''
        },
        tests: [
          { name: '10 mA → 3,75 bar', steps: [
            { set: { nRaw: 13653 } }, { cycles: 2 },
            { expect: 'ABS(rCurrent - 10.0) < 0.01', msg: 'Rohwert 13653 entspricht ≈ 10 mA.' },
            { expect: 'ABS(rPressure - 3.75) < 0.01', msg: '(10 − 4) / 16 · 10 bar = 3,75 bar.' },
            { expect: 'bValid' }
          ]},
          { name: 'Begrenzung im tolerierten Bereich', steps: [
            { set: { nRaw: 5188 } }, { ms: 300 },
            { expect: 'rPressure = 0.0 AND bValid', msg: '3,8 mA ist gültig, der Druck wird auf 0 bar begrenzt.' },
            { set: { nRaw: 28000 } }, { ms: 300 },
            { expect: 'rPressure = 10.0 AND bValid', msg: '≈ 20,5 mA ist gültig, der Druck wird auf 10 bar begrenzt.' }
          ]},
          { name: 'Drahtbruch mit 100-ms-Filter', steps: [
            { set: { nRaw: 0 } }, { cycles: 3 },
            { expect: 'NOT bWireBreak', msg: 'Der Drahtbruch darf erst nach 100 ms gemeldet werden (Filter).' },
            { until: 'bWireBreak', maxMs: 300, msg: 'Nach 100 ms unter 3,6 mA muss Drahtbruch gemeldet werden.' },
            { expect: 'NOT bValid AND rPressure = 0.0' },
            { set: { nRaw: 13653 } }, { cycles: 2 },
            { expect: 'bValid AND NOT bWireBreak', msg: 'Nach Rückkehr des Signals muss der Wert wieder gültig sein.' }
          ]},
          { name: 'Überstrom > 21 mA', steps: [
            { set: { nRaw: 30000 } },
            { until: 'bShortCircuit', maxMs: 300, msg: '≈ 22 mA muss als Kurzschluss/Überstrom erkannt werden.' },
            { expect: 'NOT bWireBreak AND NOT bValid' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'PT100/PT1000-Kennlinie',
        task: 'Ein Messmodul liefert den Widerstand `rR` (Ω) eines Platin-Widerstandsthermometers.\n\n' +
          '**Anforderungen:**\n' +
          '1. `bPt1000` = FALSE → PT100 (R0 = 100 Ω), TRUE → PT1000 (R0 = 1000 Ω).\n' +
          '2. Berechne die Temperatur `rTemp` (°C) mit der Umkehrung der Kennlinie R = R0 · (1 + A·t + B·t²):\n   t = (−A + √(A² − 4·B·(1 − R/R0))) / (2·B), A = 3,9083E−3, B = −5,775E−7.\n   (Für t < 0 °C ist das eine Näherung, die für diese Übung genügt.)\n' +
          '3. Plausibilität: Ist R/R0 < 0,15 (Kurzschluss) oder > 4,0 (Leitungsbruch), ist `bSensorFault` = TRUE und `rTemp` = 0.\n' +
          '4. Sonst ist `bSensorFault` = FALSE.',
        hints: ['Die Konstanten A und B stehen schon in Variables.var.', 'Prüfe die Plausibilität vor der Wurzel – so kann der Ausdruck unter der Wurzel nicht negativ werden.'],
        cycleMs: 10,
        io: [
          { name: 'rR', type: 'REAL', dir: 'in', label: 'Widerstand', widget: 'slider', min: 0, max: 5000, unit: 'Ω', init: 100 },
          { name: 'bPt1000', type: 'BOOL', dir: 'in', label: 'Sensortyp PT1000', widget: 'switch' },
          { name: 'rTemp', type: 'REAL', dir: 'out', label: 'Temperatur', widget: 'gauge', min: -50, max: 400, unit: '°C' },
          { name: 'bSensorFault', type: 'BOOL', dir: 'out', label: 'Sensorfehler', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// Lineare Näherung – ersetzen durch die exakte Kennlinie und Plausibilität\n\trTemp := (rR - 100.0) / 0.385;\nEND_PROGRAM\n',
          var: PT_VAR,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	IF bPt1000 THEN
		rR0 := 1000.0;
	ELSE
		rR0 := 100.0;
	END_IF
	rRatio := rR / rR0;

	IF (rRatio < 0.15) OR (rRatio > 4.0) THEN
		bSensorFault := TRUE;
		rTemp := 0.0;
	ELSE
		bSensorFault := FALSE;
		rTemp := (-A + SQRT(A * A - 4.0 * B * (1.0 - rRatio))) / (2.0 * B);
	END_IF
END_PROGRAM
`,
          var: PT_VAR,
          typ: ''
        },
        tests: [
          { name: 'PT100 bei 0 °C und 100 °C', steps: [
            { set: { rR: 100.0 } }, { cycles: 2 },
            { expect: 'ABS(rTemp) < 0.05 AND NOT bSensorFault', msg: '100 Ω → 0 °C.' },
            { set: { rR: 138.506 } }, { cycles: 2 },
            { expect: 'ABS(rTemp - 100.0) < 0.05', msg: '138,506 Ω → 100 °C.' }
          ]},
          { name: 'PT100 bei 300 °C (nichtlinearer Bereich)', steps: [
            { set: { rR: 212.052 } }, { cycles: 2 },
            { expect: 'ABS(rTemp - 300.0) < 0.1', msg: '212,05 Ω → 300 °C; die lineare Näherung ist hier mehrere Kelvin daneben.' }
          ]},
          { name: 'PT1000 und negative Temperatur', steps: [
            { set: { bPt1000: true, rR: 1385.06 } }, { cycles: 2 },
            { expect: 'ABS(rTemp - 100.0) < 0.05', msg: 'PT1000: 1385,06 Ω → 100 °C.' },
            { set: { bPt1000: false, rR: 80.306 } }, { cycles: 2 },
            { expect: 'ABS(rTemp + 50.0) < 0.15', msg: 'PT100: 80,31 Ω → −50 °C.' }
          ]},
          { name: 'Kurzschluss und Leitungsbruch', steps: [
            { set: { rR: 5.0 } }, { cycles: 2 },
            { expect: 'bSensorFault AND rTemp = 0.0', msg: '5 Ω beim PT100 ist ein Kurzschluss.' },
            { set: { rR: 5000.0 } }, { cycles: 2 },
            { expect: 'bSensorFault', msg: '5000 Ω beim PT100 ist ein Leitungsbruch.' },
            { set: { bPt1000: true, rR: 1100.0 } }, { cycles: 2 },
            { expect: 'NOT bSensorFault', msg: '1100 Ω ist für PT1000 plausibel.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-3-aktorik',
    level: 3,
    kind: 'lektion',
    title: 'Aktorik: Relais, Halbleiterausgänge und Ventile',
    summary: 'Relais- und Transistorausgänge, Schutzbeschaltung, Magnetventile und Endlagenüberwachung – mit Diagnose im ST-Programm.',
    minutes: 210,
    req: ['elektro-3-sensorik'],
    briefing: 'Ausgänge treiben Schütze, Ventile, Meldeleuchten und Hupen. Du vergleichst Relaisausgänge (potentialfrei, AC/DC, begrenzte Schaltspiele) mit Halbleiterausgängen (verschleißfrei, schnell, kurzschlussfest, aber mit Reststrom und Strombegrenzung). Du verstehst die Rolle der Schutzbeschaltung bei induktiven Lasten und die Ansteuerung von Magnetventilen (monostabil/bistabil). In der Übung überwachst du einen Pneumatikzylinder über Endlagen, Laufzeit und Kanaldiagnose des Ausgangsmoduls.',
    practice: 'Ein Zylinder klemmt, ein Ventilstecker ist abgezogen, ein Ausgang meldet Überlast: Eine gute Maschine erkennt das innerhalb von Sekunden und zeigt eine eindeutige Fehlermeldung an, statt im Zustand „wartet auf Endlage“ hängen zu bleiben.',
    transfer: {
      tia: 'Bei Siemens-DQ-Modulen liefert die Kanaldiagnose (Drahtbruch, Kurzschluss) Diagnosealarme; die Endlagenüberwachung programmierst du identisch mit TON.',
      codesys: 'Beckhoff-Ausgangsklemmen mit Diagnose melden Kurzschluss/Überlast über Status-Bits, die du wie diY1Diag auswertest.'
    },
    objectives: [
      {
        id: 'o1', title: 'Vergleiche Relais- und Halbleiterausgänge',
        guide: {
          intro: 'Die Wahl des Ausgangstyps hängt von Last, Schalthäufigkeit und Potential ab.',
          steps: [
            'Relais: galvanisch getrennt, AC und DC, aber mechanischer Verschleiß und Prellen; elektrische Lebensdauer hängt stark von der Last ab.',
            'Transistor (plusschaltend, „high-side“): typisch 0,5 A oder 2 A je Kanal, kurzschlussfest, schnell; Reststrom im ausgeschalteten Zustand.',
            'Triac/SSR für AC-Lasten: Nullspannungsschalter, Wärmeableitung beachten.',
            'Prüfe für einen B&R-Digitalausgang im Datenblatt Nennstrom, Summenstrom pro Modul, Schutzbeschaltung und Diagnose.',
            'Ordne zu: Schützspule 24 V DC → Transistor; Lampe 230 V AC → Relais; Ventil mit 10 Hz Taktung → Transistor.'
          ],
          done: 'Erledigt, wenn du für fünf Lasten den passenden Ausgangstyp begründet auswählen kannst.',
          tip: 'Der Summenstrom eines Moduls ist oft kleiner als „Kanalzahl × Kanalstrom“ – nicht alle Kanäle dürfen gleichzeitig voll belastet werden.'
        }
      },
      {
        id: 'o2', title: 'Wähle Schutzbeschaltung und Ventilansteuerung',
        guide: {
          intro: 'Induktive Lasten erzeugen beim Abschalten Überspannungen; Ventile gibt es monostabil (Federrückstellung) und bistabil (Impulsventil).',
          steps: [
            'Viele Halbleiterausgänge haben eine interne Löschschaltung – die zulässige Abschaltenergie steht im Datenblatt.',
            'Ventilstecker mit LED und Schutzbeschaltung (Diode/Varistor) sind verbreitet.',
            'Monostabiles 5/2-Wegeventil: Spule an = Arbeitsstellung, Spule aus = Grundstellung (sicher bei Energieausfall?).',
            'Bistabiles Ventil: bleibt bei Energieausfall in der letzten Stellung – Verhalten beim Wiederanlauf bewerten.',
            'Lege fest, welche Stellung der Zylinder bei Not-Halt/Energieausfall einnehmen soll (Risikobeurteilung).'
          ],
          done: 'Erledigt, wenn du für einen Zylinder begründen kannst, ob ein monostabiles oder bistabiles Ventil eingesetzt wird.',
          tip: 'Das Verhalten bei Energieausfall ist eine Sicherheitsfrage – entscheide sie nicht allein im Programm. ' + HINWEIS
        }
      },
      {
        id: 'o3', title: 'Überwache Endlagen und Laufzeiten',
        guide: {
          intro: 'Jede Bewegung bekommt eine Überwachungszeit; jede Endlage wird plausibilisiert.',
          steps: [
            'Starte beim Ansteuern des Ventils einen TON mit der maximal erwarteten Laufzeit (z. B. 1,5 s).',
            'Kommt die Endlage nicht rechtzeitig, setze einen Fehler mit eindeutigem Fehlercode.',
            'Beide Endlagen gleichzeitig TRUE ist unplausibel (Sensorfehler).',
            'Werte die Kanaldiagnose des Ausgangs (Überlast/Kurzschluss) aus – in AS6 findest du sie im I/O Mapping des Moduls.',
            'Quittieren erst zulassen, wenn die Ursache weg ist.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung „Zylinder mit Endlagen- und Ausgangsdiagnose“ bestehen.',
          tip: 'Gib im Fehlercode an, was erwartet wurde („Endlage vorn nicht erreicht“) – nicht nur „Zylinderfehler“.',
          link: { label: 'B&R Community: I/O-Datenpunkte für die Diagnose', url: 'https://community.br-automation.com/t/helpful-i-o-datapoints-for-machine-diagnostics/655' }
        }
      }
    ],
    videos: [
      vid('doKarte', 'Aufbau und Funktion einer binären SPS-Ausgangskarte.'),
      vid('ventil', 'Monostabile und bistabile 5/2-Wegeventile in SPS-Steuerungen.'),
      vid('freilauf', 'Wiederholung: Abschaltüberspannung und Freilaufdiode.')
    ],
    readings: [
      rd('brcDiag', 'Welche Diagnose-Datenpunkte B&R-I/O-Module bieten und wie man sie nutzt.'),
      rd('zveiEmv', 'Hinweise zu Sensoren/Aktoren und Schutzbeschaltung aus EMV-Sicht.')
    ],
    quiz: [
      { type: 'single', q: 'Welcher Ausgangstyp eignet sich am besten für ein Ventil, das mit 10 Hz getaktet wird?',
        options: ['Relaisausgang', 'Transistorausgang', 'Triac-Ausgang', 'Analogausgang 0–10 V'], correct: 1,
        explain: 'Transistorausgänge sind verschleißfrei und schnell; Relais wären nach kurzer Zeit verschlissen.' },
      { type: 'numeric', q: 'Ein 24-V-Ausgangsmodul hat 8 Kanäle mit je 0,5 A, aber einen Summenstrom von {Isum} A. Wie viele Ventile mit je {P} W dürfen höchstens gleichzeitig eingeschaltet sein?',
        params: { Isum: [2, 4, 1], P: [3, 6, 1] }, formula: 'min(8, floor(Isum / (P / 24)))', unit: 'Stück', tol: 0,
        explain: 'I_Ventil = P / 24 V; Anzahl = Summenstrom / I_Ventil (abgerundet, höchstens 8).' },
      { type: 'single', q: 'Was passiert mit einem Zylinder an einem monostabilen 5/2-Wegeventil, wenn die 24-V-Versorgung ausfällt?',
        options: ['Er bleibt stehen, wo er ist', 'Er fährt in die Grundstellung (Federrückstellung)', 'Er fährt in die Arbeitsstellung', 'Das Ventil schaltet zufällig'], correct: 1,
        explain: 'Monostabile Ventile kehren ohne Spulenstrom in die Grundstellung zurück.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Eigenschaften haben typische Halbleiterausgänge (24 V DC, plusschaltend)?',
        options: ['Kurzschlussfestigkeit', 'Reststrom im ausgeschalteten Zustand', 'Galvanische Trennung jedes Kanals vom Lastpotential', 'Verschleißfreiheit'], correct: [0, 1, 3],
        explain: 'Galvanische Trennung kanalweise bietet ein Relais; Halbleiterausgänge teilen meist ein Potential.' },
      { type: 'single', q: 'Ein Zylinder meldet gleichzeitig „Endlage hinten“ und „Endlage vorn“. Wie reagiert ein gutes Programm?',
        options: ['Ignorieren, die vordere Endlage gewinnt', 'Fehler „Endlagen unplausibel“ und Ventil in definierten Zustand', 'Zylinder ausfahren', 'SPS neu starten'], correct: 1,
        explain: 'Beide Endlagen gleichzeitig sind physikalisch unmöglich → Sensorfehler.' },
      { type: 'numeric', q: 'Ein Relaiskontakt hat bei einer Last eine elektrische Lebensdauer von {n} Schaltspielen. Die Maschine schaltet {f} mal pro Minute, 16 h am Tag. Nach wie vielen Tagen ist die Lebensdauer erreicht?',
        params: { n: [100000, 1000000, 100000], f: [2, 20, 2] }, formula: 'n / (f * 60 * 16)', unit: 'Tage', tol: 0.01,
        explain: 'Schaltspiele pro Tag = f · 60 · 16; Tage = n / Schaltspiele pro Tag.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Zylinder mit Endlagen- und Ausgangsdiagnose',
        task: 'Ein Pneumatikzylinder wird über ein monostabiles 5/2-Wegeventil (`doY1`) ausgefahren; ohne Ansteuerung fährt er ein. Die Anlage simuliert eine Hublaufzeit von etwa 1 s.\n\n' +
          '**Anforderungen:**\n' +
          '1. `diAusfahren` = TRUE → `doY1` = TRUE (sofern kein Fehler).\n' +
          '2. Überwachungszeit Ausfahren: Ist `doY1` an und die Endlage vorn `diOut` nach **1,5 s** nicht erreicht → `bError`, `nErrorCode` = 1.\n' +
          '3. Überwachungszeit Einfahren: Ist `doY1` aus und `diIn` nach 1,5 s nicht erreicht → `bError`, `nErrorCode` = 2.\n' +
          '4. `diIn` und `diOut` gleichzeitig → `bError`, `nErrorCode` = 3.\n' +
          '5. Kanaldiagnose `diY1Diag` (TRUE = Überlast/Kurzschluss am Ausgang) → `bError`, `nErrorCode` = 4.\n' +
          '6. Es wird nur der **erste** Fehlercode gespeichert. Bei Fehler ist `doY1` = FALSE.\n' +
          '7. `diQuit` setzt Fehler und Code zurück, aber nur wenn keine Ursache 3 oder 4 mehr ansteht.\n\n' +
          '`bSimJam` simuliert einen klemmenden Zylinder.',
        hints: ['Zwei TON: fbTimeoutOut(IN := doY1 AND NOT diOut, …) und fbTimeoutIn(IN := NOT doY1 AND NOT diIn, …).', 'Schreibe den Fehlercode nur, wenn bError noch FALSE ist.'],
        cycleMs: 10,
        io: [
          { name: 'diAusfahren', type: 'BOOL', dir: 'in', label: 'Befehl Ausfahren', widget: 'switch' },
          { name: 'diQuit', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'diY1Diag', type: 'BOOL', dir: 'in', label: 'Kanaldiagnose Y1 (Überlast)', widget: 'switch' },
          { name: 'bSimJam', type: 'BOOL', dir: 'in', label: 'Simulation: Zylinder klemmt', widget: 'switch' },
          { name: 'diIn', type: 'BOOL', dir: 'in', label: '-BG1 Endlage hinten', widget: 'led' },
          { name: 'diOut', type: 'BOOL', dir: 'in', label: '-BG2 Endlage vorn', widget: 'led' },
          { name: 'rStroke', type: 'REAL', dir: 'in', label: 'Hub (Simulation)', widget: 'value' },
          { name: 'doY1', type: 'BOOL', dir: 'out', label: '-MB1 Ventil Ausfahren', widget: 'led' },
          { name: 'nErrorCode', type: 'INT', dir: 'out', label: 'Fehlercode', widget: 'value' }
        ],
        scene: { type: 'cylinder', bind: { extend: 'doY1', isOut: 'diOut', isIn: 'diIn', stroke: 'rStroke' } },
        plant: {
          var: 'VAR\n\trPos : REAL;\nEND_VAR\n',
          code: 'IF NOT bSimJam THEN\n\tIF doY1 THEN\n\t\trPos := rPos + 1.0 * PLANT_DT;\n\tELSE\n\t\trPos := rPos - 1.0 * PLANT_DT;\n\tEND_IF\nEND_IF\nrPos := LIMIT(0.0, rPos, 1.0);\nrStroke := rPos;\ndiOut := rPos >= 0.98;\ndiIn := rPos <= 0.02;\n'
        },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Überwachung ergänzen\n\tdoY1 := diAusfahren;\nEND_PROGRAM\n',
          var: CYL_VAR,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	bError := FALSE;
	nErrorCode := 0;
END_PROGRAM

PROGRAM _CYCLIC
	fbTimeoutOut(IN := doY1 AND NOT diOut, PT := T#1500ms);
	fbTimeoutIn(IN := NOT doY1 AND NOT diIn, PT := T#1500ms);

	IF NOT bError THEN
		IF fbTimeoutOut.Q THEN
			bError := TRUE;
			nErrorCode := 1;
		ELSIF fbTimeoutIn.Q THEN
			bError := TRUE;
			nErrorCode := 2;
		ELSIF diIn AND diOut THEN
			bError := TRUE;
			nErrorCode := 3;
		ELSIF diY1Diag THEN
			bError := TRUE;
			nErrorCode := 4;
		END_IF
	END_IF

	IF diQuit AND NOT (diIn AND diOut) AND NOT diY1Diag THEN
		bError := FALSE;
		nErrorCode := 0;
	END_IF

	doY1 := diAusfahren AND NOT bError;
END_PROGRAM
`,
          var: CYL_VAR,
          typ: ''
        },
        tests: [
          { name: 'Normaler Hub ohne Fehler', steps: [
            { cycles: 2 },
            { set: { diAusfahren: true } },
            { until: 'diOut', maxMs: 1500, msg: 'Der Zylinder muss in ca. 1 s ausfahren.' },
            { expect: 'nErrorCode = 0 AND doY1', msg: 'Ein normaler Hub darf keinen Fehler auslösen.' },
            { set: { diAusfahren: false } },
            { until: 'diIn', maxMs: 1500 },
            { ms: 1000 },
            { expect: 'nErrorCode = 0', msg: 'Auch das Einfahren darf keinen Fehler auslösen.' }
          ]},
          { name: 'Klemmender Zylinder → Fehlercode 1', steps: [
            { set: { bSimJam: true, diAusfahren: true } },
            { ms: 1200 },
            { expect: 'nErrorCode = 0', msg: 'Vor Ablauf der 1,5 s darf kein Fehler kommen.' },
            { until: 'nErrorCode = 1', maxMs: 600, msg: 'Nach 1,5 s ohne Endlage vorn muss Fehlercode 1 kommen.' },
            { expect: 'NOT doY1', msg: 'Bei Fehler muss das Ventil abschalten.' }
          ]},
          { name: 'Kanaldiagnose → Fehlercode 4, Quittieren erst ohne Ursache', steps: [
            { set: { diAusfahren: true } }, { ms: 200 },
            { set: { diY1Diag: true } }, { cycles: 2 },
            { expect: 'nErrorCode = 4 AND NOT doY1', msg: 'Überlast am Ausgang muss Fehlercode 4 setzen und das Ventil abschalten.' },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } }, { cycles: 1 },
            { expect: 'nErrorCode = 4', msg: 'Solange die Diagnose ansteht, darf nicht quittiert werden.' },
            { set: { diY1Diag: false } },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } }, { cycles: 1 },
            { expect: 'nErrorCode = 0 AND doY1', msg: 'Nach Beheben der Ursache quittiert diQuit, das Ventil darf wieder schalten.' }
          ]},
          { name: 'Nur der erste Fehler zählt', steps: [
            { set: { bSimJam: true, diAusfahren: true } },
            { until: 'nErrorCode = 1', maxMs: 2000 },
            { set: { diY1Diag: true } }, { cycles: 3 },
            { expect: 'nErrorCode = 1', msg: 'Ein Folgefehler darf den ersten Fehlercode nicht überschreiben.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-3-projekt-motorabgang',
    level: 3,
    kind: 'projekt',
    title: 'Praxisprojekt: Asynchronmotor, Stern-Dreieck-Anlauf und Motorschutz',
    summary: 'Drehstrom-Asynchronmotor, Typenschild, Stern-Dreieck-Anlauf mit Zeitumschaltung und eine Motorschutz-Auswertung mit thermischem Abbild.',
    minutes: 360,
    req: ['elektro-3-aktorik'],
    briefing: 'Der Drehstrom-Asynchronmotor mit Kurzschlussläufer ist der häufigste Antrieb in der Industrie. Du lernst Drehfeld, Synchrondrehzahl und Schlupf, liest das Typenschild vollständig und verstehst, wann ein Stern-Dreieck-Anlauf den Anlaufstrom sinnvoll begrenzt. Danach programmierst du die Stern-Dreieck-Umschaltung als Zustandsautomat und eine Motorschutz-Auswertung mit thermischem Abbild, Phasenausfall- und Kaltleiterüberwachung – wie sie elektronische Motorschutzrelais intern realisieren.',
    practice: 'Ein Lüftermotor 11 kW soll mit Stern-Dreieck anlaufen: Das Typenschild muss „400/690 V Δ/Y“ zeigen, das Motorschutzrelais im Strang wird auf 0,58 · I_N eingestellt und die Umschaltzeit so gewählt, dass der Motor im Stern nahezu seine Drehzahl erreicht.',
    transfer: {
      tia: 'Siemens SIRIUS-Motorstarter und 3RW-Sanftstarter übernehmen Anlauf und Motorschutz in Hardware; die Logik der Zeitumschaltung entspricht dem hier programmierten Automaten.',
      codesys: 'In CODESYS programmierst du denselben Automaten mit CASE und Enum; elektronische Motorschutzrelais liefern Ströme und thermisches Abbild oft per IO-Link.'
    },
    objectives: [
      {
        id: 'o1', title: 'Erkläre Drehfeld, Synchrondrehzahl und Schlupf',
        guide: {
          intro: 'Die drei um 120° versetzten Ströme im Ständer erzeugen ein Drehfeld; der Läufer dreht etwas langsamer (Schlupf).',
          steps: [
            'Synchrondrehzahl: n_s = 60 · f / p (p = Polpaarzahl). 50 Hz, p = 2 → 1500 1/min.',
            'Schlupf: s = (n_s − n) / n_s; typische Nennschlüpfe liegen bei wenigen Prozent.',
            'Drehrichtungsumkehr durch Tausch zweier Außenleiter.',
            'Drehmoment: M = P / (2 · π · n) mit n in 1/s; M = 9550 · P[kW] / n[1/min] in Nm.',
            'Lies das Skript der TU Darmstadt zum Betriebsverhalten (Kennlinie M(n), Kippmoment).'
          ],
          done: 'Erledigt, wenn du aus Typenschilddaten Polpaarzahl, Schlupf und Nennmoment berechnen kannst.',
          tip: 'Ein Motor mit 1450 1/min auf dem Typenschild ist ein 4-poliger Motor (p = 2).'
        }
      },
      {
        id: 'o2', title: 'Lies das Typenschild vollständig',
        guide: {
          intro: 'Das Leistungsschild enthält alle Daten für Anschluss, Schutz und Betrieb.',
          steps: [
            'Spannung und Schaltung, z. B. „230/400 V Δ/Y“: am 400-V-Netz in Stern; „400/690 V Δ/Y“: am 400-V-Netz in Dreieck (Stern-Dreieck-Anlauf möglich).',
            'Bemessungsleistung P_N = mechanische Abgabeleistung an der Welle.',
            'Bemessungsstrom, cos φ, Drehzahl, Frequenz, Wirkungsgradklasse (IE-Klasse).',
            'Betriebsart (S1 Dauerbetrieb …), Schutzart (IP55), Isolierstoffklasse (F, B-Ausnutzung).',
            'Rechne die aufgenommene Leistung: P_auf = √3 · U · I · cos φ und den Wirkungsgrad η = P_N / P_auf.'
          ],
          done: 'Erledigt, wenn du für ein reales Typenschild die richtige Schaltung am 400-V-Netz und die Einstellung des Motorschutzes angeben kannst.',
          tip: 'Bei Stern-Dreieck-Anlauf liegt das Motorschutzrelais meist im Strang (hinter dem Netzschütz): Einstellwert = I_N / √3 ≈ 0,58 · I_N.'
        }
      },
      {
        id: 'o3', title: 'Plane den Stern-Dreieck-Anlauf',
        guide: {
          intro: 'Im Stern liegt an jedem Strang nur U/√3 – Anlaufstrom und Anlaufmoment sinken auf etwa ein Drittel.',
          steps: [
            'Voraussetzung: Motor ist für Dreieck an Netzspannung ausgelegt (400 V Δ).',
            'Ablauf: Netzschütz und Sternschütz ein → nach Hochlaufzeit Sternschütz aus → kurze Pause → Dreieckschütz ein.',
            'Stern- und Dreieckschütz gegeneinander verriegeln (Kurzschluss!).',
            'Die Umschaltpause (typisch einige 10 ms) verhindert einen Kurzschluss durch den Lichtbogen des Sternschützes.',
            'Bewerte: Stern-Dreieck nur bei geringem Lastmoment beim Anlauf (Lüfter, Pumpen im Leerlauf), sonst Sanftanlauf oder Frequenzumrichter.'
          ],
          done: 'Erledigt, wenn du den Ablauf als Zustandsdiagramm mit Zeiten und Verriegelungen zeichnen kannst.',
          tip: 'Ist die Sternzeit zu kurz, entsteht beim Umschalten ein hoher Stromstoß – fast wie bei Direktanlauf.'
        }
      },
      {
        id: 'o4', title: 'Programmiere Stern-Dreieck-Umschaltung und Motorschutz-Auswertung',
        guide: {
          intro: 'Du setzt beide Funktionen als ST-Programme mit Zustandsautomat und Fehlerbehandlung um.',
          steps: [
            'Lege in Types.typ den Enum eSdStep an (in AS6: Datei **Types.typ** im Programmordner, **File › Save** Strg+S).',
            'Programmiere den Automaten mit CASE; Zeiten über TON, die nur im jeweiligen Zustand laufen.',
            'Stopp und Motorschutz wirken außerhalb des CASE und haben Vorrang.',
            'Programmiere das thermische Abbild in Übung 2 und prüfe die Auslösezeit rechnerisch nach.',
            'Reiche nach bestandenen Tests den Nachweis ein.'
          ],
          done: 'Erledigt, wenn alle Tests beider Übungen bestehen und dein Nachweis eingereicht ist.',
          tip: 'Ein elektronisches Motorschutzrelais vergisst sein thermisches Abbild nicht beim Quittieren – deine Software auch nicht.'
        }
      }
    ],
    videos: [
      vid('asm', 'Funktionsweise des Drehstrom-Asynchronmotors.'),
      vid('typenschild', 'Das Motortypenschild Punkt für Punkt erklärt.'),
      vid('sdanlauf', 'Stern-Dreieck-Anlauf mit Strom- und Momentenverlauf.')
    ],
    readings: [
      rd('binder', 'Ausführliches Hochschulskript zur Asynchronmaschine: Drehfeld, Ersatzschaltbild, Anlauf.'),
      rd('boecker', 'Ergänzung zu Drehstromantrieben, Raumzeigern und Drehzahlstellung.')
    ],
    quiz: [
      { type: 'numeric', q: 'Ein Motor hat {p} Polpaare und wird mit 50 Hz betrieben. Die Nenndrehzahl beträgt {n} % der Synchrondrehzahl. Wie groß ist die Nenndrehzahl?',
        params: { p: [1, 4, 1], n: [94, 98, 1] }, formula: '60 * 50 / p * n / 100', unit: '1/min', tol: 0.01,
        explain: 'n_s = 60 · f / p; n = n_s · (1 − s).' },
      { type: 'single', q: 'Auf dem Typenschild steht „230/400 V Δ/Y“. Wie wird der Motor am 400/230-V-Netz angeschlossen und ist Stern-Dreieck-Anlauf möglich?',
        options: ['Dreieck, Stern-Dreieck möglich', 'Stern, Stern-Dreieck nicht möglich', 'Dreieck, Stern-Dreieck nicht möglich', 'Stern, Stern-Dreieck möglich'], correct: 1,
        explain: 'Die Wicklung verträgt 230 V; am 400-V-Netz nur im Stern. Für Stern-Dreieck müsste sie 400 V im Dreieck vertragen.' },
      { type: 'numeric', q: 'Ein Motor mit I_N = {I} A läuft im Stern-Dreieck-Anlauf; das Motorschutzrelais liegt im Strang. Auf welchen Strom wird es eingestellt?',
        params: { I: [10, 60, 2] }, formula: 'I / sqrt(3)', unit: 'A', tol: 0.02,
        explain: 'Strangstrom im Dreieck = I_N / √3 ≈ 0,58 · I_N.' }
    ],
    exam: [
      { type: 'numeric', q: 'Ein Motor gibt {P} kW bei {n} 1/min ab. Wie groß ist das Nennmoment?',
        params: { P: [1, 55, 1], n: [1400, 2950, 50] }, formula: '9550 * P / n', unit: 'Nm', tol: 0.01,
        explain: 'M = 9550 · P[kW] / n[1/min].' },
      { type: 'numeric', q: 'Typenschild: 400 V, I = {I} A, cos φ = 0,85, P_N = {P} kW. Wie groß ist der Wirkungsgrad in %?',
        params: { I: [20, 30, 1], P: [9, 11, 1] }, formula: 'P * 1000 / (sqrt(3) * 400 * I * 0.85) * 100', unit: '%', tol: 0.01,
        explain: 'η = P_N / (√3 · U · I · cos φ).' },
      { type: 'single', q: 'Auf welchen Anteil sinkt der Anlaufstrom aus dem Netz beim Stern-Dreieck-Anlauf im Vergleich zum Direktanlauf in Dreieck?',
        options: ['1/√3', '1/2', '1/3', '1/9'], correct: 2,
        explain: 'Strangspannung um √3 kleiner → Strangstrom um √3 kleiner; Leiterstrom zusätzlich um √3 (Stern statt Dreieck) → 1/3.' },
      { type: 'multi', q: 'Welche Schutzfunktionen bietet ein typischer Motorschutzschalter?',
        options: ['Überlastschutz (thermisch/elektronisch)', 'Kurzschlussschutz (magnetisch)', 'Fehlerstromschutz 30 mA', 'Trennfunktion (je nach Gerät)'], correct: [0, 1, 3],
        explain: 'Fehlerstromschutz ist Aufgabe einer RCD, nicht des Motorschutzschalters.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Stern-Dreieck-Umschaltung mit Zeit',
        task: 'Ein Lüftermotor wird mit Stern-Dreieck-Anlauf gestartet: -QA1 Netzschütz (`doQ1`), -QA2 Sternschütz (`doQ2`), -QA3 Dreieckschütz (`doQ3`).\n\n' +
          '**Anforderungen:**\n' +
          '1. `diStart` (Taster) startet, wenn `diStop` und `diMotorschutz` (beide Öffner) TRUE sind.\n' +
          '2. Zustand **Stern**: `doQ1` und `doQ2` an, für **3 s**.\n' +
          '3. Zustand **Pause**: `doQ2` aus, `doQ1` bleibt an, für **60 ms**.\n' +
          '4. Zustand **Dreieck**: `doQ1` und `doQ3` an; `doH1` (Betrieb) an.\n' +
          '5. `doQ2` und `doQ3` dürfen **nie** gleichzeitig an sein.\n' +
          '6. `diStop` = FALSE oder `diMotorschutz` = FALSE → sofort alles aus (Zustand Aus). Kein automatischer Wiederanlauf.\n\n' +
          'Der Enum `eSdStep` ist in Types.typ vorgegeben (in AS6 läge er in der Types.typ des Programms).',
        hints: ['fbStar(IN := eStep = SD_STAR, PT := T#3s); fbPause(IN := eStep = SD_PAUSE, PT := T#60ms);', 'Ausgänge nach dem CASE aus dem Zustand ableiten.'],
        cycleMs: 10,
        io: [
          { name: 'diStart', type: 'BOOL', dir: 'in', label: '-SF2 Start', widget: 'button' },
          { name: 'diStop', type: 'BOOL', dir: 'in', label: '-SF1 Stopp (Öffner)', widget: 'switch', init: true },
          { name: 'diMotorschutz', type: 'BOOL', dir: 'in', label: '-FC1 Motorschutz 95-96', widget: 'switch', init: true },
          { name: 'doQ1', type: 'BOOL', dir: 'out', label: '-QA1 Netz', widget: 'led' },
          { name: 'doQ2', type: 'BOOL', dir: 'out', label: '-QA2 Stern', widget: 'led' },
          { name: 'doQ3', type: 'BOOL', dir: 'out', label: '-QA3 Dreieck', widget: 'led' },
          { name: 'doH1', type: 'BOOL', dir: 'out', label: '-PF1 Betrieb', widget: 'led' }
        ],
        scene: { type: 'motor', bind: { run: 'doQ1' } },
        files: {
          main: 'PROGRAM _INIT\n\teStep := SD_OFF;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Zustandsautomat Stern → Pause → Dreieck\n\tdoQ1 := (diStart OR doQ1) AND diStop AND diMotorschutz;\n\tdoQ2 := doQ1;\nEND_PROGRAM\n',
          var: SD_VAR,
          typ: SD_TYP
        },
        solution: {
          main: `PROGRAM _INIT
	eStep := SD_OFF;
END_PROGRAM

PROGRAM _CYCLIC
	bOk := diStop AND diMotorschutz;

	fbStar(IN := (eStep = SD_STAR), PT := T#3s);
	fbPause(IN := (eStep = SD_PAUSE), PT := T#60ms);

	CASE eStep OF
		SD_OFF:
			IF diStart AND bOk THEN
				eStep := SD_STAR;
			END_IF
		SD_STAR:
			IF fbStar.Q THEN
				eStep := SD_PAUSE;
			END_IF
		SD_PAUSE:
			IF fbPause.Q THEN
				eStep := SD_DELTA;
			END_IF
		SD_DELTA:
			eStep := SD_DELTA;
	END_CASE

	IF NOT bOk THEN
		eStep := SD_OFF;
	END_IF

	doQ1 := (eStep <> SD_OFF);
	doQ2 := (eStep = SD_STAR);
	doQ3 := (eStep = SD_DELTA) AND NOT doQ2;
	doH1 := (eStep = SD_DELTA);
END_PROGRAM
`,
          var: SD_VAR,
          typ: SD_TYP
        },
        tests: [
          { name: 'Ablauf Stern → Pause → Dreieck', steps: [
            { cycles: 2 },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 1 },
            { expect: 'doQ1 AND doQ2 AND NOT doQ3', msg: 'Nach Start: Netz- und Sternschütz an.' },
            { ms: 2500 },
            { expect: 'doQ2', msg: 'Nach 2,5 s muss der Motor noch im Stern laufen (Sternzeit 3 s).' },
            { until: 'NOT doQ2', maxMs: 700, msg: 'Nach 3 s muss das Sternschütz abfallen.' },
            { expect: 'doQ1 AND NOT doQ3', msg: 'In der Umschaltpause: nur Netzschütz an.' },
            { until: 'doQ3', maxMs: 200, msg: 'Nach der Pause muss das Dreieckschütz einschalten.' },
            { expect: 'doQ1 AND doH1' }
          ]},
          { name: 'Stern und Dreieck nie gleichzeitig', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { never: 'doQ2 AND doQ3', ms: 2000, msg: 'Stern- und Dreieckschütz gleichzeitig = Kurzschluss!' },
            { until: 'doQ3', maxMs: 3000 },
            { never: 'doQ2 AND doQ3', ms: 500 }
          ]},
          { name: 'Stopp im Stern schaltet alles ab', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { ms: 1000 },
            { set: { diStop: false } }, { cycles: 2 },
            { expect: 'NOT doQ1 AND NOT doQ2 AND NOT doQ3', msg: 'Stopp muss sofort alle Schütze abschalten.' },
            { set: { diStop: true } }, { ms: 300 },
            { expect: 'NOT doQ1', msg: 'Kein automatischer Wiederanlauf.' },
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 1 },
            { expect: 'doQ1 AND doQ2', msg: 'Neustart beginnt wieder im Stern.' }
          ]},
          { name: 'Motorschutz im Dreieck', steps: [
            { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
            { until: 'doQ3', maxMs: 4000 },
            { set: { diMotorschutz: false } }, { cycles: 2 },
            { expect: 'NOT doQ1 AND NOT doQ3 AND NOT doH1', msg: 'Motorschutz muss abschalten.' },
            { set: { diMotorschutz: true, diStart: false } },
            { never: 'doQ1', ms: 500, msg: 'Kein Wiederanlauf ohne neuen Start.' }
          ]},
          { name: 'Start bei offenem Stopp-Kreis', steps: [
            { set: { diStop: false } }, { cycles: 1 },
            { set: { diStart: true } }, { cycles: 3 }, { set: { diStart: false } },
            { never: 'doQ1 OR doQ2 OR doQ3', ms: 500, msg: 'Bei offenem Stopp-Kreis darf nichts einschalten.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'Motorschutz-Auswertung mit thermischem Abbild',
        task: 'Ein Strommessmodul liefert die drei Motorströme. Programmiere eine vereinfachte elektronische Motorschutzfunktion (Zykluszeit 10 ms).\n\n' +
          '**Anforderungen:**\n' +
          '1. `rImax` / `rImin` = größter / kleinster der drei Ströme; Verhältnis `rRatio` = rImax / rIn.\n' +
          '2. Thermisches Abbild `rHeat` (0…100 %): Ist rRatio > 1, steigt es pro Sekunde um 10 · (rRatio² − 1) %; sonst fällt es um 2 %/s. Auf 0…100 begrenzen.\n' +
          '3. Auslösung Überlast bei rHeat ≥ 100 → `bTrip`, `nTripCause` = 1.\n' +
          '4. Phasenausfall: rImin < 0,5 · rImax und rImax > 0,3 · rIn länger als **500 ms** → `bTrip`, `nTripCause` = 2.\n' +
          '5. Kaltleiter-Auslösegerät `diThermistor` (Öffner) = FALSE → sofort `bTrip`, `nTripCause` = 3.\n' +
          '6. Nur der erste Auslösegrund wird gespeichert. `doFreigabe` = NOT bTrip (gibt den Schützkreis frei).\n' +
          '7. `diQuit` setzt zurück, wenn rHeat < 50 %, `diThermistor` = TRUE und kein Phasenausfall ansteht.\n' +
          '8. Ist `rIn` ≤ 0 (Parametrierfehler), gilt rRatio = 0 und `bTrip` mit `nTripCause` = 4.',
        hints: ['Bei 10 ms Zykluszeit ist dt = 0,01 s (Konstante rDt).', 'Bei I = 2 · I_N steigt das Abbild um 30 %/s → Auslösung nach ≈ 3,3 s.'],
        cycleMs: 10,
        io: [
          { name: 'rI1', type: 'REAL', dir: 'in', label: 'Strom L1', widget: 'slider', min: 0, max: 50, unit: 'A' },
          { name: 'rI2', type: 'REAL', dir: 'in', label: 'Strom L2', widget: 'slider', min: 0, max: 50, unit: 'A' },
          { name: 'rI3', type: 'REAL', dir: 'in', label: 'Strom L3', widget: 'slider', min: 0, max: 50, unit: 'A' },
          { name: 'rIn', type: 'REAL', dir: 'in', label: 'Motornennstrom (Parameter)', widget: 'slider', min: 0, max: 50, unit: 'A', init: 10 },
          { name: 'diThermistor', type: 'BOOL', dir: 'in', label: 'Kaltleiter-Auslösegerät OK (Öffner)', widget: 'switch', init: true },
          { name: 'diQuit', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'doFreigabe', type: 'BOOL', dir: 'out', label: 'Freigabe Schützkreis', widget: 'led' },
          { name: 'bTrip', type: 'BOOL', dir: 'out', label: 'Ausgelöst', widget: 'led' },
          { name: 'nTripCause', type: 'INT', dir: 'out', label: 'Auslösegrund', widget: 'value' },
          { name: 'rHeat', type: 'REAL', dir: 'out', label: 'Thermisches Abbild', widget: 'gauge', min: 0, max: 100, unit: '%' }
        ],
        scene: { type: 'motor', bind: { run: 'doFreigabe', fault: 'bTrip', current: 'rI1' } },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: thermisches Abbild, Phasenausfall, Kaltleiter\n\tbTrip := NOT diThermistor;\n\tdoFreigabe := NOT bTrip;\nEND_PROGRAM\n',
          var: MS_VAR,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	rHeat := 0.0;
	bTrip := FALSE;
	nTripCause := 0;
END_PROGRAM

PROGRAM _CYCLIC
	rImax := MAX(MAX(rI1, rI2), rI3);
	rImin := MIN(MIN(rI1, rI2), rI3);

	IF rIn > 0.0 THEN
		rRatio := rImax / rIn;
	ELSE
		rRatio := 0.0;
	END_IF

	// Thermisches Abbild
	IF rRatio > 1.0 THEN
		rHeat := rHeat + 10.0 * (rRatio * rRatio - 1.0) * rDt;
	ELSE
		rHeat := rHeat - 2.0 * rDt;
	END_IF
	rHeat := LIMIT(0.0, rHeat, 100.0);

	// Phasenausfall
	fbPhase(IN := (rImin < 0.5 * rImax) AND (rImax > 0.3 * rIn) AND (rIn > 0.0), PT := T#500ms);

	IF NOT bTrip THEN
		IF rIn <= 0.0 THEN
			bTrip := TRUE;
			nTripCause := 4;
		ELSIF NOT diThermistor THEN
			bTrip := TRUE;
			nTripCause := 3;
		ELSIF fbPhase.Q THEN
			bTrip := TRUE;
			nTripCause := 2;
		ELSIF rHeat >= 100.0 THEN
			bTrip := TRUE;
			nTripCause := 1;
		END_IF
	END_IF

	IF diQuit AND (rHeat < 50.0) AND diThermistor AND NOT fbPhase.Q AND (rIn > 0.0) THEN
		bTrip := FALSE;
		nTripCause := 0;
	END_IF

	doFreigabe := NOT bTrip;
END_PROGRAM
`,
          var: MS_VAR,
          typ: ''
        },
        tests: [
          { name: 'Nennstrom löst nicht aus', steps: [
            { set: { rI1: 10.0, rI2: 10.0, rI3: 10.0 } }, { ms: 10000 },
            { expect: 'NOT bTrip AND doFreigabe', msg: 'Bei I = I_N darf nie ausgelöst werden.' }
          ]},
          { name: 'Überlast 2 · I_N löst nach ca. 3,3 s aus', steps: [
            { set: { rI1: 20.0, rI2: 20.0, rI3: 20.0 } }, { ms: 3000 },
            { expect: 'NOT bTrip', msg: 'Nach 3 s darf noch nicht ausgelöst sein (Auslösung erst bei ≈ 3,33 s).' },
            { until: 'bTrip', maxMs: 800, msg: 'Bei 2 · I_N muss nach ≈ 3,3 s ausgelöst werden.' },
            { expect: 'nTripCause = 1 AND NOT doFreigabe' }
          ]},
          { name: 'Phasenausfall', steps: [
            { set: { rI1: 10.0, rI2: 10.0, rI3: 0.0 } }, { ms: 300 },
            { expect: 'NOT bTrip', msg: 'Phasenausfall erst nach 500 ms melden.' },
            { until: 'bTrip', maxMs: 400, msg: 'Fehlender Strom in L3 muss als Phasenausfall erkannt werden.' },
            { expect: 'nTripCause = 2' }
          ]},
          { name: 'Kaltleiter sofort, erster Grund bleibt', steps: [
            { set: { rI1: 8.0, rI2: 8.0, rI3: 8.0, diThermistor: false } }, { cycles: 2 },
            { expect: 'bTrip AND nTripCause = 3', msg: 'Kaltleiter-Auslösung muss sofort wirken.' },
            { set: { rI3: 0.0 } }, { ms: 800 },
            { expect: 'nTripCause = 3', msg: 'Folgefehler dürfen den ersten Auslösegrund nicht überschreiben.' }
          ]},
          { name: 'Quittieren erst nach Abkühlung', steps: [
            { set: { rI1: 20.0, rI2: 20.0, rI3: 20.0 } },
            { until: 'bTrip', maxMs: 5000 },
            { set: { rI1: 0.0, rI2: 0.0, rI3: 0.0 } },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } }, { cycles: 1 },
            { expect: 'bTrip', msg: 'Mit heißem thermischem Abbild darf nicht quittiert werden.' },
            { ms: 26000 },
            { expect: 'rHeat < 50.0' },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } }, { cycles: 1 },
            { expect: 'NOT bTrip AND doFreigabe', msg: 'Nach Abkühlung unter 50 % muss Quittieren möglich sein.' }
          ]},
          { name: 'Parametrierfehler I_N = 0', steps: [
            { set: { rIn: 0.0 } }, { cycles: 2 },
            { expect: 'bTrip AND nTripCause = 4', msg: 'I_N ≤ 0 ist ein Parametrierfehler.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Motorabgang-Inbetriebnahme'
  }
];
