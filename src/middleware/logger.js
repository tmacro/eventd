const { logger } = require('../utils');

const _log = logger.get_child('context:request')

async function loggerMiddleware(req, res, next) {
    // eslint-disable-next-line no-param-reassign
    req.logger = _log.with_fields({
        httpMethod: req.method,
        httpURL: req.originalUrl,
    });
    req.logger.info('Received request');
    next();
}

function initLoggerMiddleware(app, callback) {
    app.use(loggerMiddleware);
    return callback();
}


module.exports = {
    loggerMiddleware,
    initLoggerMiddleware,
};
