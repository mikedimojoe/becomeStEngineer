// Geprüfte Text-Quellen für den Bereich "system".
// B&R-Hilfe-Seiten wurden über die Such-/Content-API von help.br-automation.com auf Existenz geprüft
// (Pfad + Seitentitel, AS6, Sprache DE). Alle übrigen URLs liefern HTTP 200 (Stand 10.11.2026).
'use strict';

const ACC = 'Abgerufen am 10. November 2026, von ';
const HELP = 'https://help.br-automation.com/#/de/6/';

// Seite der B&R Automation Help (AS6, deutsch)
function help(path, title, minutes) {
  const url = HELP + path;
  return {
    title, author: 'B&R Industrial Automation', institution: 'B&R Industrial Automation GmbH',
    work: 'Automation Help (Automation Studio 6)', year: 2026, type: 'Hersteller', minutes, url,
    apa: `B&R Industrial Automation. (2026). *${title}*. In Automation Help (Automation Studio 6). ${ACC}${url}`
  };
}

// Beitrag in der B&R Community
function community(path, title, author, year, minutes) {
  const url = 'https://community.br-automation.com/t/' + path;
  return {
    title, author, institution: 'B&R Community (community.br-automation.com)', work: 'B&R Community – Fachbeitrag',
    year, type: 'Artikel', minutes, url,
    apa: `${author}. (${year}). *${title}* [Forenbeitrag]. B&R Community. ${ACC}${url}`
  };
}

