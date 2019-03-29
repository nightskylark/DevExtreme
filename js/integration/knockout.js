import ko from "knockout";
import errors from "../core/errors";
import { compare } from "../core/utils/version";

// Check availability in global environment
if(ko) {
    if(compare(ko.version, [2, 3]) < 0) {
        throw errors.Error("E0013");
    }

    require("./knockout/component_registrator");
    require("./knockout/event_registrator");
    require("./knockout/components");
    require("./knockout/validation");
    require("./knockout/variable_wrapper_utils");
    require("./knockout/clean_node");
    require("./knockout/clean_node_old");
}
