// there stackedline, fullstackedline, stackedbar, fullstackedbar, stackedarea, fullstackedarea
import commonUtils from "../../core/utils/common";
var _noop = commonUtils.noop;

import extendUtils from "../../core/utils/extend";
var _extend = extendUtils.extend;
import iteratorUtils from "../../core/utils/iterator";
var each = iteratorUtils.each;
import areaSeriesModule from "./area_series";
var areaSeries = areaSeriesModule.chart;
var chartAreaSeries = areaSeries.area;
import barSeries from "./bar_series";
var chartBarSeries = barSeries.chart.bar;
import lineSeriesModule from "./line_series";
var lineSeries = lineSeriesModule.chart;
import vizUtils from "../core/utils";
import objectUtils from "../../core/utils/object";

var baseStackedSeries = {
    getErrorBarRangeCorrector: _noop,
    _calculateErrorBars: _noop,
    _updateOptions: function(options) {
        this._stackName = "axis_" + (options.axis || "default");
    }
};

exports.chart = {};
exports.polar = {};

exports.chart["stackedline"] = _extend({}, lineSeries.line, baseStackedSeries, { });

exports.chart["stackedspline"] = _extend({}, lineSeries["spline"], baseStackedSeries, {});

exports.chart["fullstackedline"] = _extend({}, lineSeries.line, baseStackedSeries, {
    getValueRangeInitialValue: areaSeries.area.getValueRangeInitialValue
});

exports.chart["fullstackedspline"] = _extend({}, lineSeries["spline"], baseStackedSeries, {
    getValueRangeInitialValue: areaSeries.area.getValueRangeInitialValue
});

var stackedBar = exports.chart["stackedbar"] = _extend({}, chartBarSeries, baseStackedSeries, {
    _updateOptions: function(options) {
        baseStackedSeries._updateOptions.call(this, options);
        this._stackName = this._stackName + "_stack_" + (options.stack || "default");
    }
});

exports.chart["fullstackedbar"] = _extend({}, chartBarSeries, baseStackedSeries, {
    _updateOptions: stackedBar._updateOptions
});

function clonePoint(point, value, minValue, position) {
    point = objectUtils.clone(point);
    point.value = value;
    point.minValue = minValue;
    point.translate();
    point.argument = point.argument + position;
    return point;
}

function preparePointsForStackedAreaSegment(points) {
    var i = 0;
    var p;
    var result = [];
    var array;
    var len = points.length;

    while(i < len) {
        p = points[i];
        array = [p];
        if(p.leftHole) {
            array = [clonePoint(p, p.leftHole, p.minLeftHole, "left"), p];
        }
        if(p.rightHole) {
            array.push(clonePoint(p, p.rightHole, p.minRightHole, "right"));
        }
        result.push(array);
        i++;
    }

    return [].concat.apply([], result);
}

exports.chart["stackedarea"] = _extend({}, chartAreaSeries, baseStackedSeries, {
    _prepareSegment: function(points, rotated) {
        return chartAreaSeries._prepareSegment.call(this, preparePointsForStackedAreaSegment(points), rotated);
    },
    _appendInGroup: function() {
        this._group.append(this._extGroups.seriesGroup).toBackground();
    }
});

function getPointsByArgFromPrevSeries(prevSeries, argument) {
    var result;
    while(!result && prevSeries) {
        result = prevSeries._segmentByArg && prevSeries._segmentByArg[argument]; // T357324
        prevSeries = prevSeries._prevSeries;
    }
    return result;
}

exports.chart["stackedsplinearea"] = _extend({}, areaSeries["splinearea"], baseStackedSeries, {
    _prepareSegment: function(points, rotated) {
        var that = this;
        var areaSegment;
        points = preparePointsForStackedAreaSegment(points);
        if(!this._prevSeries || points.length === 1) {
            areaSegment = areaSeries["splinearea"]._prepareSegment.call(this, points, rotated);
        } else {
            var forwardPoints = lineSeries.spline._calculateBezierPoints(points, rotated);

            var backwardPoints = vizUtils.map(points, function(p) {
                var point = p.getCoords(true);
                point.argument = p.argument;
                return point;
            });

            var prevSeriesForwardPoints = [];
            var pointByArg = {};
            var i = 0;
            var len = that._prevSeries._segments.length;

            while(i < len) {
                prevSeriesForwardPoints = prevSeriesForwardPoints.concat(that._prevSeries._segments[i].line);
                i++;
            }

            each(prevSeriesForwardPoints, function(_, p) {
                if(p.argument !== null) {
                    var argument = p.argument.valueOf();
                    if(!pointByArg[argument]) {
                        pointByArg[argument] = [p];
                    } else {
                        pointByArg[argument].push(p);
                    }
                }
            });
            that._prevSeries._segmentByArg = pointByArg;
            backwardPoints = lineSeries.spline._calculateBezierPoints(backwardPoints, rotated);
            each(backwardPoints, function(i, p) {
                var argument = p.argument.valueOf();
                var prevSeriesPoints;
                if(i % 3 === 0) {
                    prevSeriesPoints = pointByArg[argument] || getPointsByArgFromPrevSeries(that._prevSeries, argument);
                    if(prevSeriesPoints) {
                        backwardPoints[i - 1] && prevSeriesPoints[0] && (backwardPoints[i - 1] = prevSeriesPoints[0]);
                        backwardPoints[i + 1] && (backwardPoints[i + 1] = prevSeriesPoints[2] || p);
                    }
                }
            });
            areaSegment = {
                line: forwardPoints,
                area: forwardPoints.concat(backwardPoints.reverse())
            };
            that._areaPointsToSplineAreaPoints(areaSegment.area);
        }
        return areaSegment;
    },
    _appendInGroup: exports.chart["stackedarea"]._appendInGroup
});

exports.chart["fullstackedarea"] = _extend({}, chartAreaSeries, baseStackedSeries, {
    _prepareSegment: exports.chart["stackedarea"]._prepareSegment,
    _appendInGroup: exports.chart["stackedarea"]._appendInGroup
});

exports.chart["fullstackedsplinearea"] = _extend({}, areaSeries["splinearea"], baseStackedSeries, {
    _prepareSegment: exports.chart["stackedsplinearea"]._prepareSegment,
    _appendInGroup: exports.chart["stackedarea"]._appendInGroup
});

exports.polar["stackedbar"] = _extend({}, barSeries.polar.bar, baseStackedSeries, {});
