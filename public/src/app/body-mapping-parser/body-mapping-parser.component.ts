import { Component, ViewChild, OnInit, ElementRef } from '@angular/core';
import { Http } from '@angular/http';

declare let CodeMirror: any;

@Component({
    selector: 'body-mapping-parser',
    templateUrl: '/app/body-mapping-parser/body-mapping-parser.html',
})
export class BodyMappingParserComponent implements OnInit {
    @ViewChild('elementHeader') private elementHeader: ElementRef;
    @ViewChild('elementBody') private elementBody: any;
    @ViewChild('elementStageVariables') private elementStageVariables: any;
    @ViewChild('elementContext') private elementContext: any;
    @ViewChild('elementQueryParams') private elementQueryParams: any;
    @ViewChild('elementPathParams') private elementPathParams: any;

    @ViewChild('elementTemplate') private elementTemplate: any;
    @ViewChild('elementOutput') private elementOutput: any;

    private editorHeaders: any;
    private editorBody: any;
    private editorStageVariables: any;
    private editorContext: any;
    private editorQueryParams: any;
    private editorPathParams: any;

    private editorTemplate: any;
    private editorOutput: any;

    private activeMenu: number;
    private syntaxError: string;
    private bodyTemplates: any;

    private eventValueValid = true;

    private menus = [
        {id: 1, name: 'Headers', active: false, error: false},
        {id: 2, name: 'Body', active: false, error: false},
        {id: 3, name: 'StageVariables', active: false, error: false},
        {id: 4, name: 'Context', active: false, error: false},
        {id: 5, name: 'QueryParams', active: false, error: false},
        {id: 6, name: 'PathParams', active: false, error: false}
    ];

    private jsonOptions = {
        lineNumbers: true,
        mode: {name: 'javascript', json: true},
        smartIndent: true,
        indentUnit: 4
    };

    private velocityOptions = {
        lineNumbers: true,
        mode: {name: 'velocity'},
        smartIndent: true,
        indentUnit: 4
    };

    constructor(private http: Http) {
    }

    ngOnInit(): void {
        this.bodyTemplates = this.getBodyTemplates();
        this.initEditors();
        this.parseTemplate();
        this.activeMenu = this.menus[0].id;
    }

    private onChangeMenu(menu: any) {
        this.activeMenu = menu.id;
        this.parseEditorById(menu.id);
    }

    private getMenuById(id: number) {
        return this.menus.find(menu => menu.id === id);
    }

    private parseEditor(menuId: number, editor: any) {
        try {
            const value = editor.getValue();
            JSON.parse(value);
            this.syntaxError = '';
            this.getMenuById(menuId).error = false;
        } catch (error) {
            this.syntaxError = this.getMenuById(menuId).name + ': Syntax error';
            this.getMenuById(menuId).error = true;
        }
    }

    private parseEditorById(id: number) {
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
    }

    private onChangeEditors(editor: any, change: any, menuId: number) {
        try {
            JSON.parse(editor.getValue());
            this.syntaxError = '';
            this.getMenuById(menuId).error = false;
            this.parseTemplate();
        } catch (error) {
            this.getMenuById(menuId).error = true;
            this.syntaxError = this.getMenuById(menuId).name + ': Syntax error';
        }
    }

    private initEditorHeaders() {
        this.editorHeaders = CodeMirror.fromTextArea(this.elementHeader.nativeElement, this.jsonOptions);
        const headerValue = '{\n\t"content-type":"application/json"\n}';
        this.editorHeaders.setValue(headerValue);
        this.editorHeaders.on('change', (editor: any, change: any) => {
            this.onChangeEditors(editor, change, 1);
        });
    }

    private initEditorBody() {
        this.editorBody = CodeMirror.fromTextArea(this.elementBody.nativeElement, this.jsonOptions);
        const value = '{\n\t"key1":"value1",\n\t"key2":"value2",\n\t"key3":"value3"\n}';
        this.editorBody.setValue(value);
        this.editorBody.on('change', (editor: any, change: any) => {
            this.onChangeEditors(editor, change, 2);
        });
    }

    private initEditorStageVariables() {
        this.editorStageVariables = CodeMirror.fromTextArea(this.elementStageVariables.nativeElement, this.jsonOptions);
        const value = '{\n\t"name":"dev"\n}';
        this.editorStageVariables.setValue(value);
        this.editorStageVariables.on('change', (editor: any, change: any) => {
            this.onChangeEditors(editor, change, 3);
        });
    }

