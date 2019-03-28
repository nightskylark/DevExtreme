var $ = require("../../core/renderer");
var eventsEngine = require("../../events/core/events_engine");
var ArrayStore = require("../../data/array_store");
var clickEvent = require("../../events/click");
import commonUtils from "../../core/utils/common";
var noop = commonUtils.noop;
import typeUtils from "../../core/utils/type";
var isDefined = typeUtils.isDefined;
import arrayUtils from "../../core/utils/array";
var inArray = arrayUtils.inArray;
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
var iteratorUtils = require("../../core/utils/iterator");
var messageLocalization = require("../../localization/message");
var registerComponent = require("../../core/component_registrator");
var Widget = require("../widget/ui.widget");
var headerFilter = require("../grid_core/ui.grid_core.header_filter_core");
var columnStateMixin = require("../grid_core/ui.grid_core.column_state_mixin");
var sortingMixin = require("../grid_core/ui.grid_core.sorting_mixin");
var pivotGridUtils = require("./ui.pivot_grid.utils");
var Sortable = require("./ui.sortable");
import deferredUtils from "../../core/utils/deferred";
var Deferred = deferredUtils.Deferred;
var each = iteratorUtils.each;
var IE_FIELD_WIDTH_CORRECTION = 1;
var DIV = "<div>";

var HeaderFilterView = headerFilter.HeaderFilterView.inherit({
    _getSearchExpr: function(options) {
        options.useDefaultSearchExpr = true;
        return this.callBase(options);
    }
});

var processItems = function(groupItems, field) {
    var filterValues = [];
    var isTree = !!field.groupName;
    var isExcludeFilterType = (field.filterType === "exclude");

    if(field.filterValues) {
        each(field.filterValues, function(_, filterValue) {
            filterValues.push(Array.isArray(filterValue) ? filterValue.join("/") : filterValue && filterValue.valueOf());
        });
    }

    pivotGridUtils.foreachTree(groupItems, function(items) {
        var item = items[0];
        var path = pivotGridUtils.createPath(items);
        var preparedFilterValueByText = isTree ? iteratorUtils.map(items, function(item) { return item.text; }).reverse().join("/") : item.text;
        var preparedFilterValue;

        item.value = isTree ? path.slice(0) : (item.key || item.value);
        preparedFilterValue = isTree ? path.join("/") : item.value && item.value.valueOf();

        if(item.children) {
            item.items = item.children;
            item.children = null;
        }

        headerFilter.updateHeaderFilterItemSelectionState(item, item.key && inArray(preparedFilterValueByText, filterValues) > -1 || inArray(preparedFilterValue, filterValues) > -1, isExcludeFilterType);
    });
};

function getMainGroupField(dataSource, sourceField) {
    var field = sourceField;
    if(isDefined(sourceField.groupIndex)) {
        field = dataSource.getAreaFields(sourceField.area, true)[sourceField.areaIndex];
    }

    return field;
}

function getStringState(state) {
    state = state || {};
    return JSON.stringify([state.fields, state.columnExpandedPaths, state.rowExpandedPaths]);
}

