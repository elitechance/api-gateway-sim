#!/usr/bin/env node --harmony
"use strict";
var fs = require('fs');
var commander = require('commander');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var body_template_1 = require("./lib/aws/gateway/body-template");
var ApiGatewaySim = (function () {
    function ApiGatewaySim() {
        this._express = express();
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
    ApiGatewaySim.prototype.initCommander = function () {
        commander
            .option('-s, --swagger <file>', 'Swagger config file')
            .parse(process.argv);
    };
    ApiGatewaySim.prototype.checkSwagger = function () {
        if (!commander.swagger) {
            this.errorMessage("No swagger file, please run with --swagger <swagger config file>");
        }
        this._swaggerFile = commander.swagger;
        this.loadApiConfig();
    };
    ApiGatewaySim.prototype.processErrors = function () {
        process.on('uncaughtException', function (error) {
            if (error.message != 'LAMBDA_DONE') {
                console.log(error);
            }
        });
    };
    ApiGatewaySim.prototype.initPlugins = function () {
        this._express.use(cors());
        // parse application/x-www-form-urlencoded
        this._express.use(bodyParser.urlencoded({ extended: false }));
        // parse application/json
        this._express.use(bodyParser.json());
    };
    ApiGatewaySim.prototype.logInfo = function (message) {
        console.log(message);
    };
    ApiGatewaySim.prototype.getQueryParams = function (request) {
        var url = require('url');
        var url_parts = url.parse(request.url, true);
        var query = url_parts.query;
        return query;
    };
    ApiGatewaySim.prototype.getProperStatus = function (path, method, errorMessage) {
        if (method == 'all') {
            method = 'x-amazon-apigateway-any-method';
        }
        var responses = this._apiConfigJson.paths[path][method]['x-amazon-apigateway-integration']['responses'];
        for (var response in responses) {
            if (response != 'default') {
                var regularExpress = new RegExp(response);
                if (errorMessage.match(regularExpress)) {
                    return responses[response].statusCode;
                }
            }
        }
        return 200;
    };
    ApiGatewaySim.prototype.getRequestTemplates = function (path, method) {
        if (method == 'all') {
            method = 'x-amazon-apigateway-any-method';
        }
        return this._apiConfigJson.paths[path][method]['x-amazon-apigateway-integration']['requestTemplates'];
    };
    ApiGatewaySim.prototype.getRequestTemplate = function (path, method, contentType) {
        var templates = this.getRequestTemplates(path, method);
        return templates[contentType];
    };
    ApiGatewaySim.prototype.parseEvent = function (path, method, request) {
        var bodyTemplate = new body_template_1.default();
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
        var contextType = request.headers['content-type'];
        if (!contextType) {
            contextType = 'application/json';
        }
        var template = this.getRequestTemplate(path, method, contextType);
        if (!template) {
            return "";
        }
        var compiled = bodyTemplate.parse(template);
        return compiled;
    };
    ApiGatewaySim.prototype.addRoute = function (originalPath, path, method, hasPathParams) {
        var _this = this;
        this.logInfo("Add Route " + originalPath + ", method " + method.toUpperCase());
        this._express[method](path, function (req, res) {
            _this._response = res;
            _this._request = req;
            var jsonEncodedEvent = _this.parseEvent(originalPath, method, req);
            var event = JSON.parse(jsonEncodedEvent);
            _this._eventJson = Object.assign(_this._eventJson, event);
            try {
                _this.loadHandler();
                _this._exports.handler(_this._eventJson, _this._contextJson, function (error, message) {
                    if (error) {
                        var errorMessage = error.toString().replace(/Error: /, '');
                        var status_1 = _this.getProperStatus(originalPath, method, errorMessage);
                        _this._response.statusMessage = errorMessage;
                        _this._response.status(status_1).end();
                    }
                    else {
                        _this._response.send(message);
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
    };
    ApiGatewaySim.prototype.hasPathParams = function (path) {
        if (!path) {
            return false;
        }
        if (path.match(/{[a-zA-Z0-9]+}/)) {
            return true;
        }
        return false;
    };
    ApiGatewaySim.prototype.replacePathParams = function (path) {
        if (!path) {
            return path;
        }
        return path.replace(/{([a-zA-Z0-9]+)}/g, ":$1");
    };
    ApiGatewaySim.prototype.configurePathMethod = function (path, method) {
        var hasPathParams = this.hasPathParams(path);
        var originalPath = path;
        if (hasPathParams) {
            path = this.replacePathParams(path);
        }
        switch (method) {
            case 'x-amazon-apigateway-any-method':
                this.addRoute(originalPath, path, 'all', hasPathParams);
                break;
            default:
                this.addRoute(originalPath, path, method, hasPathParams);
                break;
        }
    };
    ApiGatewaySim.prototype.configurePath = function (path) {
        for (var method in this._apiConfigJson.paths[path]) {
            this.configurePathMethod(path, method);
        }
    };
    ApiGatewaySim.prototype.configureRoutes = function () {
        for (var path in this._apiConfigJson.paths) {
            this.configurePath(path);
        }
    };
    ApiGatewaySim.prototype.runServer = function () {
        var _this = this;
        var port = process.env['PORT'] || 3000;
        this._express.listen(port, function (error, result) {
            if (error) {
                _this.errorMessage(error);
            }
            _this.logInfo("Listening to port " + port);
        });
    };
    ApiGatewaySim.prototype.purgeCache = function (moduleName) {
        this.searchCache(moduleName, function (mod) {
            delete require.cache[mod.id];
        });
        // Remove cached paths to the module.
        // Thanks to @bentael for pointing this out.
        Object.keys(module.constructor._pathCache).forEach(function (cacheKey) {
            if (cacheKey.indexOf(moduleName) > 0) {
                delete module.constructor._pathCache[cacheKey];
            }
        });
    };
    ApiGatewaySim.prototype.searchCache = function (moduleName, callback) {
        // Resolve the module identified by the specified name
        var mod = require.resolve(moduleName);
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
    };
    ApiGatewaySim.prototype.loadHandler = function () {
        var module = process.cwd() + '/' + this._packageJson.main;
        this.purgeCache(module);
        //if (require.cache[require.resolve(module)] ) { delete require.cache[require.resolve(module)]; }
        this._exports = require(module);
    };
    ApiGatewaySim.prototype.errorMessage = function (message) {
        console.log(message);
        process.exit(1);
    };
    ApiGatewaySim.prototype.loadPackageJson = function () {
        try {
            var packageJson = fs.readFileSync('package.json', 'utf8');
            this._packageJson = JSON.parse(packageJson);
        }
        catch (error) {
            this.errorMessage("Missing package.json, Please this inside your lambda application root directory.");
        }
    };
    ApiGatewaySim.prototype.loadEvenJson = function () {
        try {
            var eventJson = fs.readFileSync('event.json', 'utf8');
            this._eventJson = JSON.parse(eventJson);
        }
        catch (error) {
            this._eventJson = {};
        }
    };
    ApiGatewaySim.prototype.loadContextJson = function () {
        try {
            var eventJson = fs.readFileSync('context.json', 'utf8');
            this._contextJson = JSON.parse(eventJson);
        }
        catch (error) {
            this._contextJson = {};
        }
    };
    ApiGatewaySim.prototype.loadStageVariables = function () {
        try {
            var eventJson = fs.readFileSync('stage-variables.json', 'utf8');
            this._stageVariablesJson = JSON.parse(eventJson);
        }
        catch (error) {
            this._stageVariablesJson = {};
        }
    };
    ApiGatewaySim.prototype.loadApiConfig = function () {
        try {
            var configFile = this._swaggerFile;
            var configJson = fs.readFileSync(configFile, 'utf8');
            if (!configJson) {
                this.errorMessage("Unable to open config file " + configFile);
            }
            this._apiConfigJson = JSON.parse(configJson);
        }
        catch (error) {
            this.errorMessage("Unable to open swagger file " + this._swaggerFile);
        }
    };
    return ApiGatewaySim;
}());
var apiGatewaySim = new ApiGatewaySim();
