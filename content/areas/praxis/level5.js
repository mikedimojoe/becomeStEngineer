'use strict';
const { R, V, pulse, help } = require('./_sources');

// ---------------------------------------------------------------------------
// Level 5 – Master: Architektur-Entscheidungen & Qualitätsmetriken, Standardisierung & Wissenstransfer
// ---------------------------------------------------------------------------

const oeeVar = 'VAR\n\tnPlannedMs : UDINT; (* geplante Produktionszeit *)\n\tnRunMs : UDINT;     (* Laufzeit innerhalb der geplanten Zeit *)\n\tnGood : UDINT;\n\tnBad : UDINT;\n\trAvailability : REAL; (* % *)\n\trPerformance : REAL;  (* % *)\n\trQuality : REAL;      (* % *)\n\trOee : REAL;          (* % *)\n\trtGood : R_TRIG;\n\trtBad : R_TRIG;\nEND_VAR\n\nVAR CONSTANT\n\tCYCLE_MS : UDINT := 100;\n\tIDEAL_CYCLE_MS : UDINT := 1000; (* ideale Taktzeit: 1 Teil pro Sekunde *)\nEND_VAR\n';

const exOee = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Robuste Kennzahlen: OEE ohne Division durch null',
  task: [
    'Für die Qualitätsberichte (Metriken!) braucht die Linie eine **OEE-Berechnung** (Overall Equipment Effectiveness). Die Architektur-Entscheidung ADR-007 legt fest: Kennzahlen werden in der Steuerung berechnet, sind **immer definiert** (kein NaN/Inf) und liegen im Bereich 0–100 %.',
    '',
    '**Erfassung (je Zyklus, `CYCLE_MS` = 100 ms):**',
    '- `nPlannedMs` steigt, solange `diPlanned` (Schicht aktiv) TRUE ist.',
    '- `nRunMs` steigt, solange `diPlanned` **und** `diRunning` TRUE sind.',
    '- `nGood`/`nBad` zählen steigende Flanken von `diPartGood`/`diPartBad` (immer, auch außerhalb der Planzeit).',
    '- `diResetShift` setzt alle Zähler und Kennzahlen auf 0.',
    '',
    '**Kennzahlen (REAL, in %):**',
    '- Verfügbarkeit `rAvailability = nRunMs / nPlannedMs · 100`, bei `nPlannedMs = 0` → 0.',
    '- Leistung `rPerformance = (nGood + nBad) · IDEAL_CYCLE_MS / nRunMs · 100`, bei `nRunMs = 0` → 0, **begrenzt auf 0–100** (`LIMIT`).',
    '- Qualität `rQuality = nGood / (nGood + nBad) · 100`, ohne Teile → 0.',
    '- `rOee = rAvailability · rPerformance · rQuality / 10000`.',
    '',
    'Gib `rOee` zusätzlich auf den Ausgang `rOeeOut` aus.'
  ].join('\n'),
  hints: [
    'Prüfe den Nenner **vor** der Division: `IF nPlannedMs > 0 THEN … ELSE rAvailability := 0.0; END_IF`.',
    'Ganzzahlen in REAL wandeln: `UDINT_TO_REAL(nRunMs)`.',
    '`rPerformance := LIMIT(0.0, rTmp, 100.0);`'
  ],
  cycleMs: 100,
  io: [
    { name: 'diPlanned', type: 'BOOL', dir: 'in', label: 'Schicht aktiv (geplante Produktion)', widget: 'switch' },
    { name: 'diRunning', type: 'BOOL', dir: 'in', label: 'Maschine produziert', widget: 'switch' },
    { name: 'diPartGood', type: 'BOOL', dir: 'in', label: 'Gutteil', widget: 'button' },
    { name: 'diPartBad', type: 'BOOL', dir: 'in', label: 'Schlechtteil', widget: 'button' },
    { name: 'diResetShift', type: 'BOOL', dir: 'in', label: 'Schichtwechsel (Reset)', widget: 'button' },
    { name: 'rOeeOut', type: 'REAL', dir: 'out', label: 'OEE', widget: 'gauge', min: 0, max: 100, unit: '%' }
  ],
  files: {
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* Erste Version eines Kollegen - nicht robust *)\n\tIF diPlanned THEN nPlannedMs := nPlannedMs + CYCLE_MS; END_IF\n\tIF diPlanned AND diRunning THEN nRunMs := nRunMs + CYCLE_MS; END_IF\n\trtGood(CLK := diPartGood);\n\trtBad(CLK := diPartBad);\n\tIF rtGood.Q THEN nGood := nGood + 1; END_IF\n\tIF rtBad.Q THEN nBad := nBad + 1; END_IF\n\n\trAvailability := UDINT_TO_REAL(nRunMs) / UDINT_TO_REAL(nPlannedMs) * 100.0;\n\trPerformance := UDINT_TO_REAL((nGood + nBad) * IDEAL_CYCLE_MS) / UDINT_TO_REAL(nRunMs) * 100.0;\n\trQuality := UDINT_TO_REAL(nGood) / UDINT_TO_REAL(nGood + nBad) * 100.0;\n\trOee := rAvailability * rPerformance * rQuality / 10000.0;\n\trOeeOut := rOee;\nEND_PROGRAM\n',
    var: oeeVar,
    typ: ''
  },
  solution: {
    main: `(* OEE-Berechnung nach ADR-007: Kennzahlen immer definiert und im Bereich 0..100 % *)
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	rtGood(CLK := diPartGood);
	rtBad(CLK := diPartBad);

	IF diResetShift THEN
		nPlannedMs := 0;
		nRunMs := 0;
		nGood := 0;
		nBad := 0;
	ELSE
		IF diPlanned THEN
			nPlannedMs := nPlannedMs + CYCLE_MS;
			IF diRunning THEN
				nRunMs := nRunMs + CYCLE_MS;
			END_IF
		END_IF
		IF rtGood.Q THEN nGood := nGood + 1; END_IF
		IF rtBad.Q THEN nBad := nBad + 1; END_IF
	END_IF

	nTotal := nGood + nBad;

	IF nPlannedMs > 0 THEN
		rAvailability := UDINT_TO_REAL(nRunMs) / UDINT_TO_REAL(nPlannedMs) * 100.0;
	ELSE
		rAvailability := 0.0;
	END_IF

	IF nRunMs > 0 THEN
		rTmp := UDINT_TO_REAL(nTotal) * UDINT_TO_REAL(IDEAL_CYCLE_MS) / UDINT_TO_REAL(nRunMs) * 100.0;
		rPerformance := LIMIT(0.0, rTmp, 100.0);
	ELSE
		rPerformance := 0.0;
	END_IF

	IF nTotal > 0 THEN
		rQuality := UDINT_TO_REAL(nGood) / UDINT_TO_REAL(nTotal) * 100.0;
	ELSE
		rQuality := 0.0;
	END_IF

	rOee := rAvailability * rPerformance * rQuality / 10000.0;
	rOeeOut := rOee;
END_PROGRAM
`,
    var: oeeVar + '\nVAR\n\tnTotal : UDINT;\n\trTmp : REAL;\nEND_VAR\n',
    typ: ''
  },
  tests: [
    { name: 'Startzustand: alle Kennzahlen 0, kein NaN', steps: [
      { cycles: 5 },
      { expect: 'rOee = 0.0 AND rAvailability = 0.0 AND rPerformance = 0.0 AND rQuality = 0.0', msg: 'Ohne Daten müssen alle Kennzahlen 0 sein – Division durch 0 abfangen.' }
    ] },
    { name: 'Verfügbarkeit 50 %', steps: [
      { set: { diPlanned: true, diRunning: true } }, { ms: 2000 }, { set: { diRunning: false } }, { ms: 2000 },
      { expect: 'rAvailability > 45.0 AND rAvailability < 55.0', msg: 'Halbe Laufzeit in der Planzeit ergibt ≈ 50 % Verfügbarkeit.' }
    ] },
    { name: 'Qualität 75 %', steps: [
      ...pulse('diPartGood', 3), ...pulse('diPartBad', 1),
      { expect: 'rQuality > 74.9 AND rQuality < 75.1', msg: '3 Gut- und 1 Schlechtteil ergeben 75 % Qualität.' },
      { expect: 'rOee = 0.0', msg: 'Ohne Planzeit muss die OEE 0 sein.' }
    ] },
    { name: 'Leistung auf 100 % begrenzt', steps: [
      { set: { diPlanned: true, diRunning: true } }, { ms: 2000 }, ...pulse('diPartGood', 4),
      { expect: 'rPerformance = 100.0', msg: 'Mehr Teile als ideal möglich → Leistung auf 100 % begrenzen.' },
      { expect: 'rOee > 99.0 AND rOee <= 100.0', msg: 'A = 100 %, P = 100 %, Q = 100 % → OEE ≈ 100 %.' }
    ] },
    { name: 'Laufzeit außerhalb der Planzeit zählt nicht', steps: [
      { set: { diRunning: true } }, { ms: 2000 },
      { expect: 'rAvailability = 0.0 AND nRunMs = 0', msg: 'Ohne Planzeit darf keine Laufzeit erfasst werden.' },
      { set: { diPlanned: true } }, { ms: 1000 },
      { expect: 'rAvailability > 99.9', msg: 'In der Planzeit durchgehend gelaufen → 100 %.' }
    ] },
    { name: 'Schichtwechsel setzt zurück', steps: [
      { set: { diPlanned: true, diRunning: true } }, { ms: 1000 }, ...pulse('diPartGood', 2), { set: { diPlanned: false, diRunning: false } }, ...pulse('diResetShift', 1),
      { expect: 'nGood = 0 AND nPlannedMs = 0 AND rOee = 0.0 AND rQuality = 0.0', msg: 'Nach dem Schichtwechsel müssen alle Werte 0 sein.' }
    ] }
  ]
};

