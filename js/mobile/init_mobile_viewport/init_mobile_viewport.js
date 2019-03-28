var $ = require("../../core/renderer");
var domAdapter = require("../../core/dom_adapter");
var windowUtils = require("../../core/utils/window");
var window = windowUtils.getWindow();
var eventsEngine = require("../../events/core/events_engine");
var extend = require("../../core/utils/extend").extend;
var resizeCallbacks = require("../../core/utils/resize_callbacks");
var support = require("../../core/utils/support");
var styleUtils = require("../../core/utils/style");
var devices = require("../../core/devices");

var initMobileViewport = function(options) {
    options = extend({}, options);
    var realDevice = devices.real();
    var allowZoom = options.allowZoom;
    var allowPan = options.allowPan;
    var allowSelection = ("allowSelection" in options) ? options.allowSelection : realDevice.platform === "generic";

    var metaSelector = "meta[name=viewport]";
    if(!$(metaSelector).length) {
        $("<meta>").attr("name", "viewport").appendTo("head");
    }

    var metaVerbs = ["width=device-width"];
    var msTouchVerbs = [];

    if(allowZoom) {
        msTouchVerbs.push("pinch-zoom");
    } else {
        metaVerbs.push("initial-scale=1.0", "maximum-scale=1.0, user-scalable=no");
    }

    if(allowPan) {
        msTouchVerbs.push("pan-x", "pan-y");
    }

    if(!allowPan && !allowZoom) {
        $("html, body").css({
            "msContentZooming": "none",
            "msUserSelect": "none",
            "overflow": "hidden"
        });
    } else {
        $("html").css("msOverflowStyle", "-ms-autohiding-scrollbar");
    }

    if(!allowSelection && support.supportProp("userSelect")) {
        $(".dx-viewport").css(styleUtils.styleProp("userSelect"), "none");
    }

    $(metaSelector).attr("content", metaVerbs.join());
    $("html").css("msTouchAction", msTouchVerbs.join(" ") || "none");

    realDevice = devices.real();

    if(support.touch && !(realDevice.platform === "win" && realDevice.version[0] === 10)) {
        eventsEngine.off(domAdapter.getDocument(), ".dxInitMobileViewport");
        eventsEngine.on(domAdapter.getDocument(), "dxpointermove.dxInitMobileViewport", function(e) {
            var count = e.pointers.length;
            var isTouchEvent = e.pointerType === "touch";
            var zoomDisabled = !allowZoom && count > 1;
            var panDisabled = !allowPan && count === 1 && !e.isScrollingEvent;

            if(isTouchEvent && (zoomDisabled || panDisabled)) {
                e.preventDefault();
            }
        });
    }

    if(realDevice.ios) {
        var isPhoneGap = (domAdapter.getLocation().protocol === "file:");

        if(!isPhoneGap) {
            // NOTE: fix app size after device rotation in Safari when keyboard was shown
            resizeCallbacks.add(function() {
                var windowWidth = $(window).width();
                $("body").width(windowWidth);
            });
        }
    }

    if(realDevice.android) {
        resizeCallbacks.add(function() {
            setTimeout(function() {
                var activeElement = domAdapter.getActiveElement();

                activeElement.scrollIntoViewIfNeeded ?
                    activeElement.scrollIntoViewIfNeeded() :
                    activeElement.scrollIntoView(false);
            });
        });
    }
};

exports.initMobileViewport = initMobileViewport;
