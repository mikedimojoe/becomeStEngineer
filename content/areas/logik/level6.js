// Steuerungslogik – Level 6 (Guru → Prüfung Genie)
'use strict';
const { vid, br, R } = require('./_src');

const nevers = (expr, n, msg) => Array.from({ length: n }, () => ({ never: expr, msg }));
const pulse = (v) => [{ set: { [v]: true } }, { cycles: 2 }, { set: { [v]: false } }];

const SEQ_TYP = `TYPE
	eStepCond : (COND_NONE, COND_TIME, COND_IN_HIGH, COND_IN_LOW);
	stStep : STRUCT
		bOut : ARRAY[0..3] OF BOOL;   (* Ausgänge in diesem Schritt *)
		eCond : eStepCond;            (* Weiterschaltbedingung *)
		nInput : INT;                 (* Eingang 0..3 für COND_IN_* *)
		tTime : TIME;                 (* Zeit für COND_TIME *)
		tTimeout : TIME;              (* Überwachung, T#0s = keine *)
		nNext : INT;                  (* 0 = nächster Schritt, -1 = Ende, sonst Sprungziel *)
	END_STRUCT;
END_TYPE
`;

const SEQ_INIT = `PROGRAM _INIT
	(* Ablaufrezept „Bohrzyklus“ – Daten statt Code *)
	aSteps[1].bOut[0] := TRUE;                       (* Spannen *)
	aSteps[1].eCond := COND_IN_HIGH;
	aSteps[1].nInput := 0;                           (* gespannt *)
	aSteps[1].tTimeout := T#2s;

	aSteps[2].bOut[0] := TRUE;                       (* Bohren *)
	aSteps[2].bOut[1] := TRUE;
	aSteps[2].eCond := COND_IN_HIGH;
	aSteps[2].nInput := 1;                           (* Bohrtiefe erreicht *)
	aSteps[2].tTimeout := T#3s;

	aSteps[3].bOut[0] := TRUE;                       (* Bohrer zurück *)
	aSteps[3].eCond := COND_IN_HIGH;
	aSteps[3].nInput := 2;                           (* Bohrer oben *)
	aSteps[3].tTimeout := T#3s;

	aSteps[4].bOut[0] := TRUE;                       (* Ausblasen *)
	aSteps[4].bOut[2] := TRUE;
	aSteps[4].eCond := COND_TIME;
	aSteps[4].tTime := T#500ms;

	aSteps[5].eCond := COND_IN_LOW;                  (* Entspannen *)
	aSteps[5].nInput := 0;
	aSteps[5].tTimeout := T#2s;
	aSteps[5].nNext := -1;                           (* Ende des Zyklus *)
END_PROGRAM
`;

const SEQ_PATCH = `	(* Rezeptänderung vom HMI (Simulation): Sprungziel von Schritt 2 *)
	IF nPatchNext <> 0 THEN
		aSteps[2].nNext := nPatchNext;
	END_IF
`;

const SEQ_PLANT = {
  var: 'VAR\n\trClamp : REAL;\n\trDepth : REAL;\nEND_VAR\n',
  code: `IF doOut0 THEN
	rClamp := rClamp + 4.0 * PLANT_DT;
ELSE
	rClamp := rClamp - 4.0 * PLANT_DT;
END_IF
rClamp := LIMIT(0.0, rClamp, 1.0);
IF NOT diJam THEN
	IF doOut1 THEN
		rDepth := rDepth + 1.0 * PLANT_DT;
	ELSE
		rDepth := rDepth - 2.0 * PLANT_DT;
	END_IF
END_IF
rDepth := LIMIT(0.0, rDepth, 1.0);
diIn0 := rClamp >= 0.99;
diIn1 := rDepth >= 0.99;
diIn2 := rDepth <= 0.01;
`
};

const FILL_PLANT = {
  var: 'VAR\n\trW : REAL;\nEND_VAR\n',
  code: `IF doEject THEN
	rW := 0.0;
ELSE
	IF doValveFast THEN
		rW := rW + 200.0 * PLANT_DT;
	END_IF
	IF doValveFine THEN
		rW := rW + 20.0 * PLANT_DT;
	END_IF
END_IF
rW := LIMIT(0.0, rW, 1000.0);
aiWeight := REAL_TO_INT(rW * 32.767);
`
};

const FILL_TYP = 'TYPE\n\teFill : (FILL_IDLE, FILL_FAST, FILL_FINE, FILL_SETTLE, FILL_EJECT);\nEND_TYPE\n';

