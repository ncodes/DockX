/**
 * Created by Kennedy Idialu
 * Date: 3/10/13
 * Time: 1:35 PM
 *
 * Content Script
 */

function Ticker(){

    /**
     * A jquery handle to the DOM body element
     *
     * @type {*|jQuery|HTMLElement}
     */
    this.body = $('html');

    /**
     * A jquery handle to the ticker element
     * @type {*|jQuery|HTMLElement}
     */
    this.tickerEl;

    /**
     * Template json data source
     *
     * @type {Object}
     */
    this.tempData = {
        'tickerHome': 'http://localhost/ticker?cookie='
    };


    /**
     * Holds mouse position state
     * @type {Object}
     */
    this.mousePosState = {};


    /**
     * Regex Rules that help determine whether a page with certian url match should be ignored
     *
     * @type {Array}
     */
    this.pageIgnoreRules = ["(http://localhost/login)", "(http://localhost/create_account)"];
}



/**
 * Send a message to the background page
 *
 * @param msg the message as a json object
 * @return {*}
 */
Ticker.prototype.messageBackgroundPage = function(msg)
{
    var d = new $.Deferred();

    chrome.extension.sendRequest(msg, function(response) {

        d.resolve(response);
    });

    return d.promise();
};


/**
 * Opens a page in a new tab
 */
Ticker.prototype.openPage = function(url)
{
    var d = new $.Deferred();

    this.messageBackgroundPage({ method: "openPageInNewTab", url: url }).always(function(res)
    {
        d.resolve(res);
    });

    return d.promise();
};


/**
 * Check if user is logged in already
 */
Ticker.prototype.isLogin = function()
{
    var d = new $.Deferred();

    // Get the dock app cookie
    this.messageBackgroundPage({method: 'getCookie', url: 'http://localhost', name: 'dock_user'}).always(function(cookie)
    {
        // User has previously logged it
        if (cookie)
        {
            // confirm validity to the cookie value
            $.get("http://localhost/dock/validate_dock_cookie", {cookie: cookie.value})
                .done(function(data){

                    data.cookie = cookie.value;

                    // if user cookie is valid
                    if (data.ok){

                        d.resolve(data);
                    }
                    else{

                        d.resolve(false);
                    }
                })
                .fail(function(e){

                    alert("Unable to connect to server ");
                })
        }
        else
        {
            d.resolve(false);
        }
    });

    return d.promise();
};


/**
 * Append the ticker markup to the page
 *
 * @param cookie the user's cookie
 */
Ticker.prototype.appendToPage = function(cookie)
{
    var d = new $.Deferred();
    var self = this;

    this.loadTemplate('templates/ticker-template.html').always(function(status, temp) {

        if (status == "success"){

            self.tempData.cookie = cookie;

            // compile template
            var html = _.template(temp)(self.tempData);

            // Prepend compiled template to page
            self.body.prepend(html);

            // save a reference to the ticker element
            self.tickerEl = $('#ticker-container');

            d.resolve(true);

        }
        else {

            alert("Unable to load application properly");
            d.resolve(false);
        }
     });

    return d.promise();
};


/**
 * Position the ticker
 */
Ticker.prototype.positionTicker = function()
{
    var widthOfTicker = this.tickerEl.width();           // ticker width
    var widthOfWindow = this.body.width();               // window width
    this.tickerEl.css({ left: widthOfWindow });
};


/**
 * Apply the slide in/out event of the ticker
 */
Ticker.prototype.slideEvent = function()
{
    var self = this;
    var widthOfTicker = self.tickerEl.width();           // ticker width
    var widthOfWindow = self.body.width();               // window width

    // Bind event to the ticker to tell if mouse has entered it
    self.tickerEl.mouseenter(function(){

        self.mousePosState.onTicker = true;

        self.tickerEl.mouseout(function(){
            self.tickerEl.animate({ left: '+='+widthOfTicker }, function(){
                self.mousePosState.onTicker = false;
                self.positionTicker()
            });
        })
    });

    this.body.mousemove(function(evt)
    {
        var pageX = evt.pageX;

        if ((widthOfWindow - pageX) <= 20)
        {
            // only show ticker if we haven't been in its area/zone before
            // it will ensure that we don repeated show the ticker as we
            // go deeper into its area/zone
            if (!self.mousePosState.tickZone && !self.mousePosState.onTicker)
            {
                self.tickerEl.clearQueue().finish().delay(100);
                self.tickerEl.show().animate({ left: '-='+widthOfTicker });
            }

            // used to make sure we know if
            // mouse has already entered the ticker area/zone
            self.mousePosState.tickZone = true;
        }
        else
        {
            self.mousePosState.tickZone = false;
        }
    })
};


/**
 * Starts the sending of heart beats to server on behalf of the user.
 * This helps us know who is online
 *
 * @param cookie the user's cookie
 */
Ticker.prototype.startHeartBeat = function(cookie)
{
    this.messageBackgroundPage({ method: 'startHeartBeat', cookie: cookie });
};


/**
 * Display the application dock
 */
Ticker.prototype.display = function()
{
    var self = this;

    if (!this.shouldIgnore() || this.pageIgnoreRules.length == 0)
    {
        this.isLogin().always(function(userData)
        {
            if (userData){

                // Show the ticker
                self.appendToPage(userData.cookie).always(function(done)
                {
                    if (done){

                        // tell the background process to start sending heartbeats to server
                        self.startHeartBeat(userData.cookie);

                        // Set the position of the ticker
                        self.positionTicker();

                        // Apply the slide in event
                        self.slideEvent()
                    }
                });
            }
            else {

                // Redirect to login page
                window.location.href = "http://localhost/login"
            }
        })
    }
};


/**
 * Loads a template
 *
 * @param fileName the file name
 * @return {*}
 */
Ticker.prototype.loadTemplate = function(fileName)
{
    var d = new $.Deferred();

    $.get(chrome.extension.getURL(fileName), function(data, textStatus, XMLHttpRequest)
    {
        d.resolve(textStatus, data);
    });

    return d.promise();
};


/**
 * Check whether the current page should be ignored from the actions
 * of the content script
 */
Ticker.prototype.shouldIgnore = function()
{
    var pageURL = window.location.href;
    var regex = this.pageIgnoreRules.join("|");
    return new RegExp(regex).exec(pageURL)
};

/**
 * Load the app on the current page
 */
Ticker.prototype.load = function()
{
    // show the dock on the view
    this.display();
};

new Ticker().load();



