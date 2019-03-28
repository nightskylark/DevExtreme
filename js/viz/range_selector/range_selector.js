var registerComponent = require("../../core/component_registrator");
var typeUtils = require("../../core/utils/type");
var extend = require("../../core/utils/extend").extend;
var each = require("../../core/utils/iterator").each;
var vizUtils = require("../core/utils");
var dateUtils = require("../../core/utils/date");
var adjust = require("../../core/utils/math").adjust;
var addInterval = dateUtils.addInterval;
var dateToMilliseconds = dateUtils.dateToMilliseconds;
var getSequenceByInterval = dateUtils.getSequenceByInterval;
var rangeModule = require("../translators/range");
var axisModule = require("../axes/base_axis");
var patchFontOptions = vizUtils.patchFontOptions;
var parseUtils = require("../components/parse_utils");
var _normalizeEnum = vizUtils.normalizeEnum;
var formatHelper = require("../../format_helper");
var commonModule = require("./common");
var slidersControllerModule = require("./sliders_controller");
var trackerModule = require("./tracker");
var rangeViewModule = require("./range_view");
var seriesDataSourceModule = require("./series_data_source");
var tickGeneratorModule = require("../axes/tick_generator");
var parseValue = vizUtils.getVizRangeObject;
var convertVisualRangeObject = vizUtils.convertVisualRangeObject;
var _isDefined = typeUtils.isDefined;
var _isNumber = typeUtils.isNumeric;
var _isDate = typeUtils.isDate;
var _max = Math.max;
var _ceil = Math.ceil;
var _floor = Math.floor;
var START_VALUE = "startValue";
var END_VALUE = "endValue";
var DATETIME = "datetime";
var VALUE = "value";
var DISCRETE = "discrete";
var SEMIDISCRETE = "semidiscrete";
var STRING = "string";
var VALUE_CHANGED = VALUE + "Changed";
var CONTAINER_BACKGROUND_COLOR = "containerBackgroundColor";
var SLIDER_MARKER = "sliderMarker";
var OPTION_BACKGROUND = "background";
var LOGARITHMIC = "logarithmic";
var KEEP = "keep";
var SHIFT = "shift";
var RESET = "reset";
var INVISIBLE_POS = -1000;
var SEMIDISCRETE_GRID_SPACING_FACTOR = 50;
var DEFAULT_AXIS_DIVISION_FACTOR = 30;
var DEFAULT_MINOR_AXIS_DIVISION_FACTOR = 15;
var logarithmBase = 10;

function calculateMarkerHeight(renderer, value, sliderMarkerOptions) {
    var formattedText = (value === undefined ? commonModule.consts.emptySliderMarkerText : commonModule.formatValue(value, sliderMarkerOptions));
    var textBBox = getTextBBox(renderer, formattedText, sliderMarkerOptions.font);
    return _ceil(textBBox.height) + 2 * sliderMarkerOptions.paddingTopBottom + commonModule.consts.pointerSize;
}

function calculateScaleLabelHalfWidth(renderer, value, scaleOptions, tickIntervalsInfo) {
    var formattedText = commonModule.formatValue(value, scaleOptions.label, tickIntervalsInfo, scaleOptions.valueType, scaleOptions.type, scaleOptions.logarithmBase);
    var textBBox = getTextBBox(renderer, formattedText, scaleOptions.label.font);

    return _ceil(textBBox.width / 2);
}

function calculateIndents(renderer, scale, sliderMarkerOptions, indentOptions, tickIntervalsInfo) {
    var leftMarkerHeight;
    var leftScaleLabelWidth = 0;
    var rightScaleLabelWidth = 0;
    var rightMarkerHeight;
    var placeholderWidthLeft;
    var placeholderWidthRight;
    var placeholderHeight;
    var ticks = scale.type === "semidiscrete" ? scale.customTicks : tickIntervalsInfo.ticks;
    var startTickValue;
    var endTickValue;

    indentOptions = indentOptions || {};

    placeholderWidthLeft = indentOptions.left;
    placeholderWidthRight = indentOptions.right;

    placeholderHeight = sliderMarkerOptions.placeholderHeight;

    if(sliderMarkerOptions.visible) {
        leftMarkerHeight = calculateMarkerHeight(renderer, scale.startValue, sliderMarkerOptions);
        rightMarkerHeight = calculateMarkerHeight(renderer, scale.endValue, sliderMarkerOptions);
        if(placeholderHeight === undefined) {
            placeholderHeight = _max(leftMarkerHeight, rightMarkerHeight);
        }
    }

    if(scale.label.visible) {
        startTickValue = _isDefined(scale.startValue) ? ticks[0] : undefined;
        endTickValue = _isDefined(scale.endValue) ? ticks[ticks.length - 1] : undefined;
        leftScaleLabelWidth = calculateScaleLabelHalfWidth(renderer, startTickValue, scale, tickIntervalsInfo);
        rightScaleLabelWidth = calculateScaleLabelHalfWidth(renderer, endTickValue, scale, tickIntervalsInfo);
    }
    placeholderWidthLeft = placeholderWidthLeft !== undefined ? placeholderWidthLeft : leftScaleLabelWidth;
    placeholderWidthRight = (placeholderWidthRight !== undefined ? placeholderWidthRight : rightScaleLabelWidth) || 1; // T240698

    return {
        left: placeholderWidthLeft,
        right: placeholderWidthRight,
        top: placeholderHeight || 0,
        bottom: 0
    };
}

function calculateValueType(firstValue, secondValue) {
    var typeFirstValue = typeUtils.type(firstValue);
    var typeSecondValue = typeUtils.type(secondValue);

    var validType = function(type) {
        return typeFirstValue === type || typeSecondValue === type;
    };

    return validType("date") ? DATETIME : validType("number") ? "numeric" : validType(STRING) ? STRING : "";
}

