import jQuery from "jquery";
import rendererBase from "../../core/renderer_base";
var useJQuery = require("./use_jquery")();

if(useJQuery) {
    rendererBase.set(jQuery);
}
