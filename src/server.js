const http = require('http');

const express = require('express');

const { spec } = require('./API');
const initializeMiddleware = require('./middleware');
const { logger } = require('./utils');
const bodyParser = require('body-parser');
class ApiServer {
    constructor() {
        this._logger = logger.get_child('apiserver');
        this._app = null;
        this._server = null;
        this._https = null;
        this._done = false;
    }

    async _createApp() {
        this._app = express();
        this._app.use(bodyParser.json({ strict: false }));
        await initializeMiddleware(this._app, spec);
        return this._app;
    }

    async _createServer(app) {
        this._server = http.createServer(app);
        return this._server;
    }

    async _startServer(server) {
        await server.listen(8008);
        this._logger.info('Server listening in 8008');
    }

    async start() {
        return this._createApp()
            .then(this._createServer.bind(this))
            .then(this._startServer.bind(this))
    }

    async stop() {
        if (this._server !== null) {
            this._server.close();
        }
        this._done = true;
        return true;
    }
}

module.exports = {
    ApiServer,
    apiserver: new ApiServer(),
};