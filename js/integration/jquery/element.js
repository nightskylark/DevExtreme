import domUtils from "../../core/utils/dom";
var setPublicElementWrapper = domUtils.setPublicElementWrapper;
var useJQuery = require("./use_jquery")();

var getPublicElement = function($element) {
    return $element;
};

if(useJQuery) {
    setPublicElementWrapper(getPublicElement);
}
