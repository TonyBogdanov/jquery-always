import {Bindings} from "./lib/Bindings";
import {Polyfills} from "./lib/Polyfills";

// polyfills
Polyfills.elementMatches();
Polyfills.mutationObserver();

// bindings
Bindings.native();
Bindings.jQuery();