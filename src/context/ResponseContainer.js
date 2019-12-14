const assert = require('assert');

/**
 * A simple container for response data
 */
class ResponseContainer {
    constructor() {
        this._statusCode = undefined;
        this._body = undefined;
        this._redirect = undefined;
    }

    getBody() {
        return this._body;
    }

    setBody(data) {
        this._body = data;
        return this;
    }

    hasBody() {
        return this._body !== undefined;
    }

    getStatusCode() {
        return this._statusCode;
    }

    setStatusCode(code) {
        // minimum HTTP status code is 100
        assert(Number.isInteger(code) && code >= 100);
        this._statusCode = code;
        return this;
    }

    hasStatusCode() {
        return this._statusCode !== undefined;
    }

    getRedirectURL() {
        return this._redirect;
    }

    setRedirectURL(url) {
        assert(typeof url === 'string');
        this._redirect = url;
        return this;
    }

    hasRedirect() {
        return this._redirect !== undefined;
    }
}

module.exports = ResponseContainer;