const Joi = require('@hapi/joi');

const redisServerSchema = Joi.object({
    db: Joi.string().default('eventd'),
    host: Joi.string().default('localhost'),
    port: Joi.number().default(6379),
    password: Joi.string(),
});

const redisSentinelSchema = Joi.object({
    name: Joi.string().default('eventd'),
    sentinels: Joi.array().items(Joi.string()),
    sentinelPassword: Joi.string().default('').allow(''),
});

const joiSchema = Joi.object({
    port: Joi.number().port().default(8000),
    development: Joi.boolean().default(false),
    logging: Joi.object({
        level: Joi.alternatives()
            .try('critical', 'error', 'warning', 'info', 'debug', 'trace'),
    }).default({
        level: 'debug',
    }),
    redis: Joi.alternatives().try(redisServerSchema, redisSentinelSchema)
});

module.exports = joiSchema;