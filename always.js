(function (jQuery) {
'use strict';

jQuery = jQuery && jQuery.hasOwnProperty('default') ? jQuery['default'] : jQuery;

var AlwaysData = (function () {
    function AlwaysData() {
    }
    AlwaysData.OPERATION_INSERTION = 0;
    AlwaysData.OPERATION_REMOVAL = 1;
    return AlwaysData;
}());

var Always = (function () {
    function Always(element) {
        var _this = this;
        this.insertedCallbacks = {};
        this.removedCallbacks = {};
        this.element = element;
        this.observer = new MutationObserver(function (mutations) { return mutations.forEach(function (mutation) {
            if ('childList' !== mutation.type) {
                return;
            }
            [].forEach.call(mutation.addedNodes, function (node) {
                if (!(node instanceof HTMLElement)) {
                    return;
                }
                _this.notifyInserted(node);
            });
            [].forEach.call(mutation.removedNodes, function (node) {
                if (!(node instanceof HTMLElement)) {
                    return;
                }
                _this.notifyRemoved(node);
            });
        }); });
        this.observer.observe(this.element, {
            childList: true,
            subtree: true
        });
    }
    Always.data = function (element) {
        if (!element.hasOwnProperty('jQueryAlways')) {
            Object.defineProperty(element, 'jQueryAlways', {
                value: new AlwaysData(),
                configurable: true
            });
        }
        return element.jQueryAlways;
    };
    Always.attach = function (element) {
        var data = this.data(element);
        if (!data.instance) {
            data.instance = new Always(element);
        }
        return data.instance;
    };
    Always.detach = function (element) {
        Always.attach(element).observer.disconnect();
        delete element.jQueryAlways;
    };
    Always.normalizeSelector = function (selector) {
        return selector.split(',').map(function (part) {
            return part.trim();
        }).sort().join(',');
    };
    Always.always = function (element, selector, onInserted, onRemoved) {
        var instance = Always.attach(element);
        if ('function' === typeof onInserted) {
            instance.addInsertedCallback(selector, onInserted);
            [].forEach.call(element.querySelectorAll(selector), function (node) {
                onInserted.call(node);
            });
        }
        if ('function' === typeof onRemoved) {
            instance.addRemovedCallback(selector, onRemoved);
        }
    };
    Always.never = function (element, selector, onInserted, onRemoved) {
        if (!selector) {
            Always.detach(element);
            return;
        }
        var instance = Always.attach(element);
        if (!onInserted && !onRemoved) {
            instance.removeInsertedCallback(selector);
            instance.removeRemovedCallback(selector);
            return;
        }
        if (onInserted) {
            instance.removeInsertedCallback(selector, onInserted);
        }
        if (onRemoved) {
            instance.removeRemovedCallback(selector, onRemoved);
        }
    };
    Always.prototype.addCallback = function (callbacks, selector, callback) {
        selector = Always.normalizeSelector(selector);
        if (!callbacks.hasOwnProperty(selector)) {
            callbacks[selector] = [];
        }
        callbacks[selector].push(callback);
        return this;
    };
    Always.prototype.removeCallback = function (callbacks, selector, callback) {
        selector = Always.normalizeSelector(selector);
        if (!callbacks.hasOwnProperty(selector)) {
            return this;
        }
        if (callback) {
            var index = void 0;
            while (-1 < (index = callbacks[selector].indexOf(callback))) {
                callbacks[selector].splice(index, 1);
            }
        }
        else {
            delete callbacks[selector];
        }
        return this;
    };
    Always.prototype.notifyInserted = function (element) {
        var _this = this;
        var data = Always.data(element);
        if (AlwaysData.OPERATION_INSERTION === data.lastOperation) {
            return this;
        }
        data.lastOperation = AlwaysData.OPERATION_INSERTION;
        Object.keys(this.insertedCallbacks).forEach(function (selector) {
            if (element.matches(selector)) {
                _this.insertedCallbacks[selector].forEach(function (callback) {
                    callback.call(element);
                });
            }
        });
        [].forEach.call(element.querySelectorAll('*'), function (node) {
            _this.notifyInserted(node);
        });
        return this;
    };
    Always.prototype.notifyRemoved = function (element) {
        var _this = this;
        var data = Always.data(element);
        if (AlwaysData.OPERATION_REMOVAL === data.lastOperation) {
            return this;
        }
        data.lastOperation = AlwaysData.OPERATION_REMOVAL;
        [].forEach.call(element.querySelectorAll('*'), function (node) {
            _this.notifyRemoved(node);
        });
        Object.keys(this.removedCallbacks).forEach(function (selector) {
            if (element.matches(selector)) {
                _this.removedCallbacks[selector].forEach(function (callback) {
                    callback.call(element);
                });
            }
        });
        return this;
    };
    Always.prototype.addInsertedCallback = function (selector, callback) {
        return this.addCallback(this.insertedCallbacks, selector, callback);
    };
    Always.prototype.addRemovedCallback = function (selector, callback) {
        return this.addCallback(this.removedCallbacks, selector, callback);
    };
    Always.prototype.removeInsertedCallback = function (selector, callback) {
        return this.removeCallback(this.insertedCallbacks, selector, callback);
    };
    Always.prototype.removeRemovedCallback = function (selector, callback) {
        return this.removeCallback(this.removedCallbacks, selector, callback);
    };
    return Always;
}());

function bindingNative() {
    window.Always = {
        always: Always.always,
        never: Always.never
    };
}

function bindingJQuery() {
    if ('undefined' === typeof jQuery) {
        return;
    }
    (function ($) {
        $.extend($.fn, {
            always: function (selector, onInserted, onRemoved) {
                return $(this).each(function () {
                    Always.always(this, selector, onInserted, onRemoved);
                });
            },
            never: function (selector, onInserted, onRemoved) {
                return $(this).each(function () {
                    Always.never(this, selector, onInserted, onRemoved);
                });
            }
        });
    })(jQuery);
}

var Bindings = (function () {
    function Bindings() {
    }
    Bindings.native = bindingNative;
    Bindings.jQuery = bindingJQuery;
    return Bindings;
}());

function polyfillMutationObserver() {
    if (window.MutationObserver) {
        return;
    }
    window.MutationObserver = window.WebKitMutationObserver;
}

function polyfillElementMatches() {
    var _this = this;
    var prototype = Element.prototype;
    if (prototype.matches) {
        return;
    }
    prototype.matches =
        prototype.matchesSelector ||
            prototype.mozMatchesSelector ||
            prototype.msMatchesSelector ||
            prototype.oMatchesSelector ||
            prototype.webkitMatchesSelector ||
            (function (s) {
                var matches = (_this.document || _this.ownerDocument).querySelectorAll(s), i = matches.length;
                while (--i >= 0 && matches.item(i) !== _this) { }
                return i > -1;
            });
}

var Polyfills = (function () {
    function Polyfills() {
    }
    Polyfills.elementMatches = polyfillElementMatches;
    Polyfills.mutationObserver = polyfillMutationObserver;
    return Polyfills;
}());

Polyfills.elementMatches();
Polyfills.mutationObserver();
Bindings.native();
Bindings.jQuery();

}(jQuery));