const fbAiDecl = `(* FB_AnalogIn – Standardbaustein Analogeingang (BREITNER-Bibliothek BrtIo, Schnittstelle nach PLCopen-Konvention) *)
FUNCTION_BLOCK FB_AnalogIn
	VAR_INPUT
		Enable : BOOL;
		nRaw : INT;          (* Rohwert X20-Analogkarte: 0..32767 = Messbereich, < 0 = Drahtbruch/Fehler *)
		rScaleMin : REAL;    (* physikalischer Wert bei Rohwert 0 *)
		rScaleMax : REAL;    (* physikalischer Wert bei Rohwert 32767 *)
		rLimLow : REAL;      (* Grenzwert unten *)
		rLimHigh : REAL;     (* Grenzwert oben *)
	END_VAR
	VAR_OUTPUT
		Active : BOOL;
		Error : BOOL;
		StatusID : DINT;     (* 0 = ok, -1 = Parameterfehler, -2 = Drahtbruch *)
		rValue : REAL;
		bLowAlarm : BOOL;
		bHighAlarm : BOOL;
		bWireBreak : BOOL;
	END_VAR
	VAR
		rHyst : REAL;
	END_VAR
`;
const aiProgram = `
PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	fbTemp(Enable := diEnable, nRaw := aiTemp, rScaleMin := 0.0, rScaleMax := 150.0, rLimLow := 10.0, rLimHigh := 120.0);
	fbPressure(Enable := diEnable, nRaw := aiPressure, rScaleMin := rPressMin, rScaleMax := rPressMax, rLimLow := 0.5, rLimHigh := 9.0);

	rTemp := fbTemp.rValue;
	doTempHigh := fbTemp.bHighAlarm;
	doTempLow := fbTemp.bLowAlarm;
	rPressure := fbPressure.rValue;
	doSensorError := fbTemp.Error OR fbPressure.Error;
END_PROGRAM
`;
const raw = (v, max) => Math.round(v / max * 32767);

