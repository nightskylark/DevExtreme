import lineSeriesModule from "./line_series";
var lineSeries = lineSeriesModule.chart.line;
import scatterSeriesModule from "./scatter_series";
var scatterSeries = scatterSeriesModule.chart;
import areaSeriesModule from "./area_series";
var areaSeries = areaSeriesModule.chart.area;
import barSeries from "./bar_series";
var chartBarSeries = barSeries.chart.bar;
var polarBarSeries = barSeries.polar.bar;
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
import iteratorUtils from "../../core/utils/iterator";
var each = iteratorUtils.each;
var _extend = extend;
var _each = each;
import commonUtils from "../../core/utils/common";
var _noop = commonUtils.noop;

exports.chart = {};
exports.chart.bubble = _extend({}, scatterSeries, {

    getErrorBarRangeCorrector: _noop,

    _calculateErrorBars: _noop,

    _getMainColor: chartBarSeries._getMainColor,

    _createPointStyles: chartBarSeries._createPointStyles,

    _updatePointsVisibility: chartBarSeries._updatePointsVisibility,

    _getOptionsForPoint: chartBarSeries._getOptionsForPoint,

    _applyMarkerClipRect: lineSeries._applyElementsClipRect,

    _parsePointStyle: polarBarSeries._parsePointStyle,

    _createLegendState: areaSeries._createLegendState,

    _setMarkerGroupSettings: polarBarSeries._setMarkerGroupSettings,

    areErrorBarsVisible: _noop,

    _createErrorBarGroup: _noop,

    _checkData: function(data, skippedFields) {
        return scatterSeries._checkData.call(this, data, skippedFields, { value: this.getValueFields()[0], size: this.getSizeField() });
    },

    _getPointDataSelector: function(data, options) {
        const sizeField = this.getSizeField();
        const baseGetter = scatterSeries._getPointDataSelector.call(this);

        return (data) => {
            const pointData = baseGetter(data);
            pointData.size = data[sizeField];
            return pointData;
        };
    },

    _aggregators: {
        avg({ data, intervalStart }, series) {
            if(!data.length) {
                return;
            }

            const valueField = series.getValueFields()[0];
            const sizeField = series.getSizeField();
            const aggregate = data.reduce((result, item) => {
                result[0] += item[valueField];
                result[1] += item[sizeField];
                result[2]++;
                return result;
            }, [0, 0, 0]);

            return {
                [valueField]: aggregate[0] / aggregate[2],
                [sizeField]: aggregate[1] / aggregate[2],
                [series.getArgumentField()]: intervalStart
            };
        }
    },

    usePointsToDefineAutoHiding() {
        return true;
    },

    checkSeriesViewportCoord(axis, coord) {
        return true;
    },

    getShapePairCoord(coord, isArgument, getPointClearance) {
        let oppositeCoord;
        const isOpposite = !isArgument && !this._options.rotated || isArgument && this._options.rotated;
        const coordName = !isOpposite ? "vx" : "vy";
        const oppositeCoordName = !isOpposite ? "vy" : "vx";
        const points = this.getVisiblePoints();

        for(let i = 0; i < points.length; i++) {
            const p = points[i];
            const tmpCoord = Math.abs(p[coordName] - coord) <= getPointClearance(p) ? p[oppositeCoordName] : undefined;

            if(this.checkAxisVisibleAreaCoord(!isArgument, tmpCoord)) {
                oppositeCoord = tmpCoord;
                break;
            }
        }

        return oppositeCoord;
    },

    getSeriesPairCoord(coord, isArgument) {
        return this.getShapePairCoord(coord, isArgument, (point) => {
            return point.bubbleSize;
        });
    },

    getValueFields: function() {
        return [this._options.valueField || "val"];
    },

    getSizeField: function() {
        return this._options.sizeField || "size";
    },

    _animate: function() {
        var that = this;
        var lastPointIndex = that._drawnPoints.length - 1;
        var labelsGroup = that._labelsGroup;

        var labelAnimFunc = function() {
            labelsGroup && labelsGroup.animate({ opacity: 1 }, { duration: that._defaultDuration });
        };

        _each(that._drawnPoints || [], function(i, p) {
            p.animate(i === lastPointIndex ? labelAnimFunc : undefined, { r: p.bubbleSize, translateX: p.x, translateY: p.y });
        });
    },

    _patchMarginOptions: function(options) {
        options.processBubbleSize = true;
        return options;
    }
});
