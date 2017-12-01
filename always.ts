// explicit declarations to stop the compiler for complaining about unrecognized names
// this will not change the JS output in any way
interface WebKitMutationObserver extends MutationObserver {
}

interface JQuery {
    always(selector: string, onInserted?: (this: Element) => void, onRemoved?: (this: Element) => void): JQuery;
    never(selector?: string, onInserted?: (this: Element) => void, onRemoved?: (this: Element) => void): JQuery;
}

declare var WebKitMutationObserver: {
    prototype: MutationObserver;
    new(callback: MutationCallback): MutationObserver;
};

// jQuery scope
($ => {

    /**
     * Private class, thus no definitions.
     */
    class Always
    {
        protected $element: JQuery;
        protected observer: MutationObserver;
        protected insertedCallbacks: { [key: string]: ((this: Element) => void)[] } = {};
        protected removedCallbacks: { [key: string]: ((this: Element) => void)[] } = {};

        /**
         * Attaches a new instance to the specified element and returns it, or returns a previously attached instance.
         *
         * @param {JQuery} $element
         * @returns {Always}
         */
        static attach($element: JQuery): Always
        {
            let instance = $element.data('jquery-always');

            if (!(instance instanceof Always)) {
                instance = new Always($element);
                $element.data('jquery-always', instance);
            }

            return instance;
        }

        /**
         * Detaches a previously attached instance from the specified element & also removes the mutation observer.
         *
         * @param {JQuery} $element
         * @returns {JQuery}
         */
        static detach($element: JQuery): JQuery
        {
            Always.attach($element).observer.disconnect();
            return $element.removeData('jquery-always');
        }

        /**
         * Normalizes similar selectors.
         * E.g. "a, b" and "b,a" are the same thing, both will be normalized to "a,b".
         *
         * @param {string} selector
         * @returns {string}
         */
        static normalizeSelector(selector: string): string
        {
            return selector.split(',').map((part: string): string => {
                return part.trim();
            }).sort().join(',');
        }

        /**
         * Adds a new callback for the specified selector.
         *
         * @param {{[p: string]: (() => void)[]}} callbacks
         * @param {string} selector
         * @param {() => void} callback
         * @returns {Always}
         */
        protected addCallback(
            callbacks: { [key: string]: ((this: Element) => void)[] },
            selector: string,
            callback: (this: Element) => void
        ): Always {
            selector = Always.normalizeSelector(selector);

            if (!callbacks.hasOwnProperty(selector)) {
                callbacks[selector] = [];
            }
            callbacks[selector].push(callback);

            return this;
        }

        /**
         * Removes the specified callback for the specified selector.
         * If no callback is specified, removes all callbacks for the selector.
         *
         * @param {{[p: string]: (() => void)[]}} callbacks
         * @param {string} selector
         * @param {() => void} callback
         * @returns {Always}
         */
        protected removeCallback(
            callbacks: { [key: string]: ((this: Element) => void)[] },
            selector: string,
            callback?: (this: Element) => void
        ): Always {
            selector = Always.normalizeSelector(selector);

            if (!callbacks.hasOwnProperty(selector)) {
                return this;
            }

            if (callback) {
                let index;
                while (-1 < (index = callbacks[selector].indexOf(callback))) {
                    callbacks[selector].splice(index, 1);
                }
            } else {
                delete callbacks[selector];
            }

            return this;
        }

        /**
         * Constructor.
         *
         * @param {JQuery} $element
         */
        constructor($element: JQuery)
        {
            this.$element = $element;
            (this.observer = new ('undefined' !== typeof MutationObserver ? MutationObserver : WebKitMutationObserver)
            (mutations => {
                mutations.forEach(mutation => {
                    if ('childList' !== mutation.type) {
                        return;
                    }

                    // NodeList does not support forEach directly due to a bug in Google Chrome
                    [].forEach.call(mutation.addedNodes, (node: Node) => {
                        if (Node.ELEMENT_NODE !== node.nodeType) {
                            return;
                        }

                        this.notifyInserted(node);
                    });
                    [].forEach.call(mutation.removedNodes, (node: Node) => {
                        if (Node.ELEMENT_NODE !== node.nodeType) {
                            return;
                        }

                        this.notifyRemoved(node);
                    });
                })
            })).observe(this.$element.get(0), {
                childList: true,
                subtree: true
            });
        }

        /**
         * Adds a new inserted callback for the specified selector.
         *
         * @param {string} selector
         * @param {() => any} callback
         * @returns {Always}
         */
        addInsertedCallback(selector: string, callback: (this: Element) => void): Always
        {
            return this.addCallback(this.insertedCallbacks, selector, callback);
        }

        /**
         * Adds a new removed callback for the specified selector.
         *
         * @param {string} selector
         * @param {() => any} callback
         * @returns {Always}
         */
        addRemovedCallback(selector: string, callback: (this: Element) => void): Always
        {
            return this.addCallback(this.removedCallbacks, selector, callback);
        }

        /**
         * Removes the specified inserted callback for the specified selector.
         * If no callback is specified, removes all callbacks for the selector.
         *
         * @param {string} selector
         * @param {() => void} callback
         * @returns {Always}
         */
        removeInsertedCallback(selector: string, callback?: (this: Element) => void): Always
        {
            return this.removeCallback(this.insertedCallbacks, selector, callback);
        }

        /**
         * Removes the specified removed callback for the specified selector.
         * If no callback is specified, removes all callbacks for the selector.
         *
         * @param {string} selector
         * @param {() => void} callback
         * @returns {Always}
         */
        removeRemovedCallback(selector: string, callback?: (this: Element) => void): Always
        {
            return this.removeCallback(this.removedCallbacks, selector, callback);
        }

        /**
         * Notifies all registered callbacks about an insertion, if the corresponding selector matches the node.
         *
         * @param {Node} node
         * @returns {Always}
         */
        notifyInserted(node: Node): Always
        {
            let $node = $(node),
                _ = this;

            Object.keys(this.insertedCallbacks).forEach(selector => {
                if ($node.is(selector)) {
                    this.insertedCallbacks[selector].forEach(callback => {
                        callback.call(node);
                    });
                }
            });

            // we need to manually cascade notify all child nodes as the observer won't do it automatically
            $node.children().each(function () {
                _.notifyInserted(this);
            });

            return this;
        }

        /**
         * Notifies all registered callbacks about a removal, if the corresponding selector matches the node.
         *
         * @param {Node} node
         * @returns {Always}
         */
        notifyRemoved(node: Node): Always
        {
            let $node = $(node),
                _ = this;

            // we need to manually cascade notify all child nodes as the observer won't do it automatically
            $node.children().each(function () {
                _.notifyRemoved(this);
            });

            Object.keys(this.removedCallbacks).forEach(selector => {
                if ($node.is(selector)) {
                    this.removedCallbacks[selector].forEach(callback => {
                        callback.call(node);
                    });
                }
            });

            return this;
        }
    }

    /**
     * Extend jQuery.
     */
    $.extend($.fn, {
        always: function (selector: string, onInserted?: (this: Element) => void, onRemoved?: (this: Element) => void): JQuery {
            return $(this).each(function () {
                let $this = $(this),
                    always = Always.attach($this);

                // register inserted callbacks
                if ('function' === typeof onInserted) {
                    always.addInsertedCallback(selector, onInserted);

                    // notify inserted callbacks right away for elements already in the DOM
                    $this.find(selector).each(function () {
                        onInserted.call(this);
                    });
                }

                // register removed callbacks
                if ('function' === typeof onRemoved) {
                    always.addRemovedCallback(selector, onRemoved);
                }
            });
        },

        never: function (selector?: string, onInserted?: (this: Element) => void, onRemoved?: (this: Element) => void): JQuery {
            return $(this).each(function () {
                let $this = $(this),
                    always = Always.attach($this);

                // if no selector is specified, quickest way to remove all listeners is to just detach
                if (!selector) {
                    Always.detach($this);
                    return;
                }

                // if no specific callback is requested, remove all listeners that match the selector
                if (!onInserted && !onRemoved) {
                    always.removeInsertedCallback(selector);
                    always.removeRemovedCallback(selector);
                    return;
                }

                // remove only specific listeners
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