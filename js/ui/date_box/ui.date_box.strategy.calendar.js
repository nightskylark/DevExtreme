var Calendar = require("../calendar");
var DateBoxStrategy = require("./ui.date_box.strategy");
var dateUtils = require("../../core/utils/date");
var commonUtils = require("../../core/utils/common");
import typeUtils from "../../core/utils/type";
var isFunction = typeUtils.isFunction;
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
var messageLocalization = require("../../localization/message");

var CalendarStrategy = DateBoxStrategy.inherit({

    NAME: "Calendar",

    supportedKeys: function() {
        return {
            rightArrow: function() {
                if(this.option("opened")) {
                    return true;
                }
            },
            leftArrow: function() {
                if(this.option("opened")) {
                    return true;
                }
            },
            enter: (function(e) {
                if(this.dateBox.option("opened")) {
                    e.preventDefault();

                    if(this._widget.option("zoomLevel") === this._widget.option("maxZoomLevel")) {
                        var contouredDate = this._widget._view.option("contouredDate");
                        contouredDate && this.dateBoxValue(contouredDate, e);

                        this.dateBox.close();
                        this.dateBox._valueChangeEventHandler(e);
                    } else {
                        return true;
                    }
                } else {
                    this.dateBox._valueChangeEventHandler(e);
                }
            }).bind(this)
        };
    },

    getDisplayFormat: function(displayFormat) {
        return displayFormat || "shortdate";
    },

    _getWidgetName: function() {
        return Calendar;
    },

    _getWidgetOptions: function() {
        var disabledDates = this.dateBox.option("disabledDates");

        return extend(this.dateBox.option("calendarOptions"), {
            value: this.dateBoxValue() || null,
            dateSerializationFormat: null,
            _keyboardProcessor: this._widgetKeyboardProcessor,
            min: this.dateBox.dateOption("min"),
            max: this.dateBox.dateOption("max"),
            onValueChanged: this._valueChangedHandler.bind(this),
            onCellClick: this._cellClickHandler.bind(this),
            tabIndex: null,
            disabledDates: isFunction(disabledDates) ? this._injectComponent(disabledDates.bind(this.dateBox)) : disabledDates,
            onContouredChanged: this._refreshActiveDescendant.bind(this),
            hasFocus: function() { return true; }
        });
    },

    _injectComponent: function(func) {
        var that = this;
        return function(params) {
            extend(params, { component: that.dateBox });
            return func(params);
        };
    },

    _refreshActiveDescendant: function(e) {
        this.dateBox.setAria("activedescendant", e.actionValue);
    },

    popupConfig: function(popupConfig) {
        var toolbarItems = popupConfig.toolbarItems;
        var buttonsLocation = this.dateBox.option("buttonsLocation");

        var position = [];

        if(buttonsLocation !== "default") {
            position = commonUtils.splitPair(buttonsLocation);
        } else {
            position = ["bottom", "center"];
        }

        if(this.dateBox.option("applyValueMode") === "useButtons") {
            toolbarItems.unshift({
                widget: "dxButton",
                toolbar: position[0],
                location: position[1] === "after" ? "before" : position[1],
                options: {
                    onClick: (function() { this._widget._toTodayView(); }).bind(this),
                    text: messageLocalization.format("dxCalendar-todayButtonText"),
                    type: "today"
                }
            });
        }

        return extend(true, popupConfig, {
            toolbarItems: toolbarItems,
            position: {
                collision: "flipfit flip"
            }
        });
    },

    _valueChangedHandler: function(e) {
        var dateBox = this.dateBox;
        var value = e.value;
        var prevValue = e.previousValue;

        if(dateUtils.sameDate(value, prevValue)) {
            return;
        }

        if(dateBox.option("applyValueMode") === "instantly") {
            this.dateBoxValue(this.getValue(), e.event);
        }
    },

    _updateValue: function() {
        if(!this._widget) {
            return;
        }

        this._widget.option("value", this.dateBoxValue());
    },

    textChangedHandler: function() {
        if(this.dateBox.option("opened") && this._widget) {
            this._updateValue(true);
        }
    },

    _cellClickHandler: function(e) {
        var dateBox = this.dateBox;

        if(dateBox.option("applyValueMode") === "instantly") {
            dateBox.option("opened", false);
            this.dateBoxValue(this.getValue(), e.event);
        }
    }
});

module.exports = CalendarStrategy;
