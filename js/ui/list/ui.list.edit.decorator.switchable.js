var $ = require("../../core/renderer");
var eventsEngine = require("../../events/core/events_engine");
import commonUtils from "../../core/utils/common";
var noop = commonUtils.noop;
var EditDecorator = require("./ui.list.edit.decorator");
var abstract = EditDecorator.abstract;
var eventUtils = require("../../events/utils");
var pointerEvents = require("../../events/pointer");
var feedbackEvents = require("../../events/core/emitter.feedback");
var LIST_EDIT_DECORATOR = "dxListEditDecorator";
var POINTER_DOWN_EVENT_NAME = eventUtils.addNamespace(pointerEvents.down, LIST_EDIT_DECORATOR);
var ACTIVE_EVENT_NAME = eventUtils.addNamespace(feedbackEvents.active, LIST_EDIT_DECORATOR);
var LIST_ITEM_CONTENT_CLASS = "dx-list-item-content";
var SWITCHABLE_DELETE_READY_CLASS = "dx-list-switchable-delete-ready";
var SWITCHABLE_MENU_SHIELD_POSITIONING_CLASS = "dx-list-switchable-menu-shield-positioning";
var SWITCHABLE_DELETE_TOP_SHIELD_CLASS = "dx-list-switchable-delete-top-shield";
var SWITCHABLE_DELETE_BOTTOM_SHIELD_CLASS = "dx-list-switchable-delete-bottom-shield";
var SWITCHABLE_MENU_ITEM_SHIELD_POSITIONING_CLASS = "dx-list-switchable-menu-item-shield-positioning";
var SWITCHABLE_DELETE_ITEM_CONTENT_SHIELD_CLASS = "dx-list-switchable-delete-item-content-shield";

var SwitchableEditDecorator = EditDecorator.inherit({

    _init: function() {
        this._$topShield = $("<div>").addClass(SWITCHABLE_DELETE_TOP_SHIELD_CLASS);
        this._$bottomShield = $("<div>").addClass(SWITCHABLE_DELETE_BOTTOM_SHIELD_CLASS);
        this._$itemContentShield = $("<div>").addClass(SWITCHABLE_DELETE_ITEM_CONTENT_SHIELD_CLASS);

        eventsEngine.on(this._$topShield, POINTER_DOWN_EVENT_NAME, this._cancelDeleteReadyItem.bind(this));
        eventsEngine.on(this._$bottomShield, POINTER_DOWN_EVENT_NAME, this._cancelDeleteReadyItem.bind(this));

        this._list.$element()
            .append(this._$topShield.toggle(false))
            .append(this._$bottomShield.toggle(false));
    },

    handleClick: function() {
        return this._cancelDeleteReadyItem();
    },

    _cancelDeleteReadyItem: function() {
        if(!this._$readyToDeleteItem) {
            return false;
        }

        this._cancelDelete(this._$readyToDeleteItem);
        return true;
    },

    _cancelDelete: function($itemElement) {
        this._toggleDeleteReady($itemElement, false);
    },

    _toggleDeleteReady: function($itemElement, readyToDelete) {
        if(readyToDelete === undefined) {
            readyToDelete = !this._isReadyToDelete($itemElement);
        }

        this._toggleShields($itemElement, readyToDelete);
        this._toggleScrolling(readyToDelete);
        this._cacheReadyToDeleteItem($itemElement, readyToDelete);
        this._animateToggleDelete($itemElement, readyToDelete);
    },

    _isReadyToDelete: function($itemElement) {
        return $itemElement.hasClass(SWITCHABLE_DELETE_READY_CLASS);
    },

    _toggleShields: function($itemElement, enabled) {
        this._list.$element().toggleClass(SWITCHABLE_MENU_SHIELD_POSITIONING_CLASS, enabled);
        this._$topShield.toggle(enabled);
        this._$bottomShield.toggle(enabled);
        if(enabled) {
            this._updateShieldsHeight($itemElement);
        }

        this._toggleContentShield($itemElement, enabled);
    },

    _updateShieldsHeight: function($itemElement) {
        var $list = this._list.$element();
        var listTopOffset = $list.offset().top;
        var listHeight = $list.outerHeight();
        var itemTopOffset = $itemElement.offset().top;
        var itemHeight = $itemElement.outerHeight();
        var dirtyTopShieldHeight = itemTopOffset - listTopOffset;
        var dirtyBottomShieldHeight = listHeight - itemHeight - dirtyTopShieldHeight;

        this._$topShield.height(Math.max(dirtyTopShieldHeight, 0));
        this._$bottomShield.height(Math.max(dirtyBottomShieldHeight, 0));
    },

    _toggleContentShield: function($itemElement, enabled) {
        if(enabled) {
            $itemElement
                .find("." + LIST_ITEM_CONTENT_CLASS)
                .first()
                .append(this._$itemContentShield);
        } else {
            this._$itemContentShield.detach();
        }
    },

    _toggleScrolling: function(readyToDelete) {
        var scrollView = this._list.$element().dxScrollView("instance");

        if(readyToDelete) {
            scrollView.on("start", this._cancelScrolling);
        } else {
            scrollView.off("start", this._cancelScrolling);
        }
    },

    _cancelScrolling: function(args) {
        args.event.cancel = true;
    },

    _cacheReadyToDeleteItem: function($itemElement, cache) {
        if(cache) {
            this._$readyToDeleteItem = $itemElement;
        } else {
            delete this._$readyToDeleteItem;
        }
    },

    _animateToggleDelete: function($itemElement, readyToDelete) {
        if(readyToDelete) {
            this._enablePositioning($itemElement);
            this._prepareDeleteReady($itemElement);
            this._animatePrepareDeleteReady($itemElement);
            eventsEngine.off($itemElement, pointerEvents.up);
        } else {
            this._forgetDeleteReady($itemElement);
            this._animateForgetDeleteReady($itemElement).done(this._disablePositioning.bind(this, $itemElement));
        }
    },

    _enablePositioning: function($itemElement) {
        $itemElement.addClass(SWITCHABLE_MENU_ITEM_SHIELD_POSITIONING_CLASS);
        eventsEngine.on($itemElement, ACTIVE_EVENT_NAME, noop);
        eventsEngine.one($itemElement, pointerEvents.up, this._disablePositioning.bind(this, $itemElement));
    },

    _disablePositioning: function($itemElement) {
        $itemElement.removeClass(SWITCHABLE_MENU_ITEM_SHIELD_POSITIONING_CLASS);
        eventsEngine.off($itemElement, ACTIVE_EVENT_NAME);
    },

    _prepareDeleteReady: function($itemElement) {
        $itemElement.addClass(SWITCHABLE_DELETE_READY_CLASS);
    },

    _forgetDeleteReady: function($itemElement) {
        $itemElement.removeClass(SWITCHABLE_DELETE_READY_CLASS);
    },

    _animatePrepareDeleteReady: abstract,

    _animateForgetDeleteReady: abstract,

    _deleteItem: function($itemElement) {
        $itemElement = $itemElement || this._$readyToDeleteItem;

        if($itemElement.is(".dx-state-disabled, .dx-state-disabled *")) {
            return;
        }

        this._list.deleteItem($itemElement)
            .always(this._cancelDelete.bind(this, $itemElement));
    },

    _isRtlEnabled: function() {
        return this._list.option("rtlEnabled");
    },

    dispose: function() {
        if(this._$topShield) {
            this._$topShield.remove();
        }
        if(this._$bottomShield) {
            this._$bottomShield.remove();
        }

        this.callBase.apply(this, arguments);
    }

});

module.exports = SwitchableEditDecorator;
