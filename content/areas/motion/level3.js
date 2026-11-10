'use strict';
const { L, brHelp, helpLink, fhnw, community, R, vid, ioAxisOut } = require('./common');

const AXREF = { name: 'gAxis01', type: 'AXIS_REF', dir: 'in', label: 'Achsreferenz gAxis01' };

// ─────────────────────────────────────────────── M4 · PLCopen-Sequenz
const PLC_TYP = L(
  'TYPE',
  '\teStep : (ST_OFF := 0, ST_HOME := 10, ST_READY := 20, ST_MOVE := 30, ST_ERROR := 90);',
  'END_TYPE'
);
const PLC_VAR = L(
  'VAR',
  '\tfbPower : MC_Power;',
  '\tfbHome : MC_Home;',
  '\tfbMove : MC_MoveAbsolute;',
  '\tfbReadPos : MC_ReadActualPosition;',
  '\trtGo : R_TRIG;',
  '\teStep : eStep;',
  'END_VAR'
);
const PLC_TAIL = L(
  '',
  '\t(* Bausteine immer zyklisch aufrufen *)',
  '\tfbHome(Axis := ADR(gAxis01), Position := 0.0);',
  '\tfbMove(Axis := ADR(gAxis01), Velocity := 150.0, Acceleration := 1000.0, Deceleration := 1000.0);',
  '\tfbReadPos(Axis := ADR(gAxis01), Enable := TRUE);',
  '',
  '\tdoReady := (eStep = ST_READY);',
  '\tdoDone := fbMove.Done;',
  '\tdoError := fbHome.Error OR fbMove.Error;',
  '\trAxisPos := LREAL_TO_REAL(fbReadPos.Position);',
  'END_PROGRAM'
);
const PLC_START = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\trtGo(CLK := diGo);',
  '\tfbPower(Axis := ADR(gAxis01), Enable := diStart);',
  '',
  '\tCASE eStep OF',
  '\t\tST_OFF:',
  '\t\t\t(* TODO *)',
  '\t\tST_HOME:',
  '\t\t\t(* TODO: fbHome.Execute setzen, auf Done/Error reagieren *)',
  '\t\tST_READY:',
  '\t\t\t(* TODO *)',
  '\t\tST_MOVE:',
  '\t\t\t(* TODO: Handshake Execute/Done *)',
  '\t\tST_ERROR:',
  '\t\t\t;',
  '\tEND_CASE'
) + PLC_TAIL;
const PLC_SOL = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\trtGo(CLK := diGo);',
  '\tfbPower(Axis := ADR(gAxis01), Enable := diStart);',
  '',
  '\tIF NOT diStart THEN',
  '\t\teStep := ST_OFF;',
  '\tEND_IF',
  '',
  '\tCASE eStep OF',
  '\t\tST_OFF:',
  '\t\t\tfbHome.Execute := FALSE;',
  '\t\t\tfbMove.Execute := FALSE;',
  '\t\t\tIF diStart AND fbPower.Status THEN',
  '\t\t\t\teStep := ST_HOME;',
  '\t\t\tEND_IF',
  '',
  '\t\tST_HOME:',
  '\t\t\tfbHome.Execute := TRUE;',
  '\t\t\tIF fbHome.Done THEN',
  '\t\t\t\tfbHome.Execute := FALSE;',
  '\t\t\t\teStep := ST_READY;',
  '\t\t\tELSIF fbHome.Error THEN',
  '\t\t\t\tfbHome.Execute := FALSE;',
  '\t\t\t\teStep := ST_ERROR;',
  '\t\t\tEND_IF',
  '',
  '\t\tST_READY:',
  '\t\t\tIF rtGo.Q THEN',
  '\t\t\t\tfbMove.Position := rTarget;',
  '\t\t\t\tfbMove.Execute := TRUE;',
  '\t\t\t\teStep := ST_MOVE;',
  '\t\t\tEND_IF',
  '',
  '\t\tST_MOVE:',
  '\t\t\tIF fbMove.Done THEN',
  '\t\t\t\tfbMove.Execute := FALSE;   (* Handshake: Execute zurück, sonst keine neue Flanke *)',
  '\t\t\t\teStep := ST_READY;',
  '\t\t\tELSIF fbMove.Error OR fbMove.CommandAborted THEN',
  '\t\t\t\tfbMove.Execute := FALSE;',
  '\t\t\t\teStep := ST_ERROR;',
  '\t\t\tEND_IF',
  '',
  '\t\tST_ERROR:',
  '\t\t\t(* bleibt, bis diStart weggenommen wird *)',
  '\t\t\t;',
  '\tEND_CASE'
) + PLC_TAIL;

// ─────────────────────────────────────────────── M4 · Fehlersuche Schrittvorschub
const STEP_VAR = L(
  'VAR',
  '\tfbPower : MC_Power;',
  '\tfbHome : MC_Home;',
  '\tfbStep : MC_MoveRelative;',
  '\tfbReadPos : MC_ReadActualPosition;',
  '\trtStep : R_TRIG;',
  '\tbHomed : BOOL;',
  'END_VAR'
);
const STEP_BUG = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\tfbPower(Axis := ADR(gAxis01), Enable := diOn);',
  '\tfbHome(Axis := ADR(gAxis01), Execute := diOn, Position := 0.0);',
  '\tbHomed := fbHome.Done;',
  '',
  '\trtStep(CLK := diStep);',
  '\tIF rtStep.Q THEN',
  '\t\tnSteps := nSteps + 1;',
  '\tEND_IF',
  '\tfbStep.Execute := diStep;',
  '\tfbStep(Axis := ADR(gAxis01), Distance := 50.0, Velocity := 100.0, Acceleration := 500.0, Deceleration := 500.0);',
  '',
  '\tfbReadPos(Axis := ADR(gAxis01), Enable := TRUE);',
  '\trAxisPos := LREAL_TO_REAL(fbReadPos.Position);',
  '\tdoReady := bHomed AND NOT fbStep.Busy;',
  'END_PROGRAM'
);
const STEP_SOL = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\tfbPower(Axis := ADR(gAxis01), Enable := diOn);',
  '\tIF NOT diOn THEN',
  '\t\tbHomed := FALSE;',
  '\tEND_IF',
  '\t(* Fix 1: Referenzieren erst, wenn der Regler eingeschaltet ist *)',
  '\tfbHome(Axis := ADR(gAxis01), Execute := fbPower.Status AND NOT bHomed, Position := 0.0);',
  '\tIF fbHome.Done THEN',
  '\t\tbHomed := TRUE;',
  '\tEND_IF',
  '',
  '\t(* Fix 3: Schritt erst zählen, wenn er fertig ist (Done nur zusammen mit Execute auswerten) *)',
  '\tIF fbStep.Execute AND fbStep.Done THEN',
  '\t\tnSteps := nSteps + 1;',
  '\t\tfbStep.Execute := FALSE;',
  '\tELSIF fbStep.Error OR fbStep.CommandAborted THEN',
  '\t\tfbStep.Execute := FALSE;',
  '\tEND_IF',
  '\t(* Fix 2: neuer Schritt nur, wenn keine Fahrt läuft *)',
  '\trtStep(CLK := diStep);',
  '\tIF rtStep.Q AND bHomed AND NOT fbStep.Busy AND NOT fbStep.Execute AND NOT fbStep.Done THEN',
  '\t\tfbStep.Execute := TRUE;',
  '\tEND_IF',
  '\tfbStep(Axis := ADR(gAxis01), Distance := 50.0, Velocity := 100.0, Acceleration := 500.0, Deceleration := 500.0);',
  '',
  '\tfbReadPos(Axis := ADR(gAxis01), Enable := TRUE);',
  '\trAxisPos := LREAL_TO_REAL(fbReadPos.Position);',
  '\tdoReady := bHomed AND NOT fbStep.Busy AND NOT fbStep.Execute AND NOT fbStep.Done;',
  'END_PROGRAM'
);
const stepPulse = [{ set: { diStep: true } }, { cycles: 2 }, { set: { diStep: false } }];

