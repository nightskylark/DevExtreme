import $ from "../core/renderer";
import windowUtils from "../core/utils/window";
var window = windowUtils.getWindow();
import translator from "../animation/translator";
import inflectorUtils from "../core/utils/inflector";
var camelize = inflectorUtils.camelize;
import commonUtils from "../core/utils/common";
var noop = commonUtils.noop;
import domUtils from "../core/utils/dom";
var getPublicElement = domUtils.getPublicElement;
import iteratorUtils from "../core/utils/iterator";
var each = iteratorUtils.each;
import typeUtils from "../core/utils/type";
var isDefined = typeUtils.isDefined;
import arrayUtils from "../core/utils/array";
var inArray = arrayUtils.inArray;
import extendUtils from "../core/utils/extend";
var extend = extendUtils.extend;
import browser from "../core/utils/browser";
import messageLocalization from "../localization/message";
import devices from "../core/devices";
import registerComponent from "../core/component_registrator";
import Button from "./button";
import themes from "./themes";
import Overlay from "./overlay";
import EmptyTemplate from "./widget/empty_template";
import sizeUtils from "../core/utils/size";

import "./toolbar/ui.toolbar.base";

var POPUP_CLASS = "dx-popup";
var POPUP_WRAPPER_CLASS = "dx-popup-wrapper";
var POPUP_FULL_SCREEN_CLASS = "dx-popup-fullscreen";
var POPUP_FULL_SCREEN_WIDTH_CLASS = "dx-popup-fullscreen-width";
var POPUP_NORMAL_CLASS = "dx-popup-normal";
var POPUP_CONTENT_CLASS = "dx-popup-content";
var POPUP_DRAGGABLE_CLASS = "dx-popup-draggable";
var POPUP_TITLE_CLASS = "dx-popup-title";
var POPUP_TITLE_CLOSEBUTTON_CLASS = "dx-closebutton";
var POPUP_BOTTOM_CLASS = "dx-popup-bottom";
var TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper";
var ALLOWED_TOOLBAR_ITEM_ALIASES = ["cancel", "clear", "done"];
var BUTTON_DEFAULT_TYPE = "default";
var BUTTON_NORMAL_TYPE = "normal";
var BUTTON_TEXT_MODE = "text";
var BUTTON_CONTAINED_MODE = "contained";

var isIE11 = (browser.msie && parseInt(browser.version) === 11);

var getButtonPlace = function(name) {
    var device = devices.current();
    var platform = device.platform;
    var toolbar = "bottom";
    var location = "before";

    if(platform === "ios") {
        switch(name) {
            case "cancel":
                toolbar = "top";
                break;
            case "clear":
                toolbar = "top";
                location = "after";
                break;
            case "done":
                location = "after";
                break;
        }
    } else if(platform === "win") {
        location = "after";
    } else if(platform === "android" && device.version && parseInt(device.version[0]) > 4) {
        switch(name) {
            case "cancel":
                location = "after";
                break;
            case "done":
                location = "after";
                break;
        }
    } else if(platform === "android") {
        location = "center";
    }

    return {
        toolbar: toolbar,
        location: location
    };
};

/**
 * @name dxPopup
 * @inherits dxOverlay
 * @hasTranscludedContent
 * @module ui/popup
 * @export default
 */
