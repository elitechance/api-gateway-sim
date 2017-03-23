/**
 *
 * Created by Ethan Dave B. Gomez on 3/2/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Velocity = require("velocityjs");
var util_1 = require("./util");
var input_1 = require("./input");
var BodyTemplate = (function () {
    function BodyTemplate() {
    }
    BodyTemplate.prototype.getInput = function () {
        var input = new input_1.default();
        input.paramsHeader = this.headers;
        input.paramsQueryString = this.queryParams;
        input.paramsPath = this.pathParams;
        input.body = this.payload;
        return input;
    };
    BodyTemplate.prototype.parse = function (template) {
        var context = { context: { httpMethod: '' }, util: null, input: null, stageVariables: null };
        context.stageVariables = this.stageVariables;
        context.context = Object.assign(context.context, this.context);
        context.context.httpMethod = this.method;
        context.util = new util_1.default();
        context.input = this.getInput();
        var parsed = Velocity.parse(template);
        var Compile = Velocity.Compile;
        var compiler = new Compile(parsed);
        var compiled = compiler.render(context, function (error, rendered) {
            console.log(error, rendered);
        });
        return compiled;
    };
    Object.defineProperty(BodyTemplate.prototype, "context", {
        get: function () {
            return this._context;
        },
        set: function (value) {
            this._context = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyTemplate.prototype, "payload", {
        get: function () {
            return this._payload;
        },
        set: function (value) {
            this._payload = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyTemplate.prototype, "headers", {
        get: function () {
            return this._headers;
        },
        set: function (value) {
            this._headers = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyTemplate.prototype, "queryParams", {
        get: function () {
            return this._queryParams;
        },
        set: function (value) {
            this._queryParams = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyTemplate.prototype, "pathParams", {
        get: function () {
            return this._pathParams;
        },
        set: function (value) {
            this._pathParams = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyTemplate.prototype, "method", {
        get: function () {
            return this._method;
        },
        set: function (value) {
            this._method = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(BodyTemplate.prototype, "stageVariables", {
        get: function () {
            return this._stageVariables;
        },
        set: function (value) {
            this._stageVariables = value;
        },
        enumerable: true,
        configurable: true
    });
    return BodyTemplate;
}());
exports.default = BodyTemplate;
