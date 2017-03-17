#!/usr/bin/env node
/**
 * Created by Ethan Dave B. Gomez on 2/24/17.
 */

import fs = require('fs');
import path = require('path');
import commander = require('commander');
import cors = require('cors');
import bodyParser = require('body-parser');
import express = require('express');
import Request = express.Request;
import Response = express.Response;
import BodyTemplate from "./lib/aws/gateway/body-template";
import Yaml = require('js-yaml');
import Config from "./lib/aws/gateway/config";
import Path from "./lib/aws/gateway/config/path";
import PathMethod from "./lib/aws/gateway/config/path-method";
import ConfigMethods from "./lib/aws/gateway/config/methods";
import PathMethodIntegrationResponse from "./lib/aws/gateway/config/path-method-integration-response";
import PathMethodResponse from "./lib/aws/gateway/config/path-method-response";
import PathMethodIntegrationResponseRequestTemplate from "./lib/aws/gateway/config/path-method-integration-response-request-template";

class ApiGatewaySim {
    private _packageJson;
    private _localPackageJson;
    private _gatewayServer = express();
    private _bodyTemplateServer = express();
    private _swaggerFile:string;
    private _currentResponse;
    private _apiGatewayConfig:Config = new Config();
    private _strictCors:boolean = false;

    constructor() {
        this.loadLocalPackageJson();
        this.initCommander();
        this.checkParameters();
    }

    private initCommander() {
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
            .option('-u, --strict-cors', 'Enable CORS base on config file')
            .option('-g, --ags-port <port>', 'AGS UI port, default is 4000')
            .parse(process.argv);
    }

    private onParseRequest(request:Request, response:Response) {
        if (!request.body || !request.body.template) {
            response.send(null);
            return;
        }

        let bodyTemplate = new BodyTemplate;
        bodyTemplate.queryParams = request.body.queryParams;
        bodyTemplate.pathParams = request.body.pathParams;
        bodyTemplate.context = request.body.context;
        if (bodyTemplate.context) {
            bodyTemplate.method = bodyTemplate.context.httpMethod;
        }
        bodyTemplate.headers = request.body.headers;
        bodyTemplate.stageVariables = request.body.stageVariables;
        bodyTemplate.payload = JSON.stringify(request.body.body);
        let output = bodyTemplate.parse(request.body.template);
        response.send(output);
    }

    private getAgsRootPath() {
        return __dirname +path.sep+"public";
    }

    private getAgsServerModulesPath() {
        return this.getAgsRootPath()+path.sep+'node_modules';
    }

    private runAgsServer() {
        let port = process.env['AGS_PORT'];
        if (!port) { port = commander['agsPort']; }
        if (!port) { port = 4000; }
        this._bodyTemplateServer.use(express.static(__dirname+'/public'));
        this.logInfo("Running body template parser in port "+port);
        this._bodyTemplateServer.listen(port);
        this._bodyTemplateServer.use(bodyParser.json());
        this._bodyTemplateServer.post('/parse', this.onParseRequest);
    }

    private installAgsServerModules() {
        this.logInfo("Installing needed modules for ags");
        let exec = require('child_process').execSync;
        let cmd = 'npm install --production';
        exec(cmd, {cwd:this.getAgsRootPath()})
    }

    private argServerModulesExists() {
        let modulesPath = this.getAgsServerModulesPath();
        if (fs.existsSync(modulesPath)) {
            return true;
        }
        return false;
    }

    private processAgsServer() {
        if (!this.argServerModulesExists()) {
            this.installAgsServerModules();
        }
        this.runAgsServer();
    }

    private checkParameters() {
        let agsServer = commander['agsServer'];
        if (!agsServer && !commander['swagger']) {
            commander.help();
            process.exit(0);
        }

        if (agsServer) {
            this.processAgsServer();
        }

        this._strictCors = commander['strictCors'];
        this._swaggerFile = commander['swagger'];
        if (this._swaggerFile) {
            this.loadApiConfig();
            this.loadPackageJson();
            this.processErrors();
            this.initPlugins();
            this.configureRoutes();
            this.runServer();
        }
    }

    private processErrors() {
        process.on('uncaughtException', (error:Error) => {
            this.sendErrorResponse(error);
        });
    }

