import {AlwaysData} from "./AlwaysData";

export class Always
{
    protected element: HTMLElement;
    protected observer: MutationObserver;
    protected insertedCallbacks: { [key: string]: ((this: HTMLElement) => void)[] } = {};
    protected removedCallbacks: { [key: string]: ((this: HTMLElement) => void)[] } = {};

    /**
     * Retrieve a jQuery Always specific data object assigned to the specified element, or create one if it does
     * not already exist.
     *
     * @param {HTMLElement} element
     * @returns {AlwaysData}
     */
    protected static data(element: HTMLElement): AlwaysData
    {
        if (!element.hasOwnProperty('jQueryAlways')) {
            Object.defineProperty(element, 'jQueryAlways', {
                value: new AlwaysData(),
                configurable: true
            });
        }

        return (<any> element).jQueryAlways;
    }

    /**
     * Attaches a new Always instance to the specified element and returns it, or returns a previously attached
     * instance.
     *
     * @param {HTMLElement} element
     * @returns {Always}
     */
    protected static attach(element: HTMLElement): Always
    {
        let data: AlwaysData = this.data(element);

        if (!data.instance) {
            data.instance = new Always(element);
        }

        return data.instance;
    }

    /**
     * Detaches a previously attached Always instance from the specified element & also removes the mutation
     * observer.
     *
     * @param {HTMLElement} element
     */
    protected static detach(element: HTMLElement): void
    {
        Always.attach(element).observer.disconnect();
        delete (<any> element).jQueryAlways;
    }

    /**
     * Normalizes similar selectors.
     * E.g. "a, b" and "b,a" are the same thing, both will be normalized to "a,b".
     *
     * @param {string} selector
     * @returns {string}
     */
    public static normalizeSelector(selector: string): string
    {
        return selector.split(',').map((part: string): string => {
            return part.trim();
        }).sort().join(',');
    }

    /**
     * Attaches the specified inserted / removed listeners for elements matching the specified selector on the
     * specified parent element.
     *
     * @param {HTMLElement} element
     * @param {string} selector
     * @param {() => void} onInserted
     * @param {() => void} onRemoved
     */
    public static always(
        element: HTMLElement,
        selector: string,
        onInserted?: (this: HTMLElement) => void,
        onRemoved?: (this: HTMLElement) => void
    ): void {
        let instance = Always.attach(element);

        // register inserted callbacks
        if ('function' === typeof onInserted) {
            instance.addInsertedCallback(selector, onInserted);

            [].forEach.call(element.querySelectorAll(selector), (node: HTMLElement) => {
                onInserted.call(node);
            });
        }

        // register removed callbacks
        if ('function' === typeof onRemoved) {
            instance.addRemovedCallback(selector, onRemoved);
        }
    }

    /**
     * Detaches the specified inserted / removed listener(s) for elements matching the specified selector on the
     * specified element as parent.
     *
     * @param {HTMLElement} element
     * @param {string} selector
     * @param {() => void} onInserted
     * @param {() => void} onRemoved
     */
    public static never(
        element: HTMLElement,
        selector?: string,
        onInserted?: (this: HTMLElement) => void,
        onRemoved?: (this: HTMLElement) => void
    ): void {
        // if no selector is specified, quickest way to remove all listeners is to just detach
        if (!selector) {
            Always.detach(element);
            return;
        }

        let instance = Always.attach(element);

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
        callbacks: { [key: string]: ((this: HTMLElement) => void)[] },
        selector: string,
        callback: (this: HTMLElement) => void
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
            for (let index = -1; -1 < (index = callbacks[selector].indexOf(callback));) {
                callbacks[selector].splice(index, 1);
            }
        } else {
            delete callbacks[selector];
        }

        return this;
    }

    /**
     * Notifies the specified callbacks for the specified operation on the specified element.
     * This is a convenience method for notifyInserted and notifyRemoved.
     *
     * @param {HTMLElement} element
     * @param {{[p: string]: (() => void)[]}} callbacks
     * @param {number} operation
     * @returns {Always}
     */
    protected notifyCallbacks(
        element: HTMLElement,
        callbacks: { [key: string]: ((this: HTMLElement) => void)[] },
        operation: number
    ): Always {
        // make the element manageable & prevent duplicate invocations
        // even making every single node in the Dom manageable is still much faster that matching it against a selector
        let data = Always.data(element);
        if (operation === data.lastOperation) {
            return this;
        }

        // traverse requested callbacks & invoke those for which the element matches the corresponding selector
        // also update the AlwaysData.lastOperation to prevent future duplicate invocations
        Object.keys(callbacks).forEach(selector => {
            if (element.matches(selector)) {
                callbacks[selector].forEach(callback => {
                    data.lastOperation = operation;
                    callback.call(element);
                });
            }
        });

        return this;
    }

    /**
     * Constructor.
     *
     * @param {HTMLElement} element
     */
    public constructor(element: HTMLElement)
    {
        this.element = element;
        this.observer = new MutationObserver(mutations => mutations.forEach(mutation => {
            if ('childList' !== mutation.type) {
                return;
            }

            // NodeList does not support forEach directly due to a bug in Google Chrome
            [].forEach.call(mutation.addedNodes, (node: Node) => {
                if (!(node instanceof HTMLElement)) {
                    return;
                }

                this.notifyInserted(node);
            });
            [].forEach.call(mutation.removedNodes, (node: Node) => {
                if (!(node instanceof HTMLElement)) {
                    return;
                }

                this.notifyRemoved(node);
            });
        }));

        this.observer.observe(this.element, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Notifies all registered callbacks about an insertion, if the corresponding selector matches the node.
     *
     * @param {HTMLElement} element
     * @returns {Always}
     */
    public notifyInserted(element: HTMLElement): Always
    {
        // callbacks for insertions are invoked for parents first
        this.notifyCallbacks(element, this.insertedCallbacks, AlwaysData.OPERATION_INSERTION);

        // we need to manually cascade notify all child nodes as the observer won't do it automatically
        [].forEach.call(element.children, (node: HTMLElement) => {
            this.notifyInserted(node);
        });

        return this;
    }

    /**
     * Notifies all registered callbacks about a removal, if the corresponding selector matches the node.
     *
     * @param {HTMLElement} element
     * @returns {Always}
     */
    public notifyRemoved(element: HTMLElement): Always
    {
        // we need to manually cascade notify all child nodes as the observer won't do it automatically
        [].forEach.call(element.children, (node: HTMLElement) => {
            this.notifyRemoved(node);
        });

        // callbacks for removals are invoked for deepest children first
        this.notifyCallbacks(element, this.removedCallbacks, AlwaysData.OPERATION_REMOVAL);

        return this;
    }

    /**
     * Adds a new inserted callback for the specified selector.
     *
     * @param {string} selector
     * @param {() => void} callback
     * @returns {Always}
     */
    public addInsertedCallback(selector: string, callback: (this: HTMLElement) => void): Always
    {
        return this.addCallback(this.insertedCallbacks, selector, callback);
    }

    /**
     * Adds a new removed callback for the specified selector.
     *
     * @param {string} selector
     * @param {() => void} callback
     * @returns {Always}
     */
    public addRemovedCallback(selector: string, callback: (this: HTMLElement) => void): Always
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
    public removeInsertedCallback(selector: string, callback?: (this: HTMLElement) => void): Always
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
    public removeRemovedCallback(selector: string, callback?: (this: HTMLElement) => void): Always
    {
        return this.removeCallback(this.removedCallbacks, selector, callback);
    }
}