const exAnalogIn = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Standardbaustein FB_AnalogIn für die Firmenbibliothek',
  task: [
    'Bisher skaliert jedes Projekt Analogwerte anders. Für die neue Firmenbibliothek schreibst du den Standardbaustein `FB_AnalogIn`. Die Schnittstelle (PLCopen-Stil mit `Enable`, `Active`, `Error`, `StatusID`) ist im Architektur-Review beschlossen und vorgegeben.',
    '',
    '**Verhalten:**',
    '1. `Enable = FALSE` → `Active`, `Error`, alle Alarme FALSE, `StatusID = 0`, `rValue = 0.0`.',
    '2. **Parameterprüfung:** `rScaleMax <= rScaleMin` → `Error`, `StatusID = -1`, `rValue = 0.0`, Alarme FALSE. `Active` bleibt TRUE.',
    '3. **Drahtbruch:** `nRaw < 0` → `bWireBreak`, `Error`, `StatusID = -2`. `rValue` **behält den letzten gültigen Wert** (Ersatzwertstrategie „last value“), Alarme bleiben unverändert.',
    '4. Sonst: `Error = FALSE`, `StatusID = 0`, `bWireBreak = FALSE`, `rValue = rScaleMin + nRaw / 32767 · (rScaleMax − rScaleMin)`.',
    '5. **Grenzwerte mit Hysterese** `rHyst = 1 %` des Messbereichs: `bHighAlarm` ein bei `rValue >= rLimHigh`, aus bei `rValue < rLimHigh − rHyst`; `bLowAlarm` ein bei `rValue <= rLimLow`, aus bei `rValue > rLimLow + rHyst`.',
    '6. Fehler verschwinden selbstständig, sobald die Ursache weg ist (kein Quittieren nötig – das macht das Alarmsystem).',
    '',
    'Das Programm nutzt zwei Instanzen: Temperatur 0–150 °C (Grenzwerte 10/120 °C) und Druck mit parametrierbarem Messbereich.'
  ].join('\n'),
  hints: [
    '`RETURN` beendet den FB-Aufruf vorzeitig – praktisch für die Fälle 1–3.',
    'Rohwert umrechnen: `INT_TO_REAL(nRaw) / 32767.0`.',
    'Hysterese als `IF … ELSIF …` ohne ELSE, damit der Alarm zwischen den Schwellen seinen Zustand behält.'
  ],
  cycleMs: 10,
  io: [
    { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Messwerterfassung aktiv', widget: 'switch', init: true },
    { name: 'aiTemp', type: 'INT', dir: 'in', label: 'Rohwert Temperatur', widget: 'slider', min: -32768, max: 32767 },
    { name: 'aiPressure', type: 'INT', dir: 'in', label: 'Rohwert Druck', widget: 'slider', min: -32768, max: 32767 },
    { name: 'rPressMin', type: 'REAL', dir: 'in', label: 'Druck-Messbereich Anfang [bar]', widget: 'value', init: 0 },
    { name: 'rPressMax', type: 'REAL', dir: 'in', label: 'Druck-Messbereich Ende [bar]', widget: 'value', init: 10 },
    { name: 'rTemp', type: 'REAL', dir: 'out', label: 'Temperatur', widget: 'gauge', min: 0, max: 150, unit: '°C' },
    { name: 'rPressure', type: 'REAL', dir: 'out', label: 'Druck', widget: 'gauge', min: 0, max: 10, unit: 'bar' },
    { name: 'doTempHigh', type: 'BOOL', dir: 'out', label: 'Übertemperatur', widget: 'led' },
    { name: 'doTempLow', type: 'BOOL', dir: 'out', label: 'Untertemperatur', widget: 'led' },
    { name: 'doSensorError', type: 'BOOL', dir: 'out', label: 'Sensorfehler', widget: 'led' }
  ],
  files: {
    main: fbAiDecl + '\n\t(* TODO: Verhalten 1-6 *)\n\nEND_FUNCTION_BLOCK\n' + aiProgram,
    var: 'VAR\n\tfbTemp : FB_AnalogIn;\n\tfbPressure : FB_AnalogIn;\nEND_VAR\n',
    typ: ''
  },
  solution: {
    main: fbAiDecl + `
	(* 1: deaktiviert *)
	IF NOT Enable THEN
		Active := FALSE;
		Error := FALSE;
		StatusID := 0;
		rValue := 0.0;
		bLowAlarm := FALSE;
		bHighAlarm := FALSE;
		bWireBreak := FALSE;
		RETURN;
	END_IF
	Active := TRUE;

	(* 2: Parameterpruefung *)
	IF rScaleMax <= rScaleMin THEN
		Error := TRUE;
		StatusID := -1; (* Parameterfehler *)
		rValue := 0.0;
		bLowAlarm := FALSE;
		bHighAlarm := FALSE;
		RETURN;
	END_IF

	(* 3: Drahtbruch - letzter gueltiger Wert bleibt stehen *)
	IF nRaw < 0 THEN
		bWireBreak := TRUE;
		Error := TRUE;
		StatusID := -2; (* Drahtbruch *)
		RETURN;
	END_IF

	(* 4: Skalierung *)
	bWireBreak := FALSE;
	Error := FALSE;
	StatusID := 0;
	rValue := rScaleMin + INT_TO_REAL(nRaw) / 32767.0 * (rScaleMax - rScaleMin);

	(* 5: Grenzwerte mit Hysterese *)
	rHyst := (rScaleMax - rScaleMin) * 0.01;
	IF rValue >= rLimHigh THEN
		bHighAlarm := TRUE;
	ELSIF rValue < rLimHigh - rHyst THEN
		bHighAlarm := FALSE;
	END_IF
	IF rValue <= rLimLow THEN
		bLowAlarm := TRUE;
	ELSIF rValue > rLimLow + rHyst THEN
		bLowAlarm := FALSE;
	END_IF
END_FUNCTION_BLOCK
` + aiProgram,
    var: 'VAR\n\tfbTemp : FB_AnalogIn;\n\tfbPressure : FB_AnalogIn;\nEND_VAR',
    typ: ''
  },
  tests: [
    { name: 'Skalierung 0–150 °C', steps: [
      { set: { aiTemp: 16384 } }, { cycles: 2 },
      { expect: 'fbTemp.Active AND NOT fbTemp.Error AND rTemp > 74.9 AND rTemp < 75.1', msg: 'Rohwert 16384 muss ≈ 75 °C ergeben.' }
    ] },
    { name: 'Enable = FALSE', steps: [
      { set: { aiTemp: 16384 } }, { cycles: 2 }, { set: { diEnable: false } }, { cycles: 2 },
      { expect: 'NOT fbTemp.Active AND rTemp = 0.0 AND fbTemp.StatusID = 0', msg: 'Deaktiviert: Active FALSE, rValue 0, StatusID 0.' }
    ] },
    { name: 'Parameterfehler wird erkannt', steps: [
      { set: { aiPressure: 10000, rPressMax: 0 } }, { cycles: 2 },
      { expect: 'fbPressure.Error AND fbPressure.StatusID = -1 AND rPressure = 0.0 AND doSensorError', msg: 'rScaleMax <= rScaleMin → Error, StatusID −1, rValue 0.' }
    ] },
    { name: 'Drahtbruch: letzter gültiger Wert bleibt', steps: [
      { set: { aiTemp: 16384 } }, { cycles: 2 }, { set: { aiTemp: -32768 } }, { cycles: 2 },
      { expect: 'fbTemp.bWireBreak AND fbTemp.Error AND fbTemp.StatusID = -2', msg: 'Rohwert < 0 → Drahtbruch, StatusID −2.' },
      { expect: 'rTemp > 74.9 AND rTemp < 75.1', msg: 'Bei Drahtbruch muss der letzte gültige Wert (≈ 75 °C) stehen bleiben.' },
      { set: { aiTemp: raw(15, 150) } }, { cycles: 2 },
      { expect: 'NOT fbTemp.Error AND fbTemp.StatusID = 0 AND rTemp > 14.9 AND rTemp < 15.1', msg: 'Nach Beseitigung muss der Fehler von selbst verschwinden.' }
    ] },
    { name: 'Obergrenze mit Hysterese', steps: [
      { set: { aiTemp: raw(121, 150) } }, { cycles: 2 }, { expect: 'doTempHigh', msg: '121 °C ≥ 120 °C → Übertemperatur.' },
      { set: { aiTemp: raw(119.5, 150) } }, { cycles: 2 }, { expect: 'doTempHigh', msg: '119,5 °C liegt in der Hysterese (Aus erst unter 118,5 °C).' },
      { set: { aiTemp: raw(118, 150) } }, { cycles: 2 }, { expect: 'NOT doTempHigh', msg: '118 °C < 118,5 °C → Alarm aus.' }
    ] },
    { name: 'Untergrenze', steps: [
      { set: { aiTemp: raw(5, 150) } }, { cycles: 2 }, { expect: 'doTempLow AND NOT doTempHigh', msg: '5 °C ≤ 10 °C → Untertemperatur.' },
      { set: { aiTemp: raw(11, 150) } }, { cycles: 2 }, { expect: 'doTempLow', msg: '11 °C liegt in der Hysterese (Aus erst über 11,5 °C).' },
      { set: { aiTemp: raw(12, 150) } }, { cycles: 2 }, { expect: 'NOT doTempLow', msg: '12 °C > 11,5 °C → Alarm aus.' }
    ] }
  ]
};