// ─────────────────────────────────────────────── M5 · Tippbetrieb mit Software-Endlagen
const JOG_TYP = L(
  'TYPE',
  '\teJogState : (JOG_IDLE := 0, JOG_RUN := 10, JOG_STOP := 20);',
  'END_TYPE'
);
const JOG_VAR = L(
  'VAR CONSTANT',
  '\tLIMIT_NEG : LREAL := 0.0;     (* Software-Endlage negativ [mm] *)',
  '\tLIMIT_POS : LREAL := 300.0;   (* Software-Endlage positiv [mm] *)',
  '\tJOG_VEL : REAL := 50.0;       (* Tippgeschwindigkeit [mm/s] *)',
  'END_VAR',
  'VAR',
  '\tMpAxisBasic_0 : MpAxisBasic;',
  '\tAxisPar : MpAxisBasicParType;',
  '\teJog : eJogState;',
  '\tbJogPos : BOOL;',
  '\tbJogNeg : BOOL;',
  '\tbDirPos : BOOL;',
  '\tbJogOk : BOOL;',
  'END_VAR'
);
const JOG_HEAD = L(
  'PROGRAM _INIT',
  '\tAxisPar.Velocity := JOG_VEL;',
  '\tAxisPar.Acceleration := 500.0;',
  '\tAxisPar.Deceleration := 500.0;',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\tMpAxisBasic_0.MpLink := ADR(gAxis01);',
  '\tMpAxisBasic_0.Enable := TRUE;',
  '\tMpAxisBasic_0.Parameters := ADR(AxisPar);',
  '\tMpAxisBasic_0.Power := diPower;',
  '\t(* nach dem Einschalten automatisch referenzieren *)',
  '\tMpAxisBasic_0.Home := diPower AND MpAxisBasic_0.PowerOn AND NOT MpAxisBasic_0.IsHomed;',
  ''
);
const JOG_TAIL = L(
  '',
  '\tMpAxisBasic_0();',
  '',
  '\tdoHomed := MpAxisBasic_0.IsHomed;',
  '\tdoError := MpAxisBasic_0.Error;',
  '\tdoAtLimitPos := MpAxisBasic_0.IsHomed AND MpAxisBasic_0.Position >= LIMIT_POS - 0.01;',
  '\tdoAtLimitNeg := MpAxisBasic_0.IsHomed AND MpAxisBasic_0.Position <= LIMIT_NEG + 0.01;',
  '\trAxisPos := LREAL_TO_REAL(MpAxisBasic_0.Position);',
  '\trAxisVel := MpAxisBasic_0.Velocity;',
  'END_PROGRAM'
);
const JOG_START = JOG_HEAD + L(
  '\t(* TODO: Tippbetrieb mit Software-Endlagen',
  '\t   - Tippen nur, wenn eingeschaltet und referenziert',
  '\t   - beide Taster gleichzeitig: keine Bewegung',
  '\t   - Achse darf die Endlagen nicht überfahren *)'
) + JOG_TAIL;
const JOG_SOL = JOG_HEAD + L(
  '\tbJogPos := diJogPos AND NOT diJogNeg;',
  '\tbJogNeg := diJogNeg AND NOT diJogPos;',
  '\tbJogOk := MpAxisBasic_0.PowerOn AND MpAxisBasic_0.IsHomed AND NOT MpAxisBasic_0.Error;',
  '',
  '\tCASE eJog OF',
  '\t\tJOG_IDLE:',
  '\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\tMpAxisBasic_0.Stop := FALSE;',
  '\t\t\tIF bJogOk AND bJogPos THEN',
  '\t\t\t\t(* Ziel = Endlage: die Achse bremst rechtzeitig und steht genau dort *)',
  '\t\t\t\tAxisPar.Position := LIMIT_POS;',
  '\t\t\t\tbDirPos := TRUE;',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := TRUE;',
  '\t\t\t\teJog := JOG_RUN;',
  '\t\t\tELSIF bJogOk AND bJogNeg THEN',
  '\t\t\t\tAxisPar.Position := LIMIT_NEG;',
  '\t\t\t\tbDirPos := FALSE;',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := TRUE;',
  '\t\t\t\teJog := JOG_RUN;',
  '\t\t\tEND_IF',
  '',
  '\t\tJOG_RUN:',
  '\t\t\tIF NOT bJogOk OR (bDirPos AND NOT bJogPos) OR (NOT bDirPos AND NOT bJogNeg) THEN',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\t\tMpAxisBasic_0.Stop := TRUE;',
  '\t\t\t\teJog := JOG_STOP;',
  '\t\t\tEND_IF',
  '',
  '\t\tJOG_STOP:',
  '\t\t\tMpAxisBasic_0.Stop := TRUE;',
  '\t\t\tIF MpAxisBasic_0.Stopped THEN',
  '\t\t\t\tMpAxisBasic_0.Stop := FALSE;',
  '\t\t\t\teJog := JOG_IDLE;',
  '\t\t\tEND_IF',
  '\tEND_CASE'
) + JOG_TAIL;
const JOG_IO = [
  AXREF,
  { name: 'diPower', type: 'BOOL', dir: 'in', label: 'Schalter Regler ein', widget: 'switch' },
  { name: 'diJogPos', type: 'BOOL', dir: 'in', label: 'Taster Tippen +', widget: 'button' },
  { name: 'diJogNeg', type: 'BOOL', dir: 'in', label: 'Taster Tippen −', widget: 'button' },
  { name: 'doHomed', type: 'BOOL', dir: 'out', label: 'Referenziert', widget: 'led' },
  { name: 'doError', type: 'BOOL', dir: 'out', label: 'Achsfehler', widget: 'led' },
  { name: 'doAtLimitPos', type: 'BOOL', dir: 'out', label: 'Endlage + erreicht', widget: 'led' },
  { name: 'doAtLimitNeg', type: 'BOOL', dir: 'out', label: 'Endlage − erreicht', widget: 'led' },
  ...ioAxisOut
];
const powerHome = [{ set: { diPower: true } }, { until: 'doHomed', maxMs: 1500 }];

// ─────────────────────────────────────────────── M5 · Pendelbetrieb
const PEND_TYP = L(
  'TYPE',
  '\tePendState : (PEND_IDLE := 0, PEND_TO_A := 10, PEND_DWELL_A := 20, PEND_TO_B := 30, PEND_DWELL_B := 40);',
  'END_TYPE'
);
const PEND_VAR = L(
  'VAR CONSTANT',
  '\tPOS_A : LREAL := 50.0;',
  '\tPOS_B : LREAL := 250.0;',
  'END_VAR',
  'VAR',
  '\tMpAxisBasic_0 : MpAxisBasic;',
  '\tAxisPar : MpAxisBasicParType;',
  '\tePend : ePendState;',
  '\ttonDwell : TON;',
  '\tbReady : BOOL;',
  'END_VAR'
);
const PEND_HEAD = L(
  'PROGRAM _INIT',
  '\tAxisPar.Velocity := 200.0;',
  '\tAxisPar.Acceleration := 1000.0;',
  '\tAxisPar.Deceleration := 1000.0;',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\tMpAxisBasic_0.MpLink := ADR(gAxis01);',
  '\tMpAxisBasic_0.Enable := TRUE;',
  '\tMpAxisBasic_0.Parameters := ADR(AxisPar);',
  '\tMpAxisBasic_0.Power := diPower;',
  '\tMpAxisBasic_0.Home := diPower AND MpAxisBasic_0.PowerOn AND NOT MpAxisBasic_0.IsHomed;',
  '\tbReady := MpAxisBasic_0.PowerOn AND MpAxisBasic_0.IsHomed AND NOT MpAxisBasic_0.Error;',
  ''
);
const PEND_TAIL = L(
  '',
  '\tMpAxisBasic_0();',
  '',
  '\tdoError := MpAxisBasic_0.Error;',
  '\tdoAtA := MpAxisBasic_0.InPosition AND ABS(MpAxisBasic_0.Position - POS_A) < 0.01;',
  '\tdoAtB := MpAxisBasic_0.InPosition AND ABS(MpAxisBasic_0.Position - POS_B) < 0.01;',
  '\trAxisPos := LREAL_TO_REAL(MpAxisBasic_0.Position);',
  '\trAxisVel := MpAxisBasic_0.Velocity;',
  'END_PROGRAM'
);
const PEND_START = PEND_HEAD + L(
  '\t(* TODO: Pendelbetrieb A <-> B mit 200 ms Verweilzeit, Zykluszähler nCycles *)',
  '\tCASE ePend OF',
  '\t\tPEND_IDLE:',
  '\t\t\t;',
  '\tEND_CASE'
) + PEND_TAIL;
const PEND_SOL = PEND_HEAD + L(
  '\tIF NOT bReady THEN',
  '\t\tePend := PEND_IDLE;',
  '\tEND_IF',
  '',
  '\tCASE ePend OF',
  '\t\tPEND_IDLE:',
  '\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\tIF bReady AND diRun THEN',
  '\t\t\t\tAxisPar.Position := POS_A;',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := TRUE;',
  '\t\t\t\tePend := PEND_TO_A;',
  '\t\t\tEND_IF',
  '',
  '\t\tPEND_TO_A:',
  '\t\t\tIF MpAxisBasic_0.InPosition THEN',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\t\tePend := PEND_DWELL_A;',
  '\t\t\tEND_IF',
  '',
  '\t\tPEND_DWELL_A:',
  '\t\t\tIF NOT diRun THEN',
  '\t\t\t\tePend := PEND_IDLE;',
  '\t\t\tELSIF tonDwell.Q THEN',
  '\t\t\t\tAxisPar.Position := POS_B;',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := TRUE;',
  '\t\t\t\tePend := PEND_TO_B;',
  '\t\t\tEND_IF',
  '',
  '\t\tPEND_TO_B:',
  '\t\t\tIF MpAxisBasic_0.InPosition THEN',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\t\tePend := PEND_DWELL_B;',
  '\t\t\tEND_IF',
  '',
  '\t\tPEND_DWELL_B:',
  '\t\t\tIF NOT diRun THEN',
  '\t\t\t\tePend := PEND_IDLE;',
  '\t\t\tELSIF tonDwell.Q THEN',
  '\t\t\t\tAxisPar.Position := POS_A;',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := TRUE;',
  '\t\t\t\tnCycles := nCycles + 1;   (* B -> A beginnt: ein Zyklus A-B-A wird abgeschlossen *)',
  '\t\t\t\tePend := PEND_TO_A;',
  '\t\t\tEND_IF',
  '\tEND_CASE',
  '',
  '\ttonDwell(IN := (ePend = PEND_DWELL_A) OR (ePend = PEND_DWELL_B), PT := T#200ms);'
) + PEND_TAIL;
// Hinweis: nCycles zählt beim Start der Rückfahrt; Tests prüfen ">= 1" erst nach Ankunft in A.

