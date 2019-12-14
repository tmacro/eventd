const { URL } = require('url');
const assert = require('assert');
const ResponseContainer = require('./ResponseContainer');

class RequestContext {
    /**
     * @param {http.IncomingMessage} req -
     */
    constructor(req) {
        this._request = req;
        const host = req.headers.host || 'localhost';
        this._protocol = RequestContext._determineProtocol(req);
        this._url = new URL(`${this._protocol}://${host}${req.url}`);

        this._serviceName = 'eventd';
        this._operationId = req.swagger.operation.operationId;

        this._clientInfo = {
            address: req.ip,
        };

        this._logger = req.logger;
        this._addDefaultLoggerFields(this._logger);

        this.results = new ResponseContainer();
    }

    static _determineProtocol(req) {
        // Respect the X-Forwarded-Proto header if set
        if (req.headers['x-forwarded-proto']) {
            return req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        }

        // Use req.connection.encrypted for fallback
        return req.connection.encrypted !== undefined
            && req.connection.encrypted ? 'https' : 'http';
    }

    _addDefaultLoggerFields(logger) {
        const info = {
            operationId: this._operationId,
            service: this._serviceName,
        };
        // User is not defined for unauthenticated calls such as `/metadata/endpoints`
        if (this._user) {
            info.tenantId = this._user.getTenantId();
        }
        logger.add_default_fields(info);
    }

    getRequest() {
        return this._request;
    }

    getResponse() {
        return this._request.res;
    }

    getRequestId() {
        return this._requestId;
    }

    getProtocol() {
        return this._protocol;
    }

    getUrl() {
        return this._url;
    }

    getStartTime() {
        return this._startTime;
    }

    getOperationId() {
        return this._operationId;
    }

    setOperationId(operationId) {
        assert(typeof operationId === 'string');
        this._operationId = operationId;
        return this;
    }

    getLogger() {
        return this._logger;
    }

    getClientIp() {
        return this._clientInfo.address;
    }
}

module.exports = RequestContext;