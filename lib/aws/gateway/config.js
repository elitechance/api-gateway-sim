/**
 *
 * Created by Ethan Dave B. Gomez on 3/2/17.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Yaml = require("js-yaml");
var fs = require("fs");
var path_1 = require("./config/path");
var method_1 = require("./config/path/method");
var response_1 = require("./config/path/method/response");
var integration_1 = require("./config/path/method/integration");
var response_2 = require("./config/path/method/integration/response");
var parameter_1 = require("./config/path/method/integration/response/parameter");
var template_1 = require("./config/path/method/integration/response/request/template");
var info_1 = require("./config/info");
var Config = (function () {
    function Config() {
        this._paths = [];
        this._schemes = [];
        this._info = new info_1.default();
    }
    Config.throwError = function (message) {
        throw new Error(message);
    };
    Config.prototype.parsePathMethodResponse = function (method, responseValue, response) {
        var pathMethodResponse = new response_1.default();
        pathMethodResponse.statusCode = parseInt(responseValue);
        pathMethodResponse.description = response.description;
        pathMethodResponse.schema = response.schema;
        for (var header in response.headers) {
            pathMethodResponse.headers.push(header);
        }
        method.responses.push(pathMethodResponse);
    };
    Config.prototype.parsePathMethodIntegrationResponse = function (responses, pattern, response) {
        var classResponse = new response_2.default();
        classResponse.pattern = pattern;
        classResponse.statusCode = parseInt(response['statusCode']);
        for (var responseParameter in response.responseParameters) {
            var classResponseParameter = new parameter_1.default();
            classResponseParameter.header = responseParameter;
            classResponseParameter.value = response.responseParameters[responseParameter];
            classResponse.responseParameters.push(classResponseParameter);
        }
        responses.push(classResponse);
    };
    Config.prototype.parsePathMethodIntegration = function (classIntegration, integration) {
        classIntegration.passthroughBehavior = integration.passthroughBehavior;
        classIntegration.type = integration.type;
        classIntegration.httpMethod = integration.httpMethod;
        classIntegration.uri = integration.uri;
        classIntegration.contentHandling = integration.contentHandling;
        for (var response in integration.responses) {
            this.parsePathMethodIntegrationResponse(classIntegration.responses, response, integration.responses[response]);
        }
        for (var contentType in integration.requestTemplates) {
            var classRequestTemplate = new template_1.default();
            classRequestTemplate.contentType = contentType;
            classRequestTemplate.template = integration.requestTemplates[contentType];
            classIntegration.requestTemplates.push(classRequestTemplate);
        }
    };
    Config.prototype.parsePathMethod = function (path, methodName, method) {
        var classMethod = new method_1.default();
        classMethod.name = methodName;
        classMethod.consumes = method.consumes;
        classMethod.produces = method.produces;
        path.methods.push(classMethod);
        for (var response in method.responses) {
            this.parsePathMethodResponse(classMethod, response, method.responses[response]);
        }
        classMethod.integration = new integration_1.default();
        this.parsePathMethodIntegration(classMethod.integration, method['x-amazon-apigateway-integration']);
    };
    Config.prototype.parsePath = function (path) {
        var pathObject = this.jsonConfig['paths'][path];
        var configPath = new path_1.default();
        configPath.value = path;
        for (var method in pathObject) {
            this.parsePathMethod(configPath, method, this.jsonConfig['paths'][path][method]);
        }
        this.paths.push(configPath);
    };
    Config.prototype.parseJsonConfig = function () {
        this.basePath = this.jsonConfig['basePath'];
        this.schemes = this.jsonConfig['schemes'];
        this.host = this.jsonConfig['host'];
        this.swaggerVersion = this.jsonConfig['swagger'];
        if (this.jsonConfig['info']) {
            this.info.version = this.jsonConfig['info'].version;
            this.info.title = this.jsonConfig['info'].title;
        }
        for (var path in this.jsonConfig['paths']) {
            this.parsePath(path);
        }
    };
    Config.prototype.loadFile = function (file) {
        this.file = file;
        try {
            if (file.match(/\.json$/)) {
                var configJson = fs.readFileSync(file, 'utf8');
                this.jsonConfig = JSON.parse(configJson);
            }
            else if (file.match(/\.yaml$/)) {
                var configJson = fs.readFileSync(file, 'utf8');
                this.jsonConfig = Yaml.safeLoad(configJson);
            }
            else if (file.match(/\.yml$/)) {
                var configJson = fs.readFileSync(file, 'utf8');
                this.jsonConfig = Yaml.safeLoad(configJson);
            }
            if (!this.jsonConfig) {
                Config.throwError("Unable to open config file " + file);
            }
            this.parseJsonConfig();
        }
        catch (error) {
            Config.throwError("Unable to open swagger file " + this.file + "\nError: " + JSON.stringify(error));
        }
    };
    Object.defineProperty(Config.prototype, "file", {
        get: function () {
            return this._file;
        },
        set: function (value) {
            this._file = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "jsonConfig", {
        get: function () {
            return this._jsonConfig;
        },
        set: function (value) {
            this._jsonConfig = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "paths", {
        get: function () {
            return this._paths;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "basePath", {
        get: function () {
            return this._basePath;
        },
        set: function (value) {
            this._basePath = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "host", {
        get: function () {
            return this._host;
        },
        set: function (value) {
            this._host = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "schemes", {
        get: function () {
            return this._schemes;
        },
        set: function (value) {
            this._schemes = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "info", {
        get: function () {
            return this._info;
        },
        set: function (value) {
            this._info = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Config.prototype, "swaggerVersion", {
        get: function () {
            return this._swaggerVersion;
        },
        set: function (value) {
            this._swaggerVersion = value;
        },
        enumerable: true,
        configurable: true
    });
    return Config;
}());
exports.default = Config;
