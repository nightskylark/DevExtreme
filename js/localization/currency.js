import extendUtils from "../core/utils/extend";
var extend = extendUtils.extend;
import numberLocalization from "./number";

numberLocalization.inject({
    _formatNumberCore: function(value, format, formatConfig) {
        if(format === "currency") {
            formatConfig.precision = formatConfig.precision || 0;

            var result = this.format(value, extend({}, formatConfig, { type: "fixedpoint" }));
            var currencyPart = this.getCurrencySymbol().symbol.replace("$", "$$$$");

            result = result.replace(/^(\D*)(\d.*)/, "$1" + currencyPart + "$2");

            return result;
        }

        return this.callBase.apply(this, arguments);
    },
    getCurrencySymbol: function() {
        return { symbol: "$" };
    },
    getOpenXmlCurrencyFormat: function() {
        return "$#,##0{0}_);\\($#,##0{0}\\)";
    }
});
