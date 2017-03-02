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

class ApiGatewaySim {
    private _exports;
    private _packageJson;
    private _eventJson;
    private _contextJson;
    private _stageVariablesJson;
    private _apiConfigJson;
    private _express = express();
    private _request:Request;
    private _response:Response;
    private _swaggerFile:string;

    constructor() {
        this.initCommander();
        this.checkSwagger();
        this.processErrors();
        this.loadPackageJson();
        this.loadEvenJson();
        this.loadStageVariables();
        this.loadContextJson();
        this.initPlugins();
        this.configureRoutes();
        this.runServer();
    }

    private initCommander() {
        commander
            .option('-s, --swagger <file>', 'Swagger config file')
            .parse(process.argv);
    }

    private checkSwagger() {
        if (!commander.swagger) {
            this.errorMessage("No swagger file, please run with --swagger <swagger config file>");
        }
        this._swaggerFile = commander.swagger;
        this.loadApiConfig();
    }

    private processErrors() {
        process.on('uncaughtException', function (error:Error) {
            if (error.message != 'LAMBDA_DONE') {
                console.log(error);
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

    private getProperStatus(path, method, errorMessage) {
        if (method == 'all') { method = 'x-amazon-apigateway-any-method'; }
        let responses = this._apiConfigJson.paths[path][method]['x-amazon-apigateway-integration']['responses'];
        for (let response in responses) {
            if (response != 'default') {
                let regularExpress = new RegExp(response);
                if (errorMessage.match(regularExpress)) {
                    return responses[response].statusCode;
                }
            }
        }
        return 200;
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

    private addRoute(originalPath, path, method, hasPathParams?:boolean) {
        this.logInfo("Add Route "+originalPath+", method "+method.toUpperCase());
        this._express[method](path, (req, res) => {
            this._response = res;
            this._request = req;

            let jsonEncodedEvent = this.parseEvent(originalPath, method, req);
            let event = JSON.parse(jsonEncodedEvent);
            this._eventJson = Object.assign(this._eventJson, event);

            try {
                this.loadHandler();
                this._exports.handler(this._eventJson, this._contextJson, (error, message) => {
                    if (error) {
                        let errorMessage = error.toString().replace(/Error: /,'');
                        let status = this.getProperStatus(originalPath, method, errorMessage);
                        this._response.statusMessage = errorMessage;
                        this._response.status(status).end();
                    }
                    else {
                        this._response.send(message);
                    }
                    throw new Error("LAMBDA_DONE");
                });
            }
            catch (error) {
                if (error.message != 'LAMBDA_DONE') {
                    console.log(error);
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
            case 'x-amazon-apigateway-any-method':this.addRoute(originalPath, path, 'all', hasPathParams); break;
            default: this.addRoute(originalPath, path, method, hasPathParams); break;
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

        // Remove cached paths to the module.
        // Thanks to @bentael for pointing this out.
        Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
            if (cacheKey.indexOf(moduleName)>0) {
                delete module.constructor._pathCache[cacheKey];
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
                mod.children.forEach(function (child) {
                    traverse(child);
                });
                // Call the specified callback providing the
                // found cached module
                callback(mod);
            }(mod));
        }
    }

    private loadHandler() {
        let module = process.cwd()+'/'+this._packageJson.main;
        this.purgeCache(module);
        //if (require.cache[require.resolve(module)] ) { delete require.cache[require.resolve(module)]; }
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

    private loadEvenJson() {
        try {
            let eventJson = fs.readFileSync('event.json', 'utf8');
            this._eventJson = JSON.parse(eventJson);
        }
        catch (error) {
            this._eventJson = {};
        }
    }

    private loadContextJson() {
        try {
            let eventJson = fs.readFileSync('context.json', 'utf8');
            this._contextJson = JSON.parse(eventJson);
        }
        catch (error) {
            this._contextJson = {};
        }
    }

    private loadStageVariables() {
        try {
            let eventJson = fs.readFileSync('stage-variables.json', 'utf8');
            this._stageVariablesJson = JSON.parse(eventJson);
        }
        catch (error) {
            this._stageVariablesJson = {};
        }
    }

    private loadApiConfig() {
        try {
            let configFile = this._swaggerFile;
            let configJson = fs.readFileSync(configFile, 'utf8');
            if (!configJson) { this.errorMessage("Unable to open config file "+configFile); }
            this._apiConfigJson = JSON.parse(configJson);
        }
        catch (error) {
            this.errorMessage("Unable to open swagger file "+this._swaggerFile);
        }
    }

}

let apiGatewaySim = new ApiGatewaySim();
