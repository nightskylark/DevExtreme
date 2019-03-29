var $ = require("../core/renderer");
import windowUtils from "../core/utils/window";
var window = windowUtils.getWindow();
import eventsEngine from "../events/core/events_engine";
import stringUtils from "../core/utils/string";
import registerComponent from "../core/component_registrator";
import translator from "../animation/translator";
import inflectorUtils from "../core/utils/inflector";
var dasherize = inflectorUtils.dasherize;
import extendUtils from "../core/utils/extend";
var extend = extendUtils.extend;
import DOMComponent from "../core/dom_component";
import eventUtils from "../events/utils";
import pointerEvents from "../events/pointer";
import dragEvents from "../events/drag";
import positionUtils from "../animation/position";
import typeUtils from "../core/utils/type";
var isFunction = typeUtils.isFunction;
import commonUtils from "../core/utils/common";
var noop = commonUtils.noop;
var DRAGGABLE = "dxDraggable";
var DRAGSTART_EVENT_NAME = eventUtils.addNamespace(dragEvents.start, DRAGGABLE);
var DRAG_EVENT_NAME = eventUtils.addNamespace(dragEvents.move, DRAGGABLE);
var DRAGEND_EVENT_NAME = eventUtils.addNamespace(dragEvents.end, DRAGGABLE);
var POINTERDOWN_EVENT_NAME = eventUtils.addNamespace(pointerEvents.down, DRAGGABLE);
var DRAGGABLE_CLASS = dasherize(DRAGGABLE);
var DRAGGABLE_DRAGGING_CLASS = DRAGGABLE_CLASS + "-dragging";


var Draggable = DOMComponent.inherit({
    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            onDragStart: noop,
            onDrag: noop,
            onDragEnd: noop,
            immediate: true,
            direction: "both",
            area: window,
            boundOffset: 0,
            allowMoveByClick: false
        });
    },

    _init: function() {
        this.callBase();
        this._attachEventHandlers();
    },

    _attachEventHandlers: function() {
        if(this.option("disabled")) {
            return;
        }

        var $element = this.$element().css("position", "absolute");
        var eventHandlers = {};
        var allowMoveByClick = this.option("allowMoveByClick");

        eventHandlers[DRAGSTART_EVENT_NAME] = this._dragStartHandler.bind(this);
        eventHandlers[DRAG_EVENT_NAME] = this._dragHandler.bind(this);
        eventHandlers[DRAGEND_EVENT_NAME] = this._dragEndHandler.bind(this);

        if(allowMoveByClick) {
            eventHandlers[POINTERDOWN_EVENT_NAME] = this._pointerDownHandler.bind(this);
            $element = this._getArea();
        }

        eventsEngine.on($element, eventHandlers, {
            direction: this.option("direction"),
            immediate: this.option("immediate")
        });
    },

    _detachEventHandlers: function() {
        eventsEngine.off(this.$element(), "." + DRAGGABLE);
        eventsEngine.off(this._getArea(), "." + DRAGGABLE);
    },

    _move: function(position) {
        translator.move(this.$element(), position);
    },

    _pointerDownHandler: function(e) {
        if(eventUtils.needSkipEvent(e)) {
            return;
        }

        var areaOffset = this._getAreaOffset($(e.currentTarget));
        var direction = this.option("direction");
        var position = {};

        if(direction === "horizontal" || direction === "both") {
            position.left = e.pageX - this.$element().width() / 2 - areaOffset.left;
        }

        if(direction === "vertical" || direction === "both") {
            position.top = e.pageY - this.$element().height() / 2 - areaOffset.top;
        }

        this._move(position);

        this._getAction("onDrag")({ event: e });
    },

    _dragStartHandler: function(e) {
        var $element = this.$element();
        if($element.is(".dx-state-disabled, .dx-state-disabled *")) {
            e.cancel = true;
            return;
        }

        var $area = this._getArea();
        var areaOffset = this._getAreaOffset($area);
        var boundOffset = this._getBoundOffset();
        var areaWidth = $area.outerWidth();
        var areaHeight = $area.outerHeight();
        var elementWidth = $element.width();
        var elementHeight = $element.height();

        this._toggleDraggingClass(true);

        var startOffset = {
            left: $element.offset().left - areaOffset.left,
            top: $element.offset().top - areaOffset.top
        };

        this._startPosition = translator.locate($element);

        e.maxLeftOffset = startOffset.left - boundOffset.left;
        e.maxRightOffset = areaWidth - startOffset.left - elementWidth - boundOffset.right;
        e.maxTopOffset = startOffset.top - boundOffset.top;
        e.maxBottomOffset = areaHeight - startOffset.top - elementHeight - boundOffset.bottom;

        this._getAction("onDragStart")({ event: e });
    },

    _getAreaOffset: function($area) {
        var offset = $area && positionUtils.offset($area);
        return offset ? offset : { left: 0, top: 0 };
    },

    _toggleDraggingClass: function(value) {
        this.$element().toggleClass(DRAGGABLE_DRAGGING_CLASS, value);
    },

    _getBoundOffset: function() {
        var boundOffset = this.option("boundOffset");

        if(isFunction(boundOffset)) {
            boundOffset = boundOffset.call(this);
        }

        return stringUtils.quadToObject(boundOffset);
    },

    _getArea: function() {
        var area = this.option("area");
        if(isFunction(area)) {
            area = area.call(this);
        }
        return $(area);
    },

    _dragHandler: function(e) {
        var offset = e.offset;
        var startPosition = this._startPosition;

        this._move({
            left: startPosition.left + offset.x,
            top: startPosition.top + offset.y
        });

        this._getAction("onDrag")({ event: e });
    },

    _dragEndHandler: function(e) {
        this._toggleDraggingClass(false);

        this._getAction("onDragEnd")({ event: e });
    },

    _getAction: function(name) {
        return this["_" + name + "Action"] || this._createActionByOption(name);
    },

    _render: function() {
        this.callBase();
        this.$element().addClass(DRAGGABLE_CLASS);
    },

    _optionChanged: function(args) {
        var name = args.name;

        switch(name) {
            case "onDragStart":
            case "onDrag":
            case "onDragEnd":
                this["_" + name + "Action"] = this._createActionByOption(name);
                break;
            case "allowMoveByClick":
            case "direction":
            case "disabled":
                this._detachEventHandlers();
                this._attachEventHandlers();
                break;
            case "boundOffset":
            case "area":
                break;
            default:
                this.callBase(args);
        }
    },

    _dispose: function() {
        this.callBase();
        this._detachEventHandlers();
    }
});

registerComponent(DRAGGABLE, Draggable);

module.exports = Draggable;
