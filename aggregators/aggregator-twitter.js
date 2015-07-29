// functions/vars to export 
// Initialises Module
// init

// Name of the Aggregator
// name

// Name of the Aggregator for displaying at the beginning of a log usally '[' + name + '] '
// logName


var twit = require('twit'),
    http = require('http'),    
    global_config = require('../config'),
    logger = require('../logger'),
    utils = require('../utils'),
    module = this;

var server_status = {
    filtered: {
        retweets: 0,
        no_place: 0,
        zero_coordinates: 0,
        no_bounding_box: 0,
        weather_stations: 0
    },

    passed: {
        with_geo: 0,
        with_place: 0,
        with_media: 0,
        with_instagram_media: 0
    },

    lang_geo_count: {
    }
};

function filterTweet(tweet) {

    // Retweets will be filtered
    if ((tweet.quoted_status_id_str !== undefined) || ((tweet.text.length > 3) && tweet.text.substr(0, 4) === "RT @")) {
        server_status.filtered.retweets++;
        return false;
    }

    if (tweet.source && tweet.source.length > 0 && tweet.source.indexOf("tumblr") >= 0) {
        return false;
    }
        
    // Get rid of weather stations by Sandysoft Cumulus 
    /*if (tweet.source && (
            tweet.source.indexOf("sandaysoft.com") > -1 ||
            tweet.source.indexOf("pywws") > -1)
        ) {
        server_status.filtered.weather_stations++;
        return false;
    }*/
    
    return true;
}

var tweet_id = 1;

function pushTweet(text, media_url, user_name, user_profile_pic) {
    var timeStampNow = Math.round(Date.now() / 1000.0);

    module.pushMessageCallback(
    {
        Text: text,
        Media: media_url,
        UserName: user_name,
        UserImageURL: user_profile_pic,
        Source: "Twitter",
        InsertionDate: timeStampNow,
        Id: "tw_" + tweet_id
    });
    
    tweet_id++;
}

var onTweetReceiveFunction = function (tweet) {
    
    if (!filterTweet(tweet)) {
        return;
    }
        
    // Media handling
    var media_url = "";
    var load_async_media = false;
    // Get media out of tweet
    if (tweet.entities.media) {
        media_url = tweet.entities.media[0].media_url;
        server_status.passed.with_media++;
    } else {
        // Get media out of instagram
        if (tweet.entities.urls.length > 0) {
            for (var i = 0; i < tweet.entities.urls.length; i++) {
                if (tweet.entities.urls[i].expanded_url.toLowerCase().indexOf("instagram.com") > -1 && tweet.entities.urls[i].expanded_url.toLowerCase().indexOf("https://") == -1) {
                    var request = http.get(tweet.entities.urls[i].expanded_url, function (response) {
                        var str = '';

                        //another chunk of data has been recieved, so append it to `str`
                        response.on('data', function (chunk) {
                            str += chunk;
                        });

                        //the whole response has been recieved, so we just print it out here
                        response.on('end', function () {
                            var regex = /<meta property="og:image" content="(.*?)" \/>/
                            var media_url = str.match(regex);

                            if (media_url) {

                                pushTweet(tweet.text,
                                    media_url[1],
                                    tweet.user.screen_name,
                                    tweet.user.profile_image_url);
                            } else {
                                logger.logError("[Twitter] media_url is null. Instagram URL was " + tweet.entities.urls[i].expanded_url);
                            }
                        });
                    });

                    server_status.passed.with_instagram_media++;
                    load_async_media = true;
                    break;
                }
            }
        }
    }
    
    if (!load_async_media) {
        pushTweet(tweet.text,
            media_url,
            tweet.user.screen_name,
            tweet.user.profile_image_url);
    }
};


// ############## EXPORTS ##############

var init = function (pushMessageCallback) {

    this.api = new twit({
        // App keys
        consumer_key: global_config.tw_consumer_key,
        consumer_secret: global_config.tw_consumer_secret,
        access_token: global_config.tw_access_token,
        access_token_secret: global_config.tw_access_token_secret
    });
    
    this.pushMessageCallback = pushMessageCallback;
    
    var keywords = require('../keywords');

    this.stream = this.api.stream('statuses/filter', { track: keywords.list })

    this.stream.on('error', function (warning) {
        logger.logError("\n############## ERROR ##############\n");
        logger.logError(warning);
        logger.logError(JSON.stringify(warning));
        logger.logError("\n#####################################\n");
    })

    this.stream.on('warning', function (warning) {
        logger.logWarning("\n############## WARNING ##############\n");
        logger.logWarning(JSON.stringify(warning));
        logger.logWarning("\n#####################################\n");
    })

    this.stream.on('limit', function (limitMessage) {
        logger.logWarning("\n############## LIMIT ##############\n");
        logger.logWarning(JSON.stringify(limitMessage));
        logger.logWarning("\n###################################\n");
    })


    this.stream.on('tweet', onTweetReceiveFunction);
}

exports.init = init;
exports.name = "Twitter";
exports.logName = "[Twitter] ";
