'use strict';
const { L, brHelp, helpLink, fhnw, community, R, vid, ioAxisOut } = require('./common');

// ─────────────────────────────────────────────────────────────── Übungscode Level 2

// M1 · Geberwerte umrechnen
const SCALE_VAR = L(
  'VAR CONSTANT',
  '\tENC_INCR_PER_REV : REAL := 4096.0;  (* Geberinkremente je Motorumdrehung *)',
  '\tGEAR_RATIO : REAL := 5.0;           (* Getriebe i = n_Motor / n_Spindel *)',
  '\tSPINDLE_PITCH : REAL := 10.0;       (* Spindelsteigung in mm je Umdrehung *)',
  'END_VAR'
);
const SCALE_START = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\t(* TODO: Getriebe fehlt noch in allen drei Formeln *)',
  '\trPosMm := DINT_TO_REAL(nEncCounts) / ENC_INCR_PER_REV * SPINDLE_PITCH;',
  '\trVelMmS := rMotorRpm * SPINDLE_PITCH;',
  '\tnTargetCounts := 0;',
  'END_PROGRAM'
);
const SCALE_SOL = L(
  'PROGRAM _INIT',
  '',
  'END_PROGRAM',
  '',
  'PROGRAM _CYCLIC',
  '\t(* Motorumdrehungen -> Spindelumdrehungen -> mm *)',
  '\trPosMm := DINT_TO_REAL(nEncCounts) / ENC_INCR_PER_REV / GEAR_RATIO * SPINDLE_PITCH;',
  '\t(* 1/min -> 1/s am Motor, durch Getriebe, mal Steigung *)',
  '\trVelMmS := rMotorRpm / 60.0 / GEAR_RATIO * SPINDLE_PITCH;',
  '\t(* Rückrechnung mm -> Inkremente *)',
  '\tnTargetCounts := REAL_TO_DINT(rTargetMm / SPINDLE_PITCH * GEAR_RATIO * ENC_INCR_PER_REV);',
  'END_PROGRAM'
);

// M2 · Erste Achse mit MpAxisBasic
const FIRST_VAR = L(
  'VAR',
  '\tMpAxisBasic_0 : MpAxisBasic;',
  '\tAxisPar : MpAxisBasicParType;',
  'END_VAR'
);
const FIRST_INIT = L(
  'PROGRAM _INIT',
  '\tAxisPar.Velocity := 100.0;       (* mm/s *)',
  '\tAxisPar.Acceleration := 1000.0;  (* mm/s² *)',
  '\tAxisPar.Deceleration := 1000.0;  (* mm/s² *)',
  'END_PROGRAM',
  ''
);
const FIRST_START = FIRST_INIT + L(
  'PROGRAM _CYCLIC',
  '\t(* In AS6 zusätzlich: MpAxisBasic_0.MpLink := ADR(gAxis01); – in der Simulation nicht nötig *)',
  '\tMpAxisBasic_0.Enable := TRUE;',
  '\tMpAxisBasic_0.Parameters := ADR(AxisPar);',
  '\t(* TODO: Power und Home verdrahten *)',
  '\tMpAxisBasic_0();',
  '',
  '\t(* TODO: Status auf die Ausgänge legen *)',
  'END_PROGRAM'
);
const FIRST_SOL = FIRST_INIT + L(
  'PROGRAM _CYCLIC',
  '\tMpAxisBasic_0.Enable := TRUE;',
  '\tMpAxisBasic_0.Parameters := ADR(AxisPar);',
  '\tMpAxisBasic_0.Power := diPower;',
  '\t(* Referenzieren nur bei eingeschalteter Achse *)',
  '\tMpAxisBasic_0.Home := diHome AND MpAxisBasic_0.PowerOn;',
  '\tMpAxisBasic_0();',
  '',
  '\tdoPowerOn := MpAxisBasic_0.PowerOn;',
  '\tdoHomed := MpAxisBasic_0.IsHomed;',
  '\tdoError := MpAxisBasic_0.Error;',
  '\trAxisPos := LREAL_TO_REAL(MpAxisBasic_0.Position);',
  '\trAxisVel := MpAxisBasic_0.Velocity;',
  'END_PROGRAM'
);

// M3 · Einschalt-/Referenziersequenz mit Rezeptpositionen
const SEQ_TYP = L(
  'TYPE',
  '\teSeqState : (SEQ_OFF := 0, SEQ_POWER := 10, SEQ_HOME := 20, SEQ_READY := 30, SEQ_MOVE := 40, SEQ_ERROR := 90);',
  'END_TYPE'
);
const SEQ_VAR = L(
  'VAR',
  '\tMpAxisBasic_0 : MpAxisBasic;',
  '\tAxisPar : MpAxisBasicParType;',
  '\teState : eSeqState;',
  '\trtGo : R_TRIG;',
  '\trtAck : R_TRIG;',
  '\taRecipePos : ARRAY[0..2] OF LREAL := [50.0, 250.0, 400.0];',
  'END_VAR'
);
const SEQ_INIT = L(
  'PROGRAM _INIT',
  '\tAxisPar.Velocity := 200.0;',
  '\tAxisPar.Acceleration := 1000.0;',
  '\tAxisPar.Deceleration := 1000.0;',
  'END_PROGRAM',
  ''
);
const SEQ_TAIL = L(
  '',
  '\tMpAxisBasic_0.Enable := TRUE;',
  '\tMpAxisBasic_0.Parameters := ADR(AxisPar);',
  '\tMpAxisBasic_0();',
  '',
  '\tdoReady := (eState = SEQ_READY);',
  '\tdoPowerOn := MpAxisBasic_0.PowerOn;',
  '\tdoInPos := MpAxisBasic_0.InPosition;',
  '\tdoError := MpAxisBasic_0.Error;',
  '\trAxisPos := LREAL_TO_REAL(MpAxisBasic_0.Position);',
  '\trAxisVel := MpAxisBasic_0.Velocity;',
  'END_PROGRAM'
);
const SEQ_START = SEQ_INIT + L(
  'PROGRAM _CYCLIC',
  '\trtGo(CLK := diGo);',
  '',
  '\tCASE eState OF',
  '\t\tSEQ_OFF:',
  '\t\t\t(* TODO: Achse aus, bei diAuto einschalten *)',
  '',
  '\t\tSEQ_POWER:',
  '\t\t\t(* TODO: Power setzen, auf PowerOn warten *)',
  '',
  '\t\tSEQ_HOME:',
  '\t\t\t(* TODO: Referenzieren *)',
  '',
  '\t\tSEQ_READY:',
  '\t\t\t(* TODO: Rezeptposition anfahren *)',
  '',
  '\t\tSEQ_MOVE:',
  '\t\t\t(* TODO: auf InPosition warten *)',
  '',
  '\tEND_CASE'
) + SEQ_TAIL;

const SEQ_BODY = [
  '\trtGo(CLK := diGo);',
  '',
  '\t(* Automatik weg -> aus jedem Zustand abschalten *)',
  '\tIF NOT diAuto THEN',
  '\t\teState := SEQ_OFF;',
  '\tEND_IF',
  '',
  '\tCASE eState OF',
  '\t\tSEQ_OFF:',
  '\t\t\tMpAxisBasic_0.Power := FALSE;',
  '\t\t\tMpAxisBasic_0.Home := FALSE;',
  '\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\tIF diAuto THEN',
  '\t\t\t\teState := SEQ_POWER;',
  '\t\t\tEND_IF',
  '',
  '\t\tSEQ_POWER:',
  '\t\t\tMpAxisBasic_0.Power := TRUE;',
  '\t\t\tIF MpAxisBasic_0.PowerOn THEN',
  '\t\t\t\tIF MpAxisBasic_0.IsHomed THEN',
  '\t\t\t\t\teState := SEQ_READY;',
  '\t\t\t\tELSE',
  '\t\t\t\t\teState := SEQ_HOME;',
  '\t\t\t\tEND_IF',
  '\t\t\tEND_IF',
  '',
  '\t\tSEQ_HOME:',
  '\t\t\tMpAxisBasic_0.Home := TRUE;',
  '\t\t\tIF MpAxisBasic_0.IsHomed THEN',
  '\t\t\t\tMpAxisBasic_0.Home := FALSE;',
  '\t\t\t\teState := SEQ_READY;',
  '\t\t\tEND_IF',
  '',
  '\t\tSEQ_READY:',
  '\t\t\tIF rtGo.Q AND diRecipe >= 0 AND diRecipe <= 2 THEN',
  '\t\t\t\tAxisPar.Position := aRecipePos[diRecipe];',
  'VELSET',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := TRUE;',
  '\t\t\t\teState := SEQ_MOVE;',
  '\t\t\tEND_IF',
  '',
  '\t\tSEQ_MOVE:',
  '\t\t\tIF MpAxisBasic_0.InPosition THEN',
  '\t\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\t\teState := SEQ_READY;',
  '\t\t\tEND_IF'
];
const seqCyclic = (velset, extraStates, errCheck) => L(
  'PROGRAM _CYCLIC',
  ...SEQ_BODY.slice(0, 7),
  ...(errCheck || []),
  ...SEQ_BODY.slice(7).map(l => l === 'VELSET' ? (velset || null) : l).filter(l => l !== null),
  ...(extraStates || []),
  '\tEND_CASE'
);
const SEQ_SOL = SEQ_INIT + seqCyclic() + SEQ_TAIL;

