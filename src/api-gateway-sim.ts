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
import HttpStatus from "./lib/http-status";
import OpenApi from "./lib/open-api/open-api";
import Path from "./lib/open-api/path";
import Method from "./lib/open-api/path/method";
import Methods from "./lib/open-api/methods";
import IntegrationResponse from "./lib/open-api/path/method/integration/response";
import MethodResponse from "./lib/open-api/path/method/response";
import RequestTemplate from "./lib/open-api/path/method/integration/response/request/template";

class ApiGatewaySim {
    private _packageJson;
    private _localPackageJson;
    private _gatewayServer = express();
    private _bodyTemplateServer = express();
    private _swaggerFile:string;
    private _currentResponse;
    private _openApiConfig:OpenApi = new OpenApi();
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
            .option('-s, --swagger <file>', 'OpenApi/Swagger config file')
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

        this._gatewayServer.use(bodyParser.text({type:'*/*'}));
        // parse application/x-www-form-urlencoded
        this._gatewayServer.use(bodyParser.urlencoded({ extended: false }));
        // parse application/json
        this._gatewayServer.use(bodyParser.json({type:'application/json'}))
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

    private getPassThroughTemplateContent() {
        let file = __dirname+'/templates/pass-through.vtl';
        return fs.readFileSync(file, 'utf8');
    }

    private getPassThroughTemplate(type) {
        switch (type) {
            case 'when_no_match': return this.getPassThroughTemplateContent();
            case 'never': return "";
            default: return this.getPassThroughTemplateContent();
        }
    }

    private getRequestTemplate(method:Method, contentType:string):string {
        let templateValue:string = '';
        for (let index in method.integration.requestTemplates) {
            let template:RequestTemplate = method.integration.requestTemplates[index];
            if (template.contentType == contentType) {
                templateValue = template.template;
                if (templateValue) {
                    return templateValue;
                }
            }
        }

        if (!templateValue && method.canConsume(contentType)) {
            return this.getPassThroughTemplateContent();
        }
        if (!templateValue) {
            return this.getPassThroughTemplate(method.integration.passthroughBehavior);
        }
    }

    private setContextValue(context:any, name:string) {
        if (context[name]) { return; }
        context[name] = '';
    }

