#!/usr/bin/env node --harmony
/**
 * Created by Ethan Dave B. Gomez on 2/24/17.
 */

import fs = require('fs');
import commander = require('commander');
import express = require('express');
import cors = require('cors');
import bodyParser = require('body-parser');
import Request = express.Request;
import Response = express.Response;
import BodyTemplate from "./lib/aws/gateway/body-template";
import Callback from "./lib/callback";
import Yaml = require('js-yaml');

class ApiGatewaySim {
    private _exports;
    private _packageJson;
    private _localPackageJson;
    private _eventJson;
    private _contextJson;
    private _stageVariablesJson;
    private _apiConfigJson;
    private _express = express();
    private _swaggerFile:string;
    private _currentResponse;

    constructor() {
        this.loadLocalPackageJson();
        this.initCommander();
        this.checkParameters();

        this.loadPackageJson();
        this.processErrors();
        this.initPlugins();
        this.configureRoutes();
        this.runServer();
    }

    private initCommander() {
        commander
            .version(this._localPackageJson.version)
            .option('-i, --timeout <lambda timeout>', 'Default is 3 seconds')
            .option('-s, --swagger <file>', 'Swagger config file')
            .option('-e, --event <file>', 'Default file event.json')
            .option('-c, --context <file>', 'Default file context.json file')
            .option('-t, --stage-variables <file>', 'Default file stage-variables.json file')
            .parse(process.argv);
    }

    private checkParameters() {
        if (!commander['swagger']) {
            this.logInfo("No swagger file, please run with --swagger <swagger config file>");
            commander.help();
        }
        this._swaggerFile = commander['swagger'];
        this.loadApiConfig();
    }

    private processErrors() {
        process.on('uncaughtException', (error:Error) => {
            if (error.message != 'LAMBDA_DONE') {
                console.log(error.message);
                this._currentResponse.statusMessage = "Server Error: "+error.message;
                this._currentResponse.status(500).end();
            }
        });
    }

    private initPlugins() {
        this._express.use(cors());
        // parse application/x-www-form-urlencoded
        this._express.use(bodyParser.urlencoded({ extended: false }));
        // parse application/json
        this._express.use(bodyParser.json())
    }

    private logInfo(message) {
        console.log(message);
    }

    private getQueryParams(request:Request) {
        var url = require('url');
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        return query;
    }

    private getRequestTemplates(path, method) {
        if (method == 'all') { method = 'x-amazon-apigateway-any-method'; }
        return this._apiConfigJson.paths[path][method]['x-amazon-apigateway-integration']['requestTemplates'];
    }

    private getRequestTemplate(path, method, contentType) {
        let templates = this.getRequestTemplates(path, method);
        return templates[contentType];
    }

    private parseEvent(path:string, method:string, request:Request) {
        let bodyTemplate = new BodyTemplate();
        bodyTemplate.context = this._contextJson;
        bodyTemplate.headers = request.headers;
        if (request.params) {
            bodyTemplate.pathParams = request.params;
        }
        else {
            bodyTemplate.pathParams = {};
        }
        bodyTemplate.queryParams = this.getQueryParams(request);
        bodyTemplate.method = request.method;
        bodyTemplate.payload = JSON.stringify(request.body);
        bodyTemplate.stageVariables = this._stageVariablesJson;
        let contextType = request.headers['content-type'];
        if (!contextType) { contextType = 'application/json'; }
        let template = this.getRequestTemplate(path, method, contextType);
        if (!template) { return ""; }
        let compiled = bodyTemplate.parse(template);
        return compiled;
    }

    private getNewCallback(path:string, method:string, request:Request, response:Response) {
        let callback = new Callback();
        let lambdaTimeout = commander['timeout'];
        if (lambdaTimeout) {
            callback.timeout = lambdaTimeout;
        }
        callback.path = path;
        callback.method = method;
        callback.apiConfigJson = this._apiConfigJson;
        callback.request = request;
        callback.response = response;
        return callback;
    }

    private getContextMethods(path:string, method:string, request:Request, response:Response):any {
        let callback = this.getNewCallback(path, method, request, response);
        let methods = {
            succeed: function(result) { callback.handler(null, result); },
            fail: function(result) { callback.handler(result); },
            done: function() { callback.handler(null, null); },
            getRemainingTimeInMillis: function () { return callback.getRemainingTimeInMillis(); }
        };
        return methods;
    }

