var utils = require('./utils');
var global_config = require('./config');

var keywords_dictionary = new Array();
var keywords_list = new Array();

var mainKeyWord = global_config.debug ? "#refundnotesprelive" : "#refundnotes";

keywords_dictionary["english"] = mainKeyWord;

keywords_list.push(mainKeyWord);

var getEnglishKeyword = function (keyword) {
    return mainKeyWord;
}

exports.list = keywords_list;
exports.dictionary = keywords_dictionary;
exports.getEnglishKeyword = getEnglishKeyword;
