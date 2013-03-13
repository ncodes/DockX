/**
 * Created by Kennedy Idialu
 * Date: 3/10/13
 * Time: 1:35 PM
 *
 * The dock class (main app class)
 */


require.config({
    paths: {
        "underscore": "js/vendor/underscore-min",
        "jquery": "js/vendor/jquery-1.9.0.min"
    }
});



define(['underscore', 'jquery'], function()
{

    /**
     * Application class
     *
     * @constructor
     */
    function App(){

        /**
         * Tells whether the heartbeat has started
         *
         * @type {Boolean}
         */
        this.heartBeatStarted = false;

        /**
         * the heartbeat interval handle
         *
         * @type {null}
         */
        this.heartBeatInt = 0;

        /**
         * the heartbeat delay
         *
         * @type {Number}
         */
        this.heartBeatDelay = 5000;

        /**
         * The heart beat server url
         *
         * @type {String}
         */
        this.heartBeatServerURL = 'http://localhost/dock/heartbeat';

    }

    /**
     * Start the heart beat process
     *
     * @param cookie
     */
    App.prototype.startHeartBeat = function(cookie)
    {
        var self = this;

        var heartBeatFunc = function()
        {
            // clear previous running task
            clearInterval(self.heartBeatInt);

            $.get(self.heartBeatServerURL, {cookie: cookie})
                .done(function(data){

                    // if not successful
                    if (!data.ok){

                        // if the cause is because of an invalid cookie
                        if (data.cause == "invalid_cookie"){

                            // stop heartbeat
                            self.heartBeatStarted = false;
                        }
                    }
                    else {

                        self.heartBeatInt = setInterval(heartBeatFunc, self.heartBeatDelay);
                    }

                });

            self.heartBeatStarted = true;

        };

        // check if heart beat has not already began
        if (!this.heartBeatStarted)
        {
            heartBeatFunc()
        }
    };


    /**
     * Listen for request
     */
    App.prototype.listenForRequest = function()
    {
        var self = this;

        chrome.extension.onRequest.addListener(function(request, sender, sendResponse)
        {

            // Get local storage item
            if (request.method == "getLocalStorage") {

                var lsData = {};

                _.map(request.keys, function(key){

                    lsData[key] = localStorage[key];
                });

                sendResponse(lsData);
            }

            // Get a cookie
            if (request.method === "getCookie"){

                chrome.cookies.get({url: request.url, name: request.name }, function(cookie){

                    sendResponse(cookie);
                })
            }

            // Start heart beat
            if (request.method === "startHeartBeat") {

                self.startHeartBeat(request.cookie);
            }

        });
    };


    /**
     * Start the application
     */
    App.prototype.start = function()
    {
        this.listenForRequest();
    };


    return {
        createApp: new App()
    }
});