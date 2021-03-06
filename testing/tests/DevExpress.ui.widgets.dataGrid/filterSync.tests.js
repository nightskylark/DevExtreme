"use strict";

require("ui/data_grid/ui.data_grid");

var $ = require("jquery"),
    dataGridMocks = require("../../helpers/dataGridMocks.js"),
    customOperations = require("ui/grid_core/ui.grid_core.filter_custom_operations"),
    fx = require("animation/fx"),
    setupDataGridModules = dataGridMocks.setupDataGridModules;

var HEADER_FILTER_CLASS = "dx-header-filter",
    HEADER_FILTER_EMPTY_CLASS = HEADER_FILTER_CLASS + "-empty";

QUnit.testStart(function() {
    var markup =
    '<div>\
        <div class="dx-datagrid">\
            <div id="container"></div>\
        </div>\
    </div>';

    $("#qunit-fixture").html(markup);
});

QUnit.module("Sync with FilterValue", {
    beforeEach: function() {
        this.setupDataGrid = function(options) {
            this.options = $.extend({
                columns: [{ dataField: "field" }],
                filterSyncEnabled: true,
                filterValue: null
            }, options);
            setupDataGridModules(this, ["columns", "data", "columnHeaders", "filterRow", "headerFilter", "filterSync"], {
                initViews: true
            });
        };
    }
}, function() {
    QUnit.test("equals", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "=", 2],
            columns: [{ dataField: "field" }]
        });

        // assert
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), [2]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterType"), "include");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), 2);
    });

    QUnit.test("anyof with one value", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "anyof", [1]]
        });

        // assert
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), [1]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), undefined);
    });

    QUnit.test("anyof with two values", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "anyof", [2, 1]]
        });

        // assert
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), [2, 1]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), undefined);
    });

    QUnit.test("noneof one value", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "noneof", [1]]
        });

        // assert
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), [1]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterType"), "exclude");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), undefined);
    });

    QUnit.test("noneof two values", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "noneof", [2, 1]]
        });

        // assert
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), [2, 1]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterType"), "exclude");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), undefined);
    });

    QUnit.test("does not equal", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "<>", 2]
        });

        // assert
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), [2]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterType"), "exclude");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), 2);
    });

    QUnit.test("skip column filter values on initialization", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "<>", 2],
            columns: [{ dataField: "field", filterValue: 1, filterValues: [1, 3] }],
        });

        // assert
        assert.deepEqual(this.option("filterValue"), ["field", "<>", 2]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), [2]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterType"), "exclude");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), 2);
        assert.deepEqual(this.columnsController.columnOption("field", "selectedFilterOperation"), "<>");
    });

    QUnit.test("skip header filter for equal operation if it has groupInterval", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "=", 2],
            columns: [{ dataField: "field", filterValues: [1, 3], headerFilter: { groupInterval: 10 } }],
        });

        // assert
        assert.deepEqual(this.option("filterValue"), ["field", "=", 2]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), undefined);
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), 2);
        assert.deepEqual(this.columnsController.columnOption("field", "selectedFilterOperation"), "=");
    });

    QUnit.test("skip header filter for equal operation if it has dataSource", function(assert) {
        // arrange, act
        this.setupDataGrid({
            filterValue: ["field", "=", 2],
            columns: [{ dataField: "field", filterValues: [1, 3], headerFilter: { dataSource: [10] } }],
        });

        // assert
        assert.deepEqual(this.option("filterValue"), ["field", "=", 2]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), undefined);
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), 2);
        assert.deepEqual(this.columnsController.columnOption("field", "selectedFilterOperation"), "=");
    });

    QUnit.test("clear header filter & filterrow on initialization if filterValue = null", function(assert) {
        // arrange, act
        this.setupDataGrid({
            columns: [{ dataField: "field", filterValues: ["2", "3"], filterType: "include", filterValue: "1", selectedFilterOperation: "=" }],
        });

        // assert
        assert.deepEqual(this.option("filterValue"), null);
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), undefined);
        assert.deepEqual(this.columnsController.columnOption("field", "filterType"), "include");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), undefined);
        assert.deepEqual(this.columnsController.columnOption("field", "selectedFilterOperation"), undefined);
    });
});

