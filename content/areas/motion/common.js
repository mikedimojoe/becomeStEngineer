'use strict';
// Gemeinsame Bausteine für den Bereich "Antriebstechnik" (motion).

const L = (...lines) => lines.join('\n') + '\n';
const ABG = 'Abgerufen am 10. November 2026, von ';

// B&R Online-Hilfe (Automation Studio 6, Deutsch). Pfade über die Such-API der Hilfe geprüft.
const HELP = p => 'https://help.br-automation.com/#/de/6/' + p;
const P = {
  mpAxisBasic: 'motion/mapp_motion/mapp_axis/programmierung/technologiebibliotheken/axis/funktionsbausteine/mpaxisbasic/mc_x.html',
  gsAchse: 'motion/mapp_motion/mapp_axis/getting_started/getting_started_achse/getting_started_achse.html',
  gsHardware: 'motion/mapp_motion/mapp_axis/getting_started/getting_started_achse/hardware_hinzufugen.html',
  gsKonfig: 'motion/mapp_motion/mapp_axis/getting_started/getting_started_achse/konfigurationsdatei_achse.html',
  gsCpuTiming: 'motion/mapp_motion/mapp_axis/getting_started/getting_started_achse/cpu_timing.html',
  gsVirtuell: 'motion/mapp_motion/mapp_axis/getting_started/getting_started_achse/purevax_hinzufugen.html',
  achse: 'motion/mapp_motion/mapp_axis/konzept/komponenten/achse/axis.html',
  units: 'motion/components/mpaxis/technische_informationen/messeinheiten_und_achsskalierung.html',
  p3: 'motion/mapp_motion/mapp_axis/konfiguration/hardware/acopos_p3/_acopos_p3.html',
  physicalView: 'projectmanagement/hwmanagement/physicalview/hwmanagement_physicalview.html',
  mappMotion: 'motion/mapp_motion/mapp_motion.html',
  state: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/technische_information/zustandsdiagramm.html',
  mcPower: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_power/mc_x.html',
  mcHome: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_home/startseite.html',
  mcMoveAbs: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_moveabsolute/fb_mc_moveabsolute.html',
  mcReset: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_reset/fb_reset.html',
  mcStop: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_stop/fb_stop.html',
  mcHalt: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_halt/fb_halt.html',
  mcGearIn: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_gearin/fb_gearin.html',
  mcCamIn: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_camin/fb_startseite.html',
  camAutCmd: 'motion/mapp_motion/mapp_axis/programmierung/kernbibliotheken/axis/funktionsbausteine/mc_br_camautomatcommand/fb_camaut.html',
  camAutomat: 'motion/mapp_motion/mapp_axis/konfiguration/basiselemente/axis_feature/cam_automat.html',
  querschneider: 'motion/components/mpaxis/anwendungsfalle/anwendungsfall_3/anwendungsfall_3.html',
  autotuning: 'motion/commissioning/autotuning/autotuning.html',
  autotuneUse: 'motion/mapp_motion/mapp_axis/anwendungsfalle/anwendungsfall_autotune/einleitung.html',
  posCtrl: 'motion/commissioning/autotuning/posctrl/posctrl.html',
  cockpit: 'motion/mapp_motion/mapp_axis/diagnose/mapp_cockpit/_mapp_cockpit.html',
  trace: 'diagnostics_support/diagnosis/trace/diagnosis_trace.html',
  speedTorque: 'motion/nc_diagnostics/as_inline_speed_torque/inline_speed_torque.html',
  robotics: 'motion/mapp_motion/mapp_robotics/mapp_robotics_startpage.html',
  mappCnc: 'motion/mapp_motion/mapp_robotics/config/mapp_cnc/mapp_cnc_.html',
  mechDesigns: 'motion/mapp_motion/allgemeines/konfiguration/mechatronic_designs/mechatronic_designs_.html',
  sto: 'safety/safety_hardware/safemotion/ms-safety/sicherheitstechnik/safe_torque_off,_sto.html',
  ss1: 'safety/safety_hardware/safemotion/ms-safety/sicherheitstechnik/safe_stop_1,_ss1.html',
  sls: 'safety/safety_hardware/safemotion/ms-safety/sicherheitstechnik/safely_limited_speed,_sls.html',
  p3Safe: 'safety/safety_hardware/safemotion/ms-safety/der_sichere_antriebsstrang_p3.html'
};

