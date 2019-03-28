var LayoutElementModule = require("../core/layout_element");
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;

function HeaderBlock() { }

extend(HeaderBlock.prototype, LayoutElementModule.LayoutElement.prototype, {

    update: function(elements, canvas) {
        this._elements = elements.filter(element => element.getLayoutOptions());
        this._canvas = canvas;
    },

    dispose: function() {
        this._elements = null;
    },

    measure: function() {
        var that = this;
        var layoutOptions = that.getLayoutOptions();
        var result;

        if(layoutOptions) {
            result = {
                size: [layoutOptions.width, layoutOptions.height],
                alignment: [layoutOptions.horizontalAlignment, layoutOptions.verticalAlignment],
                side: 1
            };
            that._elements.forEach(function(elem) {
                elem.draw(layoutOptions.width, layoutOptions.height, that._canvas);
            });
        }

        return result || null;
    },

    getLayoutOptions: function() {
        var that = this;
        var elements = that._elements;
        var length = elements.length;
        var firstElement;
        var layout;
        var elementLayout;
        var i = 1;

        if(!length) {
            return null;
        }

        firstElement = elements[0];
        layout = extend(true, {}, firstElement.getLayoutOptions());
        layout.position = layout.position || {};

        for(i; i < length; i++) {
            elementLayout = elements[i].getLayoutOptions();
            if(elementLayout.height > layout.height) {
                layout.height = elementLayout.height;
            }
            layout.width += elementLayout.width;
            if(elementLayout.position) {
                layout.position = elementLayout.position;
                layout.verticalAlignment = elementLayout.position.vertical;
                layout.horizontalAlignment = elementLayout.position.horizontal;
            }
        }
        return layout;
    },

    _render: function(width, height, drawMethod) {
        var canvas = this._canvas;
        var isHidden = false;

        this._elements.forEach(function(e) {
            e[drawMethod](width, height, canvas);
            var elementWidth = e.getLayoutOptions().width;
            width -= elementWidth;
            isHidden = isHidden || elementWidth === 0 || width < 0;
        });

        if(isHidden) {
            this._elements.forEach(function(e) { e.freeSpace(); });
        }
    },

    probeDraw: function(width, height) {
        this._render(width, height, "probeDraw");
    },

    draw: function(width, height) {
        this._render(width, height, "draw");
    },

    shift: function(x, y) {
        this._elements.forEach(function(elem) {
            elem.shift(x, y);
        });
    }
});

exports.HeaderBlock = HeaderBlock;
