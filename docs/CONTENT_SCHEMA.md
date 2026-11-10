# Inhalts-Schema – becomeStEngineer

Alle Lerninhalte liegen als **CommonJS-Datendateien** unter `content/`. Der Server lädt sie,
bewertet serverseitig und schickt dem Browser nur, was er sehen darf (keine Lösungen vor dem Bestehen).

* Sprache: **Deutsch, Anrede „du“**, Fachbegriffe Englisch (Task, Cycle, Axis, Widget …).
* Basis: **B&R Automation Studio 6** (AS6), mapp Technology 6 (mapp Motion, mapp View, mapp Control, mapp Safety …),
  Automation Runtime 6, X20/X67, ACOPOS P3/ACOPOSmotor, Power Panel, SafeLOGIC.
* Ton: professionell, sachlich, Software-Engineering. **Kein Militär-, kein Fantasy-Vokabular.**
* Keine erfundenen URLs oder YouTube-IDs. Alles wird geprüft (siehe unten). Was nicht prüfbar ist, wird weggelassen.
* Recht/Normen gelten als Orientierung („keine Rechtsberatung“), Normtexte nicht zitieren, nur referenzieren.

## Stufen (Stages) und Level

| Level | Stufe des Lernenden | Inhalte bereiten vor auf … |
|---|---|---|
| 1 | Grundkurs | Prüfung **Junior** |
| 2 | Junior | Prüfung **Senior** |
| 3 | Senior | Prüfung **Engineer** |
| 4 | Engineer | Prüfung **Master** |
| 5 | Master | Prüfung **Guru** |
| 6 | Guru | Prüfung **Genie** |

Jeder Modul hat ein `level` (1–6). Je höher, desto schwerer: Level 1 = Berufsschul-Einstieg,
Level 3 = selbstständige Inbetriebnahme einer Maschine, Level 6 = Architektur, Frameworks, Performance, Lehre.

Empfohlene Level-Abdeckung je Bereich (darf begründet abweichen):

| id | Bereich | Level |
|---|---|---|
| `logik` | Steuerungslogik | 1–6 |
| `elektro` | Elektrotechnische Grundlagen | 1–4 |
| `git` | Versionsverwaltung | 1–4 |
| `praxis` | Engineering-Praxis | 1–6 |
| `system` | Systemkonfiguration & Diagnose | 1–5 |
| `komm` | Vernetzung & Kommunikation | 2–6 |
| `motion` | Antriebstechnik | 2–6 |
| `hmi` | Visualisierung | 2–6 |
| `regelung` | Regelungstechnik | 3–6 |
| `safety` | Funktionale Sicherheit | 3–6 |

## Datei `content/areas/<id>.js`

```js
module.exports = {
  id: 'logik',
  title: 'Steuerungslogik',
  short: 'Logik',                       // max. 10 Zeichen, für Tabs/Badges
  description: '2–3 Sätze, was der Bereich umfasst.',
  sources: ['kurze Liste der Lehrplan-Quellen mit URL, die du für den Aufbau genutzt hast'],
  modules: [ /* Module, sortiert nach level */ ]
};
```

### Modul

