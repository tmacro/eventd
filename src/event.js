const { EventEmitter } = require('events');
const Redis = require('./redis');
const uuid = require('uuid');
const config = require('./config');
const { logger } = require('./utils');

const _log = logger.get_child('scheduler')

class Event {
    constructor(data) {
        this.type = null;
        this.id = null;
        this.data = null;
        this.version = null;
        this.url = null;
        this.method = null;
        this.delay = null;
        this.repeat = null;
        if (typeof data === 'object') {
            this.type = data.type || null;
            this.id = data.id || null;
            this.data = data.data || null;
            this.version = data.version || null;
            this.url = data.url || null;
            this.method = data.method || null;
            this.delay = data.delay || null;
            this.repeat = data.repeat || null;
        }
        if (!this.id) {
            this.id = uuid.v4();
        }
    }

    asJSON() {
        return JSON.stringify({
            type: this.type,
            id: this.id,
            data: this.data,
            version: this.version,
            url: this.url,
            method: this.method,
            delay: this.delay,
            repeat: this.repeat,
        });
    }

    static fromJSON(string) {
        return new Event(JSON.parse(string));
    }
}

class Scheduler extends EventEmitter {
    constructor() {
        super();
        this._redis = new Redis(config.redis);
        this._pubsub = new Redis(config.redis);
    }

    async start() {
        await this._redis.connect();
        await this._pubsub.connect();
        await this._pubsub.client.config("set", "notify-keyspace-events", "KEA");
        await this._register_handlers(this._pubsub);
        return true;
    }

    async stop() {
        return await Promise.all([
            this._redis.close(),
            this._pubsub.close(),
        ])
    }

    async _register_handlers(redis) {
        _log.debug(`Subscribing to __keyspace@${config.redis.db}__:events:*:timer:*`)
        try {
            await redis.client.psubscribe(`__keyspace@${config.redis.db}__:events:*:timer:*`);
        } catch (err) {
            _log.error('Error registering handlers', { err });
        }
        _log.debug('Registering event handlers');
        redis.client.on('pmessage', this._on_message.bind(this));
        this.on('event_internal', this._on_event_internal.bind(this));
    }

    _parse_event_channel(channel) {
        const stripped = channel.replace(`__keyspace@${config.redis.db}__:`, '');
        const [ _, id, __, version ] = stripped.split(':');
        return {
            event_id: id, version: Number.parseInt(version, 10)
        };
    }

    _get_event_key(id) {
        return `events:${id}`;
    }

    async _store_event(event) {
        if (!event.id) {
            event.id = uuid.v4();
        }
        const event_key = this._get_event_key(event.id);
        _log.debug('Storing event in redis', { event_key })
        let data;
        if (event instanceof Event) {
            data = event.asJSON();
        } else {
            data = JSON.stringify(event);
        }
        return this._redis.client.set(event_key, data)
            .then(() => this._redis.client.set(`${event_key}:version`, 0));
    }

    async _load_event(id) {
        _log.debug('Loading event', { id });
        const event_key = this._get_event_key(id);
        const event = await this._redis.client.get(event_key);
        if (event) {
            return Event.fromJSON(event);
        }
        return null;
    }

    async _set_event_version(id, current_version, new_version) {
        _log.debug('Setting event version', { id, current_version, new_version });
        const version_key = `${this._get_event_key(id)}:version`;
        return await this._redis.client.cas(version_key, current_version, new_version);
    }

    async _set_timer(id, version, delay) {
        const event_key = `${this._get_event_key(id)}:timer:${version}`;
        _log.debug('Setting timer', { key: event_key, version, delay })
        return this._redis.client.setex(event_key, delay, '1');
    }

    async _claim_event(id, version) {
        _log.debug('Claiming event', { id });
        return this._set_event_version(id, version, version + 1);
    }

    async _cleanup_event(id) {
        _log.debug('Cleaning up event', { id });
        const event_key = this._get_event_key(id);
        return this._redis.client.del(event_key);
    }

    async add_event(event) {
        _log.debug('Registering new event', { event });
        await this._store_event(event);
        await this._set_timer(event.id, 0, event.delay);
    }

    async cancel_task(id) {
        _log.debug('Canceling task', { event_id: id });
        await this._cleanup_event(id);
    }

    _on_message(_, channel, msg) {
        _log.debug('Got event from redis', { channel, data: msg });
        if (msg === 'expired') {
            this.emit('event_internal', this._parse_event_channel(channel));
        }
    }

    async _on_event_internal({event_id, version}) {
        const new_version = await this._claim_event(event_id, version);
        if (new_version !== null) {
            const event = await this._load_event(event_id);
            this.emit('event', event);
            if (event.repeat) {
                _log.debug('Event is marked for repeat, setting new timer', { id: event_id })
                await this._set_timer(event_id, new_version, event.delay);
            } else {
                await this._cleanup_event(event_id);
            }
        }
    }
}

module.exports = {
    Event,
    Scheduler,
    scheduler: new Scheduler(),
}