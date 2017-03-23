/**
 * Created by EGomez on 3/15/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ConfigMethods = (function () {
    function ConfigMethods() {
    }
    return ConfigMethods;
}());
ConfigMethods.GET = 'get';
ConfigMethods.POST = 'post';
ConfigMethods.HEAD = 'head';
ConfigMethods.OPTIONS = 'options';
ConfigMethods.DELETE = 'delete';
ConfigMethods.PATCH = 'patch';
ConfigMethods.PUT = 'put';
ConfigMethods.ANY = 'x-amazon-apigateway-any-method';
exports.default = ConfigMethods;
