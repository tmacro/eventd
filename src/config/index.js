const assert = require('assert');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path')

const jsyaml = require('js-yaml');
const Joi = require('@hapi/joi');

const configSchema = require('./config.joi');

const _type_casts = {
    bool: val => truthy.includes(val.toLowerCase()),
    int: val => parseInt(val, 10),
    list: val => val.split(',').map(v => v.trim()),
};

function _load_from_env(key, default_value, type) {
    const envKey = `EVENTD_${key}`;
    const value = process.env[envKey];
    if (value !== undefined) {
        if (type !== undefined) {
            return _type_casts[type](value);
        }
        return value;
    }
    return default_value;
}

class Config extends EventEmitter {
    constructor() {
        super();
        const default_path = path.join(__dirname, '../../config.yaml');
        this._config_path = _load_from_env('CONFIG_PATH', default_path);
        
        // Set all of our expected keys to null;
        this.redis = null;
        this.development = null;
        
        // Load our config
        this._load()
    }

    _load() {
        let config = {};
        try {
            const data = fs.readFileSync(this._config_path, {
                encoding: 'utf-8',
            });
            config = jsyaml.safeLoad(data);
        } catch (err) { }
        const parsedConfig = Joi.attempt(config, configSchema, 'invalid eventd config');

        this.development = _load_from_env('DEV_MODE', parsedConfig.development, 'bool');
        this.redis = config.redis;
    }
}

module.exports = new Config();