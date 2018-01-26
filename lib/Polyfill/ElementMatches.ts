export function polyfillElementMatches(): void
{
    let prototype = <any> Element.prototype;

    if (prototype.matches) {
        return;
    }

    prototype.matches =
        prototype.matchesSelector ||
        prototype.mozMatchesSelector ||
        prototype.msMatchesSelector ||
        prototype.oMatchesSelector ||
        prototype.webkitMatchesSelector ||
        ((s: string): boolean => {
            let matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;

            while (--i >= 0 && matches.item(i) !== this) {}

            return i > -1;
        });
}