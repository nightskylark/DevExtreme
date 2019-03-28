var $ = require("../../core/renderer");
var eventsEngine = require("../../events/core/events_engine");
var Guid = require("../../core/guid");
import FormItemsRunTimeInfo from "./ui.form.items_runtime_info";
var registerComponent = require("../../core/component_registrator");
var typeUtils = require("../../core/utils/type");
var domUtils = require("../../core/utils/dom");
import variableWrapperUtils from "../../core/utils/variable_wrapper";
var isWrapped = variableWrapperUtils.isWrapped;
var isWritableWrapped = variableWrapperUtils.isWritableWrapped;
var unwrap = variableWrapperUtils.unwrap;
var windowUtils = require("../../core/utils/window");
var stringUtils = require("../../core/utils/string");
import iteratorUtils from "../../core/utils/iterator";
var each = iteratorUtils.each;
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
import arrayUtils from "../../core/utils/array";
var inArray = arrayUtils.inArray;
var dataUtils = require("../../core/utils/data");
var removeEvent = require("../../core/remove_event");
var clickEvent = require("../../events/click");
var normalizeIndexes = arrayUtils.normalizeIndexes;
var errors = require("../widget/ui.errors");
var messageLocalization = require("../../localization/message");
var styleUtils = require("../../core/utils/style");
var inflector = require("../../core/utils/inflector");
var Widget = require("../widget/ui.widget");
var Validator = require("../validator");
var ResponsiveBox = require("../responsive_box");
var themes = require("../themes");

require("../text_box");
require("../number_box");
require("../check_box");
require("../date_box");
require("../button");

var FORM_EDITOR_BY_DEFAULT = "dxTextBox";
var FIELD_ITEM_CLASS = "dx-field-item";
var FIELD_EMPTY_ITEM_CLASS = "dx-field-empty-item";
var FIELD_BUTTON_ITEM_CLASS = "dx-field-button-item";
var FIELD_ITEM_REQUIRED_CLASS = "dx-field-item-required";
var FIELD_ITEM_OPTIONAL_CLASS = "dx-field-item-optional";
var FIELD_ITEM_REQUIRED_MARK_CLASS = "dx-field-item-required-mark";
var FIELD_ITEM_OPTIONAL_MARK_CLASS = "dx-field-item-optional-mark";
var FIELD_ITEM_LABEL_CLASS = "dx-field-item-label";
var FIELD_ITEM_LABEL_ALIGN_CLASS = "dx-field-item-label-align";
var FIELD_ITEM_LABEL_CONTENT_CLASS = "dx-field-item-label-content";
var FIELD_ITEM_LABEL_TEXT_CLASS = "dx-field-item-label-text";
var FIELD_ITEM_LABEL_LOCATION_CLASS = "dx-field-item-label-location-";
var FIELD_ITEM_CONTENT_CLASS = "dx-field-item-content";
var FIELD_ITEM_CONTENT_LOCATION_CLASS = "dx-field-item-content-location-";
var FIELD_ITEM_CONTENT_WRAPPER_CLASS = "dx-field-item-content-wrapper";
var FIELD_ITEM_HELP_TEXT_CLASS = "dx-field-item-help-text";
var SINGLE_COLUMN_ITEM_CONTENT = "dx-single-column-item-content";
var LABEL_HORIZONTAL_ALIGNMENT_CLASS = "dx-label-h-align";
var LABEL_VERTICAL_ALIGNMENT_CLASS = "dx-label-v-align";
var FORM_LAYOUT_MANAGER_CLASS = "dx-layout-manager";
var LAYOUT_MANAGER_FIRST_ROW_CLASS = "dx-first-row";
var LAYOUT_MANAGER_FIRST_COL_CLASS = "dx-first-col";
var LAYOUT_MANAGER_LAST_COL_CLASS = "dx-last-col";
var LAYOUT_MANAGER_ONE_COLUMN = "dx-layout-manager-one-col";
var FLEX_LAYOUT_CLASS = "dx-flex-layout";
var INVALID_CLASS = "dx-invalid";
var LAYOUT_STRATEGY_FLEX = "flex";
var LAYOUT_STRATEGY_FALLBACK = "fallback";
var SIMPLE_ITEM_TYPE = "simple";
var DATA_OPTIONS = ["dataSource", "items"];
var EDITORS_WITH_ARRAY_VALUE = ["dxTagBox", "dxRangeSlider"];

