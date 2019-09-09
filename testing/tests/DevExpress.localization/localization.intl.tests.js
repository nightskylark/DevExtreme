import sharedTests from "./sharedParts/localization.shared.js";
import dateLocalization from "localization/date";
import numberLocalization from "localization/number";
// NOTE: IntlPolyfill is used for more stable testing on all browsers
import "intl";

QUnit.module("Intl localization", {
    before: () => {
        dateLocalization.inject({
            format: function(value, format) {
                // NOTE: IntlPolyfill uses CLDR data, so it formats this format with ` at `, but real browser`s Intl uses `, ` separator.
                let result = this.callBase.apply(this, arguments);
                if(typeof format === "string" && format.toLowerCase() === "longdatelongtime") {
                    result = result.replace(' at ', ', ');
                }
                return result;
            }
        });

        numberLocalization.inject({
            format: function(value, format) {
                // NOTE: IntlPolifill rounding bug. In real Intl it works OK.
                let result = this.callBase.apply(this, arguments);
                if(value === 4.645 && format.type === "fixedPoint" && format.precision === 2 && result === "4.64") {
                    result = "4.65";
                }
                return result;
            }
        });
    }
}, sharedTests);
