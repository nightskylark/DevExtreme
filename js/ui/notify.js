var $ = require("../core/renderer");
var Action = require("../core/action");
var viewPortUtils = require("../core/utils/view_port");
import extendUtils from "../core/utils/extend";
var extend = extendUtils.extend;
import typeUtils from "../core/utils/type";
var isPlainObject = typeUtils.isPlainObject;
var Toast = require("./toast");


var $notify = null;

var notify = function(message, /* optional */ type, displayTime) {
    var options = isPlainObject(message) ? message : { message: message };

    var userHiddenAction = options.onHidden;

    extend(options, {
        type: type,
        displayTime: displayTime,
        onHidden: function(args) {
            $(args.element).remove();

            new Action(userHiddenAction, {
                context: args.model
            }).execute(arguments);
        }
    });

    $notify = $("<div>").appendTo(viewPortUtils.value());
    new Toast($notify, options).show();
};

/**
 * @name ui.notify
 * @static
 * @publicName notify(message,type,displayTime)
 * @param1 message:string
 * @param2 type:string|undefined
 * @param3 displayTime:integer|undefined
 * @module ui/notify
 * @export default
 */
/**
 * @name ui.notify
 * @static
 * @publicName notify(options,type,displayTime)
 * @param1 options:object
 * @param2 type:string|undefined
 * @param3 displayTime:integer|undefined
 * @module ui/notify
 * @export default
 */
module.exports = notify;
