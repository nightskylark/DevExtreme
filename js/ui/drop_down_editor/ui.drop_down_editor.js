var $ = require("../../core/renderer");
import AsyncTemplateMixin from "../shared/async_template_mixin";
import eventsEngine from "../../events/core/events_engine";
import Guid from "../../core/guid";
import registerComponent from "../../core/component_registrator";
import commonUtils from "../../core/utils/common";
import domUtils from "../../core/utils/dom";
import selectorsModule from "../widget/selectors";
var focused = selectorsModule.focused;
import iteratorUtils from "../../core/utils/iterator";
var each = iteratorUtils.each;
import typeUtils from "../../core/utils/type";
var isDefined = typeUtils.isDefined;
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
var getPublicElement = domUtils.getPublicElement;
import errors from "../widget/ui.errors";
import positionUtils from "../../animation/position";
import position from "../../core/utils/position";
var getDefaultAlignment = position.getDefaultAlignment;
import DropDownButton from "./ui.drop_down_button";
import messageLocalization from "../../localization/message";
import eventUtils from "../../events/utils";
import TextBox from "../text_box";
import clickEvent from "../../events/click";
import FunctionTemplate from "../widget/function_template";
import Popup from "../popup";
var DROP_DOWN_EDITOR_CLASS = "dx-dropdowneditor";
var DROP_DOWN_EDITOR_INPUT_WRAPPER_CLASS = "dx-dropdowneditor-input-wrapper";
var DROP_DOWN_EDITOR_BUTTON_ICON = "dx-dropdowneditor-icon";
var DROP_DOWN_EDITOR_OVERLAY = "dx-dropdowneditor-overlay";
var DROP_DOWN_EDITOR_OVERLAY_FLIPPED = "dx-dropdowneditor-overlay-flipped";
var DROP_DOWN_EDITOR_ACTIVE = "dx-dropdowneditor-active";
var DROP_DOWN_EDITOR_FIELD_CLICKABLE = "dx-dropdowneditor-field-clickable";