var LayoutManager = Widget.inherit({
    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            layoutData: {},
            readOnly: false,
            colCount: 1,
            colCountByScreen: undefined,
            labelLocation: "left",
            onFieldDataChanged: null,
            onEditorEnterKey: null,
            customizeItem: null,
            alignItemLabels: true,
            minColWidth: 200,
            showRequiredMark: true,
            screenByWidth: null,
            showOptionalMark: false,
            requiredMark: "*",
            optionalMark: messageLocalization.format("dxForm-optionalMark"),
            requiredMessage: messageLocalization.getFormatter("dxForm-requiredMessage")
        });
    },

    _setOptionsByReference: function() {
        this.callBase();

        extend(this._optionsByReference, {
            layoutData: true,
            validationGroup: true
        });
    },

    _init: function() {
        var layoutData = this.option("layoutData");

        this.callBase();
        this._itemWatchers = [];
        this._itemsRunTimeInfo = new FormItemsRunTimeInfo();
        this._updateReferencedOptions(layoutData);
        this._initDataAndItems(layoutData);
    },

    _dispose: function() {
        this.callBase();

        this._cleanItemWatchers();
    },

    _initDataAndItems: function(initialData) {
        this._syncDataWithItems();
        this._updateItems(initialData);
    },

    _syncDataWithItems: function() {
        var that = this;
        var userItems = that.option("items");

        if(typeUtils.isDefined(userItems)) {
            each(userItems, function(index, item) {
                var value;
                if(item.dataField && that._getDataByField(item.dataField) === undefined) {
                    if(item.editorOptions) {
                        value = item.editorOptions.value;
                    }

                    that._updateFieldValue(item.dataField, value);
                }
            });
        }
    },

    _getDataByField: function(dataField) {
        return dataField ? this.option("layoutData." + dataField) : null;
    },

    _updateFieldValue: function(dataField, value) {
        var layoutData = this.option("layoutData");
        var newValue = value;

        if(!isWrapped(layoutData[dataField]) && typeUtils.isDefined(dataField)) {
            this.option("layoutData." + dataField, newValue);
        } else if(isWritableWrapped(layoutData[dataField])) {
            newValue = typeUtils.isFunction(newValue) ? newValue() : newValue;

            layoutData[dataField](newValue);
        }

        this._triggerOnFieldDataChanged({ dataField: dataField, value: newValue });
    },

    _triggerOnFieldDataChanged: function(args) {
        this._createActionByOption("onFieldDataChanged")(args);
    },

    _updateItems: function(layoutData) {
        var that = this;
        var userItems = this.option("items");
        var isUserItemsExist = typeUtils.isDefined(userItems);
        var customizeItem = that.option("customizeItem");
        var items;
        var processedItems;

        items = isUserItemsExist ? userItems : this._generateItemsByData(layoutData);
        if(typeUtils.isDefined(items)) {
            processedItems = [];

            each(items, function(index, item) {
                if(that._isAcceptableItem(item)) {
                    item = that._processItem(item);

                    customizeItem && customizeItem(item);

                    if(typeUtils.isObject(item) && unwrap(item.visible) !== false) {
                        processedItems.push(item);
                    }
                }
            });

            if(!that._itemWatchers.length || !isUserItemsExist) {
                that._updateItemWatchers(items);
            }

            this._items = processedItems;

            this._sortItems();
        }
    },

    _cleanItemWatchers: function() {
        this._itemWatchers.forEach(function(dispose) {
            dispose();
        });
        this._itemWatchers = [];
    },

    _updateItemWatchers: function(items) {
        var that = this;
        var watch = that._getWatch();

        items.forEach(function(item) {
            if(typeUtils.isObject(item) && typeUtils.isDefined(item.visible) && typeUtils.isFunction(watch)) {

                that._itemWatchers.push(
                    watch(
                        function() {
                            return unwrap(item.visible);
                        },
                        function() {
                            that._updateItems(that.option("layoutData"));
                            that.repaint();
                        },
                        { skipImmediate: true }
                    ));
            }
        });
    },

    _generateItemsByData: function(layoutData) {
        var result = [];

        if(typeUtils.isDefined(layoutData)) {
            each(layoutData, function(dataField) {
                result.push({
                    dataField: dataField
                });
            });
        }

        return result;
    },

    _isAcceptableItem: function(item) {
        var itemField = item.dataField || item;
        var itemData = this._getDataByField(itemField);

        return !(typeUtils.isFunction(itemData) && !isWrapped(itemData));
    },

    _processItem: function(item) {
        if(typeof item === "string") {
            item = { dataField: item };
        }

        if(typeof item === "object" && !item.itemType) {
            item.itemType = SIMPLE_ITEM_TYPE;
        }

        if(!typeUtils.isDefined(item.editorType) && typeUtils.isDefined(item.dataField)) {
            var value = this._getDataByField(item.dataField);

            item.editorType = typeUtils.isDefined(value) ? this._getEditorTypeByDataType(typeUtils.type(value)) : FORM_EDITOR_BY_DEFAULT;
        }

        return item;
    },

    _getEditorTypeByDataType: function(dataType) {
        switch(dataType) {
            case "number":
                return "dxNumberBox";
            case "date":
                return "dxDateBox";
            case "boolean":
                return "dxCheckBox";
            default:
                return "dxTextBox";
        }
    },

    _sortItems: function() {
        normalizeIndexes(this._items, "visibleIndex");
        this._sortIndexes();
    },

    _sortIndexes: function() {
        this._items.sort(function(itemA, itemB) {
            var indexA = itemA.visibleIndex;
            var indexB = itemB.visibleIndex;
            var result;

            if(indexA > indexB) {
                result = 1;
            } else if(indexA < indexB) {
                result = -1;
            } else {
                result = 0;
            }

            return result;
        });
    },

    _initMarkup: function() {
        this._itemsRunTimeInfo.clear();
        this.$element().addClass(FORM_LAYOUT_MANAGER_CLASS);

        this.callBase();
        this._renderResponsiveBox();
    },

    _hasBrowserFlex: function() {
        return styleUtils.styleProp(LAYOUT_STRATEGY_FLEX) === LAYOUT_STRATEGY_FLEX;
    },

    _renderResponsiveBox: function() {
        var that = this;
        var templatesInfo = [];

        if(that._items && that._items.length) {
            var colCount = that._getColCount();
            var $container = $("<div>").appendTo(that.$element());
            var layoutItems;

            that._prepareItemsWithMerging(colCount);

            layoutItems = that._generateLayoutItems();
            that._extendItemsWithDefaultTemplateOptions(layoutItems, that._items);

            that._responsiveBox = that._createComponent($container, ResponsiveBox, that._getResponsiveBoxConfig(layoutItems, colCount, templatesInfo));
            if(!windowUtils.hasWindow()) {
                that._renderTemplates(templatesInfo);
            }
        }
    },

    _extendItemsWithDefaultTemplateOptions: function(targetItems, sourceItems) {
        sourceItems.forEach(function(item) {
            if(!item.merged) {
                if(typeUtils.isDefined(item.disabled)) {
                    targetItems[item.visibleIndex].disabled = item.disabled;
                }
                if(typeUtils.isDefined(item.visible)) {
                    targetItems[item.visibleIndex].visible = item.visible;
                }
            }
        });
    },

    _itemStateChangedHandler: function(e) {
        this._refresh();
    },

    _renderTemplate: function($container, item) {
        switch(item.itemType) {
            case "empty":
                this._renderEmptyItem($container);
                break;
            case "button":
                this._renderButtonItem(item, $container);
                break;
            default:
                this._renderFieldItem(item, $container);
        }
    },

    _renderTemplates: function(templatesInfo) {
        var that = this;
        each(templatesInfo, function(index, info) {
            that._renderTemplate(info.container, info.formItem);
        });
    },

    _getResponsiveBoxConfig: function(layoutItems, colCount, templatesInfo) {
        var that = this;
        var colCountByScreen = that.option("colCountByScreen");
        var xsColCount = colCountByScreen && colCountByScreen.xs;

        return {
            onItemStateChanged: this._itemStateChangedHandler.bind(this),
            _layoutStrategy: that._hasBrowserFlex() ? LAYOUT_STRATEGY_FLEX : LAYOUT_STRATEGY_FALLBACK,
            onLayoutChanged: function() {
                var onLayoutChanged = that.option("onLayoutChanged");
                var isSingleColumnMode = that.isSingleColumnMode();

                if(onLayoutChanged) {
                    that.$element().toggleClass(LAYOUT_MANAGER_ONE_COLUMN, isSingleColumnMode);
                    onLayoutChanged(isSingleColumnMode);
                }
            },
            onContentReady: function(e) {
                if(windowUtils.hasWindow()) {
                    that._renderTemplates(templatesInfo);
                }
                if(that.option("onLayoutChanged")) {
                    that.$element().toggleClass(LAYOUT_MANAGER_ONE_COLUMN, that.isSingleColumnMode(e.component));
                }
                that._fireContentReadyAction();
            },
            itemTemplate: function(e, itemData, itemElement) {
                if(!e.location) {
                    return;
                }
                var $itemElement = $(itemElement);
                var itemRenderedCountInPreviousRows = e.location.row * colCount;
                var item = that._items[e.location.col + itemRenderedCountInPreviousRows];

                var $fieldItem = $("<div>")
                    .addClass(item.cssClass)
                    .appendTo($itemElement);

                templatesInfo.push({
                    container: $fieldItem,
                    formItem: item
                });

                $itemElement.toggleClass(SINGLE_COLUMN_ITEM_CONTENT, that.isSingleColumnMode(this));

                if(e.location.row === 0) {
                    $fieldItem.addClass(LAYOUT_MANAGER_FIRST_ROW_CLASS);
                }
                if(e.location.col === 0) {
                    $fieldItem.addClass(LAYOUT_MANAGER_FIRST_COL_CLASS);
                }
                if((e.location.col === colCount - 1) || (e.location.col + e.location.colspan === colCount)) {
                    $fieldItem.addClass(LAYOUT_MANAGER_LAST_COL_CLASS);
                }
            },
            cols: that._generateRatio(colCount),
            rows: that._generateRatio(that._getRowsCount(), true),
            dataSource: layoutItems,
            screenByWidth: that.option("screenByWidth"),
            singleColumnScreen: xsColCount ? false : "xs"
        };
    },

    _getColCount: function() {
        var colCount = this.option("colCount");
        var colCountByScreen = this.option("colCountByScreen");

        if(colCountByScreen) {
            var screenFactor = windowUtils.hasWindow() ? windowUtils.getCurrentScreenFactor(this.option("screenByWidth")) : "lg";
            var currentColCount = colCountByScreen[screenFactor];
            colCount = currentColCount || colCount;
        }

        if(colCount === "auto") {
            if(this._cashedColCount) {
                return this._cashedColCount;
            }

            this._cashedColCount = colCount = this._getMaxColCount();
        }

        return colCount < 1 ? 1 : colCount;
    },

    _getMaxColCount: function() {
        if(!windowUtils.hasWindow()) {
            return 1;
        }

        var minColWidth = this.option("minColWidth");
        var width = this.$element().width();
        var itemsCount = this._items.length;
        var maxColCount = Math.floor(width / minColWidth) || 1;

        return itemsCount < maxColCount ? itemsCount : maxColCount;
    },

    isCachedColCountObsolete: function() {
        return this._cashedColCount && this._getMaxColCount() !== this._cashedColCount;
    },

    _prepareItemsWithMerging: function(colCount) {
        var items = this._items.slice(0);
        var item;
        var itemsMergedByCol;
        var result = [];
        var j;
        var i;

        for(i = 0; i < items.length; i++) {
            item = items[i];
            result.push(item);

            if(this.option("alignItemLabels") || item.alignItemLabels || item.colSpan) {
                item.col = this._getColByIndex(result.length - 1, colCount);
            }
            if(item.colSpan > 1 && (item.col + item.colSpan <= colCount)) {
                itemsMergedByCol = [];
                for(j = 0; j < item.colSpan - 1; j++) {
                    itemsMergedByCol.push({ merged: true });
                }
                result = result.concat(itemsMergedByCol);
            } else {
                delete item.colSpan;
            }
        }
        this._items = result;
    },

    _getColByIndex: function(index, colCount) {
        return index % colCount;
    },

    _generateLayoutItems: function() {
        var items = this._items;
        var colCount = this._getColCount();
        var result = [];
        var item;
        var i;

        for(i = 0; i < items.length; i++) {
            item = items[i];

            if(!item.merged) {
                var generatedItem = {
                    location: {
                        row: parseInt(i / colCount),
                        col: this._getColByIndex(i, colCount)
                    }
                };
                if(typeUtils.isDefined(item.colSpan)) {
                    generatedItem.location.colspan = item.colSpan;
                }
                if(typeUtils.isDefined(item.rowSpan)) {
                    generatedItem.location.rowspan = item.rowSpan;
                }
                result.push(generatedItem);
            }
        }

        return result;
    },

    _renderEmptyItem: function($container) {
        return $container
            .addClass(FIELD_EMPTY_ITEM_CLASS)
            .html("&nbsp;");
    },

    _getButtonHorizontalAlignment: function(item) {
        if(typeUtils.isDefined(item.horizontalAlignment)) {
            return item.horizontalAlignment;
        }

        if(typeUtils.isDefined(item.alignment)) {
            errors.log("W0001", "dxForm", "alignment", "18.1", "Use the 'horizontalAlignment' option in button items instead.");
            return item.alignment;
        }

        return "right";
    },

    _getButtonVerticalAlignment: function(item) {
        switch(item.verticalAlignment) {
            case "center":
                return "center";
            case "bottom":
                return "flex-end";
            default:
                return "flex-start";
        }
    },

    _renderButtonItem: function(item, $container) {
        var $button = $("<div>").appendTo($container);

        var defaultOptions = {
            validationGroup: this.option("validationGroup")
        };

        $container
            .addClass(FIELD_BUTTON_ITEM_CLASS)
            .css("textAlign", this._getButtonHorizontalAlignment(item));

        $container.parent().css("justifyContent", this._getButtonVerticalAlignment(item));

        var instance = this._createComponent($button, "dxButton", extend(defaultOptions, item.buttonOptions));

        this._itemsRunTimeInfo.add(item, instance, item.guid, $container);
        this._addItemClasses($container, item.col);

        return $button;
    },

    _addItemClasses: function($item, column) {
        $item
            .addClass(FIELD_ITEM_CLASS)
            .addClass(this.option("cssItemClass"))
            .addClass(typeUtils.isDefined(column) ? "dx-col-" + column : "");
    },

    _renderFieldItem: function(item, $container) {
        var that = this;
        var name = that._getName(item);
        var id = that.getItemID(name);
        var isRequired = typeUtils.isDefined(item.isRequired) ? item.isRequired : !!that._hasRequiredRuleInSet(item.validationRules);
        var labelOptions = that._getLabelOptions(item, id, isRequired);
        var $editor = $("<div>");
        var helpID = item.helpText ? ("dx-" + new Guid()) : null;
        var $label;

        this._addItemClasses($container, item.col);
        $container.addClass(isRequired ? FIELD_ITEM_REQUIRED_CLASS : FIELD_ITEM_OPTIONAL_CLASS);

        if(labelOptions.visible && labelOptions.text) {
            $label = that._renderLabel(labelOptions).appendTo($container);
        }

        if(item.itemType === SIMPLE_ITEM_TYPE) {
            if(that._isLabelNeedBaselineAlign(item) && labelOptions.location !== "top") {
                $container.addClass(FIELD_ITEM_LABEL_ALIGN_CLASS);
            }
            that._hasBrowserFlex() && $container.addClass(FLEX_LAYOUT_CLASS);
        }

        $editor.data("dx-form-item", item);
        that._appendEditorToField({
            $fieldItem: $container,
            $label: $label,
            $editor: $editor,
            labelOptions: labelOptions
        });

        var instance = that._renderEditor({
            $container: $editor,
            dataField: item.dataField,
            name: name,
            editorType: item.editorType,
            editorOptions: item.editorOptions,
            template: that._getTemplateByFieldItem(item),
            isRequired: isRequired,
            helpID: helpID,
            id: id,
            validationBoundary: that.option("validationBoundary")
        });

        this._itemsRunTimeInfo.add(item, instance, item.guid, $container);

        var $validationTarget = $editor.children().first();

        if($validationTarget && $validationTarget.data("dx-validation-target")) {
            that._renderValidator($validationTarget, item);
        }

        that._renderHelpText(item, $editor, helpID);

        that._attachClickHandler($label, $editor, item.editorType);
    },

    _hasRequiredRuleInSet: function(rules) {
        var hasRequiredRule;

        if(rules && rules.length) {
            each(rules, function(index, rule) {
                if(rule.type === "required") {
                    hasRequiredRule = true;
                    return false;
                }
            });
        }

        return hasRequiredRule;
    },

    _getName: function(item) {
        return item.dataField || item.name;
    },

    _isLabelNeedBaselineAlign: function(item) {
        var largeEditors = ["dxTextArea", "dxRadioGroup", "dxCalendar"];

        return (!!item.helpText && !this._hasBrowserFlex()) || inArray(item.editorType, largeEditors) !== -1;
    },

    _getLabelOptions: function(item, id, isRequired) {
        var labelOptions = extend(
            {
                showColon: this.option("showColonAfterLabel"),
                location: this.option("labelLocation"),
                id: id,
                visible: true,
                isRequired: isRequired
            },
            item ? item.label : {}
        );

        if(!labelOptions.text && item.dataField) {
            labelOptions.text = inflector.captionize(item.dataField);
        }

        if(labelOptions.text) {
            labelOptions.text += labelOptions.showColon ? ":" : "";
        }

        return labelOptions;
    },

    _renderLabel: function(options) {
        if(typeUtils.isDefined(options.text) && options.text.length > 0) {
            var labelClasses = FIELD_ITEM_LABEL_CLASS + " " + FIELD_ITEM_LABEL_LOCATION_CLASS + options.location;

            var $label = $("<label>")
                .addClass(labelClasses)
                .attr("for", options.id);

            var $labelContent = $("<span>")
                .addClass(FIELD_ITEM_LABEL_CONTENT_CLASS)
                .appendTo($label);

            $("<span>")
                .addClass(FIELD_ITEM_LABEL_TEXT_CLASS)
                .text(options.text)
                .appendTo($labelContent);

            if(options.alignment) {
                $label.css("textAlign", options.alignment);
            }

            $labelContent.append(this._renderLabelMark(options.isRequired));

            return $label;
        }
    },

    _renderLabelMark: function(isRequired) {
        var $mark;
        var requiredMarksConfig = this._getRequiredMarksConfig();
        var isRequiredMark = requiredMarksConfig.showRequiredMark && isRequired;
        var isOptionalMark = requiredMarksConfig.showOptionalMark && !isRequired;

        if(isRequiredMark || isOptionalMark) {
            var markClass = isRequiredMark ? FIELD_ITEM_REQUIRED_MARK_CLASS : FIELD_ITEM_OPTIONAL_MARK_CLASS;
            var markText = isRequiredMark ? requiredMarksConfig.requiredMark : requiredMarksConfig.optionalMark;

            $mark = $("<span>")
                .addClass(markClass)
                .html("&nbsp" + markText);
        }

        return $mark;
    },

    _getRequiredMarksConfig: function() {
        if(!this._cashedRequiredConfig) {
            this._cashedRequiredConfig = {
                showRequiredMark: this.option("showRequiredMark"),
                showOptionalMark: this.option("showOptionalMark"),
                requiredMark: this.option("requiredMark"),
                optionalMark: this.option("optionalMark")
            };
        }

        return this._cashedRequiredConfig;
    },

    _renderEditor: function(options) {
        var dataValue = this._getDataByField(options.dataField);
        var defaultEditorOptions = { value: dataValue };
        var isDeepExtend = true;
        var editorOptions;

        if(EDITORS_WITH_ARRAY_VALUE.indexOf(options.editorType) !== -1) {
            defaultEditorOptions.value = defaultEditorOptions.value || [];
        }

        var formInstance = this.option("form");

        editorOptions = extend(isDeepExtend, defaultEditorOptions, options.editorOptions, {
            inputAttr: {
                id: options.id
            },
            validationBoundary: options.validationBoundary,
            stylingMode: formInstance && formInstance.option("stylingMode")
        });

        this._replaceDataOptions(options.editorOptions, editorOptions);

        let renderOptions = {
            editorType: options.editorType,
            dataField: options.dataField,
            template: options.template,
            name: options.name,
            helpID: options.helpID,
            isRequired: options.isRequired
        };

        return this._createEditor(options.$container, renderOptions, editorOptions);
    },

    _replaceDataOptions: function(originalOptions, resultOptions) {
        if(originalOptions) {
            DATA_OPTIONS.forEach(function(item) {
                if(resultOptions[item]) {
                    resultOptions[item] = originalOptions[item];
                }
            });
        }
    },

    _renderValidator: function($editor, item) {
        var fieldName = this._getFieldLabelName(item);
        var validationRules = this._prepareValidationRules(item.validationRules, item.isRequired, item.itemType, fieldName);

        if(Array.isArray(validationRules) && validationRules.length) {
            this._createComponent($editor, Validator, {
                validationRules: validationRules,
                validationGroup: this.option("validationGroup")
            });
        }
    },

    _getFieldLabelName: function(item) {
        var isItemHaveCustomLabel = item.label && item.label.text;
        var itemName = isItemHaveCustomLabel ? null : this._getName(item);

        return isItemHaveCustomLabel ? item.label.text : itemName && inflector.captionize(itemName);
    },

    _prepareValidationRules: function(userValidationRules, isItemRequired, itemType, itemName) {
        var isSimpleItem = itemType === SIMPLE_ITEM_TYPE;
        var validationRules;

        if(isSimpleItem) {
            if(userValidationRules) {
                validationRules = userValidationRules;
            } else {
                var requiredMessage = stringUtils.format(this.option("requiredMessage"), itemName || "");

                validationRules = isItemRequired ? [{ type: "required", message: requiredMessage }] : null;
            }
        }

        return validationRules;
    },

    _addWrapperInvalidClass: function(editorInstance) {
        var wrapperClass = "." + FIELD_ITEM_CONTENT_WRAPPER_CLASS;

        var toggleInvalidClass = function(e) {
            $(e.element).parents(wrapperClass)
                .toggleClass(INVALID_CLASS, e.event.type === "focusin" && e.component.option("isValid") === false);
        };

        editorInstance
            .on("focusIn", toggleInvalidClass)
            .on("focusOut", toggleInvalidClass);
    },

    _createEditor: function($container, renderOptions, editorOptions) {
        var that = this;
        var template = renderOptions.template;
        var editorInstance;

        if(renderOptions.dataField && !editorOptions.name) {
            editorOptions.name = renderOptions.dataField;
        }

        that._addItemContentClasses($container);

        if(template) {
            var data = {
                dataField: renderOptions.dataField,
                editorType: renderOptions.editorType,
                editorOptions: editorOptions,
                component: that._getComponentOwner()
            };

            template.render({
                model: data,
                container: domUtils.getPublicElement($container)
            });
        } else {
            var $editor = $("<div>").appendTo($container);

            try {
                editorInstance = that._createComponent($editor, renderOptions.editorType, editorOptions);
                editorInstance.setAria("describedby", renderOptions.helpID);
                editorInstance.setAria("required", renderOptions.isRequired);

                if(themes.isMaterial()) {
                    that._addWrapperInvalidClass(editorInstance);
                }

                if(renderOptions.dataField) {
                    that._bindDataField(editorInstance, renderOptions, $container);
                }
            } catch(e) {
                errors.log("E1035", e.message);
            }
        }

        return editorInstance;
    },

    _getComponentOwner: function() {
        return this.option("form") || this;
    },

    _bindDataField: function(editorInstance, renderOptions, $container) {
        var componentOwner = this._getComponentOwner();

        editorInstance.on("enterKey", function(args) {
            componentOwner._createActionByOption("onEditorEnterKey")(extend(args, { dataField: renderOptions.dataField }));
        });

        this._createWatcher(editorInstance, $container, renderOptions);
        this.linkEditorToDataField(editorInstance, renderOptions.dataField, renderOptions.editorType);
    },

    _createWatcher: function(editorInstance, $container, renderOptions) {
        var that = this;
        var watch = that._getWatch();

        if(!typeUtils.isFunction(watch)) {
            return;
        }

        var dispose = watch(
            function() {
                return that._getDataByField(renderOptions.dataField);
            },
            function() {
                editorInstance.option("value", that._getDataByField(renderOptions.dataField));
            },
            {
                deep: true,
                skipImmediate: true
            }
        );

        eventsEngine.on($container, removeEvent, dispose);
    },

    _getWatch: function() {
        if(!typeUtils.isDefined(this._watch)) {
            var formInstance = this.option("form");

            this._watch = formInstance && formInstance.option("integrationOptions.watchMethod");
        }

        return this._watch;
    },

    _addItemContentClasses: function($itemContent) {
        var locationSpecificClass = this._getItemContentLocationSpecificClass();
        $itemContent.addClass([FIELD_ITEM_CONTENT_CLASS, locationSpecificClass].join(" "));
    },

    _getItemContentLocationSpecificClass: function() {
        var labelLocation = this.option("labelLocation");

        var oppositeClasses = {
            right: "left",
            left: "right",
            top: "bottom"
        };

        return FIELD_ITEM_CONTENT_LOCATION_CLASS + oppositeClasses[labelLocation];
    },

    _createComponent: function($editor, type, editorOptions) {
        var that = this;
        var readOnlyState = this.option("readOnly");
        var instance;

        instance = that.callBase($editor, type, editorOptions);

        readOnlyState && instance.option("readOnly", readOnlyState);

        that.on("optionChanged", function(args) {
            if(args.name === "readOnly" && !typeUtils.isDefined(editorOptions.readOnly)) {
                instance.option(args.name, args.value);
            }
        });

        return instance;
    },

    _getTemplateByFieldItem: function(fieldItem) {
        return fieldItem.template ? this._getTemplate(fieldItem.template) : null;
    },

    _appendEditorToField: function(params) {
        if(params.$label) {
            var location = params.labelOptions.location;

            if(location === "top" || location === "left") {
                params.$fieldItem.append(params.$editor);
            }

            if(location === "right") {
                params.$fieldItem.prepend(params.$editor);
            }

            this._addInnerItemAlignmentClass(params.$fieldItem, location);
        } else {
            params.$fieldItem.append(params.$editor);
        }
    },

    _addInnerItemAlignmentClass: function($fieldItem, location) {
        if(location === "top") {
            $fieldItem.addClass(LABEL_VERTICAL_ALIGNMENT_CLASS);
        } else {
            $fieldItem.addClass(LABEL_HORIZONTAL_ALIGNMENT_CLASS);
        }
    },

    _renderHelpText: function(fieldItem, $editor, helpID) {
        var helpText = fieldItem.helpText;
        var isSimpleItem = fieldItem.itemType === SIMPLE_ITEM_TYPE;

        if(helpText && isSimpleItem) {
            var $editorWrapper = $("<div>").addClass(FIELD_ITEM_CONTENT_WRAPPER_CLASS);

            $editor.wrap($editorWrapper);

            $("<div>")
                .addClass(FIELD_ITEM_HELP_TEXT_CLASS)
                .attr("id", helpID)
                .text(helpText)
                .appendTo($editor.parent());
        }
    },

    _attachClickHandler: function($label, $editor, editorType) {
        var isBooleanEditors = editorType === "dxCheckBox" || editorType === "dxSwitch";

        if($label && isBooleanEditors) {
            eventsEngine.on($label, clickEvent.name, function() {
                eventsEngine.trigger($editor.children(), clickEvent.name);
            });
        }
    },

    _generateRatio: function(count, isAutoSize) {
        var result = [];
        var ratio;
        var i;

        for(i = 0; i < count; i++) {
            ratio = { ratio: 1 };
            if(isAutoSize) {
                ratio.baseSize = "auto";
            }
            result.push(ratio);
        }

        return result;
    },

    _getRowsCount: function() {
        return Math.ceil(this._items.length / this._getColCount());
    },

    _updateReferencedOptions: function(newLayoutData) {
        var layoutData = this.option("layoutData");

        if(typeUtils.isObject(layoutData)) {
            Object.getOwnPropertyNames(layoutData)
                .forEach(property => delete this._optionsByReference['layoutData.' + property]);
        }

        if(typeUtils.isObject(newLayoutData)) {
            Object.getOwnPropertyNames(newLayoutData)
                .forEach(property => this._optionsByReference['layoutData.' + property] = true);
        }
    },

    _optionChanged: function(args) {
        if(args.fullName.search("layoutData.") === 0) {
            return;
        }

        switch(args.name) {
            case "showRequiredMark":
            case "showOptionalMark":
            case "requiredMark":
            case "optionalMark":
                this._cashedRequiredConfig = null;
                this._invalidate();
                break;
            case "layoutData":
                this._updateReferencedOptions(args.value);

                if(this.option("items")) {
                    if(!typeUtils.isEmptyObject(args.value)) {
                        this._itemsRunTimeInfo.each(function(_, itemRunTimeInfo) {
                            if(typeUtils.isDefined(itemRunTimeInfo.item)) {
                                var dataField = itemRunTimeInfo.item.dataField;

                                if(dataField && typeUtils.isDefined(itemRunTimeInfo.widgetInstance)) {
                                    var valueGetter = dataUtils.compileGetter(dataField);
                                    var dataValue = valueGetter(args.value);

                                    if(dataValue === undefined) {
                                        itemRunTimeInfo.widgetInstance.reset();
                                        itemRunTimeInfo.widgetInstance.option("isValid", true);
                                    } else {
                                        itemRunTimeInfo.widgetInstance.option("value", dataValue);
                                    }
                                }
                            }
                        });
                    }
                } else {
                    this._initDataAndItems(args.value);
                    this._invalidate();
                }
                break;
            case "items":
                this._cleanItemWatchers();
                this._initDataAndItems(args.value);
                this._invalidate();
                break;
            case "alignItemLabels":
            case "labelLocation":
            case "requiredMessage":
                this._invalidate();
                break;
            case "customizeItem":
                this._updateItems(this.option("layoutData"));
                this._invalidate();
                break;
            case "colCount":
                this._resetColCount();
                break;
            case "minColWidth":
                if(this.option("colCount") === "auto") {
                    this._resetColCount();
                }
                break;
            case "readOnly":
                break;
            case "width":
                this.callBase(args);

                if(this.option("colCount") === "auto") {
                    this._resetColCount();
                }
                break;
            case "onFieldDataChanged":
                break;
            default:
                this.callBase(args);
        }
    },

    _resetColCount: function() {
        this._cashedColCount = null;
        this._invalidate();
    },

    linkEditorToDataField: function(editorInstance, dataField, editorType) {
        var fullFieldName = "layoutData." + dataField;
        var that = this;
        var isDataUpdating;

        that.on("optionChanged", function(args) {
            if(args.fullName === fullFieldName) {
                isDataUpdating = true;
                if(typeof args.value === "object") {
                    that._managedUpdateEditorOption(editorInstance, "value", args.value);
                } else {
                    editorInstance.option("value", args.value);
                }
                isDataUpdating = false;
            }
        });

        editorInstance.on("valueChanged", function(args) {
            var isObjectValue = typeof args.value === "object";
            var isSameObjectValue = isObjectValue && args.value === args.previousValue;

            if(!isDataUpdating && !isSameObjectValue) {
                if(isObjectValue) {
                    that._managedUpdateFieldValue(dataField, args.value);
                } else {
                    that._updateFieldValue(dataField, args.value);
                }
            }
        });
    },

    _managedUpdateEditorOption: function(editorInstance, optionName, value) {
        if(!this._isValueChangedCalled) {
            this._isFieldValueChanged = true;
            editorInstance.option(optionName, value);
            this._isFieldValueChanged = false;
        }
    },

    _managedUpdateFieldValue: function(dataField, value) {
        this._isValueChangedCalled = true;

        if(!this._isFieldValueChanged) {
            this._updateFieldValue(dataField, value);
        }

        this._isValueChangedCalled = false;
    },

    _dimensionChanged: function() {
        if(this.option("colCount") === "auto" && this.isCachedColCountObsolete()) {
            this.fireEvent("autoColCountChanged");
        }
    },

    getItemID: function(name) {
        var formInstance = this.option("form");
        return formInstance && formInstance.getItemID(name);
    },

    updateData: function(data, value) {
        var that = this;

        if(typeUtils.isObject(data)) {
            each(data, function(dataField, fieldValue) {
                that._updateFieldValue(dataField, fieldValue);
            });
        } else if(typeof data === "string") {
            that._updateFieldValue(data, value);
        }
    },

    getEditor: function(field) {
        return this._itemsRunTimeInfo.findWidgetInstanceByDataField(field) || this._itemsRunTimeInfo.findWidgetInstanceByName(field);
    },

    isSingleColumnMode: function(component) {
        var responsiveBox = this._responsiveBox || component;
        if(responsiveBox) {
            return responsiveBox.option("currentScreenFactor") === responsiveBox.option("singleColumnScreen");
        }
    }
});