```js
{
  id: 'logik-1-variablen',          // eindeutig, Format <area>-<level>-<slug>
  level: 1,
  kind: 'lektion',                  // 'lektion' | 'projekt' (Praxisprojekt, max. 1 pro Bereich+Level) | 'zusatz' (optional, Bonus)
  title: 'Variablen und Datentypen',
  summary: 'Ein Satz für Karten und Listen.',
  minutes: 90,                      // realistische Bearbeitungszeit
  req: ['logik-1-einstieg'],        // Voraussetzungen (Modul-IDs, auch bereichsübergreifend erlaubt). Keine Zyklen!
  briefing: '3–5 Sätze: Was und warum.',
  practice: '1–3 Sätze Praxisbezug: Wo begegnet dir das an einer realen Maschine?',
  transfer: {                       // optional: Vergleich für Umsteiger
    tia: 'So heißt/funktioniert das in Siemens TIA Portal …',
    codesys: '… in CODESYS/Beckhoff TwinCAT …'
  },
  objectives: [                     // 3–5 aufklappbare Ziele, nacheinander freigeschaltet
    {
      id: 'o1',
      title: 'Lege ein neues AS6-Projekt an',
      guide: {
        intro: '1–2 Sätze.',
        steps: [                    // 3–7 Schritte, konkret: Programm, Menüpunkt, Tastenkürzel, Befehl
          'Öffne Automation Studio 6 und wähle **File › New Project…** (Strg+Umschalt+N).',
          'Gib als Namen `Uebung01` ein …'
        ],
        code: { lang: 'st', text: 'nCount := nCount + 1;' },   // optional; lang: st | var | typ | bash | text
        done: 'Erledigt, wenn … (prüfbare Bedingung).',
        tip: 'Ein Profi-Tipp.',
        link: { label: 'B&R Help: …', url: 'https://…' }        // optional, geprüft
      }
    }
  ],
  videos: [                         // 2–3, jede ID per oEmbed geprüft
    { id: 'XXXXXXXXXXX', title: 'exakt aus oEmbed', channel: 'author_name aus oEmbed', lang: 'de', why: 'Ein Satz, warum dieses Video.' }
  ],
  readings: [                       // 2–3, Uni-Skripte zuerst, dann freie Bücher, Hersteller-Doku, amtliche Quellen
    {
      title: '…', author: '…', institution: '…', work: 'Kurs/Buch/Doku-Reihe', year: 2023,
      type: 'Uni-Skript',           // 'Uni-Skript' | 'Fachbuch' | 'Dokumentation' | 'Hersteller' | 'Norm/Amtlich' | 'Artikel'
      minutes: 30, url: 'https://…', why: 'Ein Satz.',
      apa: 'Autor, A. (Jahr). *Titel*. Institution. Abgerufen am 10. November 2026, von https://…'
    }
  ],
  quiz: [ /* genau 3 Fragen, s. u. */ ],
  exam: [ /* 3–5 weitere Fragen nur für Stufenprüfungen (gleiches Format), andere als im quiz */ ],
  exercises: [ /* 0–2 Übungen, s. u. Bei 'projekt' mindestens 1. Code wiegt in der Note 70 %! */ ],
  proof: false,                     // true bei kind 'projekt': Lernender reicht Nachweis-Link ein (z. B. git.breitner.de), Ausbilder bestätigt
  badge: 'Name der Fähigkeit'       // nur bei kind 'projekt': Name des Abzeichens, z. B. 'Zustandsautomaten-Architekt'
}
```

### Quizfragen

```js
{ type: 'single', q: 'Frage?', options: ['A','B','C','D'], correct: 2, explain: 'Warum C richtig ist.' }
{ type: 'multi',  q: 'Welche … (mehrere richtig)?', options: [...], correct: [0,2], explain: '…' }
{ type: 'numeric', q: 'Ein Widerstand R = {R} Ω liegt an U = {U} V. Wie groß ist I?',
  params: { R: [100, 1000, 10], U: [5, 24, 1] },   // [min, max, step] – Werte werden pro Person zufällig gezogen
  formula: 'U / R * 1000',                         // JS-Ausdruck über params, Ergebnis = richtige Antwort
  unit: 'mA', tol: 0.02,                           // relative Toleranz (0.02 = ±2 %)
  explain: 'I = U / R …' }
```

Optional bei jeder Frage: `code: { lang: 'st', text: '…' }` (Code-Snippet, z. B. für Code-Review/„Was ist hier falsch?“)
und `figure: '<svg …>…</svg>'` (inline SVG, z. B. Schaltplanausschnitt; Farben nur `currentColor`, Breite ≤ 600).

## Übungen

### Typ `st` – Programmieren in Structured Text