function showScaleMarkers(scaleOptions) {
    return scaleOptions.valueType === DATETIME && scaleOptions.marker.visible;
}

function updateTranslatorRangeInterval(translatorRange, scaleOptions) {
    var intervalX = scaleOptions.minorTickInterval || scaleOptions.tickInterval;
    if(scaleOptions.valueType === "datetime") {
        intervalX = dateUtils.dateToMilliseconds(intervalX);
    }
    translatorRange.addRange({ interval: intervalX });
}

function checkLogarithmicOptions(options, defaultLogarithmBase, incidentOccurred) {
    var logarithmBase;

    if(!options) {
        return;
    }

    logarithmBase = options.logarithmBase;
    if(options.type === LOGARITHMIC && logarithmBase <= 0 || (logarithmBase && !_isNumber(logarithmBase))) {
        options.logarithmBase = defaultLogarithmBase;
        incidentOccurred("E2104");
    } else if(options.type !== LOGARITHMIC) {
        options.logarithmBase = undefined;
    }
}

function calculateScaleAreaHeight(renderer, scaleOptions, visibleMarkers, tickIntervalsInfo) {
    var labelScaleOptions = scaleOptions.label;
    var markerScaleOptions = scaleOptions.marker;
    var placeholderHeight = scaleOptions.placeholderHeight;
    var ticks = scaleOptions.type === "semidiscrete" ? scaleOptions.customTicks : tickIntervalsInfo.ticks;
    var text = commonModule.formatValue(ticks[0], labelScaleOptions);

    if(placeholderHeight) {
        return placeholderHeight;
    } else {
        return (labelScaleOptions.visible ? labelScaleOptions.topIndent + getTextBBox(renderer, text, labelScaleOptions.font).height : 0) +
            (visibleMarkers ? markerScaleOptions.topIndent + markerScaleOptions.separatorHeight : 0);
    }
}

function getMinorTickIntervalUnit(tickInterval, minorTickInterval, withCorrection) {
    var interval = dateUtils.getDateUnitInterval(minorTickInterval);
    var majorUnit = dateUtils.getDateUnitInterval(tickInterval);
    var idx = dateUtils.dateUnitIntervals.indexOf(interval);

    if(withCorrection && interval === majorUnit && idx > 0) {
        interval = dateUtils.dateUnitIntervals[idx - 1];
    }

    return interval;
}

function getNextTickInterval(tickInterval, minorTickInterval, isDateType) {
    if(!tickInterval) {
        tickInterval = minorTickInterval;
    } else {
        if(isDateType) {
            tickInterval = dateUtils.getNextDateUnit(tickInterval);
        } else {
            tickInterval += minorTickInterval;
        }
    }

    return tickInterval;
}

function calculateTickIntervalsForSemidiscreteScale(scaleOptions, min, max, screenDelta) {
    var minorTickInterval = scaleOptions.minorTickInterval;
    var tickInterval = scaleOptions.tickInterval;
    var interval;
    var isDateType = scaleOptions.valueType === "datetime";
    var gridSpacingFactor = scaleOptions.axisDivisionFactor || {};
    var tickCountByInterval;
    var tickCountByScreen;

    if(!tickInterval) {
        do {
            interval = getNextTickInterval(tickInterval, minorTickInterval, isDateType);

            if(tickInterval !== interval) {
                tickInterval = interval;
            } else {
                break;
            }

            if(isDateType) {
                interval = dateToMilliseconds(tickInterval);
            }

            tickCountByInterval = _ceil((max - min) / interval);
            tickCountByScreen = _floor(screenDelta / (gridSpacingFactor[tickInterval] || SEMIDISCRETE_GRID_SPACING_FACTOR)) || 1;
        } while(interval && tickCountByInterval > tickCountByScreen);
    }

    return {
        tickInterval: tickInterval,
        minorTickInterval: minorTickInterval,
        bounds: {
            minVisible: min, maxVisible: max
        },
        ticks: []
    };
}

function updateTickIntervals(scaleOptions, screenDelta, incidentOccurred, range) {
    var result;
    var min = _isDefined(range.minVisible) ? range.minVisible : range.min;
    var max = _isDefined(range.maxVisible) ? range.maxVisible : range.max;
    var categoriesInfo = scaleOptions._categoriesInfo;
    var ticksInfo;
    var length;
    var bounds = {};

    if(scaleOptions.type === SEMIDISCRETE) {
        result = calculateTickIntervalsForSemidiscreteScale(scaleOptions, min, max, screenDelta);
    } else {
        ticksInfo = tickGeneratorModule.tickGenerator({
            axisType: scaleOptions.type,
            dataType: scaleOptions.valueType,
            logBase: scaleOptions.logarithmBase,

            axisDivisionFactor: scaleOptions.axisDivisionFactor,
            minorAxisDivisionFactor: scaleOptions.minorAxisDivisionFactor,
            calculateMinors: true,

            allowDecimals: scaleOptions.allowDecimals,
            endOnTick: scaleOptions.endOnTick,

            incidentOccurred: incidentOccurred,
            rangeIsEmpty: range.isEmpty()
        })(
            {
                min: min,
                max: max,
                categories: _isDefined(categoriesInfo) ? categoriesInfo.categories : []
            },
            screenDelta,
            scaleOptions.tickInterval,
            scaleOptions.forceUserTickInterval,
            undefined,
            scaleOptions.minorTickInterval,
            scaleOptions.minorTickCount
        );

        length = ticksInfo.ticks.length;
        bounds.minVisible = ticksInfo.ticks[0] < min ? ticksInfo.ticks[0] : min;
        bounds.maxVisible = ticksInfo.ticks[length - 1] > max ? ticksInfo.ticks[length - 1] : max;

        result = {
            tickInterval: ticksInfo.tickInterval,
            minorTickInterval: scaleOptions.minorTickInterval === 0 ? 0 : ticksInfo.minorTickInterval,
            bounds: bounds,
            ticks: ticksInfo.ticks
        };
    }

    return result;
}

