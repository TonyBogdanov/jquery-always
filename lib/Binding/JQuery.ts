import jQuery from "jquery";
import {Always} from "../Always";

export function bindingJQuery()
{
    if ('undefined' === typeof jQuery) {
        return;
    }

    ($ => {
        $.extend($.fn, {
            always: function (
                selector: string,
                onInserted?: (this: HTMLElement) => void,
                onRemoved?: (this: HTMLElement) => void
            ): jQuery {
                return $(this).each(function () {
                    Always.always(this, selector, onInserted, onRemoved);
                });
            },
            never: function (
                selector: string,
                onInserted?: (this: HTMLElement) => void,
                onRemoved?: (this: HTMLElement) => void
            ): jQuery {
                return $(this).each(function () {
                    Always.never(this, selector, onInserted, onRemoved);
                });
            }
        });
    })(jQuery);
}