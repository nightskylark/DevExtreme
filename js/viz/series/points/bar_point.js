import extendUtils from "../../../core/utils/extend";
var extend = extendUtils.extend;
var _extend = extend;
var _math = Math;
var _floor = _math.floor;
var _abs = _math.abs;
import symbolPoint from "./symbol_point";
var CANVAS_POSITION_DEFAULT = "canvas_position_default";
var DEFAULT_BAR_TRACKER_SIZE = 9;
var CORRECTING_BAR_TRACKER_VALUE = 4;
var RIGHT = "right";
var LEFT = "left";
var TOP = "top";
var BOTTOM = "bottom";

module.exports = _extend({}, symbolPoint, {

    correctCoordinates(correctOptions) {
        const that = this;
        const correction = _floor(correctOptions.offset - (correctOptions.width / 2));

        if(that._options.rotated) {
            that.height = correctOptions.width;
            that.yCorrection = correction;
            that.xCorrection = null;
        } else {
            that.width = correctOptions.width;
            that.xCorrection = correction;
            that.yCorrection = null;
        }
    },

    _getGraphicBBox: function() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    },

    _getLabelConnector: function(location) {
        return this._getGraphicBBox(location);
    },

    _getLabelPosition: function() {
        var that = this;
        var position;
        var initialValue = that.initialValue;
        var invert = that._getValTranslator().getBusinessRange().invert;
        var isDiscreteValue = that.series.valueAxisType === "discrete";
        var isFullStacked = that.series.isFullStackedSeries();

        var notAxisInverted = (!isDiscreteValue && ((initialValue >= 0 && !invert) ||
            (initialValue < 0 && invert))) ||
            (isDiscreteValue && !invert) ||
            (isFullStacked);

        if(!that._options.rotated) {
            position = notAxisInverted ? TOP : BOTTOM;
        } else {
            position = notAxisInverted ? RIGHT : LEFT;
        }

        return position;
    },

    _getLabelCoords: function(label) {
        var that = this;
        var coords;

        if(that.initialValue === 0 && that.series.isFullStackedSeries()) {
            if(!this._options.rotated) {
                coords = that._getLabelCoordOfPosition(label, TOP);
            } else {
                coords = that._getLabelCoordOfPosition(label, RIGHT);
            }
        } else if(label.getLayoutOptions().position === "inside") {
            coords = that._getLabelCoordOfPosition(label, "inside");
        } else {
            coords = symbolPoint._getLabelCoords.call(this, label);
        }
        return coords;
    },

    _checkLabelPosition: function(label, coord) {
        var that = this;
        var visibleArea = that._getVisibleArea();

        if(that._isPointInVisibleArea(visibleArea, that._getGraphicBBox())) {
            return that._moveLabelOnCanvas(coord, visibleArea, label.getBoundingRect());
        }

        return coord;
    },

    hideInsideLabel: function(label, coord) {
        var graphicBBox = this._getGraphicBBox();
        var labelBBox = label.getBoundingRect();

        if(this._options.resolveLabelsOverlapping) {
            if(((coord.y <= graphicBBox.y && coord.y + labelBBox.height >= graphicBBox.y + graphicBBox.height) ||
                (coord.x <= graphicBBox.x && coord.x + labelBBox.width >= graphicBBox.x + graphicBBox.width)) &&
                !(coord.y > graphicBBox.y + graphicBBox.height || coord.y + labelBBox.height < graphicBBox.y ||
                coord.x > graphicBBox.x + graphicBBox.width || coord.x + labelBBox.width < graphicBBox.x)) {
                label.draw(false);
                return true;
            }
        }

        return false;
    },

    _moveLabelOnCanvas: function(coord, visibleArea, labelBBox) {
        var x = coord.x;
        var y = coord.y;
        if(visibleArea.minX > x) {
            x = visibleArea.minX;
        }
        if(visibleArea.maxX < (x + labelBBox.width)) {
            x = visibleArea.maxX - labelBBox.width;
        }
        if(visibleArea.minY > y) {
            y = visibleArea.minY;
        }
        if(visibleArea.maxY < (y + labelBBox.height)) {
            y = visibleArea.maxY - labelBBox.height;
        }

        return { x: x, y: y };
    },

    _showForZeroValues: function() {
        return this._options.label.showForZeroValues || this.initialValue;
    },

    _drawMarker: function(renderer, group, animationEnabled) {
        var that = this;
        var style = that._getStyle();
        var x = that.x;
        var y = that.y;
        var width = that.width;
        var height = that.height;
        var r = that._options.cornerRadius;
        if(animationEnabled) {
            if(that._options.rotated) {
                width = 0;
                x = that.defaultX;
            } else {
                height = 0;
                y = that.defaultY;
            }
        }

        that.graphic = renderer.rect(x, y, width, height)
            .attr({ rx: r, ry: r })
            .smartAttr(style)
            .data({ "chart-data-point": that })
            .append(group);
    },

    _getSettingsForTracker: function() {
        var that = this;
        var y = that.y;
        var height = that.height;
        var x = that.x;
        var width = that.width;

        if(that._options.rotated) {
            if(width === 1) {
                width = DEFAULT_BAR_TRACKER_SIZE;
                x -= CORRECTING_BAR_TRACKER_VALUE;
            }
        } else {
            if(height === 1) {
                height = DEFAULT_BAR_TRACKER_SIZE;
                y -= CORRECTING_BAR_TRACKER_VALUE;
            }
        }

        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    },

    getGraphicSettings: function() {
        var graphic = this.graphic;
        return {
            x: graphic.attr("x"),
            y: graphic.attr("y"),
            height: graphic.attr("height"),
            width: graphic.attr("width")
        };
    },

    _getEdgeTooltipParams: function(x, y, width, height) {
        var isPositive = this.value >= 0;
        var xCoord;
        var yCoord;
        var invertedBusinessRange = this._getValTranslator().getBusinessRange().invert;

        if(this._options.rotated) {
            yCoord = y + height / 2;
            if(invertedBusinessRange) {
                xCoord = isPositive ? x : x + width;
            } else {
                xCoord = isPositive ? x + width : x;
            }
        } else {
            xCoord = x + width / 2;
            if(invertedBusinessRange) {
                yCoord = isPositive ? y + height : y;
            } else {
                yCoord = isPositive ? y : y + height;
            }
        }

        return { x: xCoord, y: yCoord, offset: 0 };
    },

    getTooltipParams: function(location) {
        var x = this.x;
        var y = this.y;
        var width = this.width;
        var height = this.height;

        return location === 'edge' ? this._getEdgeTooltipParams(x, y, width, height) : { x: x + width / 2, y: y + height / 2, offset: 0 };
    },

    _truncateCoord: function(coord, minBounce, maxBounce) {
        if(coord === null) {
            return coord;
        }
        if(coord < minBounce) {
            return minBounce;
        }
        if(coord > maxBounce) {
            return maxBounce;
        }
        return coord;
    },

    _getErrorBarBaseEdgeLength() {
        return this._options.rotated ? this.height : this.width;
    },

    _translateErrorBars: function(argVisibleArea) {
        symbolPoint._translateErrorBars.call(this);
        if(this._errorBarPos < argVisibleArea[0] || this._errorBarPos > argVisibleArea[1]) {
            this._errorBarPos = undefined;
        }
    },

    // TODO check & rework
    _translate: function() {
        var that = this;
        var rotated = that._options.rotated;
        var valAxis = rotated ? "x" : "y";
        var argAxis = rotated ? "y" : "x";
        var valIntervalName = rotated ? "width" : "height";
        var argIntervalName = rotated ? "height" : "width";
        var argTranslator = that._getArgTranslator();
        var valTranslator = that._getValTranslator();
        var argVisibleArea = that.series.getArgumentAxis().getVisibleArea();
        var valVisibleArea = that.series.getValueAxis().getVisibleArea();
        var arg;
        var val;
        var minVal;

        arg = argTranslator.translate(that.argument);

        that[argAxis] = arg = arg === null ? arg : arg + (that[argAxis + "Correction"] || 0);

        val = valTranslator.translate(that.value, 1);
        minVal = valTranslator.translate(that.minValue);

        that["v" + valAxis] = val;
        that["v" + argAxis] = arg + that[argIntervalName] / 2;

        val = that._truncateCoord(val, valVisibleArea[0], valVisibleArea[1]);
        minVal = that._truncateCoord(minVal, valVisibleArea[0], valVisibleArea[1]);

        that[valIntervalName] = _abs(val - minVal);

        val = val < minVal ? val : minVal;

        that._calculateVisibility(rotated ? val : arg, rotated ? arg : val, that.width, that.height);

        that[valAxis] = val === null ? val : val + (that[valAxis + "Correction"] || 0);
        that["min" + valAxis.toUpperCase()] = minVal === null ? minVal : minVal + (that[valAxis + "Correction"] || 0);
        that["default" + valAxis.toUpperCase()] = valTranslator.translate(CANVAS_POSITION_DEFAULT);
        that._translateErrorBars(argVisibleArea);

        if(that.inVisibleArea && that[argAxis] !== null) {
            if(that[argAxis] < argVisibleArea[0]) {
                that[argIntervalName] = that[argIntervalName] - (argVisibleArea[0] - that[argAxis]);
                that[argAxis] = argVisibleArea[0];
            }

            if(that[argAxis] + that[argIntervalName] > argVisibleArea[1]) {
                that[argIntervalName] = argVisibleArea[1] - that[argAxis];
            }
        }
    },

    _updateMarker: function(animationEnabled, style) {
        this.graphic.smartAttr(_extend({}, style, !animationEnabled ? this.getMarkerCoords() : {}));
    },

    getMarkerCoords: function() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    },

    coordsIn: function(x, y) {
        var that = this;
        return (x >= that.x) && (x <= that.x + that.width) && (y >= that.y) && (y <= that.y + that.height);
    }
});
