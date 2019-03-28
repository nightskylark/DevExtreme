import { COLOR_MODE_GRADIENT, COLOR_MODE_SOURCE, COLOR_MODE_TARGET } from './constants';

var noop = require("../../core/utils/common").noop;
var Node = require("./node_item");
var Link = require("./link_item");
var defaultLayoutBuilder = require("./layout");
var typeUtils = require("../../core/utils/type");
var _isString = typeUtils.isString;
var _isNumber = typeUtils.isNumeric;

function moveLabel(node, labelOptions, availableLabelWidth, rect) {
    if(node.label.getBBox().width > availableLabelWidth) {
        node.labelText.applyEllipsis(availableLabelWidth);
    }

    var bBox = node.label.getBBox();
    var verticalOffset = labelOptions.verticalOffset;
    var horizontalOffset = labelOptions.horizontalOffset;
    var labelOffsetY = Math.round(node.rect.y + node.rect.height / 2 - bBox.y - bBox.height / 2) + verticalOffset;
    var labelOffsetX = node.rect.x + horizontalOffset + node.rect.width - bBox.x;

    if(labelOffsetX + bBox.width >= rect[2] - rect[0]) {
        labelOffsetX = node.rect.x - horizontalOffset - bBox.x - bBox.width;
    }

    if(labelOffsetY >= rect[3]) {
        labelOffsetY = rect[3];
    }

    if(labelOffsetY - bBox.height < rect[1]) {
        labelOffsetY = node.rect.y - bBox.y + verticalOffset;
    }

    node.labelText.attr({
        translateX: labelOffsetX,
        translateY: labelOffsetY
    });
}

function getConnectedLinks(layout, nodeName, linkType) {
    let result = [];
    let attrName = linkType === 'in' ? '_to' : '_from';
    let invertedAttrName = linkType === 'in' ? '_from' : '_to';

    layout.links.map((link) => { return link[attrName]._name === nodeName; }).forEach((connected, idx) => {
        connected && result.push({ index: idx, weight: layout.links[idx]._weight, node: layout.links[idx][invertedAttrName]._name });
    });
    return result;
}

