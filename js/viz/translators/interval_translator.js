import typeUtils from "../../core/utils/type";
var isNumber = typeUtils.isNumeric;
var isDefined = typeUtils.isDefined;
import dateUtils from "../../core/utils/date";
var addInterval = dateUtils.addInterval;
var dateToMilliseconds = dateUtils.dateToMilliseconds;
var floor = Math.floor;
import mathUtils from "../../core/utils/math";
var adjust = mathUtils.adjust;

module.exports = {
    _intervalize: function(value, interval) {
        if(!isDefined(value)) {
            return undefined;
        }
        if(this._businessRange.dataType === "datetime") {
            if(isNumber(value)) {
                value = new Date(value);
            } else {
                value = new Date(value.getTime());
            }
            value = dateUtils.correctDateWithUnitBeginning(value, interval);
        } else {
            value = adjust(floor(adjust(value / interval)) * interval, interval);
        }
        return value;
    },

    translate: function(bp, direction, interval) {
        var that = this;
        var specialValue = that.translateSpecialCase(bp);

        if(isDefined(specialValue)) {
            return Math.round(specialValue);
        }
        interval = interval || that._options.interval;

        // TODO B253861
        if(!that.isValid(bp, interval)) {
            return null;
        }

        return that.to(bp, direction, interval);
    },

    getInterval: function() {
        return Math.round(this._canvasOptions.ratioOfCanvasRange * (this._businessRange.interval || Math.abs(this._canvasOptions.rangeMax - this._canvasOptions.rangeMin)));
    },

    zoom: function() { },

    getMinScale: function() { },

    getScale: function() { },

    _parse: function(value) {
        return this._businessRange.dataType === "datetime" ? new Date(value) : Number(value);
    },

    _fromValue: function(value) {
        return this._parse(value);
    },

    _toValue: function(value) {
        return this._parse(value);
    },

    isValid: function(value, interval) {
        var that = this;
        var co = that._canvasOptions;
        var rangeMin = co.rangeMin;
        var rangeMax = co.rangeMax;

        interval = interval || that._options.interval;
        if(value === null || isNaN(value)) {
            return false;
        }

        value = that._businessRange.dataType === "datetime" && isNumber(value) ? new Date(value) : value;

        if(interval !== that._options.interval) {
            rangeMin = that._intervalize(rangeMin, interval);
            rangeMax = that._intervalize(rangeMax, interval);
        }

        if(value.valueOf() < rangeMin || value.valueOf() >= addInterval(rangeMax, interval)) {
            return false;
        }

        return true;
    },

    to: function(bp, direction, interval) {
        var that = this;

        interval = interval || that._options.interval;
        var v1 = that._intervalize(bp, interval);
        var v2 = addInterval(v1, interval);
        var res = that._to(v1);
        var p2 = that._to(v2);

        if(!direction) {
            res = floor((res + p2) / 2);
        } else if(direction > 0) {
            res = p2;
        }
        return res;
    },

    _to: function(value) {
        var co = this._canvasOptions;
        var rMin = co.rangeMinVisible;
        var rMax = co.rangeMaxVisible;
        var offset = value - rMin;

        if(value < rMin) {
            offset = 0;
        } else if(value > rMax) {
            offset = addInterval(rMax, this._options.interval) - rMin;
        }

        return this._conversionValue(this._calculateProjection(offset * this._canvasOptions.ratioOfCanvasRange));
    },

    from: function(position, direction) {
        var that = this;
        var origInterval = that._options.interval;
        var interval = origInterval;
        var co = that._canvasOptions;
        var rMin = co.rangeMinVisible;
        var rMax = co.rangeMaxVisible;
        var value;

        if(that._businessRange.dataType === "datetime") {
            interval = dateToMilliseconds(origInterval);
        }

        value = (that._calculateUnProjection((position - that._canvasOptions.startPoint) / that._canvasOptions.ratioOfCanvasRange));
        value = that._intervalize(addInterval(value, interval / 2, direction > 0), origInterval);

        if(value < rMin) {
            value = rMin;
        } else if(value > rMax) {
            value = rMax;
        }

        return value;
    },

    _add: function() {
        return NaN;
    },

    isValueProlonged: true
};
