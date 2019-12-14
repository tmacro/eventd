const { apiOperationIds } = require('./spec');
const RequestContext = require('../context/RequestContext');
const errors = require('../errors');
const { logger } = require('../utils');

_log = logger.get_child('api::controller');

class APIController {
    constructor(tag) {
        this._handlers = APIController._collectHandlers(tag);
    }

    static _collectHandlers(tag) {
        return apiOperationIds[tag].reduce(
            (handlers, id) => {
                handlers[id] = APIController._loadOperationHandler(tag, id);
                return handlers;
            }, {},
        );
    }

    static _safeRequire(path) {
        try {
            // eslint-disable-next-line import/no-dynamic-require, global-require
            return require(path);
        } catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                _log.error(`error while loading handler from ${path}`, { error });
                throw error;
            }
            return null;
        }
    }

    static _notImplementedHandler(operationId) {
        return async (ctx, params) => {
            return errors.NotImplemented.customizeDescription(
                `The operation "${operationId}"  has not been implemented`,
            );
        };
    }



    static _loadOperationHandler(tag, operationId) {
        const op = APIController._safeRequire(`./${tag}/${operationId}`);
        if (op === null) {
            return APIController._notImplementedHandler(operationId);
        }
        return op;
    }

    static _extractParams(req) {
        return Object.keys(req.swagger.params)
            .reduce((params, key) => {
                params[key] = req.swagger.params[key].value;
                return params;
            }, {});
    }

    static async _writeResult({results, response, error}) {
        if (error) {
            return error
        }
        // If no results have been set return a 500
        if (!results.hasRedirect() && !results.hasBody() && !results.hasStatusCode()) {
            return errors.InternalError;
        }
        // If we have a redirect, do it
        if (results.hasRedirect()) {
            response.redirect(results.getRedirectURL());
        // If we have both a body & status, send both
        } else if (results.hasBody() && results.hasStatusCode()) {
            response.status(results.getStatusCode()).send(results.getBody());
        // If all we have is a status code, then send it
        } else if (results.hasStatusCode() && !results.hasBody()) {
            response.sendStatus(results.getStatusCode());
        // If no status code is set, but we have a body, assume `200` and send
        } else if (results.hasBody() && !results.hasStatusCode()) {
            response.status(200).send(results.getBody());
        }
        // response.sendStatus(500);
    }

    static _buildRequestContext(req) {
        return new RequestContext(req);
    }

    async _callOperation(operationId, request, response) {
        request.logger.debug(`Calling operation ${operationId}`);
        let error;
        try {
            const error = await this._handlers[operationId](
                request.ctx, APIController._extractParams(request),
            );
            if (error) {
                request.logger.error(`Error during operation ${operationId}`, { error });
            }
        } catch (error) {
            console.log(error)
            request.logger.error(`Error executing operation ${operationId}`, { error });
        }
        return {
            results: request.ctx.results,
            response,
            error,
        };
    }

    /**
     * callOperation
     * Extracts the operationId from the request and calls the matching handler
     *
     * @param {Request} request - Express request object
     * @param {Response} response - Express response object
     * @param {function} next - callback (err, res)
     * @returns {undefined} -
     */
    async callOperation(request, response) {
        request.logger.debug(`Calling operation`);
        request.ctx = APIController._buildRequestContext(request);
        return await this._callOperation(request.ctx.getOperationId(), request, response)
                .then(APIController._writeResult);
    }

    buildMap() {
        return Object.keys(this._handlers)
            .reduce((ops, id) => {
                ops[id] = this.callOperation.bind(this);
                return ops;
            }, {});
    }
}

module.exports = APIController;