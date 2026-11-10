'use strict';
const { L, ABGERUFEN, SERVER, asProject, GITIGNORE_AS } = require('./common');

module.exports = [
  // ───────────────────────────────────────────── Level 4 · Modul 1
  {
    id: 'git-4-historie',
    level: 4,
    kind: 'lektion',
    title: 'Historie gezielt bearbeiten: rebase, cherry-pick, bisect',
    summary: 'Du integrierst Branches per rebase, überträgst einzelne Fixes per cherry-pick und findest mit bisect den Commit, der einen Fehler eingeführt hat.',
    minutes: 180,
    req: ['git-3-projekt'],
    briefing: 'Auf Engineer-Niveau reicht es nicht mehr, Branches nur zu mergen. `git rebase` setzt deine Commits auf einen neuen Ausgangspunkt und erzeugt eine lineare Historie – mächtig, aber gefährlich bei bereits geteilten Branches. `git cherry-pick` überträgt einen einzelnen Commit in einen anderen Branch, z. B. einen Fix aus 2.x in den Support-Branch 1.x. `git bisect` findet per binärer Suche den Commit, der eine Regression eingeführt hat – bei 100 Commits in höchstens 7 Testläufen. Diese Befehle laufen nicht im Simulator; du lernst sie hier mit echten Schritten in git bash und TortoiseGit und übst die zugrunde liegenden Denkweisen mit den verfügbaren Befehlen.',
    practice: 'Nach einem Software-Update zählt eine Anlage Teile doppelt. Seit dem letzten funktionierenden Release gab es 40 Commits. Mit `git bisect` und je einem Test im Simulator (ArSim) findest du den verursachenden Commit in rund sechs Durchläufen statt durch stundenlanges Code-Lesen.',
    transfer: {
      tia: 'Für TIA-Projekte ohne textbasierte Quellen gibt es kein Äquivalent; mit exportierten Quellen funktionieren rebase, cherry-pick und bisect genauso.',
      codesys: 'Visual Studio (TwinCAT) bietet Rebase und Cherry-Pick im Git-Fenster; bisect führst du dort ebenfalls über die Kommandozeile aus.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Integriere einen Feature-Branch mit rebase',
        guide: {
          intro: '`git rebase main` nimmt die Commits deines Branches und spielt sie nacheinander auf dem aktuellen main neu ab. Die Commits bekommen dabei neue Hashes.',
          steps: [
            'Hole den aktuellen Stand: `git fetch` und wechsle auf deinen Feature-Branch.',
            'Setze ihn neu auf: `git rebase origin/main`.',
            'Bei Konflikt: Datei lösen, `git add <datei>`, dann `git rebase --continue`. Abbrechen mit `git rebase --abort`.',
            'Lokale Commits aufräumen (zusammenfassen, umbenennen, umsortieren): `git rebase -i HEAD~3` und im Editor `pick`, `squash`, `reword` setzen.',
            'TortoiseGit: Rechtsklick › **TortoiseGit › Rebase…**, Upstream wählen; in der Liste je Commit Pick/Squash/Edit/Skip und **Start Rebase**.',
            'Goldene Regel: Branches, die andere schon gepullt haben, nicht rebasen. Wenn nötig, nur nach Absprache und mit `git push --force-with-lease`.'
          ],
          code: { lang: 'bash', text: 'git fetch\ngit switch feature/rezept\ngit rebase origin/main\n# Konflikt? lösen, dann:\ngit add Logical/Recipe/Recipe.st\ngit rebase --continue' },
          done: 'Erledigt, wenn du in einem Übungsrepository (echte git bash) einen Feature-Branch per rebase auf main gesetzt hast und `git log --graph` eine lineare Historie zeigt.',
          tip: 'Merge bewahrt die tatsächliche Entstehungsgeschichte, rebase erzeugt eine aufgeräumte. Legt im Team fest, was ihr wollt – und schützt main gegen Force-Push.',
          link: { label: 'Pro Git: Rebasing', url: 'https://git-scm.com/book/de/v2/Git-Branching-Rebasing' }
        }
      },
      {
        id: 'o2',
        title: 'Übertrage einen Fix mit cherry-pick',
        guide: {
          intro: 'Cherry-pick erzeugt im aktuellen Branch einen neuen Commit mit denselben Änderungen wie der gewählte Commit.',
          steps: [
            'Finde den Commit auf dem Quell-Branch: `git log --oneline main`.',
            'Wechsle auf den Ziel-Branch, z. B. `git switch support/1.x`.',
            'Übertrage den Commit mit Herkunftsvermerk: `git cherry-pick -x <hash>`. `-x` ergänzt „(cherry picked from commit …)“ in der Message.',
            'Konflikte wie beim Merge lösen, dann `git cherry-pick --continue`.',
            'TortoiseGit: **Show log** auf dem Ziel-Branch öffnen, oben den Quell-Branch anzeigen lassen, Rechtsklick auf den Commit › **Cherry Pick this commit…**.'
          ],
          code: { lang: 'bash', text: 'git switch support/1.x\ngit cherry-pick -x 4f2a9c1\ngit tag -a v1.4.1 -m "Hotfix 1.4.1"\ngit push origin support/1.x --tags' },
          done: 'Erledigt, wenn der Fix im Ziel-Branch mit Herkunftsvermerk in der Message steht.',
          tip: 'Cherry-pick ist ideal für einzelne Fixes. Für viele Commits ist ein Merge meist besser, sonst gibt es dieselbe Änderung mehrfach mit verschiedenen Hashes.',
          link: { label: 'git-scm.com: git-cherry-pick', url: 'https://git-scm.com/docs/git-cherry-pick' }
        }
      },
      {
        id: 'o3',
        title: 'Finde eine Regression mit bisect',
        guide: {
          intro: '`git bisect` halbiert die Menge verdächtiger Commits mit jedem Test. Du brauchst einen guten und einen schlechten Stand.',
          steps: [
            'Starten: `git bisect start`, dann `git bisect bad` (aktueller Stand fehlerhaft) und `git bisect good v1.2.0` (letzter bekannt guter Tag).',
            'Git checkt einen Commit in der Mitte aus. Projekt in Automation Studio neu laden, bauen (F7), in ArSim übertragen und den Fehlerfall testen.',
            'Ergebnis melden: `git bisect good` oder `git bisect bad`. Wiederholen, bis Git den ersten schlechten Commit nennt.',
            'Beenden: `git bisect reset` bringt dich zurück auf deinen Branch.',
            'TortoiseGit: **Show log**, Rechtsklick auf den guten Commit › **Bisect start**; danach im Kontextmenü **Bisect good** / **Bisect bad** / **Bisect reset**.',
            'Gefunden? Commit mit `git show` analysieren und per `git revert` oder gezieltem Fix korrigieren.'
          ],
          code: { lang: 'bash', text: 'git bisect start\ngit bisect bad\ngit bisect good v1.2.0\n# testen …\ngit bisect good   # oder: git bisect bad\ngit bisect reset' },
          done: 'Erledigt, wenn du erklären kannst, warum bei N Commits höchstens ⌈log₂ N⌉ Tests nötig sind, und den Ablauf einmal in echter git bash durchgeführt hast.',
          tip: 'Bisect lohnt sich besonders, wenn jeder Commit für sich baut. Das ist ein weiteres Argument für kleine, vollständige Commits.',
          link: { label: 'Pro Git: Debuggen mit Git', url: 'https://git-scm.com/book/de/v2/Git-Tools-Debuggen-mit-Git' }
        }
      },
      {
        id: 'o4',
        title: 'Analysiere Historie mit Bordmitteln',
        guide: {
          intro: 'Auch ohne bisect findest du Ursachen oft schnell, wenn du die Historie gezielt befragst.',
          steps: [
            '`git log --oneline -- Logical/Sensor/Param.st` zeigt nur Commits, die eine bestimmte Datei geändert haben (echte git bash).',
            '`git show HEAD~2` zeigt den Inhalt eines älteren Commits.',
            '`git diff v1.2.0 HEAD` zeigt alle Änderungen seit einem Release.',
            '`git blame Logical/Main/Main.st` zeigt pro Zeile, welcher Commit sie zuletzt geändert hat. TortoiseGit: Rechtsklick › **TortoiseGit › Blame**.'
          ],
          done: 'Erledigt, wenn du für eine beliebige Programmzeile herausfinden kannst, wann und warum sie geändert wurde.',
          tip: 'Gute Commit-Messages zahlen sich genau hier aus: „fix: Entprellzeit wegen Prellen von B3 erhöht“ beantwortet das Warum sofort.'
        }
      }
    ],
    videos: [
      { id: 'pgibfECuS2Y', title: 'Merge, Rebase und Cherrypicking // deutsch', channel: 'the native web GmbH', lang: 'de', why: 'Vergleicht merge, rebase und cherry-pick auf Deutsch.' },
      { id: '1TNK-OkaelI', title: 'Git Rebase - Einfach und praktisch erklärt', channel: 'Nerdisch', lang: 'de', why: 'Praktische deutsche Erklärung von rebase.' },
      { id: 'u9-toShXbBE', title: 'Git tutorials: How to use Git bisect', channel: 'Mobilefish.com', lang: 'en', why: 'Schrittweise Demonstration von git bisect.' }
    ],
    readings: [
      {
        title: 'Versionsverwaltung mit git (Übungsfolien, Abschnitt rebase)', author: 'Ulbrich, P.', institution: 'Technische Universität Dortmund, Arbeitsgruppe Systemsoftware',
        work: 'Übungen zur Vorlesung Verlässliche Systemsoftware', year: 2024, type: 'Uni-Skript', minutes: 20,
        url: 'https://sys-sideshow.cs.tu-dortmund.de/lehre/ss24/vss/material/C11_Git.pdf',
        why: 'Hochschulfolien, die rebase grafisch mit merge vergleichen.',
        apa: 'Ulbrich, P. (2024). *Git – Übungen zur Vorlesung Verlässliche Systemsoftware*. Technische Universität Dortmund. ' + ABGERUFEN + 'https://sys-sideshow.cs.tu-dortmund.de/lehre/ss24/vss/material/C11_Git.pdf'
      },
      {
        title: 'Git Branching – Rebasing', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 30,
        url: 'https://git-scm.com/book/de/v2/Git-Branching-Rebasing',
        why: 'Erklärt rebase und „Die Gefahren des Rebasing“.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Branching-Rebasing'
      },
      {
        title: 'Git Tools – Debuggen mit Git', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 20,
        url: 'https://git-scm.com/book/de/v2/Git-Tools-Debuggen-mit-Git',
        why: 'Beschreibt git blame und git bisect.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Tools-Debuggen-mit-Git'
      }
    ],
    quiz: [
      { type: 'single', q: 'Warum solltest du einen Branch, den Kollegen schon gepullt haben, nicht rebasen?', options: ['Rebase löscht den Branch auf dem Server', 'Rebase erzeugt neue Commit-Hashes; die Kollegen hätten danach abweichende Historien', 'Rebase funktioniert nur lokal', 'Rebase entfernt alle Tags'], correct: 1, explain: 'Umgeschriebene Commits passen nicht mehr zu den Kopien anderer und müssten per Force-Push verteilt werden.' },
      { type: 'numeric', q: 'Zwischen dem letzten guten Release und dem fehlerhaften Stand liegen {N} Commits. Wie viele Tests brauchst du mit `git bisect` höchstens?', params: { N: [20, 500, 1] }, formula: 'ceil(log2(N))', unit: 'Tests', tol: 0, explain: 'Jeder Test halbiert die Menge: höchstens ⌈log₂ N⌉ Tests.' },
      { type: 'single', q: 'Was bewirkt die Option `-x` bei `git cherry-pick -x <hash>`?', options: ['Sie überspringt Konflikte', 'Sie ergänzt in der Message einen Verweis auf den Ursprungs-Commit', 'Sie löscht den Ursprungs-Commit', 'Sie pusht sofort'], correct: 1, explain: 'So bleibt nachvollziehbar, woher der Fix stammt.' }
    ],
    exam: [
      { type: 'single', q: 'Welcher Befehl setzt einen laufenden Rebase nach dem Lösen eines Konflikts fort?', options: ['git commit', 'git rebase --continue', 'git merge --continue', 'git rebase --skip-all'], correct: 1, explain: 'Nach `git add` geht es mit `git rebase --continue` weiter.' },
      { type: 'single', q: 'Welchen Befehl nutzt du, um zu sehen, welcher Commit eine bestimmte Programmzeile zuletzt geändert hat?', options: ['git blame', 'git bisect', 'git stash', 'git tag'], correct: 0, explain: '`git blame` annotiert jede Zeile mit Commit, Autor und Datum.' },
      { type: 'multi', q: 'Was ist bei bisect an einem AS6-Projekt für jeden Testschritt nötig?', options: ['Projekt in AS neu laden', 'Bauen und in ArSim bzw. auf das Testtarget übertragen', 'Fehlerfall reproduzieren', 'Den Server neu starten'], correct: [0, 1, 2], explain: 'Git tauscht nur Dateien; der Test muss am gebauten Stand erfolgen.' },
      { type: 'single', q: 'Wann ist `git push --force-with-lease` sicherer als `--force`?', options: ['Nie', 'Es überschreibt den Server nur, wenn dort seit deinem letzten fetch niemand etwas gepusht hat', 'Es pusht nur Tags', 'Es erstellt ein Backup auf dem Server'], correct: 1, explain: 'So überschreibst du nicht versehentlich fremde Commits.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Regression finden und zurücknehmen (bisect-Denkweise)',
        task: L(
          'Seit einigen Commits zählt die Anlage Teile doppelt. Ursache ist eine zu kurze Entprellzeit in `Logical/Sensor/Param.st` (vorher `T#50ms`). Der Simulator kennt kein `git bisect` – gehe deshalb wie bisect vor, aber manuell:',
          '',
          '1. Lies die Historie mit `git log --oneline`.',
          '2. Prüfe Commits gezielt mit `git show HEAD~1`, `git show HEAD~2` … bis du den verursachenden Commit findest.',
          '3. Nimm **nur diesen** Commit mit `git revert` zurück (die übrigen Änderungen müssen erhalten bleiben).',
          '4. Pushe das Ergebnis.'
        ),
        hints: ['Suche den Commit, der in `Param.st` die Entprellzeit geändert hat.', '`git revert` akzeptiert auch `HEAD~n` als Referenz.', 'Kein reset – die Historie ist gepusht.'],
        setup: {
          cloned: true,
          remote: SERVER + 'sortieranlage.git',
          files: Object.assign(asProject('Sortieranlage'), { '.gitignore': GITIGNORE_AS, 'Logical/Sensor/Param.st': L('// Sensorparameter', 'tDebounce := T#50ms;'), 'Logical/Counter/Counter.st': L('// Teilezähler'), 'README.md': L('# Sortieranlage') }),
          commits: [
            { msg: 'feat(hmi): Diagnoseseite ergänzt', files: { 'Logical/HMI/Diag.md': L('# Diagnose') } },
            { msg: 'refactor(sensor): Parameter zentralisiert', files: { 'Logical/Sensor/Param.st': L('// Sensorparameter (zentral)', 'tDebounce := T#5ms;') } },
            { msg: 'docs: README aktualisiert', files: { 'README.md': L('# Sortieranlage', 'Version 1.3.0') } },
            { msg: 'feat(zaehler): Zählerüberlauf behandelt', files: { 'Logical/Counter/Counter.st': L('// Teilezähler', '// Überlauf bei 16#FFFFFFFF abfangen') } }
          ],
          user: true
        },
        checks: [
          { type: 'commandUsed', pattern: '^git show', msg: 'Untersuche die Commits mit `git show`.' },
          { type: 'commandUsed', pattern: '^git revert ', msg: 'Nimm den Commit mit `git revert` zurück.' },
          { type: 'isRevertOf', pattern: 'Parameter zentralisiert', msg: 'Es wurde nicht der verursachende Commit zurückgenommen.' },
          { type: 'fileContains', path: 'Logical/Sensor/Param.st', text: 'T#50ms', branch: 'main', msg: 'Die Entprellzeit ist nicht wieder T#50ms.' },
          { type: 'fileContains', path: 'Logical/Counter/Counter.st', text: 'Überlauf', branch: 'main', msg: 'Die spätere Zähler-Änderung ist verloren gegangen.' },
          { type: 'fileContains', path: 'README.md', text: 'Version 1.3.0', branch: 'main', msg: 'Die README-Änderung ist verloren gegangen.' },
          { type: 'commitCountMin', branch: 'main', n: 1, msg: 'Die Historie darf nicht verkürzt werden.' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'git log --oneline',
          'git show HEAD~1',
          'git show HEAD~2',
          'git revert HEAD~2',
          'git push'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Fix in den Support-Branch übertragen (cherry-pick-Denkweise)',
        task: L(
          'Auf `fix/sensor-timeout` liegt ein Fix für Version 2.x. Kunden mit Version 1.x brauchen ihn auch – aber nicht die übrigen 2.x-Änderungen. Der Simulator kennt kein `cherry-pick`, daher überträgst du die Änderung gezielt von Hand:',
          '',
          '1. Der Fix-Branch liegt nur auf dem Server. Sieh dir den Fix mit `git show origin/fix/sensor-timeout` an.',
          '2. Wechsle auf `support/1.x` und übertrage **genau diese** Änderung: Ergänze in `Logical/Main/Main.st` die Zeile `// fix: Sensor-Timeout auf T#2s begrenzt`.',
          '3. Committe mit einer `fix`-Message, die den Ursprung nennt, z. B. `fix(sensor): Sensor-Timeout begrenzt (aus fix/sensor-timeout)`.',
          '4. Setze den Tag `v1.4.1` und pushe `support/1.x` und die Tags.'
        ),
        hints: ['`git show <branch>` zeigt den letzten Commit dieses Branches.', 'Merge NICHT den ganzen Branch – nur die eine Zeile übernehmen.', 'Push: `git push -u origin support/1.x` und `git push --tags`.'],
        setup: {
          cloned: true,
          remote: SERVER + 'presse.git',
          files: Object.assign(asProject('Presse'), { '.gitignore': GITIGNORE_AS }),
          commits: [],
          branches: {
            'support/1.x': [{ msg: 'chore(release): Version 1.4.0', files: { 'README.md': L('Version 1.4.0') } }],
            'fix/sensor-timeout': [{ msg: 'fix(sensor): Sensor-Timeout auf T#2s begrenzt', files: { 'Logical/Main/Main.st': L('PROGRAM _INIT', 'END_PROGRAM', '', 'PROGRAM _CYCLIC', '\tdoMotor := diStart AND NOT bStop;', 'END_PROGRAM', '// fix: Sensor-Timeout auf T#2s begrenzt') } }]
          },
          user: true
        },
        checks: [
          { type: 'commandUsed', pattern: '^git show ', msg: 'Sieh dir den Fix zuerst mit `git show` an.' },
          { type: 'fileContains', path: 'Logical/Main/Main.st', text: 'Sensor-Timeout auf T#2s begrenzt', branch: 'support/1.x', msg: 'Der Fix fehlt auf support/1.x.' },
          { type: 'fileContains', path: 'README.md', text: 'Version 1.4.0', branch: 'support/1.x' },
          { type: 'lastCommitMsgMatches', branch: 'support/1.x', pattern: '^fix(\\([^)]+\\))?: .+', msg: 'Der Commit braucht eine fix-Message.' },
          { type: 'branchNotContainsMsg', branch: 'support/1.x', pattern: '^fix\\(sensor\\): Sensor-Timeout auf T#2s begrenzt$', msg: 'Du hast den ganzen Fix-Branch gemergt – übertrage nur die Änderung.' },
          { type: 'tagExists', name: 'v1.4.1' },
          { type: 'remoteHasBranch', name: 'support/1.x' },
          { type: 'remoteInSync', branch: 'support/1.x' },
          { type: 'clean' }
        ],
        solution: [
          'git show origin/fix/sensor-timeout',
          'git switch support/1.x',
          'echo "// fix: Sensor-Timeout auf T#2s begrenzt" >> Logical/Main/Main.st',
          'git add Logical/Main/Main.st',
          'git commit -m "fix(sensor): Sensor-Timeout begrenzt (aus fix/sensor-timeout)"',
          'git tag -a v1.4.1 -m "Hotfix 1.4.1: Sensor-Timeout"',
          'git push -u origin support/1.x',
          'git push --tags'
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────────────────────── Level 4 · Modul 2
  {
    id: 'git-4-automatisierung',
    level: 4,
    kind: 'lektion',
    title: 'Hooks, Submodule und geteilte Bibliotheken',
    summary: 'Du setzt Qualitätsregeln mit Git-Hooks automatisch durch und bindest gemeinsam genutzte AS-Bibliotheken über Submodule oder Referenzen ein.',
    minutes: 180,
    req: ['git-3-projekt'],
    briefing: 'Regeln, die nur auf Papier stehen, werden vergessen. Git-Hooks sind Skripte, die bei Ereignissen wie Commit oder Push automatisch laufen: `commit-msg` prüft das Conventional-Commits-Format, `pre-commit` verhindert, dass Build-Dateien oder Konfliktmarker committet werden. Auf dem Server übernehmen Branch-Schutz und eine CI-Pipeline diese Rolle. Der zweite Schwerpunkt: Bibliotheken, die in vielen Maschinenprojekten genutzt werden (z. B. eine Firmen-Motorbibliothek). Kopieren führt zu vielen abweichenden Ständen; Git-Submodule binden stattdessen einen definierten Stand eines eigenen Bibliotheks-Repositorys ein.',
    practice: 'Ein Fehler in der firmeneigenen Antriebsbibliothek wurde behoben. Mit Submodulen siehst du in jedem Maschinenprojekt, welcher Bibliotheksstand eingebunden ist, und aktualisierst ihn bewusst mit einem eigenen Commit – statt in 15 Projekten Dateien von Hand zu kopieren.',
    transfer: {
      tia: 'In TIA Portal übernehmen globale Bibliotheken mit Versionierung diese Aufgabe. Git-Submodule sind das dateibasierte Gegenstück.',
      codesys: 'CODESYS/TwinCAT verteilen Bibliotheken als versionierte .library/.compiled-library-Dateien über ein Bibliotheks-Repository; Quellbibliotheken werden oft ebenfalls als Submodule eingebunden.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Erkläre lokale und serverseitige Hooks',
        guide: {
          intro: 'Hooks liegen standardmäßig in `.git/hooks` und sind dort **nicht** versioniert.',
          steps: [
            'Im Ordner `.git/hooks` liegen Beispiele mit Endung `.sample`. Entfernt man die Endung, ist der Hook aktiv.',
            'Wichtige lokale Hooks: `pre-commit` (vor dem Commit, z. B. Build-Dateien abweisen), `commit-msg` (Message prüfen), `post-checkout` (z. B. Hinweis „AS-Projekt neu laden“).',
            'Serverseitig: `pre-receive`/`update` lehnen Pushes ab, `post-receive` stößt z. B. einen Build an. Auf Gitea/GitLab nutzt man dafür in der Praxis Branch-Schutz und CI-Pipelines.',
            'Hooks laufen unter Git für Windows in der git bash – Shell-Skripte funktionieren also auch unter Windows. TortoiseGit führt die Git-Hooks ebenfalls aus und hat zusätzlich eigene Client-Hooks (**Settings › Hook Scripts**).'
          ],
          done: 'Erledigt, wenn du drei Hooks nennen und jeweils einen sinnvollen Einsatz in einem AS-Projekt beschreiben kannst.',
          tip: 'Ein Hook ersetzt keine serverseitige Prüfung: Lokale Hooks kann jeder mit `--no-verify` umgehen.',
          link: { label: 'Pro Git: Git Hooks', url: 'https://git-scm.com/book/de/v2/Git-einrichten-Git-Hooks' }
        }
      },
      {
        id: 'o2',
        title: 'Schreibe einen commit-msg-Hook und versioniere ihn',
        guide: {
          intro: 'Damit alle denselben Hook nutzen, legst du ihn im Repository ab und verweist Git darauf.',
          steps: [
            'Lege den Ordner `.githooks/` im Repository an.',
            'Lege darin `commit-msg` mit dem Prüfskript an (siehe Code).',
            'Aktiviere ihn einmalig pro Klon: `git config core.hooksPath .githooks` (echte git bash, ab Git 2.9).',
            'Teste: `git commit -m "zeug"` muss abgelehnt werden, `git commit -m "fix: …"` muss durchgehen.',
            'Dokumentiere den Aktivierungsbefehl in README.md oder CONTRIBUTING.md.'
          ],
          code: { lang: 'bash', text: '#!/bin/sh\n# .githooks/commit-msg – prüft Conventional Commits\nif ! head -n 1 "$1" | grep -qE \'^(feat|fix|docs|refactor|test|chore|build|ci)(\\(.+\\))?!?: .+\'; then\n  echo "Commit-Message entspricht nicht Conventional Commits." >&2\n  exit 1\nfi' },
          done: 'Erledigt, wenn eine falsch formatierte Message lokal abgelehnt wird.',
          tip: 'Ergänze einen `pre-commit`-Hook, der mit `git diff --cached --name-only | grep -E "^(Temp|Binaries)/"` versehentlich gestagte Build-Dateien abweist.',
          link: { label: 'B&R DevOps Package: Hooks', url: 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_9_Hooks/' }
        }
      },
      {
        id: 'o3',
        title: 'Binde eine geteilte Bibliothek als Submodul ein',
        guide: {
          intro: 'Ein Submodul ist ein Git-Repository in einem anderen Repository. Das Hauptprojekt speichert nur, welcher Commit des Submoduls eingebunden ist.',
          steps: [
            'Submodul hinzufügen: `git submodule add https://git.breitner.de/ausbildung/brt-libs.git Shared/BrtLibs` und committen (`.gitmodules` + Verweis).',
            'Klonen mit Submodulen: `git clone --recurse-submodules <url>` bzw. nachträglich `git submodule update --init --recursive`.',
            'Bibliothek aktualisieren: `cd Shared/BrtLibs`, `git fetch`, `git switch --detach v1.4.0` (oder gewünschten Tag), `cd ../..`, `git add Shared/BrtLibs`, `git commit -m "build(libs): BrtLibs auf 1.4.0"`.',
            'TortoiseGit: Rechtsklick › **TortoiseGit › Submodule Add…** bzw. **Submodule Update…**.',
            'In AS einbinden: laut B&R Community über Datei-Referenzen, Package-Referenzen (Eintrag in der .pkg) oder Verzeichnis-Junctions (`mklink /J`) – jeweils mit Vor- und Nachteilen (Export, Bearbeitbarkeit in AS).'
          ],
          code: { lang: 'bash', text: 'git submodule add https://git.breitner.de/ausbildung/brt-libs.git Shared/BrtLibs\ngit commit -m "build(libs): BrtLibs als Submodul eingebunden"\ngit submodule update --init --recursive' },
          done: 'Erledigt, wenn ein frischer Klon mit `--recurse-submodules` die Bibliothek enthält und das AS-Projekt baut.',
          tip: 'Binde Bibliotheken immer auf einem Tag ein, nie „irgendein main“. Dann ist jedes Maschinenrelease reproduzierbar.',
          link: { label: 'B&R Community: Using Git-Submodules in an AS-Project', url: 'https://community.br-automation.com/t/using-git-submodules-in-an-as-project/1939' }
        }
      },
      {
        id: 'o4',
        title: 'Wäge Alternativen für geteilten Code ab',
        guide: {
          intro: 'Submodule sind nicht die einzige Lösung – und nicht immer die beste.',
          steps: [
            '**Kopie**: einfach, aber Fixes müssen überall nachgezogen werden. Nur für einmalige Übernahmen.',
            '**Submodul**: exakter, versionierter Stand; erfordert Disziplin beim Klonen und Aktualisieren.',
            '**Exportierte, versionierte Bibliothek**: fertige Bibliothek wird mit Versionsnummer bereitgestellt und in AS importiert; Quellcode liegt im Bibliotheks-Repository.',
            'Entscheide nach: Wie oft ändert sich die Bibliothek? Muss das Maschinenprojekt sie anpassen dürfen? Wer pflegt sie?'
          ],
          done: 'Erledigt, wenn du für die Firmen-Motorbibliothek eine begründete Empfehlung schreiben kannst.',
          tip: 'Wie bei jeder Schnittstelle gilt auch für Bibliotheken SemVer: Eine inkompatible Änderung der FB-Schnittstelle ist eine neue MAJOR-Version.',
          link: { label: 'B&R DevOps Package: Submodules', url: 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_8_Submodules' }
        }
      }
    ],
    videos: [
      { id: 'CVCkZCd11ns', title: 'Conventional Commits und Git Hooks. Mehr dazu in unserem Folge 100 Live Event!', channel: 'todo:cast Developer Podcast', lang: 'de', why: 'Deutschsprachige Einordnung von Conventional Commits und Hooks.' },
      { id: 'r_le07f_rfQ', title: 'Git Hooks: We’re Not Using Them Enough!', channel: 'ArjanCodes', lang: 'en', why: 'Zeigt praktische pre-commit- und commit-msg-Hooks.' },
      { id: '8Z4Cmhji_FQ', title: 'Git Tutorial: All About Submodules', channel: 'GitKraken', lang: 'en', why: 'Erklärt Anlegen, Klonen und Aktualisieren von Submodulen.' }
    ],
    readings: [
      {
        title: 'Git einrichten – Git Hooks', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 20,
        url: 'https://git-scm.com/book/de/v2/Git-einrichten-Git-Hooks',
        why: 'Überblick über client- und serverseitige Hooks.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-einrichten-Git-Hooks'
      },
      {
        title: 'Using Git-Submodules in an AS-Project', author: 'B&R Community', institution: 'B&R Community',
        work: 'B&R Community Forum', year: 2024, type: 'Hersteller', minutes: 20,
        url: 'https://community.br-automation.com/t/using-git-submodules-in-an-as-project/1939',
        why: 'Vergleicht Datei-Referenzen, Package-Referenzen und Junctions speziell für Automation Studio.',
        apa: 'B&R Community. (2024). *Using Git-Submodules in an AS-Project*. ' + ABGERUFEN + 'https://community.br-automation.com/t/using-git-submodules-in-an-as-project/1939'
      },
      {
        title: 'Git Tools – Submodule', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 30,
        url: 'https://git-scm.com/book/de/v2/Git-Tools-Submodule',
        why: 'Ausführliche Anleitung inklusive typischer Stolperstellen.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Tools-Submodule'
      }
    ],
    quiz: [
      { type: 'single', q: 'Welcher Hook eignet sich, um das Format der Commit-Message zu prüfen?', options: ['post-checkout', 'commit-msg', 'post-receive', 'pre-rebase'], correct: 1, explain: '`commit-msg` bekommt die Datei mit der Message als Argument und kann den Commit mit Exit-Code ≠ 0 abbrechen.' },
      { type: 'single', q: 'Warum werden Hooks in `.git/hooks` nicht automatisch an Kollegen verteilt?', options: ['Der Ordner .git wird nicht versioniert', 'Hooks sind verschlüsselt', 'Der Server löscht sie', 'Sie sind zu groß'], correct: 0, explain: 'Darum legt man sie in einen versionierten Ordner (z. B. `.githooks`) und setzt `core.hooksPath`.' },
      { type: 'single', q: 'Was speichert das Hauptrepository bei einem Submodul?', options: ['Eine Kopie aller Dateien des Submoduls', 'Die URL (in .gitmodules) und den eingebundenen Commit des Submoduls', 'Nur den Branchnamen', 'Nichts'], correct: 1, explain: 'Deshalb ist der eingebundene Stand exakt reproduzierbar.' }
    ],
    exam: [
      { type: 'single', q: 'Ein Kollege klont ein Projekt mit Submodul und der Bibliotheksordner ist leer. Was fehlt?', options: ['git submodule update --init --recursive', 'git pull --force', 'git stash pop', 'git tag -l'], correct: 0, explain: 'Ohne `--recurse-submodules` beim Klonen werden Submodule nicht automatisch geholt.' },
      { type: 'single', q: 'Warum ersetzt ein lokaler Hook keine serverseitige Prüfung?', options: ['Lokale Hooks laufen nur unter Linux', 'Sie können mit `--no-verify` umgangen oder gar nicht aktiviert werden', 'Sie funktionieren nicht mit TortoiseGit', 'Sie verlangsamen den Server'], correct: 1, explain: 'Verbindliche Regeln setzt der Server durch (Branch-Schutz, CI).' },
      { type: 'multi', q: 'Welche Möglichkeiten nennt die B&R Community, Submodul-Inhalte in ein AS-Projekt einzubinden?', options: ['Datei-Referenzen', 'Package-Referenzen in der .pkg', 'Verzeichnis-Junction (mklink /J)', 'Kopieren in Temp/'], correct: [0, 1, 2], explain: 'Temp/ wird beim Build überschrieben und ist ignoriert.' },
      { type: 'single', q: 'Die Schnittstelle eines FBs in der geteilten Bibliothek ändert sich inkompatibel. Welche Version erhält die Bibliothek?', options: ['PATCH erhöhen', 'MINOR erhöhen', 'MAJOR erhöhen', 'Keine neue Version'], correct: 2, explain: 'Abnehmer müssen angepasst werden – das ist per SemVer eine neue MAJOR-Version.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'commit-msg-Hook im Repository versionieren',
        task: L(
          'Das Team will Conventional Commits verbindlich machen. Der Hook soll im Repository liegen, damit alle ihn nutzen können.',
          '',
          '1. Lege auf dem Branch `ci/commit-hook` den Ordner `.githooks` an.',
          '2. Lege `.githooks/commit-msg` an. Erste Zeile `#!/bin/sh`, zusätzlich muss die Datei die Zeichenkette `feat|fix|docs|refactor|test|chore|build|ci` enthalten (Teil des Prüfmusters).',
          '3. Ergänze in `CONTRIBUTING.md` die Zeile `Hooks aktivieren: git config core.hooksPath .githooks`.',
          '4. Committe mit einer Message vom Typ `ci` oder `build`, pushe den Branch und merge ihn mit `--no-ff` in `main`. Pushe `main`.'
        ),
        hints: ['Ein komplettes Skript per echo ist mühsam – es reichen die geforderten Zeilen, z. B. `echo "#!/bin/sh" > .githooks/commit-msg` und eine Zeile mit dem Muster.', 'Vermeide doppelte Anführungszeichen innerhalb von `echo "…"`.'],
        setup: {
          cloned: true,
          remote: SERVER + 'sortieranlage.git',
          files: Object.assign(asProject('Sortieranlage'), { '.gitignore': GITIGNORE_AS, 'CONTRIBUTING.md': L('# Teamregeln', 'Commit-Messages nach Conventional Commits') }),
          commits: [],
          user: true
        },
        checks: [
          { type: 'fileContains', path: '.githooks/commit-msg', text: '#!/bin/sh', branch: 'main' },
          { type: 'fileContains', path: '.githooks/commit-msg', text: 'feat|fix|docs|refactor|test|chore|build|ci', branch: 'main', msg: 'Das Prüfmuster fehlt im Hook.' },
          { type: 'fileContains', path: 'CONTRIBUTING.md', text: 'core.hooksPath .githooks', branch: 'main' },
          { type: 'lastCommitMsgMatches', branch: 'ci/commit-hook', pattern: '^(ci|build)(\\([^)]+\\))?: .+' },
          { type: 'remoteHasBranch', name: 'ci/commit-hook' },
          { type: 'merged', from: 'ci/commit-hook', into: 'main' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'git switch -c ci/commit-hook',
          'mkdir .githooks',
          'echo "#!/bin/sh" > .githooks/commit-msg',
          'echo "head -n 1 $1 | grep -qE \'^(feat|fix|docs|refactor|test|chore|build|ci)(\\(.+\\))?!?: .+\' || exit 1" >> .githooks/commit-msg',
          'echo "Hooks aktivieren: git config core.hooksPath .githooks" >> CONTRIBUTING.md',
          'git add .',
          'git commit -m "ci: commit-msg-Hook für Conventional Commits"',
          'git push -u origin ci/commit-hook',
          'git switch main',
          'git merge --no-ff ci/commit-hook',
          'git push'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Geteilte Bibliothek kontrolliert aktualisieren',
        task: L(
          'Im Projekt `presse` ist die Firmenbibliothek `BrtMotor` eingebunden. Ihr Stand steht in `Logical/Libraries/BrtMotor/VERSION` (aktuell `1.3.0`). Version `1.4.0` behebt einen Fehler beim Quittieren.',
          '',
          '1. Lege den Branch `build/brtmotor-1.4.0` an.',
          '2. Setze `VERSION` auf `1.4.0` (überschreiben) und ergänze in `CHANGELOG.md` die Zeile `- BrtMotor auf 1.4.0 aktualisiert (Quittierung)`.',
          '3. Committe mit einer `build`-Message (z. B. `build(libs): BrtMotor auf 1.4.0`).',
          '4. Merge in `main` mit `--no-ff`, setze den Tag `v2.3.1` (PATCH, da nur Fehlerkorrektur) und pushe `main` und Tags.',
          '',
          '*Im echten Projekt wäre `BrtMotor` ein Submodul; der Commit enthielte dann den neuen Submodul-Verweis statt einer VERSION-Datei.*'
        ),
        hints: ['`echo "1.4.0" > Logical/Libraries/BrtMotor/VERSION`', 'Ein Bibliotheks-Update ist ein eigener, kleiner Commit – nicht mit Programmänderungen mischen.'],
        setup: {
          cloned: true,
          remote: SERVER + 'presse.git',
          files: Object.assign(asProject('Presse'), { '.gitignore': GITIGNORE_AS, 'Logical/Libraries/BrtMotor/VERSION': L('1.3.0'), 'CHANGELOG.md': L('# Changelog', '', '## 2.3.0', '- Formatwechsel über HMI') }),
          commits: [],
          user: true
        },
        checks: [
          { type: 'fileContains', path: 'Logical/Libraries/BrtMotor/VERSION', text: '1.4.0', branch: 'main' },
          { type: 'fileContains', path: 'CHANGELOG.md', text: 'BrtMotor auf 1.4.0', branch: 'main' },
          { type: 'lastCommitMsgMatches', branch: 'build/brtmotor-1.4.0', pattern: '^build(\\([^)]+\\))?: .+' },
          { type: 'merged', from: 'build/brtmotor-1.4.0', into: 'main' },
          { type: 'tagExists', name: 'v2.3.1' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'git switch -c build/brtmotor-1.4.0',
          'echo "1.4.0" > Logical/Libraries/BrtMotor/VERSION',
          'echo "- BrtMotor auf 1.4.0 aktualisiert (Quittierung)" >> CHANGELOG.md',
          'git add .',
          'git commit -m "build(libs): BrtMotor auf 1.4.0"',
          'git switch main',
          'git merge --no-ff build/brtmotor-1.4.0',
          'git tag -a v2.3.1 -m "Release 2.3.1: BrtMotor 1.4.0"',
          'git push',
          'git push --tags'
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────────────────────── Level 4 · Projekt
  {
    id: 'git-4-projekt',
    level: 4,
    kind: 'projekt',
    title: 'Praxisprojekt: Release-Prozess und Git-Richtlinie für das Team',
    summary: 'Du definierst einen vollständigen Release-Prozess mit Changelog, Tags und Freigabe und schreibst eine Git-Richtlinie, nach der dein Team arbeitet.',
    minutes: 360,
    req: ['git-4-historie', 'git-4-automatisierung'],
    briefing: 'Als Engineer bist du verantwortlich dafür, dass Software reproduzierbar und nachvollziehbar auf Maschinen kommt. Dazu gehört ein dokumentierter Release-Prozess: Funktionsstopp, Release-Branch, Tests, Changelog nach „Keep a Changelog“, SemVer-Tag, Rückführung in develop, Ablage des Releases auf dem Server und Eintrag der Version in der Maschinendokumentation. Ebenso wichtig ist eine schriftliche Git-Richtlinie für das Team: Branch-Modell, Namenskonventionen, Commit-Format, Review-Regeln, Branch-Schutz, Umgang mit AS-spezifischen Dateien und Bibliotheken. In diesem Projekt erstellst du beides für ein reales oder realistisches Maschinenprojekt.',
    practice: 'Ein Servicetechniker soll in fünf Jahren eine defekte Steuerung tauschen. Mit Tag, Changelog und Release-Notiz findet er den exakt ausgelieferten Stand und weiß, welche AS-Version und welche Bibliotheksstände zum Bauen nötig sind.',
    transfer: {
      tia: 'Entspricht der Kombination aus Projektarchivierung, Versionsangabe im Baustein und Freigabeprozess – mit Git jedoch automatisch nachvollziehbar und prüfbar.',
      codesys: 'Teams mit TwinCAT nutzen dieselben Bausteine: Release-Branches, Tags, Changelog und Release-Seiten in Azure DevOps oder GitLab.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Definiere den Release-Ablauf',
        guide: {
          intro: 'Ein Release-Prozess ist eine Checkliste, die jeder im Team gleich ausführt.',
          steps: [
            'Funktionsstopp: alle geplanten Features in develop, Release-Branch `release/X.Y.Z` anlegen.',
            'Version setzen: Versionskonstante im Programm bzw. HMI-Infoseite, README, CHANGELOG.',
            'Testen auf dem Release-Branch: Simulation (ArSim), FAT an der Maschine; nur Fixes committen.',
            'Abschluss: Merge in main (`--no-ff`), annotierter Tag `vX.Y.Z`, Merge zurück in develop, Push von main, develop und Tags.',
            'Auf git.breitner.de ein Release zum Tag anlegen: Changelog-Auszug, AS-Version, mapp-Version, Bibliotheksstände, ggf. exportiertes Projektarchiv anhängen.'
          ],
          done: 'Erledigt, wenn der Ablauf als `RELEASE.md` im Repository liegt und einmal vollständig durchgeführt wurde.',
          tip: 'Halte im Release fest, mit welcher Automation-Studio- und Runtime-Version gebaut wurde. Ohne diese Angabe ist ein Stand Jahre später oft nicht mehr baubar.',
          link: { label: 'GitLab Docs: Releases', url: 'https://docs.gitlab.com/user/project/releases/' }
        }
      },
      {
        id: 'o2',
        title: 'Führe ein Changelog nach Keep a Changelog',
        guide: {
          intro: 'Ein Changelog ist für Menschen geschrieben, nicht für Maschinen – Inbetriebnehmer, Service und Kunden lesen es.',
          steps: [
            'Datei `CHANGELOG.md` im Wurzelverzeichnis, neueste Version oben.',
            'Abschnitt `## [Unreleased]` für laufende Änderungen; beim Release umbenennen in `## [2.0.0] - 2026-11-10`.',
            'Kategorien: Added, Changed, Deprecated, Removed, Fixed, Security (gern auf Deutsch: Hinzugefügt, Geändert, Behoben …).',
            'Inkompatible Änderungen deutlich kennzeichnen (z. B. „BREAKING: Schnittstelle zum Leitrechner geändert“).',
            'Aus Conventional Commits lässt sich ein Entwurf generieren – bearbeite ihn trotzdem von Hand.'
          ],
          done: 'Erledigt, wenn dein Changelog mindestens zwei Versionen mit Kategorien enthält.',
          tip: 'Schreibe Einträge aus Sicht der Maschine: „Behoben: Band läuft nach Not-Halt-Quittierung nicht mehr selbstständig an“ statt „Bug in FB_Belt gefixt“.',
          link: { label: 'Keep a Changelog 1.1.0 (deutsch)', url: 'https://keepachangelog.com/de/1.1.0/' }
        }
      },
      {
        id: 'o3',
        title: 'Schreibe die Git-Richtlinie für dein Team',
        guide: {
          intro: 'Die Richtlinie (`CONTRIBUTING.md`) fasst alles zusammen, was du in diesem Bereich gelernt hast.',
          steps: [
            'Branch-Modell und Namenskonvention (z. B. GitFlow: main, develop, feature/*, release/*, hotfix/*, support/*).',
            'Commit-Format (Conventional Commits), kleine Commits, keine Build-Dateien; Hooks und deren Aktivierung.',
            'Review-Regeln: Merge nur per Merge Request, mindestens eine Freigabe, Checkliste für sicherheitsrelevante Änderungen.',
            'AS-spezifisch: .gitignore/.gitattributes, Verantwortliche für Hardware.hw/Cpu.sw, Umgang mit Safety- und Visualisierungsdateien, Bibliotheken als Submodul auf Tags.',
            'Verbote: kein Force-Push auf geteilte Branches, kein rebase gepushter Branches, keine Zugangsdaten im Repository.'
          ],
          done: 'Erledigt, wenn die Richtlinie von einer zweiten Person gegengelesen und per Merge Request freigegeben ist.',
          tip: 'Kurz schlägt vollständig: Eine Richtlinie mit zwei Seiten wird gelesen, eine mit zwanzig nicht. Verweise für Details auf Pro Git und die B&R-Community-Beiträge.',
          link: { label: 'Pro Git: Ein Projekt verwalten', url: 'https://git-scm.com/book/de/v2/Verteiltes-Git-Ein-Projekt-verwalten' }
        }
      },
      {
        id: 'o4',
        title: 'Reiche Release und Richtlinie ein',
        guide: {
          intro: 'Der Nachweis zeigt, dass Prozess und Richtlinie gelebt werden.',
          steps: [
            'Repository auf git.breitner.de mit: CONTRIBUTING.md, RELEASE.md, CHANGELOG.md, mindestens zwei getaggten Releases, Branch-Schutz auf main.',
            'Mindestens ein Release mit Release-Seite (Changelog-Auszug, AS-/Runtime-Version, Bibliotheksstände).',
            'Mindestens ein Merge Request mit Review-Diskussion.',
            'Link zum Repository (bzw. zur Release-Seite) im Nachweisfeld eintragen.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist und der Ausbilder Release, Tag und Richtlinie öffnen kann.',
          tip: 'Bitte einen Kollegen, das Release nur anhand deiner RELEASE.md nachzuvollziehen. Wo er hängen bleibt, fehlt etwas im Dokument.'
        }
      }
    ],
    videos: [
      { id: 'JwgkV3p9kn8', title: 'Projektmanagement 04 - Versionsverwaltung - 5 Branching Strategien - Releasemanagement', channel: '42 Entwickler', lang: 'de', why: 'Deutschsprachige Einordnung von Releasemanagement im Zusammenspiel mit Branching.' },
      { id: '97i9pOa2EyE', title: 'What is Semantic Versioning? (semver)', channel: 'Syntax', lang: 'en', why: 'Kompakte Wiederholung von SemVer für die Versionsvergabe im Release.' },
      { id: 'qsTthZi23VE', title: 'Advanced Git Tutorial - Interactive Rebase, Cherry-Picking, Reflog, Submodules and more', channel: 'freeCodeCamp.org', lang: 'en', why: 'Vertiefung der fortgeschrittenen Werkzeuge, die in der Richtlinie geregelt werden.' }
    ],
    readings: [
      {
        title: 'Versionsverwaltung (Seminar Softwareentwicklung in der Wissenschaft)', author: 'Wiesner, R.', institution: 'Universität Hamburg, Arbeitsbereich Wissenschaftliches Rechnen',
        work: 'Seminar Softwareentwicklung in der Wissenschaft (WS 2010/11)', year: 2010, type: 'Uni-Skript', minutes: 20,
        url: 'https://wr.informatik.uni-hamburg.de/_media/teaching/wintersemester_2010_2011/siw-2010-wiesner-versionsverwaltung-druckversion.pdf',
        why: 'Ordnet Varianten und Ziele der Versionsverwaltung grundsätzlich ein – hilfreich als Begründung in der Richtlinie.',
        apa: 'Wiesner, R. (2010). *Versionsverwaltung* [Seminarfolien]. Universität Hamburg. ' + ABGERUFEN + 'https://wr.informatik.uni-hamburg.de/_media/teaching/wintersemester_2010_2011/siw-2010-wiesner-versionsverwaltung-druckversion.pdf'
      },
      {
        title: 'Keep a Changelog 1.1.0', author: 'Lacan, O.', institution: 'keepachangelog.com',
        work: 'Konvention', year: 2023, type: 'Dokumentation', minutes: 10,
        url: 'https://keepachangelog.com/de/1.1.0/',
        why: 'Etablierte Konvention für menschenlesbare Changelogs auf Deutsch.',
        apa: 'Lacan, O. (2023). *Keep a Changelog 1.1.0*. ' + ABGERUFEN + 'https://keepachangelog.com/de/1.1.0/'
      },
      {
        title: 'Verteiltes Git – Ein Projekt verwalten', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 30,
        url: 'https://git-scm.com/book/de/v2/Verteiltes-Git-Ein-Projekt-verwalten',
        why: 'Beschreibt Integration, Tagging und Release-Vorbereitung aus Sicht der verantwortlichen Person.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Verteiltes-Git-Ein-Projekt-verwalten'
      }
    ],
    quiz: [
      { type: 'single', q: 'Welche Angabe ist für die spätere Reproduzierbarkeit eines AS-Releases besonders wichtig?', options: ['Die Farbe der HMI', 'Verwendete Automation-Studio-, Runtime- und Bibliotheksversionen', 'Die Anzahl der Commits', 'Der Name des Laptops'], correct: 1, explain: 'Ohne passende AS-/Runtime-/Bibliotheksversionen lässt sich ein Stand später oft nicht identisch bauen.' },
      { type: 'single', q: 'Wo steht im Changelog nach Keep a Changelog die neueste Version?', options: ['Ganz unten', 'Ganz oben', 'In einer eigenen Datei', 'Im Tag'], correct: 1, explain: 'Neueste Version oben, darüber nur [Unreleased].' },
      { type: 'multi', q: 'Was gehört in eine Git-Richtlinie für ein AS-Team?', options: ['Branch-Modell und Namenskonventionen', 'Commit-Format und Review-Regeln', 'Umgang mit Hardware.hw, Cpu.sw und Safety-Dateien', 'Persönliche Zugangsdaten zum Server'], correct: [0, 1, 2], explain: 'Zugangsdaten gehören nie in ein Repository.' }
    ],
    exam: [
      { type: 'single', q: 'Nach dem Release 2.0.0 auf main wurde vergessen, den Release-Branch in develop zu mergen. Was ist die Folge?', options: ['Keine', 'Fixes aus der Release-Phase fehlen in develop und kehren in 2.1.0 als Fehler zurück', 'Der Tag wird ungültig', 'main wird gelöscht'], correct: 1, explain: 'Darum gehört das Zurückmergen fest in die Release-Checkliste.' },
      { type: 'single', q: 'Welche Version folgt auf 1.9.3, wenn die Schnittstelle zum Leitrechner inkompatibel geändert wird?', options: ['1.9.4', '1.10.0', '2.0.0', '1.9.3-b'], correct: 2, explain: 'Inkompatible Änderung → MAJOR erhöhen, MINOR und PATCH auf 0.' },
      { type: 'single', q: 'Warum sollte main auf dem Server geschützt sein, obwohl die Richtlinie Direkt-Pushes verbietet?', options: ['Aus Lizenzgründen', 'Weil nur der Server Regeln verbindlich durchsetzt; schriftliche Regeln werden im Stress vergessen', 'Damit Tags schneller sind', 'Weil Git sonst keine Merges erlaubt'], correct: 1, explain: 'Technische Durchsetzung ergänzt die organisatorische Regel.' },
      { type: 'single', q: 'Welche Kategorie nach Keep a Changelog passt zu „Band läuft nach Not-Halt-Quittierung nicht mehr selbstständig an“?', options: ['Added', 'Fixed', 'Deprecated', 'Removed'], correct: 1, explain: 'Es handelt sich um eine Fehlerkorrektur.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Release 2.0.0 vollständig durchführen',
        task: L(
          'Im Repository `presse` (GitFlow) liegen auf `develop` alle Funktionen für Version 2.0.0, darunter eine inkompatible Änderung der Leitrechner-Schnittstelle. Führe das Release vollständig durch:',
          '',
          '1. Lege von `develop` den Branch `release/2.0.0` an.',
          '2. Setze in `README.md` die Zeile `Version 2.0.0` (überschreiben).',
          '3. Ergänze in `CHANGELOG.md` die Zeilen `## [2.0.0] - 2026-11-10` und `- BREAKING: Leitrechner-Schnittstelle auf Struktur stInterfaceV2 umgestellt`.',
          '4. Committe mit `chore(release): …` und pushe den Release-Branch mit Upstream.',
          '5. Merge in `main` (`--no-ff`), setze den annotierten Tag `v2.0.0`, merge den Release-Branch zurück in `develop` (`--no-ff`).',
          '6. Pushe `main`, `develop` und die Tags.'
        ),
        hints: ['Reihenfolge wie in deiner RELEASE.md: Branch → Version → Changelog → Commit → Merge main → Tag → Merge develop → Push.', '`git push origin main`, `git push origin develop`, `git push --tags`'],
        setup: {
          cloned: true,
          remote: SERVER + 'presse.git',
          files: Object.assign(asProject('Presse'), { '.gitignore': GITIGNORE_AS, 'README.md': L('Version 1.9.3'), 'CHANGELOG.md': L('# Changelog', '', '## [1.9.3] - 2026-09-01', '- Behoben: Zykluszähler-Überlauf') }),
          commits: [],
          branches: {
            develop: [
              { msg: 'feat(leitrechner)!: Schnittstelle stInterfaceV2', files: { 'Logical/Interface/Interface.typ': L('TYPE', '\tstInterfaceV2 : STRUCT', '\t\tnState : UINT;', '\t\tnPartsGood : UDINT;', '\tEND_STRUCT;', 'END_TYPE') } },
              { msg: 'feat(hmi): Seite Leitrechner-Status', files: { 'Logical/HMI/Interface.md': L('# Leitrechner-Status') } }
            ]
          },
          user: true
        },
        checks: [
          { type: 'branchExists', name: 'release/2.0.0' },
          { type: 'remoteHasBranch', name: 'release/2.0.0' },
          { type: 'lastCommitMsgMatches', branch: 'release/2.0.0', pattern: '^chore\\(release\\): .+' },
          { type: 'fileContains', path: 'README.md', text: 'Version 2.0.0', branch: 'main' },
          { type: 'fileContains', path: 'CHANGELOG.md', text: '## [2.0.0]', branch: 'main' },
          { type: 'fileContains', path: 'CHANGELOG.md', text: 'BREAKING', branch: 'main' },
          { type: 'fileContains', path: 'Logical/Interface/Interface.typ', text: 'stInterfaceV2', branch: 'main', msg: 'Die Funktionen aus develop fehlen in main.' },
          { type: 'merged', from: 'release/2.0.0', into: 'main' },
          { type: 'merged', from: 'release/2.0.0', into: 'develop' },
          { type: 'tagExists', name: 'v2.0.0' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'remoteInSync', branch: 'develop' },
          { type: 'clean' }
        ],
        solution: [
          'git switch develop',
          'git switch -c release/2.0.0',
          'echo "Version 2.0.0" > README.md',
          'echo "## [2.0.0] - 2026-11-10" >> CHANGELOG.md',
          'echo "- BREAKING: Leitrechner-Schnittstelle auf Struktur stInterfaceV2 umgestellt" >> CHANGELOG.md',
          'git add .',
          'git commit -m "chore(release): Version 2.0.0"',
          'git push -u origin release/2.0.0',
          'git switch main',
          'git merge --no-ff release/2.0.0',
          'git tag -a v2.0.0 -m "Release 2.0.0: Leitrechner-Schnittstelle V2"',
          'git switch develop',
          'git merge --no-ff release/2.0.0',
          'git push origin main',
          'git push origin develop',
          'git push --tags'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Richtlinie und Release-Checkliste per Merge Request einbringen',
        task: L(
          'Bringe die Team-Dokumente ins Repository `sortieranlage` – so, wie es die Richtlinie selbst verlangt.',
          '',
          '1. Lege `docs/git-richtlinie` als Branch an.',
          '2. Lege `CONTRIBUTING.md` an. Sie muss die Zeilen `Branch-Modell: GitFlow` und `Kein Force-Push auf main oder develop` enthalten.',
          '3. Lege `RELEASE.md` an. Sie muss die Zeile `Release-Branch in main und develop mergen` enthalten.',
          '4. Committe **zwei** getrennte Commits (je Datei einer) mit `docs`-Messages.',
          '5. Pushe den Branch (Merge Request) und merge ihn nach der Freigabe mit `--no-ff` in `main`. Pushe `main`.'
        ),
        hints: ['Ordner `docs/` ist hier nur Teil des Branch-Namens, die Dateien liegen im Wurzelverzeichnis.', 'Je Datei: echo-Zeilen, `git add <datei>`, `git commit -m "docs: …"`.'],
        setup: {
          cloned: true,
          remote: SERVER + 'sortieranlage.git',
          files: Object.assign(asProject('Sortieranlage'), { '.gitignore': GITIGNORE_AS }),
          commits: [],
          user: true
        },
        checks: [
          { type: 'commitCountMin', branch: 'docs/git-richtlinie', n: 2, msg: 'Es werden zwei getrennte Commits erwartet.' },
          { type: 'fileContains', path: 'CONTRIBUTING.md', text: 'Branch-Modell: GitFlow', branch: 'main' },
          { type: 'fileContains', path: 'CONTRIBUTING.md', text: 'Kein Force-Push auf main oder develop', branch: 'main' },
          { type: 'fileContains', path: 'RELEASE.md', text: 'Release-Branch in main und develop mergen', branch: 'main' },
          { type: 'lastCommitMsgMatches', branch: 'docs/git-richtlinie', pattern: '^docs(\\([^)]+\\))?: .+' },
          { type: 'remoteHasBranch', name: 'docs/git-richtlinie' },
          { type: 'merged', from: 'docs/git-richtlinie', into: 'main' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'git switch -c docs/git-richtlinie',
          'echo "# Git-Richtlinie" > CONTRIBUTING.md',
          'echo "Branch-Modell: GitFlow" >> CONTRIBUTING.md',
          'echo "Commits nach Conventional Commits" >> CONTRIBUTING.md',
          'echo "Kein Force-Push auf main oder develop" >> CONTRIBUTING.md',
          'git add CONTRIBUTING.md',
          'git commit -m "docs: Git-Richtlinie für das Team"',
          'echo "# Release-Ablauf" > RELEASE.md',
          'echo "Release-Branch von develop anlegen, Version und CHANGELOG setzen" >> RELEASE.md',
          'echo "Release-Branch in main und develop mergen" >> RELEASE.md',
          'git add RELEASE.md',
          'git commit -m "docs: Release-Checkliste"',
          'git push -u origin docs/git-richtlinie',
          'git switch main',
          'git merge --no-ff docs/git-richtlinie',
          'git push'
        ]
      }
    ],
    proof: true,
    badge: 'Release-Manager'
  }
];
