/**
 * Created by EGomez on 3/15/17.
 */

import PathMethodIntegrationResponse from './integration/response';
import PathMethodIntegrationResponseRequestTemplate from './integration/response/request/template';

export default class Integration {
    private _responses: Array<PathMethodIntegrationResponse> = [];

    get responses(): Array<PathMethodIntegrationResponse> {
        return this._responses;
    }

    set responses(value: Array<PathMethodIntegrationResponse>) {
        this._responses = value;
    }

    private _requestTemplates: Array<PathMethodIntegrationResponseRequestTemplate> = [];

    get requestTemplates(): Array<PathMethodIntegrationResponseRequestTemplate> {
        return this._requestTemplates;
    }

    set requestTemplates(value: Array<PathMethodIntegrationResponseRequestTemplate>) {
        this._requestTemplates = value;
    }

    private _uri: string;

    get uri(): string {
        return this._uri;
    }

    set uri(value: string) {
        this._uri = value;
    }

    private _passthroughBehavior: string;

    get passthroughBehavior(): string {
        return this._passthroughBehavior;
    }

    set passthroughBehavior(value: string) {
        this._passthroughBehavior = value;
    }

    private _httpMethod: string;

    get httpMethod(): string {
        return this._httpMethod;
    }

    set httpMethod(value: string) {
        this._httpMethod = value;
    }

    private _contentHandling: string;

    get contentHandling(): string {
        return this._contentHandling;
    }

    set contentHandling(value: string) {
        this._contentHandling = value;
    }

    private _type: string;

    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
    }

    get defaultResponse(): PathMethodIntegrationResponse {
        const responses = this.responses;

        if (!responses) {
            return null;
        }

        let response: PathMethodIntegrationResponse;
        for (const respons of responses) {
            response = respons;
            if (response.pattern === 'default') {
                return response;
            }
        }

        return null;
    }

    public getResponseByErrorMessage(errorMessage: string): PathMethodIntegrationResponse {
        let regularExpress: RegExp;
        let defaultResponse;
        for (const respons of this.responses) {
            const response = respons;
            if (response.pattern === 'default') {
                defaultResponse = response;
            }
            regularExpress = new RegExp(response.pattern);
            if (errorMessage.match(regularExpress)) {
                return response;
            }
        }
        return defaultResponse;
    }
}
