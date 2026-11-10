'use strict';
const { brHelp, brLink, ABGERUFEN } = require('./_util');

// ---------------------------------------------------------------------------
// Level 6 (Guru): Styleguide & Design-System für eine Produktfamilie, Praxisprojekt Usability-Test
// ---------------------------------------------------------------------------

const TYP_DS = `TYPE
	Rgb_typ : STRUCT
		R : USINT;
		G : USINT;
		B : USINT;
	END_STRUCT;
	Token_typ : STRUCT
		Fg : Rgb_typ; (* Textfarbe *)
		Bg : Rgb_typ; (* Hintergrundfarbe *)
		Defined : BOOL;
	END_STRUCT;
	TokenSet_typ : STRUCT
		Token : ARRAY[0..5] OF Token_typ; (* 0 neutral, 1 Betrieb, 2 Warnung, 3 Alarm, 4 ungültig, 5 disabled *)
	END_STRUCT;
	DsPar_typ : STRUCT
		Variant : INT; (* Maschinenvariante 0..2 *)
		MinContrast : REAL; (* Mindestkontrast, Standard 4.5 *)
	END_STRUCT;
	DsStatus_typ : STRUCT
		Resolved : ARRAY[0..5] OF Token_typ; (* wirksame Tokens der Variante *)
		Contrast : ARRAY[0..5] OF REAL;
		Violations : INT;
		FirstViolation : INT; (* -1 = keine *)
		Fallbacks : INT; (* Tokens aus dem Basis-Theme übernommen *)
		VariantValid : BOOL;
	END_STRUCT;
	DesignSys_typ : STRUCT
		Base : TokenSet_typ;
		Override : ARRAY[0..2] OF TokenSet_typ;
		Par : DsPar_typ;
		Status : DsStatus_typ;
	END_STRUCT;
END_TYPE
`;

const DS_FUNCS = `FUNCTION FC_Lin : REAL
	VAR_INPUT
		c : USINT;
	END_VAR
	VAR
		cs : REAL;
	END_VAR
	cs := USINT_TO_REAL(c) / 255.0;
	IF cs <= 0.03928 THEN
		FC_Lin := cs / 12.92;
	ELSE
		FC_Lin := ((cs + 0.055) / 1.055) ** 2.4;
	END_IF;
END_FUNCTION

FUNCTION FC_Luminance : REAL
	VAR_INPUT
		Color : Rgb_typ;
	END_VAR
	FC_Luminance := 0.2126 * FC_Lin(Color.R) + 0.7152 * FC_Lin(Color.G) + 0.0722 * FC_Lin(Color.B);
END_FUNCTION

FUNCTION FC_Contrast : REAL
	VAR_INPUT
		A : Rgb_typ;
		B : Rgb_typ;
	END_VAR
	VAR
		la : REAL;
		lb : REAL;
	END_VAR
	la := FC_Luminance(A);
	lb := FC_Luminance(B);
	FC_Contrast := (MAX(la, lb) + 0.05) / (MIN(la, lb) + 0.05);
END_FUNCTION
`;

// SetToken als Hilfs-FUNCTION_BLOCK, damit die Basisdaten kompakt bleiben
const DS_SETTOKEN = `FUNCTION_BLOCK FB_SetToken
	VAR_INPUT
		Idx : INT;
		fr : USINT; fg : USINT; fb : USINT;
		br : USINT; bg : USINT; bb : USINT;
	END_VAR
	VAR_IN_OUT
		Tokens : TokenSet_typ;
	END_VAR
	Tokens.Token[Idx].Fg.R := fr;
	Tokens.Token[Idx].Fg.G := fg;
	Tokens.Token[Idx].Fg.B := fb;
	Tokens.Token[Idx].Bg.R := br;
	Tokens.Token[Idx].Bg.G := bg;
	Tokens.Token[Idx].Bg.B := bb;
	Tokens.Token[Idx].Defined := TRUE;
END_FUNCTION_BLOCK
`;

const DS_INIT_FB = `PROGRAM _INIT
	(* Basis-Theme der Produktfamilie (vorgegeben) *)
	fbSet(Idx := 0, fr := 0, fg := 0, fb := 0, br := 230, bg := 230, bb := 230, Tokens := gDs.Base); (* neutral *)
	fbSet(Idx := 1, fr := 255, fg := 255, fb := 255, br := 0, bg := 100, bb := 0, Tokens := gDs.Base); (* Betrieb *)
	fbSet(Idx := 2, fr := 0, fg := 0, fb := 0, br := 255, bg := 204, bb := 0, Tokens := gDs.Base); (* Warnung *)
	fbSet(Idx := 3, fr := 255, fg := 255, fb := 255, br := 200, bg := 0, bb := 0, Tokens := gDs.Base); (* Alarm *)
	fbSet(Idx := 4, fr := 255, fg := 255, fb := 255, br := 128, bg := 0, bb := 128, Tokens := gDs.Base); (* ungültig *)
	fbSet(Idx := 5, fr := 119, fg := 119, fb := 119, br := 255, bg := 255, bb := 255, Tokens := gDs.Base); (* disabled *)
	gDs.Par.MinContrast := 4.5;
END_PROGRAM
`;

const MAIN_DS_SOL = DS_SETTOKEN + '\n' + DS_FUNCS + '\n' + DS_INIT_FB + `
PROGRAM _CYCLIC
	nVar := gDs.Par.Variant;
	gDs.Status.VariantValid := (nVar >= 0) AND (nVar <= 2);
	nViol := 0;
	nFirst := -1;
	nFallback := 0;

	FOR t := 0 TO 5 DO
		(* 1. Token auflösen: Override der Variante vor Basis *)
		IF gDs.Status.VariantValid AND gDs.Override[nVar].Token[t].Defined THEN
			gDs.Status.Resolved[t] := gDs.Override[nVar].Token[t];
		ELSE
			gDs.Status.Resolved[t] := gDs.Base.Token[t];
			IF gDs.Status.VariantValid THEN
				nFallback := nFallback + 1;
			END_IF;
		END_IF;

		(* 2. Kontrast prüfen; undefiniertes Token ist immer ein Verstoß *)
		IF gDs.Status.Resolved[t].Defined THEN
			gDs.Status.Contrast[t] := FC_Contrast(gDs.Status.Resolved[t].Fg, gDs.Status.Resolved[t].Bg);
		ELSE
			gDs.Status.Contrast[t] := 0.0;
		END_IF;
		IF gDs.Status.Contrast[t] < gDs.Par.MinContrast THEN
			nViol := nViol + 1;
			IF nFirst < 0 THEN
				nFirst := t;
			END_IF;
		END_IF;
	END_FOR;

	gDs.Status.Violations := nViol;
	gDs.Status.FirstViolation := nFirst;
	gDs.Status.Fallbacks := nFallback;
END_PROGRAM
`;

const MAIN_DS_START = DS_SETTOKEN + `
(* TODO: FUNCTION FC_Lin, FC_Luminance, FC_Contrast *)

` + DS_INIT_FB + `
PROGRAM _CYCLIC
	(* TODO: Tokens je Variante auflösen, Kontrast prüfen, Status *)
	FOR t := 0 TO 5 DO
		gDs.Status.Resolved[t] := gDs.Base.Token[t];
	END_FOR;
	gDs.Status.FirstViolation := -1;
END_PROGRAM
`;

