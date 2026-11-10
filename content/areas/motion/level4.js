'use strict';
const { L, brHelp, helpLink, fhnw, community, R, vid } = require('./common');

// ─────────────────────────────────────────────── M7 · Kurvenscheibe als Stützpunkttabelle
const CAM_VAR = L(
  'VAR CONSTANT',
  '\tPERIOD : REAL := 360.0;   (* Masterperiode [°] *)',
  'END_VAR',
  'VAR',
  '\t(* Bewegungsplan: Rast 0..90°, Hub 90..180°, Rast 180..270°, Rückhub 270..360° *)',
  '\taMaster : ARRAY[0..4] OF REAL := [0.0, 90.0, 180.0, 270.0, 360.0];',
  '\taSlave : ARRAY[0..4] OF REAL := [0.0, 0.0, 100.0, 100.0, 0.0];',
  '\trM : REAL;      (* Masterposition innerhalb der Periode *)',
  '\trZ : REAL;      (* normierte Position im Segment 0..1 *)',
  '\ti : INT;',
  'END_VAR'
);
const CAM_START = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\t(* TODO 1: Masterposition auf 0..PERIOD abbilden (auch negative Werte!)',
  '\t   TODO 2: Segment suchen und Slaveposition linear interpolieren *)',
  '\trSlave := 0.0;',
  'END_PROGRAM'
);
const CAM_MOD = [
  '\t(* Modulo für REAL: MOD gibt es nur für Ganzzahlen *)',
  '\trM := rMaster - DINT_TO_REAL(TRUNC(rMaster / PERIOD)) * PERIOD;',
  '\tIF rM < 0.0 THEN',
  '\t\trM := rM + PERIOD;',
  '\tEND_IF',
  ''
];
const CAM_SOL = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  ...CAM_MOD,
  '\tFOR i := 0 TO 3 DO',
  '\t\tIF rM >= aMaster[i] AND rM <= aMaster[i + 1] THEN',
  '\t\t\trZ := (rM - aMaster[i]) / (aMaster[i + 1] - aMaster[i]);',
  '\t\t\trSlave := aSlave[i] + rZ * (aSlave[i + 1] - aSlave[i]);',
  '\t\t\tEXIT;',
  '\t\tEND_IF',
  '\tEND_FOR',
  'END_PROGRAM'
);
const POLY_FUN = L(
  '(* Bewegungsgesetz Polynom 5. Ordnung (Weg) – in AS6: Deklaration in der .fun-Datei *)',
  'FUNCTION FC_Poly5 : REAL',
  'VAR_INPUT',
  '\tz : REAL;',
  'END_VAR',
  '\tFC_Poly5 := z * z * z * (10.0 - 15.0 * z + 6.0 * z * z);',
  'END_FUNCTION',
  '',
  '(* Ableitung nach z (Geschwindigkeit, normiert) *)',
  'FUNCTION FC_Poly5Vel : REAL',
  'VAR_INPUT',
  '\tz : REAL;',
  'END_VAR',
  '\tFC_Poly5Vel := 30.0 * z * z * (1.0 - z) * (1.0 - z);',
  'END_FUNCTION',
  ''
);
const POLY_SOL = POLY_FUN + L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  ...CAM_MOD,
  '\tFOR i := 0 TO 3 DO',
  '\t\tIF rM >= aMaster[i] AND rM <= aMaster[i + 1] THEN',
  '\t\t\trZ := (rM - aMaster[i]) / (aMaster[i + 1] - aMaster[i]);',
  '\t\t\trSlave := aSlave[i] + FC_Poly5(rZ) * (aSlave[i + 1] - aSlave[i]);',
  '\t\t\t(* dSlave/dMaster = s\'(z) * Hub / Segmentlänge *)',
  '\t\t\trVelRatio := FC_Poly5Vel(rZ) * (aSlave[i + 1] - aSlave[i]) / (aMaster[i + 1] - aMaster[i]);',
  '\t\t\tEXIT;',
  '\t\tEND_IF',
  '\tEND_FOR',
  'END_PROGRAM'
);
const POLY_START = CAM_SOL.replace("'PROGRAM _CYCLIC'", "'PROGRAM _CYCLIC'")
  .replace('\tEND_FOR\nEND_PROGRAM', '\tEND_FOR\n\t(* TODO: Polynom 5. Ordnung statt linear, rVelRatio berechnen *)\n\trVelRatio := 0.0;\nEND_PROGRAM');
const CAM_IO = [
  { name: 'rMaster', type: 'REAL', dir: 'in', label: 'Masterposition', widget: 'slider', min: -360, max: 720, unit: '°' },
  { name: 'rSlave', type: 'REAL', dir: 'out', label: 'Slaveposition (Hub)', widget: 'gauge', min: 0, max: 100, unit: 'mm' }
];
const camT = (m, expr, msg) => ({ name: `Master ${m}°`, steps: [{ set: { rMaster: m } }, { cycles: 1 }, { expect: expr, msg }] });

// ─────────────────────────────────────────────── M8 · Elektronisches Getriebe
const GEAR_VAR = L(
  'VAR CONSTANT',
  '\tA_MAX : REAL := 200.0;   (* max. Slave-Beschleunigung beim Ein-/Auskuppeln [mm/s²] *)',
  '\tCYCLE_T : REAL := 0.01;       (* Zykluszeit [s] *)',
  'END_VAR',
  'VAR',
  '\trMasterPrev : REAL;',
  '\trMasterVelAct : REAL;    (* aus Positionsänderung ermittelt *)',
  '\trVelTarget : REAL;',
  'END_VAR'
);
const GEAR_START = L(
  'PROGRAM _INIT',
  '\trMasterPrev := rMasterPos;',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\trMasterVelAct := (rMasterPos - rMasterPrev) / CYCLE_T;',
  '\trMasterPrev := rMasterPos;',
  '',
  '\t(* Erste Version: koppelt hart ein – Geschwindigkeitssprung! *)',
  '\tIF diCouple THEN',
  '\t\trSlaveVel := rRatio * rMasterVelAct;',
  '\tELSE',
  '\t\trSlaveVel := 0.0;',
  '\tEND_IF',
  '\trSlavePos := rSlavePos + rSlaveVel * CYCLE_T;',
  '\tdoInGear := diCouple;',
  'END_PROGRAM'
);
const GEAR_SOL = L(
  'PROGRAM _INIT',
  '\trMasterPrev := rMasterPos;',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\t(* Mastergeschwindigkeit aus der Positionsänderung je Zyklus *)',
  '\trMasterVelAct := (rMasterPos - rMasterPrev) / CYCLE_T;',
  '\trMasterPrev := rMasterPos;',
  '',
  '\tIF diCouple THEN',
  '\t\trVelTarget := rRatio * rMasterVelAct;',
  '\tELSE',
  '\t\trVelTarget := 0.0;',
  '\tEND_IF',
  '',
  '\t(* Rampe: Geschwindigkeitsänderung je Zyklus auf A_MAX * CYCLE_T begrenzen *)',
  '\trSlaveVel := rSlaveVel + LIMIT(-A_MAX * CYCLE_T, rVelTarget - rSlaveVel, A_MAX * CYCLE_T);',
  '\trSlavePos := rSlavePos + rSlaveVel * CYCLE_T;',
  '\tdoInGear := diCouple AND ABS(rSlaveVel - rVelTarget) < 0.5;',
  'END_PROGRAM'
);
const GEAR_IO = [
  { name: 'diMasterRun', type: 'BOOL', dir: 'in', label: 'Master läuft', widget: 'switch' },
  { name: 'diCouple', type: 'BOOL', dir: 'in', label: 'Einkuppeln', widget: 'switch' },
  { name: 'rRatio', type: 'REAL', dir: 'in', label: 'Übersetzung Slave/Master', widget: 'slider', min: 0, max: 2, init: 0.5 },
  { name: 'rMasterPos', type: 'REAL', dir: 'in', label: 'Masterposition (Simulation)', widget: 'value', unit: 'mm' },
  { name: 'rSlavePos', type: 'REAL', dir: 'out', label: 'Slave-Sollposition', widget: 'gauge', min: 0, max: 500, unit: 'mm' },
  { name: 'rSlaveVel', type: 'REAL', dir: 'out', label: 'Slave-Sollgeschwindigkeit', widget: 'value', unit: 'mm/s' },
  { name: 'doInGear', type: 'BOOL', dir: 'out', label: 'InGear', widget: 'led' }
];
const GEAR_PLANT = {
  var: L('VAR', '\trMasterSpeed : REAL := 100.0;   (* mm/s *)', 'END_VAR'),
  code: 'IF diMasterRun THEN\n\trMasterPos := rMasterPos + rMasterSpeed * PLANT_DT;\nEND_IF\n'
};