QUnit.module("getCombinedFilter", {
    beforeEach: function() {
        this.setupDataGrid = function(options) {
            this.options = options;
            setupDataGridModules(this, ["columns", "data", "headerFilter", "filterRow", "filterSync"], {
                initViews: false
            });
        };
    },
    afterEach: function() {
    }
}, function() {
    QUnit.test("value = null", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: ["Test"],
            filterValue: null
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), undefined, "combined filter");
    });

    QUnit.test("one value", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: ["Test"],
            filterValue: ["Test", "=", 1]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), ["Test", "=", 1], "combined filter");
    });

    QUnit.test("between", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: ["Test"],
            filterValue: ["Test", "between", [1, 2]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), [["Test", ">=", 1], "and", ["Test", "<=", 2]], "combined filter");
    });

    QUnit.test("anyof", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: ["Test"],
            filterValue: ["Test", "anyof", [1, 2]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), [["Test", "=", 1], "or", ["Test", "=", 2]], "combined filter");
    });

    QUnit.test("noneof", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: ["Test"],
            filterValue: ["Test", "noneof", [1, 2]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), ["!", [["Test", "=", 1], "or", ["Test", "=", 2]]], "combined filter");
    });

    QUnit.test("ignore Header Filter & Filter Row when filterSyncEnabled = true", function(assert) {
        // arrange
        var filterValue = [["Test", "=", 2], "and", ["Test", "anyof", [5, 6]]];

        // act
        this.setupDataGrid({
            filterSyncEnabled: true,
            dataSource: [],
            columns: [{ dataField: "Test", filterValue: 3, defaultFilterOperation: "=", filterValues: [4, 8] }],
            filterValue: filterValue
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), [["Test", "=", 2], "and", [["Test", "=", 5], "or", ["Test", "=", 6]]], "combined filter");
    });

    QUnit.test("filterValue & Header Filter & Filter Row (filterSyncEnabled = false)", function(assert) {
        // act
        this.setupDataGrid({
            filterSyncEnabled: false,
            dataSource: [],
            columns: [{ dataField: "Test", filterValue: 3, defaultFilterOperation: "=", filterValues: [4, 8] }],
            filterValue: [["Test", "=", 2], "and", ["Test", "anyof", [5, 6]]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true),
            [
                [
                    ["Test", "=", 3],
                    "and",
                    [["Test", "=", 4], "or", ["Test", "=", 8]]
                ],
                "and",
                [
                    ["Test", "=", 2],
                    "and",
                    [["Test", "=", 5 ], "or", ["Test", "=", 6]]
                ]
            ], "combined filter");
    });

    QUnit.test("calculateFilterExpression", function(assert) {
        var handler = sinon.spy();

        // act
        this.setupDataGrid({
            dataSource: [],
            columns: [{
                dataField: "Test",
                calculateFilterExpression: handler
            }],
            filterValue: ["Test", "between", [1, 2]]
        });

        this.getCombinedFilter();

        // assert
        assert.deepEqual(handler.lastCall.args[0], [1, 2], "filterValue");
        assert.equal(handler.lastCall.args[1], "between", "selectedFilterOperation");
        assert.equal(handler.lastCall.args[2], "filterBuilder", "target");
    });

    QUnit.test("header filter exclude", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            filterSyncEnabled: true,
            columns: [{ dataField: "field", filterType: "exclude" }],
            filterValue: ["field", "noneof", ["1", "2"]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), ["!", [["field", "=", "1"], "or", ["field", "=", "2"]]], "combined filter");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), ["1", "2"]);
        assert.deepEqual(this.columnsController.columnOption("field", "filterType"), "exclude");
    });

    QUnit.test("group in value - include", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: [{ dataField: "Test", filterType: "include" }],
            filterValue: ["Test", "anyof", [
                ["Test", "<", 3000],
                [
                    ["Test", ">=", 3000],
                    "and",
                    ["Test", "<", 5000]
                ]
            ]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), [
            ["Test", "<", 3000],
            "or",
            [
                ["Test", ">=", 3000],
                "and",
                ["Test", "<", 5000]
            ]
        ], "combined filter");
    });

    QUnit.test("group in value - exclude", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: [{ dataField: "Test", filterType: "exclude" }],
            filterValue: ["Test", "noneof", [
                ["Test", "<", 3000],
                [
                    ["Test", ">=", 3000],
                    "and",
                    ["Test", "<", 5000]
                ]
            ]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), [
            "!",
            [
                ["Test", "<", 3000],
                "or",
                [
                    ["Test", ">=", 3000],
                    "and",
                    ["Test", "<", 5000]
                ]
            ]
        ], "combined filter");
    });

    QUnit.test("value with number type - exclude", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: [{ dataField: "Test", filterType: "exclude" }],
            filterValue: ["Test", "noneof", [1]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), ["!", ["Test", "=", 1]], "combined filter");
    });

    QUnit.test("value with one item and groupInterval - exclude", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: [{ dataField: "Test", filterType: "exclude", headerFilter: { groupInterval: 100 }, dataType: "number" }],
            filterValue: ["Test", "noneof", [0]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), [
            "!",
            [
                ["Test", ">=", 0],
                "and",
                ["Test", "<", 100]
            ]
        ], "combined filter");
    });

    QUnit.test("value with two items and groupInterval - exclude", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: [{ dataField: "Test", filterType: "exclude", headerFilter: { groupInterval: 100 }, dataType: "number" }],
            filterValue: ["Test", "noneof", [0, 100]]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), [
            "!",
            [
                [
                    ["Test", ">=", 0],
                    "and",
                    ["Test", "<", 100]
                ],
                "or",
                [
                    ["Test", ">=", 100],
                    "and",
                    ["Test", "<", 200]
                ]
            ]
        ], "combined filter");
    });

    QUnit.test("value with groupInterval and without items", function(assert) {
        // act
        this.setupDataGrid({
            dataSource: [],
            columns: [{ dataField: "Test", filterType: "exclude", headerFilter: { groupInterval: 100 }, dataType: "number" }],
            filterValue: ["Test", "noneof", []]
        });

        // assert
        assert.deepEqual(this.getCombinedFilter(true), undefined, "combined filter");
    });

    QUnit.test("skip currentColumn header filter value when filterSyncEnabled = true", function(assert) {
        // arrange
        var filterRowFilter = ["Test", "=", 2];

        // act
        this.setupDataGrid({
            dataSource: [],
            filterSyncEnabled: true,
            columns: [{ dataField: "Test", filterType: "exclude", headerFilter: { dataSource: [1, 2, 3, 4, 5] }, dataType: "number" }],
            filterValue: [["Test", "anyof", [1, 2, 3]], "and", filterRowFilter]
        });

        this.headerFilterController.getCurrentColumn = function() {
            return { dataField: "Test" };
        };

        // assert
        assert.deepEqual(this.getCombinedFilter(true), undefined, "combined filter");
    });

    QUnit.test("add currentColumn header filter value when filterSyncEnabled = false", function(assert) {
        // arrange
        var filterRowFilter = ["Test", "=", 2];

        // act
        this.setupDataGrid({
            dataSource: [],
            filterSyncEnabled: false,
            columns: [{ dataField: "Test", filterType: "exclude", headerFilter: { dataSource: [1, 2, 3, 4, 5] }, dataType: "number" }],
            filterValue: [["Test", "anyof", [1, 2, 3]], "and", filterRowFilter]
        });

        this.headerFilterController.getCurrentColumn = function() {
            return { dataField: "Test" };
        };

        // assert
        assert.deepEqual(this.getCombinedFilter(true), [
            [
                ["Test", "=", 1],
                "or",
                ["Test", "=", 2],
                "or",
                ["Test", "=", 3]
            ],
            "and",
            filterRowFilter
        ], "combined filter");
    });
});

