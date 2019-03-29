var $ = require("../../core/renderer");
import commonUtils from "../../core/utils/common";
var noop = commonUtils.noop;
import eventsEngine from "../../events/core/events_engine";
import typeUtils from "../../core/utils/type";
import variableWrapperUtils from "../../core/utils/variable_wrapper";
var isWrapped = variableWrapperUtils.isWrapped;
import dataUtils from "../../core/utils/data";
var compileGetter = dataUtils.compileGetter;
import browser from "../../core/utils/browser";
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
import devices from "../../core/devices";
import domUtils from "../../core/utils/dom";
var getPublicElement = domUtils.getPublicElement;
import sourceModule from "../../data/data_source/data_source";
var normalizeDataSourceOptions = sourceModule.normalizeDataSourceOptions;
import utilsModule from "../../events/utils";
var normalizeKeyName = utilsModule.normalizeKeyName;

import "../text_box";
import "../number_box";
import "../check_box";
import "../select_box";
import "../date_box";

var CHECKBOX_SIZE_CLASS = "checkbox-size";
var CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled";
var EDITOR_INLINE_BLOCK = "dx-editor-inline-block";

var EditorFactoryMixin = (function() {
    var getResultConfig = function(config, options) {
        return extend(config, {
            readOnly: options.readOnly,
            placeholder: options.placeholder,
            inputAttr: {
                id: options.id
            },
            tabIndex: options.tabIndex
        }, options.editorOptions);
    };

    var checkEnterBug = function() {
        return browser.msie || browser.mozilla || devices.real().ios;// Workaround for T344096, T249363, T314719, caused by https://connect.microsoft.com/IE/feedback/details/1552272/
    };

    var getTextEditorConfig = function(options) {
        var data = {};
        var isEnterBug = checkEnterBug();
        var sharedData = options.sharedData || data;

        return getResultConfig({
            placeholder: options.placeholder,
            width: options.width,
            value: options.value,
            onValueChanged: function(e) {
                var needDelayedUpdate = options.parentType === "filterRow" || options.parentType === "searchPanel";
                var isKeyUpEvent = e.event && e.event.type === "keyup";

                var updateValue = function(e, notFireEvent) {
                    options && options.setValue(e.value, notFireEvent);
                };

                clearTimeout(data.valueChangeTimeout);

                if(isKeyUpEvent && needDelayedUpdate) {
                    sharedData.valueChangeTimeout = data.valueChangeTimeout = setTimeout(function() {
                        updateValue(e, data.valueChangeTimeout !== sharedData.valueChangeTimeout);
                    }, typeUtils.isDefined(options.updateValueTimeout) ? options.updateValueTimeout : 0);
                } else {
                    updateValue(e);
                }
            },
            onKeyDown: function(e) {
                if(isEnterBug && normalizeKeyName(e.event) === "enter") {
                    eventsEngine.trigger($(e.component._input()), "change");
                }
            },
            valueChangeEvent: "change" + (options.parentType === "filterRow" ? " keyup" : "")
        }, options);
    };

    var prepareDateBox = function(options) {
        options.editorName = "dxDateBox";

        options.editorOptions = getResultConfig({
            value: options.value,
            onValueChanged: function(args) {
                options.setValue(args.value);
            },
            onKeyDown: function(e) {
                if(checkEnterBug() && normalizeKeyName(e.event) === "enter") {
                    e.component.blur();
                    e.component.focus();
                }
            },
            displayFormat: options.format,
            type: options.dataType,
            formatWidthCalculator: null,
            dateSerializationFormat: null,
            width: options.parentType === "filterBuilder" ? undefined : "auto"
        }, options);
    };

    var prepareTextBox = function(options) {
        var config = getTextEditorConfig(options);
        var isSearching = options.parentType === "searchPanel";

        var toString = function(value) {
            return typeUtils.isDefined(value) ? value.toString() : "";
        };

        config.value = toString(options.value);
        config.valueChangeEvent += (isSearching ? " keyup search" : "");
        config.mode = config.mode || (isSearching ? "search" : "text");

        options.editorName = "dxTextBox";
        options.editorOptions = config;
    };

    var prepareNumberBox = function(options) {
        var config = getTextEditorConfig(options);

        config.value = typeUtils.isDefined(options.value) ? options.value : null;

        options.editorName = "dxNumberBox";

        options.editorOptions = config;
    };

    var prepareBooleanEditor = function(options) {
        if(options.parentType === "filterRow" || options.parentType === "filterBuilder") {
            prepareSelectBox(extend(options, {
                lookup: {
                    displayExpr: function(data) {
                        if(data === true) {
                            return options.trueText || "true";
                        } else if(data === false) {
                            return options.falseText || "false";
                        }
                    },
                    dataSource: [true, false]
                }
            }));
        } else {
            prepareCheckBox(options);
        }
    };

    var prepareSelectBox = function(options) {
        var lookup = options.lookup;
        var displayGetter;
        var dataSource;
        var postProcess;
        var isFilterRow = options.parentType === "filterRow";

        if(lookup) {
            displayGetter = compileGetter(lookup.displayExpr);
            dataSource = lookup.dataSource;

            if(typeUtils.isFunction(dataSource) && !isWrapped(dataSource)) {
                dataSource = dataSource(options.row || {});
            }

            if(typeUtils.isObject(dataSource) || Array.isArray(dataSource)) {
                dataSource = normalizeDataSourceOptions(dataSource);
                if(isFilterRow) {
                    postProcess = dataSource.postProcess;
                    dataSource.postProcess = function(items) {
                        if(this.pageIndex() === 0) {
                            items = items.slice(0);
                            items.unshift(null);
                        }
                        if(postProcess) {
                            return postProcess.call(this, items);
                        }
                        return items;
                    };
                }
            }

            var allowClearing = Boolean(lookup.allowClearing && !isFilterRow);

            options.editorName = "dxSelectBox";
            options.editorOptions = getResultConfig({
                searchEnabled: true,
                value: options.value,
                valueExpr: options.lookup.valueExpr,
                searchExpr: options.lookup.searchExpr || options.lookup.displayExpr,
                allowClearing: allowClearing,
                showClearButton: allowClearing,
                displayExpr: function(data) {
                    if(data === null) {
                        return options.showAllText;
                    }
                    return displayGetter(data);
                },
                dataSource: dataSource,
                onValueChanged: function(e) {
                    var params = [e.value];

                    !isFilterRow && params.push(e.component.option("text"));
                    options.setValue.apply(this, params);
                }
            }, options);
        }
    };

    var prepareCheckBox = function(options) {
        options.editorName = "dxCheckBox";
        options.editorOptions = getResultConfig({
            value: typeUtils.isDefined(options.value) ? options.value : undefined,
            hoverStateEnabled: !options.readOnly,
            focusStateEnabled: !options.readOnly,
            activeStateEnabled: false,
            onValueChanged: function(e) {
                options.setValue && options.setValue(e.value, e /* for selection */);
            },
        }, options);
    };

    var createEditorCore = function(that, options) {
        var $editorElement = $(options.editorElement);
        if(options.editorName && options.editorOptions && $editorElement[options.editorName]) {
            if(options.editorName === "dxCheckBox") {
                if(!options.isOnForm) {
                    $editorElement.addClass(that.addWidgetPrefix(CHECKBOX_SIZE_CLASS));
                    $editorElement.parent().addClass(EDITOR_INLINE_BLOCK);
                }
                if(options.command || options.editorOptions.readOnly) {
                    $editorElement.parent().addClass(CELL_FOCUS_DISABLED_CLASS);
                }
            }

            that._createComponent($editorElement, options.editorName, options.editorOptions);

            if(options.editorName === "dxTextBox") {
                $editorElement.dxTextBox("instance").registerKeyHandler("enter", noop);
            }
        }
    };
    return {
        createEditor: function($container, options) {
            let editorName;

            options.cancel = false;
            options.editorElement = getPublicElement($container);

            if(!typeUtils.isDefined(options.tabIndex)) {
                options.tabIndex = this.option("tabIndex");
            }

            if(options.lookup) {
                prepareSelectBox(options);
            } else {
                switch(options.dataType) {
                    case "date":
                    case "datetime":
                        prepareDateBox(options);
                        break;
                    case "boolean":
                        prepareBooleanEditor(options);
                        break;
                    case "number":
                        prepareNumberBox(options);
                        break;
                    default:
                        prepareTextBox(options);
                        break;
                }
            }

            editorName = options.editorName;
            this.executeAction("onEditorPreparing", options);

            if(options.cancel) {
                return;
            } else if(options.parentType === "dataRow" && options.editorType && editorName === options.editorName) {
                options.editorName = options.editorType;
            }

            createEditorCore(this, options);

            this.executeAction("onEditorPrepared", options);
        }
    };
})();

module.exports = EditorFactoryMixin;