// ─────────────────────────────────────────────── M9 · Fliegende Säge
const SAW_TYP = L(
  'TYPE',
  '\teSawState : (SAW_WAIT := 0, SAW_ACCEL := 10, SAW_SYNC := 20, SAW_RETURN := 30, SAW_ERROR := 90);',
  'END_TYPE'
);
const SAW_VAR = L(
  'VAR CONSTANT',
  '\tA_MAX : REAL := 2000.0;     (* Beschleunigung Schlitten [mm/s²] *)',
  '\tV_RET : REAL := 400.0;      (* Rückfahrgeschwindigkeit [mm/s] *)',
  '\tCYCLE_T : REAL := 0.01;          (* Zykluszeit [s] *)',
  '\tSTART_TOL : REAL := 5.0;    (* zulässige Startverspätung [mm] *)',
  'END_VAR',
  'VAR',
  '\teSaw : eSawState;',
  '\tnNextCut : UDINT := 1;      (* Index der nächsten Schnittmarke *)',
  '\trSyncDist : REAL;',
  '\ttonCut : TON;',
  '\tfbMoveTo : FB_MoveTo;',
  'END_VAR'
);
const MOVETO_FB = L(
  '(* Vorgegeben: einfacher Profilgenerator (Trapez) für die Rückfahrt.',
  '   In AS6: Deklaration in der .fun-Datei. *)',
  'FUNCTION_BLOCK FB_MoveTo',
  'VAR_INPUT',
  '\tExecute : BOOL;',
  '\trTarget : REAL;',
  '\trVmax : REAL;',
  '\trAcc : REAL;',
  '\trDT : REAL;',
  'END_VAR',
  'VAR_OUTPUT',
  '\tbDone : BOOL;',
  'END_VAR',
  'VAR_IN_OUT',
  '\trPos : REAL;',
  '\trVel : REAL;',
  'END_VAR',
  'VAR',
  '\trDist : REAL;',
  '\trVdes : REAL;',
  '\trDvMax : REAL;',
  'END_VAR',
  '\tbDone := FALSE;',
  '\tIF NOT Execute THEN',
  '\t\tRETURN;',
  '\tEND_IF',
  '\trDist := rTarget - rPos;',
  '\trDvMax := rAcc * rDT;',
  '\tIF ABS(rDist) < 0.01 AND ABS(rVel) <= rDvMax THEN',
  '\t\trPos := rTarget;',
  '\t\trVel := 0.0;',
  '\t\tbDone := TRUE;',
  '\t\tRETURN;',
  '\tEND_IF',
  '\t(* Wunschgeschwindigkeit: so schnell, dass bis zum Ziel noch gebremst werden kann *)',
  '\trVdes := MIN(rVmax, SQRT(2.0 * rAcc * ABS(rDist)));',
  '\tIF rDist < 0.0 THEN',
  '\t\trVdes := -rVdes;',
  '\tEND_IF',
  '\trVel := rVel + LIMIT(-rDvMax, rVdes - rVel, rDvMax);',
  '\trPos := rPos + rVel * rDT;',
  '\tIF (rDist > 0.0 AND rPos > rTarget) OR (rDist < 0.0 AND rPos < rTarget) THEN',
  '\t\trPos := rTarget;',
  '\t\trVel := 0.0;',
  '\t\tbDone := TRUE;',
  '\tEND_IF',
  'END_FUNCTION_BLOCK',
  ''
);
const SAW_HEAD = MOVETO_FB + L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\t(* Lage der nächsten Schnittmarke in Maschinenkoordinaten (0 = Grundstellung Schlitten) *)',
  '\trMarkPos := rMatPos - UDINT_TO_REAL(nNextCut) * rCutLen;',
  ''
);
const SAW_TAIL = L(
  '',
  '\ttonCut(IN := (eSaw = SAW_SYNC), PT := T#300ms);',
  '\tdoCut := (eSaw = SAW_SYNC);',
  '\tdoError := (eSaw = SAW_ERROR);',
  'END_PROGRAM'
);
const SAW_START = SAW_HEAD + L(
  '\t(* TODO: Synchronisierweg berechnen: rSyncDist := ... *)',
  '',
  '\tCASE eSaw OF',
  '\t\tSAW_WAIT:',
  '\t\t\t(* TODO: Start, wenn die Marke den Startpunkt -rSyncDist erreicht;',
  '\t\t\t   zu spät (mehr als START_TOL) -> SAW_ERROR *)',
  '\t\t\t;',
  '\t\tSAW_ACCEL:',
  '\t\t\t(* TODO: mit A_MAX auf Liniengeschwindigkeit beschleunigen, dann koppeln *)',
  '\t\t\t;',
  '\t\tSAW_SYNC:',
  '\t\t\t(* TODO: Schlitten folgt der Marke, nach tonCut.Q -> Rückfahrt *)',
  '\t\t\t;',
  '\t\tSAW_RETURN:',
  '\t\t\tfbMoveTo(Execute := TRUE, rTarget := 0.0, rVmax := V_RET, rAcc := A_MAX, rDT := CYCLE_T, rPos := rCarPos, rVel := rCarVel);',
  '\t\t\tIF fbMoveTo.bDone THEN',
  '\t\t\t\teSaw := SAW_WAIT;',
  '\t\t\tEND_IF',
  '\t\tSAW_ERROR:',
  '\t\t\t;',
  '\tEND_CASE'
) + SAW_TAIL;
const SAW_SOL = SAW_HEAD + L(
  '\t(* Weg, den der Schlitten zum Beschleunigen auf Liniengeschwindigkeit braucht: v² / (2a).',
  '\t   Die Marke legt in derselben Zeit den doppelten Weg zurück -> Start bei Marke = -v²/(2a). *)',
  '\trSyncDist := rLineVel * rLineVel / (2.0 * A_MAX);',
  '',
  '\tCASE eSaw OF',
  '\t\tSAW_WAIT:',
  '\t\t\trCarVel := 0.0;',
  '\t\t\tIF diLineRun AND rMarkPos >= -rSyncDist THEN',
  '\t\t\t\tIF rMarkPos > -rSyncDist + START_TOL THEN',
  '\t\t\t\t\teSaw := SAW_ERROR;     (* Marke verpasst: Linie zu schnell oder Schnitt zu kurz *)',
  '\t\t\t\tELSE',
  '\t\t\t\t\teSaw := SAW_ACCEL;',
  '\t\t\t\tEND_IF',
  '\t\t\tEND_IF',
  '',
  '\t\tSAW_ACCEL:',
  '\t\t\trCarVel := MIN(rCarVel + A_MAX * CYCLE_T, rLineVel);',
  '\t\t\trCarPos := rCarPos + rCarVel * CYCLE_T;',
  '\t\t\tIF rCarVel >= rLineVel THEN',
  '\t\t\t\trCarPos := rMarkPos;        (* Lagekopplung 1:1 an die Marke *)',
  '\t\t\t\teSaw := SAW_SYNC;',
  '\t\t\tEND_IF',
  '',
  '\t\tSAW_SYNC:',
  '\t\t\trCarVel := rLineVel;',
  '\t\t\trCarPos := rMarkPos;',
  '\t\t\tIF tonCut.Q THEN',
  '\t\t\t\tnCuts := nCuts + 1;',
  '\t\t\t\tnNextCut := nNextCut + 1;',
  '\t\t\t\teSaw := SAW_RETURN;',
  '\t\t\tEND_IF',
  '',
  '\t\tSAW_RETURN:',
  '\t\t\tfbMoveTo(Execute := TRUE, rTarget := 0.0, rVmax := V_RET, rAcc := A_MAX, rDT := CYCLE_T, rPos := rCarPos, rVel := rCarVel);',
  '\t\t\tIF fbMoveTo.bDone THEN',
  '\t\t\t\teSaw := SAW_WAIT;',
  '\t\t\tEND_IF',
  '',
  '\t\tSAW_ERROR:',
  '\t\t\trCarVel := 0.0;',
  '\t\t\t(* Neustart nach Linie aus: auf die nächste noch nicht erreichte Marke aufsetzen *)',
  '\t\t\tIF NOT diLineRun THEN',
  '\t\t\t\tnNextCut := DINT_TO_UDINT(TRUNC(rMatPos / rCutLen)) + 1;',
  '\t\t\t\teSaw := SAW_WAIT;',
  '\t\t\tEND_IF',
  '\tEND_CASE'
) + SAW_TAIL;
const SAW_IO = [
  { name: 'diLineRun', type: 'BOOL', dir: 'in', label: 'Linie läuft', widget: 'switch' },
  { name: 'rLineVel', type: 'REAL', dir: 'in', label: 'Liniengeschwindigkeit', widget: 'slider', min: 50, max: 300, unit: 'mm/s', init: 200 },
  { name: 'rCutLen', type: 'REAL', dir: 'in', label: 'Schnittlänge', widget: 'slider', min: 300, max: 2000, unit: 'mm', init: 500 },
  { name: 'rMatPos', type: 'REAL', dir: 'in', label: 'Materialvorschub (Geber)', widget: 'value', unit: 'mm' },
  { name: 'rCarPos', type: 'REAL', dir: 'out', label: 'Schlitten Sollposition', widget: 'gauge', min: 0, max: 800, unit: 'mm' },
  { name: 'rCarVel', type: 'REAL', dir: 'out', label: 'Schlitten Sollgeschwindigkeit', widget: 'value', unit: 'mm/s' },
  { name: 'rMarkPos', type: 'REAL', dir: 'out', label: 'Lage nächste Schnittmarke', widget: 'value', unit: 'mm' },
  { name: 'doCut', type: 'BOOL', dir: 'out', label: 'Säge unten (Schnitt)', widget: 'led' },
  { name: 'doError', type: 'BOOL', dir: 'out', label: 'Schnitt verpasst', widget: 'led' },
  { name: 'nCuts', type: 'UDINT', dir: 'out', label: 'Schnitte', widget: 'value' }
];
const SAW_PLANT = {
  var: L('VAR', '\trCutS : REAL;        (* Materialkoordinate des letzten Schnitts *)', '\trCutErr : REAL;      (* Abweichung von der Sollschnittlänge *)', '\tnPlantCut : UDINT;', '\tbCutOld : BOOL;', 'END_VAR'),
  code: L(
    '(* Schnitt erkennen (mit dem Materialstand, den das Programm im letzten Zyklus gesehen hat) *)',
    'IF doCut AND NOT bCutOld THEN',
    '\tnPlantCut := nPlantCut + 1;',
    '\trCutS := rMatPos - rCarPos;',
    '\trCutErr := rCutS - UDINT_TO_REAL(nPlantCut) * rCutLen;',
    'END_IF',
    'bCutOld := doCut;',
    'IF diLineRun THEN',
    '\trMatPos := rMatPos + rLineVel * PLANT_DT;',
    'END_IF'
  )
};

