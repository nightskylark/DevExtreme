import jQuery from "jquery";
import eventsEngine from "../../events/core/events_engine";
var useJQuery = require("./use_jquery")();
import registerEventCallbacks from "../../events/core/event_registrator_callbacks";
import domAdapter from "../../core/dom_adapter";

if(useJQuery) {
    registerEventCallbacks.add(function(name, eventObject) {
        jQuery.event.special[name] = eventObject;
    });

    eventsEngine.forcePassiveFalseEventNames.forEach(function(eventName) {
        jQuery.event.special[eventName] = {
            setup: function(data, namespaces, handler) {
                domAdapter.listen(this, eventName, handler, { passive: false });
            }
        };
    });

    eventsEngine.set({
        on: function(element) {
            jQuery(element).on.apply(jQuery(element), Array.prototype.slice.call(arguments, 1));
        },
        one: function(element) {
            jQuery(element).one.apply(jQuery(element), Array.prototype.slice.call(arguments, 1));
        },
        off: function(element) {
            jQuery(element).off.apply(jQuery(element), Array.prototype.slice.call(arguments, 1));
        },
        trigger: function(element) {
            jQuery(element).trigger.apply(jQuery(element), Array.prototype.slice.call(arguments, 1));
        },
        triggerHandler: function(element) {
            jQuery(element).triggerHandler.apply(jQuery(element), Array.prototype.slice.call(arguments, 1));
        },
        Event: jQuery.Event
    });
}