function ovr(v, t, f, b) {
  const p = `gDs.Override[${v}].Token[${t}]`;
  return { set: { [p + '.Fg.R']: f[0], [p + '.Fg.G']: f[1], [p + '.Fg.B']: f[2], [p + '.Bg.R']: b[0], [p + '.Bg.G']: b[1], [p + '.Bg.B']: b[2], [p + '.Defined']: true } };
}

const EX_DS = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Design-Tokens je Maschinenvariante auflösen und Kontraste prüfen',
  task: `Ein Design-System für eine Produktfamilie definiert **Tokens** (benannte Gestaltungsentscheidungen wie „Zustand Alarm: Text weiß auf Rot“) in einem Basis-Theme; Varianten (z. B. Kunden-CD, Exportversion) überschreiben einzelne Tokens. Ein automatischer Check verhindert, dass eine Variante die Lesbarkeit verschlechtert. In mapp View landen die aufgelösten Tokens als Styles im Theme; diese Übung bildet die Prüflogik nach, wie sie z. B. ein Build-Check oder eine Inbetriebnahme-Diagnose ausführt.

Das Basis-Theme ist in \`_INIT\` vorgegeben (6 Zustands-Tokens). \`gDs.Override[v]\` enthält je Variante 0…2 die überschriebenen Tokens (\`Defined\` = TRUE).

Schreibe die Funktionen (in AS6 Deklaration in der .fun-Datei):
* \`FC_Lin(c : USINT) : REAL\` – Linearisierung nach WCAG: cs = c / 255; cs ≤ 0,03928 → cs / 12,92, sonst ((cs + 0,055) / 1,055) ** 2,4
* \`FC_Luminance(Color : Rgb_typ) : REAL\` = 0,2126·R + 0,7152·G + 0,0722·B (linearisierte Kanäle)
* \`FC_Contrast(A, B : Rgb_typ) : REAL\` = (L_hell + 0,05) / (L_dunkel + 0,05)

**Anforderungen**
1. \`Status.VariantValid\`: \`Par.Variant\` im Bereich 0…2.
2. **Auflösung** je Token t: gültige Variante **und** Override definiert → Override, sonst Basis. \`Status.Fallbacks\` zählt bei gültiger Variante die Tokens aus der Basis. Ungültige Variante → alles aus der Basis, Fallbacks 0.
3. **Kontrast:** \`Status.Contrast[t]\` = FC_Contrast(Fg, Bg) des aufgelösten Tokens; ein undefiniertes Token hat Kontrast 0.
4. **Verstöße:** Kontrast < \`Par.MinContrast\` (Standard 4,5). \`Status.Violations\` = Anzahl, \`Status.FirstViolation\` = kleinster betroffener Token-Index, sonst −1.`,
  hints: [
    'USINT_TO_REAL(c) wandelt den Farbkanal um; ** ist der Potenzoperator.',
    'Grau 119/119/119 auf Weiß hat einen Kontrast von ≈ 4,48 – knapp durchgefallen. Ein Klassiker bei „disabled“-Texten.',
    'Ganze Strukturen lassen sich zuweisen: gDs.Status.Resolved[t] := gDs.Base.Token[t];'
  ],
  cycleMs: 10,
  io: [
    { name: 'gDs', type: 'DesignSys_typ', dir: 'in', writable: true, label: 'Design-System (Tokens, Varianten, Status)' }
  ],
  files: {
    main: MAIN_DS_START,
    var: `VAR
	fbSet : FB_SetToken;
	t : INT;
END_VAR
`,
    typ: TYP_DS
  },
  solution: {
    main: MAIN_DS_SOL,
    var: `VAR
	fbSet : FB_SetToken;
	t : INT;
	nVar : INT;
	nViol : INT;
	nFirst : INT;
	nFallback : INT;
END_VAR
`,
    typ: TYP_DS
  },
  tests: [
    { name: 'Kontrastberechnung nach WCAG', steps: [
      { cycles: 2 },
      { expect: 'ABS(gDs.Status.Contrast[0] - 16.826) < 0.01', msg: 'Schwarz auf Grau 230: Kontrast ≈ 16,83.' },
      { expect: 'ABS(gDs.Status.Contrast[1] - 7.439) < 0.01 AND ABS(gDs.Status.Contrast[3] - 6.077) < 0.01', msg: 'Weiß auf Dunkelgrün ≈ 7,44; Weiß auf Rot 200 ≈ 6,08.' },
      { expect: 'ABS(gDs.Status.Contrast[5] - 4.478) < 0.01', msg: 'Grau 119 auf Weiß ≈ 4,48.' }
    ]},
    { name: 'Basis-Theme: ein Verstoß beim disabled-Token', steps: [
      { cycles: 2 },
      { expect: 'gDs.Status.VariantValid AND gDs.Status.Violations = 1 AND gDs.Status.FirstViolation = 5', msg: 'Nur Token 5 (disabled) unterschreitet 4,5.' },
      { expect: 'gDs.Status.Fallbacks = 6', msg: 'Ohne Overrides kommen alle 6 Tokens aus der Basis.' }
    ]},
    { name: 'Variante 1: Override behebt einen und erzeugt einen neuen Verstoß', steps: [
      ovr(1, 5, [118, 118, 118], [255, 255, 255]),
      ovr(1, 1, [255, 255, 255], [0, 160, 0]),
      { set: { 'gDs.Par.Variant': 1 } }, { cycles: 2 },
      { expect: 'gDs.Status.Resolved[1].Bg.G = 160 AND gDs.Status.Fallbacks = 4', msg: 'Token 1 und 5 kommen aus dem Override, 4 aus der Basis.' },
      { expect: 'ABS(gDs.Status.Contrast[5] - 4.542) < 0.01', msg: 'Grau 118 auf Weiß ≈ 4,54 – besteht.' },
      { expect: 'gDs.Status.Violations = 1 AND gDs.Status.FirstViolation = 1 AND ABS(gDs.Status.Contrast[1] - 3.484) < 0.01', msg: 'Das hellere CD-Grün (0/160/0) mit weißer Schrift fällt durch (≈ 3,48).' }
    ]},
    { name: 'Ungültige Variante und undefiniertes Basis-Token', steps: [
      ovr(1, 1, [255, 255, 255], [0, 160, 0]),
      { set: { 'gDs.Par.Variant': 7, 'gDs.Base.Token[2].Defined': false } }, { cycles: 2 },
      { expect: 'NOT gDs.Status.VariantValid AND gDs.Status.Fallbacks = 0', msg: 'Variante 7 ist ungültig.' },
      { expect: 'gDs.Status.Resolved[1].Bg.G = 100', msg: 'Bei ungültiger Variante gilt ausschließlich die Basis.' },
      { expect: 'gDs.Status.Contrast[2] = 0.0 AND gDs.Status.Violations = 2 AND gDs.Status.FirstViolation = 2', msg: 'Undefiniertes Token: Kontrast 0, zählt als Verstoß.' }
    ]},
    { name: 'Mindestkontrast ist parametrierbar', steps: [
      { set: { 'gDs.Par.MinContrast': 7.0 } }, { cycles: 2 },
      { expect: 'gDs.Status.Violations = 2 AND gDs.Status.FirstViolation = 3', msg: 'Bei 7:1 (WCAG AAA) fallen Token 3 (6,08) und 5 (4,48) durch; Token 1 besteht knapp (7,44).' }
    ]}
  ]
};

