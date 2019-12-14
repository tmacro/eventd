const async = require('async');
const oasTools = require('oas-tools');
const path = require('path');
const config = require('../config');
const { logger } = require('../utils');
const { initErrorMiddleware } = require('./error');
const { initLoggerMiddleware } = require('./logger');

const oasOptions = {
    controllers: path.join(__dirname, '../API/'),
    checkControllers: true,
    loglevel: 'debug',
    customLogger: logger,
    strict: true,
    router: true,
    validator: true,
    docs: {
        apiDocs: '/openapi.json',
        apiDocsPrefix: '',
    },
    oasSecurity: true,
    // securityFile: {
    //     Bearer: authenticateHandler,
    // },
    ignoreUnknownFormats: true,
};

// If in development mode, enable the swagger ui
if (config.development) {
    oasOptions.docs = {
        swaggerUi: '/_/docs',
        swaggerUiPrefix: '',
        ...oasOptions.docs,
    };
}

function initOasMiddleware(app, spec, options, callback) {
    oasTools.configure(options);
    return oasTools.initialize(spec, app, callback);
}

async function initializeMiddleware(app, spec) {
    return new Promise(
        (resolve, reject) => {
            async.series([
                next => initLoggerMiddleware(app, next),
                next => initOasMiddleware(app, spec, oasOptions, next),
                next => initErrorMiddleware(app, next),
            ], err => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve();
                }
            })
    });
}

module.exports = initializeMiddleware;