var dxSankey = require("../core/base_widget").inherit({
    _rootClass: "dxs-sankey",

    _rootClassPrefix: "dxs",

    _proxyData: [],

    _optionChangesMap: {
        dataSource: "DATA_SOURCE",
        sortData: "DATA_SOURCE",
        alignment: "DATA_SOURCE",
        node: "BUILD_LAYOUT",
        link: "BUILD_LAYOUT",
        palette: "BUILD_LAYOUT",
        paletteExtensionMode: "BUILD_LAYOUT"
    },

    _themeDependentChanges: ['BUILD_LAYOUT'],

    _getDefaultSize: function() {
        return { width: 400, height: 400 };
    },

    _themeSection: "sankey",

    _fontFields: ["label.font"],

    _optionChangesOrder: ["DATA_SOURCE"],

    _initialChanges: ["DATA_SOURCE"],

    _initCore: function() {
        this._groupLinks = this._renderer.g().append(this._renderer.root);
        this._groupNodes = this._renderer.g().append(this._renderer.root);
        this._groupLabels = this._renderer.g().attr({
            class: this._rootClassPrefix + "-labels"
        }).append(this._renderer.root);

        this._drawLabels = true;

        this._nodes = [];
        this._links = [];
        this._gradients = [];
    },

    _disposeCore: noop,

    _applySize: function(rect) {
        this._rect = rect.slice();

        var adaptiveLayout = this._getOption("adaptiveLayout");
        if(adaptiveLayout.keepLabels || this._rect[2] - this._rect[0] > adaptiveLayout.width) {
            this._drawLabels = true;
        } else {
            this._drawLabels = false;
        }

        this._change(["BUILD_LAYOUT"]);
        return this._rect;
    },

    _eventsMap: {
        onNodeHoverChanged: { name: "nodeHoverChanged" },
        onLinkHoverChanged: { name: "linkHoverChanged" }
    },

    _customChangesOrder: ["BUILD_LAYOUT", "NODES_DRAW", "LINKS_DRAW", "LABELS", "DRAWN"],

    _dataSourceChangedHandler: function() {
        this._requestChange(['BUILD_LAYOUT']);
    },

    _change_DRAWN: function() {
        this._drawn();
    },

    _change_DATA_SOURCE: function() {
        this._change(["DRAWN"]);
        this._updateDataSource();
    },

    _change_LABELS: function() {
        this._applyLabelsAppearance();
    },

    _change_BUILD_LAYOUT: function() {
        this._groupNodes.clear();
        this._groupLinks.clear();
        this._groupLabels.clear();

        this._buildLayout();
    },

    _change_NODES_DRAW: function() {
        var that = this;
        var nodes = that._nodes;

        nodes.forEach(function(node, index) {
            var element = that._renderer.rect().attr(node.rect).append(that._groupNodes);
            node.element = element;
        });
        this._applyNodesAppearance();
    },

    _change_LINKS_DRAW: function() {
        var that = this;
        var links = that._links;

        links.forEach(function(link, index) {
            var group = that._renderer.g().attr({ class: 'link', 'data-link-idx': index }).append(that._groupLinks);
            link.overlayElement = that._renderer.path([], "area").attr({ d: link.d }).append(group);
            link.element = that._renderer.path([], "area").attr({ d: link.d }).append(group);
        });
        this._applyLinksAppearance();
    },

    _suspend: function() {
        if(!this._applyingChanges) {
            this._suspendChanges();
        }
    },
    _resume: function() {
        if(!this._applyingChanges) {
            this._resumeChanges();
        }
    },

    _showTooltip: noop,

    hideTooltip: noop,

    clearHover: function() {
        this._suspend();

        this._nodes.forEach(function(node) {
            node.isHovered() && node.hover(false);
        });

        this._links.forEach(function(link) {
            link.isHovered() && link.hover(false);
            link.isAdjacentNodeHovered() && link.adjacentNodeHover(false);
        });

        this._resume();
    },

    _applyNodesAppearance: function() {
        this._nodes.forEach(function(node) {
            var state = node.getState();
            node.element.smartAttr(node.states[state]);
        });
    },

    _applyLinksAppearance: function() {
        this._links.forEach(function(link) {
            var state = link.getState();
            link.element.smartAttr(link.states[state]);
            link.overlayElement.smartAttr(link.overlayStates[state]);
        });
    },

    _hitTestTargets: function(x, y) {
        var that = this;
        var data;

        this._proxyData.some(function(callback) {
            data = callback.call(that, x, y);
            if(data) {
                return true;
            }
        });
        return data;
    },

    _getData: function() {
        var that = this;
        var data = that._dataSourceItems() || [];
        var sourceField = that._getOption("sourceField", true);
        var targetField = that._getOption("targetField", true);
        var weightField = that._getOption("weightField", true);
        var processedData = [];

        data.forEach(function(item) {
            if(!item.hasOwnProperty(sourceField)) {
                that._incidentOccurred("E2007", sourceField);
            } else if(!item.hasOwnProperty(targetField)) {
                that._incidentOccurred("E2007", targetField);
            } else if(!item.hasOwnProperty(weightField)) {
                that._incidentOccurred("E2007", weightField);
            } else {

                if(!_isString(item[sourceField])) {
                    that._incidentOccurred("E2008", sourceField);
                } else if(!_isString(item[targetField])) {
                    that._incidentOccurred("E2008", targetField);
                } else if(!_isNumber(item[weightField]) || item[weightField] <= 0) {
                    that._incidentOccurred("E2009", weightField);
                } else {
                    processedData.push([item[sourceField], item[targetField], item[weightField]]);
                }

            }
        });

        return processedData;
    },

    _buildLayout: function() {
        var that = this;
        var data = that._getData();
        var availableRect = this._rect;
        var nodeOptions = that._getOption('node');
        var sortData = that._getOption('sortData');
        var layoutBuilder = that._getOption('layoutBuilder', true) || defaultLayoutBuilder;

        var rect = {
            x: availableRect[0],
            y: availableRect[1],
            width: availableRect[2] - availableRect[0],
            height: availableRect[3] - availableRect[1]
        };

        var layout = layoutBuilder.computeLayout(data, sortData,
            {
                availableRect: rect,
                nodePadding: nodeOptions.padding,
                nodeWidth: nodeOptions.width,
                nodeAlign: that._getOption('alignment', true)
            }, that._incidentOccurred
        );

        that._layoutMap = layout;

        if(!layout.hasOwnProperty('error')) {
            let nodeColors = {};
            let nodeIdx = 0;
            let linkOptions = that._getOption("link");

            let totalNodesNum = layout.nodes
                .map((item) => { return item.length; })
                .reduce((previousValue, currentValue) => { return previousValue + currentValue; }, 0);

            let palette = that._themeManager.createPalette(that._getOption("palette", true), {
                useHighlight: true,
                extensionMode: that._getOption("paletteExtensionMode", true),
                count: totalNodesNum
            });

            that._nodes = [];
            that._links = [];

            that._gradients.forEach(gradient => { gradient.dispose(); });
            that._gradients = [];

            that._shadowFilter && that._shadowFilter.dispose();

            layout.nodes.forEach((cascadeNodes) => {
                cascadeNodes.forEach((node) => {
                    var color = nodeOptions.color || palette.getNextColor();

                    var nodeItem = new Node(that, {
                        id: nodeIdx,
                        color: color,
                        rect: node,
                        options: nodeOptions,
                        linksIn: getConnectedLinks(layout, node._name, 'in'),
                        linksOut: getConnectedLinks(layout, node._name, 'out')
                    });

                    that._nodes.push(nodeItem);
                    nodeIdx++;
                    nodeColors[node._name] = color;
                });
            });

            layout.links.forEach((link) => {
                let gradient = null;

                if(linkOptions.colorMode === COLOR_MODE_GRADIENT) {
                    gradient = that._renderer.linearGradient([
                        { offset: '0%', 'stop-color': nodeColors[link._from._name] },
                        { offset: '100%', 'stop-color': nodeColors[link._to._name] }
                    ]);
                    this._gradients.push(gradient);
                }

                let color = linkOptions.color;
                if(linkOptions.colorMode === COLOR_MODE_SOURCE) {
                    color = nodeColors[link._from._name];
                } else if(linkOptions.colorMode === COLOR_MODE_TARGET) {
                    color = nodeColors[link._to._name];
                }

                var linkItem = new Link(that, {
                    d: link.d,
                    boundingRect: link._boundingRect,
                    color: color,
                    options: linkOptions,
                    connection: {
                        source: link._from._name,
                        target: link._to._name,
                        weight: link._weight
                    },
                    gradient: gradient
                });
                that._links.push(linkItem);
            });

            that._renderer.initHatching();
            that._change(["NODES_DRAW", "LINKS_DRAW", "LABELS"]);
        }

        that._change(["DRAWN"]);
    },

    _applyLabelsAppearance: function() {
        var that = this;
        var labelOptions = that._getOption("label");
        var availableWidth = that._rect[2] - that._rect[0];
        var nodeOptions = that._getOption("node");

        that._shadowFilter = that._renderer.shadowFilter("-50%", "-50%", "200%", "200%").attr(labelOptions.shadow);
        that._groupLabels.clear();

        if(that._drawLabels && labelOptions.visible) {
            // emtpy space between cascades with 'labelOptions.horizontalOffset' subtracted
            var availableLabelWidth = (availableWidth - (nodeOptions.width + labelOptions.horizontalOffset) - (that._layoutMap.cascades.length * nodeOptions.width)) / (that._layoutMap.cascades.length - 1) - labelOptions.horizontalOffset;
            that._nodes.forEach(function(node) {
                that._createLabel(node, labelOptions, that._shadowFilter.id);
                moveLabel(node, labelOptions, availableLabelWidth, that._rect);
            });

            // test and handle labels overlapping here
            if(labelOptions.overlappingBehavior !== 'none') {
                that._nodes.forEach(function(thisNode) {
                    var thisBox = thisNode.label.getBBox();
                    that._nodes.forEach(function(otherNode) {
                        var otherBox = otherNode.label.getBBox();
                        if(thisNode.id !== otherNode.id && defaultLayoutBuilder.overlap(thisBox, otherBox)) {
                            if(labelOptions.overlappingBehavior === 'ellipsis') {
                                thisNode.labelText.applyEllipsis(otherBox.x - thisBox.x);
                            } else if(labelOptions.overlappingBehavior === 'hide') {
                                thisNode.labelText.remove();
                            }
                        }
                    });
                });
            }
        }
    },

    _createLabel: function(node, labelOptions, filter) {
        var textData = labelOptions.customizeText(node);
        var settings = node.getLabelAttributes(labelOptions, filter);
        if(textData) {
            node.label = this._renderer.g().append(this._groupLabels);
            node.labelText = this._renderer.text(textData)
                .attr(settings.attr)
                .css(settings.css);
            node.labelText.append(node.label);
        }
    },

    _getMinSize: function() {
        var adaptiveLayout = this._getOption("adaptiveLayout");
        return [adaptiveLayout.width, adaptiveLayout.height];
    },

    getAllNodes: function() {
        return this._nodes.slice();
    },

    getAllLinks: function() {
        return this._links.slice();
    }
});

require("../../core/component_registrator")("dxSankey", dxSankey);
module.exports = dxSankey;

// PLUGINS_SECTION
dxSankey.addPlugin(require("../core/data_source").plugin);
