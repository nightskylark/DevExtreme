var proto = require("./funnel").prototype;
var Tracker = require("../components/tracker").Tracker;
var DATA_KEY_BASE = "__funnel_data_";
var isDefined = require("../../core/utils/type").isDefined;
var dataKeyModifier = 0;

proto._eventsMap.onItemClick = { name: "itemClick" };
proto._eventsMap.onLegendClick = { name: "legendClick" };

exports.plugin = {
    name: "tracker",
    init: function() {
        var that = this;
        var dataKey = DATA_KEY_BASE + dataKeyModifier++;

        var getProxyData = function(e) {
            var rootOffset = that._renderer.getRootOffset(),
                x = Math.floor(e.pageX - rootOffset.left),
                y = Math.floor(e.pageY - rootOffset.top);

            return that._hitTestTargets(x, y);
        };

        that._tracker = new Tracker({
            widget: that,
            root: that._renderer.root,
            getData: function(e, tooltipData) {
                var target = e.target;
                var data = target[dataKey];
                var proxyData;
                if(isDefined(data)) {
                    return data;
                }
                proxyData = getProxyData(e);

                if(tooltipData && proxyData && proxyData.type !== "inside-label") {
                    return;
                }

                return proxyData && proxyData.id;
            },
            getNode: function(index) {
                return that._items[index];
            },
            click: function(e) {
                var proxyData = getProxyData(e.event);
                var dataType = proxyData && proxyData.type;
                var event = dataType === "legend" ? "legendClick" : "itemClick";

                that._eventTrigger(event, {
                    item: e.node,
                    event: e.event
                });
            }
        });

        ///#DEBUG
        exports._TESTS_dataKey = dataKey;
        ///#ENDDEBUG

        this._dataKey = dataKey;
    },
    dispose: function() {
        this._tracker.dispose();
    },
    extenders: {
        _change_TILING: function() {
            var dataKey = this._dataKey;
            this._items.forEach(function(item, index) {
                item.element.data(dataKey, index);
            });
        }
    }
};