Die Übung läuft in einem **B&R-artigen Projekt**: Dateien `Main.st` (mit `PROGRAM _INIT`, `PROGRAM _CYCLIC`,
optional `PROGRAM _EXIT`), `Variables.var` (lokale Variablen), `Types.typ` (Datentypen). Globale I/O-Variablen
kommen aus `io` (entspricht `Global.var` + I/O-Mapping). Eine **Anlagen-Simulation** (`plant`, ebenfalls ST) läuft
jeden Zyklus **vor** dem Programm und bildet die Maschine nach.

```js
{
  id: 'ex1', type: 'st', variant: 'schreiben',  // 'schreiben' | 'fehlersuche' | 'erweitern'
  title: 'Förderband mit Start/Stopp',
  task: 'Markdown-Aufgabentext: Was soll das Programm tun? Klare, testbare Anforderungen als Liste.',
  hints: ['Hinweis 1', 'Hinweis 2'],
  cycleMs: 10,                                   // Task-Klasse Zykluszeit (Standard 10)
  io: [                                          // globale Variablen = I/O
    { name: 'diStart', type: 'BOOL', dir: 'in',  label: 'Start-Taster S1', widget: 'button' },
    { name: 'diStop',  type: 'BOOL', dir: 'in',  label: 'Stopp-Taster S2 (Öffner)', widget: 'switch', init: true },
    { name: 'aiTemp',  type: 'INT',  dir: 'in',  label: 'Temperatur', widget: 'slider', min: 0, max: 32767 },
    { name: 'doMotor', type: 'BOOL', dir: 'out', label: 'Schütz K1 Bandmotor', widget: 'led' },
    { name: 'rLevel',  type: 'REAL', dir: 'out', label: 'Füllstand', widget: 'gauge', min: 0, max: 100, unit: '%' }
  ],
  // dir 'in' = von außen/Anlage gesetzt, dir 'out' = vom Programm geschrieben. widget: button | switch | slider | led | gauge | value
  scene: { type: 'conveyor', bind: { motor: 'doMotor', sensor: 'diSensor' } },   // optional, s. Szenen
  files: {                                       // Startcode (darf NICHT alle Tests bestehen)
    main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\nEND_PROGRAM\n',
    var:  'VAR\n\tbRunning : BOOL;\nEND_VAR\n',
    typ:  ''
  },
  solution: { main: '…', var: '…', typ: '…' },   // Musterlösung (MUSS alle Tests bestehen)
  plant: {                                       // optional: Anlagen-Simulation in ST
    var: 'VAR\n\trPos : REAL;\nEND_VAR\n',
    code: 'IF doMotor THEN rPos := rPos + 0.2 * PLANT_DT; END_IF\ndiSensor := rPos > 0.95;'
  },
  tests: [                                       // automatische Prüfungen
    { name: 'Start-Taster startet das Band', steps: [
      { set: { diStart: true } }, { cycles: 2 },
      { expect: 'doMotor' },
      { set: { diStart: false } }, { ms: 500 },
      { expect: 'doMotor = TRUE', msg: 'Selbsthaltung fehlt: Band muss nach Loslassen weiterlaufen.' }
    ]}
  ]
}
```

**Test-Schritte:**
* `{ set: { var: wert } }` – globale Variablen setzen (auch Struktur-Elemente `'stCmd.bStart'`)
* `{ cycles: n }` – n Zyklen ausführen
* `{ ms: n }` – Zeit laufen lassen (= n / cycleMs Zyklen)
* `{ expect: '<ST-Ausdruck>', msg?: 'Fehlertext' }` – Ausdruck im Programm-Kontext (lokale + globale Variablen) muss TRUE sein
* `{ until: '<ST-Ausdruck>', maxMs: 5000, msg? }` – laufen lassen bis Ausdruck TRUE, sonst Fehler
* `{ never: '<ST-Ausdruck>', ms: 2000, msg? }` – Ausdruck darf in dieser Zeit nie TRUE werden

