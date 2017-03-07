"use strict";
var Callback = (function () {
    function Callback() {
        this._timeout = 3000; // Default 3000 miliseconds timeout
        this._startTime = new Date();
    }
    Object.defineProperty(Callback.prototype, "timeout", {
        get: function () {
            return this._timeout;
        },
        set: function (value) {
            // Convert to miliseconds
            this._timeout = value * 1000;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Thanks to https://github.com/motdotla/node-lambda for the implementation
     * @returns {number}
     */
    Callback.prototype.getRemainingTimeInMillis = function () {
        var currentTime = new Date();
        return this.timeout - (currentTime - this._startTime);
    };
    Callback.prototype.getResponse = function (error, message) {
        var errorResponse;
        if (error) {
            errorResponse = {
                message: error.message,
                name: error.name,
                stack: error.stack
            };
        }
        else {
            errorResponse = null;
        }
        return {
            timeout: false,
            error: errorResponse,
            message: message
        };
    };
    Callback.prototype.handler = function (error, message) {
        var response = this.getResponse(error, message);
        this.process.send(response);
        this.process.exit(0);
    };
    Object.defineProperty(Callback.prototype, "process", {
        get: function () {
            return this._process;
        },
        set: function (value) {
            this._process = value;
        },
        enumerable: true,
        configurable: true
    });
    return Callback;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Callback;
