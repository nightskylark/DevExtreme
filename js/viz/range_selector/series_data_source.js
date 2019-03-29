import seriesModule from "../series/base_series";
import seriesFamilyModule from "../core/series_family";
import typeUtils from "../../core/utils/type";
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
import arrayUtils from "../../core/utils/array";
var inArray = arrayUtils.inArray;
import iteratorUtils from "../../core/utils/iterator";
var each = iteratorUtils.each;
import vizUtils from "../core/utils";
import rangeModule from "../translators/range";
import dataValidatorModule from "../components/data_validator";
import managerModule from "../components/chart_theme_manager";
var ChartThemeManager = managerModule.ThemeManager;
var SeriesDataSource;

var createThemeManager = function(chartOptions) {
    return new ChartThemeManager({
        options: chartOptions,
        themeSection: "rangeSelector.chart",
        fontFields: ["commonSeriesSettings.label.font"]
    });
};

var processSeriesFamilies = function(series, equalBarWidth, minBubbleSize, maxBubbleSize, barOptions, negativesAsZeroes) {
    var families = [];
    var types = [];

    each(series, function(i, item) {
        if(inArray(item.type, types) === -1) {
            types.push(item.type);
        }
    });

    each(types, function(_, type) {
        var family = new seriesFamilyModule.SeriesFamily({
            type: type,
            equalBarWidth: equalBarWidth,
            minBubbleSize: minBubbleSize,
            maxBubbleSize: maxBubbleSize,
            barWidth: barOptions.barWidth,
            barGroupPadding: barOptions.barGroupPadding,
            barGroupWidth: barOptions.barGroupWidth,
            negativesAsZeroes: negativesAsZeroes
        });
        family.add(series);
        family.adjustSeriesValues();
        families.push(family);
    });

    return families;
};

SeriesDataSource = function(options) {
    var that = this;
    var themeManager = that._themeManager = createThemeManager(options.chart);
    var topIndent;
    var bottomIndent;

    themeManager.setTheme(options.chart.theme);
    topIndent = themeManager.getOptions('topIndent');
    bottomIndent = themeManager.getOptions('bottomIndent');

    that._indent = {
        top: (topIndent >= 0 && topIndent < 1) ? topIndent : 0,
        bottom: (bottomIndent >= 0 && bottomIndent < 1) ? bottomIndent : 0
    };
    that._valueAxis = themeManager.getOptions('valueAxisRangeSelector') || {};
    that._hideChart = false;

    that._series = that._calculateSeries(options);
    that._seriesFamilies = [];
};

