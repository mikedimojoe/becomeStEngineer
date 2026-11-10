'use strict';
const { L, brHelp, helpLink, fhnw, community, R, vid } = require('./common');

// ─────────────────────────────────────────────── M10 · Kaskadenregelung
const CAS_VAR = L(
  'VAR CONSTANT',
  '\tKV : REAL := 20.0;        (* Lageregler-Verstärkung [1/s] *)',
  '\tKP : REAL := 0.2;         (* Drehzahlregler-Verstärkung [A/(mm/s)] *)',
  '\tTN : REAL := 0.04;        (* Nachstellzeit Drehzahlregler [s] *)',
  '\tV_MAX : REAL := 300.0;    (* Geschwindigkeitsbegrenzung [mm/s] *)',
  '\tI_MAX : REAL := 10.0;     (* Strombegrenzung [A] *)',
  '\tCYCLE_T : REAL := 0.002;  (* Reglertakt [s] *)',
  'END_VAR',
  'VAR',
  '\trVelSet : REAL;           (* Ausgang Lageregler = Sollgeschwindigkeit *)',
  '\trVelErr : REAL;',
  '\trInt : REAL;              (* I-Anteil Drehzahlregler [A] *)',
  '\trCurUnl : REAL;           (* Strom vor der Begrenzung *)',
  'END_VAR'
);
const CAS_START = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\t(* Erste Version: P-Lageregler und P-Drehzahlregler, ohne Begrenzungen *)',
  '\trVelSet := KV * (rPosSet - rPosAct);',
  '\trVelErr := rVelSet - rVelAct;',
  '\trCurrentSet := KP * rVelErr;',
  'END_PROGRAM'
);
const CAS_SOL = L(
  'PROGRAM _INIT',
  '\trInt := 0.0;',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\t(* Lageregler (P) mit Geschwindigkeitsbegrenzung *)',
  '\trVelSet := LIMIT(-V_MAX, KV * (rPosSet - rPosAct), V_MAX);',
  '',
  '\t(* Drehzahlregler (PI) *)',
  '\trVelErr := rVelSet - rVelAct;',
  '\trCurUnl := KP * rVelErr + rInt;',
  '\trCurrentSet := LIMIT(-I_MAX, rCurUnl, I_MAX);',
  '',
  '\t(* Anti-Windup: nur integrieren, wenn nicht in der Begrenzung',
  '\t   oder wenn der Fehler aus der Begrenzung herausführt *)',
  '\tIF (rCurUnl = rCurrentSet) OR (rCurUnl > I_MAX AND rVelErr < 0.0) OR (rCurUnl < -I_MAX AND rVelErr > 0.0) THEN',
  '\t\trInt := rInt + KP / TN * rVelErr * CYCLE_T;',
  '\tEND_IF',
  'END_PROGRAM'
);
const CAS_IO = [
  { name: 'rPosSet', type: 'REAL', dir: 'in', label: 'Sollposition', widget: 'slider', min: 0, max: 1000, unit: 'mm' },
  { name: 'rLoadCur', type: 'REAL', dir: 'in', label: 'Lastmoment (als Strom)', widget: 'slider', min: -5, max: 5, unit: 'A' },
  { name: 'rPosAct', type: 'REAL', dir: 'in', label: 'Istposition (Geber)', widget: 'value', unit: 'mm' },
  { name: 'rVelAct', type: 'REAL', dir: 'in', label: 'Istgeschwindigkeit', widget: 'value', unit: 'mm/s' },
  { name: 'rCurrentSet', type: 'REAL', dir: 'out', label: 'Sollstrom', widget: 'gauge', min: -10, max: 10, unit: 'A' }
];
const CAS_PLANT = {
  var: L('VAR', '\trCurAct : REAL;', 'END_VAR'),
  code: L(
    '(* Stromregler ideal, Endstufe begrenzt auf 10 A; Mechanik: 500 mm/s² je A *)',
    'rCurAct := LIMIT(-10.0, rCurrentSet, 10.0);',
    'rVelAct := rVelAct + 500.0 * (rCurAct - rLoadCur) * PLANT_DT;',
    'rPosAct := rPosAct + rVelAct * PLANT_DT;'
  )
};

// ─────────────────────────────────────────────── M11 · Dimensionierung
const DIM_VAR = L(
  'VAR',
  '\trJTot : REAL;      (* auf den Motor reduziertes Gesamtträgheitsmoment [kgm²] *)',
  '\trAlphaMot : REAL;  (* Winkelbeschleunigung am Motor [rad/s²] *)',
  'END_VAR'
);
const DIM_TRAP = [
  '\t(* Bewegungsprofil an der Last *)',
  '\tbTriangle := FALSE;',
  '\trVPeak := rVmax;',
  '\trTAcc := rVmax / rAcc;',
  '\trTMove := rDist / rVmax + rVmax / rAcc;'
];
const DIM_START = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  ...DIM_TRAP,
  '\t(* TODO: Dreiecksprofil, wenn vmax nicht erreicht wird',
  '\t   TODO: Moment, Trägheitsverhältnis, Effektivmoment *)',
  'END_PROGRAM'
);
const DIM_SOL = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\t(* Bewegungsprofil an der Last: Trapez oder Dreieck *)',
  '\tIF rDist <= rVmax * rVmax / rAcc THEN',
  '\t\tbTriangle := TRUE;',
  '\t\trVPeak := SQRT(rDist * rAcc);',
  '\t\trTAcc := rVPeak / rAcc;',
  '\t\trTMove := 2.0 * rTAcc;',
  '\tELSE',
  '\t\tbTriangle := FALSE;',
  '\t\trVPeak := rVmax;',
  '\t\trTAcc := rVmax / rAcc;',
  '\t\trTMove := rDist / rVmax + rVmax / rAcc;',
  '\tEND_IF',
  '',
  '\t(* Last über das Getriebe auf den Motor reduzieren: J_L / i² *)',
  '\trJTot := rJMotor + rJLoad / (rGear * rGear);',
  '\trAlphaMot := rAcc * rGear;',
  '\trTorqueAcc := rJTot * rAlphaMot;',
  '\trInertiaRatio := rJLoad / (rGear * rGear) / rJMotor;',
  '\tdoRatioOk := rInertiaRatio <= 10.0;',
  '',
  '\t(* Effektivmoment über ein Spiel: Beschleunigen + Bremsen mit gleichem Betrag, Rest 0 Nm *)',
  '\trTorqueRms := SQRT(2.0 * rTorqueAcc * rTorqueAcc * rTAcc / (rTMove + rDwell));',
  'END_PROGRAM'
);
const DIM_IO = [
  { name: 'rDist', type: 'REAL', dir: 'in', label: 'Weg (Last)', widget: 'slider', min: 0.1, max: 20, unit: 'rad', init: 10 },
  { name: 'rVmax', type: 'REAL', dir: 'in', label: 'max. Geschwindigkeit (Last)', widget: 'slider', min: 0.5, max: 20, unit: 'rad/s', init: 5 },
  { name: 'rAcc', type: 'REAL', dir: 'in', label: 'Beschleunigung (Last)', widget: 'slider', min: 1, max: 100, unit: 'rad/s²', init: 10 },
  { name: 'rJLoad', type: 'REAL', dir: 'in', label: 'Trägheitsmoment Last', widget: 'value', unit: 'kgm²', init: 0.05 },
  { name: 'rJMotor', type: 'REAL', dir: 'in', label: 'Trägheitsmoment Motor', widget: 'value', unit: 'kgm²', init: 0.001 },
  { name: 'rGear', type: 'REAL', dir: 'in', label: 'Getriebe i', widget: 'slider', min: 1, max: 20, init: 5 },
  { name: 'rDwell', type: 'REAL', dir: 'in', label: 'Pause je Spiel', widget: 'slider', min: 0, max: 5, unit: 's', init: 0.5 },
  { name: 'bTriangle', type: 'BOOL', dir: 'out', label: 'Dreiecksprofil', widget: 'led' },
  { name: 'rVPeak', type: 'REAL', dir: 'out', label: 'Spitzengeschwindigkeit', widget: 'value', unit: 'rad/s' },
  { name: 'rTAcc', type: 'REAL', dir: 'out', label: 'Beschleunigungszeit', widget: 'value', unit: 's' },
  { name: 'rTMove', type: 'REAL', dir: 'out', label: 'Fahrzeit', widget: 'value', unit: 's' },
  { name: 'rTorqueAcc', type: 'REAL', dir: 'out', label: 'Beschleunigungsmoment Motor', widget: 'value', unit: 'Nm' },
  { name: 'rInertiaRatio', type: 'REAL', dir: 'out', label: 'Trägheitsverhältnis', widget: 'value' },
  { name: 'doRatioOk', type: 'BOOL', dir: 'out', label: 'Verhältnis ≤ 10', widget: 'led' },
  { name: 'rTorqueRms', type: 'REAL', dir: 'out', label: 'Effektivmoment', widget: 'value', unit: 'Nm' }
];

