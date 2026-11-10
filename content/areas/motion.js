'use strict';
// Bereich Antriebstechnik (motion) – Level 2–6. Module liegen in content/areas/motion/levelN.js
module.exports = {
  id: 'motion',
  title: 'Antriebstechnik',
  short: 'Motion',
  description: 'Vom Servomotor und Geber über mapp Motion und PLCopen-Bausteine bis zu Kurvenscheiben, Achskopplung, Regelkreisen, Dimensionierung und Mehrachs-Architekturen mit Safe-Motion-Schnittstelle. Programmiert wird in ST mit MpAxisBasic und MC_-Bausteinen an simulierten Achsen.',
  sources: [
    'B&R Online-Hilfe Automation Studio 6 – mapp Motion (Getting Started Achse, MpAxisBasic, Zustandsdiagramm McAxis, Autotuning, Cam Automat, SafeMOTION): https://help.br-automation.com/#/de/6/motion/mapp_motion/mapp_motion.html',
    'B&R Community: Struktur der B&R-Trainingsmodule TM400/TM415/TM416/TM417/TM470/TM471 (Motion) – https://community.br-automation.com/t/b-r-motion-training-module/10064',
    'B&R Community: Motion-Onlinekurs für AS6 (Komponenten, Inbetriebnahme, Autotuning/Referenzieren, Diagnose, MpAxis) – https://community.br-automation.com/t/release-2026-new-motion-online-course-for-automation-studio-6/11099',
    'B&R Community: Guide Motion Comissioning for Beginners – https://community.br-automation.com/t/guide-motion-comissioning-for-beginners/1679',
    'FHNW, M. Pischtschan: Skript zum MAS Modul Servotechnik (Servomotor, Geber, Umrichter, Regelstrukturen, Mechanik, Getriebe) – https://bookdown.org/martin_pischtschan/skript_mas_att/',
    'ISB Bayern: Lehrplanrichtlinien Mechatroniker/-in (Lernfeld Design und Erstellen mechatronischer Systeme: Antriebe, Positionierung, Getriebe) – https://www.isb.bayern.de/fileadmin/user_upload/Berufliche_Schulen/Berufsschule/Lehrplan/bs_lpr_mechatroniker.pdf',
    'BIBB: Neufassung der Mechatroniker-Ausbildungsverordnung 2018 – https://bibb.de/dienst/berufesuche/de/index_berufesuche.php/regulation/neufassung_mechatroniker_2018.pdf',
    'PLCopen Motion Control (Function Blocks for Motion Control, Zustandsdiagramm) – https://www.plcopen.org/standards/motion-control/',
    'HAW Hamburg, H. Müller: Regelungstechnische Untersuchung eines Servoantriebs (2012) – https://reposit.haw-hamburg.de/bitstream/20.500.12738/5682/1/Thesis_Hannes_Mueller_1916869.pdf',
    'U. Probst: Servoantriebe in der Automatisierungstechnik, Springer Vieweg 2022 – https://link.springer.com/book/10.1007/978-3-658-37423-5'
  ],
  modules: [
    ...require('./motion/level2'),
    ...require('./motion/level3'),
    ...require('./motion/level4'),
    ...require('./motion/level5'),
    ...require('./motion/level6')
  ]
};