module.exports = [
  {
    id: 'praxis-5-adr-metriken', level: 5, kind: 'lektion',
    title: 'Architektur-Entscheidungen dokumentieren und Qualität messen',
    summary: 'Entscheidungen als ADR festhalten, Code-Qualität mit Metriken bewerten und Kennzahlen robust berechnen.',
    minutes: 180, req: ['praxis-4-technische-schulden'],
    briefing: 'Auf Master-Niveau triffst du Entscheidungen, die viele Projekte betreffen: Welche Bibliothek, welches Alarmkonzept, welche Task-Struktur? Ein Architecture Decision Record (ADR) hält in wenigen Absätzen Kontext, Entscheidung, Status und Konsequenzen fest – so weiß das Team auch in drei Jahren, warum etwas so ist. Qualität machst du mit Metriken sichtbar: zyklomatische Komplexität nach McCabe, Bausteingröße, Testabdeckung, Anzahl Warnungen. PLCopen hat dafür eine eigene Guideline zu Software-Qualitätsmetriken. In der Übung setzt du ein ADR zur Kennzahlenberechnung robust um.',
    practice: 'Die Frage „Warum nutzen wir hier nicht mapp AlarmX?“ kostet ohne ADR eine Stunde Archäologie. Mit ADR ist sie in zwei Minuten beantwortet – oder die Entscheidung wird bewusst neu getroffen.',
    transfer: {
      tia: 'Siemens bietet mit dem Software Controller- und SIMATIC AX-Umfeld statische Codeanalyse; Metriken wie Komplexität sind herstellerneutral.',
      codesys: 'CODESYS Static Analysis und TwinCAT-Werkzeuge liefern Metriken (Komplexität, Zeilen, Aufrufe) direkt im Engineering.'
    },
    objectives: [
      {
        id: 'o1', title: 'Schreibe einen Architecture Decision Record',
        guide: {
          intro: 'Ein ADR ist kurz (eine Seite), unveränderlich nach Annahme und wird bei Änderungen durch ein neues ADR ersetzt.',
          steps: [
            'Lege im Repository einen Ordner `Doc/adr/` an; Dateiname `0007-kennzahlen-in-der-steuerung.md`.',
            '**Titel** und **Status** (vorgeschlagen, angenommen, ersetzt durch …).',
            '**Kontext:** Welche Kräfte wirken? (Rechenzeit, Datenqualität, Leitsystem kann nicht rechnen …)',
            '**Entscheidung:** ein klarer Satz im Aktiv: „Wir berechnen OEE in der Steuerung, Kennzahlen sind immer definiert.“',
            '**Konsequenzen:** positive und negative Folgen, Folgearbeiten.'
          ],
          code: { lang: 'text', text: '# 7. Kennzahlen in der Steuerung berechnen\nStatus: angenommen (2026-11-10)\n## Kontext\n…\n## Entscheidung\n…\n## Konsequenzen\n…' },
          done: 'Erledigt, wenn du ein ADR mit allen fünf Abschnitten für eine echte Entscheidung aus deinem Projekt geschrieben hast.',
          tip: 'Schreibe ADRs, während die Entscheidung fällt – nachträglich fehlt meist der Kontext.',
          link: { label: 'Michael Nygard: Documenting Architecture Decisions', url: 'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions' }
        }
      },
      {
        id: 'o2', title: 'Berechne und bewerte die zyklomatische Komplexität',
        guide: {
          intro: 'Die McCabe-Komplexität zählt unabhängige Pfade: Anzahl Verzweigungen + 1. Sie bestimmt die Mindestzahl an Testfällen für Zweigabdeckung.',
          steps: [
            'Zähle in einem Baustein jede Entscheidung: `IF`, `ELSIF`, jede `CASE`-Marke, `FOR`, `WHILE`, `REPEAT` sowie `AND`/`OR` in Bedingungen (bei erweiterter Zählung).',
            'Komplexität = Entscheidungen + 1.',
            'Faustregel: bis 10 gut testbar, 11–20 prüfen, über 20 aufteilen.',
            'Automatisiere die Messung in der CI (z. B. mit statischer Analyse, siehe Community-Beitrag).',
            'Verfolge den Trend über die Zeit statt Einzelwerte zu diskutieren.'
          ],
          done: 'Erledigt, wenn du für drei Bausteine deines Projekts die Komplexität bestimmt und den höchsten bewertet hast.',
          tip: 'Eine Metrik ist ein Gesprächsanlass, kein Urteil. Ein großer CASE-Zustandsautomat kann trotz hoher Zahl gut lesbar sein.',
          link: { label: 'B&R Community: Static Code Analysis with Lizard', url: 'https://community.br-automation.com/t/static-code-analysis-in-ci-cd-using-lizard/8578' }
        }
      },
      {
        id: 'o3', title: 'Definiere ein Qualitätsmodell für dein Team',
        guide: {
          intro: 'Metriken wirken nur, wenn das Team sich auf wenige, verständliche Werte einigt.',
          steps: [
            'Wähle 3–5 Metriken: z. B. Compiler-Warnungen = 0, Komplexität je Baustein ≤ 15, Unit-Tests für alle Bibliotheksbausteine, Review-Quote 100 %.',
            'Lege für jede Metrik Ziel, Messmethode und Verantwortlichen fest.',
            'Prüfe Warnungen nach jedem Build mit **F7** im Ausgabefenster (F4 springt zur nächsten Meldung).',
            'Berichte die Werte monatlich im Team – Trend, nicht Schuldzuweisung.',
            'Halte das Qualitätsmodell selbst als ADR fest.'
          ],
          done: 'Erledigt, wenn ein Qualitätsmodell mit höchstens fünf Metriken, Zielen und Messmethode im Team abgestimmt ist.',
          tip: 'Was gemessen wird, wird optimiert – auch auf unerwünschte Weise. Wähle Metriken, deren „Austricksen“ trotzdem nützt.',
          link: { label: 'PLCopen Software Construction Guidelines (inkl. Quality Metrics)', url: 'https://www.plcopen.org/guidelines/software-construction-guidelines/' }
        }
      },
      {
        id: 'o4', title: 'Setze robuste Berechnungen um',
        guide: {
          intro: 'Kennzahlen, die bei Schichtbeginn NaN liefern, zerstören das Vertrauen ins Reporting. Robustheit heißt: jeden Grenzfall definieren.',
          steps: [
            'Liste alle Divisionen und prüfe jeden Nenner auf 0.',
            'Lege für jeden Grenzfall einen definierten Wert fest (hier 0 %) und dokumentiere ihn im ADR.',
            'Begrenze Ergebnisse auf den gültigen Bereich mit `LIMIT`.',
            'Prüfe Überläufe: UDINT-Millisekunden reichen ≈ 49 Tage – für Schichtwerte genug, für Lebensdauerzähler nicht.',
            'Teste mit den Grenzfällen in der Übung.'
          ],
          done: 'Erledigt, wenn die Übung „Robuste Kennzahlen: OEE“ alle Tests besteht.',
          tip: 'Eine Division durch 0 liefert bei REAL in vielen Laufzeitumgebungen Inf oder NaN statt eines Fehlers – das fällt erst in der Visualisierung oder im Leitsystem auf.'
        }
      }
    ],
    videos: [V.adrCodeOpinion, V.mccabeToby, V.plcopenStructuring],
    readings: [R.glinzMessung, R.nygardAdr, R.nistMcCabe],
    quiz: [
      { type: 'numeric', q: 'Ein Baustein enthält {I} IF-Anweisungen, {E} ELSIF-Zweige und eine CASE-Anweisung mit {C} Marken. Wie hoch ist die zyklomatische Komplexität (Entscheidungen + 1, jede CASE-Marke zählt als eine Entscheidung)?',
        params: { I: [2, 8, 1], E: [0, 4, 1], C: [3, 8, 1] }, formula: 'I + E + C + 1', unit: '', tol: 0.001,
        explain: 'Jede Verzweigung erzeugt einen zusätzlichen unabhängigen Pfad; plus 1 für den Grundpfad.' },
      { type: 'multi', q: 'Welche Abschnitte hat ein ADR nach Nygard?', options: ['Titel', 'Kontext', 'Entscheidung', 'Status und Konsequenzen'], correct: [0, 1, 2, 3],
        explain: 'Titel, Status, Kontext, Entscheidung und Konsequenzen.' },
      { type: 'single', q: 'Was ist an dieser Zeile das Robustheitsproblem?',
        code: { lang: 'st', text: 'rQuality := UDINT_TO_REAL(nGood) / UDINT_TO_REAL(nGood + nBad) * 100.0;' },
        options: ['Die Konvertierung ist falsch', 'Ohne Teile ist der Nenner 0 → Inf/NaN', 'Der Faktor 100 ist falsch', 'UDINT kann keine Teile zählen'], correct: 1,
        explain: 'Zu Schichtbeginn gilt nGood + nBad = 0. Der Nenner muss vorher geprüft werden.' }
    ],
    exam: [
      { type: 'single', q: 'Ein angenommenes ADR stellt sich als falsch heraus. Was tust du?',
        options: ['Das alte ADR löschen', 'Das alte ADR heimlich ändern', 'Ein neues ADR schreiben, das das alte ersetzt, und den Status des alten auf „ersetzt durch …“ setzen', 'Nichts'], correct: 2,
        explain: 'ADRs sind ein Protokoll; die Historie der Entscheidungen bleibt erhalten.' },
      { type: 'numeric', q: 'Verfügbarkeit {A} %, Leistung {P} %, Qualität {Q} %. Wie hoch ist die OEE in %?',
        params: { A: [70, 95, 1], P: [70, 95, 1], Q: [90, 99, 1] }, formula: 'A * P * Q / 10000', unit: '%', tol: 0.01,
        explain: 'OEE = A · P · Q / 10 000 (bei Angaben in %).' },
      { type: 'multi', q: 'Welche Aussagen zu Metriken stimmen?', options: ['Trends sind aussagekräftiger als Einzelwerte', 'Eine hohe Komplexität bedeutet mehr nötige Testfälle', 'Metriken ersetzen Reviews', 'Wenige, abgestimmte Metriken wirken besser als viele'], correct: [0, 1, 3],
        explain: 'Metriken unterstützen Reviews, ersetzen sie aber nicht.' },
      { type: 'single', q: 'Wie viele Tage reicht ein UDINT-Millisekundenzähler bis zum Überlauf (ungefähr)?', options: ['≈ 1 Tag', '≈ 49,7 Tage', '≈ 1 Jahr', '≈ 136 Jahre'], correct: 1,
        explain: '2³² ms ≈ 4,29 · 10⁹ ms ≈ 49,7 Tage.' }
    ],
    exercises: [exOee],
    proof: false
  },
  {
    id: 'praxis-5-standardisierung', level: 5, kind: 'projekt',
    title: 'Wiederverwendung, Standardisierung und Wissenstransfer im Unternehmen',
    summary: 'Einen Standardbaustein für die Firmenbibliothek entwerfen, dokumentieren und im Team verankern.',
    minutes: 300, req: ['praxis-5-adr-metriken'],
    briefing: 'Standardisierung macht aus vielen Einzelprojekten eine Plattform: gemeinsame Bibliotheken, einheitliche Schnittstellen, Framework-Projekte für Maschinenvarianten. B&R unterstützt das mit Export/Import von Anwendungsmodulen, Rahmenprojekten und dem mapp-Konzept („konfigurieren statt programmieren“). Damit Standards genutzt werden, müssen sie robust, dokumentiert und bekannt sein – Wissenstransfer ist deshalb Teil der Aufgabe. In diesem Praxisprojekt baust du `FB_AnalogIn` für die Firmenbibliothek mit PLCopen-artiger Schnittstelle, Parameterprüfung, Drahtbrucherkennung und Hysterese und machst ihn im Team bekannt.',
    practice: 'Wenn zehn Projekte zehn Skalierungen haben, gibt es zehn Fehlerquellen und zehn Arten, sie zu bedienen. Ein Standardbaustein spart in jedem neuen Projekt Zeit und macht Service-Einsätze vorhersehbar.',
    transfer: {
      tia: 'Siemens stellt mit Bibliotheken wie LGF/LBC Standardbausteine bereit; Firmenstandards werden als globale Bibliotheken mit Typversionierung verteilt.',
      codesys: 'CODESYS-Bibliotheken werden versioniert im Bibliotheks-Repository installiert; PLCopen-Konventionen (Enable/Execute, Busy, Error, ErrorID) sind dort ebenfalls üblich.'
    },
    objectives: [
      {
        id: 'o1', title: 'Entwirf eine einheitliche Bausteinschnittstelle',
        guide: {
          intro: 'Standardbausteine einer Firma sollen sich alle gleich anfühlen. PLCopen und mapp liefern bewährte Muster.',
          steps: [
            'Lege das Grundmuster fest: `Enable` (pegelgesteuert) → `Active`, `Error`, `StatusID` (0 = ok, negativ = Fehler, positiv = Info).',
            'Definiere Fehlernummern zentral (Konstanten in der Bibliothek) und dokumentiere sie.',
            'Lege fest, was im Fehlerfall mit Ausgängen passiert (Ersatzwertstrategie).',
            'Halte die Schnittstelle stabil: Änderungen nur mit neuer Hauptversion der Bibliothek.',
            'Dokumentiere die Entscheidung als ADR.'
          ],
          done: 'Erledigt, wenn die Schnittstelle von `FB_AnalogIn` mit Fehlernummern und Ersatzwertstrategie dokumentiert ist.',
          tip: 'Kopiere bewährte Muster aus mapp-Bausteinen – Anwender kennen sie bereits.',
          link: { label: 'B&R Help: Implementierungsrichtlinien', url: help('projectmanagement/modularapp/conventions.html') }
        }
      },
      {
        id: 'o2', title: 'Implementiere und teste den Standardbaustein',
        guide: {
          intro: 'Ein Bibliotheksbaustein wird hundertfach genutzt – er muss jeden Grenzfall definiert behandeln.',
          steps: [
            'Implementiere `FB_AnalogIn` in der Übung Regel für Regel.',
            'Teste Normalfall, Parameterfehler, Drahtbruch, Rückkehr aus dem Fehler und beide Hysteresen.',
            'In AS6: Lege den Baustein in einer eigenen Anwenderbibliothek im Logical View an und gib ihr eine Version.',
            'Ergänze ein Testprogramm in einer separaten Testkonfiguration.',
            'Lass den Baustein von zwei Kollegen aus anderen Projekten reviewen.'
          ],
          done: 'Erledigt, wenn die Übung „Standardbaustein FB_AnalogIn“ alle Tests besteht.',
          tip: 'Teste den Baustein mit zwei Instanzen gleichzeitig – so findest du versehentlich geteilte Variablen.'
        }
      },
      {
        id: 'o3', title: 'Verteile den Standard: Bibliothek, Export, Rahmenprojekt',
        guide: {
          intro: 'Ein Standard, den niemand findet, existiert nicht.',
          steps: [
            'Lies die AS-Hilfe zu Wiederverwendung (Export/Import von Anwendungsmodulen) und Rahmenprojekten.',
            'Lege die Bibliothek in einem eigenen Repository mit Versionen (Tags) und Änderungsprotokoll ab.',
            'Nimm die Bibliothek in das Rahmenprojekt (Framework-Projekt) für neue Maschinen auf.',
            'Definiere, wer Änderungen freigibt (Bibliotheks-Owner) und wie Fehler gemeldet werden.',
            'Plane den Umstieg bestehender Projekte – nicht alle auf einmal.'
          ],
          done: 'Erledigt, wenn es ein versioniertes Bibliotheks-Repository mit Owner und Änderungsprotokoll gibt.',
          tip: 'Semantische Versionierung (MAJOR.MINOR.PATCH) macht für Anwender sofort sichtbar, ob ein Update Schnittstellen bricht.',
          link: { label: 'B&R Help: Wiederverwendung', url: help('projectmanagement/modularapp/reuse.html') }
        }
      },
      {
        id: 'o4', title: 'Organisiere den Wissenstransfer',
        guide: {
          intro: 'Dokumentation und Austausch machen aus einem Baustein einen gelebten Standard.',
          steps: [
            'Schreibe die Doku nach Diátaxis: kurzes Tutorial (erste Nutzung), How-to (Drahtbruch parametrieren), Referenz (Schnittstelle), Erklärung (warum Hysterese).',
            'Lege die Doku als Markdown neben den Code („Docs as Code“) und lass sie reviewen.',
            'Halte eine 20-minütige Vorstellung im Team mit Live-Demo.',
            'Sammle Feedback der ersten Anwender und verbessere Baustein und Doku.',
            'Reiche den Link zum Bibliotheks-Repository mit Doku auf git.breitner.de als Nachweis ein.'
          ],
          done: 'Erledigt, wenn Doku, Vorstellung und Repository-Link als Nachweis eingereicht sind.',
          tip: 'Wissen, das nur in einem Kopf existiert, ist ein Projektrisiko (Bus-Faktor 1). Ziel: mindestens zwei Personen kennen jeden Standardbaustein.',
          link: { label: 'Diátaxis', url: 'https://diataxis.fr/' }
        }
      }
    ],
    videos: [V.mappFramework, V.mappConcept, V.plcopenLibs],
    readings: [R.glinzProduktivitaet, R.brFramework, R.diataxis],
    quiz: [
      { type: 'single', q: 'Was bedeutet ein Wechsel von Version 2.4.1 auf 3.0.0 einer Bibliothek nach semantischer Versionierung?',
        options: ['Nur Fehlerkorrekturen', 'Neue, kompatible Funktionen', 'Inkompatible Änderung der Schnittstelle', 'Nur Dokumentation geändert'], correct: 2,
        explain: 'MAJOR erhöht → Schnittstelle nicht abwärtskompatibel.' },
      { type: 'single', q: 'Warum behält `FB_AnalogIn` bei Drahtbruch den letzten gültigen Wert?',
        options: ['Weil das immer richtig ist', 'Als dokumentierte Ersatzwertstrategie, damit nachfolgende Regelungen nicht auf einen Sprungwert reagieren – kombiniert mit Error-Meldung', 'Weil RETURN keine Ausgänge schreiben darf', 'Zufall'], correct: 1,
        explain: 'Die Ersatzwertstrategie muss bewusst gewählt und dokumentiert werden; je nach Prozess kann auch ein sicherer Ersatzwert sinnvoller sein.' },
      { type: 'multi', q: 'Welche Elemente machen einen Firmenstandard nutzbar?', options: ['Versionierte Bibliothek', 'Dokumentation mit Beispielen', 'Ein verantwortlicher Owner', 'Geheimhaltung vor dem Team'], correct: [0, 1, 2],
        explain: 'Standards leben von Sichtbarkeit und Pflege.' }
    ],
    exam: [
      { type: 'numeric', q: 'Ein X20-Analogeingang liefert 0–32767 für 0–{M} bar. Welcher Druck entspricht dem Rohwert {N}?',
        params: { M: [6, 16, 2], N: [4000, 30000, 1000] }, formula: 'N / 32767 * M', unit: 'bar', tol: 0.01,
        explain: 'p = Rohwert / 32767 · Messbereichsendwert.' },
      { type: 'single', q: 'Welche Dokumentationsart nach Diátaxis beschreibt alle Ein- und Ausgänge eines Bausteins vollständig?',
        options: ['Tutorial', 'How-to-Anleitung', 'Referenz', 'Erklärung'], correct: 2, explain: 'Referenz = vollständige, sachliche Beschreibung.' },
      { type: 'single', q: 'Was ist am folgenden Bausteinaufruf problematisch, wenn der FB intern Zustände speichert?',
        code: { lang: 'st', text: 'fbScale(nRaw := aiTemp1, ...);\nrTemp1 := fbScale.rValue;\nfbScale(nRaw := aiTemp2, ...);\nrTemp2 := fbScale.rValue;' },
        options: ['Nichts', 'Eine Instanz wird für zwei Signale genutzt – Hysterese und letzter Wert vermischen sich', 'Die Zuweisung ist syntaktisch falsch', 'Es fehlt ein Kommentar'], correct: 1,
        explain: 'Jedes Signal braucht eine eigene Instanz, sonst teilen sich die Signale den inneren Zustand.' },
      { type: 'multi', q: 'Was hilft gegen einen Bus-Faktor von 1?', options: ['Pair Programming', 'Code Reviews durch wechselnde Kollegen', 'Dokumentation neben dem Code', 'Wissen bewusst bei einer Person konzentrieren'], correct: [0, 1, 2],
        explain: 'Wissen verteilen statt konzentrieren.' }
    ],
    exercises: [exAnalogIn],
    proof: true,
    badge: 'Bibliotheks-Architektur'
  }
];