SeriesDataSource.prototype = {
    constructor: SeriesDataSource,

    _calculateSeries: function(options) {
        var that = this;
        var series = [];
        var particularSeriesOptions;
        var seriesTheme;
        var data = options.dataSource || [];
        var parsedData;
        var chartThemeManager = that._themeManager;
        var seriesTemplate = chartThemeManager.getOptions('seriesTemplate');
        var allSeriesOptions = seriesTemplate ? vizUtils.processSeriesTemplate(seriesTemplate, data) : options.chart.series;
        var dataSourceField;
        var valueAxis = that._valueAxis;
        var i;
        var newSeries;
        var groupsData;

        if(options.dataSource && !allSeriesOptions) {
            dataSourceField = options.dataSourceField || 'arg';
            allSeriesOptions = {
                argumentField: dataSourceField,
                valueField: dataSourceField
            };
            that._hideChart = true;
        }

        allSeriesOptions = (Array.isArray(allSeriesOptions) ? allSeriesOptions : (allSeriesOptions ? [allSeriesOptions] : []));

        for(i = 0; i < allSeriesOptions.length; i++) {
            particularSeriesOptions = extend(true, {}, allSeriesOptions[i]);

            particularSeriesOptions.rotated = false;

            seriesTheme = chartThemeManager.getOptions("series", particularSeriesOptions, allSeriesOptions.length);
            seriesTheme.argumentField = seriesTheme.argumentField || options.dataSourceField;// B253068
            if(!seriesTheme.name) {
                seriesTheme.name = "Series " + (i + 1).toString();
            }
            if(data && data.length > 0) {
                // TODO
                newSeries = new seriesModule.Series({
                    renderer: options.renderer,
                    argumentAxis: options.argumentAxis,
                    valueAxis: options.valueAxis,
                    incidentOccurred: options.incidentOccurred
                }, seriesTheme);
                series.push(newSeries);
            }
        }

        if(series.length) {
            groupsData = {
                groups: [{
                    series: series,
                    valueOptions: {
                        type: valueAxis.type,
                        valueType: dataSourceField ? options.valueType : valueAxis.valueType
                    }
                }],
                argumentOptions: {
                    categories: options.categories,
                    argumentType: options.valueType,
                    type: options.axisType
                }
            };
            parsedData = dataValidatorModule.validateData(data, groupsData, options.incidentOccurred, chartThemeManager.getOptions("dataPrepareSettings"));
            that.argCategories = groupsData.categories;
            for(i = 0; i < series.length; i++) {
                series[i].updateData(parsedData[series[i].getArgumentField()]);

            }
        }
        return series;
    },

    createPoints() {
        if(this._series.length === 0) {
            return;
        }

        var series = this._series; // misspelling case
        var viewport = new rangeModule.Range();
        var axis = series[0].getArgumentAxis();
        var themeManager = this._themeManager;
        var negativesAsZeroes = themeManager.getOptions("negativesAsZeroes");
        var negativesAsZeros = themeManager.getOptions("negativesAsZeros");

        series.forEach(function(s) {
            viewport.addRange(s.getArgumentRange());
        });

        axis.getTranslator().updateBusinessRange(viewport);

        series.forEach(function(s) { s.createPoints(); });

        this._seriesFamilies = processSeriesFamilies(series,
            themeManager.getOptions('equalBarWidth'),
            themeManager.getOptions('minBubbleSize'),
            themeManager.getOptions('maxBubbleSize'),
            {
                barWidth: themeManager.getOptions('barWidth'),
                barGroupPadding: themeManager.getOptions('barGroupPadding'),
                barGroupWidth: themeManager.getOptions('barGroupWidth')
            },
            typeUtils.isDefined(negativesAsZeroes) ? negativesAsZeroes : negativesAsZeros);
    },

    adjustSeriesDimensions: function() {
        each(this._seriesFamilies, function(_, family) {
            family.adjustSeriesDimensions();
        });
    },

    getBoundRange: function() {
        var that = this;
        var rangeData;
        var valueAxis = that._valueAxis;

        var valRange = new rangeModule.Range({
            min: valueAxis.min,
            minVisible: valueAxis.min,
            max: valueAxis.max,
            maxVisible: valueAxis.max,
            axisType: valueAxis.type,
            base: valueAxis.logarithmBase
        });

        var argRange = new rangeModule.Range({});
        var rangeYSize;
        var rangeVisibleSizeY;
        var minIndent;
        var maxIndent;

        each(that._series, function(_, series) {
            rangeData = series.getRangeData();
            valRange.addRange(rangeData.val);
            argRange.addRange(rangeData.arg);
        });

        if(!valRange.isEmpty() && !argRange.isEmpty()) {
            minIndent = valueAxis.inverted ? that._indent.top : that._indent.bottom;
            maxIndent = valueAxis.inverted ? that._indent.bottom : that._indent.top;
            rangeYSize = valRange.max - valRange.min;
            rangeVisibleSizeY = (typeUtils.isNumeric(valRange.maxVisible) ? valRange.maxVisible : valRange.max) - (typeUtils.isNumeric(valRange.minVisible) ? valRange.minVisible : valRange.min);
            // B253717
            if(typeUtils.isDate(valRange.min)) {
                valRange.min = new Date(valRange.min.valueOf() - rangeYSize * minIndent);
            } else {
                valRange.min -= rangeYSize * minIndent;
            }
            if(typeUtils.isDate(valRange.max)) {
                valRange.max = new Date(valRange.max.valueOf() + rangeYSize * maxIndent);
            } else {
                valRange.max += rangeYSize * maxIndent;
            }

            if(typeUtils.isNumeric(rangeVisibleSizeY)) {
                valRange.maxVisible = valRange.maxVisible ? valRange.maxVisible + rangeVisibleSizeY * maxIndent : undefined;
                valRange.minVisible = valRange.minVisible ? valRange.minVisible - rangeVisibleSizeY * minIndent : undefined;
            }
            valRange.invert = valueAxis.inverted;
        }

        return { arg: argRange, val: valRange };
    },

    getMarginOptions: function(canvas) {
        var bubbleSize = Math.min(canvas.width, canvas.height) * this._themeManager.getOptions("maxBubbleSize");

        return this._series.reduce(function(marginOptions, series) {
            var seriesOptions = series.getMarginOptions();

            if(seriesOptions.processBubbleSize === true) {
                seriesOptions.size = bubbleSize;
            }
            return vizUtils.mergeMarginOptions(marginOptions, seriesOptions);
        }, {});
    },

    getSeries: function() {
        return this._series;
    },

    isEmpty: function() {
        return this.getSeries().length === 0;
    },

    isShowChart: function() {
        return !this._hideChart;
    },

    getCalculatedValueType: function() {
        var series = this._series[0];
        return series && series.argumentType;
    },

    getThemeManager: function() {
        return this._themeManager;
    }
};

exports.SeriesDataSource = SeriesDataSource;
