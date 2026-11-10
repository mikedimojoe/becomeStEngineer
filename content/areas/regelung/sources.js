// Gemeinsame, geprüfte Quellen für den Bereich Regelungstechnik (URLs per curl/API verifiziert).
'use strict';
const H = 'https://help.br-automation.com/#/de/6/';
const MT = H + 'mechatronics/mappcontrol/mappcontroltools/';
const MTB = MT + 'bibliotheken/mtbasics/funktionsbausteine/';
const ABGERUFEN = 'Abgerufen am 10. November 2026, von ';

const url = {
  mtbasicsPid: MTB + 'mtbasicspid/mtbasicspid.html',
  mtbasicsPidFunktion: MTB + 'mtbasicspid/funktionsbeschreibung.html',
  mtbasicsPidSyntax: MTB + 'mtbasicspid/aufrufsyntax.html',
  mtbasicsPwm: MTB + 'mtbasicspwm/mtbasicspwm.html',
  mtbasicsPt1: MTB + 'mtbasicspt1/mtbasicspt1.html',
  mtbasicsLimiter: MTB + 'mtbasicslimiter/mtbasicslimiter.html',
  mtbasicsTimeDelay: MTB + 'mtbasicstimedelay/mtbasicstimedelay.html',
  mtbasicsStepTuning: MTB + 'mtbasicssteptuning/mtbasicssteptuning.html',
  mtbasicsOscTuning: MTB + 'mtbasicsoscillationtuning/mtbasicsoscillationtuning.html',
  mtbasicsFbs: MTB + 'funktionsbausteine.html',
  mtFilterMovAvg: MT + 'bibliotheken/mtfilter/funktionsbausteine/mtfiltermovingaverage/mtfiltermovingaverage.html',
  mtFilterLowPass: MT + 'bibliotheken/mtfilter/funktionsbausteine/mtfilterlowpass/mtfilterlowpass.html',
  mtFilterFbs: MT + 'bibliotheken/mtfilter/funktionsbausteine/funktionsbausteine.html',
  mtIdentify: MT + 'bibliotheken/mtidentify/fbks/mtidentifytransferfcn/mtidentifytransferfcn.html',
  mtCore: MT + 'bibliotheken/core.html',
  mtUseCases: MT + 'anwendungsfalle/anwendungsfalle.html',
  mtUseCase1: MT + 'anwendungsfalle/anwendungsfall_1.html',
  mtUseCase3: MT + 'anwendungsfalle/anwendungsfall_3.html',
  mtUseCase5: MT + 'anwendungsfalle/anwendungsfall_5.html',
  mtGettingStarted: MT + 'leitfaden/gettingstarted/gettingstarted.html',
  mtTempConcept: H + 'mechatronics/mappcontrol/mapptemperature/konzept/konzept.html',
  mtTempStepTuning: H + 'mechatronics/mappcontrol/mapptemperature/anwendungsfalle/tunen_eines_unbekannten_temperatursystems_mit_einem_step-tuning.html',
  mtTempOvershoot: H + 'mechatronics/mappcontrol/mapptemperature/leitfaden/inbetriebnahme/04_uberschwingen.html',
  mtTempGettingStarted: H + 'mechatronics/mappcontrol/mapptemperature/leitfaden/gettingstarted/regler_funktionsbaustein/regler_funktionsbaustein.html',
  mtTempLib: H + 'libraries/mttemp/mttemp.html',
  mtTempTuning: H + 'libraries/mttemp/fbks/mttemptuning/mttemptuning.html',
  mtTempController: H + 'libraries/mttemp/fbks/mttempcontroller/mttempcontroller.html',
  mtTypes: H + 'libraries/mttypes/datentypen/datentypen.html',
  taskClasses: H + 'automationruntime/taskclasses/taskclasses_normal_sg4.html',
  trace: H + 'diagnostics_support/diagnosis/trace/diagnosis_trace.html',
  traceConfig: H + 'diagnostics_support/diagnosis/trace/diagnosis_trace_how_to_04.html',
  // Hochschul-Skripte und freie Fachtexte
  grazRS: 'https://tugraz.at/fileadmin/user_upload/Institute/IRT/Skripten/Regelungssysteme_WS2425.pdf',
  tubsGdR: 'https://www.fzt.haw-hamburg.de/pers/Scholz/materialFM2/Skript_GdR.pdf',
  tubsEMDR: 'https://www.tu-braunschweig.de/fileadmin/Redaktionsgruppen/Institute_Fakultaet_5/IFR/Dateien_RT/Erweiterte_Methoden_der_RT/Skript_EMDR.pdf',
  freiburgSR: 'https://www.imtek.uni-freiburg.de/data/lehrstuehle/systemtheorie/dokumente/lehre/systemtheorie-und-regelungstechnik/systemtheorie.pdf',
  hszgBO: 'https://www.hszg.de/fileadmin/user_upload/Redakteure/PRIVAT/Labore_E/Automatisierungstechnik/46-Labor_Regelungstechnik_1/Prakt_RT1_04BO.pdf',
  samsonL101: 'https://norway.samsongroup.com/document/l101de.pdf',
  samsonL102: 'https://norway.samsongroup.com/document/l102de.pdf',
  beckhoffTuning: 'https://infosys.beckhoff.com/content/1031/tf4100_tc3_controller_toolbox/245519115.html'
};

