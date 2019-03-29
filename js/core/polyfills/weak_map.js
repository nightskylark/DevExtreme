/* global WeakMap */
import arrayUtils from "../../core/utils/array";
var inArray = arrayUtils.inArray;

import windowUtils from "../../core/utils/window";
var weakMap = windowUtils.hasWindow() ? windowUtils.getWindow().WeakMap : WeakMap;

if(!weakMap) {
    // NOTE: This is an incomplete WeakMap polyfill but it is enough for creation purposes

    weakMap = function() {
        var keys = [];
        var values = [];

        this.set = function(key, value) {
            var index = inArray(key, keys);
            if(index === -1) {
                keys.push(key);
                values.push(value);
            } else {
                values[index] = value;
            }
        };

        this.get = function(key) {
            var index = inArray(key, keys);
            if(index === -1) {
                return undefined;
            }
            return values[index];
        };

        this.has = function(key) {
            var index = inArray(key, keys);
            if(index === -1) {
                return false;
            }
            return true;
        };

        this.delete = function(key) {
            var index = inArray(key, keys);
            if(index === -1) {
                return;
            }
            keys.splice(index, 1);
            values.splice(index, 1);
        };
    };
}

module.exports = weakMap;
