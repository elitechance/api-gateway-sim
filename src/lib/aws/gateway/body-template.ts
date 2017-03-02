/**
 *
 * Created by Ethan Dave B. Gomez on 3/2/17.
 */

import Velocity = require('velocityjs');
import Util from "./util";
import Input from "./input";

export default class BodyTemplate {
    private _context;
    private _payload;
    private _headers;
    private _queryParams;
    private _pathParams;
    private _method;
    private _stageVariables;

    private getInput() {
        let input = new Input();
        input.paramsHeader = this.headers;
        input.paramsQueryString = this.queryParams;
        input.paramsPath = this.pathParams;
        input.body = this.payload;
        return input;
    }

    parse(template:string):any {
        let context = {context:{httpMethod:''},util:null,input:null, stageVariables:null};
        context.stageVariables = this.stageVariables;
        context.context = Object.assign(context.context, this.context);
        context.context.httpMethod = this.method;
        context.util = new Util();
        context.input = this.getInput();
        let parsed = Velocity.parse(template);
        let Compile = Velocity.Compile;
        let compiler = new Compile(parsed);
        let compiled = compiler.render(context, (error, rendered) => {
            console.log(error, rendered);
        });
        return compiled;
    }

    get context() {
        return this._context;
    }

    set context(value) {
        this._context = value;
    }

    get payload() {
        return this._payload;
    }

    set payload(value) {
        this._payload = value;
    }

    get headers() {
        return this._headers;
    }

    set headers(value) {
        this._headers = value;
    }

    get queryParams() {
        return this._queryParams;
    }

    set queryParams(value) {
        this._queryParams = value;
    }

    get pathParams() {
        return this._pathParams;
    }

    set pathParams(value) {
        this._pathParams = value;
    }

    get method() {
        return this._method;
    }

    set method(value) {
        this._method = value;
    }

    get stageVariables() {
        return this._stageVariables;
    }

    set stageVariables(value) {
        this._stageVariables = value;
    }
}