// M3 · Erweiterung: Fehlerreaktion und Quittierung
const ERR_START = SEQ_INIT + seqCyclic('\t\t\t\tAxisPar.Velocity := rVelSet;') + SEQ_TAIL;
const ERR_SOL = SEQ_INIT + seqCyclic('\t\t\t\tAxisPar.Velocity := rVelSet;', [
  '',
  '\t\tSEQ_ERROR:',
  '\t\t\t(* Fehlerreaktion: alle Befehle weg, Leistungsteil aus *)',
  '\t\t\tMpAxisBasic_0.Power := FALSE;',
  '\t\t\tMpAxisBasic_0.Home := FALSE;',
  '\t\t\tMpAxisBasic_0.MoveAbsolute := FALSE;',
  '\t\t\tIF rtAck.Q THEN',
  '\t\t\t\tMpAxisBasic_0.ErrorReset := TRUE;',
  '\t\t\tEND_IF',
  '\t\t\tIF NOT MpAxisBasic_0.Error THEN',
  '\t\t\t\tMpAxisBasic_0.ErrorReset := FALSE;',
  '\t\t\t\teState := SEQ_POWER;',
  '\t\t\tEND_IF'
], [
  '\trtAck(CLK := diAck);',
  '\t(* Fehler hat Vorrang vor allen anderen Zuständen (außer Aus) *)',
  '\tIF MpAxisBasic_0.Error AND eState <> SEQ_OFF THEN',
  '\t\teState := SEQ_ERROR;',
  '\tEND_IF',
  ''
]) + SEQ_TAIL;

const SEQ_IO = [
  { name: 'diAuto', type: 'BOOL', dir: 'in', label: 'Wahlschalter Automatik', widget: 'switch' },
  { name: 'diRecipe', type: 'INT', dir: 'in', label: 'Rezeptnummer (0–2)', widget: 'slider', min: 0, max: 9 },
  { name: 'diGo', type: 'BOOL', dir: 'in', label: 'Taster Positionieren', widget: 'button' },
  { name: 'doReady', type: 'BOOL', dir: 'out', label: 'Achse bereit', widget: 'led' },
  { name: 'doPowerOn', type: 'BOOL', dir: 'out', label: 'Regler ein', widget: 'led' },
  { name: 'doInPos', type: 'BOOL', dir: 'out', label: 'In Position', widget: 'led' },
  { name: 'doError', type: 'BOOL', dir: 'out', label: 'Achsfehler', widget: 'led' },
  ...ioAxisOut
];
const AXIS_SCENE = (powered, homed) => ({ type: 'axis', bind: { position: 'rAxisPos', min: 0, max: 500, powered, homed: homed || 'doReady', error: 'doError' } });
const goTo = (recipe) => [{ set: { diRecipe: recipe, diGo: true } }, { cycles: 2 }, { set: { diGo: false } }];

