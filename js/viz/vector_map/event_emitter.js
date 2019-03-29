import Callbacks from "../../core/utils/callbacks";

var eventEmitterMethods = {
    _initEvents: function() {
        var names = this._eventNames;
        var i;
        var ii = names.length;
        var events = this._events = {};
        for(i = 0; i < ii; ++i) {
            events[names[i]] = Callbacks();
        }
    },

    _disposeEvents: function() {
        var events = this._events;
        var name;
        for(name in events) {
            events[name].empty();
        }
        this._events = null;
    },

    on: function(handlers) {
        var events = this._events;
        var name;
        for(name in handlers) {
            events[name].add(handlers[name]);
        }
        return dispose;
        function dispose() {
            for(name in handlers) {
                events[name].remove(handlers[name]);
            }
        }
    },

    _fire: function(name, arg) {
        this._events[name].fire(arg);
    }
};

exports.makeEventEmitter = function(target) {
    var proto = target.prototype;
    var name;
    for(name in eventEmitterMethods) {
        proto[name] = eventEmitterMethods[name];
    }
};

///#DEBUG
exports._TESTS_eventEmitterMethods = eventEmitterMethods;
///#ENDDEBUG
