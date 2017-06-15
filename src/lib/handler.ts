/**
 * Created by EGomez on 3/5/17.
 */

import Callback from "./callback";
import express = require('express');
import Request = express.Request;
import Response = express.Response;

export class Handler {
    private _request;
    private _packageJson;
    private _exports;

    constructor() {
        process.on('uncaughtException', (error:Error) => {
            process.send({lambdaError:true, error:error});
            process.exit(0);
        });
        process.on('message', (request) => {
            this.parseRequest(request);
            this.loadLambdaHandler();
            this.runLambda();
        });
    }

    private runLambda() {
        let contextMethods = this.getContextMethods();
        let contextJson = Object['assign'](contextMethods, this.request.contextJson);

        setTimeout(() =>{
            process.send({timeout:true});
            process.exit(0);
        },this.getLambdaTimeout() * 1000);
        this._exports.handler(this.request.eventJson,contextJson, (error,message) =>{
            let callback = this.getNewCallback();
            callback.handler(error, message);
        });
    }

    private parseRequest(request) {
        this.request = request;
        this._packageJson = this.request.packageJson;
    }

    private purgeCache(moduleName:string) {
        this.searchCache(moduleName, function (mod) {
            delete require.cache[mod.id];
        });

        Object.keys(module.constructor['_pathCache']).forEach(function(cacheKey) {
            if (cacheKey.indexOf(moduleName)>0) {
                delete module.constructor['_pathCache'][cacheKey];
            }
        });
    }

    private searchCache(moduleName, callback:Function) {
        // Resolve the module identified by the specified name
        let mod = require.resolve(moduleName);

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
    }

    private getModule() {
        return process.cwd()+'/'+this._packageJson.main;
    }

    private loadLambdaHandler() {
        let module = this.getModule();
        this._exports = require(module);
    }

    private getLambdaTimeout() {
        let timeout = this.request.lambdaTimeout;
        if (timeout > 300) {
            return 300; // Max timeout is 5 minutes in lambda
        }
        return timeout;
    }

    private getNewCallback() {
        let callback = new Callback();
        let lambdaTimeout = this.getLambdaTimeout();
        if (lambdaTimeout) {
            callback.timeout = lambdaTimeout;
        }
        callback.process = process;
        return callback;
    }

    private getContextMethods():any {
        let callback = this.getNewCallback();
        return {
            succeed: function(result) { callback.handler(null, result); },
            fail: function(result) { callback.handler(result); },
            done: function() { callback.handler(null, null); },
            getRemainingTimeInMillis: function () { return callback.getRemainingTimeInMillis(); }
        };
    }

    get request() {
        return this._request;
    }

    set request(value) {
        this._request = value;
    }
}

new Handler();
