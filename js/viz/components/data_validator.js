import typeUtils from "../../core/utils/type";
var STRING = "string";
var NUMERIC = "numeric";
var DATETIME = "datetime";
var DISCRETE = "discrete";
var SEMIDISCRETE = "semidiscrete";
var CONTINUOUS = "continuous";
var LOGARITHMIC = "logarithmic";
var VALUE_TYPE = "valueType";
var ARGUMENT_TYPE = "argumentType";
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
import utilsModule from "../core/utils";
var axisTypeParser = utilsModule.enumParser([STRING, NUMERIC, DATETIME]);
import parseUtilsModule from "./parse_utils";
var _getParser = parseUtilsModule.getParser;
var _isDefined = typeUtils.isDefined;
var _isFunction = typeUtils.isFunction;
var _isArray = Array.isArray;
var _isString = typeUtils.isString;
var _isDate = typeUtils.isDate;
var _isNumber = typeUtils.isNumeric;
var _isObject = typeUtils.isObject;

function groupingValues(data, others, valueField, index) {
    if(index >= 0) {
        data.slice(index).forEach(function(cell) {
            if(_isDefined(cell[valueField])) {
                others[valueField] += cell[valueField];
                cell[valueField] = undefined;
            }
        });
    }
}

function processGroups(groups) {
    groups.forEach(function(group) {
        group.valueType = group.valueAxisType = null;
        group.series.forEach(function(series) {
            series.updateDataType({});
        });
        group.valueAxis && group.valueAxis.resetTypes(VALUE_TYPE);
    });
}

function sortValues(data, asc, selector) {
    var func = asc ? function(a, b) { return a - b; } : function(a, b) { return b - a; };
    data.sort(function(a, b) {
        var valA = selector(a);
        var valB = selector(b);
        var aa = _isDefined(valA) ? 1 : 0;
        var bb = _isDefined(valB) ? 1 : 0;
        return aa && bb ? func(valA, valB) : func(aa, bb);
    });
    return data;
}

function resetArgumentAxes(axes) {
    axes && axes.forEach(function(axis) {
        axis.resetTypes(ARGUMENT_TYPE);
    });
}

function parseCategories(categories, parser) {
    var newArray = [];

    categories.forEach(function(category) {
        var parsedCategory = parser(category);
        parsedCategory !== undefined && newArray.push(parsedCategory);
    });
    return newArray;
}

function parseAxisCategories(groupsData, parsers) {
    var argumentCategories = groupsData.argumentOptions && groupsData.argumentOptions.categories;

    groupsData.groups.forEach(function(valueGroup, i) {
        var categories = valueGroup.valueOptions && valueGroup.valueOptions.categories;
        if(categories) {
            valueGroup.valueOptions.categories = parseCategories(categories, parsers[i + 1]);
        }
    });

    if(argumentCategories) {
        groupsData.argumentOptions.categories = parseCategories(argumentCategories, parsers[0]);
    }
}

function filterForLogAxis(val, field, incidentOccurred) {
    if(val <= 0 && val !== null) {
        incidentOccurred("E2004", [field]);
        val = null;
    }
    return val;
}

function eigen(x) {
    return x;
}

function getType(unit, type) {
    var result = type;
    if(type === STRING || _isString(unit)) {
        result = STRING;
    } else if(type === DATETIME || _isDate(unit)) {
        result = DATETIME;
    } else if(_isNumber(unit)) {
        result = NUMERIC;
    }
    return result;
}

function correctAxisType(type, axisType, hasCategories, incidentOccurred) {
    if(type === STRING && (axisType === CONTINUOUS || axisType === LOGARITHMIC || axisType === SEMIDISCRETE)) {
        incidentOccurred("E2002");
    }
    return axisType === LOGARITHMIC ? LOGARITHMIC : (hasCategories || axisType === DISCRETE || type === STRING ? DISCRETE : (axisType === SEMIDISCRETE ? SEMIDISCRETE : CONTINUOUS));
}

// Do we really need this one if all it is only for logarithmic case?
function validUnit(unit, field, incidentOccurred) {
    if(unit) {
        incidentOccurred(!_isNumber(unit) && !_isDate(unit) && !_isString(unit) ? "E2003" : "E2004", [field]);
    }
}

