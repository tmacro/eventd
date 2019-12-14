const fs = require('fs');
const path = require('path');
const http = require('http');
const jsyaml = require('js-yaml');

const http_methods = http.METHODS.map(i => i.toLowerCase());
const { logger } = require('../utils');

function _loadOpenApiSpec() {
    const spec = fs.readFileSync(path.join(__dirname, '../../openapi.yaml'), 'utf8');
    return jsyaml.safeLoad(spec);
}

function _getApiOperationIds() {
    const spec = _loadOpenApiSpec().paths;
    const optIds = {};
    Object.keys(spec)
        .forEach(path => {
            http_methods.forEach(method => {
                if (spec[path][method] !== undefined) {
                    const tag = spec[path][method]['x-router-controller'];
                    const optId = spec[path][method].operationId;
                    logger.trace('Registering handler', { tag, operationId: optId });
                    if (optIds[tag] === undefined) {
                        optIds[tag] = [optId];
                    } else {
                        optIds[tag].push(optId);
                    }
                }
            });
        });
    return optIds;
}
module.exports = {
    spec: _loadOpenApiSpec(),
    apiOperationIds: _getApiOperationIds(),
};
