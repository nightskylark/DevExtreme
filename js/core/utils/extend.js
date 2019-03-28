import typeModule from "./type";
var isPlainObject = typeModule.isPlainObject;

var extendFromObject = function(target, source, overrideExistingValues) {
    target = target || {};
    for(var prop in source) {
        if(source.hasOwnProperty(prop)) {
            var value = source[prop];
            if(!(prop in target) || overrideExistingValues) {
                target[prop] = value;
            }
        }
    }
    return target;
};

var extend = function(target) {
    target = target || {};

    var i = 1;
    var deep = false;

    if(typeof target === "boolean") {
        deep = target;
        target = arguments[1] || {};
        i++;
    }

    for(; i < arguments.length; i++) {
        var source = arguments[i];
        if(source == null) {
            continue;
        }

        for(var key in source) {
            var targetValue = target[key];
            var sourceValue = source[key];
            var sourceValueIsArray = false;
            var clone;

            if(target === sourceValue) {
                continue;
            }

            if(deep && sourceValue && (isPlainObject(sourceValue) ||
                (sourceValueIsArray = Array.isArray(sourceValue)))) {

                if(sourceValueIsArray) {
                    clone = targetValue && Array.isArray(targetValue) ? targetValue : [];
                } else {
                    clone = targetValue && isPlainObject(targetValue) ? targetValue : {};
                }

                target[key] = extend(deep, clone, sourceValue);

            } else if(sourceValue !== undefined) {
                target[key] = sourceValue;
            }
        }
    }

    return target;
};

exports.extend = extend;
exports.extendFromObject = extendFromObject;