QUnit.module("Sync on initialization", {
    beforeEach: function() {
        this.setupDataGrid = function(options) {
            this.options = options;
            setupDataGridModules(this, ["columns", "data", "filterSync"], {
                initViews: false
            });
        };
    },
    afterEach: function() {
    }
}, function() {
    QUnit.test("clearing of filterValue", function(assert) {
        // act
        this.setupDataGrid({
            filterValue: null,
            filterSyncEnabled: true,
            columns: [{
                dataField: "Test",
                filterValue: "1"
            }]
        });

        // assert
        assert.deepEqual(this.option("filterValue"), null, "filterValue");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), undefined);
    });

    QUnit.test("clearing of filterValues", function(assert) {
        // act
        this.setupDataGrid({
            filterValue: null,
            filterSyncEnabled: true,
            columns: [{
                dataField: "field",
                filterValues: ["2", "3"]
            }]
        });

        // assert
        assert.deepEqual(this.option("filterValue"), null, "filterValue");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), undefined);
    });

    QUnit.test("clearing of filter is disabled", function(assert) {
        // act
        this.setupDataGrid({
            filterValue: null,
            columns: [{
                dataField: "field",
                filterValue: "1",
                filterValues: ["2", "3"]
            }]
        });

        // assert
        assert.equal(this.option("filterValue"), null, "filterValue");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValue"), "1");
        assert.deepEqual(this.columnsController.columnOption("field", "filterValues"), ["2", "3"]);
    });
});

