"use strict";
var $ = require("../../core/renderer"),
    domUtils = require("../../core/utils/dom"),
    errors = require("./ui.errors"),
    each = require("../../core/utils/iterator").each,
    devices = require("../../core/devices"),
    commonUtils = require("../../core/utils/common"),
    typeUtils = require("../../core/utils/type"),
    FunctionTemplate = require("./function_template"),
    EmptyTemplate = require("./empty_template"),
    ChildDefaultTemplate = require("./child_default_template");

var TEMPLATE_SELECTOR = "[data-options*='dxTemplate']",
    TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper";

class TemplatePlugin {

    // INIT

    init(instanceGate) {
        this.instanceGate = instanceGate;
        this._extractTemplates();

        this._tempTemplates = [];
        this._defaultTemplates = {};

        instanceGate.instance._addDefaultTemplate = function(templateName, template) {
            this._defaultTemplates[templateName] = template;
        }.bind(this);

        // NOTE: please, do not use this crap
        instanceGate.instance._getDefaultTemplate = function(templateName) {
            return this._defaultTemplates[templateName];
        }.bind(this);

        instanceGate.instance._getTemplate = this.getTemplate.bind(this);
        instanceGate.instance._getTemplateByOption = this.getTemplateByOption.bind(this);
    }

    _extractTemplates() {
        var templates = this.instanceGate.option("integrationOptions.templates"),
            templateElements = this.instanceGate.$element().contents().filter(TEMPLATE_SELECTOR);

        var templatesMap = {};

        templateElements.each(function(_, template) {
            var templateOptions = domUtils.getElementOptions(template).dxTemplate;

            if(!templateOptions) {
                return;
            }

            if(!templateOptions.name) {
                throw errors.Error("E0023");
            }

            $(template).addClass(TEMPLATE_WRAPPER_CLASS).detach();
            templatesMap[templateOptions.name] = templatesMap[templateOptions.name] || [];
            templatesMap[templateOptions.name].push(template);
        });

        each(templatesMap, (function(templateName, value) {
            var deviceTemplate = this._findTemplateByDevice(value);
            if(deviceTemplate) {
                templates[templateName] = this._createTemplate(deviceTemplate);
            }
        }).bind(this));
    }

    _findTemplateByDevice(templates) {
        var suitableTemplate = commonUtils.findBestMatches(devices.current(), templates, function(template) {
            return domUtils.getElementOptions(template).dxTemplate;
        })[0];

        each(templates, function(index, template) {
            if(template !== suitableTemplate) {
                $(template).remove();
            }
        });

        return suitableTemplate;
    }

    _createTemplate(templateSource) {
        templateSource = typeof templateSource === "string" ? domUtils.normalizeTemplateElement(templateSource) : templateSource;
        return this.instanceGate.option("integrationOptions.createTemplate")(templateSource);
    }

    // GET TEMPLATE

    getTemplate(templateSource) {
        if(typeUtils.isFunction(templateSource)) {
            return new FunctionTemplate(function(options) {
                var templateSourceResult = templateSource.apply(this.instance, this._getNormalizedTemplateArgs(options));

                if(!typeUtils.isDefined(templateSourceResult)) {
                    return new EmptyTemplate();
                }

                var dispose = false;
                var template = this._acquireTemplate(templateSourceResult, function(templateSource) {
                    if(templateSource.nodeType || typeUtils.isRenderer(templateSource) && !$(templateSource).is("script")) {
                        return new FunctionTemplate(function() {
                            return templateSource;
                        });
                    }
                    dispose = true;
                    return this._createTemplate(templateSource);
                }.bind(this));

                var result = template.render(options);
                dispose && template.dispose && template.dispose();
                return result;
            }.bind(this));
        }

        return this._acquireTemplate(templateSource, this._createTemplateIfNeeded.bind(this));
    }

    _getNormalizedTemplateArgs(options) {
        var args = [];

        if("model" in options) {
            args.push(options.model);
        }
        if("index" in options) {
            args.push(options.index);
        }
        args.push(options.container);

        return args;
    }

    _acquireTemplate(templateSource, createTemplate) {
        if(templateSource == null) {
            return new EmptyTemplate();
        }

        if(templateSource instanceof ChildDefaultTemplate) {
            return this._defaultTemplates[templateSource.name];
        }

        // TODO: templateSource.render is needed for angular2 integration. Try to remove it after supporting TypeScript modules.
        if(typeUtils.isFunction(templateSource.render) && !typeUtils.isRenderer(templateSource)) {
            return templateSource;
        }

        if(templateSource.nodeType || typeUtils.isRenderer(templateSource)) {
            templateSource = $(templateSource);

            return createTemplate(templateSource);
        }

        if(typeof templateSource === "string") {
            var userTemplate = this.instanceGate.option("integrationOptions.templates")[templateSource];
            if(userTemplate) {
                return userTemplate;
            }

            var dynamicTemplate = this._defaultTemplates[templateSource];
            if(dynamicTemplate) {
                return dynamicTemplate;
            }
            return createTemplate(templateSource);
        }

        return this._acquireTemplate(templateSource.toString(), createTemplate);
    }

    _createTemplateIfNeeded(templateSource) {
        var templateKey = function(templateSource) {
            return (typeUtils.isRenderer(templateSource) && templateSource[0]) || templateSource;
        };

        var cachedTemplate = this._tempTemplates.filter(function(t) {
            templateSource = templateKey(templateSource);
            return t.source === templateSource;
        })[0];
        if(cachedTemplate) return cachedTemplate.template;

        var template = this._createTemplate(templateSource);
        this._tempTemplates.push({ template: template, source: templateKey(templateSource) });
        return template;
    }

    // TEMPLATE BY OPTION

    getTemplateByOption(optionName) {
        return this.getTemplate(this.instanceGate.option(optionName));
    }

    // DISPOSE

    dispose() {
        this._tempTemplates.forEach(function(t) {
            t.template.dispose && t.template.dispose();
        });
        this._tempTemplates = [];
    }
}

module.exports = TemplatePlugin;
