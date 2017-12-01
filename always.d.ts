interface WebKitMutationObserver extends MutationObserver {
}
interface JQuery {
    always(selector: string, onInserted?: (this: Element) => void, onRemoved?: (this: Element) => void): JQuery;
    never(selector?: string, onInserted?: (this: Element) => void, onRemoved?: (this: Element) => void): JQuery;
}
declare var WebKitMutationObserver: {
    prototype: MutationObserver;
    new (callback: MutationCallback): MutationObserver;
};
