import { smartFormatter as _format } from "../axes/smart_formatter";
import typeUtils from "../../core/utils/type";
var isFunction = typeUtils.isFunction;
var HEIGHT_COMPACT_MODE = 24;
var POINTER_SIZE = 4;
var EMPTY_SLIDER_MARKER_TEXT = ". . .";

var utils = {
    trackerSettings: {
        fill: "grey",
        stroke: "grey",
        opacity: 0.0001
    },
    animationSettings: { duration: 250 }
};
var consts = {
    emptySliderMarkerText: EMPTY_SLIDER_MARKER_TEXT,
    pointerSize: POINTER_SIZE
};

var formatValue = function(value, formatOptions, tickIntervalsInfo, valueType, type, logarithmBase) {
    var formatObject = {
        value: value,
        valueText: _format(value, {
            labelOptions: formatOptions,
            ticks: tickIntervalsInfo ? tickIntervalsInfo.ticks : [],
            tickInterval: tickIntervalsInfo ? tickIntervalsInfo.tickInterval : undefined,
            dataType: valueType,
            type: type,
            logarithmBase: logarithmBase
        })
    };
    return String(isFunction(formatOptions.customizeText) ? formatOptions.customizeText.call(formatObject, formatObject) : formatObject.valueText);
};

exports.utils = utils;
exports.consts = consts;
exports.formatValue = formatValue;

exports.HEIGHT_COMPACT_MODE = HEIGHT_COMPACT_MODE;