QUnit.module("Real dataGrid", {
    beforeEach: function() {
        this.initDataGrid = function(options) {
            this.dataGrid = $("#container").dxDataGrid($.extend({
                dataSource: [{}],
                filterSyncEnabled: true,
                loadingTimeout: undefined,
                filterRow: {
                    visible: true
                },
                headerFilter: {
                    visible: true
                },
                columns: [{ dataField: "field", filterValues: [1], filterType: "exclude", filterValue: 2, selectedFilterOperation: "=" }]
            }, options)).dxDataGrid("instance");
            return this.dataGrid;
        };

        this.clock = sinon.useFakeTimers();
        fx.off = true;
    },
    afterEach: function() {
        this.dataGrid.dispose();
        this.clock.restore();
        fx.off = false;
    }
}, function() {
    QUnit.test("clear all filters", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid();

        // act
        dataGrid.option("filterValue", null);

        // assert
        assert.deepEqual(dataGrid.columnOption("field", "filterValues"), undefined);
        assert.deepEqual(dataGrid.columnOption("field", "filterType"), "include");
        assert.deepEqual(dataGrid.columnOption("field", "filterValue"), undefined);
        assert.deepEqual(dataGrid.columnOption("field", "selectedFilterOperation"), undefined);
    });

    QUnit.test("update filterValue after change filter text with defaultFilterOperation", function(assert) {
        var dataGrid = this.initDataGrid({
            columns: [{ dataField: "field", dataType: "number", defaultFilterOperation: "=", allowFiltering: true, index: 0 }]
        });
        var filterRowInput = $(".dx-texteditor");
        assert.equal(filterRowInput.length, 1);

        filterRowInput.find(".dx-texteditor-input").val(90);
        filterRowInput.find(".dx-texteditor-input").trigger("keyup");

        this.clock.tick(700);

        assert.deepEqual(dataGrid.option("filterValue"), ["field", "=", 90]);
    });

    QUnit.test("filterSync === 'auto' with filterPanel", function(assert) {
        var dataGrid = this.initDataGrid({
            columns: [{ dataField: "field", dataType: "number", defaultFilterOperation: "=", allowFiltering: true, index: 0 }],
            filterSyncEnabled: "auto",
            filterPanel: { visible: true }
        });
        var filterRowInput = $(".dx-texteditor");
        assert.equal(filterRowInput.length, 1);

        filterRowInput.find(".dx-texteditor-input").val(90);
        filterRowInput.find(".dx-texteditor-input").trigger("keyup");

        this.clock.tick(700);

        assert.deepEqual(dataGrid.option("filterValue"), ["field", "=", 90]);
        assert.equal($(".dx-datagrid-filter-panel-text").text(), "[Field] Equals '90'", "filterPanel value synchronized");
    });

    QUnit.test("filterSync === 'auto' without filterPanel", function(assert) {
        var dataGrid = this.initDataGrid({
            columns: [{ dataField: "field", dataType: "number", defaultFilterOperation: "=", allowFiltering: true, index: 0 }],
            filterSyncEnabled: "auto"
        });
        var filterRowInput = $(".dx-texteditor");
        assert.equal(filterRowInput.length, 1);

        filterRowInput.find(".dx-texteditor-input").val(90);
        filterRowInput.find(".dx-texteditor-input").trigger("keyup");

        this.clock.tick(700);

        assert.equal(dataGrid.option("filterValue"), null, "filter has no synchronization");
        assert.equal($(".dx-datagrid-filter-panel-text").length, 0, "filterPanel has no value");
    });

    QUnit.test("update filterValue after change filter text with selectedFilterOperation", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            columns: [{ dataField: "field", dataType: "number", defaultFilterOperation: "=", selectedFilterOperation: "<>", allowFiltering: true, index: 0 }]
        });

        dataGrid.columnOption("field", { filterValue: 90 });

        // assert
        assert.deepEqual(dataGrid.option("filterValue"), ["field", "<>", 90]);
    });

    QUnit.test("update filterValue after change filter operation", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            columns: [{
                dataField: "field",
                dataType: "number",
                filterOperations: ["=", "<", ">", "<>"]
            }],
            filterValue: ["field", "<>", 90]
        });

        dataGrid.columnOption("field", { selectedFilterOperation: "<" });

        // assert
        assert.deepEqual(dataGrid.option("filterValue"), ["field", "<", 90]);
    });

    QUnit.test("filterValue == null after change filter operation without value", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            columns: [{
                dataField: "field",
                dataType: "number",
                defaultFilterOperation: "=",
                selectedFilterOperation: "<>",
                filterOperations: ["=", "<", ">", "<>"]
            }]
        });

        dataGrid.columnOption("field", { selectedFilterOperation: "<" });

        // assert
        assert.deepEqual(dataGrid.option("filterValue"), null);
    });

    QUnit.test("onClick mode", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            columns: [
                { dataField: "field", dataType: "number", selectedFilterOperation: "<>", allowFiltering: true },
                { dataField: "field2", dataType: "number", selectedFilterOperation: "=", allowFiltering: true }
            ],
            filterRow: {
                visible: true,
                applyFilter: "onClick"
            }
        });

        // act
        var filterRowInput = $(".dx-texteditor").eq(0);
        filterRowInput.find(".dx-texteditor-input").val(90);
        filterRowInput.find(".dx-texteditor-input").trigger("keyup");

        filterRowInput = $(".dx-texteditor").eq(1);
        filterRowInput.find(".dx-texteditor-input").val(150);
        filterRowInput.find(".dx-texteditor-input").trigger("keyup");
        this.clock.tick(700);
        // assert
        assert.deepEqual(dataGrid.option("filterValue"), null);

        // act
        var $button = $(".dx-apply-button");
        $button.trigger("dxclick");
        // assert
        assert.deepEqual(dataGrid.option("filterValue"), [["field", "<>", 90], "and", ["field2", "=", 150]]);
    });

    QUnit.test("change field filterValues", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid();

        // act
        dataGrid.columnOption("field", { filterValues: [2, 3], filterType: "exclude" });

        // assert
        assert.deepEqual(dataGrid.option("filterValue"), ["field", "noneof", [2, 3]]);
        assert.deepEqual(dataGrid.columnOption("field", "filterValues"), [2, 3]);
        assert.deepEqual(dataGrid.columnOption("field", "filterType"), "exclude");
        assert.deepEqual(dataGrid.columnOption("field", "filterValue"), undefined);
        assert.deepEqual(dataGrid.columnOption("field", "selectedFilterOperation"), undefined);
    });

    QUnit.test("change field filterValue", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid();

        // act
        dataGrid.columnOption("field", { filterValue: 100, selectedFilterOperation: "=" });

        // assert
        assert.deepEqual(dataGrid.option("filterValue"), ["field", "=", 100]);
        assert.deepEqual(dataGrid.columnOption("field", "filterValues"), [100]);
        assert.deepEqual(dataGrid.columnOption("field", "filterType"), "include");
        assert.deepEqual(dataGrid.columnOption("field", "filterValue"), 100);
        assert.deepEqual(dataGrid.columnOption("field", "selectedFilterOperation"), "=");
    });

    QUnit.test("do not sync if filterSyncEnabled = false", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            filterSyncEnabled: false,
            filterValue: null,
            columns: [{ dataField: "field", filterValues: [1, 3], filterValue: 1, selectedFilterOperation: "=" }],
        });
        // act
        dataGrid.option("filterValue", [["field", "anyof", [2]], "and", ["field", "=", 55]]);
        // assert
        assert.deepEqual(dataGrid.option("filterValue"), [["field", "anyof", [2]], "and", ["field", "=", 55]]);
        assert.deepEqual(dataGrid.columnOption("field", "filterValues"), [1, 3]);
        assert.deepEqual(dataGrid.columnOption("field", "filterValue"), 1);
        assert.deepEqual(dataGrid.columnOption("field", "selectedFilterOperation"), "=");
    });

    QUnit.test("header-filter-empty class isn't set in filtered column indicator when filterSyncEnabled = true", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            filterSyncEnabled: true,
            filterValue: null,
            columns: [{ dataField: "field" }],
            headerFilter: {
                visible: true
            }
        });
        // act
        dataGrid.option("filterValue", ["field", "=", 2]);
        // assert
        assert.equal($("." + HEADER_FILTER_CLASS).length, 1);
        assert.equal($("." + HEADER_FILTER_EMPTY_CLASS).length, 0);
    });

    QUnit.test("header-filter-empty class is set in filtered column indicator when filterSyncEnabled = false", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            filterSyncEnabled: false,
            filterValue: null,
            columns: [{ dataField: "field" }],
            headerFilter: {
                visible: true
            }
        });
        // act
        dataGrid.option("filterValue", ["field", "=", 2]);
        // assert
        assert.equal($("." + HEADER_FILTER_EMPTY_CLASS).length, 1);
    });

    QUnit.test("check equals (one value)", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            columns: [{ dataField: "field", allowHeaderFiltering: true }, { dataField: "excludedField", allowHeaderFiltering: true, filterType: "exclude" }]
        });

        // act
        dataGrid.columnOption("field", { filterValues: [2] });

        // assert
        assert.deepEqual(dataGrid.option("filterValue"), ["field", "=", 2]);
    });

    QUnit.test("check any of (two value)", function(assert) {
        // arrange
        var dataGrid = this.initDataGrid({
            columns: [{ dataField: "field", allowHeaderFiltering: true }, { dataField: "excludedField", allowHeaderFiltering: true, filterType: "exclude" }]
        });

        // act
        dataGrid.columnOption("field", { filterValues: [2, 1] });

        // assert
        assert.deepEqual(dataGrid.option("filterValue"), ["field", "anyof", [2, 1]]);
    });

    QUnit.test("colum option changed called once after change filterValue", function(assert) {
        // arrange
        var countCallFilterValueChanged = 0,
            dataGrid = this.initDataGrid({
                columns: [{ dataField: "field", allowHeaderFiltering: true, filterType: "exclude" }]
            });

        // act
        dataGrid.option("onOptionChanged", function(e) {
            if(e.fullName === "filterValue") {
                countCallFilterValueChanged++;
            }
        });
        dataGrid.option("filterValue", ["field", "anyof", [1]]);

        // assert
        assert.equal(countCallFilterValueChanged, 1);
    });

    QUnit.test("Load filterValue from state when filterSyncEnabled = false", function(assert) {
        // arrange, act
        var dataGrid = this.initDataGrid({
            filterSyncEnabled: false,
            columns: ["field", "field2"],
            stateStoring: {
                enabled: true,
                type: 'custom',
                customLoad: function() {
                    return {
                        filterValue: ["field", "=", 1],
                        columns: [{
                            dataField: "field",
                            filterValue: 2,
                            selectedFilterOperation: ">"
                        }, {
                            dataField: "field2",
                            filterValues: [2, 3],
                            filterType: "exclude"
                        }]
                    };
                },
                customSave: function() {
                }
            }
        });

        this.clock.tick();

        // assert
        assert.strictEqual(dataGrid.columnOption("field", "filterValue"), 2);
        assert.strictEqual(dataGrid.columnOption("field", "selectedFilterOperation"), ">");
        assert.deepEqual(dataGrid.columnOption("field2", "filterValues"), [2, 3]);
        assert.strictEqual(dataGrid.columnOption("field2", "filterType"), "exclude");
        assert.deepEqual(dataGrid.option("filterValue"), ["field", "=", 1]);
    });

    QUnit.test("Load filterValue from state when filterSyncEnabled = true", function(assert) {
        // arrange, act
        var dataGrid = this.initDataGrid({
            filterSyncEnabled: true,
            columns: ["field", "field2"],
            stateStoring: {
                enabled: true,
                type: 'custom',
                customLoad: function() {
                    return {
                        filterValue: ["field", "=", 1],
                        columns: [{
                            dataField: "field",
                            filterValue: 2,
                            selectedFilterOperation: ">"
                        }, {
                            dataField: "field2",
                            filterValues: [2, 3],
                            filterType: "exclude"
                        }]
                    };
                },
                customSave: function() {
                }
            }
        });

        this.clock.tick();

        // assert
        assert.strictEqual(dataGrid.columnOption("field", "filterValue"), 1);
        assert.strictEqual(dataGrid.columnOption("field", "selectedFilterOperation"), "=");
        assert.deepEqual(dataGrid.columnOption("field2", "filterValues"), undefined);
        assert.strictEqual(dataGrid.columnOption("field2", "filterType"), "include");
        assert.deepEqual(dataGrid.option("filterValue"), ["field", "=", 1]);
    });

    QUnit.test("Update state when applying filterValue", function(assert) {
        var customSaveSpy = sinon.spy(),
            dataGrid = this.initDataGrid({
                stateStoring: {
                    enabled: true,
                    type: 'custom',
                    customLoad: function() {
                        return {};
                    },
                    customSave: customSaveSpy,
                    savingTimeout: 0
                }
            });
        this.clock.tick();
        dataGrid.option("filterValue", ["field", "=", 1]);
        this.clock.tick();
        assert.deepEqual(customSaveSpy.lastCall.args[0].filterValue, ["field", "=", 1]);
    });
});

