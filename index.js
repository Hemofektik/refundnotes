var server = require("./server");
var logger = require("./logger");

server.start();

process.on('uncaughtException', function (err) {
    logger.logError("[EXCEPTION] " + err.message);
    logger.logError("[EXCEPTION] " + err.stack);
});