import $ from "../../core/renderer";
import { getWindow, hasWindow } from "../../core/utils/window";
import eventsEngine from "../../events/core/events_engine";
import { deferRender, deferUpdate } from "../../core/utils/common";
import styleUtils from "../../core/utils/style";
import { isDefined, isNumeric, isString } from "../../core/utils/type";
import { each } from "../../core/utils/iterator";
import { extend } from "../../core/utils/extend";
import { isEmpty } from "../../core/utils/string";
import { getDefaultAlignment } from "../../core/utils/position";
import { compileGetter } from "../../core/utils/data";
import { setEmptyText, getGroupRowSummaryText, getDisplayValue, formatValue, renderLoadPanel, renderNoDataText } from "./ui.grid_core.utils";
import columnsView from "./ui.grid_core.columns_view";
import Scrollable from "../scroll_view/ui.scrollable";
import removeEvent from "../../core/remove_event";
import messageLocalization from "../../localization/message";
import browser from "../../core/utils/browser";

var ROWS_VIEW_CLASS = "rowsview";
var CONTENT_CLASS = "content";
var NOWRAP_CLASS = "nowrap";
var GROUP_ROW_CLASS = "dx-group-row";
var GROUP_CELL_CLASS = "dx-group-cell";
var DATA_ROW_CLASS = "dx-data-row";
var FREE_SPACE_CLASS = "dx-freespace-row";
var ROW_LINES_CLASS = "dx-row-lines";
var COLUMN_LINES_CLASS = "dx-column-lines";
var ROW_ALTERNATION_CLASS = "dx-row-alt";
var LAST_ROW_BORDER = "dx-last-row-border";
var EMPTY_CLASS = "dx-empty";
var ROW_INSERTED_ANIMATION_CLASS = "row-inserted-animation";
var LOADPANEL_HIDE_TIMEOUT = 200;

