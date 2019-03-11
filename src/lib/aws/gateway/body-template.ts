/**
 *
 * Created by Ethan Dave B. Gomez on 3/2/17.
 */

import Velocity = require('velocityjs');
import Util from './util';
import Input from './input';

export default class BodyTemplate {
  private _context;

  get context() {
    return this._context;
  }

  set context(value) {
    this._context = value;
  }

  private _payload;

  get payload() {
    return this._payload;
  }

  set payload(value) {
    this._payload = value;
  }

  private _headers;

  get headers() {
    return this._headers;
  }

  set headers(value) {
    this._headers = value;
  }

  private _queryParams;

  get queryParams() {
    return this._queryParams;
  }

  set queryParams(value) {
    this._queryParams = value;
  }

  private _pathParams;

  get pathParams() {
    return this._pathParams;
  }

  set pathParams(value) {
    this._pathParams = value;
  }

  private _method;

  get method() {
    return this._method;
  }

  set method(value) {
    this._method = value;
  }

  private _stageVariables;

  get stageVariables() {
    return this._stageVariables;
  }

  set stageVariables(value) {
    this._stageVariables = value;
  }

  public multiValueHeaders: any = {};

  public multiValueQueryStringParameters: any = {};

  parse(template: string): any {
    const context = {
      context: { httpMethod: '' },
      util: null,
      input: null,
      stageVariables: null
    };
    context.stageVariables = this.stageVariables;
    context.context = Object.assign(context.context, this.context);
    context.context.httpMethod = this.method;
    context.util = new Util();
    context.input = this.getInput();
    const parsed = Velocity.parse(template);
    const Compile = Velocity.Compile;
    const compiler = new Compile(parsed);
    return compiler.render(context, (error, rendered) => {
      console.log(error, rendered);
    });
  }

  private getInput() {
    const input = new Input();
    input.paramsHeader = this.headers;
    input.paramsQueryString = this.queryParams;
    input.paramsPath = this.pathParams;
    input.body = this.payload;
    return input;
  }
}
