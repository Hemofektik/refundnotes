var fs = require('fs');
var config = require('./config');
var logger = require('./logger');


var log = function (text) {
    var d = new Date();
    var month = (d.getUTCMonth() + 1);
    var logfileName = config.logDir + "/" + d.getUTCFullYear() + "-" + (month < 10 ? "0" : "") + month + "-" + d.getUTCDate() + ".log"

    var stringToLog = d.toISOString() + text;

    if (config.outputLogToConsole) {
        console.log(stringToLog);
    }

    fs.appendFile(logfileName, stringToLog + "\n", function (err) {
        if (err) {
            console.log(logfileName + ' Log File Error: ' + err);
        }
    });
}

var initLogHousekeeping = function () {

    var logHousekeepingInterval = 24 * 60 * 60 * 1000;
    var logAgeMax = 7 * 24 * 60 * 60 * 1000;

    try {
        if (!fs.existsSync(config.logDir)) { fs.mkdirSync(config.logDir) };
    } catch (e) {
        console.log("Error: unable to create log dir " + config.logDir + "!");
    }

    var performLogHousekeeping = function () {

        var oldestLogAllowed = Date.now() - logAgeMax;

        try {
            var numFilesKept = 0;
            var sizeOccupied = 0;
            var logFiles = fs.readdirSync(config.logDir);
            for (var n = 0; n < logFiles.length; n++) {
                var stats = fs.statSync(config.logDir + "/" + logFiles[n]);
                if (stats.mtime < oldestLogAllowed) {
                    fs.unlinkSync(config.logDir + "/" + logFiles[n]);
                } else {
                    numFilesKept++;
                    sizeOccupied += stats.size;
                }
            }

            logger.logInfo(numFilesKept.toFixed(0) + " log files kept after housekeeping (" + (sizeOccupied / (1024 * 1024)).toFixed(1) + " MB)");
        } catch (e) {
            logger.logError("log housekeeping failed: " + e.message);
        }
    };

    setInterval(performLogHousekeeping, logHousekeepingInterval);
    performLogHousekeeping();
};

var init = function () {
    this.log = log;

    initLogHousekeeping();
};

var logInfo = function (text) {
    this.log(" -   Info  - " + text);
}
var logWarning = function (text) {
    this.log(" - Warning - " + text);
}
var logError = function (text) {
    this.log(" -  Error  - " + text);
}

var getLog = function () {
    var d = new Date();
    var month = (d.getUTCMonth() + 1);
    var logfileName = config.logDir + "/" + d.getUTCFullYear() + "-" + (month < 10 ? "0" : "") + month + "-" + d.getUTCDate() + ".log"
    
    var result = "";
    try {
        result = fs.readFileSync(logfileName);
    } catch (e) {
        result = e.message;
    }

    return result;
}

var getErrorLogs = function () {
    var logFiles = fs.readdirSync(config.logDir + "/");

    var result = "";
    

    logFiles.forEach(function (logFileName, index, arr) {        
        var fileContent = fs.readFileSync(config.logDir + "/" + logFileName, "utf8");
        var numberOfNextLines = 0;        

        fileContent.split("\n").forEach(function (logLine, index, arr) {

            var isWarning = logLine.indexOf("- Warning -") != -1;
            var isError = logLine.indexOf("-  Error  -") != -1 || logLine.indexOf("    at ") != -1;
            var isInfo = logLine.indexOf("-   Info  -") != -1;

            if (isWarning || isError || (numberOfNextLines > 0 && !isInfo)) {
                result += logLine + "\r\n";

                if (isError) {
                    numberOfNextLines = 6;
                }
            }           

            numberOfNextLines--;

            // Add extra empty line after block of Error message
            if (numberOfNextLines == 0) {
                result += "\r\n";
            }

            if (numberOfNextLines < 0) {
                numberOfNextLines = 0;                
            }

        });
        


    });
    
    return result;



}

exports.init = init;
exports.logInfo = logInfo;
exports.logWarning = logWarning;
exports.logError = logError;
exports.getLog = getLog;
exports.getErrorLogs = getErrorLogs;