Jeder Test startet mit einer frischen Instanz (`_INIT` läuft). Gute Tests prüfen Normalfall, Grenzfall und Fehlerfall.
3–6 Tests pro Übung.

**Unterstützter ST-Sprachumfang** (Interpreter `public/js/st/`):
* Datentypen: BOOL, SINT, INT, DINT, LINT, USINT, UINT, UDINT, ULINT, BYTE, WORD, DWORD, LWORD, REAL, LREAL,
  TIME, DATE_AND_TIME (als DINT-Sekunden), STRING[n], WSTRING[n],
  `ARRAY[a..b] OF T` (auch mehrdimensional `ARRAY[0..2,0..3] OF INT`), Strukturen, Enums, Unterbereichs-Typen nicht.
* `Types.typ`: `TYPE  MyStruct : STRUCT a : INT; b : BOOL; END_STRUCT; END_TYPE`, Enums `eState : (ST_IDLE, ST_RUN := 10, ST_ERROR);`
* `Variables.var`: `VAR … END_VAR`, `VAR CONSTANT … END_VAR`, Initialwerte `nX : INT := 5;`, Array-Init `[1,2,3]`, `[5(0)]`
* Literale: `16#FF`, `2#1010`, `1.5E3`, `T#1s500ms`, `TIME#2m`, `'Text'`, `TRUE/FALSE`, typisiert `INT#5`
* Anweisungen: `:=`, `IF/ELSIF/ELSE/END_IF`, `CASE x OF 1,2: … 3..5: … ELSE … END_CASE` (auch Enum-Labels),
  `FOR i := 0 TO 9 BY 1 DO … END_FOR`, `WHILE … DO … END_WHILE`, `REPEAT … UNTIL … END_REPEAT`, `EXIT`, `RETURN`, `CONTINUE`
* Operatoren: `+ - * / MOD **`, `= <> < > <= >=`, `AND & OR XOR NOT`, Bitzugriff `wStatus.3`
* FUNCTION_BLOCK / FUNCTION selbst definieren (in einer Datei `Main.st` oder Zusatz-Tab) im IEC-Stil:
  `FUNCTION_BLOCK FB_Motor VAR_INPUT … END_VAR VAR_OUTPUT … END_VAR VAR … END_VAR … END_FUNCTION_BLOCK`
  (in AS6 liegen die Deklarationen in der `.fun`-Datei – im Aufgabentext erwähnen).
* Aufruf: `fbTimer(IN := bStart, PT := T#2s);` dann `fbTimer.Q`, Funktionen `x := FC_Scale(nRaw, 0.0, 100.0);`
* Standard-FBs: `TON, TOF, TP, R_TRIG, F_TRIG, CTU, CTD, CTUD, SR, RS`
* Funktionen: `ABS SQRT EXP LN LOG SIN COS TAN ASIN ACOS ATAN MIN MAX LIMIT SEL MUX TRUNC
  SHL SHR ROL ROR LEN LEFT RIGHT MID CONCAT FIND INSERT DELETE REPLACE`,
  Konvertierungen `*_TO_*` (z. B. `INT_TO_REAL`, `REAL_TO_INT`, `DINT_TO_STRING`, `STRING_TO_INT`, `TIME_TO_DINT`), `SIZEOF`
