'use strict';
// Gemeinsame Bausteine für den Bereich "Versionsverwaltung" (git).

const L = (...lines) => lines.join('\n') + '\n';
const ABGERUFEN = 'Abgerufen am 10. November 2026, von ';
const SERVER = 'https://git.breitner.de/ausbildung/';

// Minimales AS6-Projektgerüst (nur die versionierten Quelldateien)
function asProject(name, mainBody) {
  return {
    [name + '.apj']: L('<?xml version="1.0" encoding="utf-8"?>', '<?AutomationStudio Version="6.0"?>', '<Project Description="' + name + '" />'),
    'Logical/Package.pkg': L('<?xml version="1.0" encoding="utf-8"?>', '<Package>', '  <Objects>', '    <Object Type="Program">Main</Object>', '  </Objects>', '</Package>'),
    'Logical/Main/Main.st': mainBody || L('PROGRAM _INIT', 'END_PROGRAM', '', 'PROGRAM _CYCLIC', '\tdoMotor := diStart AND NOT bStop;', 'END_PROGRAM'),
    'Logical/Main/Main.var': L('VAR', '\tbStop : BOOL;', 'END_VAR'),
    'Physical/Config1/Hardware.hw': L('<?xml version="1.0" encoding="utf-8"?>', '<Hardware>', '  <Module Name="X20CP1584" Type="X20CP1584" />', '</Hardware>'),
    'Physical/Config1/X20CP1584/Cpu.sw': L('<?xml version="1.0" encoding="utf-8"?>', '<SwConfiguration>', '  <TaskClass Name="Cyclic#1">', '    <Task Name="Main" Source="Main.prg" />', '  </TaskClass>', '</SwConfiguration>')
  };
}

const GITIGNORE_AS = L('# Automation Studio – generierte Dateien', 'Temp/', 'Binaries/', 'Diagnosis/', '*.isopen', '/*.set');

module.exports = { L, ABGERUFEN, SERVER, asProject, GITIGNORE_AS };
