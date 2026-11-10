'use strict';
const { L, ABGERUFEN, SERVER, asProject, GITIGNORE_AS } = require('./common');

module.exports = [
  // ───────────────────────────────────────────── Level 1 · Modul 1
  {
    id: 'git-1-grundlagen',
    level: 1,
    kind: 'lektion',
    title: 'Warum Versionsverwaltung? Repository, Commit, Staging',
    summary: 'Du verstehst die Grundbegriffe von Git, richtest git bash und TortoiseGit ein und machst deinen ersten Commit.',
    minutes: 120,
    req: [],
    briefing: 'Maschinensoftware entwickelt sich über Jahre weiter: neue Funktionen, Fehlerkorrekturen, Kundenvarianten. Ohne Versionsverwaltung endet das in Ordnern wie „Projekt_final_neu2.zip“ und niemand weiß, welcher Stand auf welcher Maschine läuft. Git speichert jeden Stand als Commit mit Autor, Zeit und Beschreibung und macht Änderungen nachvollziehbar und umkehrbar. In diesem Modul lernst du die drei Bereiche Working Tree, Staging Area (Index) und Repository kennen und den Grundzyklus status → add → commit → log.',
    practice: 'Bei einer Störung beim Kunden musst du sagen können, welcher Softwarestand auf der Steuerung läuft und was sich gegenüber dem letzten funktionierenden Stand geändert hat. Mit Git beantwortest du das mit einem Blick in die Historie statt mit Rätselraten.',
    transfer: {
      tia: 'TIA Portal speichert Projekte in einem binären Projektformat; für Git brauchst du einen Export in Textdateien (z. B. über das Version Control Interface oder TIA Openness). Ein AS6-Projekt besteht dagegen schon aus Textdateien (.st, .var, .typ, .pkg, .hw, .sw) und lässt sich direkt versionieren.',
      codesys: 'CODESYS speichert ein Projekt als einzelne .project-Datei und braucht für Git ein Zusatzpaket. TwinCAT 3 legt POUs als XML-Dateien (.TcPOU) ab und integriert Git über Visual Studio – vom Prinzip her ähnlich wie Automation Studio.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre Working Tree, Staging Area und Repository',
        guide: {
          intro: 'Git kennt drei Bereiche. Wer sie verstanden hat, versteht fast jede Git-Meldung.',
          steps: [
            '**Working Tree**: die Dateien, die du in Automation Studio oder im Explorer siehst und bearbeitest.',
            '**Staging Area (Index)**: die Auswahl der Änderungen, die in den nächsten Commit sollen. Du füllst sie mit `git add`.',
            '**Repository**: der Ordner `.git` mit allen Commits. `git commit` speichert den Inhalt der Staging Area dauerhaft als neuen Commit.',
            'Ein **Commit** ist ein vollständiger Schnappschuss des Projekts mit eindeutigem Hash (z. B. `a3f9c21`), Autor, Datum und Commit-Message.',
            'Zeichne die drei Bereiche auf und trage die Befehle `add`, `commit` und `restore` als Pfeile ein.'
          ],
          done: 'Erledigt, wenn du ohne Unterlagen erklären kannst, warum eine Änderung nach `git add`, aber vor `git commit` noch nicht in der Historie steht.',
          tip: 'Die Staging Area erlaubt saubere Commits: Du kannst zwei Änderungen an verschiedenen Dateien getrennt committen, auch wenn du sie gleichzeitig gemacht hast.',
          link: { label: 'Pro Git: Was ist Versionsverwaltung?', url: 'https://git-scm.com/book/de/v2/Erste-Schritte-Was-ist-Versionsverwaltung%3F' }
        }
      },
      {
        id: 'o2',
        title: 'Richte Git für Windows und TortoiseGit ein',
        guide: {
          intro: 'Bei BREITNER nutzt du Git für Windows (mit git bash) und TortoiseGit als Explorer-Integration. Beide arbeiten auf demselben Repository.',
          steps: [
            'Installiere **Git für Windows** (enthält git bash) und danach **TortoiseGit** aus dem Softwarekatalog bzw. nach Vorgabe deiner IT.',
            'Öffne im Explorer per Rechtsklick **Open Git Bash here** (unter Windows 11 ggf. erst **Weitere Optionen anzeigen**, Umschalt+F10).',
            'Setze deine Identität: `git config --global user.name "Vorname Nachname"` und `git config --global user.email "vorname.nachname@breitner.de"`.',
            'Prüfe die Einstellung mit `git config --global --list`.',
            'In TortoiseGit findest du dieselben Werte unter Rechtsklick › **TortoiseGit › Settings › Git** (Name, Email). Sie werden in derselben globalen Konfiguration gespeichert.'
          ],
          code: { lang: 'bash', text: 'git config --global user.name "Max Muster"\ngit config --global user.email "max.muster@breitner.de"\ngit config --global --list' },
          done: 'Erledigt, wenn `git config --global --list` deinen Namen und deine Firmen-E-Mail anzeigt.',
          tip: 'Verwende genau die E-Mail-Adresse, mit der du auf git.breitner.de angemeldet bist. Nur dann ordnet der Server deine Commits deinem Konto zu.',
          link: { label: 'Pro Git: Git Basis-Konfiguration', url: 'https://git-scm.com/book/de/v2/Erste-Schritte-Git-Basis-Konfiguration' }
        }
      },
      {
        id: 'o3',
        title: 'Führe den Grundzyklus status → add → commit aus',
        guide: {
          intro: 'Fast jede Arbeit mit Git folgt demselben Ablauf. Übe ihn, bis er sitzt.',
          steps: [
            'Ändere eine Datei, z. B. `Logical/Main/Main.st` in Automation Studio, und speichere (Strg+S).',
            'Prüfe mit `git status`, welche Dateien geändert (modified) oder neu (untracked) sind.',
            'Sieh dir die Änderung mit `git diff` an. Rote Zeilen (`-`) wurden entfernt, grüne (`+`) hinzugefügt.',
            'Nimm die Datei mit `git add Logical/Main/Main.st` in die Staging Area auf und prüfe erneut `git status`.',
            'Committe mit `git commit -m "Stopp-Taster in Bandlogik ergänzt"`.',
            'In TortoiseGit: Rechtsklick auf den Projektordner › **Git Commit -> "main"…**, Dateien anhaken, Message eintragen, **Commit**.'
          ],
          code: { lang: 'bash', text: 'git status\ngit diff\ngit add Logical/Main/Main.st\ngit commit -m "Stopp-Taster in Bandlogik ergänzt"' },
          done: 'Erledigt, wenn `git status` nach dem Commit „nothing to commit, working tree clean“ meldet.',
          tip: 'Lies die Ausgabe von `git status` immer ganz. Git schlägt dir dort meist schon den nächsten sinnvollen Befehl vor.'
        }
      },
      {
        id: 'o4',
        title: 'Lies die Historie mit git log und Show log',
        guide: {
          intro: 'Die Historie ist das Gedächtnis des Projekts. Du musst sie schnell durchsuchen können.',
          steps: [
            '`git log` zeigt alle Commits mit Hash, Autor, Datum und Message, der neueste zuerst.',
            '`git log --oneline` zeigt eine Zeile pro Commit, `git log -n 3` nur die letzten drei.',
            '`git show <hash>` zeigt den Inhalt eines einzelnen Commits inklusive Diff.',
            'In TortoiseGit: Rechtsklick › **TortoiseGit › Show log**. Oben die Commits, in der Mitte die Message, unten die geänderten Dateien. Doppelklick auf eine Datei öffnet den Diff.'
          ],
          code: { lang: 'bash', text: 'git log --oneline\ngit show HEAD' },
          done: 'Erledigt, wenn du für den letzten Commit Autor, Datum und geänderte Dateien nennen kannst.',
          tip: '`HEAD` ist der Commit, auf dem du gerade stehst. `HEAD~1` ist sein Vorgänger.',
          link: { label: 'TortoiseGit: Log Dialog', url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-showlog.html' }
        }
      }
    ],
    videos: [
      { id: 'HIp2omFNmJY', title: 'Was ist Git? // deutsch', channel: 'the native web GmbH', lang: 'de', why: 'Kompakte deutschsprachige Einführung in Idee und Begriffe von Git.' },
      { id: 'Nkz7TnhFvWU', title: 'Git Crashkurs [001] - Was ist Git?', channel: 'Brotcrunsher', lang: 'de', why: 'Erster Teil einer kurzen deutschen Reihe, die später auch TortoiseGit zeigt.' },
      { id: '2sjqTHE0zok', title: 'Lecture 6: Version Control (git) (2020)', channel: 'Missing Semester', lang: 'en', why: 'MIT-Vorlesung, die das Datenmodell von Git (Snapshots, Commits, Referenzen) sauber herleitet.' }
    ],
    readings: [
      {
        title: 'Versionsverwaltung mit git (Übungsfolien)', author: 'Ulbrich, P.', institution: 'Technische Universität Dortmund, Arbeitsgruppe Systemsoftware',
        work: 'Übungen zur Vorlesung Verlässliche Systemsoftware', year: 2024, type: 'Uni-Skript', minutes: 40,
        url: 'https://sys-sideshow.cs.tu-dortmund.de/lehre/ss24/vss/material/C11_Git.pdf',
        why: 'Hochschulfolien mit den Grundbegriffen und Befehlen in kompakter Form.',
        apa: 'Ulbrich, P. (2024). *Git – Übungen zur Vorlesung Verlässliche Systemsoftware*. Technische Universität Dortmund. ' + ABGERUFEN + 'https://sys-sideshow.cs.tu-dortmund.de/lehre/ss24/vss/material/C11_Git.pdf'
      },
      {
        title: 'Git Grundlagen – Änderungen nachverfolgen und im Repository speichern', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 30,
        url: 'https://git-scm.com/book/de/v2/Git-Grundlagen-%c3%84nderungen-nachverfolgen-und-im-Repository-speichern',
        why: 'Das frei verfügbare Standardwerk erklärt status, add, commit und diff ausführlich.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Grundlagen-%c3%84nderungen-nachverfolgen-und-im-Repository-speichern'
      },
      {
        title: 'Does B&R have a version control system integrated?', author: 'B&R Community', institution: 'B&R Industrial Automation',
        work: 'B&R Community Forum', year: 2024, type: 'Hersteller', minutes: 10,
        url: 'https://community.br-automation.com/t/does-b-r-have-a-version-control-system-integrated/4694',
        why: 'Antwort aus der B&R Community: Automation Studio bringt keine eigene Versionsverwaltung mit, empfohlen wird Git mit z. B. TortoiseGit.',
        apa: 'B&R Community. (2024). *Does B&R have a version control system integrated?* B&R Industrial Automation. ' + ABGERUFEN + 'https://community.br-automation.com/t/does-b-r-have-a-version-control-system-integrated/4694'
      }
    ],
    quiz: [
      { type: 'single', q: 'Du hast `Main.st` geändert und `git add Main.st` ausgeführt. Wo befindet sich die Änderung jetzt?', options: ['Nur im Working Tree', 'In der Staging Area, aber noch in keinem Commit', 'Im Repository als neuer Commit', 'Auf dem Server git.breitner.de'], correct: 1, explain: '`git add` übernimmt die Änderung in die Staging Area. Erst `git commit` erzeugt daraus einen Commit im lokalen Repository; auf dem Server landet er erst mit `git push`.' },
      { type: 'multi', q: 'Welche Informationen speichert Git zu jedem Commit?', options: ['Autor und E-Mail', 'Zeitpunkt', 'Commit-Message', 'Die Zykluszeit der Steuerung', 'Verweis auf den Vorgänger-Commit'], correct: [0, 1, 2, 4], explain: 'Ein Commit enthält Snapshot, Autor, Datum, Message und den Verweis auf den/die Eltern-Commit(s). Mit der Steuerung selbst hat Git nichts zu tun.' },
      { type: 'single', q: 'Welcher Befehl zeigt dir, welche Dateien geändert, aber noch nicht vorgemerkt sind?', options: ['git log', 'git status', 'git commit', 'git config'], correct: 1, explain: '`git status` zeigt den Zustand von Working Tree und Staging Area.' }
    ],
    exam: [
      { type: 'single', q: 'Warum solltest du `user.email` auf deine Firmenadresse setzen?', options: ['Sonst startet Automation Studio nicht', 'Damit der Git-Server die Commits deinem Konto zuordnen kann', 'Damit Commits verschlüsselt werden', 'Weil Git sonst keine Branches erlaubt'], correct: 1, explain: 'Git schreibt Name und E-Mail in jeden Commit. Server wie git.breitner.de verknüpfen Commits über die E-Mail mit dem Benutzerkonto.' },
      { type: 'single', q: 'Was bedeutet `HEAD~2`?', options: ['Die zwei neuesten Commits', 'Den Commit zwei Schritte vor dem aktuellen', 'Den Branch mit dem Namen HEAD~2', 'Den zweiten Tag'], correct: 1, explain: '`~n` geht n Eltern-Commits zurück. `HEAD~2` ist der Vor-Vorgänger des aktuellen Commits.' },
      { type: 'multi', q: 'Welche Vorteile bringt Versionsverwaltung bei Maschinensoftware?', options: ['Nachvollziehbar, welcher Stand auf welcher Maschine läuft', 'Änderungen lassen sich gezielt rückgängig machen', 'Mehrere Personen können parallel arbeiten', 'Die Zykluszeit der Steuerung sinkt'], correct: [0, 1, 2], explain: 'Versionsverwaltung betrifft den Entwicklungsprozess, nicht das Laufzeitverhalten der Steuerung.' },
      { type: 'single', q: 'Wo liegt das lokale Repository eines Projekts?', options: ['Im Ordner Temp/', 'Im versteckten Ordner .git im Projektverzeichnis', 'Nur auf dem Server', 'In der .apj-Datei'], correct: 1, explain: 'Alle Commits und Referenzen liegen im Ordner `.git`. Wird er gelöscht, ist die lokale Historie weg.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Identität setzen und ersten Commit erstellen',
        task: L(
          'Du hast das Repository `foerderband` bereits geklont. Auf diesem Rechner ist Git aber noch nicht eingerichtet.',
          '',
          '1. Setze `user.name` und `user.email` (global).',
          '2. Ergänze am Ende von `Logical/Main/Main.st` den Kommentar `// diStop: Stopp-Taster S2 (Öffner)`.',
          '3. Prüfe mit `git status` und `git diff`, was sich geändert hat.',
          '4. Nimm die Datei in die Staging Area auf und committe sie mit einer aussagekräftigen Message.',
          '5. Am Ende darf es keine uncommitteten Änderungen geben.'
        ),
        hints: ['`git config --global user.name "Vorname Nachname"`', 'Text anhängen: `echo "// diStop: Stopp-Taster S2 (Öffner)" >> Logical/Main/Main.st`', '`git status` zeigt dir nach jedem Schritt, wo du stehst.'],
        setup: {
          cloned: true,
          remote: SERVER + 'foerderband.git',
          files: Object.assign(asProject('Foerderband'), { '.gitignore': GITIGNORE_AS }),
          commits: [],
          user: false
        },
        checks: [
          { type: 'userConfigured', msg: 'Name und E-Mail sind noch nicht gesetzt.' },
          { type: 'commitCountMin', branch: 'main', n: 2, msg: 'Auf main fehlt dein neuer Commit.' },
          { type: 'fileContains', path: 'Logical/Main/Main.st', text: 'diStop', branch: 'main', msg: 'Der Kommentar zu diStop ist nicht im Commit.' },
          { type: 'clean', msg: 'Es gibt noch uncommittete Änderungen.' }
        ],
        solution: [
          'git config --global user.name "Max Muster"',
          'git config --global user.email "max.muster@breitner.de"',
          'echo "// diStop: Stopp-Taster S2 (Öffner)" >> Logical/Main/Main.st',
          'git status',
          'git diff',
          'git add Logical/Main/Main.st',
          'git commit -m "Kommentar zum Stopp-Taster ergänzt"',
          'git log --oneline'
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────────────────────── Level 1 · Modul 2
  {
    id: 'git-1-commits-ignore',
    level: 1,
    kind: 'lektion',
    title: 'Gute Commits und .gitignore für Automation-Studio-Projekte',
    summary: 'Du schreibst Commit-Messages nach Conventional Commits und hältst generierte AS-Dateien mit .gitignore aus dem Repository.',
    minutes: 120,
    req: ['git-1-grundlagen'],
    briefing: 'Ein Repository ist nur so gut wie seine Historie. Messages wie „Änderungen“ oder „asdf“ helfen bei der Fehlersuche niemandem. Conventional Commits geben jeder Message eine feste Form (`typ(bereich): beschreibung`), aus der sich später sogar Changelogs und Versionsnummern ableiten lassen. Genauso wichtig ist, was NICHT ins Repository gehört: Automation Studio erzeugt beim Build große Mengen an Dateien (Temp/, Binaries/), dazu benutzerspezifische Dateien (*.isopen, Benutzer-.set). Die B&R Community empfiehlt, nur Logical/, Physical/ und die .apj-Datei zu versionieren.',
    practice: 'Wenn jemand nach einem Build 3000 geänderte Objektdateien committet, sieht im Review niemand mehr die eine geänderte Zeile im Programm. Eine saubere .gitignore von Projektbeginn an verhindert das und spart Konflikte im Team.',
    transfer: {
      tia: 'Bei TIA-Projekten gehören z. B. die Ordner für temporäre Daten und Logs nicht ins Repository; die Regel „nur Quellen, keine Build-Ergebnisse“ gilt genauso.',
      codesys: 'In TwinCAT 3 ignorierst du typischerweise _Boot/, _CompileInfo/, *.~u und benutzerspezifische .suo-Dateien – gleiches Prinzip wie Temp/ und Binaries/ in Automation Studio.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Schreibe Commit-Messages nach Conventional Commits',
        guide: {
          intro: 'Conventional Commits ist eine leichtgewichtige Konvention für Commit-Messages. Die erste Zeile lautet `typ(bereich): beschreibung`.',
          steps: [
            'Wähle den Typ: `feat` (neue Funktion), `fix` (Fehlerkorrektur), `docs`, `refactor` (Umbau ohne Verhaltensänderung), `test`, `chore` (Pflege, z. B. .gitignore), `build`, `ci`.',
            'Optional den Bereich in Klammern, z. B. `fix(foerderband):` oder `feat(hmi):`.',
            'Beschreibung im Imperativ oder als knapper Satz, max. ca. 50–72 Zeichen, ohne Punkt am Ende: `fix(foerderband): Stopp-Taster als Öffner auswerten`.',
            'Bei Bedarf Leerzeile und Body: Warum war die Änderung nötig? Was ist der Effekt an der Maschine?',
            'Inkompatible Änderung (z. B. geänderte Schnittstelle zum Leitrechner): `feat!:` oder Footer `BREAKING CHANGE: …`.'
          ],
          code: { lang: 'text', text: 'fix(foerderband): Stopp-Taster als Öffner auswerten\n\nS2 ist laut Schaltplan ein Öffner. Bisher wurde das Signal\nnicht invertiert, der Motor lief bei Drahtbruch weiter.\n\nRefs: #42' },
          done: 'Erledigt, wenn du für fünf typische Änderungen (Bugfix, neue Funktion, .gitignore, Kommentar, Umbau) jeweils eine korrekte erste Zeile formulieren kannst.',
          tip: 'Ein Commit = eine logische Änderung. Wenn du in der Message „und“ schreiben musst, sind es meist zwei Commits.',
          link: { label: 'Conventional Commits 1.0.0 (deutsch)', url: 'https://www.conventionalcommits.org/de/v1.0.0/' }
        }
      },
      {
        id: 'o2',
        title: 'Erkläre, welche Dateien eines AS6-Projekts versioniert werden',
        guide: {
          intro: 'Ein AS-Projekt enthält Quellen und viele Dateien, die beim Build oder beim Öffnen entstehen.',
          steps: [
            '**Versionieren**: die `.apj`-Datei, den Ordner `Logical/` (Programme, .var, .typ, .pkg, Bibliotheken) und `Physical/` (Hardware.hw, Cpu.sw, Konfigurationen).',
            '**Ignorieren**: `Temp/` und `Binaries/` (Build-Ergebnisse, werden bei jedem Build neu erzeugt).',
            '**Ignorieren**: `Diagnosis/` (Watch- und Trace-Konfigurationen; optional einzelne Dateien bewusst aufnehmen).',
            '**Ignorieren**: `*.isopen` (Markierung „Projekt ist geöffnet“) und die benutzerspezifische `.set`-Datei im Projektwurzelverzeichnis (`/*.set`).',
            'Achtung: `.set`-Dateien innerhalb von `Physical/` (z. B. bei mapp Safety) können zum Projekt gehören. Darum `/*.set` (nur Wurzel) statt pauschal `*.set` verwenden.'
          ],
          done: 'Erledigt, wenn du für jeden Ordner deines Übungsprojekts begründen kannst, ob er ins Repository gehört.',
          tip: 'Faustregel: Alles, was ein Kollege nach dem Klonen durch einen Build selbst erzeugen kann, gehört nicht ins Repository.',
          link: { label: 'B&R Community: .gitignore file for AS projects', url: 'https://community.br-automation.com/t/gitignore-file-for-as-projects/3714' }
        }
      },
      {
        id: 'o3',
        title: 'Lege eine .gitignore neben der .apj-Datei an',
        guide: {
          intro: 'Die `.gitignore` liegt im Wurzelverzeichnis des Repositorys, bei AS-Projekten neben der `.apj`-Datei.',
          steps: [
            'Öffne git bash im Projektordner (Rechtsklick › **Open Git Bash here**).',
            'Lege die Datei an, z. B. mit einem Editor (Notepad++, VS Code) oder per `echo "Temp/" >> .gitignore` Zeile für Zeile.',
            'Trage mindestens ein: `Temp/`, `Binaries/`, `Diagnosis/`, `*.isopen`, `/*.set`.',
            'Baue das Projekt in Automation Studio (**Project › Build**, F7) und prüfe mit `git status`, dass keine Dateien aus Temp/ oder Binaries/ mehr auftauchen.',
            'Committe die `.gitignore` als eigenen Commit: `git commit -m "chore: .gitignore für Automation Studio"`.',
            'In TortoiseGit kannst du eine untracked Datei per Rechtsklick › **TortoiseGit › Add to ignore list** direkt eintragen.'
          ],
          code: { lang: 'text', text: '# Automation Studio – generierte Dateien\nTemp/\nBinaries/\nDiagnosis/\n*.isopen\n/*.set' },
          done: 'Erledigt, wenn `git status` nach einem vollständigen Build nur noch deine echten Quelländerungen zeigt.',
          tip: 'Die B&R Community empfiehlt zusätzlich eine `.gitattributes` mit `* -text`, damit Git keine Zeilenenden in Hardware-, Safety- oder Firmware-Dateien umschreibt.',
          link: { label: 'TortoiseGit: Ignoring Files', url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-ignore.html' }
        }
      },
      {
        id: 'o4',
        title: 'Entferne versehentlich versionierte Build-Dateien',
        guide: {
          intro: '`.gitignore` wirkt nur auf Dateien, die Git noch nicht verfolgt. Bereits committete Dateien musst du aktiv aus dem Index entfernen.',
          steps: [
            'Prüfe mit `git ls-files Binaries` (auf echter git bash), ob Build-Dateien schon versioniert sind.',
            'Entferne sie aus dem Repository, aber nicht von der Platte: `git rm -r --cached Binaries Temp`.',
            'Trage die Ordner in die `.gitignore` ein (falls noch nicht geschehen).',
            'Committe: `git commit -m "chore: Build-Ergebnisse aus dem Repository entfernt"`.',
            'Im Simulator gibt es kein `--cached`; dort entfernst du die Datei mit `git rm <datei>` – das ist bei Build-Dateien unkritisch, da sie neu erzeugt werden.'
          ],
          code: { lang: 'bash', text: 'git rm -r --cached Binaries Temp\ngit commit -m "chore: Build-Ergebnisse aus dem Repository entfernt"' },
          done: 'Erledigt, wenn `git status` sauber ist und Binaries/ beim nächsten Build nicht mehr als geändert erscheint.',
          tip: 'Lege die .gitignore immer als allerersten Commit an. Dann musst du nie aufräumen.',
          link: { label: 'git-scm.com: gitignore', url: 'https://git-scm.com/docs/gitignore' }
        }
      }
    ],
    videos: [
      { id: '3RiJ9blg8uc', title: 'Gitignore Datei Erstellen! || Git Crashcurs Reihe || Teil #08', channel: 'Tammo', lang: 'de', why: 'Zeigt auf Deutsch, wie eine .gitignore angelegt wird und wirkt.' },
      { id: '6ZDVZ3rvif4', title: 'Datei in .gitignore, trotzdem getrackt: die Git-Regel', channel: 'MHM Digitale Lösungen UG', lang: 'de', why: 'Erklärt den häufigsten Irrtum: .gitignore wirkt nicht auf bereits versionierte Dateien.' },
      { id: 'OJqUWvmf4gg', title: 'Write git commit messages like a PRO with Conventional Commits', channel: 'Justin Brooks', lang: 'en', why: 'Praktische Einführung in Conventional Commits mit Beispielen.' }
    ],
    readings: [
      {
        title: '.gitignore file for AS projects', author: 'Krausert, M. et al.', institution: 'B&R Community',
        work: 'B&R Community Forum', year: 2024, type: 'Hersteller', minutes: 15,
        url: 'https://community.br-automation.com/t/gitignore-file-for-as-projects/3714',
        why: 'Von B&R-Mitarbeitern kommentierte Vorlage für eine .gitignore inklusive Hinweisen zu mapp Safety und .gitattributes.',
        apa: 'Krausert, M. et al. (2024). *.gitignore file for AS projects*. B&R Community. ' + ABGERUFEN + 'https://community.br-automation.com/t/gitignore-file-for-as-projects/3714'
      },
      {
        title: 'Conventional Commits 1.0.0', author: 'Conventional Commits Community', institution: 'conventionalcommits.org',
        work: 'Spezifikation', year: 2019, type: 'Dokumentation', minutes: 15,
        url: 'https://www.conventionalcommits.org/de/v1.0.0/',
        why: 'Die Spezifikation in deutscher Übersetzung – kurz und verbindlich.',
        apa: 'Conventional Commits. (2019). *Conventional Commits 1.0.0*. ' + ABGERUFEN + 'https://www.conventionalcommits.org/de/v1.0.0/'
      },
      {
        title: 'How do you structure your Git repository?', author: 'B&R Community', institution: 'B&R Community',
        work: 'B&R Community Forum', year: 2025, type: 'Hersteller', minutes: 10,
        url: 'https://community.br-automation.com/t/how-do-you-structure-your-git-repository/6492',
        why: 'Praxisbericht: nur Logical, Physical und .apj versionieren; Struktur bei mehreren Maschinen pro Repository.',
        apa: 'B&R Community. (2025). *How do you structure your Git repository?* ' + ABGERUFEN + 'https://community.br-automation.com/t/how-do-you-structure-your-git-repository/6492'
      }
    ],
    quiz: [
      { type: 'single', q: 'Welche erste Zeile entspricht Conventional Commits?', options: ['Fixed stuff.', 'fix(foerderband): Stopp-Taster als Öffner auswerten', 'FIX - Förderband!!!', 'Änderungen vom 10.11.'], correct: 1, explain: 'Form `typ(bereich): beschreibung`, kurz und konkret.' },
      { type: 'multi', q: 'Welche Einträge gehören in die .gitignore eines AS6-Projekts?', options: ['Temp/', 'Binaries/', 'Logical/', '*.isopen', 'Physical/'], correct: [0, 1, 3], explain: 'Logical/ und Physical/ sind die Quellen des Projekts. Temp/, Binaries/ und *.isopen werden erzeugt.' },
      { type: 'single', q: 'Du trägst `Binaries/` in die .gitignore ein, aber `git status` zeigt weiter Änderungen in Binaries/. Warum?', options: ['Die .gitignore muss in Binaries/ liegen', 'Die Dateien sind bereits versioniert; .gitignore wirkt nur auf untracked Dateien', 'Git ignoriert nur Dateien mit Endung .ignore', 'Automation Studio überschreibt die .gitignore'], correct: 1, explain: 'Bereits verfolgte Dateien musst du mit `git rm --cached` aus dem Index nehmen.' }
    ],
    exam: [
      { type: 'single', q: 'Warum ist `/*.set` besser als `*.set` in einem Projekt mit mapp Safety?', options: ['Es ist kürzer', '`/*.set` ignoriert nur die Benutzer-.set im Wurzelverzeichnis, Safety-.set-Dateien in Physical/ bleiben versioniert', '`*.set` ist ungültige Syntax', 'Es gibt keinen Unterschied'], correct: 1, explain: 'Ein führender Schrägstrich bindet das Muster an das Verzeichnis der .gitignore. Safety-Konfigurationen in Physical/ dürfen nicht verloren gehen.' },
      { type: 'single', q: 'Welcher Typ passt zu „.gitignore um Diagnosis/ erweitert“?', options: ['feat', 'fix', 'chore', 'refactor'], correct: 2, explain: 'Pflegearbeiten ohne Einfluss auf das Maschinenverhalten sind `chore`.' },
      { type: 'multi', q: 'Was zeichnet einen guten Commit aus?', options: ['Er enthält genau eine logische Änderung', 'Die Message erklärt was und warum', 'Er enthält alle Änderungen der Woche', 'Er enthält keine generierten Build-Dateien'], correct: [0, 1, 3], explain: 'Kleine, logisch abgeschlossene Commits ohne Build-Artefakte lassen sich reviewen und gezielt zurücknehmen.' },
      { type: 'single', q: 'Wie zeigst du in Conventional Commits eine inkompatible Änderung an?', options: ['Mit `!` nach dem Typ oder dem Footer `BREAKING CHANGE:`', 'Mit Großbuchstaben', 'Mit dem Typ `break`', 'Gar nicht, das regelt der Tag'], correct: 0, explain: 'Beides ist in der Spezifikation definiert und führt bei SemVer zu einer neuen Major-Version.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: '.gitignore für ein AS-Projekt anlegen',
        task: L(
          'Im Repository `abfuellung` fehlt noch eine `.gitignore`. Ein Build in Automation Studio hat bereits Dateien erzeugt – simuliere das zuerst:',
          '',
          '```',
          'mkdir Temp',
          'touch Temp/Main.o',
          'mkdir Binaries',
          'touch Binaries/cpu.br',
          'touch Abfuellung.isopen',
          '```',
          '',
          'Lege dann eine `.gitignore` an, die mindestens `Temp/`, `Binaries/`, `Diagnosis/` und `*.isopen` enthält, und committe sie mit einer Message vom Typ `chore`.',
          'Die erzeugten Dateien dürfen danach **nicht** versioniert sein, der Working Tree muss sauber sein.'
        ),
        hints: ['Zeile für Zeile: `echo "Temp/" > .gitignore`, dann `echo "Binaries/" >> .gitignore` …', 'Prüfe vor dem Commit mit `git status`: Die Build-Dateien dürfen nicht mehr als untracked erscheinen.', 'Message z. B. `chore: .gitignore für Automation Studio`'],
        setup: {
          cloned: true,
          remote: SERVER + 'abfuellung.git',
          files: asProject('Abfuellung'),
          commits: [],
          user: true
        },
        checks: [
          { type: 'fileContains', path: '.gitignore', text: 'Temp/', branch: 'main', msg: 'Temp/ fehlt in der committeten .gitignore.' },
          { type: 'fileContains', path: '.gitignore', text: 'Binaries/', branch: 'main', msg: 'Binaries/ fehlt in der committeten .gitignore.' },
          { type: 'fileContains', path: '.gitignore', text: 'Diagnosis/', branch: 'main', msg: 'Diagnosis/ fehlt in der committeten .gitignore.' },
          { type: 'fileNotTracked', path: 'Temp/Main.o', msg: 'Temp/Main.o wurde versioniert.' },
          { type: 'fileNotTracked', path: 'Binaries/cpu.br', msg: 'Binaries/cpu.br wurde versioniert.' },
          { type: 'fileNotTracked', path: 'Abfuellung.isopen', msg: 'Die .isopen-Datei wurde versioniert.' },
          { type: 'lastCommitMsgMatches', branch: 'main', pattern: '^chore(\\([^)]+\\))?: .+', msg: 'Die Commit-Message soll mit `chore:` beginnen.' },
          { type: 'clean' }
        ],
        solution: [
          'mkdir Temp',
          'touch Temp/Main.o',
          'mkdir Binaries',
          'touch Binaries/cpu.br',
          'touch Abfuellung.isopen',
          'git status',
          'echo "Temp/" > .gitignore',
          'echo "Binaries/" >> .gitignore',
          'echo "Diagnosis/" >> .gitignore',
          'echo "*.isopen" >> .gitignore',
          'echo "/*.set" >> .gitignore',
          'git status',
          'git add .gitignore',
          'git commit -m "chore: .gitignore für Automation Studio"'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Schlechte Commit-Message korrigieren und Build-Datei entfernen',
        task: L(
          'Ein Kollege hat im Repository `foerderband` lokal (noch nicht gepusht) zwei Fehler gemacht:',
          '',
          '- Die Build-Datei `Binaries/cpu.br` ist versioniert.',
          '- Der letzte Commit heißt nur `zeug`.',
          '',
          'Aufgaben:',
          '1. Korrigiere die Message des letzten Commits mit `git commit --amend` zu `fix(foerderband): Stopp-Taster als Öffner auswerten`.',
          '2. Entferne danach `Binaries/cpu.br` mit `git rm`, ergänze `Binaries/` in der `.gitignore` und committe beides mit einer `chore`-Message.',
          '3. Der Working Tree muss sauber sein.'
        ),
        hints: ['`git commit --amend -m "…"` ersetzt nur den letzten, noch nicht gepushten Commit.', '`git rm Binaries/cpu.br` entfernt die Datei und merkt das Löschen gleich vor.', 'Danach `echo "Binaries/" >> .gitignore`, `git add .gitignore`, `git commit -m "chore: …"`.'],
        setup: {
          cloned: true,
          remote: SERVER + 'foerderband.git',
          files: Object.assign(asProject('Foerderband'), { '.gitignore': L('Temp/', '*.isopen'), 'Binaries/cpu.br': 'BINARY-BUILD-RESULT\n' }),
          commits: [
            { msg: 'zeug', files: { 'Logical/Main/Main.st': L('PROGRAM _INIT', 'END_PROGRAM', '', 'PROGRAM _CYCLIC', '\t// S2 ist ein Öffner: TRUE = nicht betätigt', '\tdoMotor := diStart AND diStop;', 'END_PROGRAM') } }
          ],
          user: true
        },
        checks: [
          { type: 'commandUsed', pattern: '^git commit .*--amend', msg: 'Nutze `git commit --amend`, um die Message zu korrigieren.' },
          { type: 'commitCountMin', branch: 'main', n: 3, msg: 'Es fehlt der chore-Commit für die .gitignore.' },
          { type: 'fileNotTracked', path: 'Binaries/cpu.br', msg: 'Binaries/cpu.br ist noch versioniert.' },
          { type: 'fileContains', path: '.gitignore', text: 'Binaries/', branch: 'main', msg: 'Binaries/ fehlt in der .gitignore.' },
          { type: 'lastCommitMsgMatches', branch: 'main', pattern: '^chore(\\([^)]+\\))?: .+', msg: 'Der letzte Commit soll ein chore-Commit sein.' },
          { type: 'clean' }
        ],
        solution: [
          'git log --oneline',
          'git commit --amend -m "fix(foerderband): Stopp-Taster als Öffner auswerten"',
          'git rm Binaries/cpu.br',
          'echo "Binaries/" >> .gitignore',
          'git add .gitignore',
          'git commit -m "chore: Build-Ergebnisse aus dem Repository entfernt"',
          'git log --oneline'
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────────────────────── Level 1 · Projekt
  {
    id: 'git-1-projekt',
    level: 1,
    kind: 'projekt',
    title: 'Praxisprojekt: Eigenes AS6-Projekt auf git.breitner.de versionieren',
    summary: 'Du klonst dein persönliches Übungs-Repository, legst ein sauberes AS6-Projekt mit .gitignore an und pushst die ersten Commits.',
    minutes: 180,
    req: ['git-1-commits-ignore'],
    briefing: 'Jetzt setzt du alles zusammen: Auf git.breitner.de liegt für dich ein leeres oder vorbereitetes Repository. Du klonst es mit git bash oder TortoiseGit, legst dein AS6-Übungsprojekt (z. B. die Ampel aus dem Grundkurs) hinein, sorgst mit einer .gitignore für ein sauberes Repository und überträgst deine Commits mit `git push` auf den Server. Ab hier versionierst du jedes Übungsprojekt der Ausbildung auf diese Weise.',
    practice: 'Jedes Maschinenprojekt bei BREITNER beginnt genau so: Repository auf dem Server anlegen, klonen, Projektgerüst und .gitignore committen, pushen. Dein Ausbilder sieht danach im Web-Interface deine Historie.',
    transfer: {
      tia: 'Statt eines Projektarchivs (.zap) auf dem Netzlaufwerk liegt der Stand mit Historie auf dem Server – vergleichbar mit einem TIA Project Server, aber dateibasiert und unabhängig vom Engineering-Tool.',
      codesys: 'Entspricht dem Anlegen eines Projekts in einem Git-Repository mit TwinCAT/Visual Studio und dem ersten Push auf einen Azure-DevOps- oder GitLab-Server.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Klone dein Repository von git.breitner.de',
        guide: {
          intro: 'Klonen kopiert das komplette Repository inklusive Historie auf deinen Rechner und richtet `origin` als Remote ein.',
          steps: [
            'Melde dich im Browser auf **https://git.breitner.de** an und öffne dein Repository unter `ausbildung/<dein-name>-uebungen`.',
            'Kopiere die HTTPS-Adresse über die Schaltfläche **Clone**, z. B. `https://git.breitner.de/ausbildung/max-muster-uebungen.git`.',
            'git bash: Wechsle in deinen Projektordner (z. B. `cd /c/Projekte`) und führe `git clone <url>` aus, danach `cd <repo>`.',
            'TortoiseGit: Rechtsklick im Zielordner › **Git Clone…**, URL einfügen, Zielverzeichnis prüfen, **OK**. Beim ersten Zugriff fragt der Credential Manager nach Benutzername und Passwort/Token.',
            'Prüfe mit `git remote -v`, dass `origin` auf git.breitner.de zeigt.'
          ],
          code: { lang: 'bash', text: 'cd /c/Projekte\ngit clone https://git.breitner.de/ausbildung/max-muster-uebungen.git\ncd max-muster-uebungen\ngit remote -v' },
          done: 'Erledigt, wenn der geklonte Ordner einen versteckten Unterordner `.git` enthält und `git remote -v` den Server anzeigt.',
          tip: 'Lege Repositorys in einem kurzen Pfad ohne Leerzeichen ab (z. B. C:\\Projekte). Automation Studio und manche Tools haben Probleme mit sehr langen Pfaden.',
          link: { label: 'TortoiseGit: Clone', url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-clone.html' }
        }
      },
      {
        id: 'o2',
        title: 'Lege das AS6-Projekt im Repository an',
        guide: {
          intro: 'Die `.apj`-Datei liegt im Wurzelverzeichnis des Repositorys oder in einem Unterordner, wenn das Repository mehr als ein Projekt enthält.',
          steps: [
            'Lege in Automation Studio ein neues Projekt an (**File › New Project…**) und wähle als Speicherort den geklonten Ordner – oder kopiere dein vorhandenes Übungsprojekt hinein.',
            'Lege sofort die `.gitignore` neben der `.apj` an (Temp/, Binaries/, Diagnosis/, *.isopen, /*.set).',
            'Baue das Projekt einmal (F7) und prüfe mit `git status`, dass nur Quelldateien als untracked erscheinen.',
            'Committe zuerst die `.gitignore` (`chore: …`), danach das Projektgerüst (`feat: …`).'
          ],
          done: 'Erledigt, wenn `git log --oneline` mindestens zwei Commits zeigt und `git status` sauber ist.',
          tip: 'Ein README.md mit Kurzbeschreibung, Zielhardware und AS-Version hilft jedem, der das Repository später öffnet.'
        }
      },
      {
        id: 'o3',
        title: 'Pushe deine Commits auf den Server',
        guide: {
          intro: '`git push` überträgt deine lokalen Commits auf den Server. Erst dann sind sie gesichert und für andere sichtbar.',
          steps: [
            'git bash: `git push` (beim ersten Push eines neuen Branches `git push -u origin main`).',
            'TortoiseGit: Rechtsklick › **TortoiseGit › Push…**, Branch prüfen, **OK**.',
            'Kontrolliere mit `git status`: „Your branch is up to date with origin/main“.',
            'Öffne das Repository im Browser und prüfe, dass Commits und Dateien angekommen sind (Temp/ und Binaries/ dürfen fehlen).'
          ],
          code: { lang: 'bash', text: 'git push -u origin main\ngit status' },
          done: 'Erledigt, wenn die Commits im Web-Interface von git.breitner.de sichtbar sind.',
          tip: 'Pushe mindestens am Ende jedes Arbeitstags. Ein Commit, der nur auf deinem Laptop liegt, ist bei einem Defekt verloren.'
        }
      },
      {
        id: 'o4',
        title: 'Reiche den Nachweis ein',
        guide: {
          intro: 'Dein Ausbilder prüft das Repository direkt auf dem Server.',
          steps: [
            'Kopiere die Browser-URL deines Repositorys (z. B. `https://git.breitner.de/ausbildung/max-muster-uebungen`).',
            'Prüfe vorher: .gitignore vorhanden, keine Build-Dateien, mindestens drei Commits mit Conventional-Commits-Messages.',
            'Trage die URL im Nachweisfeld dieses Moduls ein.',
            'Gib deinem Ausbilder im Repository mindestens Leserechte (Einstellungen › Mitglieder bzw. Collaborators), falls es nicht in einer gemeinsamen Gruppe liegt.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist und der Ausbilder ihn öffnen kann.',
          tip: 'Prüfe die Darstellung einmal in einem privaten Browserfenster mit dem Konto des Ausbilders bzw. frage kurz nach, ob der Zugriff klappt.'
        }
      }
    ],
    videos: [
      { id: 'PLQCezYhO9M', title: 'Git Tutorial #2 - Repository einrichten und erste Schritte', channel: 'Modulo13 Engineering', lang: 'de', why: 'Zeigt Schritt für Schritt das Einrichten eines Repositorys und die ersten Commits.' },
      { id: 'oixZ1UetK_Y', title: 'Tutorial Git + TortoiseGit unter Windows verwenden | German', channel: 'Sven Eberth', lang: 'de', why: 'Deutschsprachige Einführung in TortoiseGit unter Windows – genau unser Werkzeug.' },
      { id: 'qIQUfbG_s1M', title: 'Git Crashkurs [010] - FINALE: GitHub Repo erstellen & TortoiseGit', channel: 'Brotcrunsher', lang: 'de', why: 'Remote-Repository anlegen, klonen und pushen mit TortoiseGit.' }
    ],
    readings: [
      {
        title: 'Git – Eine performante verteilte Versionsverwaltung', author: 'Ruhl, H.', institution: 'Ludwig-Maximilians-Universität München, Fakultät für Physik',
        work: 'Seminar Elektrodynamik (SoSe 2020)', year: 2020, type: 'Uni-Skript', minutes: 30,
        url: 'https://www2.physik.lmu.de/lehre/vorlesungen/sose_20/seminar_e_dynamik/vorlesung/Git.pdf',
        why: 'Hochschulfolien zu Aufbau und Benutzung von Git inklusive Remotes.',
        apa: 'Ruhl, H. (2020). *Git – Eine performante verteilte Versionsverwaltung*. Ludwig-Maximilians-Universität München. ' + ABGERUFEN + 'https://www2.physik.lmu.de/lehre/vorlesungen/sose_20/seminar_e_dynamik/vorlesung/Git.pdf'
      },
      {
        title: 'Git Grundlagen – Mit Remotes arbeiten', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 20,
        url: 'https://git-scm.com/book/de/v2/Git-Grundlagen-Mit-Remotes-arbeiten',
        why: 'Erklärt clone, remote, push und fetch im Zusammenhang.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Grundlagen-Mit-Remotes-arbeiten'
      },
      {
        title: 'TortoiseGit – Daily Use Guide: Committing', author: 'TortoiseGit Team', institution: 'tortoisegit.org',
        work: 'TortoiseGit Manual', year: 2024, type: 'Dokumentation', minutes: 15,
        url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-commit.html',
        why: 'Offizielle Beschreibung des Commit-Dialogs in TortoiseGit.',
        apa: 'TortoiseGit Team. (2024). *Committing your changes*. TortoiseGit Manual. ' + ABGERUFEN + 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-commit.html'
      }
    ],
    quiz: [
      { type: 'single', q: 'Was richtet `git clone` automatisch ein?', options: ['Einen Remote namens origin, der auf die Quell-URL zeigt', 'Eine .gitignore', 'Einen neuen Benutzer auf dem Server', 'Ein Automation-Studio-Projekt'], correct: 0, explain: 'Beim Klonen wird die Quelle als `origin` eingetragen und der Standard-Branch ausgecheckt.' },
      { type: 'single', q: 'Du hast drei Commits gemacht, aber nicht gepusht. Was sieht dein Ausbilder auf git.breitner.de?', options: ['Alle drei Commits', 'Nur den letzten', 'Keinen davon', 'Nur die Commit-Messages'], correct: 2, explain: 'Commits sind lokal, bis du sie mit `git push` überträgst.' },
      { type: 'single', q: 'In welcher Reihenfolge legst du ein neues Repository sinnvoll an?', options: ['Build → Commit → .gitignore', '.gitignore → Commit → Projektgerüst committen → Push', 'Push → Commit → .gitignore', 'Projekt zippen → hochladen'], correct: 1, explain: 'Wenn die .gitignore zuerst da ist, gelangen nie Build-Dateien ins Repository.' }
    ],
    exam: [
      { type: 'single', q: 'Welcher Befehl zeigt die konfigurierten Remotes mit URL?', options: ['git remote -v', 'git log --all', 'git config user.name', 'git status -remote'], correct: 0, explain: '`git remote -v` listet Fetch- und Push-URL je Remote.' },
      { type: 'single', q: 'Was bewirkt `-u` bei `git push -u origin main`?', options: ['Es überschreibt den Server-Stand', 'Es verknüpft den lokalen Branch mit origin/main (Upstream), sodass künftig `git push`/`git pull` ohne Argumente funktionieren', 'Es pusht alle Tags', 'Es entfernt den Branch'], correct: 1, explain: 'Der Upstream wird gespeichert; danach reichen `git push` und `git pull`.' },
      { type: 'multi', q: 'Was prüfst du vor dem Einreichen deines Repository-Links?', options: ['.gitignore vorhanden', 'Keine Temp/- und Binaries/-Dateien versioniert', 'Alle Commits gepusht', 'Die .isopen-Datei ist enthalten'], correct: [0, 1, 2], explain: '*.isopen ist benutzerspezifisch und gehört gerade nicht ins Repository.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Klonen, einrichten, committen, pushen',
        task: L(
          'Auf git.breitner.de liegt das Repository `ampel` mit einem AS6-Projektgerüst, aber ohne `.gitignore`. Git ist auf diesem Rechner noch nicht eingerichtet.',
          '',
          '1. Klone `' + SERVER + 'ampel.git` und wechsle in den Ordner `ampel`.',
          '2. Setze `user.name` und `user.email`.',
          '3. Lege eine `.gitignore` mit mindestens `Temp/` und `Binaries/` an und committe sie (`chore: …`).',
          '4. Ergänze in `Logical/Main/Main.st` am Ende die Zeile `// Rot-Gelb-Grün nach Ampelphasenplan` und committe mit einer `feat`- oder `docs`-Message.',
          '5. Pushe alles auf den Server. Lokal und Remote müssen am Ende gleich sein.'
        ),
        hints: ['Nach `git clone` liegt das Repository in einem Unterordner – `cd ampel`.', 'Zwei getrennte Commits: erst die .gitignore, dann die Programmänderung.', '`git status` sagt dir nach dem Push „up to date with origin/main“.'],
        setup: {
          cloned: false,
          remote: SERVER + 'ampel.git',
          files: asProject('Ampel', L('PROGRAM _INIT', 'END_PROGRAM', '', 'PROGRAM _CYCLIC', '\tdoRed := TRUE;', 'END_PROGRAM')),
          commits: [],
          user: false
        },
        checks: [
          { type: 'userConfigured' },
          { type: 'fileContains', path: '.gitignore', text: 'Temp/', branch: 'main', msg: 'Die .gitignore mit Temp/ ist nicht committet.' },
          { type: 'fileContains', path: 'Logical/Main/Main.st', text: 'Ampelphasenplan', branch: 'main', msg: 'Die Programmänderung fehlt im Commit.' },
          { type: 'commitCountMin', branch: 'main', n: 3, msg: 'Es sollen zwei neue Commits sein (.gitignore und Programm).' },
          { type: 'lastCommitMsgMatches', branch: 'main', pattern: '^(feat|docs)(\\([^)]+\\))?: .+', msg: 'Der letzte Commit soll eine feat- oder docs-Message haben.' },
          { type: 'remoteInSync', branch: 'main', msg: 'Lokaler und entfernter main sind nicht gleich – push vergessen?' },
          { type: 'clean' }
        ],
        solution: [
          'git clone ' + SERVER + 'ampel.git',
          'cd ampel',
          'git config --global user.name "Max Muster"',
          'git config --global user.email "max.muster@breitner.de"',
          'echo "Temp/" > .gitignore',
          'echo "Binaries/" >> .gitignore',
          'echo "Diagnosis/" >> .gitignore',
          'echo "*.isopen" >> .gitignore',
          'git add .gitignore',
          'git commit -m "chore: .gitignore für Automation Studio"',
          'echo "// Rot-Gelb-Grün nach Ampelphasenplan" >> Logical/Main/Main.st',
          'git add Logical/Main/Main.st',
          'git commit -m "docs(ampel): Ampelphasen im Programm dokumentiert"',
          'git push',
          'git status'
        ]
      }
    ],
    proof: true,
    badge: 'Versionierte Projektbasis'
  }
];
