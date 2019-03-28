var vizUtils = require("../core/utils");
import typeUtils from "../../core/utils/type";
var isDefined = typeUtils.isDefined;
var raiseTo = vizUtils.raiseTo;
var getLog = vizUtils.getLog;

module.exports = {
    _fromValue: function(value) {
        return value !== null ? getLog(value, this._canvasOptions.base) : value;
    },

    _toValue: function(value) {
        return value !== null ? raiseTo(value, this._canvasOptions.base) : value;
    },

    getMinBarSize: function(minBarSize) {
        var visibleArea = this.getCanvasVisibleArea();
        var minValue = this.from(visibleArea.min + minBarSize);
        var canvasOptions = this._canvasOptions;

        return Math.pow(canvasOptions.base, canvasOptions.rangeMinVisible + this._fromValue(this.from(visibleArea.min)) - this._fromValue(!isDefined(minValue) ? this.from(visibleArea.max) : minValue));
    },

    checkMinBarSize: function(initialValue, minShownValue, stackValue) {
        var canvasOptions = this._canvasOptions;
        var prevValue = stackValue - initialValue;
        var baseMethod = this.constructor.prototype.checkMinBarSize;
        var minBarSize;
        var updateValue;

        if(isDefined(minShownValue) && prevValue > 0) {
            minBarSize = baseMethod(this._fromValue(stackValue / prevValue), this._fromValue(minShownValue) - canvasOptions.rangeMinVisible);
            updateValue = Math.pow(canvasOptions.base, this._fromValue(prevValue) + minBarSize) - prevValue;
        } else {
            updateValue = baseMethod(initialValue, minShownValue);
        }

        return updateValue;
    }
};
