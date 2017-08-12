/**
 *
 * Created by Ethan Dave B. Gomez on 3/2/17.
 */

import Yaml = require('js-yaml');
import fs = require('fs');
import Path from './path';
import Method from './path/method';
import Response from './path/method/response';
import Integration from './path/method/integration';
import IntegrationResponse from './path/method/integration/response';
import Parameter from './path/method/integration/response/parameter';
import Template from './path/method/integration/response/request/template';
import Info from './info';

export default class OpenApi {
    private _file: string;

    get file(): string {
        return this._file;
    }

    set file(value: string) {
        this._file = value;
    }

    private _jsonConfig: any;

    get jsonConfig(): any {
        return this._jsonConfig;
    }

    set jsonConfig(value: any) {
        this._jsonConfig = value;
    }

    private _paths: Array<Path> = [];

    get paths() {
        return this._paths;
    }

    private _basePath: string;

    get basePath(): string {
        return this._basePath;
    }

    set basePath(value: string) {
        this._basePath = value;
    }

    private _host: string;

    get host(): string {
        return this._host;
    }

    set host(value: string) {
        this._host = value;
    }

    private _schemes: Array<string> = [];

    get schemes(): Array<string> {
        return this._schemes;
    }

    set schemes(value: Array<string>) {
        this._schemes = value;
    }

    private _consumes: Array<string> = [];

    get consumes(): Array<string> {
        return this._consumes;
    }

    set consumes(value: Array<string>) {
        this._consumes = value;
    }

    private _produces: Array<string> = [];

    get produces(): Array<string> {
        return this._produces;
    }

    set produces(value: Array<string>) {
        this._produces = value;
    }

    private _info: Info = new Info();

    get info(): Info {
        return this._info;
    }

    set info(value: Info) {
        this._info = value;
    }

    private _swagger: string;

    get swagger(): string {
        return this._swagger;
    }

    set swagger(value: string) {
        this._swagger = value;
    }

    private static throwError(message) {
        throw new Error(message);
    }

    loadFromJsonString(jsonString: string) {
        this.jsonConfig = JSON.parse(jsonString);
        this.parseJsonConfig();
    }

    loadFromYamlString(yamlString: string) {
        this.jsonConfig = Yaml.safeLoad(yamlString);
        this.parseJsonConfig();
    }

    loadFile(file: string) {
        this.file = file;
        try {
            if (file.match(/\.json$/)) {
                const configJson = fs.readFileSync(file, 'utf8');
                this.jsonConfig = JSON.parse(configJson);
            } else if (file.match(/\.yaml$/)) {
                const configYaml = fs.readFileSync(file, 'utf8');
                this.jsonConfig = Yaml.safeLoad(configYaml);
            } else if (file.match(/\.yml$/)) {
                const configYml = fs.readFileSync(file, 'utf8');
                this.jsonConfig = Yaml.safeLoad(configYml);
            }
            if (!this.jsonConfig) {
                OpenApi.throwError('Unable to open config file ' + file);
            }
            this.parseJsonConfig();
        } catch (error) {
            OpenApi.throwError('Unable to open swagger file ' + this.file + '\nError: ' + JSON.stringify(error));
        }
    }

    private parsePathMethodResponse(method: Method, responseValue: string, response: any) {
        const pathMethodResponse = new Response();
        pathMethodResponse.statusCode = parseInt(responseValue, 10);
        pathMethodResponse.description = response.description;
        pathMethodResponse.schema = response.schema;
        for (const header in response.headers) {
            pathMethodResponse.headers.push(header);
        }
        method.responses.push(pathMethodResponse);
    }

    private parsePathMethodIntegrationResponse(responses: Array<IntegrationResponse>, pattern: string, response: any) {
        const classResponse: IntegrationResponse = new IntegrationResponse();
        classResponse.pattern = pattern;
        classResponse.statusCode = parseInt(response['statusCode'], 10);
        for (const responseParameter in response.responseParameters) {
            const classResponseParameter: Parameter = new Parameter();
            classResponseParameter.header = responseParameter;
            classResponseParameter.value = response.responseParameters[responseParameter];
            classResponse.responseParameters.push(classResponseParameter);
        }
        responses.push(classResponse);
    }

    private parsePathMethodIntegration(classIntegration: Integration, integration: any) {
        if (!integration) {
            return;
        }
        classIntegration.passthroughBehavior = integration.passthroughBehavior;
        classIntegration.type = integration.type;
        classIntegration.httpMethod = integration.httpMethod;
        classIntegration.uri = integration.uri;
        classIntegration.contentHandling = integration.contentHandling;

        for (const response in integration.responses) {
            this.parsePathMethodIntegrationResponse(classIntegration.responses, response, integration.responses[response]);
        }

        for (const contentType in integration.requestTemplates) {
            const classRequestTemplate = new Template();
            classRequestTemplate.contentType = contentType;
            classRequestTemplate.template = integration.requestTemplates[contentType];
            classIntegration.requestTemplates.push(classRequestTemplate);
        }
    }

    private parsePathMethod(path: Path, methodName: string, method: any) {
        const classMethod = new Method();
        classMethod.name = methodName;
        classMethod.consumes = method.consumes;
        classMethod.produces = method.produces;
        path.methods.push(classMethod);
        for (const response in method.responses) {
            this.parsePathMethodResponse(classMethod, response, method.responses[response]);
        }
        classMethod.integration = new Integration();
        this.parsePathMethodIntegration(classMethod.integration, method['x-amazon-apigateway-integration']);
    }

    private parsePath(path: any) {
        const pathObject = this.jsonConfig['paths'][path];
        const configPath = new Path();
        configPath.pattern = path;
        for (const method in pathObject) {
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

        for (const path in this.jsonConfig['paths']) {
            this.parsePath(path);
        }
    }
}
