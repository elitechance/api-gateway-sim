/**
 * Created by EGomez on 3/15/17.
 */

import PathMethodIntegrationResponseParameter from "./path-method-integration-response-parameter";

export default class PathMethodIntegrationResponse {
    private _pattern:string;
    private _statusCode:number;
    private _responseParameters:Array<PathMethodIntegrationResponseParameter> = [];
    private _baseHeaderName:string = 'method.response.header';

    get pattern(): string {
        return this._pattern;
    }

    set pattern(value: string) {
        this._pattern = value;
    }

    get statusCode(): number {
        return this._statusCode;
    }

    set statusCode(value: number) {
        this._statusCode = value;
    }

    get responseParameters(): Array<PathMethodIntegrationResponseParameter> {
        return this._responseParameters;
    }

    set responseParameters(value: Array<PathMethodIntegrationResponseParameter>) {
        this._responseParameters = value;
    }

    get baseHeaderName(): string {
        return this._baseHeaderName;
    }
}