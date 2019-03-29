import tiling from "./tiling";
var sliceAndDiceAlgorithm = tiling.getAlgorithm("sliceanddice");

function rotatedSliceAndDice(data) {
    data.isRotated = !data.isRotated;
    return sliceAndDiceAlgorithm.call(this, data);
}

tiling.addAlgorithm("rotatedsliceanddice", rotatedSliceAndDice);