var Popup = Overlay.inherit({

    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            /**
            * @name dxPopupOptions.fullScreen
            * @type boolean
            * @default false
            */
            fullScreen: false,

            /**
            * @name dxPopupOptions.title
            * @type string
            * @default ""
            */
            title: "",

            /**
            * @name dxPopupOptions.showTitle
            * @type boolean
            * @default true
            */
            showTitle: true,

            /**
             * @name dxPopupOptions.container
             * @type string|Node|jQuery
             * @default undefined
             */

            /**
            * @name dxPopupOptions.titleTemplate
            * @type template|function
            * @default "title"
            * @type_function_param1 titleElement:dxElement
            * @type_function_return string|Node|jQuery
            */
            titleTemplate: "title",

            /**
            * @name dxPopupOptions.onTitleRendered
            * @extends Action
            * @type function(e)
            * @type_function_param1 e:object
            * @type_function_param1_field4 titleElement:dxElement
            * @action
            */
            onTitleRendered: null,

            /**
            * @name dxPopupOptions.dragEnabled
            * @type boolean
            * @default false
            */
            dragEnabled: false,

            /**
            * @name dxPopupOptions.position
            * @type Enums.PositionAlignment|positionConfig|function
            * @inheritdoc
            */

            /**
             * @name dxPopupOptions.resizeEnabled
             * @type boolean
             * @default false
             */

            /**
            * @name dxPopupOptions.onResizeStart
            * @extends Action
            * @action
            */

            /**
            * @name dxPopupOptions.onResize
            * @extends Action
            * @action
            */

            /**
            * @name dxPopupOptions.onResizeEnd
            * @extends Action
            * @action
            */

            /**
             * @name dxPopupOptions.width
             * @fires dxPopupOptions.onResize
             * @inheritdoc
             */

            /**
             * @name dxPopupOptions.height
             * @fires dxPopupOptions.onResize
             * @inheritdoc
             */

            /**
            * @name dxPopupOptions.toolbarItems
            * @type Array<Object>
            */
            /**
            * @name dxPopupOptions.toolbarItems.toolbar
            * @type Enums.Toolbar
            * @default 'top'
            */
            /**
            * @name dxPopupOptions.toolbarItems.html
            * @type String
            */
            /**
            * @name dxPopupOptions.toolbarItems.text
            * @type String
            */
            /**
            * @name dxPopupOptions.toolbarItems.visible
            * @type boolean
            * @default true
            */
            /**
            * @name dxPopupOptions.toolbarItems.disabled
            * @type boolean
            * @default false
            */
            /**
            * @name dxPopupOptions.toolbarItems.template
            * @type template
            */
            /**
            * @name dxPopupOptions.toolbarItems.widget
            * @type Enums.ToolbarItemWidget
            */
            /**
            * @name dxPopupOptions.toolbarItems.options
            * @type object
            */
            /**
            * @name dxPopupOptions.toolbarItems.location
            * @type Enums.ToolbarItemLocation
            * @default 'center'
            */
            toolbarItems: [],

            /**
            * @name dxPopupOptions.showCloseButton
            * @type boolean
            * @default false
            */
            showCloseButton: false,

            bottomTemplate: "bottom",
            useDefaultToolbarButtons: false,
            useFlatToolbarButtons: false,
            autoResizeEnabled: true
        });
    },

    _defaultOptionsRules: function() {
        var themeName = themes.current();

        return this.callBase().concat([
            {
                device: function(device) {
                    return device.phone && themes.isWin8(themeName);
                },
                options: {
                    position: {
                        my: "top center",
                        at: "top center",
                        offset: "0 0"
                    }
                }
            },
            {
                device: { platform: "ios" },
                options: {
                    /**
                    * @name dxPopupOptions.animation
                    * @default { show: { type: 'slide', duration: 400, from: { position: { my: 'top', at: 'bottom', of: window } }, to: { position: { my: 'center', at: 'center', of: window } } }, hide: { type: 'slide', duration: 400, from: { position: { my: 'center', at: 'center', of: window } }, to: { position: { my: 'top', at: 'bottom', of: window } } }} @for iOS
                    * @inheritdoc
                    */
                    /**
                    * @name dxPopupOptions.animation.show
                    * @default { type: 'slide', duration: 400, from: { position: { my: 'top', at: 'bottom', of: window } }, to: { position: { my: 'center', at: 'center', of: window } }} @for iOS
                    * @inheritdoc
                    */
                    /**
                    * @name dxPopupOptions.animation.hide
                    * @default { type: 'slide', duration: 400, from: { position: { my: 'center', at: 'center', of: window } }, to: { position: { my: 'top', at: 'bottom', of: window } }} @for iOS
                    * @inheritdoc
                    */
                    animation: this._iosAnimation
                }
            },
            {
                device: { platform: "android" },
                options: {
                    animation: this._androidAnimation
                }
            },
            {
                device: { platform: "generic" },
                options: {
                    /**
                    * @name dxPopupOptions.showCloseButton
                    * @default true @for desktop
                    */
                    showCloseButton: true
                }
            },
            {
                device: function(device) {
                    return devices.real().platform === "generic" && device.platform === "generic";
                },
                options: {
                    /**
                    * @name dxPopupOptions.dragEnabled
                    * @default true @for desktop
                    */
                    dragEnabled: true
                }
            },
            {
                device: function() {
                    return devices.real().deviceType === "desktop" && !devices.isSimulator();
                },
                options: {
                    /**
                    * @name dxPopupOptions.focusStateEnabled
                    * @type boolean
                    * @default true @for desktop
                    * @inheritdoc
                    */
                    focusStateEnabled: true
                }
            },
            {
                device: function() {
                    return themes.isMaterial(themeName);
                },
                options: {
                    useDefaultToolbarButtons: true,
                    useFlatToolbarButtons: true
                }
            }
        ]);
    },

    _iosAnimation: {
        show: {
            type: "slide",
            duration: 400,
            from: {
                position: {
                    my: "top",
                    at: "bottom"
                }
            },
            to: {
                position: {
                    my: "center",
                    at: "center"
                }
            }
        },
        hide: {
            type: "slide",
            duration: 400,
            from: {
                opacity: 1,
                position: {
                    my: "center",
                    at: "center"
                }
            },
            to: {
                opacity: 1,
                position: {
                    my: "top",
                    at: "bottom"
                }
            }
        }
    },

    _androidAnimation: function() {
        var fullScreenConfig = {
            show: { type: "slide", duration: 300, from: { top: "30%", opacity: 0 }, to: { top: 0, opacity: 1 } },
            hide: { type: "slide", duration: 300, from: { top: 0, opacity: 1 }, to: { top: "30%", opacity: 0 } }
        };

        var defaultConfig = {
            show: { type: "fade", duration: 400, from: 0, to: 1 },
            hide: { type: "fade", duration: 400, from: 1, to: 0 }
        };

        return this.option("fullScreen") ? fullScreenConfig : defaultConfig;
    },

    _init: function() {
        this.callBase();

        this.$element().addClass(POPUP_CLASS);
        this._wrapper().addClass(POPUP_WRAPPER_CLASS);
        this._$popupContent = this._$content
            .wrapInner($("<div>").addClass(POPUP_CONTENT_CLASS))
            .children().eq(0);
    },

    _render: function() {
        var isFullscreen = this.option("fullScreen");

        this._toggleFullScreenClass(isFullscreen);
        this.callBase();
    },

    _toggleFullScreenClass: function(value) {
        this._$content
            .toggleClass(POPUP_FULL_SCREEN_CLASS, value)
            .toggleClass(POPUP_NORMAL_CLASS, !value);
    },

    _initTemplates: function() {
        this.callBase();

        this._defaultTemplates["title"] = new EmptyTemplate(this);
        this._defaultTemplates["bottom"] = new EmptyTemplate(this);
    },

    _renderContentImpl: function() {
        this._renderTitle();
        this.callBase();
        this._renderBottom();
    },

    _renderTitle: function() {
        var items = this._getToolbarItems("top");
        var titleText = this.option("title");
        var showTitle = this.option("showTitle");

        if(showTitle && !!titleText) {
            items.unshift({
                location: devices.current().ios ? "center" : "before",
                text: titleText
            });
        }

        if(showTitle || items.length > 0) {
            this._$title && this._$title.remove();
            var $title = $("<div>").addClass(POPUP_TITLE_CLASS).insertBefore(this.$content());
            this._$title = this._renderTemplateByType("titleTemplate", items, $title).addClass(POPUP_TITLE_CLASS);
            this._renderDrag();
            this._executeTitleRenderAction(this._$title);
        } else if(this._$title) {
            this._$title.detach();
        }
    },

    _renderTemplateByType: function(optionName, data, $container, additionalToolbarOptions) {
        var template = this._getTemplateByOption(optionName);
        var toolbarTemplate = template instanceof EmptyTemplate;

        if(toolbarTemplate) {
            var toolbarOptions = extend(additionalToolbarOptions, {
                items: data,
                rtlEnabled: this.option("rtlEnabled"),
                useDefaultButtons: this.option("useDefaultToolbarButtons"),
                useFlatButtons: this.option("useFlatToolbarButtons")
            });

            this._getTemplate("dx-polymorph-widget").render({
                container: $container,
                model: {
                    widget: "dxToolbarBase",
                    options: toolbarOptions
                }
            });
            var $toolbar = $container.children("div");
            $container.replaceWith($toolbar);
            return $toolbar;
        } else {
            var $result = $(template.render({ container: getPublicElement($container) }));
            if($result.hasClass(TEMPLATE_WRAPPER_CLASS)) {
                $container.replaceWith($result);
                $container = $result;
            }
            return $container;
        }
    },

    _executeTitleRenderAction: function($titleElement) {
        this._getTitleRenderAction()({
            titleElement: getPublicElement($titleElement)
        });
    },

    _getTitleRenderAction: function() {
        return this._titleRenderAction || this._createTitleRenderAction();
    },

    _createTitleRenderAction: function() {
        return (this._titleRenderAction = this._createActionByOption("onTitleRendered", {
            element: this.element(),
            excludeValidators: ["disabled", "readOnly"]
        }));
    },

    _getCloseButton: function() {
        return {
            toolbar: "top",
            location: "after",
            template: this._getCloseButtonRenderer()
        };
    },

    _getCloseButtonRenderer: function() {
        return (function(_, __, container) {
            var $button = $("<div>").addClass(POPUP_TITLE_CLOSEBUTTON_CLASS);
            this._createComponent($button, Button, {
                icon: 'close',
                onClick: this._createToolbarItemAction(undefined),
                integrationOptions: {}
            });
            $(container).append($button);
        }).bind(this);
    },

    _getToolbarItems: function(toolbar) {
        var toolbarItems = this.option("toolbarItems");

        var toolbarsItems = [];

        this._toolbarItemClasses = [];

        var currentPlatform = devices.current().platform;
        var index = 0;

        each(toolbarItems, (function(_, data) {
            var isShortcut = isDefined(data.shortcut);
            var item = isShortcut ? getButtonPlace(data.shortcut) : data;

            if(isShortcut && currentPlatform === "ios" && index < 2) {
                item.toolbar = "top";
                index++;
            }

            item.toolbar = data.toolbar || item.toolbar || "top";

            if(item && item.toolbar === toolbar) {
                if(isShortcut) {
                    extend(item, { location: data.location }, this._getToolbarItemByAlias(data));
                }

                var isLTROrder = currentPlatform === "win" || currentPlatform === "generic";

                if((data.shortcut === "done" && isLTROrder) || (data.shortcut === "cancel" && !isLTROrder)) {
                    toolbarsItems.unshift(item);
                } else {
                    toolbarsItems.push(item);
                }
            }
        }).bind(this));

        if(toolbar === "top" && this.option("showCloseButton") && this.option("showTitle")) {
            toolbarsItems.push(this._getCloseButton());
        }

        return toolbarsItems;
    },

    _getLocalizationKey(itemType) {
        return itemType.toLowerCase() === "done" ? "OK" : camelize(itemType, true);
    },

    _getToolbarItemByAlias: function(data) {
        var that = this;
        var itemType = data.shortcut;

        if(inArray(itemType, ALLOWED_TOOLBAR_ITEM_ALIASES) < 0) {
            return false;
        }

        var itemConfig = extend({
            text: messageLocalization.format(this._getLocalizationKey(itemType)),
            onClick: this._createToolbarItemAction(data.onClick),
            integrationOptions: {},
            type: that.option("useDefaultToolbarButtons") ? BUTTON_DEFAULT_TYPE : BUTTON_NORMAL_TYPE,
            stylingMode: that.option("useFlatToolbarButtons") ? BUTTON_TEXT_MODE : BUTTON_CONTAINED_MODE
        }, data.options || {});

        var itemClass = POPUP_CLASS + "-" + itemType;

        this._toolbarItemClasses.push(itemClass);

        return {
            template: function(_, __, container) {
                var $toolbarItem = $("<div>").addClass(itemClass).appendTo(container);
                that._createComponent($toolbarItem, Button, itemConfig);
            }
        };
    },

    _createToolbarItemAction: function(clickAction) {
        return this._createAction(clickAction, {
            afterExecute: function(e) {
                e.component.hide();
            }
        });
    },

    _renderBottom: function() {
        var items = this._getToolbarItems("bottom");

        if(items.length) {
            this._$bottom && this._$bottom.remove();
            var $bottom = $("<div>").addClass(POPUP_BOTTOM_CLASS).insertAfter(this.$content());
            this._$bottom = this._renderTemplateByType("bottomTemplate", items, $bottom, { compactMode: true }).addClass(POPUP_BOTTOM_CLASS);
            this._toggleClasses();
        } else {
            this._$bottom && this._$bottom.detach();
        }
    },

    _toggleClasses: function() {
        var aliases = ALLOWED_TOOLBAR_ITEM_ALIASES;

        each(aliases, (function(_, alias) {
            var className = POPUP_CLASS + "-" + alias;

            if(inArray(className, this._toolbarItemClasses) >= 0) {
                this._wrapper().addClass(className + "-visible");
                this._$bottom.addClass(className);
            } else {
                this._wrapper().removeClass(className + "-visible");
                this._$bottom.removeClass(className);
            }
        }).bind(this));
    },

    _getDragTarget: function() {
        return this.topToolbar();
    },

    _renderGeometryImpl: function() {
        this._resetContentHeight();
        this.callBase.apply(this, arguments);
        this._setContentHeight();
    },

    _resetContentHeight: function() {
        this._$popupContent.css({
            "height": "auto"
        });
    },

    _renderDrag: function() {
        this.callBase();

        this._$content.toggleClass(POPUP_DRAGGABLE_CLASS, this.option("dragEnabled"));
    },

    _renderResize: function() {
        this.callBase();

        this._resizable.option("onResize", (function() {
            this._setContentHeight();

            this._actions.onResize(arguments);
        }).bind(this));
    },

    _setContentHeight: function() {
        (this.option("forceApplyBindings") || noop)();

        var popupHeightParts = this._splitPopupHeight();

        var toolbarsAndVerticalOffsetsHeight = popupHeightParts.header
            + popupHeightParts.footer
            + popupHeightParts.contentVerticalOffsets
            + popupHeightParts.popupVerticalOffsets;

        var overlayContent = this.overlayContent().get(0);
        var cssStyles = {};

        if(this.option("autoResizeEnabled") && this._isAutoHeight() && !isIE11) {
            var container = $(this._getContainer()).get(0);
            var contentMaxHeight = this._getOptionValue("maxHeight", overlayContent);
            var contentMinHeight = this._getOptionValue("minHeight", overlayContent);
            var maxHeightValue = sizeUtils.addOffsetToMaxHeight(contentMaxHeight, -toolbarsAndVerticalOffsetsHeight, container);
            var minHeightValue = sizeUtils.addOffsetToMinHeight(contentMinHeight, -toolbarsAndVerticalOffsetsHeight, container);

            cssStyles = extend(cssStyles, {
                minHeight: minHeightValue,
                maxHeight: maxHeightValue
            });
        } else {
            var contentHeight = overlayContent.getBoundingClientRect().height - toolbarsAndVerticalOffsetsHeight;
            cssStyles = { height: Math.max(0, contentHeight) };
        }

        this.$content().css(cssStyles);
    },

    _isAutoHeight: function() {
        return this.overlayContent().get(0).style.height === "auto";
    },

    _splitPopupHeight: function() {
        var topToolbar = this.topToolbar();
        var bottomToolbar = this.bottomToolbar();

        return {
            header: sizeUtils.getVisibleHeight(topToolbar && topToolbar.get(0)),
            footer: sizeUtils.getVisibleHeight(bottomToolbar && bottomToolbar.get(0)),
            contentVerticalOffsets: sizeUtils.getVerticalOffsets(this.overlayContent().get(0), true),
            popupVerticalOffsets: sizeUtils.getVerticalOffsets(this.$content().get(0), true)
        };
    },

    _renderDimensions: function() {
        if(this.option("fullScreen")) {
            this._$content.css({
                width: "100%",
                height: "100%"
            });
        } else {
            this.callBase.apply(this, arguments);
        }
        if(windowUtils.hasWindow()) {
            this._renderFullscreenWidthClass();
        }
    },

    _renderFullscreenWidthClass: function() {
        this.overlayContent().toggleClass(POPUP_FULL_SCREEN_WIDTH_CLASS, this.overlayContent().outerWidth() === $(window).width());
    },

    _renderShadingDimensions: function() {
        if(this.option("fullScreen")) {
            this._wrapper().css({
                width: "100%",
                height: "100%"
            });
        } else {
            this.callBase.apply(this, arguments);
        }
    },

    refreshPosition: function() {
        this._renderPosition();
    },

    _renderPosition: function() {
        if(this.option("fullScreen")) {
            translator.move(this._$content, {
                top: 0,
                left: 0
            });
        } else {
            (this.option("forceApplyBindings") || noop)();

            return this.callBase.apply(this, arguments);
        }
    },

    _optionChanged: function(args) {
        switch(args.name) {
            case "showTitle":
            case "title":
            case "titleTemplate":
                this._renderTitle();
                this._renderGeometry();
                break;
            case "bottomTemplate":
                this._renderBottom();
                this._renderGeometry();
                break;
            case "onTitleRendered":
                this._createTitleRenderAction(args.value);
                break;
            case "toolbarItems":
            case "useDefaultToolbarButtons":
            case "useFlatToolbarButtons":
                var isPartialUpdate = args.fullName.search(".options") !== -1;
                this._renderTitle();
                this._renderBottom();

                if(!isPartialUpdate) {
                    this._renderGeometry();
                }
                break;
            case "dragEnabled":
                this._renderDrag();
                break;
            case "autoResizeEnabled":
                this._renderGeometry();
                domUtils.triggerResizeEvent(this._$content);
                break;
            case "fullScreen":
                this._toggleFullScreenClass(args.value);
                this._renderGeometry();
                domUtils.triggerResizeEvent(this._$content);
                break;
            case "showCloseButton":
                this._renderTitle();
                break;
            default:
                this.callBase(args);
        }
    },

    bottomToolbar: function() {
        return this._$bottom;
    },

    topToolbar: function() {
        return this._$title;
    },

    $content: function() {
        return this._$popupContent;
    },

    content: function() {
        return getPublicElement(this._$popupContent);
    },

    overlayContent: function() {
        return this._$content;
    }
});

registerComponent("dxPopup", Popup);

module.exports = Popup;
