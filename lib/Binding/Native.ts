import {Always} from "../Always";

export function bindingNative()
{
    (<any> window).Always = {
        always: Always.always,
        never: Always.never
    };
}