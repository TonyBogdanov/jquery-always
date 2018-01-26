import {polyfillMutationObserver} from "./Polyfill/MutationObserver";
import {polyfillElementMatches} from "./Polyfill/ElementMatches";

export class Polyfills
{
    static elementMatches = polyfillElementMatches;
    static mutationObserver = polyfillMutationObserver;
}