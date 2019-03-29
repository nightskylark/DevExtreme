/* global DevExpress */

import "./core";

module.exports = DevExpress.ui = {};

/* Visual Studio Designer Callback (Find better place) */
import { renderedCallbacks } from "../../ui/widget/ui.template_base";
DevExpress.ui.templateRendered = renderedCallbacks;
