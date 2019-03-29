import $ from "../core/renderer";
import fx from "../animation/fx";
import translator from "../animation/translator";
import mathUtils from "../core/utils/math";
import extendUtils from "../core/utils/extend";
var extend = extendUtils.extend;
import commonUtils from "../core/utils/common";
var noop = commonUtils.noop;
import domUtils from "../core/utils/dom";
import typeUtils from "../core/utils/type";
var isDefined = typeUtils.isDefined;
import devices from "../core/devices";
var getPublicElement = domUtils.getPublicElement;
import registerComponent from "../core/component_registrator";
import CollectionWidget from "./collection/ui.collection_widget.live_update";
import Swipeable from "../events/gesture/swipeable";
import deferredUtils from "../core/utils/deferred";
var Deferred = deferredUtils.Deferred;
var MULTIVIEW_CLASS = "dx-multiview";
var MULTIVIEW_WRAPPER_CLASS = "dx-multiview-wrapper";
var MULTIVIEW_ITEM_CONTAINER_CLASS = "dx-multiview-item-container";
var MULTIVIEW_ITEM_CLASS = "dx-multiview-item";
var MULTIVIEW_ITEM_HIDDEN_CLASS = "dx-multiview-item-hidden";
var MULTIVIEW_ITEM_DATA_KEY = "dxMultiViewItemData";
var MULTIVIEW_ANIMATION_DURATION = 200;

var toNumber = function(value) {
    return +(value);
};

var position = function($element) {
    return translator.locate($element).left;
};

var move = function($element, position) {
    translator.move($element, { left: position });
};

var animation = {

    moveTo: function($element, position, duration, completeAction) {
        fx.animate($element, {
            type: "slide",
            to: { left: position },
            duration: duration,
            complete: completeAction
        });
    },

    complete: function($element) {
        fx.stop($element, true);
    }

};

