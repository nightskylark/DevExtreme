import $ from "../../core/renderer";
import eventsEngine from "../../events/core/events_engine";
import clickEvent from "../../events/click";
import { each } from "../../core/utils/iterator";
import modules from "./ui.grid_core.modules";

var ERROR_ROW_CLASS = "dx-error-row";
var ERROR_MESSAGE_CLASS = "dx-error-message";
var ERROR_CLOSEBUTTON_CLASS = "dx-closebutton";
var ACTION_CLASS = "action";

var ErrorHandlingController = modules.ViewController.inherit({
    init: function() {
        var that = this;

        that._columnHeadersView = that.getView("columnHeadersView");
        that._rowsView = that.getView("rowsView");
    },

    _createErrorRow: function(error, $tableElements) {
        var that = this;
        var $errorRow;
        var $closeButton;
        var $errorMessage = this._renderErrorMessage(error);

        if($tableElements) {
            $errorRow = $("<tr>").addClass(ERROR_ROW_CLASS);
            $closeButton = $("<div>").addClass(ERROR_CLOSEBUTTON_CLASS).addClass(that.addWidgetPrefix(ACTION_CLASS));

            eventsEngine.on($closeButton, clickEvent.name, that.createAction(function(args) {
                var e = args.event;
                var $errorRow;
                var errorRowIndex = $(e.currentTarget).closest("." + ERROR_ROW_CLASS).index();

                e.stopPropagation();
                each($tableElements, function(_, tableElement) {
                    $errorRow = $(tableElement).children("tbody").children("tr").eq(errorRowIndex);
                    that.removeErrorRow($errorRow);
                });
            }));

            $("<td>")
                .attr({
                    "colSpan": that.getController("columns").getVisibleColumns().length,
                    "role": "presentation"
                })
                .prepend($closeButton)
                .append($errorMessage)
                .appendTo($errorRow);

            return $errorRow;
        }

        return $errorMessage;
    },

    _renderErrorMessage: function(error) {
        var message = error.url ? error.message.replace(error.url, "") : error.message || error;
        var $message = $("<div>").addClass(ERROR_MESSAGE_CLASS).text(message);

        if(error.url) {
            $("<a>").attr("href", error.url).text(error.url).appendTo($message);
        }

        return $message;
    },

    renderErrorRow: function(error, rowIndex, $popupContent) {
        var that = this;
        var $row;
        var $errorMessageElement;
        var $firstErrorRow;
        var rowElements;
        var viewElement;
        var $tableElements;

        if($popupContent) {
            $popupContent.find("." + ERROR_MESSAGE_CLASS).remove();
            $errorMessageElement = that._createErrorRow(error);
            $popupContent.prepend($errorMessageElement);
            return $errorMessageElement;
        }

        viewElement = rowIndex >= 0 || !that._columnHeadersView.isVisible() ? that._rowsView : that._columnHeadersView,
        $tableElements = $popupContent || viewElement.getTableElements();

        each($tableElements, function(_, tableElement) {
            $errorMessageElement = that._createErrorRow(error, $tableElements);
            $firstErrorRow = $firstErrorRow || $errorMessageElement;

            if(rowIndex >= 0) {
                $row = viewElement._getRowElements($(tableElement)).eq(rowIndex);
                that.removeErrorRow($row.next());
                $errorMessageElement.insertAfter($row);
            } else {
                var $tbody = $(tableElement).children("tbody");
                rowElements = $tbody.children("tr");
                if(that._columnHeadersView.isVisible()) {
                    that.removeErrorRow(rowElements.last());
                    $(tableElement).append($errorMessageElement);
                } else {
                    that.removeErrorRow(rowElements.first());
                    $tbody.first().prepend($errorMessageElement);
                }
            }
        });
        return $firstErrorRow;
    },

    removeErrorRow: function($row) {
        if(!$row) {
            let $columnHeaders = this._columnHeadersView && this._columnHeadersView.element();
            $row = $columnHeaders && $columnHeaders.find("." + ERROR_ROW_CLASS);
            if(!$row || !$row.length) {
                var $rowsViewElement = this._rowsView.element();
                $row = $rowsViewElement && $rowsViewElement.find("." + ERROR_ROW_CLASS);
            }
        }
        $row && $row.hasClass(ERROR_ROW_CLASS) && $row.remove();
    },

    optionChanged: function(args) {
        var that = this;

        switch(args.name) {
            case "errorRowEnabled":
                args.handled = true;
                break;
            default:
                that.callBase(args);
        }
    }
});

module.exports = {
    defaultOptions: function() {
        return {
            /**
            * @name GridBaseOptions.errorRowEnabled
            * @type boolean
            * @default true
            */
            errorRowEnabled: true
        };
    },
    controllers: {
        errorHandling: ErrorHandlingController
    },
    extenders: {
        controllers: {
            data: {
                init: function() {
                    var that = this;
                    var errorHandlingController = that.getController("errorHandling");

                    that.callBase();

                    that.dataErrorOccurred.add(function(error, $popupContent) {
                        if(that.option("errorRowEnabled")) {
                            errorHandlingController.renderErrorRow(error, undefined, $popupContent);
                        }
                    });
                    that.changed.add(function() {
                        var errorHandlingController = that.getController("errorHandling");
                        var editingController = that.getController("editing");

                        if(editingController && !editingController.hasChanges()) {
                            errorHandlingController && errorHandlingController.removeErrorRow();
                        }
                    });
                }
            }
        }
    }
};