/**
* @name dxDropDownEditor
* @inherits dxTextBox
* @module ui/drop_down_editor/ui.drop_down_editor
* @export default
* @hidden
*/
var DropDownEditor = TextBox.inherit({

    _supportedKeys: function() {
        var homeEndHandler = function(e) {
            if(this.option("opened")) {
                e.preventDefault();
                return true;
            }
            return false;
        };

        return extend({}, this.callBase(), {
            tab: function(e) {
                if(!this.option("opened")) {
                    return;
                }

                if(this.option("applyValueMode") === "instantly") {
                    this.close();
                    return;
                }

                var $focusableElement = e.shiftKey
                    ? this._getLastPopupElement()
                    : this._getFirstPopupElement();

                $focusableElement && eventsEngine.trigger($focusableElement, "focus");
                e.preventDefault();
            },
            escape: function(e) {
                if(this.option("opened")) {
                    e.preventDefault();
                }
                this.close();
            },
            upArrow: function(e) {
                e.preventDefault();
                e.stopPropagation();
                if(e.altKey) {
                    this.close();
                    return false;
                }
                return true;
            },
            downArrow: function(e) {
                e.preventDefault();
                e.stopPropagation();
                if(e.altKey) {
                    this._validatedOpening();
                    return false;
                }
                return true;
            },
            enter: function(e) {
                if(this.option("opened")) {
                    e.preventDefault();
                    this._valueChangeEventHandler(e);
                }
                return true;
            },
            home: homeEndHandler,
            end: homeEndHandler
        });
    },

    _getDefaultButtons: function() {
        return this.callBase().concat([{ name: "dropDown", Ctor: DropDownButton }]);
    },

    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            /**
            * @name dxDropDownEditorOptions.value
            * @type any
            * @default null
            */
            value: null,

            /**
            * @name dxDropDownEditorOptions.onOpened
            * @extends Action
            * @action
            */
            onOpened: null,

            /**
            * @name dxDropDownEditorOptions.onClosed
            * @extends Action
            * @action
            */
            onClosed: null,

            /**
            * @name dxDropDownEditorOptions.opened
            * @type boolean
            * @default false
            * @fires dxDropDownEditorOptions.onOpened
            * @fires dxDropDownEditorOptions.onClosed
            */
            opened: false,

            /**
            * @name dxDropDownEditorOptions.acceptCustomValue
            * @type boolean
            * @default true
            */
            acceptCustomValue: true,

            /**
            * @name dxDropDownEditorOptions.applyValueMode
            * @type Enums.EditorApplyValueMode
            * @default "instantly"
            */
            applyValueMode: "instantly",

            /**
            * @name dxDropDownEditorOptions.deferRendering
            * @type boolean
            * @default true
            */
            deferRendering: true,

            /**
            * @name dxDropDownEditorOptions.activeStateEnabled
            * @type boolean
            * @default true
            * @inheritdoc
            */
            activeStateEnabled: true,

            /**
             * @name dxDropDownEditorOptions.dropDownButtonTemplate
             * @type template|function
             * @default "dropDownButton"
             * @type_function_param1 buttonData:object
             * @type_function_param1_field1 text:string
             * @type_function_param1_field2 icon:string
             * @type_function_param2 contentElement:dxElement
             * @type_function_return string|Node|jQuery
             */
            dropDownButtonTemplate: 'dropDownButton',

            fieldTemplate: null,
            contentTemplate: null,

            /**
             * @name dxDropDownEditorOptions.openOnFieldClick
             * @type boolean
             * @default false
             */
            openOnFieldClick: false,

            /**
             * @name dxDropDownEditorOptions.showDropDownButton
             * @type boolean
             * @default true
             */
            showDropDownButton: true,

            dropDownOptions: {},
            popupPosition: this._getDefaultPopupPosition(),
            onPopupInitialized: null,
            applyButtonText: messageLocalization.format("OK"),
            cancelButtonText: messageLocalization.format("Cancel"),
            buttonsLocation: "default",
            showPopupTitle: false

            /**
            * @name dxDropDownEditorOptions.mask
            * @hidden
            * @inheritdoc
            */

            /**
            * @name dxDropDownEditorOptions.maskChar
            * @hidden
            * @inheritdoc
            */

            /**
            * @name dxDropDownEditorOptions.maskRules
            * @hidden
            * @inheritdoc
            */

            /**
            * @name dxDropDownEditorOptions.maskInvalidMessage
            * @hidden
            * @inheritdoc
            */

            /**
            * @name dxDropDownEditorOptions.useMaskedValue
            * @hidden
            * @inheritdoc
            */

            /**
            * @name dxDropDownEditorOptions.mode
            * @hidden
            * @inheritdoc
            */

            /**
             * @name dxDropDownEditorOptions.showMaskMode
             * @hidden
             * @inheritdoc
             */
        });
    },

    _getDefaultPopupPosition: function() {
        var position = getDefaultAlignment(this.option("rtlEnabled"));

        return {
            offset: { h: 0, v: -1 },
            my: position + " top",
            at: position + " bottom",
            collision: "flip flip"
        };
    },

    _defaultOptionsRules: function() {
        return this.callBase().concat([
            {
                device: function(device) {
                    var isGeneric = device.platform === "generic";
                    var isWin10 = device.platform === "win" && device.version && device.version[0] === 10;
                    return isGeneric || isWin10;
                },
                options: {
                    popupPosition: { offset: { v: 0 } }
                }
            }
        ]);
    },

    _inputWrapper: function() {
        return this.$element().find("." + DROP_DOWN_EDITOR_INPUT_WRAPPER_CLASS);
    },

    _init: function() {
        this.callBase();
        this._initVisibilityActions();
        this._initPopupInitializedAction();
        this._initInnerOptionCache("dropDownOptions");
    },

    _initVisibilityActions: function() {
        this._openAction = this._createActionByOption("onOpened", {
            excludeValidators: ["disabled", "readOnly"]
        });

        this._closeAction = this._createActionByOption("onClosed", {
            excludeValidators: ["disabled", "readOnly"]
        });
    },

    _initPopupInitializedAction: function() {
        this._popupInitializedAction = this._createActionByOption("onPopupInitialized", {
            excludeValidators: ["disabled", "readOnly"]
        });
    },

    _initMarkup: function() {
        this.callBase();
        this.$element()
            .addClass(DROP_DOWN_EDITOR_CLASS);

        this.setAria("role", "combobox");
    },

    _render: function() {
        this.callBase();

        this._renderOpenHandler();
        this._renderOpenedState();
    },

    _renderContentImpl: function() {
        if(!this.option("deferRendering")) {
            this._createPopup();
        }
    },

    _renderInput: function() {
        this.callBase();

        this.$element().wrapInner($("<div>").addClass(DROP_DOWN_EDITOR_INPUT_WRAPPER_CLASS));
        this._$container = this.$element().children().eq(0);

        this.setAria({
            "haspopup": "true",
            "autocomplete": "list"
        });
    },

    _readOnlyPropValue: function() {
        return !this.option("acceptCustomValue") || this.callBase();
    },

    _cleanFocusState: function() {
        this.callBase();

        if(this.option("fieldTemplate")) {
            eventsEngine.off(this._input(), "focusin focusout beforeactivate");
        }
    },

    _getFieldTemplate: function() {
        return this.option("fieldTemplate") && this._getTemplateByOption("fieldTemplate");
    },

    _renderField: function() {
        const fieldTemplate = this._getFieldTemplate();

        fieldTemplate && this._renderTemplatedField(fieldTemplate, this._fieldRenderData());
    },

    _renderPlaceholder: function() {
        const hasFieldTemplate = !!this._getFieldTemplate();

        if(!hasFieldTemplate) {
            this.callBase();
        }
    },

    _renderValue: function() {
        const promise = this.callBase();

        promise.always(this._renderField.bind(this));
    },

    _renderTemplatedField: function(fieldTemplate, data) {
        var isFocused = focused(this._input());
        var $container = this._$container;

        this._disposeKeyboardProcessor();

        // NOTE: to prevent buttons disposition
        this.$beforeButtonsContainer && this.$beforeButtonsContainer[0].parentNode.removeChild(this.$beforeButtonsContainer[0]);
        this.$afterButtonsContainer && this.$afterButtonsContainer[0].parentNode.removeChild(this.$afterButtonsContainer[0]);

        $container.empty();

        fieldTemplate.render({
            model: data,
            container: domUtils.getPublicElement($container),
            onRendered: () => {
                if(!this._input().length) {
                    throw errors.Error("E1010");
                }

                this._refreshEvents();
                this._refreshValueChangeEvent();
                this._renderFocusState();

                isFocused && eventsEngine.trigger(this._input(), "focus");
            }
        });

        $container.prepend(this.$beforeButtonsContainer);
        $container.append(this.$afterButtonsContainer);
    },

    _fieldRenderData: function() {
        return this.option("value");
    },

    _initTemplates: function() {
        this.callBase();

        this._defaultTemplates['dropDownButton'] = new FunctionTemplate(function(options) {
            var $icon = $("<div>").addClass(DROP_DOWN_EDITOR_BUTTON_ICON);
            $(options.container).append($icon);
        }, this);
    },

    _renderOpenHandler: function() {
        var that = this;
        var $inputWrapper = that._inputWrapper();
        var eventName = eventUtils.addNamespace(clickEvent.name, that.NAME);
        var openOnFieldClick = that.option("openOnFieldClick");

        eventsEngine.off($inputWrapper, eventName);
        eventsEngine.on($inputWrapper, eventName, that._getInputClickHandler(openOnFieldClick));
        that.$element().toggleClass(DROP_DOWN_EDITOR_FIELD_CLICKABLE, openOnFieldClick);

        if(openOnFieldClick) {
            that._openOnFieldClickAction = that._createAction(that._openHandler.bind(that));
        }
    },

    _getInputClickHandler: function(openOnFieldClick) {
        var that = this;

        return openOnFieldClick ?
            function(e) { that._executeOpenAction(e); } :
            function(e) { that._focusInput(); };
    },

    _openHandler: function() {
        this._toggleOpenState();
    },

    _executeOpenAction: function(e) {
        this._openOnFieldClickAction({ event: e });
    },

    _keyboardEventBindingTarget: function() {
        return this._input();
    },

    _focusInput: function() {
        if(this.option("disabled")) {
            return false;
        }

        if(this.option("focusStateEnabled") && !focused(this._input())) {
            eventsEngine.trigger(this._input(), "focus");
        }

        return true;
    },

    _toggleOpenState: function(isVisible) {
        if(!this._focusInput()) {
            return;
        }

        if(!this.option("readOnly")) {
            isVisible = arguments.length ? isVisible : !this.option("opened");
            this.option("opened", isVisible);
        }
    },

    _renderOpenedState: function() {
        var opened = this.option("opened");
        if(opened) {
            this._createPopup();
        }

        this.$element().toggleClass(DROP_DOWN_EDITOR_ACTIVE, opened);
        this._setPopupOption("visible", opened);

        this.setAria({
            "expanded": opened,
            "owns": (opened || undefined) && this._popupContentId
        });
    },

    _createPopup: function() {
        if(this._$popup) {
            return;
        }

        this._$popup = $("<div>").addClass(DROP_DOWN_EDITOR_OVERLAY)
            .addClass(this.option("customOverlayCssClass"))
            .appendTo(this.$element());

        this._renderPopup();
        this._renderPopupContent();
    },

    _renderPopup: function() {
        this._popup = this._createComponent(this._$popup, Popup, extend(this._popupConfig(), this._getInnerOptionsCache("dropDownOptions")));

        this._popup.on({
            "showing": this._popupShowingHandler.bind(this),
            "shown": this._popupShownHandler.bind(this),
            "hiding": this._popupHidingHandler.bind(this),
            "hidden": this._popupHiddenHandler.bind(this)
        });

        this._popup.option("onContentReady", this._contentReadyHandler.bind(this));
        this._contentReadyHandler();

        this._popupContentId = "dx-" + new Guid();
        this.setAria("id", this._popupContentId, this._popup.$content());

        this._bindInnerWidgetOptions(this._popup, "dropDownOptions");
    },

    _contentReadyHandler: commonUtils.noop,

    _popupConfig: function() {

        return {
            onInitialized: this._popupInitializedHandler(),
            position: extend(this.option("popupPosition"), {
                of: this.$element()
            }),
            showTitle: this.option("showPopupTitle"),
            width: "auto",
            height: "auto",
            shading: false,
            closeOnTargetScroll: true,
            closeOnOutsideClick: this._closeOutsideDropDownHandler.bind(this),
            animation: {
                show: { type: "fade", duration: 0, from: 0, to: 1 },
                hide: { type: "fade", duration: 400, from: 1, to: 0 }
            },
            deferRendering: false,
            focusStateEnabled: false,
            showCloseButton: false,
            toolbarItems: this._getPopupToolbarItems(),
            onPositioned: this._popupPositionedHandler.bind(this),
            fullScreen: false
        };
    },

    _popupInitializedHandler: function() {
        if(!this.option("onPopupInitialized")) {
            return;
        }

        return (function(e) {
            this._popupInitializedAction({ popup: e.component });
        }).bind(this);
    },

    _popupPositionedHandler: function(e) {
        e.position && this._popup.overlayContent().toggleClass(DROP_DOWN_EDITOR_OVERLAY_FLIPPED, e.position.v.flip);
    },

    _popupShowingHandler: commonUtils.noop,

    _popupHidingHandler: function() {
        this.option("opened", false);
    },

    _popupShownHandler: function() {
        this._openAction();

        if(this._$validationMessage) {
            this._$validationMessage.dxOverlay("option", "position", this._getValidationMessagePosition());
        }
    },

    _popupHiddenHandler: function() {
        this._closeAction();
        if(this._$validationMessage) {
            this._$validationMessage.dxOverlay("option", "position", this._getValidationMessagePosition());
        }
    },

    _getValidationMessagePosition: function() {
        var positionRequest = "below";

        if(this._popup && this._popup.option("visible")) {
            var myTop = positionUtils.setup(this.$element()).top;
            var popupTop = positionUtils.setup(this._popup.$content()).top;

            positionRequest = (myTop + this.option("popupPosition").offset.v) > popupTop ? "below" : "above";
        }

        return this.callBase(positionRequest);
    },

    _renderPopupContent: function() {
        var contentTemplate = this._getTemplateByOption("contentTemplate");

        if(!(contentTemplate && this.option("contentTemplate"))) {
            return;
        }

        var $popupContent = this._popup.$content();

        var templateData = {
            value: this._fieldRenderData(),
            component: this
        };

        $popupContent.empty();

        contentTemplate.render({
            container: domUtils.getPublicElement($popupContent),
            model: templateData
        });
    },

    _closeOutsideDropDownHandler: function({ target }) {
        var $target = $(target);
        var dropDownButton = this.getButton("dropDown");
        var $dropDownButton = dropDownButton && dropDownButton.$element();
        var isInputClicked = !!$target.closest(this.$element()).length;
        var isDropDownButtonClicked = !!$target.closest($dropDownButton).length;
        var isOutsideClick = !isInputClicked && !isDropDownButtonClicked;

        return isOutsideClick;
    },

    _clean: function() {
        delete this._openOnFieldClickAction;

        if(this._$popup) {
            this._$popup.remove();
            delete this._$popup;
            delete this._popup;
        }
        this.callBase();
    },

    _setPopupOption: function(optionName, value) {
        this._setWidgetOption("_popup", arguments);
    },

    _validatedOpening: function() {
        if(!this.option("readOnly")) {
            this._toggleOpenState(true);
        }
    },

    _getPopupToolbarItems: function() {
        return this.option("applyValueMode") === "useButtons"
            ? this._popupToolbarItemsConfig()
            : [];
    },

    _getFirstPopupElement: function() {
        return this._popup._wrapper().find(".dx-popup-done.dx-button");
    },

    _getLastPopupElement: function() {
        return this._popup._wrapper().find(".dx-popup-cancel.dx-button");
    },

    _popupElementTabHandler: function(e) {
        var $element = $(e.currentTarget);

        if((e.shiftKey && $element.is(this._getFirstPopupElement()))
            || (!e.shiftKey && $element.is(this._getLastPopupElement()))) {

            eventsEngine.trigger(this._input(), "focus");
            e.preventDefault();
        }
    },

    _popupElementEscHandler: function() {
        eventsEngine.trigger(this._input(), "focus");
        this.close();
    },

    _popupButtonInitializedHandler: function(e) {
        e.component.registerKeyHandler("tab", this._popupElementTabHandler.bind(this));
        e.component.registerKeyHandler("escape", this._popupElementEscHandler.bind(this));
    },

    _popupToolbarItemsConfig: function() {
        var buttonsConfig = [
            {
                shortcut: "done",
                options: {
                    onClick: this._applyButtonHandler.bind(this),
                    text: this.option("applyButtonText"),
                    onInitialized: this._popupButtonInitializedHandler.bind(this)
                }
            },
            {
                shortcut: "cancel",
                options: {
                    onClick: this._cancelButtonHandler.bind(this),
                    text: this.option("cancelButtonText"),
                    onInitialized: this._popupButtonInitializedHandler.bind(this)
                }
            }
        ];

        return this._applyButtonsLocation(buttonsConfig);
    },

    _applyButtonsLocation: function(buttonsConfig) {
        var buttonsLocation = this.option("buttonsLocation");
        var resultConfig = buttonsConfig;

        if(buttonsLocation !== "default") {
            var position = commonUtils.splitPair(buttonsLocation);

            each(resultConfig, function(_, element) {
                extend(element, {
                    toolbar: position[0],
                    location: position[1]
                });
            });
        }

        return resultConfig;
    },

    _applyButtonHandler: function() {
        this.close();
        this.option("focusStateEnabled") && this.focus();
    },

    _cancelButtonHandler: function() {
        this.close();
        this.option("focusStateEnabled") && this.focus();
    },

    _updatePopupWidth: commonUtils.noop,

    _popupOptionChanged: function(args) {
        var options = this._getOptionsFromContainer(args);

        this._setPopupOption(options);

        if(Object.keys(options).indexOf("width") !== -1 && options["width"] === undefined) {
            this._updatePopupWidth();
        }
    },

    _optionChanged: function(args) {
        switch(args.name) {
            case "opened":
                this._renderOpenedState();
                break;
            case "onOpened":
            case "onClosed":
                this._initVisibilityActions();
                break;
            case "onPopupInitialized":
                this._initPopupInitializedAction();
                break;
            case "fieldTemplate":
                if(isDefined(args.value)) {
                    this._renderField();
                } else {
                    this._invalidate();
                }
                break;
            case "contentTemplate":
            case "acceptCustomValue":
            case "openOnFieldClick":
                this._invalidate();
                break;
            case "dropDownButtonTemplate":
            case "showDropDownButton":
                this._updateButtons(["dropDown"]);
                break;
            case "dropDownOptions":
                this._popupOptionChanged(args);
                this._cacheInnerOptions("dropDownOptions", args.value);
                break;
            case "popupPosition":
            case "deferRendering":
                break;
            case "applyValueMode":
            case "applyButtonText":
            case "cancelButtonText":
            case "buttonsLocation":
                this._setPopupOption("toolbarItems", this._getPopupToolbarItems());
                break;
            case "showPopupTitle":
                this._setPopupOption("showTitle", args.value);
                break;
            default:
                this.callBase(args);
        }
    },

    /**
    * @name dxDropDownEditorMethods.open
    * @publicName open()
    */
    open: function() {
        this.option("opened", true);
    },

    /**
    * @name dxDropDownEditorMethods.close
    * @publicName close()
    */
    close: function() {
        this.option("opened", false);
    },

    /**
    * @name dxDropDownEditorMethods.reset
    * @publicName reset()
    */

    /**
    * @name dxDropDownEditorMethods.field
    * @publicName field()
    * @return dxElement
    */
    field: function() {
        return getPublicElement(this._input());
    },

    /**
    * @name dxDropDownEditorMethods.content
    * @publicName content()
    * @return dxElement
    */
    content: function() {
        return this._popup ? this._popup.content() : null;
    }
}).include(AsyncTemplateMixin);

registerComponent("dxDropDownEditor", DropDownEditor);

module.exports = DropDownEditor;
