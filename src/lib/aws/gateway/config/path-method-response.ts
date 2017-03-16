import PathMethodResponseStatus from "./path-method-response-status";
/**
 * Created by EGomez on 3/15/17.
 */

export default class PathMethodResponse {
    private _statusCode:number;
    private _description:string;
    private _schema:string;
    private _headers:Array<string> = [];


    get statusCode(): number {
        return this._statusCode;
    }

    set statusCode(value: number) {
        this._statusCode = value;
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