// Lesetext aus der B&R Online-Hilfe
function brHelp(key, title, minutes, why) {
  const url = HELP(P[key]);
  return {
    title, author: 'B&R Industrial Automation', institution: 'B&R Industrial Automation GmbH',
    work: 'Automation Studio 6 Online-Hilfe', year: 2026, type: 'Hersteller', minutes, url, why,
    apa: `B&R Industrial Automation. (2026). *${title}* [Online-Hilfe Automation Studio 6]. ${ABG}${url}`
  };
}
const helpLink = (key, label) => ({ label: 'B&R Hilfe: ' + label, url: HELP(P[key]) });

// FHNW-Skript Servotechnik (M. Pischtschan)
const FHNW = 'https://bookdown.org/martin_pischtschan/skript_mas_att/';
function fhnw(slug, chapter, minutes, why) {
  const url = FHNW + slug + '.html';
  return {
    title: chapter, author: 'Martin Pischtschan', institution: 'Fachhochschule Nordwestschweiz (FHNW)',
    work: 'Skript zum MAS Modul Servotechnik', year: 2024, type: 'Uni-Skript', minutes, url, why,
    apa: `Pischtschan, M. (2024). *Skript zum MAS Modul Servotechnik: ${chapter}*. Fachhochschule Nordwestschweiz. ${ABG}${url}`
  };
}

// Community-Beitrag
function community(id, slug, title, author, year, minutes, why) {
  const url = `https://community.br-automation.com/t/${slug}/${id}`;
  return {
    title, author, institution: 'B&R Community', work: 'B&R Community – Forum', year, type: 'Artikel', minutes, url, why,
    apa: `${author}. (${year}). *${title}* [Forumsbeitrag]. B&R Community. ${ABG}${url}`
  };
}

