import tiling from "./tiling";

function sliceAndDice(data) {
    var items = data.items;
    var sidesData = tiling.buildSidesData(data.rect, data.directions, data.isRotated ? 1 : 0);

    tiling.calculateRectangles(items, 0, data.rect, sidesData, {
        sum: data.sum,
        count: items.length,
        side: sidesData.variedSide
    });
}

tiling.addAlgorithm("sliceanddice", sliceAndDice);
module.exports = sliceAndDice;
