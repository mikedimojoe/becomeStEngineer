// Gemeinsamer Inhalt für alle drei Entwürfe
window.MOCK = {
  user: { name: 'Lena Hoffmann', group: 'Duales Studium 2026', stage: 2, kp: 1840, nextKp: 4200 },
  stages: ['Grundkurs','Junior','Senior','Engineer','Master','Guru','Genie'],
  areas: [
    { id:'logik', name:'Steuerungslogik', lvl:2, pct:64, color:'#ED8934' },
    { id:'elektro', name:'Elektrotechnik', lvl:2, pct:80, color:'#1B3A4A' },
    { id:'git', name:'Versionsverwaltung', lvl:1, pct:100, color:'#B1886B' },
    { id:'praxis', name:'Engineering-Praxis', lvl:1, pct:40, color:'#A29376' },
    { id:'system', name:'Systemkonfiguration', lvl:1, pct:55, color:'#465157' },
    { id:'komm', name:'Kommunikation', lvl:0, pct:10, color:'#2D3235' },
    { id:'motion', name:'Antriebstechnik', lvl:0, pct:0, color:'#ED8934' },
    { id:'hmi', name:'Visualisierung', lvl:0, pct:0, color:'#1B3A4A' },
    { id:'regelung', name:'Regelungstechnik', lvl:0, pct:0, color:'#B1886B', locked:true },
    { id:'safety', name:'Funktionale Sicherheit', lvl:0, pct:0, color:'#A29376', locked:true }
  ],
  next: { area:'Steuerungslogik', title:'Zustandsautomaten mit CASE und Enum', why:'Fehlt noch für die Prüfung „Senior“: Steuerungslogik Niveau 2.', unlocks:'Schaltet frei: Schrittketten mit Fehlerbehandlung · Praxisprojekt Abfüllstation', minutes: 90, kp: 230 },
  module: { title:'Zustandsautomaten mit CASE und Enum', level:'Junior', objectives:[
    { t:'Enum-Typ eState in Types.typ anlegen', done:true },
    { t:'CASE-Struktur mit vier Zuständen schreiben', done:true },
    { t:'Übergänge mit Flankenauswertung absichern', done:false, active:true },
    { t:'Fehlerzustand mit Quittierung ergänzen', done:false }
  ], tests:[ ['Start aus IDLE wechselt nach RUN', true], ['Stopp führt über STOPPING nach IDLE', true], ['Sensorfehler → ERROR', false], ['Quittieren nur bei freiem Sensor', false] ] },
  code: `CASE eState OF
  ST_IDLE:
    IF fbStart.Q THEN
      eState := ST_RUN;
    END_IF
  ST_RUN:
    doMotor := TRUE;
    IF fbStop.Q THEN
      eState := ST_STOPPING;
    END_IF
END_CASE`
};
