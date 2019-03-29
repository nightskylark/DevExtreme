/* global DevExpress */

import "./data";

DevExpress.data.ODataStore = require("../../data/odata/store");
DevExpress.data.ODataContext = require("../../data/odata/context");

DevExpress.data.utils = DevExpress.data.utils || {};
DevExpress.data.utils.odata = {};

import { keyConverters, EdmLiteral } from "../../data/odata/utils";
DevExpress.data.utils.odata.keyConverters = keyConverters;
DevExpress.data.EdmLiteral = EdmLiteral;

import ODataUtilsModule from "../../data/odata/utils";
DevExpress.data.utils.odata.serializePropName = ODataUtilsModule.serializePropName;
DevExpress.data.utils.odata.serializeValue = ODataUtilsModule.serializeValue;
DevExpress.data.utils.odata.serializeKey = ODataUtilsModule.serializeKey;
DevExpress.data.utils.odata.sendRequest = ODataUtilsModule.sendRequest;

///#DEBUG
DevExpress.data.OData__internals = ODataUtilsModule.OData__internals;
///#ENDDEBUG

DevExpress.data.queryAdapters = DevExpress.data.queryAdapters || {};
import { odata } from "../../data/odata/query_adapter";
DevExpress.data.queryAdapters.odata = odata;
