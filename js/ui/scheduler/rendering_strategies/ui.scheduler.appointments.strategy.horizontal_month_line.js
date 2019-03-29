import HorizontalAppointmentsStrategy from "./ui.scheduler.appointments.strategy.horizontal";
import dateUtils from "../../../core/utils/date";
import query from "../../../data/query";
var HOURS_IN_DAY = 24;
var MINUTES_IN_HOUR = 60;
var MILLISECONDS_IN_MINUTE = 60000;

var HorizontalMonthLineRenderingStrategy = HorizontalAppointmentsStrategy.inherit({

    calculateAppointmentWidth: function(appointment, position, isRecurring) {
        var startDate = new Date(this.startDate(appointment, false, position));
        var endDate = new Date(this.endDate(appointment, position, isRecurring));
        var cellWidth = this._defaultWidth || this.getAppointmentMinSize();

        startDate = dateUtils.trimTime(startDate);

        var width = Math.ceil(this._getDurationInHour(startDate, endDate) / HOURS_IN_DAY) * cellWidth;
        width = this.cropAppointmentWidth(width, cellWidth);

        return width;
    },

    _getDurationInHour: function(startDate, endDate) {
        var adjustedDuration = this._adjustDurationByDaylightDiff(endDate.getTime() - startDate.getTime(), startDate, endDate);
        return adjustedDuration / dateUtils.dateToMilliseconds("hour");
    },

    getDeltaTime: function(args, initialSize) {
        return HOURS_IN_DAY * MINUTES_IN_HOUR * MILLISECONDS_IN_MINUTE * this._getDeltaWidth(args, initialSize);
    },

    isAllDay: function() {
        return false;
    },

    createTaskPositionMap: function(items, skipSorting) {
        if(!skipSorting) {
            this.instance.getAppointmentsInstance()._sortAppointmentsByStartDate(items);
        }

        return this.callBase(items);
    },

    _getSortedPositions: function(map, skipSorting) {
        var result = this.callBase(map);

        if(!skipSorting) {
            result = query(result).sortBy("top").thenBy("left").thenBy("cellPosition").thenBy("i").toArray();
        }

        return result;
    },

    needCorrectAppointmentDates: function() {
        return false;
    }
});

module.exports = HorizontalMonthLineRenderingStrategy;
