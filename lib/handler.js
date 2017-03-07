/**
 * Created by EGomez on 3/5/17.
 */
"use strict";
var callback_1 = require("./callback");
var Handler = (function () {
    function Handler() {
        var _this = this;
        process.on('uncaughtException', function (error) {
            process.send({ lambdaError: true, error: error.stack });
            process.exit(0);
        });
        process.on('message', function (request) {
            _this.parseRequest(request);
            _this.loadLambdaHandler();
            _this.runLambda();
        });
    }
    Handler.prototype.runLambda = function () {
        var _this = this;
        var contextMethods = this.getContextMethods();
        var contextJson = Object['assign'](contextMethods, this.request.contextJson);
        setTimeout(function () {
            process.send({ timeout: true });
            process.exit(0);
        }, this.getLambdaTimeout() * 1000);
        this._exports.handler(this.request.eventJson, contextJson, function (error, message) {
            var callback = _this.getNewCallback();
            callback.handler(error, message);
        });
    };
    Handler.prototype.parseRequest = function (request) {
        this.request = request;
        this._packageJson = this.request.packageJson;
    };
    Handler.prototype.purgeCache = function (moduleName) {
        this.searchCache(moduleName, function (mod) {
            delete require.cache[mod.id];
        });
        Object.keys(module.constructor['_pathCache']).forEach(function (cacheKey) {
            if (cacheKey.indexOf(moduleName) > 0) {
                delete module.constructor['_pathCache'][cacheKey];
            }
        });
    };
    Handler.prototype.searchCache = function (moduleName, callback) {
        // Resolve the module identified by the specified name
        var mod = require.resolve(moduleName);
        // Check if the module has been resolved and found within
        // the cache
        if (mod && ((mod = require.cache[mod]) !== undefined)) {
            // Recursively go over the results
            (function traverse(mod) {
                // Go over each of the module's children and
                // traverse them
                mod['children'].forEach(function (child) {
                    traverse(child);
                });
                // Call the specified callback providing the
                // found cached module
                callback(mod);
            }(mod));
        }
    };
    Handler.prototype.getModule = function () {
        return process.cwd() + '/' + this._packageJson.main;
    };
    Handler.prototype.loadLambdaHandler = function () {
        var module = this.getModule();
        this._exports = require(module);
    };
    Handler.prototype.getLambdaTimeout = function () {
        var timeout = this.request.lambdaTimeout;
        if (timeout > 300) {
            return 300; // Max timeout is 5 minutes in lambda
        }
        return timeout;
    };
    Handler.prototype.getNewCallback = function () {
        var callback = new callback_1.default();
        var lambdaTimeout = this.getLambdaTimeout();
        if (lambdaTimeout) {
            callback.timeout = lambdaTimeout;
        }
        callback.process = process;
        return callback;
    };
    Handler.prototype.getContextMethods = function () {
        var callback = this.getNewCallback();
        return {
            succeed: function (result) { callback.handler(null, result); },
            fail: function (result) { callback.handler(result); },
            done: function () { callback.handler(null, null); },
            getRemainingTimeInMillis: function () { return callback.getRemainingTimeInMillis(); }
        };
    };
    Object.defineProperty(Handler.prototype, "request", {
        get: function () {
            return this._request;
        },
        set: function (value) {
            this._request = value;
        },
        enumerable: true,
        configurable: true
    });
    return Handler;
}());
exports.Handler = Handler;
new Handler();
