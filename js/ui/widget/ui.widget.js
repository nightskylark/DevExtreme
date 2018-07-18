"use strict";

var WidgetCore = require("./ui.widget_core"),
    TemplatePlugin = require("./template_plugin");


/**
* @name template
* @type String|function|Node|jQuery
* @section Common
*/


var Widget = WidgetCore.inherit({
    _init: function() {
        this._defaultTemplates = {};
        this.callBase();
    }
});

Widget.plugins.push(new TemplatePlugin());

module.exports = Widget;
