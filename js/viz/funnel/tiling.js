var _normalizeEnum = require("../core/utils").normalizeEnum;
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
