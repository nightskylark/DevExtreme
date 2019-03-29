import dxTreeMap from "./tree_map.base";

require("./tiling.squarified");
require("./tiling.strip");
require("./tiling.slice_and_dice");
require("./tiling.rotated_slice_and_dice");

require("./colorizing.discrete");
require("./colorizing.gradient");
require("./colorizing.range");

require("./api");
require("./hover");
require("./selection");
require("./tooltip");
require("./tracker");
require("./drilldown");
require("./plain_data_source");

// PLUGINS_SECTION
import { plugin as exportPlugin } from "../core/export";
import { plugin as titlePlugin } from "../core/title";
import { plugin as loadingIndicatorPlugin } from "../core/loading_indicator";
dxTreeMap.addPlugin(exportPlugin);
dxTreeMap.addPlugin(titlePlugin);
dxTreeMap.addPlugin(loadingIndicatorPlugin);

export default dxTreeMap;
