'use strict';
const { L, ABGERUFEN, SERVER, asProject, GITIGNORE_AS } = require('./common');

const BLINK_MAIN = L('PROGRAM _INIT', 'END_PROGRAM', '', 'PROGRAM _CYCLIC', '\tfbBlink(IN := NOT fbBlink.Q, PT := T#500ms);', '\tdoLamp := fbBlink.Q;', 'END_PROGRAM');

module.exports = [
  // ───────────────────────────────────────────── Level 2 · Modul 1
  {
    id: 'git-2-branches',
    level: 2,
    kind: 'lektion',
    title: 'Branches: parallel entwickeln, sauber zusammenführen',
    summary: 'Du entwickelst Funktionen in Feature-Branches, wechselst mit git switch und führst Branches per Merge zusammen.',
    minutes: 120,
    req: ['git-1-projekt'],
    briefing: 'Ein Branch ist in Git nur ein beweglicher Zeiger auf einen Commit – billig anzulegen und schnell zu wechseln. Damit entwickelst du eine neue Funktion (z. B. Tippbetrieb) isoliert, während auf `main` immer ein lauffähiger Stand bleibt. Ist die Funktion fertig und getestet, führst du sie mit `git merge` zurück. Du lernst den Unterschied zwischen Fast-Forward-Merge und echtem Merge-Commit (`--no-ff`) und liest die Verzweigungen mit `git log --graph`.',
    practice: 'Während du an der neuen Rezepturverwaltung arbeitest, meldet die Inbetriebnahme einen Fehler im Handbetrieb. Mit Branches kannst du den Fix auf einem eigenen Branch erstellen und ausliefern, ohne deine halbfertige Arbeit mitzuschicken.',
    transfer: {
      tia: 'TIA Portal kennt kein Branch-Konzept; Varianten werden dort oft über Projektkopien gepflegt. Mit Git und exportierten Quellen (z. B. SIMATIC AX oder VCI-Export) ersetzt ein Branch diese Kopien.',
      codesys: 'In TwinCAT 3 nutzt du Branches direkt über Visual Studio (Team Explorer bzw. Git-Fenster). CODESYS Git bietet ebenfalls Branches im Projekt-Kontextmenü.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lege einen Feature-Branch an und wechsle dorthin',
        guide: {
          intro: 'Arbeite nie direkt auf main. Jede Änderung beginnt mit einem Branch, dessen Name sagt, worum es geht.',
          steps: [
            'Prüfe mit `git status`, dass du auf `main` bist und der Working Tree sauber ist.',
            'Lege den Branch an und wechsle hinein: `git switch -c feature/tippbetrieb` (ältere Schreibweise: `git checkout -b feature/tippbetrieb`).',
            'Namenskonvention bei BREITNER: `feature/<thema>`, `fix/<thema>`, `release/<version>`, `hotfix/<thema>` – Kleinbuchstaben, Bindestriche, keine Umlaute.',
            '`git branch` listet alle lokalen Branches, der aktuelle ist mit `*` markiert.',
            'TortoiseGit: Rechtsklick › **TortoiseGit › Create Branch…**, Name eingeben, Haken bei **Switch to new branch** setzen.'
          ],
          code: { lang: 'bash', text: 'git switch -c feature/tippbetrieb\ngit branch' },
          done: 'Erledigt, wenn `git branch` den neuen Branch mit `*` markiert anzeigt.',
          tip: 'Automation Studio merkt einen Branch-Wechsel nicht automatisch. Schließe das Projekt vor `git switch` oder lade es danach neu, sonst arbeitest du mit veralteten Dateien im Editor.',
          link: { label: 'Pro Git: Branches auf einen Blick', url: 'https://git-scm.com/book/de/v2/Git-Branching-Branches-auf-einen-Blick' }
        }
      },
      {
        id: 'o2',
        title: 'Verstehe Fast-Forward und Merge-Commit',
        guide: {
          intro: 'Wie ein Merge aussieht, hängt davon ab, ob sich main seit dem Abzweigen verändert hat.',
          steps: [
            '**Fast-Forward**: main hat keine neuen Commits. Git schiebt den main-Zeiger einfach nach vorne – es entsteht kein Merge-Commit.',
            '**Drei-Wege-Merge**: Beide Branches haben neue Commits. Git erzeugt einen Merge-Commit mit zwei Eltern.',
            'Mit `git merge --no-ff feature/x` erzwingst du immer einen Merge-Commit. Dann bleibt in der Historie sichtbar, welche Commits zu einem Feature gehörten.',
            'Sieh dir das Ergebnis mit `git log --oneline --graph --all` an.'
          ],
          code: { lang: 'bash', text: 'git switch main\ngit merge --no-ff feature/tippbetrieb\ngit log --oneline --graph --all' },
          done: 'Erledigt, wenn du in einem `--graph`-Log zeigen kannst, wo ein Branch abzweigt und wo er zurückgeführt wurde.',
          tip: 'Viele Teams stellen im Web-Interface ein, dass Merge Requests immer mit Merge-Commit zusammengeführt werden – das entspricht `--no-ff`.'
        }
      },
      {
        id: 'o3',
        title: 'Führe einen Feature-Branch in main zusammen',
        guide: {
          intro: 'Gemergt wird immer in den Branch, auf dem du stehst.',
          steps: [
            'Committe alle Änderungen auf dem Feature-Branch.',
            'Wechsle zum Ziel: `git switch main`.',
            'Führe zusammen: `git merge --no-ff feature/tippbetrieb`. Git öffnet ggf. einen Editor für die Merge-Message, im Simulator wird sie automatisch erzeugt.',
            'TortoiseGit: Rechtsklick › **TortoiseGit › Switch/Checkout…** auf main, danach **TortoiseGit › Merge…**, Branch auswählen, ggf. **No Fast Forward** anhaken.',
            'Baue das Projekt in Automation Studio (F7) und teste, bevor du pushst.'
          ],
          done: 'Erledigt, wenn die Commits des Feature-Branches in `git log main` erscheinen und das Projekt fehlerfrei baut.',
          tip: 'Nach dem Merge kannst du den Branch mit `git branch -d feature/tippbetrieb` löschen. `-d` verweigert das Löschen nicht gemergter Branches – eine eingebaute Sicherung.',
          link: { label: 'TortoiseGit: Merging', url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-merge.html' }
        }
      }
    ],
    videos: [
      { id: 'PNdGJizTawY', title: 'Git Tutorial  #4 - Branching und Merging', channel: 'Modulo13 Engineering', lang: 'de', why: 'Deutschsprachige Demonstration von Branch anlegen, wechseln und mergen.' },
      { id: 'tHtiehTr59I', title: 'Git Crashkurs [006] - checkout und branches', channel: 'Brotcrunsher', lang: 'de', why: 'Kurze Erklärung, was beim Wechseln eines Branches im Working Tree passiert.' },
      { id: '6_KqHPG2uaI', title: 'GIT Branch & Merge kurz erklärt - Die Git Grundlagen', channel: 'Webdesign mit Eric Maechler', lang: 'de', why: 'Knappe Zusammenfassung von Branch und Merge.' }
    ],
    readings: [
      {
        title: 'Versionsverwaltung mit git (Übungsfolien)', author: 'Schmaus, F. & Schuster, S.', institution: 'Friedrich-Alexander-Universität Erlangen-Nürnberg, Lehrstuhl Informatik 4',
        work: 'Übungen zur Vorlesung Verlässliche Echtzeitsysteme', year: 2018, type: 'Uni-Skript', minutes: 40,
        url: 'https://rdsp.cs.fau.de/Lehre/SS18/V_VEZS/Uebung/Folien/02_Git.pdf',
        why: 'Hochschulfolien mit anschaulichen Grafiken zu Branches und Merges.',
        apa: 'Schmaus, F., & Schuster, S. (2018). *Git – Übungen zur Vorlesung Verlässliche Echtzeitsysteme*. Friedrich-Alexander-Universität Erlangen-Nürnberg. ' + ABGERUFEN + 'https://rdsp.cs.fau.de/Lehre/SS18/V_VEZS/Uebung/Folien/02_Git.pdf'
      },
      {
        title: 'Git Branching – Einfaches Branching und Merging', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 30,
        url: 'https://git-scm.com/book/de/v2/Git-Branching-Einfaches-Branching-und-Merging',
        why: 'Das Standardkapitel zu Fast-Forward und Drei-Wege-Merge.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Branching-Einfaches-Branching-und-Merging'
      },
      {
        title: 'git-switch Documentation', author: 'Git Project', institution: 'git-scm.com',
        work: 'Git Reference Manual', year: 2024, type: 'Dokumentation', minutes: 10,
        url: 'https://git-scm.com/docs/git-switch',
        why: 'Referenz zu `git switch` und dem Unterschied zu `git checkout`.',
        apa: 'Git Project. (2024). *git-switch*. Git Reference Manual. ' + ABGERUFEN + 'https://git-scm.com/docs/git-switch'
      }
    ],
    quiz: [
      { type: 'single', q: 'Was ist ein Branch in Git technisch?', options: ['Eine Kopie aller Dateien', 'Ein beweglicher Zeiger auf einen Commit', 'Ein eigener Ordner auf dem Server', 'Eine ZIP-Datei im .git-Ordner'], correct: 1, explain: 'Ein Branch ist eine kleine Datei mit dem Hash des Commits, auf den er zeigt. Darum ist das Anlegen praktisch kostenlos.' },
      { type: 'single', q: 'main hat seit dem Abzweigen von feature/x keine neuen Commits. Was passiert bei `git merge feature/x` auf main?', options: ['Ein Konflikt', 'Ein Fast-Forward: main wird auf den letzten Commit von feature/x vorgeschoben', 'Ein Merge-Commit mit zwei Eltern', 'Git verweigert den Merge'], correct: 1, explain: 'Ohne divergierende Historie genügt ein Fast-Forward. Mit `--no-ff` würde trotzdem ein Merge-Commit entstehen.' },
      { type: 'single', q: 'Welcher Befehl legt den Branch `fix/handbetrieb` an und wechselt hinein?', options: ['git branch fix/handbetrieb', 'git switch -c fix/handbetrieb', 'git merge fix/handbetrieb', 'git checkout fix/handbetrieb'], correct: 1, explain: '`git branch name` legt nur an; `switch -c` (bzw. `checkout -b`) legt an und wechselt.' }
    ],
    exam: [
      { type: 'single', q: 'Warum solltest du Automation Studio vor einem Branch-Wechsel schließen oder das Projekt danach neu laden?', options: ['Git kann sonst keine Branches wechseln', 'Der Editor zeigt sonst noch den alten Dateistand und speichert ihn ggf. über den neuen', 'Automation Studio löscht sonst die .git-Ordner', 'Wegen der Lizenz'], correct: 1, explain: 'Git tauscht die Dateien auf der Platte aus. Ein offener Editor mit altem Stand kann diese Änderungen beim Speichern überschreiben.' },
      { type: 'single', q: 'Was bewirkt `git branch -d feature/x`, wenn feature/x noch nicht gemergt ist?', options: ['Der Branch wird gelöscht', 'Git verweigert das Löschen und verweist auf `-D`', 'Die Commits werden in main übernommen', 'Der Branch wird auf dem Server gelöscht'], correct: 1, explain: '`-d` schützt vor Datenverlust; `-D` erzwingt das Löschen.' },
      { type: 'multi', q: 'Welche Branch-Namen entsprechen der Konvention?', options: ['feature/rezeptverwaltung', 'fix/notaus-quittierung', 'Max_Test_Neu', 'release/2.1.0'], correct: [0, 1, 3], explain: 'Präfix + kurzer Themenname in Kleinbuchstaben mit Bindestrichen.' },
      { type: 'single', q: 'Wozu dient `git log --oneline --graph --all`?', options: ['Es löscht alte Commits', 'Es zeigt alle Branches mit ihren Verzweigungen als Graph', 'Es pusht alle Branches', 'Es zeigt nur Tags'], correct: 1, explain: '`--graph` zeichnet die Verzweigungen, `--all` nimmt alle Referenzen auf.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Feature-Branch für den Tippbetrieb',
        task: L(
          'Im Repository `foerderband` soll ein Tippbetrieb ergänzt werden. Arbeite dafür nicht auf `main`.',
          '',
          '1. Lege den Branch `feature/tippbetrieb` an und wechsle hinein.',
          '2. Commit 1: Ergänze in `Logical/Main/Main.var` die Zeile `// diJog : BOOL; Tipptaster S3`.',
          '3. Commit 2: Ergänze in `Logical/Main/Main.st` die Zeile `// Tippbetrieb: doMotor solange diJog`.',
          '4. Wechsle zurück auf `main` und führe den Branch **mit Merge-Commit** (`--no-ff`) zusammen.',
          '5. Am Ende stehst du auf `main`, der Working Tree ist sauber.'
        ),
        hints: ['`git switch -c feature/tippbetrieb`', 'Jede Datei einzeln adden und committen – zwei Commits.', '`git merge --no-ff feature/tippbetrieb` auf main ausführen.'],
        setup: {
          cloned: true,
          remote: SERVER + 'foerderband.git',
          files: Object.assign(asProject('Foerderband'), { '.gitignore': GITIGNORE_AS }),
          commits: [{ msg: 'feat(foerderband): Grundfunktion Start/Stopp', files: { 'README.md': L('# Förderband', 'Übungsprojekt Förderband mit Start/Stopp.') } }],
          user: true
        },
        checks: [
          { type: 'commandUsed', pattern: '^git (switch -c|checkout -b) feature/tippbetrieb', msg: 'Lege den Branch mit `git switch -c` an.' },
          { type: 'commitCountMin', branch: 'feature/tippbetrieb', n: 2, msg: 'Auf dem Feature-Branch fehlen Commits (zwei neue erwartet).' },
          { type: 'merged', from: 'feature/tippbetrieb', into: 'main', msg: 'feature/tippbetrieb ist noch nicht in main gemergt.' },
          { type: 'commandUsed', pattern: '^git merge .*--no-ff', msg: 'Merge mit `--no-ff`, damit ein Merge-Commit entsteht.' },
          { type: 'fileContains', path: 'Logical/Main/Main.st', text: 'Tippbetrieb', branch: 'main' },
          { type: 'currentBranch', name: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'git switch -c feature/tippbetrieb',
          'echo "// diJog : BOOL; Tipptaster S3" >> Logical/Main/Main.var',
          'git add Logical/Main/Main.var',
          'git commit -m "feat(foerderband): Variable für Tipptaster angelegt"',
          'echo "// Tippbetrieb: doMotor solange diJog" >> Logical/Main/Main.st',
          'git add Logical/Main/Main.st',
          'git commit -m "feat(foerderband): Tippbetrieb in Bandlogik beschrieben"',
          'git switch main',
          'git merge --no-ff feature/tippbetrieb',
          'git log --oneline --graph --all'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Zwei Features parallel entwickeln',
        task: L(
          'Zwei kleine Funktionen sollen unabhängig voneinander entstehen und danach beide in `main` landen.',
          '',
          '1. Lege von `main` aus `feature/zaehler` an und committe dort eine neue Datei `Logical/Counter/Counter.st` mit dem Inhalt `// Teilezähler mit CTU`.',
          '2. Wechsle zurück auf `main` und lege `feature/meldeleuchte` an. Committe dort `Logical/Lamp/Lamp.st` mit dem Inhalt `// Meldeleuchte H1 blinkt bei Störung`.',
          '3. Führe beide Branches in `main` zusammen.',
          '4. Sieh dir das Ergebnis mit `git log --oneline --graph --all` an.'
        ),
        hints: ['Vor dem zweiten Branch erst zurück auf main, sonst zweigt er von feature/zaehler ab.', 'Neue Ordner mit `mkdir Logical/Counter` anlegen.', 'Beide Merges nacheinander auf main ausführen.'],
        setup: {
          cloned: true,
          remote: SERVER + 'foerderband.git',
          files: Object.assign(asProject('Foerderband'), { '.gitignore': GITIGNORE_AS }),
          commits: [],
          user: true
        },
        checks: [
          { type: 'branchExists', name: 'feature/zaehler' },
          { type: 'branchExists', name: 'feature/meldeleuchte' },
          { type: 'merged', from: 'feature/zaehler', into: 'main' },
          { type: 'merged', from: 'feature/meldeleuchte', into: 'main' },
          { type: 'fileContains', path: 'Logical/Counter/Counter.st', text: 'CTU', branch: 'main' },
          { type: 'fileContains', path: 'Logical/Lamp/Lamp.st', text: 'Meldeleuchte', branch: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'git switch -c feature/zaehler',
          'mkdir Logical/Counter',
          'echo "// Teilezähler mit CTU" > Logical/Counter/Counter.st',
          'git add .',
          'git commit -m "feat(zaehler): Programm für Teilezähler angelegt"',
          'git switch main',
          'git switch -c feature/meldeleuchte',
          'mkdir Logical/Lamp',
          'echo "// Meldeleuchte H1 blinkt bei Störung" > Logical/Lamp/Lamp.st',
          'git add .',
          'git commit -m "feat(meldeleuchte): Programm für Störmeldeleuchte angelegt"',
          'git switch main',
          'git merge feature/zaehler',
          'git merge feature/meldeleuchte',
          'git log --oneline --graph --all'
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────────────────────── Level 2 · Modul 2
  {
    id: 'git-2-konflikte',
    level: 2,
    kind: 'lektion',
    title: 'Merge-Konflikte verstehen und lösen',
    summary: 'Du erkennst Konfliktmarker, löst Konflikte in .st- und .var-Dateien fachlich korrekt und schließt den Merge ab.',
    minutes: 120,
    req: ['git-2-branches'],
    briefing: 'Ein Konflikt entsteht, wenn zwei Branches dieselbe Stelle einer Datei unterschiedlich geändert haben. Git kann dann nicht entscheiden, welche Version richtig ist, und markiert die Stelle mit `<<<<<<<`, `=======` und `>>>>>>>`. Konflikte sind kein Fehler, sondern eine Frage an dich: Welche Logik soll künftig gelten? Gerade in Steuerungscode reicht es selten, eine Seite blind zu übernehmen – oft muss man beide Änderungen fachlich kombinieren und danach bauen und testen.',
    practice: 'Du hast die Freigabebedingung eines Blinkers erweitert, ein Kollege hat gleichzeitig die Blinkfrequenz geändert – beides in derselben Zeile. Beim Merge musst du beide Absichten zusammenführen, sonst ist eine der Änderungen still verloren.',
    transfer: {
      tia: 'Ohne textbasierte Quellen gibt es in TIA keine zeilengenauen Konflikte; der Projektvergleich (Compare) zeigt Unterschiede auf Bausteinebene und man übernimmt manuell.',
      codesys: 'In TwinCAT erscheinen Konflikte in .TcPOU-Dateien als XML mit eingebettetem ST-Code; aufgelöst wird im Visual-Studio-Merge-Editor. In AS6 sind .st-Dateien reiner Text und dadurch leichter zu mergen.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Lies Konfliktmarker richtig',
        guide: {
          intro: 'Git schreibt beide Versionen in die Datei und markiert sie.',
          steps: [
            '`<<<<<<< HEAD` leitet deine Seite ein (der Branch, auf dem du stehst und in den du mergst).',
            '`=======` trennt die beiden Seiten.',
            '`>>>>>>> feature/x` beendet die Seite des Branches, den du hineinmergst.',
            '`git status` listet betroffene Dateien unter „Unmerged paths“ bzw. „both modified“.',
            'Alles außerhalb der Marker hat Git bereits automatisch zusammengeführt.'
          ],
          code: { lang: 'st', text: '<<<<<<< HEAD\n\tfbBlink(IN := NOT fbBlink.Q, PT := T#1s);\n=======\n\tfbBlink(IN := bEnable AND NOT fbBlink.Q, PT := T#500ms);\n>>>>>>> feature/freigabe' },
          done: 'Erledigt, wenn du für einen Konflikt sagen kannst, welche Zeile von welchem Branch stammt.',
          tip: 'Ein Projekt mit Konfliktmarkern baut in Automation Studio nicht – der Compiler meldet Syntaxfehler. Das ist ein gutes Sicherheitsnetz, aber kein Ersatz für sorgfältiges Lösen.',
          link: { label: 'Atlassian: Merge-Konflikte in Git', url: 'https://www.atlassian.com/de/git/tutorials/using-branches/merge-conflicts' }
        }
      },
      {
        id: 'o2',
        title: 'Löse einen Konflikt fachlich korrekt',
        guide: {
          intro: 'Konflikt lösen heißt: Die Datei in den gewünschten Endzustand bringen, die Marker entfernen und das Ergebnis vormerken.',
          steps: [
            'Öffne die Datei im Editor (Automation Studio, Notepad++, VS Code) oder in TortoiseMerge.',
            'Entscheide fachlich: Wer wollte was? Häufig sind beide Änderungen nötig, z. B. neue Freigabe UND neue Zeit.',
            'Schreibe die kombinierte Zeile und entferne alle Marker-Zeilen.',
            'Baue das Projekt (F7) und teste im Simulator oder an der Anlage.',
            'Merke die Datei vor: `git add Logical/Main/Main.st` und schließe den Merge ab: `git commit -m "merge: …"`.'
          ],
          code: { lang: 'st', text: '\tfbBlink(IN := bEnable AND NOT fbBlink.Q, PT := T#1s);' },
          done: 'Erledigt, wenn `git status` keine „Unmerged paths“ mehr zeigt und das Projekt fehlerfrei baut.',
          tip: 'Sprich bei Unklarheit mit der Person, die die andere Seite geschrieben hat. Fünf Minuten Rückfrage sind billiger als ein Fehler bei der Inbetriebnahme.'
        }
      },
      {
        id: 'o3',
        title: 'Nutze TortoiseGit zum Lösen und brich bei Bedarf ab',
        guide: {
          intro: 'TortoiseGit bringt mit TortoiseGitMerge ein Drei-Wege-Werkzeug mit.',
          steps: [
            'Konfliktdateien erscheinen im Explorer mit einem roten Warnsymbol.',
            'Rechtsklick auf die Datei › **TortoiseGit › Edit conflicts**: links „Theirs“, rechts „Mine“, unten das Ergebnis. Per Rechtsklick auf Blöcke wählst du „Use this text block“ oder bearbeitest das Ergebnis direkt.',
            'Speichern, dann Rechtsklick › **TortoiseGit › Resolve…** – das entspricht `git add` für die Datei.',
            'Abschließend **Git Commit -> "main"…** ausführen, die Merge-Message ist vorausgefüllt.',
            'Willst du neu anfangen: `git merge --abort` (TortoiseGit: **Abort Merge**) stellt den Zustand vor dem Merge wieder her.'
          ],
          done: 'Erledigt, wenn du einen Konflikt einmal mit git bash und einmal mit TortoiseGit gelöst hast.',
          tip: 'Ein Merge lässt sich nur sauber abbrechen, wenn du vorher keine uncommitteten Änderungen hattest. Starte Merges daher immer mit sauberem Working Tree.',
          link: { label: 'TortoiseGit: Resolving Conflicts', url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-conflicts.html' }
        }
      },
      {
        id: 'o4',
        title: 'Vermeide unnötige Konflikte',
        guide: {
          intro: 'Die meisten Konflikte lassen sich durch Arbeitsweise vermeiden.',
          steps: [
            'Kurzlebige Branches: lieber täglich kleine Merges als einmal im Monat einen großen.',
            'Regelmäßig den aktuellen main in deinen Branch holen (`git merge main` auf dem Feature-Branch).',
            'Keine reinen Formatierungsänderungen (Einrückung, Tabs/Leerzeichen) zusammen mit fachlichen Änderungen committen.',
            'Absprechen, wer an gemeinsamen Dateien wie `Cpu.sw`, `Hardware.hw` oder `Package.pkg` arbeitet (siehe Level 3).'
          ],
          done: 'Erledigt, wenn du drei Maßnahmen gegen Konflikte nennen und begründen kannst.',
          tip: 'Trenne Funktionen in eigene Programme bzw. Packages. Zwei Personen in zwei Dateien erzeugen keinen Konflikt.'
        }
      }
    ],
    videos: [
      { id: '9j4_vC-wjWw', title: 'Git Tutorial  #5 - Merge-Konflikte lösen', channel: 'Modulo13 Engineering', lang: 'de', why: 'Zeigt einen Merge-Konflikt von der Entstehung bis zur Lösung auf Deutsch.' },
      { id: '6tTxhK2dYLQ', title: 'Git merge conflict: what are those arrows?', channel: 'PythonVideos', lang: 'en', why: 'Erklärt kurz und präzise die Bedeutung der Konfliktmarker.' }
    ],
    readings: [
      {
        title: 'Git – Vortrag (Branches, Merges, Konflikte)', author: 'Tom, Hinrik, Aytac & Julian', institution: 'Hochschule Mannheim, Fakultät für Informatik',
        work: 'Vorlesung Programmieren 1 (WS 2022)', year: 2022, type: 'Uni-Skript', minutes: 25,
        url: 'https://services.informatik.hs-mannheim.de/~fischer/lectures/PR1_Files/Git_Vortrag_WS22.pdf',
        why: 'Studentischer Vortrag aus einer Hochschulvorlesung mit Beispielen zu Merge-Konflikten.',
        apa: 'Tom, Hinrik, Aytac, & Julian. (2022). *Was ist Git?* [Vortragsfolien, Programmieren 1]. Hochschule Mannheim. ' + ABGERUFEN + 'https://services.informatik.hs-mannheim.de/~fischer/lectures/PR1_Files/Git_Vortrag_WS22.pdf'
      },
      {
        title: 'Merge-Konflikte in Git', author: 'Atlassian', institution: 'Atlassian',
        work: 'Git-Tutorials', year: 2024, type: 'Artikel', minutes: 15,
        url: 'https://www.atlassian.com/de/git/tutorials/using-branches/merge-conflicts',
        why: 'Gut strukturierte deutsche Anleitung zu Entstehung und Lösung von Konflikten.',
        apa: 'Atlassian. (2024). *Merge-Konflikte in Git*. ' + ABGERUFEN + 'https://www.atlassian.com/de/git/tutorials/using-branches/merge-conflicts'
      },
      {
        title: 'Resolving Conflicts', author: 'TortoiseGit Team', institution: 'tortoisegit.org',
        work: 'TortoiseGit Manual', year: 2024, type: 'Dokumentation', minutes: 10,
        url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-conflicts.html',
        why: 'Beschreibt Edit conflicts und Resolve in TortoiseGit.',
        apa: 'TortoiseGit Team. (2024). *Resolving conflicts*. TortoiseGit Manual. ' + ABGERUFEN + 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-conflicts.html'
      }
    ],
    quiz: [
      { type: 'single', q: 'Du stehst auf main und führst `git merge feature/zeit` aus. Was steht zwischen `<<<<<<< HEAD` und `=======`?', options: ['Die Version von feature/zeit', 'Die Version von main', 'Die gemeinsame Basisversion', 'Die Lösung von Git'], correct: 1, explain: 'HEAD ist der aktuelle Branch, hier main. Die Seite des hineingemergten Branches steht nach `=======`.' },
      { type: 'single', q: 'Wie schließt du einen Merge nach dem Lösen der Konflikte in git bash ab?', options: ['git merge --continue-all', 'Dateien mit `git add` vormerken und `git commit` ausführen', 'git push --force', 'git reset --hard'], correct: 1, explain: '`git add` markiert die Datei als gelöst, `git commit` erzeugt den Merge-Commit.' },
      { type: 'multi', q: 'Welche Maßnahmen reduzieren Konflikte?', options: ['Kurzlebige Branches', 'Regelmäßig main in den Feature-Branch holen', 'Alle Dateien vor jedem Commit neu formatieren', 'Funktionen in getrennte Programme aufteilen'], correct: [0, 1, 3], explain: 'Massenhafte Formatierungsänderungen erzeugen dagegen viele unnötige Konflikte.' }
    ],
    exam: [
      { type: 'single', q: 'Was bewirkt `git merge --abort`?', options: ['Es löscht den anderen Branch', 'Es stellt den Zustand vor Beginn des Merges wieder her', 'Es übernimmt automatisch die eigene Seite', 'Es pusht den Merge'], correct: 1, explain: 'Der Merge wird verworfen; Working Tree und Index sind wie vorher.' },
      { type: 'single', q: 'Main setzt `PT := T#1s`, der Feature-Branch ergänzt in derselben Zeile `bEnable AND`. Was ist die fachlich sinnvolle Lösung?', code: { lang: 'st', text: '<<<<<<< HEAD\nfbBlink(IN := NOT fbBlink.Q, PT := T#1s);\n=======\nfbBlink(IN := bEnable AND NOT fbBlink.Q, PT := T#500ms);\n>>>>>>> feature/freigabe' }, options: ['Nur die HEAD-Zeile übernehmen', 'Nur die Feature-Zeile übernehmen', '`fbBlink(IN := bEnable AND NOT fbBlink.Q, PT := T#1s);`', 'Beide Zeilen untereinander stehen lassen'], correct: 2, explain: 'Beide Änderungen hatten eine Absicht. Zwei Aufrufe derselben Instanz pro Zyklus wären falsch.' },
      { type: 'single', q: 'Welcher TortoiseGit-Befehl entspricht `git add` für eine gelöste Konfliktdatei?', options: ['Show log', 'Resolve…', 'Revert…', 'Clean up…'], correct: 1, explain: '**Resolve…** markiert die Datei als gelöst.' },
      { type: 'single', q: 'Warum solltest du nach dem Lösen eines Konflikts in .st-Dateien das Projekt bauen und testen?', options: ['Weil Git es verlangt', 'Weil ein syntaktisch korrekter Merge trotzdem fachlich falsch sein kann', 'Damit Temp/ aktualisiert wird', 'Damit der Merge-Commit signiert wird'], correct: 1, explain: 'Git prüft nur Text. Ob die kombinierte Logik stimmt, zeigt erst Build und Test.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Konflikt im Blinker lösen',
        task: L(
          'Ein Kollege hat auf `main` (auf dem Server) die Blinkzeit auf `T#1s` geändert. Auf `feature/freigabe` wurde der Blinker um die Freigabe `bEnable` erweitert – in derselben Zeile.',
          '',
          '1. Hole zuerst mit `git pull` den neuen Stand von `main` (ein Kollege hat die Blinkzeit geändert). Der Branch `feature/freigabe` liegt bisher nur auf dem Server (`origin/feature/freigabe`). Hole ihn mit `git switch feature/freigabe` als lokalen Tracking-Branch, wechsle zurück auf `main` und führe ihn dort zusammen.',
          '2. Löse den Konflikt so, dass **beide** Änderungen erhalten bleiben: Die Zeile muss `fbBlink(IN := bEnable AND NOT fbBlink.Q, PT := T#1s);` lauten.',
          '3. Die Datei `Logical/Main/Main.st` soll danach diesen Inhalt haben:',
          '',
          '```',
          'PROGRAM _INIT',
          'END_PROGRAM',
          'PROGRAM _CYCLIC',
          '    fbBlink(IN := bEnable AND NOT fbBlink.Q, PT := T#1s);',
          '    doLamp := fbBlink.Q;',
          'END_PROGRAM',
          '```',
          '',
          '4. Schließe den Merge mit einem Commit ab. Es dürfen keine Konfliktmarker übrig bleiben.'
        ),
        hints: ['`cat Logical/Main/Main.st` zeigt dir die Konfliktmarker.', 'Datei neu schreiben: erste Zeile mit `echo "…" > Datei`, weitere mit `echo "…" >> Datei` – oder `edit Logical/Main/Main.st`.', 'Danach `git add` und `git commit -m "…"`.'],
        setup: {
          cloned: true,
          remote: SERVER + 'meldeleuchte.git',
          files: Object.assign(asProject('Meldeleuchte', BLINK_MAIN), { '.gitignore': GITIGNORE_AS }),
          commits: [],
          remoteCommits: [{ branch: 'main', author: 'Kollege', msg: 'fix(blink): Blinkfrequenz auf 0,5 Hz gesenkt', files: { 'Logical/Main/Main.st': L('PROGRAM _INIT', 'END_PROGRAM', '', 'PROGRAM _CYCLIC', '\tfbBlink(IN := NOT fbBlink.Q, PT := T#1s);', '\tdoLamp := fbBlink.Q;', 'END_PROGRAM') } }],
          branches: {
            'feature/freigabe': [{ msg: 'feat(blink): Blinker nur mit Freigabe', files: { 'Logical/Main/Main.st': L('PROGRAM _INIT', 'END_PROGRAM', '', 'PROGRAM _CYCLIC', '\tfbBlink(IN := bEnable AND NOT fbBlink.Q, PT := T#500ms);', '\tdoLamp := fbBlink.Q;', 'END_PROGRAM') } }]
          },
          user: true
        },
        checks: [
          { type: 'merged', from: 'feature/freigabe', into: 'main', msg: 'feature/freigabe ist noch nicht in main gemergt.' },
          { type: 'noConflictMarkers', msg: 'Es stehen noch Konfliktmarker in einer Datei.' },
          { type: 'headCommitIsMerge', msg: 'Der letzte Commit muss der Merge-Commit sein.' },
          { type: 'fileContains', path: 'Logical/Main/Main.st', text: 'bEnable AND NOT fbBlink.Q, PT := T#1s', branch: 'main', msg: 'Die kombinierte Zeile (Freigabe UND T#1s) fehlt.' },
          { type: 'fileContains', path: 'Logical/Main/Main.st', text: 'doLamp := fbBlink.Q', branch: 'main', msg: 'Die Zuweisung an doLamp ist verloren gegangen.' },
          { type: 'clean' }
        ],
        solution: [
          'git pull',
          'git switch feature/freigabe',
          'git switch main',
          'git merge feature/freigabe',
          'git status',
          'cat Logical/Main/Main.st',
          'echo "PROGRAM _INIT" > Logical/Main/Main.st',
          'echo "END_PROGRAM" >> Logical/Main/Main.st',
          'echo "PROGRAM _CYCLIC" >> Logical/Main/Main.st',
          'echo "    fbBlink(IN := bEnable AND NOT fbBlink.Q, PT := T#1s);" >> Logical/Main/Main.st',
          'echo "    doLamp := fbBlink.Q;" >> Logical/Main/Main.st',
          'echo "END_PROGRAM" >> Logical/Main/Main.st',
          'git add Logical/Main/Main.st',
          'git commit -m "merge: Freigabe und neue Blinkzeit zusammengeführt"'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Merge abbrechen, neu ansetzen und beide Variablen behalten',
        task: L(
          'In `Logical/Main/Main.var` wurde an derselben Stelle je eine neue Variable ergänzt: auf `main` (Server, von einer Kollegin) `nPartCount : UDINT;`, auf `feature/stoerung` `bFault : BOOL;`.',
          '',
          '1. Hole mit `git pull` den aktuellen `main`. Hole dann den Server-Branch lokal (`git switch feature/stoerung`, dann zurück auf `main`), starte den Merge von `feature/stoerung` in `main` und sieh dir den Konflikt an.',
          '2. Brich den Merge mit `git merge --abort` ab (z. B. weil du erst Rücksprache halten willst) und prüfe mit `git status`, dass alles wieder sauber ist.',
          '3. Führe den Merge erneut aus und löse ihn so, dass **beide** Variablen deklariert sind:',
          '',
          '```',
          'VAR',
          '    bStop : BOOL;',
          '    nPartCount : UDINT;',
          '    bFault : BOOL;',
          'END_VAR',
          '```',
          '',
          '4. Schließe den Merge mit einem Commit ab.'
        ),
        hints: ['Nach `--abort` muss `git status` „working tree clean“ zeigen.', 'In .var-Dateien sind Konflikte meist leicht: Beide Deklarationen werden gebraucht.'],
        setup: {
          cloned: true,
          remote: SERVER + 'foerderband.git',
          files: Object.assign(asProject('Foerderband'), { '.gitignore': GITIGNORE_AS }),
          commits: [],
          remoteCommits: [{ branch: 'main', author: 'Kollegin', msg: 'feat(zaehler): Teilezähler-Variable', files: { 'Logical/Main/Main.var': L('VAR', '\tbStop : BOOL;', '\tnPartCount : UDINT;', 'END_VAR') } }],
          branches: {
            'feature/stoerung': [{ msg: 'feat(stoerung): Störungsmerker', files: { 'Logical/Main/Main.var': L('VAR', '\tbStop : BOOL;', '\tbFault : BOOL;', 'END_VAR') } }]
          },
          user: true
        },
        checks: [
          { type: 'commandUsed', pattern: '^git merge --abort', msg: 'Brich den ersten Merge-Versuch mit `git merge --abort` ab.' },
          { type: 'merged', from: 'feature/stoerung', into: 'main' },
          { type: 'noConflictMarkers' },
          { type: 'headCommitIsMerge', msg: 'Der Merge wurde nicht als Merge-Commit abgeschlossen.' },
          { type: 'fileContains', path: 'Logical/Main/Main.var', text: 'nPartCount : UDINT;', branch: 'main', msg: 'nPartCount fehlt nach dem Merge.' },
          { type: 'fileContains', path: 'Logical/Main/Main.var', text: 'bFault : BOOL;', branch: 'main', msg: 'bFault fehlt nach dem Merge.' },
          { type: 'clean' }
        ],
        solution: [
          'git pull',
          'git switch feature/stoerung',
          'git switch main',
          'git merge feature/stoerung',
          'cat Logical/Main/Main.var',
          'git merge --abort',
          'git status',
          'git merge feature/stoerung',
          'echo "VAR" > Logical/Main/Main.var',
          'echo "    bStop : BOOL;" >> Logical/Main/Main.var',
          'echo "    nPartCount : UDINT;" >> Logical/Main/Main.var',
          'echo "    bFault : BOOL;" >> Logical/Main/Main.var',
          'echo "END_VAR" >> Logical/Main/Main.var',
          'git add Logical/Main/Main.var',
          'git commit -m "merge: Teilezähler und Störungsmerker zusammengeführt"'
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────────────────────── Level 2 · Projekt
  {
    id: 'git-2-projekt',
    level: 2,
    kind: 'projekt',
    title: 'Praxisprojekt: Feature über git.breitner.de ausliefern – Push, Merge Request, Release-Tag',
    summary: 'Du synchronisierst mit dem Server, stellst einen Merge Request mit Code Review und markierst den freigegebenen Stand mit einem SemVer-Tag.',
    minutes: 240,
    req: ['git-2-konflikte'],
    briefing: 'Im Team arbeitet niemand allein auf seinem Rechner. Du holst mit `fetch`/`pull` die Arbeit der anderen, pushst deinen Feature-Branch auf git.breitner.de und stellst dort einen Merge Request (MR). Eine Kollegin prüft deinen Code im Web-Interface, kommentiert Zeilen und gibt frei. Erst dann landet das Feature in `main`. Freigegebene Stände, die auf Maschinen gehen, markierst du mit einem annotierten Tag nach Semantic Versioning (z. B. `v1.1.0`).',
    practice: 'Bei der Auslieferung einer Maschine wird der Softwarestand im Abnahmeprotokoll notiert. Mit einem Tag `v1.1.0` kann jeder später exakt diesen Stand wiederherstellen – auch Jahre danach für eine Ersatzsteuerung.',
    transfer: {
      tia: 'Im TIA Portal entspricht das grob dem Ablauf „Projekt auf Project Server einchecken, Freigabe, Version markieren“ beim Multiuser Engineering – mit Git ist Review und Freigabe aber zeilengenau sichtbar.',
      codesys: 'TwinCAT-Teams nutzen genau diesen Ablauf mit Azure DevOps, GitHub oder GitLab (Pull Request = Merge Request).'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Unterscheide fetch, pull und push',
        guide: {
          intro: 'Drei Befehle verbinden dein lokales Repository mit git.breitner.de.',
          steps: [
            '`git fetch` lädt neue Commits vom Server und aktualisiert `origin/main` – dein lokaler main bleibt unverändert. Ideal, um erst nachzusehen: `git log --oneline --all`.',
            '`git pull` = `fetch` + `merge` von `origin/main` in deinen aktuellen Branch.',
            '`git push` überträgt deine lokalen Commits. Hat der Server neue Commits, die du nicht hast, wird der Push abgelehnt („rejected – fetch first“). Dann erst `git pull`, ggf. Konflikte lösen, erneut `git push`.',
            'TortoiseGit: **Fetch…**, **Pull…**, **Push…** – oder **Git Sync…**, ein Dialog, der alle drei mit Vorschau der ein- und ausgehenden Commits bündelt.'
          ],
          code: { lang: 'bash', text: 'git fetch\ngit log --oneline --all -n 5\ngit pull\ngit push' },
          done: 'Erledigt, wenn du erklären kannst, warum ein Push abgelehnt wird und wie du das löst.',
          tip: 'Nie `git push --force` auf gemeinsame Branches. Damit überschreibst du die Arbeit anderer auf dem Server.',
          link: { label: 'TortoiseGit: Sync', url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-sync.html' }
        }
      },
      {
        id: 'o2',
        title: 'Pushe einen Feature-Branch und stelle einen Merge Request',
        guide: {
          intro: 'Ein Merge Request ist die Bitte „Bitte prüft meinen Branch und führt ihn in main zusammen“.',
          steps: [
            'Hole den aktuellen Stand: `git switch main` und `git pull`.',
            'Lege `feature/<thema>` an, committe in kleinen Schritten, baue und teste in Automation Studio.',
            'Pushe den Branch: `git push -u origin feature/<thema>`. git bash zeigt häufig direkt einen Link zum Anlegen des Merge Requests.',
            'Auf https://git.breitner.de: im Repository **Merge Request/Pull Request › Neu**, Quelle `feature/<thema>`, Ziel `main` wählen.',
            'Titel nach Conventional Commits, Beschreibung: Was, warum, wie getestet (Simulation, Anlage), betroffene Hardware. Reviewer zuweisen.'
          ],
          code: { lang: 'bash', text: 'git push -u origin feature/notaus-quittierung' },
          done: 'Erledigt, wenn dein MR im Web-Interface sichtbar ist und einen Reviewer hat.',
          tip: 'Ein MR sollte in 15–30 Minuten reviewbar sein. Mehrere hundert geänderte Zeilen teilst du besser in mehrere MRs auf.',
          link: { label: 'Gitea: Pull Requests', url: 'https://docs.gitea.com/usage/pull-request' }
        }
      },
      {
        id: 'o3',
        title: 'Führe ein Code Review durch',
        guide: {
          intro: 'Code Review erhöht die Qualität und verteilt Wissen: Mindestens zwei Personen kennen jede Änderung.',
          steps: [
            'Öffne den MR und den Tab **Änderungen/Files changed**. Lies den Diff Datei für Datei.',
            'Prüfe: Ist die Logik sicher (Not-Halt, Verriegelungen unverändert)? Sind Variablen sinnvoll benannt? Sind keine Build-Dateien enthalten?',
            'Kommentiere direkt an der Zeile (Klick auf die Zeilennummer). Formuliere konkret und freundlich, z. B. „Hier fehlt die Flankenauswertung, sonst quittiert ein klemmender Taster dauerhaft.“',
            'Gib frei (**Approve**) oder fordere Änderungen an. Der Autor pusht Korrekturen auf denselben Branch, der MR aktualisiert sich automatisch.',
            'Nach Freigabe: Merge im Web-Interface (bevorzugt mit Merge-Commit) und Feature-Branch löschen.'
          ],
          done: 'Erledigt, wenn du in einem fremden MR mindestens einen begründeten Kommentar geschrieben hast.',
          tip: 'Prüfe nicht nur den Code, sondern lade den Branch bei sicherheitsrelevanten Änderungen auch selbst und teste ihn im Simulator.',
          link: { label: 'B&R DevOps Package: Code Review', url: 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_6_CodeReview/' }
        }
      },
      {
        id: 'o4',
        title: 'Markiere ein Release mit einem SemVer-Tag',
        guide: {
          intro: 'Semantic Versioning: `MAJOR.MINOR.PATCH`. B&R nutzt im DevOps Package dasselbe Schema (XX.YY.ZZ).',
          steps: [
            '**PATCH** (1.0.0 → 1.0.1): nur Fehlerkorrekturen, keine neuen Funktionen.',
            '**MINOR** (1.0.1 → 1.1.0): neue, rückwärtskompatible Funktion (z. B. Tippbetrieb).',
            '**MAJOR** (1.1.0 → 2.0.0): inkompatible Änderung, z. B. geänderte Schnittstelle zum Leitrechner oder neue Hardware-Konfiguration.',
            'Annotierten Tag anlegen: `git tag -a v1.1.0 -m "Release 1.1.0: Not-Halt-Quittierung"` und pushen: `git push --tags`.',
            'TortoiseGit: **Show log**, Commit auswählen, Rechtsklick › **Create Tag at this version…**, Haken bei **Annotation message**. Beim Push **Include Tags** anhaken.'
          ],
          code: { lang: 'bash', text: 'git tag -a v1.1.0 -m "Release 1.1.0: Not-Halt-Quittierung"\ngit push --tags' },
          done: 'Erledigt, wenn der Tag im Web-Interface unter Tags/Releases erscheint.',
          tip: 'Trage dieselbe Versionsnummer auch in der Software ein (z. B. Konstante im Programm oder HMI-Infoseite). Das B&R DevOps Package zeigt dafür ein Build-Version-Framework.',
          link: { label: 'Semantic Versioning 2.0.0 (deutsch)', url: 'https://semver.org/lang/de/' }
        }
      }
    ],
    videos: [
      { id: 'Oc3jnCqnLjo', title: 'Git Tutorial #2 - Remote Repositories mit Beispiel Github', channel: 'The Morpheus Tutorials', lang: 'de', why: 'Deutschsprachige Einführung in Remotes, push und pull.' },
      { id: 'u_sF3cAZddY', title: 'Git | Teil 1 - Grundlagen | commit, fetch, merge, pull, push', channel: 'CloudDNA', lang: 'de', why: 'Stellt fetch, pull und push sauber gegenüber.' },
      { id: 'tzD8DvNwY14', title: 'Git Schulung - Arbeiten mit Branches und Tags', channel: 'Codingtutor.de', lang: 'de', why: 'Schulungsvideo zu Branches und Tags auf Deutsch.' }
    ],
    readings: [
      {
        title: 'Git Grundlagen – Taggen', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 15,
        url: 'https://git-scm.com/book/de/v2/Git-Grundlagen-Taggen',
        why: 'Erklärt leichtgewichtige und annotierte Tags und das Pushen von Tags.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Grundlagen-Taggen'
      },
      {
        title: 'Semantic Versioning 2.0.0', author: 'Preston-Werner, T.', institution: 'semver.org',
        work: 'Spezifikation', year: 2013, type: 'Dokumentation', minutes: 15,
        url: 'https://semver.org/lang/de/',
        why: 'Die verbindliche Spezifikation von MAJOR.MINOR.PATCH auf Deutsch.',
        apa: 'Preston-Werner, T. (2013). *Semantic Versioning 2.0.0*. ' + ABGERUFEN + 'https://semver.org/lang/de/'
      },
      {
        title: 'Versioning', author: 'B&R Industrial Automation', institution: 'B&R Community (GitHub Pages)',
        work: 'B&R DevOps Package – Version Control', year: 2023, type: 'Hersteller', minutes: 10,
        url: 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_7_Versioning/',
        why: 'Zeigt, wie B&R selbst Tags und das Versionsschema XX.YY.ZZ einsetzt.',
        apa: 'B&R Industrial Automation. (2023). *Versioning*. B&R DevOps Package. ' + ABGERUFEN + 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_7_Versioning/'
      }
    ],
    quiz: [
      { type: 'single', q: 'Was macht `git fetch` mit deinem lokalen Branch main?', options: ['Er wird mit origin/main gemergt', 'Nichts – nur origin/main wird aktualisiert', 'Er wird gelöscht', 'Er wird gepusht'], correct: 1, explain: '`fetch` lädt nur herunter. Erst `merge` bzw. `pull` verändert deinen Branch.' },
      { type: 'single', q: 'Dein Stand ist 1.4.2. Du ergänzt eine neue, kompatible Funktion. Welche Version ist richtig?', options: ['1.4.3', '1.5.0', '2.0.0', '1.4.2-neu'], correct: 1, explain: 'Neue rückwärtskompatible Funktion → MINOR erhöhen, PATCH auf 0.' },
      { type: 'single', q: 'Dein Push wird mit „rejected (fetch first)“ abgelehnt. Was ist der richtige nächste Schritt?', options: ['git push --force', 'git pull, ggf. Konflikte lösen, dann erneut git push', 'Repository neu klonen', 'Den Branch löschen'], correct: 1, explain: 'Der Server hat Commits, die dir fehlen. Erst integrieren, dann pushen.' }
    ],
    exam: [
      { type: 'single', q: 'Was unterscheidet einen annotierten von einem leichtgewichtigen Tag?', options: ['Annotierte Tags speichern Autor, Datum und Message als eigenes Objekt', 'Leichtgewichtige Tags werden automatisch gepusht', 'Annotierte Tags können nur auf main stehen', 'Es gibt keinen Unterschied'], correct: 0, explain: 'Für Releases nutzt man annotierte Tags (`-a`), weil sie nachvollziehbar dokumentieren, wer wann freigegeben hat.' },
      { type: 'multi', q: 'Was gehört in die Beschreibung eines Merge Requests für Maschinensoftware?', options: ['Was wurde geändert und warum', 'Wie wurde getestet (Simulation/Anlage)', 'Betroffene Hardware/Konfiguration', 'Das Passwort für git.breitner.de'], correct: [0, 1, 2], explain: 'Zugangsdaten gehören nie in Repository, MR oder Commit.' },
      { type: 'single', q: 'Welche Änderung erfordert eine neue MAJOR-Version?', options: ['Kommentar korrigiert', 'Fehler in der Zählerlogik behoben', 'Struktur der Schnittstelle zum Leitrechner (OPC UA) inkompatibel geändert', 'Neuer optionaler Tippbetrieb'], correct: 2, explain: 'Inkompatible Schnittstellenänderungen brechen Abnehmer und erfordern MAJOR.' },
      { type: 'single', q: 'Wie überträgst du lokal angelegte Tags auf den Server?', options: ['Automatisch mit jedem git push', 'Mit `git push --tags` (bzw. `git push origin v1.1.0`)', 'Mit `git fetch --tags`', 'Gar nicht, Tags sind immer lokal'], correct: 1, explain: 'Ein normales `git push` überträgt Tags nicht automatisch.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Feature ausliefern und Release taggen',
        task: L(
          'Im Repository `presse` hat ein Kollege inzwischen einen Commit auf den Server gepusht. Du sollst die Not-Halt-Quittierung umsetzen und als Version `v1.1.0` freigeben.',
          '',
          '1. Hole den neuen Stand vom Server (erst `git fetch`, dann ansehen, dann `git pull`).',
          '2. Lege `feature/notaus-quittierung` an, ergänze in `Logical/Main/Main.st` die Zeile `// Quittierung nur mit positiver Flanke von diAck` und committe (`feat…`).',
          '3. Pushe den Branch mit Upstream auf `origin` (hier würdest du im Web-Interface den Merge Request stellen).',
          '4. Nach der Freigabe: Wechsle auf `main`, merge den Branch mit `--no-ff` und pushe `main`.',
          '5. Lege den annotierten Tag `v1.1.0` an und pushe die Tags.'
        ),
        hints: ['`git log --oneline --all` zeigt nach `fetch` den Commit des Kollegen auf origin/main.', '`git push -u origin feature/notaus-quittierung`', '`git tag -a v1.1.0 -m "…"` und `git push --tags`'],
        setup: {
          cloned: true,
          remote: SERVER + 'presse.git',
          files: Object.assign(asProject('Presse'), { '.gitignore': GITIGNORE_AS }),
          commits: [{ msg: 'feat(presse): Zweihandbedienung', files: { 'README.md': L('# Presse', 'Version 1.0.0') } }],
          remoteCommits: [{ branch: 'main', author: 'Kollege', msg: 'docs: Schaltplanreferenz ergänzt', files: { 'docs/Schaltplan.md': L('# Schaltplan', 'Siehe EPLAN-Projekt P-4711, Blatt 12.') } }],
          user: true
        },
        checks: [
          { type: 'commandUsed', pattern: '^git fetch', msg: 'Nutze zuerst `git fetch`, um dir die Änderungen anzusehen.' },
          { type: 'fileContains', path: 'docs/Schaltplan.md', text: 'P-4711', branch: 'main', msg: 'Der Commit des Kollegen fehlt in deinem main.' },
          { type: 'remoteHasBranch', name: 'feature/notaus-quittierung', msg: 'Der Feature-Branch liegt nicht auf dem Server.' },
          { type: 'merged', from: 'feature/notaus-quittierung', into: 'main' },
          { type: 'remoteInSync', branch: 'main', msg: 'main ist nicht gepusht.' },
          { type: 'tagExists', name: 'v1.1.0' },
          { type: 'commandUsed', pattern: '^git push .*--tags', msg: 'Pushe den Tag mit `git push --tags`.' },
          { type: 'clean' }
        ],
        solution: [
          'git fetch',
          'git log --oneline --all',
          'git pull',
          'git switch -c feature/notaus-quittierung',
          'echo "// Quittierung nur mit positiver Flanke von diAck" >> Logical/Main/Main.st',
          'git add Logical/Main/Main.st',
          'git commit -m "feat(presse): Not-Halt-Quittierung mit Flankenauswertung"',
          'git push -u origin feature/notaus-quittierung',
          'git switch main',
          'git merge --no-ff feature/notaus-quittierung',
          'git push',
          'git tag -a v1.1.0 -m "Release 1.1.0: Not-Halt-Quittierung"',
          'git push --tags'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Abgelehnten Push auflösen',
        task: L(
          'Du hast auf `main` lokal einen Fix committet. Beim Push stellst du fest, dass eine Kollegin in der Zwischenzeit selbst etwas auf den Server gepusht hat.',
          '',
          '1. Committe in `Logical/Main/Main.st` die Zeile `// fix: Zykluszähler auf UDINT umgestellt` (`fix…`).',
          '2. Versuche zu pushen – der Server lehnt ab.',
          '3. Integriere die Änderung der Kollegin mit `git pull` und pushe danach erfolgreich.',
          '4. Am Ende müssen lokal und Server gleich sein, und beide Änderungen sind in `main`.'
        ),
        hints: ['Die Fehlermeldung des abgelehnten Pushs sagt dir den nächsten Schritt.', 'Die Kollegin hat eine andere Datei geändert, es entsteht kein Konflikt – nur ein Merge-Commit.'],
        setup: {
          cloned: true,
          remote: SERVER + 'foerderband.git',
          files: Object.assign(asProject('Foerderband'), { '.gitignore': GITIGNORE_AS }),
          commits: [],
          remoteCommits: [{ branch: 'main', author: 'Kollegin', msg: 'feat(hmi): Seite Diagnose ergänzt', files: { 'Logical/HMI/Diagnose.md': L('# Diagnoseseite', 'Zeigt Zykluszähler und Störungen.') } }],
          user: true
        },
        checks: [
          { type: 'fileContains', path: 'Logical/Main/Main.st', text: 'UDINT umgestellt', branch: 'main' },
          { type: 'fileContains', path: 'Logical/HMI/Diagnose.md', text: 'Diagnoseseite', branch: 'main', msg: 'Die Änderung der Kollegin fehlt.' },
          { type: 'remoteInSync', branch: 'main', msg: 'Lokaler und entfernter main sind nicht gleich.' },
          { type: 'commandUsed', pattern: '^git pull', msg: 'Integriere die Server-Änderungen mit `git pull`.' },
          { type: 'clean' }
        ],
        solution: [
          'echo "// fix: Zykluszähler auf UDINT umgestellt" >> Logical/Main/Main.st',
          'git add Logical/Main/Main.st',
          'git commit -m "fix(foerderband): Zykluszähler auf UDINT umgestellt"',
          'git push',
          'git pull',
          'git push',
          'git log --oneline --graph -5'
        ]
      }
    ],
    proof: true,
    badge: 'Release-fähig im Team'
  }
];
