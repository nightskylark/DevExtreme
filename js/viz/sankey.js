import dxSankey from "./sankey/sankey";
import { setTooltipCustomOptions } from "./sankey/tooltip";

import exportModule from "./core/export";
dxSankey.addPlugin(exportModule.plugin);
import titleModule from "./core/title";
dxSankey.addPlugin(titleModule.plugin);
import trackerModule from "./sankey/tracker";
dxSankey.addPlugin(trackerModule.plugin);
import loadingIndicatorModule from "./core/loading_indicator";
dxSankey.addPlugin(loadingIndicatorModule.plugin);
import tooltipModule from "./core/tooltip";
dxSankey.addPlugin(tooltipModule.plugin);
setTooltipCustomOptions(dxSankey);

module.exports = dxSankey;