function calculateTranslatorRange(seriesDataSource, scaleOptions) {
    var minValue;
    var maxValue;
    var inverted = false;
    var startValue = scaleOptions.startValue;
    var endValue = scaleOptions.endValue;
    var categories;
    var categoriesInfo;

    var // TODO: There should be something like "seriesDataSource.getArgumentRange()"
    translatorRange = seriesDataSource ? seriesDataSource.getBoundRange().arg : new rangeModule.Range();

    var rangeForCategories;
    var isDate = scaleOptions.valueType === "datetime";
    var minRange = scaleOptions.minRange;

    if(scaleOptions.type === DISCRETE) {
        rangeForCategories = new rangeModule.Range({
            minVisible: startValue,
            maxVisible: endValue
        });

        rangeForCategories.addRange(translatorRange);
        translatorRange = rangeForCategories;

        categories = seriesDataSource ? seriesDataSource.argCategories : (scaleOptions.categories || (!seriesDataSource) && startValue && endValue && [startValue, endValue]);
        categories = categories || [];
        scaleOptions._categoriesInfo = categoriesInfo = vizUtils.getCategoriesInfo(categories, startValue, endValue);
    }

    if(scaleOptions.type === SEMIDISCRETE) {
        startValue = scaleOptions.startValue = correctValueByInterval(scaleOptions.startValue, isDate, minRange);
        endValue = scaleOptions.endValue = correctValueByInterval(scaleOptions.endValue, isDate, minRange);

        translatorRange.minVisible = correctValueByInterval(translatorRange.minVisible, isDate, minRange);
        translatorRange.maxVisible = correctValueByInterval(translatorRange.maxVisible, isDate, minRange);

        translatorRange.min = correctValueByInterval(translatorRange.min, isDate, minRange);
        translatorRange.max = correctValueByInterval(translatorRange.max, isDate, minRange);
    }

    if(_isDefined(startValue) && _isDefined(endValue)) {
        inverted = categoriesInfo ? categoriesInfo.inverted : startValue > endValue;
        minValue = categoriesInfo ? categoriesInfo.start : inverted ? endValue : startValue;
        maxValue = categoriesInfo ? categoriesInfo.end : inverted ? startValue : endValue;
    } else if(_isDefined(startValue) || _isDefined(endValue)) {
        minValue = startValue;
        maxValue = endValue;
    } else if(categoriesInfo) {
        minValue = categoriesInfo.start;
        maxValue = categoriesInfo.end;
    }

    translatorRange.addRange({
        invert: inverted,
        min: minValue,
        max: maxValue,
        minVisible: minValue,
        maxVisible: maxValue,
        dataType: scaleOptions.valueType
    });

    translatorRange.addRange({
        categories: !seriesDataSource ? categories : undefined,
        base: scaleOptions.logarithmBase,
        axisType: scaleOptions.type,
        dataType: scaleOptions.valueType
    });
    seriesDataSource && translatorRange.sortCategories(categories);

    return translatorRange;
}

function startEndNotDefined(start, end) {
    return !_isDefined(start) || !_isDefined(end);
}

function getTextBBox(renderer, text, fontOptions) {
    var textElement = renderer.text(text, INVISIBLE_POS, INVISIBLE_POS).css(patchFontOptions(fontOptions)).append(renderer.root);

    var textBBox = textElement.getBBox();
    textElement.remove();
    return textBBox;
}

function getDateMarkerVisibilityChecker(screenDelta) {
    return function(isDateScale, isMarkerVisible, min, max, tickInterval) {
        if(isMarkerVisible && isDateScale) {
            if(!_isDefined(tickInterval) || tickInterval.years || tickInterval.months >= 6 ||
                (screenDelta / SEMIDISCRETE_GRID_SPACING_FACTOR < (_ceil((max - min) / dateToMilliseconds("year")) + 1))) {
                isMarkerVisible = false;
            }
        }
        return isMarkerVisible;
    };
}

