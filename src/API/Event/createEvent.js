const { Event, scheduler } = require('../../event');

async function createEvent(ctx, params) {
    const event = new Event({
        type: params.body.type,
        url: params.body.url,
        method: params.body.method,
        delay: params.body.delay,
        repeat: params.body.repeat || false,
        data: params.body.data || null,
    });
    await scheduler.add_event(event);
    ctx.results.setStatusCode(200).setBody({ event_id: event.id });
}

module.exports = createEvent;
