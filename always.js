(function (jQuery) {
'use strict';

jQuery = jQuery && jQuery.hasOwnProperty('default') ? jQuery['default'] : jQuery;

var AlwaysData = /** @class */ (function () {
    function AlwaysData() {
    }
    AlwaysData.OPERATION_INSERTION = 0;
    AlwaysData.OPERATION_REMOVAL = 1;
    return AlwaysData;
}());

var Always = /** @class */ (function () {
    /**
     * Constructor.
     *
     * @param {HTMLElement} element
     */
    function Always(element) {
        var _this = this;
        this.insertedCallbacks = {};
        this.removedCallbacks = {};
        this.element = element;
        this.observer = new MutationObserver(function (mutations) { return mutations.forEach(function (mutation) {
            if ('childList' !== mutation.type) {
                return;
            }
            // NodeList does not support forEach directly due to a bug in Google Chrome
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
    /**
     * Retrieve a jQuery Always specific data object assigned to the specified element, or create one if it does
     * not already exist.
     *
     * @param {HTMLElement} element
     * @returns {AlwaysData}
     */
    Always.data = function (element) {
        if (!element.hasOwnProperty('jQueryAlways')) {
            Object.defineProperty(element, 'jQueryAlways', {
                value: new AlwaysData(),
                configurable: true
            });
        }
        return element.jQueryAlways;
    };
    /**
     * Attaches a new Always instance to the specified element and returns it, or returns a previously attached
     * instance.
     *
     * @param {HTMLElement} element
     * @returns {Always}
     */
    Always.attach = function (element) {
        var data = this.data(element);
        if (!data.instance) {
            data.instance = new Always(element);
        }
        return data.instance;
    };
    /**
     * Detaches a previously attached Always instance from the specified element & also removes the mutation
     * observer.
     *
     * @param {HTMLElement} element
     */
    Always.detach = function (element) {
        Always.attach(element).observer.disconnect();
        delete element.jQueryAlways;
    };
    /**
     * Normalizes similar selectors.
     * E.g. "a, b" and "b,a" are the same thing, both will be normalized to "a,b".
     *
     * @param {string} selector
     * @returns {string}
     */
    Always.normalizeSelector = function (selector) {
        return selector.split(',').map(function (part) {
            return part.trim();
        }).sort().join(',');
    };
    /**
     * Attaches the specified inserted / removed listeners for elements matching the specified selector on the
     * specified parent element.
     *
     * @param {HTMLElement} element
     * @param {string} selector
     * @param {() => void} onInserted
     * @param {() => void} onRemoved
     */
    Always.always = function (element, selector, onInserted, onRemoved) {
        var instance = Always.attach(element);
        // register inserted callbacks
        if ('function' === typeof onInserted) {
            instance.addInsertedCallback(selector, onInserted);
            [].forEach.call(element.querySelectorAll(selector), function (node) {
                onInserted.call(node);
            });
        }
        // register removed callbacks
        if ('function' === typeof onRemoved) {
            instance.addRemovedCallback(selector, onRemoved);
        }
    };
    /**
     * Detaches the specified inserted / removed listener(s) for elements matching the specified selector on the
     * specified element as parent.
     *
     * @param {HTMLElement} element
     * @param {string} selector
     * @param {() => void} onInserted
     * @param {() => void} onRemoved
     */
    Always.never = function (element, selector, onInserted, onRemoved) {
        // if no selector is specified, quickest way to remove all listeners is to just detach
        if (!selector) {
            Always.detach(element);
            return;
        }
        var instance = Always.attach(element);
        // if no specific callback is requested, remove all listeners that match the selector
        if (!onInserted && !onRemoved) {
            instance.removeInsertedCallback(selector);
            instance.removeRemovedCallback(selector);
            return;
        }
        // remove only specific listeners
        if (onInserted) {
            instance.removeInsertedCallback(selector, onInserted);
        }
        if (onRemoved) {
            instance.removeRemovedCallback(selector, onRemoved);
        }
    };
    /**
     * Adds a new callback for the specified selector.
     *
     * @param {{[p: string]: (() => void)[]}} callbacks
     * @param {string} selector
     * @param {() => void} callback
     * @returns {Always}
     */
    Always.prototype.addCallback = function (callbacks, selector, callback) {
        selector = Always.normalizeSelector(selector);
        if (!callbacks.hasOwnProperty(selector)) {
            callbacks[selector] = [];
        }
        callbacks[selector].push(callback);
        return this;
    };
    /**
     * Removes the specified callback for the specified selector.
     * If no callback is specified, removes all callbacks for the selector.
     *
     * @param {{[p: string]: (() => void)[]}} callbacks
     * @param {string} selector
     * @param {() => void} callback
     * @returns {Always}
     */
    Always.prototype.removeCallback = function (callbacks, selector, callback) {
        selector = Always.normalizeSelector(selector);
        if (!callbacks.hasOwnProperty(selector)) {
            return this;
        }
        if (callback) {
            for (var index = -1; -1 < (index = callbacks[selector].indexOf(callback));) {
                callbacks[selector].splice(index, 1);
            }
        }
        else {
            delete callbacks[selector];
        }
        return this;
    };
    /**
     * Notifies all registered callbacks about an insertion, if the corresponding selector matches the node.
     *
     * @param {HTMLElement} element
     * @returns {Always}
     */
    Always.prototype.notifyInserted = function (element) {
        var _this = this;
        // ignore duplicate invocations
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
        // we need to manually cascade notify all child nodes as the observer won't do it automatically
        [].forEach.call(element.querySelectorAll('*'), function (node) {
            _this.notifyInserted(node);
        });
        return this;
    };
    /**
     * Notifies all registered callbacks about a removal, if the corresponding selector matches the node.
     *
     * @param {HTMLElement} element
     * @returns {Always}
     */
    Always.prototype.notifyRemoved = function (element) {
        var _this = this;
        // ignore duplicate invocations
        var data = Always.data(element);
        if (AlwaysData.OPERATION_REMOVAL === data.lastOperation) {
            return this;
        }
        data.lastOperation = AlwaysData.OPERATION_REMOVAL;
        // we need to manually cascade notify all child nodes as the observer won't do it automatically
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
    /**
     * Adds a new inserted callback for the specified selector.
     *
     * @param {string} selector
     * @param {() => void} callback
     * @returns {Always}
     */
    Always.prototype.addInsertedCallback = function (selector, callback) {
        return this.addCallback(this.insertedCallbacks, selector, callback);
    };
    /**
     * Adds a new removed callback for the specified selector.
     *
     * @param {string} selector
     * @param {() => void} callback
     * @returns {Always}
     */
    Always.prototype.addRemovedCallback = function (selector, callback) {
        return this.addCallback(this.removedCallbacks, selector, callback);
    };
    /**
     * Removes the specified inserted callback for the specified selector.
     * If no callback is specified, removes all callbacks for the selector.
     *
     * @param {string} selector
     * @param {() => void} callback
     * @returns {Always}
     */
    Always.prototype.removeInsertedCallback = function (selector, callback) {
        return this.removeCallback(this.insertedCallbacks, selector, callback);
    };
    /**
     * Removes the specified removed callback for the specified selector.
     * If no callback is specified, removes all callbacks for the selector.
     *
     * @param {string} selector
     * @param {() => void} callback
     * @returns {Always}
     */
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

var Bindings = /** @class */ (function () {
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
                var matches = (_this.document || _this.ownerDocument).querySelectorAll(s);
                for (var i = 0; i < matches.length; i++) {
                    if (matches.item(i) === _this) {
                        return true;
                    }
                }
                return false;
            });
}

var Polyfills = /** @class */ (function () {
    function Polyfills() {
    }
    Polyfills.elementMatches = polyfillElementMatches;
    Polyfills.mutationObserver = polyfillMutationObserver;
    return Polyfills;
}());

/** global: Element */
/** global: HTMLElement */
/** global: MutationObserver */
/** global: WebKitMutationObserver */
// polyfills
Polyfills.elementMatches();
Polyfills.mutationObserver();
// bindings
Bindings.native();
Bindings.jQuery();

}(jQuery));
