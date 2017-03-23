"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
var AppComponent = (function () {
    function AppComponent(http) {
        this.http = http;
        this.eventValueValid = true;
        this.menus = [
            { id: 1, name: "Headers", active: false, error: false },
            { id: 2, name: "Body", active: false, error: false },
            { id: 3, name: "StageVariables", active: false, error: false },
            { id: 4, name: "Context", active: false, error: false },
            { id: 5, name: "QueryParams", active: false, error: false },
            { id: 6, name: "PathParams", active: false, error: false }
        ];
        this.jsonOptions = {
            lineNumbers: true,
            mode: { name: 'javascript', json: true },
            smartIndent: true,
            indentUnit: 4
        };
        this.velocityOptions = {
            lineNumbers: true,
            mode: { name: 'velocity' },
            smartIndent: true,
            indentUnit: 4
        };
    }
    AppComponent.prototype.onChangeMenu = function (menu) {
        this.activeMenu = menu.id;
        this.parseEditorById(menu.id);
    };
    AppComponent.prototype.getMenuById = function (id) {
        return this.menus.find(function (menu) { return menu.id == id; });
    };
    AppComponent.prototype.parseEditor = function (menuId, editor) {
        try {
            var value = editor.getValue();
            JSON.parse(value);
            this.syntaxError = '';
            this.getMenuById(menuId).error = false;
        }
        catch (error) {
            this.syntaxError = this.getMenuById(menuId).name + ': Syntax error';
            this.getMenuById(menuId).error = true;
        }
    };
    AppComponent.prototype.parseEditorById = function (id) {
        switch (id) {
            case 1:
                this.parseEditor(id, this.editorHeaders);
                break;
            case 2:
                this.parseEditor(id, this.editorBody);
                break;
            case 3:
                this.parseEditor(id, this.editorStageVariables);
                break;
            case 4:
                this.parseEditor(id, this.editorContext);
                break;
            case 5:
                this.parseEditor(id, this.editorQueryParams);
                break;
            case 6:
                this.parseEditor(id, this.editorPathParams);
                break;
        }
    };
    AppComponent.prototype.onChangeEditors = function (editor, change, menuId) {
        try {
            JSON.parse(editor.getValue());
            this.syntaxError = '';
            this.getMenuById(menuId).error = false;
            this.parseTemplate();
        }
        catch (error) {
            this.getMenuById(menuId).error = true;
            this.syntaxError = this.getMenuById(menuId).name + ': Syntax error';
        }
    };
    AppComponent.prototype.initEditorHeaders = function () {
        var _this = this;
        this.editorHeaders = CodeMirror.fromTextArea(this.elementHeader.nativeElement, this.jsonOptions);
        var headerValue = '{\n\t"content-type":"application/json"\n}';
        this.editorHeaders.setValue(headerValue);
        this.editorHeaders.on('change', function (editor, change) {
            _this.onChangeEditors(editor, change, 1);
        });
    };
    AppComponent.prototype.initEditorBody = function () {
        var _this = this;
        this.editorBody = CodeMirror.fromTextArea(this.elementBody.nativeElement, this.jsonOptions);
        var value = '{\n\t"key1":"value1",\n\t"key2":"value2",\n\t"key3":"value3"\n}';
        this.editorBody.setValue(value);
        this.editorBody.on('change', function (editor, change) {
            _this.onChangeEditors(editor, change, 2);
        });
    };
    AppComponent.prototype.initEditorStageVariables = function () {
        var _this = this;
        this.editorStageVariables = CodeMirror.fromTextArea(this.elementStageVariables.nativeElement, this.jsonOptions);
        var value = '{\n\t"name":"dev"\n}';
        this.editorStageVariables.setValue(value);
        this.editorStageVariables.on('change', function (editor, change) {
            _this.onChangeEditors(editor, change, 3);
        });
    };
    AppComponent.prototype.initEditorContext = function () {
        var _this = this;
        this.editorContext = CodeMirror.fromTextArea(this.elementContext.nativeElement, this.jsonOptions);
        var value = '{\n\t"httpMethod":"GET"\n}';
        this.editorContext.setValue(value);
        this.editorContext.on('change', function (editor, change) {
            _this.onChangeEditors(editor, change, 4);
        });
    };
    AppComponent.prototype.initEditorQueryParams = function () {
        var _this = this;
        this.editorQueryParams = CodeMirror.fromTextArea(this.elementQueryParams.nativeElement, this.jsonOptions);
        var value = '{\n\t"param1":"value1"\n}';
        this.editorQueryParams.setValue(value);
        this.editorQueryParams.on('change', function (editor, change) {
            _this.onChangeEditors(editor, change, 5);
        });
    };
    AppComponent.prototype.initEditorPathParams = function () {
        var _this = this;
        this.editorPathParams = CodeMirror.fromTextArea(this.elementPathParams.nativeElement, this.jsonOptions);
        var value = '{\n\t"id":"1"\n}';
        this.editorPathParams.setValue(value);
        this.editorPathParams.on('change', function (editor, change) {
            _this.onChangeEditors(editor, change, 6);
        });
    };
    AppComponent.prototype.getBodyTemplates = function () {
        var templates = [
            {
                id: 1, name: "Mini",
                value: '{\n\t"method":"$context.httpMethod",\n\t"body":$input.json(\'$\')\n}'
            },
            {
                id: 2, name: "Common",
                value: '{\n\t"method": "$context.httpMethod",\n\t"body" : $input.json(\'$\'),  ' +
                    '\n\t"headers": {\n\t   #foreach($param in $input.params().header.keySet()) ' +
                    '\n\t   "$param": "$util.escapeJavaScript($input.params().header.get($param))" #if($foreach.hasNext),#end #end }, ' +
                    '\n\t"queryParams": { #foreach($param in $input.params().querystring.keySet()) ' +
                    '\n\t   "$param": "$util.escapeJavaScript($input.params().querystring.get($param))" ' +
                    '#if($foreach.hasNext),#end #end }, ' +
                    '\n\t"pathParams": { #foreach($param in $input.params().path.keySet()) ' +
                    '\n\t   "$param": "$util.escapeJavaScript($input.params().path.get($param))" #if($foreach.hasNext),#end #end }\n}'
            },
            {
                id: 3, name: "Passthrough example",
                value: '##  See http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html' +
                    '\n## This template will pass through all parameters including path, querystring, header, stage variables, and context through to the integration endpoint via the body/payload ' +
                    '\n#set($allParams = $input.params()) {' +
                    '\n"body-json" : $input.json(\'$\'), ' +
                    '\n"params" : {' +
                    '\n  #foreach($type in $allParams.keySet()) ' +
                    '\n  #set($params = $allParams.get($type)) "$type" : { ' +
                    '\n    #foreach($paramName in $params.keySet()) ' +
                    '\n    "$paramName" : "$util.escapeJavaScript($params.get($paramName))" #if($foreach.hasNext),#end #end } ' +
                    '\n    #if($foreach.hasNext),#end #end },' +
                    '\n"stage-variables" : { #foreach($key in $stageVariables.keySet()) ' +
                    '\n  "$key" : "$util.escapeJavaScript($stageVariables.get($key))" #if($foreach.hasNext),#end #end }, ' +
                    '\n"context" : { ' +
                    '\n   "account-id" : "$context.identity.accountId", ' +
                    '\n   "api-id" : "$context.apiId", ' +
                    '\n   "api-key" : "$context.identity.apiKey", ' +
                    '\n   "authorizer-principal-id" : "$context.authorizer.principalId", ' +
                    '\n   "caller" : "$context.identity.caller", ' +
                    '\n   "cognito-authentication-provider" : "$context.identity.cognitoAuthenticationProvider", ' +
                    '\n   "cognito-authentication-type" : "$context.identity.cognitoAuthenticationType", ' +
                    '\n   "cognito-identity-id" : "$context.identity.cognitoIdentityId",' +
                    '\n   "cognito-identity-pool-id" : "$context.identity.cognitoIdentityPoolId", ' +
                    '\n   "http-method" : "$context.httpMethod", ' +
                    '\n   "stage" : "$context.stage", ' +
                    '\n   "source-ip" : "$context.identity.sourceIp", ' +
                    '\n   "user" : "$context.identity.user", ' +
                    '\n   "user-agent" : "$context.identity.userAgent", ' +
                    '\n   "user-arn" : "$context.identity.userArn", ' +
                    '\n   "request-id" : "$context.requestId", ' +
                    '\n   "resource-id" : "$context.resourceId", ' +
                    '\n   "resource-path" : "$context.resourcePath" } \n} '
            }
        ];
        return templates;
    };
    AppComponent.prototype.getTemplateById = function (id) {
        var templates = this.getBodyTemplates();
        return templates.find(function (template) { return template.id == id; });
    };
    AppComponent.prototype.getTemplateValueById = function (id) {
        var template = this.getTemplateById(id);
        return template.value;
    };
    AppComponent.prototype.initEditorTemplate = function () {
        var _this = this;
        this.editorTemplate = CodeMirror.fromTextArea(this.elementTemplate.nativeElement, this.velocityOptions);
        var value = this.getTemplateValueById(this.getBodyTemplates()[0].id);
        this.editorTemplate.setValue(value);
        this.editorTemplate.on('change', function (editor, change) {
            _this.parseTemplate();
        });
    };
    AppComponent.prototype.initEditorOutput = function () {
        var options = Object['assign']({ readOnly: true }, this.jsonOptions); // merge
        this.editorOutput = CodeMirror.fromTextArea(this.elementOutput.nativeElement, options);
    };
    AppComponent.prototype.initEditors = function () {
        this.initEditorBody();
        this.initEditorContext();
        this.initEditorStageVariables();
        this.initEditorHeaders();
        this.initEditorQueryParams();
        this.initEditorPathParams();
        this.initEditorTemplate();
        this.initEditorOutput();
    };
    AppComponent.prototype.getRequest = function () {
        var headers = JSON.parse(this.editorHeaders.getValue());
        var context = JSON.parse(this.editorContext.getValue());
        var stageVariables = JSON.parse(this.editorStageVariables.getValue());
        var queryParams = JSON.parse(this.editorQueryParams.getValue());
        var pathParams = JSON.parse(this.editorPathParams.getValue());
        var body = JSON.parse(this.editorBody.getValue());
        var template = this.editorTemplate.getValue();
        return {
            headers: headers,
            context: context,
            stageVariables: stageVariables,
            queryParams: queryParams,
            pathParams: pathParams,
            body: body,
            template: template
        };
    };
    AppComponent.prototype.logInfo = function (message) {
        console.log(message);
    };
    AppComponent.prototype.contentClean = function () {
        for (var i = 0; i < this.menus.length; i++) {
            if (this.menus[i].error) {
                return false;
            }
        }
        return true;
    };
    AppComponent.prototype.validateEventValue = function (value) {
        try {
            JSON.parse(value);
            this.eventValueValid = true;
        }
        catch (error) {
            this.eventValueValid = false;
        }
    };
    AppComponent.prototype.parseTemplate = function () {
        var _this = this;
        if (!this.contentClean()) {
            return;
        }
        try {
            var request = this.getRequest();
            this.http.post('/parse', request).subscribe(function (response) {
                _this.editorOutput.setValue(response.text());
                _this.validateEventValue(response.text());
            });
        }
        catch (error) {
            console.log("error parsing", error);
        }
    };
    AppComponent.prototype.onChooseTemplate = function (template) {
        this.editorTemplate.setValue(template.value);
    };
    AppComponent.prototype.ngOnInit = function () {
        this.bodyTemplates = this.getBodyTemplates();
        this.initEditors();
        this.parseTemplate();
        this.activeMenu = this.menus[0].id;
    };
    return AppComponent;
}());
__decorate([
    core_1.ViewChild('elementHeader'),
    __metadata("design:type", core_1.ElementRef)
], AppComponent.prototype, "elementHeader", void 0);
__decorate([
    core_1.ViewChild('elementBody'),
    __metadata("design:type", Object)
], AppComponent.prototype, "elementBody", void 0);
__decorate([
    core_1.ViewChild('elementStageVariables'),
    __metadata("design:type", Object)
], AppComponent.prototype, "elementStageVariables", void 0);
__decorate([
    core_1.ViewChild('elementContext'),
    __metadata("design:type", Object)
], AppComponent.prototype, "elementContext", void 0);
__decorate([
    core_1.ViewChild('elementQueryParams'),
    __metadata("design:type", Object)
], AppComponent.prototype, "elementQueryParams", void 0);
__decorate([
    core_1.ViewChild('elementPathParams'),
    __metadata("design:type", Object)
], AppComponent.prototype, "elementPathParams", void 0);
__decorate([
    core_1.ViewChild('elementTemplate'),
    __metadata("design:type", Object)
], AppComponent.prototype, "elementTemplate", void 0);
__decorate([
    core_1.ViewChild('elementOutput'),
    __metadata("design:type", Object)
], AppComponent.prototype, "elementOutput", void 0);
AppComponent = __decorate([
    core_1.Component({
        selector: 'ags-app',
        templateUrl: '/app/app.component.html',
    }),
    __metadata("design:paramtypes", [http_1.Http])
], AppComponent);
exports.AppComponent = AppComponent;
//# sourceMappingURL=app.component.js.map