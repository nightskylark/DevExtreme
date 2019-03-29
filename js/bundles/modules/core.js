import windowUtils from "../../core/utils/window";
var window = windowUtils.getWindow();

var DevExpress = window.DevExpress = window.DevExpress || {};

var errors = DevExpress.errors = require("../../core/errors");

if(DevExpress._DEVEXTREME_BUNDLE_INITIALIZED) {
    throw errors.Error("E0024");
}
DevExpress._DEVEXTREME_BUNDLE_INITIALIZED = true;

DevExpress.clientExporter = require("../../exporter");

DevExpress.VERSION = require("../../core/version");

DevExpress.Class = require("../../core/class");
DevExpress.DOMComponent = require("../../core/dom_component");
///#DEBUG
DevExpress.Component = require("../../core/component");
///#ENDDEBUG
DevExpress.registerComponent = require("../../core/component_registrator");
DevExpress.devices = require("../../core/devices");

DevExpress.Color = require("../../color");

import animationFrame from "../../animation/frame";

DevExpress.EventsMixin = require("../../core/events_mixin");

/**
 * @name utils
 * @namespace DevExpress
 */
DevExpress.utils = {};

DevExpress.utils.requestAnimationFrame = animationFrame.requestAnimationFrame;
DevExpress.utils.cancelAnimationFrame = animationFrame.cancelAnimationFrame;

import { initMobileViewport } from "../../mobile/init_mobile_viewport/init_mobile_viewport";
DevExpress.utils.initMobileViewport = initMobileViewport;

// TODO: MODULARITY: Remove this
import { extendFromObject } from "../../core/utils/extend";
DevExpress.utils.extendFromObject = extendFromObject;
import { createComponents } from "../../core/utils/dom";
DevExpress.utils.createComponents = createComponents;
import { triggerShownEvent } from "../../core/utils/dom";
DevExpress.utils.triggerShownEvent = triggerShownEvent;
import { triggerHidingEvent } from "../../core/utils/dom";
DevExpress.utils.triggerHidingEvent = triggerHidingEvent;
import { resetActiveElement } from "../../core/utils/dom";
DevExpress.utils.resetActiveElement = resetActiveElement;
import { findBestMatches } from "../../core/utils/common";
DevExpress.utils.findBestMatches = findBestMatches;
import { create } from "../../core/utils/queue";
DevExpress.createQueue = create;
DevExpress.utils.dom = require("../../core/utils/dom");
DevExpress.utils.common = require("../../core/utils/common");
DevExpress.utils.date = require("../../core/utils/date");
DevExpress.utils.browser = require("../../core/utils/browser");
DevExpress.utils.inflector = require("../../core/utils/inflector");
DevExpress.utils.iterator = require("../../core/utils/iterator");
DevExpress.utils.readyCallbacks = require("../../core/utils/ready_callbacks");
DevExpress.utils.resizeCallbacks = require("../../core/utils/resize_callbacks");
DevExpress.utils.console = require("../../core/utils/console");
DevExpress.utils.string = require("../../core/utils/string");
DevExpress.utils.support = require("../../core/utils/support");

DevExpress.processHardwareBackButton = require("../../mobile/process_hardware_back_button");

import { value } from "../../core/utils/view_port";
DevExpress.viewPort = value;

DevExpress.hideTopOverlay = require("../../mobile/hide_top_overlay");

DevExpress.formatHelper = require("../../format_helper");
DevExpress.config = require("../../core/config");

import { presets } from "../../animation/presets/presets";
DevExpress.animationPresets = presets;
DevExpress.fx = require("../../animation/fx");
import { TransitionExecutor } from "../../animation/transition_executor/transition_executor";
DevExpress.TransitionExecutor = TransitionExecutor;
import { PresetCollection } from "../../animation/presets/presets";
DevExpress.AnimationPresetCollection = PresetCollection;

DevExpress.events = require("../../events");

DevExpress.events.click = require("../../events/click");
DevExpress.events.utils = require("../../events/utils");
DevExpress.events.GestureEmitter = require("../../events/gesture/emitter.gesture");

DevExpress.localization = require("../../localization");

module.exports = DevExpress;
