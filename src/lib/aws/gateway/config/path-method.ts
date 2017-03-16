/**
 * Created by EGomez on 3/15/17.
 */

import PathMethodResponse from "./path-method-response";
import PathMethodIntegration from "./path-method-integration";

export default class PathMethod {
    private _name:string;
    private _consumes:Array<string>;
    private _produces:Array<string>;
    private _responses:Array<PathMethodResponse> = [];
    private _integration:PathMethodIntegration;

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get consumes(): Array<string> {
        return this._consumes;
    }

    set consumes(value: Array<string>) {
        this._consumes = value;
    }

    get produces(): Array<string> {
        return this._produces;
    }

    set produces(value: Array<string>) {
        this._produces = value;
    }

    get responses(): Array<PathMethodResponse> {
        return this._responses;
    }

    set responses(value: Array<PathMethodResponse>) {
        this._responses = value;
    }

    get integration(): PathMethodIntegration {
        return this._integration;
    }

    set integration(value: PathMethodIntegration) {
        this._integration = value;
    }
}