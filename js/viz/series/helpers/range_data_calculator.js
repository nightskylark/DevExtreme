const { unique, getAddFunction } = require("../../core/utils");
import isDefined from "../../../core/utils/type";
import noop from "../../../core/utils/common";
const DISCRETE = "discrete";

function continuousRangeCalculator(range, minValue, maxValue) {
    range.min = range.min < minValue ? range.min : minValue;
    range.max = range.max > maxValue ? range.max : maxValue;
}

function getRangeCalculator(axisType, axis) {
    if(axisType === DISCRETE) {
        return function(range, minValue, maxValue) {
            if(minValue !== maxValue) {
                range.categories.push(maxValue);
            }
            range.categories.push(minValue);
        };
    }
    if(axis) {
        return function(range, value) {
            var interval = axis.calculateInterval(value, range.prevValue);
            var minInterval = range.interval;

            range.interval = (minInterval < interval ? minInterval : interval) || minInterval;
            range.prevValue = value;
            continuousRangeCalculator(range, value, value);
        };
    }
    return continuousRangeCalculator;
}

function getInitialRange(axisType, dataType, firstValue) {
    var range = {
        axisType: axisType,
        dataType: dataType
    };

    if(axisType === DISCRETE) {
        range.categories = [];
    } else {
        range.min = firstValue;
        range.max = firstValue;
    }
    return range;
}

function processCategories(range) {
    if(range.categories) {
        range.categories = unique(range.categories);
    }
}

function getValueForArgument(point, extraPoint, x) {
    if(extraPoint && isDefined(extraPoint.value)) {
        var y1 = point.value;
        var y2 = extraPoint.value;
        var x1 = point.argument;
        var x2 = extraPoint.argument;

        return ((x - x1) * (y2 - y1)) / (x2 - x1) + y1;
    } else {
        return point.value;
    }
}

function calculateRangeBetweenPoints(rangeCalculator, range, point, prevPoint, bound) {
    var value = getValueForArgument(point, prevPoint, bound);
    rangeCalculator(range, value, value);
}

function isLineSeries(series) {
    return series.type.toLowerCase().indexOf("line") >= 0 || series.type.toLowerCase().indexOf("area") >= 0;
}

function getViewportReducer(series) {
    var rangeCalculator = getRangeCalculator(series.valueAxisType);
    var axis = series.getArgumentAxis();
    var viewport = axis && series.getArgumentAxis().visualRange() || {};
    var viewportFilter;
    var calculatePointBetweenPoints = isLineSeries(series) ? calculateRangeBetweenPoints : noop;

    if(axis && axis.getMarginOptions().checkInterval) {
        const range = series.getArgumentAxis().getTranslator().getBusinessRange();
        const add = getAddFunction(range, false);
        const interval = range.interval;

        if(isFinite(interval)) {
            viewport.startValue = add(viewport.startValue, interval, -1);
            viewport.endValue = add(viewport.endValue, interval);
        }
    }

    viewportFilter = module.exports.getViewPortFilter(viewport);

    return function(range, point, index, points) {
        var argument = point.argument;

        if(!point.hasValue()) {
            return range;
        }

        if(viewportFilter(argument)) {
            if(!range.startCalc) {
                range.startCalc = true;
                calculatePointBetweenPoints(rangeCalculator, range, point, points[index - 1], viewport.startValue);
            }
            rangeCalculator(range, point.getMinValue(), point.getMaxValue());
        } else if(!viewport.categories && isDefined(viewport.startValue) && argument > viewport.startValue) {
            if(!range.startCalc) {
                calculatePointBetweenPoints(rangeCalculator, range, point, points[index - 1], viewport.startValue);
            }
            range.endCalc = true;
            calculatePointBetweenPoints(rangeCalculator, range, point, points[index - 1], viewport.endValue);
        }

        return range;
    };
}

