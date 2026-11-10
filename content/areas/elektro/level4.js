'use strict';
// Bereich elektro – Level 4 (Engineer → Prüfung Master)
const { vid, rd, HINWEIS } = require('./refs');

const IMD_VAR = 'VAR\n\tbWarnCond : BOOL;\n\tbAlarmCond : BOOL;\n\tfbWarn : TON;\n\tfbAlarm : TON;\n\tfbAlarmEdge : R_TRIG;\n\tbHorn : BOOL;\nEND_VAR\n';

const ZS_VAR = 'VAR\n\taChar : ARRAY[1..7] OF INT;   (* 1 = B, 2 = C, 3 = D, sonst unbekannt *)\n\taIn : ARRAY[1..7] OF REAL;    (* Bemessungsstrom in A *)\n\taZs : ARRAY[1..7] OF REAL;    (* gemessene Schleifenimpedanz in Ohm *)\n\taIa : ARRAY[1..7] OF REAL;    (* Abschaltstrom in A *)\n\taZsMax : ARRAY[1..7] OF REAL;\n\taOk : ARRAY[1..7] OF BOOL;\n\ti : INT;\n\trK : REAL;\nEND_VAR\n';
const ZS_INIT = `PROGRAM _INIT
	// Prüfprotokoll (Messwerte der Erstprüfung)
	aChar[1] := 1; aIn[1] := 16.0; aZs[1] := 1.2;
	aChar[2] := 2; aIn[2] := 16.0; aZs[2] := 1.6;
	aChar[3] := 1; aIn[3] := 10.0; aZs[3] := 3.5;
	aChar[4] := 2; aIn[4] := 32.0; aZs[4] := 0.65;
	aChar[5] := 3; aIn[5] := 10.0; aZs[5] := 0.9;
	aChar[6] := 1; aIn[6] := 20.0; aZs[6] := 2.4;
	aChar[7] := 0; aIn[7] := 16.0; aZs[7] := 0.5;
END_PROGRAM
`;

const FU_TYP = 'TYPE\n\teFuState : (FU_READY, FU_PAUSE, FU_RESET, FU_CHECK, FU_LOCKOUT);\nEND_TYPE\n';
const FU_VAR = 'VAR\n\trCurrent : REAL;\n\trLevelPct : REAL;\n\tbDemand : BOOL;\n\teFu : eFuState;\n\teFuLast : eFuState;\n\tbNewState : BOOL;\n\tfbStep : TON;\n\tfbReady : TON;\n\tfbFeedback : TON;\n\tnResetCount : INT;\nEND_VAR\n';

