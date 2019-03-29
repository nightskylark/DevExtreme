/**
 * @name dxTooltip
 * @inherits dxPopover
 * @hasTranscludedContent
 * @module ui/tooltip
 * @export default
 */
module.exports = require("./tooltip/tooltip");

// NOTE: internal api: dashboards
import { show, hide } from "./tooltip/ui.tooltip";
module.exports.show = show;
module.exports.hide = hide;
