import commonUtils from "../../core/utils/common";
var noop = commonUtils.noop;
import DateBoxStrategy from "./ui.date_box.strategy";
import support from "../../core/utils/support";
import arrayUtils from "../../core/utils/array";
var inArray = arrayUtils.inArray;
import dateUtils from "./ui.date_utils";
import dateSerialization from "../../core/utils/date_serialization";

var NativeStrategy = DateBoxStrategy.inherit({

    NAME: "Native",

    popupConfig: noop,

    getParsedText: function(text) {
        if(!text) {
            return null;
        }

        // NOTE: Required for correct date parsing when native picker is used (T418155)
        if(this.dateBox.option("type") === "datetime") {
            return new Date(text.replace(/-/g, '/').replace('T', ' ').split(".")[0]);
        }

        return dateUtils.fromStandardDateFormat(text);
    },

    renderPopupContent: noop,

    _getWidgetName: noop,

    _getWidgetOptions: noop,

    _getDateBoxType: function() {
        var type = this.dateBox.option("type");

        if(inArray(type, dateUtils.SUPPORTED_FORMATS) === -1) {
            type = "date";
        } else if(type === "datetime" && !support.inputType(type)) {
            type = "datetime-local";
        }

        return type;
    },

    getDefaultOptions: function() {
        return {
            mode: this._getDateBoxType()
        };
    },

    getDisplayFormat: function(displayFormat) {
        var type = this._getDateBoxType();
        return displayFormat || dateUtils.FORMATS_MAP[type];
    },

    renderInputMinMax: function($input) {
        $input.attr({
            min: dateSerialization.serializeDate(this.dateBox.dateOption("min"), "yyyy-MM-dd"),
            max: dateSerialization.serializeDate(this.dateBox.dateOption("max"), "yyyy-MM-dd")
        });
    }
});

module.exports = NativeStrategy;
