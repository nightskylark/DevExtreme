var extend = require("./extend").extend;
var windowUtils = require("./window");
var navigator = windowUtils.getNavigator();
var webkitRegExp = /(webkit)[ /]([\w.]+)/;
var ieRegExp = /(msie) (\d{1,2}\.\d)/;
var ie11RegExp = /(trident).*rv:(\d{1,2}\.\d)/;
var msEdge = /(edge)\/((\d+)?[\w.]+)/;
var safari = /(safari)/i;
var mozillaRegExp = /(mozilla)(?:.*? rv:([\w.]+))/;

var browserFromUA = function(ua) {
    ua = ua.toLowerCase();

    var result = {};

    var matches =
        ieRegExp.exec(ua) ||
        ie11RegExp.exec(ua) ||
        msEdge.exec(ua) ||
        ua.indexOf("compatible") < 0 && mozillaRegExp.exec(ua) ||
        webkitRegExp.exec(ua) ||
        [];

    var browserName = matches[1];
    var browserVersion = matches[2];

    if(browserName === "webkit" && ua.indexOf("chrome") < 0 && safari.exec(ua)) {
        browserName = "safari";
        result["webkit"] = true;
        browserVersion = /Version\/([0-9.]+)/i.exec(ua);
        browserVersion = browserVersion && browserVersion[1];
    }

    if(browserName === "trident" || browserName === "edge") {
        browserName = "msie";
    }

    if(browserName) {
        result[browserName] = true;
        result.version = browserVersion;
    }

    return result;
};
module.exports = extend({ _fromUA: browserFromUA }, browserFromUA(navigator.userAgent));
