/**
 *
 * Created by Ethan Dave B. Gomez on 3/2/17.
 */

import Yaml = require('js-yaml');
import fs = require('fs');
import Path from "./path";
import Method from "./path/method";
import Response from "./path/method/response";
import Integration from "./path/method/integration";
import IntegrationResponse from "./path/method/integration/response";
import Parameter from "./path/method/integration/response/parameter";
import Template from "./path/method/integration/response/request/template";
import Info from "./info";

export default class OpenApi {
    private _file:string;
    private _jsonConfig:any;
    private _paths:Array<Path> = [];
    private _basePath:string;
    private _host:string;
    private _schemes:Array<string> = [];
    private _consumes:Array<string> = [];
    private _produces:Array<string> = [];
    private _info:Info = new Info();
    private _swagger:string;

    private static throwError(message) {
        throw new Error(message);
    }

    private parsePathMethodResponse(method:Method, responseValue:string, response:any) {
        let pathMethodResponse = new Response();
        pathMethodResponse.statusCode = parseInt(responseValue);
        pathMethodResponse.description = response.description;
        pathMethodResponse.schema = response.schema;
        for (let header in response.headers) {
            pathMethodResponse.headers.push(header);
        }
        method.responses.push(pathMethodResponse);
    }

    private parsePathMethodIntegrationResponse(responses:Array<IntegrationResponse>, pattern:string, response:any) {
        let classResponse:IntegrationResponse = new IntegrationResponse();
        classResponse.pattern = pattern;
        classResponse.statusCode = parseInt(response['statusCode']);
        for (let responseParameter in response.responseParameters) {
            let classResponseParameter:Parameter = new Parameter();
            classResponseParameter.header = responseParameter;
            classResponseParameter.value = response.responseParameters[responseParameter];
            classResponse.responseParameters.push(classResponseParameter);
        }
        responses.push(classResponse);
    }

    private parsePathMethodIntegration(classIntegration:Integration, integration:any) {
        classIntegration.passthroughBehavior = integration.passthroughBehavior;
        classIntegration.type = integration.type;
        classIntegration.httpMethod = integration.httpMethod;
        classIntegration.uri = integration.uri;
        classIntegration.contentHandling = integration.contentHandling;

        for(let response in integration.responses) {
            this.parsePathMethodIntegrationResponse(classIntegration.responses, response, integration.responses[response]);
        }

        for(let contentType in integration.requestTemplates) {
            let classRequestTemplate = new Template();
            classRequestTemplate.contentType = contentType;
            classRequestTemplate.template = integration.requestTemplates[contentType];
            classIntegration.requestTemplates.push(classRequestTemplate);
        }
    }

    private parsePathMethod(path:Path, methodName:string, method:any) {
        let classMethod = new Method();
        classMethod.name = methodName;
        classMethod.consumes = method.consumes;
        classMethod.produces = method.produces;
        path.methods.push(classMethod);
        for(let response in method.responses) {
            this.parsePathMethodResponse(classMethod, response, method.responses[response]);
        }
        classMethod.integration = new Integration();
        this.parsePathMethodIntegration(classMethod.integration, method['x-amazon-apigateway-integration']);
    }

    private parsePath(path:any) {
        let pathObject = this.jsonConfig['paths'][path];
        let configPath = new Path();
        configPath.pattern = path;
        for(let method in pathObject) {
            this.parsePathMethod(configPath, method, this.jsonConfig['paths'][path][method]);
        }
        this.paths.push(configPath);
    }

    private parseJsonConfig() {
        this.basePath = this.jsonConfig['basePath'];
        this.schemes = this.jsonConfig['schemes'];
        this.host = this.jsonConfig['host'];
        this.swagger = this.jsonConfig['swagger'];

        if (this.jsonConfig['info']) {
            this.info.version = this.jsonConfig['info'].version;
            this.info.title = this.jsonConfig['info'].title;
        }

        for (let path in this.jsonConfig['paths']) {
            this.parsePath(path);
        }
    }

    loadFromJsonString(jsonString:string) {
        this.jsonConfig = JSON.parse(jsonString);
        this.parseJsonConfig();
    }

    loadFromYamlString(yamlString:string) {
        this.jsonConfig = Yaml.safeLoad(yamlString);
        this.parseJsonConfig();
    }

    loadFile(file:string) {
        this.file = file;
        try {
            if (file.match(/\.json$/)) {
                let configJson = fs.readFileSync(file, 'utf8');
                this.jsonConfig = JSON.parse(configJson);
            }
            else if (file.match(/\.yaml$/)) {
                let configYaml = fs.readFileSync(file, 'utf8');
                this.jsonConfig = Yaml.safeLoad(configYaml);
            }
            else if (file.match(/\.yml$/)) {
                let configYml = fs.readFileSync(file, 'utf8');
                this.jsonConfig = Yaml.safeLoad(configYml);
            }
            if (!this.jsonConfig) { OpenApi.throwError("Unable to open config file "+file); }
            this.parseJsonConfig();
        }
        catch (error) {
            OpenApi.throwError("Unable to open swagger file "+this.file+"\nError: "+JSON.stringify(error));
        }
    }

    get file(): string {
        return this._file;
    }

    set file(value: string) {
        this._file = value;
    }

    get jsonConfig(): any {
        return this._jsonConfig;
    }

    set jsonConfig(value: any) {
        this._jsonConfig = value;
    }

    get paths() {
        return this._paths;
    }

    get basePath(): string {
        return this._basePath;
    }

    set basePath(value: string) {
        this._basePath = value;
    }

    get host(): string {
        return this._host;
    }

    set host(value: string) {
        this._host = value;
    }

    get schemes(): Array<string> {
        return this._schemes;
    }

    set schemes(value: Array<string>) {
        this._schemes = value;
    }

    get info(): Info {
        return this._info;
    }

    set info(value: Info) {
        this._info = value;
    }

    get swagger(): string {
        return this._swagger;
    }

    set swagger(value: string) {
        this._swagger = value;
    }

    get consumes(): Array<string> {
        return this._consumes;
    }

    set consumes(value: Array<string>) {
        this._consumes = value;
    }

    get produces(): Array<string> {
        return this._produces;
    }

    set produces(value: Array<string>) {
        this._produces = value;
    }
}
