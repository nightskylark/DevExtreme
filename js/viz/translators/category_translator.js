var isDefined = require("../../core/utils/type").isDefined;
var adjust = require("../../core/utils/math").adjust;
var round = Math.round;

function getValue(value) { return value; }

module.exports = {
    translate: function(category, directionOffset) {
        var that = this;
        var canvasOptions = that._canvasOptions;
        var categoryIndex = that._categoriesToPoints[category.valueOf()];
        var stickDelta;
        var specialValue = that.translateSpecialCase(category);
        var startPointIndex = canvasOptions.startPointIndex || 0;
        var stickInterval = that._options.stick ? 0 : 0.5;

        if(isDefined(specialValue)) {
            return round(specialValue);
        }

        // Q522516
        if(!categoryIndex && categoryIndex !== 0) {
            return null;
        }
        directionOffset = directionOffset || 0;

        stickDelta = categoryIndex + stickInterval - startPointIndex + directionOffset * 0.5;
        return round(that._calculateProjection(canvasOptions.interval * stickDelta));
    },

    getInterval: function() {
        return this._canvasOptions.interval;
    },

    getEventScale: function(zoomEvent) {
        const scale = zoomEvent.deltaScale || 1;
        return 1 - (1 - scale) / (0.75 + this.visibleCategories.length / this._categories.length);
    },

    zoom: function(translate, scale) {
        var that = this;
        var categories = that._categories;
        var canvasOptions = that._canvasOptions;
        var stick = that._options.stick;
        var invert = canvasOptions.invert;
        var interval = canvasOptions.interval * scale;
        var translateCategories = translate / interval;
        var visibleCount = (that.visibleCategories || []).length;
        var startCategoryIndex = parseInt((canvasOptions.startPointIndex || 0) + translateCategories + 0.5);
        var categoriesLength = parseInt(adjust(canvasOptions.canvasLength / interval) + (stick ? 1 : 0)) || 1;
        var endCategoryIndex;
        var newVisibleCategories;
        var newInterval;

        if(invert) {
            startCategoryIndex = parseInt((canvasOptions.startPointIndex || 0) + visibleCount - translateCategories + 0.5) - categoriesLength;
        }

        if(startCategoryIndex < 0) {
            startCategoryIndex = 0;
        }

        endCategoryIndex = startCategoryIndex + categoriesLength;

        if(endCategoryIndex > categories.length) {
            endCategoryIndex = categories.length;
            startCategoryIndex = endCategoryIndex - categoriesLength;
            if(startCategoryIndex < 0) {
                startCategoryIndex = 0;
            }
        }

        newVisibleCategories = categories.slice(parseInt(startCategoryIndex), parseInt(endCategoryIndex));

        newInterval = that._getDiscreteInterval(newVisibleCategories.length, canvasOptions);

        scale = newInterval / canvasOptions.interval;
        translate = (that.translate(!invert ? newVisibleCategories[0] : newVisibleCategories[newVisibleCategories.length - 1]) * scale - (canvasOptions.startPoint + (stick ? 0 : newInterval / 2)));

        return {
            min: newVisibleCategories[0],
            max: newVisibleCategories[newVisibleCategories.length - 1],
            translate: translate,
            scale: scale
        };
    },

    getMinScale: function(zoom) {
        var that = this;
        var canvasOptions = that._canvasOptions;
        var categoriesLength = (that.visibleCategories || that._categories).length;
        categoriesLength += (parseInt(categoriesLength * 0.1) || 1) * (zoom ? -2 : 2);

        return canvasOptions.canvasLength / ((Math.max(categoriesLength, 1) * canvasOptions.interval));
    },

    getScale: function(min, max) {
        var that = this;
        var canvasOptions = that._canvasOptions;
        var visibleArea = that.getCanvasVisibleArea();
        var stickOffset = !that._options.stick && 1;
        var minPoint = isDefined(min) ? that.translate(min, -stickOffset) : null;
        var maxPoint = isDefined(max) ? that.translate(max, +stickOffset) : null;

        if(minPoint === null) {
            minPoint = canvasOptions.invert ? visibleArea.max : visibleArea.min;
        }
        if(maxPoint === null) {
            maxPoint = canvasOptions.invert ? visibleArea.min : visibleArea.max;
        }
        return that.canvasLength / Math.abs(maxPoint - minPoint);
    },

    // dxRangeSelector

    isValid: function(value) {
        return isDefined(value) ? this._categoriesToPoints[value.valueOf()] >= 0 : false;
    },

    getCorrectValue: getValue,

    to: function(value, direction) {
        var canvasOptions = this._canvasOptions;
        var categoryIndex = this._categoriesToPoints[value.valueOf()];
        var startPointIndex = canvasOptions.startPointIndex || 0;
        var stickDelta = categoryIndex + (this._options.stick ? 0 : 0.5) - startPointIndex + (this._businessRange.invert ? -1 : +1) * direction * 0.5;
        return round(this._calculateProjection(canvasOptions.interval * stickDelta));
    },

    from: function(position, direction = 0) {
        var canvasOptions = this._canvasOptions;
        var startPoint = canvasOptions.startPoint;
        var categories = this.visibleCategories || this._categories;
        var categoriesLength = categories.length;
        var stickInterval = this._options.stick ? 0.5 : 0;

        var // It is strange - while "businessRange.invert" check is required in "to" here it is not.
        // Check that translator.from(translator.to(x, -1), -1) equals x.
        // And check that translator.untranslate(translator.translate(x, -1), -1) does not equal x - is it really supposed to be so?
            result = round(((position - startPoint) / canvasOptions.interval) + stickInterval - 0.5 - /* (businessRange.invert ? -1 : +1) * */direction * 0.5);

        if(result >= categoriesLength) {
            result = categoriesLength - 1;
        }
        if(result < 0) {
            result = 0;
        }
        if(canvasOptions.invert) {
            result = categoriesLength - result - 1;
        }
        return categories[result];
    },

    _add: function() {
        return NaN;
    },

    _toValue: getValue,

    isValueProlonged: true
};
