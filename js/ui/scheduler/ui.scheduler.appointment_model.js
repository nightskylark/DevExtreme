var Class = require("../../core/class");
var config = require("../../core/config");
var iteratorUtils = require("../../core/utils/iterator");
var dateSerialization = require("../../core/utils/date_serialization");
var recurrenceUtils = require("./utils.recurrence");
var dateUtils = require("../../core/utils/date");
var commonUtils = require("../../core/utils/common");
var typeUtils = require("../../core/utils/type");
var inArray = require("../../core/utils/array").inArray;
var extend = require("../../core/utils/extend").extend;
var arrayUtils = require("../../core/utils/array");
var query = require("../../data/query");
var DATE_FILTER_POSITION = 0;
var USER_FILTER_POSITION = 1;

var FilterMaker = Class.inherit({
    ctor: function(dataAccessors) {
        this._filterRegistry = null;
        this._dataAccessors = dataAccessors;
    },

    isRegistered: function() {
        return !!this._filterRegistry;
    },

    clearRegistry: function() {
        delete this._filterRegistry;
    },

    make: function(type, args) {

        if(!this._filterRegistry) {
            this._filterRegistry = {};
        }

        this._make[type].apply(this, args);
    },

    _make: {
        "date": function(min, max, useAccessors) {
            var startDate = useAccessors ? this._dataAccessors.getter.startDate : this._dataAccessors.expr.startDateExpr;
            var endDate = useAccessors ? this._dataAccessors.getter.endDate : this._dataAccessors.expr.endDateExpr;
            var recurrenceRule = this._dataAccessors.expr.recurrenceRuleExpr;

            this._filterRegistry.date = [
                [
                    [endDate, ">", min],
                    [startDate, "<", max]
                ],
                "or",
                [recurrenceRule, "startswith", "freq"],
                "or",
                [
                    [endDate, min],
                    [startDate, min]
                ]
            ];

            if(!recurrenceRule) {
                this._filterRegistry.date.splice(1, 2);
            }
        },
        "user": function(userFilter) {
            this._filterRegistry.user = userFilter;
        }
    },
    combine: function() {
        var filter = [];

        this._filterRegistry.date && filter.push(this._filterRegistry.date);
        this._filterRegistry.user && filter.push(this._filterRegistry.user);

        return filter;
    },

    dateFilter: function() {
        return this._filterRegistry.date;
    }
});

var compareDateWithStartDayHour = function(startDate, endDate, startDayHour, allDay, severalDays) {
    var startTime = dateUtils.dateTimeFromDecimal(startDayHour);

    var result = (startDate.getHours() >= startTime.hours && startDate.getMinutes() >= startTime.minutes) ||
                (endDate.getHours() === startTime.hours && endDate.getMinutes() > startTime.minutes) ||
                (endDate.getHours() > startTime.hours) ||
                severalDays ||
                allDay;

    return result;
};

var compareDateWithEndDayHour = function(startDate, endDate, startDayHour, endDayHour, allDay, max) {
    var hiddenInterval = (24 - endDayHour + startDayHour) * 3600000;
    var apptDuration = endDate.getTime() - startDate.getTime();
    var delta = (hiddenInterval - apptDuration) / (1000 * 60 * 60);
    var apptStartHour = startDate.getHours();
    var apptStartMinutes = startDate.getMinutes();
    var result;

    var endTime = dateUtils.dateTimeFromDecimal(endDayHour);

    result = (apptStartHour < endTime.hours) || (apptStartHour === endTime.hours && apptStartMinutes < endTime.minutes) || allDay && startDate <= max;

    if(apptDuration < hiddenInterval) {
        if((apptStartHour > endTime.hours && apptStartMinutes > endTime.minutes) && (delta <= apptStartHour - endDayHour)) {
            result = false;
        }
    }

    return result;
};

