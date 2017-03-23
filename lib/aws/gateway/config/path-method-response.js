"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by EGomez on 3/15/17.
 */
var PathMethodResponse = (function () {
    function PathMethodResponse() {
        this._headers = [];
    }
    Object.defineProperty(PathMethodResponse.prototype, "statusCode", {
        get: function () {
            return this._statusCode;
        },
        set: function (value) {
            this._statusCode = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodResponse.prototype, "description", {
        get: function () {
            return this._description;
        },
        set: function (value) {
            this._description = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodResponse.prototype, "schema", {
        get: function () {
            return this._schema;
        },
        set: function (value) {
            this._schema = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodResponse.prototype, "headers", {
        get: function () {
            return this._headers;
        },
        set: function (value) {
            this._headers = value;
        },
        enumerable: true,
        configurable: true
    });
    return PathMethodResponse;
}());
exports.default = PathMethodResponse;
