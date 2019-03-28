var registerComponent = require("../../core/component_registrator");
var TextEditorMask = require("./ui.text_editor.mask");

registerComponent("dxTextEditor", TextEditorMask);

module.exports = TextEditorMask;
