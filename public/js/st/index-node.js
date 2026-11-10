// Lädt den ST-Interpreter in Node (Server-Bewertung, Prüfwerkzeuge)
require('./st-parse.js');
require('./st-runtime.js');
require('./st-project.js');
require('./st-lib.js');
module.exports = global.ST;
