"use strict";
(function ($) {
    var Always = (function () {
        function Always($element) {
            var _this = this;
            this.insertedCallbacks = {};
            this.removedCallbacks = {};
            this.$element = $element;
            (this.observer = new ('undefined' !== typeof MutationObserver ? MutationObserver : WebKitMutationObserver)(function (mutations) {
                mutations.forEach(function (mutation) {
                    if ('childList' !== mutation.type) {
                        return;
                    }
                    [].forEach.call(mutation.addedNodes, function (node) {
                        if (Node.ELEMENT_NODE !== node.nodeType) {
                            return;
                        }
                        _this.notifyInserted(node);
                    });
                    [].forEach.call(mutation.removedNodes, function (node) {
                        if (Node.ELEMENT_NODE !== node.nodeType) {
                            return;
                        }
                        _this.notifyRemoved(node);
                    });
                });
            })).observe(this.$element.get(0), {
                childList: true,
                subtree: true
            });
        }
        Always.attach = function ($element) {
            var instance = $element.data('jquery-always');
            if (!(instance instanceof Always)) {
                instance = new Always($element);
                $element.data('jquery-always', instance);
            }
            return instance;
        };
        Always.detach = function ($element) {
            Always.attach($element).observer.disconnect();
            return $element.removeData('jquery-always');
        };
        Always.normalizeSelector = function (selector) {
            return selector.split(',').map(function (part) {
                return part.trim();
            }).sort().join(',');
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
        Always.prototype.notifyInserted = function (node) {
            var _this = this;
            var $node = $(node), _ = this;
            Object.keys(this.insertedCallbacks).forEach(function (selector) {
                if ($node.is(selector)) {
                    _this.insertedCallbacks[selector].forEach(function (callback) {
                        callback.call(node);
                    });
                }
            });
            $node.children().each(function () {
                _.notifyInserted(this);
            });
            return this;
        };
        Always.prototype.notifyRemoved = function (node) {
            var _this = this;
            var $node = $(node), _ = this;
            $node.children().each(function () {
                _.notifyRemoved(this);
            });
            Object.keys(this.removedCallbacks).forEach(function (selector) {
                if ($node.is(selector)) {
                    _this.removedCallbacks[selector].forEach(function (callback) {
                        callback.call(node);
                    });
                }
            });
            return this;
        };
        return Always;
    }());
    $.extend($.fn, {
        always: function (selector, onInserted, onRemoved) {
            return $(this).each(function () {
                var $this = $(this), always = Always.attach($this);
                if ('function' === typeof onInserted) {
                    always.addInsertedCallback(selector, onInserted);
                    $this.find(selector).each(function () {
                        onInserted.call(this);
                    });
                }
                if ('function' === typeof onRemoved) {
                    always.addRemovedCallback(selector, onRemoved);
                }
            });
        },
        never: function (selector, onInserted, onRemoved) {
            return $(this).each(function () {
                var $this = $(this), always = Always.attach($this);
                if (!selector) {
                    Always.detach($this);
                    return;
                }
                if (!onInserted && !onRemoved) {
                    always.removeInsertedCallback(selector);
                    always.removeRemovedCallback(selector);
                    return;
                }
                if (onInserted) {
                    always.removeInsertedCallback(selector, onInserted);
                }
                if (onRemoved) {
                    always.removeRemovedCallback(selector, onRemoved);
                }
            });
        }
    });
})(jQuery);
