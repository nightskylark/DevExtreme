var $ = require("../../core/renderer");
var eventsEngine = require("../../events/core/events_engine");
var domAdapter = require("../../core/dom_adapter");
var callOnce = require("../../core/utils/call_once");
var registerEvent = require("./event_registrator");
var eventUtils = require("../utils");
var EVENT_NAME = "dxmousewheel";
var EVENT_NAMESPACE = "dxWheel";

var getWheelEventName = callOnce(function() {
    return domAdapter.hasDocumentProperty("onwheel") ? "wheel" : "mousewheel";
});

var wheel = {

    setup: function(element) {
        var $element = $(element);
        eventsEngine.on($element, eventUtils.addNamespace(getWheelEventName(), EVENT_NAMESPACE), wheel._wheelHandler.bind(wheel));
    },

    teardown: function(element) {
        eventsEngine.off(element, "." + EVENT_NAMESPACE);
    },

    _wheelHandler: function(e) {
        var delta = this._getWheelDelta(e.originalEvent);

        eventUtils.fireEvent({
            type: EVENT_NAME,
            originalEvent: e,
            delta: delta,
            pointerType: "mouse"
        });

        e.stopPropagation();
    },

    _getWheelDelta: function(event) {
        return event.wheelDelta
            ? event.wheelDelta
            : -event.deltaY * 30;
    }

};

registerEvent(EVENT_NAME, wheel);

exports.name = EVENT_NAME;