    private setContextValues(context:any, request:Request) {
        if (!context.identity) {
            context.identity = {};
        }
        if (!context.authorizer) {
            context.authorizer = {principalId:''};
        }
        context.identity.userAgent = request.headers['user-agent'];
        this.setContextValue(context.identity, 'accountId');
        this.setContextValue(context.identity, 'apiKey');
        this.setContextValue(context.identity, 'caller');
        this.setContextValue(context.identity, 'cognitoAuthenticationProvider');
        this.setContextValue(context.identity, 'cognitoAuthenticationType');
        this.setContextValue(context.identity, 'cognitoIdentityId');
        this.setContextValue(context.identity, 'cognitoIdentityPoolId');
        this.setContextValue(context.identity, 'sourceIp');
        this.setContextValue(context.identity, 'userAgent');
        this.setContextValue(context.identity, 'userArn');
        this.setContextValue(context.identity, 'user');
        this.setContextValue(context, 'apiId');
        this.setContextValue(context, 'requestId');
        this.setContextValue(context, 'resourceId');
        context.stage = this.getBasePath().replace(/^\//,'');
    }

    private setContextDefaults(context:any, request:Request) {
        context.httpMethod = request.method;
        /**
         * In API Gateway, base path is not part of path when passing it to lambda.
         */
        if (this.getBasePath()) {
            let stringPattern = '^'+this._openApiConfig.basePath+'';
            let pattern = new RegExp(stringPattern);
            let path = request.path.replace(pattern, '');
            context.resourcePath = path;
        }
        else {
            context.resourcePath = request.path;
        }
        this.setContextValues(context, request);
    }

    private parseEvent(method:Method, request:Request) {
        let bodyTemplate = new BodyTemplate();
        bodyTemplate.context = this.getContextJson();
        this.setContextDefaults(bodyTemplate.context, request);
        bodyTemplate.headers = request.headers;
        if (request.params) {
            bodyTemplate.pathParams = request.params;
        }
        else {
            bodyTemplate.pathParams = {};
        }
        bodyTemplate.queryParams = this.getQueryParams(request);
        bodyTemplate.method = request.method;
        bodyTemplate.payload = request.body;
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
            return Methods.ANY;
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

    private mergeEventData(jsonEncodedEvent:any) {
        if (jsonEncodedEvent) {
            let event = JSON.parse(jsonEncodedEvent);
            return Object['assign'](this.getEventJson(), event);
        }
        else {
            return this.getEventJson();
        }
    }

    private getProxyName(path:Path) {
        let pattern = path.pattern;
        let match = pattern.match(/{[a-zA-Z]+\+}/);
        if (match) {
            let name = match[0];
            return name.replace(/[{}+]/g,'');
        }
        return null;
    }

    private setProxyStageVariables(path:Path, event:any, request:Request) {
        if (!event.requestContext) {
            event.requestContext = {};
        }
        event.requestContext.stage = this._openApiConfig.basePath.replace(/^\//, '');
        event.requestContext.resourcePath = path.pattern;
        event.requestContext.path = this.getPathInOriginalUrl(request.originalUrl);
    }

    private getRequestBody(body:any) {
        try {
            return JSON.stringify(body);
        }
        catch (error) {
            return body;
        }
    }

    private getRawHeaders(request:Request) {
        let rawHeaders = {};
        if (request.rawHeaders.length > 0) {
            for(let i = 0;i < request.rawHeaders.length;i+=2) {
                rawHeaders[request.rawHeaders[i]] = request.rawHeaders[i+1];
            }
        }
        return rawHeaders;
    }

    private getProxyPathParams(path:Path, request:Request) {
        let proxyName = this.getProxyName(path);
        if (proxyName) {
            let proxyValue = request.params['0'];
            let pathParameters:any = {};
            pathParameters[proxyName] = proxyValue;
        }
        return null;
    }

    private removeNonProxyFields(event:any) {
        if (event.context) { delete event.context; }
        if (event.params) { delete event.params; }
        if (event['body-json']) { delete event['body-json']; }
    }

    private getPathInOriginalUrl(url:string) {
        let pathContainer = url.replace(this.getBasePath(), '');
        let info = pathContainer.split('?', 1);
        return info[0];
    }

    private isObjectEmpty(object:any) {
        return Object.keys(object).length === 0 && object.constructor === Object;
    }

    private getProxyQueryString(request:Request) {
        if (this.isObjectEmpty(request.query)) { return null; }
        return request.query;
    }

    private processProxyData(path:Path, method:Method, request:Request, requestObject:any) {
        if (method.integration.type === 'aws_proxy') {
            requestObject.eventJson.pathParameters = this.getProxyPathParams(path, request);
            requestObject.eventJson.resource = path.pattern;
            requestObject.eventJson.body = request.body.toString();
            requestObject.eventJson.path = this.getPathInOriginalUrl(request.originalUrl);
            requestObject.eventJson.headers = this.getRawHeaders(request);
            requestObject.eventJson.queryStringParameters = this.getProxyQueryString(request);
            this.removeNonProxyFields(requestObject.eventJson);
            this.setProxyStageVariables(path, requestObject.eventJson, request);
        }
        return requestObject;
    }

    private getRequest(path:Path, method:Method, request:Request) {
        let jsonEncodedEvent = this.parseEvent(method, request);
        let eventJson = this.mergeEventData(jsonEncodedEvent);
        let context = this.getContextJson();
        let requestObject = {
            eventJson:eventJson,
            packageJson:this._packageJson,
            contextJson:context,
            stageVariables:this.getStageVariables(),
            lambdaTimeout:this.getLambdaTimeout()
        };
        return this.processProxyData(path, method, request, requestObject);
    }

    private getMethodResponseByStatusCode(method:Method, statusCode:number):MethodResponse {
        for(let index in method.responses) {
            let response = method.responses[index];
            if (response.statusCode == statusCode) {
                return response;
            }
        }
        return null;
    }

    private setHeadersByIntegrationResponse(integrationResponse:IntegrationResponse, method:Method, httpResponse:Response) {
        let methodResponse:MethodResponse = this.getMethodResponseByStatusCode(method, integrationResponse.statusCode);
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

    private sendHttpErrorResponse(httpResponse:Response, error:any) {
        if (typeof error === 'string') {
            httpResponse.send(error);
        }
        else {
            httpResponse.send(this.getErrorResponse(error));
        }
    }

    private getErrorResponse(error:Error) {
        return {
            errorMessage:error.message,
            errorType:error.name,
            stackTrace:error.stack.split("\n")
        };
    }

    private sendHttpErrorBadGateway(httpResponse:Response, message:string) {
        httpResponse.statusMessage = HttpStatus.getMessageByCode(502);
        httpResponse.statusCode = 502;
        httpResponse.send({message:message});
    }

    private sendHttpErrorUnsupportedType(httpResponse:Response) {
        let message = HttpStatus.getMessageByCode(415);
        httpResponse.statusMessage = message;
        httpResponse.statusCode = 415;
        httpResponse.send({message:message});
    }

    private validProxyProperties(message) {
        let validProperties = {body:true, statusCode:true, headers:true};
        for (let property in message) {
            if (!validProperties[property]) {
                return false;
            }
        }
        return true;
    }

    private getAwsProxyContentType(message) {
        if (!message.headers) { return null; }
        for(let header in message.headers) {
            if (header.match(/^content-type/i)) {
                return message.headers[header];
            }
        }
    }

    private sendAwsProxyResponse(httpResponse:Response, method:Method, message:any) {
        let errorMessage = "Internal server error";
        if (!message || !message.body) {
            return this.sendHttpErrorBadGateway(httpResponse, errorMessage)
        }
        try {
            let contentType = this.getAwsProxyContentType(message);
            let parseBody;
            if (contentType) { httpResponse.setHeader('content-type', contentType); }
            if (contentType && !contentType.match(/^application\/json/)) {
                parseBody = message.body;
            }
            else {
                httpResponse.setHeader('content-type', 'application/json');
                parseBody = JSON.parse(message.body);
            }
            if(!this.validProxyProperties(message)) {
                return this.sendHttpErrorBadGateway(httpResponse, errorMessage);
            }
            else {
                if (message.statusCode) {
                    httpResponse.statusCode = message.statusCode;
                    httpResponse.statusMessage = HttpStatus.getMessageByCode(message.statusCode);
                }
                this.sendDefaultResponse(httpResponse, method, parseBody);
            }
        }
        catch (error) {
            return this.sendHttpErrorBadGateway(httpResponse, error+"")
        }
    }

    private sendDefaultResponse(httpResponse:Response, method:Method, message:any) {
        if (this._strictCors) {
            this.setHeadersByIntegrationResponse(method.integration.defaultResponse, method, httpResponse);
        }
        httpResponse.send(message);
    }

    private sendHttpSuccessResponse(httpResponse:Response, method:Method, message:any) {
        switch (method.integration.type) {
            case 'aws_proxy': this.sendAwsProxyResponse(httpResponse, method, message); break;
            default: this.sendDefaultResponse(httpResponse, method, message);
        }
    }

    private processHandlerResponse(method:Method, httpRequest:Request, httpResponse:Response, lambdaResponse) {
        if (lambdaResponse.lambdaError) {
            this.sendHttpErrorResponse(httpResponse, lambdaResponse.error);
        }
        else if (lambdaResponse.timeout) {
            this.sendHttpErrorResponse(httpResponse,"Task timed out after "+this.getLambdaTimeout()+".00 seconds");
        }
        else if (lambdaResponse.error) {
            let error = lambdaResponse.error;
            let integrationResponse = method.integration.getResponseByErrorMessage(error.message);
            if (this._strictCors) {
                this.setHeadersByIntegrationResponse(integrationResponse, method, httpResponse);
            }
            httpResponse.statusMessage = error.message;
            httpResponse.status(integrationResponse.statusCode)
                .send(this.getErrorResponse(lambdaResponse.error))
                .end();
        }
        else {
            if (httpRequest.method != 'HEAD') {
                this.sendHttpSuccessResponse(httpResponse, method, lambdaResponse.message);
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
            basePath = this._openApiConfig.basePath;
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
        if (methodName == Methods.ANY) {
            return 'all';
        }
        return methodName;
    }

    private validRequest(method:Method, httpRequest:Request) {
        let contentType = httpRequest.headers['content-type'];
        if (!contentType) { contentType = 'application/json'; }
        let template = this.getRequestTemplate(method, contentType);
        if (template) {
            return true;
        }
        return false;
    }

    private configureRoutePathMethod(path:Path, method:Method) {
        let basePath = this.getBasePath();
        let expressPath = this.replacePathParams(basePath+path.pattern);
        let expressMethod = this.getExpressMethod(method.name);
        this.logInfo("Add Route "+basePath+path.pattern+", method "+expressMethod.toUpperCase());
        this._gatewayServer[expressMethod](expressPath, (req, res) => {
            try {
                this._currentResponse = res;
                let childProcess = require('child_process');
                let parent = childProcess.fork(__dirname+'/lib/handler');
                if (this.validRequest(method, req)) {
                    let request = this.getRequest(path, method, req);
                    parent.send(request);
                    parent.on('message', (message) =>{
                        this.processHandlerResponse(method, req, res, message);
                    });
                }
                else {
                    this.sendHttpErrorUnsupportedType(res);
                }
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
        for(let index in this._openApiConfig.paths) {
            this.configureRoutePath(this._openApiConfig.paths[index]);
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
        this._openApiConfig.loadFile(this._swaggerFile);
    }

}

let apiGatewaySim = new ApiGatewaySim();
