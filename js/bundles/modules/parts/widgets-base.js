import DevExpress from "./core";
import "./data";
import "./file_providers";

/// BUNDLER_PARTS
/* UI core (dx.module-core.js) */

var ui = DevExpress.ui = require("../../../bundles/modules/ui");

import themesModule from "../../../ui/themes";
ui.themes = themesModule;

import setTemplateEngineModule from "../../../ui/set_template_engine";
ui.setTemplateEngine = setTemplateEngineModule;

import dialogModule from "../../../ui/dialog";
ui.dialog = dialogModule;
import notifyModule from "../../../ui/notify";
ui.notify = notifyModule;

/* Base widgets (dx.module-widgets-base.js) */

import dxActionSheetModule from "../../../ui/action_sheet";
ui.dxActionSheet = dxActionSheetModule;
import dxAutocompleteModule from "../../../ui/autocomplete";
ui.dxAutocomplete = dxAutocompleteModule;
import dxBoxModule from "../../../ui/box";
ui.dxBox = dxBoxModule;
import dxButtonModule from "../../../ui/button";
ui.dxButton = dxButtonModule;
import dxDropDownButtonModule from "../../../ui/drop_down_button";
ui.dxDropDownButton = dxDropDownButtonModule;
import dxButtonGroupModule from "../../../ui/button_group";
ui.dxButtonGroup = dxButtonGroupModule;
import dxCalendarModule from "../../../ui/calendar";
ui.dxCalendar = dxCalendarModule;
import dxCheckBoxModule from "../../../ui/check_box";
ui.dxCheckBox = dxCheckBoxModule;
import dxColorBoxModule from "../../../ui/color_box";
ui.dxColorBox = dxColorBoxModule;
import dxDateBoxModule from "../../../ui/date_box";
ui.dxDateBox = dxDateBoxModule;
import dxDrawerModule from "../../../ui/drawer";
ui.dxDrawer = dxDrawerModule;
import dxDeferRenderingModule from "../../../ui/defer_rendering";
ui.dxDeferRendering = dxDeferRenderingModule;
import dxDropDownBoxModule from "../../../ui/drop_down_box";
ui.dxDropDownBox = dxDropDownBoxModule;
import dxDropDownMenuModule from "../../../ui/drop_down_menu";
ui.dxDropDownMenu = dxDropDownMenuModule;
import dxFileUploaderModule from "../../../ui/file_uploader";
ui.dxFileUploader = dxFileUploaderModule;
import dxFormModule from "../../../ui/form";
ui.dxForm = dxFormModule;
import dxGalleryModule from "../../../ui/gallery";
ui.dxGallery = dxGalleryModule;
import dxHtmlEditorModule from "../../../ui/html_editor";
ui.dxHtmlEditor = dxHtmlEditorModule;
import dxListModule from "../../../ui/list";
ui.dxList = dxListModule;
import dxLoadIndicatorModule from "../../../ui/load_indicator";
ui.dxLoadIndicator = dxLoadIndicatorModule;
import dxLoadPanelModule from "../../../ui/load_panel";
ui.dxLoadPanel = dxLoadPanelModule;
import dxLookupModule from "../../../ui/lookup";
ui.dxLookup = dxLookupModule;
import dxMapModule from "../../../ui/map";
ui.dxMap = dxMapModule;
import dxMultiViewModule from "../../../ui/multi_view";
ui.dxMultiView = dxMultiViewModule;
import dxNavBarModule from "../../../ui/nav_bar";
ui.dxNavBar = dxNavBarModule;
import dxNumberBoxModule from "../../../ui/number_box";
ui.dxNumberBox = dxNumberBoxModule;
import dxOverlayModule from "../../../ui/overlay";
ui.dxOverlay = dxOverlayModule;
import dxPopoverModule from "../../../ui/popover";
ui.dxPopover = dxPopoverModule;
import dxPopupModule from "../../../ui/popup";
ui.dxPopup = dxPopupModule;
import dxProgressBarModule from "../../../ui/progress_bar";
ui.dxProgressBar = dxProgressBarModule;
import dxRadioGroupModule from "../../../ui/radio_group";
ui.dxRadioGroup = dxRadioGroupModule;
import dxRangeSliderModule from "../../../ui/range_slider";
ui.dxRangeSlider = dxRangeSliderModule;
import dxResizableModule from "../../../ui/resizable";
ui.dxResizable = dxResizableModule;
import dxResponsiveBoxModule from "../../../ui/responsive_box";
ui.dxResponsiveBox = dxResponsiveBoxModule;
import dxScrollViewModule from "../../../ui/scroll_view";
ui.dxScrollView = dxScrollViewModule;
import dxSelectBoxModule from "../../../ui/select_box";
ui.dxSelectBox = dxSelectBoxModule;
import dxSliderModule from "../../../ui/slider";
ui.dxSlider = dxSliderModule;
import dxSwitchModule from "../../../ui/switch";
ui.dxSwitch = dxSwitchModule;
import dxTabPanelModule from "../../../ui/tab_panel";
ui.dxTabPanel = dxTabPanelModule;
import dxTabsModule from "../../../ui/tabs";
ui.dxTabs = dxTabsModule;
import dxTagBoxModule from "../../../ui/tag_box";
ui.dxTagBox = dxTagBoxModule;
import dxTextAreaModule from "../../../ui/text_area";
ui.dxTextArea = dxTextAreaModule;
import dxTextBoxModule from "../../../ui/text_box";
ui.dxTextBox = dxTextBoxModule;
import dxTileViewModule from "../../../ui/tile_view";
ui.dxTileView = dxTileViewModule;
import dxToastModule from "../../../ui/toast";
ui.dxToast = dxToastModule;
import dxToolbarModule from "../../../ui/toolbar";
ui.dxToolbar = dxToolbarModule;
import dxTooltipModule from "../../../ui/tooltip";
ui.dxTooltip = dxTooltipModule;
import dxTrackBarModule from "../../../ui/track_bar";
ui.dxTrackBar = dxTrackBarModule;

/* Validation (dx.module-widgets-base.js) */

import validationEngineModule from "../../../ui/validation_engine";
DevExpress.validationEngine = validationEngineModule;
import dxValidationSummaryModule from "../../../ui/validation_summary";
ui.dxValidationSummary = dxValidationSummaryModule;
import dxValidationGroupModule from "../../../ui/validation_group";
ui.dxValidationGroup = dxValidationGroupModule;
import dxValidatorModule from "../../../ui/validator";
ui.dxValidator = dxValidatorModule;

/* Widget parts */
import "../../../ui/html_editor/converters/markdown";
/// BUNDLER_PARTS_END

// Dashboards
import CollectionWidgetModule from "../../../ui/collection/ui.collection_widget.edit";
ui.CollectionWidget = CollectionWidgetModule;
// Dashboards

// Reports
import dxDropDownEditorModule from "../../../ui/drop_down_editor/ui.drop_down_editor";
ui.dxDropDownEditor = dxDropDownEditorModule;
// Reports

module.exports = ui;
