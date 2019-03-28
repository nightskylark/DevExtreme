var proto = require("./tree_map.base").prototype;
import nodeModule from "./node";
var nodeProto = nodeModule.prototype;
var handlers = proto._handlers;
var _calculateState = handlers.calculateState;
var _buildState = nodeProto._buildState;
import extendUtils from "../../core/utils/extend";
var _extend = extendUtils.extend;

handlers.calculateState = function(options) {
    var states = { 0: _calculateState(options) };

    handlers.calculateAdditionalStates(states, options);
    return states;
};

handlers.calculateAdditionalStates = require("../../core/utils/common").noop;

nodeProto.code = 0;

nodeProto.statesMap = { 0: 0 };

nodeProto.additionalStates = [];

nodeProto._buildState = function(state, extra) {
    var states = { 0: _buildState(state[0], extra) };

    if(this.additionalStates.length) {
        buildAdditionalStates(states, states[0], state, this.additionalStates);
    }
    return states;
};

nodeProto._getState = function() {
    return this.state[this.statesMap[this.code]];
};

nodeProto.setState = function(code, state) {
    if(state) {
        this.code |= code;
    } else {
        this.code &= ~code;
    }
    this.ctx.change(["TILES"]);
};

function buildAdditionalStates(states, base, source, list) {
    var i;
    var ii = list.length;

    for(i = 0; i < ii; ++i) {
        states[list[i]] = _extend({}, base, source[list[i]]);
    }
}
