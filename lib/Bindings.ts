import {bindingNative} from "./Binding/Native";
import {bindingJQuery} from "./Binding/JQuery";

export class Bindings
{
    static native = bindingNative;
    static jQuery = bindingJQuery;
}