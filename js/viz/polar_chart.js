var _noop = require("../core/utils/common").noop;
var registerComponent = require("../core/component_registrator");
var extend = require("../core/utils/extend").extend;
var vizUtils = require("./core/utils");
var AdvancedChart = require("./chart_components/advanced_chart").AdvancedChart;
var DEFAULT_PANE_NAME = 'default';

var dxPolarChart = AdvancedChart.inherit({
    _themeSection: 'polar',

    _createPanes: function() {
        return [{ name: DEFAULT_PANE_NAME }];
    },

    _checkPaneName: function() {
        return true;
    },

    _getAxisRenderingOptions: function(typeSelector) {
        var isArgumentAxis = typeSelector === "argumentAxis";
        var type = isArgumentAxis ? "circular" : "linear";
        var useSpiderWeb = this.option("useSpiderWeb");

        if(useSpiderWeb) {
            type += "Spider";
        }

        return {
            axisType: "polarAxes",
            drawingType: type
        };
    },

    _prepareAxisOptions: function(typeSelector, axisOptions) {
        var isArgumentAxis = typeSelector === "argumentAxis";
        var themeManager = this._themeManager;
        var axisUserOptions = this.option("argumentAxis");
        var argumentAxisOptions = themeManager.getOptions("argumentAxis", axisUserOptions) || {};
        var startAngle = isFinite(argumentAxisOptions.startAngle) ? vizUtils.normalizeAngle(argumentAxisOptions.startAngle) : 0;

        return {
            type: this.option("useSpiderWeb") && isArgumentAxis ? "discrete" : axisOptions.type,
            isHorizontal: true,
            showCustomBoundaryTicks: isArgumentAxis,
            startAngle: startAngle,
            endAngle: startAngle + 360
        };
    },

    _optionChangesMap: {
        useSpiderWeb: "AXES_AND_PANES"
    },

    _getExtraOptions: function() {
        return { spiderWidget: this.option("useSpiderWeb") };
    },

    _prepareToRender: function() {
        this._appendAxesGroups();
        return {};
    },

    _renderAxes: function(drawOptions) {
        var that = this;
        var valueAxis = that._getValueAxis();
        var argumentAxis = that.getArgumentAxis();

        var canvas = that._calcCanvas(argumentAxis.measureLabels(extend({}, that._canvas), true));

        argumentAxis.draw(canvas);
        valueAxis.setSpiderTicks(argumentAxis.getSpiderTicks());
        valueAxis.draw(canvas);
    },

    _getValueAxis: function() {
        return this._valueAxes[0];
    },

    _shrinkAxes: function(sizeShortage) {
        var valueAxis = this._getValueAxis();
        var argumentAxis = this.getArgumentAxis();

        if(sizeShortage && (sizeShortage.width || sizeShortage.height)) {
            argumentAxis.hideOuterElements();
            argumentAxis.updateSize(this._canvas);
            valueAxis.updateSize(this._canvas);
        }
    },

    _calcCanvas: function(measure) {
        var canvas = extend({}, this._canvas);

        canvas.left += measure.width;
        canvas.right += measure.width;
        canvas.top += measure.height;
        canvas.bottom += measure.height;
        return canvas;
    },

    _getLayoutTargets: function() {
        return [{ canvas: this._canvas }];
    },

    _getSeriesForPane: function() {
        return this.series;
    },

    _applyExtraSettings: _noop,

    _updateLegendPosition: _noop,

    _applyPointMarkersAutoHiding: _noop,

    _createScrollBar: _noop,

    _applyClipRects: _noop,

    _isRotated: _noop,

    _getCrosshairOptions: _noop,

    _isLegendInside: _noop
});

registerComponent("dxPolarChart", dxPolarChart);

module.exports = dxPolarChart;