// Lesetexte (APA-Zitat mit Abrufdatum)
const R = {
  grazRS: (why, minutes, chapter) => ({
    title: 'Regelungssysteme – Skriptum' + (chapter ? ' (' + chapter + ')' : ''),
    author: 'Institut für Regelungs- und Automatisierungstechnik',
    institution: 'Technische Universität Graz', work: 'Vorlesungsskriptum Regelungssysteme, Version vom 30.01.2025',
    year: 2025, type: 'Uni-Skript', minutes, url: url.grazRS, why,
    apa: 'Institut für Regelungs- und Automatisierungstechnik. (2025). *Regelungssysteme* [Vorlesungsskriptum]. Technische Universität Graz. ' + ABGERUFEN + url.grazRS
  }),
  tubsGdR: (why, minutes, chapter) => ({
    title: 'Grundlagen der Regelungstechnik' + (chapter ? ' (' + chapter + ')' : ''),
    author: 'Schumacher, W. & Leonhard, W.',
    institution: 'Technische Universität Braunschweig, Institut für Regelungstechnik (bereitgestellt über HAW Hamburg)',
    work: 'Vorlesungsskript, Stand 20.10.2003', year: 2003, type: 'Uni-Skript', minutes, url: url.tubsGdR, why,
    apa: 'Schumacher, W., & Leonhard, W. (2003). *Grundlagen der Regelungstechnik* [Vorlesungsskript]. Technische Universität Braunschweig. ' + ABGERUFEN + url.tubsGdR
  }),
  tubsEMDR: (why, minutes, chapter) => ({
    title: 'Erweiterte Methoden der Regelungstechnik' + (chapter ? ' (' + chapter + ')' : ''),
    author: 'Schumacher, W.', institution: 'Technische Universität Braunschweig, Institut für Regelungstechnik',
    work: 'Vorlesungsskript, Stand 09.07.2019', year: 2019, type: 'Uni-Skript', minutes, url: url.tubsEMDR, why,
    apa: 'Schumacher, W. (2019). *Erweiterte Methoden der Regelungstechnik* [Vorlesungsskript]. Technische Universität Braunschweig. ' + ABGERUFEN + url.tubsEMDR
  }),
  freiburgSR: (why, minutes, chapter) => ({
    title: 'Systemtheorie und Regelungstechnik 1' + (chapter ? ' (' + chapter + ')' : ''),
    author: 'Diehl, M.', institution: 'Albert-Ludwigs-Universität Freiburg, IMTEK',
    work: 'Skript zur Vorlesung, Stand 19.08.2014', year: 2014, type: 'Uni-Skript', minutes, url: url.freiburgSR, why,
    apa: 'Diehl, M. (2014). *Skript zur Vorlesung „Systemtheorie und Regelungstechnik 1“*. Universität Freiburg. ' + ABGERUFEN + url.freiburgSR
  }),
  hszgBO: (why, minutes) => ({
    title: 'Praktikum Regelungstechnik I – Versuch Betragsoptimum',
    author: 'Kästner, W. & Sbieschni, M.', institution: 'Hochschule Zittau/Görlitz, Fakultät Elektrotechnik und Informatik',
    work: 'Praktikumsanleitung Regelungstechnik I', year: 2016, type: 'Uni-Skript', minutes, url: url.hszgBO, why,
    apa: 'Kästner, W., & Sbieschni, M. (2016). *Praktikum Regelungstechnik I: Versuch Betragsoptimum* [Praktikumsanleitung]. Hochschule Zittau/Görlitz. ' + ABGERUFEN + url.hszgBO
  }),
  samsonL101: (why, minutes) => ({
    title: 'Begriffe und Symbole der Regelungstechnik', author: 'SAMSON AG', institution: 'SAMSON AG, Frankfurt am Main',
    work: 'Technische Information, Teil 1: Grundlagen (L101)', year: 2000, type: 'Hersteller', minutes, url: url.samsonL101, why,
    apa: 'SAMSON AG. (2000). *Begriffe und Symbole der Regelungstechnik* (Technische Information L101). ' + ABGERUFEN + url.samsonL101
  }),
  samsonL102: (why, minutes) => ({
    title: 'Regler und Regelstrecken', author: 'SAMSON AG', institution: 'SAMSON AG, Frankfurt am Main',
    work: 'Technische Information, Teil 1: Grundlagen (L102)', year: 2001, type: 'Hersteller', minutes, url: url.samsonL102, why,
    apa: 'SAMSON AG. (2001). *Regler und Regelstrecken* (Technische Information L102). ' + ABGERUFEN + url.samsonL102
  }),
  br: (title, u, why, minutes, year) => ({
    title, author: 'B&R Industrial Automation', institution: 'B&R Industrial Automation GmbH',
    work: 'Automation Help (Automation Studio 6)', year: year || 2026, type: 'Dokumentation', minutes, url: u, why,
    apa: 'B&R Industrial Automation. (' + (year || 2026) + '). *' + title + '*. Automation Help. ' + ABGERUFEN + u
  }),
  beckhoffTuning: (why, minutes) => ({
    title: 'Einstellregeln für die P-, PI- und PID-Regler', author: 'Beckhoff Automation', institution: 'Beckhoff Automation GmbH & Co. KG',
    work: 'TwinCAT 3 Controller Toolbox (TF4100), Beckhoff Information System', year: 2026, type: 'Hersteller', minutes, url: url.beckhoffTuning, why,
    apa: 'Beckhoff Automation. (2026). *Einstellregeln für die P-, PI- und PID-Regler* (TF4100 TwinCAT 3 Controller Toolbox). ' + ABGERUFEN + url.beckhoffTuning
  })
};