    private addRoute(originalPath, path, method) {
        this.logInfo("Add Route "+originalPath+", method "+method.toUpperCase());
        this._express[method](path, (req, res) => {
            try {
                this.loadStageVariables();
                this.loadEventJson();
                this.loadContextJson();
                this.loadHandler();
                this._currentResponse = res;
                let jsonEncodedEvent = this.parseEvent(originalPath, method, req);
                let event = JSON.parse(jsonEncodedEvent);
                this._eventJson = Object['assign'](this._eventJson, event);
                let contextMethods = this.getContextMethods(originalPath, method, req, res);
                this._contextJson = Object['assign'](contextMethods, this._contextJson);

                this._exports.handler(this._eventJson, this._contextJson, (error, message) => {
                    let callback = this.getNewCallback(originalPath, method, req, res);
                    callback.handler(error, message);
                });
            }
            catch (error) {
                if (error.message != 'LAMBDA_DONE') {
                    console.log(error.message);
                    this._currentResponse.statusMessage = "Server Error: "+error.message;
                    this._currentResponse.status(500).end();
                }
            }
        });
    }

    private hasPathParams(path) {
        if (!path) { return false; }
        if (path.match(/{[a-zA-Z0-9]+}/)) {
            return true;
        }
        return false;
    }

    private replacePathParams(path) {
        if (!path) { return path; }
        return path.replace(/{([a-zA-Z0-9]+)}/g, ":$1");
    }

    private configurePathMethod(path:string, method:string) {
        let hasPathParams = this.hasPathParams(path);
        let originalPath = path;
        if (hasPathParams) {
            path = this.replacePathParams(path);
        }
        switch (method) {
            case 'x-amazon-apigateway-any-method':this.addRoute(originalPath, path, 'all'); break;
            default: this.addRoute(originalPath, path, method); break;
        }
    }

    private configurePath(path) {
        for(let method in this._apiConfigJson.paths[path]) {
            this.configurePathMethod(path, method);
        }
    }

    private configureRoutes() {
        for(let path in this._apiConfigJson.paths) {
            this.configurePath(path);
        }
    }

    private runServer() {
        let port = process.env['PORT'] || 3000;
        this._express.listen(port, (error, result) => {
            if (error) { this.errorMessage(error); }
            this.logInfo("Listening to port "+ port);
        });
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

    private loadHandler() {
        let module = this.getModule();
        this.purgeCache(module);
        this._exports = require(module);
    }

    private errorMessage(message:string) {
        console.log(message);
        process.exit(1);
    }

    private loadPackageJson() {
        try {
            let packageJson = fs.readFileSync('package.json', 'utf8');
            this._packageJson = JSON.parse(packageJson);
        }
        catch (error) {
            this.errorMessage("Missing package.json, Please this inside your lambda application root directory.")
        }
    }

    private loadLocalPackageJson() {
        try {
            let packageJson = fs.readFileSync(__dirname+'/package.json', 'utf8');
            this._localPackageJson = JSON.parse(packageJson);
        }
        catch (error) {
            this.errorMessage("Missing package.json, Please this inside your lambda application root directory.")
        }
    }

    private loadEventJson() {
        try {
            let file = 'event.json';
            if (commander['event']) { file = commander['event']; }
            let eventJson = fs.readFileSync(file, 'utf8');
            this._eventJson = JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['event']) {
                this.errorMessage("Unable to open "+commander['event']);
            }
            this._eventJson = {};
        }
    }

    private loadContextJson() {
        try {
            let file = 'context.json';
            if (commander['context']) { file = commander['context']; }
            let eventJson = fs.readFileSync(file, 'utf8');
            this._contextJson = JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['context']) {
                this.errorMessage("Unable to open "+commander['context']);
            }
            this._contextJson = {};
        }
    }

    private loadStageVariables() {
        try {
            let file = 'stage-variables.json';
            if (commander['stageVariables']) { file = commander['stageVariables']; }
            let eventJson = fs.readFileSync(file, 'utf8');
            this._stageVariablesJson = JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['stageVariables']) {
                this.errorMessage("Unable to open "+commander['stageVariables']);
            }
            this._stageVariablesJson = {};
        }
    }

    private loadApiConfig() {
        try {
            let configFile = this._swaggerFile;
            if (configFile.match(/\.json$/)) {
                let configJson = fs.readFileSync(configFile, 'utf8');
                this._apiConfigJson = JSON.parse(configJson);
            }
            else if (configFile.match(/\.yaml$/)) {
                let configJson = fs.readFileSync(configFile, 'utf8');
                this._apiConfigJson = Yaml.safeLoad(configJson);
            }
            else if (configFile.match(/\.yml$/)) {
                let configJson = fs.readFileSync(configFile, 'utf8');
                this._apiConfigJson = Yaml.safeLoad(configJson);
            }
            if (!this._apiConfigJson) { this.errorMessage("Unable to open config file "+configFile); }
        }
        catch (error) {
            this.errorMessage("Unable to open swagger file "+this._swaggerFile+"\nError: "+JSON.stringify(error));
        }
    }

}

let apiGatewaySim = new ApiGatewaySim();
