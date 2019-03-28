var jQuery = require("jquery");
var easing = require("../../animation/easing");

if(jQuery) {
    easing.setEasing(jQuery.easing);
}
