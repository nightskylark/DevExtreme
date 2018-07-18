"use strict";

let ButtonCore = require("./button/button.core");
let ButtonTemplatePlugin = require("./button/button.template_plugin");
let registerComponent = require("../core/component_registrator");
let ValidationMixin = require("./validation/validation_mixin");

let Button = ButtonCore.inherit().include(ValidationMixin);

Button.plugins.push(new ButtonTemplatePlugin());

registerComponent("dxButton", Button);

module.exports = Button;
