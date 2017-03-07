#!/usr/bin/env node
/**
 * Created by Ethan Dave B. Gomez on 2/24/17.
 */

import fs = require('fs');
import commander = require('commander');
import cors = require('cors');
import bodyParser = require('body-parser');
import express = require('express');
import Request = express.Request;
import Response = express.Response;
import BodyTemplate from "./lib/aws/gateway/body-template";
import Yaml = require('js-yaml');

class ApiGatewaySim {
    private _packageJson;
    private _localPackageJson;
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
            this.sendErrorResponse(error);
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
        let contextType = request.headers['content-type'];
        if (!contextType) { contextType = 'application/json'; }
        let template = this.getRequestTemplate(path, method, contextType);
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

    private sendErrorResponse(error:Error) {
        if (error.message != 'LAMBDA_DONE') {
            console.log(error.message);
            this._currentResponse.statusMessage = "Server Error: "+error.message;
            this._currentResponse.status(500).end();
        }
    }

    private getRequest(originalPath:string, method:string, request:Request) {
        let jsonEncodedEvent = this.parseEvent(originalPath, method, request);
        let event = JSON.parse(jsonEncodedEvent);
        let eventJson = Object['assign'](this.getEventJson(), event);
        return {
            eventJson:eventJson,
            packageJson:this._packageJson,
            contextJson:this.getContextJson(),
            stageVariables:this.getStageVariables(),
            lambdaTimeout:this.getLambdaTimeout()
        };
    }

    private processHandlerResponse(originalPath:string, method:string, httpResponse:Response, lambdaResponse) {
        if (lambdaResponse.lambdaError) {
            httpResponse.send({errorMessage:lambdaResponse.error});
        }
        else if (lambdaResponse.timeout) {
            httpResponse.send({errorMessage:"Task timed out after "+this.getLambdaTimeout()+".00 seconds"});
        }
        else if (lambdaResponse.error) {
            let error = lambdaResponse.error;
            let status = this.getProperStatus(originalPath, method, error.message);
            httpResponse.statusMessage = error.message;
            httpResponse.status(status).end();
        }
        else {
            httpResponse.send(lambdaResponse.message);
        }
    }

    private addRoute(originalPath, path, method) {
        this.logInfo("Add Route "+originalPath+", method "+method.toUpperCase());
        this._express[method](path, (req, res) => {
            try {
                this._currentResponse = res;
                let process = require('child_process');
                let parent = process.fork(__dirname+'/lib/handler');
                parent.on('message', (message) =>{
                    this.processHandlerResponse(originalPath, method, res, message);
                });
                let request = this.getRequest(originalPath, method, req);
                parent.send(request);
            }
            catch (error) {
                this.sendErrorResponse(error);
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