function updateScaleOptions(scaleOptions, seriesDataSource, translatorRange, tickIntervalsInfo, checkDateMarkerVisibility) {
    var bounds;
    var isEmptyInterval;
    var categoriesInfo = scaleOptions._categoriesInfo;
    var intervals;
    var isDateTime = scaleOptions.valueType === DATETIME;

    if(seriesDataSource && !seriesDataSource.isEmpty() && !translatorRange.isEmpty()) {
        bounds = tickIntervalsInfo.bounds;
        translatorRange.addRange(bounds);
        scaleOptions.startValue = translatorRange.invert ? bounds.maxVisible : bounds.minVisible;
        scaleOptions.endValue = translatorRange.invert ? bounds.minVisible : bounds.maxVisible;
    }

    scaleOptions.marker.visible = checkDateMarkerVisibility(isDateTime && scaleOptions.type.indexOf(DISCRETE) === -1, scaleOptions.marker.visible, scaleOptions.startValue, scaleOptions.endValue, tickIntervalsInfo.tickInterval);

    if(categoriesInfo) {
        scaleOptions.startValue = categoriesInfo.start;
        scaleOptions.endValue = categoriesInfo.end;
    }
    if(scaleOptions.type.indexOf(DISCRETE) === -1) {
        isEmptyInterval = ((_isDate(scaleOptions.startValue) && _isDate(scaleOptions.endValue) && (scaleOptions.startValue.getTime() === scaleOptions.endValue.getTime())) || (scaleOptions.startValue === scaleOptions.endValue));
    }
    scaleOptions.isEmpty = startEndNotDefined(scaleOptions.startValue, scaleOptions.endValue) || isEmptyInterval;

    if(scaleOptions.isEmpty) {
        scaleOptions.startValue = scaleOptions.endValue = undefined;
    } else {
        scaleOptions.minorTickInterval = tickIntervalsInfo.minorTickInterval;
        scaleOptions.tickInterval = tickIntervalsInfo.tickInterval;
        if(isDateTime && (!_isDefined(scaleOptions.label.format) || (scaleOptions.type === SEMIDISCRETE && scaleOptions.minorTickInterval !== scaleOptions.tickInterval))) {
            if(scaleOptions.type === DISCRETE) {
                scaleOptions.label.format = formatHelper.getDateFormatByTicks(tickIntervalsInfo.ticks);
            } else {
                if(!scaleOptions.marker.visible) {
                    scaleOptions.label.format = formatHelper.getDateFormatByTickInterval(scaleOptions.startValue, scaleOptions.endValue, scaleOptions.tickInterval);
                } else {
                    scaleOptions.label.format = dateUtils.getDateFormatByTickInterval(scaleOptions.tickInterval);
                }
            }
        }
    }

    if(scaleOptions.type === SEMIDISCRETE) {
        intervals = getIntervalCustomTicks(scaleOptions);
        scaleOptions.customMinorTicks = intervals.altIntervals;
        scaleOptions.customTicks = intervals.intervals;
        scaleOptions.customBoundTicks = [scaleOptions.customTicks[0]];
    }
}

function prepareScaleOptions(scaleOption, calculatedValueType, incidentOccurred, containerColor) {
    var parsedValue = 0;
    var valueType = parseUtils.correctValueType(_normalizeEnum(scaleOption.valueType));
    var parser;

    var validateStartEndValues = function(field, parser) {
        var messageToIncidentOccurred = field === START_VALUE ? "start" : "end";

        if(_isDefined(scaleOption[field])) {
            parsedValue = parser(scaleOption[field]);
            if(_isDefined(parsedValue)) {
                scaleOption[field] = parsedValue;
            } else {
                scaleOption[field] = undefined;
                incidentOccurred("E2202", [messageToIncidentOccurred]);
            }
        }
    };

    valueType = calculatedValueType || valueType;

    if(!valueType) {
        valueType = calculateValueType(scaleOption.startValue, scaleOption.endValue) || "numeric";
    }

    if(valueType === STRING || scaleOption.categories) {
        scaleOption.type = DISCRETE;
        valueType = STRING;
    }

    scaleOption.containerColor = containerColor;

    scaleOption.valueType = valueType;
    scaleOption.dataType = valueType;
    parser = parseUtils.getParser(valueType);

    validateStartEndValues(START_VALUE, parser);
    validateStartEndValues(END_VALUE, parser);

    checkLogarithmicOptions(scaleOption, logarithmBase, incidentOccurred);
    if(!scaleOption.type) {
        scaleOption.type = "continuous";
    }

    scaleOption.parser = parser;
    if(scaleOption.type === SEMIDISCRETE) {
        scaleOption.minorTick.visible = false;
        scaleOption.minorTickInterval = scaleOption.minRange;
        scaleOption.marker.visible = false;
        scaleOption.maxRange = undefined;
    }

    scaleOption.forceUserTickInterval |= _isDefined(scaleOption.tickInterval) && !_isDefined(scaleOption.axisDivisionFactor);
    scaleOption.axisDivisionFactor = _isDefined(scaleOption.axisDivisionFactor) ? scaleOption.axisDivisionFactor : DEFAULT_AXIS_DIVISION_FACTOR;
    scaleOption.minorAxisDivisionFactor = _isDefined(scaleOption.minorAxisDivisionFactor) ? scaleOption.minorAxisDivisionFactor : DEFAULT_MINOR_AXIS_DIVISION_FACTOR;
    return scaleOption;
}

function correctValueByInterval(value, isDate, interval) {
    if(_isDefined(value)) {
        value = isDate
            ? dateUtils.correctDateWithUnitBeginning(new Date(value), interval)
            : adjust(_floor(adjust(value / interval)) * interval);
    }
    return value;
}

function getIntervalCustomTicks(options) {
    var min = options.startValue;
    var max = options.endValue;
    var isDate = options.valueType === "datetime";
    var tickInterval = options.tickInterval;

    var res = {
        intervals: []
    };

    if(!_isDefined(min) || !_isDefined(max)) {
        return res;
    }

    res.intervals = getSequenceByInterval(min, max, options.minorTickInterval);

    if(tickInterval !== options.minorTickInterval) {
        res.altIntervals = res.intervals;

        min = correctValueByInterval(min, isDate, tickInterval);
        max = correctValueByInterval(max, isDate, tickInterval);

        res.intervals = getSequenceByInterval(min, max, tickInterval);
        res.intervals[0] = res.altIntervals[0];
    }

    return res;
}

function getPrecisionForSlider(startValue, endValue, screenDelta) {
    var d = Math.abs(endValue - startValue) / screenDelta;
    var tail = d - Math.floor(d);

    return tail > 0 ? Math.ceil(Math.abs(adjust(vizUtils.getLog(tail, 10)))) : 0;
}