// ─────────────────────────────────────────────── M6 · Achs-Zustandsautomat als FB
const SM_TYP = L(
  'TYPE',
  '\teAxSmState : (AXSM_DISABLED := 0, AXSM_POWERON := 10, AXSM_HOMING := 20, AXSM_READY := 30, AXSM_MOVING := 40, AXSM_ERROR := 90, AXSM_RESET := 95);',
  'END_TYPE'
);
const SM_FB_HEAD = L(
  '(* In AS6 steht die Deklaration in der .fun-Datei der Bibliothek bzw. des Pakets *)',
  'FUNCTION_BLOCK FB_AxisSM',
  'VAR_INPUT',
  '\tbEnable : BOOL;',
  '\tbMove : BOOL;        (* steigende Flanke startet Fahrt *)',
  '\trTarget : REAL;',
  '\trVelocity : REAL;',
  '\tbAck : BOOL;         (* steigende Flanke quittiert *)',
  'END_VAR',
  'VAR_OUTPUT',
  '\teState : eAxSmState;',
  '\tbReady : BOOL;',
  '\tbError : BOOL;',
  '\trPosition : REAL;',
  'END_VAR',
  'VAR_IN_OUT',
  '\tAxis : AXIS_REF;',
  'END_VAR',
  'VAR',
  '\tfbPower : MC_Power;',
  '\tfbHome : MC_Home;',
  '\tfbMove : MC_MoveAbsolute;',
  '\tfbReset : MC_Reset;',
  '\tfbStatus : MC_ReadStatus;',
  '\tfbReadPos : MC_ReadActualPosition;',
  '\trtMove : R_TRIG;',
  '\trtAck : R_TRIG;',
  'END_VAR',
  ''
);
const SM_FB_CALLS = L(
  '',
  '\tfbPower(Axis := Axis, Enable := bEnable);',
  '\tfbHome(Axis := Axis, Position := 0.0);',
  '\tfbMove(Axis := Axis, Acceleration := 1000.0, Deceleration := 1000.0);',
  '\tfbReset(Axis := Axis);',
  '\tfbReadPos(Axis := Axis, Enable := TRUE);',
  '',
  '\tbReady := (eState = AXSM_READY);',
  '\tbError := (eState = AXSM_ERROR);',
  '\trPosition := LREAL_TO_REAL(fbReadPos.Position);',
  'END_FUNCTION_BLOCK',
  ''
);
const SM_FB_START = SM_FB_HEAD + L(
  '\tfbStatus(Axis := Axis, Enable := TRUE);',
  '\trtMove(CLK := bMove);',
  '\trtAck(CLK := bAck);',
  '',
  '\t(* TODO: Zustandsautomat',
  '\t   DISABLED -> POWERON -> HOMING -> READY <-> MOVING',
  '\t   Fehler (fbStatus.ErrorStop) -> ERROR -> (bAck) -> RESET -> POWERON',
  '\t   NOT bEnable -> DISABLED aus jedem Zustand *)',
  '\tCASE eState OF',
  '\t\tAXSM_DISABLED:',
  '\t\t\tIF bEnable THEN',
  '\t\t\t\teState := AXSM_POWERON;',
  '\t\t\tEND_IF',
  '\tEND_CASE'
) + SM_FB_CALLS;
const SM_FB_SOL = SM_FB_HEAD + L(
  '\tfbStatus(Axis := Axis, Enable := TRUE);',
  '\trtMove(CLK := bMove);',
  '\trtAck(CLK := bAck);',
  '',
  '\t(* zustandsübergreifende Übergänge *)',
  '\tIF NOT bEnable THEN',
  '\t\teState := AXSM_DISABLED;',
  '\tELSIF fbStatus.ErrorStop AND eState <> AXSM_ERROR AND eState <> AXSM_RESET THEN',
  '\t\teState := AXSM_ERROR;',
  '\tEND_IF',
  '',
  '\tCASE eState OF',
  '\t\tAXSM_DISABLED:',
  '\t\t\tfbHome.Execute := FALSE;',
  '\t\t\tfbMove.Execute := FALSE;',
  '\t\t\tfbReset.Execute := FALSE;',
  '\t\t\tIF bEnable THEN',
  '\t\t\t\teState := AXSM_POWERON;',
  '\t\t\tEND_IF',
  '',
  '\t\tAXSM_POWERON:',
  '\t\t\tIF fbPower.Status THEN',
  '\t\t\t\teState := AXSM_HOMING;',
  '\t\t\tEND_IF',
  '',
  '\t\tAXSM_HOMING:',
  '\t\t\tfbHome.Execute := TRUE;',
  '\t\t\tIF fbHome.Done THEN',
  '\t\t\t\tfbHome.Execute := FALSE;',
  '\t\t\t\teState := AXSM_READY;',
  '\t\t\tEND_IF',
  '',
  '\t\tAXSM_READY:',
  '\t\t\tIF rtMove.Q THEN',
  '\t\t\t\tfbMove.Position := rTarget;',
  '\t\t\t\tfbMove.Velocity := rVelocity;',
  '\t\t\t\tfbMove.Execute := TRUE;',
  '\t\t\t\teState := AXSM_MOVING;',
  '\t\t\tEND_IF',
  '',
  '\t\tAXSM_MOVING:',
  '\t\t\tIF fbMove.Done THEN',
  '\t\t\t\tfbMove.Execute := FALSE;',
  '\t\t\t\teState := AXSM_READY;',
  '\t\t\tEND_IF',
  '',
  '\t\tAXSM_ERROR:',
  '\t\t\tfbHome.Execute := FALSE;',
  '\t\t\tfbMove.Execute := FALSE;',
  '\t\t\tIF rtAck.Q THEN',
  '\t\t\t\tfbReset.Execute := TRUE;',
  '\t\t\t\teState := AXSM_RESET;',
  '\t\t\tEND_IF',
  '',
  '\t\tAXSM_RESET:',
  '\t\t\tIF fbReset.Done OR fbReset.Error THEN',
  '\t\t\t\tfbReset.Execute := FALSE;',
  '\t\t\t\teState := AXSM_POWERON;   (* steht der Fehler noch an, geht es sofort zurück nach ERROR *)',
  '\t\t\tEND_IF',
  '\tEND_CASE'
) + SM_FB_CALLS;
const SM_VAR = L('VAR', '\tfbAxis1 : FB_AxisSM;', 'END_VAR');
const SM_PRG = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\tfbAxis1(Axis := gAxis01, bEnable := diEnable, bMove := diMove, rTarget := rTarget, rVelocity := rVelSet, bAck := diAck);',
  '\tdoReady := fbAxis1.bReady;',
  '\tdoError := fbAxis1.bError;',
  '\tnState := fbAxis1.eState;',
  '\trAxisPos := fbAxis1.rPosition;',
  'END_PROGRAM'
);
const pulse = (v) => [{ set: { [v]: true } }, { cycles: 2 }, { set: { [v]: false } }];

