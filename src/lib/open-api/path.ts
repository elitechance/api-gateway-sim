/**
 * Created by EGomez on 3/15/17.
 */

import Method from './path/method';

export default class Path {
    private _pattern: string;

    get pattern(): string {
        return this._pattern;
    }

    set pattern(value: string) {
        this._pattern = value;
    }

    private _methods: Array<Method> = [];

    get methods(): Array<Method> {
        return this._methods;
    }

    set methods(value: Array<Method>) {
        this._methods = value;
    }
}