// ---------------------------------------------------------------------------

const TYP_UX = `TYPE
	UxCmd_typ : STRUCT
		StartTask : INT; (* 1..3 = Aufgabe starten, SPS setzt auf 0 *)
		EndTask : INT; (* 1 = gelöst, 2 = abgebrochen, SPS setzt auf 0 *)
		SaveParticipant : BOOL;
	END_STRUCT;
	UxStatus_typ : STRUCT
		TaskRunning : INT; (* laufende Aufgabe, 0 = keine *)
		LastTime : REAL; (* Dauer der zuletzt beendeten Aufgabe in s *)
		Errors : INT; (* Bedienfehler des aktuellen Teilnehmers *)
		Sus : REAL; (* SUS-Score 0..100 des aktuellen Fragebogens *)
		SusValid : BOOL;
		SaveError : BOOL;
		Participants : INT;
		MeanSus : REAL;
		CompletionRate : REAL; (* % gelöster Aufgaben aller gespeicherten Teilnehmer *)
		MeanTime : ARRAY[0..2] OF REAL; (* mittlere Dauer je Aufgabe, nur gelöste *)
	END_STRUCT;
	UxHmi_typ : STRUCT
		Cmd : UxCmd_typ;
		Answer : ARRAY[0..9] OF INT; (* SUS-Antworten 1..5 *)
		Status : UxStatus_typ;
	END_STRUCT;
	UxResult_typ : STRUCT
		Sus : REAL;
		TaskOk : ARRAY[0..2] OF BOOL;
		TaskTime : ARRAY[0..2] OF REAL;
	END_STRUCT;
END_TYPE
`;

const MAIN_UX_SOL = `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* 1. Aufgaben-Zeitmessung *)
	IF (gUx.Cmd.StartTask >= 1) AND (gUx.Cmd.StartTask <= 3) AND (nTask = 0) THEN
		nTask := gUx.Cmd.StartTask;
	END_IF;
	gUx.Cmd.StartTask := 0;
	tonTask(IN := nTask <> 0, PT := T#1h);
	IF (gUx.Cmd.EndTask = 1) OR (gUx.Cmd.EndTask = 2) THEN
		IF nTask <> 0 THEN
			rTime := DINT_TO_REAL(TIME_TO_DINT(tonTask.ET)) / 1000.0;
			stCur.TaskTime[nTask - 1] := rTime;
			stCur.TaskOk[nTask - 1] := gUx.Cmd.EndTask = 1;
			gUx.Status.LastTime := rTime;
			nTask := 0;
			tonTask(IN := FALSE, PT := T#1h);
		END_IF;
	END_IF;
	gUx.Cmd.EndTask := 0;

	(* 2. Bedienfehler nur während einer Aufgabe *)
	rtSlip(CLK := diSlip);
	IF rtSlip.Q AND (nTask <> 0) THEN
		nErrors := nErrors + 1;
	END_IF;

	(* 3. SUS: ungerade Items (Index 0,2,..) x - 1, gerade Items 5 - x, Summe * 2,5 *)
	bValid := TRUE;
	nSum := 0;
	FOR i := 0 TO 9 DO
		IF (gUx.Answer[i] < 1) OR (gUx.Answer[i] > 5) THEN
			bValid := FALSE;
		ELSIF (i MOD 2) = 0 THEN
			nSum := nSum + gUx.Answer[i] - 1;
		ELSE
			nSum := nSum + 5 - gUx.Answer[i];
		END_IF;
	END_FOR;
	IF bValid THEN
		gUx.Status.Sus := INT_TO_REAL(nSum) * 2.5;
	ELSE
		gUx.Status.Sus := 0.0;
	END_IF;
	gUx.Status.SusValid := bValid;

	(* 4. Teilnehmer speichern *)
	IF gUx.Cmd.SaveParticipant THEN
		IF bValid AND (nTask = 0) AND (nPart < 5) THEN
			stCur.Sus := gUx.Status.Sus;
			aResult[nPart] := stCur;
			nPart := nPart + 1;
			gUx.Status.SaveError := FALSE;
			(* für den nächsten Teilnehmer zurücksetzen *)
			FOR i := 0 TO 2 DO
				stCur.TaskOk[i] := FALSE;
				stCur.TaskTime[i] := 0.0;
			END_FOR;
			FOR i := 0 TO 9 DO
				gUx.Answer[i] := 0;
			END_FOR;
			nErrors := 0;
		ELSE
			gUx.Status.SaveError := TRUE;
		END_IF;
		gUx.Cmd.SaveParticipant := FALSE;
	END_IF;

	(* 5. Auswertung über alle Teilnehmer *)
	rSusSum := 0.0;
	nOk := 0;
	FOR t := 0 TO 2 DO
		aTimeSum[t] := 0.0;
		aTimeCnt[t] := 0;
	END_FOR;
	FOR p := 0 TO 4 DO
		IF p < nPart THEN
			rSusSum := rSusSum + aResult[p].Sus;
			FOR t := 0 TO 2 DO
				IF aResult[p].TaskOk[t] THEN
					nOk := nOk + 1;
					aTimeSum[t] := aTimeSum[t] + aResult[p].TaskTime[t];
					aTimeCnt[t] := aTimeCnt[t] + 1;
				END_IF;
			END_FOR;
		END_IF;
	END_FOR;
	IF nPart > 0 THEN
		gUx.Status.MeanSus := rSusSum / INT_TO_REAL(nPart);
		gUx.Status.CompletionRate := INT_TO_REAL(nOk) / INT_TO_REAL(nPart * 3) * 100.0;
	ELSE
		gUx.Status.MeanSus := 0.0;
		gUx.Status.CompletionRate := 0.0;
	END_IF;
	FOR t := 0 TO 2 DO
		IF aTimeCnt[t] > 0 THEN
			gUx.Status.MeanTime[t] := aTimeSum[t] / INT_TO_REAL(aTimeCnt[t]);
		ELSE
			gUx.Status.MeanTime[t] := 0.0;
		END_IF;
	END_FOR;

	gUx.Status.TaskRunning := nTask;
	gUx.Status.Errors := nErrors;
	gUx.Status.Participants := nPart;
END_PROGRAM
`;

const VAR_UX_SOL = `VAR
	nTask : INT;
	tonTask : TON;
	rTime : REAL;
	rtSlip : R_TRIG;
	nErrors : INT;
	bValid : BOOL;
	nSum : INT;
	i : INT;
	t : INT;
	p : INT;
	stCur : UxResult_typ;
	aResult : ARRAY[0..4] OF UxResult_typ;
	nPart : INT;
	rSusSum : REAL;
	nOk : INT;
	aTimeSum : ARRAY[0..2] OF REAL;
	aTimeCnt : ARRAY[0..2] OF INT;
END_VAR
`;

