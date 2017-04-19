/**
 * Created by EGomez on 3/15/17.
 */

import PathMethodIntegrationResponse from "./integration/response";
import PathMethodIntegrationResponseRequestTemplate from "./integration/response/request/template";

export default class Integration {
    private _responses:Array<PathMethodIntegrationResponse> = [];
    private _requestTemplates:Array<PathMethodIntegrationResponseRequestTemplate> = [];
    private _uri:string;
    private _passthroughBehavior:string;
    private _httpMethod:string;
    private _contentHandling:string;
    private _type:string;

    get defaultResponse(): PathMethodIntegrationResponse {
        let responses = this.responses;

        if (!responses) return null;

        let response:PathMethodIntegrationResponse;
        for (let index in responses) {
            response = responses[index];
            if (response.pattern == 'default') {
                return response;
            }
        }

        return null;
    }

    public getResponseByErrorMessage(errorMessage:string):PathMethodIntegrationResponse {
        let regularExpress:RegExp;
        let defaultResponse;
        for(let index in this.responses) {
            let response = this.responses[index];
            if (response.pattern == 'default') { defaultResponse = response; }
            regularExpress = new RegExp(response.pattern);
            if (errorMessage.match(regularExpress)) {
                return response;
            }
        }
        return defaultResponse;
    }

    get responses(): Array<PathMethodIntegrationResponse> {
        return this._responses;
    }

    set responses(value: Array<PathMethodIntegrationResponse>) {
        this._responses = value;
    }

    get requestTemplates(): Array<PathMethodIntegrationResponseRequestTemplate> {
        return this._requestTemplates;
    }

    set requestTemplates(value: Array<PathMethodIntegrationResponseRequestTemplate>) {
        this._requestTemplates = value;
    }

    get uri(): string {
        return this._uri;
    }

    set uri(value: string) {
        this._uri = value;
    }

    get passthroughBehavior(): string {
        return this._passthroughBehavior;
    }

    set passthroughBehavior(value: string) {
        this._passthroughBehavior = value;
    }

    get httpMethod(): string {
        return this._httpMethod;
    }

    set httpMethod(value: string) {
        this._httpMethod = value;
    }

    get contentHandling(): string {
        return this._contentHandling;
    }

    set contentHandling(value: string) {
        this._contentHandling = value;
    }

    get type(): string {
        return this._type;
    }

    set type(value: string) {
        this._type = value;
    }
}
