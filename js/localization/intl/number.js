var extend = require('../../core/utils/extend').extend;
var dxConfig = require('../../core/config');
var locale = require('../core').locale;
var dxVersion = require('../../core/version');
var compareVersions = require('../../core/utils/version').compare;
var window = require("../../core/utils/window").getWindow();

var currencyOptionsCache = {},
    detectCurrencySymbolRegex = /([^\s0]+)?(\s*)0*[.,]*0*(\s*)([^\s0]+)?/,
    formattersCache = {},
    getFormatter = function(format) {
        var key = locale() + '/' + JSON.stringify(format);
        if(!formattersCache[key]) {
            formattersCache[key] = (new window.Intl.NumberFormat(locale(), format)).format;
        }

        return formattersCache[key];
    },
    getCurrencyFormatter = function(currency) {
        return (new window.Intl.NumberFormat(locale(), { style: 'currency', currency: currency }));
    };

// TODO: Improve !window.Intl check

module.exports = {
    _formatNumberCore: function(value, format, formatConfig) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        if(format === 'exponential') {
            return this.callBase.apply(this, arguments);
        }

        return getFormatter(this._normalizeFormatConfig(format, formatConfig))(value);
    },
    _normalizeFormatConfig: function(format, formatConfig, value) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        var config;

        if(format === 'decimal') {
            config = {
                minimumIntegerDigits: formatConfig.precision || undefined,
                useGrouping: false,
                maximumFractionDigits: String(value).length,
                round: value < 0 ? 'ceil' : 'floor'
            };
        } else {
            config = this._getPrecisionConfig(formatConfig.precision);
        }

        if(format === 'percent') {
            config.style = 'percent';
        } else if(format === 'currency') {
            config.style = 'currency';
            config.currency = formatConfig.currency || dxConfig().defaultCurrency;
        }

        return config;
    },
    _getPrecisionConfig: function(precision) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        var config;

        if(precision === null) {
            config = {
                minimumFractionDigits: 0,
                maximumFractionDigits: 20
            };
        } else {
            config = {
                minimumFractionDigits: precision || 0,
                maximumFractionDigits: precision || 0
            };
        }

        return config;
    },
    format: function(value, format) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        if('number' !== typeof value) {
            return value;
        }

        format = this._normalizeFormat(format);

        if(!format || 'function' !== typeof format && !format.type && !format.formatter) {
            return getFormatter(format)(value);
        }

        return this.callBase.apply(this, arguments);
    },
    parse: function(text, format) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        if(compareVersions(dxVersion, '17.2.8') >= 0) {
            return this.callBase.apply(this, arguments);
        }
        if(!text) {
            return;
        }

        if(format && format.parser) {
            return format.parser(text);
        }

        text = this._normalizeNumber(text, format);

        if(text.length > 15) {
            return NaN;
        }

        return parseFloat(text);
    },
    _normalizeNumber: function(text, format) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        var isExponentialRegexp = /^[-+]?[0-9]*.?[0-9]+([eE][-+]?[0-9]+)+$/,
            legitDecimalSeparator = '.';

        if(this.convertDigits) {
            text = this.convertDigits(text, true);
        }

        if(isExponentialRegexp.test(text)) {
            return text;
        }

        var decimalSeparator = this._getDecimalSeparator(format);
        var cleanUpRegexp = new RegExp('[^0-9-\\' + decimalSeparator + ']', 'g');

        return text.replace(cleanUpRegexp, '').replace(decimalSeparator, legitDecimalSeparator);
    },
    _getDecimalSeparator: function(format) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        return getFormatter(format)(0.1)[1];
    },
    _getCurrencySymbolInfo: function(currency) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        var formatter = getCurrencyFormatter(currency);
        return this._extractCurrencySymbolInfo(formatter.format(0));
    },
    _extractCurrencySymbolInfo: function(currencyValueString) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        var match = detectCurrencySymbolRegex.exec(currencyValueString) || [],
            position = match[1] ? 'before' : 'after',
            symbol = match[1] || match[4] || '',
            delimiter = match[2] || match[3] || '';

        return {
            position: position,
            symbol: symbol,
            delimiter: delimiter
        };
    },
    _getCurrencyOptions: function(currency) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        var byCurrencyCache = currencyOptionsCache[locale()];

        if(!byCurrencyCache) {
            byCurrencyCache = currencyOptionsCache[locale()] = {};
        }

        var result = byCurrencyCache[currency];

        if(!result) {
            var formatter = getCurrencyFormatter(currency),
                options = formatter.resolvedOptions(),
                symbolInfo = this._getCurrencySymbolInfo(currency);

            result = byCurrencyCache[currency] = extend(options, {
                currencySymbol: symbolInfo.symbol,
                currencyPosition: symbolInfo.position,
                currencyDelimiter: symbolInfo.delimiter
            });
        }

        return result;
    },
    _repeatCharacter: function(character, times) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        return Array(times + 1).join(character);
    },
    _createOpenXmlCurrencyFormat: function(options) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        var result = this._repeatCharacter('0', options.minimumIntegerDigits);

        result += '{0}'; // precision is specified outside

        if(options.useGrouping) {
            result = '#,' + this._repeatCharacter('#', 3 - options.minimumIntegerDigits) + result;
        }

        if(options.currencySymbol) {
            if(options.currencyPosition === 'before') {
                result = options.currencySymbol + options.currencyDelimiter + result;
            } else {
                result += options.currencyDelimiter + options.currencySymbol;
            }
        }

        return result;
    },
    getCurrencySymbol: function(currency) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        let symbolInfo = this._getCurrencySymbolInfo(currency);
        return {
            "symbol": symbolInfo.symbol
        };
    },
    getOpenXmlCurrencyFormat: function(currency) {
        if(!window.Intl) {
            return this.callBase.apply(this, arguments);
        }

        // TODO: Talk to export-guys
        if(locale() === "en") {
            return this.callBase.apply(this, arguments);
        }
        var currencyValue = currency || dxConfig().defaultCurrency,
            options = this._getCurrencyOptions(currencyValue);
        return this._createOpenXmlCurrencyFormat(options);
    }
};
