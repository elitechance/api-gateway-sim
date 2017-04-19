/**
 * Created by EGomez on 3/2/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Thanks to implementation in https://www.npmjs.com/package/api-gateway-mapping-template
 */
var JsonPath = require("JSONPath");
var Input = (function () {
    function Input() {
        this._body = '';
        this._paramsContainer = {
            path: {},
            querystring: {},
            header: {},
        };
    }
    Input.prototype.path = function (jsonPath) {
        var obj;
        if (this._body === '') {
            // if payload is empty, treat it as empty object
            //   https://github.com/ToQoz/api-gateway-mapping-template/blob/master/test/_.md#example-91575d0e
            obj = {};
        }
        else if (/^\s*(?:{|\[|")/.test(this._body)) {
            // if payload starts with `{` or `[` or `"`, treat as JSON
            obj = JSON.parse(this._body);
        }
        else {
            // treat as string
            obj = this._body;
        }
        if (jsonPath === '$') {
            return obj;
        }
        var results = JsonPath({ obj: obj, path: jsonPath });
        if (results && results.length === 1) {
            return results[0];
        }
        return results;
    };
    Input.prototype.json = function (jsonPath) {
        var obj = this.path(jsonPath);
        return JSON.stringify(obj);
    };
    Input.prototype.params = function (name) {
        switch (true) {
            case name === undefined:
                return this._paramsContainer;
            case name in this._paramsContainer.path:
                return this._paramsContainer.path[name];
            case name in this._paramsContainer.querystring:
                return this._paramsContainer.querystring[name];
            case name in this._paramsContainer.header:
                return this._paramsContainer.header[name];
        }
    };
    Object.defineProperty(Input.prototype, "paramsContainer", {
        get: function () {
            return this._paramsContainer;
        },
        set: function (value) {
            this._paramsContainer = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input.prototype, "body", {
        get: function () {
            return this._body;
        },
        set: function (value) {
            this._body = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input.prototype, "paramsPath", {
        get: function () {
            return this._paramsContainer.path;
        },
        set: function (value) {
            this._paramsContainer.path = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input.prototype, "paramsQueryString", {
        get: function () {
            return this._paramsContainer.querystring;
        },
        set: function (value) {
            this._paramsContainer.querystring = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Input.prototype, "paramsHeader", {
        get: function () {
            return this._paramsContainer.header;
        },
        set: function (value) {
            this._paramsContainer.header = value;
        },
        enumerable: true,
        configurable: true
    });
    return Input;
}());
exports.default = Input;
//# sourceMappingURL=input.js.map