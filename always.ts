import {Bindings} from "./lib/Bindings";
import {Polyfills} from "./lib/Polyfills";

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