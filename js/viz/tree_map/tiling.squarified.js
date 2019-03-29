var _max = Math.max;
import _squarify from "./tiling.squarified.base";

function accumulate(total, current) {
    return _max(total, current);
}

function squarified(data) {
    return _squarify(data, accumulate, false);
}

require("./tiling").addAlgorithm("squarified", squarified);
module.exports = squarified;
