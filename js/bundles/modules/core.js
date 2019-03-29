import windowUtils from "../../core/utils/window";
var window = windowUtils.getWindow();

var DevExpress = window.DevExpress = window.DevExpress || {};

var errors = DevExpress.errors = require("../../core/errors");

if(DevExpress._DEVEXTREME_BUNDLE_INITIALIZED) {
    throw errors.Error("E0024");
}
DevExpress._DEVEXTREME_BUNDLE_INITIALIZED = true;

import clientExporterModule from "../../exporter";
DevExpress.clientExporter = clientExporterModule;

import VERSIONModule from "../../core/version";
DevExpress.VERSION = VERSIONModule;

import ClassModule from "../../core/class";
DevExpress.Class = ClassModule;
import DOMComponentModule from "../../core/dom_component";
DevExpress.DOMComponent = DOMComponentModule;
///#DEBUG
import ComponentModule from "../../core/component";
DevExpress.Component = ComponentModule;
///#ENDDEBUG
import registerComponentModule from "../../core/component_registrator";
DevExpress.registerComponent = registerComponentModule;
import devicesModule from "../../core/devices";
DevExpress.devices = devicesModule;

import ColorModule from "../../color";
DevExpress.Color = ColorModule;

import animationFrame from "../../animation/frame";

import EventsMixinModule from "../../core/events_mixin";
DevExpress.EventsMixin = EventsMixinModule;

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
import domModule from "../../core/utils/dom";
DevExpress.utils.dom = domModule;
import commonModule from "../../core/utils/common";
DevExpress.utils.common = commonModule;
import dateModule from "../../core/utils/date";
DevExpress.utils.date = dateModule;
import browserModule from "../../core/utils/browser";
DevExpress.utils.browser = browserModule;
import inflectorModule from "../../core/utils/inflector";
DevExpress.utils.inflector = inflectorModule;
import iteratorModule from "../../core/utils/iterator";
DevExpress.utils.iterator = iteratorModule;
import readyCallbacksModule from "../../core/utils/ready_callbacks";
DevExpress.utils.readyCallbacks = readyCallbacksModule;
import resizeCallbacksModule from "../../core/utils/resize_callbacks";
DevExpress.utils.resizeCallbacks = resizeCallbacksModule;
import consoleModule from "../../core/utils/console";
DevExpress.utils.console = consoleModule;
import stringModule from "../../core/utils/string";
DevExpress.utils.string = stringModule;
import supportModule from "../../core/utils/support";
DevExpress.utils.support = supportModule;

import processHardwareBackButtonModule from "../../mobile/process_hardware_back_button";
DevExpress.processHardwareBackButton = processHardwareBackButtonModule;

import { value } from "../../core/utils/view_port";
DevExpress.viewPort = value;

import hideTopOverlayModule from "../../mobile/hide_top_overlay";
DevExpress.hideTopOverlay = hideTopOverlayModule;

import formatHelperModule from "../../format_helper";
DevExpress.formatHelper = formatHelperModule;
import configModule from "../../core/config";
DevExpress.config = configModule;

import { presets } from "../../animation/presets/presets";
DevExpress.animationPresets = presets;
import fxModule from "../../animation/fx";
DevExpress.fx = fxModule;
import { TransitionExecutor } from "../../animation/transition_executor/transition_executor";
DevExpress.TransitionExecutor = TransitionExecutor;
import { PresetCollection } from "../../animation/presets/presets";
DevExpress.AnimationPresetCollection = PresetCollection;

import eventsModule from "../../events";
DevExpress.events = eventsModule;

import clickModule from "../../events/click";
DevExpress.events.click = clickModule;
import utilsModule from "../../events/utils";
DevExpress.events.utils = utilsModule;
import GestureEmitterModule from "../../events/gesture/emitter.gesture";
DevExpress.events.GestureEmitter = GestureEmitterModule;

import localizationModule from "../../localization";
DevExpress.localization = localizationModule;

module.exports = DevExpress;
