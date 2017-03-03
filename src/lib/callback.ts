/**
 * Created by EGomez on 3/2/17.
 */
import express = require('express');
import Request = express.Request;
import Response = express.Response;

export default class Callback {
    private _path;
    private _method;
    private _request:Request;
    private _response:Response;
    private _apiConfigJson;

    get request(): Request {
        return this._request;
    }

    set request(value: Request) {
        this._request = value;
    }

    get response(): Response {
        return this._response;
    }

    set response(value: Response) {
        this._response = value;
    }

    get apiConfigJson() {
        return this._apiConfigJson;
    }

    set apiConfigJson(value) {
        this._apiConfigJson = value;
    }

    private getRequestTemplates(path, method) {
        if (method == 'all') { method = 'x-amazon-apigateway-any-method'; }
        return this.apiConfigJson.paths[path][method]['x-amazon-apigateway-integration']['requestTemplates'];
    }

    private getRequestTemplate(path, method, contentType) {
        let templates = this.getRequestTemplates(path, method);
        return templates[contentType];
    }

    private getProperStatus(path, method, errorMessage) {
        if (method == 'all') { method = 'x-amazon-apigateway-any-method'; }
        let responses = this.apiConfigJson.paths[path][method]['x-amazon-apigateway-integration']['responses'];
        for (let response in responses) {
            if (response != 'default') {
                let regularExpress = new RegExp(response);
                if (errorMessage.match(regularExpress)) {
                    return responses[response].statusCode;
                }
            }
        }
        return 200;
    }

    get path() {
        return this._path;
    }

    set path(value) {
        this._path = value;
    }

    get method() {
        return this._method;
    }

    set method(value) {
        this._method = value;
    }

    handler(error, message?:any) {
        if (error) {
            let errorMessage = error.toString().replace(/Error: /,'');
            let status = this.getProperStatus(this.path, this.method, errorMessage);
            this.response.statusMessage = errorMessage;
            this.response.status(status).end();
        }
        else {
            this.response.send(message);
        }
        throw new Error("LAMBDA_DONE");
    }

}
