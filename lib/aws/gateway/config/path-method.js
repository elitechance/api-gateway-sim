/**
 * Created by EGomez on 3/15/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PathMethod = (function () {
    function PathMethod() {
        this._responses = [];
    }
    PathMethod.prototype.canConsume = function (contentType) {
        for (var index in this.consumes) {
            if (this.consumes[index] == contentType) {
                return true;
            }
        }
        return false;
    };
    Object.defineProperty(PathMethod.prototype, "name", {
        get: function () {
            return this._name;
        },
        set: function (value) {
            this._name = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethod.prototype, "consumes", {
        get: function () {
            return this._consumes;
        },
        set: function (value) {
            this._consumes = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethod.prototype, "produces", {
        get: function () {
            return this._produces;
        },
        set: function (value) {
            this._produces = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethod.prototype, "responses", {
        get: function () {
            return this._responses;
        },
        set: function (value) {
            this._responses = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PathMethod.prototype, "integration", {
        get: function () {
            return this._integration;
        },
        set: function (value) {
            this._integration = value;
        },
        enumerable: true,
        configurable: true
    });
    return PathMethod;
}());
exports.default = PathMethod;