// TODO: Too much complication because of logarithmic only
function createParserUnit(type, axisType, ignoreEmptyPoints, incidentOccurred) {
    var parser = type ? _getParser(type) : eigen;
    var filter = axisType === LOGARITHMIC ? filterForLogAxis : eigen;
    var filterInfinity = axisType !== DISCRETE ? function(x) { return isFinite(x) || x === undefined ? x : null; } : eigen;
    var filterNulls = ignoreEmptyPoints ? function(x) { return x === null ? undefined : x; } : eigen;

    return function(unit, field) {
        var filterLogValues = function(x) { return filter(x, field, incidentOccurred); };
        var parseUnit = filterNulls(filterLogValues(filterInfinity(parser(unit))));

        if(parseUnit === undefined) {
            validUnit(unit, field, incidentOccurred);
        }
        return parseUnit;
    };
}

function prepareParsers(groupsData, incidentOccurred) {
    var argumentParser = createParserUnit(groupsData.argumentType, groupsData.argumentAxisType, false, incidentOccurred);
    var sizeParser;
    var valueParser;
    var ignoreEmptyPoints;
    var categoryParsers = [argumentParser];
    var cache = {};
    var list = [];

    groupsData.groups.forEach(function(group, groupIndex) {
        group.series.forEach(function(series) {
            ignoreEmptyPoints = series.getOptions().ignoreEmptyPoints;
            valueParser = createParserUnit(group.valueType, group.valueAxisType, ignoreEmptyPoints, incidentOccurred);
            sizeParser = createParserUnit(NUMERIC, CONTINUOUS, ignoreEmptyPoints, incidentOccurred);

            cache[series.getArgumentField()] = argumentParser;
            series.getValueFields().forEach(function(field) {
                categoryParsers[groupIndex + 1] = valueParser;
                cache[field] = valueParser;
            });

            if(series.getSizeField()) {
                cache[series.getSizeField()] = sizeParser;
            }
        });
    });
    for(var field in cache) {
        list.push([field, cache[field]]);
    }

    list.length && parseAxisCategories(groupsData, categoryParsers);

    return list;
}

function getParsedCell(cell, parsers) {
    var i;
    var ii = parsers.length;
    var obj = extend({}, cell);
    var field;
    var value;
    for(i = 0; i < ii; ++i) {
        field = parsers[i][0];
        value = cell[field];
        obj[field] = parsers[i][1](value, field);
    }
    return obj;
}

function parse(data, parsers) {
    var parsedData = [];
    var i;
    var ii = data.length;
    parsedData.length = ii;
    for(i = 0; i < ii; ++i) {
        parsedData[i] = getParsedCell(data[i], parsers);
    }
    return parsedData;
}

function findIndexByThreshold(data, valueField, threshold) {
    var i;
    var ii = data.length;
    var value;
    for(i = 0; i < ii; ++i) {
        value = data[i][valueField];
        if(_isDefined(value) && threshold > value) {
            break;
        }
    }
    return i;
}

function groupMinSlices(originalData, argumentField, valueField, smallValuesGrouping) {
    smallValuesGrouping = smallValuesGrouping || {};

    var mode = smallValuesGrouping.mode;
    var others = {};
    var data;

    if(!mode || mode === "none") { return; }
    others[argumentField] = String(smallValuesGrouping.groupName || "others");
    others[valueField] = 0;

    data = sortValues(originalData.slice(), false, function(a) { return a[valueField]; });

    groupingValues(data, others, valueField, mode === "smallValueThreshold" ? findIndexByThreshold(data, valueField, smallValuesGrouping.threshold) : smallValuesGrouping.topCount);

    others[valueField] && originalData.push(others);
}

function groupPieData(data, groupsData) {
    var firstSeries = groupsData.groups[0] && groupsData.groups[0].series[0];
    var isPie = firstSeries && (firstSeries.type === "pie" || firstSeries.type === "doughnut" || firstSeries.type === "donut");

    if(!isPie) { return; }

    groupsData.groups.forEach(function(group) {
        group.series.forEach(function(series) {
            groupMinSlices(data, series.getArgumentField(), series.getValueFields()[0], series.getOptions().smallValuesGrouping);
        });
    });
}

