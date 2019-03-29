import jQuery from "jquery";
import versionUtils from "../core/utils/version";
var compareVersions = versionUtils.compare;
import errors from "../core/utils/error";
var useJQuery = require("./jquery/use_jquery")();

if(useJQuery && compareVersions(jQuery.fn.jquery, [1, 10]) < 0) {
    throw errors.Error("E0012");
}

import "./jquery/renderer";
import "./jquery/hooks";
import "./jquery/deferred";
import "./jquery/hold_ready";
import "./jquery/events";
import "./jquery/easing";
import "./jquery/element_data";
import "./jquery/element";
import "./jquery/component_registrator";
import "./jquery/ajax";
