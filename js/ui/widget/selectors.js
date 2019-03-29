var $ = require("../../core/renderer");
import domAdapter from "../../core/dom_adapter";

var focusable = function(element, tabIndex) {
    if(!visible(element)) {
        return false;
    }
    var nodeName = element.nodeName.toLowerCase();
    var isTabIndexNotNaN = !isNaN(tabIndex);
    var isDisabled = element.disabled;
    var isDefaultFocus = /^(input|select|textarea|button|object|iframe)$/.test(nodeName);
    var isHyperlink = nodeName === "a";
    var isFocusable = true;
    var isContentEditable = element.isContentEditable;

    if(isDefaultFocus || isContentEditable) {
        isFocusable = !isDisabled;
    } else {
        if(isHyperlink) {
            isFocusable = element.href || isTabIndexNotNaN;
        } else {
            isFocusable = isTabIndexNotNaN;
        }
    }

    return isFocusable;
};

var visible = function(element) {
    var $element = $(element);
    return $element.is(":visible") && $element.css("visibility") !== "hidden" && $element.parents().css("visibility") !== "hidden";
};

module.exports = {
    focusable: function(index, element) {
        return focusable(element, $(element).attr("tabIndex"));
    },
    tabbable: function(index, element) {
        var tabIndex = $(element).attr("tabIndex");
        return (isNaN(tabIndex) || tabIndex >= 0) && focusable(element, tabIndex);
    },
    // note: use this method instead of is(":focus")
    focused: function($element) {
        var element = $($element).get(0);
        return domAdapter.getActiveElement() === element;
    }
};

