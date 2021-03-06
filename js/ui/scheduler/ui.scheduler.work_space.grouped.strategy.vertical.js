"use strict";

var GroupedStrategy = require("./ui.scheduler.work_space.grouped.strategy");

var VERTICAL_GROUPED_ATTR = "dx-group-column-count";

var DATE_HEADER_OFFSET = 10;

var VerticalGroupedStrategy = GroupedStrategy.inherit({
    prepareCellIndexes: function(cellCoordinates, groupIndex, inAllDayRow) {
        var rowIndex = cellCoordinates.rowIndex + groupIndex * this._workSpace._getRowCount();

        if(this._workSpace.supportAllDayRow() && this._workSpace.option("showAllDayPanel")) {
            rowIndex += groupIndex;

            if(!inAllDayRow) {
                rowIndex += 1;
            }
        }

        return {
            rowIndex: rowIndex,
            cellIndex: cellCoordinates.cellIndex
        };
    },

    calculateCellIndex: function(rowIndex, cellIndex) {
        rowIndex = rowIndex % this._workSpace._getRowCount();

        return this._workSpace._getRowCount() * cellIndex + rowIndex;
    },

    getGroupIndex: function(rowIndex, cellIndex) {
        return Math.floor(rowIndex / this._workSpace._getRowCount());
    },

    calculateHeaderCellRepeatCount: function() {
        return 1;
    },

    insertAllDayRowsIntoDateTable: function() {
        return this._workSpace.option("showAllDayPanel");
    },

    getTotalCellCount: function(groupCount) {
        return this._workSpace._getCellCount();
    },

    getTotalRowCount: function() {
        return this._workSpace._getRowCount() * this._workSpace._getGroupCount();
    },

    addAdditionalGroupCellClasses: function(cellClass, index, i, j) {
        cellClass = this._addLastGroupCellClass(cellClass, i + 1);

        return this._addFirstGroupCellClass(cellClass, i + 1);
    },

    _addLastGroupCellClass: function(cellClass, index) {
        if(index % this._workSpace._getRowCount() === 0) {
            return cellClass + " " + this.getLastGroupCellClass();
        }

        return cellClass;
    },

    _addFirstGroupCellClass: function(cellClass, index) {
        if((index - 1) % this._workSpace._getRowCount() === 0) {
            return cellClass + " " + this.getFirstGroupCellClass();
        }

        return cellClass;
    },

    getHorizontalMax: function(groupIndex) {
        return this._workSpace.getMaxAllowedPosition()[0];
    },

    getVerticalMax: function(groupIndex) {
        var maxAllowedPosition = this._workSpace.getMaxAllowedVerticalPosition()[groupIndex];

        if(this._workSpace.supportAllDayRow() && this._workSpace.option("showAllDayPanel")) {
            maxAllowedPosition += maxAllowedPosition + this._workSpace.getCellHeight() * groupIndex;
        }

        return maxAllowedPosition;
    },

    calculateTimeCellRepeatCount: function() {
        return this._workSpace._getGroupCount() || 1;
    },

    getWorkSpaceMinWidth: function() {
        var minWidth = this._workSpace._getWorkSpaceWidth(),
            workspaceContainerWidth = this._workSpace.$element().outerWidth() - this._workSpace.getTimePanelWidth() - this._workSpace.getGroupTableWidth();

        if(minWidth < workspaceContainerWidth) {
            minWidth = workspaceContainerWidth;
        }

        return minWidth;
    },

    getAllDayOffset: function() {
        return 0;
    },

    getAllDayTableHeight: function() {
        return 0;
    },

    getGroupCountAttr: function() {
        return {
            attr: VERTICAL_GROUPED_ATTR,
            count: this._workSpace.option("groups") && this._workSpace.option("groups").length
        };
    },

    getLeftOffset: function() {
        return this._workSpace.getTimePanelWidth() + this._workSpace.getGroupTableWidth();
    },

    getGroupBoundsOffset: function(cellCount, $cells, cellWidth, coordinates) {
        var groupIndex = coordinates.groupIndex,
            startOffset = $cells.eq(0).offset().left,
            endOffset = $cells.eq(cellCount - 1).offset().left + cellWidth,
            dayHeight = (this._workSpace._calculateDayDuration() / this._workSpace.option("hoursInterval")) * this._workSpace.getCellHeight(),
            topOffset = groupIndex * dayHeight + this._workSpace._$thead.outerHeight() + this._workSpace.invoke("getHeaderHeight") + DATE_HEADER_OFFSET;

        if(this._workSpace.option("showAllDayPanel") && this._workSpace.supportAllDayRow()) {
            topOffset += this._workSpace.getCellHeight();
        }

        var bottomOffset = topOffset + dayHeight;

        return {
            left: startOffset,
            right: endOffset,
            top: topOffset,
            bottom: bottomOffset
        };
    },

    shiftIndicator: function($indicator, height, rtlOffset, i) {
        var offset = this._workSpace.getIndicatorOffset(0),
            horizontalOffset = rtlOffset ? rtlOffset - offset : offset,
            verticalOffset = this._workSpace._getRowCount() * this._workSpace.getCellHeight() * i;

        if(this._workSpace.supportAllDayRow() && this._workSpace.option("showAllDayPanel")) {
            verticalOffset += this._workSpace.getCellHeight() * (i + 1);
        }

        $indicator.css("left", horizontalOffset + this._workSpace.getGroupTableWidth());
        $indicator.css("top", height + verticalOffset);
    },

    getShaderOffset: function(i, width) {
        var offset = this._workSpace.getGroupTableWidth();
        return this._workSpace.option("rtlEnabled") ? this._$container.outerWidth() - offset - this._workSpace.getWorkSpaceLeftOffset() - width : offset;
    },

    getShaderTopOffset: function(i) {
        return 0;
    },

    getShaderHeight: function() {
        var height = this._workSpace.getIndicationHeight();

        if(this._workSpace.supportAllDayRow() && this._workSpace.option("showAllDayPanel")) {
            height += this._workSpace.getCellHeight();
        }

        return height;
    },

    getShaderMaxHeight: function() {
        var height = this._workSpace._getRowCount() * this._workSpace.getCellHeight();

        if(this._workSpace.supportAllDayRow() && this._workSpace.option("showAllDayPanel")) {
            height += this._workSpace.getCellHeight();
        }

        return height;
    },

    getShaderWidth: function(i) {
        return this._workSpace.getIndicationWidth(0);
    },

    getScrollableScrollTop: function(allDay) {
        return this._workSpace.getScrollable().scrollTop();
    }
});

module.exports = VerticalGroupedStrategy;
