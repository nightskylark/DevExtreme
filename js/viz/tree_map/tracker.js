import baseModule from "./tree_map.base";
var proto = baseModule.prototype;
import trackerModule from "../components/tracker";
var Tracker = trackerModule.Tracker;
import helpersModule from "../core/helpers";
var expand = helpersModule.expand;
import utilsModule from "../core/utils";
var _parseScalar = utilsModule.parseScalar;
var DATA_KEY_BASE = "__treemap_data_";
var dataKeyModifier = 0;

import "./api";
import "./hover";
import "./tooltip";

proto._eventsMap.onClick = { name: "click" };

expand(proto, "_initCore", function() {
    var that = this;
    var dataKey = DATA_KEY_BASE + dataKeyModifier++;

    var getProxy = function(index) {
        return that._nodes[index].proxy;
    };

    that._tracker = new Tracker({
        widget: that,
        root: that._renderer.root,
        getNode: function(id) {
            var proxy = getProxy(id);
            var interactWithGroup = _parseScalar(that._getOption("interactWithGroup", true));

            return interactWithGroup && proxy.isLeaf() && proxy.getParent().isActive() ? proxy.getParent() : proxy;
        },
        getData: function(e) {
            var target = e.target;
            return (target.tagName === "tspan" ? target.parentNode : target)[dataKey];
        },
        getProxy: getProxy,
        click: function(e) {
            that._eventTrigger("click", e);
        }
    });
    that._handlers.setTrackerData = function(node, element) {
        element.data(dataKey, node._id);
    };

    ///#DEBUG
    exports._TESTS_dataKey = dataKey;
    ///#ENDDEBUG
});

expand(proto, "_disposeCore", function() {
    this._tracker.dispose();
});