const EMV_VAR = 'VAR\n\tfbOn : TON;\n\tfbOff : TON;\n\taBuf : ARRAY[0..7] OF INT;\n\tnIdx : INT;\n\tnLastAccepted : INT;\n\tnSample : INT;\n\tnSpikeCount : INT;\n\tdSum : DINT;\n\ti : INT;\nEND_VAR\n';

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'elektro-4-netze-schutz',
    level: 4,
    kind: 'lektion',
    title: 'Netzsysteme und Schutzmaßnahmen',
    summary: 'TN-S, TN-C-S, TT und IT, Schutzleiter und Potentialausgleich, automatische Abschaltung, Überstromschutz, RCD-Typen und Isolationsüberwachung.',
    minutes: 240,
    req: ['elektro-3-projekt-motorabgang'],
    briefing: 'Ob ein Körperschluss zur Abschaltung führt, zu einer gefährlichen Berührungsspannung oder nur zu einer Meldung, hängt vom Netzsystem ab. Du lernst die Netzsysteme nach DIN VDE 0100-100, den Fehlerschutz durch automatische Abschaltung (DIN VDE 0100-410), die Auswahl von Leitungsschutzschaltern und Schmelzsicherungen und die richtige RCD für Maschinen mit Frequenzumrichter. Im IT-System arbeitest du mit Isolationsüberwachung – und programmierst ihre Auswertung. ' + HINWEIS,
    practice: 'Eine Maschine wird in einem Werk mit TN-C-S-System aufgestellt, eine zweite in einem Krankenhaus-nahen Bereich mit IT-System. Beim ersten Erdschluss schaltet die eine ab, die andere meldet nur – dein Programm muss beide Fälle sinnvoll behandeln.',
    transfer: {
      tia: 'Die Schutztechnik ist herstellerunabhängig. Siemens-Komponenten (z. B. 5SV RCD Typ B) und B&R-Steuerungen werden in allen Netzsystemen eingesetzt; die Meldungen der Schutzgeräte wertest du über Hilfskontakte aus.',
      codesys: 'Auch bei Beckhoff/CODESYS werden Isolationswächter über Relaiskontakte oder Analogausgänge eingelesen; die Auswertung programmierst du wie hier.'
    },
    objectives: [
      {
        id: 'o1', title: 'Unterscheide die Netzsysteme',
        guide: {
          intro: 'Der erste Buchstabe beschreibt die Erdung der Stromquelle, der zweite die Erdung der Körper, weitere Buchstaben die Leiterführung.',
          steps: [
            'TN: Sternpunkt geerdet, Körper über Schutzleiter mit dem Sternpunkt verbunden.',
            'TN-S: getrennter N und PE im ganzen System; TN-C: PEN-Leiter; TN-C-S: erst PEN, ab Aufteilungspunkt getrennt (Aufteilung nur einmal, danach nie wieder verbinden).',
            'TT: Sternpunkt geerdet, Körper über eigenen Anlagenerder geerdet – Abschaltung meist nur mit RCD möglich.',
            'IT: Quelle isoliert oder hochohmig geerdet; der erste Fehler führt nicht zur Abschaltung, muss aber durch eine Isolationsüberwachung gemeldet werden.',
            'Bestimme in deinem Betrieb das Netzsystem am Hausanschluss bzw. an der Unterverteilung.'
          ],
          done: 'Erledigt, wenn du für TN-S, TN-C-S, TT und IT den Fehlerstromweg bei einem Körperschluss skizzieren kannst.',
          tip: 'Für EMV ist TN-S günstig: Im TN-C fließen Betriebsströme über Schirme und Gehäuse.'
        }
      },
      {
        id: 'o2', title: 'Prüfe die Abschaltbedingung im TN-System',
        guide: {
          intro: 'Bei einem Körperschluss muss die Schutzeinrichtung innerhalb der vorgeschriebenen Zeit abschalten: Z_s · I_a ≤ U_0.',
          steps: [
            'Abschaltzeiten (Orientierung, DIN VDE 0100-410): TN, 230 V, Endstromkreise bis 63 A (Steckdosen) bzw. 32 A: 0,4 s; Verteilerstromkreise: 5 s.',
            'Leitungsschutzschalter: Magnetauslöser sicher bei 5 · I_n (B), 10 · I_n (C), 20 · I_n (D).',
            'Damit gilt z. B. für B16: I_a = 80 A, Z_s,max = 230 V / 80 A ≈ 2,88 Ω.',
            'Schmelzsicherungen: I_a aus der Zeit-Strom-Kennlinie für die geforderte Abschaltzeit.',
            'Gemessene Werte werden in der Praxis häufig mit einem Sicherheitsfaktor (z. B. 2/3 wegen Leitererwärmung) bewertet – halte dich an die Vorgaben deines Prüfverfahrens.'
          ],
          code: { lang: 'text', text: 'Z_s,max = U_0 / I_a = 230 V / (10 · 16 A) = 1,44 Ω   (C16)' },
          done: 'Erledigt, wenn du für B-, C- und D-Charakteristik die maximal zulässige Schleifenimpedanz berechnen kannst.',
          tip: 'Lange Leitungen mit C- oder D-Automaten erfüllen die Abschaltbedingung oft nicht – dann helfen größere Querschnitte, B-Charakteristik oder eine RCD.'
        }
      },
      {
        id: 'o3', title: 'Wähle Überstrom- und Fehlerstromschutz',
        guide: {
          intro: 'Überstromschutz schützt Leitungen bei Überlast und Kurzschluss, RCDs erkennen Fehlerströme gegen Erde.',
          steps: [
            'Leitungsschutz: I_b ≤ I_n ≤ I_z und I_2 ≤ 1,45 · I_z.',
            'RCD-Typen: AC (nur sinusförmig – in Maschinen ungeeignet), A (zusätzlich pulsierende DC), F (Mischfrequenzen), B (zusätzlich glatte DC – nötig bei dreiphasigen Frequenzumrichtern).',
            'I_Δn = 30 mA als zusätzlicher Schutz bei direktem Berühren (z. B. Steckdosenstromkreise).',
            'Frequenzumrichter verursachen Ableitströme durch Filter und Motorkabelkapazität – Fehlauslösungen vermeidest du mit passender RCD (Typ B, ggf. höherer I_Δn wo zulässig) und kurzen Motorkabeln.',
            'Lies den Beitrag zu RCDs in der Industrie und notiere, welche RCD-Typen für einen 3-Phasen-Umrichter in Frage kommen.'
          ],
          done: 'Erledigt, wenn du für einen Maschinenabgang mit Frequenzumrichter Überstromschutz und RCD-Typ begründet auswählen kannst.',
          tip: 'Eine RCD Typ A vor einem Drehstrom-Umrichter kann durch glatte Gleichfehlerströme „erblinden“ – das ist ein Sicherheitsproblem, kein Komfortproblem.',
          link: { label: 'Grünebast: RCDs in der Industrie (Leseprobe)', url: 'https://content.voltimum.com/de/127379/gold-beitrag-jan21.pdf' }
        }
      },
      {
        id: 'o4', title: 'Werte eine Isolationsüberwachung im IT-System aus',
        guide: {
          intro: 'Isolationsüberwachungsgeräte (IMD) messen den Isolationswiderstand des ungeerdeten Netzes und melden Vorwarnung und Alarm.',
          steps: [
            'Das IMD liefert Relaiskontakte (Vorwarnung, Alarm) und oft einen Analogwert des Isolationswiderstands.',
            'Der erste Fehler wird gemeldet, der Betrieb läuft weiter; der Fehler muss zeitnah gesucht und behoben werden.',
            'Ein zweiter Fehler in einem anderen Außenleiter führt zum Kurzschluss → Abschaltung durch Überstromschutz.',
            'Programmiere Ansprechverzögerung und Hysterese, damit kurze Schwankungen keine Meldeflut erzeugen.',
            'Löse die Übung und prüfe Vorwarnung, Alarm, Hupe und Hysterese.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung „Isolationsüberwachung im IT-System“ bestehen.',
          tip: 'Auch die 24-V-Steuerspannung kann ungeerdet (SELV) mit eigener Isolationsüberwachung betrieben werden – dann gelten dieselben Prinzipien.'
        }
      }
    ],
    videos: [
      vid('netze', 'Alle Netzsysteme im Vergleich.'),
      vid('rcd', 'Funktion und Aufbau des Fehlerstromschutzschalters.'),
      vid('ls', 'Auslösecharakteristik B, C und D von Leitungsschutzschaltern.')
    ],
    readings: [
      rd('gruenebast', 'Fachbeitrag zu RCD-Typen und ihrem Einsatz in Industrieanlagen mit Umrichtern.'),
      rd('dguv203050', 'DGUV-Kommentar zur Unfallverhütungsvorschrift „Elektrische Anlagen und Betriebsmittel“.'),
      rd('bgetemNachschlagen', 'Begriffe Schutzleiter, Potentialausgleich, Netzsysteme kompakt nachschlagen.')
    ],
    quiz: [
      { type: 'numeric', q: 'Ein Stromkreis ist mit einem Leitungsschutzschalter C{In} abgesichert (I_a = 10 · I_n), U_0 = 230 V. Wie groß darf die Schleifenimpedanz höchstens sein?',
        params: { In: [6, 32, 2] }, formula: '230 / (10 * In)', unit: 'Ω', tol: 0.01,
        explain: 'Z_s ≤ U_0 / I_a.' },
      { type: 'single', q: 'In welchem Netzsystem führt der erste Körperschluss planmäßig nicht zur Abschaltung?',
        options: ['TN-S', 'TN-C-S', 'TT', 'IT'], correct: 3, explain: 'Im IT-System fließt beim ersten Fehler nur ein kleiner kapazitiver Strom; er wird gemeldet.' },
      { type: 'single', q: 'Welcher RCD-Typ ist vor einem dreiphasigen Frequenzumrichter in der Regel erforderlich?',
        options: ['Typ AC', 'Typ A', 'Typ F', 'Typ B'], correct: 3, explain: 'Dreiphasige Umrichter können glatte Gleichfehlerströme erzeugen, die nur Typ B sicher erfasst.' }
    ],
    exam: [
      { type: 'numeric', q: 'Im TT-System soll eine RCD mit I_Δn = {I} mA die Abschaltung übernehmen. Die Berührungsspannung darf 50 V nicht überschreiten. Wie groß darf der Erdungswiderstand höchstens sein?',
        params: { I: [30, 500, 10] }, formula: '50 / (I / 1000)', unit: 'Ω', tol: 0.01,
        explain: 'R_A · I_Δn ≤ 50 V.' },
      { type: 'single', q: 'Was ist im TN-C-S-System nach dem Aufteilungspunkt verboten?',
        options: ['N und PE wieder zu verbinden', 'Einen RCD einzubauen', 'Einen Potentialausgleich herzustellen', 'Einen Schutzleiter grün-gelb zu kennzeichnen'], correct: 0,
        explain: 'Nach der Aufteilung dürfen N und PE nicht mehr verbunden werden, sonst fließt Betriebsstrom über den PE.' },
      { type: 'multi', q: 'Welche Bedingungen muss der Leitungsschutz bei Überlast erfüllen?',
        options: ['I_b ≤ I_n', 'I_n ≤ I_z', 'I_2 ≤ 1,45 · I_z', 'I_n ≥ 2 · I_z'], correct: [0, 1, 2],
        explain: 'Betriebsstrom ≤ Nennstrom ≤ zulässiger Leiterstrom; großer Prüfstrom ≤ 1,45 · I_z.' },
      { type: 'numeric', q: 'Eine Leitung (Cu, κ = 56) mit {A} mm² und einfacher Länge {l} m bildet zusammen mit dem Netz (Z_Netz = 0,3 Ω) die Fehlerschleife über L und PE (gleicher Querschnitt). Wie groß ist Z_s näherungsweise (nur ohmsch)?',
        params: { A: [1.5, 4, 2.5], l: [10, 60, 5] }, formula: '0.3 + 2 * l / (56 * A)', unit: 'Ω', tol: 0.02,
        explain: 'Z_s ≈ Z_Netz + R_L + R_PE = Z_Netz + 2 · l / (κ · A).' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Isolationsüberwachung im IT-System',
        task: 'Ein Isolationsüberwachungsgerät liefert den Isolationswiderstand `rRiso` (kΩ) eines IT-Systems. Zusätzlich meldet das 24-V-Netzteil `diDcOk`.\n\n' +
          '**Anforderungen:**\n' +
          '1. Vorwarnung: Bedingung aktiv bei rRiso < 300 kΩ, inaktiv erst bei rRiso > 330 kΩ (Hysterese). `doWarn` nach **1 s** aktiver Bedingung.\n' +
          '2. Alarm: Bedingung aktiv bei rRiso < 100 kΩ, inaktiv erst bei rRiso > 110 kΩ. `doAlarm` nach **1 s**.\n' +
          '3. Mit dem Kommen des Alarms wird `doHupe` gesetzt; `diQuit` schaltet die Hupe ab, `doAlarm` bleibt, solange die Bedingung besteht.\n' +
          '4. Im IT-System wird beim ersten Fehler **nicht** abgeschaltet – es gibt deshalb keinen Abschaltausgang.\n' +
          '5. `doNetzteilFehler` = NOT diDcOk.',
        hints: ['Hysterese: IF r < 300.0 THEN bWarnCond := TRUE; ELSIF r > 330.0 THEN bWarnCond := FALSE; END_IF', 'R_TRIG auf doAlarm setzt die Hupe.'],
        cycleMs: 10,
        io: [
          { name: 'rRiso', type: 'REAL', dir: 'in', label: 'Isolationswiderstand', widget: 'slider', min: 0, max: 2000, unit: 'kΩ', init: 1000 },
          { name: 'diDcOk', type: 'BOOL', dir: 'in', label: '-TB1 DC OK', widget: 'switch', init: true },
          { name: 'diQuit', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'doWarn', type: 'BOOL', dir: 'out', label: 'Vorwarnung Isolation', widget: 'led' },
          { name: 'doAlarm', type: 'BOOL', dir: 'out', label: 'Alarm Isolation', widget: 'led' },
          { name: 'doHupe', type: 'BOOL', dir: 'out', label: 'Hupe', widget: 'led' },
          { name: 'doNetzteilFehler', type: 'BOOL', dir: 'out', label: 'Netzteilfehler', widget: 'led' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Verzögerung, Hysterese, Hupe\n\tdoWarn := rRiso < 300.0;\n\tdoAlarm := rRiso < 100.0;\n\tdoHupe := doAlarm;\nEND_PROGRAM\n',
          var: IMD_VAR,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	bHorn := FALSE;
END_PROGRAM

PROGRAM _CYCLIC
	IF rRiso < 300.0 THEN
		bWarnCond := TRUE;
	ELSIF rRiso > 330.0 THEN
		bWarnCond := FALSE;
	END_IF
	IF rRiso < 100.0 THEN
		bAlarmCond := TRUE;
	ELSIF rRiso > 110.0 THEN
		bAlarmCond := FALSE;
	END_IF

	fbWarn(IN := bWarnCond, PT := T#1s);
	fbAlarm(IN := bAlarmCond, PT := T#1s);
	doWarn := fbWarn.Q;
	doAlarm := fbAlarm.Q;

	fbAlarmEdge(CLK := doAlarm);
	IF fbAlarmEdge.Q THEN
		bHorn := TRUE;
	END_IF
	IF diQuit THEN
		bHorn := FALSE;
	END_IF
	doHupe := bHorn;

	doNetzteilFehler := NOT diDcOk;
END_PROGRAM
`,
          var: IMD_VAR,
          typ: ''
        },
        tests: [
          { name: 'Guter Isolationswert: keine Meldung', steps: [
            { set: { rRiso: 500.0 } }, { ms: 2000 },
            { expect: 'NOT doWarn AND NOT doAlarm AND NOT doHupe' }
          ]},
          { name: 'Vorwarnung mit 1 s Verzögerung', steps: [
            { set: { rRiso: 250.0 } }, { ms: 500 },
            { expect: 'NOT doWarn', msg: 'Die Vorwarnung darf erst nach 1 s kommen.' },
            { until: 'doWarn', maxMs: 700, msg: 'Nach 1 s unter 300 kΩ muss die Vorwarnung kommen.' },
            { expect: 'NOT doAlarm' }
          ]},
          { name: 'Alarm, Hupe und Quittierung', steps: [
            { set: { rRiso: 80.0 } },
            { until: 'doAlarm', maxMs: 1300, msg: 'Unter 100 kΩ muss nach 1 s Alarm kommen.' },
            { expect: 'doHupe', msg: 'Mit dem Alarm muss die Hupe kommen.' },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } }, { cycles: 2 },
            { expect: 'NOT doHupe AND doAlarm', msg: 'Quittieren schaltet nur die Hupe ab, der Alarm bleibt.' }
          ]},
          { name: 'Hysterese beim Alarm', steps: [
            { set: { rRiso: 80.0 } }, { until: 'doAlarm', maxMs: 1300 },
            { set: { rRiso: 105.0 } }, { ms: 1500 },
            { expect: 'doAlarm', msg: '105 kΩ liegt in der Hysterese – der Alarm muss bleiben.' },
            { set: { rRiso: 115.0 } }, { cycles: 2 },
            { expect: 'NOT doAlarm AND doWarn', msg: 'Über 110 kΩ geht der Alarm, die Vorwarnung bleibt (unter 300 kΩ).' }
          ]},
          { name: 'Netzteilfehler', steps: [
            { set: { diDcOk: false } }, { cycles: 2 },
            { expect: 'doNetzteilFehler' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-4-messtechnik-pruefung',
    level: 4,
    kind: 'lektion',
    title: 'Messtechnik und Prüfungen nach DIN VDE 0100-600 und DIN EN 60204-1',
    summary: 'Multimeter und Messkategorien, Strommessung, Isolations- und Schleifenimpedanzmessung, Erstprüfung von Anlagen und Prüfung der elektrischen Ausrüstung von Maschinen.',
    minutes: 270,
    req: ['elektro-4-netze-schutz'],
    briefing: 'Bevor eine Maschine in Betrieb geht, wird nachgewiesen, dass die Schutzmaßnahmen wirken. Du lernst sichere Messtechnik (Messkategorien CAT II–IV, Spannungs- und Strommessung, Stromzange), die Prüfschritte der Erstprüfung nach DIN VDE 0100-600 (Besichtigen, Erproben, Messen) und die Prüfungen der elektrischen Ausrüstung von Maschinen nach DIN EN 60204-1 (Durchgängigkeit des Schutzleitersystems, Schleifenimpedanz, Isolationswiderstand, Spannungsprüfung, Restspannung, Funktionsprüfung). In der Übung wertest du ein Prüfprotokoll automatisiert aus. ' + HINWEIS,
    practice: 'Bei der Abnahme einer Maschine legst du das Prüfprotokoll vor: Schutzleiterwiderstände, Isolationswerte und Schleifenimpedanzen je Stromkreis. Ein einziger Stromkreis mit zu hoher Z_s verhindert die Freigabe.',
    transfer: {
      tia: 'Prüfungen sind herstellerunabhängig. Das Ergebnis dokumentierst du z. B. in EPLAN oder im Prüfgeräte-Report; die SPS kann Prüfdaten nur ergänzend auswerten.',
      codesys: 'Auch bei CODESYS-Maschinen gilt: Die Prüfung nach DIN EN 60204-1 erfolgt mit Prüfgeräten an der spannungsfreien bzw. spannungsführenden Anlage, nicht per Software.'
    },
    objectives: [
      {
        id: 'o1', title: 'Miss sicher mit Multimeter und Stromzange',
        guide: {
          intro: 'Falsche Messbereiche und ungeeignete Messgeräte verursachen Lichtbögen und Unfälle.',
          steps: [
            'Prüfe Messkategorie und Bemessungsspannung des Messgeräts und der Messleitungen (z. B. CAT III 600 V für Unterverteilungen).',
            'Spannung: parallel messen, Messbereich und AC/DC wählen; True RMS bei Umrichtern.',
            'Strom: in Reihe messen (Kreis auftrennen) – im Schaltschrank besser Stromzange (AC/DC-Zange für 24 V DC).',
            'Widerstand und Durchgang nur im spannungsfreien Zustand.',
            'Messe den Strom einer 24-V-Ventilspule mit einer DC-Stromzange und vergleiche ihn mit dem Datenblattwert.'
          ],
          done: 'Erledigt, wenn du für fünf Messaufgaben Messgerät, Messkategorie und Anschlussart richtig benennen kannst.',
          tip: 'Lasse die Messleitung nie im Strommessbuchse stecken, wenn du anschließend Spannung misst – das ist ein Kurzschluss über das Messgerät.'
        }
      },
      {
        id: 'o2', title: 'Führe die Erstprüfung nach DIN VDE 0100-600 durch',
        guide: {
          intro: 'Die Erstprüfung besteht aus Besichtigen, Erproben und Messen sowie der Dokumentation.',
          steps: [
            'Besichtigen: richtige Auswahl und Kennzeichnung der Betriebsmittel, Schutz gegen direktes Berühren, Schutzleiteranschlüsse.',
            'Messen (typische Reihenfolge): Durchgängigkeit der Schutzleiter und des Potentialausgleichs, Isolationswiderstand, Schleifenimpedanz bzw. Abschaltbedingung, RCD-Prüfung (Auslösestrom, Auslösezeit), Drehfeld.',
            'Isolationswiderstand (Orientierung): Stromkreise bis 500 V mit 500 V DC Prüfspannung, Mindestwert 1 MΩ; SELV/PELV mit 250 V DC, Mindestwert 0,5 MΩ.',
            'Erproben: Funktion von RCD-Prüftaste, Schaltgeräten, Not-Halt.',
            'Dokumentiere alle Messwerte im Prüfprotokoll und lies die IHK-Orientierungshilfe als Beispiel für einen Prüfablauf.'
          ],
          done: 'Erledigt, wenn du ein vollständiges Prüfprotokoll für einen Stromkreis ausfüllen und die Grenzwerte begründen kannst.',
          tip: 'Vor der Isolationsmessung empfindliche Betriebsmittel (Netzteile, Umrichter, SPS) abklemmen oder überbrücken – sonst misst du Unsinn oder beschädigst Geräte.',
          link: { label: 'Voltimum: Grenzwerte Erstprüfung', url: 'https://content.voltimum.com/de/125891/grenzwerte_erstpruefung_fuer_die_elektrische_anlage.pdf' }
        }
      },
      {
        id: 'o3', title: 'Prüfe die elektrische Ausrüstung nach DIN EN 60204-1',
        guide: {
          intro: 'Kapitel 18 der DIN EN 60204-1 beschreibt die Prüfungen der elektrischen Ausrüstung von Maschinen.',
          steps: [
            'Überprüfung, ob die Ausrüstung mit der technischen Dokumentation übereinstimmt.',
            'Durchgängigkeit des Schutzleitersystems (Prüfstrom typischerweise 0,2 A bis 10 A).',
            'Schleifenimpedanz und Überstromschutz: Bedingungen für automatische Abschaltung.',
            'Isolationswiderstand: 500 V DC zwischen Hauptstromkreisen und Schutzleitersystem, Mindestwert 1 MΩ (Orientierung). Spannungsprüfung und Schutz gegen Restspannung (z. B. ≤ 60 V nach 5 s) nach Vorgabe.',
            'Funktionsprüfungen, insbesondere der Sicherheitsfunktionen und Not-Halt, mit Dokumentation.'
          ],
          done: 'Erledigt, wenn du die Prüfschritte nach DIN EN 60204-1 für eine Maschine in einer Checkliste zusammenstellen kannst.',
          tip: 'Nach jeder Änderung an der elektrischen Ausrüstung müssen die betroffenen Prüfungen wiederholt werden – auch nach einem „kleinen“ Umbau.'
        }
      },
      {
        id: 'o4', title: 'Werte ein Schleifenimpedanz-Protokoll automatisch aus',
        guide: {
          intro: 'Du bewertest Messwerte mehrerer Stromkreise in einer FOR-Schleife.',
          steps: [
            'Lege Arrays für Charakteristik, Nennstrom und Messwert an (im Startcode vorgegeben).',
            'Berechne je Stromkreis I_a aus der Charakteristik und Z_s,max = U_0 / I_a.',
            'Unbekannte Charakteristik gilt als „nicht bewertbar“ und damit als nicht bestanden.',
            'Zähle die nicht bestandenen Stromkreise und merke dir den ersten.',
            'Lass die Tests laufen.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung „Prüfprotokoll Schleifenimpedanz auswerten“ bestehen.',
          tip: 'Software ersetzt keine Prüfung – sie hilft nur, Protokolle konsistent zu bewerten.'
        }
      }
    ],
    videos: [
      vid('multimeter', 'Multimeter-Crashkurs: Messbereiche und sichere Bedienung.'),
      vid('iso', 'Isolationswiderstand praktisch messen.'),
      vid('m60204', 'Prüfung von Maschinen nach EN 60204-1 und Prüfprotokoll.')
    ],
    readings: [
      rd('voltGrenzwerte', 'Prüfreihenfolge und Grenzwerte der Erstprüfung kompakt.'),
      rd('ihkOrientierung', 'Beispiel eines Prüfablaufs nach DIN VDE 0100-600 aus der IHK-Prüfungspraxis.'),
      rd('bgetemS108', 'Checkliste der BG ETEM zu Arbeiten an elektrischen Anlagen und Prüfungen.')
    ],
    quiz: [
      { type: 'single', q: 'Mit welcher Prüfspannung wird der Isolationswiderstand eines 230/400-V-Stromkreises bei der Erstprüfung typischerweise gemessen?',
        options: ['50 V DC', '250 V DC', '500 V DC', '1000 V AC'], correct: 2, explain: 'Stromkreise bis 500 V: 500 V DC, Mindestwert 1 MΩ.' },
      { type: 'numeric', q: 'Die Schleifenimpedanz eines Stromkreises mit B{In} wird gemessen. Wie groß ist Z_s,max bei U_0 = 230 V (I_a = 5 · I_n)?',
        params: { In: [6, 32, 2] }, formula: '230 / (5 * In)', unit: 'Ω', tol: 0.01, explain: 'Z_s,max = U_0 / (5 · I_n).' },
      { type: 'single', q: 'Wie wird ein Amperemeter angeschlossen?',
        options: ['Parallel zum Verbraucher', 'In Reihe zum Verbraucher', 'Zwischen L und PE', 'Beliebig'], correct: 1,
        explain: 'Der zu messende Strom muss durch das Messgerät fließen.' }
    ],
    exam: [
      { type: 'numeric', q: 'Bei der Isolationsmessung mit 500 V DC fließt ein Strom von {I} µA. Wie groß ist der Isolationswiderstand?',
        params: { I: [1, 400, 1] }, formula: '500 / (I / 1e6) / 1e6', unit: 'MΩ', tol: 0.01, explain: 'R = U / I.' },
      { type: 'numeric', q: 'Der Schutzleiter einer Maschine (Cu, {A} mm²) hat vom PE-Anschlusspunkt bis zum Motor die Länge {l} m. Welchen Widerstand erwartest du bei der Durchgängigkeitsprüfung (κ = 56)?',
        params: { A: [1.5, 16, 2.5], l: [5, 50, 5] }, formula: 'l / (56 * A) * 1000', unit: 'mΩ', tol: 0.02, explain: 'R = l / (κ · A), umgerechnet in mΩ.' },
      { type: 'multi', q: 'Welche Prüfungen gehören zur Prüfung der elektrischen Ausrüstung von Maschinen nach DIN EN 60204-1?',
        options: ['Durchgängigkeit des Schutzleitersystems', 'Isolationswiderstandsprüfung', 'Funktionsprüfung', 'Prüfung der SPS-Zykluszeit'], correct: [0, 1, 2],
        explain: 'Die Zykluszeit ist eine Software-Eigenschaft, keine Prüfung nach Kapitel 18.' },
      { type: 'single', q: 'Warum werden Frequenzumrichter und Netzteile vor der Isolationsmessung abgeklemmt?',
        options: ['Weil sie sonst ausgeschaltet werden', 'Weil die Prüfspannung die Elektronik schädigen oder das Messergebnis verfälschen kann', 'Weil die Norm Elektronik verbietet', 'Weil sie keinen Schutzleiter haben'], correct: 1,
        explain: 'Interne Filter und Varistoren liegen zwischen Leitern und PE.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Prüfprotokoll Schleifenimpedanz auswerten',
        task: 'Im `_INIT` stehen die Messwerte von sieben Stromkreisen (Charakteristik, Nennstrom, gemessene Schleifenimpedanz). Werte sie im `_CYCLIC` aus.\n\n' +
          '**Anforderungen:**\n' +
          '1. Abschaltstrom `aIa[i]` = k · aIn[i] mit k = 5 (B, Code 1), 10 (C, Code 2), 20 (D, Code 3).\n' +
          '2. `aZsMax[i]` = rU0 / aIa[i]; `aOk[i]` = aZs[i] ≤ aZsMax[i].\n' +
          '3. Unbekannte Charakteristik (anderer Code): aIa[i] = 0, aZsMax[i] = 0, aOk[i] = FALSE (nicht bewertbar).\n' +
          '4. `nFailed` = Anzahl nicht bestandener Stromkreise, `nFirstFail` = Nummer des ersten (0, wenn alle bestanden), `bAllOk` = (nFailed = 0).\n' +
          '5. Ist `rU0` ≤ 0: `bInputError` = TRUE, `bAllOk` = FALSE, alle aOk = FALSE, nFailed = 7.\n\n' +
          'Hinweis: Viele Prüfverfahren bewerten den Messwert mit einem Korrekturfaktor (z. B. 2/3) – in dieser Übung ohne Faktor.',
        hints: ['FOR i := 1 TO 7 DO … END_FOR', 'CASE aChar[i] OF 1: rK := 5.0; 2: rK := 10.0; 3: rK := 20.0; ELSE rK := 0.0; END_CASE'],
        cycleMs: 10,
        io: [
          { name: 'rU0', type: 'REAL', dir: 'in', label: 'Nennspannung gegen Erde U0', widget: 'slider', min: 0, max: 400, unit: 'V', init: 230 },
          { name: 'nFailed', type: 'INT', dir: 'out', label: 'Nicht bestanden', widget: 'value' },
          { name: 'nFirstFail', type: 'INT', dir: 'out', label: 'Erster Fehler (Stromkreis)', widget: 'value' },
          { name: 'bAllOk', type: 'BOOL', dir: 'out', label: 'Alle bestanden', widget: 'led' },
          { name: 'bInputError', type: 'BOOL', dir: 'out', label: 'Eingabefehler', widget: 'led' }
        ],
        files: {
          main: ZS_INIT + '\nPROGRAM _CYCLIC\n\t// TODO: Stromkreise bewerten\n\tnFailed := 0;\n\tnFirstFail := 0;\n\tbAllOk := TRUE;\nEND_PROGRAM\n',
          var: ZS_VAR,
          typ: ''
        },
        solution: {
          main: ZS_INIT + `
PROGRAM _CYCLIC
	bInputError := rU0 <= 0.0;
	nFailed := 0;
	nFirstFail := 0;

	FOR i := 1 TO 7 DO
		CASE aChar[i] OF
			1: rK := 5.0;
			2: rK := 10.0;
			3: rK := 20.0;
		ELSE
			rK := 0.0;
		END_CASE
		aIa[i] := rK * aIn[i];
		IF (aIa[i] > 0.0) AND NOT bInputError THEN
			aZsMax[i] := rU0 / aIa[i];
			aOk[i] := aZs[i] <= aZsMax[i];
		ELSE
			aZsMax[i] := 0.0;
			aOk[i] := FALSE;
		END_IF
		IF NOT aOk[i] THEN
			nFailed := nFailed + 1;
			IF nFirstFail = 0 THEN
				nFirstFail := i;
			END_IF
		END_IF
	END_FOR

	bAllOk := (nFailed = 0) AND NOT bInputError;
END_PROGRAM
`,
          var: ZS_VAR,
          typ: ''
        },
        tests: [
          { name: 'Auswertung bei U0 = 230 V', steps: [
            { set: { rU0: 230.0 } }, { cycles: 2 },
            { expect: 'ABS(aZsMax[1] - 2.875) < 0.001', msg: 'B16: Z_s,max = 230 / 80 = 2,875 Ω.' },
            { expect: 'aOk[1] AND NOT aOk[2] AND aOk[3] AND aOk[4] AND aOk[5]', msg: 'Stromkreis 2 (C16, 1,6 Ω > 1,44 Ω) fällt durch, 1/3/4/5 bestehen.' },
            { expect: 'NOT aOk[6]', msg: 'B20: 2,4 Ω > 2,3 Ω – nicht bestanden.' },
            { expect: 'NOT aOk[7] AND aZsMax[7] = 0.0', msg: 'Unbekannte Charakteristik ist nicht bewertbar.' },
            { expect: 'nFailed = 3 AND nFirstFail = 2 AND NOT bAllOk' }
          ]},
          { name: 'Höhere Spannung verschiebt die Grenze', steps: [
            { set: { rU0: 250.0 } }, { cycles: 2 },
            { expect: 'aOk[6]', msg: 'Bei 250 V: Z_s,max(B20) = 2,5 Ω ≥ 2,4 Ω.' },
            { expect: 'nFailed = 2 AND nFirstFail = 2' }
          ]},
          { name: 'Ungültige Spannung', steps: [
            { set: { rU0: 0.0 } }, { cycles: 2 },
            { expect: 'bInputError AND NOT bAllOk AND nFailed = 7', msg: 'U0 = 0 → alles nicht bewertbar.' },
            { expect: 'NOT aOk[1]' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-4-projekt-fu-pumpe',
    level: 4,
    kind: 'projekt',
    title: 'Praxisprojekt: Pumpenstation mit Frequenzumrichter',
    summary: 'Frequenzumrichter-Grundlagen (Gleichrichter, Zwischenkreis, Wechselrichter, U/f) und eine vollständige Pumpensteuerung mit 4–20-mA-Füllstand, Sollwertvorgabe, Rückmeldeüberwachung und automatischer Fehlerquittierung.',
    minutes: 420,
    req: ['elektro-4-messtechnik-pruefung'],
    briefing: 'Frequenzumrichter (FU) stellen Drehzahl und Drehmoment von Asynchronmotoren stufenlos ein. Du lernst den Aufbau (Gleichrichter, Zwischenkreis, IGBT-Wechselrichter mit PWM), die U/f-Kennlinie und Eckfrequenz, Rampen, Brems-Chopper und die Sicherheitsfunktion STO als Begriff. Im Projekt baust du eine Pumpenstation: Füllstand über 4–20 mA mit Drahtbrucherkennung, Zweipunkt-Anforderung mit drehzahlvariabler Pumpe, Sollwert als Analogausgang, Rückmeldeüberwachung und ein begrenzter automatischer Reset bei FU-Störungen mit Verriegelung nach drei Versuchen. ' + HINWEIS,
    practice: 'Pumpen, Lüfter und Förderbänder laufen fast immer am FU. Bei der Inbetriebnahme parametrierst du Motordaten vom Typenschild, Rampen und Grenzfrequenzen und prüfst, ob die SPS Freigabe, Sollwert und Störungsrückmeldung richtig verarbeitet.',
    transfer: {
      tia: 'Bei Siemens SINAMICS steuerst du über Steuerwort/Zustandswort (PROFIdrive) oder Klemmen; B&R ACOPOSinverter werden über POWERLINK oder Klemmen angesteuert – die Logik Freigabe/Sollwert/Störung/Reset ist dieselbe.',
      codesys: 'In CODESYS/TwinCAT nutzt du für Umrichter über Feldbus häufig PLCopen-Bausteine oder Herstellerbibliotheken; bei Klemmensteuerung programmierst du wie hier.'
    },
    objectives: [
      {
        id: 'o1', title: 'Erkläre Aufbau und Funktion eines Frequenzumrichters',
        guide: {
          intro: 'Ein Spannungszwischenkreis-Umrichter wandelt Netz-AC in DC und mit Pulsweitenmodulation zurück in AC variabler Frequenz und Spannung.',
          steps: [
            'Gleichrichter (Diodenbrücke) → Zwischenkreis (Kondensatoren, bei 400 V Netz ≈ 560 V DC) → Wechselrichter (IGBT, PWM mit mehreren kHz).',
            'U/f-Kennlinie: Spannung steigt proportional zur Frequenz bis zur Eckfrequenz (meist 50 Hz) – der Fluss und damit das Moment bleiben konstant.',
            'Oberhalb der Eckfrequenz: Feldschwächung, Moment sinkt.',
            'Bremsen: Energie fließt in den Zwischenkreis zurück → Brems-Chopper mit Bremswiderstand oder rückspeisefähiges Gerät.',
            'STO (Safe Torque Off) verhindert die Drehmomenterzeugung – ein Thema der funktionalen Sicherheit (Bereich Safety).'
          ],
          done: 'Erledigt, wenn du das Blockschaltbild eines FU zeichnen und die U/f-Kennlinie mit Eckfrequenz erklären kannst.',
          tip: 'Der Zwischenkreis bleibt nach dem Abschalten geladen – Wartezeit gemäß Gerät abwarten und Spannungsfreiheit am Zwischenkreis feststellen.'
        }
      },
      {
        id: 'o2', title: 'Plane die Ansteuerung über Klemmen',
        guide: {
          intro: 'Die einfachste Schnittstelle zwischen SPS und FU: Digital-Ein-/Ausgänge und ein Analogsollwert.',
          steps: [
            'SPS → FU: Freigabe/Run, Reset, Sollwert 0–10 V (oder 4–20 mA).',
            'FU → SPS: Bereit, Läuft, Störung (Relaiskontakte oder Digitalausgänge).',
            'Skalierung festlegen: 0–10 V = 0–50 Hz; Mindestfrequenz für Pumpen (Kühlung, Förderhöhe) beachten.',
            'Rückmeldeüberwachung: Freigabe gesetzt, aber keine „Läuft“-Meldung innerhalb einer Zeit → Fehler.',
            'Störungsreset: begrenzte Anzahl automatischer Versuche, danach Verriegelung und Quittierung durch den Bediener.'
          ],
          done: 'Erledigt, wenn du eine Signaltabelle SPS ↔ FU mit Richtung, Pegel und Bedeutung erstellt hast.',
          tip: 'Automatische Resets nur, wenn die Risikobeurteilung das zulässt – bei Anlagen mit Personengefährdung nie ohne Bedienerquittierung.'
        }
      },
      {
        id: 'o3', title: 'Programmiere die Pumpenstation',
        guide: {
          intro: 'Du kombinierst Analogauswertung, Zweipunktlogik, Sollwertberechnung und eine Fehler-Zustandsmaschine.',
          steps: [
            'Füllstand aus 4–20 mA berechnen, Drahtbruch erkennen.',
            'Anforderung: Pumpe ein über 70 %, aus unter 30 %.',
            'Sollwert: 25 Hz bei 30 % bis 50 Hz bei 90 % linear, begrenzt auf 20…50 Hz; als INT 0…32767 = 0…50 Hz ausgeben.',
            'Fehler-Zustandsmaschine (Enum eFuState) mit 500-ms-Schritten: Pause → Reset-Impuls → Prüfen; nach drei erfolglosen Resets Verriegelung.',
            'Teste in ARsim und reiche den Projektnachweis ein.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung „Pumpenstation mit FU“ bestehen und dein Nachweis eingereicht ist.',
          tip: 'Merke dir den Zustandswechsel in einem eigenen BOOL (bNewState), um Schrittzeiten sauber neu zu starten.'
        }
      }
    ],
    videos: [
      vid('fu', 'Aufbau und Funktionsweise eines Frequenzumrichters.'),
      vid('uf', 'U/f-Kennlinie und Eckfrequenz.'),
      vid('acopos', 'B&R-Antriebstechnik ACOPOS P3 im Überblick.', 'en')
    ],
    readings: [
      rd('boecker', 'Hochschulskript zu Umrichtern, Pulsweitenmodulation und Drehzahlregelung.'),
      rd('eatonEmv', 'Herstellerhinweise zur Installation von Frequenzumrichtern inkl. Filter und Kabel.'),
      rd('brcP74', 'Praxisbeispiel zur Inbetriebnahme eines B&R ACOPOSinverter P74.')
    ],
    quiz: [
      { type: 'numeric', q: 'Ein FU arbeitet mit linearer U/f-Kennlinie: 400 V bei 50 Hz. Welche Ausgangsspannung stellt er bei {f} Hz ein?',
        params: { f: [5, 50, 5] }, formula: '400 * f / 50', unit: 'V', tol: 0.01, explain: 'U = U_N · f / f_Eck (lineare Kennlinie, ohne Boost).' },
      { type: 'numeric', q: 'Wie hoch ist die Zwischenkreisspannung eines FU am {U}-V-Drehstromnetz näherungsweise (Scheitelwert der Außenleiterspannung)?',
        params: { U: [380, 480, 10] }, formula: 'U * sqrt(2)', unit: 'V', tol: 0.02, explain: 'U_ZK ≈ √2 · U.' },
      { type: 'numeric', q: 'Ein Analogausgang 0…32767 entspricht 0…50 Hz. Welchen Rohwert gibst du für {f} Hz aus?',
        params: { f: [10, 50, 1] }, formula: 'round(f / 50 * 32767)', unit: '', tol: 0.001, explain: 'Rohwert = f / 50 Hz · 32767.' }
    ],
    exam: [
      { type: 'single', q: 'Was geschieht oberhalb der Eckfrequenz eines U/f-gesteuerten Antriebs?',
        options: ['Die Spannung steigt weiter, das Moment bleibt konstant', 'Die Spannung bleibt konstant, das Feld wird geschwächt und das verfügbare Moment sinkt', 'Der Motor bleibt stehen', 'Der FU schaltet in Stern'], correct: 1,
        explain: 'Feldschwächbereich: Spannung am Maximum, Fluss ~ U/f sinkt.' },
      { type: 'multi', q: 'Welche Signale gehören zu einer typischen Klemmenansteuerung eines FU?',
        options: ['Freigabe/Run', 'Sollwert 0–10 V', 'Störungsmeldung', 'Schleifenimpedanz'], correct: [0, 1, 2], explain: 'Die Schleifenimpedanz ist eine Prüfgröße, kein Steuersignal.' },
      { type: 'numeric', q: 'Eine Pumpe am FU fördert proportional zur Drehzahl. Bei 50 Hz fördert sie {Q} m³/h. Wie viel fördert sie bei {f} Hz (Affinitätsgesetz, Förderstrom ~ n)?',
        params: { Q: [10, 100, 5], f: [20, 50, 5] }, formula: 'Q * f / 50', unit: 'm³/h', tol: 0.01, explain: 'Q ~ n ~ f.' },
      { type: 'single', q: 'Wozu dient ein Brems-Chopper mit Bremswiderstand?',
        options: ['Er begrenzt den Anlaufstrom', 'Er wandelt beim generatorischen Bremsen die in den Zwischenkreis zurückgespeiste Energie in Wärme um', 'Er ersetzt die Netzdrossel', 'Er filtert Oberschwingungen'], correct: 1,
        explain: 'Ohne Chopper steigt die Zwischenkreisspannung beim Bremsen bis zur Überspannungsabschaltung.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Pumpenstation mit FU',
        task: 'Eine Ablaufpumpe hält den Füllstand eines Behälters. Die Anlage simuliert Zulauf, Behälter, FU und Füllstandssensor.\n\n' +
          '**Signale:** Füllstand `nLevelRaw` (INT, 0…32767 = 0…20 mA, 4…20 mA = 0…100 %), FU-Rückmeldungen `diFU_Bereit`, `diFU_Laeuft`, `diFU_Stoerung`; Ausgänge `doFU_Freigabe`, `doFU_Reset`, `aoSollwert` (INT 0…32767 = 0…50 Hz).\n\n' +
          '**Anforderungen:**\n' +
          '1. Füllstand `rLevelPct` berechnen (0…100 % begrenzt). `bSensorFault` bei Strom < 3,6 mA oder > 21 mA.\n' +
          '2. Anforderung: ein bei > 70 %, aus bei < 30 %; bei Sensorfehler keine Anforderung.\n' +
          '3. `doFU_Freigabe` = Anforderung UND FU-Zustand bereit (FU_READY) UND `diFU_Bereit` UND kein Rückmeldefehler UND kein Sensorfehler.\n' +
          '4. Sollwert bei Freigabe: `rFreqSet` = 25 + (rLevelPct − 30) / 60 · 25 Hz, begrenzt auf 20…50 Hz; sonst 0. `aoSollwert` = rFreqSet / 50 · 32767.\n' +
          '5. Rückmeldeüberwachung: Freigabe ohne `diFU_Laeuft` länger als 2 s → `bFeedbackError` (bleibt bis `diQuit`).\n' +
          '6. FU-Störung (Zustände in Enum `eFuState`, Schrittzeit je 500 ms): FU_READY → bei Störung FU_PAUSE → FU_RESET (`doFU_Reset` = TRUE, Zähler +1) → FU_CHECK → Störung weg: FU_READY, sonst erneut FU_PAUSE. Hat der Zähler 3 erreicht und die Störung steht in FU_CHECK noch an → FU_LOCKOUT (`bLockout`). Aus FU_LOCKOUT führt `diQuit` zu einem neuen Reset (Zähler zuvor auf 0). Nach 10 s störungsfreiem Betrieb in FU_READY wird der Zähler auf 0 gesetzt.',
        hints: ['fbStep(IN := NOT bNewState, PT := T#500ms) vor dem CASE; nach dem CASE: bNewState := eFu <> eFuLast; eFuLast := eFu;', 'aoSollwert := REAL_TO_INT(rFreqSet / 50.0 * 32767.0);'],
        cycleMs: 10,
        io: [
          { name: 'nLevelRaw', type: 'INT', dir: 'in', label: '-BL1 Füllstand Rohwert', widget: 'value' },
          { name: 'rTankLevel', type: 'REAL', dir: 'in', label: 'Füllstand (Simulation)', widget: 'value', unit: '%' },
          { name: 'diFU_Bereit', type: 'BOOL', dir: 'in', label: '-TA1 FU bereit', widget: 'led' },
          { name: 'diFU_Laeuft', type: 'BOOL', dir: 'in', label: '-TA1 FU läuft', widget: 'led' },
          { name: 'diFU_Stoerung', type: 'BOOL', dir: 'in', label: '-TA1 FU Störung', widget: 'led' },
          { name: 'diQuit', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'rInflow', type: 'REAL', dir: 'in', label: 'Zulauf (Simulation)', widget: 'slider', min: 0, max: 5, unit: '%/s', init: 2 },
          { name: 'bSimFUFehler', type: 'BOOL', dir: 'in', label: 'Simulation: FU-Fehler', widget: 'switch' },
          { name: 'bSimDrahtbruch', type: 'BOOL', dir: 'in', label: 'Simulation: Drahtbruch Sensor', widget: 'switch' },
          { name: 'doFU_Freigabe', type: 'BOOL', dir: 'out', label: 'FU Freigabe', widget: 'led' },
          { name: 'doFU_Reset', type: 'BOOL', dir: 'out', label: 'FU Reset', widget: 'led' },
          { name: 'aoSollwert', type: 'INT', dir: 'out', label: 'Sollwert Rohwert', widget: 'value' },
          { name: 'rFreqSet', type: 'REAL', dir: 'out', label: 'Sollfrequenz', widget: 'gauge', min: 0, max: 50, unit: 'Hz' },
          { name: 'bSensorFault', type: 'BOOL', dir: 'out', label: 'Sensorfehler', widget: 'led' },
          { name: 'bFeedbackError', type: 'BOOL', dir: 'out', label: 'Rückmeldefehler', widget: 'led' },
          { name: 'bLockout', type: 'BOOL', dir: 'out', label: 'FU verriegelt', widget: 'led' }
        ],
        scene: { type: 'tank', bind: { level: 'rTankLevel', outlet: 'diFU_Laeuft' } },
        plant: {
          var: 'VAR\n\trLevel : REAL := 50.0;\n\tbFault : BOOL;\n\trOut : REAL;\nEND_VAR\n',
          code: `IF bSimFUFehler THEN
	bFault := TRUE;
END_IF
IF doFU_Reset AND NOT bSimFUFehler THEN
	bFault := FALSE;
END_IF
diFU_Stoerung := bFault;
diFU_Bereit := NOT bFault;
diFU_Laeuft := doFU_Freigabe AND NOT bFault;
IF diFU_Laeuft THEN
	rOut := INT_TO_REAL(aoSollwert) / 32767.0 * 6.0;
ELSE
	rOut := 0.0;
END_IF
rLevel := LIMIT(0.0, rLevel + (rInflow - rOut) * PLANT_DT, 100.0);
rTankLevel := rLevel;
IF bSimDrahtbruch THEN
	nLevelRaw := 0;
ELSE
	nLevelRaw := REAL_TO_INT((4.0 + rLevel * 0.16) / 20.0 * 32767.0);
END_IF
`
        },
        files: {
          main: 'PROGRAM _INIT\n\teFu := FU_READY;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\trCurrent := INT_TO_REAL(nLevelRaw) * 20.0 / 32767.0;\n\trLevelPct := (rCurrent - 4.0) / 16.0 * 100.0;\n\t// TODO: Anforderung, Sollwert, Rückmeldung, Fehler-Zustandsmaschine\n\tdoFU_Freigabe := rLevelPct > 70.0;\n\trFreqSet := 50.0;\n\taoSollwert := 32767;\nEND_PROGRAM\n',
          var: FU_VAR,
          typ: FU_TYP
        },
        solution: {
          main: `PROGRAM _INIT
	eFu := FU_READY;
	eFuLast := FU_READY;
	nResetCount := 0;
END_PROGRAM

PROGRAM _CYCLIC
	// Füllstand 4…20 mA
	rCurrent := INT_TO_REAL(nLevelRaw) * 20.0 / 32767.0;
	bSensorFault := (rCurrent < 3.6) OR (rCurrent > 21.0);
	rLevelPct := LIMIT(0.0, (rCurrent - 4.0) / 16.0 * 100.0, 100.0);

	// Zweipunkt-Anforderung
	IF rLevelPct > 70.0 THEN
		bDemand := TRUE;
	ELSIF rLevelPct < 30.0 THEN
		bDemand := FALSE;
	END_IF
	IF bSensorFault THEN
		bDemand := FALSE;
	END_IF

	// Fehler-Zustandsmaschine des FU
	fbStep(IN := NOT bNewState, PT := T#500ms);
	CASE eFu OF
		FU_READY:
			IF diFU_Stoerung THEN
				eFu := FU_PAUSE;
			END_IF
		FU_PAUSE:
			IF fbStep.Q THEN
				nResetCount := nResetCount + 1;
				eFu := FU_RESET;
			END_IF
		FU_RESET:
			IF fbStep.Q THEN
				eFu := FU_CHECK;
			END_IF
		FU_CHECK:
			IF fbStep.Q THEN
				IF NOT diFU_Stoerung THEN
					eFu := FU_READY;
				ELSIF nResetCount >= 3 THEN
					eFu := FU_LOCKOUT;
				ELSE
					eFu := FU_PAUSE;
				END_IF
			END_IF
		FU_LOCKOUT:
			IF diQuit THEN
				nResetCount := 1;
				eFu := FU_RESET;
			END_IF
	END_CASE
	bNewState := eFu <> eFuLast;
	eFuLast := eFu;

	fbReady(IN := (eFu = FU_READY) AND NOT diFU_Stoerung, PT := T#10s);
	IF fbReady.Q THEN
		nResetCount := 0;
	END_IF

	// Rückmeldeüberwachung
	fbFeedback(IN := doFU_Freigabe AND NOT diFU_Laeuft, PT := T#2s);
	IF fbFeedback.Q THEN
		bFeedbackError := TRUE;
	END_IF
	IF diQuit THEN
		bFeedbackError := FALSE;
	END_IF

	doFU_Freigabe := bDemand AND (eFu = FU_READY) AND diFU_Bereit AND NOT bFeedbackError AND NOT bSensorFault;
	doFU_Reset := (eFu = FU_RESET);
	bLockout := (eFu = FU_LOCKOUT);

	IF doFU_Freigabe THEN
		rFreqSet := LIMIT(20.0, 25.0 + (rLevelPct - 30.0) / 60.0 * 25.0, 50.0);
	ELSE
		rFreqSet := 0.0;
	END_IF
	aoSollwert := REAL_TO_INT(rFreqSet / 50.0 * 32767.0);
END_PROGRAM
`,
          var: FU_VAR,
          typ: FU_TYP
        },
        tests: [
          { name: 'Pumpe startet über 70 % mit passendem Sollwert', steps: [
            { cycles: 5 },
            { expect: 'NOT doFU_Freigabe', msg: 'Bei 50 % Füllstand darf die Pumpe noch nicht laufen.' },
            { until: 'doFU_Freigabe', maxMs: 15000, msg: 'Über 70 % muss die Pumpe freigegeben werden.' },
            { cycles: 2 },
            { expect: 'ABS(rFreqSet - LIMIT(20.0, 25.0 + (rLevelPct - 30.0) / 60.0 * 25.0, 50.0)) < 0.01', msg: 'Sollfrequenz entspricht nicht der Kennlinie 25 Hz (30 %) … 50 Hz (90 %).' },
            { expect: 'rFreqSet > 40.0 AND rFreqSet < 43.0', msg: 'Bei ≈ 70 % erwartet: ≈ 41,7 Hz.' },
            { expect: 'ABS(INT_TO_REAL(aoSollwert) - rFreqSet / 50.0 * 32767.0) < 2.0', msg: 'aoSollwert muss rFreqSet / 50 · 32767 entsprechen.' }
          ]},
          { name: 'Pumpe stoppt unter 30 %', steps: [
            { until: 'doFU_Freigabe', maxMs: 15000 },
            { until: 'NOT doFU_Freigabe', maxMs: 40000, msg: 'Unter 30 % muss die Pumpe abschalten.' },
            { expect: 'rLevelPct < 31.0 AND rFreqSet = 0.0 AND aoSollwert = 0' }
          ]},
          { name: 'Kurze FU-Störung wird automatisch zurückgesetzt', steps: [
            { until: 'doFU_Freigabe', maxMs: 15000 },
            { set: { bSimFUFehler: true } }, { cycles: 5 }, { set: { bSimFUFehler: false } },
            { expect: 'NOT doFU_Freigabe', msg: 'Bei FU-Störung keine Freigabe.' },
            { until: 'doFU_Reset', maxMs: 1500, msg: 'Nach 500 ms Pause muss ein Reset-Impuls kommen.' },
            { until: 'NOT diFU_Stoerung', maxMs: 1000 },
            { until: 'doFU_Freigabe', maxMs: 2500, msg: 'Nach erfolgreichem Reset muss die Pumpe wieder laufen.' },
            { expect: 'NOT bLockout' }
          ]},
          { name: 'Dauerhafte Störung: drei Versuche, dann Verriegelung', steps: [
            { set: { bSimFUFehler: true } },
            { until: 'bLockout', maxMs: 8000, msg: 'Nach drei erfolglosen Resets muss verriegelt werden.' },
            { expect: 'nResetCount = 3', msg: 'Genau drei automatische Resetversuche erwartet.' },
            { set: { bSimFUFehler: false } }, { ms: 1000 },
            { expect: 'bLockout AND NOT doFU_Reset', msg: 'Ohne Quittierung bleibt die Verriegelung bestehen.' },
            { set: { diQuit: true } }, { cycles: 2 }, { set: { diQuit: false } },
            { until: 'NOT diFU_Stoerung', maxMs: 1500, msg: 'Quittieren muss einen neuen Reset auslösen.' },
            { until: 'NOT bLockout', maxMs: 1500 }
          ]},
          { name: 'Drahtbruch am Füllstandssensor', steps: [
            { until: 'doFU_Freigabe', maxMs: 15000 },
            { set: { bSimDrahtbruch: true } }, { cycles: 3 },
            { expect: 'bSensorFault AND NOT doFU_Freigabe', msg: 'Bei Drahtbruch muss die Pumpe stoppen und ein Sensorfehler gemeldet werden.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Antriebs-Inbetriebnahme'
  },

  // ---------------------------------------------------------------------------
  {
    id: 'elektro-4-zusatz-emv',
    level: 4,
    kind: 'zusatz',
    title: 'Bonus: EMV und Schirmung im Schaltschrank',
    summary: 'Kopplungsarten, Schirmauflage, Potentialausgleich, Kabelführung bei Umrichtern – und Signalfilterung in der SPS als zweite Verteidigungslinie.',
    minutes: 180,
    req: ['elektro-4-projekt-fu-pumpe'],
    briefing: 'Elektromagnetische Verträglichkeit (EMV) entscheidet, ob eine Maschine im Feld zuverlässig läuft: Umrichter mit steilen Schaltflanken koppeln Störungen in Sensorleitungen ein, Schirme ohne großflächige Auflage wirken als Antenne. Du lernst die Kopplungsmechanismen (galvanisch, kapazitiv, induktiv, Strahlung), die richtige Schirmauflage (360°, beidseitig bei Leistungs- und Datenkabeln, Ausnahmen bei Analogsignalen), Trennung von Kabelwegen und den Aufbau eines EMV-gerechten Schaltschranks. Danach programmierst du Filter, die verbleibende Störimpulse unterdrücken – ohne echte Signale zu verschlucken.',
    practice: 'Ein Analogwert springt sporadisch, sobald der Lüfter-FU läuft, ein Zählereingang zählt doppelt: Meist liegt es an fehlender Schirmauflage oder an gemeinsamen Kabelkanälen von Motor- und Signalleitungen. Software-Filter lindern Symptome, beheben aber nicht die Ursache.',
    transfer: {
      tia: 'Siemens-Analogmodule bieten parametrierbare Integrationszeiten/Filter; Digitaleingänge eine Eingangsverzögerung. In der Software ergänzt du Plausibilitätsprüfungen wie hier.',
      codesys: 'Beckhoff-Klemmen haben ebenfalls Filterparameter; Moving-Average-Filter findest du in Bibliotheken oder schreibst sie selbst.'
    },
    objectives: [
      {
        id: 'o1', title: 'Erkenne Kopplungsarten und Störquellen',
        guide: {
          intro: 'Jede EMV-Störung braucht eine Quelle, einen Kopplungsweg und eine Senke.',
          steps: [
            'Galvanische Kopplung: gemeinsame Leiter (z. B. gemeinsamer 0-V-Rückleiter von Leistung und Signal).',
            'Kapazitive Kopplung: schnelle Spannungsänderungen (du/dt am Umrichterausgang) auf parallel verlegte Leitungen.',
            'Induktive Kopplung: Stromänderungen (di/dt) in Leiterschleifen.',
            'Strahlungskopplung: hochfrequente Felder (Funk, Schaltnetzteile).',
            'Liste für deine Maschine drei Störquellen und drei empfindliche Senken auf.'
          ],
          done: 'Erledigt, wenn du für eine konkrete Störung den wahrscheinlichen Kopplungsweg benennen kannst.',
          tip: 'Verdrillte Leitungen reduzieren induktive Kopplung, Schirme vor allem kapazitive und hochfrequente Kopplung.'
        }
      },
      {
        id: 'o2', title: 'Lege Schirme richtig auf',
        guide: {
          intro: 'Ein Schirm wirkt nur, wenn er niederimpedant und großflächig mit dem Bezugspotential verbunden ist.',
          steps: [
            'Motorkabel am FU: Schirm beidseitig, 360° über EMV-Verschraubung oder Schirmklemme auf blanke Montageplatte.',
            'Keine „Pigtails“ (zusammengedrehter Schirm auf Klemme) – sie wirken bei hohen Frequenzen wie eine Spule.',
            'Analoge Signalleitungen: meist beidseitig, bei Potentialausgleichsströmen ggf. einseitig plus Potentialausgleichsleiter (Herstellerangaben beachten).',
            'Getrennte Kabelwege für Leistung und Signal, Kreuzungen im rechten Winkel.',
            'Vergleiche die Empfehlungen in den Herstellerunterlagen (SEW, Siemens) mit deinem Schaltschrank.'
          ],
          done: 'Erledigt, wenn du in einem realen Schaltschrank drei EMV-Mängel finden und begründen kannst.',
          tip: 'Lackierte Montageplatten sind schlechte HF-Masse – Schirmschienen und Geräte auf blanke, verzinkte Flächen montieren.',
          link: { label: 'SEW: EMV in der Antriebstechnik', url: 'https://download.sew-eurodrive.com/download/pdf/11535806.pdf' }
        }
      },
      {
        id: 'o3', title: 'Filtere Signale in der SPS',
        guide: {
          intro: 'Software-Filter sind die zweite Verteidigungslinie: Entprellung für Digitalsignale, Ausreißererkennung und Mittelwert für Analogsignale.',
          steps: [
            'Digital: Signal erst übernehmen, wenn es eine Mindestzeit stabil ansteht (Ein- und Ausschaltverzögerung).',
            'Analog: einzelne Ausreißer verwerfen, wenn der Sprung physikalisch unmöglich ist; echte Sprünge nach mehreren Zyklen akzeptieren.',
            'Gleitender Mittelwert über N Werte glättet Rauschen, verzögert aber das Signal.',
            'Prüfe, ob das Analogmodul schon Hardware-Filter bietet (Modulkonfiguration in AS6).',
            'Löse die Übung und dokumentiere, welche Verzögerung dein Filter erzeugt.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung „Störimpulsfilter“ bestehen.',
          tip: 'Ein Filter, der echte Signale verzögert, kann Sicherheits- oder Prozessfunktionen verschlechtern – Filterzeiten immer bewusst wählen.'
        }
      }
    ],
    videos: [
      vid('emv', 'Schirmung bei Frequenzumrichtern: einseitig oder beidseitig?'),
      vid('fu', 'Wiederholung: Was im Umrichter die Störungen erzeugt.')
    ],
    readings: [
      rd('sewEmv', 'Theorie und Praxis der EMV in der Antriebstechnik.'),
      rd('siemensEmv', 'Installationshinweise für EMV-gerechten Aufbau mit Bildern aus dem Schaltschrank.'),
      rd('zveiEmv', 'Kompakter Pocket-Guide mit Checkliste für Sensorik und Aktorik.')
    ],
    quiz: [
      { type: 'single', q: 'Warum sind „Pigtails“ (verdrillte Schirmenden auf einer Klemme) bei Umrichter-Motorkabeln ungünstig?',
        options: ['Sie sind nicht berührungssicher', 'Sie haben bei hohen Frequenzen eine hohe Impedanz und verschlechtern die Schirmwirkung', 'Sie erhöhen den Spannungsfall', 'Sie sind zu teuer'], correct: 1,
        explain: 'Schirmwirkung braucht eine niederimpedante, großflächige (360°) Verbindung.' },
      { type: 'multi', q: 'Welche Maßnahmen verbessern die EMV in einem Schaltschrank mit Frequenzumrichter?',
        options: ['Getrennte Kabelwege für Motor- und Signalleitungen', 'Schirm des Motorkabels großflächig auf blanke Montageplatte', 'Signal- und Motorleitungen gemeinsam bündeln', 'Netzfilter nah am Umrichter montieren'], correct: [0, 1, 3],
        explain: 'Bündeln koppelt Störungen direkt in Signalleitungen.' },
      { type: 'numeric', q: 'Ein gleitender Mittelwert über {N} Werte wird jeden Zyklus von {t} ms berechnet. Wie lange dauert es, bis ein Sprung vollständig im Mittelwert angekommen ist?',
        params: { N: [4, 32, 4], t: [1, 10, 1] }, formula: 'N * t', unit: 'ms', tol: 0.01, explain: 'Nach N Zyklen sind alle Pufferwerte ersetzt.' }
    ],
    exam: [
      { type: 'single', q: 'Welche Kopplungsart wird durch steile Spannungsflanken (du/dt) eines Umrichters auf parallel verlegte Signalleitungen hauptsächlich verursacht?',
        options: ['Galvanische Kopplung', 'Kapazitive Kopplung', 'Thermische Kopplung', 'Mechanische Kopplung'], correct: 1,
        explain: 'Hohe du/dt treiben Verschiebungsströme über die Kapazität zwischen den Leitungen.' },
      { type: 'single', q: 'Was ist der Hauptnachteil eines langen Software-Filters für einen Analogwert?',
        options: ['Er braucht viel Speicher', 'Er verzögert das Signal und kann Regel- oder Überwachungsfunktionen verschlechtern', 'Er erhöht die Auflösung', 'Er ist nicht in ST programmierbar'], correct: 1,
        explain: 'Filter = Totzeit/Verzögerung.' },
      { type: 'multi', q: 'Welche Aussagen zur Schirmauflage sind richtig?',
        options: ['Großflächige 360°-Kontaktierung ist anzustreben', 'Lackierte Flächen sind gute HF-Masse', 'Bei Potentialausgleichsströmen über den Schirm hilft ein paralleler Potentialausgleichsleiter', 'Schirme dürfen nie geerdet werden'], correct: [0, 2],
        explain: 'Schirme werden geerdet; lackierte Flächen isolieren.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Störimpulsfilter für Digital- und Analogsignal',
        task: 'Ein Sensor in der Nähe eines Umrichters liefert gestörte Signale.\n\n' +
          '**Anforderungen (Zykluszeit 10 ms):**\n' +
          '1. Digital: `bFiltered` wird TRUE, wenn `diRaw` mindestens **20 ms** ununterbrochen TRUE ist, und FALSE, wenn `diRaw` mindestens 20 ms FALSE ist. Kürzere Impulse ändern bFiltered nicht.\n' +
          '2. Analog: Weicht `nRaw` um mehr als 2000 vom zuletzt akzeptierten Wert ab, wird der Wert verworfen (stattdessen der letzte akzeptierte Wert verwendet) und `nRejected` um 1 erhöht – höchstens 3 Zyklen in Folge. Steht die Abweichung länger an, ist es ein echter Sprung und wird akzeptiert.\n' +
          '3. `rFiltered` = gleitender Mittelwert der letzten **8** verwendeten Werte.\n' +
          '4. Im `_INIT` werden Puffer und letzter akzeptierter Wert mit dem aktuellen `nRaw` vorbelegt.',
        hints: ['Zwei TON (Ein- und Ausschaltverzögerung) für das Digitalsignal.', 'Summe in DINT bilden, dann DINT_TO_REAL(dSum) / 8.0.'],
        cycleMs: 10,
        io: [
          { name: 'diRaw', type: 'BOOL', dir: 'in', label: 'Sensor roh', widget: 'switch' },
          { name: 'nRaw', type: 'INT', dir: 'in', label: 'Analog roh', widget: 'slider', min: 0, max: 32767, init: 10000 },
          { name: 'bFiltered', type: 'BOOL', dir: 'out', label: 'Sensor gefiltert', widget: 'led' },
          { name: 'rFiltered', type: 'REAL', dir: 'out', label: 'Analog gefiltert', widget: 'value' },
          { name: 'nRejected', type: 'INT', dir: 'out', label: 'Verworfene Ausreißer', widget: 'value' }
        ],
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t// TODO: Entprellung, Ausreißererkennung, Mittelwert\n\tbFiltered := diRaw;\n\trFiltered := INT_TO_REAL(nRaw);\nEND_PROGRAM\n',
          var: EMV_VAR,
          typ: ''
        },
        solution: {
          main: `PROGRAM _INIT
	nLastAccepted := nRaw;
	FOR i := 0 TO 7 DO
		aBuf[i] := nRaw;
	END_FOR
	nIdx := 0;
	nSpikeCount := 0;
	nRejected := 0;
END_PROGRAM

PROGRAM _CYCLIC
	// Digital: Ein- und Ausschaltverzögerung 20 ms
	fbOn(IN := diRaw, PT := T#20ms);
	fbOff(IN := NOT diRaw, PT := T#20ms);
	IF fbOn.Q THEN
		bFiltered := TRUE;
	ELSIF fbOff.Q THEN
		bFiltered := FALSE;
	END_IF

	// Analog: Ausreißer verwerfen (max. 3 Zyklen in Folge)
	IF (ABS(nRaw - nLastAccepted) > 2000) AND (nSpikeCount < 3) THEN
		nSpikeCount := nSpikeCount + 1;
		nRejected := nRejected + 1;
		nSample := nLastAccepted;
	ELSE
		nSpikeCount := 0;
		nSample := nRaw;
		nLastAccepted := nRaw;
	END_IF

	// Gleitender Mittelwert über 8 Werte
	aBuf[nIdx] := nSample;
	nIdx := (nIdx + 1) MOD 8;
	dSum := 0;
	FOR i := 0 TO 7 DO
		dSum := dSum + aBuf[i];
	END_FOR
	rFiltered := DINT_TO_REAL(dSum) / 8.0;
END_PROGRAM
`,
          var: EMV_VAR,
          typ: ''
        },
        tests: [
          { name: 'Kurzer Störimpuls wird unterdrückt', steps: [
            { cycles: 2 },
            { set: { diRaw: true } }, { cycles: 1 }, { set: { diRaw: false } },
            { never: 'bFiltered', ms: 200, msg: 'Ein 10-ms-Impuls darf bFiltered nicht setzen.' }
          ]},
          { name: 'Stabiles Signal wird übernommen', steps: [
            { set: { diRaw: true } }, { ms: 60 },
            { expect: 'bFiltered', msg: 'Nach > 20 ms stabil TRUE muss bFiltered TRUE sein.' },
            { set: { diRaw: false } }, { cycles: 1 },
            { expect: 'bFiltered', msg: 'Ein kurzes FALSE darf bFiltered nicht sofort zurücksetzen.' },
            { ms: 60 },
            { expect: 'NOT bFiltered', msg: 'Nach > 20 ms stabil FALSE muss bFiltered FALSE sein.' }
          ]},
          { name: 'Analoger Ausreißer wird verworfen', steps: [
            { set: { nRaw: 10000 } }, { ms: 200 },
            { set: { nRaw: 30000 } }, { cycles: 1 }, { set: { nRaw: 10000 } }, { ms: 200 },
            { expect: 'ABS(rFiltered - 10000.0) < 1.0', msg: 'Ein einzelner Ausreißer darf den Mittelwert nicht verändern.' },
            { expect: 'nRejected >= 1', msg: 'Der Ausreißer muss gezählt werden.' }
          ]},
          { name: 'Echter Sprung wird übernommen', steps: [
            { set: { nRaw: 10000 } }, { ms: 200 },
            { set: { nRaw: 20000 } }, { ms: 300 },
            { expect: 'ABS(rFiltered - 20000.0) < 1.0', msg: 'Ein anhaltender Sprung muss nach wenigen Zyklen im Mittelwert ankommen.' }
          ]}
        ]
      }
    ]
  }
];
