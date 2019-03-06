/**
 * Created by EGomez on 3/2/17.
 */

/**
 * Thanks to implementation in https://www.npmjs.com/package/api-gateway-mapping-template
 */

export default class Util {
  escapeJavaScriptTable = {
    '"': '\\"', // 2.a
    '\\': '\\\\',
    '\b': '\\b', // 2.b (skip abbrev)
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t'
  };

  base64Encode(srcString) {
    return new Buffer(srcString).toString('base64');
  }

  base64Decode(encodedString) {
    return new Buffer(encodedString, 'base64').toString();
  }

  escapeJavaScript(x) {
    if (!x) {
      return '';
    }
    return x
      .toString()
      .split('')
      .map(c => {
        // 2.a - 2.c
        if (c in this.escapeJavaScriptTable) {
          return this.escapeJavaScriptTable[c];
        }

        // 2.d
        return c;
      })
      .join('');
  }

  parseJson(jsonString) {
    return JSON.parse(jsonString);
  }

  urlEncode(sourceString) {
    return encodeURIComponent(sourceString);
  }

  urlDecode(sourceString) {
    return decodeURIComponent(sourceString);
  }
}
