var $ = require("../../core/renderer");
import TemplateBase from "./ui.template_base";

var EmptyTemplate = TemplateBase.inherit({

    _renderCore: function() {
        return $();
    }

});


module.exports = EmptyTemplate;
