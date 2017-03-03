"use strict";
var Callback = (function () {
    function Callback() {
    }
    Object.defineProperty(Callback.prototype, "request", {
        get: function () {
            return this._request;
        },
        set: function (value) {
            this._request = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Callback.prototype, "response", {
        get: function () {
            return this._response;
        },
        set: function (value) {
            this._response = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Callback.prototype, "apiConfigJson", {
        get: function () {
            return this._apiConfigJson;
        },
        set: function (value) {
            this._apiConfigJson = value;
        },
        enumerable: true,
        configurable: true
    });
    Callback.prototype.getRequestTemplates = function (path, method) {
        if (method == 'all') {
            method = 'x-amazon-apigateway-any-method';
        }
        return this.apiConfigJson.paths[path][method]['x-amazon-apigateway-integration']['requestTemplates'];
    };
    Callback.prototype.getRequestTemplate = function (path, method, contentType) {
        var templates = this.getRequestTemplates(path, method);
        return templates[contentType];
    };
    Callback.prototype.getProperStatus = function (path, method, errorMessage) {
        if (method == 'all') {
            method = 'x-amazon-apigateway-any-method';
        }
        var responses = this.apiConfigJson.paths[path][method]['x-amazon-apigateway-integration']['responses'];
        for (var response in responses) {
            if (response != 'default') {
                var regularExpress = new RegExp(response);
                if (errorMessage.match(regularExpress)) {
                    return responses[response].statusCode;
                }
            }
        }
        return 200;
    };
    Object.defineProperty(Callback.prototype, "path", {
        get: function () {
            return this._path;
        },
        set: function (value) {
            this._path = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Callback.prototype, "method", {
        get: function () {
            return this._method;
        },
        set: function (value) {
            this._method = value;
        },
        enumerable: true,
        configurable: true
    });
    Callback.prototype.handler = function (error, message) {
        if (error) {
            var errorMessage = error.toString().replace(/Error: /, '');
            var status_1 = this.getProperStatus(this.path, this.method, errorMessage);
            this.response.statusMessage = errorMessage;
            this.response.status(status_1).end();
        }
        else {
            this.response.send(message);
        }
        throw new Error("LAMBDA_DONE");
    };
    return Callback;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Callback;
