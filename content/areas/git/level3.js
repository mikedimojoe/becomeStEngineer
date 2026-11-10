'use strict';
const { L, ABGERUFEN, SERVER, asProject, GITIGNORE_AS } = require('./common');

// Package.pkg mit einfachen Anführungszeichen in Attributen (gültiges XML),
// damit die Datei im Simulator per echo "…" geschrieben werden kann.
const pkg = (...objs) => L('<?xml version=\'1.0\' encoding=\'utf-8\'?>', '<Package>', '  <Objects>', ...objs.map(o => '    <Object Type=\'Program\'>' + o + '</Object>'), '  </Objects>', '</Package>');

module.exports = [
  // ───────────────────────────────────────────── Level 3 · Modul 1
  {
    id: 'git-3-strategien',
    level: 3,
    kind: 'lektion',
    title: 'Branch-Strategien für Maschinensoftware',
    summary: 'Du vergleichst GitHub Flow, GitFlow und Trunk-Based Development und wendest Release- und Hotfix-Branches für ausgelieferte Maschinen an.',
    minutes: 150,
    req: ['git-2-projekt'],
    briefing: 'Sobald mehrere Personen an einer Maschinensoftware arbeiten und Stände an Kunden ausgeliefert werden, braucht das Team feste Regeln: Welche Branches gibt es, wer merged wohin, wie entsteht ein Release, wie kommt ein dringender Fix auf eine Maschine im Feld? GitHub Flow (main + kurze Feature-Branches) ist einfach, Trunk-Based Development setzt auf sehr häufige Integration, GitFlow trennt Entwicklung (`develop`), Releases und Hotfixes klar. Das B&R DevOps Package empfiehlt GitFlow; für Serienmaschinen mit mehreren gepflegten Ständen ist es oft passend, für kleine Teams mit einer aktuellen Version reicht GitHub Flow.',
    practice: 'Version 1.2.0 läuft beim Kunden, auf `develop` ist schon die halbe Version 1.3.0 umgesetzt. Ein Fehler im Not-Halt-Verhalten muss sofort behoben werden. Mit einem Hotfix-Branch von `main` lieferst du 1.2.1 aus, ohne unfertige Funktionen mitzuliefern.',
    transfer: {
      tia: 'Ohne Branches pflegen TIA-Teams Feldstände oft als Projektkopien je Kunde. Mit Git und Release-/Hotfix-Branches bleibt alles in einem Repository und Fixes lassen sich nachweisbar in alle Linien übernehmen.',
      codesys: 'Dieselben Strategien werden bei TwinCAT-Projekten mit Azure DevOps oder GitLab eingesetzt; Beckhoff macht dazu keine eigene Vorgabe.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Vergleiche die drei gängigen Strategien',
        guide: {
          intro: 'Es gibt keine beste Strategie, nur eine passende für Team, Produkt und Auslieferung.',
          steps: [
            '**GitHub Flow**: `main` ist immer auslieferbar. Jede Änderung über kurzlebigen Feature-Branch + Merge Request. Releases sind Tags auf main.',
            '**Trunk-Based Development**: Alle integrieren mindestens täglich in `main` (Trunk), Branches leben Stunden, unfertige Funktionen werden per Parameter/Feature-Flag deaktiviert. Setzt gute automatische Tests voraus.',
            '**GitFlow**: `main` (nur Releases) und `develop` (Integration) leben dauerhaft; dazu `feature/*` von develop, `release/*` zum Stabilisieren, `hotfix/*` von main. Jeder Merge in main wird getaggt.',
            'Bewerte für dein Projekt: Wie viele Personen? Wie oft wird ausgeliefert? Müssen mehrere Versionen im Feld parallel gepflegt werden?'
          ],
          done: 'Erledigt, wenn du für ein Sondermaschinenprojekt und für eine Serienmaschine je eine Strategie begründet auswählen kannst.',
          tip: 'Bei Sondermaschinen mit einem Entwickler ist GitHub Flow meist ausreichend. GitFlow lohnt, sobald Releases getestet und parallel gepflegt werden müssen.',
          link: { label: 'Pro Git: Branching-Workflows', url: 'https://git-scm.com/book/de/v2/Git-Branching-Branching-Workflows' }
        }
      },
      {
        id: 'o2',
        title: 'Setze ein Release mit GitFlow um',
        guide: {
          intro: 'Ein Release-Branch friert den Funktionsumfang ein. Darauf wird nur noch stabilisiert und getestet.',
          steps: [
            'Feature fertig: `feature/*` per Merge Request in `develop` mergen.',
            'Release starten: `git switch develop`, `git switch -c release/1.2.0`. Versionsnummer im Projekt (z. B. Konstante, README, CHANGELOG) setzen.',
            'Auf dem Release-Branch nur Fehlerkorrekturen und Dokumentation – keine neuen Funktionen. FAT/Inbetriebnahmetests laufen auf diesem Stand.',
            'Abschluss: `release/1.2.0` mit `--no-ff` in `main` mergen, dort `git tag -a v1.2.0 -m "…"`, anschließend `release/1.2.0` auch in `develop` mergen, damit die Fixes nicht verloren gehen.',
            'Pushen: `git push origin main develop --tags` (im Simulator: einzeln `git push origin main`, `git push origin develop`, `git push --tags`).'
          ],
          code: { lang: 'bash', text: 'git switch develop\ngit switch -c release/1.2.0\n# … Version setzen, testen, fixen …\ngit switch main\ngit merge --no-ff release/1.2.0\ngit tag -a v1.2.0 -m "Release 1.2.0"\ngit switch develop\ngit merge --no-ff release/1.2.0' },
          done: 'Erledigt, wenn main getaggt ist und alle Release-Fixes auch in develop enthalten sind.',
          tip: 'Sourcetree und manche andere Clients haben eine eingebaute „Git-flow“-Funktion. In TortoiseGit und git bash setzt du die Schritte manuell um – das ist transparenter.',
          link: { label: 'B&R DevOps Package: Branching', url: 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_4_Branching/' }
        }
      },
      {
        id: 'o3',
        title: 'Liefere einen Hotfix für eine Maschine im Feld',
        guide: {
          intro: 'Ein Hotfix zweigt vom getaggten Stand auf main ab – nicht von develop.',
          steps: [
            '`git switch main`, `git pull`, `git switch -c hotfix/1.2.1`.',
            'Fehler minimal beheben, testen, committen (`fix: …`).',
            'In main mergen (`--no-ff`), Tag `v1.2.1` setzen.',
            'Hotfix auch in develop mergen (bzw. in einen laufenden release-Branch), sonst taucht der Fehler in 1.3.0 wieder auf.',
            'Ausgelieferte Version im Abnahme-/Serviceprotokoll der Maschine eintragen.'
          ],
          done: 'Erledigt, wenn der Fix in main (getaggt) und in develop enthalten ist.',
          tip: 'Wenn ein Kunde eine ältere Hauptversion behält (z. B. 1.x, während 2.x entwickelt wird), führe einen langlebigen Support-Branch `support/1.x` und tagge dort.',
          link: { label: 'Driessen: A successful Git branching model', url: 'https://nvie.com/posts/a-successful-git-branching-model/' }
        }
      },
      {
        id: 'o4',
        title: 'Schütze main und develop auf dem Server',
        guide: {
          intro: 'Regeln wirken nur, wenn der Server sie durchsetzt.',
          steps: [
            'In den Repository-Einstellungen auf git.breitner.de **Branch-Schutz** (Protected Branches) für `main` (und ggf. `develop`) aktivieren.',
            'Direkte Pushes verbieten, Merge nur über Merge Request mit mindestens einer Freigabe.',
            'Force-Push und Löschen der geschützten Branches verbieten.',
            'Optional: Merge nur, wenn die automatische Build-Pipeline (Automation Studio Build auf einem Build-Server) erfolgreich war.'
          ],
          done: 'Erledigt, wenn ein direkter `git push` auf main vom Server abgelehnt wird.',
          tip: 'Branch-Schutz ist auch ein Schutz vor dir selbst: Ein versehentlicher Push auf main am Freitagnachmittag ist damit ausgeschlossen.',
          link: { label: 'GitLab Docs: Protected branches', url: 'https://docs.gitlab.com/user/project/repository/branches/protected/' }
        }
      }
    ],
    videos: [
      { id: 'yFs7SzirMQs', title: 'Branch-Strategien für Git // deutsch', channel: 'the native web GmbH', lang: 'de', why: 'Deutschsprachiger Vergleich gängiger Branch-Strategien.' },
      { id: '1_as6UbNM50', title: 'Webcast E-Days: Übersicht zu Git Branching Strategien', channel: 'Noser Engineering AG', lang: 'de', why: 'Webcast eines Engineering-Dienstleisters mit Fokus auf Projekte im technischen Umfeld.' },
      { id: 'ApR_6y6PxYA', title: 'Git Branching: Trunk-Based Development', channel: 'ByteMonk', lang: 'en', why: 'Erklärt Trunk-Based Development und Feature-Flags anschaulich.' }
    ],
    readings: [
      {
        title: 'Git Branching – Branching-Workflows', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 20,
        url: 'https://git-scm.com/book/de/v2/Git-Branching-Branching-Workflows',
        why: 'Langlebige und Themen-Branches im Überblick.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Branching-Branching-Workflows'
      },
      {
        title: 'A successful Git branching model', author: 'Driessen, V.', institution: 'nvie.com',
        work: 'Blog', year: 2010, type: 'Artikel', minutes: 25,
        url: 'https://nvie.com/posts/a-successful-git-branching-model/',
        why: 'Originalbeschreibung von GitFlow inklusive der späteren Einordnung des Autors, wann GitFlow nicht passt.',
        apa: 'Driessen, V. (2010). *A successful Git branching model*. ' + ABGERUFEN + 'https://nvie.com/posts/a-successful-git-branching-model/'
      },
      {
        title: 'Branching', author: 'B&R Industrial Automation', institution: 'B&R Community (GitHub Pages)',
        work: 'B&R DevOps Package – Version Control', year: 2023, type: 'Hersteller', minutes: 10,
        url: 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_4_Branching/',
        why: 'Die Branch-Empfehlung aus dem B&R DevOps Package (GitFlow mit Rollen).',
        apa: 'B&R Industrial Automation. (2023). *Branching*. B&R DevOps Package. ' + ABGERUFEN + 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_4_Branching/'
      }
    ],
    quiz: [
      { type: 'single', q: 'Von welchem Branch zweigt in GitFlow ein Hotfix ab?', options: ['develop', 'main', 'feature/*', 'release/*'], correct: 1, explain: 'Der Hotfix basiert auf dem ausgelieferten Stand, also main.' },
      { type: 'single', q: 'Was ist auf einem release-Branch erlaubt?', options: ['Neue Funktionen', 'Nur Fehlerkorrekturen, Dokumentation und Versionsnummer', 'Nichts, er ist schreibgeschützt', 'Nur Merge-Commits'], correct: 1, explain: 'Der Release-Branch friert den Funktionsumfang ein und dient der Stabilisierung.' },
      { type: 'single', q: 'Was setzt Trunk-Based Development besonders voraus?', options: ['Sehr lange Feature-Branches', 'Häufige Integration und zuverlässige automatische Tests', 'Einen eigenen develop-Branch', 'Keine Code Reviews'], correct: 1, explain: 'Wer täglich in main integriert, braucht schnelles Feedback durch Build und Tests.' }
    ],
    exam: [
      { type: 'single', q: 'Warum muss ein Hotfix auch in develop gemergt werden?', options: ['Damit develop getaggt wird', 'Sonst fehlt der Fix in der nächsten Version und der Fehler kehrt zurück', 'Weil Git es erzwingt', 'Damit der Hotfix-Branch gelöscht werden kann'], correct: 1, explain: 'develop enthält die nächste Version; ohne Merge ginge der Fix dort verloren (Regression).' },
      { type: 'multi', q: 'Welche Einstellungen gehören zum Branch-Schutz von main?', options: ['Kein direkter Push', 'Merge nur per Merge Request mit Freigabe', 'Kein Force-Push', 'Jeder darf main löschen'], correct: [0, 1, 2], explain: 'Löschen und Überschreiben von main muss verhindert werden.' },
      { type: 'single', q: 'Ein Ein-Personen-Sondermaschinenprojekt mit einer Auslieferung. Welche Strategie ist meist angemessen?', options: ['GitFlow mit Support-Branches', 'GitHub Flow: main + kurze Feature-Branches, Releases als Tags', 'Kein Branching, alles direkt committen ohne Tags', 'Ein Repository pro Feature'], correct: 1, explain: 'Wenig Overhead, aber trotzdem Review-fähig und versioniert.' },
      { type: 'single', q: 'Ein Kunde behält Version 1.x, während 2.x entwickelt wird. Wie pflegst du 1.x weiter?', options: ['Gar nicht', 'Mit einem langlebigen Branch `support/1.x`, auf dem Fixes getaggt werden (1.4.1, 1.4.2 …)', 'Durch Zurücksetzen von main', 'Mit einem zweiten Repository ohne Historie'], correct: 1, explain: 'Support-Branches erlauben die parallele Pflege älterer Hauptversionen.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Feature und Release nach GitFlow',
        task: L(
          'Das Repository `etikettierer` soll künftig nach GitFlow geführt werden. Bisher gibt es nur `main`.',
          '',
          '1. Lege `develop` von `main` an und pushe ihn mit Upstream.',
          '2. Lege von `develop` aus `feature/rezeptwahl` an, committe `Logical/Recipe/Recipe.st` mit dem Inhalt `// Rezeptwahl über HMI` und merge das Feature mit `--no-ff` in `develop`.',
          '3. Starte `release/1.2.0` von `develop`, setze im `README.md` die Zeile `Version 1.2.0` (überschreiben) und committe.',
          '4. Merge `release/1.2.0` mit `--no-ff` in `main`, setze dort den annotierten Tag `v1.2.0` und merge den Release-Branch anschließend auch in `develop`.',
          '5. Pushe `main`, `develop` und die Tags.'
        ),
        hints: ['Wechseln, bevor du abzweigst: `git switch develop`, dann `git switch -c …`.', 'README überschreiben: `echo "Version 1.2.0" > README.md`.', 'Push: `git push origin main`, `git push origin develop`, `git push --tags`.'],
        setup: {
          cloned: true,
          remote: SERVER + 'etikettierer.git',
          files: Object.assign(asProject('Etikettierer'), { '.gitignore': GITIGNORE_AS, 'README.md': L('Version 1.1.0') }),
          commits: [],
          user: true
        },
        checks: [
          { type: 'remoteHasBranch', name: 'develop', msg: 'develop liegt nicht auf dem Server.' },
          { type: 'merged', from: 'feature/rezeptwahl', into: 'develop' },
          { type: 'merged', from: 'release/1.2.0', into: 'main' },
          { type: 'merged', from: 'release/1.2.0', into: 'develop', msg: 'Der Release-Branch muss auch zurück in develop.' },
          { type: 'fileContains', path: 'README.md', text: 'Version 1.2.0', branch: 'main' },
          { type: 'tagExists', name: 'v1.2.0' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'remoteInSync', branch: 'develop' },
          { type: 'clean' }
        ],
        solution: [
          'git switch -c develop',
          'git push -u origin develop',
          'git switch -c feature/rezeptwahl',
          'mkdir Logical/Recipe',
          'echo "// Rezeptwahl über HMI" > Logical/Recipe/Recipe.st',
          'git add .',
          'git commit -m "feat(rezept): Rezeptwahl über HMI"',
          'git switch develop',
          'git merge --no-ff feature/rezeptwahl',
          'git switch -c release/1.2.0',
          'echo "Version 1.2.0" > README.md',
          'git add README.md',
          'git commit -m "chore(release): Version 1.2.0"',
          'git switch main',
          'git merge --no-ff release/1.2.0',
          'git tag -a v1.2.0 -m "Release 1.2.0"',
          'git switch develop',
          'git merge --no-ff release/1.2.0',
          'git push origin main',
          'git push origin develop',
          'git push --tags'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Hotfix 1.2.1 für eine Maschine im Feld',
        task: L(
          'Auf `main` liegt der ausgelieferte Stand 1.2.0, auf `develop` wird bereits an 1.3.0 gearbeitet. Beim Kunden wird nach Not-Halt der Antrieb nicht sauber abgeschaltet.',
          '',
          '1. Lege von `main` den Branch `hotfix/1.2.1` an.',
          '2. Ergänze in `Logical/Main/Main.st` die Zeile `// fix: Antrieb bei Not-Halt sofort abschalten` und committe mit einer `fix`-Message.',
          '3. Merge den Hotfix mit `--no-ff` in `main` und setze den Tag `v1.2.1`.',
          '4. Merge den Hotfix auch in `develop`.',
          '5. Pushe `main`, `develop` und die Tags.'
        ),
        hints: ['Wichtig: Der Hotfix darf nichts aus develop enthalten – zweige von main ab.', 'Zum Schluss prüfen: `git log --oneline --graph --all`.'],
        setup: {
          cloned: true,
          remote: SERVER + 'etikettierer.git',
          files: Object.assign(asProject('Etikettierer'), { '.gitignore': GITIGNORE_AS, 'README.md': L('Version 1.2.0') }),
          commits: [],
          branches: {
            develop: [{ msg: 'feat(hmi): neue Bedienseite Formatwechsel', files: { 'Logical/HMI/Format.md': L('# Formatwechsel', 'Entwurf für 1.3.0') } }]
          },
          user: true
        },
        checks: [
          { type: 'branchExists', name: 'hotfix/1.2.1' },
          { type: 'lastCommitMsgMatches', branch: 'hotfix/1.2.1', pattern: '^fix(\\([^)]+\\))?: .+', msg: 'Der Hotfix-Commit braucht eine fix-Message.' },
          { type: 'merged', from: 'hotfix/1.2.1', into: 'main' },
          { type: 'merged', from: 'hotfix/1.2.1', into: 'develop', msg: 'Der Hotfix fehlt in develop.' },
          { type: 'tagExists', name: 'v1.2.1' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'remoteInSync', branch: 'develop' },
          { type: 'clean' }
        ],
        solution: [
          'git switch main',
          'git switch -c hotfix/1.2.1',
          'echo "// fix: Antrieb bei Not-Halt sofort abschalten" >> Logical/Main/Main.st',
          'git add Logical/Main/Main.st',
          'git commit -m "fix(antrieb): Antrieb bei Not-Halt sofort abschalten"',
          'git switch main',
          'git merge --no-ff hotfix/1.2.1',
          'git tag -a v1.2.1 -m "Hotfix 1.2.1: Not-Halt-Abschaltung"',
          'git switch develop',
          'git merge --no-ff hotfix/1.2.1',
          'git push origin main',
          'git push origin develop',
          'git push --tags'
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────────────────────── Level 3 · Modul 2
  {
    id: 'git-3-rueckgaengig',
    level: 3,
    kind: 'lektion',
    title: 'Änderungen zurücknehmen: restore, revert, reset, stash',
    summary: 'Du wählst je nach Situation das richtige Werkzeug, um Änderungen zu verwerfen, Commits rückgängig zu machen, Arbeit zu parken und die Historie aufzuräumen.',
    minutes: 150,
    req: ['git-2-projekt'],
    briefing: 'Fehler passieren: eine verkonfigurierte Datei, ein Commit mit falscher Logik, halbfertige Arbeit, die einem dringenden Fix im Weg steht. Git bietet dafür mehrere Werkzeuge, die sich deutlich unterscheiden. `restore` verwirft lokale Änderungen, `revert` erzeugt einen neuen Commit, der einen alten umkehrt (sicher für bereits gepushte Commits), `reset` verschiebt den Branch-Zeiger (nur für lokale, nicht gepushte Commits) und `stash` parkt Änderungen vorübergehend. Entscheidend ist eine Frage: Wurde der Commit schon gepusht?',
    practice: 'Nach einem Update läuft die Anlage mit zu hoher Bandgeschwindigkeit. Der verursachende Commit ist bereits auf dem Server und bei Kollegen. Mit `git revert` nimmst du ihn nachvollziehbar zurück, ohne die Historie anderer zu zerstören.',
    transfer: {
      tia: 'Im TIA Portal gibt es Undo im Editor und Projektarchive; einen gezielt rückgängig gemachten Stand mit Begründung in der Historie bietet erst eine Versionsverwaltung.',
      codesys: 'In Visual Studio/TwinCAT heißen die Funktionen „Revert“ (Commit rückgängig) und „Undo changes“ (lokal verwerfen) – dieselbe Unterscheidung wie revert und restore.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Verwerfe lokale Änderungen mit restore',
        guide: {
          intro: '`git restore` arbeitet nur auf Working Tree und Staging Area. Commits bleiben unberührt.',
          steps: [
            'Ungewollte Änderung in einer Datei verwerfen: `git restore Logical/Main/Main.st`. Achtung: Die Änderung ist danach unwiederbringlich weg.',
            'Datei aus der Staging Area nehmen, Änderung aber behalten: `git restore --staged Logical/Main/Main.st`.',
            'TortoiseGit: Rechtsklick › **TortoiseGit › Revert…** – trotz des Namens entspricht das `git restore` (lokale Änderungen verwerfen), nicht `git revert`!',
            'Prüfe danach mit `git status` und `git diff`.'
          ],
          code: { lang: 'bash', text: 'git restore --staged Logical/Main/Main.st\ngit restore Logical/Main/Main.st' },
          done: 'Erledigt, wenn du den Unterschied zwischen `restore` und `restore --staged` an einem Beispiel zeigen kannst.',
          tip: 'Typischer Fall in AS: Beim Öffnen hat Automation Studio eine Konfigurationsdatei automatisch umgeschrieben, ohne dass du etwas ändern wolltest. Mit `git diff` prüfen, mit `git restore` verwerfen.',
          link: { label: 'Pro Git: Ungewollte Änderungen rückgängig machen', url: 'https://git-scm.com/book/de/v2/Git-Grundlagen-Ungewollte-%c3%84nderungen-r%c3%bcckg%c3%a4ngig-machen' }
        }
      },
      {
        id: 'o2',
        title: 'Nimm gepushte Commits mit revert zurück',
        guide: {
          intro: '`git revert <commit>` erzeugt einen neuen Commit, der die Änderungen des angegebenen Commits umkehrt. Die Historie bleibt erhalten.',
          steps: [
            'Finde den Commit: `git log --oneline` und prüfe ihn mit `git show <hash>`.',
            'Kehre ihn um: `git revert <hash>` (oder `git revert HEAD` für den letzten Commit).',
            'Ergänze in der Message, warum zurückgenommen wurde (im echten Git öffnet sich dazu der Editor).',
            'Baue, teste, pushe.',
            'TortoiseGit: **Show log** › Rechtsklick auf den Commit › **Revert change by this commit**.'
          ],
          code: { lang: 'bash', text: 'git log --oneline\ngit show HEAD\ngit revert HEAD\ngit push' },
          done: 'Erledigt, wenn der Revert-Commit gepusht ist und die ursprüngliche Logik wieder gilt.',
          tip: 'Revert ist das Mittel der Wahl für alles, was schon auf dem Server ist. Andere haben den Commit bereits – ein Umschreiben der Historie würde ihre Repositorys durcheinanderbringen.',
          link: { label: 'TortoiseGit: Revert', url: 'https://tortoisegit.org/docs/tortoisegit/tgit-dug-revert.html' }
        }
      },
      {
        id: 'o3',
        title: 'Räume lokale Commits mit reset und amend auf',
        guide: {
          intro: '`git reset` verschiebt den Branch-Zeiger. Nur für Commits verwenden, die noch nicht gepusht sind.',
          steps: [
            '`git reset --soft HEAD~3`: Die letzten drei Commits werden aufgelöst, ihre Änderungen bleiben in der Staging Area. Mit einem neuen `git commit` fasst du sie zu einem sauberen Commit zusammen („squash“).',
            '`git reset --mixed HEAD~1` (Standard): Commit aufgelöst, Änderungen bleiben im Working Tree, aber nicht gestaged.',
            '`git reset --hard HEAD~1`: Commit UND Änderungen verworfen. Gefährlich.',
            '`git commit --amend` ändert nur den letzten Commit (Message oder vergessene Datei).',
            'TortoiseGit: **Show log** › Rechtsklick › **Reset "<branch>" to this…** mit Auswahl Soft/Mixed/Hard.'
          ],
          code: { lang: 'bash', text: 'git log --oneline -n 4\ngit reset --soft HEAD~3\ngit commit -m "feat(rezept): Rezeptverwaltung mit Speichern und Laden"' },
          done: 'Erledigt, wenn du drei „wip“-Commits lokal zu einem Commit mit sauberer Message zusammengefasst hast.',
          tip: 'Auch nach `reset --hard` sind Commits meist noch über `git reflog` auffindbar (echtes Git). Trotzdem: Vorher lieber einmal mehr `git status` lesen.',
          link: { label: 'Pro Git: Reset entzaubert', url: 'https://git-scm.com/book/de/v2/Git-Tools-Reset-entzaubert' }
        }
      },
      {
        id: 'o4',
        title: 'Parke Arbeit mit stash',
        guide: {
          intro: 'Mit `git stash` legst du uncommittete Änderungen beiseite, um sauber den Branch wechseln zu können.',
          steps: [
            '`git stash` speichert Änderungen an versionierten Dateien und setzt den Working Tree auf den letzten Commit zurück.',
            'Branch wechseln, dringenden Fix erledigen, zurückwechseln.',
            '`git stash list` zeigt geparkte Stände, `git stash pop` holt den letzten zurück und entfernt ihn aus der Liste.',
            'TortoiseGit: Rechtsklick › **TortoiseGit › Stash Save** bzw. **Stash Pop**.'
          ],
          code: { lang: 'bash', text: 'git stash\ngit switch main\n# … Fix …\ngit switch feature/rezept\ngit stash pop' },
          done: 'Erledigt, wenn du halbfertige Arbeit geparkt, einen Fix auf main committet und deine Arbeit danach fortgesetzt hast.',
          tip: 'Ein Stash ist kein Backup und wird nicht gepusht. Für längere Unterbrechungen lieber einen WIP-Commit auf dem Feature-Branch machen und später aufräumen.',
          link: { label: 'Pro Git: Stashen und Bereinigen', url: 'https://git-scm.com/book/de/v2/Git-Tools-Stashen-und-Bereinigen' }
        }
      }
    ],
    videos: [
      { id: '0D738Me-fo8', title: 'Undo mistakes in Git: restore, reset, revert, clean (Git, explained #6)', channel: 'Lauro Guedes', lang: 'en', why: 'Stellt restore, reset und revert systematisch gegenüber.' },
      { id: 'ch-VjQW6tsg', title: 'Git Crashkurs [004] - reset --hard', channel: 'Brotcrunsher', lang: 'de', why: 'Zeigt auf Deutsch, was `reset --hard` bewirkt und warum Vorsicht nötig ist.' },
      { id: '5rSaU-cj_J0', title: 'Git Crashkurs [009] - git stash', channel: 'Brotcrunsher', lang: 'de', why: 'Kurze deutschsprachige Demonstration von stash und stash pop.' }
    ],
    readings: [
      {
        title: 'Versionsverwaltung mit git (Übungsfolien, Abschnitte reset/stash)', author: 'Schmaus, F. & Schuster, S.', institution: 'Friedrich-Alexander-Universität Erlangen-Nürnberg, Lehrstuhl Informatik 4',
        work: 'Übungen zur Vorlesung Verlässliche Echtzeitsysteme', year: 2018, type: 'Uni-Skript', minutes: 20,
        url: 'https://rdsp.cs.fau.de/Lehre/SS18/V_VEZS/Uebung/Folien/02_Git.pdf',
        why: 'Die Folien behandeln reset, stash und rebase mit Grafiken.',
        apa: 'Schmaus, F., & Schuster, S. (2018). *Git – Übungen zur Vorlesung Verlässliche Echtzeitsysteme*. Friedrich-Alexander-Universität Erlangen-Nürnberg. ' + ABGERUFEN + 'https://rdsp.cs.fau.de/Lehre/SS18/V_VEZS/Uebung/Folien/02_Git.pdf'
      },
      {
        title: 'Git Tools – Reset entzaubert', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 30,
        url: 'https://git-scm.com/book/de/v2/Git-Tools-Reset-entzaubert',
        why: 'Erklärt reset --soft/--mixed/--hard anhand der drei Bäume HEAD, Index und Working Tree.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-Tools-Reset-entzaubert'
      },
      {
        title: 'Änderungen rückgängig machen', author: 'Atlassian', institution: 'Atlassian',
        work: 'Git-Tutorials', year: 2024, type: 'Artikel', minutes: 20,
        url: 'https://www.atlassian.com/de/git/tutorials/undoing-changes',
        why: 'Übersicht auf Deutsch, welches Werkzeug in welcher Situation passt.',
        apa: 'Atlassian. (2024). *Änderungen rückgängig machen*. ' + ABGERUFEN + 'https://www.atlassian.com/de/git/tutorials/undoing-changes'
      }
    ],
    quiz: [
      { type: 'single', q: 'Ein fehlerhafter Commit ist bereits gepusht und von Kollegen gepullt. Was verwendest du?', options: ['git reset --hard HEAD~1 und push --force', 'git revert <hash>', 'git restore', 'git stash'], correct: 1, explain: 'Revert erzeugt einen neuen Commit und lässt die gemeinsame Historie intakt.' },
      { type: 'single', q: 'Was macht „TortoiseGit › Revert…“ im Explorer-Kontextmenü?', options: ['Es erzeugt einen Revert-Commit', 'Es verwirft lokale, uncommittete Änderungen (wie git restore)', 'Es setzt den Branch zurück', 'Es löscht den Branch'], correct: 1, explain: 'Der Name stammt aus der SVN-Tradition. Den Revert-Commit findest du im Log-Dialog unter „Revert change by this commit“.' },
      { type: 'single', q: 'Was bewirkt `git reset --soft HEAD~2`?', options: ['Löscht die letzten zwei Commits samt Änderungen', 'Löst die letzten zwei Commits auf, ihre Änderungen bleiben gestaged', 'Erzeugt zwei Revert-Commits', 'Pusht zwei Commits'], correct: 1, explain: '`--soft` verschiebt nur den Branch-Zeiger; Index und Working Tree bleiben.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Aussagen zu `git stash` sind richtig?', options: ['Ein Stash wird nicht gepusht', '`git stash pop` holt den letzten Stash zurück', 'Ein Stash ersetzt ein Backup auf dem Server', '`git stash list` zeigt geparkte Stände'], correct: [0, 1, 3], explain: 'Stashes liegen nur lokal und sind kein Backup.' },
      { type: 'single', q: 'Du hast in deinem letzten (nicht gepushten) Commit eine Datei vergessen. Was ist am saubersten?', options: ['Neuen Commit „vergessen“', 'Datei adden und `git commit --amend`', 'git revert HEAD', 'Repository neu klonen'], correct: 1, explain: 'Amend ergänzt den letzten Commit, solange er nur lokal ist.' },
      { type: 'single', q: 'Warum ist `git reset` auf bereits gepushte Commits problematisch?', options: ['Es funktioniert technisch nicht', 'Du müsstest mit --force pushen und würdest die Historie anderer umschreiben', 'Es löscht den Server', 'Es entfernt alle Tags'], correct: 1, explain: 'Andere bauen auf den Commits auf. Umgeschriebene Historie führt zu doppelten Commits und Verwirrung.' },
      { type: 'single', q: 'Welche Option von `git restore` nimmt eine Datei nur aus der Staging Area, ohne die Änderung zu verwerfen?', options: ['--hard', '--staged', '--soft', '--cached-only'], correct: 1, explain: '`git restore --staged <datei>` ist das Gegenstück zu `git add`.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Falsche Bandgeschwindigkeit zurücknehmen',
        task: L(
          'Der letzte Commit auf `main` (`feat: Bandgeschwindigkeit erhöht`) ist bereits gepusht und hat `nSpeedMax` in `Logical/Main/Param.st` von 1500 auf 3000 gesetzt. Die Mechanik verträgt das nicht.',
          '',
          '1. Ändere zunächst testweise `Logical/Main/Main.st` (z. B. `echo "// Test" >> Logical/Main/Main.st`) und verwirf diese lokale Änderung wieder mit `git restore`.',
          '2. Sieh dir den letzten Commit mit `git show` an.',
          '3. Nimm ihn mit `git revert` zurück – ohne die Historie umzuschreiben.',
          '4. Pushe das Ergebnis.'
        ),
        hints: ['`git restore <datei>` verwirft lokale Änderungen.', '`git revert HEAD` kehrt den letzten Commit um.', 'Kein `reset` – der Commit ist schon auf dem Server!'],
        setup: {
          cloned: true,
          remote: SERVER + 'foerderband.git',
          files: Object.assign(asProject('Foerderband'), { '.gitignore': GITIGNORE_AS, 'Logical/Main/Param.st': L('// Parameter Förderband', 'nSpeedMax := 1500; // U/min') }),
          commits: [{ msg: 'feat: Bandgeschwindigkeit erhöht', files: { 'Logical/Main/Param.st': L('// Parameter Förderband', 'nSpeedMax := 3000; // U/min') } }],
          user: true
        },
        checks: [
          { type: 'commandUsed', pattern: '^git restore ', msg: 'Verwirf die Teständerung mit `git restore`.' },
          { type: 'commandUsed', pattern: '^git revert ', msg: 'Nutze `git revert`.' },
          { type: 'fileContains', path: 'Logical/Main/Param.st', text: 'nSpeedMax := 1500', branch: 'main', msg: 'Der alte Wert 1500 ist nicht wiederhergestellt.' },
          { type: 'commitCountMin', branch: 'main', n: 3, msg: 'Revert erzeugt einen neuen Commit – die Historie darf nicht kürzer werden.' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'echo "// Test" >> Logical/Main/Main.st',
          'git status',
          'git restore Logical/Main/Main.st',
          'git log --oneline',
          'git show HEAD',
          'git revert HEAD',
          'git push'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Arbeit parken, Fix einschieben, Historie aufräumen',
        task: L(
          'Du arbeitest auf `feature/rezept`. Dort liegen drei lokale Commits `wip 1`, `wip 2`, `wip 3` (nicht gepusht). Gerade änderst du `Logical/Recipe/Save.st` – da kommt ein dringender Fix für `main`.',
          '',
          '1. Wechsle auf `feature/rezept` und simuliere die laufende Arbeit: `echo "// Speichern im CSV-Format" >> Logical/Recipe/Save.st`.',
          '2. Parke die Änderung mit `git stash`, wechsle auf `main`, ergänze in `Logical/Main/Main.st` die Zeile `// fix: Zähler bei Reset auf 0` und committe (`fix…`).',
          '3. Wechsle zurück auf `feature/rezept` und hole die Arbeit mit `git stash pop` zurück.',
          '4. Fasse die drei wip-Commits und deine aktuelle Änderung mit `git reset --soft HEAD~3` und einem neuen Commit zusammen. Message: `feat(rezept): …`.'
        ),
        hints: ['Nach `git stash` ist der Working Tree sauber und du kannst wechseln.', 'Nach `git reset --soft HEAD~3` alles mit `git add .` vormerken und committen.'],
        setup: {
          cloned: true,
          remote: SERVER + 'abfuellung.git',
          files: Object.assign(asProject('Abfuellung'), { '.gitignore': GITIGNORE_AS, 'Logical/Recipe/Save.st': L('// Rezept speichern') }),
          commits: [],
          branches: {
            'feature/rezept': [
              { msg: 'wip 1', files: { 'Logical/Recipe/Recipe.st': L('// Rezeptstruktur') } },
              { msg: 'wip 2', files: { 'Logical/Recipe/Recipe.st': L('// Rezeptstruktur', '// Laden') } },
              { msg: 'wip 3', files: { 'Logical/Recipe/Recipe.st': L('// Rezeptstruktur', '// Laden', '// Prüfen') } }
            ]
          },
          user: true
        },
        checks: [
          { type: 'commandUsed', pattern: '^git stash$', msg: 'Parke die Arbeit mit `git stash`.' },
          { type: 'commandUsed', pattern: '^git stash pop', msg: 'Hole sie mit `git stash pop` zurück.' },
          { type: 'commandUsed', pattern: '^git reset --soft ', msg: 'Fasse die Commits mit `git reset --soft` zusammen.' },
          { type: 'fileContains', path: 'Logical/Main/Main.st', text: 'Zähler bei Reset', branch: 'main', msg: 'Der Fix fehlt auf main.' },
          { type: 'fileContains', path: 'Logical/Recipe/Save.st', text: 'CSV-Format', branch: 'feature/rezept', msg: 'Deine geparkte Arbeit ist nicht im neuen Commit.' },
          { type: 'fileContains', path: 'Logical/Recipe/Recipe.st', text: 'Prüfen', branch: 'feature/rezept', msg: 'Die Änderungen der wip-Commits sind verloren gegangen.' },
          { type: 'lastCommitMsgMatches', branch: 'feature/rezept', pattern: '^feat\\(rezept\\): .+' },
          { type: 'clean' }
        ],
        solution: [
          'git switch feature/rezept',
          'echo "// Speichern im CSV-Format" >> Logical/Recipe/Save.st',
          'git stash',
          'git switch main',
          'echo "// fix: Zähler bei Reset auf 0" >> Logical/Main/Main.st',
          'git add Logical/Main/Main.st',
          'git commit -m "fix(zaehler): Zähler bei Reset auf 0 setzen"',
          'git switch feature/rezept',
          'git stash pop',
          'git reset --soft HEAD~3',
          'git add .',
          'git commit -m "feat(rezept): Rezeptstruktur mit Laden, Prüfen und Speichern"',
          'git log --oneline -n 3'
        ]
      }
    ],
    proof: false
  },

  // ───────────────────────────────────────────── Level 3 · Projekt
  {
    id: 'git-3-projekt',
    level: 3,
    kind: 'projekt',
    title: 'Praxisprojekt: Teamarbeit an einem AS6-Projekt',
    summary: 'Ihr arbeitet zu zweit an einem AS6-Projekt, löst Konflikte in .pkg- und .sw-Dateien, behandelt generierte und binäre Dateien richtig und dokumentiert eure Teamregeln.',
    minutes: 300,
    req: ['git-3-strategien', 'git-3-rueckgaengig'],
    briefing: 'In einem AS6-Projekt sind nicht nur .st-Dateien betroffen. Fügt jemand ein Programm hinzu, ändert Automation Studio die `Package.pkg` (XML-Liste der Objekte) und die `Cpu.sw` (Zuordnung zu Task-Klassen). Wird ein Modul in der Hardware-Konfiguration ergänzt, ändern sich `Hardware.hw` und weitere Physical-Dateien. Arbeiten zwei Personen gleichzeitig daran, entstehen Konflikte in XML-Dateien, die sorgfältig gelöst werden müssen. Dazu kommen binäre oder generierte Dateien (z. B. Teile von mapp Safety, Bilder, Firmware), die Git nicht zeilenweise mergen kann. In diesem Projekt erarbeitet ihr ein Teamvorgehen und setzt es praktisch um.',
    practice: 'Zwei Entwickler ergänzen am selben Tag je ein neues Programm und ordnen es Cyclic#1 zu. Beim Merge entsteht ein Konflikt in Package.pkg und Cpu.sw. Wer hier eine Seite blind übernimmt, hat ein Programm, das zwar im Ordner liegt, aber nie auf der Steuerung läuft.',
    transfer: {
      tia: 'Im TIA Portal Multiuser Engineering werden Objekte beim Bearbeiten markiert/reserviert, um Konflikte zu vermeiden. Mit Git ersetzt eine Absprache („wer ändert die Hardware?“) diese Reservierung.',
      codesys: 'In TwinCAT entstehen vergleichbare Konflikte in der .tsproj- bzw. .plcproj-Datei, wenn zwei Personen Objekte hinzufügen. Auch dort gilt: XML-Einträge beider Seiten übernehmen.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Löse Konflikte in Package.pkg und Cpu.sw',
        guide: {
          intro: 'Konflikte in .pkg- und .sw-Dateien sind meist „beide haben etwas hinzugefügt“. Die Lösung ist fast immer: beide Einträge behalten.',
          steps: [
            'Nach `git merge` zeigt `git status` z. B. `both modified: Logical/Package.pkg`.',
            'Öffne die Datei in einem Texteditor (nicht in Automation Studio) und übernimm die `<Object …>`-Zeilen beider Seiten innerhalb von `<Objects>`.',
            'Achte auf gültiges XML: jede Zeile vollständig, keine doppelten Einträge, keine Marker.',
            'Genauso in `Cpu.sw`: beide `<Task …>`-Einträge in der richtigen Task-Klasse.',
            'Projekt in Automation Studio öffnen, **Project › Rebuild** (bzw. Rebuild All) und prüfen, dass beide Programme in der Software-Konfiguration erscheinen und auf dem Target laufen.'
          ],
          code: { lang: 'text', text: '<Objects>\n  <Object Type="Program">Main</Object>\n  <Object Type="Program">Counter</Object>\n  <Object Type="Program">Lamp</Object>\n</Objects>' },
          done: 'Erledigt, wenn nach dem Merge beide Programme in Logical View und Software-Konfiguration sichtbar sind und das Projekt fehlerfrei baut.',
          tip: 'Lege neue Programme in eigenen Packages (Ordnern) an. Dann ändert sich nur die .pkg des eigenen Ordners plus ein Eintrag in der übergeordneten .pkg – weniger Konfliktfläche.',
          link: { label: 'B&R DevOps Package: Resolving Merge Conflicts', url: 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_5_ResolvingMergeConflicts/' }
        }
      },
      {
        id: 'o2',
        title: 'Behandle generierte und binäre Dateien richtig',
        guide: {
          intro: 'Nicht jede Datei im Projekt ist Text, und nicht jede Datei gehört ins Repository.',
          steps: [
            'Generiert (Temp/, Binaries/, Diagnosis/, *.isopen, Benutzer-.set): ignorieren.',
            'Binär, aber Teil des Projekts (z. B. Bilder für mapp View, bestimmte Dateien eines mapp Safety-Projekts): versionieren, aber nie parallel ändern. Bei Konflikt eine Seite komplett wählen und die Änderung der anderen Seite neu durchführen.',
            'Für mapp Safety beachten: Laut B&R Community bestimmte Dateien im CPU-Ordner ausschließen, Safety-`.set`-Dateien und DLFiles aber versionieren.',
            'Zeilenenden: `.gitattributes` mit `* -text` verhindert, dass Git Zeilenenden in Hardware-, Safety- oder Firmware-Dateien verändert (Empfehlung aus der B&R Community).',
            'Große Binärdateien (Handbücher, Videos): nicht ins Projekt-Repository, oder Git LFS verwenden, wenn der Server es unterstützt.'
          ],
          code: { lang: 'text', text: '# .gitattributes neben der .apj\n* -text' },
          done: 'Erledigt, wenn euer Repository eine geprüfte .gitignore und .gitattributes enthält und keine generierten Dateien mehr auftauchen.',
          tip: 'Prüfe nach dem ersten Öffnen und Bauen eines frisch geklonten Projekts mit `git status`, welche Dateien Automation Studio selbst verändert. Das zeigt dir, was noch in die .gitignore gehört oder bewusst versioniert werden muss.',
          link: { label: 'Pro Git: Git-Attribute', url: 'https://git-scm.com/book/de/v2/Git-einrichten-Git-Attribute' }
        }
      },
      {
        id: 'o3',
        title: 'Vereinbare Teamregeln für Physical View und Hardware',
        guide: {
          intro: 'Viele Konflikte verhindert man organisatorisch, nicht technisch.',
          steps: [
            'Eine Person ist für Hardware-Konfiguration (Hardware.hw, Modul-Konfigurationen) zuständig; Änderungen daran werden angekündigt und schnell gemergt.',
            'Neue Programme in eigenen Packages anlegen, Task-Zuordnung in Cpu.sw in einem eigenen, kleinen Commit.',
            'Vor jedem Arbeitstag `git pull` auf develop/main, Feature-Branches maximal wenige Tage alt.',
            'Visualisierungsdateien, die sich schlecht mergen lassen (z. B. VC4-Visualisierungen), nur von einer Person gleichzeitig bearbeiten.',
            'Regeln in einer Datei `CONTRIBUTING.md` im Repository festhalten.'
          ],
          done: 'Erledigt, wenn eure CONTRIBUTING.md im Repository liegt und beide Teammitglieder danach arbeiten.',
          tip: 'Die B&R Community empfiehlt, `.git` in den CPU-Build-Einstellungen bei den Objekten einzutragen, die für die Build-Warnungen 9232/9233 ignoriert werden – sonst warnt AS wegen des .git-Ordners.',
          link: { label: 'B&R DevOps Package: AS Project Settings', url: 'https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl_10_ASProjectSettings/' }
        }
      },
      {
        id: 'o4',
        title: 'Reiche euer Team-Repository ein',
        guide: {
          intro: 'Nachweis ist ein gemeinsames Repository auf git.breitner.de mit sichtbarer Zusammenarbeit.',
          steps: [
            'Im Repository sichtbar: mindestens zwei Merge Requests mit Review-Kommentaren, ein gelöster Konflikt in einer .pkg- oder .sw-Datei, ein Release-Tag.',
            '.gitignore, .gitattributes und CONTRIBUTING.md vorhanden.',
            'Das Projekt baut nach frischem Klonen ohne Nacharbeit (von der zweiten Person geprüft).',
            'Link zum Repository im Nachweisfeld eintragen.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist und der Ausbilder das Repository öffnen kann.',
          tip: 'Ein frischer Klon in einen neuen Ordner ist der beste Test, ob wirklich alles Nötige versioniert ist.'
        }
      }
    ],
    videos: [
      { id: 'FoODGUlAV_s', title: 'Git im Team // deutsch', channel: 'the native web GmbH', lang: 'de', why: 'Deutschsprachiger Überblick über Zusammenarbeit mit Git im Team.' },
      { id: '1g6eYnlzKtA', title: 'PLC programming using TwinCAT 3 - Version control (Part 13/18)', channel: 'Jakob Sagatowski', lang: 'en', why: 'Zeigt Versionsverwaltung an einem echten SPS-Projekt inklusive projektspezifischer Dateien.' },
      { id: '1rG4Sc14scg', title: 'Understanding the Challenges of Version Control for PLC and HMI', channel: 'Vlad Romanov', lang: 'en', why: 'Erklärt, warum SPS- und HMI-Projekte besondere Anforderungen an Versionsverwaltung stellen.' }
    ],
    readings: [
      {
        title: 'How do you structure your Git repository?', author: 'B&R Community', institution: 'B&R Community',
        work: 'B&R Community Forum', year: 2025, type: 'Hersteller', minutes: 10,
        url: 'https://community.br-automation.com/t/how-do-you-structure-your-git-repository/6492',
        why: 'Erfahrungen anderer AS-Teams zur Repository-Struktur.',
        apa: 'B&R Community. (2025). *How do you structure your Git repository?* ' + ABGERUFEN + 'https://community.br-automation.com/t/how-do-you-structure-your-git-repository/6492'
      },
      {
        title: '.gitignore file for AS projects (inkl. mapp Safety und .gitattributes)', author: 'Krausert, M. et al.', institution: 'B&R Community',
        work: 'B&R Community Forum', year: 2024, type: 'Hersteller', minutes: 15,
        url: 'https://community.br-automation.com/t/gitignore-file-for-as-projects/3714',
        why: 'Enthält die Hinweise von B&R-Mitarbeitern zu Safety-Dateien und Zeilenenden.',
        apa: 'Krausert, M. et al. (2024). *.gitignore file for AS projects*. B&R Community. ' + ABGERUFEN + 'https://community.br-automation.com/t/gitignore-file-for-as-projects/3714'
      },
      {
        title: 'Git einrichten – Git-Attribute', author: 'Chacon, S. & Straub, B.', institution: 'git-scm.com',
        work: 'Pro Git (2. Auflage, deutsche Übersetzung)', year: 2014, type: 'Fachbuch', minutes: 20,
        url: 'https://git-scm.com/book/de/v2/Git-einrichten-Git-Attribute',
        why: 'Erklärt .gitattributes für Binärdateien, Zeilenenden und Merge-Strategien.',
        apa: 'Chacon, S., & Straub, B. (2014). *Pro Git* (2. Aufl.). Apress. ' + ABGERUFEN + 'https://git-scm.com/book/de/v2/Git-einrichten-Git-Attribute'
      }
    ],
    quiz: [
      { type: 'single', q: 'Beide Seiten haben in `Package.pkg` ein neues Programm ergänzt. Wie löst du den Konflikt?', options: ['Eigene Seite übernehmen', 'Fremde Seite übernehmen', 'Beide `<Object>`-Einträge behalten, Marker entfernen, neu bauen', 'Package.pkg löschen, AS erzeugt sie neu'], correct: 2, explain: 'Beide Programme sollen existieren. Nach dem Lösen prüft ein Rebuild, ob das XML gültig ist.' },
      { type: 'single', q: 'Wozu dient `* -text` in der `.gitattributes`?', options: ['Alle Dateien werden ignoriert', 'Git wandelt keine Zeilenenden um', 'Alle Dateien werden als Binär-LFS gespeichert', 'Textdateien werden verschlüsselt'], correct: 1, explain: 'Damit bleiben Dateien exakt so, wie Automation Studio sie geschrieben hat.' },
      { type: 'single', q: 'Was ist bei einem Konflikt in einer binären Datei (z. B. Bild) richtig?', options: ['Konfliktmarker manuell einfügen', 'Eine Seite komplett wählen und die andere Änderung neu durchführen', 'Die Datei in Temp/ verschieben', 'Mit `--force` pushen'], correct: 1, explain: 'Binärdateien lassen sich nicht zeilenweise mergen.' }
    ],
    exam: [
      { type: 'multi', q: 'Welche Dateien ändert Automation Studio typischerweise, wenn du ein neues Programm anlegst und einer Task-Klasse zuordnest?', options: ['Die .pkg-Datei des Ordners', 'Cpu.sw', 'Hardware.hw', 'Die .st-Datei des neuen Programms'], correct: [0, 1, 3], explain: 'Hardware.hw ändert sich nur bei Hardwareänderungen.' },
      { type: 'single', q: 'Wie verhinderst du organisatorisch Konflikte in der Hardware-Konfiguration?', options: ['Jeder ändert die Hardware, wann er will', 'Eine verantwortliche Person, Änderungen angekündigt und schnell gemergt', 'Hardware.hw in die .gitignore', 'Hardware nur auf main ändern ohne Review'], correct: 1, explain: 'Hardware.hw gehört zum Projekt und darf nicht ignoriert werden.' },
      { type: 'single', q: 'Wie prüfst du, ob dein Repository vollständig ist?', options: ['Durch Blick auf die Dateigröße', 'Frisch in einen neuen Ordner klonen, öffnen und bauen', 'Durch `git log`', 'Durch Löschen von .git'], correct: 1, explain: 'Fehlt etwas, scheitert der Build im frischen Klon.' },
      { type: 'single', q: 'Was sollte mit dem `.git`-Ordner in den Build-Einstellungen der CPU laut B&R DevOps Package geschehen?', options: ['Er wird in Binaries/ kopiert', 'Er wird bei den Objekten eingetragen, die für Build-Warnungen 9232/9233 ignoriert werden', 'Er wird auf die Steuerung übertragen', 'Nichts, AS kennt Git nativ'], correct: 1, explain: 'So meldet AS keine Warnungen für Dateien, die nicht zum Projekt gehören.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'git', title: 'Konflikt in Package.pkg lösen',
        task: L(
          'Auf `main` wurde das Programm `Counter` ergänzt, auf `feature/meldeleuchte` das Programm `Lamp`. Beide haben dafür die `Logical/Package.pkg` an derselben Stelle geändert.',
          '',
          '1. Merge `feature/meldeleuchte` in `main`.',
          '2. Löse den Konflikt in `Logical/Package.pkg`, sodass alle drei Programme enthalten sind. Hinweis: In dieser Übung verwendet die Datei einfache Anführungszeichen in den XML-Attributen (gültiges XML), damit du sie per `echo "…"` schreiben kannst:',
          '',
          '```',
          '<?xml version=\'1.0\' encoding=\'utf-8\'?>',
          '<Package>',
          '  <Objects>',
          '    <Object Type=\'Program\'>Main</Object>',
          '    <Object Type=\'Program\'>Counter</Object>',
          '    <Object Type=\'Program\'>Lamp</Object>',
          '  </Objects>',
          '</Package>',
          '```',
          '',
          '3. Schließe den Merge ab und pushe `main`.'
        ),
        hints: ['`cat Logical/Package.pkg` zeigt die Konfliktmarker.', 'Datei zeilenweise mit `echo "…" > …` und `echo "…" >> …` neu schreiben oder `edit` verwenden.', 'Im echten Projekt danach in AS öffnen und Rebuild ausführen.'],
        setup: {
          cloned: true,
          remote: SERVER + 'sortieranlage.git',
          files: Object.assign(asProject('Sortieranlage'), { '.gitignore': GITIGNORE_AS, 'Logical/Package.pkg': pkg('Main') }),
          commits: [{ msg: 'feat(zaehler): Programm Counter hinzugefügt', files: { 'Logical/Package.pkg': pkg('Main', 'Counter'), 'Logical/Counter/Counter.st': L('// Teilezähler') } }],
          branches: {
            'feature/meldeleuchte': [{ msg: 'feat(lamp): Programm Lamp hinzugefügt', files: { 'Logical/Package.pkg': pkg('Main', 'Lamp'), 'Logical/Lamp/Lamp.st': L('// Meldeleuchte') } }]
          },
          user: true
        },
        checks: [
          { type: 'merged', from: 'feature/meldeleuchte', into: 'main' },
          { type: 'noConflictMarkers' },
          { type: 'fileContains', path: 'Logical/Package.pkg', text: '>Counter</Object>', branch: 'main', msg: 'Counter fehlt in Package.pkg.' },
          { type: 'fileContains', path: 'Logical/Package.pkg', text: '>Lamp</Object>', branch: 'main', msg: 'Lamp fehlt in Package.pkg.' },
          { type: 'fileContains', path: 'Logical/Package.pkg', text: '>Main</Object>', branch: 'main', msg: 'Main fehlt in Package.pkg.' },
          { type: 'fileContains', path: 'Logical/Package.pkg', text: '</Package>', branch: 'main', msg: 'Package.pkg ist kein vollständiges XML mehr.' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'git merge feature/meldeleuchte',
          'git status',
          'cat Logical/Package.pkg',
          'echo "<?xml version=\'1.0\' encoding=\'utf-8\'?>" > Logical/Package.pkg',
          'echo "<Package>" >> Logical/Package.pkg',
          'echo "  <Objects>" >> Logical/Package.pkg',
          'echo "    <Object Type=\'Program\'>Main</Object>" >> Logical/Package.pkg',
          'echo "    <Object Type=\'Program\'>Counter</Object>" >> Logical/Package.pkg',
          'echo "    <Object Type=\'Program\'>Lamp</Object>" >> Logical/Package.pkg',
          'echo "  </Objects>" >> Logical/Package.pkg',
          'echo "</Package>" >> Logical/Package.pkg',
          'git add Logical/Package.pkg',
          'git commit -m "merge: Programme Counter und Lamp zusammengeführt"',
          'git push'
        ]
      },
      {
        id: 'ex2', type: 'git', title: 'Teamregeln und Dateiattribute im Repository verankern',
        task: L(
          'Im Team-Repository `sortieranlage` sollen die vereinbarten Regeln versioniert werden. Arbeite auf einem Branch `chore/teamregeln`.',
          '',
          '1. Lege eine `.gitattributes` mit dem Inhalt `* -text` an.',
          '2. Ergänze die `.gitignore` um `/AS/System/` (laut B&R Community nicht Teil des Projekts).',
          '3. Lege `CONTRIBUTING.md` an. Sie muss mindestens die Zeile `Hardware.hw ändert nur die verantwortliche Person` enthalten.',
          '4. Committe alles (`chore…` oder `docs…`), pushe den Branch mit Upstream und merge ihn danach mit `--no-ff` in `main` (stellvertretend für den freigegebenen Merge Request). Pushe `main`.'
        ),
        hints: ['Drei Dateien, gerne ein Commit pro Thema.', '`git push -u origin chore/teamregeln`'],
        setup: {
          cloned: true,
          remote: SERVER + 'sortieranlage.git',
          files: Object.assign(asProject('Sortieranlage'), { '.gitignore': GITIGNORE_AS }),
          commits: [],
          user: true
        },
        checks: [
          { type: 'fileContains', path: '.gitattributes', text: '* -text', branch: 'main' },
          { type: 'fileContains', path: '.gitignore', text: '/AS/System/', branch: 'main' },
          { type: 'fileContains', path: 'CONTRIBUTING.md', text: 'Hardware.hw ändert nur die verantwortliche Person', branch: 'main' },
          { type: 'remoteHasBranch', name: 'chore/teamregeln' },
          { type: 'merged', from: 'chore/teamregeln', into: 'main' },
          { type: 'lastCommitMsgMatches', branch: 'chore/teamregeln', pattern: '^(chore|docs)(\\([^)]+\\))?: .+' },
          { type: 'remoteInSync', branch: 'main' },
          { type: 'clean' }
        ],
        solution: [
          'git switch -c chore/teamregeln',
          'echo "* -text" > .gitattributes',
          'echo "/AS/System/" >> .gitignore',
          'git add .',
          'git commit -m "chore: Zeilenenden fixieren und AS/System ignorieren"',
          'echo "# Teamregeln" > CONTRIBUTING.md',
          'echo "Hardware.hw ändert nur die verantwortliche Person" >> CONTRIBUTING.md',
          'echo "Neue Programme in eigenen Packages anlegen" >> CONTRIBUTING.md',
          'git add CONTRIBUTING.md',
          'git commit -m "docs: Teamregeln für das AS6-Projekt"',
          'git push -u origin chore/teamregeln',
          'git switch main',
          'git merge --no-ff chore/teamregeln',
          'git push'
        ]
      }
    ],
    proof: true,
    badge: 'Team-Integrator'
  }
];