var dxRangeSelector = require("../core/base_widget").inherit({
    _eventsMap: {
        "onValueChanged": { name: VALUE_CHANGED }
    },

    _setDeprecatedOptions: function() {
        this.callBase.apply(this, arguments);
        extend(this._deprecatedOptions, {
            "chart.barWidth": {
                since: "18.1", message: "Use the 'chart.commonSeriesSettings.barPadding' or 'chart.series.barPadding' option instead"
            },
            "chart.equalBarWidth": {
                since: "18.1", message: "Use the 'chart.commonSeriesSettings.ignoreEmptyPoints' or 'chart.series.ignoreEmptyPoints' option instead"
            },
            "chart.useAggregation": {
                since: "18.1", message: "Use the 'chart.commonSeriesSettings.aggregation.enabled' or 'chart.series.aggregation.enabled' option instead"
            }
        });
    },

    _rootClassPrefix: "dxrs",

    _rootClass: "dxrs-range-selector",

    _dataIsReady: function() {
        return this._dataIsLoaded();
    },

    _initialChanges: ["DATA_SOURCE", "VALUE"],

    _themeDependentChanges: ["MOSTLY_TOTAL"],

    _themeSection: "rangeSelector",

    _fontFields: ["scale.label.font", "sliderMarker.font"],

    _initCore: function() {
        var that = this;
        var renderer = that._renderer;
        var root = renderer.root;
        var rangeViewGroup;
        var slidersGroup;
        var scaleGroup;
        var scaleBreaksGroup;
        var trackersGroup;

        // TODO: Move it to the SlidersEventManager
        root.css({
            "touch-action": "pan-y"
        });

        // RangeContainer
        that._clipRect = renderer.clipRect(); // TODO: Try to remove it
        // TODO: Groups could be created by the corresponding components
        rangeViewGroup = renderer.g().attr({ "class": "dxrs-view" }).append(root);
        slidersGroup = renderer.g().attr({ "class": "dxrs-slidersContainer", "clip-path": that._clipRect.id }).append(root);
        scaleGroup = renderer.g().attr({ "class": "dxrs-scale", "clip-path": that._clipRect.id }).append(root);
        scaleBreaksGroup = renderer.g().attr({ "class": "dxrs-scale-breaks" }).append(root);
        trackersGroup = renderer.g().attr({ "class": "dxrs-trackers" }).append(root);

        that._axis = new AxisWrapper({
            renderer: renderer,
            root: scaleGroup,
            scaleBreaksGroup: scaleBreaksGroup,
            updateSelectedRange: function(range) { that.setValue(convertVisualRangeObject(range)); },
            incidentOccurred: that._incidentOccurred
        });

        that._rangeView = new rangeViewModule.RangeView({
            renderer: renderer,
            root: rangeViewGroup,
            translator: that._axis.getTranslator()
        });

        that._slidersController = new slidersControllerModule.SlidersController({
            renderer: renderer,
            root: slidersGroup,
            trackersGroup: trackersGroup,
            updateSelectedRange: function(range, lastSelectedRange) {
                if(!that._rangeOption) {
                    that.option(VALUE, convertVisualRangeObject(range, typeUtils.isPlainObject(that._options[VALUE])));
                }

                that._eventTrigger(VALUE_CHANGED, {
                    value: convertVisualRangeObject(range),
                    previousValue: convertVisualRangeObject(lastSelectedRange)
                });
            },
            axis: that._axis,
            translator: that._axis.getTranslator()
        });

        that._tracker = new trackerModule.Tracker({
            renderer: renderer,
            controller: that._slidersController
        });
    },

    _getDefaultSize: function() {
        return {
            width: 400, height: 160
        };
    },

    _disposeCore: function() {
        this._axis.dispose();
        this._slidersController.dispose();
        this._tracker.dispose();
    },

    _applySize: function(rect) {
        this._clientRect = rect.slice();
        this._change(["MOSTLY_TOTAL"]);
    },

    _optionChangesMap: {
        scale: "SCALE",
        value: "VALUE",
        dataSource: "DATA_SOURCE"
    },

    _optionChangesOrder: ["SCALE", "DATA_SOURCE"],

    _change_SCALE: function() {
        this._change(["MOSTLY_TOTAL"]);
    },

    _setValueByDataSource() {
        const that = this;
        const options = that._options;
        const axis = that._axis;

        if(options.dataSource) {
            let selectedRangeUpdateMode = that.option("selectedRangeUpdateMode");
            const value = that.getValue();
            const valueIsReady = _isDefined(value[0]) && _isDefined(value[1]);
            if(_isDefined(selectedRangeUpdateMode)) {
                selectedRangeUpdateMode = _normalizeEnum(selectedRangeUpdateMode);
                that.__skipAnimation = true;
            } else if(valueIsReady) { // T696409
                selectedRangeUpdateMode = RESET;
            }

            if(selectedRangeUpdateMode === "auto" && valueIsReady) {
                const rangesInfo = axis.allScaleSelected(value);

                if(rangesInfo.startValue && rangesInfo.endValue) {
                    selectedRangeUpdateMode = RESET;
                } else if(rangesInfo.endValue) {
                    selectedRangeUpdateMode = SHIFT;
                } else {
                    selectedRangeUpdateMode = KEEP;
                }
            }

            if(selectedRangeUpdateMode === RESET) {
                options[VALUE] = null;
            } else if(selectedRangeUpdateMode === SHIFT && valueIsReady) {
                const value = that.getValue();
                that.__skipAnimation = true;
                options[VALUE] = { length: axis.getVisualRangeLength({ minVisible: value[0], maxVisible: value[1] }) };
            } else if(selectedRangeUpdateMode === KEEP) {
                that.__skipAnimation = true;
            }
        }
    },

    _change_DATA_SOURCE: function() {
        if(this._options.dataSource) {
            this._updateDataSource();
        }
    },

    _customChangesOrder: ["MOSTLY_TOTAL", "VALUE", "SLIDER_SELECTION"],

    _change_MOSTLY_TOTAL: function() {
        this._applyMostlyTotalChange();
    },

    _change_SLIDER_SELECTION: function() {
        var that = this;
        var value = that._options[VALUE];

        that._slidersController.setSelectedRange(value && parseValue(value));
    },

    _change_VALUE: function() {
        var that = this;
        var option = that._rangeOption;
        if(option) {
            that._options[VALUE] = option;
            that.setValue(option);
        }
    },

    _validateRange: function(start, end) {
        var that = this;
        var translator = that._axis.getTranslator();
        if(_isDefined(start) && !translator.isValid(start) ||
            _isDefined(end) && !translator.isValid(end)) {
            that._incidentOccurred("E2203");
        }
    },

    _applyChanges: function() {
        var that = this;
        var value = that._options[VALUE];

        if(that._changes.has("VALUE") && value) {
            that._rangeOption = value;
        }
        that.callBase.apply(that, arguments);
        that._rangeOption = null;
        that.__isResizing = that.__skipAnimation = false;
    },

    _applyMostlyTotalChange: function() {
        var that = this;
        var renderer = that._renderer;
        var rect = that._clientRect;
        var currentAnimationEnabled;

        var canvas = {
            left: rect[0], top: rect[1], width: rect[2] - rect[0], height: rect[3] - rect[1]
        };

        if(that.__isResizing || that.__skipAnimation) {
            currentAnimationEnabled = renderer.animationEnabled();
            renderer.updateAnimationOptions({
                enabled: false
            });
        }

        that._clipRect.attr({
            x: rect[0], y: rect[1], width: rect[2] - rect[0], height: rect[3] - rect[1]
        });

        that._axis.getTranslator().update(new rangeModule.Range(), canvas, { isHorizontal: true });

        that._updateContent({
            left: rect[0], top: rect[1], width: rect[2] - rect[0], height: rect[3] - rect[1]
        });

        if(that.__isResizing || that.__skipAnimation) {
            renderer.updateAnimationOptions({
                enabled: currentAnimationEnabled
            });
        }

        that._drawn();
    },

    _dataSourceChangedHandler: function() {
        this._setValueByDataSource();
        this._requestChange(["MOSTLY_TOTAL"]);
    },

    // It seems that we REALLY like to translate option structures from one form to another.
    // TODO: The more appropriate way is the following:
    // that._rangeView.update([
    //     that._getOption("background"),
    //     that._getOption("chart"),
    //     that.option("dataSource")
    // ]);
    // that._slidersController.update([
    //     that._getOption("sliderHandle"),
    //     that._getOption("sliderMarker"),
    //     that._getOption("shutter"),
    //     that._getOption("behavior")
    // ]);
    // that._axis.update(that._getOption("scale"));
    _completeSeriesDataSourceCreation(scaleOptions, seriesDataSource) {
        const rect = this._clientRect;
        const canvas = {
            left: rect[0], top: rect[1], width: rect[2] - rect[0], height: rect[3] - rect[1]
        };

        this._axis.updateOptions(extend({}, scaleOptions, {
            isHorizontal: true,
            label: {}
        }));

        seriesDataSource.isShowChart() && this._axis.setMarginOptions(seriesDataSource.getMarginOptions(canvas));
        this._axis.updateCanvas(canvas);

        seriesDataSource.createPoints();
    },

    _updateContent: function(canvas) {
        let that = this;
        let chartOptions = that.option("chart");
        let seriesDataSource = that._createSeriesDataSource(chartOptions);
        let isCompactMode = !((seriesDataSource && seriesDataSource.isShowChart()) || that.option("background.image.url"));
        let scaleOptions = prepareScaleOptions(that._getOption("scale"), seriesDataSource && seriesDataSource.getCalculatedValueType(), that._incidentOccurred, this._getOption("containerBackgroundColor", true));
        seriesDataSource && that._completeSeriesDataSourceCreation(scaleOptions, seriesDataSource);
        let argTranslatorRange = calculateTranslatorRange(seriesDataSource, scaleOptions);
        let tickIntervalsInfo = updateTickIntervals(scaleOptions, canvas.width, that._incidentOccurred, argTranslatorRange);
        let sliderMarkerOptions;
        let indents;
        let rangeContainerCanvas;
        let chartThemeManager = seriesDataSource && seriesDataSource.isShowChart() && seriesDataSource.getThemeManager();

        if(chartThemeManager) {
            // TODO: Looks like usage of "chartThemeManager" can be replaced with "that._getOption("chart").valueAxis.logarithmBase - check it
            checkLogarithmicOptions(chartOptions && chartOptions.valueAxis, chartThemeManager.getOptions("valueAxis").logarithmBase, that._incidentOccurred);
        }

        updateScaleOptions(scaleOptions, seriesDataSource, argTranslatorRange, tickIntervalsInfo, getDateMarkerVisibilityChecker(canvas.width));
        updateTranslatorRangeInterval(argTranslatorRange, scaleOptions);
        sliderMarkerOptions = that._prepareSliderMarkersOptions(scaleOptions, canvas.width, tickIntervalsInfo, argTranslatorRange);
        indents = calculateIndents(that._renderer, scaleOptions, sliderMarkerOptions, that.option("indent"), tickIntervalsInfo);
        rangeContainerCanvas = {
            left: canvas.left + indents.left,
            top: canvas.top + indents.top,
            width: canvas.left + indents.left + _max(canvas.width - indents.left - indents.right, 1),
            height: _max(!isCompactMode
                ? canvas.height - indents.top - indents.bottom - calculateScaleAreaHeight(that._renderer, scaleOptions, showScaleMarkers(scaleOptions), tickIntervalsInfo)
                : commonModule.HEIGHT_COMPACT_MODE, 0),
            right: 0,
            bottom: 0
        };

        // TODO: There should be one call to some axis method (not 4 methods)
        that._axis.update(scaleOptions, isCompactMode, rangeContainerCanvas, argTranslatorRange, seriesDataSource);

        scaleOptions.minorTickInterval = scaleOptions.isEmpty ? 0 : scaleOptions.minorTickInterval;

        // RangeContainer
        that._updateElements(scaleOptions, sliderMarkerOptions, isCompactMode, rangeContainerCanvas, seriesDataSource);

        if(chartThemeManager) {
            chartThemeManager.dispose(); // TODO: Move it inside "SeriesDataSource"
        }
    },

    _updateElements: function(scaleOptions, sliderMarkerOptions, isCompactMode, canvas, seriesDataSource) {
        var that = this;
        var behavior = that._getOption("behavior");
        var shutterOptions = that._getOption("shutter");
        var isNotSemiDiscrete = scaleOptions.type !== SEMIDISCRETE;

        shutterOptions.color = shutterOptions.color || that._getOption(CONTAINER_BACKGROUND_COLOR, true);

        that._rangeView.update(that.option("background"), that._themeManager.theme("background"), canvas, isCompactMode,
            behavior.animationEnabled && that._renderer.animationEnabled(), seriesDataSource);

        // TODO: Is entire options bag really needed for SlidersContainer?
        that._isUpdating = true;
        that._slidersController.update([canvas.top, canvas.top + canvas.height], behavior, isCompactMode,
            that._getOption("sliderHandle"), sliderMarkerOptions, shutterOptions, {
                minRange: isNotSemiDiscrete ? that.option("scale.minRange") : undefined,
                maxRange: isNotSemiDiscrete ? that.option("scale.maxRange") : undefined
            }, that._axis.getFullTicks(), that._getOption("selectedRangeColor", true));

        that._requestChange(["SLIDER_SELECTION"]);
        that._isUpdating = false;
        that._tracker.update(!that._axis.getTranslator().getBusinessRange().isEmpty(), behavior);
    },

    _createSeriesDataSource: function(chartOptions) {
        var that = this;
        var seriesDataSource;

        var // TODO: This code can be executed when data source is not loaded (it is an error)!
        dataSource = that._dataSourceItems();

        var scaleOptions = that._getOption("scale");
        var valueType = scaleOptions.valueType || calculateValueType(scaleOptions.startValue, scaleOptions.endValue);

        var valueAxis = new axisModule.Axis({
            renderer: that._renderer,
            axisType: "xyAxes",
            drawingType: "linear"
        });

        valueAxis.updateOptions({
            isHorizontal: false,
            label: {},
            categoriesSortingMethod: that._getOption("chart").valueAxis.categoriesSortingMethod
        });

        if(dataSource || (chartOptions && chartOptions.series)) {
            chartOptions = extend({}, chartOptions, {
                theme: that.option("theme")
            });
            seriesDataSource = new seriesDataSourceModule.SeriesDataSource({
                renderer: that._renderer,
                dataSource: dataSource,
                valueType: _normalizeEnum(valueType),
                axisType: scaleOptions.type,
                chart: chartOptions,
                dataSourceField: that.option("dataSourceField"),
                incidentOccurred: that._incidentOccurred,
                categories: scaleOptions.categories,
                argumentAxis: that._axis,
                valueAxis: valueAxis
            });
        }
        return seriesDataSource;
    },

    _prepareSliderMarkersOptions: function(scaleOptions, screenDelta, tickIntervalsInfo, argRange) {
        var that = this;
        var minorTickInterval = tickIntervalsInfo.minorTickInterval;
        var tickInterval = tickIntervalsInfo.tickInterval;
        var interval = tickInterval;
        var endValue = scaleOptions.endValue;
        var startValue = scaleOptions.startValue;
        var sliderMarkerOptions = that._getOption(SLIDER_MARKER);
        var doNotSnap = !that._getOption("behavior").snapToTicks;
        var isTypeDiscrete = scaleOptions.type === DISCRETE;
        var isValueTypeDatetime = scaleOptions.valueType === DATETIME;

        sliderMarkerOptions.borderColor = that._getOption(CONTAINER_BACKGROUND_COLOR, true);

        if(!sliderMarkerOptions.format && !argRange.isEmpty()) {
            if(doNotSnap && _isNumber(scaleOptions.startValue)) {
                sliderMarkerOptions.format = {
                    type: "fixedPoint",
                    precision: getPrecisionForSlider(startValue, endValue, screenDelta)
                };
            }
            if(isValueTypeDatetime && !isTypeDiscrete) {
                if(_isDefined(minorTickInterval) && minorTickInterval !== 0) {
                    interval = getMinorTickIntervalUnit(tickInterval, minorTickInterval, doNotSnap);
                }

                if(!scaleOptions.marker.visible) {
                    if(_isDefined(startValue) && _isDefined(endValue)) {
                        sliderMarkerOptions.format = formatHelper.getDateFormatByTickInterval(startValue, endValue, interval);
                    }
                } else {
                    sliderMarkerOptions.format = dateUtils.getDateFormatByTickInterval(interval);
                }
            }
            // T347293
            if(isValueTypeDatetime && isTypeDiscrete && tickIntervalsInfo.ticks.length) {
                sliderMarkerOptions.format = formatHelper.getDateFormatByTicks(tickIntervalsInfo.ticks);
            }
        }
        return sliderMarkerOptions;
    },

    getValue: function() {
        return convertVisualRangeObject(this._slidersController.getSelectedRange());
    },

    setValue: function(value) {
        var current;
        const visualRange = parseValue(value);
        if(!this._isUpdating && value) {
            this._validateRange(visualRange.startValue, visualRange.endValue);
            // TODO: Move the check inside the SlidersController
            current = this._slidersController.getSelectedRange();
            if(!current || current.startValue !== visualRange.startValue || current.endValue !== visualRange.endValue) {
                this._slidersController.setSelectedRange(parseValue(value));
            }
        }
    },

    _setContentSize: function() {
        this.__isResizing = this._changes.count() === 2;
        this.callBase.apply(this, arguments);
    }
});

