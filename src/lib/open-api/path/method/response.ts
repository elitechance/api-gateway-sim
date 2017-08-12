import PathMethodResponseStatus from './response/status';

/**
 * Created by EGomez on 3/15/17.
 */

export default class Response {
    private _statusCode: number;

    get statusCode(): number {
        return this._statusCode;
    }

    set statusCode(value: number) {
        this._statusCode = value;
    }

    private _description: string;

    get description(): string {
        return this._description;
    }

    set description(value: string) {
        this._description = value;
    }

    private _schema: string;

    get schema(): string {
        return this._schema;
    }

    set schema(value: string) {
        this._schema = value;
    }

    private _headers: Array<string> = [];

    get headers(): Array<string> {
        return this._headers;
    }

    set headers(value: Array<string>) {
        this._headers = value;
    }
}