module.exports = [
  // ───────────────────────────────────────────── Level 2 · Modul 1
  {
    id: 'motion-2-grundlagen',
    level: 2,
    kind: 'lektion',
    title: 'Antriebsgrundlagen: Motor, Geber, Getriebe, Mechanik',
    summary: 'Du verstehst, wie Servomotor, Umrichter, Geber und Mechanik zusammenwirken, und rechnest Geberinkremente sicher in Millimeter um.',
    minutes: 150,
    req: [],
    briefing: 'Jede Achse besteht aus einer Kette: Steuerung → Servoverstärker/Umrichter → Motor mit Geber → Getriebe → Mechanik (Spindel, Zahnriemen, Rundtisch). Wer Achsen programmiert, muss diese Kette verstehen, denn alle Positionen und Geschwindigkeiten im Programm sind Größen am Ende der Kette, gemessen wird aber am Anfang (am Motorgeber). In diesem Modul lernst du den Unterschied zwischen Servomotor und Asynchronmotor am Frequenzumrichter, die gängigen Gebersysteme und die Umrechnung über Getriebe und Mechanik bis zur Einheit, mit der du in mapp Motion arbeitest.',
    practice: 'Bei der Inbetriebnahme fährt eine Achse „doppelt so weit wie bestellt“ oder in die falsche Richtung: Fast immer stimmt die Skalierung (Getriebe, Spindelsteigung, Drehrichtung) nicht. Wer die Umrechnung im Kopf hat, findet den Fehler in Minuten statt in Stunden.',
    transfer: {
      tia: 'Im TIA Portal werden Getriebe und Spindelsteigung im Technologieobjekt „Positionierachse“ unter Mechanik eingetragen; die Achse rechnet dann in Lasteinheiten (mm). Das Prinzip ist identisch mit der mapp-Achskonfiguration.',
      codesys: 'In CODESYS SoftMotion bzw. TwinCAT NC wird die Skalierung als „Scaling Factor“ bzw. über Getriebe/Inkremente in der Achskonfiguration hinterlegt. Auch dort arbeitet das Programm in Lasteinheiten.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Unterscheide Servomotor und Asynchronmotor am Umrichter',
        guide: {
          intro: 'Für Positionieraufgaben wird meist ein permanenterregter Synchron-Servomotor eingesetzt, für Förder- und Pumpenanwendungen oft ein Asynchronmotor am Frequenzumrichter.',
          steps: [
            'Lies im FHNW-Skript das Kapitel „Servomotoren“ und notiere die Bauteile: Stator mit Drehstromwicklung, Rotor mit Permanentmagneten, Geber, ggf. Haltebremse.',
            'Notiere die Eigenschaften eines Servomotors: hohe Dynamik (kleines Trägheitsmoment), hohes Überlastmoment für kurze Zeit, Betrieb nur mit Geber und Servoverstärker.',
            'Notiere die Eigenschaften eines Asynchronmotors am Umrichter: robust, günstig, Drehzahl über Frequenz einstellbar, Schlupf; Positionieren nur mit Geber und Vektorregelung sinnvoll.',
            'Ordne B&R-Hardware zu: ACOPOS P3/ACOPOSmulti für Servomotoren (z. B. 8LS), ACOPOSinverter (P66/P76/P86) als Frequenzumrichter für Asynchronmotoren.',
            'Erstelle eine Tabelle „Anwendung → Motorart“ für: Förderband ohne Positionierung, Rundtakttisch, Querschneider, Lüfter.'
          ],
          done: 'Erledigt, wenn du für jede der vier Anwendungen begründet sagen kannst, ob Servo oder Asynchronmotor am Umrichter sinnvoll ist.',
          tip: 'Faustregel: Muss die Achse schnell und genau auf Position oder synchron zu einer anderen Achse laufen, ist es eine Servoachse.',
          link: helpLink('achse', 'Achse im mapp-Konzept')
        }
      },
      {
        id: 'o2',
        title: 'Erkläre Gebersysteme: inkrementell, absolut, Resolver',
        guide: {
          intro: 'Der Geber liefert dem Antrieb die Lage des Rotors. Ohne ihn gibt es weder Kommutierung noch Lageregelung.',
          steps: [
            'Inkrementalgeber: liefert Impulse (Spuren A/B, ggf. Referenzmarke). Nach dem Einschalten ist die Position unbekannt → Referenzfahrt nötig.',
            'Absolutwertgeber (Singleturn/Multiturn, z. B. EnDat): kennt die Position nach dem Einschalten, Multiturn auch über mehrere Umdrehungen.',
            'Resolver: robuster, analoger Lagegeber (Drehtransformator), absolut innerhalb einer Umdrehung.',
            'Berechne die Auflösung: Ein Geber mit 4096 Inkrementen/Umdrehung an einer Spindel mit 10 mm Steigung ohne Getriebe löst 10 mm / 4096 ≈ 0,0024 mm auf.',
            'Kläre: Wo sitzt der Geber bei deiner Maschine (Motor oder Last)? Was bedeutet das für Spiel im Getriebe?'
          ],
          done: 'Erledigt, wenn du erklären kannst, warum eine Achse mit Inkrementalgeber nach jedem Einschalten referenziert werden muss, eine mit Multiturn-Absolutgeber aber nicht.',
          tip: 'Bei Absolutgebern wird die Referenzposition einmalig gesetzt und bleibt erhalten – bis jemand Motor oder Kupplung tauscht. Dann muss neu referenziert werden.'
        }
      },
      {
        id: 'o3',
        title: 'Rechne über Getriebe und Mechanik in Lasteinheiten um',
        guide: {
          intro: 'Positionen werden in mapp Motion in Messeinheiten auf der Lastseite angegeben (z. B. mm oder °). Die Achskonfiguration enthält dafür Getriebe und Bezugsweg.',
          steps: [
            'Getriebe: i = n_Motor / n_Abtrieb. Bei i = 5 dreht der Abtrieb fünfmal langsamer, das Moment ist (ohne Verluste) fünfmal größer.',
            'Spindel: Weg je Spindelumdrehung = Steigung p (z. B. 10 mm). Zahnriemen: Weg je Umdrehung = Zähnezahl × Teilung (z. B. 20 × 5 mm = 100 mm).',
            'Position: s = Inkremente / Inkremente_pro_Umdrehung / i × p.',
            'Geschwindigkeit: v [mm/s] = n_Motor [1/min] / 60 / i × p.',
            'Vergleiche mit der B&R-Hilfe „Messeinheiten und Achsskalierung“: MeasurementUnit, MeasurementResolution, ReferenceDistance, Gearbox Input/Output.'
          ],
          code: { lang: 'st', text: 'rPosMm := DINT_TO_REAL(nEncCounts) / 4096.0 / 5.0 * 10.0;\nrVelMmS := rMotorRpm / 60.0 / 5.0 * 10.0;' },
          done: 'Erledigt, wenn du für eine Spindelachse (p = 5 mm, i = 3) ausrechnen kannst, welche Motordrehzahl für 100 mm/s nötig ist (Ergebnis: 3600 1/min).',
          tip: 'Trage die Mechanikdaten immer in die Achskonfiguration ein und nicht als Faktoren ins Programm. Dann stimmen auch Diagnose, Trace und mapp Cockpit.',
          link: helpLink('units', 'Messeinheiten und Achsskalierung')
        }
      },
      {
        id: 'o4',
        title: 'Löse die Übung „Geberwerte in Lastgrößen umrechnen“',
        guide: {
          intro: 'Du schreibst die Umrechnung selbst in ST. So siehst du, was die Achskonfiguration später für dich übernimmt.',
          steps: [
            'Öffne die Übung und lies die Konstanten in `Variables.var`.',
            'Ergänze in `Main.st` den Getriebefaktor in Position und Geschwindigkeit.',
            'Berechne die Zielinkremente aus `rTargetMm` und wandle mit `REAL_TO_DINT` um.',
            'Starte die Tests und prüfe negative Inkremente (Bewegung in Minusrichtung).'
          ],
          done: 'Erledigt, wenn alle Tests der Übung grün sind.',
          tip: 'Rechne zuerst einen Wert von Hand nach (z. B. 20480 Inkremente = 1 Spindelumdrehung = 10 mm) und vergleiche mit dem Watch-Fenster.'
        }
      }
    ],
    videos: [
      vid('servo', 'Kompakte deutsche Erklärung von Aufbau und Regelprinzip eines Servomotors.'),
      vid('fu', 'Zeigt Gleichrichter, Zwischenkreis und Wechselrichter eines Frequenzumrichters – die Basis jedes Servoverstärkers.'),
      vid('geber', 'Inkrementalgeber zerlegt: Strichscheibe, Spuren A/B und Auswertung anschaulich erklärt.')
    ],
    readings: [
      fhnw('servomotor', 'Servomotoren', 30, 'Hochschulskript mit Aufbau, Kennlinien und Einsatzgrenzen von Servomotoren.'),
      fhnw('geber', 'Gebersysteme', 25, 'Vergleicht Inkrementalgeber, Absolutwertgeber und Resolver mit ihren Schnittstellen.'),
      brHelp('units', 'Messeinheiten und Achsskalierung', 15, 'Zeigt an zwei Beispielen (Rundachse, Spindelachse), wie Getriebe und Bezugsweg in mapp Motion eingetragen werden.')
    ],
    quiz: [
      { type: 'single', q: 'Warum muss eine Achse mit reinem Inkrementalgeber nach dem Einschalten referenziert werden?', options: ['Weil der Geber nach dem Einschalten kalibriert werden muss', 'Weil der Geber nur Positionsänderungen liefert und die absolute Lage unbekannt ist', 'Weil der Servoverstärker sonst kein Moment erzeugt', 'Weil das Getriebe Spiel hat'], correct: 1, explain: 'Ein Inkrementalgeber zählt nur Impulse relativ zum Einschaltzeitpunkt. Den Bezug zur Maschine stellt erst die Referenzfahrt her.' },
      { type: 'numeric', q: 'Ein Servomotor dreht mit {n} 1/min. Getriebe i = {i}, Spindelsteigung 10 mm. Wie schnell fährt der Schlitten?', params: { n: [600, 3000, 300], i: [2, 10, 1] }, formula: 'n / 60 / i * 10', unit: 'mm/s', tol: 0.01, explain: 'v = n / 60 / i × p.' },
      { type: 'multi', q: 'Welche Angaben braucht die Achskonfiguration, damit das Programm in Millimetern arbeiten kann?', options: ['Getriebeübersetzung (Input/Output)', 'Weg je Abtriebsumdrehung (ReferenceDistance)', 'IP-Adresse des Servoverstärkers', 'Messeinheit und Auflösung'], correct: [0, 1, 3], explain: 'Getriebe, Bezugsweg sowie Messeinheit/Auflösung bestimmen die Skalierung. Die Netzwerkadresse hat damit nichts zu tun.' }
    ],
    exam: [
      { type: 'numeric', q: 'Zahnriemenachse: Ritzel mit {z} Zähnen, Teilung 5 mm, Getriebe i = 4. Welche Motordrehzahl ist für 500 mm/s nötig?', params: { z: [16, 40, 2] }, formula: '500 / (z * 5) * 4 * 60', unit: '1/min', tol: 0.01, explain: 'Weg je Abtriebsumdrehung = z × 5 mm. n_Abtrieb = v / Weg, n_Motor = n_Abtrieb × i, in 1/min mal 60.' },
      { type: 'single', q: 'Welche Aussage zum Asynchronmotor am Frequenzumrichter trifft zu?', options: ['Er braucht immer einen Absolutwertgeber', 'Seine Drehzahl hängt bei konstanter Frequenz leicht von der Last ab (Schlupf)', 'Er kann nicht rückwärts drehen', 'Er hat eine höhere Dynamik als ein Servomotor gleicher Leistung'], correct: 1, explain: 'Der Rotor eines Asynchronmotors dreht etwas langsamer als das Drehfeld; dieser Schlupf steigt mit der Last.' },
      { type: 'numeric', q: 'Ein Geber hat {inc} Inkremente je Umdrehung, Getriebe i = 5, Spindel 10 mm. Welche Auflösung in µm ergibt sich an der Last?', params: { inc: [1024, 8192, 1024] }, formula: '10 / 5 / inc * 1000', unit: 'µm', tol: 0.01, explain: 'Eine Motorumdrehung bewegt die Last um 10 mm / 5 = 2 mm. Geteilt durch die Inkremente ergibt die Auflösung.' },
      { type: 'single', q: 'Wo sollten Getriebe und Spindelsteigung in einem mapp-Motion-Projekt eingetragen werden?', options: ['Als Konstanten in jedem Programm', 'In der Achskonfiguration (.axis), damit alle Funktionen in Lasteinheiten arbeiten', 'In der Visualisierung', 'In der Hardwarekonfiguration der CPU'], correct: 1, explain: 'Die Skalierung gehört in die Achskonfiguration. Dann arbeiten Bausteine, Trace und mapp Cockpit konsistent in Lasteinheiten.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Geberwerte in Lastgrößen umrechnen',
        task: [
          'Eine Spindelachse hat einen Motorgeber mit **4096 Inkrementen/Umdrehung**, ein Getriebe **i = 5** und eine Spindel mit **10 mm Steigung**. Die Konstanten stehen in `Variables.var`.',
          '',
          'Der Startcode rechnet falsch. Ergänze ihn so, dass gilt:',
          '- `rPosMm` = Schlittenposition in mm aus `nEncCounts` (auch negative Werte).',
          '- `rVelMmS` = Schlittengeschwindigkeit in mm/s aus `rMotorRpm` (1/min).',
          '- `nTargetCounts` = Geberinkremente, die der Zielposition `rTargetMm` entsprechen.',
          '',
          'Die Umrechnung soll in jedem Zyklus laufen.'
        ].join('\n'),
        hints: ['Eine Motorumdrehung bewegt die Spindel nur um 1/i Umdrehung.', '1/min geteilt durch 60 ergibt 1/s.', 'Für die Rückrechnung drehst du die Formel um: mm → Spindelumdrehungen → Motorumdrehungen → Inkremente.'],
        cycleMs: 10,
        io: [
          { name: 'nEncCounts', type: 'DINT', dir: 'in', label: 'Geberstand (Inkremente)', widget: 'slider', min: -100000, max: 100000 },
          { name: 'rMotorRpm', type: 'REAL', dir: 'in', label: 'Motordrehzahl', widget: 'slider', min: -3000, max: 3000, unit: '1/min' },
          { name: 'rTargetMm', type: 'REAL', dir: 'in', label: 'Zielposition', widget: 'slider', min: 0, max: 500, unit: 'mm' },
          { name: 'rPosMm', type: 'REAL', dir: 'out', label: 'Schlittenposition', widget: 'value', unit: 'mm' },
          { name: 'rVelMmS', type: 'REAL', dir: 'out', label: 'Schlittengeschwindigkeit', widget: 'value', unit: 'mm/s' },
          { name: 'nTargetCounts', type: 'DINT', dir: 'out', label: 'Zielinkremente', widget: 'value' }
        ],
        files: { main: SCALE_START, var: SCALE_VAR, typ: '' },
        solution: { main: SCALE_SOL, var: SCALE_VAR, typ: '' },
        tests: [
          { name: 'Eine Spindelumdrehung = 10 mm', steps: [{ set: { nEncCounts: 20480 } }, { cycles: 1 }, { expect: 'ABS(rPosMm - 10.0) < 0.001', msg: '20480 Inkremente = 5 Motorumdrehungen = 1 Spindelumdrehung = 10 mm.' }] },
          { name: 'Negative Position', steps: [{ set: { nEncCounts: -4096 } }, { cycles: 1 }, { expect: 'ABS(rPosMm + 2.0) < 0.001', msg: '-4096 Inkremente = -1 Motorumdrehung = -2 mm.' }] },
          { name: 'Geschwindigkeit aus Drehzahl', steps: [{ set: { rMotorRpm: 3000.0 } }, { cycles: 1 }, { expect: 'ABS(rVelMmS - 100.0) < 0.01', msg: '3000 1/min = 50 1/s am Motor = 10 1/s an der Spindel = 100 mm/s.' }] },
          { name: 'Zielinkremente', steps: [{ set: { rTargetMm: 25.0 } }, { cycles: 1 }, { expect: 'nTargetCounts = 51200', msg: '25 mm = 2,5 Spindelumdrehungen = 12,5 Motorumdrehungen = 51200 Inkremente.' }] },
          { name: 'Nullpunkt', steps: [{ cycles: 1 }, { expect: 'ABS(rPosMm) < 0.001 AND ABS(rVelMmS) < 0.001 AND nTargetCounts = 0' }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 2 · Modul 2
  {
    id: 'motion-2-hardware-mapp',
    level: 2,
    kind: 'lektion',
    title: 'B&R-Antriebshardware und mapp Motion in AS6',
    summary: 'Du kennst ACOPOS P3, ACOPOSmotor und ACOPOSmicro, legst eine Achse im Physical View an und schaltest sie mit MpAxisBasic ein.',
    minutes: 180,
    req: ['motion-2-grundlagen'],
    briefing: 'B&R bietet für jede Leistungsklasse einen Antrieb: den kompakten Servoverstärker ACOPOS P3 (bis zu drei Achsen in einem Gerät), den motorintegrierten ACOPOSmotor für dezentrale Maschinenmodule und ACOPOSmicro bzw. Schrittmotormodule für kleine Leistungen. In Automation Studio 6 werden alle über mapp Motion angesprochen: Die Hardware hängt im Physical View am POWERLINK-Strang, die hardwareunabhängigen Achseinstellungen liegen in einer Achs-Konfigurationsdatei (.axis) im mapp-Motion-Paket der Configuration View. Im Programm greifst du über eine Achsreferenz und Funktionsbausteine wie MpAxisBasic darauf zu.',
    practice: 'Beim Umbau einer Maschine von ACOPOSmulti auf ACOPOS P3 bleibt das Anwenderprogramm dank mapp Motion fast unverändert – nur Hardware und Antriebskonfiguration werden getauscht. Diese Trennung musst du kennen, um Projekte wartbar zu halten.',
    transfer: {
      tia: 'Entspricht im TIA Portal dem Paar „Antrieb in der Gerätekonfiguration (z. B. SINAMICS S210)“ + „Technologieobjekt Positionierachse“; programmiert wird mit den PLCopen-nahen MC_-Befehlen.',
      codesys: 'In TwinCAT gibt es die Trennung zwischen I/O-Gerät (EtherCAT-Antrieb) und NC-Achse; in CODESYS SoftMotion zwischen Antriebsgerät und SM_Drive-Achse. Programmiert wird jeweils mit MC_-Bausteinen.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Ordne ACOPOS P3, ACOPOSmotor und ACOPOSmicro ein',
        guide: {
          intro: 'Die Auswahl des Antriebs hängt von Leistung, Achszahl, Einbauort und Sicherheitsanforderungen ab.',
          steps: [
            'Sieh dir das Video zum ACOPOS P3 an und notiere: Ein-, Zwei- und Dreiachsgeräte, hohe Leistungsdichte, optional SafeMOTION.',
            'Sieh dir das Video zum ACOPOSmotor an: Antrieb direkt auf dem Motor, weniger Schaltschrankplatz, Verkabelung im Feld.',
            'Notiere den Einsatzbereich von ACOPOSmicro/Schrittmotormodulen: kleine Leistungen, Formatverstellungen, Nebenachsen.',
            'Lies in der B&R-Hilfe die Seite „Hardware hinzufügen“: Dort steht, für welche Antriebe dasselbe Getting Started gilt (Scalability+).',
            'Entscheide für eine Verpackungsmaschine mit 8 Achsen: zentral im Schaltschrank (ACOPOS P3) oder dezentral (ACOPOSmotor)? Begründe in zwei Sätzen.'
          ],
          done: 'Erledigt, wenn du für jede der drei Gerätefamilien eine typische Anwendung und einen Vorteil nennen kannst.',
          tip: 'Bei dezentralen Antrieben sinkt der Verkabelungsaufwand im Schrank, dafür steigen die Anforderungen an Schutzart und Wärmeabfuhr im Feld.',
          link: helpLink('gsHardware', 'Hardware hinzufügen')
        }
      },
      {
        id: 'o2',
        title: 'Lege eine Achse im Physical View und im mapp-Motion-Paket an',
        guide: {
          intro: 'Das Getting Started „Achse“ der B&R-Hilfe beschreibt die Reihenfolge. Es funktioniert auch in der Simulation (ArSim) ohne echte Hardware.',
          steps: [
            'Lege ein neues AS6-Projekt an und prüfe in der Configuration View, dass mapp Motion im Projekt aktiviert ist (Technologiepakete werden über die Projekt- bzw. Runtime-Versionseinstellungen ausgewählt).',
            'Stelle die Zykluszeit der Taskklasse ein, in der mapp Motion läuft (Standard: Taskklasse #1) – bei POWERLINK ein Vielfaches der Netzwerkzykluszeit.',
            'Ziehe aus der Toolbox eine Achs-Konfigurationsdatei (.axis) per Doppelklick bzw. Drag&Drop in das mapp-Motion-Paket der Configuration View.',
            'Ziehe im Physical View den Antrieb (z. B. ACOPOS P3 und Motor) aus dem Hardwarekatalog an die POWERLINK-Schnittstelle der CPU – oder füge für die Simulation eine rein virtuelle Achse hinzu.',
            'Verknüpfe in der Antriebskonfiguration den Kanal mit dem Achsobjekt aus der .axis-Datei und notiere den Namen der Achsreferenz (z. B. `gAxis01`).'
          ],
          done: 'Erledigt, wenn sich das Projekt ohne Fehler übersetzen lässt und die Achsreferenz `gAxis01` im Programm bekannt ist.',
          tip: 'Halte die Namen konsistent: Achsobjekt in der .axis-Datei, Achsreferenz im Programm und Beschriftung im Schaltplan sollten dieselbe Achse eindeutig benennen.',
          link: helpLink('gsAchse', 'Getting Started Achse')
        }
      },
      {
        id: 'o3',
        title: 'Konfiguriere Skalierung und Grenzwerte in der .axis-Datei',
        guide: {
          intro: 'In der Achs-Konfiguration stehen die hardwareunabhängigen Einstellungen. Sie gelten für jeden Antrieb, der diese Achse bewegt.',
          steps: [
            'Öffne die .axis-Datei per Doppelklick in der Configuration View.',
            'Wähle den Achstyp (linear mit Endlagen oder periodisch/rotativ) und die Messeinheit (z. B. Millimeter).',
            'Trage Getriebe (Input/Output) und den Weg je Abtriebsumdrehung (ReferenceDistance) aus der Mechanik ein.',
            'Setze die Software-Endlagen und die Bewegungsgrenzen (maximale Geschwindigkeit, Beschleunigung) passend zur Mechanik.',
            'Übersetze das Projekt (Build) und kontrolliere das Ausgabefenster auf Warnungen der mapp-Konfiguration.'
          ],
          done: 'Erledigt, wenn die Achse in der Simulation bei einem Befehl „100 mm“ auch 100 mm in mapp Cockpit bzw. im Watch anzeigt.',
          tip: 'Grenzwerte in der Achskonfiguration sind die letzte Bastion gegen Programmfehler. Setze sie immer, auch wenn das Programm eigene Grenzen prüft.',
          link: helpLink('units', 'Messeinheiten und Achsskalierung')
        }
      },
      {
        id: 'o4',
        title: 'Schalte die Achse mit MpAxisBasic ein und referenziere sie',
        guide: {
          intro: 'MpAxisBasic ist der mapp-Baustein für alle Grundfunktionen einer Achse: Einschalten, Referenzieren, Positionieren, Stoppen, Fehler quittieren.',
          steps: [
            'Deklariere in `Main.var` eine Instanz `MpAxisBasic_0 : MpAxisBasic;` und eine Parameterstruktur `AxisPar : MpAxisBasicParType;`.',
            'Setze im Programm `MpAxisBasic_0.MpLink := ADR(gAxis01);`, `Enable := TRUE` und `Parameters := ADR(AxisPar);` und rufe die Instanz zyklisch auf.',
            '`Power` ist pegelgesteuert: Solange TRUE, bleibt der Regler ein. `PowerOn` meldet, dass der Regler tatsächlich eingeschaltet ist.',
            '`Home` startet mit steigender Flanke die Referenzierung; `IsHomed` meldet den Erfolg.',
            'Teste im Watch-Fenster: Power setzen, auf PowerOn warten, Home setzen, IsHomed prüfen.'
          ],
          code: { lang: 'st', text: 'MpAxisBasic_0.MpLink := ADR(gAxis01);\nMpAxisBasic_0.Enable := TRUE;\nMpAxisBasic_0.Parameters := ADR(AxisPar);\nMpAxisBasic_0.Power := diPower;\nMpAxisBasic_0.Home := diHome AND MpAxisBasic_0.PowerOn;\nMpAxisBasic_0();' },
          done: 'Erledigt, wenn die Übung „Erste Achse“ alle Tests besteht.',
          tip: 'Verknüpfe Befehle immer mit dem passenden Status (z. B. Home nur bei PowerOn). Ein Befehl im falschen Zustand führt bei mapp Motion zu einem Fehler.',
          link: helpLink('mpAxisBasic', 'MpAxisBasic')
        }
      }
    ],
    videos: [
      vid('p3', 'Produktvideo von B&R zum ACOPOS P3: Mehrachsgerät, Leistungsdichte, Einsatzgebiete.'),
      vid('acpMotor', 'Zeigt das Konzept des motorintegrierten Antriebs ACOPOSmotor.'),
      vid('mappAxis1', 'Offizielles B&R-Tutorial: eine Einzelachse mit mapp Axis in Automation Studio in Betrieb nehmen.')
    ],
    readings: [
      brHelp('gsAchse', 'Getting Started Achse', 25, 'Schritt-für-Schritt-Anleitung der B&R-Hilfe vom CPU-Timing bis zum Test der Applikation.'),
      brHelp('mpAxisBasic', 'MpAxisBasic', 20, 'Vollständige Schnittstellenbeschreibung aller Ein- und Ausgänge des Bausteins.'),
      community(1679, 'guide-motion-comissioning-for-beginners', 'Guide: Motion Comissioning for Beginners', 'Bertsch, M.', 2023, 30, 'Praxisleitfaden aus der B&R Community: Vorbereitung, Parametrierung und erste Inbetriebnahme einer Achse.')
    ],
    quiz: [
      { type: 'single', q: 'Wo werden die hardwareunabhängigen Achseinstellungen (Skalierung, Endlagen) in AS6 gepflegt?', options: ['Im Physical View am Antrieb', 'In der Achs-Konfigurationsdatei (.axis) im mapp-Motion-Paket der Configuration View', 'In der Variablendeklaration des Programms', 'Im Logger'], correct: 1, explain: 'Die .axis-Datei enthält das Achsobjekt mit den hardwareunabhängigen Einstellungen; die Hardware selbst hängt im Physical View.' },
      { type: 'single', q: 'Welches Verhalten hat der Eingang Power von MpAxisBasic?', options: ['Flankengesteuert: ein Impuls schaltet ein, ein zweiter aus', 'Pegelgesteuert: Regler bleibt ein, solange Power TRUE ist', 'Er startet die Referenzierung', 'Er ist nur in der Simulation wirksam'], correct: 1, explain: 'Power ist laut B&R-Hilfe ein pegelsensitiver Befehl zum Ein- und Ausschalten der Achse.' },
      { type: 'multi', q: 'Welche Geräte können mit mapp Motion als Achse betrieben werden?', options: ['ACOPOS P3', 'ACOPOSmotor', 'X20-Schrittmotormodul', 'Rein virtuelle Achse'], correct: [0, 1, 2, 3], explain: 'Dank Scalability+ funktioniert dasselbe Getting Started mit ACOPOS-Servoverstärkern, ACOPOSmotor, Schrittmotormodulen, virtuellen Achsen u. a.' }
    ],
    exam: [
      { type: 'single', q: 'Warum muss die Zykluszeit der mapp-Motion-Taskklasse ein Vielfaches der POWERLINK-Zykluszeit sein?', options: ['Damit die Visualisierung flüssig läuft', 'Damit Sollwerte und Istwerte synchron mit dem Netzwerkzyklus ausgetauscht werden', 'Weil sonst die Lizenz fehlt', 'Das ist nicht nötig'], correct: 1, explain: 'Die Motion-Abarbeitung muss zum Kommunikationszyklus passen, sonst entstehen Jitter und Kommunikationsfehler.' },
      { type: 'single', q: 'Welcher Vorteil spricht für ACOPOSmotor gegenüber einem Servoverstärker im Schaltschrank?', options: ['Höhere Spitzenleistung', 'Weniger Schaltschrankplatz und Verkabelung bei modularen Maschinen', 'Kein Geber nötig', 'Keine Konfiguration in AS6 nötig'], correct: 1, explain: 'Motorintegrierte Antriebe sparen Platz im Schrank und Motorkabel; sie eignen sich besonders für modulare Maschinen.' },
      { type: 'multi', q: 'Welche Ausgänge von MpAxisBasic brauchst du, um eine Einschalt- und Referenziersequenz sauber zu steuern?', options: ['PowerOn', 'IsHomed', 'Error', 'UpdateDone'], correct: [0, 1, 2], explain: 'PowerOn und IsHomed zeigen den Fortschritt, Error den Abbruch. UpdateDone gehört zum Parameter-Update.' },
      { type: 'single', q: 'Was passiert laut B&R-Hilfe, wenn ein Funktionsbaustein in einem nicht erlaubten Achszustand aufgerufen wird?', options: ['Der Befehl wird gepuffert', 'Es wird ein Fehler gemeldet', 'Die Achse referenziert automatisch', 'Der Befehl wird still ignoriert'], correct: 1, explain: 'Wird ein Baustein in einem nicht erlaubten Zustand aufgerufen, meldet mapp Motion einen Fehler.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Erste Achse: Einschalten und Referenzieren',
        task: [
          'Nimm eine simulierte Achse mit `MpAxisBasic` in Betrieb. Die Instanz `MpAxisBasic_0` und die Parameter sind schon angelegt.',
          '',
          '- Der Schalter `diPower` schaltet den Regler ein und aus (`Power`).',
          '- Der Taster `diHome` startet die Referenzierung – aber **nur, wenn der Regler eingeschaltet ist**. Sonst meldet die Achse einen Fehler.',
          '- Lege `PowerOn`, `IsHomed`, `Error`, `Position` und `Velocity` auf die Ausgänge `doPowerOn`, `doHomed`, `doError`, `rAxisPos`, `rAxisVel`.',
          '',
          '**Simulation:** Der Regler meldet `PowerOn` ca. 100 ms nach `Power`. Referenzieren dauert ca. 200 ms und setzt die Position auf 0 mm. In AS6 käme noch `MpLink := ADR(gAxis01)` dazu.'
        ].join('\n'),
        hints: ['Die Ausgänge des Bausteins liest du nach dem Aufruf, z. B. `MpAxisBasic_0.PowerOn`.', '`Home := diHome AND MpAxisBasic_0.PowerOn;` verhindert den Befehl im falschen Zustand.'],
        cycleMs: 10,
        io: [
          { name: 'diPower', type: 'BOOL', dir: 'in', label: 'Schalter Regler ein', widget: 'switch' },
          { name: 'diHome', type: 'BOOL', dir: 'in', label: 'Taster Referenzieren', widget: 'button' },
          { name: 'doPowerOn', type: 'BOOL', dir: 'out', label: 'Regler ein', widget: 'led' },
          { name: 'doHomed', type: 'BOOL', dir: 'out', label: 'Referenziert', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Achsfehler', widget: 'led' },
          ...ioAxisOut
        ],
        scene: { type: 'axis', bind: { position: 'rAxisPos', min: 0, max: 500, powered: 'doPowerOn', homed: 'doHomed', error: 'doError' } },
        files: { main: FIRST_START, var: FIRST_VAR, typ: '' },
        solution: { main: FIRST_SOL, var: FIRST_VAR, typ: '' },
        tests: [
          { name: 'Regler einschalten', steps: [{ set: { diPower: true } }, { until: 'doPowerOn', maxMs: 500, msg: 'doPowerOn kommt nicht – ist Power mit diPower verbunden und PowerOn auf doPowerOn gelegt?' }] },
          { name: 'Referenzieren nach dem Einschalten', steps: [{ set: { diPower: true } }, { until: 'doPowerOn', maxMs: 500 }, { set: { diHome: true } }, { cycles: 2 }, { set: { diHome: false } }, { until: 'doHomed', maxMs: 1000, msg: 'Achse wird nicht referenziert.' }, { expect: 'ABS(rAxisPos) < 0.01', msg: 'Nach dem Referenzieren muss rAxisPos = 0 mm sein.' }] },
          { name: 'Referenzieren ohne Regler erzeugt keinen Fehler', steps: [{ set: { diHome: true } }, { never: 'doError', ms: 500, msg: 'Home ohne PowerOn führt zum Achsfehler – Befehl verriegeln.' }, { expect: 'NOT doHomed' }] },
          { name: 'Regler ausschalten', steps: [{ set: { diPower: true } }, { until: 'doPowerOn', maxMs: 500 }, { set: { diPower: false } }, { until: 'NOT doPowerOn', maxMs: 50, msg: 'Regler muss beim Ausschalten sofort aus sein.' }] }
        ]
      }
    ]
  },

  // ───────────────────────────────────────────── Level 2 · Modul 3 (Projekt)
  {
    id: 'motion-2-mpaxisbasic',
    level: 2,
    kind: 'projekt',
    title: 'Praxisprojekt: Einzelachse mit Rezeptpositionen',
    summary: 'Du baust eine vollständige Einschalt-, Referenzier- und Positioniersequenz mit MpAxisBasic und ergänzt eine saubere Fehlerreaktion mit Quittierung.',
    minutes: 240,
    req: ['motion-2-hardware-mapp'],
    briefing: 'Eine Einzelachse – etwa eine Formatverstellung oder ein Hubtisch – fährt im Betrieb wiederkehrende Positionen aus einem Rezept an. Dazu braucht das Programm eine Schrittkette: einschalten, referenzieren, bereit melden, positionieren, auf „In Position“ warten. Zusätzlich muss jeder Achsfehler erkannt, angezeigt und nach Quittierung sauber behoben werden. In diesem Praxisprojekt setzt du das mit MpAxisBasic um und dokumentierst dein Ergebnis im Git-Repository.',
    practice: 'Fast jede Maschine hat solche „Nebenachsen“ (Formatverstellung, Anschlag, Hubtisch). Ein robust programmierter Ablauf mit klarer Fehlerreaktion spart bei der Inbetriebnahme und im Service viele Stunden.',
    transfer: {
      tia: 'Im TIA Portal würdest du MC_Power, MC_Home und MC_MoveAbsolute an einem Technologieobjekt einzeln aufrufen; einen Sammelbaustein wie MpAxisBasic gibt es dort nicht (oft wird er als eigener FB nachgebaut).',
      codesys: 'In CODESYS/TwinCAT werden ebenfalls MC_-Bausteine kombiniert; Hersteller-Bibliotheken (z. B. Tc2_MC2) bieten Hilfsbausteine. Die Schrittkette ist identisch.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Entwirf die Schrittkette der Achse',
        guide: {
          intro: 'Bevor du programmierst, legst du die Zustände und Übergänge fest.',
          steps: [
            'Zeichne die Zustände: AUS → EINSCHALTEN → REFERENZIEREN → BEREIT ⇄ POSITIONIEREN, dazu FEHLER.',
            'Schreibe an jeden Übergang die Bedingung (z. B. EINSCHALTEN → REFERENZIEREN wenn `PowerOn` und nicht `IsHomed`).',
            'Lege fest, welche Befehle in welchem Zustand TRUE sind (Power, Home, MoveAbsolute).',
            'Definiere die Zustände als Enumeration in `Types.typ`, z. B. `eSeqState : (SEQ_OFF := 0, SEQ_POWER := 10, …);`.'
          ],
          done: 'Erledigt, wenn dein Zustandsdiagramm alle Zustände, Übergänge und Ausgänge enthält und ein Kollege es ohne Erklärung versteht.',
          tip: 'Nummeriere Zustände in Zehnerschritten. So kannst du später Zwischenzustände einfügen, ohne alles umzunummerieren.'
        }
      },
      {
        id: 'o2',
        title: 'Positioniere auf Rezeptpositionen mit MoveAbsolute',
        guide: {
          intro: 'MoveAbsolute startet mit steigender Flanke eine Fahrt auf `Parameters.Position`. InPosition meldet das Erreichen.',
          steps: [
            'Lege die Rezeptpositionen als Array an: `aRecipePos : ARRAY[0..2] OF LREAL := [50.0, 250.0, 400.0];`.',
            'Prüfe die Rezeptnummer auf den gültigen Bereich, bevor du auf das Array zugreifst.',
            'Schreibe `AxisPar.Position` und setze danach `MoveAbsolute := TRUE`.',
            'Warte im Zustand POSITIONIEREN auf `InPosition`, setze dann `MoveAbsolute := FALSE`, damit die nächste Fahrt wieder eine Flanke erzeugt.'
          ],
          code: { lang: 'st', text: 'IF rtGo.Q AND diRecipe >= 0 AND diRecipe <= 2 THEN\n\tAxisPar.Position := aRecipePos[diRecipe];\n\tMpAxisBasic_0.MoveAbsolute := TRUE;\n\teState := SEQ_MOVE;\nEND_IF' },
          done: 'Erledigt, wenn die Übung „Einschalt- und Referenziersequenz“ alle Tests besteht.',
          tip: 'Ein Array-Zugriff außerhalb der Grenzen führt auf dem Target zu einer Seitenfehler-Exception. Bereichsprüfung ist Pflicht.',
          link: helpLink('mpAxisBasic', 'MpAxisBasic')
        }
      },
      {
        id: 'o3',
        title: 'Reagiere auf Achsfehler und quittiere sie',
        guide: {
          intro: 'Achsfehler (z. B. ungültige Parameter, Schleppfehler, Antriebsfehler) müssen in jedem Zustand erkannt werden.',
          steps: [
            'Prüfe vor der Schrittkette: `IF MpAxisBasic_0.Error THEN eState := SEQ_ERROR; END_IF`.',
            'Im Fehlerzustand nimmst du alle Bewegungsbefehle weg und schaltest den Regler aus.',
            'Mit steigender Flanke des Quittiertasters setzt du `ErrorReset := TRUE`. Ist `Error` wieder FALSE, setzt du `ErrorReset := FALSE` und gehst zurück nach EINSCHALTEN.',
            'Lies den Fehler im Betrieb über `StatusID` bzw. den Logger von AS6 aus (Logger-Fenster im Online-Betrieb) und notiere die Ursache.'
          ],
          done: 'Erledigt, wenn die Übung „Fehlerreaktion und Quittierung“ alle Tests besteht.',
          tip: 'Quittiere niemals automatisch in einer Schleife. Ein Fehler, der sofort wieder kommt, braucht eine Ursachenanalyse und keinen Dauer-Reset.'
        }
      },
      {
        id: 'o4',
        title: 'Lege das Projekt als Nachweis im Repository ab',
        guide: {
          intro: 'Dein Ausbilder bestätigt das Praxisprojekt anhand deines Repositorys.',
          steps: [
            'Lege auf git.breitner.de ein Repository `motion-einzelachse` an und übertrage dein AS6-Projekt (ohne Temp/ und Binaries/).',
            'Füge eine kurze README mit Zustandsdiagramm (Bild oder Text) und Testprotokoll hinzu.',
            'Committe mit aussagekräftigen Messages, z. B. `feat: Fehlerreaktion und Quittierung`.',
            'Reiche den Link zum Repository als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist und das Projekt in der Simulation läuft.',
          tip: 'Ein kurzer Trace-Screenshot (Position, PowerOn, InPosition) in der README zeigt mehr als drei Absätze Text.'
        }
      }
    ],
    videos: [
      vid('mappAxis1', 'Offizielles B&R-Tutorial zur Einzelachse – Grundlage für dieses Projekt.'),
      vid('autoKidMpAxis', 'Zeigt Schritt für Schritt, wie ein MpAxisBasic-Programm in AS aufgebaut wird.'),
      vid('mappAxisFw', 'B&R-Tutorial zum mapp Axis Framework: wie Achsfunktionen strukturiert in eine Applikation eingebunden werden.')
    ],
    readings: [
      brHelp('mpAxisBasic', 'MpAxisBasic', 20, 'Referenz für Befehle (Power, Home, MoveAbsolute, Stop, ErrorReset) und Statusausgänge.'),
      brHelp('achse', 'Achse', 10, 'Erklärt die Rolle der Achse im mapp-Konzept und die vorbereitenden Aktionen Einschalten und Referenzieren.'),
      community(11099, 'release-2026-new-motion-online-course-for-automation-studio-6', 'RELEASE 2026: New motion online course for Automation Studio 6', 'Kovar, J.', 2026, 10, 'Beschreibt den aktuellen B&R-Lehrgang zu mapp Motion in AS6 (Komponenten, Inbetriebnahme, Autotuning, Diagnose, MpAxis) – zur Orientierung, wie B&R das Thema aufbaut.')
    ],
    quiz: [
      { type: 'single', q: 'Warum wird MoveAbsolute nach Erreichen der Position wieder auf FALSE gesetzt?', options: ['Sonst bleibt die Achse stromlos', 'Damit die nächste Fahrt wieder eine steigende Flanke erzeugt', 'Damit IsHomed zurückgesetzt wird', 'Das ist nicht nötig'], correct: 1, explain: 'Bewegungsbefehle von MpAxisBasic starten mit steigender Flanke. Ohne Rücksetzen gibt es keine neue Flanke.' },
      { type: 'single', q: 'Wo sollte die Fehlerabfrage in einer Schrittkette stehen?', options: ['Nur im Zustand POSITIONIEREN', 'Vor bzw. außerhalb der CASE-Anweisung, damit sie in jedem Zustand wirkt', 'Im _INIT-Teil', 'In der Visualisierung'], correct: 1, explain: 'Ein Fehler kann in jedem Zustand auftreten; die Abfrage muss deshalb zustandsübergreifend wirken.' },
      { type: 'multi', q: 'Welche Maßnahmen gehören zu einer sauberen Fehlerreaktion?', options: ['Bewegungsbefehle wegnehmen', 'Fehler anzeigen', 'Quittierung nur durch Bedienerhandlung (Flanke)', 'ErrorReset dauerhaft auf TRUE lassen'], correct: [0, 1, 2], explain: 'Ein dauerhaftes ErrorReset verdeckt Fehler. Quittiert wird bewusst mit einer Flanke.' }
    ],
    exam: [
      { type: 'single', q: 'Eine Achse soll nach Automatik-Aus und erneutem Einschalten nicht neu referenzieren, wenn sie schon referenziert ist. Welche Abfrage ist richtig?', options: ['Immer Home auslösen', 'Nach PowerOn: IF IsHomed THEN bereit ELSE referenzieren', 'Home nur bei Error auslösen', 'IsHomed ignorieren'], correct: 1, explain: 'IsHomed bleibt erhalten, solange die Achse referenziert ist. Erst wenn sie es nicht ist, wird referenziert.' },
      { type: 'numeric', q: 'Eine Achse fährt {s} mm mit v = 200 mm/s und a = d = 1000 mm/s² (Trapezprofil). Wie lange dauert die Fahrt?', params: { s: [100, 400, 50] }, formula: 's / 200 + 200 / 1000', unit: 's', tol: 0.02, explain: 'Beschleunigen und Bremsen dauern je v/a = 0,2 s und kosten zusammen v²/a = 40 mm. t = s/v + v/a (gilt, wenn s ≥ v²/a).' },
      { type: 'single', q: 'Was zeigt der Ausgang InPosition von MpAxisBasic an?', options: ['Die Achse ist referenziert', 'Die Achse hat die gewünschte Position erreicht', 'Die Achse steht im Stillstand nach Stop', 'Der Regler ist eingeschaltet'], correct: 1, explain: 'InPosition: Achse hat gewünschte Position erreicht.' },
      { type: 'single', q: 'Ein Bediener wählt Rezept 7, es gibt aber nur 0–2. Was ist die richtige Reaktion des Programms?', options: ['aRecipePos[7] lesen', 'Befehl ignorieren bzw. Meldung ausgeben, ohne auf das Array zuzugreifen', 'Achse auf 0 fahren', 'Fehler der Achse auslösen'], correct: 1, explain: 'Ungültige Eingaben werden vor dem Zugriff abgefangen; ein Array-Zugriff außerhalb der Grenzen ist ein Programmfehler.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Einschalt- und Referenziersequenz mit Rezeptpositionen',
        task: [
          'Programmiere die Schrittkette einer Formatverstellachse mit `MpAxisBasic`. Zustände und Instanzen sind vorbereitet.',
          '',
          '1. Ist `diAuto` TRUE, wird der Regler eingeschaltet. Nach `PowerOn` wird referenziert – **nur wenn die Achse noch nicht referenziert ist**.',
          '2. Danach ist die Achse bereit (`doReady`, Zustand `SEQ_READY`).',
          '3. Eine steigende Flanke an `diGo` fährt auf die Rezeptposition `aRecipePos[diRecipe]` (50 / 250 / 400 mm). Ungültige Rezeptnummern (außerhalb 0–2) werden ignoriert.',
          '4. Nach `InPosition` ist die Achse wieder bereit; die nächste Fahrt muss ohne Neustart funktionieren.',
          '5. Wird `diAuto` FALSE, wird aus jedem Zustand abgeschaltet (Regler aus, alle Befehle FALSE).',
          '',
          '**Simulation:** PowerOn nach ca. 100 ms, Referenzieren ca. 200 ms (Position danach 0 mm). Fahrten mit Trapezprofil (v = 200 mm/s, a = d = 1000 mm/s²). `InPosition` wird gesetzt, wenn die Zielposition exakt erreicht ist, und mit der nächsten Fahrt zurückgesetzt.'
        ].join('\n'),
        hints: ['Nutze `rtGo.Q` (R_TRIG) für die Flanke von diGo.', 'Setze im Zustand SEQ_MOVE `MoveAbsolute := FALSE`, sobald `InPosition` TRUE ist.', 'Die Abschaltung bei `NOT diAuto` gehört vor die CASE-Anweisung.'],
        cycleMs: 10,
        io: SEQ_IO,
        scene: AXIS_SCENE('doPowerOn'),
        files: { main: SEQ_START, var: SEQ_VAR, typ: SEQ_TYP },
        solution: { main: SEQ_SOL, var: SEQ_VAR, typ: SEQ_TYP },
        tests: [
          { name: 'Automatik schaltet ein und referenziert', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000, msg: 'Achse wird nicht bereit (Einschalten → Referenzieren → Bereit).' }, { expect: 'doPowerOn AND ABS(rAxisPos) < 0.01' }] },
          { name: 'Rezept 1 anfahren', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, ...goTo(1), { until: 'doInPos AND ABS(rAxisPos - 250.0) < 0.01', maxMs: 4000, msg: 'Rezeptposition 250 mm wird nicht erreicht.' }, { cycles: 2 }, { expect: 'doReady', msg: 'Nach InPosition muss die Achse wieder bereit sein.' }] },
          { name: 'Zwei Fahrten nacheinander', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, ...goTo(2), { until: 'doInPos AND ABS(rAxisPos - 400.0) < 0.01', maxMs: 4000 }, { cycles: 2 }, ...goTo(0), { until: 'doInPos AND ABS(rAxisPos - 50.0) < 0.01', maxMs: 4000, msg: 'Zweite Fahrt startet nicht – wird MoveAbsolute nach InPosition zurückgesetzt?' }] },
          { name: 'Ohne Automatik keine Bewegung', steps: [...goTo(1), { never: 'doError OR ABS(rAxisVel) > 0.0', ms: 1000, msg: 'Ohne Automatik darf weder gefahren noch ein Fehler erzeugt werden.' }] },
          { name: 'Ungültige Rezeptnummer wird ignoriert', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, ...goTo(7), { never: 'doError OR ABS(rAxisVel) > 0.0', ms: 1000, msg: 'Rezept 7 gibt es nicht – Befehl ignorieren, nicht aufs Array zugreifen.' }, { expect: 'doReady' }] },
          { name: 'Automatik aus schaltet ab', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, ...goTo(2), { ms: 300 }, { set: { diAuto: false } }, { until: 'NOT doPowerOn AND NOT doReady', maxMs: 100, msg: 'Automatik aus muss aus jedem Zustand sofort abschalten.' }] }
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'erweitern',
        title: 'Fehlerreaktion und Quittierung',
        task: [
          'Die Sequenz aus der vorigen Übung ist vorgegeben. Neu: Der Bediener gibt die Geschwindigkeit `rVelSet` vor. Ein Wert ≤ 0 ist ein ungültiger Parameter – mapp Motion meldet dann beim Start der Fahrt einen Fehler. Genau diesen Fall nutzt du, um die Fehlerreaktion zu testen (die Plausibilisierung der Eingabe folgt in einem späteren Modul).',
          '',
          'Ergänze:',
          '1. Ein Achsfehler (`MpAxisBasic_0.Error`) führt aus jedem Zustand (außer `SEQ_OFF`) in den Zustand `SEQ_ERROR`.',
          '2. In `SEQ_ERROR` sind alle Befehle FALSE und der Regler wird ausgeschaltet (`Power := FALSE`). `doReady` ist FALSE.',
          '3. Eine **steigende Flanke** an `diAck` setzt `ErrorReset`. Sobald `Error` FALSE ist, wird `ErrorReset` zurückgenommen und die Achse wieder eingeschaltet. Ist sie noch referenziert, ist sie danach direkt bereit.',
          '4. `diAck` ohne anstehenden Fehler hat keine Wirkung.'
        ].join('\n'),
        hints: ['Der Zustand `SEQ_ERROR` ist in `Types.typ` schon definiert.', 'Die Fehlerabfrage gehört vor die CASE-Anweisung, aber nach der Abfrage von diAuto.', 'Nutze die vorbereitete Instanz `rtAck` für die Flanke.'],
        cycleMs: 10,
        io: [...SEQ_IO.slice(0, 3),
          { name: 'rVelSet', type: 'REAL', dir: 'in', label: 'Sollgeschwindigkeit', widget: 'slider', min: 0, max: 400, unit: 'mm/s', init: 200 },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Taster Quittieren', widget: 'button' },
          ...SEQ_IO.slice(3)],
        scene: AXIS_SCENE('doPowerOn'),
        files: { main: ERR_START, var: SEQ_VAR, typ: SEQ_TYP },
        solution: { main: ERR_SOL, var: SEQ_VAR, typ: SEQ_TYP },
        tests: [
          { name: 'Normale Fahrt funktioniert weiterhin', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, ...goTo(1), { until: 'doInPos AND ABS(rAxisPos - 250.0) < 0.01', maxMs: 4000 }] },
          { name: 'Ungültige Geschwindigkeit → Fehlerzustand', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, { set: { rVelSet: 0.0 } }, ...goTo(1), { until: 'doError', maxMs: 300 }, { until: 'NOT doPowerOn AND NOT doReady', maxMs: 300, msg: 'Im Fehlerzustand muss der Regler aus und die Achse nicht bereit sein.' }] },
          { name: 'Quittieren macht die Achse wieder bereit', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, { set: { rVelSet: 0.0 } }, ...goTo(1), { until: 'doError', maxMs: 300 }, { ms: 200 }, { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { until: 'doReady AND NOT doError', maxMs: 1000, msg: 'Nach dem Quittieren muss die Achse wieder einschalten und bereit sein.' }] },
          { name: 'Nach dem Quittieren wieder positionieren', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, { set: { rVelSet: 0.0 } }, ...goTo(1), { until: 'doError', maxMs: 300 }, { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { until: 'doReady', maxMs: 1000 }, { set: { rVelSet: 150.0 } }, ...goTo(2), { until: 'doInPos AND ABS(rAxisPos - 400.0) < 0.01', maxMs: 5000 }] },
          { name: 'Quittieren ohne Fehler ist wirkungslos', steps: [{ set: { diAuto: true } }, { until: 'doReady', maxMs: 2000 }, { set: { diAck: true } }, { cycles: 2 }, { set: { diAck: false } }, { never: 'doError OR NOT doReady', ms: 500 }] }
        ]
      }
    ],
    proof: true,
    badge: 'Einzelachs-Inbetriebnahme'
  }
];
