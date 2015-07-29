    // ********* TODO *********
    // * Nothing :)

var twit = require('twit'),
    fs = require('fs'),
    global_config = require('./config'),
    logger = require('./logger'),
    utils = require('./utils'),
    agg_twitter = require('./aggregators/aggregator-twitter'),
    url = require("url");
var email = require("emailjs/email");

var Tumblr = require('tumblrwks');

var aggregators = [agg_twitter];

var tumblr = null;


function processInstagramPost(request, response) {
    
    /*if (response.statusCode == 200) {
        var keywordList = request.post.map(function (message, index, array) {
            return message.object_id;
        });

        agg_instagram_new.pushNewKeywords(keywordList);
    }

    response.writeHead(200, "OK", { 'Content-Type': 'text/plain' });
    response.end();*/
}

RegExp.escape = function (str) {
    var specials = /[.*+?|()\[\]{}\\$^]/g; // .*+?|()[]{}\$^
    return str.replace(specials, "\\$&");
}

var pushMessage = function(message) {

    var keywords = require('./keywords');

    var cleanedMessageText = message.Text
    keywords.list.forEach(function (element, index) {
        var regex = new RegExp("(" + RegExp.escape(element) + ")", "gi"); // replace case insensitive
        cleanedMessageText = cleanedMessageText.replace(regex, '');
    });

    // extract steam id
    var sid = cleanedMessageText.match(/sid(\d*)/g);
    if (sid && sid.length > 0 && sid[0].length > 3) {
        cleanedMessageText = cleanedMessageText.replace(/sid(\d*)/g, "");
        sid = sid[0].substring(3, sid[0].length);
    }

    var tweetText = cleanedMessageText;
    var maxCharsToTweet = 111; // tweet functionality of tumblr only allows 111 characters....
    var refundNotesUrl = "http://refundnotes.com";
    var refundNotesTweetSuffix = " " + refundNotesUrl;
    var caractersToRemove = (tweetText.length + refundNotesTweetSuffix.length) - maxCharsToTweet;
    if (caractersToRemove > 0) {
        tweetText = tweetText.substring(0, tweetText.length - caractersToRemove - 3) + "...";
    }
    tweetText += refundNotesTweetSuffix;

    // remove media after tweet text creation because to keep the media in the autotweet
    var mediaTag = "";
    if (message.Media && message.Media.length > 0) {
        // if media is available remove the automatically added tweet link
        cleanedMessageText = cleanedMessageText.replace(/http.?:\/\/t\.co\/[A-Za-z0-9]*/g, "");
        mediaTag = "<img src='" + message.Media + "'>";
    }
    cleanedMessageText = cleanedMessageText.trim();

    var body = "";
    if (cleanedMessageText.length > 0) {
        body += cleanedMessageText;
    }

    body += mediaTag;    
    
    var source = "<a href='http://twitter.com/" + message.UserName + "' ><img style='vertical-align:middle;margin:0px' src='" + message.UserImageURL + "'>&nbsp;<span style=''>" + message.UserName + "</span></a>";

    var addSteamWidget = sid && sid.length > 0;
    if (addSteamWidget) {
        source += "<iframe src='http://store.steampowered.com/widget/" + sid + "/' style='margin-top:5px;' frameborder=0 width=646 height=190 ></iframe>";
    }
    
    tumblr.post('/post', { type: 'quote', quote: body, source: source, tweet: tweetText, state: 'draft' }, function (err, json) {
        console.log(json);

        /*tumblr.post('/post/delete', { id: json.id }, function (err, json) {
            console.log(json);
        });*/
    });

    if (!global_config.debug || true) {
        var server = email.server.connect({
            user: "refundnotes@hemofektik.de", 
            password: "{0a8404F9-55B6}",
            host: "smtp.hemofektik.de",
            tls: true
        });
        
        // send the message and get a callback with an error or details of the message that was sent
        server.send({
            text: message.Text,
            from: "#RefundNotes Bot <refundnotes@hemofektik.de>", 
            to: "drafts@refundnotes.com",
            subject: "New RefundNote Draft"
        }, function (err, message) { console.log(err || message); });
    }
}

var init = function () {
   logger.logInfo('[SERVER] Configuration:');

    var tmblrOptions = {
        consumerKey: global_config.tmblr_consumer_key,
        consumerSecret: global_config.tmblr_consumer_secret,
        accessToken: global_config.tmblr_access_token,
        accessSecret: global_config.tmblr_access_secret,
        hostname: global_config.tmblr_hostname
    };

    tumblr = new Tumblr( tmblrOptions, tmblrOptions.hostname );

    // Initialize aggregators
    logger.logInfo('[SERVER] Initializing aggregators');
    aggregators.forEach(function (agg, index, array) {
        logger.logInfo(agg.logName + 'initializing');
        agg.init(pushMessage);
    });
}





exports.init = init;
exports.processInstagramPost = processInstagramPost;