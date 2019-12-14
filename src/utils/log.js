const levels = {
    trace: 0,
    debug: 1,
    info: 2,
    warning: 3,
    error: 4,
    critical: 5,
}

const _reversed_levels = Object.keys(levels)
    .reduce((lvls, k) => { lvls[levels[k]] = k; return lvls; }, {});

class Logger {
    constructor(opts) {
        const _opts = opts || {};
        this.name = _opts.name || 'root';
        this.level = _opts.level || levels.debug;
        this.extra_fields = _opts.extra_fields || null;
    }

    _format_err(err) {
        return {  
            code: err.code,
            stack: err.stack
        };
    }

    _format(_level, msg, opts) {
        const level = _reversed_levels[_level];
        const ts = new Date().toISOString();
        const extra = this.extra_fields || {};
        if (opts) Object.assign(extra, opts);
        if (opts && (opts.err || opts.error )) {
            opts.err = this._format_err(opts.err || opts.error);
        }
        return JSON.stringify({
            ...extra,
            level,
            ts,
            msg,
            name: this.name,
        });
    }

    _log(level, msg, opts) {
        process.stderr.write(`${this._format(level, msg, opts)}\n`);
    }

    log(level, msg, opts) {
        if (level >= this.level) {
            this._log(level, msg, opts);
            return true;
        }
        return false;
    }

    trace(msg, opts) {
        return this.log(levels.trace, msg, opts);
    }

    debug(msg, opts) {
        return this.log(levels.debug, msg, opts);
    }

    info(msg, opts) {
        return this.log(levels.info, msg, opts);
    }

    warning(msg, opts) {
        return this.log(levels.warning, msg, opts);
    }

    error(msg, opts) {
        return this.log(levels.error, msg, opts);
    }

    critical(msg, opts) {
        return this.log(levels.critical, msg, opts);
    }

    get_child(_name, fields) {
        const name = this.name !== 'root' ? `${this.name}::${_name}` : _name;
        const extra_fields = fields ? { ...this.extra_fields, ...fields } : this.extra_fields;
        return new Logger({ name, level: this.level, extra_fields });
    }

    with_fields(fields) {
        return new Logger({ name:this.name,
            level: this.level,
            extra_fields: { ...this.extra_fields, ...fields }
        });
    }

    add_default_fields(fields) {
        this.extra_fields = { ...this.extra_fields, ...fields };
    }
}

module.exports = {
    levels,
    Logger,
    root: new Logger(),
};