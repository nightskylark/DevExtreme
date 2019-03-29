import DevExpress from "./core";
import "./data";

/// BUNDLER_PARTS
/* Viz core (dx.module-viz-core.js) */

var viz = DevExpress.viz = require("../../../bundles/modules/viz");

import themesModule from "../../../viz/themes";
import exportModule from "../../../viz/export";
import paletteModule from "../../../viz/palette";
const { currentTheme, registerTheme, refreshTheme } = themesModule;
const { exportFromMarkup, getMarkup, exportWidgets } = exportModule;
const { currentPalette, getPalette, generateColors, registerPalette } = paletteModule;
viz.currentTheme = currentTheme;
viz.registerTheme = registerTheme;
viz.exportFromMarkup = exportFromMarkup;
viz.getMarkup = getMarkup;
viz.exportWidgets = exportWidgets;
viz.currentPalette = currentPalette;
viz.getPalette = getPalette;
viz.generateColors = generateColors;
viz.registerPalette = registerPalette;
viz.refreshTheme = refreshTheme;

/* Charts (dx.module-viz-charts.js) */
viz.dxChart = require("../../../viz/chart");
viz.dxPieChart = require("../../../viz/pie_chart");
viz.dxPolarChart = require("../../../viz/polar_chart");

/* Gauges (dx.module-viz-gauges.js) */
viz.dxLinearGauge = require("../../../viz/linear_gauge");
viz.dxCircularGauge = require("../../../viz/circular_gauge");
viz.dxBarGauge = require("../../../viz/bar_gauge");

/* Range selector (dx.module-viz-rangeselector.js) */
viz.dxRangeSelector = require("../../../viz/range_selector");

/* Vector map (dx.module-viz-vectormap.js) */
viz.dxVectorMap = require("../../../viz/vector_map");
viz.map = {};
viz.map.sources = {};
import projectionModule from "../../../viz/vector_map/projection";
viz.map.projection = projectionModule.projection;

/* Sparklines (dx.module-viz-sparklines.js) */
viz.dxSparkline = require("../../../viz/sparkline");
viz.dxBullet = require("../../../viz/bullet");

/* Treemap */
viz.dxTreeMap = require("../../../viz/tree_map");

/* Funnel */
viz.dxFunnel = require("../../../viz/funnel");

/* Sankey */
viz.dxSankey = require("../../../viz/sankey");

/// BUNDLER_PARTS_END

viz.BaseWidget = require("../../../viz/core/base_widget");

import { getTheme } from "../../../viz/themes";
viz.getTheme = getTheme;
// Keep it for backward compatibility after renaming findTheme to getTheme
viz.findTheme = getTheme;
// We need to keep this method as we suggested it to users
viz.refreshAll = refreshTheme;

import { refreshPaths } from "../../../viz/utils";
viz.refreshPaths = refreshPaths;

viz.gauges = { __internals: {} };

viz._dashboard = {};
import { Renderer } from "../../../viz/core/renderers/renderer";
viz._dashboard.Renderer = Renderer;
import { SvgElement } from "../../../viz/core/renderers/renderer";
viz._dashboard.SvgElement = SvgElement;
import { patchFontOptions } from "../../../viz/core/utils";
viz._dashboard.patchFontOptions = patchFontOptions;

module.exports = viz;
