import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;

exports.registry = {};

exports.register = function(option, type, decoratorClass) {
    var decoratorsRegistry = exports.registry;

    var decoratorConfig = {};
    decoratorConfig[option] = decoratorsRegistry[option] ? decoratorsRegistry[option] : {};
    decoratorConfig[option][type] = decoratorClass;

    decoratorsRegistry = extend(decoratorsRegistry, decoratorConfig);
};
