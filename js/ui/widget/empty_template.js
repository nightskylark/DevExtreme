var $ = require("../../core/renderer");
var TemplateBase = require("./ui.template_base");

var EmptyTemplate = TemplateBase.inherit({

    _renderCore: function() {
        return $();
    }

});


module.exports = EmptyTemplate;
