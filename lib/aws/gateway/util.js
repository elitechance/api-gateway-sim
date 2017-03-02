/**
 * Created by EGomez on 3/2/17.
 */
"use strict";
/**
 * Thanks to implementation in https://www.npmjs.com/package/api-gateway-mapping-template
 */
var Util = (function () {
    function Util() {
        this.escapeJavaScriptTable = {
            '"': '\"',
            '\\': '\\\\',
            '\b': '\\b',
            '\f': '\\f',
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
        };
    }
    Util.prototype.base64Encode = function (srcString) {
        return (new Buffer(srcString)).toString('base64');
    };
    Util.prototype.base64Decode = function (encodedString) {
        return (new Buffer(encodedString, 'base64')).toString();
    };
    Util.prototype.escapeJavaScript = function (x) {
        var _this = this;
        if (!x) {
            return "";
        }
        return x.split("").map(function (c) {
            // 2.a - 2.c
            if (c in _this.escapeJavaScriptTable) {
                return _this.escapeJavaScriptTable[c];
            }
            // 2.d
            return c;
        }).join("");
    };
    Util.prototype.parseJson = function (jsonString) {
        return JSON.parse(jsonString);
    };
    Util.prototype.urlEncode = function (sourceString) {
        return encodeURIComponent(sourceString);
    };
    Util.prototype.urlDecode = function (sourceString) {
        return decodeURIComponent(sourceString);
    };
    return Util;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Util;
