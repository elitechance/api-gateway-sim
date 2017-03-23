/**
 * Created by EGomez on 3/15/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ConfigInfo = (function () {
    function ConfigInfo() {
    }
    Object.defineProperty(ConfigInfo.prototype, "version", {
        get: function () {
            return this._version;
        },
        set: function (value) {
            this._version = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConfigInfo.prototype, "title", {
        get: function () {
            return this._title;
        },
        set: function (value) {
            this._title = value;
        },
        enumerable: true,
        configurable: true
    });
    return ConfigInfo;
}());
exports.default = ConfigInfo;
