import extendUtils from "../../core/utils/extend";
var _extend = extendUtils.extend;
import typeUtils from "../../core/utils/type";
var isFunction = typeUtils.isFunction;

var defaultCustomizeLinkTooltip = function(info) {
    return { html: `<strong>${info.source} > ${info.target}</strong><br/>Weight: ${info.weight}` };
};

var defaultCustomizeNodeTooltip = function(info) {
    return { html: `<strong>${info.title}</strong><br/>Incoming weight: ${info.weightIn}<br/>Outgoing weight: ${info.weightOut}` };
};

var generateCustomCallback = function(customCallback, defaultCallback) {
    return function(objectInfo) {
        var res = isFunction(customCallback) ? customCallback.call(objectInfo, objectInfo) : {};
        if(!res.hasOwnProperty('html') && !res.hasOwnProperty('text')) {
            res = _extend(res, defaultCallback.call(objectInfo, objectInfo));
        }
        return res;
    };
};

export function setTooltipCustomOptions(sankey) {
    sankey.prototype._setTooltipOptions = function() {
        var tooltip = this._tooltip;
        var options = tooltip && this._getOption("tooltip");
        tooltip && tooltip.update(_extend({}, options, {
            customizeTooltip: function(args) {
                if(args.type === 'node') {
                    return generateCustomCallback(options.customizeNodeTooltip, defaultCustomizeNodeTooltip)(args.info);
                } else if(args.type === 'link') {
                    return generateCustomCallback(options.customizeLinkTooltip, defaultCustomizeLinkTooltip)(args.info);
                }
                return {};
            },
            enabled: options.enabled
        }));
    };
    sankey.prototype.hideTooltip = function() {
        this._tooltip && this._tooltip.hide();
    };
}
