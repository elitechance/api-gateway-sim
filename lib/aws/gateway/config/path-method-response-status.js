/**
 * Created by EGomez on 3/15/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PathMethodResponseStatus = (function () {
    function PathMethodResponseStatus() {
    }
    Object.defineProperty(PathMethodResponseStatus.prototype, "status", {
        get: function () {
            return this._status;
        },
        set: function (value) {
            this._status = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodResponseStatus.prototype, "description", {
        get: function () {
            return this._description;
        },
        set: function (value) {
            this._description = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodResponseStatus.prototype, "schema", {
        get: function () {
            return this._schema;
        },
        set: function (value) {
            this._schema = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodResponseStatus.prototype, "headers", {
        get: function () {
            return this._headers;
        },
        set: function (value) {
            this._headers = value;
        },
        enumerable: true,
        configurable: true
    });
    return PathMethodResponseStatus;
}());
exports.default = PathMethodResponseStatus;
