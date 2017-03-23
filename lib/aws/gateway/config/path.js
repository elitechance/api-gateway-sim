/**
 * Created by EGomez on 3/15/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Path = (function () {
    function Path() {
        this._methods = [];
    }
    Object.defineProperty(Path.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (value) {
            this._value = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Path.prototype, "methods", {
        get: function () {
            return this._methods;
        },
        set: function (value) {
            this._methods = value;
        },
        enumerable: true,
        configurable: true
    });
    return Path;
}());
exports.default = Path;
