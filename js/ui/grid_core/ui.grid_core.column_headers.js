import $ from "../../core/renderer";
import eventsEngine from "../../events/core/events_engine";
import columnsView from "./ui.grid_core.columns_view";
import messageLocalization from "../../localization/message";
import { isDefined } from "../../core/utils/type";
import { each } from "../../core/utils/iterator";
import { extend } from "../../core/utils/extend";

var CELL_CONTENT_CLASS = "text-content";
var HEADERS_CLASS = "headers";
var NOWRAP_CLASS = "nowrap";
var HEADER_ROW_CLASS = "dx-header-row";
var COLUMN_LINES_CLASS = "dx-column-lines";
var CONTEXT_MENU_SORT_ASC_ICON = "context-menu-sort-asc";
var CONTEXT_MENU_SORT_DESC_ICON = "context-menu-sort-desc";
var CONTEXT_MENU_SORT_NONE_ICON = "context-menu-sort-none";
var CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled";
var VISIBILITY_HIDDEN_CLASS = "dx-visibility-hidden";
var TEXT_CONTENT_ALIGNMENT_CLASS_PREFIX = "dx-text-content-alignment-";
var SORT_INDICATOR_CLASS = "dx-sort-indicator";
var HEADER_FILTER_INDICATOR_CLASS = "dx-header-filter-indicator";
var MULTI_ROW_HEADER_CLASS = "dx-header-multi-row";

