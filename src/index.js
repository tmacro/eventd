const { scheduler } = require('./event');
const { apiserver } = require('./server');
const requests = require('request-promise-native');

const wait = require('wait-promise');

function _setup_signal_handler(cleanUpFunc) {
    _log.debug('Setting up signal handlers...')
    process.on('SIGINT', cleanUpFunc);
    process.on('SIGHUP', cleanUpFunc);
    process.on('SIGQUIT', cleanUpFunc);
    process.on('SIGTERM', cleanUpFunc);
    process.on('uncaughtException', error => {
        console.error('uncaught exception',
            { error, stack: error.stack.split(os.EOL) });
        return cleanUpFunc();
    });
}

async function handle_event(event) {
    console.log(event);
    const options = {
        uri: event.url,
        method: event.method,
        body: event.method === 'POST' ? event.body : undefined,
    };
    try {
        await requests(options);
    } catch (err) {}
}

async function main() {
    let done = false;
    const check_done = () => done;
    const cleanup = async () => await Promise.all([apiserver.stop(), scheduler.stop()]).then(() => { done = true });
    scheduler.on('event', handle_event);
    await Promise.all([
        scheduler.start(),
        apiserver.start(),
    ]);
    _setup_signal_handler(cleanup);
    await wait.till(check_done);
}

main().then(() => console.log('Exited.'))
