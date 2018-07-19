"use strict";

let TemplatePlugin = require("../widget/template_plugin");

class ButtonTemplatePlugin extends TemplatePlugin {
    init(instanceGate) {
        let result = super.init(instanceGate);
        result.methods._getTemplateByOption = function(optionName) {
            let source = instanceGate.option(optionName);
            return result.methods._getTemplate(source);
        }.bind(this);

        return result;
    }
}

module.exports = ButtonTemplatePlugin;