* B&R-nahe Simulationsbausteine (vereinfacht, Verhalten im Aufgabentext beschreiben, falls genutzt):
  * mapp Motion (vereinfacht): `MpAxisBasic` (Eingänge `Enable, Power, Home, MoveAbsolute, MoveVelocity, Stop, ErrorReset,
    Parameters: MpAxisBasicParType (Position, Velocity, Acceleration, Deceleration, Direction)`, Ausgänge
    `Active, PowerOn, IsHomed, InPosition, MoveActive, Stopped, Position, Velocity, Error, StatusID, Info`).
    Achse wird mit `MpAxisBasic_0.MpLink := ADR(gAxis01)` nicht benötigt – einfach Instanz verwenden.
  * PLCopen (vereinfacht, eine simulierte Achse pro Instanz-Name `Axis`): `MC_Power, MC_Home, MC_MoveAbsolute,
    MC_MoveRelative, MC_MoveVelocity, MC_Stop, MC_Halt, MC_Reset, MC_ReadActualPosition` mit Parameter `Axis := gAxis01`
    (globale Variable vom Typ `AXIS_REF` in `io` mit `type: 'AXIS_REF'` anlegen).
  * mapp Control: `MTBasicsPID` (Enable, PIDParameters.Gain/IntegrationTime/DerivativeTime, SetValue, ActualValue,
    MinOut, MaxOut → Out, Active, Error), `MTBasicsPT1` (Enable, Gain, TimeConstant, In → Out).
  * Kommunikation (simulierte Gegenstelle): `TcpOpen, TcpClient, TcpSend, TcpRecv, TcpClose` (AsTCP-ähnlich:
    `enable, pIfAddr… → status, ident`; status 0 = ok, 65535 = busy), Echo-Server auf 127.0.0.1:5000.
  * Alarme: `MpAlarmXSet(gAlarmXCore, 'Name')`, `MpAlarmXReset(...)`, `MpAlarmXCheckState(...)` (vereinfacht).
  * Strings: `brsstrcpy, brsstrcat, brsstrlen, brsmemset, brsitoa, brsatoi` mit `ADR(...)` als Argument.
  * `ADR(x)` liefert eine Referenz, nur als Argument dieser Bausteine nutzbar. Echte Pointer-Arithmetik gibt es nicht.
* Endlosschleife → „Zykluszeitverletzung“ wie auf dem echten Target.

**Szenen** (`scene.type` und mögliche `bind`-Schlüssel, alle Werte sind globale Variablennamen):
* `generic` – nur I/O-Panel (Standard)
* `conveyor` – `motor` (BOOL), `reverse` (BOOL), `sensor` (BOOL), `sensor2` (BOOL), `partPos` (REAL 0..1), `count` (Zahl)
* `tank` – `level` (REAL 0..100), `inlet` (BOOL), `outlet` (BOOL), `heater` (BOOL), `temp` (REAL °C), `mixer` (BOOL), `lsHigh`, `lsLow` (BOOL)
* `axis` – `position` (REAL mm), `min`, `max` (Zahlen, keine Variablen erlaubt → als Literal), `powered` (BOOL), `homed` (BOOL), `error` (BOOL)
* `trafficlight` – `red`, `yellow`, `green`, `pedRed`, `pedGreen`, `request` (BOOL)
* `cylinder` – `extend` (BOOL Ventil), `retract` (BOOL), `isOut`, `isIn` (BOOL Endlagen), `stroke` (REAL 0..1)
* `lamp` – `lamps`: Array von Variablennamen (BOOL), z. B. ['doH1','doH2','doH3']
* `motor` – `run` (BOOL), `speed` (REAL), `fault` (BOOL), `current` (REAL A)

### Typ `git` – Versionsverwaltung (simuliertes Terminal)

