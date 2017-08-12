/**
 * Created by EGomez on 3/2/17.
 */

/**
 * Thanks to implementation in https://www.npmjs.com/package/api-gateway-mapping-template
 */

import JsonPath = require('JSONPath');

export default class Input {
    private _body = '';

    get body() {
        return this._body;
    }

    set body(value) {
        this._body = value;
    }

    private _paramsContainer = {
        path: {},
        querystring: {},
        header: {},
    };

    get paramsContainer() {
        return this._paramsContainer;
    }

    set paramsContainer(value) {
        this._paramsContainer = value;
    }

    get paramsPath() {
        return this._paramsContainer.path;
    }

    set paramsPath(value) {
        this._paramsContainer.path = value;
    }

    get paramsQueryString() {
        return this._paramsContainer.querystring;
    }

    set paramsQueryString(value) {
        this._paramsContainer.querystring = value;
    }

    get paramsHeader() {
        return this._paramsContainer.header;
    }

    set paramsHeader(value) {
        this._paramsContainer.header = value;
    }

    path(jsonPath) {
        let obj;
        if (this._body === '') {
            // if payload is empty, treat it as empty object
            //   https://github.com/ToQoz/api-gateway-mapping-template/blob/master/test/_.md#example-91575d0e
            obj = {};
        } else if (/^\s*(?:{|\[|")/.test(this._body)) {
            // if payload starts with `{` or `[` or `"`, treat as JSON
            obj = JSON.parse(this._body);
        } else {
            // treat as string
            obj = this._body;
        }
        if (jsonPath === '$') {
            return obj;
        }
        const results = JsonPath({obj: obj, path: jsonPath});
        if (results && results.length === 1) {
            return results[0];
        }
        return results;
    }

    json(jsonPath) {
        const obj = this.path(jsonPath);
        return JSON.stringify(obj);
    }

    params(name?: string) {
        switch (true) {
            case name === undefined:
                return this._paramsContainer;
            case name in this._paramsContainer.path:
                return this._paramsContainer.path[name];
            case name in this._paramsContainer.querystring:
                return this._paramsContainer.querystring[name];
            case name in this._paramsContainer.header:
                return this._paramsContainer.header[name];
        }
    }
}
