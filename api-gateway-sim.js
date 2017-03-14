#!/usr/bin/env node
"use strict";
var fs = require('fs');
var path = require('path');
var commander = require('commander');
var cors = require('cors');
var bodyParser = require('body-parser');
var express = require('express');
var body_template_1 = require("./lib/aws/gateway/body-template");
var Yaml = require('js-yaml');
var ApiGatewaySim = (function () {
    function ApiGatewaySim() {
        this._gatewayServer = express();
        this._bodyTemplateServer = express();
        this.loadLocalPackageJson();
        this.initCommander();
        this.checkParameters();
    }
    ApiGatewaySim.prototype.initCommander = function () {
        commander
            .version(this._localPackageJson.version)
            .option('-i, --timeout <lambda timeout>', 'Default is 3 seconds')
            .option('-s, --swagger <file>', 'Swagger config file')
            .option('-e, --event <file>', 'Default file event.json')
            .option('-c, --context <file>', 'Default file context.json file')
            .option('-t, --stage-variables <file>', 'Default file stage-variables.json file')
            .option('-p, --port <port>', 'Api gateway port, default is 3000')
            .option('-a, --ags-server', 'Run AGS UI')
            .option('-b, --with-basepath', 'Include base path in the endpoint')
            .option('-g, --ags-port <port>', 'AGS UI port, default is 4000')
            .parse(process.argv);
    };
    ApiGatewaySim.prototype.onParseRequest = function (request, response) {
        if (!request.body || !request.body.template) {
            response.send(null);
            return;
        }
        var bodyTemplate = new body_template_1.default;
        bodyTemplate.queryParams = request.body.queryParams;
        bodyTemplate.pathParams = request.body.pathParams;
        bodyTemplate.context = request.body.context;
        if (bodyTemplate.context) {
            bodyTemplate.method = bodyTemplate.context.httpMethod;
        }
        bodyTemplate.headers = request.body.headers;
        bodyTemplate.stageVariables = request.body.stageVariables;
        bodyTemplate.payload = JSON.stringify(request.body.body);
        var output = bodyTemplate.parse(request.body.template);
        response.send(output);
    };
    ApiGatewaySim.prototype.getAgsRootPath = function () {
        return __dirname + path.sep + "public";
    };
    ApiGatewaySim.prototype.getAgsServerModulesPath = function () {
        return this.getAgsRootPath() + path.sep + 'node_modules';
    };
    ApiGatewaySim.prototype.runAgsServer = function () {
        var port = process.env['AGS_PORT'];
        if (!port) {
            port = commander['agsPort'];
        }
        if (!port) {
            port = 4000;
        }
        this._bodyTemplateServer.use(express.static(__dirname + '/public'));
        this.logInfo("Running body template parser in port " + port);
        this._bodyTemplateServer.listen(port);
        this._bodyTemplateServer.use(bodyParser.json());
        this._bodyTemplateServer.post('/parse', this.onParseRequest);
    };
    ApiGatewaySim.prototype.installAgsServerModules = function () {
        this.logInfo("Installing needed modules for ags");
        var exec = require('child_process').execSync;
        var cmd = 'npm install --production';
        exec(cmd, { cwd: this.getAgsRootPath() });
    };
    ApiGatewaySim.prototype.argServerModulesExists = function () {
        var modulesPath = this.getAgsServerModulesPath();
        if (fs.existsSync(modulesPath)) {
            return true;
        }
        return false;
    };
    ApiGatewaySim.prototype.processAgsServer = function () {
        if (!this.argServerModulesExists()) {
            this.installAgsServerModules();
        }
        this.runAgsServer();
    };
    ApiGatewaySim.prototype.checkParameters = function () {
        var agsServer = commander['agsServer'];
        if (!agsServer && !commander['swagger']) {
            commander.help();
            process.exit(0);
        }
        if (agsServer) {
            this.processAgsServer();
        }
        this._swaggerFile = commander['swagger'];
        if (this._swaggerFile) {
            this.loadApiConfig();
            this.loadPackageJson();
            this.processErrors();
            this.initPlugins();
            this.configureRoutes();
            this.runServer();
        }
    };
    ApiGatewaySim.prototype.processErrors = function () {
        var _this = this;
        process.on('uncaughtException', function (error) {
            _this.sendErrorResponse(error);
        });
    };
    ApiGatewaySim.prototype.initPlugins = function () {
        this._gatewayServer.use(cors());
        // parse application/x-www-form-urlencoded
        this._gatewayServer.use(bodyParser.urlencoded({ extended: false }));
        // parse application/json
        this._gatewayServer.use(bodyParser.json());
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
        bodyTemplate.context = this.getContextJson();
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
        bodyTemplate.stageVariables = this.getStageVariables();
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
    ApiGatewaySim.prototype.getLambdaTimeout = function () {
        var timeout = commander['timeout'];
        if (timeout) {
            return timeout;
        }
        return 3; // default;
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
    ApiGatewaySim.prototype.sendErrorResponse = function (error) {
        if (error.message != 'LAMBDA_DONE') {
            console.log(error.message);
            this._currentResponse.statusMessage = "Server Error: " + error.message;
            this._currentResponse.status(500).end();
        }
    };
    ApiGatewaySim.prototype.getRequest = function (originalPath, method, request) {
        var jsonEncodedEvent = this.parseEvent(originalPath, method, request);
        var event = JSON.parse(jsonEncodedEvent);
        var eventJson = Object['assign'](this.getEventJson(), event);
        return {
            eventJson: eventJson,
            packageJson: this._packageJson,
            contextJson: this.getContextJson(),
            stageVariables: this.getStageVariables(),
            lambdaTimeout: this.getLambdaTimeout()
        };
    };
    ApiGatewaySim.prototype.processHandlerResponse = function (originalPath, method, httpResponse, lambdaResponse) {
        if (lambdaResponse.lambdaError) {
            httpResponse.send({ errorMessage: lambdaResponse.error });
        }
        else if (lambdaResponse.timeout) {
            httpResponse.send({ errorMessage: "Task timed out after " + this.getLambdaTimeout() + ".00 seconds" });
        }
        else if (lambdaResponse.error) {
            var error = lambdaResponse.error;
            var status_1 = this.getProperStatus(originalPath, method, error.message);
            httpResponse.statusMessage = error.message;
            httpResponse.status(status_1).end();
        }
        else {
            httpResponse.send(lambdaResponse.message);
        }
    };
    ApiGatewaySim.prototype.getBasePath = function () {
        var withBasePath = commander['withBasepath'];
        var basePath = '';
        if (withBasePath) {
            basePath = this._apiConfigJson.basePath;
        }
        return basePath;
    };
    ApiGatewaySim.prototype.addRoute = function (originalPath, path, method) {
        var _this = this;
        var basePath = this.getBasePath();
        this.logInfo("Add Route " + basePath + originalPath + ", method " + method.toUpperCase());
        this._gatewayServer[method](basePath + path, function (req, res) {
            try {
                _this._currentResponse = res;
                var process_1 = require('child_process');
                var parent_1 = process_1.fork(__dirname + '/lib/handler');
                parent_1.on('message', function (message) {
                    _this.processHandlerResponse(originalPath, method, res, message);
                });
                var request = _this.getRequest(originalPath, method, req);
                parent_1.send(request);
            }
            catch (error) {
                _this.sendErrorResponse(error);
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
                this.addRoute(originalPath, path, 'all');
                break;
            default:
                this.addRoute(originalPath, path, method);
                break;
        }
    };
    ApiGatewaySim.prototype.configurePath = function (path) {
        for (var method in this._apiConfigJson.paths[path]) {
            this.configurePathMethod(path, method);
        }
    };
    ApiGatewaySim.prototype.configureRoutes = function () {
        for (var path_1 in this._apiConfigJson.paths) {
            this.configurePath(path_1);
        }
    };
    ApiGatewaySim.prototype.runServer = function () {
        var _this = this;
        var port = process.env['PORT'];
        if (!port) {
            port = commander['port'];
        }
        if (!port) {
            port = 3000;
        }
        this._gatewayServer.listen(port, function (error, result) {
            if (error) {
                _this.errorMessage(error);
            }
            _this.logInfo("Listening to port " + port);
        });
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
    ApiGatewaySim.prototype.loadLocalPackageJson = function () {
        try {
            var packageJson = fs.readFileSync(__dirname + '/package.json', 'utf8');
            this._localPackageJson = JSON.parse(packageJson);
        }
        catch (error) {
            this.errorMessage("Missing package.json, Please this inside your lambda application root directory.");
        }
    };
    ApiGatewaySim.prototype.getEventJson = function () {
        try {
            var file = 'event.json';
            if (commander['event']) {
                file = commander['event'];
            }
            var eventJson = fs.readFileSync(file, 'utf8');
            return JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['event']) {
                this.errorMessage("Unable to open " + commander['event']);
            }
            return {};
        }
    };
    ApiGatewaySim.prototype.getContextJson = function () {
        try {
            var file = 'context.json';
            if (commander['context']) {
                file = commander['context'];
            }
            var eventJson = fs.readFileSync(file, 'utf8');
            return JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['context']) {
                this.errorMessage("Unable to open " + commander['context']);
            }
            return {};
        }
    };
    ApiGatewaySim.prototype.getStageVariables = function () {
        try {
            var file = 'stage-variables.json';
            if (commander['stageVariables']) {
                file = commander['stageVariables'];
            }
            var eventJson = fs.readFileSync(file, 'utf8');
            return JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['stageVariables']) {
                this.errorMessage("Unable to open " + commander['stageVariables']);
            }
            return {};
        }
    };
    ApiGatewaySim.prototype.loadApiConfig = function () {
        try {
            var configFile = this._swaggerFile;
            if (configFile.match(/\.json$/)) {
                var configJson = fs.readFileSync(configFile, 'utf8');
                this._apiConfigJson = JSON.parse(configJson);
            }
            else if (configFile.match(/\.yaml$/)) {
                var configJson = fs.readFileSync(configFile, 'utf8');
                this._apiConfigJson = Yaml.safeLoad(configJson);
            }
            else if (configFile.match(/\.yml$/)) {
                var configJson = fs.readFileSync(configFile, 'utf8');
                this._apiConfigJson = Yaml.safeLoad(configJson);
            }
            if (!this._apiConfigJson) {
                this.errorMessage("Unable to open config file " + configFile);
            }
        }
        catch (error) {
            this.errorMessage("Unable to open swagger file " + this._swaggerFile + "\nError: " + JSON.stringify(error));
        }
    };
    return ApiGatewaySim;
}());
var apiGatewaySim = new ApiGatewaySim();
