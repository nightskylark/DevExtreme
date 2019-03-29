import ListEdit from "./list/ui.list.edit.search";
import registerComponent from "../core/component_registrator";
/**
* @name dxList
* @inherits CollectionWidget, SearchBoxMixin
* @module ui/list
* @export default
*/
registerComponent("dxList", ListEdit);

module.exports = ListEdit;