```js
{
  id: 'ex1', type: 'git', title: 'Ersten Feature-Branch anlegen',
  task: 'Markdown-Aufgabentext.',
  hints: ['…'],
  setup: {
    cloned: true,                                 // Repo ist bereits geklont (sonst muss git clone ausgeführt werden)
    remote: 'https://git.breitner.de/ausbildung/foerderband.git',
    files: { 'Logical/Main.st': '…', '.gitignore': 'Temp/\nBinaries/\n' },  // Stand des ersten Commits
    commits: [ { msg: 'Grundgerüst', files: { 'Logical/Main.st': '…' } } ], // weitere Commits auf main
    branches: { 'feature/alt': [ { msg: '…', files: { … } } ] },            // optional
    remoteCommits: [ { branch: 'main', author: 'Kollege', msg: '…', files: { … } } ],  // optional: liegen nur im Remote (pull nötig)
    user: false                                   // false = user.name/email muss noch gesetzt werden
  },
  checks: [
    { type: 'currentBranch', name: 'feature/start-stopp' },
    { type: 'branchExists', name: 'feature/start-stopp' },
    { type: 'commitCountMin', branch: 'feature/start-stopp', n: 2 },
    { type: 'lastCommitMsgMatches', branch: 'feature/start-stopp', pattern: '^(feat|fix|docs|refactor):' },
    { type: 'fileContains', path: 'Logical/Main.st', text: 'diStop', branch: 'feature/start-stopp' },
    { type: 'clean' },                            // keine uncommitteten Änderungen
    { type: 'merged', from: 'feature/x', into: 'main' },
    { type: 'remoteHasBranch', name: 'feature/start-stopp' },
    { type: 'remoteInSync', branch: 'main' },
    { type: 'noConflictMarkers' },
    { type: 'tagExists', name: 'v1.0.0' },
    { type: 'userConfigured' },
    { type: 'fileNotTracked', path: 'Temp/x.o' },
    { type: 'commandUsed', pattern: '^git (switch -c|checkout -b) ' }
  ],
  solution: ['git switch -c feature/start-stopp', 'echo "…" >> Logical/Main.st', 'git add .', 'git commit -m "feat: …"']
}
```
Jeder Check kann `msg` (Fehlertext) haben. Die `solution` ist eine Befehlsfolge, die alle Checks erfüllt.

Unterstützte Befehle: `git init | clone <url> | status | add <pfad|.|-A> | commit -m "…" [-a] [--amend] |
log [--oneline] [--graph] [--all] [-n N] | branch [name] [-d|-D name] [-a] | checkout <b> | checkout -b <b> |
switch [-c] <b> | merge <b> [--no-ff] [--abort] | diff [--staged] | restore [--staged] <f> | reset [--soft|--mixed|--hard] <ref> |
revert <hash> | tag [name] [-a name -m "…"] | push [-u] [origin] [branch] [--tags] | pull | fetch |
remote [-v] | remote add <name> <url> | stash [pop|list] | config [--global] user.name|user.email "…" | rm <f> | mv <a> <b> | show [ref]`
sowie Shell: `ls, cat, echo "…" > f, echo "…" >> f, edit <f> (Mini-Editor), cd, pwd, mkdir, touch, rm, clear, help`.
Referenzen: Branchname, Kurz-Hash, `HEAD`, `HEAD~n`.

## Validierung

```bash
node tools/validate-content.js content/areas/<id>.js   # Struktur, IDs, req, Anzahl Guides
node tools/check-exercises.js  content/areas/<id>.js   # Musterlösung besteht alle Tests, Startcode nicht
```

### Prüfregeln für Quellen
* **YouTube:** `curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json"` muss JSON liefern.
  `title` und `channel` (= `author_name`) **exakt** aus der Antwort übernehmen. Videos finden z. B. über
  `curl -s -A "Mozilla/5.0" "https://www.youtube.com/results?search_query=<suche>" | grep -oE '"videoId":"[^"]{11}"' | sort -u`
  oder die Websuche. Lieber Kanäle von B&R, Hochschulen, etablierten Ausbildern. Deutsch bevorzugt, Englisch ok.
* **Texte:** `curl -s -L -A "Mozilla/5.0" -o /dev/null -w "%{http_code}" <url>` muss **200** liefern.
  `https://www.br-automation.com` ist aus dem Build-Container nicht erreichbar – stattdessen `help.br-automation.com`
  (AS6-Hilfe) und `community.br-automation.com` nutzen, die sind prüfbar.
* Reihenfolge: Uni-/Hochschulskripte zuerst, dann freie Fachbücher, Hersteller-Doku (B&R Help, PLCopen, OPC Foundation, git-scm.com),
  amtliche Quellen (DGUV, BAuA, IHK/BIBB).
