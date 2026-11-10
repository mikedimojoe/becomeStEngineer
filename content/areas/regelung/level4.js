// Regelungstechnik – Level 4 (Stufe Engineer → Prüfung Master)
'use strict';
const { url, R, vid } = require('./sources');

// ---------------------------------------------------------------------------
// Übung: Einstellregeln als wiederverwendbarer Funktionsbaustein
// ---------------------------------------------------------------------------
const tuneFbHead = `FUNCTION_BLOCK FB_TuningRules
	VAR_INPUT
		rKs : REAL;     (* Streckenverstärkung *)
		rTu : REAL;     (* Verzugszeit in s *)
		rTg : REAL;     (* Ausgleichszeit in s *)
		rTsum : REAL;   (* Summenzeitkonstante in s (nur T-Summen-Regel) *)
		nRule : INT;    (* 1..8, siehe Aufgabe *)
	END_VAR
	VAR_OUTPUT
		rKp : REAL;
		rTn : REAL;
		rTv : REAL;
		bValid : BOOL;
		nRating : INT;  (* 1 = gut, 2 = noch gut, 3 = schwer regelbar, 0 = ungültig *)
	END_VAR
	VAR
		rF : REAL;      (* Tg / (Ks * Tu) *)
		rRatio : REAL;  (* Tg / Tu *)
	END_VAR
`;
const tuneSolutionFb = tuneFbHead + `
	rKp := 0.0; rTn := 0.0; rTv := 0.0; bValid := FALSE; nRating := 0;

	IF nRule >= 1 AND nRule <= 6 THEN
		(* Wendetangenten-Kennwerte erforderlich *)
		IF (rKs <= 0.0) OR (rTu <= 0.0) OR (rTg <= 0.0) THEN
			RETURN;
		END_IF
		rF := rTg / (rKs * rTu);
		rRatio := rTg / rTu;
		IF rRatio > 10.0 THEN
			nRating := 1;
		ELSIF rRatio >= 3.0 THEN
			nRating := 2;
		ELSE
			nRating := 3;
		END_IF
	ELSIF nRule = 7 OR nRule = 8 THEN
		IF (rKs <= 0.0) OR (rTsum <= 0.0) THEN
			RETURN;
		END_IF
	ELSE
		RETURN;   (* unbekannte Regel *)
	END_IF

	CASE nRule OF
		1: (* Ziegler-Nichols PI *)
			rKp := 0.9 * rF; rTn := 3.33 * rTu;
		2: (* Ziegler-Nichols PID *)
			rKp := 1.2 * rF; rTn := 2.0 * rTu; rTv := 0.5 * rTu;
		3: (* CHR aperiodisch, Führungsverhalten, PI *)
			rKp := 0.35 * rF; rTn := 1.2 * rTg;
		4: (* CHR aperiodisch, Führungsverhalten, PID *)
			rKp := 0.6 * rF; rTn := rTg; rTv := 0.5 * rTu;
		5: (* CHR aperiodisch, Störverhalten, PI *)
			rKp := 0.6 * rF; rTn := 4.0 * rTu;
		6: (* CHR aperiodisch, Störverhalten, PID *)
			rKp := 0.95 * rF; rTn := 2.4 * rTu; rTv := 0.42 * rTu;
		7: (* T-Summen-Regel PI (normal) *)
			rKp := 0.5 / rKs; rTn := 0.5 * rTsum;
		8: (* T-Summen-Regel PID (normal) *)
			rKp := 1.0 / rKs; rTn := 0.66 * rTsum; rTv := 0.167 * rTsum;
	END_CASE
	bValid := TRUE;
END_FUNCTION_BLOCK
`;
const tuneStartFb = tuneFbHead + `
	(* Bisher nur Ziegler-Nichols PI, ohne Plausibilitätsprüfung *)
	rF := rTg / (rKs * rTu);
	rKp := 0.9 * rF;
	rTn := 3.33 * rTu;
	rTv := 0.0;
	bValid := TRUE;
END_FUNCTION_BLOCK
`;
const tuneProg = `
PROGRAM _CYCLIC
	fbTune(rKs := rKsIn, rTu := rTuIn, rTg := rTgIn, rTsum := rTsumIn, nRule := nRuleIn);
	rKpOut := fbTune.rKp;
	rTnOut := fbTune.rTn;
	rTvOut := fbTune.rTv;
	bValidOut := fbTune.bValid;
	nRatingOut := fbTune.nRating;
END_PROGRAM
`;
const tuneVar = 'VAR\n\tfbTune : FB_TuningRules;\nEND_VAR\n';
const near = (v, x) => `ABS(${v} - ${x}) < ${Math.max(0.01, Math.abs(x) * 0.01).toFixed(3)}`;
const tuneSet = (rule, o) => ({ set: Object.assign({ rKsIn: 2.0, rTuIn: 3.0, rTgIn: 30.0, rTsumIn: 20.0, nRuleIn: rule }, o || {}) });
const exTune = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Einstellregeln als Funktionsbaustein FB_TuningRules',
  task: `Bei der Inbetriebnahme willst du aus den Kennwerten einer Sprungantwort sofort Startwerte für den Regler erhalten. Erweitere den Funktionsbaustein \`FB_TuningRules\` (in AS6 läge die Deklaration in der \`.fun\`-Datei einer eigenen Bibliothek, der Code in einer \`.st\`-Datei).

Eingänge: \`rKs\`, \`rTu\`, \`rTg\`, \`rTsum\`, \`nRule\`. Mit F = Tg / (Ks · Tu):

| nRule | Verfahren | Kp | Tn | Tv |
|---|---|---|---|---|
| 1 | Ziegler-Nichols PI | 0,9 · F | 3,33 · Tu | 0 |
| 2 | Ziegler-Nichols PID | 1,2 · F | 2 · Tu | 0,5 · Tu |
| 3 | CHR aperiodisch, Führung, PI | 0,35 · F | 1,2 · Tg | 0 |
| 4 | CHR aperiodisch, Führung, PID | 0,6 · F | Tg | 0,5 · Tu |
| 5 | CHR aperiodisch, Störung, PI | 0,6 · F | 4 · Tu | 0 |
| 6 | CHR aperiodisch, Störung, PID | 0,95 · F | 2,4 · Tu | 0,42 · Tu |
| 7 | T-Summe PI (normal) | 0,5 / Ks | 0,5 · TΣ | 0 |
| 8 | T-Summe PID (normal) | 1 / Ks | 0,66 · TΣ | 0,167 · TΣ |

Robustheit:
- Regeln 1–6 benötigen Ks, Tu, Tg > 0; Regeln 7–8 benötigen Ks, TΣ > 0. Sonst – und bei unbekanntem \`nRule\` – sind alle Ausgänge 0 und \`bValid\` = FALSE (keine Division durch 0!).
- \`nRating\` (nur Regeln 1–6): Tg/Tu > 10 → 1 (gut regelbar), 3…10 → 2, < 3 → 3 (schwer regelbar); sonst 0.`,
  hints: [
    'Prüfe die Eingänge, bevor du dividierst. Ein früher `RETURN` nach dem Nullsetzen der Ausgänge hält den Code übersichtlich.',
    'Setze zu Beginn jedes Aufrufs alle Ausgänge auf 0 – sonst bleiben Werte einer vorherigen Regel stehen (z. B. Tv bei Wechsel von PID auf PI).',
    'Mit CASE nRule OF … wird die Tabelle direkt lesbar.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rKsIn', type: 'REAL', dir: 'in', label: 'Ks', widget: 'slider', min: 0, max: 5, init: 2 },
    { name: 'rTuIn', type: 'REAL', dir: 'in', label: 'Tu', widget: 'slider', min: 0, max: 20, init: 3, unit: 's' },
    { name: 'rTgIn', type: 'REAL', dir: 'in', label: 'Tg', widget: 'slider', min: 0, max: 200, init: 30, unit: 's' },
    { name: 'rTsumIn', type: 'REAL', dir: 'in', label: 'TΣ', widget: 'slider', min: 0, max: 200, init: 20, unit: 's' },
    { name: 'nRuleIn', type: 'INT', dir: 'in', label: 'Regel 1..8', widget: 'slider', min: 0, max: 9, init: 1 },
    { name: 'rKpOut', type: 'REAL', dir: 'out', label: 'Kp', widget: 'value' },
    { name: 'rTnOut', type: 'REAL', dir: 'out', label: 'Tn', widget: 'value', unit: 's' },
    { name: 'rTvOut', type: 'REAL', dir: 'out', label: 'Tv', widget: 'value', unit: 's' },
    { name: 'bValidOut', type: 'BOOL', dir: 'out', label: 'gültig', widget: 'led' },
    { name: 'nRatingOut', type: 'INT', dir: 'out', label: 'Regelbarkeit', widget: 'value' }
  ],
  files: { main: tuneStartFb + tuneProg, var: tuneVar, typ: '' },
  solution: { main: tuneSolutionFb + tuneProg, var: tuneVar, typ: '' },
  tests: [
    { name: 'Ziegler-Nichols PI und PID', steps: [
      tuneSet(1), { cycles: 1 }, { expect: `${near('rKpOut', 4.5)} AND ${near('rTnOut', 9.99)} AND rTvOut = 0.0 AND bValidOut` },
      tuneSet(2), { cycles: 1 }, { expect: `${near('rKpOut', 6.0)} AND ${near('rTnOut', 6.0)} AND ${near('rTvOut', 1.5)}`, msg: 'ZN PID: Kp = 1,2·F, Tn = 2·Tu, Tv = 0,5·Tu.' }
    ] },
    { name: 'Chien-Hrones-Reswick (Führung und Störung)', steps: [
      tuneSet(3), { cycles: 1 }, { expect: `${near('rKpOut', 1.75)} AND ${near('rTnOut', 36.0)} AND rTvOut = 0.0`, msg: 'CHR Führung PI: Kp = 0,35·F, Tn = 1,2·Tg.' },
      tuneSet(4), { cycles: 1 }, { expect: `${near('rKpOut', 3.0)} AND ${near('rTnOut', 30.0)} AND ${near('rTvOut', 1.5)}`, msg: 'CHR Führung PID: Kp = 0,6·F, Tn = Tg, Tv = 0,5·Tu.' },
      tuneSet(5), { cycles: 1 }, { expect: `${near('rKpOut', 3.0)} AND ${near('rTnOut', 12.0)}`, msg: 'CHR Störung PI: Kp = 0,6·F, Tn = 4·Tu.' },
      tuneSet(6), { cycles: 1 }, { expect: `${near('rKpOut', 4.75)} AND ${near('rTnOut', 7.2)} AND ${near('rTvOut', 1.26)}`, msg: 'CHR Störung PID: Kp = 0,95·F, Tn = 2,4·Tu, Tv = 0,42·Tu.' }
    ] },
    { name: 'T-Summen-Regel PI und PID', steps: [
      tuneSet(7), { cycles: 1 }, { expect: `${near('rKpOut', 0.25)} AND ${near('rTnOut', 10.0)} AND rTvOut = 0.0`, msg: 'T-Summe PI: Kp = 0,5/Ks, Tn = 0,5·TΣ.' },
      tuneSet(8), { cycles: 1 }, { expect: `${near('rKpOut', 0.5)} AND ${near('rTnOut', 13.2)} AND ${near('rTvOut', 3.34)}`, msg: 'T-Summe PID: Kp = 1/Ks, Tn = 0,66·TΣ, Tv = 0,167·TΣ.' }
    ] },
    { name: 'Regelbarkeit aus Tg/Tu', steps: [
      tuneSet(1, { rTuIn: 2.0, rTgIn: 30.0 }), { cycles: 1 }, { expect: 'nRatingOut = 1', msg: 'Tg/Tu = 15 > 10 → nRating = 1.' },
      tuneSet(1, { rTuIn: 5.0, rTgIn: 30.0 }), { cycles: 1 }, { expect: 'nRatingOut = 2', msg: 'Tg/Tu = 6 → nRating = 2.' },
      tuneSet(1, { rTuIn: 12.0, rTgIn: 30.0 }), { cycles: 1 }, { expect: 'nRatingOut = 3', msg: 'Tg/Tu = 2,5 < 3 → nRating = 3.' }
    ] },
    { name: 'Ungültige Eingaben: keine Division durch 0, bValid = FALSE', steps: [
      tuneSet(2, { rTuIn: 0.0 }), { cycles: 1 }, { expect: 'NOT bValidOut AND rKpOut = 0.0 AND rTvOut = 0.0', msg: 'Tu = 0 ist ungültig – alle Ausgänge 0, bValid FALSE.' },
      tuneSet(7, { rKsIn: 0.0 }), { cycles: 1 }, { expect: 'NOT bValidOut AND rKpOut = 0.0', msg: 'Ks = 0 ist ungültig.' },
      tuneSet(9), { cycles: 1 }, { expect: 'NOT bValidOut AND rKpOut = 0.0 AND nRatingOut = 0', msg: 'Unbekannte Regel → ungültig.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Übung: PI-Regler-FB mit Anti-Windup
// ---------------------------------------------------------------------------
const piFbHead = `FUNCTION_BLOCK FB_PI
	VAR_INPUT
		bEnable : BOOL;
		rSetValue : REAL;
		rActValue : REAL;
		rKp : REAL;
		rTn : REAL;      (* Nachstellzeit in s, 0 = kein I-Anteil *)
		rMinOut : REAL;
		rMaxOut : REAL;
		rTs : REAL;      (* Abtastzeit in s *)
	END_VAR
	VAR_OUTPUT
		rOut : REAL;
		bLimited : BOOL; (* Stellgröße in der Begrenzung *)
	END_VAR
	VAR
		rE : REAL;
		rP : REAL;
		rI : REAL;
		rDeltaI : REAL;
		rU : REAL;
	END_VAR
	IF NOT bEnable THEN
		rI := 0.0;
		rOut := 0.0;
		bLimited := FALSE;
		RETURN;
	END_IF
	rE := rSetValue - rActValue;
	rP := rKp * rE;
	IF rTn > 0.0 THEN
		rDeltaI := rKp / rTn * rE * rTs;
	ELSE
		rDeltaI := 0.0;
	END_IF
	rU := rP + rI + rDeltaI;
`;
const piFbTail = `	rU := rP + rI;
	bLimited := (rU > rMaxOut) OR (rU < rMinOut);
	rOut := LIMIT(rMinOut, rU, rMaxOut);
END_FUNCTION_BLOCK
`;
const piFbSolution = piFbHead + `	(* Anti-Windup (Clamping): nicht weiter in die Begrenzung hinein integrieren,
	   aus der Begrenzung heraus integrieren ist erlaubt *)
	IF NOT (((rU > rMaxOut) AND (rDeltaI > 0.0)) OR ((rU < rMinOut) AND (rDeltaI < 0.0))) THEN
		rI := rI + rDeltaI;
	END_IF
` + piFbTail;
const piFbStart = piFbHead + `	(* TODO: Anti-Windup – bisher integriert der Regler immer weiter *)
	rI := rI + rDeltaI;
` + piFbTail;
const awProg = `
PROGRAM _CYCLIC
	fbPI(bEnable := diEnable, rSetValue := rSetTemp, rActValue := rTemp,
		rKp := 12.0, rTn := 10.0, rMinOut := 0.0, rMaxOut := rMaxPower, rTs := 0.01);
	rPower := fbPI.rOut;
	doLimited := fbPI.bLimited;
END_PROGRAM
`;
const awVar = 'VAR\n\tfbPI : FB_PI;\nEND_VAR\n';
const exAW = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'FB_PI mit Anti-Windup und variabler Stellgrößenbegrenzung',
  task: `Ein Trocknungsofen wird mit einem PI-Regler (Kp = 12 %/K, Tn = 10 s) auf 70 °C geregelt. Wird die **Ofentür** geöffnet, reicht die Heizleistung nicht mehr aus (Stellgröße 100 % in der Begrenzung). Der vorhandene \`FB_PI\` integriert in dieser Zeit weiter – nach dem Schließen der Tür schießt die Temperatur weit über den Sollwert (**Windup**). Auch beim Aufheizen schwingt er deutlich über.

Erweitere \`FB_PI\` um ein **Anti-Windup nach dem Clamping-Verfahren**:
- Ist die vorläufige Stellgröße \`rU\` **über** \`rMaxOut\` und würde der I-Anteil weiter **steigen** (\`rDeltaI > 0\`), wird nicht integriert.
- Ist \`rU\` **unter** \`rMinOut\` und würde der I-Anteil weiter **fallen**, wird ebenfalls nicht integriert.
- In allen anderen Fällen wird integriert (auch aus der Begrenzung **heraus**).

Die Begrenzung \`rMaxOut\` kommt aus \`rMaxPower\` und kann sich zur Laufzeit ändern (z. B. Leistungsreduzierung bei Lastspitzen). Bei \`bEnable\` = FALSE ist der Ausgang 0 und der I-Anteil wird gelöscht (das ist schon umgesetzt).

Abnahme: Aufheizen 20 → 70 °C mit < 2 K Überschwingen, nach 30 s im Band ±1 K; nach 60 s offener Tür höchstens 2 K Überschwingen.`,
  hints: [
    'Die vorläufige Stellgröße `rU := rP + rI + rDeltaI` ist schon berechnet. Entscheide anhand von rU und dem Vorzeichen von rDeltaI, ob `rI := rI + rDeltaI` ausgeführt wird.',
    'Nur „Integrator stoppen, sobald begrenzt“ reicht nicht: Dann kommt der Regler nicht mehr aus der Begrenzung heraus, wenn sich die Regelabweichung umkehrt.',
    'Vergleiche im Trace rPower und die Temperatur mit und ohne Anti-Windup – der Unterschied ist nach dem Schließen der Tür deutlich.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Regler freigeben', widget: 'switch', init: true },
    { name: 'rSetTemp', type: 'REAL', dir: 'in', label: 'Solltemperatur w', widget: 'slider', min: 20, max: 90, init: 70, unit: '°C' },
    { name: 'rMaxPower', type: 'REAL', dir: 'in', label: 'max. Heizleistung', widget: 'slider', min: 0, max: 100, init: 100, unit: '%' },
    { name: 'diDoorOpen', type: 'BOOL', dir: 'in', label: 'Ofentür offen', widget: 'switch' },
    { name: 'rTemp', type: 'REAL', dir: 'in', label: 'Ofentemperatur x', widget: 'gauge', min: 0, max: 120, init: 20, unit: '°C' },
    { name: 'rPower', type: 'REAL', dir: 'out', label: 'Heizleistung y', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'doLimited', type: 'BOOL', dir: 'out', label: 'Stellgröße in Begrenzung', widget: 'led' }
  ],
  scene: { type: 'tank', bind: { temp: 'rTemp' } },
  plant: {
    var: 'VAR\n\trT : REAL := 20.0;\n\trLoss : REAL;\nEND_VAR\n',
    code: '(* PT1: Ks = 1 K/%, T = 20 s; offene Tür = 60 K Wärmeverlust *)\nIF diDoorOpen THEN rLoss := 60.0; ELSE rLoss := 0.0; END_IF\nrT := rT + (1.0 * rPower - rLoss - (rT - 20.0)) / 20.0 * PLANT_DT;\nrTemp := rT;\n'
  },
  files: { main: piFbStart + awProg, var: awVar, typ: '' },
  solution: { main: piFbSolution + awProg, var: awVar, typ: '' },
  tests: [
    { name: 'Aufheizen: Überschwingen < 2 K', steps: [
      { never: 'rTemp > 72.0', ms: 60000, msg: 'Die Temperatur schwingt beim Aufheizen mehr als 2 K über – Windup.' }
    ] },
    { name: 'Einschwingen: nach 30 s im Band ±1 K', steps: [
      { ms: 30000 },
      { never: 'ABS(rTemp - 70.0) > 1.0', ms: 20000, msg: 'Die Temperatur liegt nach 30 s nicht stabil im Band 69…71 °C.' }
    ] },
    { name: 'Tür 60 s offen: danach höchstens 2 K Überschwingen', steps: [
      { ms: 40000 }, { set: { diDoorOpen: true } }, { ms: 60000 },
      { expect: 'doLimited', msg: 'Bei offener Tür muss die Stellgröße in der Begrenzung sein (bLimited).' },
      { set: { diDoorOpen: false } },
      { never: 'rTemp > 72.0', ms: 40000, msg: 'Nach dem Schließen der Tür schießt die Temperatur über – der Integrator wurde aufgezogen.' },
      { expect: 'ABS(rTemp - 70.0) < 1.0', msg: 'Nach 40 s muss die Temperatur wieder im Band ±1 K liegen.' }
    ] },
    { name: 'Variable Begrenzung wird eingehalten', steps: [
      { set: { rMaxPower: 60.0 } },
      { never: 'rPower > 60.0 OR rPower < 0.0', ms: 20000, msg: 'Die Stellgröße muss innerhalb rMinOut…rMaxOut bleiben.' }
    ] },
    { name: 'Sperren löscht den I-Anteil (stoßfreier Neustart)', steps: [
      { ms: 40000 }, { set: { diEnable: false } }, { cycles: 1 },
      { expect: 'rPower = 0.0 AND NOT doLimited', msg: 'Gesperrt: Ausgang 0, keine Begrenzungsmeldung.' },
      { set: { diEnable: true } }, { cycles: 1 },
      { expect: 'rPower < 20.0', msg: 'Nach Freigabe darf kein alter I-Anteil wirken.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Projekt-Übung 1: Messwertfilter (gleitender Mittelwert, PT1)
// ---------------------------------------------------------------------------
const filtFbs = (maBody, pt1Body) => `FUNCTION_BLOCK FB_MovingAverage
	VAR_INPUT
		rIn : REAL;
		nWindow : INT;      (* Fensterlänge 1..100 *)
	END_VAR
	VAR_OUTPUT
		rOut : REAL;
	END_VAR
	VAR
		aBuf : ARRAY[0..99] OF REAL;
		nIdx : INT;         (* nächster Schreibplatz *)
		nCount : INT;       (* Anzahl gültiger Werte im Puffer *)
		nN : INT;
		nUse : INT;
		i : INT;
		rSum : REAL;
	END_VAR
${maBody}END_FUNCTION_BLOCK

FUNCTION_BLOCK FB_PT1Filter
	VAR_INPUT
		rIn : REAL;
		rT : REAL;          (* Filterzeitkonstante in s *)
		rTs : REAL;         (* Abtastzeit in s *)
	END_VAR
	VAR_OUTPUT
		rOut : REAL;
	END_VAR
	VAR
		bInit : BOOL;
	END_VAR
${pt1Body}END_FUNCTION_BLOCK
`;
const maSol = `	nN := LIMIT(1, nWindow, 100);
	aBuf[nIdx] := rIn;
	nIdx := (nIdx + 1) MOD 100;
	IF nCount < 100 THEN
		nCount := nCount + 1;
	END_IF
	nUse := MIN(nN, nCount);
	rSum := 0.0;
	FOR i := 1 TO nUse DO
		rSum := rSum + aBuf[(nIdx - i + 100) MOD 100];
	END_FOR
	rOut := rSum / INT_TO_REAL(nUse);
`;
const pt1Sol = `	IF NOT bInit THEN
		rOut := rIn;
		bInit := TRUE;
	END_IF
	IF (rT + rTs) > 0.0 THEN
		rOut := rOut + (rIn - rOut) * rTs / (rT + rTs);
	ELSE
		rOut := rIn;
	END_IF
`;
const filtProg = `
PROGRAM _CYCLIC
	fbAvg(rIn := rRaw, nWindow := nWindow);
	rFiltMA := fbAvg.rOut;
	fbPT1(rIn := rRaw, rT := rFilterTime, rTs := 0.01);
	rFiltPT1 := fbPT1.rOut;
END_PROGRAM
`;
const filtVar = 'VAR\n\tfbAvg : FB_MovingAverage;\n\tfbPT1 : FB_PT1Filter;\nEND_VAR\n';
const exFilter = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Messwertfilter: gleitender Mittelwert und PT1-Filter',
  task: `Der Durchflussmesser der Anlage liefert ein verrauschtes Signal (Störanteile bei 12,5 Hz und 31 Hz, z. B. durch Pumpenpulsation). Schreibe zwei wiederverwendbare Filterbausteine (in AS6 in einer eigenen Bibliothek; Deklaration in der \`.fun\`-Datei):

**FB_MovingAverage** – gleitender Mittelwert über die letzten \`nWindow\` Werte:
- Ringpuffer \`ARRAY[0..99] OF REAL\`; \`nWindow\` wird auf **1…100** begrenzt (kein Indexfehler bei 0 oder 500!).
- Solange noch nicht genug Werte im Puffer sind, wird über die vorhandenen Werte gemittelt.
- Nach einem Sprung des Eingangs hat der Ausgang nach genau \`nWindow\` Abtastungen den neuen Wert erreicht.

**FB_PT1Filter** – digitaler Tiefpass 1. Ordnung:
- \`rOut := rOut + (rIn − rOut) · Ts / (T + Ts)\`
- Beim ersten Aufruf wird \`rOut\` auf \`rIn\` gesetzt (kein Einschwingen von 0 aus).
- Bei \`T = 0\` gibt der Filter den Eingang unverändert aus.

Das Programm ruft beide Filter mit dem Rohwert \`rRaw\` auf (Fensterlänge \`nWindow\`, Zeitkonstante \`rFilterTime\`).`,
  hints: [
    'Ringpuffer: Schreibe an aBuf[nIdx] und erhöhe nIdx mit MOD 100. Die letzten n Werte liegen dann bei (nIdx − 1 … nIdx − n), jeweils + 100 MOD 100.',
    'INT_TO_REAL(nUse) – eine Ganzzahl muss für die Division nicht explizit gewandelt werden, aber es macht die Absicht deutlich.',
    'Der Faktor Ts/(T + Ts) entspricht der Rückwärts-Euler-Diskretisierung und bleibt auch bei T < Ts stabil.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rRaw', type: 'REAL', dir: 'in', label: 'Durchfluss Rohwert', widget: 'value', unit: 'm³/h' },
    { name: 'nWindow', type: 'INT', dir: 'in', label: 'Fensterlänge Mittelwert', widget: 'slider', min: 0, max: 200, init: 20 },
    { name: 'rFilterTime', type: 'REAL', dir: 'in', label: 'PT1-Zeitkonstante', widget: 'slider', min: 0, max: 2, init: 0.2, unit: 's' },
    { name: 'rFiltMA', type: 'REAL', dir: 'out', label: 'gleitender Mittelwert', widget: 'value', unit: 'm³/h' },
    { name: 'rFiltPT1', type: 'REAL', dir: 'out', label: 'PT1-gefiltert', widget: 'value', unit: 'm³/h' }
  ],
  plant: {
    var: 'VAR\n\trTrue : REAL;   (* wahrer Durchfluss *)\n\trT : REAL;\nEND_VAR\n',
    code: 'rT := rT + PLANT_DT;\n(* deterministisches Störsignal: 12,5 Hz und 31 Hz *)\nrRaw := rTrue + 0.5 * SIN(78.54 * rT) + 0.3 * SIN(194.78 * rT);\n'
  },
  files: { main: filtFbs('\t(* TODO: Ringpuffer und Mittelwert *)\n\trOut := rIn;\n', '\t(* TODO: PT1-Filter *)\n\trOut := rIn;\n') + filtProg, var: filtVar, typ: '' },
  solution: { main: filtFbs(maSol, pt1Sol) + filtProg, var: filtVar, typ: '' },
  tests: [
    { name: 'Gleitender Mittelwert glättet das Rauschen', steps: [
      { set: { rTrue: 5.0 } }, { ms: 1000 },
      { never: 'ABS(rFiltMA - 5.0) > 0.12', ms: 2000, msg: 'Der Mittelwert über 20 Werte muss das Rauschen auf < 0,12 m³/h reduzieren.' }
    ] },
    { name: 'Mittelwert: Sprung ist nach nWindow Abtastungen durchgelaufen', steps: [
      { ms: 1000 }, { set: { rTrue: 10.0 } }, { cycles: 10 },
      { expect: 'rFiltMA > 3.5 AND rFiltMA < 6.5', msg: 'Nach 10 von 20 Abtastungen muss der Mittelwert etwa beim halben Sprung liegen.' },
      { cycles: 12 },
      { expect: 'ABS(rFiltMA - 10.0) < 0.15', msg: 'Nach nWindow Abtastungen muss der Mittelwert den neuen Wert erreicht haben.' }
    ] },
    { name: 'Fensterlänge wird auf 1…100 begrenzt', steps: [
      { set: { rTrue: 5.0, nWindow: 500 } }, { ms: 2000 },
      { expect: 'ABS(rFiltMA - 5.0) < 0.12', msg: 'nWindow = 500 muss auf 100 begrenzt werden.' },
      { set: { nWindow: 0 } }, { cycles: 2 },
      { expect: 'ABS(rFiltMA - rRaw) < 0.001', msg: 'nWindow = 0 → Fensterlänge 1 (Ausgang = aktueller Wert).' }
    ] },
    { name: 'PT1-Filter: 63 % nach einer Zeitkonstante', steps: [
      { ms: 1000 }, { set: { rTrue: 10.0 } }, { ms: 200 },
      { expect: 'rFiltPT1 > 5.9 AND rFiltPT1 < 6.7', msg: 'Nach t = T (0,2 s) muss der PT1-Filter ca. 63 % des Sprungs erreicht haben.' },
      { ms: 1300 },
      { expect: 'ABS(rFiltPT1 - 10.0) < 0.2', msg: 'Nach 1,5 s muss der PT1-Filter eingeschwungen sein.' }
    ] },
    { name: 'PT1-Filter mit T = 0 gibt den Eingang durch', steps: [
      { set: { rTrue: 3.0, rFilterTime: 0.0 } }, { cycles: 3 },
      { expect: 'ABS(rFiltPT1 - rRaw) < 0.001', msg: 'Mit T = 0 muss rOut = rIn sein (ohne Division durch 0).' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Projekt-Übung 2: Druckregelung mit gefiltertem Istwert und Überdruck-Alarm
// ---------------------------------------------------------------------------
const prVar = `VAR CONSTANT
	rTs : REAL := 0.01;
	rKp : REAL := 20.0;      (* %/bar *)
	rTn : REAL := 2.0;       (* s *)
	rTf : REAL := 0.1;       (* Filterzeitkonstante in s *)
	rPMax : REAL := 6.0;     (* Überdruck-Abschaltung in bar *)
END_VAR
VAR
	rPFilt : REAL;
	rE : REAL;
	rP : REAL;
	rI : REAL;
	rDeltaI : REAL;
	rU : REAL;
	bInit : BOOL;
	bAlarm : BOOL;
END_VAR
`;
const prPI = `		rP := rKp * rE;
		rDeltaI := rKp / rTn * rE * rTs;
		rU := rP + rI + rDeltaI;
		IF (rU < 100.0 OR rDeltaI < 0.0) AND (rU > 0.0 OR rDeltaI > 0.0) THEN
			rI := rI + rDeltaI;
		END_IF
		rPump := LIMIT(0.0, rP + rI, 100.0);
`;
const prSolution = `PROGRAM _CYCLIC
	(* 1. Istwert filtern (PT1), beim ersten Zyklus auf den Messwert setzen *)
	IF NOT bInit THEN
		rPFilt := rPressure;
		bInit := TRUE;
	END_IF
	rPFilt := rPFilt + (rPressure - rPFilt) * rTs / (rTf + rTs);
	rPressureFilt := rPFilt;

	(* 2. Überdruck: Alarm speichern, Pumpe aus; Quittieren erst 0,5 bar unter der Grenze *)
	IF rPFilt > rPMax THEN
		bAlarm := TRUE;
	END_IF
	IF diReset AND (rPFilt < rPMax - 0.5) THEN
		bAlarm := FALSE;
	END_IF
	doAlarm := bAlarm;

	(* 3. PI-Regler mit Anti-Windup auf den gefilterten Istwert *)
	IF bAlarm OR NOT diEnable THEN
		rI := 0.0;
		rPump := 0.0;
	ELSE
		rE := rSetPressure - rPFilt;
${prPI}	END_IF
END_PROGRAM
`;
const prStart = `PROGRAM _CYCLIC
	(* Inbetriebnahme-Stand: Regler arbeitet direkt auf dem verrauschten Messwert,
	   die Pumpe "zittert". Überdruck-Überwachung fehlt noch. *)
	rPressureFilt := rPressure; (* TODO: PT1-Filter *)

	(* TODO: Überdruck-Alarm *)

	IF NOT diEnable THEN
		rI := 0.0;
		rPump := 0.0;
	ELSE
		rE := rSetPressure - rPressure;
${prPI}	END_IF
END_PROGRAM
`;
const exPressure = {
  id: 'ex2', type: 'st', variant: 'erweitern',
  title: 'Druckregelung mit Istwertfilter und Überdruck-Alarm',
  task: `Eine drehzahlgeregelte Pumpe hält den Druck in einer Versorgungsleitung (Strecke: PT1, Ks = 0,08 bar/%, T = 2 s). Der PI-Regler (Kp = 20 %/bar, Tn = 2 s, Anti-Windup) arbeitet bisher direkt auf dem **verrauschten** Drucksignal: Die Drehzahlvorgabe an den Umrichter springt jeden Zyklus um mehrere Prozent – das belastet Antrieb und Mechanik.

Erweitere das Programm:
1. **PT1-Filter** für den Istwert mit \`rTf = 0,1 s\`: \`rPFilt := rPFilt + (rPressure − rPFilt) · Ts/(Tf + Ts)\`. Beim ersten Zyklus wird der Filter auf den Messwert gesetzt. Gib den gefilterten Wert auf \`rPressureFilt\` aus und regle auf diesen Wert.
2. **Überdruck-Alarm:** Gefilterter Druck > 6 bar → \`doAlarm\` speichern, Pumpe sofort 0 %, I-Anteil löschen. Quittieren mit \`diReset\` erst unterhalb von 5,5 bar.
3. Die Freigabe \`diEnable\` FALSE schaltet die Pumpe ab (vorhanden).

Abnahme: Solldruck 4 bar nach 8 s im Band ±0,1 bar, Drehzahländerung je Zyklus im Beharrungszustand < 0,6 %, Störgröße „Verbraucher öffnet“ wird ausgeregelt.`,
  hints: [
    'Filterzeit klein gegenüber der Streckenzeitkonstante wählen (hier 0,1 s ≪ 2 s) – sonst bringt der Filter zusätzliche Verzögerung in den Regelkreis und der Regler wird schwingfreudig.',
    'Die Anlagen-Simulation stellt in `rDelta` die Drehzahländerung je Zyklus und in `rPTrue` den wahren Druck bereit – beides siehst du im Watch.',
    'Der Alarm hat Vorrang vor der Regelung: Werte ihn vor dem PI-Regler aus.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Druckregelung EIN', widget: 'switch', init: true },
    { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Alarm quittieren', widget: 'button' },
    { name: 'rSetPressure', type: 'REAL', dir: 'in', label: 'Solldruck w', widget: 'slider', min: 0, max: 6, init: 4, unit: 'bar' },
    { name: 'rPressure', type: 'REAL', dir: 'in', label: 'Druck (Messwert, verrauscht)', widget: 'gauge', min: 0, max: 10, unit: 'bar' },
    { name: 'rPump', type: 'REAL', dir: 'out', label: 'Pumpendrehzahl y', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'rPressureFilt', type: 'REAL', dir: 'out', label: 'Druck gefiltert', widget: 'value', unit: 'bar' },
    { name: 'doAlarm', type: 'BOOL', dir: 'out', label: 'Alarm Überdruck', widget: 'led' }
  ],
  plant: {
    var: 'VAR\n\trPTrue : REAL;      (* wahrer Druck in bar *)\n\trDist : REAL;       (* Verbraucher-Störung in bar *)\n\trT : REAL;\n\trNoise : REAL;\n\trDelta : REAL;      (* Änderung der Pumpendrehzahl je Zyklus *)\n\trPumpPrev : REAL;\nEND_VAR\n',
    code: 'rT := rT + PLANT_DT;\nrDelta := ABS(rPump - rPumpPrev);\nrPumpPrev := rPump;\n(* PT1: Ks = 0,08 bar/%, T = 2 s *)\nrPTrue := rPTrue + (0.08 * rPump - rPTrue - rDist) / 2.0 * PLANT_DT;\nIF rPTrue < 0.0 THEN rPTrue := 0.0; END_IF\n(* deterministisches Messrauschen (12,5 Hz und 31 Hz) *)\nrNoise := 0.08 * SIN(78.54 * rT) + 0.05 * SIN(194.78 * rT);\nrPressure := rPTrue + rNoise;\n'
  },
  files: { main: prStart, var: prVar, typ: '' },
  solution: { main: prSolution, var: prVar, typ: '' },
  tests: [
    { name: 'Solldruck 4 bar: nach 8 s im Band ±0,1 bar', steps: [
      { ms: 8000 },
      { never: 'ABS(rPTrue - 4.0) > 0.1', ms: 10000, msg: 'Der Druck liegt nach 8 s nicht stabil bei 4 bar ± 0,1 bar.' }
    ] },
    { name: 'Ruhige Stellgröße im Beharrungszustand', steps: [
      { ms: 10000 },
      { never: 'rDelta > 0.6', ms: 5000, msg: 'Die Pumpendrehzahl springt um mehr als 0,6 % je Zyklus – Istwert filtern.' }
    ] },
    { name: 'Gefilterter Istwert folgt dem wahren Druck', steps: [
      { ms: 10000 },
      { never: 'ABS(rPressureFilt - rPTrue) > 0.05', ms: 3000, msg: 'rPressureFilt muss das Rauschen auf < 0,05 bar reduzieren.' }
    ] },
    { name: 'Störung „Verbraucher öffnet“ wird ausgeregelt', steps: [
      { ms: 10000 }, { set: { rDist: 1.0 } }, { ms: 10000 },
      { expect: 'ABS(rPTrue - 4.0) < 0.1', msg: 'Nach der Störung muss der Druck wieder bei 4 bar liegen.' }
    ] },
    { name: 'Überdruck: Alarm, Pumpe aus, Quittieren unter 5,5 bar', steps: [
      { ms: 5000 }, { set: { rPTrue: 7.0 } }, { cycles: 20 },
      { expect: 'doAlarm AND rPump = 0.0', msg: 'Über 6 bar muss der Alarm kommen und die Pumpe stehen.' },
      { set: { diReset: true } }, { cycles: 2 },
      { expect: 'doAlarm', msg: 'Über 5,5 bar darf der Alarm nicht quittierbar sein.' },
      { until: 'NOT doAlarm', maxMs: 10000, msg: 'Unter 5,5 bar muss diReset den Alarm quittieren.' }
    ] },
    { name: 'Freigabe AUS stoppt die Pumpe', steps: [
      { ms: 5000 }, { set: { diEnable: false } }, { cycles: 2 },
      { expect: 'rPump = 0.0' }
    ] }
  ]
};

module.exports = [
  // =========================================================================
  {
    id: 'regelung-4-einstellregeln', level: 4, kind: 'lektion',
    title: 'Reglerentwurf mit Einstellregeln',
    summary: 'Ziegler-Nichols, Chien-Hrones-Reswick und T-Summen-Regel: aus Sprungantwort oder Schwingversuch zu belastbaren Startparametern.',
    minutes: 180,
    req: ['regelung-3-projekt-heizzone'],
    briefing: 'Reglerparameter „nach Gefühl“ zu drehen kostet an der Maschine Stunden und endet oft in einem schwingenden oder trägen Kreis. Empirische Einstellregeln liefern aus wenigen Streckenkennwerten (Ks, Tu, Tg bzw. TΣ) oder aus dem Schwingversuch (Kkrit, Tkrit) reproduzierbare Startwerte. Du lernst die drei verbreitetsten Verfahren, ihre Voraussetzungen und typischen Ergebnisse kennen: Ziegler-Nichols ist schnell, aber schwach gedämpft; Chien-Hrones-Reswick unterscheidet Führungs- und Störverhalten; die T-Summen-Regel ist robust gegen verrauschte Messungen. Anschließend kapselst du die Regeln in einen wiederverwendbaren Funktionsbaustein.',
    practice: 'Bei der Inbetriebnahme einer neuen Temperaturzone, eines Druckregelkreises oder einer Tänzerregelung nimmst du eine Sprungantwort auf, wertest sie aus und trägst die berechneten Parameter in MTBasicsPID ein. Das Feintuning erfolgt dann gezielt statt zufällig.',
    transfer: {
      tia: 'PID_Compact bietet eine Vor- und Nachoptimierung, die intern ähnlich arbeitet (Sprung- bzw. Schwingversuch). Die klassischen Regeln brauchst du für eigene Regler (z. B. PID_3Step, eigene FBs) und zur Plausibilisierung.',
      codesys: 'Beckhoff dokumentiert die Einstellregeln in der Controller Toolbox (TF4100); in CODESYS setzt du die Werte manuell in den PID-Baustein.'
    },
    objectives: [
      {
        id: 'o1', title: 'Wende Ziegler-Nichols an (Wendetangente und Schwingversuch)',
        guide: {
          intro: 'Ziegler und Nichols (1942) beschreiben zwei Verfahren: Auswertung der Sprungantwort (offener Kreis) und den Schwingversuch am Stabilitätsrand (geschlossener Kreis).',
          steps: [
            'Lies im Skript der TU Graz Kap. 2.5.1 die Tabellen für Wendetangenten- und Stabilitätsrand-Methode.',
            'Wendetangente: Bestimme Ks, Tu, Tg aus der Sprungantwort und berechne für PI: Kp = 0,9 · Tg/(Ks · Tu), Tn = 3,33 · Tu.',
            'Schwingversuch: Betreibe den Regler als reinen P-Regler (Tn = 0 bzw. sehr groß, Tv = 0) und erhöhe Kp, bis eine Dauerschwingung entsteht. Notiere Kkrit und Periodendauer Tkrit.',
            'Berechne für PI: Kp = 0,45 · Kkrit, Tn = 0,85 · Tkrit (bzw. nach Tabelle des Skripts 0,4 · Kkrit, 0,8 · Tkrit) und vergleiche beide Ergebnisse.',
            'Beurteile mit dem Trace: Ziegler-Nichols liefert typischerweise ein Überschwingen von 20–40 %.'
          ],
          done: 'Erledigt, wenn du für eine Beispielstrecke PI-Parameter nach beiden ZN-Methoden berechnet und ihr Führungsverhalten bewertet hast.',
          tip: 'Den Schwingversuch nur durchführen, wenn die Anlage eine Dauerschwingung verträgt (keine Überdruckgefahr, kein Produkt in Gefahr). An Heizzonen mit langen Zeitkonstanten dauert er außerdem sehr lange.'
        }
      },
      {
        id: 'o2', title: 'Wähle Chien-Hrones-Reswick nach Führungs- oder Störverhalten',
        guide: {
          intro: 'CHR liefert getrennte Parametersätze für gutes Führungsverhalten (Sollwertwechsel) und gutes Störverhalten (Lastwechsel), jeweils aperiodisch oder mit 20 % Überschwingen.',
          steps: [
            'Lies die CHR-Tabellen in der Beckhoff-Dokumentation und im Video von EinfachTechnik nach.',
            'Entscheide für deine Anwendung: Druckregelung einer Versorgungsleitung → Störverhalten; Temperaturprofil einer Presse → Führungsverhalten.',
            'Berechne PI-Parameter aperiodisch Führung (Kp = 0,35 · Tg/(Ks·Tu), Tn = 1,2 · Tg) und Störung (Kp = 0,6 · Tg/(Ks·Tu), Tn = 4 · Tu).',
            'Vergleiche die beiden Parametersätze: Der Störsatz ist „schärfer“ (größeres Kp, kleineres Tn).'
          ],
          done: 'Erledigt, wenn du begründet einen CHR-Parametersatz für eine Druck- und eine Temperaturregelung ausgewählt hast.',
          tip: 'Bei Sollwertsprüngen mit einem Störverhalten-Parametersatz hilft ein Sollwertfilter oder eine Sollwertrampe (z. B. MTBasicsLimiter), um das Überschwingen zu begrenzen.',
          link: { label: 'Beckhoff: Einstellregeln für P-, PI- und PID-Regler', url: url.beckhoffTuning }
        }
      },
      {
        id: 'o3', title: 'Bestimme die Summenzeitkonstante TΣ und wende die T-Summen-Regel an',
        guide: {
          intro: 'Die T-Summen-Regel nach Kuhn nutzt eine Flächenbetrachtung der Sprungantwort und ist dadurch robust gegen Rauschen.',
          steps: [
            'Trage die normierte Sprungantwort auf und suche die Zeit TΣ, bei der die Fläche unter der Kurve links (A1) gleich der Fläche über der Kurve rechts (A2) ist.',
            'Alternativ: Bei einer PTn-Strecke ist TΣ die Summe aller Zeitkonstanten plus Totzeit (z. B. PT2 mit 5 s und 10 s → TΣ = 15 s).',
            'Berechne PI „normal“: Kp = 0,5/Ks, Tn = 0,5 · TΣ bzw. PID: Kp = 1/Ks, Tn = 0,66 · TΣ, Tv = 0,167 · TΣ.',
            'Programmiere die Flächenberechnung als Übung: Summiere während des Sprungversuchs (1 − x/x∞) · Ts auf – das Ergebnis ist TΣ.'
          ],
          code: { lang: 'st', text: '(* nach Messende, rXEnd = Endwert *)\nFOR i := 0 TO nSamples - 1 DO\n\trTsum := rTsum + (1.0 - aX[i] / rXEnd) * rTsample;\nEND_FOR' },
          done: 'Erledigt, wenn du TΣ für eine gemessene Sprungantwort bestimmt und daraus PI- und PID-Parameter berechnet hast.',
          tip: 'Die T-Summen-Regel ist für Strecken mit Ausgleich und S-förmiger Sprungantwort gedacht; bei großer Totzeit (Tt > TΣ/2) wird sie zu aggressiv.'
        }
      },
      {
        id: 'o4', title: 'Kapsle die Einstellregeln in einen Funktionsbaustein',
        guide: {
          intro: 'Wiederverwendbare Bausteine gehören in eine eigene Bibliothek, damit alle Maschinen dieselbe geprüfte Implementierung nutzen.',
          steps: [
            'Lege in der Logical View eine neue Bibliothek an (Add Object › Library, Typ ANSI C oder IEC) – z. B. `BrnCtrlTools`.',
            'Deklariere `FB_TuningRules` in der `.fun`-Datei mit VAR_INPUT (Ks, Tu, Tg, Tsum, Rule) und VAR_OUTPUT (Kp, Tn, Tv, Valid, Rating).',
            'Implementiere die Plausibilitätsprüfung zuerst: Ungültige Eingaben führen zu Valid = FALSE und Nullwerten.',
            'Schreibe für jede Regel einen Testfall mit bekannten Werten (z. B. Ks = 2, Tu = 3 s, Tg = 30 s) und dokumentiere die Sollwerte.'
          ],
          done: 'Erledigt, wenn FB_TuningRules für alle acht Regeln die Tabellenwerte liefert und ungültige Eingaben sicher abfängt.',
          tip: 'Berechnete Parameter niemals automatisch und ungeprüft an einen laufenden Regler übergeben. Zeige sie im HMI an und lass sie vom Inbetriebnehmer bestätigen.'
        }
      }
    ],
    videos: [
      vid('loviscachZN', 'Prof. Loviscach (FH Bielefeld) leitet P- und PI-Einstellung nach Ziegler-Nichols an der Tafel her.'),
      vid('einfachCHR', 'Schritt-für-Schritt-Anwendung der CHR-Tabellen für PI- und PID-Regler.'),
      vid('kahlertTSumme', 'Reglerentwurf nach der T-Summen-Regel mit Simulation – zeigt Flächenmethode und Ergebnis.')
    ],
    readings: [
      R.grazRS('Kap. 2.5 enthält die Tabellen für Wendetangenten-, Stabilitätsrand- und T-Summen-Methode samt Bildern zur Auswertung.', 30, 'Kap. 2.5'),
      R.tubsGdR('Kap. 9.3 „Reglerdimensionierung nach empirischen Einstellregeln“ und 9.4 „Ersatzzeitkonstante“ ordnen die Regeln theoretisch ein.', 40, 'Kap. 9.3–9.4'),
      R.beckhoffTuning('Herstellerdokumentation mit Ziegler-Nichols und Chien-Hrones-Reswick für Führungs- und Störverhalten.', 15)
    ],
    quiz: [
      { type: 'numeric', q: 'Sprungantwort: Ks = {Ks}, Tu = {Tu} s, Tg = {Tg} s. Welches Kp ergibt sich für einen PI-Regler nach Ziegler-Nichols (Wendetangente)?',
        params: { Ks: [0.5, 3, 0.5], Tu: [1, 10, 1], Tg: [10, 100, 10] }, formula: '0.9 * Tg / (Ks * Tu)', unit: '', tol: 0.02,
        explain: 'ZN PI: Kp = 0,9 · Tg/(Ks · Tu), Tn = 3,33 · Tu.' },
      { type: 'single', q: 'Wann wählst du bei Chien-Hrones-Reswick den Parametersatz „Störverhalten“?',
        options: ['Wenn häufig der Sollwert geändert wird', 'Wenn der Sollwert konstant ist und Laständerungen schnell ausgeregelt werden sollen', 'Nur bei Strecken ohne Ausgleich', 'Wenn die Strecke keine Totzeit hat'],
        correct: 1, explain: 'Bei Festwertregelungen (z. B. Netzdruck) dominieren Störungen. Der Störsatz reagiert schärfer auf Lastwechsel.' },
      { type: 'numeric', q: 'Eine PT3-Strecke hat Ks = {Ks} und die Zeitkonstanten {T1} s, {T2} s und 2 s. Welche Nachstellzeit Tn ergibt die T-Summen-Regel für einen PI-Regler (normal)?',
        params: { Ks: [0.5, 2, 0.5], T1: [5, 30, 5], T2: [2, 10, 1] }, formula: '0.5 * (T1 + T2 + 2)', unit: 's', tol: 0.02,
        explain: 'TΣ ist die Summe der Zeitkonstanten (plus Totzeit). PI normal: Tn = 0,5 · TΣ, Kp = 0,5/Ks.' }
    ],
    exam: [
      { type: 'single', q: 'Welche typische Eigenschaft hat ein nach Ziegler-Nichols eingestellter Regelkreis?',
        options: ['Aperiodisch, sehr langsam', 'Schwach gedämpft mit deutlichem Überschwingen', 'Exakt 4,3 % Überschwingen (Betragsoptimum)', 'Instabil'],
        correct: 1, explain: 'ZN zielt auf eine Abklingrate von ca. 1/4 – der Kreis ist schnell, aber schwingfreudig. Feintuning ist meist nötig.' },
      { type: 'numeric', q: 'Beim Schwingversuch schwingt der Kreis bei Kkrit = {K} mit Tkrit = {T} s. Welche Nachstellzeit ergibt sich für einen PID-Regler (Tn = 0,5 · Tkrit)?',
        params: { K: [2, 20, 1], T: [4, 60, 2] }, formula: '0.5 * T', unit: 's', tol: 0.01,
        explain: 'Stabilitätsrand-Methode PID: Kp = 0,6 · Kkrit, Tn = 0,5 · Tkrit, Tv = 0,12 · Tkrit.' },
      { type: 'multi', q: 'Welche Voraussetzungen gelten für die Wendetangenten-Methode?',
        options: ['Strecke mit Ausgleich und S-förmiger Sprungantwort', 'Ein Sprungversuch ist gefahrlos möglich', 'Die Strecke muss schwingfähig sein', 'Ein möglichst rauscharmes Messsignal'],
        correct: [0, 1, 3], explain: 'Die Wendetangente setzt eine aperiodische S-Kurve voraus und ist rauschempfindlich; Schwingfähigkeit braucht nur der Schwingversuch.' },
      { type: 'single', q: 'Eine Strecke hat Tg/Tu = 2. Wie ist sie einzustufen?',
        options: ['gut regelbar', 'noch gut regelbar', 'schwer regelbar', 'nicht beurteilbar'],
        correct: 2, explain: 'Tg/Tu < 3 gilt als schwer regelbar – hier helfen oft Vorsteuerung, Kaskade oder ein modellbasierter Regler (z. B. Smith-Prädiktor).' }
    ],
    exercises: [exTune]
  },
  // =========================================================================
  {
    id: 'regelung-4-antiwindup', level: 4, kind: 'lektion',
    title: 'Stellgrößenbegrenzung, Anti-Windup und Autotuning',
    summary: 'Warum begrenzte Stellgrößen den I-Anteil „aufziehen“, wie Clamping und Back-Calculation helfen und wie MTBasicsStepTuning und MTTemp/mapp Temperature Parameter automatisch ermitteln.',
    minutes: 180,
    req: ['regelung-4-einstellregeln'],
    briefing: 'Jedes reale Stellglied hat Grenzen: Ventile öffnen maximal 100 %, Heizungen liefern eine maximale Leistung, Antriebe haben ein Drehmomentlimit. Läuft der Regler in diese Begrenzung, integriert ein naiver I-Anteil weiter – nach dem Verlassen der Begrenzung entsteht starkes Überschwingen (Windup). Du implementierst Anti-Windup-Verfahren in einem wiederverwendbaren PI-Baustein und lernst, wie mapp Control dieses Problem löst. Außerdem setzt du die Autotuning-Bausteine von B&R ein: MTBasicsStepTuning und MTBasicsOscillationTuning für allgemeine Regelkreise, MTTempTuning bzw. mapp Temperature für Temperaturzonen.',
    practice: 'Typische Windup-Situationen: Ofentür offen, Ventil klemmt, Pumpe läuft gegen geschlossenen Schieber, Heizung mit reduzierter Leistung bei Lastspitzen. Ein Regler ohne Anti-Windup macht daraus nach Störungsende eine zweite Störung.',
    transfer: {
      tia: 'PID_Compact hat ein integriertes Anti-Windup; bei eigenen Reglern in SCL musst du es selbst programmieren. Die Selbstoptimierung entspricht den Tuning-Bausteinen von B&R.',
      codesys: 'FB_CTRL_PI_PID (TwinCAT) besitzt ARW-Eingänge (Anti-Reset-Windup) und Begrenzungen; die Selbsteinstellung ist in TwinCAT Temperature Controller (TF4110) enthalten.'
    },
    objectives: [
      {
        id: 'o1', title: 'Erkläre den Windup-Effekt am Trace',
        guide: {
          intro: 'Ist |u| ≥ u_max, ist der Regelkreis faktisch offen – der Integrator „sieht“ nicht, dass sein Eingriff wirkungslos ist.',
          steps: [
            'Lies im Skript der TU Graz Kap. 2.4.2 „Windup-Effekt und Gegenmaßnahmen“ inklusive Bild 2.8.',
            'Programmiere den Ofen aus der Übung ohne Anti-Windup und zeichne rTemp, rPower und den I-Anteil auf, während die Tür 60 s offen ist.',
            'Markiere im Trace die Phase, in der rPower = 100 % ist, und beobachte, wie der I-Anteil weiter wächst.',
            'Miss das Überschwingen nach dem Schließen der Tür und die Zeit, bis der I-Anteil wieder „abgebaut“ ist.'
          ],
          done: 'Erledigt, wenn du den Windup-Effekt anhand eines eigenen Traces erklären und das Überschwingen beziffern kannst.',
          tip: 'Zeichne bei jeder Regleroptimierung den I-Anteil mit auf. Er zeigt sofort, ob der Regler „arbeitet“ oder in einer Begrenzung hängt.',
          link: { label: 'B&R Help: Trace', url: url.trace }
        }
      },
      {
        id: 'o2', title: 'Implementiere Clamping und Back-Calculation',
        guide: {
          intro: 'Zwei verbreitete Verfahren: Integration bedingt anhalten (Clamping) oder den I-Anteil proportional zur Begrenzungsverletzung zurückführen (Back-Calculation).',
          steps: [
            'Clamping: Integriere nicht, wenn rU > Max und rDeltaI > 0 oder rU < Min und rDeltaI < 0.',
            'Back-Calculation: rI := rI + rDeltaI + (rOut − rU) · rTs / rTt mit Tracking-Zeitkonstante Tt (z. B. Tt = √(Tn · Tv) oder Tt ≈ Tn).',
            'Teste beide Verfahren an derselben Strecke und vergleiche Überschwingen und Einschwingzeit nach Störungsende.',
            'Prüfe auch die Begrenzung nach unten (Kühlung, Min-Grenze > 0 % z. B. bei Mindestdrehzahl einer Pumpe).'
          ],
          code: { lang: 'st', text: '(* Back-Calculation *)\nrU := rP + rI;\nrOut := LIMIT(rMinOut, rU, rMaxOut);\nrI := rI + rKp / rTn * rE * rTs + (rOut - rU) * rTs / rTt;' },
          done: 'Erledigt, wenn dein FB_PI nach 60 s Begrenzung höchstens 2 K überschwingt und du beide Verfahren vergleichen kannst.',
          tip: 'MTBasicsPID nutzt ein Clamping-ähnliches Verfahren und stellt über `IntegrationStatus` bzw. `HoldIntegration` die Kopplung für Kaskaden bereit – das brauchst du im Master-Modul.',
          link: { label: 'B&R Help: MTBasicsPID – Funktionsbeschreibung (Anti-Windup)', url: url.mtbasicsPidFunktion }
        }
      },
      {
        id: 'o3', title: 'Begrenze Stellgröße und Stellgeschwindigkeit sinnvoll',
        guide: {
          intro: 'Neben der Amplitudenbegrenzung schützt eine Rampenbegrenzung (Slew Rate) Stellglied und Prozess vor schlagartigen Änderungen.',
          steps: [
            'Lege fest, welche Grenzen physikalisch und welche prozesstechnisch sind (z. B. Ventil 0–100 %, Heizleistung wegen Netzanschluss max. 80 %).',
            'Übergib Min/Max als Eingänge des Reglers (wie MinOut/MaxOut bei MTBasicsPID), damit sie zur Laufzeit verändert werden können.',
            'Setze bei Bedarf eine Rampenbegrenzung mit **MTBasicsLimiter** (MaxPosSlewRate/MaxNegSlewRate) zwischen Regler und Stellglied.',
            'Melde den Zustand „in Begrenzung“ an die übergeordnete Logik (bLimited), z. B. für eine Warnung „Heizleistung reicht nicht“.'
          ],
          done: 'Erledigt, wenn dein Regler variable Grenzen einhält und den Begrenzungszustand als Ausgang meldet.',
          tip: 'Eine Rampenbegrenzung hinter dem Regler ist selbst eine Begrenzung – sie braucht ebenfalls Anti-Windup, sonst zieht der Integrator während der Rampe auf.',
          link: { label: 'B&R Help: MTBasicsLimiter', url: url.mtbasicsLimiter }
        }
      },
      {
        id: 'o4', title: 'Ermittle Parameter mit MTBasicsStepTuning bzw. MTTempTuning',
        guide: {
          intro: 'Die Tuning-Bausteine regen die Strecke gezielt an (Sprung- oder Schwingversuch) und berechnen daraus PID-Parameter.',
          steps: [
            'Lies den Anwendungsfall „PID Regler mit Sprungversuch“ der mapp Control Tools und die Schnittstelle von **MTBasicsStepTuning** (SystemSettlingTime, MaxTuningTime, MinActValue/MaxActValue).',
            'Verschalte MTBasicsStepTuning mit MTBasicsPID: Während des Tunings gibt der Tuning-Baustein die Stellgröße vor; nach `TuningDone` übernimmst du `PIDParameters` mit einer Update-Flanke in den Regler.',
            'Setze MinActValue/MaxActValue als Sicherheitsgrenzen: Verlässt die Regelgröße diesen Bereich, bricht das Tuning ab.',
            'Für Temperaturzonen: Vergleiche mit **MTTempTuning**/**MTTempController** bzw. mapp Temperature (MpTempController), deren Step-Tuning zusätzlich Streckenmodell, Filter- und Profilparameter liefert.',
            'Dokumentiere die ermittelten Parameter und vergleiche sie mit deinen Werten aus Ziegler-Nichols/CHR.'
          ],
          done: 'Erledigt, wenn du ein Tuning in der Simulation durchgeführt, die Parameter übernommen und das Ergebnis mit einer Einstellregel verglichen hast.',
          tip: 'Autotuning funktioniert nur aus einem stabilen Arbeitspunkt heraus. Starte ein Step-Tuning nie, während die Strecke noch einschwingt – die Help von mapp Temperature nennt das ausdrücklich als Voraussetzung.',
          link: { label: 'B&R Help: MTBasicsStepTuning', url: url.mtbasicsStepTuning }
        }
      }
    ],
    videos: [
      vid('alexWindup', 'Deutsche Erklärung des Windup-Effekts und der Gegenmaßnahmen mit Signalverläufen.'),
      vid('matlabWindup', 'Zeigt Clamping und Back-Calculation im direkten Vergleich – genau die beiden Verfahren dieser Lektion.'),
      vid('buchholzStellgr', 'Hochschulvorlesung zu Stellgrößen und ihren Begrenzungen.')
    ],
    readings: [
      R.grazRS('Kap. 2.4.2 beschreibt Windup und die Anti-Windup-Maßnahme mit Tracking-Zeitkonstante Ta inkl. Simulationsbeispiel.', 25, 'Kap. 2.4.2'),
      R.br('Tunen eines unbekannten Temperatursystems mit einem Step-Tuning', url.mtTempStepTuning, 'Anwendungsfall aus mapp Temperature: Voraussetzungen, Ergebnisse und Ablauf eines Step-Tunings.', 20),
      R.br('MTTempTuning', url.mtTempTuning, 'Schnittstelle des vollautomatischen Tunings für Temperaturstrecken der Bibliothek MTTemp.', 15)
    ],
    quiz: [
      { type: 'single', q: 'Was ist die Ursache des Windup-Effekts?',
        options: ['Ein zu großer D-Anteil', 'Der I-Anteil integriert weiter, obwohl die Stellgröße begrenzt ist und keine Wirkung mehr hat', 'Eine zu kleine Zykluszeit', 'Rauschen auf dem Messsignal'],
        correct: 1, explain: 'In der Begrenzung ist der Kreis offen; der aufgezogene Integrator muss erst durch Regelabweichung mit umgekehrtem Vorzeichen abgebaut werden.' },
      { type: 'single', q: 'Welche Clamping-Bedingung ist korrekt, um nur den „falschen“ Integrationsweg zu sperren?',
        options: ['Integriere nie, wenn die Stellgröße begrenzt ist', 'Integriere nicht, wenn u > Max und ΔI > 0 oder u < Min und ΔI < 0', 'Integriere nur, wenn e = 0', 'Setze I bei jeder Begrenzung auf 0'],
        correct: 1, explain: 'Aus der Begrenzung heraus muss der Integrator arbeiten dürfen – sonst kann der Regler nach Vorzeichenwechsel von e nicht reagieren.' },
      { type: 'multi', q: 'Welche Bausteine von B&R ermitteln Reglerparameter automatisch?',
        options: ['MTBasicsStepTuning', 'MTBasicsOscillationTuning', 'MTTempTuning', 'MTBasicsPT1'],
        correct: [0, 1, 2], explain: 'MTBasicsPT1 ist ein Verzögerungsglied (Filter/Simulation), kein Tuning-Baustein.' }
    ],
    exam: [
      { type: 'numeric', q: 'Ein PI-Regler (Kp = {Kp} %/K, Tn = {Tn} s) ohne Anti-Windup steht {t} s in der Begrenzung bei konstanter Regelabweichung e = {E} K. Um wie viel % wächst der I-Anteil in dieser Zeit?',
        params: { Kp: [2, 10, 1], Tn: [5, 60, 5], t: [10, 120, 10], E: [2, 20, 2] }, formula: 'Kp / Tn * E * t', unit: '%', tol: 0.01,
        explain: 'ΔI = Kp/Tn · e · t. Dieser Betrag muss später durch negative Regelabweichung wieder abgebaut werden.' },
      { type: 'single', q: 'Welche Voraussetzung nennt mapp Temperature für ein Step-Tuning?',
        options: ['Die Zone muss bereits auf Solltemperatur sein', 'Das System muss sich in einem stabilen Arbeitspunkt befinden', 'Die Kühlung muss abgeschaltet sein', 'Der D-Anteil muss 0 sein'],
        correct: 1, explain: 'Laut Anwendungsfall muss das System vor dem Tuning beruhigt sein; zudem ist eine Mindesttemperaturdifferenz gefordert.' },
      { type: 'single', q: 'Warum sollte eine Rampenbegrenzung hinter dem Regler mit dem Anti-Windup gekoppelt sein?',
        options: ['Sie erhöht die Abtastzeit', 'Auch sie begrenzt die wirksame Stellgröße; ohne Rückmeldung zieht der Integrator während der Rampe auf', 'Weil MTBasicsLimiter sonst einen Fehler meldet', 'Gar nicht, beides ist unabhängig'],
        correct: 1, explain: 'Jede Begrenzung zwischen Reglerausgang und Strecke wirkt wie eine Sättigung.' },
      { type: 'single', q: 'Welcher MTBasicsPID-Ausgang zeigt den Zustand des Integralanteils (z. B. für Kaskaden-Windup-Schutz)?',
        options: ['TrackingActive', 'IntegrationStatus', 'UpdateDone', 'SystemReference'],
        correct: 1, explain: 'IntegrationStatus des Folgereglers wird mit HoldIntegration des Führungsreglers verbunden.' }
    ],
    exercises: [exAW]
  },
  // =========================================================================
  {
    id: 'regelung-4-projekt-druck', level: 4, kind: 'projekt',
    title: 'Praxisprojekt: Druck- und Durchflussregelung mit Messwertfilterung',
    summary: 'Wiederverwendbare Filterbausteine (gleitender Mittelwert, PT1) und eine Pumpendruckregelung mit gefiltertem Istwert und Überdruck-Alarm.',
    minutes: 240,
    req: ['regelung-4-antiwindup'],
    briefing: 'Druck- und Durchflussregelkreise sind schnell und ihre Messsignale verrauscht: Pumpenpulsation, Turbulenzen und elektromagnetische Einkopplung erzeugen hochfrequente Störanteile. Ein Regler mit hoher Verstärkung gibt dieses Rauschen ungefiltert an Umrichter oder Ventil weiter. In diesem Projekt entwickelst du wiederverwendbare Filterbausteine, bewertest ihren Zielkonflikt zwischen Glättung und Verzögerung und baust eine Druckregelung mit Überdruck-Alarm, wie sie an Kühlmittel-, Hydraulik- oder Wasserversorgungen eingesetzt wird.',
    practice: 'Kühlschmierstoffversorgung einer Werkzeugmaschine, Druckhaltung einer Sprühanlage, Durchflussregelung einer Dosierung: Überall läuft ein schneller PI-Regler mit gefiltertem Istwert und einer Überwachung, die bei Überdruck die Pumpe abschaltet.',
    transfer: {
      tia: 'In TIA Portal filterst du Analogwerte oft schon in der Baugruppenparametrierung (Glättung); zusätzlich programmierst du eigene Filter-FBs in SCL.',
      codesys: 'TwinCAT bietet FB_CTRL_PT1 bzw. Filterbausteine in der Controller Toolbox; Analogklemmen haben eigene Filterstufen.'
    },
    objectives: [
      {
        id: 'o1', title: 'Analysiere das Messsignal und wähle ein Filter',
        guide: {
          intro: 'Bevor du filterst, musst du wissen, welche Frequenzen Nutz- und Störsignal haben.',
          steps: [
            'Zeichne den Rohwert mit dem Trace in der Zykluszeit (10 ms) auf und bestimme die dominante Störfrequenz (Periodendauer ablesen).',
            'Prüfe, ob die Analogbaugruppe eine eigene Filterung (Filterzeit/Mittelwert) hat, und nutze sie zuerst – das entlastet die CPU.',
            'Vergleiche gleitenden Mittelwert (Totzeitverhalten, Nullstellen bei Vielfachen von 1/(N·Ts)) und PT1-Filter (exponentielles Verhalten).',
            'Lies den Anwendungsfall „Filterung eines Störsignals“ der mapp Control Tools: Höhere Filterordnung dämpft besser, verschiebt aber die Phase stärker.'
          ],
          done: 'Erledigt, wenn du Störfrequenz, gewählten Filtertyp und Filterparameter begründet dokumentiert hast.',
          tip: 'Ein gleitender Mittelwert über genau eine Periode der Störung (N·Ts = 1/f) unterdrückt diese Frequenz vollständig – ideal z. B. gegen Netzbrummen.',
          link: { label: 'B&R Help: Anwendungsfall Filterung eines Störsignals', url: url.mtUseCase5 }
        }
      },
      {
        id: 'o2', title: 'Programmiere FB_MovingAverage und FB_PT1Filter',
        guide: {
          intro: 'Beide Filter werden als Funktionsbausteine gekapselt, damit sie in jeder Maschine gleich und getestet verfügbar sind.',
          steps: [
            'Lege einen Ringpuffer `ARRAY[0..99] OF REAL` mit Schreibindex an und begrenze die Fensterlänge mit `LIMIT(1, nWindow, 100)`.',
            'Berechne den Mittelwert über die letzten n Werte; in der Anlaufphase über die vorhandenen Werte.',
            'Implementiere den PT1-Filter mit Ts/(T + Ts) und Initialisierung auf den ersten Eingangswert.',
            'Vergleiche deine Bausteine mit **MTFilterMovingAverage** und **MTBasicsPT1** aus mapp Control (Schnittstelle, Grenzen).'
          ],
          code: { lang: 'st', text: 'aBuf[nIdx] := rIn;\nnIdx := (nIdx + 1) MOD 100;\nFOR i := 1 TO nUse DO\n\trSum := rSum + aBuf[(nIdx - i + 100) MOD 100];\nEND_FOR' },
          done: 'Erledigt, wenn beide Filter die Tests für Glättung, Sprungverhalten und Grenzfälle (nWindow 0/500, T = 0) bestehen.',
          tip: 'Ein inkrementeller Mittelwert (Summe + neu − alt) spart Rechenzeit, sammelt bei REAL aber Rundungsfehler. Bei langen Laufzeiten die Summe periodisch neu berechnen.',
          link: { label: 'B&R Help: MTFilterMovingAverage', url: url.mtFilterMovAvg }
        }
      },
      {
        id: 'o3', title: 'Baue die Druckregelung mit gefiltertem Istwert',
        guide: {
          intro: 'Der Filter liegt im Regelkreis und verändert dessen Dynamik – die Filterzeit muss klein gegenüber der Streckenzeitkonstante sein.',
          steps: [
            'Filtere den Druckistwert mit T_f = 0,1 s und regle auf den gefilterten Wert.',
            'Prüfe im Trace die Drehzahlvorgabe: Die Änderung je Zyklus muss im Beharrungszustand deutlich kleiner sein als ohne Filter.',
            'Erhöhe testweise T_f auf 1 s und beobachte das Überschwingen – der Filter wirkt wie eine zusätzliche Verzögerung.',
            'Für Durchflussregelungen gilt dasselbe Prinzip; dort sind die Strecken meist noch schneller (T < 1 s) und Kp kleiner, Tn kurz.'
          ],
          done: 'Erledigt, wenn die Druckregelung 4 bar ± 0,1 bar hält, die Stellgröße ruhig ist und Störungen ausgeregelt werden.',
          tip: 'Bei Druck- und Durchflussregelungen nie einen D-Anteil auf ein ungefiltertes Signal geben. In der Praxis reicht fast immer ein PI-Regler.'
        }
      },
      {
        id: 'o4', title: 'Sichere die Anlage mit einem Überdruck-Alarm ab',
        guide: {
          intro: 'Der Alarm schützt Leitung und Verbraucher, wenn z. B. ein Absperrventil geschlossen wird.',
          steps: [
            'Werte den Alarm vor dem Regler aus und setze bei Alarm Pumpe und I-Anteil auf 0.',
            'Speichere den Alarm und erlaube das Quittieren erst mit Abstand zur Grenze (Hysterese 0,5 bar).',
            'Melde den Alarm in der Maschine über mapp AlarmX (MpAlarmXSet) mit einem verständlichen Text.',
            'Dokumentiere: Die Software-Abschaltung ersetzt kein Sicherheitsventil – dieses ist mechanisch auszulegen.'
          ],
          done: 'Erledigt, wenn der Alarm bei > 6 bar auslöst, die Pumpe stoppt und erst unter 5,5 bar quittiert werden kann.',
          tip: 'Prüfe Alarme auf dem gefilterten Wert, aber mit kleiner Filterzeit. Sonst löst ein kurzzeitiger Messspike den Alarm aus – oder ein echter Druckanstieg wird zu spät erkannt.'
        }
      }
    ],
    videos: [
      vid('matlabNoise', 'Erklärt, warum Rauschen im Regelkreis problematisch ist und wie Filter (und D-Anteil-Filter) richtig eingesetzt werden.'),
      vid('valoLevel', 'Implementierung einer Füllstandsregelung mit PID in Automation Studio – zeigt Modellierung und Regler im B&R-Umfeld.'),
      vid('brMappData', 'B&R-Tutorial zur Aufzeichnung eines Prozesswerts mit mapp Data – nützlich für die Auswertung von Druckverläufen.')
    ],
    readings: [
      R.br('Anwendungsfall 5: Filterung eines Störsignals', url.mtUseCase5, 'Zeigt Tiefpassfilterung eines überlagerten Signals und den Zielkonflikt Dämpfung vs. Phasenverschiebung.', 10),
      R.br('MTFilterMovingAverage', url.mtFilterMovAvg, 'Schnittstelle des gleitenden Mittelwerts in mapp Control (WindowLength bis 10 000).', 10),
      R.samsonL102('Abschnitt zur P-Regelung am Beispiel einer Füllstandsregelung und zur Reglerauswahl für Druck- und Durchflussstrecken.', 20)
    ],
    quiz: [
      { type: 'numeric', q: 'Ein gleitender Mittelwert soll eine Störung mit {f} Hz vollständig unterdrücken. Die Abtastzeit beträgt 10 ms. Wie viele Werte muss das Fenster enthalten (N · Ts = 1/f)?',
        params: { f: [5, 25, 5] }, formula: '1 / (f * 0.01)', unit: 'Werte', tol: 0.01,
        explain: 'Der Mittelwert über genau eine Periode der Störung ergibt null. N = 1/(f · Ts).' },
      { type: 'single', q: 'Was passiert, wenn du die Filterzeitkonstante des Istwerts in die Größenordnung der Streckenzeitkonstante bringst?',
        options: ['Der Regelkreis wird schneller', 'Der Filter wirkt wie eine zusätzliche Verzögerung; der Kreis wird schwingfreudiger', 'Nichts, Filter beeinflussen den Regelkreis nicht', 'Der I-Anteil wird wirkungslos'],
        correct: 1, explain: 'Der Filter ist Teil der Rückführung. Zusätzliche Phasenverschiebung reduziert die Stabilitätsreserve.' },
      { type: 'numeric', q: 'Ein PT1-Filter (Rückwärts-Euler) hat T = {T} s, Ts = 0,01 s. Wie groß ist der Faktor Ts/(T + Ts)?',
        params: { T: [0.05, 1, 0.05] }, formula: '0.01 / (T + 0.01)', unit: '', tol: 0.01,
        explain: 'y(k) = y(k−1) + Ts/(T + Ts) · (x(k) − y(k−1)). Je größer T, desto kleiner der Faktor und desto stärker die Glättung.' }
    ],
    exam: [
      { type: 'single', q: 'Warum wird ein gleitender Mittelwert über N Werte als „Totzeit-ähnlich“ bezeichnet?',
        options: ['Er gibt den Eingang erst nach N Zyklen aus', 'Seine Sprungantwort ist eine Rampe, die nach N Abtastungen den Endwert erreicht; die mittlere Verzögerung beträgt etwa N·Ts/2', 'Er hat eine unendliche Impulsantwort', 'Er ist instabil'],
        correct: 1, explain: 'Die Sprungantwort steigt linear über N Abtastungen. Die Gruppenlaufzeit beträgt (N−1)/2 · Ts.' },
      { type: 'multi', q: 'Welche Maßnahmen reduzieren Rauschen in einem Druckregelkreis sinnvoll?',
        options: ['Filterung in der Analogbaugruppe aktivieren', 'Kleiner PT1-Filter auf den Istwert', 'D-Anteil erhöhen', 'Messleitung geschirmt und getrennt von Leistungskabeln verlegen'],
        correct: [0, 1, 3], explain: 'Ein größerer D-Anteil verstärkt Rauschen. Die beste Maßnahme ist, Störungen an der Quelle zu vermeiden.' },
      { type: 'single', q: 'Warum wird der I-Anteil beim Überdruck-Alarm gelöscht?',
        options: ['Damit der Alarm schneller quittiert werden kann', 'Damit die Pumpe nach dem Quittieren nicht mit einem alten I-Anteil sofort auf hohe Drehzahl springt', 'Weil MTBasicsPID es verlangt', 'Um Rechenzeit zu sparen'],
        correct: 1, explain: 'Ein definierter Neustart ohne gespeicherten Integrator verhindert einen Druckstoß beim Wiederanlauf.' }
    ],
    exercises: [exFilter, exPressure],
    proof: true,
    badge: 'Druckregelkreis-Inbetriebnehmer'
  }
];