module.exports = [
  // ───────────────────────────────────────────── Level 4 · Modul 1
  {
    id: 'motion-4-kurvenscheibe',
    level: 4,
    kind: 'lektion',
    title: 'Elektronische Kurvenscheiben und mapp Cam Automat',
    summary: 'Du beschreibst Bewegungen als Funktion einer Masterposition, kennst Bewegungsgesetze und setzt Kurvenscheiben mit MC_CamIn bzw. dem Cam Automat um.',
    minutes: 240,
    req: ['motion-3-achsautomat'],
    briefing: 'Früher erzeugte eine mechanische Kurvenscheibe auf einer Königswelle die Bewegung von Stößeln und Greifern. Heute übernimmt das eine elektronische Kurvenscheibe: Die Slave-Position ist eine Funktion der Master-Position (oft einer virtuellen Achse). Wichtig ist das Bewegungsgesetz zwischen den Stützpunkten: Lineare Übergänge erzeugen Geschwindigkeitssprünge und damit unendliche Beschleunigungen; Polynome 5. Ordnung oder modifizierte Sinoide (nach VDI 2143) sorgen für ruckarme Bewegungen. In mapp Motion werden Kurvenscheiben als Cam-Daten hinterlegt und mit MC_CamIn oder – für mehrere Zustände wie Warten, Synchronisieren, Rückfahrt – mit dem Kurvenscheibenautomaten (Cam Automat) abgearbeitet.',
    practice: 'Verpackungs- und Druckmaschinen bestehen fast vollständig aus Kurvenscheiben-Achsen um eine virtuelle Masterachse. Ein schlecht gewähltes Bewegungsgesetz zeigt sich als Schwingung, Geräusch und Verschleiß – und ist oft die Ursache für „die Maschine läuft nicht schneller als 80 Takte/min“.',
    transfer: {
      tia: 'SIMATIC Technology: Technologieobjekt „Kurvenscheibe“ (TO_Cam) mit MC_CamIn; S7-1500T bietet dazu Synchronachsen.',
      codesys: 'CODESYS SoftMotion: CAM-Editor und MC_CamTableSelect/MC_CamIn; TwinCAT: TF5050 NC Camming mit MC_CamIn und Tabellen.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Beschreibe eine Bewegung als Kurvenscheibe',
        guide: {
          intro: 'Eine Kurvenscheibe ordnet jeder Masterposition eine Slaveposition zu: s = f(m).',
          steps: [
            'Zeichne ein Weg-Diagramm über eine Masterperiode (0–360°): Rast, Hub, Rast, Rückhub.',
            'Leite Geschwindigkeit (ds/dm) und Beschleunigung (d²s/dm²) grafisch ab.',
            'Markiere Stellen mit Geschwindigkeitssprüngen (Knicke im Weg) – dort entstehen Stöße.',
            'Notiere den Unterschied zwischen periodischer und nicht-periodischer Kurvenscheibe.'
          ],
          done: 'Erledigt, wenn du für deinen Bewegungsplan Weg, Geschwindigkeit und Beschleunigung skizziert hast.',
          tip: 'Rechne mit der Masterposition, nicht mit der Zeit. Dann passt die Bewegung automatisch zu jeder Maschinengeschwindigkeit.'
        }
      },
      {
        id: 'o2',
        title: 'Wähle ein ruckarmes Bewegungsgesetz',
        guide: {
          intro: 'Zwischen den Stützpunkten bestimmt das Bewegungsgesetz den Verlauf.',
          steps: [
            'Linear: einfach, aber Geschwindigkeitssprung an Rast-Übergängen.',
            'Polynom 5. Ordnung s(z) = 10z³ − 15z⁴ + 6z⁵: Geschwindigkeit und Beschleunigung an den Segmentgrenzen null.',
            'Modifizierte Sinoide (VDI 2143): geringere Spitzenbeschleunigung, Standard im Maschinenbau.',
            'Berechne für einen Hub von 100 mm über 90° Master die maximale Übersetzung ds/dm beim Polynom 5: 1,875 × 100/90 ≈ 2,08 mm/°.'
          ],
          done: 'Erledigt, wenn du erklären kannst, warum Polynom 5 an der Rast ruckfreier ist als linear.',
          tip: 'Die maximale Slavegeschwindigkeit = max(ds/dm) × Mastergeschwindigkeit. Damit prüfst du, ob der Motor die Kurvenscheibe bei Nenntakt überhaupt schafft.'
        }
      },
      {
        id: 'o3',
        title: 'Lerne MC_CamIn und den Cam Automat in mapp Motion kennen',
        guide: {
          intro: 'mapp Motion bietet einfache Kopplung (MC_CamIn) und den Kurvenscheibenautomaten für komplexe Abläufe.',
          steps: [
            'Lies die B&R-Hilfe zu MC_CamIn: Master, Slave, Kurvenscheibendaten, Skalierung von Master und Slave.',
            'Lies die Seite „Cam Automat“: Der Automat wird als Axis Feature konfiguriert und mit MC_BR_CamAutomatCommand bzw. MpAxisCamSequencer bedient.',
            'Notiere: Kurvenscheiben für die Zustände müssen in einer Cam List eingetragen sein.',
            'Lies den Anwendungsfall „Kurvenscheibe für Querschneider“ und skizziere Kompensations- und Synchronphase.'
          ],
          done: 'Erledigt, wenn du die Bausteine für eine einfache Kopplung und für einen mehrzustandigen Ablauf benennen kannst.',
          tip: 'Mit einer virtuellen Masterachse kannst du die Maschine im Programm „langsam drehen“ und jede Kurvenscheibe im Trace prüfen, ohne dass Mechanik mitläuft.',
          link: helpLink('camAutomat', 'Cam Automat')
        }
      },
      {
        id: 'o4',
        title: 'Programmiere Kurvenscheiben als Tabelle in ST',
        guide: {
          intro: 'In den Übungen baust du die Kurvenscheibe selbst nach. So verstehst du, was der Antrieb intern rechnet.',
          steps: [
            'Bilde die Masterposition auf eine Periode ab (Modulo für REAL selbst rechnen).',
            'Suche das Segment, normiere die Position auf z = 0…1 und interpoliere.',
            'Ersetze in der zweiten Übung das lineare Gesetz durch das Polynom 5. Ordnung und berechne die Geschwindigkeitsübersetzung.'
          ],
          done: 'Erledigt, wenn beide Übungen alle Tests bestehen.',
          tip: 'Teste negative Masterpositionen und Werte über einer Periode – genau da liegen die typischen Fehler.'
        }
      }
    ],
    videos: [
      vid('griesMotion', 'Hochschulvorlesung: Synchronisierung und Kurvenscheibe (CAM) im Überblick.'),
      vid('camBr', 'Kurvenscheibe und Master-Follower mit vier Achsen in B&R Automation Studio.'),
      vid('camOmron', 'E-Cam-Anwendung an einem anderen System – zeigt das gleiche Prinzip an realer Mechanik.')
    ],
    readings: [
      brHelp('mcCamIn', 'MC_CamIn', 20, 'Schnittstelle und Kopplungsverhalten der Kurvenscheibenkopplung in mapp Motion.'),
      brHelp('camAutomat', 'Cam Automat', 15, 'Konfiguration des Kurvenscheibenautomaten als Axis Feature und zugehörige Bausteine.'),
      brHelp('querschneider', 'Anwendungsfall 3: Kurvenscheibe für Querschneider', 15, 'B&R-Anwendungsbeispiel mit Kompensations- und Synchronphase.')
    ],
    quiz: [
      { type: 'single', q: 'Warum ist ein linearer Übergang zwischen Rast und Hub problematisch?', options: ['Er braucht mehr Speicher', 'Er erzeugt einen Geschwindigkeitssprung und damit theoretisch unendliche Beschleunigung', 'Er ist nicht periodisch', 'Er funktioniert nur mit virtuellen Achsen'], correct: 1, explain: 'Ein Knick im Weg bedeutet einen Sprung in der Geschwindigkeit; die Beschleunigung wird impulsartig.' },
      { type: 'numeric', q: 'Polynom 5. Ordnung s(z) = 10z³ − 15z⁴ + 6z⁵, Hub 100 mm. Welcher Weg ergibt sich bei z = {z}?', params: { z: [0.1, 0.9, 0.1] }, formula: '100 * (10*z*z*z - 15*z*z*z*z + 6*z*z*z*z*z)', unit: 'mm', tol: 0.01, explain: 'Einsetzen in das Polynom und mit dem Hub multiplizieren.' },
      { type: 'single', q: 'Womit werden in mapp Motion mehrzustandige Kopplungsabläufe (Warten, Synchronisieren, Rückfahrt) umgesetzt?', options: ['Mit MpAxisBasic.MoveAbsolute', 'Mit dem Kurvenscheibenautomaten (Cam Automat), bedient über MC_BR_CamAutomatCommand bzw. MpAxisCamSequencer', 'Mit MC_Power', 'Nur mit eigenem ST-Code'], correct: 1, explain: 'Der Cam Automat bildet Zustände mit eigenen Kurvenscheiben und Übergangsbedingungen im Antrieb ab.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine Kurvenscheibe hat eine maximale Übersetzung von {k} mm/°. Die Masterachse dreht mit 120 Takten/min (1 Takt = 360°). Wie hoch ist die maximale Slavegeschwindigkeit?', params: { k: [0.5, 3, 0.5] }, formula: 'k * 360 * 120 / 60', unit: 'mm/s', tol: 0.01, explain: 'Master: 120 × 360°/60 s = 720 °/s. v_max = k × 720 °/s.' },
      { type: 'single', q: 'Was ist der Vorteil einer virtuellen Masterachse?', options: ['Sie braucht keinen Zyklus', 'Alle Slaves folgen einer störungsfreien, exakt vorgegebenen Masterposition; die Maschinengeschwindigkeit wird an einer Stelle eingestellt', 'Sie ersetzt die Sicherheitstechnik', 'Sie spart Lizenzen'], correct: 1, explain: 'Eine virtuelle Achse liefert eine ideale Führungsgröße ohne Geberrauschen oder Schlupf.' },
      { type: 'single', q: 'Welche Eigenschaft hat das Polynom 5. Ordnung an den Segmentgrenzen (z = 0 und z = 1)?', options: ['Geschwindigkeit maximal', 'Geschwindigkeit und Beschleunigung sind null', 'Nur der Weg ist null', 'Der Ruck ist null, die Beschleunigung maximal'], correct: 1, explain: 's\'(0) = s\'(1) = 0 und s\'\'(0) = s\'\'(1) = 0 – daher ruckarme Übergänge an Rasten.' },
      { type: 'multi', q: 'Welche Fälle muss eine selbst programmierte Kurvenscheibentabelle abdecken?', options: ['Masterpositionen über einer Periode', 'Negative Masterpositionen', 'Exakt auf einem Stützpunkt liegende Positionen', 'Nur ganzzahlige Masterwerte'], correct: [0, 1, 2], explain: 'Modulo-Abbildung inkl. negativer Werte und die Grenzen der Segmente sind die typischen Fehlerquellen.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Kurvenscheibe als Stützpunkttabelle',
        task: [
          'Ein Stößel soll abhängig von der Masterposition (Königswelle, 0–360° je Takt) einen Hub ausführen. Die Stützpunkte stehen in `aMaster` / `aSlave`:',
          '',
          '| Master [°] | 0 | 90 | 180 | 270 | 360 |',
          '|---|---|---|---|---|---|',
          '| Slave [mm] | 0 | 0 | 100 | 100 | 0 |',
          '',
          'Berechne in jedem Zyklus `rSlave`:',
          '1. Bilde `rMaster` auf den Bereich 0 … 360° ab – auch für Werte > 360° und für **negative** Werte (z. B. −45° → 315°).',
          '2. Suche das passende Segment und interpoliere **linear** zwischen den Stützpunkten.'
        ].join('\n'),
        hints: ['`MOD` gibt es nur für Ganzzahlen. Für REAL: `rM := rMaster - DINT_TO_REAL(TRUNC(rMaster / PERIOD)) * PERIOD;` – danach negative Werte korrigieren.', 'Normiere im Segment: z = (m − m_i) / (m_i+1 − m_i).'],
        cycleMs: 10,
        io: CAM_IO,
        scene: { type: 'axis', bind: { position: 'rSlave', min: 0, max: 100 } },
        files: { main: CAM_START, var: CAM_VAR, typ: '' },
        solution: { main: CAM_SOL, var: CAM_VAR, typ: '' },
        tests: [
          camT(135.0, 'ABS(rSlave - 50.0) < 0.01', 'Mitte des Hubs: 50 mm.'),
          camT(180.0, 'ABS(rSlave - 100.0) < 0.01', 'Stützpunkt 180° → 100 mm.'),
          camT(315.0, 'ABS(rSlave - 50.0) < 0.01', 'Mitte des Rückhubs: 50 mm.'),
          camT(495.0, 'ABS(rSlave - 50.0) < 0.01', '495° entspricht 135° im zweiten Takt.'),
          camT(-45.0, 'ABS(rSlave - 50.0) < 0.01', '−45° entspricht 315°: Modulo für negative Werte prüfen.'),
          camT(720.0, 'ABS(rSlave) < 0.01', '720° = Periodenanfang → 0 mm.')
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'erweitern',
        title: 'Bewegungsgesetz: Polynom 5. Ordnung',
        task: [
          'Die lineare Kurvenscheibe aus der vorigen Übung ist vorgegeben. Ersetze die lineare Interpolation durch das **Polynom 5. Ordnung**',
          '',
          '`s(z) = 10·z³ − 15·z⁴ + 6·z⁵`  (z = 0 … 1 im Segment)',
          '',
          'und berechne zusätzlich die Geschwindigkeitsübersetzung `rVelRatio` = ds/dm in mm/° mit',
          '',
          '`s\'(z) = 30·z²·(1 − z)²`  →  `rVelRatio = s\'(z) · Δs / Δm`.',
          '',
          'Lege die Formeln als Funktionen `FC_Poly5` und `FC_Poly5Vel` an (in AS6 mit Deklaration in der .fun-Datei).'
        ].join('\n'),
        hints: ['Funktionen deklarierst du oberhalb von PROGRAM _INIT mit `FUNCTION FC_Poly5 : REAL … END_FUNCTION`.', 'Für Rastsegmente ist Δs = 0 – dann sind Weg und Übersetzung automatisch konstant bzw. null.'],
        cycleMs: 10,
        io: [...CAM_IO, { name: 'rVelRatio', type: 'REAL', dir: 'out', label: 'Übersetzung ds/dm', widget: 'value', unit: 'mm/°' }],
        scene: { type: 'axis', bind: { position: 'rSlave', min: 0, max: 100 } },
        files: { main: POLY_START, var: CAM_VAR, typ: '' },
        solution: { main: POLY_SOL, var: CAM_VAR, typ: '' },
        tests: [
          camT(112.5, 'ABS(rSlave - 10.3516) < 0.01', 'Bei z = 0,25 liefert das Polynom 10,35 mm (linear wären es 25 mm).'),
          camT(135.0, 'ABS(rSlave - 50.0) < 0.01'),
          camT(292.5, 'ABS(rSlave - 89.6484) < 0.01', 'Rückhub bei z = 0,25: 100 − 10,35 mm.'),
          { name: 'Übersetzung in Hubmitte', steps: [{ set: { rMaster: 135.0 } }, { cycles: 1 }, { expect: 'ABS(rVelRatio - 2.0833) < 0.001', msg: 's\'(0,5) = 1,875; × 100 mm / 90° = 2,083 mm/°.' }] },
          { name: 'Übersetzung an der Rastgrenze ist null', steps: [{ set: { rMaster: 90.0 } }, { cycles: 1 }, { expect: 'ABS(rVelRatio) < 0.0001', msg: 'An der Segmentgrenze muss die Geschwindigkeit null sein (ruckarmer Übergang).' }] },
          { name: 'Übersetzung im Rückhub negativ', steps: [{ set: { rMaster: -45.0 } }, { cycles: 1 }, { expect: 'ABS(rVelRatio + 2.0833) < 0.001' }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 4 · Modul 2
  {
    id: 'motion-4-getriebe-kopplung',
    level: 4,
    kind: 'lektion',
    title: 'Elektronisches Getriebe, Achskopplung und Trace',
    summary: 'Du koppelst Achsen über ein elektronisches Getriebe ohne Geschwindigkeitssprung, wählst Master-Quellen bewusst und analysierst Kopplungen mit dem Trace.',
    minutes: 210,
    req: ['motion-4-kurvenscheibe'],
    briefing: 'Das elektronische Getriebe ist die einfachste Achskopplung: Die Slave-Achse läuft mit einem festen Verhältnis zur Master-Achse. MC_GearIn bringt den Slave in das Geschwindigkeitsverhältnis – mit begrenzter Beschleunigung, damit beim Einkuppeln kein Sprung entsteht – und meldet InGear. Für lagerichtige Kopplungen gibt es MC_GearInPos bzw. Kurvenscheiben. Entscheidend ist die Wahl der Master-Quelle (Soll- oder Istposition, reale oder virtuelle Achse) und die Totzeit zwischen Master und Slave. Ob eine Kopplung sauber läuft, sieht man nur im Trace: Master- und Slave-Position, Geschwindigkeiten und Schleppfehler über der Zeit.',
    practice: 'Typische Anwendungen sind Einzugswalzen, die synchron zur Hauptachse laufen, oder Förderbänder, die eine Bahn mit einstellbarem Verzug weitertransportieren. Ein Einkuppeln ohne Rampe löst sofort einen Schleppfehler aus – oder reißt das Material.',
    transfer: {
      tia: 'S7-1500T: Technologieobjekt Gleichlaufachse mit MC_GearIn/MC_GearInPos; Trace über die Trace-Funktion im TIA Portal.',
      codesys: 'TwinCAT: MC_GearIn mit Faktor (Tc2_MC2), Scope View als Trace; CODESYS SoftMotion: MC_GearIn und Trace-Objekt.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre elektronisches Getriebe und Kopplungsarten',
        guide: {
          intro: 'Bei Kopplungen unterscheidet man Geschwindigkeits- und Lagekopplung.',
          steps: [
            'MC_GearIn: Geschwindigkeitsverhältnis RatioNumerator/RatioDenominator (nur Werte > 0), Beschleunigung für das Einkuppeln, Ausgang InGear.',
            'MC_GearInPos: Kopplung mit definierter Lagebeziehung (Synchronisationsposition).',
            'MC_CamIn: beliebige Funktion s = f(m).',
            'Master-Quelle: Sollposition (glatt, ohne Totzeit) oder Istposition (folgt Störungen des Masters).',
            'Lies die B&R-Hilfe zu MC_GearIn und notiere die zulässigen PLCopen-Zustände.'
          ],
          done: 'Erledigt, wenn du für „Einzugswalze“ und „Druckwerk mit Passermarke“ die passende Kopplungsart nennen kannst.',
          tip: 'Koppelst du auf die Istposition eines echten Masters, überträgst du dessen Regelabweichungen auf alle Slaves. Wo möglich: virtuelle Masterachse.',
          link: helpLink('mcGearIn', 'MC_GearIn')
        }
      },
      {
        id: 'o2',
        title: 'Kupple ohne Geschwindigkeitssprung ein',
        guide: {
          intro: 'Beim Einkuppeln muss der Slave von seiner aktuellen auf die Synchrongeschwindigkeit beschleunigen.',
          steps: [
            'Bestimme die Mastergeschwindigkeit aus der Positionsänderung: v = Δs / Δt.',
            'Zielgeschwindigkeit Slave = Übersetzung × Mastergeschwindigkeit.',
            'Begrenze die Änderung je Zyklus auf a_max × Δt (Rampe).',
            'InGear, wenn |v_Slave − v_Ziel| klein ist. Beim Auskuppeln: Rampe auf 0.',
            'Berechne den Lageversatz, der durch das Einkuppeln entsteht (Fläche zwischen den Geschwindigkeitskurven).'
          ],
          done: 'Erledigt, wenn die Übung „Elektronisches Getriebe mit Einkuppelrampe“ alle Tests besteht.',
          tip: 'Initialisiere die vorherige Masterposition in _INIT, sonst rechnest du im ersten Zyklus eine riesige Geschwindigkeit.'
        }
      },
      {
        id: 'o3',
        title: 'Zeichne eine Kopplung mit dem Trace auf',
        guide: {
          intro: 'Der Trace in Automation Studio zeichnet Variablen zyklusgenau auf der Steuerung auf.',
          steps: [
            'Füge im Projekt eine Trace-Konfiguration hinzu und wähle als Variablen Master-Position, Slave-Position, Slave-Geschwindigkeit und InGear.',
            'Stelle Abtastzeit (= Taskklasse) und Trigger ein, z. B. steigende Flanke von diCouple.',
            'Starte den Trace im Online-Betrieb, löse das Einkuppeln aus und lade die Daten hoch.',
            'Prüfe: Steigt die Slave-Geschwindigkeit als Rampe? Wann kommt InGear?',
            'Für Antriebsgrößen (Schleppfehler, Strom) nutze den Antriebs-Trace in mapp Cockpit.'
          ],
          done: 'Erledigt, wenn du einen Trace des Einkuppelvorgangs mit Rampe und InGear gespeichert und beschriftet hast.',
          tip: 'Speichere Traces von der Inbetriebnahme im Projekt-Repository. Beim nächsten Service vergleichst du dann Ist mit Neuzustand.',
          link: helpLink('trace', 'Trace')
        }
      },
      {
        id: 'o4',
        title: 'Bewerte Totzeiten bei Achskopplungen',
        guide: {
          intro: 'Zwischen Master und Slave liegen Kommunikations- und Rechentotzeiten.',
          steps: [
            'Lies im Community-Leitfaden den Abschnitt „Compensation for dead times on axis couplings“.',
            'Berechne den Lagefehler durch Totzeit: Δs = v × t_tot (z. B. 1 m/s × 2 ms = 2 mm).',
            'Notiere Gegenmaßnahmen: Kopplung auf Sollposition, Totzeitkompensation (Verzögerung der Leitachse), Kopplung im selben Antrieb.'
          ],
          done: 'Erledigt, wenn du den Lagefehler einer Kopplung bei gegebener Geschwindigkeit und Totzeit berechnen kannst.',
          tip: 'Totzeitfehler wachsen linear mit der Geschwindigkeit – im Trace als geschwindigkeitsproportionaler Versatz erkennbar.'
        }
      }
    ],
    videos: [
      vid('gear', 'Zeigt Master-Follower-Betrieb (elektronisches Getriebe) an realen Antrieben.'),
      vid('trace', 'Trace in Automation Studio: Variablen konfigurieren, aufzeichnen und auswerten.'),
      vid('griesMotion', 'Vorlesungsteil zur Synchronisierung von Achsen.')
    ],
    readings: [
      brHelp('mcGearIn', 'MC_GearIn', 15, 'Schnittstelle des elektronischen Getriebes in mapp Motion: Übersetzung, Master-Quelle, Beschleunigung.'),
      brHelp('trace', 'Trace', 15, 'Konfiguration und Auswertung des Steuerungs-Trace in Automation Studio.'),
      community(3543, 'best-function-to-synchronise-axis-with-belt', 'Best function to synchronise axis with belt', 'Jansen, R.', 2024, 10, 'Diskussion, welche Kopplungsbausteine sich für die Synchronisation mit einem Band eignen.')
    ],
    quiz: [
      { type: 'single', q: 'Was bewirkt MC_GearIn laut B&R-Hilfe?', options: ['Es setzt die Slave-Position gleich der Master-Position', 'Es bringt die Slave-Achse in das angegebene Geschwindigkeitsverhältnis zur Master-Achse', 'Es referenziert den Slave', 'Es kuppelt Master und Slave mechanisch'], correct: 1, explain: 'MC_GearIn ist eine Geschwindigkeitskopplung mit Verhältnis Zähler/Nenner.' },
      { type: 'numeric', q: 'Master läuft mit {v} mm/s, Übersetzung 0,5, Einkuppelbeschleunigung 200 mm/s². Wie lange dauert das Einkuppeln aus dem Stillstand?', params: { v: [100, 800, 100] }, formula: 'v * 0.5 / 200', unit: 's', tol: 0.01, explain: 't = Δv / a = 0,5 · v / 200.' },
      { type: 'single', q: 'Warum koppelt man Slaves bevorzugt auf die Sollposition einer virtuellen Masterachse?', options: ['Weil die Istposition nicht lesbar ist', 'Weil die Sollposition glatt ist und keine Regelabweichungen oder Totzeiten des Masters überträgt', 'Weil das weniger Lizenzen braucht', 'Weil der Trace sonst nicht funktioniert'], correct: 1, explain: 'Die Sollposition ist ideal; die Istposition enthält Störungen des Master-Regelkreises.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine Kopplung hat {t} ms Totzeit, der Master läuft mit 1,5 m/s. Wie groß ist der Lageversatz?', params: { t: [1, 8, 1] }, formula: '1500 * t / 1000', unit: 'mm', tol: 0.01, explain: 'Δs = v · t = 1500 mm/s · t.' },
      { type: 'single', q: 'Ein Slave wird mit Rampe eingekuppelt. Welcher Lageversatz bleibt gegenüber einer sofortigen Kopplung?', options: ['Keiner', 'Der Weg, den der Slave während der Rampe „verliert“ (halbe Rampendauer × Synchrongeschwindigkeit)', 'Immer genau eine Masterumdrehung', 'Er hängt nur von der Zykluszeit ab'], correct: 1, explain: 'Bei linearer Rampe fehlt die Dreiecksfläche ½ · t · v. Lagerichtig koppelt man mit MC_GearInPos.' },
      { type: 'multi', q: 'Welche Größen gehören in einen Trace zur Beurteilung einer Kopplung?', options: ['Master-Position', 'Slave-Position und -Geschwindigkeit', 'InGear', 'Name des Bedieners'], correct: [0, 1, 2], explain: 'Positionen, Geschwindigkeit und Kopplungsstatus zeigen Rampe, Synchronlauf und Versatz.' },
      { type: 'single', q: 'Im ersten Zyklus meldet dein selbst programmiertes Getriebe eine Mastergeschwindigkeit von 30 000 mm/s. Ursache?', options: ['Der Master ist zu schnell', 'Die vorherige Masterposition war nicht initialisiert (0) – Δs ist die ganze Position', 'Die Übersetzung ist negativ', 'Die Zykluszeit ist zu lang'], correct: 1, explain: 'Ohne Initialisierung der vorherigen Position wird im ersten Zyklus die gesamte Position als Weg gewertet.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Elektronisches Getriebe mit Einkuppelrampe',
        task: [
          'Ein Master (z. B. Hauptband) läuft in der Simulation mit 100 mm/s, solange `diMasterRun` TRUE ist; seine Position steht in `rMasterPos`. Du berechnest den Sollwert einer Slave-Achse (`rSlavePos`, `rSlaveVel`) wie ein elektronisches Getriebe.',
          '',
          'Die erste Version koppelt hart ein (Geschwindigkeitssprung). Verbessere sie:',
          '1. Die Mastergeschwindigkeit ermittelst du aus der Positionsänderung je Zyklus (10 ms).',
          '2. Bei `diCouple` = TRUE ist die Zielgeschwindigkeit `rRatio × v_Master`, sonst 0.',
          '3. Die Slave-Geschwindigkeit ändert sich höchstens mit **A_MAX = 200 mm/s²** (also max. 2 mm/s je Zyklus) – beim Ein- und Auskuppeln und bei Änderung von `rRatio`.',
          '4. `doInGear` ist TRUE, wenn eingekuppelt ist und die Slave-Geschwindigkeit weniger als 0,5 mm/s vom Ziel abweicht.'
        ].join('\n'),
        hints: ['`LIMIT(-A_MAX * CYCLE_T, rVelTarget - rSlaveVel, A_MAX * CYCLE_T)` begrenzt die Änderung je Zyklus.', 'Die Slave-Position integrierst du mit `rSlavePos := rSlavePos + rSlaveVel * CYCLE_T;`.'],
        cycleMs: 10,
        io: GEAR_IO,
        plant: GEAR_PLANT,
        scene: { type: 'axis', bind: { position: 'rSlavePos', min: 0, max: 500 } },
        files: { main: GEAR_START, var: GEAR_VAR, typ: '' },
        solution: { main: GEAR_SOL, var: GEAR_VAR, typ: '' },
        tests: [
          { name: 'Einkuppeln mit Rampe', steps: [{ set: { diMasterRun: true } }, { ms: 300 }, { set: { diCouple: true } }, { cycles: 1 }, { expect: 'rSlaveVel <= 2.01', msg: 'Im ersten Zyklus darf die Slave-Geschwindigkeit nur um 2 mm/s steigen (200 mm/s² × 10 ms).' }, { cycles: 1 }, { expect: 'rSlaveVel <= 4.01 AND NOT doInGear' }, { until: 'doInGear', maxMs: 1000, msg: 'Slave erreicht die Synchrongeschwindigkeit nicht.' }, { expect: 'ABS(rSlaveVel - 50.0) < 0.5' }] },
          { name: 'Synchronlauf', steps: [{ set: { diMasterRun: true, diCouple: true } }, { until: 'doInGear', maxMs: 1500 }, { never: 'ABS(rSlaveVel - 50.0) > 0.5 OR NOT doInGear', ms: 1000, msg: 'Im Synchronlauf muss der Slave mit 0,5 × 100 mm/s laufen.' }] },
          { name: 'Übersetzung ändern', steps: [{ set: { diMasterRun: true, diCouple: true } }, { until: 'doInGear', maxMs: 1500 }, { set: { rRatio: 1.0 } }, { cycles: 2 }, { expect: 'NOT doInGear AND rSlaveVel < 55.0', msg: 'Auch eine Änderung der Übersetzung muss über die Rampe laufen.' }, { until: 'doInGear', maxMs: 1000 }, { expect: 'ABS(rSlaveVel - 100.0) < 0.5' }] },
          { name: 'Auskuppeln', steps: [{ set: { diMasterRun: true, diCouple: true } }, { until: 'doInGear', maxMs: 1500 }, { set: { diCouple: false } }, { cycles: 1 }, { expect: 'rSlaveVel > 47.0 AND NOT doInGear', msg: 'Auskuppeln ebenfalls mit Rampe, ohne Sprung.' }, { until: 'ABS(rSlaveVel) < 0.001', maxMs: 500 }] },
          { name: 'Stehender Master', steps: [{ set: { diCouple: true } }, { never: 'ABS(rSlaveVel) > 0.001', ms: 300 }, { expect: 'doInGear', msg: 'Bei stehendem Master ist der Slave mit 0 mm/s synchron.' }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 4 · Modul 3 (Projekt)
  {
    id: 'motion-4-fliegende-saege',
    level: 4,
    kind: 'projekt',
    title: 'Praxisprojekt: Fliegende Säge',
    summary: 'Du programmierst den kompletten Zyklus einer fliegenden Säge: Warten, Aufsynchronisieren auf die Schnittmarke, Schnitt im Gleichlauf und Rückfahrt – mit Erkennung verpasster Schnitte.',
    minutes: 360,
    req: ['motion-4-getriebe-kopplung'],
    briefing: 'Eine fliegende Säge trennt endlos laufendes Material (Rohr, Profil, Platte) in Stücke definierter Länge, ohne die Linie anzuhalten. Der Sägeschlitten beschleunigt so, dass er die Schnittmarke genau dann erreicht, wenn er die Materialgeschwindigkeit hat, fährt dann lagesynchron mit, während die Säge schneidet, und fährt anschließend zurück. Ein Querschneider (rotierendes Messer) löst dieselbe Aufgabe mit einer Kurvenscheibe aus Synchron- und Kompensationsphase. Das Projekt vereint alles aus Level 4: Masterbezug, Synchronisation, Profilgenerierung und eine Zustandsmaschine mit Grenzfällen.',
    practice: 'Schnittlängenfehler von wenigen Millimetern kosten in Profil- und Rohrwerken Ausschuss in Tonnen. Und wenn die Linie schneller läuft, als der Schlitten zurückkommt, muss die Steuerung das erkennen, statt falsch zu schneiden.',
    transfer: {
      tia: 'S7-1500T bietet „Fliegende Säge“ als Applikationsbeispiel mit MC_GearInPos bzw. Kurvenscheibe; das Ablaufprinzip ist dasselbe.',
      codesys: 'TwinCAT bietet mit TF5055 „Flying Saw“ eine fertige Funktion (MC_GearInVelo/MC_GearInPos); CODESYS SoftMotion löst es mit MC_GearInPos oder CAM.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Analysiere den Bewegungsablauf der fliegenden Säge',
        guide: {
          intro: 'Bevor du programmierst, rechnest du den Ablauf durch.',
          steps: [
            'Zeichne das Weg-Zeit-Diagramm von Material-Schnittmarke und Schlitten über einen Zyklus.',
            'Beschleunigungsweg des Schlittens bis v_Material: s = v² / (2a). In derselben Zeit legt die Marke den doppelten Weg zurück – daher Start bei Marke = −v²/(2a).',
            'Synchronweg während des Schnitts: v × t_Schnitt.',
            'Rückfahrt: Verzögern, zurück auf 0, mit v_ret und a_max.',
            'Prüfe: Ist die Zykluszeit des Schlittens kleiner als Schnittlänge / v_Material? Sonst wird die nächste Marke verpasst.'
          ],
          done: 'Erledigt, wenn du für v = 200 mm/s, L = 500 mm, a = 2000 mm/s² und 300 ms Schnittzeit die Schlittenzykluszeit abgeschätzt hast (ca. 0,9 s < 2,5 s).',
          tip: 'Die kürzeste fahrbare Schnittlänge ist eine wichtige Angabe im Lastenheft. Rechne sie aus, bevor der Kunde danach fragt.'
        }
      },
      {
        id: 'o2',
        title: 'Programmiere Synchronisation und Schnitt',
        guide: {
          intro: 'Die Schnittmarke liegt bei `rMatPos − k · L` in Maschinenkoordinaten.',
          steps: [
            'Berechne in jedem Zyklus `rMarkPos` und `rSyncDist`.',
            'WAIT → ACCEL, wenn die Marke −rSyncDist erreicht (Toleranz für Verspätung beachten, sonst Fehler).',
            'ACCEL: v mit a_max·Δt erhöhen, Position integrieren; bei v = v_Material Lage 1:1 an die Marke koppeln.',
            'SYNC: Schlitten = Marke, Säge unten, nach 300 ms Schnitt zählen, nächste Marke, RETURN.',
            'RETURN mit dem vorgegebenen Profilgenerator FB_MoveTo auf 0.'
          ],
          done: 'Erledigt, wenn die Übung „Fliegende Säge“ alle Tests besteht.',
          tip: 'Prüfe die Schnittlänge im Test über die Anlagen-Simulation – sie misst den tatsächlichen Abstand der Schnitte im Material.'
        }
      },
      {
        id: 'o3',
        title: 'Vergleiche mit Querschneider und Cam Automat',
        guide: {
          intro: 'In einer realen B&R-Applikation wird der Ablauf meist im Antrieb abgebildet.',
          steps: [
            'Lies den B&R-Anwendungsfall „Kurvenscheibe für Querschneider“: Kompensations- und Synchronphase.',
            'Ordne deine Zustände den Zuständen eines Kurvenscheibenautomaten zu (Warten, Ankoppeln, Synchron, Rückfahrt).',
            'Notiere Vorteile der Antriebslösung: kürzere Totzeit, Reaktion im Antriebstakt, Druckmarkenkorrektur über Messeingänge.'
          ],
          done: 'Erledigt, wenn du eine Zuordnungstabelle „ST-Zustand → Automatenzustand“ erstellt hast.',
          tip: 'Für echte Druckmarken nutzt man Latch-/Messeingänge am Antrieb, nicht den SPS-Zyklus – sonst ist die Genauigkeit durch die Zykluszeit begrenzt.',
          link: helpLink('querschneider', 'Querschneider-Anwendungsfall')
        }
      },
      {
        id: 'o4',
        title: 'Dokumentiere und reiche das Projekt ein',
        guide: {
          intro: 'Der Nachweis enthält Code, Berechnung und Trace.',
          steps: [
            'Lege das Projekt mit README (Weg-Zeit-Diagramm, Berechnung der minimalen Schnittlänge) auf git.breitner.de ab.',
            'Füge einen Trace (Materialmarke, Schlittenposition, doCut) als Bild bei.',
            'Reiche den Link als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist.',
          tip: 'Beschreibe die Grenzfälle (zu schnelle Linie, Linienstopp während Synchronfahrt) und wie dein Programm darauf reagiert.'
        }
      }
    ],
    videos: [
      vid('flySawZub', 'Programmierung einer fliegenden Säge an einer Motion-Steuerung – Ablauf und Parameter.'),
      vid('flyShearMits', 'Demo einer fliegenden Schere: Synchronfahrt und Rückfahrt an realer Mechanik.'),
      vid('flyShearOmron', 'Fliegende Schere und Rotationsschnitt (Querschneider) im Vergleich.')
    ],
    readings: [
      brHelp('querschneider', 'Anwendungsfall 3: Kurvenscheibe für Querschneider', 15, 'B&R-Lösung für den verwandten Querschneider mit MpAxisCamSequencer.'),
      brHelp('camAutCmd', 'MC_BR_CamAutomatCommand', 15, 'Steuerung des Kurvenscheibenautomaten aus dem Programm.'),
      fhnw('mechanische-bewegungsgleichungen', 'Mechanische Bewegungsgleichungen', 20, 'Grundgleichungen für Beschleunigung und Weg, die du für Synchronweg und Rückfahrt brauchst.')
    ],
    quiz: [
      { type: 'numeric', q: 'Material läuft mit {v} mm/s, der Schlitten beschleunigt mit 2000 mm/s². Bei welcher Markenposition (relativ zur Schlitten-Grundstellung) muss er starten?', params: { v: [100, 400, 50] }, formula: '-(v * v) / (2 * 2000)', unit: 'mm', tol: 0.01, explain: 'Start bei −v²/(2a): Der Schlitten fährt v²/(2a), die Marke in derselben Zeit v²/a.' },
      { type: 'single', q: 'Was muss das Programm tun, wenn der Schlitten bei Erreichen des Startpunkts noch nicht in Grundstellung ist?', options: ['Trotzdem schneiden', 'Verpassten Schnitt erkennen und melden (Fehler/Linie verlangsamen)', 'Die Schnittlänge verdoppeln', 'Nichts'], correct: 1, explain: 'Ein falscher Schnitt erzeugt Ausschuss; der Fall muss erkannt und gemeldet werden.' },
      { type: 'single', q: 'Worin unterscheidet sich ein Querschneider von einer fliegenden Säge?', options: ['Er braucht keine Synchronisation', 'Das Messer rotiert kontinuierlich; Synchron- und Kompensationsphase werden als Kurvenscheibe einer Rundachse realisiert', 'Er schneidet nur bei stehendem Material', 'Er hat keinen Master'], correct: 1, explain: 'Beim Querschneider gibt es keine Rückfahrt; die Formatanpassung erfolgt in der Kompensationsphase der Kurvenscheibe.' }
    ],
    exam: [
      { type: 'numeric', q: 'Synchronphase: Material {v} mm/s, Schnittzeit 300 ms. Welchen Weg fährt der Schlitten im Gleichlauf?', params: { v: [100, 300, 50] }, formula: 'v * 0.3', unit: 'mm', tol: 0.01, explain: 's = v · t.' },
      { type: 'single', q: 'Warum koppelt man in der Synchronphase lagesynchron (Position) und nicht nur geschwindigkeitssynchron?', options: ['Weil das schneller ist', 'Damit die Schnittposition exakt der Marke entspricht und sich kein Versatz aufbaut', 'Weil MC_GearIn nicht existiert', 'Weil die Säge sonst nicht absenkt'], correct: 1, explain: 'Nur die Lagekopplung garantiert die Schnittlänge; reine Geschwindigkeitskopplung kann Versatz enthalten.' },
      { type: 'multi', q: 'Welche Grenzfälle muss die Steuerung einer fliegenden Säge behandeln?', options: ['Linie zu schnell für die eingestellte Schnittlänge', 'Linienstopp während der Synchronfahrt', 'Änderung der Schnittlänge im laufenden Betrieb', 'Farbe des Materials'], correct: [0, 1, 2], explain: 'Alle drei beeinflussen Timing oder Schnittposition und müssen definiert behandelt werden.' },
      { type: 'single', q: 'Wodurch ist die Genauigkeit einer Schnittmarkenerfassung über einen SPS-Eingang im 10-ms-Zyklus bei 1 m/s begrenzt?', options: ['Auf ca. 0,01 mm', 'Auf bis zu 10 mm (v × Zykluszeit)', 'Gar nicht', 'Auf 1 m'], correct: 1, explain: '1000 mm/s × 0,01 s = 10 mm Unsicherheit – deshalb Latch-/Messeingänge am Antrieb.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Fliegende Säge: Synchronfahrt berechnen',
        task: [
          'Material läuft mit `rLineVel` (Standard 200 mm/s) durch die Säge; der Materialvorschub steht in `rMatPos` (Simulation). Alle `rCutLen` mm (Standard 500 mm) soll geschnitten werden. Du berechnest den Sollwert des Sägeschlittens (`rCarPos`, `rCarVel`, Hub 0 … 800 mm, Grundstellung 0).',
          '',
          'Vorgegeben: der Profilgenerator `FB_MoveTo` für die Rückfahrt, die Zustände und die Berechnung `rMarkPos` (Lage der nächsten Schnittmarke; sie läuft von negativen Werten auf 0 zu).',
          '',
          'Programmiere:',
          '1. `rSyncDist := rLineVel² / (2 · A_MAX)`.',
          '2. **WAIT:** Läuft die Linie und erreicht die Marke `−rSyncDist`, startet die Beschleunigung. Ist die Marke dabei schon mehr als `START_TOL` = 5 mm darüber hinaus, wurde der Schnitt verpasst → `SAW_ERROR` (`doError`).',
          '3. **ACCEL:** Geschwindigkeit je Zyklus um `A_MAX · CYCLE_T` erhöhen (max. `rLineVel`), Position integrieren. Ist `rLineVel` erreicht, Schlitten lagegenau an die Marke koppeln → **SYNC**.',
          '4. **SYNC:** `rCarPos = rMarkPos`, `rCarVel = rLineVel`, Säge unten (`doCut`). Nach 300 ms (`tonCut`): `nCuts` + 1, nächste Marke (`nNextCut` + 1) → **RETURN**.',
          '5. **RETURN** (vorgegeben): zurück auf 0, dann WAIT. **ERROR:** Schlitten steht; nach Linie aus Neustart auf die nächste Marke.',
          '',
          'Die Simulation misst bei jedem Schnitt die tatsächliche Schnittposition im Material (`rCutErr` = Abweichung von der Sollänge).'
        ].join('\n'),
        hints: ['Die Marke legt während der Beschleunigung den doppelten Weg des Schlittens zurück – deshalb startet der Schlitten bei Marke = −v²/(2a).', 'Für die verpasste Marke: Bei v = 300 mm/s und L = 300 mm reicht die Zeit für Schnitt und Rückfahrt nicht.'],
        cycleMs: 10,
        io: SAW_IO,
        plant: SAW_PLANT,
        scene: { type: 'axis', bind: { position: 'rCarPos', min: 0, max: 800, error: 'doError' } },
        files: { main: SAW_START, var: SAW_VAR, typ: SAW_TYP },
        solution: { main: SAW_SOL, var: SAW_VAR, typ: SAW_TYP },
        tests: [
          { name: 'Zwei Schnitte', steps: [{ set: { diLineRun: true } }, { until: 'nCuts >= 2', maxMs: 7000, msg: 'Innerhalb von 7 s müssen zwei Schnitte erfolgen (alle 2,5 s).' }, { expect: 'NOT doError' }] },
          { name: 'Gleichlauf während des Schnitts', steps: [{ set: { diLineRun: true } }, { never: 'doCut AND (ABS(rCarPos - rMarkPos) > 0.01 OR ABS(rCarVel - rLineVel) > 0.01)', ms: 6000, msg: 'Während doCut muss der Schlitten lage- und geschwindigkeitsgleich mit der Marke fahren.' }, { expect: 'nCuts >= 2' }] },
          { name: 'Schnittlänge im Material', steps: [{ set: { diLineRun: true } }, { until: 'nCuts >= 3', maxMs: 9000 }, { expect: 'nPlantCut = 3 AND ABS(rCutErr) < 1.0', msg: 'Die gemessene Schnittposition weicht mehr als 1 mm von k × Schnittlänge ab.' }] },
          { name: 'Schlitten bleibt im Hub', steps: [{ set: { diLineRun: true } }, { never: 'rCarPos < -0.5 OR rCarPos > 800.0', ms: 4000 }] },
          { name: 'Andere Geschwindigkeit und Länge', steps: [{ set: { rLineVel: 120.0, rCutLen: 800.0, diLineRun: true } }, { until: 'nCuts >= 2', maxMs: 15000 }, { expect: 'ABS(rCutErr) < 1.0 AND NOT doError' }] },
          { name: 'Verpasster Schnitt wird erkannt', steps: [{ set: { rLineVel: 300.0, rCutLen: 300.0, diLineRun: true } }, { until: 'doError', maxMs: 6000, msg: 'Bei 300 mm/s und 300 mm kommt der Schlitten nicht rechtzeitig zurück – das muss als Fehler erkannt werden.' }, { never: 'doCut', ms: 500, msg: 'Im Fehlerzustand darf nicht geschnitten werden.' }] }
        ]
      }
    ],
    proof: true,
    badge: 'Synchronbewegung'
  }
];
