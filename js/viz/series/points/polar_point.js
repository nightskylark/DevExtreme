import extendUtils from "../../../core/utils/extend";
var extend = extendUtils.extend;
var _extend = extend;
var symbolPoint = require("./symbol_point");
var barPoint = require("./bar_point");
var piePoint = require("./pie_point");
import typeUtils from "../../../core/utils/type";
var isDefined = typeUtils.isDefined;
var vizUtils = require("../../core/utils");
var normalizeAngle = vizUtils.normalizeAngle;
var _math = Math;
var _max = _math.max;
import constsModule from "../../components/consts";
var RADIAL_LABEL_INDENT = constsModule.radialLabelIndent;
var ERROR_BARS_ANGLE_OFFSET = 90;
var CANVAS_POSITION_END = "canvas_position_end";
var CANVAS_POSITION_DEFAULT = "canvas_position_default";

exports.polarSymbolPoint = _extend({}, symbolPoint, {

    _getLabelCoords: piePoint._getLabelCoords,

    _moveLabelOnCanvas: barPoint._moveLabelOnCanvas,

    _getLabelPosition: function() {
        return "outside";
    },

    _getCoords: function(argument, value) {
        var axis = this.series.getValueAxis();
        var startAngle = axis.getAngles()[0];
        var angle = this._getArgTranslator().translate(argument);
        var radius = this._getValTranslator().translate(value);
        var coords = vizUtils.convertPolarToXY(axis.getCenter(), axis.getAngles()[0], angle, radius);

        coords.angle = angle + startAngle - 90,
        coords.radius = radius;

        return coords;
    },

    _translate: function() {
        var that = this;
        var center = that.series.getValueAxis().getCenter();
        var coord = that._getCoords(that.argument, that.value);

        that.vx = normalizeAngle(coord.angle);
        that.vy = that.radiusOuter = that.radiusLabels = coord.radius;
        that.radiusLabels += RADIAL_LABEL_INDENT;

        that.radius = coord.radius;
        that.middleAngle = -coord.angle;
        that.angle = -coord.angle;

        that.x = coord.x;
        that.y = coord.y;
        that.defaultX = that.centerX = center.x;
        that.defaultY = that.centerY = center.y;

        that._translateErrorBars();

        that.inVisibleArea = true;
    },

    _translateErrorBars: function() {
        var that = this;
        var errorBars = that._options.errorBars;
        var translator = that._getValTranslator();

        if(!errorBars) {
            return;
        }

        isDefined(that.lowError) && (that._lowErrorCoord = that.centerY - translator.translate(that.lowError));
        isDefined(that.highError) && (that._highErrorCoord = that.centerY - translator.translate(that.highError));
        that._errorBarPos = that.centerX;

        that._baseErrorBarPos = errorBars.type === "stdDeviation" ? that._lowErrorCoord + (that._highErrorCoord - that._lowErrorCoord) / 2 : that.centerY - that.radius;
    },

    _getTranslates: function(animationEnabled) {
        return animationEnabled ? this.getDefaultCoords() : { x: this.x, y: this.y };
    },

    getDefaultCoords: function() {
        var cosSin = vizUtils.getCosAndSin(-this.angle);
        var radius = this._getValTranslator().translate(CANVAS_POSITION_DEFAULT);
        var x = this.defaultX + radius * cosSin.cos;
        var y = this.defaultY + radius * cosSin.sin;

        return { x: x, y: y };
    },

    _addLabelAlignmentAndOffset: function(label, coord) {
        return coord;
    },

    _checkLabelPosition: function(label, coord) {
        var that = this;
        var visibleArea = that._getVisibleArea();
        var graphicBBox = that._getGraphicBBox();

        if(that._isPointInVisibleArea(visibleArea, graphicBBox)) {
            coord = that._moveLabelOnCanvas(coord, visibleArea, label.getBoundingRect());
        }

        return coord;
    },

    _getErrorBarSettings: function(errorBarOptions, animationEnabled) {
        var settings = symbolPoint._getErrorBarSettings.call(this, errorBarOptions, animationEnabled);

        settings.rotate = ERROR_BARS_ANGLE_OFFSET - this.angle;
        settings.rotateX = this.centerX;
        settings.rotateY = this.centerY;

        return settings;
    },

    getCoords: function(min) {
        return min ? this.getDefaultCoords() : { x: this.x, y: this.y };
    }
});

