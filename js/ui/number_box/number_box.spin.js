import $ from "../../core/renderer";
import domAdapter from "../../core/dom_adapter";
import eventsEngine from "../../events/core/events_engine";
import Widget from "../widget/ui.widget";
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
import eventUtils from "../../events/utils";
import pointerEvents from "../../events/pointer";
import feedbackEvents from "../../events/core/emitter.feedback";
import holdEvent from "../../events/hold";
import deferredUtils from "../../core/utils/deferred";
var Deferred = deferredUtils.Deferred;
var SPIN_CLASS = "dx-numberbox-spin";
var SPIN_BUTTON_CLASS = "dx-numberbox-spin-button";
var SPIN_HOLD_DELAY = 100;
var NUMBER_BOX = 'dxNumberBox';
var POINTERUP_EVENT_NAME = eventUtils.addNamespace(pointerEvents.up, NUMBER_BOX);
var POINTERCANCEL_EVENT_NAME = eventUtils.addNamespace(pointerEvents.cancel, NUMBER_BOX);

var SpinButton = Widget.inherit({

    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            direction: "up",
            onChange: null,
            activeStateEnabled: true,
            hoverStateEnabled: true
        });
    },

    _initMarkup: function() {
        this.callBase();

        var direction = SPIN_CLASS + "-" + this.option("direction");

        this.$element()
            .addClass(SPIN_BUTTON_CLASS)
            .addClass(direction);

        this._spinIcon = $("<div>").addClass(direction + "-icon").appendTo(this.$element());
    },

    _render: function() {
        this.callBase();

        var eventName = eventUtils.addNamespace(pointerEvents.down, this.NAME);
        var $element = this.$element();

        eventsEngine.off($element, eventName);
        eventsEngine.on($element, eventName, this._spinDownHandler.bind(this));

        this._spinChangeHandler = this._createActionByOption("onChange");
    },

    _spinDownHandler: function(e) {
        e.preventDefault();

        this._clearTimer();

        eventsEngine.on(this.$element(), holdEvent.name, (function() {
            this._feedBackDeferred = new Deferred();
            feedbackEvents.lock(this._feedBackDeferred);
            this._spinChangeHandler({ event: e });
            this._holdTimer = setInterval(this._spinChangeHandler, SPIN_HOLD_DELAY, { event: e });
        }).bind(this));

        var document = domAdapter.getDocument();
        eventsEngine.on(document, POINTERUP_EVENT_NAME, this._clearTimer.bind(this));
        eventsEngine.on(document, POINTERCANCEL_EVENT_NAME, this._clearTimer.bind(this));

        this._spinChangeHandler({ event: e });
    },

    _dispose: function() {
        this._clearTimer();
        this.callBase();
    },

    _clearTimer: function() {
        eventsEngine.off(this.$element(), holdEvent.name);

        var document = domAdapter.getDocument();
        eventsEngine.off(document, POINTERUP_EVENT_NAME);
        eventsEngine.off(document, POINTERCANCEL_EVENT_NAME);

        if(this._feedBackDeferred) {
            this._feedBackDeferred.resolve();
        }
        if(this._holdTimer) {
            clearInterval(this._holdTimer);
        }
    },

    _optionChanged: function(args) {
        switch(args.name) {
            case "onChange":
            case "direction":
                this._invalidate();
                break;
            default:
                this.callBase(args);
        }
    }
});

module.exports = SpinButton;
