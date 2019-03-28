import utilsModule from "../core/utils";
var _normalizeEnum = utilsModule.normalizeEnum;
var algorithms = {};
var defaultAlgorithm;

exports.getAlgorithm = function(name) {
    return algorithms[_normalizeEnum(name)] || defaultAlgorithm;
};

exports.addAlgorithm = function(name, callback, setDefault) {
    algorithms[name] = callback;

    if(setDefault) {
        defaultAlgorithm = algorithms[name];
    }
};
