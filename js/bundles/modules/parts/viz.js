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
import dxChartModule from "../../../viz/chart";
viz.dxChart = dxChartModule;
import dxPieChartModule from "../../../viz/pie_chart";
viz.dxPieChart = dxPieChartModule;
import dxPolarChartModule from "../../../viz/polar_chart";
viz.dxPolarChart = dxPolarChartModule;

/* Gauges (dx.module-viz-gauges.js) */
import dxLinearGaugeModule from "../../../viz/linear_gauge";
viz.dxLinearGauge = dxLinearGaugeModule;
import dxCircularGaugeModule from "../../../viz/circular_gauge";
viz.dxCircularGauge = dxCircularGaugeModule;
import dxBarGaugeModule from "../../../viz/bar_gauge";
viz.dxBarGauge = dxBarGaugeModule;

/* Range selector (dx.module-viz-rangeselector.js) */
import dxRangeSelectorModule from "../../../viz/range_selector";
viz.dxRangeSelector = dxRangeSelectorModule;

/* Vector map (dx.module-viz-vectormap.js) */
import dxVectorMapModule from "../../../viz/vector_map";
viz.dxVectorMap = dxVectorMapModule;
viz.map = {};
viz.map.sources = {};
import projectionModule from "../../../viz/vector_map/projection";
viz.map.projection = projectionModule.projection;

/* Sparklines (dx.module-viz-sparklines.js) */
import dxSparklineModule from "../../../viz/sparkline";
viz.dxSparkline = dxSparklineModule;
import dxBulletModule from "../../../viz/bullet";
viz.dxBullet = dxBulletModule;

/* Treemap */
import dxTreeMapModule from "../../../viz/tree_map";
viz.dxTreeMap = dxTreeMapModule;

/* Funnel */
import dxFunnelModule from "../../../viz/funnel";
viz.dxFunnel = dxFunnelModule;

/* Sankey */
import dxSankeyModule from "../../../viz/sankey";
viz.dxSankey = dxSankeyModule;

/// BUNDLER_PARTS_END

import BaseWidgetModule from "../../../viz/core/base_widget";
viz.BaseWidget = BaseWidgetModule;

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
