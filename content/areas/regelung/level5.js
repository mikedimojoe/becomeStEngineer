// Regelungstechnik – Level 5 (Stufe Master → Prüfung Guru)
'use strict';
const { url, R, vid } = require('./sources');

// Wiederverwendbarer PI-Baustein mit Anti-Windup und Halteeingang (aus Level 4 weiterentwickelt)
const FB_PI_HOLD = `FUNCTION_BLOCK FB_PI
	VAR_INPUT
		bEnable : BOOL;
		rSetValue : REAL;
		rActValue : REAL;
		rKp : REAL;
		rTn : REAL;
		rMinOut : REAL;
		rMaxOut : REAL;
		rTs : REAL;
		bHoldI : BOOL;   (* I-Anteil einfrieren (Windup-Schutz in Kaskaden) *)
	END_VAR
	VAR_OUTPUT
		rOut : REAL;
		bLimited : BOOL;
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
	IF NOT bHoldI AND NOT (((rU > rMaxOut) AND (rDeltaI > 0.0)) OR ((rU < rMinOut) AND (rDeltaI < 0.0))) THEN
		rI := rI + rDeltaI;
	END_IF
	rU := rP + rI;
	bLimited := (rU > rMaxOut) OR (rU < rMinOut);
	rOut := LIMIT(rMinOut, rU, rMaxOut);
END_FUNCTION_BLOCK
`;

