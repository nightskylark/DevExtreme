import data from "./data";
import ui from "./widgets-base";

/// BUNDLER_PARTS
/* Web widgets (dx.module-widgets-web.js) */

import dxAccordionModule from "../../../ui/accordion";
ui.dxAccordion = dxAccordionModule;
import dxContextMenuModule from "../../../ui/context_menu";
ui.dxContextMenu = dxContextMenuModule;
import dxDataGridModule from "../../../ui/data_grid";
ui.dxDataGrid = dxDataGridModule;
import dxTreeListModule from "../../../ui/tree_list";
ui.dxTreeList = dxTreeListModule;
import dxMenuModule from "../../../ui/menu";
ui.dxMenu = dxMenuModule;
import dxPivotGridModule from "../../../ui/pivot_grid";
ui.dxPivotGrid = dxPivotGridModule;
import dxPivotGridFieldChooserModule from "../../../ui/pivot_grid_field_chooser";
ui.dxPivotGridFieldChooser = dxPivotGridFieldChooserModule;
import PivotGridDataSourceModule from "../../../ui/pivot_grid/data_source";
data.PivotGridDataSource = PivotGridDataSourceModule;
import XmlaStoreModule from "../../../ui/pivot_grid/xmla_store";
data.XmlaStore = XmlaStoreModule;
import dxSchedulerModule from "../../../ui/scheduler";
ui.dxScheduler = dxSchedulerModule;
import dxTreeViewModule from "../../../ui/tree_view";
ui.dxTreeView = dxTreeViewModule;
import dxFilterBuilderModule from "../../../ui/filter_builder";
ui.dxFilterBuilder = dxFilterBuilderModule;
import dxFileManagerModule from "../../../ui/file_manager";
ui.dxFileManager = dxFileManagerModule;
/// BUNDLER_PARTS_END
