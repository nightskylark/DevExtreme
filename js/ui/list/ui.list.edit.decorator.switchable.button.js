var $ = require("../../core/renderer");
var fx = require("../../animation/fx");
var Button = require("../button");
var messageLocalization = require("../../localization/message");
var registerDecorator = require("./ui.list.edit.decorator_registry").register;
var SwitchableEditDecorator = require("./ui.list.edit.decorator.switchable");
var SWITCHABLE_DELETE_BUTTON_CONTAINER_CLASS = "dx-list-switchable-delete-button-container";
var SWITCHABLE_DELETE_BUTTON_WRAPPER_CLASS = "dx-list-switchable-delete-button-wrapper";
var SWITCHABLE_DELETE_BUTTON_INNER_WRAPPER_CLASS = "dx-list-switchable-delete-button-inner-wrapper";
var SWITCHABLE_DELETE_BUTTON_CLASS = "dx-list-switchable-delete-button";
var SWITCHABLE_DELETE_BUTTON_ANIMATION_DURATION = 200;

var SwitchableButtonEditDecorator = SwitchableEditDecorator.inherit({

    _init: function() {
        this.callBase.apply(this, arguments);

        var $buttonContainer = $("<div>").addClass(SWITCHABLE_DELETE_BUTTON_CONTAINER_CLASS);
        var $buttonWrapper = $("<div>").addClass(SWITCHABLE_DELETE_BUTTON_WRAPPER_CLASS);
        var $buttonInnerWrapper = $("<div>").addClass(SWITCHABLE_DELETE_BUTTON_INNER_WRAPPER_CLASS);
        var $button = $("<div>").addClass(SWITCHABLE_DELETE_BUTTON_CLASS);

        this._list._createComponent($button, Button, {
            text: messageLocalization.format("dxListEditDecorator-delete"),
            type: "danger",
            onClick: (function(e) {
                this._deleteItem();
                e.event.stopPropagation();
            }).bind(this),
            integrationOptions: {}
        });

        $buttonContainer.append($buttonWrapper);
        $buttonWrapper.append($buttonInnerWrapper);
        $buttonInnerWrapper.append($button);

        this._$buttonContainer = $buttonContainer;
    },

    _enablePositioning: function($itemElement) {
        this.callBase.apply(this, arguments);

        fx.stop(this._$buttonContainer, true);
        this._$buttonContainer.appendTo($itemElement);
    },

    _disablePositioning: function() {
        this.callBase.apply(this, arguments);

        this._$buttonContainer.detach();
    },

    _animatePrepareDeleteReady: function() {
        var rtl = this._isRtlEnabled();
        var listWidth = this._list.$element().width();
        var buttonWidth = this._buttonWidth();
        var fromValue = rtl ? listWidth : -buttonWidth;
        var toValue = rtl ? listWidth - buttonWidth : 0;

        return fx.animate(this._$buttonContainer, {
            type: "custom",
            duration: SWITCHABLE_DELETE_BUTTON_ANIMATION_DURATION,
            from: { right: fromValue },
            to: { right: toValue }
        });
    },

    _animateForgetDeleteReady: function() {
        var rtl = this._isRtlEnabled();
        var listWidth = this._list.$element().width();
        var buttonWidth = this._buttonWidth();
        var fromValue = rtl ? listWidth - buttonWidth : 0;
        var toValue = rtl ? listWidth : -buttonWidth;

        return fx.animate(this._$buttonContainer, {
            type: "custom",
            duration: SWITCHABLE_DELETE_BUTTON_ANIMATION_DURATION,
            from: { right: fromValue },
            to: { right: toValue }
        });
    },

    _buttonWidth: function() {
        if(!this._buttonContainerWidth) {
            this._buttonContainerWidth = this._$buttonContainer.outerWidth();
        }
        return this._buttonContainerWidth;
    },

    dispose: function() {
        if(this._$buttonContainer) {
            this._$buttonContainer.remove();
        }

        this.callBase.apply(this, arguments);
    }

});


var TOGGLE_DELETE_SWITCH_CONTAINER_CLASS = "dx-list-toggle-delete-switch-container";
var TOGGLE_DELETE_SWITCH_CLASS = "dx-list-toggle-delete-switch";

registerDecorator(
    "delete",
    "toggle",
    SwitchableButtonEditDecorator.inherit({

        beforeBag: function(config) {
            var $itemElement = config.$itemElement;
            var $container = config.$container;

            var $toggle = $("<div>").addClass(TOGGLE_DELETE_SWITCH_CLASS);
            this._list._createComponent($toggle, Button, {
                icon: "toggle-delete",
                onClick: (function(e) {
                    this._toggleDeleteReady($itemElement);
                    e.event.stopPropagation();
                }).bind(this),
                integrationOptions: {}
            });

            $container.addClass(TOGGLE_DELETE_SWITCH_CONTAINER_CLASS);
            $container.append($toggle);
        }

    })
);


registerDecorator(
    "delete",
    "slideButton",
    SwitchableButtonEditDecorator.inherit({

        _shouldHandleSwipe: true,

        _swipeEndHandler: function($itemElement, args) {
            if(args.targetOffset !== 0) {
                this._toggleDeleteReady($itemElement);
            }

            return true;
        }

    })
);

module.exports = SwitchableButtonEditDecorator;
