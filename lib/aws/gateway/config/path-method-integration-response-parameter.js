/**
 * Created by EGomez on 3/15/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PathMethodIntegrationResponseParameter = (function () {
    function PathMethodIntegrationResponseParameter() {
    }
    Object.defineProperty(PathMethodIntegrationResponseParameter.prototype, "header", {
        get: function () {
            return this._header;
        },
        set: function (value) {
            this._header = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegrationResponseParameter.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (value) {
            this._value = value;
        },
        enumerable: true,
        configurable: true
    });
    return PathMethodIntegrationResponseParameter;
}());
exports.default = PathMethodIntegrationResponseParameter;
