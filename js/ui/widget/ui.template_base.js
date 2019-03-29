var $ = require("../../core/renderer");
import domAdapter from "../../core/dom_adapter";
import Callbacks from "../../core/utils/callbacks";
import domUtils from "../../core/utils/dom";
import Class from "../../core/class";
var abstract = Class.abstract;


var renderedCallbacks = Callbacks();

/**
 * @name dxTemplate
 * @section uiWidgetMarkupComponents
 * @type object
 */

/**
 * @name dxTemplateOptions.name
 * @type string
 */

var TemplateBase = Class.inherit({

    render: function(options) {
        options = options || {};

        var onRendered = options.onRendered;
        delete options.onRendered;

        var $result = this._renderCore(options);

        this._ensureResultInContainer($result, options.container);
        renderedCallbacks.fire($result, options.container);

        onRendered && onRendered();
        return $result;
    },

    _ensureResultInContainer: function($result, container) {
        if(!container) {
            return;
        }

        var $container = $(container);
        var resultInContainer = domUtils.contains($container.get(0), $result.get(0));
        $container.append($result);
        if(resultInContainer) {
            return;
        }

        var resultInBody = domAdapter.getBody().contains($container.get(0));
        if(!resultInBody) {
            return;
        }

        domUtils.triggerShownEvent($result);
    },

    _renderCore: abstract

});

module.exports = TemplateBase;
module.exports.renderedCallbacks = renderedCallbacks;