module.exports = [
  // ===================================================================
  {
    id: 'logik-6-framework',
    level: 6,
    kind: 'lektion',
    title: 'Framework-Design, datengetriebene Abläufe und Code-Generierung',
    summary: 'Du entwirfst eine generische, datengetriebene Ablauf-Engine mit Konfigurationsprüfung und lernst, wie Templates und Code-Generierung Projekte skalierbar machen.',
    minutes: 300,
    req: ['logik-5-projekt-robust'],
    briefing: 'Auf der höchsten Stufe baust du nicht mehr Maschinen, sondern die Werkzeuge, mit denen andere Maschinen bauen: Frameworks, Bibliotheken, Templates und Generatoren. Ein Framework trennt das Wiederkehrende (Zustandsmodell, Fehlerbehandlung, Diagnose, HMI-Anbindung) vom Maschinenspezifischen. Ein mächtiges Muster ist die datengetriebene Ablaufsteuerung: Statt jeden Ablauf als CASE-Kette zu programmieren, beschreibt eine Tabelle die Schritte und eine getestete Engine führt sie aus. Das verschiebt Fehler von der Laufzeit in die Konfigurationsprüfung – deshalb muss das Framework seine Eingabedaten validieren. Code-Generierung (Templates, Code-Snippets, Generatoren aus Engineering-Daten) reduziert Tipparbeit, verlangt aber Disziplin: Generierter Code wird nie von Hand geändert.',
    practice: 'Maschinenbauer mit vielen Varianten konfigurieren Abläufe pro Kundenauftrag aus Daten. Ein Fehler in der Engine trifft alle Maschinen – ein Fehler in einer Konfiguration nur eine, wenn die Validierung ihn findet.',
    transfer: {
      tia: 'Siemens setzt mit TIA Openness und SiVArc auf Code-Generierung aus Engineering-Daten; Bibliothekstypen mit Versionierung entsprechen den B&R-Bibliotheken.',
      codesys: 'CODESYS bietet Scripting (Python) und den Application Composer für generierte Projekte; TwinCAT Automation Interface erlaubt Generierung aus C#/PowerShell.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Trenne Framework und Anwendung',
        guide: {
          intro: 'Ein Framework stellt die Struktur bereit, die Anwendung füllt sie.',
          steps: [
            'Analysiere zwei deiner bisherigen Projekte: Welche Teile sind identisch (Betriebsarten, Fehler, Zustandsmodell), welche maschinenspezifisch?',
            'Formuliere die Erweiterungspunkte des Frameworks: Wo „steckt“ die Anwendung ihren Code bzw. ihre Daten hinein?',
            'Lege Regeln fest: Das Framework ruft die Anwendung auf, nie umgekehrt; die Anwendung greift nicht in Framework-Interna.',
            'Lege das Framework als versionierte Anwenderbibliothek an.'
          ],
          done: 'Erledigt, wenn du ein Diagramm hast, das Framework-Kern, Erweiterungspunkte und Anwendungsteile trennt.',
          tip: 'Abstrahiere erst nach dem dritten ähnlichen Fall. Ein Framework aus einem einzigen Beispiel passt meist auf kein zweites.'
        }
      },
      {
        id: 'o2',
        title: 'Baue eine datengetriebene Ablauf-Engine',
        guide: {
          intro: 'Die Schrittkette wird zur Tabelle (Array of Struct), die Engine interpretiert sie.',
          steps: [
            'Definiere die Schrittstruktur: Ausgänge, Weiterschaltbedingung, Parameter, Überwachungszeit, Folgeschritt.',
            'Programmiere die Engine generisch – kein Schritt-spezifischer Code.',
            'Behandle unbekannte Bedingungen und Timeouts als Fehler mit Schrittnummer.',
            'Teste die Engine mit mehreren Rezepten, nicht nur mit einem.'
          ],
          done: 'Erledigt, wenn ein neuer Ablauf nur durch neue Daten entsteht, ohne die Engine zu ändern.',
          tip: 'Datengetriebene Abläufe sind ideal für Variantenvielfalt – aber schwerer zu debuggen. Gib der Engine deshalb gute Diagnose (aktueller Schritt, Grund des Wartens).'
        }
      },
      {
        id: 'o3',
        title: 'Validiere Konfigurationsdaten',
        guide: {
          intro: 'Jede Eingabe in ein Framework ist potenziell falsch – vom HMI, aus einer Datei oder von einem Kollegen.',
          steps: [
            'Liste alle Invarianten: Sprungziele im gültigen Bereich, Zielschritte konfiguriert, Eingangsnummern gültig, Zeiten > 0.',
            'Prüfe sie vor dem Start und nach jeder Änderung.',
            'Starte nicht mit ungültiger Konfiguration und melde, was falsch ist.',
            'Schütze Array-Zugriffe zusätzlich zur Validierung (Defense in Depth).'
          ],
          done: 'Erledigt, wenn eine fehlerhafte Konfiguration erkannt wird, bevor sie einen Laufzeitfehler auslöst.',
          tip: 'Ein Laufzeitfehler durch Array-Überlauf bringt die Runtime in den Servicemodus – das ist an einer Produktionsmaschine teurer als jede Validierung.'
        }
      },
      {
        id: 'o4',
        title: 'Nutze Templates und Code-Generierung in AS6',
        guide: {
          intro: 'AS6 bietet Code-Snippets und Vorlagedateien; Generatoren außerhalb von AS erzeugen ganze Module aus Daten.',
          steps: [
            'Öffne den Code Snippet Manager und lege ein Snippet für dein Standard-FB-Gerüst an; einfügen im Editor mit Strg+Q, K.',
            'Lege Vorlagedateien für neue Programme fest (Kopfkommentar, Struktur), siehe B&R-Hilfe „Vorlagedateien“.',
            'Skizziere einen Generator: Aus einer Geräteliste (CSV) entstehen Instanzen, I/O-Zuordnung und Variablen.',
            'Kennzeichne generierte Dateien eindeutig und generiere sie im Build neu, statt sie zu bearbeiten.'
          ],
          done: 'Erledigt, wenn du ein eigenes Snippet nutzt und einen Generator-Entwurf dokumentiert hast.',
          tip: 'Generierter Code gehört nicht ins Code-Review, der Generator und seine Eingabedaten schon.',
          link: { label: 'B&R Help: Code Snippet Manager', url: 'https://help.br-automation.com/#/de/6/projectmanagement/desktop_codesnippetmanager.html' }
        }
      }
    ],
    videos: [
      vid('8LqPtQLzB0c', 'en', 'Modulare Softwareentwicklung und Code-Generierung in großen SPS-Projekten.'),
      vid('4n6l8NFlWi8', 'en', 'Software-Engineering-Praktiken (Editor, Versionierung, Automatisierung) für Automatisierungsprojekte.'),
      vid('AyM09VVWR4s', 'en', 'B&R zeigt die Anbindung von KI-Agenten an Automation Studio – ein Ausblick auf generative Werkzeuge.')
    ],
    readings: [
      br('programming/general/smartedit/editors_general_smartedit_codesnippets.html', 'Code Snippets', 'Code-Snippets in den AS-Editoren anlegen und einfügen.', 10),
      br('programming/guidelines/layout/projectorganisation_layout_templates.html', 'Vorlagedateien', 'Vorlagen für neue Dateien und Objekte in AS.', 10),
      R.koziolek
    ],
    quiz: [
      { type: 'single', q: 'Was ist der wichtigste Vorteil einer datengetriebenen Ablauf-Engine?',
        options: ['Sie ist schneller als CASE', 'Neue Abläufe entstehen durch Daten statt durch neuen Code – die Engine wird einmal gründlich getestet', 'Sie braucht keine Fehlerbehandlung', 'Sie ersetzt das Zustandsmodell'], correct: 1,
        explain: 'Wiederverwendung einer getesteten Engine; dafür müssen die Daten validiert werden.' },
      { type: 'single', q: 'Warum validiert ein Framework seine Konfigurationsdaten auch nach dem Start erneut?',
        options: ['Aus Performancegründen', 'Weil Daten zur Laufzeit geändert werden können (HMI, Rezeptdateien)', 'Weil der Compiler das verlangt', 'Es reicht einmal beim Start'], correct: 1,
        explain: 'Jede Änderung kann Invarianten verletzen – die Prüfung gehört an jeden Änderungspunkt.' },
      { type: 'multi', q: 'Welche Regeln gelten für generierten Code?',
        options: ['Er wird nicht von Hand geändert', 'Generator und Eingabedaten werden versioniert und reviewt', 'Er wird nur einmal generiert und dann gepflegt', 'Er ist als generiert gekennzeichnet'], correct: [0, 1, 3],
        explain: 'Einmal generieren und dann pflegen führt zu Abweichungen, die beim nächsten Generieren verloren gehen.' }
    ],
    exam: [
      { type: 'single', q: 'Ein Schritt hat nNext = 0 und ist der letzte Eintrag im Array. Was muss die Validierung melden?',
        options: ['Nichts', 'Ungültig: Der Folgeschritt liegt außerhalb des Arrays', 'Die Engine soll automatisch bei Schritt 1 weitermachen', 'Ein Timeout'], correct: 1,
        explain: '„Nächster Schritt“ existiert nicht – ohne Validierung droht ein Array-Überlauf zur Laufzeit.' },
      { type: 'single', q: 'Wann lohnt sich ein Framework?',
        options: ['Sobald das erste Projekt fertig ist', 'Wenn wiederkehrende Strukturen in mehreren Projekten erkannt und stabil sind', 'Immer, je früher desto besser', 'Nie, Frameworks sind zu komplex'], correct: 1,
        explain: 'Zu frühe Abstraktion passt selten auf spätere Fälle.' },
      { type: 'multi', q: 'Welche Diagnoseinformationen sollte eine Ablauf-Engine bereitstellen?',
        options: ['Aktueller Schritt', 'Grund des Wartens (Bedingung, Eingang)', 'Schritt, in dem ein Fehler auftrat', 'Den kompletten Speicherinhalt der CPU'], correct: [0, 1, 2],
        explain: 'Gezielte, verständliche Diagnose statt Datenflut.' },
      { type: 'single', q: 'Ein KI-Werkzeug erzeugt einen ST-Baustein. Was ist die professionelle Vorgehensweise?',
        options: ['Direkt auf die Maschine laden', 'Wie fremden Code behandeln: reviewen, testen (inkl. Grenzfälle), Verantwortung übernehmen', 'Nur die Kommentare prüfen', 'Ablehnen, ohne ihn anzusehen'], correct: 1,
        explain: 'Die Verantwortung für Code an einer Maschine bleibt beim Menschen – egal, wer ihn geschrieben hat.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'erweitern',
        title: 'Datengetriebene Ablauf-Engine erweitern',
        task: `Eine einfache Engine führt Abläufe aus einer Schritttabelle **aSteps** (Array of **stStep**, siehe \`Types.typ\`) aus. Das Rezept „Bohrzyklus“ steht in \`_INIT\`. Die Engine kann bisher nur \`COND_TIME\` und \`COND_IN_HIGH\` und schaltet immer zum nächsten Schritt. Erweitere sie – **generisch**, ohne schrittspezifischen Code:

1. **COND_IN_LOW**: weiter, wenn der Eingang FALSE ist.
2. **nNext**: 0 = nächster Schritt, −1 = Ende (zurück in Ruhe, **nCyclesDone** + 1), sonst Sprung zum angegebenen Schritt.
3. **Überwachung**: Ist tTimeout > 0 und die Bedingung nicht innerhalb tTimeout erfüllt → Fehler: **doError**, **nErrorStep** = Schrittnummer, alle Ausgänge aus. Flanke an **diAck** → Ruhe (nStep = 0, nErrorStep = 0).
4. **Konfigurationsprüfung** (in jedem Zyklus, da das HMI das Rezept ändern kann – simuliert über **nPatchNext**): Für jeden konfigurierten Schritt (eCond ≠ COND_NONE) muss nInput in 0…3 liegen, COND_TIME eine Zeit > 0 haben und das Folgeziel (nächster Schritt bzw. Sprungziel) im Array liegen **und** konfiguriert sein. Ungültig → **doConfigError**, Start gesperrt; tritt es während des Ablaufs auf → Fehler im aktuellen Schritt.
5. **doBusy** = Ablauf aktiv und kein Fehler.

Start per Flanke an **diRun** aus der Ruhe. **nStep** zeigt den aktiven Schritt (0 = Ruhe).`,
        hints: ['Folgeziel: `IF aSteps[i].nNext = 0 THEN nTarget := i + 1; ELSE nTarget := aSteps[i].nNext; END_IF` – für nNext = −1 entfällt die Prüfung.', 'Zwei Timer (Schrittzeit, Überwachung), beide beim Schrittwechsel zurücksetzen.', 'Greife auf aSteps[nStep] nur zu, wenn 1 ≤ nStep ≤ MAX_STEPS.'],
        cycleMs: 10,
        io: [
          { name: 'diRun', type: 'BOOL', dir: 'in', label: 'Zyklus starten', widget: 'button' },
          { name: 'diAck', type: 'BOOL', dir: 'in', label: 'Quittieren', widget: 'button' },
          { name: 'diJam', type: 'BOOL', dir: 'in', label: 'Simulation: Bohrer klemmt', widget: 'switch' },
          { name: 'nPatchNext', type: 'INT', dir: 'in', label: 'HMI: Sprungziel Schritt 2 (0 = unverändert)', widget: 'slider', min: -1, max: 20 },
          { name: 'diIn0', type: 'BOOL', dir: 'in', label: 'E0: gespannt', widget: 'led' },
          { name: 'diIn1', type: 'BOOL', dir: 'in', label: 'E1: Bohrtiefe erreicht', widget: 'led' },
          { name: 'diIn2', type: 'BOOL', dir: 'in', label: 'E2: Bohrer oben', widget: 'led' },
          { name: 'diIn3', type: 'BOOL', dir: 'in', label: 'E3: frei', widget: 'switch' },
          { name: 'doOut0', type: 'BOOL', dir: 'out', label: 'A0: Spannen', widget: 'led' },
          { name: 'doOut1', type: 'BOOL', dir: 'out', label: 'A1: Bohren', widget: 'led' },
          { name: 'doOut2', type: 'BOOL', dir: 'out', label: 'A2: Ausblasen', widget: 'led' },
          { name: 'doOut3', type: 'BOOL', dir: 'out', label: 'A3: frei', widget: 'led' },
          { name: 'nStep', type: 'INT', dir: 'out', label: 'Aktiver Schritt', widget: 'value' },
          { name: 'nCyclesDone', type: 'INT', dir: 'out', label: 'Fertige Zyklen', widget: 'value' },
          { name: 'doBusy', type: 'BOOL', dir: 'out', label: 'Ablauf aktiv', widget: 'led' },
          { name: 'doError', type: 'BOOL', dir: 'out', label: 'Ablauffehler', widget: 'led' },
          { name: 'nErrorStep', type: 'INT', dir: 'out', label: 'Fehler in Schritt', widget: 'value' },
          { name: 'doConfigError', type: 'BOOL', dir: 'out', label: 'Konfiguration ungültig', widget: 'led' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doOut0', 'doOut1', 'doOut2', 'doError'] } },
        plant: SEQ_PLANT,
        files: {
          main: `${SEQ_INIT}
PROGRAM _CYCLIC
${SEQ_PATCH}
	rtRun(CLK := diRun);
	aIn[0] := diIn0;
	aIn[1] := diIn1;
	aIn[2] := diIn2;
	aIn[3] := diIn3;

	IF nStep = 0 THEN
		nStepLast := 0;
		IF rtRun.Q THEN
			nStep := 1;
		END_IF
	ELSE
		IF nStep <> nStepLast THEN
			tonStep(IN := FALSE, PT := T#0s);
			nStepLast := nStep;
		END_IF
		tonStep(IN := TRUE, PT := aSteps[nStep].tTime);
		bTrans := FALSE;
		CASE aSteps[nStep].eCond OF
			COND_TIME:
				bTrans := tonStep.Q;
			COND_IN_HIGH:
				bTrans := aIn[aSteps[nStep].nInput];
		END_CASE
		IF bTrans THEN
			nStep := nStep + 1;
			IF nStep > MAX_STEPS THEN
				nStep := 0;
			END_IF
		END_IF
	END_IF

	FOR i := 0 TO 3 DO
		aOut[i] := FALSE;
	END_FOR
	IF nStep >= 1 AND nStep <= MAX_STEPS THEN
		FOR i := 0 TO 3 DO
			aOut[i] := aSteps[nStep].bOut[i];
		END_FOR
	END_IF
	doOut0 := aOut[0];
	doOut1 := aOut[1];
	doOut2 := aOut[2];
	doOut3 := aOut[3];
	doBusy := nStep > 0;
END_PROGRAM
`,
          var: `VAR CONSTANT
	MAX_STEPS : INT := 10;
END_VAR
VAR
	aSteps : ARRAY[1..10] OF stStep;
	aIn : ARRAY[0..3] OF BOOL;
	aOut : ARRAY[0..3] OF BOOL;
	nStepLast : INT;
	bTrans : BOOL;
	tonStep : TON;
	rtRun : R_TRIG;
	i : INT;
END_VAR
`,
          typ: SEQ_TYP
        },
        solution: {
          main: `${SEQ_INIT}
PROGRAM _CYCLIC
${SEQ_PATCH}
	rtRun(CLK := diRun);
	rtAck(CLK := diAck);
	aIn[0] := diIn0;
	aIn[1] := diIn1;
	aIn[2] := diIn2;
	aIn[3] := diIn3;

	(* Konfigurationsprüfung *)
	bConfigValid := TRUE;
	FOR i := 1 TO MAX_STEPS DO
		IF aSteps[i].eCond <> COND_NONE THEN
			IF aSteps[i].nInput < 0 OR aSteps[i].nInput > 3 THEN
				bConfigValid := FALSE;
			END_IF
			IF aSteps[i].eCond = COND_TIME AND aSteps[i].tTime <= T#0s THEN
				bConfigValid := FALSE;
			END_IF
			IF aSteps[i].nNext <> -1 THEN
				IF aSteps[i].nNext = 0 THEN
					nTarget := i + 1;
				ELSE
					nTarget := aSteps[i].nNext;
				END_IF
				IF nTarget < 1 OR nTarget > MAX_STEPS THEN
					bConfigValid := FALSE;
				ELSIF aSteps[nTarget].eCond = COND_NONE THEN
					bConfigValid := FALSE;
				END_IF
			END_IF
		END_IF
	END_FOR

	(* Engine *)
	IF bError THEN
		IF rtAck.Q THEN
			bError := FALSE;
			nErrorStep := 0;
			nStep := 0;
		END_IF
	ELSIF nStep = 0 THEN
		nStepLast := 0;
		IF rtRun.Q AND bConfigValid THEN
			nStep := 1;
		END_IF
	ELSIF NOT bConfigValid OR nStep < 1 OR nStep > MAX_STEPS THEN
		bError := TRUE;
		nErrorStep := nStep;
	ELSE
		IF nStep <> nStepLast THEN
			tonStep(IN := FALSE, PT := T#0s);
			tonTimeout(IN := FALSE, PT := T#0s);
			nStepLast := nStep;
		END_IF
		tonStep(IN := TRUE, PT := aSteps[nStep].tTime);
		tonTimeout(IN := aSteps[nStep].tTimeout > T#0s, PT := aSteps[nStep].tTimeout);
		bTrans := FALSE;
		CASE aSteps[nStep].eCond OF
			COND_TIME:
				bTrans := tonStep.Q;
			COND_IN_HIGH:
				bTrans := aIn[aSteps[nStep].nInput];
			COND_IN_LOW:
				bTrans := NOT aIn[aSteps[nStep].nInput];
		ELSE
			bError := TRUE;
			nErrorStep := nStep;
		END_CASE
		IF bTrans THEN
			IF aSteps[nStep].nNext = -1 THEN
				nStep := 0;
				nCyclesDone := nCyclesDone + 1;
			ELSIF aSteps[nStep].nNext = 0 THEN
				nStep := nStep + 1;
			ELSE
				nStep := aSteps[nStep].nNext;
			END_IF
		ELSIF tonTimeout.Q AND NOT bError THEN
			bError := TRUE;
			nErrorStep := nStep;
		END_IF
	END_IF

	(* Ausgänge *)
	FOR i := 0 TO 3 DO
		aOut[i] := FALSE;
	END_FOR
	IF NOT bError AND nStep >= 1 AND nStep <= MAX_STEPS THEN
		FOR i := 0 TO 3 DO
			aOut[i] := aSteps[nStep].bOut[i];
		END_FOR
	END_IF
	doOut0 := aOut[0];
	doOut1 := aOut[1];
	doOut2 := aOut[2];
	doOut3 := aOut[3];
	doBusy := nStep > 0 AND NOT bError;
	doError := bError;
	doConfigError := NOT bConfigValid;
END_PROGRAM
`,
          var: `VAR CONSTANT
	MAX_STEPS : INT := 10;
END_VAR
VAR
	aSteps : ARRAY[1..10] OF stStep;
	aIn : ARRAY[0..3] OF BOOL;
	aOut : ARRAY[0..3] OF BOOL;
	nStepLast : INT;
	nTarget : INT;
	bTrans : BOOL;
	bError : BOOL;
	bConfigValid : BOOL;
	tonStep : TON;
	tonTimeout : TON;
	rtRun : R_TRIG;
	rtAck : R_TRIG;
	i : INT;
END_VAR
`,
          typ: SEQ_TYP
        },
        tests: [
          { name: 'Kompletter Bohrzyklus', steps: [
            ...pulse('diRun'),
            { until: 'nCyclesDone = 1', maxMs: 4000, msg: 'Der Bohrzyklus muss vollständig durchlaufen (Schritt 5 mit COND_IN_LOW und Ende −1).' },
            { expect: 'nStep = 0 AND NOT doOut0 AND NOT doOut1 AND NOT doOut2 AND NOT doBusy', msg: 'Nach Zyklusende: Ruhe, alle Ausgänge aus.' }
          ]},
          { name: 'Schritte und Ausgänge laut Tabelle', steps: [
            { set: { diRun: true } }, { cycles: 1 }, { set: { diRun: false } },
            { expect: 'nStep = 1 AND doOut0 AND NOT doOut1 AND doBusy', msg: 'Schritt 1: Spannen.' },
            { until: 'nStep = 2', maxMs: 600 }, { cycles: 1 },
            { expect: 'doOut0 AND doOut1', msg: 'Schritt 2: Spannen und Bohren.' },
            { until: 'nStep = 4', maxMs: 2500 }, { cycles: 1 },
            { expect: 'doOut0 AND doOut2 AND NOT doOut1', msg: 'Schritt 4: Ausblasen.' },
            { ms: 300 },
            { expect: 'nStep = 4', msg: 'Schritt 4 dauert 500 ms (COND_TIME).' },
            { until: 'nStep = 5', maxMs: 400 }, { cycles: 1 },
            { expect: 'NOT doOut0 AND NOT doOut2', msg: 'Schritt 5: Entspannen, alle Ausgänge aus.' }
          ]},
          { name: 'Überwachung mit Fehlerschritt und Quittierung', steps: [
            { set: { diJam: true } },
            ...pulse('diRun'),
            { ms: 2500 },
            { expect: 'NOT doError AND nStep = 2', msg: 'Der Fehler darf nicht vor Ablauf von 3 s in Schritt 2 kommen.' },
            { until: 'doError', maxMs: 1500, msg: 'Erreicht der Bohrer die Tiefe nicht, muss die Überwachung von Schritt 2 auslösen.' },
            { expect: 'nErrorStep = 2 AND NOT doOut0 AND NOT doOut1 AND NOT doBusy', msg: 'Fehler in Schritt 2, alle Ausgänge aus.' },
            { never: 'NOT doError', msg: 'Der Fehler muss bis zur Quittierung bestehen bleiben.' },
            ...pulse('diAck'), { cycles: 1 },
            { expect: 'NOT doError AND nStep = 0 AND nErrorStep = 0', msg: 'Quittierung: zurück in Ruhe.' }
          ]},
          { name: 'Ungültige Konfiguration sperrt den Start', steps: [
            { set: { nPatchNext: 17 } }, { cycles: 2 },
            { expect: 'doConfigError', msg: 'Sprungziel 17 liegt außerhalb der Tabelle – Konfigurationsfehler.' },
            ...pulse('diRun'),
            { never: 'doBusy', msg: 'Mit ungültiger Konfiguration darf kein Ablauf starten.' },
            { set: { nPatchNext: 7 } }, { cycles: 2 },
            { expect: 'doConfigError', msg: 'Sprungziel 7 ist nicht konfiguriert – ebenfalls ungültig.' }
          ]},
          { name: 'Sprung laut Tabelle', steps: [
            { set: { nPatchNext: 5 } }, { cycles: 2 },
            { expect: 'NOT doConfigError', msg: 'Sprungziel 5 ist gültig.' },
            ...pulse('diRun'),
            { until: 'nStep = 2', maxMs: 600 },
            { until: 'nStep <> 2', maxMs: 2000 },
            { expect: 'nStep = 5', msg: 'Nach Schritt 2 muss die Engine zu Schritt 5 springen.' },
            { until: 'nCyclesDone = 1', maxMs: 1500, msg: 'Nach dem Sprung muss der Zyklus regulär enden.' }
          ]}
        ]
      }
    ]
  },

  // ===================================================================
  {
    id: 'logik-6-projekt-review',
    level: 6,
    kind: 'projekt',
    title: 'Praxisprojekt: Code-Review, Optimierung und Mentoring',
    summary: 'Du reviewst fremden Produktionscode systematisch, findest subtile Fehler (Einheiten, Gleitkomma, Überlauf, Array-Grenzen) und gibst dein Wissen als Mentor weiter.',
    minutes: 360,
    req: ['logik-6-framework'],
    briefing: 'Als Genie-Kandidat bist du derjenige, dem andere ihren Code zeigen. Ein gutes Review findet nicht nur Syntaxfehler, sondern die Fehler, die erst nach Stunden oder bei Grenzwerten auftreten: vermischte Einheiten, Gleitkomma-Gleichheit, Ganzzahlüberlauf, Array-Grenzen, falsche Mittelwerte bei teilgefüllten Puffern. Dazu kommt Performance: unnötige Schleifen, Berechnungen in der falschen Taskklasse. Und schließlich die menschliche Seite: Review-Kommentare, die erklären statt belehren, Checklisten, die das Team gemeinsam pflegt, und Pairing, mit dem Junior-Kollegen schneller wachsen als mit jedem Kurs.',
    practice: 'Eine Abfüllwaage, die nach 33 Sekunden Laufzeit „negative Füllzeiten“ meldet oder nach der zehnten Füllung in den Servicemodus geht, ist ein reales Bild aus der Inbetriebnahme. Ein Review hätte es in fünf Minuten gefunden.',
    transfer: {
      tia: 'TIA bietet mit der Projektvergleichs- und Multiuser-Funktion Unterstützung; statische Codeanalyse z. B. über SIMATIC Code-Analyse-Werkzeuge.',
      codesys: 'CODESYS Static Analysis prüft viele der hier gezeigten Fehlerklassen automatisch (Überläufe, Array-Grenzen, Gleitkommavergleiche).'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erstelle eine Review-Checkliste für ST-Code',
        guide: {
          intro: 'Eine Checkliste macht Reviews reproduzierbar und lehrt das Team, worauf es ankommt.',
          steps: [
            'Starte mit den PLCopen-Coding-Guidelines und den B&R-Namenskonventionen.',
            'Ergänze Fehlerklassen aus eigenen Projekten: Einheiten, REAL-Gleichheit, Überlauf (INT/DINT/TIME), Array-Grenzen, FB-Aufrufe in IF, Flanken.',
            'Ergänze Architekturfragen: Schichtung eingehalten? Ein Schreiber je Variable? Taskklasse passend?',
            'Lege die Checkliste ins Team-Repository und überarbeite sie nach jedem Review, das einen neuen Fehlertyp findet.'
          ],
          done: 'Erledigt, wenn deine Checkliste mindestens 15 prüfbare Punkte enthält und im Repository liegt.',
          tip: 'Jeder Punkt muss mit Ja/Nein beantwortbar sein. „Code ist sauber“ ist kein Checklistenpunkt.',
          link: { label: 'PLCopen Software Construction Guidelines', url: 'https://plcopen.org/software-construction-guidelines' }
        }
      },
      {
        id: 'o2',
        title: 'Führe ein Review mit Git-Werkzeugen durch',
        guide: {
          intro: 'Reviews finden auf Basis von Merge Requests statt – dort ist der Unterschied sichtbar und kommentierbar.',
          steps: [
            'Lass dir Änderungen als Merge Request auf git.breitner.de geben, nicht als ZIP.',
            'Lies zuerst die Beschreibung (Was? Warum?), dann den Diff, dann die Tests.',
            'Kommentiere konkret: Zeile, Problem, Auswirkung, Vorschlag. Trenne „muss“ von „könnte“.',
            'Verifiziere kritische Befunde mit einem Test oder in der Simulation, bevor du sie meldest.'
          ],
          done: 'Erledigt, wenn du ein Review mit mindestens drei begründeten Befunden in einem Merge Request dokumentiert hast.',
          tip: 'Lobe gute Lösungen ausdrücklich. Reviews, die nur Fehler nennen, werden irgendwann vermieden.'
        }
      },
      {
        id: 'o3',
        title: 'Optimiere Laufzeit gezielt',
        guide: {
          intro: 'Optimiere, was du gemessen hast – nicht, was du vermutest.',
          steps: [
            'Miss mit dem Profiler die Laufzeit vor der Änderung.',
            'Suche Hotspots: Schleifen über große Arrays in schnellen Tasks, wiederholte String-Operationen, unnötige Neuberechnungen.',
            'Optimiere (Verschieben in langsamere Taskklasse, Time-Slicing, inkrementelle Berechnung) und miss erneut.',
            'Dokumentiere Vorher/Nachher im Merge Request.'
          ],
          done: 'Erledigt, wenn du eine Optimierung mit gemessenem Effekt belegen kannst.',
          tip: 'Lesbarkeit schlägt Mikro-Optimierung. Ein Mittelwert, der inkrementell aktualisiert wird, ist schneller und trotzdem lesbar.',
          link: { label: 'B&R Help: Profiler', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/profile/diagnosis_profile.html' }
        }
      },
      {
        id: 'o4',
        title: 'Gib dein Wissen als Mentor weiter',
        guide: {
          intro: 'Die Stufe Genie bedeutet auch: Andere besser machen.',
          steps: [
            'Begleite einen Lernenden aus Level 1–3 bei einer Übung im Pairing (er tippt, du fragst).',
            'Führe das Review dieser Übung gemeinsam mit ihm anhand deiner Checkliste durch.',
            'Lass ihn den gefundenen Fehler selbst beheben und einen Test dafür schreiben.',
            'Reiche dein Review-Projekt und eine kurze Reflexion (Was hat funktioniert, was nicht?) als Nachweis ein.'
          ],
          done: 'Erledigt, wenn die Fehlersuche-Übung grün ist und dein Nachweis (Checkliste, Review, Reflexion) eingereicht ist.',
          tip: 'Frage „Was passiert, wenn …?“ statt „Das ist falsch“. Wer den Fehler selbst findet, vergisst ihn nicht.'
        }
      }
    ],
    videos: [
      vid('1g6eYnlzKtA', 'en', 'Versionsverwaltung für SPS-Code – Grundlage für Reviews über Merge Requests.'),
      vid('I3LkUDPtN0k', 'en', 'IEC-61131-3-Code in Git und VS Code – Werkzeuge für textbasierte Reviews.')
    ],
    readings: [
      R.plcopenGuidelines,
      R.tcunit,
      br('programming/guidelines/namingconventions/projectorganisation_guidelines_namingconventions.html', 'Namenskonventionen', 'Grundlage für einheitliche Benennung im Review.', 15)
    ],
    quiz: [
      { type: 'single', q: 'Welche Bedingung ist für das Beenden eines Füllvorgangs geeignet?',
        options: ['rWeight = rTarget', 'rWeight >= rTarget - rNachlauf', 'REAL_TO_INT(rWeight) = REAL_TO_INT(rTarget)', 'aiWeight = rTarget'], correct: 1,
        explain: 'REAL-Gleichheit tritt bei schrittweise wachsenden Werten praktisch nie exakt ein; ein Schwellwert mit ≥ ist robust.' },
      { type: 'numeric', q: 'Eine INT-Variable zählt in jedem 10-ms-Zyklus um {N} ms hoch. Nach wie vielen Sekunden läuft sie über (Grenze 32767)?',
        params: { N: [1, 20, 1] }, formula: '32767 / N * 0.01', unit: 's', tol: 0.02,
        explain: 'Anzahl Zyklen bis Überlauf = 32767 / N; mal 10 ms.' },
      { type: 'single', q: 'Ein Ringpuffer mit 10 Plätzen enthält erst 3 Werte. Wie wird der Mittelwert korrekt gebildet?',
        options: ['Summe aller 10 Plätze / 10', 'Summe der 3 gültigen Werte / 3', 'Letzter Wert', 'Summe / 10 · 3'], correct: 1,
        explain: 'Bei teilgefülltem Puffer ist durch die Anzahl gültiger Werte zu teilen.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Befunde sind in einem Review „muss“ (blockierend)?',
        options: ['Array-Zugriff kann die Grenzen überschreiten', 'Variablenname weicht minimal von der Konvention ab', 'Einheiten werden vermischt (Rohwert mit Gramm verglichen)', 'Ganzzahlüberlauf in einem Laufzeitzähler'], correct: [0, 2, 3],
        explain: 'Kleine Stilabweichungen sind „könnte“; Laufzeitfehler und falsche Ergebnisse blockieren.' },
      { type: 'single', q: 'Welcher Datentyp eignet sich für einen Betriebsstundenzähler in Millisekunden über ein Jahr?',
        options: ['INT', 'UINT', 'UDINT bzw. ULINT', 'REAL'], correct: 2,
        explain: 'Ein Jahr hat ca. 3,15 · 10¹⁰ ms – das übersteigt sogar UDINT (4,29 · 10⁹). ULINT oder ein Zähler in Sekunden ist nötig; REAL verliert Auflösung.' },
      { type: 'single', q: 'Wie gibst du einem Junior-Kollegen am wirksamsten Rückmeldung zu einem Fehler?',
        options: ['Den Fehler selbst beheben und committen', 'Eine Frage stellen, die ihn den Fehler selbst finden lässt, und gemeinsam einen Test dafür schreiben', 'Den Fehler im Teammeeting nennen', 'Gar nicht, er lernt es irgendwann'], correct: 1,
        explain: 'Selbst gefundene Fehler und ein Test, der sie künftig verhindert, haben den größten Lerneffekt.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'fehlersuche',
        title: 'Code-Review: Abfüllwaage mit Grob-/Feindosierung',
        task: `Eine Abfüllwaage befüllt Behälter mit Grob- und Feindosierung. Der Code hat das erste Review „überlebt“, fällt aber in der Inbetriebnahme durch. Finde und behebe **alle** Fehler – es sind mehrere, und jeder zeigt sich erst unter bestimmten Bedingungen.

**Spezifikation**
- Waage **aiWeight**: Rohwert 0…32767 = 0…1000 g. **rWeight** = Gewicht in g.
- Start (Flanke **diStart**) → **Grobdosierung** (doValveFast) bis rWeight ≥ rTarget − 50 g → **Feindosierung** (doValveFine) bis rWeight ≥ rTarget − 1 g (Nachlaufkorrektur) → **300 ms beruhigen** → Gewicht übernehmen → **300 ms auswerfen** (doEject). Mit **diAuto** = TRUE folgt sofort die nächste Füllung.
- **rLastWeight**: Gewicht der letzten Füllung. **rMeanWeight**: Mittelwert der letzten (bis zu) 10 Füllungen. **nFills**: Anzahl Füllungen.
- **nFillTimeS**: aufsummierte Dosierzeit (Grob + Fein) in Sekunden über alle Füllungen – die Anlage läuft Tage durch.
- Genauigkeit: ±2 g um rTarget.`,
        hints: ['Vergleiche Einheiten in jeder Bedingung.', 'Wird eine Gleitkommabedingung jemals exakt erfüllt?', 'Wie groß wird der Laufzeitzähler nach einer Stunde?', 'Was passiert bei der zehnten Füllung im Ringpuffer – und was gilt für den Mittelwert bei weniger als zehn Füllungen?'],
        cycleMs: 10,
        io: [
          { name: 'diStart', type: 'BOOL', dir: 'in', label: 'Start', widget: 'button' },
          { name: 'diAuto', type: 'BOOL', dir: 'in', label: 'Dauerbetrieb', widget: 'switch' },
          { name: 'rTarget', type: 'REAL', dir: 'in', label: 'Sollgewicht', widget: 'slider', min: 100, max: 900, unit: 'g', init: 500 },
          { name: 'aiWeight', type: 'INT', dir: 'in', label: 'Waage Rohwert', widget: 'value' },
          { name: 'doValveFast', type: 'BOOL', dir: 'out', label: 'Ventil grob', widget: 'led' },
          { name: 'doValveFine', type: 'BOOL', dir: 'out', label: 'Ventil fein', widget: 'led' },
          { name: 'doEject', type: 'BOOL', dir: 'out', label: 'Behälter auswerfen', widget: 'led' },
          { name: 'rWeight', type: 'REAL', dir: 'out', label: 'Gewicht', widget: 'gauge', min: 0, max: 1000, unit: 'g' },
          { name: 'rLastWeight', type: 'REAL', dir: 'out', label: 'Letzte Füllung', widget: 'value', unit: 'g' },
          { name: 'rMeanWeight', type: 'REAL', dir: 'out', label: 'Mittelwert (bis 10)', widget: 'value', unit: 'g' },
          { name: 'nFills', type: 'INT', dir: 'out', label: 'Füllungen', widget: 'value' },
          { name: 'nFillTimeS', type: 'INT', dir: 'out', label: 'Dosierzeit gesamt', widget: 'value', unit: 's' }
        ],
        scene: { type: 'tank', bind: { inlet: 'doValveFast', outlet: 'doEject', mixer: 'doValveFine' } },
        plant: FILL_PLANT,
        files: {
          main: `PROGRAM _INIT
	eState := FILL_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	rWeight := INT_TO_REAL(aiWeight) / 32.767;
	rtStart(CLK := diStart);
	tonSettle(IN := eState = FILL_SETTLE, PT := T#300ms);
	tonEject(IN := eState = FILL_EJECT, PT := T#300ms);

	IF eState = FILL_FAST OR eState = FILL_FINE THEN
		nFillTimeMs := nFillTimeMs + 10;
	END_IF

	CASE eState OF
		FILL_IDLE:
			IF rtStart.Q THEN
				eState := FILL_FAST;
			END_IF

		FILL_FAST:
			IF aiWeight >= rTarget - 50.0 THEN
				eState := FILL_FINE;
			END_IF

		FILL_FINE:
			IF rWeight = rTarget - 1.0 THEN
				eState := FILL_SETTLE;
			END_IF

		FILL_SETTLE:
			IF tonSettle.Q THEN
				rLastWeight := rWeight;
				aLast[nIdx] := rWeight;
				nIdx := nIdx + 1;
				IF nIdx > 10 THEN
					nIdx := 0;
				END_IF
				nFills := nFills + 1;
				rSum := 0.0;
				FOR i := 0 TO 9 DO
					rSum := rSum + aLast[i];
				END_FOR
				rMeanWeight := rSum / 10.0;
				eState := FILL_EJECT;
			END_IF

		FILL_EJECT:
			IF tonEject.Q THEN
				IF diAuto THEN
					eState := FILL_FAST;
				ELSE
					eState := FILL_IDLE;
				END_IF
			END_IF
	END_CASE

	doValveFast := eState = FILL_FAST;
	doValveFine := eState = FILL_FINE;
	doEject := eState = FILL_EJECT;
	nFillTimeS := nFillTimeMs / 1000;
END_PROGRAM
`,
          var: `VAR
	eState : eFill;
	rtStart : R_TRIG;
	tonSettle : TON;
	tonEject : TON;
	aLast : ARRAY[0..9] OF REAL;
	nIdx : INT;
	i : INT;
	rSum : REAL;
	nFillTimeMs : INT;
END_VAR
`,
          typ: FILL_TYP
        },
        solution: {
          main: `PROGRAM _INIT
	eState := FILL_IDLE;
END_PROGRAM

PROGRAM _CYCLIC
	rWeight := INT_TO_REAL(aiWeight) / 32.767;
	rtStart(CLK := diStart);
	tonSettle(IN := eState = FILL_SETTLE, PT := T#300ms);
	tonEject(IN := eState = FILL_EJECT, PT := T#300ms);

	(* DINT statt INT: INT läuft nach 32,7 s Dosierzeit über *)
	IF eState = FILL_FAST OR eState = FILL_FINE THEN
		nFillTimeMs := nFillTimeMs + CYCLE_MS;
	END_IF

	CASE eState OF
		FILL_IDLE:
			IF rtStart.Q THEN
				eState := FILL_FAST;
			END_IF

		FILL_FAST:
			(* Gramm mit Gramm vergleichen, nicht Rohwert mit Gramm *)
			IF rWeight >= rTarget - FAST_MARGIN_G THEN
				eState := FILL_FINE;
			END_IF

		FILL_FINE:
			(* Schwellwert statt REAL-Gleichheit *)
			IF rWeight >= rTarget - AFTERFLOW_G THEN
				eState := FILL_SETTLE;
			END_IF

		FILL_SETTLE:
			IF tonSettle.Q THEN
				rLastWeight := rWeight;
				aLast[nIdx] := rWeight;
				nIdx := (nIdx + 1) MOD BUF_SIZE;
				IF nCount < BUF_SIZE THEN
					nCount := nCount + 1;
				END_IF
				nFills := nFills + 1;
				rSum := 0.0;
				FOR i := 0 TO nCount - 1 DO
					rSum := rSum + aLast[i];
				END_FOR
				rMeanWeight := rSum / INT_TO_REAL(nCount);
				eState := FILL_EJECT;
			END_IF

		FILL_EJECT:
			IF tonEject.Q THEN
				IF diAuto THEN
					eState := FILL_FAST;
				ELSE
					eState := FILL_IDLE;
				END_IF
			END_IF
	END_CASE

	doValveFast := eState = FILL_FAST;
	doValveFine := eState = FILL_FINE;
	doEject := eState = FILL_EJECT;
	nFillTimeS := DINT_TO_INT(nFillTimeMs / 1000);
END_PROGRAM
`,
          var: `VAR CONSTANT
	CYCLE_MS : DINT := 10;
	BUF_SIZE : INT := 10;
	FAST_MARGIN_G : REAL := 50.0;
	AFTERFLOW_G : REAL := 1.0;
END_VAR
VAR
	eState : eFill;
	rtStart : R_TRIG;
	tonSettle : TON;
	tonEject : TON;
	aLast : ARRAY[0..9] OF REAL;
	nIdx : INT;
	nCount : INT;
	i : INT;
	rSum : REAL;
	nFillTimeMs : DINT;
END_VAR
`,
          typ: FILL_TYP
        },
        tests: [
          { name: 'Grobdosierung bis kurz vor Sollgewicht', steps: [
            ...pulse('diStart'), { cycles: 20 },
            { expect: 'doValveFast AND NOT doValveFine', msg: 'Zu Beginn muss grob dosiert werden – Einheiten der Umschaltbedingung prüfen.' },
            { until: 'doValveFine', maxMs: 3500, msg: 'Die Feindosierung muss kurz vor dem Sollgewicht beginnen.' },
            { expect: 'rWeight >= 440.0', msg: 'Umschalten auf fein erst ca. 50 g vor dem Sollgewicht.' }
          ]},
          { name: 'Genauigkeit ±2 g bei zwei Sollwerten', steps: [
            ...pulse('diStart'),
            { until: 'doEject', maxMs: 8000, msg: 'Die Füllung muss enden – wird die Endbedingung je erfüllt?' },
            { expect: 'ABS(rLastWeight - 500.0) <= 2.0 AND nFills = 1', msg: 'Füllgewicht muss innerhalb ±2 g um 500 g liegen.' },
            { set: { rTarget: 250.0 } },
            { until: 'NOT doEject', maxMs: 1000 }, { cycles: 2 },
            ...pulse('diStart'),
            { until: 'doEject', maxMs: 8000 },
            { expect: 'ABS(rLastWeight - 250.0) <= 2.0', msg: 'Auch bei 250 g Sollgewicht ±2 g.' }
          ]},
          { name: 'Mittelwert bei teilgefülltem Puffer', steps: [
            { set: { diAuto: true } },
            ...pulse('diStart'),
            { until: 'nFills = 3', maxMs: 20000 },
            { expect: 'ABS(rMeanWeight - rLastWeight) < 0.5', msg: 'Der Mittelwert der ersten 3 Füllungen muss nahe am Füllgewicht liegen – Teiler prüfen.' }
          ]},
          { name: 'Dauerbetrieb: 12 Füllungen, Laufzeitzähler', steps: [
            { set: { diAuto: true } },
            ...pulse('diStart'),
            { until: 'nFills = 12', maxMs: 75000, msg: 'Im Dauerbetrieb müssen 12 Füllungen ohne Laufzeitfehler möglich sein.' },
            { expect: 'ABS(rMeanWeight - 499.0) < 1.5', msg: 'Mittelwert der letzten 10 Füllungen muss ca. 499 g betragen.' },
            { expect: 'nFillTimeS >= 50 AND nFillTimeS <= 62', msg: 'Die Dosierzeit über 12 Füllungen beträgt ca. 56 s – Überlauf?' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Code-Reviewer & Mentor'
  }
];