// Videos (Titel/Kanal exakt aus YouTube-oEmbed übernommen)
const V = {
  buchholzRegelung: { id: 'vcOG0wUvO5I', title: '1.2.2 Regelung', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzSteuerung: { id: 'OQ__2dGeMUQ', title: '1.2 Steuerung und Regelung 1.2.1 Steuerung', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzPT1: { id: 'JdPeeCFrrjw', title: '2.8 P-T1', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzPT2: { id: 'AxuE7g9oH1s', title: '2.9 P-T2', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzTotzeit: { id: '9YZTH-e9uKs', title: '2.13 Totzeit', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzPID: { id: 'Sff8HKUfI6A', title: '2.12 PID-Glied', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzEinstell: { id: 'X8h8Cbq2ymk', title: '3.7 Einstellregeln für Regelkreise', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzGuete: { id: 'gp7n2_G3yCE', title: '3.5 Gütekriterien', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzIntegral: { id: 'rQf23duK8bk', title: '3.5.1 Integralkriterien', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzSimOpt: { id: '_OEOF5s6xZ4', title: '3.6 Regleroptimierung mit Simulation', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzStoer: { id: 's7zbtn2Iao4', title: '3.8 Störgrößenaufschaltung', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzVorst: { id: '2pzISsT335g', title: '3.9 Vorsteuerung 3.9.1 Kombination mit Regelung', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzKaskade: { id: 'KHZGuQdVFeg', title: '6.4.1 Kaskadenregelung', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzStellgr: { id: '9osS-zOrp0s', title: '4.1.4 Stellgrößen', channel: 'Jörg Buchholz', lang: 'de' },
  buchholzZustand: { id: 'zaHt1ZifR5A', title: '2.14.1 Blockschaltbild der Zustandsraumdarstellung', channel: 'Jörg Buchholz', lang: 'de' },
  podcastStrecken: { id: 'dsCHOe9IcTA', title: 'Regelstrecken mit und ohne Ausgleich, Ordnungszahl & Totzeit', channel: 'Elektrotechnik.Podcast', lang: 'de' },
  choHysterese: { id: 'ai231jdT0wM', title: 'RT 03 06 Zweipunktregler mit Hysterese: Von der Kennlinie zum Struktogramm', channel: 'Cho-WvSS', lang: 'de' },
  choStreckenpar: { id: '36KuFcm1P3g', title: 'RT 02 05 Regelstreckenparameter: Teil 1', channel: 'Cho-WvSS', lang: 'de' },
  tpZweipunkt: { id: 'NzHPRv0fK5A', title: 'Zweipunktregler, Dreipunktregler und Hysterese 👨🏼‍🔬💡Temperaturregler einfach erklärt', channel: 'Temperatur Profis', lang: 'de' },
  bbsWuerfel: { id: 'Hg2qSm7Bi9s', title: 'PID-Regelung der Temperatur in einem Würfel mit einer SPS', channel: 'BBS 2 WOB Digitalisierung', lang: 'de' },
  loviscachZN: { id: 'quqxyny5kBU', title: 'P- und PI-Regler; Einstellung nach Ziegler-Nichols', channel: 'Jörn Loviscach', lang: 'de' },
  loviscachKaskade: { id: 'WnjJudlMeGs', title: 'Kaskadenregelung; Stellungsregler; Dreipunktregler', channel: 'Jörn Loviscach', lang: 'de' },
  einfachCHR: { id: '06GerFhIzio', title: 'Stetigregler 4 - PI und PID Regler einstellen nach Chien, Hrones Reswick', channel: 'EinfachTechnik', lang: 'de' },
  kahlertTSumme: { id: '9gNySEnMDjg', title: 'Alles geregelt mit BORIS - Reglerentwurf nach der T-Summen-Regel', channel: 'Ingenieurbüro Dr. Kahlert', lang: 'de' },
  alexWindup: { id: 'f6K5fySp2aE', title: 'Anti Wind-UP (Wind-UP Effekt) | Regelungstechnik', channel: 'AlexTbg', lang: 'de' },
  leuertronikIdent: { id: 'E_uW55U_yb8', title: '07 - Regelungstechnik - Systemtheorie - Identifikation dynamischer Systeme anhand der Sprungantwort', channel: 'Leuertronik', lang: 'de' },
  leuertronikDigital: { id: 't7B5gGmFA2w', title: '16 - Regelungstechnik - Digitale Regelungen - Abtastregelkreis - Zeitdiskret - Quasikontinuierlich', channel: 'Leuertronik', lang: 'de' },
  zacherWendetangente: { id: 'nxvTQmTGtEE', title: 'Regelungstechnik: Wendetangenten-Verfahren', channel: 'zacher -automation', lang: 'de' },
  zacherMimo: { id: 'Wib8N-lvmc0', title: 'Multivariable Closed Loop Control. Identification,  Decoupled Control and MIMO Control with Router', channel: 'zacher -automation', lang: 'en' },
  matlabPid: { id: 'wkfEZmsQqiA', title: 'What Is PID Control? | Understanding PID Control, Part 1', channel: 'MATLAB', lang: 'en' },
  matlabWindup: { id: 'NVLXCwc8HzM', title: 'Anti-windup for PID control | Understanding PID Control, Part 2', channel: 'MATLAB', lang: 'en' },
  matlabNoise: { id: '7dUVdrs1e18', title: 'Noise Filtering in PID Control | Understanding PID Control, Part 3', channel: 'MATLAB', lang: 'en' },
  matlabFeedforward: { id: 'FW_ay7K4jPE', title: 'What Is Feedforward Control? | Control Systems in Practice', channel: 'MATLAB', lang: 'en' },
  matlabStateSpace: { id: 'hpeKrMG-WP0', title: 'Introduction to State-Space Equations | State Space, Part 1', channel: 'MATLAB', lang: 'en' },
  matlabPolePlacement: { id: 'FXSpHy8LvmY', title: 'What is Pole Placement (Full State Feedback) | State Space, Part 2', channel: 'MATLAB', lang: 'en' },
  matlabSysId: { id: 'Z1QS6FsxrJI', title: 'What Is System Identification? | System Identification, Part 1', channel: 'MATLAB', lang: 'en' },
  matlabMpc: { id: '8U0xiOkDcmw', title: 'Why Use Model Predictive Control? | Understanding MPC, Part 1', channel: 'MATLAB', lang: 'en' },
  douglasDiscrete: { id: '14cMhrp5wlk', title: 'Discrete control #1: Introduction and overview', channel: 'Brian Douglas', lang: 'en' },
  douglasDiscretize: { id: 'rL_1oWrOplk', title: 'Discrete control #2: Discretize! Going from continuous to discrete domain', channel: 'Brian Douglas', lang: 'en' },
  splitRange: { id: '3z0R2BO3p5M', title: 'Split range control', channel: 'Smart Process Engineering', lang: 'en' },
  autoMatesTrace: { id: 'r9oJctqcCZg', title: 'PLC Trace in Automation Studio | B&R Industrial Automation', channel: 'AutoMates', lang: 'en' },
  brMapp: { id: 'k5O5zhkPAAM', title: 'mapp concept - What is mapp Technology? [sub: EN, DE, JA, PL, PT-BR, RU]', channel: 'B&R Industrial Automation', lang: 'en' },
  brMappData: { id: '8sY0b2slcr4', title: 'mapp Data Part 1 - Recording a temperature variable [sub: EN, DE, PL, RU]', channel: 'B&R Industrial Automation', lang: 'en' },
  valoLevel: { id: 'rDy8AyR1kZ8', title: 'B&R Automation Studio 4.2 - Implementation of Level Control in Tank System Part-1 - Modeling & PID', channel: 'Richard Valo', lang: 'en' }
};
const vid = (key, why) => Object.assign({}, V[key], { why });

module.exports = { url, R, V, vid };
