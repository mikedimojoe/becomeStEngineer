'use strict';
module.exports = {
  id: 'git',
  title: 'Versionsverwaltung',
  short: 'Git',
  description: 'Versionsverwaltung von Automation-Studio-6-Projekten mit Git, git bash und TortoiseGit: von Commit, .gitignore und Branches über Merge Requests, Konfliktlösung in .st-/.pkg-Dateien und Branch-Strategien bis zu Release-Prozess, Hooks, Submodulen und Teamrichtlinien auf git.breitner.de.',
  sources: [
    'Chacon, S. & Straub, B.: Pro Git, 2. Aufl. (deutsch) – https://git-scm.com/book/de/v2',
    'B&R DevOps Package – Version Control (B&R Community) – https://br-automation-community.github.io/BnR-DevOps-Package/VersionControl/',
    'B&R Community: .gitignore file for AS projects – https://community.br-automation.com/t/gitignore-file-for-as-projects/3714',
    'B&R Community: How do you structure your Git repository? – https://community.br-automation.com/t/how-do-you-structure-your-git-repository/6492',
    'B&R Community: Using Git-Submodules in an AS-Project – https://community.br-automation.com/t/using-git-submodules-in-an-as-project/1939',
    'TU Dortmund, Übung Verlässliche Systemsoftware: Git – https://sys-sideshow.cs.tu-dortmund.de/lehre/ss24/vss/material/C11_Git.pdf',
    'FAU Erlangen-Nürnberg, Übung Verlässliche Echtzeitsysteme: Git – https://rdsp.cs.fau.de/Lehre/SS18/V_VEZS/Uebung/Folien/02_Git.pdf',
    'TortoiseGit Manual – https://tortoisegit.org/docs/tortoisegit/',
    'Conventional Commits 1.0.0 – https://www.conventionalcommits.org/de/v1.0.0/',
    'Semantic Versioning 2.0.0 – https://semver.org/lang/de/',
    'BIBB: Elektroniker/-in für Automatisierungstechnik (Ausbildungsprofil) – https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/elauto2018'
  ],
  modules: [
    ...require('./git/level1'),
    ...require('./git/level2'),
    ...require('./git/level3'),
    ...require('./git/level4')
  ]
};