each(["selectedRangeColor", "containerBackgroundColor", "sliderMarker", "sliderHandle",
    "shutter", OPTION_BACKGROUND, "behavior", "chart", "indent"
], function(_, name) {
    dxRangeSelector.prototype._optionChangesMap[name] = "MOSTLY_TOTAL";
});

// AxisWrapper

function prepareAxisOptions(scaleOptions, isCompactMode, height, axisPosition) {
    scaleOptions.marker.label.font = scaleOptions.label.font;

    scaleOptions.color = scaleOptions.marker.color = scaleOptions.tick.color;
    scaleOptions.opacity = scaleOptions.marker.opacity = scaleOptions.tick.opacity;
    scaleOptions.width = scaleOptions.marker.width = scaleOptions.tick.width;

    scaleOptions.placeholderSize = (scaleOptions.placeholderHeight || 0) + axisPosition;

    scaleOptions.argumentType = scaleOptions.valueType;
    scaleOptions.visible = isCompactMode;
    scaleOptions.isHorizontal = true;
    scaleOptions.calculateMinors = true;

    scaleOptions.semiDiscreteInterval = scaleOptions.minRange;

    if(!isCompactMode) {
        scaleOptions.minorTick.length = scaleOptions.tick.length = height;
    }
    scaleOptions.label.indentFromAxis = scaleOptions.label.topIndent + axisPosition;

    return scaleOptions;
}

