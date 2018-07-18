"use strict";

var WidgetCore = require("./ui.widget_core"),
    TemplatePlugin = require("./template_plugin");


/**
* @name template
* @type String|function|Node|jQuery
* @section Common
*/


var Widget = WidgetCore.inherit();

Widget.addPlugin(TemplatePlugin);

module.exports = Widget;