module.exports = {
    getViewPortFilter(viewport) {
        if(viewport.categories) {
            const dictionary = viewport.categories.reduce((result, category) => {
                result[category.valueOf()] = true;
                return result;
            }, {});
            return function(argument) {
                return dictionary[argument.valueOf()];
            };
        }
        if(!isDefined(viewport.startValue) && !isDefined(viewport.endValue)) {
            return function() {
                return true;
            };
        }
        if(!isDefined(viewport.endValue)) {
            return function(argument) {
                return argument >= viewport.startValue;
            };
        }
        if(!isDefined(viewport.startValue)) {
            return function(argument) {
                return argument <= viewport.endValue;
            };
        }
        return function(argument) {
            return argument >= viewport.startValue && argument <= viewport.endValue;
        };
    },

    getArgumentRange: function(series) {
        var data = series._data || [];
        var range = {};
        if(data.length) {
            if(series.argumentAxisType === DISCRETE) {
                range = {
                    categories: data.map(function(item) { return item.argument; })
                };
            } else {
                let interval;
                if(data.length > 1) {
                    const i1 = series.getArgumentAxis().calculateInterval(data[0].argument, data[1].argument);
                    const i2 = series.getArgumentAxis().calculateInterval(data[data.length - 1].argument, data[data.length - 2].argument);
                    interval = Math.min(i1, i2);
                }
                range = {
                    min: data[0].argument,
                    max: data[data.length - 1].argument,
                    interval
                };
            }
        }
        return range;
    },

    getRangeData: function(series) {
        var points = series.getPoints();
        var useAggregation = series.useAggregation();
        var argumentCalculator = getRangeCalculator(series.argumentAxisType, points.length > 1 && series.getArgumentAxis());
        var valueRangeCalculator = getRangeCalculator(series.valueAxisType);
        var viewportReducer = getViewportReducer(series);

        var range = points.reduce(function(range, point, index, points) {
            var argument = point.argument;
            argumentCalculator(range.arg, argument, argument);
            if(point.hasValue()) {
                valueRangeCalculator(range.val, point.getMinValue(), point.getMaxValue());
                viewportReducer(range.viewport, point, index, points);
            }
            return range;
        }, {
            arg: getInitialRange(series.argumentAxisType, series.argumentType, points.length ? points[0].argument : undefined),
            val: getInitialRange(series.valueAxisType, series.valueType, points.length ? series.getValueRangeInitialValue() : undefined),
            viewport: getInitialRange(series.valueAxisType, series.valueType, points.length ? series.getValueRangeInitialValue() : undefined)
        });

        if(useAggregation) {
            const argumentRange = this.getArgumentRange(series);
            if(series.argumentAxisType === DISCRETE) {
                range.arg = argumentRange;
            } else {
                const viewport = series.getArgumentAxis().getViewport();
                if(isDefined(viewport.startValue) || isDefined(viewport.length)) {
                    argumentCalculator(range.arg, argumentRange.min, argumentRange.min);
                }
                if(isDefined(viewport.endValue) || isDefined(viewport.length) && isDefined(viewport.startValue)) {
                    argumentCalculator(range.arg, argumentRange.max, argumentRange.max);
                }
            }
        }

        processCategories(range.arg);
        processCategories(range.val);

        return range;
    },

    getViewport: function(series) {
        var points = series.getPoints();
        var range = {};
        var reducer;

        reducer = getViewportReducer(series);
        range = getInitialRange(series.valueAxisType, series.valueType, points.length ? series.getValueRangeInitialValue() : undefined);
        points.some(function(point, index) {
            reducer(range, point, index, points);
            return range.endCalc;
        });

        return range;
    },

    getPointsInViewPort: function(series) {
        var argumentViewPortFilter = this.getViewPortFilter(series.getArgumentAxis().visualRange() || {});
        var valueViewPort = series.getValueAxis().visualRange() || {};
        var valueViewPortFilter = this.getViewPortFilter(valueViewPort);
        var points = series.getPoints();

        var addValue = function(values, point, isEdge) {
            var minValue = point.getMinValue();
            var maxValue = point.getMaxValue();
            var isMinValueInViewPort = valueViewPortFilter(minValue);
            var isMaxValueInViewPort = valueViewPortFilter(maxValue);

            if(isMinValueInViewPort) {
                values.push(minValue);
            }
            if(maxValue !== minValue && isMaxValueInViewPort) {
                values.push(maxValue);
            }
            if(isEdge && !isMinValueInViewPort && !isMaxValueInViewPort) {
                if(!values.length) {
                    values.push(valueViewPort.startValue);
                } else {
                    values.push(valueViewPort.endValue);
                }
            }
        };

        var addEdgePoints = isLineSeries(series) ? function(result, points, index) {
            var point = points[index];
            var prevPoint = points[index - 1];
            var nextPoint = points[index + 1];

            if(nextPoint && argumentViewPortFilter(nextPoint.argument)) {
                addValue(result[1], point, true);
            }

            if(prevPoint && argumentViewPortFilter(prevPoint.argument)) {
                addValue(result[1], point, true);
            }
        } : noop;

        var checkPointInViewport = function(result, point, index) {
            if(argumentViewPortFilter(point.argument)) {
                addValue(result[0], point);
            } else {
                addEdgePoints(result, points, index);
            }
            return result;
        };

        return points.reduce(checkPointInViewport, [[], []]);
    }
};