// ---------------------------------------------------------------------------
// Übung: Kaskadenregelung Mantel/Produkt
// ---------------------------------------------------------------------------
const kVar = `VAR CONSTANT
	rTs : REAL := 0.01;
	rJacketMin : REAL := 20.0;   (* untere Grenze Sollwert Mantel *)
	rJacketMax : REAL := 120.0;  (* Produktschutz: Mantel nie heißer als 120 °C *)
END_VAR
VAR
	fbOuter : FB_PI;   (* Führungsregler (Produkt) *)
	fbInner : FB_PI;   (* Folgeregler (Mantel) *)
END_VAR
`;
const kSolution = FB_PI_HOLD + `
PROGRAM _CYCLIC
	(* Führungsregler: Produkttemperatur -> Sollwert Manteltemperatur (begrenzt).
	   Ist der Folgeregler in der Begrenzung, wird der I-Anteil des Führungsreglers angehalten. *)
	fbOuter(bEnable := diEnable, rSetValue := rSetProduct, rActValue := rTempProduct,
		rKp := 4.0, rTn := 30.0, rMinOut := rJacketMin, rMaxOut := rJacketMax, rTs := rTs,
		bHoldI := fbInner.bLimited);
	rSetJacket := fbOuter.rOut;

	(* Folgeregler: Manteltemperatur -> Heizleistung *)
	fbInner(bEnable := diEnable, rSetValue := rSetJacket, rActValue := rTempJacket,
		rKp := 2.0, rTn := 5.0, rMinOut := 0.0, rMaxOut := 100.0, rTs := rTs, bHoldI := FALSE);
	rHeat := fbInner.rOut;
END_PROGRAM
`;
const kStart = FB_PI_HOLD + `
PROGRAM _CYCLIC
	(* Bisher einschleifig: Produkttemperatur wirkt direkt auf die Heizleistung.
	   Die Manteltemperatur ist unbegrenzt und Störungen im Mantel werden spät erkannt. *)
	fbOuter(bEnable := diEnable, rSetValue := rSetProduct, rActValue := rTempProduct,
		rKp := 5.0, rTn := 30.0, rMinOut := 0.0, rMaxOut := 100.0, rTs := rTs, bHoldI := FALSE);
	rHeat := fbOuter.rOut;
	rSetJacket := 0.0;
END_PROGRAM
`;
const exCascade = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Kaskadenregelung für einen beheizten Doppelmantelbehälter',
  task: `Ein Rührbehälter mit Doppelmantel wird elektrisch beheizt. Der **Mantel** reagiert schnell (PT1, T = 5 s, Ks = 1,5 K/%), das **Produkt** langsam (PT1, T = 30 s, angetrieben von der Manteltemperatur). Die einschleifige Regelung hat zwei Probleme: Der Mantel wird beim Aufheizen über 160 °C heiß (Produkt brennt an), und eine Störung im Mantel (z. B. Kühlwasser-Leckage) bemerkt der Regler erst, wenn das Produkt schon abkühlt.

Baue eine **Kaskadenregelung** mit zwei Instanzen von \`FB_PI\` (Baustein ist vorhanden):
1. **Führungsregler** \`fbOuter\` (Produkt): Kp = 4 K/K, Tn = 30 s. Sein Ausgang ist der **Sollwert der Manteltemperatur** \`rSetJacket\`, begrenzt auf **20…120 °C**.
2. **Folgeregler** \`fbInner\` (Mantel): Kp = 2 %/K, Tn = 5 s, Ausgang Heizleistung 0…100 %.
3. **Windup-Schutz in der Kaskade:** Ist der Folgeregler in der Begrenzung (\`fbInner.bLimited\`), wird der I-Anteil des Führungsreglers angehalten (\`bHoldI\`).
4. Rufe zuerst den Führungsregler, dann den Folgeregler auf (Signalfluss).

Abnahme: Produkt 80 °C nach 120 s im Band ±1 K, Mantel nie über 121 °C, Mantelstörung verursacht < 1,5 K Abweichung am Produkt.`,
  hints: [
    'Der Folgeregler muss deutlich schneller sein als der Führungsregler (Faustregel: Faktor 3–5 in der Zeitkonstante des geschlossenen Kreises).',
    'Die Begrenzung des Mantel-Sollwerts ist ein wesentlicher Vorteil der Kaskade: Du begrenzt eine Prozessgröße, nicht nur die Stellgröße.',
    'MTBasicsPID bietet für denselben Zweck den Ausgang IntegrationStatus (Folgeregler) und den Eingang HoldIntegration (Führungsregler).'
  ],
  cycleMs: 10,
  io: [
    { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Freigabe Heizung', widget: 'switch', init: true },
    { name: 'rSetProduct', type: 'REAL', dir: 'in', label: 'Solltemperatur Produkt', widget: 'slider', min: 20, max: 110, init: 80, unit: '°C' },
    { name: 'rTempProduct', type: 'REAL', dir: 'in', label: 'Produkttemperatur', widget: 'gauge', min: 0, max: 150, init: 20, unit: '°C' },
    { name: 'rTempJacket', type: 'REAL', dir: 'in', label: 'Manteltemperatur', widget: 'gauge', min: 0, max: 200, init: 20, unit: '°C' },
    { name: 'rHeat', type: 'REAL', dir: 'out', label: 'Heizleistung', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'rSetJacket', type: 'REAL', dir: 'out', label: 'Sollwert Mantel', widget: 'value', unit: '°C' }
  ],
  scene: { type: 'tank', bind: { temp: 'rTempProduct', mixer: 'diEnable' } },
  plant: {
    var: 'VAR\n\trTj : REAL := 20.0;   (* Manteltemperatur *)\n\trTp : REAL := 20.0;   (* Produkttemperatur *)\n\trDist : REAL;         (* Störung im Mantel in K *)\n\trTjMax : REAL;        (* Schleppzeiger Manteltemperatur *)\n\trTpMax : REAL;        (* Schleppzeiger Produkttemperatur *)\nEND_VAR\n',
    code: 'rTj := rTj + (1.5 * rHeat - rDist - (rTj - 20.0)) / 5.0 * PLANT_DT;\nrTp := rTp + (rTj - rTp) / 30.0 * PLANT_DT;\nrTempJacket := rTj;\nrTempProduct := rTp;\nrTjMax := MAX(rTjMax, rTj);\nrTpMax := MAX(rTpMax, rTp);\n'
  },
  files: { main: kStart, var: kVar, typ: '' },
  solution: { main: kSolution, var: kVar, typ: '' },
  tests: [
    { name: 'Produkt erreicht 80 °C (nach 120 s im Band ±1 K)', steps: [
      { ms: 120000 },
      { never: 'ABS(rTempProduct - 80.0) > 1.0', ms: 60000, msg: 'Die Produkttemperatur liegt nach 120 s nicht stabil bei 80 °C ± 1 K.' }
    ] },
    { name: 'Manteltemperatur bleibt unter 121 °C', steps: [
      { ms: 150000 },
      { expect: 'rTjMax < 121.0', msg: 'Der Mantel wird zu heiß (Schleppzeiger rTjMax) – der Sollwert des Folgereglers muss auf 120 °C begrenzt sein.' }
    ] },
    { name: 'Kein Überschwingen des Produkts über 82 °C', steps: [
      { ms: 200000 },
      { expect: 'rTpMax < 82.0', msg: 'Das Produkt schwingt zu weit über (Schleppzeiger rTpMax) – Windup im Führungsregler?' }
    ] },
    { name: 'Störung im Mantel wird vom Folgeregler abgefangen', steps: [
      { ms: 150000 }, { set: { rDist: 40.0 } },
      { never: 'ABS(rTempProduct - 80.0) > 1.5', ms: 100000, msg: 'Die Mantelstörung wirkt zu stark auf das Produkt – der Folgeregler muss sie ausregeln.' }
    ] },
    { name: 'Freigabe AUS schaltet die Heizung ab', steps: [
      { ms: 30000 }, { set: { diEnable: false } }, { cycles: 2 },
      { expect: 'rHeat = 0.0', msg: 'Ohne Freigabe muss die Heizleistung 0 % sein.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Übung: Vorsteuerung und Störgrößenaufschaltung
// ---------------------------------------------------------------------------
const ffVar = `VAR CONSTANT
	rTs : REAL := 0.01;
	rKp : REAL := 5.0;       (* %/% *)
	rTn : REAL := 10.0;      (* s *)
	rRate : REAL := 0.5;     (* Sollwertrampe in %/s *)
	rKFill : REAL := 0.04;   (* Modell: Füllgeschwindigkeit in (%/s) je % Ventil *)
END_VAR
VAR
	rWRamp : REAL;     (* gerampter Sollwert *)
	rDw : REAL;        (* Sollwertänderung in diesem Zyklus *)
	rFFw : REAL;       (* Führungsgrößen-Vorsteuerung in % *)
	rFFz : REAL;       (* Störgrößenaufschaltung in % *)
	rE : REAL;
	rP : REAL;
	rI : REAL;
	rDeltaI : REAL;
	rU : REAL;
	bInit : BOOL;
END_VAR
`;
const ffRamp = `	(* Sollwertrampe (vorhanden) *)
	IF NOT bInit THEN
		rWRamp := rLevel;
		bInit := TRUE;
	END_IF
	rDw := LIMIT(-rRate * rTs, rSetLevel - rWRamp, rRate * rTs);
	rWRamp := rWRamp + rDw;
	rSetRamp := rWRamp;
`;
const ffPI = (ff) => `	(* PI-Regler mit Anti-Windup *)
	rE := rWRamp - rLevel;
	rP := rKp * rE;
	rDeltaI := rKp / rTn * rE * rTs;
	rU := ${ff}rP + rI + rDeltaI;
	IF NOT (((rU > 100.0) AND (rDeltaI > 0.0)) OR ((rU < 0.0) AND (rDeltaI < 0.0))) THEN
		rI := rI + rDeltaI;
	END_IF
	rValve := LIMIT(0.0, ${ff}rP + rI, 100.0);
`;
const ffSolution = `PROGRAM _CYCLIC
${ffRamp}
	(* Führungsgrößen-Vorsteuerung: Ventilöffnung, die die Rampe nach Modell allein erzeugt *)
	rFFw := rDw / rTs / rKFill;
	(* Störgrößenaufschaltung: gemessenen Abfluss direkt kompensieren *)
	rFFz := rOutflow;

${ffPI('rFFw + rFFz + ')}END_PROGRAM
`;
const ffStart = `PROGRAM _CYCLIC
${ffRamp}
	(* TODO: Führungsgrößen-Vorsteuerung rFFw und Störgrößenaufschaltung rFFz *)

${ffPI('')}END_PROGRAM
`;
const exFF = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Füllstand: Führungsgrößen-Vorsteuerung und Störgrößenaufschaltung',
  task: `Ein Pufferbehälter versorgt eine Abfüllmaschine. Der Abfluss (Verbrauch der Maschine) wird mit einem Durchflussmesser **gemessen** (\`rOutflow\`, in % der Ventilkapazität). Sollwertänderungen werden mit einer Rampe von 0,5 %/s gefahren. Der vorhandene PI-Regler (Kp = 5, Tn = 10 s, Anti-Windup) reagiert erst, wenn der Füllstand schon abweicht: Bei einem Verbrauchssprung bricht der Füllstand um mehrere Prozent ein, und der Rampe läuft er hinterher.

Ergänze zwei Aufschaltungen, die zur PI-Stellgröße **addiert** werden (auch in der Anti-Windup-Bedingung):
1. **Störgrößenaufschaltung** \`rFFz\`: Der gemessene Abfluss wird direkt als Ventilöffnung aufgeschaltet (\`rFFz := rOutflow\`), denn im Gleichgewicht gilt Zufluss = Abfluss.
2. **Führungsgrößen-Vorsteuerung** \`rFFw\`: Die Ventilöffnung, die die Rampe nach dem Modell \`dL/dt = 0,04 · y\` allein erzeugen würde: \`rFFw := rDw / rTs / rKFill\`.

Der Regler muss nur noch die **Modellfehler** ausregeln (das reale Ventil fördert etwas mehr als im Modell, der Durchflussmesser hat 0,5 s Verzögerung).

Abnahme: Verbrauchssprung 20 → 70 % verursacht < 1,5 % Füllstandsabweichung, Nachlauffehler während der Rampe < 0,5 %.`,
  hints: [
    'Vorsteuerung und Störgrößenaufschaltung sind Steuerungen: Sie wirken sofort, ohne auf eine Regelabweichung zu warten. Der Regler korrigiert nur den Rest.',
    'Addiere die Aufschaltungen vor der Begrenzung – sonst kann das Ventil durch die Summe über 100 % kommen.',
    'Die Anlagen-Simulation stellt den wahren Abfluss als `rQout` bereit; im Watch kannst du ihn verstellen.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rSetLevel', type: 'REAL', dir: 'in', label: 'Sollwert Füllstand', widget: 'slider', min: 0, max: 100, init: 30, unit: '%' },
    { name: 'rOutflow', type: 'REAL', dir: 'in', label: 'Abfluss (gemessen)', widget: 'value', init: 20, unit: '%' },
    { name: 'rLevel', type: 'REAL', dir: 'in', label: 'Füllstand', widget: 'gauge', min: 0, max: 100, init: 30, unit: '%' },
    { name: 'rValve', type: 'REAL', dir: 'out', label: 'Zulaufventil', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'rSetRamp', type: 'REAL', dir: 'out', label: 'Sollwert (gerampt)', widget: 'value', unit: '%' }
  ],
  scene: { type: 'tank', bind: { level: 'rLevel' } },
  plant: {
    var: 'VAR\n\trL : REAL := 30.0;\n\trQout : REAL := 20.0;   (* wahrer Abfluss *)\n\trQMeas : REAL := 20.0;  (* Durchflussmesser mit 0,5 s Verzögerung *)\nEND_VAR\n',
    code: 'rQMeas := rQMeas + (rQout - rQMeas) / 0.5 * PLANT_DT;\nrOutflow := rQMeas;\n(* reales Ventil fördert 0,045 statt 0,04 (Modellfehler) *)\nrL := LIMIT(0.0, rL + (0.045 * rValve - 0.04 * rQout) * PLANT_DT, 100.0);\nrLevel := rL;\n'
  },
  files: { main: ffStart, var: ffVar, typ: '' },
  solution: { main: ffSolution, var: ffVar, typ: '' },
  tests: [
    { name: 'Verbrauchssprung 20 → 70 %: Füllstandsabweichung < 1,5 %', steps: [
      { ms: 30000 }, { set: { rQout: 70.0 } },
      { never: 'ABS(rLevel - 30.0) > 1.5', ms: 60000, msg: 'Der Füllstand bricht zu stark ein – Störgrößenaufschaltung fehlt oder wirkt nicht.' }
    ] },
    { name: 'Sollwertrampe 30 → 70 %: Nachlauffehler < 0,5 %', steps: [
      { ms: 20000 }, { set: { rSetLevel: 70.0 } }, { ms: 5000 },
      { never: 'ABS(rLevel - rSetRamp) > 0.5', ms: 70000, msg: 'Der Füllstand läuft der Rampe hinterher – Führungsgrößen-Vorsteuerung fehlt.' }
    ] },
    { name: 'Rampe hat die vorgegebene Steigung (0,5 %/s)', steps: [
      { ms: 1000 }, { set: { rSetLevel: 70.0 } }, { ms: 10000 },
      { expect: 'ABS(rSetRamp - 35.0) < 0.3', msg: 'Nach 10 s Rampe muss der Sollwert bei ca. 35 % liegen.' }
    ] },
    { name: 'Stationär genau und Ventil im Bereich', steps: [
      { set: { rQout: 50.0 } },
      { never: 'rValve < 0.0 OR rValve > 100.0', ms: 40000, msg: 'Die Summe aus Regler und Aufschaltungen muss auf 0…100 % begrenzt sein.' },
      { expect: 'ABS(rLevel - 30.0) < 0.2', msg: 'Der Regler muss den Modellfehler stationär ausregeln.' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Projekt: Split-Range Heizen/Kühlen eines Reaktors
// ---------------------------------------------------------------------------
const srVar = `VAR CONSTANT
	rTs : REAL := 0.01;
	rKp : REAL := 15.0;      (* %/K *)
	rTn : REAL := 10.0;      (* s *)
	rDeadband : REAL := 2.0; (* Totzone um 0 % in % *)
	rTempMax : REAL := 90.0; (* Übertemperatur: Not-Kühlung *)
END_VAR
VAR
	rE : REAL;
	rP : REAL;
	rI : REAL;
	rDeltaI : REAL;
	rU : REAL;
	rY : REAL;          (* Reglerausgang -100..+100 % *)
	bFault : BOOL;
END_VAR
`;
const srSolution = `PROGRAM _CYCLIC
	(* 1. Übertemperatur: Störung speichern; Quittieren erst 10 K unter der Grenze *)
	IF rTemp > rTempMax THEN
		bFault := TRUE;
	END_IF
	IF diReset AND (rTemp < rTempMax - 10.0) THEN
		bFault := FALSE;
	END_IF

	IF bFault THEN
		(* sicherer Zustand für eine exotherme Reaktion: Heizung aus, volle Kühlung *)
		rI := 0.0; rY := 0.0;
		rHeat := 0.0; rCool := 100.0;
	ELSIF NOT diEnable THEN
		rI := 0.0; rY := 0.0;
		rHeat := 0.0; rCool := 0.0;
	ELSE
		(* 2. ein PI-Regler mit Ausgang -100..+100 % *)
		rE := rSetTemp - rTemp;
		rP := rKp * rE;
		rDeltaI := rKp / rTn * rE * rTs;
		rU := rP + rI + rDeltaI;
		IF NOT (((rU > 100.0) AND (rDeltaI > 0.0)) OR ((rU < -100.0) AND (rDeltaI < 0.0))) THEN
			rI := rI + rDeltaI;
		END_IF
		rY := LIMIT(-100.0, rP + rI, 100.0);

		(* 3. Split-Range mit Totzone: nie gleichzeitig heizen und kühlen *)
		IF rY > rDeadband THEN
			rHeat := rY; rCool := 0.0;
		ELSIF rY < -rDeadband THEN
			rHeat := 0.0; rCool := -rY;
		ELSE
			rHeat := 0.0; rCool := 0.0;
		END_IF
	END_IF
	doFault := bFault;
	doHeating := rHeat > 0.0;
	rControllerOut := rY;
END_PROGRAM
`;
const srStart = `PROGRAM _CYCLIC
	(* Bisher nur Heizen: PI-Regler mit Ausgang 0..100 %, keine Kühlung, keine Überwachung *)
	IF NOT diEnable THEN
		rI := 0.0;
		rHeat := 0.0;
	ELSE
		rE := rSetTemp - rTemp;
		rP := rKp * rE;
		rDeltaI := rKp / rTn * rE * rTs;
		rU := rP + rI + rDeltaI;
		IF NOT (((rU > 100.0) AND (rDeltaI > 0.0)) OR ((rU < 0.0) AND (rDeltaI < 0.0))) THEN
			rI := rI + rDeltaI;
		END_IF
		rHeat := LIMIT(0.0, rP + rI, 100.0);
	END_IF
	rCool := 0.0;
	doHeating := rHeat > 0.0;
	rControllerOut := rHeat;
END_PROGRAM
`;
const exSplit = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Split-Range-Temperaturregelung mit Not-Kühlung',
  task: `Ein Reaktor wird elektrisch beheizt und über ein Kühlwasserventil gekühlt. Startet die Reaktion, wird Wärme frei (**exotherm**) – dann muss gekühlt statt geheizt werden. Strecke: \`dT/dt = (0,8·Heizen − 0,8·Kühlen + Q_exo − (T − 20)) / 20 s\`.

Erweitere die reine Heizregelung zu einer **Split-Range-Regelung** mit **einem** PI-Regler:
1. Reglerausgang \`rY\` im Bereich **−100…+100 %** (Kp = 15 %/K, Tn = 10 s, Anti-Windup an beiden Grenzen). Gib \`rY\` auf \`rControllerOut\` aus.
2. **Aufteilung:** \`rY > +2 %\` → \`rHeat = rY\`, \`rCool = 0\`; \`rY < −2 %\` → \`rCool = −rY\`, \`rHeat = 0\`; dazwischen (Totzone) beide 0. **Nie** gleichzeitig heizen und kühlen.
3. **Übertemperatur** \`rTemp > 90 °C\`: gespeicherte Störung \`doFault\`, Heizung aus, **Kühlung 100 %** (sicherer Zustand bei exothermer Reaktion). Quittieren mit \`diReset\` erst unter 80 °C.
4. \`diEnable\` FALSE: Heizen und Kühlen 0, I-Anteil löschen (außer im Störzustand).

Abnahme: 50 °C werden nach 20 s gehalten; nach Einsetzen der Reaktion (Q_exo = 60 K) ist die Temperatur nach 30 s wieder im Band ±1 K, wobei gekühlt wird.`,
  hints: [
    'Ein Regler, zwei Stellglieder: Das Vorzeichen des Reglerausgangs entscheidet, welches Stellglied arbeitet.',
    'Die Totzone verhindert, dass bei y ≈ 0 ständig zwischen Heizen und Kühlen gewechselt wird. Der I-Anteil läuft in der Totzone weiter und schiebt den Ausgang heraus.',
    'Die Reaktionswärme `rQexo` ist eine Variable der Anlagen-Simulation – setze sie im Watch auf 60 oder 200.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Freigabe Temperierung', widget: 'switch', init: true },
    { name: 'diReset', type: 'BOOL', dir: 'in', label: 'Störung quittieren', widget: 'button' },
    { name: 'rSetTemp', type: 'REAL', dir: 'in', label: 'Solltemperatur', widget: 'slider', min: 20, max: 80, init: 50, unit: '°C' },
    { name: 'rTemp', type: 'REAL', dir: 'in', label: 'Reaktortemperatur', widget: 'gauge', min: 0, max: 120, init: 20, unit: '°C' },
    { name: 'rHeat', type: 'REAL', dir: 'out', label: 'Heizleistung', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'rCool', type: 'REAL', dir: 'out', label: 'Kühlventil', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'rControllerOut', type: 'REAL', dir: 'out', label: 'Reglerausgang y', widget: 'value', unit: '%' },
    { name: 'doHeating', type: 'BOOL', dir: 'out', label: 'Heizung aktiv', widget: 'led' },
    { name: 'doFault', type: 'BOOL', dir: 'out', label: 'Störung Übertemperatur', widget: 'led' }
  ],
  scene: { type: 'tank', bind: { temp: 'rTemp', heater: 'doHeating', mixer: 'diEnable' } },
  plant: {
    var: 'VAR\n\trT : REAL := 20.0;\n\trQexo : REAL;   (* Reaktionswärme in K *)\nEND_VAR\n',
    code: 'rT := rT + (0.8 * rHeat - 0.8 * rCool + rQexo - (rT - 20.0)) / 20.0 * PLANT_DT;\nrTemp := rT;\n'
  },
  files: { main: srStart, var: srVar, typ: '' },
  solution: { main: srSolution, var: srVar, typ: '' },
  tests: [
    { name: 'Aufheizen auf 50 °C und Halten (Heizbetrieb)', steps: [
      { ms: 20000 },
      { never: 'ABS(rTemp - 50.0) > 1.0', ms: 20000, msg: 'Die Temperatur liegt nach 20 s nicht stabil bei 50 °C ± 1 K.' },
      { expect: 'rHeat > 20.0 AND rCool = 0.0', msg: 'Ohne Reaktion muss geheizt und darf nicht gekühlt werden.' }
    ] },
    { name: 'Exotherme Reaktion: Umschalten auf Kühlen', steps: [
      { ms: 40000 }, { set: { rQexo: 60.0 } }, { ms: 30000 },
      { never: 'ABS(rTemp - 50.0) > 1.0', ms: 20000, msg: 'Nach Einsetzen der Reaktion muss die Temperatur durch Kühlen wieder auf 50 °C ± 1 K kommen.' },
      { expect: 'rCool > 30.0 AND rHeat = 0.0', msg: 'Bei Reaktionswärme muss gekühlt und darf nicht geheizt werden.' }
    ] },
    { name: 'Nie gleichzeitig Heizen und Kühlen', steps: [
      { never: 'rHeat > 0.0 AND rCool > 0.0', ms: 40000 },
      { set: { rQexo: 60.0 } },
      { never: 'rHeat > 0.0 AND rCool > 0.0', ms: 40000 },
      { set: { rQexo: 0.0 } },
      { never: 'rHeat > 0.0 AND rCool > 0.0', ms: 40000, msg: 'Heizung und Kühlung dürfen nie gleichzeitig aktiv sein.' }
    ] },
    { name: 'Übertemperatur: Not-Kühlung 100 %, Quittieren unter 80 °C', steps: [
      { ms: 30000 }, { set: { rQexo: 200.0 } },
      { until: 'doFault', maxMs: 60000, msg: 'Über 90 °C muss doFault gesetzt werden.' },
      { expect: 'rCool = 100.0 AND rHeat = 0.0', msg: 'Im Störzustand: Heizung aus, Kühlung 100 %.' },
      { set: { diReset: true } }, { cycles: 2 },
      { expect: 'doFault', msg: 'Über 80 °C darf nicht quittiert werden können.' },
      { set: { rQexo: 0.0 } },
      { until: 'NOT doFault', maxMs: 60000, msg: 'Unter 80 °C muss diReset die Störung quittieren.' }
    ] },
    { name: 'Freigabe AUS: Heizen und Kühlen aus', steps: [
      { ms: 30000 }, { set: { diEnable: false } }, { cycles: 2 },
      { expect: 'rHeat = 0.0 AND rCool = 0.0' }
    ] }
  ]
};

// ---------------------------------------------------------------------------
// Zusatz: Streckenidentifikation (Zweipunktmethode) und Regler im Abtastraster
// ---------------------------------------------------------------------------
const idVar = `VAR CONSTANT
	rStep : REAL := 60.0;        (* Stellgrößensprung in % *)
	nLogDiv : INT := 5;          (* alle 5 Zyklen = 50 ms aufzeichnen *)
	rTLog : REAL := 0.05;        (* Abtastzeit der Aufzeichnung in s *)
	nLogMax : INT := 1199;       (* 1200 Werte = 60 s *)
END_VAR
VAR
	fbStart : R_TRIG;
	nStep : INT;
	aLog : ARRAY[0..1199] OF REAL;
	nLog : INT;
	nDivCnt : INT;
	rY0 : REAL;
	rYEnd : REAL;
	rDelta : REAL;
	rT28 : REAL;
	rT63 : REAL;
	i : INT;
	bFound28 : BOOL;
	bFound63 : BOOL;
END_VAR
`;
const idEval = `			(* Auswertung: Zweipunktmethode 28,3 % / 63,2 % *)
			rYEnd := aLog[nLogMax];
			rDelta := rYEnd - rY0;
			bFound28 := FALSE;
			bFound63 := FALSE;
			IF ABS(rDelta) > 0.001 THEN
				FOR i := 0 TO nLogMax DO
					IF NOT bFound28 AND (aLog[i] - rY0 >= 0.283 * rDelta) THEN
						rT28 := INT_TO_REAL(i) * rTLog;
						bFound28 := TRUE;
					END_IF
					IF NOT bFound63 AND (aLog[i] - rY0 >= 0.632 * rDelta) THEN
						rT63 := INT_TO_REAL(i) * rTLog;
						bFound63 := TRUE;
					END_IF
				END_FOR
			END_IF
			IF bFound28 AND bFound63 THEN
				rKsOut := rDelta / rStep;
				rTOut := 1.5 * (rT63 - rT28);
				rTtOut := rT63 - rTOut;
				bValid := TRUE;
			ELSE
				rKsOut := 0.0;
				rTOut := 0.0;
				rTtOut := 0.0;
				bValid := FALSE;
			END_IF
`;
const idProg = (ev) => `PROGRAM _CYCLIC
	fbStart(CLK := diStart);
	CASE nStep OF
		0: (* bereit *)
			rU := 0.0;
			IF fbStart.Q THEN
				rY0 := rY;
				nLog := 0;
				nDivCnt := 0;
				bDone := FALSE;
				bValid := FALSE;
				nStep := 10;
			END_IF

		10: (* Sprung aufschalten und Verlauf aufzeichnen *)
			rU := rStep;
			IF nDivCnt = 0 THEN
				aLog[nLog] := rY;
				IF nLog >= nLogMax THEN
					nStep := 20;
				ELSE
					nLog := nLog + 1;
				END_IF
			END_IF
			nDivCnt := (nDivCnt + 1) MOD nLogDiv;

		20: (* Stellgröße zurück, auswerten *)
			rU := 0.0;
${ev}			bDone := TRUE;
			nStep := 0;
	END_CASE
END_PROGRAM
`;
const startDone = (s) => ({ set: Object.assign({ diStart: true }, s || {}) });
const exIdent = {
  id: 'ex1', type: 'st', variant: 'erweitern',
  title: 'Streckenidentifikation PT1-Tt mit der Zweipunktmethode',
  task: `Für den Reglerentwurf brauchst du ein Modell der Strecke. Viele verfahrenstechnische Strecken lassen sich als **PT1 mit Totzeit** (PT1-Tt) annähern. Die Schrittkette zeichnet nach einem Sprung von 0 auf 60 % die Regelgröße 60 s lang im Raster 50 ms auf (\`aLog[0..1199]\`, \`aLog[0]\` = Zeitpunkt des Sprungs).

Ergänze in Schritt 20 die **Auswertung** nach der Zweipunktmethode:
1. Endwert \`rYEnd = aLog[1199]\`, Änderung \`rDelta = rYEnd − rY0\`.
2. Suche die ersten Zeitpunkte \`t28\` und \`t63\`, an denen die Änderung **28,3 %** bzw. **63,2 %** von \`rDelta\` erreicht (Zeit = Index · 0,05 s).
3. Berechne **T = 1,5 · (t63 − t28)**, **Tt = t63 − T** und **Ks = rDelta / 60 %**.
4. Wenn \`|rDelta| ≤ 0,001\` (Strecke reagiert nicht, z. B. Stellglied defekt) oder ein Punkt nicht gefunden wird: alle Ergebnisse 0, \`bValid\` = FALSE.
5. \`bDone\` wird nach der Auswertung gesetzt (vorhanden).

Die Strecke der Simulation: Ks = 0,5 (veränderbar über \`rGain\`), T = 6 s, Tt = 2 s, Ruhewert 10.`,
  hints: [
    'Die Zweipunktmethode nutzt, dass bei einer PT1-Tt-Strecke y(Tt + T/3) = 28,3 % und y(Tt + T) = 63,2 % des Endwerts beträgt.',
    'Suche mit einer FOR-Schleife und merke dir über ein BOOL-Flag, dass ein Punkt schon gefunden wurde – sonst überschreibt der letzte passende Wert den ersten.',
    'Eine Schleife über 1200 Werte ist für die SPS unkritisch, sollte aber nur einmal (in Schritt 20) laufen, nicht jeden Zyklus.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Identifikation starten', widget: 'button' },
    { name: 'rY', type: 'REAL', dir: 'in', label: 'Regelgröße', widget: 'gauge', min: 0, max: 100 },
    { name: 'rU', type: 'REAL', dir: 'out', label: 'Stellgröße', widget: 'gauge', min: 0, max: 100, unit: '%' },
    { name: 'rKsOut', type: 'REAL', dir: 'out', label: 'Ks identifiziert', widget: 'value' },
    { name: 'rTOut', type: 'REAL', dir: 'out', label: 'T identifiziert', widget: 'value', unit: 's' },
    { name: 'rTtOut', type: 'REAL', dir: 'out', label: 'Tt identifiziert', widget: 'value', unit: 's' },
    { name: 'bValid', type: 'BOOL', dir: 'out', label: 'Ergebnis gültig', widget: 'led' },
    { name: 'bDone', type: 'BOOL', dir: 'out', label: 'fertig', widget: 'led' }
  ],
  plant: {
    var: 'VAR\n\taDelay : ARRAY[0..199] OF REAL;\n\tnIdx : INT;\n\trUd : REAL;\n\trX : REAL;\n\trGain : REAL := 0.5;\nEND_VAR\n',
    code: '(* Totzeit 2 s = 200 Zyklen (Ringpuffer) *)\nrUd := aDelay[nIdx];\naDelay[nIdx] := rU;\nnIdx := (nIdx + 1) MOD 200;\n(* PT1: Ks = rGain, T = 6 s *)\nrX := rX + (rGain * rUd - rX) / 6.0 * PLANT_DT;\nrY := 10.0 + rX;\n'
  },
  files: { main: idProg('\t\t\t(* TODO: Auswertung nach der Zweipunktmethode *)\n'), var: idVar, typ: '' },
  solution: { main: idProg(idEval), var: idVar, typ: '' },
  tests: [
    { name: 'Streckenverstärkung Ks = 0,5 wird erkannt', steps: [
      startDone(), { cycles: 2 }, { set: { diStart: false } },
      { until: 'bDone', maxMs: 65000, msg: 'Die Identifikation wird nicht fertig.' },
      { expect: 'bValid AND ABS(rKsOut - 0.5) < 0.01', msg: 'Ks muss ca. 0,5 betragen (rDelta / 60 %).' }
    ] },
    { name: 'Zeitkonstante T ≈ 6 s und Totzeit Tt ≈ 2 s', steps: [
      startDone(), { cycles: 2 }, { set: { diStart: false } },
      { until: 'bDone', maxMs: 65000 },
      { expect: 'ABS(rTOut - 6.0) < 0.3', msg: 'T = 1,5 · (t63 − t28) muss ca. 6 s ergeben.' },
      { expect: 'ABS(rTtOut - 2.0) < 0.2', msg: 'Tt = t63 − T muss ca. 2 s ergeben.' }
    ] },
    { name: 'Andere Strecke (Ks = 0,8) wird ebenfalls korrekt erkannt', steps: [
      { set: { rGain: 0.8 } }, startDone(), { cycles: 2 }, { set: { diStart: false } },
      { until: 'bDone', maxMs: 65000 },
      { expect: 'bValid AND ABS(rKsOut - 0.8) < 0.015 AND ABS(rTOut - 6.0) < 0.3', msg: 'Die Auswertung darf keine Konstanten der Beispielstrecke enthalten.' }
    ] },
    { name: 'Keine Reaktion der Strecke → Ergebnis ungültig', steps: [
      { set: { rGain: 0.0 } }, startDone(), { cycles: 2 }, { set: { diStart: false } },
      { until: 'bDone', maxMs: 65000 },
      { expect: 'NOT bValid AND rKsOut = 0.0 AND rTOut = 0.0', msg: 'Ohne Reaktion muss bValid FALSE und alle Ergebnisse 0 sein.' }
    ] }
  ]
};

const dVar = `VAR CONSTANT
	rTa : REAL := 0.1;       (* Abtastzeit des Reglers in s *)
	nDiv : INT := 10;        (* Untersetzung: 100 ms / 10 ms Taskzyklus *)
	rKp : REAL := 1.0;
	rTn : REAL := 3.0;       (* s *)
END_VAR
VAR
	nCnt : INT;
	rE : REAL;
	rI : REAL;
	rU : REAL;
END_VAR
`;
const dSolution = `PROGRAM _CYCLIC
	(* Regler nur in jedem nDiv-ten Zyklus rechnen: Abtastzeit = nDiv * 10 ms = rTa *)
	nCnt := nCnt + 1;
	IF nCnt >= nDiv THEN
		nCnt := 0;
		rE := rSetValue - rActValue;
		rU := rKp * rE + rI + rKp / rTn * rE * rTa;
		IF (rU > 0.0) AND (rU < 100.0) THEN
			rI := rI + rKp / rTn * rE * rTa;
		END_IF
		rOut := LIMIT(0.0, rKp * rE + rI, 100.0);
	END_IF
END_PROGRAM
`;
const dStart = `PROGRAM _CYCLIC
	(* Der Regler wurde für 100 ms Abtastzeit ausgelegt (rTa), läuft aber in der 10-ms-Taskklasse
	   und rechnet jeden Zyklus. Ergebnis: Der Kreis schwingt. *)
	rE := rSetValue - rActValue;
	rU := rKp * rE + rI + rKp / rTn * rE * rTa;
	IF (rU > 0.0) AND (rU < 100.0) THEN
		rI := rI + rKp / rTn * rE * rTa;
	END_IF
	rOut := LIMIT(0.0, rKp * rE + rI, 100.0);
END_PROGRAM
`;
const exDiscrete = {
  id: 'ex2', type: 'st', variant: 'fehlersuche',
  title: 'Regler im 100-ms-Abtastraster einer 10-ms-Taskklasse',
  task: `Ein PI-Regler (Kp = 1, Tn = 3 s) für eine träge PT2-Strecke wurde für eine **Abtastzeit von 100 ms** ausgelegt – so viel Rechenzeit soll er auf der CPU auch nur bekommen. Das Programm wurde aber in die Taskklasse **Cyclic #1 mit 10 ms** gelegt und rechnet jeden Zyklus, verwendet in der Integration aber \`rTa = 0,1 s\`. Dadurch integriert der Regler zehnmal zu schnell, und der Kreis schwingt.

Behebe den Fehler, **ohne** die Parameter zu ändern:
- Rechne den Regler nur in **jedem 10. Zyklus** (Untersetzung \`nDiv\`); dazwischen bleibt die Stellgröße konstant (Halteglied 0. Ordnung).
- Die Abtastzeit des Reglers ist damit tatsächlich 100 ms und passt zu \`rTa\`.

In AS6 wäre die sauberere Lösung, das Programm in eine Taskklasse mit 100 ms Zykluszeit zu verschieben – hier übst du die Untersetzung innerhalb einer schnellen Taskklasse, die du z. B. für mehrere Regler mit unterschiedlichen Raten brauchst.`,
  hints: [
    'Ein Zähler, der bei nDiv zurückgesetzt wird, erzeugt ein langsameres Raster.',
    'Die Anlagen-Simulation zählt in `nChanges`, wie oft sich die Stellgröße ändert – bei 100 ms Abtastzeit höchstens 10-mal pro Sekunde.',
    'Allgemein gilt: Abtastzeit ≤ 1/10 der dominanten Zeitkonstante des geschlossenen Kreises, sonst wird der Regler durch die Abtastung schlechter.'
  ],
  cycleMs: 10,
  io: [
    { name: 'rSetValue', type: 'REAL', dir: 'in', label: 'Sollwert w', widget: 'slider', min: 0, max: 100, init: 50 },
    { name: 'rActValue', type: 'REAL', dir: 'in', label: 'Istwert x', widget: 'gauge', min: 0, max: 100 },
    { name: 'rOut', type: 'REAL', dir: 'out', label: 'Stellgröße y', widget: 'gauge', min: 0, max: 100, unit: '%' }
  ],
  plant: {
    var: 'VAR\n\trX1 : REAL;\n\trX2 : REAL;\n\tnChanges : UDINT;   (* Änderungen der Stellgröße *)\n\trOld : REAL;\nEND_VAR\n',
    code: 'IF rOut <> rOld THEN nChanges := nChanges + 1; END_IF\nrOld := rOut;\n(* PT2 aus zwei PT1: 3 s und 1 s *)\nrX1 := rX1 + (1.0 * rOut - rX1) / 3.0 * PLANT_DT;\nrX2 := rX2 + (rX1 - rX2) / 1.0 * PLANT_DT;\nrActValue := rX2;\n'
  },
  files: { main: dStart, var: dVar, typ: '' },
  solution: { main: dSolution, var: dVar, typ: '' },
  tests: [
    { name: 'Kein Überschwingen über 53', steps: [
      { never: 'rActValue > 53.0', ms: 40000, msg: 'Der Kreis schwingt über – rechnet der Regler wirklich nur alle 100 ms?' }
    ] },
    { name: 'Nach 12 s im Band ±1', steps: [
      { ms: 12000 },
      { never: 'ABS(rActValue - 50.0) > 1.0', ms: 10000, msg: 'Der Istwert liegt nach 12 s nicht stabil bei 50 ± 1.' }
    ] },
    { name: 'Stellgröße ändert sich höchstens alle 100 ms', steps: [
      { ms: 2000 }, { set: { nChanges: 0 } }, { ms: 10000 },
      { expect: 'nChanges <= 101', msg: 'Die Stellgröße ändert sich öfter als 10-mal pro Sekunde – der Regler läuft nicht im 100-ms-Raster.' },
      { expect: 'nChanges >= 20', msg: 'Die Stellgröße muss sich weiterhin ändern (Regler läuft nicht?).' }
    ] },
    { name: 'Sollwertsprung 50 → 30 wird ausgeregelt', steps: [
      { ms: 20000 }, { set: { rSetValue: 30.0 } }, { ms: 20000 },
      { expect: 'ABS(rActValue - 30.0) < 0.5' }
    ] }
  ]
};

module.exports = [
  // =========================================================================
  {
    id: 'regelung-5-kaskade', level: 5, kind: 'lektion',
    title: 'Kaskadenregelung',
    summary: 'Führungs- und Folgeregler: schnelle Störungen im inneren Kreis abfangen, Zwischengrößen begrenzen und Windup über beide Ebenen verhindern.',
    minutes: 180,
    req: ['regelung-4-projekt-druck'],
    briefing: 'Eine Kaskade zerlegt eine träge Strecke in einen schnellen inneren und einen langsamen äußeren Teil. Der Folgeregler regelt eine messbare Zwischengröße (Manteltemperatur, Durchfluss, Motorstrom), der Führungsregler gibt ihm den Sollwert vor. So werden Störungen im inneren Kreis ausgeregelt, bevor sie die Hauptregelgröße erreichen, und die Zwischengröße lässt sich über die Sollwertbegrenzung schützen. Du lernst die Entwurfsreihenfolge (innen vor außen), die Bedingung für die Zeitskalen-Trennung und die Kopplung des Windup-Schutzes über beide Regler.',
    practice: 'Antriebe sind immer Kaskaden (Lage → Drehzahl → Strom). In der Verfahrenstechnik findest du sie bei Reaktormantel-Temperierung, Füllstand → Durchfluss und Druck → Ventilstellung (Stellungsregler). In mapp Control unterstützt MTBasicsPID diese Struktur ausdrücklich.',
    transfer: {
      tia: 'In TIA Portal verschaltest du zwei PID_Compact; für den Windup-Schutz gibt es bei PID_Compact keine direkte Kopplung – bei PID_Temp ist eine Kaskadenfunktion (Master/Slave) eingebaut.',
      codesys: 'In TwinCAT/CODESYS verschaltest du zwei PID-Bausteine; die ARW-Eingänge des Führungsreglers werden mit dem Begrenzungsstatus des Folgereglers verbunden.'
    },
    objectives: [
      {
        id: 'o1', title: 'Entscheide, wann sich eine Kaskade lohnt',
        guide: {
          intro: 'Eine Kaskade braucht eine messbare Zwischengröße, die deutlich schneller reagiert als die Hauptregelgröße.',
          steps: [
            'Zeichne das Blockschaltbild mit innerem Kreis (Folgeregler, schnelle Teilstrecke, Messung Zwischengröße) und äußerem Kreis (Führungsregler, langsame Teilstrecke).',
            'Prüfe die Voraussetzungen: Zwischengröße messbar, Störungen greifen im inneren Teil an, innere Zeitkonstante ≪ äußere.',
            'Lies im Skript von Schumacher/Leonhard Kap. 11 „Kaskadenregelung“ den Abschnitt zur Auslegung durch Näherungsrechnung.',
            'Notiere drei Kaskaden aus deinem Betrieb mit Haupt- und Hilfsregelgröße.'
          ],
          done: 'Erledigt, wenn du für eine gegebene Anlage begründen kannst, ob und mit welcher Hilfsregelgröße eine Kaskade sinnvoll ist.',
          tip: 'Ohne messbare Zwischengröße hilft keine Kaskade. Dann sind Störgrößenaufschaltung oder ein modellbasierter Regler die Alternativen.'
        }
      },
      {
        id: 'o2', title: 'Lege die Kaskade von innen nach außen aus',
        guide: {
          intro: 'Der innere Kreis wird zuerst eingestellt und für den äußeren Regler als (schnelles) Streckenglied betrachtet.',
          steps: [
            'Stelle den Führungsregler auf Hand (bzw. gib dem Folgeregler einen festen Sollwert) und optimiere den Folgeregler mit Sprüngen auf seinen Sollwert.',
            'Bestimme die Zeitkonstante des geschlossenen inneren Kreises aus dem Trace.',
            'Stelle anschließend den Führungsregler ein; die Ersatzstrecke ist „innerer Kreis + langsame Teilstrecke“.',
            'Prüfe die Zeitskalen-Trennung: Der innere Kreis sollte mindestens 3–5-mal schneller sein als der äußere.'
          ],
          done: 'Erledigt, wenn beide Regler nacheinander eingestellt sind und der Trace die Trennung der Zeitskalen zeigt.',
          tip: 'Ein Folgeregler darf ruhig etwas bleibende Regelabweichung haben (P-Regler) – der Führungsregler gleicht sie aus. Das macht den inneren Kreis schneller.'
        }
      },
      {
        id: 'o3', title: 'Verhindere Windup über beide Ebenen',
        guide: {
          intro: 'Ist der Folgeregler in der Begrenzung, kann der Führungsregler seinen Sollwert erhöhen, ohne dass etwas passiert – sein Integrator zieht auf.',
          steps: [
            'Gib den Begrenzungsstatus des Folgereglers (bLimited bzw. IntegrationStatus bei MTBasicsPID) an den Führungsregler zurück.',
            'Halte den I-Anteil des Führungsreglers an, solange der Folgeregler begrenzt ist (bHoldI bzw. HoldIntegration).',
            'Begrenze den Ausgang des Führungsreglers auf den zulässigen Bereich der Zwischengröße (z. B. Mantel 20…120 °C).',
            'Lies in der MTBasicsPID-Funktionsbeschreibung den Abschnitt „Kaskadenregelung“ zur stoßfreien Umschaltung mit Tracking.'
          ],
          code: { lang: 'st', text: 'fbOuter(…, rMinOut := 20.0, rMaxOut := 120.0, bHoldI := fbInner.bLimited);\nfbInner(…, rSetValue := fbOuter.rOut, rActValue := rTempJacket);' },
          done: 'Erledigt, wenn deine Kaskade beim Aufheizen (Folgeregler in Begrenzung) nicht überschwingt.',
          tip: 'Bei Handbetrieb des Folgereglers den Ausgang des Führungsreglers auf den Istwert der Zwischengröße nachführen (Tracking) – sonst gibt es beim Zurückschalten einen Sprung.',
          link: { label: 'B&R Help: MTBasicsPID – Kaskadenregelung', url: url.mtbasicsPidFunktion }
        }
      },
      {
        id: 'o4', title: 'Setze die Kaskade mit MTBasicsPID in AS6 um',
        guide: {
          intro: 'Für das reale Projekt verwendest du zwei MTBasicsPID-Instanzen statt eigener FBs.',
          steps: [
            'Lege zwei Instanzen `PIDOuter`, `PIDInner : MTBasicsPID;` an und setze in `_INIT` Parameter und Grenzen.',
            'Verbinde `PIDOuter.Out` mit `PIDInner.SetValue` und `PIDInner.IntegrationStatus` mit `PIDOuter.HoldIntegration`.',
            'Rufe beide Bausteine im selben Taskzyklus auf – erst den Führungsregler, dann den Folgeregler.',
            'Zeichne Produkt-, Mantel- und Sollwerttemperatur im Trace auf und dokumentiere eine Mantelstörung.'
          ],
          done: 'Erledigt, wenn die Kaskade mit MTBasicsPID in der Simulation läuft und eine Mantelstörung ohne merkliche Wirkung auf das Produkt ausgeregelt wird.',
          tip: 'Laufen beide Regler in unterschiedlichen Taskklassen, muss der Folgeregler in der schnelleren Taskklasse liegen.',
          link: { label: 'B&R Help: MTBasicsPID', url: url.mtbasicsPid }
        }
      }
    ],
    videos: [
      vid('buchholzKaskade', 'Vorlesungsabschnitt zur Kaskadenregelung mit Blockschaltbild und Auslegung.'),
      vid('loviscachKaskade', 'Prof. Loviscach erklärt Kaskadenregelung und Stellungsregler aus der Gebäude- und Prozesstechnik.')
    ],
    readings: [
      R.tubsGdR('Kap. 11 behandelt Aufbau und Auslegung der Kaskadenregelung durch Näherungsrechnung.', 30, 'Kap. 11'),
      R.br('MTBasicsPID – Funktionsbeschreibung', url.mtbasicsPidFunktion, 'Abschnitte Tracking und Kaskadenregelung: stoßfreies Umschalten und Windup-Schutz über HoldIntegration.', 15)
    ],
    quiz: [
      { type: 'single', q: 'Welche Bedingung muss für eine wirksame Kaskadenregelung erfüllt sein?',
        options: ['Beide Regler müssen PID-Regler sein', 'Der innere Kreis muss deutlich schneller sein als der äußere', 'Die Hauptregelgröße muss schneller sein als die Hilfsregelgröße', 'Beide Regler müssen in derselben Taskklasse wie die Visualisierung laufen'],
        correct: 1, explain: 'Nur bei Zeitskalen-Trennung kann der Führungsregler den inneren Kreis als nahezu ideales Glied betrachten.' },
      { type: 'single', q: 'In welcher Reihenfolge stellst du eine Kaskade ein?',
        options: ['Erst den Führungsregler, dann den Folgeregler', 'Erst den Folgeregler (innen), dann den Führungsregler (außen)', 'Beide gleichzeitig mit Ziegler-Nichols', 'Die Reihenfolge ist egal'],
        correct: 1, explain: 'Der Führungsregler „sieht“ den geschlossenen inneren Kreis – der muss also zuerst fertig sein.' },
      { type: 'multi', q: 'Welche Vorteile bietet eine Kaskade gegenüber einer einschleifigen Regelung?',
        options: ['Störungen im inneren Teil werden schnell ausgeregelt', 'Die Zwischengröße kann begrenzt werden', 'Nichtlinearitäten des Stellglieds werden vom Folgeregler ausgeglichen', 'Man braucht keinen Sensor für die Zwischengröße'],
        correct: [0, 1, 2], explain: 'Die Kaskade benötigt gerade einen zusätzlichen Sensor für die Hilfsregelgröße.' }
    ],
    exam: [
      { type: 'single', q: 'Welche MTBasicsPID-Signale verbindest du für den Windup-Schutz in einer Kaskade?',
        options: ['Out des Folgereglers mit SetValue des Führungsreglers', 'IntegrationStatus des Folgereglers mit HoldIntegration des Führungsreglers', 'TrackingActive mit Enable', 'ControlError mit ActValue'],
        correct: 1, explain: 'So hält der Führungsregler seinen Integrator an, sobald der Folgeregler nicht weiter kann.' },
      { type: 'numeric', q: 'Der geschlossene innere Kreis hat eine Zeitkonstante von {Ti} s. Der äußere Kreis soll mindestens 4-mal langsamer sein. Welche Zeitkonstante muss der äußere geschlossene Kreis mindestens haben?',
        params: { Ti: [0.5, 10, 0.5] }, formula: '4 * Ti', unit: 's', tol: 0.01,
        explain: 'Faustregel Zeitskalen-Trennung: Faktor 3–5 zwischen innerem und äußerem Kreis.' },
      { type: 'single', q: 'Welches Beispiel ist eine klassische Kaskade in der Antriebstechnik?',
        options: ['Lageregler → Drehzahlregler → Stromregler', 'Zweipunkt-Temperaturregler', 'Füllstand mit Störgrößenaufschaltung', 'Split-Range Heizen/Kühlen'],
        correct: 0, explain: 'Servoantriebe (z. B. ACOPOS) arbeiten mit einer dreistufigen Kaskade, der Stromregler ist der innerste und schnellste Kreis.' }
    ],
    exercises: [exCascade]
  },
  // =========================================================================
  {
    id: 'regelung-5-vorsteuerung', level: 5, kind: 'lektion',
    title: 'Vorsteuerung und Störgrößenaufschaltung',
    summary: 'Zwei-Freiheitsgrade-Strukturen: Führungsgrößen-Vorsteuerung für schnelles Folgeverhalten und Störgrößenaufschaltung für messbare Störungen.',
    minutes: 150,
    req: ['regelung-5-kaskade'],
    briefing: 'Ein Regler kann erst reagieren, wenn eine Regelabweichung entstanden ist. Ist bekannt, welche Stellgröße ein Sollwertverlauf oder eine gemessene Störung erfordert, kann diese Stellgröße direkt aufgeschaltet werden – der Regler muss dann nur noch Modellfehler korrigieren. Diese Kombination aus Steuerung und Regelung ist eine der wirksamsten Maßnahmen überhaupt, kostet wenig Rechenzeit und ist robust, solange das Modell ungefähr stimmt. Du lernst, eine statische und eine dynamische Aufschaltung zu berechnen und richtig mit Begrenzung und Anti-Windup zu kombinieren.',
    practice: 'Füllstand mit gemessener Entnahme, Bahnspannung mit Durchmesser- und Geschwindigkeitsvorsteuerung, Temperaturzone mit Vorsteuerung aus dem Massendurchsatz eines Extruders, Achsen mit Geschwindigkeits- und Beschleunigungsvorsteuerung im Antrieb.',
    transfer: {
      tia: 'PID_Compact hat keinen Vorsteuereingang; du addierst die Vorsteuerung in SCL hinter dem Regler oder nutzt PID_Temp bzw. Technologieobjekte mit Vorsteuerung (Antriebe).',
      codesys: 'In TwinCAT bietet die Controller Toolbox Bausteine zum Aufbau von Vorsteuerungen; Antriebe (NC) haben Geschwindigkeits- und Beschleunigungsvorsteuerung eingebaut.'
    },
    objectives: [
      {
        id: 'o1', title: 'Berechne eine statische Störgrößenaufschaltung',
        guide: {
          intro: 'Bei einer messbaren Störung wird die Stellgröße aufgeschaltet, die die Störung im Beharrungszustand kompensiert.',
          steps: [
            'Stelle die Bilanzgleichung auf, z. B. Füllstand: dL/dt = k_V · y − k_A · q_ab. Im Gleichgewicht ist y_ff = k_A/k_V · q_ab.',
            'Addiere y_ff zur Reglerstellgröße vor der Begrenzung und beziehe die Summe in die Anti-Windup-Bedingung ein.',
            'Prüfe im Trace: Ein Verbrauchssprung darf den Füllstand nur noch kurz und gering auslenken.',
            'Untersuche die Robustheit: Ändere die Modellkonstante um ±20 % – der Regler muss den Rest stationär ausregeln.'
          ],
          done: 'Erledigt, wenn deine Aufschaltung einen Verbrauchssprung bis auf einen kleinen Rest kompensiert.',
          tip: 'Eine Aufschaltung mit falschem Vorzeichen verstärkt die Störung. Teste neue Aufschaltungen zuerst mit halber Verstärkung.',
          link: { label: 'B&R Help: MTTempController (Eingang FeedForwardHeat)', url: url.mtTempController }
        }
      },
      {
        id: 'o2', title: 'Entwirf eine Führungsgrößen-Vorsteuerung',
        guide: {
          intro: 'Die Vorsteuerung berechnet aus dem gewünschten Sollwertverlauf die nötige Stellgröße (Inversion des Streckenmodells).',
          steps: [
            'Begrenze Sollwertsprünge mit einer Rampe – eine Vorsteuerung für einen idealen Sprung würde unendliche Stellgröße verlangen.',
            'Berechne aus dem Modell die Stellgröße für die Rampe, z. B. I-Strecke: y_ff = (dw/dt) / k_V.',
            'Lies in Schumacher (EMDR) Kap. 2.2 „Regelung mit Vorsteuerung“ und 2.4 „Führungsgrößengenerator“ nach.',
            'Vergleiche Nachlauffehler mit und ohne Vorsteuerung im Trace.'
          ],
          code: { lang: 'st', text: 'rDw := LIMIT(-rRate * rTs, rSetLevel - rWRamp, rRate * rTs);\nrWRamp := rWRamp + rDw;\nrFFw := rDw / rTs / rKFill;' },
          done: 'Erledigt, wenn der Nachlauffehler während einer Rampe durch die Vorsteuerung deutlich kleiner wird.',
          tip: 'Der Regler sieht als Sollwert immer den gerampten Wert, nicht den Endwert – sonst arbeiten Vorsteuerung und Regler gegeneinander.'
        }
      },
      {
        id: 'o3', title: 'Grenze Vorsteuerung, Kaskade und Störgrößenaufschaltung voneinander ab',
        guide: {
          intro: 'Die drei Strukturen lösen unterschiedliche Probleme und werden oft kombiniert.',
          steps: [
            'Erstelle eine Tabelle: Voraussetzung (Messung, Modell), Wirkung (Führung/Störung), Risiko (Modellfehler, Rauschen).',
            'Ordne Beispiele zu: gemessene Entnahme → Störgrößenaufschaltung; Mantelstörung → Kaskade; Rezeptwechsel mit Profil → Vorsteuerung.',
            'Diskutiere: Warum ist eine dynamische Störgrößenaufschaltung bei Totzeit in der Störstrecke schwierig?',
            'Schau dir das Video „What Is Feedforward Control?“ an und notiere die dort genannten Grenzen.'
          ],
          done: 'Erledigt, wenn du für drei Anlagen die passende Struktur begründet auswählen kannst.',
          tip: 'Die Vorsteuerung verändert die Stabilität des Regelkreises nicht – sie liegt außerhalb der Rückführung. Deshalb darf sie auch „aggressiv“ sein.'
        }
      }
    ],
    videos: [
      vid('buchholzStoer', 'Vorlesungsabschnitt zur Störgrößenaufschaltung mit Herleitung am Blockschaltbild.'),
      vid('buchholzVorst', 'Kombination von Vorsteuerung und Regelung – genau die Struktur der Übung.'),
      vid('matlabFeedforward', 'Praxisnahe Einführung in Feedforward-Control mit Grenzen und typischen Fehlern.')
    ],
    readings: [
      R.tubsEMDR('Kap. 2 „Störgrößenaufschaltung und Führungsgrößenvorsteuerung“ inklusive Modellfolgeregelung und Führungsgrößengenerator.', 40, 'Kap. 2'),
      R.br('MTTempController', url.mtTempController, 'Der Temperaturregler von MTTemp hat eigene Vorsteuereingänge FeedForwardHeat/FeedForwardCool – ein Beispiel aus der Praxis.', 10)
    ],
    quiz: [
      { type: 'single', q: 'Was ist die Voraussetzung für eine Störgrößenaufschaltung?',
        options: ['Die Störgröße muss messbar (oder zuverlässig schätzbar) sein', 'Die Strecke muss eine I-Strecke sein', 'Der Regler muss einen D-Anteil haben', 'Die Störung muss periodisch sein'],
        correct: 0, explain: 'Ohne Messung kann die Störung nicht aufgeschaltet werden – dann bleibt nur die Rückführung.' },
      { type: 'numeric', q: 'Ein Behälter: dL/dt = {kv} · y − 0,04 · q (L in %, y und q in %). Welche Ventilöffnung y in % kompensiert einen Abfluss q = {q} % stationär?',
        params: { kv: [0.02, 0.08, 0.01], q: [10, 80, 5] }, formula: '0.04 * q / kv', unit: '%', tol: 0.02,
        explain: 'Im Gleichgewicht ist dL/dt = 0, also y = 0,04 · q / kv.' },
      { type: 'single', q: 'Warum beeinflusst eine Führungsgrößen-Vorsteuerung die Stabilität des Regelkreises nicht?',
        options: ['Weil sie nur bei kleinen Sollwerten wirkt', 'Weil sie außerhalb der Rückführschleife liegt und nur ein zusätzliches Eingangssignal liefert', 'Weil sie den I-Anteil ersetzt', 'Weil sie immer mit Totzeit arbeitet'],
        correct: 1, explain: 'Die Pole des geschlossenen Kreises hängen nur von Regler und Strecke in der Schleife ab.' }
    ],
    exam: [
      { type: 'multi', q: 'Was ist bei der Kombination von Vorsteuerung und PI-Regler zu beachten?',
        options: ['Vorsteuerung vor der Begrenzung addieren', 'Summe aus Vorsteuerung und Regler in die Anti-Windup-Bedingung einbeziehen', 'Den Regler auf den gerampten Sollwert regeln lassen', 'Den I-Anteil abschalten'],
        correct: [0, 1, 2], explain: 'Der I-Anteil bleibt nötig, um Modellfehler stationär auszuregeln.' },
      { type: 'single', q: 'Eine Aufschaltung hat das falsche Vorzeichen. Was beobachtest du?',
        options: ['Die Störung wird doppelt so gut kompensiert', 'Die Störung wirkt verstärkt; der Regler muss die doppelte Abweichung ausregeln', 'Der Regler wird instabil', 'Nichts'],
        correct: 1, explain: 'Die Aufschaltung wirkt in dieselbe Richtung wie die Störung. Weil sie außerhalb der Schleife liegt, bleibt der Kreis stabil, aber die Regelgüte sinkt.' },
      { type: 'numeric', q: 'Der Sollwert eines Füllstands wird mit {r} %/s gerampt; das Modell lautet dL/dt = {kv} · y. Welche Vorsteuerung y_ff in % ist während der Rampe nötig?',
        params: { r: [0.1, 1, 0.1], kv: [0.02, 0.1, 0.01] }, formula: 'r / kv', unit: '%', tol: 0.02,
        explain: 'Inversion des I-Modells: y_ff = (dw/dt) / kv.' }
    ],
    exercises: [exFF]
  },
  // =========================================================================
  {
    id: 'regelung-5-projekt-splitrange', level: 5, kind: 'projekt',
    title: 'Praxisprojekt: Split-Range-Temperierung eines Reaktors',
    summary: 'Ein Regler, zwei Stellglieder: Heizen und Kühlen mit Totzone, Anti-Windup im Bereich −100…+100 % und sicherem Zustand bei Übertemperatur.',
    minutes: 240,
    req: ['regelung-5-vorsteuerung'],
    briefing: 'Viele Prozesse müssen je nach Betriebszustand geheizt oder gekühlt werden: Reaktoren mit exothermer Reaktion, Werkzeugtemperierung, Kunststoffextruder im Hochlauf und im Produktionsbetrieb. Mit der Split-Range-Technik bedient ein einziger Regler beide Stellglieder: Der positive Ausgangsbereich steuert die Heizung, der negative die Kühlung. Du entwirfst die Aufteilung mit Totzone, das Anti-Windup für einen symmetrischen Stellbereich und einen sicheren Zustand, der bei exothermen Prozessen nicht „aus“, sondern „volle Kühlung“ bedeutet.',
    practice: 'mapp Temperature und MTTempController bieten getrennte Heiz- und Kühlausgänge (HeatOut/CoolOut) mit eigenen Parametersätzen – das ist Split-Range in Produktform. Wer das Prinzip selbst programmiert hat, kann diese Bausteine gezielt parametrieren und Fehler im Feld diagnostizieren.',
    transfer: {
      tia: 'PID_Temp von Siemens unterstützt Heizen/Kühlen mit getrennten Ausgängen und einem Kühlfaktor; bei PID_Compact programmierst du die Aufteilung selbst.',
      codesys: 'Der TwinCAT Temperature Controller (TF4110) bietet Heizen/Kühlen; in CODESYS teilst du den Reglerausgang wie in diesem Projekt selbst auf.'
    },
    objectives: [
      {
        id: 'o1', title: 'Entwirf die Split-Range-Kennlinie',
        guide: {
          intro: 'Die Kennlinie legt fest, welcher Reglerausgang zu welcher Heiz- und Kühlleistung führt.',
          steps: [
            'Zeichne die Kennlinie: Reglerausgang −100…+100 % auf der Abszisse, Heizen und Kühlen (0…100 %) auf der Ordinate.',
            'Lege eine Totzone um 0 % fest (hier ±2 %), damit nicht ständig umgeschaltet wird.',
            'Prüfe, ob Heiz- und Kühlleistung gleich stark wirken; sonst braucht der Kühlzweig einen Korrekturfaktor (bei MTTempController eigene Parameter für Cooling).',
            'Lege den sicheren Zustand fest und begründe ihn (exotherm: volle Kühlung; endotherm: Heizung aus).'
          ],
          done: 'Erledigt, wenn Kennlinie, Totzone, Kühlfaktor und sicherer Zustand dokumentiert sind.',
          tip: 'Ist die Kühlung deutlich stärker als die Heizung, wirkt der Regler im Kühlbereich mit höherer Kreisverstärkung und kann schwingen. Dann Kühlfaktor < 1 oder eigener Parametersatz.'
        }
      },
      {
        id: 'o2', title: 'Programmiere Regler, Aufteilung und Anti-Windup',
        guide: {
          intro: 'Der PI-Regler arbeitet im Bereich −100…+100 %; das Anti-Windup muss an beiden Grenzen greifen.',
          steps: [
            'Begrenze den Reglerausgang auf −100…+100 % und passe die Clamping-Bedingung an beide Grenzen an.',
            'Teile den Ausgang mit IF/ELSIF auf Heizen und Kühlen auf; stelle sicher, dass nie beide > 0 sind.',
            'Gib den Reglerausgang zusätzlich zur Diagnose aus (rControllerOut) – im Trace sieht man so sofort, in welchem Bereich gearbeitet wird.',
            'Für die Heizung kannst du den PWM-Ausgang aus dem Senior-Projekt (oder MTBasicsPWM) wiederverwenden.'
          ],
          done: 'Erledigt, wenn der Regler beim Einsetzen der Reaktion stoßfrei von Heizen auf Kühlen wechselt und nie beide Stellglieder gleichzeitig aktiv sind.',
          tip: 'Bei Kühlventilen mit Mindestöffnung (z. B. 5 %) entsteht eine zweite Totzone – plane sie in die Kennlinie ein.'
        }
      },
      {
        id: 'o3', title: 'Sichere die Anlage bei Übertemperatur ab',
        guide: {
          intro: 'Die Software-Überwachung bringt den Prozess in einen definierten Zustand und verhindert ein Wiederanlaufen ohne Prüfung.',
          steps: [
            'Prüfe die Temperatur vor dem Regler und speichere die Störung.',
            'Setze im Störzustand Heizung 0 % und Kühlung 100 %, lösche den I-Anteil.',
            'Erlaube das Quittieren erst 10 K unter der Grenze und melde die Störung über mapp AlarmX.',
            'Halte fest, welche Sicherheitsfunktionen zusätzlich in Hardware bzw. als Sicherheitsfunktion (mapp Safety) umgesetzt werden müssen – diese Software-Überwachung ist keine Sicherheitsfunktion im Sinne der funktionalen Sicherheit.'
          ],
          done: 'Erledigt, wenn die Überwachung bei 90 °C auslöst, voll kühlt und erst unter 80 °C quittierbar ist.',
          tip: 'Teste den Störzustand immer auch mit „verklemmter“ Heizung (Heizausgang bleibt an) – die Kühlung muss den Prozess trotzdem abfangen können.'
        }
      },
      {
        id: 'o4', title: 'Vergleiche deine Lösung mit mapp Temperature',
        guide: {
          intro: 'mapp Temperature (MpTempController) und MTTemp (MTTempController, MTTempTuning) bieten Heizen/Kühlen, Tuning und Überwachung als Produkt.',
          steps: [
            'Lies das Konzept von mapp Temperature und den Anwendungsfall zum Step-Tuning.',
            'Notiere, welche Ein-/Ausgänge (HeatOut/CoolOut, MaxHeatOut/MaxCoolOut, FeedForward) deiner Lösung entsprechen.',
            'Bewerte: Wann setzt du die eigene Lösung ein, wann das Produkt (Lizenz, Diagnose, Tuning, Wartbarkeit)?',
            'Committe dein Projekt mit Abnahmeprotokoll (Trace: Aufheizen, Reaktionsstart, Übertemperatur) und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn dein Vergleich und das Abnahmeprotokoll vorliegen.',
          tip: 'Für eine Maschine mit vielen Zonen ist die Produktlösung fast immer wirtschaftlicher: Tuning, Gruppenleistungsbegrenzung und Heizstromüberwachung sind fertig.',
          link: { label: 'B&R Help: mapp Temperature – Konzept', url: url.mtTempConcept }
        }
      }
    ],
    videos: [
      vid('splitRange', 'Erklärt die Split-Range-Technik mit Ventilkennlinien aus der Verfahrenstechnik (englisch).'),
      vid('buchholzSimOpt', 'Regleroptimierung mit Simulation – Vorgehen, das du bei der Parametrierung des Split-Range-Reglers anwendest.')
    ],
    readings: [
      R.br('mapp Temperature – Konzept', url.mtTempConcept, 'Überblick über Heiz-/Kühlregelung, Tuning, Leistungsbegrenzung und Heizstromüberwachung in mapp Temperature.', 10),
      R.br('MTTempController', url.mtTempController, 'Schnittstelle mit getrennten Heiz- und Kühlparametern, MaxHeatOut/MaxCoolOut und Vorsteuereingängen.', 15),
      R.samsonL102('Abschnitte zu Dreipunktreglern und Reglerauswahl – Grundlage für Heizen/Kühlen mit zwei Stellgliedern.', 15)
    ],
    quiz: [
      { type: 'single', q: 'Wozu dient die Totzone in einer Split-Range-Regelung?',
        options: ['Sie erhöht die Regelgenauigkeit', 'Sie verhindert ständiges Umschalten zwischen Heizen und Kühlen um y ≈ 0', 'Sie ersetzt das Anti-Windup', 'Sie begrenzt die Heizleistung'],
        correct: 1, explain: 'Ohne Totzone würde schon kleines Rauschen um 0 % abwechselnd Heizung und Kühlung ansteuern.' },
      { type: 'numeric', q: 'Der Split-Range-Regler gibt y = {y} % aus, die Totzone beträgt ±2 %. Wie groß ist die Kühlleistung in % (nach der Aufteilung der Übung)?',
        params: { y: [-100, -5, 5] }, formula: '-y', unit: '%', tol: 0.01,
        explain: 'Für y < −2 % gilt Kühlen = −y, Heizen = 0.' },
      { type: 'single', q: 'Welcher sichere Zustand ist bei einer exothermen Reaktion und Übertemperatur sinnvoll?',
        options: ['Heizung und Kühlung aus', 'Heizung aus, Kühlung 100 %', 'Heizung 100 %, Kühlung aus', 'Regler in Handbetrieb mit letzter Stellgröße'],
        correct: 1, explain: 'Die Reaktion erzeugt selbst Wärme; nur aktive Kühlung verhindert ein Durchgehen.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Ausgänge bzw. Parameter besitzt MTTempController für Heizen/Kühlen?',
        options: ['HeatOut und CoolOut', 'MaxHeatOut und MaxCoolOut', 'FeedForwardHeat und FeedForwardCool', 'TrackingValue und EnableTracking'],
        correct: [0, 1, 2], explain: 'Tracking gehört zur Schnittstelle von MTBasicsPID, nicht zu MTTempController.' },
      { type: 'single', q: 'Warum muss das Anti-Windup eines Split-Range-Reglers an beiden Grenzen (−100 % und +100 %) wirken?',
        options: ['Weil sonst die Totzone nicht funktioniert', 'Weil auch bei voller Kühlung der I-Anteil weiter in negative Richtung aufziehen kann', 'Weil MTBasicsPID das verlangt', 'Das ist nicht nötig'],
        correct: 1, explain: 'Beide Stellglieder können in die Begrenzung laufen; Windup tritt in beiden Richtungen auf.' },
      { type: 'single', q: 'Die Kühlung wirkt dreimal stärker als die Heizung. Was ist die Folge, wenn ein gemeinsamer Parametersatz verwendet wird?',
        options: ['Im Kühlbetrieb ist die Kreisverstärkung dreimal höher – Schwingneigung', 'Der Regler wird im Kühlbetrieb träger', 'Keine Auswirkung', 'Der Regler schaltet nicht mehr auf Kühlen um'],
        correct: 0, explain: 'Abhilfe: Kühlfaktor oder getrennte Parametersätze für Heizen und Kühlen.' }
    ],
    exercises: [exSplit],
    proof: true,
    badge: 'Split-Range-Architekt'
  },
  // =========================================================================
  {
    id: 'regelung-5-identifikation', level: 5, kind: 'zusatz',
    title: 'Streckenidentifikation und zeitdiskrete Regler',
    summary: 'Modelle aus Messdaten gewinnen (Zweipunktmethode, MTIdentify) und Regler im richtigen Abtastraster betreiben.',
    minutes: 180,
    req: ['regelung-4-einstellregeln'],
    briefing: 'Einstellregeln und modellbasierte Verfahren brauchen ein Streckenmodell. Statt Tu und Tg mit dem Lineal abzulesen, kann die SPS den Sprungversuch selbst aufzeichnen und auswerten – reproduzierbar und unabhängig vom Inbetriebnehmer. Gleichzeitig ist jeder SPS-Regler ein Abtastregler: Er sieht die Regelgröße nur zu diskreten Zeitpunkten und hält seine Stellgröße dazwischen konstant. Du lernst, welche Abtastzeit ein Regelkreis braucht, wie du einen Regler in einem langsameren Raster betreibst und welche Fehler bei der Diskretisierung typisch sind.',
    practice: 'Bei Serienmaschinen mit vielen gleichartigen Zonen spart eine automatische Identifikation Stunden bei jeder Inbetriebnahme. Und wer weiß, warum ein Regler nach dem Verschieben in eine andere Taskklasse plötzlich schwingt, findet diesen Fehler in Minuten statt Tagen.',
    transfer: {
      tia: 'In TIA Portal laufen Regler in Weckalarm-OBs (OB30 ff.) mit fester Abtastzeit; PID_Compact misst die Abtastzeit selbst. Identifikation bietet die Optimierung von PID_Compact.',
      codesys: 'In TwinCAT laufen Regler in eigenen Tasks mit fester Zykluszeit; die Controller Toolbox erwartet die Zykluszeit als Parameter (tTaskCycleTime, tCtrlCycleTime).'
    },
    objectives: [
      {
        id: 'o1', title: 'Identifiziere eine PT1-Tt-Strecke mit der Zweipunktmethode',
        guide: {
          intro: 'Für eine PT1-Tt-Strecke gilt: Nach Tt + T/3 sind 28,3 %, nach Tt + T sind 63,2 % des Endwerts erreicht.',
          steps: [
            'Zeichne den Sprungversuch in einem Array auf (Raster deutlich kleiner als die erwartete Zeitkonstante, z. B. 50 ms).',
            'Bestimme Endwert und Änderung; suche die Zeitpunkte t28 und t63.',
            'Berechne T = 1,5 · (t63 − t28), Tt = t63 − T und Ks = Δy/Δu.',
            'Plausibilisiere: Tt ≥ 0, T > 0; sonst ist das Modell PT1-Tt nicht passend (z. B. schwingfähige Strecke).'
          ],
          done: 'Erledigt, wenn dein Programm Ks, T und Tt einer simulierten Strecke auf wenige Prozent genau bestimmt.',
          tip: 'Messrauschen verfälscht die Schwellen-Suche. Glätte die Aufzeichnung vor der Auswertung leicht oder nutze die T-Summen-Methode (Flächenintegral).'
        }
      },
      {
        id: 'o2', title: 'Nutze MTIdentify und die Tuning-Bausteine von mapp Control',
        guide: {
          intro: 'Die mapp Control Tools enthalten mit MTIdentify eine Bibliothek zur Identifikation linearer zeitinvarianter Systeme.',
          steps: [
            'Öffne in der Automation Help die Bibliotheksübersicht „Core“ der mapp Control Tools und lies die Beschreibung von MTIdentify.',
            'Lies die Schnittstelle von **MTIdentifyTransferFcn** und notiere, welche Anregung und welche Ergebnisse (Übertragungsfunktion) der Baustein liefert.',
            'Vergleiche mit MTBasicsStepTuning: Der Tuning-Baustein identifiziert intern ebenfalls ein Modell, gibt aber direkt PID-Parameter aus.',
            'Nutze das identifizierte Modell zur Simulation mit **MTBasicsTransferFcn** bzw. MTBasicsPT1/MTBasicsTimeDelay (Anwendungsfall „Simulation einer Regelstrecke“).'
          ],
          done: 'Erledigt, wenn du beschreiben kannst, welcher B&R-Baustein für Identifikation, Tuning und Simulation jeweils zuständig ist.',
          tip: 'Ein identifiziertes Modell ist so gut wie der Arbeitspunkt, in dem es gemessen wurde. Bei stark nichtlinearen Strecken mehrere Arbeitspunkte identifizieren (Gain Scheduling).',
          link: { label: 'B&R Help: MTIdentifyTransferFcn', url: url.mtIdentify }
        }
      },
      {
        id: 'o3', title: 'Wähle die Abtastzeit und betreibe Regler im richtigen Raster',
        guide: {
          intro: 'Die Abtastzeit des Reglers muss zur Dynamik des geschlossenen Kreises passen und mit dem Wert im Regleralgorithmus übereinstimmen.',
          steps: [
            'Faustregel: Abtastzeit ≤ 1/10 der Zeitkonstante bzw. Anregelzeit des geschlossenen Kreises; bei Totzeitstrecken ≤ Tt/4.',
            'Lege langsame Regler (Temperatur) in eine langsame Taskklasse (z. B. 100 ms) – Konfiguration in der CPU-Software-Konfiguration.',
            'Muss ein Regler in einer schnellen Taskklasse laufen, untersetze ihn mit einem Zähler und rechne nur jeden n-ten Zyklus.',
            'Prüfe nach jeder Änderung der Taskklasse, dass Ts im Regler (oder Parameter wie IntegrationTime bei MTBasicsPID) noch stimmt – mapp-Bausteine ermitteln die Zykluszeit selbst.'
          ],
          done: 'Erledigt, wenn du für drei Regelkreise eine Abtastzeit begründet festgelegt und einen Regler korrekt untersetzt hast.',
          tip: 'Zykluszeitverletzungen und Jitter wirken wie zusätzliche Totzeit. Beobachte die Auslastung der Taskklassen im Profiler, bevor du weitere Regler hinzufügst.',
          link: { label: 'B&R Help: Zyklische Taskklassen', url: url.taskClasses }
        }
      },
      {
        id: 'o4', title: 'Diskretisiere Regler und Filter korrekt',
        guide: {
          intro: 'Der kontinuierliche PID-Regler wird für die SPS durch Differenzengleichungen angenähert.',
          steps: [
            'Vergleiche Euler-vorwärts, Euler-rückwärts und Tustin (Trapezregel) für den I-Anteil.',
            'Schreibe den PI-Regler in Stellungs- und in Geschwindigkeitsform (Δy(k) = Kp · (e(k) − e(k−1)) + Kp · Ts/Tn · e(k)).',
            'Lies im Skript der TU Graz Kap. 8 „Zeitdiskrete Regelkreise“ und notiere, wie die Abtastung die Phasenreserve verringert (ca. Ts/2 zusätzliche Totzeit).',
            'Prüfe numerische Grenzen: Bei REAL (32 Bit) wird ein sehr kleiner Integrationsschritt gegenüber einem großen I-Anteil „verschluckt“.'
          ],
          done: 'Erledigt, wenn du beide Formen des PI-Reglers implementiert und den Einfluss der Abtastzeit erklärt hast.',
          tip: 'Die Geschwindigkeitsform ist ideal für Stellglieder mit eigenem Integrator (z. B. Schrittmotor-Ventile, Dreipunkt-Schrittregler) und für stoßfreies Umschalten.'
        }
      }
    ],
    videos: [
      vid('leuertronikIdent', 'Identifikation dynamischer Systeme anhand der Sprungantwort – Methoden und Auswertung.'),
      vid('leuertronikDigital', 'Abtastregelkreis, zeitdiskrete Beschreibung und quasikontinuierliche Auslegung.'),
      vid('douglasDiscretize', 'Anschauliche englische Erklärung der Diskretisierungsverfahren (Euler, Tustin, ZOH).')
    ],
    readings: [
      R.grazRS('Kap. 8 „Zeitdiskrete Regelkreise“ beschreibt Abtastung, Halteglied und den Entwurf digitaler Regler.', 40, 'Kap. 8'),
      R.hszgBO('Praktikumsanleitung: Ermittlung der Streckenparameter aus der Sprungantwort und Reglerauslegung nach dem Betragsoptimum.', 15),
      R.br('MTIdentifyTransferFcn', url.mtIdentify, 'B&R-Baustein zur Identifikation einer Übertragungsfunktion aus Messdaten.', 15)
    ],
    quiz: [
      { type: 'numeric', q: 'Zweipunktmethode: t28 = {a} s, t63 = {b} s. Wie groß ist die Zeitkonstante T?',
        params: { a: [1, 10, 0.5], b: [12, 30, 1] }, formula: '1.5 * (b - a)', unit: 's', tol: 0.01,
        explain: 'T = 1,5 · (t63 − t28), Tt = t63 − T.' },
      { type: 'single', q: 'Ein Regler wurde mit Ts = 0,1 s ausgelegt, läuft aber jeden 10-ms-Zyklus mit Ts = 0,1 s in der Formel. Was passiert?',
        options: ['Nichts', 'Der I-Anteil integriert zehnmal zu schnell; der Kreis wird schwingfreudig', 'Der Regler wird zehnmal langsamer', 'Der D-Anteil wird null'],
        correct: 1, explain: 'Pro Sekunde wird zehnmal häufiger Kp/Tn · e · 0,1 addiert als vorgesehen – das entspricht Tn/10.' },
      { type: 'single', q: 'Welche Faustregel gilt für die Abtastzeit eines Regelkreises?',
        options: ['Abtastzeit = Zeitkonstante der Strecke', 'Abtastzeit ≤ 1/10 der Zeitkonstante des geschlossenen Kreises', 'Abtastzeit so groß wie möglich', 'Abtastzeit immer 1 ms'],
        correct: 1, explain: 'Bei deutlich kleinerer Abtastzeit verhält sich der digitale Regler quasikontinuierlich.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine PT1-Tt-Strecke hat T = {T} s und Tt = {Tt} s. Nach welcher Zeit nach dem Sprung sind 28,3 % des Endwerts erreicht?',
        params: { T: [3, 30, 3], Tt: [1, 10, 1] }, formula: 'Tt + T / 3', unit: 's', tol: 0.02,
        explain: '1 − e^(−1/3) ≈ 0,283. Also t28 = Tt + T/3.' },
      { type: 'single', q: 'Welche Form des PI-Reglers berechnet die Änderung der Stellgröße pro Abtastschritt?',
        options: ['Stellungsform', 'Geschwindigkeitsform (inkrementelle Form)', 'Serienform', 'Parallelform'],
        correct: 1, explain: 'Die Geschwindigkeitsform liefert Δy(k); die Stellgröße entsteht durch Aufsummieren (im Regler oder im Stellglied).' },
      { type: 'multi', q: 'Welche Effekte verursacht eine zu große Abtastzeit?',
        options: ['Zusätzliche Phasenverschiebung (ca. Ts/2 Totzeit)', 'Geringere Stabilitätsreserve', 'Späte Reaktion auf Störungen', 'Höhere Auflösung der Stellgröße'],
        correct: [0, 1, 2], explain: 'Das Halteglied wirkt wie eine Totzeit von etwa Ts/2.' }
    ],
    exercises: [exIdent, exDiscrete]
  }
];