module.exports = [
  // ───────────────────────────────────────────── Level 3 · Modul 1
  {
    id: 'motion-3-plcopen',
    level: 3,
    kind: 'lektion',
    title: 'PLCopen Motion: Zustandsdiagramm und MC-Bausteine',
    summary: 'Du kennst das PLCopen-Zustandsdiagramm einer Achse und programmierst Abläufe mit MC_Power, MC_Home, MC_MoveAbsolute & Co. inklusive Execute/Done-Handshake.',
    minutes: 210,
    req: ['motion-2-mpaxisbasic'],
    briefing: 'MpAxisBasic bündelt viele Funktionen in einem Baustein. Darunter liegt der herstellerübergreifende Standard PLCopen Motion Control: Jede Achse befindet sich in genau einem Zustand (Disabled, Standstill, Homing, Discrete Motion, Continuous Motion, Synchronized Motion, Stopping, ErrorStop), und jeder Bewegungsbaustein ist ein Übergang. Die Bausteine folgen einem einheitlichen Schema: Start mit steigender Flanke an Execute, Rückmeldung über Busy, Active, Done, CommandAborted und Error. Wer dieses Schema beherrscht, kann Achsen bei B&R, Siemens, Beckhoff oder CODESYS gleich gut programmieren.',
    practice: 'Komplexe Abläufe (Synchronisation, Sonderreferenzierungen, Messfahrten) werden nicht mit MpAxisBasic, sondern direkt mit MC-Bausteinen programmiert. Ein vergessenes Zurücksetzen von Execute ist dabei der häufigste Grund für „die Achse fährt nur beim ersten Mal“.',
    transfer: {
      tia: 'SIMATIC S7-1500 nutzt dieselbe Logik mit MC_Power, MC_Home, MC_MoveAbsolute am Technologieobjekt; Statusausgänge heißen gleich (Done, Busy, CommandAborted, Error).',
      codesys: 'CODESYS SoftMotion und TwinCAT (Tc2_MC2) implementieren ebenfalls PLCopen Part 1. Das Zustandsdiagramm ist identisch, Unterschiede liegen in Zusatzbausteinen und Fehlercodes.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre das PLCopen-Zustandsdiagramm',
        guide: {
          intro: 'Das Zustandsdiagramm legt fest, welche Befehle in welchem Zustand erlaubt sind.',
          steps: [
            'Öffne in der B&R-Hilfe die Seite „Zustandsdiagramm“ der Bibliothek McAxis und zeichne das Diagramm ab.',
            'Markiere die Übergänge: MC_Power.Enable → Standstill; MC_Home → Homing; MC_MoveAbsolute → Discrete Motion; MC_MoveVelocity → Continuous Motion; MC_Stop → Stopping; Fehler → ErrorStop (aus jedem Zustand).',
            'Notiere die Ausgänge: aus ErrorStop nur mit MC_Reset, je nach Power-Status nach Disabled oder Standstill.',
            'Notiere die Sonderregel für MC_Stop: Die Achse bleibt in Stopping, solange Execute TRUE ist.',
            'Kläre: Was passiert laut Hilfe, wenn ein Baustein in einem nicht erlaubten Zustand aufgerufen wird? (Antwort: Es wird ein Fehler gemeldet.)'
          ],
          done: 'Erledigt, wenn du für jeden Zustand die erlaubten Bewegungsbefehle nennen kannst.',
          tip: 'Der aktuelle Zustand lässt sich mit MC_ReadStatus abfragen. Nutze ihn im Programm statt eigener „Schattenzustände“.',
          link: helpLink('state', 'Zustandsdiagramm (McAxis)')
        }
      },
      {
        id: 'o2',
        title: 'Wende das Execute/Done-Handshake korrekt an',
        guide: {
          intro: 'Alle PLCopen-Bausteine mit Execute verhalten sich gleich. Das musst du verinnerlichen.',
          steps: [
            'Steigende Flanke an Execute startet den Befehl; die Eingänge (Position, Velocity …) werden dabei übernommen.',
            'Busy ist TRUE, solange der Befehl läuft; Active, solange der Baustein die Achse tatsächlich steuert.',
            'Done, Error und CommandAborted sind „Endzustände“: Sie bleiben TRUE, solange Execute TRUE ist; ist Execute schon FALSE, sind sie mindestens einen Zyklus sichtbar.',
            'Setze Execute nach Done/Error/CommandAborted zurück – sonst startet der nächste Befehl nicht.',
            'Rufe alle Bausteine in jedem Zyklus auf, nicht nur in einem CASE-Zweig.'
          ],
          code: { lang: 'st', text: 'IF fbMove.Done THEN\n\tfbMove.Execute := FALSE;\n\teStep := ST_READY;\nELSIF fbMove.Error OR fbMove.CommandAborted THEN\n\tfbMove.Execute := FALSE;\n\teStep := ST_ERROR;\nEND_IF' },
          done: 'Erledigt, wenn du erklären kannst, warum ein Done auch nach dem Rücksetzen von Execute noch einen Zyklus TRUE sein kann.',
          tip: 'Werte Done immer zusammen mit dem eigenen Execute aus, wenn du Ereignisse zählst – sonst zählst du doppelt.',
          link: helpLink('mcMoveAbs', 'MC_MoveAbsolute')
        }
      },
      {
        id: 'o3',
        title: 'Unterscheide MC_Stop und MC_Halt, MoveAbsolute und MoveRelative',
        guide: {
          intro: 'Ähnliche Bausteine haben wichtige Unterschiede im Zustandsdiagramm.',
          steps: [
            'MC_Stop: Achse geht nach Stopping und ist dort für andere Befehle gesperrt, bis Execute FALSE ist. Gedacht für Not-Halt-ähnliche Stopps im Programm.',
            'MC_Halt: kontrolliertes Anhalten in Discrete Motion; kann von einem neuen Bewegungsbefehl abgelöst werden. Gedacht für normales Anhalten.',
            'MC_MoveAbsolute fährt auf eine absolute Position (Achse muss referenziert sein), MC_MoveRelative um eine Distanz von der aktuellen Position.',
            'MC_MoveVelocity fährt endlos mit konstanter Geschwindigkeit (Continuous Motion); InVelocity meldet das Erreichen.',
            'MC_Reset quittiert ErrorStop; MC_Power schaltet den Regler.'
          ],
          done: 'Erledigt, wenn du für „Schutztür öffnet“ und „Zyklusende“ jeweils begründet MC_Stop oder MC_Halt wählst.',
          tip: 'Eine Distanz mit MC_MoveRelative bezieht sich auf die Position beim Start. Wird der Befehl während einer Fahrt neu gestartet, verschiebt sich das Ziel – deshalb Verriegelung gegen laufende Fahrten.',
          link: helpLink('mcStop', 'MC_Stop')
        }
      },
      {
        id: 'o4',
        title: 'Programmiere eine Sequenz mit MC-Bausteinen',
        guide: {
          intro: 'Löse beide Übungen. Die erste baut eine Sequenz neu auf, die zweite ist eine Fehlersuche in fremdem Code.',
          steps: [
            'Lege im Projekt die Instanzen fbPower, fbHome, fbMove an und übergib `Axis := ADR(gAxis01)`.',
            'Programmiere die Sequenz: Power → Status abwarten → Home → Done → bereit → Fahrt mit Handshake.',
            'Prüfe im Watch-Fenster alle Statusausgänge während einer Fahrt.',
            'Analysiere in der Fehlersuche-Übung jede Zeile mit dem Zustandsdiagramm im Kopf.'
          ],
          done: 'Erledigt, wenn beide Übungen alle Tests bestehen.',
          tip: 'Bei der Fehlersuche hilft eine Tabelle: Zyklus, Execute, Busy, Done, Achszustand. So sieht man, wann eine Flanke verloren geht.'
        }
      }
    ],
    videos: [
      vid('plcopen', 'Vorstellung der PLCopen-Motion-Spezifikation durch die Organisation selbst.'),
      vid('twincatFb', 'Erklärt MC_Power, MC_MoveAbsolute & Co. und das Handshake an einem anderen System – das Prinzip ist übertragbar.'),
      vid('griesMotion', 'Deutsche Hochschulvorlesung zu Motion-Anwendungen, PLCopen, Positionierung und Synchronisierung.')
    ],
    readings: [
      brHelp('state', 'Zustandsdiagramm', 20, 'Das offizielle Zustandsdiagramm der B&R-Bibliothek McAxis mit allen Übergängen.'),
      brHelp('mcPower', 'MC_Power', 10, 'Schnittstelle und Verhalten des Einschaltbausteins.'),
      R.plcopenMotion
    ],
    quiz: [
      { type: 'single', q: 'Wie verlässt eine Achse den Zustand ErrorStop?', options: ['Mit MC_Power.Enable = FALSE', 'Mit MC_Reset (nach Beseitigung der Ursache)', 'Automatisch nach 1 s', 'Mit MC_Stop'], correct: 1, explain: 'ErrorStop wird mit MC_Reset verlassen – je nach Power-Status nach Disabled oder Standstill.' },
      { type: 'single', q: 'MC_MoveAbsolute hat Done = TRUE gemeldet. Execute bleibt dauerhaft TRUE. Was passiert bei einer neuen Zielposition?', options: ['Die Achse fährt sofort los', 'Nichts – ohne neue steigende Flanke an Execute startet kein neuer Befehl', 'Die Achse geht in ErrorStop', 'Die Achse fährt zurück auf 0'], correct: 1, explain: 'PLCopen-Bausteine übernehmen Eingänge nur mit steigender Flanke an Execute.' },
      { type: 'multi', q: 'Welche Aussagen zu MC_Stop sind richtig?', options: ['Die Achse bleibt in Stopping, solange Execute TRUE ist', 'Andere Bewegungsbefehle werden in Stopping abgewiesen', 'MC_Stop entspricht MC_Halt', 'Nach Done und Execute = FALSE geht die Achse nach Standstill'], correct: [0, 1, 3], explain: 'MC_Stop sperrt die Achse in Stopping; MC_Halt ist ein normales, ablösbares Anhalten.' }
    ],
    exam: [
      { type: 'single', q: 'In welchem PLCopen-Zustand ist eine Achse, die mit MC_MoveVelocity endlos dreht?', options: ['Discrete Motion', 'Continuous Motion', 'Synchronized Motion', 'Standstill'], correct: 1, explain: 'Endlose Geschwindigkeitsbewegungen gehören zu Continuous Motion.' },
      { type: 'single', q: 'Ein Zähler soll fertige Schritte zählen: `IF fbStep.Done THEN n := n + 1; fbStep.Execute := FALSE; END_IF`. Was ist das Problem?', options: ['Keines', 'Done kann nach dem Rücksetzen von Execute noch einen Zyklus TRUE sein – es wird doppelt gezählt', 'Done wird nie TRUE', 'Der Zähler läuft über'], correct: 1, explain: 'Die Endzustandsausgänge sind mindestens einen Zyklus sichtbar, auch wenn Execute schon FALSE ist. Zählen nur mit `fbStep.Execute AND fbStep.Done`.' },
      { type: 'multi', q: 'Welche Ausgänge sind bei PLCopen-Bausteinen mit Execute „Endzustände“ eines Befehls?', options: ['Done', 'Error', 'CommandAborted', 'Busy'], correct: [0, 1, 2], explain: 'Busy zeigt den laufenden Befehl, Done/Error/CommandAborted das Ende.' },
      { type: 'single', q: 'Warum führt `fbHome(Execute := diOn, …)` zusammen mit `fbPower(Enable := diOn)` zu einem Fehler?', options: ['MC_Home braucht eine negative Position', 'Der Home-Befehl kommt, bevor der Regler eingeschaltet ist (Achse noch Disabled)', 'MC_Home darf nur einmal aufgerufen werden', 'MC_Power muss nach MC_Home stehen'], correct: 1, explain: 'MC_Power.Status wird erst nach einer Einschaltzeit TRUE; ein Home-Befehl im Zustand Disabled ist unzulässig.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Sequenz mit MC_Power, MC_Home und MC_MoveAbsolute',
        task: [
          'Programmiere eine Achssequenz nur mit PLCopen-Bausteinen (Achse `gAxis01`):',
          '',
          '1. `diStart` = TRUE schaltet den Regler ein (`MC_Power`). Sobald `Status` TRUE ist, wird mit `MC_Home` auf Position 0 referenziert.',
          '2. Nach `fbHome.Done` ist die Achse bereit (`doReady`).',
          '3. Eine steigende Flanke an `diGo` fährt mit `MC_MoveAbsolute` auf `rTarget` (v = 150 mm/s, a = d = 1000 mm/s²). Nach `Done` ist die Achse wieder bereit – **mehrere Fahrten nacheinander müssen funktionieren**.',
          '4. Ein Error oder CommandAborted führt in `ST_ERROR`.',
          '5. `diStart` = FALSE schaltet sofort ab und setzt die Sequenz zurück.',
          '',
          '**Simulation:** `MC_Power.Status` nach ca. 100 ms, Referenzieren ca. 200 ms. Ein Bewegungsbefehl auf eine ausgeschaltete oder nicht referenzierte Achse setzt die Achse in ErrorStop.'
        ].join('\n'),
        hints: ['Setze in ST_MOVE `fbMove.Execute := FALSE`, sobald `Done` kommt.', 'Die Bausteinaufrufe am Ende des Programms laufen in jedem Zyklus – in der CASE-Anweisung setzt du nur die Eingänge.'],
        cycleMs: 10,
        io: [
          AXREF,
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Schalter Betrieb', widget: 'switch' },
          { name: 'diGo', type: 'BOOL', dir: 'in', label: 'Taster Fahren', widget: 'button' },
          { name: 'rTarget', type: 'REAL', dir: 'in', label: 'Zielposition', widget: 'slider', min: 0, max: 500, unit: 'mm' },
          { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Bereit', widget: 'led' },
          { name: 'doDone', type: 'BOOL', dir: 'out', label: 'Fahrt fertig (Done)', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Fehler', widget: 'led' },
          ioAxisOut[0]
        ],
        scene: { type: 'axis', bind: { position: 'rAxisPos', min: 0, max: 500, powered: 'doReady', homed: 'doReady', error: 'doError' } },
        files: { main: PLC_START, var: PLC_VAR, typ: PLC_TYP },
        solution: { main: PLC_SOL, var: PLC_VAR, typ: PLC_TYP },
        tests: [
          { name: 'Einschalten und Referenzieren', steps: [{ set: { diStart: true } }, { until: 'doReady', maxMs: 1500, msg: 'Achse wird nicht bereit.' }, { expect: 'gAxis01.PowerOn AND gAxis01.IsHomed' }] },
          { name: 'Fahrt auf 120 mm', steps: [{ set: { diStart: true } }, { until: 'doReady', maxMs: 1500 }, { set: { rTarget: 120.0 } }, ...pulse('diGo'), { until: 'doDone AND ABS(rAxisPos - 120.0) < 0.01', maxMs: 3000, msg: 'Zielposition wird nicht erreicht oder Done nicht gemeldet.' }] },
          { name: 'Zweite Fahrt nach der ersten', steps: [{ set: { diStart: true } }, { until: 'doReady', maxMs: 1500 }, { set: { rTarget: 120.0 } }, ...pulse('diGo'), { until: 'doDone AND ABS(rAxisPos - 120.0) < 0.01', maxMs: 3000 }, { until: 'doReady', maxMs: 100 }, { set: { rTarget: 300.0 } }, ...pulse('diGo'), { until: 'doDone AND ABS(rAxisPos - 300.0) < 0.01', maxMs: 3000, msg: 'Zweite Fahrt startet nicht – Execute nach Done zurücksetzen.' }] },
          { name: 'Ausschalten', steps: [{ set: { diStart: true } }, { until: 'doReady', maxMs: 1500 }, { set: { diStart: false } }, { cycles: 2 }, { expect: 'NOT doReady AND NOT gAxis01.PowerOn', msg: 'diStart = FALSE muss sofort abschalten.' }] },
          { name: 'Fahrbefehl ohne Betrieb', steps: [...pulse('diGo'), { never: 'doError', ms: 1000, msg: 'Ein Fahrbefehl darf nur im Zustand bereit ausgeführt werden.' }] }
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'fehlersuche',
        title: 'Fehlersuche: Schrittvorschub mit MC_MoveRelative',
        task: [
          'Ein Kollege hat einen Schrittvorschub programmiert: Jeder Druck auf `diStep` soll die Achse um genau **50 mm** weiterfahren, `nSteps` zählt die **abgeschlossenen** Schritte. Im Test fällt auf: Die Achse wird nie bereit, und wenn doch, landet sie bei Doppeldrücken auf krummen Positionen und der Zähler stimmt nicht.',
          '',
          'Finde und behebe **drei** Fehler, sodass gilt:',
          '- Nach `diOn` wird der Regler eingeschaltet und anschließend referenziert; danach ist `doReady` TRUE.',
          '- Ein Tastendruck startet genau einen Schritt; Drücke während einer laufenden Fahrt werden ignoriert; Gedrückthalten startet nur einen Schritt.',
          '- `nSteps` zählt nur fertig gefahrene Schritte, jeden genau einmal.'
        ].join('\n'),
        hints: ['Wann ist `fbPower.Status` TRUE, und wann startet `fbHome`?', 'Was passiert mit MC_MoveRelative, wenn Execute während einer Fahrt neu ansteigt?', 'Done bleibt nach dem Rücksetzen von Execute noch einen Zyklus sichtbar.', '`doReady` sollte erst TRUE sein, wenn der Baustein wieder frei ist (nicht Busy, Execute und Done FALSE) – sonst geht ein schneller Tastendruck verloren.'],
        cycleMs: 10,
        io: [
          AXREF,
          { name: 'diOn', type: 'BOOL', dir: 'in', label: 'Schalter Ein', widget: 'switch' },
          { name: 'diStep', type: 'BOOL', dir: 'in', label: 'Taster Schritt', widget: 'button' },
          { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Bereit', widget: 'led' },
          { name: 'nSteps', type: 'UINT', dir: 'out', label: 'Fertige Schritte', widget: 'value' },
          ioAxisOut[0]
        ],
        scene: { type: 'axis', bind: { position: 'rAxisPos', min: 0, max: 500, powered: 'doReady', homed: 'doReady' } },
        files: { main: STEP_BUG, var: STEP_VAR, typ: '' },
        solution: { main: STEP_SOL, var: STEP_VAR, typ: '' },
        tests: [
          { name: 'Einschalten und Referenzieren', steps: [{ set: { diOn: true } }, { until: 'doReady', maxMs: 1500, msg: 'Achse wird nicht bereit – wann startet die Referenzierung?' }] },
          { name: 'Drei Schritte', steps: [{ set: { diOn: true } }, { until: 'doReady', maxMs: 1500 }, ...stepPulse, { until: 'doReady', maxMs: 2000 }, ...stepPulse, { until: 'doReady', maxMs: 2000 }, ...stepPulse, { until: 'doReady', maxMs: 2000 }, { cycles: 3 }, { expect: 'ABS(rAxisPos - 150.0) < 0.01', msg: 'Nach drei Schritten muss die Achse bei 150 mm stehen.' }, { expect: 'nSteps = 3', msg: 'nSteps muss 3 sein – jeder fertige Schritt genau einmal.' }] },
          { name: 'Druck während der Fahrt wird ignoriert', steps: [{ set: { diOn: true } }, { until: 'doReady', maxMs: 1500 }, ...stepPulse, { ms: 200 }, ...stepPulse, { until: 'doReady', maxMs: 2000 }, { cycles: 3 }, { expect: 'ABS(rAxisPos - 50.0) < 0.01 AND nSteps = 1', msg: 'Ein Druck während der Fahrt darf keinen neuen Schritt auslösen.' }] },
          { name: 'Gedrückt halten = ein Schritt', steps: [{ set: { diOn: true } }, { until: 'doReady', maxMs: 1500 }, { set: { diStep: true } }, { ms: 2000 }, { set: { diStep: false } }, { cycles: 3 }, { expect: 'ABS(rAxisPos - 50.0) < 0.01 AND nSteps = 1' }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 3 · Modul 2
  {
    id: 'motion-3-referenz-endlagen',
    level: 3,
    kind: 'lektion',
    title: 'Referenzieren, Software-Endlagen, Tipp- und Pendelbetrieb',
    summary: 'Du wählst die passende Referenzierart, schützt die Mechanik mit Software-Endlagen und programmierst Tippbetrieb und Pendelbetrieb robust.',
    minutes: 210,
    req: ['motion-3-plcopen'],
    briefing: 'Bevor eine Achse absolut positionieren darf, braucht sie einen Bezug zur Maschine: die Referenzierung. Je nach Geber und Mechanik wird direkt gesetzt, auf einen Referenzschalter, auf einen Endschalter oder einen mechanischen Anschlag gefahren, ggf. mit Nullimpuls des Gebers. Erst danach sind Software-Endlagen gültig, die die Mechanik vor dem Überfahren schützen. Im Einrichtbetrieb fährt der Bediener die Achse im Tippbetrieb – dabei dürfen die Endlagen nie überfahren werden. Im Testbetrieb (Einlaufen, Dauertest) pendelt die Achse zwischen zwei Positionen.',
    practice: 'Eine falsch gewählte Referenzierart oder fehlende Endlagen gehören zu den teuersten Inbetriebnahmefehlern: Ein Schlitten fährt beim ersten Tippen gegen den Anschlag. Saubere Endlagenbehandlung im Programm und in der Achskonfiguration verhindert das.',
    transfer: {
      tia: 'Im TIA Portal werden Referenzierart (aktiv/passiv, mit/ohne Nullmarke) und Software-Endschalter im Technologieobjekt konfiguriert; MC_Home hat einen Mode-Parameter.',
      codesys: 'TwinCAT bietet MC_Home mit verschiedenen Referenziermodi (Tc2_MC2_Homing-Bibliothek) und Software-Endlagen in der NC-Achse; Tippbetrieb über MC_Jog.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Wähle die passende Referenzierart',
        guide: {
          intro: 'Die Referenzierart hängt vom Geber und von der verfügbaren Sensorik ab.',
          steps: [
            'Direkt (Position setzen): für Absolutwertgeber oder wenn die Achse an einer bekannten Stelle steht.',
            'Referenzschalter (ggf. mit Nullimpuls): Achse sucht den Schalter in einer Richtung, wechselt ggf. und nimmt die Referenzmarke des Gebers.',
            'Endschalter: wie Referenzschalter, nutzt aber den Hardware-Endschalter – spart einen Sensor.',
            'Anschlag (Blockfahrt) mit Momentbegrenzung: ohne Sensor, nur bei geeigneter Mechanik.',
            'Absolutgeber: einmalig referenzieren, danach bleibt die Position erhalten; nach Motortausch neu referenzieren.'
          ],
          done: 'Erledigt, wenn du für drei Achsen deiner Ausbildungsanlage die Referenzierart begründet festlegen kannst.',
          tip: 'Referenziere so, dass die Achse vom Schalter weg in den Arbeitsbereich fährt. So steht sie nach dem Referenzieren nicht auf dem Schalter.',
          link: helpLink('mcHome', 'MC_Home')
        }
      },
      {
        id: 'o2',
        title: 'Konfiguriere Software-Endlagen und Bewegungsgrenzen',
        guide: {
          intro: 'Software-Endlagen begrenzen den Verfahrbereich in der Achskonfiguration – sie wirken erst nach dem Referenzieren.',
          steps: [
            'Öffne die .axis-Datei und trage unter den Software-Endlagen untere und obere Grenze ein (z. B. 0 und 300 mm).',
            'Lege die Endlagen etwas innerhalb der Hardware-Endschalter, damit vorher kontrolliert gebremst wird.',
            'Merke: Ein Bewegungsbefehl mit Ziel außerhalb der Endlagen wird von mapp Motion mit Fehler abgewiesen.',
            'Prüfe, wie MpAxisBasic im Tippbetrieb reagiert (laut Hilfe: Jog stoppt automatisch an der Software-Endlage).'
          ],
          done: 'Erledigt, wenn ein Fahrbefehl auf 310 mm in der Simulation einen Endlagenfehler erzeugt und ein Befehl auf 300 mm angenommen wird.',
          tip: 'Bei Rundachsen ohne Begrenzung (Periode 360°) gibt es keine Endlagen – dort ist die Periode einzustellen.',
          link: helpLink('units', 'Messeinheiten und Achsskalierung')
        }
      },
      {
        id: 'o3',
        title: 'Programmiere Tippbetrieb mit Endlagenschutz',
        guide: {
          intro: 'Tippen heißt: fahren, solange der Taster gedrückt ist. Damit die Achse an der Endlage sauber steht, statt einen Fehler auszulösen, nutzt du die Endlage als Fahrziel.',
          steps: [
            'Beim Drücken von Tippen + startest du MoveAbsolute auf die positive Endlage (Tippgeschwindigkeit, mäßige Beschleunigung).',
            'Beim Loslassen setzt du Stop, bis Stopped kommt, und nimmst Stop dann zurück.',
            'Beide Taster gleichzeitig: keine Bewegung. Ein Richtungswechsel ohne Loslassen führt erst zum Stopp.',
            'Tippen nur bei PowerOn, IsHomed und ohne Fehler. Ohne Referenz wäre die Endlage bedeutungslos – in diesem Fall nur langsam und mit Bestätigung (hier: gar nicht).'
          ],
          done: 'Erledigt, wenn die Übung „Tippbetrieb mit Software-Endlagen“ alle Tests besteht.',
          tip: 'Wenn du MpAxisBasic.JogPositive verwendest, übernimmt mapp die Endlagen. Die Variante mit MoveAbsolute zeigt dir, was dabei intern passiert, und funktioniert mit jedem PLCopen-System.'
        }
      },
      {
        id: 'o4',
        title: 'Programmiere einen Pendelbetrieb mit Verweilzeit',
        guide: {
          intro: 'Pendelbetrieb ist ein Klassiker für Einlauf- und Dauertests.',
          steps: [
            'Zustände: IDLE → TO_A → DWELL_A → TO_B → DWELL_B → TO_A …',
            'In den DWELL-Zuständen läuft ein TON (200 ms); erst danach startet die nächste Fahrt.',
            'Wird diRun weggenommen, wird die laufende Fahrt beendet und die Achse bleibt am Ziel stehen.',
            'Zähle vollständige Zyklen A → B → A für die Laufzeitstatistik.'
          ],
          done: 'Erledigt, wenn die Übung „Pendelbetrieb“ alle Tests besteht.',
          tip: 'Ein Pendeltest über Nacht mit Trace auf Schleppfehler und Motortemperatur deckt Mechanikprobleme auf, bevor die Maschine zum Kunden geht.'
        }
      }
    ],
    videos: [
      vid('twincatHoming', 'Zeigt Referenzieren, Tippbetrieb und Diagnose einer Achse – übertragbar auf mapp Motion.'),
      vid('units', 'B&R-Video zum Einheitenkonzept in mapp: wie Messeinheiten durchgängig verwendet werden.'),
      vid('geber', 'Wiederholung: Referenzmarke (Nullimpuls) eines Inkrementalgebers – die Grundlage vieler Referenzierarten.')
    ],
    readings: [
      brHelp('mcHome', 'MC_Home', 15, 'Beschreibt Referenziermodi und Parameter des PLCopen-Referenzierbausteins bei B&R.'),
      community(6420, 'homing-mode', 'Homing mode', 'rhys', 2025, 10, 'Praxisdiskussion zur Auswahl des Referenziermodus an realen Achsen.'),
      fhnw('geber', 'Gebersysteme', 15, 'Warum Inkremental- und Absolutgeber unterschiedliche Referenzierstrategien brauchen.')
    ],
    quiz: [
      { type: 'single', q: 'Ab wann sind Software-Endlagen wirksam?', options: ['Sofort nach dem Einschalten', 'Nach dem Referenzieren', 'Nur im Tippbetrieb', 'Nur in der Simulation'], correct: 1, explain: 'Ohne Referenz ist die Position nicht auf die Maschine bezogen – Endlagen hätten keine Bedeutung.' },
      { type: 'single', q: 'Welche Referenzierart eignet sich für eine Achse mit Multiturn-Absolutwertgeber im Normalbetrieb?', options: ['Bei jedem Einschalten auf den Referenzschalter fahren', 'Einmalig referenzieren, danach bleibt die Position erhalten', 'Blockfahrt', 'Keine, Absolutgeber brauchen nie eine Referenz'], correct: 1, explain: 'Der Absolutgeber behält die Position; einmalig (und nach Tausch von Motor/Kupplung) wird referenziert.' },
      { type: 'multi', q: 'Was gehört zu einem sicheren Tippbetrieb im Programm?', options: ['Nur bei PowerOn und ohne Fehler', 'Beide Taster gleichzeitig: keine Bewegung', 'Endlagen nicht überfahren', 'Hohe Beschleunigung für schnelles Reagieren'], correct: [0, 1, 2], explain: 'Tippbetrieb ist Einrichtbetrieb: langsam, kontrolliert, mit Endlagenschutz.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine Achse tippt mit v = {v} mm/s und bremst mit d = 500 mm/s². Wie lang ist der Bremsweg?', params: { v: [20, 100, 10] }, formula: 'v * v / (2 * 500)', unit: 'mm', tol: 0.01, explain: 's = v² / (2·d).' },
      { type: 'single', q: 'Warum ist MoveAbsolute auf die Endlage beim Tippen besser als MoveVelocity mit Abschalten kurz vor der Endlage?', options: ['Weil MoveVelocity verboten ist', 'Weil der Profilgenerator rechtzeitig bremst und die Achse exakt an der Endlage steht', 'Weil MoveAbsolute schneller ist', 'Weil dann keine Referenz nötig ist'], correct: 1, explain: 'Der Profilgenerator kennt Ziel und Verzögerung und plant den Bremsvorgang exakt; eine eigene Abschaltschwelle hängt von Geschwindigkeit und Zykluszeit ab.' },
      { type: 'single', q: 'Bei einer Referenzfahrt auf den Referenzschalter wird zusätzlich der Nullimpuls des Gebers ausgewertet. Wozu?', options: ['Um Strom zu sparen', 'Für eine reproduzierbarere Referenzposition als nur mit dem Schaltpunkt des Sensors', 'Weil der Schalter sonst nicht erkannt wird', 'Um die Endlagen zu deaktivieren'], correct: 1, explain: 'Der Schaltpunkt eines Sensors streut; der Nullimpuls ist mechanisch fest und damit genauer.' },
      { type: 'single', q: 'Im Pendelbetrieb soll beim Wegnehmen von diRun „die laufende Fahrt beendet“ werden. Welche Umsetzung passt?', options: ['Sofort Stop setzen', 'Fahrt zu Ende fahren, danach keine neue Fahrt starten', 'Power abschalten', 'ErrorReset setzen'], correct: 1, explain: 'Die Anforderung verlangt ein geordnetes Ende am Zielpunkt, kein Abbremsen mitten im Weg.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Tippbetrieb mit Software-Endlagen',
        task: [
          'Die Achse `gAxis01` hat in ihrer Konfiguration Software-Endlagen bei **0 mm** und **300 mm**. Wird ein Ziel außerhalb angefahren oder die Endlage überfahren, meldet die Achse einen Fehler. Einschalten (`diPower`) und automatisches Referenzieren sind vorgegeben.',
          '',
          'Programmiere den Tippbetrieb mit `MpAxisBasic`:',
          '- Solange `diJogPos` gedrückt ist, fährt die Achse mit 50 mm/s in Plusrichtung, solange `diJogNeg` gedrückt ist, in Minusrichtung.',
          '- Loslassen stoppt die Achse (`Stop`, bis `Stopped`).',
          '- Die Achse bleibt **genau an der Endlage** stehen und erzeugt **keinen** Endlagenfehler.',
          '- Beide Taster gleichzeitig: keine Bewegung.',
          '- Tippen nur, wenn eingeschaltet, referenziert und fehlerfrei.',
          '',
          'Die Konstanten `LIMIT_NEG`, `LIMIT_POS`, `JOG_VEL` und die Zustände `eJogState` sind vorbereitet.'
        ].join('\n'),
        hints: ['Nutze die Endlage als Ziel von MoveAbsolute – dann bremst der Profilgenerator rechtzeitig.', 'Merke dir die Richtung beim Start (bDirPos), um Loslassen bzw. Richtungswechsel zu erkennen.', '`Stopped` ist TRUE, wenn Stop anliegt und die Achse steht.'],
        cycleMs: 10,
        axis: { min: 0, max: 300 },
        io: JOG_IO,
        scene: { type: 'axis', bind: { position: 'rAxisPos', min: 0, max: 300, homed: 'doHomed', error: 'doError' } },
        files: { main: JOG_START, var: JOG_VAR, typ: JOG_TYP },
        solution: { main: JOG_SOL, var: JOG_VAR, typ: JOG_TYP },
        tests: [
          { name: 'Tippen + und Loslassen', steps: [...powerHome, { set: { diJogPos: true } }, { ms: 1000 }, { expect: 'rAxisPos > 30.0 AND rAxisPos < 60.0', msg: 'Nach 1 s Tippen + (50 mm/s) muss die Achse ca. 45–50 mm gefahren sein.' }, { set: { diJogPos: false } }, { until: 'ABS(rAxisVel) < 0.001', maxMs: 300, msg: 'Loslassen muss die Achse stoppen.' }, { never: 'ABS(rAxisVel) > 0.0', ms: 300 }] },
          { name: 'Positive Endlage wird nicht überfahren', steps: [...powerHome, { set: { diJogPos: true } }, { never: 'rAxisPos > 300.01 OR doError', ms: 8000, msg: 'Die Achse überfährt die Endlage oder meldet einen Endlagenfehler.' }, { expect: 'doAtLimitPos', msg: 'Die Achse muss genau an der Endlage 300 mm stehen.' }] },
          { name: 'Von der Endlage zurücktippen', steps: [...powerHome, { set: { diJogPos: true } }, { until: 'doAtLimitPos', maxMs: 8000 }, { set: { diJogPos: false } }, { ms: 300 }, { set: { diJogNeg: true } }, { ms: 1000 }, { expect: 'rAxisPos < 280.0 AND NOT doError' }] },
          { name: 'Negative Endlage bei 0 mm', steps: [...powerHome, { set: { diJogNeg: true } }, { never: 'rAxisPos < -0.01 OR doError', ms: 1000, msg: 'An der Endlage 0 mm darf weder weitergefahren noch ein Fehler ausgelöst werden.' }, { expect: 'doAtLimitNeg' }] },
          { name: 'Beide Taster: keine Bewegung', steps: [...powerHome, { set: { diJogPos: true, diJogNeg: true } }, { never: 'ABS(rAxisVel) > 0.0 OR doError', ms: 1000 }] },
          { name: 'Ohne Regler kein Fehler', steps: [{ set: { diJogPos: true } }, { never: 'doError', ms: 500 }] }
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'Pendelbetrieb mit Verweilzeit und Zykluszähler',
        task: [
          'Für einen Dauertest soll die Achse zwischen **A = 50 mm** und **B = 250 mm** pendeln. Einschalten und Referenzieren sind vorgegeben (`diPower`).',
          '',
          '- Mit `diRun` = TRUE fährt die Achse zuerst nach A, dann abwechselnd nach B und A.',
          '- An jedem Umkehrpunkt verweilt sie **200 ms** (TON), bevor die nächste Fahrt startet.',
          '- `nCycles` zählt vollständige Zyklen A → B → A.',
          '- Wird `diRun` FALSE, fährt die Achse die laufende Fahrt zu Ende und bleibt am Ziel stehen. Ein erneutes `diRun` setzt den Betrieb fort.',
          '- Ist die Achse nicht bereit (aus, nicht referenziert, Fehler), geht der Ablauf nach `PEND_IDLE`.',
          '',
          '**Simulation:** v = 200 mm/s, a = d = 1000 mm/s². `InPosition` kommt genau bei Erreichen des Ziels.'
        ].join('\n'),
        hints: ['Den TON rufst du einmal außerhalb der CASE-Anweisung auf, mit IN := in einem DWELL-Zustand.', 'MoveAbsolute muss zwischen zwei Fahrten mindestens einen Zyklus FALSE sein.'],
        cycleMs: 10,
        io: [
          AXREF,
          { name: 'diPower', type: 'BOOL', dir: 'in', label: 'Schalter Regler ein', widget: 'switch' },
          { name: 'diRun', type: 'BOOL', dir: 'in', label: 'Schalter Pendelbetrieb', widget: 'switch' },
          { name: 'doAtA', type: 'BOOL', dir: 'out', label: 'In Position A', widget: 'led' },
          { name: 'doAtB', type: 'BOOL', dir: 'out', label: 'In Position B', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Achsfehler', widget: 'led' },
          { name: 'nCycles', type: 'UDINT', dir: 'out', label: 'Zyklen A-B-A', widget: 'value' },
          ...ioAxisOut
        ],
        scene: { type: 'axis', bind: { position: 'rAxisPos', min: 0, max: 300, error: 'doError' } },
        files: { main: PEND_START, var: PEND_VAR, typ: PEND_TYP },
        solution: { main: PEND_SOL, var: PEND_VAR, typ: PEND_TYP },
        tests: [
          { name: 'Pendeln A → B → A', steps: [{ set: { diPower: true, diRun: true } }, { until: 'doAtA', maxMs: 2500 }, { until: 'doAtB', maxMs: 3000, msg: 'B wird nicht angefahren.' }, { until: 'doAtA AND nCycles >= 1', maxMs: 3000, msg: 'Nach der Rückkehr nach A muss nCycles mindestens 1 sein.' }] },
          { name: 'Verweilzeit am Umkehrpunkt', steps: [{ set: { diPower: true, diRun: true } }, { until: 'doAtB', maxMs: 5000 }, { ms: 150 }, { expect: 'ABS(rAxisPos - 250.0) < 0.01', msg: 'Die Achse muss an B mindestens 200 ms verweilen.' }, { until: 'rAxisVel < -10.0', maxMs: 300, msg: 'Nach der Verweilzeit muss die Fahrt nach A starten.' }] },
          { name: 'Anhalten am Ziel', steps: [{ set: { diPower: true, diRun: true } }, { until: 'doAtB', maxMs: 5000 }, { until: 'rAxisVel < -10.0', maxMs: 500 }, { set: { diRun: false } }, { until: 'doAtA', maxMs: 3000, msg: 'Die laufende Fahrt muss zu Ende gefahren werden.' }, { never: 'ABS(rAxisVel) > 0.0', ms: 1500, msg: 'Ohne diRun darf keine neue Fahrt starten.' }] },
          { name: 'Fortsetzen nach Pause', steps: [{ set: { diPower: true, diRun: true } }, { until: 'doAtA', maxMs: 2500 }, { set: { diRun: false } }, { ms: 500 }, { set: { diRun: true } }, { until: 'doAtB', maxMs: 3000 }] },
          { name: 'Ohne Regler kein Fehler', steps: [{ set: { diRun: true } }, { never: 'doError OR ABS(rAxisVel) > 0.0', ms: 1000 }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 3 · Modul 3 (Projekt)
  {
    id: 'motion-3-achsautomat',
    level: 3,
    kind: 'projekt',
    title: 'Praxisprojekt: Achs-Zustandsautomat und Inbetriebnahme',
    summary: 'Du kapselst eine Achse in einem wiederverwendbaren Funktionsbaustein mit Zustandsautomat und Fehlerbehandlung und nimmst sie mit mapp Cockpit und Autotuning in Betrieb.',
    minutes: 300,
    req: ['motion-3-referenz-endlagen'],
    briefing: 'In einer echten Maschine gibt es viele Achsen, und jede braucht dieselbe Grundlogik: einschalten, referenzieren, bereit, fahren, Fehler, quittieren. Statt diese Logik pro Achse zu kopieren, kapselst du sie in einem Funktionsbaustein mit klarer Schnittstelle (Befehle rein, Status raus) und dem PLCopen-Zustand als Grundlage. Dazu gehört die Inbetriebnahme: Drehrichtung und Skalierung prüfen, Regler mit Autotuning einstellen, Testfahrten in mapp Cockpit bzw. im Test-Fenster und Aufzeichnung mit Trace.',
    practice: 'Bei BREITNER entsteht jede Achse einer neuen Maschine aus demselben Achs-FB. Fehler werden einmal behoben und wirken überall. Die Inbetriebnahme-Reihenfolge (Verdrahtung → Geber → Autotuning → Referenzieren → Programm) spart Stunden und verhindert Schäden.',
    transfer: {
      tia: 'Im TIA Portal entspricht das einem eigenen FB, der ein Technologieobjekt als Parameter (DB_ANY bzw. TO_PositioningAxis) erhält; Inbetriebnahme über das Achssteuertafel-Fenster und die Optimierung.',
      codesys: 'In TwinCAT/CODESYS wird die Achse als AXIS_REF per VAR_IN_OUT an den FB übergeben – genau wie hier. Inbetriebnahme über das Online-Fenster der NC-Achse bzw. den Drive Manager.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf die Schnittstelle des Achs-FB',
        guide: {
          intro: 'Eine gute Schnittstelle trennt Befehle, Parameter und Status.',
          steps: [
            'Eingänge: bEnable (Pegel), bMove (Flanke), rTarget, rVelocity, bAck (Flanke).',
            'Ausgänge: eState (Enumeration), bReady, bError, rPosition.',
            'Achse als `VAR_IN_OUT Axis : AXIS_REF` – so kann derselbe FB für jede Achse verwendet werden.',
            'In AS6 liegen die Deklarationen in der .fun-Datei; die Enumeration in einer .typ-Datei des Pakets.',
            'Dokumentiere im Kopfkommentar, welche Eingänge flanken- und welche pegelgesteuert sind.'
          ],
          done: 'Erledigt, wenn ein Kollege den FB nur anhand der Schnittstelle korrekt verwenden kann.',
          tip: 'Gib den Zustand als Enumeration aus, nicht als INT. Im Watch-Fenster siehst du dann sofort `AXSM_ERROR` statt `90`.'
        }
      },
      {
        id: 'o2',
        title: 'Programmiere Zustandsautomat und Fehlerbehandlung',
        guide: {
          intro: 'Der Automat folgt dem PLCopen-Zustand der Achse; Fehler werden mit MC_ReadStatus erkannt.',
          steps: [
            'Vor der CASE-Anweisung: `NOT bEnable` → DISABLED; `fbStatus.ErrorStop` → ERROR (außer in ERROR/RESET).',
            'DISABLED → POWERON → HOMING → READY ⇄ MOVING.',
            'ERROR: alle Execute FALSE; Flanke an bAck → RESET mit MC_Reset; nach Done zurück nach POWERON.',
            'Steht der Fehler nach dem Reset noch an (z. B. Antriebsfehler), erkennt die übergreifende Abfrage das sofort wieder.',
            'Alle MC-Bausteine am Ende des FB in jedem Zyklus aufrufen.'
          ],
          done: 'Erledigt, wenn die Übung „FB_AxisSM“ alle Tests besteht.',
          tip: 'Teste Fehlerfälle zuerst. Ein Automat, der nur den Gutfall kann, ist in der Praxis wertlos.',
          link: helpLink('mcReset', 'MC_Reset')
        }
      },
      {
        id: 'o3',
        title: 'Nimm die Achse mit mapp Cockpit in Betrieb',
        guide: {
          intro: 'Bevor das Anwenderprogramm die Achse bewegt, wird sie ohne Programm geprüft.',
          steps: [
            'Prüfe Verdrahtung, STO-Freigabe und Haltebremse (siehe Community-Leitfaden „Motion Commissioning for Beginners“).',
            'Öffne mapp Cockpit für die Achse (im Online-Betrieb aus Automation Studio heraus) und schalte die Achse ein.',
            'Fahre langsam in beide Richtungen und prüfe Drehrichtung und Skalierung mit einer Markierung an der Mechanik.',
            'Referenziere und prüfe die Software-Endlagen mit einer langsamen Fahrt.',
            'Zeichne mit dem Trace Sollposition, Istposition und Schleppfehler auf.'
          ],
          done: 'Erledigt, wenn Drehrichtung, Skalierung und Endlagen dokumentiert geprüft sind.',
          tip: 'Fahre bei der ersten Bewegung mit sehr kleiner Geschwindigkeit und halte die Hand am Not-Halt.',
          link: helpLink('cockpit', 'mapp Cockpit für Achskomponenten')
        }
      },
      {
        id: 'o4',
        title: 'Stelle die Regler mit Autotuning ein',
        guide: {
          intro: 'ACOPOS-Servoverstärker arbeiten mit einer Reglerkaskade. Das Autotuning ermittelt die Reglerparameter.',
          steps: [
            'Lies in der B&R-Hilfe die empfohlene Reihenfolge: Vorbereitung → Drehzahlregler → Lageregler → Feed Forward → Test → Speichern.',
            'Starte das Autotuning des Drehzahlreglers in mapp Cockpit (Achse eingeschaltet, Mechanik frei beweglich).',
            'Tune danach den Lageregler und den Vorsteueranteil.',
            'Teste mit einer typischen Fahrt und vergleiche den Schleppfehler im Trace vor und nach dem Tuning.',
            'Übernimm die ermittelten Werte in die Achs- bzw. Antriebskonfiguration des Projekts.'
          ],
          done: 'Erledigt, wenn die Reglerparameter im Projekt gespeichert sind und der Schleppfehler bei einer Testfahrt dokumentiert ist.',
          tip: 'Bei vertikalen Achsen oder großen Lastträgheiten muss der Tuning-Modus angepasst werden – vorher die Hinweise der Hilfe lesen.',
          link: helpLink('autotuning', 'Autotuning')
        }
      },
      {
        id: 'o5',
        title: 'Lege den Achs-FB als Nachweis ab',
        guide: {
          intro: 'Dein Ausbilder bewertet Code, Tests und Inbetriebnahmeprotokoll.',
          steps: [
            'Lege den FB in einem eigenen Paket `AxisControl` an (FB, .fun, .typ).',
            'Ergänze eine README mit Zustandsdiagramm, Schnittstellenbeschreibung und Inbetriebnahmeprotokoll.',
            'Committe und pushe auf git.breitner.de, reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist.',
          tip: 'Ein Paket mit sauberer Schnittstelle lässt sich später als Bibliothek in mehreren Projekten verwenden.'
        }
      }
    ],
    videos: [
      vid('cia402', 'Die Zustandsmaschine im Antrieb (CiA 402) – sie liegt unter dem PLCopen-Zustand und erklärt, was beim Einschalten passiert.'),
      vid('plcopenEx', 'Beispiele der PLCopen zur Anwendung der Motion-Bausteine.'),
      vid('mappAxis1', 'Inbetriebnahme einer Einzelachse in AS – als Vorlage für die Inbetriebnahme-Schritte.')
    ],
    readings: [
      brHelp('autotuning', 'Autotuning', 20, 'Regelkonzept der ACOPOS-Kaskade und empfohlene Reihenfolge beim Autotuning.'),
      community(1679, 'guide-motion-comissioning-for-beginners', 'Guide: Motion Comissioning for Beginners', 'Bertsch, M.', 2023, 40, 'Inbetriebnahme-Checkliste aus der Praxis: Sichtprüfung, Parametrierung, Kommutierung, Tuning, Referenzierung.'),
      brHelp('state', 'Zustandsdiagramm', 10, 'Grundlage des Achs-Zustandsautomaten.')
    ],
    quiz: [
      { type: 'single', q: 'Warum wird die Achse als VAR_IN_OUT an den FB übergeben?', options: ['Damit der FB schneller ist', 'Damit derselbe FB für beliebige Achsen verwendet werden kann und auf das Achsobjekt selbst zugreift', 'Weil AXIS_REF kein Eingang sein darf', 'Damit die Achse kopiert wird'], correct: 1, explain: 'VAR_IN_OUT übergibt eine Referenz auf das Achsobjekt; der FB arbeitet direkt mit der übergebenen Achse.' },
      { type: 'single', q: 'In welcher Reihenfolge wird die Reglerkaskade beim Autotuning eingestellt?', options: ['Lageregler, dann Drehzahlregler', 'Drehzahlregler, dann Lageregler, dann Vorsteuerung', 'Nur Vorsteuerung', 'Alle gleichzeitig'], correct: 1, explain: 'Von innen nach außen: Der Lageregler kann nur so gut sein wie der unterlagerte Drehzahlregler.' },
      { type: 'multi', q: 'Was prüfst du bei der ersten Inbetriebnahme einer Achse vor dem Anwenderprogramm?', options: ['Drehrichtung', 'Skalierung (gefahrener Weg = Sollweg)', 'Haltebremse und STO-Freigabe', 'Farbe der Visualisierung'], correct: [0, 1, 2], explain: 'Drehrichtung, Skalierung, Bremse und Sicherheitsfreigabe sind Grundvoraussetzungen für sicheres Verfahren.' }
    ],
    exam: [
      { type: 'single', q: 'Ein Antriebsfehler steht nach MC_Reset noch an. Wie soll der Achs-FB reagieren?', options: ['In READY gehen', 'Sofort wieder in ERROR gehen und auf eine neue Quittierung warten', 'Den Reset dauerhaft wiederholen', 'Die Achse ausschalten und das Programm beenden'], correct: 1, explain: 'Die übergreifende Fehlerabfrage erkennt den anstehenden Fehler sofort; erst nach Beseitigung der Ursache hilft eine neue Quittierung.' },
      { type: 'single', q: 'Welcher Baustein liefert den PLCopen-Zustand der Achse (z. B. ErrorStop)?', options: ['MC_Power', 'MC_ReadStatus', 'MC_ReadActualPosition', 'MC_Halt'], correct: 1, explain: 'MC_ReadStatus gibt den aktuellen Achszustand aus.' },
      { type: 'multi', q: 'Welche Eigenschaften hat ein gut wiederverwendbarer Achs-FB?', options: ['Achse als Parameter (VAR_IN_OUT)', 'Zustand als Enumeration nach außen', 'Globale Variablen der Anlage im FB', 'Fehlerbehandlung in jedem Zustand'], correct: [0, 1, 3], explain: 'Globale Anlagenvariablen im FB verhindern die Wiederverwendung.' },
      { type: 'single', q: 'Was ist bei einer Achse mit Fremdmotor und Absolutgeber vor dem ersten Einschalten zusätzlich nötig?', options: ['Nichts', 'Einmalige Ermittlung des Kommutierungsoffsets (Einphasen)', 'Ein Firmware-Downgrade', 'Ein Neustart der CPU nach jeder Fahrt'], correct: 1, explain: 'Bei Fremdmotoren ist die Lage von Geber zu Rotorfeld unbekannt; sie wird einmalig eingephast (bei B&R-Motoren mit EnDat ab Werk hinterlegt).' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'FB_AxisSM: Achs-Zustandsautomat mit MC-Bausteinen',
        task: [
          'Vervollständige den Funktionsbaustein `FB_AxisSM` (in AS6: Deklaration in der .fun-Datei). Er steuert eine Achse, die per `VAR_IN_OUT Axis : AXIS_REF` übergeben wird. Das Programm ruft ihn mit `gAxis01` auf.',
          '',
          'Zustände (`eAxSmState`):',
          '- `AXSM_DISABLED` (0): alle Befehle aus; bei `bEnable` → `AXSM_POWERON`.',
          '- `AXSM_POWERON` (10): Regler ein (MC_Power folgt bEnable); bei `Status` → `AXSM_HOMING`.',
          '- `AXSM_HOMING` (20): MC_Home auf 0; bei Done → `AXSM_READY`.',
          '- `AXSM_READY` (30): steigende Flanke `bMove` → MC_MoveAbsolute auf `rTarget` mit `rVelocity` → `AXSM_MOVING` (40); nach Done zurück.',
          '- `AXSM_ERROR` (90): erreicht aus jedem Zustand, wenn die Achse in **ErrorStop** ist (`MC_ReadStatus`). Alle Befehle aus. Steigende Flanke `bAck` → `AXSM_RESET` (95): MC_Reset, danach → `AXSM_POWERON`.',
          '- `bEnable` = FALSE führt aus jedem Zustand nach `AXSM_DISABLED`.',
          '',
          '**Simulation:** Der Eingang `diDriveFault` löst einen Antriebsfehler aus (ErrorStop), solange er TRUE ist – ein Reset hilft erst, wenn er wieder FALSE ist. Eine Geschwindigkeit ≤ 0 führt beim Start der Fahrt ebenfalls zu ErrorStop.'
        ].join('\n'),
        hints: ['Die übergreifenden Übergänge (NOT bEnable, ErrorStop) gehören vor die CASE-Anweisung.', 'Nimm in ERROR alle Execute-Eingänge zurück, sonst startet nach dem Reset nichts mehr.', 'Nach MC_Reset kann der Fehler sofort wiederkommen – das erledigt die übergreifende Abfrage.'],
        cycleMs: 10,
        axis: { faultVar: 'diDriveFault' },
        io: [
          AXREF,
          { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Freigabe Achse', widget: 'switch' },
          { name: 'diMove', type: 'BOOL', dir: 'in', label: 'Taster Fahren', widget: 'button' },
          { name: 'rTarget', type: 'REAL', dir: 'in', label: 'Zielposition', widget: 'slider', min: 0, max: 500, unit: 'mm' },
          { name: 'rVelSet', type: 'REAL', dir: 'in', label: 'Geschwindigkeit', widget: 'slider', min: 0, max: 400, unit: 'mm/s', init: 150 },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Taster Quittieren', widget: 'button' },
          { name: 'diDriveFault', type: 'BOOL', dir: 'in', label: 'Simulation: Antriebsfehler', widget: 'switch' },
          { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Bereit', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Fehler', widget: 'led' },
          { name: 'nState', type: 'INT', dir: 'out', label: 'Zustand', widget: 'value' },
          ioAxisOut[0]
        ],
        scene: { type: 'axis', bind: { position: 'rAxisPos', min: 0, max: 500, powered: 'doReady', homed: 'doReady', error: 'doError' } },
        files: { main: SM_FB_START + SM_PRG, var: SM_VAR, typ: SM_TYP },
        solution: { main: SM_FB_SOL + SM_PRG, var: SM_VAR, typ: SM_TYP },
        tests: [
          { name: 'Freigabe → bereit', steps: [{ set: { diEnable: true } }, { until: 'doReady', maxMs: 1500, msg: 'Der FB wird nicht bereit (POWERON → HOMING → READY).' }, { expect: 'nState = 30' }] },
          { name: 'Fahrt auf 200 mm', steps: [{ set: { diEnable: true } }, { until: 'doReady', maxMs: 1500 }, { set: { rTarget: 200.0 } }, ...pulse('diMove'), { until: 'nState = 40', maxMs: 100 }, { until: 'doReady AND ABS(rAxisPos - 200.0) < 0.01', maxMs: 3000 }] },
          { name: 'Antriebsfehler und Quittierung', steps: [{ set: { diEnable: true } }, { until: 'doReady', maxMs: 1500 }, { set: { diDriveFault: true } }, { until: 'doError', maxMs: 100, msg: 'Ein Antriebsfehler (ErrorStop) muss sofort nach AXSM_ERROR führen.' }, ...pulse('diAck'), { ms: 300 }, { expect: 'doError', msg: 'Solange der Fehler ansteht, muss der FB im Fehlerzustand bleiben.' }, { set: { diDriveFault: false } }, ...pulse('diAck'), { until: 'doReady', maxMs: 1500, msg: 'Nach Beseitigung und Quittierung muss die Achse wieder bereit werden.' }] },
          { name: 'Ungültige Geschwindigkeit', steps: [{ set: { diEnable: true } }, { until: 'doReady', maxMs: 1500 }, { set: { rVelSet: 0.0, rTarget: 100.0 } }, ...pulse('diMove'), { until: 'doError', maxMs: 200 }, { set: { rVelSet: 150.0 } }, ...pulse('diAck'), { until: 'doReady', maxMs: 1500 }, ...pulse('diMove'), { until: 'doReady AND ABS(rAxisPos - 100.0) < 0.01', maxMs: 3000, msg: 'Nach der Quittierung muss eine neue Fahrt funktionieren.' }] },
          { name: 'Freigabe weg während der Fahrt', steps: [{ set: { diEnable: true } }, { until: 'doReady', maxMs: 1500 }, { set: { rTarget: 400.0 } }, ...pulse('diMove'), { ms: 500 }, { set: { diEnable: false } }, { until: 'nState = 0 AND NOT gAxis01.PowerOn', maxMs: 100 }] },
          { name: 'Fahrbefehl ohne Freigabe', steps: [...pulse('diMove'), { never: 'doError', ms: 1000 }, { expect: 'nState = 0' }] }
        ]
      }
    ],
    proof: true,
    badge: 'Achs-Zustandsautomat'
  }
];
