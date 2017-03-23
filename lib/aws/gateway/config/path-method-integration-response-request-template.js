"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by EGomez on 3/15/17.
 */
var PathMethodIntegrationResponseRequestTemplate = (function () {
    function PathMethodIntegrationResponseRequestTemplate() {
    }
    Object.defineProperty(PathMethodIntegrationResponseRequestTemplate.prototype, "contentType", {
        get: function () {
            return this._contentType;
        },
        set: function (value) {
            this._contentType = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethodIntegrationResponseRequestTemplate.prototype, "template", {
        get: function () {
            return this._template;
        },
        set: function (value) {
            this._template = value;
        },
        enumerable: true,
        configurable: true
    });
    return PathMethodIntegrationResponseRequestTemplate;
}());
exports.default = PathMethodIntegrationResponseRequestTemplate;