/**
* @name dxMultiView
* @inherits CollectionWidget
* @module ui/multi_view
* @export default
*/
var MultiView = CollectionWidget.inherit({

    _activeStateUnit: "." + MULTIVIEW_ITEM_CLASS,

    _supportedKeys: function() {
        return extend(this.callBase(), {
            pageUp: noop,
            pageDown: noop
        });
    },

    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            /**
            * @name dxMultiViewOptions.selectedIndex
            * @type number
            * @default 0
            */
            selectedIndex: 0,

            /**
            * @name dxMultiViewOptions.swipeEnabled
            * @type boolean
            * @default true
            */
            swipeEnabled: true,

            /**
            * @name dxMultiViewOptions.animationEnabled
            * @type boolean
            * @default true
            */
            animationEnabled: true,

            /**
            * @name dxMultiViewOptions.loop
            * @type boolean
            * @default false
            */
            loop: false,

            /**
            * @name dxMultiViewOptions.deferRendering
            * @type boolean
            * @default true
            */
            deferRendering: true,

            /**
            * @name dxMultiViewOptions.selectedItems
            * @hidden
            * @inheritdoc
            */

            /**
            * @name dxMultiViewOptions.selectedItemKeys
            * @hidden
            * @inheritdoc
            */

            /**
            * @name dxMultiViewOptions.keyExpr
            * @hidden
            * @inheritdoc
            */

            /**
             * @name dxMultiViewOptions.items
             * @type Array<string, dxMultiViewItem, object>
             * @fires dxMultiViewOptions.onOptionChanged
             * @inheritdoc
             */

            _itemAttributes: { role: "tabpanel" },
            loopItemFocus: false,
            selectOnFocus: true,
            selectionMode: "single",
            selectionRequired: true,
            selectionByClick: false
        });
    },

    _defaultOptionsRules: function() {
        return this.callBase().concat([
            {
                device: function() {
                    return devices.real().deviceType === "desktop" && !devices.isSimulator();
                },
                options: {
                    /**
                    * @name dxMultiViewOptions.focusStateEnabled
                    * @type boolean
                    * @default true @for desktop
                    * @inheritdoc
                    */
                    focusStateEnabled: true
                }
            }
        ]);
    },

    _itemClass: function() {
        return MULTIVIEW_ITEM_CLASS;
    },

    _itemDataKey: function() {
        return MULTIVIEW_ITEM_DATA_KEY;
    },

    _itemContainer: function() {
        return this._$itemContainer;
    },

    _itemElements: function() {
        return this._itemContainer().children(this._itemSelector());
    },

    _itemWidth: function() {
        if(!this._itemWidthValue) {
            this._itemWidthValue = this._$wrapper.width();
        }

        return this._itemWidthValue;
    },

    _clearItemWidthCache: function() {
        delete this._itemWidthValue;
    },

    _itemsCount: function() {
        return this.option("items").length;
    },

    _normalizeIndex: function(index) {
        var count = this._itemsCount();

        if(index < 0) {
            index = index + count;
        }
        if(index >= count) {
            index = index - count;
        }

        return index;
    },

    _getRTLSignCorrection: function() {
        return this.option("rtlEnabled") ? -1 : 1;
    },

    _init: function() {
        this.callBase.apply(this, arguments);

        var $element = this.$element();

        $element.addClass(MULTIVIEW_CLASS);

        this._$wrapper = $("<div>").addClass(MULTIVIEW_WRAPPER_CLASS);
        this._$wrapper.appendTo($element);

        this._$itemContainer = $("<div>").addClass(MULTIVIEW_ITEM_CONTAINER_CLASS);
        this._$itemContainer.appendTo(this._$wrapper);

        this.option("loopItemFocus", this.option("loop"));

        this._initSwipeable();
    },

    _initMarkup: function() {
        this._deferredItems = [];

        this.callBase();
    },

    _renderItemContent: function(args) {
        var renderContentDeferred = new Deferred();

        var that = this;
        var callBase = this.callBase;

        var deferred = new Deferred();
        deferred.done(function() {
            var $itemContent = callBase.call(that, args);
            renderContentDeferred.resolve($itemContent);
        });

        this._deferredItems[args.index] = deferred;
        this.option("deferRendering") || deferred.resolve();

        return renderContentDeferred.promise();
    },

    _render: function() {
        this.callBase();
        var selectedItemIndices = this._getSelectedItemIndices();
        this._updateItemsPosition(selectedItemIndices[0]);
        this._updateItemsVisibility(selectedItemIndices[0]);
    },

    _renderSelection: function(addedSelection) {
        this._updateItemsVisibility(addedSelection[0]);
    },

    _updateItems: function(selectedIndex, newIndex) {
        this._updateItemsPosition(selectedIndex, newIndex);
        this._updateItemsVisibility(selectedIndex, newIndex);
    },

    _updateItemsPosition: function(selectedIndex, newIndex) {
        var $itemElements = this._itemElements();
        var positionSign = -this._animationDirection(newIndex, selectedIndex);
        var $selectedItem = $itemElements.eq(selectedIndex);

        move($selectedItem, 0);
        move($itemElements.eq(newIndex), positionSign * 100 + "%");
    },

    _updateItemsVisibility: function(selectedIndex, newIndex) {
        var $itemElements = this._itemElements();

        $itemElements.each((function(itemIndex, item) {
            var $item = $(item);
            var isHidden = itemIndex !== selectedIndex && itemIndex !== newIndex;

            if(!isHidden) {
                this._renderSpecificItem(itemIndex);
            }
            $item.toggleClass(MULTIVIEW_ITEM_HIDDEN_CLASS, isHidden);

            this.setAria("hidden", isHidden || undefined, $item);
        }).bind(this));
    },

    _renderSpecificItem: function(index) {
        var $item = this._itemElements().eq(index);
        var hasItemContent = $item.find(this._itemContentClass()).length > 0;

        if(isDefined(index) && !hasItemContent) {
            this._deferredItems[index].resolve();
            domUtils.triggerResizeEvent($item);
        }
    },

    _refreshItem: function($item, item) {
        this.callBase($item, item);

        this._updateItemsVisibility(this.option("selectedIndex"));
    },

    _setAriaSelected: noop,

    _updateSelection: function(addedSelection, removedSelection) {
        var newIndex = addedSelection[0];
        var prevIndex = removedSelection[0];

        animation.complete(this._$itemContainer);

        this._updateItems(prevIndex, newIndex);

        var animationDirection = this._animationDirection(newIndex, prevIndex);

        this._animateItemContainer(animationDirection * this._itemWidth(), (function() {
            move(this._$itemContainer, 0);
            this._updateItems(newIndex);

            // NOTE: force layout recalculation on iOS 6 & iOS 7.0 (B254713)
            this._$itemContainer.width();
        }).bind(this));
    },

    _animateItemContainer: function(position, completeCallback) {
        var duration = this.option("animationEnabled") ? MULTIVIEW_ANIMATION_DURATION : 0;

        animation.moveTo(this._$itemContainer, position, duration, completeCallback);
    },

    _animationDirection: function(newIndex, prevIndex) {
        var containerPosition = position(this._$itemContainer);
        var indexDifference = (prevIndex - newIndex) * this._getRTLSignCorrection() * this._getItemFocusLoopSignCorrection();
        var isSwipePresent = containerPosition !== 0;
        var directionSignVariable = isSwipePresent ? containerPosition : indexDifference;

        return mathUtils.sign(directionSignVariable);
    },

    _initSwipeable: function() {
        this._createComponent(this.$element(), Swipeable, {
            disabled: !this.option("swipeEnabled"),
            elastic: false,
            itemSizeFunc: this._itemWidth.bind(this),
            onStart: (function(args) {
                this._swipeStartHandler(args.event);
            }).bind(this),
            onUpdated: (function(args) {
                this._swipeUpdateHandler(args.event);
            }).bind(this),
            onEnd: (function(args) {
                this._swipeEndHandler(args.event);
            }).bind(this)
        });
    },

    _swipeStartHandler: function(e) {
        animation.complete(this._$itemContainer);

        var selectedIndex = this.option("selectedIndex");
        var loop = this.option("loop");
        var lastIndex = this._itemsCount() - 1;
        var rtl = this.option("rtlEnabled");

        e.maxLeftOffset = toNumber(loop || (rtl ? selectedIndex > 0 : selectedIndex < lastIndex));
        e.maxRightOffset = toNumber(loop || (rtl ? selectedIndex < lastIndex : selectedIndex > 0));

        this._swipeDirection = null;
    },

    _swipeUpdateHandler: function(e) {
        var offset = e.offset;
        var swipeDirection = mathUtils.sign(offset) * this._getRTLSignCorrection();

        move(this._$itemContainer, offset * this._itemWidth());

        if(swipeDirection !== this._swipeDirection) {
            this._swipeDirection = swipeDirection;

            var selectedIndex = this.option("selectedIndex");
            var newIndex = this._normalizeIndex(selectedIndex - swipeDirection);

            this._updateItems(selectedIndex, newIndex);
        }
    },

    _swipeEndHandler: function(e) {
        var targetOffset = e.targetOffset * this._getRTLSignCorrection();
        if(targetOffset) {
            this.option("selectedIndex", this._normalizeIndex(this.option("selectedIndex") - targetOffset));
            // TODO: change focusedElement on focusedItem
            var $selectedElement = this.itemElements().filter(".dx-item-selected");
            this.option("focusStateEnabled") && this.option("focusedElement", getPublicElement($selectedElement));
        } else {
            this._animateItemContainer(0, noop);
        }
    },

    _getItemFocusLoopSignCorrection: function() {
        return this._itemFocusLooped ? -1 : 1;
    },

    _moveFocus: function() {
        this.callBase.apply(this, arguments);

        this._itemFocusLooped = false;
    },

    _prevItem: function($items) {
        var $result = this.callBase.apply(this, arguments);

        this._itemFocusLooped = $result.is($items.last());

        return $result;
    },

    _nextItem: function($items) {
        var $result = this.callBase.apply(this, arguments);

        this._itemFocusLooped = $result.is($items.first());

        return $result;
    },

    _dimensionChanged: function() {
        this._clearItemWidthCache();
    },

    _visibilityChanged: function(visible) {
        if(visible) {
            this._dimensionChanged();
        }
    },

    _optionChanged: function(args) {
        var value = args.value;

        switch(args.name) {
            case "loop":
                this.option("loopItemFocus", value);
                break;
            case "animationEnabled":
                break;
            case "swipeEnabled":
                Swipeable.getInstance(this.$element()).option("disabled", !value);
                break;
            case "deferRendering":
                this._invalidate();
                break;
            default:
                this.callBase(args);
        }
    }

});
/**
* @name dxMultiViewItem
* @inherits CollectionWidgetItem
* @type object
*/
/**
* @name dxMultiViewItem.visible
* @hidden
* @inheritdoc
*/

registerComponent("dxMultiView", MultiView);

module.exports = MultiView;
///#DEBUG
module.exports.animation = animation;
///#ENDDEBUG