function addUniqueItemToCollection(item, collection, itemsHash) {
    if(!itemsHash[item]) {
        collection.push(item);
        itemsHash[item] = true;
    }
}

function getUniqueArgumentFields(groupsData) {
    var uniqueArgumentFields = [];
    var hash = {};

    groupsData.groups.forEach(function(group) {
        group.series.forEach(function(series) {
            addUniqueItemToCollection(series.getArgumentField(), uniqueArgumentFields, hash);
        });
    });

    return uniqueArgumentFields;
}

function sort(a, b) {
    var result = a - b;

    if(isNaN(result)) {
        if(!_isDefined(a)) {
            return 1;
        }
        if(!_isDefined(b)) {
            return -1;
        }
        return 0;
    }

    return result;
}

function sortByArgument(data, argumentField) {
    return data.slice().sort(function(a, b) {
        return sort(a[argumentField], b[argumentField]);
    });
}

function sortByCallback(data, callback) {
    return data.slice().sort(callback);
}

function checkValueTypeOfGroup(group, cell) {
    group.series.forEach(function(series) {
        series.getValueFields().forEach(function(field) {
            group.valueType = getType(cell[field], group.valueType);
        });
    });

    return group.valueType;
}

function getSortByCategories(categories) {
    var hash = {};

    categories.forEach(function(value, i) {
        hash[value] = i;
    });

    return function(data, argumentField) {
        return sortValues(data.slice(), true, function(a) { return hash[a[argumentField]]; });
    };
}

function sortData(data, groupsData, options, uniqueArgumentFields) {
    var dataByArguments = {};
    var isDiscrete = groupsData.argumentAxisType === DISCRETE;
    var userCategories = isDiscrete && groupsData.argumentOptions && groupsData.argumentOptions.categories;
    var sortFunction = function(data) { return data; };
    var sortingMethodOption = options.sortingMethod;
    var reSortCategories;

    if(!userCategories && _isFunction(sortingMethodOption)) {
        data = sortByCallback(data, sortingMethodOption);
    }
    if(isDiscrete) {
        groupsData.categories = getCategories(data, uniqueArgumentFields, userCategories);
    }

    if(userCategories || (!_isFunction(sortingMethodOption) && groupsData.argumentType === STRING && !options._skipArgumentSorting)) {
        sortFunction = getSortByCategories(groupsData.categories);
    } else if(sortingMethodOption === true && groupsData.argumentType !== STRING) {
        sortFunction = sortByArgument;
        reSortCategories = isDiscrete;
    }

    uniqueArgumentFields.forEach(function(field) {
        dataByArguments[field] = sortFunction(data, field);
    });

    if(reSortCategories) {
        groupsData.categories = groupsData.categories.sort(sort);
    }

    return dataByArguments;
}

function checkItemExistence(collection, item) {
    return collection.map(function(collectionItem) { return collectionItem.valueOf(); }).indexOf(item.valueOf()) === -1;
}

function getCategories(data, uniqueArgumentFields, userCategories) {
    var categories = userCategories ? userCategories.slice() : [];

    uniqueArgumentFields.forEach(function(field) {
        data.forEach(function(item) {
            var dataItem = item[field];

            _isDefined(dataItem) && checkItemExistence(categories, dataItem) && categories.push(dataItem);
        });
    });
    return categories;
}

function checkArgumentTypeOfGroup(series, cell, groupsData) {
    series.forEach(function(currentSeries) {
        groupsData.argumentType = getType(cell[currentSeries.getArgumentField()], groupsData.argumentType);
    });
    return groupsData.argumentType;
}

