export function polyfillMutationObserver(): void
{
    if ((<any> window).MutationObserver) {
        return;
    }

    (<any> window).MutationObserver = (<any> window).WebKitMutationObserver;
}