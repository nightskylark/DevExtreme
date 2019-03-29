import dxTreeMap from "./tree_map.base";

import "./tiling.squarified";
import "./tiling.strip";
import "./tiling.slice_and_dice";
import "./tiling.rotated_slice_and_dice";

import "./colorizing.discrete";
import "./colorizing.gradient";
import "./colorizing.range";

import "./api";
import "./hover";
import "./selection";
import "./tooltip";
import "./tracker";
import "./drilldown";
import "./plain_data_source";

// PLUGINS_SECTION
import { plugin as exportPlugin } from "../core/export";
import { plugin as titlePlugin } from "../core/title";
import { plugin as loadingIndicatorPlugin } from "../core/loading_indicator";
dxTreeMap.addPlugin(exportPlugin);
dxTreeMap.addPlugin(titlePlugin);
dxTreeMap.addPlugin(loadingIndicatorPlugin);

export default dxTreeMap;
