var registerComponent = require("../../core/component_registrator");
var searchBoxMixin = require("../widget/ui.search_box_mixin");
import extendUtils from "../../core/utils/extend";
var extend = extendUtils.extend;
var TreeViewBase = require("./ui.tree_view.base");

var NODE_CONTAINER_CLASS = "dx-treeview-node-container";

var TreeViewSearch = TreeViewBase.inherit(searchBoxMixin).inherit({
    _addWidgetPrefix: function(className) {
        return "dx-treeview-" + className;
    },

    _optionChanged: function(args) {
        switch(args.name) {
            case "searchValue":
                if(this._showCheckboxes() && this._isRecursiveSelection()) {
                    this._removeSelection();
                }

                this._initDataAdapter();
                this._updateSearch();
                this._repaintContainer();
                break;
            case "searchExpr":
                this._initDataAdapter();
                this.repaint();
                break;
            case "searchMode":
                this.option("expandNodesRecursive") ? this._updateDataAdapter() : this._initDataAdapter();
                this.repaint();
                break;
            default:
                this.callBase(args);
        }
    },

    _updateDataAdapter: function() {
        this._setOptionSilent("expandNodesRecursive", false);

        this._initDataAdapter();

        this._setOptionSilent("expandNodesRecursive", true);
    },

    _getDataAdapterOptions: function() {
        return extend(this.callBase(), {
            searchValue: this.option("searchValue"),
            searchMode: this.option("searchMode") || "contains",
            searchExpr: this.option("searchExpr")
        });
    },

    _updateSearch: function() {
        if(this._searchEditor) {
            var editorOptions = this._getSearchEditorOptions();
            this._searchEditor.option(editorOptions);
        }
    },

    _repaintContainer: function() {
        var $container = this.$element().find("." + NODE_CONTAINER_CLASS).first();
        var rootNodes;

        if($container.length) {
            $container.empty();
            rootNodes = this._dataAdapter.getRootNodes();
            this._renderEmptyMessage(rootNodes);
            this._renderItems($container, rootNodes);
            this._fireContentReadyAction();
        }
    },

    _focusTarget: function() {
        if(this.option("searchEnabled")) {
            return this._scrollableContainer.$element();
        }

        return this.callBase();
    },

    _addWidgetClass: function() {
        this.$element().addClass(this._widgetClass());
    },

    _clean: function() {
        this.callBase();
        this._removeSearchBox();
    }
});

registerComponent("dxTreeView", TreeViewSearch);

export default TreeViewSearch;
