/**
 * Created by EGomez on 3/15/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PathMethodIntegrationResponse = (function () {
    function PathMethodIntegrationResponse() {
        this._responseParameters = [];
        this._baseHeaderName = 'method.response.header';
    }
    Object.defineProperty(PathMethodIntegrationResponse.prototype, "pattern", {
        get: function () {
            return this._pattern;
        },
        set: function (value) {
            this._pattern = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegrationResponse.prototype, "statusCode", {
        get: function () {
            return this._statusCode;
        },
        set: function (value) {
            this._statusCode = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegrationResponse.prototype, "responseParameters", {
        get: function () {
            return this._responseParameters;
        },
        set: function (value) {
            this._responseParameters = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegrationResponse.prototype, "baseHeaderName", {
        get: function () {
            return this._baseHeaderName;
        },
        enumerable: true,
        configurable: true
    });
    return PathMethodIntegrationResponse;
}());
exports.default = PathMethodIntegrationResponse;
