import $ from "../../../core/renderer";
import registerComponent from "../../../core/component_registrator";
import dateUtils from "../../../core/utils/date";
import dateLocalization from "../../../localization/date";
import iteratorUtils from "../../../core/utils/iterator";
var each = iteratorUtils.each;
import SchedulerWorkSpace from "./ui.scheduler.work_space.indicator";

var WEEK_CLASS = "dx-scheduler-work-space-week";

var toMs = dateUtils.dateToMilliseconds;
var SchedulerWorkSpaceWeek = SchedulerWorkSpace.inherit({
    _getElementClass: function() {
        return WEEK_CLASS;
    },

    _getRowCount: function() {
        return this._getCellCountInDay();
    },

    _getCellCount: function() {
        return 7 * this.option("intervalCount");
    },

    _getDateByIndex: function(headerIndex) {
        var resultDate = new Date(this._firstViewDate);
        resultDate.setDate(this._firstViewDate.getDate() + headerIndex);
        return resultDate;
    },

    _getFormat: function() {
        return this._formatWeekdayAndDay;
    },

    _getStartViewDate: function() {
        return dateUtils.getFirstWeekDate(this.option("startDate"), this._firstDayOfWeek() || dateLocalization.firstDayOfWeekIndex());
    },

    _getIntervalDuration: function() {
        return toMs("day") * 7 * this.option("intervalCount");
    },

    _getCellsBetween: function($first, $last) {
        if(this._hasAllDayClass($last)) {
            return this.callBase($first, $last);
        }

        var $cells = this._getCells();
        var firstColumn = $first.index();
        var firstRow = $first.parent().index();
        var lastColumn = $last.index();
        var lastRow = $last.parent().index();
        var groupCount = this._getGroupCount();
        var cellCount = groupCount > 0 ? this._getTotalCellCount(groupCount) : this._getCellCount();
        var rowCount = this._getTotalRowCount(groupCount);
        var result = [];

        for(var i = 0; i < cellCount; i++) {
            for(var j = 0; j < rowCount; j++) {
                var cell = $cells.get(cellCount * j + i);
                result.push(cell);
            }
        }

        var lastCellGroup = this.getCellData($last).groups;
        var indexesDifference = this.option("showAllDayPanel") && this._isVerticalGroupedWorkSpace() ? this._getGroupIndexByResourceId(lastCellGroup) + 1 : 0;
        var newFirstIndex = rowCount * firstColumn + firstRow - indexesDifference;
        var newLastIndex = rowCount * lastColumn + lastRow - indexesDifference;

        if(newFirstIndex > newLastIndex) {
            var buffer = newFirstIndex;
            newFirstIndex = newLastIndex;
            newLastIndex = buffer;
        }

        $cells = $(result).slice(newFirstIndex, newLastIndex + 1);

        if(this._getGroupCount()) {
            var arr = [];
            var focusedGroupIndex = this._getGroupIndexByCell($first);
            each($cells, (function(_, cell) {
                var groupIndex = this._getGroupIndexByCell($(cell));
                if(focusedGroupIndex === groupIndex) {
                    arr.push(cell);
                }
            }).bind(this));
            $cells = $(arr);
        }
        return $cells;
    },

    _getRightCell: function(isMultiSelection) {
        if(!isMultiSelection) {
            return this.callBase(isMultiSelection);
        }
        var $rightCell;
        var $focusedCell = this._$focusedCell;
        var groupCount = this._getGroupCount();
        var rowCellCount = isMultiSelection ? this._getCellCount() : this._getTotalCellCount(groupCount);
        var edgeCellIndex = this._isRTL() ? 0 : rowCellCount - 1;
        var direction = this._isRTL() ? "prev" : "next";

        if($focusedCell.index() === edgeCellIndex || this._isGroupEndCell($focusedCell)) {
            $rightCell = $focusedCell;
        } else {
            $rightCell = $focusedCell[direction]();
            $rightCell = this._checkForViewBounds($rightCell);
        }
        return $rightCell;
    },

    _getLeftCell: function(isMultiSelection) {
        if(!isMultiSelection) {
            return this.callBase(isMultiSelection);
        }
        var $leftCell;
        var $focusedCell = this._$focusedCell;
        var groupCount = this._getGroupCount();
        var rowCellCount = isMultiSelection ? this._getCellCount() : this._getTotalCellCount(groupCount);
        var edgeCellIndex = this._isRTL() ? rowCellCount - 1 : 0;
        var direction = this._isRTL() ? "next" : "prev";

        if($focusedCell.index() === edgeCellIndex || this._isGroupStartCell($focusedCell)) {
            $leftCell = $focusedCell;
        } else {
            $leftCell = $focusedCell[direction]();
            $leftCell = this._checkForViewBounds($leftCell);
        }

        return $leftCell;
    }
});

registerComponent("dxSchedulerWorkSpaceWeek", SchedulerWorkSpaceWeek);

module.exports = SchedulerWorkSpaceWeek;
