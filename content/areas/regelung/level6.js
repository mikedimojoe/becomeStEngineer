// Regelungstechnik – Level 6 (Stufe Guru → Prüfung Genie)
'use strict';
const { url, R, vid } = require('./sources');

// ---------------------------------------------------------------------------
// Übung: Streckensimulation in ST (PT1, Totzeit, nichtlinearer Behälter)
// ---------------------------------------------------------------------------
const simFbs = (pt1, dt, tank) => `FUNCTION_BLOCK FB_SimPT1
	VAR_INPUT
		rIn : REAL;
		rKs : REAL;      (* Verstärkung *)
		rT : REAL;       (* Zeitkonstante in s *)
		rTs : REAL;      (* Abtastzeit in s *)
	END_VAR
	VAR_OUTPUT
		rOut : REAL;
	END_VAR
${pt1}END_FUNCTION_BLOCK

FUNCTION_BLOCK FB_SimDeadTime
	VAR_INPUT
		rIn : REAL;
		rDelay : REAL;   (* Totzeit in s, 0..9,99 s *)
		rTs : REAL;
	END_VAR
	VAR_OUTPUT
		rOut : REAL;
	END_VAR
	VAR
		aBuf : ARRAY[0..999] OF REAL;
		nWrite : INT;
		nDelay : INT;
		nRead : INT;
	END_VAR
${dt}END_FUNCTION_BLOCK

FUNCTION_BLOCK FB_SimTank
	VAR_INPUT
		rInflow : REAL;  (* Zufluss in l/s *)
		rArea : REAL;    (* Querschnitt in m², > 0 *)
		rKOut : REAL;    (* Ausflusskoeffizient: q_ab = rKOut * SQRT(h) *)
		rHMax : REAL;    (* Behälterhöhe in m *)
		rTs : REAL;
	END_VAR
	VAR_OUTPUT
		rLevel : REAL;   (* Füllhöhe h in m *)
		rOutflow : REAL; (* Abfluss in l/s *)
		bOverflow : BOOL;
	END_VAR
${tank}END_FUNCTION_BLOCK
`;
const pt1Sol = `	(* Rückwärts-Euler: stabil auch für T < Ts, T = 0 -> rein proportional *)
	rOut := rOut + (rKs * rIn - rOut) * rTs / (rT + rTs);
`;
const dtSol = `	nDelay := REAL_TO_INT(rDelay / rTs);
	nDelay := LIMIT(0, nDelay, 999);
	aBuf[nWrite] := rIn;
	nRead := nWrite - nDelay;
	IF nRead < 0 THEN
		nRead := nRead + 1000;
	END_IF
	rOut := aBuf[nRead];
	nWrite := (nWrite + 1) MOD 1000;
`;
const tankSol = `	IF rArea <= 0.0 THEN
		RETURN;   (* ungültiger Parameter: Zustand einfrieren *)
	END_IF
	(* Torricelli: Abfluss proportional zur Wurzel der Füllhöhe (nichtlinear) *)
	rOutflow := rKOut * SQRT(MAX(rLevel, 0.0));
	rLevel := rLevel + (rInflow - rOutflow) / rArea * rTs;
	bOverflow := rLevel >= rHMax;
	rLevel := LIMIT(0.0, rLevel, rHMax);
`;
const simProg = `
PROGRAM _CYCLIC
	fbPT1(rIn := rU, rKs := 2.0, rT := rTConst, rTs := 0.01);
	rPT1Out := fbPT1.rOut;
	fbDelay(rIn := rU, rDelay := 1.5, rTs := 0.01);
	rDelayOut := fbDelay.rOut;
	fbTank(rInflow := rInflow, rArea := 0.5, rKOut := 0.5, rHMax := 30.0, rTs := 0.01);
	rLevelOut := fbTank.rLevel;
	doOverflow := fbTank.bOverflow;
END_PROGRAM
`;
const simVar = 'VAR\n\tfbPT1 : FB_SimPT1;\n\tfbDelay : FB_SimDeadTime;\n\tfbTank : FB_SimTank;\nEND_VAR\n';
const exSim = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Streckenmodelle als Funktionsbausteine: PT1, Totzeit, Behälter',
  task: `Für virtuelle Inbetriebnahme und Software-in-the-Loop-Tests brauchst du eine Bibliothek von Streckenmodellen (in AS6 eine eigene Bibliothek, Deklarationen in der \`.fun\`-Datei, Einsatz in einer Simulations-Task, die nur unter ARsim läuft). Implementiere drei Bausteine:

1. **FB_SimPT1**: \`rOut\` folgt \`rKs · rIn\` mit Zeitkonstante \`rT\`. Verwende die **Rückwärts-Euler**-Form \`rOut := rOut + (Ks·In − Out) · Ts/(T + Ts)\` – sie bleibt auch bei T < Ts stabil, bei T = 0 ist \`rOut = Ks · rIn\`.
2. **FB_SimDeadTime**: verzögert \`rIn\` um \`rDelay\` (Ringpuffer \`ARRAY[0..999]\`, Verzögerung in Zyklen = \`REAL_TO_INT(rDelay/rTs)\`, begrenzt auf 0…999). Bei \`rDelay = 0\` gilt \`rOut = rIn\`.
3. **FB_SimTank**: Behälter mit freiem Auslauf (Torricelli): \`q_ab = KOut · √h\`, \`dh/dt = (q_zu − q_ab)/A\`. Füllhöhe auf 0…HMax begrenzen, \`bOverflow\` bei h ≥ HMax. Bei \`rArea ≤ 0\` nichts rechnen (keine Division durch 0).

Das Programm verwendet: PT1 mit Ks = 2, T = \`rTConst\`; Totzeit 1,5 s; Behälter A = 0,5 m², KOut = 0,5, HMax = 30 m.`,
  hints: [
    'Totzeit: Schreibe den aktuellen Wert an nWrite und lies an nWrite − nDelay (bei negativem Index + 1000). Bei nDelay = 0 liest du den gerade geschriebenen Wert.',
    'Die Wurzel aus einer negativen Zahl ist nicht definiert – begrenze h vor SQRT auf ≥ 0.',
    'Stationär gilt beim Behälter q_zu = KOut · √h, also h = (q_zu/KOut)². Damit kannst du dein Modell prüfen.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rU', type: 'REAL', dir: 'in', label: 'Eingang u', widget: 'slider', min: 0, max: 10, init: 0 },
    { name: 'rTConst', type: 'REAL', dir: 'in', label: 'Zeitkonstante PT1', widget: 'slider', min: 0, max: 20, init: 5, unit: 's' },
    { name: 'rInflow', type: 'REAL', dir: 'in', label: 'Zufluss Behälter', widget: 'slider', min: 0, max: 5, init: 0, unit: 'l/s' },
    { name: 'rPT1Out', type: 'REAL', dir: 'out', label: 'PT1-Ausgang', widget: 'value' },
    { name: 'rDelayOut', type: 'REAL', dir: 'out', label: 'Totzeit-Ausgang', widget: 'value' },
    { name: 'rLevelOut', type: 'REAL', dir: 'out', label: 'Füllhöhe', widget: 'gauge', min: 0, max: 30, unit: 'm' },
    { name: 'doOverflow', type: 'BOOL', dir: 'out', label: 'Überlauf', widget: 'led' }
  ],
  files: {
    main: simFbs('\t(* TODO *)\n\trOut := 0.0;\n', '\t(* TODO *)\n\trOut := 0.0;\n', '\t(* TODO *)\n\trLevel := 0.0;\n') + simProg,
    var: simVar, typ: ''
  },
  solution: { main: simFbs(pt1Sol, dtSol, tankSol) + simProg, var: simVar, typ: '' },
  tests: [
    { name: 'PT1: 63,2 % nach t = T, Endwert Ks · u', steps: [
      { set: { rU: 1.0 } }, { ms: 5000 },
      { expect: 'ABS(rPT1Out - 1.264) < 0.02', msg: 'Nach t = T = 5 s muss der PT1 bei 63,2 % von Ks·u = 2 liegen (≈ 1,264).' },
      { ms: 30000 },
      { expect: 'ABS(rPT1Out - 2.0) < 0.01', msg: 'Der Endwert muss Ks · u = 2 sein.' }
    ] },
    { name: 'PT1 mit T = 0 ist rein proportional (stabil)', steps: [
      { set: { rU: 3.0, rTConst: 0.0 } }, { cycles: 2 },
      { expect: 'ABS(rPT1Out - 6.0) < 0.001', msg: 'Bei T = 0 muss rOut = Ks · rIn gelten – ohne Instabilität oder Division durch 0.' }
    ] },
    { name: 'Totzeit verzögert um genau 1,5 s', steps: [
      { ms: 500 }, { set: { rU: 1.0 } }, { ms: 1400 },
      { expect: 'rDelayOut = 0.0', msg: 'Vor Ablauf der Totzeit darf der Ausgang noch nicht reagieren.' },
      { ms: 200 },
      { expect: 'rDelayOut = 1.0', msg: 'Nach 1,5 s muss der Sprung am Ausgang angekommen sein.' }
    ] },
    { name: 'Behälter: stationäre Füllhöhe h = (q/K)²', steps: [
      { set: { rInflow: 2.0 } }, { ms: 60000 },
      { expect: 'ABS(rLevelOut - 16.0) < 0.2 AND NOT doOverflow', msg: 'Bei 2 l/s und K = 0,5 muss sich h = 16 m einstellen.' }
    ] },
    { name: 'Behälter: Überlauf wird erkannt und begrenzt', steps: [
      { set: { rInflow: 5.0 } }, { ms: 60000 },
      { expect: 'doOverflow AND rLevelOut <= 30.0', msg: 'Bei 5 l/s läuft der Behälter über: bOverflow setzen, h auf HMax begrenzen.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Übung: Zustandsregler mit Polvorgabe
// ---------------------------------------------------------------------------
const zVar = `VAR CONSTANT
	rMass : REAL := 2.0;      (* kg *)
	rDamp : REAL := 1.0;      (* Ns/m, viskose Reibung *)
	rFMax : REAL := 50.0;     (* Kraftbegrenzung in N *)
	rPole : REAL := -2.0;     (* gewünschter Doppelpol in 1/s *)
END_VAR
VAR
	rK1 : REAL;   (* Rückführung Position *)
	rK2 : REAL;   (* Rückführung Geschwindigkeit *)
	rV : REAL;    (* Vorfilter *)
	rF : REAL;
END_VAR
`;
const zCyclic = `PROGRAM _CYCLIC
	IF diEnable THEN
		rF := rV * rSetPos - rK1 * rPos - rK2 * rVel;
		rForce := LIMIT(-rFMax, rF, rFMax);
	ELSE
		rForce := 0.0;
	END_IF
END_PROGRAM
`;
const zSolution = `PROGRAM _INIT
	(* Polvorgabe: geschlossener Kreis s² + (d + k2)/m · s + k1/m  =!  (s − p)² = s² − 2p·s + p² *)
	rK1 := rMass * rPole * rPole;
	rK2 := -2.0 * rPole * rMass - rDamp;
	rV := rK1;   (* Vorfilter: stationär x1 = w *)
END_PROGRAM

` + zCyclic;
const zStart = `PROGRAM _INIT
	(* Erster Versuch: nur die Position wird zurückgeführt *)
	rK1 := 8.0;
	rK2 := 0.0;
	rV := rK1;
END_PROGRAM

` + zCyclic;
const exState = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Zustandsregler mit Polvorgabe für einen Positionierschlitten',
  task: `Ein Schlitten (Masse m = 2 kg, viskose Reibung d = 1 Ns/m) wird über eine Kraft F positioniert. Gemessen werden **beide Zustände**: Position \`rPos\` (x₁) und Geschwindigkeit \`rVel\` (x₂). Zustandsmodell:

\`x₁' = x₂\`, \`x₂' = (F − d · x₂) / m\`

Regelgesetz: \`F = V · w − k₁ · x₁ − k₂ · x₂\` (Kraft auf ±50 N begrenzt). Der erste Versuch führt nur die Position zurück (k₂ = 0) – der Schlitten schwingt stark.

Bestimme in \`_INIT\` die Verstärkungen durch **Polvorgabe**: Der geschlossene Kreis soll einen **Doppelpol bei p = −2 1/s** haben (aperiodisch, kein Überschwingen).
1. Charakteristisches Polynom des geschlossenen Kreises: \`s² + (d + k₂)/m · s + k₁/m\`.
2. Wunschpolynom: \`(s − p)² = s² − 2p · s + p²\`.
3. Koeffizientenvergleich → \`k₁\`, \`k₂\`; Vorfilter \`V = k₁\` für stationäre Genauigkeit.
Rechne mit den Konstanten \`rMass\`, \`rDamp\`, \`rPole\` (keine festen Zahlen), damit der Code für andere Massen wiederverwendbar ist.`,
  hints: [
    'Koeffizientenvergleich: k₁/m = p² und (d + k₂)/m = −2p.',
    'Mit m = 2, d = 1, p = −2 ergibt sich k₁ = 8 N/m und k₂ = 7 Ns/m.',
    'Ohne Integralanteil wird eine konstante Störkraft nicht vollständig ausgeregelt – dafür gibt es den PI-Zustandsregler (Skript TU Graz, Kap. 6.4).'
  ],
  cycleMs: 10,
  io: [
    { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Regler freigeben', widget: 'switch', init: true },
    { name: 'rSetPos', type: 'REAL', dir: 'in', label: 'Sollposition w', widget: 'slider', min: -1, max: 2, init: 0, unit: 'm' },
    { name: 'rPos', type: 'REAL', dir: 'in', label: 'Position x₁', widget: 'value', unit: 'm' },
    { name: 'rVel', type: 'REAL', dir: 'in', label: 'Geschwindigkeit x₂', widget: 'value', unit: 'm/s' },
    { name: 'rForce', type: 'REAL', dir: 'out', label: 'Kraft F', widget: 'gauge', min: -50, max: 50, unit: 'N' }
  ],
  plant: {
    var: 'VAR\n\trX1 : REAL;\n\trX2 : REAL;\n\trX1Max : REAL;   (* Schleppzeiger Position *)\nEND_VAR\n',
    code: 'rX2 := rX2 + (rForce - 1.0 * rX2) / 2.0 * PLANT_DT;\nrX1 := rX1 + rX2 * PLANT_DT;\nrPos := rX1;\nrVel := rX2;\nrX1Max := MAX(rX1Max, rX1);\n'
  },
  files: { main: zStart, var: zVar, typ: '' },
  solution: { main: zSolution, var: zVar, typ: '' },
  tests: [
    { name: 'Verstärkungen aus der Polvorgabe', steps: [
      { cycles: 1 },
      { expect: 'ABS(rK1 - 8.0) < 0.01 AND ABS(rK2 - 7.0) < 0.01 AND ABS(rV - 8.0) < 0.01', msg: 'Für p = −2, m = 2, d = 1 gilt k₁ = 8, k₂ = 7, V = 8.' }
    ] },
    { name: 'Sollsprung 0 → 1 m: nach 4 s im Band ±2 cm', steps: [
      { set: { rSetPos: 1.0 } }, { ms: 4000 },
      { expect: 'ABS(rPos - 1.0) < 0.02', msg: 'Der Schlitten muss nach 4 s bei 1 m ± 2 cm stehen.' },
      { ms: 2000 },
      { expect: 'ABS(rPos - 1.0) < 0.005 AND ABS(rVel) < 0.01', msg: 'Stationär muss die Position genau erreicht sein.' }
    ] },
    { name: 'Kein Überschwingen (aperiodischer Doppelpol)', steps: [
      { set: { rSetPos: 1.0 } }, { ms: 8000 },
      { expect: 'rX1Max < 1.01', msg: 'Bei einem reellen Doppelpol darf der Schlitten nicht überschwingen (Schleppzeiger rX1Max).' }
    ] },
    { name: 'Kraft wird auf ±50 N begrenzt', steps: [
      { set: { rSetPos: 20.0 } }, { cycles: 1 },
      { expect: 'rForce = 50.0', msg: 'Bei großem Sollsprung muss die Kraft auf 50 N begrenzt sein.' },
      { set: { rSetPos: -20.0 } }, { cycles: 1 },
      { expect: 'rForce = -50.0' }
    ] },
    { name: 'Freigabe AUS: Kraft 0', steps: [
      { set: { rSetPos: 1.0 } }, { ms: 1000 }, { set: { diEnable: false } }, { cycles: 1 },
      { expect: 'rForce = 0.0' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Übung: Mehrgrößenregelung mit statischer Entkopplung
// ---------------------------------------------------------------------------
const piSimple = `FUNCTION_BLOCK FB_PISimple
	VAR_INPUT
		rE : REAL;
		rKp : REAL;
		rTn : REAL;
		rMin : REAL;
		rMax : REAL;
		rTs : REAL;
	END_VAR
	VAR_OUTPUT
		rOut : REAL;
	END_VAR
	VAR
		rI : REAL;
		rDeltaI : REAL;
		rU : REAL;
	END_VAR
	rDeltaI := rKp / rTn * rE * rTs;
	rU := rKp * rE + rI + rDeltaI;
	IF NOT (((rU > rMax) AND (rDeltaI > 0.0)) OR ((rU < rMin) AND (rDeltaI < 0.0))) THEN
		rI := rI + rDeltaI;
	END_IF
	rOut := LIMIT(rMin, rKp * rE + rI, rMax);
END_FUNCTION_BLOCK
`;
const mVar = `VAR CONSTANT
	rTs : REAL := 0.01;
	rTHot : REAL := 60.0;    (* Modell: Warmwassertemperatur in °C *)
	rTCold : REAL := 10.0;   (* Modell: Kaltwassertemperatur in °C *)
	rQMax : REAL := 10.0;    (* max. Durchfluss je Ventil in l/min *)
END_VAR
VAR
	fbFlow : FB_PISimple;
	fbTemp : FB_PISimple;
	rQCmd : REAL;    (* entkoppelte Stellgröße: Gesamtdurchfluss *)
	rTCmd : REAL;    (* entkoppelte Stellgröße: Mischtemperatur *)
END_VAR
`;
const mSolution = piSimple + `
PROGRAM _CYCLIC
	(* Korrekturregler auf die entkoppelten Größen (Sollwert als Vorsteuerung) *)
	fbFlow(rE := rSetFlow - rFlow, rKp := 0.5, rTn := 0.5, rMin := -5.0, rMax := 5.0, rTs := rTs);
	fbTemp(rE := rSetTemp - rTempMix, rKp := 0.5, rTn := 1.0, rMin := -20.0, rMax := 20.0, rTs := rTs);
	rQCmd := LIMIT(0.0, rSetFlow + fbFlow.rOut, 2.0 * rQMax);
	rTCmd := LIMIT(rTCold, rSetTemp + fbTemp.rOut, rTHot);

	(* statische Entkopplung: Mischungsgleichung nach den Ventilen auflösen *)
	rValveHot := LIMIT(0.0, rQCmd * (rTCmd - rTCold) / (rTHot - rTCold), rQMax);
	rValveCold := LIMIT(0.0, rQCmd - rValveHot, rQMax);
END_PROGRAM
`;
const mStart = piSimple + `
PROGRAM _CYCLIC
	(* zwei unabhängige Eingrößenregler: Temperatur -> Warmventil, Durchfluss -> Kaltventil.
	   Jeder Eingriff des einen Reglers stört die Größe des anderen. *)
	fbTemp(rE := rSetTemp - rTempMix, rKp := 0.2, rTn := 1.0, rMin := 0.0, rMax := rQMax, rTs := rTs);
	rValveHot := fbTemp.rOut;
	fbFlow(rE := rSetFlow - rFlow, rKp := 0.5, rTn := 1.0, rMin := 0.0, rMax := rQMax, rTs := rTs);
	rValveCold := fbFlow.rOut;
END_PROGRAM
`;
const exMimo = {
  id: 'ex2', type: 'st', variant: 'erweitern',
  title: 'Mischwasser: Mehrgrößenregelung mit statischer Entkopplung',
  task: `Eine Mischstation erzeugt aus Warm- und Kaltwasser einen Volumenstrom \`Q\` mit der Temperatur \`T_m\`. Beide Ventile beeinflussen **beide** Regelgrößen:

\`Q = q_w + q_k\`, \`T_m = (q_w · T_w + q_k · T_k) / Q\`

Die vorhandene Lösung mit zwei unabhängigen PI-Reglern (Temperatur → Warmventil, Durchfluss → Kaltventil) koppelt stark: Erhöht der Durchflussregler das Kaltventil, sinkt die Temperatur. Ersetze sie durch eine **Entkopplung**:
1. Zwei Korrekturregler \`fbFlow\` (Kp = 0,5, Tn = 0,5 s, Ausgang ±5 l/min) und \`fbTemp\` (Kp = 0,5, Tn = 1 s, Ausgang ±20 K) auf die Abweichungen von Q und T_m.
2. Entkoppelte Stellgrößen: \`rQCmd = w_Q + fbFlow.rOut\` (0…20 l/min), \`rTCmd = w_T + fbTemp.rOut\` (begrenzt auf T_k…T_w).
3. **Entkopplungsglied** (invertierte Mischungsgleichung mit den Modellwerten T_w = 60 °C, T_k = 10 °C): \`q_w = Q_cmd · (T_cmd − T_k)/(T_w − T_k)\`, \`q_k = Q_cmd − q_w\`, beide auf 0…10 l/min begrenzt.

Die realen Temperaturen weichen vom Modell ab (57 °C bzw. 12 °C) – die Korrekturregler gleichen das aus.

Abnahme: Durchfluss-Sollwertsprung 10 → 16 l/min ändert T_m um höchstens 0,5 K; Temperatur-Sollwertsprung 35 → 30 °C ändert Q um höchstens 0,5 l/min.`,
  hints: [
    'Die Entkopplung macht aus zwei verkoppelten Eingrößenstrecken zwei (nahezu) unabhängige: Q_cmd wirkt nur auf Q, T_cmd nur auf T_m.',
    'Der Sollwert wirkt als Vorsteuerung (w + Korrektur) – die Regler müssen nur die Modellfehler ausgleichen und können deshalb einen kleinen Ausgangsbereich haben.',
    'Achte auf die Begrenzung von T_cmd: Außerhalb von T_k…T_w liefert die Formel negative Ventilöffnungen.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rSetFlow', type: 'REAL', dir: 'in', label: 'Sollwert Durchfluss', widget: 'slider', min: 0, max: 20, init: 10, unit: 'l/min' },
    { name: 'rSetTemp', type: 'REAL', dir: 'in', label: 'Sollwert Mischtemperatur', widget: 'slider', min: 15, max: 55, init: 35, unit: '°C' },
    { name: 'rFlow', type: 'REAL', dir: 'in', label: 'Durchfluss Q', widget: 'value', unit: 'l/min' },
    { name: 'rTempMix', type: 'REAL', dir: 'in', label: 'Mischtemperatur T_m', widget: 'value', init: 10, unit: '°C' },
    { name: 'rValveHot', type: 'REAL', dir: 'out', label: 'Warmwasserventil', widget: 'gauge', min: 0, max: 10, unit: 'l/min' },
    { name: 'rValveCold', type: 'REAL', dir: 'out', label: 'Kaltwasserventil', widget: 'gauge', min: 0, max: 10, unit: 'l/min' }
  ],
  plant: {
    var: 'VAR\n\trQh : REAL;\n\trQc : REAL;\n\trTh : REAL := 57.0;   (* reale Warmwassertemperatur *)\n\trTc : REAL := 12.0;   (* reale Kaltwassertemperatur *)\n\trTm : REAL := 10.0;\n\trTmix : REAL;\n\trTDevMax : REAL;      (* Schleppzeiger |T_m − w_T| *)\n\trQDevMax : REAL;      (* Schleppzeiger |Q − w_Q| *)\nEND_VAR\n',
    code: '(* Ventile als PT1 (0,5 s), Temperaturfühler PT1 (1 s) *)\nrQh := rQh + (rValveHot - rQh) / 0.5 * PLANT_DT;\nrQc := rQc + (rValveCold - rQc) / 0.5 * PLANT_DT;\nrFlow := rQh + rQc;\nIF rFlow > 0.01 THEN rTmix := (rQh * rTh + rQc * rTc) / rFlow; ELSE rTmix := rTm; END_IF\nrTm := rTm + (rTmix - rTm) / 1.0 * PLANT_DT;\nrTempMix := rTm;\nrTDevMax := MAX(rTDevMax, ABS(rTm - rSetTemp));\nrQDevMax := MAX(rQDevMax, ABS(rFlow - rSetFlow));\n'
  },
  files: { main: mStart, var: mVar, typ: '' },
  solution: { main: mSolution, var: mVar, typ: '' },
  tests: [
    { name: 'Beide Sollwerte werden erreicht', steps: [
      { ms: 15000 },
      { expect: 'ABS(rFlow - 10.0) < 0.2 AND ABS(rTempMix - 35.0) < 0.5', msg: 'Nach 15 s müssen Q = 10 l/min und T_m = 35 °C erreicht sein.' }
    ] },
    { name: 'Durchflusssprung 10 → 16 l/min stört die Temperatur kaum', steps: [
      { ms: 20000 }, { set: { rSetFlow: 16.0, rTDevMax: 0.0 } }, { ms: 15000 },
      { expect: 'rTDevMax < 0.5', msg: 'Die Mischtemperatur weicht beim Durchflusswechsel um mehr als 0,5 K ab (Schleppzeiger rTDevMax) – fehlende Entkopplung.' },
      { expect: 'ABS(rFlow - 16.0) < 0.2' }
    ] },
    { name: 'Temperatursprung 35 → 30 °C stört den Durchfluss kaum', steps: [
      { ms: 20000 }, { set: { rSetFlow: 16.0 } }, { ms: 20000 }, { set: { rSetTemp: 30.0, rQDevMax: 0.0 } }, { ms: 15000 },
      { expect: 'rQDevMax < 0.5', msg: 'Der Durchfluss weicht beim Temperaturwechsel um mehr als 0,5 l/min ab (Schleppzeiger rQDevMax).' },
      { expect: 'ABS(rTempMix - 30.0) < 0.5' }
    ] },
    { name: 'Ventile bleiben im Bereich 0…10 l/min', steps: [
      { set: { rSetFlow: 20.0, rSetTemp: 55.0 } },
      { never: 'rValveHot < 0.0 OR rValveHot > 10.0 OR rValveCold < 0.0 OR rValveCold > 10.0', ms: 10000, msg: 'Die Ventilvorgaben müssen auf 0…10 l/min begrenzt sein.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Projekt: Regelgüte-Kennzahlen als wiederverwendbarer Baustein
// ---------------------------------------------------------------------------
const kpiHead = `FUNCTION_BLOCK FB_StepKPI
	VAR_INPUT
		rSetValue : REAL;
		rActValue : REAL;
		rBandPct : REAL;      (* Toleranzband in % der Sprunghöhe *)
		rHoldTime : REAL;     (* Verweildauer im Band bis zur Freigabe in s *)
		rTs : REAL;           (* Abtastzeit in s *)
	END_VAR
	VAR_OUTPUT
		bActive : BOOL;       (* Auswertung läuft *)
		bDone : BOOL;         (* Kennzahlen gültig *)
		rOvershootPct : REAL; (* Überschwingweite in % der Sprunghöhe *)
		rRiseTime : REAL;     (* Anstiegszeit 10 % -> 90 % in s *)
		rSettlingTime : REAL; (* Ausregelzeit: endgültiger Eintritt ins Band in s *)
		rIAE : REAL;          (* Integral |e| dt *)
	END_VAR
	VAR
		rWOld : REAL;
		bInit : BOOL;
		rX0 : REAL;
		rDelta : REAL;
		rTime : REAL;
		rT10 : REAL;
		rT90 : REAL;
		b10 : BOOL;
		b90 : BOOL;
		rPeak : REAL;         (* größte normierte Auslenkung *)
		rNorm : REAL;         (* (x - x0) / Delta *)
		rInBand : REAL;       (* aktuelle Verweildauer im Band *)
		rLastEntry : REAL;    (* Zeitpunkt des letzten Eintritts ins Band *)
	END_VAR
`;
const kpiBody = `	IF NOT bInit THEN
		rWOld := rSetValue;
		bInit := TRUE;
	END_IF

	(* Sollwertsprung erkennen -> Auswertung (neu) starten *)
	IF ABS(rSetValue - rWOld) > 0.001 THEN
		rX0 := rActValue;
		rDelta := rSetValue - rX0;
		rTime := 0.0; rIAE := 0.0; rPeak := 0.0; rInBand := 0.0; rLastEntry := 0.0;
		b10 := FALSE; b90 := FALSE; rT10 := 0.0; rT90 := 0.0;
		rOvershootPct := 0.0; rRiseTime := 0.0; rSettlingTime := 0.0;
		bDone := FALSE;
		bActive := ABS(rDelta) > 0.001;
	END_IF
	rWOld := rSetValue;

	IF bActive THEN
		rTime := rTime + rTs;
		rIAE := rIAE + ABS(rSetValue - rActValue) * rTs;
		(* Normierung macht die Auswertung unabhängig von Richtung und Höhe des Sprungs *)
		rNorm := (rActValue - rX0) / rDelta;
		IF NOT b10 AND (rNorm >= 0.1) THEN rT10 := rTime; b10 := TRUE; END_IF
		IF NOT b90 AND (rNorm >= 0.9) THEN rT90 := rTime; b90 := TRUE; END_IF
		rPeak := MAX(rPeak, rNorm);
		IF ABS(rNorm - 1.0) * 100.0 <= rBandPct THEN
			IF rInBand = 0.0 THEN
				rLastEntry := rTime;
			END_IF
			rInBand := rInBand + rTs;
			IF rInBand >= rHoldTime THEN
				rOvershootPct := MAX(0.0, (rPeak - 1.0) * 100.0);
				rRiseTime := rT90 - rT10;
				rSettlingTime := rLastEntry;
				bDone := TRUE;
				bActive := FALSE;
			END_IF
		ELSE
			rInBand := 0.0;
		END_IF
	END_IF
END_FUNCTION_BLOCK
`;
const kpiStartBody = `	(* Erster Entwurf: misst nur das Maximum über dem Sollwert und gibt nach 10 s "fertig" *)
	IF NOT bInit THEN
		rWOld := rSetValue;
		bInit := TRUE;
	END_IF
	IF ABS(rSetValue - rWOld) > 0.001 THEN
		rTime := 0.0; rPeak := rActValue; bActive := TRUE; bDone := FALSE;
	END_IF
	rWOld := rSetValue;
	IF bActive THEN
		rTime := rTime + rTs;
		rPeak := MAX(rPeak, rActValue);
		IF rTime >= 10.0 THEN
			rOvershootPct := (rPeak - rSetValue) / rSetValue * 100.0;
			(* TODO: Anstiegszeit, Ausregelzeit, IAE, Normierung auf die Sprunghöhe *)
			bDone := TRUE;
			bActive := FALSE;
		END_IF
	END_IF
END_FUNCTION_BLOCK
`;
const kpiProg = `
PROGRAM _CYCLIC
	fbKpi(rSetValue := rSetValue, rActValue := rActValue, rBandPct := rBand, rHoldTime := 5.0, rTs := 0.01);
	bDone := fbKpi.bDone;
	rOvershoot := fbKpi.rOvershootPct;
	rRise := fbKpi.rRiseTime;
	rSettle := fbKpi.rSettlingTime;
	rIAE := fbKpi.rIAE;
END_PROGRAM
`;
const kpiVar = 'VAR\n\tfbKpi : FB_StepKPI;\nEND_VAR\n';
const exKpi = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'FB_StepKPI: Regelgüte eines Sollwertsprungs automatisch bewerten',
  task: `Für die Abnahme von Regelkreisen und für die Überwachung im Betrieb (Regelkreis-Monitoring) sollen die **Gütekennzahlen** einer Sprungantwort automatisch berechnet werden. Der Baustein \`FB_StepKPI\` startet bei jedem Sollwertsprung eine Auswertung. Der erste Entwurf misst nur das Maximum und meldet nach starren 10 s „fertig“ – er rechnet bei Sprüngen nach unten falsch und kennt keine Zeiten.

Implementiere die Auswertung **normiert auf die Sprunghöhe** (\`x0\` = Istwert beim Sprung, \`Δ = w − x0\`, \`n = (x − x0)/Δ\`):
- **Überschwingweite** \`rOvershootPct = max(0, (n_max − 1) · 100)\`.
- **Anstiegszeit** \`rRiseTime\` = Zeit von n = 0,1 bis n = 0,9.
- **Ausregelzeit** \`rSettlingTime\` = Zeitpunkt (ab Sprung) des **letzten** Eintritts in das Band |n − 1| ≤ \`rBandPct\`/100.
- **IAE** = Σ |w − x| · Ts ab dem Sprung.
- \`bDone\` (und alle Kennzahlen) erst, wenn der Istwert **\`rHoldTime\` = 5 s** ununterbrochen im Band geblieben ist; dann \`bActive\` = FALSE.
- Ohne Sprung (oder bei |Δ| ≤ 0,001) bleibt \`bDone\` FALSE.

Die Anlagen-Simulation bildet einen geschlossenen Regelkreis 2. Ordnung nach (ω₀ = 1 1/s, Dämpfung ζ = \`rZeta\` = 0,5).`,
  hints: [
    'Durch die Normierung auf Δ funktionieren alle Kennzahlen für Sprünge nach oben und unten und für jede Sprunghöhe.',
    'Ausregelzeit: Merke dir beim Eintritt ins Band den Zeitpunkt; verlässt der Istwert das Band wieder, setze die Verweildauer zurück. Der letzte Eintritt vor Ablauf der Verweildauer ist die Ausregelzeit.',
    'Zur Kontrolle: Bei ζ = 0,5 beträgt die Überschwingweite theoretisch e^(−πζ/√(1−ζ²)) ≈ 16,3 %, die Anstiegszeit ca. 1,64 s.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rSetValue', type: 'REAL', dir: 'in', label: 'Sollwert w', widget: 'slider', min: -20, max: 20, init: 0 },
    { name: 'rBand', type: 'REAL', dir: 'in', label: 'Toleranzband', widget: 'slider', min: 1, max: 10, init: 2, unit: '%' },
    { name: 'rActValue', type: 'REAL', dir: 'in', label: 'Istwert x', widget: 'value' },
    { name: 'bDone', type: 'BOOL', dir: 'out', label: 'Kennzahlen gültig', widget: 'led' },
    { name: 'rOvershoot', type: 'REAL', dir: 'out', label: 'Überschwingweite', widget: 'value', unit: '%' },
    { name: 'rRise', type: 'REAL', dir: 'out', label: 'Anstiegszeit', widget: 'value', unit: 's' },
    { name: 'rSettle', type: 'REAL', dir: 'out', label: 'Ausregelzeit', widget: 'value', unit: 's' },
    { name: 'rIAE', type: 'REAL', dir: 'out', label: 'IAE', widget: 'value' }
  ],
  plant: {
    var: 'VAR\n\trX : REAL;\n\trV : REAL;\n\trOmega : REAL := 1.0;\n\trZeta : REAL := 0.5;\nEND_VAR\n',
    code: '(* geschlossener Regelkreis als PT2: x\'\' = ω²(w − x) − 2ζω·x\' *)\nrV := rV + (rOmega * rOmega * (rSetValue - rX) - 2.0 * rZeta * rOmega * rV) * PLANT_DT;\nrX := rX + rV * PLANT_DT;\nrActValue := rX;\n'
  },
  files: { main: kpiHead + kpiStartBody + kpiProg, var: kpiVar, typ: '' },
  solution: { main: kpiHead + kpiBody + kpiProg, var: kpiVar, typ: '' },
  tests: [
    { name: 'Sprung 0 → 10: Überschwingweite und Anstiegszeit', steps: [
      { ms: 1000 }, { set: { rSetValue: 10.0 } },
      { until: 'bDone', maxMs: 20000, msg: 'bDone wird nicht gesetzt.' },
      { expect: 'ABS(rOvershoot - 16.2) < 0.5', msg: 'Die Überschwingweite muss ca. 16,2 % betragen (normiert auf die Sprunghöhe).' },
      { expect: 'ABS(rRise - 1.63) < 0.05', msg: 'Die Anstiegszeit (10 % → 90 %) muss ca. 1,63 s betragen.' }
    ] },
    { name: 'Sprung 0 → 10: Ausregelzeit (2 %) und IAE', steps: [
      { ms: 1000 }, { set: { rSetValue: 10.0 } },
      { until: 'bDone', maxMs: 20000 },
      { expect: 'ABS(rSettle - 8.04) < 0.15', msg: 'Die Ausregelzeit (letzter Eintritt ins 2-%-Band) muss ca. 8,0 s betragen.' },
      { expect: 'ABS(rIAE - 16.95) < 0.3', msg: 'Das IAE muss ca. 16,95 betragen.' }
    ] },
    { name: 'Sprung nach unten 10 → 4 wird richtig bewertet', steps: [
      { set: { rSetValue: 10.0 } }, { ms: 30000 }, { set: { rSetValue: 4.0 } },
      { until: 'bDone', maxMs: 20000 },
      { expect: 'ABS(rOvershoot - 16.2) < 0.5 AND ABS(rRise - 1.63) < 0.05', msg: 'Bei Sprüngen nach unten müssen die Kennzahlen gleich sein (lineares System).' },
      { expect: 'ABS(rIAE - 10.17) < 0.3', msg: 'Das IAE skaliert mit der Sprunghöhe (6 statt 10).' }
    ] },
    { name: 'Breiteres Toleranzband (5 %) verkürzt die Ausregelzeit', steps: [
      { set: { rBand: 5.0 } }, { ms: 1000 }, { set: { rSetValue: 10.0 } },
      { until: 'bDone', maxMs: 20000 },
      { expect: 'ABS(rSettle - 5.28) < 0.15', msg: 'Mit 5-%-Band muss die Ausregelzeit ca. 5,3 s betragen.' }
    ] },
    { name: 'Aperiodischer Kreis (ζ = 1): kein Überschwingen', steps: [
      { set: { rZeta: 1.0 } }, { ms: 1000 }, { set: { rSetValue: 10.0 } },
      { until: 'bDone', maxMs: 20000 },
      { expect: 'rOvershoot = 0.0 AND ABS(rRise - 3.37) < 0.05', msg: 'Ohne Überschwingen muss die Überschwingweite 0 % sein; Anstiegszeit ca. 3,37 s.' }
    ] },
    { name: 'Ohne Sollwertsprung keine Bewertung', steps: [
      { ms: 15000 },
      { expect: 'NOT bDone AND rIAE = 0.0', msg: 'Ohne Sprung darf keine Auswertung starten.' }
    ] }
  ]
};

module.exports = [
  // =========================================================================
  {
    id: 'regelung-6-simulation', level: 6, kind: 'lektion',
    title: 'Streckensimulation in ST und virtuelle Inbetriebnahme',
    summary: 'Modellbildung, Diskretisierung und numerische Stabilität: eine eigene Bibliothek von Streckenmodellen für Software-in-the-Loop-Tests.',
    minutes: 180,
    req: ['regelung-5-identifikation'],
    briefing: 'Wer Regelungssoftware erst an der realen Maschine testet, testet zu spät und zu teuer. Mit Streckenmodellen in ST läuft dieselbe Applikation unter ARsim gegen eine simulierte Anlage – die Grundlage für virtuelle Inbetriebnahme, automatisierte Regressionstests und Schulung. In diesem Modul lernst du, physikalische Zusammenhänge (Bilanzgleichungen) in Differenzengleichungen zu übersetzen, die richtige Diskretisierung zu wählen, numerische Instabilität zu vermeiden und Modelle als wiederverwendbare, getestete Bibliothek bereitzustellen.',
    practice: 'Simulationsbausteine laufen in einer eigenen Task, die nur in der Simulation aktiv ist, und werden über eine Simulationsschicht zwischen I/O-Mapping und Applikation geschaltet. Die Übungen dieser Plattform funktionieren genauso: Die Anlagen-Simulation läuft vor deinem Programm im selben Zyklus.',
    transfer: {
      tia: 'Siemens setzt für virtuelle Inbetriebnahme PLCSIM Advanced mit SIMIT ein; einfache Modelle werden auch in SCL programmiert.',
      codesys: 'In TwinCAT laufen Modelle als SPS-Programm oder über TE1111 (Simulink-Module); in CODESYS als Simulationsprogramm im Simulationsmodus.'
    },
    objectives: [
      {
        id: 'o1', title: 'Leite ein Streckenmodell aus einer Bilanzgleichung her',
        guide: {
          intro: 'Fast jedes verfahrenstechnische Modell entsteht aus Massen-, Energie- oder Impulsbilanzen.',
          steps: [
            'Formuliere die Bilanz: Änderung des Speichers = Zufluss − Abfluss (z. B. A · dh/dt = q_zu − K·√h).',
            'Identifiziere Zustandsgrößen (Speicher: Füllhöhe, Temperatur, Geschwindigkeit) und Parameter.',
            'Lies im Skript von Diehl (Freiburg) Kap. 2 zur Modellierung dynamischer Systeme mit gewöhnlichen Differentialgleichungen.',
            'Linearisiere ein nichtlineares Modell um einen Arbeitspunkt und bestimme die lokale Zeitkonstante (Behälter: τ = 2A√h₀/K).'
          ],
          done: 'Erledigt, wenn du für Behälter, Heizzone und Schlitten jeweils Bilanzgleichung, Zustände und Parameter aufgeschrieben hast.',
          tip: 'Ein einfaches Modell mit richtigen Zeitkonstanten ist für Regleroptimierung wertvoller als ein detailliertes Modell mit unbekannten Parametern.'
        }
      },
      {
        id: 'o2', title: 'Diskretisiere das Modell numerisch stabil',
        guide: {
          intro: 'Die SPS integriert mit fester Schrittweite – die Wahl des Verfahrens entscheidet über Genauigkeit und Stabilität.',
          steps: [
            'Euler-vorwärts: x(k+1) = x(k) + Ts · f(x(k), u(k)). Stabil für PT1 nur bei Ts < 2T.',
            'Euler-rückwärts für PT1: x(k+1) = x(k) + (K·u − x(k)) · Ts/(T + Ts) – unbedingt stabil.',
            'Prüfe die Schrittweite: Ts ≤ T_min/10 der kleinsten relevanten Zeitkonstante; sonst Simulations-Task schneller takten oder Unterabtastung (mehrere Schritte pro Zyklus).',
            'Vergleiche deine Lösung mit **MTBasicsPT1**, **MTBasicsTimeDelay** und **MTBasicsTransferFcn** (Anwendungsfall „Simulation einer Regelstrecke“).'
          ],
          code: { lang: 'st', text: '(* PT1, Rückwärts-Euler *)\nrOut := rOut + (rKs * rIn - rOut) * rTs / (rT + rTs);' },
          done: 'Erledigt, wenn deine Modelle für alle zulässigen Parameter (auch T = 0) stabil laufen und gegen analytische Werte geprüft sind.',
          tip: 'Teste Modelle immer gegen eine bekannte analytische Lösung (63,2 % nach T, stationäre Werte). So findest du Vorzeichen- und Einheitenfehler sofort.',
          link: { label: 'B&R Help: Anwendungsfall Simulation einer Regelstrecke', url: url.mtUseCase1 }
        }
      },
      {
        id: 'o3', title: 'Bilde Totzeiten mit einem Ringpuffer nach',
        guide: {
          intro: 'Eine Totzeit verzögert ein Signal um eine feste Zeit, ohne es zu verändern – in der SPS ein Ringpuffer.',
          steps: [
            'Lege einen Puffer an, der die maximale Totzeit / Ts Werte aufnehmen kann.',
            'Schreibe in jedem Zyklus an den Schreibindex und lies an Schreibindex − Verzögerung (modulo Puffergröße).',
            'Begrenze die Verzögerung auf die Puffergröße und prüfe den Grenzfall Totzeit 0.',
            'Vergleiche mit **MTBasicsTimeDelay**: DelayTime sollte ein ganzzahliges Vielfaches der Taskzykluszeit sein.'
          ],
          done: 'Erledigt, wenn dein Totzeitbaustein einen Sprung um exakt die eingestellte Zeit verzögert.',
          tip: 'Bei variabler Totzeit (z. B. Förderstrecke mit variabler Geschwindigkeit) wird die Verzögerung über den zurückgelegten Weg statt über die Zeit berechnet.',
          link: { label: 'B&R Help: MTBasicsTimeDelay', url: url.mtbasicsTimeDelay }
        }
      },
      {
        id: 'o4', title: 'Integriere die Simulation sauber in das AS6-Projekt',
        guide: {
          intro: 'Simulation darf die Applikation nicht verändern – sie ersetzt nur die I/O-Ebene.',
          steps: [
            'Lege die Simulationsprogramme in eine eigene Taskklasse und aktiviere sie nur in der Simulations-Konfiguration (eigene Configuration in der Configuration View).',
            'Schalte zwischen realen und simulierten Eingängen in einer Schicht zwischen I/O-Mapping und Applikation um – nie im Applikationscode selbst.',
            'Schreibe für jedes Modell Testfälle (wie in den Übungen) und lass sie bei jedem Build automatisiert laufen.',
            'Dokumentiere Modellparameter und ihre Herkunft (Datenblatt, Identifikation) in der Bibliothek.'
          ],
          done: 'Erledigt, wenn du eine Projektstruktur mit getrennter Simulationskonfiguration skizziert und deine Modellbibliothek getestet hast.',
          tip: 'Mit einer zweiten Configuration (z. B. „Simulation“ für ARsim) bleibt die Hardware-Configuration unverändert – ein Wechsel ist ein Klick, kein Code-Umbau.',
          link: { label: 'B&R Help: mapp Control Tools – Getting started (Prozesssimulation)', url: url.mtGettingStarted }
        }
      }
    ],
    videos: [
      vid('buchholzSimOpt', 'Regleroptimierung mit Simulation – Motivation und Vorgehen für Modell-basierte Tests.'),
      vid('buchholzTotzeit', 'Totzeitglied: Verhalten und Bedeutung für die Simulation.'),
      vid('douglasDiscretize', 'Diskretisierungsverfahren im Vergleich – Grundlage für numerisch stabile Modelle.')
    ],
    readings: [
      R.freiburgSR('Kap. 2 „Modellierung dynamischer Systeme“ mit gewöhnlichen Differentialgleichungen, Einheiten und Skalierung.', 45, 'Kap. 2'),
      R.br('Anwendungsfall 1: Simulation einer Regelstrecke', url.mtUseCase1, 'Zeigt, wie eine Temperaturstrecke mit MTBasicsPT2 und MTBasicsTimeDelay nachgebildet wird.', 10),
      R.tubsGdR('Kap. 3 (Beschreibung im Zeitbereich, Speicher als Zustandsgrößen, Linearisierung um den Arbeitspunkt).', 35, 'Kap. 3')
    ],
    quiz: [
      { type: 'single', q: 'Welche Diskretisierung eines PT1-Modells ist für jede Schrittweite stabil?',
        options: ['Euler-vorwärts x += (K·u − x)·Ts/T', 'Euler-rückwärts x += (K·u − x)·Ts/(T + Ts)', 'Beide nur bei Ts < T', 'Keine'],
        correct: 1, explain: 'Die Rückwärts-Form hat einen Faktor Ts/(T + Ts) < 1 und überschwingt nie. Euler-vorwärts wird bei Ts > 2T instabil.' },
      { type: 'numeric', q: 'Ein Behälter mit freiem Auslauf: q_ab = {K} · √h. Welche Füllhöhe h stellt sich bei einem Zufluss von {q} ein?',
        params: { K: [0.2, 1, 0.1], q: [0.5, 3, 0.5] }, formula: '(q / K) * (q / K)', unit: 'm', tol: 0.02,
        explain: 'Stationär: q_zu = K · √h ⇒ h = (q/K)².' },
      { type: 'numeric', q: 'Eine Totzeit von {Tt} s soll in einer Taskklasse mit {Ts} ms nachgebildet werden. Wie viele Pufferplätze werden mindestens benötigt?',
        params: { Tt: [0.5, 10, 0.5], Ts: [2, 20, 2] }, formula: 'Tt * 1000 / Ts', unit: 'Werte', tol: 0.01,
        explain: 'Anzahl = Tt / Ts (plus ggf. einen Platz für den aktuellen Wert).' }
    ],
    exam: [
      { type: 'single', q: 'Wo wird bei einer sauberen Architektur zwischen realen und simulierten Signalen umgeschaltet?',
        options: ['Direkt im Regelungscode mit IF bSimulation', 'In einer eigenen Schicht zwischen I/O-Mapping und Applikation', 'Im HMI', 'Gar nicht, man ändert das I/O-Mapping von Hand'],
        correct: 1, explain: 'Die Applikation bleibt unverändert und damit testbar; die Simulationsschicht ersetzt nur die Signalquellen.' },
      { type: 'numeric', q: 'Euler-vorwärts für ein PT1 ist stabil für Ts < 2T. Wie groß darf Ts bei T = {T} ms höchstens sein?',
        params: { T: [1, 50, 1] }, formula: '2 * T', unit: 'ms', tol: 0.01,
        explain: 'Der Faktor 1 − Ts/T muss betragsmäßig < 1 sein ⇒ Ts < 2T. Für Genauigkeit gilt zusätzlich Ts ≪ T.' },
      { type: 'multi', q: 'Welche B&R-Bausteine eignen sich zur Streckensimulation?',
        options: ['MTBasicsPT1', 'MTBasicsTimeDelay', 'MTBasicsTransferFcn', 'MTBasicsPWM'],
        correct: [0, 1, 2], explain: 'MTBasicsPWM ist ein Modulator für Stellsignale, kein Streckenmodell.' }
    ],
    exercises: [exSim]
  },
  // =========================================================================
  {
    id: 'regelung-6-zustandsregelung', level: 6, kind: 'lektion',
    title: 'Zustandsregelung, modellbasierte Regelung und Mehrgrößensysteme',
    summary: 'Überblick über Zustandsraum, Polvorgabe, Beobachter, Smith-Prädiktor und MPC sowie Entkopplung verkoppelter Regelkreise.',
    minutes: 210,
    req: ['regelung-6-simulation'],
    briefing: 'PID-Regler stoßen an Grenzen, wenn Strecken stark schwingfähig sind, lange Totzeiten haben oder mehrere Größen sich gegenseitig beeinflussen. Zustandsregler führen alle Zustände (z. B. Position und Geschwindigkeit) zurück und erlauben, die Dynamik des geschlossenen Kreises gezielt vorzugeben. Nicht messbare Zustände schätzt ein Beobachter. Modellbasierte Verfahren wie Smith-Prädiktor oder Model Predictive Control nutzen ein Streckenmodell direkt im Regler. Bei Mehrgrößensystemen hilft Entkopplung, die Wechselwirkungen aufzulösen. Dieses Modul gibt dir den Überblick, um diese Verfahren einzuordnen, mit Spezialisten zu sprechen und einfache Varianten selbst umzusetzen.',
    practice: 'Antriebsregler arbeiten intern mit Beobachtern (z. B. Drehzahl- und Lastmomentbeobachter), Krane und Bahnführungen mit Zustandsreglern (mapp Crane, mapp Web Handling), Temperaturzonen mit modellbasierten Filtern (mapp Temperature) – du begegnest diesen Verfahren also ständig, oft gekapselt in mapp-Komponenten.',
    transfer: {
      tia: 'Siemens bietet modellbasierte Verfahren z. B. in PCS 7 (APC-Bibliothek, ModPreCon); in TIA Portal programmierst du Zustandsregler in SCL.',
      codesys: 'TwinCAT unterstützt modellbasierte Regler über die Integration von MATLAB/Simulink-Modellen (TE1400) oder als eigene Implementierung in ST.'
    },
    objectives: [
      {
        id: 'o1', title: 'Beschreibe eine Strecke im Zustandsraum',
        guide: {
          intro: 'Der Zustandsraum beschreibt ein System durch ẋ = A·x + B·u, y = C·x.',
          steps: [
            'Stelle für den Positionierschlitten (m, d) die Matrizen A, B, C auf: x = [Position; Geschwindigkeit].',
            'Lies im Skript der TU Graz Kap. 6.1–6.2 (Prinzip der Eigenwertvorgabe) und im EMDR-Skript Kap. 3 (Steuer- und Beobachtbarkeit).',
            'Prüfe die Steuerbarkeit: Die Matrix [B, A·B] muss vollen Rang haben.',
            'Zeichne das Blockschaltbild der Zustandsraumdarstellung (Integratoren, Rückführungen).'
          ],
          done: 'Erledigt, wenn du A, B, C für den Schlitten aufgestellt und die Steuerbarkeit nachgewiesen hast.',
          tip: 'Zustände sind die „Speicher“ des Systems: Für jede Energieform (Lage, Bewegung, Wärme, Füllstand) gibt es eine Zustandsgröße.'
        }
      },
      {
        id: 'o2', title: 'Entwirf einen Zustandsregler durch Polvorgabe',
        guide: {
          intro: 'Mit u = V·w − K·x werden die Eigenwerte des geschlossenen Kreises frei vorgegeben (bei Steuerbarkeit).',
          steps: [
            'Lege die Wunschpole fest (z. B. reeller Doppelpol bei −2 1/s für aperiodisches Verhalten, Einschwingzeit ca. 3 s).',
            'Stelle das charakteristische Polynom des geschlossenen Kreises auf und vergleiche die Koeffizienten (oder nutze die Formel von Ackermann).',
            'Berechne das Vorfilter V für stationäre Genauigkeit.',
            'Prüfe die Stellgröße: Schnelle Pole erfordern große Kräfte – die Begrenzung muss im Entwurf berücksichtigt werden.'
          ],
          code: { lang: 'st', text: 'rK1 := rMass * rPole * rPole;\nrK2 := -2.0 * rPole * rMass - rDamp;\nrV := rK1;\nrF := rV * rSetPos - rK1 * rPos - rK2 * rVel;' },
          done: 'Erledigt, wenn dein Zustandsregler den Schlitten ohne Überschwingen in ca. 3 s positioniert.',
          tip: 'Ein Zustandsregler ohne Integralanteil ist bei Störkräften nicht stationär genau. Abhilfe: PI-Zustandsregler (zusätzlicher Integratorzustand) oder Störgrößenbeobachter.'
        }
      },
      {
        id: 'o3', title: 'Ordne Beobachter, Smith-Prädiktor und MPC ein',
        guide: {
          intro: 'Modellbasierte Regler nutzen ein internes Streckenmodell, um nicht messbare Größen zu schätzen oder die Zukunft vorherzusagen.',
          steps: [
            'Luenberger-Beobachter: Parallelmodell der Strecke, korrigiert mit L·(y − ŷ). Lies EMDR Kap. 5 bzw. TU Graz Kap. 7.',
            'Smith-Prädiktor: Der Regler arbeitet auf einem totzeitfreien Modell, die Totzeit wird „herausgerechnet“ (EMDR Kap. 1.4).',
            'Model Predictive Control: Optimierung der Stellgrößenfolge über einen Vorhersagehorizont mit Beschränkungen.',
            'Erstelle eine Tabelle: Verfahren, Voraussetzung (Modellgüte), Vorteil, Rechenaufwand, typische B&R-Anwendung.'
          ],
          done: 'Erledigt, wenn du für drei Problemstellungen (lange Totzeit, nicht messbarer Zustand, viele Beschränkungen) das passende Verfahren begründen kannst.',
          tip: 'Modellbasierte Regler sind nur so gut wie ihr Modell. Plane Identifikation und Modellpflege (Verschleiß, Produktwechsel) von Anfang an mit ein.'
        }
      },
      {
        id: 'o4', title: 'Entkopple ein Mehrgrößensystem',
        guide: {
          intro: 'Bei Mehrgrößensystemen wirkt jede Stellgröße auf mehrere Regelgrößen. Unabhängige Regler arbeiten dann gegeneinander.',
          steps: [
            'Stelle die statischen Zusammenhänge auf (Mischung: Q = q_w + q_k, T_m = (q_w·T_w + q_k·T_k)/Q).',
            'Bewerte die Kopplung (z. B. mit dem Relative Gain Array) und wähle die Paarung von Stell- und Regelgrößen.',
            'Invertiere die statische Kennlinie (Entkopplungsglied) und regle auf die entkoppelten Größen.',
            'Prüfe in der Simulation: Ein Sollwertsprung einer Größe darf die andere kaum noch beeinflussen.'
          ],
          done: 'Erledigt, wenn deine Mischstation Durchfluss- und Temperatursprünge nahezu rückwirkungsfrei ausregelt.',
          tip: 'Statische Entkopplung genügt, wenn die Kanäle ähnliche Dynamik haben. Bei sehr unterschiedlichen Zeitkonstanten braucht es dynamische Entkopplung oder einen MIMO-Regler (z. B. MPC).'
        }
      }
    ],
    videos: [
      vid('matlabStateSpace', 'Einführung in Zustandsraumgleichungen mit anschaulichen Beispielen.'),
      vid('matlabPolePlacement', 'Polvorgabe (Full State Feedback) – genau das Verfahren der Übung.'),
      vid('zacherMimo', 'Identifikation, Entkopplung und MIMO-Regelung eines Mehrgrößensystems im Überblick.')
    ],
    readings: [
      R.grazRS('Kap. 6 „Entwurf von Zustandsreglern“ (Eigenwertvorgabe, Ackermann, PI-Zustandsregler) und Kap. 7 „Zustandsbeobachter“.', 60, 'Kap. 6–7'),
      R.tubsEMDR('Kap. 1 (Smith-Prädiktor, modellbasierte Regler), Kap. 4 (Zustandsrückführung für Mehrgrößensysteme), Kap. 5 (Beobachter).', 60, 'Kap. 1, 4, 5')
    ],
    quiz: [
      { type: 'numeric', q: 'Schlitten: m = {m} kg, d = 1 Ns/m. Der geschlossene Kreis soll einen Doppelpol bei −{p} 1/s haben. Wie groß ist k₁ (Positionsrückführung)?',
        params: { m: [1, 10, 1], p: [1, 5, 0.5] }, formula: 'm * p * p', unit: 'N/m', tol: 0.01,
        explain: 'k₁/m = p² ⇒ k₁ = m · p².' },
      { type: 'single', q: 'Wozu dient ein Beobachter in einer Zustandsregelung?',
        options: ['Er ersetzt den Regler', 'Er schätzt nicht messbare Zustände aus Stellgröße und Messgröße mithilfe eines Modells', 'Er filtert nur Rauschen', 'Er erhöht die Abtastzeit'],
        correct: 1, explain: 'Der Luenberger-Beobachter ist ein Parallelmodell mit Korrektur über den Ausgangsfehler.' },
      { type: 'single', q: 'Welches Verfahren ist speziell für Strecken mit großer Totzeit entwickelt worden?',
        options: ['Zweipunktregler', 'Smith-Prädiktor', 'Split-Range', 'Gleitender Mittelwert'],
        correct: 1, explain: 'Der Smith-Prädiktor kompensiert die Totzeit über ein internes Modell, sodass der Regler wie bei einer totzeitfreien Strecke ausgelegt werden kann.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Aussagen zur Polvorgabe sind richtig?',
        options: ['Die Strecke muss steuerbar sein', 'Schnellere Pole erfordern größere Stellgrößen', 'Ohne Integralanteil ist der Kreis bei Störungen nicht stationär genau', 'Die Pole können nur auf der reellen Achse liegen'],
        correct: [0, 1, 2], explain: 'Komplexe Polpaare sind ebenfalls möglich (gedämpfte Schwingung).' },
      { type: 'single', q: 'Was bewirkt eine statische Entkopplung bei der Mischstation?',
        options: ['Sie verdoppelt den Durchfluss', 'Sie rechnet die gewünschten Größen (Q, T) in Ventilstellungen um, sodass jeder Regler nur noch „seine“ Größe beeinflusst', 'Sie ersetzt die Temperaturmessung', 'Sie verhindert Windup'],
        correct: 1, explain: 'Das Entkopplungsglied ist die Inverse der statischen Streckenkennlinie.' },
      { type: 'single', q: 'Was ist das Kennzeichen von Model Predictive Control (MPC)?',
        options: ['Ein fest eingestellter PID-Regler', 'Online-Optimierung der künftigen Stellgrößenfolge über einen Horizont unter Berücksichtigung von Beschränkungen', 'Ein schaltender Regler mit Hysterese', 'Ein Filter für Messwerte'],
        correct: 1, explain: 'MPC löst in jedem Abtastschritt ein Optimierungsproblem und wendet nur die erste Stellgröße an (Receding Horizon).' },
      { type: 'numeric', q: 'Mischung: T_w = 60 °C, T_k = 10 °C. Welcher Warmwasseranteil q_w in l/min ergibt bei Q = {Q} l/min eine Mischtemperatur von {T} °C?',
        params: { Q: [5, 20, 1], T: [15, 55, 5] }, formula: 'Q * (T - 10) / 50', unit: 'l/min', tol: 0.01,
        explain: 'q_w = Q · (T − T_k)/(T_w − T_k).' }
    ],
    exercises: [exState, exMimo]
  },
  // =========================================================================
  {
    id: 'regelung-6-projekt-regelguete', level: 6, kind: 'projekt',
    title: 'Praxisprojekt: Regelgüte messen und Regelkreise überwachen',
    summary: 'Überschwingweite, Anstiegs- und Ausregelzeit sowie Integralkriterien automatisch bestimmen – als Baustein für Abnahme und Regelkreis-Monitoring.',
    minutes: 270,
    req: ['regelung-6-zustandsregelung'],
    briefing: 'Ob ein Regelkreis „gut“ ist, muss messbar sein – für die Abnahme einer Maschine, für den Vergleich von Parametersätzen und für die Überwachung im Betrieb, wenn Verschleiß oder Produktwechsel die Strecke verändern. In diesem Abschlussprojekt definierst du die Gütekennzahlen nach DIN-üblichen Begriffen (Überschwingweite, Anstiegszeit, Ausregelzeit mit Toleranzband) und Integralkriterien (IAE, ISE, ITAE), implementierst sie in einem wiederverwendbaren, richtungsunabhängigen Baustein und entwirfst ein Konzept für das Regelkreis-Monitoring einer Maschine mit vielen Kreisen.',
    practice: 'Bei einer Linie mit 40 Temperaturzonen zeigt ein Monitoring, welche Zone nach einem Werkzeugwechsel schlechter regelt. In der Abnahme dokumentieren die Kennzahlen objektiv, dass die Spezifikation (z. B. Überschwingen < 2 K, Ausregelzeit < 60 s) erfüllt ist.',
    transfer: {
      tia: 'In TIA Portal wertest du Trace-Aufzeichnungen offline aus oder programmierst die Kennzahlen in SCL; Prozessleitsysteme bieten eigene Control-Performance-Monitoring-Werkzeuge.',
      codesys: 'In TwinCAT kann TwinCAT Analytics Kennzahlen aus Prozessdaten berechnen; im Controller selbst programmierst du sie in ST wie hier.'
    },
    objectives: [
      {
        id: 'o1', title: 'Definiere die Gütekennzahlen eindeutig',
        guide: {
          intro: 'Kennzahlen sind nur vergleichbar, wenn ihre Definition (Bezugswert, Toleranzband, Startzeitpunkt) festgelegt ist.',
          steps: [
            'Lies im Skript von Schumacher/Leonhard Kap. 7.3 „Kriterien zur Beurteilung eines Regelkreises“.',
            'Lege fest: Bezug ist die Sprunghöhe Δ; Anstiegszeit 10 → 90 %; Ausregelzeit = letzter Eintritt in das Band ±2 % (oder ±5 %).',
            'Definiere die Integralkriterien IAE = ∫|e|dt, ISE = ∫e²dt und ITAE = ∫t·|e|dt und ihre Wirkung (ISE bestraft große Fehler, ITAE späte Fehler).',
            'Schreibe ein Kennzahlen-Datenblatt mit Formeln, Einheiten und Gültigkeitsbedingungen.'
          ],
          done: 'Erledigt, wenn dein Kennzahlen-Datenblatt alle Definitionen eindeutig festlegt.',
          tip: 'Gib bei jeder Kennzahl das Toleranzband mit an. „Ausregelzeit 8 s“ ohne Band ist wertlos – mit 5 % wären es bei derselben Kurve vielleicht nur 5 s.'
        }
      },
      {
        id: 'o2', title: 'Implementiere FB_StepKPI richtungsunabhängig',
        guide: {
          intro: 'Durch die Normierung auf die Sprunghöhe gelten alle Berechnungen für Sprünge nach oben und unten.',
          steps: [
            'Erkenne den Sollwertsprung und speichere x0 und Δ.',
            'Berechne zyklisch die normierte Größe n = (x − x0)/Δ, die Zeitpunkte für 10 % und 90 %, das Maximum und das IAE.',
            'Überwache das Toleranzband mit Verweildauer: Erst wenn der Istwert die Verweildauer im Band bleibt, sind die Kennzahlen gültig.',
            'Teste mit einem bekannten System 2. Ordnung (ζ = 0,5: Überschwingweite ≈ 16,3 %) und mit einem aperiodischen System.'
          ],
          done: 'Erledigt, wenn FB_StepKPI für Sprünge in beide Richtungen und verschiedene Bänder korrekte Kennzahlen liefert.',
          tip: 'Ein neuer Sollwertsprung während der Auswertung startet die Messung neu – dokumentiere dieses Verhalten, damit niemand halbe Messungen interpretiert.'
        }
      },
      {
        id: 'o3', title: 'Entwirf ein Regelkreis-Monitoring für eine Maschine',
        guide: {
          intro: 'Im Betrieb gibt es selten saubere Sprünge – Monitoring nutzt deshalb auch statistische Kennzahlen.',
          steps: [
            'Ergänze stationäre Kennzahlen: Mittelwert und Standardabweichung der Regelabweichung, Anteil der Zeit in Begrenzung, Anzahl der Schaltspiele.',
            'Prüfe, welche Funktionen die Bibliothek **MTData** (statistische Auswertung) der mapp Control Tools bietet.',
            'Lege Schwellwerte fest, ab denen eine Warnung (mapp AlarmX) ausgegeben wird, z. B. „Zone 12: Zeit in Begrenzung > 30 %“.',
            'Speichere Kennzahlen mit Zeitstempel (z. B. mit mapp Data) für den Langzeitvergleich.'
          ],
          done: 'Erledigt, wenn dein Monitoring-Konzept Kennzahlen, Schwellwerte, Alarmtexte und Datenspeicherung festlegt.',
          tip: 'Ein Regelkreis, der dauernd in der Begrenzung läuft, ist kein Regelkreis mehr. Diese Kennzahl findet mehr Probleme als jede Überschwingmessung.',
          link: { label: 'B&R Help: mapp Control Tools – Core-Bibliotheken (MTData)', url: url.mtCore }
        }
      },
      {
        id: 'o4', title: 'Führe eine dokumentierte Abnahme durch',
        guide: {
          intro: 'Die Abnahme verbindet Spezifikation, Messung und Bewertung.',
          steps: [
            'Wähle einen Regelkreis aus den vorherigen Projekten (Heizzone, Druck, Split-Range) und lege Abnahmekriterien fest.',
            'Führe drei Sprungversuche durch (nach oben, nach unten, mit Störung) und lass FB_StepKPI die Kennzahlen berechnen.',
            'Vergleiche zwei Parametersätze (z. B. CHR Führung vs. Störung) anhand IAE und Ausregelzeit.',
            'Erstelle das Abnahmeprotokoll, committe Baustein, Tests und Protokoll und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn ein Abnahmeprotokoll mit Kriterien, Messwerten und Bewertung für zwei Parametersätze vorliegt.',
          tip: 'Kennzahlen ersetzen nicht den Blick auf die Kurve. Hänge immer einen Trace an – manche Probleme (Grenzzyklen, Rauschen) zeigen nur die Verläufe.',
          link: { label: 'B&R Help: Trace', url: url.trace }
        }
      }
    ],
    videos: [
      vid('buchholzGuete', 'Gütekriterien des Regelkreises: Überschwingweite, Anregel- und Ausregelzeit.'),
      vid('buchholzIntegral', 'Integralkriterien (IAE, ISE, ITAE) und ihre Bedeutung für die Optimierung.'),
      vid('matlabMpc', 'Ausblick: Wann modellprädiktive Regelung sinnvoll ist – mit Gütemaßen als Optimierungsziel.')
    ],
    readings: [
      R.tubsGdR('Kap. 7 „Der Regelkreis“ mit Anforderungen, Kriterien zur Beurteilung und Stabilität.', 40, 'Kap. 7'),
      R.grazRS('Kap. 5 „Frequenzkennlinien-Verfahren“ mit Spezifikation des Wunschverhaltens und Faustformeln (Überschwingen, Anstiegszeit ↔ Phasenreserve, Durchtrittsfrequenz).', 40, 'Kap. 5'),
      R.br('mapp Control Tools – Core-Bibliotheken', url.mtCore, 'Überblick über MTBasics, MTData (Statistik), MTFilter, MTIdentify, MTLinAlg, MTLookUp und MTProfile.', 10)
    ],
    quiz: [
      { type: 'numeric', q: 'Ein Regelkreis 2. Ordnung hat die Dämpfung ζ = {z}. Wie groß ist die Überschwingweite in % (e^(−πζ/√(1−ζ²)) · 100)?',
        params: { z: [0.2, 0.8, 0.1] }, formula: 'exp(-PI * z / sqrt(1 - z * z)) * 100', unit: '%', tol: 0.02,
        explain: 'Die Überschwingweite hängt beim PT2 nur von der Dämpfung ab; ζ = 0,5 ergibt ca. 16,3 %, ζ = 0,7 ca. 4,6 %.' },
      { type: 'single', q: 'Wie ist die Ausregelzeit definiert?',
        options: ['Zeit bis zum ersten Erreichen des Sollwerts', 'Zeit, nach der die Regelgröße das Toleranzband endgültig nicht mehr verlässt', 'Zeit von 10 % bis 90 %', 'Zeit bis zum Maximum'],
        correct: 1, explain: 'Maßgeblich ist der letzte Eintritt in das Toleranzband (z. B. ±2 %).' },
      { type: 'single', q: 'Welches Integralkriterium bestraft besonders Regelabweichungen, die spät nach dem Sprung noch bestehen?',
        options: ['IAE', 'ISE', 'ITAE', 'Keines'],
        correct: 2, explain: 'ITAE gewichtet |e| mit der Zeit t – lange anhaltende Restabweichungen fallen stark ins Gewicht.' }
    ],
    exam: [
      { type: 'single', q: 'Warum werden Kennzahlen auf die Sprunghöhe normiert?',
        options: ['Um Rechenzeit zu sparen', 'Damit sie unabhängig von Richtung und Höhe des Sprungs vergleichbar sind', 'Weil der Sollwert sonst nicht bekannt ist', 'Weil REAL-Werte sonst überlaufen'],
        correct: 1, explain: 'Bei linearen Systemen sind normierte Kennzahlen für alle Sprünge gleich – Abweichungen zeigen Nichtlinearitäten oder Begrenzungen.' },
      { type: 'multi', q: 'Welche Kennzahlen eignen sich für das Monitoring im laufenden Betrieb ohne gezielte Sprünge?',
        options: ['Standardabweichung der Regelabweichung', 'Anteil der Zeit in der Stellgrößenbegrenzung', 'Anzahl der Schaltspiele eines Stellglieds', 'Anstiegszeit 10–90 %'],
        correct: [0, 1, 2], explain: 'Die Anstiegszeit erfordert einen definierten Sollwertsprung.' },
      { type: 'numeric', q: 'Ein Sprung von {a} auf {b} wird ausgewertet; das Maximum der Regelgröße beträgt {c}. Wie groß ist die Überschwingweite in %?',
        params: { a: [0, 20, 5], b: [50, 80, 10], c: [82, 95, 1] }, formula: '(c - b) / (b - a) * 100', unit: '%', tol: 0.01,
        explain: 'Überschwingweite = (x_max − w) / (w − x0) · 100 %.' },
      { type: 'single', q: 'Ein Kreis erreicht 16 % Überschwingen. Welche Maßnahme senkt es typischerweise, ohne die stationäre Genauigkeit zu verlieren?',
        options: ['I-Anteil entfernen', 'Kp verringern bzw. Tn vergrößern oder eine Sollwertrampe/Vorsteuerung verwenden', 'Abtastzeit vergrößern', 'Totzone einführen'],
        correct: 1, explain: 'Weniger aggressive Parameter oder eine geformte Führungsgröße reduzieren das Überschwingen; der I-Anteil sichert die stationäre Genauigkeit.' }
    ],
    exercises: [exKpi],
    proof: true,
    badge: 'Regelgüte-Analyst'
  }
];