module.exports = {
    defaultOptions: function() {
        return {
            hoverStateEnabled: false,
            /**
            * @name dxDataGridOptions.onCellHoverChanged
            * @type function(e)
            * @type_function_param1 e:object
            * @type_function_param1_field4 eventType:string
            * @type_function_param1_field5 data:object
            * @type_function_param1_field6 key:any
            * @type_function_param1_field7 value:any
            * @type_function_param1_field8 text:string
            * @type_function_param1_field9 displayValue:any
            * @type_function_param1_field10 columnIndex:number
            * @type_function_param1_field11 rowIndex:number
            * @type_function_param1_field12 column:dxDataGridColumn
            * @type_function_param1_field13 rowType:string
            * @type_function_param1_field14 cellElement:dxElement
            * @type_function_param1_field15 row:dxDataGridRowObject
            * @extends Action
            * @action
            */
            /**
            * @name dxTreeListOptions.onCellHoverChanged
            * @type function(e)
            * @type_function_param1 e:object
            * @type_function_param1_field4 eventType:string
            * @type_function_param1_field5 data:object
            * @type_function_param1_field6 key:any
            * @type_function_param1_field7 value:any
            * @type_function_param1_field8 text:string
            * @type_function_param1_field9 displayValue:any
            * @type_function_param1_field10 columnIndex:number
            * @type_function_param1_field11 rowIndex:number
            * @type_function_param1_field12 column:dxTreeListColumn
            * @type_function_param1_field13 rowType:string
            * @type_function_param1_field14 cellElement:dxElement
            * @type_function_param1_field15 row:dxTreeListRowObject
            * @extends Action
            * @action
            */

            /**
             * @name GridBaseOptions.scrolling
             * @type object
             */
            /**
             * @name dxDataGridOptions.scrolling
             * @type object
             */
            /**
             * @name dxTreeListOptions.scrolling
             * @type object
             */
            scrolling: {
                /**
                 * @name GridBaseOptions.scrolling.useNative
                 * @type boolean
                 */
                useNative: "auto"
                /**
                * @name GridBaseOptions.scrolling.showScrollbar
                * @type Enums.ShowScrollbarMode
                * @default 'onScroll'
                */
                /**
                * @name GridBaseOptions.scrolling.scrollByContent
                * @type boolean
                * @default true
                */
                /**
                * @name GridBaseOptions.scrolling.scrollByThumb
                * @type boolean
                * @default false
                */
            },

            /**
             * @name GridBaseOptions.loadPanel
             * @type object
             */
            loadPanel: {
                /**
                 * @name GridBaseOptions.loadPanel.enabled
                 * @type boolean
                 */
                enabled: "auto",
                /**
                 * @name GridBaseOptions.loadPanel.text
                 * @type string
                 * @default "Loading..."
                 */
                text: messageLocalization.format("Loading"),
                /**
                 * @name GridBaseOptions.loadPanel.width
                 * @type number
                 * @default 200
                 */
                width: 200,
                /**
                 * @name GridBaseOptions.loadPanel.height
                 * @type number
                 * @default 90
                 */
                height: 90,
                /**
                * @name GridBaseOptions.loadPanel.showIndicator
                * @type boolean
                * @default true
                */
                showIndicator: true,

                /**
                * @name GridBaseOptions.loadPanel.indicatorSrc
                * @type string
                * @default ""
                */
                indicatorSrc: "",

                /**
                * @name GridBaseOptions.loadPanel.showPane
                * @type boolean
                * @default true
                */
                showPane: true

                /**
                * @name GridBaseOptions.loadPanel.shading
                * @type boolean
                * @default false
                */

                /**
                * @name GridBaseOptions.loadPanel.shadingColor
                * @type string
                * @default ''
                */
            },
            /**
            * @name dxDataGridOptions.onRowClick
            * @type function(e)|string
            * @type_function_param1 e:object
            * @type_function_param1_field4 jQueryEvent:jQuery.Event:deprecated(event)
            * @type_function_param1_field5 event:event
            * @type_function_param1_field6 data:object
            * @type_function_param1_field7 key:any
            * @type_function_param1_field8 values:Array<Object>
            * @type_function_param1_field9 columns:Array<Object>
            * @type_function_param1_field10 rowIndex:number
            * @type_function_param1_field11 rowType:string
            * @type_function_param1_field12 isSelected:boolean
            * @type_function_param1_field13 isExpanded:boolean
            * @type_function_param1_field14 groupIndex:number
            * @type_function_param1_field15 rowElement:dxElement
            * @type_function_param1_field16 handled:boolean
            * @extends Action
            * @action
            */
            /**
            * @name dxTreeListOptions.onRowClick
            * @type function(e)|string
            * @type_function_param1 e:object
            * @type_function_param1_field4 jQueryEvent:jQuery.Event:deprecated(event)
            * @type_function_param1_field5 event:event
            * @type_function_param1_field6 data:object
            * @type_function_param1_field7 key:any
            * @type_function_param1_field8 values:Array<Object>
            * @type_function_param1_field9 columns:Array<Object>
            * @type_function_param1_field10 rowIndex:number
            * @type_function_param1_field11 rowType:string
            * @type_function_param1_field12 isSelected:boolean
            * @type_function_param1_field13 isExpanded:boolean
            * @type_function_param1_field14 rowElement:dxElement
            * @type_function_param1_field15 handled:boolean
            * @extends Action
            * @action
            */
            /**
            * @name dxDataGridOptions.onCellClick
            * @type function(e)|string
            * @type_function_param1 e:object
            * @type_function_param1_field4 jQueryEvent:jQuery.Event:deprecated(event)
            * @type_function_param1_field5 event:event
            * @type_function_param1_field6 data:object
            * @type_function_param1_field7 key:any
            * @type_function_param1_field8 value:any
            * @type_function_param1_field9 displayValue:any
            * @type_function_param1_field10 text:string
            * @type_function_param1_field11 columnIndex:number
            * @type_function_param1_field12 column:object
            * @type_function_param1_field13 rowIndex:number
            * @type_function_param1_field14 rowType:string
            * @type_function_param1_field15 cellElement:dxElement
            * @type_function_param1_field16 row:dxDataGridRowObject
            * @extends Action
            * @action
            */
            /**
            * @name dxTreeListOptions.onCellClick
            * @type function(e)|string
            * @type_function_param1 e:object
            * @type_function_param1_field4 jQueryEvent:jQuery.Event:deprecated(event)
            * @type_function_param1_field5 event:event
            * @type_function_param1_field6 data:object
            * @type_function_param1_field7 key:any
            * @type_function_param1_field8 value:any
            * @type_function_param1_field9 displayValue:any
            * @type_function_param1_field10 text:string
            * @type_function_param1_field11 columnIndex:number
            * @type_function_param1_field12 column:object
            * @type_function_param1_field13 rowIndex:number
            * @type_function_param1_field14 rowType:string
            * @type_function_param1_field15 cellElement:dxElement
            * @type_function_param1_field16 row:dxTreeListRowObject
            * @extends Action
            * @action
            */
            /**
             * @name dxDataGridOptions.rowTemplate
             * @type template|function
             * @type_function_param1 rowElement:dxElement
             * @type_function_param2 rowInfo:object
             */
            rowTemplate: null,
            /**
             * @name GridBaseOptions.columnAutoWidth
             * @type boolean
             * @default false
             */
            columnAutoWidth: false,
            /**
             * @name GridBaseOptions.noDataText
             * @type string
             * @default "No data"
             */
            noDataText: messageLocalization.format("dxDataGrid-noDataText"),
            /**
             * @name GridBaseOptions.wordWrapEnabled
             * @type boolean
             * @default false
             */
            wordWrapEnabled: false,
            /**
             * @name GridBaseOptions.showColumnLines
             * @type boolean
             * @default true
             */
            showColumnLines: true,
            /**
             * @name GridBaseOptions.showRowLines
             * @type boolean
             * @default false
             */
            showRowLines: false,
            /**
             * @name GridBaseOptions.rowAlternationEnabled
             * @type boolean
             * @default false
             */
            rowAlternationEnabled: false,
            /**
             * @name dxDataGridOptions.onCellPrepared
             * @type function(e)
             * @type_function_param1 e:object
             * @type_function_param1_field4 data:object
             * @type_function_param1_field5 key:any
             * @type_function_param1_field6 value:any
             * @type_function_param1_field7 displayValue:any
             * @type_function_param1_field8 text:string
             * @type_function_param1_field9 columnIndex:number
             * @type_function_param1_field10 column:dxDataGridColumn
             * @type_function_param1_field11 rowIndex:number
             * @type_function_param1_field12 rowType:string
             * @type_function_param1_field13 row:dxDataGridRowObject
             * @type_function_param1_field14 isSelected:boolean
             * @type_function_param1_field15 isExpanded:boolean
             * @type_function_param1_field16 cellElement:dxElement
             * @type_function_param1_field17 watch:function
             * @type_function_param1_field18 oldValue:any
             * @extends Action
             * @action
             */
            /**
             * @name dxTreeListOptions.onCellPrepared
             * @type function(e)
             * @type_function_param1 e:object
             * @type_function_param1_field4 data:object
             * @type_function_param1_field5 key:any
             * @type_function_param1_field6 value:any
             * @type_function_param1_field7 displayValue:any
             * @type_function_param1_field8 text:string
             * @type_function_param1_field9 columnIndex:number
             * @type_function_param1_field10 column:dxTreeListColumn
             * @type_function_param1_field11 rowIndex:number
             * @type_function_param1_field12 rowType:string
             * @type_function_param1_field13 row:dxTreeListRowObject
             * @type_function_param1_field14 isSelected:boolean
             * @type_function_param1_field15 isExpanded:boolean
             * @type_function_param1_field16 cellElement:dxElement
             * @type_function_param1_field17 watch:function
             * @type_function_param1_field18 oldValue:any
             * @extends Action
             * @action
             */
            /**
             * @name dxDataGridOptions.onRowPrepared
             * @type function(e)
             * @type_function_param1 e:object
             * @type_function_param1_field4 data:object
             * @type_function_param1_field5 key:any
             * @type_function_param1_field6 values:Array<Object>
             * @type_function_param1_field7 columns:Array<dxDataGridColumn>
             * @type_function_param1_field8 rowIndex:number
             * @type_function_param1_field9 rowType:string
             * @type_function_param1_field10 groupIndex:number
             * @type_function_param1_field11 isSelected:boolean
             * @type_function_param1_field12 isExpanded:boolean
             * @type_function_param1_field13 rowElement:dxElement
             * @extends Action
             * @action
             */
            /**
             * @name dxTreeListOptions.onRowPrepared
             * @type function(e)
             * @type_function_param1 e:object
             * @type_function_param1_field4 data:object
             * @type_function_param1_field5 key:any
             * @type_function_param1_field6 values:Array<Object>
             * @type_function_param1_field7 columns:Array<dxTreeListColumn>
             * @type_function_param1_field8 rowIndex:number
             * @type_function_param1_field9 rowType:string
             * @type_function_param1_field10 isSelected:boolean
             * @type_function_param1_field11 isExpanded:boolean
             * @type_function_param1_field12 rowElement:dxElement
             * @extends Action
             * @action
             */
            activeStateEnabled: false,
            /**
             * @name GridBaseOptions.twoWayBindingEnabled
             * @type boolean
             * @default true
             */
            twoWayBindingEnabled: true
        };
    },
    views: {
        rowsView: columnsView.ColumnsView.inherit((function() {
            var defaultCellTemplate = function($container, options) {
                var isDataTextEmpty = isEmpty(options.text) && options.rowType === "data";
                var text = options.text;
                var container = $container.get(0);

                if(isDataTextEmpty) {
                    setEmptyText($container);
                } else if(options.column.encodeHtml) {
                    container.textContent = text;
                } else {
                    container.innerHTML = text;
                }
            };

            var getScrollableBottomPadding = function(that) {
                var scrollable = that.getScrollable();
                return scrollable ? Math.ceil(parseFloat(scrollable.$content().css("paddingBottom"))) : 0;
            };

            return {
                _getDefaultTemplate: function(column) {
                    switch(column.command) {
                        case "empty":
                            return function(container) {
                                container.html("&nbsp;");
                            };
                        default:
                            return defaultCellTemplate;
                    }
                },

                _getDefaultGroupTemplate: function(column) {
                    var that = this;
                    var summaryTexts = that.option("summary.texts");

                    return function($container, options) {
                        var data = options.data;
                        var text = options.column.caption + ": " + options.text;
                        var container = $container.get(0);

                        if(options.summaryItems && options.summaryItems.length) {
                            text += " " + getGroupRowSummaryText(options.summaryItems, summaryTexts);
                        }

                        if(data) {
                            if(options.groupContinuedMessage && options.groupContinuesMessage) {
                                text += " (" + options.groupContinuedMessage + ". " + options.groupContinuesMessage + ")";
                            } else if(options.groupContinuesMessage) {
                                text += " (" + options.groupContinuesMessage + ")";
                            } else if(options.groupContinuedMessage) {
                                text += " (" + options.groupContinuedMessage + ")";
                            }
                        }

                        $container.addClass(GROUP_CELL_CLASS);

                        if(column.encodeHtml) {
                            container.textContent = text;
                        } else {
                            container.innerHTML = text;
                        }
                    };
                },

                _update: function() { },

                _getCellTemplate: function(options) {
                    var that = this;
                    var column = options.column;
                    var template;

                    if(options.rowType === "group" && isDefined(column.groupIndex) && !column.showWhenGrouped && !column.command) {
                        template = column.groupCellTemplate || { allowRenderToDetachedContainer: true, render: that._getDefaultGroupTemplate(column) };
                    } else {
                        template = column.cellTemplate || { allowRenderToDetachedContainer: true, render: that._getDefaultTemplate(column) };
                    }

                    return template;
                },

                _createRow: function(row) {
                    var $row = this.callBase(row);
                    var isGroup;
                    var isDataRow;
                    var isRowExpanded;

                    if(row) {
                        isGroup = row.rowType === "group";
                        isDataRow = row.rowType === "data";

                        isDataRow && $row.addClass(DATA_ROW_CLASS);
                        isDataRow && this.option("showRowLines") && $row.addClass(ROW_LINES_CLASS);

                        this.option("showColumnLines") && $row.addClass(COLUMN_LINES_CLASS);

                        if(row.visible === false) {
                            $row.hide();
                        }

                        if(isGroup) {
                            $row.addClass(GROUP_ROW_CLASS);
                            isRowExpanded = row.isExpanded;
                            this.setAria("role", "row", $row);
                            this.setAria("expanded", isDefined(isRowExpanded) && isRowExpanded.toString(), $row);
                        }
                    }

                    return $row;
                },

                _rowPrepared: function($row, row) {
                    if(row.rowType === "data") {
                        if(this.option("rowAlternationEnabled")) {
                            var getRowAlt = () => {
                                return row.dataIndex % 2 === 1;
                            };
                            getRowAlt() && $row.addClass(ROW_ALTERNATION_CLASS);
                            row.watch && row.watch(getRowAlt, value => {
                                $row.toggleClass(ROW_ALTERNATION_CLASS, value);
                            });
                        }

                        this._setAriaRowIndex(row, $row);
                        row.watch && row.watch(() => row.rowIndex, () => this._setAriaRowIndex(row, $row));
                    }

                    this.callBase.apply(this, arguments);
                },

                _setAriaRowIndex: function(row, $row) {
                    var component = this.component;
                    var isPagerMode = component.option("scrolling.mode") === "standard" && component.option("scrolling.rowRenderingMode") !== "virtual";
                    var rowIndex = row.rowIndex + 1;

                    if(isPagerMode) {
                        rowIndex = component.pageIndex() * component.pageSize() + rowIndex;
                    } else {
                        rowIndex += this._dataController.getRowIndexOffset();
                    }
                    this.setAria("rowindex", rowIndex, $row);
                },

                _afterRowPrepared: function(e) {
                    var arg = e.args[0];
                    var dataController = this._dataController;
                    var watch = this.option("integrationOptions.watchMethod");

                    if(!arg.data || arg.rowType !== "data" || arg.inserted || !this.option("twoWayBindingEnabled") || !watch) return;

                    var dispose = watch(
                        () => {
                            return dataController.generateDataValues(arg.data, arg.columns);
                        },
                        () => {
                            dataController.repaintRows([arg.rowIndex], this.option("repaintChangesOnly"));
                        },
                        {
                            deep: true,
                            skipImmediate: true
                        }
                    );

                    eventsEngine.on(arg.rowElement, removeEvent, dispose);
                },

                _renderScrollable: function(force) {
                    var that = this;
                    var $element = that.element();

                    if(!$element.children().length) {
                        $element.append("<div>");
                    }
                    if((force || !that._loadPanel)) {
                        that._renderLoadPanel($element, $element.parent(), that._dataController.isLocalStore());
                    }

                    if((force || !that.getScrollable()) && that._dataController.isLoaded()) {
                        var columns = that.getColumns();
                        var allColumnsHasWidth = true;

                        for(var i = 0; i < columns.length; i++) {
                            if(!columns[i].width && !columns[i].minWidth) {
                                allColumnsHasWidth = false;
                                break;
                            }
                        }

                        if(that.option("columnAutoWidth") || that._hasHeight || allColumnsHasWidth || that._columnsController._isColumnFixing()) {
                            that._renderScrollableCore($element);
                        }
                    }
                },

                _handleScroll: function(e) {
                    var that = this;

                    that._isScrollByEvent = !!e.event;
                    that._scrollTop = e.scrollOffset.top;
                    that._scrollLeft = e.scrollOffset.left;
                    that.scrollChanged.fire(e.scrollOffset, that.name);
                },

                _renderScrollableCore: function($element) {
                    var that = this;
                    var dxScrollableOptions = that._createScrollableOptions();
                    var scrollHandler = that._handleScroll.bind(that);

                    dxScrollableOptions.onScroll = scrollHandler;
                    dxScrollableOptions.onStop = scrollHandler;

                    that._scrollable = that._createComponent($element, Scrollable, dxScrollableOptions);
                    that._scrollableContainer = that._scrollable && that._scrollable._$container;
                },

                _renderLoadPanel: renderLoadPanel,

                _renderContent: function(contentElement, tableElement) {
                    contentElement.replaceWith($("<div>")
                        .addClass(this.addWidgetPrefix(CONTENT_CLASS))
                        .append(tableElement));

                    return this._findContentElement();
                },

                _updateContent: function(newTableElement, change) {
                    var that = this;
                    var tableElement = that._getTableElement();
                    var contentElement = that._findContentElement();
                    var changeType = change && change.changeType;
                    var executors = [];
                    var highlightChanges = this.option("highlightChanges");
                    var rowInsertedClass = this.addWidgetPrefix(ROW_INSERTED_ANIMATION_CLASS);

                    switch(changeType) {
                        case "update":
                            each(change.rowIndices, function(index, rowIndex) {
                                var $newRowElement = that._getRowElements(newTableElement).eq(index);
                                var changeType = change.changeTypes && change.changeTypes[index];
                                var item = change.items && change.items[index];

                                executors.push(function() {
                                    var $rowsElement = that._getRowElements();
                                    var $rowElement = $rowsElement.eq(rowIndex);

                                    switch(changeType) {
                                        case "update":
                                            if(item) {
                                                var columnIndices = change.columnIndices && change.columnIndices[index];
                                                if(isDefined(item.visible) && item.visible !== $rowElement.is(":visible")) {
                                                    $rowElement.toggle(item.visible);
                                                } else if(columnIndices) {
                                                    that._updateCells($rowElement, $newRowElement, columnIndices);
                                                } else {
                                                    $rowElement.replaceWith($newRowElement);
                                                }
                                            }
                                            break;
                                        case "insert":
                                            if(!$rowsElement.length) {
                                                $newRowElement.prependTo(tableElement.children("tbody"));
                                            } else if($rowElement.length) {
                                                $newRowElement.insertBefore($rowElement);
                                            } else {
                                                $newRowElement.insertAfter($rowsElement.last());
                                            }
                                            if(highlightChanges && change.isLiveUpdate) {
                                                $newRowElement.addClass(rowInsertedClass);
                                            }
                                            break;
                                        case "remove":
                                            $rowElement.remove();
                                            break;
                                    }
                                });
                            });
                            each(executors, function() {
                                this();
                            });

                            newTableElement.remove();
                            break;
                        default:
                            that._setTableElement(newTableElement);
                            contentElement.addClass(that.addWidgetPrefix(CONTENT_CLASS));
                            that._renderContent(contentElement, newTableElement);
                            break;
                    }
                },

                _createEmptyRow: function(className, isFixed, height) {
                    var that = this;
                    var i;
                    var $cell;
                    var $row = that._createRow();
                    var columns = isFixed ? this.getFixedColumns() : this.getColumns();

                    $row
                        .addClass(className)
                        .toggleClass(COLUMN_LINES_CLASS, that.option("showColumnLines"));

                    for(i = 0; i < columns.length; i++) {
                        $cell = that._createCell({ column: columns[i], rowType: "freeSpace", columnIndex: i, columns: columns });
                        isNumeric(height) && $cell.css("height", height);

                        $row.append($cell);
                    }

                    that.setAria("role", "presentation", $row);

                    return $row;
                },

                _appendEmptyRow: function($table, $emptyRow, location) {
                    var $tBodies = this._getBodies($table);
                    var $container = $tBodies.length && !$emptyRow.is("tbody") ? $tBodies : $table;

                    if(location === "top") {
                        $container.first().prepend($emptyRow);
                    } else {
                        $container.last().append($emptyRow);
                    }
                },

                _renderFreeSpaceRow: function($tableElement) {
                    var $freeSpaceRowElement = this._createEmptyRow(FREE_SPACE_CLASS);

                    $freeSpaceRowElement = this._wrapRowIfNeed($tableElement, $freeSpaceRowElement);

                    this._appendEmptyRow($tableElement, $freeSpaceRowElement);
                },

                _checkRowKeys: function(options) {
                    var that = this;
                    var rows = that._getRows(options);
                    var keyExpr = that._dataController.store() && that._dataController.store().key();

                    keyExpr && rows.some(function(row) {
                        if(row.rowType === "data" && row.key === undefined) {
                            that._dataController.fireError("E1046", keyExpr);
                            return true;
                        }
                    });
                },

                _needUpdateRowHeight: function(itemsCount) {
                    return itemsCount > 0 && !this._rowHeight;
                },

                _getRowsHeight: function($tableElement) {
                    var $rowElements = $tableElement.children("tbody").children().not(".dx-virtual-row").not("." + FREE_SPACE_CLASS);

                    return $rowElements.toArray().reduce(function(sum, row) {
                        return sum + row.getBoundingClientRect().height;
                    }, 0);
                },

                _updateRowHeight: function() {
                    var that = this;
                    var rowsHeight;
                    var $tableElement = that._getTableElement();
                    var itemsCount = that._dataController.items().length;

                    if($tableElement && that._needUpdateRowHeight(itemsCount)) {
                        rowsHeight = that._getRowsHeight($tableElement);
                        that._rowHeight = rowsHeight / itemsCount;
                    }
                },

                _findContentElement: function() {
                    var $content = this.element();
                    var scrollable = this.getScrollable();

                    if($content) {
                        if(scrollable) {
                            $content = scrollable.$content();
                        }
                        return $content.children().first();
                    }
                },

                _getRowElements: function(tableElement) {
                    var $rows = this.callBase(tableElement);

                    return $rows && $rows.not("." + FREE_SPACE_CLASS);
                },

                _getFreeSpaceRowElements: function($table) {
                    var tableElements = $table || this.getTableElements();

                    return tableElements && tableElements.children("tbody").children("." + FREE_SPACE_CLASS);
                },

                _getNoDataText: function() {
                    return this.option("noDataText");
                },

                _rowClick: function(e) {
                    var item = this._dataController.items()[e.rowIndex] || {};
                    this.executeAction("onRowClick", extend({
                        evaluate: function(expr) {
                            var getter = compileGetter(expr);
                            return getter(item.data);
                        } }, e, item));
                },

                _getColumnsCountBeforeGroups: function(columns) {
                    for(var i = 0; i < columns.length; i++) {
                        if(columns[i].type === "groupExpand") {
                            return i;
                        }
                    }

                    return 0;
                },

                _getGroupCellOptions: function(options) {
                    var columnsCountBeforeGroups = this._getColumnsCountBeforeGroups(options.columns);
                    var columnIndex = (options.row.groupIndex || 0) + columnsCountBeforeGroups;

                    return {
                        columnIndex: columnIndex,
                        colspan: options.columns.length - columnIndex - 1
                    };
                },

                _renderCells: function($row, options) {
                    if(options.row.rowType === "group") {
                        this._renderGroupedCells($row, options);
                    } else if(options.row.values) {
                        this.callBase($row, options);
                    }
                },

                _renderGroupedCells: function($row, options) {
                    var row = options.row;
                    var i;
                    var expandColumn;
                    var columns = options.columns;
                    var rowIndex = row.rowIndex;
                    var isExpanded;
                    var groupColumn;
                    var groupColumnAlignment;
                    var groupCellOptions = this._getGroupCellOptions(options);

                    for(i = 0; i <= groupCellOptions.columnIndex; i++) {
                        if(i === groupCellOptions.columnIndex && columns[i].allowCollapsing && options.scrollingMode !== "infinite") {
                            isExpanded = !!row.isExpanded;
                            expandColumn = columns[i];
                        } else {
                            isExpanded = null;
                            expandColumn = {
                                command: "expand",
                                cssClass: columns[i].cssClass
                            };
                        }

                        this._renderCell($row, {
                            value: isExpanded,
                            row: row,
                            rowIndex: rowIndex,
                            column: expandColumn,
                            columnIndex: i
                        });
                    }

                    groupColumnAlignment = getDefaultAlignment(this.option("rtlEnabled"));

                    groupColumn = extend(
                        {},
                        columns[groupCellOptions.columnIndex],
                        {
                            command: null,
                            cssClass: null,
                            width: null,
                            showWhenGrouped: false,
                            alignment: groupColumnAlignment
                        }
                    );

                    if(groupCellOptions.colspan > 1) {
                        groupColumn.colspan = groupCellOptions.colspan;
                    }

                    this._renderCell($row, {
                        value: row.values[row.groupIndex],
                        row: row,
                        rowIndex: rowIndex,
                        column: groupColumn,
                        columnIndex: groupCellOptions.columnIndex
                    });
                },

                _renderRows: function($table, options) {
                    var that = this;
                    var scrollingMode = that.option("scrolling.mode");

                    that.callBase($table, extend({
                        scrollingMode: scrollingMode
                    }, options));

                    that._checkRowKeys(options.change);

                    that._renderFreeSpaceRow($table);
                    if(!that._hasHeight) {
                        that.updateFreeSpaceRowHeight($table);
                    }
                },

                _renderRow: function($table, options) {
                    var that = this;
                    var row = options.row;
                    var rowTemplate = that.option("rowTemplate");

                    if((row.rowType === "data" || row.rowType === "group") && !isDefined(row.groupIndex) && rowTemplate) {
                        that.renderTemplate($table, rowTemplate, extend({ columns: options.columns }, row), true);
                    } else {
                        that.callBase($table, options);
                    }
                },

                _renderTable: function(options) {
                    var that = this;
                    var $table = that.callBase(options);

                    var resizeCompletedHandler = function() {
                        var scrollableInstance = that.getScrollable();
                        if(scrollableInstance && that.element().closest(getWindow().document).length) {
                            that.resizeCompleted.remove(resizeCompletedHandler);
                            scrollableInstance._visibilityChanged(true);
                        }
                    };

                    if(!isDefined(that._getTableElement())) {
                        that._setTableElement($table);
                        that._renderScrollable(true);
                        that.resizeCompleted.add(resizeCompletedHandler);
                    } else {
                        that._renderScrollable();
                    }

                    return $table;
                },

                _createTable: function() {
                    var $table = this.callBase.apply(this, arguments);

                    if(this.option("rowTemplate")) {
                        $table.appendTo(this.component.$element());
                    }

                    return $table;
                },

                _renderCore: function(change) {
                    var that = this;
                    var $table;
                    var $element = that.element();

                    $element.addClass(that.addWidgetPrefix(ROWS_VIEW_CLASS)).toggleClass(that.addWidgetPrefix(NOWRAP_CLASS), !that.option("wordWrapEnabled"));
                    $element.toggleClass(EMPTY_CLASS, that._dataController.items().length === 0);

                    that.setAria("role", "presentation", $element);

                    $table = that._renderTable({ change: change });
                    that._updateContent($table, change);

                    that.callBase(change);

                    that._lastColumnWidths = null;
                },

                _getRows: function(change) {
                    return change && change.items || this._dataController.items();
                },

                _getCellOptions: function(options) {
                    var that = this;
                    var parameters;
                    var column = options.column;
                    var row = options.row;
                    var data = row.data;
                    var summaryCells = row && row.summaryCells;
                    var value = options.value;
                    var displayValue = getDisplayValue(column, value, data, row.rowType);
                    var groupingTextsOptions;
                    var scrollingMode;

                    parameters = this.callBase(options);
                    parameters.value = value;
                    parameters.oldValue = options.oldValue;
                    parameters.displayValue = displayValue;
                    parameters.row = row;
                    parameters.key = row.key;
                    parameters.data = data;
                    parameters.rowType = row.rowType;
                    parameters.values = row.values;
                    parameters.text = !column.command ? formatValue(displayValue, column) : "";
                    parameters.rowIndex = row.rowIndex;
                    parameters.summaryItems = summaryCells && summaryCells[options.columnIndex];
                    parameters.resized = column.resizedCallbacks;

                    if(isDefined(column.groupIndex) && !column.command) {
                        groupingTextsOptions = that.option("grouping.texts");
                        scrollingMode = that.option("scrolling.mode");
                        if(scrollingMode !== "virtual" && scrollingMode !== "infinite") {
                            parameters.groupContinuesMessage = data && data.isContinuationOnNextPage && groupingTextsOptions && groupingTextsOptions.groupContinuesMessage;
                            parameters.groupContinuedMessage = data && data.isContinuation && groupingTextsOptions && groupingTextsOptions.groupContinuedMessage;
                        }
                    }

                    return parameters;
                },

                _setRowsOpacityCore: function($rows, visibleColumns, columnIndex, value) {
                    var columnsController = this._columnsController;
                    var columns = columnsController.getColumns();
                    var column = columns && columns[columnIndex];
                    var columnID = column && column.isBand && column.index;

                    each($rows, function(rowIndex, row) {
                        if(!$(row).hasClass(GROUP_ROW_CLASS)) {
                            for(var i = 0; i < visibleColumns.length; i++) {
                                if(isNumeric(columnID) && columnsController.isParentBandColumn(visibleColumns[i].index, columnID) || visibleColumns[i].index === columnIndex) {
                                    $rows.eq(rowIndex).children().eq(i).css({ opacity: value });
                                    if(!isNumeric(columnID)) {
                                        break;
                                    }
                                }
                            }
                        }
                    });
                },

                _getDevicePixelRatio: function() {
                    return getWindow().devicePixelRatio;
                },

                renderNoDataText: renderNoDataText,

                getCellOptions: function(rowIndex, columnIdentifier) {
                    var rowOptions = this._dataController.items()[rowIndex];
                    var cellOptions;
                    var column;

                    if(rowOptions) {
                        if(isString(columnIdentifier)) {
                            column = this._columnsController.columnOption(columnIdentifier);
                        } else {
                            column = this._columnsController.getVisibleColumns()[columnIdentifier];
                        }

                        if(column) {
                            cellOptions = this._getCellOptions({
                                value: column.calculateCellValue(rowOptions.data),
                                rowIndex: rowOptions.rowIndex,
                                row: rowOptions,
                                column: column
                            });
                        }
                    }
                    return cellOptions;
                },

                getRow: function(index) {
                    if(index >= 0) {
                        var rows = this._getRowElements();

                        if(rows.length > index) {
                            return $(rows[index]);
                        }
                    }
                },

                getCellIndex: function($cell) {
                    var cellIndex = $cell.length ? $cell[0].cellIndex : -1;

                    return cellIndex;
                },

                updateFreeSpaceRowHeight: function($table) {
                    var that = this;
                    var itemCount = that._dataController.items().length;
                    var contentElement = that._findContentElement();
                    var freeSpaceRowElements = that._getFreeSpaceRowElements($table);
                    var freeSpaceRowCount;
                    var scrollingMode;

                    if(freeSpaceRowElements && contentElement) {
                        var isFreeSpaceRowVisible = false;

                        if(itemCount > 0) {
                            if(!that._hasHeight) {
                                freeSpaceRowCount = that._dataController.pageSize() - itemCount;
                                scrollingMode = that.option("scrolling.mode");

                                if(freeSpaceRowCount > 0 && that._dataController.pageCount() > 1 && scrollingMode !== "virtual" && scrollingMode !== "infinite") {
                                    styleUtils.setHeight(freeSpaceRowElements, freeSpaceRowCount * that._rowHeight);
                                    isFreeSpaceRowVisible = true;
                                }
                                if(!isFreeSpaceRowVisible && $table) {
                                    styleUtils.setHeight(freeSpaceRowElements, 0);
                                } else {
                                    freeSpaceRowElements.toggle(isFreeSpaceRowVisible);
                                }
                                that._updateLastRowBorder(isFreeSpaceRowVisible);
                            } else {
                                freeSpaceRowElements.hide();
                                deferUpdate(function() {
                                    var // T697699
                                        scrollablePadding = getScrollableBottomPadding(that);

                                    var scrollbarWidth = that.getScrollbarWidth(true);
                                    var elementHeightWithoutScrollbar = that.element().height() - scrollbarWidth - scrollablePadding;
                                    var contentHeight = contentElement.outerHeight();
                                    var showFreeSpaceRow = (elementHeightWithoutScrollbar - contentHeight) > 0;
                                    var rowsHeight = that._getRowsHeight(contentElement.children().first());
                                    var $tableElement = $table || that.getTableElements();
                                    var borderTopWidth = Math.ceil(parseFloat($tableElement.css("borderTopWidth")));

                                    var // T606935
                                        heightCorrection = browser.webkit && that._getDevicePixelRatio() >= 2 ? 1 : 0;

                                    var resultHeight = elementHeightWithoutScrollbar - rowsHeight - borderTopWidth - heightCorrection;

                                    if(showFreeSpaceRow) {
                                        deferRender(function() {
                                            freeSpaceRowElements.css("height", resultHeight);
                                            isFreeSpaceRowVisible = true;
                                            freeSpaceRowElements.show();
                                        });
                                    }
                                    deferRender(function() {
                                        that._updateLastRowBorder(isFreeSpaceRowVisible);
                                    });
                                });
                            }
                        } else {
                            freeSpaceRowElements.css("height", 0);
                            freeSpaceRowElements.show();
                            that._updateLastRowBorder(true);
                        }
                    }
                },

                _columnOptionChanged: function(e) {
                    var optionNames = e.optionNames;

                    if(e.changeTypes.grouping) return;

                    if(optionNames.width || optionNames.visibleWidth) {
                        this.callBase(e);
                        this._fireColumnResizedCallbacks();
                    }
                },

                /**
                 * @name GridBaseMethods.getScrollable
                 * @publicName getScrollable()
                 * @return dxScrollable
                 */
                getScrollable: function() {
                    return this._scrollable;
                },

                init: function() {
                    var that = this;
                    var dataController = that.getController("data");

                    that.callBase();
                    that._editorFactoryController = that.getController("editorFactory");
                    that._rowHeight = 0;
                    that._scrollTop = 0;
                    that._scrollLeft = -1;
                    that._hasHeight = false;
                    dataController.loadingChanged.add(function(isLoading, messageText) {
                        that.setLoading(isLoading, messageText);
                    });

                    dataController.dataSourceChanged.add(function() {
                        if(that._scrollLeft >= 0) {
                            that._handleScroll({ scrollOffset: { top: that._scrollTop, left: that._scrollLeft } });
                        }
                    });
                },

                _handleDataChanged: function(change) {
                    var that = this;

                    switch(change.changeType) {
                        case "refresh":
                        case "prepend":
                        case "append":
                        case "update":
                            that.render(null, change);
                            break;
                        default:
                            that._update(change);
                            break;
                    }
                },

                publicMethods: function() {
                    return ["isScrollbarVisible", "getTopVisibleRowData", "getScrollbarWidth", "getCellElement", "getRowElement", "getScrollable"];
                },

                contentWidth: function() {
                    return this.element().width() - this.getScrollbarWidth();
                },

                getScrollbarWidth: function(isHorizontal) {
                    var scrollableContainer = this._scrollableContainer && this._scrollableContainer.get(0);
                    var scrollbarWidth = 0;

                    if(scrollableContainer) {
                        if(!isHorizontal) {
                            scrollbarWidth = scrollableContainer.clientWidth ? scrollableContainer.offsetWidth - scrollableContainer.clientWidth : 0;
                        } else {
                            scrollbarWidth = scrollableContainer.clientHeight ? scrollableContainer.offsetHeight - scrollableContainer.clientHeight : 0;
                            scrollbarWidth += getScrollableBottomPadding(this); // T703649
                        }
                    }
                    return scrollbarWidth > 0 ? scrollbarWidth : 0;
                },

                // TODO remove this call, move _fireColumnResizedCallbacks functionality to columnsController
                _fireColumnResizedCallbacks: function() {
                    var that = this;
                    var lastColumnWidths = that._lastColumnWidths || [];
                    var columnWidths = [];
                    var columns = that.getColumns();
                    var i;

                    for(i = 0; i < columns.length; i++) {
                        columnWidths[i] = columns[i].visibleWidth;
                        if(columns[i].resizedCallbacks && !isDefined(columns[i].groupIndex) && lastColumnWidths[i] !== columnWidths[i]) {
                            columns[i].resizedCallbacks.fire(columnWidths[i]);
                        }
                    }

                    that._lastColumnWidths = columnWidths;
                },

                _updateLastRowBorder: function(isFreeSpaceRowVisible) {
                    if(this.option("showBorders") && this.option("showRowLines") && !isFreeSpaceRowVisible) {
                        this.element().addClass(LAST_ROW_BORDER);
                    } else {
                        this.element().removeClass(LAST_ROW_BORDER);
                    }
                },

                _updateScrollable: function() {
                    var dxScrollable = Scrollable.getInstance(this.element());

                    if(dxScrollable) {
                        dxScrollable.update();
                        this._updateHorizontalScrollPosition();
                    }
                },

                _updateHorizontalScrollPosition: function() {
                    var scrollable = this.getScrollable();
                    var scrollLeft = scrollable && scrollable.scrollOffset().left;

                    if(this._scrollLeft >= 0 && scrollLeft !== this._scrollLeft) {
                        scrollable.scrollTo({ x: this._scrollLeft });
                    }
                },

                _resizeCore: function() {
                    var that = this;

                    that._fireColumnResizedCallbacks();
                    that._updateRowHeight();
                    deferRender(function() {
                        that._renderScrollable();
                        that.renderNoDataText();
                        that.updateFreeSpaceRowHeight();
                        deferUpdate(function() {
                            that._updateScrollable();
                        });
                    });
                },

                scrollTo: function(location) {
                    var $element = this.element();
                    var dxScrollable = $element && Scrollable.getInstance($element);

                    if(dxScrollable) {
                        dxScrollable.scrollTo(location);
                    }
                },

                height: function(height, hasHeight) {
                    var that = this;
                    var $element = this.element();

                    if(arguments.length === 0) {
                        return $element ? $element.outerHeight(true) : 0;
                    }

                    that._hasHeight = hasHeight === undefined ? height !== "auto" : hasHeight;

                    if(isDefined(height) && $element) {
                        styleUtils.setHeight($element, height);
                    }
                },

                setLoading: function(isLoading, messageText) {
                    var that = this;
                    var loadPanel = that._loadPanel;
                    var dataController = that._dataController;
                    var loadPanelOptions = that.option("loadPanel") || {};
                    var animation = dataController.isLoaded() ? loadPanelOptions.animation : null;
                    var $element = that.element();
                    var visibilityOptions;

                    if(!hasWindow()) {
                        return;
                    }

                    if(!loadPanel && messageText !== undefined && dataController.isLocalStore() && loadPanelOptions.enabled === "auto" && $element) {
                        that._renderLoadPanel($element, $element.parent());
                        loadPanel = that._loadPanel;
                    }
                    if(loadPanel) {
                        visibilityOptions = {
                            message: messageText || loadPanelOptions.text,
                            animation: animation,
                            visible: isLoading
                        };
                        clearTimeout(that._hideLoadingTimeoutID);
                        if(loadPanel.option("visible") && !isLoading) {
                            that._hideLoadingTimeoutID = setTimeout(function() {
                                loadPanel.option(visibilityOptions);
                            }, LOADPANEL_HIDE_TIMEOUT);
                        } else {
                            loadPanel.option(visibilityOptions);
                        }
                    }
                },

                setRowsOpacity: function(columnIndex, value) {
                    var $rows = this._getRowElements().not("." + GROUP_ROW_CLASS) || [];
                    this._setRowsOpacityCore($rows, this.getColumns(), columnIndex, value);
                },

                _getCellElementsCore: function(rowIndex) {
                    var $cells = this.callBase(rowIndex);
                    var groupCellIndex;

                    if($cells) {
                        groupCellIndex = $cells.filter("." + GROUP_CELL_CLASS).index();
                        if(groupCellIndex >= 0 && $cells.length > groupCellIndex + 1) {
                            return $cells.slice(0, groupCellIndex + 1);
                        }
                    }
                    return $cells;
                },

                getTopVisibleItemIndex: function() {
                    var that = this;
                    var itemIndex = 0;
                    var prevOffsetTop = 0;
                    var offsetTop = 0;
                    var rowElements;
                    var rowElement;
                    var scrollPosition = that._scrollTop;
                    var $contentElement = that._findContentElement();
                    var contentElementOffsetTop = $contentElement && $contentElement.offset().top;
                    var items = that._dataController.items();
                    var tableElement = that._getTableElement();

                    if(items.length && tableElement) {
                        rowElements = that._getRowElements(tableElement).filter(":visible");

                        for(itemIndex = 0; itemIndex < items.length; itemIndex++) {
                            prevOffsetTop = offsetTop;
                            rowElement = rowElements.eq(itemIndex);
                            if(rowElement.length) {
                                offsetTop = rowElement.offset().top - contentElementOffsetTop;
                                if(offsetTop > scrollPosition) {
                                    if(scrollPosition * 2 < Math.round(offsetTop + prevOffsetTop) && itemIndex) {
                                        itemIndex--;
                                    }
                                    break;
                                }
                            }
                        }
                        if(itemIndex && itemIndex === items.length) {
                            itemIndex--;
                        }
                    }

                    return itemIndex;
                },

                getTopVisibleRowData: function() {
                    var itemIndex = this.getTopVisibleItemIndex();
                    var items = this._dataController.items();

                    if(items[itemIndex]) {
                        return items[itemIndex].data;
                    }
                },

                optionChanged: function(args) {
                    var that = this;

                    that.callBase(args);

                    switch(args.name) {
                        case "wordWrapEnabled":
                        case "showColumnLines":
                        case "showRowLines":
                        case "rowAlternationEnabled":
                        case "rowTemplate":
                        case "twoWayBindingEnabled":
                            that._invalidate(true, true);
                            args.handled = true;
                            break;
                        case "scrolling":
                            that._rowHeight = null;
                            that._tableElement = null;
                            args.handled = true;
                            break;
                        case "rtlEnabled":
                            that._rowHeight = null;
                            that._tableElement = null;
                            break;
                        case "loadPanel":
                            that._tableElement = null;
                            that._invalidate(true, true);
                            args.handled = true;
                            break;
                        case "noDataText":
                            that.renderNoDataText();
                            args.handled = true;
                            break;
                    }
                },

                dispose: function() {
                    clearTimeout(this._hideLoadingTimeoutID);
                },

                setScrollerSpacing: function() { }
            };
        })())
    }
};
/**
 * @name dxDataGridRowObject
 * @type object
 */