    private initEditorContext() {
        this.editorContext = CodeMirror.fromTextArea(this.elementContext.nativeElement, this.jsonOptions);
        const value = '{\n\t"httpMethod":"GET"\n}';
        this.editorContext.setValue(value);
        this.editorContext.on('change', (editor: any, change: any) => {
            this.onChangeEditors(editor, change, 4);
        });
    }

    private initEditorQueryParams() {
        this.editorQueryParams = CodeMirror.fromTextArea(this.elementQueryParams.nativeElement, this.jsonOptions);
        const value = '{\n\t"param1":"value1"\n}';
        this.editorQueryParams.setValue(value);
        this.editorQueryParams.on('change', (editor: any, change: any) => {
            this.onChangeEditors(editor, change, 5);
        });
    }

    private initEditorPathParams() {
        this.editorPathParams = CodeMirror.fromTextArea(this.elementPathParams.nativeElement, this.jsonOptions);
        const value = '{\n\t"id":"1"\n}';
        this.editorPathParams.setValue(value);
        this.editorPathParams.on('change', (editor: any, change: any) => {
            this.onChangeEditors(editor, change, 6);
        });
    }

    private getBodyTemplates() {
        const templates = [
            {
                id: 1, name: 'Mini',
                value: '{\n\t"method":"$context.httpMethod",\n\t"body":$input.json(\'$\')\n}'
            },
            {
                id: 2, name: 'Common',
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
                id: 3, name: 'Passthrough example',
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
    }

    private getTemplateById(id: number) {
        const templates = this.getBodyTemplates();
        return templates.find(template => template.id === id);
    }

    private getTemplateValueById(id: number) {
        const template = this.getTemplateById(id);
        return template.value;
    }

    private initEditorTemplate() {
        this.editorTemplate = CodeMirror.fromTextArea(this.elementTemplate.nativeElement, this.velocityOptions);
        const value = this.getTemplateValueById(this.getBodyTemplates()[0].id);
        this.editorTemplate.setValue(value);
        this.editorTemplate.on('change', (editor: any, change: any) => {
            this.parseTemplate();
        });
    }

    private initEditorOutput() {
        const options = Object.assign({readOnly: true}, this.jsonOptions); // merge
        this.editorOutput = CodeMirror.fromTextArea(this.elementOutput.nativeElement, options);
    }

    private initEditors() {
        this.initEditorBody();
        this.initEditorContext();
        this.initEditorStageVariables();
        this.initEditorHeaders();
        this.initEditorQueryParams();
        this.initEditorPathParams();
        this.initEditorTemplate();
        this.initEditorOutput();
    }

    private getRequest() {
        const headers = JSON.parse(this.editorHeaders.getValue());
        const context = JSON.parse(this.editorContext.getValue());
        const stageVariables = JSON.parse(this.editorStageVariables.getValue());
        const queryParams = JSON.parse(this.editorQueryParams.getValue());
        const pathParams = JSON.parse(this.editorPathParams.getValue());
        const body = JSON.parse(this.editorBody.getValue());
        const template = this.editorTemplate.getValue();
        return {
            headers: headers,
            context: context,
            stageVariables: stageVariables,
            queryParams: queryParams,
            pathParams: pathParams,
            body: body,
            template: template
        };
    }

    private logInfo(message: string) {
        console.log(message);
    }

    private contentClean(): boolean {
        for (let i = 0; i < this.menus.length; i++) {
            if (this.menus[i].error) {
                return false;
            }
        }
        return true;
    }

    private validateEventValue(value: string) {
        try {
            JSON.parse(value);
            this.eventValueValid = true;
        } catch (error) {
            this.eventValueValid = false;
        }
    }

    private parseTemplate() {
        if (!this.contentClean()) {
            return;
        }
        try {
            const request = this.getRequest();
            this.http.post('/parse', request).subscribe((response) => {
                this.editorOutput.setValue(response.text());
                this.validateEventValue(response.text());
            });
        } catch (error) {
            console.log('error parsing', error);
        }
    }

    private onChooseTemplate(template: any) {
        this.editorTemplate.setValue(template.value);
    }

}

