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
            let matches = (this.document || this.ownerDocument).querySelectorAll(s);

            for (let i = 0; i < matches.length; i++) {
                if (matches.item(i) === this) {
                    return true;
                }
            }

            return false;
        });
}