var dependencyInjector = require("../core/utils/dependency_injector");
import typeUtils from "../core/utils/type";
var isString = typeUtils.isString;
var iteratorUtils = require("../core/utils/iterator");
import arrayUtils from "../core/utils/array";
var inArray = arrayUtils.inArray;
import dateFormatterModule from "./ldml/date.formatter";
var getLDMLDateFormatter = dateFormatterModule.getFormatter;
import dateFormatModule from "./ldml/date.format";
var getLDMLDateFormat = dateFormatModule.getFormat;
import dateParserModule from "./ldml/date.parser";
var getLDMLDateParser = dateParserModule.getParser;
var defaultDateNames = require("./default_date_names");
var numberLocalization = require("./number");
var errors = require("../core/errors");

require("./core");

var FORMATS_TO_PATTERN_MAP = {
    "shortdate": "M/d/y",
    "shorttime": "h:mm a",
    "longdate": "EEEE, MMMM d, y",
    "longtime": "h:mm:ss a",
    "monthandday": "MMMM d",
    "monthandyear": "MMMM y",
    "quarterandyear": "QQQ y",
    "day": "d",
    "year": "y",
    "shortdateshorttime": "M/d/y, h:mm a",
    "mediumdatemediumtime": "MMMM d, h:mm a",
    "longdatelongtime": "EEEE, MMMM d, y, h:mm:ss a",
    "month": "LLLL",
    "shortyear": "yy",
    "dayofweek": "EEEE",
    "quarter": "QQQ",
    "hour": "HH",
    "minute": "mm",
    "second": "ss",
    "millisecond": "SSS",
    "datetime-local": "yyyy-MM-ddTHH':'mm':'ss"
};

var possiblePartPatterns = {
    year: ["y", "yy", "yyyy"],
    day: ["d", "dd"],
    month: ["M", "MM", "MMM", "MMMM"],
    hours: ["H", "HH", "h", "hh", "ah"],
    minutes: ["m", "mm"],
    seconds: ["s", "ss"],
    milliseconds: ["S", "SS", "SSS"]
};

var dateLocalization = dependencyInjector({
    _getPatternByFormat: function(format) {
        return FORMATS_TO_PATTERN_MAP[format.toLowerCase()];
    },
    _expandPattern: function(pattern) {
        return this._getPatternByFormat(pattern) || pattern;
    },
    formatUsesMonthName: function(format) {
        return this._expandPattern(format).indexOf("MMMM") !== -1;
    },

    formatUsesDayName: function(format) {
        return this._expandPattern(format).indexOf("EEEE") !== -1;
    },
    getFormatParts: function(format) {
        var pattern = this._getPatternByFormat(format) || format;
        var result = [];

        iteratorUtils.each(pattern.split(/\W+/), function(_, formatPart) {
            iteratorUtils.each(possiblePartPatterns, function(partName, possiblePatterns) {
                if(inArray(formatPart, possiblePatterns) > -1) {
                    result.push(partName);
                }
            });
        });

        return result;
    },
    getMonthNames: function(format) {
        return defaultDateNames.getMonthNames(format);
    },
    getDayNames: function(format) {
        return defaultDateNames.getDayNames(format);
    },
    getQuarterNames: function(format) {
        return defaultDateNames.getQuarterNames(format);
    },
    getPeriodNames: function(format) {
        return defaultDateNames.getPeriodNames(format);
    },
    getTimeSeparator: function() {
        return ":";
    },

    is24HourFormat: function(format) {
        var amTime = new Date(2017, 0, 20, 11, 0, 0, 0);
        var pmTime = new Date(2017, 0, 20, 23, 0, 0, 0);
        var amTimeFormatted = this.format(amTime, format);
        var pmTimeFormatted = this.format(pmTime, format);

        for(var i = 0; i < amTimeFormatted.length; i++) {
            if(amTimeFormatted[i] !== pmTimeFormatted[i]) {
                return !isNaN(parseInt(amTimeFormatted[i]));
            }
        }
    },

    format: function(date, format) {
        if(!date) {
            return;
        }

        if(!format) {
            return date;
        }

        var formatter;

        if(typeof (format) === "function") {
            formatter = format;
        } else if(format.formatter) {
            formatter = format.formatter;
        } else {
            format = format.type || format;
            if(isString(format)) {
                format = FORMATS_TO_PATTERN_MAP[format.toLowerCase()] || format;
                return numberLocalization.convertDigits(getLDMLDateFormatter(format, this)(date));
            }
        }

        if(!formatter) {
            // TODO: log warning or error
            return;
        }

        return formatter(date);
    },

    parse: function(text, format) {
        var that = this;
        var result;
        var ldmlFormat;
        var formatter;

        if(!text) {
            return;
        }

        if(!format) {
            return this.parse(text, "shortdate");
        }

        if(format.parser) {
            return format.parser(text);
        }

        if(typeof format === "string" && !FORMATS_TO_PATTERN_MAP[format.toLowerCase()]) {
            ldmlFormat = format;
        } else {
            formatter = function(value) {
                var text = that.format(value, format);
                return numberLocalization.convertDigits(text, true);
            };
            try {
                ldmlFormat = getLDMLDateFormat(formatter);
            } catch(e) {}
        }

        if(ldmlFormat) {
            text = numberLocalization.convertDigits(text, true);
            return getLDMLDateParser(ldmlFormat, this)(text);
        }

        errors.log("W0012");
        result = new Date(text);

        if(!result || isNaN(result.getTime())) {
            return;
        }

        return result;
    },

    firstDayOfWeekIndex: function() {
        return 0;
    }
});

module.exports = dateLocalization;