// ─────────────────────────────────────────────── M12 · Zwei Achsen auf einer Geraden
const XY_TYP = L(
  'TYPE',
  '\teXyState : (XY_OFF := 0, XY_HOME := 10, XY_READY := 20, XY_MOVE := 30);',
  'END_TYPE'
);
const XY_VAR = L(
  'VAR CONSTANT',
  '\tV_PATH : REAL := 200.0;    (* Bahngeschwindigkeit [mm/s] *)',
  '\tA_PATH : REAL := 1000.0;   (* Bahnbeschleunigung [mm/s²] *)',
  '\tEPS : REAL := 0.001;       (* kleinste sinnvolle Achsbewegung [mm] *)',
  'END_VAR',
  'VAR',
  '\tAxisX : MpAxisBasic;',
  '\tAxisY : MpAxisBasic;',
  '\tParX : MpAxisBasicParType;',
  '\tParY : MpAxisBasicParType;',
  '\teXy : eXyState;',
  '\trtGo : R_TRIG;',
  '\trDx : REAL;',
  '\trDy : REAL;',
  '\trLen : REAL;',
  '\tbMoveX : BOOL;',
  '\tbMoveY : BOOL;',
  'END_VAR'
);
const XY_HEAD = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\trtGo(CLK := diGo);',
  '\tIF NOT diPower THEN',
  '\t\teXy := XY_OFF;',
  '\tEND_IF',
  '',
  '\tCASE eXy OF',
  '\t\tXY_OFF:',
  '\t\t\tAxisX.MoveAbsolute := FALSE;',
  '\t\t\tAxisY.MoveAbsolute := FALSE;',
  '\t\t\tIF diPower AND AxisX.PowerOn AND AxisY.PowerOn THEN',
  '\t\t\t\teXy := XY_HOME;',
  '\t\t\tEND_IF',
  '',
  '\t\tXY_HOME:',
  '\t\t\tAxisX.Home := NOT AxisX.IsHomed;',
  '\t\t\tAxisY.Home := NOT AxisY.IsHomed;',
  '\t\t\tIF AxisX.IsHomed AND AxisY.IsHomed THEN',
  '\t\t\t\tAxisX.Home := FALSE;',
  '\t\t\t\tAxisY.Home := FALSE;',
  '\t\t\t\teXy := XY_READY;',
  '\t\t\tEND_IF',
  ''
);
const XY_TAIL = L(
  '\tEND_CASE',
  '',
  '\tAxisX.Enable := TRUE;',
  '\tAxisX.Parameters := ADR(ParX);',
  '\tAxisX.Power := diPower;',
  '\tAxisX();',
  '\tAxisY.Enable := TRUE;',
  '\tAxisY.Parameters := ADR(ParY);',
  '\tAxisY.Power := diPower;',
  '\tAxisY();',
  '',
  '\tdoReady := (eXy = XY_READY);',
  '\tdoError := AxisX.Error OR AxisY.Error;',
  '\trPosX := LREAL_TO_REAL(AxisX.Position);',
  '\trPosY := LREAL_TO_REAL(AxisY.Position);',
  'END_PROGRAM'
);
const XY_START = XY_HEAD + L(
  '\t\tXY_READY:',
  '\t\t\tIF rtGo.Q THEN',
  '\t\t\t\t(* Erste Version: beide Achsen mit voller Geschwindigkeit -> keine Gerade! *)',
  '\t\t\t\tParX.Position := rTargetX; ParX.Velocity := V_PATH; ParX.Acceleration := A_PATH; ParX.Deceleration := A_PATH;',
  '\t\t\t\tParY.Position := rTargetY; ParY.Velocity := V_PATH; ParY.Acceleration := A_PATH; ParY.Deceleration := A_PATH;',
  '\t\t\t\tAxisX.MoveAbsolute := TRUE;',
  '\t\t\t\tAxisY.MoveAbsolute := TRUE;',
  '\t\t\t\teXy := XY_MOVE;',
  '\t\t\tEND_IF',
  '',
  '\t\tXY_MOVE:',
  '\t\t\tIF AxisX.InPosition AND AxisY.InPosition THEN',
  '\t\t\t\tAxisX.MoveAbsolute := FALSE;',
  '\t\t\t\tAxisY.MoveAbsolute := FALSE;',
  '\t\t\t\tdoInPos := TRUE;',
  '\t\t\t\teXy := XY_READY;',
  '\t\t\tEND_IF'
) + XY_TAIL;
const XY_SOL = XY_HEAD + L(
  '\t\tXY_READY:',
  '\t\t\tIF rtGo.Q THEN',
  '\t\t\t\trDx := rTargetX - LREAL_TO_REAL(AxisX.Position);',
  '\t\t\t\trDy := rTargetY - LREAL_TO_REAL(AxisY.Position);',
  '\t\t\t\trLen := SQRT(rDx * rDx + rDy * rDy);',
  '\t\t\t\tbMoveX := ABS(rDx) > EPS;',
  '\t\t\t\tbMoveY := ABS(rDy) > EPS;',
  '\t\t\t\tIF bMoveX OR bMoveY THEN',
  '\t\t\t\t\t(* Bahnwerte anteilig auf die Achsen verteilen: gleiches Zeitprofil -> Gerade *)',
  '\t\t\t\t\tParX.Position := rTargetX;',
  '\t\t\t\t\tParX.Velocity := V_PATH * ABS(rDx) / rLen;',
  '\t\t\t\t\tParX.Acceleration := A_PATH * ABS(rDx) / rLen;',
  '\t\t\t\t\tParX.Deceleration := ParX.Acceleration;',
  '\t\t\t\t\tParY.Position := rTargetY;',
  '\t\t\t\t\tParY.Velocity := V_PATH * ABS(rDy) / rLen;',
  '\t\t\t\t\tParY.Acceleration := A_PATH * ABS(rDy) / rLen;',
  '\t\t\t\t\tParY.Deceleration := ParY.Acceleration;',
  '\t\t\t\t\t(* Achse ohne Bewegung nicht kommandieren: v = 0 wäre ein ungültiger Parameter *)',
  '\t\t\t\t\tAxisX.MoveAbsolute := bMoveX;',
  '\t\t\t\t\tAxisY.MoveAbsolute := bMoveY;',
  '\t\t\t\t\tdoInPos := FALSE;',
  '\t\t\t\t\teXy := XY_MOVE;',
  '\t\t\t\tEND_IF',
  '\t\t\tEND_IF',
  '',
  '\t\tXY_MOVE:',
  '\t\t\tIF (AxisX.InPosition OR NOT bMoveX) AND (AxisY.InPosition OR NOT bMoveY) THEN',
  '\t\t\t\tAxisX.MoveAbsolute := FALSE;',
  '\t\t\t\tAxisY.MoveAbsolute := FALSE;',
  '\t\t\t\tdoInPos := TRUE;',
  '\t\t\t\teXy := XY_READY;',
  '\t\t\tEND_IF'
) + XY_TAIL;
const XY_IO = [
  { name: 'diPower', type: 'BOOL', dir: 'in', label: 'Schalter Achsen ein', widget: 'switch' },
  { name: 'diGo', type: 'BOOL', dir: 'in', label: 'Taster Fahren', widget: 'button' },
  { name: 'rTargetX', type: 'REAL', dir: 'in', label: 'Ziel X', widget: 'slider', min: 0, max: 400, unit: 'mm' },
  { name: 'rTargetY', type: 'REAL', dir: 'in', label: 'Ziel Y', widget: 'slider', min: 0, max: 400, unit: 'mm' },
  { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Bereit', widget: 'led' },
  { name: 'doInPos', type: 'BOOL', dir: 'out', label: 'Ziel erreicht', widget: 'led' },
  { name: 'doError', type: 'BOOL', dir: 'out', label: 'Achsfehler', widget: 'led' },
  { name: 'rPosX', type: 'REAL', dir: 'out', label: 'Position X', widget: 'gauge', min: 0, max: 400, unit: 'mm' },
  { name: 'rPosY', type: 'REAL', dir: 'out', label: 'Position Y', widget: 'gauge', min: 0, max: 400, unit: 'mm' }
];
const goXY = (x, y) => [{ set: { rTargetX: x, rTargetY: y, diGo: true } }, { cycles: 2 }, { set: { diGo: false } }];

module.exports = [
  // ───────────────────────────────────────────── Level 5 · Modul 1
  {
    id: 'motion-5-regelkreise',
    level: 5,
    kind: 'lektion',
    title: 'Regelkreise im Antrieb: Kaskade, Tuning, Schwingungen',
    summary: 'Du verstehst die Kaskade aus Strom-, Drehzahl- und Lageregler, stellst sie systematisch ein, erkennst Schwingungen und Resonanzen und programmierst eine Kaskade mit Begrenzungen und Anti-Windup.',
    minutes: 270,
    req: ['motion-4-fliegende-saege'],
    briefing: 'Ein Servoantrieb regelt in drei geschachtelten Kreisen: Der Stromregler (innen, sehr schnell, typ. im 50–100-µs-Takt) prägt das Moment ein, der Drehzahlregler (PI) hält die Sollgeschwindigkeit, der Lageregler (meist P mit Vorsteuerung) sorgt für die Position. Jeder äußere Kreis muss deutlich langsamer sein als der innere. Begrenzungen (Strom, Geschwindigkeit) gehören an die Schnittstellen der Kreise, und ein I-Anteil braucht Anti-Windup, sonst schießt die Achse nach jeder Sättigung über. Lastträgheit, Elastizitäten (Kupplung, Zahnriemen) und Getriebespiel begrenzen die erreichbare Dynamik und führen zu Schwingungen, die mit Filtern (z. B. Bandsperre) und angepasstem Tuning behandelt werden.',
    practice: 'Ein „brummender“ Antrieb, Schleppfehlerabschaltungen bei hoher Last oder Schwingungen beim Positionieren sind typische Servicefälle. Wer die Kaskade versteht, liest die Ursache im Trace ab statt Parameter zu raten.',
    transfer: {
      tia: 'SINAMICS S120/S210: Kaskade mit Stromregler, Drehzahlregler (PI) und Lageregler im TO bzw. Antrieb; Optimierung über die One-Button-Tuning-Funktion und Messfunktionen (Bode-Diagramm).',
      codesys: 'Bei EtherCAT-Antrieben (z. B. Beckhoff AX8000) liegt die Kaskade im Antrieb, der Lageregler wahlweise in der NC; Tuning mit Drive Manager 2 inkl. Frequenzganganalyse.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre den Aufbau der Reglerkaskade',
        guide: {
          intro: 'Die Kaskade trennt schnelle elektrische und langsamere mechanische Vorgänge.',
          steps: [
            'Lies im FHNW-Skript „Betriebsarten und Regelstrukturen“ und zeichne die drei Kreise mit Sollwert, Istwert und Begrenzung.',
            'Notiere: Bandbreite nimmt von innen nach außen ab (Strom > Drehzahl > Lage).',
            'Lageregler: P-Regler, Ausgang = Sollgeschwindigkeit; Kv-Faktor in 1/s.',
            'Drehzahlregler: PI, Ausgang = Sollstrom (Moment).',
            'Vorsteuerung: Geschwindigkeits- und Beschleunigungsvorsteuerung aus dem Profilgenerator reduzieren den Schleppfehler.'
          ],
          done: 'Erledigt, wenn du die Kaskade aus dem Gedächtnis zeichnen und die Rolle jeder Begrenzung erklären kannst.',
          tip: 'Bei reinem P-Lageregler ist der Schleppfehler bei konstanter Fahrt v/Kv. Mit Vorsteuerung geht er gegen null.'
        }
      },
      {
        id: 'o2',
        title: 'Stelle die Kaskade systematisch ein',
        guide: {
          intro: 'Tuning erfolgt immer von innen nach außen.',
          steps: [
            'Stromregler: bei B&R-Motoren aus den Motordaten, nicht verändern.',
            'Drehzahlregler: Verstärkung erhöhen bis zur Schwinggrenze, dann zurücknehmen; Nachstellzeit so klein wie stabil möglich.',
            'Lageregler: Kv erhöhen, bis Überschwingen auftritt; Vorsteuerung aktivieren.',
            'Mit dem B&R-Autotuning (mapp Cockpit) diese Schritte automatisiert durchführen und Ergebnis im Trace prüfen.'
          ],
          done: 'Erledigt, wenn du die Tuning-Reihenfolge und das jeweilige Abbruchkriterium nennen kannst.',
          tip: 'Ändere immer nur einen Parameter und zeichne vorher und nachher einen Trace auf.',
          link: helpLink('posCtrl', 'Lageregler (Autotuning)')
        }
      },
      {
        id: 'o3',
        title: 'Erkenne Schwingungen, Resonanzen und Lastträgheitsprobleme',
        guide: {
          intro: 'Die Mechanik ist nie ideal steif.',
          steps: [
            'Hochfrequentes Pfeifen/Brummen: meist mechanische Resonanz, die der Drehzahlregler anregt → Bandsperre/Filter, Verstärkung reduzieren.',
            'Niederfrequentes Pendeln beim Positionieren: zu hohes Kv oder zu großes Trägheitsverhältnis.',
            'Trägheitsverhältnis λ = J_Last,red / J_Motor: große Werte machen die Regelung empfindlich – Getriebe anpassen oder größeren Motor wählen.',
            'Sieh dir das Yaskawa-Video zu Resonanzen an und notiere die Gegenmaßnahmen.'
          ],
          done: 'Erledigt, wenn du zu drei Symptomen (Pfeifen, Pendeln, Schleppfehler unter Last) Ursache und Gegenmaßnahme nennen kannst.',
          tip: 'Ein FFT-/Frequenzgangtest in mapp Cockpit zeigt Resonanzen als Spitzen – schneller als Probieren.'
        }
      },
      {
        id: 'o4',
        title: 'Programmiere eine Kaskade mit Begrenzung und Anti-Windup',
        guide: {
          intro: 'In der Übung regelst du eine simulierte Mechanik selbst – so siehst du die Effekte, die im Antrieb verborgen sind.',
          steps: [
            'Begrenze den Lagereglerausgang auf V_MAX.',
            'Ergänze den I-Anteil im Drehzahlregler (Ki = KP / TN).',
            'Begrenze den Strom auf I_MAX.',
            'Integriere nur, wenn der Regler nicht in der Begrenzung ist (bedingte Integration).',
            'Teste mit Lastmoment: Ohne I-Anteil bleibt eine Lageabweichung.'
          ],
          done: 'Erledigt, wenn die Übung „Kaskadenregler“ alle Tests besteht.',
          tip: 'Rechne die bleibende Regelabweichung ohne I-Anteil nach: Last 2 A → Drehzahlfehler 2 A / 0,2 = 10 mm/s → Lagefehler 10 / Kv = 0,5 mm.'
        }
      }
    ],
    videos: [
      vid('griesRegelung', 'Deutsche Hochschulvorlesung: Moment-, Drehzahl- und Lageregelung am Beispiel der Gleichstrommaschine.'),
      vid('kaskade', 'Kompakte Erklärung der Kaskadenregelung aus einer Regelungstechnik-Vorlesung.'),
      vid('resonance', 'Praxisvideo eines Antriebsherstellers: Resonanzen erkennen und durch Tuning beseitigen.')
    ],
    readings: [
      fhnw('betriebsarten-und-regelstrukturen', 'Betriebsarten und Regelstrukturen', 35, 'Hochschulskript: Kaskade aus Strom-, Drehzahl- und Lageregelung, Bandbreiten und Vorsteuerung.'),
      R.hawThesis,
      R.paderborn
    ],
    quiz: [
      { type: 'single', q: 'In welcher Reihenfolge nehmen die Bandbreiten der Regelkreise ab?', options: ['Lage > Drehzahl > Strom', 'Strom > Drehzahl > Lage', 'Alle gleich', 'Drehzahl > Strom > Lage'], correct: 1, explain: 'Der innere Kreis muss schneller sein als der äußere, sonst wird die Kaskade instabil.' },
      { type: 'numeric', q: 'Eine Achse fährt mit {v} mm/s, der Lageregler hat Kv = 20 1/s, keine Vorsteuerung. Wie groß ist der Schleppfehler?', params: { v: [100, 1000, 100] }, formula: 'v / 20', unit: 'mm', tol: 0.01, explain: 'Bei P-Lageregler ohne Vorsteuerung: Schleppfehler = v / Kv.' },
      { type: 'single', q: 'Was verhindert Anti-Windup?', options: ['Dass der Strom begrenzt wird', 'Dass der I-Anteil während der Begrenzung weiter aufintegriert und danach Überschwingen verursacht', 'Dass die Achse referenziert', 'Dass der P-Anteil wirkt'], correct: 1, explain: 'In der Begrenzung wirkt der Regler nicht; ein weiter wachsender I-Anteil muss danach erst wieder abgebaut werden.' }
    ],
    exam: [
      { type: 'numeric', q: 'Last J_L = {j} kgm², Getriebe i = 4, Motor J_M = 0,002 kgm². Wie groß ist das Trägheitsverhältnis?', params: { j: [0.016, 0.32, 0.016] }, formula: 'j / 16 / 0.002', unit: '', tol: 0.01, explain: 'λ = (J_L / i²) / J_M.' },
      { type: 'single', q: 'Ein Antrieb pfeift hochfrequent, sobald er eingeschaltet ist. Wahrscheinlichste Ursache?', options: ['Zu kleines Kv', 'Mechanische Resonanz, angeregt durch einen zu „harten“ Drehzahlregler', 'Falsche Referenzierart', 'Fehlende Software-Endlage'], correct: 1, explain: 'Hochfrequente Geräusche sind meist Resonanzen im Drehzahlregelkreis; Abhilfe: Filter, Verstärkung reduzieren, Mechanik versteifen.' },
      { type: 'single', q: 'Warum braucht der Drehzahlregler einen I-Anteil?', options: ['Damit er schneller ist', 'Damit ein konstantes Lastmoment ohne bleibende Drehzahl- bzw. Lageabweichung ausgeregelt wird', 'Damit er nicht schwingt', 'Weil der Stromregler sonst ausfällt'], correct: 1, explain: 'Der I-Anteil liefert den Haltestrom für die Last bei Regelabweichung null.' },
      { type: 'multi', q: 'Welche Maßnahmen reduzieren den Schleppfehler bei konstanter Fahrt?', options: ['Geschwindigkeitsvorsteuerung', 'Höheres Kv (soweit stabil)', 'Kleinere Strombegrenzung', 'Beschleunigungsvorsteuerung'], correct: [0, 1, 3], explain: 'Vorsteuerung und höhere Verstärkung reduzieren den Fehler; eine kleinere Strombegrenzung verschlechtert die Dynamik.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Kaskadenregler mit Begrenzung und Anti-Windup',
        task: [
          'Die Simulation bildet eine Achse nach: Der (ideale) Stromregler prägt `rCurrentSet` ein, die Endstufe begrenzt auf 10 A, 1 A ergibt 500 mm/s² Beschleunigung. `rLoadCur` ist ein Lastmoment (als Strom). Istposition und -geschwindigkeit liefert der Geber (`rPosAct`, `rVelAct`). Reglertakt: 2 ms.',
          '',
          'Die erste Version hat P-Lageregler und P-Drehzahlregler ohne Begrenzungen. Erweitere sie zu einer vollständigen Kaskade:',
          '1. Lageregler P (`KV`) mit Begrenzung der Sollgeschwindigkeit auf ±`V_MAX` = 300 mm/s.',
          '2. Drehzahlregler **PI** (`KP`, `TN`), Ausgang begrenzt auf ±`I_MAX` = 10 A.',
          '3. **Anti-Windup:** Der I-Anteil wird nicht weiter aufintegriert, solange der Ausgang in der Begrenzung ist (außer der Fehler führt heraus).',
          '',
          'Anforderungen: Sprung auf 100 mm ohne nennenswertes Überschwingen, keine bleibende Abweichung unter Last, großer Sprung (1000 mm) ohne Überschwingen durch Windup.'
        ].join('\n'),
        hints: ['I-Anteil: `rInt := rInt + KP / TN * rVelErr * CYCLE_T;`', 'Vergleiche den unbegrenzten mit dem begrenzten Stromwert, um die Sättigung zu erkennen.'],
        cycleMs: 2,
        io: CAS_IO,
        plant: CAS_PLANT,
        scene: { type: 'axis', bind: { position: 'rPosAct', min: 0, max: 1000 } },
        files: { main: CAS_START, var: CAS_VAR, typ: '' },
        solution: { main: CAS_SOL, var: CAS_VAR, typ: '' },
        tests: [
          { name: 'Sprung auf 100 mm', steps: [{ set: { rPosSet: 100.0 } }, { until: 'ABS(rPosAct - 100.0) < 0.5', maxMs: 1500, msg: 'Die Achse erreicht 100 mm nicht.' }, { never: 'rPosAct > 101.0', ms: 500, msg: 'Zu starkes Überschwingen.' }, { expect: 'ABS(rPosAct - 100.0) < 0.05' }] },
          { name: 'Strom- und Geschwindigkeitsbegrenzung', steps: [{ set: { rPosSet: 1000.0 } }, { never: 'ABS(rCurrentSet) > 10.0 OR ABS(rVelAct) > 310.0', ms: 2000, msg: 'Sollstrom muss auf 10 A und die Geschwindigkeit auf 300 mm/s begrenzt sein.' }] },
          { name: 'Keine bleibende Abweichung unter Last', steps: [{ set: { rPosSet: 100.0 } }, { ms: 1500 }, { set: { rLoadCur: 2.0 } }, { ms: 2000 }, { expect: 'ABS(rPosAct - 100.0) < 0.05', msg: 'Unter Last bleibt eine Lageabweichung – fehlt der I-Anteil?' }] },
          { name: 'Großer Sprung ohne Windup-Überschwingen', steps: [{ set: { rPosSet: 1000.0 } }, { never: 'rPosAct > 1002.0', ms: 5000, msg: 'Überschwingen über 2 mm – Anti-Windup fehlt oder wirkt nicht.' }, { expect: 'ABS(rPosAct - 1000.0) < 0.1' }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 5 · Modul 2
  {
    id: 'motion-5-dimensionierung',
    level: 5,
    kind: 'lektion',
    title: 'Antriebsdimensionierung und Bewegungsprofile',
    summary: 'Du berechnest Bewegungsprofile, reduzierte Trägheitsmomente, Beschleunigungs- und Effektivmomente und weißt, wie B&R SERVOsoft die Auslegung unterstützt.',
    minutes: 240,
    req: ['motion-5-regelkreise'],
    briefing: 'Bevor ein Antrieb bestellt wird, muss er ausgelegt werden: Aus dem geforderten Bewegungsprofil (Weg, Zeit, Pausen) ergeben sich Geschwindigkeit, Beschleunigung und – über die auf den Motor reduzierten Trägheitsmomente und Lastkräfte – das Moment über der Zeit. Der Motor muss das Spitzenmoment kurzzeitig und das Effektivmoment (RMS) dauerhaft liefern; Drehzahl und Trägheitsverhältnis müssen passen, der Servoverstärker den Strom. Für reale Projekte nutzt B&R dafür das Auslegungswerkzeug SERVOsoft, das Mechanik, Profile, Motoren, Getriebe und Antriebe zusammen bewertet.',
    practice: 'Ein zu kleiner Motor überhitzt beim Kunden, ein zu großer verteuert die Maschine und verschlechtert die Regelung. Wer die Auslegung nachrechnen kann, diskutiert mit Konstruktion und Einkauf auf Augenhöhe.',
    transfer: {
      tia: 'Siemens bietet mit dem TIA Selection Tool bzw. SIZER ein entsprechendes Auslegungswerkzeug für SINAMICS-Antriebe.',
      codesys: 'Beckhoff stellt mit dem TwinCAT Motion Designer ein Auslegungswerkzeug bereit; die Berechnungsgrundlagen sind dieselben.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Berechne Trapez- und Dreiecksprofile',
        guide: {
          intro: 'Das Bewegungsprofil bestimmt alle Antriebsgrößen.',
          steps: [
            'Trapez: Beschleunigen (t_a = v/a), Konstantfahrt, Bremsen. Gilt, wenn s ≥ v²/a.',
            'Dreieck: v_max wird nicht erreicht; v_peak = √(s·a), t = 2·v_peak/a.',
            'Fahrzeit Trapez: t = s/v + v/a.',
            'Für ruckbegrenzte Profile (S-Kurve) verlängert sich die Fahrzeit um die Ruckzeit.'
          ],
          done: 'Erledigt, wenn du für s = 10 rad, v = 5 rad/s, a = 10 rad/s² die Fahrzeit (2,5 s) und für s = 2 rad die Spitzengeschwindigkeit (4,47 rad/s) ausrechnen kannst.',
          tip: 'Rechne immer zuerst an der Last, dann über das Getriebe auf den Motor.'
        }
      },
      {
        id: 'o2',
        title: 'Reduziere Trägheitsmomente und berechne Momente',
        guide: {
          intro: 'Über ein Getriebe wirkt die Last mit J_L / i² am Motor.',
          steps: [
            'J_ges = J_Motor + J_Getriebe + J_Last / i².',
            'Motorbeschleunigung α_M = α_Last · i; Beschleunigungsmoment M_a = J_ges · α_M.',
            'Lastmoment (Reibung, Gewicht) über das Getriebe: M_L,Motor = M_L / (i · η).',
            'Spindel: J_red = m · (p / 2π)², Kraft → Moment: M = F · p / (2π · η).',
            'Lies im FHNW-Skript „Servogetriebe“ den Abschnitt zur Getriebebemessung.'
          ],
          done: 'Erledigt, wenn du das Beschleunigungsmoment für J_L = 0,05 kgm², i = 5, J_M = 0,001 kgm², α = 10 rad/s² (Ergebnis 0,15 Nm) berechnen kannst.',
          tip: 'Ein Getriebe reduziert die Lastträgheit quadratisch. Darum macht schon eine kleine Übersetzung die Regelung deutlich gutmütiger.'
        }
      },
      {
        id: 'o3',
        title: 'Prüfe Effektivmoment und Trägheitsverhältnis',
        guide: {
          intro: 'Dauerbelastung und Regelbarkeit entscheiden über die Motorwahl.',
          steps: [
            'Effektivmoment: M_rms = √(Σ M_i² · t_i / T_Zyklus) inklusive Pausen.',
            'M_rms ≤ Stillstands-/Nennmoment des Motors, M_max ≤ Spitzenmoment.',
            'Trägheitsverhältnis λ = J_L,red / J_M: übliche Richtwerte je nach Dynamik ca. ≤ 10 (dynamisch deutlich kleiner).',
            'Prüfe den Arbeitspunkt im Drehzahl-Drehmoment-Diagramm des Motors (Speed Torque Chart in AS).'
          ],
          done: 'Erledigt, wenn die Übung „Antriebsauslegung“ alle Tests besteht.',
          tip: 'Pausen senken das Effektivmoment deutlich – frag beim Lastenheft immer nach der realen Taktzeit inklusive Stillstand.',
          link: helpLink('speedTorque', 'Speed Torque Chart')
        }
      },
      {
        id: 'o4',
        title: 'Lerne den Ablauf in B&R SERVOsoft kennen',
        guide: {
          intro: 'SERVOsoft ist das Auslegungswerkzeug für B&R-Antriebssysteme. Der genaue Funktionsumfang ist in der Werkzeug-Dokumentation beschrieben; hier lernst du den Ablauf.',
          steps: [
            'Sieh dir den B&R-Teaser zum Online-Kurs „Sizing a B&R servo system with SERVOsoft“ an.',
            'Ablauf: Mechanik (Spindel, Riemen, Rundtisch) und Lasten eingeben → Bewegungsprofil definieren → Getriebe/Motor auswählen → Antrieb und Versorgung prüfen (Zwischenkreis, Bremswiderstand).',
            'Vergleiche das Ergebnis mit deiner Handrechnung aus der Übung.',
            'Kläre mit deinem Ausbilder, wo SERVOsoft im Unternehmen installiert ist und wer die Auslegungen freigibt.'
          ],
          done: 'Erledigt, wenn du den Ablauf einer Auslegung in fünf Schritten beschreiben kannst.',
          tip: 'Speichere die Auslegungsdatei beim Projekt. Bei einer Taktzeiterhöhung zwei Jahre später ist das Gold wert.'
        }
      }
    ],
    videos: [
      vid('servosoft', 'Kurzer B&R-Einblick in die Antriebsauslegung mit SERVOsoft.'),
      vid('sizing', 'Grundlagen der Servo-Auslegung: Profil, Moment, Trägheit, Effektivmoment.'),
      vid('inertia', 'Erklärt das Trägheitsverhältnis zwischen Last und Motor und seine Auswirkung.')
    ],
    readings: [
      fhnw('servogetriebe', 'Servogetriebe', 30, 'Getriebebemessung für Positionierantriebe inkl. zusätzlichem Lastmoment.'),
      fhnw('mechanische-bewegungsgleichungen', 'Mechanische Bewegungsgleichungen', 20, 'Grundgleichungen für Rotation und Translation sowie die Umrechnung an Gewindespindeln.'),
      R.probst
    ],
    quiz: [
      { type: 'numeric', q: 'Weg {s} rad, v_max = 5 rad/s, a = 10 rad/s². Wie lange dauert die Fahrt (Trapez, falls v_max erreicht)?', params: { s: [3, 20, 1] }, formula: 's >= 2.5 ? s / 5 + 0.5 : 2 * Math.sqrt(s * 10) / 10', unit: 's', tol: 0.01, explain: 'Trapez, wenn s ≥ v²/a = 2,5 rad: t = s/v + v/a. Sonst Dreieck: t = 2√(s·a)/a.' },
      { type: 'single', q: 'Wie wirkt ein Lastträgheitsmoment J_L über ein Getriebe i am Motor?', options: ['J_L · i', 'J_L / i', 'J_L / i²', 'J_L · i²'], correct: 2, explain: 'Die Energiebilanz ergibt eine Reduktion mit dem Quadrat der Übersetzung.' },
      { type: 'single', q: 'Welche Bedingung prüft das Effektivmoment?', options: ['Ob der Motor kurzzeitig genug Spitzenmoment hat', 'Ob der Motor die thermische Dauerbelastung über das Spiel aushält', 'Ob der Geber genau genug ist', 'Ob die Drehrichtung stimmt'], correct: 1, explain: 'M_rms vergleicht man mit dem Dauer-/Stillstandsmoment (thermische Auslastung).' }
    ],
    exam: [
      { type: 'numeric', q: 'Spindelachse: Masse {m} kg, Steigung 10 mm. Wie groß ist das auf die Spindel reduzierte Trägheitsmoment in kgcm²?', params: { m: [5, 50, 5] }, formula: 'm * Math.pow(0.01 / (2 * Math.PI), 2) * 10000', unit: 'kgcm²', tol: 0.02, explain: 'J = m · (p/2π)², p = 0,01 m; Umrechnung kgm² → kgcm² mal 10⁴.' },
      { type: 'numeric', q: 'Beschleunigungs- und Bremsmoment je 2 Nm für je 0,2 s, dazwischen 0 Nm, Spieldauer {T} s. Wie groß ist das Effektivmoment?', params: { T: [1, 4, 0.5] }, formula: 'Math.sqrt(2 * 4 * 0.2 / T)', unit: 'Nm', tol: 0.02, explain: 'M_rms = √((2² · 0,2 + 2² · 0,2) / T).' },
      { type: 'single', q: 'Ein Profil fordert s = 1 rad, v_max = 10 rad/s, a = 20 rad/s². Welches Profil entsteht?', options: ['Trapez', 'Dreieck – v_max wird nicht erreicht', 'Rechteck', 'S-Kurve'], correct: 1, explain: 'v²/a = 5 rad > 1 rad, also Dreieck mit v_peak = √20 ≈ 4,47 rad/s.' },
      { type: 'multi', q: 'Was muss bei der Auslegung neben dem Motor geprüft werden?', options: ['Strom des Servoverstärkers', 'Zwischenkreis/Bremsenergie (Bremswiderstand)', 'Getriebe (Abtriebsmoment, Drehzahl)', 'Farbe des Schaltschranks'], correct: [0, 1, 2], explain: 'Antrieb, Energiebilanz und Getriebe gehören zur vollständigen Auslegung.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Antriebsauslegung: Profil, Moment, Trägheitsverhältnis',
        task: [
          'Für einen Rundtisch soll ein Motor geprüft werden. Eingänge: Weg `rDist` [rad], `rVmax` [rad/s], `rAcc` [rad/s²] (an der Last), `rJLoad`, `rJMotor` [kgm²], Getriebe `rGear` (i), Pause je Spiel `rDwell` [s]. Reibung vernachlässigt, Bremsen mit gleichem Betrag wie Beschleunigen.',
          '',
          'Die vorhandene Version rechnet nur das Trapezprofil. Ergänze:',
          '1. **Dreiecksprofil**, wenn `rDist <= rVmax²/rAcc`: `bTriangle`, `rVPeak = √(s·a)`, `rTAcc`, `rTMove`.',
          '2. Beschleunigungsmoment am Motor: `rTorqueAcc = (J_M + J_L/i²) · a · i`.',
          '3. Trägheitsverhältnis `rInertiaRatio = (J_L/i²) / J_M`, `doRatioOk` wenn ≤ 10.',
          '4. Effektivmoment über ein Spiel (Fahrt + Pause): `rTorqueRms = √(2 · M_a² · t_a / (t_Fahrt + t_Pause))`.'
        ].join('\n'),
        hints: ['Prüfe den Profiltyp mit `IF rDist <= rVmax * rVmax / rAcc THEN …`.', '`SQRT` gibt es als Standardfunktion.'],
        cycleMs: 10,
        io: DIM_IO,
        files: { main: DIM_START, var: DIM_VAR, typ: '' },
        solution: { main: DIM_SOL, var: DIM_VAR, typ: '' },
        tests: [
          { name: 'Trapezprofil', steps: [{ cycles: 1 }, { expect: 'NOT bTriangle AND ABS(rTMove - 2.5) < 0.001 AND ABS(rTAcc - 0.5) < 0.001' }] },
          { name: 'Moment und Trägheitsverhältnis', steps: [{ cycles: 1 }, { expect: 'ABS(rTorqueAcc - 0.15) < 0.0005', msg: 'J_ges = 0,001 + 0,05/25 = 0,003 kgm²; α_M = 50 rad/s² → 0,15 Nm.' }, { expect: 'ABS(rInertiaRatio - 2.0) < 0.001 AND doRatioOk' }] },
          { name: 'Effektivmoment Trapez', steps: [{ cycles: 1 }, { expect: 'ABS(rTorqueRms - 0.0866) < 0.0005', msg: '√(2 · 0,15² · 0,5 / 3,0) = 0,0866 Nm.' }] },
          { name: 'Dreiecksprofil', steps: [{ set: { rDist: 2.0 } }, { cycles: 1 }, { expect: 'bTriangle AND ABS(rVPeak - 4.4721) < 0.001 AND ABS(rTMove - 0.8944) < 0.001', msg: 's = 2 rad < v²/a = 2,5 rad → Dreieck mit v_peak = √20.' }, { expect: 'ABS(rTorqueRms - 0.12013) < 0.0005' }] },
          { name: 'Großes Trägheitsverhältnis', steps: [{ set: { rJLoad: 0.5, rGear: 2.0 } }, { cycles: 1 }, { expect: 'ABS(rInertiaRatio - 125.0) < 0.01 AND NOT doRatioOk', msg: 'J_L/i² = 0,125 kgm² → λ = 125.' }, { expect: 'ABS(rTorqueAcc - 2.52) < 0.005' }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 5 · Modul 3 (Zusatz)
  {
    id: 'motion-5-robotik-cnc',
    level: 5,
    kind: 'zusatz',
    title: 'Bonus: Achsgruppen, mapp Robotics und mapp CNC',
    summary: 'Du lernst, wie mehrere Achsen als Achsgruppe auf einer Bahn geführt werden, und kennst den Einstieg in mapp Robotics und mapp CNC.',
    minutes: 180,
    req: ['motion-5-dimensionierung'],
    briefing: 'Sobald ein Werkzeug auf einer Bahn im Raum geführt werden muss, reicht Einzelachs-Positionieren nicht mehr. Eine Achsgruppe (Axes Group) fasst mehrere Achsen zusammen; ein Bahninterpolator berechnet aus Bahnbefehlen (Gerade, Kreis, Spline – oft als G-Code) die Sollwerte aller Achsen, bei Robotern zusätzlich über eine kinematische Transformation (Delta, SCARA, Knickarm). B&R bietet dafür mapp Robotics und mapp CNC, konfiguriert über Mechatronic Designs in der Configuration View. Im Bonusmodul baust du das Grundprinzip – zwei Achsen erreichen ihr Ziel gleichzeitig auf einer Geraden – mit zwei Einzelachsen nach.',
    practice: 'Pick-and-Place-Delta-Roboter, Klebe- und Schneidanlagen oder Portalachsen sind in Verpackung und Montage Standard. Auch wenn du den Bahninterpolator nicht selbst schreibst, musst du verstehen, warum zwei unabhängig positionierte Achsen keine Gerade fahren.',
    transfer: {
      tia: 'SIMATIC S7-1500T: Technologieobjekt Kinematik mit MC_MoveLinearAbsolute, MC_MoveCircular; für CNC SINUMERIK.',
      codesys: 'CODESYS SoftMotion CNC+Robotics, TwinCAT Kinematic Transformation (TF511x) und TwinCAT CNC.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Verstehe Achsgruppe und Bahninterpolation',
        guide: {
          intro: 'Bahninterpolation bedeutet: Alle Achsen werden aus einer gemeinsamen Bahnbewegung abgeleitet.',
          steps: [
            'Sieh dir die Vorlesung zur Bahnsteuerung an (Geometriedaten, Interpolation, Transformation).',
            'Notiere den Unterschied: Punkt-zu-Punkt (jede Achse eigenes Profil) vs. Bahnsteuerung (gemeinsames Bahnprofil).',
            'Für eine Gerade gilt: alle Achsen haben dasselbe normierte Zeitprofil, skaliert mit ihrem Anteil Δx_i / L.',
            'Kreis/Spline: Interpolator berechnet Zwischenpunkte im Interpolationstakt.'
          ],
          done: 'Erledigt, wenn du erklären kannst, warum zwei Achsen mit gleicher Geschwindigkeit von (0,0) nach (300,100) keine Gerade fahren.',
          tip: 'Bei Punkt-zu-Punkt fährt die Achse mit dem kürzeren Weg zuerst fertig – die Bahn hat einen Knick.'
        }
      },
      {
        id: 'o2',
        title: 'Lerne mapp Robotics und mapp CNC kennen',
        guide: {
          intro: 'mapp Robotics/CNC sind Teil von mapp Motion.',
          steps: [
            'Öffne die B&R-Hilfe „mapp Robotics/CNC“ und sieh dir die Getting Started (Delta-Roboter, CNC) an.',
            'Notiere: Kinematiken werden als Mechatronic Design konfiguriert; programmiert wird mit G-Code-Programmen bzw. Bausteinen der Achsgruppe.',
            'Sieh dir die Tutorials „mapp Robotics Tutorial #1“ und „First CNC Program“ an.',
            'Halte fest, welche Lizenzen bzw. Technology Guards für mapp Robotics und mapp CNC nötig sind (Seite „Lizenzierung“ der Hilfe).'
          ],
          done: 'Erledigt, wenn du die Bausteine einer mapp-Robotics-Applikation (Achsen, Achsgruppe/Mechatronic Design, Programm) benennen kannst.',
          tip: 'Starte mit der Simulation und einem Beispielprojekt aus der Hilfe – die Konfiguration einer Kinematik von Null ist aufwendig.',
          link: helpLink('robotics', 'mapp Robotics/CNC')
        }
      },
      {
        id: 'o3',
        title: 'Programmiere zwei Achsen auf einer Geraden',
        guide: {
          intro: 'Mit zwei MpAxisBasic-Instanzen baust du eine einfache lineare Interpolation nach.',
          steps: [
            'Berechne Δx, Δy und die Bahnlänge L.',
            'Verteile v und a anteilig: v_x = v · |Δx| / L, a_x = a · |Δx| / L (für y entsprechend).',
            'Starte beide Fahrten im selben Zyklus.',
            'Grenzfall: Eine Achse ohne Bewegung (Δ = 0) nicht kommandieren – v = 0 wäre ein ungültiger Parameter.'
          ],
          done: 'Erledigt, wenn die Übung „Zwei Achsen auf einer Geraden“ alle Tests besteht.',
          tip: 'Dieser Ansatz funktioniert nur für Geraden ohne Überschleifen. Für Bahnen mit Kreisen und Übergängen nutzt man den Interpolator der Achsgruppe.'
        }
      }
    ],
    videos: [
      vid('griesBahn', 'Hochschulvorlesung zu Bahnsteuerung, Interpolation und Transformation.'),
      vid('robotics', 'Erster Einstieg in mapp Robotics in Automation Studio.'),
      vid('cnc', 'Erstes CNC-Programm mit mapp Motion.')
    ],
    readings: [
      brHelp('robotics', 'mapp Robotics/CNC', 20, 'Startseite der B&R-Hilfe zu mapp Robotics und mapp CNC mit Getting Started und Konzept.'),
      brHelp('mappCnc', 'mapp CNC', 15, 'Konfiguration einer CNC-Applikation in mapp Motion.'),
      brHelp('mechDesigns', 'Mechatronic Designs', 15, 'Wie Kinematiken und Achsgruppen in mapp Motion konfiguriert werden.')
    ],
    quiz: [
      { type: 'single', q: 'Zwei Achsen fahren mit gleicher Geschwindigkeit von (0,0) nach (300,100). Wie sieht die Bahn aus?', options: ['Gerade', 'Zuerst diagonal, dann nur noch in X – mit Knick', 'Kreisbogen', 'Nur in Y'], correct: 1, explain: 'Y ist nach 100 mm fertig, X fährt allein weiter.' },
      { type: 'numeric', q: 'Bahn von (0,0) nach ({x},100) mit v_Bahn = 200 mm/s. Welche Geschwindigkeit braucht die X-Achse?', params: { x: [100, 400, 50] }, formula: '200 * x / Math.sqrt(x * x + 100 * 100)', unit: 'mm/s', tol: 0.01, explain: 'v_x = v · Δx / L mit L = √(Δx² + Δy²).' },
      { type: 'single', q: 'Wie werden Kinematiken in mapp Robotics konfiguriert?', options: ['Als Mechatronic Design in der Configuration View', 'Nur im Programmcode', 'Über die Visualisierung', 'Über den Logger'], correct: 0, explain: 'Kinematik und Achsgruppe werden als Mechatronic Design konfiguriert.' }
    ],
    exam: [
      { type: 'single', q: 'Warum wird eine Achse mit Δ = 0 bei der eigenen Geradeninterpolation nicht kommandiert?', options: ['Sie würde sonst referenzieren', 'Ihre anteilige Geschwindigkeit wäre 0 – ein ungültiger Parameter, der einen Fehler auslöst', 'Sie würde zu schnell', 'Weil sie sonst die Endlage verletzt'], correct: 1, explain: 'v = a = 0 sind für Bewegungsbefehle ungültig.' },
      { type: 'multi', q: 'Welche Aufgaben übernimmt der Bahninterpolator einer Achsgruppe?', options: ['Sollwerte aller Achsen aus Bahnbefehlen berechnen', 'Kinematische Transformation (z. B. Delta)', 'Bahngeschwindigkeit an Übergängen anpassen', 'Achsen verdrahten'], correct: [0, 1, 2], explain: 'Verdrahtung ist Hardware; die anderen Punkte sind Kernaufgaben des Interpolators.' },
      { type: 'single', q: 'Was beschreibt G-Code in mapp CNC?', options: ['Die Hardwarekonfiguration', 'Bahnbefehle (Gerade, Kreis, Vorschub) eines Bearbeitungsprogramms', 'Die Sicherheitsfunktionen', 'Die Visualisierung'], correct: 1, explain: 'G-Code (DIN 66025) beschreibt Bahn und Technologie eines CNC-Programms.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Zwei Achsen auf einer Geraden',
        task: [
          'Ein Portal hat zwei Achsen X und Y (je eine `MpAxisBasic`-Instanz, simuliert als eigene Achse). Einschalten und Referenzieren sind vorgegeben. Die erste Version fährt beide Achsen mit voller Geschwindigkeit – die Bahn hat einen Knick.',
          '',
          'Ändere die Fahrt so, dass das Werkzeug auf einer **Geraden** vom Start- zum Zielpunkt fährt und beide Achsen gleichzeitig ankommen:',
          '- Bahngeschwindigkeit `V_PATH` = 200 mm/s, Bahnbeschleunigung `A_PATH` = 1000 mm/s².',
          '- Geschwindigkeit, Beschleunigung und Verzögerung jeder Achse anteilig zu |Δ| / L.',
          '- Achsen ohne Bewegung (|Δ| ≤ `EPS`) werden **nicht** kommandiert (sonst Fehler wegen v = 0).',
          '- `doInPos` wird beim Start FALSE und am Ziel TRUE.'
        ].join('\n'),
        hints: ['Berechne Δx, Δy aus Ziel minus aktueller Position zum Zeitpunkt des Starts.', 'Bei bMoveX = FALSE gilt die X-Achse als „in Position“.'],
        cycleMs: 10,
        io: XY_IO,
        scene: { type: 'axis', bind: { position: 'rPosX', min: 0, max: 400, error: 'doError' } },
        files: { main: XY_START, var: XY_VAR, typ: XY_TYP },
        solution: { main: XY_SOL, var: XY_VAR, typ: XY_TYP },
        tests: [
          { name: 'Gerade (0,0) → (300,100)', steps: [{ set: { diPower: true } }, { until: 'doReady', maxMs: 1500 }, ...goXY(300.0, 100.0), { never: 'ABS(rPosX - 3.0 * rPosY) > 1.5', ms: 600, msg: 'Die Bahn weicht von der Geraden ab (X muss stets 3 × Y sein).' }, { until: 'doInPos AND ABS(rPosX - 300.0) < 0.01 AND ABS(rPosY - 100.0) < 0.01', maxMs: 3000 }] },
          { name: 'Gerade (300,100) → (100,200)', steps: [{ set: { diPower: true } }, { until: 'doReady', maxMs: 1500 }, ...goXY(300.0, 100.0), { until: 'doInPos AND doReady', maxMs: 4000 }, ...goXY(100.0, 200.0), { never: 'ABS(100.0 * (rPosX - 300.0) + 200.0 * (rPosY - 100.0)) > 112.0', ms: 600, msg: 'Abstand zur Geraden größer als 0,5 mm.' }, { until: 'doInPos AND ABS(rPosX - 100.0) < 0.01 AND ABS(rPosY - 200.0) < 0.01', maxMs: 3000 }] },
          { name: 'Nur Y bewegen', steps: [{ set: { diPower: true } }, { until: 'doReady', maxMs: 1500 }, ...goXY(0.0, 200.0), { never: 'doError', ms: 800, msg: 'Eine Achse ohne Bewegung darf nicht mit v = 0 kommandiert werden.' }, { until: 'doInPos AND ABS(rPosY - 200.0) < 0.01', maxMs: 3000 }] },
          { name: 'Gleichzeitige Ankunft', steps: [{ set: { diPower: true } }, { until: 'doReady', maxMs: 1500 }, ...goXY(400.0, 50.0), { until: 'ABS(rPosY - 50.0) < 0.01', maxMs: 4000 }, { expect: 'rPosX > 399.0', msg: 'Y ist am Ziel, X aber noch nicht – die Achsen kommen nicht gleichzeitig an.' }] }
        ]
      }
    ]
  }
];
