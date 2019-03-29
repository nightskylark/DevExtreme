import windowUtils from "./utils/window";
var window = windowUtils.getWindow();
import injector from "./utils/dependency_injector";

var nativeXMLHttpRequest = {
    getXhr: function() {
        return new window.XMLHttpRequest();
    }
};

module.exports = injector(nativeXMLHttpRequest);
