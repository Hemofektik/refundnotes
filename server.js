var http = require("http");
var url = require("url");
var config = require('./config');
var logger = require('./logger');
var socialweather = require('./refundnotes');

function start() {

    config.init();
    logger.init();
    socialweather.init();
}

exports.start = start;
