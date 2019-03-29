import jQuery from "jquery";
import dataUtils from "../../core/element_data";
var useJQuery = require("./use_jquery")();

if(useJQuery) {
    dataUtils.setDataStrategy(jQuery);
}