registerComponent("dxLayoutManager", LayoutManager);

module.exports = LayoutManager;

//#DEBUG
module.exports.__internals = {
    FIELD_ITEM_CLASS: FIELD_ITEM_CLASS,
    FIELD_EMPTY_ITEM_CLASS: FIELD_EMPTY_ITEM_CLASS,
    FIELD_ITEM_CONTENT_CLASS: FIELD_ITEM_CONTENT_CLASS,
    FIELD_ITEM_CONTENT_LOCATION_CLASS: FIELD_ITEM_CONTENT_LOCATION_CLASS,
    FIELD_ITEM_LABEL_CLASS: FIELD_ITEM_LABEL_CLASS,
    FIELD_ITEM_LABEL_ALIGN_CLASS: FIELD_ITEM_LABEL_ALIGN_CLASS,
    FIELD_ITEM_LABEL_LOCATION_CLASS: FIELD_ITEM_LABEL_LOCATION_CLASS,
    LABEL_HORIZONTAL_ALIGNMENT_CLASS: LABEL_HORIZONTAL_ALIGNMENT_CLASS,
    LABEL_VERTICAL_ALIGNMENT_CLASS: LABEL_VERTICAL_ALIGNMENT_CLASS,
    FORM_LAYOUT_MANAGER_CLASS: FORM_LAYOUT_MANAGER_CLASS,
    FIELD_ITEM_CONTENT_WRAPPER_CLASS: FIELD_ITEM_CONTENT_WRAPPER_CLASS,
    FIELD_ITEM_HELP_TEXT_CLASS: FIELD_ITEM_HELP_TEXT_CLASS,
    FIELD_ITEM_LABEL_CONTENT_CLASS: FIELD_ITEM_LABEL_CONTENT_CLASS,
    FIELD_ITEM_LABEL_TEXT_CLASS: FIELD_ITEM_LABEL_TEXT_CLASS,
    FIELD_ITEM_REQUIRED_CLASS: FIELD_ITEM_REQUIRED_CLASS,
    FIELD_ITEM_OPTIONAL_CLASS: FIELD_ITEM_OPTIONAL_CLASS,
    FIELD_ITEM_REQUIRED_MARK_CLASS: FIELD_ITEM_REQUIRED_MARK_CLASS,
    FIELD_ITEM_OPTIONAL_MARK_CLASS: FIELD_ITEM_OPTIONAL_MARK_CLASS,
    LAYOUT_MANAGER_ONE_COLUMN: LAYOUT_MANAGER_ONE_COLUMN,
    FLEX_LAYOUT_CLASS: FLEX_LAYOUT_CLASS
};
//#ENDDEBUG