exports.polarBarPoint = _extend({}, barPoint, {

    _translateErrorBars: exports.polarSymbolPoint._translateErrorBars,

    _getErrorBarSettings: exports.polarSymbolPoint._getErrorBarSettings,

    _moveLabelOnCanvas: barPoint._moveLabelOnCanvas,

    _getLabelCoords: piePoint._getLabelCoords,

    _getLabelConnector: piePoint._getLabelConnector,

    getTooltipParams: piePoint.getTooltipParams,

    _getLabelPosition: piePoint._getLabelPosition,

    _getCoords: exports.polarSymbolPoint._getCoords,

    _translate: function() {
        var that = this;
        var translator = that._getValTranslator();
        var maxRadius = translator.translate(CANVAS_POSITION_END);

        that.radiusInner = translator.translate(that.minValue);

        exports.polarSymbolPoint._translate.call(that);

        if(that.radiusInner === null) {
            that.radiusInner = that.radius = maxRadius;
        } else if(that.radius === null) {
            this.radius = this.value >= 0 ? maxRadius : 0;
        }

        that.radiusOuter = that.radiusLabels = _max(that.radiusInner, that.radius);
        that.radiusLabels += RADIAL_LABEL_INDENT;
        that.radiusInner = that.defaultRadius = _math.min(that.radiusInner, that.radius);

        that.middleAngle = that.angle = -normalizeAngle(that.middleAngleCorrection - that.angle);
    },

    _getErrorBarBaseEdgeLength() {
        const coord = this.getMarkerCoords();
        return _math.PI * coord.outerRadius * _math.abs(coord.startAngle - coord.endAngle) / 180;
    },

    getMarkerCoords: function() {
        return {
            x: this.centerX,
            y: this.centerY,
            outerRadius: this.radiusOuter,
            innerRadius: this.defaultRadius,
            startAngle: this.middleAngle - this.interval / 2,
            endAngle: this.middleAngle + this.interval / 2
        };
    },

    _drawMarker: function(renderer, group, animationEnabled) {
        var that = this;
        var styles = that._getStyle();
        var coords = that.getMarkerCoords();
        var innerRadius = coords.innerRadius;
        var outerRadius = coords.outerRadius;
        var start = that._getCoords(that.argument, CANVAS_POSITION_DEFAULT);
        var x = coords.x;
        var y = coords.y;

        if(animationEnabled) {
            innerRadius = 0;
            outerRadius = 0;
            x = start.x;
            y = start.y;
        }

        that.graphic = renderer.arc(x, y, innerRadius, outerRadius, coords.startAngle, coords.endAngle).attr(styles).data({ "chart-data-point": that }).append(group);
    },

    _checkLabelPosition: function(label, coord) {
        var that = this;
        var visibleArea = that._getVisibleArea();
        var angleFunctions = vizUtils.getCosAndSin(that.middleAngle);
        var x = that.centerX + that.defaultRadius * angleFunctions.cos;
        var y = that.centerY - that.defaultRadius * angleFunctions.sin;

        if(x > visibleArea.minX && x < visibleArea.maxX && y > visibleArea.minY && y < visibleArea.maxY) {
            coord = that._moveLabelOnCanvas(coord, visibleArea, label.getBoundingRect());
        }
        return coord;
    },

    _addLabelAlignmentAndOffset: function(label, coord) {
        return coord;
    },

    correctCoordinates: function(correctOptions) {
        this.middleAngleCorrection = correctOptions.offset;
        this.interval = correctOptions.width;
    },

    coordsIn: function(x, y) {
        var val = vizUtils.convertXYToPolar(this.series.getValueAxis().getCenter(), x, y);
        var coords = this.getMarkerCoords();

        var isBetweenAngles = coords.startAngle < coords.endAngle ?
            -val.phi >= coords.startAngle && -val.phi <= coords.endAngle :
            -val.phi <= coords.startAngle && -val.phi >= coords.endAngle;

        return (val.r >= coords.innerRadius && val.r <= coords.outerRadius && isBetweenAngles);
    }
});