function answers(arr) { const s = {}; arr.forEach((v, i) => { s[`gUx.Answer[${i}]`] = v; }); return { set: s }; }
function task(id, ms, end) { return [{ set: { 'gUx.Cmd.StartTask': id } }, { cycles: 1 }, { ms }, { set: { 'gUx.Cmd.EndTask': end } }, { cycles: 1 }]; }

const EX_UX = {
  id: 'ex1', type: 'st', variant: 'schreiben',
  title: 'Messwerkzeug für einen Usability-Test: Aufgabenzeit, Fehler, SUS',
  task: `Bei einem moderierten Usability-Test bearbeiten Bediener definierte Aufgaben an der echten Maschinen-HMI („Rezept ‚Fein‘ laden“, „Alarm quittieren“, „Geschwindigkeit auf 70 % stellen“). Gemessen werden **Effektivität** (gelöst?), **Effizienz** (Zeit, Fehler) und **Zufriedenheit** (System Usability Scale, SUS). Ein kleines Messprogramm in der SPS zeichnet das direkt an der Maschine auf; der Moderator bedient es über eine eigene Testseite.

**Anforderungen**
1. **Aufgaben:** \`Cmd.StartTask\` (1…3) startet die Zeitmessung, wenn keine Aufgabe läuft (sonst ignoriert). \`Cmd.EndTask\` = 1 (gelöst) oder 2 (abgebrochen) beendet sie: Dauer in s in \`Status.LastTime\` und im Ergebnis des aktuellen Teilnehmers (Zeit und gelöst ja/nein je Aufgabe). Beide Kommandos werden auf 0 gesetzt. \`Status.TaskRunning\` zeigt die laufende Aufgabe.
2. **Bedienfehler:** Jede steigende Flanke von \`diSlip\` (z. B. abgewiesene Eingabe, Fehlklick) **während** einer Aufgabe erhöht \`Status.Errors\`.
3. **SUS:** \`Answer[0..9]\` mit Werten 1…5. Score = 2,5 × Σ, mit Item 1, 3, 5, 7, 9 (Index 0, 2, …): Antwort − 1, Item 2, 4, … (Index 1, 3, …): 5 − Antwort. Ein Wert außerhalb 1…5 → \`SusValid\` FALSE, \`Sus\` 0.
4. **Speichern:** \`Cmd.SaveParticipant\` speichert den Teilnehmer (max. 5), wenn SUS gültig ist und keine Aufgabe läuft; sonst \`SaveError\` TRUE. Danach werden Aufgaben-Ergebnisse, Fehler und Antworten (0) für den nächsten Teilnehmer zurückgesetzt. Kommando wird zurückgesetzt.
5. **Auswertung:** \`Participants\`, \`MeanSus\`, \`CompletionRate\` = gelöste Aufgaben / (3 × Teilnehmer) × 100, \`MeanTime[t]\` = mittlere Dauer der Aufgabe t+1 über alle Teilnehmer, die sie **gelöst** haben (0, wenn niemand).`,
  hints: [
    'Ein TON mit großem PT (T#1h) dient als Stoppuhr: TIME_TO_DINT(tonTask.ET) liefert Millisekunden.',
    'Typumwandlungen sind in AS6 explizit: DINT_TO_REAL, INT_TO_REAL.',
    'Alle Antworten 3 ergeben SUS 50, die „beste“ Kombination (ungerade 5, gerade 1) ergibt 100.'
  ],
  cycleMs: 10,
  io: [
    { name: 'gUx', type: 'UxHmi_typ', dir: 'in', writable: true, label: 'Testseite Moderator' },
    { name: 'diSlip', type: 'BOOL', dir: 'in', label: 'Bedienfehler erkannt (z. B. abgewiesene Eingabe)', widget: 'button' }
  ],
  files: {
    main: `PROGRAM _INIT

END_PROGRAM

PROGRAM _CYCLIC
	(* TODO: Zeitmessung, Fehler, SUS, Speichern, Auswertung *)
	nSum := 0;
	FOR i := 0 TO 9 DO
		nSum := nSum + gUx.Answer[i];
	END_FOR;
	gUx.Status.Sus := INT_TO_REAL(nSum) * 2.5;
END_PROGRAM
`,
    var: `VAR
	nSum : INT;
	i : INT;
END_VAR
`,
    typ: TYP_UX
  },
  solution: { main: MAIN_UX_SOL, var: VAR_UX_SOL, typ: TYP_UX },
  tests: [
    { name: 'SUS-Berechnung und Gültigkeit', steps: [
      answers([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]), { cycles: 2 },
      { expect: 'gUx.Status.SusValid AND ABS(gUx.Status.Sus - 50.0) < 0.01', msg: 'Alle Antworten 3 ergeben SUS 50.' },
      answers([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]), { cycles: 2 },
      { expect: 'ABS(gUx.Status.Sus - 100.0) < 0.01', msg: 'Ungerade Items 5, gerade Items 1 ergeben SUS 100.' },
      answers([4, 2, 4, 1, 5, 2, 4, 2, 3, 1]), { cycles: 2 },
      { expect: 'ABS(gUx.Status.Sus - 80.0) < 0.01', msg: 'Beispiel: (3+3+3+4+4+3+3+3+2+4) × 2,5 = 80.' },
      { set: { 'gUx.Answer[7]': 0 } }, { cycles: 2 },
      { expect: 'NOT gUx.Status.SusValid AND gUx.Status.Sus = 0.0', msg: 'Antwort 0 ist ungültig.' }
    ]},
    { name: 'Aufgabenzeit messen', steps: [
      ...task(1, 2000, 1),
      { expect: 'ABS(gUx.Status.LastTime - 2.0) < 0.05 AND gUx.Status.TaskRunning = 0', msg: 'Eine 2-s-Aufgabe muss ≈ 2,0 s ergeben.' },
      { expect: 'gUx.Cmd.StartTask = 0 AND gUx.Cmd.EndTask = 0', msg: 'Kommandos müssen zurückgesetzt werden.' },
      { set: { 'gUx.Cmd.StartTask': 2 } }, { cycles: 2 }, { ms: 500 },
      { set: { 'gUx.Cmd.StartTask': 3 } }, { cycles: 2 },
      { expect: 'gUx.Status.TaskRunning = 2', msg: 'Während eine Aufgabe läuft, darf keine andere starten.' }
    ]},
    { name: 'Bedienfehler nur während einer Aufgabe', steps: [
      { set: { diSlip: true } }, { cycles: 2 }, { set: { diSlip: false } }, { cycles: 2 },
      { expect: 'gUx.Status.Errors = 0', msg: 'Außerhalb einer Aufgabe zählt kein Fehler.' },
      { set: { 'gUx.Cmd.StartTask': 1 } }, { cycles: 2 },
      { set: { diSlip: true } }, { cycles: 5 }, { set: { diSlip: false } }, { cycles: 2 },
      { set: { diSlip: true } }, { cycles: 2 }, { set: { diSlip: false } }, { cycles: 2 },
      { expect: 'gUx.Status.Errors = 2', msg: 'Zwei Flanken während der Aufgabe = 2 Fehler.' }
    ]},
    { name: 'Speichern nur mit gültigem SUS und ohne laufende Aufgabe', steps: [
      { set: { 'gUx.Cmd.SaveParticipant': true } }, { cycles: 2 },
      { expect: 'gUx.Status.SaveError AND gUx.Status.Participants = 0 AND NOT gUx.Cmd.SaveParticipant', msg: 'Ohne gültigen Fragebogen darf nicht gespeichert werden.' },
      answers([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]),
      { set: { 'gUx.Cmd.StartTask': 1 } }, { cycles: 2 },
      { set: { 'gUx.Cmd.SaveParticipant': true } }, { cycles: 2 },
      { expect: 'gUx.Status.SaveError AND gUx.Status.Participants = 0', msg: 'Während einer Aufgabe darf nicht gespeichert werden.' },
      { set: { 'gUx.Cmd.EndTask': 1 } }, { cycles: 2 },
      { set: { 'gUx.Cmd.SaveParticipant': true } }, { cycles: 2 },
      { expect: 'NOT gUx.Status.SaveError AND gUx.Status.Participants = 1 AND gUx.Answer[0] = 0', msg: 'Gespeichert, Antworten für den nächsten Teilnehmer zurückgesetzt.' }
    ]},
    { name: 'Auswertung über zwei Teilnehmer', steps: [
      ...task(1, 2000, 1), ...task(2, 1000, 2), ...task(3, 3000, 1),
      answers([5, 1, 5, 1, 5, 1, 5, 1, 5, 1]),
      { set: { 'gUx.Cmd.SaveParticipant': true } }, { cycles: 2 },
      ...task(1, 4000, 1), ...task(2, 1000, 1), ...task(3, 1000, 2),
      answers([3, 3, 3, 3, 3, 3, 3, 3, 3, 3]),
      { set: { 'gUx.Cmd.SaveParticipant': true } }, { cycles: 2 },
      { expect: 'gUx.Status.Participants = 2 AND ABS(gUx.Status.MeanSus - 75.0) < 0.01', msg: 'SUS 100 und 50 ergeben Mittelwert 75.' },
      { expect: 'ABS(gUx.Status.CompletionRate - 66.667) < 0.1', msg: '4 von 6 Aufgaben gelöst = 66,7 %.' },
      { expect: 'ABS(gUx.Status.MeanTime[0] - 3.0) < 0.1', msg: 'Aufgabe 1: (2 s + 4 s) / 2 = 3 s.' },
      { expect: 'ABS(gUx.Status.MeanTime[1] - 1.0) < 0.1 AND ABS(gUx.Status.MeanTime[2] - 3.0) < 0.1', msg: 'Nur gelöste Aufgaben gehen in die mittlere Dauer ein.' }
    ]}
  ]
};

