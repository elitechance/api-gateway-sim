/**
 * Created by EGomez on 3/15/17.
 */

import PathMethodResponse from './method/response';
import PathMethodIntegration from './method/integration';

export default class Method {
    private _name: string;

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    private _consumes: Array<string>;

    get consumes(): Array<string> {
        return this._consumes;
    }

    set consumes(value: Array<string>) {
        this._consumes = value;
    }

    private _produces: Array<string>;

    get produces(): Array<string> {
        return this._produces;
    }

    set produces(value: Array<string>) {
        this._produces = value;
    }

    private _responses: Array<PathMethodResponse> = [];

    get responses(): Array<PathMethodResponse> {
        return this._responses;
    }

    set responses(value: Array<PathMethodResponse>) {
        this._responses = value;
    }

    private _integration: PathMethodIntegration;

    get integration(): PathMethodIntegration {
        return this._integration;
    }

    set integration(value: PathMethodIntegration) {
        this._integration = value;
    }

    canConsume(contentType: string): boolean {
        for (const index in this.consumes) {
            if (this.consumes[index] == contentType) {
                return true;
            }
        }
        return false;
    }
}
