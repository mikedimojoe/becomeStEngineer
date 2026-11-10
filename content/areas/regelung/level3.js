// Regelungstechnik – Level 3 (Stufe Senior → Prüfung Engineer)
'use strict';
const { url, R, vid } = require('./sources');

// ---------------------------------------------------------------------------
// Übung: Sprungantwort einer Heizstrecke automatisch auswerten
// ---------------------------------------------------------------------------
const stepVar = `VAR CONSTANT
	rTs : REAL := 0.01;          (* Zykluszeit Cyclic #1 in s *)
	rStepPct : REAL := 100.0;    (* Stellgrößensprung in % *)
	rKsDatasheet : REAL := 0.6;  (* Streckenverstärkung laut Datenblatt in K/% *)
	rMeasureTime : REAL := 50.0; (* Gesamtdauer der Messung in s *)
END_VAR
VAR
	fbStart : R_TRIG;
	nStep : INT;
	rT0 : REAL;        (* Starttemperatur *)
	rTEnd : REAL;      (* erwarteter Endwert *)
	rElapsed : REAL;   (* Zeit seit dem Sprung in s *)
END_VAR
`;
const stepSolution = `PROGRAM _INIT
	nStep := 0;
END_PROGRAM

PROGRAM _CYCLIC
	fbStart(CLK := diStart);

	CASE nStep OF
		0: (* Bereit *)
			doHeater := FALSE;
			IF fbStart.Q THEN
				rT0 := rTemp;
				rTEnd := rT0 + rKsDatasheet * rStepPct;
				rElapsed := 0.0;
				rT63 := 0.0;
				rKs := 0.0;
				bDone := FALSE;
				nStep := 10;
			END_IF

		10: (* Sprung aufgeschaltet, warten auf 63,2 % des Endwerts *)
			doHeater := TRUE;
			rElapsed := rElapsed + rTs;
			IF rTemp >= rT0 + 0.632 * (rTEnd - rT0) THEN
				rT63 := rElapsed;
				nStep := 20;
			END_IF

		20: (* weiter heizen bis zum Beharrungszustand, dann Ks bestimmen *)
			doHeater := TRUE;
			rElapsed := rElapsed + rTs;
			IF rElapsed >= rMeasureTime THEN
				rKs := (rTemp - rT0) / rStepPct;
				bDone := TRUE;
				doHeater := FALSE;
				nStep := 0;
			END_IF
	END_CASE
END_PROGRAM
`;
const stepStart = `PROGRAM _INIT
	nStep := 0;
END_PROGRAM

PROGRAM _CYCLIC
	fbStart(CLK := diStart);

	CASE nStep OF
		0: (* Bereit *)
			doHeater := FALSE;
			IF fbStart.Q THEN
				rT0 := rTemp;
				nStep := 10;
			END_IF

		10: (* TODO: Sprung aufschalten, Zeit messen, 63,2 %-Punkt erkennen *)
			doHeater := TRUE;

		20: (* TODO: Beharrungszustand abwarten, Ks berechnen, Heizung aus, bDone setzen *)
			;
	END_CASE
END_PROGRAM
`;
const exStep = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Sprungantwort einer Heizstrecke automatisch auswerten',
  task: `Eine Heizzone (Heizpatrone 100 %, Umgebung 20 °C) verhält sich wie eine **PT1-Strecke**. Laut Datenblatt beträgt die Streckenverstärkung **Ks ≈ 0,6 K/%**. Du sollst die **Zeitkonstante T** und die tatsächliche Verstärkung **Ks** mit einem automatischen Sprungversuch bestimmen – so, wie du es bei der Inbetriebnahme mit dem Trace machen würdest, nur dass das Programm selbst auswertet.

Anforderungen:
1. Eine **steigende Flanke** an \`diStart\` startet den Versuch: Starttemperatur \`rT0\` merken, Heizung \`doHeater\` dauerhaft EIN (Sprung 0 → 100 %).
2. Erwarteter Endwert: \`rTEnd = rT0 + rKsDatasheet · 100 %\`.
3. Sobald \`rTemp\` **63,2 %** der Änderung (\`rT0 + 0,632 · (rTEnd − rT0)\`) erreicht, schreibe die seit dem Sprung vergangene Zeit in Sekunden nach \`rT63\`.
4. Heize weiter, bis seit dem Sprung **50 s** vergangen sind (≥ 5 T, Beharrungszustand). Berechne dann \`rKs = (rTemp − rT0) / 100\`, setze \`bDone\` und schalte die Heizung **aus**.
5. Ohne Startflanke bleibt die Heizung aus.

Die Zeit misst du über die Zykluszeit: \`rElapsed := rElapsed + rTs;\` (Taskklasse 10 ms).`,
  hints: [
    'Die Schrittkette ist schon angelegt. Ergänze in Schritt 10 die Zeitmessung und die 63,2-%-Abfrage, in Schritt 20 das Ende der Messung.',
    'Rechne mit REAL: `rT0 + 0.632 * (rTEnd - rT0)`. Vergleiche mit `>=`, nicht mit `=` – ein Messwert trifft einen REAL-Wert nie exakt.',
    'bDone darf erst gesetzt werden, wenn rKs berechnet ist – sonst liest eine übergeordnete Logik einen halben Datensatz.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Sprungversuch starten', widget: 'button' },
    { name: 'rTemp', type: 'REAL', dir: 'in', label: 'Temperatur Heizzone', widget: 'gauge', min: 0, max: 100, init: 20, unit: '°C' },
    { name: 'doHeater', type: 'BOOL', dir: 'out', label: 'Heizung (100 %)', widget: 'led' },
    { name: 'rT63', type: 'REAL', dir: 'out', label: 'ermittelte Zeitkonstante T', widget: 'value', unit: 's' },
    { name: 'rKs', type: 'REAL', dir: 'out', label: 'ermittelte Streckenverstärkung Ks', widget: 'value', unit: 'K/%' },
    { name: 'bDone', type: 'BOOL', dir: 'out', label: 'Messung fertig', widget: 'led' }
  ],
  scene: { type: 'tank', bind: { heater: 'doHeater', temp: 'rTemp' } },
  plant: {
    var: 'VAR\n\trT : REAL := 20.0;\n\trU : REAL;\nEND_VAR\n',
    code: '(* PT1: Ks = 0,6 K/%, T = 8 s, Umgebung 20 °C *)\nIF doHeater THEN rU := 100.0; ELSE rU := 0.0; END_IF\nrT := rT + (0.6 * rU - (rT - 20.0)) / 8.0 * PLANT_DT;\nrTemp := rT;\n'
  },
  files: { main: stepStart, var: stepVar, typ: '' },
  solution: { main: stepSolution, var: stepVar, typ: '' },
  tests: [
    { name: 'Startflanke schaltet den Sprung auf', steps: [
      { ms: 1000 }, { expect: 'NOT doHeater', msg: 'Ohne Startflanke muss die Heizung aus bleiben.' },
      { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } }, { cycles: 2 },
      { expect: 'doHeater', msg: 'Nach der Startflanke muss die Heizung eingeschaltet sein.' }
    ] },
    { name: 'Zeitkonstante T wird korrekt ermittelt (8 s ± 0,3 s)', steps: [
      { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
      { until: 'rT63 > 0.0', maxMs: 20000, msg: 'rT63 wurde nicht gesetzt – wird der 63,2-%-Punkt erkannt?' },
      { expect: 'rT63 > 7.7 AND rT63 < 8.3', msg: 'rT63 liegt nicht bei ca. 8 s. Prüfe Zeitmessung und 63,2-%-Schwelle.' }
    ] },
    { name: 'Streckenverstärkung Ks wird nach dem Beharrungszustand berechnet', steps: [
      { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
      { until: 'bDone', maxMs: 60000, msg: 'bDone wird nicht gesetzt.' },
      { expect: 'rKs > 0.59 AND rKs < 0.61', msg: 'rKs muss ca. 0,6 K/% betragen: (rTemp − rT0) / 100.' }
    ] },
    { name: 'Heizung ist nach der Messung aus', steps: [
      { set: { diStart: true } }, { cycles: 2 }, { set: { diStart: false } },
      { until: 'bDone', maxMs: 60000 }, { cycles: 2 },
      { expect: 'NOT doHeater', msg: 'Nach Messende muss die Heizung abgeschaltet werden.' },
      { never: 'doHeater', ms: 3000, msg: 'Die Heizung darf ohne neue Startflanke nicht wieder einschalten.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Übung: Zweipunktregler mit Hysterese und Fühlerüberwachung
// ---------------------------------------------------------------------------
const twoVar = `VAR CONSTANT
	rSensorMin : REAL := -20.0;  (* unterhalb: Kurzschluss/Fühlerfehler *)
	rSensorMax : REAL := 150.0;  (* oberhalb: Fühlerbruch (Pt100 offen) *)
END_VAR
VAR
	bHeat : BOOL;     (* Schaltzustand des Zweipunktreglers *)
	bFault : BOOL;    (* gespeicherte Störung *)
END_VAR
`;
const twoSolution = `PROGRAM _CYCLIC
	(* 1. Fühlerüberwachung: Störung speichern *)
	IF (rTemp < rSensorMin) OR (rTemp > rSensorMax) THEN
		bFault := TRUE;
	END_IF
	(* Quittieren durch Wegnehmen der Freigabe *)
	IF NOT diEnable THEN
		bFault := FALSE;
	END_IF

	(* 2. Zweipunktregler mit Hysterese *)
	IF NOT diEnable OR bFault THEN
		bHeat := FALSE;
	ELSIF rTemp < rSetTemp - rHyst / 2.0 THEN
		bHeat := TRUE;
	ELSIF rTemp > rSetTemp + rHyst / 2.0 THEN
		bHeat := FALSE;
	END_IF
	(* dazwischen: bHeat behält seinen Zustand *)

	doHeater := bHeat;
	doFault := bFault;
END_PROGRAM
`;
const twoStart = `PROGRAM _CYCLIC
	(* Erster Entwurf eines Kollegen: Heizung flattert und reagiert nicht auf Fühlerbruch *)
	bHeat := diEnable AND (rTemp < rSetTemp);
	doHeater := bHeat;
END_PROGRAM
`;
const exTwoPoint = {
  id: 'ex1', type: 'st', variant: 'fehlersuche',
  title: 'Zweipunktregler mit Hysterese und Fühlerüberwachung',
  task: `Ein Reinigungsbad wird mit einem Heizstab (über Schütz) beheizt. Der erste Programmentwurf schaltet ohne Hysterese – das Schütz **flattert** im Zyklustakt und ist nach wenigen Tagen verschlissen. Außerdem heizt er bei **Fühlerbruch** (Pt100 offen → Messwert springt auf ca. 850 °C) bzw. Kurzschluss unkontrolliert weiter oder gar nicht.

Überarbeite das Programm:
1. **Zweipunktregler mit Hysterese:** Heizung EIN, wenn \`rTemp < rSetTemp − rHyst/2\`; AUS, wenn \`rTemp > rSetTemp + rHyst/2\`; dazwischen bleibt der letzte Zustand erhalten.
2. **Freigabe:** Ist \`diEnable\` FALSE, ist die Heizung sofort aus.
3. **Fühlerüberwachung:** Liegt \`rTemp\` unter −20 °C oder über 150 °C, wird eine **gespeicherte** Störung \`doFault\` gesetzt und die Heizung abgeschaltet. Die Störung bleibt auch dann bestehen, wenn der Messwert wieder plausibel ist. Quittiert wird durch Wegnehmen der Freigabe (\`diEnable\` FALSE).

Hinweis: Der Schaltzustand muss über Zyklen gespeichert werden – das ist der Kern der Hysterese.`,
  hints: [
    'Eine einzige Zuweisung `bHeat := … ;` kann keine Hysterese abbilden. Du brauchst IF/ELSIF, das in der Mitte nichts zuweist.',
    'Prüfe die Störung zuerst und verriegele damit den Regler (Priorität: Freigabe/Störung vor Regelung).',
    'Wie oft das Schütz schaltet, zählt die Anlagen-Simulation in `nSwitch` mit – den Wert siehst du im Watch.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Freigabe Heizung', widget: 'switch', init: true },
    { name: 'rSetTemp', type: 'REAL', dir: 'in', label: 'Solltemperatur w', widget: 'slider', min: 20, max: 75, init: 50, unit: '°C' },
    { name: 'rHyst', type: 'REAL', dir: 'in', label: 'Schaltdifferenz (Hysterese)', widget: 'slider', min: 0, max: 10, init: 2, unit: 'K' },
    { name: 'rTemp', type: 'REAL', dir: 'in', label: 'Badtemperatur x', widget: 'gauge', min: 0, max: 100, init: 20, unit: '°C' },
    { name: 'doHeater', type: 'BOOL', dir: 'out', label: 'Schütz Heizstab', widget: 'led' },
    { name: 'doFault', type: 'BOOL', dir: 'out', label: 'Störung Temperaturfühler', widget: 'led' }
  ],
  scene: { type: 'tank', bind: { heater: 'doHeater', temp: 'rTemp' } },
  plant: {
    var: 'VAR\n\trT : REAL := 20.0;\n\tbSensorBreak : BOOL;  (* Testschalter: Fühlerbruch *)\n\tnSwitch : UDINT;      (* Schaltspiele des Schützes *)\n\tbOld : BOOL;\nEND_VAR\n',
    code: 'IF doHeater <> bOld THEN nSwitch := nSwitch + 1; END_IF\nbOld := doHeater;\n(* PT1: Endwert 80 °C bei Dauer-EIN, T = 8 s *)\nrT := rT + (SEL(doHeater, 0.0, 60.0) - (rT - 20.0)) / 8.0 * PLANT_DT;\nIF bSensorBreak THEN rTemp := 850.0; ELSE rTemp := rT; END_IF\n'
  },
  files: { main: twoStart, var: twoVar, typ: '' },
  solution: { main: twoSolution, var: twoVar, typ: '' },
  tests: [
    { name: 'Heizt auf und schaltet am oberen Schaltpunkt ab', steps: [
      { until: 'rTemp > 50.9', maxMs: 20000, msg: 'Die Temperatur erreicht den oberen Schaltpunkt nicht.' },
      { ms: 300 },
      { expect: 'NOT doHeater', msg: 'Oberhalb von w + H/2 muss die Heizung aus sein.' }
    ] },
    { name: 'Temperatur bleibt im Hystereseband', steps: [
      { ms: 20000 },
      { never: 'rTemp > 51.5 OR rTemp < 48.5', ms: 20000, msg: 'Die Temperatur verlässt das Band w ± H/2.' }
    ] },
    { name: 'Hysterese verhindert Flattern (Schaltspiele begrenzt)', steps: [
      { ms: 20000 }, { set: { nSwitch: 0 } }, { ms: 10000 },
      { expect: 'nSwitch < 60', msg: 'Das Schütz schaltet viel zu oft – Hysterese fehlt oder wirkt nicht.' }
    ] },
    { name: 'Freigabe AUS schaltet die Heizung sofort ab', steps: [
      { ms: 5000 }, { set: { diEnable: false } }, { cycles: 2 },
      { expect: 'NOT doHeater' },
      { never: 'doHeater', ms: 3000, msg: 'Ohne Freigabe darf nie geheizt werden.' }
    ] },
    { name: 'Fühlerbruch: gespeicherte Störung, Heizung aus, Quittieren über Freigabe', steps: [
      { ms: 3000 }, { set: { bSensorBreak: true } }, { cycles: 2 },
      { expect: 'doFault AND NOT doHeater', msg: 'Bei Fühlerbruch: Störung setzen und Heizung abschalten.' },
      { set: { bSensorBreak: false } }, { ms: 1000 },
      { expect: 'doFault AND NOT doHeater', msg: 'Die Störung muss gespeichert bleiben, auch wenn der Messwert wieder plausibel ist.' },
      { set: { diEnable: false } }, { cycles: 2 }, { set: { diEnable: true } }, { ms: 500 },
      { expect: 'NOT doFault', msg: 'Nach Wegnehmen der Freigabe muss die Störung quittiert sein.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Übung: P- und PI-Regler für einen Füllstand
// ---------------------------------------------------------------------------
const piVar = `VAR CONSTANT
	rTs : REAL := 0.01;   (* Abtastzeit = Zykluszeit 10 ms *)
	rKp : REAL := 8.0;    (* Proportionalbeiwert in %/% *)
	rTn : REAL := 5.0;    (* Nachstellzeit in s *)
END_VAR
VAR
	rE : REAL;   (* Regelabweichung e = w - x *)
	rP : REAL;   (* P-Anteil *)
	rI : REAL;   (* I-Anteil (Integratorspeicher) *)
END_VAR
`;
const piStart = `PROGRAM _CYCLIC
	rE := rSetLevel - rLevel;
	rP := rKp * rE;
	(* TODO: I-Anteil ergänzen – bisher reiner P-Regler mit bleibender Regelabweichung *)
	rValve := LIMIT(0.0, rP, 100.0);
END_PROGRAM
`;
const piSolution = `PROGRAM _CYCLIC
	rE := rSetLevel - rLevel;
	rP := rKp * rE;
	(* I-Anteil: Rechteckintegration, Speicher auf den Stellbereich begrenzt *)
	rI := rI + rKp / rTn * rE * rTs;
	rI := LIMIT(0.0, rI, 100.0);
	rValve := LIMIT(0.0, rP + rI, 100.0);
END_PROGRAM
`;
const exPI = {
  id: 'ex2', type: 'st', variant: 'erweitern',
  title: 'Vom P- zum PI-Regler: Füllstand ohne bleibende Regelabweichung',
  task: `Ein Vorlagebehälter wird über ein stetiges Zulaufventil (0–100 %) befüllt, der Abfluss zum Verbraucher wirkt als **Störgröße**. Der Behälter ist eine **I-Strecke**: \`dx/dt = 0,05 · y − z\` (x in %, y in %, z in %/s).

Der vorhandene **P-Regler** (\`Kp = 8\`) hält den Füllstand nicht auf dem Sollwert: Weil der Abfluss ständig Stellgröße verlangt, bleibt eine **Regelabweichung** stehen. Ergänze einen **I-Anteil** zum PI-Regler:

- \`e = w − x\`, \`P = Kp · e\`
- \`I(k) = I(k−1) + Kp / Tn · e · Ts\` mit \`Tn = 5 s\`, \`Ts = 0,01 s\`
- Begrenze den Integratorspeicher auf 0…100 % und die Stellgröße \`rValve = P + I\` auf 0…100 %.

Ziele: Der Füllstand erreicht 50 % ohne bleibende Abweichung, überschwingt höchstens um 8 %-Punkte und regelt eine Erhöhung des Abflusses wieder vollständig aus.`,
  hints: [
    'Der I-Anteil ist ein Speicher: Er muss in Variables.var stehen (nicht VAR_TEMP), damit er von Zyklus zu Zyklus erhalten bleibt.',
    'Bei einer I-Strecke braucht ein P-Regler e = z / (0,05 · Kp), um den Abfluss zu decken – genau diese Abweichung „lernt“ der I-Anteil.',
    'Begrenze erst den Integrator, dann die Summe – so kann der Speicher nicht unbegrenzt weglaufen.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rSetLevel', type: 'REAL', dir: 'in', label: 'Sollwert Füllstand w', widget: 'slider', min: 0, max: 100, init: 50, unit: '%' },
    { name: 'rDemand', type: 'REAL', dir: 'in', label: 'Abfluss z (Störgröße)', widget: 'slider', min: 0, max: 4, init: 1.5, unit: '%/s' },
    { name: 'rLevel', type: 'REAL', dir: 'in', label: 'Füllstand x', widget: 'gauge', min: 0, max: 100, init: 20, unit: '%' },
    { name: 'rValve', type: 'REAL', dir: 'out', label: 'Zulaufventil y', widget: 'gauge', min: 0, max: 100, unit: '%' }
  ],
  scene: { type: 'tank', bind: { level: 'rLevel' } },
  plant: {
    var: 'VAR\n\trL : REAL := 20.0;\nEND_VAR\n',
    code: '(* I-Strecke: Zufluss 0,05 %/s je % Ventilöffnung, Abfluss rDemand *)\nrL := LIMIT(0.0, rL + (0.05 * rValve - rDemand) * PLANT_DT, 100.0);\nrLevel := rL;\n'
  },
  files: { main: piStart, var: piVar, typ: '' },
  solution: { main: piSolution, var: piVar, typ: '' },
  tests: [
    { name: 'Keine bleibende Regelabweichung', steps: [
      { ms: 40000 },
      { expect: 'ABS(rLevel - 50.0) < 0.5', msg: 'Nach 40 s muss der Füllstand bei 50 % ± 0,5 % liegen – fehlt der I-Anteil?' }
    ] },
    { name: 'Einschwingen in das Toleranzband ±1 % innerhalb von 25 s', steps: [
      { ms: 25000 },
      { never: 'ABS(rLevel - 50.0) > 1.0', ms: 20000, msg: 'Der Füllstand verlässt nach 25 s noch das Band 49…51 %.' }
    ] },
    { name: 'Überschwingen höchstens 8 %-Punkte', steps: [
      { never: 'rLevel > 58.0', ms: 40000, msg: 'Der Füllstand schwingt zu weit über (> 58 %). Integrator begrenzt?' }
    ] },
    { name: 'Stellgröße bleibt im Bereich 0…100 %', steps: [
      { never: 'rValve < 0.0 OR rValve > 100.0', ms: 30000, msg: 'Die Stellgröße muss auf 0…100 % begrenzt sein.' }
    ] },
    { name: 'Störgröße (Abfluss 1,5 → 3 %/s) wird ausgeregelt', steps: [
      { ms: 40000 }, { set: { rDemand: 3.0 } }, { ms: 40000 },
      { expect: 'ABS(rLevel - 50.0) < 0.5', msg: 'Nach der Störung muss der Füllstand wieder bei 50 % liegen.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Projekt: Temperaturregelung mit PI-Regler und PWM-Heizausgang
// ---------------------------------------------------------------------------
const projTyp = `TYPE
	eTempState :
	(
		TS_OFF,      (* Regler aus, Heizung aus *)
		TS_HEATUP,   (* Aufheizen bis in die Nähe des Sollwerts *)
		TS_CONTROL,  (* Regelbetrieb *)
		TS_FAULT     (* Übertemperatur / Fühlerfehler *)
	);
END_TYPE
`;
const projVar = `VAR CONSTANT
	rTs : REAL := 0.01;        (* Zykluszeit der Taskklasse in s *)
	rKp : REAL := 10.0;        (* Proportionalbeiwert in %/K *)
	rTn : REAL := 10.0;        (* Nachstellzeit in s *)
	rPeriod : REAL := 1.0;     (* PWM-Periodendauer in s *)
	rTempMax : REAL := 90.0;   (* Übertemperatur-Abschaltung in °C *)
	rTempMin : REAL := -10.0;  (* Fühlerfehler unten in °C *)
	rTempReset : REAL := 80.0; (* Quittieren erst unterhalb dieser Temperatur *)
END_VAR
VAR
	eState : eTempState;
	rE : REAL;        (* Regelabweichung *)
	rP : REAL;        (* P-Anteil *)
	rI : REAL;        (* I-Anteil *)
	rU : REAL;        (* unbegrenzte Stellgröße *)
	rPower : REAL;    (* Stellgröße 0..100 % *)
	rPwmTime : REAL;  (* Zeit innerhalb der PWM-Periode *)
END_VAR
`;
const projSolution = `PROGRAM _INIT
	eState := TS_OFF;
END_PROGRAM

PROGRAM _CYCLIC
	(* Überwachung hat Vorrang vor allen Zuständen *)
	IF (rTemp > rTempMax) OR (rTemp < rTempMin) THEN
		eState := TS_FAULT;
	END_IF

	rE := rSetTemp - rTemp;

	CASE eState OF
		TS_OFF:
			rPower := 0.0;
			rI := 0.0;
			IF diEnable THEN
				eState := TS_HEATUP;
			END_IF

		TS_HEATUP, TS_CONTROL:
			(* PI-Regler mit bedingter Integration: nur integrieren, solange die Stellgröße nicht in der Begrenzung ist *)
			rP := rKp * rE;
			rU := rP + rI + rKp / rTn * rE * rTs;
			IF (rU > 0.0) AND (rU < 100.0) THEN
				rI := rI + rKp / rTn * rE * rTs;
			END_IF
			rPower := LIMIT(0.0, rP + rI, 100.0);
			IF (eState = TS_HEATUP) AND (ABS(rE) < 1.0) THEN
				eState := TS_CONTROL;
			END_IF
			IF NOT diEnable THEN
				eState := TS_OFF;
			END_IF

		TS_FAULT:
			rPower := 0.0;
			rI := 0.0;
			IF diReset AND (rTemp < rTempReset) THEN
				eState := TS_OFF;
			END_IF
	END_CASE

	doFault := (eState = TS_FAULT);
	doReady := (eState = TS_CONTROL) AND (ABS(rE) < 2.0);

	(* PWM: feste Periode, Einschaltdauer proportional zu rPower *)
	rPwmTime := rPwmTime + rTs;
	IF rPwmTime >= rPeriod THEN
		rPwmTime := 0.0;
	END_IF
	doHeater := (rPwmTime < rPower / 100.0 * rPeriod) AND ((eState = TS_HEATUP) OR (eState = TS_CONTROL));
END_PROGRAM
`;
const projStart = `PROGRAM _INIT
	eState := TS_OFF;
END_PROGRAM

PROGRAM _CYCLIC
	(* Provisorium aus der Vorserie: Zweipunkt ohne Hysterese, keine Überwachung.
	   Ersetze es durch Zustandsautomat + PI-Regler + PWM. *)
	doHeater := diEnable AND (rTemp < rSetTemp);
END_PROGRAM
`;
const exProj = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Heizzone mit PI-Regler, PWM-Ausgang und Übertemperatur-Abschaltung',
  task: `Eine Heizzone (z. B. Siegelbacke) wird über ein **Halbleiterrelais (SSR)** an einem digitalen Ausgang beheizt. Stetige Leistung entsteht durch **Pulsweitenmodulation (PWM)**: In jeder Periode von **1 s** ist der Ausgang für \`rPower/100 · 1 s\` eingeschaltet. Die Strecke ist eine PT1-Strecke (Ks = 0,8 K/%, T = 40 s, Umgebung 20 °C).

Baue die komplette Funktion:
1. **Zustandsautomat** \`eState\` (Typ \`eTempState\` ist angelegt): \`TS_OFF\` → (diEnable) → \`TS_HEATUP\` → (|e| < 1 K) → \`TS_CONTROL\`; \`diEnable\` FALSE führt aus HEATUP/CONTROL nach \`TS_OFF\`.
2. **PI-Regler** in HEATUP/CONTROL: \`Kp = 10 %/K\`, \`Tn = 10 s\`, Stellgröße 0…100 %. Integriere **nur**, solange die Stellgröße nicht in der Begrenzung ist (bedingte Integration). In OFF/FAULT wird der I-Anteil gelöscht.
3. **PWM-Ausgang** \`doHeater\` mit Periode \`rPeriod = 1 s\`; nur in HEATUP/CONTROL darf geheizt werden.
4. **Überwachung** (Vorrang vor allem anderen): \`rTemp > 90 °C\` oder \`< −10 °C\` → \`TS_FAULT\`, \`doFault\` = TRUE, Heizung aus. Quittieren mit \`diReset\` erst, wenn \`rTemp < 80 °C\`; danach geht es über \`TS_OFF\` weiter.
5. \`doReady\` = TRUE in \`TS_CONTROL\`, solange |e| < 2 K.

Abnahmekriterien: Sollwert 60 °C in ≤ 45 s im Band ±1 K, Überschwingen ≤ 2 K, sauberes Takten (max. 2 Schaltflanken je PWM-Periode).

In AS6 würdest du für Schritt 2 und 3 typischerweise \`MTBasicsPID\` und \`MTBasicsPWM\` (mapp Control) verwenden – hier programmierst du beides selbst, um das Verhalten zu verstehen.`,
  hints: [
    'Lege die Überwachung vor das CASE: Dann wechselt der Automat aus jedem Zustand sofort in TS_FAULT.',
    'Bedingte Integration: Berechne die Stellgröße probeweise mit dem neuen I-Anteil. Liegt sie innerhalb 0…100 %, übernimm den neuen I-Anteil, sonst nicht.',
    'PWM: Ein Sägezahn `rPwmTime` läuft von 0 bis rPeriod. Der Ausgang ist EIN, solange `rPwmTime < rPower/100 · rPeriod`.',
    'Die Fremdwärme `rExt` der Simulation kannst du im Watch setzen, um die Übertemperatur-Abschaltung auszuprobieren.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Freigabe Heizzone', widget: 'switch' },
    { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Störung quittieren', widget: 'button' },
    { name: 'rSetTemp', type: 'REAL', dir: 'in', label: 'Solltemperatur w', widget: 'slider', min: 20, max: 85, init: 60, unit: '°C' },
    { name: 'rTemp', type: 'REAL', dir: 'in', label: 'Isttemperatur x', widget: 'gauge', min: 0, max: 120, init: 20, unit: '°C' },
    { name: 'doHeater', type: 'BOOL', dir: 'out', label: 'SSR Heizung (PWM)', widget: 'led' },
    { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Temperatur erreicht', widget: 'led' },
    { name: 'doFault', type: 'BOOL', dir: 'out', label: 'Störung Übertemperatur', widget: 'led' }
  ],
  scene: { type: 'tank', bind: { heater: 'doHeater', temp: 'rTemp' } },
  plant: {
    var: 'VAR\n\trT : REAL := 20.0;\n\trExt : REAL := 0.0;   (* Fremdwärme in K, z. B. von einer Nachbarzone *)\n\trU : REAL;\n\tnSwitch : UDINT;      (* Schaltflanken des SSR *)\n\tbOld : BOOL;\nEND_VAR\n',
    code: 'IF doHeater <> bOld THEN nSwitch := nSwitch + 1; END_IF\nbOld := doHeater;\nIF doHeater THEN rU := 100.0; ELSE rU := 0.0; END_IF\n(* PT1: Ks = 0,8 K/%, T = 40 s, Umgebung 20 °C *)\nrT := rT + (0.8 * rU + rExt - (rT - 20.0)) / 40.0 * PLANT_DT;\nrTemp := rT;\n'
  },
  files: { main: projStart, var: projVar, typ: projTyp },
  solution: { main: projSolution, var: projVar, typ: projTyp },
  tests: [
    { name: 'Freigabe startet das Aufheizen', steps: [
      { ms: 500 }, { expect: 'NOT doHeater', msg: 'Ohne Freigabe darf nicht geheizt werden.' },
      { set: { diEnable: true } }, { cycles: 5 },
      { expect: 'doHeater', msg: 'Bei großer Regelabweichung muss die Heizung (nahezu) dauernd EIN sein.' }
    ] },
    { name: 'Sollwert 60 °C: nach 45 s im Band ±1 K und Meldung „erreicht“', steps: [
      { set: { diEnable: true } }, { ms: 45000 },
      { never: 'ABS(rTemp - 60.0) > 1.0', ms: 30000, msg: 'Die Temperatur liegt nach 45 s nicht stabil im Band 59…61 °C.' },
      { expect: 'doReady', msg: 'doReady muss im Regelbetrieb bei |e| < 2 K gesetzt sein.' }
    ] },
    { name: 'Überschwingen höchstens 2 K', steps: [
      { set: { diEnable: true } },
      { never: 'rTemp > 62.0', ms: 70000, msg: 'Zu starkes Überschwingen – integriert der Regler auch in der Begrenzung (Windup)?' }
    ] },
    { name: 'PWM: Heizung taktet sauber im Regelbetrieb', steps: [
      { set: { diEnable: true } }, { ms: 50000 },
      { until: 'NOT doHeater', maxMs: 1100, msg: 'Im Regelbetrieb muss die Heizung innerhalb einer PWM-Periode auch AUS sein.' },
      { until: 'doHeater', maxMs: 1100, msg: 'Im Regelbetrieb muss die Heizung innerhalb einer PWM-Periode auch EIN sein.' },
      { set: { nSwitch: 0 } }, { ms: 10000 },
      { expect: 'nSwitch <= 22', msg: 'Zu viele Schaltflanken: PWM mit 1 s Periode erzeugt höchstens 2 Flanken pro Sekunde.' }
    ] },
    { name: 'Übertemperatur: Störung, Heizung aus, Quittieren erst unter 80 °C', steps: [
      { set: { diEnable: true } }, { ms: 40000 }, { set: { rExt: 80.0 } },
      { until: 'doFault', maxMs: 70000, msg: 'Bei rTemp > 90 °C muss doFault gesetzt werden.' },
      { never: 'doHeater', ms: 2000, msg: 'Im Störzustand darf nicht geheizt werden.' },
      { set: { rExt: 0.0, diReset: true } }, { cycles: 3 },
      { expect: 'doFault', msg: 'Quittieren darf erst unter 80 °C möglich sein.' },
      { until: 'rTemp < 79.0', maxMs: 40000 }, { cycles: 3 },
      { expect: 'NOT doFault', msg: 'Unter 80 °C muss diReset die Störung quittieren.' }
    ] },
    { name: 'Freigabe AUS: sofort aus und Regler zurückgesetzt', steps: [
      { set: { diEnable: true } }, { ms: 20000 }, { set: { diEnable: false } }, { cycles: 2 },
      { expect: 'NOT doHeater' },
      { never: 'doHeater', ms: 3000, msg: 'Nach Wegnahme der Freigabe darf nicht mehr geheizt werden.' }
    ] }
  ]
};

module.exports = [
  // =========================================================================
  {
    id: 'regelung-3-regelkreis', level: 3, kind: 'lektion',
    title: 'Regelkreis, Regelstrecken und Sprungantwort',
    summary: 'Steuern vs. Regeln, die Größen w, x, e, y, z und die typischen Streckentypen P, PT1, PT2, I und Totzeit – erkannt an ihrer Sprungantwort.',
    minutes: 150,
    req: [],
    briefing: 'Bisher hast du gesteuert: Ein Ausgang folgt einer Logik, ohne dass das Ergebnis zurückgemeldet wird. Sobald eine physikalische Größe wie Temperatur, Druck oder Füllstand trotz Störungen einen Sollwert halten soll, brauchst du einen geschlossenen Regelkreis. In diesem Modul lernst du die genormten Begriffe (DIN IEC 60050-351) und das Blockschaltbild kennen, ordnest Regelstrecken nach ihrem Zeitverhalten ein und liest aus einer Sprungantwort Streckenverstärkung, Zeitkonstante, Verzugs- und Ausgleichszeit ab. Diese Kennwerte sind die Grundlage für jede spätere Reglereinstellung.',
    practice: 'Bei der Inbetriebnahme einer Extruderheizung, eines Druckluftspeichers oder einer Tänzerregelung zeichnest du zuerst mit dem Trace eine Sprungantwort auf. Wer sie lesen kann, erkennt sofort, ob die Strecke träge, schnell, integrierend oder totzeitbehaftet ist – und welcher Reglertyp passt.',
    transfer: {
      tia: 'In TIA Portal zeichnest du Sprungantworten mit der Trace-Funktion oder in der Inbetriebnahmemaske von PID_Compact auf; die Begriffe w/x/e/y/z sind herstellerunabhängig.',
      codesys: 'In CODESYS/TwinCAT nutzt du Trace bzw. TwinCAT Scope View; die Streckentypen findest du in der Controller Toolbox (z. B. FB_CTRL_PT1, FB_CTRL_PT2) zur Simulation.'
    },
    objectives: [
      {
        id: 'o1', title: 'Unterscheide Steuerung und Regelung am Blockschaltbild',
        guide: {
          intro: 'Entscheidend ist die Rückführung: Bei einer Regelung wird die Regelgröße gemessen und mit dem Sollwert verglichen.',
          steps: [
            'Zeichne für die Heizung eines Reinigungsbads zwei Blockschaltbilder: Steuerkette (Zeitschaltuhr → Schütz → Heizstab → Bad) und Regelkreis (Sollwert → Vergleicher → Regler → Stellglied → Strecke → Messglied → zurück zum Vergleicher).',
            'Beschrifte die Signale mit den genormten Formelzeichen: Führungsgröße **w**, Regelgröße **x**, Regelabweichung **e = w − x**, Stellgröße **y**, Störgröße **z** (im Bad: kaltes Nachspeisewasser).',
            'Markiere, wo die Störgröße angreift, und überlege: Kann die Steuerkette auf das Nachspeisewasser reagieren? Kann der Regelkreis es?',
            'Notiere je ein Beispiel aus deinem Betrieb für Steuerung (z. B. Förderband mit Zeitglied) und Regelung (z. B. Bandspannung, Temperatur, Druck).'
          ],
          done: 'Erledigt, wenn du beide Blockschaltbilder mit w, x, e, y, z beschriftet hast und begründen kannst, warum nur der Regelkreis Störungen ausgleicht.',
          tip: 'Die Rückführung ist immer negativ (Minus am Vergleicher). Ein Vorzeichenfehler – z. B. ein Kühlventil an einem „Heizregler“ – führt zur Mitkopplung: Die Größe läuft weg, statt geregelt zu werden.'
        }
      },
      {
        id: 'o2', title: 'Ordne Regelstrecken nach ihrem Zeitverhalten ein',
        guide: {
          intro: 'Strecken unterscheidet man nach Ausgleich (P-Verhalten) oder ohne Ausgleich (I-Verhalten) sowie nach Ordnung und Totzeit.',
          steps: [
            'Lies in Schumacher/Leonhard, Kap. 5 (Einzelelemente von Regelstrecken), die Abschnitte P-Glied, I-Glied, PT1, PT2 und Laufzeitglied.',
            'Skizziere zu jedem Typ die Sprungantwort: P (springt sofort), PT1 (Anfangssteigung, 63,2 % nach T), PT2 (S-Form mit Wendepunkt), I (Rampe ohne Endwert), Totzeit Tt (verschoben, sonst unverändert).',
            'Ordne Beispiele zu: Füllstand mit Pumpe am Ablauf (I), Raumtemperatur (PTn), Förderstrecke mit Messung am Bandende (Totzeit), Ventilstellung → Durchfluss (nahezu P bzw. schnelles PT1).',
            'Schreibe die Differenzengleichung des PT1 für die SPS auf: `x := x + (Ks · y − x) / T · Ts;` – genau so ist die Simulation in den Übungen aufgebaut.'
          ],
          code: { lang: 'st', text: '(* PT1-Strecke, Euler-vorwärts, Ts = Zykluszeit in s *)\nrX := rX + (rKs * rY - rX) / rT * rTs;' },
          done: 'Erledigt, wenn du zu jedem der fünf Streckentypen Sprungantwort, Kennwerte und ein Praxisbeispiel nennen kannst.',
          tip: 'Strecken mit Totzeit sind die schwierigsten: Der Regler „sieht“ die Wirkung seines Eingriffs erst nach Tt. Halte Messstellen deshalb so nah wie möglich am Stellort.',
          link: { label: 'B&R Help: Simulation einer Regelstrecke (mapp Control)', url: url.mtUseCase1 }
        }
      },
      {
        id: 'o3', title: 'Zeichne in AS6 eine Sprungantwort mit dem Trace auf',
        guide: {
          intro: 'Der Trace zeichnet Variablen im Zielsystem in einem festen Zeitraster auf – unabhängig von der Kommunikation zum PC.',
          steps: [
            'Lege in der Logical View ein ST-Programm an (Rechtsklick › **Add Object…** › Program, Sprache Structured Text) und ordne es in der Software-Konfiguration der Taskklasse **Cyclic #1** (10 ms) zu.',
            'Starte die Simulation (ARsim) und übertrage das Projekt (Build mit **F7**, danach Transfer).',
            'Öffne die Software-Konfiguration der CPU, markiere dein Programm und wähle **Öffnen › Trace**. Füge die Variablen `doHeater` und `rTemp` hinzu.',
            'Stelle in den Trace-Eigenschaften (Bearbeiten › Eigenschaften) das Aufzeichnungsraster auf die Taskklasse und die Dauer auf mindestens 60 s ein; Trigger: steigende Flanke von `doHeater`.',
            'Starte den Trace, löse den Sprung aus und lade die Daten auf den PC. Miss mit den Cursoren den Endwert (→ Ks) und die Zeit bis 63,2 % (→ T).'
          ],
          done: 'Erledigt, wenn du eine aufgezeichnete Sprungantwort mit eingezeichneten Werten für Ks und T vorliegen hast.',
          tip: 'Zeichne immer Stellgröße **und** Regelgröße gemeinsam auf. Ohne die Stellgröße weißt du später nicht, ob der Sprung wirklich 0 → 100 % war oder ob eine Begrenzung gewirkt hat.',
          link: { label: 'B&R Help: Trace', url: url.trace }
        }
      },
      {
        id: 'o4', title: 'Lies Verzugszeit Tu und Ausgleichszeit Tg mit der Wendetangente ab',
        guide: {
          intro: 'Strecken höherer Ordnung (PTn) werden für die Reglereinstellung durch Tu, Tg und Ks beschrieben.',
          steps: [
            'Nimm eine S-förmige Sprungantwort (PT2/PT3) und lege die Tangente an den Wendepunkt (steilste Stelle).',
            'Die Tangente schneidet die Anfangslinie bei **Tu** (Verzugszeit) und den Endwert nach weiteren **Tg** (Ausgleichszeit).',
            'Berechne den Schwierigkeitsgrad Tg/Tu: > 10 gut regelbar, 3…10 noch regelbar, < 3 schwer regelbar.',
            'Halte die Werte schriftlich fest – du brauchst sie im Engineer-Modul für Ziegler-Nichols und Chien-Hrones-Reswick.'
          ],
          done: 'Erledigt, wenn du für eine gegebene Sprungantwort Ks, Tu, Tg und Tg/Tu bestimmt und bewertet hast.',
          tip: 'Die Wendetangente ist empfindlich gegen Messrauschen. Bei verrauschten Signalen ist die T-Summen-Methode (Flächenvergleich) robuster.'
        }
      }
    ],
    videos: [
      vid('buchholzRegelung', 'Prof. Buchholz (Hochschule Bremen) erklärt Regelkreis, Rückführung und Bezeichnungen kompakt am Blockschaltbild.'),
      vid('buchholzPT1', 'Herleitung und Sprungantwort des PT1-Glieds – Grundlage für alle Temperaturstrecken in diesem Bereich.'),
      vid('podcastStrecken', 'Überblick über Strecken mit und ohne Ausgleich, Ordnung und Totzeit aus Sicht der Elektroniker-Ausbildung.')
    ],
    readings: [
      R.tubsGdR('Hochschulskript mit Abschnitten „Unterschied Steuerung – Regelung“, Blockschaltbild nach DIN und allen Einzelelementen (P, I, PT1, PT2, Laufzeitglied).', 45, 'Kap. 2 und 5'),
      R.samsonL101('Praxisnahe Herstellerunterlage zu den genormten Begriffen und Symbolen (Steuerung, Regelung, Regelkreis, Formelzeichen).', 25),
      R.samsonL102('Erklärt P-, I-, Totzeit- und Speicherstrecken sowie Proportionalbeiwert und Regelbarkeit an Beispielen aus der Verfahrenstechnik.', 30)
    ],
    quiz: [
      { type: 'single', q: 'Welches Merkmal unterscheidet eine Regelung von einer Steuerung?',
        options: ['Die Regelung verwendet einen stetigen Ausgang', 'Die Regelgröße wird gemessen und mit dem Sollwert verglichen (geschlossener Wirkungskreis)', 'Die Regelung arbeitet schneller', 'Die Regelung benötigt immer einen PID-Baustein'],
        correct: 1, explain: 'Kennzeichen der Regelung ist die Rückführung der gemessenen Regelgröße x und der Vergleich mit w. Nur so werden Störungen ausgeglichen.' },
      { type: 'numeric', q: 'Eine PT1-Heizstrecke hat Ks = {K} K/% und T = {T} s. Die Stellgröße springt von 0 auf {U} %. Um wie viel Kelvin ist die Temperatur nach t = T gestiegen?',
        params: { K: [0.4, 1.2, 0.1], T: [5, 60, 5], U: [20, 100, 10] },
        formula: 'K * U * (1 - exp(-1))', unit: 'K', tol: 0.02,
        explain: 'PT1: Δx(t) = Ks · Δy · (1 − e^(−t/T)). Bei t = T sind 63,2 % des Endwerts Ks · Δy erreicht.' },
      { type: 'single', q: 'Die Sprungantwort einer Strecke steigt nach dem Sprung als Rampe immer weiter an, ohne einen Endwert zu erreichen. Welcher Streckentyp liegt vor?',
        options: ['P-Strecke', 'PT1-Strecke', 'I-Strecke (ohne Ausgleich)', 'Totzeitstrecke'],
        correct: 2, explain: 'Eine Strecke ohne Ausgleich integriert die Stellgröße, z. B. ein Behälter mit Pumpe am Ablauf: Füllstand steigt, solange Zufluss > Abfluss.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Zuordnungen von Formelzeichen sind korrekt?',
        options: ['w – Führungsgröße (Sollwert)', 'x – Regelgröße (Istwert)', 'y – Störgröße', 'e – Regelabweichung w − x', 'z – Stellgröße'],
        correct: [0, 1, 3], explain: 'y ist die Stellgröße (Reglerausgang), z die Störgröße.' },
      { type: 'numeric', q: 'Aus einer Sprungantwort liest du Tu = {Tu} s und Tg = {Tg} s ab. Wie groß ist das Verhältnis Tg/Tu?',
        params: { Tu: [2, 10, 1], Tg: [20, 120, 5] }, formula: 'Tg / Tu', unit: '', tol: 0.01,
        explain: 'Tg/Tu ist ein Maß für die Regelbarkeit: > 10 gut, 3…10 noch gut, < 3 schwer regelbar.' },
      { type: 'single', q: 'Warum ist eine Totzeit für die Regelung besonders kritisch?',
        options: ['Sie verringert die Streckenverstärkung', 'Der Regler sieht die Wirkung seines Eingriffs erst verzögert und neigt bei hoher Verstärkung zum Schwingen', 'Sie macht eine Strecke zur I-Strecke', 'Sie lässt sich nur mit einem Zweipunktregler regeln'],
        correct: 1, explain: 'Die Totzeit erzeugt Phasenverschiebung ohne Amplitudenabnahme; zu große Verstärkung führt zur Instabilität.' },
      { type: 'single', q: 'Eine PT1-Strecke erreicht nach welcher Zeit näherungsweise ihren Endwert (> 99 %)?',
        options: ['nach 1 T', 'nach 2 T', 'nach 3 T', 'nach 5 T'],
        correct: 3, explain: '1 − e^(−5) ≈ 99,3 %. Daher gilt 5 T als praktische Einschwingzeit.' }
    ],
    exercises: [exStep]
  },
  // =========================================================================
  {
    id: 'regelung-3-reglertypen', level: 3, kind: 'lektion',
    title: 'Zweipunktregler, P-, PI- und PID-Regler',
    summary: 'Unstetige Regelung mit Hysterese, stetige P/PI/PID-Regler mit ihren Anteilen – selbst programmiert und mit MTBasicsPID aus mapp Control.',
    minutes: 180,
    req: ['regelung-3-regelkreis'],
    briefing: 'Der einfachste Regler schaltet nur EIN oder AUS – mit einer Hysterese, damit das Stellglied nicht flattert. Stetige Regler berechnen dagegen eine Stellgröße zwischen 0 und 100 %: Der P-Anteil reagiert proportional zur Regelabweichung, der I-Anteil beseitigt die bleibende Regelabweichung, der D-Anteil reagiert auf die Änderungsgeschwindigkeit. Du programmierst beide Reglerarten in ST, verstehst, warum ein reiner P-Regler an einer Strecke mit Last eine bleibende Abweichung hat, und lernst den Standardbaustein MTBasicsPID aus mapp Control kennen.',
    practice: 'Zweipunktregler findest du in Kühlschränken, Reinigungsbädern und Schaltschrankheizungen; PI-Regler für Druck, Durchfluss und Füllstand; PID-Regler für Temperaturzonen von Extrudern und Spritzgießmaschinen. Die Wahl des Reglertyps ist eine der ersten Entscheidungen im Softwaredesign einer Maschine.',
    transfer: {
      tia: 'Siemens bietet PID_Compact (PID mit Selbstoptimierung) und PID_3Step; Zweipunktregler programmierst du selbst. Die Parameter heißen dort Gain, Ti, Td.',
      codesys: 'In CODESYS gibt es den PID-Baustein der Util-Bibliothek, in TwinCAT FB_CTRL_PID aus der Controller Toolbox (TF4100). Das Grundprinzip P + I + D ist identisch.'
    },
    objectives: [
      {
        id: 'o1', title: 'Programmiere einen Zweipunktregler mit Hysterese',
        guide: {
          intro: 'Die Hysterese (Schaltdifferenz) trennt Ein- und Ausschaltpunkt. Dazwischen bleibt der letzte Schaltzustand gespeichert.',
          steps: [
            'Zeichne die Kennlinie: x auf der Abszisse, Ausgang (0/1) auf der Ordinate, Einschaltpunkt w − H/2, Ausschaltpunkt w + H/2.',
            'Schreibe die Logik mit IF/ELSIF, wobei im Zwischenbereich **nichts** zugewiesen wird – so bleibt der Zustand erhalten.',
            'Verriegele den Regler mit Freigabe und Störung (diese Bedingungen stehen zuerst).',
            'Teste im Watch: Ändere `rHyst` von 0 auf 4 K und beobachte die Schaltfrequenz und die Schwankungsbreite der Temperatur.'
          ],
          code: { lang: 'st', text: 'IF NOT diEnable OR bFault THEN\n\tbHeat := FALSE;\nELSIF rTemp < rSetTemp - rHyst / 2.0 THEN\n\tbHeat := TRUE;\nELSIF rTemp > rSetTemp + rHyst / 2.0 THEN\n\tbHeat := FALSE;\nEND_IF' },
          done: 'Erledigt, wenn dein Regler mit Hysterese 2 K das Bad im Band 49…51 °C hält und das Schütz deutlich seltener als im Zyklustakt schaltet.',
          tip: 'Große Hysterese = wenige Schaltspiele, aber große Schwankung. Bei Schützen sind oft nur wenige Schaltspiele pro Minute zulässig – rechne die Lebensdauer (Schaltspiele laut Datenblatt) gegen.'
        }
      },
      {
        id: 'o2', title: 'Erkläre die Wirkung von P-, I- und D-Anteil',
        guide: {
          intro: 'Ein PID-Regler in Parallelform: y = Kp · (e + 1/Tn · ∫e dt + Tv · de/dt).',
          steps: [
            'Lies im Skript der TU Graz Kap. 2.1–2.2 (Parallelrealisierung) und notiere die Sprungantworten von P-, PI- und PID-Regler.',
            'Begründe: Ein P-Regler braucht an einer Strecke mit Last eine Regelabweichung e = y_Last / Kp, um die nötige Stellgröße zu erzeugen (bleibende Regelabweichung).',
            'Der I-Anteil integriert e, bis e = 0 ist; Tn (Nachstellzeit) ist die Zeit, nach der der I-Anteil bei konstantem e den P-Anteil „nachgestellt“ hat.',
            'Der D-Anteil reagiert auf Änderungen; ohne Filter verstärkt er Messrauschen – deshalb haben reale Bausteine eine Filterzeit (z. B. FilterTime bei MTBasicsPID).'
          ],
          done: 'Erledigt, wenn du für eine gegebene Regelabweichung den Verlauf von P-, I- und D-Anteil skizzieren und die bleibende Regelabweichung eines P-Reglers berechnen kannst.',
          tip: 'In der Praxis sind etwa 90 % aller Industrieregler PI-Regler. Den D-Anteil setzt du gezielt bei trägen Temperaturstrecken höherer Ordnung ein – nie bei verrauschten Druck- oder Durchflusssignalen.'
        }
      },
      {
        id: 'o3', title: 'Programmiere einen diskreten PI-Regler in ST',
        guide: {
          intro: 'In der SPS wird der Regler einmal pro Zyklus berechnet. Das Integral wird durch eine Summe angenähert (Rechteckregel).',
          steps: [
            'Lege in Variables.var die Konstanten `rTs` (Zykluszeit in s), `rKp`, `rTn` und die Speichervariable `rI` an.',
            'Berechne jeden Zyklus `rE := w − x`, `rP := rKp * rE` und `rI := rI + rKp / rTn * rE * rTs`.',
            'Begrenze Integrator und Stellgröße mit `LIMIT(0.0, …, 100.0)`.',
            'Prüfe in der Software-Konfiguration, dass die Taskklasse wirklich die Zykluszeit hat, die du in `rTs` eingetragen hast – sonst stimmt die Nachstellzeit nicht.'
          ],
          code: { lang: 'st', text: 'rE := rSetLevel - rLevel;\nrP := rKp * rE;\nrI := LIMIT(0.0, rI + rKp / rTn * rE * rTs, 100.0);\nrValve := LIMIT(0.0, rP + rI, 100.0);' },
          done: 'Erledigt, wenn dein PI-Regler den Füllstand ohne bleibende Abweichung auf 50 % hält und eine Abflussänderung ausregelt.',
          tip: 'Lass `rTs` nicht als Zahl im Code stehen. Eine benannte Konstante (oder die gemessene Zykluszeit) verhindert, dass beim Verschieben des Programms in eine andere Taskklasse das Zeitverhalten unbemerkt falsch wird.',
          link: { label: 'B&R Help: Zyklische Taskklassen', url: url.taskClasses }
        }
      },
      {
        id: 'o4', title: 'Setze MTBasicsPID aus mapp Control ein',
        guide: {
          intro: 'MTBasicsPID gehört zur Bibliothek MTBasics der mapp Control Tools und realisiert einen PID-Regler mit Begrenzung, Anti-Windup und Tracking.',
          steps: [
            'Prüfe, ob das Technologiepaket mapp Control installiert ist (Installation über den Upgrade-Dialog von Automation Studio).',
            'Füge in der Logical View unter **Libraries** die Bibliothek **MTBasics** hinzu (Add Object › Library); abhängige Bibliotheken wie MTTypes werden mit eingebunden.',
            'Deklariere eine Instanz `PID : MTBasicsPID;`, setze in `_INIT` die Parameter `PIDParameters.Gain`, `IntegrationTime`, `DerivativeTime`, `MinOut`, `MaxOut` und `Enable := TRUE`.',
            'Rufe den Baustein in `_CYCLIC` mit `SetValue` und `ActValue` auf und verwende `PID.Out` als Stellgröße.',
            'Beobachte im Watch `ProportionalPart`, `IntegrationPart` und `ControlError` und vergleiche sie mit deinem selbst programmierten PI-Regler.'
          ],
          code: { lang: 'st', text: 'PROGRAM _INIT\n\tPID.PIDParameters.Gain := 8.0;\n\tPID.PIDParameters.IntegrationTime := 5.0;\n\tPID.PIDParameters.DerivativeTime := 0.0;\n\tPID.MinOut := 0.0;\n\tPID.MaxOut := 100.0;\n\tPID.Enable := TRUE;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tPID.SetValue := rSetLevel;\n\tPID.ActValue := rLevel;\n\tPID();\n\trValve := PID.Out;\nEND_PROGRAM' },
          done: 'Erledigt, wenn MTBasicsPID in deinem AS6-Projekt läuft (Active = TRUE, Error = FALSE) und dieselbe Strecke wie dein eigener PI-Regler stabil regelt.',
          tip: 'Parameteränderungen zur Laufzeit übernimmt MTBasicsPID erst mit einer steigenden Flanke an `Update`. Wer das vergisst, sucht lange nach „wirkungslosen“ Parametern.',
          link: { label: 'B&R Help: MTBasicsPID – Aufrufsyntax', url: url.mtbasicsPidSyntax }
        }
      }
    ],
    videos: [
      vid('choHysterese', 'Lehrvideo aus der Technikerschule: von der Hysterese-Kennlinie direkt zum Programmablauf – genau der Schritt zur ST-Umsetzung.'),
      vid('buchholzPID', 'Hochschul-Vorlesung zum PID-Glied: Parallelform, Sprungantwort und Bedeutung von Kp, Tn und Tv.'),
      vid('matlabPid', 'Anschauliche englische Einführung, wie P-, I- und D-Anteil zusammenwirken.')
    ],
    readings: [
      R.grazRS('Kap. 2 behandelt den PID-Regler in Parallel- und Serienform sowie praktische Varianten (I-PD, PI-D) – klar und kompakt.', 40, 'Kap. 2'),
      R.samsonL102('Abschnitte zu stetigen Reglern (P, I, D, PI, PID) und unstetigen Reglern (Zweipunktregler mit und ohne Rückführung) mit Praxisbeispielen.', 35),
      R.br('MTBasicsPID – Funktionsbeschreibung', url.mtbasicsPidFunktion, 'Blockschaltbild, Anti-Windup und Tracking des Standardbausteins in AS6.', 20)
    ],
    quiz: [
      { type: 'single', q: 'Wozu dient die Hysterese eines Zweipunktreglers?',
        options: ['Sie erhöht die Genauigkeit auf exakt den Sollwert', 'Sie verhindert ständiges Hin- und Herschalten (Flattern) des Stellglieds', 'Sie ersetzt den I-Anteil', 'Sie begrenzt die Stellgröße auf 0…100 %'],
        correct: 1, explain: 'Durch getrennte Ein- und Ausschaltpunkte schaltet das Stellglied nur noch beim Durchlaufen des Bandes – die Schaltspiele sinken drastisch.' },
      { type: 'numeric', q: 'Ein P-Regler mit Kp = {Kp} %/K regelt eine Heizung. Im Beharrungszustand werden {Y} % Heizleistung benötigt (ohne Arbeitspunktvorgabe). Wie groß ist die bleibende Regelabweichung?',
        params: { Kp: [2, 20, 1], Y: [10, 80, 5] }, formula: 'Y / Kp', unit: 'K', tol: 0.01,
        explain: 'Der P-Regler erzeugt y = Kp · e. Für y = Y muss e = Y / Kp anstehen – diese Abweichung bleibt, ein I-Anteil beseitigt sie.' },
      { type: 'single', q: 'Welche Aussage über den I-Anteil eines PI-Reglers ist richtig?',
        options: ['Er reagiert auf die Änderungsgeschwindigkeit von e', 'Er wächst so lange, wie e ≠ 0 ist, und beseitigt dadurch die bleibende Regelabweichung', 'Er wird nur beim Einschalten berechnet', 'Er macht den Regelkreis immer schneller'],
        correct: 1, explain: 'Der Integrator summiert e auf. Erst bei e = 0 ändert er sich nicht mehr – der Regelkreis wird stationär genau, aber tendenziell langsamer und schwingfreudiger.' }
    ],
    exam: [
      { type: 'single', q: 'In welchem MTBasicsPID-Eingang übergibst du den Istwert?',
        options: ['SetValue', 'ActValue', 'TrackingValue', 'IntegrationPartPresetValue'],
        correct: 1, explain: 'SetValue ist der Sollwert, ActValue der Istwert. TrackingValue wird nur im Handbetrieb (EnableTracking) ausgegeben.' },
      { type: 'numeric', q: 'Ein PI-Regler hat Kp = {Kp} und Tn = {Tn} s. Die Regelabweichung springt auf e = {E} und bleibt konstant (Regler unbegrenzt, I-Anteil vorher 0). Wie groß ist die Stellgröße nach t = {t} s?',
        params: { Kp: [1, 10, 1], Tn: [2, 20, 1], E: [1, 5, 1], t: [1, 10, 1] }, formula: 'Kp * E * (1 + t / Tn)', unit: '%', tol: 0.01,
        explain: 'y(t) = Kp · e + Kp/Tn · e · t. Nach t = Tn hat der I-Anteil den Wert des P-Anteils erreicht.' },
      { type: 'multi', q: 'Welche Maßnahmen sind bei einem D-Anteil an einem verrauschten Messsignal sinnvoll?',
        options: ['Filterzeit (FilterTime) für den D-Anteil setzen', 'D-Anteil auf den Istwert statt auf e wirken lassen', 'Tv möglichst groß wählen', 'Messsignal vorher filtern bzw. auf den D-Anteil verzichten'],
        correct: [0, 1, 3], explain: 'Ein großer Tv verstärkt das Rauschen. D auf den Istwert vermeidet den „derivative kick“ bei Sollwertsprüngen; Filter dämpfen hochfrequente Anteile.' },
      { type: 'single', q: 'Was bewirkt eine größere Hysterese bei einem Zweipunkt-Temperaturregler?',
        options: ['Höhere Schaltfrequenz, kleinere Schwankung', 'Niedrigere Schaltfrequenz, größere Schwankung der Temperatur', 'Keine Änderung, nur andere Mitteltemperatur', 'Der Regler wird zum PI-Regler'],
        correct: 1, explain: 'Schaltfrequenz und Schwankungsbreite sind gegenläufig; die Wahl ist ein Kompromiss zwischen Stellgliedverschleiß und Genauigkeit.' }
    ],
    exercises: [exTwoPoint, exPI]
  },
  // =========================================================================
  {
    id: 'regelung-3-projekt-heizzone', level: 3, kind: 'projekt',
    title: 'Praxisprojekt: Temperaturregelung einer Heizzone mit PWM',
    summary: 'Komplette Maschinenfunktion: Zustandsautomat, PI-Regler mit Begrenzung, PWM-Ausgang für ein Halbleiterrelais und Übertemperatur-Abschaltung.',
    minutes: 240,
    req: ['regelung-3-reglertypen'],
    briefing: 'Eine Heizzone ist die typische Regelaufgabe an Verpackungs-, Kunststoff- und Lebensmittelmaschinen. Heizpatronen werden meist über Halbleiterrelais an einem digitalen Ausgang betrieben; die stetige Stellgröße des Reglers wird per Pulsweitenmodulation in Ein-/Aus-Zeiten umgesetzt. In diesem Projekt baust du die vollständige Funktion: Betriebszustände, Regler, PWM und eine Überwachung, die bei Übertemperatur sicher abschaltet und erst nach Abkühlen quittiert werden kann. Damit erfüllst du das Niveau „selbstständige Inbetriebnahme einer Maschinenfunktion“.',
    practice: 'Siegelbacken, Schmelzetanks von Klebstoffauftragsgeräten, Werkzeugheizungen: Überall läuft genau diese Struktur – meist mit MTBasicsPID + MTBasicsPWM oder mapp Temperature (MpTempController), die du nach diesem Projekt fundiert parametrieren kannst.',
    transfer: {
      tia: 'In TIA Portal kombinierst du PID_Compact (Ausgang Output_PWM) mit einer eigenen Betriebsartenlogik; die Übertemperaturabschaltung gehört zusätzlich in Hardware (Temperaturbegrenzer).',
      codesys: 'In TwinCAT übernimmt FB_CTRL_PWM_OUT aus der Controller Toolbox die PWM, in CODESYS programmierst du sie meist selbst wie in diesem Projekt.'
    },
    objectives: [
      {
        id: 'o1', title: 'Entwirf den Zustandsautomaten der Heizzone',
        guide: {
          intro: 'Bevor du Regler und PWM programmierst, legst du fest, in welchen Zuständen geheizt werden darf und wie Störungen behandelt werden.',
          steps: [
            'Zeichne das Zustandsdiagramm mit TS_OFF, TS_HEATUP, TS_CONTROL, TS_FAULT und beschrifte alle Übergänge mit ihren Bedingungen.',
            'Lege den Aufzählungstyp `eTempState` in Types.typ an (in AS6: Logical View › Programm › Types.typ).',
            'Lege fest, welche Ausgänge in welchem Zustand aktiv sind (Ausgangstabelle): doHeater nur in HEATUP/CONTROL, doFault nur in FAULT.',
            'Definiere die Quittierbedingung: diReset UND rTemp < 80 °C – sonst würde die Zone nach Quittieren sofort wieder abschalten.'
          ],
          done: 'Erledigt, wenn Zustandsdiagramm und Ausgangstabelle vollständig sind und jeder Zustand einen definierten Ausgang hat.',
          tip: 'Eine Übertemperatur-Abschaltung in Software ersetzt keinen Sicherheitstemperaturbegrenzer (STB) in Hardware. Sie schützt Produkt und Werkzeug, nicht Personen.'
        }
      },
      {
        id: 'o2', title: 'Implementiere den PI-Regler mit bedingter Integration',
        guide: {
          intro: 'Während des Aufheizens ist die Stellgröße in der Begrenzung. Würde der Integrator weiterlaufen, käme es zu starkem Überschwingen (Windup).',
          steps: [
            'Berechne zuerst die Stellgröße probeweise mit dem neuen I-Anteil: `rU := rP + rI + rKp / rTn * rE * rTs;`',
            'Übernimm den neuen I-Anteil nur, wenn `0 < rU < 100` gilt.',
            'Setze den I-Anteil in TS_OFF und TS_FAULT auf 0, damit ein Neustart nicht mit einem „aufgeladenen“ Integrator beginnt.',
            'Teste die Wirkung: Kommentiere die Bedingung testweise aus und vergleiche das Überschwingen im Trace.'
          ],
          done: 'Erledigt, wenn die Zone von 20 °C auf 60 °C mit höchstens 2 K Überschwingen aufheizt.',
          tip: 'Die bedingte Integration (Clamping) ist das einfachste Anti-Windup. MTBasicsPID verwendet ein ähnliches Verfahren – das Engineer-Modul vertieft die Varianten.'
        }
      },
      {
        id: 'o3', title: 'Setze die Stellgröße per PWM auf den digitalen Ausgang um',
        guide: {
          intro: 'Die PWM-Periode muss deutlich kleiner als die Zeitkonstante der Strecke sein, damit die Temperatur nur wenig „rippelt“.',
          steps: [
            'Lege eine PWM-Periode fest (hier 1 s bei T = 40 s). Faustregel: Periode ≤ T/10.',
            'Programmiere einen Sägezahn `rPwmTime` (0 … Periode) und vergleiche ihn mit der Einschaltdauer `rPower/100 · Periode`.',
            'Prüfe die minimale Pulsbreite: Bei 10 ms Zyklus und 1 s Periode beträgt die Auflösung 1 %.',
            'Für das reale Projekt: Vergleiche mit **MTBasicsPWM** (Parameter Period, MinPulseWidth, DutyCycle) und entscheide, welche Lösung du in die Maschine übernimmst.'
          ],
          done: 'Erledigt, wenn doHeater im Regelbetrieb mit 1 s Periode taktet und die Temperatur um weniger als ±0,5 K schwankt.',
          tip: 'Bei Halbleiterrelais mit Nullspannungsschaltung ist die kleinste sinnvolle Einschaltzeit eine Netzhalbwelle (10 ms bei 50 Hz). Zu kurze Perioden erzeugen dann eine grobe Leistungsauflösung.',
          link: { label: 'B&R Help: MTBasicsPWM', url: url.mtbasicsPwm }
        }
      },
      {
        id: 'o4', title: 'Nimm die Heizzone in Betrieb und dokumentiere die Abnahme',
        guide: {
          intro: 'Eine Inbetriebnahme ist erst abgeschlossen, wenn das Verhalten gemessen und dokumentiert ist.',
          steps: [
            'Zeichne mit dem Trace einen Aufheizvorgang 20 → 60 °C auf (rTemp, rPower, doHeater, eState).',
            'Bestimme aus dem Trace: Überschwingen in K, Zeit bis zum Eintritt in das Band ±1 K, Schwankung im Regelbetrieb.',
            'Teste die Übertemperatur-Abschaltung (Fremdwärme in der Simulation erhöhen) und die Quittierung.',
            'Committe dein Projekt mit einer aussagekräftigen Commit-Message und reiche den Link als Nachweis ein.'
          ],
          done: 'Erledigt, wenn ein Abnahmeprotokoll mit Trace-Screenshot, den drei Kennwerten und dem Test der Abschaltung vorliegt.',
          tip: 'Protokolliere auch die Reglerparameter und die PWM-Periode. Wer später nachoptimiert, muss wissen, wovon er ausgeht.',
          link: { label: 'B&R Help: Trace konfigurieren', url: url.traceConfig }
        }
      }
    ],
    videos: [
      vid('bbsWuerfel', 'Berufsschul-Praxisbeispiel: PID-Temperaturregelung mit einer SPS an einem realen Versuchsaufbau.'),
      vid('tpZweipunkt', 'Zeigt den Unterschied zwischen schaltender und stetiger Temperaturregelung aus Sicht eines Temperaturregler-Herstellers.'),
      vid('autoMatesTrace', 'Englisches Tutorial zur Trace-Aufzeichnung in Automation Studio – für deine Abnahmemessung.')
    ],
    readings: [
      R.tubsEMDR('Abschnitt 8.3 „Schaltende Regler“ erklärt die Linearisierung durch periodisches Schalten – die Theorie hinter dem PWM-Ausgang.', 30, 'Kap. 8.3'),
      R.br('MTBasicsPWM', url.mtbasicsPwm, 'Schnittstelle des B&R-PWM-Bausteins mit Periode, minimaler Pulsbreite und Tastgrad.', 15),
      R.br('mapp Temperature – Konzept', url.mtTempConcept, 'Zeigt, welche Funktionen ein professioneller Temperaturregler zusätzlich bietet (Tuning, Gruppen, Heizstromüberwachung).', 10)
    ],
    quiz: [
      { type: 'numeric', q: 'Ein PI-Regler liefert {P} % Stellgröße. Die PWM-Periode beträgt {T} s. Wie lange ist der Heizausgang pro Periode eingeschaltet?',
        params: { P: [5, 95, 5], T: [0.5, 5, 0.5] }, formula: 'P / 100 * T', unit: 's', tol: 0.01,
        explain: 'Einschaltdauer = Tastgrad · Periode = P/100 · T.' },
      { type: 'single', q: 'Warum muss die PWM-Periode deutlich kleiner als die Zeitkonstante der Heizstrecke sein?',
        options: ['Damit das Halbleiterrelais nicht überhitzt', 'Damit die Strecke die Pulse glättet und die Temperatur nur wenig schwankt', 'Weil sonst der I-Anteil nicht funktioniert', 'Weil die Taskklasse sonst überlastet wird'],
        correct: 1, explain: 'Die träge Strecke wirkt als Tiefpass. Je kürzer die Periode im Verhältnis zu T, desto kleiner der Temperaturrippel.' },
      { type: 'single', q: 'Warum darf die Störung „Übertemperatur“ erst unter 80 °C quittiert werden, obwohl die Abschaltgrenze 90 °C ist?',
        options: ['Weil der Regler sonst instabil wird', 'Damit nicht sofort nach dem Quittieren erneut abgeschaltet wird und der Bediener die Ursache prüft', 'Weil der I-Anteil erst abklingen muss', 'Weil MTBasicsPID das vorschreibt'],
        correct: 1, explain: 'Die Quittierschwelle bildet eine Hysterese für die Störung; sie verhindert „Takten“ zwischen Störung und Betrieb.' }
    ],
    exam: [
      { type: 'single', q: 'Was passiert ohne Anti-Windup beim Aufheizen einer Zone mit großer Regelabweichung?',
        options: ['Die Zone heizt langsamer auf', 'Der I-Anteil wächst während der Begrenzung weiter; nach Erreichen des Sollwerts schwingt die Temperatur deutlich über', 'Die PWM-Periode verlängert sich', 'Nichts – die Begrenzung genügt'],
        correct: 1, explain: 'Der „aufgezogene“ Integrator muss erst durch negative Regelabweichung abgebaut werden – das erzeugt Überschwingen.' },
      { type: 'multi', q: 'Welche Elemente gehören zu einer vollständigen Heizzonen-Funktion?',
        options: ['Betriebszustände mit definierten Ausgängen', 'Überwachung auf Übertemperatur und Fühlerfehler mit Vorrang', 'Reset des I-Anteils beim Abschalten', 'Ein D-Anteil mit möglichst großer Vorhaltzeit'],
        correct: [0, 1, 2], explain: 'Der D-Anteil ist optional; Zustände, Überwachung und definierter Reglerreset sind Pflicht.' },
      { type: 'numeric', q: 'Eine Heizzone hat Ks = {K} K/% und eine Umgebungstemperatur von 20 °C. Welche Stellgröße in % ist im Beharrungszustand für {W} °C nötig?',
        params: { K: [0.5, 2, 0.1], W: [40, 70, 5] }, formula: '(W - 20) / K', unit: '%', tol: 0.02,
        explain: 'Im Beharrungszustand gilt x − x_U = Ks · y, also y = (w − 20 °C) / Ks.' }
    ],
    exercises: [exProj],
    proof: true,
    badge: 'Heizzonen-Inbetriebnehmer'
  }
];
