# CLAUDE.md – becomeStEngineer

Lernplattform der Firma BREITNER für SPS-Programmierung mit B&R Automation Studio 6 in Structured Text (Stufen Grundkurs → Genie). Ausführliche Beschreibung: `README.md`. Inhalts-Format: `docs/CONTENT_SCHEMA.md`.

## Projektordner

- Zuletzt bearbeitet in: `/home/user/becomestengineer` (Cloud-Container der Claude-Code-Sitzung; dieser Ordner ist vergänglich).
- Maßgeblich ist das Git-Repository: https://github.com/mikedimojoe/becomeStEngineer (Branch `main`).
- Der Code verwendet nur relative Pfade (`__dirname`); der Ordner kann beliebig verschoben werden.

## Lokal starten

Voraussetzung: Node.js **≥ 22.13** (nutzt das eingebaute `node:sqlite`). Kein `npm install` nötig, keine externen Pakete.

```bash
node server/server.js            # oder: npm start / ./start.sh / start.bat (Windows)
```

- Standard: http://localhost:8080. Umgebungsvariablen: `PORT`, `HOST` (Standard `0.0.0.0`), `DATA_DIR` (Standard `./data`).
- Erster Aufruf im Browser legt das Admin-Konto an.
- Tests (offline): `npm test` = `tools/validate-content.js` + `tools/check-exercises.js` + `tools/e2e-stage.js`.
- Quellenprüfung (braucht Internet): `node tools/verify-sources.js`.

## Deployment

- **Es gibt kein Deployment, keinen Hoster und keine Domain.** Die App ist für den Betrieb auf einem Rechner im Firmennetz gedacht und wurde dort noch nicht installiert.
- Vorgesehen: Ordner auf einen Firmenrechner kopieren und `start.bat` starten bzw. als Dienst betreiben. Beispiele für Windows-Aufgabenplanung und systemd stehen im `README.md` (Abschnitt „Als Dienst betreiben“).
- Der im Lehrinhalt genannte Git-Server `git.breitner.de` ist nur Unterrichtsbeispiel (Git-Simulator); die App verbindet sich nicht dorthin.

## Zugangsdaten / Konfiguration (nur wo, keine Werte)

- Es gibt **keine** API-Keys, `.env`-Dateien oder Secrets im Projekt.
- Benutzerkonten und Passwörter (scrypt-Hash) liegen in der SQLite-Datenbank `$DATA_DIR/becomestengineer.db` (Standard `data/`, per `.gitignore` nicht versioniert). Sitzungen ebenfalls dort (Tabelle `sessions`).
- Port/Datenordner nur über Umgebungsvariablen (`PORT`, `HOST`, `DATA_DIR`).
- Sicherungen: `$DATA_DIR/backups/` (täglich automatisch, die letzten 30).

## Aufbau

- `server/server.js` – HTTP-Server, DB-Schema, API; `server/engine.js` – Bewertung (KP, Niveaus, Noten, Stufen, nächster Schritt, Prüfungen).
- `public/js/st/` – ST-Interpreter (Browser + Node); `public/js/gitsim.js` – Git-Simulator; `public/js/*.js` – Oberfläche (klassische Skripte, kein Build).
- `content/areas/<bereich>.js` (+ Unterordner `level*.js`) – Lehrplan; `content/exams/elektro-check.js` – Elektro-Kompetenzcheck.
- `tools/` – Prüfwerkzeuge; `docs/` – Schema, Design-Entwürfe, Screenshots.
- Inhalte geändert → im Admin „Inhalte neu laden“ oder Server neu starten.

## Offene Punkte

- Noch nicht im Firmennetz installiert; kein Dienst eingerichtet.
- AS6-Menüpfade in den Anleitungen fachlich gegenlesen lassen. Links auf `help.br-automation.com` liefern immer HTTP 200 (Single-Page-App) – `verify-sources.js` kann sie nicht wirklich prüfen; die Agenten haben sie zusätzlich über die Such-API der Hilfe geprüft.
- B&R-Trainingsmodule (TM-Hefte) und firmeneigene Coding-Richtlinien sind nicht eingebunden (www.br-automation.com war nicht erreichbar).
- Simulationsbausteine (MpAxisBasic, MC_*, MTBasicsPID, AsTCP, MpAlarmX) sind vereinfacht; Fehlercodes/Zeitverhalten weichen teils von AS6 ab. `MC_Home`/Bewegung auf ausgeschalteter Achse setzt die ganze Achse in ErrorStop (strenger als PLCopen) – eine Motion-Übung nutzt das.
- Nicht im Simulator: `REFERENCE TO`/Pointer-Arithmetik; Git `rebase`, `cherry-pick`, `bisect`, Submodule.
- Video-Vorschaubilder werden von YouTube geladen (ohne Internet fehlen nur die Bilder).
- `becomestengineer.zip` im Ordner ist ein lokaler Export (per `.gitignore` ausgeschlossen) und kann gelöscht werden.