QUnit.module("Custom operations texts", {
    beforeEach: function() {
        this.getAnyOfOperation = function(field, dataSource) {
            var dataGrid = $("#container").dxDataGrid({
                dataSource: dataSource || [{}],
                loadingTimeout: undefined,
                columns: [field]
            }).dxDataGrid("instance");
            return customOperations.anyOf(dataGrid);
        };
    }
}, function() {
    QUnit.test("string value", function(assert) {
        // arrange
        var result,
            field = {
                dataField: "field",
            },
            anyOfOperation = this.getAnyOfOperation(field);

        // act
        result = anyOfOperation.customizeText({
            value: ["100", "200"],
            field: field
        });

        // assert
        assert.equal(result, "100, 200");
    });

    QUnit.test("date value", function(assert) {
        // arrange
        var result,
            field = {
                dataField: "field",
                dataType: "date"
            },
            anyOfOperation = this.getAnyOfOperation(field);

        // act
        result = anyOfOperation.customizeText({
            value: ["2014/1/1", "2014/2/4"],
            field: field
        });

        // assert
        assert.equal(result, "2014/1/1, 2014/2/4");
    });

    QUnit.test("date value and custom item", function(assert) {
        // arrange
        var result,
            field = {
                dataField: "field",
                dataType: "date",
                headerFilter: {
                    dataSource: function(data) {
                        data.dataSource.postProcess = function(results) {
                            results.push({
                                text: "Weekends",
                                value: "weekends"
                            });
                            return results;
                        };
                    }
                }
            },
            dataSource = [{ field: "2014/1/1" }, { field: "2014/1/3" }, { field: "2014/2/4" }],
            anyOfOperation = this.getAnyOfOperation(field, dataSource);

        // act
        anyOfOperation.customizeText({
            value: ["2014/1/1", "2014/2/4", "weekends"],
            field: field
        }).done(function(data) {
            result = data;
        });

        // assert
        assert.equal(result, "2014/January/1, 2014/February/4, Weekends");
    });

    QUnit.test("lookup", function(assert) {
        // arrange
        var result,
            field = {
                dataField: "field",
                lookup: {
                    valueExpr: "id",
                    displayExpr: "text",
                    dataSource: [{
                        id: "California",
                        text: "California Text"
                    },
                    {
                        id: "Nevada",
                        text: "Nevada Text"
                    },
                    {
                        id: "Colorado",
                        text: "Colorado Text"
                    }]
                }
            },
            dataSource = [{ field: "2014/1/1" }, { field: "2014/1/3" }, { field: "2014/2/4" }],
            anyOfOperation = this.getAnyOfOperation(field, dataSource);

        // act
        anyOfOperation.customizeText({
            value: ["Nevada", "Colorado"],
            field: field
        }).done(function(data) {
            result = data;
        });

        // assert
        assert.equal(result, "Nevada Text, Colorado Text");
    });

    QUnit.test("data source as a function", function(assert) {
        // arrange
        var operationText = "Weekends",
            result,
            field = {
                dataField: "field",
                headerFilter: {
                    dataSource: function(data) {
                        data.dataSource.postProcess = function(results) {
                            results.push({
                                text: operationText,
                                value: "weekends"
                            });
                            return results;
                        };
                    }
                }
            },
            anyOfOperation = this.getAnyOfOperation(field);

        // act
        anyOfOperation.customizeText({
            value: ["weekends"],
            field: field
        }).done(function(data) {
            result = data;
        });

        // assert
        assert.equal(result, operationText);

        // assert
        assert.equal(result, operationText);
    });

    QUnit.test("data source as a function", function(assert) {
        // arrange
        var result,
            dataSourceOptions = [{
                text: "Less than $3000",
                value: ["SaleAmount", "<", 3000]
            }, {
                text: "$3000 - $5000",
                value: [["SaleAmount", ">=", 3000], ["SaleAmount", "<", 5000]]
            }],
            field = {
                dataField: "field",
                headerFilter: {
                    dataSource: dataSourceOptions
                }
            },
            anyOfOperation = this.getAnyOfOperation(field);

        // act
        anyOfOperation.customizeText({
            value: [dataSourceOptions[0].value, dataSourceOptions[1].value],
            field: field
        }).done(function(data) {
            result = data;
        });

        // assert
        assert.equal(result, dataSourceOptions[0].text + ", " + dataSourceOptions[1].text);
    });

    QUnit.test("groupInterval", function(assert) {
        // arrange
        var result,
            field = {
                dataField: "field",
                dataType: "number",
                headerFilter: {
                    groupInterval: 100
                }
            },
            anyOfOperation = this.getAnyOfOperation(field);

        // act
        result = anyOfOperation.customizeText({
            value: [100, 200],
            field: field
        });

        // assert
        assert.equal(result, "100 - 200, 200 - 300");
    });
});
