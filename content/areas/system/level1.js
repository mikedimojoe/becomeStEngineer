// Bereich "system" – Level 1 (Grundkurs → Prüfung Junior)
'use strict';
const { v } = require('./videos');
const { r } = require('./readings');

module.exports = [
  // ---------------------------------------------------------------------------
  {
    id: 'system-1-installation',
    level: 1,
    kind: 'lektion',
    title: 'Automation Studio 6 installieren, Upgrades und Versionen',
    summary: 'Du installierst AS6, verwaltest Upgrades und Technology Packages und öffnest ein bestehendes Projekt ohne Versionschaos.',
    minutes: 120,
    req: [],
    briefing: 'Bevor du eine einzige Zeile ST schreibst, muss deine Engineering-Umgebung stimmen: Automation Studio 6, die passende Automation Runtime (AR) und die Technology Packages (z. B. mapp Services, mapp View, mapp Motion) in den Versionen, die das Projekt verlangt. In AS6 sind diese Bestandteile versionsunabhängig voneinander installierbar ("Version Freedom"). Das ist flexibel, verlangt aber Disziplin: Ein Projekt merkt sich, mit welchen Versionen es gebaut wurde, und meldet beim Öffnen Abweichungen. Du lernst, Upgrades gezielt zu installieren, Versionskonflikte zu lesen und bewusst zu entscheiden, ob du aktualisierst oder nicht.',
    practice: 'Bei jeder Inbetriebnahme und jedem Service-Einsatz öffnest du fremde Projekte. Wer dabei unbedacht Runtime- oder mapp-Versionen hochzieht, liefert der Maschine ungewollt eine neue Software – mit allen Folgen für Abnahme und Gewährleistung.',
    transfer: {
      tia: 'Im TIA Portal entspricht das der Installation von Updates/HSPs (Hardware Support Packages) und dem Hochrüsten eines Projekts auf eine neue TIA-Version; Firmware-Stände der CPU wählst du in der Gerätekonfiguration.',
      codesys: 'In CODESYS/TwinCAT verwaltest du Bibliotheks- und Compiler-Versionen über den Bibliotheksverwalter bzw. "Projekt › Projektumgebung"; dort legst du fest, ob Bibliotheken fest oder "immer neueste" referenziert werden.'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Installiere Automation Studio 6 mit Lizenz',
        guide: {
          intro: 'Die Installation besteht aus Automation Studio selbst, mindestens einer Automation Runtime-Version und den benötigten Hardware-Upgrades. Ohne Lizenz startet AS6 nur im Evaluierungsmodus.',
          steps: [
            'Prüfe die Systemvoraussetzungen in der Hilfe (Kapitel **Automation Studio › Systemvoraussetzungen**) – insbesondere freie Festplattenkapazität und Windows-Version.',
            'Lade den Installer aus dem B&R-Downloadbereich und starte ihn mit Administratorrechten.',
            'Wähle bei der Komponentenauswahl Automation Studio, eine aktuelle Automation Runtime und die Hardware-Upgrades für die Steuerungsfamilien, mit denen du arbeitest (z. B. X20).',
            'Starte AS6. Erscheint der Dialog zur Lizenzierung, wähle die Lizenzart, die dir der Ausbilder vorgibt (Arbeitsplatzlizenz oder Technology Guard).',
            'Öffne **Hilfe › Info** und notiere die installierte AS-Version.'
          ],
          done: 'Erledigt, wenn AS6 ohne Lizenzhinweis startet und du die Versionsnummer notiert hast.',
          tip: 'Installiere auf Schulungsrechnern nur, was du brauchst. Jede zusätzliche Runtime-Version kostet Speicher und verlängert Upgrades.',
          link: { label: 'B&R Help: Automation Studio – Installation', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/install/installation_as_main.html' }
        }
      },
      {
        id: 'o2',
        title: 'Installiere ein Upgrade und ein Technology Package',
        guide: {
          intro: 'Upgrades erweitern deine Installation um neue Runtime-Versionen, Hardwaremodule oder Technology Packages (mapp). Du kannst online oder aus einem lokalen Verzeichnis installieren.',
          steps: [
            'Öffne **Extras › Upgrades** (englische Oberfläche: **Tools › Upgrades**).',
            'Wähle die Online-Quelle oder einen lokalen Ordner mit Upgrades. Bei lokalen Upgrades kannst du per Kontrollkästchen auch Unterverzeichnisse durchsuchen lassen.',
            'Markiere ein Technology Package (z. B. eine mapp Services-Version) und ein Hardware-Upgrade.',
            'Klicke **Ausgewählte Upgrades installieren** und lies danach den Installationsbericht.',
            'Rot dargestellte (nicht installierbare) Upgrades: Lies in der Spalte *Beschreibung*, warum sie nicht passen.'
          ],
          done: 'Erledigt, wenn das gewählte Technology Package in der Upgrade-Liste als installiert erscheint.',
          tip: 'Lege für Maschinenprojekte einen lokalen Upgrade-Ordner an, der genau die Versionen des Projekts enthält. So kannst du in fünf Jahren noch reproduzierbar bauen.',
          link: { label: 'B&R Help: Lokale Upgrades', url: 'https://help.br-automation.com/#/de/6/projectmanagement/upgrades/updates_local.html' }
        }
      },
      {
        id: 'o3',
        title: 'Öffne ein bestehendes Projekt und bewerte Versionskonflikte',
        guide: {
          intro: 'Beim Öffnen vergleicht AS6 die im Projekt projektierten Versionen mit deiner Installation. Fehlen Komponenten, erscheint ein Dialog mit der Liste der Abweichungen.',
          steps: [
            'Öffne das Projekt mit **Datei › Projekt öffnen** (Strg+O) und wähle die `.apj`-Datei.',
            'Erscheint der Dialog zu Versionskonflikten, lies die Liste: Welche Hardware, Runtime oder mapp-Komponente fehlt bzw. ist neuer?',
            'Entscheide: **Herunterladen** aktualisiert deine Installation (das Projekt bleibt unverändert). **Ignoriere Versionsunterschiede** öffnet mit den vorhandenen Versionen.',
            'Öffne anschließend **Projekt › Runtime Versionen ändern** und prüfe, welche AR- und mapp-Versionen das Projekt verwendet – ändere hier nichts ohne Auftrag.',
            'Dokumentiere die gefundenen Versionen im Inbetriebnahmeprotokoll.'
          ],
          done: 'Erledigt, wenn das Projekt fehlerfrei geöffnet ist und du AR- und mapp-Versionen des Projekts notiert hast.',
          tip: 'Installieren (Upgrades) und Umstellen (Runtime Versionen ändern) sind zwei verschiedene Dinge. Nur das Umstellen verändert das Projekt.',
          link: { label: 'B&R Help: Versionskonflikte beim Projekt öffnen', url: 'https://help.br-automation.com/#/de/6/projectmanagement/upgrades/updates_vermismatch.html' }
        }
      }
    ],
    videos: [
      v('nwJ7nyTYO18', 'en', 'Zeigt Schritt für Schritt Download und Installation von AS6.'),
      v('bVcpYIc4Bc8', 'en', 'Erklärt, warum Automation Studio, Runtime und Technology Packages in AS6 getrennt versioniert sind.'),
      v('L4hSrbbu6yE', 'en', 'Zeigt, wie ein älteres Projekt auf AS6 gehoben wird und worauf du dabei achtest.')
    ],
    readings: [
      r('hInstall', 'Offizielle Übersicht zu Systemvoraussetzungen, Installation und Lizenzierung.'),
      r('hVersionConflict', 'Erklärt den Dialog, den du beim Öffnen fremder Projekte am häufigsten siehst.'),
      r('cTpUpgrade', 'Praxisbeitrag: Was tun, wenn die benötigte Technology-Package-Version nicht in der Upgrade-Liste erscheint.')
    ],
    quiz: [
      { type: 'single', q: 'Du öffnest ein Projekt und AS6 meldet eine fehlende mapp-Services-Version. Was passiert, wenn du auf **Herunterladen** klickst?',
        options: ['Das Projekt wird auf deine installierte Version umgestellt.', 'Die fehlende Version wird in deiner Installation ergänzt, das Projekt bleibt unverändert.', 'Die Steuerung wird sofort aktualisiert.', 'Alle Technology Packages werden auf die neueste Version gehoben.'],
        correct: 1, explain: 'Herunterladen/Upgrades installieren ergänzt nur deine lokale Installation. Das Projekt ändert sich erst, wenn du bewusst die Runtime-Versionen umstellst.' },
      { type: 'multi', q: 'Welche Bestandteile werden in AS6 unabhängig voneinander versioniert?',
        options: ['Automation Studio', 'Automation Runtime', 'Technology Packages (z. B. mapp View)', 'Die Variablennamen im Projekt'],
        correct: [0, 1, 2], explain: 'AS, AR und Technology Packages haben eigene Versionen und Release-Zyklen. Variablennamen sind Projektinhalt, keine Installation.' },
      { type: 'single', q: 'Wo stellst du ein, welche Automation-Runtime-Version ein Projekt verwendet?',
        options: ['Extras › Upgrades', 'Projekt › Runtime Versionen ändern', 'Online › Einstellungen', 'Datei › Projekt öffnen'],
        correct: 1, explain: 'Upgrades installieren Versionen, unter Projekt › Runtime Versionen ändern wählst du, welche das Projekt nutzt.' }
    ],
    exam: [
      { type: 'single', q: 'Warum solltest du bei einer Service-Reparatur die Runtime-Version eines Kundenprojekts nicht ohne Auftrag ändern?',
        options: ['Weil AS6 das technisch verbietet', 'Weil sich damit die auf der Maschine laufende Software ändert und Abnahme/Freigabe nicht mehr gelten', 'Weil die Lizenz sonst verfällt', 'Weil das Projekt dann nicht mehr geöffnet werden kann'],
        correct: 1, explain: 'Eine andere AR- oder mapp-Version ist eine Softwareänderung an der Maschine. Sie muss geplant, getestet und freigegeben werden.' },
      { type: 'single', q: 'Ein lokales Upgrade wird in der Liste rot dargestellt. Was bedeutet das?',
        options: ['Es ist bereits installiert.', 'Es ist nicht installierbar; der Grund steht in der Spalte Beschreibung.', 'Es ist eine Beta-Version.', 'Es wurde heruntergeladen, aber noch nicht entpackt.'],
        correct: 1, explain: 'Ab AS 6.5 werden nicht installierbare Upgrades rot angezeigt; die Beschreibung nennt den Grund.' },
      { type: 'multi', q: 'Welche Maßnahmen machen einen Projektstand langfristig reproduzierbar baubar?',
        options: ['Lokaler Upgrade-Ordner mit genau den verwendeten Versionen', 'Versionsstände im Inbetriebnahmeprotokoll dokumentieren', 'Immer die neueste Runtime-Version wählen', 'Projekt in der Versionsverwaltung ablegen'],
        correct: [0, 1, 3], explain: 'Reproduzierbarkeit heißt: gleiche Quellen und gleiche Werkzeugversionen. "Immer neueste" ist das Gegenteil davon.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Versionsprüfung eines Technology Packages',
        task: 'Die Steuerung meldet die installierte Version eines Technology Packages als **Major** und **Minor** (z. B. 6.2). Dein Projekt benötigt **mindestens 6.2** innerhalb der Major-Version 6.\n\nSchreibe in `_CYCLIC`:\n- `doVersionOk` = TRUE, wenn Major = 6 **und** Minor ≥ 2.\n- `doUpgradeNeeded` = TRUE, wenn die Version älter ist als 6.2 (also Major < 6 **oder** Major = 6 und Minor < 2).\n- `doMajorMismatch` = TRUE, wenn Major ≠ 6 (anderer Major = nicht kompatibel, egal ob älter oder neuer).\n\nLege die geforderte Version als Konstanten `REQ_MAJOR` und `REQ_MINOR` in `Variables.var` an (`VAR CONSTANT`).',
        hints: ['Vergleiche kannst du direkt zuweisen: `doX := (a = b) AND (c >= d);`', 'Eine Version 7.0 ist nicht "zu alt", aber trotzdem ein Major-Mismatch.'],
        cycleMs: 10,
        io: [
          { name: 'nInstMajor', type: 'INT', dir: 'in', label: 'Installierte Version – Major', widget: 'slider', min: 0, max: 9, init: 6 },
          { name: 'nInstMinor', type: 'INT', dir: 'in', label: 'Installierte Version – Minor', widget: 'slider', min: 0, max: 20, init: 2 },
          { name: 'doVersionOk', type: 'BOOL', dir: 'out', label: 'Version passt', widget: 'led' },
          { name: 'doUpgradeNeeded', type: 'BOOL', dir: 'out', label: 'Upgrade nötig', widget: 'led' },
          { name: 'doMajorMismatch', type: 'BOOL', dir: 'out', label: 'Major-Version inkompatibel', widget: 'led' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doVersionOk', 'doUpgradeNeeded', 'doMajorMismatch'] } },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Versionsprüfung *)\n\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\t(* TODO: REQ_MAJOR, REQ_MINOR *)\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tdoMajorMismatch := nInstMajor <> REQ_MAJOR;\n\tdoVersionOk := (nInstMajor = REQ_MAJOR) AND (nInstMinor >= REQ_MINOR);\n\tdoUpgradeNeeded := (nInstMajor < REQ_MAJOR) OR ((nInstMajor = REQ_MAJOR) AND (nInstMinor < REQ_MINOR));\nEND_PROGRAM\n',
          var: 'VAR CONSTANT\n\tREQ_MAJOR : INT := 6;\n\tREQ_MINOR : INT := 2;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Version 6.2 ist genau passend', steps: [
            { set: { nInstMajor: 6, nInstMinor: 2 } }, { cycles: 2 },
            { expect: 'doVersionOk AND NOT doUpgradeNeeded AND NOT doMajorMismatch', msg: '6.2 erfüllt die Mindestversion.' }
          ]},
          { name: 'Version 6.5 ist neuer und passend', steps: [
            { set: { nInstMajor: 6, nInstMinor: 5 } }, { cycles: 2 },
            { expect: 'doVersionOk AND NOT doUpgradeNeeded', msg: 'Neuere Minor-Versionen innerhalb von Major 6 sind erlaubt.' }
          ]},
          { name: 'Version 6.1 braucht ein Upgrade', steps: [
            { set: { nInstMajor: 6, nInstMinor: 1 } }, { cycles: 2 },
            { expect: 'doUpgradeNeeded AND NOT doVersionOk AND NOT doMajorMismatch', msg: '6.1 ist älter als 6.2 – Upgrade nötig, aber gleiche Major-Version.' }
          ]},
          { name: 'Version 5.9 ist zu alt und inkompatibel', steps: [
            { set: { nInstMajor: 5, nInstMinor: 9 } }, { cycles: 2 },
            { expect: 'doUpgradeNeeded AND doMajorMismatch AND NOT doVersionOk', msg: 'Major 5 < 6: Upgrade nötig und Major-Mismatch.' }
          ]},
          { name: 'Version 7.0 ist neuer, aber inkompatibel', steps: [
            { set: { nInstMajor: 7, nInstMinor: 0 } }, { cycles: 2 },
            { expect: 'doMajorMismatch AND NOT doUpgradeNeeded AND NOT doVersionOk', msg: '7.0 ist nicht zu alt, aber eine andere Major-Version.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'system-1-hardware',
    level: 1,
    kind: 'lektion',
    title: 'Physical View, X20-System und I/O-Mapping',
    summary: 'Du baust den Hardware-Baum einer X20-Station auf, verstehst Buscontroller, Einspeisung und I/O-Module und verknüpfst Kanäle mit Variablen.',
    minutes: 150,
    req: ['system-1-installation'],
    briefing: 'Die Physical View bildet den realen Hardwareaufbau der aktiven Konfiguration als Baum ab: CPU, Schnittstellen, Buscontroller, Einspeisemodule und I/O-Module. Ein X20-System besteht aus Busmodul (Rückwandbus X2X Link), Elektronikmodul und Feldklemme; Einspeisemodule versorgen die Busversorgung und das I/O-Potenzial. Jedes Modul liefert neben seinen Kanälen auch Diagnosedaten, z. B. den Kanal `ModuleOk`. Über die I/O-Zuordnung (`.iom`-Datei, Schlüsselwort `VAR_CONFIG`) verknüpfst du Kanäle mit Variablen. Erst wenn Hardware-Baum und Realität exakt übereinstimmen, läuft die Steuerung ohne Konfigurationsfehler hoch.',
    practice: 'Steht eine Maschine nach dem Modultausch im Hochlauf, ist die erste Frage: Stimmt der Hardware-Baum mit der eingebauten Hardware überein? Die ModuleOk-Signale aller Module sind die Basis jeder Stationsdiagnose.',
    transfer: {
      tia: 'Entspricht der Geräte- und Netzsicht mit der Gerätekonfiguration einer ET 200SP. Die I/O-Zuordnung erfolgt dort über die PLC-Variablentabelle mit Adressen (%I/%Q).',
      codesys: 'In CODESYS/TwinCAT entspricht das dem Gerätebaum bzw. dem E/A-Baum; Variablen verknüpfst du im E/A-Abbild-Dialog oder per `AT %I*` und "Verknüpfen".'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Baue eine X20-Station in der Physical View auf',
        guide: {
          intro: 'Die Physical View ist die dritte Registerseite des Projektexplorers. Module ziehst du aus dem Hardware-Katalog (Toolbox) an den passenden Steckplatz.',
          steps: [
            'Wechsle mit **Strg+Alt+P** in die Physical View.',
            'Öffne die Toolbox und suche im Hardware-Katalog nach `X20DI9371` (digitale Eingänge) und `X20DO9322` (digitale Ausgänge).',
            'Ziehe die Module an die X2X-Schnittstelle der CPU in die Reihenfolge, in der sie auch real gesteckt sind.',
            'Ergänze ein analoges Eingangsmodul (z. B. `X20AI4632`) und prüfe, ob ein zusätzliches Einspeisemodul notwendig ist (Leistungsbilanz im Datenblatt).',
            'Speichere das Projekt (Umschalt+Strg+S) und kompiliere mit **F7**.'
          ],
          done: 'Erledigt, wenn der Hardware-Baum mindestens drei I/O-Module enthält und der Build ohne Fehler durchläuft.',
          tip: 'Die Reihenfolge der Module in der Physical View muss der realen Reihenfolge auf der Hutschiene entsprechen – sonst meldet die Runtime fehlende oder falsche Module.',
          link: { label: 'B&R Help: Physical View', url: 'https://help.br-automation.com/#/de/6/projectmanagement/hwmanagement/physicalview/hwmanagement_physicalview.html' }
        }
      },
      {
        id: 'o2',
        title: 'Erkläre Buscontroller, Einspeisung und Modulaufbau',
        guide: {
          intro: 'Ein X20-Modul besteht aus drei Teilen: Busmodul, Elektronikmodul und Feldklemme. Buscontroller koppeln eine abgesetzte X20-Station an einen Feldbus (z. B. POWERLINK).',
          steps: [
            'Öffne im Hardware-Katalog die Kategorie der Buscontroller und lies die Beschreibung eines POWERLINK-Buscontrollers.',
            'Notiere, welche Aufgabe das Einspeisemodul im Buscontroller-Verbund übernimmt (X2X-Busversorgung, I/O-Versorgung).',
            'Öffne im Kontextmenü eines I/O-Moduls die **I/O Zuordnung** und finde den Kanal `ModuleOk`.',
            'Skizziere eine Station: CPU – X2X Link – Buscontroller – Einspeisung – DI – DO – AI.'
          ],
          done: 'Erledigt, wenn deine Skizze alle Komponenten mit ihrer Funktion beschriftet und du den Kanal ModuleOk gefunden hast.',
          tip: 'Elektronikmodule lassen sich bei X20 tauschen, ohne die Verdrahtung an der Feldklemme zu lösen – ein großer Vorteil im Service.'
        }
      },
      {
        id: 'o3',
        title: 'Verknüpfe I/O-Kanäle mit Variablen',
        guide: {
          intro: 'Die I/O-Zuordnung legt fest, welche Variable welchen Kanal repräsentiert. Technisch steht das in einer `.iom`-Datei der Konfiguration.',
          steps: [
            'Lege in `Global.var` die Variablen `diStart : BOOL;`, `doMotor : BOOL;` und `bModuleOkDI : BOOL;` an.',
            'Öffne über das Kontextmenü des DI-Moduls die **I/O Zuordnung**.',
            'Trage in der Spalte für die Prozessvariable beim Kanal `DigitalInput01` die Variable `diStart` ein, bei `ModuleOk` die Variable `bModuleOkDI`.',
            'Wiederhole das für `doMotor` am DO-Modul.',
            'Kompiliere mit **F7** und prüfe im Ausgabefenster, dass keine Zuordnungsfehler gemeldet werden.'
          ],
          code: { lang: 'text', text: 'VAR_CONFIG\n  ::diStart AT %IX."DI9371".DigitalInput01;  (* Beispiel – Pfad erzeugt AS *)\nEND_VAR' },
          done: 'Erledigt, wenn drei Variablen zugeordnet sind und der Build fehlerfrei ist.',
          tip: 'Verwende Präfixe wie `di`, `do`, `ai`, `ao` für I/O-Variablen. Dann erkennst du schon am Namen, dass eine Variable "von außen" kommt.',
          link: { label: 'B&R Help: I/O Zuordnung', url: 'https://help.br-automation.com/#/de/6/programming/io/mapping/programmingmodel_io_mapping.html' }
        }
      }
    ],
    videos: [
      v('4Jwy8zIgU9I', 'en', 'Kurzer Überblick über Aufbau und Eigenschaften der X20-I/O-Module.'),
      v('OYn7r5FQc8I', 'en', 'Zeigt den mechanischen Aufbau einer X20-Station aus Bus-, Elektronikmodul und Feldklemme.'),
      v('9HexRg_qDwI', 'de', 'Deutschsprachiger Einstieg: Projekt anlegen und Hardware auswählen.')
    ],
    readings: [
      r('iasStrukturen', 'Hochschulfolien zu Aufbau und Strukturen von Automatisierungsgeräten – der theoretische Rahmen für dezentrale I/O.'),
      r('hPhysical', 'Beschreibt Aufbau und Bedienung der Physical View.'),
      r('hIoMapping', 'Format und Regeln der I/O-Zuordnung, inklusive Mehrfachzuordnung und Taskklassen-Präfix.')
    ],
    quiz: [
      { type: 'single', q: 'Welche drei Teile bilden ein X20-Modul?',
        options: ['CPU, Netzteil, Display', 'Busmodul, Elektronikmodul, Feldklemme', 'Klemme, Sicherung, Relais', 'Buscontroller, Switch, Router'],
        correct: 1, explain: 'X20-Module sind dreiteilig: Busmodul (Rückwandbus), Elektronikmodul (Funktion) und Feldklemme (Verdrahtung).' },
      { type: 'single', q: 'Was zeigt die Physical View?',
        options: ['Die Programmstruktur', 'Den Hardwareaufbau der aktiven Konfiguration als Baum', 'Die Variablen aller Tasks', 'Das Logbuch der Steuerung'],
        correct: 1, explain: 'Die Physical View stellt alle Hardwaremodule der aktiven Konfiguration in einer Baumstruktur dar.' },
      { type: 'multi', q: 'Wofür eignet sich der Kanal ModuleOk eines I/O-Moduls?',
        options: ['Erkennen, ob das Modul vorhanden und betriebsbereit ist', 'Messen der Versorgungsspannung in Volt', 'Sperren von Ausgängen, wenn ein Modul fehlt', 'Aufbau einer Stationsdiagnose'],
        correct: [0, 2, 3], explain: 'ModuleOk ist ein BOOL-Statussignal. Es eignet sich für Diagnose und Verriegelung, liefert aber keinen Messwert.' }
    ],
    exam: [
      { type: 'single', q: 'In welcher Datei stehen I/O-Zuordnungen einer Konfiguration?',
        options: ['.var', '.iom', '.typ', '.st'],
        correct: 1, explain: 'Die I/O-Zuordnung je CPU steht in einer oder mehreren `.iom`-Dateien, geklammert mit VAR_CONFIG … END_VAR.' },
      { type: 'single', q: 'Nach einem Modultausch läuft die Station nicht hoch. Das neue Modul hat eine andere Bestellnummer als im Projekt. Was ist die Ursache?',
        options: ['Der Hardware-Baum stimmt nicht mehr mit der realen Hardware überein', 'Die Taskklasse ist zu langsam', 'Der Logger ist voll', 'Die Variable ist nicht remanent'],
        correct: 0, explain: 'Die Runtime vergleicht projektierte und gesteckte Module. Abweichungen führen zu Konfigurationsfehlern.' },
      { type: 'multi', q: 'Welche Aufgaben übernimmt ein Einspeisemodul in einer X20-Station?',
        options: ['Versorgung des X2X-Busses', 'Versorgung des I/O-Potenzials', 'Speichern des Anwenderprogramms', 'Messen der Zykluszeit'],
        correct: [0, 1], explain: 'Einspeisemodule speisen Bus- und I/O-Versorgung ein; Programmspeicher und Zykluszeit sind Aufgaben der CPU.' },
      { type: 'numeric', q: 'Ein Analogeingang liefert 0 … 32767 für 0 … 10 V. Welchen Rohwert erwartest du bei {U} V? (gerundet)',
        params: { U: [1, 9, 1] }, formula: 'Math.round(U / 10 * 32767)', unit: '', tol: 0.002,
        explain: 'Rohwert = U / 10 V · 32767.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Modulstatus einer X20-Station auswerten',
        task: 'Die Station besteht aus fünf Modulen. Jedes liefert seinen `ModuleOk`-Kanal als BOOL-Eingang: Buscontroller (BC), Einspeisung (PS), DI-, DO- und AI-Modul.\n\nSchreibe in `_CYCLIC`:\n- `doStationOk` = TRUE, wenn **alle** fünf Module OK sind.\n- `doLampFault` = Gegenteil von `doStationOk`.\n- `nFaultyModules` = Anzahl der Module, die **nicht** OK sind.\n- `nFirstFaulty` = Nummer des **ersten** fehlerhaften Moduls in der Reihenfolge BC=1, PS=2, DI=3, DO=4, AI=5; `0`, wenn alle OK sind.\n\nDie Ausgaben sollen sich sofort wieder zurücksetzen, wenn die Module wieder OK sind (keine Speicherung).',
        hints: ['Zähle mit einer Hilfsvariablen, die du in jedem Zyklus zuerst auf 0 setzt.', 'Für `nFirstFaulty` prüfst du die Module in umgekehrter Reihenfolge – oder du setzt den Wert nur, solange er noch 0 ist.'],
        cycleMs: 10,
        io: [
          { name: 'diOkBC', type: 'BOOL', dir: 'in', label: 'ModuleOk Buscontroller', widget: 'switch', init: true },
          { name: 'diOkPS', type: 'BOOL', dir: 'in', label: 'ModuleOk Einspeisung', widget: 'switch', init: true },
          { name: 'diOkDI', type: 'BOOL', dir: 'in', label: 'ModuleOk DI-Modul', widget: 'switch', init: true },
          { name: 'diOkDO', type: 'BOOL', dir: 'in', label: 'ModuleOk DO-Modul', widget: 'switch', init: true },
          { name: 'diOkAI', type: 'BOOL', dir: 'in', label: 'ModuleOk AI-Modul', widget: 'switch', init: true },
          { name: 'doStationOk', type: 'BOOL', dir: 'out', label: 'Station OK', widget: 'led' },
          { name: 'doLampFault', type: 'BOOL', dir: 'out', label: 'Leuchte Stationsfehler', widget: 'led' },
          { name: 'nFaultyModules', type: 'INT', dir: 'out', label: 'Anzahl fehlerhafter Module', widget: 'value' },
          { name: 'nFirstFaulty', type: 'INT', dir: 'out', label: 'Erstes fehlerhaftes Modul', widget: 'value' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doStationOk', 'doLampFault'] } },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Stationsdiagnose *)\n\tdoStationOk := diOkBC AND diOkPS;\nEND_PROGRAM\n',
          var: 'VAR\n\tnCount : INT;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\tnCount := 0;\n\tnFirstFaulty := 0;\n\tIF NOT diOkAI THEN nCount := nCount + 1; nFirstFaulty := 5; END_IF\n\tIF NOT diOkDO THEN nCount := nCount + 1; nFirstFaulty := 4; END_IF\n\tIF NOT diOkDI THEN nCount := nCount + 1; nFirstFaulty := 3; END_IF\n\tIF NOT diOkPS THEN nCount := nCount + 1; nFirstFaulty := 2; END_IF\n\tIF NOT diOkBC THEN nCount := nCount + 1; nFirstFaulty := 1; END_IF\n\tnFaultyModules := nCount;\n\tdoStationOk := nCount = 0;\n\tdoLampFault := NOT doStationOk;\nEND_PROGRAM\n',
          var: 'VAR\n\tnCount : INT;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Alle Module OK', steps: [
            { cycles: 3 },
            { expect: 'doStationOk AND NOT doLampFault AND nFaultyModules = 0 AND nFirstFaulty = 0', msg: 'Bei fünf OK-Modulen ist die Station OK, Fehlerzahl 0, erstes Fehlermodul 0.' }
          ]},
          { name: 'DI-Modul fällt aus', steps: [
            { set: { diOkDI: false } }, { cycles: 2 },
            { expect: 'NOT doStationOk AND doLampFault', msg: 'Ein fehlendes Modul muss die Station als gestört melden.' },
            { expect: 'nFaultyModules = 1 AND nFirstFaulty = 3', msg: 'Ein Fehler, und zwar Modul 3 (DI).' }
          ]},
          { name: 'Zwei Module gestört – erstes wird gemeldet', steps: [
            { set: { diOkPS: false, diOkAI: false } }, { cycles: 2 },
            { expect: 'nFaultyModules = 2', msg: 'Zwei Module sind gestört.' },
            { expect: 'nFirstFaulty = 2', msg: 'Das erste gestörte Modul in der Reihenfolge ist PS (2).' }
          ]},
          { name: 'Rückkehr in den Gutzustand', steps: [
            { set: { diOkBC: false } }, { cycles: 2 },
            { expect: 'nFirstFaulty = 1' },
            { set: { diOkBC: true } }, { cycles: 2 },
            { expect: 'doStationOk AND nFaultyModules = 0 AND nFirstFaulty = 0', msg: 'Ohne Fehler müssen alle Diagnoseausgänge wieder zurückgehen.' }
          ]}
        ]
      },
      {
        id: 'ex2', type: 'st', variant: 'schreiben',
        title: 'Analogwert skalieren mit Drahtbruch-Erkennung',
        task: 'Ein Füllstandssensor liefert **4 … 20 mA** an ein X20-Analogmodul. Das Modul bildet **0 … 20 mA auf 0 … 32767** ab. Damit entsprechen 4 mA dem Rohwert **6554** (gerundet).\n\nSchreibe in `_CYCLIC`:\n- `rLevel` (REAL, %) = linear skaliert: 4 mA → 0 %, 20 mA → 100 %. Formel: `(Rohwert − 6554) / (32767 − 6554) · 100`.\n- Werte unter 0 % oder über 100 % werden auf 0 bzw. 100 begrenzt (`LIMIT`).\n- `doWireBreak` = TRUE, wenn der Rohwert **unter 5734** liegt (≈ 3,5 mA: Drahtbruch). Dann soll `rLevel` = 0.0 sein.\n- `doLevelHigh` = TRUE ab einem Füllstand von **≥ 90 %** (nur ohne Drahtbruch).',
        hints: ['Wandle den INT-Rohwert mit `INT_TO_REAL` um, bevor du rechnest.', 'Prüfe den Drahtbruch zuerst; nur ohne Drahtbruch wird skaliert.'],
        cycleMs: 10,
        io: [
          { name: 'aiLevelRaw', type: 'INT', dir: 'in', label: 'Rohwert AI-Kanal', widget: 'slider', min: 0, max: 32767, init: 6554 },
          { name: 'rLevel', type: 'REAL', dir: 'out', label: 'Füllstand', widget: 'gauge', min: 0, max: 100, unit: '%' },
          { name: 'doWireBreak', type: 'BOOL', dir: 'out', label: 'Drahtbruch', widget: 'led' },
          { name: 'doLevelHigh', type: 'BOOL', dir: 'out', label: 'Füllstand hoch', widget: 'led' }
        ],
        scene: { type: 'tank', bind: { level: 'rLevel' } },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO: Skalierung 4..20 mA -> 0..100 % *)\n\trLevel := INT_TO_REAL(aiLevelRaw) / 32767.0 * 100.0;\nEND_PROGRAM\n',
          var: 'VAR\n\trRaw : REAL;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\trRaw := INT_TO_REAL(aiLevelRaw);\n\tdoWireBreak := aiLevelRaw < 5734;\n\tIF doWireBreak THEN\n\t\trLevel := 0.0;\n\t\tdoLevelHigh := FALSE;\n\tELSE\n\t\trLevel := LIMIT(0.0, (rRaw - 6554.0) / (32767.0 - 6554.0) * 100.0, 100.0);\n\t\tdoLevelHigh := rLevel >= 90.0;\n\tEND_IF\nEND_PROGRAM\n',
          var: 'VAR\n\trRaw : REAL;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: '4 mA ergibt 0 %', steps: [
            { set: { aiLevelRaw: 6554 } }, { cycles: 2 },
            { expect: 'ABS(rLevel) < 0.1 AND NOT doWireBreak', msg: 'Bei 4 mA (6554) muss der Füllstand 0 % sein.' }
          ]},
          { name: '12 mA ergibt 50 %', steps: [
            { set: { aiLevelRaw: 19661 } }, { cycles: 2 },
            { expect: 'ABS(rLevel - 50.0) < 0.2', msg: '12 mA (≈ 19661) entsprechen 50 %.' }
          ]},
          { name: '20 mA ergibt 100 % und Meldung hoch', steps: [
            { set: { aiLevelRaw: 32767 } }, { cycles: 2 },
            { expect: 'ABS(rLevel - 100.0) < 0.1 AND doLevelHigh', msg: '20 mA = 100 %, Grenzwert 90 % überschritten.' }
          ]},
          { name: 'Drahtbruch wird erkannt', steps: [
            { set: { aiLevelRaw: 1000 } }, { cycles: 2 },
            { expect: 'doWireBreak AND rLevel = 0.0 AND NOT doLevelHigh', msg: 'Unter 5734 liegt ein Drahtbruch vor; Füllstand 0, keine Grenzwertmeldung.' }
          ]},
          { name: 'Zwischen 3,5 und 4 mA wird auf 0 % begrenzt', steps: [
            { set: { aiLevelRaw: 6000 } }, { cycles: 2 },
            { expect: 'NOT doWireBreak AND rLevel = 0.0', msg: 'Leicht unter 4 mA ist noch kein Drahtbruch, aber der Wert wird auf 0 % begrenzt.' }
          ]}
        ]
      }
    ]
  },

  // ---------------------------------------------------------------------------
  {
    id: 'system-1-inbetriebnahme',
    level: 1,
    kind: 'projekt',
    title: 'Praxisprojekt: ArSim, Online-Verbindung und Transfer',
    summary: 'Du simulierst die Steuerung mit ARsim, baust eine Online-Verbindung auf, überträgst dein Projekt und beobachtest ein Lebenszeichen im Watch.',
    minutes: 180,
    req: ['system-1-hardware'],
    briefing: 'ARsim ist eine Windows-basierte Automation Runtime ohne Echtzeitfähigkeit, die funktional den echten Zielsystemen entspricht. Damit testest du Programme, bevor echte Hardware verfügbar ist. In diesem Projekt durchläufst du den kompletten Engineering-Kreislauf: Simulation aktivieren, kompilieren (F7), übertragen (Strg+F5), Online-Verbindung prüfen und Variablen beobachten. Als Programm baust du ein Lebenszeichen (Heartbeat) und eine Hochlaufverzögerung – die einfachste Form einer Systemdiagnose: Läuft die Steuerung überhaupt?',
    practice: 'Ein blinkendes Lebenszeichen auf der HMI oder an einer Meldeleuchte zeigt dem Bediener und dem Service sofort, ob die Steuerung zyklisch arbeitet. Übergeordnete Systeme überwachen genau dieses Signal.',
    transfer: {
      tia: 'Im TIA Portal entspricht ARsim der Simulation mit PLCSIM; geladen wird mit "Laden in Gerät", online gehst du mit "Online verbinden".',
      codesys: 'CODESYS bietet den Simulationsmodus bzw. die SoftSPS (Control Win); TwinCAT nutzt die lokale Runtime ("UmRT"/Config-Mode → Run-Mode) und "Einloggen".'
    },
    objectives: [
      {
        id: 'o1',
        title: 'Aktiviere die CPU-Simulation (ARsim)',
        guide: {
          intro: 'Die Simulation aktivierst du direkt aus Automation Studio. ARsim wird dabei automatisch gestartet; Standardadresse ist 127.0.0.1, Port 11160.',
          steps: [
            'Öffne dein Projekt aus dem Modul „Physical View, X20-System und I/O-Mapping“.',
            'Wähle **Online › Simulation aktivieren**.',
            'Prüfe in der Statusleiste unten, dass eine Verbindung zur Simulation angezeigt wird.',
            'Kompiliere die Konfiguration mit **F7** und übertrage sie mit **Strg+F5** (**Projekt › Ins Zielsystem übertragen**).',
            'Bestätige den Übertragungsdialog mit **Übertragen** und warte, bis die Statusleiste RUN meldet.'
          ],
          done: 'Erledigt, wenn die Statusleiste die Simulation im Zustand RUN zeigt.',
          tip: 'ARsim ist nicht echtzeitfähig. Zeitkritische Effekte (Jitter, Zykluszeitverletzungen) beurteilst du immer auf der echten Hardware.',
          link: { label: 'B&R Help: Eigenschaften der CPU – Simulation', url: 'https://help.br-automation.com/#/de/6/projectmanagement/systemconfiguration/sg4/cpu/projectorganisation_systemconfiguration_sg4_cpu_simu.html' }
        }
      },
      {
        id: 'o2',
        title: 'Stelle eine Online-Verbindung zu einer echten Steuerung her',
        guide: {
          intro: 'Für echte Hardware konfigurierst du die Verbindung unter Online › Einstellungen. Die IP-Adresse des PCs muss im gleichen Netz liegen wie die Steuerung.',
          steps: [
            'Deaktiviere die Simulation wieder über **Online › Simulation aktivieren**.',
            'Öffne **Online › Einstellungen** und lege mit **Einf** eine neue Verbindung an.',
            'Trage die IP-Adresse der Steuerung ein (Beispiel aus der B&R-Hilfe: PC 10.0.0.1, Steuerung 10.0.0.2).',
            'Wähle im Kontextmenü der Verbindung **Verbinden** und prüfe die Statusleiste.',
            'Übertrage das Projekt mit **Strg+F5**.'
          ],
          done: 'Erledigt, wenn die Statusleiste die Steuerung als verbunden anzeigt und das Projekt übertragen ist.',
          tip: 'Findet AS6 die Steuerung nicht, prüfe zuerst Kabel, Netzmaske und Firewall – erst dann die Projekteinstellungen.',
          link: { label: 'B&R Help: Verbindung herstellen', url: 'https://help.br-automation.com/#/de/6/gettingstarted/firstprojectphysical_online.htm' }
        }
      },
      {
        id: 'o3',
        title: 'Beobachte das Lebenszeichen im Watch',
        guide: {
          intro: 'Mit dem Variablenmonitor (Watch) siehst du Werte live und kannst sie ändern. Er wird pro Task oder für alle globalen Variablen geöffnet.',
          steps: [
            'Füge ein neues ST-Programm `Heartbeat` in der Logical View hinzu und weise es der Taskklasse Cyclic #1 zu.',
            'Programmiere die Übung dieses Moduls und übertrage das Projekt.',
            'Öffne im Kontextmenü des Programms in der Softwarekonfiguration den **Watch** und füge `doHeartbeat`, `nHeartbeatCnt` und `nUptimeSec` hinzu.',
            'Setze `diEnable` im Watch auf TRUE und beobachte das Umschalten.',
            'Erstelle einen Screenshot des Watch-Fensters als Nachweis.'
          ],
          done: 'Erledigt, wenn du im Watch das Umschalten von doHeartbeat und den steigenden Sekundenzähler siehst und den Screenshot abgelegt hast.',
          tip: 'Speichere Watch-Listen als Variablenmonitor-Konfiguration. So hast du bei der nächsten Inbetriebnahme sofort die wichtigsten Signale zur Hand.',
          link: { label: 'B&R Help: Variablenmonitor (Watch)', url: 'https://help.br-automation.com/#/de/6/diagnostics_support/diagnosis/watch/diagnosis_watch.html' }
        }
      },
      {
        id: 'o4',
        title: 'Reiche den Nachweis ein',
        guide: {
          intro: 'Dein Projekt soll für den Ausbilder nachvollziehbar sein: Quellcode und Nachweis der Inbetriebnahme gehören zusammen.',
          steps: [
            'Lege dein AS6-Projekt in einem Repository auf git.breitner.de ab (ohne `Temp/` und `Binaries/`).',
            'Füge den Watch-Screenshot und eine kurze `README` hinzu: verwendete AS-, AR- und mapp-Versionen, Simulation oder echte Hardware.',
            'Reiche den Link zum Repository als Nachweis ein.'
          ],
          done: 'Erledigt, wenn der Nachweis-Link eingereicht ist.',
          tip: 'Die Versionsangaben in der README sind kein Formalismus – ohne sie kann niemand dein Projekt später identisch bauen.'
        }
      }
    ],
    videos: [
      v('Jw4teNmqwtQ', 'de', 'Deutschsprachige Vorstellung der Simulation in Automation Studio.'),
      v('3h7CvC-angI', 'de', 'Zeigt auf Deutsch, wie du eine Steuerung im Netzwerk findest und verbindest.'),
      v('cM5_eV2LgaM', 'en', 'Erstes Basisbeispiel: Programm erstellen, übertragen und online beobachten.')
    ],
    readings: [
      r('thmSps', 'Hochschulskript zum zyklischen Arbeitsprinzip einer SPS – die Grundlage, um ein Lebenszeichen zu verstehen.'),
      r('hArsim', 'Beschreibt Struktur, Hochlauf und Online-Verbindung der ARsim.'),
      r('hTransfer', 'Die offizielle Kurzanleitung zur Projektinstallation ins Zielsystem.')
    ],
    quiz: [
      { type: 'single', q: 'Welche Tastenkombination startet in AS6 die Übertragung ins Zielsystem?',
        options: ['F7', 'Strg+F5', 'F5', 'Strg+F7'],
        correct: 1, explain: 'Strg+F5 = Projekt › Ins Zielsystem übertragen. F7 kompiliert, Strg+F7 kompiliert alles neu, F5 ist im Debugger "Weiter".' },
      { type: 'single', q: 'Was gilt für ARsim?',
        options: ['Sie ist echtzeitfähig wie eine X20-CPU.', 'Sie ist eine Windows-basierte Automation Runtime ohne Echtzeitfähigkeit.', 'Sie simuliert nur die Visualisierung.', 'Sie benötigt immer eine echte CPU im Netzwerk.'],
        correct: 1, explain: 'ARsim entspricht funktional den Zielsystemen, ist aber nicht echtzeitfähig.' },
      { type: 'single', q: 'Ein TON mit PT = T#500ms wird in jedem Zyklus mit `IN := NOT fbT.Q` aufgerufen. Was entsteht?',
        options: ['Ein Dauersignal', 'Ein Impuls etwa alle 500 ms (Taktgeber)', 'Eine Ausschaltverzögerung', 'Nichts, der Timer startet nie'],
        correct: 1, explain: 'Sobald Q TRUE wird, ist IN im nächsten Zyklus FALSE – der Timer setzt sich zurück und startet neu. Das ist ein einfacher Taktgeber.' }
    ],
    exam: [
      { type: 'single', q: 'Welche IP-Adresse und welchen Port nutzt die ARsim standardmäßig?',
        options: ['192.168.0.1 : 80', '127.0.0.1 : 11160', '10.0.0.2 : 502', '0.0.0.0 : 4840'],
        correct: 1, explain: 'Die CPU-Simulation nutzt standardmäßig 127.0.0.1 und Port 11160.' },
      { type: 'multi', q: 'Die Steuerung wird nicht gefunden. Welche Prüfungen sind sinnvoll?',
        options: ['Liegt die PC-IP im gleichen Subnetz?', 'Ist das Ethernet-Kabel gesteckt und die Link-LED aktiv?', 'Blockiert eine Firewall die Kommunikation?', 'Ist die Variable doHeartbeat remanent?'],
        correct: [0, 1, 2], explain: 'Netzwerkprobleme prüfst du von unten nach oben: Kabel, Adressierung, Firewall. Variableneigenschaften haben damit nichts zu tun.' },
      { type: 'numeric', q: 'Ein Lebenszeichen schaltet alle {T} ms um. Wie viele Umschaltungen siehst du in 10 s?',
        params: { T: [250, 1000, 250] }, formula: '10000 / T', unit: '', tol: 0.01,
        explain: 'Anzahl = 10 000 ms / Umschaltintervall.' }
    ],
    exercises: [
      {
        id: 'ex1', type: 'st', variant: 'schreiben',
        title: 'Lebenszeichen und Hochlaufzeit',
        task: 'Baue die Basisdiagnose "Steuerung lebt":\n\n1. Solange `diEnable` TRUE ist, schaltet `doHeartbeat` **alle 500 ms um** (Taktgeber mit `TON`). Jede Umschaltung erhöht `nHeartbeatCnt` (UINT) um 1.\n2. Ist `diEnable` FALSE, ist `doHeartbeat` sofort FALSE und `nHeartbeatCnt` bleibt stehen.\n3. Unabhängig davon zählt `nUptimeSec` (UDINT) die **Sekunden seit dem Programmstart** (Takt 1 s mit eigenem `TON`).\n4. `doSystemReady` wird **3 s nach dem Start** TRUE und bleibt TRUE (Hochlaufverzögerung, z. B. bis alle Module bereit sind).\n\nDie Task läuft mit 10 ms Zykluszeit.',
        hints: ['Taktgeber: `fbBlink(IN := diEnable AND NOT fbBlink.Q, PT := T#500ms);` und dann `IF fbBlink.Q THEN … END_IF`.', 'Für die Hochlaufzeit reicht ein TON, dessen IN dauerhaft TRUE ist.'],
        cycleMs: 10,
        io: [
          { name: 'diEnable', type: 'BOOL', dir: 'in', label: 'Freigabe Lebenszeichen', widget: 'switch' },
          { name: 'doHeartbeat', type: 'BOOL', dir: 'out', label: 'Lebenszeichen', widget: 'led' },
          { name: 'nHeartbeatCnt', type: 'UINT', dir: 'out', label: 'Anzahl Umschaltungen', widget: 'value' },
          { name: 'nUptimeSec', type: 'UDINT', dir: 'out', label: 'Laufzeit seit Start', widget: 'value', unit: 's' },
          { name: 'doSystemReady', type: 'BOOL', dir: 'out', label: 'System bereit', widget: 'led' }
        ],
        scene: { type: 'lamp', bind: { lamps: ['doHeartbeat', 'doSystemReady'] } },
        files: {
          main: 'PROGRAM _INIT\n\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* TODO 1: Taktgeber 500 ms *)\n\n\t(* TODO 2: Sekundenzähler *)\n\n\t(* TODO 3: Hochlaufverzögerung 3 s *)\n\nEND_PROGRAM\n',
          var: 'VAR\n\tfbBlink : TON;\n\tfbSecond : TON;\n\tfbStartup : TON;\nEND_VAR\n',
          typ: ''
        },
        solution: {
          main: 'PROGRAM _INIT\n\tnUptimeSec := 0;\nEND_PROGRAM\n\nPROGRAM _CYCLIC\n\t(* 1: Taktgeber 500 ms *)\n\tfbBlink(IN := diEnable AND NOT fbBlink.Q, PT := T#500ms);\n\tIF NOT diEnable THEN\n\t\tdoHeartbeat := FALSE;\n\tELSIF fbBlink.Q THEN\n\t\tdoHeartbeat := NOT doHeartbeat;\n\t\tnHeartbeatCnt := nHeartbeatCnt + 1;\n\tEND_IF\n\n\t(* 2: Sekundenzähler *)\n\tfbSecond(IN := NOT fbSecond.Q, PT := T#1s);\n\tIF fbSecond.Q THEN\n\t\tnUptimeSec := nUptimeSec + 1;\n\tEND_IF\n\n\t(* 3: Hochlaufverzögerung *)\n\tfbStartup(IN := TRUE, PT := T#3s);\n\tdoSystemReady := fbStartup.Q;\nEND_PROGRAM\n',
          var: 'VAR\n\tfbBlink : TON;\n\tfbSecond : TON;\n\tfbStartup : TON;\nEND_VAR\n',
          typ: ''
        },
        tests: [
          { name: 'Lebenszeichen startet nach etwa 500 ms', steps: [
            { set: { diEnable: true } },
            { ms: 400 },
            { expect: 'NOT doHeartbeat AND nHeartbeatCnt = 0', msg: 'Das erste Umschalten darf erst nach etwa 500 ms kommen.' },
            { until: 'doHeartbeat', maxMs: 400, msg: 'doHeartbeat muss nach etwa 500 ms TRUE werden.' }
          ]},
          { name: 'Umschaltintervall ist 500 ms', steps: [
            { set: { diEnable: true } },
            { until: 'doHeartbeat', maxMs: 800 },
            { ms: 400 },
            { expect: 'doHeartbeat AND nHeartbeatCnt = 1', msg: 'doHeartbeat muss etwa 500 ms lang TRUE bleiben.' },
            { until: 'NOT doHeartbeat', maxMs: 300, msg: 'Nach etwa 500 ms muss doHeartbeat wieder FALSE werden.' }
          ]},
          { name: 'Zähler zählt die Umschaltungen', steps: [
            { set: { diEnable: true } }, { ms: 2600 },
            { expect: 'nHeartbeatCnt >= 4 AND nHeartbeatCnt <= 6', msg: 'In 2,6 s erwarten wir etwa 5 Umschaltungen.' }
          ]},
          { name: 'Freigabe weg: aus und Zähler steht', steps: [
            { set: { diEnable: true } },
            { until: 'doHeartbeat', maxMs: 800 },
            { set: { diEnable: false } }, { cycles: 2 },
            { expect: 'NOT doHeartbeat', msg: 'Ohne Freigabe muss doHeartbeat sofort FALSE sein.' },
            { ms: 1000 },
            { expect: 'nHeartbeatCnt = 1', msg: 'Ohne Freigabe darf der Zähler nicht weiterzählen.' }
          ]},
          { name: 'Hochlaufverzögerung und Sekundenzähler', steps: [
            { ms: 2500 },
            { expect: 'NOT doSystemReady', msg: 'Vor Ablauf von 3 s darf das System nicht bereit sein.' },
            { until: 'doSystemReady', maxMs: 800, msg: 'Nach 3 s muss doSystemReady TRUE werden.' },
            { ms: 2000 },
            { expect: 'nUptimeSec >= 4 AND nUptimeSec <= 6', msg: 'Nach gut 5 s muss der Sekundenzähler bei etwa 5 stehen.' }
          ]}
        ]
      }
    ],
    proof: true,
    badge: 'Inbetriebnahme-Starter'
  }
];
