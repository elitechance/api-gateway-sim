/**
 * Created by EGomez on 3/15/17.
 */

import PathMethod from "./path-method";

export default class Path {
    private _value:string;
    private _methods:Array<PathMethod> = [];

    get value(): string {
        return this._value;
    }

    set value(value: string) {
        this._value = value;
    }

    get methods(): Array<PathMethod> {
        return this._methods;
    }

    set methods(value: Array<PathMethod>) {
        this._methods = value;
    }
}