function checkType(data, groupsData, checkTypeForAllData) {
    var groupsWithUndefinedValueType = [];
    var groupsWithUndefinedArgumentType = [];
    var argumentTypeGroup = groupsData.argumentOptions && axisTypeParser(groupsData.argumentOptions.argumentType);
    var groupsIndexes;

    groupsData.groups.forEach(function(group) {
        if(!group.series.length) {
            return;
        }

        var valueTypeGroup = group.valueOptions && axisTypeParser(group.valueOptions.valueType);

        group.valueType = valueTypeGroup;
        groupsData.argumentType = argumentTypeGroup;
        !valueTypeGroup && groupsWithUndefinedValueType.push(group);
        !argumentTypeGroup && groupsWithUndefinedArgumentType.push(group);
    });

    if(groupsWithUndefinedValueType.length || groupsWithUndefinedArgumentType.length) {
        groupsIndexes = groupsWithUndefinedValueType.map(function(_, index) {
            return index;
        });
        data.some(function(cell) {
            var defineArg;

            groupsWithUndefinedValueType.forEach(function(group, groupIndex) {
                if(checkValueTypeOfGroup(group, cell) && groupsIndexes.indexOf(groupIndex) >= 0) {
                    groupsIndexes.splice(groupIndex, 1);
                }
            });

            if(!defineArg) {
                groupsWithUndefinedArgumentType.forEach(function(group) {
                    defineArg = checkArgumentTypeOfGroup(group.series, cell, groupsData);
                });
            }

            if(!checkTypeForAllData && defineArg && groupsIndexes.length === 0) {
                return true;
            }
        });
    }
}

function checkAxisType(groupsData, incidentOccurred) {
    var argumentOptions = groupsData.argumentOptions || {};
    var userArgumentCategories = (argumentOptions && argumentOptions.categories) || [];
    var argumentAxisType = correctAxisType(groupsData.argumentType, argumentOptions.type, !!(userArgumentCategories.length), incidentOccurred);

    groupsData.groups.forEach(function(group) {
        var valueOptions = group.valueOptions || {};
        var valueCategories = valueOptions.categories || [];
        var valueAxisType = correctAxisType(group.valueType, valueOptions.type, !!(valueCategories.length), incidentOccurred);

        group.series.forEach(function(series) {
            var optionsSeries = {};

            optionsSeries.argumentAxisType = argumentAxisType;
            optionsSeries.valueAxisType = valueAxisType;
            groupsData.argumentAxisType = groupsData.argumentAxisType || optionsSeries.argumentAxisType;
            group.valueAxisType = group.valueAxisType || optionsSeries.valueAxisType;
            optionsSeries.argumentType = groupsData.argumentType;
            optionsSeries.valueType = group.valueType;
            optionsSeries.showZero = valueOptions.showZero;
            series.updateDataType(optionsSeries);
        });

        group.valueAxisType = group.valueAxisType || valueAxisType;
        if(group.valueAxis) {
            group.valueAxis.setTypes(group.valueAxisType, group.valueType, VALUE_TYPE);
            group.valueAxis.validate();
        }
    });

    groupsData.argumentAxisType = groupsData.argumentAxisType || argumentAxisType;
    if(groupsData.argumentAxes) {
        groupsData.argumentAxes.forEach(function(axis) {
            axis.setTypes(groupsData.argumentAxisType, groupsData.argumentType, ARGUMENT_TYPE);
            axis.validate();
        });
    }
}

function verifyData(source, incidentOccurred) {
    var data = [];
    var sourceIsDefined = _isDefined(source);
    var hasError = sourceIsDefined && !_isArray(source);
    var i;
    var ii;
    var k;
    var item;
    if(sourceIsDefined && !hasError) {
        for(i = 0, ii = source.length, k = 0; i < ii; ++i) {
            item = source[i];
            if(_isObject(item)) {
                data[k++] = item;
            } else if(item) { // TODO: And what about `null`, `undefined` and `0`?
                hasError = true;
            }
        }
    }
    if(hasError) {
        incidentOccurred("E2001");
    }
    return data;
}

function validateData(data, groupsData, incidentOccurred, options) {
    var dataByArgumentFields;

    data = verifyData(data, incidentOccurred);

    groupsData.argumentType = groupsData.argumentAxisType = null;

    processGroups(groupsData.groups);
    resetArgumentAxes(groupsData.argumentAxes);

    checkType(data, groupsData, options.checkTypeForAllData);
    checkAxisType(groupsData, incidentOccurred);

    if(options.convertToAxisDataType) {
        data = parse(data, prepareParsers(groupsData, incidentOccurred));
    }
    groupPieData(data, groupsData);

    dataByArgumentFields = sortData(data, groupsData, options, getUniqueArgumentFields(groupsData));

    return dataByArgumentFields;
}

exports.validateData = validateData;
