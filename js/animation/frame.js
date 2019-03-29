import windowUtils from "../core/utils/window";
var window = windowUtils.hasWindow() ? windowUtils.getWindow() : {};
import callOnce from "../core/utils/call_once";
var FRAME_ANIMATION_STEP_TIME = 1000 / 60;

var request = function(callback) {
    return setTimeout(callback, FRAME_ANIMATION_STEP_TIME);
};

var cancel = function(requestID) {
    clearTimeout(requestID);
};

var setAnimationFrameMethods = callOnce(function() {
    var nativeRequest = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame;

    var nativeCancel = window.cancelAnimationFrame ||
        window.webkitCancelAnimationFrame ||
        window.mozCancelAnimationFrame ||
        window.oCancelAnimationFrame ||
        window.msCancelAnimationFrame;

    if(nativeRequest && nativeCancel) {
        request = nativeRequest;
        cancel = nativeCancel;
    }

    if(nativeRequest && !nativeCancel) {
        // NOTE: https://code.google.com/p/android/issues/detail?id=66243

        var canceledRequests = {};

        request = function(callback) {
            var requestId = nativeRequest.call(window, function() {
                try {
                    if(requestId in canceledRequests) {
                        return;
                    }
                    callback.apply(this, arguments);
                } finally {
                    delete canceledRequests[requestId];
                }
            });
            return requestId;
        };

        cancel = function(requestId) {
            canceledRequests[requestId] = true;
        };
    }
});

/**
 * @name utils.requestAnimationFrame
 * @publicName requestAnimationFrame(callback)
 * @type method
 * @param1 callback:function
 * @return number
 * @namespace DevExpress.utils
 * @module animation/frame
 * @export request
 */
exports.requestAnimationFrame = function() {
    setAnimationFrameMethods();
    return request.apply(window, arguments);
};

/**
 * @name utils.cancelAnimationFrame
 * @publicName cancelAnimationFrame(requestID)
 * @type method
 * @param1 requestID:number
 * @namespace DevExpress.utils
 * @module animation/frame
 * @export cancel
 */
exports.cancelAnimationFrame = function() {
    setAnimationFrameMethods();
    cancel.apply(window, arguments);
};
