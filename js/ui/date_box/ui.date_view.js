var $ = require("../../core/renderer");
import Editor from "../editor/editor";
import DateViewRoller from "./ui.date_view_roller";
import dateUtils from "../../core/utils/date";
import iteratorUtils from "../../core/utils/iterator";
var each = iteratorUtils.each;
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
import uiDateUtils from "./ui.date_utils";
import registerComponent from "../../core/component_registrator";
import dateLocalization from "../../localization/date";
var DATEVIEW_CLASS = "dx-dateview";
var DATEVIEW_COMPACT_CLASS = "dx-dateview-compact";
var DATEVIEW_WRAPPER_CLASS = "dx-dateview-wrapper";
var DATEVIEW_ROLLER_CONTAINER_CLASS = "dx-dateview-rollers";
var DATEVIEW_ROLLER_CLASS = "dx-dateviewroller";

var TYPE = {
    date: 'date',
    datetime: 'datetime',
    time: 'time'
};

var ROLLER_TYPE = {
    year: 'year',
    month: 'month',
    day: 'day',
    hours: 'hours'
};

var DateView = Editor.inherit({
    _valueOption: function() {
        var value = this.option("value");
        var date = new Date(value);

        return !value || isNaN(date) ? this._getDefaultDate() : date;
    },

    _getDefaultDate: function() {
        var date = new Date();

        if(this.option("type") === TYPE.date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }

        return date;
    },

    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            minDate: uiDateUtils.MIN_DATEVIEW_DEFAULT_DATE,
            maxDate: uiDateUtils.MAX_DATEVIEW_DEFAULT_DATE,
            type: TYPE.date,
            value: new Date(),
            showNames: false,
            applyCompactClass: false
        });
    },

    _defaultOptionsRules: function() {
        return this.callBase().concat([
            {
                device: function(device) {
                    return device.platform === "win" && device.version && device.version[0] === 8;
                },
                options: {
                    showNames: true
                }
            },
            {
                device: function(device) {
                    return device.deviceType !== "desktop";
                },
                options: {
                    applyCompactClass: true
                }
            }
        ]);
    },

    _render: function() {
        this.callBase();
        this.$element().addClass(DATEVIEW_CLASS);
        this._toggleFormatClasses(this.option("type"));
        this._toggleCompactClass();
    },

    _toggleFormatClasses: function(currentFormat, previousFormat) {
        this.$element().addClass(DATEVIEW_CLASS + "-" + currentFormat);

        previousFormat && this.$element().removeClass(DATEVIEW_CLASS + "-" + previousFormat);
    },

    _toggleCompactClass: function() {
        this.$element().toggleClass(DATEVIEW_COMPACT_CLASS, this.option("applyCompactClass"));
    },

    _wrapper: function() {
        return this._$wrapper;
    },

    _renderContentImpl: function() {
        this._$wrapper = $("<div>").addClass(DATEVIEW_WRAPPER_CLASS);
        this._renderRollers();
        this._$wrapper.appendTo(this.$element());
    },

    _renderRollers: function() {
        if(!this._$rollersContainer) {
            this._$rollersContainer = $("<div>").addClass(DATEVIEW_ROLLER_CONTAINER_CLASS);
        }

        this._$rollersContainer.empty();
        this._createRollerConfigs();

        this._rollers = {};

        var that = this;

        each(that._rollerConfigs, function(name) {
            var $roller = $("<div>").appendTo(that._$rollersContainer)
                .addClass(DATEVIEW_ROLLER_CLASS + "-" + that._rollerConfigs[name].type);

            that._rollers[that._rollerConfigs[name].type] = that._createComponent($roller, DateViewRoller, {
                items: that._rollerConfigs[name].displayItems,
                selectedIndex: that._rollerConfigs[name].selectedIndex,
                showScrollbar: false,
                onStart: function(e) {
                    var roller = e.component;
                    roller._toggleActive(true);
                    that._setActiveRoller(that._rollerConfigs[name], roller.option("selectedIndex"));
                },
                onEnd: function(e) {
                    var roller = e.component;
                    roller._toggleActive(false);
                },
                onClick: function(e) {
                    var roller = e.component;
                    roller._toggleActive(true);
                    that._setActiveRoller(that._rollerConfigs[name], roller.option("selectedIndex"));
                    that._setRollerState(that._rollerConfigs[name], roller.option("selectedIndex"));
                    roller._toggleActive(false);
                },
                onSelectedIndexChanged: function(e) {
                    var roller = e.component;
                    that._setRollerState(that._rollerConfigs[name], roller.option("selectedIndex"));
                }
            });
        });
        that._$rollersContainer.appendTo(that._wrapper());
    },

    _createRollerConfigs: function(type) {
        var that = this;
        type = type || that.option("type");
        that._rollerConfigs = {};

        dateLocalization.getFormatParts(uiDateUtils.FORMATS_MAP[type]).forEach(function(partName) {
            that._createRollerConfig(partName);
        });
    },

    _createRollerConfig: function(componentName) {
        var componentInfo = uiDateUtils.DATE_COMPONENTS_INFO[componentName];
        var valueRange = this._calculateRollerConfigValueRange(componentName);
        var startValue = valueRange.startValue;
        var endValue = valueRange.endValue;
        var formatter = componentInfo.formatter;
        var showNames = this.option("showNames");
        var curDate = this._getCurrentDate();

        var config = {
            type: componentName,
            setValue: componentInfo.setter,
            valueItems: [],
            displayItems: [],
            getIndex: function(value) {
                return value[componentInfo.getter]() - startValue;
            }
        };

        for(var i = startValue; i <= endValue; i++) {
            config.valueItems.push(i);
            config.displayItems.push(formatter(i, showNames, curDate));
        }

        config.selectedIndex = config.getIndex(curDate);

        this._rollerConfigs[componentName] = config;
    },

    _setActiveRoller: function(currentRoller) {
        var activeRoller = currentRoller && this._rollers[currentRoller.type];

        each(this._rollers, function() {
            this.toggleActiveState(this === activeRoller);
        });
    },

    _updateRollersPosition: function() {
        var that = this;
        each(this._rollers, function(type) {
            var correctIndex = that._rollerConfigs[type].getIndex(that._getCurrentDate());
            this.option("selectedIndex", correctIndex);
        });
    },

    _setRollerState: function(roller, selectedIndex) {
        if(selectedIndex !== roller.selectedIndex) {
            var rollerValue = roller.valueItems[selectedIndex];
            var setValue = roller.setValue;
            var currentValue = new Date(this._getCurrentDate());
            var currentDate = currentValue.getDate();

            if(roller.type === ROLLER_TYPE.month) {
                currentDate = Math.min(currentDate, uiDateUtils.getMaxMonthDay(currentValue.getFullYear(), rollerValue));
            } else if(roller.type === ROLLER_TYPE.year) {
                currentDate = Math.min(currentDate, uiDateUtils.getMaxMonthDay(rollerValue, currentValue.getMonth()));
            }

            currentValue.setDate(currentDate);
            currentValue[setValue](rollerValue);

            currentValue = dateUtils.normalizeDate(currentValue, this.option("minDate"), this.option("maxDate"));

            this.option("value", currentValue);

            roller.selectedIndex = selectedIndex;
        }

        if(roller.type === ROLLER_TYPE.year) {
            this._refreshRollers();
        }

        if(roller.type === ROLLER_TYPE.month) {
            this._refreshRoller(ROLLER_TYPE.day);
            this._refreshRoller(ROLLER_TYPE.hours);
        }
    },

    _refreshRoller: function(rollerType) {
        var roller = this._rollers[rollerType];

        if(roller) {
            this._createRollerConfig(rollerType);
            var rollerConfig = this._rollerConfigs[rollerType];
            if(rollerType === ROLLER_TYPE.day || rollerConfig.displayItems.toString() !== roller.option("items").toString()) {
                roller.option({
                    items: rollerConfig.displayItems,
                    selectedIndex: rollerConfig.selectedIndex
                });
            }
        }
    },

    _getCurrentDate: function() {
        var curDate = this._valueOption();
        var minDate = this.option("minDate");
        var maxDate = this.option("maxDate");

        if(minDate && curDate.getTime() <= minDate.getTime()) {
            curDate = minDate;
        } else if(maxDate && curDate.getTime() >= maxDate.getTime()) {
            curDate = maxDate;
        }

        return curDate;
    },

    _calculateRollerConfigValueRange: function(componentName) {
        var curDate = this._getCurrentDate();
        var minDate = this.option("minDate");
        var maxDate = this.option("maxDate");
        var minYear = dateUtils.sameYear(curDate, minDate);
        var minMonth = minYear && curDate.getMonth() === minDate.getMonth();
        var maxYear = dateUtils.sameYear(curDate, maxDate);
        var maxMonth = maxYear && curDate.getMonth() === maxDate.getMonth();
        var minHour = minMonth && curDate.getDate() === minDate.getDate();
        var maxHour = maxMonth && curDate.getDate() === maxDate.getDate();
        var componentInfo = uiDateUtils.DATE_COMPONENTS_INFO[componentName];
        var startValue = componentInfo.startValue;
        var endValue = componentInfo.endValue;

        // TODO: think about these exceptions for 'year' and 'day'
        if(componentName === ROLLER_TYPE.year) {
            startValue = minDate.getFullYear();
            endValue = maxDate.getFullYear();
        }

        if(componentName === ROLLER_TYPE.month) {
            if(minYear) {
                startValue = minDate.getMonth();
            }
            if(maxYear) {
                endValue = maxDate.getMonth();
            }
        }

        if(componentName === ROLLER_TYPE.day) {
            endValue = uiDateUtils.getMaxMonthDay(curDate.getFullYear(), curDate.getMonth());
            if(minYear && minMonth) {
                startValue = minDate.getDate();
            }
            if(maxYear && maxMonth) {
                endValue = maxDate.getDate();
            }
        }

        if(componentName === ROLLER_TYPE.hours) {
            startValue = minHour ? minDate.getHours() : startValue;
            endValue = maxHour ? maxDate.getHours() : endValue;
        }

        return {
            startValue: startValue,
            endValue: endValue
        };
    },

    _refreshRollers: function() {
        this._refreshRoller(ROLLER_TYPE.month);
        this._refreshRoller(ROLLER_TYPE.day);
        this._refreshRoller(ROLLER_TYPE.hours);
    },

    _optionChanged: function(args) {
        switch(args.name) {
            case "showNames":
            case "minDate":
            case "maxDate":
            case "type":
                this._renderRollers();
                this._toggleFormatClasses(args.value, args.previousValue);
                break;
            case "visible":
                this.callBase(args);
                if(args.value) {
                    this._renderRollers();
                }
                break;
            case "value":
                this.option("value", this._valueOption());
                this._refreshRollers();
                this._updateRollersPosition();
                break;
            default:
                this.callBase(args);
        }
    },

    _clean: function() {
        this.callBase();
        delete this._$rollersContainer;
    },

    _dispose: function() {
        clearTimeout(this._deferredRenderDayTimeout);
        clearTimeout(this._deferredRenderMonthTimeout);
        this.callBase();
    }
});

registerComponent("dxDateView", DateView);

module.exports = DateView;
