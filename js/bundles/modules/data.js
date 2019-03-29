var DevExpress = require("./core");

module.exports = DevExpress.data = DevExpress.data || {};

Object.defineProperty(DevExpress.data, 'errorHandler', {
    get: function() {
        return require("../../data/errors").errorHandler;
    },
    set: function(value) {
        require("../../data/errors").errorHandler = value;
    }
});

// TODO: try remove (plugins failed without this)
Object.defineProperty(DevExpress.data, '_errorHandler', {
    get: function() {
        return require("../../data/errors")._errorHandler;
    },
    set: function(value) {
        require("../../data/errors")._errorHandler = value;
    }
});

DevExpress.data.DataSource = require("../../data/data_source");
DevExpress.data.query = require("../../data/query");
DevExpress.data.Store = require("../../data/abstract_store");
DevExpress.data.ArrayStore = require("../../data/array_store");
DevExpress.data.CustomStore = require("../../data/custom_store");
DevExpress.data.LocalStore = require("../../data/local_store");
import dataUtils from "../../data/utils";
DevExpress.data.base64_encode = dataUtils.base64_encode;

DevExpress.data.Guid = require("../../core/guid");

DevExpress.data.utils = {};
import { compileGetter, compileSetter, toComparable } from "../../core/utils/data";
DevExpress.data.utils.compileGetter = compileGetter;
DevExpress.data.utils.compileSetter = compileSetter;

DevExpress.EndpointSelector = require("../../data/endpoint_selector");

import { queryImpl } from "../../data/query";
DevExpress.data.queryImpl = queryImpl;
DevExpress.data.queryAdapters = require("../../data/query_adapters");

DevExpress.data.utils.normalizeBinaryCriterion = dataUtils.normalizeBinaryCriterion;
DevExpress.data.utils.normalizeSortingInfo = dataUtils.normalizeSortingInfo;
DevExpress.data.utils.errorMessageFromXhr = dataUtils.errorMessageFromXhr;
DevExpress.data.utils.aggregators = dataUtils.aggregators;
DevExpress.data.utils.keysEqual = dataUtils.keysEqual;
DevExpress.data.utils.isDisjunctiveOperator = dataUtils.isDisjunctiveOperator;
DevExpress.data.utils.isConjunctiveOperator = dataUtils.isConjunctiveOperator;
DevExpress.data.utils.processRequestResultLock = dataUtils.processRequestResultLock;

DevExpress.data.utils.toComparable = toComparable;

import storeHelper from "../../data/store_helper";
DevExpress.data.utils.multiLevelGroup = storeHelper.multiLevelGroup;
DevExpress.data.utils.arrangeSortingInfo = storeHelper.arrangeSortingInfo;

import { normalizeDataSourceOptions } from "../../data/data_source/data_source";
DevExpress.data.utils.normalizeDataSourceOptions = normalizeDataSourceOptions;