var AppointmentModel = Class.inherit({

    _createFilter: function(min, max, remoteFiltering, dateSerializationFormat) {
        this._filterMaker.make("date", [min, max]);

        var userFilterPosition = this._excessFiltering() ? this._dataSource.filter()[USER_FILTER_POSITION] : this._dataSource.filter();
        this._filterMaker.make("user", [userFilterPosition]);

        if(remoteFiltering) {
            this._dataSource.filter(this._combineRemoteFilter(dateSerializationFormat));
        }
    },

    _excessFiltering: function() {
        var dateFilter = this._filterMaker.dateFilter();
        var dataSourceFilter = this._dataSource.filter();

        return dataSourceFilter && (commonUtils.equalByValue(dataSourceFilter, dateFilter) || (dataSourceFilter.length && commonUtils.equalByValue(dataSourceFilter[DATE_FILTER_POSITION], dateFilter)));
    },

    _combineFilter: function() {
        return this._filterMaker.combine();
    },

    _getStoreKey: function(target) {
        var store = this._dataSource.store();

        return store.keyOf(target);
    },

    _filterAppointmentByResources: function(appointment, resources) {
        var result = false;

        function checkAppointmentResourceValues() {
            var resourceGetter = this._dataAccessors.getter.resources[resourceName];
            var resource;

            if(typeUtils.isFunction(resourceGetter)) {
                resource = resourceGetter(appointment);
            }

            var appointmentResourceValues = arrayUtils.wrapToArray(resource);
            var resourceData = iteratorUtils.map(resources[i].items, function(item) { return item.id; });

            for(var j = 0, itemDataCount = appointmentResourceValues.length; j < itemDataCount; j++) {
                if(inArray(appointmentResourceValues[j], resourceData) > -1) {
                    return true;
                }
            }

            return false;
        }

        for(var i = 0, len = resources.length; i < len; i++) {
            var resourceName = resources[i].name;

            result = checkAppointmentResourceValues.call(this);

            if(!result) {
                return false;
            }
        }

        return result;
    },

    _filterAppointmentByRRule: function(appointment, min, max, startDayHour, endDayHour) {
        var recurrenceRule = appointment.recurrenceRule;
        var recurrenceException = appointment.recurrenceException;
        var allDay = appointment.allDay;
        var result = true;
        var appointmentStartDate = appointment.startDate;
        var appointmentEndDate = appointment.endDate;

        if(allDay || this._appointmentPartInInterval(appointmentStartDate, appointmentEndDate, startDayHour, endDayHour)) {
            var trimmedDates = this._trimDates(min, max);

            min = trimmedDates.min;
            max = new Date(trimmedDates.max.getTime() - 60000);
        }

        if(recurrenceRule && !recurrenceUtils.getRecurrenceRule(recurrenceRule).isValid) {
            result = (appointmentEndDate > min) && (appointmentStartDate <= max);
        }

        if(result && recurrenceUtils.getRecurrenceRule(recurrenceRule).isValid) {
            result = recurrenceUtils.dateInRecurrenceRange({
                rule: recurrenceRule,
                exception: recurrenceException,
                start: appointmentStartDate,
                end: appointmentEndDate,
                min: min,
                max: max
            });
        }

        return result;
    },

    _appointmentPartInInterval: function(startDate, endDate, startDayHour, endDayHour) {
        var apptStartDayHour = startDate.getHours();
        var apptEndDayHour = endDate.getHours();

        return (apptStartDayHour <= startDayHour && apptEndDayHour <= endDayHour && apptEndDayHour >= startDayHour) ||
                   (apptEndDayHour >= endDayHour && apptStartDayHour <= endDayHour && apptStartDayHour >= startDayHour);
    },

    _createCombinedFilter: function(filterOptions, timeZoneProcessor) {
        var dataAccessors = this._dataAccessors;
        var startDayHour = filterOptions.startDayHour;
        var endDayHour = filterOptions.endDayHour;
        var min = new Date(filterOptions.min);
        var max = new Date(filterOptions.max);
        var resources = filterOptions.resources;
        var that = this;

        return [[function(appointment) {
            var result = true;
            var startDate = new Date(dataAccessors.getter.startDate(appointment));
            var endDate = new Date(dataAccessors.getter.endDate(appointment));
            var appointmentTakesAllDay = that.appointmentTakesAllDay(appointment, startDayHour, endDayHour);
            var appointmentTakesSeveralDays = that.appointmentTakesSeveralDays(appointment);
            var isAllDay = dataAccessors.getter.allDay(appointment);
            var useRecurrence = typeUtils.isDefined(dataAccessors.getter.recurrenceRule);
            var recurrenceRule;

            if(useRecurrence) {
                recurrenceRule = dataAccessors.getter.recurrenceRule(appointment);
            }

            if(resources && resources.length) {
                result = that._filterAppointmentByResources(appointment, resources);
            }

            if(appointmentTakesAllDay && filterOptions.allDay === false) {
                result = false;
            }

            if(result && useRecurrence) {

                result = that._filterAppointmentByRRule({
                    startDate: startDate,
                    endDate: endDate,
                    recurrenceRule: recurrenceRule,
                    recurrenceException: dataAccessors.getter.recurrenceException(appointment),
                    allDay: appointmentTakesAllDay
                }, min, max, startDayHour, endDayHour);
            }

            var startDateTimeZone = dataAccessors.getter.startDateTimeZone(appointment);
            var endDateTimeZone = dataAccessors.getter.endDateTimeZone(appointment);
            var comparableStartDate = timeZoneProcessor(startDate, startDateTimeZone);
            var comparableEndDate = timeZoneProcessor(endDate, endDateTimeZone);

            if(result && startDayHour !== undefined) {
                result = compareDateWithStartDayHour(comparableStartDate, comparableEndDate, startDayHour, appointmentTakesAllDay, appointmentTakesSeveralDays);
            }

            if(result && endDayHour !== undefined) {
                result = compareDateWithEndDayHour(comparableStartDate, comparableEndDate, startDayHour, endDayHour, appointmentTakesAllDay, max);
            }

            if(result && useRecurrence && !recurrenceRule) {
                if(comparableEndDate < min && !isAllDay) {
                    result = false;
                }
            }
            return result;
        }]];
    },

    ctor: function(dataSource, dataAccessors) {
        this.setDataAccessors(dataAccessors);
        this.setDataSource(dataSource);
        this._updatedAppointmentKeys = [];

        this._filterMaker = new FilterMaker(dataAccessors);
    },

    setDataSource: function(dataSource) {
        this._dataSource = dataSource;

        this.cleanModelState();
        this._initStoreChangeHandlers();
        this._filterMaker && this._filterMaker.clearRegistry();
    },

    _initStoreChangeHandlers: function() {
        this._dataSource && this._dataSource.store()
            .on("updating", (function(newItem) {
                this._updatedAppointment = newItem;
            }).bind(this));

        this._dataSource && this._dataSource.store()
            .on("push", function(items) {
                items.forEach(function(item) {
                    this._updatedAppointmentKeys.push({ key: this._dataSource.store().key(), value: item.key });
                }.bind(this));
            }.bind(this));
    },

    getUpdatedAppointment: function() {
        return this._updatedAppointment;
    },
    getUpdatedAppointmentKeys: function() {
        return this._updatedAppointmentKeys;
    },

    cleanModelState: function() {
        this._updatedAppointment = null;
        this._updatedAppointmentKeys = [];
    },

    setDataAccessors: function(dataAccessors) {
        this._dataAccessors = dataAccessors;

        this._filterMaker = new FilterMaker(dataAccessors);
    },

    filterByDate: function(min, max, remoteFiltering, dateSerializationFormat) {
        if(!this._dataSource) {
            return;
        }

        var trimmedDates = this._trimDates(min, max);

        if(!this._filterMaker.isRegistered()) {
            this._createFilter(trimmedDates.min, trimmedDates.max, remoteFiltering, dateSerializationFormat);
        } else {
            this._filterMaker.make("date", [trimmedDates.min, trimmedDates.max]);

            if(this._dataSource.filter() && this._dataSource.filter().length > 1) {
                this._filterMaker.make("user", [this._dataSource.filter()[1]]);
            }
            if(remoteFiltering) {
                this._dataSource.filter(this._combineRemoteFilter(dateSerializationFormat));
            }
        }
    },

    _combineRemoteFilter: function(dateSerializationFormat) {
        var combinedFilter = this._filterMaker.combine();
        return this._serializeRemoteFilter(combinedFilter, dateSerializationFormat);
    },

    _serializeRemoteFilter: function(filter, dateSerializationFormat) {
        var that = this;

        if(!Array.isArray(filter)) return filter;

        filter = extend([], filter);

        var startDate = that._dataAccessors.expr.startDateExpr;
        var endDate = that._dataAccessors.expr.endDateExpr;

        if(typeUtils.isString(filter[0])) {
            if(config().forceIsoDateParsing && filter.length > 1) {
                if(filter[0] === startDate || filter[0] === endDate) {
                    filter[filter.length - 1] = dateSerialization.serializeDate(filter[filter.length - 1], dateSerializationFormat);
                }
            }
        }

        for(var i = 0; i < filter.length; i++) {
            filter[i] = that._serializeRemoteFilter(filter[i], dateSerializationFormat);
        }

        return filter;
    },

    filterLoadedAppointments: function(filterOptions, timeZoneProcessor) {
        if(!typeUtils.isFunction(timeZoneProcessor)) {
            timeZoneProcessor = function(date) {
                return date;
            };
        }

        var combinedFilter = this._createCombinedFilter(filterOptions, timeZoneProcessor);

        if(this._filterMaker.isRegistered()) {
            var trimmedDates = this._trimDates(filterOptions.min, filterOptions.max);

            this._filterMaker.make("date", [trimmedDates.min, trimmedDates.max, true]);

            var dateFilter = this.customizeDateFilter(this._filterMaker.combine(), timeZoneProcessor);

            combinedFilter.push([dateFilter]);
        }

        return query(this._dataSource.items()).filter(combinedFilter).toArray();
    },

    _trimDates: function(min, max) {
        var minCopy = dateUtils.trimTime(new Date(min));
        var maxCopy = dateUtils.trimTime(new Date(max));

        maxCopy.setDate(maxCopy.getDate() + 1);

        return {
            min: minCopy,
            max: maxCopy
        };
    },

    hasAllDayAppointments: function(items, startDayHour, endDayHour) {
        if(!items) {
            return false;
        }

        var that = this;

        var result = false;
        iteratorUtils.each(items, function(index, item) {
            if(that.appointmentTakesAllDay(item, startDayHour, endDayHour)) {
                result = true;
                return false;
            }
        });

        return result;
    },

    appointmentTakesAllDay: function(appointment, startDayHour, endDayHour) {
        var dataAccessors = this._dataAccessors;
        var startDate = dataAccessors.getter.startDate(appointment);
        var endDate = dataAccessors.getter.endDate(appointment);
        var allDay = dataAccessors.getter.allDay(appointment);

        return allDay || this._appointmentHasAllDayDuration(startDate, endDate, startDayHour, endDayHour);
    },

    _appointmentHasAllDayDuration: function(startDate, endDate, startDayHour, endDayHour) {
        startDate = new Date(startDate);
        endDate = new Date(endDate);

        var dayDuration = 24;
        var appointmentDurationInHours = this._getAppointmentDurationInHours(startDate, endDate);

        return (appointmentDurationInHours >= dayDuration) || this._appointmentHasShortDayDuration(startDate, endDate, startDayHour, endDayHour);
    },

    _appointmentHasShortDayDuration: function(startDate, endDate, startDayHour, endDayHour) {
        var appointmentDurationInHours = this._getAppointmentDurationInHours(startDate, endDate);
        var shortDayDurationInHours = endDayHour - startDayHour;

        return (appointmentDurationInHours >= shortDayDurationInHours && startDate.getHours() === startDayHour && endDate.getHours() === endDayHour);
    },

    _getAppointmentDurationInHours: function(startDate, endDate) {
        return (endDate.getTime() - startDate.getTime()) / 3600000;
    },

    appointmentTakesSeveralDays: function(appointment) {
        var dataAccessors = this._dataAccessors;
        var startDate = dataAccessors.getter.startDate(appointment);
        var endDate = dataAccessors.getter.endDate(appointment);
        var startDateCopy = dateUtils.trimTime(new Date(startDate));
        var endDateCopy = dateUtils.trimTime(new Date(endDate));

        return startDateCopy.getTime() !== endDateCopy.getTime();
    },

    customizeDateFilter: function(dateFilter, timeZoneProcessor) {
        var currentFilter = extend(true, [], dateFilter);

        return (function(appointment) {
            appointment = extend(true, {}, appointment);

            var startDate = this._dataAccessors.getter.startDate(appointment);
            var endDate = this._dataAccessors.getter.endDate(appointment);
            var startDateTimeZone = this._dataAccessors.getter.startDateTimeZone(appointment);
            var endDateTimeZone = this._dataAccessors.getter.endDateTimeZone(appointment);
            var comparableStartDate = timeZoneProcessor(startDate, startDateTimeZone);
            var comparableEndDate = timeZoneProcessor(endDate, endDateTimeZone);

            this._dataAccessors.setter.startDate(appointment, comparableStartDate);
            this._dataAccessors.setter.endDate(appointment, comparableEndDate);

            return query([appointment]).filter(currentFilter).toArray().length > 0;
        }).bind(this);
    },

    add: function(data, tz) {
        return this._dataSource.store().insert(data).done((function() {
            this._dataSource.load();
        }).bind(this));
    },

    update: function(target, data) {
        var key = this._getStoreKey(target);

        return this._dataSource.store().update(key, data).done((function() {
            this._dataSource.load();
        }).bind(this));
    },

    remove: function(target) {
        var key = this._getStoreKey(target);

        return this._dataSource.store().remove(key).done((function() {
            this._dataSource.load();
        }).bind(this));
    }
});

module.exports = AppointmentModel;