function createDateMarkersEvent(scaleOptions, markerTrackers, setSelectedRange) {
    each(markerTrackers, function(_, value) {
        value.on("dxpointerdown", onPointerDown);
    });
    function onPointerDown(e) {
        var range = e.target.range;
        var minRange = scaleOptions.minRange ? addInterval(range.startValue, scaleOptions.minRange) : undefined;
        var maxRange = scaleOptions.maxRange ? addInterval(range.startValue, scaleOptions.maxRange) : undefined;
        if(!(minRange && minRange > range.endValue || maxRange && maxRange < range.endValue)) {
            setSelectedRange(range);
        }
    }
}

function AxisWrapper(params) {
    this._axis = new axisModule.Axis({
        renderer: params.renderer,
        axesContainerGroup: params.root,
        scaleBreaksGroup: params.scaleBreaksGroup,
        incidentOccurred: params.incidentOccurred,
        // TODO: These dependencies should be statically resolved (not for every new instance)
        axisType: "xyAxes",
        drawingType: "linear",
        widgetClass: "dxrs",
        axisClass: "range-selector",
        isArgumentAxis: true
    });
    this._updateSelectedRangeCallback = params.updateSelectedRange;
}

AxisWrapper.prototype = {
    constructor: AxisWrapper,

    dispose: function() {
        this._axis.dispose();
    },

    calculateInterval: function(value, prevValue) {
        return this._axis.calculateInterval(value, prevValue);
    },

    update: function(options, isCompactMode, canvas, businessRange, seriesDataSource) {
        var axis = this._axis;
        axis.updateOptions(prepareAxisOptions(options, isCompactMode, canvas.height, canvas.height / 2 - Math.ceil(options.width / 2)));
        axis.validate();
        axis.setBusinessRange(businessRange, true);
        if(seriesDataSource !== undefined && seriesDataSource.isShowChart()) {
            axis.setMarginOptions(seriesDataSource.getMarginOptions(canvas));
        }

        axis.draw(canvas);
        axis.shift({ left: 0, bottom: -canvas.height / 2 + canvas.top });
        if(axis.getMarkerTrackers()) {
            // TODO: Check who is responsible for destroying events
            createDateMarkersEvent(options, axis.getMarkerTrackers(), this._updateSelectedRangeCallback);
        }
        axis.drawScaleBreaks({ start: canvas.top, end: canvas.top + canvas.height });
    },

    visualRange: function() { },

    getViewport: function() {
        return {};
    },

    allScaleSelected(value) {
        const { startValue, endValue } = this._axis.visualRange();

        return {
            startValue: value[0].valueOf() === startValue.valueOf(),
            endValue: value[1].valueOf() === endValue.valueOf()
        };
    }
};

["setMarginOptions", "getFullTicks", "updateCanvas", "updateOptions", "getAggregationInfo", "getTranslator", "getVisualRangeLength", "getVisibleArea", "getMarginOptions"].forEach(methodName => {
    AxisWrapper.prototype[methodName] = function() {
        const axis = this._axis;

        return axis[methodName].apply(axis, arguments);
    };
});

registerComponent("dxRangeSelector", dxRangeSelector);

module.exports = dxRangeSelector;

// PLUGINS_SECTION
dxRangeSelector.addPlugin(require("../core/export").plugin);
dxRangeSelector.addPlugin(require("../core/title").plugin);
dxRangeSelector.addPlugin(require("../core/loading_indicator").plugin);
dxRangeSelector.addPlugin(require("../core/data_source").plugin);