    private initPlugins() {
        // Enable CORS by default for backward compatibility
        if (!this._strictCors) {
            this.logInfo("Enable default CORS");
            this._gatewayServer.use(cors());
        }
        else {
            this.logInfo("Using strict CORS");
        }

        // parse application/x-www-form-urlencoded
        this._gatewayServer.use(bodyParser.urlencoded({ extended: false }));
        // parse application/json
        this._gatewayServer.use(bodyParser.json())
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

    private getRequestTemplate(method:PathMethod, contentType:string):string {
        for (let index in method.integration.requestTemplates) {
            let template:PathMethodIntegrationResponseRequestTemplate = method.integration.requestTemplates[index];
            if (template.contentType == contentType) {
                return template.template;
            }
        }
        return "";
    }

    private parseEvent(method:PathMethod, request:Request) {
        let bodyTemplate = new BodyTemplate();
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
        let contextType:string = request.headers['content-type'];
        if (!contextType) { contextType = 'application/json'; }
        let template = this.getRequestTemplate(method, contextType);
        if (!template) { return ""; }
        let compiled = bodyTemplate.parse(template);
        return compiled;
    }

    private getLambdaTimeout() {
        let timeout = commander['timeout'];
        if (timeout) {
            return timeout;
        }
        return 3; // default;
    }

    private getAwsMethod(method:string) {
        if (method === 'all') {
            return ConfigMethods.ANY;
        }
        return method;
    }

    private sendErrorResponse(error:Error) {
        if (error.message != 'LAMBDA_DONE') {
            console.log(error.message);
            this._currentResponse.statusMessage = "Server Error: "+error.message;
            this._currentResponse.status(500).end();
        }
    }

    private getRequest(method:PathMethod, request:Request) {
        let jsonEncodedEvent = this.parseEvent(method, request);
        let event;
        let eventJson;
        if (jsonEncodedEvent) {
            event = JSON.parse(jsonEncodedEvent);
            eventJson = Object['assign'](this.getEventJson(), event);
        }
        else {
            eventJson = this.getEventJson();
        }

        return {
            eventJson:eventJson,
            packageJson:this._packageJson,
            contextJson:this.getContextJson(),
            stageVariables:this.getStageVariables(),
            lambdaTimeout:this.getLambdaTimeout()
        };
    }

    private getMethodResponseByStatusCode(method:PathMethod, statusCode:number):PathMethodResponse {
        for(let index in method.responses) {
            let response = method.responses[index];
            if (response.statusCode == statusCode) {
                return response;
            }
        }
        return null;
    }

    private getIntegrationResponseByErrorMessage(method:PathMethod, errorMessage:string):PathMethodIntegrationResponse {
        let regularExpress:RegExp;
        let defaultResponse;
        for(let index in method.integration.responses) {
            let response = method.integration.responses[index];
            if (response.pattern == 'default') { defaultResponse = response; }
            regularExpress = new RegExp(response.pattern);
            if (errorMessage.match(regularExpress)) {
                return response;
            }
        }
        return defaultResponse;
    }

    private getDefaultIntegrationResponse(method:PathMethod):PathMethodIntegrationResponse {
        for(let index in method.integration.responses) {
            let response = method.integration.responses[index];
            if (response.pattern == 'default') { return response; }
        }
    }

    private setHeadersByIntegrationResponse(integrationResponse:PathMethodIntegrationResponse, method:PathMethod, httpResponse:Response) {
        let methodResponse:PathMethodResponse = this.getMethodResponseByStatusCode(method, integrationResponse.statusCode);
        if (methodResponse == null) {return;}
        for(let headerIndex in methodResponse.headers) {
            for (let responseParameterIndex in integrationResponse.responseParameters) {
                let headerName = integrationResponse.responseParameters[responseParameterIndex].header;
                let headerValue = integrationResponse.responseParameters[responseParameterIndex].value;
                let methodResponseHeader = methodResponse.headers[headerIndex];
                let responseHeader = integrationResponse.baseHeaderName + '.' + methodResponseHeader
                if (responseHeader == headerName) {
                    httpResponse.setHeader(methodResponseHeader, headerValue);
                }
            }
        }
    }

    private processHandlerResponse(method:PathMethod, httpRequest:Request, httpResponse:Response, lambdaResponse) {
        if (lambdaResponse.lambdaError) {
            httpResponse.send({errorMessage:lambdaResponse.error});
        }
        else if (lambdaResponse.timeout) {
            httpResponse.send({errorMessage:"Task timed out after "+this.getLambdaTimeout()+".00 seconds"});
        }
        else if (lambdaResponse.error) {
            let error = lambdaResponse.error;
            let integrationResponse = this.getIntegrationResponseByErrorMessage(method, error.message);
            if (this._strictCors) {
                this.setHeadersByIntegrationResponse(integrationResponse, method, httpResponse);
            }
            httpResponse.statusMessage = error.message;
            httpResponse.status(integrationResponse.statusCode).end();
        }
        else {
            if (httpRequest.method != 'HEAD') {
                if (this._strictCors) {
                    this.setHeadersByIntegrationResponse(this.getDefaultIntegrationResponse(method), method, httpResponse);
                }
                httpResponse.send(lambdaResponse.message);
            }
            else {
                httpResponse.status(200).end();
            }
        }
    }

    private getBasePath() {
        let basePath = '';

        let withBasePath = commander['withBasepath'];
        if (withBasePath) {
            basePath = this._apiGatewayConfig.basePath;
        }
        return basePath;
    }

    private replacePathParams(path):string {
        if (!path) { return path; }
        path = path.replace(/{([a-zA-Z0-9]+)}/g, ":$1");
        path = path.replace(/{([a-zA-Z]+\+)}/g, "*");
        return path;
    }

    private getExpressMethod(methodName:string) {
        if (methodName == ConfigMethods.ANY) {
            return 'all';
        }
        return methodName;
    }

    private configureRoutePathMethod(path:Path, method:PathMethod) {
        let basePath = this.getBasePath();
        let expressPath = this.replacePathParams(basePath+path.value);
        let expressMethod = this.getExpressMethod(method.name);
        this.logInfo("Add Route "+basePath+path.value+", method "+expressMethod.toUpperCase());
        this._gatewayServer[expressMethod](expressPath, (req, res) => {
            try {
                this._currentResponse = res;
                let process = require('child_process');
                let parent = process.fork(__dirname+'/lib/handler');
                parent.on('message', (message) =>{
                    this.processHandlerResponse(method, req, res, message);
                });
                let request = this.getRequest(method, req);
                parent.send(request);
            }
            catch (error) {
                this.sendErrorResponse(error);
            }
        });
    }

    private configureRoutePath(path:Path) {
        for(let index in path.methods) {
            this.configureRoutePathMethod(path, path.methods[index]);
        }
    }

    private configureRoutes() {
        for(let index in this._apiGatewayConfig.paths) {
            this.configureRoutePath(this._apiGatewayConfig.paths[index]);
        }
    }

    private runServer() {
        let port = process.env['PORT'];
        if (!port) { port = commander['port']; }
        if (!port) { port = 3000; }
        this._gatewayServer.listen(port, (error, result) => {
            if (error) { this.errorMessage(error); }
            this.logInfo("Listening to port "+ port);
        });
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

    private getEventJson() {
        try {
            let file = 'event.json';
            if (commander['event']) { file = commander['event']; }
            let eventJson = fs.readFileSync(file, 'utf8');
            return JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['event']) {
                this.errorMessage("Unable to open "+commander['event']);
            }
            return {};
        }
    }

    private getContextJson() {
        try {
            let file = 'context.json';
            if (commander['context']) { file = commander['context']; }
            let eventJson = fs.readFileSync(file, 'utf8');
            return JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['context']) {
                this.errorMessage("Unable to open "+commander['context']);
            }
            return {};
        }
    }

    private getStageVariables() {
        try {
            let file = 'stage-variables.json';
            if (commander['stageVariables']) { file = commander['stageVariables']; }
            let eventJson = fs.readFileSync(file, 'utf8');
            return JSON.parse(eventJson);
        }
        catch (error) {
            if (commander['stageVariables']) {
                this.errorMessage("Unable to open "+commander['stageVariables']);
            }
            return {};
        }
    }

    private loadApiConfig() {
        this._apiGatewayConfig.loadFile(this._swaggerFile);
    }

}

let apiGatewaySim = new ApiGatewaySim();
