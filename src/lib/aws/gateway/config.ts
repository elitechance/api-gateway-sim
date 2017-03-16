/**
 *
 * Created by Ethan Dave B. Gomez on 3/2/17.
 */

import Yaml = require('js-yaml');
import fs = require('fs');
import Path from "./config/path";
import PathMethod from "./config/path-method";
import PathMethodResponse from "./config/path-method-response";
import PathMethodIntegration from "./config/path-method-integration";
import PathMethodIntegrationResponse from "./config/path-method-integration-response";
import PathMethodIntegrationResponseParameter from "./config/path-method-integration-response-parameter";
import PathMethodIntegrationResponseRequestTemplate from "./config/path-method-integration-response-request-template";
import ConfigInfo from "./config/info";

export default class Config {
    private _file:string;
    private _jsonConfig:any;
    private _paths:Array<Path> = [];
    private _basePath:string;
    private _host:string;
    private _schemes:Array<string> = [];
    private _info:ConfigInfo = new ConfigInfo();
    private _swaggerVersion:string;

    private static throwError(message) {
        throw new Error(message);
    }

    private parsePathMethodResponse(method:PathMethod, responseValue:string, response:any) {
        let pathMethodResponse = new PathMethodResponse();
        pathMethodResponse.statusCode = parseInt(responseValue);
        pathMethodResponse.description = response.description;
        pathMethodResponse.schema = response.schema;
        for (let header in response.headers) {
            pathMethodResponse.headers.push(header);
        }
        method.responses.push(pathMethodResponse);
    }

    private parsePathMethodIntegrationResponse(responses:Array<PathMethodIntegrationResponse>, pattern:string, response:any) {
        let classResponse:PathMethodIntegrationResponse = new PathMethodIntegrationResponse();
        classResponse.pattern = pattern;
        classResponse.statusCode = parseInt(response['statusCode']);
        for (let responseParameter in response.responseParameters) {
            let classResponseParameter:PathMethodIntegrationResponseParameter = new PathMethodIntegrationResponseParameter();
            classResponseParameter.header = responseParameter;
            classResponseParameter.value = response.responseParameters[responseParameter];
            classResponse.responseParameters.push(classResponseParameter);
        }
        responses.push(classResponse);
    }

    private parsePathMethodIntegration(classIntegration:PathMethodIntegration, integration:any) {
        classIntegration.passthroughBehavior = integration.passthroughBehavior;
        classIntegration.type = integration.type;
        classIntegration.httpMethod = integration.httpMethod;
        classIntegration.uri = integration.uri;
        classIntegration.contentHandling = integration.contentHandling;

        for(let response in integration.responses) {
            this.parsePathMethodIntegrationResponse(classIntegration.responses, response, integration.responses[response]);
        }

        for(let contentType in integration.requestTemplates) {
            let classRequestTemplate = new PathMethodIntegrationResponseRequestTemplate();
            classRequestTemplate.contentType = contentType;
            classRequestTemplate.template = integration.requestTemplates[contentType];
            classIntegration.requestTemplates.push(classRequestTemplate);
        }
    }

    private parsePathMethod(path:Path, methodName:string, method:any) {
        let classMethod = new PathMethod();
        classMethod.name = methodName;
        classMethod.consumes = method.consumes;
        classMethod.produces = method.produces;
        path.methods.push(classMethod);
        for(let response in method.responses) {
            this.parsePathMethodResponse(classMethod, response, method.responses[response]);
        }
        classMethod.integration = new PathMethodIntegration();
        this.parsePathMethodIntegration(classMethod.integration, method['x-amazon-apigateway-integration']);
    }

    private parsePath(path:any) {
        let pathObject = this.jsonConfig['paths'][path];
        let configPath = new Path();
        configPath.value = path;
        for(let method in pathObject) {
            this.parsePathMethod(configPath, method, this.jsonConfig['paths'][path][method]);
        }
        this.paths.push(configPath);
    }

    private parseJsonConfig() {
        this.basePath = this.jsonConfig['basePath'];
        this.schemes = this.jsonConfig['schemes'];
        this.host = this.jsonConfig['host'];
        this.swaggerVersion = this.jsonConfig['swagger'];

        if (this.jsonConfig['info']) {
            this.info.version = this.jsonConfig['info'].version;
            this.info.title = this.jsonConfig['info'].title;
        }

        for (let path in this.jsonConfig['paths']) {
            this.parsePath(path);
        }
    }

    loadFile(file:string) {
        this.file = file;
        try {
            if (file.match(/\.json$/)) {
                let configJson = fs.readFileSync(file, 'utf8');
                this.jsonConfig = JSON.parse(configJson);
            }
            else if (file.match(/\.yaml$/)) {
                let configJson = fs.readFileSync(file, 'utf8');
                this.jsonConfig = Yaml.safeLoad(configJson);
            }
            else if (file.match(/\.yml$/)) {
                let configJson = fs.readFileSync(file, 'utf8');
                this.jsonConfig = Yaml.safeLoad(configJson);
            }
            if (!this.jsonConfig) { Config.throwError("Unable to open config file "+file); }
            this.parseJsonConfig();
        }
        catch (error) {
            Config.throwError("Unable to open swagger file "+this.file+"\nError: "+JSON.stringify(error));
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

    get info(): ConfigInfo {
        return this._info;
    }

    set info(value: ConfigInfo) {
        this._info = value;
    }

    get swaggerVersion(): string {
        return this._swaggerVersion;
    }

    set swaggerVersion(value: string) {
        this._swaggerVersion = value;
    }
}
