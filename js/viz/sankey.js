var dxSankey = require("./sankey/sankey");
import { setTooltipCustomOptions } from "./sankey/tooltip";

dxSankey.addPlugin(require("./core/export").plugin);
dxSankey.addPlugin(require("./core/title").plugin);
dxSankey.addPlugin(require("./sankey/tracker").plugin);
dxSankey.addPlugin(require("./core/loading_indicator").plugin);
dxSankey.addPlugin(require("./core/tooltip").plugin);
setTooltipCustomOptions(dxSankey);

module.exports = dxSankey;
