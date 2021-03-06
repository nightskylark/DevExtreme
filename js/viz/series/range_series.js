"use strict";

// there are rangebar, rangearea
var extend = require("../../core/utils/extend").extend,
    _extend = extend,
    _isDefined = require("../../core/utils/type").isDefined,
    _map = require("../core/utils").map,
    _noop = require("../../core/utils/common").noop,

    scatterSeries = require("./scatter_series").chart,
    barSeries = require("./bar_series").chart.bar,
    areaSeries = require("./area_series").chart.area;

exports.chart = {};

var baseRangeSeries = {

    areErrorBarsVisible: _noop,
    _createErrorBarGroup: _noop,

    _checkData: function(data) {
        return scatterSeries._checkData(data) && data.minValue !== undefined && data.minValue === data.minValue;
    },

    getValueRangeInitialValue: scatterSeries.getValueRangeInitialValue,

    _getPointDataSelector: function(data) {
        const valueFields = this.getValueFields();
        const val1Field = valueFields[0];
        const val2Field = valueFields[1];
        const tagField = this.getTagField();
        const argumentField = this.getArgumentField();

        return (data) => {
            return {
                tag: data[tagField],
                minValue: data[val1Field],
                value: data[val2Field],
                argument: data[argumentField],
                data: data
            };
        };
    },

    _defaultAggregator: "range",

    _aggregators: {
        range({ intervalStart, data }, series) {
            if(!data.length) {
                return;
            }

            const valueFields = series.getValueFields();
            const val1Field = valueFields[0];
            const val2Field = valueFields[1];

            const result = data.reduce((result, item) => {
                const val1 = item[val1Field];
                const val2 = item[val2Field];

                if(!_isDefined(val1) || !_isDefined(val2)) {
                    return result;
                }

                result[val1Field] = Math.min(result[val1Field], Math.min(val1, val2));
                result[val2Field] = Math.max(result[val2Field], Math.max(val1, val2));

                return result;
            }, {
                [val1Field]: Infinity,
                [val2Field]: -Infinity,
                [series.getArgumentField()]: intervalStart
            });

            if(!isFinite(result[val1Field]) || !isFinite(result[val2Field])) {
                if(data.filter(i => i[val1Field] === null && i[val2Field] === null).length === data.length) {
                    result[val1Field] = result[val2Field] = null;
                } else {
                    return;
                }
            }

            return result;
        }
    },

    getValueFields: function() {
        return [this._options.rangeValue1Field || "val1", this._options.rangeValue2Field || "val2"];
    }
};

exports.chart["rangebar"] = _extend({}, barSeries, baseRangeSeries);

exports.chart["rangearea"] = _extend({}, areaSeries, {
    _drawPoint: function(options) {
        var point = options.point;

        if(point.isInVisibleArea()) {
            point.clearVisibility();
            point.draw(this._renderer, options.groups);
            this._drawnPoints.push(point);
            if(!point.visibleTopMarker) {
                point.hideMarker("top");
            }
            if(!point.visibleBottomMarker) {
                point.hideMarker("bottom");
            }
        } else {
            point.setInvisibility();
        }
    },

    _prepareSegment: function(points, orderedPoints, rotated) {
        var processedPoints = this._processSinglePointsAreaSegment(points, rotated),
            processedMinPointsCoords = _map(processedPoints, function(pt) { return pt.getCoords(true); }),
            orderedMinPoints = orderedPoints && orderedPoints.map(function(p) { return p.getCoords(true); });

        return {
            line: processedPoints,
            orderedLine: orderedPoints,
            bottomLine: processedMinPointsCoords,
            orderedBottomLine: orderedMinPoints,
            area: _map(processedPoints, function(pt) { return pt.getCoords(); }).concat(processedMinPointsCoords.slice().reverse()),
            orderedArea: orderedPoints && orderedPoints.map(function(pt) { return pt.getCoords(); }).concat(orderedMinPoints.slice().reverse()),
            singlePointSegment: processedPoints !== points
        };
    },

    _getDefaultSegment: function(segment) {
        var defaultSegment = areaSeries._getDefaultSegment.call(this, segment);
        defaultSegment.bottomLine = defaultSegment.line;
        return defaultSegment;
    },

    _removeElement: function(element) {
        areaSeries._removeElement.call(this, element);
        element.bottomLine && element.bottomLine.remove();
    },

    _drawElement: function(segment, group) {
        var that = this,
            drawnElement = areaSeries._drawElement.call(that, segment, group);
        drawnElement.bottomLine = that._bordersGroup && that._createBorderElement(segment.bottomLine, { "stroke-width": that._styles.normal.border["stroke-width"] }).append(that._bordersGroup);

        return drawnElement;
    },

    _applyStyle: function(style) {
        var that = this,
            elementsGroup = that._elementsGroup,
            bordersGroup = that._bordersGroup;

        elementsGroup && elementsGroup.smartAttr(style.elements);
        bordersGroup && bordersGroup.attr(style.border);
        (that._graphics || []).forEach(function(graphic) {
            graphic.line && graphic.line.attr({ "stroke-width": style.border["stroke-width"] });
            graphic.bottomLine && graphic.bottomLine.attr({ "stroke-width": style.border["stroke-width"] });
        });
    },

    _updateElement: function(element, segment, animate, complete) {
        var bottomLineParams = segment.orderedBottomLine ? { points: segment.orderedBottomLine } : { points: segment.bottomLine },
            bottomBorderElement = element.bottomLine;

        areaSeries._updateElement.call(this, element, segment, animate, function() {
            bottomBorderElement && bottomBorderElement.attr({ points: segment.bottomLine });
            complete && complete();
        });

        if(bottomBorderElement) {
            animate ? bottomBorderElement.animate(bottomLineParams) : bottomBorderElement.attr(bottomLineParams);
        }
    }
}, baseRangeSeries);
