var jQuery = require("jquery");
var themes_callback = require("../../ui/themes_callback");
import readyCallbacksUtils from "../../core/utils/ready_callbacks";
var ready = readyCallbacksUtils.add;

if(jQuery && !themes_callback.fired()) {
    var holdReady = jQuery.holdReady || jQuery.fn.holdReady;

    holdReady(true);

    themes_callback.add(function() {
        ready(function() {
            holdReady(false);
        });
    });
}
