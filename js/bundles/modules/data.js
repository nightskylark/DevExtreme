import DevExpress from "./core";
import errors from "../../data/errors";

module.exports = DevExpress.data = DevExpress.data || {};

Object.defineProperty(DevExpress.data, 'errorHandler', {
    get: function() {
        return errors.errorHandler;
    },
    set: function(value) {
        errors.errorHandler = value;
    }
});

// TODO: try remove (plugins failed without this)
Object.defineProperty(DevExpress.data, '_errorHandler', {
    get: function() {
        return errors._errorHandler;
    },
    set: function(value) {
        errors._errorHandler = value;
    }
});

import DataSourceModule from "../../data/data_source";
DevExpress.data.DataSource = DataSourceModule;
import queryModule from "../../data/query";
DevExpress.data.query = queryModule;
import StoreModule from "../../data/abstract_store";
DevExpress.data.Store = StoreModule;
import ArrayStoreModule from "../../data/array_store";
DevExpress.data.ArrayStore = ArrayStoreModule;
import CustomStoreModule from "../../data/custom_store";
DevExpress.data.CustomStore = CustomStoreModule;
import LocalStoreModule from "../../data/local_store";
DevExpress.data.LocalStore = LocalStoreModule;
import dataUtils from "../../data/utils";
DevExpress.data.base64_encode = dataUtils.base64_encode;

import GuidModule from "../../core/guid";
DevExpress.data.Guid = GuidModule;

DevExpress.data.utils = {};
import { compileGetter, compileSetter, toComparable } from "../../core/utils/data";
DevExpress.data.utils.compileGetter = compileGetter;
DevExpress.data.utils.compileSetter = compileSetter;

import EndpointSelectorModule from "../../data/endpoint_selector";
DevExpress.EndpointSelector = EndpointSelectorModule;

import { queryImpl } from "../../data/query";
DevExpress.data.queryImpl = queryImpl;
import queryAdaptersModule from "../../data/query_adapters";
DevExpress.data.queryAdapters = queryAdaptersModule;

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
