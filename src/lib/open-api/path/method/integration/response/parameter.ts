/**
 * Created by EGomez on 3/15/17.
 */

export default class Parameter {
    private _header: string;

    get header(): string {
        return this._header;
    }

    set header(value: string) {
        this._header = value;
    }

    private _value: string;

    get value(): string {
        return this._value;
    }

    set value(value: string) {
        this._value = value;
    }

}
