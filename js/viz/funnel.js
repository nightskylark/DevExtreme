var dxFunnel = require("./funnel/funnel");

import labelModule from "./funnel/label";
dxFunnel.addPlugin(labelModule.plugin);
import exportModule from "./core/export";
dxFunnel.addPlugin(exportModule.plugin);
import titleModule from "./core/title";
dxFunnel.addPlugin(titleModule.plugin);
import legendModule from "./components/legend";
dxFunnel.addPlugin(legendModule.plugin);
import trackerModule from "./funnel/tracker";
dxFunnel.addPlugin(trackerModule.plugin);
import tooltipModule from "./funnel/tooltip";
dxFunnel.addPlugin(tooltipModule.plugin);
import loadingIndicatorModule from "./core/loading_indicator";
dxFunnel.addPlugin(loadingIndicatorModule.plugin);

module.exports = dxFunnel;
