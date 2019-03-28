import extendUtils from "../../core/utils/extend";
var _extend = extendUtils.extend;
var windowUtils = require("../../core/utils/window");
import commonUtils from "../../core/utils/common";
var noop = commonUtils.noop;
var isServerSide = !windowUtils.hasWindow();

function Flags() {
    this.reset();
}

Flags.prototype = {
    constructor: Flags,

    add: function(codes) {
        var i;
        var ii = codes.length;
        var flags = this._flags;

        for(i = 0; i < ii; ++i) {
            flags[codes[i]] = 1;
        }
        this._k += ii;
    },

    has: function(code) {
        return this._flags[code] > 0;
    },

    count: function() {
        return this._k;
    },

    reset: function() {
        this._flags = {};
        this._k = 0;
    }
};

function combineMaps(baseMap, thisMap) {
    return baseMap !== thisMap ? _extend({}, baseMap, thisMap) : _extend({}, baseMap);
}

function combineLists(baseList, thisList) {
    return baseList !== thisList ? baseList.concat(thisList) : baseList.slice();
}

function buildTotalChanges(proto) {
    proto._totalChangesOrder = proto._optionChangesOrder.concat(proto._layoutChangesOrder, proto._customChangesOrder);
}

function addChange(settings) {
    var proto = this.prototype;
    var code = settings.code;

    proto["_change_" + code] = settings.handler;
    if(settings.isThemeDependent) {
        proto._themeDependentChanges.push(code);
    }
    if(settings.option) {
        proto._optionChangesMap[settings.option] = code;
    }
    (settings.isOptionChange ? proto._optionChangesOrder : proto._customChangesOrder).push(code);
    buildTotalChanges(proto);
}

function createChainExecutor() {
    var chain = [];

    executeChain.add = function(item) { chain.push(item); };
    return executeChain;

    function executeChain() {
        var i;
        var ii = chain.length;
        var result;
        for(i = 0; i < ii; ++i) {
            result = chain[i].apply(this, arguments);
        }

        return result;
    }
}

function expand(target, name, expander) {
    var current = target[name];
    if(!current) {
        current = expander;
    } else if(current.add) {
        current.add(expander);
    } else {
        current = createChainExecutor();
        current.add(target[name]);
        current.add(expander);
    }
    target[name] = current;
}

function addPlugin(plugin) {
    var proto = this.prototype;
    proto._plugins.push(plugin);
    plugin.fontFields && proto._fontFields.push.apply(proto._fontFields, plugin.fontFields);
    if(plugin.members) {
        _extend(this.prototype, plugin.members);
    }
    if(plugin.customize) {
        plugin.customize(this);
    }

    if(plugin.extenders) {
        Object.keys(plugin.extenders).forEach(function(key) {
            var func = plugin.extenders[key];
            expand(proto, key, func);
        }, this);
    }
}

exports.replaceInherit = isServerSide
    ? function(widget) {
        var _inherit = widget.inherit;
        widget.inherit = function() {
            var result = _inherit.apply(this, arguments);
            var proto = result.prototype;
            [
                "_plugins",
                "_eventsMap",
                "_initialChanges",
                "_themeDependentChanges",
                "_optionChangesMap",
                "_optionChangesOrder",
                "_layoutChangesOrder",
                "_customChangesOrder",
                "_totalChangesOrder"
            ].forEach(function(key) {
                proto[key] = {};
            });

            result.addPlugin = noop;

            return result;
        };
        widget.addChange = noop;
        widget.addPlugin = noop;
    }
    : function(widget) {
        var _inherit = widget.inherit;
        widget.inherit = function() {
            var proto = this.prototype;
            var plugins = proto._plugins;
            var fontFields = proto._fontFields;
            var eventsMap = proto._eventsMap;
            var initialChanges = proto._initialChanges;
            var themeDependentChanges = proto._themeDependentChanges;
            var optionChangesMap = proto._optionChangesMap;
            var optionChangesOrder = proto._optionChangesOrder;
            var layoutChangesOrder = proto._layoutChangesOrder;
            var customChangesOrder = proto._customChangesOrder;
            var result = _inherit.apply(this, arguments);

            proto = result.prototype;
            proto._plugins = combineLists(plugins, proto._plugins);
            proto._fontFields = combineLists(fontFields, proto._fontFields);
            proto._eventsMap = combineMaps(eventsMap, proto._eventsMap);
            proto._initialChanges = combineLists(initialChanges, proto._initialChanges);
            proto._themeDependentChanges = combineLists(themeDependentChanges, proto._themeDependentChanges);
            proto._optionChangesMap = combineMaps(optionChangesMap, proto._optionChangesMap);
            proto._optionChangesOrder = combineLists(optionChangesOrder, proto._optionChangesOrder);
            proto._layoutChangesOrder = combineLists(layoutChangesOrder, proto._layoutChangesOrder);
            proto._customChangesOrder = combineLists(customChangesOrder, proto._customChangesOrder);
            buildTotalChanges(proto);
            result.addPlugin = addPlugin;
            return result;
        };
        widget.prototype._plugins = [];
        widget.prototype._fontFields = [];
        widget.addChange = addChange;
        widget.addPlugin = addPlugin;
    };

exports.changes = function() {
    return new Flags();
};

exports.expand = expand;
