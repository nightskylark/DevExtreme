import $ from "../core/renderer";
import domAdapter from "../core/dom_adapter";
import windowUtils from "../core/utils/window";
var window = windowUtils.getWindow();
import deferredUtils from "../core/utils/deferred";
var Deferred = deferredUtils.Deferred;
import errors from "./widget/ui.errors";
import domUtils from "../core/utils/dom";
import readyCallbacks from "../core/utils/ready_callbacks";
var ready = readyCallbacks.add;
import iteratorUtils from "../core/utils/iterator";
var each = iteratorUtils.each;
import devices from "../core/devices";
import viewPortUtils from "../core/utils/view_port";
import themeReadyCallback from "./themes_callback";
var viewPort = viewPortUtils.value;
var viewPortChanged = viewPortUtils.changeCallback;
var DX_LINK_SELECTOR = "link[rel=dx-theme]";
var THEME_ATTR = "data-theme";
var ACTIVE_ATTR = "data-active";
var DX_HAIRLINES_CLASS = "dx-hairlines";
var context;
var $activeThemeLink;
var knownThemes;
var currentThemeName;
var pendingThemeName;

var timerId;

var THEME_MARKER_PREFIX = "dx.";

function readThemeMarker() {
    if(!windowUtils.hasWindow()) {
        return null;
    }
    var element = $("<div>", context).addClass("dx-theme-marker").appendTo(context.documentElement);
    var result;

    try {
        result = element.css("fontFamily");
        if(!result) {
            return null;
        }

        result = result.replace(/["']/g, "");
        if(result.substr(0, THEME_MARKER_PREFIX.length) !== THEME_MARKER_PREFIX) {
            return null;
        }
        return result.substr(THEME_MARKER_PREFIX.length);
    } finally {
        element.remove();
    }
}

// FYI
// http://stackoverflow.com/q/2635814
// http://stackoverflow.com/a/3078636
function waitForThemeLoad(themeName) {
    var waitStartTime;

    pendingThemeName = themeName;

    function handleLoaded() {
        pendingThemeName = null;

        themeReadyCallback.fire();
        themeReadyCallback.empty();
    }

    if(isPendingThemeLoaded()) {
        handleLoaded();
    } else {
        waitStartTime = Date.now();
        timerId = setInterval(function() {
            var isLoaded = isPendingThemeLoaded();
            var isTimeout = !isLoaded && Date.now() - waitStartTime > 15 * 1000;

            if(isTimeout) {
                errors.log("W0004", pendingThemeName);
            }

            if(isLoaded || isTimeout) {
                clearInterval(timerId);
                timerId = undefined;

                handleLoaded();
            }
        }, 10);
    }
}

function isPendingThemeLoaded() {
    return !pendingThemeName || readThemeMarker() === pendingThemeName;
}

function processMarkup() {
    var $allThemeLinks = $(DX_LINK_SELECTOR, context);
    if(!$allThemeLinks.length) {
        return;
    }

    knownThemes = {};
    $activeThemeLink = $(domUtils.createMarkupFromString("<link rel=stylesheet>"), context);

    $allThemeLinks.each(function() {
        var link = $(this, context);
        var fullThemeName = link.attr(THEME_ATTR);
        var url = link.attr("href");
        var isActive = link.attr(ACTIVE_ATTR) === "true";

        knownThemes[fullThemeName] = {
            url: url,
            isActive: isActive
        };
    });

    $allThemeLinks.last().after($activeThemeLink);
    $allThemeLinks.remove();
}

function resolveFullThemeName(desiredThemeName) {
    var desiredThemeParts = desiredThemeName.split(".");
    var result = null;

    if(knownThemes) {
        if(desiredThemeName in knownThemes) {
            return desiredThemeName;
        }

        each(knownThemes, function(knownThemeName, themeData) {
            var knownThemeParts = knownThemeName.split(".");

            if(knownThemeParts[0] !== desiredThemeParts[0]) {
                return;
            }

            if(desiredThemeParts[1] && desiredThemeParts[1] !== knownThemeParts[1]) {
                return;
            }

            if(desiredThemeParts[2] && desiredThemeParts[2] !== knownThemeParts[2]) {
                return;
            }

            if(!result || themeData.isActive) {
                result = knownThemeName;
            }

            if(themeData.isActive) {
                return false;
            }
        });
    }

    return result;
}

function initContext(newContext) {
    try {
        if(newContext !== context) {
            knownThemes = null;
        }
    } catch(x) {
        // Cross-origin permission error
        knownThemes = null;
    }

    context = newContext;
}

function init(options) {
    options = options || {};
    initContext(options.context || domAdapter.getDocument());

    if(!context) return;
    processMarkup();
    currentThemeName = undefined;
    current(options);
}

function current(options) {
    if(!arguments.length) {
        currentThemeName = currentThemeName || readThemeMarker();
        return currentThemeName;
    }

    detachCssClasses(viewPort());

    options = options || {};
    if(typeof options === "string") {
        options = { theme: options };
    }

    var isAutoInit = options._autoInit;
    var loadCallback = options.loadCallback;
    var currentThemeData;

    currentThemeName = options.theme || currentThemeName;
    if(isAutoInit && !currentThemeName) {
        currentThemeName = themeNameFromDevice(devices.current());
    }

    currentThemeName = resolveFullThemeName(currentThemeName);

    if(currentThemeName) {
        currentThemeData = knownThemes[currentThemeName];
    }

    if(loadCallback) {
        themeReadyCallback.add(loadCallback);
    }

    if(currentThemeData) {
        // NOTE:
        // 1. <link> element re-creation leads to incorrect CSS rules priority in Internet Explorer (T246821).
        // 2. We have no reliable info, why this hack has been applied and whether it is still relevant.
        // 3. This hack leads Internet Explorer crashing after icon font has been implemented.
        //    $activeThemeLink.removeAttr("href"); // this is for IE, to stop loading prev CSS
        $activeThemeLink.attr("href", knownThemes[currentThemeName].url);
        if((themeReadyCallback.has() || options._forceTimeout) && !timerId) {
            waitForThemeLoad(currentThemeName);
        } else {
            if(pendingThemeName) {
                pendingThemeName = currentThemeName;
            }
        }
    } else {
        if(isAutoInit) {
            themeReadyCallback.fire();
            themeReadyCallback.empty();
        } else {
            throw errors.Error("E0021", currentThemeName);
        }
    }

    checkThemeDeprecation();

    attachCssClasses(viewPortUtils.originalViewPort(), currentThemeName);
}

function themeNameFromDevice(device) {
    var themeName = device.platform;
    var majorVersion = device.version && device.version[0];

    switch(themeName) {
        case "ios":
            themeName += "7";
            break;
        case "android":
            themeName += "5";
            break;
        case "win":
            themeName += (majorVersion && majorVersion === 8) ? "8" : "10";
            break;
    }

    return themeName;
}

function getCssClasses(themeName) {
    themeName = themeName || current();

    var result = [];
    var themeNameParts = themeName && themeName.split(".");

    if(themeNameParts) {
        result.push(
            "dx-theme-" + themeNameParts[0],
            "dx-theme-" + themeNameParts[0] + "-typography"
        );

        if(themeNameParts.length > 1) {
            result.push("dx-color-scheme-" + themeNameParts[1] + (isMaterial(themeName) ? ("-" + themeNameParts[2]) : ""));
        }
    }

    return result;
}

var themeClasses;
function attachCssClasses(element, themeName) {
    themeClasses = getCssClasses(themeName).join(" ");
    $(element).addClass(themeClasses);

    var activateHairlines = function() {
        var pixelRatio = windowUtils.hasWindow() && window.devicePixelRatio;

        if(!pixelRatio || pixelRatio < 2) {
            return;
        }

        var $tester = $("<div>");
        $tester.css("border", ".5px solid transparent");
        $("body").append($tester);
        if($tester.outerHeight() === 1) {
            $(element).addClass(DX_HAIRLINES_CLASS);
            themeClasses += " " + DX_HAIRLINES_CLASS;
        }
        $tester.remove();
    };

    activateHairlines();
}

function detachCssClasses(element) {
    $(element).removeClass(themeClasses);
}

function themeReady(callback) {
    themeReadyCallback.add(callback);
}

function isTheme(themeRegExp, themeName) {
    if(!themeName) {
        themeName = currentThemeName || readThemeMarker();
    }

    return new RegExp(themeRegExp).test(themeName);
}

function isMaterial(themeName) {
    return isTheme("material", themeName);
}

function isAndroid5(themeName) {
    return isTheme("android5", themeName);
}

function isIos7(themeName) {
    return isTheme("ios7", themeName);
}

function isGeneric(themeName) {
    return isTheme("generic", themeName);
}

function isWin8(themeName) {
    return isTheme("win8", themeName);
}

function isWin10(themeName) {
    return isTheme("win10", themeName);
}

function checkThemeDeprecation() {
    if(isWin8()) {
        errors.log("W0010", "The 'win8' theme", "16.1", "Use the 'generic' theme instead.");
    }

    if(isWin10()) {
        errors.log("W0010", "The 'win10' theme", "17.2", "Use the 'generic' theme instead.");
    }

    if(isAndroid5()) {
        errors.log("W0010", "The 'android5' theme", "18.1", "Use the 'material' theme instead.");
    }
}

var initDeferred = new Deferred();

function autoInit() {
    init({
        _autoInit: true,
        _forceTimeout: true
    });

    if($(DX_LINK_SELECTOR, context).length) {
        throw errors.Error("E0022");
    }

    initDeferred.resolve();
}

if(windowUtils.hasWindow()) {
    autoInit();
} else {
    ready(autoInit);
}

viewPortChanged.add(function(viewPort, prevViewPort) {
    initDeferred.done(function() {
        detachCssClasses(prevViewPort);
        attachCssClasses(viewPort);
    });
});

devices.changed.add(function() {
    init({ _autoInit: true });
});

/**
 * @name ui.themes
 * @namespace DevExpress.ui
 * @module ui/themes
 * @export default
 */
/**
 * @name ui.themesmethods.current
 * @publicName current()
 * @static
 * @return string
 */
/**
 * @name ui.themesmethods.current
 * @publicName current(themeName)
 * @param1 themeName:string
 * @static
 */
exports.current = current;

/**
 * @name ui.themesmethods.ready
 * @publicName ready(callback)
 * @param1 callback:function
 * @static
 */
exports.ready = themeReady;

exports.init = init;

exports.attachCssClasses = attachCssClasses;
exports.detachCssClasses = detachCssClasses;

exports.themeNameFromDevice = themeNameFromDevice;
exports.waitForThemeLoad = waitForThemeLoad;
exports.isMaterial = isMaterial;
exports.isAndroid5 = isAndroid5;
exports.isIos7 = isIos7;
exports.isGeneric = isGeneric;
exports.isWin8 = isWin8;
exports.isWin10 = isWin10;


exports.resetTheme = function() {
    $activeThemeLink && $activeThemeLink.attr("href", "about:blank");
    currentThemeName = null;
    pendingThemeName = null;
};