module.exports = {
    defaultOptions: function() {
        return {
            /**
             * @name GridBaseOptions.showColumnHeaders
             * @type boolean
             * @default true
             */
            showColumnHeaders: true,
            /**
            * @name GridBaseOptions.cellHintEnabled
            * @type boolean
            * @default true
            */
            cellHintEnabled: true
        };
    },
    views: {
        columnHeadersView: columnsView.ColumnsView.inherit((function() {
            var createCellContent = function(that, $cell, options) {
                var showColumnLines;
                var $cellContent = $("<div>").addClass(that.addWidgetPrefix(CELL_CONTENT_CLASS));

                that.setAria("role", "presentation", $cellContent);

                addCssClassesToCellContent(that, $cell, options.column, $cellContent);
                showColumnLines = that.option("showColumnLines");
                return $cellContent[(showColumnLines || options.column.alignment === "right") ? "appendTo" : "prependTo"]($cell);
            };

            var addCssClassesToCellContent = function(that, $cell, column, $cellContent) {
                var $indicatorElements = that._getIndicatorElements($cell, true);
                var $visibleIndicatorElements = that._getIndicatorElements($cell);
                var indicatorCount = $indicatorElements && $indicatorElements.length;
                var columnAlignment = that._getColumnAlignment(column.alignment);

                $cellContent = $cellContent || $cell.children("." + that.addWidgetPrefix(CELL_CONTENT_CLASS));

                $cellContent
                    .toggleClass(TEXT_CONTENT_ALIGNMENT_CLASS_PREFIX + columnAlignment, indicatorCount > 0)
                    .toggleClass(TEXT_CONTENT_ALIGNMENT_CLASS_PREFIX + (columnAlignment === "left" ? "right" : "left"), indicatorCount > 0 && column.alignment === "center")
                    .toggleClass(SORT_INDICATOR_CLASS, !!$visibleIndicatorElements.filter("." + that._getIndicatorClassName("sort")).length)
                    .toggleClass(HEADER_FILTER_INDICATOR_CLASS, !!$visibleIndicatorElements.filter("." + that._getIndicatorClassName("headerFilter")).length);
            };

            return {
                _createTable: function() {
                    var $table = this.callBase.apply(this, arguments);

                    eventsEngine.on($table, "mousedown selectstart", this.createAction(function(e) {
                        var event = e.event;

                        if(event.shiftKey) {
                            event.preventDefault();
                        }
                    }));

                    return $table;
                },

                _getDefaultTemplate: function(column) {
                    var that = this;
                    var template;

                    if(column.command) {
                        template = function($container, options) {
                            var column = options.column;

                            $container.html("&nbsp;");
                            $container.addClass(column.cssClass);
                        };
                    } else {
                        template = function($container, options) {
                            var $content = createCellContent(that, $container, options);
                            $content.text(column.caption);
                        };
                    }

                    return template;
                },

                _getHeaderTemplate: function(column) {
                    return column.headerCellTemplate || { allowRenderToDetachedContainer: true, render: this._getDefaultTemplate(column) };
                },

                _processTemplate: function(template, options) {
                    var that = this;
                    var resultTemplate;
                    var column = options.column;
                    var renderingTemplate = that.callBase(template);

                    if(options.rowType === "header" && renderingTemplate && column.headerCellTemplate && !column.command) {
                        resultTemplate = {
                            render: function(options) {
                                var $content = createCellContent(that, options.container, options.model);
                                renderingTemplate.render(extend({}, options, { container: $content }));
                            }
                        };
                    } else {
                        resultTemplate = renderingTemplate;
                    }

                    return resultTemplate;
                },

                _handleDataChanged: function(e) {
                    if(e.changeType !== "refresh") return;

                    if(this._isGroupingChanged || this._requireReady) {
                        this._isGroupingChanged = false;
                        this.render();
                    }
                },

                _renderCell: function($row, options) {
                    var $cell = this.callBase($row, options);

                    if(options.row.rowType === "header") {
                        $cell.addClass(CELL_FOCUS_DISABLED_CLASS);
                    }

                    return $cell;
                },

                _setCellAriaAttributes: function($cell, cellOptions) {
                    this.callBase($cell, cellOptions);
                    if(cellOptions.rowType === "header") {
                        this.setAria("role", "columnheader", $cell);
                        if(cellOptions.column && !cellOptions.column.command && !cellOptions.column.isBand) {
                            $cell.attr("id", cellOptions.column.headerId);
                            this.setAria("label",
                                messageLocalization.format("dxDataGrid-ariaColumn") + " " + cellOptions.column.caption,
                                $cell);
                        }
                    }
                },

                _createRow: function(row) {
                    var $row = this.callBase(row).toggleClass(COLUMN_LINES_CLASS, this.option("showColumnLines"));

                    if(row.rowType === "header") {
                        $row.addClass(HEADER_ROW_CLASS);
                    }

                    return $row;
                },

                _renderCore: function() {
                    var that = this;
                    var $container = that.element();

                    if(that._tableElement && !that._dataController.isLoaded() && !that._hasRowElements) {
                        return;
                    }

                    $container
                        .addClass(that.addWidgetPrefix(HEADERS_CLASS))
                        .toggleClass(that.addWidgetPrefix(NOWRAP_CLASS), !that.option("wordWrapEnabled"))
                        .empty();

                    that.setAria("role", "presentation", $container);

                    that._updateContent(that._renderTable());

                    if(that.getRowCount() > 1) {
                        $container.addClass(MULTI_ROW_HEADER_CLASS);
                    }

                    that.callBase.apply(that, arguments);
                },

                _renderRows: function() {
                    var that = this;

                    if(that._dataController.isLoaded() || that._hasRowElements) {
                        that.callBase.apply(that, arguments);
                        that._hasRowElements = true;
                    }
                },

                _getRowVisibleColumns: function(rowIndex) {
                    return this._columnsController.getVisibleColumns(rowIndex);
                },

                _renderRow: function($table, options) {
                    options.columns = this._getRowVisibleColumns(options.row.rowIndex);
                    this.callBase($table, options);
                },

                _createCell: function(options) {
                    var column = options.column;
                    var $cellElement = this.callBase.apply(this, arguments);

                    column.rowspan > 1 && options.rowType === "header" && $cellElement.attr("rowSpan", column.rowspan);

                    return $cellElement;
                },

                _getRows: function() {
                    var i;
                    var result = [];
                    var rowCount = this.getRowCount();

                    if(this.option("showColumnHeaders")) {
                        for(i = 0; i < rowCount; i++) {
                            result.push({ rowType: "header", rowIndex: i });
                        }
                    }

                    return result;
                },

                _getCellTemplate: function(options) {
                    if(options.rowType === "header") {
                        return this._getHeaderTemplate(options.column);
                    }
                },

                _columnOptionChanged: function(e) {
                    var changeTypes = e.changeTypes;
                    var optionNames = e.optionNames;

                    if(changeTypes.grouping) {
                        this._isGroupingChanged = true;
                        return;
                    }

                    this.callBase(e);

                    if(optionNames.width || optionNames.visible) {
                        this.resizeCompleted.fire();
                    }
                },

                _isElementVisible: function(elementOptions) {
                    return elementOptions && elementOptions.visible;
                },

                _alignCaptionByCenter: function($cell) {
                    var $indicatorsContainer = this._getIndicatorContainer($cell, true);

                    if($indicatorsContainer && $indicatorsContainer.length) {
                        $indicatorsContainer.filter("." + VISIBILITY_HIDDEN_CLASS).remove();
                        $indicatorsContainer = this._getIndicatorContainer($cell);

                        $indicatorsContainer
                            .clone()
                            .addClass(VISIBILITY_HIDDEN_CLASS)
                            .css("float", "")
                            .insertBefore($cell.children("." + this.addWidgetPrefix(CELL_CONTENT_CLASS)));
                    }
                },

                _updateCell: function($cell, options) {
                    if(options.rowType === "header" && options.column.alignment === "center") {
                        this._alignCaptionByCenter($cell);
                    }

                    this.callBase.apply(this, arguments);
                },

                _updateIndicator: function($cell, column, indicatorName) {
                    var $indicatorElement = this.callBase.apply(this, arguments);

                    if(column.alignment === "center") {
                        this._alignCaptionByCenter($cell);
                    }

                    addCssClassesToCellContent(this, $cell, column);

                    return $indicatorElement;
                },

                _getIndicatorContainer: function($cell, returnAll) {
                    var $indicatorsContainer = this.callBase($cell);

                    return returnAll ? $indicatorsContainer : $indicatorsContainer.filter(":not(." + VISIBILITY_HIDDEN_CLASS + ")");
                },

                _isSortableElement: function() {
                    return true;
                },

                getHeadersRowHeight: function() {
                    var $tableElement = this._getTableElement();
                    var $headerRows = $tableElement && $tableElement.find("." + HEADER_ROW_CLASS);

                    return $headerRows && $headerRows.toArray().reduce(function(sum, headerRow) {
                        return sum + $(headerRow).height();
                    }, 0) || 0;
                },

                getHeaderElement: function(index) {
                    var columnElements = this.getColumnElements();

                    return columnElements && columnElements.eq(index);
                },

                getColumnElements: function(index, bandColumnIndex) {
                    var that = this;
                    var rowIndex;
                    var result;
                    var $cellElement;
                    var visibleColumns;
                    var columnsController = that._columnsController;
                    var rowCount = that.getRowCount();

                    if(that.option("showColumnHeaders")) {
                        if(rowCount > 1 && (!isDefined(index) || isDefined(bandColumnIndex))) {
                            result = [];
                            visibleColumns = isDefined(bandColumnIndex) ? columnsController.getChildrenByBandColumn(bandColumnIndex, true) : columnsController.getVisibleColumns();

                            each(visibleColumns, function(_, column) {
                                rowIndex = isDefined(index) ? index : columnsController.getRowIndex(column.index);
                                $cellElement = that._getCellElement(rowIndex, columnsController.getVisibleIndex(column.index, rowIndex));
                                $cellElement && result.push($cellElement.get(0));
                            });

                            return $(result);
                        } else if(!index || index < rowCount) {
                            return that.getCellElements(index || 0);
                        }
                    }
                },

                getVisibleColumnIndex: function(columnIndex, rowIndex) {
                    var column = this.getColumns()[columnIndex];

                    return column ? this._columnsController.getVisibleIndex(column.index, rowIndex) : -1;
                },

                getColumnWidths: function() {
                    var $columnElements = this.getColumnElements();

                    if($columnElements && $columnElements.length) {
                        return this._getWidths($columnElements);
                    }

                    return this.callBase.apply(this, arguments);
                },

                allowDragging: function(column, sourceLocation, draggingPanels) {
                    var i;
                    var rowIndex = column && this._columnsController.getRowIndex(column.index);
                    var columns = this.getColumns(rowIndex === 0 ? 0 : null);
                    var draggableColumnCount = 0;
                    var draggingPanel;

                    var allowDrag = function(column) {
                        return column.allowReordering || column.allowGrouping || column.allowHiding;
                    };

                    for(i = 0; i < columns.length; i++) {
                        if(allowDrag(columns[i])) {
                            draggableColumnCount++;
                        }
                    }

                    if(draggableColumnCount <= 1) {
                        return false;
                    } else if(!draggingPanels) {
                        return (this.option("allowColumnReordering") || this._columnsController.isColumnOptionUsed("allowReordering")) && column && column.allowReordering;
                    }

                    for(i = 0; i < draggingPanels.length; i++) {
                        draggingPanel = draggingPanels[i];
                        if(draggingPanel && draggingPanel.allowDragging(column, sourceLocation)) {
                            return true;
                        }
                    }

                    return false;
                },

                getBoundingRect: function() {
                    var that = this;
                    var offset;
                    var $columnElements = that.getColumnElements();

                    if($columnElements && $columnElements.length) {
                        offset = that._getTableElement().offset();
                        return {
                            top: offset.top
                        };
                    }
                    return null;
                },

                getName: function() {
                    return "headers";
                },

                getColumnCount: function() {
                    var $columnElements = this.getColumnElements();

                    return $columnElements ? $columnElements.length : 0;
                },

                isVisible: function() {
                    return this.option("showColumnHeaders");
                },

                optionChanged: function(args) {
                    var that = this;

                    switch(args.name) {
                        case "showColumnHeaders":
                        case "wordWrapEnabled":
                        case "showColumnLines":
                            that._invalidate(true, true);
                            args.handled = true;
                            break;
                        default:
                            that.callBase(args);
                    }
                },

                getHeight: function() {
                    return this.getElementHeight();
                },

                getContextMenuItems: function(options) {
                    var that = this;
                    var column = options.column;
                    var onItemClick;
                    var sortingOptions;

                    if(options.row && (options.row.rowType === "header" || options.row.rowType === "detailAdaptive")) {
                        sortingOptions = that.option("sorting");

                        if(sortingOptions && sortingOptions.mode !== "none" && column && column.allowSorting) {
                            onItemClick = function(params) {
                                setTimeout(function() {
                                    that._columnsController.changeSortOrder(column.index, params.itemData.value);
                                });
                            };
                            return [
                                { text: sortingOptions.ascendingText, value: "asc", disabled: column.sortOrder === "asc", icon: CONTEXT_MENU_SORT_ASC_ICON, onItemClick: onItemClick },
                                { text: sortingOptions.descendingText, value: "desc", disabled: column.sortOrder === "desc", icon: CONTEXT_MENU_SORT_DESC_ICON, onItemClick: onItemClick },
                                { text: sortingOptions.clearText, value: "none", disabled: !column.sortOrder, icon: CONTEXT_MENU_SORT_NONE_ICON, onItemClick: onItemClick }
                            ];
                        }
                    }
                },

                getRowCount: function() {
                    return this._columnsController && this._columnsController.getRowCount();
                },

                setRowsOpacity: function(columnIndex, value, rowIndex) {
                    var that = this;
                    var i;
                    var columnElements;
                    var rowCount = that.getRowCount();
                    var columns = that._columnsController.getColumns();
                    var column = columns && columns[columnIndex];
                    var columnID = column && column.isBand && column.index;

                    var setColumnOpacity = function(index, column) {
                        if(column.ownerBand === columnID) {
                            columnElements.eq(index).css({ opacity: value });

                            if(column.isBand) {
                                that.setRowsOpacity(column.index, value, i + 1);
                            }
                        }
                    };

                    if(isDefined(columnID)) {
                        rowIndex = rowIndex || 0;
                        for(i = rowIndex; i < rowCount; i++) {
                            columnElements = that.getCellElements(i);
                            each(that.getColumns(i), setColumnOpacity);
                        }
                    }
                }
            };
        })())
    }
};
