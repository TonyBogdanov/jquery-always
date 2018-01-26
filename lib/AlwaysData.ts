import {Always} from "./Always";

export class AlwaysData
{
    static readonly OPERATION_INSERTION: number = 0;
    static readonly OPERATION_REMOVAL: number = 1;

    public instance: Always;
    public lastOperation: number;
}