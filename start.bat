@echo off
REM becomeStEngineer – Start unter Windows (Node.js 22.13 oder neuer muss installiert sein)
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js fehlt. Bitte von https://nodejs.org die LTS-Version installieren. & pause & exit /b 1)
if "%PORT%"=="" set PORT=8080
echo Starte becomeStEngineer auf http://localhost:%PORT% ...
node server\server.js
pause