const R = {
  hawThesis: {
    title: 'Regelungstechnische Untersuchung eines Servoantriebs und Entwurf eines systemtheoretischen Simulationsmodells',
    author: 'Hannes Müller', institution: 'Hochschule für Angewandte Wissenschaften Hamburg', work: 'Bachelorthesis, Department Informations- und Elektrotechnik',
    year: 2012, type: 'Uni-Skript', minutes: 60, url: 'https://reposit.haw-hamburg.de/bitstream/20.500.12738/5682/1/Thesis_Hannes_Mueller_1916869.pdf',
    why: 'Zeigt an einem realen Servoantrieb, wie Strom-, Drehzahl- und Lageregler aufgebaut, gemessen und modelliert werden.',
    apa: 'Müller, H. (2012). *Regelungstechnische Untersuchung eines Servoantriebs und Entwurf eines systemtheoretischen Simulationsmodells* [Bachelorthesis]. Hochschule für Angewandte Wissenschaften Hamburg. ' + ABG + 'https://reposit.haw-hamburg.de/bitstream/20.500.12738/5682/1/Thesis_Hannes_Mueller_1916869.pdf'
  },
  paderborn: {
    title: 'Analysetool für die systematische Reglerinbetriebnahme von Servoantrieben',
    author: 'Harald Wertz; Stephan Beineke', institution: 'Universität Paderborn, Leistungselektronik und elektrische Antriebstechnik', work: 'Tagungsbeitrag SPS/IPC/Drives',
    year: 1999, type: 'Artikel', minutes: 30, url: 'https://ei.uni-paderborn.de/fileadmin/elektrotechnik/fg/lea/Forschung/Publikationen/1999/99SPS-Wertz-Beineke-Servoantriebe.pdf',
    why: 'Erklärt, warum die Inbetriebnahme der Reglerkaskade systematisch (innen nach außen) erfolgen muss und wie Mechanik-Resonanzen erkannt werden.',
    apa: 'Wertz, H., & Beineke, S. (1999). *Analysetool für die systematische Reglerinbetriebnahme von Servoantrieben*. Universität Paderborn. ' + ABG + 'https://ei.uni-paderborn.de/fileadmin/elektrotechnik/fg/lea/Forschung/Publikationen/1999/99SPS-Wertz-Beineke-Servoantriebe.pdf'
  },
  isbMechatronik: {
    title: 'Lehrplanrichtlinien für die Berufsschule – Fachklassen Mechatroniker/Mechatronikerin',
    author: 'Bayerisches Staatsministerium für Unterricht und Kultus', institution: 'ISB – Staatsinstitut für Schulqualität und Bildungsforschung', work: 'Lehrplanrichtlinien Berufsschule',
    year: 2018, type: 'Norm/Amtlich', minutes: 20, url: 'https://www.isb.bayern.de/fileadmin/user_upload/Berufliche_Schulen/Berufsschule/Lehrplan/bs_lpr_mechatroniker.pdf',
    why: 'Lernfeld „Design und Erstellen mechatronischer Systeme“: Antriebe steuern und regeln, Positionierungsvorgänge, Getriebe und Kupplungen – der Rahmen, den dieser Bereich vertieft.',
    apa: 'Bayerisches Staatsministerium für Unterricht und Kultus. (2018). *Lehrplanrichtlinien für die Berufsschule: Fachklassen Mechatroniker/Mechatronikerin*. ISB. ' + ABG + 'https://www.isb.bayern.de/fileadmin/user_upload/Berufliche_Schulen/Berufsschule/Lehrplan/bs_lpr_mechatroniker.pdf'
  },
  plcopenMotion: {
    title: 'Motion Control – PLCopen Standards', author: 'PLCopen', institution: 'PLCopen', work: 'PLCopen Technical Committee 2 – Motion Control',
    year: 2024, type: 'Dokumentation', minutes: 15, url: 'https://www.plcopen.org/standards/motion-control/',
    why: 'Übersicht über die Teile der PLCopen-Motion-Spezifikation (Einzelachse, Koordinierte Bewegung, Benutzerrichtlinien) direkt vom Herausgeber.',
    apa: 'PLCopen. (2024). *Motion Control* [Standardübersicht]. ' + ABG + 'https://www.plcopen.org/standards/motion-control/'
  },
  probst: {
    title: 'Servoantriebe in der Automatisierungstechnik', author: 'Uwe Probst', institution: 'Springer Vieweg (Autor: TH Mittelhessen)', work: 'Fachbuch, 3. Auflage',
    year: 2022, type: 'Fachbuch', minutes: 20, url: 'https://link.springer.com/book/10.1007/978-3-658-37423-5',
    why: 'Deutschsprachiges Standardwerk zu Servomotoren, Gebern, Kaskadenregelung und Auslegung – Inhaltsverzeichnis und Kapitelzusammenfassungen frei einsehbar.',
    apa: 'Probst, U. (2022). *Servoantriebe in der Automatisierungstechnik* (3. Aufl.). Springer Vieweg. ' + ABG + 'https://link.springer.com/book/10.1007/978-3-658-37423-5'
  }
};

