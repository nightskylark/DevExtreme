var proto = require("./tree_map.base").prototype;
import nodeModule from "./node";
var nodeProto = nodeModule.prototype;
import helpersModule from "../core/helpers";
var expand = helpersModule.expand;
var common = require("./common");
var _buildRectAppearance = common.buildRectAppearance;
import utilsModule from "../core/utils";
var _normalizeEnum = utilsModule.normalizeEnum;
import arrayUtils from "../../core/utils/array";
var _inArray = arrayUtils.inArray;
var MODE_NONE = 0;
var MODE_SINGLE = 1;
var MODE_MULTIPLE = 2;
var STATE_CODE = 2;

require("./api");
require("./states");

proto._eventsMap.onSelectionChanged = { name: "selectionChanged" };

expand(proto._handlers, "calculateAdditionalStates", function(states, options) {
    states[2] = options.selectionStyle ? _buildRectAppearance(options.selectionStyle) : {};
});

nodeProto.statesMap[2] = nodeProto.statesMap[3] = STATE_CODE;
nodeProto.additionalStates.push(2);

expand(proto, "_onNodesCreated", function() {
    this._selectionList.length = 0;
});

expand(proto, "_extendProxyType", function(proto) {
    var that = this;

    proto.select = function(state) {
        that._selectNode(this._id, !!state);
    };
    proto.isSelected = function() {
        return _inArray(this._id, that._selectionList) >= 0;
    };
    that._selectionList = [];
});

require("./tree_map.base").addChange({
    code: "SELECTION_MODE",
    handler: function() {
        var that = this;
        var option = _normalizeEnum(that._getOption("selectionMode", true));
        var mode;
        var selectionList = that._selectionList;
        var tmp;

        mode = option === "none" ? MODE_NONE : (option === "multiple" ? MODE_MULTIPLE : MODE_SINGLE);
        if(mode === MODE_SINGLE && selectionList.length > 1) {
            tmp = selectionList.pop();
            that.clearSelection();
            selectionList.push(tmp);
        } else if(mode === MODE_NONE) {
            that.clearSelection();
        }
        that._selectionMode = mode;
    },
    isThemeDependent: true,
    isOptionChange: true,
    option: "selectionMode"
});

expand(proto, "_applyTilesAppearance", function() {
    if(this._selectionList.length) {
        bringSelectedTilesToForeground(this._nodes, this._selectionList);
    }
});

function bringSelectedTilesToForeground(nodes, selectionList) {
    var i;
    var ii = selectionList.length;
    var node;

    for(i = 0; i < ii; ++i) {
        node = nodes[selectionList[i]];
        tileToFront[Number(node.isNode())](node.tile);
    }
}

var tileToFront = [leafToFront, groupToFront];

function leafToFront(content) {
    content.toForeground();
}

function groupToFront(content) {
    content.outer.toForeground();
    content.inner.toForeground();
}

proto._applySelectionState = function(index, state) {
    var node = this._nodes[index];

    node.setState(STATE_CODE, state);
    this._eventTrigger("selectionChanged", { node: node.proxy });
};

proto._selectNode = function(index, state) {
    var that = this;
    var selectionList;
    var k;
    var tmp;

    if(that._selectionMode !== MODE_NONE) {
        that._context.suspend();
        selectionList = that._selectionList;
        k = _inArray(index, selectionList);
        if(state && k === -1) {
            if(that._selectionMode === MODE_SINGLE) {
                if(selectionList.length) {
                    tmp = selectionList.pop();
                    that._applySelectionState(tmp, false);
                }
            }
            selectionList.push(index);
            that._applySelectionState(index, true);
        } else if(!state && k >= 0) {
            selectionList.splice(k, 1);
            that._applySelectionState(index, false);
        }
        that._context.resume();
    }
};

proto.clearSelection = function() {
    var that = this;
    var selectionList = that._selectionList;
    var i;
    var ii = selectionList.length;

    if(that._selectionMode !== MODE_NONE) {
        that._context.suspend();
        for(i = 0; i < ii; ++i) {
            that._applySelectionState(selectionList[i], false);
        }
        selectionList.length = 0;
        that._context.resume();
    }
};
