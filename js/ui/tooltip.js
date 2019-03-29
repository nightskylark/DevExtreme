/**
 * @name dxTooltip
 * @inherits dxPopover
 * @hasTranscludedContent
 * @module ui/tooltip
 * @export default
 */
import exportsModule from "./tooltip/tooltip";
module.exports = exportsModule;

// NOTE: internal api: dashboards
import { show, hide } from "./tooltip/ui.tooltip";
module.exports.show = show;
module.exports.hide = hide;
