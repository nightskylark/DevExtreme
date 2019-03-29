import ko from "knockout";
import iconUtils from "../../core/utils/icon";

ko.bindingHandlers.dxControlsDescendantBindings = {
    init: function(_, valueAccessor) {
        return {
            controlsDescendantBindings: ko.unwrap(valueAccessor())
        };
    }
};

ko.bindingHandlers.dxIcon = {
    init: function(element, valueAccessor) {
        var options = ko.utils.unwrapObservable(valueAccessor()) || {};
        var iconElement = iconUtils.getImageContainer(options);

        ko.virtualElements.emptyNode(element);
        if(iconElement) {
            ko.virtualElements.prepend(element, iconElement.get(0));
        }
    },
    update: function(element, valueAccessor) {
        var options = ko.utils.unwrapObservable(valueAccessor()) || {};
        var iconElement = iconUtils.getImageContainer(options);

        ko.virtualElements.emptyNode(element);
        if(iconElement) {
            ko.virtualElements.prepend(element, iconElement.get(0));
        }
    }
};
ko.virtualElements.allowedBindings.dxIcon = true;
