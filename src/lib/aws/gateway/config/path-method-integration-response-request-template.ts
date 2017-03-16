import PathMethodResponses from "./path-method-response";
/**
 * Created by EGomez on 3/15/17.
 */

export default class PathMethodIntegrationResponseRequestTemplate {
    private _contentType:string;
    private _template:string;

    get contentType(): string {
        return this._contentType;
    }

    set contentType(value: string) {
        this._contentType = value;
    }

    get template(): string {
        return this._template;
    }

    set template(value: string) {
        this._template = value;
    }
}