import Callbacks from "./utils/callbacks";
import typeUtils from "./utils/type";
var isFunction = typeUtils.isFunction;
import iteratorUtils from "./utils/iterator";
var each = iteratorUtils.each;
import Class from "./class";

module.exports = Class.inherit({
    ctor: function(owner) {
        this._events = {};
        this._owner = owner;
    },

    hasEvent: function(eventName) {
        var callbacks = this._events[eventName];
        if(callbacks) {
            return callbacks.has();
        }
        return false;
    },

    fireEvent: function(eventName, eventArgs) {
        var callbacks = this._events[eventName];
        if(callbacks) {
            callbacks.fireWith(this._owner, eventArgs);
        }
    },

    on: function(eventName, eventHandler) {
        var callbacks = this._events[eventName];
        var addFn;

        if(!callbacks) {
            callbacks = Callbacks();
            this._events[eventName] = callbacks;
        }
        addFn = callbacks.originalAdd || callbacks.add;
        addFn.call(callbacks, eventHandler);
    },

    off: function(eventName, eventHandler) {
        var callbacks = this._events[eventName];
        if(callbacks) {
            if(isFunction(eventHandler)) {
                callbacks.remove(eventHandler);
            } else {
                callbacks.empty();
            }
        }
    },

    dispose: function() {
        each(this._events, function() {
            this.empty();
        });
    }
});
