'use strict';
const { L, brHelp, helpLink, fhnw, community, R, vid } = require('./common');

// ─────────────────────────────────────────────── M13 · Achs-Framework für eine Achsgruppe
const ARCH_TYP = L(
  'TYPE',
  '\tAxisCmdType : STRUCT',
  '\t\tPower : BOOL;      (* Pegel *)',
  '\t\tHome : BOOL;       (* Pegel: referenzieren, falls nicht referenziert *)',
  '\t\tMoveAbs : BOOL;    (* Pegel: steigende Flanke startet Fahrt *)',
  '\t\tStop : BOOL;       (* Pegel *)',
  '\t\tReset : BOOL;      (* Pegel: steigende Flanke quittiert *)',
  '\tEND_STRUCT;',
  '\tAxisMoveParType : STRUCT',
  '\t\tPosition : REAL;',
  '\t\tVelocity : REAL;',
  '\tEND_STRUCT;',
  '\tAxisStatusType : STRUCT',
  '\t\tReady : BOOL;      (* eingeschaltet, referenziert, fehlerfrei, keine Bewegung *)',
  '\t\tBusy : BOOL;',
  '\t\tInPos : BOOL;',
  '\t\tError : BOOL;',
  '\t\tPosition : REAL;',
  '\t\tVelocity : REAL;',
  '\tEND_STRUCT;',
  '\teGroupState : (GRP_OFF := 0, GRP_STARTUP := 10, GRP_READY := 20, GRP_MOVE := 30, GRP_ERROR := 90);',
  'END_TYPE'
);
const ARCH_VAR = L(
  'VAR',
  '\tfbAxX : FB_Axis;',
  '\tfbAxY : FB_Axis;',
  '\tCmdX : AxisCmdType;',
  '\tCmdY : AxisCmdType;',
  '\tParX : AxisMoveParType;',
  '\tParY : AxisMoveParType;',
  '\teGrp : eGroupState;',
  '\trtGo : R_TRIG;',
  '\trtAck : R_TRIG;',
  '\tbAnyError : BOOL;',
  'END_VAR'
);
const ARCH_FB_HEAD = L(
  '(* Wiederverwendbarer Achsbaustein – in AS6: eigenes Paket/Bibliothek mit .fun und .typ *)',
  'FUNCTION_BLOCK FB_Axis',
  'VAR_INPUT',
  '\tCmd : AxisCmdType;',
  '\tPar : AxisMoveParType;',
  'END_VAR',
  'VAR_OUTPUT',
  '\tStatus : AxisStatusType;',
  'END_VAR',
  'VAR_IN_OUT',
  '\tAxis : AXIS_REF;',
  'END_VAR',
  'VAR',
  '\tMpAx : MpAxisBasic;',
  '\tMpPar : MpAxisBasicParType;',
  'END_VAR'
);
const ARCH_FB_START = ARCH_FB_HEAD + L(
  '\t(* TODO: MpAxisBasic mit Axis verbinden, Cmd/Par abbilden, Status füllen *)',
  '\t;',
  'END_FUNCTION_BLOCK',
  ''
);
const ARCH_FB_SOL = ARCH_FB_HEAD + L(
  '\tMpPar.Position := Par.Position;',
  '\tMpPar.Velocity := Par.Velocity;',
  '\tMpPar.Acceleration := 1000.0;',
  '\tMpPar.Deceleration := 1000.0;',
  '',
  '\tMpAx.MpLink := ADR(Axis);',
  '\tMpAx.Enable := TRUE;',
  '\tMpAx.Parameters := ADR(MpPar);',
  '\tMpAx.Power := Cmd.Power;',
  '\tMpAx.Home := Cmd.Home AND MpAx.PowerOn AND NOT MpAx.IsHomed;',
  '\tMpAx.MoveAbsolute := Cmd.MoveAbs;',
  '\tMpAx.Stop := Cmd.Stop;',
  '\tMpAx.ErrorReset := Cmd.Reset;',
  '\tMpAx();',
  '',
  '\tStatus.Error := MpAx.Error;',
  '\tStatus.Busy := MpAx.MoveActive;',
  '\tStatus.InPos := MpAx.InPosition;',
  '\tStatus.Ready := MpAx.PowerOn AND MpAx.IsHomed AND NOT MpAx.Error AND NOT MpAx.MoveActive;',
  '\tStatus.Position := LREAL_TO_REAL(MpAx.Position);',
  '\tStatus.Velocity := MpAx.Velocity;',
  'END_FUNCTION_BLOCK',
  ''
);
const ARCH_PRG_TAIL = L(
  '',
  '\tfbAxX(Cmd := CmdX, Par := ParX, Axis := gAxisX);',
  '\tfbAxY(Cmd := CmdY, Par := ParY, Axis := gAxisY);',
  '',
  '\tdoGroupReady := (eGrp = GRP_READY);',
  '\tdoGroupError := (eGrp = GRP_ERROR);',
  '\trPosX := fbAxX.Status.Position;',
  '\trPosY := fbAxY.Status.Position;',
  '\trVelX := fbAxX.Status.Velocity;',
  'END_PROGRAM'
);
const ARCH_PRG_START = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\trtGo(CLK := diGo);',
  '\trtAck(CLK := diAck);',
  '',
  '\t(* TODO: Gruppen-Zustandsautomat GRP_OFF -> GRP_STARTUP -> GRP_READY <-> GRP_MOVE, GRP_ERROR *)',
  '\tCASE eGrp OF',
  '\t\tGRP_OFF:',
  '\t\t\t;',
  '\tEND_CASE'
) + ARCH_PRG_TAIL;
const ARCH_PRG_SOL = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\trtGo(CLK := diGo);',
  '\trtAck(CLK := diAck);',
  '\tbAnyError := fbAxX.Status.Error OR fbAxY.Status.Error;',
  '',
  '\tIF NOT diGroupOn THEN',
  '\t\teGrp := GRP_OFF;',
  '\tELSIF bAnyError AND eGrp <> GRP_ERROR THEN',
  '\t\teGrp := GRP_ERROR;',
  '\tEND_IF',
  '',
  '\tCASE eGrp OF',
  '\t\tGRP_OFF:',
  '\t\t\tCmdX.Power := FALSE; CmdX.Home := FALSE; CmdX.MoveAbs := FALSE; CmdX.Stop := FALSE; CmdX.Reset := FALSE;',
  '\t\t\tCmdY := CmdX;',
  '\t\t\tIF diGroupOn THEN',
  '\t\t\t\teGrp := GRP_STARTUP;',
  '\t\t\tEND_IF',
  '',
  '\t\tGRP_STARTUP:',
  '\t\t\tCmdX.Power := TRUE; CmdX.Home := TRUE; CmdX.Stop := FALSE;',
  '\t\t\tCmdY.Power := TRUE; CmdY.Home := TRUE; CmdY.Stop := FALSE;',
  '\t\t\tIF fbAxX.Status.Ready AND fbAxY.Status.Ready THEN',
  '\t\t\t\tCmdX.Home := FALSE;',
  '\t\t\t\tCmdY.Home := FALSE;',
  '\t\t\t\teGrp := GRP_READY;',
  '\t\t\tEND_IF',
  '',
  '\t\tGRP_READY:',
  '\t\t\tIF rtGo.Q THEN',
  '\t\t\t\tParX.Position := rTargetX; ParX.Velocity := 100.0;',
  '\t\t\t\tParY.Position := rTargetY; ParY.Velocity := rVelY;',
  '\t\t\t\tCmdX.MoveAbs := TRUE;',
  '\t\t\t\tCmdY.MoveAbs := TRUE;',
  '\t\t\t\teGrp := GRP_MOVE;',
  '\t\t\tEND_IF',
  '',
  '\t\tGRP_MOVE:',
  '\t\t\tIF fbAxX.Status.InPos AND fbAxY.Status.InPos THEN',
  '\t\t\t\tCmdX.MoveAbs := FALSE;',
  '\t\t\t\tCmdY.MoveAbs := FALSE;',
  '\t\t\t\teGrp := GRP_READY;',
  '\t\t\tEND_IF',
  '',
  '\t\tGRP_ERROR:',
  '\t\t\t(* Gruppenreaktion: alle Achsen geführt stillsetzen, keine neuen Fahrten *)',
  '\t\t\tCmdX.MoveAbs := FALSE; CmdX.Stop := TRUE;',
  '\t\t\tCmdY.MoveAbs := FALSE; CmdY.Stop := TRUE;',
  '\t\t\tIF rtAck.Q THEN',
  '\t\t\t\tCmdX.Reset := TRUE;',
  '\t\t\t\tCmdY.Reset := TRUE;',
  '\t\t\tEND_IF',
  '\t\t\tIF NOT bAnyError THEN',
  '\t\t\t\tCmdX.Reset := FALSE;',
  '\t\t\t\tCmdY.Reset := FALSE;',
  '\t\t\t\teGrp := GRP_STARTUP;',
  '\t\t\tEND_IF',
  '\tEND_CASE'
) + ARCH_PRG_TAIL;
const ARCH_IO = [
  { name: 'gAxisX', type: 'AXIS_REF', dir: 'in', label: 'Achsreferenz X' },
  { name: 'gAxisY', type: 'AXIS_REF', dir: 'in', label: 'Achsreferenz Y' },
  { name: 'diGroupOn', type: 'BOOL', dir: 'in', label: 'Achsgruppe ein', widget: 'switch' },
  { name: 'diGo', type: 'BOOL', dir: 'in', label: 'Taster Fahren', widget: 'button' },
  { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Taster Quittieren', widget: 'button' },
  { name: 'rTargetX', type: 'REAL', dir: 'in', label: 'Ziel X', widget: 'slider', min: 0, max: 500, unit: 'mm' },
  { name: 'rTargetY', type: 'REAL', dir: 'in', label: 'Ziel Y', widget: 'slider', min: 0, max: 500, unit: 'mm' },
  { name: 'rVelY', type: 'REAL', dir: 'in', label: 'Geschwindigkeit Y (Rezept)', widget: 'slider', min: 0, max: 300, unit: 'mm/s', init: 150 },
  { name: 'doGroupReady', type: 'BOOL', dir: 'out', label: 'Gruppe bereit', widget: 'led' },
  { name: 'doGroupError', type: 'BOOL', dir: 'out', label: 'Gruppenfehler', widget: 'led' },
  { name: 'rPosX', type: 'REAL', dir: 'out', label: 'Position X', widget: 'gauge', min: 0, max: 500, unit: 'mm' },
  { name: 'rPosY', type: 'REAL', dir: 'out', label: 'Position Y', widget: 'gauge', min: 0, max: 500, unit: 'mm' },
  { name: 'rVelX', type: 'REAL', dir: 'out', label: 'Geschwindigkeit X', widget: 'value', unit: 'mm/s' }
];
const pulse = (v) => [{ set: { [v]: true } }, { cycles: 2 }, { set: { [v]: false } }];

// ─────────────────────────────────────────────── M14 · Safe-Motion-Schnittstelle (SLS / SS1)
const SAFE_TYP = L(
  'TYPE',
  '\teRunState : (ST_OFF := 0, ST_START := 10, ST_RUN := 20, ST_NEXT := 30, ST_SS1 := 80, ST_SAFE := 90);',
  'END_TYPE'
);
const SAFE_VAR = L(
  'VAR CONSTANT',
  '\tPOS_A : LREAL := 50.0;',
  '\tPOS_B : LREAL := 400.0;',
  '\tV_RUN : REAL := 300.0;   (* Produktionsgeschwindigkeit [mm/s] *)',
  '\tV_SLS : REAL := 50.0;    (* funktionale Grenze unter der sicheren SLS-Grenze von 60 mm/s *)',
  'END_VAR',
  'VAR',
  '\tMpAxisBasic_0 : MpAxisBasic;',
  '\tAxisPar : MpAxisBasicParType;',
  '\teSt : eRunState;',
  '\trTarget : LREAL;',
  '\trVelCmd : REAL;',
  '\trtAck : R_TRIG;',
  'END_VAR'
);
const SAFE_INIT = L(
  'PROGRAM _INIT',
  '\tAxisPar.Acceleration := 1000.0;',
  '\tAxisPar.Deceleration := 1000.0;',
  '\trTarget := POS_B;',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\trtAck(CLK := diAck);',
  ''
);
const SAFE_TAIL = L(
  '',
  '\tMpAxisBasic_0.MpLink := ADR(gAxis01);',
  '\tMpAxisBasic_0.Enable := TRUE;',
  '\tMpAxisBasic_0.Parameters := ADR(AxisPar);',
  '\tMpAxisBasic_0();',
  '',
  '\tdoPowerOn := MpAxisBasic_0.PowerOn;',
  '\tdoSafeStopDone := (eSt = ST_SAFE) AND NOT MpAxisBasic_0.PowerOn;',
  '\trAxisPos := LREAL_TO_REAL(MpAxisBasic_0.Position);',
  '\trAxisVel := MpAxisBasic_0.Velocity;',
  'END_PROGRAM'
);
const SAFE_CORE = (withSafety) => [
  ...(withSafety ? [
    '\t(* SLS: Geschwindigkeit funktional unter die sichere Grenze legen *)',
    '\trVelCmd := SEL(diSLS, V_RUN, V_SLS);'
  ] : ['\trVelCmd := V_RUN;']),
  '',
  '\tIF NOT diOn THEN',
  '\t\teSt := ST_OFF;',
  ...(withSafety ? [
    '\tELSIF diSS1 AND eSt <> ST_SS1 AND eSt <> ST_SAFE THEN',
    '\t\teSt := ST_SS1;    (* SS1-Anforderung aus jedem Zustand *)'
  ] : []),
  '\tEND_IF',
  '',
  '\tCASE eSt OF',
  '\t\tST_OFF:',
  '\t\t\tMpAxisBasic_0.Power := FALSE;',
  '\t\t\tMpAxisBasic_0.Home := FALSE;',
  '\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\tMpAxisBasic_0.Stop := FALSE;',
  '\t\t\tIF diOn THEN',
  '\t\t\t\teSt := ST_START;',
  '\t\t\tEND_IF',
  '',
  '\t\tST_START:',
  '\t\t\tMpAxisBasic_0.Power := TRUE;',
  '\t\t\tMpAxisBasic_0.Stop := FALSE;',
  '\t\t\tMpAxisBasic_0.Home := MpAxisBasic_0.PowerOn AND NOT MpAxisBasic_0.IsHomed;',
  '\t\t\tIF MpAxisBasic_0.PowerOn AND MpAxisBasic_0.IsHomed THEN',
  '\t\t\t\tMpAxisBasic_0.Home := FALSE;',
  '\t\t\t\teSt := ST_NEXT;',
  '\t\t\tEND_IF',
  '',
  '\t\tST_NEXT:',
  '\t\t\tAxisPar.Position := rTarget;',
  '\t\t\tAxisPar.Velocity := rVelCmd;',
  '\t\t\tMpAxisBasic_0.MoveAbsolute := TRUE;',
  '\t\t\teSt := ST_RUN;',
  '',
  '\t\tST_RUN:',
  '\t\t\tIF MpAxisBasic_0.InPosition THEN',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\t\tIF rTarget = POS_B THEN',
  '\t\t\t\t\trTarget := POS_A;',
  '\t\t\t\tELSE',
  '\t\t\t\t\trTarget := POS_B;',
  '\t\t\t\tEND_IF',
  '\t\t\t\teSt := ST_NEXT;',
  ...(withSafety ? [
    '\t\t\tELSIF rVelCmd <> AxisPar.Velocity THEN',
    '\t\t\t\t(* neue Geschwindigkeit: Fahrbefehl mit neuer Flanke erneut absetzen *)',
    '\t\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
    '\t\t\t\teSt := ST_NEXT;'
  ] : []),
  '\t\t\tEND_IF',
  ...(withSafety ? [
    '',
    '\t\tST_SS1:',
    '\t\t\t(* SS1: geführt stillsetzen, dann Regler aus (STO übernimmt die Sicherheitstechnik) *)',
    '\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
    '\t\t\tMpAxisBasic_0.Stop := TRUE;',
    '\t\t\tIF MpAxisBasic_0.Stopped THEN',
    '\t\t\t\tMpAxisBasic_0.Power := FALSE;',
    '\t\t\t\teSt := ST_SAFE;',
    '\t\t\tEND_IF',
    '',
    '\t\tST_SAFE:',
    '\t\t\tMpAxisBasic_0.Power := FALSE;',
    '\t\t\t(* kein automatischer Wiederanlauf: erst Anforderung weg UND Quittierung *)',
    '\t\t\tIF NOT diSS1 AND rtAck.Q THEN',
    '\t\t\t\teSt := ST_START;',
    '\t\t\tEND_IF'
  ] : []),
  '\tEND_CASE'
];
const SAFE_START = SAFE_INIT + L(...SAFE_CORE(false)) + SAFE_TAIL;
const SAFE_SOL = SAFE_INIT + L(...SAFE_CORE(true)) + SAFE_TAIL;
const SAFE_IO = [
  { name: 'gAxis01', type: 'AXIS_REF', dir: 'in', label: 'Achsreferenz gAxis01' },
  { name: 'diOn', type: 'BOOL', dir: 'in', label: 'Betrieb ein', widget: 'switch' },
  { name: 'diSLS', type: 'BOOL', dir: 'in', label: 'Safety: SLS angefordert (Schutztür im Einrichtbetrieb offen)', widget: 'switch' },
  { name: 'diSS1', type: 'BOOL', dir: 'in', label: 'Safety: SS1 angefordert (Not-Halt / Tür offen)', widget: 'switch' },
  { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Taster Quittieren/Wiederanlauf', widget: 'button' },
  { name: 'doPowerOn', type: 'BOOL', dir: 'out', label: 'Regler ein', widget: 'led' },
  { name: 'doSafeStopDone', type: 'BOOL', dir: 'out', label: 'Stillgesetzt, Regler aus', widget: 'led' },
  { name: 'rAxisPos', type: 'REAL', dir: 'out', label: 'Istposition', widget: 'gauge', min: 0, max: 500, unit: 'mm' },
  { name: 'rAxisVel', type: 'REAL', dir: 'out', label: 'Istgeschwindigkeit', widget: 'value', unit: 'mm/s' }
];
const running = [{ set: { diOn: true } }, { until: 'ABS(rAxisVel) > 290.0', maxMs: 3000 }];

module.exports = [
  // ───────────────────────────────────────────── Level 6 · Modul 1
  {
    id: 'motion-6-architektur',
    level: 6,
    kind: 'lektion',
    title: 'Mehrachs-Architektur, Synchronisation und Motion-Frameworks',
    summary: 'Du entwirfst eine skalierbare Software-Architektur für Maschinen mit vielen Achsen: Achs-Bausteine mit klaren Schnittstellen, Gruppenlogik, Fehlerausbreitung und Synchronisation – und bewertest mapp-Frameworks.',
    minutes: 300,
    req: ['motion-5-dimensionierung'],
    briefing: 'Maschinen mit 20, 50 oder 200 Achsen lassen sich nicht mehr Achse für Achse programmieren. Sie brauchen eine Architektur: einen wiederverwendbaren Achsbaustein mit stabiler Schnittstelle (Kommando-, Parameter- und Statusstruktur), eine Gruppenebene, die Achsen zu Funktionseinheiten zusammenfasst (gemeinsames Einschalten, Referenzierreihenfolge, Fehlerausbreitung), und eine Maschinenebene mit Betriebsarten. Synchronisation erfolgt über eine gemeinsame Zeitbasis (POWERLINK-Zyklus, Taskklasse) und eine virtuelle Masterachse. B&R stellt mit mapp Technology (u. a. mapp Axis Framework, mapp Sequence, MpAxisCoupling) wiederverwendbare Bausteine bereit; die Architekturfrage ist, wo man Frameworks nutzt und wo eigene Schichten nötig sind.',
    practice: 'Bei BREITNER wird eine neue Maschinenvariante aus bestehenden Funktionseinheiten zusammengesetzt. Ob das in Tagen oder Monaten geht, entscheidet die Achs- und Gruppenarchitektur – und wie konsequent Fehler und Betriebsarten durch alle Ebenen gereicht werden.',
    transfer: {
      tia: 'Siemens setzt mit der LAxis-Bibliothek bzw. „SIMATIC Motion Control Application Example“-Strukturen auf ähnliche Schichten (Achs-FB mit UDT-Schnittstelle, Betriebsarten nach PackML/OMAC).',
      codesys: 'Beckhoff bietet mit TwinCAT-Templates (z. B. Tc3_Mc3Definitions, PackML-Template) und objektorientierten Achsklassen vergleichbare Frameworks; CODESYS mit SoftMotion-Objekten.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf eine Schichtenarchitektur für Achsen',
        guide: {
          intro: 'Jede Schicht kennt nur die direkt darunterliegende.',
          steps: [
            'Schicht 1 – Achse: kapselt MpAxisBasic/MC-Bausteine, Schnittstelle Cmd/Par/Status-Strukturen.',
            'Schicht 2 – Gruppe/Funktionseinheit: koordiniert mehrere Achsen (Einschaltreihenfolge, gemeinsame Fehlerreaktion, Kopplungen).',
            'Schicht 3 – Maschine: Betriebsarten (z. B. nach PackML), Rezepte, HMI.',
            'Lege fest, welche Daten nach oben (Status, Alarme) und nach unten (Befehle, Parameter) fließen.',
            'Zeichne die Architektur für eine Maschine mit 3 Funktionseinheiten à 4 Achsen.'
          ],
          done: 'Erledigt, wenn dein Architekturbild die Schichten, Schnittstellen und den Weg eines Achsfehlers bis zur HMI zeigt.',
          tip: 'Strukturen als Schnittstelle (statt vieler Einzeleingänge) machen Erweiterungen kompatibel: Ein neues Feld bricht keine bestehenden Aufrufe.'
        }
      },
      {
        id: 'o2',
        title: 'Plane Fehlerausbreitung und Gruppenreaktionen',
        guide: {
          intro: 'Ein Fehler an einer Achse betrifft fast immer die ganze Funktionseinheit.',
          steps: [
            'Lege je Gruppe fest: Welche Achsfehler stoppen nur die Achse, welche die Gruppe, welche die Maschine?',
            'Gekoppelte Achsen (Getriebe, Kurvenscheibe) müssen gemeinsam stillgesetzt werden, sonst wird Material oder Mechanik beschädigt.',
            'Quittierung zentral auf Gruppenebene, Reset an alle Achsen weiterreichen.',
            'Alarme mit eindeutiger Herkunft (Gruppe/Achse) an mapp AlarmX melden.'
          ],
          done: 'Erledigt, wenn du für deine Beispielmaschine eine Fehlerreaktionsmatrix (Fehler × Reaktion) erstellt hast.',
          tip: 'Definiere die Gruppenreaktion als eigene Funktion. Dann ist sie testbar – auch in der Simulation.'
        }
      },
      {
        id: 'o3',
        title: 'Synchronisiere Achsen über eine gemeinsame Zeit- und Masterbasis',
        guide: {
          intro: 'Synchronität entsteht durch gemeinsame Takte und gemeinsame Führungsgrößen.',
          steps: [
            'Alle Motion-Abläufe einer Gruppe laufen in derselben Taskklasse, abgestimmt auf den POWERLINK-Zyklus.',
            'Eine virtuelle Masterachse liefert die Führungsgröße; Slaves koppeln mit Getriebe oder Kurvenscheibe.',
            'Totzeiten zwischen Antrieben kompensieren (siehe Community-Leitfaden, Abschnitt Dead-Time-Kompensation).',
            'Bei Achsgruppen mit Bahn (Robotik) übernimmt der Interpolator die Synchronisation.'
          ],
          done: 'Erledigt, wenn du begründen kannst, warum zwei Achsen in verschiedenen Taskklassen nicht sauber synchron laufen.',
          tip: 'Prüfe Synchronität im Trace immer an den Istwerten, nicht an den Sollwerten.',
          link: helpLink('gsCpuTiming', 'CPU Timing einstellen')
        }
      },
      {
        id: 'o4',
        title: 'Bewerte mapp-Frameworks gegenüber eigenen Schichten',
        guide: {
          intro: 'mapp Technology liefert fertige, konfigurierbare Komponenten.',
          steps: [
            'Sieh dir die B&R-Videos „mapp Framework Overview“ und „mapp Axis Framework Tutorial“ an.',
            'Notiere, was das Framework mitbringt (Achsfunktionen, Alarme, Rezept, HMI-Anbindung) und was du selbst ergänzen müsstest.',
            'Bewerte Kriterien: Wartbarkeit, Update-Fähigkeit (mapp-Versionen), Know-how im Team, Kundenspezifika.',
            'Formuliere eine Empfehlung für BREITNER: Framework als Basis, eigene Gruppenschicht darüber.'
          ],
          done: 'Erledigt, wenn du eine halbe Seite Architekturentscheidung (ADR) mit Begründung geschrieben hast.',
          tip: 'Dokumentiere Architekturentscheidungen im Repository (z. B. docs/adr/0001-achsframework.md) – auch Jahre später weiß man dann, warum.'
        }
      },
      {
        id: 'o5',
        title: 'Implementiere Achs-FB und Gruppenlogik',
        guide: {
          intro: 'In der Übung baust du die unteren zwei Schichten für eine Zwei-Achs-Gruppe.',
          steps: [
            'FB_Axis: MpAxisBasic intern, Schnittstelle AxisCmdType/AxisMoveParType/AxisStatusType, Achse per VAR_IN_OUT.',
            'Gruppenautomat: OFF → STARTUP → READY ⇄ MOVE, ERROR mit Stillsetzen aller Achsen.',
            'Quittierung an alle Achsen weiterreichen, danach erneut STARTUP.'
          ],
          done: 'Erledigt, wenn die Übung „Achs-Framework für eine Achsgruppe“ alle Tests besteht.',
          tip: 'Teste den Fehler einer Achse, während die andere fährt – genau das passiert im Feld.'
        }
      }
    ],
    videos: [
      vid('mappFw', 'B&R-Überblick über die mapp-Frameworks und wie sie zusammenspielen.'),
      vid('mappAxisFw', 'Wie das mapp Axis Framework Achsfunktionen strukturiert bereitstellt.'),
      vid('mappConcept', 'Grundidee von mapp Technology: konfigurieren statt programmieren.')
    ],
    readings: [
      brHelp('mappMotion', 'mapp Motion', 15, 'Einstieg in Struktur und Komponenten von mapp Motion.'),
      community(1679, 'guide-motion-comissioning-for-beginners', 'Guide: Motion Comissioning for Beginners', 'Bertsch, M.', 2023, 20, 'Abschnitt zu Totzeiten bei Achskopplungen und deren Kompensation – Grundlage für synchronisierte Mehrachssysteme.'),
      R.plcopenMotion
    ],
    quiz: [
      { type: 'single', q: 'Warum ist eine Struktur als FB-Schnittstelle (Cmd/Status) bei vielen Achsen vorteilhaft?', options: ['Sie ist schneller', 'Neue Felder können ergänzt werden, ohne bestehende Aufrufe zu brechen; Daten lassen sich als Ganzes an HMI/Gruppe weitergeben', 'Sie spart Lizenzen', 'Sie ist in AS6 Pflicht'], correct: 1, explain: 'Strukturen bündeln die Schnittstelle und machen sie erweiterbar.' },
      { type: 'single', q: 'Eine Achse einer Kurvenscheibenkopplung meldet einen Fehler. Was ist die richtige Reaktion?', options: ['Nur diese Achse stoppen', 'Die gekoppelte Gruppe gemeinsam geführt stillsetzen', 'Fehler ignorieren', 'Die Master-Achse beschleunigen'], correct: 1, explain: 'Gekoppelte Achsen müssen gemeinsam stoppen, sonst kollidieren Mechanik oder Material.' },
      { type: 'multi', q: 'Was gehört zur Synchronisation mehrerer Achsen?', options: ['Gemeinsame Taskklasse/Zeitbasis', 'Gemeinsame Führungsgröße (z. B. virtuelle Masterachse)', 'Totzeitkompensation', 'Unterschiedliche Zykluszeiten je Achse'], correct: [0, 1, 2], explain: 'Unterschiedliche Zykluszeiten verhindern Synchronität.' }
    ],
    exam: [
      { type: 'single', q: 'Welche Schicht sollte Betriebsarten (Automatik, Einrichten, Störung) verwalten?', options: ['Der Achs-FB', 'Die Maschinenschicht über den Gruppen', 'Der Antrieb', 'Die Visualisierung'], correct: 1, explain: 'Betriebsarten sind maschinenweit; Achs-FBs setzen nur Befehle um.' },
      { type: 'single', q: 'Warum gehört die Gruppen-Fehlerreaktion vor die CASE-Anweisung des Gruppenautomaten?', options: ['Aus Performancegründen', 'Damit sie in jedem Zustand wirkt und nicht vergessen werden kann', 'Weil CASE keine Fehler kennt', 'Das ist egal'], correct: 1, explain: 'Zustandsübergreifende Übergänge gehören vor die Zustandslogik.' },
      { type: 'multi', q: 'Welche Kriterien sind für die Entscheidung „mapp-Framework oder eigene Schicht“ relevant?', options: ['Wartbarkeit und Update-Fähigkeit', 'Kundenspezifische Anforderungen', 'Know-how im Team', 'Lieblingsfarbe des Projektleiters'], correct: [0, 1, 2], explain: 'Architekturentscheidungen folgen technischen und organisatorischen Kriterien.' },
      { type: 'single', q: 'Eine neue Statusinformation soll an alle Achsen-FBs. Wie bleibt die Änderung kompatibel?', options: ['Neuen VAR_OUTPUT an jeder Aufrufstelle verdrahten', 'Neues Element in der Statusstruktur ergänzen', 'Globale Variable einführen', 'Alle FBs kopieren'], correct: 1, explain: 'Ein zusätzliches Strukturelement ändert keine Aufrufe.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Achs-Framework für eine Achsgruppe',
        task: [
          'Baue die zwei unteren Schichten für eine Zwei-Achs-Gruppe (Achsen `gAxisX`, `gAxisY`). Die Datentypen stehen in `Types.typ`.',
          '',
          '**FB_Axis** (wiederverwendbar, Achse per `VAR_IN_OUT`):',
          '- intern ein `MpAxisBasic` mit `MpLink := ADR(Axis)`, Beschleunigung/Verzögerung 1000 mm/s²;',
          '- `Cmd.Power/Stop/Reset/MoveAbs` werden auf Power/Stop/ErrorReset/MoveAbsolute abgebildet; `Cmd.Home` referenziert nur, wenn eingeschaltet und noch nicht referenziert;',
          '- `Status.Ready` = eingeschaltet, referenziert, fehlerfrei und keine Bewegung; dazu Busy, InPos, Error, Position, Velocity.',
          '',
          '**Gruppenautomat** im Programm (`eGroupState`):',
          '- `diGroupOn` → STARTUP (beide einschalten und referenzieren) → READY, wenn beide Ready.',
          '- READY: Flanke `diGo` → beide fahren (X mit 100 mm/s auf `rTargetX`, Y mit `rVelY` auf `rTargetY`) → MOVE; wenn beide InPos → READY.',
          '- Fehler einer Achse (aus jedem Zustand) → ERROR: **beide** Achsen mit Stop stillsetzen, keine Fahrbefehle. Flanke `diAck` → Reset an beide; sind alle Fehler weg → STARTUP.',
          '- `diGroupOn` = FALSE → OFF (alles aus).',
          '',
          '**Simulation:** `rVelY` = 0 ist ein ungültiger Parameter und führt beim Start der Fahrt zum Fehler der Achse Y.'
        ].join('\n'),
        hints: ['`CmdY := CmdX;` kopiert eine ganze Struktur.', 'Die FB-Aufrufe stehen am Ende des Programms; die Statusausgänge liest du deshalb aus dem vorigen Zyklus – das ist hier unkritisch.'],
        cycleMs: 10,
        io: ARCH_IO,
        scene: { type: 'axis', bind: { position: 'rPosX', min: 0, max: 500, powered: 'doGroupReady', error: 'doGroupError' } },
        files: { main: ARCH_FB_START + ARCH_PRG_START, var: ARCH_VAR, typ: ARCH_TYP },
        solution: { main: ARCH_FB_SOL + ARCH_PRG_SOL, var: ARCH_VAR, typ: ARCH_TYP },
        tests: [
          { name: 'Gruppe einschalten', steps: [{ set: { diGroupOn: true } }, { until: 'doGroupReady', maxMs: 2000, msg: 'Die Gruppe wird nicht bereit (beide Achsen einschalten und referenzieren).' }, { expect: 'gAxisX.PowerOn AND gAxisY.PowerOn AND gAxisX.IsHomed AND gAxisY.IsHomed' }] },
          { name: 'Gemeinsame Fahrt', steps: [{ set: { diGroupOn: true, rTargetX: 200.0, rTargetY: 300.0 } }, { until: 'doGroupReady', maxMs: 2000 }, ...pulse('diGo'), { until: 'doGroupReady AND ABS(rPosX - 200.0) < 0.01 AND ABS(rPosY - 300.0) < 0.01', maxMs: 4000 }] },
          { name: 'Fehler Y setzt die Gruppe still', steps: [{ set: { diGroupOn: true, rTargetX: 400.0, rTargetY: 100.0, rVelY: 0.0 } }, { until: 'doGroupReady', maxMs: 2000 }, ...pulse('diGo'), { until: 'doGroupError', maxMs: 200, msg: 'Der Fehler der Achse Y muss die Gruppe in ERROR bringen.' }, { until: 'ABS(rVelX) < 0.001', maxMs: 300, msg: 'Achse X muss bei einem Gruppenfehler stillgesetzt werden.' }, { never: 'rPosX > 20.0', ms: 500, msg: 'Achse X fährt trotz Gruppenfehler weiter.' }] },
          { name: 'Quittieren und weiterarbeiten', steps: [{ set: { diGroupOn: true, rTargetX: 400.0, rTargetY: 100.0, rVelY: 0.0 } }, { until: 'doGroupReady', maxMs: 2000 }, ...pulse('diGo'), { until: 'doGroupError', maxMs: 200 }, { set: { rVelY: 150.0 } }, ...pulse('diAck'), { until: 'doGroupReady', maxMs: 2000, msg: 'Nach dem Quittieren muss die Gruppe wieder bereit werden.' }, ...pulse('diGo'), { until: 'doGroupReady AND ABS(rPosX - 400.0) < 0.01 AND ABS(rPosY - 100.0) < 0.01', maxMs: 6000 }] },
          { name: 'Gruppe aus', steps: [{ set: { diGroupOn: true } }, { until: 'doGroupReady', maxMs: 2000 }, { set: { diGroupOn: false } }, { cycles: 3 }, { expect: 'NOT gAxisX.PowerOn AND NOT gAxisY.PowerOn AND NOT doGroupReady' }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 6 · Modul 2 (Projekt)
  {
    id: 'motion-6-safemotion',
    level: 6,
    kind: 'projekt',
    title: 'Praxisprojekt: Safe-Motion-Schnittstelle (STO, SS1, SLS)',
    summary: 'Du verstehst die antriebsintegrierten Sicherheitsfunktionen STO, SS1 und SLS und programmierst die funktionale Gegenseite im Standardprogramm so, dass die Sicherheitstechnik nie unnötig eingreifen muss.',
    minutes: 360,
    req: ['motion-6-architektur'],
    briefing: 'Antriebe wie ACOPOS P3 SafeMOTION oder ACOPOSmotor SafeMOTION überwachen Sicherheitsfunktionen selbst: STO (Safe Torque Off) schaltet momentfrei, SS1 (Safe Stop 1) überwacht ein Stillsetzen mit Rampe und löst danach STO aus, SLS (Safely Limited Speed) überwacht eine Geschwindigkeitsgrenze. Angefordert werden sie von der Sicherheitssteuerung (SafeLOGIC, programmiert im SafeDESIGNER), nicht vom Standardprogramm. Das Standardprogramm muss aber kooperieren: Wird SLS angefordert, muss es die Geschwindigkeit rechtzeitig unter die sichere Grenze bringen, sonst löst die Überwachung einen Stopp aus. Bei SS1 soll es selbst geführt bremsen und danach keinen automatischen Wiederanlauf erlauben. Die Auswahl und Bewertung der Sicherheitsfunktionen (EN ISO 13849, EN 61800-5-2) gehört in den Bereich Funktionale Sicherheit – hier geht es um die Schnittstelle zwischen Safety und Motion.',
    practice: 'Typischer Inbetriebnahmefehler: Die Schutztür wird im Einrichtbetrieb geöffnet, SLS wird aktiv – aber das Programm fährt weiter mit Produktionsgeschwindigkeit. Ergebnis: Sicherheitsstopp bei jedem Türöffnen, genervte Bediener und im schlimmsten Fall manipulierte Türschalter. Eine saubere funktionale Schnittstelle verhindert das.',
    transfer: {
      tia: 'SINAMICS Safety Integrated (STO, SS1, SLS, SOS …) wird über PROFIsafe-Telegramme von der F-CPU angesteuert; das Standardprogramm liest Statusworte (z. B. Telegramm 30) und reduziert die Geschwindigkeit funktional.',
      codesys: 'Beckhoff AX8000 mit TwinSAFE bzw. EtherCAT-Antriebe mit FSoE: Die Safety-Funktionen laufen im Antrieb, angefordert von der TwinSAFE-Logik; das NC-Programm muss ebenso funktional reagieren.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Unterscheide STO, SS1 und SLS',
        guide: {
          intro: 'Antriebsintegrierte Sicherheitsfunktionen sind in EN 61800-5-2 beschrieben (hier nur als Referenz, keine Rechtsberatung).',
          steps: [
            'STO: Energiezufuhr zum Motor sicher unterbrochen, kein Moment – der Motor trudelt aus (Stopp-Kategorie 0).',
            'SS1: Antrieb bremst (rampen- oder zeitüberwacht), danach STO (Stopp-Kategorie 1).',
            'SLS: Geschwindigkeit wird sicher auf eine Grenze überwacht; bei Überschreitung reagiert die Sicherheitstechnik mit einem Stopp.',
            'Lies in der B&R-Hilfe die Seiten zu STO, SS1 und SLS (SafeMOTION) und notiere „rampenüberwacht“ vs. „zeitüberwacht“.',
            'Ordne zu: Schutztür im Einrichtbetrieb offen → SLS; Not-Halt → SS1; Wartung mit Eingriff → STO (ggf. mit Haltebremse).'
          ],
          done: 'Erledigt, wenn du für jede der drei Funktionen Wirkung, Stopp-Kategorie und eine typische Anwendung nennen kannst.',
          tip: 'STO hält eine hängende Last nicht! Vertikale Achsen brauchen zusätzlich eine sichere Bremsenansteuerung (SBC).',
          link: helpLink('sto', 'Safe Torque Off, STO')
        }
      },
      {
        id: 'o2',
        title: 'Verstehe die Aufgabenteilung Safety ↔ Standardprogramm',
        guide: {
          intro: 'Die Sicherheitsfunktion liegt in der Safety-Steuerung und im Antrieb, die Bewegung im Standardprogramm.',
          steps: [
            'Sicherheitssteuerung (SafeLOGIC, SafeDESIGNER): wertet Not-Halt, Türen, Betriebsartenwahl aus und fordert SS1/SLS im Antrieb an.',
            'Antrieb (SafeMOTION): überwacht die Funktion mit sicherem Geber und reagiert selbst.',
            'Standardprogramm: liest den Safety-Status (nicht sicher, nur zur Information) und reagiert funktional – Geschwindigkeit reduzieren, geführt stoppen, Wiederanlauf verriegeln.',
            'Wichtig: Das Standardprogramm darf nie Teil der Sicherheitsfunktion sein; es sorgt nur dafür, dass die Überwachung nicht anspricht.'
          ],
          done: 'Erledigt, wenn du ein Blockschaltbild Safety-Steuerung – Antrieb – Standard-CPU mit den Signalrichtungen gezeichnet hast.',
          tip: 'Lege die funktionale Grenze (hier 50 mm/s) mit Abstand unter die sichere Grenze (60 mm/s) – Regelabweichungen und Messrauschen brauchen Reserve.',
          link: helpLink('p3Safe', 'Der sichere Antriebsstrang ACOPOS P3')
        }
      },
      {
        id: 'o3',
        title: 'Reagiere funktional auf SLS',
        guide: {
          intro: 'Wird SLS angefordert, muss die Achse rechtzeitig langsamer werden.',
          steps: [
            'Wähle die Sollgeschwindigkeit abhängig vom SLS-Status: `rVelCmd := SEL(diSLS, V_RUN, V_SLS);`.',
            'Ändert sich die Sollgeschwindigkeit während einer Fahrt, setze den Fahrbefehl mit neuer Flanke erneut ab.',
            'Prüfe die Reaktionszeit: Bremszeit von 300 auf 50 mm/s bei 1000 mm/s² = 0,25 s; die SLS-Überwachung braucht eine passende Toleranz-/Übergangszeit.',
            'Nach Wegnahme von SLS wieder auf Produktionsgeschwindigkeit.'
          ],
          done: 'Erledigt, wenn die Übung zeigt, dass die Geschwindigkeit spätestens 400 ms nach SLS-Anforderung unter 60 mm/s liegt.',
          tip: 'In einer Mehrachsmaschine muss die Reduzierung für alle betroffenen Achsen gleichzeitig erfolgen – gekoppelte Achsen am besten über den Master.',
          link: helpLink('sls', 'Safely Limited Speed, SLS')
        }
      },
      {
        id: 'o4',
        title: 'Setze SS1 funktional um und verriegle den Wiederanlauf',
        guide: {
          intro: 'Bei SS1 bremst die Achse geführt; das Standardprogramm unterstützt das und verhindert einen automatischen Wiederanlauf.',
          steps: [
            'SS1-Anforderung aus jedem Zustand: Fahrbefehl weg, `Stop` setzen.',
            'Nach `Stopped` Regler aus (`Power := FALSE`) – der Antrieb geht ohnehin in STO.',
            'Wiederanlauf erst, wenn die Anforderung weg ist **und** quittiert wurde (bewusste Bedienerhandlung).',
            'Lies die B&R-Hilfe zu SS1 (rampen-/zeitüberwacht) und vergleiche die Überwachungszeit mit deiner Bremszeit.'
          ],
          done: 'Erledigt, wenn die Übung „SLS und SS1 funktional umsetzen“ alle Tests besteht.',
          tip: 'Die Quittierung im Standardprogramm ersetzt nicht die Quittierung in der Safety-Logik – beide sind nötig und getrennt.',
          link: helpLink('ss1', 'Safe Stop 1, SS1')
        }
      },
      {
        id: 'o5',
        title: 'Dokumentiere die Schnittstelle und reiche den Nachweis ein',
        guide: {
          intro: 'Die Safety-Motion-Schnittstelle muss für Validierung und Service dokumentiert sein.',
          steps: [
            'Erstelle eine Tabelle: Safety-Signal → Bedeutung → Reaktion im Standardprogramm → Reaktionszeit.',
            'Zeichne für SLS und SS1 einen Trace (Anforderung, Geschwindigkeit, Power) aus der Simulation.',
            'Lege Code und Dokumentation auf git.breitner.de ab und reiche den Link ein.',
            'Stimme die Dokumentation mit der Person ab, die die Safety-Applikation verantwortet (Bereich Funktionale Sicherheit).'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist.',
          tip: 'Reaktionszeiten gehören in die Sicherheitsdokumentation – gemessen, nicht geschätzt.'
        }
      }
    ],
    videos: [
      vid('sinamicsSafety', 'Deutsche Herstellererklärung der im Antrieb integrierten Sicherheitsfunktionen (STO, SS1, SLS …) – das Prinzip gilt herstellerübergreifend.'),
      vid('ss1', 'Animation der Funktion SS1: geführtes Stillsetzen mit anschließendem STO.'),
      vid('safetyPlus', 'B&R stellt sein aktuelles Sicherheitskonzept vor.')
    ],
    readings: [
      brHelp('sto', 'Safe Torque Off, STO', 15, 'Definition und Verhalten von STO in B&R SafeMOTION.'),
      brHelp('ss1', 'Safe Stop 1, SS1', 15, 'Rampen- und zeitüberwachter Stillsetzvorgang bei SS1.'),
      brHelp('sls', 'Safely Limited Speed, SLS', 15, 'Parameter und Verhalten der sicher begrenzten Geschwindigkeit.')
    ],
    quiz: [
      { type: 'single', q: 'Was bewirkt SS1?', options: ['Der Motor wird sofort momentfrei', 'Der Antrieb bremst überwacht und schaltet danach STO', 'Die Geschwindigkeit wird begrenzt', 'Die Achse wird referenziert'], correct: 1, explain: 'SS1 = Stopp-Kategorie 1: geführtes Bremsen, dann STO.' },
      { type: 'single', q: 'Welche Rolle hat das Standardprogramm bei SLS?', options: ['Es überwacht die sichere Geschwindigkeit', 'Es reduziert die Geschwindigkeit funktional rechtzeitig unter die Grenze, damit die Überwachung nicht anspricht', 'Keine', 'Es schaltet STO'], correct: 1, explain: 'Die Überwachung ist Sache der Sicherheitstechnik; das Standardprogramm kooperiert funktional.' },
      { type: 'multi', q: 'Was muss nach einem SS1 gelten, bevor die Maschine wieder anläuft?', options: ['Die Anforderung ist weg', 'Eine bewusste Quittierung/Startbefehl erfolgt', 'Die Achse läuft automatisch an, sobald die Tür zu ist', 'Die Safety-Logik ist quittiert'], correct: [0, 1, 3], explain: 'Kein automatischer Wiederanlauf: Anforderung weg und bewusste Quittierung in Safety- und Standardprogramm.' }
    ],
    exam: [
      { type: 'numeric', q: 'Eine Achse fährt mit {v} mm/s und bremst mit 1000 mm/s² auf 50 mm/s. Wie lange dauert das?', params: { v: [100, 500, 50] }, formula: '(v - 50) / 1000', unit: 's', tol: 0.01, explain: 't = (v − v_SLS) / a.' },
      { type: 'single', q: 'Warum reicht STO allein bei einer vertikalen Achse nicht?', options: ['STO ist zu langsam', 'Ohne Moment fällt die Last – es braucht zusätzlich eine sichere Bremse (SBC)', 'STO wirkt nur bei Asynchronmotoren', 'STO braucht einen Absolutgeber'], correct: 1, explain: 'STO schaltet das Moment ab; eine hängende Last muss mechanisch gehalten werden.' },
      { type: 'single', q: 'Wo wird die Sicherheitslogik (Not-Halt, Türen) einer B&R-Maschine programmiert?', options: ['Im Standard-ST-Programm', 'In der Sicherheitssteuerung SafeLOGIC mit SafeDESIGNER', 'In mapp View', 'Im Antriebs-Trace'], correct: 1, explain: 'Sicherheitslogik gehört in die zertifizierte Sicherheitssteuerung, nicht ins Standardprogramm.' },
      { type: 'single', q: 'Weshalb wird die funktionale Geschwindigkeitsgrenze unter die sichere SLS-Grenze gelegt?', options: ['Aus Energiespargründen', 'Damit Regelabweichungen und Überschwinger nicht zu einer Verletzung der überwachten Grenze führen', 'Weil die Norm das so vorschreibt', 'Damit der Trace schöner aussieht'], correct: 1, explain: 'Abstand zur Überwachungsgrenze verhindert unnötige Sicherheitsstopps.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'SLS und SS1 funktional umsetzen',
        task: [
          'Eine Achse pendelt im Produktionsbetrieb mit **300 mm/s** zwischen 50 und 400 mm (vorgegeben). Die Sicherheitssteuerung meldet zwei Anforderungen an das Standardprogramm (vereinfacht als TRUE = angefordert; in der Realität kommen sie als Statusbits der SafeLOGIC):',
          '',
          '- `diSLS`: SLS aktiv, die sichere Grenze liegt bei **60 mm/s**.',
          '- `diSS1`: SS1 angefordert (z. B. Not-Halt).',
          '',
          'Erweitere das Programm:',
          '1. **SLS:** Solange `diSLS` TRUE ist, fährt die Achse mit `V_SLS` = 50 mm/s. Eine laufende Fahrt wird dazu mit neuer Geschwindigkeit erneut gestartet (neue Flanke an MoveAbsolute). Spätestens **400 ms** nach der Anforderung muss die Geschwindigkeit unter 60 mm/s liegen. Nach Wegnahme wieder 300 mm/s – ebenfalls während der laufenden Fahrt.',
          '2. **SS1:** Aus jedem Zustand (außer aus) → `ST_SS1`: Fahrbefehl weg, `Stop` bis `Stopped`, dann Regler aus → `ST_SAFE` (`doSafeStopDone`).',
          '3. **Kein automatischer Wiederanlauf:** Aus `ST_SAFE` geht es erst weiter, wenn `diSS1` FALSE ist **und** eine steigende Flanke an `diAck` kommt. Dann wird wieder eingeschaltet und das Pendeln fortgesetzt.',
          '',
          'Die Zustände `ST_SS1` und `ST_SAFE` sind in `Types.typ` vorbereitet.'
        ].join('\n'),
        hints: ['`SEL(diSLS, V_RUN, V_SLS)` liefert V_SLS, wenn diSLS TRUE ist.', 'Weicht `rVelCmd` von `AxisPar.Velocity` ab, nimm MoveAbsolute zurück und gehe nach ST_NEXT – dort wird der Befehl mit neuer Geschwindigkeit wieder gesetzt.', 'Die SS1-Abfrage gehört vor die CASE-Anweisung.'],
        cycleMs: 10,
        io: SAFE_IO,
        scene: { type: 'axis', bind: { position: 'rAxisPos', min: 0, max: 500, powered: 'doPowerOn' } },
        files: { main: SAFE_START, var: SAFE_VAR, typ: SAFE_TYP },
        solution: { main: SAFE_SOL, var: SAFE_VAR, typ: SAFE_TYP },
        tests: [
          { name: 'Produktionsbetrieb', steps: [...running, { expect: 'doPowerOn AND NOT doSafeStopDone' }] },
          { name: 'SLS begrenzt die Geschwindigkeit', steps: [...running, { set: { diSLS: true } }, { ms: 400 }, { never: 'ABS(rAxisVel) > 60.0', ms: 1500, msg: 'Spätestens 400 ms nach der SLS-Anforderung muss die Achse unter 60 mm/s fahren – auch bei laufender Fahrt.' }, { expect: 'ABS(rAxisVel) > 10.0', msg: 'Unter SLS soll die Achse langsam weiterfahren, nicht stehen bleiben.' }] },
          { name: 'Nach SLS wieder Produktionsgeschwindigkeit', steps: [...running, { set: { diSLS: true } }, { ms: 1000 }, { set: { diSLS: false } }, { until: 'ABS(rAxisVel) > 290.0', maxMs: 1500, msg: 'Nach Wegnahme von SLS muss die Achse – auch in der laufenden Fahrt – wieder auf 300 mm/s gehen.' }] },
          { name: 'SS1: geführter Stopp, dann Regler aus', steps: [...running, { set: { diSS1: true } }, { until: 'ABS(rAxisVel) < 0.001', maxMs: 600, msg: 'Bei SS1 muss die Achse innerhalb von 600 ms stehen.' }, { until: 'doSafeStopDone AND NOT doPowerOn', maxMs: 300 }] },
          { name: 'Kein automatischer Wiederanlauf', steps: [...running, { set: { diSS1: true } }, { until: 'doSafeStopDone', maxMs: 1000 }, { set: { diSS1: false } }, { never: 'doPowerOn OR ABS(rAxisVel) > 0.0', ms: 500, msg: 'Nach Wegnahme von SS1 darf die Achse ohne Quittierung nicht anlaufen.' }, ...pulse('diAck'), { until: 'ABS(rAxisVel) > 10.0', maxMs: 2000, msg: 'Nach Quittierung muss das Pendeln fortgesetzt werden.' }] },
          { name: 'Quittieren bei anstehender Anforderung', steps: [...running, { set: { diSS1: true } }, { until: 'doSafeStopDone', maxMs: 1000 }, ...pulse('diAck'), { never: 'doPowerOn', ms: 500, msg: 'Solange SS1 ansteht, darf eine Quittierung keinen Wiederanlauf auslösen.' }] }
        ]
      }
    ],
    proof: true,
    badge: 'Safe-Motion-Integration'
  }
];
