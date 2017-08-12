/**
 * Created by EGomez on 3/15/17.
 */

import PathMethodIntegrationResponseParameter from './response/parameter';

export default class Response {
    private _pattern: string;

    get pattern(): string {
        return this._pattern;
    }

    set pattern(value: string) {
        this._pattern = value;
    }

    private _statusCode: number;

    get statusCode(): number {
        return this._statusCode;
    }

    set statusCode(value: number) {
        this._statusCode = value;
    }

    private _responseParameters: Array<PathMethodIntegrationResponseParameter> = [];

    get responseParameters(): Array<PathMethodIntegrationResponseParameter> {
        return this._responseParameters;
    }

    set responseParameters(value: Array<PathMethodIntegrationResponseParameter>) {
        this._responseParameters = value;
    }

    private _baseHeaderName = 'method.response.header';

    get baseHeaderName(): string {
        return this._baseHeaderName;
    }
}
