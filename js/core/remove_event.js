import $ from "./renderer";
import dataModule from "./element_data";
var beforeCleanData = dataModule.beforeCleanData;
import eventsEngine from "../events/core/events_engine";
import registerEvent from "../events/core/event_registrator";

var eventName = "dxremove";
var eventPropName = "dxRemoveEvent";

/**
  * @name ui events.dxremove
  * @type eventType
  * @type_function_param1 event:event
  * @module events/remove
*/

beforeCleanData(function(elements) {
    elements = [].slice.call(elements);
    for(var i = 0; i < elements.length; i++) {
        var $element = $(elements[i]);
        if($element.prop(eventPropName)) {
            $element[0][eventPropName] = null;
            eventsEngine.triggerHandler($element, eventName);
        }
    }
});

registerEvent(eventName, {
    noBubble: true,
    setup: function(element) {
        $(element).prop(eventPropName, true);
    }
});

module.exports = eventName;
