"use strict";

let WidgetCore = require("./ui.widget_core");
let TemplatePlugin = require("./template_plugin");
let typeUtils = require("../../core/utils/type");


/**
* @name template
* @type String|function|Node|jQuery
* @section Common
*/

var Widget = WidgetCore.inherit({
    _getTemplateByOption: function(optionName) {
        let source = this.option(optionName);
        if(typeUtils.isFunction(source)) {
            source = source.bind(this);
        }
        return this._getTemplate(source);
    }
});

Widget.addPlugin(TemplatePlugin);

module.exports = Widget;
