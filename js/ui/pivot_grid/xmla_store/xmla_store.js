var $ = require("../../../core/renderer");
import windowUtils from "../../../core/utils/window";
var window = windowUtils.getWindow();
import Class from "../../../core/class";
import stringUtils from "../../../core/utils/string";
var stringFormat = stringUtils.format;
import errorsModule from "../../../data/errors";
var errors = errorsModule.errors;
import commonUtils from "../../../core/utils/common";
var noop = commonUtils.noop;
import typeUtils from "../../../core/utils/type";
import iteratorUtils from "../../../core/utils/iterator";
import arrayUtils from "../../../core/utils/array";
var inArray = arrayUtils.inArray;
import pivotGridUtils from "../ui.pivot_grid.utils";
import deferredUtils from "../../../core/utils/deferred";
var when = deferredUtils.when;
var Deferred = deferredUtils.Deferred;
import codesModule from "../../../localization/language_codes";
var getLanguageId = codesModule.getLanguageId;

exports.XmlaStore = Class.inherit((function() {
    var discover = '<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/"><Body><Discover xmlns="urn:schemas-microsoft-com:xml-analysis"><RequestType>{2}</RequestType><Restrictions><RestrictionList><CATALOG_NAME>{0}</CATALOG_NAME><CUBE_NAME>{1}</CUBE_NAME></RestrictionList></Restrictions><Properties><PropertyList><Catalog>{0}</Catalog>{3}</PropertyList></Properties></Discover></Body></Envelope>';
    var execute = '<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/"><Body><Execute xmlns="urn:schemas-microsoft-com:xml-analysis"><Command><Statement>{0}</Statement></Command><Properties><PropertyList><Catalog>{1}</Catalog><ShowHiddenCubes>True</ShowHiddenCubes><SspropInitAppName>Microsoft SQL Server Management Studio</SspropInitAppName><Timeout>3600</Timeout>{2}</PropertyList></Properties></Execute></Body></Envelope>';
    var mdx = "SELECT {2} FROM {0} {1} CELL PROPERTIES VALUE, FORMAT_STRING, LANGUAGE, BACK_COLOR, FORE_COLOR, FONT_FLAGS";
    var mdxFilterSelect = "(SELECT {0} FROM {1})";
    var mdxSubset = "Subset({0}, {1}, {2})";
    var mdxWith = "{0} {1} as {2}";
    var mdxSlice = "WHERE ({0})";
    var mdxNonEmpty = "NonEmpty({0}, {1})";
    var mdxAxis = "{0} DIMENSION PROPERTIES PARENT_UNIQUE_NAME,HIERARCHY_UNIQUE_NAME, MEMBER_VALUE ON {1}";
    var mdxCrossJoin = "CrossJoin({0})";
    var mdxSet = "{{0}}";
    var each = iteratorUtils.each;
    var MEASURE_DEMENSION_KEY = "DX_MEASURES";
    var MD_DIMTYPE_MEASURE = "2";

    function execXMLA(requestOptions, data) {
        var deferred = new Deferred();
        var beforeSend = requestOptions.beforeSend;

        var ajaxSettings = {
            url: requestOptions.url,
            dataType: "text",
            data: data,
            headers: {
                'Content-Type': 'text/xml'
            },
            xhrFields: {
            },
            method: "POST"
        };

        if(typeUtils.isFunction(beforeSend)) {
            beforeSend(ajaxSettings);
        }

        pivotGridUtils.sendRequest(ajaxSettings).fail(function() {
            deferred.reject(arguments);
        }).done(function(text) {
            var parser = new window.DOMParser();
            var xml;

            try {
                try { // For IE
                    xml = parser.parseFromString(text, "text/xml");
                } catch(e) {
                    xml = undefined;
                }
                if(!xml || xml.getElementsByTagName("parsererror").length || xml.childNodes.length === 0) {
                    throw new errors.Error("E4023", text);
                }
            } catch(e) {
                deferred.reject({
                    statusText: e.message,
                    stack: e.stack,
                    responseText: text
                });
            }

            deferred.resolve(xml);
        });
        return deferred;
    }

    function getLocaleIdProperty() {
        var languageId = getLanguageId();

        if(languageId !== undefined) {
            return stringFormat("<LocaleIdentifier>{0}</LocaleIdentifier>", languageId);
        }
        return "";
    }

    function mdxDescendants(level, levelMember, nextLevel) {
        var memberExpression = levelMember ? levelMember : level;

        return "Descendants({" + memberExpression + "}, " + nextLevel + ", SELF_AND_BEFORE)";
    }

    function getAllMember(dimension) {
        return (dimension.hierarchyName || dimension.dataField) + ".[All]";
    }

    function getAllMembers(field) {
        return field.dataField + ".allMembers";
    }

    function crossJoinElements(elements) {
        var elementsString = elements.join(",");
        return elements.length > 1 ? stringFormat(mdxCrossJoin, elementsString) : elementsString;
    }

    function union(elements) {
        var elementsString = elements.join(",");
        return elements.length > 1 ? "Union(" + elementsString + ")" : elementsString;
    }

    function generateCrossJoin(path, expandLevel, expandAllCount, expandIndex, slicePath, options, axisName) {
        var crossJoinArgs = [];
        var dimensions = options[axisName];
        var dataField;
        var allMember;
        var fields = [];
        var hierarchyName;
        var arg;
        var prevDimension;
        var prevHierarchyName;
        var isLastDimensionInGroup;
        var isFirstDimensionInGroup;
        var expandAllIndex;
        var field;
        var member;
        var i;

        for(i = expandIndex; i <= expandLevel; i++) {
            field = dimensions[i];
            dataField = field.dataField;
            prevHierarchyName = dimensions[i - 1] && dimensions[i - 1].hierarchyName;
            hierarchyName = field.hierarchyName;
            isLastDimensionInGroup = !hierarchyName || !dimensions[i + 1] || dimensions[i + 1].hierarchyName !== hierarchyName;
            expandAllIndex = path.length + expandAllCount + expandIndex;
            arg = null;

            fields.push(field);

            if(i < path.length) {
                if(isLastDimensionInGroup) {
                    arg = "(" + dataField + "." + preparePathValue(path[i], dataField) + ")";
                }
            } else if(i <= expandAllIndex) {
                if(i === 0 && expandAllCount === 0) {
                    allMember = getAllMember(dimensions[expandIndex]);

                    if(!hierarchyName) {
                        arg = getAllMembers(dimensions[expandIndex]);
                    } else {
                        arg = allMember + "," + dimensions[expandIndex].dataField;
                    }

                } else {
                    if(hierarchyName) {
                        member = preparePathValue(slicePath[slicePath.length - 1]);
                        if(isLastDimensionInGroup || i === expandAllIndex) {
                            if(prevHierarchyName === hierarchyName) {
                                if(slicePath.length) {
                                    prevDimension = dimensions[slicePath.length - 1];
                                }
                                if(!prevDimension || prevDimension.hierarchyName !== hierarchyName) {
                                    prevDimension = dimensions[i - 1];
                                    member = "";
                                }

                                arg = mdxDescendants(prevDimension.dataField, member, dataField);
                            } else {
                                arg = getAllMembers(field);
                            }
                        }
                    } else {
                        arg = getAllMembers(field);
                    }
                }
            } else {
                isFirstDimensionInGroup = !hierarchyName || prevHierarchyName !== hierarchyName;
                if(isFirstDimensionInGroup) {
                    arg = "(" + getAllMember(field) + ")";
                }
            }
            if(arg) {
                arg = stringFormat(mdxSet, arg);
                crossJoinArgs.push(arg);
            }
        }

        return crossJoinElements(crossJoinArgs);
    }

    function fillCrossJoins(crossJoins, path, expandLevel, expandIndex, slicePath, options, axisName, cellsString) {
        var expandAllCount = -1;
        var dimensions = options[axisName];
        var dimensionIndex;

        do {
            expandAllCount++;
            dimensionIndex = path.length + expandAllCount + expandIndex;
            crossJoins.push(stringFormat(mdxNonEmpty, generateCrossJoin(path, expandLevel, expandAllCount, expandIndex, slicePath, options, axisName), cellsString));
        } while(dimensions[dimensionIndex] && dimensions[dimensionIndex + 1] && dimensions[dimensionIndex].expanded);
    }

    function declare(expression, withArray, name, type) {
        name = name || ("[DX_Set_" + withArray.length + "]");
        type = type || "set";

        withArray.push(stringFormat(mdxWith, type, name, expression));
        return name;
    }

    function generateAxisMdx(options, axisName, cells, withArray, parseOptions) {
        var dimensions = options[axisName];
        var crossJoins = [];
        var path = [];
        var expandedPaths = [];
        var expandIndex = 0;
        var expandLevel = 0;
        var result = [];
        var cellsString = stringFormat(mdxSet, cells.join(","));

        if(dimensions && dimensions.length) {
            if(options.headerName === axisName) {
                path = options.path;
                expandIndex = path.length;
            } else {
                expandedPaths = (axisName === "columns" ? options.columnExpandedPaths : options.rowExpandedPaths) || expandedPaths;
            }
            expandLevel = pivotGridUtils.getExpandedLevel(options, axisName);

            fillCrossJoins(crossJoins, [], expandLevel, expandIndex, path, options, axisName, cellsString);
            each(expandedPaths, function(_, expandedPath) {
                fillCrossJoins(crossJoins, expandedPath, expandLevel, expandIndex, expandedPath, options, axisName, cellsString);
            });

            for(var i = expandLevel; i >= path.length; i--) {
                if(dimensions[i].hierarchyName) {
                    parseOptions.visibleLevels[dimensions[i].hierarchyName] = parseOptions.visibleLevels[dimensions[i].hierarchyName] || [];
                    parseOptions.visibleLevels[dimensions[i].hierarchyName].push(dimensions[i].dataField);
                }
            }
        }

        if(crossJoins.length) {
            let expression = union(crossJoins);
            if(axisName === "rows" && options.rowTake) {
                expression = stringFormat(mdxSubset, expression, options.rowSkip > 0 ? options.rowSkip + 1 : 0, options.rowSkip > 0 ? options.rowTake : options.rowTake + 1);
            }
            if(axisName === "columns" && options.columnTake) {
                expression = stringFormat(mdxSubset, expression, options.columnSkip > 0 ? options.columnSkip + 1 : 0, options.columnTake > 0 ? options.columnTake : options.columnTake + 1);
            }

            const axisSet = `[DX_${axisName}]`;
            result.push(declare(expression, withArray, axisSet));

            if(options.totalsOnly) {
                result.push(declare(`COUNT(${axisSet})`, withArray, `[DX_${axisName}_count]`, "member"));
            }
        }

        if(axisName === "columns" && cells.length && !options.skipValues) {
            result.push(cellsString);
        }

        return stringFormat(mdxAxis, crossJoinElements(result), axisName);
    }

    function generateAxisFieldsFilter(fields) {
        var filterMembers = [];

        each(fields, function(_, field) {
            var dataField = field.dataField;
            var filterExpression = [];
            var filterValues = field.filterValues || [];
            var filterStringExpression;

            if(field.hierarchyName && typeUtils.isNumeric(field.groupIndex)) {
                return;
            }

            each(filterValues, function(_, filterValue) {
                var filterMdx = dataField + "." + preparePathValue(Array.isArray(filterValue) ? filterValue[filterValue.length - 1] : filterValue, dataField);
                if(field.filterType === "exclude") {
                    filterExpression.push(filterMdx + ".parent");
                    filterMdx = "Descendants(" + filterMdx + ")";
                }

                filterExpression.push(filterMdx);
            });

            if(filterValues.length) {
                filterStringExpression = stringFormat(mdxSet, filterExpression.join(","));

                if(field.filterType === "exclude") {
                    filterStringExpression = "Except(" + getAllMembers(field) + "," + filterStringExpression + ")";
                }

                filterMembers.push(filterStringExpression);
            }
        });

        return filterMembers.length ? crossJoinElements(filterMembers) : "";
    }

    function generateFrom(columnsFilter, rowsFilter, filter, cubeName) {
        var from = "[" + cubeName + "]";

        each([columnsFilter, rowsFilter, filter], function(_, filter) {
            if(filter) {
                from = stringFormat(mdxFilterSelect, filter + "on 0", from);
            }
        });

        return from;
    }

    function generateMdxCore(axisStrings, withArray, columns, rows, filters, slice, cubeName, options = {}) {
        var mdxString = "";
        var withString = (withArray.length ? "with " + withArray.join(" ") : "") + " ";

        if(axisStrings.length) {
            let select;
            if(options.totalsOnly) {
                const countMembers = [];
                if(rows.length) {
                    countMembers.push("[DX_rows_count]");
                }
                if(columns.length) {
                    countMembers.push("[DX_columns_count]");
                }
                select = `{${countMembers.join(",")}} on columns`;
            } else {
                select = axisStrings.join(",");
            }
            mdxString = withString + stringFormat(mdx,
                generateFrom(generateAxisFieldsFilter(columns), generateAxisFieldsFilter(rows), generateAxisFieldsFilter(filters || []), cubeName),
                slice.length ? stringFormat(mdxSlice, slice.join(",")) : "", select);
        }

        return mdxString;
    }

    function prepareDataFields(withArray, valueFields) {

        return iteratorUtils.map(valueFields, function(cell) {
            if(typeUtils.isString(cell.expression)) {
                declare(cell.expression, withArray, cell.dataField, "member");
            }
            return cell.dataField;
        });
    }

    function generateMDX(options, cubeName, parseOptions) {
        var columns = options.columns || [];
        var rows = options.rows || [];
        var values = options.values && options.values.length ? options.values : [{ dataField: '[Measures]' }];
        var slice = [];
        var withArray = [];
        var axisStrings = [];
        var dataFields = prepareDataFields(withArray, values);

        parseOptions.measureCount = options.skipValues ? 1 : values.length;
        parseOptions.visibleLevels = {};

        if(options.headerName && options.path) {
            each(options.path, function(index, value) {
                var dimension = options[options.headerName][index];
                if(!dimension.hierarchyName || dimension.hierarchyName !== options[options.headerName][index + 1].hierarchyName) {
                    slice.push(dimension.dataField + "." + preparePathValue(value, dimension.dataField));
                }
            });
        }

        if(columns.length || dataFields.length) {
            axisStrings.push(generateAxisMdx(options, "columns", dataFields, withArray, parseOptions));
        }

        if(rows.length) {
            axisStrings.push(generateAxisMdx(options, "rows", dataFields, withArray, parseOptions));
        }

        return generateMdxCore(axisStrings, withArray, columns, rows, options.filters, slice, cubeName, options);
    }

    function createDrillDownAxisSlice(slice, fields, path) {
        each(path, function(index, value) {
            var field = fields[index];
            if(field.hierarchyName && (fields[index + 1] || {}).hierarchyName === field.hierarchyName) {
                return;
            }
            slice.push(field.dataField + "." + preparePathValue(value, field.dataField));
        });
    }

    function generateDrillDownMDX(options, cubeName, params) {
        var columns = options.columns || [];
        var rows = options.rows || [];
        var values = options.values && options.values.length ? options.values : [{ dataField: '[Measures]' }];
        var slice = [];
        var withArray = [];
        var axisStrings = [];
        var dataFields = prepareDataFields(withArray, values);
        var maxRowCount = params.maxRowCount;
        var customColumns = params.customColumns || [];
        var customColumnsString = customColumns.length > 0 ? " return " + customColumns.join(",") : "";
        var coreMDX;

        createDrillDownAxisSlice(slice, columns, params.columnPath || []);

        createDrillDownAxisSlice(slice, rows, params.rowPath || []);

        if(columns.length || columns.length || dataFields.length) {
            axisStrings.push([(dataFields[params.dataIndex] || dataFields[0]) + " on 0"]);
        }

        coreMDX = generateMdxCore(axisStrings, withArray, columns, rows, options.filters, slice, cubeName);

        return coreMDX ? "drillthrough" + (maxRowCount > 0 ? " maxrows " + maxRowCount : "") + coreMDX + customColumnsString : coreMDX;
    }

    function getNumber(str) {
        return parseInt(str, 10);
    }

    function parseValue(valueText) {

        return typeUtils.isNumeric(valueText) ? parseFloat(valueText) : valueText;
    }

    function getFirstChild(node, tagName) {
        return (node.getElementsByTagName(tagName) || [])[0];
    }

    function getFirstChildText(node, childTagName) {
        return getNodeText(getFirstChild(node, childTagName));
    }

    function parseAxes(xml, skipValues) {
        var axes = [];

        each(xml.getElementsByTagName("Axis"), function(_, axisElement) {
            var name = axisElement.getAttribute("name");
            var axis = [];
            var index = 0;

            if(name.indexOf("Axis") === 0 && typeUtils.isNumeric(getNumber(name.substr(4)))) {

                axes.push(axis);

                each(axisElement.getElementsByTagName("Tuple"), function(_, tupleElement) {
                    var tupleMembers = tupleElement.childNodes;
                    var tuple;
                    var levelSum = 0;
                    var members = [];
                    var level;
                    var membersCount = skipValues ? tupleMembers.length : tupleMembers.length - 1;
                    var isAxisWithMeasure = axes.length === 1;
                    var i;

                    if(isAxisWithMeasure) {
                        membersCount--;
                    }

                    axis.push(members);

                    for(i = membersCount; i >= 0; i--) {
                        tuple = tupleMembers[i];
                        level = getNumber(getFirstChildText(tuple, "LNum"));

                        members[i] = {
                            caption: getFirstChildText(tuple, "Caption"),
                            value: parseValue(getFirstChildText(tuple, "MEMBER_VALUE")),
                            level: level,
                            index: index++,
                            hasValue: !levelSum && (!!level || i === 0),
                            name: getFirstChildText(tuple, "UName"),
                            hierarchyName: tupleMembers[i].getAttribute("Hierarchy"),
                            parentName: getFirstChildText(tuple, "PARENT_UNIQUE_NAME"),
                            levelName: getFirstChildText(tuple, "LName")
                        };

                        levelSum += level;
                    }
                });
            }
        });


        while(axes.length < 2) {
            axes.push([[{
                level: 0
            }]]);
        }

        return axes;
    }

    function getNodeText(node) {
        return node && node && (node.textContent || node.text || node.innerHTML) || "";
    }

    function parseCells(xml, axes, measureCount) {
        var cells = [];
        var cell = [];
        var index = 0;
        var measureIndex;
        var cellsOriginal = [];
        var cellElements = xml.getElementsByTagName("Cell");
        var errorDictionary = {};
        var row;

        for(var i = 0; i < cellElements.length; i++) {
            var xmlCell = cellElements[i];
            var valueElement = xmlCell.getElementsByTagName("Value")[0];
            var errorElements = valueElement && valueElement.getElementsByTagName("Error") || [];
            var text = errorElements.length === 0 ? getNodeText(valueElement) : "#N/A";
            var value = parseFloat(text);
            var isNumeric = (text - value + 1) > 0;
            var cellOrdinal = getNumber(xmlCell.getAttribute("CellOrdinal"));

            if(errorElements.length) {
                errorDictionary[getNodeText(errorElements[0].getElementsByTagName("ErrorCode")[0])] = getNodeText(errorElements[0].getElementsByTagName("Description")[0]);
            }

            cellsOriginal[cellOrdinal] = {
                value: isNumeric ? value : text || null
            };
        }

        each(axes[1], function() {
            row = [];
            cells.push(row);
            each(axes[0], function() {
                measureIndex = index % measureCount;

                if(measureIndex === 0) {
                    cell = [];
                    row.push(cell);
                }

                cell.push(cellsOriginal[index] ? cellsOriginal[index].value : null);
                index++;
            });
        });

        Object.keys(errorDictionary).forEach(function(key) {
            errors.log("W4002", errorDictionary[key]);
        });

        return cells;
    }

    function preparePathValue(pathValue, dataField) {
        if(pathValue) {
            pathValue = typeUtils.isString(pathValue) && pathValue.indexOf("&") !== -1 ? pathValue : "[" + pathValue + "]";

            if(dataField && pathValue.indexOf(dataField + ".") === 0) {
                pathValue = pathValue.slice(dataField.length + 1, pathValue.length);
            }
        }
        return pathValue;
    }

    function getItem(hash, name, member, index) {
        var item = hash[name];

        if(!item) {
            item = {};
            hash[name] = item;
        }

        if(!typeUtils.isDefined(item.value) && member) {
            item.text = member.caption;
            item.value = member.value;
            item.key = name ? name : '';
            item.levelName = member.levelName;
            item.hierarchyName = member.hierarchyName;
            item.parentName = member.parentName;
            item.index = index;
            item.level = member.level;
        }

        return item;
    }

    function getVisibleChildren(item, visibleLevels) {
        var result = [];

        var children = item.children && (item.children.length ? item.children : Object.keys(item.children.grandTotalHash || {}).reduce((result, name) => {
            return result.concat(item.children.grandTotalHash[name].children);
        }, []));

        var firstChild = children && children[0];

        if(firstChild && (visibleLevels[firstChild.hierarchyName] && (inArray(firstChild.levelName, visibleLevels[firstChild.hierarchyName]) !== -1) || !visibleLevels[firstChild.hierarchyName] || firstChild.level === 0)) {
            var newChildren = children.filter(child => child.hierarchyName === firstChild.hierarchyName);
            newChildren.grandTotalHash = children.grandTotalHash;
            return newChildren;
        } else if(firstChild) {
            for(var i = 0; i < children.length; i++) {
                if(children[i].hierarchyName === firstChild.hierarchyName) {
                    result.push.apply(result, getVisibleChildren(children[i], visibleLevels));
                }
            }
        }
        return result;
    }

    function processMember(dataIndex, member, parentItem) {
        var currentItem;
        var children = parentItem.children = parentItem.children || [];
        var hash = children.hash = children.hash || {};
        var grandTotalHash = children.grandTotalHash = children.grandTotalHash || {};

        if(member.parentName) {
            parentItem = getItem(hash, member.parentName);
            children = parentItem.children = parentItem.children || [];
        }

        currentItem = getItem(hash, member.name, member, dataIndex);

        if(member.hasValue && !currentItem.added) {
            currentItem.index = dataIndex;
            currentItem.added = true;
            children.push(currentItem);
        }

        if((!parentItem.value || !parentItem.parentName) && member.parentName) {
            grandTotalHash[member.parentName] = parentItem;
        } else {
            if(grandTotalHash[parentItem.name]) {
                delete grandTotalHash[member.parentName];
            }
        }
        return currentItem;
    }

    function getGrandTotalIndex(parentItem, visibleLevels) {
        var grandTotalIndex;
        if(parentItem.children.length === 1 && parentItem.children[0].parentName === "") {
            grandTotalIndex = parentItem.children[0].index;
            // TODO - refactoring
            var grandTotalHash = parentItem.children.grandTotalHash;
            parentItem.children = parentItem.children[0].children || [];

            parentItem.children.grandTotalHash = grandTotalHash;

            parentItem.children = getVisibleChildren(parentItem, visibleLevels);
        } else if(parentItem.children.length === 0) {
            grandTotalIndex = 0;
        }

        return grandTotalIndex;
    }

    function fillDataSourceAxes(dataSourceAxis, axisTuples, measureCount, visibleLevels) {
        var grandTotalIndex;
        var result = [];

        each(axisTuples, function(tupleIndex, members) {
            var parentItem = {
                children: result
            };

            var dataIndex = typeUtils.isDefined(measureCount) ? Math.floor(tupleIndex / measureCount) : tupleIndex;

            each(members, function(_, member) {
                parentItem = processMember(dataIndex, member, parentItem);
            });
        });

        var parentItem = {
            children: result
        };

        parentItem.children = getVisibleChildren(parentItem, visibleLevels);

        grandTotalIndex = getGrandTotalIndex(parentItem, visibleLevels);

        pivotGridUtils.foreachTree(parentItem.children, function(items) {
            var item = items[0];
            var children = getVisibleChildren(item, visibleLevels);

            if(children.length) {
                item.children = children;
            } else {
                delete item.children;
            }
            delete item.levelName;
            delete item.hierarchyName;
            delete item.added;
            delete item.parentName;
            delete item.level;
        }, true);

        each(parentItem.children || [], function(_, e) {
            dataSourceAxis.push(e);
        });

        return grandTotalIndex;
    }

    function checkError(xml) {
        var faultElementNS = xml.getElementsByTagName("soap:Fault");
        var faultElement = xml.getElementsByTagName("Fault");
        var errorElement = $([].slice.call(faultElement.length ? faultElement : faultElementNS)).find("Error");
        var description;
        var error;

        if(errorElement.length) {
            description = errorElement.attr("Description");
            error = new errors.Error("E4000", description);
            errors.log("E4000", description);
            return error;
        }
        return null;
    }

    function parseResult(xml, parseOptions) {
        var dataSource = {
            columns: [],
            rows: []
        };

        var axes;
        var measureCount = parseOptions.measureCount;

        axes = parseAxes(xml, parseOptions.skipValues);

        dataSource.grandTotalColumnIndex = fillDataSourceAxes(dataSource.columns, axes[0], measureCount, parseOptions.visibleLevels);

        dataSource.grandTotalRowIndex = fillDataSourceAxes(dataSource.rows, axes[1], undefined, parseOptions.visibleLevels);

        dataSource.values = parseCells(xml, axes, measureCount);

        return dataSource;
    }

    function parseDiscoverRowSet(xml, schema, dimensions, translatedDisplayFolders) {
        var result = [];
        var isMeasure = schema === "MEASURE";
        var displayFolderField = isMeasure ? "MEASUREGROUP_NAME" : schema + "_DISPLAY_FOLDER";

        each(xml.getElementsByTagName("row"), function(_, row) {
            var hierarchyName = schema === "LEVEL" ? getFirstChildText(row, "HIERARCHY_UNIQUE_NAME") : undefined;
            var levelNumber = getFirstChildText(row, "LEVEL_NUMBER");
            var displayFolder = getFirstChildText(row, displayFolderField);

            if(isMeasure) {
                displayFolder = translatedDisplayFolders[displayFolder] || displayFolder;
            }

            if((levelNumber !== "0" || getFirstChildText(row, schema + "_IS_VISIBLE") !== "true") && (getFirstChildText(row, "DIMENSION_TYPE") !== MD_DIMTYPE_MEASURE)) {
                var dimension = isMeasure ? MEASURE_DEMENSION_KEY : getFirstChildText(row, "DIMENSION_UNIQUE_NAME");
                var dataField = getFirstChildText(row, schema + "_UNIQUE_NAME");
                result.push({
                    dimension: dimensions.names[dimension] || dimension,
                    groupIndex: levelNumber ? getNumber(levelNumber) - 1 : undefined,
                    dataField: dataField,
                    caption: getFirstChildText(row, schema + "_CAPTION"),
                    hierarchyName: hierarchyName,
                    groupName: hierarchyName,
                    displayFolder: displayFolder,
                    isMeasure: isMeasure,
                    isDefault: !!dimensions.defaultHierarchies[dataField]
                });
            }
        });

        return result;
    }

    function parseMeasureGroupDiscoverRowSet(xml) {
        var measureGroups = {};
        each(xml.getElementsByTagName("row"), function(_, row) {
            measureGroups[getFirstChildText(row, "MEASUREGROUP_NAME")] = getFirstChildText(row, "MEASUREGROUP_CAPTION");
        });
        return measureGroups;
    }

    function parseDimensionsDiscoverRowSet(xml) {
        var result = {
            names: {},
            defaultHierarchies: {}
        };

        each($(xml).find("row"), function() {
            var $row = $(this);
            var type = $row.children("DIMENSION_TYPE").text();
            var dimensionName = type === MD_DIMTYPE_MEASURE ? MEASURE_DEMENSION_KEY : $row.children("DIMENSION_UNIQUE_NAME").text();

            result.names[dimensionName] = $row.children("DIMENSION_CAPTION").text();
            result.defaultHierarchies[$row.children("DEFAULT_HIERARCHY").text()] = true;
        });
        return result;
    }

    function parseStringWithUnicodeSymbols(str) {
        str = str.replace(/_x(....)_/g, function(whole, group1) {
            return String.fromCharCode(parseInt(group1, 16));
        });

        var stringArray = str.match(/\[.+?\]/gi);
        if(stringArray && stringArray.length) {
            str = stringArray[stringArray.length - 1];
        }

        return str
            .replace(/\[/gi, "")
            .replace(/\]/gi, "")
            .replace(/\$/gi, "")
            .replace(/\./gi, " ");
    }

    function parseDrillDownRowSet(xml) {
        var rows = xml.getElementsByTagName("row");
        var result = [];
        var columnNames = {};

        for(var i = 0; i < rows.length; i++) {
            var children = rows[i].childNodes;
            var item = {};

            for(var j = 0; j < children.length; j++) {
                var tagName = children[j].tagName;
                var name = columnNames[tagName] = columnNames[tagName] || parseStringWithUnicodeSymbols(tagName);
                item[name] = getNodeText(children[j]);
            }
            result.push(item);
        }

        return result;
    }

    function sendQuery(storeOptions, mdxString) {
        mdxString = $("<div>").text(mdxString).html();
        return execXMLA(storeOptions, stringFormat(execute, mdxString, storeOptions.catalog, getLocaleIdProperty()));
    }

    function processTotalCount(data, options, totalCountXml) {
        const axes = [];
        const columnOptions = options.columns || [];
        const rowOptions = options.rows || [];

        if(columnOptions.length) {
            axes.push({});
        }
        if(rowOptions.length) {
            axes.push({});
        }
        const cells = parseCells(totalCountXml, [[{}], [{}, {}]], 1);
        if(!columnOptions.length && rowOptions.length) {
            data.rowCount = cells[0][0][0] - 1;
        }
        if(!rowOptions.length && columnOptions.length) {
            data.columnCount = cells[0][0][0] - 1;
        }

        if(rowOptions.length && columnOptions.length) {
            data.rowCount = cells[0][0][0] - 1;
            data.columnCount = cells[1][0][0] - 1;
        }

        if(data.rowCount !== undefined) {
            data.rows = [...Array(options.rowSkip)].concat(data.rows);
            data.rows.length = data.rowCount;

            for(let i = 0; i < data.rows.length; i++) {
                data.rows[i] = data.rows[i] || {};
            }
        }

        if(data.columnCount !== undefined) {
            data.columns = [...Array(options.columnSkip)].concat(data.columns);
            data.columns.length = data.columnCount;

            for(let i = 0; i < data.columns.length; i++) {
                data.columns[i] = data.columns[i] || {};
            }
        }
    }

    /**
    * @name XmlaStore
    * @type object
    * @namespace DevExpress.data
    * @module ui/pivot_grid/xmla_store
    * @export default
    */

    return {
        ctor: function(options) {
            this._options = options;

            /**
            * @name XmlaStoreOptions.url
            * @type string
            */

            /**
            * @name XmlaStoreOptions.catalog
            * @type string
            */

            /**
            * @name XmlaStoreOptions.cube
            * @type string
            */

            /**
             * @name XmlaStoreOptions.beforeSend
             * @type function
             * @type_function_param1 options:object
             * @type_function_param1_field1 url:string
             * @type_function_param1_field2 method:string
             * @type_function_param1_field3 headers:object
             * @type_function_param1_field4 xhrFields:object
             * @type_function_param1_field5 data:string
             * @type_function_param1_field6 dataType:string
             */
        },

        getFields: function() {
            var options = this._options;
            var catalog = options.catalog;
            var cube = options.cube;
            var localeIdProperty = getLocaleIdProperty();
            var dimensionsRequest = execXMLA(options, stringFormat(discover, catalog, cube, "MDSCHEMA_DIMENSIONS", localeIdProperty));
            var measuresRequest = execXMLA(options, stringFormat(discover, catalog, cube, "MDSCHEMA_MEASURES", localeIdProperty));
            var hierarchiesRequest = execXMLA(options, stringFormat(discover, catalog, cube, "MDSCHEMA_HIERARCHIES", localeIdProperty));
            var levelsRequest = execXMLA(options, stringFormat(discover, catalog, cube, "MDSCHEMA_LEVELS", localeIdProperty));
            var result = new Deferred();


            when(dimensionsRequest, measuresRequest, hierarchiesRequest, levelsRequest).then(function(dimensionsResponse, measuresResponse, hierarchiesResponse, levelsResponse) {
                execXMLA(options, stringFormat(discover, catalog, cube, "MDSCHEMA_MEASUREGROUPS", localeIdProperty)).done(function(measureGroupsResponse) {
                    var dimensions = parseDimensionsDiscoverRowSet(dimensionsResponse);
                    var hierarchies = parseDiscoverRowSet(hierarchiesResponse, "HIERARCHY", dimensions);
                    var levels = parseDiscoverRowSet(levelsResponse, "LEVEL", dimensions);
                    var measureGroups = parseMeasureGroupDiscoverRowSet(measureGroupsResponse);
                    var fields = parseDiscoverRowSet(measuresResponse, "MEASURE", dimensions, measureGroups).concat(hierarchies);
                    var levelsByHierarchy = {};

                    each(levels, function(_, level) {
                        levelsByHierarchy[level.hierarchyName] = levelsByHierarchy[level.hierarchyName] || [];
                        levelsByHierarchy[level.hierarchyName].push(level);
                    });

                    each(hierarchies, function(_, hierarchy) {
                        if(levelsByHierarchy[hierarchy.dataField] && levelsByHierarchy[hierarchy.dataField].length > 1) {
                            hierarchy.groupName = hierarchy.hierarchyName = hierarchy.dataField;

                            fields.push.apply(fields, levelsByHierarchy[hierarchy.hierarchyName]);
                        }
                    });
                    result.resolve(fields);
                }).fail(result.reject);
            }).fail(result.reject);

            return result;
        },

        load: function(options) {
            var result = new Deferred();
            var storeOptions = this._options;

            var parseOptions = {
                skipValues: options.skipValues
            };

            var mdxString = generateMDX(options, storeOptions.cube, parseOptions);

            let rowCountMdx;
            if(options.rowSkip || options.rowTake || options.columnTake || options.columnSkip) {
                rowCountMdx = generateMDX(Object.assign({}, options, {
                    totalsOnly: true,
                    rowSkip: null,
                    rowTake: null,
                    columnSkip: null,
                    columnTake: null
                }), storeOptions.cube, {});
            }

            const load = () => {
                if(mdxString) {
                    when(sendQuery(storeOptions, mdxString), rowCountMdx && sendQuery(storeOptions, rowCountMdx)).done(function(executeXml, rowCountXml) {
                        var error = checkError(executeXml) || rowCountXml && checkError(rowCountXml);
                        if(!error) {
                            const response = parseResult(executeXml, parseOptions);
                            if(rowCountXml) {
                                processTotalCount(response, options, rowCountXml);
                            }

                            result.resolve(response);
                        } else {
                            result.reject(error);
                        }
                    }).fail(result.reject);
                } else {
                    result.resolve({
                        columns: [],
                        rows: [],
                        values: [],
                        grandTotalColumnIndex: 0,
                        grandTotalRowIndex: 0
                    });
                }
            };

            if(options.delay) {
                setTimeout(load, options.delay);
            } else {
                load();
            }

            return result;
        },
        supportSorting: function() {
            return true;
        },

        getDrillDownItems: function(options, params) {
            var result = new Deferred();
            var storeOptions = this._options;
            var mdxString = generateDrillDownMDX(options, storeOptions.cube, params);

            if(mdxString) {
                when(sendQuery(storeOptions, mdxString)).done(function(executeXml) {
                    var error = checkError(executeXml);

                    if(!error) {
                        result.resolve(parseDrillDownRowSet(executeXml));
                    } else {
                        result.reject(error);
                    }
                }).fail(result.reject);
            } else {
                result.resolve([]);
            }
            return result;
        },

        key: noop,
        filter: noop
    };
})()).include(pivotGridUtils.storeDrillDownMixin);
