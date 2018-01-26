export function polyfillMutationObserver(): void
{
    /** global: MutationObserver */
    /** global: WebKitMutationObserver */

    if ((<any> window).MutationObserver) {
        return;
    }

    (<any> window).MutationObserver = (<any> window).WebKitMutationObserver;
}