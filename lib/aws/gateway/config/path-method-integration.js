/**
 * Created by EGomez on 3/15/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PathMethodIntegration = (function () {
    function PathMethodIntegration() {
        this._responses = [];
        this._requestTemplates = [];
    }
    Object.defineProperty(PathMethodIntegration.prototype, "defaultResponse", {
        get: function () {
            var responses = this.responses;
            if (!responses)
                return null;
            var response;
            for (var index in responses) {
                response = responses[index];
                if (response.pattern == 'default') {
                    return response;
                }
            }
            return null;
        },
        enumerable: true,
        configurable: true
    });
    PathMethodIntegration.prototype.getResponseByErrorMessage = function (errorMessage) {
        var regularExpress;
        var defaultResponse;
        for (var index in this.responses) {
            var response = this.responses[index];
            if (response.pattern == 'default') {
                defaultResponse = response;
            }
            regularExpress = new RegExp(response.pattern);
            if (errorMessage.match(regularExpress)) {
                return response;
            }
        }
        return defaultResponse;
    };
    Object.defineProperty(PathMethodIntegration.prototype, "responses", {
        get: function () {
            return this._responses;
        },
        set: function (value) {
            this._responses = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegration.prototype, "requestTemplates", {
        get: function () {
            return this._requestTemplates;
        },
        set: function (value) {
            this._requestTemplates = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegration.prototype, "uri", {
        get: function () {
            return this._uri;
        },
        set: function (value) {
            this._uri = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegration.prototype, "passthroughBehavior", {
        get: function () {
            return this._passthroughBehavior;
        },
        set: function (value) {
            this._passthroughBehavior = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegration.prototype, "httpMethod", {
        get: function () {
            return this._httpMethod;
        },
        set: function (value) {
            this._httpMethod = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegration.prototype, "contentHandling", {
        get: function () {
            return this._contentHandling;
        },
        set: function (value) {
            this._contentHandling = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegration.prototype, "type", {
        get: function () {
            return this._type;
        },
        set: function (value) {
            this._type = value;
        },
        enumerable: true,
        configurable: true
    });
    return PathMethodIntegration;
}());
exports.default = PathMethodIntegration;