/**
 * @name dxTreeListRowObject
 * @type object
 */
/**
 * @name dxDataGridRowObject.data
 * @type object
 */

/**
 * @name dxTreeListRowObject.node
 * @type dxTreeListNode
 */

/**
 * @name dxTreeListRowObject.level
 * @type number
 */

/**
 * @name dxDataGridRowObject.key
 * @type any
 */
/**
 * @name dxTreeListRowObject.key
 * @type any
 */

/**
 * @name dxDataGridRowObject.rowIndex
 * @type number
 */
/**
 * @name dxTreeListRowObject.rowIndex
 * @type number
 */

/**
 * @name dxDataGridRowObject.rowType
 * @type string
 */
/**
 * @name dxTreeListRowObject.rowType
 * @type string
 */

/**
 * @name dxDataGridRowObject.groupIndex
 * @type number
 */

/**
 * @name dxDataGridRowObject.isExpanded
 * @type boolean
 */
/**
 * @name dxTreeListRowObject.isExpanded
 * @type boolean
 */

/**
 * @name dxDataGridRowObject.isSelected
 * @type boolean
 */
/**
 * @name dxTreeListRowObject.isSelected
 * @type boolean
 */

/**
 * @name dxDataGridRowObject.values
 * @type Array<any>
 */
/**
 * @name dxTreeListRowObject.values
 * @type Array<any>
 */

/**
 * @name dxDataGridRowObject.isEditing
 * @type boolean
 */
/**
 * @name dxTreeListRowObject.isEditing
 * @type boolean
 */
