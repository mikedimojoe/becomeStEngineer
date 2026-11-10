'use strict';
// Bereich: Vernetzung & Kommunikation (Level 2–6)
// Module liegen nach Level getrennt in ./komm/levelN.js
module.exports = {
  id: 'komm',
  title: 'Vernetzung & Kommunikation',
  short: 'Komm',
  description: 'Von Netzwerkgrundlagen (IPv4, Subnetze, ARP, DHCP) über POWERLINK, X2X, Feldbusse, Modbus TCP und IO-Link bis zu OPC UA (Server, Client, Security), eigenen TCP-Protokollen, MQTT, Datenbanken und IT/OT-Security nach IEC 62443. ' +
    'Auf den oberen Stufen stehen Protokoll-Design, Echtzeitverhalten (Latenz, Jitter) und die Integration der Maschine in MES- und Cloud-Architekturen.',
  sources: [
    'BIBB: Ausbildungsprofil Elektroniker/-in für Automatisierungstechnik – https://www.bibb.de/dienst/berufesuche/de/index_berufesuche.php/profile/apprenticeship/elektau07',
    'TH Köln: Modulbeschreibung Industrielle Kommunikation (Prof. Bartz) – https://f07-studieninfo.web.th-koeln.de/mhb/versions/2024-06-11-14-00-00/html_pdf/L_FG_Bartz.pdf',
    'Universität Siegen: Vorlesung Industrielle Kommunikation – https://www.eti.uni-siegen.de/emas/lehre/industrielle_kommunikation/',
    'FHNW (Pischtschan): Skript MAS Servotechnik, Kap. 8 Kommunikationsschnittstellen – https://bookdown.org/martin_pischtschan/skript_mas_att/kommunikationsschnittstellen.html',
    'Universität Leipzig (Irmscher): Rechnernetze-Scriptum – https://www.informatik.uni-leipzig.de/~irmscher/lehre/skripte/RechnernetzeScriptum_T1.pdf',
    'TU München: Skript GRNVS – https://www.net.in.tum.de/fileadmin/RI/teaching/grnvs/ss14/grnvs-script-2014.pdf',
    'B&R Online-Hilfe AS6: AsTCP, AsUDP, AsOpcUac, OPC UA Default View, POWERLINK, X2X, Firewall, mapp PackML, mapp Database – https://help.br-automation.com/',
    'B&R Community – https://community.br-automation.com/',
    'OPC Foundation: OPC UA Online Reference (Part 1–3, PackML) – https://reference.opcfoundation.org/',
    'Modbus Organization: Application Protocol Specification – https://www.modbus.org/file/secure/modbusprotocolspecification.pdf',
    'OASIS: MQTT 5.0 – https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html',
    'BSI: ICS-Security-Kompendium – https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/ICS/ICS-Security_kompendium_pdf.pdf'
  ],
  modules: [
    ...require('./komm/level2'),
    ...require('./komm/level3'),
    ...require('./komm/level4'),
    ...require('./komm/level5'),
    ...require('./komm/level6')
  ]
};
