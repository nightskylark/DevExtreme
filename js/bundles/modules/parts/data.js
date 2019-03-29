import DevExpress from "./core";

/// BUNDLER_PARTS
/* Data (dx.module-core.js) */

var data = DevExpress.data = require("../../../bundles/modules/data");

import odataModule from "../../../bundles/modules/data.odata";
data.odata = odataModule;
/// BUNDLER_PARTS_END

module.exports = data;
