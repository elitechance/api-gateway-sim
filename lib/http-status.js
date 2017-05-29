"use strict";
/**
 * Created by EGomez on 3/28/17.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var HttpStatus = (function () {
    function HttpStatus() {
    }
    HttpStatus.getCodeByMessage = function (message) {
        for (var code in HttpStatus.CODES) {
            if (HttpStatus.CODES[code] == message) {
                return code;
            }
        }
    };
    HttpStatus.getMessageByCode = function (code) {
        return HttpStatus.CODES[code];
    };
    return HttpStatus;
}());
HttpStatus.CODES = {
    100: 'Continue',
    101: 'Switch Protocols',
    103: 'Checkpoint',
    200: 'Ok',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    300: 'Multiple Choice',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Non Modified',
    306: 'Switch Proxy',
    307: 'Temporary Redirect',
    308: 'Resume Incomplete',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Request Entity Too Large',
    414: 'Request-URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Request Range Not Satisfiable',
    417: 'Expectation Failed',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    511: 'Network Authentication Required'
};
exports.default = HttpStatus;
//# sourceMappingURL=http-status.js.map