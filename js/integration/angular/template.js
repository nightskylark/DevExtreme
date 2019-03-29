import $ from "../../core/renderer";
import TemplateBase from "../../ui/widget/ui.template_base";
import typeUtils from "../../core/utils/type";
var isFunction = typeUtils.isFunction;
import domUtils from "../../core/utils/dom";

var NgTemplate = TemplateBase.inherit({

    ctor: function(element, templateCompiler) {
        this._element = element;

        this._compiledTemplate = templateCompiler(domUtils.normalizeTemplateElement(this._element));
    },

    _renderCore: function(options) {
        var compiledTemplate = this._compiledTemplate;

        return isFunction(compiledTemplate) ? compiledTemplate(options) : compiledTemplate;
    },

    source: function() {
        return $(this._element).clone();
    }

});

module.exports = NgTemplate;