var FieldChooserBase = Widget.inherit(columnStateMixin).inherit(sortingMixin).inherit(headerFilter.headerFilterMixin).inherit({
    _getDefaultOptions: function() {
        return extend(this.callBase(), {
            allowFieldDragging: true,
            applyChangesMode: "instantly",
            state: null,
            headerFilter: {
                width: 252,
                height: 325,
                searchTimeout: 500,
                texts: {
                    emptyValue: messageLocalization.format("dxDataGrid-headerFilterEmptyValue"),
                    ok: messageLocalization.format("dxDataGrid-headerFilterOK"),
                    cancel: messageLocalization.format("dxDataGrid-headerFilterCancel")
                }
            }
        });
    },

    _init: function() {
        this.callBase();
        this._headerFilterView = new HeaderFilterView(this);
        this._refreshDataSource();
        this.subscribeToEvents();
    },

    _refreshDataSource: function() {
        var dataSource = this.option("dataSource");

        if(dataSource && dataSource.fields && dataSource.load/* instanceof DX.ui.dxPivotGrid.DataSource */) {
            this._dataSource = dataSource;
        }
    },

    _optionChanged: function(args) {
        switch(args.name) {
            case "dataSource":
                this._refreshDataSource();
                break;
            case "applyChangesMode":
                break;
            case "state":
                if(this._skipStateChange || !this._dataSource) {
                    break;
                }

                if(this.option("applyChangesMode") === "instantly" && getStringState(this._dataSource.state()) !== getStringState(args.value)) {
                    this._dataSource.state(args.value);
                } else {
                    this._clean(true);
                    this._renderComponent();
                }
                break;
            case "headerFilter":
            case "allowFieldDragging":
                this._invalidate();
                break;
            default:
                this.callBase(args);
        }
    },

    renderField: function(field, showColumnLines) {
        var that = this;

        var $fieldContent = $(DIV).addClass("dx-area-field-content")
            .text(field.caption || field.dataField);

        var $fieldElement = $(DIV)
            .addClass("dx-area-field")
            .addClass("dx-area-box")
            .data("field", field)
            .append($fieldContent);

        var mainGroupField = getMainGroupField(that._dataSource, field);

        if(field.area !== "data") {
            if(field.allowSorting) {
                that._applyColumnState({
                    name: 'sort',
                    rootElement: $fieldElement,
                    column: {
                        alignment: that.option("rtlEnabled") ? "right" : "left",
                        sortOrder: field.sortOrder === 'desc' ? 'desc' : 'asc'
                    },
                    showColumnLines: showColumnLines
                });
            }

            that._applyColumnState({
                name: 'headerFilter',
                rootElement: $fieldElement,
                column: {
                    alignment: that.option("rtlEnabled") ? "right" : "left",
                    filterValues: mainGroupField.filterValues,
                    allowFiltering: mainGroupField.allowFiltering && !field.groupIndex
                },
                showColumnLines: showColumnLines
            });
        }

        if(field.groupName) {
            $fieldElement.attr("item-group", field.groupName);
        }

        return $fieldElement;
    },

    _clean: function() {
    },

    _render: function() {
        this.callBase();
        this._headerFilterView.render(this.$element());
    },

    renderSortable: function() {
        var that = this;

        that._createComponent(that.$element(), Sortable, extend({
            allowDragging: that.option("allowFieldDragging"),
            itemSelector: ".dx-area-field",
            itemContainerSelector: ".dx-area-field-container",
            groupSelector: ".dx-area-fields",
            groupFilter: function() {
                var dataSource = that._dataSource;
                var $sortable = $(this).closest(".dx-sortable");
                var pivotGrid = $sortable.data("dxPivotGrid");
                var pivotGridFieldChooser = $sortable.data("dxPivotGridFieldChooser");

                if(pivotGrid) {
                    return pivotGrid.getDataSource() === dataSource;
                }
                if(pivotGridFieldChooser) {
                    return pivotGridFieldChooser.option("dataSource") === dataSource;
                }
                return false;
            },
            itemRender: function($sourceItem, target) {
                var $item;
                if($sourceItem.hasClass("dx-area-box")) {
                    $item = $sourceItem.clone();
                    if(target === "drag") {
                        each($sourceItem, function(index, sourceItem) {
                            $item.eq(index).css("width", parseInt($(sourceItem).outerWidth(), 10) + IE_FIELD_WIDTH_CORRECTION);
                        });
                    }
                } else {
                    $item = $(DIV)
                        .addClass("dx-area-field")
                        .addClass("dx-area-box")
                        .text($sourceItem.text());
                }
                if(target === "drag") {
                    var wrapperContainer = $(DIV);
                    each($item, function(_, item) {
                        var wrapper = $("<div>")
                            .addClass("dx-pivotgrid-fields-container")
                            .addClass("dx-widget")
                            .append($(item));
                        wrapperContainer.append(wrapper);
                    });
                    return wrapperContainer.children();
                }
                return $item;
            },
            onDragging: function(e) {
                var field = e.sourceElement.data("field");
                var targetGroup = e.targetGroup;
                e.cancel = false;

                if(field.isMeasure === true) {
                    if(targetGroup === "column" || targetGroup === "row" || targetGroup === "filter") {
                        e.cancel = true;
                    }
                } else if(field.isMeasure === false && targetGroup === "data") {
                    e.cancel = true;
                }
            },
            useIndicator: true,
            onChanged: function(e) {
                var dataSource = that._dataSource;
                var field = e.sourceElement.data("field");

                e.removeSourceElement = !!e.sourceGroup;

                that._adjustSortableOnChangedArgs(e);

                if(field) {
                    that._applyChanges([getMainGroupField(dataSource, field)], {
                        area: e.targetGroup,
                        areaIndex: e.targetIndex
                    });
                }
            }
        }, that._getSortableOptions()));
    },

    _processDemandState: function(func) {
        var that = this;
        var isInstantlyMode = that.option("applyChangesMode") === "instantly";
        var dataSource = that._dataSource;

        if(isInstantlyMode) {
            func(dataSource, isInstantlyMode);
        } else {
            var currentState = dataSource.state();

            dataSource.state(that.option("state"), true);

            func(dataSource, isInstantlyMode);

            dataSource.state(currentState, true);
        }
    },

    _applyChanges(fields, props) {
        var that = this;

        that._processDemandState(function(dataSource, isInstantlyMode) {
            fields.forEach(({ index }) => {
                dataSource.field(index, props);
            });

            if(isInstantlyMode) {
                dataSource.load();
            } else {
                that._changedHandler();
            }
        });
    },

    _adjustSortableOnChangedArgs: function(e) {
        e.removeSourceElement = false;
        e.removeTargetElement = true;
        e.removeSourceClass = false;
    },

    _getSortableOptions: function() {
        return {
            direction: "auto"
        };
    },

    subscribeToEvents: function(element) {
        var that = this;

        var func = function(e) {
            var field = $(e.currentTarget).data("field");
            var mainGroupField = extend(true, {}, getMainGroupField(that._dataSource, field));
            var isHeaderFilter = $(e.target).hasClass("dx-header-filter");
            var dataSource = that._dataSource;

            if(isHeaderFilter) {
                that._headerFilterView.showHeaderFilterMenu($(e.currentTarget), extend(mainGroupField, {
                    type: mainGroupField.groupName ? 'tree' : 'list',
                    encodeHtml: that.option("encodeHtml"),
                    dataSource: {
                        useDefaultSearch: true,
                        // paginate: false,
                        load: function(options) {
                            var userData = options.userData;
                            if(userData.store) {
                                return userData.store.load(options);
                            } else {
                                var d = new Deferred();
                                dataSource.getFieldValues(mainGroupField.index).done(function(data) {
                                    userData.store = new ArrayStore(data);
                                    userData.store.load(options).done(d.resolve).fail(d.reject);
                                }).fail(d.reject);
                                return d;
                            }
                        },
                        postProcess: function(data) {
                            processItems(data, mainGroupField);
                            return data;
                        }
                    },

                    apply: function() {
                        that._applyChanges([mainGroupField], {
                            filterValues: this.filterValues,
                            filterType: this.filterType
                        });
                    }
                }));
            } else if(field.allowSorting && field.area !== "data") {
                that._applyChanges([field], {
                    sortOrder: field.sortOrder === "desc" ? "asc" : "desc"
                });
            }
        };

        if(element) {
            eventsEngine.on(element, clickEvent.name, ".dx-area-field.dx-area-box", func);
            return;
        }
        eventsEngine.on(that.$element(), clickEvent.name, ".dx-area-field.dx-area-box", func);
    },

    _initTemplates: noop,

    addWidgetPrefix: function(className) {
        return "dx-pivotgrid-" + className;
    }
});

registerComponent("dxPivotGridFieldChooserBase", FieldChooserBase);

module.exports = FieldChooserBase;
