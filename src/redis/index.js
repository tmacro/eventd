const Path = require('path')

const ioRedis = require('ioredis');
const { logger } = require('../utils');
const fs = require('fs');

const _log = logger.get_child('redis')

class Redis {
    constructor(options) {
        this._redis = null;
        this._options = {
            reconnectOnError: () => true,
            retryStrategy: times => Math.min(times * 50, 2000),
        };
        Object.assign(this._options, options);
        this._scripts = this._load_scripts();
    }

    _load_script(path) {
        let script_path = Path.join(__dirname, path);
        return fs.readFileSync(script_path, {
            encoding: 'utf-8',
        });
    }

    _load_scripts() {
        return {
            cas: {
                numberOfKeys: 1,
                lua: this._load_script('cas.lua'),
            },
        };
    }

    _install_scripts() {
        Object.keys(this._scripts).forEach(
            (cmd) => this.client.defineCommand(cmd, this._scripts[cmd]));
    }

    async connect() {
        // _log.debug('Connecting to redis...')
        this._redis = new ioRedis(this._options);
        this._redis.on('error',
                err => _log.error('error connecting to redis'))
            .on('connect', () => _log.debug('Connected to redis'));

        this._install_scripts();
        return true;
    }

    async close() {
        if (this._redis) {
            this._redis.disconnect();
            this._reds = null;
        }
    }

    get client() {
        return this._redis;
    }
}

module.exports = Redis;