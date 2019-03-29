import saverModule from "./exporter/file_saver";
var fileSaver = saverModule.fileSaver;
import excelCreator from "./exporter/excel_creator";
import imageCreator from "./exporter/image_creator";
import svgCreator from "./exporter/svg_creator";
import exportDataGrid from "./exporter/exceljs/exportDataGrid";
import typeUtils from "./core/utils/type";
var _isFunction = typeUtils.isFunction;
import { getData as pdfCreatorGetData } from "./exporter/pdf_creator";

exports.export = function(data, options, getData) {
    if(!data) {
        return;
    }

    // TODO: Can the following actions be not defined? (since they are provided by a widget not by a user)
    var exportingAction = options.exportingAction;

    var exportedAction = options.exportedAction;
    var fileSavingAction = options.fileSavingAction;

    var eventArgs = {
        fileName: options.fileName,
        format: options.format,
        cancel: false
    };

    _isFunction(exportingAction) && exportingAction(eventArgs);

    if(!eventArgs.cancel) {
        getData(data, options, function(blob) {
            _isFunction(exportedAction) && exportedAction();

            if(_isFunction(fileSavingAction)) {
                eventArgs.data = blob;
                fileSavingAction(eventArgs);
            }

            if(!eventArgs.cancel) {
                fileSaver.saveAs(eventArgs.fileName, options.format, blob, options.proxyUrl, undefined, options.forceProxy);
            }
        });
    }
};

exports.excelJS = exportDataGrid;
exports.fileSaver = fileSaver;
exports.excel = {
    creator: excelCreator.ExcelCreator,
    getData: excelCreator.getData,
    formatConverter: require("./exporter/excel_format_converter")
};
///#DEBUG
exports.excel.__internals = excelCreator.__internals;
///#ENDDEBUG
exports.image = {
    creator: imageCreator.imageCreator,
    getData: imageCreator.getData,
    testFormats: imageCreator.testFormats
};
exports.pdf = {
    getData: pdfCreatorGetData
};
exports.svg = {
    creator: svgCreator.svgCreator,
    getData: svgCreator.getData
};
