import windowUtils from "../../core/utils/window";
var window = windowUtils.getWindow();

var getSessionStorage = function() {
    var sessionStorage;

    try {
        sessionStorage = window.sessionStorage;
    } catch(e) { }

    return sessionStorage;
};

exports.sessionStorage = getSessionStorage;