module.exports = [
  {
    id: 'hmi-6-designsystem',
    level: 6,
    kind: 'lektion',
    title: 'Styleguide und Design-System für eine Produktfamilie',
    summary: 'Du baust aus Themes, Styles, Widget-Bibliotheken und Regeln ein Design-System, das mehrere Maschinen und Kundenvarianten konsistent hält – mit automatischer Qualitätsprüfung.',
    minutes: 360,
    req: ['hmi-5-widgets-sicherheit'],
    briefing: 'Ein Styleguide beschreibt, wie Oberflächen aussehen und sich verhalten sollen. Ein Design-System geht weiter: Es liefert die Bausteine dazu – Design-Tokens (Farben, Abstände, Schriftgrößen als benannte Werte), Komponenten (in mapp View: Derived/Compound Widgets in einer Widget Library), Muster (z. B. „Parameter ändern mit Bestätigung“) und Regeln mit Begründung. Für eine Produktfamilie von Maschinen bedeutet das: ein Basis-Theme, Varianten für Kunden-CD und Bildschirmgrößen, eine versionierte Bibliothek und automatische Prüfungen. Du lernst Aufbau, Governance (wer darf was ändern?) und Prüfbarkeit eines solchen Systems.',
    practice: 'Ein Maschinenbauer mit zehn Maschinentypen, drei Panelgrößen und Kunden mit eigener CD verliert ohne Design-System schnell die Konsistenz: Jede Maschine bekommt ihre eigene Quittiertaste, Farben driften, Service und Schulung werden teurer.',
    transfer: {
      tia: 'In TIA Portal entspricht das Bibliotheken mit Typen (Faceplates, HMI-Styles) und „Style Sheets“ in WinCC Unified; Konzernbibliotheken werden zentral versioniert verteilt.',
      codesys: 'In CODESYS nutzt du Visualisierungsstile, Bibliotheken mit Visualisierungsbausteinen und den Bibliotheksverwalter für die Versionierung.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Unterscheide Styleguide und Design-System und lege den Umfang fest',
        guide: {
          intro: 'Ein Styleguide ist Dokumentation; ein Design-System ist ein gepflegtes Produkt aus Tokens, Komponenten, Mustern und Regeln mit eigener Versionierung.',
          steps: [
            'Lies „Design Systems vs. Style Guides“ (NN/g) und den B&R Style Guide für Visualisierungen.',
            'Liste die Bausteine deines Systems: Tokens (Farben, Abstände, Schriftgrößen), Komponenten (Widgets), Muster (Dialoge, Bestätigungen, Alarmanzeige), Inhalte (Begriffe, Meldungstexte).',
            'Lege fest, welche Maschinen und Varianten das System abdecken soll (Panelgrößen, Kunden-CD, Sprachen).',
            'Definiere Governance: Wer schlägt Änderungen vor, wer entscheidet, wie wird versioniert und kommuniziert?',
            'Halte das als „Design-System-Charta“ (eine Seite) im Repository fest.'
          ],
          done: 'Erledigt, wenn eine Charta mit Bausteinen, Geltungsbereich und Governance vorliegt.',
          tip: 'Begründe jede Regel („Rot nur für Alarme, weil …“). Regeln ohne Begründung werden beim ersten Kundenwunsch gebrochen.'
        }
      },
      {
        id: 'o2',
        title: 'Strukturiere Tokens, Themes und Varianten in mapp View',
        guide: {
          intro: 'Tokens werden in mapp View als Styles in Themes umgesetzt. Ein Basis-Theme enthält alle Tokens, Varianten-Themes überschreiben nur Abweichungen.',
          steps: [
            'Lege ein Basis-Theme an und definiere Styles für alle Zustands-Tokens (neutral, Betrieb, Warnung, Alarm, ungültig, disabled).',
            'Erzeuge Varianten-Themes (z. B. Kunden-CD, Dark-Theme für Leitstände) und ändere nur, was nötig ist.',
            'Lege Abstands- und Größenregeln für Touch-Ziele und Schriftgrößen je Panelklasse fest.',
            'Verwende in allen Projekten ausschließlich Widgets aus der Widget Library, die ihre Styles aus dem Theme beziehen.',
            'Schalte das Theme zur Laufzeit um und prüfe alle Seiten.'
          ],
          done: 'Erledigt, wenn ein Basis-Theme und mindestens eine Variante existieren und eine Seite in beiden Themes korrekt aussieht.',
          tip: 'Benenne Tokens nach Bedeutung („StateAlarm“), nicht nach Aussehen („RedBig“). Dann kann sich das Aussehen ändern, ohne dass die Namen lügen.',
          link: brLink('Erstellen eines Themes', 'visualization/mappview/engineering/themesandstyles/createtheme.html')
        }
      },
      {
        id: 'o3',
        title: 'Automatisiere die Qualitätsprüfung des Design-Systems',
        guide: {
          intro: 'Varianten dürfen die Lesbarkeit nicht verschlechtern. Ein automatischer Kontrast-Check fängt das vor der Auslieferung ab.',
          steps: [
            'Übertrage die Zustands-Tokens deines Themes in eine Tabelle (Text-/Hintergrundfarbe je Token).',
            'Implementiere die WCAG-Kontrastformel (Übung) und prüfe jedes Token jeder Variante.',
            'Lege fest, welcher Mindestkontrast gilt (z. B. 4,5:1, für Leitstände strenger).',
            'Löse die Übung und dokumentiere gefundene Verstöße deines eigenen Themes.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung grün sind und dein Theme ohne Kontrastverstöße ist.',
          tip: 'Prüfe auch „disabled“-Zustände: Die sind oft absichtlich blass – aber Text muss trotzdem lesbar bleiben.',
          link: { label: 'W3C: WCAG 2.2', url: 'https://www.w3.org/TR/WCAG22/' }
        }
      },
      {
        id: 'o4',
        title: 'Dokumentiere und verteile das System',
        guide: {
          intro: 'Ein Design-System lebt von guter Dokumentation und kontrollierter Verteilung.',
          steps: [
            'Dokumentiere je Komponente: Zweck, Eigenschaften, Zustände, Do/Don’t, Beispiel-Screenshot.',
            'Versioniere Widget Library und Themes gemeinsam (z. B. `ds-2.3.0`) und führe ein Changelog.',
            'Lege einen Migrationsleitfaden für Major-Versionen an.',
            'Präsentiere das System im Team und sammle Feedback für die nächste Version.'
          ],
          done: 'Erledigt, wenn Dokumentation, Changelog und eine getaggte Version im Repository liegen.',
          tip: 'Öffentliche Design-Systeme (z. B. das U.S. Web Design System) zeigen, wie Dokumentation von Komponenten mit Begründungen aussehen kann.'
        }
      }
    ],
    videos: [
      { id: '5BgKwkpJQdE', title: 'Design Systems vs. Style Guides', channel: 'NNgroup', lang: 'en', why: 'Klärt den Unterschied zwischen Styleguide und Design-System.' },
      { id: '4BWqhtdzsT8', title: 'My Definition of Design Systems', channel: 'Dan Mall', lang: 'en', why: 'Praxisnahe Definition von Design-Systemen durch einen bekannten Berater.' },
      { id: 'Beg5aEHkqLA', title: 'UI Template for mappView - Dark and light themes in your HMI project', channel: 'AGD LAB', lang: 'en', why: 'Zeigt Theme-Varianten in einem mapp View-Projekt – die technische Grundlage für Token-Varianten.' }
    ],
    readings: [
      { title: 'Design Systems 101', author: 'Fessenden, T.', institution: 'Nielsen Norman Group', work: 'NN/g Articles', year: 2021, type: 'Artikel', minutes: 20, url: 'https://www.nngroup.com/articles/design-systems-101/', why: 'Grundbegriffe: Styleguide, Komponentenbibliothek, Pattern Library und deren Zusammenspiel.', apa: 'Fessenden, T. (2021). *Design systems 101*. Nielsen Norman Group. ' + ABGERUFEN + 'https://www.nngroup.com/articles/design-systems-101/' },
      { title: 'Design Systems vs. Style Guides', author: 'Gordon, K.', institution: 'Nielsen Norman Group', work: 'NN/g Articles', year: 2024, type: 'Artikel', minutes: 15, url: 'https://www.nngroup.com/articles/design-systems-vs-style-guides/', why: 'Abgrenzung und Einsatzzweck von Styleguide und Design-System.', apa: 'Gordon, K. (2024). *Design systems vs. style guides*. Nielsen Norman Group. ' + ABGERUFEN + 'https://www.nngroup.com/articles/design-systems-vs-style-guides/' },
      { title: 'U.S. Web Design System (USWDS)', author: 'General Services Administration', institution: 'U.S. General Services Administration', work: 'USWDS', year: 'o. J.', type: 'Norm/Amtlich', minutes: 30, url: 'https://designsystem.digital.gov/', why: 'Öffentlich dokumentiertes Design-System einer Behörde: Tokens, Komponenten, Begründungen und Barrierefreiheit.', apa: 'U.S. General Services Administration. (o. J.). *U.S. web design system*. ' + ABGERUFEN + 'https://designsystem.digital.gov/' }
    ],
    quiz: [
      { type: 'single', q: 'Was unterscheidet ein Design-System von einem Styleguide?', options: ['Nichts, es sind Synonyme', 'Ein Design-System liefert neben Regeln auch wiederverwendbare Bausteine (Tokens, Komponenten, Muster) und wird als Produkt gepflegt', 'Ein Styleguide enthält Code, ein Design-System nur Bilder', 'Ein Design-System gilt nur für Webseiten'], correct: 1, explain: 'Der Styleguide ist ein Teil davon; das Design-System umfasst Bausteine, Dokumentation und Governance.' },
      { type: 'numeric', q: 'Zwei Farben haben die relativen Leuchtdichten L1 = {a} und L2 = 0,05. Wie groß ist das Kontrastverhältnis?', params: { a: [0.2, 1.0, 0.05] }, formula: '(a + 0.05) / (0.05 + 0.05)', unit: ':1', tol: 0.01, explain: 'Kontrast = (L_hell + 0,05) / (L_dunkel + 0,05).' },
      { type: 'single', q: 'Wie sollten Tokens benannt werden?', options: ['Nach Aussehen, z. B. „RedBig“', 'Nach Bedeutung, z. B. „StateAlarm“', 'Nach dem Entwickler', 'Fortlaufend nummeriert ohne Namen'], correct: 1, explain: 'Bedeutungsnamen bleiben richtig, auch wenn sich das Aussehen ändert.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Bausteine gehören zu einem Design-System für eine HMI-Produktfamilie?', options: ['Design-Tokens (Farben, Abstände, Schriftgrößen)', 'Komponenten in einer versionierten Widget Library', 'Muster mit Begründung (z. B. Bestätigungsdialog)', 'Die SPS-Firmware'], correct: [0, 1, 2], explain: 'Firmware ist kein Bestandteil des Gestaltungssystems.' },
      { type: 'single', q: 'Eine Kundenvariante ändert die Betriebsfarbe auf ein helleres Grün; weiße Schrift erreicht nur 3,5:1. Was tust du?', options: ['Akzeptieren, der Kunde will es so', 'Textfarbe oder Grünton anpassen, bis der Mindestkontrast erreicht ist, und die Regel begründen', 'Den Kontrast-Check abschalten', 'Nur im Dark-Theme ausliefern'], correct: 1, explain: 'Das Design-System schützt die Lesbarkeit; der Check macht den Konflikt sichtbar, die Lösung respektiert CD und Regel.' },
      { type: 'single', q: 'Welche Versionsänderung ist für eine Widget Library ein Major-Update?', options: ['Neue optionale Eigenschaft', 'Fehlerbehebung im Styling', 'Umbenennen einer Eigenschaft, die Projekte binden', 'Neues Icon'], correct: 2, explain: 'Umbenennen bricht bestehende Bindings – das ist eine inkompatible Änderung.' },
      { type: 'single', q: 'Warum gehört Governance zu einem Design-System?', options: ['Damit Änderungen kontrolliert, begründet und kommuniziert erfolgen und Projekte nicht auseinanderdriften', 'Weil sonst die Lizenz erlischt', 'Damit nur Admins Widgets nutzen dürfen', 'Weil mapp View es verlangt'], correct: 0, explain: 'Ohne Prozess für Änderungen entstehen schnell lokale Abweichungen – das Gegenteil von Konsistenz.' }
    ],
    exercises: [EX_DS],
    proof: false
  },

  {
    id: 'hmi-6-projekt-usability',
    level: 6,
    kind: 'projekt',
    title: 'Praxisprojekt: Usability-Test einer Maschinen-HMI',
    summary: 'Du planst, führst durch und wertest einen Usability-Test an einer realen mapp View-Oberfläche aus – mit Aufgaben, Messwerten, SUS-Fragebogen und priorisierten Verbesserungen.',
    minutes: 480,
    req: ['hmi-6-designsystem'],
    briefing: 'Ob eine HMI gut ist, entscheiden nicht ihre Entwickler, sondern ihre Bediener. Ein Usability-Test macht das messbar: Echte Nutzer bearbeiten realistische Aufgaben, du beobachtest (Thinking Aloud) und misst Effektivität (gelöst?), Effizienz (Zeit, Fehler) und Zufriedenheit (z. B. System Usability Scale). Nach Nielsen findet man mit etwa fünf Testpersonen je Nutzergruppe einen Großteil der Probleme; wichtiger als große Zahlen sind Iterationen. Die Grundsätze aus DIN EN ISO 9241 (Gebrauchstauglichkeit, Dialoggestaltung) dienen als Orientierung für Testkriterien. Du entwickelst zusätzlich ein Messprogramm in ST, das Zeiten, Bedienfehler und SUS direkt an der Maschine erfasst.',
    practice: 'Nach der Inbetriebnahme beim Kunden zeigen sich Bedienprobleme meist erst im Schichtbetrieb. Ein Test mit fünf Bedienern vor der Auslieferung kostet einen Tag – und verhindert Monate an Supportanfragen und Fehlbedienungen.',
    transfer: {
      tia: 'Werkzeugunabhängig: Usability-Tests funktionieren an WinCC-Oberflächen genauso. Messwerte lassen sich auch dort über Skripte bzw. Datenlogs erfassen.',
      codesys: 'Werkzeugunabhängig: Die Methode gilt für jede HMI; die Messlogik kann in CODESYS identisch in ST umgesetzt werden.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Plane den Test: Ziele, Nutzergruppen, Aufgaben',
        guide: {
          intro: 'Ein guter Test beginnt mit klaren Fragen: Was willst du herausfinden, mit wem, und an welchen Aufgaben?',
          steps: [
            'Formuliere 2–3 Testziele (z. B. „Finden Bediener die Rezeptverwaltung ohne Hilfe?“).',
            'Definiere die Nutzergruppen (Bediener, Einrichter, Instandhaltung) und rekrutiere ca. fünf Personen je Gruppe, die nicht an der Entwicklung beteiligt waren.',
            'Schreibe 3–5 realistische Aufgaben ohne Hinweise auf Menünamen („Die nächste Charge soll mit dem Rezept ‚Fein‘ laufen.“).',
            'Lege Erfolgskriterien und Abbruchkriterien je Aufgabe fest (max. Zeit, Hilfe nötig).',
            'Erstelle Leitfaden und Einverständniserklärung (Datenschutz, freiwillige Teilnahme, Bewertung der HMI, nicht der Person).'
          ],
          done: 'Erledigt, wenn ein Testplan mit Zielen, Nutzergruppen, Aufgaben und Kriterien vorliegt.',
          tip: 'Sag den Teilnehmenden ausdrücklich: „Wir testen die Oberfläche, nicht Sie.“ Das reduziert Stress und liefert ehrlichere Ergebnisse.',
          link: { label: 'NN/g: Usability (User) Testing 101', url: 'https://www.nngroup.com/articles/usability-testing-101/' }
        }
      },
      {
        id: 'o2',
        title: 'Baue das Messwerkzeug in ST und eine Moderatorseite',
        guide: {
          intro: 'Die SPS misst Aufgabenzeiten und Bedienfehler direkt an der Maschine; der Moderator steuert den Test über eine eigene, nur für ihn sichtbare Seite.',
          steps: [
            'Löse die Übung (Aufgabenzeit, Bedienfehler, SUS, Auswertung).',
            'Lege eine mapp View-Seite für den Moderator an (eigene Rolle), mit Start/Ende je Aufgabe und dem SUS-Fragebogen (10 Items, Skala 1–5).',
            'Verbinde `diSlip` mit echten Fehlersignalen, z. B. abgewiesenen Kommandos (LastDenied, Result ≠ 0) aus deinen früheren Modulen.',
            'Teste das Werkzeug mit einem Kollegen in einem Probedurchlauf.'
          ],
          done: 'Erledigt, wenn alle Tests der Übung grün sind und ein Probedurchlauf Messwerte geliefert hat.',
          tip: 'Abgewiesene Kommandos sind ein objektiver Indikator für Missverständnisse – oft aufschlussreicher als die Gesamtzeit.'
        }
      },
      {
        id: 'o3',
        title: 'Führe den Test moderiert mit lautem Denken durch',
        guide: {
          intro: 'Beim Thinking Aloud sprechen Teilnehmende aus, was sie denken. Der Moderator hilft nicht, sondern beobachtet und fragt neutral nach.',
          steps: [
            'Begrüße, erkläre Ablauf und Thinking Aloud, hole die Einverständniserklärung ein.',
            'Stelle die Aufgaben einzeln, starte und beende die Zeitmessung über die Moderatorseite.',
            'Notiere Beobachtungen wörtlich (Zitate) und markiere Stellen, an denen gezögert oder falsch navigiert wird.',
            'Lass nach den Aufgaben den SUS-Fragebogen ausfüllen und speichere den Teilnehmer.',
            'Frage zum Schluss offen: „Was hat Sie am meisten gestört?“'
          ],
          done: 'Erledigt, wenn mindestens fünf Teilnehmende den Test vollständig durchlaufen haben und ihre Daten gespeichert sind.',
          tip: 'Auf Fragen der Teilnehmenden antwortest du mit einer Gegenfrage („Was würden Sie erwarten?“) – sonst testest du deine Erklärung statt der HMI.',
          link: { label: 'NN/g: Thinking Aloud', url: 'https://www.nngroup.com/articles/thinking-aloud-the-1-usability-tool/' }
        }
      },
      {
        id: 'o4',
        title: 'Werte aus, priorisiere und weise nach',
        guide: {
          intro: 'Aus Beobachtungen und Messwerten werden priorisierte Befunde mit konkreten Verbesserungen.',
          steps: [
            'Fasse die Messwerte zusammen: Erfolgsquote je Aufgabe, mittlere Zeiten, Fehler, mittlerer SUS.',
            'Gruppiere Beobachtungen zu Befunden und ordne jedem einen Schweregrad zu (z. B. kosmetisch, gering, schwer, kritisch) und den verletzten Grundsatz (ISO 9241-110 bzw. Heuristik).',
            'Leite für die drei schwersten Befunde konkrete Änderungen ab und setze mindestens eine davon um.',
            'Plane einen Folgetest für die geänderte Version.',
            'Lege Testplan, anonymisierte Ergebnisse, Befundliste und Änderungen im Repository ab und reiche den Link ein.'
          ],
          done: 'Erledigt, wenn der Link eingereicht ist und Testplan, anonymisierte Auswertung, priorisierte Befundliste und mindestens eine umgesetzte Verbesserung enthält.',
          tip: 'Anonymisiere konsequent (P1–P5 statt Namen). Testergebnisse sind keine Leistungsbewertung von Mitarbeitenden.'
        }
      }
    ],
    videos: [
      { id: '1UCDUOB_aS8', title: 'Usability Test Demo by Steve Krug', channel: 'Steve Krug', lang: 'en', why: 'Kompletter moderierter Usability-Test als Vorbild für Ablauf und Moderation.' },
      { id: 'EE5eyEC2jRg', title: 'User Experience – Einführung Tutorial: Usability-Test |video2brain.com', channel: 'Business Tutorials', lang: 'de', why: 'Deutschsprachige Einführung in Planung und Durchführung von Usability-Tests.' },
      { id: '2vhBVf_hmwo', title: '10 Usability Heuristiken nach Nielsen & Molich', channel: 'Indra Burkart', lang: 'de', why: 'Heuristiken als Raster, um Befunde einzuordnen.' }
    ],
    readings: [
      { title: 'Usability-Methodik in der Technischen Dokumentation: Lernmaterial für Methoden der Usability zur Qualitätssicherung und nutzerzentrierten Entwicklung, mit Übungsaufgaben', author: 'Koch, L.', institution: 'Share_it – Open-Access-Repositorium der Hochschulen in Sachsen-Anhalt', work: 'Masterarbeit (Lernmaterial)', year: 'o. J.', type: 'Uni-Skript', minutes: 60, url: 'https://opendata.uni-halle.de/bitstream/1981185920/13160/1/KochLucas_Usability_Methodik.pdf', why: 'Deutschsprachiges Hochschul-Lernmaterial zu Usability-Methoden inklusive Thinking-Aloud-Test und Styleguide, mit Übungsaufgaben.', apa: 'Koch, L. (o. J.). *Usability-Methodik in der Technischen Dokumentation: Lernmaterial für Methoden der Usability zur Qualitätssicherung und nutzerzentrierten Entwicklung, mit Übungsaufgaben* [Masterarbeit]. Share_it. ' + ABGERUFEN + 'https://opendata.uni-halle.de/bitstream/1981185920/13160/1/KochLucas_Usability_Methodik.pdf' },
      { title: 'Why You Only Need to Test with 5 Users', author: 'Nielsen, J.', institution: 'Nielsen Norman Group', work: 'NN/g Articles', year: 2000, type: 'Artikel', minutes: 15, url: 'https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/', why: 'Begründet, warum kleine, iterative Tests mit ca. fünf Personen je Nutzergruppe effizient sind.', apa: 'Nielsen, J. (2000). *Why you only need to test with 5 users*. Nielsen Norman Group. ' + ABGERUFEN + 'https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/' },
      { title: 'Using moderated usability testing', author: 'Government Digital Service', institution: 'GOV.UK', work: 'Service Manual', year: 'o. J.', type: 'Norm/Amtlich', minutes: 15, url: 'https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing', why: 'Amtlicher Leitfaden zur Vorbereitung, Moderation und Auswertung moderierter Tests.', apa: 'Government Digital Service. (o. J.). *Using moderated usability testing*. GOV.UK Service Manual. ' + ABGERUFEN + 'https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing' }
    ],
    quiz: [
      { type: 'single', q: 'Wie viele Testpersonen je Nutzergruppe empfiehlt Nielsen für einen qualitativen Usability-Test, bevor iteriert wird?', options: ['1', 'Etwa 5', 'Mindestens 50', '500'], correct: 1, explain: 'Mit etwa fünf Personen findet man einen Großteil der Probleme; danach lohnt sich eine Iteration mehr als weitere Personen.' },
      { type: 'numeric', q: 'Ein Teilnehmer beantwortet alle zehn SUS-Items mit {x}. Welcher SUS-Score ergibt sich?', params: { x: [1, 5, 1] }, formula: '((x - 1) * 5 + (5 - x) * 5) * 2.5', unit: 'Punkte', tol: 0.001, explain: 'Ungerade Items: x − 1, gerade Items: 5 − x; je 5 Items; Summe × 2,5. Gleiche Antworten auf alle Items ergeben immer 50.' },
      { type: 'single', q: 'Ein Teilnehmer fragt während einer Aufgabe: „Wo finde ich die Rezepte?“ Was antwortest du als Moderator?', options: ['„Unter Menü › Rezept.“', '„Was würden Sie erwarten?“', '„Das ist doch einfach.“', 'Du übernimmst die Bedienung.'], correct: 1, explain: 'Neutral zurückfragen – sonst testest du deine Hilfe statt der Oberfläche.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Messgrößen beschreiben Gebrauchstauglichkeit im Sinne von DIN EN ISO 9241-11 (Orientierung)?', options: ['Effektivität (Aufgabe gelöst?)', 'Effizienz (Zeit, Aufwand, Fehler)', 'Zufriedenheit (z. B. SUS)', 'Anzahl der Widgets pro Seite'], correct: [0, 1, 2], explain: 'Gebrauchstauglichkeit = Effektivität, Effizienz und Zufriedenheit im Nutzungskontext.' },
      { type: 'numeric', q: 'Von {p} Teilnehmenden lösen {k} eine Aufgabe. Wie hoch ist die Erfolgsquote?', params: { p: [5, 10, 1], k: [1, 5, 1] }, formula: 'k / p * 100', unit: '%', tol: 0.01, explain: 'Erfolgsquote = gelöst / Teilnehmende × 100.' },
      { type: 'single', q: 'Warum gehen in der Übung nur gelöste Aufgaben in die mittlere Dauer ein?', options: ['Weil abgebrochene Aufgaben die Zeit verfälschen (Abbruch nach Frust oder Zeitlimit) und separat über die Erfolgsquote erfasst werden', 'Weil abgebrochene Aufgaben keine Zeit haben', 'Weil der TON sonst überläuft', 'Weil das die Norm verbietet'], correct: 0, explain: 'Effektivität und Effizienz werden getrennt betrachtet, sonst vermischen sich zwei Aussagen.' },
      { type: 'single', q: 'Wie formulierst du eine gute Testaufgabe?', options: ['„Klicken Sie auf Menü › Rezept › Laden.“', '„Die nächste Charge soll mit dem Rezept ‚Fein‘ laufen. Bereiten Sie die Maschine vor.“', '„Testen Sie die Rezeptseite.“', '„Finden Sie Fehler.“'], correct: 1, explain: 'Realistisches Ziel ohne Lösungsweg und ohne Menübegriffe – sonst misst du Lesen statt Bedienen.' }
    ],
    exercises: [EX_UX],
    proof: true,
    badge: 'HMI-Usability-Engineer'
  }
];