// Videos (Titel/Kanal exakt aus oEmbed)
const V = {
  servo: { id: 'g4BM1pjm64s', title: 'Servomotor erklärt', channel: 'Ingenieursmentalität', lang: 'de' },
  fu: { id: '7ewfF9Mx9CQ', title: 'Frequenzumrichter einfach erklärt: Aufbau und Funktionsweise', channel: '#Sogeht by Sven Stemmler', lang: 'de' },
  geber: { id: 'HuTYOTvjv5U', title: 'Drehgeber Inkrementalgeber Funktionsweise | Zerlegung Aufbau & Funktion - einfach erklärt | Tutorial', channel: 'Afug-Info', lang: 'de' },
  p3: { id: 'ezs_pYA7Ux4', title: 'ACOPOS P3', channel: 'B&R Industrial Automation', lang: 'en' },
  acpMotor: { id: 'h_NRiwyXEIw', title: 'ACOPOSmotor', channel: 'B&R Industrial Automation', lang: 'en' },
  mappAxis1: { id: 'v3YAAWYo72c', title: 'mapp Axis 1 - How to start a single axis [sub: EN, JA, PL, PT-BR, RU]', channel: 'B&R Industrial Automation', lang: 'en' },
  autoKidMpAxis: { id: 'M8UP5d33rEg', title: 'B&R Motion Control ACP 10 Basics Ex 4: Setting up the MpAxisBasic Program for axis control', channel: 'The Automation Kid', lang: 'en' },
  mappAxisFw: { id: 'WEeM4o5AW0o', title: 'mapp Axis Framework Tutorial', channel: 'B&R Industrial Automation', lang: 'en' },
  plcopen: { id: '2u9jKBaIeW0', title: 'PLCopen Motion Control', channel: 'PLCopen', lang: 'en' },
  plcopenEx: { id: '5imUSMskRTk', title: 'PLCopen Motion Control Examples', channel: 'PLCopen', lang: 'en' },
  twincatFb: { id: 'Q89wjAedRYw', title: 'TwinCAT 3 Motion Control (Part 2): PLCopen Motion Function Blocks Explained', channel: 'ControlX Automation', lang: 'en' },
  twincatHoming: { id: 'EoeBz4Ic-rM', title: 'TwinCAT 3 Motion Control (Part 3): Homing, Jogging & Motion Diagnostics', channel: 'ControlX Automation', lang: 'en' },
  cia402: { id: 'liivzEriWh4', title: 'CiA 402 Explained: The State Machine Every Drive Runs', channel: 'ControlX Automation', lang: 'en' },
  units: { id: 'GsBk6G42Uvs', title: 'Unit management in mapp [sub: EN, DE, PL]', channel: 'B&R Industrial Automation', lang: 'en' },
  griesMotion: { id: 'F96VDok5uNs', title: 'Motion Anwendungen, PLCOpen, Positionierung, Synchronisierung, Kurvenscheibe CAM | Prof. Gries.', channel: 'Prof Joe', lang: 'de' },
  griesRegelung: { id: '4upWwz__9eY', title: 'Motion, Soft Motion, Gleichstrommaschine, Moment/Drehzahl/Lage-Regelung | Prof. Griesbauer', channel: 'Prof Joe', lang: 'de' },
  griesBahn: { id: '8__dX87pk4U', title: 'Bahnsteuerung, Steuerdaten (SDA), Geometriedaten (GEO), Interpolation, Transformation | Prof. Gries.', channel: 'Prof Joe', lang: 'de' },
  camBr: { id: 'OnR2WXojfH8', title: 'B&R Motion Control: Cam profile and master follower 4 axes', channel: 'Phi Huynh', lang: 'en' },
  camOmron: { id: 'wlv_quC1BQw', title: 'E-Cam motion control with Omron NJ series over EtherCAT', channel: 'GOH CHOON LIN', lang: 'en' },
  gear: { id: 'c2hw1VHgcg8', title: 'Electronic Gearing or Master-Follower, a built-in function of Servosila SC-series servo drives.', channel: 'Servosila: Motion Control & Artifical Intelligence', lang: 'en' },
  trace: { id: 'r9oJctqcCZg', title: 'PLC Trace in Automation Studio | B&R Industrial Automation', channel: 'AutoMates', lang: 'en' },
  flySawZub: { id: 'R-ZK623kcBI', title: 'zub AG | Programming a flying saw with a zub MACS5 controller.', channel: 'MotionControlExperts', lang: 'en' },
  flyShearMits: { id: '_ab4bH9pBiQ', title: 'Mitsubishi Electric Demo: Flying Shear MR-MQ100 Single-Axis Motion Controller', channel: 'Mitsubishi Electric US - Industrial Automation', lang: 'en' },
  flyShearOmron: { id: 'KV8kHFiYQeA', title: 'Create Flying shear and Rotary cut application with Omron NX102 motion control', channel: 'TehranPLC  -  اتوماسیون صنعتی', lang: 'en' },
  kaskade: { id: 'KHZGuQdVFeg', title: '6.4.1 Kaskadenregelung', channel: 'Jörg Buchholz', lang: 'de' },
  resonance: { id: 'UXeXL_c9BNI', title: 'Stop Resonant Sounds - Servo Tuning', channel: 'Yaskawa America - Drives & Motion Division', lang: 'en' },
  servosoft: { id: 'HFc5uSGhGx4', title: 'Onlinecourse Teaser: Sizing a B&R Servos system with Servosoft #shorts', channel: 'B&R Industrial Automation', lang: 'en' },
  sizing: { id: '4MaGqSQfYOk', title: 'Servo Motor Sizing Basics Part 1 - Core Concepts', channel: 'Yaskawa America - Drives & Motion Division', lang: 'en' },
  inertia: { id: '6Qb4E2iq7dg', title: 'Tutorial: Motor Inertia Ratios', channel: 'Anaheim Automation, Inc', lang: 'en' },
  robotics: { id: 'dTGhaujrC0M', title: 'B&R mapp Robotics  Tutorial# 1', channel: 'Brent Johnson', lang: 'en' },
  cnc: { id: 'YcmxL4RHz14', title: 'B&R mapp Motion  First  CNC Program Tutorial# 1', channel: 'Brent Johnson', lang: 'en' },
  mappFw: { id: '-nH08fDesrE', title: 'mapp Framework Overview', channel: 'B&R Industrial Automation', lang: 'en' },
  mappConcept: { id: 'k5O5zhkPAAM', title: 'mapp concept - What is mapp Technology? [sub: EN, DE, JA, PL, PT-BR, RU]', channel: 'B&R Industrial Automation', lang: 'en' },
  safetyPlus: { id: 'kJU-327Xs3Q', title: 'Welcome to a new era in machine safety: Meet Safety+ by B&R', channel: 'B&R Industrial Automation', lang: 'en' },
  ss1: { id: 'GYxzR8-34A4', title: 'Schmersal Product Animations - PSC1 Functions: SS1 Safe Stop 1', channel: 'SchmersalUSA', lang: 'en' },
  sinamicsSafety: { id: 'V2G6Hexaydo', title: 'SINAMICS Drive Software - In den Antrieb integrierte Sicherheitsfunktionen', channel: 'Siemens Knowledge Hub', lang: 'de' },
  sto: { id: '1b8Sj4nBXs0', title: 'What is Safe Torque Off? - A Galco TV Tech Tip | Galco', channel: 'GalcoTV', lang: 'en' }
};
const vid = (key, why) => Object.assign({}, V[key], { why });

// Standard-I/O für Übungen mit simulierter Einzelachse
const ioAxisOut = [
  { name: 'rAxisPos', type: 'REAL', dir: 'out', label: 'Istposition Achse', widget: 'gauge', min: 0, max: 500, unit: 'mm' },
  { name: 'rAxisVel', type: 'REAL', dir: 'out', label: 'Istgeschwindigkeit Achse', widget: 'value', unit: 'mm/s' }
];

module.exports = { L, ABG, HELP, P, brHelp, helpLink, fhnw, community, R, V, vid, ioAxisOut };
