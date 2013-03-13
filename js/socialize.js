/**
 * Created by Kennedy Idialu
 * Date: 3/10/13
 * Time: 2:49 PM
 */

function Socializer(){}


/**
 * Get url query vars
 *
 * @return {Array}
 */
Socializer.prototype.getUrlVars = function()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
};


/**
 * Start socializing the page
 */
Socializer.prototype.socialize = function()
{
    // Get the url
    var url = this.getUrlVars()["url"];


};

new Socializer().socialize();