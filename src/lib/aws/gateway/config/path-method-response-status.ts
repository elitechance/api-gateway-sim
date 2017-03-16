/**
 * Created by EGomez on 3/15/17.
 */

export default class PathMethodResponseStatus {
    private _status:number;
    private _description:string;
    private _schema:string;
    private _headers:Array<string>;

    get status(): number {
        return this._status;
    }

    set status(value: number) {
        this._status = value;
    }

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    get schema(): string {
        return this._schema;
    }

    set schema(value: string) {
        this._schema = value;
    }

    get headers(): Array<string> {
        return this._headers;
    }

    set headers(value: Array<string>) {
        this._headers = value;
    }
}