const R = {
  // --- Hochschul-/Uni-Skripte ---
  thmSps: {
    title: 'Grundwissen SPS-Technik', author: 'Technische Hochschule Mittelhessen',
    institution: 'Technische Hochschule Mittelhessen (THM)', work: 'Vorlesungsskript SPS', year: 2010,
    type: 'Uni-Skript', minutes: 40, url: 'https://homepages.thm.de/~mlth53/wp-content/uploads/2010/04/sps',
    apa: 'Technische Hochschule Mittelhessen. (2010). *Grundwissen SPS-Technik* [Vorlesungsskript]. ' + ACC + 'https://homepages.thm.de/~mlth53/wp-content/uploads/2010/04/sps'
  },
  iasStrukturen: {
    title: 'Kapitel 2: Automatisierungs-Gerätesysteme und -strukturen', author: 'Institut für Automatisierungs- und Softwaretechnik (IAS)',
    institution: 'Universität Stuttgart (bereitgestellt von der FAU Erlangen-Nürnberg)', work: 'Vorlesung Prozessautomatisierung 1', year: 2003,
    type: 'Uni-Skript', minutes: 45, url: 'https://www4.informatik.uni-erlangen.de/Lehre/WS03/V_STP1/Skript/stp1-pa-ws03-kapitel2.pdf',
    apa: 'Institut für Automatisierungs- und Softwaretechnik. (2003). *Kapitel 2: Automatisierungs-Gerätesysteme und -strukturen* [Vorlesungsfolien Prozessautomatisierung 1]. Universität Stuttgart. ' + ACC + 'https://www4.informatik.uni-erlangen.de/Lehre/WS03/V_STP1/Skript/stp1-pa-ws03-kapitel2.pdf'
  },
  tumEchtzeit: {
    title: 'Echtzeitsysteme (Vorlesungsfolien WS 2008/2009)', author: 'Knoll, A., & Buckl, C.',
    institution: 'Technische Universität München, Lehrstuhl Robotics and Embedded Systems', work: 'Vorlesung Echtzeitsysteme', year: 2008,
    type: 'Uni-Skript', minutes: 60, url: 'https://archive.air.in.tum.de/pub/Main/TeachingWs2008Echtzeitsysteme/echtzeit_komplett.pdf',
    apa: 'Knoll, A., & Buckl, C. (2008). *Echtzeitsysteme* [Vorlesungsfolien, WS 2008/2009]. Technische Universität München. ' + ACC + 'https://archive.air.in.tum.de/pub/Main/TeachingWs2008Echtzeitsysteme/echtzeit_komplett.pdf'
  },
  tudScheduling: {
    title: 'Schedulingstrategien für Echtzeitsysteme', author: 'Schirmeier, H.',
    institution: 'Technische Universität Dresden, Professur für Betriebssysteme', work: 'Vorlesung Betriebssysteme und Sicherheit', year: 2022,
    type: 'Uni-Skript', minutes: 40, url: 'https://os.inf.tu-dresden.de/Studium/Bs/WS2022/V05-Echtzeitsysteme.pdf',
    apa: 'Schirmeier, H. (2022). *Schedulingstrategien für Echtzeitsysteme* [Vorlesungsfolien Betriebssysteme und Sicherheit]. Technische Universität Dresden. ' + ACC + 'https://os.inf.tu-dresden.de/Studium/Bs/WS2022/V05-Echtzeitsysteme.pdf'
  },
  // --- Fachliteratur / Hersteller (Vergleich) ---
  beckhoffIec: {
    title: 'Einleitung IEC 61131-3 Programmierung', author: 'Beckhoff Automation',
    institution: 'Beckhoff Automation GmbH & Co. KG', work: 'TwinCAT Dokumentation', year: 2003,
    type: 'Hersteller', minutes: 40, url: 'https://download.beckhoff.com/download/document/Software/TwinCAT/Einleitung_IEC1131-3_Programmierung.pdf',
    apa: 'Beckhoff Automation. (o. J.). *Einleitung IEC 61131-3 Programmierung*. Beckhoff Automation GmbH & Co. KG. ' + ACC + 'https://download.beckhoff.com/download/document/Software/TwinCAT/Einleitung_IEC1131-3_Programmierung.pdf'
  },
  siemensZyklus: {
    title: 'S7-1500, ET 200MP, ET 200SP, ET 200AL, ET 200pro, ET 200eco PN – Zyklus- und Reaktionszeiten (Funktionshandbuch)', author: 'Siemens AG',
    institution: 'Siemens AG', work: 'SIMATIC Funktionshandbuch', year: 2019,
    type: 'Hersteller', minutes: 45, url: 'https://cache.industry.siemens.com/dl/files/558/59193558/att_112302/v1/s71500_cycle_and_reaction_times_function_manual_de-DE_de-DE.pdf',
    apa: 'Siemens AG. (o. J.). *SIMATIC S7-1500 – Zyklus- und Reaktionszeiten* [Funktionshandbuch]. ' + ACC + 'https://cache.industry.siemens.com/dl/files/558/59193558/att_112302/v1/s71500_cycle_and_reaction_times_function_manual_de-DE_de-DE.pdf'
  },
  // --- Amtliche Quellen ---
  elektroAnl4: {
    title: 'Verordnung über die Berufsausbildung in den industriellen Elektroberufen – Anlage 4: Ausbildungsrahmenplan Elektroniker/-in für Automatisierungstechnik',
    author: 'Bundesministerium der Justiz', institution: 'Bundesrepublik Deutschland (gesetze-im-internet.de)', work: 'IndElAusbV 2007', year: 2018,
    type: 'Norm/Amtlich', minutes: 20, url: 'https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html',
    apa: 'Bundesministerium der Justiz. (2018). *Verordnung über die Berufsausbildung in den industriellen Elektroberufen, Anlage 4 (zu § 15): Ausbildungsrahmenplan Elektroniker für Automatisierungstechnik*. ' + ACC + 'https://www.gesetze-im-internet.de/indelausbv_2007/anlage_4.html'
  },
  bsiFernwartung: {
    title: 'Fernwartung im industriellen Umfeld (BSI-CS 108)', author: 'Bundesamt für Sicherheit in der Informationstechnik',
    institution: 'Bundesamt für Sicherheit in der Informationstechnik (BSI)', work: 'BSI-Veröffentlichungen zur Cyber-Sicherheit', year: 2018,
    type: 'Norm/Amtlich', minutes: 20, url: 'https://www.allianz-fuer-cybersicherheit.de/SharedDocs/Downloads/Webs/ACS/DE/BSI-CS/BSI-CS_108.pdf?__blob=publicationFile',
    apa: 'Bundesamt für Sicherheit in der Informationstechnik. (2018). *Fernwartung im industriellen Umfeld* (BSI-CS 108, Version 2.0). ' + ACC + 'https://www.allianz-fuer-cybersicherheit.de/SharedDocs/Downloads/Webs/ACS/DE/BSI-CS/BSI-CS_108.pdf?__blob=publicationFile'
  },
  bsiIcs: {
    title: 'ICS-Security-Kompendium', author: 'Bundesamt für Sicherheit in der Informationstechnik',
    institution: 'Bundesamt für Sicherheit in der Informationstechnik (BSI)', work: 'ICS-Security', year: 2013,
    type: 'Norm/Amtlich', minutes: 60, url: 'https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/ICS/ICS-Security_kompendium_pdf.pdf?__blob=publicationFile&v=1',
    apa: 'Bundesamt für Sicherheit in der Informationstechnik. (2013). *ICS-Security-Kompendium*. ' + ACC + 'https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/ICS/ICS-Security_kompendium_pdf.pdf?__blob=publicationFile&v=1'
  },
  // --- B&R Automation Help (AS6) ---
  hInstall: help('diagnostics_support/install/installation_as_main.html', 'Automation Studio – Systemvoraussetzungen, Installation, Lizenzierung', 20),
  hUpgrades: help('projectmanagement/upgrades/updates_local.html', 'Lokale Upgrades', 10),
  hVersionConflict: help('projectmanagement/upgrades/updates_vermismatch.html', 'Versionskonflikte beim Projekt öffnen', 10),
  hOpenProject: help('projectmanagement/general/projectorganisation_general_openproject.html', 'Bestehendes Projekt öffnen', 10),
  hPhysical: help('projectmanagement/hwmanagement/physicalview/hwmanagement_physicalview.html', 'Physical View', 15),
  hIoMapping: help('programming/io/mapping/programmingmodel_io_mapping.html', 'I/O Zuordnung', 20),
  hArsim: help('automationruntime/targets/ar000/ar000index.htm', 'ARsim', 20),
  hCpuSim: help('projectmanagement/systemconfiguration/sg4/cpu/projectorganisation_systemconfiguration_sg4_cpu_simu.html', 'Eigenschaften der CPU – Simulation', 10),
  hConnect: help('gettingstarted/firstprojectphysical_online.htm', 'Verbindung herstellen', 10),
  hTransfer: help('gettingstarted/online_installation.htm', 'Übertragen des Projektes', 10),
  hShortcutsBuild: help('projectmanagement/shortcuts/desktop_shortcuts_buildtransfer.html', 'Tastenkombinationen – Erstellen und Übertragen', 5),
  hOperation: help('automationruntime/operationmethode/operationmode.html', 'Betriebszustände', 20),
  hOnlineMenu: help('projectmanagement/menus/desktop_menus_online.html', 'Menü Online', 10),
  hTaskClasses: help('automationruntime/taskclasses/taskclasses_normal_sg4.html', 'Zyklische Taskklassen', 15),
  hCycleMon: help('automationruntime/operationmethode/moduledatasec/cycletimemonitoring.html', 'Zykluszeitüberwachung', 10),
  hException: help('automationruntime/taskclasses/exceptiontaskclass/exceptionstaskclass_sg4.htm', 'Exception Taskklasse', 15),
  hLogger: help('diagnostics_support/diagnosis/logger/diagnosis_logger.html', 'Logger', 15),
  hWatch: help('diagnostics_support/diagnosis/watch/diagnosis_watch.html', 'Variablenmonitor (Watch)', 15),
  hSysError: help('diagnostics_support/sys_error/files/sys_error.htm', 'Automation Runtime Systemfehler', 10),
  hRestart: help('diagnostics_support/sys_error/files/9200-9299_index.html', '9200 – 9299 AR-Neustartgründe', 10),
  hSdm: help('automationruntime/targets/sdm/sdm.htm', 'System Diagnostics Manager (SDM)', 15),
  hSdmAccess: help('automationruntime/targets/sdm/sdm/sdm_access.htm', 'Zugriff auf den System Diagnostics Manager', 10),
  hSdmDump: help('automationruntime/targets/sdm/sdm/sdm2_sdmpage_systemdump.html', 'SDM – System Dump', 10),
  hMemory: help('automationruntime/operationmethode/memory_gen.html', 'Speicher', 15),
  hRetain: help('programming/variables/retainvariables_remanentevariablen.html', 'Remanente Variablen', 15),
  hPermanent: help('programming/variables/retainvariables_permanentevariablen.html', 'Permanente Variablen', 15),
  hBreakpoints: help('diagnostics_support/diagnosis/debugging/diagnosis_debugging_breakpoints.html', 'Debugger – Haltepunkte', 15),
  hShortcutsDebug: help('projectmanagement/shortcuts/desktop_shortcuts_debugger.html', 'Tastenkombinationen – Debugger', 5),
  hLineCoverage: help('diagnostics_support/diagnosis/monitormode/linecoverage/diagnosis_monitormode_linecoverage.html', 'Zeilenüberwachung (Line Coverage)', 10),
  hTrace: help('diagnostics_support/diagnosis/trace/diagnosis_trace.html', 'Trace', 20),
  hProfiler: help('diagnostics_support/diagnosis/profile/diagnosis_profile.html', 'Profiler', 20),
  hRucExport: help('automationruntime/enhancedtransfer/handling/export_ruc/export_ruc.html', 'Projektinstallation mittels RUC – Übersicht', 15),
  hRuc: help('automationnet/pvitransfer/pvitransfer.html', 'Runtime Utility Center', 15),
  hInstallPackage: help('gettingstarted/firstprojectnocf_physical_remote.htm', 'Erstes Projekt mittels Installationspaket übertragen', 20),
  hUserPartition: help('automationruntime/operationmethode/moduledatasec/userpartition.html', 'Benutzerpartition', 10),
  hConfigView: help('projectmanagement/configurationview/projectorganisation_configurationview.html', 'Configuration View', 15),
  hHypervisor: help('automationruntime/targets/hypervisor/hypervisor.html', 'B&R Hypervisor', 20),
  hTechGuard: help('revinfos/technologyguarding/technology_guarding.html', 'Technology Guarding', 15),
  hLicense: help('diagnostics_support/install/installation_as_license.html', 'Lizenzierung', 10),
  hRemote: help('communication/remotemaintenance/remotemaintanance.html', 'Fernwartung', 15),
  hSrm: help('hardware/secure_remote_maintenance/secure_remote_maintenance.html', 'Secure Remote Maintenance', 15),
  // --- B&R Community ---
  cUpdateGuide: community('guideline-minimizing-information-loss-risks-during-plc-software-updates/9831', 'Guideline: Minimizing Information Loss Risks During PLC Software Updates', 'Banfi, N.', 2026, 15),
  cSystemDump: community('how-to-collect-a-system-dump-from-a-b-r-controller/10497', 'How to collect a System Dump from a B&R controller', 'Laury, R.', 2026, 10),
  cHypervisorWin: community('hypervisor-installation-guide-windows/4593', 'Hypervisor Installation Guide: Windows', 'Hairston, C.', 2024, 20),
  cTpUpgrade: community('automation-studio-tools-upgrades-i-dont-see-the-technology-package-version-that-i-need-what-can-i-do/10369', 'Automation Studio > Tools > Upgrades... > I don\'t see the technology package version that I need, What can I do?', 'Manenti, V.', 2026, 10),
  cCycleViolation: community('cycle-time-violations-on-plc-due-to-cycle-time-settings/3142', 'Cycle time violations on PLC due to cycle time settings', 'Alumur, Ö. S.', 2024, 10),
  cLogging: community('access-to-logging-in-plc/3243', 'Access to logging in PLC', 'Tham, K.', 2024, 10)
};

// r(key, why) -> Reading-Objekt
function r(key, why) {
  const x = R[key];
  if (!x) throw new Error('Text nicht verifiziert: ' + key);
  return Object.assign({}, x, { why });
}

module.exports = { r, R };
