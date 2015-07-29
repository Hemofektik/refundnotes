var fs = require('fs');
var path = require('path');

var setDefaults = function () {
    this.logDir = "./log";
    this.outputLogToConsole = 0;

    this.port = 8888;
    this.debug = false;

    this.tw_consumer_key = "";
    this.tw_consumer_secret = "";
    this.tw_access_token = "";
    this.tw_access_token_secret = "";

    this.tmblr_consumer_key = '';
    this.tmblr_consumer_secret = '';
    this.tmblr_access_token = '';
    this.tmblr_access_secret = '';
    this.tmblr_hostname = '';
}

var loadConfig = function (filename) {
    
    try {
        var configContent = fs.readFileSync(filename, 'utf8');
        // Remove trailing BOM
        configContent = configContent.replace(/^\uFEFF/, '');
        var config = JSON.parse(configContent);

        var attribs = Object.keys(this);
        for (var n = 0; n < attribs.length; n++) {
            var attrib = attribs[n];

            this[attrib] = (config[attrib] !== undefined) ? config[attrib] : this[attrib];
        }
    } catch (e) {
        console.log("Error while reading " + filename + "!");
    }
};

var init = function () {

    this.setDefaults = setDefaults;
    this.loadConfig = loadConfig;

    this.setDefaults();
    this.rootDir = __dirname

    var globalConfigFilename = path.resolve(this.rootDir, "global.config");
    this.loadConfig(globalConfigFilename);

    var localConfigFilename = path.resolve(this.rootDir, "local." + (this.debug ? "debug" : "release") + ".config");
    this.loadConfig(localConfigFilename);
};

exports.init = init;
