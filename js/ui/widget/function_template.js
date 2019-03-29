import TemplateBase from "./ui.template_base";
import domUtils from "../../core/utils/dom";

var FunctionTemplate = TemplateBase.inherit({

    ctor: function(render) {
        this._render = render;
    },

    _renderCore: function(options) {
        return domUtils.normalizeTemplateElement(this._render(options));
    }

});


module.exports = FunctionTemplate;
